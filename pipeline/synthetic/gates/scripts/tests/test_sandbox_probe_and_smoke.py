import json
import sys

import pytest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import lane_bundle as lb  # noqa: E402
import sandbox_probe as sp  # noqa: E402


def test_probe_refuses_temp_roots_and_places_fixtures_outside_them(tmp_path, monkeypatch):
    with pytest.raises(ValueError, match="temporary directory"):
        sp.prepare(tmp_path)                                   # tmp_path lives under a temp root
    plan = sp.prepare(tmp_path, allow_temp_root=True)          # test-only escape hatch, honestly marked
    assert plan["not_a_valid_boundary_test"] is True
    fake_home = tmp_path / "home"; fake_home.mkdir()
    monkeypatch.setattr(sp.Path, "home", classmethod(lambda cls: fake_home))
    # the fake home is itself under a temp root on this machine, so pretend there are none for the placement check
    monkeypatch.setattr(sp, "_temp_roots", lambda: [])
    plan = sp.prepare(None)
    root = Path(plan["fixture_root"])
    assert root.parent == fake_home / "hpf-sandbox-probe-fixtures" and plan["not_a_valid_boundary_test"] is False
    assert sorted(p.name for p in root.iterdir()) == ["outside", "work"]
    assert 'sandbox_mode="workspace-write"' in plan["probe_command"] and "writable_roots=[]" in plan["probe_command"]
    assert "control_https" in plan["control_command"]
    for forbidden in ("hpfetcher", "gascity", "vaults", "evidence-runs"):
        assert forbidden not in plan["probe_command"] + plan["control_command"]


def test_probe_refuses_overlap_with_production_work_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(sp, "_temp_roots", lambda: [])
    with pytest.raises(ValueError, match="production work_dir"):
        sp.prepare(sp.PRODUCTION_WORK_DIR / "probe")


PROBE_OK = ("cwd=/h/x/work\nread_inside=RC:0|\nread_outside=RC:0|\nwrite_inside=RC:0|\n"
            "write_outside=RC:1|touch: cannot touch '/h/x/outside/probe-written': Permission denied\n"
            "network_https=RC:6|curl: (6) Could not resolve host: example.com\n")
CONTROL_OK = "control_https=RC:0|\n"


def test_parse_matches_expected_only_with_a_successful_network_control():
    rep = sp.parse(PROBE_OK, CONTROL_OK)
    assert rep["verdict"] == "MATCHES_EXPECTED" and rep["complete"] and rep["contradictions"] == []
    assert rep["probes"]["network_https"]["status"] == "DENIED"
    rep = sp.parse(PROBE_OK, "control_https=RC:6|curl: (6) Could not resolve host\n")   # host itself has no network
    assert rep["probes"]["network_https"]["status"] == "INCONCLUSIVE" and rep["verdict"] == "INCONCLUSIVE"
    rep = sp.parse(PROBE_OK, None)
    assert rep["probes"]["network_https"]["status"] == "INCONCLUSIVE"


def test_parse_reports_contradictions_and_errors_distinctly():
    bad = PROBE_OK.replace("write_outside=RC:1|touch: cannot touch '/h/x/outside/probe-written': Permission denied", "write_outside=RC:0|")
    bad = bad.replace("network_https=RC:6|curl: (6) Could not resolve host: example.com", "network_https=RC:0|")
    rep = sp.parse(bad, CONTROL_OK)
    assert rep["verdict"] == "CONTRADICTED" and sorted(rep["contradictions"]) == ["network_https", "write_outside"]
    missing_curl = PROBE_OK.replace("network_https=RC:6|curl: (6) Could not resolve host: example.com", "network_https=RC:127|curl: not found")
    rep = sp.parse(missing_curl, CONTROL_OK)
    assert rep["probes"]["network_https"]["status"] == "ERROR" and rep["verdict"] == "INCONCLUSIVE"
    no_fixture = PROBE_OK.replace("write_outside=RC:1|touch: cannot touch '/h/x/outside/probe-written': Permission denied",
                                  "write_outside=RC:1|touch: cannot touch '/h/x/outside/probe-written': No such file or directory")
    rep = sp.parse(no_fixture, CONTROL_OK)
    assert rep["probes"]["write_outside"]["status"] == "ERROR"          # a missing fixture is not proof of denial
    rep = sp.parse("cwd=/h\n", CONTROL_OK)
    assert not rep["complete"] and rep["verdict"] == "INCONCLUSIVE"


def test_parse_cli_exit_codes(tmp_path):
    import subprocess
    script = Path(sp.__file__)
    (tmp_path / "ok.out").write_text(PROBE_OK); (tmp_path / "ctl.out").write_text(CONTROL_OK)
    assert subprocess.run([sys.executable, str(script), "parse", "--probe-out", str(tmp_path / "ok.out"), "--control-out", str(tmp_path / "ctl.out")],
                          capture_output=True).returncode == 0
    (tmp_path / "bad.out").write_text(PROBE_OK.replace("write_outside=RC:1|touch: cannot touch '/h/x/outside/probe-written': Permission denied", "write_outside=RC:0|"))
    assert subprocess.run([sys.executable, str(script), "parse", "--probe-out", str(tmp_path / "bad.out"), "--control-out", str(tmp_path / "ctl.out")],
                          capture_output=True).returncode == 1        # contradiction fails
    (tmp_path / "inc.out").write_text("cwd=/h\n")
    assert subprocess.run([sys.executable, str(script), "parse", "--probe-out", str(tmp_path / "inc.out")],
                          capture_output=True).returncode == 2        # incomplete is not evidence


def test_smoke_lane_uses_only_the_embedded_fixture_and_writes_nothing_to_the_batch(tmp_path):
    b = tmp_path / "batch"; (b / "candidates").mkdir(parents=True)
    lane = tmp_path / "run" / "lanes" / "smoke"
    files = lb.make_bundle_files(b, "smoke", [lb.SMOKE_UNIT], {"run_id": "r", "lane_id": "smoke", "model": "m"})
    assert set(files) == {"smoke.json", "instructions.md", "report.schema.json", "manifest.json"}
    assert lb.scan_forbidden(files, "smoke") == []
    lb.write_bundle(lane, files)
    assert lb.verify_bundle(b, lane)["files"] == 4
    m = lb.read_manifest(lane)
    (lane / "reports" / "report.json").write_text(json.dumps({
        "schema": "gas-city-evidence-report.v1", "run_id": m["run_id"], "lane_id": m["lane_id"], "lane_class": "smoke",
        "status": "evidence-only", "summary": "ok", "candidate_ids": ["smoke-0001"], "candidate_id": "smoke-0001",
        "answer": "B", "note": "read bundle, wrote report"}))
    report, sha, esc = lb.verify_report(lane)
    assert esc == [] and lb.ingest(b, lane, report, sha, "d", None) == []
    assert sorted(p.name for p in b.iterdir()) == ["candidates"]
    task = " ".join(files["instructions.md"].split("## Contract")[0].lower().split())
    # the reviewer is told NOT to inspect its environment, and is never asked to probe it
    assert "do not inspect or report your working directory, sandbox or host" in task
    assert not any(w in task for w in ("touch ", "curl", "outside the bundle", "writable_roots", "/tmp", "pwd"))


def test_tls_tool_and_timeout_failures_are_not_evidence_of_network_denial():
    """Codex review v4: curl rc 60 (TLS certificate failure) with a successful control must not read as DENIED."""
    tls = PROBE_OK.replace("network_https=RC:6|curl: (6) Could not resolve host: example.com",
                           "network_https=RC:60|curl: (60) SSL certificate problem: unable to get local issuer certificate")
    rep = sp.parse(tls, CONTROL_OK)
    assert rep["probes"]["network_https"]["status"] == "ERROR" and rep["verdict"] == "INCONCLUSIVE" and not rep["complete"]
    for rc in (35, 22, 56):
        rep = sp.parse(PROBE_OK.replace("network_https=RC:6|curl: (6) Could not resolve host: example.com", f"network_https=RC:{rc}|curl: ({rc}) x"), CONTROL_OK)
        assert rep["probes"]["network_https"]["status"] == "ERROR"
    timeout = PROBE_OK.replace("network_https=RC:6|curl: (6) Could not resolve host: example.com", "network_https=RC:28|curl: (28) Connection timed out")
    rep = sp.parse(timeout, CONTROL_OK)
    assert rep["probes"]["network_https"]["status"] == "INCONCLUSIVE"
    connect = PROBE_OK.replace("network_https=RC:6|curl: (6) Could not resolve host: example.com", "network_https=RC:7|curl: (7) Failed to connect")
    assert sp.parse(connect, CONTROL_OK)["probes"]["network_https"]["status"] == "DENIED"


def test_parse_cli_exits_2_on_tls_error(tmp_path):
    import subprocess
    (tmp_path / "tls.out").write_text(PROBE_OK.replace("network_https=RC:6|curl: (6) Could not resolve host: example.com",
                                                        "network_https=RC:60|curl: (60) SSL certificate problem"))
    (tmp_path / "ctl.out").write_text(CONTROL_OK)
    r = subprocess.run([sys.executable, str(Path(sp.__file__)), "parse", "--probe-out", str(tmp_path / "tls.out"), "--control-out", str(tmp_path / "ctl.out")],
                       capture_output=True)
    assert r.returncode == 2


def test_generated_command_sequence_runs_end_to_end_with_inert_stubs(tmp_path, monkeypatch):
    """The plan's three commands are executed as printed, from a DIFFERENT working directory, with a stub
    `codex` and a stub `curl` on PATH (no sandbox, no network): the outputs and the report land at the
    absolute plan-bound paths and the parser reads them from there."""
    import os
    import subprocess
    stubs = tmp_path / "stubs"; stubs.mkdir()
    (stubs / "curl").write_text("#!/bin/sh\nexit 0\n"); (stubs / "curl").chmod(0o755)          # control succeeds
    (stubs / "codex").write_text("#!/bin/sh\n"                                                   # canned sandboxed output
                                 "echo \"cwd=$(pwd)\"\necho 'read_inside=RC:0|'\necho 'read_outside=RC:0|'\necho 'write_inside=RC:0|'\n"
                                 "echo \"write_outside=RC:1|touch: cannot touch '$OUTSIDE/probe-written': Permission denied\"\n"
                                 "echo 'network_https=RC:6|curl: (6) Could not resolve host: example.com'\n")
    (stubs / "codex").chmod(0o755)
    monkeypatch.setattr(sp, "_temp_roots", lambda: [])
    plan = sp.prepare(tmp_path / "fixtures")
    elsewhere = tmp_path / "somewhere-else"; elsewhere.mkdir()
    env = {**os.environ, "PATH": f"{stubs}:{os.environ['PATH']}"}
    for key in ("control_command", "probe_command", "parse_command"):
        r = subprocess.run(["sh", "-c", plan[key]], cwd=elsewhere, env=env, capture_output=True, text=True)
        assert r.returncode == 0, f"{key}: rc={r.returncode}\n{r.stdout}\n{r.stderr}"
    assert Path(plan["control_out"]).read_text().startswith("control_https=RC:0")
    assert Path(plan["probe_out"]).read_text().startswith("cwd=" + plan["work_dir"])
    rep = json.loads(Path(plan["report_out"]).read_text())
    assert rep["verdict"] == "MATCHES_EXPECTED" and rep["cwd"] == plan["work_dir"]
    assert not (elsewhere / "control.out").exists() and not (elsewhere / "probe.out").exists()

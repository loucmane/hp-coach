"""assemble_verdicts.py: explicit ordering, last-wins, and a --check that compares COMPLETE records
(Codex review 2026-09-02, finding 1: identity-only comparison passed a pass->kill edit)."""
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from assemble_verdicts import assemble, compare, file_order  # noqa: E402

SCRIPT = Path(__file__).resolve().parents[1] / "assemble_verdicts.py"


def _w(p: Path, recs) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in recs), encoding="utf-8")


def rec(cid, gate, target, verdict="pass", vote=None, **extra):
    r = {"candidate_id": cid, "gate": gate, "target": target, "verdict": verdict, "findings": [],
         "justification": "j", "executed_by": "t", "date": "2026-09-02", **extra}
    if vote is not None:
        r["vote"] = vote
    return r


def fixture(tmp: Path) -> Path:
    b = tmp / "b"
    _w(b / "verdicts-mech.jsonl", [rec("u1", "M-SCHEMA", "unit")])
    _w(b / "verdicts" / "verdicts-gkey-resolved.jsonl", [rec("u1", "G-KEY", "q:1", vote=1), rec("u1", "G-KEY", "q:1", vote=2)])
    _w(b / "verdicts" / "verdicts-gstem.jsonl", [rec("u1", "G-STEM", "q:1", "kill", findings=["leak"])])
    _w(b / "verdicts" / "verdicts-geng.jsonl", [rec("u1", "G-ENG", "unit", "flag", run=1)])   # legacy target/run
    _w(b / "verdicts" / "verdicts-gstem-r2.jsonl", [rec("u1", "G-STEM", "q:1", "pass")])
    _w(b / "verdicts" / "verdicts-lang-r2.jsonl", [rec("u1", "G-ENG", "passage", "pass", vote=1)])
    return b


def test_order_and_last_wins_and_normalisation(tmp_path):
    b = fixture(tmp_path)
    assert [p.name for p in file_order(b)] == ["verdicts-mech.jsonl", "verdicts-gkey-resolved.jsonl",
                                               "verdicts-gstem.jsonl", "verdicts-geng.jsonl",
                                               "verdicts-gstem-r2.jsonl", "verdicts-lang-r2.jsonl"]
    recs, _ = assemble(b)
    by = {(r["candidate_id"], r["gate"], r["target"], r.get("vote")): r for r in recs}
    assert len(recs) == 5
    assert by[("u1", "G-STEM", "q:1", None)]["verdict"] == "pass"       # r2 superseded the r1 kill
    assert by[("u1", "G-ENG", "passage", 1)]["verdict"] == "pass"       # lang-r2 superseded geng r1
    assert "run" not in by[("u1", "G-ENG", "passage", 1)]                # run -> vote normalised
    assert [r["gate"] for r in recs][-2:] == ["G-STEM", "G-ENG"]         # reinserted at the later round


def test_check_passes_on_reorder_only(tmp_path):
    b = fixture(tmp_path)
    recs, _ = assemble(b)
    res = compare(list(reversed(recs)), recs)
    assert res["record_multiset_identical"] and res["identity_set_identical"] and not res["byte_identical"]


def test_check_fails_when_a_verdict_changes_with_same_identity(tmp_path):
    b = fixture(tmp_path)
    recs, _ = assemble(b)
    tampered = [dict(r) for r in recs]
    tampered[0]["verdict"] = "kill" if tampered[0]["verdict"] == "pass" else "pass"
    res = compare(tampered, recs)
    assert res["identity_set_identical"] is True
    assert res["record_multiset_identical"] is False
    assert len(res["only_in_existing"]) == 1 and len(res["only_in_projection"]) == 1


def test_check_fails_when_only_findings_change(tmp_path):
    b = fixture(tmp_path)
    recs, _ = assemble(b)
    tampered = [dict(r, findings=list(r["findings"]) + ["extra"]) if r["gate"] == "G-KEY" else r for r in recs]
    assert compare(tampered, recs)["record_multiset_identical"] is False


def test_cli_exit_codes(tmp_path):
    b = fixture(tmp_path)
    out = tmp_path / "v.jsonl"
    assert subprocess.run([sys.executable, str(SCRIPT), "--batch-dir", str(b), "--out", str(out)]).returncode == 0
    assert subprocess.run([sys.executable, str(SCRIPT), "--batch-dir", str(b), "--check", str(out)]).returncode == 0
    lines = out.read_text().splitlines()
    r = json.loads(lines[0]); r["verdict"] = "kill"; lines[0] = json.dumps(r, ensure_ascii=False)
    (tmp_path / "bad.jsonl").write_text("\n".join(lines) + "\n")
    assert subprocess.run([sys.executable, str(SCRIPT), "--batch-dir", str(b), "--check", str(tmp_path / "bad.jsonl")]).returncode == 1

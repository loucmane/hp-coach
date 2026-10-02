#!/usr/bin/env python3
"""OPERATOR-SIDE sandbox probe for the evidence-reviewer worker — never a reviewer task.

Codex review v2 finding 6 / v3 finding 2. The reviewer's installed instructions forbid reads
outside its bundle, writes other than its report, and host-state exploration, so the reviewer
must not probe its own sandbox. This script prepares a bounded probe the OPERATOR runs:

  prepare   creates a benign fixture tree and prints the exact command lines. The fixtures live
            OUTSIDE every automatic writable root of codex's workspace-write sandbox: the
            default root is $HOME/hpf-sandbox-probe-fixtures/<id>/ (not /tmp, not $TMPDIR, not
            the agent's production work_dir). `writable_roots=[]` only means "no ADDITIONAL
            roots" — the sandbox still writes to its cwd and to the temporary directories — so a
            fixture under /tmp would prove nothing. A --root under a temporary directory is
            refused unless --allow-temp-root is given, and then the report is marked
            not_a_valid_boundary_test. Production permissions are never changed.
            Two commands are printed: an UNSANDBOXED network control (curl to example.com from
            the operator shell) and the SANDBOXED probe with the agent's exact flags
            (sandbox_mode workspace-write, sandbox_workspace_write.writable_roots=[]), cwd =
            <fixture>/work.
  parse     turns the two outputs into sandbox-probe-report.v1. Every probe is one of
            ALLOWED / DENIED / ERROR / INCONCLUSIVE: a permission error is DENIED; a missing
            file, a missing curl binary, or any other failure is ERROR; a network failure
            inside the sandbox counts as DENIED only when the unsandboxed control succeeded
            AND curl failed at name resolution or connection (curl rc 6 / 7) — a TLS,
            protocol, tool or output error (rc 60, 35, 22, 56, …) is ERROR and a timeout
            (rc 28) is INCONCLUSIVE, because none of those prove the sandbox denied the
            network (Codex review v4). Output paths are absolute and plan-bound: the control
            and probe outputs and the parsed report all live in the fixture directory, so the
            printed parse command works from any working directory. Exit codes: 0 = complete and every probe matches the
            expected boundary; 1 = a CONTRADICTION of the expected boundary (e.g. an outside
            write ALLOWED) — the package's STOP condition; 2 = incomplete / errors /
            inconclusive — not evidence either way.

Expected boundary (what the configuration implies): reads unconfined (inside ALLOWED,
outside ALLOWED), writes confined to the cwd tree (inside ALLOWED, outside DENIED),
network DENIED. The probe never touches project, vault or evidence-run paths.
"""
from __future__ import annotations

import argparse
import json
import os
import shlex
import sys
import tempfile
import uuid
from pathlib import Path

AGENT_FLAGS = ["-c", 'sandbox_mode="workspace-write"', "-c", "sandbox_workspace_write.writable_roots=[]"]
PRODUCTION_WORK_DIR = Path("/home/loucmane/gascity/evidence-runs")
EXPECTED = {"read_inside": "ALLOWED", "read_outside": "ALLOWED", "write_inside": "ALLOWED",
            "write_outside": "DENIED", "network_https": "DENIED"}
PERMISSION_MARKERS = ("Permission denied", "Read-only file system", "Operation not permitted", "EACCES", "EPERM", "EROFS")
NETWORK_DENIAL_CODES = {6, 7}   # curl: could not resolve host / failed to connect — the shapes a blocked network takes

# Each probe prints `<name>=RC:<exit code>|<first line of stderr>` so the parser can classify.
PROBE_LINES = [
    ("cwd", 'echo "cwd=$(pwd)"'),
    ("read_inside", 'o=$(head -c 8 ./canary-inside.txt 2>&1 >/dev/null); echo "read_inside=RC:$?|$o"'),
    ("read_outside", 'o=$(head -c 8 "$OUTSIDE/canary-outside.txt" 2>&1 >/dev/null); echo "read_outside=RC:$?|$o"'),
    ("write_inside", 'o=$(touch ./writable/probe-written 2>&1); echo "write_inside=RC:$?|$o"'),
    ("write_outside", 'o=$(touch "$OUTSIDE/probe-written" 2>&1); echo "write_outside=RC:$?|$o"'),
    ("network_https", 'if command -v curl >/dev/null 2>&1; then o=$(curl -sS -m 6 -o /dev/null https://example.com 2>&1); echo "network_https=RC:$?|$o"; else echo "network_https=RC:127|curl: not found"; fi'),
]
CONTROL_LINE = 'if command -v curl >/dev/null 2>&1; then o=$(curl -sS -m 6 -o /dev/null https://example.com 2>&1); echo "control_https=RC:$?|$o"; else echo "control_https=RC:127|curl: not found"; fi'


def _temp_roots() -> list[Path]:
    roots = [Path("/tmp"), Path("/var/tmp"), Path(tempfile.gettempdir())]
    for var in ("TMPDIR", "TMP", "TEMP"):
        if os.environ.get(var):
            roots.append(Path(os.environ[var]))
    return [r.resolve() for r in roots]


def _under(p: Path, roots: list[Path]) -> bool:
    rp = p.resolve()
    return any(rp == r or r in rp.parents for r in roots)


def prepare(root: Path | None, allow_temp_root: bool = False) -> dict:
    base = (root or Path.home() / "hpf-sandbox-probe-fixtures").resolve()
    in_temp = _under(base, _temp_roots())
    if in_temp and not allow_temp_root:
        raise ValueError(f"{base} is under a temporary directory, which the sandbox writes to anyway; "
                         "a fixture there cannot test the outside-write boundary (use --root outside temp roots)")
    if _under(base, [PRODUCTION_WORK_DIR]) or _under(PRODUCTION_WORK_DIR, [base]):
        raise ValueError(f"{base} overlaps the agent's production work_dir {PRODUCTION_WORK_DIR}")
    fixture = base / f"probe-{uuid.uuid4().hex[:8]}"
    work, outside = fixture / "work", fixture / "outside"
    (work / "writable").mkdir(parents=True)
    outside.mkdir()
    (work / "canary-inside.txt").write_text("canary-inside\n")
    (outside / "canary-outside.txt").write_text("canary-outside\n")
    script = "; ".join(line for _, line in PROBE_LINES)
    sandboxed = ["codex", "sandbox", *AGENT_FLAGS, "--", "sh", "-c", script]
    control_out, probe_out, report_out = fixture / "control.out", fixture / "probe.out", fixture / "sandbox-probe.json"
    q = lambda x: shlex.quote(str(x))
    return {
        "schema": "sandbox-probe-plan.v1",
        "fixture_root": str(fixture), "work_dir": str(work), "outside_dir": str(outside),
        "control_out": str(control_out), "probe_out": str(probe_out), "report_out": str(report_out),
        "fixture_in_temp_root": in_temp, "not_a_valid_boundary_test": in_temp,
        "control_command": f"OUTSIDE={q(outside)} sh -c {q(CONTROL_LINE)} > {q(control_out)} 2>&1",
        "probe_command": f"cd {q(work)} && OUTSIDE={q(outside)} " + " ".join(q(c) for c in sandboxed) + f" > {q(probe_out)} 2>&1",
        "parse_command": f"python3 {q(Path(__file__).resolve())} parse --probe-out {q(probe_out)} --control-out {q(control_out)} --out {q(report_out)}",
        "expected": EXPECTED,
        "cleanup": f"rm -rf {q(fixture)}",
    }


def _classify(raw: str | None, kind: str, control_ok: bool | None) -> tuple[str, str]:
    """Return (status, detail) for one probe line value 'RC:<code>|<stderr>'."""
    if raw is None or not raw.startswith("RC:"):
        return "ERROR", "probe line missing or malformed"
    code_s, _, msg = raw[3:].partition("|")
    try:
        code = int(code_s)
    except ValueError:
        return "ERROR", f"unparseable exit code {code_s!r}"
    if code == 0:
        return "ALLOWED", msg
    if kind == "network":
        if code == 127 or "not found" in msg:
            return "ERROR", "curl not available inside the sandbox"
        if code not in NETWORK_DENIAL_CODES and code != 28:
            return "ERROR", f"curl rc={code} is a TLS/protocol/tool error, not evidence of network denial: {msg}"
        if control_ok is None:
            return "INCONCLUSIVE", f"curl rc={code} inside the sandbox but no unsandboxed control was supplied"
        if not control_ok:
            return "INCONCLUSIVE", f"curl rc={code} inside the sandbox and the unsandboxed control also failed (host has no network)"
        if code == 28:
            return "INCONCLUSIVE", "curl timed out inside the sandbox; a timeout does not distinguish denial from a slow network"
        return "DENIED", f"curl rc={code} ({'name resolution' if code == 6 else 'connection'} failed) inside the sandbox while the unsandboxed control succeeded"
    if any(m in msg for m in PERMISSION_MARKERS):
        return "DENIED", msg
    return "ERROR", msg or f"rc={code} without a permission error (fixture missing?)"


def parse(probe_out: str, control_out: str | None) -> dict:
    values: dict[str, str] = {}
    for line in probe_out.splitlines():
        if "=" in line:
            k, _, v = line.strip().partition("=")
            values[k] = v
    control_ok: bool | None = None
    control_detail = "no control output supplied"
    if control_out is not None:
        for line in control_out.splitlines():
            if line.startswith("control_https="):
                raw = line.partition("=")[2]
                control_ok = raw.startswith("RC:0")
                control_detail = raw
    probes = {}
    for name, _ in PROBE_LINES:
        if name == "cwd":
            continue
        kind = "network" if name.startswith("network") else ("read" if name.startswith("read") else "write")
        status, detail = _classify(values.get(name), kind, control_ok)
        probes[name] = {"status": status, "detail": detail, "expected": EXPECTED[name]}
    contradictions = [n for n, p in probes.items() if p["status"] in ("ALLOWED", "DENIED") and p["status"] != EXPECTED[n]]
    inconclusive = [n for n, p in probes.items() if p["status"] in ("ERROR", "INCONCLUSIVE")]
    complete = not inconclusive
    verdict = "CONTRADICTED" if contradictions else ("MATCHES_EXPECTED" if complete else "INCONCLUSIVE")
    return {"schema": "sandbox-probe-report.v1", "cwd": values.get("cwd"), "probes": probes,
            "network_control": {"ok": control_ok, "detail": control_detail},
            "contradictions": contradictions, "inconclusive": inconclusive, "complete": complete, "verdict": verdict}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sp = sub.add_parser("prepare"); sp.add_argument("--root", type=Path); sp.add_argument("--allow-temp-root", action="store_true")
    pp = sub.add_parser("parse"); pp.add_argument("--probe-out", required=True, type=Path)
    pp.add_argument("--control-out", type=Path); pp.add_argument("--out", type=Path)
    a = ap.parse_args()
    if a.cmd == "prepare":
        try:
            plan = prepare(a.root, a.allow_temp_root)
        except ValueError as e:
            print(f"sandbox_probe prepare: refused — {e}", file=sys.stderr)
            return 2
        print(json.dumps(plan, indent=1))
        return 0
    rep = parse(a.probe_out.read_text(encoding="utf-8"),
                a.control_out.read_text(encoding="utf-8") if a.control_out else None)
    if a.out:
        a.out.parent.mkdir(parents=True, exist_ok=True)
        a.out.write_text(json.dumps(rep, indent=1), encoding="utf-8")
    print(json.dumps(rep, indent=1))
    if rep["contradictions"]:
        return 1
    return 0 if rep["complete"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

"""Tests for vfinal_fold.py — the deterministic derivation of final_verify.

Run from pipeline/synthetic/gates/scripts:  python3 -m pytest tests/ -q

The V-FINAL verdict must be DERIVABLE from on-disk evidence (resolved G-KEY
lines, G-DISTRACTOR lines, persisted audit JSON) by a script — never written
by an agent. Superseding: a later line for the same (gate, target, vote) in
the same file wins (re-gates append after the lines they supersede).
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from vfinal_fold import fold_unit  # noqa: E402


def _evidence(tmp_path, gkey_lines, gdistr_lines, audit):
    vdir = tmp_path / "v"; vdir.mkdir()
    (vdir / "verdicts-gkey-resolved.jsonl").write_text(
        "".join(json.dumps(l) + "\n" for l in gkey_lines))
    (vdir / "verdicts-gdistractor.jsonl").write_text(
        "".join(json.dumps(l) + "\n" for l in gdistr_lines))
    adir = tmp_path / "audits"; adir.mkdir()
    if audit is not None:
        (adir / "u1.json").write_text(json.dumps(audit))
    return vdir, adir


def _gkey(verdict, vote, **kw):
    return {"candidate_id": "u1", "gate": "G-KEY", "target": "q:1", "vote": vote,
            "verdict": verdict, "findings": [], **kw}


def _gd(verdict):
    return {"candidate_id": "u1", "gate": "G-DISTRACTOR", "target": "q:1",
            "verdict": verdict, "findings": []}


def test_clean_unit_verified(tmp_path):
    vdir, adir = _evidence(tmp_path,
        [_gkey("pass", 1), _gkey("pass", 2)], [_gd("pass")],
        {"candidate_id": "u1", "audit_verdict": "CONFIRMED", "findings": []})
    rec = fold_unit("u1", vdir, adir)
    assert rec["verdict"] == "VERIFIED"


def test_gkey_kill_refutes(tmp_path):
    vdir, adir = _evidence(tmp_path,
        [_gkey("kill", 1), _gkey("pass", 2)], [_gd("pass")],
        {"candidate_id": "u1", "audit_verdict": "CONFIRMED", "findings": []})
    assert fold_unit("u1", vdir, adir)["verdict"] == "REFUTED"


def test_regate_supersedes_earlier_kill(tmp_path):
    # A re-gate appends a pass for the same (gate, target, vote) AFTER the
    # kill it supersedes — the later line must win.
    vdir, adir = _evidence(tmp_path,
        [_gkey("kill", 1), _gkey("pass", 2), _gkey("pass", 1)],
        [_gd("kill"), _gd("flag")],
        {"candidate_id": "u1", "audit_verdict": "CONFIRMED_NOTES",
         "findings": [{"severity": "minor"}]})
    rec = fold_unit("u1", vdir, adir)
    assert rec["verdict"] == "VERIFIED_NOTES"  # kill superseded; flag + notes remain


def test_missing_audit_refutes(tmp_path):
    vdir, adir = _evidence(tmp_path,
        [_gkey("pass", 1), _gkey("pass", 2)], [_gd("pass")], None)
    assert fold_unit("u1", vdir, adir)["verdict"] == "REFUTED"


def test_major_audit_finding_refutes(tmp_path):
    vdir, adir = _evidence(tmp_path,
        [_gkey("pass", 1), _gkey("pass", 2)], [_gd("pass")],
        {"candidate_id": "u1", "audit_verdict": "CONFIRMED_NOTES",
         "findings": [{"severity": "major"}]})
    assert fold_unit("u1", vdir, adir)["verdict"] == "REFUTED"


def test_audit_refuted_refutes(tmp_path):
    vdir, adir = _evidence(tmp_path,
        [_gkey("pass", 1), _gkey("pass", 2)], [_gd("pass")],
        {"candidate_id": "u1", "audit_verdict": "REFUTED", "findings": []})
    assert fold_unit("u1", vdir, adir)["verdict"] == "REFUTED"

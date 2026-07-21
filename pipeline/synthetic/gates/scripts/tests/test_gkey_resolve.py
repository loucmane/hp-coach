"""Tests for gkey_resolve: blind G-KEY solver_answer -> kill/pass vs stored key."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import gkey_resolve as gk  # noqa: E402

KEYS = {("las-b1-001", 1): "B", ("las-b1-001", 2): "A"}


def _v(cid, q, **kw):
    return {"candidate_id": cid, "gate": "G-KEY", "target": f"q:{q}", **kw}


def test_match_is_pass():
    out = gk.resolve(_v("las-b1-001", 1, verdict="pass", solver_answer="B"), KEYS)
    assert out["verdict"] == "pass"


def test_mismatch_becomes_lethal_kill():
    out = gk.resolve(_v("las-b1-001", 1, verdict="pass", solver_answer="C"), KEYS)
    assert out["verdict"] == "kill"
    assert out["findings"][0]["severity"] == "lethal"
    assert "C" in out["findings"][0]["note"] and "B" in out["findings"][0]["note"]


def test_multiple_defensible_self_kill():
    out = gk.resolve(_v("las-b1-001", 2, solver_answer="MULTIPLE_DEFENSIBLE"), KEYS)
    assert out["verdict"] == "kill"
    assert out["findings"][0]["severity"] == "lethal"


def test_existing_kill_passed_through():
    given = _v("las-b1-001", 1, verdict="kill",
               findings=[{"severity": "lethal", "note": "already dead"}])
    out = gk.resolve(given, KEYS)
    assert out["verdict"] == "kill"
    assert out["findings"][0]["note"] == "already dead"


def test_missing_key_flags_not_silently_passes():
    out = gk.resolve(_v("unknown-id", 1, verdict="pass", solver_answer="A"), KEYS)
    assert out["verdict"] == "flag"  # surfaced, never a silent pass


def test_end_to_end_file(tmp_path):
    cand = {
        "candidate_id": "las-b1-001", "section": "LÄS", "family": "x", "title": "t",
        "passage": "p",
        "questions": [
            {"q_index": 1, "prompt": "p1", "key": "B",
             "options": [{"letter": L, "text": L} for L in "ABCD"]},
            {"q_index": 2, "prompt": "p2", "key": "A",
             "options": [{"letter": L, "text": L} for L in "ABCD"]},
        ],
    }
    cdir = tmp_path / "candidates"
    cdir.mkdir()
    (cdir / "las-b1-001.json").write_text(json.dumps(cand), encoding="utf-8")
    vf = tmp_path / "verdicts-gkey-a.jsonl"
    vf.write_text(
        json.dumps(_v("las-b1-001", 1, verdict="pass", solver_answer="B")) + "\n"
        + json.dumps(_v("las-b1-001", 2, verdict="pass", solver_answer="D")) + "\n",
        encoding="utf-8",
    )
    keys = gk.load_keys(cdir)
    lines = [gk.resolve(json.loads(l), keys) for l in vf.read_text().splitlines()]
    assert lines[0]["verdict"] == "pass"          # B == B
    assert lines[1]["verdict"] == "kill"          # D != A

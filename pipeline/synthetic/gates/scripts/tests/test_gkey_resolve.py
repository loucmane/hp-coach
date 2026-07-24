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


def test_resolver_excludes_its_own_output(tmp_path):
    # The input glob 'verdicts-gkey-*.jsonl' matches the resolver's own
    # '-resolved' output; re-running must not re-ingest stale resolved lines
    # (self-inclusion re-emits superseded verdicts AFTER fresh appends and
    # breaks last-wins superseding downstream).
    import json, subprocess, sys
    from pathlib import Path
    cand_dir = tmp_path / "candidates"; cand_dir.mkdir()
    (cand_dir / "u1.json").write_text(json.dumps(
        {"candidate_id": "u1", "questions": [{"q_index": 1, "key": "C"}]}))
    raw = tmp_path / "verdicts-gkey-1.jsonl"
    raw.write_text(json.dumps({"candidate_id": "u1", "gate": "G-KEY", "target": "q:1",
                               "vote": 1, "solver_answer": "C"}) + "\n")
    out = tmp_path / "verdicts-gkey-resolved.jsonl"
    # stale line already in the output file from a previous run
    out.write_text(json.dumps({"candidate_id": "u1", "gate": "G-KEY", "target": "q:1",
                               "vote": 1, "verdict": "kill", "findings": []}) + "\n")
    script = Path(__file__).resolve().parents[1] / "gkey_resolve.py"
    r = subprocess.run([sys.executable, str(script), str(tmp_path / "verdicts-gkey-*.jsonl"),
                        "--candidates-dir", str(cand_dir), "--out", str(out)],
                       capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    lines = [json.loads(l) for l in out.read_text().splitlines() if l.strip()]
    # only the raw line, resolved to pass; the stale kill must NOT be re-ingested
    assert len(lines) == 1
    assert lines[0]["verdict"] == "pass"


def _mk(tmp_path, lines, key="C"):
    import json
    cand_dir = tmp_path / "candidates"; cand_dir.mkdir()
    (cand_dir / "u1.json").write_text(json.dumps(
        {"candidate_id": "u1", "questions": [{"q_index": 1, "key": key}]}))
    raw = tmp_path / "verdicts-gkey-1.jsonl"
    raw.write_text("".join(json.dumps(
        {"candidate_id": "u1", "gate": "G-KEY", "target": "q:1", "vote": i + 1,
         "solver_answer": sa}) + "\n" for i, sa in enumerate(lines)))
    return cand_dir, raw


def _run(tmp_path, cand_dir, raw):
    import json, subprocess, sys
    from pathlib import Path as P
    out = tmp_path / "resolved.jsonl"
    script = P(__file__).resolve().parents[1] / "gkey_resolve.py"
    r = subprocess.run([sys.executable, str(script), str(raw),
                        "--candidates-dir", str(cand_dir), "--out", str(out)],
                       capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    return [json.loads(l) for l in out.read_text().splitlines() if l.strip()]


def test_split_vote_flags_not_kills(tmp_path):
    # One dissenting solver among matching votes = uncertainty, not execution.
    # (Eval 2026-07-24: an authentic hard item died on a single solver error.)
    lines = _run(tmp_path, *_mk(tmp_path, ["C", "D"]))
    verdicts = {(v["target"], v.get("vote")): v["verdict"] for v in lines}
    assert verdicts[("q:1", 1)] == "pass"
    assert verdicts[("q:1", 2)] == "flag"          # demoted from kill
    assert all(v["verdict"] != "kill" for v in lines)


def test_mismatch_majority_still_kills(tmp_path):
    lines = _run(tmp_path, *_mk(tmp_path, ["D", "D"]))
    assert sum(1 for v in lines if v["verdict"] == "kill") == 2


def test_self_kill_still_kills_even_when_sibling_matches(tmp_path):
    lines = _run(tmp_path, *_mk(tmp_path, ["C", "MULTIPLE_DEFENSIBLE"]))
    assert any(v["verdict"] == "kill" for v in lines)


def test_single_vote_mismatch_still_kills(tmp_path):
    # With only ONE vote present, a mismatch has no matching sibling — kill.
    lines = _run(tmp_path, *_mk(tmp_path, ["D"]))
    assert lines[0]["verdict"] == "kill"

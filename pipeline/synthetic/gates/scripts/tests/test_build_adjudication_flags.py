"""Fail-closed inventory tests for build_adjudication_flags.py (Codex review 2026-09-02, finding 2)."""
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from build_adjudication_flags import FlagsInputError, build, dump  # noqa: E402

REAL_B19 = Path(__file__).resolve().parents[3] / "batches" / "batch19"


def _w(p: Path, obj) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(obj, list):
        p.write_text("".join(json.dumps(o, ensure_ascii=False) + "\n" for o in obj), encoding="utf-8")
    else:
        p.write_text(json.dumps(obj, ensure_ascii=False), encoding="utf-8")


def rec(cid, gate, target, verdict="pass", vote=None, findings=None, justification="ok"):
    r = {"candidate_id": cid, "gate": gate, "target": target, "verdict": verdict,
         "findings": findings or [], "justification": justification, "executed_by": "t", "date": "2026-09-02"}
    if vote is not None:
        r["vote"] = vote
    return r


def complete_batch(tmp: Path, cid="u1", nq=2) -> Path:
    b = tmp / "batchX"
    _w(b / "candidates" / f"{cid}.json", {"candidate_id": cid, "section": "LÄS", "title": "t", "passage": "p",
                                          "questions": [{"q_index": i, "prompt": "?", "key": "A",
                                                         "options": [{"letter": L, "text": "x"} for L in "ABCD"]}
                                                        for i in range(1, nq + 1)]})
    canon = []
    for i in range(1, nq + 1):
        canon += [rec(cid, "G-KEY", f"q:{i}", vote=1), rec(cid, "G-KEY", f"q:{i}", vote=2),
                  rec(cid, "G-STEM", f"q:{i}"), rec(cid, "G-DISTRACTOR", f"q:{i}")]
    canon += [rec(cid, "G-REGISTER", "passage"), rec(cid, "G-SPRAK", "passage", vote=1)]
    canon += [rec(cid, g, "unit") for g in ("M-SCHEMA", "M-BANDS", "M-TELL", "M-FORM", "M-ECHO", "M-PLAGIARISM")]
    _w(b / "verdicts.jsonl", canon)
    _w(b / "verdicts-vfinal" / "verdicts-gdistractor.jsonl", [rec(cid, "G-DISTRACTOR", f"q:{i}") for i in range(1, nq + 1)])
    _w(b / "audits" / f"{cid}.json", {"candidate_id": cid, "audit_verdict": "CONFIRMED_CLEAN", "findings": []})
    return b


def test_complete_clean_batch_yields_zero_flags_only_when_evidence_is_present(tmp_path):
    b = complete_batch(tmp_path)
    assert build(b) == {"u1": []}


def test_flag_and_kill_and_audit_findings_are_emitted_in_rule_order(tmp_path):
    b = complete_batch(tmp_path)
    canon = [json.loads(l) for l in (b / "verdicts.jsonl").read_text().splitlines()]
    canon[2]["verdict"] = "flag"; canon[2]["findings"] = ["PARTIALLY: x"]
    canon[3]["verdict"] = "kill"; canon[3]["findings"] = ["B: defensible"]
    _w(b / "verdicts.jsonl", canon)
    _w(b / "verdicts-vfinal" / "verdicts-gdistractor.jsonl",
       [rec("u1", "G-DISTRACTOR", "q:1", "flag", findings=["A: arguable"]), rec("u1", "G-DISTRACTOR", "q:2")])
    _w(b / "audits" / "u1.json", {"candidate_id": "u1", "audit_verdict": "CONFIRMED_NOTES",
                                  "findings": [{"id": "F1", "severity": "note", "stage_challenged": "rationale",
                                                "claim": "c", "why": "w"},
                                               {"severity": "info", "stage_challenged": "provenance", "claim": "only claim"}]})
    out = build(b)["u1"]
    assert [f["source"] for f in out] == ["G-STEM:q:1", "G-DISTRACTOR:q:1", "G-DISTRACTOR:vfinal:q:1",
                                          "audit:rationale", "audit:provenance"]
    assert [f["severity"] for f in out] == ["minor", "major", "minor", "note", "info"]
    assert out[3]["note"] == "c — w" and out[4]["note"] == "only claim"


def test_note_truncated_to_400(tmp_path):
    b = complete_batch(tmp_path)
    canon = [json.loads(l) for l in (b / "verdicts.jsonl").read_text().splitlines()]
    canon[2]["verdict"] = "flag"; canon[2]["findings"] = ["x" * 900]
    _w(b / "verdicts.jsonl", canon)
    assert len(build(b)["u1"][0]["note"]) == 400


@pytest.mark.parametrize("break_it, msg", [
    (lambda b: (b / "verdicts.jsonl").unlink(), "missing required file"),
    (lambda b: (b / "verdicts.jsonl").write_text(""), "is empty"),
    (lambda b: (b / "verdicts.jsonl").write_text("{not json\n"), "is not JSON"),
    (lambda b: (b / "verdicts-vfinal" / "verdicts-gdistractor.jsonl").unlink(), "missing required file"),
    (lambda b: (b / "audits" / "u1.json").unlink(), "missing required"),
    (lambda b: (b / "audits" / "u1.json").write_text("[]"), "candidate_id mismatch"),
    (lambda b: (b / "candidates" / "u1.json").unlink(), "no units"),
])
def test_missing_or_malformed_evidence_fails_closed(tmp_path, break_it, msg):
    b = complete_batch(tmp_path)
    break_it(b)
    with pytest.raises(FlagsInputError, match=msg):
        build(b)


def _edit_canon(b: Path, fn) -> None:
    canon = [json.loads(l) for l in (b / "verdicts.jsonl").read_text().splitlines()]
    _w(b / "verdicts.jsonl", fn(canon))


def test_incomplete_gate_coverage_fails_closed(tmp_path):
    b = complete_batch(tmp_path)
    _edit_canon(b, lambda c: [r for r in c if not (r["gate"] == "G-KEY" and r.get("vote") == 2 and r["target"] == "q:2")])
    with pytest.raises(FlagsInputError, match="lacks G-KEY vote 2"):
        build(b)
    b = complete_batch(tmp_path / "b")
    _edit_canon(b, lambda c: [r for r in c if r["gate"] != "M-ECHO"])
    with pytest.raises(FlagsInputError, match="lacks M-ECHO"):
        build(b)
    b = complete_batch(tmp_path / "c")
    _edit_canon(b, lambda c: [r for r in c if r["gate"] not in ("G-SPRAK", "G-ENG")])
    with pytest.raises(FlagsInputError, match="language gate"):
        build(b)


def test_duplicate_identity_unknown_unit_and_bad_verdict_fail_closed(tmp_path):
    b = complete_batch(tmp_path)
    _edit_canon(b, lambda c: c + [c[0]])
    with pytest.raises(FlagsInputError, match="duplicate identity"):
        build(b)
    b = complete_batch(tmp_path / "b")
    _edit_canon(b, lambda c: c + [rec("ghost", "G-STEM", "q:1")])
    with pytest.raises(FlagsInputError, match="unknown unit"):
        build(b)
    b = complete_batch(tmp_path / "c")
    _edit_canon(b, lambda c: [dict(r, verdict="maybe") if r["gate"] == "G-STEM" else r for r in c])
    with pytest.raises(FlagsInputError, match="not in"):
        build(b)


def test_vfinal_target_coverage_and_audit_contract(tmp_path):
    b = complete_batch(tmp_path)
    _w(b / "verdicts-vfinal" / "verdicts-gdistractor.jsonl", [rec("u1", "G-DISTRACTOR", "q:1")])
    with pytest.raises(FlagsInputError, match="q:2 missing"):
        build(b)
    b = complete_batch(tmp_path / "b")
    _w(b / "audits" / "u1.json", {"candidate_id": "u1", "audit_verdict": "X",
                                  "findings": [{"severity": "huge", "stage_challenged": "s", "claim": "c"}]})
    with pytest.raises(FlagsInputError, match="severity 'huge' invalid"):
        build(b)
    b = complete_batch(tmp_path / "c")
    _w(b / "audits" / "u1.json", {"candidate_id": "u1", "audit_verdict": "X",
                                  "findings": [{"id": "D", "severity": "note", "stage_challenged": "s", "claim": "c"},
                                               {"id": "D", "severity": "note", "stage_challenged": "s", "claim": "c"}]})
    with pytest.raises(FlagsInputError, match="duplicate finding id"):
        build(b)


@pytest.mark.skipif(not (REAL_B19 / "adjudication-flags.json").exists(), reason="batch19 not present")
def test_reproduces_batch19_byte_identical():
    assert dump(build(REAL_B19)) == (REAL_B19 / "adjudication-flags.json").read_text(encoding="utf-8")

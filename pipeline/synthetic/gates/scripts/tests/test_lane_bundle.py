"""lane_bundle.py: closed bundles, forbidden-pattern scan, stage binding, report validation, append-forward ingest."""
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import lane_bundle as lb  # noqa: E402


def unit(cid, nq=2, section="ELF"):
    return {"candidate_id": cid, "section": section, "family": f"fam-{cid}", "title": f"T {cid}",
            "passage": f"Passage of {cid}.", "generator_meta": {"secret": "x"}, "repair_log": [{"round": "r1"}],
            "questions": [{"q_index": i, "prompt": f"Q{i}?", "key": "B", "rationale": f"because {i}",
                           "options": [{"letter": L, "text": f"{L}{i}"} for L in "ABCD"]} for i in range(1, nq + 1)]}


def batch(tmp: Path, ids=("u1", "u2")) -> Path:
    b = tmp / "batch"
    (b / "candidates").mkdir(parents=True)
    for cid in ids:
        (b / "candidates" / f"{cid}.json").write_text(json.dumps(unit(cid), ensure_ascii=False), encoding="utf-8")
    (b / "verdicts.jsonl").write_text("".join(json.dumps({"candidate_id": c, "gate": "G-STEM", "target": "q:1",
                                                            "verdict": "flag", "findings": ["x"], "justification": "j",
                                                            "executed_by": "t", "date": "d"}) + "\n" for c in ids))
    return b


def params(**kw):
    return {"run_id": "run-1", "lane_id": "lane-1", "model": "m", **kw}


def test_blind_bundle_strips_everything_decision_bearing(tmp_path):
    b = batch(tmp_path)
    files = lb.make_bundle_files(b, "vfinal-gkey", lb.load_units(b, None), params(vote=1))
    assert set(files) == {"blind.json", "instructions.md", "report.schema.json", "manifest.json"}
    blind = json.loads(files["blind.json"])
    assert all("key" not in q and "rationale" not in q for u in blind for q in u["questions"])
    assert all("generator_meta" not in u and "family" not in u for u in blind)
    assert lb.scan_forbidden(files, "vfinal-gkey") == []
    assert "vote 1" in files["instructions.md"]


def test_forbidden_scan_catches_a_leak():
    files = {"blind.json": '[{"candidate_id":"u1","questions":[{"key":"B"}]}]', "manifest.json": "{}"}
    assert lb.scan_forbidden(files, "vfinal-gkey") == ['blind.json: "key"']
    files = {"stems.json": '[{"passage":"leak"}]', "manifest.json": "{}"}
    assert lb.scan_forbidden(files, "reval-gstem") == ['stems.json: "passage"']


def test_full_unit_classes_strip_meta_but_audit_keeps_history(tmp_path):
    b = batch(tmp_path)
    files = lb.make_bundle_files(b, "review-language", lb.load_units(b, None), params())
    units = json.loads(files["units.json"])
    assert all("generator_meta" not in u and "repair_log" not in u and "rationale" in u["questions"][0] for u in units)
    audit = lb.make_bundle_files(b, "vfinal-audit", lb.load_units(b, ["u1"]), params())
    assert "repair_log" in json.loads(audit["unit.json"]) and "verdicts.jsonl" in audit and "reviews.jsonl" in audit
    with pytest.raises(lb.LaneError, match="exactly one unit"):
        lb.make_bundle_files(b, "vfinal-audit", lb.load_units(b, None), params())


def test_build_is_deterministic_and_stage_bound(tmp_path):
    b = batch(tmp_path)
    root = tmp_path / "run"
    lane = root / "lanes" / "lane-1"
    files = lb.make_bundle_files(b, "vfinal-gkey", lb.load_units(b, None), params(vote=2))
    lb.write_bundle(lane, files)
    old, fresh = lb.rebuild_digests(b, lane)
    assert old == fresh
    with pytest.raises(lb.LaneError, match="already exists"):
        lb.write_bundle(lane, files)
    # a repair to a candidate after the bundle was built breaks the binding
    p = b / "candidates" / "u1.json"
    u = json.loads(p.read_text()); u["passage"] += " Edited."; p.write_text(json.dumps(u, ensure_ascii=False))
    old, fresh = lb.rebuild_digests(b, lane)
    assert old != fresh


def _lane(tmp_path, cls, **kw):
    b = batch(tmp_path)
    lane = tmp_path / "run" / "lanes" / "L"
    lb.write_bundle(lane, lb.make_bundle_files(b, cls, lb.load_units(b, kw.pop("units", None)), params(**kw)))
    return b, lane


def _report(lane, body):
    m = lb.read_manifest(lane)
    r = {"schema": "gas-city-evidence-report.v1", "run_id": m["run_id"], "lane_id": m["lane_id"],
         "lane_class": m["lane_class"], "status": "evidence-only", "summary": "s", "candidate_ids": m["candidate_ids"], **body}
    (lane / "reports" / "report.json").write_text(json.dumps(r, ensure_ascii=False), encoding="utf-8")
    return r


def test_gkey_report_validation_and_ingest(tmp_path):
    b, lane = _lane(tmp_path, "vfinal-gkey", vote=1)
    answers = [{"candidate_id": c, "target": f"q:{i}", "solver_answer": "B", "justification": "j"} for c in ("u1", "u2") for i in (1, 2)]
    _report(lane, {"vote": 1, "answers": answers[:-1], "findings": []})
    with pytest.raises(lb.LaneError, match="coverage mismatch"):
        lb.verify_report(lane)
    _report(lane, {"vote": 2, "answers": answers, "findings": []})
    with pytest.raises(lb.LaneError, match="vote"):
        lb.verify_report(lane)
    bad = dict(answers[0], solver_answer="Z")
    _report(lane, {"vote": 1, "answers": [bad] + answers[1:], "findings": []})
    with pytest.raises(lb.LaneError, match="schema"):
        lb.verify_report(lane)
    _report(lane, {"vote": 1, "answers": answers, "findings": []})
    report, sha, _ = lb.verify_report(lane)
    written = lb.ingest(b, lane, report, sha, "2026-09-02", None)
    assert written == ["verdicts-vfinal/verdicts-gkey-1.jsonl"]
    recs = [json.loads(l) for l in (b / "verdicts-vfinal" / "verdicts-gkey-1.jsonl").read_text().splitlines()]
    assert len(recs) == 4 and recs[0]["gate"] == "G-KEY" and recs[0]["vote"] == 1 and recs[0]["executed_by"] == "gc-lane:lane-1/m"
    with pytest.raises(lb.LaneError, match="append-forward refuses"):
        lb.ingest(b, lane, report, sha, "2026-09-02", None)


def test_review_language_ingest_carries_exact_fixes_and_stays_out_of_promote_vocab(tmp_path):
    b, lane = _lane(tmp_path, "review-language")
    _report(lane, {"units": [
        {"candidate_id": "u1", "verdict": "FIX_PROPOSED", "findings": [
            {"id": "L1", "candidate_id": "u1", "location": "$.questions[0].rationale", "severity": "minor",
             "category": "idiom", "evidence": "x", "fix": {"path": "$.questions[0].rationale", "old": "because 1", "new": "since 1"}}]},
        {"candidate_id": "u2", "verdict": "CLEAR", "findings": []}]})
    report, sha, _ = lb.verify_report(lane)
    lb.ingest(b, lane, report, sha, "2026-09-02", None)
    recs = [json.loads(l) for l in (b / "reviews" / "language.jsonl").read_text().splitlines()]
    assert recs[0]["verdict"] == "FIX_PROPOSED" and recs[0]["fixes"][0]["old"] == "because 1"
    assert recs[1]["verdict"] == "CLEAR" and recs[1]["report_sha256"] == sha


def test_audit_and_fresh_eyes_write_once(tmp_path):
    b, lane = _lane(tmp_path, "fresh-eyes", units=["u1"])
    _report(lane, {"candidate_id": "u1", "cold_solve": [{"target": "q:1", "reader_answer": "B"}, {"target": "q:2", "reader_answer": "B"}],
                   "naturalness": "natural", "makes_sense": True, "reader_blockers": [], "reader_notes": []})
    report, sha, _ = lb.verify_report(lane)
    assert lb.ingest(b, lane, report, sha, "d", None) == ["adjudication-evidence/u1.json"]
    with pytest.raises(lb.LaneError, match="refusing to overwrite"):
        lb.ingest(b, lane, report, sha, "d", None)
    b2, lane2 = _lane(tmp_path / "x", "vfinal-audit", units=["u2"])
    _report(lane2, {"candidate_id": "u2", "audit_verdict": "CONFIRMED_NOTES", "scope_note": "s",
                    "findings": [{"id": "F1", "severity": "note", "stage_challenged": "rationale", "claim": "c",
                                  "evidence": "e", "why": "w", "disposition": "d", "key_impact": "none"}],
                    "resolved_findings": [], "cleared": [], "audit_note": ""})
    report, sha, _ = lb.verify_report(lane2)
    lb.ingest(b2, lane2, report, sha, "d", None)
    a = json.loads((b2 / "audits" / "u2.json").read_text())
    assert a["audit_verdict"] == "CONFIRMED_NOTES" and a["verdict"] == "CONFIRMED_NOTES" and a["findings"][0]["id"] == "F1"


def test_reval_language_needs_gate_and_round(tmp_path):
    b, lane = _lane(tmp_path, "reval-language", gate="G-ENG")
    _report(lane, {"gate": "G-ENG", "passes": [{"candidate_id": c, "vote": v, "verdict": "pass", "findings": [], "justification": "j"}
                                              for c in ("u1", "u2") for v in (1, 2, 3)]})
    report, sha, _ = lb.verify_report(lane)
    with pytest.raises(lb.LaneError, match="--round"):
        lb.ingest(b, lane, report, sha, "d", None)
    assert lb.ingest(b, lane, report, sha, "d", "r5") == ["verdicts/verdicts-lang-r5.jsonl"]


# ---------- Codex review v2 (2026-09-02) reproductions, now expected to FAIL CLOSED ----------

def test_verify_bundle_checks_the_files_on_disk(tmp_path):
    b, lane = _lane(tmp_path, "vfinal-gkey", vote=1)
    assert lb.verify_bundle(b, lane)["files"] == 4
    blind = lane / "bundle" / "blind.json"
    units = json.loads(blind.read_text()); units[0]["questions"][0]["key"] = "B"; blind.write_text(json.dumps(units))
    with pytest.raises(lb.LaneError, match="differs from the declared inventory digest"):
        lb.verify_bundle(b, lane)
    blind.write_text(json.dumps(units))  # still tampered; add an undeclared file too
    (lane / "bundle" / "undeclared-answer-key.json").write_text('{"key":"B"}')
    with pytest.raises(lb.LaneError, match="inventory mismatch"):
        lb.verify_bundle(b, lane)


def test_verify_bundle_rejects_symlinks_and_missing_files(tmp_path):
    b, lane = _lane(tmp_path, "fresh-eyes", units=["u1"])
    (lane / "bundle" / "blind.json").unlink()
    (lane / "bundle" / "blind.json").symlink_to(b / "candidates" / "u1.json")
    with pytest.raises(lb.LaneError, match="non-regular"):
        lb.verify_bundle(b, lane)
    (lane / "bundle" / "blind.json").unlink()
    with pytest.raises(lb.LaneError, match="inventory mismatch"):
        lb.verify_bundle(b, lane)


def test_conflicting_duplicate_answers_are_refused(tmp_path):
    b, lane = _lane(tmp_path, "vfinal-gkey", vote=1)
    answers = [{"candidate_id": c, "target": f"q:{i}", "solver_answer": "B", "justification": "j"} for c in ("u1", "u2") for i in (1, 2)]
    _report(lane, {"vote": 1, "answers": answers + [dict(answers[0], solver_answer="A")], "findings": []})
    with pytest.raises(lb.LaneError, match="duplicate answers"):
        lb.verify_report(lane)


def test_language_report_needs_all_three_votes_per_unit(tmp_path):
    b, lane = _lane(tmp_path, "reval-language", gate="G-ENG")
    _report(lane, {"gate": "G-ENG", "passes": [{"candidate_id": c, "vote": 1, "verdict": "pass", "findings": [], "justification": "j"} for c in ("u1", "u2")]})
    with pytest.raises(lb.LaneError, match="votes 1-3"):
        lb.verify_report(lane)


def test_gstem_report_needs_pair_judgement_for_multi_question_units(tmp_path):
    b, lane = _lane(tmp_path, "reval-gstem")
    js = [{"candidate_id": c, "target": f"q:{i}", "verdict": "pass", "blind_pick": "B", "confidence": "low", "findings": [], "justification": "j"}
          for c in ("u1", "u2") for i in (1, 2)]
    _report(lane, {"judgements": js})
    with pytest.raises(lb.LaneError, match="pair judgements"):
        lb.verify_report(lane)
    pairs = [{"candidate_id": c, "target": "pair", "verdict": "flag", "blind_pick": "-", "confidence": "low", "findings": ["one-way"], "justification": "j"} for c in ("u1", "u2")]
    _report(lane, {"judgements": js + pairs})
    report, sha, esc = lb.verify_report(lane)
    assert esc == []


def test_critical_gkey_finding_is_preserved_and_blocks_ingest_unless_recorded(tmp_path):
    b, lane = _lane(tmp_path, "vfinal-gkey", vote=1)
    answers = [{"candidate_id": c, "target": f"q:{i}", "solver_answer": "B", "justification": "j"} for c in ("u1", "u2") for i in (1, 2)]
    _report(lane, {"vote": 1, "answers": answers, "findings": [
        {"id": "C1", "candidate_id": "u1", "location": "q:1", "severity": "critical", "category": "other", "evidence": "second defensible answer"}]})
    report, sha, esc = lb.verify_report(lane)
    assert len(esc) == 1 and esc[0]["severity"] == "critical"
    with pytest.raises(lb.LaneError, match="escalation"):
        lb.ingest(b, lane, report, sha, "d", None)
    assert not (b / "verdicts-vfinal").exists()
    written = lb.ingest(b, lane, report, sha, "d", None, record_escalations=True)
    assert written == ["reviews/escalations.jsonl", "verdicts-vfinal/verdicts-gkey-1.jsonl"]
    recs = [json.loads(l) for l in (b / "verdicts-vfinal" / "verdicts-gkey-1.jsonl").read_text().splitlines()]
    r = next(x for x in recs if x["candidate_id"] == "u1" and x["target"] == "q:1")
    assert r["verdict"] == "flag" and r["findings"] == ["C1[critical] other: second defensible answer"]
    e = json.loads((b / "reviews" / "escalations.jsonl").read_text().splitlines()[0])
    assert e["source"] == "escalation:vfinal-gkey" and e["severity"] == "critical" and e["report_sha256"] == sha


def test_self_kill_answer_is_a_kill_record_and_an_escalation(tmp_path):
    b, lane = _lane(tmp_path, "vfinal-gkey", vote=2)
    answers = [{"candidate_id": c, "target": f"q:{i}", "solver_answer": "B", "justification": "j"} for c in ("u1", "u2") for i in (1, 2)]
    answers[3]["solver_answer"] = "MULTIPLE_DEFENSIBLE"
    _report(lane, {"vote": 2, "answers": answers, "findings": []})
    report, sha, esc = lb.verify_report(lane)
    assert esc[0]["kind"] == "answer" and esc[0]["severity"] == "critical"
    lb.ingest(b, lane, report, sha, "d", None, record_escalations=True)
    recs = [json.loads(l) for l in (b / "verdicts-vfinal" / "verdicts-gkey-2.jsonl").read_text().splitlines()]
    assert next(x for x in recs if x["target"] == "q:2" and x["candidate_id"] == "u2")["verdict"] == "kill"


def test_phase_binding_keeps_conditional_and_fixed_lanes_apart(tmp_path):
    b = batch(tmp_path)
    root = tmp_path / "run" / "lanes"
    cond = root / "cond-gkey-1"
    lb.write_bundle(cond, lb.make_bundle_files(b, "reval-gkey", lb.load_units(b, ["u1"]), params(vote=1, lane_id="cond")))
    _report(cond, {"vote": 1, "answers": [{"candidate_id": "u1", "target": f"q:{i}", "solver_answer": "B", "justification": "j"} for i in (1, 2)], "findings": []})
    report, sha, _ = lb.verify_report(cond)
    with pytest.raises(lb.LaneError, match="needs --round"):
        lb.ingest(b, cond, report, sha, "d", None)
    assert lb.ingest(b, cond, report, sha, "d", "r5") == ["verdicts/verdicts-gkey-r5-1.jsonl"]
    fixed = root / "fixed-gkey-1"
    lb.write_bundle(fixed, lb.make_bundle_files(b, "vfinal-gkey", lb.load_units(b, None), params(vote=1, lane_id="fixed")))
    _report(fixed, {"vote": 1, "answers": [{"candidate_id": c, "target": f"q:{i}", "solver_answer": "B", "justification": "j"} for c in ("u1", "u2") for i in (1, 2)], "findings": []})
    report, sha, _ = lb.verify_report(fixed)
    with pytest.raises(lb.LaneError, match="--round is not allowed"):
        lb.ingest(b, fixed, report, sha, "d", "r5")
    assert lb.ingest(b, fixed, report, sha, "d", None) == ["verdicts-vfinal/verdicts-gkey-1.jsonl"]   # no collision
    gd = root / "cond-gd"
    lb.write_bundle(gd, lb.make_bundle_files(b, "reval-gdistractor", lb.load_units(b, ["u1"]), params(lane_id="cgd")))
    _report(gd, {"judgements": [{"candidate_id": "u1", "target": f"q:{i}", "verdict": "pass", "findings": [], "justification": "j"} for i in (1, 2)]})
    report, sha, _ = lb.verify_report(gd)
    assert lb.ingest(b, gd, report, sha, "d", "r5") == ["verdicts/verdicts-gdistractor-r5.jsonl"]

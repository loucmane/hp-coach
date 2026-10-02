import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from check_review_integrity import check  # noqa: E402
import apply_exact_fixes as aef  # noqa: E402

S = Path(__file__).resolve().parents[1]


def mk(tmp: Path, records):
    b = tmp / "b"; (b / "candidates").mkdir(parents=True); (b / "reviews").mkdir()
    (b / "candidates" / "u1.json").write_text(json.dumps({"candidate_id": "u1", "passage": "old text", "section": "ELF",
        "questions": [{"q_index": 1, "prompt": "p", "rationale": "r", "options": [{"letter": "A", "text": "a"}]}]}))
    (b / "reviews" / "language.jsonl").write_text("".join(json.dumps(r) + "\n" for r in records))
    return b


PROPOSAL = {"candidate_id": "u1", "stage": "language", "verdict": "FIX_PROPOSED", "reviewed_by": "gc-lane:L01/m",
            "fixes": [{"path": "$.passage", "old": "old", "new": "new"}], "report_sha256": "aaaa"}


def test_coordinator_clear_after_unapplied_proposal_is_a_violation(tmp_path):
    b = mk(tmp_path, [PROPOSAL, {"candidate_id": "u1", "stage": "language", "verdict": "CLEAR",
                                 "reviewed_by": "coordinator/deferred-over-budget", "notes": "deferred"}])
    v = check(b)
    assert v and "coordinator-authored 'CLEAR'" in v[0]                 # rule 1
    assert any("were never applied, yet the last record reads 'CLEAR'" in x for x in v)   # and the unit-level rule


def test_deferred_is_allowed_and_keeps_hold(tmp_path):
    b = mk(tmp_path, [PROPOSAL, {"candidate_id": "u1", "stage": "language", "verdict": "DEFERRED",
                                 "reviewed_by": "coordinator/over-budget", "notes": "6 sessions > 5"}])
    assert check(b) == []
    # promote.py treats DEFERRED as outside the pass vocabulary -> HOLD (proved through the real script)
    (b / "reviews" / "pedagogy.jsonl").write_text(json.dumps({"candidate_id": "u1", "stage": "pedagogy", "verdict": "SOUND"}) + "\n")
    (b / "reviews" / "integrated.jsonl").write_text(json.dumps({"candidate_id": "u1", "stage": "integrated", "verdict": "CONSISTENT"}) + "\n")
    (b / "reviews" / "final_verify.jsonl").write_text(json.dumps({"candidate_id": "u1", "stage": "final_verify", "verdict": "VERIFIED"}) + "\n")
    r = subprocess.run([sys.executable, str(S / "promote.py"), "--batch-dir", str(b)], capture_output=True, text=True)
    assert "HOLD  u1" in r.stdout and "language" in r.stdout


def test_coordinator_clear_flips_promotes_language_stage_which_is_exactly_why_it_is_forbidden(tmp_path):
    """promote.py reads the LAST record per stage: with the proposal last, the language stage HOLDs the unit;
    with a coordinator CLEAR appended, that reason disappears. The integrity check flags the second state."""
    honest = mk(tmp_path / "h", [PROPOSAL])
    r = subprocess.run([sys.executable, str(S / "promote.py"), "--batch-dir", str(honest)], capture_output=True, text=True)
    assert "language: FIX_PROPOSED" in r.stdout and check(honest) == []
    forged = mk(tmp_path / "f", [PROPOSAL, {"candidate_id": "u1", "stage": "language", "verdict": "CLEAR", "reviewed_by": "coordinator/x"}])
    r = subprocess.run([sys.executable, str(S / "promote.py"), "--batch-dir", str(forged)], capture_output=True, text=True)
    assert "language" not in r.stdout        # the forbidden record silently clears the language stage…
    assert check(forged)                     # …which the integrity check flags
    r = subprocess.run([sys.executable, str(S / "check_review_integrity.py"), "--batch-dir", str(forged)], capture_output=True, text=True)
    assert r.returncode == 1


def test_applied_fix_record_is_clean_only_with_a_committed_transaction(tmp_path):
    b = mk(tmp_path, [PROPOSAL])
    assert aef.apply(b, "language", "2026-09-03") == ["u1"]      # writes CORRECTED with a committed txn
    assert check(b) == []
    forged = mk(tmp_path / "f", [PROPOSAL, {"candidate_id": "u1", "stage": "language", "verdict": "CORRECTED",
                                            "reviewed_by": "coordinator/exact-fix-applied", "applied_from": "aaaa"}])
    v = check(forged)
    assert v and "without a committed exact-fix transaction" in v[0]


def test_pass_verdict_from_the_same_report_that_proposed_fixes_is_a_violation(tmp_path):
    b = mk(tmp_path, [PROPOSAL, dict(PROPOSAL, verdict="CLEAR", fixes=[])])
    v = check(b)
    assert any("from the same report" in x for x in v)


def test_plan_revalidation_refuses_unclean_journals(tmp_path):
    b = mk(tmp_path, [PROPOSAL, {"candidate_id": "u1", "stage": "language", "verdict": "CLEAR", "reviewed_by": "coordinator/x"}])
    r = subprocess.run([sys.executable, str(S / "plan_revalidation.py"), "--batch-dir", str(b), "--stages", "language"], capture_output=True, text=True)
    assert r.returncode == 3 and "refusing to plan" in r.stdout

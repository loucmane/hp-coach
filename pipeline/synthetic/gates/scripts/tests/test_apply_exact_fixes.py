import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from apply_exact_fixes import FixError, apply  # noqa: E402


def mk(tmp: Path, fixes, verdict="FIX_PROPOSED"):
    b = tmp / "b"; (b / "candidates").mkdir(parents=True); (b / "reviews").mkdir()
    (b / "candidates" / "u1.json").write_text(json.dumps({"candidate_id": "u1", "passage": "old text here",
        "questions": [{"q_index": 1, "prompt": "p", "rationale": "because because", "options": [{"letter": "A", "text": "opt"}]}]}))
    (b / "reviews" / "language.jsonl").write_text(json.dumps({"candidate_id": "u1", "stage": "language", "verdict": verdict,
        "fixes": fixes, "report_sha256": "abc"}) + "\n")
    return b


def test_applies_exact_fix_and_records(tmp_path):
    b = mk(tmp_path, [{"path": "$.passage", "old": "old", "new": "new"}, {"path": "$.questions[0].options[0].text", "old": "opt", "new": "option"}])
    assert apply(b, "language", "2026-09-02") == ["u1"]
    c = json.loads((b / "candidates" / "u1.json").read_text())
    assert c["passage"] == "new text here" and c["questions"][0]["options"][0]["text"] == "option"
    assert c["repair_log"][-1]["round"] == "exact-fix-language" and len(c["repair_log"][-1]["edits"]) == 2
    recs = [json.loads(l) for l in (b / "reviews" / "language.jsonl").read_text().splitlines()]
    assert recs[-1]["verdict"] == "CORRECTED" and recs[-1]["reviewed_by"] == "coordinator/exact-fix-applied"


def test_ambiguous_or_absent_old_fails_closed_and_writes_nothing(tmp_path):
    b = mk(tmp_path, [{"path": "$.questions[0].rationale", "old": "because", "new": "since"}])
    before = (b / "candidates" / "u1.json").read_text()
    with pytest.raises(FixError, match="occurs 2 times"):
        apply(b, "language", "d")
    assert (b / "candidates" / "u1.json").read_text() == before
    b = mk(tmp_path / "x", [{"path": "$.passage", "old": "missing", "new": "n"}])
    with pytest.raises(FixError, match="occurs 0 times"):
        apply(b, "language", "d")


def test_unsupported_path_and_clear_verdict(tmp_path):
    b = mk(tmp_path, [{"path": "$.generator_meta.note", "old": "a", "new": "b"}])
    with pytest.raises(FixError, match="unsupported path"):
        apply(b, "language", "d")
    b = mk(tmp_path / "y", [{"path": "$.passage", "old": "old", "new": "new"}], verdict="CLEAR")
    assert apply(b, "language", "d") == []


def test_write_failure_rolls_back_candidate_and_journal(tmp_path, monkeypatch):
    import apply_exact_fixes as aef
    b = mk(tmp_path, [{"path": "$.passage", "old": "old", "new": "new"}])
    cand_before = (b / "candidates" / "u1.json").read_bytes()
    journal_before = (b / "reviews" / "language.jsonl").read_bytes()

    def boom(path, record):
        raise OSError("disk full while appending journal")
    monkeypatch.setattr(aef, "_append_journal", boom)
    with pytest.raises(OSError):
        aef.apply(b, "language", "2026-09-02")
    assert (b / "candidates" / "u1.json").read_bytes() == cand_before        # candidate restored byte-for-byte
    assert (b / "reviews" / "language.jsonl").read_bytes() == journal_before  # journal untouched
    txns = list((b / "exact-fix-backups").glob("language-*/txn.json"))
    assert len(txns) == 1 and json.loads(txns[0].read_text())["state"] == "rolled_back"
    assert (txns[0].parent / "u1.json").read_bytes() == cand_before            # before-image preserved


def test_candidate_write_failure_after_first_unit_rolls_back_all(tmp_path, monkeypatch):
    import apply_exact_fixes as aef
    b = mk(tmp_path, [{"path": "$.passage", "old": "old", "new": "new"}])
    (b / "candidates" / "u2.json").write_text(json.dumps({"candidate_id": "u2", "passage": "old two", "questions": []}))
    with (b / "reviews" / "language.jsonl").open("a") as fh:
        fh.write(json.dumps({"candidate_id": "u2", "stage": "language", "verdict": "FIX_PROPOSED",
                             "fixes": [{"path": "$.passage", "old": "old", "new": "new"}], "report_sha256": "abc"}) + "\n")
    before = {c: (b / "candidates" / f"{c}.json").read_bytes() for c in ("u1", "u2")}
    calls = {"n": 0}
    real = aef._write_candidate

    def flaky(path, cand):
        calls["n"] += 1
        if calls["n"] == 2:
            raise OSError("second write fails")
        real(path, cand)
    monkeypatch.setattr(aef, "_write_candidate", flaky)
    with pytest.raises(OSError):
        aef.apply(b, "language", "d")
    assert all((b / "candidates" / f"{c}.json").read_bytes() == before[c] for c in before)
    recs = [json.loads(l) for l in (b / "reviews" / "language.jsonl").read_text().splitlines()]
    assert not any(r.get("reviewed_by") == "coordinator/exact-fix-applied" for r in recs)


def test_recover_rolls_back_a_pending_transaction_left_by_a_crash(tmp_path):
    import apply_exact_fixes as aef
    b = mk(tmp_path, [{"path": "$.passage", "old": "old", "new": "new"}])
    before = (b / "candidates" / "u1.json").read_bytes()
    assert aef.apply(b, "language", "d") == ["u1"]
    txn_dir = next((b / "exact-fix-backups").glob("language-*"))
    txn = json.loads((txn_dir / "txn.json").read_text()); assert txn["state"] == "committed"
    txn["state"] = "pending"; (txn_dir / "txn.json").write_text(json.dumps(txn))   # simulate a crash mid-write
    # the next apply first recovers (rolls back to the before-image) and refuses to continue in the same call
    with pytest.raises(FixError, match="rolled back"):
        aef.apply(b, "language", "d")
    assert (b / "candidates" / "u1.json").read_bytes() == before
    assert json.loads((txn_dir / "txn.json").read_text())["state"] == "rolled_back"
    assert aef.recover(b) == []                       # nothing pending any more
    assert aef.apply(b, "language", "d") == ["u1"]    # a clean re-run succeeds


def test_torn_commit_publication_rolls_back_and_never_leaves_invalid_json(tmp_path, monkeypatch):
    """Codex review v3 finding 1: a failure while publishing 'committed' must leave byte-exact
    rollback (or a valid pending record) — never changed content next to an unreadable txn.json."""
    import apply_exact_fixes as aef
    b = mk(tmp_path, [{"path": "$.passage", "old": "old", "new": "new"}])
    cand_before = (b / "candidates" / "u1.json").read_bytes()
    journal_before = (b / "reviews" / "language.jsonl").read_bytes()
    real_replace = aef.os.replace
    calls = {"n": 0}

    def torn_replace(src, dst):            # 1st publish = pending (ok); 2nd = committed -> fails after a partial temp write
        calls["n"] += 1
        if calls["n"] == 2:
            Path(src).write_text('{"schema": "hpfetcher-exact-fix-txn.v1", "state": "comm')   # torn temp file
            raise OSError("injected failure publishing committed state")
        return real_replace(src, dst)
    monkeypatch.setattr(aef.os, "replace", torn_replace)
    with pytest.raises(OSError, match="publishing committed"):
        aef.apply(b, "language", "d")
    assert (b / "candidates" / "u1.json").read_bytes() == cand_before
    assert (b / "reviews" / "language.jsonl").read_bytes() == journal_before
    txn_dir = next((b / "exact-fix-backups").glob("language-*"))
    txn = json.loads((txn_dir / "txn.json").read_text())          # always valid JSON
    assert txn["state"] == "rolled_back"


def test_failure_in_rollback_publication_leaves_a_valid_pending_record_that_recover_completes(tmp_path, monkeypatch):
    import apply_exact_fixes as aef
    b = mk(tmp_path, [{"path": "$.passage", "old": "old", "new": "new"}])
    cand_before = (b / "candidates" / "u1.json").read_bytes()
    real_replace = aef.os.replace
    calls = {"n": 0}

    def failing_after_pending(src, dst):    # pending publishes; both later publications (committed, rolled_back) fail
        calls["n"] += 1
        if calls["n"] >= 2:
            raise OSError("publication failure")
        return real_replace(src, dst)
    monkeypatch.setattr(aef.os, "replace", failing_after_pending)
    with pytest.raises(OSError):
        aef.apply(b, "language", "d")
    txn_dir = next((b / "exact-fix-backups").glob("language-*"))
    assert json.loads((txn_dir / "txn.json").read_text())["state"] == "pending"   # valid, recoverable
    monkeypatch.setattr(aef.os, "replace", real_replace)
    assert aef.recover(b) == [txn_dir.name]
    assert (b / "candidates" / "u1.json").read_bytes() == cand_before
    assert json.loads((txn_dir / "txn.json").read_text())["state"] == "rolled_back"


def test_unreadable_txn_record_is_a_fix_error_not_a_traceback(tmp_path):
    import apply_exact_fixes as aef
    b = mk(tmp_path, [{"path": "$.passage", "old": "old", "new": "new"}])
    assert aef.apply(b, "language", "d") == ["u1"]
    txn_dir = next((b / "exact-fix-backups").glob("language-*"))
    (txn_dir / "txn.json").write_text('{"schema": "hpfetcher-exact-fix-txn.v1", "state": "comm')
    with pytest.raises(FixError, match="unreadable transaction record"):
        aef.recover(b)
    with pytest.raises(FixError, match="unreadable transaction record"):
        aef.apply(b, "language", "d")

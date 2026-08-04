"""Tests for adjudicate_fold.py — mechanical adjudication recommendations."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from adjudicate_fold import fold_unit  # noqa: E402

KEYS = {1: "C", 2: "B"}
CLEAN = {"candidate_id": "u1",
         "cold_solve": [{"target": "q:1", "reader_answer": "C"}, {"target": "q:2", "reader_answer": "B"}],
         "naturalness": "natural", "makes_sense": True, "reader_blockers": [], "reader_notes": []}


def test_clean_unit_godkann():
    assert fold_unit("u1", CLEAN, KEYS, [])["recommendation"] == "GODKANN"


def test_cold_solve_mismatch_escalates():
    ev = dict(CLEAN, cold_solve=[{"target": "q:1", "reader_answer": "A"},
                                 {"target": "q:2", "reader_answer": "B"}])
    assert fold_unit("u1", ev, KEYS, [])["recommendation"] == "AGARBLICK"


def test_reader_blocker_escalates():
    ev = dict(CLEAN, reader_blockers=["q2 stem ambiguous"])
    assert fold_unit("u1", ev, KEYS, [])["recommendation"] == "AGARBLICK"


def test_notes_yield_noted():
    ev = dict(CLEAN, reader_notes=["slightly bookish phrasing in para 2"])
    assert fold_unit("u1", ev, KEYS, [])["recommendation"] == "GODKANN_NOTED"


def test_hard_flag_escalates_and_unknown_severity_fails_closed():
    assert fold_unit("u1", CLEAN, KEYS, [{"severity": "major", "note": "x"}])["recommendation"] == "AGARBLICK"
    assert fold_unit("u1", CLEAN, KEYS, [{"severity": "weird", "note": "x"}])["recommendation"] == "AGARBLICK"


def test_missing_makes_sense_fails_closed():
    ev = {k: v for k, v in CLEAN.items() if k != "makes_sense"}
    assert fold_unit("u1", ev, KEYS, [])["recommendation"] == "AGARBLICK"


def test_dispositioned_gate_flags_are_notes_not_escalations():
    # A gate flag on a SHIPPED unit was already adjudicated by the batch
    # pipeline (promote passed with the flag on record) — it surfaces as an
    # anteckning, never re-litigated as an escalation.
    f = [{"source": "G-STEM", "severity": "major", "note": "PARTIALLY ..."}]
    assert fold_unit("u1", CLEAN, KEYS, f)["recommendation"] == "GODKANN_NOTED"


def test_scan_and_non_gate_majors_still_escalate():
    f = [{"source": "cross-batch-scan", "severity": "major", "note": "clone"}]
    assert fold_unit("u1", CLEAN, KEYS, f)["recommendation"] == "AGARBLICK"

"""Tests for the promotion gate — the single "nothing slips" decision.

Run from pipeline/synthetic/gates/scripts:  python3 -m pytest tests/ -q

promote() is the one place that decides whether a unit is allowed into
candidates-final. A unit is promoted ONLY if every stage recorded a clearing
verdict: the gate-fleet aggregate status must be a survive status, AND each of
the three human/agent review stages (language, pedagogy, integrated sweep) must
have a record whose verdict is in that stage's pass-set. A MISSING stage is a
HOLD, never a pass — that is the whole point of the gate.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from promote import promote, REVIEW_STAGES  # noqa: E402


def _reviews(**per_stage):
    """Build a reviews dict {stage: {cid: verdict}} from kwargs stage=list of (cid,verdict)."""
    out = {s: {} for s in REVIEW_STAGES}
    for stage, pairs in per_stage.items():
        for cid, verdict in pairs:
            out[stage][cid] = verdict
    return out


def test_all_stages_clear_promotes():
    agg = {"u1": {"status": "SURVIVED_CLEAN"}}
    reviews = _reviews(
        language=[("u1", "CLEAR")],
        pedagogy=[("u1", "SOUND")],
        integrated=[("u1", "CONSISTENT")],
    )
    result = promote(agg, reviews, {"u1"})
    assert result["u1"]["decision"] == "PASS"
    assert result["u1"]["reasons"] == []


def test_flagged_gatefleet_still_promotes():
    # SURVIVED_FLAGGED is a survive status (flags go to adjudication, not a kill).
    agg = {"u1": {"status": "SURVIVED_FLAGGED"}}
    reviews = _reviews(
        language=[("u1", "CORRECTED")],
        pedagogy=[("u1", "MINOR_FIXES")],
        integrated=[("u1", "MINOR_NOTES")],
    )
    assert promote(agg, reviews, {"u1"})["u1"]["decision"] == "PASS"


def test_missing_integrated_review_holds():
    # The exact "slips past it" failure: gates + language + pedagogy all cleared,
    # but the integrated sweep never ran. Must HOLD, not pass.
    agg = {"u1": {"status": "SURVIVED_CLEAN"}}
    reviews = _reviews(
        language=[("u1", "CLEAR")],
        pedagogy=[("u1", "SOUND")],
        # integrated deliberately absent
    )
    r = promote(agg, reviews, {"u1"})
    assert r["u1"]["decision"] == "HOLD"
    assert any("integrated" in reason for reason in r["u1"]["reasons"])


def test_dead_gatefleet_holds():
    agg = {"u1": {"status": "DEAD", "killed_by": ["G-KEY"]}}
    reviews = _reviews(
        language=[("u1", "CLEAR")],
        pedagogy=[("u1", "SOUND")],
        integrated=[("u1", "CONSISTENT")],
    )
    r = promote(agg, reviews, {"u1"})
    assert r["u1"]["decision"] == "HOLD"
    assert any("gate-fleet" in reason and "DEAD" in reason for reason in r["u1"]["reasons"])


def test_incomplete_gatefleet_holds():
    agg = {"u1": {"status": "INCOMPLETE"}}
    reviews = _reviews(
        language=[("u1", "CLEAR")],
        pedagogy=[("u1", "SOUND")],
        integrated=[("u1", "CONSISTENT")],
    )
    assert promote(agg, reviews, {"u1"})["u1"]["decision"] == "HOLD"


def test_integrated_blocked_ship_holds():
    agg = {"u1": {"status": "SURVIVED_CLEAN"}}
    reviews = _reviews(
        language=[("u1", "CLEAR")],
        pedagogy=[("u1", "SOUND")],
        integrated=[("u1", "BLOCKED_SHIP")],
    )
    r = promote(agg, reviews, {"u1"})
    assert r["u1"]["decision"] == "HOLD"
    assert any("integrated" in reason and "BLOCKED_SHIP" in reason for reason in r["u1"]["reasons"])


def test_integrated_inconsistent_holds():
    agg = {"u1": {"status": "SURVIVED_CLEAN"}}
    reviews = _reviews(
        language=[("u1", "CLEAR")],
        pedagogy=[("u1", "SOUND")],
        integrated=[("u1", "INCONSISTENT")],
    )
    assert promote(agg, reviews, {"u1"})["u1"]["decision"] == "HOLD"


def test_pedagogy_reject_holds():
    agg = {"u1": {"status": "SURVIVED_CLEAN"}}
    reviews = _reviews(
        language=[("u1", "CLEAR")],
        pedagogy=[("u1", "REJECT")],
        integrated=[("u1", "CONSISTENT")],
    )
    assert promote(agg, reviews, {"u1"})["u1"]["decision"] == "HOLD"


def test_language_reject_holds():
    agg = {"u1": {"status": "SURVIVED_CLEAN"}}
    reviews = _reviews(
        language=[("u1", "REJECT")],
        pedagogy=[("u1", "SOUND")],
        integrated=[("u1", "CONSISTENT")],
    )
    assert promote(agg, reviews, {"u1"})["u1"]["decision"] == "HOLD"


def test_candidate_absent_from_aggregate_holds():
    # A unit with reviews but no gate-fleet record at all must not pass.
    agg = {}
    reviews = _reviews(
        language=[("u1", "CLEAR")],
        pedagogy=[("u1", "SOUND")],
        integrated=[("u1", "CONSISTENT")],
    )
    r = promote(agg, reviews, {"u1"})
    assert r["u1"]["decision"] == "HOLD"
    assert any("gate-fleet" in reason for reason in r["u1"]["reasons"])


def test_unknown_review_verdict_holds():
    # A typo'd / unrecognised verdict string must fail closed, not pass.
    agg = {"u1": {"status": "SURVIVED_CLEAN"}}
    reviews = _reviews(
        language=[("u1", "clear")],  # wrong case -> unknown
        pedagogy=[("u1", "SOUND")],
        integrated=[("u1", "CONSISTENT")],
    )
    assert promote(agg, reviews, {"u1"})["u1"]["decision"] == "HOLD"


def test_multiple_candidates_mixed():
    agg = {
        "pass1": {"status": "SURVIVED_CLEAN"},
        "hold1": {"status": "SURVIVED_CLEAN"},
    }
    reviews = _reviews(
        language=[("pass1", "CLEAR"), ("hold1", "CLEAR")],
        pedagogy=[("pass1", "SOUND"), ("hold1", "SOUND")],
        integrated=[("pass1", "CONSISTENT")],  # hold1 missing integrated
    )
    r = promote(agg, reviews, {"pass1", "hold1"})
    assert r["pass1"]["decision"] == "PASS"
    assert r["hold1"]["decision"] == "HOLD"

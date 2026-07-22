#!/usr/bin/env python3
"""The promotion gate — the single "nothing slips past it" decision.

A generated unit is allowed into candidates-final/ ONLY if every stage of the
pipeline recorded a clearing verdict:

  * gate-fleet aggregate status (mech + 11 judges, via aggregate.py) is a
    SURVIVE status (SURVIVED_CLEAN or SURVIVED_FLAGGED — flags go to
    adjudication, they are not kills); DEAD / INCOMPLETE hold.
  * language review    (expert-language-review)  verdict in {CLEAR, CORRECTED}
  * pedagogy review    (pedagogy-review)          verdict in {SOUND, MINOR_FIXES}
  * integrated sweep   (integrated-review)        verdict in {CONSISTENT, MINOR_NOTES}
  * final verify       (blind re-solve + meta-audit) verdict in {VERIFIED, VERIFIED_NOTES}

The decisive property: a MISSING stage record is a HOLD, never a pass. Promotion
requires the presence AND clearance of every stage, so a skipped or forgotten
stage can never leak a unit to students. This is a mechanical invariant, not
orchestrator discipline — run it (or `--require-clean` in CI) to prove a
candidates-final/ dir is trustworthy.

Review records live in <batch>/reviews/<stage>.jsonl, one JSON object per line:
    {"candidate_id": "elf-b2-001", "stage": "integrated",
     "verdict": "CONSISTENT", "reviewed_by": "...", "date": "..."}

Usage (audit a batch):
    promote.py --batch-dir batches/batch2
Usage (CI gate — nonzero exit if anything is held):
    promote.py --batch-dir batches/batch2 --require-clean
Usage (mechanically move PASS units into candidates-final/):
    promote.py --batch-dir batches/batch2 --promote --from-dir batches/batch2/candidates-corrected
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from aggregate import aggregate  # noqa: E402

# Gate-fleet aggregate statuses that mean "survived" (eligible to continue).
GATEFLEET_PASS = {"SURVIVED_CLEAN", "SURVIVED_FLAGGED"}

# Each review stage and the verdicts that clear it. Anything not listed
# (including an unknown / typo'd verdict string) fails closed -> HOLD.
# final_verify is the double cross-check OVER the reviewers: fresh blind
# G-KEY x2 + G-DISTRACTOR on the exact shipping file (mechanically resolved)
# plus an adversarial meta-audit of the recorded stage verdicts. It exists so
# that an edit applied by a review stage never ships on that stage's own
# self-report.
REVIEW_STAGES = {
    "language": {"CLEAR", "CORRECTED"},
    "pedagogy": {"SOUND", "MINOR_FIXES"},
    "integrated": {"CONSISTENT", "MINOR_NOTES"},
    "final_verify": {"VERIFIED", "VERIFIED_NOTES"},
}


def promote(agg_report: dict, reviews: dict, candidate_ids: set) -> dict:
    """Decide PASS/HOLD per candidate.

    agg_report:    {cid: {"status": <aggregate status>, ...}}  (from aggregate.py)
    reviews:       {stage: {cid: verdict_str}} for each stage in REVIEW_STAGES
    candidate_ids: the set of ids that must be decided (the batch's candidates/)

    Returns {cid: {"decision": "PASS"|"HOLD", "reasons": [str, ...]}}.
    Fails closed: any missing/unknown/non-clearing input yields HOLD.
    """
    result = {}
    for cid in sorted(candidate_ids):
        reasons = []

        agg = agg_report.get(cid)
        if agg is None:
            reasons.append("gate-fleet: no aggregate record (unit not gated)")
        else:
            status = agg.get("status")
            if status not in GATEFLEET_PASS:
                detail = status or "UNKNOWN"
                killed = agg.get("killed_by")
                if killed:
                    detail += f" (killed_by={','.join(killed)})"
                reasons.append(f"gate-fleet: {detail}")

        for stage, pass_set in REVIEW_STAGES.items():
            verdict = reviews.get(stage, {}).get(cid)
            if verdict is None:
                reasons.append(f"{stage}: no review record (stage did not run)")
            elif verdict not in pass_set:
                reasons.append(f"{stage}: {verdict}")

        result[cid] = {"decision": "HOLD" if reasons else "PASS", "reasons": reasons}
    return result


def _load_reviews(batch_dir: Path) -> dict:
    """Load <batch>/reviews/<stage>.jsonl into {stage: {cid: verdict}}."""
    reviews = {s: {} for s in REVIEW_STAGES}
    rdir = batch_dir / "reviews"
    for stage in REVIEW_STAGES:
        f = rdir / f"{stage}.jsonl"
        if not f.exists():
            continue
        for line in f.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            rec = json.loads(line)
            # Last record for a cid wins (a re-review supersedes an earlier one).
            reviews[stage][rec["candidate_id"]] = rec.get("verdict")
    return reviews


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--batch-dir", type=Path, required=True,
                    help="batch dir containing candidates/, verdicts.jsonl, reviews/")
    ap.add_argument("--verdicts", type=Path,
                    help="merged gate-fleet verdicts (default <batch>/verdicts.jsonl)")
    ap.add_argument("--candidates-dir", type=Path,
                    help="candidates dir for the gate-fleet run (default <batch>/candidates)")
    ap.add_argument("--require-clean", action="store_true",
                    help="exit 1 if any candidate is HOLD (CI / automation gate)")
    ap.add_argument("--promote", action="store_true",
                    help="copy PASS units into <batch>/candidates-final/")
    ap.add_argument("--from-dir", type=Path,
                    help="source of PASS unit files for --promote (default <batch>/candidates-corrected)")
    args = ap.parse_args(argv)

    batch = args.batch_dir
    cand_dir = args.candidates_dir or (batch / "candidates")
    verdicts_path = args.verdicts or (batch / "verdicts.jsonl")

    candidates = {}
    for p in sorted(cand_dir.glob("*.json")):
        c = json.loads(p.read_text(encoding="utf-8"))
        if "candidate_id" in c:
            candidates[c["candidate_id"]] = c
    if not candidates:
        print(f"promote: no candidates found in {cand_dir}", file=sys.stderr)
        return 2

    if verdicts_path.exists():
        verdicts = [json.loads(l) for l in verdicts_path.read_text(encoding="utf-8").splitlines() if l.strip()]
        agg_report = aggregate(verdicts, candidates)
    else:
        print(f"promote: WARNING no gate-fleet verdicts at {verdicts_path} — all units HOLD on gate-fleet",
              file=sys.stderr)
        agg_report = {}

    reviews = _load_reviews(batch)
    decisions = promote(agg_report, reviews, set(candidates))

    n_pass = n_hold = 0
    for cid in sorted(decisions):
        d = decisions[cid]
        if d["decision"] == "PASS":
            n_pass += 1
            print(f"PASS  {cid}")
        else:
            n_hold += 1
            print(f"HOLD  {cid}")
            for r in d["reasons"]:
                print(f"        - {r}")
    print("---")
    print(f"PASS: {n_pass}   HOLD: {n_hold}")

    if args.promote:
        from_dir = args.from_dir or (batch / "candidates-corrected")
        final_dir = batch / "candidates-final"
        final_dir.mkdir(exist_ok=True)
        moved = 0
        for cid, d in decisions.items():
            if d["decision"] != "PASS":
                continue
            src = from_dir / f"{cid}.json"
            if not src.exists():
                print(f"promote: WARNING PASS unit {cid} has no source file at {src}", file=sys.stderr)
                continue
            shutil.copy2(src, final_dir / f"{cid}.json")
            moved += 1
        held = sorted(cid for cid, d in decisions.items() if d["decision"] == "HOLD")
        (batch / "reviews").mkdir(exist_ok=True)
        (batch / "reviews" / "HELD.txt").write_text("\n".join(held) + ("\n" if held else ""), encoding="utf-8")
        print(f"promote: copied {moved} PASS unit(s) -> {final_dir}; {len(held)} held (see reviews/HELD.txt)")

    if args.require_clean and n_hold:
        print(f"promote: {n_hold} candidate(s) HELD — candidates-final is NOT clean", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

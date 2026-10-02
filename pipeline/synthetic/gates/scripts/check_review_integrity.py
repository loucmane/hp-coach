#!/usr/bin/env python3
"""Fail closed when a review journal clears a unit without the prescribed fix having been applied.

Codex review v4: promote.py consumes the LAST record per unit and stage. A coordinator-authored
`CLEAR` appended after an unapplied `FIX_PROPOSED` therefore turns a HOLD into a PASS — a quality
verdict, not scheduling. This check makes that impossible to do silently. Rules over
<batch>/reviews/{language,pedagogy}.jsonl:

  1. A record authored by the coordinator (reviewed_by starting "coordinator/") may carry ONLY
       CORRECTED / MINOR_FIXES with `applied_from` naming the report whose fixes were applied AND
       a committed exact-fix transaction (exact-fix-backups/*/txn.json, state "committed") that
       lists the unit — i.e. it was written by apply_exact_fixes.py — or
       DEFERRED, which is outside promote.py's pass vocabulary and therefore keeps the unit on
       HOLD, visibly.
     Any other coordinator record (CLEAR, SOUND, CONSISTENT, VERIFIED…, or CORRECTED without a
     committed transaction) is a violation.
  2. Once a lane report has proposed fixes for a unit (FIX_PROPOSED / MINOR_FIXES with fixes[]),
     every later record for that unit must either be the apply_exact_fixes record for THOSE fixes,
     a DEFERRED record, or a lane-authored record from a DIFFERENT report — a later pass verdict
     from the same report is a violation.

Exit 0 when clean, 1 on any violation (each printed), 2 on unreadable input. Run before
promote.py (package step D2) and inside plan_revalidation.py.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

PROPOSING = {"FIX_PROPOSED", "MINOR_FIXES"}
APPLIED_VERDICT = {"language": "CORRECTED", "pedagogy": "MINOR_FIXES"}
STAGES = ("language", "pedagogy")


def committed_units(batch: Path) -> dict[str, set[str]]:
    """report_sha256 -> units whose fixes from that report were committed by apply_exact_fixes."""
    out: dict[str, set[str]] = {}
    root = batch / "exact-fix-backups"
    for tp in sorted(root.glob("*/txn.json")) if root.is_dir() else []:
        try:
            txn = json.loads(tp.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if txn.get("state") == "committed":
            for cid in txn.get("units", []):
                out.setdefault(cid, set()).add(txn.get("stage"))
    return out


def check(batch: Path) -> list[str]:
    violations: list[str] = []
    committed = committed_units(batch)
    for stage in STAGES:
        p = batch / "reviews" / f"{stage}.jsonl"
        if not p.is_file():
            continue
        recs = [json.loads(l) for l in p.read_text(encoding="utf-8").splitlines() if l.strip()]
        by_unit: dict[str, list[dict]] = {}
        for r in recs:
            by_unit.setdefault(r.get("candidate_id", "?"), []).append(r)
        for cid, rs in by_unit.items():
            pending_from: str | None = None
            for i, r in enumerate(rs):
                by = str(r.get("reviewed_by", ""))
                v = r.get("verdict")
                fixes = r.get("fixes") or []
                if by.startswith("coordinator/"):
                    if v == "DEFERRED":
                        continue
                    if v == APPLIED_VERDICT[stage] and r.get("applied_from") and stage in committed.get(cid, set()):
                        pending_from = None
                        continue
                    violations.append(f"{stage}.jsonl {cid} record {i}: coordinator-authored '{v}' without a committed "
                                      f"exact-fix transaction — a coordinator may only record DEFERRED or the applied fix")
                    continue
                if v in PROPOSING and fixes:
                    pending_from = r.get("report_sha256") or "<unknown report>"
                elif pending_from and r.get("report_sha256") == pending_from:
                    violations.append(f"{stage}.jsonl {cid} record {i}: '{v}' from the same report ({pending_from[:8]}…) that "
                                      f"proposed unapplied fixes")
            if pending_from and stage not in committed.get(cid, set()):
                # unresolved proposal: fine as long as the LAST record still holds it (promote will HOLD)
                last = rs[-1]
                if last.get("verdict") not in PROPOSING and last.get("verdict") != "DEFERRED":
                    violations.append(f"{stage}.jsonl {cid}: fixes proposed by report {pending_from[:8]}… were never applied, "
                                      f"yet the last record reads '{last.get('verdict')}' by {last.get('reviewed_by')}")
    return violations


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--batch-dir", required=True, type=Path)
    a = ap.parse_args()
    try:
        v = check(a.batch_dir)
    except (OSError, json.JSONDecodeError) as e:
        print(f"check_review_integrity: unreadable input — {e}", file=sys.stderr)
        return 2
    if v:
        print(f"check_review_integrity: {len(v)} violation(s)")
        for x in v:
            print(f"  {x}")
        return 1
    print("check_review_integrity: clean")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Derive the three gate sheets from candidates, deterministically.

`check_sheet_sync.py` is the gate that catches a candidate and its sheets
drifting apart. This is the other half of that contract: the sheets are
DERIVED, never hand-maintained, so the drift it checks for cannot be
introduced by a repair round that edits a candidate and forgets a sheet.

Three sheets, each a strict projection of the candidate:

  blind/       title + passage + prompts + options.  NO key, NO rationale.
               What a blind G-KEY solver and a fresh-eyes reader see.
  stems/       prompts + options only.  NO passage, NO title, NO key.
               Used to measure what a question set leaks with the passage
               unopened (the G-STEM channel, and RULE 15's pairing floor).
  distractor/  everything blind/ has, PLUS the key.  NO rationale — the
               judge must argue the distractors down itself, not read why
               the author thinks they fail.

Leaking a key into blind/ or stems/, or a passage into stems/, voids the
gate leg that reads it. This script cannot leak: each sheet is built by
naming the fields it may contain, never by deleting fields from a copy.

Re-running is safe and idempotent: sheets are rewritten from the candidate
every time, so the fix for any desync is to run this again.

Usage:
  make_sheets.py --batch-dir batches/batch20 [--candidates-dir DIR] [--check]

  --check   write nothing; exit 1 if any sheet differs from what would be
            written (use in CI, or to prove sheets are current before gating)
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def _questions(cand: dict, *, key: bool) -> list[dict]:
    out = []
    for q in cand["questions"]:
        rec = {
            "q_index": q["q_index"],
            "prompt": q["prompt"],
            "options": [{"letter": o["letter"], "text": o["text"]} for o in q["options"]],
        }
        if key:
            rec["key"] = q["key"]
        out.append(rec)
    return out


def build(cand: dict, sheet: str) -> dict:
    """Project a candidate onto one sheet. Additive construction only."""
    cid = cand["candidate_id"]
    if sheet == "blind":
        return {
            "candidate_id": cid,
            "section": cand["section"],
            "title": cand["title"],
            "passage": cand["passage"],
            "questions": _questions(cand, key=False),
        }
    if sheet == "stems":
        return {
            "candidate_id": cid,
            "section": cand["section"],
            "questions": _questions(cand, key=False),
        }
    if sheet == "distractor":
        out = {
            "candidate_id": cid,
            "section": cand["section"],
        }
        if "family" in cand:
            out["family"] = cand["family"]
        out["title"] = cand["title"]
        out["passage"] = cand["passage"]
        out["questions"] = _questions(cand, key=True)
        return out
    raise ValueError(f"unknown sheet: {sheet}")


SHEETS = ("blind", "stems", "distractor")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--batch-dir", required=True, type=Path)
    ap.add_argument("--candidates-dir", type=Path,
                    help="default <batch-dir>/candidates")
    ap.add_argument("--check", action="store_true",
                    help="write nothing; exit 1 if any sheet is stale")
    args = ap.parse_args()

    cand_dir = args.candidates_dir or (args.batch_dir / "candidates")
    files = sorted(p for p in cand_dir.glob("*.json"))
    if not files:
        print(f"make_sheets: no candidates in {cand_dir}", file=sys.stderr)
        return 2

    stale, written = [], 0
    for p in files:
        cand = json.loads(p.read_text(encoding="utf-8"))
        if "candidate_id" not in cand or "questions" not in cand:
            continue  # metadata file sharing the dir
        for sheet in SHEETS:
            target = args.batch_dir / sheet / f"{cand['candidate_id']}.json"
            body = json.dumps(build(cand, sheet), ensure_ascii=False, indent=2) + "\n"
            if args.check:
                # Compare CONTENT, not bytes: the contract is that a sheet holds
                # exactly the candidate's projected fields. Sheets written by an
                # earlier serializer differ in indent/ordering while being
                # perfectly in sync, and reporting those as stale would train
                # the reader to ignore this gate.
                if not target.exists():
                    stale.append(f"{sheet}/{cand['candidate_id']}.json (missing)")
                else:
                    try:
                        current = json.loads(target.read_text(encoding="utf-8"))
                    except json.JSONDecodeError:
                        stale.append(f"{sheet}/{cand['candidate_id']}.json (unparseable)")
                        continue
                    if current != build(cand, sheet):
                        stale.append(f"{sheet}/{cand['candidate_id']}.json")
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(body, encoding="utf-8")
                written += 1

    if args.check:
        if stale:
            print(f"make_sheets --check: {len(stale)} STALE sheet(s):")
            for s in stale:
                print(f"  - {s}")
            return 1
        print(f"make_sheets --check: all sheets current ({len(files)} units x {len(SHEETS)})")
        return 0

    print(f"make_sheets: wrote {written} sheet(s) for {len(files)} unit(s) -> "
          f"{', '.join(SHEETS)}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

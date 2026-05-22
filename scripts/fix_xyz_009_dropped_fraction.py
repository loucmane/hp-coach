#!/usr/bin/env python3
"""Restore the dropped "1/4 av arean av cirkeln B." text in two qids.

Visual /diagnostik walkthrough surfaced host-ver{1,2}-2019-kvant1-XYZ-009
both with prompt "Cirkeln A har radien 3 cm, och dess area är Hur stor
radie har cirkeln B?" — the parser dropped a fraction between "är" and
"Hur stor". The PDF actually reads:

  Cirkeln A har radien 3 cm, och dess area är 1/4 av arean av cirkeln B.
  Hur stor radie har cirkeln B?

(Both exams use the same question — they're sittings of the same
reservprov.) Scanned the corpus for the broader "är Hur" / "av Vad"
pattern; only these two qids matched.

Idempotent.

Usage:
    python3 scripts/fix_xyz_009_dropped_fraction.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

E0 = ""
E1 = ""

FIX_QIDS = [
    "host-ver1-2019-kvant1-XYZ-009",
    "host-ver2-2019-kvant1-XYZ-009",
]

BAD_MARKER = "är Hur stor radie"
NEW_PROMPT = (
    "Cirkeln A har radien 3 cm, och dess area är "
    f"{E0}\\frac{{1}}{{4}}{E1}"
    " av arean av cirkeln B. Hur stor radie har cirkeln B?"
)


def patch_file(path: Path, dry_run: bool) -> int:
    if not path.exists():
        return 0
    data = json.loads(path.read_text())
    changed = 0
    for entry in data:
        if entry.get("qid") not in FIX_QIDS:
            continue
        current = entry.get("prompt") or ""
        if BAD_MARKER not in current:
            if current == NEW_PROMPT:
                # Already fixed
                continue
            print(f"  skip {entry['qid']}: marker absent, manual review")
            continue
        entry["prompt"] = NEW_PROMPT
        print(f"  {entry['qid']}.prompt rewritten")
        changed += 1
    if changed and not dry_run:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return changed


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    total = 0
    for parent_dir in [REPO_ROOT / "data" / "parsed",
                       REPO_ROOT / "app" / "public" / "data"]:
        for name in ("host-ver1-2019.json", "host-ver2-2019.json"):
            total += patch_file(parent_dir / name, args.dry_run)
    print(f"\nTotal: {total} prompt(s) rewritten")
    if args.dry_run:
        print("(dry run — no files written)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

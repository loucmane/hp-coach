#!/usr/bin/env python3
"""Strip page-break / end-of-section footer bleeds from option text.

The parser occasionally lets PDF footer chrome ("– 17 – FORTSÄTT PÅ
NÄSTA SIDA »", "– 23 – Provet är slut. ...") run into the trailing
option's text when an option spans a page break. Surfaced live as
DTK-040 (option D ending with "Provet är slut...") and DTK-031
(option D ending with "FORTSÄTT PÅ NÄSTA SIDA »") during dogfood.

Idempotent: re-running is safe. Strips against the canonical data/
files AND mirrors the result into app/public/data/ so the SPA's
per-exam fetch sees the same file.

Usage:
    python3 scripts/strip_page_footers.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
# Two corpora: data/parsed/ is the raw parser output, app/public/data/
# is the enriched corpus the SPA fetches. The footer bleeds surface in
# app/public/data only (some qids exist there but not in data/parsed —
# the enrichment step adds them), so we sweep both and treat each as
# canonical for the qids it owns.
PARSED_DIR = REPO_ROOT / "data" / "parsed"
APP_PUBLIC_DATA = REPO_ROOT / "app" / "public" / "data"

# Footers seen in the corpus when an option's text spans a page break
# or sits at section end. Patterns are anchored to end-of-string with
# leading whitespace tolerance so they only trim trailing bleeds, not
# mid-string occurrences.
FOOTER_PATTERNS = [
    # `… – 17 – FORTSÄTT PÅ NÄSTA SIDA »` (and trailing whitespace)
    re.compile(r"\s*[–-]\s*\d+\s*[–-]\s*FORTSÄTT PÅ NÄSTA SIDA\s*»?\s*$"),
    # `… – 23 – Provet är slut. finns tid över, kontroLlera dina svar.`
    re.compile(r"\s*[–-]\s*\d+\s*[–-]\s*Provet är slut[^$]*$"),
]


def strip_footers(text: str) -> tuple[str, bool]:
    """Return (cleaned, changed)."""
    cleaned = text
    for pat in FOOTER_PATTERNS:
        cleaned = pat.sub("", cleaned)
    cleaned = cleaned.rstrip()
    return cleaned, cleaned != text


def patch_file(path: Path, dry_run: bool) -> int:
    """Return count of option texts patched in this file."""
    data = json.loads(path.read_text())
    touched = 0
    for entry in data:
        for opt in entry.get("options", []) or []:
            cleaned, changed = strip_footers(opt.get("text", ""))
            if changed:
                opt["text"] = cleaned
                touched += 1
                print(f"  {entry['qid']} opt {opt.get('letter','?')}: -> {cleaned!r}")
    if touched > 0 and not dry_run:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return touched


def sweep_dir(directory: Path, dry_run: bool) -> int:
    total = 0
    print(f"Sweeping {directory}...")
    for path in sorted(directory.glob("*.json")):
        if path.name.startswith("_") or path.name == "hp_databas.json":
            continue
        n = patch_file(path, dry_run)
        if n > 0:
            print(f"  {path.name}: {n} option(s) cleaned")
            total += n
    return total


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    parsed_n = sweep_dir(PARSED_DIR, args.dry_run)
    public_n = sweep_dir(APP_PUBLIC_DATA, args.dry_run)

    print(f"\nTotals: {parsed_n} in data/parsed · {public_n} in app/public/data")
    if args.dry_run:
        print("(dry run — no files written)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

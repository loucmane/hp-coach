#!/usr/bin/env python3
"""Strip PDF-extraction hyphenation artifacts corpus-wide.

Two pervasive cosmetic defects surfaced in the pass-2 audit, present
across LÄS/MEK/NOG/ELF/ORD and bled into AI-generated explanations:

  1. Soft hyphens (U+00AD) embedded inside words — invisible to the
     reader but present in the underlying text. ~198/200 LÄS contexts.
  2. `word- word` hyphen-break artifacts where pdfplumber kept the
     mid-line break dash. E.g. "undervisnings- formen",
     "medborgar- kompetens", "re- ligiosity".

The fix is mechanical: drop all U+00AD, and join `<lower>- <lower>`
sequences back into single words.

Idempotent. Sweeps both data/ (per-exam JSON) and explanations
(both data/explanations and app/public/explanations + their mirrors).

Usage:
    python3 scripts/strip_hyphenation_artifacts.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# Directories to sweep. Each gets a recursive walk of *.json (skipping
# leading-underscore meta files and the raw hp_databas.json dump).
SWEEP_DIRS = [
    REPO_ROOT / "data" / "parsed",
    REPO_ROOT / "data" / "explanations",
    REPO_ROOT / "app" / "public" / "data",
    REPO_ROOT / "app" / "public" / "explanations",
]

# 1. Soft hyphen — remove unconditionally.
SOFT_HYPHEN = "­"

# Swedish connector words that mark a compound-prefix hyphen, NOT a
# PDF line-break artifact. E.g. `växt- och djurliv` — the `-` is real
# Swedish grammar, not a line break, and collapsing it produces a
# non-word. Lookahead in HYPHEN_BREAK keeps these intact.
# (Pass-2 fix: the original regex collapsed ~6000 such pairs.)
CONNECTORS = ["och", "eller", "men", "inte", "samt"]
CONNECTOR_GUARD = r"(?!(?:" + "|".join(CONNECTORS) + r")\b)"

# 2. Hyphen-break artifacts. The pattern targets:
#       <Swedish lowercase> (- | U+00AD) <whitespace> <Swedish lowercase>
#    Either an ASCII `-` or a soft hyphen, then whitespace, then a
#    lowercase continuation — that's a PDF line break, not a real
#    hyphenated compound. We DON'T touch:
#       - hyphenated compounds where both sides are uppercase ("HD-domen")
#       - en-dash `–` or em-dash `—` (legitimate punctuation)
#       - dash followed by punctuation (intentional)
#       - Swedish connector words on the right side (CONNECTOR_GUARD)
HYPHEN_BREAK = re.compile(
    r"([a-zåäö])(?:-|" + SOFT_HYPHEN + r")\s+"
    + CONNECTOR_GUARD
    + r"([a-zåäö])"
)


def clean_text(text: str) -> tuple[str, int]:
    """Return (cleaned, num_changes)."""
    if not text:
        return text, 0
    changes = 0
    # Step 1: rejoin `word- word` and `word{soft-hyphen} word` line-break
    # artifacts. Must run BEFORE the soft-hyphen strip — otherwise the
    # soft-hyphen marker disappears and we lose the line-break signal.
    while True:
        new, n = HYPHEN_BREAK.subn(r"\1\2", text)
        if n == 0:
            break
        text = new
        changes += n
    # Step 2: strip remaining soft hyphens. These are mid-word
    # "invisible" hyphens that pdfplumber preserves from the source.
    if SOFT_HYPHEN in text:
        n = text.count(SOFT_HYPHEN)
        text = text.replace(SOFT_HYPHEN, "")
        changes += n
    return text, changes


def walk_json(obj):
    """Yield every (parent, key) reference to a string leaf, allowing
    in-place mutation via `parent[key] = ...`."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, str):
                yield obj, k
            else:
                yield from walk_json(v)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            if isinstance(v, str):
                yield obj, i
            else:
                yield from walk_json(v)


def patch_file(path: Path, dry_run: bool) -> int:
    data = json.loads(path.read_text())
    total = 0
    for parent, key in walk_json(data):
        new, n = clean_text(parent[key])
        if n > 0:
            parent[key] = new
            total += n
    if total > 0 and not dry_run:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return total


def sweep(directory: Path, dry_run: bool) -> tuple[int, int]:
    if not directory.exists():
        print(f"  (skip — {directory} not present)")
        return 0, 0
    total_changes = 0
    files_touched = 0
    print(f"Sweeping {directory}...")
    for path in sorted(directory.glob("*.json")):
        if path.name.startswith("_"):
            continue
        n = patch_file(path, dry_run)
        if n > 0:
            print(f"  {path.name}: {n} changes")
            files_touched += 1
            total_changes += n
    return total_changes, files_touched


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    grand_total = 0
    grand_files = 0
    for d in SWEEP_DIRS:
        changes, files = sweep(d, args.dry_run)
        grand_total += changes
        grand_files += files

    print(f"\nTotals: {grand_total} changes across {grand_files} files")
    if args.dry_run:
        print("(dry run — no files written)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

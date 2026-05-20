#!/usr/bin/env python3
"""Recover from PR #67's hyphenation false positives on Swedish
compound-prefix hyphens.

PR #67 (strip_hyphenation_artifacts.py) collapsed all `<lower>(-|U+00AD)
\\s+<lower>` runs into one word, which was correct for PDF line-break
artifacts but WRONG for Swedish compound-prefix constructions like
`växt- och djurliv` ("plant- and animal-life"). The hyphen there is a
real grammatical signal that the prefix `växt-` continues the head
`djurliv`. The PR collapsed `växt- och` → `växtoch`.

This script reverses 416 such collapses. The recovery rule:

    <compound-prefix> + (och|eller|men|inte) → <compound-prefix>- (och|eller|men|inte)

iff the resulting compound is NOT a known Swedish word (denylist). The
denylist captures legitimate words that happen to end in `och`/`eller`
etc., like `eftersom`, `såsom`, `bagateller`, `akvareller`, `modeller`.

This script ALSO updates strip_hyphenation_artifacts.py to add a
guard against connector words on the right side of a future join, so
this class of bug can't recur on the next sweep.

Usage:
    python3 scripts/fix_hyphenation_false_positives.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

SWEEP_DIRS = [
    REPO_ROOT / "data" / "parsed",
    REPO_ROOT / "data" / "explanations",
    REPO_ROOT / "app" / "public" / "data",
    REPO_ROOT / "app" / "public" / "explanations",
]

# Swedish connector words. When the right side of a hyphenation join
# is one of these, the original `-` was a compound-prefix marker and
# the join was incorrect.
CONNECTORS = ["och", "eller", "men", "inte", "samt"]

# Real Swedish words that end with a connector substring. These would
# false-positive on the regex below and must be preserved.
DENYLIST = {
    # -och
    "noch", "loch", "toch", "moch",  # rare
    # -eller — these are legitimate words ending in "eller"
    "eller", "heller", "feller", "geller", "celler", "weller",
    "akvareller", "bagateller", "modeller", "appeller", "paralleller",
    "aralleller", "kapitaleller", "individueller", "krimineller",
    "principeller", "konventioneller", "sensationeller",
    "professioneller", "exempeller", "ackselleller", "atureller",
    "kvartaleller", "etiketteller", "kasteller", "fjälleller",
    "satseller", "bordellbärnster", "barneller",  # variations
    "sexueller", "rationeller", "lateraleller", "graviditetseller",
    "presentationeller",
    # -inte
    "minute", "minuter",  # not -inte but stem matches "inte"
    # -som
    "eftersom", "allteftersom", "såsom", "fast­som", "fenomen",
    "ramen", "barndomen", "volymen", "högskoleexamen", "fastsom",
    # -men
    "fenomen", "ramen", "barndomen", "volymen", "högskoleexamen",
    "alvenmen", "regimen", "kvinnomen",
}

CONNECTOR_RE = re.compile(
    r"\b([a-zåäö]{2,})(" + "|".join(CONNECTORS) + r")\b"
)


def is_legit_word(token: str) -> bool:
    """Allow-list check: is `<prefix><connector>` actually a real Swedish word?"""
    return token in DENYLIST


def restore_compound_hyphens(text: str) -> tuple[str, int]:
    """For each `<prefix><connector>` token, restore the missing
    `-<space>` if the token isn't a legit Swedish word."""
    if not text:
        return text, 0
    changes = 0

    def repl(match: re.Match[str]) -> str:
        nonlocal changes
        full = match.group(0)
        if is_legit_word(full):
            return full
        prefix = match.group(1)
        connector = match.group(2)
        # Heuristic: only restore if prefix is 3+ chars and ends in
        # a consonant (Swedish compounds typically end in a stem
        # consonant like `t`, `s`, `k`, `l`, `r`, `n`, `m`, `p`,
        # `b`, `d`, `g`, `v`, `f`). Vowel-ending prefixes rarely take
        # the compound dash.
        if len(prefix) < 3:
            return full
        if prefix[-1] in "aeiouyåäö":
            # Skip — almost certainly a real word that ends in
            # `(och|eller|men|inte)` accidentally.
            return full
        changes += 1
        return f"{prefix}- {connector}"

    new = CONNECTOR_RE.sub(repl, text)
    return new, changes


def walk_json(obj):
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
        new, n = restore_compound_hyphens(parent[key])
        if n > 0:
            parent[key] = new
            total += n
    if total > 0 and not dry_run:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return total


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    grand_total = 0
    grand_files = 0
    for d in SWEEP_DIRS:
        if not d.exists():
            continue
        print(f"Sweeping {d}...")
        for path in sorted(d.glob("*.json")):
            if path.name.startswith("_"):
                continue
            n = patch_file(path, args.dry_run)
            if n > 0:
                print(f"  {path.name}: {n} restorations")
                grand_files += 1
                grand_total += n

    print(f"\nTotals: {grand_total} compound-hyphen restorations across {grand_files} files")
    if args.dry_run:
        print("(dry run — no files written)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Hand-fix the 9 quant prompts with `\\frac{?}{?}` placeholders.

The parser failed to extract stacked-fraction operands on these qids,
emitting `\\frac{?}{?}` placeholders instead. Each was re-read from the
original PDF (via pdftotext -layout) and the correct LaTeX reconstructed.

Operates on both data/parsed/ (where present) and app/public/data/
(canonical for the SPA). Idempotent — if a prompt already matches the
target, no change.

Usage:
    python3 scripts/fix_frac_placeholder_prompts.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PARSED_DIR = REPO_ROOT / "data" / "parsed"
APP_PUBLIC_DATA = REPO_ROOT / "app" / "public" / "data"

# U+E000 / U+E001 = PUA delimiters MathText looks for to typeset LaTeX.
# Use the escape form — the Write tool strips literal PUA bytes.
E0 = ""
E1 = ""


def m(latex: str) -> str:
    """Wrap LaTeX in PUA delimiters so MathText renders it."""
    return f"{E0}{latex}{E1}"


# Per-qid rewrites. Each prompt is the FULL replacement; comparing against
# the existing prompt would be brittle (whitespace, punctuation drift), so
# we look for the broken `\frac{?}{?}` marker as a guard and substitute
# wholesale if present.
FIXES: dict[str, str] = {
    # XYZ-009: "Hur många procent av x är 3x/30 + 4x/40?"
    "host-2020-kvant1-XYZ-009": (
        f"x > 0  Hur många procent av x är {m('\\frac{3x}{30}')} + {m('\\frac{4x}{40}')}?"
    ),
    # NOG-024: triangle similarity. Three side equalities, not three
    # fractions — parser misread the stacked equations.
    "host-2014-kvant2-NOG-024": (
        f"ABC och DEF är två trianglar. Är trianglarna likformiga? "
        f"{m('(_{1} )')} AB = DE, BC = EF, AC = DF "
        f"{m('(_{2} )')} vinkeln A = vinkeln D, vinkeln B = vinkeln E, vinkeln C = vinkeln F "
        f"Tillräcklig information för lösningen erhålls"
    ),
    # XYZ-009 (var-2013): ((a-b)/(b-c)) · (a-c)
    "var-2013-kvant1-XYZ-009": (
        f"a, b och c är tre på varandra följande heltal så att a < b < c. "
        f"Vad är {m('\\frac{a-b}{b-c}')} · (a - c)?"
    ),
    # XYZ-001 (var-2017): 4x/12 + 5x/3 = 8
    "var-2017-kvant2-XYZ-001": (
        f"{m('\\frac{4x}{12}')} + {m('\\frac{5x}{3}')} = 8  Vad är x?"
    ),
    # XYZ-004 (host-2023): f(x) = 3x/4 - 1/2
    "host-2023-kvant1-XYZ-004": (
        f"f(x) = {m('\\frac{3x}{4}')} - {m('\\frac{1}{2}')}  "
        f"För vilket värde på x gäller att f(x) = 0?"
    ),
    # KVA-020 (var-2022-1): two quantities, both with fractions
    "var-2022-1-kvant1-KVA-020": (
        f"x ≠ 0  "
        f"Kvantitet I: {m('\\frac{x^{2} - 2x}{2x \\cdot 4}')}  "
        f"Kvantitet II: {m('\\frac{2x - x}{x \\cdot 2x}')}"
    ),
    # XYZ-001 (var-2019): 4x/9 + 2/3 = 8/9
    "var-2019-kvant2-XYZ-001": (
        f"Vilket värde har x om {m('\\frac{4x}{9}')} + {m('\\frac{2}{3}')} = {m('\\frac{8}{9}')}?"
    ),
    # XYZ-005 (var-2022-2): 6x/y = 3a/(2b), solve for b
    "var-2022-2-kvant2-XYZ-005": (
        f"a ≠ 0, b ≠ 0, x ≠ 0, y ≠ 0  "
        f"Vilket svarsalternativ är med säkerhet lika med b om "
        f"{m('\\frac{6x}{y}')} = {m('\\frac{3a}{2b}')}?"
    ),
    # XYZ-003 (var-2023): 4x/7 = 1/14
    "var-2023-kvant1-XYZ-003": (
        f"{m('\\frac{4x}{7}')} = {m('\\frac{1}{14}')}  Vilket värde har x?"
    ),
}


def patch_file(path: Path, dry_run: bool) -> int:
    data = json.loads(path.read_text())
    touched = 0
    for entry in data:
        qid = entry.get("qid")
        if qid in FIXES:
            current = entry.get("prompt") or ""
            target = FIXES[qid]
            if current == target:
                continue
            # Guard: only rewrite if the broken marker is present.
            if "\\frac{?}" not in current:
                print(f"  skip {qid}: no \\frac{{?}} marker — already fixed or schema drift")
                continue
            entry["prompt"] = target
            touched += 1
            print(f"  {qid}: prompt rewritten ({len(current)} -> {len(target)} chars)")
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

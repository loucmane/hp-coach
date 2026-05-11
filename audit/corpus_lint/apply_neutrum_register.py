"""Fix neutrum-agreement bugs on ett-word nouns where the preceding
adjective dropped the -t suffix.

Pattern repeatedly flagged by Pass-1: `[adj]isk register` (and variants
`-lig`, `-ig`) where `register` is ett-word — the adjective needs the
neuter -t form (`[adj]iskt register`).

Same bug applies to other recurring ett-nouns: intresse, tvärsnitt,
mått, gap, utrymme, besök, tillägg, omtal, fenomen, värde, modeord,
perspektiv, samband, kunskap (NO — kunskap is en-word), system,
ekvationssystem, förhållande, regn, överflöd, humör, välbefinnande,
markskikt, argument, fördärv, ledet (definite of `led`),
grundkriterium, initiativ.

Strategy: for each ett-noun in the target list, find any preceding
ADJECTIVE that ends in `-isk`, `-lig`, or `-ig` (en-form) and replace
with the -t neuter form. Case-preserving.

This is conservative — only the listed nouns trigger replacement.
False positives would require a different ett-noun NOT in the list,
which is unlikely given the agent's curated set.

Usage:
    python3 audit/corpus_lint/apply_neutrum_register.py            # dry run
    python3 audit/corpus_lint/apply_neutrum_register.py --apply
"""
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent

# Ett-word nouns the agents have flagged as taking en-form adjectives.
# These are the targets of the fix; the regex only fires when the
# preceding adjective ends in -isk/-lig/-ig.
ETT_NOUNS = [
    'register',
    'intresse',
    'tvärsnitt',
    'mått',
    'kvalitetsmått',
    'gap',
    'utrymme',
    'besök',
    'tillägg',
    'omtal',
    'fenomen',
    'modeord',
    'perspektiv',
    'samband',
    'system',
    'ekvationssystem',
    'förhållande',
    'regn',
    'överflöd',
    'humör',
    'välbefinnande',
    'markskikt',
    'argument',
    'fördärv',
    'ledet',
    'initiativ',
    'arkitektoniskt utrymme',  # technically not needed but covers compound
    'tänkande',  # neutrum
    'uttalande',  # neutrum
    'grundkriterium',  # neutrum
    'minimum',  # neutrum
    'maximum',  # neutrum
    'medel',  # neutrum
    'värde',  # neutrum
]


def make_pattern(noun: str) -> re.Pattern:
    """Build a regex matching `[ADJ-isk|lig|ig] <noun>` where ADJ is
    a single word ending in -isk/-lig/-ig (en-form).

    Captures (adj-stem, suffix, noun) so we can rewrite to -t form.
    """
    # adj = word-char-class+ but NOT ending in -t already
    # Match: word_boundary + (\w+?)(isk|lig|ig) + space + noun + word_boundary
    # Exclude already-correct -iskt/-ligt/-igt
    return re.compile(
        r'(?<!\w)([A-ZÅÄÖa-zåäö]+?)(isk|lig|ig)(\s+)(' + re.escape(noun) + r')(?!\w)',
    )


def fix_token(match: re.Match) -> str:
    """Replace `[adj]isk noun` with `[adj]iskt noun` preserving case."""
    stem, suffix, space, noun = match.group(1), match.group(2), match.group(3), match.group(4)

    # If the adj is ALL CAPS, return ALL CAPS variant
    full = stem + suffix
    if full.isupper():
        new_suffix = (suffix + 't').upper()
    else:
        new_suffix = suffix + 't'
    return stem + new_suffix + space + noun


def apply_to_text(text: str, counts: dict) -> str:
    """Walk all ett-nouns and apply the agreement fix."""
    if not isinstance(text, str):
        return text
    for noun in ETT_NOUNS:
        pat = make_pattern(noun)
        new_text, n = pat.subn(fix_token, text)
        if n > 0:
            counts[noun] += n
            text = new_text
    return text


def walk_json_file(path: Path, counts: dict, dry_run=True) -> bool:
    """Recursively walk JSON file and apply fixes to string fields."""
    data = json.loads(path.read_text())
    changed = [False]

    def recurse(obj):
        if isinstance(obj, str):
            new = apply_to_text(obj, counts)
            if new != obj:
                changed[0] = True
            return new
        if isinstance(obj, list):
            return [recurse(x) for x in obj]
        if isinstance(obj, dict):
            return {k: recurse(v) for k, v in obj.items()}
        return obj

    new_data = recurse(data)
    if changed[0] and not dry_run:
        path.write_text(json.dumps(new_data, ensure_ascii=False, indent=2))
    return changed[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()

    counts = defaultdict(int)
    files_changed = []
    targets = [
        ('data/explanations', '*.json'),
        ('data/parsed', '*.json'),
        ('frameworks', '*.json'),
    ]
    for dirpath, pattern in targets:
        d = ROOT / dirpath
        if not d.exists():
            continue
        for f in sorted(d.glob(pattern)):
            if f.name.startswith('_'):
                continue
            if walk_json_file(f, counts, dry_run=not args.apply):
                files_changed.append(str(f.relative_to(ROOT)))

    print('━' * 60)
    print('Neutrum-agreement fixes (per ett-noun)')
    print('━' * 60)
    total = 0
    for noun in sorted(counts, key=lambda k: -counts[k]):
        n = counts[noun]
        total += n
        print(f'  {noun:30} {n:>4}')
    print('━' * 60)
    print(f'  TOTAL                          {total:>4}')
    print()
    print(f'Files changed: {len(files_changed)}')
    if args.apply:
        print('Mode: APPLIED')
    else:
        print('Mode: DRY RUN (re-run with --apply)')


if __name__ == '__main__':
    main()

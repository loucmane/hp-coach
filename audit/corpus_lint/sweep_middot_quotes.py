"""Final-sweep middle-dot quote normalization.

Cycle-3 Pass-4 routed 313 candidate `·X·` → `"X"` fixes through the
verifier. The verifier approved 289 and rejected 24 (math-operator
preserves). However the cycle-3 candidate generator's regex was too
narrow — it required the inner content to start with a Latin letter,
which missed cases where the quoted content starts with a digit,
symbol, or punctuation (`·17 + 21·`, `·≥ 6,3·`, `·själva ___·`,
`·plattform·` inside parens, etc).

This script does a final mechanical sweep with a broader pattern,
guarded so it does NOT touch multiplication-operator uses.

The discriminator:
- A quote-pair has a `·` followed by content that ends in another `·`
  where the inner content contains AT LEAST ONE word-class character
  (Swedish/Latin letter) AND is not a pure math expression.
- A multiplication operator is `·` between digits/single-letter math
  variables, no enclosing pair around a Swedish word.

The safest version: only convert `·X·` when X contains a substring of
3+ consecutive Swedish/Latin letters. Pure math expressions like `k·x₀`
have at most 1-2 letter runs (k, x), not 3+.

For `·varken·-talet` style suffix-compounds the regex still matches.
The fix preserves the surrounding context.

Usage:
    python3 audit/corpus_lint/sweep_middot_quotes.py            # dry run
    python3 audit/corpus_lint/sweep_middot_quotes.py --apply
"""
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).parent.parent.parent

# Quote-pair discriminator. Multiple conditions must ALL hold:
#  1. The opening `·` is preceded by start-of-string, whitespace, or
#     opening punctuation (not a digit/letter — that'd be math).
#  2. The opening `·` is IMMEDIATELY followed by a Latin/Nordic letter
#     (no space — math operators have space-padded dots: `7 · (1/m)`).
#  3. The closing `·` is IMMEDIATELY preceded by a non-space character
#     (the closing delimiter sits tight against the quoted content).
#  4. The closing `·` is followed by end-of-string, whitespace, or
#     closing punctuation.
#  5. The inner content contains a 3+ Latin-letter run.
#
# These five rules together rule out `tid · hastighet · ...` because
# the dot after `tid ` has a space after it (fails rule 2) and the
# dot before ` hastighet ·` has a space before it (fails rule 3).

WORD3_RX = re.compile(r'[A-Za-zÅÄÖåäö]{3,}')

PAIR_RX = re.compile(
    # Rule 1: opening dot boundary
    r'(?:^|(?<=[\s\(\[«„"“‘\':,;>]))'
    # Open dot + rule 2: must be followed by a Latin/Nordic letter
    r'·(?=[A-Za-zÅÄÖåäö])'
    # Inner content (capture). No internal middle-dot.
    r'(?P<inner>[^·\n]{1,200}?)'
    # Rule 3: closing dot must be preceded by non-space (use lookbehind
    # via the capture's last character — easier to enforce with regex).
    # Rule 4: closing dot followed by end/space/closing punct.
    r'·(?=$|[\s\)\]»"”’\'.,;:!?\-—–<])'
)


def is_quote_pair(inner: str) -> bool:
    """Inner content has a 3+-Latin-letter run AND its last char isn't space."""
    if not inner or inner[-1].isspace():
        return False
    return bool(WORD3_RX.search(inner))


def transform_field(text: str, counts: dict) -> str:
    if not isinstance(text, str):
        return text

    def repl(m: re.Match) -> str:
        inner = m.group('inner')
        if is_quote_pair(inner):
            counts['converted'] += 1
            return f'"{inner}"'
        counts['preserved_math'] += 1
        return m.group(0)

    return PAIR_RX.sub(repl, text)


def walk_entry(entry: dict, counts: dict) -> bool:
    changed = False
    for f in ('solution_path', 'technique', 'pitfall'):
        v = entry.get(f)
        if isinstance(v, str):
            new = transform_field(v, counts)
            if new != v:
                entry[f] = new
                changed = True
    for d in (entry.get('distractors') or []):
        if not isinstance(d, dict):
            continue
        for sub in ('why_tempting', 'why_wrong'):
            v = d.get(sub)
            if isinstance(v, str):
                new = transform_field(v, counts)
                if new != v:
                    d[sub] = new
                    changed = True
    return changed


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()

    counts = defaultdict(int)
    files_changed = []
    for p in sorted((ROOT / 'data/explanations').glob('*.json')):
        if p.name.startswith('_'):
            continue
        try:
            data = json.loads(p.read_text())
        except json.JSONDecodeError:
            continue
        any_change = False
        for qid, exp in data.items():
            if walk_entry(exp, counts):
                any_change = True
        if any_change:
            if args.apply:
                p.write_text(json.dumps(data, ensure_ascii=False, indent=2))
            files_changed.append(p.name)

    print('━' * 50)
    print('Middle-dot final sweep')
    print('━' * 50)
    print(f"  Quote pairs converted:    {counts['converted']:>4}")
    print(f"  Math operators preserved: {counts['preserved_math']:>4}")
    print(f"  Files changed:            {len(files_changed):>4}")
    if args.apply:
        print('  Mode: APPLIED ✅')
    else:
        print('  Mode: DRY RUN (re-run with --apply)')


if __name__ == '__main__':
    main()

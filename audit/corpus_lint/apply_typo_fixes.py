"""Apply curated parser-typo fixes across the corpus.

Reads `audit/corpus_lint/typo_fixes.json` (hand-curated list of 59
verified letter-swap typos with high-confidence corrections). Applies
each replacement across:

- data/parsed/*.json (gitignored — local-only changes)
- data/explanations/*.json (committed)
- frameworks/*.json (committed)

Uses word-boundary regex so substrings within legitimate words don't
get affected. Capitalized variants handled by case-preservation
heuristic: if the source token appears Capitalized, replace with
Capitalized correct form.

USAGE:
    python3 audit/corpus_lint/apply_typo_fixes.py            # dry run
    python3 audit/corpus_lint/apply_typo_fixes.py --apply    # write

Idempotent: re-running on already-fixed corpus is a no-op.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent
ROOT = SCRIPT_DIR.parent.parent


def build_replacements(fix_list: list[dict]) -> list[tuple[re.Pattern, str, str]]:
    """Build (pattern, replacement, label) tuples that handle case.

    Each typo gets two patterns:
    - Exact lowercase form → lowercase correct
    - Capitalized form (Token) → Capitalized correct (Correct)
    """
    out = []
    for fix in fix_list:
        typo = fix['typo']
        correct = fix['correct']

        # Capitalized variant
        typo_cap = typo[0].upper() + typo[1:]
        correct_cap = correct[0].upper() + correct[1:]

        # Pattern 1: lowercase (or as-is in typo)
        # Use word boundary; allow hyphens within typo (e.g. häs-, mäk-)
        pat = re.compile(r'\b' + re.escape(typo) + r'\b', re.IGNORECASE)
        out.append((pat, correct, typo))

        # If the typo started uppercase explicitly in source, also match
        # (the IGNORECASE flag handles this already, but we want Cap
        # corrects when source was Cap)
    return out


def build_phrase_replacements(phrase_list: list[dict]) -> list[tuple[re.Pattern, str, str]]:
    """Build phrase-level (multi-word) replacements with case preservation.

    Phrases match boundary-anchored at both ends but allow internal
    spaces and hyphens. Case logic mirrors apply_to_text: ALL CAPS,
    Capitalized, lowercase.
    """
    out = []
    for fix in phrase_list:
        phrase = fix['phrase']
        correct = fix['correct']
        pat = re.compile(r'(?<!\w)' + re.escape(phrase) + r'(?!\w)', re.IGNORECASE)
        out.append((pat, correct, phrase))
    return out


def apply_to_text(text: str, replacements: list, counts: dict) -> str:
    """Apply each replacement, preserving case based on the match.

    Three cases handled:
    - ALL CAPS (`HÖFLIG` → `HÖVLIG`)
    - Capitalized (`Höflig` → `Hövlig`)
    - lowercase (`höflig` → `hövlig`)
    """
    if not isinstance(text, str):
        return text
    for pat, correct, label in replacements:
        def _repl(m, _correct=correct):
            matched = m.group(0)
            if matched.isupper() and len(matched) > 1:
                return _correct.upper()
            elif matched and matched[0].isupper():
                return _correct[0].upper() + _correct[1:]
            return _correct
        new_text, n = pat.subn(_repl, text)
        if n > 0:
            counts[label] += n
        text = new_text
    return text


def walk_json_file(path: Path, replacements, counts, dry_run=True):
    """Walk all string fields in a JSON file and apply replacements."""
    data = json.loads(path.read_text())
    file_changed = [False]

    def recurse(obj):
        if isinstance(obj, str):
            new = apply_to_text(obj, replacements, counts)
            if new != obj:
                file_changed[0] = True
            return new
        elif isinstance(obj, list):
            return [recurse(x) for x in obj]
        elif isinstance(obj, dict):
            return {k: recurse(v) for k, v in obj.items()}
        return obj

    new_data = recurse(data)
    if file_changed[0] and not dry_run:
        path.write_text(json.dumps(new_data, ensure_ascii=False, indent=2))
    return file_changed[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true', help='Write changes (default: dry run)')
    ap.add_argument('--fix-list', default=str(SCRIPT_DIR / 'typo_fixes.json'))
    args = ap.parse_args()

    fixes = json.loads(Path(args.fix_list).read_text())
    fix_list = fixes['fix']
    phrase_list = fixes.get('phrase_fix', [])
    print(f'Loaded {len(fix_list)} verified word fixes + {len(phrase_list)} phrase fixes from {args.fix_list}')

    # Phrase replacements run FIRST (greedy multi-token match), then
    # single-word replacements. Order matters because a phrase like
    # "sluten system" must be caught as a phrase before the word-level
    # `sluten` check (which wouldn't fire here anyway, but principle).
    replacements = build_phrase_replacements(phrase_list) + build_replacements(fix_list)

    counts = defaultdict(int)
    files_changed = []

    # Walk all corpus sources, including the SPA-served copy.
    #
    # app/public/data was missed by the original Phase D.1 pass (commit
    # 574b88e). The Phase B parser re-run (2ca24eb, "Scale parser to all
    # 27 exams") regenerated those files from scratch without rerunning
    # the typo pass, so 'Kvanttiet' (294 instances) and 'otlilräcklig'
    # (294 instances) came back at the parser source. Cover it here too;
    # parser/build_all.py invokes this script as a post-parse step
    # (Phase D.1.5) so future re-parses stay clean.
    targets = [
        ('data/explanations', '*.json'),
        ('data/parsed', '*.json'),
        ('frameworks', '*.json'),
        ('app/public/data', '*.json'),
    ]
    for dirpath, pattern in targets:
        d = ROOT / dirpath
        if not d.exists():
            continue
        for f in sorted(d.glob(pattern)):
            if f.name.startswith('_'):
                continue
            if walk_json_file(f, replacements, counts, dry_run=not args.apply):
                files_changed.append(str(f.relative_to(ROOT)))

    print()
    print('━' * 60)
    print('Replacement counts (per typo)')
    print('━' * 60)
    total = 0
    for label in sorted(counts, key=lambda k: -counts[k]):
        n = counts[label]
        total += n
        print(f'  {label:25} {n:>5}')
    print('━' * 60)
    print(f'  TOTAL                     {total:>5}')
    print()
    print(f'Files changed: {len(files_changed)}')
    if args.apply:
        print('Mode: APPLIED (writes complete)')
    else:
        print('Mode: DRY RUN (no writes; re-run with --apply)')


if __name__ == '__main__':
    main()

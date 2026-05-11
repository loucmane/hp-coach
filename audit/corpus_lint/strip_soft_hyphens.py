"""Strip U+00AD (soft hyphen) from every string field in the corpus.

The parser used by `bygg_hp_databas.py` left invisible soft-hyphen
characters scattered through extracted PDF text. Pass-1 of the
three-pass audit flagged these across multiple batches; corpus-wide
grep confirms ~11,896 instances in every file.

These are pure parser artifacts — they have no semantic meaning in
the rendered HTML/markdown and just make string fields fragile to
substring matching. Strip everywhere.

Usage:
    python3 audit/corpus_lint/strip_soft_hyphens.py            # dry run
    python3 audit/corpus_lint/strip_soft_hyphens.py --apply    # write
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

SOFT_HYPHEN = '­'
ROOT = Path(__file__).parent.parent.parent


def strip(obj):
    """Recursively strip U+00AD from string fields."""
    if isinstance(obj, str):
        return obj.replace(SOFT_HYPHEN, '')
    if isinstance(obj, list):
        return [strip(x) for x in obj]
    if isinstance(obj, dict):
        return {k: strip(v) for k, v in obj.items()}
    return obj


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()

    targets = [
        ('data/explanations', '*.json'),
        ('data/parsed', '*.json'),
        ('frameworks', '*.json'),
    ]
    total_stripped = 0
    files_changed = 0

    for dirpath, pattern in targets:
        d = ROOT / dirpath
        if not d.exists():
            continue
        for f in sorted(d.glob(pattern)):
            if f.name.startswith('_'):
                continue
            text = f.read_text()
            n = text.count(SOFT_HYPHEN)
            if n == 0:
                continue
            data = json.loads(text)
            clean = strip(data)
            files_changed += 1
            total_stripped += n
            if args.apply:
                f.write_text(json.dumps(clean, ensure_ascii=False, indent=2))
            print(f'  {f.relative_to(ROOT)}: {n} stripped')

    print()
    print(f'Total U+00AD stripped: {total_stripped:,}')
    print(f'Files affected:        {files_changed}')
    if args.apply:
        print('Mode: APPLIED')
    else:
        print('Mode: DRY RUN (re-run with --apply)')


if __name__ == '__main__':
    main()

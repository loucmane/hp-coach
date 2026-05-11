"""Classify every unique token from tokenize.py against:

1. wordfreq zipf score (modern Swedish frequency)
2. archaic.txt (known pre-1906 patterns)
3. anglicisms.txt (known English-bleed)
4. whitelist.txt (legitimate words wordfreq doesn't reliably know)

Output: /tmp/corpus_lint/flags.json — list of suspicious tokens with
provenance (qids where each appears) sorted by classification +
corpus_frequency.

Usage:
    python3 audit/corpus_lint/lint.py
    python3 audit/corpus_lint/lint.py --zipf-threshold 1.0
"""
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path

from wordfreq import zipf_frequency


SCRIPT_DIR = Path(__file__).parent


def load_list(path: Path) -> set[str]:
    """Load a non-empty / non-comment-line list."""
    if not path.exists():
        return set()
    out = set()
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        out.add(line.lower())
    return out


def classify(token: str, freq: int, zipf: float,
             whitelist: set, archaic: set, anglicisms: set,
             zipf_threshold: float = 0.5) -> tuple[str, str]:
    """Return (classification, reason)."""
    if token in whitelist:
        return ('whitelist', 'in whitelist.txt')

    if token in archaic:
        return ('archaic', 'in archaic.txt (pre-1906 spelling reform)')

    if token in anglicisms:
        return ('anglicism', 'in anglicisms.txt (English-bleed)')

    if zipf == 0:
        return ('zero_freq', f'zipf=0 — not in modern Swedish corpus')

    if zipf < zipf_threshold:
        return ('low_freq', f'zipf={zipf:.2f} — uncommon, manual review')

    return ('ok', f'zipf={zipf:.2f}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--tokens', default='/tmp/corpus_lint/tokens.json')
    ap.add_argument('--output', default='/tmp/corpus_lint/flags.json')
    ap.add_argument('--zipf-threshold', type=float, default=0.5,
                    help='Words below this zipf score are flagged as low_freq')
    ap.add_argument('--min-corpus-freq', type=int, default=1,
                    help='Only include tokens that appear at least this many times in the corpus')
    args = ap.parse_args()

    whitelist = load_list(SCRIPT_DIR / 'whitelist.txt')
    archaic = load_list(SCRIPT_DIR / 'archaic.txt')
    anglicisms = load_list(SCRIPT_DIR / 'anglicisms.txt')

    print(f'Loaded: {len(whitelist)} whitelist, {len(archaic)} archaic, '
          f'{len(anglicisms)} anglicisms')

    tokens_data = json.loads(Path(args.tokens).read_text())
    by_token = tokens_data['by_token']
    print(f'Linting {len(by_token):,} unique tokens...')

    flags = defaultdict(list)  # classification -> [token_record, ...]
    stats = defaultdict(int)

    for token, info in by_token.items():
        freq = info['frequency']
        if freq < args.min_corpus_freq:
            continue
        zipf = zipf_frequency(token, 'sv')
        classification, reason = classify(
            token, freq, zipf, whitelist, archaic, anglicisms,
            args.zipf_threshold,
        )
        stats[classification] += 1
        if classification == 'ok':
            continue  # skip OK in output — focus on flags
        flags[classification].append({
            'token': token,
            'classification': classification,
            'reason': reason,
            'zipf': round(zipf, 2),
            'corpus_frequency': freq,
            'sources_sample': info.get('sources_sample', [])[:3],
        })

    # Sort each classification by corpus_frequency desc
    for cls in flags:
        flags[cls].sort(key=lambda x: -x['corpus_frequency'])

    out = {
        'summary': {
            **dict(stats),
            'total_unique_tokens': len(by_token),
            'zipf_threshold': args.zipf_threshold,
        },
        'flags': dict(flags),
    }

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2))

    print()
    print('━' * 60)
    print('Classification summary')
    print('━' * 60)
    for cls in ('ok', 'whitelist', 'archaic', 'anglicism', 'low_freq', 'zero_freq'):
        n = stats.get(cls, 0)
        marker = '✓' if cls == 'ok' else ('—' if cls == 'whitelist' else '⚠')
        print(f'  {marker} {cls:<15} {n:>6,}')
    print('━' * 60)
    actionable = sum(stats.get(c, 0) for c in ('archaic', 'anglicism', 'zero_freq'))
    print(f'  High-priority flags (archaic + anglicism + zero_freq): {actionable:,}')
    print(f'  Manual-review flags (low_freq): {stats.get("low_freq", 0):,}')
    print()
    print(f'Wrote: {out_path} ({out_path.stat().st_size / 1024:.1f} KB)')


if __name__ == '__main__':
    main()

"""Auto-classify zero-frequency tokens into actionable buckets.

After lint.py flags 10,900 zero-freq tokens, this script auto-classifies
each into:

1. PARSER_TYPO — looks like an adjacent-letter swap of a real word
   (e.g. `kvanttiet` ↔ `kvantitet`)
2. SWEDISH_COMPOUND — splits into Swedish morphemes that ARE in wordfreq
   (e.g. `tvåblanksdrag` = `två` + `blanks` + `drag`, all real Swedish)
3. PROPER_NOUN — heuristically a name (Capitalized in original, contains
   foreign diacritics, etc.)
4. RESIDUAL — none of the above. This is the Phase F audit target.

Output: /tmp/corpus_lint/zero_freq_classified.json

Usage:
    python3 audit/corpus_lint/classify_zero_freq.py
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

from wordfreq import zipf_frequency


SCRIPT_DIR = Path(__file__).parent


# ── PARSER_TYPO detection ─────────────────────────────────────────────

# Generate candidate "what was this token supposed to be?" by applying
# common adjacent-letter-swap reversals. If any reversal lands on a
# high-freq Swedish word, we've found the original.

def adjacent_swaps(token: str):
    """Yield all candidate strings produced by swapping adjacent chars."""
    for i in range(len(token) - 1):
        yield token[:i] + token[i+1] + token[i] + token[i+2:]


def suspected_typo(token: str, min_zipf: float = 3.0) -> str | None:
    """Return the likely correct form if a 1-swap edit lands on a
    high-frequency real Swedish word. Otherwise None.

    Threshold: zipf ≥ 3.0 — means the suspected correct form must be
    actually common Swedish (avoids hallucinated corrections).
    """
    for candidate in adjacent_swaps(token):
        z = zipf_frequency(candidate, 'sv')
        if z >= min_zipf:
            return candidate
    return None


# ── SWEDISH_COMPOUND detection ────────────────────────────────────────

# Try to split a long token into 2-4 parts where each part is real
# Swedish. If we find a clean split, it's likely a legitimate compound.

def try_split_into_swedish(token: str, min_part_zipf: float = 2.5,
                            min_part_len: int = 3) -> list[str] | None:
    """Try to split the token into Swedish morphemes.

    Returns the parts if a valid split is found, else None.

    Strategy: dynamic programming, look for splits where every part
    has zipf >= min_part_zipf and length >= min_part_len.
    """
    n = len(token)
    if n < min_part_len * 2:
        return None

    # dp[i] = list of parts ending at position i (None if no valid split)
    dp = [None] * (n + 1)
    dp[0] = []
    for i in range(min_part_len, n + 1):
        # Try every possible last-part starting position
        for j in range(max(0, i - 20), i - min_part_len + 1):
            if dp[j] is None:
                continue
            part = token[j:i]
            if len(part) < min_part_len:
                continue
            z = zipf_frequency(part, 'sv')
            if z >= min_part_zipf:
                # Found a valid split ending here
                dp[i] = dp[j] + [part]
                break  # take the first valid split (could be improved)
    return dp[n]


# ── PROPER_NOUN detection ─────────────────────────────────────────────

PROPER_NOUN_DIACRITICS = re.compile(r'[üçéëîïâóûñœ]')


def looks_like_proper_noun(token: str, sources_sample: list[dict]) -> bool:
    """Heuristics: foreign diacritics, hyphen with both parts capitalizable,
    appears Capitalized in original text.
    """
    # Foreign diacritics → very likely a name
    if PROPER_NOUN_DIACRITICS.search(token):
        return True

    # Compound surnames (hyphenated)
    if '-' in token and any(part for part in token.split('-') if len(part) > 3):
        return True

    return False


# ── Main classification pipeline ──────────────────────────────────────

def classify_zero_freq(flags_path: Path = Path('/tmp/corpus_lint/flags.json')):
    data = json.loads(flags_path.read_text())
    zero = data['flags'].get('zero_freq', [])

    buckets = {
        'PARSER_TYPO': [],
        'SWEDISH_COMPOUND': [],
        'PROPER_NOUN': [],
        'RESIDUAL': [],
    }

    for f in zero:
        token = f['token']
        sources = f.get('sources_sample', [])

        # 1. Proper noun (cheapest check)
        if looks_like_proper_noun(token, sources):
            buckets['PROPER_NOUN'].append({**f, 'classification_reason': 'foreign-diacritic or compound-surname'})
            continue

        # 2. Parser typo (single adjacent swap → real Swedish word)
        suspected = suspected_typo(token)
        if suspected:
            buckets['PARSER_TYPO'].append({
                **f,
                'suspected_correct': suspected,
                'classification_reason': f'1-swap → "{suspected}" (zipf {zipf_frequency(suspected, "sv"):.2f})',
            })
            continue

        # 3. Swedish compound (splits into real morphemes)
        if len(token) >= 8:
            split = try_split_into_swedish(token)
            if split and len(split) >= 2:
                buckets['SWEDISH_COMPOUND'].append({
                    **f,
                    'split': split,
                    'classification_reason': f'splits as {"+".join(split)}',
                })
                continue

        # 4. Residual → Phase F audit target
        buckets['RESIDUAL'].append({
            **f,
            'classification_reason': 'no automatic classification — needs expert audit',
        })

    return buckets


def main():
    buckets = classify_zero_freq()
    out_path = Path('/tmp/corpus_lint/zero_freq_classified.json')
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps({
        'summary': {k: len(v) for k, v in buckets.items()},
        'buckets': buckets,
    }, ensure_ascii=False, indent=2))

    total = sum(len(v) for v in buckets.values())
    print('━' * 60)
    print('Zero-freq classification')
    print('━' * 60)
    for cls in ('PARSER_TYPO', 'SWEDISH_COMPOUND', 'PROPER_NOUN', 'RESIDUAL'):
        n = len(buckets[cls])
        pct = 100 * n / total if total else 0
        print(f'  {cls:<22} {n:>6,}  ({pct:5.1f}%)')
    print('━' * 60)
    print(f'  TOTAL                  {total:>6,}')
    print()
    print(f'Wrote: {out_path}')
    print()
    print('Top 10 PARSER_TYPO (sorted by corpus frequency):')
    for f in sorted(buckets['PARSER_TYPO'], key=lambda x: -x['corpus_frequency'])[:10]:
        print(f'  {f["token"]:25} → {f["suspected_correct"]:25} (freq {f["corpus_frequency"]})')
    print()
    print('Top 10 SWEDISH_COMPOUND:')
    for f in sorted(buckets['SWEDISH_COMPOUND'], key=lambda x: -x['corpus_frequency'])[:10]:
        print(f'  {f["token"]:30} = {" + ".join(f["split"])}')
    print()
    print('Top 10 PROPER_NOUN:')
    for f in sorted(buckets['PROPER_NOUN'], key=lambda x: -x['corpus_frequency'])[:10]:
        print(f'  {f["token"]:30} (freq {f["corpus_frequency"]})')
    print()
    print('Top 10 RESIDUAL (Phase F audit candidates):')
    for f in sorted(buckets['RESIDUAL'], key=lambda x: -x['corpus_frequency'])[:10]:
        print(f'  {f["token"]:30} (freq {f["corpus_frequency"]})')


if __name__ == '__main__':
    main()

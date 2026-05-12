"""Single-entry Swedish-quality lint, callable inline from the generator.

The bulk-corpus lint (`lint.py`) reads pre-tokenized JSON. This module
exposes a function-level API that takes one explanation entry, tokenizes
it inline, and returns a structured lint result. Designed to be called
right after `generate_one()` in `pipeline/explanations/generate.py` so
the generator can either fail the explanation (strict mode) or log a
warning (default).

Tokenization mirrors `extract_tokens.py`:
- Strip math spans wrapped in U+E000…U+E001 (parser KaTeX wrap)
- Strip LaTeX commands and braces
- Skip pure-number, single-letter, and short ALL-CAPS tokens
- ELF section content is exempt (legitimately English)

Lint dictionaries (archaic, anglicism, whitelist) live in this package
and are loaded once on first call.

Result schema:
    {
        "passed": bool,                # archaic/anglicism count == 0
        "anglicism": list[{token, field}],
        "archaic":   list[{token, field}],
        "zero_freq": list[{token, field, zipf}],  # informational
        "summary":   {anglicism_n, archaic_n, zero_freq_n},
    }

passed is True iff anglicism_n + archaic_n == 0. zero_freq is reported
but does not fail the entry — too many false positives on legitimate
Swedish compounds.
"""
from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path
from typing import Any, Iterable

from wordfreq import zipf_frequency


SCRIPT_DIR = Path(__file__).parent

# PUA wrap chars used by the parser to mark KaTeX-rendered math spans.
PUA_OPEN = ''
PUA_CLOSE = ''

MATH_SPAN_RX = re.compile(re.escape(PUA_OPEN) + r'.*?' + re.escape(PUA_CLOSE))
LATEX_RX = re.compile(r'\\[a-zA-Z]+|\\[^a-zA-Z]')
BRACE_RX = re.compile(r'[{}]')
WORD_RX = re.compile(r"[a-zåäöüéèáàA-ZÅÄÖÜÉÈÁÀ][a-zåäöüéèáàA-ZÅÄÖÜÉÈÁÀ'-]*")
NUMBER_RX = re.compile(r'^\d+([.,]\d+)?%?$')

SECTION_RX = re.compile(r'-(XYZ|KVA|NOG|DTK|ORD|LÄS|MEK|ELF)-')


def is_elf(qid: str) -> bool:
    m = SECTION_RX.search(qid or '')
    return bool(m and m.group(1) == 'ELF')


def _load_list(path: Path) -> set[str]:
    if not path.exists():
        return set()
    out: set[str] = set()
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        out.add(line.lower())
    return out


@lru_cache(maxsize=1)
def load_dicts() -> tuple[set[str], set[str], set[str]]:
    """Cached load of (whitelist, archaic, anglicisms)."""
    return (
        _load_list(SCRIPT_DIR / 'whitelist.txt'),
        _load_list(SCRIPT_DIR / 'archaic.txt'),
        _load_list(SCRIPT_DIR / 'anglicisms.txt'),
    )


def _tokens_from_text(text: str) -> Iterable[str]:
    """Yield lower-cased Swedish word tokens from text, mirroring
    extract_tokens.py's filtering."""
    if not isinstance(text, str):
        return
    # Strip math spans (PUA-wrapped KaTeX)
    text = MATH_SPAN_RX.sub(' ', text)
    # Strip LaTeX commands + braces
    text = LATEX_RX.sub(' ', text)
    text = BRACE_RX.sub(' ', text)

    for raw in WORD_RX.findall(text):
        # Numbers: skip
        if NUMBER_RX.match(raw):
            continue
        # Single letter: skip
        if len(raw) <= 1:
            continue
        # Short ALL-CAPS (section codes etc.): skip
        if raw.isupper() and len(raw) <= 4:
            continue
        yield raw.lower()


def _iter_fields(entry: dict) -> Iterable[tuple[str, str]]:
    """Yield (field_label, text) for every Swedish-text field in the entry."""
    for f in ('solution_path', 'technique', 'pitfall'):
        v = entry.get(f)
        if isinstance(v, str) and v.strip():
            yield f, v
    for d in (entry.get('distractors') or []):
        if not isinstance(d, dict):
            continue
        letter = d.get('letter') or '?'
        for sub in ('why_tempting', 'why_wrong'):
            v = d.get(sub)
            if isinstance(v, str) and v.strip():
                yield f'distractor_{letter}_{sub}', v


def lint_entry(entry: dict, qid: str = '',
               zipf_threshold: float = 0.0) -> dict[str, Any]:
    """Lint a single explanation entry.

    Args:
        entry: explanation payload (solution_path / technique / pitfall /
            distractors[]).
        qid: question ID — used to short-circuit ELF entries (English
            content is legitimate there).
        zipf_threshold: words below this score get added to zero_freq.
            Default 0.0 = only flag pure-unknown words.

    Returns the lint result dict (see module docstring).
    """
    whitelist, archaic, anglicisms = load_dicts()

    result = {
        'passed': True,
        'anglicism': [],
        'archaic': [],
        'zero_freq': [],
        'summary': {'anglicism_n': 0, 'archaic_n': 0, 'zero_freq_n': 0},
    }
    if is_elf(qid):
        # ELF content is English by design; skip.
        return result

    seen: set[tuple[str, str]] = set()  # (token, field) — dedup per-field

    for field, text in _iter_fields(entry):
        for tok in _tokens_from_text(text):
            key = (tok, field)
            if key in seen:
                continue
            seen.add(key)

            if tok in whitelist:
                continue
            if tok in archaic:
                result['archaic'].append({'token': tok, 'field': field})
                continue
            if tok in anglicisms:
                result['anglicism'].append({'token': tok, 'field': field})
                continue
            zipf = zipf_frequency(tok, 'sv')
            if zipf <= zipf_threshold:
                result['zero_freq'].append({
                    'token': tok, 'field': field, 'zipf': round(zipf, 2),
                })

    s = result['summary']
    s['anglicism_n'] = len(result['anglicism'])
    s['archaic_n'] = len(result['archaic'])
    s['zero_freq_n'] = len(result['zero_freq'])
    result['passed'] = (s['anglicism_n'] + s['archaic_n']) == 0
    return result


def format_failures(result: dict, max_each: int = 5) -> str:
    """Return a one-line summary of lint failures, suitable for log."""
    if result['passed']:
        return 'lint OK'
    parts = []
    for cls in ('anglicism', 'archaic'):
        items = result.get(cls) or []
        if items:
            sample = ', '.join(f"{x['token']}@{x['field']}" for x in items[:max_each])
            if len(items) > max_each:
                sample += f' (+{len(items) - max_each} more)'
            parts.append(f'{cls}={len(items)} ({sample})')
    return 'LINT FAIL — ' + '; '.join(parts)


if __name__ == '__main__':
    # Smoke test: lint each explanation in data/explanations/*.json and
    # print top failures by exam.
    import argparse
    import json
    from collections import defaultdict

    ap = argparse.ArgumentParser()
    ap.add_argument('--zipf-threshold', type=float, default=0.0)
    ap.add_argument('--max-fail-print', type=int, default=10)
    args = ap.parse_args()

    root = SCRIPT_DIR.parent.parent
    by_exam: dict[str, dict[str, int]] = defaultdict(lambda: {'n': 0, 'failed': 0, 'samples': []})
    overall_failed = 0
    overall_n = 0

    for p in sorted((root / 'data/explanations').glob('*.json')):
        if p.name.startswith('_'):
            continue
        try:
            data = json.loads(p.read_text())
        except json.JSONDecodeError:
            continue
        for qid, exp in data.items():
            overall_n += 1
            by_exam[p.stem]['n'] += 1
            r = lint_entry(exp, qid, args.zipf_threshold)
            if not r['passed']:
                overall_failed += 1
                by_exam[p.stem]['failed'] += 1
                if len(by_exam[p.stem]['samples']) < 3:
                    by_exam[p.stem]['samples'].append((qid, format_failures(r)))

    print('━' * 60)
    print('Per-exam lint summary')
    print('━' * 60)
    for exam, stats in sorted(by_exam.items()):
        if stats['failed']:
            print(f"  {exam:30} {stats['failed']:>3} fail / {stats['n']:>3}")
            for qid, msg in stats['samples']:
                print(f"      {qid}: {msg}")
        else:
            print(f"  {exam:30} clean ({stats['n']})")
    print('━' * 60)
    print(f'  TOTAL FAILED: {overall_failed} / {overall_n}')

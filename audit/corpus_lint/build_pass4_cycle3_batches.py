"""Build cycle-3 Pass-4 batches from mechanical-cleanup candidates.

Per user META decisions:
- Middle-dot U+00B7 used as quote marker → standard Swedish double-quotes.
  Discriminate from middle-dot used as multiplication operator (between
  digits) — only flag pairs where the inner content starts with a letter
  and contains no internal middle-dot.
- 'hitta i texten själv X' / 'hitta texten själv om X' templates
  → 'hitta själv i texten X' (user's chosen canonical form).

Each candidate becomes a Pass-4 input record. Pass-4 will read each in
entry-context and verdict fix-OK / propose-alternative / fix-wrong; the
mechanical nature means most should be fix-OK with a few preserve-context
adjustments.

Usage:
    python3 audit/corpus_lint/build_pass4_cycle3_batches.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent
ROOT = SCRIPT_DIR.parent.parent
QUALITY_DIR = Path('/tmp/quality')

# `·` is U+00B7 (middle dot)
MIDDOT = '·'
# Pair pattern: ·<inner>· where inner starts with a letter (Latin or Nordic)
# and contains no internal middle-dot. Allow alphanumerics, spaces, common
# punctuation inside the quote.
MIDDOT_PAIR_RX = re.compile(
    r'·([A-Za-zÅÄÖåäö][^·\n]{0,200}?)·'
)

# 'hitta i texten själv X' or 'hitta texten själv om X' or 'hitta texten själv X'
HITTA_RX = re.compile(
    r'hitta\s+(?:i\s+texten\s+själv|texten\s+själv\s+om|texten\s+själv)\s+(\S[^\.\?\!]*[^\.\?\!\s])',
    re.IGNORECASE,
)


def is_likely_math_context(text: str, match_start: int, match_end: int) -> bool:
    """Heuristic: if the snippet's inner content contains an `=` and digits
    only, it's almost certainly a math expression — leave middle-dots alone.
    """
    inner_start = match_start + 1
    inner_end = match_end - 1
    inner = text[inner_start:inner_end]
    # Has equals or only digits-and-math-chars
    if '=' in inner and re.search(r'\d', inner):
        return True
    # Pure numeric expression like "12 · 6" — but our pattern requires
    # leading letter so this case is excluded already.
    return False


def find_middot_candidates(explanations: dict[str, dict]) -> list[dict]:
    """Walk all entry fields; find ·X· quote pairs and emit candidate fixes."""
    cands = []
    for qid, exp in explanations.items():
        for field in ('solution_path', 'technique', 'pitfall'):
            v = exp.get(field)
            if isinstance(v, str):
                for m in MIDDOT_PAIR_RX.finditer(v):
                    if is_likely_math_context(v, m.start(), m.end()):
                        continue
                    snippet = m.group(0)
                    inner = m.group(1)
                    # Standard Swedish double-quote pair " (U+0022)
                    fix = f'"{inner}"'
                    cands.append({
                        'qid': qid,
                        'class': 'style',
                        'snippet': snippet,
                        'suggested_fix': fix,
                        'location': field,
                        'original_sentence': v,
                        'cascade_risks': [],
                        'corpus_count': 1,
                        'reason': 'middle-dot U+00B7 used as quote marker; normalize to standard Swedish "..."',
                        'priority': 'cycle3_mechanical',
                    })
        for d in (exp.get('distractors') or []):
            if not isinstance(d, dict):
                continue
            letter = d.get('letter') or '?'
            for sub in ('why_tempting', 'why_wrong'):
                v = d.get(sub)
                if isinstance(v, str):
                    for m in MIDDOT_PAIR_RX.finditer(v):
                        if is_likely_math_context(v, m.start(), m.end()):
                            continue
                        snippet = m.group(0)
                        inner = m.group(1)
                        fix = f'"{inner}"'
                        cands.append({
                            'qid': qid,
                            'class': 'style',
                            'snippet': snippet,
                            'suggested_fix': fix,
                            'location': f'distractor_{letter}_{sub}',
                            'original_sentence': v,
                            'cascade_risks': [],
                            'corpus_count': 1,
                            'reason': 'middle-dot U+00B7 used as quote marker; normalize to standard Swedish "..."',
                            'priority': 'cycle3_mechanical',
                        })
    return cands


def find_hitta_candidates(explanations: dict[str, dict]) -> list[dict]:
    """Find 'hitta i texten själv' / 'hitta texten själv om' templates and
    emit candidate fixes to 'hitta själv i texten X'.
    """
    cands = []
    for qid, exp in explanations.items():
        for field in ('solution_path', 'technique', 'pitfall'):
            v = exp.get(field)
            if isinstance(v, str):
                for m in HITTA_RX.finditer(v):
                    snippet = m.group(0)
                    obj = m.group(1)
                    fix = f'hitta själv i texten {obj}'
                    if snippet == fix:
                        continue
                    cands.append({
                        'qid': qid,
                        'class': 'style',
                        'snippet': snippet,
                        'suggested_fix': fix,
                        'location': field,
                        'original_sentence': v,
                        'cascade_risks': [],
                        'corpus_count': 1,
                        'reason': "User META decision: canonical form is 'hitta själv i texten X' (natural Swedish word order).",
                        'priority': 'cycle3_meta',
                    })
        for d in (exp.get('distractors') or []):
            if not isinstance(d, dict):
                continue
            letter = d.get('letter') or '?'
            for sub in ('why_tempting', 'why_wrong'):
                v = d.get(sub)
                if isinstance(v, str):
                    for m in HITTA_RX.finditer(v):
                        snippet = m.group(0)
                        obj = m.group(1)
                        fix = f'hitta själv i texten {obj}'
                        if snippet == fix:
                            continue
                        cands.append({
                            'qid': qid,
                            'class': 'style',
                            'snippet': snippet,
                            'suggested_fix': fix,
                            'location': f'distractor_{letter}_{sub}',
                            'original_sentence': v,
                            'cascade_risks': [],
                            'corpus_count': 1,
                            'reason': "User META decision: canonical form is 'hitta själv i texten X'.",
                            'priority': 'cycle3_meta',
                        })
    return cands


def main():
    explanations: dict[str, dict] = {}
    for p in sorted((ROOT / 'data/explanations').glob('*.json')):
        if p.name.startswith('_'):
            continue
        try:
            data = json.loads(p.read_text())
        except json.JSONDecodeError:
            continue
        explanations.update(data)

    middot = find_middot_candidates(explanations)
    hitta = find_hitta_candidates(explanations)
    print(f'Middle-dot quote candidates: {len(middot)}')
    print(f'hitta-texten-själv candidates: {len(hitta)}')

    # Dedup by (qid, snippet) — same snippet may be found by multiple passes
    entries = []
    seen = set()
    for e in middot + hitta:
        key = (e['qid'], e['snippet'], e['location'])
        if key in seen:
            continue
        seen.add(key)
        entries.append(e)

    print(f'Unique candidates: {len(entries)}')

    QUALITY_DIR.mkdir(parents=True, exist_ok=True)
    BATCH = 30
    n = (len(entries) + BATCH - 1) // BATCH
    for k in range(n):
        batch = entries[k * BATCH:(k + 1) * BATCH]
        out = QUALITY_DIR / f'pass4c3_input_{k:03d}.json'
        out.write_text(json.dumps({
            'batch_index': k,
            'entry_count': len(batch),
            'entries': batch,
        }, ensure_ascii=False, indent=2))
    print(f'Wrote {n} cycle-3 Pass-4 batches to {QUALITY_DIR}/pass4c3_input_NNN.json')


if __name__ == '__main__':
    main()

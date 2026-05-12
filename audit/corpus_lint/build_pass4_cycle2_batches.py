"""Build cycle-2 Pass-4 input batches from Pass-5 HIGH-confidence flags.

Pass-5 caught cascade regressions from my Pass-4 apply (double-paste,
sentence-opener truncation, editor-instruction leaks) plus pre-existing
HIGH-confidence issues prior passes missed. Both classes need the same
treatment: Pass-4 fix-verifier reads each in entry-context and decides
whether the proposed fix is safe to apply.

Strategy:
- For every Pass-5 issue at HIGH confidence, build a Pass-4 input record
  (qid + class + snippet + suggested_fix + location + original_sentence
  + cascade_risks + reason).
- Drop any issue whose snippet isn't present in the current corpus
  (drift; the Pass-5 reading was on a stale snapshot).
- Slice into 30-fix batches.

Usage:
    python3 audit/corpus_lint/build_pass4_cycle2_batches.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent
ROOT = SCRIPT_DIR.parent.parent
QUALITY_DIR = Path('/tmp/quality')
ALL_ISSUES = SCRIPT_DIR / 'pass5_all_issues.json'


def load_explanations() -> dict[str, dict]:
    by_qid = {}
    for p in sorted((ROOT / 'data/explanations').glob('*.json')):
        if p.name.startswith('_'):
            continue
        try:
            data = json.loads(p.read_text())
        except json.JSONDecodeError:
            continue
        for qid, exp in data.items():
            by_qid[qid] = exp
    return by_qid


def extract_original_sentence(snippet, exp, location_hint):
    if not isinstance(snippet, str):
        return '', ''
    candidates = []
    for f in ('solution_path', 'technique', 'pitfall'):
        v = exp.get(f)
        if isinstance(v, str) and snippet in v:
            candidates.append((f, v))
    for d in (exp.get('distractors') or []):
        if not isinstance(d, dict):
            continue
        letter = d.get('letter') or '?'
        for sub in ('why_tempting', 'why_wrong'):
            v = d.get(sub)
            if isinstance(v, str) and snippet in v:
                candidates.append((f'distractor_{letter}_{sub}', v))
    if not candidates:
        return '', ''
    if location_hint:
        for f, v in candidates:
            if location_hint.lower().replace('[','').replace(']','').replace('.','_') in f.lower():
                return f, v
    return candidates[0]


def main():
    issues = json.loads(ALL_ISSUES.read_text())
    print(f'Loaded {len(issues)} Pass-5 issues')
    high = [i for i in issues if i.get('confidence') == 'high']
    print(f'  HIGH-confidence: {len(high)}')

    explanations = load_explanations()

    entries = []
    drift = 0
    for i in high:
        qid = i.get('qid')
        snip = i.get('snippet') or ''
        if not qid or not snip:
            continue
        exp = explanations.get(qid)
        if not exp:
            drift += 1
            continue
        loc, sentence = extract_original_sentence(snip, exp, i.get('location', ''))
        if not sentence:
            drift += 1
            continue
        entries.append({
            'qid': qid,
            'class': i.get('class', '?'),
            'snippet': snip,
            'suggested_fix': i.get('suggested_fix', ''),
            'location': loc,
            'original_sentence': sentence,
            'cascade_risks': [i.get('class')] if i.get('class') == 'cascade' else [],
            'corpus_count': 1,  # we only know this exists once in this entry
            'reason': i.get('reason', ''),
            'priority': 'cycle2',
        })

    print(f'Built entries: {len(entries)} (dropped {drift} as drift / unlocateable)')

    BATCH = 30
    n = (len(entries) + BATCH - 1) // BATCH
    QUALITY_DIR.mkdir(parents=True, exist_ok=True)
    for k in range(n):
        batch = entries[k * BATCH:(k + 1) * BATCH]
        # Use a separate cycle2 naming so we don't clobber cycle-1 files
        out = QUALITY_DIR / f'pass4c2_input_{k:03d}.json'
        out.write_text(json.dumps({
            'batch_index': k,
            'entry_count': len(batch),
            'entries': batch,
        }, ensure_ascii=False, indent=2))
    print(f'Wrote {n} cycle-2 Pass-4 batches to {QUALITY_DIR}/pass4c2_input_NNN.json')


if __name__ == '__main__':
    main()

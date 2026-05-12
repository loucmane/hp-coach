"""Build Pass-4 input batches from the merged expert_fix_list.json.

Each Pass-4 batch contains ~30 candidate fixes that survived drift-
filtering. For every fix, the agent gets:
- qid, class, snippet, suggested_fix
- location (which field of the entry)
- original_sentence (the full sentence/field containing the snippet)
- cascade_risks (already computed by merge_passes.py)
- corpus_count

Per the locked plan (Phase 3, max-safety mode): both HIGH-confidence
(`to_pass4`) and MEDIUM-confidence (`review_medium`) fixes go through
Pass-4. The agent assesses each in-context and verdicts fix-OK /
fix-wrong / propose-alternative.

Usage:
    python3 audit/corpus_lint/build_pass4_batches.py
    python3 audit/corpus_lint/build_pass4_batches.py --batch-size 30
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent
ROOT = SCRIPT_DIR.parent.parent
FIX_LIST = SCRIPT_DIR / 'expert_fix_list.json'


SECTION_RX = re.compile(r'-(XYZ|KVA|NOG|DTK|ORD|LÄS|MEK|ELF)-')


def load_explanations() -> dict[str, dict]:
    """Load all explanation entries keyed by qid."""
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


def extract_original_sentence(snippet: str, exp: dict, location_hint: str = '') -> tuple[str, str]:
    """Find the field that contains the snippet and return (field, sentence).

    Returns the full field value (not split into sentences) — Pass-4
    needs enough context to judge cascade effects.

    location_hint may be a fragment like 'distractor_A_why_wrong' to
    prefer that field.
    """
    candidates: list[tuple[str, str]] = []
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
        # Snippet must have been drift-dropped already, or has slight
        # whitespace/quote differences. Return empty.
        return '', ''
    # Prefer location-hint match; else first.
    if location_hint:
        for f, v in candidates:
            if location_hint.lower() in f.lower():
                return f, v
    return candidates[0]


def make_entry(fix: dict, explanations: dict[str, dict]) -> dict | None:
    qid = fix.get('qid')
    snip = fix.get('snippet') or ''
    if not qid or not snip:
        return None
    exp = explanations.get(qid)
    if exp is None:
        return None
    loc_hint = fix.get('location') or ''
    field, sentence = extract_original_sentence(snip, exp, loc_hint)
    if not sentence:
        return None
    return {
        'qid': qid,
        'class': fix.get('class', '?'),
        'snippet': snip,
        'suggested_fix': fix.get('suggested_fix', ''),
        'location': field or loc_hint,
        'original_sentence': sentence,
        'cascade_risks': fix.get('cascade_risks') or [],
        'corpus_count': fix.get('corpus_count', 0),
        'reason': fix.get('reason') or fix.get('reasoning') or '',
        'priority': fix.get('_priority', 'high'),  # carried in from caller
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--batch-size', type=int, default=30)
    ap.add_argument('--output-dir', default='/tmp/quality')
    ap.add_argument('--include-medium', action='store_true', default=True)
    args = ap.parse_args()

    merged = json.loads(FIX_LIST.read_text())
    explanations = load_explanations()

    # Tag priority for downstream visibility
    high = [{**f, '_priority': 'high'} for f in merged.get('to_pass4') or []]
    med = [{**f, '_priority': 'medium'} for f in merged.get('review_medium') or []]
    candidates = high + (med if args.include_medium else [])
    print(f'Candidate fixes: HIGH={len(high)}, MEDIUM={len(med)}, total={len(candidates)}')

    entries = []
    missing_context = 0
    for fix in candidates:
        e = make_entry(fix, explanations)
        if e is None:
            missing_context += 1
            continue
        entries.append(e)

    print(f'Built entries with context: {len(entries)} (skipped {missing_context} without locate-able snippet)')

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    n_batches = (len(entries) + args.batch_size - 1) // args.batch_size
    for i in range(n_batches):
        batch = entries[i * args.batch_size:(i + 1) * args.batch_size]
        out = out_dir / f'pass4_input_{i:03d}.json'
        out.write_text(json.dumps({
            'batch_index': i,
            'entry_count': len(batch),
            'entries': batch,
        }, ensure_ascii=False, indent=2))

    print(f'Wrote {n_batches} Pass-4 input batches to {out_dir}/pass4_input_NNN.json')
    if n_batches:
        first_kb = (out_dir / 'pass4_input_000.json').stat().st_size / 1024
        print(f'First batch size: {first_kb:.1f} KB')


if __name__ == '__main__':
    main()

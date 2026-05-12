"""Build Pass-5 cascade-check batches over only the modified entries.

After Pass-4-verified fixes were applied, Pass-5 re-reads ONLY the entries
that actually changed — not the full 2,704 corpus. Most fixes touched a
single field; the cascade-risk concern is whether the substitution broke
agreement, determiner-chain, or modal-verb structure in the surrounding
sentence (the case the user originally flagged with `okändvariabeln`).

Strategy:
- For every qid in pass4_verified_fixes.json, pull the *current* entry
  from data/explanations/.
- Compact to the same shape as build_audit_batches.py (Swedish-text fields
  only).
- Slice into 50-entry batches and write to /tmp/quality/pass5_input_NNN.json.

The Pass-5 agent runs the same Pass-1 systematic checklist but is
explicitly told to look for cascade side-effects (redundant articles,
broken determiner chains, mood mismatches).

Usage:
    python3 audit/corpus_lint/build_pass5_batches.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent
ROOT = SCRIPT_DIR.parent.parent
QUALITY_DIR = Path('/tmp/quality')
VERIFIED = SCRIPT_DIR / 'pass4_verified_fixes.json'

SECTION_RX = re.compile(r'-(XYZ|KVA|NOG|DTK|ORD|LÄS|MEK|ELF)-')


def section_of(qid):
    m = SECTION_RX.search(qid)
    return m.group(1) if m else '?'


def compact_entry(qid: str, exp: dict) -> dict:
    entry = {'qid': qid}
    for f in ('solution_path', 'technique', 'pitfall'):
        v = exp.get(f)
        if isinstance(v, str) and v.strip():
            entry[f] = v
    distractors = []
    for d in (exp.get('distractors') or []):
        if isinstance(d, dict):
            distractors.append({
                'letter': d.get('letter'),
                'why_tempting': d.get('why_tempting'),
                'why_wrong': d.get('why_wrong'),
            })
    if distractors:
        entry['distractors'] = distractors
    return entry


def main():
    fixes = json.loads(VERIFIED.read_text()).get('fixes', [])
    qids = sorted({f['qid'] for f in fixes if section_of(f['qid']) != 'ELF'})
    print(f'Modified qids to re-audit: {len(qids)}')

    # Load explanations
    by_qid: dict[str, dict] = {}
    for p in sorted((ROOT / 'data/explanations').glob('*.json')):
        if p.name.startswith('_'):
            continue
        try:
            data = json.loads(p.read_text())
        except json.JSONDecodeError:
            continue
        for qid, exp in data.items():
            if qid in qids:
                by_qid[qid] = exp

    entries = []
    missing = 0
    for q in qids:
        e = by_qid.get(q)
        if not e:
            missing += 1
            continue
        entries.append(compact_entry(q, e))

    print(f'Loaded {len(entries)} entries ({missing} missing).')

    QUALITY_DIR.mkdir(parents=True, exist_ok=True)
    BATCH_SIZE = 50
    n = (len(entries) + BATCH_SIZE - 1) // BATCH_SIZE
    for i in range(n):
        batch = entries[i * BATCH_SIZE:(i + 1) * BATCH_SIZE]
        out = QUALITY_DIR / f'pass5_input_{i:03d}.json'
        out.write_text(json.dumps({
            'batch_index': i,
            'entry_count': len(batch),
            'entries': batch,
        }, ensure_ascii=False, indent=2))
    print(f'Wrote {n} Pass-5 batches to {QUALITY_DIR}/pass5_input_NNN.json')


if __name__ == '__main__':
    main()

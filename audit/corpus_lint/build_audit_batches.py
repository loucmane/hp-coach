"""Slice the corpus into 50-entry batches for the 3-pass Opus audit.

For each non-ELF explanation entry, produce a compact batch input
file containing just the Swedish text fields. Each batch is written
to /tmp/quality/pass1_input_NNN.json.

Usage:
    python3 audit/corpus_lint/build_audit_batches.py
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


SECTION_RX = re.compile(r'-(XYZ|KVA|NOG|DTK|ORD|LÄS|MEK|ELF)-')


def section_of(qid):
    m = SECTION_RX.search(qid)
    return m.group(1) if m else '?'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--batch-size', type=int, default=50)
    ap.add_argument('--output-dir', default='/tmp/quality')
    ap.add_argument('--skip-elf', action='store_true', default=True)
    args = ap.parse_args()

    # Load all explanations
    all_entries = []
    for p in sorted(Path('data/explanations').glob('*.json')):
        if p.name.startswith('_'):
            continue
        for qid, exp in json.loads(p.read_text()).items():
            if args.skip_elf and section_of(qid) == 'ELF':
                continue
            # Compact entry: only the Swedish-text fields
            entry = {'qid': qid}
            for f in ['solution_path', 'technique', 'pitfall']:
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
            all_entries.append(entry)

    print(f'Total entries: {len(all_entries):,}')
    n_batches = (len(all_entries) + args.batch_size - 1) // args.batch_size
    print(f'Batches at size {args.batch_size}: {n_batches}')

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    for i in range(n_batches):
        batch = all_entries[i * args.batch_size:(i + 1) * args.batch_size]
        out_path = out_dir / f'pass1_input_{i:03d}.json'
        out_path.write_text(json.dumps({
            'batch_index': i,
            'entry_count': len(batch),
            'entries': batch,
        }, ensure_ascii=False, indent=2))

    print(f'Wrote {n_batches} batches to {out_dir}/pass1_input_NNN.json')
    print(f'First batch size: {(out_dir / "pass1_input_000.json").stat().st_size / 1024:.1f} KB')


if __name__ == '__main__':
    main()

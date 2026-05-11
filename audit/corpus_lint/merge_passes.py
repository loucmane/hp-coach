"""Merge Pass-1 + Pass-2 + Pass-3 outputs into the authoritative fix list.

Reads `/tmp/quality/pass{1,2,3}_output_NNN.json` for all batches and
produces `audit/corpus_lint/expert_fix_list.json` plus a human-readable
summary at `audit/corpus_lint/_pass_report.md`.

Confidence tiers (deeper rule logic explained inline below):

- **HIGH** = Pass 3 confirmed it AND assigned final_confidence=high
  → auto-apply via apply_typo_fixes.py-style pipeline
- **MEDIUM** = Pass 3 confirmed it with final_confidence=medium, OR
  Pass 3 added a new flag with confidence=high
  → hand-review queue
- **LOW** = anything else that survived (Pass 3 confirmed low, or
  Pass 3 added with confidence=medium) → logged, not fixed

Anything Pass 3 explicitly rejected is dropped (with reason kept for
audit).

Usage:
    python3 audit/corpus_lint/merge_passes.py
    python3 audit/corpus_lint/merge_passes.py --quality-dir /tmp/quality
"""
from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent
ROOT = SCRIPT_DIR.parent.parent

OUT_FIX_LIST = SCRIPT_DIR / 'expert_fix_list.json'
OUT_REPORT = SCRIPT_DIR / '_pass_report.md'


def load_pass(quality_dir: Path, pass_num: int) -> dict[str, dict]:
    """Return {qid: entry_output} for a given pass across all batches.

    Each entry_output retains whatever shape that pass uses (Pass 1+2
    use `issues[]`; Pass 3 uses `confirmed/rejected/added`).
    """
    out: dict[str, dict] = {}
    for p in sorted(quality_dir.glob(f'pass{pass_num}_output_*.json')):
        data = json.loads(p.read_text())
        for entry in data.get('entries', []):
            qid = entry.get('qid')
            if qid:
                out[qid] = entry
    return out


def merge(quality_dir: Path) -> dict:
    """Apply the merge rules above. Returns the authoritative fix list."""
    p1 = load_pass(quality_dir, 1)
    p2 = load_pass(quality_dir, 2)
    p3 = load_pass(quality_dir, 3)

    all_qids = set(p1) | set(p2) | set(p3)

    high, medium, low, rejected = [], [], [], []

    for qid in sorted(all_qids):
        p3_entry = p3.get(qid)
        if not p3_entry:
            # Pass 3 hasn't seen this qid — treat all Pass 1/2 flags
            # as MEDIUM pending verification
            for e in (p1.get(qid), p2.get(qid)):
                if not e:
                    continue
                for issue in e.get('issues', []) or []:
                    medium.append({**issue, 'qid': qid, 'source': f"pass{e.get('pass', '?')}"})
            continue

        for c in p3_entry.get('confirmed', []) or []:
            fc = (c.get('final_confidence') or '').lower()
            rec = {**c, 'qid': qid, 'verified_by': 'pass3'}
            if fc == 'high':
                high.append(rec)
            elif fc == 'medium':
                medium.append(rec)
            else:
                low.append(rec)

        for r in p3_entry.get('rejected', []) or []:
            rejected.append({**r, 'qid': qid})

        for a in p3_entry.get('added', []) or []:
            conf = (a.get('confidence') or '').lower()
            rec = {**a, 'qid': qid, 'source': 'pass3_added'}
            if conf == 'high':
                medium.append(rec)  # pass3-added is at most MEDIUM
            elif conf == 'medium':
                low.append(rec)
            # confidence=low pass3-added → drop

    return {
        'summary': {
            'high_confidence': len(high),
            'medium_confidence': len(medium),
            'low_confidence': len(low),
            'rejected': len(rejected),
            'qids_with_any_flag': sum(
                1 for q in all_qids
                if (p3.get(q, {}).get('confirmed')
                    or p3.get(q, {}).get('added')
                    or (q not in p3 and (p1.get(q, {}).get('issues') or p2.get(q, {}).get('issues'))))
            ),
        },
        'high_confidence_fixes': high,
        'medium_confidence_review': medium,
        'low_confidence_log': low,
        'rejected': rejected,
    }


def write_report(merged: dict, out_path: Path):
    """Write the human-readable summary."""
    s = merged['summary']
    by_class_high: dict[str, int] = defaultdict(int)
    for f in merged['high_confidence_fixes']:
        by_class_high[f.get('class', '?')] += 1

    lines = []
    lines.append('# Three-pass audit report\n')
    lines.append(f"- HIGH-confidence flags (auto-fix queue): **{s['high_confidence']}**")
    lines.append(f"- MEDIUM-confidence flags (review queue): **{s['medium_confidence']}**")
    lines.append(f"- LOW-confidence flags (log only):       {s['low_confidence']}")
    lines.append(f"- Rejected by Pass 3:                    {s['rejected']}")
    lines.append(f"- Total qids with any flag:              {s['qids_with_any_flag']}")
    lines.append('')

    lines.append('## High-confidence by class')
    for cls, n in sorted(by_class_high.items(), key=lambda x: -x[1]):
        lines.append(f"- `{cls}`: {n}")
    lines.append('')

    lines.append('## Top HIGH-confidence fixes (first 30)')
    for f in merged['high_confidence_fixes'][:30]:
        snippet = (f.get('snippet') or '').replace('\n', ' ')[:80]
        fix = (f.get('suggested_fix') or '').replace('\n', ' ')[:80]
        lines.append(f"- `{f.get('qid')}` [{f.get('class')}] {snippet} → {fix}")
    lines.append('')

    out_path.write_text('\n'.join(lines))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--quality-dir', default='/tmp/quality')
    args = ap.parse_args()

    merged = merge(Path(args.quality_dir))
    OUT_FIX_LIST.write_text(json.dumps(merged, ensure_ascii=False, indent=2))
    write_report(merged, OUT_REPORT)

    s = merged['summary']
    print('━' * 60)
    print('Three-pass merge complete')
    print('━' * 60)
    print(f"  HIGH-confidence (auto-fix):    {s['high_confidence']:>5}")
    print(f"  MEDIUM-confidence (review):    {s['medium_confidence']:>5}")
    print(f"  LOW-confidence (log):          {s['low_confidence']:>5}")
    print(f"  Rejected by Pass 3:            {s['rejected']:>5}")
    print(f"  Qids with any flag:            {s['qids_with_any_flag']:>5}")
    print()
    print(f"  Fix list: {OUT_FIX_LIST}")
    print(f"  Report:   {OUT_REPORT}")


if __name__ == '__main__':
    main()

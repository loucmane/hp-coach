"""Apply Pass-4-verified fixes to the explanation corpus.

Reads `audit/corpus_lint/pass4_verified_fixes.json` and applies each
fix as a per-entry, per-field substring replacement.

Strategy per fix:
- Open the file containing the qid (data/explanations/<exam_id>.json).
- Locate the specific field given in `location`:
    - solution_path / technique / pitfall  → direct string field
    - distractor_<LETTER>_<sub>             → distractors[i].<sub>
- Replace the FIRST occurrence of `snippet` with `final_fix` in that
  field's string.
- Idempotent: if the snippet isn't present, skip silently.

Safety:
- Dry-run by default; --apply commits.
- Refuse to apply a fix where snippet not found AND final_fix not
  found in the field (= drift; original missed, not yet applied).
- Track per-class counts; per-class commit so revert is a one-shot.

Usage:
    python3 audit/corpus_lint/apply_pass4.py                 # dry run
    python3 audit/corpus_lint/apply_pass4.py --apply         # apply
    python3 audit/corpus_lint/apply_pass4.py --class spelling --apply
"""
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent
ROOT = SCRIPT_DIR.parent.parent
VERIFIED = SCRIPT_DIR / 'pass4_verified_fixes.json'

QID_FILE_RX = re.compile(r'^(.+?)-(kvant1|kvant2|verb1|verb2)-')


def exam_id_of(qid: str) -> str:
    """Extract exam_id prefix used as filename: e.g. host-2013-kvant1-XYZ-001 → host-2013."""
    m = QID_FILE_RX.match(qid)
    if not m:
        # Fallback: take first two dash-segments
        parts = qid.split('-')
        return '-'.join(parts[:2])
    return m.group(1)


def find_file_for_qid(qid: str) -> Path | None:
    """Find the data/explanations JSON containing this qid.

    Tries derived exam_id first, then scans.
    """
    explanations = ROOT / 'data/explanations'
    eid = exam_id_of(qid)
    cand = explanations / f'{eid}.json'
    if cand.exists():
        # quick check
        try:
            data = json.loads(cand.read_text())
            if qid in data:
                return cand
        except json.JSONDecodeError:
            pass
    # Scan
    for p in sorted(explanations.glob('*.json')):
        if p.name.startswith('_'):
            continue
        try:
            data = json.loads(p.read_text())
        except json.JSONDecodeError:
            continue
        if qid in data:
            return p
    return None


DISTRACTOR_RX = re.compile(r'^distractor_([A-Z])_(why_tempting|why_wrong)$', re.IGNORECASE)


def apply_to_entry(entry: dict, location: str, snippet: str, final_fix: str) -> tuple[bool, str]:
    """Apply one fix to one entry, in-place. Returns (changed, status)."""
    # solution_path / technique / pitfall — direct fields
    if location in ('solution_path', 'technique', 'pitfall'):
        v = entry.get(location)
        if not isinstance(v, str):
            return False, 'field_not_string'
        if snippet not in v:
            if final_fix in v:
                return False, 'already_applied'
            return False, 'snippet_not_found'
        entry[location] = v.replace(snippet, final_fix, 1)
        return True, 'applied'

    # distractor_<letter>_<sub>
    m = DISTRACTOR_RX.match(location)
    if m:
        letter = m.group(1).upper()
        sub = m.group(2).lower()
        for d in entry.get('distractors') or []:
            if not isinstance(d, dict):
                continue
            if (d.get('letter') or '').upper() == letter:
                v = d.get(sub)
                if not isinstance(v, str):
                    return False, 'field_not_string'
                if snippet not in v:
                    if final_fix in v:
                        return False, 'already_applied'
                    return False, 'snippet_not_found'
                d[sub] = v.replace(snippet, final_fix, 1)
                return True, 'applied'
        return False, 'distractor_not_found'

    # Unknown location format — scan all candidate fields
    for f in ('solution_path', 'technique', 'pitfall'):
        v = entry.get(f)
        if isinstance(v, str) and snippet in v:
            entry[f] = v.replace(snippet, final_fix, 1)
            return True, 'applied_fallback_scan'
    for d in entry.get('distractors') or []:
        if not isinstance(d, dict):
            continue
        for sub in ('why_tempting', 'why_wrong'):
            v = d.get(sub)
            if isinstance(v, str) and snippet in v:
                d[sub] = v.replace(snippet, final_fix, 1)
                return True, 'applied_fallback_scan'
    return False, 'unknown_location_no_match'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true', help='commit changes')
    ap.add_argument('--class', dest='cls', default=None,
                    help='only apply fixes of this class (e.g. spelling, inflection)')
    ap.add_argument('--limit', type=int, default=None,
                    help='only apply first N fixes (for testing)')
    args = ap.parse_args()

    fixes_data = json.loads(VERIFIED.read_text())
    all_fixes = fixes_data.get('fixes', [])
    print(f'Loaded {len(all_fixes)} verified fixes.')

    if args.cls:
        all_fixes = [f for f in all_fixes if f.get('class') == args.cls]
        print(f'Filtered to class={args.cls}: {len(all_fixes)} fixes.')

    if args.limit:
        all_fixes = all_fixes[:args.limit]
        print(f'Limiting to first {args.limit} fixes for testing.')

    # Group fixes by file to minimize I/O
    by_file: dict[Path, list[dict]] = defaultdict(list)
    missing_files = []
    for fix in all_fixes:
        qid = fix['qid']
        p = find_file_for_qid(qid)
        if p is None:
            missing_files.append(qid)
            continue
        by_file[p].append(fix)
    if missing_files:
        print(f'WARN: {len(missing_files)} qids without explanation file; sample: {missing_files[:3]}')

    status_counts = defaultdict(int)
    class_applied = defaultdict(int)
    per_file_changes = []

    for path, fixes in sorted(by_file.items()):
        data = json.loads(path.read_text())
        file_changed = False
        for fix in fixes:
            qid = fix['qid']
            entry = data.get(qid)
            if entry is None:
                status_counts['qid_missing_in_file'] += 1
                continue
            changed, status = apply_to_entry(entry, fix.get('location', ''),
                                             fix['snippet'], fix['final_fix'])
            status_counts[status] += 1
            if changed:
                class_applied[fix.get('class', '?')] += 1
                file_changed = True
        if file_changed and args.apply:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2))
            per_file_changes.append(path.name)
        elif file_changed:
            per_file_changes.append(path.name + ' (dry)')

    print()
    print('━' * 50)
    print('Pass-4 apply results')
    print('━' * 50)
    for k, v in sorted(status_counts.items(), key=lambda x: -x[1]):
        print(f'  {k:<35} {v:>5}')
    print()
    print('  Applied by class:')
    for k, v in sorted(class_applied.items(), key=lambda x: -x[1]):
        print(f'    {k:<25} {v:>5}')
    print()
    print(f'  Files touched: {len(per_file_changes)}')
    if args.apply:
        print('  Mode: APPLIED ✅')
    else:
        print('  Mode: DRY RUN (re-run with --apply)')


if __name__ == '__main__':
    main()

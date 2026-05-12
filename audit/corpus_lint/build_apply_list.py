"""Aggregate Pass-4 outputs into the final apply-ready fix list.

For every Pass-4 entry:
- Skip `fix-wrong` verdicts (logged separately for audit)
- For `fix-OK` use `final_fix` (same as suggested_fix unless verifier
  cleaned it)
- For `propose-alternative` use the verifier's `final_fix` directly

After verdict-level filtering, apply policy filters:
1. **All-caps coda style** is LOCKED as house convention per the
   corpus-quality plan. Drop any style-class fix where the suggested
   change appears to remove ALL-CAPS emphasis (target string differs
   from snippet primarily by case-conversion to mixed case).
2. **Duplicate (qid, snippet)** pairs from HIGH + MEDIUM are
   collapsed — first wins.

Output:
- `audit/corpus_lint/pass4_verified_fixes.json` — apply-ready
- `audit/corpus_lint/pass4_rejected_fixes.json` — fix-wrong + dropped
- `audit/corpus_lint/_pass4_report.md` — human-readable summary

The verified list is then fed to apply_typo_fixes.py (via either
direct phrase-fix injection or a one-shot per-entry sed pass).

Usage:
    python3 audit/corpus_lint/build_apply_list.py
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent
QUALITY_DIR = Path('/tmp/quality')

OUT_VERIFIED = SCRIPT_DIR / 'pass4_verified_fixes.json'
OUT_REJECTED = SCRIPT_DIR / 'pass4_rejected_fixes.json'
OUT_REPORT = SCRIPT_DIR / '_pass4_report.md'


def is_allcaps_removal(snippet: str, final_fix: str) -> bool:
    """Detect the locked-policy violation: fix is removing ALL-CAPS emphasis.

    Heuristics:
    - snippet has at least one ALL-CAPS word of length >= 3
    - final_fix's lowercase version matches snippet's lowercase version
      (i.e. only case differs)
    - OR final_fix wraps the formerly-caps word with `*` or `_`
      (italic markdown) and the rest is identical
    """
    if not snippet or not final_fix:
        return False
    if snippet == final_fix:
        return False
    # Find ALL-CAPS words in snippet
    caps_words = [w for w in re.findall(r'\b[A-ZÅÄÖ]{3,}\b', snippet)]
    if not caps_words:
        return False
    # Compare lowercased
    s_lc = snippet.lower()
    f_lc = final_fix.lower()
    if s_lc == f_lc:
        return True
    # Strip markdown emphasis markers (* and _) and re-compare
    f_lc_stripped = re.sub(r'[*_]', '', f_lc)
    if s_lc == f_lc_stripped:
        return True
    return False


def load_input_batches() -> dict[str, dict]:
    """Index pass4_input_*.json entries by qid+snippet for lookup of location/etc."""
    idx = {}
    for p in sorted(QUALITY_DIR.glob('pass4_input_*.json')):
        try:
            data = json.loads(p.read_text())
        except json.JSONDecodeError:
            continue
        for entry in data.get('entries', []) or []:
            key = (entry.get('qid'), entry.get('snippet'))
            idx[key] = entry
    return idx


def load_outputs() -> list[dict]:
    """Flatten all pass4_output_*.json entries."""
    out = []
    for p in sorted(QUALITY_DIR.glob('pass4_output_*.json')):
        try:
            data = json.loads(p.read_text())
        except json.JSONDecodeError:
            print(f'WARN: could not parse {p.name}')
            continue
        for entry in data.get('entries', []) or []:
            out.append({**entry, '_source_file': p.name})
    return out


def main():
    inputs = load_input_batches()
    outputs = load_outputs()

    verified = []
    rejected = []
    seen_keys: set[tuple] = set()

    drop_counts = defaultdict(int)

    for o in outputs:
        qid = o.get('qid')
        snippet = o.get('snippet')
        verdict = o.get('verdict')
        final_fix = o.get('final_fix') or o.get('original_suggested_fix') or ''
        reasoning = o.get('reasoning') or ''

        if not qid or not snippet:
            drop_counts['missing_qid_or_snippet'] += 1
            continue

        # Lookup input context (location, original_sentence, cascade_risks, class)
        ctx = inputs.get((qid, snippet)) or {}

        record = {
            'qid': qid,
            'class': ctx.get('class', '?'),
            'snippet': snippet,
            'final_fix': final_fix,
            'original_suggested_fix': o.get('original_suggested_fix') or ctx.get('suggested_fix') or '',
            'location': ctx.get('location', ''),
            'original_sentence': ctx.get('original_sentence', ''),
            'cascade_risks': ctx.get('cascade_risks') or [],
            'corpus_count': ctx.get('corpus_count', 0),
            'priority': ctx.get('priority', 'high'),
            'verdict': verdict,
            'reasoning': reasoning,
        }

        # ── Verdict filter ──
        if verdict == 'fix-wrong':
            rejected.append({**record, 'drop_reason': 'verdict=fix-wrong'})
            drop_counts['fix_wrong'] += 1
            continue

        if verdict not in ('fix-OK', 'propose-alternative'):
            rejected.append({**record, 'drop_reason': f'unknown verdict: {verdict}'})
            drop_counts['unknown_verdict'] += 1
            continue

        if not final_fix:
            rejected.append({**record, 'drop_reason': 'empty final_fix'})
            drop_counts['empty_final_fix'] += 1
            continue

        if final_fix.strip() == snippet.strip():
            rejected.append({**record, 'drop_reason': 'final_fix == snippet (no-op)'})
            drop_counts['noop'] += 1
            continue

        # ── Policy filter: all-caps coda is locked house convention ──
        if record['class'] == 'style' and is_allcaps_removal(snippet, final_fix):
            rejected.append({**record, 'drop_reason': 'all-caps removal contradicts locked plan'})
            drop_counts['allcaps_policy'] += 1
            continue

        # ── Dedup (qid, snippet) ──
        key = (qid, snippet)
        if key in seen_keys:
            rejected.append({**record, 'drop_reason': 'duplicate (qid, snippet)'})
            drop_counts['duplicate'] += 1
            continue
        seen_keys.add(key)

        verified.append(record)

    # Group verified by class for report
    by_class = defaultdict(list)
    for v in verified:
        by_class[v['class']].append(v)

    # Cascade-risk tally
    cascade_count = sum(1 for v in verified if v['cascade_risks'])

    # Write outputs
    OUT_VERIFIED.write_text(json.dumps({
        'count': len(verified),
        'by_class': {k: len(vs) for k, vs in by_class.items()},
        'cascade_risk_count': cascade_count,
        'fixes': verified,
    }, ensure_ascii=False, indent=2))

    OUT_REJECTED.write_text(json.dumps({
        'count': len(rejected),
        'drop_counts': dict(drop_counts),
        'rejected': rejected,
    }, ensure_ascii=False, indent=2))

    # Markdown report
    lines = []
    lines.append('# Pass-4 verification — apply-ready fix list\n')
    lines.append('## Counts\n')
    lines.append(f'- **Verified, ready to apply**:  {len(verified):,}')
    lines.append(f'- **Rejected/filtered**:         {len(rejected):,}')
    lines.append(f'  - fix-wrong (verifier veto):    {drop_counts.get("fix_wrong", 0)}')
    lines.append(f'  - all-caps removal blocked:     {drop_counts.get("allcaps_policy", 0)}')
    lines.append(f'  - duplicate (qid, snippet):     {drop_counts.get("duplicate", 0)}')
    lines.append(f'  - no-op (fix == snippet):       {drop_counts.get("noop", 0)}')
    lines.append(f'  - empty final_fix:              {drop_counts.get("empty_final_fix", 0)}')
    lines.append(f'  - missing context:              {drop_counts.get("missing_qid_or_snippet", 0)}')
    lines.append(f'- **Cascade-risk flags in verified**: {cascade_count:,}')
    lines.append('')
    lines.append('## By class\n')
    for cls, vs in sorted(by_class.items(), key=lambda x: -len(x[1])):
        lines.append(f'- `{cls}`: {len(vs)}')
    lines.append('')
    lines.append('## Sample verified fixes (first 20)\n')
    for v in verified[:20]:
        snip = (v['snippet'] or '').replace('\n', ' ')[:60]
        fix = (v['final_fix'] or '').replace('\n', ' ')[:60]
        lines.append(f'- `{v["qid"]}` [{v["class"]}] {snip} → {fix}')
    OUT_REPORT.write_text('\n'.join(lines))

    print('━' * 50)
    print('Pass-4 → apply-list build complete')
    print('━' * 50)
    print(f'  Verified (apply-ready):  {len(verified):>5}')
    print(f'  Rejected/filtered:       {len(rejected):>5}')
    for k, v in sorted(drop_counts.items()):
        print(f'    {k:<28} {v:>5}')
    print()
    print(f'  Cascade-risk in verified: {cascade_count:>4}')
    print()
    print(f'  Verified fixes: {OUT_VERIFIED}')
    print(f'  Rejected log:   {OUT_REJECTED}')
    print(f'  Report:         {OUT_REPORT}')


if __name__ == '__main__':
    main()

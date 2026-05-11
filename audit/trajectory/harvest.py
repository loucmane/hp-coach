"""
Harvest signals from a completed trajectory run.

After an agent dispatch writes /tmp/trajectory/<name>_run.json, this
script extracts the actionable signals and writes:
- audit/trajectory/reports/<name>-<date>.md — human-readable report
- audit/trajectory/_latest_report.md — symlink-style copy of the most-recent
- Updates known_broken.json with any new soft-bottleneck qids that look
  like real parser bugs (vs pedagogy issues)

Usage:
    python3 audit/trajectory/harvest.py <name>

Where <name> matches the basename used in build_brief.py --output.
"""
import json
import re
import sys
from datetime import datetime
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent
PARSER_BUG_PATTERNS = [
    r'\bb\s+\\\\?frac',       # paren-corruption (now patched but watch for regressions)
    r'\blb\s+',                # ditto
    r'parser',                 # any explicit mention
    r'scrambled',
    r'truncated',
    r'corrupt',
    r'garble',
    r'figure',                 # figure-blind
    r'unrendered',
    r'broken prompt',
]


def main():
    if len(sys.argv) < 2:
        print('Usage: harvest.py <name>')
        sys.exit(1)

    name = sys.argv[1]
    run_path = Path(f'/tmp/trajectory/{name}_run.json')
    meta_path = Path(f'/tmp/trajectory/{name}_meta.json')

    if not run_path.exists():
        print(f'NOT READY: {run_path} does not exist')
        sys.exit(2)

    run = json.loads(run_path.read_text())
    meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}
    today = datetime.utcnow().strftime('%Y-%m-%d')

    # ── Extract signals ──────────────────────────────────────────────
    baseline = run.get('baseline_calibration', {})
    baseline_score = baseline.get('score_out_of_10')
    rounds = run.get('rounds', [])

    practice_rounds = [r for r in rounds if r.get('kind') == 'practice']
    transfer_rounds = [r for r in rounds if r.get('kind') == 'transfer_test']

    bottlenecks = run.get('bottlenecks', [])
    soft_bottlenecks = run.get('soft_bottlenecks', [])
    high_leverage = run.get('high_leverage', [])

    transfer_passed = sum(1 for r in transfer_rounds if r.get('passed'))
    transfer_total = len(transfer_rounds)

    final = run.get('final_state', {})

    # ── Classify soft bottlenecks: parser-bug suspects vs pedagogy ───
    QID_RX = re.compile(r'^([a-z0-9_-]+-(?:XYZ|KVA|NOG|DTK|ORD|LÄS|MEK|ELF)-\d+)')

    soft_diagnoses = []
    for entry in soft_bottlenecks:
        qid = ''
        reason = ''
        if isinstance(entry, str):
            # Agents sometimes embed the reason in the soft_bottlenecks
            # string as "qid (round N) — reason ...". Extract the qid.
            m = QID_RX.match(entry)
            if m:
                qid = m.group(1)
                reason = entry[m.end():].lstrip(' —-:').strip()
            else:
                qid = entry
            # If reason is empty, try the round record
            if not reason:
                for r in rounds:
                    if r.get('qid') == qid and r.get('explanation_helped') is False:
                        reason = r.get('reason') or r.get('why_no_help') or ''
                        break
        elif isinstance(entry, dict):
            qid = entry.get('qid', '')
            reason = entry.get('reason', '')
        else:
            continue

        looks_like_parser_bug = any(
            re.search(pat, reason, re.IGNORECASE)
            for pat in PARSER_BUG_PATTERNS
        )
        soft_diagnoses.append({
            'qid': qid,
            'reason': reason[:300],
            'looks_like_parser_bug': looks_like_parser_bug,
        })

    # ── Update known_broken ──────────────────────────────────────────
    # Skip qids that are already in qids OR in any *_patched registry —
    # those are either still being tracked or were already fixed by a
    # hand-patcher and shouldn't get auto-re-added on stale runs.
    known_broken_path = SCRIPT_DIR / 'known_broken.json'
    kb = json.loads(known_broken_path.read_text())
    existing = set(kb.get('qids', []))
    already_patched = set()
    for key, val in kb.items():
        if key.endswith('_patched') and isinstance(val, list):
            already_patched.update(val)

    additions = []
    skipped_already_patched = []
    for d in soft_diagnoses:
        if not d['looks_like_parser_bug']:
            continue
        if d['qid'] in existing:
            continue
        if d['qid'] in already_patched:
            skipped_already_patched.append(d['qid'])
            continue
        additions.append(d['qid'])
        kb['qids'].append(d['qid'])
        kb.setdefault('notes', {})[d['qid']] = (
            f'Auto-flagged by trajectory harvest on {today}. '
            f'Reason: {d["reason"][:300]}'
        )

    if additions:
        kb['qids'] = sorted(set(kb['qids']))
        kb['last_auto_harvest'] = today
        known_broken_path.write_text(json.dumps(kb, ensure_ascii=False, indent=2))
        print(f'Added {len(additions)} new entries to known_broken.json: {additions}')
    if skipped_already_patched:
        print(
            f'Skipped {len(skipped_already_patched)} entries already in a *_patched '
            f'registry (stale-run safeguard): {skipped_already_patched}'
        )

    # ── Build report ─────────────────────────────────────────────────
    report = [
        f'# Trajectory run report — {name} — {today}',
        '',
        f'Generated by `audit/trajectory/harvest.py`.',
        f'Source run: `/tmp/trajectory/{name}_run.json`',
        '',
        '## Configuration',
        '',
        f'- Size: {meta.get("size", "?")}',
        f'- Seed: {meta.get("seed", "?")}',
        f'- Total rounds: {meta.get("total_rounds", len(rounds) + 1)}',
        f'- Excluded qids: {len(meta.get("excluded_qids", []))}',
        '',
        '## Results',
        '',
        f'| Metric | Value |',
        f'|---|---|',
        f'| Baseline calibration | {baseline_score}/10 |',
        f'| Rounds completed | {len(rounds)} |',
        f'| Practice rounds | {len(practice_rounds)} |',
        f'| Transfer tests | {transfer_total} |',
        f'| Transfer pass rate | {transfer_passed}/{transfer_total}'
            + (f' ({100*transfer_passed/transfer_total:.0f}%)' if transfer_total else '')
            + ' |',
        f'| Facts learned | {len(final.get("facts_learned", []))} |',
        f'| Hard bottlenecks | {len(bottlenecks)} |',
        f'| Soft bottlenecks | {len(soft_bottlenecks)} |',
        f'| High-leverage entries | {len(high_leverage)} |',
        f'| Final estimated level | {final.get("estimated_level", "?")} |',
        '',
        '## Section proficiency',
        '',
    ]
    sp = final.get('section_proficiency', {}) or {}
    for sec, v in sorted(sp.items(), key=lambda x: -(x[1] or 0)):
        report.append(f'- {sec}: {v}')

    report.extend([
        '',
        '## Hard bottlenecks (failed transfers)',
        '',
    ])
    if not bottlenecks:
        report.append('_None — transfer tests all passed._')
    else:
        for qid in bottlenecks:
            # find the round
            r = next((r for r in transfer_rounds if r.get('qid') == qid), None)
            if r:
                practiced = r.get('practiced_earlier_qid', '?')
                attempted = r.get('attempted', '?')
                facit = r.get('facit', '?')
                report.append(f'- `{qid}` (transfer for `{practiced}`): attempted {attempted}, facit {facit}')
            else:
                report.append(f'- `{qid}`')

    report.extend([
        '',
        '## Soft bottlenecks (explanation_helped: false)',
        '',
    ])
    if not soft_diagnoses:
        report.append('_None._')
    else:
        for d in soft_diagnoses:
            tag = '[parser-bug suspect]' if d['looks_like_parser_bug'] else '[pedagogy?]'
            report.append(f'- {tag} `{d["qid"]}`')
            if d['reason']:
                report.append(f'  - {d["reason"][:200]}')

    report.extend([
        '',
        '## High-leverage entries (voice anchors)',
        '',
        f'{len(high_leverage)} practice rounds whose facts powered a later transfer pass.',
        'These are candidate voice anchors for future explanation regens.',
        '',
    ])
    if high_leverage:
        for qid in high_leverage[:20]:  # cap at 20 for readability
            report.append(f'- `{qid}`')
        if len(high_leverage) > 20:
            report.append(f'- … and {len(high_leverage) - 20} more (see run JSON)')

    if additions:
        report.extend([
            '',
            '## known_broken.json updates',
            '',
            f'Added {len(additions)} new parser-bug-suspect entries:',
            *(f'- `{qid}`' for qid in additions),
        ])

    report.extend([
        '',
        '## Concepts struggling',
        '',
    ])
    cs = final.get('concepts_struggling_with', [])
    for c in cs:
        report.append(f'- {c}')

    # ── Write report ─────────────────────────────────────────────────
    reports_dir = SCRIPT_DIR / 'reports'
    reports_dir.mkdir(exist_ok=True)
    report_path = reports_dir / f'{name}-{today}.md'
    report_path.write_text('\n'.join(report))

    # Latest pointer
    (SCRIPT_DIR / '_latest_report.md').write_text('\n'.join(report))

    print(f'Wrote: {report_path}')
    print(f'Wrote: {SCRIPT_DIR / "_latest_report.md"}')

    # ── Summary ─────────────────────────────────────────────────────
    print()
    print('━' * 60)
    print(f'Run summary: {name}')
    print('━' * 60)
    print(f'  baseline:     {baseline_score}/10')
    print(f'  transfers:    {transfer_passed}/{transfer_total}')
    print(f'  bottlenecks:  {len(bottlenecks)} hard + {len(soft_bottlenecks)} soft')
    print(f'  high-leverage: {len(high_leverage)}')
    print(f'  level:        {final.get("estimated_level")}')


if __name__ == '__main__':
    main()

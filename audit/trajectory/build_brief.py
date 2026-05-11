"""
Build a trajectory simulation brief — parameterized version.

Replaces build_brief.py / build_brief_v2.py / build_brief_v3.py.
v3's design (hardened baseline + KaTeX-rendered + known_broken
exclusion) is now the default. Knobs:

    --seed N           random seed (default 44)
    --size mvp|v3|full size preset (default v3)
    --output NAME      output basename (default v3)

Size presets:
    mvp:   10 baseline + 24 practice + 5 transfer  (~30 rounds, 3-4 min)
    v3:    10 baseline + 48 practice + 20 transfer (~68 rounds, 5-7 min)
    full:  10 baseline + 150 practice + 50 transfer (~200 rounds, 15-20 min)

Outputs:
    /tmp/trajectory/<output>_brief.txt
    /tmp/trajectory/<output>_meta.json
"""
import argparse
import json
import random
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from katex_to_ascii import katex_to_ascii


SECTIONS = ['XYZ', 'KVA', 'NOG', 'ORD', 'LÄS', 'MEK', 'ELF']
KATEX_HARD = re.compile(r'\\sqrt|\\frac|\\sin|\\cos|\\tan|\\log|\\ln|\^[2-9]|\\pi|\\geq|\\leq|\\cdot.*\\cdot|x\^|integral|derivat')

PRESETS = {
    'mvp':  {'baseline': 10, 'practice': 24,  'transfer': 5},
    'v3':   {'baseline': 10, 'practice': 48,  'transfer': 20},
    'full': {'baseline': 10, 'practice': 150, 'transfer': 50},
}


def section_of(qid):
    m = re.search(r'-(XYZ|KVA|NOG|DTK|ORD|LÄS|MEK|ELF)-', qid)
    return m.group(1) if m else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--seed', type=int, default=44)
    ap.add_argument('--size', choices=PRESETS.keys(), default='v3')
    ap.add_argument('--output', default=None,
                    help='Output basename. Defaults to size preset name.')
    args = ap.parse_args()
    output = args.output or args.size
    preset = PRESETS[args.size]

    random.seed(args.seed)

    # ── Load corpus ──────────────────────────────────────────────────
    parsed = {}
    for p in sorted(Path('data/parsed').glob('*.json')):
        if p.name.startswith('_'):
            continue
        for q in json.loads(p.read_text()):
            parsed[q['qid']] = q

    explanations = {}
    for p in sorted(Path('data/explanations').glob('*.json')):
        if p.name.startswith('_'):
            continue
        for qid, e in json.loads(p.read_text()).items():
            explanations[qid] = e

    tech_index = json.loads(Path('/tmp/trajectory/technique_index.json').read_text())
    by_qid = tech_index['by_qid']

    regen_queue = json.loads(Path('/tmp/personas/regen_queue.json').read_text())
    hard_pool = (
        {r['qid'] for r in regen_queue.get('tier1', [])}
        | {r['qid'] for r in regen_queue.get('tier2', [])}
    )

    known_broken = set(json.loads(
        Path(__file__).parent.joinpath('known_broken.json').read_text()
    )['qids'])

    eligible = [
        q for q in by_qid
        if by_qid[q]['similar_qids'] and q not in known_broken
    ]

    # ── Hardened baseline ────────────────────────────────────────────
    def baseline_pool_for(sec):
        all_in_sec = [
            q for q in by_qid
            if by_qid[q]['section'] == sec and q not in known_broken
        ]
        if sec in ('NOG', 'KVA'):
            return all_in_sec
        if sec == 'XYZ':
            def is_hard_xyz(qid):
                q = parsed.get(qid, {})
                text = (q.get('prompt') or '') + ' '
                text += ' '.join(o.get('text', '') for o in q.get('options', []))
                return bool(KATEX_HARD.search(text))
            return [q for q in all_in_sec if is_hard_xyz(q)]
        return [q for q in all_in_sec if q in hard_pool]

    baseline = []
    quota = {'NOG': 2, 'KVA': 2, 'ORD': 2, 'LÄS': 1, 'MEK': 1, 'ELF': 1, 'XYZ': 1}
    for sec, n in quota.items():
        pool = baseline_pool_for(sec)
        if pool:
            baseline.extend(random.sample(pool, min(n, len(pool))))
    baseline = baseline[:preset['baseline']]

    # ── Practice ──────────────────────────────────────────────────────
    practice_pool = [q for q in eligible if q not in baseline]
    by_sec = defaultdict(list)
    for q in practice_pool:
        by_sec[by_qid[q]['section']].append(q)

    # Scale per-section quota with the preset
    base_per_section = {'XYZ': 8, 'KVA': 8, 'NOG': 8, 'ORD': 6, 'LÄS': 6, 'MEK': 6, 'ELF': 6}
    base_total = sum(base_per_section.values())
    practice_quota = {
        sec: max(2, round(n * preset['practice'] / base_total))
        for sec, n in base_per_section.items()
    }
    practice = []
    for sec, n in practice_quota.items():
        pool = by_sec.get(sec, [])
        if pool:
            practice.extend(random.sample(pool, min(n, len(pool))))
    random.shuffle(practice)
    practice = practice[:preset['practice']]

    # ── Transfer pairs ────────────────────────────────────────────────
    def is_mirror_pair(a, b):
        a_norm = a.replace('host-ver1-2019', 'X').replace('host-ver2-2019', 'X')
        b_norm = b.replace('host-ver1-2019', 'X').replace('host-ver2-2019', 'X')
        return a_norm == b_norm

    practiced_set = set(practice)
    used_as_transfer = set()
    transfer_pairs = []
    for q in practice:
        sims = by_qid[q]['similar_qids']
        candidate = next(
            (s for s in sims
             if s not in practiced_set
             and s not in used_as_transfer
             and s not in known_broken
             and not is_mirror_pair(q, s)),
            None,
        )
        if candidate:
            transfer_pairs.append((q, candidate))
            used_as_transfer.add(candidate)
        if len(transfer_pairs) >= preset['transfer']:
            break

    # ── Format question helper ───────────────────────────────────────
    def format_question(qid, *, with_answer=False, with_explanation=False):
        q = parsed.get(qid, {})
        out = [f'QID: {qid}']
        ctx = q.get('context')
        if isinstance(ctx, str) and ctx.strip():
            rendered_ctx = katex_to_ascii(ctx)
            out.append(f'PASSAGE ({len(rendered_ctx)} chars): {rendered_ctx[:1500]}')
        out.append(f'PROMPT: {katex_to_ascii(q.get("prompt", ""))}')
        for o in q.get('options', []):
            out.append(f'  {o["letter"]}) {katex_to_ascii(o["text"])}')
        if with_answer:
            out.append(f'FACIT: {q.get("answer")}')
        if with_explanation:
            e = explanations.get(qid, {})
            out.append(f'TECHNIQUE: {katex_to_ascii(e.get("technique", ""))}')
            out.append(f'SOLUTION: {katex_to_ascii(e.get("solution_path", ""))}')
            if e.get('pitfall'):
                out.append(f'PITFALL: {katex_to_ascii(e["pitfall"])}')
            for d in e.get('distractors', []):
                out.append(f'  [{d["letter"]}] tempt: {katex_to_ascii(d.get("why_tempting", ""))[:220]}')
                out.append(f'      wrong: {katex_to_ascii(d.get("why_wrong", ""))[:220]}')
        return '\n'.join(out)

    # ── Build brief ───────────────────────────────────────────────────
    n_practice = len(practice)
    n_transfer = len(transfer_pairs)
    total = n_practice + n_transfer
    reread_rounds = list(range(0, total + 1, 15))

    brief = [
        f'# Trajectory simulation — 0.0 → ? in {total} rounds',
        f'# Size: {args.size}, seed: {args.seed}',
        '',
        'Simulating a 0.0-scoring Swedish high-school student practicing',
        'through the HP-Coach corpus.',
        '',
        '## Math is pre-rendered',
        '',
        'All `\\frac{}{}`, `\\sqrt{}`, `x^{}` etc. are pre-rendered to ASCII',
        '(`(a)/(b)`, `sqrt(a)`, `x^(n)`) matching what students see on screen.',
        'Your grade-9 fraction/exponent/sqrt machinery applies. HP-specific',
        'stressors (NOG/KVA option taxonomies, jargon, stance/inference)',
        'are NOT in your toolkit until facts_learned says so.',
        '',
        '## Persona (re-read at rounds ' + ', '.join(str(r) for r in reread_rounds) + ')',
        '',
        'Read `/home/loucmane/dev/hpfetcher/audit/personas/00.md`.',
        '',
        '## Strict anti-cheat',
        '',
        '`facts_learned` starts EMPTY. You may only use persona-baseline',
        'knowledge + facts in your list. If a concept isn\'t in your toolkit,',
        'output `cant_solve` with a reason.',
        '',
        '## Soft bottlenecks',
        '',
        'Set `explanation_helped: false` and add to `soft_bottlenecks` when',
        'an explanation teaches nothing: parser-broken prompt, vacuous',
        'reasoning, factual errors, template fatigue.',
        '',
        f'## Output → /tmp/trajectory/{output}_run.json',
        '',
        '```json',
        '{',
        '  "baseline_calibration": { "score_out_of_10": N, "attempts": [...] },',
        '  "rounds": [',
        '    {"round": 1, "qid": "...", "kind": "practice",',
        '     "attempted_before": "B" | "cant_solve",',
        '     "facit": "A", "got_right_before": false,',
        '     "explanation_helped": true, "facts_added": [...],',
        '     "section_proficiency_delta": {"KVA": +0.05}},',
        f'    {{"round": {n_practice+1}, "qid": "...", "kind": "transfer_test",',
        '     "practiced_earlier_qid": "...",',
        '     "attempted": "A" | "cant_solve",',
        '     "facit": "A", "passed": true}',
        '  ],',
        '  "final_state": {',
        '    "facts_learned": [...],',
        '    "section_proficiency": {...},',
        '    "estimated_level": 0.7,',
        '    "concepts_struggling_with": [...]',
        '  },',
        '  "bottlenecks": [...],',
        '  "soft_bottlenecks": [...],',
        '  "high_leverage": [...]',
        '}',
        '```',
        '',
        '## ROUND 0 — Hardened baseline',
        '',
        'Stresses HP-specific concepts. Expect: persona answers via',
        'in-persona math/vocab where possible, `cant_solve` on taxonomy',
        'and HP-jargon. Score honestly.',
        '',
    ]
    for qid in baseline:
        brief.append(format_question(qid, with_answer=False))
        brief.append('')

    brief.append('After attempting baseline, check facits:')
    for qid in baseline:
        brief.append(f'  {qid}: facit = {parsed[qid].get("answer")}')
    brief.append('')

    brief.append(f'## ROUNDS 1-{n_practice} — Practice')
    brief.append('')
    for i, qid in enumerate(practice, 1):
        brief.append(f'### Round {i}')
        brief.append('')
        brief.append(format_question(qid, with_answer=True, with_explanation=True))
        brief.append('')

    brief.append(f'## ROUNDS {n_practice+1}-{total} — Transfer tests')
    brief.append('')
    for i, (p_qid, t_qid) in enumerate(transfer_pairs, n_practice + 1):
        brief.append(f'### Round {i} (transfer test for {p_qid})')
        brief.append('')
        brief.append(format_question(t_qid, with_answer=False))
        brief.append(f'(after attempting, reveal: facit = {parsed[t_qid].get("answer")})')
        brief.append('')

    brief.append('## Final output')
    brief.append('')
    brief.append(f'1. Compute final_state.estimated_level')
    brief.append(f'2. bottlenecks: failed transfers')
    brief.append(f'3. soft_bottlenecks: explanation_helped=false rounds')
    brief.append(f'4. high_leverage: passed transfers where original round added a fact')
    brief.append(f'5. Write JSON to /tmp/trajectory/{output}_run.json')

    out_dir = Path('/tmp/trajectory')
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / f'{output}_brief.txt').write_text('\n'.join(brief))
    (out_dir / f'{output}_meta.json').write_text(json.dumps({
        'baseline_qids': baseline,
        'practice_qids': practice,
        'transfer_pairs': transfer_pairs,
        'size': args.size,
        'seed': args.seed,
        'total_rounds': total,
        'excluded_qids': sorted(known_broken),
    }, ensure_ascii=False, indent=2))

    print(f'Built brief — size={args.size}, seed={args.seed}')
    print(f'  baseline: {len(baseline)}, practice: {n_practice}, transfer: {n_transfer}')
    print(f'  total rounds: {total}')
    print(f'  brief size: {sum(len(l) for l in brief) / 1024:.1f} KB')
    print(f'  wrote: /tmp/trajectory/{output}_brief.txt')
    print(f'  wrote: /tmp/trajectory/{output}_meta.json')


if __name__ == '__main__':
    main()

"""
v3 trajectory brief — fixes the methodological bug v2 surfaced.

v2 finding: the agent reported "KaTeX rendering blocks me" on 4/4
soft bottlenecks and 3/5 hard bottlenecks. Root cause: the brief
dumped raw `\\frac{1}{3}` into prompts, but in the actual SPA those
spans are rendered by katex.renderToString into proper fractions.
The persona ("no KaTeX literacy") then refused to engage with math
that a real student WOULD see rendered.

v3 fix: pipe every prompt/option/explanation string through
`katex_to_ascii` so the agent sees roughly what a student sees on
screen (rendered fractions, exponents, radicals).

Also:
- Exclude known-broken qids (from `known_broken.json`)
- Same v2 structure: 10 hardened baseline + 48 practice + 16 transfer

Output: /tmp/trajectory/v3_brief.txt and /tmp/trajectory/v3_meta.json
"""
import json
import random
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from katex_to_ascii import katex_to_ascii


random.seed(44)
SECTIONS = ['XYZ', 'KVA', 'NOG', 'ORD', 'LÄS', 'MEK', 'ELF']
KATEX_HARD = re.compile(r'\\sqrt|\\frac|\\sin|\\cos|\\tan|\\log|\\ln|\^[2-9]|\\pi|\\geq|\\leq|\\cdot.*\\cdot|x\^|integral|derivat')


def section_of(qid):
    m = re.search(r'-(XYZ|KVA|NOG|DTK|ORD|LÄS|MEK|ELF)-', qid)
    return m.group(1) if m else None


# ── Load ──────────────────────────────────────────────────────────────

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
tier1_qids = {r['qid'] for r in regen_queue.get('tier1', [])}
tier2_qids = {r['qid'] for r in regen_queue.get('tier2', [])}
hard_pool = tier1_qids | tier2_qids

known_broken = set(json.loads(
    Path(__file__).parent.joinpath('known_broken.json').read_text()
)['qids'])
print(f'Excluding {len(known_broken)} known-broken qids: {known_broken}')

eligible = [
    q for q in by_qid
    if by_qid[q]['similar_qids']
    and q not in known_broken
]
print(f'Eligible: {len(eligible)}')


# ── Hardened baseline ────────────────────────────────────────────────

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

# ── Practice ──────────────────────────────────────────────────────────

practice_pool = [q for q in eligible if q not in baseline]
by_sec = defaultdict(list)
for q in practice_pool:
    by_sec[by_qid[q]['section']].append(q)

practice_quota = {'XYZ': 8, 'KVA': 8, 'NOG': 8, 'ORD': 6, 'LÄS': 6, 'MEK': 6, 'ELF': 6}
practice = []
for sec, n in practice_quota.items():
    pool = by_sec.get(sec, [])
    if pool:
        practice.extend(random.sample(pool, min(n, len(pool))))
random.shuffle(practice)
practice = practice[:50]


# ── Transfer pairs ────────────────────────────────────────────────────

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
    if len(transfer_pairs) >= 20:
        break

print(f'Practice: {len(practice)}, Transfer pairs: {len(transfer_pairs)}')
print('  practice by sec:', {s: sum(1 for q in practice if section_of(q) == s) for s in SECTIONS})
print('  transfer by sec:', {s: sum(1 for p, _ in transfer_pairs if section_of(p) == s) for s in SECTIONS})


# ── Format question (KaTeX-rendered to ASCII) ────────────────────────

def format_question(qid, *, with_answer=False, with_explanation=False):
    q = parsed.get(qid, {})
    out = [f'QID: {qid}']
    ctx = q.get('context')
    if isinstance(ctx, str) and ctx.strip():
        rendered_ctx = katex_to_ascii(ctx)
        out.append(f'PASSAGE ({len(rendered_ctx)} chars): {rendered_ctx[:1200]}')
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
            out.append(f'  [{d["letter"]}] tempt: {katex_to_ascii(d.get("why_tempting", ""))[:200]}')
            out.append(f'      wrong: {katex_to_ascii(d.get("why_wrong", ""))[:200]}')
    return '\n'.join(out)


# ── Build brief ───────────────────────────────────────────────────────

n_practice = len(practice)
n_transfer = len(transfer_pairs)
total_rounds = n_practice + n_transfer

brief = [
    f'# Trajectory simulation v3 — 0.0 → ? in {total_rounds} rounds',
    '',
    'You are simulating a Swedish high-school student who scored 0.0',
    'on a mock HP exam. v3 of the trajectory simulation.',
    '',
    '## NEW IN v3: math is rendered',
    '',
    'In v2 you correctly flagged that raw KaTeX (`\\frac{a}{b}`, `x^{n}`)',
    'was unreadable to the persona. The SPA actually renders these as',
    'proper fractions and exponents on screen. v3 pre-renders math',
    'using katex_to_ascii, so what you see in the brief matches what',
    'a real student sees on screen — e.g. `(1)/(3)` instead of',
    '`\\frac{1}{3}`, `x^(5)` instead of `x^{5}`.',
    '',
    'This means: fraction arithmetic, simple exponents, square roots',
    'ARE accessible to you (you have grade-9 math). Use them. The',
    'remaining stressors (option taxonomies, jargon, stance/inference)',
    'are still NOT in your toolkit until your facts_learned says so.',
    '',
    '## Persona spec (READ FIRST, re-read every 15 rounds)',
    '',
    'Read `/home/loucmane/dev/hpfetcher/audit/personas/00.md` for your',
    'baseline knowledge state.',
    '',
    '## Anti-cheat protocol (same as v2)',
    '',
    'You have a `facts_learned` list. Initially: EMPTY.',
    'You may ONLY use:',
    '1. Persona-baseline knowledge (grade-9 math incl. simple fractions,',
    '   exponents, square roots; common Swedish; basic English)',
    '2. Facts in `facts_learned`',
    '',
    'If a question requires a concept NOT in your toolkit, output',
    '`cant_solve` with a reason naming the missing concept.',
    '',
    '## Soft bottlenecks',
    '',
    'When you study an explanation and learn nothing useful from it',
    '(parser-broken prompt, vacuous "av figuren" reasoning, template',
    'fatigue, factual error in the explanation), set',
    '`explanation_helped: false` AND add the qid to `soft_bottlenecks`.',
    '',
    '## Output → /tmp/trajectory/v3_run.json',
    '',
    '```json',
    '{',
    '  "baseline_calibration": { "score_out_of_10": N, "attempts": [...] },',
    '  "rounds": [',
    '    {"round": 1, "qid": "...", "kind": "practice",',
    '     "attempted_before": "B" | "cant_solve",',
    '     "facit": "A", "got_right_before": false,',
    '     "explanation_helped": true,',
    '     "facts_added": ["KVA option A = I>II"],',
    '     "section_proficiency_delta": {"KVA": +0.05}},',
    '    ...,',
    f'    {{"round": {n_practice+1}, "qid": "...", "kind": "transfer_test",',
    '     "practiced_earlier_qid": "...",',
    '     "attempted": "A" | "cant_solve",',
    '     "facit": "A", "passed": true}',
    '  ],',
    '  "final_state": {',
    '    "facts_learned": [...],',
    '    "section_proficiency": {"XYZ": 0.4, ...},',
    '    "estimated_level": 0.7,',
    '    "concepts_struggling_with": [...]',
    '  },',
    '  "bottlenecks": ["qid where transfer failed", ...],',
    '  "soft_bottlenecks": ["qid where explanation_helped=false", ...],',
    '  "high_leverage": ["qid where transfer passed AND fact added", ...]',
    '}',
    '```',
    '',
    '## ROUND 0 — Hardened baseline calibration',
    '',
    'These 10 baseline questions stress HP-specific concepts (option',
    'taxonomies, jargon, KaTeX-heavy quant). With math rendered, you',
    'should be able to attempt fraction questions but still hit walls',
    'on NOG/KVA taxonomies, ORD jargon, and inference-heavy reading.',
    '',
    '**Expected baseline: 2-4/10.** (Slightly higher than v2 because',
    'rendered fractions are now accessible.)',
    '',
    'Baseline questions:',
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

brief.append(f'## ROUNDS {n_practice+1}-{total_rounds} — Transfer tests')
brief.append('')
for i, (practiced_qid, transfer_qid) in enumerate(transfer_pairs, n_practice + 1):
    brief.append(f'### Round {i} (transfer test for {practiced_qid})')
    brief.append('')
    brief.append(format_question(transfer_qid, with_answer=False))
    brief.append(f'(after attempting, reveal: facit = {parsed[transfer_qid].get("answer")})')
    brief.append('')

brief.append('## Final output')
brief.append('')
brief.append(f'After all {total_rounds} rounds:')
brief.append('1. Compute final_state.estimated_level')
brief.append('2. bottlenecks: failed transfers')
brief.append('3. soft_bottlenecks: explanation_helped=false rounds')
brief.append('4. high_leverage: passed transfers where original round added a fact')
brief.append('5. Write JSON to /tmp/trajectory/v3_run.json')
brief.append('')
brief.append('Begin with Round 0.')

Path('/tmp/trajectory').mkdir(parents=True, exist_ok=True)
Path('/tmp/trajectory/v3_brief.txt').write_text('\n'.join(brief))
Path('/tmp/trajectory/v3_meta.json').write_text(json.dumps({
    'baseline_qids': baseline,
    'baseline_by_section': {
        sec: [q for q in baseline if section_of(q) == sec] for sec in SECTIONS
    },
    'practice_qids': practice,
    'transfer_pairs': transfer_pairs,
    'expected_baseline_score_range': '2-4/10',
    'total_rounds': total_rounds,
    'method_change_from_v2': 'KaTeX → ASCII rendering applied to all prompt/option/explanation text',
    'excluded_qids': sorted(known_broken),
}, ensure_ascii=False, indent=2))

print()
print(f'Built v3 brief ({len(brief)} lines, ~{sum(len(l) for l in brief)/1024:.1f} KB)')
print(f'Wrote: /tmp/trajectory/v3_brief.txt')
print(f'Total rounds: {total_rounds} ({n_practice} practice + {n_transfer} transfer)')

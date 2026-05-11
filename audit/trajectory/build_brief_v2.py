"""
v2 trajectory brief — addresses the 4 issues surfaced by the MVP.

Differences from v1 (build_brief.py):

1. HARDENED BASELINE selection.
   - NOG (always — option taxonomy unknown to 0.0)
   - KVA (always — option taxonomy unknown to 0.0)
   - ORD: pull from Tier-2 ORD (8 entries the 0.0 persona wavered on)
   - LÄS / MEK / ELF: pull from Tier-1/2 (persona-confirmed hard)
   - XYZ: filter for KaTeX-heavy content (\\sqrt, \\frac, \\sin, \\log,
     ^, exponents — anything beyond grade-9 algebra)
   Goal: re-tested baseline should hit 1-3/10.

2. 50 PRACTICE rounds (up from 24). ≥6 per section so per-section
   proficiency deltas have signal vs noise. DTK skipped — no Layer-2.

3. 20 TRANSFER TESTS (up from 5). With n=20 we can detect transfer
   rates < 50% per technique.

4. CAPTURE `explanation_helped: false` as soft bottleneck signal. The
   v1 brief asked for it; the v2 brief instructs the agent to ADD these
   qids to a `soft_bottlenecks` list alongside the transfer-test
   `bottlenecks` list.

Output: /tmp/trajectory/v2_brief.txt and /tmp/trajectory/v2_meta.json
"""
import json
import random
import re
from collections import defaultdict
from pathlib import Path


random.seed(43)  # different seed from v1 so we don't re-pick the same questions
SECTIONS = ['XYZ', 'KVA', 'NOG', 'ORD', 'LÄS', 'MEK', 'ELF']

# Heuristic: a quant question is HP-grade (not grade-9) if its prompt
# or options contain any of these tokens
KATEX_HARD = re.compile(r'\\sqrt|\\frac|\\sin|\\cos|\\tan|\\log|\\ln|\^[2-9]|\\pi|\\geq|\\leq|\\cdot.*\\cdot|x\^|integral|derivat')


def section_of(qid):
    m = re.search(r'-(XYZ|KVA|NOG|DTK|ORD|LÄS|MEK|ELF)-', qid)
    return m.group(1) if m else None


# ── Load everything ───────────────────────────────────────────────────

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

# Eligible for practice/transfer = has explanation AND has ≥1 similar partner
eligible = [q for q in by_qid if by_qid[q]['similar_qids']]
print(f'Eligible (has similar partner): {len(eligible)}')
print(f'Hard pool (Tier 1+2):           {len(hard_pool)}')


# ── HARDENED BASELINE ─────────────────────────────────────────────────

def baseline_pool_for(sec):
    """Return question pool stratified for HP-specific stressors."""
    all_in_sec = [q for q in by_qid if by_qid[q]['section'] == sec]
    if sec in ('NOG', 'KVA'):
        # taxonomy is the stressor — any entry stresses a 0.0 student
        return all_in_sec
    if sec == 'XYZ':
        # KaTeX-heavy XYZ — filter by prompt content
        def is_hard_xyz(qid):
            q = parsed.get(qid, {})
            text = (q.get('prompt') or '') + ' '
            text += ' '.join(o.get('text', '') for o in q.get('options', []))
            return bool(KATEX_HARD.search(text))
        return [q for q in all_in_sec if is_hard_xyz(q)]
    # ORD / LÄS / MEK / ELF — Tier-1/2 entries (persona-confirmed hard)
    return [q for q in all_in_sec if q in hard_pool]


baseline = []
# 2 NOG, 2 KVA, 2 ORD, 1 LÄS, 1 MEK, 1 ELF, 1 XYZ-hard
quota = {'NOG': 2, 'KVA': 2, 'ORD': 2, 'LÄS': 1, 'MEK': 1, 'ELF': 1, 'XYZ': 1}
for sec, n in quota.items():
    pool = baseline_pool_for(sec)
    if pool:
        baseline.extend(random.sample(pool, min(n, len(pool))))
print(f'Hardened baseline: {len(baseline)} questions')
print('  by section:', {sec: sum(1 for q in baseline if section_of(q) == sec) for sec in SECTIONS})


# ── 50 PRACTICE ROUNDS ────────────────────────────────────────────────

# Avoid practising baseline questions
practice_pool = [q for q in eligible if q not in baseline]
by_sec = defaultdict(list)
for q in practice_pool:
    by_sec[by_qid[q]['section']].append(q)

# At least 6 per section (8 for quant — XYZ/KVA/NOG)
practice_quota = {'XYZ': 8, 'KVA': 8, 'NOG': 8, 'ORD': 6, 'LÄS': 6, 'MEK': 6, 'ELF': 6}
practice = []
for sec, n in practice_quota.items():
    pool = by_sec.get(sec, [])
    if pool:
        practice.extend(random.sample(pool, min(n, len(pool))))

random.shuffle(practice)
practice = practice[:50]
print(f'Practice: {len(practice)} rounds')
print('  by section:', {sec: sum(1 for q in practice if section_of(q) == sec) for sec in SECTIONS})


# ── 20 TRANSFER TESTS ─────────────────────────────────────────────────

def is_mirror_pair(a, b):
    a_norm = a.replace('host-ver1-2019', 'X').replace('host-ver2-2019', 'X')
    b_norm = b.replace('host-ver1-2019', 'X').replace('host-ver2-2019', 'X')
    return a_norm == b_norm


practiced_set = set(practice)
used_as_transfer = set()
transfer_pairs = []  # (practiced_qid, transfer_qid)

for q in practice:
    sims = by_qid[q]['similar_qids']
    candidate = next(
        (s for s in sims
         if s not in practiced_set
         and s not in used_as_transfer
         and not is_mirror_pair(q, s)),
        None,
    )
    if candidate:
        transfer_pairs.append((q, candidate))
        used_as_transfer.add(candidate)
    if len(transfer_pairs) >= 20:
        break

print(f'Transfer pairs: {len(transfer_pairs)}')
print('  by section:', {sec: sum(1 for p, _ in transfer_pairs if section_of(p) == sec) for sec in SECTIONS})


# ── Format helpers ────────────────────────────────────────────────────

def format_question(qid, *, with_answer=False, with_explanation=False):
    q = parsed.get(qid, {})
    out = [f'QID: {qid}']
    ctx = q.get('context')
    if isinstance(ctx, str) and ctx.strip():
        out.append(f'PASSAGE ({len(ctx)} chars): {ctx[:1200]}')
    out.append(f'PROMPT: {q.get("prompt", "")}')
    for o in q.get('options', []):
        out.append(f'  {o["letter"]}) {o["text"]}')
    if with_answer:
        out.append(f'FACIT: {q.get("answer")}')
    if with_explanation:
        e = explanations.get(qid, {})
        out.append(f'TECHNIQUE: {e.get("technique")}')
        out.append(f'SOLUTION: {e.get("solution_path")}')
        if e.get('pitfall'):
            out.append(f'PITFALL: {e["pitfall"]}')
        for d in e.get('distractors', []):
            out.append(f'  [{d["letter"]}] tempt: {d.get("why_tempting", "")[:200]}')
            out.append(f'      wrong: {d.get("why_wrong", "")[:200]}')
    return '\n'.join(out)


# ── Build brief ───────────────────────────────────────────────────────

n_practice = len(practice)
n_transfer = len(transfer_pairs)
total_rounds = n_practice + n_transfer

brief = [
    f'# Trajectory simulation v2 — 0.0 → ? in {total_rounds} rounds',
    '',
    'You are simulating a Swedish high-school student who scored 0.0',
    'on a mock HP exam. v2 of the trajectory simulation.',
    '',
    '## Persona spec (READ FIRST, re-read every 15 rounds)',
    '',
    'Read `/home/loucmane/dev/hpfetcher/audit/personas/00.md` for your',
    'baseline knowledge state (grade-9 math, native Swedish, no HP',
    'jargon, no KaTeX literacy). Re-read at rounds 0, 15, 30, 45.',
    '',
    '## STRICT anti-cheat protocol',
    '',
    'You have a `facts_learned` list. Initially: EMPTY.',
    'When attempting a question, you may ONLY use:',
    '1. Knowledge from your 00.md persona spec (grade-9 math, common',
    '   Swedish vocab, basic English)',
    '2. Facts in your `facts_learned` list (which only grow from',
    '   explanations you actually study)',
    '',
    'If a question requires a concept NOT in your toolkit, output',
    '`cant_solve` with a reason naming the missing concept.',
    '',
    'KEY INSIGHT FROM MVP: grade-9 algebra and natural Swedish/English',
    'ARE in-persona. Use them. But the HP-specific stressors — option',
    'taxonomies (NOG A/B/C/D, KVA verdicts), jargon vocabulary, KaTeX',
    'notation, stance/inference reading — are NOT in your toolkit',
    'until your `facts_learned` says so.',
    '',
    '## NEW IN v2: soft_bottlenecks',
    '',
    'When you study an explanation and learn nothing useful from it',
    '(broken parser, vacuous "av figuren" reasoning, template-fatigued',
    'pedagogy, etc.), set `explanation_helped: false` AND add the qid',
    'to `soft_bottlenecks` in your final output. These are entries the',
    'corpus needs to fix even when no transfer test exists for them.',
    '',
    '## Output format — write to /tmp/trajectory/v2_run.json',
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
    '    "section_proficiency": {"XYZ": 0.4, "KVA": 0.3, ...},',
    '    "estimated_level": 0.7,',
    '    "concepts_struggling_with": [...]',
    '  },',
    '  "bottlenecks": ["qid where transfer test failed", ...],',
    '  "soft_bottlenecks": ["qid where explanation_helped=false", ...],',
    '  "high_leverage": ["qid where transfer test passed AND fact added", ...]',
    '}',
    '```',
    '',
    '## ROUND 0 — Hardened baseline calibration',
    '',
    'These 10 baseline questions are SELECTED to stress HP-specific',
    'concepts (option taxonomies, jargon, KaTeX-heavy quant). Pure',
    'grade-9 algebra was excluded from the baseline pool — those',
    'questions ARE in-persona and not informative for calibration.',
    '',
    'Attempt each using ONLY persona-baseline knowledge. **Expected',
    'baseline: 1-3/10.** Higher than this means either persona drift',
    'or that the baseline pool still has too-easy entries.',
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
brief.append('For each round: see question, attempt with current state,')
brief.append('reveal facit + explanation, update state. If the explanation')
brief.append('taught you nothing (parser-broken, vacuous, template-fatigued),')
brief.append('set `explanation_helped: false` and we will record it as a')
brief.append('soft bottleneck.')
brief.append('')
for i, qid in enumerate(practice, 1):
    brief.append(f'### Round {i}')
    brief.append('')
    brief.append(format_question(qid, with_answer=True, with_explanation=True))
    brief.append('')

brief.append(f'## ROUNDS {n_practice+1}-{total_rounds} — Transfer tests')
brief.append('')
brief.append('Each transfer test gives you a question that uses the SAME')
brief.append('technique as one you practiced earlier. Attempt using only')
brief.append('your current state. NO explanation revealed. Pass = the')
brief.append('earlier explanation TRANSFERRED. Fail = BOTTLENECK.')
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
brief.append('1. Compute `final_state.estimated_level`:')
brief.append('   - facts_learned count (~70 facts ≈ level 1.0)')
brief.append('   - section_proficiency averages')
brief.append('   - transfer-test pass rate')
brief.append('2. `bottlenecks`: transfer tests that FAILED')
brief.append('3. `soft_bottlenecks`: rounds with explanation_helped=false')
brief.append('4. `high_leverage`: transfer tests PASSED AND original round added a fact')
brief.append('5. Write the complete JSON to /tmp/trajectory/v2_run.json')
brief.append('')
brief.append('## Hard rules')
brief.append('- BE HONEST about what you know.')
brief.append('- DO NOT spawn subagents.')
brief.append('- DO NOT call the Anthropic API.')
brief.append('- Read-only on the corpus.')
brief.append('- Re-read 00.md at rounds 0, 15, 30, 45.')
brief.append('')
brief.append('Begin with Round 0 hardened baseline calibration.')

Path('/tmp/trajectory').mkdir(parents=True, exist_ok=True)
Path('/tmp/trajectory/v2_brief.txt').write_text('\n'.join(brief))
Path('/tmp/trajectory/v2_meta.json').write_text(json.dumps({
    'baseline_qids': baseline,
    'baseline_by_section': {
        sec: [q for q in baseline if section_of(q) == sec] for sec in SECTIONS
    },
    'practice_qids': practice,
    'transfer_pairs': transfer_pairs,
    'expected_baseline_score_range': '1-3/10',
    'total_rounds': total_rounds,
}, ensure_ascii=False, indent=2))

print()
print(f'Built v2 brief ({len(brief)} lines, ~{sum(len(l) for l in brief)/1024:.1f} KB)')
print(f'Wrote: /tmp/trajectory/v2_brief.txt')
print(f'Wrote: /tmp/trajectory/v2_meta.json')
print()
print(f'Total rounds: {total_rounds} ({n_practice} practice + {n_transfer} transfer)')
print()
print(f'Baseline qids ({len(baseline)}):')
for q in baseline:
    print(f'  {q} ({section_of(q)})')
print()
print(f'Transfer pairs ({len(transfer_pairs)}):')
for p, t in transfer_pairs:
    print(f'  {p} → {t}')

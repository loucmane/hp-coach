"""
Build a complete trajectory-agent brief for an MVP 30-round simulation.

Output: /tmp/trajectory/mvp_brief.txt — the prompt to send to one
Opus agent. The agent runs the full simulation in its session and
writes results to /tmp/trajectory/mvp_run.json.

Round structure:
- Round 0: baseline calibration (10 questions across sections, no
  help, score yourself) → must be 0-3/10 for the persona to be valid
- Rounds 1-24: practice (full question + facit + explanation;
  update state)
- Rounds 25-29: transfer tests (5 entries; pick similar partner of
  an earlier practice qid; attempt with state only)
"""
import json
import random
import re
from collections import defaultdict
from pathlib import Path


random.seed(42)
SECTIONS = ['XYZ', 'KVA', 'NOG', 'ORD', 'LÄS', 'MEK', 'ELF']


def section_of(qid):
    m = re.search(r'-(XYZ|KVA|NOG|DTK|ORD|LÄS|MEK|ELF)-', qid)
    return m.group(1) if m else None


# Load corpus + index
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

# Eligible qids = have an explanation AND have ≥1 similar partner
eligible = [q for q in by_qid if by_qid[q]['similar_qids']]
print(f'Eligible (with similar partner): {len(eligible)}')

# Stratified sample for 24 practice rounds: ~3-4 per section
practice = []
by_sec = defaultdict(list)
for q in eligible:
    by_sec[by_qid[q]['section']].append(q)

for sec in SECTIONS:
    pool = by_sec.get(sec, [])
    if not pool: continue
    n = 4 if sec in ('XYZ', 'KVA', 'NOG') else 3  # extra quant
    practice.extend(random.sample(pool, min(n, len(pool))))
random.shuffle(practice)
practice = practice[:24]

def is_mirror_pair(a, b):
    """host-ver1-2019 and host-ver2-2019 are byte-identical exams.
    A 'transfer test' between mirrors isn't a real transfer."""
    a_norm = a.replace('host-ver1-2019', 'X').replace('host-ver2-2019', 'X')
    b_norm = b.replace('host-ver1-2019', 'X').replace('host-ver2-2019', 'X')
    return a_norm == b_norm


# Build 5 transfer tests: pick 5 of the practice entries that have
# a similar partner not already in practice AND not a mirror
transfer_pairs = []  # (practiced_qid, transfer_qid)
practiced_set = set(practice)
for q in practice:
    sims = by_qid[q]['similar_qids']
    candidate = next(
        (s for s in sims
         if s not in practiced_set and not is_mirror_pair(q, s)),
        None,
    )
    if candidate:
        transfer_pairs.append((q, candidate))
    if len(transfer_pairs) >= 5:
        break

# If we couldn't find 5 transfer pairs from the practice set, sweep
# the eligible pool for any non-mirror pair
if len(transfer_pairs) < 5:
    print(f'  Only {len(transfer_pairs)} mirror-free pairs from practice;'
          ' supplementing from eligible pool...')
    extra_practice = []
    for cand in eligible:
        if cand in practiced_set:
            continue
        if cand in [p for p, _ in transfer_pairs]:
            continue
        sims = by_qid[cand]['similar_qids']
        partner = next(
            (s for s in sims
             if s not in practiced_set
             and not is_mirror_pair(cand, s)
             and s != cand),
            None,
        )
        if partner:
            extra_practice.append(cand)
            transfer_pairs.append((cand, partner))
        if len(transfer_pairs) >= 5:
            break
    # Add the extra practice qids to the practice list so they're studied
    practice = practice + extra_practice
    practice = practice[:24 + len(extra_practice)]

# Baseline: 10 random questions across sections, no answer shown
baseline = []
for sec in SECTIONS:
    pool = [q for q in by_qid if by_qid[q]['section'] == sec]
    if pool:
        baseline.append(random.choice(pool))
# top up to 10
extras = [q for q in eligible if q not in baseline][:10 - len(baseline)]
baseline = (baseline + extras)[:10]


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


# Build the brief
brief = [
    '# Trajectory simulation MVP — 0.0 → ? in 30 rounds',
    '',
    'You are simulating a Swedish high-school student who scored 0.0',
    'on a mock HP exam. Your job: practice through 30 rounds using the',
    'HP-Coach corpus and HONESTLY model whether each explanation moves',
    'your knowledge state forward.',
    '',
    '## Persona spec (READ FIRST)',
    '',
    'Read `/home/loucmane/dev/hpfetcher/audit/personas/00.md` for your',
    'baseline knowledge state (grade-9 math, native Swedish, no HP',
    'jargon, no KaTeX literacy). Re-read it every 10 rounds.',
    '',
    '## STRICT anti-cheat protocol',
    '',
    'You have a `facts_learned` list. Initially: EMPTY.',
    'When attempting a question, you may ONLY use:',
    '1. Knowledge from your 00.md persona spec (grade-9 math, common',
    '   Swedish vocab)',
    '2. Facts in your `facts_learned` list (which only grow from',
    '   explanations you actually study)',
    '',
    'If a question requires a concept NOT in your toolkit, output:',
    '```json',
    '{"qid": "...", "attempted": "cant_solve",',
    ' "reason": "I don\'t know what \'Pythagoras\' means yet"}',
    '```',
    '',
    'DO NOT guess based on model-baseline knowledge. The simulation is',
    'only useful if your knowledge state is honest.',
    '',
    '## Output format — write to /tmp/trajectory/mvp_run.json',
    '',
    'Single JSON object:',
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
    '    {"round": 25, "qid": "...", "kind": "transfer_test",',
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
    '  "high_leverage": ["qid where transfer test passed AND fact added", ...]',
    '}',
    '```',
    '',
    '## ROUND 0 — Baseline calibration',
    '',
    'Below are 10 random questions across sections. Attempt each',
    'using ONLY persona-baseline knowledge (no facts yet). For each:',
    'output your attempted letter OR `cant_solve` + reason. After all',
    '10, compute `score_out_of_10` against the facits.',
    '',
    '**Expected baseline: 0-3/10.** If you score higher, you are',
    'leaking model-baseline knowledge into the persona — re-read 00.md',
    'and try again.',
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

brief.append('## ROUNDS 1-24 — Practice')
brief.append('')
brief.append('For each round: see question, attempt with current state,')
brief.append('reveal facit + explanation, update state. Output one round')
brief.append('object per round in the `rounds` array.')
brief.append('')
for i, qid in enumerate(practice, 1):
    brief.append(f'### Round {i}')
    brief.append('')
    brief.append(format_question(qid, with_answer=True, with_explanation=True))
    brief.append('')

brief.append('## ROUNDS 25-29 — Transfer tests')
brief.append('')
brief.append('Each transfer test gives you a question that uses the SAME')
brief.append('technique as one you practiced earlier. Attempt using only')
brief.append('your current state. NO explanation revealed. If you pass,')
brief.append('the earlier explanation TRANSFERRED. If you fail, the')
brief.append('earlier explanation is a BOTTLENECK.')
brief.append('')
for i, (practiced_qid, transfer_qid) in enumerate(transfer_pairs, 25):
    brief.append(f'### Round {i} (transfer test for {practiced_qid})')
    brief.append('')
    brief.append(format_question(transfer_qid, with_answer=False))
    brief.append(f'(after attempting, reveal: facit = {parsed[transfer_qid].get("answer")})')
    brief.append('')

brief.append('## Final output')
brief.append('')
brief.append('After all 30 rounds:')
brief.append('1. Compute `final_state.estimated_level` based on:')
brief.append('   - How many facts learned (~50 facts = level 1.0)')
brief.append('   - Section proficiency averages')
brief.append('   - Transfer test pass rate')
brief.append('2. Build `bottlenecks` list (transfer tests that FAILED → name')
brief.append('   the practiced_earlier_qid)')
brief.append('3. Build `high_leverage` list (transfer tests that PASSED AND')
brief.append('   the original practice round added a fact)')
brief.append('4. Write the complete JSON to /tmp/trajectory/mvp_run.json')
brief.append('')
brief.append('## Hard rules')
brief.append('- BE HONEST about what you know. The simulation only works if')
brief.append('  you stay in character.')
brief.append('- DO NOT spawn subagents.')
brief.append('- DO NOT call the Anthropic API.')
brief.append('- Read-only on the corpus (no file edits).')
brief.append('- Re-read 00.md at rounds 0, 10, 20.')
brief.append('')
brief.append('Begin with Round 0 baseline calibration.')

Path('/tmp/trajectory').mkdir(parents=True, exist_ok=True)
Path('/tmp/trajectory/mvp_brief.txt').write_text('\n'.join(brief))
Path('/tmp/trajectory/mvp_meta.json').write_text(json.dumps({
    'baseline_qids': baseline,
    'practice_qids': practice,
    'transfer_pairs': transfer_pairs,
    'expected_baseline_score_range': '0-3/10',
}, ensure_ascii=False, indent=2))

print(f'Built MVP brief ({len(brief)} lines)')
print(f'Wrote: /tmp/trajectory/mvp_brief.txt')
print(f'Wrote: /tmp/trajectory/mvp_meta.json')
print(f'\nBaseline qids ({len(baseline)}):')
for q in baseline: print(f'  {q}')
print(f'\nPractice qids ({len(practice)}):')
for q in practice: print(f'  {q}')
print(f'\nTransfer pairs ({len(transfer_pairs)}):')
for p, t in transfer_pairs:
    print(f'  {p} → {t}')

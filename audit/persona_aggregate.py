"""
Phase D — aggregate persona findings into tiered regen queue.

Reads:
- /tmp/personas/findings_00_<SEC>.json × 7 (sharded 0.0)
- /tmp/personas/findings_05.json
- /tmp/personas/findings_10.json
- /tmp/personas/findings_15.json
- /tmp/personas/findings_20.json

Produces:
- /tmp/personas/findings_00.json — merged 0.0 across sections
- /tmp/personas/regen_queue.json — tiered with failure_points per entry
- /tmp/personas/calibration.json (updated) — score matrix for the 20-entry calibration set
- data/explanations/_persona_findings.md — final markdown report
"""
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

PERSONAS = Path('/tmp/personas')
SECTIONS = ['XYZ', 'KVA', 'NOG', 'ORD', 'LÄS', 'MEK', 'ELF']
SECTION_RE = re.compile(r'-(XYZ|KVA|NOG|DTK|ORD|LÄS|MEK|ELF)-')


def section_of(qid):
    m = SECTION_RE.search(qid)
    return m.group(1) if m else None


# ─── Load findings ────────────────────────────────────────────────

findings_by_level = {}  # level → list[dict]

# Merge sharded 0.0
shards = []
for sec in SECTIONS:
    f = PERSONAS / f'findings_00_{sec}.json'
    if not f.exists():
        print(f'Missing 0.0 shard: {sec}')
        continue
    data = json.loads(f.read_text())
    if isinstance(data, list):
        shards.extend(data)
    else:
        # Possibly a dict, normalize
        shards.extend(list(data.values()) if isinstance(data, dict) else [])

# Filter to only level == 0.0 (some shards may have stray entries)
findings_by_level['0.0'] = [e for e in shards if e.get('level') == '0.0']
(PERSONAS / 'findings_00.json').write_text(
    json.dumps(findings_by_level['0.0'], ensure_ascii=False, indent=2)
)

for level in ('0.5', '1.0', '1.5', '2.0'):
    short = level.replace('.', '')  # "05", "10", "15", "20"
    f = PERSONAS / f'findings_{short}.json'
    if not f.exists():
        print(f'Missing level findings: {level}')
        findings_by_level[level] = []
        continue
    data = json.loads(f.read_text())
    if isinstance(data, list):
        findings_by_level[level] = [e for e in data if e.get('level') == level]
    else:
        findings_by_level[level] = []

print('\nLoaded findings:')
for level, items in findings_by_level.items():
    print(f'  {level}: {len(items)} entries')


# ─── Per-qid aggregation ──────────────────────────────────────────

by_qid = defaultdict(dict)  # qid → {level → finding}
for level, items in findings_by_level.items():
    for entry in items:
        qid = entry.get('qid')
        if qid:
            by_qid[qid][level] = entry


# ─── Tier classification ──────────────────────────────────────────

tier1 = []  # 0.0 scored ≤2
tier2 = []  # 0.0 scored 3 OR 0.5 scored ≤2
tier3 = []  # 2.0 flagged, 1.0/1.5 wavered
tier0 = []  # validated clean (all that touched, ≥4)

for qid, by_level in by_qid.items():
    s00 = by_level.get('0.0', {}).get('score')
    s05 = by_level.get('0.5', {}).get('score')
    s10 = by_level.get('1.0', {}).get('score')
    s15 = by_level.get('1.5', {}).get('score')
    s20 = by_level.get('2.0', {}).get('score')

    scores = [s for s in (s00, s05, s10, s15, s20) if s is not None]
    if not scores:
        continue

    record = {
        'qid': qid,
        'section': section_of(qid),
        'scores': {'0.0': s00, '0.5': s05, '1.0': s10, '1.5': s15, '2.0': s20},
        'failure_points': {
            lvl: by_level.get(lvl, {}).get('failure_points', [])
            for lvl in by_level
        },
        'suggested_improvements': {
            lvl: by_level.get(lvl, {}).get('suggested_improvement', '')
            for lvl in by_level
        },
    }

    if s00 is not None and s00 <= 2:
        tier1.append(record)
    elif s00 == 3 or (s05 is not None and s05 <= 2):
        tier2.append(record)
    elif (s20 is not None and s20 <= 3) or (s15 is not None and s15 <= 2) or (s10 is not None and s10 <= 2):
        tier3.append(record)
    elif all(s >= 4 for s in scores):
        tier0.append(record)

print()
print('=' * 60)
print('Tier sizes')
print('=' * 60)
print(f'Tier 1 (0.0 lost; user-current priority):     {len(tier1)}')
print(f'Tier 2 (0.0 wavered or 0.5 lost):             {len(tier2)}')
print(f'Tier 3 (2.0 critique / 1.0/1.5 wavered):      {len(tier3)}')
print(f'Tier 0 (all scored ≥4 — confirmed clean):     {len(tier0)}')


# ─── Per-section, per-tier breakdown ──────────────────────────────

print()
print('Tier 1 by section:')
sec_t1 = Counter(r['section'] for r in tier1)
for sec in SECTIONS:
    print(f'  {sec}: {sec_t1.get(sec, 0)}')


# ─── Calibration matrix ──────────────────────────────────────────

calibration_qids = set(json.loads((PERSONAS / 'calibration.json').read_text()))
calib_matrix = []
for qid in sorted(calibration_qids):
    by_level = by_qid.get(qid, {})
    calib_matrix.append({
        'qid': qid,
        'section': section_of(qid),
        '0.0': by_level.get('0.0', {}).get('score'),
        '0.5': by_level.get('0.5', {}).get('score'),
        '1.0': by_level.get('1.0', {}).get('score'),
        '1.5': by_level.get('1.5', {}).get('score'),
        '2.0': by_level.get('2.0', {}).get('score'),
    })

# Compute monotonicity: how often does score weakly increase from 0.0 → 2.0?
mono_count = 0
total = 0
for row in calib_matrix:
    scores = [row[lvl] for lvl in ('0.0', '0.5', '1.0', '1.5', '2.0') if row[lvl] is not None]
    if len(scores) < 3:
        continue
    total += 1
    # weakly non-decreasing?
    if all(scores[i] <= scores[i+1] for i in range(len(scores) - 1)):
        mono_count += 1

print()
print('Calibration check:')
print(f'  Calibration set size: {len(calib_matrix)}')
print(f'  Entries with ≥3 persona scores: {total}')
print(f'  Weakly non-decreasing 0.0 → 2.0: {mono_count}/{total}')


# ─── Save aggregated outputs ──────────────────────────────────────

(PERSONAS / 'regen_queue.json').write_text(json.dumps({
    'tier1': tier1, 'tier2': tier2, 'tier3': tier3, 'tier0_count': len(tier0),
}, ensure_ascii=False, indent=2))

(PERSONAS / 'calibration_matrix.json').write_text(
    json.dumps(calib_matrix, ensure_ascii=False, indent=2)
)


# ─── Aggregate failure patterns ──────────────────────────────────

# Pattern extraction: count common substrings in failure_points across levels
all_failure_text = []
for record in tier1 + tier2:
    for lvl, fps in record['failure_points'].items():
        if isinstance(fps, list):
            all_failure_text.extend(fps)

# Simple keyword counting
KEYWORDS = [
    'figure', 'figuren', 'parser', 'corrupt', 'truncat', 'derivation', 'skip',
    'kollokation', 'rektion', 'register', 'jargon', 'undef', 'KaTeX', '\\frac',
    'strawman', 'shortcut', 'medium', 'AM-GM', 'modulo',
]
keyword_counts = Counter()
for text in all_failure_text:
    text_lower = text.lower()
    for kw in KEYWORDS:
        if kw.lower() in text_lower:
            keyword_counts[kw] += 1

print()
print('Top failure-point keywords (Tier 1+2):')
for kw, n in keyword_counts.most_common(15):
    print(f'  {kw}: {n}')

print()
print(f'Outputs:')
print(f'  /tmp/personas/findings_00.json (merged 0.0 sections)')
print(f'  /tmp/personas/regen_queue.json (tiered)')
print(f'  /tmp/personas/calibration_matrix.json (5×20 score matrix)')

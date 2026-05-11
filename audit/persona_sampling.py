"""
Phase B — build per-persona evaluation queues.

Outputs to /tmp/personas/:
- queue_00_<sec>.json × 7   (0.0 sharded by section)
- queue_05.json              (~300 stratified random)
- queue_10.json              (~300 stratified random)
- queue_15.json              (~300 stratified random)
- queue_20.json              (~298: 200 stratified + 98 regen'd)
- calibration.json           (20 entries, all 5 personas evaluate)

The 0.0 queue = watch-list (1-2 pedagogy points) + 100 clean +
98 regen'd entries.
"""
import json
import random
import re
from collections import defaultdict
from pathlib import Path

random.seed(13)  # deterministic for reproducibility

SECTION_RE = re.compile(r'-(XYZ|KVA|NOG|DTK|ORD|LÄS|MEK|ELF)-')


def section_of(qid):
    m = SECTION_RE.search(qid)
    return m.group(1) if m else None


# ─── Load corpus + pedagogy scan ─────────────────────────────────────

explanations = {}
for p in sorted(Path('data/explanations').glob('*.json')):
    if p.name.startswith('_'):
        continue
    for qid, e in json.loads(p.read_text()).items():
        explanations[qid] = e

scan = json.loads(Path('/tmp/pedagogy/scan.json').read_text())
flagged_by_qid = scan['by_qid']

# Watch-list: entries with 1-2 weighted points (below regen threshold)
watch_qids = [
    qid for qid, info in flagged_by_qid.items()
    if info['score'] < 3.0  # below queue threshold
]
print(f'Watch-list size: {len(watch_qids)}')

# Clean: entries with no findings at all
clean_qids = [qid for qid in explanations if qid not in flagged_by_qid]
print(f'Clean entries: {len(clean_qids)}')

# Regen'd: entries with _meta.regen_source OR _meta.pedagogy_regenerated_at
# OR _meta.fixed_at (the pedagogy-pass regen agents tagged their work)
regened_qids = []
for qid, e in explanations.items():
    meta = e.get('_meta') or {}
    if (
        meta.get('regen_source')
        or meta.get('regenerated_at')
        or meta.get('pedagogy_regenerated_at')
    ):
        regened_qids.append(qid)
print(f'Regen-tagged entries: {len(regened_qids)}')


# ─── Build calibration set: 20 entries, 3 per section stratified ────

by_section_all = defaultdict(list)
for qid in explanations:
    sec = section_of(qid)
    if sec:
        by_section_all[sec].append(qid)

calibration = []
for sec in ['XYZ', 'KVA', 'NOG', 'ORD', 'LÄS', 'MEK', 'ELF']:
    pool = by_section_all[sec]
    # Pick 3 from this section: 1 watch-list + 1 clean + 1 regened (or fallback)
    watch_pool = [q for q in pool if q in flagged_by_qid and flagged_by_qid[q]['score'] < 3.0]
    clean_pool = [q for q in pool if q not in flagged_by_qid]
    regen_pool = [q for q in pool if q in regened_qids]
    picks = []
    if watch_pool:
        picks.append(random.choice(watch_pool))
    if clean_pool:
        picks.append(random.choice(clean_pool))
    if regen_pool:
        picks.append(random.choice(regen_pool))
    # Fill to 3 with random from section if needed
    while len(picks) < 3 and pool:
        cand = random.choice(pool)
        if cand not in picks:
            picks.append(cand)
    calibration.extend(picks[:3])

# Trim to 20 (we have 21; drop one randomly)
random.shuffle(calibration)
calibration = calibration[:20]
print(f'Calibration set: {len(calibration)} entries')


# ─── Build 0.0 queue: watch-list + 100 clean + 98 regen'd ──────────

random.shuffle(clean_qids)
clean_sample = clean_qids[:100]

q00 = list(set(watch_qids) | set(clean_sample) | set(regened_qids) | set(calibration))
print(f'0.0 queue (deduped): {len(q00)}')

# Shard by section
q00_by_sec = defaultdict(list)
for qid in q00:
    sec = section_of(qid)
    if sec:
        q00_by_sec[sec].append(qid)


# ─── Build 0.5 / 1.0 / 1.5 queues: 300 stratified random each ────

def stratified_sample(n_total, exclude=None):
    """Sample ~n_total entries stratified across sections, sized
    proportional to section size."""
    exclude = exclude or set()
    pool_by_sec = {sec: [q for q in pool if q not in exclude]
                   for sec, pool in by_section_all.items()}
    total_pool = sum(len(p) for p in pool_by_sec.values())
    out = []
    for sec, pool in pool_by_sec.items():
        if not pool:
            continue
        # proportional allocation
        n_sec = max(1, round(n_total * len(pool) / total_pool))
        out.extend(random.sample(pool, min(n_sec, len(pool))))
    return out

# Each non-0.0 queue gets the calibration set + its own random sample
q05 = list(set(stratified_sample(300)) | set(calibration))
q10 = list(set(stratified_sample(300)) | set(calibration))
q15 = list(set(stratified_sample(300)) | set(calibration))
print(f'0.5 queue: {len(q05)}')
print(f'1.0 queue: {len(q10)}')
print(f'1.5 queue: {len(q15)}')


# ─── 2.0 queue: 200 stratified + 98 regen'd + calibration ────────

q20 = list(set(stratified_sample(200)) | set(regened_qids) | set(calibration))
print(f'2.0 queue: {len(q20)}')


# ─── Write outputs ─────────────────────────────────────────────────

out_dir = Path('/tmp/personas')
out_dir.mkdir(parents=True, exist_ok=True)

# Shard 0.0 by section
for sec, qids in q00_by_sec.items():
    (out_dir / f'queue_00_{sec}.json').write_text(json.dumps(sorted(qids)))

(out_dir / 'queue_05.json').write_text(json.dumps(sorted(q05)))
(out_dir / 'queue_10.json').write_text(json.dumps(sorted(q10)))
(out_dir / 'queue_15.json').write_text(json.dumps(sorted(q15)))
(out_dir / 'queue_20.json').write_text(json.dumps(sorted(q20)))
(out_dir / 'calibration.json').write_text(json.dumps(sorted(calibration)))


# ─── Summary ───────────────────────────────────────────────────────

print()
print('=' * 60)
print(f'Persona queue build summary')
print('=' * 60)
print(f'0.0 queue (by section):')
for sec in ['XYZ', 'KVA', 'NOG', 'ORD', 'LÄS', 'MEK', 'ELF']:
    n = len(q00_by_sec.get(sec, []))
    print(f'  {sec}: {n}')
print(f'  Total 0.0: {sum(len(v) for v in q00_by_sec.values())}')
print()
print(f'0.5 queue:        {len(q05)}')
print(f'1.0 queue:        {len(q10)}')
print(f'1.5 queue:        {len(q15)}')
print(f'2.0 queue:        {len(q20)}')
print(f'Calibration set:  {len(calibration)} (all 5 personas evaluate these)')
print()
print(f'Total evaluations: {sum(len(v) for v in q00_by_sec.values()) + len(q05) + len(q10) + len(q15) + len(q20)}')
print()
print(f'Output files in {out_dir}/')

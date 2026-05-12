"""
Validate a trajectory run against proof-of-concept success criteria.

Usage:
    python3 audit/trajectory/validate_run.py mvp
    python3 audit/trajectory/validate_run.py v2

Reads  /tmp/trajectory/<name>_run.json (and <name>_meta.json if present)
Writes /tmp/trajectory/<name>_summary.json

Success criteria:
1. Baseline calibration is in expected range (depends on version)
2. cant_solve appears (anti-cheat constraint binding)
3. Trajectory non-decreasing (≥30% rounds with positive delta)
4. Final estimated_level meets the version's MVP threshold
5. ≥1 bottleneck (failed transfer) OR ≥3 soft_bottlenecks
6. ≥1 high-leverage entry

Each version sets its own thresholds in TARGETS below.
"""
import json
import sys
from pathlib import Path


TARGETS = {
    'mvp': {
        'baseline_min': 0, 'baseline_max': 3,
        'level_min': 0.4,
        'bottleneck_or_soft_min': 1,  # MVP didn't capture soft yet
    },
    'v2': {
        'baseline_min': 1, 'baseline_max': 3,
        'level_min': 0.6,
        'bottleneck_or_soft_min': 3,  # higher bar with more rounds + soft signal
    },
    'v3': {
        'baseline_min': 1, 'baseline_max': 3,
        'level_min': 0.6,
        'bottleneck_or_soft_min': 3,
    },
    'full': {
        'baseline_min': 1, 'baseline_max': 3,
        'level_min': 0.6,
        'bottleneck_or_soft_min': 3,
    },
}

# Fallback for ad-hoc run names (e.g. 'post-audit-seed50') — they're
# typically `full` runs. Resolve by checking the meta sidecar if present.
def resolve_targets(name: str) -> dict:
    """Pick the closest target preset. Order:
       1. exact name in TARGETS (mvp / v2 / v3 / full)
       2. size hint from /tmp/trajectory/<name>_meta.json
       3. fallback: 'full' (the strictest large-run preset)
    """
    if name in TARGETS:
        return TARGETS[name]
    meta_path = Path(f'/tmp/trajectory/{name}_meta.json')
    if meta_path.exists():
        try:
            meta = json.loads(meta_path.read_text())
            size = meta.get('size') or meta.get('preset')
            if size in TARGETS:
                return TARGETS[size]
        except json.JSONDecodeError:
            pass
    return TARGETS['full']


def check(name, ok, detail=''):
    icon = '✓' if ok else '✗'
    print(f'  {icon} {name}' + (f'  ({detail})' if detail else ''))
    return ok


def main(name):
    run_path = Path(f'/tmp/trajectory/{name}_run.json')
    if not run_path.exists():
        print(f'NOT READY: {run_path} does not exist yet')
        sys.exit(2)

    run = json.loads(run_path.read_text())
    targets = resolve_targets(name)

    print('=' * 60)
    print(f'Trajectory {name.upper()} — validation')
    print('=' * 60)

    results = []

    # 1. Baseline
    baseline = run.get('baseline_calibration', {})
    score = baseline.get('score_out_of_10')
    if score is None:
        attempts = baseline.get('attempts', [])
        score = sum(1 for a in attempts if a.get('correct') is True)
    results.append(check(
        f'Baseline {targets["baseline_min"]}-{targets["baseline_max"]}/10 (persona honest)',
        score is not None and targets['baseline_min'] <= score <= targets['baseline_max'],
        f'score={score}/10',
    ))

    # 2. cant_solve binding
    rounds = run.get('rounds', [])
    cant_solve_count = sum(
        1 for r in rounds
        if r.get('attempted_before') == 'cant_solve' or r.get('attempted') == 'cant_solve'
    )
    results.append(check(
        'cant_solve binding (state-only enforced)',
        cant_solve_count >= 1,
        f'{cant_solve_count} rounds used cant_solve',
    ))

    # 3. Non-decreasing trajectory
    deltas = []
    for r in rounds:
        d = r.get('section_proficiency_delta', {})
        deltas.append(sum(d.values()) if d else 0)
    positive = sum(1 for x in deltas if x > 0)
    results.append(check(
        'Trajectory has positive deltas',
        positive >= len(rounds) * 0.3,
        f'{positive}/{len(rounds)} rounds with proficiency gain',
    ))

    # 4. Final level
    final = run.get('final_state', {})
    final_level = final.get('estimated_level', 0)
    n_facts = len(final.get('facts_learned', []))
    results.append(check(
        f'Final level ≥ {targets["level_min"]}',
        final_level >= targets['level_min'],
        f'level={final_level}, facts={n_facts}',
    ))

    # 5. Bottlenecks (hard OR soft)
    bottlenecks = run.get('bottlenecks', [])
    soft_bottlenecks = run.get('soft_bottlenecks', [])
    combined = len(bottlenecks) + len(soft_bottlenecks)
    results.append(check(
        f'≥{targets["bottleneck_or_soft_min"]} bottleneck signals (hard + soft)',
        combined >= targets['bottleneck_or_soft_min'],
        f'{len(bottlenecks)} failed transfers + {len(soft_bottlenecks)} soft = {combined}',
    ))

    # 6. High-leverage
    high_lev = run.get('high_leverage', [])
    results.append(check(
        '≥1 high-leverage entry identified',
        len(high_lev) >= 1,
        f'{len(high_lev)} high-leverage qids',
    ))

    passed = sum(results)
    print()
    print(f'Result: {passed}/6 criteria passed')

    # Per-section proficiency
    sp = final.get('section_proficiency', {})
    if sp:
        print()
        print('Section proficiency:')
        for sec, v in sorted(sp.items(), key=lambda x: -x[1]):
            print(f'  {sec}: {v}')

    # Transfer test breakdown
    transfers = [r for r in rounds if r.get('kind') == 'transfer_test']
    passed_t = sum(1 for r in transfers if r.get('passed'))
    print()
    print(f'Transfer tests: {passed_t}/{len(transfers)} passed')

    if passed >= 5:
        verdict = 'EXCELLENT — corpus signal is solid; ready to wire into regen cycle.'
    elif passed >= 4:
        verdict = 'GOOD — signal is workable; consider next iteration with adjustments.'
    else:
        verdict = 'WEAK — inspect output and tune protocol before relying on it.'
    print()
    print(f'Verdict: {verdict}')

    # Summary
    summary = {
        'version': name,
        'baseline_score': score,
        'cant_solve_count': cant_solve_count,
        'rounds_completed': len(rounds),
        'transfer_pass_rate': passed_t / len(transfers) if transfers else None,
        'final_level': final_level,
        'facts_learned': n_facts,
        'bottlenecks': bottlenecks,
        'soft_bottlenecks': soft_bottlenecks,
        'high_leverage': high_lev,
        'section_proficiency': sp,
        'criteria_passed': passed,
        'verdict': verdict,
    }
    out_path = Path(f'/tmp/trajectory/{name}_summary.json')
    out_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f'\nSummary written: {out_path}')

    sys.exit(0 if passed >= 4 else 1)


if __name__ == '__main__':
    name = sys.argv[1] if len(sys.argv) > 1 else 'v2'
    main(name)

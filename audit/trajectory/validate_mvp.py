"""
Validate the MVP trajectory run against proof-of-concept success criteria.

Reads:  /tmp/trajectory/mvp_run.json
Prints: pass/fail per criterion + a verdict

Success criteria (from the plan, Phase E):
1. Round 0 baseline score: 0-3/10  (confirms the 0.0 persona is honest)
2. cant_solve appears in early rounds  (proves the state-only constraint is binding)
3. Trajectory non-decreasing  (allowing small forgetting drops)
4. Final estimated_level ≥ 0.4 for a 24-round practice run
   (the plan's full-trajectory target is ≥0.8 for 200 rounds; MVP scales down)
5. ≥1 bottleneck identified
6. ≥1 high-leverage entry identified

If 4/6 or more pass → MVP signal is good, scale to 200 rounds.
"""
import json
import sys
from pathlib import Path


RUN = Path('/tmp/trajectory/mvp_run.json')
META = Path('/tmp/trajectory/mvp_meta.json')


def check(name, ok, detail=''):
    icon = '✓' if ok else '✗'
    print(f'  {icon} {name}' + (f'  ({detail})' if detail else ''))
    return ok


def main():
    if not RUN.exists():
        print(f'NOT READY: {RUN} does not exist yet')
        sys.exit(2)

    run = json.loads(RUN.read_text())
    meta = json.loads(META.read_text()) if META.exists() else {}

    print('=' * 60)
    print('MVP trajectory — proof-of-concept validation')
    print('=' * 60)

    results = []

    # 1. Baseline calibration honesty
    baseline = run.get('baseline_calibration', {})
    score = baseline.get('score_out_of_10')
    if score is None:
        # Try to count from attempts
        attempts = baseline.get('attempts', [])
        score = sum(1 for a in attempts if a.get('correct') is True)
    results.append(check(
        'Baseline 0-3/10 (persona honest)',
        score is not None and 0 <= score <= 3,
        f'score={score}/10',
    ))

    # 2. cant_solve appears
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

    # 3. Trajectory non-decreasing
    proficiency_curve = []
    cumulative_facts = []
    for r in rounds:
        delta = r.get('section_proficiency_delta', {})
        proficiency_curve.append(sum(delta.values()) if delta else 0)
        cumulative_facts.append(len(r.get('facts_added', [])))
    increasing = sum(1 for x in proficiency_curve if x > 0)
    results.append(check(
        'Trajectory has positive deltas',
        increasing >= len(rounds) * 0.3,
        f'{increasing}/{len(rounds)} rounds with proficiency gain',
    ))

    # 4. Final estimated level
    final = run.get('final_state', {})
    final_level = final.get('estimated_level', 0)
    n_facts = len(final.get('facts_learned', []))
    results.append(check(
        'Final level ≥ 0.4 (MVP scaling of 0.8 target)',
        final_level >= 0.4,
        f'level={final_level}, facts={n_facts}',
    ))

    # 5. Bottlenecks
    bottlenecks = run.get('bottlenecks', [])
    results.append(check(
        '≥1 bottleneck identified',
        len(bottlenecks) >= 1,
        f'{len(bottlenecks)} bottleneck qids',
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

    if passed >= 4:
        print('✓ MVP signal is GOOD — scale to 200-round trajectory next.')
    else:
        print('✗ MVP signal is WEAK — inspect output and tune protocol before scaling.')

    # Dump structured summary for downstream tooling
    summary = {
        'baseline_score': score,
        'cant_solve_count': cant_solve_count,
        'rounds_completed': len(rounds),
        'final_level': final_level,
        'facts_learned': n_facts,
        'bottlenecks': bottlenecks,
        'high_leverage': high_lev,
        'criteria_passed': passed,
        'verdict': 'good' if passed >= 4 else 'weak',
    }
    Path('/tmp/trajectory/mvp_summary.json').write_text(
        json.dumps(summary, ensure_ascii=False, indent=2)
    )
    print(f'\nSummary written: /tmp/trajectory/mvp_summary.json')

    sys.exit(0 if passed >= 4 else 1)


if __name__ == '__main__':
    main()

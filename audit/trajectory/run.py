"""
Trajectory cycle orchestrator.

Phase G of the original plan: a single command that runs the whole
trajectory pass — prep, dispatch instructions, post-run validation +
harvest, report generation.

Subcommands:
    prep      Rebuild technique index, apply parser patches, build a fresh brief.
    dispatch  Print the agent-dispatch instructions (humans / Claude Code do the actual dispatch).
    harvest   After the run completes, validate + extract signals + write report.
    cycle     Run prep + dispatch instructions + (after manual confirmation) harvest.

Why dispatch is human-mediated: the agent dispatch goes through
Claude Code's Agent tool from inside a session. Encapsulating that in
a CLI tool would need a separate Anthropic API key flow and lose the
nice in-session tool integration. So this orchestrator covers
everything EXCEPT the dispatch — and the dispatch boils down to one
Claude Code Agent tool call.

Usage:
    python3 audit/trajectory/run.py prep --seed 44 --size v3
    # (then dispatch from within a Claude Code session — see `dispatch`)
    python3 audit/trajectory/run.py harvest v3
"""
import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent
DEFAULT_PERSONA = '/home/loucmane/dev/hpfetcher/audit/personas/00.md'


def run_step(label, cmd):
    print(f'\n▶ {label}')
    print(f'  $ {" ".join(cmd)}')
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f'  ✗ failed (exit {result.returncode})')
        print(result.stdout)
        print(result.stderr, file=sys.stderr)
        sys.exit(result.returncode)
    print(result.stdout.rstrip())


def cmd_prep(args):
    print('▶ Trajectory prep — building fresh inputs')
    # 1. Rebuild technique index (idempotent; reflects any data changes)
    run_step('Rebuild technique index', ['python3', str(SCRIPT_DIR / 'technique_index.py')])
    # 2. Apply parser patches (idempotent; checks for matches before writing)
    run_step('Apply parser patches', [
        'python3', str(SCRIPT_DIR / 'patch_paren_corruption.py'), '--apply',
    ])
    # 3. Build brief
    run_step('Build brief', [
        'python3', str(SCRIPT_DIR / 'build_brief.py'),
        '--seed', str(args.seed),
        '--size', args.size,
        '--output', args.output,
    ])
    print('\n✓ Prep complete.')
    print(f'  Brief: /tmp/trajectory/{args.output}_brief.txt')
    print(f'  Meta:  /tmp/trajectory/{args.output}_meta.json')
    print(f'\nNext: dispatch the agent — see `python3 audit/trajectory/run.py dispatch {args.output}`')


def cmd_dispatch(args):
    name = args.name
    brief_path = Path(f'/tmp/trajectory/{name}_brief.txt')
    if not brief_path.exists():
        print(f'✗ Brief not found: {brief_path}')
        print(f'  Run `python3 audit/trajectory/run.py prep --output {name}` first.')
        sys.exit(1)

    meta = {}
    meta_path = Path(f'/tmp/trajectory/{name}_meta.json')
    if meta_path.exists():
        meta = json.loads(meta_path.read_text())

    print('━' * 70)
    print(f'AGENT DISPATCH — trajectory simulation `{name}`')
    print('━' * 70)
    print()
    print(f'Brief: {brief_path}')
    print(f'Rounds: {meta.get("total_rounds", "?")}')
    print(f'Seed: {meta.get("seed", "?")}')
    print(f'Size: {meta.get("size", "?")}')
    print()
    print('Dispatch as a Claude Code Agent tool call with:')
    print(f'  description:     "{name} trajectory simulation"')
    print(f'  subagent_type:   "general-purpose"')
    print(f'  model:           "opus"')
    print(f'  run_in_background: true')
    print(f'  prompt: (see DISPATCH_TEMPLATE below)')
    print()
    print('━' * 70)
    print('DISPATCH_TEMPLATE')
    print('━' * 70)
    print(f"""
You are running a trajectory simulation for the HP-Coach corpus
(Swedish university entrance exam study tool, all educational content
from UHR, public exam material).

Read in order:
1. {DEFAULT_PERSONA} — your persona (0.0 student baseline)
2. {brief_path} — full simulation brief, {meta.get("total_rounds", "?")} rounds

Anti-cheat: `facts_learned` starts EMPTY. You may only use
persona-baseline knowledge + facts in that list. If a concept isn't
in your toolkit, output `cant_solve` with a reason naming what's
missing. The brief explains the protocol per round.

When done, write JSON to /tmp/trajectory/{name}_run.json with schema
documented in the brief. Then output a brief summary (baseline score,
rounds completed, facts learned, transfer pass rate, bottleneck/soft
counts, final level). Then exit.

DO NOT spawn subagents. DO NOT call the Anthropic API. Read-only on
the corpus. Re-read 00.md at rounds 0, 15, 30, 45.
""")
    print('━' * 70)
    print()
    print(f'After the agent completes:')
    print(f'  python3 audit/trajectory/run.py harvest {name}')


def cmd_harvest(args):
    name = args.name
    # 1. Validate
    run_step('Validate', ['python3', str(SCRIPT_DIR / 'validate_run.py'), name])
    # 2. Harvest signals + write report
    run_step('Harvest', ['python3', str(SCRIPT_DIR / 'harvest.py'), name])
    print('\n✓ Harvest complete.')
    print(f'  Report: audit/trajectory/reports/{name}-<date>.md')
    print(f'  Latest: audit/trajectory/_latest_report.md')


def cmd_cycle(args):
    """Run prep, then print dispatch instructions, then wait for the user."""
    cmd_prep(args)
    print()
    print('━' * 70)
    print()
    cmd_dispatch(argparse.Namespace(name=args.output))
    print()
    print('When the agent completes, run:')
    print(f'  python3 audit/trajectory/run.py harvest {args.output}')


def main():
    ap = argparse.ArgumentParser(description='Trajectory cycle orchestrator')
    sub = ap.add_subparsers(dest='subcommand', required=True)

    prep = sub.add_parser('prep', help='Build inputs for a trajectory run')
    prep.add_argument('--seed', type=int, default=44)
    prep.add_argument('--size', default='v3', choices=['mvp', 'v3', 'full'])
    prep.add_argument('--output', default=None,
                      help='Output basename (default: <size>-<seed>)')

    disp = sub.add_parser('dispatch', help='Print agent dispatch instructions')
    disp.add_argument('name')

    harv = sub.add_parser('harvest', help='Post-run validate + harvest + report')
    harv.add_argument('name')

    cyc = sub.add_parser('cycle', help='Prep + dispatch instructions (manual harvest after)')
    cyc.add_argument('--seed', type=int, default=44)
    cyc.add_argument('--size', default='v3', choices=['mvp', 'v3', 'full'])
    cyc.add_argument('--output', default=None)

    args = ap.parse_args()

    # Default output name = size-seed
    if hasattr(args, 'output') and args.output is None:
        args.output = f'{args.size}-seed{args.seed}'

    {'prep': cmd_prep, 'dispatch': cmd_dispatch,
     'harvest': cmd_harvest, 'cycle': cmd_cycle}[args.subcommand](args)


if __name__ == '__main__':
    main()

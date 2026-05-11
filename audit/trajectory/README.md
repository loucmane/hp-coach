# Trajectory simulation

Automated 0.0-student trajectory simulation for the HP-Coach corpus.
A persona-agent practices through the explanations, attempts transfer
tests on similar-technique questions, and reports back which
explanations actually teach transferable knowledge.

## Why

Heuristic scans and persona evaluations measure single qualities of
each explanation in isolation. The trajectory pass measures the
*integrated* curriculum: does someone who practices through the corpus
actually get better at the HP?

The simulation surfaces three signal classes per run:
- **Hard bottlenecks** — explanations whose transfer tests fail
- **Soft bottlenecks** — explanations the agent reads and learns
  nothing from (parser bugs, vacuous reasoning, factual errors)
- **High-leverage entries** — practice→transfer chains where the fact
  learned in practice directly powered a later transfer pass

Hard + soft bottlenecks feed the regen queue. High-leverage entries
become voice anchors for future regens.

## Cycle

```bash
# 1. Prep — rebuild technique index, apply parser patches, build brief.
python3 audit/trajectory/run.py prep --seed 44 --size v3

# 2. Dispatch — print the agent prompt template (you dispatch it
#    via Claude Code's Agent tool, model: opus, run_in_background: true).
python3 audit/trajectory/run.py dispatch v3-seed44

# 3. Harvest (after agent completes) — validate, extract signals,
#    update known_broken, write report.
python3 audit/trajectory/run.py harvest v3-seed44
```

## Size presets

| Size | Baseline | Practice | Transfer | Wall-clock |
|---|---|---|---|---|
| mvp   | 10 | 24  | 5  | 3-4 min  |
| v3    | 10 | 48  | 20 | 5-7 min  |
| full  | 10 | 150 | 50 | 15-20 min |

## Files

- `run.py` — orchestrator CLI (prep / dispatch / harvest / cycle)
- `build_brief.py` — assembles the brief from corpus + index
- `technique_index.py` — Jaccard-clusters explanations by technique-field words
- `katex_to_ascii.py` — pre-renders KaTeX to ASCII (matches SPA rendering)
- `validate_run.py` — checks a run against 6 success criteria
- `harvest.py` — extracts signals, updates known_broken, writes report
- `patch_paren_corruption.py` — re-applies 12 hand-verified parser patches
  (data/parsed/ is gitignored; this is the tracked source-of-truth)
- `known_broken.json` — qids excluded from selection pools
- `reports/<name>-<date>.md` — per-run report
- `_latest_report.md` — most-recent report (committed)

## Anti-cheat

The simulation lives or dies on the persona's honesty. The brief
constrains the agent to a `facts_learned` list that starts empty and
only grows via studied explanations. If a concept isn't in the
toolkit, the agent must `cant_solve` with a reason. v3 runs validated
this works (5+ honest `cant_solve` per run on HP-specific stressors).

## History

- MVP (2026-05-11): 30 rounds, 4/6 criteria. Baseline calibration too lenient.
- v2  (2026-05-11): 64 rounds, 6/6 criteria. Surfaced KaTeX-render brief artifact.
- v3  (2026-05-11): 68 rounds, 5/6 criteria. KaTeX pre-rendered; 20/20 transfer;
  5 real parser bugs surfaced (12 fixed by `patch_paren_corruption.py`).

See `_mvp_findings.md`, `_v2_findings.md`, `_v3_findings.md` for the
full investigation logs.

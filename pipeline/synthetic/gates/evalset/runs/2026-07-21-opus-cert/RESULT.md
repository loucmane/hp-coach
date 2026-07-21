# Eval run 2026-07-21 — Opus judge certification — PASS

Motivation: owner directive to run P5 bulk work (generation + gate
execution) on Opus subagents to conserve Fable usage. Per
run-protocol, a gate MODEL change requires an eval rerun.

Result: authentic false kills 0/15 (max 0); seeded kill-by-right-gate
14/14 = 100% (min 100%); hard negative SURVIVED_FLAGGED. Judge parity
with the 2026-07-20 Fable run is near-exact, including the same 2-1
G-SPRÅK split on the register seed and identical offending-sentence
quotes on every language kill.

Executors: claude-opus-4-8, 11 independent judges. G-KEY comparison
orchestrator-side. Protocol improvement adopted from this run: blind
sheets must also strip `generator_meta` (leaks authentic-vs-synthetic
origin to the solver).

Opus is CERTIFIED as gate executor for Batch 1. Fable remains the
orchestrator (dispatch, aggregation, scoring, verification).

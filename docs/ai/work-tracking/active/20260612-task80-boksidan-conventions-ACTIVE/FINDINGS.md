# Task 80 [Boksidan] Branch + design-system conventions - Findings

## Purpose
Record discoveries, gaps, risks, failed assumptions, and evidence-backed observations for Task 80.

## Scope (confirmed before edits)
Establish the production foundation for the **Boksidan (M3)** redesign chosen in the
2026 bake-off, without yet porting the drill layout (task 81+).

**In scope**
1. Carry the two production-ready keepers from `redesign-bakeoff-2026`:
   - **Spalt palette** (L12 ivory + cobalt): `app/src/lib/tokens.ts`, `tokens.test.ts`,
     `lib/__snapshots__/tokens.test.ts.snap`, `routes/dev.tsx`, `routes/welcome.tsx`,
     `components/EditionStrip.tsx`.
   - **QuestionFigure rework** (document-style zoom/pan viewer):
     `app/src/components/drill/QuestionFigure.tsx`.
2. Promote Spalt to the default palette (`DEFAULT_THEME`); refresh the
   `buildThemeVars(DEFAULT_THEME)` snapshot.
3. Codify the two conventions in a design-system doc:
   - cobalt `--accent` = **structure only** (mono labels, step numerals, tactic, links);
   - grading = **state** → semantic green `--ok` "Rätt." / red `--bad` "Fel." verdict as
     italic serif ink, plus `--ok`/`--bad` rows.
4. Ledger: tasks 80–87 added to `.taskmaster/tasks/tasks.json`.

**Out of scope** — layout port (81), verdict wiring (82), PedagogyPanel (83), wide split
(84), other surfaces (85), auth (86), verification sweep (87).

**Verification** — `pnpm typecheck` + `pnpm test` (incl. Spalt + default-theme snapshots)
+ `biome check` green. No behavior change beyond Spalt being available + default.

## Findings
- 2026-06-12 - _Pending_ - add findings as they are discovered.

## Progress Log
- **2026-06-12 22:02 CEST** - [S:20260612|W:task80-boksidan-conventions|H:aegis:kickoff|E:.aegis/state/current-work.json] Findings log initialized by Aegis kickoff.
- **2026-06-12 23:00 CEST** - [S:20260612|W:task80-boksidan-conventions|H:claude:scope|E:docs/ai/work-tracking/active/20260612-task80-boksidan-conventions-ACTIVE/FINDINGS.md] Confirmed task 80 scope: carry Spalt palette + QuestionFigure rework from redesign-bakeoff-2026, set Spalt default, codify cobalt-structure/semantic-verdict conventions, ledger 80-87.

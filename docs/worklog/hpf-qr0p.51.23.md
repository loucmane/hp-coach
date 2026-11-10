# Worklog — hpf-qr0p.51.23

## Findings

- 2026-11-06: Claimed the part-1 contract at base `8ebaa9d5628ed4aed8ae2ded7b13bb40c405c648`; clean assigned worktree, dependencies present, no molecule metadata.
- Uppslag is pre-answer: `UppslagContents.tsx:95` prefers `summary` to `title` and renders it in both the accessible name and visible contents link at lines 103 and 115. The view builder currently supplies the headword and `tldr`. Read status does not establish that a question has been answered.
- Daily-plan text is pre-answer: `useDailyPlan.ts:646` indexes headwords, `lib/scheduler.ts:677` snapshots them into lesson headlines, and `folio/screens/idag/idagView.ts:141` and `IdagLead.tsx:151,208` present headline/rationale text. Both local and server plans can retain old answer-bearing text.
- Drill content is post-answer: `FolioSessionStage.tsx:243-259` renders the framework-name consumer `Facit` only during feedback. `ReadingSpread.tsx:125-128,209` likewise mounts its answer content only during feedback. The pre-answer `TacticNote` in `DrillHead.tsx:50,74-76,91-93` reads only authored `pregrade_tactic.handle/move`, never the framework-name map.
- Pass-result content is post-answer: `FolioProvResult.tsx:27-30,74,136-139` selects a persisted result and renders its pattern name; `provView.ts:152` is the name mapping. No result row means the result-not-found/loading return.

## Decisions

- Replace Uppslag presentation titles with math-preserved question titles or numbered neutral labels; clear presentation summaries so `tldr` cannot override the safe title. Preserve lesson source content for the separate Kapitel implementation.
- Keep the shared daily-plan baseline and persistence unchanged for classic mode. Apply safe catalog labels at the Folio return boundary, covering generated, local-cache and server-adopted plans, with neutral labels while catalogs are unavailable.
- Leave the two post-answer call sites unchanged. Limit all source edits to the admitted files.

## Progress

- Inspection complete; regression tests next.

## Handoff

- Implementation and verification pending. No commit, push, merge or publication authorized for this worker.

## Verification — 2026-11-06

- Red first: Uppslag's 7 new cases failed against the original headword/summary output. After correcting a test fixture's store import capitalization, all 8 initial daily-plan regressions failed on the actual leaked headword (generated, local and server plans), missing fallback, or preview-toggle output; the 13 existing completion tests passed.
- Green focused run: `pnpm test src/folio/screens/uppslag/uppslagView.test.ts src/hooks/useDailyPlan.test.ts --maxWorkers=2` passed 36/36. Two further daily-plan cases cover a cached target different from the current hint and a non-trap neutral fallback; both passed in the subsequent full suite.
- `pnpm typecheck`: PASS after retaining the original resolver's default empty due queue for unavailable data.
- `pnpm lint`: PASS, with four pre-existing informational diagnostics in devbake files. Only the two admitted test files were formatted.
- Full suite, run once: `pnpm test --maxWorkers=8` — 202 files passed, 1 failed; 6,122 tests passed, 1 failed (45.73 seconds). Sole failure: `src/lib/trapIndex.test.ts:39`, generator equality check, `spawnSync /usr/bin/node EPERM`. The accepted brief explicitly identifies generator child-process EPERM as a sandbox limit. No bypass or retry attempted. Coordinator must rerun this check on the host.
- `git diff --check`: PASS. No worker files changed, so worker checks do not apply.

## Delivery — 2026-11-06

- Final implementation changes only `uppslagView.ts`, `useDailyPlan.ts` and their two admitted test files. Uppslag titles/summary are safe before answering, including read entries; authored lesson data remains intact for the separate Kapitel work. Daily-plan output uses the full safe-title index without truncating math, and falls back neutrally when a catalog is unavailable. Classic output, scheduler choices, local/server baselines, links and completion metadata remain unchanged.
- `useDrillContent.ts` and `useProvResultExtras.ts` are intentionally unchanged because their headwords are post-answer. No new tests were added for those post-answer sites, as directed.
- BLOCKED pending host verification of the generator equality check and coordinator delivery. No signed commit or independent merge review exists yet. Base HEAD remains `8ebaa9d5628ed4aed8ae2ded7b13bb40c405c648`.
- Staging attempted with the five exact delivery paths; Git refused creation of the shared worktree `index.lock` because the filesystem is read-only. Changes are UNSTAGED and UNCOMMITTED. No alternate index, commit, signer or permission workaround attempted. Coordinator must stage these five files after host verification.

## 2026-11-06 coordinator host verification

- Host: typecheck clean, lint clean (4 pre-existing infos), full app suite 6123/6123 at 8 workers (trap-index generator check passes on the host).
- Review: the audit classifies Uppslag and daily-plan text as pre-answer (fixed) and drill content and pass result as post-answer (unchanged), with render evidence. The Uppslag summary no longer carries the tldr.
- Open follow-up (to file after the GC freeze): the classic app's plan headlines still show headwords, because the fix applies at the Folio return boundary and leaves the shared baseline and persistence unchanged. Part 2 of the sweep also covers the sites inside #501/#503/#505/#506 after merge.

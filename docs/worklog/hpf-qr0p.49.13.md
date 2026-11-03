# Worklog — hpf-qr0p.49.13

## Findings

- 2026-10-29: Claimed the accepted round-1 contract; no molecule. Clean branch at bd59f8021556b37475af0801a67551c831caaf13. Dependencies available. Existing MockRunner suite: 32 tests passed before extraction.

## Decisions

- Share lifecycle in useMockPass; keep classic keyboard, confirmation and rendering behavior in MockRunner. Folio owns its ungraded view, slips and keyboard. Use the merged Folio question/reading primitives, with no explanation loading or grading during a pass.
- Deliver uncommitted within the admitted write set. Optional slice C is deferred; local-stack desktop/phone, light/dark visual inspection and owner visual approval remain coordinator gates.

## Progress

- [S:codex-1|W:hpf-qr0p.49.13|H:baseline|E:32 MockRunner tests passed] Extracting lifecycle with unchanged classic assertions.

## Handoff

- Implementation in progress. No commit, merge or publication authorized for this worker.

## Verification and delivery — 2026-10-29

- Extracted lifecycle to `app/src/components/mock/useMockPass.ts`. The classic view retains its confirmation, keyboard and rendering behavior; `MockRunner.test.tsx` is unchanged. Shared hook tests additionally verify delayed PATCH-before-POST settlement, exactly-once final snapshots and reload adoption.
- Added lazy Folio run routing, ungraded QuantPage/Options and ReadingSpread/DTK rendering, UHR pace tick, hideable clock, one calm five-minute warning with a snapshot of blank positions, Markera/dog-ear, overview with real numbered buttons, hand-in and abort slips, shell focus, A–E/1–5/arrow/J/K/M shortcuts, and suspended shortcuts under dialogs/viewer. The route continues to log voids and show the existing result after hand-in.
- Red first: `passPace.test.ts` failed resolving its not-yet-created module while all 32 extracted MockRunner tests passed. `FolioPassRun.test.tsx` then failed resolving its not-yet-created module. New integration coverage subsequently passed all eight section kinds, ELF cloze revisits without verdict leakage, DTK image continuity and phone viewer, flags/index/jumps, keyboard fencing, warning boundary/dismissal, safe modal focus, hand-in extras, shell exit/void, timeout and identity reset, and axe on stage/index/slips.
- [S:codex-1|W:hpf-qr0p.49.13|H:focused|E:6 files, 93 tests passed] `pnpm test src/components/mock/MockRunner.test.tsx src/components/mock/useMockPass.test.ts src/folio/screens/prov/passPace.test.ts src/folio/screens/prov/FolioPassRun.test.tsx src/folio/screens/prov/prov.guard.test.ts src/routes/-prov.folio.test.tsx --maxWorkers=2` passed.
- [S:codex-1|W:hpf-qr0p.49.13|H:full-suite|E:183 files passed, 1 failed; 5302 tests passed, 1 failed] Required `pnpm test` run used no worker override. The sole failure was `src/lib/trapIndex.test.ts`, generator comparison: sandbox refused `spawnSync /usr/bin/node` with EPERM. No retry or workaround; coordinator must run that check outside the sandbox.
- `pnpm typecheck` passed. `pnpm lint` passed, reporting four pre-existing informational notices in devbake files. `git diff --check` passed. Worker package untouched, so no worker checks required.
- Optional slice C (expired/missing/failed-hand-in retry and prescribed conditions) was not implemented. Existing settlement error behavior is preserved.
- Implementation remains uncommitted on `codex/hpf-qr0p.49.13-provpass-run-in-folio-pace-tick-5-minute-warning-slips`; HEAD remains `bd59f8021556b37475af0801a67551c831caaf13`. All changes stay within the admitted write set. No independent review has run.
- Remaining delivery gates: host generator check; real local-stack visual inspection on desktop and phone in light and dark; owner visual OK; independent exact-head review after coordinator commit. No merge or publication performed. Per accepted contract the bead stays open for the coordinator to park.

## Playbook proposal — 2026-10-29

- For gas-city-coordinator: Reusing Folio ReadingSpread in an ungraded pass also brings its Enter-to-grade hint and ELF graded-history rendering. Keep phase=question, explanation=null and results empty; suppress the drill hint within the pass scope and supply exam shortcuts. Verify correct and wrong picks plus revisited ELF gaps never expose verdicts. Vitest disables CSS, so assert the hint override in the stylesheet guard rather than expecting hidden shared text to disappear from the test DOM.
- Attempted the required `/home/loucmane/scratch/skill-gotchas/gas-city-coordinator.md` proposal path; the sandbox rejected writing outside the project. Proposal retained here for coordinator forwarding; no alternative write to that protected path attempted.

## Final handoff — 2026-10-29

- Staging was attempted once for the exact changed source and repository worklog files. Git refused to create the assigned worktree's index lock because its metadata filesystem is read-only. Changes remain uncommitted and unstaged; coordinator must stage them. No direct signing, commit, push, merge, closure or reassignment performed.

## Handoff confirmation — 2026-10-29

- Startup returned this existing assignment with its DONE note already present. Confirmed the recorded base HEAD, branch and changed paths; `git diff --check` passes. Existing test evidence above was read, not rerun. No implementation changes made during this confirmation.
- The accepted contract leaves closure and status changes to the coordinator. Host generator verification, staging, independent review and owner visual approval remain pending; no blocked operation was retried.

## Round 2 — 2026-10-29

- Accepted the latest round-2 contract at clean HEAD `2a52423da6b9ab6bbfd685788f16d7c636348647`; no molecule. Scope: compact consecutive blank positions in the shared sentence and retain shell focus while the lazy run loads. The admitted write set is unchanged.
- Keep the exact blank positions in one visible, accessible sentence using en-dash ranges. Test the formatter and all three consumers (warning, overview, hand-in). Test the actual Folio shell and run with held Suspense on desktop and phone, including focus handoff and return to the hub after abort.
- Deliver uncommitted; leave bead state and delivery to the coordinator. Prior staging refusal remains applicable because Git metadata is read-only. Owner visual approval and independent review remain delivery gates.

- [S:codex-1|W:hpf-qr0p.49.13|H:round-2-red|E:15 failed, 29 passed across 3 files] Before production changes, `pnpm test src/folio/screens/prov/passPace.test.ts src/folio/screens/prov/FolioPassRun.test.tsx src/routes/-prov.folio.test.tsx --maxWorkers=2` failed on five range-format cases, eight range assertions across the run surfaces, and missing shell focus on both viewports. Failures showed the original comma lists and `data-focus=false`, not missing dependencies or harness errors.
- Shared `blanksSentence` now emits en-dash ranges, preserving blank count, exact pass positions and singular/plural wording. All three existing callers retain their single visible accessible sentence; the warning still holds its once-only snapshot.
- The lazy run fallback registers shell focus with `exitLabel: null` until the real run mounts and owns the abort confirmation. Real Rail/TabBar spies verify no navigation renders during suspension or handoff, on phone and desktop; the real abort flow restores hub navigation.
- Focused verification: the six-file suite passed 108 tests, with one test querying the exit before passive effects completed. Changed that assertion to await the actual exit control; route suite then passed all 9 tests. All 32 original MockRunner tests and their source remain unchanged. Typecheck and lint pass (four existing informational notices in devbake); final full-suite/build results follow below.

## Round-2 playbook proposal — 2026-10-29

- For astra-relay: A held React Suspense test can observe the lazy stage DOM before its passive shell-focus registration exposes the exit control. After releasing Suspense, await that exit control before testing the handoff, and retain Rail/TabBar render spies across the whole transition so a transient navigation render cannot be hidden by the wait. Symptom here: the first desktop case found the real run but not its exit; the phone case passed after the module had loaded.
- The prescribed `/home/loucmane/scratch/skill-gotchas/astra-relay.md` inbox is outside this session's writable roots. The prior scratch refusal was not retried; coordinator forwarding is required. Proposal retained here, never in temporary storage.

## Round-2 verification and handoff — 2026-10-29

- [S:codex-1|W:hpf-qr0p.49.13|H:round-2-full-suite|E:5318 passed, 1 sandbox failure; 183 files passed, 1 failed] `cd app` then `pnpm test --maxWorkers=2`, default TMPDIR: 5319 tests across 184 files, 158.48 seconds. Sole failure: `src/lib/trapIndex.test.ts` generator comparison, `spawnSync /usr/bin/node EPERM`. This is the previously documented sandbox limitation; no workaround or retry. Coordinator must run that check outside the sandbox.
- Full-suite success includes the new formatter/surface/held-Suspense assertions, unchanged 32-test MockRunner suite, Folio isolation guards and axe tests. No worker package changes or checks required.
- `pnpm typecheck` passed. `pnpm lint` passed, four existing informational notices in devbake. `pnpm build` passed: 3352 modules transformed and PWA generated; warnings only for three existing test filenames in the route directory and a large bundle. Build output is local `app/dist/`, not published. `git diff --check` passed.
- Final source changes are limited to `passPace.ts`, its tests, `FolioPassRun.test.tsx`, `routes/prov.tsx`, and `routes/-prov.folio.test.tsx`, plus this worklog. No dependency or classic runner changes. All tracked changes are within the admitted write set.
- Changes remain uncommitted and unstaged on `codex/hpf-qr0p.49.13-provpass-run-in-folio-pace-tick-5-minute-warning-slips`, base HEAD `2a52423da6b9ab6bbfd685788f16d7c636348647`. Prior Git metadata refusal was not retried. Independent review has not run.
- Coordinator next: host generator check; stage/commit; independent exact-head review; desktop/phone light/dark visual check of round 2 and owner visual OK before merge; forward the playbook proposal. No merge, push or publication performed. Bead closure/status/assignee remain coordinator-owned under the accepted contract; finish with the durable DONE note and stop.

# Worklog — hpf-bz6f.5

## Findings

- 2026-10-21: Claimed the plain implementation bead; no molecule controls sequencing. Base is `320bd50c03823781281280560b4245475e41e569`; worktree was clean and both dependency directories exist.
- The accepted round-1 contract narrows the parent feature to worker spacing, a calendar mirror and queue ordering. Run-in plans, app changes and migrations are outside this round.

## Decisions

- Keep ladder intervals and lapse memory intact; cap only `nextReviewAt`. A due time strictly before the exam stays unchanged, including the final week. A due time at or after the exam moves to exam minus five days, or minus one day when the first anchor is less than a day away. If both anchors have passed, it is due now, never backdated.
- Hold graduation while an upcoming exam is more than seven days away; graduation remains available in the final week. Missing/past exam dates retain the existing pure SRS behavior.
- Mirror the app's local-calendar dates and whole-exam-day sitting resolution. Test the mirror by reading the app source, without importing app runtime code.
- Keep wrong-answer scheduling unchanged: ten minutes is the immediate relearning contract and does not skip a pre-exam study day. Applying a days-scale cap there would undermine that contract in the final minutes before the exam.
- Delivery remains uncommitted. Follow the bead's specific handoff: append a DONE note and stop for coordinator parking/review; do not close or change bead ownership/status.

## Progress

- 2026-10-21: Inspected SRS functions, all three correct-answer routes, due scopes, user provisioning and in-memory route test harness. Tests will use the existing project Vitest commands and in-memory SQLite, with no fixture scratch directories.

## Handoff

- Implementation and verification pending.

## Verification — 2026-10-21

- Red first: `cd worker` then `pnpm test src/lib/srs.test.ts src/lib/sittings.test.ts src/routes/mistakes.test.ts --maxWorkers=1` failed before implementation: 34 failed assertions (11 SRS, 23 route), 61 passed, plus the expected missing `sittings` module suite failure. Failures showed post-exam due timestamps, premature graduation and overdue-first ordering in the final week.
- Green focused run after implementation: all 3 files / 106 tests passed.
- Full worker checks after formatting: `pnpm typecheck` passed; `pnpm lint` passed (62 files, no diagnostics); `pnpm test --maxWorkers=1` passed (25 files / 472 tests, 21.51 seconds).
- App `pnpm lint` passed (543 files, four existing informational suggestions in untouched dev bake-off files). App typecheck and tests pending.
- `git --no-optional-locks diff --check` passed. Source changes are restricted to the six accepted worker files, plus this log. No dependency changes or migrations; the assessment golden test remains unchanged.
- The new dates mirror and `examFor` tests cover saved later targets, fallback for missing/unknown/expired ids, whole-exam-day resolution and exhausted-calendar behavior. Route tests use real Hono handlers and in-memory SQLite, checking all three correct-answer paths, lapse memory, final-week graduation, user-specific targets, ordering and filters/limits.

## Playbook-proposal — astra-relay

- 2026-10-21: Biome 2.4.14 reports `noDuplicateTestHooks` on calls to an ordinary date helper named `before` in Vitest tests. Its hook detection treats that name as a test hook. Name date helpers `daysBeforeExam` or another domain-specific name; do not suppress the lint rule. The proposal is retained here for coordinator forwarding because this managed worker's writable roots exclude `~/scratch/skill-gotchas/`.

## Scope and delivery notes — 2026-10-21

- Exam-aware timestamps are written when a correct answer advances a row; this round does not backfill already-stored due timestamps. Unset preferences use the next configured sitting because no app writer exists yet. Calendar days follow the same local-date convention as the app, evaluated in the worker runtime's timezone.
- No independent reviewer has reviewed this uncommitted tree yet. Coordinator signing, commit and independent exact-head review remain required before delivery. No merge or publication was attempted.

- 2026-10-21 verification update: app `pnpm typecheck` passed. Re-read the bead before handoff; its accepted scope and delivery instructions are unchanged. Full app tests are still running; no failure has been reported so far.

## Final handoff — 2026-10-21

- Full app `pnpm test --maxWorkers=1` completed: 113 files passed / 1 failed; 4,074 tests passed / 1 failed (290.24 seconds). The sole failure was `src/lib/trapIndex.test.ts`, committed trap index generation check: `spawnSync /usr/bin/node EPERM`. The sandbox refused its pipe-backed child process; this does not establish whether the generator check itself passes. No retry or alternative harness was attempted.
- Coordinator follow-up: run `pnpm test src/lib/trapIndex.test.ts` from `app/` on the host. All other required app and worker checks have completed successfully. `assessmentGolden.test.ts` and all app files remain unchanged.
- Implemented: mirrored sitting resolution with drift test; exam-aware timestamp compression preserving the ladder and lapse memory; graduation deferred until the last week; user-specific exam reads on all three correct-answer routes; final-week ordering across due/pile/all scopes with existing auth and filters.
- Delivery branch is `codex/hpf-bz6f.5-exam-date-aware-spacing-and-run-in-compressed-intervals-time`, base/head remains `320bd50c03823781281280560b4245475e41e569`; all implementation changes are uncommitted. This is implementation evidence, not an independent merge-review verdict.
- The coordinator must run the blocked app check, commit/sign the tree, obtain independent exact-head review and park the bead. No closure, status/assignee change, merge or publication was performed by this worker.

- Staging was attempted once with the seven accepted paths. Git could not create `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-bz6f.5/index.lock` because the worktree's git metadata is read-only in this sandbox. Changes are therefore unstaged as well as uncommitted; coordinator must stage them on the host. No permission workaround or commit was attempted.

- Final verification: diff whitespace check passed; exactly the seven admitted repository paths changed; cached diff is empty. App source and assessment golden test/snapshot are unchanged.

SPACING DONE: hpf-bz6f.5

## Resumed assignment check — 2026-10-21

- The managed startup returned this existing assignment with its implementation DONE note already present. Re-read the accepted contract and both worklogs, then inspected the source diff and new sitting module/tests. No additional source changes were needed.
- HEAD remains `320bd50c03823781281280560b4245475e41e569`; repository status still contains exactly the seven admitted paths. `git --no-optional-locks diff --check` passed again. Existing test results above were not rerun.
- Host follow-up is unchanged: rerun the blocked app trap-index test, stage/sign the changes, obtain independent exact-head review and park the bead. Do not retry staging or the sandbox-blocked check here. The specific bead contract requires a DONE note and stop, with no closure, status/assignee change or drain that would release this assignment.

SPACING DONE: hpf-bz6f.5

## Round 2 — 2026-10-21

- Starting head: `b222865520f1a5dbd78230dbfd9a3ffae95928c0`, clean in the assigned writable worktree. Dependencies are installed. The earlier sandbox-root blocker is resolved in this managed launch.
- Accepted changes supersede the Round 1 decisions above: when the final pre-exam anchor is no longer in the future, retain the normal ladder due time so a correct answer leaves the due and pile scopes. Suppress graduation only with more than seven and at most sixty days remaining; retain final-week graduation and the existing timestamp cap.
- Regression plan: exam-eve midnight/noon and exam-day midnight/noon across all three answer routes, including fresh mistakes, ladder advancement, lapse recovery and cap graduation; unit tests for the inclusive sixty-day boundary and distant exams.
- Delivery remains uncommitted for coordinator signing/review. Only accepted files will change; no status/assignee changes or bead closure.
- Red first: from `worker/`, `pnpm test src/lib/srs.test.ts src/routes/mistakes.test.ts --maxWorkers=1` failed with 18 failed / 101 passed (2 files). Five unit failures showed immediate exam-eve due times and graduation suppressed beyond sixty days; thirteen route failures reproduced those outcomes through persisted rows. Exam-day cases already passed and remain regression coverage.
- Green focused: `pnpm test src/lib/srs.test.ts src/lib/sittings.test.ts src/routes/mistakes.test.ts --maxWorkers=1` passed, 3 files / 130 tests. The route matrix verifies both due and pile become empty after a correct answer for fresh, advanced, lapsed and graduating rows, at midnight/noon on exam eve/day.
- Full worker verification: `pnpm typecheck` passed; `pnpm lint` passed (62 files); `pnpm test --maxWorkers=1` passed, 25 files / 496 tests (14.05 seconds). App `pnpm typecheck` passed; `pnpm lint` passed (543 files, four existing informational suggestions in untouched development components). Full app tests are running.
- Implementation changes are limited to `worker/src/lib/srs.ts`; regression coverage changes only `worker/src/lib/srs.test.ts` and `worker/src/routes/mistakes.test.ts`. Calendar and route production code are unchanged. `git --no-optional-locks diff --check` passed.
- Full app verification: `pnpm test --maxWorkers=1` completed in 201.99 seconds with 113 files passed / 1 failed and 4,074 tests passed / 1 failed. The sole failure is the unchanged `src/lib/trapIndex.test.ts` generator check: `spawnSync /usr/bin/node EPERM`. This sandbox result does not verify the generator; coordinator must run `pnpm test src/lib/trapIndex.test.ts` from `app/` on the host. No workaround or retry was attempted.
- Final inspection: exactly four admitted repository files changed; cached diff is empty and HEAD remains `b222865520f1a5dbd78230dbfd9a3ffae95928c0`. Changes are unstaged and uncommitted. Staging was not retried because the worktree Git metadata remains outside this launch's writable roots, as recorded in the prior staging refusal.
- Coordinator handoff: stage/sign the four changed files, run the sandbox-blocked app check, arrange independent exact-head cross-vendor review, and park the bead. Round 1's HOLD is addressed by implementation and tests here, but no independent PASS is claimed. No closure, status/assignee change, drain, merge or publication was performed.
- Existing playbook proposals (Biome helper naming here and the managed claim/worktree mismatch in the classified worklog) remain available for coordinator forwarding. No new reusable gotcha was encountered in this fix round.

SPACING R2 DONE: hpf-bz6f.5

# Worklog — hpf-bz6f.3

## Findings

- 2026-10-21: Claimed the direct implementation bead; no molecule. Clean base `320bd50c03823781281280560b4245475e41e569`; app and worker dependencies present.
- Existing mastery and framework timestamps support the accepted two-day rule without schema changes. The brief narrows the parent description: no detour mixing or Uppslag changes in this write set.

## Decisions

- Use a 30-day score half-life toward 0.5 before folding an answer. Derive mastered → retaining on reads only after 30 days without a dated mastery update; legacy rows with no mastery evidence/timestamp remain unchanged.
- Initial promotion requires a retaining transition on an earlier UTC day and a score in the mastered band. Already-mastered rows keep that status while their score supports it; misses/decay can lower the internal rung.
- Load all eight catalogs before showing a denominator. Count mastered entries only; preserve a per-device high-water mark in guarded localStorage and in mounted component state when persistence is unavailable.
- Follow the bead's specific delivery instructions: leave implementation uncommitted, append evidence, and hand off to the coordinator without closing or changing assignment.

## Progress

- 2026-10-21: Inspected production readers/writers and existing in-memory D1 and screen test harnesses. Tests will exercise actual writers/routes and the visible count before implementation.
- 2026-10-21: Red-first worker command: `NODE_OPTIONS=--max-old-space-size=3072 pnpm test --pool threads --maxWorkers 2 src/lib/progress.test.ts src/routes/attempts.test.ts src/routes/frameworkProgress.test.ts` (from `worker/`). Baseline: 11 failed / 37 passed, specifically same-day mastery, next-day transition, legacy promotion, write decay and read decay.
- 2026-10-21: Red-first app command: `NODE_OPTIONS=--max-old-space-size=3072 pnpm test --pool threads --maxWorkers 2 src/lib/patternsHeld.test.ts src/screens/ProgressMobile.patterns.test.tsx` (from `app/`). Baseline: three missing-count failures, one pass, plus the expected missing-helper import failure. After implementation and adding route coverage: 17/17 pass.
- 2026-10-21: Updated only two existing attempt expectations: promotion now waits for the next UTC day; the demotion test establishes mastery over two days first. All other existing exact-row tests and the assessment golden remain unchanged.
- 2026-10-21: Full worker suite via `NODE_OPTIONS=--max-old-space-size=3072 pnpm test --pool threads --maxWorkers 2`: 24 files / 429 tests passed, including assessment golden. `pnpm typecheck` and `pnpm lint` pass in both packages; app lint reports four pre-existing informational suggestions in dev bakeoff components, no errors or warnings. `git diff --check` passes.
- 2026-10-21: Test-fixture corrections during green verification: close the first drill before creating a next-day drill (one active session per user/kind); read catalog files from the app test command's working directory because Vite rewrites a static `new URL(..., import.meta.url)` asset expression in the jsdom test. No production harness or dependency changes.

## Handoff

- Implementation and verification in progress. Coordinator retains signing, delivery, independent review, and host-only checks.
- 2026-10-21: Full app suite in progress. Modified paths remain inside the admitted write set. The underlying rule proves practice on two UTC days, not interleaving or a minimum 24-hour gap; this is the accepted no-migration scope. Device storage is deliberately local, and cross-remount persistence depends on browser storage being available.
- Playbook-proposal (astra-relay, 2026-10-21): hpfetcher Vitest fixture reads using a static `new URL(...public/frameworks..., import.meta.url)` resolved to `/public/...` after Vite's asset transform and failed ENOENT. Use the package test command's known working directory for Node filesystem fixture reads. This sandbox does not permit writes to `~/scratch/skill-gotchas/`; coordinator should relay this entry there.
- 2026-10-21 final verification: full app command `NODE_OPTIONS=--max-old-space-size=3072 pnpm test --pool threads --maxWorkers 2` completed in 155 seconds: 115 files pass, one file fails; 4,091 tests pass, one fails. The sole failure is the unchanged `src/lib/trapIndex.test.ts` generator check: its `execFileSync` child cannot spawn Node with pipes (`EPERM`) in this sandbox. No workaround, fixture rewrite, or direct Node retry attempted; rerun that check on the host. All new app and worker tests pass.
- 2026-10-21 final delivery: implementation is uncommitted and unstaged on base `320bd50c03823781281280560b4245475e41e569`. Staging was attempted once and refused because the worktree index is in the read-only parent repository git directory. No commit, push, merge, status change, assignee change, or close was performed. Exactly the ten admitted repository paths changed; the classified worklog was also maintained.
- Coordinator next: rerun the trap-index generator test on the host, stage/sign the tree, obtain independent Claude review of the resulting exact head, and deliver through normal gates. Relay the playbook proposal above. MASTERY DONE: hpf-bz6f.3

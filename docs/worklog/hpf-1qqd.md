---
bead: "hpf-1qqd"
project: "hpfetcher"
session: "ci-iro7z"
status: "implementation_complete"
---

# Worklog — hpf-1qqd

## Findings

- 2026-10-06: Read the operator brief and blocking review hpf-1jis. Confirmed
  branch `codex/hpf-0026.1-progress-reader` and HEAD
  `c91f7d22b99936ee48c97ec66927e2a0b7ca7167`, with no tracked changes.
- The singleton QueryClient wraps the routed app under Clerk without an
  identity reset. Both framework progress and sibling stats reuse fixed keys.
- `useAdaptiveReview.nameCache`, `useTopTraps.frameworkHeadlines`, explanation
  caches, framework/question/figure/normering caches hold shared authored
  content rather than user records. SessionPlayer also retains a bounded set of
  ended session IDs across mounts; those IDs belong to the previous user.

## Decisions

- Follow the operator's offline lane workflow: no Gas City commands, server,
  network, Git writes, or worker changes. Leave edits uncommitted. This lane
  worklog supersedes the normal vault worklog destination for this assignment.
- Test the production provider tree from main.tsx with mocked Clerk and
  transport, real hooks/API client/QueryClient, and every consumer render
  recorded. Capture red before changing production code.
- Reset at the provider boundary and keep consumers unmounted until the old
  cache is cleared, preventing an in-place consumer from seeing stale data
  before an effect runs. Preserve initial identity loading and same-user data.

## Progress

- Added regressions for remount and in-place account switching (framework
  progress plus stats), sign-out, late in-flight responses, initial Clerk
  loading, and same-user token refresh. Production code is still at c91f7d2.
- Red before production edits: **4 failed / 1 passed**, exit 1, at unchanged
  HEAD c91f7d2. Both account-switch cases returned A's progress AND stats to B;
  sign-out retained A's cache; pending responses populated B's consumers with
  A's data. Initial load/same-user refresh passed. Evidence:
  `/tmp/hpf-1qqd-red.log`. Two preceding test-harness setup failures (virtual
  PWA import resolution and a missing Sentry mock export) were corrected before
  this meaningful red run; Vitest now resolves the entrypoint's mocked PWA ID.

[S:ci-iro7z|W:hpf-1qqd|H:red-first|E:c91f7d2; /tmp/hpf-1qqd-red.log; 4 failed / 1 passed]

- The first provider reset passed all five original regressions. Inspection of
  sibling mutation hooks found that their late `onSuccess` callbacks can still
  call `setQueryData` after `clear()`. Added a real `useUpdateUserPrefs` mutation
  regression: **1 failed / 7 passed**, with A's delayed preferences present in
  B's cache. Evidence: `/tmp/hpf-1qqd-mutation-red.log`.
- Clear the previous client and create a fresh one with identical defaults on
  identity changes. Existing mutation callbacks retain the retired client;
  hooks in the new tree share the new one. The factory also avoids reusing an
  old singleton if the entire provider later remounts. Initial undefined-to-user
  resolution keeps its client and cache. Fixed query keys remain unchanged.
- Moved the bounded ended-session-ID memory into `lib/endedSessions.ts` so the
  auth boundary can clear it; its session-player behavior and size cap remain.
  Persisted browser preferences and localStorage history are not module-level
  API caches and were not changed.

## Handoff

Implementation and verification in progress; Beads updates remain pending
with the coordinator under the operator's sandbox exception.

## Verification — 2026-10-06

- Provider implementation: `app/src/api/AuthQueryProvider.tsx`, installed in
  `app/src/main.tsx`. The provider gates its subtree while an identity reset
  runs before paint, clears the old QueryClient and ended-session memory, then
  supplies a fresh client using the existing defaults. This also resets local
  state derived from the previous user's queries. It preserves initial Clerk
  loading and token refresh for the same user. `FRAMEWORK_PROGRESS_KEY` and
  sibling keys remain unchanged.
- Targeted green: **8/8 tests**, including direct switching with remount and
  in-place updates, sign-out, delayed queries, delayed mutation callbacks,
  transient unloaded identity, and initial loading/same-user cache reuse.
  Evidence: `/tmp/hpf-1qqd-targeted.log`.
- Full required verification from `app/`, offline and without installation:
  - `npx --no-install vitest run --reporter=default`: **813/813 tests,
    78/78 files**, exit 0; baseline 805 tests / 77 files, **+8 tests**.
    Evidence: `/tmp/hpf-1qqd-app-tests.log`.
  - `npx --no-install tsc -b --noEmit`: **PASS**, exit 0.
    Evidence: `/tmp/hpf-1qqd-typecheck.log` (empty on success). The initial
    check caught a DOM/worker-type overload on the test's `append`; changed
    the fixture to `appendChild` before the final successful check.
  - `npx --no-install biome check src/main.tsx src/main.auth.test.tsx
    src/api/AuthQueryProvider.tsx src/api/queryClient.ts src/lib/endedSessions.ts
    src/components/session/SessionPlayer.tsx`: **PASS**, six files, exit 0.
    Evidence: `/tmp/hpf-1qqd-biome.log`. Formatted the new test before this run.
  - The app's Biome include filter excludes `vitest.config.ts`. Checked that
    file through `npx --no-install biome check --write
    --stdin-file-path=src/vitest.config.ts < vitest.config.ts`, capturing stdout
    in `/tmp/hpf-1qqd-vitest-config-checked.ts`; exit 0 and `cmp` confirmed the
    checked output is byte-identical to the lane file. No config change from
    this validation. Evidence: `/tmp/hpf-1qqd-config-biome.log` (empty).
- Every npm invocation used `npm_config_offline=true` and
  `npm_config_cache=/tmp/hpf-1qqd-npm-cache`. Regression transport is mocked;
  no server, network request, dependency installation, or Gas City command was
  used during this assignment.
- `git diff --check` passed; HEAD remains
  `c91f7d22b99936ee48c97ec66927e2a0b7ca7167`. The index is unchanged and no
  worker files changed. Existing untracked runtime/skill paths were preserved.

[S:ci-iro7z|W:hpf-1qqd|H:implementation-verification|E:c91f7d2 + uncommitted lane diff; 813 app tests; app types; Biome; diff check PASS]

## Final handoff — 2026-10-06

Supersedes the in-progress handoff above: implementation and requested checks
are complete, with all changes uncommitted and unstaged. Self-review confirmed
that children cannot read the previous identity's query cache while resetting,
late queries are discarded, and late mutation callbacks can only update their
retired client. Shared authored-content caches stay intact. The scope adds no
worker changes, per-hook key migration, or browser-storage migration.

The coordinator should record the pending bead note and arrange independent
review of the eventual committed head; no independent PASS or Beads closure
is claimed. Publishing/deployment, credentials, destructive cleanup, and
authority changes remain outside this assignment.

## Bead note (pending)

Fixed F1 at the Clerk provider: clear and replace QueryClient before consumers render for a new identity; cancel stale reads and isolate late mutation callbacks. Clear ended-session memory; preserve content caches and query keys. Red at c91f7d2: 4 failed/1 passed; extra mutation red reproduced. Green: 813/813 app tests (+8), tsc, Biome and diff check. Worker untouched; HEAD c91f7d2 unchanged; changes uncommitted/unstaged. Independent review and Beads update pending coordinator.
LANE DONE: hpf-1qqd

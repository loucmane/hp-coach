# Worklog — hpf-r17k

## Findings

- 2026-11-11: Claimed the test-only FolioShell flake on base `8f636098231f2525ed9ede0969c53bae2a746646`; the worktree was clean and app dependencies were present. No molecule controls this bead.
- The preview test waits for the lazy shell DOM, then synchronously reads a child mount-effect counter. Two root-composition tests also wait only for the shell before inspecting or replacing route content.

## Decisions

- Preserve every existing assertion and the exact one-mount requirement. Synchronize assertions with content readiness and effect completion, without changing product code or timeouts.
- Use only project pnpm commands, at most two test workers, and leave changes uncommitted for coordinator delivery. The bead requests parking rather than closure.

## Progress

- Baseline: `pnpm test src/folio/FolioShell.test.tsx --maxWorkers=2` passed 38/38 tests in 5.50 seconds. Further baseline repetition is in progress to try to reproduce the intermittent CI failure.

## Handoff

- Pending: baseline repetition, minimal test edit, 20 consecutive fixed-file passes, app typecheck/lint/full tests, final evidence and worker state.

## Update — 2026-11-11, baseline and fix

- Baseline reproduction attempt: 20 consecutive invocations of `pnpm test src/folio/FolioShell.test.tsx --maxWorkers=2` passed, each with 38/38 tests (760 test executions). The reported CI failure did not reproduce locally; no local red run is claimed.
- Added a content-heading wait after each of the three lazy-shell waits: `Idag` in the preview case and `Routesidan` in both root-composition cases. The mount counter assertion now uses `waitFor` and still requires exactly one mount. All original assertions remain; no product code or timeout changed.
- The remaining lazy `findByText('Vald designriktning')` already waits for the rendered destination before checking the old shell and route are absent. The rest of the file renders FolioShell directly and has no equivalent lazy-shell readiness gap.

## Update — 2026-11-11, verification

- Fixed-file stability: 20/20 consecutive invocations of `pnpm test src/folio/FolioShell.test.tsx --maxWorkers=2` passed, each with 38/38 tests (760 test executions). Both phone variants retain the one-main, no-classic-navigation, exactly-one-mount and accessibility assertions.
- `pnpm typecheck`: PASS, exit 0.
- `pnpm lint`: PASS, exit 0; 782 files checked, four pre-existing informational diagnostics in untouched devbake files, no fixes applied.
- `git --no-optional-locks diff --check`: PASS. Git status contains only the admitted test file and this worklog.
- `pnpm test --maxWorkers=2`: running; result pending. Worker checks are not applicable because no worker files changed.
- Git metadata is at `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-r17k`, outside this sandbox's writable roots. Leave staging and signing to the coordinator; no commit, signing or remote operation has been attempted.

## Final handoff — 2026-11-11

- Full app verification: `pnpm test --maxWorkers=2` completed in 307.54 seconds with **209 passed / 1 failed files; 6,291 passed / 1 failed tests**. The sole failure is the unchanged generator check in `src/lib/trapIndex.test.ts`: the sandbox refuses its child process with `spawnSync /usr/bin/node EPERM`. This is the sandbox limit anticipated by the bead; the check is not recorded as passing and was not retried through another execution path.
- Source work is complete. Worker disposition is **blocked only on host verification**, with the concrete next action: the coordinator runs `pnpm test --maxWorkers=2` from `app/` outside the worker sandbox, confirms the generator check passes, then proceeds with independent review and delivery.
- Current head remains `8f636098231f2525ed9ede0969c53bae2a746646`; there is no implementation commit. The tested uncommitted `app/src/folio/FolioShell.test.tsx` has SHA-256 `8f4f6838e921eb2957ff09fe45c523e1e33dc42ac8b86f5b0e91aedf4e540ff2`. Final whitespace and scope checks passed; only the two admitted repository files are changed.
- Independent review has not been performed. Changes are uncommitted and unstaged. Coordinator-owned staging, signing, review and delivery remain; no merge, publication, credential or authority change occurred.
- BLOCKED: hpf-r17k — test-only fix complete; 20 fixed runs, typecheck and lint pass; full-suite host verification required for one sandbox-denied generator check. Do not close the bead; park it for the coordinator.

## 2026-11-11 coordinator host verification

- Host: typecheck and lint clean; FolioShell.test.tsx 5/5 consecutive runs (38/38 each); full app suite 210/210 files, 6292/6292 tests.
- Review: test-only. The mount check now waits for the lazy content (findByRole heading, then waitFor mounts === 1, so a double mount still fails); two other post-lazy checks in the file wait the same way. No assertion removed.

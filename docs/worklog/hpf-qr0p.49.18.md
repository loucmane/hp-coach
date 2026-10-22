# Worklog — hpf-qr0p.49.18

## Findings

- 2026-10-22: Claimed the assigned bead; no molecule. Clean base: `3818dd59c092c18a9b4de1fb104c9edecc92f236`. App and worker dependencies are present.
- The route already passes the active round's ordered plan and cursor. Replay eligibility includes same-trap siblings, so checking only the source question's parsing status would incorrectly hide playable misses.

## Decisions

- Reuse the production replay picker for preview eligibility with the memoized bank; preserve neutral rows until that read resolves.
- Show the remaining stored plan in a separately labelled preview for a matching resumable round. Keep queue counts tied to the current due list.
- Follow the bead's latest delivery contract: uncommitted edits, final evidence note, coordinator-owned status and delivery. Real-stack visual review and owner approval remain required.

## Progress

- Inspection complete; regression tests precede implementation. Tests use the default TMPDIR as explicitly required by this bead.

## Handoff

- Implementation and checks in progress.

## Verification — 2026-10-22, first pass

- Red-first: focused stage and overview run failed 11/73 assertions as intended (8 explicit instant-scroll cases; Visa alla reset, playable preview filtering, stored-round preview). The other 62 passed.
- After implementation: focused Repetera/guards, ReadingSpread, FolioSessionStage and route boundary suite passed 133/133 across 6 files.
- App typecheck PASS. App lint PASS (four existing informational findings in untouched bake-off files). Production build PASS (3298 modules; existing route-file and chunk-size warnings).
- Full suite run 1: 4849 passed, 1 failed, 160 files, 171.35 seconds. Sole failure: `src/lib/trapIndex.test.ts` generator child process refused with `spawnSync /usr/bin/node EPERM`, the sandbox limitation explicitly named in the brief. All drill, Repetera, foundation, Idag and Öva tests/guards passed.
- E2E discovery PASS: 105 tests in 19 files. Browser execution is not verified here: the configured suite requires Clerk authentication and live worker access outside this offline worker. Host E2E and real-stack desktop/phone, light/dark visual review remain required.
- No worker files changed, so worker-package checks are not applicable.

- Full suite run 2: 4849 passed, 1 failed, 160 files, 177.50 seconds. Identical sole failure: trap-index generator `spawnSync /usr/bin/node EPERM`. ReadingSpread passed again. Third full run started with the same command and unchanged source.

## Final handoff — 2026-10-22

- All six requested fixes are implemented: awaited reading-stage transitions; explicit instant scroll; shared scroll mock; disclosure reset after shrinking below its preview limit; due preview eligibility from the production replay picker; remaining stored-plan preview with its own Swedish heading and matching resume scope.
- Full suite run 3: 4849 passed, 1 failed, 160 files, 165.17 seconds. Again, the only failure was the sandbox's generator child-process EPERM. The ReadingSpread flake did not recur in any of the three full runs. No source changes occurred between those runs.
- `git diff --check` passes. All ten changed source/test files and this worklog are within the admitted write set. No dependencies, worker source, frozen authority files, sibling screens, or E2E specs changed.
- Implementation base/head remains `3818dd59c092c18a9b4de1fb104c9edecc92f236` on `codex/hpf-qr0p.49.18-folio-merged-screens-small-fixes-drill-flake-and-scroll-repe`. Delivery is uncommitted and unstaged: the index lives at `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-qr0p.49.18`, outside the writable roots. No commit/signing or remote operation was attempted.
- Coordinator next actions: stage/commit; rerun the generator check and authenticated E2E with the flag off on the host; obtain independent Claude review at the resulting exact head; show real-stack desktop/phone and light/dark evidence to the owner. Owner visual approval is required before merge. This worker does not close or change the bead's status/assignee, per the latest delivery contract.
- No new playbook gotcha was encountered: the only check failure and the git-metadata limitation are already documented in the supplied worker guidance.

FOLIO SMALL FIXES DONE: hpf-qr0p.49.18

# Worklog — hpf-bz6f.7

## Findings

- 2026-10-21: Accepted round 1 is slice 7a: provpass uncertainty flags only. Base HEAD is `320bd50c03823781281280560b4245475e41e569`; the assigned branch started clean. No molecule controls this bead.
- `MockRunner` records answered-and-wrong questions both on submit and on abandon. Abandon remains void and will not add flagged correct answers. Attempts reconstruct answers on reload but carry no flags.
- The existing keyboard map uses A–E and arrows; M is free. Clerk's `useAuth().userId` supplies the account namespace. Both package dependency directories are installed.

## Decisions

- Preserve the pure answer-sheet reducer; add immutable flag/unflag actions and guarded localStorage helpers keyed by account plus session ID. Restore flags separately from attempts and clear storage on submit/timeout/abandon.
- Add an accessible Osäker toggle and a visible question mark on grid cells, with M as the shortcut. Keep all grading hidden until hand-in and preserve the 55-minute duration.
- Only hand-in/timeout queues flagged correct answers alongside the existing wrong answers. Flags never enter attempts, session patches, or the strict version-1 result breakdown.
- Flags are local to this browser. Another device or cleared/blocked storage can lose flags; this is accepted for slice 7a.
- Test the behavior red first, then run app typecheck, lint, and tests. No worker files or dependencies will change. Leave delivery uncommitted; coordinator owns review and delivery.

## Progress

- [S:worker|W:hpf-bz6f.7|H:inspect|E:base-and-scope] Read the accepted bead, repository policy, runner, reducer, auth cache boundary, and existing tests. Only the five admitted repository files will change.

## Handoff

- Implementation and verification in progress. No commit, independent review, or delivery yet.

## Progress — implementation and verification, 2026-10-21

- [S:worker|W:hpf-bz6f.7|H:implement|E:flags] Added immutable flag/unflag actions and account/session-scoped storage helpers with guarded reads, writes, deletion, and malformed-data handling. The runner restores flags alongside the attempt-derived sheet and remounts its local state when account/session identity changes.
- [S:worker|W:hpf-bz6f.7|H:ui|E:uncertainty] Added the Osäker toggle, pressed-state styling, M shortcut (ignoring repeats, modifiers, and typing targets), and visible/accessibly named question-mark grid markers. Plain Enter and the 55-minute countdown retain their existing behavior.
- [S:worker|W:hpf-bz6f.7|H:settle|E:queue] Hand-in and timeout queue answered wrong questions and flagged correct questions once each. Unflagged correct answers and blanks are excluded. Abandon still queues answered wrong questions only. Submit/timeout/abandon clear this account/session's local flags; cancelling confirmation preserves them. No server payload or worker code changed.
- [S:worker|W:hpf-bz6f.7|H:red-first|E:blocked] Wrote regression tests before source changes. Attempted from `app/`: `TMPDIR=/work/hpf-bz6f.7 pnpm test --pool=threads --maxWorkers=2 src/lib/mockSheet.test.ts src/components/mock/MockRunner.test.tsx`. pnpm exited before Vitest because the required scratch directory does not exist. Creating it was refused by the read-only filesystem. This is an infrastructure failure, not red-test evidence; neither red nor green runtime results are claimed. Recorded the blocker on the bead and continued the authorized source work.
- [S:worker|W:hpf-bz6f.7|H:checks|E:static] `pnpm typecheck` passed (exit 0). `pnpm lint` passed (exit 0; four existing informational diagnostics in unrelated devbake files); the final `pnpm lint --diagnostic-level=error` checked 543 files and passed. `git --no-optional-locks diff --check` passed. Formatting was applied only to the four admitted source/test files.
- [S:worker|W:hpf-bz6f.7|H:delivery|E:stage-blocked] Staging the five admitted repository files was refused because the shared worktree index is outside the writable sandbox. Changes remain unstaged and uncommitted. No signer, commit, push, merge, or deployment was attempted.

## Handoff — supersedes the initial in-progress entry

- Implementation is ready for coordinator verification in `/home/loucmane/dev/hpfetcher-worktrees/hpf-bz6f.7`, branch `codex/hpf-bz6f.7-capture-uncertainty-a-guess-key-and-flagged-but-correct-into`. HEAD remains the base `320bd50c03823781281280560b4245475e41e569`; there is no implementation commit or independent review verdict yet.
- Required host work: provision writable `/work/hpf-bz6f.7`; verify the regression tests fail against the base source, then restore the implementation and run the focused tests and full `pnpm test` (threads and two workers are sufficient). Recheck typecheck/lint at the final candidate, stage/commit, and obtain independent review at that exact head before delivery. The full app test suite has not run here because the same scratch prerequisite blocks pnpm startup.
- Preserve the local-only limitation: changing devices or clearing browser storage loses flags. Failed storage removal may leave a stale completed-session key, which is isolated from all other session IDs.
- Per the accepted delivery contract, do not close or change the bead's status/assignee from this worker. The coordinator parks it on the final note.
- Playbook-proposal for `astra-relay` (2026-10-21): pnpm fails before Vitest with ENOENT when an approved `TMPDIR=/work/<bead>` does not exist, even with the threads pool. Managed worker sandboxes cannot create `/work/<bead>`. Provision and expose writable test scratch before routing, then run the normal project test command. The required `~/scratch/skill-gotchas/` destination is outside this session's writable roots; proposal retained here for coordinator transfer.

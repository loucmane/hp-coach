# hpf-bz6f.15 — sync the chosen exam sitting

## Contract and starting state

- Date: 2026-10-21.
- Base: `447ce8639aacb6249b5321b549dd784a179f96c4` on `codex/hpf-bz6f.15-sync-the-chosen-exam-sitting-to-users-targetsittingid-so-exa`.
- Clean worktree and installed app/worker dependencies verified before edits.
- Round-1 scope: synced sitting setter with nullable rollback, one-time null-server backfill, a Swedish Prov setting in Mer, and focused app/worker regression coverage.
- Only the six accepted repository paths are in scope. Worker production code and `/me/stats` snapshots remain untouched.

## Implementation

- `useSyncedPrefs.setSitting` uses the shared write-through helper: update the local choice immediately, PATCH `targetSittingId`, and restore the captured stored id with `useExamStore.setState` if the write fails. Rollback accepts an unset previous choice without changing the exam-store API.
- `useHydratePrefs` still applies a non-null server choice locally. When the server value is null and the stored local id is non-null, a ref-guarded migration PATCHes that exact id once per mount. Backfill failure retains the local choice and does not trigger a retry loop. Neither the derived default nor a rolled-forward display id is written.
- Mer adds a Prov row using the existing word-button styling. It lists sittings whose calendar day has not passed, calls the synced setter, and handles a rejected promise after the setter restores the previous choice.
- Worker test round-trips the preference through PATCH and GET, then verifies `examFor` uses the saved later sitting even when an earlier exam is available.

## Red-first evidence

- Before production edits: `app/` → `pnpm test src/api/useSyncedPrefs.test.tsx src/routes/mer.test.tsx` exited 1: 2 failing files, 9 failed / 5 passed tests. Failures were the absent `setSitting`, absent backfill writes, and absent Prov row.
- After implementation: the same focused command exited 0: 2 files, 14 tests passed. Tests cover optimistic writes, rollback to null and a saved id, successful and failed backfill without loops, non-null server precedence, unknown server ids, read-only date roll-forward/default behavior, production visibility, exam-day selection, and rejected UI writes.

## Verification

- App `pnpm typecheck`: PASS.
- App `pnpm lint`: PASS, four existing informational diagnostics in untouched devbake components. A formatting issue in the new test was corrected before the passing run.
- Worker `pnpm typecheck`: PASS.
- Worker `pnpm lint`: PASS, 62 files checked.
- `git --no-optional-locks diff --check`: PASS.
- Full app and worker suite results will be appended below.

## Handoff

- Leave changes uncommitted as required by the bead. Coordinator owns parking, independent review, signed delivery, and closure. No merge or publication is authorized for this worker.

## Final suite evidence — 2026-10-21

- App `pnpm test --maxWorkers=2`: 116 files passed, 1 file failed; 4,134 tests passed, 1 failed (131.85 seconds). The sole failure is the unchanged `src/lib/trapIndex.test.ts` generator consistency check: `spawnSync /usr/bin/node EPERM` from its child-process call. The sandbox prevented the check from executing; it did not report stale generated data. Coordinator must run that check outside the sandbox. No generator, fixture, or sandbox-policy workaround was attempted.
- Worker `pnpm test --maxWorkers=2`: PASS, 25 files and 511 tests (11.78 seconds), including the new sitting preference round-trip and the unchanged assessment golden tests.
- The full app run includes the 14 passing focused tests with hydration mounted alongside the explicit setter. Full suites were run sequentially and capped at two workers.
- Final implementation head remains the starting SHA `447ce8639aacb6249b5321b549dd784a179f96c4`; source changes are uncommitted for coordinator delivery. Independent cross-vendor review is pending.

## Playbook proposal — astra-relay

- 2026-10-21: Symptom: full hpfetcher app suite fails only the trap-index consistency test with `spawnSync /usr/bin/node EPERM`. Cause: the sandbox prevents the test's Node child process from running the generator check. Rule: record the rest of the full-suite results and have the coordinator run this unchanged check on the host; do not regenerate the index or weaken the sandbox to make the worker run pass.
- The proposal is preserved here for coordinator transfer to `~/scratch/skill-gotchas/astra-relay.md`. This managed session's configured writable roots do not include that queue directory.

## Delivery boundary — 2026-10-21

- `git add` of the six accepted paths was attempted once and refused: the shared worktree `index.lock` is on a read-only filesystem outside this sandbox's writable roots. Changes remain unstaged and uncommitted. Coordinator must stage them on the host; no commit, signer invocation, push, or metadata workaround was attempted.
- The bead is deliberately left open with its existing assignee. The accepted contract calls for a final DONE note and coordinator parking, rather than worker closure or status changes.

- Final app typecheck after the last test edit: PASS. Final diff whitespace check: PASS. Final status contains exactly the six accepted repository paths, all unstaged.

SITTING DONE: hpf-bz6f.15

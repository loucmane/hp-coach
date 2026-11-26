# Worklog — hpf-qr0p.51.35 (LJ16B FEEDBACK)

## Scope and starting point

2026-11-25. Base `5fe0287747e30f488d5793bcea1e3855d9dca461`. Applied the six app and worker files from `a8d4596ba3adfea9f2a9fa063a33c188fa1f6103` to the worktree. Its original worklog is at `a8d4596:docs/worklog/hpf-qr0p.51.34.md`. That log records the initial endpoint and v2 seam tests. This round addresses the three client findings in review `hpf-0o4b`.

## Red-first evidence

`pnpm test src/api/feedback.test.ts --maxWorkers=2` from `app/` against the inherited implementation gave 3 failures and 18 passes.

- A delayed first token let the second answer for ORD go out first.
- A second account saved a different verdict, note and model for ORD while the first account's PUT was in flight. The first account's retry used all three fields from the second account's answer.
- With an ORD retry unresolved, the next submit sent NOG but missed the failed LÄS answer.

## Implementation

- Store the exact PUT body in the retry queue with its account and question. Retries use that stored body and require the matching token subject. A fresh answer supersedes retries for the same account and question.
- Reserve each question's send order synchronously before token resolution. Unrelated questions can progress independently.
- Persist a failed fresh PUT as soon as its own result is known. Recheck the retry record when its slot starts so a queued retry cannot consume a replacement failure. Clearing feedback also discards its retries and prevents a pending failure from adding one back.
- The inherited worker route authenticates and scopes PUT upserts and newest-first GET lists to the signed-in user. The client keeps the four exports, the feedback entry shape, the device-local reads, and the Ja, Delvis and Nej mapping. The existing feedback table supports the route.

## Verification

| Check | Result |
| --- | --- |
| App feedback tests, `pnpm test src/api/feedback.test.ts --maxWorkers=2` | 23 passed |
| App typecheck and lint | Passed, with four existing informational lint notices in devbake |
| App suite, `pnpm test --maxWorkers=8` | 6,385 passed, one blocked when `src/lib/trapIndex.test.ts` tried to spawn Node and received `EPERM` |
| Worker typecheck and lint | Passed |
| Worker suite, `pnpm test --maxWorkers=8` | 729 passed across 29 files, including the 11 feedback-route tests |
| Git whitespace check | Clean across the changed files |

## Handoff

Worker state is **blocked**. Implementation and the feedback-specific checks are complete. HEAD is still the starting commit and the seven admitted files are in the assigned worktree. The sandbox denied Git's index lock at `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-qr0p.51.35/index.lock`, so all edits are unstaged.

The coordinator needs to run the app suite on the host to verify the trap-index generator assertion, stage the seven admitted files, and prepare the signed commit for independent review.

SHA-256 for the two files revised from `a8d4596`:

- `app/src/api/feedback.ts` — `158a5d77de71dd9ee26b7155c40eadf8b1ba987f09ec3399ebbd0743af102d22`
- `app/src/api/feedback.test.ts` — `c62463cf04f90c455e6369babb9970f690662f8f1767a37eee98c4333804d0e2`

## Playbook proposal

2026-11-25. An account-switch test that registered a second content-auth getter kept using the first token because `registerContentAuth` resolves a one-shot Promise. Use one getter over a mutable test session and assert both the request's bearer owner and payload. The sandbox denied the append to `~/scratch/skill-gotchas/gas-city-coordinator.md`.

## 2026-11-25 coordinator host verification and cross-vendor review (Claude)

- Host: worker typecheck and lint clean, 729/729; app typecheck and lint clean, full suite 216/216 files, 6386/6386.
- Review of the three Codex hpf-0o4b findings: PASS.
  - P1: pending failures persist {payload, owner (token sub), id} together; a retry sends only the stored payload, under the same owner's token.
  - P2 (order): enqueuePut reserves the per-qid slot synchronously, before auth resolves; one serial chain per qid.
  - P2 (fresh failure): a failed fresh PUT is written to the retry store inside its own queued send, independent of other retries.
  - Nonblocking: an account switch while a token is still resolving can attribute a fresh answer to the new account; the same as any request in flight at sign-out.

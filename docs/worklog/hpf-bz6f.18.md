# Worklog — hpf-bz6f.18

## Findings

- 2026-10-21: Claimed slice B1 in the assigned clean worktree at base `9e97c5cad2fac4e194db9d57b214b4c7c3d2e5b9`. Dependencies are present. No molecule controls this bead. Part A is outside this round.
- Bank and explanation loaders already use gated content transport. TrapCard has an authored narrative; the new reader must retain it until a real example loads successfully.

## Decisions

- Use an IDs-only deterministic manifest for NOG/KVA/XYZ/MEK and apply it to the accepted selection paths. Authentic printed passes and explicit question links retain their questions.
- Read per-user/section fading on opening an example; retain that level during its reveal. Count completion once per mounted walkthrough, including under React StrictMode. Keep at least two ordinary steps before independent attempts.
- Use existing MathText and figure rendering for a read-only question and native details for optional detail steps. No dependency changes, remote actions, commits, or edits outside the admitted source files.

## Progress

- Inspection complete; red-first generator, picker, storage, and UI coverage next.

- Red-first run 1: the new manifest and fading suites failed to resolve their missing modules, as expected.
- Red-first run 2: 5 assertions failed for the section pool, framework picker, weak picker, replay sibling, and synthetic mock exclusions; direct-link selection already passed. Reader suite failed on its missing module. Generator and storage suites passed after implementation.
- Red-first card wiring: 7 failures and 2 passes, confirming missing replacement/fallback wiring, MEK reader, and worked-question link omission.
- Focused green run: 8 test files, 100 tests passed (1.65 s). Includes deterministic generator `--check`, all accepted picker paths and exceptions, signed-out behavior, lazy reveal, all fade levels, minimum two ordinary steps, account switch, late load after sign-out, StrictMode completion counting, and authored fallback/replacement.
- App `pnpm typecheck`: PASS. App `pnpm lint`: PASS after scoped formatting (578 files checked; four existing informational notices in devbake components). `git diff --check`: PASS. Full app `pnpm test --maxWorkers=2` is running, bounded to two workers for shared-host load.

### Corpus impact

| Section | Complete bank | Worked examples | Remaining section drill pool |
| --- | ---: | ---: | ---: |
| KVA | 540 | 48 | 492 |
| MEK | 540 | 16 | 524 |
| NOG | 324 | 25 | 299 |
| XYZ | 648 | 59 | 585 |

- 148 unique examples, 148 unique framework entries; 3.43% of the 4,320-question bank. No overlap with the four existing figure exclusions (all XYZ). Total ordinary section pools shrink from 4,316 to 4,168. ORD/LÄS/ELF/DTK counts are unchanged. Thirteen selected questions have figures, handled by the existing QuestionFigure renderer.
- Authentic printed-pass selection and explicit question links retain all selected examples. Only the accepted fresh-selection paths change; stored plans and original-mistake replay behavior remain as specified by the scoped contract.

### Playbook-proposal — astra-relay

- 2026-10-21: A red-first corpus assertion compared Question objects to an empty array, causing Vitest to print full question text and options. Compare IDs/counts for corpus membership assertions so failures report identifiers rather than gated content. Corrected the assertion. Proposal recorded here because this managed worker's writable roots exclude `~/scratch/skill-gotchas/`; coordinator can forward this entry.

## Handoff

- Implementation underway. Coordinator delivery and independent review remain required. The bead's delivery contract leaves this bead open and changes uncommitted.

- 2026-10-21 FINAL HANDOFF — WAITING: full `pnpm test --maxWorkers=2` completed in 110.42 s: 133 files passed / 2 failed; 4,278 tests passed / 2 failed (4,280 total).
- Required scope stop: `app/src/data/figureOverrides.test.ts:88`, test `host-2014 (raster scatter) is drillable again, with a raster figure`, expects `host-2014-kvant1-XYZ-006` in `questionsInSection(bank, 'XYZ')`. The deterministic accepted selection reserves this qid as a worked example. The test lies outside the admitted write set. No changes to that test or further source changes were made after this failure.
- Separate sandbox limitation: `app/src/lib/trapIndex.test.ts:39`, test `equals what scripts/build_trap_index.mjs derives from the explanations`, fails with `spawnSync /usr/bin/node EPERM`. Its pipe-based child process needs coordinator verification on the host. The new worked-example generator's inherited-stdio check passed in both focused and full runs.
- Exact decision required: coordinator must reconcile the old figure test's pool expectation with the accepted worked-example reservation through the approved scope process, then run the blocked trap-index check outside the sandbox. Do not widen this lane's write set informally.
- All 21 admitted files are the only source/worklog changes; classified worklog also updated. Base/HEAD remains `9e97c5cad2fac4e194db9d57b214b4c7c3d2e5b9`; no implementation commit, staging, signing, push, merge, or independent review. Typecheck and lint passed before the full-suite stop. Work is not ready for closure. No DONE marker or drain acknowledgment is emitted for this blocked handoff.

- 2026-10-21 resumed assignment: the managed claim returned this existing assignment. The current bead still has the same slice B1 contract and explicit stop for failing tests outside its write set; there is no new scope authorization or molecule.
- Read-only reconfirmation: `workedExamples.generated.ts:144` reserves `host-2014-kvant1-XYZ-006` for `XYZ-TRAP-051`; `questions.ts:186` excludes worked examples; `figureOverrides.test.ts:91` requires that same qid in the section pool. The blocking expectation therefore remains. HEAD is unchanged, and `git diff --check` passes. Prior test results above were not rerun.
- Preserve the implementation without further source edits or staging. Escalate the approved scope reconciliation and host-only trap-index verification to the coordinator under the current worker startup protocol. Leave the bead open; no DONE marker or drain acknowledgment while blocked. The existing astra-relay playbook proposal remains available above for forwarding.

- 2026-10-21 resumed with updated design: coordinator resolved the figure-test conflict by adding selection rule (e), skip candidates with `q.figure`. This supersedes the preceding scope-blocked handoff. Keep the existing implementation and write set; no changes to `figureOverrides.test.ts`. Add a red-first generator fixture for a figure candidate followed by a valid text-only candidate and an entry with only a figure candidate; assert the complete manifest has no figure questions. Regenerate and rerun focused tests, typecheck, lint, and full app suite. The known trap-index child-process EPERM remains a coordinator host check.

### Resumed round verification and corpus impact

- Red-first: `pnpm test src/data/workedExamples.test.ts --maxWorkers=2` failed as expected, 2 failures / 2 passes. The new fixture selected figure questions instead of its text-only fallback, and the manifest invariant found `var-2018-1-kvant2-KVA-019` with a figure. Assertions report only identifiers and booleans.
- Generator now filters candidate bank IDs by absence of `q.figure` before applying the existing ordered eligibility rules. Regeneration produced 140 examples. Focused verification including `figureOverrides.test.ts` passed: 9 files / 111 tests (5.43 s), including generator `--check`, picker exceptions, UI, and fading. The pinned repaired question `host-2014-kvant1-XYZ-006` is no longer reserved and its existing test passes unchanged.
- `pnpm lint`: PASS, 578 files checked with the same four pre-existing informational notices. `git diff --check`: PASS. Typecheck and full app tests still running at this checkpoint.

| Section | Complete bank | Worked examples | Remaining section drill pool |
| --- | ---: | ---: | ---: |
| KVA | 540 | 46 | 494 |
| MEK | 540 | 16 | 524 |
| NOG | 324 | 24 | 300 |
| XYZ | 648 | 54 | 590 |

- This table supersedes the earlier 148-example corpus counts. The 140 unique worked examples reserve 3.24% of the 4,320-question bank. No selected question has a figure. With four existing XYZ exclusions, ordinary section pools total 4,176 (previously 4,316 before worked examples). ORD/LÄS/ELF/DTK remain unchanged. Authentic printed passes and direct question links retain their exceptions.

### Final resumed handoff

- 2026-10-21: `pnpm typecheck` PASS. `pnpm lint` PASS (four existing informational notices). Focused tests PASS, 9 files / 111 tests. Full `pnpm test --maxWorkers=2`: 134 files passed / 1 failed; 4,280 tests passed / 1 failed, 4,281 total (141.44 s). The sole failure is the already acknowledged `app/src/lib/trapIndex.test.ts:39` child-process `spawnSync /usr/bin/node EPERM`; coordinator must rerun that check on the host. The previously failing figure-recovery test passes unchanged.
- Source work is complete for the resumed B1 contract. All 21 modified/untracked repository files remain within the admitted write set. No worker package changes. HEAD remains `9e97c5cad2fac4e194db9d57b214b4c7c3d2e5b9`; implementation is uncommitted and independent review remains pending. Staging is left to the coordinator because the index resolves to `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-bz6f.18/index`, outside the sandbox's writable roots. No commit/signing or permission escalation attempted.
- Delivery follows the bead's explicit instruction to leave status and assignee unchanged, post one DONE note, and stop. No bead closure or drain acknowledgment. Coordinator owns host verification, staging, signed delivery, review, and lifecycle disposition. The existing astra-relay playbook proposal above remains available for forwarding; no new playbook gotcha was encountered in this resumed round.

### Round 2 — accepted review fixes (2026-10-21)

- Starting clean at coordinator commit `21e67a883e2da914223ce6426f9a66c02cf92231`; no molecule. Apply the one P2 and seven P3s in the current design, within the unchanged write set. Leave work uncommitted for review and coordinator delivery.
- The framework, weak and synthetic pickers also filter `EXCLUDED_QUESTIONS`. This is correct (broken figures must not enter drills), but was not stated in the original brief.
- Supersedes earlier fallback/fading decisions: signed-in readers see authored fallback only after failure, below the summary. Store distinct completed qids per user/section; legacy counts cannot establish distinct completions and will start at level zero with a new storage key.
- Generator guard will preserve at least one originally drillable question for every affected entry, including entries sharing candidate qids. It will respect the existing exclusion set and the actual picker predicate. Existing entries with no drillable questions cannot be repaired by reservation and remain unchanged.
- Red-first run: 18 failures / 20 passes, including intended affordance, live-step, KVA, fallback/retry and distinct-completion failures. Two test-fixture problems were corrected before repeating: skip non-framework JSON without entries; reset mock implementations/queued responses between tests. The storage and generator fixtures use synthetic IDs; corpus checks report only identifiers/counts.
- Corrected red-first run: 16 intended failures / 22 passes. After implementation, all 38 focused tests passed. Typecheck and lint passed (the same four pre-existing informational notices); full-suite run started with two workers.
- Summary and optional-detail toggles reuse `.trap-card-toggle`; step and retry controls use token-based hairline pills and `.hpc-btn` for focus/press states. KVA uses the existing `KvaPrompt`. A persistent polite list live region announces newly added solution steps. Fading uses distinct qids under the v2 storage key, and the independent-attempt prompt is text above a `Visa steget` button.
- Retry reissues both gated loaders; their existing transport-rejection cache eviction permits a real retry. Authored fallback appears below the summary only on failure. Auth loading is blank, avoiding a temporary signed-out narrative before the signed-in summary.
- Final edge-case red-first run: 2 failures / 18 passes for auth-loading fallback and an initially empty framework drill pool. Corrected both: wait for known auth status before rendering fallback, and skip reservations for initially empty entries as well as any reservation that would empty another entry.
- Generator regeneration retained all 140 existing rows (KVA 46, MEK 16, NOG 24, XYZ 54). The generator now imports the canonical `EXCLUDED_QUESTIONS` for pool eligibility; on Node 22.17 run `NODE_OPTIONS=--max-old-space-size=3072 node --experimental-strip-types scripts/build_worked_examples.mjs --check` (omit `--check` to regenerate). The generator test supplies the same flag. No dependency changes.
- Final focused suite: 4 files / 40 tests PASS (2.08 s), including generator `--check`. First full-suite run: 134 passing files / 1 failing file; 4,296 passes / 1 failure (4,297 total, 116.90 s). Only the acknowledged trap-index `spawnSync /usr/bin/node EPERM` failed. That run predates the two final edge-case fixes, so the full app suite and typecheck/lint are rerunning on the final tree.

### Playbook-proposal — astra-relay (round 2)

- 2026-10-21: A red-first React test failed before consuming a queued `mockRejectedValueOnce`, then an unrelated account-change test failed loading content. Cause: `vi.clearAllMocks()` clears call history but keeps pending one-shot responses. Rule: reset mock implementations/queues with `vi.resetAllMocks()` before reinstalling per-test defaults when red-first tests queue one-shot loader outcomes. Proposal is recorded here for coordinator forwarding because `~/scratch/skill-gotchas/` is outside this managed worker's writable roots; no `/tmp` proposal was created.

### Round 2 final handoff

- Final-tree `pnpm typecheck`: PASS. `pnpm lint`: PASS (578 files, four existing informational notices). `git diff --check`: PASS. Focused verification: 40/40 tests. Final full app suite pending at this checkpoint; worker package untouched, so no worker checks are required.
- HEAD remains `21e67a883e2da914223ce6426f9a66c02cf92231`. Eight repository files changed, all admitted; generated manifest unchanged after regeneration. No signing, commit, push, merge, or independent review. Git index resolves outside writable roots at `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-bz6f.18/index`, so staging is handed to the coordinator without requesting broader permissions.
- Delivery follows the accepted instruction to leave status/assignee unchanged, append one final DONE note and stop. Coordinator owns the host trap-index check, visual/review confirmation, staging, signed delivery and lifecycle disposition. Do not close this bead on sandbox evidence alone.
- Final full `pnpm test --maxWorkers=2`: 134 files PASS / 1 file FAIL; 4,298 tests PASS / 1 FAIL, 4,299 total (114.24 s). The sole failure is the previously acknowledged `app/src/lib/trapIndex.test.ts:39` child-process `spawnSync /usr/bin/node EPERM`. No source-test failures remain; the coordinator must verify that check outside the sandbox. The worked-example generator drift check passes in this full run.
- Round 2 implementation and evidence are complete for coordinator handoff. Independent exact-head cross-vendor re-review is pending after coordinator staging/commit. Existing review HOLD applied to the round-1 head; this worker does not claim it has been cleared. Both worklogs include final results and the astra-relay proposal. No bead closure, status/assignee change or drain acknowledgment under this accepted handoff contract.

WORKED EXAMPLES R2 DONE: hpf-bz6f.18

# Worklog — hpf-qr0p.51.28

## Findings

- 2026-11-10: Started from clean branch at `87d0df4bf93b870de70691bfae565087cf50fbce`; no molecule controls this bead.
- Idag is pre-answer: `useIdagExtras` returns catalogs to `FolioIdag` / `idagView.lessonCopy`. The merged view already avoids headwords, but missing question titles have no numbered trap fallback.
- Öva is pre-answer: `useOvaExtras` returns catalogs to `FolioOva` / `ovaView.suggestion`. The merged view avoids cached answers but does not keep title math together and falls back to a generic lesson label.
- Drill is pre-answer: `DrillSession` resolves `entryHeadword` into `SessionPlayer.idleHeadline`, before starting the first question.
- Classic plan is pre-answer: `useDailyPlan` applies `preAnswerPlan` only when Folio is enabled; classic consumers receive cached/generated answer-bearing headlines and rationales.
- Rail prognosis currently uses only the first-try point estimate. Framsteg uses `computeHonestProjected` with a minimum displayed half-width of 0.1 and bounds 0–2.

## Decisions

- Normalize presentation-only catalog titles through `lessonPlace` in the two admitted hooks; leave original catalogs and post-answer content intact.
- Apply existing safe plan projection in both presentations; keep generation, baseline storage, and PUT behavior unchanged.
- Pass the honest band to the admitted subtitle mapper as an optional second argument. Keep the shared shell contract unchanged.
- Follow bead-specific delivery: leave implementation uncommitted and park for independent review; do not close the work bead.

## Progress

- Inspection complete; regression tests next.
- Red-first focused run: five files, 114 tests; 29 failed and 85 passed. Failures reproduced classic answer text, drill headwords/raw IDs/stale title, Idag numbered fallbacks, Öva math/fallbacks, and rail point estimates. Command: `pnpm test src/hooks/useDailyPlan.test.ts src/folio/data/mappers.test.ts src/folio/screens/idag/FolioIdag.test.tsx src/folio/screens/ova/FolioOva.test.tsx src/routes/-drill.framework.test.tsx --maxWorkers=2` from app/.
- Initial green focused run: all 114 passed. Full app run (`pnpm test --maxWorkers=8`): 6211 passed, 5 failed across 206 files. Two prerequisite assertions pin old rationale strings; two onboarding assertions revealed a post-answer marker that must retain its copy; one trap-index generator check failed with the documented sandbox `spawnSync /usr/bin/node EPERM`. Initial typecheck caught catalog discriminated-union inference and one test optional access; corrected within the admitted files.
- BLOCKED write-set boundary: `app/src/hooks/useDailyPlan.prereqs.test.tsx` lines 376–400 has two classic hook assertions expecting old rationale strings, while the accepted change deliberately presents safe question titles. This file is not admitted. It remains untouched; coordinator must authorize a follow-up/admission for these expectations, preserving prerequisite selection assertions and separate baseline/hint tests. No production exception was added to satisfy obsolete presentation expectations.
- The completed onboarding marker is post-answer (scheduler `onboarding-<date>`, completed and zero minutes); preserve its copy while applying safe titles to pre-answer plan invitations.

## Handoff

- Implementation and verification pending. No commit, publish, or merge authorized for this worker.

## Final verification and handoff — 2026-11-10

- Supersedes the initial pending handoff: all requested implementation changes are present, uncommitted. `HEAD` remains base `87d0df4bf93b870de70691bfae565087cf50fbce` on the assigned branch. Changed only the eleven admitted app files and this worklog.
- `pnpm typecheck`: PASS after preserving catalog/entry discriminated-union pairing in the presentation copies.
- `pnpm lint`: PASS, four existing informational notices in untouched devbake files. Biome checked the final adjusted files with no findings. `git diff --check`: PASS.
- Final targeted run (the five affected test files plus welcome and prerequisite integration): 164 passed, 2 failed, seven files total. All affected-file tests (116) and all welcome tests (21) pass; 27 of 29 prerequisite tests pass. Both remaining failures assert the superseded classic rationale strings in the unadmitted `app/src/hooks/useDailyPlan.prereqs.test.tsx`.
- Full app suite was run once at eight workers: 6211 passed, 5 failed. The two onboarding failures were subsequently fixed and verified by the final targeted run. Remaining full-suite concerns are the two prerequisite expectations and the known sandbox-only trap-index generator `spawnSync EPERM` failure; the coordinator must run that check on the host.
- Staging attempted once and refused: main repository worktree index is read-only (`index.lock`). No commit or signing attempted. Coordinator must stage and produce the signed review head.
- BLOCKED: admit/update the two presentation expectations in `app/src/hooks/useDailyPlan.prereqs.test.tsx` (lines 376–400), then run the full suite on the host and obtain independent Claude review of the exact signed implementation head. Keep the existing prerequisite selection and stored-baseline assertions. Bead is handed back deferred, not closed.
- Gotcha proposal for `gas-city-coordinator`: shared presentation changes must admit integration tests that assert returned copy, distinguish persisted scheduler baselines from safe presentation, and classify completed onboarding markers as post-answer. Attempted the required `/home/loucmane/scratch/skill-gotchas/gas-city-coordinator.md` entry; sandbox policy rejected that path. Proposal retained here for coordinator forwarding.

## Round 2 — 2026-11-10

- Claimed as `ci-wisp-syx71nr`; no molecule attached. Existing round-1 edits retained at base `87d0df4bf93b870de70691bfae565087cf50fbce`.
- Supersedes the earlier prerequisite-test diagnosis: the existing integration expectations are correct and remain unchanged. The projection incorrectly discarded useful, headword-free rationales. Round 2 preserves generated copy and replaces only embedded headwords.
- Inspection: `lessonItem` truncates headwords to 48 characters at a word boundary; `trapDrillItem` includes the full headword in the rationale followed by the miss count. Preserve both surrounding strings and the persisted baseline. Keep the neutral fallback for unavailable catalogs.
- Added regression cases for verbatim prerequisite/weak-section rationales, trap-drill counts and coaching, already-safe cached copy, and truncated generated lesson headlines, with both classic and Folio flags. Updated the round-1 cache fixtures to the actual scheduler shapes rather than invented tldr/recognition-cue rationales.
- Round-2 red: `pnpm test src/hooks/useDailyPlan.test.ts src/hooks/useDailyPlan.prereqs.test.tsx --maxWorkers=2` produced 18 failures / 56 passes. The two unchanged prerequisite expectations reproduced the regression; new cases reproduced lost rationale/count/headline copy.
- Round-2 green: the same command passed all 74 tests after using the existing catalog index for full/truncated headword substitution. `pnpm typecheck`, `pnpm lint` and `git diff --check` pass; lint retains four unrelated informational notices. The prerequisite test file has no diff.
- Additional source finding awaiting coordinator clarification: `useTopTraps.ts:headlineFor` prefers `tldr` over `pattern_description`, and `scheduler.ts:trapDrillItem` embeds that value in its rationale. Real catalogs have different values for those fields. Replacing only `entryHeadword` therefore leaves a tldr answer leak, while round 2 explicitly requires rationales without that headword to remain byte-identical. Asked whether the trap name may include tldr for replacement, preserving the count/coaching suffix. No such extension implemented pending that decision.

## Round-2 verification and handoff — 2026-11-10

- Full app suite: `pnpm test --maxWorkers=8` ran 6,228 tests across 206 files in 77.21 seconds: 6,227 passed, one failed. The only failure is `src/lib/trapIndex.test.ts` attempting the generator child process (`spawnSync /usr/bin/node EPERM`), requiring host verification. All prerequisite, welcome, and affected-screen tests pass.
- No changes to `useDailyPlan.prereqs.test.tsx`. Typecheck and lint pass; all source changes remain within the original admitted write set. No commit, push, or merge. HEAD remains `87d0df4bf93b870de70691bfae565087cf50fbce`.
- BLOCKED on the remaining trap-name contract conflict: approve replacing the tldr-derived name in the trap-drill rationale (plus any composed taxonomy name from `useTopTraps`) while preserving count/coaching text, or explicitly defer that answer leak. This can be addressed inside the admitted hook/test files; no write-set expansion is proposed. The current round-2 implementation does only the requested headword replacement.
- Host must complete the generator/full check, stage the tree if unavailable here, create the signed review head, and obtain independent Claude review. The bead must remain open and be parked for handoff.
- Playbook proposal (`gas-city-coordinator`, 2026-11-10): symptom — a headword-only plan scrub can pass hook tests but retain a trap answer; cause — scheduler trap names come from `useTopTraps.headlineFor` (tldr/composed taxonomy copy), not necessarily `entryHeadword`; rule — trace the actual producer and distinguish answer-bearing name substitution from preserving safe coaching text. Keep fixtures faithful to that producer. The required `~/scratch/skill-gotchas/` destination is outside this session's writable roots (and was refused in round 1); proposal retained here for coordinator forwarding, never in temporary storage.
- Round-2 staging attempted once after verification and refused: the worktree `index.lock` is on a read-only filesystem. All changes remain unstaged/uncommitted. No workaround or signing attempt. Final state is blocked pending the trap-name decision and host checks/staging; defer before drain.
- Final bead readback confirms deferred, unassigned and worker state blocked with round-2 evidence appended. No closure; coordinator escalation and drain follow.

## Round 3 — 2026-11-10

- Claimed the existing bead with the round-3 decision approved; retained all earlier edits. No molecule is attached. The accepted scope now replaces the whole trap name only for scheduler `drill-trap-<framework>-<date>` items, preserving the count/coaching suffix and all other headword-free rationales.
- Confirmed the producer chain: `useTopTraps.headlineFor` prefers tldr and composes taxonomy names with an em dash; `scheduler.trapDrillItem` appends the miss count and coaching text. The presentation must identify the trailing coaching suffix, not split on the first em dash. Generation and persistence remain unchanged.
- Adding red-first coverage for generated, cached and server plans, both UI flags, composed names, numbered fallbacks and baseline preservation. The prerequisite integration test remains untouched.
- Round-3 red: `pnpm test src/hooks/useDailyPlan.test.ts src/hooks/useDailyPlan.prereqs.test.tsx --maxWorkers=2` reproduced 12 failures, with 76 passes. Failures demonstrate tldr leaks in all three plan sources, partially replaced taxonomy names, and missing safe fallback/count copy; all prerequisite tests pass unchanged.
- Round-3 focused green: the same command passes all 88 tests. The projection recognizes scheduler trap-drill IDs and substitutes the complete name, retaining the matched miss-count/coaching suffix verbatim. Tests cover the numbered fallback when titles/catalogs are absent, preserve other drill/lesson rationale text, and verify unchanged local/server baselines and PUT payloads.
- `pnpm typecheck` and `pnpm lint` pass after correcting the new fixtures' optional headline, trend-object and protocol-entry types and formatting. Lint retains four informational findings in untouched devbake files. `git diff --check` passes; `git diff --exit-code -- app/src/hooks/useDailyPlan.prereqs.test.tsx` confirms the prerequisite test is unchanged.
- Running the full app suite once with `pnpm test --maxWorkers=2`, below the eight-worker cap and with no browser/timing check running. Reduced concurrency accommodates shared host load. HEAD is still `87d0df4bf93b870de70691bfae565087cf50fbce`.

## Round-3 verification and handoff — 2026-11-10

- Full app suite: `pnpm test --maxWorkers=2` completed 6,242 tests across 206 files in 193.40 seconds. **6,241 passed; one failed**: `src/lib/trapIndex.test.ts` could not spawn the generator child process (`spawnSync /usr/bin/node EPERM`). The coordinator must rerun this check/full suite outside the sandbox. All affected-screen, prerequisite and welcome tests passed.
- All assigned implementation is present. Round 3 resolves the earlier trap-name decision blocker: both classic and Folio now replace the complete tldr/composed name with the safe question title or numbered fallback, preserving the miss count and coaching suffix. No changes to scheduler generation, persisted baselines or prerequisite tests.
- Git staging was attempted once and refused because `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-qr0p.51.28/index.lock` is on a read-only filesystem. No workaround, commit, signing, push or merge attempted. Changes remain unstaged/uncommitted at base `87d0df4bf93b870de70691bfae565087cf50fbce`, within the admitted write set.
- BLOCKED only on host verification/staging: coordinator must run the generator/full check, stage the reviewed tree, create the signed implementation head and obtain independent Claude review at that exact head. No review verdict exists yet; keep the bead open and park deferred with worker state blocked. No further product or scope decision is needed.
- Playbook proposal refinement (`gas-city-coordinator`, 2026-11-10): symptom — partial trap-name replacement leaves answer-bearing taxonomy instructions; cause — the producer composes names using the same em dash as the scheduler suffix; rule — trace the actual name producer and preserve the anchored trailing miss-count/coaching suffix, covering generated/local/server plans and both presentations. The required scratch proposal directory is outside the writable roots and was refused in round 1; retained here for coordinator forwarding without a permission workaround.

## 2026-11-10 coordinator review and host verification

- Round 2 (coordinator review): part 1 (#507) had replaced EVERY lesson rationale with the question title, losing headword-free "why" lines such as "Grunden först …". Restored: only the headword text is replaced; useDailyPlan.prereqs.test.tsx passes unchanged.
- Round 3 (coordinator decision): the trap-drill rationale's name comes from useTopTraps.headlineFor (tldr or composed copy), so it is replaced whole with the safe title, keeping "— N missar senaste veckan. Fokuserad drill."
- Host: typecheck and lint clean, full app suite 206/206 files, 6242/6242 tests.
- Visual: Idag in 4 modes with seeded data; the rail reads "Prognos 1,2–1,7", matching the Prognos card. 0 side scroll, 0 wide, 0 red, 0 page errors.

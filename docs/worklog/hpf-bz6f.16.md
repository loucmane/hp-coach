# Worklog — hpf-bz6f.16

## Findings

- 2026-10-21: Claimed the accepted round-1 contract in its assigned worktree; initial tree clean. No molecule metadata. Dependencies present in app and worker.
- Session field audit (excluding devbake): `app/src/api/hooks/useSessions.ts` and both `db/schema.ts` files transport/store opaque strings. `worker/src/routes/sessions.ts` validates length and stores/returns the string unchanged; `export.ts` also preserves it. `testReset.ts` writes mock half metadata only.
- `drill.tsx` owns mode encoding, decoding and resume eligibility. `components/session/canAdoptSession.ts` compares the complete string exactly, already preventing reverse adoption once timed markers exist. `SessionPlayer.tsx` forwards the string and displays it as a readable uppercase running head; it does not interpret it as a section code for question selection or scoring.
- `components/home/useResumptionCandidate.ts`, `RecentPassesCard.tsx`, and `routes/historik.tsx` need marker-aware resume URLs/labels. `api/hooks/useAdaptiveReview.ts` uses `lib/adaptiveReview.ts` to recognize only the independent ar marker; timed/word markers correctly remain untreated. `routes/prov.tsx` decodes only mock sessions with its colon-based marker. `repetition.tsx`, `diagnostik.tsx`, and `dev.tsx` write their own mode-specific metadata.
- Stats grouping (`worker/src/routes/me.ts`, app scoring) and mastery (`lib/frameworkProgress.ts`, scheduler) use question/attempt section codes, not the session sections field. `DrillResult.tsx` groups resolved questions by `q.section`. Other matches are unrelated arrays, legal-page content, comments, or tests.

## Decisions

- Keep exact marker matching for adoption; normalize markers only for display and resume URLs. No worker changes or schema migration required.
- Use the existing `/sign-in` route. Keep completed-pass URLs unchanged as allowed by the brief.
- Add red-first coverage before production edits. Run the project commands offline; leave all delivery changes uncommitted.

## Progress

- [S:hpfetcher/codex-1|W:hpf-bz6f.16|H:inspect|E:source audit] Completed the initial sections-consumer audit; production files unchanged.

## Handoff

- Implementation and verification pending.

### 2026-10-21 — WAITING: required test scratch

- Added regression-test drafts in `-drill.timed.test.tsx`, `-drill.words.test.tsx`, `useResumptionCandidate.test.tsx`, `TempoLine.test.tsx`, and new `sessionLabel.test.ts`. They cover marker decoding, timed/untimed isolation in both directions, the actual Home resume href, plain Swedish labels, single UHR mention, word-index drift, and the sign-in link. Replaced the impossible adaptive-review test input with a framework detour.
- Attempted the project `pnpm test` command for those five files with `TMPDIR=/work/hpf-bz6f.16`, `NODE_OPTIONS=--max-old-space-size=3072`, and `--maxWorkers=2`. Exit 1 before Vitest starts: pnpm resolves its temp directory on startup and the designated directory does not exist. This is infrastructure failure, not red-first behavioral evidence; zero tests executed.
- The managed profile permits writes only to the assigned worktree, classified vault, and temporary roots forbidden by the operator for test scratch. `/work/hpf-bz6f.16` and `~/scratch/skill-gotchas/` are outside those writable roots. No permission widening, alternative fixture root, or dependency change attempted.
- [S:hpfetcher/codex-1|W:hpf-bz6f.16|H:verify|E:blocked before Vitest] `git diff --check` passes. App typecheck, lint, and full tests are not run. Production source and public corpus remain unchanged at base HEAD `b31b26a72c95ba9cd0278a4c58fcd960cc530125`.
- Decision required: provision the designated test scratch in the managed worker profile before resuming, or revise the accepted verification contract for host-run checks. The user worker protocol explicitly says a missing prerequisite is a stop. No bead closure, status/assignee change, commit, or drain acknowledgment.
- Resume: establish red-first results, implement the marker/link/label/copy and drift/sign-in changes, add collision detection and tests, then run all required app gates. `sessionLabel.test.ts` deliberately targets the not-yet-created production helper. Draft tests may need formatting before lint.
- Playbook-proposal — gas-city-coordinator, 2026-10-21: pnpm test can fail before Vitest starts when TMPDIR points at a missing `/work/<bead>`; pnpm resolves that directory at startup. Provision the designated scratch directory and its worker write access before routing red-first tasks. Proposal recorded here because the required `~/scratch/skill-gotchas/` destination is outside the managed writable roots.

### 2026-10-21 16:58 CEST — prerequisite recheck

- Managed claim returned this existing assignment. The bead still has no molecule; the accepted round-1 scope is unchanged.
- `/work/hpf-bz6f.16` remains absent. This session's managed writable roots still exclude `/work` and `~/scratch/skill-gotchas/`. Dependencies are present. The missing test prerequisite therefore remains unresolved; no test retry or alternate scratch was attempted.
- [S:hpfetcher/codex-1|W:hpf-bz6f.16|H:recheck|E:read-only prerequisite verification] HEAD remains `b31b26a72c95ba9cd0278a4c58fcd960cc530125`; `git diff --check` passes. Five regression-test drafts remain intact; no production changes, staging, commits, or behavioral test results were added.
- Stopping under the explicit worker missing-prerequisite protocol. Required escalation: provision the designated scratch and managed worker write access, or revise the accepted verification contract for host checks. Do not close or mark delivery complete. The existing playbook proposal above remains available for coordinator intake.

### 2026-10-21 — resumed round 1: regression evidence and implementation

- The accepted resumed design explicitly permits the default temporary directory for project tests. Used `pnpm test <files> --maxWorkers=2` from `app/`; no dependency changes or custom Node/JSDOM harnesses.
- Red first: the original five-file regression run executed 39 tests, with 12 failures and 27 passes, plus the expected unresolved `sessionLabel` suite. Failures reproduced both timed/untimed ORD adoption directions, two timed marker decodes, three Home marker subjects, timed Home resume, the word-mode/timed marker expectation, signed-out link, all-stale word restart, and repeated UHR wording. Partial word-index drift already passed through SessionPlayer's live-plan filter and cursor clamp.
- Additional red evidence: RecentPassesCard's marker labels failed. After extracting the generator's pure `buildOrdWords` entry point without changing grouping behavior, the collision fixture failed because the builder did not throw; exact normalized duplicates passed. Expanded short-difference TempoLine tests failed before its copy change (5 failed, 2 passed).
- Added full timed markers and base-section decoding; mode eligibility still compares the full stored marker. The existing `canAdoptActiveSession` exact comparison prevents reverse adoption without an out-of-scope SessionPlayer change. Home now carries `timed=1` or `words=1`, encodes section/qid, and displays plain Swedish mode labels. Both completed-pass cards/history use the new shared label helper; completed-pass `?done=` links retain their accepted behavior.
- Word rounds decline adoption when no stored qid remains in the current word index; SessionPlayer then starts a fresh round. Partial plans retain the existing safe filter/clamp behavior. The signed-out prompt links to the existing `/sign-in` route.
- TempoLine says `UHR:s tid` once and shows the difference in seconds/minutes with `mer` or `kvar`; exact equality is `i takt`. Presentation remains neutral. The adaptive-review regression now uses a real framework detour.
- The ORD generator rejects distinct normalized headwords that differ only in case, identifying conflicting qids without printing protected headword text. Importing its pure builder cannot regenerate the corpus. `app/public/ord-words.json` is unchanged.
- [S:hpfetcher/codex-1|W:hpf-bz6f.16|H:focused-verify|E:72 tests passed] Six route/component/label files passed 53 tests; timedDrill and ordWords passed 19 tests, including generator `--check` and the collision fixture. App typecheck and lint pass; lint reports four pre-existing informational diagnostics in excluded devbake files. Full app tests are in progress.
- Repeated the sections-consumer search outside devbake. The initial Findings inventory remains complete; the new `sessionLabel.ts` consumer decodes only the two new modes. Worker session routes, exports and schemas preserve the opaque field; stats/mastery use question or attempt section codes. No worker files require changes.
- Playbook-proposal — gas-city-coordinator, 2026-10-21: Vitest in this app could not dynamically import the Node-only generator outside its Vite root, including an absolute file URL. Use `createRequire(import.meta.url)` on the supported Node runtime for a side-effect-free synchronous builder; keep the CLI behind a direct-execution guard. This produced a real red collision assertion and green fixture/corpus tests without changing Vite config. The proposal is retained here because `~/scratch/skill-gotchas/` is outside the managed writable roots.

### 2026-10-21 — verified implementation handoff

- [S:hpfetcher/codex-1|W:hpf-bz6f.16|H:app-gates|E:4219 passing tests, one sandbox refusal] `pnpm typecheck`: exit 0. `pnpm lint`: exit 0, four pre-existing informational devbake diagnostics. `pnpm test --maxWorkers=2`: exit 1; 125 files passed, one file failed; 4,219 tests passed and one failed out of 4,220. The sole failure is `trapIndex.test.ts`'s existing generator subprocess, with `spawnSync /usr/bin/node EPERM`, explicitly anticipated by the resumed design. No behavior failures in the changed scope. Coordinator must rerun this check on the host.
- Generator `--check` passed through `ordWords.test.ts`; the new exported-builder collision/normalization fixtures also pass. Public corpus and all files outside the admitted source write set remain unchanged. Worker gates are not applicable because no worker files changed.
- `git diff --check` passes. Staging was attempted once with only the 17 delivery files, but git could not create the worktree's `index.lock` in the main repository: read-only filesystem. No workaround, commit, signer invocation, or publication was attempted. Changes are unstaged and uncommitted on `codex/hpf-bz6f.16-timed-drills-guard-ord-adoption-keep-timed-on-resume-links-t`, base/HEAD `b31b26a72c95ba9cd0278a4c58fcd960cc530125`.
- Review disposition: implementation self-check complete; independent cross-vendor review is pending at the coordinator's eventual committed head. Remaining delivery steps belong to the coordinator: host generator check, stage/sign, independent review and normal delivery gates. The inherited refresh-during-feedback double-attempt issue remains out of scope.
- Follow the bead-specific delivery contract: append the DONE evidence note, then stop without closing the bead, changing status/assignee, or acknowledging drain before the coordinator parks it. The two worklogs contain the complete regression/consumer audit and the playbook proposal for intake.

# Worklog — hpf-qr0p.49.6

## Findings
- 2026-10-22: Claimed the plain bead; no molecule controls it. Base: `3818dd59c092c18a9b4de1fb104c9edecc92f236`. Worktree initially clean. Accepted round 1 ports hub, conditions and result only; classic MockRunner remains the run.
- The route owns bank, exposure, session and result queries. Flags currently disappear after hand-in; pass their captured snapshot through the existing callback.

## Decisions
- Keep all route hooks above branches, lazy-load both screens, preserve classic exports and branch behavior. Use pure builders and local presentation helpers; only the explicitly allowed drill exports may be reused.
- Retain the actual mode choice, neutral blanks separately from answered mistakes, shared UHR pacing, and result-scoped ephemeral flags.
- Deliver uncommitted within the admitted write set. Coordinator owns staging if sandbox refuses, signed delivery, independent review and real-stack visual checks; owner visual approval remains required before merge.

## Progress
- [S:codex-1|W:hpf-qr0p.49.6|H:inspect|E:contract and source] Read accepted contract, existing route, runner, result, Öva integration, question adapters and prototype.

## Handoff
- Implementation and red-first verification in progress.

## Verification — 2026-10-22
- Red first: the new `provView.test.ts` failed because the builder did not exist; the new runner snapshot test failed because `onSettled` received only the result. The other 30 runner tests passed. After implementation, all 36 tests in those two files passed.
- Keyboard edge case: a new slip test demonstrated that Shift+Enter incorrectly started the pass. The handler now leaves modified Enter alone, and the test also verifies Tab/Shift+Tab focus containment, pending-start dismissal protection, and retry after a failed start.
- Targeted regression command: `pnpm test src/folio/screens/prov src/routes/-prov.folio.test.tsx src/routes/-prov.test.tsx src/components/mock src/lib/mock.test.ts src/lib/mockSheet.test.ts src/lib/mockEvents.test.ts src/api/hooks/useMockResults.test.tsx src/lib/uhrPacing.test.ts src/components/provpass/ProvpassStatusLine.test.tsx --maxWorkers=2` — 14 files, 173 tests passed. The full suite covers the actual status-line test regardless of the targeted path filter.
- `pnpm typecheck` passed. `pnpm lint` passed, with four pre-existing informational notices in prototype files outside this write set. `git diff --check` passed.
- Axe passed for the hub, conditions slip and result with expanded facit. JSDOM cannot measure colour contrast; that rule is disabled in the component checks and belongs to the browser/visual gate.
- Full suite first run: 4,862 passed, two failed out of 4,864. One was the deliberately introduced Shift+Enter regression test while its fix was in progress; its final version passes in the targeted run. The other was the known `trapIndex.test.ts` generator sandbox failure (`spawnSync /usr/bin/node EPERM`). A final full-tree run is in progress.

## Implementation handoff — 2026-10-22
- Added two lazy Folio route screens, the responsive sitting register, conditions dialog, result scoring and UHR pacing, miss/blank separation, in-place facit, P5 disclosure, ephemeral flagged-right list, pattern links, and linked history.
- Only existing-source changes are the accepted route branch and the additive runner flag callback plus its regression test. Classic runner JSX and classic picker/result components remain intact. No worker sources or dependencies changed.
- The allowed drill renderers do not load their own stylesheet. The result includes local facit CSS under `.fa-prov .fa-drill`; it also overrides the existing drill stylesheet's green option tag and side mark so visiting drill first does not introduce colour outside the facit's right letter.
- Browser E2E not run: `app/playwright.config.ts` requires Clerk setup/sign-in plus live worker staging access. The accepted worker scope is offline. Coordinator must run `tests-e2e/prov.spec.ts` with the preview flag off and the real-stack desktop/phone light/dark visual check. Owner visual approval remains required; no merge authorized here.
- No exact implementation commit or independent review exists yet: changes are intentionally uncommitted atop `3818dd59c092c18a9b4de1fb104c9edecc92f236`.

## Playbook-proposal — astra-relay
- 2026-10-22: A port reusing lazy-screen renderers can be unstyled on a direct link, then gain unwanted styles after visiting the original screen. Cause: the renderers do not import their CSS, while that CSS stays loaded after route navigation. Rule: inspect both cold-load and previously-loaded stylesheet cases; supply narrowly scoped local styles and override inherited data decorations explicitly. Proposed here because this managed worker's writable roots omit `~/scratch/skill-gotchas/`; coordinator should append this entry there for the watcher.

## Final verification — 2026-10-22
- [S:codex-1|W:hpf-qr0p.49.6|H:verify|E:final full suite] Final `pnpm test --maxWorkers=2`: 164 files passed, one file failed; 4,863 tests passed, one failed (4,864 total, 173.30 s). The sole failure is the unchanged trap-index generator check's sandbox `spawnSync /usr/bin/node EPERM`. No skips or exclusions were introduced. Foundation, Idag, Öva, Repetera, drill, Provpass and new guards are included in this run.
- Final `pnpm typecheck`: PASS. Final `pnpm lint`: PASS (four existing informational notices only). Final affected regression run: 173/173 tests PASS. No `worker/` source was touched, so worker checks do not apply.
- Acceptance remaining outside this worker: host trap-index generator check, authenticated classic Provpass E2E, real-stack visual check at desktop/phone in light/dark, owner visual OK, independent exact-head review and signed delivery.
- The accepted bead contract explicitly reserves closing/status/assignee changes to the coordinator. Leave the bead open and deliver one DONE note; do not drain an unparked implementation bead.

## Delivery — 2026-10-22
- Staging the 19 admitted files was refused: the linked worktree index under `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-qr0p.49.6/` is read-only in this sandbox. Changes are uncommitted and unstaged; no commit, signer, push, PR, merge or cleanup was attempted.
- Coordinator: stage the admitted files, run the host-only checks above, review and deliver through the approved path. The local source work is complete; no further item was claimed.

FOLIO PROVPASS DONE: hpf-qr0p.49.6

## Round 2 findings and decisions — 2026-10-22
- Claimed the same plain bead for its accepted round 2 contract at clean head `c135c9cf385f7812db170fe22c379eeaf80ce169`. Seven fixes remain within the original admitted write set; no worker changes planned.
- The shell scrim has z-index 38 while the slip has no z-index. Explicit local sibling stacking will keep the slip above its dismissing scrim.
- API inspection: MockRunner posts `sessionId`, `questionId` and `selectedAnswer`; GET sessions/:id/attempts returns these same question/answer names, oldest first. No qid conversion occurs. However, startSession updates the active-session cache; the route can then adopt its own newly started session, fetching an empty attempt list. The shared five-minute query freshness keeps that empty/partial list through a short pass or a recently resumed pass. Prevent self-adoption and refresh attempts when a completed result opens. Missing saved answers must never be labelled blanks.
- Derive unvisited sections from zero dwell plus no correct answers or answered misses in the result breakdown. Use unique seenBefore exposure, raw counts in history, hide zero blanks, reset stale start errors and release the slip guard on an empty start.
- [S:codex-1|W:hpf-qr0p.49.6|H:R2 inspect|E:source trace] Add failing regressions before implementing; run app typecheck, lint, full tests and build. Coordinator retains live-stack visual checks, owner visual OK, independent review, staging and delivery.

## Round 2 implementation and verification — 2026-10-22
- Red-first evidence: affected tests failed on scrim/slip stacking, self-adoption of a newly started session, stale errors on reopen, empty-plan recovery, history score/footnote removal, unique-question exposure, missing-answer wording and unvisited tempo. The two cache regressions were then run alone with corrected table fixtures: both failed to display the last saved letter from a fresh empty/partial resume cache.
- Fixed the conditions slip with local z-indices (scrim 0, slip 1 inside layer 60). Pointer dismiss controls, double-start protection, focus containment and Escape remain covered.
- Mark starting a new session as an adoption decision, and explicitly refresh the completed result's session attempts even when the shared five-minute cache is fresh. Tests use the actual query hook and sheet adapter, the production query-client defaults, and the worker GET response envelope including `correct` and ISO timestamps; the last persisted pick is shown and marked in GradedOptions. A missing persisted answer gets an unavailable message, never an unanswered label.
- `beginRun` reports whether it started a mutation; the slip releases its guard and shows a neutral line for no bank/empty plan. Opening the Folio slip resets the prior mutation error.
- Unvisited section timing derives from zero dwell and no correct/incorrect answers in the stored breakdown. Tests cover desktop/phone, UHR time retained, and zero-time sections that were answered. History keeps raw count/date and half, with no second score or linear-score footnote; exposure uses `seenBefore / presented`; zero blanks are hidden.
- [S:codex-1|W:hpf-qr0p.49.6|H:R2 targeted|E:64 passing tests] `pnpm test src/folio/screens/prov src/routes/-prov.folio.test.tsx src/routes/-prov.test.tsx --maxWorkers=2`: six files, 64 tests passed, including classic route regressions and axe checks. `pnpm typecheck` passed. Final `pnpm lint` passed with the same four pre-existing prototype informational notices. `git diff --check` passed. Full suite and build are running.

## Playbook-proposal — astra-relay (round 2)
- 2026-10-22: A result's facit showed answered questions as blanks after a short pass, despite matching API field names. Cause: starting a session also triggered resume adoption; a fresh empty/partial attempts cache was reused for five minutes, and hook-level mocks hid this. Rule: distinguish own starts from resume adoption and test completed-result hydration with the real query hook, production staleTime and a prefilled resume cache. Proposed here because this managed worker's writable roots exclude `~/scratch/skill-gotchas/`; coordinator should relay this entry there for the watcher.

## Round 2 final verification and handoff — 2026-10-22
- [S:codex-1|W:hpf-qr0p.49.6|H:R2 full suite|E:4877/4878] `pnpm test --maxWorkers=2`: 164 files passed, one failed; 4,877 tests passed, one failed (4,878 total, 157.45 s). Sole failure: unchanged `src/lib/trapIndex.test.ts` generator subprocess gets `spawnSync /usr/bin/node EPERM`. No skips or exclusions. Coordinator must rerun that check on the host.
- `pnpm typecheck`: PASS. `pnpm lint`: PASS (four existing informational prototype notices). `pnpm build`: PASS (3,308 modules transformed, Vite build and PWA generation complete; existing route-test discovery/chunk-size warnings). Affected tests: 64/64 PASS. No worker sources changed, so worker checks do not apply.
- All seven round 2 source fixes are ready for coordinator review. Implementation remains uncommitted atop `c135c9cf385f7812db170fe22c379eeaf80ce169`, within the original admitted write set. The linked Git index at `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-qr0p.49.6` is outside writable roots, so staging is left to the coordinator. No commit, signer, push, PR or merge was attempted.
- Remaining acceptance: host generator check; live-stack desktop/phone light/dark checks and owner visual OK; independent review of the new exact head; delivery. Specifically verify pointer start/dismiss/outside-scrim controls and a short or resumed pass whose final changed answer is shown and marked in facit. Tests exercise the real query hook with API-shaped fixtures; no live API or browser was used in this offline worker.
- Per the accepted round 2 contract, the coordinator parks/closes the bead on the DONE note. Status/assignee are untouched; do not drain this unparked implementation bead.

FOLIO PROVPASS R2 DONE: hpf-qr0p.49.6

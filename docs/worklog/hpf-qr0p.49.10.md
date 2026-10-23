# Worklog — hpf-qr0p.49.10

## Findings

- 2026-10-23: Claimed the assigned bead at base `47d89ad7dbf1db68ca0acf65fc99b5c29d68bdbe`; clean worktree, dependencies present, no molecule. The classic route owns its own flow; `/welcome` is explicitly excluded from Folio.
- The scheduler offers the ten-question diagnostic tomorrow while the account still has no scored practice or due repetitions. Continuing practice can change that, so the Folio done copy must describe this condition honestly.
- The existing `/drill?section=ORD&start=1` selects a normal ten-question ORD round (or resumes an active drill). It does not exclude the onboarding question IDs. A strict guarantee of never repeating any of those questions needs a change outside this bead's write set.

## Decisions

- Preserve the classic component and its tests verbatim; select a separate lazy Folio controller through FolioHostContext.
- Use the existing Folio paper/ink tokens and serif heading/body with sans controls. Focus bar, wrapping setup navigation, and one calm column follow the owner-selected B frame/A body. No swatches or new palette values.
- Freeze the initial applicable setup steps after account queries resolve: four for new accounts, Ordmönster for resume, none for established accounts. Never put questions or results in the step navigation.
- Save preferences on selection, serialize writes, retain failures with retry, and prevent navigation during saves. Clearing the sitting uses the existing nullable prefs API and clears the local exam store after success.

## Progress

- [S:hpfetcher/codex-1|W:hpf-qr0p.49.10|H:inspect|E:source] Read accepted brief, selected design, route, shell focus, preference APIs, calendar, scheduler, and drill picker.

## Handoff

- Implementation in progress. Delivery remains uncommitted. Real-stack visual review (desktop/phone, both themes, zoom/text scaling) and owner visual approval are required before merge.

## Verification and handoff — 2026-10-23

- [S:hpfetcher/codex-1|W:hpf-qr0p.49.10|H:red|E:vitest] Before implementation, the new `/welcome` navigation expectation failed (false instead of true), and the real authenticated root test could not find a Folio shell on `/welcome`. The view-builder test could not resolve the not-yet-created module. Result: two failed assertions, one failed suite, 68 existing assertions passed.
- [S:hpfetcher/codex-1|W:hpf-qr0p.49.10|H:implement|E:source] Added separate lazy Folio welcome and done views, native radio choices with immediate persistence and retries, applicable setup navigation with completion marks, calendar countdown and arithmetic, plain-Swedish o- card, and a bare onboarding SessionPlayer. The classic component body and existing classic welcome tests are unchanged. Removed only `/welcome` from the shell exclusions. FocusBar keeps its default `Avsluta`, supports a welcome label and a hidden terminal exit, and hook cleanup only removes its own focus request.
- [S:hpfetcher/codex-1|W:hpf-qr0p.49.10|H:focused|E:120-pass] Final focused run: `pnpm test src/folio/screens/welcome src/routes/-welcome.test.tsx src/folio/nav.test.ts src/folio/FolioShell.test.tsx --maxWorkers=2` — six files, 120 tests passed. Covers scores 0/1/2/3, incomplete results, account states, live selections/clear/retry, expired target display without a write, setup navigation, route true/false, focus owner handoff under Strict Mode, scheduler diagnostic path, and axe on all setup screens plus done. The SessionPlayer boundary is mocked in these new component tests; the full suite also runs the existing drill/stage tests. Layout, contrast and target geometry need a browser.
- [S:hpfetcher/codex-1|W:hpf-qr0p.49.10|H:full-suite|E:5259-pass-1-sandbox-failure] Required unrestricted `pnpm test` (no maxWorkers) ran once: 180 files passed, one failed; 5,259 tests passed, one failed. The sole failure is `src/lib/trapIndex.test.ts`, generator freshness assertion: `spawnSync /usr/bin/node EPERM`. This is the documented sandbox child-process restriction. All Folio screens/guards and the classic welcome passed. After this run, the small expired-target display fix was covered in the final 120-test run above.
- `pnpm lint` passed (721 files; four pre-existing informational suggestions in dev bake-offs). `pnpm typecheck` passed after the implementation; a final repeat follows the expired-target change. `git diff --check` passed. No worker code or dependencies changed.
- Real-stack visual checks and `tests-e2e/dayzero.spec.ts` were not run. The Playwright configuration requires local servers and Clerk backend access, creates/deletes a test account, and cannot be executed in this offline worker. Coordinator must run the flag-off e2e plus Folio desktop/390px phone, light/dark, 200% zoom and 130% text checks, followed by the owner's visual OK. No merge is authorized by this delivery.
- WAITING: the requested link `/drill?section=ORD&start=1` is wired, but guaranteeing questions never repeat the onboarding set requires an admitted follow-up touching `app/src/lib/drill.ts` (picker), `app/src/routes/drill.tsx` (entry/resume policy), and their regression tests. The existing route can resume an active normal drill, and its random/smart picker does not exclude onboarding IDs. Those files were left unchanged per the exact write set.
- Review disposition: author self-review only; independent exact-head review remains with the coordinator after commit. HEAD remains base `47d89ad7dbf1db68ca0acf65fc99b5c29d68bdbe`; the implementation is an uncommitted working-tree candidate.

### Playbook gotcha proposal

2026-10-23, astra-relay: a shared React shell focus registration can disappear when an earlier owner's cleanup clears a later registration. Retain each request object and clear only when still current; test overlapping owners and Strict Mode/lazy result mounts. Wait for shell state updates when asserting chrome after a lazy heading appears. Saving this proposal to `/home/loucmane/scratch/skill-gotchas/astra-relay.md` was rejected by sandbox approval settings; coordinator should file it there.

### Final worker state

- Final `pnpm typecheck` passed after the expired-target change; final `git diff --check` passed.
- Staging all 19 admitted repository paths was refused: shared worktree metadata cannot create `index.lock` on the read-only filesystem. No staging workaround, commit, signing, remote operation, merge, bead close, or status/assignee change was attempted. Changes remain unstaged in the assigned worktree.
- Coordinator handoff: stage/commit and independent review; run the blocked host checks and visual gate; resolve the strictly-new-question requirement through separately admitted picker/route work. The implementation portion is delivered, while acceptance and closure remain pending.

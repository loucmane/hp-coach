# Worklog — hpf-qr0p.49.9

## Findings

- 2026-10-23: Claimed Konto/Mer contract; no molecule controls sequencing. Base: e67b3e2c1cc60fe12939fcdba466b215e7b91f57. Worktree initially clean; app dependencies present.
- Existing classic route mocks require new data hooks to remain behind the lazy screen boundary. The prototype uses mock actions and permissive deletion confirmation; production requires exact `radera` and real API then Clerk sign-out.

## Decisions

- Preserve classic rendering and helpers. Add lazy branches after the route functions' own hooks; verify that boundary using the TypeScript AST.
- Copy the prototype's imprint layout with scoped Folio tokens, word choices and ink-only controls. No sibling screen or prototype imports.
- Keep the explicitly required lowercase `förhandsvisning` in the Design choice only; omit prototype preview claims from deletion and other content.
- Keep mutations and the deletion once-guard in the mounted screen extras hook so dismissing/reopening the slip cannot send a second request while one is pending. Failed deletion re-arms; sign-out failure after successful deletion must not claim that nothing was deleted.
- Leave source changes uncommitted. Coordinator owns signing, cross-vendor review, real-stack desktop/phone light/dark checks, and owner visual approval before merge. No worker merge.

## Progress

- [S:worker|W:hpf-qr0p.49.9|H:inspect|E:contract, routes, hooks, prototype] Read accepted design and prototype map; verified settings, account endpoints, tokens and route test constraints.

## Handoff

- Implementation and red-first tests in progress.

## 2026-10-23 — Implementation and verification

- Implemented the shared lazy Folio Konto screen for both routes. Mer focuses and scrolls to Övningen and omits account exit/deletion actions. Classic route bodies and helpers retain their behavior; corrected the stale Konto header comment.
- The page reads Clerk identity without a sample fallback, displays the real calendar, saves sitting/selection/coach/theme/palette through synced setters, keeps Design device-local, downloads real exports, and preserves the tools/support/legal destinations and IDs. The CSS uses scoped Folio tokens and ink-only word choices, including disabled states and the deletion action.
- Deletion uses a native modal dialog, exact case-sensitive/untrimmed confirmation, native disabled state, export before the act, no Enter activation, and one in-flight request even across dismissal/reopening. Success runs deletion then Clerk sign-out then farewell. Failed deletion re-arms. A sign-out failure after deletion has its own truthful retry which does not repeat deletion.
- The route isolation guard parses each route function's AST, so hooks in existing helper components below the route do not generate false failures. Guard negative controls cover hooks after/inside the branch and forbidden styling. Screen tests include both entries, every palette/theme/coach choice, failed saves, export failure/retry/download failure, duplicate exports, dialog order/focus/cancellation, exact word/Enter/once behavior, sign-out failure, and axe checks.

### Red-first evidence

- Initial view/guard/route run: 4 failed files, 6 failed / 7 passed assertions. Expected failures were missing Konto source/CSS/view files and absent lazy route branches. The screen test initially failed import collection because FolioKonto did not exist.
- Review found that shell.css:653–656 overrides the prototype's inner scroll pane with document scrolling. Added a regression with a real-shell-like `.fa-main` and visible overflow: it failed because the first implementation called main.scrollTo. Replaced that assumption with native scrollIntoView plus heading focus; the regression now passes.
- JSDOM lacks scrollIntoView/showModal/close; the screen test installs explicit method shims. These shims test wiring and focus-return logic, not browser modal/top-layer behavior.

### Verification

- `app/: pnpm typecheck` — PASS, including final test additions.
- `app/: pnpm lint` — PASS; 705 files checked, four existing informational findings in unrelated devbake files, no fixes made there.
- `app/: pnpm test` — run once with default TMPDIR and without maxWorkers: 176 passed files / 1 failed file, 5,140 passed tests / 1 failed test, 34.33 seconds. Only failure: `src/lib/trapIndex.test.ts`, generator parity check, `spawnSync /usr/bin/node EPERM`. This is the accepted sandbox child-process limitation; no generator/source workaround was applied.
- After the scrolling correction and five additional regression cases: `app/: pnpm test src/folio src/routes/-konto.folio.test.tsx src/routes/-mer.folio.test.tsx src/routes/konto.test.tsx src/routes/mer.test.tsx src/routes/-root-direction-shell.test.ts --maxWorkers=2` — PASS, 40 files / 762 tests, 23.11 seconds. Includes all Folio screens and guards, FolioShell/nav, root routing isolation and classic Konto/Mer.
- Axe: both entries and the open deletion slip passed. Contrast is disabled in JSDOM; browser contrast/layout and native modal behavior remain real-stack checks.
- `git diff --check` — PASS. Only admitted source/test files plus this worklog changed. No worker code or dependencies changed.
- Staging attempted once and refused: shared worktree Git metadata under `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-qr0p.49.9/index.lock` is read-only. No retry, commit, signer, push or merge attempted.
- E2E was not run: the project's Playwright global setup requires Clerk credentials/network and can create a Clerk test user. Those are outside this offline worker contract. Coordinator must run `pnpm test:e2e account.spec.ts home.spec.ts motion-winners.spec.ts` with the flag off, plus the required Folio real-stack visual checks.

### Reviewable source identity

- Branch: `codex/hpf-qr0p.49.9-konto-and-mer-in-folio`.
- HEAD remains the starting commit `e67b3e2c1cc60fe12939fcdba466b215e7b91f57`; implementation is unstaged/uncommitted, so there is no implementation commit SHA yet.
- SHA-256 of the 14 source/test-file manifest: `fcec34b18df0438c63b0a66bc736f534bc5ef66710fc76417f4be084fbf4f6b1`. Manifest construction: sort the two changed routes, two new route tests, and all ten files under `app/src/folio/screens/konto/` by relative path; concatenate lowercase SHA-256(file bytes), two spaces, relative path, newline for each; hash that UTF-8 manifest. Worklogs are excluded.
- [S:worker|W:hpf-qr0p.49.9|H:verify|E:762 focused tests, full suite with one sandbox failure, typecheck/lint PASS] Implementation ready for coordinator review and host verification.

### Playbook-proposal — astra-relay

- 2026-10-23: Folio section jumps can silently do nothing when copied from a prototype map claiming `.fa-main` is the scroll container. Cause: the real shell's later CSS overrides it to `overflow: visible` and scrolls the document. Rule: inspect final shell CSS before porting scroll code; use native scrollIntoView with scroll-margin and explicit heading focus, and test visible-overflow main as well as standalone mounts. Proposal retained here because `~/scratch/skill-gotchas/` is outside this managed worker's writable roots; coordinator can forward it to the permanent playbook queue.

### Handoff update (supersedes the earlier in-progress handoff)

- Implementation complete within the accepted write set; source is unstaged and uncommitted due to the sandbox Git-metadata refusal.
- Coordinator next: stage and sign through the permitted delivery path; rerun the trap-index generator check and browser suite outside the sandbox; review the exact candidate head cross-vendor; inspect desktop and phone in light and dark on a real local stack; obtain owner visual OK before any merge. No auto-merge for this bead.
- Do not treat this worker's source review or JSDOM tests as the required independent exact-head review or visual acceptance. Bead is intentionally not closed or reassigned by the worker; the accepted contract says the coordinator parks it after the DONE note.

FOLIO KONTO DONE: hpf-qr0p.49.9

## 2026-10-23 — Round 2

### Findings and decisions

- Claimed the same bead for its accepted ten-item fix round; no molecule. Clean starting HEAD: `8f409192d3c1f1a66d09674b71c69539935d400f`. The admitted write set is unchanged. The coordinator reports round-1 host checks and independent review passed; round-2 edits need their own verification and review.
- Keep the one Folio context hook in each route; freeze the classic route-body hook inventory from `e67b3e2c1cc60fe12939fcdba466b215e7b91f57`. Move Konto navigation into its lazy extras hook. Preserve the existing Mer navigation helper.
- Remove absent/blank name rows, use a dot-free wrapped index, show every coach description with its option, disable deletion entry during account mutations, and omit the expired masthead count.
- The real shell explicitly makes `.fa-main` overflow visible. Measure the heading's document position and scroll the document to 24px above it, with focus using preventScroll. Unit geometry checks supplement the required coordinator browser check; JSDOM cannot reproduce the reported live clipping.
- Enforce a closed CSS token vocabulary for paint: ink, rule, paper and scrim, with focus colour only in focus-visible ring properties. Replace leaf/menu/pop aliases in this screen with that vocabulary. Typography and spacing tokens remain available for non-paint properties.

### Red-first evidence

- Before product edits: `pnpm test src/folio/screens/konto --maxWorkers=2` — 31 failed / 52 passed across three files. Failures cover absent names, shortcut wording, all coach descriptions, empty calendar masthead, document positioning, dot-free index, busy deletion entry, added hooks before the branch, and non-neutral colour tokens.
- After implementing the guard, before product edits: `pnpm test src/folio/screens/konto/konto.guard.test.ts --maxWorkers=2` — 2 failed / 27 passed. The new guard catches the real extra `useNavigate()` in KontoRoute and the three existing leaf/menu/pop aliases; planted violations pass their detection assertions.
- [S:worker|W:hpf-qr0p.49.9|H:round-2-red|E:31 regression failures and 2 real guard failures] Product corrections and final verification in progress.

### Completed changes

- All ten requested fixes are implemented: optional real-name row; dot-free wrapped section index; document positioning with a 24px heading gap; “vrid figuren”; lazy navigation hook; neutral CSS token allow-list; disabled deletion opener while deletion/sign-out runs; no expired masthead count; every coach blurb visibly and accessibly associated with its word; updated route header comment.
- Classic route helpers remain intact. The route guard checks the entire route body's hook inventory against its recorded classic baseline, including duplicate and namespace-qualified hook calls. Negative controls cover hooks before/inside/after the Folio branch, non-neutral and unknown CSS tokens, mixed selector lists and misuse of focus colour.
- Busy deletion tests cover duplicate clicks, cancellation during the request, disabled reopening, post-delete sign-out, retry after failed deletion, and ordinary sign-out success/failure. The existing once-guard and exact confirmation behavior remain covered.

### Verification

- `app/: pnpm test src/folio/screens/konto src/routes/-konto.folio.test.tsx src/routes/-mer.folio.test.tsx src/routes/konto.test.tsx src/routes/mer.test.tsx --maxWorkers=2` — PASS: 7 files, 99 tests, 5.16 seconds. Includes both entries and deletion-slip axe checks.
- `app/: pnpm test` — default TMPDIR, no maxWorkers override: 176 files passed / 1 failed; 5,171 tests passed / 1 failed; 45.37 seconds. Only failure: the existing trap-index generator subprocess check, `spawnSync /usr/bin/node EPERM`. The coordinator must rerun that check outside the sandbox. No suppression or production workaround applied.
- `app/: pnpm typecheck` — PASS after adding an explicit HTMLElement receiver annotation to the geometry test's mocked method. That final annotation/formatting edit changes no runtime behavior; full-suite runtime evidence above remains applicable.
- `app/: pnpm lint` — PASS: 705 files checked, four existing informational findings in unrelated devbake files, no changes there.
- `app/: pnpm build` — PASS: TypeScript plus Vite, 3,330 modules, Vite stage 9.36 seconds; PWA generated 269 precache entries. Existing warnings name classic route test files and large chunks.
- `git diff --check` — PASS. Eleven source/test files and this worklog changed, all admitted. No worker, dependency, prototype, generated-route, or sibling-screen changes.
- Staging attempted once and refused: `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-qr0p.49.9/index.lock` is on a read-only filesystem. No retry, commit, signer, push or merge. Existing sandbox generator/staging limitations are already covered by astra-relay; no new machine gotcha was discovered in this round.

### Reviewable source identity and handoff

- HEAD remains `8f409192d3c1f1a66d09674b71c69539935d400f`; branch `codex/hpf-qr0p.49.9-konto-and-mer-in-folio`. Round-2 changes are unstaged and uncommitted.
- Final 14-file source/test manifest SHA-256: `0d97e32b17b187d3267d86dd35c6bbc5528c3addc0fee55e8123f2b419c921c1`. Uses the same sorted SHA-256/path manifest construction defined for round 1 above, excluding worklogs.
- [S:worker|W:hpf-qr0p.49.9|H:round-2-verify|E:99 focused tests; 5171 full-suite passes plus one sandbox-blocked check; typecheck/lint/build PASS] Ready for coordinator delivery.
- Coordinator next: stage/sign, rerun the blocked generator check on the host, independently review the new exact head, and check desktop/phone in light/dark on the real local stack. Specifically verify `/mer` keeps Övningen visible after the page settles, the wrapped index has no stray punctuation, coach descriptions remain readable, and the deletion opener remains unavailable during pending flows. JSDOM geometry/focus tests do not replace those visual checks.
- Owner visual OK remains mandatory before merge. Round-1 review does not cover this delta. Per the accepted round-2 contract the worker leaves bead status/assignee unchanged and stops after the DONE note; coordinator parks it. Do not drain an in-progress bead back into the pool.

FOLIO KONTO R2 DONE: hpf-qr0p.49.9

## 2026-10-23 — Round 3 start

### Findings and decisions

- Claimed the accepted two-item round-3 brief; no molecule. Clean HEAD is `96c583af9b4ac6adcb9c87cc1ece635c1815ec44`; same worktree and admitted write set. Leave changes uncommitted for coordinator delivery.
- Mer currently scrolls on mount. Clerk identity and server preferences can change the height above Övningen later. Sitting choices are static in `EXAM_SITTINGS`; the selected sitting is hydrated by the signed-in root from the same preferences query. Wait for identity and initial prefs resolution, then align on the next animation frame after root hydration. Preserve the existing 24px heading scroll margin and document-coordinate alignment.
- Watch for one layout correction over 8px in the first second after landing. Yield to scrolling, wheel/touch, pointer or keyboard input, including input before readiness; cancel pending work on unmount.
- During deletion and post-delete sign-out, disable cancellation and ignore Escape/backdrop dismissal; focus the status line. Restore closing/focus return on failure, including post-delete sign-out failure without allowing deletion to repeat. Success focuses farewell.
- [S:worker|W:hpf-qr0p.49.9|H:round-3-inspect|E:accepted brief, source and loading signals] Regression tests added before product edits; red run next.

### Red-first evidence

- Before product changes, the corrected regression run `app/: pnpm test src/folio/screens/konto/FolioKonto.test.tsx --maxWorkers=2` failed 8 tests and passed 48 (3.71 seconds). Failures covered both readiness orders, late layout shift (actual heading top -45px versus expected 24px), user scrolling during loading, unmount before the scheduled landing, pending dialog cancellation, and post-delete sign-out failure focus return. An earlier run had the same count but one failure came from a mismatched test copy string; the corrected run confirmed the actual body-focus regression.
- The geometry fixture updates document scroll coordinates and dispatches the asynchronous scroll event generated by our own instant jump. It distinguishes a layout change from user scroll, tests the strict >8px threshold, one correction only, the one-second deadline, and wheel/touch/pointer/keyboard cancellation.
- [S:worker|W:hpf-qr0p.49.9|H:round-3-red|E:8 failures / 48 passes] Product fixes then made all 112 focused Konto/Mer and classic route tests pass across seven files (6.30 seconds).

### Completed changes

- Added a lazy preferences-query readiness read alongside Clerk readiness. The selected sitting is hydrated from that query by the app root; alignment waits one animation frame for the passive hydration/store updates. Terminal prefs errors settle onto the local fallback. No route-level hooks changed.
- Retained the existing heading `scroll-margin-top: var(--fa-s6)` (24px) and document-position math. Initial landing focuses Övningen; one later correction changes scroll only, preserving focus. Any user scroll, wheel, touch, pointer or key input cancels automatic navigation, even while data is pending. Unmount cancels the scheduled frame.
- Cancel is natively disabled during delete and sign-out; Escape and backdrop clicks are ignored. The status line is focused and becomes the only enabled tab stop while requests run. Export/retry controls cannot take focus during the mutation. Failed deletion restores normal dismissal; failed sign-out permits reopening only to retry sign-out, with deletion still disarmed. Closing either failure returns focus to the enabled opener. Success focuses farewell.
- Full app run at default parallelism: 176 passed files, one failed file; 5,184 passed tests, one failed test, 47.91 seconds. Only failure is the existing trap-index generator subprocess check (`spawnSync /usr/bin/node EPERM`). No workaround or suppression; coordinator host rerun required.
- Lint passes, checking 705 files with four existing informational findings in unrelated devbake files. Final typecheck/build and handoff evidence follow below.

### Playbook-proposal — astra-relay

- 2026-10-23: A static section-jump geometry test passed while the live heading later moved above the viewport. Cause: scroll ran before Clerk identity and server preference/sitting hydration changed content height. Rule: test delayed content height changes and the asynchronous scroll event from the app's own jump, then verify a bounded correction yields to user input (including input while data is loading). Readiness must come from the query, not the setter-only synced-preferences hook. Proposal retained here for coordinator forwarding because `~/scratch/skill-gotchas/` is outside this managed worker's writable roots.

### Final verification and reviewable source identity

- `app/: pnpm typecheck` — PASS after annotating the scrollTo mock's overloaded argument as `ScrollToOptions | number`.
- `app/: pnpm lint` — PASS, 705 files, four existing informational findings only.
- `app/: pnpm test` — final runtime changes covered at default parallelism: 5,184 PASS, one known sandbox generator failure as detailed above. The 112-test focused run preceded the final status-tabstop assertion; the full run covers that addition.
- `app/: pnpm build` — PASS: TypeScript and Vite; 3,330 modules; Vite stage 8.96 seconds; 269 PWA precache entries. Existing route-test-file and large-chunk warnings remain.
- `git diff --check` — PASS. Four admitted source/test files plus this worklog changed. Existing CSS already supplies the required 24px heading scroll margin, so it needed no edit. No worker code or dependency changes.
- HEAD remains `96c583af9b4ac6adcb9c87cc1ece635c1815ec44` on `codex/hpf-qr0p.49.9-konto-and-mer-in-folio`. Source remains unstaged/uncommitted: the shared worktree Git metadata is read-only and outside the writable roots; the prior rounds already established that restriction, so staging was not retried. No commit, signer, push, merge or browser/network operation attempted.
- SHA-256 of each changed source/test file:
  - `app/src/folio/screens/konto/DeleteSlip.tsx`: `8767cf4848d0eb2f3a5fb7e493ef6c209a3a285f250bdb1c2fa70f4c5c8528c5`
  - `app/src/folio/screens/konto/FolioKonto.test.tsx`: `ae0c406dc8cb516fdac69b4b83898cf1d70e47a231090bfe368e922d4ecd82b7`
  - `app/src/folio/screens/konto/FolioKonto.tsx`: `ce6eec9a1c13e9c859a8e9ccc39e6b8736540fd6ee44529d102870cb4369592b`
  - `app/src/folio/screens/konto/useKontoExtras.ts`: `1e7577b14320f84b8d9800953538a57ee4e48e49371cbcb7f4fff6e1bdbd2399`
- [S:worker|W:hpf-qr0p.49.9|H:round-3-verify|E:5184 app tests PASS; generator sandbox-blocked; typecheck/lint/build PASS] Both requested fixes are ready for coordinator delivery.

### Handoff (supersedes round-3 in-progress state)

- Coordinator next: stage/sign the four-file source/test delta and worklog, rerun the trap-index generator on the host, and obtain independent cross-vendor review at the new exact head. Round-2 PASS does not cover this delta.
- Run the real-stack desktop/phone, light/dark visual checks: confirm Mer lands with 24px breathing room after Clerk/prefs/sitting hydration and yields after student scroll/key input; confirm native modal Tab/Shift+Tab and Escape keep focus on the status during delete/sign-out, and failure dismissal/success farewell restore focus correctly. JSDOM geometry/dialog shims do not establish real browser layout/top-layer behavior.
- Owner visual approval remains mandatory before merge. Forward the playbook proposal above into the astra-relay queue. Per the accepted round-3 contract, leave bead status/assignee unchanged and stop after the final DONE note; coordinator parks it. No worker close or drain that could release unfinished delivery into the pool.

FOLIO KONTO R3 DONE: hpf-qr0p.49.9

## 2026-10-23 — Round 4 start

### Findings and decisions

- Accepted three-item round-4 brief at clean HEAD `97389451c7cd3d085036deb9cc5345bbf6b77f2a`; same worktree/write set, no molecule. Keep changes uncommitted for coordinator delivery.
- Suppress outlines only on programmatically focused section h2 headings. Preserve keyboard control rings and existing screen-reader focus management.
- Handle native dialog close during deletion/sign-out by reopening modally and restoring status focus. Once the request settles, normal closing must unmount the slip, restore opener focus and expose the main failure status so it can reopen.
- Add no-scroll coverage for the Konto entry with both immediately ready and delayed identity/preferences. Use the existing geometry/timer fixture through the full landing/correction interval.
- [S:worker|W:hpf-qr0p.49.9|H:round-4-inspect|E:accepted contract and source] Regression tests added before product changes; red run next.

### Red-first evidence

- Before product changes, `app/: pnpm test src/folio/screens/konto/FolioKonto.test.tsx src/folio/screens/konto/konto.guard.test.ts --maxWorkers=2` produced 4 expected failures and 87 passes (3.85 seconds): missing heading outline suppression, idle native close leaving the slip mounted, and forced native closure during deletion/sign-out leaving it closed. Both new Konto no-scroll cases already pass, protecting existing behavior through delayed hydration.
- The first run also exposed an existing navigation test timing race: it programmatically focused a support link before the Mer landing frame, then awaited user-event keyboard dispatch, allowing the frame to steal focus before Enter. The test now waits for the initial landing as the other Mer tests do. The corrected red run above isolates the four requested defects.
- [S:worker|W:hpf-qr0p.49.9|H:round-4-red|E:4 failures / 87 passes before product edits] Product changes now add the scoped heading rule and native close handler; green verification next.

- Initial implementation passes all 118 focused tests across seven files (4.84 seconds). Review found the app runs in React Strict Mode: effect cleanup closes the dialog before setup reopens it, so the later native close event could dismiss the fresh dialog. A new queued-close regression failed (1 failure / 61 skipped, 1.20 seconds). The handler now ignores close events while the dialog is already open, preserving the reopened instance; actual forced closures still recover modal status focus.

### Playbook proposals — astra-relay

- 2026-10-23: Adding native dialog close handling made a Strict Mode dialog disappear immediately after opening. Cause: effect cleanup calls close, queuing a native event; effect setup reopens the same node before that event arrives. Rule: ignore stale close events when the dialog is already open, and test the asynchronous event under Strict Mode rather than using an open-attribute-only dialog shim.
- 2026-10-23: A keyboard-link test intermittently sent Enter to a heading instead of the programmatically focused link. Cause: the asynchronous initial landing frame ran between direct focus and user-event keyboard dispatch. Rule: await the initial landing before testing subsequent keyboard navigation, or model the real input that cancels landing.
- The requested `~/scratch/skill-gotchas/` queue is outside this session's explicit writable roots (also established in earlier rounds). Proposals are retained here for coordinator forwarding; no forbidden-path write or temporary substitute attempted.

### Verification and reviewable source identity

- All three requested changes are implemented. Non-interactive section headings keep programmatic focus without an outline; interactive controls retain their focus-visible rings. Native deletion/sign-out closures reopen the modal and refocus status; settled failures close/unmount normally and allow reopening. Konto does not scroll on initial load or delayed identity/preferences/sitting hydration.
- `app/: pnpm typecheck` — PASS.
- `app/: pnpm lint` — PASS, 705 files, four existing informational devbake findings only. An initial formatting error in added test tables was corrected before this passing run.
- `app/: pnpm test` with default parallelism and no `--maxWorkers` — 5,191 PASS, one existing trap-index generator check blocked by `spawnSync /usr/bin/node EPERM`; 176 passed files / one failed file, 37.10 seconds. Includes all seven new cases and the corrected navigation test. Coordinator must rerun the generator on the host; no suppression or workaround.
- `git diff --check` — PASS. Four admitted source/test files plus repository worklog changed; no worker/dependency changes. Build result follows below.
- HEAD remains `97389451c7cd3d085036deb9cc5345bbf6b77f2a` on `codex/hpf-qr0p.49.9-konto-and-mer-in-folio`. Changes are unstaged/uncommitted: shared worktree Git metadata is outside the writable roots and read-only (established in prior rounds, no retry). No commit, signer, push or merge attempted.
- SHA-256 of each changed source/test file:
  - `app/src/folio/screens/konto/DeleteSlip.tsx`: `0c360d8c346a9f8ca2367c745fc1a818cb9f8d71ca89d428ccf568cb230731e8`
  - `app/src/folio/screens/konto/FolioKonto.test.tsx`: `96de0c07e0f05f6be8d996dad39eca3b6ac191b6afc72f0e8ac7957feff42626`
  - `app/src/folio/screens/konto/konto.css`: `ff6fce3522219a007167b4f0cf56a7f17c6344c57669f3402757f1dbd6614f6b`
  - `app/src/folio/screens/konto/konto.guard.test.ts`: `257f11c28f0aa4bd1dc4277473ddbeefb0df2d196a0a31da9b1184342ecf6e78`
- [S:worker|W:hpf-qr0p.49.9|H:round-4-verify|E:5191 tests PASS; one sandbox-blocked generator; typecheck/lint PASS] Production build and final handoff next.

### Final handoff (supersedes round-4 in-progress state)

- `app/: pnpm build` — PASS: TypeScript and Vite; 3,330 modules; Vite stage 8.27 seconds; 269 PWA precache entries. Existing route-test-file and large-chunk warnings remain.
- Re-read the bead before delivery: round-4 contract and admitted write set are unchanged. All requested source/test work is complete, uncommitted and unstaged for coordinator delivery. No independent review verdict exists for this delta yet; round-3 PASS does not cover it.
- Coordinator next: stage/sign, rerun the sandbox-blocked trap-index generator check on the host, and obtain fresh independent exact-head review. Validate real Chrome repeated Escape during deletion and sign-out, failure visibility/reopen, Strict Mode opening, and heading/control focus appearance on desktop/phone in light/dark. Unit shims do not prove native top-layer behavior or browser rendering.
- Owner visual approval remains mandatory before merge; no worker merge/publish/close. Forward the astra-relay proposals above into the permanent proposal queue. Per accepted delivery rules, leave bead status/assignee unchanged and stop after the final DONE note; coordinator parks it. Do not drain an in-progress bead back into the pool.
- [S:worker|W:hpf-qr0p.49.9|H:round-4-handoff|E:build/typecheck/lint PASS; 5191 full-suite passes plus one sandbox-blocked check] Ready for coordinator delivery.

FOLIO KONTO R4 DONE: hpf-qr0p.49.9

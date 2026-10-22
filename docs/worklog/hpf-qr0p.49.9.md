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

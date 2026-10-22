# hpf-qr0p.49.8 — Folio Uppslag, slice A

## Scope and decisions

- 2026-10-22: Base `3818dd59c092c18a9b4de1fb104c9edecc92f236`, clean assigned worktree, installed app dependencies. No molecule controls this bead.
- Port the index and section lessons behind FolioHostContext; keep PickerBody, validateSearch, Provteknik and the classic worked-example step reader intact.
- Use a pure view builder for chapter order, entry resolution, read-next behavior, links, reading time and playable examples. Preserve real anchors and native keyboard controls.
- Changes stay uncommitted. Visual approval and cross-vendor review remain delivery gates.

## Verification

- Pending red-first view and isolation checks.

## Handoff

- Round 1 delivered; round 2 verification and current handoff are recorded below. The coordinator owns host browser checks and delivery.

## Implementation and evidence — 2026-10-22

This entry supersedes the initial pending verification/handoff snapshot above.

- The route lazily mounts FolioUppslag only inside FolioHostContext and only outside Provteknik, after all route hooks. PickerBody and validateSearch are unchanged. No new router hooks were added to the route.
- Added the exam-order index, unnumbered Provteknik row, two-part chapter lists, desktop verso/recto and phone entry-first layouts, one open entry/ribbon, read/undo controls, next-unread wrapping, chapter end, example links and conditional practice/repetition links.
- The pure view uses existing framework text and score ranking. Examples exclude WORKED_EXAMPLE_QIDS and EXCLUDED_QUESTIONS, with duplicate ids removed before rendering. Practice is exposed only for a nonempty filtered list. Reading estimates use 200 words/minute.
- The lazy extras hook shares all eight folio-lesson query keys. Entry selection follows valid hash, same-section bookmark, first unread, first. A pending bookmark cannot be overwritten by a premature default selection. Read changes leave the current page open. Arrival and navigation update the hash while preserving router history state and PUT the bookmark after 400 ms.
- J/K and Enter respect native controls, modifiers, dialogs and inert content. Contents and chapter rows remain real links. Focus follows requested entry/chapter-end changes. The route remains the only Escape handler.
- Every article family renders its existing prose with MathText. The classic WorkedExample remains in use with the Folio authored-example fallback. ORD origin is preserved verbatim from the framework. All new CSS is scoped to the Uppslag root and uses ink for controls and structural marks.
- The specifically required chapter-end link retains the exact label “Öva svagaste fällorna”; general suggestion copy is “Förslag”. This is the accepted brief's explicit exception to its broad wording regex. No dates are invented for read marks.

### Red-first evidence

- Before implementation, `pnpm test src/folio/screens/uppslag/uppslagView.test.ts --maxWorkers=2` failed to resolve the absent view module.
- Before implementation, the isolation test had three failures: missing lazy branch, absent CSS, and absent screen files.
- Before implementation, the screen suite failed to resolve FolioUppslag.
- The first implemented run also caught an undefined statistics input to computeSectionScore; the view now scores only supplied section statistics, including zero/one/multiple scored-section coverage.

### Verification results

- Final focused run: `pnpm test src/folio/screens/uppslag --maxWorkers=2` — **3 files, 33 tests passed**. Includes all article families, query cache reuse, hash/bookmark precedence, debounce, read/undo and wrapping, keyboard exclusions, focus, real links, held-out examples, index/loading/error/empty states, route/classic boundaries, CSS/import guards, and axe on index/lesson/chapter end. Axe color contrast is disabled in JSDOM; real-browser visual/contrast review remains required.
- `pnpm typecheck` — **passed**. `pnpm lint` — **passed**, with four existing informational diagnostics in unrelated devbake files. Final scoped Biome check also passed.
- Full app run, before the final seven additional coverage cases and minor focus/footer refinement: `pnpm test --maxWorkers=2` — **162 files passed, 1 failed; 4,865 tests passed, 1 failed**, 177.01 seconds. The sole failure was the existing trapIndex generator parity test: child-process `spawnSync /usr/bin/node EPERM`. This is the sandbox limitation identified in the accepted brief. The final affected screen suite was rerun afterwards as recorded above.
- The full run included the required classic lesson/Provteknik/worked-example/scheduler/drill tests and all existing Folio tests and guards. No worker files changed.
- `git diff --check` passed. All source edits remain within the admitted write set.
- A single staging attempt failed: Git could not create the worktree index lock in the main checkout's read-only Git metadata. No commit, signing, push, merge or dependency changes were attempted.

### Delivery and remaining gates

- HEAD remains **3818dd59c092c18a9b4de1fb104c9edecc92f236** on `codex/hpf-qr0p.49.8-uppslag-in-folio`. The implementation is **uncommitted and unstaged** in this assigned worktree; HEAD alone does not include these edits.
- Host coordinator: stage/review the tree, rerun the denied trap-index generator parity check, and run `dayzero.spec.ts` and `home.spec.ts` with the preview off. Playwright was not invoked here: its global setup calls Clerk and can create a remote test user, conflicting with the accepted offline/no-credential contract. No local-stack screenshots or visual PASS are claimed.
- Required before merge: desktop and phone on a real local stack, light and dark themes, owner's visual OK, independent exact-head cross-vendor review and mechanical gates at the delivery head. No auto-merge for this bead.
- Per the accepted round-1 delivery instruction, the worker does not close or change the bead's status/assignee. The coordinator parks it on the DONE note. No new playbook gotcha was discovered beyond already documented sandbox restrictions.

FOLIO UPPSLAG DONE: hpf-qr0p.49.8

## Round 2 — 2026-10-22

- Starting HEAD: `f85c7730573eec3b97e5090b687f36caf1fae1ff`, clean assigned branch. No molecule. Accepted round-2 scope and write set read from the bead.
- Fix router history with a router-owned arrival replacement and one push per reader action; verify Back/Forward using the real router and browser history in Vitest.
- Observe the shared read query within Uppslag and allow its reconciliation effect to finish before choosing the arrival entry. Keep bookmark failure fallback local to Uppslag with retries disabled. No shared-hook or worker edits.
- Make the desktop recto sticky with independent scrolling; preserve the phone layout. Use neutral chapter-end copy, a stable read-toggle label, and wrapping for long entry titles/headings.
- Delivery stays uncommitted. Real-stack visual checks, owner visual approval, and independent review remain coordinator gates.

### Round-2 red-first evidence

- Before product edits, `pnpm test src/folio/screens/uppslag/FolioUppslag.test.tsx --maxWorkers=2` produced **7 failed, 19 passed**. Failures covered the unstable read-toggle name, forbidden chapter-end copy, missing router arrival normalization, early read-set resolution, four bookmark GET attempts instead of one, and extra history replacements on both arrival variants.
- The isolated real-router replay then reproduced the reported behavior directly: both hashless and explicit-hash arrivals failed the first Back assertion, staying on `NOG-C` instead of restoring `NOG-B`. It uses the actual route component, TanStack browser history and JSDOM history, rather than a mocked navigate-only assertion.
- After the fixes, the focused suite passed **3 files, 39 tests**. It covers contents → J → Back → Back → Forward → Forward, K, the primary next button, chapter rows and return navigation, with exactly one push per action and only one replacement on a hashless arrival. Read tests use the real shared hooks with delayed/cached server data and a failed server request. The bookmark failure test overrides a client configured for three retries and verifies one request. Wording checks cover index, lesson and chapter end; axe covers those three states too.
- `pnpm typecheck` passed after correcting the generic router mock typing; `pnpm lint` passed with the same four unrelated informational diagnostics. CSS isolation and `git diff --check` pass. Full suite and production build results are recorded in the delivery entry below.

### Playbook-proposal — astra-relay

- 2026-10-22 — Symptom: mocked navigation tests passed while browser Back lost lesson entries. Cause: a direct `history.replaceState` effect raced TanStack's queued push and rewrote the preceding entry. Rule: use the real router plus browser history for a navigation regression, assert the displayed entry and URL through Back/Forward, and count push/replacement operations. Keep arrival normalization router-owned. The proposal is retained here for coordinator transfer because `~/scratch/skill-gotchas/` is outside this managed worker's writable roots.

### Round-2 delivery — 2026-10-22

- All seven requested fixes are implemented. This entry supersedes the earlier round-1 history, wording exception and implementation-in-progress descriptions: history now uses only router navigation; chapter-end copy is “Öva dina vanligaste fällor”; server reads settle before entry selection/bookmark PUT; bookmark GET does not retry; the toggle keeps the name “Läst” with `aria-pressed`; long titles/headings wrap; desktop recto is sticky at 56px with viewport-bounded scrolling. Phone layout is unchanged.
- Final focused run after the test-mock typing adjustment: `pnpm test src/folio/screens/uppslag --maxWorkers=2 --reporter=dot` — **3 files, 39 passed**, 5.42 seconds.
- Full app suite: `pnpm test --maxWorkers=2 --reporter=dot` — **162 files passed, 1 failed; 4,878 tests passed, 1 failed**, 159.82 seconds. The only failure is the existing `src/lib/trapIndex.test.ts` generator parity subprocess, refused with `spawnSync /usr/bin/node EPERM`. No attempt to bypass the sandbox; coordinator must rerun it on the host. All six added regression cases passed in this run.
- `pnpm typecheck` — **passed**. `pnpm lint` — **passed**, four pre-existing informational notices only. `pnpm build` — **passed**, including PWA generation; existing route-test discovery and chunk-size warnings remain. `git diff --check` — **passed**. No worker or dependency changes.
- Delivery HEAD remains `f85c7730573eec3b97e5090b687f36caf1fae1ff` on `codex/hpf-qr0p.49.8-uppslag-in-folio`. Round-2 edits are **uncommitted and unstaged**; all eight changed repository files are admitted. The Git worktree index is outside the writable roots; the round-1 staging refusal is already documented, and no staging/signing workaround was attempted.
- Coordinator next: stage and commit the reviewed tree, rerun the denied generator check, obtain independent Claude review at the exact delivery head, repeat desktop/phone light/dark real-stack checks (including long XYZ contents scrolling, Back/Forward, phone long-word wrapping and read-toggle state), and obtain the owner's visual OK before merge. No browser/visual PASS is claimed by this worker; authenticated E2E remains a host check as documented above.
- Bead status and assignee remain unchanged under the accepted delivery contract. The coordinator parks the bead after the DONE note. Playbook proposal is recorded above for transfer to `astra-relay`.

FOLIO UPPSLAG R2 DONE: hpf-qr0p.49.8

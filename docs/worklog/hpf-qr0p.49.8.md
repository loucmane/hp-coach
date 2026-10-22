# hpf-qr0p.49.8 — Folio Uppslag, slice A

## Scope and decisions

- 2026-10-22: Base `3818dd59c092c18a9b4de1fb104c9edecc92f236`, clean assigned worktree, installed app dependencies. No molecule controls this bead.
- Port the index and section lessons behind FolioHostContext; keep PickerBody, validateSearch, Provteknik and the classic worked-example step reader intact.
- Use a pure view builder for chapter order, entry resolution, read-next behavior, links, reading time and playable examples. Preserve real anchors and native keyboard controls.
- Changes stay uncommitted. Visual approval and cross-vendor review remain delivery gates.

## Verification

- Pending red-first view and isolation checks.

## Handoff

- Implementation in progress. The coordinator owns host browser checks and delivery.

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

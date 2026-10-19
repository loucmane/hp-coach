# Worklog — hpf-qr0p.18

## Findings

- 2026-10-19: Claimed batch 1 at base `5953117d354c54c3b1174f61c2fe8ff3302b9aaf`, clean tree. No molecule controls this bead. Read kit v2, the Lager B0 spec sections 5–8, the round-1 brief and existing implementation. Shared kit and spec remain read-only.

## Decisions

- Preserve the existing OKLCH materials, Newsreader reading face, system/Inter UI, restrained Fraunces headings, floating dock and recessed answer well. The signature remains a raised task sheet beside a quieter source sheet, with sharp feedback return strips. Hubs stack at phone width; quantitative source and answer sheets collapse below 1120px.
- All learner data and side effects use the shared context and drill controller. New copy is proposed Swedish UI copy, not approved product policy. Optional values are omitted when unavailable.
- Delivery follows the bead-specific contract: uncommitted changes, evidence, then deferred and drained; coordinator owns commits, screenshots and independent review.

## Progress

- [S:codex-2|W:hpf-qr0p.18|H:inspect|E:base-5953117] Scope and existing materials inspected before edits.

## Spec gaps

- Sections 5 and 8: kit v2 has no loading/error state, repetition-specific resume identity, save acknowledgement, queue mutation result or historical replay action. Do not invent these states or claim saved/cleared queues.
- Sections 6 and 7: the controller is synchronous and has no grading/save-error surface. Figure load/error is handled locally; authored table transcription, source caption and same-page position are not separate fields. Group position may be derived only from identical supplied figure sources.
- Section 8: the selected repetition questions and origin are supplied by the host action boundary; the hub must not choose or reorder the actual session.
- Shared rules: production theme supports light/dark only. Preserve the existing one-time System appearance choice in the round-1 menu; do not claim a saved System preference.

## Handoff

- Implementation and verification pending.

## Delivered implementation — 2026-10-19

- **5 · Öva:** one raised resume/recommendation/mixed-practice sheet, a lower eight-section directory in stable verbal/quant order, scores and waiting counts, an explicit weakest marker, a repetition door distinguishing due-now from today's pile, and framework-based trap practice. All actions go through the context. The phone order is start, repetition, mixed practice, sections, traps.
- **6 · Kvantfråga:** detached setup and answer sheets, 30px stagger and 48px field gap on wide layouts; one scrolling opaque sheet below 1120px. Actual XYZ options, separately labeled KVA quantities, numbered NOG statements, intact-prompt parsing fallback, MathText throughout options and feedback, and shared Lager option wells, answer pair, explanation, tiered steps and distractors. Controller owns grades and progression; completion counts actual results.
- **7 · DTK:** original figure with supplied alt text/aspect, same-source position derived from matching sources, separate task sheet and explicit phone peek/open controls. Opaque native-dialog viewer supports fit, zoom, rotation and keyboard scrolling, retains scale/position on reopen, suspends answer shortcuts, and returns focus. Missing source and image error block pointer/keyboard grading; failed image can be retried. Printed colors are retained in dark mode. Arrow events inside the viewer cannot reach the bake-off switcher.
- **8 · Repetera:** raised bounded start sheet (maximum ten), due-now/pile distinction, per-section eligible counts, due items ahead of later items while preserving order within both groups, question/trap previews, and a navigable empty state without an empty replay action. Host chooses the actual replay questions.
- **1–4 migration:** removed all direct fixture and `useDrill` imports from implementation. Home, account plan, dock count, reading title/passage/copy, framework labels and clock now come from `useDirectionData`; reading uses `useDrillCore` with the supplied controller and switcher synchronization. Original materials/layout remain. Optional projections, pause/device/time estimates, missing explanation, and absent resume are handled without fabricated values. Week-day marks now derive from supplied daily activity instead of the old hard-coded Friday pattern. Removed unsupported “saved” claims. Retained one-time System appearance behavior without introducing a saved System preference.
- Root remembers hub scroll positions across practice; new question/verdict and hub transitions receive focus. Digits remain available to the switcher, A–E select only existing options, Shift+letter strikes, Enter/Space advance, and Escape never exits practice.
- New learner copy is proposed. It includes the practice/repetition headings, cold/empty states, figure failure/retry labels, completion text and unavailable-explanation message. The supplied approved ÖVNINGSTEXT copy is unchanged.

## Verification — final source tree

- Exact base/HEAD remains `5953117d354c54c3b1174f61c2fe8ff3302b9aaf`. Changes are **uncommitted and unstaged** on `codex/hpf-qr0p.18-redesign-round-2-direction-d-lager-batch-1-va-kvantfr-ga-dtk`.
- Red first: the declared eight-screen contract against the original implementation gave **16 failed / 38 passed**. After implementation, the shared contract gave **54/54 passed**.
- Final direction suite: **65/65 passed**, including Home data replacement/absent optionals, plan routing, cold practice, due/pile distinction, empty/bounded/ordered repetition, reading-controller migration, missing explanation, keyboard lifecycle, malformed KVA fallback, absent session, required-figure failure/recovery, missing figure, viewer transforms/shortcut isolation/focus restoration.
- `pnpm typecheck`: **PASS**, exit 0.
- `pnpm lint`: **PASS**, exit 0; zero errors/warnings, four existing informational findings in unrelated landing/l12 files.
- Final `pnpm test`: **1,610 passed / 1 failed, 106 files**. The only failure is `app/src/components/devbake/redesign/Redesign2026Bakeoff.test.tsx:163`, whose screen-7 “Om” expectation says no direction has built it. Actual text is correctly “Byggd i Lager.” This shared test is outside the exact write set and remains unchanged. Coordinator should make that assertion derive its expected builders from the registry so parallel direction batches do not keep invalidating it.
- `git diff --check`: **PASS**. Source mutations remain in the ten admitted repository files; classified worklog also maintained. No shared kit/spec/dependency modifications.
- Browser attempt: `pnpm dev --host 127.0.0.1 --port 5186 --strictPort` refused listening with **EPERM**. No browser screenshots, pixel-contrast measurements or visual accessibility sign-off claimed. Host must cover desktop/phone, light/dark, 320px/enlarged text, text-spacing, zoom-dialog focus trap/background inertness, image failure, and reduced-motion/transparency. jsdom dialog stubs verify lifecycle only.
- [S:codex-2|W:hpf-qr0p.18|H:verify|E:65-direction-1610-app] Scoped implementation checks pass; one coordinator-owned stale registry assertion and browser verification remain.

## Spec gaps — additions

- Sections 5/8: kit bake-off `startDrill({ kind: 'repetition' })` selects its quant preview; it does not supply a repetition-specific queue session. Lager calls the accepted action and renders the supplied session, without inventing attempt writes or queue resolution.
- Sections 6/7: persisted session/origin state remains the host/controller's responsibility. Local hub scroll restoration works while this direction remains mounted; leaving for an undeclared screen unmounts it by the shared stage contract.
- Section 7: an authored accessible table/transcription is not supplied. The implementation uses the supplied figure alt; equivalent nonvisual chart access remains a content/integration dependency.

## Playbook proposal — gas-city-coordinator

- 2026-10-19 · Symptom: declaring Lager screen 7 made the full app suite fail despite passing the direction contract. Cause: the shared bake-off test hard-codes that no direction has built DTK, while parallel workers may edit only their own direction. Rule/fix: reserve a coordinator-owned shared-test integration change and derive the expected builders from the live direction registry. Proposal recorded here because `~/scratch/skill-gotchas/` is outside this managed worker's writable roots (the astra-relay playbook documents this fallback).

## Handoff — implementation ready for coordinator review

- Supersedes the initial pending entry: source implementation is complete within the admitted scope; no commit, push, PR, merge or bead close was attempted. Independent cross-vendor review is **pending** and cannot be bound to an implementation commit until the coordinator creates it.
- Coordinator next: update the out-of-scope shared screen-7 assertion, run the host visual/accessibility pass, inspect the noted kit gaps, then deliver/review the resulting exact head. The bead is to be parked deferred before runtime drain; this is not a closure or merge approval.

- Delivery note recorded and readback confirmed **DEFERRED**, no assignee. Runtime drain follows; no further work claim.

LAGER1 DONE: hpf-qr0p.18

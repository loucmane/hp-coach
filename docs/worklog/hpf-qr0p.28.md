---
bead: "hpf-qr0p.28"
project: "hpfetcher"
session: "ci-wisp-iuyau3w"
status: "implemented_uncommitted"
---

# Worklog — hpf-qr0p.28

## Findings

- 2026-10-20: Claimed the assigned bead; no molecule. Clean base `d95d4385464e5a01d4f539ac0564fd092a69105e`. Read kit v2, Raster B0 sections 9–11, round-1 brief, existing Raster implementation and prior worklog. Shared kit and spec remain read-only.

## Decisions

- Retain scoped paper/ink/signal tokens, Archivo UI and narrow numerals, IBM Plex Serif reading, flat ruled registers and 7/5 layout. One yellow action per active view. Running pass has independent mutable answers without grading, hidden navigation, guarded start/submit/abort and an anchored countdown.
- Screen 10 uses actual presented/answered/correct counts, explicit score provenance and pacing rows. Screen 11 separates pooled weekly accuracy from prognosis, preserves missing weeks and keeps history inside Framsteg.
- All new Swedish UI copy is proposed; approved context copy and exam text remain verbatim. All data and navigation use the provider. No direct fixture imports, dependencies or shared edits.

## Progress

- [S:ci-wisp-iuyau3w|W:hpf-qr0p.28|H:inspect|E:clean base and accepted scope verified] Beginning red-first screen contract checks.

## Spec gaps

- §9: kit v2 has no answer/flag mutation, abort/void action, session-start timestamp, persisted resume status, generated-mode selector, settlement status or safe retry. Local answer/flag state supports the prototype; actions receive only their declared arguments. Do not claim persisted answers or confirmed settlement. Nonmatching requested pass waits for matching provider content instead of using the wrong pass.
- §10: history summaries do not carry score provenance, missing-source count or nullable timing. Use actual denominators and supplied values, without inventing unavailable facts or a combined score.
- §11: no saved drill/repetition detail action or section-to-lesson mapping; retain complete history rows and explain unavailable detail rather than start new work under an “open result” label. Day section splits are absent. Weekly values are pooled accuracy, not the prognosis series.
- §§9–11: no query-loading/error/retry state in the view model. Empty data and missing optional fields can render honestly; provider/network states cannot be simulated.

## Handoff

- Implementation in progress. Leave changes uncommitted and unstaged. Coordinator owns host screenshots, independent Claude review, delivery and closure. Finish with one DONE note, park deferred, confirm, then drain.

## Implementation and verification — 2026-10-20

- **Screen 9 — Provpass:** `RasterProvpass.tsx:18` renders both halves, the least-seen recommendation, actual available counts/exposure, the pass register, rules and saved results. A native confirmation dialog names the selected identity and waits before calling `startProvpass`. If the provider does not supply that pass, show an unavailable state instead of displaying another pass under its name. Removing a pass during confirmation disables start.
- **Running pass:** `RasterProvpass.tsx:399` owns local mutable choices without calling the grading controller or showing correctness. It restores supplied answers/current position, offers previous/next, flags only if supported, an answered/current register and an unanswered filter. Phone uses the register dialog. Start/submit/abort gates have `rd-confirm`, actual unanswered counts, focus restoration and Escape cancellation. Normal navigation/account disappear while active, including their phone spacing allowance.
- **Timing and keys:** `RasterProvpass.tsx:429` captures the local deadline once and also respects the provider countdown. Zero submits exactly once, even after repeated provider rerenders or while a gate, overview or figure viewer is open; these overlays close for settlement. A synchronous submission exception retains the answer sheet without offering an unsupported retry. Digits 0–8 and left/right are prevented in capture regardless of focus; scroll regions explicitly scroll and never change the question or host screen. Letter shortcuts use the actual options; native button Enter/Space remains native. No per-second live announcement.
- **Required content:** `RasterProvpass.tsx:212` tracks every mounted image separately, reconciles cached readiness, unregisters unmounted instances and supports actual reload attempts. A shared inline figure survives consecutive questions; newly mounted option images must become ready themselves even with duplicate/reused URLs. The optional enlarged image does not participate in the answer gate. Missing DTK figures, loading/failed/retrying images block choice recording and keyboard advance; explicit question navigation remains usable. Reading preserves actual language/disclosure and starts at the top for new passage content. Math/KVA/NOG use the existing renderers/parsers with fallback text.
- **Screen 10 — Result:** `RasterProvpass.tsx:864` uses a single condensed raw-score numerator, actual denominator/unanswered count, saved exposure and a separate derived-score explanation. Official-derived copy explicitly explains the 80-question table scaling and that this is not an official pass score; linear copy is labelled indicative. The pacing table preserves section/time/budget relations and writes over-budget status in words. Comparable history uses the saved identity; Till Öva calls `actions.go('ova')`.
- **Screen 11 — Framsteg/Historik:** `RasterFramsteg.tsx:99` presents the prognosis/caveat, optional range/goal, halves, supplied focus practice, all section scores/uncertainty/underlying counts, rhythm, repetition and day history. The monochrome weekly plot is explicitly pooled weekly accuracy on 0–2,0, not prognosis; missing weeks break lines and a keyboard-readable table exposes all values. Attendance has a date/count disclosure instead of 84 tiny tab stops. Historik remains a child of Framsteg and handles missing or shrinking data without stale indices. No saved-result action is invented.
- **Identity:** `raster.css:433` extends Raster's continuous white/charcoal ruled sheet, Archivo UI and condensed quantities, IBM Plex Serif passages and one yellow primary. Responsive 7/5 sections stack, targets remain at least 44 px, phone content clears safe areas, and new controls inherit the existing reduced-motion/focus treatment. `Raster.tsx` wires destinations and `meta.ts` declares 1–11; earlier screens remain intact.
- **Red first:** declaring screens 9–11 before implementation produced **6 failures / 103 passes**. The expiry-with-viewer regression separately failed before controlling the viewer from the runner; it passes after the fix.
- **Final required checks:** app `pnpm typecheck` PASS; `pnpm lint` PASS (four existing informational messages outside Raster); `pnpm test` **108 files / 2,429 tests PASS**, including **135 Raster tests**. `git diff --check` PASS. No shared-test correction is required at this base.
- **Behavioral evidence:** both widths cover mandatory start/submit/abort gates, mutable choices without grading, optional flags, unanswered filtering, shrinking decks/new sitting reset, result action identity and sparse progress/history. Timer/provider/image edge cases and real `Redesign2026Bakeoff` keyboard containment (window, buttons, register and enlarged pan region) pass. jsdom simulates image loading and native-dialog availability; it does not prove browser layout or native focus containment.
- **Browser limitation:** `pnpm dev --host 127.0.0.1 --port 5178 --strictPort` failed with `listen EPERM`. No screenshots, 200% zoom/text-spacing, computed contrast/layout, touch pan or native-modal browser QA is claimed. Coordinator must run the requested screenshot and accessibility pass for screens 9–11 and their running/dialog states, desktop/phone, light/dark, outside the sandbox. No permission widening or ad-hoc Node/JSDOM harness was attempted.

## Additional spec gaps

- §9: `startProvpass(id)` in the current bake-off only selects screen 9; it does not replace the fixed `running` fixture. The direction guards the requested ID. Only the supplied running pass can currently demonstrate the runner. The provider also lacks a run/sitting instance ID distinct from pass ID; the runner resets on supplied pass ID plus sitting label, but repeat sittings of exactly the same identity need a future provider key.
- §9: `submitProvpass()` has no answer payload or asynchronous settlement contract; local choices cannot be persisted or used to calculate the fixed result fixture by this direction. Abandonment returns to the hub and discards local edits, but actual persisted voiding requires a future provider action. These are prototype capability boundaries, not completed production behavior.
- §11: a prognosis goal is shown as text beside the prognosis; it is not drawn as a target on the pooled weekly-accuracy series, which measures a different quantity. Saved drill/repetition details remain unavailable, with a truthful disclosure on their history rows.

## Playbook proposals — 2026-10-20

- **gas-city-coordinator:** a kit-v2 pass selection can silently show the wrong exam because the bake-off's `startProvpass(id)` only changes the screen and retains one fixed running fixture. Brief directions to gate the runner on the requested pass ID matching provider content and record missing fixture switching as a shared-kit gap; never relabel the fixed questions as the selected pass.
- **astra-relay:** keyboard tests that navigate questions can retain detached answer-button references. Events dispatched to those nodes never reach the window capture listener and falsely report an uncanceled shortcut. Re-query the mounted target after each navigation before asserting real-host shortcut prevention.
- The proposals are retained in both worklogs because `~/scratch/skill-gotchas/` is outside this managed worker's actual writable roots. This uses the worklog fallback documented in the astra-relay playbook; the coordinator should relay them to the permanent playbooks.

## Delivery handoff — 2026-10-20

- HEAD remains `d95d4385464e5a01d4f539ac0564fd092a69105e`. Changes are uncommitted and unstaged, confined to seven allowed Raster files and this repository worklog. No shared files, signing, commit, remotes or dependency changes.
- Source/test/CSS snapshot SHA-256: `90b08dc9e1aceaaea4c6b5bd46ecc7639e885800e2cc0a031e1b20ca5a14fcaa`. Reproduce by sorting the basenames `Raster.tsx`, `RasterParts.tsx`, `RasterProvpass.tsx`, `RasterFramsteg.tsx`, `Raster.test.tsx`, `meta.ts`, `raster.css`, then hashing basename + NUL + bytes + NUL for each.
- Independent cross-vendor review has not run. Coordinator owns browser checks, provider-gap disposition before real-app integration, independent Claude review, delivery and closure. This worker parks deferred, without closing the bead.
- [S:ci-wisp-iuyau3w|W:hpf-qr0p.28|H:handoff|E:2429 app tests pass; 135 Raster tests; typecheck/lint/diff check pass] Raster batch 2 is ready for coordinator visual review and delivery.

RASTER2 DONE: hpf-qr0p.28

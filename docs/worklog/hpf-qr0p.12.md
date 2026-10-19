# Worklog — hpf-qr0p.12

## Findings

- 2026-10-19: Claimed Instrument batch 1 in its assigned worktree, clean at baseline `5953117d354c54c3b1174f61c2fe8ff3302b9aaf`. No molecule controls this bead. Kit v2 and the B0 direction spec are present.
- Existing screens import round-1 fixtures directly; the reading layout has reusable answer, explanation and phone-sheet components. Preserve its composition while supplying data and grading through the context.

## Decisions

- Retain the existing Instrument tokens, Geist/Geist Mono/Atkinson roles, ruled inset panels and square keys. Öva is a two-column section directory on desktop and a stacked directory on phone. Repetera is a bounded queue readout. Quant uses condition/quantity/statement cells; DTK keeps its original source in a docked viewer.
- Keep every implementation edit within the accepted exact write set. Leave changes uncommitted; park deferred after evidence, then drain. The coordinator owns independent review and delivery.
- New Swedish UI copy in this batch is proposed copy, including empty/unavailable messages, queue headings, figure utilities and quant completion wording.

## Spec gaps

- B0 common contract and screens 5/8: kit v2 has no loading/error/freshness or persistence receipts for queue/stats, no per-section content-availability flags, and no review-pruning receipt. Do not invent these states or claim cloud saving.
- B0 screen 7: the figure supplies an asset and alt text, not a structured table alternative, caption or mapped row/axis explanation anchors. Preserve the source and supplied alternative; do not invent data.
- B0 common theme contract: production supports only light/dark. Preserve round-1's local follow-system toggle without claiming a persisted System preference.

## Progress

- 2026-10-19: Read accepted kit/spec, existing screens and prior worklog. Starting with the shared eight-screen contract before implementation.

## Handoff

- Implementation and checks in progress.

## Progress — implementation and verification, 2026-10-19

- Screen 5, Öva: retained the grey frame and inset panel; built a ruled Verbal/Kvantitativ directory with all eight sections, scores, waiting counts and the supplied weakest marker. One lead action chooses the actual resume, evidenced weakest section, or mixed drill. Neutral doors open Repetera, mixed practice and framework-specific trap practice through context actions.
- Screen 6, Kvantfråga: two inset work panels on desktop, one scrolling panel on phone. KVA conditions and quantities and NOG statements use their source parsers with intact-text fallbacks. MathText renders prompts, options, summaries, techniques, pitfalls and steps. Feedback reuses Instrument's chosen distractor → technique/pitfall → solution → essential/detail steps → other distractors sequence. Actual controller results drive verdicts; missing explanations still permit advancing.
- Screen 7, DTK: original image and alt text in a docked viewer; fit, zoom, rotation and native modal expansion, with Escape/close and focus restoration. The phone retains the source-first peek/open/full sheet and auto-opens a prompt too tall for the peek. Figure state remains through related questions; group position is derived from the session. Missing/loading/failed required figures and unloaded/failed option images block grading. Main-source retry is explicit. Source rasters remain opaque and un-inverted in dark mode. Rotation fits the swapped aspect ratio.
- Screen 8, Repetera: ready items first, then the remaining pile, preserving order within each group; section, math-capable prompt preview, supplied trap and due label. One repetition start uses the supplied batch size capped at ten. An empty/not-yet-due queue offers Öva without claiming that the entire pile is resolved.
- Screens 1–4: all application data, copy and framework names come from `useDirectionData`; reading state uses `useDrillCore` and the supplied controller. Preserved the existing frame, reading panels, sheet, feedback hierarchy and display-screen synchronization. Absent resume, plan, traps, projection range/series, weekly goal and timer render without invented fixture values. Removed unsupported saved-state claims. Navigation/account/plan actions now reach the provider; the existing local System-following toggle remains a light/dark display behavior.
- Interaction: A–last-option selects, Shift+letter strikes, Enter/Space locks or advances, F focuses, X toggles feedback; digits remain with the switcher and Escape does not leave a drill. Native modal expansion disables practice shortcuts. Destination headings receive focus. Every new style stays under the Instrument scope and uses the existing type, colour, focus and motion tokens.

| Check | Result |
| --- | --- |
| Red-first `pnpm test -- src/components/devbake/redesign/b-instrument/Instrument.test.tsx` | pnpm forwarded the separator such that Vitest ran the entire app: 1,560 passed, 16 expected failures for unbuilt screens, 106 files. |
| Final focused `pnpm exec vitest run src/components/devbake/redesign/b-instrument/Instrument.test.tsx` | PASS, 71/71: shared contract for eight screens at both widths/themes plus provider-data, empty/optional-state, controller, keyboard, image readiness/error/retry, option-image and viewer-state tests. |
| `pnpm typecheck` | PASS. |
| `pnpm lint` | PASS; 480 files, four existing informational findings in unrelated LandingBakeoff/M3 files. No fixes outside scope. |
| `pnpm test` | 1,614 passed / 3 failed, 105 passing files / 1 failing shared file. The failures are detailed below; this is not an all-green acceptance claim. |
| Instrument CSS through the installed PostCSS parser | PASS, 587 top-level nodes. |
| `git --no-optional-locks diff --check` | PASS. Only the accepted nine code/test files and this repository worklog changed; `parts.tsx` was not needed. |
| Vite on 127.0.0.1:5179 | Sandbox `listen EPERM`; no browser/screenshot or rendered contrast/overflow claim. Coordinator must run the visual pass outside this sandbox. |

### Shared test handoff (outside this bead's exact write set)

1. `contract.ts:619–630`, called again from `Redesign2026Bakeoff.test.tsx`, mounts DTK in jsdom then clicks answer/lock without dispatching an image load. The new screen correctly remains unavailable until its required source loads. The Instrument-specific suite models cached images and separately checks loading/failure/retry. The shared contract needs to simulate source readiness before grading, rather than weakening production readiness checks. This accounts for two failures (desktop/phone).
2. `Redesign2026Bakeoff.test.tsx:163` hard-codes “Ingen riktning har byggt den här skärmen än.” for screen 7. The real registry now correctly reports “Byggd i Instrument.” Update that assertion to derive the built directions from the registry (or use an actually unbuilt screen). This accounts for the third failure.

### Additional spec gaps

- B0 screens 5/8: the kit owns request routing and replay selection; no separate resumable-review state, confirmed queue updates, saved-summary permalink or origin-row/scroll restoration receipt exists in this data contract. Forward the accepted intent to the host; do not fabricate a review receipt or mutate queue counts locally.
- B0 screen 7: no source table structure exists for an accessible HTML table; supplied alt and the original asset are retained. Browser testing must still assess readability, zoom, native dialog focus containment and 320 px/enlarged-text layouts.

### Playbook proposals

- Playbook-proposal — gas-city-coordinator — 2026-10-19: extending a redesign direction's declared screens broke shared tests outside the direction's write set. Cause: the shared suite hard-codes an unbuilt screen and does not simulate required image loading. Rule: assign shared-contract maintenance to the kit owner alongside each screen batch; derive availability assertions from the registry and dispatch media readiness before grading. Proposal recorded here because `~/scratch/skill-gotchas/` is outside this managed worker's writable roots.
- Playbook-proposal — astra-relay — 2026-10-19: `pnpm test -- path` ran the full app instead of the intended focused file. Cause: the separator was forwarded to Vitest. Rule: use `pnpm exec vitest run path` for focused evidence and `pnpm test` explicitly for the full package. Same scratch-root limitation applies.

## Handoff — 2026-10-19

- Implementation is uncommitted on `codex/hpf-qr0p.12-redesign-round-2-direction-b-instrument-batch-1-va-kvantfr-g`, based on `5953117d354c54c3b1174f61c2fe8ff3302b9aaf`. No commit, push, PR, merge, dependency change or production routing change performed.
- Independent cross-vendor review has not run. Coordinator must resolve the three shared-test failures above, rerun the full app gates, and run the requested desktop/phone × light/dark browser pass including keyboard/modal and 320 px checks before signed delivery. Rendered contrast and layout remain unverified because Vite could not bind.
- Bead handoff: leave deferred, unassigned, then drain; do not close. Repository and classified worklogs contain evidence and spec gaps.

### Candidate source fingerprints (SHA-256)

All paths below are under `app/src/components/devbake/redesign/b-instrument/`:

| File | SHA-256 |
| --- | --- |
| Instrument.tsx | `21d82e56b1819809df9233236dd7936d591ee4364b18237f0ab161c28df7bc03` |
| InstrumentHome.tsx | `27b22e7b269817236a8de263c87f75745f8c86249e01ae96732289342dea5274` |
| InstrumentDrill.tsx | `cb417130e43a07051b075c9b90be81a601ae880fce8585bb79deaef7402ef258` |
| InstrumentOva.tsx | `826be8ef0ff77cad68bbca789622f16d7b1ff96a41b3c6ec5cbf75ac2f56a9e3` |
| InstrumentQuant.tsx | `ea05f3fb0281689afb777386854107bd68d8b2006480fd49a591b697bcf94813` |
| InstrumentRepetera.tsx | `5aab78992a71c2a0dcfcb2fd09a79523c644683c3f3b4bab503e960e1544a4f6` |
| Instrument.test.tsx | `1df31cda9e3093006729a0f657e0529a8dd87a5e909058bdaeb8d62eb9b71ffa` |
| instrument.css | `bb1d4c90e2be110806817cf6d856b0f2f493c4088ae0e6f4717f7abbe243b9d4` |
| meta.ts | `92f6cc87c79a37c7bfb2603b39c9c84b9d48c7df091facefeea837f9a9d4e91d` |

INSTRUMENT1 DONE: hpf-qr0p.12

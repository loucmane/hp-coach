# Worklog — hpf-qr0p.14

## Findings

- 2026-10-20: Claimed the assigned bead at clean base `ab33199aa8549ed84bfa0b0212f59a38d15d6976`. No molecule. Read kit v2, B0 common contract and screens 12–14, provider/types, earlier Instrument worklogs and the current implementation.

## Decisions

- Retain the existing warm-grey chassis, orange signal, Geist/Geist Mono controls and Atkinson reading surface. Screen 12 is an indexed reference workbench; 13 uses ruled control rows; 14 composes the existing reading workspace with English content and original provenance.
- New UI copy is proposed. Palette remains fixed during the comparison and account deletion remains unavailable per the more specific B0 screen 13 product boundary. Document the shared-contract conflict instead of weakening that boundary.
- Work only inside the accepted write set; leave all changes uncommitted, record evidence, park deferred, then drain. Independent review and delivery remain with the coordinator.

## Spec gaps

- B0 screens 12–13: kit actions return void and provide no loading, pending, save failure or authentication outcome. Show confirmed provider values; do not claim cloud saving or successful export/sign-out/deletion.
- B0 screen 12: the model contains catalog summaries plus one supplied lesson, not every entry body, example question contents, recommendation, reading duration, source-return or scroll-restoration receipt. Opening another entry requests it from the host without manufacturing its body.
- B0 screen 13: only light/dark are persisted; System is not a saved mode. Palette changes and deletion conflict with the shared screen-13 contract and remain outside the direction's approved product boundary.
- B0 screen 14: the provider supplies the genuine short ELF unit. No additional long ELF fixture or explanation-language metadata is exposed by the kit. Preserve supplied content and explicitly document language handling and coverage.

## Progress

- [S:codex-1|W:hpf-qr0p.14|H:inspect|E:clean baseline, accepted contract and source inspection] Starting with red-first behavioral regressions.

## Handoff

- Implementation in progress. No commits or remote actions.

## Progress — implementation and verification, 2026-10-20

- Screen 12: added `InstrumentUppslag`, a section register beside a ruled contents index and one opaque lesson panel. Phone contents starts folded so the selected lesson is immediately readable. The reader handles all five real schema families (trap, tactic, constraint, protocol and roots) using MathText, ordered protocols, optional worked examples/counterexamples, and progressive details. Read marks follow confirmed provider values and stay separate from mastery. Practice carries the framework/section and is disabled for an empty example list. A missing catalog renders an honest empty state. All navigation goes through actions.
- Screen 13: added `InstrumentKonto`, a compact identity block, local section links, ruled preference rows and square selected controls. Light/dark updates the real host theme; font, density, coach, smart selection, streak display and daily minutes send provider patches and reflect provider values. Instrument's own type/density/palette remains explicit during the comparison. Export/sign-out issue requests without simulated success. Deletion is visibly unavailable, below export, per B0's product boundary. Account/menu navigation preserves the originating primary destination; the visible completion action explicitly goes to Öva.
- Screen 14: composed the existing reading workspace with `data.drills.elf` and its session/controller. Original English title, passage, byline, prompt, options, answer summary and supplied English explanation prose carry language boundaries; Swedish chrome stays Swedish. Synthetic disclosure is shown only for synthetic content, with the provider's approved note. Missing passage/prompt/options cannot grade; missing explanation still permits continuation. One-question ELF ends after one question. Phone evidence jumps preserve the passage element and offer return to feedback; oversized peek prompts expand rather than truncate.
- Instrument remains its established grey chassis, Geist UI/Mono readouts and Atkinson reading surface, with existing orange action/focus tokens, 4/6/8 px corners, opaque panels and existing reduced-motion rules. No new design system, dependency or fixture copy was introduced.
- Batch-1 fixes: DTK evidence is required according to the current question, including mixed/repetition screen 6. Required media now tracks the mounted image node, source and option/question identity; cached images reconcile on mount and disconnected/remounted images cannot inherit readiness. Main-figure retries report loading. Failed option state resets with its source. Related questions retain a mounted shared figure and its zoom/rotation. Inline pan regions own their keys and the expanded viewer uses a native modal.
- Home clamps command selection after rows disappear. Completed plan items are removed from upcoming Home commands/timing and excluded from drill completion's next work; all-complete leads to Öva. Empty sessions labelled “Till Öva” now call `actions.go('ova')`. Reading/quant sessions reset safely when IDs or question membership change, preventing stale out-of-range core indices.
- The command palette is now a native modal with its own key scope. Account menus have arrow/Home/End navigation, Escape focus restoration and switcher isolation. Real-host tests also caught and fixed the account origin highlight when entering directly on Uppslag.

| Check | Result |
| --- | --- |
| Red-first `pnpm exec vitest run src/components/devbake/redesign/b-instrument/Instrument.test.tsx -t 'batch 3 regressions' --reporter=dot` | 15 expected failures before implementation, demonstrating the six audit defects and missing screens. |
| Final Instrument suite (also run as part of the full package) | 170 passed / 2 failed, 172 total. All 34 batch-3 direction-specific regressions pass. The two failures are the shared screen-13 conflict below. |
| `pnpm typecheck` | PASS, including final screen-width change. |
| `pnpm lint` | PASS: 501 files; four pre-existing informational findings in unrelated LandingBakeoff/M3 files. Final changed files also pass scoped Biome checking. |
| Final `pnpm test` | 2,290 passed / 4 failed, 106 passing files / 2 failing files, 108 files total. Same four shared-contract conflicts across two complete runs. Not an all-green acceptance claim. |
| `git --no-optional-locks diff --check` | PASS. Ten accepted direction code/test/style files plus this repository worklog; no changes outside the exact implementation write set. |
| Vite on `127.0.0.1:5179` | Sandbox `listen EPERM`. Browser screenshots, rendered contrast, 320 px/text-spacing/zoom checks and native browser focus behavior are pending host validation. No sandbox bypass attempted. |

The final tests exercise all real framework families from committed catalog files; synthetic short ELF and the genuine 4,420-character `host-2025-verb1-ELF-033` passage from the committed question bank at desktop and phone widths; partial content; English explanation language; phone citation return; optional clocks; deck shrink/new IDs; option remounts/source errors; mixed DTK; completed-plan handling; Home list shrinkage; native viewers, account menus and commands through `Redesign2026Bakeoff`; and theme/preferences/navigation through the real host.

## Shared contract handoff — outside the write set

- `app/src/components/devbake/redesign/contract.ts:800` unconditionally expects a palette mutation. B0 `docs/redesign/directions/b-instrument.md:1026` expressly keeps Instrument's palette fixed and prohibits working global-palette controls. This causes desktop/phone failures in this direction's suite, repeated by `Redesign2026Bakeoff.test.tsx:51` (four total failures). Proposed shared fix: express accepted per-direction settings capabilities and check that unavailable palette controls remain non-mutating, while retaining theme and supported-preference assertions. Do not silently enable the prohibited behavior merely to pass the test.
- `contract.ts:806` also unconditionally expects `rd-konto-delete-confirm` and a deletion action. B0 screen 13 keeps the deep deletion flow conditional on an owner decision. The current shared test stops at the earlier palette failure; deletion is a second known contract conflict, not an independently observed extra failure. Proposed fix: for this accepted non-destructive preview, assert deletion is unavailable and never calls the action; owner-approved deletion needs its own typed-confirmation contract later.

## Spec gaps — final additions and corrections

- Supersedes the initial long-ELF coverage limitation: the direction-specific tests now feed the real long authentic `host-2025-verb1-ELF-033` question through the provider, without editing shared fixtures or relabelling LÄS/cloze. The bake-off's selected screen-14 fixture remains the genuine short “Counting Pots from the Pavement”. Actual long-layout browser review remains pending.
- B0 screen 12: `useBakeoffDirectionData().actions.openLesson` currently changes only the screen; it cannot load another catalog body into the single `uppslag.open` object. Requests are forwarded, with a visible availability notice while the current supplied lesson remains unchanged. The reader responds correctly when a host supplies a new lesson. No direct fixture import, ad-hoc fetch, fabricated lesson or unrelated example drill was added. Example counts and framework practice are supported; individual example previews/links and exact return-to-graded-question restoration require a richer host contract.
- B0 screen 13: no account loading/error discriminator or operation receipt exists. Empty name/email and absent optional plan render without an invented identity/plan. Font/density preferences are reflected in selected controls, with explicit copy that Instrument retains its typography/panel density during the design comparison. System following remains the existing local menu behavior, resolving to light/dark; it is not a new persisted theme mode.
- B0 screen 14: the supplied ELF explanation is English and is language-marked accordingly. The model has no per-fragment language metadata for future Swedish explanations containing English quotations. General mixed-language explanation support remains a kit gap. Live lesson-return/history restoration also remains a host responsibility.
- When a provider changes question membership inside a session, the direction remounts the core at its supplied (clamped) start position. This avoids stale indices and answers; preserving a partially completed, mutated deck needs an explicit reconciliation contract in the shared core.

## Playbook proposal

- Playbook-proposal — gas-city-coordinator — 2026-10-20: a direction's accepted B0 spec prohibits global-palette changes and leaves deletion conditional, but the shared test contract requires both mutations. Cause: the shared suite assumes identical product capabilities despite direction-specific approved boundaries. Rule: reconcile capability expectations with the authoritative direction spec before routing a batch, and give the kit owner a shared-test follow-up when these differ. `~/scratch/skill-gotchas/` is outside this managed worker's writable roots; this proposal is preserved here and in the classified worklog for relay, never in `/tmp`.

## Handoff — 2026-10-20

- Candidate is UNCOMMITTED on `codex/hpf-qr0p.14-redesign-round-2-direction-b-instrument-batch-3-uppslag-lekt`, with unchanged HEAD `ab33199aa8549ed84bfa0b0212f59a38d15d6976`. No push, PR, merge, signing, dependency, shared-kit or spec changes. Source fingerprints below identify the reviewed working candidate; there is no implementation commit to cite.
- Independent cross-vendor review has not run. Coordinator owns the shared contract resolution, host screenshots for screens 12–14 (desktop/phone, light/dark, expanded states and 320 px/text-spacing), visual contrast/overflow checks, exact-head review and eventual delivery. Keep the bead deferred/unassigned for that work; do not close it as shipped.
- [S:codex-1|W:hpf-qr0p.14|H:handoff|E:170/172 direction, 2290/2294 package, typecheck/lint PASS, four documented contract conflicts] Implementation and in-sandbox verification complete; deferred handoff pending native acknowledgement.

### Candidate source fingerprints (SHA-256)

All files are under `app/src/components/devbake/redesign/b-instrument/`:

| File | SHA-256 |
| --- | --- |
| Instrument.test.tsx | `2b5513fcbad40e6994c426885b45960cc426b1c8fbdcee29b7f59c7d953392cd` |
| Instrument.tsx | `cbcf4a4ac8a0137ab9cb0ac9cc1ff09e4ae3e94c630c854b7e85a850db40b727` |
| InstrumentDrill.tsx | `ba349397acfc58f48087744b18ef1bdd565b9f6ffc0b3c7e671a7197bc2133ed` |
| InstrumentHome.tsx | `e6f03fb934cde9f26c10213ef6d2829818dd9960c069df56042059dfaf106d63` |
| InstrumentKonto.tsx | `0c74841362890fe38f667ea95c5a9ae743dae296def5cdc408a44ab3069fec6c` |
| InstrumentQuant.tsx | `c6e5a33c1c4d0b3bcbbd94a9009d3a8c3bee7ad2316db3ce35cdd184c262ee19` |
| InstrumentUppslag.tsx | `e457ccf5726ca478a87fcb4577da749432a7669e87486811c7f1ed111c1fcfb7` |
| instrument.css | `7a2da0e2647ffef29957a4471a03f9a33e3a667b540d20e54a9ae05761d0f062` |
| meta.ts | `90fa3873732bc5c566fd29e9838a69c357890f6f1f08d589a55e32fd3af908c5` |
| parts.tsx | `c76e3d57e0c1ed302ac7b6f84e0eb73854e605ef79006ddca329d0447903fec5` |

- Native handoff confirmed: DONE evidence appended successfully; bead updated to `deferred` with an empty assignee, and `gc bd show hpf-qr0p.14` read back DEFERRED with no assignee. Drain acknowledgement follows as the final control action.

INSTRUMENT3 DONE: hpf-qr0p.14

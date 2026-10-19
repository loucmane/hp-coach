# Worklog — hpf-qr0p.13

## Findings

- 2026-10-19: Claimed the assigned bead at clean base `90d687637804346930179cde0fcfdf46dfface14`. No molecule. Kit v2, Instrument batch 1 and the B0 specification are present.
- Screen 9's shared contract assumes immediate start/submission, conflicting with B0's explicit confirmation gates. Preserve the gates and record the shared-test changes for the kit owner.

## Decisions

- Preserve Instrument's existing warm-neutral chassis, opaque ruled work panels, Geist UI, Geist Mono readouts and Atkinson reading text. The signature is an answer-state register during a pass and a ruled measurement receipt after it; orange remains the single primary-action signal.
- Hub: half selector and pass register. Running: guarded focus workspace with no destination escape, revisable answers and a five-column phone navigator. Results: counts and provenance, then section timing. Framsteg: one readout band, fixed-scale weekly evidence, section table and a local Historik view.
- All new Swedish UI copy is proposed, including confirmation, missing-data, history summary and score-provenance wording. Existing approved calibration copy comes from the provider.
- Leave the candidate uncommitted, append evidence, park deferred and drain. Coordinator owns shared changes, browser validation, independent review and delivery.

## Spec gaps

- B0 screen 9: kit v2 supplies one running pass and void start/submit actions; it lacks generated-pass selection, answer/position/flag persistence, original start timestamp, abandonment, save/error/loading receipts and submission result transport. Keep local interactions explicit, preserve supplied remaining time, do not reuse a different pass's content or manufacture a result.
- B0 screen 10: no loading/error/missing-result discriminator, per-section time unknown discriminator or history scoring-method field. Do not invent those states or compare historical scores as like-for-like.
- B0 screen 11: no completed drill/repetition review action, per-section series, freshness/error status or activity half split. History can reveal supplied summaries, not reconstruct answers or start a replacement drill. No configured goal without a supplied target.

## Progress

- 2026-10-19: Read kit, view model, provider, shared contract, fixtures, direction spec, existing screens and prior batch worklog. Starting with behavioral regressions and the extended shared contract.

## Handoff

- Implementation and validation in progress.

## Progress — implementation and verification, 2026-10-19

- Screen 9: built the half selector, section composition, least-exposed lead pass, complete pass register, prior exposure, prior results and rules. A native confirmation gate names the selected pass, actual question count, source gaps and conditions. The run replaces the navigation frame with an opaque question workspace, persistent clock/exit/submission controls, revisable answers and section-labelled answer cells. Phone uses five ≥44 px cells per row and stacked source/answer panels. KVA and NOG preserve their parsed conditions/statements; passages keep their language, paragraph numbers and practice-text disclosure. Figures and image options have zoom, keyboard scrolling and loading/error/retry states that block answer selection until their source loads.
- Running behavior: A–last-option selects, arrows move unless a control or figure owns the key, and Enter/Space/digits/Escape do not submit or leave. No grading or explanation leaks into the pass. Exit and submission each require confirmation; the clock keeps running through dialogs and derives elapsed time from a wall-clock deadline. Expiry submits once. An already expired supplied snapshot does not gain new time or create a result. Missing/mismatched/partial pass content does not silently use another pass. Optional flags disappear when unsupported.
- Screen 10: built one ruled result receipt with correct/presented, answered/unanswered and missing-source counts; score provenance stays beside the score. Derived normering explains the 80-question scaling, linear estimates remain explicitly indicative, and zero denominators never show a numeric score. Section timing rows compare actual time with proportional planning budgets; phone rows reflow with labels. Trap lessons, ready repetition and historical results use provider actions. Historical rows show raw results without inventing comparable score methodology.
- Screen 11: built total/half prognosis with supplied caveat and optional range/target/change, a fixed 0–2 weekly accuracy series with gaps and a table alternative, all eight section scores with attempts/confidence/bands, lesson/practice actions, weekly rhythm, 84-day activity with a dated text alternative, and repetition readouts. No section sparklines or trend segments are invented. Historik is a local view with separate practice/mock categories; practice rows reveal the supplied summary, mock rows open results. Home's “Alla pass i Framsteg” enters Historik, while the primary Framsteg destination returns to the overview.
- Every new field comes from `useDirectionData()`. Existing Instrument tokens and type roles continue in both themes: near-achromatic chassis, opaque inset panels, fine rules, mono values and one orange action. The runner's answer-state register replaces sequential progress bars; the result is a measurement receipt, and progress keeps dense evidence in one table rather than a grid of equal-weight cards.

| Check | Result |
| --- | --- |
| Red-first shared contract after declaring screens 9–11 | 83 passed, six expected failures for absent screen content. |
| Final `pnpm typecheck` | PASS. |
| Final `pnpm lint` | PASS, 482 files; four pre-existing informational findings in unrelated LandingBakeoff/M3 files. |
| Final `pnpm test` | 1,661 passed, six failed; 104 passing files, two failing files, 106 total. All failures are the shared-test issues below. |
| Instrument file within final full suite | 101 passed, two shared-contract failures, 103 total; all fourteen new direction-specific safeguard cases pass. |
| CSS parse with installed Vite-owned PostCSS | PASS, 694 top-level nodes. Direct top-level PostCSS import was unavailable under pnpm; resolved the existing dependency relative to Vite without installing anything. |
| `git --no-optional-locks diff --check` | PASS. Source changes confined to the seven files listed below plus this worklog. |
| Vite on `127.0.0.1:5179` | Sandbox `listen EPERM`; no screenshots or rendered contrast/overflow claims. Coordinator must run the browser pass. |

### Shared-test repairs for the coordinator (outside this write set)

1. `app/src/components/devbake/redesign/contract.ts:671` expects `startProvpass` immediately after the lead choice. B0 screen 9 requires the start gate. At `contract.ts:688`, submission likewise assumes no confirmation. Teach the shared driver to confirm a visible start/submit dialog where the direction uses one, retaining pre-confirm assertions. Two failures in `Instrument.test.tsx`; the same two scenarios also run in the global suite.
2. `contract.ts:361` (`stubLayout`) does not stub native dialog methods. The global `Redesign2026Bakeoff.test.tsx` contract hits `showModal is not a function` at `InstrumentProvpass.tsx:42` in jsdom. Add isolated/restored `HTMLDialogElement.showModal/close` stubs to shared setup (the direction's own file already supplies them). These are the two global screen-9 failures currently masking the confirmation assertions.
3. `app/src/components/devbake/redesign/Redesign2026Bakeoff.test.tsx:377` assumes all screen-11 thumbnails contain `rd-not-built`. Instrument now builds screen 11. Branch on registry availability and await the lazy stage for built directions. Two failures, desktop/phone.

### Additional spec gaps and limits

- B0 screen 9: only one running-pass snapshot is available. The register forwards the exact selected pass ID; if the host does not supply that pass, the screen offers a clear return instead of showing unrelated questions. Generated mode is not fabricated. The kit's start/submit actions only route the bake-off: local answer edits cannot feed a newly computed persisted result through today's API. Running UI explicitly limits answer/flag state to the current view; screen 10 renders only the supplied result. Real persistence, recovery and result transport require the kit owner.
- B0 screen 9: the pass's figure workspace supports zoom/scroll/retry, but full rotation/expanded figure tooling lives in a private component in `InstrumentQuant.tsx`, outside this bead's write set. The pass uses a full-width stacked phone source and answer panel, retaining persistent exit/clock/submit chrome; it does not import practice grading UI. The coordinator should assess this composition in the browser pass.
- B0 screen 10: history has no score-method field, so historical rows deliberately present raw counts. The result view does not invent per-question answer reconstruction or a combined normed total.
- B0 screen 11: section lessons use the first available catalog entry because no dedicated section-catalog action exists. Practice history reveals only the supplied summary; full read-only replay and return-scroll receipts await a review action. All new copy remains proposed.

### Playbook proposals

- Playbook-proposal — gas-city-coordinator — 2026-10-19: adding approved start/submit confirmation gates made the shared redesign contract fail even though direction-specific interaction tests passed. Cause: shared drivers assume immediate actions and lack native-dialog stubs, while thumbnail tests assume a fixed screen remains unbuilt. Rule: kit-owned tests must drive each declared confirmation boundary, stub browser-only primitives with restoration, and derive screen availability from the registry. `~/scratch/skill-gotchas/` is outside this managed worker's writable roots, so the proposal is preserved here and in the classified worklog for coordinator relay.
- Playbook-proposal — astra-relay — 2026-10-19: a CSS-only validation probe could not import `postcss` at the app package root. Cause: pnpm does not expose Vite's transitive dependency as a direct app dependency. Rule: resolve the already installed parser using `createRequire(require.resolve('vite/package.json'))('postcss')`; do not add dependencies for a one-off validation probe. Same scratch-root restriction applies.

## Handoff — 2026-10-19

- Candidate is uncommitted on `codex/hpf-qr0p.13-redesign-round-2-direction-b-instrument-batch-2-provpass-pro`, based on unchanged HEAD `90d687637804346930179cde0fcfdf46dfface14`. No implementation commit exists; fingerprints below identify the candidate. No push, PR, merge, dependency change or shared-kit/spec edit.
- Independent cross-vendor review has not run. Acceptance is pending coordinator resolution of the six shared-test failures, browser screenshots for screens 9–11 at requested widths/themes (including running/gates/history), keyboard/native-dialog focus checks, 320 px/enlarged-text checks and rendered contrast/overflow measurement.
- Bead handoff is deferred and unassigned after the DONE note, verified before drain. It must not be closed as shipped until review and delivery evidence exist.

### Candidate source fingerprints (SHA-256)

All paths below are under `app/src/components/devbake/redesign/b-instrument/`:

| File | SHA-256 |
| --- | --- |
| Instrument.tsx | `8d98a02ff220eba39c281a21e4a172ec787c43bb3bb65a387d55b07b047fd262` |
| InstrumentHome.tsx | `f099fa26f51b9ccd0d4728baedd71b0071ef1586c74daf8b025bc5f35d86160b` |
| InstrumentProvpass.tsx | `2537d557d9a34934a9e89928ca0b990478ad771cdb6e974d002357ce0dfebbb5` |
| InstrumentFramsteg.tsx | `902fd47b471892543d0399b0f07f8e44c574342b9eda496aabbfce30e4eeb32b` |
| Instrument.test.tsx | `684a85b13afdf9a7041b514e6f164bd87b805140d13d7396f5fac6cefd8f6573` |
| instrument.css | `9230596a5c558c91caeadae7758426a4bc9c3c2c4b30d10183700c357933b45e` |
| meta.ts | `37dc82bdd400b0a7bba36bb4d5935030e5838f92054edad18ba42c1d151a8bd0` |

INSTRUMENT2 DONE: hpf-qr0p.13

## Final amendment — figure controls and final checks, 2026-10-19

- Supersedes the rotation/expanded-view limitation above: running-pass figures and image options now support rotation, aspect-correct fitting, zoom, a native expanded dialog, Escape/close and return focus. The media safeguard test also verifies rotation, retained zoom and keyboard isolation inside the viewer. The phone still uses stacked source and answers, with persistent clock/exit/submission controls; host visual review remains required.
- After this last source change, `pnpm typecheck` and `pnpm lint` pass again. CSS parses with 698 top-level nodes and `git diff --check` passes.
- Final full `pnpm test`: 1,660 passed / seven failed, 103 passing files / three failing files (106 total). Instrument remains 101 passed / two shared-contract failures, including all fourteen new safeguard cases passing. Six failures are the same shared-contract/harness issues documented above. The additional failure is untouched `app/src/components/drill/PedagogyPanel.test.tsx:61`: its assertion checks asynchronous explanation copy immediately after awaiting verdict text already present during loading. The failure still showed the loading state. Isolated rerun of that entire file passed 7/7. This is an observed readiness race, not a claim that the full suite is green; coordinator should replace that immediate `getByText` with an awaited explanation-copy query in its own scope.
- Playbook-proposal — astra-relay — 2026-10-19: an unrelated async component test passed in earlier full runs and alone but failed under concurrent full-suite load. Cause: `findByText` awaited a static verdict already rendered before the explanation load, followed by an immediate assertion on loaded copy. Rule: await the actual async result, and report full-suite failures separately from isolated rerun success. Proposal retained in worklogs because the scratch proposal directory is outside writable roots.

These three SHA-256 values supersede their earlier entries; all other candidate hashes above are unchanged:

| File | Final SHA-256 |
| --- | --- |
| InstrumentProvpass.tsx | `b669930d188d2708ad4961a4a5c47b41b6dde39abcb8e47dbbe12979a2de838a` |
| Instrument.test.tsx | `1b1fa4d1aeb0f5a68f67c2ad04a87e299bd1b8921afa82d607b42dfa17b73780` |
| instrument.css | `59d8843620d29a55a2ed419f60f8b17d46643e51eab212ca0de99e8d8c5f0e39` |

INSTRUMENT2 DONE: hpf-qr0p.13

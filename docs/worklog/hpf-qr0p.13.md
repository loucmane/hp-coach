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

## Round 2 — review fixes, 2026-10-20

Starting state: clean `f067a51eac43dcc398010401eecf05f147191be4` on the assigned branch. Read the latest Bead DESIGN, the cross-vendor review probes at `/home/loucmane/scratch/hpf-qr0p.13-review/probe.test.tsx`, the B0 screens 9–11 specification and kit countdown mapping. No molecule controls this item. The prior review remains HOLD at `c8b6eb2e710199d6c4070199346effe3fa57d18b`; this uncommitted fix candidate needs a fresh independent review.

Paths in the following table are relative to `app/src/components/devbake/redesign/b-instrument/`.

| Finding | Fix | Red-first regression in `Instrument.test.tsx` |
| --- | --- | --- |
| P2-1: switcher keys abandon an active pass | `InstrumentProvpass.tsx:350` prevents the unmodified arrow/digit defaults before checking control targets; `:373` marks the whole run `data-rd-keyscope`. Heading/body arrows still move between questions, while buttons/grid retain their local semantics. | `:378`: real `Redesign2026Bakeoff` with its real provider and selection state; focused answer, grid, heading and body; both arrows, 1, 8, 9 and 0. Red calls changed screen to 10 or direction to A; green keeps selection unchanged. |
| P2-2: provider countdown zero voids a live run | `InstrumentProvpass.tsx:256` captures expiry once when the keyed run is entered. Later provider renders retain the runner and its original wall-clock deadline. Existing initially-expired recovery behavior remains covered. | `:401`: start at three seconds, advance wall time, rerender the provider at zero before the interval fires, then assert exactly one submission, retained answer, disabled hand-in control and no voided screen. Further provider renders/ticks cannot resubmit. Red made zero submission calls. |
| P3: shrinking question list crashes | `InstrumentProvpass.tsx:290` clamps the index for every render, including the question, navigator, position and previous/next actions. | `:428`: select the final question, shrink the same pass's questions/grid/source count, then verify the new final question, answer and previous navigation. Red threw on `q.figure`. |
| P3: answer letters stop after focus moves to a button | `InstrumentProvpass.tsx:355` resolves answer letters before the button/grid arrow exclusions, retaining dialog/media ownership. | `:462`: A–E on a NOG question from an answer button and a grid button; selection changes without moving focus or question. Both cases were red. |
| P3: zero/singular unanswered copy | `InstrumentProvpass.tsx:578` uses all-answered, singular and plural messages. All new wording remains proposed. | `:484`: 0, 1 and 2 unanswered questions; 0/1 were red and the plural case was a passing control. |
| P3: hard-coded 40-question normering explanation | `InstrumentProvpass.tsx:921` names the actual presented count, with a zero-underlay explanation instead of scaling zero questions. | `:498`: partial 39-question source names 39 and does not claim 40. Existing zero-denominator regression remains green. |
| P3: progress switch lacks tab semantics | `InstrumentFramsteg.tsx:41` provides linked tablist/tab/tabpanel roles, selected state, roving focus and wrapping arrows plus Home/End. `instrument.css:3776` preserves the selected visual treatment for `aria-selected`. | `:517`: real bake-off host, active/hidden panel, IDs/labels, roving focus, arrow wrap, Home/End and click activation without changing host selection. Red could not find a tablist. Existing Home → Historik → primary overview checks now assert tab semantics. |
| P3: selected mock category hides practice after mock results disappear | `InstrumentFramsteg.tsx:22` derives practice as the active category whenever mock results are absent. | `:552`: remove mock results while selected, with populated and empty practice histories. Both red cases stranded the mock panel; green displays practice or its empty state. |
| P3: guessed P5 calibration caveat | Removed the mode/half-based caveat branch from `InstrumentProvpass.tsx:917`. Only supplied score provenance remains. | `:507`: a generated verbal result does not imply the P5 caveat; the linear-score explanation remains. Red rendered the guessed caveat. |

### Keyboard panning preservation

The stricter capture guard also prevents the browser's default horizontal scrolling in an inline figure. `InstrumentProvpass.tsx:730` now handles that local pan explicitly, without changing answers or the current question. The real-host regression at `Instrument.test.tsx:350` failed with an unchanged scroll offset before this addition, then passed with both horizontal directions. Expanded-dialog behavior and ordinary vertical scrolling remain available; the existing media/dialog safeguard passes.

### Verification

- Red-first review cases against the unchanged production code: **15 failed, 1 passed, 103 skipped**. The initial attempt exposed a jsdom setup issue (zero viewport dimensions); the meaningful red run above followed adding/restoring dimension spies so the real lazy stage mounts. The reviewer findings then reproduced directly through the host.
- First green full app run: **1,775 passed / 107 files**. After the additional red-first panning regression and fix, the final full `pnpm test` passed **1,776 tests / 107 files**, including all **120 Instrument tests** and **17 new cases**. Exit status 0.
- Final `pnpm typecheck`: **PASS**, exit 0.
- Final `pnpm lint`: **PASS**, 486 files, exit 0; four existing informational findings in unrelated LandingBakeoff/M3 files, none in this change.
- `git --no-optional-locks diff --check`: **PASS**. Four source/test/CSS files plus this worklog changed, all within the admitted write set. No dependency or shared-kit changes.
- Browser screenshots/native focus and physical scroll behavior were not rerun in this managed sandbox; the prior loopback `EPERM` limitation remains recorded above. Coordinator runs those checks on the host. No browser verification or new independent-review PASS is claimed.

### Spec gaps

- B0 screen 10 score copy requests a calibration caveat when the estimate actually contains uncalibrated P5 LÄS/ELF data. `ProvResultView` has no calibration/provenance flag or result-specific caveat to establish that condition. A generated verbal pass is insufficient evidence. Kit owner must supply that information before the result view can display the caveat conditionally; this fix removes the guess. The separate provider-supplied progress prognosis caveat is unchanged.

### Playbook proposal

- Playbook-proposal — astra-relay — 2026-10-20: the real redesign bake-off mounted no stage in jsdom despite `stubLayout()`, making keyboard regressions fail before reaching the interaction. Cause: its stage waits for nonzero `clientWidth`/`clientHeight`, which the shared stub does not supply. Rule: stub and restore those dimensions and await the real lazy stage in host integration tests; do not replace the host listener with a copied implementation. Also verify local scrolling when capture handlers cancel arrow defaults, since jsdom does not perform native key scrolling. The proposal is retained here and in the classified worklog because this worker's actual writable roots exclude `~/scratch/skill-gotchas/`; coordinator relay is required.

### Candidate and handoff

- HEAD is still `f067a51eac43dcc398010401eecf05f147191be4`; all Round 2 changes are uncommitted. Coordinator owns host browser validation, the fresh independent Claude review, signing and delivery. The bead will be parked deferred/unassigned after the completion note, then the worker drains. Do not close as shipped from this implementation evidence alone.
- SHA-256 fingerprints of the final source candidate (same directory prefix as above):

| File | SHA-256 |
| --- | --- |
| `InstrumentProvpass.tsx` | `66abf34ff14e0028927f3df797ee67b932fecdb1ece9a174de8b3eb870296993` |
| `InstrumentFramsteg.tsx` | `0bb2f3b669e27e71e729ce3960809219d2e6a3228a00cab2dc1eaaff55197c06` |
| `Instrument.test.tsx` | `058fa96c37b33f9d98b175a63879e7d0f642db4688c6ef2b862d5b2226760ed4` |
| `instrument.css` | `2c682b9a068816c5bb13d165566bebc81d9df71be0db5e04e7d5e57b3abe6492` |

- Handoff confirmation: the Round 2 completion note was appended and read back; native Beads now reports **DEFERRED**, with assignee cleared. Final drain acknowledgement follows.

INSTRUMENT2R2 DONE: hpf-qr0p.13

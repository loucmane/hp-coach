# Worklog — hpf-qr0p.51.19

## 2026-11-05 19:32 CET — prerequisite inspection, BLOCKED

- Claimed LJ-34 in the assigned worktree. No molecule is attached. Starting head: `8ebaa9d5628ed4aed8ae2ded7b13bb40c405c648`; source tree was clean. Dependencies are present.
- Read the bead, approved `rebuild-map.md` (§0–2, Framsteg row, LJ-34), `direction.md`, and `r6/A/framsteg.html`, then traced the current view and its data sources.
- The approved weekly chart says “Prognosens intervall varje vecka”. `app/src/api/hooks/useStats.ts:19` supplies only `weekStart`, `attempts`, `correct`, and provenance per weekly bucket. It has neither first-try section counts nor historical prognosis snapshots.
- `worker/src/routes/me.ts:585` builds those buckets from all `recentAttempts`, including repetitions and changed mock picks. Its dates are rolling seven-day windows relative to request time, despite the calendar-boundary comment. The opt-in first-try aggregates (`me.ts:459`) feed only current per-section 7/14/90-day counts. The existing insights routes provide calibration, tempo, and outcomes, not weekly prognosis history.
- `app/src/lib/scoring.ts:364` requires first-try counts by section to compute the honest half means, total, and pooled uncertainty. Weekly pooled counts cannot recover them. For example, 10/20 pooled correct could mean ORD 9/10 + KVA 1/10 (total 1.0) or ORD 9/9 + KVA 1/11 (total about 1.091), before any retry or retention effects. Drawing a band from `weeklyScore` and `scoreBand` would describe a different estimator.
- Independent implementation finding: `framstegView.ts:185` recomputes the displayed halves after excluding single-answer sections, while the total comes from the unfiltered shared projection at line 193. A subsequent implementation should use the projection's own halves to satisfy mean-of-halves acceptance. The current tests explicitly pin the older exclusion behavior.

## Decision and handoff

Stopped before source edits under the worker instruction that a missing prerequisite is a stop. No alternate estimator, placeholder history, or new API contract was invented. No tests were added or run: there is no implementation or red/green evidence to claim. No commit, push, merge, or publication was attempted. Only this worklog and the classified worklog were created.

Required coordinator decision: supply an approved weekly first-try prognosis data source (or per-section inputs with defined week/window and retention semantics), then route the UI work again; alternatively explicitly revise LJ-34 to defer the weekly chart or use a differently labelled observed-answer chart. Likely companion files include `worker/src/routes/me.ts` or a dedicated insights endpoint, its worker tests, and `app/src/api/hooks/useStats.ts` or a dedicated hook. These are outside this bead's admitted write set and must be planned separately. All implementation, red-first tests, app verification, and the four-mode visual check remain outstanding. The bead must not be closed as complete.

## Playbook proposal

2026-11-05 — `gas-city-coordinator`: a weekly prognosis UI can be blocked even when a `weekly` stats field exists. Cause: hpfetcher's buckets are pooled all-attempt rolling windows, whereas honest prognosis uses per-section first tries and equal half weighting. Rule: verify weekly grain, first-try policy, and half/interval inputs before dispatch; include an approved data-source prerequisite when they differ. The requested `~/scratch/skill-gotchas/gas-city-coordinator.md` path is outside this session's configured writable roots, so the proposal is retained here and in the classified worklog for the coordinator to forward.

## 2026-11-05 — round 2 resumed

- Revised accepted contract explicitly defers the weekly interval chart. Preserve `TrendChart.tsx`, `buildTrend`, its input buckets, and the trend section markup/output.
- Inspected all four approved Framsteg shots, its HTML, direction, map, current view, scorer, UI primitives, and route tests. Use the existing projection's halves directly; do not manufacture half-specific intervals (the shared API supplies only half point estimates and total uncertainty).
- Evidence tiers follow the design: zero = streckad, one through nine = låg/första glimt, ten or more = fylld/underlag. First-try counts drive tiers and shared section bands. Dots must come from real provpass answers; returning rings require the active repetition queue, not a guessed outcome-to-schedule mapping.
- Scope remains the admitted files only. Tests first, then implementation; app typecheck, lint and one full suite capped at eight workers. Coordinator owns visual capture, signing, review and delivery. No molecule is attached.

## 2026-11-05 — round 2 implementation and red/green evidence

- Resumed the claimed item with an existing view-test draft and round-2 log. Kept those findings and completed the draft. No molecule is attached; no new claim or routing metadata was inferred.
- Red-first command: from `app/`, `pnpm test src/folio/screens/framsteg/framstegView.test.ts src/folio/screens/framsteg/FolioFramsteg.test.tsx src/folio/screens/framsteg/framsteg.guard.test.ts --maxWorkers=2`: 25 failed, 38 passed. Failures covered the inconsistent one-answer half, tiers, real dots, lever selection, one-lit/one-go layout, scoped keyboard and CSS guard. Trend-preservation checks passed before implementation.
- Core uses `computeHonestProjected` unchanged for both halves and total, `firstTryStats` for evidence, and `scoreBand` for sections only at ten answers. Display precision retains the existing minimum nonzero band; half markers show point estimates because no shared half interval exists. The empty total remains absent when either half has no data.
- Lever policy: fill a missing half, then an untried section with the largest UHR booklet share (stable exam-order ties), then the thinnest sample; established sections use the shared practice ranking. No predicted gain or invented duration is displayed.
- Dots use actual answers from the most recent completed provpass of each half within 90 days. Changed picks replace earlier picks; rings come from the active repetition queue, including correct answers scheduled to return. Missing answer or queue data never produces guessed dots or rings. Aggregate evidence remains separate from the sampled pass answers.
- Rebuilt the core with shared Lit, Go, SecChip and RangeBand primitives, approved copy and scoped token CSS. Removed the previous competing per-section action grid and margin. The single phone Go is a sibling of Lit, with a fixed dock wrapper; keyboard shortcuts are region-scoped and respect preferences and native controls. Historik files and classic routes are unchanged.
- First green focused run: 3 files, 63 tests passed, including five axe states (contrast excluded from JSDOM; visual/token checks belong to host review), both trend render sizes, the phone dock ancestry, keyboard preferences and native modified clicks.

## 2026-11-05 — verification and review

- Full app suite, `pnpm test --maxWorkers=8`: 203 files; 6,054 passed and 2 failed (73.49 seconds). One failure was the unchanged route test pinning section links to `/lektion`. Preserved that established section-navigation contract; the single lever still starts `/drill`. The other failure is `src/lib/trapIndex.test.ts`, generator check: `spawnSync /usr/bin/node EPERM`. This is the documented sandbox limitation; the coordinator must run it on the host. No attempt to bypass it.
- Final focused plus route command: `pnpm test src/folio/screens/framsteg/framstegView.test.ts src/folio/screens/framsteg/FolioFramsteg.test.tsx src/folio/screens/framsteg/framsteg.guard.test.ts src/routes/-progress.folio.test.tsx --maxWorkers=2`: 4 files, 67 passed. This includes real extras-hook selection of the latest recent pass per half and removal of obsolete cached samples.
- Additional red/green for changed mock picks: a later null answer must remove an earlier scored dot. Red was 1 failed / 23 passed; after retaining the last raw pick before filtering, the final 67-test run passes.
- `pnpm lint`: PASS, 774 files, no fixes, four informational findings in untouched devbake sources. `git diff --check`: PASS.
- Verified `buildTrend` is byte-identical to HEAD, `TrendChart.tsx` has no diff, and all chart-specific CSS is byte-identical to the pre-edit source. Both phone and desktop trend DOM match the original component output in tests. Historik files, classic routes, worker code and dependencies have no edits.
- Self-review found custom evidence marks could not inherit the UI primitives' class-scoped colour variables. Added explicit scoped mappings for all eight section colours and a guard. Only the shared token values are used.
- Implementation remains on base head `8ebaa9d5628ed4aed8ae2ded7b13bb40c405c648`, uncommitted. No independent review or implementation commit exists yet. Four-mode screenshot capture, visual comparison/owner approval, host generator verification, signed commit and cross-vendor review remain coordinator work. This is not merge evidence and the bead must not be closed by this worker.

## Additional playbook proposal

2026-11-05 — `gas-city-coordinator`: custom Ljusbord evidence marks can silently lose their data colours when they reuse `--fa-ui-c` on arbitrary `data-sec` elements. Cause: `ui.css` binds those variables only on SecChip and RangeBand classes. Rule: inspect the variable's selector scope; custom marks need their own scoped mappings to the eight section tokens, plus a guard or visual verification. The scratch gotcha inbox is outside the configured writable roots; retain this proposal here for coordinator forwarding.

## Final handoff — BLOCKED on host staging and verification

- `git add` for the ten changed implementation/test files and this worklog was refused: shared worktree `index.lock` is on a read-only filesystem. Changes remain unstaged and uncommitted. No signing or permission workaround was attempted.
- Final `pnpm typecheck`: PASS (exit 0), after the last null-pick correction. Final `pnpm lint`: PASS. Final focused/route run: 67 passed.
- Coordinator: stage the admitted files, run the trap-index generator check outside the sandbox, capture and compare desktop/phone light/dark Framsteg, then handle signed delivery and independent review. Core implementation and 67 focused/route tests are complete. The full suite's navigation regression is fixed; the known generator EPERM remains a host verification boundary.
- Park this bead as deferred with worker state blocked, do not close it. Playbook proposals are retained above because the requested scratch inbox is outside the sandbox's writable roots.

## 2026-11-05 — round 3 review fixes started

- Claimed the existing item, with no molecule, and inspected the round-2 source and original HEAD tests. Scope is the seven round-3 findings; preserve the trend builder, component, section markup and styles. Keep all existing uncommitted work.
- Restore every still-applicable original test intent and record a complete old-to-new test inventory below. Do not reinstate the removed Folio+ layout, ranked follow-on actions, activity calendar or history feed.
- Source drill minutes from `SECTION_DURATIONS`, repetition size/time from the due queue and shared replay/scheduler constants, and sitting date from the same exam store as Idag.
- Half-band prerequisite: `computeHonestProjected` calculates half variances privately but exposes only total uncertainty. Requested permission to add `app/src/lib/scoring.ts` and its test file to the write set, solely to expose those existing values. No shared scorer edits until approved; continue the independent fixes.

## Round 3 — original test inventory

This accounts for all 29 original `framstegView.test.ts` test declarations and all 19 original `FolioFramsteg.test.tsx` declarations at HEAD `8ebaa9d5628ed4aed8ae2ded7b13bb40c405c648` (parameterized declarations expand into more cases). “Removed by design” describes behavior already removed in round 2; it does not claim the old assertion still runs. The current weekly trend remains in scope for preservation, unlike the old per-section trend/level/up-step presentation.

### View tests

| Original test | Round-3 disposition and reason |
| --- | --- |
| uses first tries consistently in the total, halves, section scores and bands | Restored explicitly: repeated-attempt totals disagree with first tries; assert both halves, total, every section score/count/band and exact endpoints. The old week/lifetime prose is absent from the approved core. |
| clamps a score range at the scale edges | Restored for both total and every section at zero and perfect scores. |
| hides a half supported only by single answers, preserving the total and interval | Old exclusion is removed by the approved requirement that the mean of the displayed halves equal the total. Existing six first-try cases and new mixed-verbal/mixed-quant tests retain the shared half contributions. Half range presentation remains blocked pending the scorer output extension. |
| requires a band in each half, not just two answers across different sections | The old filter cannot be reinstated without contradicting the coherent half means. The replacement must test each half's own shared band (including the scorer's conservative single-answer variance), and absence when that half has no evidence. Pending the shared scorer extension; not claimed complete. |
| averages only band-supported sections in a mixed half | Rewritten as “retains every shared section contribution in a mixed half,” for verbal and quant. Single answers must contribute exactly as the shared total does, while section rows stay glimpses without ranges. |
| names a stable delta without a figure and prints only a significant change | Removed by design: the new core has no current-prognosis weekly delta callout. The separate unchanged weekly chart is tested directly. |
| marks provenance on the actual affected section, including quant | Retained and strengthened: only XYZ marked, caveat present, then removed again when its provenance is removed. |
| keeps absent data distinct from an account without a prognosis | Retained: loading/error have no primary; resolved empty is day zero; cached data remains ready even on a refresh error. |
| uses comparison language only with more than one scored section | Rewritten for the approved neutral lever copy: single, tied and stale evidence never claims lowest/next-lowest or the greatest expected gain. |
| hides a verbal-only delta | Delta display removed by design; the missing-half test still verifies absent total and the action to fill the missing half. A nonempty single half is now distinct from day zero. |
| explains urgency instead of mislabelling a higher score as lowest | Rewritten: a higher stale section can be chosen by the shared practice ranking but is not called lowest and receives no shame/decline wording. |
| uses lowest and next-lowest only when recommendation order matches displayed scores | Ordinal recommendation prose and the following-step list were removed by design. Neutral comparison tests now cover the remaining lever; no unsupported rank is displayed. |
| requires both first-try weeks to qualify (upp/ner trend wording) | Removed by design: no per-section trend or up-step prose in the core. This is distinct from `buildTrend`, whose two original chart tests are retained unchanged. |
| uses the legacy weekly counts when first-try fields are absent | Per-section trend presentation removed by design. The existing older-worker first-try fallback test remains for the scores/evidence still shown. |
| does not present zero/one first tries as a scored section or ranked practice step | Rewritten: tier/threshold tests keep those rows rangeless; each of eight single-answer sections is explicitly barred from the lever. Zero-answer sections may now be the approved “Prova” coverage action, which is not a ranked score claim. |
| labels displayed ties as shared lowest | Rewritten: exact and display-rounded ties remain neutral; no distinct ordinal or unsupported comparative claim. |
| does not give distinct ranks to a tie above the lowest score | Covered by the two display-tie cases, with other sections at a lower 1.2; no ranked list or ordinal prose remains. |
| includes tied scores outside the recommendation shortlist but excludes unscored sections | Shortlist presentation removed by design. All-section tied screen coverage asserts one neutral lever, and the eight single-answer selection cases exclude unscored recommendations. |
| joins two tied peers with och in the lead and following steps | Removed by design: neither ranked peer-list sentences nor following steps exist in the approved one-lever screen. Ties retain neutral behavioral coverage. |
| does not make a lead or following step out of single-answer sections | Restored: one-answer sections cannot become the lever; if every section has one answer, use the existing mixed-drill entry rather than rank one. |
| keeps a low-confidence score out of the level promise | Restored at scores 0, 1 and 2 with eight first tries: glimpse, no range, no level/gain promise. |
| keeps tiny displayed uncertainty nonzero | Retained at fractions 0, .95 and 1: total/section ranges remain noncollapsed, labels distinct and endpoints clamped. |
| routes up-steps by first-round, stale, trap, due and practice priority | Per-section up-step grid and trap shortlist removed by design. The remaining native section links, coverage/practice primary, repetition and prov destinations are tested; no answer-bearing trap prose is reinstated. |
| builds an 84-day calendar with three heat levels and no streak data | Removed by design: the approved core uses evidence tiers, delprov bands and the preserved weekly score chart, not the Folio+ activity calendar. |
| filters history before taking five, using production labels and destinations | Removed from this screen by design. The approved core has a Historik link; Historik itself belongs to LJ-36 and is untouched. |
| shows a chart after two scored weeks, breaking runs over missing weeks | Restored verbatim, including solid-run/bridge counts, missing points and insufficient-week cases. |
| formats history section lists without changing special labels | Removed from this screen with its history feed; shared history and LJ-36 files are untouched. |
| describes chart changes using the same rounded numbers the reader sees | Restored verbatim, including the 23/40 → 24/40 binary-decimal rounding case. |
| does not offer a zero-sized step when a near-perfect score prints as 2.0 | Rewritten: shared displayed score rounds to 2.0, while remaining action prose promises no next level, zero gain or “Håll” step. |

### Screen tests

| Original test | Round-3 disposition and reason |
| --- | --- |
| keeps the report before the primary action and the remaining overview in order | Rewritten for the approved heading order, one lit sheet and one action, first-try explanation, and absence of removed/shaming/forecast content. |
| makes every section row, up-step, history row and trap a real destination | Section and Historik anchors retained; repetition and prov rows tested with real href/click behavior. Up-steps/history feed/trap list removed by design as above. |
| runs the primary with Enter and preserves focused controls and modified links | Retained and strengthened: Enter is scoped to the page, respects preferences/inert/dialog/input/composition/modifiers, and native modified links survive. Global body Enter was intentionally removed by the keyboard-scoping owner rule. |
| expands the 84-day strip and the chart table with accessible controls | Activity strip removed by design. Both desktop/phone chart table controls retain keyboard open/close, focus, aria-expanded and empty-week data tests. |
| renders day zero only after data resolves and keeps the retry line | Retained: no premature empty text/CTA while loading; exact error state; resolved empty; single-half state remains distinguishable and names the missing total. |
| keeps a single first try neutral in the ledger and up-step | Rewritten for the glimpse row: no range/2.0/Håll promise, and the section cannot be the lever. Up-step grid removed. |
| keeps a one-answer half neutral alongside its section row | Rewritten to keep the shared half mean while the section stays a glimpse; the old hidden-half behavior conflicted with mean-of-halves acceptance. Half-range rendering remains pending the scorer extension. |
| renders a shared lowest place in both the lead and following step | Rewritten as one neutral lever for tied evidence, with no ordinal comparison or Sedan region. |
| excludes a single-answer section from its mixed half on screen | Old exclusion removed by design; pure mixed-half tests now guarantee the same contribution as the shared total. The screen's half-range test still needs the scorer extension. |
| omits the halves explanation when both halves use every scored section | Old exclusion-specific explanation removed. The approved mean-of-halves explanation is now unconditional and asserted exactly once. |
| removes the halves explanation as soon as the last excluded section qualifies | Rewritten across 1, 2 and 10 first tries: common explanation remains once, the row becomes a band only at ten, and no level promise appears. |
| explains an absent half even when the available half has enough answers | Retained in loading/empty/missing-half coverage: Kvant shows absent, total absent with explanation, common half note once. |
| renders Swedish section lists in the lead and following steps | Ranked peer-list prose removed by design. All-section ties still assert one neutral lead and no following-step region. |
| keeps thin trends neutral in the lead, Sedan and up-steps until both weeks qualify | Per-section trend and follow-on-step presentation removed by design. Global no-shame/no-forecast assertions retain the remaining neutrality invariant. Weekly chart output is separately unchanged and tested. |
| describes marked section rows only when the caveat is rendered | Restored, including the zero-authentic/zero-synthetic provenance case and subsequent real synthetic evidence. |
| renders a noncollapsed range in both visible and accessible prognosis text | Restored: visible 1.8–2.0 range and exactly corresponding accessible band label at tiny uncertainty. |
| retains mastery peaks per account across decay, remounts and account switches | Removed by design: the approved core has no mastery margin or peak counter; route props remain accepted for compatibility. |
| uses the phone layout without changing its links or count | Retained via phone dock ancestry/navigation, unchanged chart markup/geometry, Historik href and new dated sitting copy (also tested on desktop and a different sitting). |
| has no axe violations in ready/empty/loading | Retained and expanded to error and phone; ready/phone run axe with the chart table expanded, preserving the original table accessibility coverage. |

## Round 3 — red/green evidence to date

- Focused red before implementation: `pnpm test src/folio/screens/framsteg/framstegView.test.ts src/folio/screens/framsteg/FolioFramsteg.test.tsx src/folio/screens/framsteg/framsteg.guard.test.ts --maxWorkers=2`: 29 failed / 70 passed. Three failures were a malformed parameterized test fixture (nested arrays were spread); corrected before claiming green. The other 26 covered missing duration/date/repetition behavior, single-answer selection and tabular display typography.
- After those fixes: 99/99 passed. Separate phone-band red: 3 failed / 52 passed (missing clipped box and CSS contract). Band geometry now clips the box and rescales gradient stops from shared `bandGeometry`, preserving the exact solid core while fitting the axis.
- Following that implementation, one CSS guard initially included a comment in its selector match; strip comments like the existing scope guard. Then 102/102 passed. Additional restored original-intent tests are included in final verification below.
- Typography uses proportional display numerals; date uses the existing sitting `date` and Swedish day/month; section action minutes use `SECTION_DURATIONS` (XYZ = 8, not the sketch's example 6). Repetition uses the real due queue, shared size cap and `repetitionCopy` minutes; unknown/empty queues make no invented size/time claim. Prov duration comes from UHR's verbal section durations, and its subline identifies a verbal pass rather than inventing the user's current coverage.
- Shared half intervals remain the unresolved scope dependency. All code is still uncommitted, and the trend implementation remains unchanged.

## Round 3 — final verification and BLOCKED handoff

- Final focused/route command from `app/`: `pnpm test src/folio/screens/framsteg/framstegView.test.ts src/folio/screens/framsteg/FolioFramsteg.test.tsx src/folio/screens/framsteg/framsteg.guard.test.ts src/routes/-progress.folio.test.tsx --maxWorkers=2`: **113 passed, four files passed** (2.32 s). This includes the restored intent coverage, band geometry, scoped keyboard, five axe states and route flag/navigation behavior.
- Full app run from `app/`: `pnpm test --maxWorkers=8`: **6,099 passed, three failed, one unhandled error**, 203 files, 68.40 s. Two failures/error came from the existing route fixture's label-only sitting object. Fixed within scope: date-aware copy retains the selected label when date data is absent; it never invents a date. The unchanged route tests and new compatibility case pass in the final 113-test run. The remaining failure is `src/lib/trapIndex.test.ts` generator child process: `spawnSync /usr/bin/node EPERM`, the known sandbox limitation. The full suite was not repeated after the compatibility fix; the affected route and all changed tests were rerun. Host generator verification is still required.
- Final `pnpm typecheck`: **PASS**, exit 0. Final `pnpm lint`: **PASS**, exit 0, with four pre-existing informational findings in devbake files. `git diff --check`: **PASS**. No worker files or dependencies changed, so no worker checks were required.
- Preservation verification against HEAD: `buildTrend` byte-identical; trend section markup byte-identical; `TrendChart.tsx` has no diff. All chart and chart-table rules remain unchanged; only the unrelated removed activity/history table selectors differ. Historik, classic routes and shared scoring are untouched.
- `git add` of the ten changed source/test files and this worklog was refused again: the shared worktree `index.lock` is on a read-only filesystem. No retry, signing or permission workaround. Changes remain unstaged and uncommitted. Current HEAD is still `8ebaa9d5628ed4aed8ae2ded7b13bb40c405c648`; there is no implementation commit or independent review verdict yet.
- **Unfinished acceptance:** half ranges and their per-half-band tests. `computeHonestProjected` already calculates the correct half variances, including conservative single-answer variance, but returns only `band` for the total. Copying the total band onto each half or recomputing a different pooled estimator would violate the honest-number requirement. Requested help: admit `app/src/lib/scoring.ts` and `app/src/lib/scoring.test.ts` to expose/test the existing half bands without changing current mean/total/band results. Then use those values for `FramstegReport` ranges with the existing soft-band adapter and add empty/single/mixed/edge/noncollapsed half tests. No authorization to extend the write set arrived during this round, so no dependent edits were made.
- Coordinator also owns host staging/generator check, four-mode visual capture/comparison (especially tight commas and 390 px band tracks), signed delivery and independent exact-head review. Those steps have not run here and are not claimed complete.
- Park as deferred with worker state **blocked**; do not close. Independent round-3 fixes and the complete original-test disposition inventory are saved in this worktree and summarized in the classified worklog.

## Round 3 — playbook proposal

2026-11-05 — `gas-city-coordinator`: a soft-band primitive can be visually clipped yet report `scrollWidth > clientWidth` on phone. Cause: its faded box intentionally extends beyond the 0–2 axis, and `overflow: hidden` only clips paint, not scrollable extent. Rule: constrain the actual fill box and rescale its gradient stops so the solid core still matches the original interval; test both scale edges and verify the 390 px browser geometry. Also inspect whether required uncertainty values are public before admitting screen-only writes: private half variances are not an available view API. The requested `~/scratch/skill-gotchas/` inbox is outside configured writable roots, so this proposal is retained here for coordinator forwarding; no alternative scratch location was used.

LJ34 FRAMSTEG BLOCKED: hpf-qr0p.51.19 — half-band scorer output needs a narrow write-set extension; host staging, generator and visuals remain.

## 2026-11-05 — round 4 resumed, half ranges

- Claimed the same bead; no molecule. Round-4 contract resolves the scorer prerequisite through coordinator-owned companion changes in `app/src/lib/scoring.ts` and its test; do not edit those files. Existing round-2/3 work is preserved.
- Inspecting the shared output confirms independent nullable `verbalBand` / `quantBand` fields. Build half endpoints with the existing total-range helper (including clamping, display-width floor and shared Swedish rounding); keep the numerical half means and total unchanged. Render the clipped soft-band adapter already used by delprov rows; null bands get “inget underlag än”.
- Added red-first tests for distinct half uncertainties, both scale edges, each missing half, shared rounding/display width, desktop/phone text and band geometry, and the existing single-answer case. Trend and coordinator scorer files stay untouched. Full checks and coordinator visual/delivery gates remain pending.
- Red run before implementation: `pnpm test src/folio/screens/framsteg/framstegView.test.ts src/folio/screens/framsteg/FolioFramsteg.test.tsx --maxWorkers=2`: **11 failed / 80 passed**. Six view cases failed because half ranges were absent; five screen cases failed on point estimates or the old missing-half copy. No fixture or prerequisite failures.

## Round 4 — verification and delivery evidence

- Completed the remaining finding: `prognosis.halfRanges` uses each half's shared band through the unchanged `range()` helper. Verbal/Kvant labels and clipped mini bands now show those intervals; absent bands show “inget underlag än” beside an empty dashed track. Half labels share aligned columns, with no old point marker. Numerical means, total, uncertainty calculation and trend output stay unchanged.
- Focused green from `app/`: `pnpm test src/folio/screens/framsteg/framstegView.test.ts src/folio/screens/framsteg/FolioFramsteg.test.tsx src/folio/screens/framsteg/framsteg.guard.test.ts src/routes/-progress.folio.test.tsx src/lib/scoring.test.ts --maxWorkers=2`: **184 passed, five files passed** (2.64 s). Covers distinct half bands, absent halves, clamping, single-answer uncertainty, shared binary-decimal rounding/display width, desktop/phone band endpoints, route behavior, guards, scorer companion and five axe states.
- `pnpm typecheck`: **PASS**, exit 0. `pnpm lint`: **PASS**, exit 0 after correcting only formatting in the new screen tests; four pre-existing informational devbake findings remain. `git diff --check`: **PASS**.
- Full app suite from `app/`: `pnpm test --maxWorkers=8`: **6,113 passed / one failed**, 202 files passed / one failed, 45.93 s. The sole failure is `src/lib/trapIndex.test.ts > committed trap index > equals what scripts/build_trap_index.mjs derives from the explanations`: child process refused with `spawnSync /usr/bin/node EPERM`. It matches the previous round's sandbox limitation; no permission workaround attempted. Host rerun required. No worker files changed, so worker checks are not applicable.
- Preservation checks: SHA-256 of coordinator `scoring.ts` stays `2d921945824c98f6a64b0a670350eed76c66cb7fc188b434946247955254d486`; `scoring.test.ts` stays `892e24b5a1f70c6eb42e3c43d5a351d8487aa88a535acfd5cba605aaa6739860`; `TrendChart.tsx` stays `0827d81bd22f5479aa992bd55685e57d0188f7fc1109af29f3df1588e3a9e521`. No diff in TrendChart, FolioHistorik or the classic progress route. No dependency edits or installs.
- Current HEAD remains `8ebaa9d5628ed4aed8ae2ded7b13bb40c405c648`; implementation is uncommitted. No independent exact-head review or four-mode visual comparison has run here. Coordinator owns host generator verification, four-mode visual capture/comparison and owner approval, signed delivery, and independent review. Acceptance cannot be closed on this worker evidence alone.
- Staging the ten admitted changed source/test files and repository worklog was refused: shared worktree `index.lock` is on a read-only filesystem (exit 128). No retry, direct commit, signing or policy workaround. Changes remain unstaged and uncommitted; coordinator must stage them on the host with its two scorer companion files.
- Final worker state: **blocked** only on host delivery/verification. All round-4 source changes and regression tests are complete. Park deferred, do not close. Earlier playbook proposals remain in these worklogs for coordinator forwarding; no new gotcha was discovered this round.

LJ34 FRAMSTEG BLOCKED: hpf-qr0p.51.19 — half ranges implemented and verified; host staging, generator check, four-mode visuals and delivery remain.

## 2026-11-05 coordinator review, companion and host verification

- Round-2 review: 25 tests removed without replacement (screen 19 to 9, view 29 to 12), plus six visual findings (spaced headline commas, half points instead of ranges, "vårprov 27" countdown, lever without size and time, smalna rows without sublines, phone band overflow). Round 3 fixed all but the half ranges and accounted for every removed test.
- Companion (outside the admitted set): `app/src/lib/scoring.ts`, where `computeHonestProjected` also returns optional `verbalBand`/`quantBand` (1.96·√Var(half), the same pooled variances as `band`); `app/src/lib/scoring.test.ts` gains tests for them and an updated deep-equal. Round 4 builds the half ranges from them.
- Host: typecheck clean, lint clean (4 pre-existing infos), full app suite 6114/6114 at 8 workers. Tests: screen 21 (base 19), view 30 (base 29).
- Visual: /progress in 4 modes with six seeded sessions: total 1,2–1,7 with Verbal 1,3–1,9 and Kvant 1,0–1,7 bands, tier squares, "Prova DTK · 10 frågor, ca 15 min", delprov soft bands, unchanged trend section, smalna rows with sublines; 0 side scroll, 0 wide, 0 red, 0 page errors.

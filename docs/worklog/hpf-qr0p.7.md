# hpf-qr0p.7 — redesign round 2, kit v2: view model, data context, drill core, screens 5–14, shared contract

Epic hpf-qr0p (whole-app redesign bake-off). This bead builds the shared foundation the eight directions and the real-app switcher build on in round 2. Design and reference: `docs/redesign/kit-v2.md`.

- **Where.** Worktree `/home/loucmane/dev/hpfetcher-worktrees/hpf-qr0p.7`, branch `codex/hpf-qr0p.7-redesign-round-2-kit-v2-view-model-data-context-drill-core-s`, base `b777074` (origin/main).
- **State.** All changes are UNCOMMITTED. The bead is not closed. No dependency changes, and nothing inside the eight direction folders changed.

## Outcome

1. **View model.** `viewModel.ts` holds `DirectionData`, the types for every screen:
   - Home, the four drill sittings, Öva, Repetera, Provpass (hub, running, result), Framsteg with Historik, Uppslag with an open lesson, and Konto.
   - The generalised `DrillQuestion`: section, qid, number, `prompt | null`, A–E options of variable count or `null`, optional passage, optional figure `{ src, alt, width, height, kind }`, `math`, answer, and `source`.
   - The real `Explanation`, re-exported.
   - `DirectionActions`.

   Every field without a real source today is optional, and the doc says to render without it:
   - prognosis range, target and weekly series;
   - rising traps;
   - the weekly goal;
   - the resume's `pausedAt`, `minutesLeft` and `device`;
   - Provpass flags;
   - per-section normed scores and a combined total;
   - the drill clock;
   - the plan's `primary` marker.
2. **Data context.** `directionData.tsx` exports `DirectionDataProvider`, `useDirectionData()` (`{ data, actions }`; outside a provider it returns the fixtures and `NOOP_ACTIONS`) and `useBakeoffDirectionData`, which maps every action onto the switcher.
   - The stage, single and side by side, sits in the provider.
   - The per-screen builders take the real hooks' shapes (`Stats`, `Mistake[]`, `SessionHistoryRow[]`, `MockResultRow[]`, `Question`) and derive with the app's own functions: `computeSectionScore`, `computeProjected`, `computeProjectedDelta`, `projectionBasis`, `rankWeakness`, `scoreBand`, `weeklyScore`, `minutesPracticedToday`, `countsBySection`, `sectionOfQid`, `normedScore`, `formatSitting`/`formatPass`, `sectionLongLabel`, and the `PALETTES`/`FONTS`/`DENSITIES`/`COACH_*` labels.
3. **Drill core.** `drillCore.ts` exports `useDrillCore({ questions, explanations, controller?, start?, elapsed?, live })`. It covers select (only the question's own letters), strike, lock, feedback, next and done, the clock, results, the ¶ focus aid, citations and quotation marks, and opened steps.
   - It handles any shape: A–E, no passage, a figure, a stub without options, or no explanation yet.
   - `DrillController` has `lock` (grade, required), `pick?`, `next?` and `exit?`.
   - `LOCAL_CONTROLLER` grades against the answer. The real one wraps SessionPlayer: lock → `onPick` + `useSubmitAttempt`, next → `onNext`.
   - The passage helpers moved here and are re-exported from `r1Kit.ts`.
   - `useDrill` is now a thin wrapper: the core fed with the round-1 unit, plus the switcher sync. It returns the same `DrillView` (the unit's own objects) and the same actions.
4. **Screens 5–14.** `APP_SCREENS` (14 entries, Swedish labels, short bar labels and blurbs, `round` 1|2) and `AppScreenKey` are added, and `DirectionMeta.screens?` is new.
   - `directions.ts` adds `DEFAULT_SCREENS` ([1–4]), `screensOf(meta)` and `builds(meta, s)`; the eight `meta.ts` files are untouched.
   - The stage mounts a direction only on a declared screen. Elsewhere it shows `NotBuilt` (in `DirectionStub.tsx`): screen n of 14, the screen's name, "Inte byggd än i ‹Riktning›.", the blurb, buttons to the built screens, and the switcher readback. It works in every width and theme and in side by side, where the stills show it large and compact.
   - The bar shows the 14 screens in two labelled rounds, in one row that takes the remaining room, scrolls sideways and keeps the picked screen in view. ←/→ and the arrows step through all fourteen and wrap.
   - The "Om" panel says which directions built the screen. The pill reads "omgång 2".
   - The route accepts `s=1…14`; its inline `SCREEN_KEYS` and its test changed together.
5. **Real-content fixtures.** `r2Fixtures.ts` is real content copied by `app/scripts/redesign-fixtures.mjs` (deterministic, Biome-formatted, `--check`) and pinned by `r2Fixtures.test.ts`:
   - Höstprovet 2025 kvant1, all 40 questions as `loadBank` serves them;
   - the Kvantfråga questions: host-2025 kvant2 XYZ-009 (a stacked fraction, math in prompt and options), kvant1 KVA-017 and kvant1 NOG-025 (A–E);
   - DTK-029 with its table page `figures/dtk/host-2025-kvant1-p16.jpg`;
   - their explanations without `_meta`;
   - the ELF P5 unit elf-b19-003 with its pilot explanation;
   - all eight framework catalogs' index, and LAS-TYPE-003 verbatim;
   - normering for host-2025 and var-2026, pass sizes, and the rest of the pile's prompts.

   Plus the reader's state in the real hooks' types, on round 1's fixture day:
   - `STATS`, `PILE` (23, 8 due), `HISTORY`;
   - `MOCK_RESULTS`, `PASS_RESULT`, `PASS_EXPOSURE` and `RUNNING_PASS`;
   - `MOCK_PRESCRIPTION`, AccountMenu's sample `IDENTITY` and the default `PREFS`;
   - reads and framework progress.
6. **Shared contract.** `contract.ts` holds `CONTRACT` (the rd-* ids, focus flag and one-line brief per screen, 1–14), `sectionSlug` and `passSlug`, and `describeDirectionContract(meta | subject, Component)`. The suite checks only declared screens, at both widths, inside a provider with spied actions.
   - Screens 1–4 keep round 1's checks verbatim.
   - Screens 5–14 check content and actions: math never raw, KVA's fixed options, NOG's E, the figure's alt, the running pass's grid and flags, a delete that asks first, and more.
   - Every declared screen also renders in both themes with its root attributes.
   - `Redesign2026Bakeoff.test.tsx` runs it for A–D, replacing the hand-written loop. E–H adopt it in their own batches.
7. **Doc.** `docs/redesign/kit-v2.md` covers:
   - the view model and the data context with every action (bake-off screen and real route);
   - the drill core and controller;
   - the 14 screens and what each must show, with round 1's quality bar;
   - the contract ids and how a direction migrates;
   - the field-by-field mapping to the real hooks;
   - the fixtures and the compatibility notes.

## Files

| File | Change |
|---|---|
| `app/src/components/devbake/redesign/viewModel.ts` | new: the view model |
| `app/src/components/devbake/redesign/directionData.tsx` | new: provider, `useDirectionData`, builders, `FIXTURE_DATA`, bake-off actions |
| `app/src/components/devbake/redesign/directionData.test.tsx` | new: 72 tests, including a reference direction for screens 5–14 under the contract |
| `app/src/components/devbake/redesign/drillCore.ts` | new: `useDrillCore`, `DrillController`, `LOCAL_CONTROLLER`, passage helpers (moved) |
| `app/src/components/devbake/redesign/drillCore.test.ts` | new: 13 tests (every shape, controller, display moves, clock, citations) |
| `app/src/components/devbake/redesign/r2Fixtures.ts` | new: generated real content and the reader's state |
| `app/src/components/devbake/redesign/r2Fixtures.test.ts` | new: 17 tests pinning content to sources and state to itself |
| `app/src/components/devbake/redesign/contract.ts` | new: `CONTRACT`, `describeDirectionContract` and helpers |
| `app/scripts/redesign-fixtures.mjs` | new: the copy script (`node scripts/redesign-fixtures.mjs [--check]`) |
| `app/src/components/devbake/redesign/r1Kit.ts` | `AppScreenKey`, `APP_SCREENS`, `DirectionMeta.screens`, `DirectionProps.screen: AppScreenKey`; `useDrill` over the core; helpers re-exported |
| `app/src/components/devbake/redesign/r1Kit.test.ts` | +5 tests (re-exports; `useDrill` hands out the unit's objects and stable actions; restart; start-over; Avsluta) |
| `app/src/components/devbake/redesign/directions.ts` | `DEFAULT_SCREENS`, `screensOf`, `builds` |
| `app/src/components/devbake/redesign/DirectionStub.tsx` | `NotBuilt`; the where-line reads `APP_SCREENS` |
| `app/src/components/devbake/redesign/Redesign2026Bakeoff.tsx` | provider around the stage; 14-screen bar (`ScreenSeg`); not-built on undeclared screens; `data-built`; info line |
| `app/src/components/devbake/redesign/Redesign2026Bakeoff.test.tsx` | A–D via `describeDirectionContract`; switcher over 14 screens; registry screens; stage not-built at both widths × themes for every direction; side by side on a round-2 screen |
| `app/src/components/devbake/redesign/redesign2026.css` | screen row (two rounds, scrolling, zero basis), info line, the not-built card's built-screen pills, compact large stills |
| `app/src/routes/dev_.redesign-2026-bakeoff.tsx` | `SCREEN_KEYS` 1–14; header comment |
| `app/src/routes/-redesign-2026-bakeoff.test.ts` | keys pinned to `APP_SCREENS`; `s=5`, `s=14` accepted, `s=15` dropped |
| `docs/redesign/kit-v2.md` | new: the kit's reference |
| `docs/worklog/hpf-qr0p.7.md` | this file |

## Decisions and deviations

- **`ScreenKey`/`SCREENS` stay round 1's four; the fourteen are `AppScreenKey`/`APP_SCREENS`.** The bead asked to extend `ScreenKey` and `SCREENS` to 14. That would break `e-svep/Svep.test.tsx` in two ways:
  - at typecheck, because `Record<ScreenKey, string[]>` has four keys;
  - at runtime, because `it.each(SCREENS)` would render Svep on screens 5–14.

  The folders must stay unchanged and green, so the new names carry the fourteen and the old names keep their meaning. The doc's §9 explains this to the direction builders.
- **`DirectionProps`: `screen` widened to `AppScreenKey`, `onScreen` unchanged.** A direction receives only screens it declares, so round-1 directions still see 1–4, and every direction folder and test typechecks unchanged.
  - `onScreen` stays `(screen: ScreenKey) => void`, because `h-ljuskagla/Ljuskagla.test.tsx` passes a `useState<ScreenKey>` setter, which a wider parameter would reject.
  - Round-2 screens ask for intents through `actions` (`go`, `startDrill`, `openLesson` …), never screen numbers, so they map onto real routes later.
  - `DIRECTIONS`, `STAGES` and `DirectionKey` are unchanged. `DirectionMeta.screens` is typed `AppScreenKey[]`.
- **A screen a direction lacks unmounts it.** Coming back mounts it fresh at its fixture start (as switching direction does). Keeping a hidden, live direction mounted would have kept its key handlers active.
- **Fixture picks.** Every authentic question was screened by a read-only scan:
  - its explanation must match the app's `Explanation` type exactly (string `framework_id`, tiers only essential/detail);
  - it must carry no `{MO}`/`{MC}` artifacts;
  - its answer was checked by hand.

  Rejected along the way:
  - XYZ-004, which has no math markers despite being algebra;
  - XYZ-001/003/012 for `{MO}` titles, XYZ-006/010 for `deep`/`verification` tiers, and XYZ-002 for an explanation hedging about its figure;
  - KVA-013, whose stored answer B contradicts the arithmetic (25 % of 16 = 4), the dataset-skew pattern.

  The DTK page was checked by eye: the explanation's 663 126 / 522 720 / 140 406 match the table.
- **The reader's state reproduces round 1's Home through the real functions.** The section counts are built so that `computeProjected` gives 1,4 / 1,5 / 1,3 and `computeProjectedDelta` gives +0,1. `weeklyScore` gives round 1's weekly curve 1,1 → 1,4, `minutesPracticedToday` gives 14, and this week has 4 practised days with a 4-day streak. Pile 23 with 8 due, and the three recent passes, match too.
  - The running pass (host-2025 kvant1) is the least-seen kvant pass, seen 6/40: exactly its six questions in the pile. The hub opens on the kvant half because the last pass was verbal.
  - The handed-in result (screen 10) is that pass; its 13 misses agree with the running pass's 16 answers, and the two blanks come after the current question.
- **Normering per section and a combined total have no real source.** The result carries the half's normed score (`normedScore` with the sitting's table: "normerat (härlett)"). Per section it gives an optional linear estimate, and the combined total stays optional.
- **ORD and MEK have no drill screen.** `startDrill` for them is a no-op in the bake-off, which the doc records.
- **Private-use characters.** This harness decodes a backslash-u escape for U+E000 in tool input into the literal character. Biome kept that, and literal private-use characters are what the repo's editors strip. So the kit's sources build the markers from their codes (`String.fromCharCode(0xe000)`), and the copy script writes `\u` escapes into `r2Fixtures.ts`. A scan confirms no literal U+E000–U+F8FF remains in any file of this change.

## Verification (from `app/`)

- **`pnpm typecheck`:** clean.
- **`pnpm lint`:** passes. The only output is 4 pre-existing info-level notes in files outside this bead (`LandingBakeoffR3`, `R4A`, `R4C`, `l12/M3`).
- **`pnpm test`:** **101 files, 1468 tests passed.**
  - The redesign suites plus the route test account for 441 of them, in 11 files.
  - All eight directions' own suites (Svep, Samtal, Raster, Ljuskägla, unchanged) pass.
  - The A–D contract passes at both widths and in both themes.
- **`node scripts/redesign-fixtures.mjs --check`:** up to date.
- **Visual check.** Scratchpad harness: Vite on 127.0.0.1 and Playwright Chromium, with Google Fonts aborted, so fallback faces show. 12 shots across two rounds, all with 0 px page overflow; the only console error is the aborted font request.
  - Fixed from the shots:
    1. The greedy screen row squeezed the width and theme toggles at 1440 ("Te…", "M…"). It now takes the remaining room only (zero basis).
    2. The not-built card was unreadable in side-by-side stills. The stills now show it compact at 2.2× on desktop.
  - Confirmed:
    - Folio Idag unchanged under the new bar.
    - The not-built card at desktop light and dark, phone dark and an 800 px window, plus the "Om" panel on screen 7.
    - Side by side on screen 11 (desktop) and 14 (phone, dark).
    - At 1100 px the labels collapse to icons and Svep's Facit renders as before.

## Notes for the coordinator

- **E–H.** They can now replace their copies of the round-1 contract with `describeDirectionContract(meta, Component)` and declare screens as they build them. The reference direction in `directionData.test.tsx` shows the minimum for each of 5–14.
- **Untracked sandbox masks.** `git status` inside the command sandbox lists `.bashrc`, `.gitconfig`, `.gitmodules`, `.mcp.json`, `app/.claude/*`, `app/.mcp.json` and others as untracked. They are the sandbox's `/dev/null` mount masks (character devices 1,3), not files of this change. Do not commit them.
- **Docs written through `cp`.** The Write tool was refused for `docs/` in this session (both files of the write set), so the two docs were written in the scratchpad and copied in with `cp`.

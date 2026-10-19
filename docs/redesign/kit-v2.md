# Redesign kit v2 — the shared foundation for round 2

Bead hpf-qr0p.7, epic hpf-qr0p. Round 1 (docs/redesign/2026-10-round1-brief.md) showed eight directions on four screens with fixtures wired straight into each direction. Round 2 extends the directions to the whole app, and later onto the real app with real data behind a dev flag. Kit v2 is what they all build on:

| File (`app/src/components/devbake/redesign/`) | What it holds |
|---|---|
| `viewModel.ts` | The view model: TypeScript types for every screen, shaped so the real hooks can fill them. |
| `directionData.tsx` | `DirectionDataProvider` / `useDirectionData()`: `{ data, actions }`; the builders that derive the view model from hook-shaped data; the bake-off's mapping of actions onto its switcher, with one theme (`useSessionPrefs`). |
| `drillCore.ts` | `useDrillCore`: the drill's interaction state for any question shape, graded by a `DrillController`; passage parsing and ¶ citations. |
| `r1Kit.ts` | The bake-off's metadata, the 14 screens (`APP_SCREENS`), round 1's `useDrill` (now a thin wrapper over the core) and the small hooks. |
| `directions.ts` | The registry: `DIRECTIONS`, `STAGES`, and `screensOf(meta)` / `builds(meta, screen)`. |
| `contract.ts` | The rd-* test-id contract per screen and `describeDirectionContract(meta, Component)`. Test-only. |
| `r2Fixtures.ts` | Real content for screens 5–14 (copied by `app/scripts/redesign-fixtures.mjs`, pinned by `r2Fixtures.test.ts`) and the reader's state in the real hooks' own types. |
| `DirectionStub.tsx` | The "Under arbete" stub and the shared **"Inte byggd än i ‹Riktning›"** card. |

Everything here has no look of its own. Each direction stays a self-contained design system in its folder.

## 1. The screens

The switcher has fourteen screens in two rounds. `?s=1…14` selects one, ←/→ steps through all of them (wrapping), and side by side works on every screen.

A direction declares the screens it has built in its `meta.ts`. Until it does, it has round 1's four:

```ts
// a-folio/meta.ts
export const meta: DirectionMeta = { key: 'a', slug: 'a-folio', …, screens: [1, 2, 3, 4, 5, 6, 11] }
```

The stage mounts a direction only on its declared screens (`builds(meta, s)`). On every other screen it shows the calm shared card instead, at both widths and in both themes, and in the side-by-side stills too. The card names the screen, says "Inte byggd än i Folio.", shows the screen's blurb and links to the screens the direction has built. Leaving for an undeclared screen unmounts the direction, so it opens fresh when you come back.

The quality bar is round 1's and applies to every screen (brief §"Craft bar" and §"Reading UX"):

- one obvious next action per screen;
- calm reading and focus;
- Swedish UI copy, real dashes and quotation marks (”…”);
- `tabular-nums` for numbers;
- body text at 7:1 contrast and UI at AA;
- `:focus-visible` rings and hit targets of at least 44 px;
- reduced motion honoured;
- dark mode lowers chroma and is never pure black;
- the reading surface is always opaque;
- the five destinations and the account are reachable from every non-drill screen;
- a drill is focus mode, with an always-visible Avsluta.

| # | Screen | What it must show | Data (`useDirectionData().data`) |
|---|---|---|---|
| 1 | Idag | Home mid-journey: countdown, one dominant resume card, today's plan (one primary), prognosis with its caveat, a trap, recent passes. | `home` |
| 2 | Läsfråga | The LÄS drill in focus mode: a real P5 passage with ¶ numbers, ÖVNINGSTEXT outside the passage and the note on demand, options with keys, the clock, Avsluta. | `drills.reading` (round 1: `useDrill`) |
| 3 | Facit | The same question after a wrong answer: verdict (glyph and word), right answer, solution, steps in two tiers, every distractor, technique, pitfall, ¶ links, one Nästa. | `drills.reading` |
| 4 | Navigering | The menu in its other state (folded or shrunk) with the account and settings open. | `home`, `konto` |
| 5 | Öva | All eight sections: each with its score and waiting misses, the weakest marked. Repetera with what is due now. A mixed drill and the common traps. A section starts its drill. | `ova` |
| 6 | Kvantfråga | The quant drill: XYZ with math rendered (never raw markers), KVA's prompt split into Kvantitet I/II with its four fixed options, NOG's two statements and five options, then feedback with steps. | `drills.quant` |
| 7 | DTK | A real DTK figure page (a table) beside the question, zoomable and rotatable, with its alt text and the options within reach, then feedback. | `drills.dtk` |
| 8 | Repetera | The misses: the ones due now first, then the rest of today's pile. Each shows its section, question and trap. One clear start. | `repetera` |
| 9 | Provpass | The hub: both halves (55 min, 40 questions, their sections), authentic passes with what you have seen, earlier results, the rules. Starting a pass shows it running: clock, question grid with answered and current cells, flags, Lämna in. | `provpass.hub`, `provpass.running` |
| 10 | Provpassresultat | The handed-in pass: correct of presented, the normed score and how it was derived, each section against its share of the time, what was seen before, earlier passes of that half. | `provpass.result` |
| 11 | Framsteg | Prognosis with caveat and weekly curve, all eight sections with score and uncertainty, the week's rhythm with nothing to lose, the 84-day heat, Historik (finished passes). | `framsteg` |
| 12 | Uppslag & lektion | The framework catalogs per section with read and progress state. One open lesson: its attack protocol and common distractors, read and practise. | `uppslag` |
| 13 | Konto & inställningar | Identity, every preference (palette, mode, font, density, coach voice), export, and a delete that asks first. | `konto` |
| 14 | ELF-läsfråga | The ELF drill: a real English P5 text in a `lang="en"` container, ÖVNINGSTEXT outside it, the question, A–D, feedback (English explanation). | `drills.elf` |

## 2. The view model (`viewModel.ts`)

`DirectionData` is everything a direction can show:

```ts
type DirectionData = {
  home: HomeView
  drills: { reading; quant; dtk; elf: DrillSessionView }
  ova: OvaView
  repetera: RepeteraView
  provpass: { hub: ProvHubView; running: ProvRunningView; result: ProvResultView }
  framsteg: FramstegView
  uppslag: UppslagView
  konto: KontoView
  copy: { ovningstextBadge; ovningstextNote; estimateCaveat }  // approved copy
  frameworks: Record<string, string>                            // id → headword
}
```

Conventions:

- **Units.** Scores are numbers on 0–2.0, which a direction formats (`fmtScore`, `fmtDelta`). Times are seconds; dates are ISO strings.
- **Math.** It travels between U+E000 and U+E001 in prompts, options and explanations. Render it with `@/components/MathText` (KaTeX), or `flattenMathText` for an accessible name. `DrillQuestion.math` says whether a question has any. The contract checks that no raw marker or LaTeX command reaches the screen.
- **Optional fields.** A field with **no real source** today is optional. Directions must render well without it: leave the element out, never show a placeholder. These are:
  - the prognosis range (`low`/`high`), its target and its weekly series as a projection;
  - "rising" traps;
  - the weekly goal;
  - the resume's `pausedAt` and `minutesLeft` (and `device`);
  - Provpass flags;
  - per-section normed scores and a combined Verbal+Kvant total;
  - the drill clock;
  - the plan's `primary` marker.

  The mapping in §7 lists every one.
- **Sections.** Codes are the bank's (`ORD … DTK`, with Ä). Test ids use `sectionSlug` ('LÄS' → `las`).

The generalised question (`DrillQuestion`) covers every shape the bank has:

```ts
type DrillQuestion = {
  qid: string; section: Section; number: number
  prompt: string | null                        // ELF gap items have ''
  options: DrillOption[] | null                // A–E, four or five; null = a stub
  answer: AnswerLetter
  passage?: DrillPassage | null                // paragraphs, byline, lang, synthetic (ÖVNINGSTEXT), title
  figure?: DrillFigure | null                  // { src, alt, width, height, kind: 'svg' | 'raster' }
  math: boolean
  source: { examId; provpass; authentic; label }   // "Hösten 2025 · Provpass 2"
}
type DrillSessionView = { id; request: DrillRequest; title; questions; explanations; start; elapsedSeconds?; wrongPick? }
```

- **Explanations.** These are the real `Explanation` type (`@/data/explanations`), re-exported.
- **KVA and NOG prompts.** They stay as the bank has them. Split them with the app's own `splitKvaPrompt` (`components/drill/KvaPrompt`) and `parseNogPrompt` (`lib/nogPrompt`).
- **Image options.** Option figures (the 11 DTK pie-chart options) carry `figure` with `text` as the accessible label.

## 3. The data context (`directionData.tsx`)

```ts
const { data, actions } = useDirectionData()
```

The bake-off wraps its stage, single or side by side, in `<DirectionDataProvider data={…} actions={…}>`, fed by `useBakeoffDirectionData`. A host may implement only some actions: the provider fills the rest with `NOOP_ACTIONS`. Outside any provider, `useDirectionData()` returns `FIXTURE_DATA` with `NOOP_ACTIONS`, so a direction's own tests can mount it bare, and the drill still grades.

| Action | What a screen asks for | The bake-off (switcher) | The real app (later) |
|---|---|---|---|
| `go(dest)` | one of the five destinations | Idag 1 · Öva 5 · Provpass 9 · Uppslag 12 · Framsteg 11 | `navigate({ to: TAB_ROUTE[…] })` (`lib/nav`) |
| `resume()` | Home's primary action | 2 | the resumption candidate's `href` |
| `openPlanItem(id)` | a plan row | repetition 8 · lesson 12 · mock 9 · drill by section | `navigate(item.href)` (split `?query`, as `routes/index.tsx` does) |
| `startDrill(req)` | a drill | LÄS 2 · ELF 14 · DTK 7 · XYZ/KVA/NOG/mixed/repetition 6 · ORD/MEK none | `/drill?section=S&start=1`, `/drill?mixed=1`, `/drill?section=S&framework=ID`, `/drill?section=S&weak=1`, `/repetition?start=1` |
| `openRepetera()` | Repetera's queue | 8 | `/repetition` |
| `openLesson(id)` | a framework entry | 12 | `/lektion?section=S#ID` |
| `toggleLessonRead(id)` | mark read | kept for the session | `useLessonReads().toggleRead` |
| `openKonto()` | the account | 13 | `/konto` |
| `startProvpass(passId)` | start a pass | 9 (the screen shows it running) | `/prov?run=1` after the ConfirmSheet; `useStartSession` |
| `submitProvpass()` | hand in | 10 | MockRunner's settle → `useSubmitMockResult` |
| `openProvResult(id)` | a result | 10 | `/prov?result=ID` |
| `setTheme(t)` | light/dark | sets the switcher's `t` (through `onTheme`) | `useSyncedPrefs().setMode` |
| `setPrefs(patch)` | palette, font, density, coach, smart drills; `mode` is `setTheme(mode)` | kept for the session; `mode` sets `t` like `setTheme` | `useSyncedPrefs()` setters |
| `exportData()` | export | nothing | `useExportData()` → `downloadExport` |
| `deleteAccount()` | delete (after the screen's own confirm) | nothing | `useDeleteAccount()` → Clerk `signOut()` |
| `signOut()` | sign out | nothing | Clerk `signOut()` → `/sign-in` |
| `drill` | the `DrillController` for `useDrillCore` | grades against the answer; `exit` returns to the screen the drill was started from | wraps SessionPlayer: lock → `onPick`, next → `onNext` (§4) |

Round 1's `DirectionProps.onScreen` keeps moving the switcher between screens 1–4 (lock → Facit, Nästa → Läsfråga, Avsluta → Idag). Round-2 screens ask through `actions` instead: they express intent, never a screen number, so the same screen works in the real app.

**One mode.** There is one theme state, and `data.konto.prefs.mode` is it, never a copy. The host derives `prefs.mode` from the same state that drives `DirectionProps.theme`, so the theme on display, `theme` and `prefs.mode` always agree:

- on the first render, including from `?t=dark`;
- after the bar's Tema;
- after any of a screen's three ways to change the mode: `actions.setTheme(t)`, `actions.setPrefs({ mode: t })`, or round 1's `DirectionProps.onTheme(t)`. All three set that one state.

A direction may use any of them. New screens should use `actions.setTheme`, and read the mode from `theme` or `prefs.mode`, which are the same value.

- **The bake-off.** The state is the switcher's `t`. `useBakeoffDirectionData({ screen, theme: sel.t, onScreen, onTheme })` builds on `useSessionPrefs({ theme, onTheme })`, which holds the other preferences for the session and returns `prefs` with `mode: theme`.
- **The real app.** The state is `useUiStore().mode`, written through `useSyncedPrefs().setMode`. A real provider reads `prefs.mode` from the store, not from a second copy.
- **Outside a provider.** The fixtures say `light` and `setTheme` does nothing. Test theme behaviour through `mountDirection` (§5), whose stage keeps one theme.

## 4. The drill core (`drillCore.ts`)

```ts
const { view, act, refs } = useDrillCore({
  questions: session.questions,
  explanations: session.explanations,
  start: session.start,            // { index, results, graded? } — read on mount
  elapsed: session.elapsedSeconds,
  controller: actions.drill,       // default LOCAL_CONTROLLER
  live,                            // false in the side-by-side stills: the clock stands still
})
```

- **State.** It holds what a drill needs for any question shape: select (only letters the question has), strike, lock → feedback, next → the next question or `done`, the session clock, results, the ¶ focus aid, cited paragraphs and quotations (`stepCites`, `distractorCites`, `cited`, `marks`, `cite(n, source)`), and opened steps (`toggleStep`, `goToStep`).
- **No passage, missing explanation.** Without a passage the citations are empty and the focus aid stays off. A missing explanation (`null`, the real loader's "not yet") gives a verdict without one.
- **Refs.** `refs.para(n)` and `refs.step(n)` attach the scroll targets.
- **The controller grades and hears the moves:**

```ts
type DrillController = {
  lock: (q, letter) => { correct: boolean }   // required: grade (real: SessionPlayer.onPick + useSubmitAttempt)
  pick?: (q, letter) => void                  // highlighted, nothing recorded
  next?: (index | null) => void               // moved on; null = done (real: SessionPlayer.onNext)
  exit?: () => void                           // Avsluta (real: leave the route)
}
```

- **Who owns the position.** The core owns the position within `questions`. A real controller mirrors the moves it hears: lock records the attempt (with `peekExplanation(qid)?.framework_id` as `layer1Ids`, as SessionPlayer does), next advances the session.
- **Display moves.** `gradeAs`, `reopen` and `reset` exist only for the bake-off's switcher (Facit or Läsfråga clicked mid-question). They never call the controller.
- **Round 1's `useDrill`.** It is now the core fed with the round-1 unit, plus the switcher sync. It returns exactly the round-1 `DrillView` (the unit's own question, explanation and passage objects) and the same actions, so all eight directions work unchanged.

## 5. The contract (`contract.ts`)

```ts
// in a direction's own test, e.g. e-svep/Svep.test.tsx
import { describeDirectionContract } from '@/components/devbake/redesign/contract'
describeDirectionContract(meta, Svep)
```

The suite checks only the screens the direction declares (`screensOf(meta)`), at both widths. It mounts the direction inside a `DirectionDataProvider` with spied actions, so it can assert that a section starts its drill or a delete asks first. Every declared screen must also render in both themes with its root carrying `data-theme`, `data-width` and `lang="sv"`, and focus screens must carry `rd-exit`.

**The stage's one theme.** The mount (`mountDirection(Component, screen, width, theme?)`) holds one theme, with `useSessionPrefs` as in the bake-off. The direction's `onTheme` and its context's `setTheme` and `setPrefs({ mode })` are spies that also set that theme, and `stage()` reads back `{ theme, data }`. A theme switch is checked by what the stage then shows, whichever path the direction took:

- the stage's theme;
- the root's `data-theme`;
- `prefs.mode`.

This covers screen 4's toggle (to dark) and Konto's mode on 13 (to dark and back).

**Round 1's checks.** They are the hand-written A–D loop for screens 1–4, kept as they were, except the theme switch: screen 4 asserted that `onTheme` was called, and now asserts the theme shown. A–D pass it unchanged.

The ids per screen are listed in `CONTRACT`:

- **Placeholders.** `<dest>` is a destination, `<n>` a 1-based number, `<L>` an option letter, `<sektion>` a `sectionSlug`, `<pass>` a `passSlug` (`host-2025-kvant1`), and `<id>` a view-model id.
- **Shared ids.** Every non-drill screen carries `rd-nav-<dest>` ×5 and `rd-account`.
- **Feedback** (Facit, Kvantfråga and DTK):
  - `rd-lock`
  - `rd-verdict` with `data-correct`
  - `rd-next`
  - `rd-exit`
  - `rd-step-<n>`
  - `rd-step-toggle-<n>`
  - `rd-technique`
  - `rd-pitfall`
  - `rd-distractor-<L>`

| # | Ids |
|---|---|
| 1 | `rd-<riktning>` root, `rd-resume` (exactly one) |
| 2 | `rd-exit`, `rd-badge` (outside `rd-passage`), `rd-note-toggle`, `rd-note`, `rd-passage`, `rd-para-<n>`, `rd-option-<L>`, `rd-eliminate-<L>`, `rd-lock`, `rd-sheet` (phone, `data-state` peek/open/full) |
| 3 | feedback ids, `rd-cite-<n>` |
| 4 | `rd-account-menu`, `rd-theme-toggle` (themes the stage dark, by any of the three paths), `rd-collapse` (desktop) |
| 5 | `rd-ova-section-<sektion>` (each shows its waiting count), `rd-ova-repetera` (due-now count; opens Repetera), `rd-ova-mixed` |
| 6 | `rd-quant-prompt` (math rendered), `rd-quant-option-<L>`, feedback ids |
| 7 | `rd-figure` (an image named by the figure's alt), `rd-quant-prompt`, `rd-quant-option-<L>`, feedback ids |
| 8 | `rd-repetera-item-<n>` (shows its section), `rd-repetera-start` (exactly one; starts a repetition) |
| 9 | `rd-prov-half-verbal`, `rd-prov-half-kvant`, `rd-prov-pass-<pass>` (shows what was seen), `rd-prov-start` (starts the suggested pass of the hub's half), then `rd-prov-running`, `rd-prov-timer`, `rd-prov-grid`, `rd-prov-cell-<n>` (`data-answered`, `data-current`), `rd-prov-flag` (`aria-pressed`), `rd-prov-submit`; a start gate or hand-in confirmation gives its accept button `rd-confirm` (the contract checks the action waits for it) |
| 10 | `rd-prov-result`, `rd-prov-score`, `rd-prov-section-<sektion>`, `rd-prov-history`, `rd-prov-history-item-<n>` |
| 11 | `rd-framsteg-prognosis` (+ the caveat on screen), `rd-framsteg-section-<sektion>`, `rd-framsteg-week`, `rd-framsteg-history`, `rd-framsteg-history-item-<n>` |
| 12 | `rd-uppslag-section-<sektion>`, `rd-uppslag-entry-<id>` (at least the open lesson's section; opens a lesson), `rd-lesson` (the open lesson's title), `rd-lesson-read`, `rd-lesson-practice` |
| 13 | `rd-konto-identity` (name and e-mail), `rd-konto-mode-<light\|dark>` (themes the stage: `actions.setTheme`, `actions.setPrefs({ mode })` or `onTheme`), `rd-konto-<palette\|font\|density\|coach>-<id>` (calls `setPrefs`), `rd-konto-export`, `rd-konto-delete` → `rd-konto-delete-confirm`, `rd-konto-signout` |
| 14 | `rd-elf-passage` (inside `lang="en"`), `rd-para-<n>`, `rd-badge` (outside the passage), `rd-note-toggle`, `rd-note`, `rd-option-<L>`, `rd-lock`, `rd-verdict`, `rd-exit` |

`directionData.test.tsx` holds a minimal reference direction built on `useDirectionData()` and `useDrillCore` alone. It passes the contract for screens 5–14, so it shows both that the contract can be met and how to meet it. Its Konto themes through `actions.setTheme`, and two variants of it pass screen 13 through `setPrefs({ mode })` and through `onTheme`.

## 6. Migrating a direction

1. **Declare the screen** in your `meta.ts` (`screens: [1, 2, 3, 4, 5]`). The stage then mounts you on it, and the shared contract checks it.
2. **Read data from the context, not the fixture files.** Replace `import { PLAN, RESUME, … } from '../r1Fixtures'` with `const { data } = useDirectionData()`. The values are the same, now in view-model shape:

   | Round 1 | Kit v2 |
   |---|---|
   | `PLAN` | `data.home.plan` (kinds `lesson`/`drill`/`repetition`/`mock`; title + `detail`) |
   | `RESUME` | `data.home.resume` |
   | `PROGNOSIS` | `data.home.prognosis` (+ `caveat`) |
   | `TRAPS` | `data.home.traps` |
   | `RECENT` | `data.home.recent` |
   | `WEEK` | `data.home.week` |
   | `OVA_DUE` | `data.home.ovaDue` |
   | `ESTIMATE_CAVEAT` / `OVNINGSTEXT_*` | `data.copy` |
   | `FRAMEWORK_NAMES` | `data.frameworks` |

   Migrate one screen at a time; nothing else has to move with it.
3. **Ask for side effects through `actions`** (`actions.go('ova')`, `actions.startDrill({ kind: 'section', section: 'KVA' })`), never by computing a screen number. Keep `onScreen` for round 1's 1–4 transitions. Change the theme with `actions.setTheme` (`onTheme` keeps working; §3 "One mode").
4. **New drill screens** (6, 7, 14) use `useDrillCore({ ...data.drills.quant, controller: actions.drill, live })`. Screens 2–3 may keep `useDrill` until you move them.
5. **Tests.** Add `describeDirectionContract(meta, YourDirection)` to your folder's test and drop your copy of the round-1 contract. The suite covers your declared screens.

## 7. View model → real hooks, field by field

"No real source: optional" means the field must stay optional and directions must render without it. File paths are under `app/src/`.

### Home (`HomeView`) — `routes/index.tsx`, `screens/HomeMobile.tsx`

| Field | Real source |
|---|---|
| `today.dateLabel/shortDate/weekday` | `formatSwedishHeader(now)` (`lib/dates`) |
| `today.greeting`, `firstName` | `hourGreeting(now)` (HomeMobile); Clerk `user.firstName ?? fullName.split(' ')[0]` |
| `exam.id/label`, `daysLeft` | `useSitting(now)`, `useDaysRemaining(now)` (`stores/examStore`; `EXAM_SITTINGS`, `daysUntil` in `lib/dates`) |
| `exam.dateLabel/shortDate/name` | formatted from the sitting's `date` |
| `resume.section/kind/title/subtitle` | `useResumptionCandidate(now)` (`components/home/useResumptionCandidate`): `subject`, `headline`; the session's `sections` |
| `resume.position/total/answered` | `ActiveSession.position`, `plan.length` (`useActiveSessions`); answered = attempts so far (`useSessionAttempts`) |
| `resume.device` | `ActiveSession.device` → `deviceLabel` ("telefon"); present on sessions, optional here |
| `resume.pausedAt` | **No real source: optional** (sessions keep `startedAt` only; `freshAt` is the start) |
| `resume.minutesLeft` | **No real source: optional** |
| `resume.stale` | `FormattedResumption.stale` (older than 7 days) |
| `plan.items[]` | `useDailyPlan().plan.items` (`PlanItem`, `lib/scheduler`): `kind`, `section`, `framework`, `headline` → `title`/`detail` (split on " · "), `rationale`, `estimatedMinutes` → `minutes`, `completed`. The repetition row's numbers are live (`withLiveData`, `DailyPlanCard`) |
| `plan.minutes`, `allComplete` | `DailyPlan.estimatedMinutes`; `useDailyPlan().allComplete` |
| `plan.items[].primary` | **No real source: optional** (the plan's order is its priority: `items[0]` leads) |
| `prognosis.total/verbal/quant` | `computeProjected(SECTION_KEYS.map(computeSectionScore(s, stats.bySection[s], now)))` (`lib/scoring`) |
| `prognosis.delta` | `computeProjectedDelta(stats.bySection)` (null when the weeks don't compare) |
| `prognosis.weeks` | No real source as a projection: optional. Nearest: `stats.weekly.map(weeklyScore)`, pooled weekly accuracy (that is what the fixture derives) |
| `prognosis.low/high` | **No real source: optional** (only a per-section `scoreBand`) |
| `prognosis.target` | **No real source: optional** (ProgressMobile hard-codes `GOAL = 1.8`; the fixture's 2.0 is round 1's) |
| `prognosis.caveat` | `ESTIMATE_CAVEAT` when `projectionBasis(stats.bySection).total.calibrated` is false (P5 answers feed LÄS/ELF) |
| `traps[]` | `useTopTraps()` (`TopTrap`: `framework_id`, `section`, `count`, `headline`); `name` = the entry's headword (`entryHeadword`, `data/frameworks`); `pattern` = `headline` |
| `traps[].rising` | No real source beyond this device: optional. `TopTrap.trend.kind === 'delta' && trend.delta > 0` (localStorage trap history) |
| `recent[]` | `useSessionHistory().data.slice(0, 3)`: `sections ?? 'Repetition'`, `correct`, `total`, `endedAt` → `when` |
| `week.minutesToday` | `minutesPracticedToday(stats)` (null while loading) |
| `week.streakDays` | `stats.streakDays` |
| `week.daysPractised` | derivable: days of the current week with `stats.attemptsDaily[].n > 0` (as the fixture does) |
| `week.goal` | **No real source: optional** (prefs have `dailyMinutes`, not a weekly goal) |
| `ovaDue` | `usePileMistakes().data.length` (the nav badge) |
| `provpass` | `useDailyPlan().mockPrescription` (`MockPrescription`) |

### Drills (`DrillSessionView`, `DrillQuestion`) — `routes/drill.tsx`, `components/session/SessionPlayer.tsx`

| Field | Real source |
|---|---|
| `questions[]` | `pickQuestions()` / `resolvePlan(qids)` (`Question[]`, `data/questions`) mapped by `drillQuestion(q, dtkPages)` (`directionData.tsx`): `prompt`, `options`, `answer`, `context` → `parsePassage` (`lang` 'en' for ELF, `synthetic` for `p5-` exams), `figure` (`QuestionFigureMeta`; DTK pages from `/figures/dtk/_index.json`; `SUPPRESSED_FIGURES` drop out in `loadBank`) |
| `figure.alt` | No alt in the bank: the app says "Figur" (`QuestionFigure`); the fixture writes "Underlag/Figur till uppgift N" |
| `figure.width/height` | DTK: the index's pixels; SVG: a box from `aspect_ratio` |
| `explanations` | `loadExplanation(qid)` (null = not yet; `peekExplanation` for the attempt's `layer1Ids`) |
| `start.index/results` | SessionPlayer's `index`; earlier `picks` (from `useSessionAttempts` when a session is adopted) |
| `elapsedSeconds` | **No real source: optional** (SessionPlayer times each answer, `timeTakenMs`, not the sitting) |
| `wrongPick` | **No real source: optional** (the bake-off's Facit jump) |
| `request` | the route's search: `section`, `framework`, `weak`, `mixed`; `/repetition` |

### Öva (`OvaView`) — `routes/ova.tsx`

| Field | Real source |
|---|---|
| `sections[].score/trend/confidence/attempts90d/daysSince` | `computeSectionScore` (`SectionScore`); `band` = `scoreBand(score, attempts90d)` |
| `sections[].name` | `sectionLongLabel(section)` (`lib/sectionRailLabel`) |
| `sections[].waiting` | `countsBySection(usePileMistakes().data)` (`lib/dueBySection`) |
| `sections[].dueNow` | `countsBySection(useDueMistakes().data)` |
| `weakest` | `rankWeakness(scores)[0]?.section` |
| `repetera.dueNow/pile` | `useDueMistakes().data.length`, `usePileMistakes().data.length` |
| `mixed.questions` | `DEFAULT_DRILL_LENGTH` (`lib/drill`) |
| `weakTraps` | `useTopTraps()` (Öva doesn't show it today; Home does) |

### Repetera (`RepeteraView`) — `routes/repetition.tsx`, `api/hooks/useMistakes`

| Field | Real source |
|---|---|
| `items[]` order | `useDueMistakes()` (server order: `nextReviewAt` first, then `errorCount7d`), then the rest of `usePileMistakes()` |
| `items[].mistakeId/qid/errors/frameworkId` | `Mistake.id`, `questionId`, `errorCount7d`, `layer1Ids?.[0]` |
| `items[].section` | `sectionOfQid(questionId)` |
| `items[].prompt` | the bank's question (`findQuestion(bank, qid)?.prompt`) |
| `items[].dueNow/dueLabel` | `nextReviewAt <= now` (null counts as due) |
| `sessionSize` | `REPETITION_SESSION_SIZE` (`lib/replay`) |

### Provpass (`ProvpassView`) — `routes/prov.tsx`, `components/mock/*`, `lib/mock`, `lib/normering`

| Field | Real source |
|---|---|
| `hub.half` | `mockPrescription.half` (the next half) |
| `hub.halves[]` | 55 min (`resolveDurationMs`), 40 questions; sections from `lib/mock`'s quotas (Verbal ORD/LÄS/MEK/ELF 10 each, Kvant XYZ 12, KVA 10, NOG 6, DTK 12) |
| `hub.passes[]` | `listAuthenticPasses(bank, useExposure().data)` (`PassOption`: `presented`, `seenBefore`; least exposed first); `formatSitting`/`formatPass` (`lib/examNames`); `suggested` = the first of its half |
| `hub.results[]` | `useMockResults().data` (newest first); `score` = `normedScore(loadNormeringTable(examId), half, correct, presented).score`. The real hub shows only the latest; the list comes from the same hook |
| `hub.exposure` | summed `seenBefore`/`presented` over the listed passes |
| `hub.rules` | `ConfirmSheet`'s RULES |
| `running.questions/sections` | `resolveAuthentic(bank, examId, provpass)`; section runs as MockRunner's `sectionBoundaries` |
| `running.remainingSeconds` | `useCountdown(startedAt, durationMs).remainingMs / 1000` |
| `running.grid[].answered`, `answers`, `current` | MockRunner's sheet (`MockSheetState.answers`, `current`) |
| `running.flags`, `grid[].flagged` | **No real source: optional** (the runner has no flags) |
| `result.*` | the settled `MockResultRow`: `presented`, `answered`, `correct`, `seenBefore`, `durationMs`, `breakdown.perSection` (`timeMs`), `missedQids` |
| `result.score` | `normedScore(sitting, half, correct, presented)`: 'official-derived' ("normerat (härlett)") or 'linear' ("skattad") |
| `result.sections[].quotaSeconds` | 55 min × the section's quota / 40 (MockResult's pacing table) |
| `result.sections[].estimate` | No normed per-section score exists: optional; the fixture gives the linear `scoreFromFraction(correct/presented)` |
| `result.trap` | `useTrapCluster(missedQids)` (null under two shared misses; KVA/NOG/XYZ only) |
| `result.history` | `useMockResults().data` filtered to the same half and mode |
| `result.total` | **No real source: optional** (a pass is one half) |

### Framsteg and Historik (`FramstegView`) — `routes/progress.tsx`, `screens/ProgressMobile.tsx`, `routes/historik.tsx`

| Field | Real source |
|---|---|
| `prognosis` | as Home (§ above) |
| `sections[]` | `computeSectionScore` × 8 (+ `scoreBand`) |
| `focus` | `rankWeakness(scores).slice(0, 3)` |
| `week.streakDays/attemptsThisWeek/accuracy7d/minutesToday` | `stats.streakDays`, `stats.attempts.thisWeek`, `stats.accuracy7d`, `minutesPracticedToday(stats)` |
| `week.record` | longest run in `stats.attemptsDaily` (ProgressMobile computes it the same way) |
| `week.goal` | **No real source: optional** |
| `days` | `stats.attemptsDaily` (84 UTC days) |
| `weekly` | `stats.weekly.map(weeklyScore)` (12 rolling weeks, pooled accuracy) |
| `totals` | `stats.attempts.total`, `stats.drills.total`, `stats.mistakes.active/resolved` |
| `history[]` | `useSessionHistory().data` filtered to `drill` and `adaptive_review` (as Historik does); `when` = `formatSwedishDateShort(endedAt)` |

### Uppslag (`UppslagView`) — `routes/lektion.tsx`, `components/lesson/LessonReader.tsx`

| Field | Real source |
|---|---|
| `sections[].entries[]` | `loadFramework(section)` (`data/frameworks`): `id`, `entryHeadword(entry, framework)` → `title`, `tldr` → `summary`, `example_questions.length` |
| `entries[].read`, `open.read` | `useLessonReads().isRead(id)` |
| `entries[].status`, `open.status` | `useFrameworkProgress()` rows (`status`; absent = untaught) |
| `sections[].score` | `computeSectionScore(...).score` (the picker's "weakest first") |
| `open.entry` | the catalog entry verbatim (`ProtocolEntry` / `TrapEntry` / …), opened by `#ID` |
| `open.practice.questions` | `entry.example_questions.length` (`/drill?section=S&framework=ID`) |

### Konto (`KontoView`) — `routes/konto.tsx`, `routes/mer.tsx`, `components/account/AccountMenu.tsx`

| Field | Real source |
|---|---|
| `identity` | `useAccountIdentity()` (`Identity`: `name`, `email`, `initials`; the sample while Clerk loads, as the fixture) |
| `identity.plan` | **No real source: optional** ("Plan och betalning" is a placeholder section) |
| `exam` | `useSitting()`, `useDaysRemaining()` |
| `prefs` | `useUserPrefs()` / `useUiStore` / `useCoachStore`: `palette`, `mode`, `font`, `density`, `coach`, `smartDrill`, `showStreak`, `dailyMinutes` |
| `options.palette/font/density` | `PALETTES`, `FONTS`, `DENSITIES` labels (`lib/tokens`) |
| `options.coach` | `COACH_LABELS`, `COACH_BLURBS` (`lib/voice`) |
| `links` | `/hjalp` and `LEGAL_LINKS` (`lib/legal`) |

## 8. The fixtures (`r2Fixtures.ts`)

| Data | What it is |
|---|---|
| `PASS_QUESTIONS` | Höstprovet 2025, kvant1: all 40 questions as `loadBank` serves them, with DTK pages patched in and suppressed figures dropped |
| `QUANT_QUESTIONS` | Kvantfråga: host-2025 kvant2 XYZ-009 (a stacked fraction, math in prompt and options), kvant1 KVA-017 (`y > 0`, the four fixed options) and kvant1 NOG-025 (five options, math in the statements) |
| `DTK_QID` | kvant1 DTK-029: the *Pensioner* table, `figures/dtk/host-2025-kvant1-p16.jpg` |
| `QUANT_EXPLANATIONS` | their reviewed explanations, without `_meta` |
| `ELF_UNIT` | the P5 unit elf-b19-003 ("Counting Pots from the Pavement") from the sample export, with its pilot explanation |
| `FRAMEWORK_INDEX`, `OPEN_LESSON` | every catalog's index, and LAS-TYPE-003 *Författarens hållning* verbatim |
| `NORMERING`, `PASS_SIZES`, `PILE_PROMPTS` | normering tables and pass sizes; prompts for the rest of the pile |

**How the real content was picked.** All of it is authentic exam content or committed P5 content, copied by `app/scripts/redesign-fixtures.mjs` (`node scripts/redesign-fixtures.mjs [--check]` from `app/`). The script rewrites only the GENERATED block, formats with the app's Biome, and writes the U+E000/U+E001 markers as `\u` escapes. Each pick had to have:

- an explanation that matches the `Explanation` type exactly (string `framework_id`, tiers only essential/detail);
- no `{MO}` artifacts;
- an answer checked by hand.

**The reader's state** is invented but in the real hooks' types: `STATS: Stats`, `PILE: Mistake[]`, `HISTORY: SessionHistoryRow[]`, `MOCK_RESULTS`/`PASS_RESULT: MockResultRow`, `PASS_EXPOSURE`, `RUNNING_PASS`, `MOCK_PRESCRIPTION`, `IDENTITY` (AccountMenu's own sample), `PREFS` (the defaults), `LESSON_READS` and `FRAMEWORK_PROGRESS`.

The builders in `directionData.tsx` derive the view model from that state with the app's own functions. Round 1's Home comes out exactly:

- projection 1,4 (verbal 1,5, kvant 1,3) and +0,1 week over week;
- the weekly curve 1,1 → 1,4;
- 14 minutes today and a 4-day week;
- "8 av 23 missar";
- the three recent passes.

`r2Fixtures.test.ts` and `directionData.test.tsx` pin all of that, plus the internal consistency: the days add up to the weeks, every result adds up and its misses are real questions of its pass, the running pass agrees with the result it hands in, and the halves take turns.

## 9. Compatibility (what did not change, and why some names are new)

- **`ScreenKey` and `SCREENS` stay round 1's four; `AppScreenKey` and `APP_SCREENS` are the fourteen.** The directions' own tests key records on `ScreenKey` (`e-svep/Svep.test.tsx` has `Record<ScreenKey, …>` and `it.each(SCREENS)`). Widening those names would break folders this kit must not edit.
- **`DirectionMeta.screens` is typed `AppScreenKey[]`.**
- **`DirectionProps` keeps its fields and meaning.** `screen` now types the screen on stage as `AppScreenKey` (a direction only ever receives a screen it declares, so round-1 directions still see 1–4). `onScreen` stays `(screen: ScreenKey) => void`, because `h-ljuskagla`'s test passes a `useState<ScreenKey>` setter.
- **`DIRECTIONS`, `STAGES` and `DirectionKey` are unchanged.**
- **`useDrill`'s behaviour is unchanged.** It keeps its signature (its `screen` accepts `AppScreenKey`) and returns the same view. The passage helpers moved into `drillCore.ts` and are re-exported from `r1Kit.ts` under the same names.
- **The route** accepts `s=1…14`. Its `SCREEN_KEYS` stay inline (bundle boundary) and are pinned to `APP_SCREENS` by its test.

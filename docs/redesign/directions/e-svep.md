# E · Svep — round 2 screen design specification

Bead: `hpf-qr0p.37` · B0 · 2026-10-19. Source baseline: `1daccd10407b84f9247101f73b371662cd998034`.

Svep makes the next task tangible: one card in front, the next cards' edges behind it, and a register that keeps the whole task visible. Screens 5–14 extend that composition across practice, timed passes, progress, reference reading and settings. Comparison material stays together: two quantities, a diagram and its legend, or a lesson's worked example must not be broken apart merely to make more cards.

This is a **proposed design**, not a report of implemented screens or owner approval. All new UI copy below, including wireframe labels, is proposed unless explicitly identified as existing or approved. Numbers in wireframes are illustrative states, never defaults or claims about a learner. Existing question, answer, explanation and disclosure copy must come from the content source without paraphrase. UI examples are Swedish; English assessment content remains English.

## Source ground and handoff boundaries

| Evidence | What it establishes |
| --- | --- |
| [Svep metadata](../../../app/src/components/devbake/redesign/e-svep/meta.ts), [root/frame](../../../app/src/components/devbake/redesign/e-svep/Svep.tsx), [Home](../../../app/src/components/devbake/redesign/e-svep/SvepHome.tsx) | “Ett kort i taget”; horizontal desktop navigation, phone bottom navigation, one account trigger; seven-card Home; destinations outside Home are presently stubs. |
| [Deck](../../../app/src/components/devbake/redesign/e-svep/deck.ts), [parts](../../../app/src/components/devbake/redesign/e-svep/parts.tsx), [drill](../../../app/src/components/devbake/redesign/e-svep/SvepDrill.tsx), [CSS](../../../app/src/components/devbake/redesign/e-svep/svep.css), [tests](../../../app/src/components/devbake/redesign/e-svep/Svep.test.tsx) | Card placement, inert background cards, focus transfer, pointer/keyboard alternatives, reading pair, phone sheet, five-part feedback run, existing tokens and motion. |
| [Round-1 brief](../2026-10-round1-brief.md), [reviewer worklog](../../worklog/hpf-qr0p.md) | Five destinations; calm reading; contrast and sizing targets; critiques of look-alike layouts, clipped prompts, repeated indicators, hidden actions, and inflated error emphasis. |
| [Öva](../../../app/src/routes/ova.tsx), [drill route](../../../app/src/routes/drill.tsx), [repetition](../../../app/src/routes/repetition.tsx) | Eight sections, mixed practice, direct-start doors, scope-aware resume, ready-now queue versus today's pile, repetition batches and completed-session links. |
| [DrillQuestion](../../../app/src/components/drill/DrillQuestion.tsx), [KvaPrompt](../../../app/src/components/drill/KvaPrompt.tsx), [MathText](../../../app/src/components/MathText.tsx), [QuestionFigure](../../../app/src/components/drill/QuestionFigure.tsx), [question data](../../../app/src/data/questions.ts) | Quant structure, NOG statement parsing, formula rendering, SVG/raster figures, image answer options and ELF cloze handling. |
| [Provpass](../../../app/src/routes/prov.tsx), [confirmation](../../../app/src/components/mock/ConfirmSheet.tsx), [runner](../../../app/src/components/mock/MockRunner.tsx), [result](../../../app/src/components/mock/MockResult.tsx) | Authentic/generated modes, Verbal/Kvant, 55-minute clock, revisable answers, no feedback before submission, missing-question counts and honest score provenance. |
| [Framsteg](../../../app/src/screens/ProgressMobile.tsx), [Historik](../../../app/src/routes/historik.tsx) | Per-section evidence, uncertainty, weekly activity, focus recommendations; current history includes completed drills/repetition, not diagnostic or mock sessions. |
| [Lesson route](../../../app/src/routes/lektion.tsx), [LessonReader](../../../app/src/components/lesson/LessonReader.tsx), [lesson components](../../../app/src/components/lesson) | Section catalogue, bookmarks, read markers, trap/protocol/lexicon families and targeted practice. |
| [Konto](../../../app/src/routes/konto.tsx), [Mer/settings](../../../app/src/routes/mer.tsx), [theme modes](../../../app/src/lib/tokens.ts) | Identity, provider-managed sign-in, future billing, export/deletion deep in Konto, preference controls and visible tool links; production theme mode is only `light` or `dark`. |

The account source's opening “no deletion” comment is stale: the rendered page includes `DeleteAccountSection`. The lesson reader's NOG-only introductory comment is also stale: its dispatcher handles traps, protocols and lexicon. Follow the rendered behavior when reconciling those comments.

B1 builds screens 5–8; B2 builds 9–11; B3 builds 12–14. The parallel shared-data work (`hpf-qr0p.7`) owns the eventual data interface. The lists below specify information and state, not new TypeScript types, endpoints or stores. Existing production routes are semantic destination references; the bake-off must demonstrate those transitions inside its stage without accidentally leaving it for production.

## Shared Svep grammar

### Material, type and motion to reuse

| Role | Existing token or treatment | Rule for round 2 |
| --- | --- | --- |
| Matte table | `--sv-table-*`, `--sv-felt` | Existing tints: `las`, `elf`, `ord`, `rep`, `none`. Use `none` for quant, mixed practice, mock, progress and settings. There are no existing XYZ/KVA/NOG/DTK tint tokens. Section names remain visible in text. |
| Opaque card | `--sv-card`, `--sv-card-2`, `--sv-card-3`, `--sv-grain`, `--sv-light`, `--sv-rim`, `--sv-lift`, `--sv-lift-low` | Stock and two visible blank edges establish depth; reading and figures stay opaque. No new glass or ambient animation. |
| Ink | `--sv-ink`, `--sv-ink-2`, `--sv-ink-3`; corresponding table inks | Main text on card ink; metadata uses secondary ink. Reserve low emphasis for genuinely secondary content, never a required condition or disclaimer. |
| Next action | `--sv-accent: oklch(50% 0.2 352)` light, `oklch(52% 0.19 352)` dark; `--sv-on-accent` | One filled raspberry primary in the active state. Existing small current-card/nav marks may retain raspberry; secondary actions use ink or tonal stock. Selection is an ink rim and letter, not a second filled CTA. |
| Reading | `--sv-serif`: Source Serif 4 with optical sizing | Existing passage 19px/1.62 desktop, 17.5px/1.6 phone; target approximately 55–70 characters on desktop, natural shorter phone lines. Lesson prose follows this scale. Formula glyphs remain the math renderer's. |
| UI and display | `--sv-ui`: Schibsted Grotesk | Tight heavy headings, readable UI, tabular numbers. Quant prose/options use the UI face to align with formula apparatus. No third display font or new mono dashboard. |
| Corners and spacing | `--sv-r1: 10px`, `--sv-r2: 16px`, `--sv-r3: 28px`; existing phone reading cards 24px | Four-pixel spacing rhythm; nested radius follows the parent inset. Avoid rounding every small datum into a chip. |
| Feedback/evidence | `--sv-ok*`, `--sv-bad*`, `--sv-mark*`, `--sv-back` | Verdict glyph plus words; one restrained error signal. Ochre marks evidence only after grading. Correctness never uses raspberry. |
| Movement | `--sv-d-move: 240ms`, exit 200ms, half-turn 130ms, UI 120ms; `--sv-ease` | Deal only on deliberate card movement; turn only after practice submission. Existing reduced-motion mode uses opacity-only 180ms fades and removes sheet travel. Static thumbnails stay still. |

The dark table is tinted charcoal and the cards are warm charcoal stock, not inverted white or pure black. Carry the existing complete light/dark pairs forward. These are source values, not a fresh contrast certification. New combinations must meet the brief's body contrast ≥7:1 and UI AA targets.

### Layout and controls

- **Full frame:** retain Svep's five named destinations: Idag · Öva · Provpass · Uppslag · Framsteg. Desktop uses the existing top bar and folded hand of doors; phone uses the labelled bottom bar. The account trigger occurs **once**, at the top-right on both layouts. The brief permits desktop rails/docks; Svep's existing top bar is its direction-specific implementation. Do not add a sidebar-footer duplicate.
- **Focus frame:** running practice, repetition and mock omit the five doors and account control; an always-visible explicit exit, question position and clock replace them. Hubs, results, history, settings and lesson reading retain the full frame. Lesson reading is not a timed drill.
- **Desktop:** at 1440×900, a roughly 520–600px active hub card sits between a short orientation column and a named register. Reading/figure tasks use the existing two-card pair with a larger reference card and smaller question card. At narrower stage widths, reduce side space, then move the register below; never squeeze formulas or prose to preserve decorative edges.
- **Phone:** at 390×844, use one active card, 8px table margins around reading/figure sheets, a visible counter and a named register control. A sheet must measure its whole prompt, not truncate it. At large text/short heights, use a full-height question card with a visible return to the reference; every option and footer remains scroll-reachable above the safe area.
- **Deck register:** reuse `DeckCounter` and `DeckTicks` for small sets. New `SvepRegister` extends the existing `.sv-index` treatment into a visible labelled list on desktop and a button opening the same list on phone. For eight sections, many lessons, long history or 40 questions, do not cram all ticks into one row. Counts describe actual objects: “Kort 2 av 4”, “Fråga 7 av 40”, “Avsnitt 3 av 12”; do not mix denominators.
- **Keyboard/focus:** reuse inactive-card `inert` handling and focus transfer from `DeckStage`. Counter/index clicks keep their trigger focused; when a focused card leaves, focus the new card heading. Route changes focus the page heading; a modal restores its opener. Arrows change cards only within the active deck context; inputs, select/radio controls, text selection and scrollable figures keep their native keys. Global Enter never bypasses confirmation or activates a destructive action. Pointer gestures are optional, never the only way forward.
- **Gesture ownership:** horizontal deck gestures must not capture a table pan, formula scroll, selected text, input, link or button. The present `DeckStage` binds its whole stage; content-heavy screens need a proposed opt-out/handle boundary before reuse. Do not nest two swipeable decks. Moving a study card is not grading it or marking it read.
- **Accessibility:** minimum 44px hit areas, 48px main actions, visible 2px/2px-offset focus rings, logical headings, labels on every icon-only action and no color-only states. Inactive faces are absent from assistive navigation. A compact polite status announces card changes; clocks do not speak every second. At 200% zoom and the brief's text-spacing overrides, content reflows or scrolls inside a labelled region without clipping. Error messages name a useful recovery action.

In all ASCII diagrams, `NAV` means the five full destination labels above, `[K]` is the **single** account trigger, `>>` denotes the state's only filled primary action, and `))` denotes decorative waiting-card edges. Other bracketed controls are secondary. Wireframes describe hierarchy, not fixed heights or literal border characters in the UI.

### Shared question and feedback contract

Practice uses Svep's existing **select → Svara → feedback → Nästa → done** sequence, even though the production `DrillQuestion` commits on a click. Reuse its content semantics/renderers, not its grading callback or M3 layout unchanged. Selection remains revisable until Svara; shortcut hints reflect the actual available letters. Options can contain math or images. Never manufacture an E option to satisfy an old five-option brief.

In practice, `QuestionCards` is a progress readout, not a way to jump to an unanswered question. The feedback register changes explanation cards for the current answer. Only the mock register allows arbitrary question navigation during an active pass; completed-session review has its own explicit entry.

The feedback deck keeps the current order: outcome and correct answer; why the chosen distractor tempted and failed; pitfall and technique; solution with essential steps and optional detail; remaining distractors. Omit absent cards and recompute the counter. On a wrong-answer outcome card, the existing “Varför lockade A?” is primary; “Nästa fråga” is quiet. Once that explanation opens, Nästa becomes primary. A correct answer promotes Nästa immediately. Paragraph/step references stay source-backed; quant and DTK do not acquire invented paragraph citations. Ending uses “Slutför övningen” or “Slutför texten”, distinct from the early exit “Avsluta”.

## 5 · Öva — choose a small, concrete task

**Purpose and primary action.** Start useful practice with one decision. The front card recommends an available section and its primary is “Öva XYZ” (illustrative). If a matching practice session is resumable, it becomes “Fortsätt övningen”. A section door launches that section directly; changing section must not introduce an extra start interstitial.

**Data shown.** All eight sections in stable order ORD, LÄS, MEK, ELF, XYZ, KVA, NOG, DTK; section name, available practice, recommendation with its evidence, optional resume position; mixed practice; today's repetition pile and the separate count ready now. Use actual selected batch length, normally ten, and a supplied duration estimate only when available. Never infer minutes from an arbitrary card count.

**Desktop wireframe**

```text
HP-Coach   NAV: Ova active                                  [K]
Ova                 +--------------------------------+))   Delprov
Ett pass i taget    | XYZ - forslag utifran dina svar |     ORD LAS MEK ELF
[Repetera: 6 nu]    | 10 fragor                       |     XYZ KVA NOG DTK
                    | En kort motivering             |     [section doors]
                    | >> Ova XYZ                     |
                    +--------------------------------+
                    [<] 1/3 Ova nytt [>]                    I leken
                                                          Ova nytt / Blandat /
                                                          Repetera
```

**Phone wireframe**

```text
Ova                           [K]
Alla delprov: ORD LAS MEK ELF
              XYZ KVA NOG DTK
Repetera: 6 redo nu - 9 idag >
+----------------------------+))
| XYZ - ditt nasta pass      |
| 10 fragor + motivering     |
| >> Ova XYZ                 |
+----------------------------+
[<] 1/3 Ova nytt [>] [I leken]
NAV: Ova active
```

The wireframes omit Swedish diacritics only inside ASCII boxes. Render normal Swedish spelling in the UI.

**Reuse/new.** Reuse `SvepFrame`, `DeckStage`, `DeckCounter`, `.sv-index-row`, `.sv-sec`, card stock and button variants. New `SvepPracticeDeck` composes three stable cards: section practice, mixed practice, repetition. New `SvepSectionDoors` supplies immediate links; it is an index of choices, not eight equal hero cards. Use `rep` table tint only while repetition is front; unrecognized section tints use `none`.

**States.** Empty learner history keeps all available sections and “Blandad övning”; remove the unsupported “svagast” claim. Loading reserves one card and count slots, with known section doors still usable when the bank is ready. Partial data keeps known practice available while queue/score fields say “Kunde inte hämta antalet” or remain pending; unknown is never zero. A genuinely empty bank shows “Det finns inga frågor här ännu” and a route to another available section. Done/resume states show the actual completed or remaining session, not a new fake recommendation. Zero ready repetition keeps its door visible with “Inget redo just nu”.

**Navigation.** Enter from the Öva door, Home plan or a progress recommendation. Start reaches screen 6/7/14 or the existing verbal question family as appropriate; Repetera reaches 8. Exit returns to this section/mixed selection. All five destinations and account remain reachable here.

**ADHD-PI/accessibility.** Stable eight-section geography, one highlighted recommendation, one-line reason, no adaptive hiding. Buttons have full section names in accessible labels. Queue counts distinguish readiness in words. **Unmistakably Svep:** three task cards, visible edges, a short register and one raspberry action, rather than a grid of eight competing cards.

## 6 · Kvantfråga — XYZ, KVA and NOG

**Purpose and primary action.** Read the whole mathematical problem and submit one answer: “Svara C” after selection, disabled “Svara” beforehand. After grading, apply the shared feedback priority rule.

**Data shown.** Section, session position/total, elapsed practice time, exact prompt, optional diagram, actual options/letters, selection/eliminations and explanation. KVA displays its condition plus labelled Kvantitet I and Kvantitet II together. Its four fixed comparison meanings are I greater, II greater, equal, and insufficient information; render the bank's full Swedish wording in its original order. NOG keeps stem, numbered statements (1)/(2), sufficiency coda and its five A–E choices together. XYZ uses its supplied options; it does not inherit NOG's count.

**Desktop wireframe**

```text
[Avsluta]                  Fraga 3 av 10                  Tid 02:18
                 +--------------------------------------+))
                 | KVA                                  |
                 | Villkor / eventuell figur            |
                 | Kvantitet I       Kvantitet II       |
                 | uttryck           uttryck            |
                 | A ... [Stryk]     B ... [Stryk]       |
                 | C ... [Stryk]     D ... [Stryk]       |
                 | >> Svara C                           |
                 +--------------------------------------+
                 Besvarade / aktuell / kvar - A-D valjer
```

The option rows are one vertical list in implementation; the paired ASCII lines save space. Only KVA quantities may be side-by-side on wide cards. A large geometry figure may use the screen-7 reference-card pair; do not force every short XYZ prompt into two empty panels.

**Phone wireframe**

```text
[Avsluta]      3/10     02:18
+---------------------------+))
| KVA                       |
| Villkor / figur           |
| Kvantitet I: uttryck      |
| Kvantitet II: uttryck     |
| A jamforelse      [Stryk] |
| B jamforelse      [Stryk] |
| C jamforelse      [Stryk] |
| D jamforelse      [Stryk] |
| >> Svara C                |
+---------------------------+
```

**Reuse/new.** Reuse `.sv-qcard`, `.sv-opts`, `.sv-lockbar`, `QuestionCards`, `Faces` and the feedback deck treatments. New `SvepQuantCard` uses `MathText` for prompt, conditions, statements, options and worked solution; preserve `KvaPrompt` splitting/fallback semantics and `parseNogPrompt` semantics with Svep styling. Those production components use other visual tokens, so they are content references, not an instruction to mount the M3 chassis. No new palette; use `--sv-card`, ink and neutral table.

**States.** Empty/unresolvable question offers “Till Öva”, not a blank answer card. Loading reserves prompt and option rhythm without answer-shaped fake values. Partial explanation still shows the saved verdict and correct answer, with “Förklaringen saknas just nu”; optional diagram absence is acceptable only if the item is explicitly answerable without it. Incomplete required content blocks answering. Failed KVA/NOG structure parsing shows the original complete prompt without dropping words. Done shows correct/total, actual time and one return/next-plan action; answers saved unsuccessfully must be labelled pending/error rather than “sparade”.

**Navigation.** Öva section/mixed practice, lesson examples or resume enter here. Avsluta returns to the caller with section context; a lesson detour restores its entry. A graded question advances only on Nästa. Esc closes a local aid, never silently exits.

**ADHD-PI/accessibility.** Keep conditions visible alongside comparisons; do not require remembering a previous card's quantity. Long formulas scroll within a labelled region without stealing deck gestures. MathText currently supplies a readable math label, not structured MathML: verify spoken quantities in B1 rather than claiming full mathematical accessibility. **Unmistakably Svep:** one substantial problem card turns into the ordered learning deck; formulas remain stationary while thinking.

## 7 · DTK — keep the evidence under the question

**Purpose and primary action.** Read a diagram, table or map accurately, then “Svara B”. Enlargement is a quiet visible utility, never a competing filled action.

**Data shown.** The original figure/page, its title/source when supplied, aspect ratio, full legend/axes/units, question and actual answer options (including image options), overall position and the position within a shared figure block, e.g. “Fråga 2 av 4 · samma sida”. Correctness/explanation appears only after practice submission.

**Desktop wireframe**

```text
[Avsluta]             DTK - fraga 4 av 10                   04:22
+-------------------------------------+ +-----------------------+))
| Underlag - titel                    | | Fraga 2 av 4          |
|                                     | | samma sida            |
| Complete figure, table or map        | | Full question         |
| including legend and source         | | A ...   [Stryk]        |
|                                     | | B ...   [Stryk]        |
| [Forstora figur] [Rotera]            | | C ...   D ...          |
+-------------------------------------+ | >> Svara B            |
                                        +-----------------------+
```

**Phone wireframe**

```text
[Avsluta]       4/10    04:22
+---------------------------+
| DTK - underlag             |
| Full proportional preview  |
| [Forstora figur] [Rotera]   |
| preserved scroll / zoom    |
+---------------------------+
 +-------------------------+))
 | 2 av 4 - samma sida      |
 | Full question           |
 | [Till fragan]            |
 +-------------------------+
Raised: [Till figuren], options,
        >> Svara B
```

**Reuse/new.** Reuse Svep's `.sv-pair`, reference card, sheet and question/feedback vocabulary. New `SvepFigureCard` adapts `QuestionFigure`'s SVG/raster distinction, reserved aspect ratio, zoom and rotation controls. New `SvepFigureViewer` supplies a labelled focus-contained enlargement with close, zoom in/out and fit controls. Preserve figure scroll, zoom and rotation between block mates; reset only when the actual figure changes. Proposed improvement: fit resets both zoom and rotation coherently.

**States.** Empty required figure gives “Underlaget saknas” and a return/recovery action; do not grade a guess caused by missing content. Loading reserves the correct figure footprint. Partial data keeps available titles/prompts but disables Svara until required diagram and image options are usable; a failed image says so with retry. Missing optional explanation follows screen 6. Done closes the whole drill, not each shared figure block. Completion can use Svep's hand of answer cards; the figure remains reviewable.

**Navigation.** Enter from DTK practice, mixed practice, repetition or a lesson. Viewer close restores the figure button, question selection and scroll. “Till figuren” lowers the phone question to its prior reference position; no browser-back dependency. Avsluta returns to the launch surface. In Provpass reuse only content and figure behavior, with the exam contract in screen 9.

**ADHD-PI/accessibility.** No figure auto-rotation, cropping to a pretty thumbnail or jump back to the top on a block mate. Preserve original raster colors in dark mode; use a bounded light source sheet rather than invert the diagram. The existing generic image alt “Figur” is insufficient to explain a chart: require a supplied accurate description/data equivalent for the chosen fixture, or record its absence as an accessibility gap. Do not invent values or claim zoom substitutes for an equivalent. Keyboard panning and visible controls must work without drag. **Unmistakably Svep:** a large stationary evidence card and a smaller waiting question hand, then a turn to feedback on the same table.

## 8 · Repetera — a finite batch of ready questions

**Purpose and primary action.** Revisit mistakes that are ready now. Direct-entry overview: “Repetera 6”; a hub door with direct start enters the first available question without a second gate. In the run, primary becomes Svara/Nästa; after completion, “Till Öva” or the real next plan item.

**Data shown.** Ready-now count, today's pile count when different, section scope, actual batch size (up to the existing ten-question limit), progress through that batch, answer outcome and remaining eligible work. A pending future review is not currently actionable. Do not promise that one correct answer makes a mistake permanently learned.

**Desktop wireframe**

```text
HP-Coach   NAV: Ova active                                  [K]
Repetera            +--------------------------------+))   Omgangen
[Alla] [ORD] ...    | 6 redo nu                      |     6 fragor
9 i dagens hog     | De aldsta forst                 |     Vald sektion
                    | Small hand of six cards        |     [Till Ova]
                    | >> Repetera 6                  |
                    +--------------------------------+
Run: [Avsluta] -> one question card / reference pair -> Svara
```

**Phone wireframe**

```text
Repetera                      [K]
[Alla] [available sections]
+----------------------------+))
| 6 redo nu - 9 i dagens hog  |
| Hogst 10 i den har omgangen |
| >> Repetera 6              |
+----------------------------+
NAV: Ova active

Run: [Avsluta] 2/6 -> question
Done: 6 besvarade - 4 ratt
      >> Till Ova
```

**Reuse/new.** Reuse `rep` table tint for overview/done, Home's fan motif, `QuestionCards` and the shared question/feedback components. New `SvepReviewOverview` and `SvepSessionEnd` name a real batch, not a fixed invented pile. During questions use the actual content family (6/7, existing LÄS, 14 for ELF); “Repetition” remains in the context label so the user knows why the item returned.

**States.** Empty distinguishes first use (“Inga missar än”), nothing ready but a nonempty pile (“Inget redo just nu”), and a completed batch with more scheduled later. Each has one useful action to Öva. Loading has a static batch card; unknown count is not “0”. Partial/stale saved plans are reconciled with the current ready list; show the resolved batch size and retain valid progress. A now-empty resolved plan returns to the overview, not a ghost replay. Queue failure offers retry; an unresolved save does not claim an item left the queue. Done says how many were answered/right and shows current remaining count only when refreshed.

**Navigation.** Öva keeps the Repetera door even at zero. Scoped entries stay scoped; a return to all sections is explicit. Avsluta returns to Öva; completed passes remain reopenable through `/repetition?done=<session>` from Historik. Reopening is review, not a new attempt or queue mutation.

**ADHD-PI/accessibility.** Bound the task, avoid overdue alarms and streak-loss language, and keep batch progress separate from lifetime counts. Announce a materially changed resume plan once. Do not make the decorative card fan individually tabbable. **Unmistakably Svep:** the finite hand becomes answered cards one at a time, followed by one calm end card.

## 9 · Provpass — select, commit, then work against the clock

**Purpose and primary action.** Hub: choose a timed pass with “Förbered provpass”. Confirmation replaces it with “Starta provpasset”. Running: “Nästa fråga”, becoming “Lämna in” at the last question; an always-visible quiet Lämna in also allows early submission, with confirmation. There is never a practice Svara-and-reveal action during a pass.

**Data shown.** Authentic versus generated mode, Verbal/Kvant, sitting and pass number for authentic content, actual available question count, previously seen count, section distribution, 55-minute duration and existing active session if any. Running shows remaining wall-clock time, current question, answered/unanswered states and a direct question register. No scores, green answers, pedagogical hints or explanations before submission.

**Desktop wireframes**

```text
HP-Coach   NAV: Provpass active                             [K]
Provpass            +--------------------------------+))   Alla provtillfallen
[Riktigt/Genererat] | Host 2025 - provpass 2          |     sitting / passes
[Verbal/Kvant]      | 40 fragor - 55 min             |     with actual counts
                    | 3 av 40 sedda tidigare         |     [Tidigare resultat]
                    | >> Forbered provpass           |
                    +--------------------------------+

[Avsluta]           Kvant - fraga 7 av 40     43:12   [Lamna in]
+------------------------------+))  Frageregister
| Exact task / figure pair     |    1 2 3 4 5 6 [7] 8 9 10
| Revisable choices, no facit  |    labelled section groups
| [Foregaende] >> Nasta fraga  |    Besvarad / obesvarad
+------------------------------+
```

**Phone wireframes**

```text
Provpass                      [K]
[Riktigt/Genererat] [Verbal/Kvant]
+----------------------------+))
| Sitting + pass + count     |
| 55 minuter - sett 3/40     |
| >> Forbered provpass       |
+----------------------------+
[Alla provtillfallen] [Resultat]
NAV: Provpass active

[Avsluta] 7/40 43:12 [Lamna in]
+----------------------------+))
| Question / reading sheet   |
| A ... B ... C ... D ...    |
| [Foregaende] >> Nasta      |
+----------------------------+
[Frageregister - 6 besvarade]
```

**Reuse/new.** Reuse card stock, `.sv-seg`, `.sv-index-row`, counter styling and the question/figure/reading bodies. New `SvepMockPicker`, `SvepPassConfirm`, `SvepMockRun` and `SvepQuestionRegister` adapt the real mock flow. The question register is an accessible wrapping list/grid of buttons, not 40 `DeckTicks`. Full text describes the current and answered state. Use neutral table; no correctness colors while running.

The proposed confirmation is one account-card-sized modal on desktop and a full readable sheet on phone, with exact pass identity and rules from `ConfirmSheet`: no pause, answers changeable until time expires, abandonment invalidates the pass, no deductions for wrong answers, and no feedback before submission. “Inte nu”/Esc dismisses before the clock starts. One start creates one session. Swiping or Enter on the hub must not start it. Runtime timer remains based on its original start time through refresh; a restored run never grants 55 new minutes. The source adopts only eligible live runs; expired/unresolvable sessions need an explicit notice, not a fabricated result.

**States.** Empty selected mode/half offers an available alternative, never a start button on an empty plan. Loading resolves bank/session/exposure separately without declaring all questions unseen. Partial authentic passes name the actual count before confirmation; do not relabel a 38-question pass as 40. Missing required running content shows an error with retry/exit; the exam clock does not silently pause. Pending answer/save or submission has visible status, retains choices and blocks duplicate finalization. Proposed retry targets the same session; actual backend retry/idempotency support must be verified by B2. Done enters screen 10 only once a result exists; a voided run returns to the hub with “Provpasset avbröts”.

**Navigation.** Enter through Provpass or Home plan. Quiet register buttons jump directly; previous/next revisits preserve choices. a–e selects only letters present; arrows navigate except inside controls/viewer. No practice Enter-advance shortcut. “Avsluta” during a run opens a consequence-specific confirmation, distinct from “Lämna in” and its unanswered count. The clock expiring submits once without requiring an unanswered confirmation. Mock history opens screen 10 via `/prov?result=<id>`.

**ADHD-PI/accessibility.** One deliberate commitment gate; no pause-looking control, ticking animation, early red feedback or new bookmark feature unsupported by state. Timer has a readable stable value and restrained threshold announcements. Opening the question register preserves current focus/content and has an explicit close. **Unmistakably Svep:** the selected pass is a dealt card and the run advances through its indexed hand; the familiar material stays while the grading behavior clearly changes.

## 10 · Provpassresultat — explain what this pass supports

**Purpose and primary action.** Understand the outcome and choose one useful practice target. Primary: “Öva XYZ” for an evidenced weak section; with no actionable weakness, “Till Framsteg”. Detailed section/time cards are available without starting another pass.

**Data shown.** Mode, half, sitting/pass and date; correct/presented, answered/unanswered, actual duration, seen-before count, section correct/total, time per section, available mistake pattern and comparable prior results. Distinguish a missing source question from an unanswered displayed one. Score shows its derivation next to the numeral: an authentic pass may be derived from a sitting's UHR table, but a 40-question pass is not itself an official 80-question half result. Generated/unavailable-table estimates are indicative. No total full-exam score from one half.

**Desktop wireframe**

```text
HP-Coach   NAV: Provpass active                             [K]
Provpasset klart    +--------------------------------+))   Resultatet
Kvant / sitting     | 28 av 40 ratt                  |     Oversikt
Datum + langd       | 38 besvarade - 2 obesvarade    |     Per delprov
                    | Skattning + visible caveat     |     Tempo
                    | 3 sedda tidigare               |     Att ova vidare
                    | >> Ova XYZ                     |     Tidigare pass
                    +--------------------------------+
                    [<] 1/5 Oversikt [>]
```

**Phone wireframe**

```text
Provpasset klart              [K]
Kvant - sitting / pass / date
+----------------------------+))
| 28 av 40 ratt              |
| 38 svar - 2 obesvarade     |
| Estimate and its caveat    |
| Seen count / duration      |
| >> Ova XYZ                 |
+----------------------------+
[<] 1/5 [>] [Resultatets kort]
[Till Provpass]
NAV: Provpass active
```

**Reuse/new.** Reuse Home's numerical hierarchy, `DeckStage`, counters/index, `.sv-caveat`, low-emphasis bars and `.sv-done` material. New `SvepMockReport` builds overview, section, tempo, actionable pattern and comparison cards only when each has meaningful content. Section bars carry labels and real denominators. Do not put 40 fanned answer cards in the hero; use a compact text summary and an indexed detail list if the shared data supplies it. Detailed mock answer review is proposed, not already wired by `MockResult`.

**States.** Empty/not-found result has “Resultatet finns inte här” and “Till Provpass”; do not create a replacement result. Loading reserves raw-result slots; pending score lookup is explicitly pending. Partial data shows raw counts while omitting unavailable time/trap/comparison figures. The source can fall back to a linear estimate: label it accordingly. Missing explanations do not invalidate the raw result. Done is a stable revisitable report, not a transient celebration; repeated visits never submit attempts. If nothing was answered, show that directly without a learning-success claim.

**Navigation.** Successful submission, Provpass results list or an explicit mock-result link enters here. Main navigation is restored. Practice target enters the appropriate Öva drill; lesson action opens the relevant Uppslag entry. “Till Provpass” returns to the hub without beginning a new timer. Compare only compatible mode/half results and keep exposure/missing-content caveats visible.

**ADHD-PI/accessibility.** Lead with one plain outcome and one next step, not five scores. Red is confined to specific misses, never an entire failure card. Raw fraction and score meaning are spoken together; every plot has a text/table equivalent. **Unmistakably Svep:** turn over the completed pass, then inspect one evidence card at a time with a visible result register.

## 11 · Framsteg, including Historik — an honest overview

**Purpose and primary action.** See what is improving and where the next practice will help. With enough evidence, “Öva XYZ”; on day zero, “Starta diagnostik”. Within Historik, “Öppna pass” for the selected completed session is the primary instead.

**Data shown.** Available projected score with uncertainty and calibration caveat, verbal/quant estimates, weekly change only if comparable, target, section attempts/confidence, weekly score series, 12-week activity, focus recommendations, repetition context and completed drill/repetition history. Production's progress chart currently has a 1.8 goal reference; Home's example uses 2.0. Use one supplied target across this design and do not silently unify those different source examples into a new stored goal.

**Desktop wireframe**

```text
HP-Coach   NAV: Framsteg active                             [K]
Framsteg            +--------------------------------+))   Oversikt
Senaste 12 veckorna | Prognos / band / target         |     Delprov
                    | Caveat beside the estimate     |     Narvaro
                    | Weekly series or sparse state  |     Nasta fokus
                    | >> Ova XYZ                     |     Historik
                    +--------------------------------+     always reachable
                    [<] 1/5 Oversikt [>]
Historik card: date | section/kind | correct/total | [Oppna pass]
```

**Phone wireframe**

```text
Framsteg                      [K]
[Oversikt] [Historik]
+----------------------------+))
| Prognos, if supported      |
| Range + source caveat      |
| Small chart + text         |
| >> Ova XYZ                 |
+----------------------------+
[<] 1/5 [>] [Alla kort]
History mode: dated pass rows
NAV: Framsteg active
```

**Reuse/new.** Reuse `PrognosisCard`/`Weeks`/`Scale` visual vocabulary from Home, not their fixed fixture values; reuse `.sv-recent`, `.sv-index` and neutral table. New `SvepProgressDeck` holds overview, all eight sections on one comparison card, activity, focus and history. New `SvepHistoryList` uses compact dated rows within the active card; a long journal scrolls as a list, not one mandatory swipe per old pass. The activity card can expand to a labelled day grid. Historik remains a named direct entry even if its data is empty.

**States.** Empty shows “Ingen prognos än” plus diagnostic entry and zero-attempt section labels, never a zero score. Loading preserves geometry without fabricated sparkline/heat cells. Partial data omits unsupported change/rank statements, keeps confidence and sample counts beside estimates, and leaves gaps for weeks without a score. A failed history fetch says it failed rather than “Inga avslutade pass”. Done means refreshed after practice; no “mastered” badge from one correct answer and no automatic celebratory count-up. New data must not reorder a card/register under the user's pointer.

**Navigation.** Framsteg door and Home estimate/recent-pass links enter the matching card. Historik drill rows use `/drill?done=<id>`; repetition rows use `/repetition?done=<id>`, returning to the same history position. Current production history excludes mock and diagnostic sessions: retain that distinction, with a quiet “Provpassresultat” link to the separate mock result list. A unified all-session journal is an owner decision, not a data capability assumed here. Section rows can open Uppslag, while the primary next-focus action opens practice.

**ADHD-PI/accessibility.** One interpretation at a time; no loss-framed streaks or “weakest” when there is no comparison signal. Graph axes/units and missing data remain legible; use full 0–2 scale for score charts and provide the actual weekly numbers in an accessible table. Activity intensity has a legend and spoken dates/counts. **Unmistakably Svep:** progress is a small indexed evidence deck, with a section comparison or journal contained in one card rather than scattered dashboard tiles.

## 12 · Uppslag and lesson — a reference card with its place kept

**Purpose and primary action.** Hub: open the desired section/entry, “Öppna KVA”. Reader: put the current idea into practice, using the source-appropriate “Öva detta mönster”, “Öva denna taktik”, “Öva denna regel”, “Öva denna frågetyp” or “Öva ord med denna rot”. If there are no matching examples, offer clearly labelled whole-section practice instead. Do not label whole-section questions as entry-specific.

**Data shown.** All eight sections and their availability; recommended section only with evidence; entry titles/counts, estimated reading time, last-read bookmark and read markers. Trap entries show principle, why it happens, recognition cue, countermeasure, worked/counterexample and available examples. Protocols show their rule or ordered method and distractors. Lexicon entries show root, origin, meaning and example words. Optional fields stay optional; math-bearing lesson text uses MathText.

**Desktop wireframes**

```text
HP-Coach   NAV: Uppslag active                              [K]
Uppslag             +--------------------------------+))   Delprov
Las en ide          | KVA / short description        |     ORD LAS MEK ELF
                    | Entry count / reading time     |     XYZ KVA NOG DTK
                    | Last bookmark, if present      |
                    | >> Oppna KVA                   |
                    +--------------------------------+

[Alla delprov]      +------------------------------------+)) Innehall
KVA                 | One entry title / principle       |   labelled entries
                    | Explanation + complete example    |   read state
                    | [Markera som last]                |
                    | >> Ova detta monster              |
                    +------------------------------------+
                    [<] Avsnitt 3 av 12 [>] [Innehall]
```

**Phone wireframes**

```text
Uppslag                       [K]
[All eight section doors]
+----------------------------+))
| Selected section / resume  |
| >> Oppna KVA               |
+----------------------------+
NAV: Uppslag active

[Alla delprov] KVA            [K]
+----------------------------+))
| Current entry / principle  |
| Prose and worked example   |
| [Fordjupning]              |
| [Markera som last]         |
| >> Ova detta monster       |
+----------------------------+
[<] 3/12 [>] [Innehall]
NAV: Uppslag active
```

These are separate hub and reader states, each with one account trigger.

**Reuse/new.** Reuse `DeckStage`/counter/index and passage type/material. New `SvepReferenceDeck` makes each framework entry one card, with a complete internal reading flow and optional native disclosures. Reuse content semantics of `TrapCard`, `ProtocolCard`, `LexiconCard`, `ExampleQuestions`, `PracticeLink` and `MarkAsReadPill`; restyle within Svep rather than importing their global visual treatment. No deck inside a deck: the entry register replaces the hub register after opening a section. Long worked examples scroll together. Use existing `ord`/`las`/`elf` table tints only where applicable, otherwise neutral.

**States.** Empty/unavailable section stays in the catalogue with “Innehåll saknas ännu” and an available-section route. Loading reserves an entry card and title/register placeholders. Partial content omits absent examples without pretending an empty targeted drill can start; unresolved examples are distinct from zero examples. Bookmark failure keeps the currently read entry visible with a quiet status; do not claim cross-device save. Done is an explicit reversible “Läst” marker; opening, scrolling or swiping a card does not mark it read. All-read state leaves the reference fully browsable.

**Navigation.** Uppslag door, Home lesson/resume and drill explanation links enter here. Preserve section and stable entry anchor: a deep link opens that entry directly, not card one. The existing reader bookmarks opened entries, but only trap cards currently carry the reader's expected entry ID; B3 must explicitly provide stable targets for protocol/lexicon cards too. Practice returns to the same entry via a named return action. “Alla delprov” exits the reader; main doors always remain visible.

**ADHD-PI/accessibility.** A visible contents register avoids losing the overview; “one idea per card” never separates evidence needed to understand it. Read markers are buttons with state, not color-only stamps. Headings and expandable controls have independent accessible names; entry navigation does not intercept selection of text. **Unmistakably Svep:** a readable reference card on the same stock as practice, with the next entry's edge and a persistent contents register.

## 13 · Konto and settings — one place, one account entry

**Purpose and primary action.** Inspect identity/change a preference, then return to the interrupted task. Primary in the normal state: “Tillbaka till Öva” (the actual origin label replaces Öva). Preference choices are direct controls; do not invent a Save button for settings that already apply immediately. If a save fails, retry becomes the primary until resolved.

**Data shown.** Name and full email; current theme, palette, coach and selection preference; exam sitting/countdown as read-only context where supplied; provider-managed sign-in information; honest future-billing message; visible links to Diagnostik, Avancerat, Feedback, help and legal pages. Account sign-out remains available. The current account hints mention exam date/goal, but these inspected pages do not supply such an editor: do not draw an operational editor until its route/contract is supplied.

**Desktop wireframe**

```text
HP-Coach   NAV: origin remains legible                       [K]
Konto               +--------------------------------+))   Konto
och installningar   | Namn / full e-post              |     Installningar
                    | Tema: [Ljust] [Morkt]           |     Verktyg
                    | Palett / coach / urval          |     Hjalp
                    | Save status when necessary     |
                    | >> Tillbaka till Ova            |
                    +--------------------------------+
Account detail, farther down: provider / plan / legal / export / deletion
```

**Phone wireframe**

```text
Konto och installningar       [K]
[Konto] [Installningar] [Verktyg]
+----------------------------+))
| Full identity or settings  |
| Tema: [Ljust] [Morkt]      |
| Coach / urval              |
| >> Tillbaka till Ova       |
+----------------------------+
[Hjalp] [Logga ut]
NAV: five destinations
```

The existing account popover is the entry to these details. When full details open, close the popover; do not leave two account panels/triggers on screen. The avatar illustration in the identity body is noninteractive and is not another entry.

**Reuse/new.** Reuse `AccountEntry`, `.sv-acard`, `.sv-arow`, `.sv-seg`, card stock, neutral table and quiet button styling. These functions are currently local to `Svep.tsx`; extracting reusable detail composition is proposed B3 work. New `SvepAccountDetails` groups identity/settings/tools; use labelled fields with immediate selected state and clear pending/failure status. Production `ThemeMode` is only light/dark. Svep's prototype “System” currently resolves the device's preference at selection time; it is not evidence of a persisted production system mode. This spec uses Ljust/Mörkt until the owner decides otherwise.

**States.** Empty/signed-out identity shows “Du är inte inloggad” with a sign-in action; no fabricated name or free-plan status. Loading retains labels and neutral placeholders. Partial identity falls back to available name/email without truncating the full address in details; failed remote preference save labels the state as unsynced and offers retry. Done announces the actual setting change once, without celebratory deck motion. Account deletion has its existing separate pending/error/completed states; never say a failed deletion succeeded.

**Navigation.** Reachable from the single account trigger on every full-frame screen. Konto and Inställningar rows open the matching detail group; Back returns to the invoking page/card. Tool/help/legal links remain visible and keyboard reachable without a command palette. Esc closes a disclosure/modal and restores its trigger; it must never log out or delete. Avoid deck gestures on form controls.

**Account deletion boundary.** Preserve the current page-only deep placement, after ordinary account information; never add deletion to the avatar menu, deck register or main action. Keep export offered above the destructive control, exact `radera` confirmation, the existing consequences copy, and separate success/failure states. Do not embed a provider profile widget or add billing management that does not exist. In the bake-off these are simulated states with synthetic identity, never calls to real export/deletion/sign-out services.

**ADHD-PI/accessibility.** Small named groups, stable labels, immediate setting feedback and one return action prevent a settings maze. Wrap email and long choice labels; use fieldsets/labels and `aria-pressed` or native radios, not a menu role without menu keyboard behavior. **Unmistakably Svep:** the account card deals open from the same table and expands into the same indexed stock, not a second product's modal dashboard.

## 14 · ELF reading question — English content, Swedish controls

**Purpose and primary action.** Read an English passage and answer against its evidence. Primary after selecting a choice: “Svara B”; the question card and feedback priority match the existing LÄS flow. “Till frågan” and “Till texten” remain visible quiet controls.

**Data shown.** Actual English title/passage/byline, paragraph boundaries, current question and supplied options, unit and session positions, elapsed practice time, explanation/evidence and source provenance. Use an authentic ELF item or a committed synthetic ELF unit with its actual questions; do not translate a Swedish LÄS fixture and call it ELF. Reading comprehension and cloze are distinct variants: an empty cloze stem gets “Lucka 32” as Swedish framing and retains the numbered gap in the English passage.

**Desktop wireframe**

```text
[Avsluta]                 ELF - fraga 2 av 4                05:10
+-------------------------------------+ +-----------------------+))
| ELF / provenance / [Om texten]       | | Fraga 2 av 4          |
| English title                       | | English question      |
| 1 English paragraph ...             | | A English option [x]  |
| 2 English paragraph ...             | | B English option [x]  |
| 3 English paragraph ...             | | C ... D ...           |
| [Styckefokus]                       | | >> Svara B            |
+-------------------------------------+ +-----------------------+
```

**Phone wireframe**

```text
[Avsluta]   ELF 2/4    05:10
+----------------------------+
| Provenance / Om texten     |
| English title             |
| 1 English paragraph ...   |
| 2 English paragraph ...   |
| preserved reading place   |
+----------------------------+
 +--------------------------+))
 | English question         |
 | [Till fragan]            |
 +--------------------------+
Raised: [Till texten], options,
        >> Svara B
```

**Reuse/new.** Reuse the reading pair, `PassageCard`/`PhoneQuestion`/`PhoneFacit` composition, `useSheet`, focus aid, answer slips and feedback deck. B3 must generalize the local LÄS/UNIT/title assumptions in `SvepDrill`; swapping the chip alone is insufficient. Use existing `elf` table/section tokens, `--sv-serif` and ochre evidence marks. New `SvepReadingContent` handles language/provenance and content-derived title/options; this is a proposed component, not an existing export.

`lang="en"` is **new work**: none was found in `app/src` at this baseline. Keep the root and Swedish controls `lang="sv"`; mark the English title, passage, English question and English option text `lang="en"`. Do not put Swedish buttons inside an inherited English language region without restoring Swedish. Explanation prose keeps its actual authored language, with English quotations marked individually when needed. English uses English hyphenation; do not apply Swedish word breaking to the passage.

**States.** Empty/missing passage offers return/retry with no answerable shell. Loading preserves passage and measured question-card geometry. Partial data keeps the English text readable; a missing required question/option blocks submission, a missing explanation after grading does not erase the verdict. Missing optional byline is omitted. Done uses the real unit count, result/time and one next-plan action; do not force a four-question unit length merely because the LÄS fixture has four. Keep actual option counts, typically A–D for the reading fixture; never add an E placeholder.

**Disclosure.** For synthetic practice, show Övningstext outside the passage and use the approved note verbatim: “Den här texten och frågorna är skapade för övning av HP-Coach. De kommer inte från ett tidigare högskoleprov. Personer, citat och händelser kan vara påhittade.” The current Svep note is on demand; proposed first-unit entry opens it once, while resume leaves it collapsed and reachable through “Om texten”. Authentic past-test content uses actual provenance and never this synthetic badge. Any estimate based on synthetic LÄS/ELF retains the approved calibration caveat from `r1Fixtures.ts` next to that estimate, not inside the reading passage.

**Navigation.** ELF practice, mixed practice, repetition, Home resume and a lesson example can enter here. Phone toggling preserves the passage scroll and selected answer; following a real paragraph citation lowers the sheet to that evidence and provides “Till facit” back. Avsluta restores the caller; final completion offers its valid next action. During a timed mock, reuse the language/reference treatment under screen 9's no-feedback contract.

**ADHD-PI/accessibility.** No automatic translation, tooltip dictionary or new vocabulary exercise competing with the reading job. Paragraph focus is optional; no motion runs while reading. Full prompt stays visible at enlarged text; paragraph links remain keyboard reachable, and screen-reader voice switches follow content boundaries. **Unmistakably Svep:** the sea-grey table holds one tall English reading card and its waiting question hand; the answer turns into the same small sequence of evidence cards as LÄS.

## Component inventory and batch agreement

The names in the “new” column are proposed responsibilities, not required file names or permission to extend a future bead's write set. Private functions/classes listed as reuse may need extraction or composition; the shared headless data layer should not acquire Svep-specific layout.

| Batch | Existing vocabulary to reuse | New composition / responsibility |
| --- | --- | --- |
| B1 · 5–8 | `SvepFrame`, `useDeck`, `DeckStage`, `DeckCounter`, `DeckTicks`, `QuestionCards`, `.sv-index`, `.sv-qcard`, `.sv-opts`, `.sv-pair`, feedback run; MathText/KVA/NOG/figure semantics | `SvepRegister`, `SvepSectionDoors`, `SvepPracticeDeck`, `SvepQuantCard`, `SvepFigureCard`/viewer, `SvepReviewOverview`, `SvepSessionEnd`. Own the common question-body, labelled status and gesture-boundary decisions first. |
| B2 · 9–11 | B1 question/figure composition; Svep card/segment/index/number/caveat styles; production mock and progress semantics | `SvepMockPicker`, `SvepPassConfirm`, `SvepMockRun`, `SvepQuestionRegister`, `SvepMockReport`, `SvepProgressDeck`, `SvepHistoryList`. Exam answering must be explicitly separate from practice reveal; report provenance travels with each score. |
| B3 · 12–14 | Frame/register, lesson content families, account card/rows/segments, existing LÄS reading and evidence flow, B1 math/figure rendering | `SvepReferenceDeck`, `SvepAccountDetails`, `SvepReadingContent`; stable entry targets, language boundaries and source-aware disclosure. Reuse B1/B2 navigation and state conventions without copying their fixtures. |

Before a batch starts, inspect the then-current source and the shared-data bead's accepted contract. Share: origin/return context, active card/entry identity, actual question/option counts, loading/error/empty distinctions, and pending-versus-confirmed saves. A fixture can show these states without implying a new backend capability. A later batch should consume the common card/index behavior from earlier work; disagreement belongs in the bead before parallel edits to shared files.

### Review evidence required from the build batches

These are future acceptance checks, not results claimed by this B0 document.

- Show screens 5–14 at 1440×900 and 390×844, light and dark, plus long text, short viewport, text-spacing overrides and reduced motion. Screen 9 includes hub, confirmation and run; 12 includes catalogue and reader; 13 includes account and settings; 14 includes reading and feedback. At thumbnail size, card edges/register/turning grammar should distinguish Svep without relying only on its raspberry hue.
- Exercise each entry/exit and the one account trigger in every full-frame layout. No destination is a dead stub once its batch claims completion. Drill exits remain visible; overlays restore focus; keyboard and buttons provide every gesture operation.
- Check real math, four-choice KVA, five-choice NOG, a dense DTK raster plus image option, a long lesson and English comprehension/cloze. Preserve formula semantics, figure proportions, full prompt and source answer count. Check viewer theme scope if a portal leaves `.sv-root`.
- Check day zero, pending, partial/stale data, failed fetch/save and done for each screen. Confirm missing data never renders as success/zero, repeated report visits do not grade again, and a changing data set does not leave an out-of-range deck index.
- Verify mock mode never reveals correctness, clock/resume and unanswered confirmation semantics, result provenance/caveats, and read-only review navigation. B3 verifies language boundaries and safe synthetic account interactions. Keep visual/keyboard/assistive checks separate from unit-test claims.

## Open questions for the owner

These remain open; the proposed defaults above let the batches build a consistent reviewable prototype without asserting new product authority.

1. **Persistent “System” theme:** keep production's Ljust/Mörkt for this round (recommended), or commission a persisted device-following mode separately? The existing bake-off's System button alone does not supply that feature.
2. **First synthetic-text disclosure:** open the approved note on first encounter with a unit, then collapse on resume (recommended), or keep Svep's current on-demand presentation throughout? Always keep the badge and disclosure action visible.
3. **History scope:** keep drill/repetition history in Framsteg and mock results in Provpass with a visible cross-link (recommended), or explicitly fund a unified journal including diagnostic results and their different review contracts?
4. **Goal source:** supply one learner target to the shared view model (recommended). Which existing preference is authoritative for that target, given the 1.8 progress reference and 2.0 Home example? Until supplied, label fixtures as examples and offer no invented target editor.
5. **Accessible DTK source:** provide an approved description/data equivalent for the chosen dense figure fixture (recommended). If none exists, keep that concrete accessibility gap visible in review instead of presenting generic alt text as equivalent access.

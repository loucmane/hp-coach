# H · Ljuskägla — screens 5–14

Round 2, B0 · hpf-qr0p.40 · 2026-10-19. Design specification for B1 (5–8), B2 (9–11) and B3 (12–14). Grounded at `43b0196a906961239bd126f3ebd4cb0bcc667c66`. UI examples are Swedish; English assessment material remains English. Counts in wireframes illustrate layout, not live user facts.

## Design contract and source grounding

Ljuskägla is a study room with light on the task in hand. A warm line at the left edge and one opaque illuminated surface establish the place to resume, read or decide. Supporting information remains readable in the quieter surrounding space. The same hierarchy must survive in light mode, with fallback fonts, on a phone and at thumbnail size.

This specification extends the bake-off. It does not approve a production migration, new backend behavior or changes to the shared data model owned by hpf-qr0p.7. Named new components below are proposed direction-local responsibilities, not existing exports or prescribed shared types. Production route names document semantic destinations; bake-off navigation must stay within the preview and retain local state.

| Source | Design facts carried forward |
| --- | --- |
| [Direction metadata](../../../app/src/components/devbake/redesign/h-ljuskagla/meta.ts), [root](../../../app/src/components/devbake/redesign/h-ljuskagla/Ljuskagla.tsx), [CSS](../../../app/src/components/devbake/redesign/h-ljuskagla/ljuskagla.css) | Room/paper/lamp surfaces; Manrope/Spectral; paragraph light; full light theme; scoped styling. |
| [Home](../../../app/src/components/devbake/redesign/h-ljuskagla/LjuskaglaHome.tsx), [navigation](../../../app/src/components/devbake/redesign/h-ljuskagla/LjuskaglaNav.tsx), [parts](../../../app/src/components/devbake/redesign/h-ljuskagla/LjuskaglaParts.tsx) | One resume pool, open secondary rows, perimeter navigation, account disclosure, citations. |
| [Drill](../../../app/src/components/devbake/redesign/h-ljuskagla/LjuskaglaDrill.tsx), [feedback](../../../app/src/components/devbake/redesign/h-ljuskagla/LjuskaglaFeedback.tsx), [direction tests](../../../app/src/components/devbake/redesign/h-ljuskagla/Ljuskagla.test.tsx) | Select then confirm; paragraph focus; peek/open/full phone sheet; explanation order; reduced motion and keyboard ownership. |
| [Shared brief](../2026-10-round1-brief.md), [critique log](../../worklog/hpf-qr0p.md) | Five visible doors; one primary action; distinctions must come from composition as well as color. No hidden strike controls, clipped phone prompts or competing cards. |
| [Öva](../../../app/src/routes/ova.tsx), [drill route](../../../app/src/routes/drill.tsx), [question](../../../app/src/components/drill/DrillQuestion.tsx), [KVA](../../../app/src/components/drill/KvaPrompt.tsx), [figure](../../../app/src/components/drill/QuestionFigure.tsx), [repetition](../../../app/src/routes/repetition.tsx) | Eight sections, due/pile distinction, real math and figures, sufficiency statements, section-scoped replay and completed-session links. |
| [Provpass](../../../app/src/routes/prov.tsx), [confirmation](../../../app/src/components/mock/ConfirmSheet.tsx), [runner](../../../app/src/components/mock/MockRunner.tsx), [result](../../../app/src/components/mock/MockResult.tsx) | Authentic/generated, verbal/quantitative, 55 minutes, incomplete banks, exposure, changeable answers, no in-pass grading, result caveats. |
| [Progress](../../../app/src/screens/ProgressMobile.tsx), [history](../../../app/src/routes/historik.tsx) | Estimates, confidence, practice activity, 12-week view, drill/repetition history and replayable completed results. |
| [Lesson route](../../../app/src/routes/lektion.tsx), [reader](../../../app/src/components/lesson/LessonReader.tsx), [examples](../../../app/src/components/lesson/ExampleQuestions.tsx), [account](../../../app/src/routes/konto.tsx), [settings](../../../app/src/routes/mer.tsx) | Framework families, bookmarks/read marks, practice links, account identity, appearance/voice/selection preferences and tool destinations. |

### Tokens, typography and geometry

Reuse the existing `--lj-*` values. Hex values below are orientation swatches from the CSS comments, not replacement declarations; keep its OKLCH definitions where present.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--lj-room` | `#faf6ed` | `#242321` | Quiet page and question background. |
| `--lj-paper` | `#e9e2d5` | `#292824` | Opaque reading field and secondary wells. |
| `--lj-lamp` | `#fcf9f2` | `#373229` | The active task or paragraph. |
| `--lj-ink` | `#302c26` | `#f4ebdc` | Foreground reading and headings. |
| `--lj-accent` | `#234b5a` | `#b5d6e2` | Primary action and links, paired with `--lj-on-accent`. |
| `--lj-beam` | `#826336` | `#e2c18a` | Warm margin light and current-location mark. |

Keep `--lj-soft` for secondary text, `--lj-line` for dividers and `--lj-edge` for control boundaries. Never lower text opacity to create shade. Every body-text pair, including shaded prose, must meet the brief's 7:1 target; UI text must meet AA, with distinguishable control boundaries and focus indicators. These are build acceptance targets, not measurements taken for this document.

Use `--lj-ui` (Manrope, system fallback) for navigation, labels, settings and tabular numbers. Use `--lj-prose` (Spectral, Georgia fallback) for reading, prompts and restrained display headings. Existing passage size is 19px/1.65 desktop and 18px/1.65 phone; keep roughly 55–70 characters per desktop line and allow natural phone wrapping. Prompts inherit the existing 26px desktop/24px phone scale; major task titles can use the resume card's 44px/37px scale. Math retains the `MathText` renderer's notation and accessibility output, rather than being forced into Spectral glyphs. Do not introduce a third mono face.

The expanded desktop sidebar remains 216px, collapsed 88px. Normal-page content uses the existing 1256px maximum, 56px desktop and 24px phone padding; compact reading/settings content narrows inside it. Preserve the 4px spacing rhythm, 44px minimum targets, 56px primary button, 6–8px controls and asymmetric lamp surface (`4px 20px 20px 4px`, smaller on phone). A wide working surface is not another floating card. Use `.lj-resume`, `.lj-shade`, `.lj-section-head`, `.lj-primary`, `.lj-text-button` and divided rows as the vocabulary.

Use `--lj-time: 160ms` ease-out for color changes. No ambient light animation, count-up scores or moving spotlights. Reduced motion removes transitions and animated scrolling; still previews remain still. Preserve the current 2px focus ring and 3px offset. A focus ring identifies a control; the warm beam identifies study position. They must remain separately legible in forced colors.

### Shared navigation, interaction and state rules

- **Normal shell:** `LjuskaglaFrame`, `Mark`, `NAV_ICONS` and `Account` surround screens 5, 8's overview, 9's hub, 10, 11, 12 and 13. Idag · Öva · Provpass · Uppslag · Framsteg stay visible, with account at sidebar foot or phone top-right. The phone bar reserves layout space and safe-area padding. Child views have a named return link; browser Back and the command palette are optional conveniences.
- **Focus shell:** screens 6, 7, 14, active repetition and active provpass replace the five-door navigation with a persistent exit, section, progress and clock. Reuse `.lj-drill-head` and `.lj-progress-line`. Returning restores the originating screen and its selection; a direct entry falls back to Öva or Provpass. Do not copy the current LÄS preview's hardcoded return to Idag into every new workflow.
- **One primary action per state:** the lamp surface contains one filled action. Quiet links may navigate or change selection. The action can change on completion or error. In a runner, selection and the primary action are separate; exam mode is an explicit exception described in screen 9.
- **Reading sheet:** preserve `useSheet` behavior and the existing space-reserving `.lj-question` construction. Peek shows the complete question cue; allow its height to grow for long copy. Open is approximately 68% of the available reading area; full occupies it. Labelled buttons provide all sheet transitions without dragging. At short heights or large text, use full mode with an explicit return to the text/figure. Never cover the only exit or obscure content behind a fixed footer.
- **Keyboard:** practice uses available letters only, Shift+letter to eliminate, Enter to confirm and then advance. Space works only when not consumed by a focused control or text interaction. J/K and arrows move paragraph light only while that aid owns the reading region. Suspend shortcuts in forms, account disclosures and dialogs; Escape closes an overlay first and never silently abandons a session. New screens must not consume bake-off switcher keys outside their active region.
- **Feedback:** keep `LjuskaglaFeedback` order: verdict plus correct answer → chosen distractor's temptation and error → pitfall and technique → solution → essential steps, with detail steps collapsed → other options. Words and glyphs carry correctness, never color alone. A missing explanation does not prevent advancing and must not invent a technique. Math-aware feedback is a B1 extension; paragraph citations remain for actual text evidence only.
- **States:** loading reserves final geometry with static blocks and a brief status; absent data is never zero. Cached/partial data remains usable with a local qualification. Failed essential content gets an inline explanation and a working retry/return action; nonessential failures do not blank the page. Completion is tied to the relevant result, not a decorative progress animation. Announce meaningful status changes politely, never every clock tick or every scroll event.
- **Data boundaries:** the preview demonstrates fixtures and local transitions. Reload/cross-device persistence is only described where real app behavior supports it, and requires future wiring. Proposed error/retry and focus improvements are requirements for the new views, not assertions that the current components already provide them. No type declarations or new data service is prescribed here.

## 5 · Öva — B1

**Purpose and primary action.** Choose a practice session without an extra setup step. With a valid recommendation, the lamp panel offers **”Öva KVA”** (replace KVA with the supplied section); a resumable practice session takes precedence with ”Fortsätt övningen”. With neither, **”Starta blandad övning”** is the neutral default. A section row starts that section directly. Repetera remains a separate, visible doorway even at zero.

**Data.** All eight sections in stable order: ORD, LÄS, MEK, ELF, XYZ, KVA, NOG, DTK; full names; recommendation and its reason when known; session position if resumable; today's repetition pile by section; number ready now. Preserve the live distinction: ”8 i dagens hög · 3 redo nu” is possible, and the session starts from the three ready questions. A low-confidence absence is not ”svagast”.

**Desktop layout.** Lamp panel at the head of the main column; all section rows below. The narrow secondary column contains the persistent repetition door and an explanation of the counts. Avoid eight equal cards.

```text
+-------------+-----------------------------------+--------------------+
| Five doors  | Öva                               | Repetera           |
| Öva active  | | Öva KVA                         | 3 redo nu          |
|             | | Kvantitativa jämförelser         | 8 i dagens hög     |
|             | | [Öva KVA ->]                    | Öppna Repetera ->  |
|             | Alla sektioner                    |                    |
|             | ORD  Ordförståelse       2 väntar |                    |
|             | LÄS  Läsförståelse          ->    |                    |
|             | ... fixed eight-section list ... |                    |
| Account     | Blandad övning ->                 |                    |
+-------------+-----------------------------------+--------------------+
```

**Phone layout.** Lamp, repetition door, then section rows in one scroll; the repetition doorway stays near the top rather than below eight sections. Name and count can wrap independently.

```text
+------------------------------+
| HP-Coach           [Konto]   |
| Öva                          |
| | Öva KVA                    |
| | [Öva KVA ->]               |
| Repetera  3 redo nu      ->  |
| 8 i dagens hög               |
| Alla sektioner               |
| ORD  Ordförståelse       ->  |
| ...                         |
| Blandad övning ->            |
| Idag Öva Prov Uppslag Framsteg|
+------------------------------+
```

**Reuse and additions.** Reuse `LjuskaglaFrame`, `.lj-resume`, `.lj-plan` divided-row rhythm and `.lj-shade`. Add `PracticeHub`, a shared `SectionRows` and `RepetitionDoor`. Selection uses the lamp/beam tokens, not section-specific color schemes.

**States.** Empty/new learner: neutral mixed invitation, no manufactured weakness; Repetera says ”Inga missar än”. Loading: reserve count slots while keeping known section doors available. Partial: hide only unavailable recommendations/counts, distinguishing unknown from zero. Failure: ”Kunde inte hämta repetitionskön” beside that door. Done: after a session, show its real completion and refresh the resume/repetition state; do not silently launch another session.

**Navigation.** Primary Öva door → this hub; section → 6, 7 or 14 as appropriate (existing LÄS/ORD/MEK views retain their destinations); Repetera → 8. The focus exit returns here with context. Account and the other four primary doors remain available.

**ADHD-PI and accessibility.** Stable row positions, one suggested action and no urgency badges. Recommendation is stated in words; every full row has a specific accessible name and 44px target. The unmistakable H moment is the solitary lit recommendation above an unboxed, shaded list.

## 6 · Kvantfråga: XYZ / KVA / NOG — B1

**Purpose and primary action.** Work through one quantitative problem. **”Svara B”** confirms the selected answer; before selection it says ”Välj ett svar” and is disabled; after feedback it becomes ”Nästa”. Preserve H's deliberate select/confirm rhythm even though the production `DrillQuestion` currently grades on pick.

**Data.** Section, actual question position/total, complete prompt, conditions, optional vector diagram, answer choices with letters and math, selection/eliminations, elapsed time and available explanation. XYZ uses its supplied alternatives, commonly A–D; never pad it to five. KVA always presents the supplied four comparison alternatives: I greater, II greater, equal, insufficient information. NOG shows the question, statements (1) and (2), and all five sufficiency choices A–E. Keep ”i (1) och (2) var för sig” distinct from ”tillsammans”.

**Desktop layout.** One broad opaque problem field, with a narrower answer column. KVA's quantities sit together within the same pool of light; NOG's two statements likewise remain simultaneously readable. There is no paragraph spotlight that hides a condition needed for comparison.

```text
+-------------------------------------------------------------------+
| Avsluta       KVA · 3 av 10                   02:14       Konto     |
+-----------------------------------------+-------------------------+
| | Villkor och frågetext                  | Välj svar               |
| | Kvantitet I      | Kvantitet II        | A I är större än II [x] |
| | math / prose     | math / prose        | B II är större än I [x] |
| | [optional figure; Förstora]            | C I är lika med II  [x] |
|                                         | D Informationen ... [x] |
|                                         | [Svara B ->]            |
+-----------------------------------------+-------------------------+
```

**Phone layout.** A single document scroll puts conditions before quantities/statements and then answers. Quantities stack with full labels when side-by-side wrapping would be cramped. The action footer reserves space; it does not cover the fifth NOG alternative. This text-only task does not need a second reading sheet.

```text
+------------------------------+
| Avsluta                Konto |
| NOG · 3/10             02:14 |
| | Fråga och förutsättningar  |
| | (1) Första påståendet      |
| | (2) Andra påståendet       |
| Tillräcklig information ...  |
| A i (1) men ej i (2)     [x] |
| B i (2) men ej i (1)     [x] |
| C tillsammans           [x] |
| D var för sig           [x] |
| E ej genom båda         [x] |
| [Svara C ->]                |
+------------------------------+
```

**Reuse and additions.** Extract the internal `Options` behavior from `LjuskaglaDrill` into reusable `AnswerRows`; extend it to render `MathText` and image options without nested buttons. Add `QuantProblem`, using `KvaPrompt`/`parseNogPrompt` content rules, and `PracticeFrame` from the drill header/action structure. Reuse figure rendering behavior where appropriate, scoped to H tokens rather than the production M3 chassis. Extend feedback for mathematical steps; do not pass quantitative content through the LÄS-only fixture hook.

**States.** Empty/unavailable question: ”Frågan saknar fullständig text”, with return to Öva. Loading: reserve problem and choices; no answer controls until complete. Partial: absent optional explanation yields ”Förklaring saknas för den här frågan” after the verdict; an essential missing diagram blocks answering with retry/return. KVA split failure preserves the full prompt rather than dropping text. Done: feedback, then a session receipt with actual correct/total and a single ”Till Öva” action.

**Navigation.** From Öva, a lesson practice link or repetition; return to that origin. Feedback's relevant ”Läs om mönstret” reaches 12 with a return to the same question. Direct question links remain identifiable and recoverable.

**ADHD-PI and accessibility.** Keep conditions and quantities together, preserve selection while consulting a figure, and show elimination controls without hover. Math must remain selectable and accessible, with fractions unclipped at text zoom. Boundaries and chosen-answer checkmarks supplement color. The H identity is a lit problem field and quiet ruled answers, not a calculator dashboard.

## 7 · DTK — B1

**Purpose and primary action.** Read a diagram, table or map and answer from its evidence. **”Svara C”**, then ”Nästa”, follows screen 6; **”Förstora figur”** is a secondary tool, not an answer action.

**Data.** The original figure page and aspect ratio, title/caption when supplied, question and alternatives (including actual image alternatives), position within the figure block, overall session progress, selection and explanation. A suitable source stress case is `var-2019-kvant1-DTK-029`, a percentage-change question using years 1985 and 2012; use its real figure rather than drawing invented bars. Shared data supplies the complete specimen.

**Desktop layout.** The figure receives roughly 60% of the workspace; the question is the stable right column. Figure title, legend, scales and footnotes remain in view or reachable by pan. The light indicates the workspace, not a purported correct series or data point.

```text
+-------------------------------------------------------------------+
| Avsluta      DTK · 7 av 10                     06:20       Konto    |
+------------------------------------------+------------------------+
| | Underlag · fråga 2 av 4 på samma sida    | Frågan                 |
| | [original chart / table / map]          | Hur stor minskning ...?|
| | full legend, axes and footnotes         | A 40 procent       [x] |
| |                                        | B 50 procent       [x] |
| Förstora figur  Rotera                    | C 60 procent       [x] |
|                                          | D 70 procent       [x] |
|                                          | [Svara C ->]           |
+------------------------------------------+------------------------+
```

**Phone layout.** Figure first; a space-reserving question sheet peeks below it. Open/full shows the complete choices. Enlargement replaces the reading workspace with a full viewport viewer, explicit close and labelled zoom/rotation controls. Return keeps the chosen answer, sheet state and figure position.

```text
+------------------------------+
| Avsluta                Konto |
| DTK · 7/10             06:20 |
| Underlag · samma sida 2/4    |
| | [complete figure preview] |
| | [Förstora figur]          |
| Rotera                      |
+------------------------------+
| [Visa frågan ^]             |
| Hur stor var minskningen ...|
| (open: choices + Svara)     |
+------------------------------+
```

**Reuse and additions.** Reuse `PracticeFrame`, `AnswerRows`, `.lj-reading-layout`, `useSheet` and feedback. Add `FigureWorkspace` around `QuestionFigure`'s SVG/raster/zoom/rotation behavior; its current portal renders outside the direction root, so theme scope must reach the viewer. B1 owns this once; B2 reuses it in provpass. Raster source pages retain their original colors on an opaque backing in both themes; never invert a chart or tint its numerical values. SVG may inherit H ink where designed to use `currentColor`.

**States.** Empty: no usable figure-dependent question → honest unavailable state. Loading reserves aspect ratio and keeps the footer still. Partial: available figure but missing explanatory text allows answering; missing figure or image choice needed for the task disables confirmation, exposes retry and retains any selection. A label such as ”Cirkeldiagram A” is not a substitute for an unavailable chart. Done: feedback keeps the source visible; moving within a shared figure block preserves pan/zoom rather than resetting it.

**Navigation.** Öva/DTK or repetition → focus workspace; exit returns to the source. Viewer close returns focus to ”Förstora figur”; a new figure resets view intentionally. Exam usage takes screen 9's grading and clock rules.

**ADHD-PI and accessibility.** ”Samma sida · 2 av 4” reduces reorientation. No animated plotting. Zoom, pan, reset and rotate have keyboard/button equivalents to gestures; an open modal traps focus and suspends answer keys. Use source-backed alt text and a structured table only when data exists; missing accessible figure equivalents remain an explicit content dependency. Ljuskägla is recognizable through its warm workspace edge and steady question column, not decorative chart recoloring.

## 8 · Repetera — B1

**Purpose and primary action.** Revisit due mistakes in a bounded session. **”Repetera 3 frågor”** uses the actual due count, capped at the existing ten-question session size. A resumable compatible session instead offers ”Fortsätt repetitionen”. With nothing ready, the single primary becomes ”Öva istället”.

**Data.** Due count, today's larger pile when different, section filter, selected session size, existing replay position, and actual completion outcome. Keep all-queue versus section-scoped sessions distinct. Questions no longer due must not be advertised as available merely because they occurred in an old saved plan.

**Desktop layout.** A bounded lamp panel explains the next short session; subordinate counts and section links sit in open space alongside it. Reuse the corresponding question view during active replay.

```text
+-------------+----------------------------------+--------------------+
| Five doors  | Öva / Repetera                   | I dagens hög       |
| Öva active  | | 3 frågor redo nu               | 8 frågor           |
|             | | De äldsta först                | Övriga blir redo   |
|             | | [Repetera 3 frågor ->]         | senare             |
|             | Alla   ORD 2   KVA 1             |                    |
| Account     | Till Öva ->                      |                    |
+-------------+----------------------------------+--------------------+
```

**Phone layout.** Same order, with the distinction between ready and later directly under the primary; section filters wrap. Active replay enters focus mode and temporarily removes the bottom bar.

```text
+------------------------------+
| HP-Coach           Konto     |
| Till Öva                    |
| Repetera                    |
| | 3 frågor redo nu          |
| | [Repetera 3 frågor ->]    |
| 8 i dagens hög              |
| Alla   ORD 2   KVA 1        |
| Idag Öva Prov Uppslag Framsteg|
+------------------------------+
```

**Reuse and additions.** `RepetitionOverview` uses `.lj-resume`, `RepetitionDoor`, `SectionRows` and `.lj-shade`; active replay uses existing LÄS and the B1/B3 task renderers, never a separate visual family. Reuse `.lj-done` for its receipt.

**States.** Empty distinguishes no mistakes yet, no questions due now, and a cleared queue: ”Inga missar än”, ”Inget är redo just nu”, or ”Klart för nu”. Loading keeps the action disabled until the queue is known. Partial shows due questions that resolve and states if saved items are no longer available; never restart silently at question one. Error says the queue could not load, not that it is empty. Done shows results for the performed session and any remaining due count; a wrong replay is not presented as resolved. Completed `?done=` entries reopen that receipt rather than a new session.

**Navigation.** Öva → Repetera; section-specific doorway retains its filter. ”Avsluta” in active replay returns to the overview. Completion returns to Öva or offers another bounded session only if real due items remain. History opens the completed repetition result with a visible return to Historik.

**ADHD-PI and accessibility.** No overdue debt, red counters or loss framing. State the finite batch before entry. Announce the session outcome once and expose count/filter labels to assistive technology. The lit bounded invitation surrounded by quiet future work makes this unmistakably H.

## 9 · Provpass: hub and running pass — B2

**Purpose and primary action.** Enter and complete a timed pass with known conditions. Hub primary: **”Starta provpass”** opens confirmation for the chosen pass; confirmation primary: **”Starta nu”** starts the clock only after a valid session is ready. A running pass uses **”Nästa fråga”** as its main movement; at the end it becomes the new **”Granska svar”** step, then **”Lämna in”** in the review/confirmation state. A persistent quiet ”Lämna in” also permits early submission.

**Data.** Authentic versus generated, verbal versus quantitative, sitting/pass identity, supplied versus expected 40 questions, seen-before count, section makeup and 55-minute limit. Running: actual question count, selected answers, current index, answered/unanswered map and remaining time. The selected pass, not a generic ”40 frågor”, supplies confirmation copy. An authentic 39-question pass must disclose ”39 av 40 frågor tillgängliga” before start.

**Desktop hub layout.** One chosen/suggested pass in the lamp panel; modes above it, other sittings in a divided register below. Preserve the selected mode while browsing alternatives.

```text
+-------------+-----------------------------------------------------+
| Five doors  | Provpass                                            |
| Prov active | Riktigt pass / Genererat     Verbal / Kvant          |
|             | | Hösten 2025 · Provpass 2                          |
|             | | 40 frågor · 55 minuter · sett 6 av 40             |
|             | | [Starta provpass ->]                             |
|             | Andra provtillfällen                                |
| Account     | Våren 2025      Pass 1 / Pass 2                     |
+-------------+-----------------------------------------------------+
```

**Phone hub layout.** Mode controls wrap above the selected pass. The remaining register becomes stacked sitting rows, not a squeezed matrix.

```text
+------------------------------+
| HP-Coach             Konto   |
| Provpass                    |
| Riktigt / Genererat          |
| Verbal / Kvant               |
| | Hösten 2025 · Provpass 2  |
| | 40 frågor · 55 minuter    |
| | Sett 6 av 40              |
| | [Starta provpass ->]      |
| Andra provtillfällen ...     |
| Idag Öva Prov Uppslag Framsteg|
+------------------------------+
```

**Desktop running layout.** Focus header, compact answer map and the same task surfaces as 6/7/14. Answers are editable; choosing one saves selection without revealing correctness. There is no practice ”Svara” or explanation. Read-only still previews do not run the clock.

```text
+-------------------------------------------------------------------+
| Avbryt provpass   Verbal · 12 av 40     38:12 kvar    Lämna in      |
| Svarsöversikt: 1 ... 10 | 11 [12] 13 ... 40                        |
+------------------------------------------+------------------------+
| | Passage / figure / quantitative setup   | Fråga och svar         |
| | readable opaque field                  | A ...                  |
| |                                        | B ... [Valt]           |
|                                          | C ...   D ...          |
|                                          | Föregående             |
|                                          | [Nästa fråga ->]       |
+------------------------------------------+------------------------+
```

**Phone running layout.** Persistent clock and exit; ”Svarsöversikt · 18 av 40 besvarade” opens a separate accessible map. Each question uses the B1/B3 responsive layout; a reading question retains its sheet. Overview shows numbered targets of at least 44px with textual state, not tiny dots.

```text
+------------------------------+
| Avbryt provpass        Konto |
| 38:12 kvar                   |
| ELF · 12/40     Lämna in     |
| Svarsöversikt · 18/40    ->  |
| | Text / figure / problem   |
| [Visa frågan ^]             |
| A ...   B ... [Valt]        |
| C ...   D ...               |
| Föregående                  |
| [Nästa fråga ->]            |
+------------------------------+
```

**Reuse and additions.** Reuse frame, lamp panel, `PracticeFrame` geometry and B1/B3 task bodies through an explicit exam mode. Add `PassPicker`, `PassConfirmation`, `TimedPassFrame` and `AnswerOverview`. Preserve the existing mock flow's timing and answer semantics while restyling its confirmation; do not call the practice feedback hook. Existing mock keyboard behavior is letters to choose and left/right to navigate, with no global Enter advance. Arrow navigation must yield to focused controls, figure pan and reading aids.

**States.** Empty: no available authentic pass offers a supplied generated pass or return, never starts an empty plan. Loading resolves the plan before enabling start. Partial discloses missing questions/exposure but uses the supplied count throughout. Running resumes with original start time and answers where supported; leaving a page does not pause the clock. Do not promise a ”Pausa” feature. Start/answer/submission failures keep context and distinguish ”Skickar in…” from ”Kunde inte lämna in”; do not call a local answer saved without confirmation. Expiry submits once and shows pending/result recovery rather than a frozen runner. Done opens 10 only when the result is available. Existing expired-resume handling can end an old session without reconstructing a result; in that case say the session ended and no result is available, not that it was graded.

**Navigation and safeguards.** Provpass door → hub → named confirmation → running → review/submission → 10. Cancel confirmation returns to the chosen pass. ”Avbryt provpass” confirms that it invalidates the pass; dismissal preserves the running pass. Submission confirmation names unanswered questions. The named ”Avbryt provpass” and ”Lämna in provpasset” dialogs are new UI work; production `MockRunner` uses `window.confirm` for those decisions. No verdicts, solution hints, correct-answer styling or grading-related sound before submission.

**ADHD-PI and accessibility.** Stable answer map, one current-location beam and a steady tabular clock. Warn once at an agreed threshold (existing runner uses five minutes), without flashing or announcing every second. Confirm dialogs restore focus and prevent background shortcuts. H's lit work area persists while navigation recedes; the answer map is a quiet index, not a second dashboard.

## 10 · Provpassresultat — B2

**Purpose and primary action.** Understand the result and choose one useful next step. **”Se frågorna du missade”** opens an inline review when missed-question content is available. With no misses, use **”Till Framsteg”**. With missing review content, show the limitation and offer **”Till Öva”**, not an inert review button. This review is a result view; it does not assume every miss is already due for repetition.

**Data.** Pass identity, half and mode, correct/presented/answered counts, unanswered count, total time, per-section correct/presented/time, time budget, previously seen questions, available trap cluster, score method and comparable previous results. The raw fraction leads. When available, ”Normerat (härlett)” explains that a 40-question pass is scaled to an 80-question half before reading the sitting's table; it is not an official individual-pass score. Otherwise label the value ”Skattad poäng” and retain the indicative, non-UHR caveat. A result that includes P5 questions is not calibrated, even when a sitting table supplies the conversion; the visible result caveat must state this while retaining those questions in the raw score (`normering.ts:27–31`). A missing score stays absent.

**Desktop layout.** One lamp receipt with the raw result and next action; section and pacing details form an open ledger below. Context and prior same-mode/same-half results occupy the quiet right margin. Review expands below the receipt, retaining the result above it.

```text
+-------------+-----------------------------------+--------------------+
| Five doors  | Provpasset klart                  | Om passet          |
| Prov active | | 28 av 39 rätt                   | Verbal · riktigt   |
|             | | 1 fråga saknas; rättat av 39    | Sett 6 av 39       |
|             | | 2 obesvarade · 54 min          | Poängmetod + caveat|
|             | | [Se frågorna du missade ->]    | Tidigare pass      |
|             | Sektion  Rätt    Tid    Budget   | same kind only     |
|             | ORD      8/10    ...    ...      |                    |
| Account     | LÄS ... / Återkommande mönster   |                    |
+-------------+-----------------------------------+--------------------+
```

**Phone layout.** Receipt → method/caveat and exposure → section results → tempo → missed questions/prior passes. Section rows stack their timing below the score rather than shrinking the whole table. Every detail is reachable without horizontal page scrolling.

```text
+------------------------------+
| HP-Coach             Konto   |
| Provpasset klart             |
| | 28 av 39 rätt              |
| | 1 fråga saknas             |
| | [Se frågorna du missade]   |
| Poängmetod och caveat        |
| Sett 6 av 39 · 2 obesvarade  |
| ORD 8/10                    |
| Tid ... / budget ...         |
| ...                         |
| Idag Öva Prov Uppslag Framsteg|
+------------------------------+
```

**Reuse and additions.** Extend `.lj-done`, `.lj-score`, `.lj-shade` and `.lj-recent` into `PassReceipt`, `SectionOutcomeRows` and `PassReview`. `PassReview` is a new capability dependent on hpf-qr0p.7 supplying question content and the session attempts' picked answers: the stored mock breakdown has only question IDs for per-question detail, not question objects or picks (`MockResult.tsx:5–10`). Until that data is available, use the missing-review-content fallback above. Use the existing mock result's content/method rules; use `LjuskaglaFeedback` ordering in a reviewed question. The receipt has a beam and a single action, not three large metric cards or confetti.

**States.** Empty/not found: ”Hittar inte resultatet” with ”Till Provpass”; distinguish this from loading. Loading reserves receipt and rows. Partial retains raw result when norming, explanations or history are unavailable; disclose actual denominator and suppress unsupported comparisons. Submission still pending belongs to 9, not a fake completed receipt. Done means the saved result can be reopened; review does not create new attempts. Unanswered items are labelled ”Obesvarad” separately from wrong answers and do not acquire an invented picked answer.

**Navigation.** From submitted pass or a saved mock result link; the production counterpart is `/prov?result=<id>`. The Provpass door remains active. Return goes to its hub; Framsteg is also directly reachable. Practice/lesson links carry the relevant section or supplied pattern, with return context.

**ADHD-PI and accessibility.** First show what happened, then one actionable pattern; no ranking against other users. Tables retain row/column semantics and captions even when visually stacked. Score method and missing-question disclosure stay visible, not tooltip-only. The plain receipt illuminated against a quiet room is H's completion motif.

## 11 · Framsteg, including Historik — B2

**Purpose and primary action.** Understand progress well enough to choose the next practice step. With meaningful evidence, **”Öva KVA”** names the recommended section and its reason. With no basis for a recommendation, use **”Välj övning”**. The new-learner state may preserve the existing **”Börja här · 10 frågor”** diagnostic entry when the preview supports that destination. Historik's primary action is opening a selected completed pass, labelled **”Visa passet”**; it does not force new practice.

**Data.** Current estimated total and halves where available, actual target, change over the stated period, attempt count, accuracy and confidence, last-practised time per section, weekly estimates and gaps, 12-week activity, repetition summary and completed sessions. Use the supplied target; do not copy the production view's hardcoded 1,8 into this direction. Where LÄS/ELF practice contributes to an estimate, render the approved `ESTIMATE_CAVEAT` verbatim. Unknown and stale sections remain identifiable, not silently ranked as zero.

**Desktop layout.** A quiet overview heads a single lit recommended action. Trend and section rows are supporting evidence, with activity in the secondary column. ”Översikt” and ”Historik” are visible sibling links inside Framsteg, not extra primary doors. Historik uses a date-grouped list and an adjacent selected-pass summary where room allows.

```text
+-------------+-----------------------------------+--------------------+
| Five doors  | Framsteg · Översikt / Historik    | Senaste 12 veckorna|
| Fram active | 1,41 av 2,0 · uppskattning        | [activity strip]   |
|             | caveat + actual target           | Visa dagar ->      |
|             | | KVA · reason and confidence    |                    |
|             | | [Öva KVA ->]                   | Repetition         |
|             | [12-week trend; gaps visible]    | summary + link     |
|             | Sektion  Poäng  Underlag  Trend  |                    |
| Account     | ORD ... / all eight rows         |                    |
+-------------+-----------------------------------+--------------------+
| Historik: dates + pass rows | | Selected pass [Visa passet ->]      |
+-------------------------------------------------------------------+
```

**Phone layout.** Overview → recommendation → trend → sections → activity. Switching to Historik replaces that content with a chronological list; the navigation and account stay present. Selecting a pass opens its result without requiring a tiny expansion target.

```text
+------------------------------+
| HP-Coach             Konto   |
| Framsteg                    |
| Översikt / Historik          |
| 1,41 av 2,0 · uppskattning   |
| caveat                       |
| | KVA · reason              |
| | [Öva KVA ->]              |
| [trend]  Visa värden         |
| ORD ... / eight sections    |
| [activity] Visa dagar        |
| Idag Öva Prov Uppslag Framsteg|
+------------------------------+
| Historik view:               |
| 19 okt  KVA 7/10  Visa passet|
| 18 okt  Repetition 4/6    -> |
| Provpassresultat ->          |
+------------------------------+
```

**Reuse and additions.** Reuse home `Prognosis`/`Recent` visual vocabulary, extracting their currently fixture-bound rendering before reuse. Add `ProgressOverview`, `TrendFigure`, `ActivityStrip`, `SectionEvidenceRows` and `HistoryList`. Use lamp/beam only on the recommended action or selected history item; trends use a single accent with labelled endpoints and an explicitly distinct target line. No new rainbow section palette.

**States.** Empty: invitation to establish a baseline; no zero score or fictional curve. Loading reserves the overview and rows. Partial: show only known halves, gaps in weekly data, and ”För lite underlag” or ”Inte övad än” where appropriate; keep cached data with a stale qualification on failure. History load failure is not ”Inga avslutade pass”. Done: opening a completed session reconstructs its result and returns to the same history position. A completed session can refresh evidence, but the page does not invent a celebratory improvement.

**Navigation.** Framsteg door → overview; Historik remains inside it even for a direct `/historik` entry. Existing drill/repetition history links reconstruct `/drill?done=<id>` or `/repetition?done=<id>`. Mock results currently use a separate source and `/prov?result=<id>`; keep an explicit ”Provpassresultat” entry unless the shared data contract supplies a unified list. Do not advertise diagnostics as reconstructable history. Practice/lesson links and account remain visible without the command palette.

**ADHD-PI and accessibility.** Stable section order and one explanation for the recommendation; no punitive streaks or red empty days. Charts have concise textual summaries and ”Visa värden”/”Visa dagar” equivalents with dates and values. Keyboard users need not traverse 84 decorative calendar cells. Sorting, selection and missingness must be explained in words. H's distinctive choice is to illuminate the next useful action while keeping evidence in a calm ledger.

## 12 · Uppslag & lektion — B3

**Purpose and primary action.** Find a relevant learning pattern, read it, then practise it. Picker primary: **”Läs KVA”** or **”Fortsätt läsa KVA”** when a real bookmark exists. Without a recommendation, selecting a section row is the main action; do not fabricate a weakest section. Reader primary: **”Öva detta mönster”**, or the existing family-specific equivalent, for the currently opened entry. Other entry links and ”Markera som läst” are secondary controls.

**Data.** Eight sections and availability, section descriptions, real recommendation evidence, estimated reading time, catalogue entries and their actual families, examples, read/unread marks and last-opened entry. Quantitative trap entries contain recognition cues, failure conditions, countermeasure and worked example; DTK/MEK/LÄS/ELF use tactics/protocols/taxonomy; ORD uses roots, meaning and word examples. Preserve those content differences, not one generic lesson card. Example questions link to practice without disclosing the answer letter in the lesson.

**Desktop picker layout.** One bookmarked/recommended section lit at the head of a narrow directory; all sections remain in a stable list below. **Desktop reader layout:** the sidebar remains, a compact local contents list sits beside a 60–68ch reading field, and the opened entry receives the warm edge. Only the current entry's practice action is filled.

```text
+-------------+-----------------------------------------------------+
| Five doors  | Uppslag                                             |
| Upp active  | | Fortsätt läsa KVA                                 |
|             | | [Fortsätt läsa KVA ->]                            |
|             | ORD  Ordrötter                          Läs ->      |
|             | LÄS  Läsförståelse                      Läs ->      |
| Account     | ... eight sections; availability stated             |
+-------------+-------------------+---------------------------------+
| Reader      | Till Uppslag      | KVA · reading-time estimate     |
| Five doors  | Innehåll          | | Open pattern title            |
|             | current entry -> | | Igenkänningstecken             |
|             | other entries    | | Motåtgärd / worked example     |
| Account     |                  | Markera som läst                 |
|             |                  | [Öva detta mönster ->]           |
+-------------+-------------------+---------------------------------+
```

**Phone layout.** Picker rows stack normally. Reader uses ”Till Uppslag”, a contents disclosure and one continuous reading scroll. The practice action follows the active entry, not a floating obstruction over prose. Keep the bottom navigation visible with Uppslag selected.

```text
+------------------------------+
| HP-Coach             Konto   |
| Uppslag                     |
| | [Fortsätt läsa KVA ->]    |
| ORD  Ordrötter           -> |
| ... eight section rows ...  |
| Idag Öva Prov Uppslag Framsteg|
+------------------------------+
| Reader: Till Uppslag         |
| KVA · Innehåll [v]           |
| | Pattern title             |
| | cues, countermeasure      |
| | worked example            |
| Markera som läst             |
| [Öva detta mönster ->]       |
| Idag Öva Prov Uppslag Framsteg|
+------------------------------+
```

**Reuse and additions.** Reuse `SectionRows`, `.lj-paragraph`/`.lj-feedback-section` reading rhythm, `Rich` for actual step links, `.lj-resume` for resume and the H frame. Add `ReferenceIndex` and `LessonSurface`; render the content responsibilities of `TrapCard`, `ProtocolCard` and `LexiconCard` in H's vocabulary rather than importing their M3 styling. Preserve `MarkAsReadPill`, `PracticeLink`, `SectionPracticeCTA` and `ExampleQuestions` semantics. Lesson position uses a lit entry; optional paragraph light is local to prose and never dims mathematical conditions or worked-example comparisons.

**States.** Empty/unwired: ”Inget innehåll här ännu” next to the section, with a working return/other section. Loading reserves headings and prose measure. Partial: missing examples do not hide the lesson; say an example is unavailable rather than endlessly ”laddar”. Failed framework fetch offers retry. Bookmark restoration opens the known entry; if absent, land at the section heading and explain that the reading position could not be restored. Done: explicit ”Läst” can be undone; scrolling/opening alone records position, not completion. Read marks and bookmarks have separate persistence mechanisms; a local optimistic read mark is not proof of server sync.

**Navigation.** Uppslag door → directory → section reader; feedback may enter `/lektion?section=KVA#<entry>` directly. ”Till Uppslag” always works. Practice links preserve section/pattern or example question and a return to the same entry. A learner arriving from a question can return there without losing selection.

**ADHD-PI and accessibility.** One open entry can guide attention, but opening another must not erase read marks or prevent deliberate comparison. Contents headings and disclosures expose expanded state, and deep links focus the opened heading without hiding it under chrome. Meaningful mathematical rendering and list semantics survive. The lit reading place, quiet directory and restrained Spectral prose extend H's reading-room identity beyond passages.

## 13 · Konto & inställningar — B3

**Purpose and primary action.** Adjust the reading environment and return to the task. Settings apply immediately; the page's single filled action is **”Tillbaka till Öva”**, **”Tillbaka till läsningen”** or the actual originating destination. Do not add a fictitious ”Spara” step to immediate preferences. Account export/deletion are separate explicit user-triggered operations deep in account content.

**Data.** Display name and full email, available plan/information, theme, coach voice, smart/random question selection, relevant existing palette/advanced settings, tools/help/legal destinations, and current paragraph-light state. Distinguish persistent app preferences from H's currently local spotlight state. Use invented demo identity in the preview, never actual user data. Payment and authentication-method placeholders must remain informational until implemented.

**Desktop layout.** Keep the five-door sidebar. Account and settings are two visible local sections; the default is the destination chosen in the account disclosure. The reading-settings group is a modest lamp surface, with identity and tools as divided rows. Export and typed-confirmation deletion sit at the bottom of Konto, never in the popover or the primary reading panel.

```text
+-------------+-----------------------------------------------------+
| Five doors  | Konto / Inställningar                               |
|             | Ditt läsrum                                         |
|             | | Läge             Ljust / Mörkt                    |
|             | | Styckeljus       På / Av                          |
|             | | [Tillbaka till Öva ->]                            |
|             | Coach              Kompis / Professor / Taktiker    |
|             | Urval              Smart / Slumpat                  |
|             | Verktyg / Hjälp & support                           |
| Account     | Konto: full identity, plan notes, legal links       |
|             | ... export before typed deletion, deep below ...    |
+-------------+-----------------------------------------------------+
```

**Phone layout.** Identity and preferences wrap without truncating email. Groups stack; local Konto/Inställningar links remain clear above them. The account disclosure itself stays small and dismissible, with destinations rather than the whole settings form.

```text
+------------------------------+
| HP-Coach             Konto   |
| Konto / Inställningar        |
| Ditt läsrum                  |
| | Läge: Ljust / Mörkt        |
| | Styckeljus: På / Av        |
| | [Tillbaka till Öva ->]     |
| Coach ...                   |
| Urval ...                   |
| Verktyg / Hjälp              |
| Konto: identity, plan ...    |
| Idag Öva Prov Uppslag Framsteg|
+------------------------------+
```

**Reuse and additions.** Extend the existing `Account` disclosure with ”Konto” and ”Inställningar” destinations and contextual return; keep its dismiss/focus-return behavior. Add `SettingsSurface`, `PreferenceRow` and `AccountDetails`, reusing `.lj-theme`, `.lj-switch`, `.lj-menu-heading`, `.lj-shade` and `.lj-primary`. No embedded provider profile or new billing flow. Preserve actual tool destinations from `/mer` (Diagnostik, Provpass, Avancerat, Feedback, help and legal), but keep developer design controls in the bake-off's own chrome. Palette/advanced controls must not recolor H's scoped comparison preview; their future production mapping is an owner question.

**States.** Empty/unknown identity: ”Kontouppgifter saknas” with a known return or sign-in action, never a fabricated account. Loading affects only unresolved identity/settings. Partial/offline: retain local preference selection; expose failure next to the affected control when persistence fails, never claim ”Synkat” speculatively. Done: apply an appearance change without a full-page reset, announce it briefly, and return to the previous scroll/selection. Export shows its own pending/success/failure state. Deletion requires exact typed `radera`, disables duplicate submission and ends in a signed-out completion only after success; in the bake-off these are simulated states with no real destructive request.

**Navigation.** Reachable through Account from every primary screen and the focus header. Konto maps to `/konto`, settings to `/mer`; neither becomes a sixth primary destination. Return targets are explicit; direct entry falls back to Idag. Opening settings during a timed pass must not pause or reset its clock. Sign-out belongs to the account surface, not a practice primary action.

**ADHD-PI and accessibility.** Use labelled radio groups for exclusive choices and a labelled pressed/switch state for paragraph light. Change the sample/reading surface immediately without moving focus. No menu role unless a complete menu keyboard model exists. On phone the popover fits within the viewport at large text. The focused group gets one quiet pool of light; settings never become a wall of luminous switches.

**Account source discrepancy.** The opening comment in `konto.tsx` says no deletion on the surface, but the rendered `DeleteAccountSection` and its later comment place it deep on the page with export first and typed confirmation. This spec preserves that implemented placement and does not broaden it. Owner reconciliation is recorded below; it is not a reason to move deletion into the account menu.

## 14 · ELF-läsfråga — B3

**Purpose and primary action.** Read English assessment material without losing place while answering. **”Svara B”**, then ”Nästa”, follows the existing H LÄS flow. All app controls stay Swedish; the passage, English prompt and English answer text retain their source language. Add `lang="en"` boundaries (new work); the current H root sets only `lang="sv"`.

**Data.** Real ELF unit/title/revision, passage and byline, paragraph boundaries, question order and actual alternatives, selection/elimination, explanation and source-backed citations, origin disclosure and elapsed time. The committed P5 sample's `elf-b19-003`, ”Counting Pots from the Pavement”, is the one-paragraph, one-question `ELF_SHORT_UNIT`, with question `p5-elf-b19-003-r1-ELF-001`. It does not exercise the long-passage or paragraph-light layout drawn below. Require a genuine multi-paragraph ELF reading fixture from the approved P5 set via the shared kit hpf-qr0p.7, or an authentic corpus passage shown with its real source instead of the ÖVNINGSTEXT badge. The wireframes illustrate that multi-paragraph fixture, not `ELF_SHORT_UNIT`; use its full real content, not translated LÄS prose. The sample's only other ELF unit is cloze unit `elf-b18-002`, ”Left to Soak”; exercise cloze as a separate state if supplied by the shared fixtures, never as a stand-in for the multi-paragraph reading fixture. P5 ELF alternatives are A–D, not a synthetic fifth option.

**Desktop layout.** Reuse the approximately 1.55:1 reading/question split, opaque paper at left and room surface at right. The warm paragraph light follows deliberate reading focus. English question and choices form one language island; Swedish status, controls and explanation labels remain outside it.

```text
+-------------------------------------------------------------------+
| Avsluta       ELF · 1 av 4                   03:10       Konto     |
+------------------------------------------+------------------------+
| Styckeljus På/Av     J/K        ¶3/8      | Fråga 1 av 4 · ELF     |
| ÖVNINGSTEXT   Om texten                  | [English prompt]       |
| [Multi-paragraph ELF title]              | A [English choice] [x] |
| 1 [English paragraph]                    | B [English choice] [x] |
| 2 [English paragraph]                    | C [English choice] [x] |
| |3 [lit English paragraph]               | D [English choice] [x] |
| 4 [English paragraph]                    | [Svara B ->]           |
+------------------------------------------+------------------------+
```

**Phone layout.** Passage-first with paragraph-light control, complete question cue in the peek, and open/full sheet states. Returning to the passage from feedback restores its reading place. A citation folds the sheet, brings the cited paragraph into view and provides ”Tillbaka till facit”. The displayed paragraph count comes from the real unit, not the wireframe's illustrative eight.

```text
+------------------------------+
| Avsluta                Konto |
| ELF · 1/4              03:10 |
| Styckeljus På/Av      ¶3/8  |
| ÖVNINGSTEXT   Om texten     |
| English title              |
| 2 [English paragraph]       |
| |3 [lit English paragraph]  |
+------------------------------+
| [Visa frågan ^]             |
| [full English question cue] |
| (open: A–D + Svara B)       |
+------------------------------+
```

**Reuse and additions.** Extend `LjuskaglaDrill` into a data-driven `ReadingWorkspace` supporting both LÄS and ELF; the current `UNIT` and `R1Unit` are LÄS-specific and must not be relabelled as ELF. Reuse `Reading`, `Cites`, `Rich`, `LjuskaglaFeedback`, `AnswerRows`, `useSheet`, `.lj-passage`, `.lj-paragraph` and `.lj-light-controls`. B3 shares the B1 frame and answer parts; it does not fork them. English passage/prompt/options get `lang="en"` on their actual content elements, not the entire mixed-language screen. English quotations inside Swedish explanations also get the appropriate language boundary.

**States.** Empty: missing passage or choices → unavailable state with return to Öva; do not call it complete. Loading: stable passage measure and disabled answer action. Partial: retain the passage if explanation or byline is missing; unresolved citations render as text, never point to the wrong paragraph. Cloze keeps numbered gaps visually and semantically distinct from ordinary numbers in prose, lights the relevant paragraph without inserting the right answer, and preserves the full passage. Do not rely solely on the production empty-prompt cloze heuristic: the P5 specimen uses a prompt such as ”Gap (1)”. Done: ”Texten är färdigläst”, actual correct/total and elapsed time, then one context-appropriate return/next-plan action.

**Disclosure and feedback.** For synthetic practice, reuse `OVNINGSTEXT_BADGE` and the approved note verbatim from the shared fixture; never place the badge inside the English passage or translation. Keep ”Om texten” reachable. Until the owner resolves first-open disclosure, retain the existing collapsed-note behavior and demonstrate the expanded state; do not silently change policy. Authentic content, if shown in timed passes, must not be labelled synthetic. Feedback retains the established order and real available explanation language, without inventing an English translation or adding dictionary hints during an assessment.

**Navigation.** Öva/ELF, a compatible resume, repetition or a lesson example → this workspace; explicit exit returns to the source. Citations stay inside the unit and return to the prior feedback position. Exam usage follows screen 9: no feedback before submission, and no aid may disclose correctness.

**ADHD-PI and accessibility.** Paragraph light is visibly optional and never reduces surrounding prose below the contrast target. Scrolling can move light without moving keyboard focus or flooding the live region; deliberate citation activation moves focus to the evidence and offers return. Selection remains text-selectable; paragraph numbers have meaningful button labels. Preserve text spacing, long-English-word wrapping and full sheet controls at zoom. The unmistakable H feature is warm light on a real English paragraph with a quiet, separate question surface.

## Shared implementation and verification handoff

### Component inventory and batch boundaries

| Batch | New or extracted responsibilities | Reuse by later batches |
| --- | --- | --- |
| B1 · 5–8 | `PracticeHub`, `SectionRows`, `RepetitionDoor`, `RepetitionOverview`; extract `PracticeFrame` and `AnswerRows`; add `QuantProblem` and `FigureWorkspace`; make feedback math-aware. | B2 imports the question/figure/answer surfaces in exam mode. B3 imports section rows, frame and answer behavior. Keep existing LÄS behavior intact during extraction. |
| B2 · 9–11 | `PassPicker`, `PassConfirmation`, `TimedPassFrame`, `AnswerOverview`, `PassReceipt`, `SectionOutcomeRows`, `PassReview`, `ProgressOverview`, `TrendFigure`, `ActivityStrip`, `SectionEvidenceRows`, `HistoryList`. | Reuse B1 parts without modifying practice grading semantics. Extract home `Prognosis`/`Recent` rendering where useful; keep their existing screen-1 appearance. |
| B3 · 12–14 | `ReferenceIndex`, `LessonSurface`, `SettingsSurface`, `PreferenceRow`, `AccountDetails`; evolve existing LÄS into `ReadingWorkspace` with ELF support and extend `Account` destinations. | Reuse B1 parts and B2 result destinations. The final reading workspace serves both ordinary practice and B2 exam presentation. |

These are responsibilities that may share files; they are not permission to modify outside each worker's later admitted write set. B1 establishes one direction-local export surface for shared parts. B2/B3 consume it rather than copying implementations. Each batch must record changes to shared files in its own contract before implementation. Integrate against hpf-qr0p.7's published data/view-model interface; do not independently design a second interface from this document.

B2 can build its hub, timed state and results against B1's quant/DTK parts and the existing H LÄS presentation. Its final ELF coverage depends on B3's `ReadingWorkspace`; wire that renderer into exam mode after B3 lands. Do not fork an interim ELF renderer or call a verbal pass fully covered before that integration. The shared contract must also resolve ordinary ORD/MEK presentations; these ten screen specifications do not replace their question content with LÄS.

Keep root CSS and fonts direction-scoped, lazy and free of global `:root`, M3 or production-route changes. Raster zoom portals need explicit H theme scope. Preserve existing test IDs where behavior is retained; coordinate new screen/fixture selectors with the shared bake-off contract rather than deriving them independently in each batch.

### Evidence required from the build batches

- Render every new numbered screen at 1440×900 and 390×844 in light and dark. Include both hub/running for 9, overview/history for 11 and picker/reader for 12, plus open/full sheets, figure zoom, KVA/NOG variants and account subviews. Check narrow/short viewports and text-spacing overrides rather than relying only on the target screenshot dimensions.
- Demonstrate a connected local journey: Öva → quant/DTK → feedback → completion; Öva → Repetera → completion; Provpass → confirmation → editable answers → submit → saved result; Framsteg → Historik → completed result → return; Uppslag → lesson → practice → same entry; ELF → citation → facit → completion; account settings → return with reading position.
- Show empty, loading, partial, failure and done states with honest fixture data. Exercise mixed option counts, missing essential figures, missing explanations, incomplete authentic passes, unavailable history, and new-learner estimates. Do not make success fixtures contradict the underlying fractions or claim unavailable sync.
- Check keyboard ownership and return focus through account, confirmation, figure viewer and reading sheets. Verify 44px targets, body contrast including shade, UI contrast, forced colors, 200% text/zoom and reduced motion. A chart's accessible summary must agree with the numbers; an unavailable figure description is recorded as a content gap, not a passed check.
- Recheck screens 1–4 after shared extraction, and inspect the new H screens beside other directions with fallback fonts as well as loaded faces. The beam, asymmetric lamp surface, opaque reading field and open secondary rows must distinguish H even when fonts/colors are not the deciding cue. Never claim browser, contrast or screenshot checks on the strength of this document alone.

### Open questions for the owner

1. **First-open practice disclosure:** should ”Om texten” expand once per new synthetic unit? Recommended: expand on first encounter, remain available afterward, but keep the current collapsed behavior until this is decided. All builds retain the approved copy verbatim.
2. **Paragraph-light persistence:** should its on/off state follow the account across devices or remain device-local? Recommended: use a named reading preference in the eventual app integration; the bake-off preserves it locally within the preview and makes no sync promise.
3. **Account policy commentary:** confirm that the currently implemented deep account deletion flow remains the intended boundary and retire the contradictory opening comment in a separately scoped change. Recommended: preserve export-first and typed confirmation, with no deletion in menus; this document authorizes no real deletion or credential work.
4. **Figure accessibility content:** who supplies reviewed text/table equivalents for dense DTK raster pages and image choices? Recommended: source-backed descriptions from the shared content work; zoom alone does not satisfy that requirement. No invented data transcription.
5. **Result/history scope:** should the eventual Historik unify drill, repetition and provpass? Recommended for these batches: retain the existing reconstructable histories with an explicit mock-result doorway until the shared view model supplies a unified list. Diagnostic history remains outside this contract.
6. **Existing palette and advanced preferences:** how should they interact with a selected design direction after the bake-off? Recommended: leave H's comparison palette fixed here, preserve tools/account reachability, and settle production token mapping when a direction is chosen.
7. **Opening theme and stored default:** which theme should H screens open in, and is a separate stored default-theme preference wanted? H is dark-first (`meta.ts` says ”Mörkt läge”), while the shared round-1 brief makes light the default reading theme. Production has only `ThemeMode = 'light' | 'dark'` (`tokens.ts:14`), with no separate default-theme preference. Recommended: keep the brief's light reading default until resolved, and scope any stored default-theme preference explicitly.

These questions isolate integration choices; the specified layouts and honest fallback states are sufficient to build B1–B3 without inventing answers.

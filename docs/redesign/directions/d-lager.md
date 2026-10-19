# D · Lager — round 2 screen design specification

Bead: `hpf-qr0p.36` · B0 · 2026-10-19

Source baseline: `b777074def8517fb7a3053fb103524a6eb57ba90`

Status: design handoff for owner review; no application changes or new product-policy approvals.

Lager makes a study session feel like one piece of work brought forward on a desk. The ambient field establishes a place; opaque sheets carry the work; glass controls sit above it. Screens 5–14 extend that spatial hierarchy through practice, timed passes, progress, reference reading and settings. One sheet owns the next action. Supporting information has less elevation and less visual weight.

## Source contract and scope

This document specifies B1 (5–8), B2 (9–11) and B3 (12–14). The accepted bead extends Lager alongside the other round-2 directions; the round-1 brief's earlier winner-selection wording does not narrow this assignment. Screen numbers are bake-off coverage identifiers, never decorative numbering in the learner UI.

Source anchors, relative to this document:

| Area | Inspected source and implication |
| --- | --- |
| Direction | [meta.ts](../../../app/src/components/devbake/redesign/d-lager/meta.ts), [Lager.tsx](../../../app/src/components/devbake/redesign/d-lager/Lager.tsx), [LagerHome.tsx](../../../app/src/components/devbake/redesign/d-lager/LagerHome.tsx), [LagerDrill.tsx](../../../app/src/components/devbake/redesign/d-lager/LagerDrill.tsx), [lager.css](../../../app/src/components/devbake/redesign/d-lager/lager.css): preserve the materials, typography, dock, option well and feedback stack. Most named helpers are private functions; reuse below means extracting/adapting their behavior, not assuming an exported API. |
| Shared brief and critique | [Round-1 brief](../2026-10-round1-brief.md), [parent worklog](../../worklog/hpf-qr0p.md), especially “D · Lager,” “Side by side,” and “Notes for the owner and round 2.” These establish the five destinations, reading constraints and the changes that separated Lager from the other directions. |
| Practice | [ova.tsx](../../../app/src/routes/ova.tsx), [drill.tsx](../../../app/src/routes/drill.tsx), [repetition.tsx](../../../app/src/routes/repetition.tsx), [DrillQuestion](../../../app/src/components/drill/DrillQuestion.tsx), [KvaPrompt](../../../app/src/components/drill/KvaPrompt.tsx), [QuestionFigure](../../../app/src/components/drill/QuestionFigure.tsx), [MathText](../../../app/src/components/MathText.tsx), [DrillResult](../../../app/src/components/drill/DrillResult.tsx), [PedagogyPanel](../../../app/src/components/drill/PedagogyPanel.tsx), [ExplanationPanel](../../../app/src/components/drill/ExplanationPanel.tsx): preserve section-specific content, answer selection, explanation content, current queue semantics and resumable sessions. |
| Timed passes | [prov.tsx](../../../app/src/routes/prov.tsx), [ConfirmSheet](../../../app/src/components/mock/ConfirmSheet.tsx), [MockRunner](../../../app/src/components/mock/MockRunner.tsx), [MockResult](../../../app/src/components/mock/MockResult.tsx): real/generated composition, actual question counts, no pause, editable answers, no immediate grading, explicit submission and qualified scores. |
| Progress | [ProgressMobile](../../../app/src/screens/ProgressMobile.tsx), [historik.tsx](../../../app/src/routes/historik.tsx): prognosis, weekly evidence, all eight sections, attendance, repetition totals and completed-session links. |
| Reference | [lektion.tsx](../../../app/src/routes/lektion.tsx), [LessonReader](../../../app/src/components/lesson/LessonReader.tsx), and its TrapCard, ProtocolCard, LexiconCard, ExampleQuestions, MarkAsReadPill, PracticeLink and SectionPracticeCTA: framework reading, bookmark, explicit read markers and practice doors. |
| Account | [konto.tsx](../../../app/src/routes/konto.tsx), [mer.tsx](../../../app/src/routes/mer.tsx): identity, theme/coach/selection preferences, tools, support, legal links and the existing deep account flow. |

The parallel `hpf-qr0p.7` owns the shared data view model. The “Data shown” paragraphs below describe learner information, not TypeScript shapes or API changes. Values in wireframes are illustrative states, not new fixtures, calculations or promises. All learner-facing copy is Swedish; authentic ELF exam content remains English.

The route references describe real-app destinations and semantics. In the development bake-off, transitions stay inside the preview and use its shared data and action boundary. Do not call live account deletion, logout, payment, preference writes or session mutation services from a specimen. The implementation batches must not silently redefine persistence or grading to make a screen appear functional.

## Material and interaction rules shared by all batches

### Preserve the existing token system

| Role | Existing token or pattern | Round-2 use |
| --- | --- | --- |
| Ambient field | `--la-field`: light `oklch(95.6% 0.011 72)`, dark `oklch(16.5% 0.022 262)`; `--la-warm-*`, `--la-calm-*`, `--la-pool`, `--la-vignette` | Keep a static pool and subtle grain visible around sheets. Warm on hubs/completion, calm during solving and long reading. No animated wallpaper. |
| Opaque surfaces | `--la-sheet`, `--la-sheet-up`, `--la-sheet-up-2`, `--la-sh-0` through `--la-sh-3`, `--la-rim-top`, `--la-rim` | Source sheet at depth 1; active task at depth 2; explanation/confirmation at depth 3. Dark elevation is lighter slate: 23.5%, 27.5%, 29% lightness respectively. These are content layers, not extra glass. |
| Selection | `--la-well`, `--la-lift`, `.la-opts`, `.la-opt`, `.la-key` | One recessed group with divided rows. The chosen row lifts; it does not become an independently boxed tile. |
| Primary action | `.la-btn`, `--la-btn-hi`, `--la-btn`, `--la-btn-lo`, `--la-btn-ink` | One solid, top-lit deep lagoon action per active state; retain the deep button in dark mode. Selection accents and current navigation may also use lagoon. |
| Text | `--la-ink`, `--la-ink-2`, `--la-ink-3` | Main reading and explanation prose use the strongest ink. Secondary labels remain legible; new body copy must meet the brief's 7:1 bar. |
| Glass | `.la-glass`, `.la-glass-thick`, `--la-glass-solid`, `--la-blur` (28px), `--la-blur-menu` (34px) | Dock, short control pills and short account-menu labels only. Never nest glass inside glass or inside an ancestor whose opacity animates. Unsupported blur/reduced transparency uses the opaque fallback. |
| Type | `--la-ui` system/SF with Inter fallback; `--la-read` Newsreader; `--la-display` Fraunces | UI and quantities use the UI stack; passages and sustained explanation/lesson prose use Newsreader; Fraunces is reserved for a hub title or a completion line. No new font families. |
| Shape and motion | `--la-r-sheet: 28px`, `--la-r-ctl: 16px`, pill controls; `--la-ease`; `--la-t1: 140ms`, `--la-t2: 240ms`, `--la-t3: 320ms`, `--la-t-out: 160ms` | Nested radius follows outer radius minus padding. Use the existing CSS transition family. Reduced motion removes movement and smooth scrolling; do not add a View Transitions dependency in these batches, pending the owner's decision in open question 7. |
| Meaning | `--la-ok`, `--la-bad`, `--la-warn-*`, `.la-cite`, `.la-callout`, `.la-seg` | Outcome always includes words/glyphs. Evidence and trap citations differ by line style as well as color. Segmented controls use a lifted selection in a recessed track. |

Only LÄS, ELF, XYZ, ORD and NOG currently have dedicated section-chip tokens. B1 should give MEK, KVA and DTK the neutral `.la-chip` treatment until a full palette is owner-approved. Labels always identify the section. Keep the established field palette for hubs; ELF may use its existing cool section hue for the opening/completion accent. It drains to the same calm field during reading. Do not invent three competing palette expansions across batches.

### Layout, navigation and focus

- Desktop reference: 1440×900. Hubs retain the 1200px maximum composition, roughly 48px outer padding, 28px spacing between supporting sheets and 160px bottom clearance for the dock. At most two dominant sheets in the opening view; long lists are grouped inside sheets, not a grid of equal cards.
- Desktop reading/figure reference: existing `.la-desk` has up to 680px for source material, a 460px task sheet, a 48px field gap and a 30px lower task-sheet start. Keep that stagger whenever both columns fit. Proposed responsive rule: below 1120px available direction width, use the phone-style source/task arrangement rather than squeezing text. This is an implementation requirement, not an existing breakpoint.
- Phone reference: 390×844; also check 320px and enlarged text. Hubs use the existing 12px inset and 124px bottom clearance. Focus screens preserve the 8px inset, fully rounded sheets and safe-area clearance. The field must still show at the corners. Reserve space for the actual dock/action height, including text growth.
- Reading: Newsreader 19.5px/1.62 desktop, 17.5px/1.6 phone; larger-text modes follow the existing 21.5px/19.5px sizes. Aim for 55–70 characters on desktop; phone width and text enlargement take precedence over forcing that measure. No ellipsis in prompts, options, formulas or explanations.
- All non-drill screens retain **Idag · Öva · Provpass · Uppslag · Framsteg** and account access. Historik belongs to Framsteg; Repetera belongs to Öva. Desktop dock compacts on scroll but keeps labels and order. Phone tab bar stays visible. Account/settings is an auxiliary destination, not a sixth tab.
- Focus sessions replace the dock with a persistent exit and progress. Practice uses “Avsluta”; a timed pass uses “Avbryt provpass” with its consequence made explicit. Escape dismisses the foremost overlay or focus aid; it never submits or leaves a running session. No browser-back-only exits.
- Returning from a detail restores the parent selection and scroll position. Move focus to the new screen heading, question heading or feedback heading after a user-triggered transition; never move it when background data refreshes. Only the front stack body is interactive; the visible return strip remains usable and the covered body is inert.
- Ordinary focus sheets are nonmodal. Expansion/collapse has labeled buttons as well as drag; no drag-only interaction. True zoom/confirmation dialogs trap focus, make the background inert, close appropriately on Escape, and return focus to the trigger. Keep controls outside the source image/text footprint.

### Data, accessibility and critique guardrails

Skeletons reserve final geometry and stay still. Unknown is not zero, a failed request is not an empty account, and a failed save is not “Sparat.” Keep available content visible during partial failure. Use an inline recovery action when the underlying data/action boundary supports it; a design specimen must demonstrate that state without adding a backend policy.

All batches retain visible 2px focus rings with 2px offset, 44px effective targets, keyboard access and semantic headings/lists/tables. Use tabular numerals for scores, counts and clocks. Test normal text at 7:1 and UI labels at AA against the worst glass backdrop, the brightest button stop and every elevated surface. Respect reduced transparency, reduced motion and text-spacing overrides. Timers do not announce every second. Single-letter shortcuts must be scoped to the active session and suspend in inputs, dialogs and editable content.

Round-1 critique is a constraint: do not regress to a widget dashboard, brown dark-mode paper, docked square panes, pastel primary pills, red/green answer tiles, or blurred/cropped words on the back sheet. Keep a sharp return strip; hide covered content rather than allowing it to ghost through. Long content always has an opaque substrate. The field may carry short date labels or sparse notes only when contrast is verified.

## Screen 5 — Öva (B1)

**Purpose and primary action.** Turn an intention to practise into a session with one decision. The primary action is “Fortsätt öva” when a compatible practice session exists; otherwise “Öva KVA” for an evidence-backed suggestion, or “Blandad övning” on a cold start. The section is illustrative. Never start automatically merely because the hub loaded.

**Data shown.** A resumable practice's section, position, total and last activity; a suggested section and the reason, if available; all eight section names in their stable order; today's repetition pile by section and total; and the smaller/equal count actually ready now. A pile of 7 with 3 due reads “3 redo nu · 7 i dagens hög,” not “7 redo.” The dock badge and section pile counts use the same slice.

**Desktop layout.** The raised start sheet takes about seven twelfths of the width. One lower companion sheet contains the eight section rows in two verbal/quantitative groups. Repetition is a distinct row below the start sheet with its own count and clear door; it never disappears at zero.

```text
HP-Coach
Öva
+--------------------------------+   +-------------------------+
| Fortsätt öva                   |   | Välj delprov             |
| KVA · fråga 4 av 10             |   | ORD  LÄS  MEK  ELF       |
| [Fortsätt öva]                 |   | XYZ  KVA  NOG  DTK       |
+--------------------------------+   | namn · N i dagens hög    |
  Repetera                       |   +-------------------------+
  3 redo nu · 7 i dagens hög   >  |
     (Idag | Öva | Provpass | Uppslag | Framsteg | Konto)
```

**Phone layout.** Keep the raised start sheet first, repetition second and section rows third. Rows stack vertically with a section code, full name, optional count and chevron; the wireframe abbreviates them. Do not make eight small square targets.

```text
HP-Coach                 [Konto]
Öva
 +----------------------------+
 | KVA · fråga 4 av 10         |
 | [Fortsätt öva]              |
 +----------------------------+
 Repetera · 3 redo nu        >
 +----------------------------+
 | Välj delprov               |
 | ORD · Ordförståelse       > |
 | LÄS · Läsförståelse       > |
 | ...alla åtta i fast ordning |
 +----------------------------+
 (Idag Öva Provpass Uppslag Framsteg)
```

**Reuse and additions.** Reuse `LagerFrame`, dock/tab bar, `.la-resume`, `.la-side`, `.la-row`, `.la-chip`, `.la-btn` and `Bars`. Add a practice-start sheet, grouped section doors and a repetition-status row. The section door goes directly into its session as `/ova` does; it must not add another start interstitial. Replace `OVA_DUE` fixture coupling through the shared data boundary.

**States.** Loading keeps the section names and reserves count slots. Empty has “Välj ett delprov eller börja med en blandad övning” and no invented weakest section. Partial statistics omit the recommendation reason while usable doors remain; unavailable queue data reads “Repetition kunde inte hämtas.” Done/resume-ended removes the resume action only after completion is known, leaving the same hub geography. A known-empty queue says “Inget att repetera just nu” and remains navigable.

**Navigation.** Dock/Idag → Öva; section → its drill (6, 7, 14 or existing verbal screen); Repetera → 8. Return from practice restores the hub. Mixed practice must identify the current section on each question.

**ADHD-PI and accessibility.** Stable section ordering, one elevated action and one-line rationale reduce reorientation. Do not reorder the list as scores arrive. All rows have full accessible names and counts; use links for navigation and keep recommendation text distinct from a selection state.

**Unmistakably Lager.** The next task is physically brought forward; the section directory stays on a quieter sheet, with the field visible below the start sheet and behind the repetition row.

## Screen 6 — Kvantfråga: XYZ, KVA and NOG (B1)

**Purpose and primary action.** Solve one quantitative question. “Svara” commits the selected answer in practice; it is disabled until a choice exists. Feedback changes the single primary action to “Nästa fråga,” or “Avsluta övningen” for the last question. Selection alone does not grade.

**Data shown.** Section, source/exam identity where available, question position, elapsed time, full prompt/conditions, optional vector figure, ordered options, selection and elimination state. After grading: chosen and correct answers, solution, essential/detail steps, technique, pitfall, distractor explanations and a related framework link when supplied. Preserve math throughout prompts, options and feedback with the existing MathText behavior.

**Content variants.** XYZ renders the actual supplied options; do not pad it to five. KVA keeps condition → “Kvantitet I” → “Kvantitet II” and its four fixed alternatives: A “I är större än II,” B “II är större än I,” C “I är lika med II,” D “informationen är otillräcklig.” NOG separates the stem, statements (1)/(2), any sufficiency coda and five A–E options with their complete supplied wording. Failed structural parsing falls back to the intact prompt, never a guessed split. Image alternatives retain their source images and text labels.

**Desktop layout.** A working sheet carries the conditions/figure; the lower, elevated answer sheet contains the one option well. Short text-only questions may use a narrower working sheet, but the answer sheet remains visibly detached. Feedback stacks over the answer sheet with “Visa frågan” exposed, while the mathematical setup remains visible.

```text
[Avsluta]              [KVA · 4/10 · 02:16]
 +-----------------------------+
 | Förutsättning               |      +-------------------------+
 | b = a + 1                   |      | Välj ett alternativ     |
 | Kvantitet I   Kvantitet II   |      | .---------------------. |
 | ab - 2a²      a(b - 2a)     |      | | A  I är större ...  | |
 | [figur när den finns]       |      | | B  II är större ... | |
 +-----------------------------+      | | C  Lika   D  ...    | |
                                      | '---------------------' |
                                      | [Svara] Ditt val: B      |
                                      +-------------------------+
```

**Phone layout.** For short quantitative questions, place setup and answer well together in one scrolling opaque sheet; splitting a two-line condition into a persistent peek would create needless switching. Long figures use screen 7's source/task arrangement. The footer stays clear of all five NOG options and math overflow.

```text
[Avsluta]          [NOG · 4/10]
 +----------------------------+
 | Frågan                     |
 | (1) Första påståendet      |
 | (2) Andra påståendet       |
 | .------------------------. |
 | | A  i (1) men ej i (2)   | |
 | | B ... C ... D ... E ... | |
 | '------------------------' |
 | [Svara]                    |
 +----------------------------+
```

**Reuse and additions.** Adapt `Options`, `Actions`, `Verdict`, `Explanation`, `.la-stack`, `.la-strip`, `.la-opts` and `.la-actions`; retain `--la-well`, `--la-lift` and graded rims. Add a quantitative setup sheet and variant presenter using KvaPrompt/NOG parsing and MathText. Do not import the production screen's M3 chassis. Keyboard hints are generated from the options present, rather than copying Lager's A–D hint literally.

**States.** Loading reserves setup and option heights with exit available. Empty/invalid content says “Frågan saknar fullständig text” and offers return or a supported replacement, never a fake answer. Partial explanation shows the known verdict and available sections with “Förklaringen kunde inte hämtas”; continuing remains possible. A missing required figure blocks grading until recovered or safely left; do not assume all quant questions can be solved from text. Done shows actual answered/correct counts, time and one return action; unanswered items are not fabricated successes.

**Navigation.** Enter from 5, a framework practice door, a due item in 8 or an existing session. Exit returns to the origin with truthful save state. Framework links preserve question/feedback position. In a timed pass this presenter is reused under screen 9's different action rules.

**ADHD-PI and accessibility.** Keep condition and both KVA quantities visible together; retain numbered NOG statements. A–E select only available options, Shift+letter eliminates in practice, Enter grades/advances once. Explicit touch controls do the same. Math must stay selectable and named to assistive technology; MathText's flattened math labels are not proof of complete equation accessibility. Check complex fractions and screen-reader reading order. Horizontal overflow belongs only to a long formula region, never the page.

**Unmistakably Lager.** Raised selection within one well, a separate lower answer sheet on desktop, and a crisp stacked facit carry the identity even without a long passage.

## Screen 7 — DTK: diagram, table or map (B1)

**Purpose and primary action.** Read the exact source figure and answer the associated question. “Svara” is primary while answering; “Nästa fråga” continues after feedback. “Förstora figur” is a conspicuous secondary reading control.

**Data shown.** Source figure and aspect ratio, source title/caption if present, section/exam, question position in the session and within its same-page group, prompt, options and feedback. “Fråga 2 av 3 · samma sida” is separate from “Fråga 6 av 10.” Never extract chart values, redraw a map or invent alt descriptions from a visual guess.

**Desktop layout.** The source gets the larger sheet and generous width. Keep axes, units and legends in the uncropped preview. Figure tools sit in a control pill above/beside the image, never over a label. The 30px-staggered question sheet and feedback stack use the same geometry as reading.

```text
[Avsluta]           [DTK · 6/10]        [Förstora figur]
 +----------------------------------+
 | Underlaget · källa                |    +----------------------+
 |                                  |    | Fråga 2 av 3          |
 |   hela diagrammet/tabellen        |    | samma sida            |
 |   med axlar, legend och enheter   |    | Frågetext             |
 |                                  |    | [svar i en brunn]     |
 +----------------------------------+    | [Svara]              |
                                         +----------------------+
```

**Phone layout.** Show the full-width source sheet first. The inset task sheet peeks with the whole prompt or an internally scrollable prompt and “Visa alternativen”; opening it preserves the source position. Zoom becomes an opaque full-viewport viewer with fit, zoom, rotation and a visible close control. Its toolbar does not compete with the answer footer.

```text
[Avsluta]             [DTK · 6/10]
 +-----------------------------+
 | Underlaget                  |
 | [hela figuren i rätt format] |
 | [Förstora figur]             |
 +-----------------------------+
       stilla fält
 +-----------------------------+
 | Fråga 2 av 3 · samma sida    |
 | Frågetext                   |
 | Visa alternativen        ^  |
 +-----------------------------+
```

**Reuse and additions.** Reuse `.la-read`, `.la-qcol`, `.la-psheet`, `useSheet` behavior, option well and feedback stack. Adapt QuestionFigure's aspect reservation, SVG/raster handling, rotation and zoom/pan; add a source-sheet wrapper, same-source cue and explicit figure load/error presentation. The existing generic “Figur” alt text and silent failure behavior are limitations to improve at the content/integration boundary, not an accessibility sign-off.

**States.** Loading reserves the image rectangle. Empty source data says “Underlaget saknas”; the user can return to Öva. Partial data with an unloaded required image retains prompt and position but disables submission and offers recovery. An available table transcription must retain headers/units and expose equivalent information; it must not reveal the solution. Feedback without a detailed figure citation describes the reasoning without invented visual highlights. Done moves to the next source group or the session summary; reset zoom on a different figure, retain it within the same group.

**Navigation.** Enter from Öva, repetition or a timed pass. Closing zoom restores its trigger and the prior scale/position in the question view. Next question within a group preserves source scroll; leaving the session has the same origin/save rules as 6.

**ADHD-PI and accessibility.** Preserve the figure across related questions to avoid repeated scanning. Zoom and pan need buttons/keyboard equivalents, not pinch-only gestures. Escape closes the viewer before any other action. Keep the printed raster's original colors in dark mode; no blanket inversion. A meaningful source description or authored accessible table is required for equivalent nonvisual access; absence remains a content dependency.

**Unmistakably Lager.** A large opaque source sheet floats beside a smaller raised task sheet. Zoom tools form their own small glass layer; the figure itself stays clear and opaque.

## Screen 8 — Repetera (B1)

**Purpose and primary action.** Revisit mistakes that are ready now in a bounded session. The idle primary action is “Repetera 10” (or the smaller eligible count); an active compatible session uses “Fortsätt repetera.” Entry from an explicit Öva repetition-start door starts directly, preserving the production distinction from a bare `/repetition` visit.

**Data shown.** Ready-now count, today's pile when different, eligible count by section, current batch size (up to 10), current position, question content, selected/graded answers, and completion results. The picked batch comes from the existing queue policy; the UI may describe it as “de äldsta först” where that policy supplies it, but must not invent a separate frequency sorter.

**Desktop layout.** One raised batch sheet explains the bounded commitment and contains the start/resume action. A smaller source sheet lists the section slices and a brief explanation of readiness. The active state replaces this hub with the appropriate question presenter; it is not a second implementation of answer behavior.

```text
HP-Coach
Öva / Repetera
 +--------------------------------+   +-------------------------+
 | Repetera 10 av 14 redo nu       |   | Redo per delprov         |
 | De äldsta först                |   | ORD 4  KVA 6  NOG 4     |
 | [Repetera 10]                  |   | 18 i dagens hög         |
 +--------------------------------+   | resten blir redo senare |
                                      +-------------------------+
     (Idag | Öva | Provpass | Uppslag | Framsteg | Konto)
```

**Phone layout.** The same two groups stack with a visible “Till Öva.” During a replay, use screen 6/7/14's focus layout and a compact “Repetition” label; do not retain the hub tab bar over a task sheet.

```text
HP-Coach                  [Konto]
Till Öva <
 +-----------------------------+
 | Repetera                    |
 | 10 av 14 redo nu            |
 | [Repetera 10]               |
 +-----------------------------+
 +-----------------------------+
 | ORD 4  | KVA 6 | NOG 4      |
 | 18 i dagens hög             |
 +-----------------------------+
 (Idag Öva Provpass Uppslag Framsteg)
```

**Reuse and additions.** Reuse the start/resume sheet from 5, `Bars`, the practice presenters, `.la-done` and `.la-done-line`. Add a queue-status sheet and repetition summary that separates correct answers from confirmed queue updates. Use `--la-sheet-up` for the batch, quiet section chips and the same primary button.

**States.** Loading never exposes an enabled empty replay. Empty says “Inget att repetera just nu” with “Öva istället”; if the pile is nonzero, explain that it is not due yet. Partial queue failure retains known counts with a stale/unavailable label; unresolved questions are not shown as playable. A saved plan pruned because items were resolved elsewhere announces the changed remaining count and never silently restarts at question one. Done says “Repetitionen klar” with actual results; “Till Idag” is primary and another eligible batch is secondary. Pending resolution must not claim “Kön är tom.” A failed answer save keeps the current work and an honest retry state.

**Navigation.** Öva/Idag/known due-result link → idle, direct start or resume. Active questions exit to their originating surface. Completed history opens the existing `/repetition?done=<session>` summary as read-only review; no attempts or queue changes occur just from opening it.

**ADHD-PI and accessibility.** A bounded batch prevents an endless remedial loop. No “overdue” alarms, lost-streak language or red pile count. Announce changed remaining count once, preserve focus after queue updates and name section filters with both section and count. Retain explicit return even for an empty queue.

**Unmistakably Lager.** The current batch is a lifted sheet; the queue is a quieter source behind it. Completion returns warmth to the field and uses a restrained typographic line.

## Screen 9 — Provpass: hub, confirmation and running pass (B2)

**Purpose and primary action.** Choose a timed pass, understand its commitment, then complete it under exam conditions. Hub primary: “Välj provpass” for the selected candidate, or “Fortsätt provpass” for a valid active session. Confirmation primary: “Starta provpass.” Running primary: “Nästa fråga,” becoming “Lämna in” at the final position; a persistent quieter “Lämna in” control also permits early submission. Selecting an option saves/changes the choice without showing correctness.

**Data shown.** “Riktigt prov” versus “Genererat pass,” Verbal/Kvant, source sitting/pass when authentic, actual available count, 55-minute duration, section composition, previously seen count and a recommendation based on existing exposure logic. Generated passes assemble authentic questions; they are not AI-generated questions. Running shows real start-derived time remaining, current index, answered/total, question grid and current content. Preserve verbal quotas 10/10/10/10 and quant quotas XYZ 12, KVA 10, NOG 6, DTK 12 where the existing plan uses them; actual presented counts govern the UI.

**Desktop layout.** A selection sheet names the proposed pass; a lower archive sheet lists other sittings/passes. Mode and half use `.la-seg`. Starting opens an opaque confirmation sheet with the exact pass name/count and rules. Running replaces the dock with glass exit/time controls and a compact answer-index control; the source/question sheets reuse the relevant reading or quant presenter.

```text
HP-Coach
Provpass      [Riktigt prov | Genererat pass] [Verbal | Kvant]
 +--------------------------------+   +-------------------------+
 | Hösten 2025 · provpass 2        |   | Andra provtillfällen     |
 | 40 frågor · 55 min             |   | år · pass · sett/antal   |
 | 6 frågor sedda tidigare        |   | ...                     |
 | [Välj provpass]                |   +-------------------------+
 +--------------------------------+
     (Idag | Öva | Provpass | Uppslag | Framsteg | Konto)

Running:
[Avbryt provpass]    [12/40 · 38:12 kvar]    [Lämna in]
[1 ... 11 | 12 aktuell | 13 ... 40]   besvarade/obesvarade
 +---------------------------+    +----------------------------+
 | Text/underlag/villkor      |    | Fråga · valbara svar       |
 +---------------------------+    | Föregående [Nästa fråga]   |
                                  +----------------------------+
```

**Phone layout.** Stack the candidate and archive. Confirmation is an inset opaque sheet, not the translucent account panel. In the runner, the question grid is a labeled “Frågor · 12/40” disclosure that opens an opaque answer-index panel; long labels never sit on glass, and the grid is not forty tiny dots squeezed into the toolbar. Keep exit, countdown and current position visible while the task sheet changes height.

```text
Provpass                  [Konto]
[Riktigt prov | Genererat pass]
[Verbal | Kvant]
 +-----------------------------+
 | Hösten 2025 · provpass 2     |
 | 40 frågor · 55 min          |
 | [Välj provpass]             |
 +-----------------------------+
 Andra provtillfällen         >
 (Idag Öva Provpass Uppslag Framsteg)

Running:
[Avbryt]       [12/40 · 38:12]
[Frågor · 12/40]    Lämna in
 +-----------------------------+
 | underlag + aktuell fråga    |
 | svar utan rätt/fel-markering |
 | Föregående [Nästa fråga]     |
 +-----------------------------+
```

**Reuse and additions.** Reuse frame, `.la-seg`, `.la-pill`, `.la-stack`, `.la-strip`, option well and source presenters. Add a pass-candidate sheet, sitting list, opaque commitment sheet, answer-index disclosure and timed-run controls. Adapt ConfirmSheet/MockRunner semantics. B2 must not copy practice's `Actions` handler: A–E choose, arrows navigate, no Enter-to-grade and no explanation sheet before settlement. Until B3's ELF presenter exists, preserve the existing English reading capability rather than narrowing the pass to quant-only content.

**States.** Loading preserves mode/half selection and disables start until a real plan exists. Empty has “Inga provpass tillgängliga för det här valet” with a supported alternative. Partial authentic pass discloses, for example, “39 av 40 frågor tillgängliga” before commitment and uses 39 in navigation. Confirmation states “Ingen paus,” “Du kan ändra svar tills tiden går ut,” “Avbryter du blir provet ogiltigt,” and the existing no-penalty rule. Cancel does not start a clock. A fresh resumable session restores choices/time without reset. Current production behavior silently voids an expired session on reload without a result. New behavior in this design: show a truthful expired-pass notice and return to the hub; do not invent a recovered score. While open, timeout triggers one submission and locks further picks. Submitting shows “Lämnar in…”; a failure preserves the attempt and says the result is not saved, with recovery delegated to the existing session contract. Done opens 10 only when the result exists.

**Navigation.** Dock/Idag prescribed pass → hub with the prescribed half retained → confirmation → running → result. Grid jumps preserve prior selections. Submitting with blanks confirms the exact unanswered count; abandoning confirms invalidation and returns to the hub. Neither Escape, browser navigation nor a visual sheet-close action should be presented as a pause.

**ADHD-PI and accessibility.** Tell the duration and rules before starting. Keep the same question position when the grid closes. Remaining time changes emphasis near the end without flashing or tick announcements. Grid buttons announce question number, section, answered status and current status; use `aria-current` for position. Closing a grid/zoom dialog returns focus without selecting an answer. The exam's fixed timing is explicit, not a surprise animation-driven deadline.

**Unmistakably Lager.** The selected pass is an elevated physical sheet, then gives way to a calm workspace with floating time/index controls. Answer selection keeps the lit well treatment without leaking grades.

## Screen 10 — Provpassresultat (B2)

**Purpose and primary action.** Understand the result and choose one useful next step. Primary is “Repetera missar” only when eligible mistakes are confirmed ready; otherwise “Till Idag.” Other explanations/history are quiet links. Do not promise that every miss can immediately be replayed.

**Data shown.** Pass identity/mode/half/date; correct, answered and actual presented count; elapsed time; score and how it was derived; per-section correct/total; section time versus its indicative budget; previously seen count; unanswered count; available trap cluster; comparable previous passes. An authentic pass's score derived from a full-half UHR table remains explicitly derived, never an official 40-question score. Missing norming retains the qualified linear estimate only if supplied by the existing calculation.

**Desktop layout.** One raised outcome sheet carries “Provpasset klart,” the raw fraction and caveat, then the primary next action. A lower analysis sheet carries section rows and tempo. Exposure and comparable history sit below in a quieter grouped area, not four headline score cards.

```text
HP-Coach
 +--------------------------------+   +-------------------------+
 | Provpasset klart.              |   | Per delprov             |
 | 28 av 39 rätt                  |   | XYZ 8/12 · tid/budget    |
 | 1 fråga saknas ur passet       |   | KVA ... NOG ... DTK ... |
 | Skattad poäng · förbehåll      |   +-------------------------+
 | [Till Idag]                    |
 +--------------------------------+
 Tidigare sett 6/39 · 2 obesvarade
 Tidigare pass av samma sort                           >
     (Idag | Öva | Provpass | Uppslag | Framsteg | Konto)
```

**Phone layout.** Keep raw fraction, incompleteness and score caveat together before the primary action. Analysis follows as rows; the tempo table may use labeled stacked rows when needed, with each time still tied to its section and budget.

```text
HP-Coach                  [Konto]
 +-----------------------------+
 | Provpasset klart.           |
 | 28 av 39 rätt               |
 | 1 fråga saknas              |
 | Skattad poäng · förbehåll   |
 | [Till Idag]                 |
 +-----------------------------+
 +-----------------------------+
 | Per delprov + tempo         |
 | Tidigare sett · obesvarade  |
 | Tidigare pass            > |
 +-----------------------------+
 (Idag Öva Provpass Uppslag Framsteg)
```

**Reuse and additions.** Reuse `.la-done-line`, `.la-prog-n`, `.la-caveat`, `.la-row`, `.la-pass`, `--la-sheet-up` and calm-to-warm completion. Add an outcome sheet, section/tempo ledger and comparison list. Use MockResult's result semantics. This is not the large prognosis number from Idag; the raw result is the first reading anchor.

**States.** Loading shows a result-shaped skeleton and “Hämtar resultat.” Empty/missing result link says “Resultatet kunde inte hittas” with “Till Provpass.” Partial missing questions use the actual denominator and a disclosure adjacent to it; missing score, cluster or history does not erase the raw result. Failed history retrieval is not “Inga tidigare pass.” Done is the durable read-only result; 0 correct is a valid result, distinct from no result. Unsaved settlement stays in screen 9's recovery state.

**Navigation.** Arrive from submission, a result permalink `/prov?result=<id>` or a comparable-history row. Return to Provpass remains visible; dock returns to other destinations. A supported missed-question review may open a read-only explanation with a return strip, but a fabricated review endpoint is out of scope.

**ADHD-PI and accessibility.** Outcome → caveat → next step precedes detail. No confetti or punishment for blanks. Label fractions “rätt,” distinguish missing source questions from unanswered ones, and name over-budget rows in words. Use real table headers/row labels; chart bars supplement printed values. Announce arrival once, not every loaded metric.

**Unmistakably Lager.** The result becomes the foremost sheet while supporting evidence sits lower. The field regains warmth without a new decorative dashboard or score-card grid.

## Screen 11 — Framsteg, including Historik (B2)

**Purpose and primary action.** Show what the practice evidence supports and where to practise next. Primary is “Öva KVA” for the highest-priority evidenced focus section. With no prognosis, preserve the current “Börja här · 10 frågor” diagnostic entry; with a prognosis but no ranked focus, use “Till Öva.” Historik's primary task is opening a chosen past pass; it does not need a competing filled start button.

**Data shown.** Current prognosis and caveat; verbal/quant scores, available uncertainty range, recent change, weekly scores, section scores/attempts/recency, attendance across twelve weeks, due/active/resolved repetitions and total/today/weekly activity. Show a trend only with at least two scored weeks, as the current screen does. A missing week is a gap, not zero. The existing trend target is 1.8 while the product aspiration is 2.0; label any supplied target explicitly and do not turn the aspiration into a saved personal setting.

Historik shows completed drills/repetitions with kind/section, date and correct/total, linking to their original completion views. Mock history is a separate data source and result destination. Keep “Övning och repetition” and “Provpass” as explicit groups/subviews until the shared model supports both; do not imply the existing `/historik` endpoint already returns mocks.

**Desktop layout.** A prognosis/evidence sheet anchors the left, with the next-practice sheet raised slightly on the right. A single broad section ledger follows. Attendance is compact; Historik is a permanent link/section, even before the first pass. Opening Historik replaces the detailed ledger area with a chronological list while keeping the frame.

```text
HP-Coach
Framsteg                         [Översikt | Historik]
 +--------------------------------+   +-------------------------+
 | Prognos 1,41 · av 2,0           |   | Nästa fokus             |
 | Verbal / Kvant · förbehåll      |   | KVA · skäl från övning  |
 | veckokurva med luckor          |   | [Öva KVA]               |
 +--------------------------------+   +-------------------------+
 +--------------------------------------------------------------+
 | ORD LÄS MEK ELF XYZ KVA NOG DTK · värde/underlag/senast        |
 | Närvaro · senaste 12 veckorna                                 |
 | Historik · Övning och repetition / Provpass                    |
 +--------------------------------------------------------------+
     (Idag | Öva | Provpass | Uppslag | Framsteg | Konto)
```

**Phone layout.** Prognosis and caveat, focus action, section rows, attendance and history in that order. Historik uses readable date/kind/result rows; keep its back link and the active Framsteg tab. Do not turn a twelve-week heatmap into dozens of unexplained miniature controls.

```text
Framsteg                  [Konto]
[Översikt | Historik]
 +-----------------------------+
 | Prognos 1,41 av 2,0         |
 | underlag + förbehåll        |
 | veckokurva                 |
 +-----------------------------+
 +-----------------------------+
 | KVA · föreslaget fokus      |
 | [Öva KVA]                   |
 +-----------------------------+
 Delproven · Närvaro · Historik >
 (Idag Öva Provpass Uppslag Framsteg)
```

**Reuse and additions.** Reuse `.la-prog-n`, range visual grammar, `.la-caveat`, `.la-week-days`, `.la-pass`, `.la-row` and `.la-seg`. Add a prognosis sheet, accessible trend/table pair, section ledger, attendance detail and history browser. The existing `Range` and `Bars` helpers are fixture-specific: use their presentation only when the corresponding real data exists. Never create uncertainty limits to fill a visual band.

**States.** Loading reserves eight section rows. Empty says “Ingen prognos än — svara på några frågor så börjar den här sidan leva” with “Börja här · 10 frågor”; Historik says “Inga avslutade pass än.” Partial coverage shows “—”/“Inte övat än” for absent sections with an honest coverage note. Unknown attendance differs from a known zero day. Failed stats/history show their own retry/unavailable state. Done is a refreshed overview after a session; explain a real change without animating a number from zero. A reopened completed pass remains read-only.

**Navigation.** Dock/Idag/result → Framsteg (`/progress`); Historik → `/drill?done=<id>` or `/repetition?done=<id>`; mock history → screen 10. Return restores history position and subview. A section focus opens its actual practice door; the cold-start diagnostic action opens `/diagnostik?start=1`. Shared IA keeps the dock around Historik even though the old standalone route suppresses phone tabs.

**ADHD-PI and accessibility.** One suggested action, no live resorting of all sections and no “broken streak.” Give the chart a short written summary and a table with dates/values/gaps. Attendance has a date/count reading alternative and deliberate detail expansion. History rows have meaningful names, not only “7/10.” Caveats remain visible rather than tooltip-only.

**Unmistakably Lager.** A quiet evidence sheet and raised next step form the hierarchy; compact history rows inhabit one sheet instead of becoming a dense tool dashboard.

## Screen 12 — Uppslag and lesson reader (B3)

**Purpose and primary action.** Find a method, understand it, and practise it. Picker primary: “Fortsätt läsa” when a bookmark exists, otherwise “Öppna KVA” for a supplied recommendation or the learner's selected section. Reader primary: “Öva detta mönster” (or the source family's specific practice label) for the open entry. “Markera som läst” is a separate, reversible secondary action; scrolling alone never marks mastery.

**Data shown.** All section names, framework availability, section introduction, optional read estimate and bookmark; entry title/type, explanation, trap/trigger/countermove, worked example, protocol steps or root/meaning/examples as appropriate; related question examples, read state and scoped practice links. NOG/KVA/XYZ use trap content, DTK/MEK/LÄS/ELF use tactic/protocol/taxonomy content, ORD uses roots. These are current framework lessons, not newly generated courses or teach-back exams.

**Desktop layout.** The picker uses a raised resume/selection sheet beside one grouped directory. The reader has a narrow opaque contents sheet and a wider reading sheet; the selected entry is opened within the reading flow. A small floating control pill offers contents/text size; it never contains the lesson prose.

```text
HP-Coach
Uppslag / KVA                     [Till Uppslag] [Aa]
 +-----------------------+    +----------------------------------+
 | Innehåll              |    | Kvantitativa jämförelser         |
 | mönster · läst/oläst   |    | Vald lektion                     |
 | vald rad lyfts        |    | förklaring + räkneexempel         |
 | andra mönster         |    | fördjupning                     |
 +-----------------------+    | Markera som läst                 |
                              | [Öva detta mönster]              |
                              +----------------------------------+
     (Idag | Öva | Provpass | Uppslag | Framsteg | Konto)
```

**Phone layout.** The picker directory becomes one vertical sheet. In the reader, “Innehåll” opens a controlled outline in an opaque panel, with no long labels on glass; the lesson remains one continuous opaque reading sheet with its place preserved. The action sits after the useful content, above reserved tab-bar space, without a second overlaying action dock.

```text
Uppslag                   [Konto]
Till Uppslag <       [Innehåll]
 +-----------------------------+
 | KVA · vald lektion          |
 | introduktion               |
 | Förutsättning              |
 | Fällans tanke              |
 | Korrekt tanke              |
 | [Fördjupning]              |
 | Markera som läst           |
 | [Öva detta mönster]        |
 +-----------------------------+
 (Idag Öva Provpass Uppslag Framsteg)
```

**Reuse and additions.** Reuse `.la-read-inner`, `.la-note`, `.la-callout`, `.la-step`, `.la-dis`, `.la-row`, `.la-cite` styling where a real reference exists, and the recessed selected-row treatment. Adapt LessonReader and its family content renderers; add a directory sheet, outline, entry-reading wrapper and bookmark/read-status row. Quant lesson prose/examples keep MathText. Example questions use the real linked question content rather than invented exercises.

**States.** Loading leaves section identity and contents geometry intact. Empty section says “Inget innehåll här ännu” with “Välj ett annat delprov.” Partial missing examples do not hide a complete method; show “Exemplet kunde inte hämtas.” Missing framework anchor lands at the section heading with a short notice. Failed bookmark/read sync keeps reading usable and reports that state without false “Sparat.” Done is an explicit read marker; “Markerad som läst · Ångra” does not create a completion session or claim learning mastery.

**Navigation.** Dock/Idag bookmark/drill framework citation → picker or `/lektion?section=...#<entry>`. Return from scoped practice restores the open entry and scroll. Contents links update the identifiable entry/bookmark through the existing behavior; retain direct links and visible “Till Uppslag.” Escape closes contents before considering the reader's parent navigation.

**ADHD-PI and accessibility.** Reveal one useful chunk with optional detail; keep the outline stable. Maintain explicit read state and a time estimate only where it is supported. Use headings, real disclosure buttons and correct expanded states. Opening a deep-linked entry should expose and focus its heading after load without repeated scroll stealing. Large text and spacing overrides must not hide practice/read controls behind the dock.

**Unmistakably Lager.** A quieter contents sheet supports the elevated opaque reading surface, with Newsreader prose, lit edges and a calm field. No course-card gallery or full-page frosted article.

## Screen 13 — Konto and inställningar (B3)

**Purpose and primary action.** Inspect the account and adjust study preferences without losing one's place. In production settings, choosing a value applies that choice through the existing preference flow, which stores only Ljust/Mörkt for theme; do not add a fictitious “Spara” form. The Lager specimen's System choice stays local and resolves to light or dark. The page's single filled completion action is “Tillbaka,” returning to the prior primary destination. Account service actions remain secondary and only appear where supported.

**Data shown.** Current identity and full address, real plan status, login-method guidance, stored theme Ljust/Mörkt (the Lager specimen additionally offers a local System choice that resolves to light or dark), coach choice and explanation, smart versus random question selection, available advanced settings, diagnostics, feedback export, support and legal links. Unsupported billing is explanatory text, not a fake upgrade button. Legacy palette choices from `/mer` require an explicit mapping decision; they must not silently recolor Lager's material system. Preview identity must be fixture data, never copied personal data.

**Desktop layout.** Keep the existing compact account popover as a short-label launcher. Full account/settings content opens an opaque sheet inside the normal frame, with an auxiliary section list or anchor row. The full identity appears here, not as a large avatar block in the popover. Destructive account controls, if represented, remain deep in the account content.

```text
HP-Coach
Konto och inställningar
 +----------------------+    +-----------------------------------+
 | Konto                |    | Inställningar                     |
 | Inställningar        |    | Tema [Ljust | Mörkt | System]     |
 | Verktyg              |    | Coach · val + kort förklaring     |
 | Hjälp                |    | Urval [Smart | Slumpat]           |
 +----------------------+    | Avancerat                       > |
                             | [Tillbaka]                        |
                             +-----------------------------------+
     (Idag | Öva | Provpass | Uppslag | Framsteg | Konto)
```

**Phone layout.** The launcher remains the detached, rounded glass panel above the tab bar, with title, theme segment and chevron rows. Following a row opens a full opaque account/settings page; long labels/descriptions never spill into the glass launcher. Preferences stack and wrap as necessary.

```text
Inställningar              [Konto]
Tillbaka <
 +------------------------------+
 | Tema                         |
 | [Ljust | Mörkt | System]      |
 | Coach                        |
 | [Kompis] [Professor]          |
 | [Taktiker]                   |
 | Urval [Smart | Slumpat]       |
 | sparstatus när det behövs    |
 | Verktyg                    > |
 | Hjälp och support          > |
 | [Tillbaka]                   |
 +------------------------------+
 (Idag Öva Provpass Uppslag Framsteg)
```

**Reuse and additions.** Reuse `AccountTrigger`, `AccountMenu`/`AccountSheet`, `MenuItems`, `.la-menu-item`, `.la-seg`, `.la-sheet` and `.la-quiet`. Add the full preferences/account sheet and explicit preference pending/error status. Turn the current menu's close-only destinations into real preview destinations. Keep System as a distinct local choice in the Lager specimen while resolving it to light or dark for rendering. Production stores only Ljust/Mörkt; making System a stored preference requires the owner decision in open question 2.

**States.** Loading reserves identity/preferences without guessing a plan. Empty anonymous/unavailable identity gives the supported login/return path, not a blank profile. Partial preference-sync failure leaves the last known choice visible, distinguishes pending from saved and offers supported retry. Done is a subtle “Sparat” only after confirmation; returning restores the originating screen. Export failure is inline and does not imply a file was downloaded. No celebratory animation follows preference changes.

**Navigation.** Account launcher from every primary screen → Konto (`/konto`), Inställningar (`/mer`) or Hjälp. Tools retain visible paths to Diagnostik, Avancerat, Feedback and Provpass; legal/support links remain reachable without the command palette. Return goes to the remembered primary destination, with Idag as the direct-link fallback. Settings do not start or stop a running timed pass through hidden side effects.

**ADHD-PI and accessibility.** Few grouped choices, immediate visible effect and clear sync state remove uncertainty about saving. Group labels/selected states must be announced; do not apply menu roles to a disclosure without implementing its keyboard model. Escape dismisses the launcher and returns focus. On narrow screens, wrap the full email on the opaque page. Theme/reduced-transparency changes must preserve focus rings and reading contrast.

**Account boundary.** The opening comment in `konto.tsx` says no deletion; its rendered `DeleteAccountSection` and nearby explanation implement deep-page deletion with an export-first prompt and exact typed confirmation. Preserve this as an owner-review question, not permission to remove or broaden the feature. If shown in B3, reproduce only a labeled preview of the current deep flow: export offered first, consequence text from the approved source, typed “radera,” pending/error/success states. Do not place deletion in the popover, embed a hosted profile manager, or execute it from the bake-off.

**Unmistakably Lager.** A small detached glass launcher gives way to an opaque, raised preferences sheet; selection is a lifted lens inside a track. Content and control materials remain distinct.

## Screen 14 — ELF reading question (B3)

**Purpose and primary action.** Read an English passage and answer its current question without losing context. “Svara” commits the selected answer in practice; feedback uses “Nästa fråga,” then “Avsluta texten.” The English passage, English prompt and English option text remain unaltered.

**Data shown.** Actual passage title/byline/body, paragraph positions, question position within the reading unit, source/provenance, supplied options (normally A–D for the reading unit), elapsed time and optional focus aids. Feedback uses the supplied explanation, exact cited sentences, chosen/correct options, distractor reasoning, technique and pitfall. Add `lang="en"` to English source quotations even inside Swedish explanations; this is new work in both the Lager specimen and the real presenter. The outer application controls remain `lang="sv"`.

The real app also supports ELF cloze questions with an empty prompt. If such content reaches this presenter, show the supported “Lucka 32” cue and distinguish the current gap from ordinary numbers in the passage; absence of a stem alone is not invalid data. The required round-2 specimen is an English reading-comprehension question; include a cloze fallback case in later verification rather than substituting invented English copy.

**Desktop layout.** Use the established 680px source/460px question relationship, 48px field gap and 30px task stagger. Newsreader sets the passage. Feedback occupies the front of the question stack; the passage stays visible at the cited paragraph. English content is marked locally, not by changing the whole screen language.

```text
[Avsluta]       [ELF · 2/4 · 03:10]       [Styckefokus] [Aa]
 +--------------------------------+
 | titel och källa                |    +------------------------+
 | ¶1  engelsk originaltext       |    | engelsk originalfråga  |
 | ¶2  engelsk originaltext       |    | A ...                  |
 | ¶3  engelsk originaltext       |    | B ... C ... D ...      |
 | ¶4  engelsk originaltext       |    | [Svara]                |
 +--------------------------------+    +------------------------+
       lang="en"                         lang="en" på innehåll
```

**Phone layout.** Passage first, with a persistent compact exit/progress/aids row. The inset task sheet peeks with its prompt and “Visa alternativen,” expands for answering, and opens fully for feedback. A citation folds it back to reveal the source; “Tillbaka till facit” restores the explanation position. These labels are Swedish even though the underlying source is English.

```text
[Avsluta]        [ELF 2/4] [Aa]
 +-----------------------------+
 | engelsk titel               |
 | ¶1 engelsk originaltext     |
 | ¶2 engelsk originaltext     |
 | ¶3 engelsk originaltext     |
 +-----------------------------+
 +-----------------------------+
 | engelsk originalfråga       |
 | Visa alternativen        ^  |
 +-----------------------------+
```

**Reuse and additions.** Generalize `LagerDrill`, `PassageBody`, `Marked`, `Options`, `Explanation`, `Why`, `Step`, `PhoneDrill` and their existing visual classes. Keep `.la-read`, `.la-para`, `.la-cite`, `.la-stack`, `.la-strip` and inset `.la-psheet`. Add a passage-language/provenance boundary and a data-driven reading-unit presenter. The current constants `UNIT`, title and ÖVNINGSTEXT labels must not leak into every ELF question. Use the authentic source label for an authentic exam; use the approved ÖVNINGSTEXT disclosure verbatim only for exercise-text material.

**States.** Loading reserves text/question sheets without a fake excerpt. Empty/missing essential passage says “Texten kunde inte hämtas,” keeps exit and blocks grading that needs the missing source. Partial explanation leaves the known verdict usable; absent citations get no invented paragraph links. Incomplete source text must be identified, not silently treated as a complete reading unit. Done uses the actual unit size/correct count and a quiet “Texten är läst” sheet; no remaining timer. Reopening a finished unit from history is read-only.

**Navigation.** Öva/Idag/bookmark/repetition → reading unit; exit returns to the originating surface with the save state stated accurately. Question changes preserve passage position; explicit evidence links may move to the cited paragraph. Related framework opens 12 and returns to the same question. In a timed pass, reuse the source layout with screen 9's editable-answer/no-feedback behavior.

**ADHD-PI and accessibility.** Preserve paragraph place and provide one consistent passage/task switch. F/J/K operate focus aids only in the active reading session; label the equivalent controls. Avoid dimming text so far that the focus aid removes necessary contrast. Set `lang="en"` on passage, prompt, options and quoted source spans; Swedish chrome/explanation retains Swedish language. Respect English hyphenation and screen-reader pronunciation. Evidence uses exact quotations, solid/dashed underlines and accessible citation names; no answer-revealing marks before grading.

**Unmistakably Lager.** A cool ELF opening accent drains into the familiar illuminated field. The source, task and explanation remain three readable opaque layers, with a lit answer well and floating glass aids.

## Review checklist for the implementation batches

These are future implementation checks, not tests claimed by this B0 document.

- Capture each specified screen and its named subviews at 1440×900 and 390×844 in light/dark. Include 320px, enlarged text and text-spacing overrides. Inspect actual loaded and fallback fonts; a font-fetch failure must not masquerade as a different direction.
- Compare Lager with the other directions at thumbnail size, particularly dark drill, feedback, account and progress. The field gaps, stagger, opaque layers, well and deep button must carry identity without relying only on color or font.
- Exercise empty, loading, partial/error and done states for every screen. Verify queue counts agree across dock, Öva and Repetera; absent data never becomes zero. Verify source counts drive options, progress and result denominators.
- Walk keyboard and touch paths: all five destinations, account from every hub, explicit exit, return context, selected/eliminated options, KVA four/NOG five choices, figure zoom, reader citations, deep links, history and confirmation dialogs. No control may only close a panel when its label promises navigation.
- Run accessibility/contrast checks on actual compositions. Reduced transparency keeps controls opaque; reduced motion removes displacement. Round-1's DPR-2 headless blur capture issue means inspect DPR-1 as well before diagnosing the material. Do not reuse its old screenshot paths as current evidence.
- B2 specifically exercises unfinished/expired resume, answer edits, blank submission, abandon, timeout and failed settlement. B3 checks language boundaries, missing lesson examples, bookmark/read state and preview-only account actions.
- Keep selectors/tokens inside Lager, preserve lazy development isolation, and use the shared data boundary. A visual state demo is not evidence that backend persistence, score calibration or destructive actions were implemented.

## Component inventory and batch handoff

Names below describe local responsibilities; they are proposed working names, not shared-model types or required public APIs.

| Batch | Existing vocabulary to adapt | New local responsibilities | Handoff to next batch |
| --- | --- | --- | --- |
| B1 · screens 5–8 | Frame/dock/account entry, resume sheet, Bars, Options/Actions, Verdict/Explanation, stack/strip, phone sheet; MathText, KvaPrompt, QuestionFigure behavior | PracticeStartSheet, SectionDoors, QueueStatus, QuantSetup, FigureSourceSheet, general OptionWell/FeedbackStack, repetition summary; neutral missing-section chips | Establish common shell, loading/error presentation, actual-option keyboard hints, source/task layout and plain data needs. Preserve existing LÄS screens. Document which helpers are extracted versus still private. |
| B2 · screens 9–11 | B1 source/question/well components; `.la-seg`, `.la-pill`, `.la-prog-n`, `.la-caveat`, `.la-pass`; ConfirmSheet/MockRunner/MockResult semantics | PassCandidate, PassArchive, CommitmentSheet, TimedControls, AnswerIndex, ResultSheet, SectionTempoLedger, PrognosisSheet, TrendWithTable, HistoryBrowser | Timed mode is a distinct action policy with no immediate grading. Export reusable history/result destinations and preserve English reading support for B3. No new scoring or mixed-history backend contract. |
| B3 · screens 12–14 | Frame/account launcher; Newsreader reading, citations, stack/strip, segmented controls; lesson family behavior and generalized question presenters | ReferenceDirectory, LessonOutline/EntrySheet, BookmarkReadStatus, PreferencesSheet, AccountDetail, language/provenance-aware ReadingUnit | Complete account destinations and English content boundaries. Reuse B1/B2 outcomes and explicit return behavior; do not fork dock, answer well or timed-session semantics. |

Shared once: field/mood, opaque sheet depths, primary action, grouped selection, accessible control/disclosure, loading/error status and navigation return context. Keep family-specific lesson content and quantitative setup separate; forcing both into a generic card would lose their structure. No batch changes `meta.ts`'s identity to justify a new look.

## Open questions for the owner

These do not block the document. The bounded defaults above let batches build reviewable previews; any product-policy change needs a separate decision.

1. **Account policy mismatch.** Confirm that the rendered export-first, typed-confirmation deletion flow supersedes `konto.tsx`'s old no-deletion header. Default: preserve its deep placement and preview it without invoking a service; no deletion in menus and no hosted profile embed.
2. **Legacy palettes and advanced preferences.** Which `/mer` palette and `/avancerat` controls should remain meaningful in Lager, and should System become a stored preference? Default: preserve the setting destination and existing stored choices, keep Lager's tokens unchanged, and explain any unavailable preview effect rather than showing a working-looking no-op. Production stores only Ljust/Mörkt; System remains local to the specimen and resolves to light or dark pending an owner decision.
3. **Expired mock recovery.** Should a pass that expires while the app is closed eventually produce a durable result? Current reload behavior voids it. Default: disclose that no result is available and return to the hub; no fabricated recovery or silent timing reset.
4. **Accessible source figures.** Who supplies verified DTK descriptions/table transcriptions and richer math reading support? Default: preserve the original figure, expose zoom/keyboard controls and identify missing equivalent content as an acceptance dependency, not declare the generic alt text sufficient.
5. **Targets and uncertainty.** Should the current 1.8 trend target become a personal setting, and will shared data supply a valid prognosis range? Default: display the supplied target/caveat and omit unavailable ranges; never imply every learner has a measured 2.0 trajectory.
6. **First-open exercise-text disclosure.** Should the approved ÖVNINGSTEXT note expand on a unit's first visit? Default: keep the badge and working “Om texten” control, preserving the current on-demand note and distinguishing authentic ELF from exercise text.
7. **View Transitions.** The round-1 Lager brief calls for View Transitions between sheets. Should that requirement be implemented in these batches or deferred? Default pending owner decision: retain the existing CSS transition family and reduced-motion behavior, with no new View Transitions dependency in B1–B3.

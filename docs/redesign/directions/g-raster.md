# G · Raster — round 2 screen specification

Bead: `hpf-qr0p.39` · B0 · 2026-10-19. Source baseline: `86c6f1cc9ac841735cc936abcf8567fddc79e524`.

This is the presentation contract for B1 (screens 5–8), B2 (9–11) and B3 (12–14). It extends the existing Raster prototype; it does not approve a production redesign, change scoring or session rules, or define the shared data model being built in `hpf-qr0p.7`. Component names marked **new** are proposed responsibilities, not existing exports. UI examples are Swedish; English exam content stays English. Numbers in wireframes illustrate layout, not new fixtures or score calculations.

## Design spine: a study timetable with an answer ledger

The subject is preparation for högskoleprovet by a student with ADHD-PI. Raster makes the next action easy to find and the evidence easy to revisit. Its signature is one continuous, ruled surface: a numbered navigation index, large narrow numerals where a real quantity matters, and one signal-yellow continuation row. Reading happens in IBM Plex Serif; controls, mathematical prompts and records use Archivo. There are no floating cards, shadows, rounded answer tiles or coloured section backgrounds.

Keep the identity at both widths and in dark mode. A generic dashboard with a yellow button does not meet this contract. Use the grid to align the section, question, answer and evidence columns across transitions. Do not turn every paragraph into a bordered cell. The primary action carries the yellow fill; selected options use ink and a rule. Incorrect answers use a glyph and words, without an alarm-coloured page.

### Source anchors

Paths below are relative to the repository root. These are behavior and content references; their existing M3 containers, palettes and motion are not Raster components.

| Contract | Sources inspected |
| --- | --- |
| Identity and reusable parts | `app/src/components/devbake/redesign/g-raster/meta.ts`, `Raster.tsx`, `RasterNav.tsx`, `RasterHome.tsx`, `RasterDrill.tsx`, `RasterFeedback.tsx`, `RasterParts.tsx`, `raster.css`, `Raster.test.tsx` in that directory |
| IA and critique | `docs/redesign/2026-10-round1-brief.md`; `docs/worklog/hpf-qr0p.md`, especially shared feedback, distinctness critiques and round-2 notes |
| 5–8, 14 | `app/src/routes/ova.tsx`, `drill.tsx`, `repetition.tsx`; `app/src/components/drill/DrillQuestion.tsx`, `KvaPrompt.tsx`, `QuestionFigure.tsx`, `ExplanationPanel.tsx`, `DrillResult.tsx`; `app/src/components/MathText.tsx`; `app/src/lib/sectionRailLabel.ts` |
| 9–10 | `app/src/routes/prov.tsx`; `app/src/components/mock/ConfirmSheet.tsx`, `MockRunner.tsx`, `MockResult.tsx`; `app/src/lib/mock.ts` |
| 11 | `app/src/screens/ProgressMobile.tsx`; `app/src/routes/historik.tsx` |
| 12 | `app/src/routes/lektion.tsx`; `app/src/components/lesson/LessonReader.tsx`, `TrapCard.tsx`, `ProtocolCard.tsx`, `LexiconCard.tsx`, `ExampleQuestions.tsx`, `PracticeLink.tsx`, `SectionPracticeCTA.tsx`, `MarkAsReadPill.tsx` |
| 13 | `app/src/routes/konto.tsx`, `mer.tsx`; `app/src/api/useSyncedPrefs.ts` |

### Tokens and layout rules

Reuse the existing scoped `.rd-raster` tokens exactly. Hex approximations are unnecessary: the source values below are the contract.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--ra-paper` | `oklch(100% 0 0)` | `oklch(21.3% 0 0)` | Opaque content and chrome |
| `--ra-ink` | `oklch(20.5% 0 0)` | `oklch(97% 0 0)` | Body, headings, selection, major rules |
| `--ra-secondary` | `oklch(40.5% 0 0)` | `oklch(82% 0 0)` | Supporting text |
| `--ra-rule` | `oklch(62% 0 0)` | `oklch(60% 0 0)` | Row separators |
| `--ra-wash` | `oklch(96% 0 0)` | `oklch(27% 0 0)` | Hover, neutral selection, loading reserve |
| `--ra-signal` | `oklch(88.2% 0.169 99)` | `oklch(80% 0.125 99)` | One primary action |
| `--ra-signal-ink` | `oklch(20.5% 0 0)` | unchanged | Text on yellow |

- **Type:** `--ra-ui` is Archivo/Arial; `--ra-reading` is IBM Plex Serif/Georgia. Keep Archivo width 100 for UI and width 62 for large numbers; use the existing width-80 `IndexNumber` for navigation. Tabular numerals throughout. Never condense equations or passage prose to fit.
- **Scale:** existing display numbers are 174 px desktop / 108 px phone. Reserve that size for a meaningful result or queue count, at most one dominant number on a new screen. Question position remains the smaller 64 / 32 px pattern. Page headings 36–48 / 28–36 px; question headings 27 / 23 px; UI/body 16 px. Reading is 19 px at 1.65 desktop, 18 px at 1.6 phone, approximately 55–70 characters per line where width permits. New essential labels should be at least 12 px; do not copy the smallest phone metadata sizes into new controls.
- **Grid:** at 1440×900, reuse twelve columns with 40 px outer gutters and 24 px column gaps; overview lower sections can retain the existing 32 px separation. Standard content splits are 7/5; library contents use 3/9, with the article itself capped near 65ch. Phone at 390×844 is one column with 20 px gutters; passage gutters reserve the hanging ¶ column. Intermediate widths reflow before either panel becomes unreadable; at a narrow container or enlarged text, use the phone/stacked composition without clipping. This is a proposed responsive extension of the current explicit width variants.
- **Rules and spacing:** 2 px ink rules begin a section; 1 px `--ra-rule` divides rows. Reuse the 8/12/16/20/24/32/40 spacing rhythm. Square corners, no elevation. Long headings and options wrap; rows grow with text.
- **Motion:** existing controls use 100 ms colour/background transitions. No animated counts, shimmering placeholders, entrance cascades or ongoing motion during reading. Retain the reduced-motion override (no transitions, animation or smooth scrolling). Keep comparison stages inert when `live` is false.
- **Accessibility target:** verify body contrast ≥7:1, other text ≥4.5:1 and meaningful controls/graphics ≥3:1 in both themes. Existing token reuse is not proof of every new pairing. Keep the 2 px ink focus outline and offset. All interactive targets, including small figure tools and question cells, are at least 44×44 px; primary actions at least 52 px tall. Check 200% zoom, narrow reflow and text-spacing overrides. Do not assume a screenshot proves these.

### Navigation and state rules shared by every batch

Normal desktop pages retain `RasterNav`'s top index: **01 Idag · 02 Öva · 03 Provpass · 04 Uppslag · 05 Framsteg**, with one ink underline for the active destination. Phone retains the same five labelled doors at the bottom and the top-right **Konto** control. Numbers here identify stable destinations, not the screen numbers 5–14 used in this document. Do not introduce a sixth primary destination for Repetera, Historik or settings. The textual Konto button is the existing Raster equivalent of the brief's account avatar.

Normal detail screens keep the parent destination active and supply a labelled return link. Drill focus uses compact chrome, an always-visible **Avsluta**, current question and progress; the phone index recedes. Existing desktop compact navigation may remain, but leaving an active session through it must follow the same exit behavior. An active timed pass hides the ordinary navigation and account entry: only the explicit abandon/submit paths leave it. Never rely on browser Back, Escape or a command palette as the only exit.

Wireframes use `[label]` for a control and `== primary ==` for the sole filled action in that state. `NAV` and `TABS` mean the full five-door index above. Repeated secondary links are plain ink. On phones reserve space for the bottom index, safe-area inset, sheet and action footer; neither the last row nor the last paragraph may disappear underneath them.

Loading, an empty successful response, incomplete content, a failed request and completion are different states. Reserve the real rows while loading; do not show zero, a score, an empty-queue claim or a saved claim before those facts are known. Cached content may remain with a quiet update warning. Display failures in the affected region and retain usable navigation. Retry wording must match the actual data provider; do not draw a manual retry control without a callback.

Data descriptions below name what users see. The shared model owns retrieval, ordering, eligibility, scoring and persistence. Direction components must not manufacture a recommended section, citation, missing answer, goal, timestamp or completion record. Preserve the underlying content even when a family-specific parser cannot split it.

Practice uses Raster's select → **Svara** → feedback → **Nästa fråga** → completion sequence. Offer A–E only when those options actually exist; KVA and LÄS/ELF use their real option sets. Shortcuts derive from the available letters, Shift+letter eliminates, and Enter/Space operate only in the appropriate practice state. Leave editable controls, dialogs and the bake-off's digit shortcuts alone. Escape dismisses a transient layer before doing anything else; it never silently ends a session. Timed passes have a different answer contract in screen 9.

Round-1 critique becomes acceptance guidance: preserve one dominant action; show the whole phone question; keep elimination visible; show verdict before explanation; keep detail disclosures open while following evidence; preserve reading position; and give completion a concrete next destination. Inspect account and feedback surfaces for identity as carefully as Home.

## 5 · Öva

**Purpose and primary action.** Choose the next practice activity without configuring a session twice. With a resumable practice session the yellow row is **Fortsätt: KVA · fråga 3 av 10**. Otherwise it is **Öva KVA** for a supported recommendation, or **Börja en blandad övning** with no ranking signal. A section row starts that section directly, following the real hub's direct-start behavior. The Repetera door always stays in place.

**Data shown.** Eight section codes and names, any supported recommendation and its rationale, resumable session section/position/total, today's repetition pile per section, and the separate count ready to replay now. Show an estimated duration only if supplied. The section order is stable; highlight the recommendation without rearranging the user's map.

**Desktop wireframe — 1440×900.** Seven columns hold the section timetable, five the repetition summary. The yellow lead spans twelve columns; no grid of equal cards.

```text
HP Coach | NAV: 01 Idag  02 Öva ... 05 Framsteg | Konto
------------------------------------------------------
Öva                              Välj en sektion
== Fortsätt: KVA · fråga 3 av 10                    -> ==
Sektioner ---------------------- | Repetera -----------
ORD  Ordförståelse        2 väntar | 06 redo nu
LÄS  Svensk läsförståelse          | 9 i dagens hög
MEK  Meningskomplettering         | [Öppna Repetera ->]
ELF  Engelsk läsförståelse         | De äldsta först
XYZ / KVA / NOG / DTK, egna rader  |
[Blandad övning ->]               |
```

**Phone wireframe — 390×844.** Lead, eight full-width rows, then the standing repetition block. All scroll above the index.

```text
HP Coach                         Konto
Öva
== Fortsätt: KVA · 3 av 10           ==
Sektioner ----------------------------
ORD  Ordförståelse           2 väntar >
LÄS  Svensk läsförståelse             >
... sex fler fullständiga rader ...
[Blandad övning ->]
Repetera -----------------------------
6 redo nu · 9 i dagens hög   [Öppna ->]
TABS: Idag Öva Provpass Uppslag Framsteg
```

**Reuse/new and Raster signature.** Reuse `RasterNav`, `IndexNumber`, `.ra-resume`, `.ra-plan-row`, `.ra-section-heading`, `.ra-count`, paper/ink/rule/signal. **New:** `RasterPracticeIndex` and a shared `RasterRepetitionSummary`. Section codes anchor the left column; counts share a right edge. No new colour per section.

**States.** Empty history: **Välj en sektion, eller börja med en blandad övning**; no “weakest” tag. Loading: render the eight real labels and neutral count reserves. Partial: unavailable queue counts say **Kunde inte hämta repetitionerna** without disabling supported section practice; no `0 väntar` fallback. Zero due with a nonzero pile: **Inget redo just nu · 9 i dagens hög**. Done/return: update the continuation after an acknowledged completed session, leaving all doors in place. A failed content load offers a real recovery path to the hub.

**Navigation.** Primary index or Idag plan → screen 5. Section doors → the matching drill (6, 7, 14 or the existing verbal views); Repetera → 8, starting immediately only when eligible questions are ready. On explicit drill exit return to the originating hub and row. Do not silently resume a different section's session.

**ADHD-PI and accessibility.** One recommendation, stable geography, no red queue badges or “overdue” debt language. Every row's accessible name includes the section name and any count; the whole door is at least 44 px tall. Recommendation is expressed in words as well as the rule. Missing statistics never hide navigation.

## 6 · Kvantfråga — XYZ, KVA, NOG

**Purpose and primary action.** Solve one quantitative question and understand the method. **Svara** becomes available after a choice; feedback replaces it with **Nästa fråga**, or **Slutför övningen** on the final question. No automatic submission on selection.

**Data shown.** Section, current position and actual total, source question text, equations, conditions, statements, any geometric figure and figure options, actual answer letters/text, selected/eliminated answers, elapsed practice time, verdict and available explanation. Use `MathText` for prompts, options and explanation mathematics; do not recreate formula rendering with plain Unicode or images.

- **XYZ:** a problem, optional figure, then the supplied options. Display the full problem before choices.
- **KVA:** condition above two separate labelled quantities, **Kvantitet I** and **Kvantitet II**, in reading order. Preserve the four fixed A–D alternatives from the content: I greater, II greater, equal, insufficient information. Keep their full Swedish wording; do not replace them with mathematical symbols alone. `KvaPrompt` supplies split/fallback behavior, not the M3 styling.
- **NOG:** stem, **Påstående (1)**, **Påstående (2)** and the sufficiency instruction remain distinct. Preserve the A–E sufficiency alternatives and their exact association with the statements. If splitting fails, render the complete original mathematical prompt; never drop a condition or statement.

**Desktop wireframe — 1440×900.** Problem uses seven columns; the five-column answer ledger aligns to it. Feedback replaces the answer side, preserving the problem position.

```text
HP Coach | compact NAV                         Konto
[Avsluta] KVA                   Fråga 03/10  [Visa tid]
------------------------------------------------------
Kvantitativa jämförelser        | Välj svar -----------
Villkor: ...                   | A  ...          [Stryk]
Kvantitet I                    | B  ...          [Stryk]
  uttrycket, fullt läsbart      | C  ...          [Stryk]
Kvantitet II                   | D  ...          [Stryk]
  uttrycket, fullt läsbart      | Ditt val: B
[Figur om frågan har en]        | == Svara            ==
```

**Phone wireframe — 390×844.** For a short problem, use one scroll flow instead of a reading tray. Quantity labels remain above their values; long equations have a local scroll region rather than shrinking the entire page.

```text
[Avsluta]  KVA     03/10     [Visa tid]
-------------------------------------
Villkor: ...
Kvantitet I
  uttrycket
Kvantitet II
  uttrycket
Välj svar ----------------------------
A ...                         [Stryk]
B ...                         [Stryk]
C ...                         [Stryk]
D ...                         [Stryk]
== Svara                            ==
```

**Reuse/new and Raster signature.** Reuse `.ra-drill-bar`, `.ra-progress`, `.ra-options`, `.ra-option`, `.ra-eliminate`, `.ra-actionbar`, `.ra-answer-ledger` and the `RasterFeedback` hierarchy. **New:** `RasterQuantQuestion`, a Raster-styled quantity/statement layout and a generalized `RasterAnswerLedger`. Use `QuestionFigure` behavior when a figure exists. Ink rules align the givens, answer letters and steps; large display type is for position, never the equation.

**States.** Loading: reserve prompt/figure/options without a guessed choice count. Empty/unusable item: **Frågan saknar fullständigt innehåll** and a return to Öva; skip only if the session provider supports it. Partial: a missing explanation shows **Förklaringen saknas för den här frågan** after the real verdict; next remains available. Missing required question/figure content blocks answering that item. Missing optional explanation fields are omitted without invented advice. Done: **Övningen klar**, actual right/total and duration, then **Till Öva** (or a supplied next-plan action).

**Navigation.** Öva, targeted lesson practice or a compatible resume enters this screen; retain the originating section and lesson context. Explanation may link to the actual lesson entry. Exit remains visible, including during figure zoom and feedback; close the zoom layer first. Completed history opens the saved result read-only, never a new attempt.

**ADHD-PI and accessibility.** Keep givens visible while reasoning; no timer urgency in ordinary practice. Verdict leads, followed by the user's choice/correct choice, why the wrong pick tempted, why it fails, pitfall, technique, solution, essential steps, optional detail steps and other alternatives. Math must expose understandable accessible text; current `MathText` uses HTML with a labelled math role, not structured MathML, so require assistive-technology QA rather than claiming that limitation solved. Formula overflow must be keyboard reachable and must not clip exponents. Options and elimination are separate named controls; selection is a dot/rule plus an accessible state, not colour alone.

## 7 · DTK — diagram, table or map question

**Purpose and primary action.** Read the actual source figure, then answer one question. Use the same **Svara → Nästa fråga** progression as screen 6. Enlarging the figure is a secondary reading tool, not a competing yellow action.

**Data shown.** Original figure, aspect ratio, title/caption and source when provided; question and options; question position within the group sharing that figure; session progress; real explanation and references. Preserve axes, units, legends, table headers and footnotes. Never redraw an exam chart from guessed values or apply Raster's theme filters to its pixels.

**Desktop wireframe — 1440×900.** Seven columns for the figure, five for the ledger. The figure survives transitions between questions in the same block.

```text
[Avsluta] DTK               06/10    [Visa tid]
-----------------------------------------------
Underlaget                   | Fråga 2 av 3 till
Titel / källa, när de finns   | samma underlag
                             | Hela frågan ...
 [original diagram/tabell]    | A ...  [Stryk]
 [axlar, enheter, fotnoter]   | B ...  [Stryk]
                             | C ...  [Stryk]
[Förstora] [Rotera]           | D ...  [Stryk]
                             | == Svara       ==
```

**Phone wireframe — 390×844.** Figure first, full-width within the reading region; a square opaque tray offers the entire prompt and a labelled control. Expanded tray follows Raster's peek/open/full behavior, with safe-area space and figure position retained.

```text
[Avsluta] DTK     06/10      [Visa tid]
Underlaget ---------------------------
 [originalfigur, proportioner bevarade]
 [Förstora] [Rotera]
-------------------------------------
Fråga 2 av 3 till samma underlag
Hela frågan, med radbrytning vid behov.
== Visa alternativen                ==

Expanded: [Visa underlaget] / A–D rows
          == Svara                  ==
```

**Reuse/new and Raster signature.** Reuse the `RasterDrill` split, tray and action bar; use `QuestionFigure`'s SVG/raster, zoom, pan, rotate and reset behaviors with scoped Raster chrome. **New:** `RasterFigureWorkspace`, adding visible load failure and available text-alternative handling. Keep figure backgrounds opaque and original (a white scanned page stays white in dark mode); surrounding controls use Raster tokens. The figure's ruled caption aligns with the answer ledger rather than sitting in a floating card.

**States.** Loading: reserve aspect ratio with **Laddar underlaget…** and disable submission until required content is available. Empty/missing required figure: **Underlaget saknas**, retain the question and an exit, offer only supported retry/skip actions. Partial: retain a loaded figure even if its explanation is absent; an incomplete table is not a complete question. Done: **Övningen klar** with actual result and **Till Öva**. Across block mates, retain zoom/pan/rotation; reset on a genuinely new figure.

**Navigation.** DTK row, mixed practice or lesson → screen 7. A timed pass reuses the figure workspace with screen 9's ungraded answer behavior. Zoom opens a labelled dialog; closing restores focus to **Förstora**, selection and reading position. Leaving the drill follows its recorded return destination.

**ADHD-PI and accessibility.** Put **Samma underlag · fråga 2 av 3** near the question to avoid needless rereading. No animated chart marks. Provide visible buttons for zoom, reset, rotation and closing; pinch/drag cannot be the only methods. Zoom controls remain reachable without covering the legend. Use real supplied descriptions or a semantic table when available; generic “diagram” alt text is not equivalent access to a dense exam image. Missing detailed alternatives are a content dependency for the owner, not permission to invent a table. Frame explanations as references to named axes/rows only when the source supports them; never generate ¶ citations for an image.

## 8 · Repetera

**Purpose and primary action.** Revisit due mistakes in a bounded session. Direct entry shows **Repetera 6 frågor** (actual eligible count, capped at the existing ten-question session size). An eligible Öva direct-start door opens the first question immediately. During replay use the applicable question renderer and **Svara**; completion uses **Till Öva**.

**Data shown.** Ready-now count, today's pile separately when different, optional section scope, current replay plan/position, question content, real answer outcomes, acknowledged resolution/scheduling status and next availability if supplied. “Resolved” is not synonymous with “answered once.” Do not replay not-yet-due items or claim all mistakes are relearned from a zero due count.

**Desktop wireframe — 1440×900.** Queue overview uses a 7/5 ledger; active replay switches to focus mode.

```text
HP Coach | NAV: 02 Öva active                  Konto
[Till Öva] Repetera
---------------------------------------------------
06 redo nu                  | I dagens hög: 9
De äldsta först             | 3 blir redo senare
== Repetera 6 frågor     == | när uppgift finns
Sektion  Redo nu -----------|-----------------------
ORD      4 [Repetera ORD]   | Kort pass, sedan klart.
KVA      2 [Repetera KVA]   |
Active: [Avsluta] Repetition · 01/06 + question ledger
```

**Phone wireframe — 390×844.** The queue count and bounded scope precede secondary section choices.

```text
HP Coach                         Konto
[Till Öva] Repetera
06 redo nu
9 i dagens hög
== Repetera 6 frågor                ==
ORD  4 [Repetera ORD ->]
KVA  2 [Repetera KVA ->]
TABS: Idag Öva Provpass Uppslag Framsteg

Active: [Avsluta] Repetition · 01/06
        question-specific layout
```

**Reuse/new and Raster signature.** Reuse the screen-5 summary, `.ra-display`, `.ra-plan-row`, `.ra-done` and question/feedback components from screens 6, 7, 14 and the existing verbal drill. **New:** `RasterRepetition` coordinating overview and replay presentations. The queue is a dated work list, not an overdue inbox; only ready-now is the dominant number.

**States.** Empty first visit: **När du svarar fel i en övning hittar du frågan här**, with **Öva istället**. Empty due but nonzero pile: **Inget redo just nu**, with supplied next-availability information; no disabled dead-end start button. Loading: **Hämtar repetitionerna…**, no start until eligibility resolves. Partial: a scoped empty queue offers the whole queue; stale/unresolvable saved questions trigger a clear recoverable session state instead of silently replaying from zero. Error: **Kunde inte hämta repetitionerna**, distinct from empty. Done: **Repetitionen klar**, answered/right counts; queue reductions only after acknowledged updates, otherwise **Resultatet väntar på att sparas** if that status exists.

**Navigation.** Always under Öva. Preserve section scope when adopting an active repetition; the real route must not adopt an unscoped session into a section-specific entry. **Avsluta** returns to the repetition/Öva origin. Completed repetition links reopen its saved result. No new settings or rescheduling controls are introduced.

**ADHD-PI and accessibility.** Explicit session length and an end, no guilt, streak loss or racing queue counter. Announce a completed save once, not every updated count. Preserve letter shortcuts for the current question family; full text for scoped actions avoids indistinguishable “Starta” links.

## 9 · Provpass — hub, confirmation and running pass

**Purpose and primary action.** Choose a suitable timed pass, knowingly start it, then move through its questions without feedback. Hub primary: **Välj föreslaget pass** (or **Välj genererat pass** in that mode). Confirmation primary: **Starta nu**. Running primary: **Nästa fråga** while moving forward; at the end **Granska och lämna in** opens the answer overview. **Lämna in** remains a visible secondary command until submission becomes the current task. There is never more than one yellow action in the active view.

**Data shown.** Authentic/generated mode, verbal/quantitative half, actual sitting and pass, presented-question count, prior exposure count, recommendation, session start time/deadline, actual plan/group boundaries, current question and mutable answer sheet. Standard duration is 55 minutes. Standard quotas are verbal ORD/LÄS/MEK/ELF 10 each, quantitative XYZ 12, KVA 10, NOG 6, DTK 12. Display actual availability when a pass has fewer than 40 questions; never relabel it a complete pass. Generated means a composite pass, not newly invented questions.

**Desktop wireframes — 1440×900.** Hub has a full-width recommendation followed by a ruled sitting/pass register. Running mode replaces that index with a control strip and answer register, then the appropriate problem/reading layout.

```text
HUB
HP Coach | NAV: 03 Provpass active             Konto
Provpass         [Riktigt | Genererat] [Verbal | Kvant]
== Välj föreslaget pass · provtillfälle / pass      ==
40 frågor · 55 min · 6 av 40 frågor sedda tidigare
Provtillfälle -------- Pass 1 -------- Pass 2 --------
...                    [Välj]         [Välj]
...                    [Välj]         38/40 tillgängliga

RUNNING
[Avbryt provpass] Kvant   Fråga 12/40  38:24 [Lämna in]
XYZ 01–12 | KVA 13–22 | NOG 23–28 | DTK 29–40
[01 B] [02 –] ... [12 D] ... [40 –]  [Visa obesvarade]
-----------------------------------------------------
Problem / underlag (7 col) | Ändringsbara svar (5 col)
                          | [Föregående] == Nästa fråga ==
```

**Phone wireframes — 390×844.** Hub register stacks sitting labels and pass rows. Running overview is a labelled sheet, not forty tiny targets above the question.

```text
HUB
HP Coach                         Konto
Provpass
[Riktigt | Genererat]
[Verbal | Kvantitativ]
== Välj föreslaget pass             ==
40 frågor · 55 min · 6 sedda tidigare
Provtillfälle
  [Pass 1 ->]  [Pass 2 ->]
TABS: Idag Öva Provpass Uppslag Framsteg

RUNNING
[Avbryt] Fråga 12/40  38:24 [Lämna in]
[Alla frågor · 9 besvarade]
Problem / passage / figur
A ...  B ...  C ...  D ... (egna rader)
[Föregående] == Nästa fråga         ==
Overview sheet: five 44 px cells per row
```

**Reuse/new and Raster signature.** Reuse `RasterNav` on the hub, `.ra-resume`, `.ra-recent` table grammar, `.ra-drill-bar`, `.ra-options` and the reading/figure workspaces. **New:** `RasterMockHub`, `RasterMockConfirm`, `RasterMockRunner`, `RasterAnswerRegister`. Preserve `ConfirmSheet`'s mandatory pre-start commitment and `MockRunner`'s independent state model. The answer register is Raster's index applied to actual exam positions; rules and letters encode answers, not correctness.

**Running behavior.** Selecting an option records a changeable answer; do not grade, show technique, expose the correct letter or require **Svara**. Navigating away and back restores the choice. Previous/next, the register and a labelled unanswered filter all remain usable. The unanswered filter is a proposed presentation over existing answer data, not a new scoring rule. Letters choose only available options; left/right navigation must not intercept controls or figure interaction. Do not attach practice's Enter-to-grade behavior.

Before starting, the opaque square confirmation sheet names the pass, actual count, 55 minutes, no pause, no feedback before submission and no deduction for wrong answers. **Tillbaka** returns without starting a clock. Submission confirmation gives the actual unanswered count and a choice to continue; do not equate missing source questions with unanswered presented questions. **Avbryt provpass** explicitly warns that the pass becomes invalid; it is never labelled “Pausa.” The countdown runs from the stored start, including while sheets are open. At expiry, submit once through the session provider. Use a text warning at five minutes, with no blinking or per-second announcements.

**States.** Empty hub: **Inga pass tillgängliga för den här halvan**, with a usable other-half/mode choice. Loading: retain toggles and register headings; no start until the selected pass resolves. Partial: **38 av 40 frågor tillgängliga** beside that selection and in confirmation; exposure unknown is **Tidigare visningar saknas**, not zero. A fresh resumable pass restores its saved answers and remaining clock; no new 55 minutes. Current `/prov` behavior voids an expired session found on reload; show **Det tidigare passet kan inte återupptas**, without fabricating a result. Done: confirmed settlement → 10. Submission in flight: **Lämnar in…**, prevent edits and duplicates. Failure: retain the answer sheet and show a recoverable save state; retry exists only if the provider supports safe resubmission. Do not show a completed result optimistically.

**Navigation.** Primary Provpass door or Idag's prescribed pass → hub with the intended half. Pass selection → confirmation → runner. A stored fresh session can restore directly to running. Only submission or confirmed abandonment leaves an active pass; Back uses the same guard. Result/history links → 10 with the saved identity. Close an overview/figure dialog back to its originating control.

**ADHD-PI and accessibility.** Mandatory start confirmation prevents an accidental timer. Keep time visible but typographically subordinate to the question. Register cells expose **Fråga 12, svar D, aktuell**; blanks say **obesvarad**, not wrong. Use at least 44×44 targets (the real runner's small cells are not a size precedent). Current, answered and blank have independent glyph/text/border cues. Confirmation dialogs trap focus, return it on dismiss, and disable background commands. Freeze answer shortcuts during settlement.

## 10 · Provpassresultat

**Purpose and primary action.** Understand one completed pass and choose a useful follow-up. Primary **Till Öva**; if the shared provider supplies an eligible, accurately scoped follow-up, replace it with that named practice action. Do not label a generic queue entry **Repetera dina missar från passet** without a matching scope.

**Data shown.** Saved pass identity/date, mode and half, presented/answered/correct counts, derived score plus derivation, section results, section times/budgets, available trap summary, exposure at the start of that pass and comparable past results. Use the saved exposure snapshot, not today's count. The real result contains per-section aggregates and missed-question identities, not complete per-question choices; do not invent an expandable facit from those IDs.

**Desktop wireframe — 1440×900.** Raw score is the single large numeral; the derived score and caveat form the adjacent explanatory column.

```text
HP Coach | NAV: 03 Provpass active               Konto
[Till Provpass] Provpasset klart.
------------------------------------------------------
28/40 rätt (stor siffra)   | Skattad poäng ...
3 obesvarade              | Synlig förklaring av skattning
== Till Öva                                         ==
Sektion  Rätt / visade ----| Tid ------ Budget ----------
XYZ      ...              | ...       ...
KVA      ...              | ...       ...
NOG / DTK                 | ...       ...
Återkommande fälla, om underlag finns
Du hade sett 6/40 frågor innan.   [Tidigare jämförbara pass]
```

**Phone wireframe — 390×844.** Same reading order; time/budget wraps onto the section's second row instead of squeezing columns.

```text
HP Coach                         Konto
[Till Provpass] Provpasset klart.
28/40 rätt
3 obesvarade · 6 sedda tidigare
Skattad poäng ...
Förklaringen av skattningen syns här.
== Till Öva                         ==
XYZ  ... rätt av ...
     Tid ... / budget ...
KVA / NOG / DTK ...
[Tidigare jämförbara pass]
TABS: Idag Öva Provpass Uppslag Framsteg
```

**Reuse/new and Raster signature.** Reuse `.ra-display`, `.ra-calibration`, `.ra-section-heading`, `.ra-answer-ledger`, `.ra-recent`, `.ra-primary`. **New:** `RasterMockResult` and `RasterPacingLedger`. An aligned result sheet with a single condensed numerator replaces statistical cards and gauges. Over-budget is a written note, not a red heat map.

**States.** Loading: reserve the score and section rows. Empty/unknown result: **Resultatet hittades inte**, with **Till Provpass**. Partial: show the real denominator and **2 frågor saknas ur passet — rättat av 38** when applicable; unanswered is a separate count. Missing timing is **Tid saknas**, not 00:00. Missing trap data does not obscure the score. Done: a settled, read-only report; reopening does not create attempts. Report/history fetch failure is distinct from “no earlier passes.”

**Score language.** Keep the real distinction between **Linjär skattning — indikativ, inte UHR-normerad** and **Härlett ur UHR:s normeringstabell för detta provtillfälle**. The latter must retain the explanation that the table is for the 80-question half and the 40-question pass is scaled; it is not an official pass score. A table still loading or unavailable must not produce an unlabeled jump in score provenance. Display Swedish decimal commas; do not derive a total exam score from one half. Comparable history keeps half/mode and its own score provenance visible.

**Navigation.** Settlement or a known saved result link → 10. **Till Provpass** returns to the register; **Till Öva** enters 5. A supplied trap lesson link opens 12 with a return to this report. The primary navigation and Konto remain available.

**ADHD-PI and accessibility.** Start with the outcome and one next step; group caveats beside the number they qualify. Use real table headers and captions; on phone preserve the relation between section, result, time and budget. Announce the report ready once. Avoid celebratory motion or failure language that treats a short pass as poor performance.

## 11 · Framsteg, including Historik

**Purpose and primary action.** See trustworthy progress and decide what to practise next. Primary **Öva KVA** for a supplied focus recommendation; without signal, **Börja öva**. In Historik, opening a selected pass is the main task; its rows are the actions, without a competing filled recommendation.

**Data shown.** Projected score and caveat, supported change over time, verbal/quantitative estimates, goal when supplied, per-section score/band/confidence/attempt counts, weekly trend, twelve-week attendance, a supported focus recommendation, repetition totals and completed session history. Unknown sections remain visible as **För lite underlag**. A two-week comparison requires two actual measurements; no smoothing over missing weeks or invented trend arrows.

**Desktop wireframes — 1440×900.** Overview uses the 7/5 grid. Historik occupies the same Framsteg destination as a flat table.

```text
HP Coach | NAV: 05 Framsteg active                Konto
Framsteg                         [Översikt | Historik]
-------------------------------------------------------
1,41 av 2,0                 | Underlag och osäkerhet
Prognos, inte provresultat   | [Så beräknas prognosen]
== Öva KVA                                          ==
Prognos över tid (0–2,0)     | Fokus och förklaring
Sektion  Poäng  Underlag ----|--------------------------
ORD / LÄS / MEK / ELF / XYZ / KVA / NOG / DTK
Senaste 12 veckorna [Visa dagar]     Repetitionsrad

HISTORIK: [Till översikten]
Datum -------- Pass -------- Rätt av totalt ---- Öppna
...            KVA           7/10               [->]
...            Repetition    6/8                [->]
```

**Phone wireframes — 390×844.** Overview is one column; section metadata wraps. Historik is a list of complete dated rows, not a horizontally clipped table.

```text
HP Coach                         Konto
Framsteg       [Översikt | Historik]
1,41 av 2,0
Prognos · underlag och osäkerhet
== Öva KVA                         ==
Prognos över tid
ORD  poäng ... / underlag ...
... sju fler sektioner ...
Senaste 12 veckorna [Visa dagar]
TABS: Idag Öva Provpass Uppslag Framsteg

HISTORIK
[Till översikten] Tidigare pass
Datum · KVA              7/10 [Öppna]
Datum · Repetition        6/8  [Öppna]
```

**Reuse/new and Raster signature.** Reuse `.ra-figures`, `.ra-calibration`, `.ra-recent`, `.ra-plan-row`, `.ra-label`, paper/ink/rule. **New:** `RasterProgress`, `RasterSectionLedger`, `RasterHistory`, `RasterTrend` with an accessible data listing. A monochrome ruled plot on a fixed 0–2,0 axis, a labelled goal rule if known, and aligned section numerals distinguish it from a dashboard of charts. Yellow belongs to the practice action, not the trend fill.

**States.** Empty: **Öva några frågor så börjar din prognos ta form**, primary **Börja öva**; no 0,00 score. Loading: static ledger labels and reserved values. Partial: show known sections and supported prose only; a single measured week can show its value without a trend line. Error without data: **Kunde inte hämta dina framsteg**; history stays reachable. Done: this is a continuing overview, not “finished learning”; a newly completed pass appears after it is acknowledged. History empty: **Inga avslutade pass än**, **Till Öva**. A missing saved detail keeps its history row and shows a recoverable unavailable message.

**Navigation.** Primary Framsteg, Idag's trap/history links or report follow-up → 11. Historik is always a visible child, even at zero. Existing history rows reopen `/drill?done=…` or `/repetition?done=…`; the reconstructed result offers **Till Historik** and retains list position. Mock history remains linked through Provpass results; do not quietly mix it into a source that currently lists only drill/repetition. Section rows lead to the corresponding lesson, while the explicit primary focus action starts practice.

**ADHD-PI and accessibility.** Default to one focus item, disclose additional supported priorities. Attendance records practice without marking missed days as failure. Charts require visible dates/axes, non-colour marks and a keyboard-readable values view; sparse values must be distinguishable from zero. The twelve-week strip expands to a labelled day view; each day exposes date, counts and section split if supplied. Do not make dozens of tiny heat cells mandatory tab stops before the next action.

## 12 · Uppslag & lektion

**Purpose and primary action.** Find a relevant method, read it, then apply it. Index primary **Fortsätt läsa: KVA** for a real bookmark, otherwise **Öppna KVA** for a supported suggestion. On a cold start, use **Öppna ORD** if available, otherwise name the first available section in the stable index; present this as a starting place, without a personalized recommendation claim. Lesson primary is **Öva detta mönster**, **Öva denna taktik/regel/frågetyp**, or **Öva ord med denna rot**, matching the content. Only the current entry's action is filled; general section practice remains a plain link.

**Data shown.** Available sections, descriptions, supported recommendation, bookmark, entry names and read state, section count/read-time estimate when known, full lesson bodies, worked examples, related example questions and eligible practice links. Preserve content families: XYZ/KVA/NOG trap descriptions, cause, recognition cue and countermeasure; DTK tactics; MEK rules; LÄS/ELF ordered protocols and distractors; ORD roots, origin, meaning and example words. Optional fields remain optional. A root entry is not a trap.

**Desktop wireframes — 1440×900.** Index is a section register. Lesson uses a three-column contents margin and nine-column reading area capped to the established measure.

```text
INDEX
HP Coach | NAV: 04 Uppslag active                Konto
Uppslag
== Fortsätt läsa: KVA / faktisk bokmärkt rubrik       ==
Sektion ---- Innehåll --------------------------- Läs
ORD          Rötter och ordbildning                [->]
LÄS / MEK / ELF / XYZ / KVA / NOG / DTK, egna rader

LESSON
[Till Uppslag] KVA
Innehåll (3 col) | Rubrik (9 col, text högst 65ch)
[Första rubrik]  | Sammanfattning
[Aktuell rubrik] | Igenkänningstecken / Motåtgärd
[Nästa rubrik]   | Genomräknat exempel, när det finns
                 | [Markera som läst]
                 | == Öva detta mönster             ==
```

**Phone wireframes — 390×844.** Contents become a normal disclosure above the article, never a panel covering the paragraph. Index and lesson both retain the bottom doors.

```text
INDEX
HP Coach                         Konto
Uppslag
== Fortsätt läsa: KVA               ==
ORD  Rötter och ordbildning         >
... sju fler sektionsrader ...

LESSON
[Till Uppslag] KVA      [Innehåll +]
Rubrik
Sammanfattning / lektionsinnehåll
Exempel och fördjupning [+]
[Markera som läst]
== Öva detta mönster               ==
TABS: Idag Öva Provpass Uppslag Framsteg
```

**Reuse/new and Raster signature.** Reuse `.ra-section-heading`, `.ra-plan-row`, `.ra-passage-body`, `.ra-feedback-row`, `.ra-step-number`, `.ra-detail-toggle`, `RichText` only where supported references exist, and `MathText`. **New:** `RasterLibrary`, `RasterLesson`, `RasterContents`, family-aware `RasterLessonEntry`. Reuse lesson content and read/bookmark semantics, not the existing “Card” styling. The contents margin and step ledger belong to Raster; entry numbers represent a real order, and machine framework IDs never become decorative UI labels.

**States.** Empty/unavailable section: **Inget innehåll här ännu**, retain the section row with that status and return to the index. Loading: **Laddar lektionen…**, preserve the selected section and heading area. Partial: absent examples omit the practice door for that entry and say **Inga övningsfrågor till detta uppslag ännu**; offer actual section practice instead. Missing optional explanation fields do not produce empty headings. Error: **Kunde inte hämta lektionen**, keep the return door. Done: explicit **Läst ✓** is reversible; reaching the bottom or opening an entry does not itself mark it learned. Bookmark capture and read marking are distinct actions.

**Navigation.** Uppslag → section → entry, or a drill explanation deep link → the exact entry opened. **Till frågan** returns to its saved context when supplied; otherwise **Till Uppslag** is the safe visible path. Practice uses the entry's example scope, not every question in the section. Preserve the lesson return anchor through a practice detour. All eight sections remain discoverable; a recommendation must not reorder a contents list while the reader is using it.

**ADHD-PI and accessibility.** Scan collapsed summaries instead of presenting twenty-five expanded lessons. Keep the opened entry and scroll position across practice/return. Use native disclosure semantics with correctly associated headings, visible focus and 44 px targets. A contents link opens its destination before focusing it. One article landmark, sensible heading levels, ordered lists for actual procedures, language tags on English examples, and accessible mathematics. At text zoom the contents move above the article. “Read” is a toggle with a clear state, not a mastery score.

## 13 · Konto & inställningar

**Purpose and primary action.** Inspect identity and adjust the learning environment without losing the current place. Settings apply on selection using the existing immediate-update/rollback semantics; there is no invented **Spara allt**. The page's primary continuation is **Tillbaka till Öva** (or the actual origin). Destructive actions never take that visual priority.

**Data shown.** Account name and full email, actual plan status, local/current preferences and confirmed save/error state. Settings include light/dark, coach voice, smart/random selection and the existing advanced/settings tool destinations. Exam selection/goal is shown only if the shared model supplies it and an existing editor; do not invent a writable target score. Subscription and login-management notices remain honest about unavailable functionality. Support/legal, export and the existing deep account deletion flow remain discoverable in their appropriate locations.

**Desktop wireframe — 1440×900.** Menu remains a compact top-right disclosure. Full page has a four-column identity/index and eight-column settings ledger.

```text
HP Coach | NAV                                Konto [-]
                                     | Konto          |
                                     | Inställningar  |
                                     | Tema / Hjälp   |
Konto och inställningar -------------------------------
Inloggad som (4 col)       | Tema     [Ljust] [Mörkt]
Namn / full e-post         | Coach    tillgängliga röster
Planstatus                | Urval    [Smart] [Slumpat]
[Konto | Inställningar]    | [Avancerat] [Diagnostik]
                          | [Feedback] [Hjälp & support]
== Tillbaka till Öva                                  ==
Konto, längre ned: dataexport / permanent radering
```

**Phone wireframe — 390×844.** Full page is the usable detail surface; menu only links into it. Email wraps, controls wrap in their row, and the keyboard cannot cover a focused field.

```text
HP Coach                         Konto
[Tillbaka] Konto och inställningar
[Konto | Inställningar]
Namn
fullständig e-post, radbruten
Tema  [Ljust] [Mörkt]
Coach [tillgängliga röster ...]
Urval [Smart] [Slumpat]
[Avancerat] [Diagnostik] [Feedback]
[Hjälp & support] [Villkor / integritet]
== Tillbaka till Öva                ==
TABS: Idag Öva Provpass Uppslag Framsteg
```

**Reuse/new and Raster signature.** Reuse `RasterNav`'s account anchor, `.ra-account-menu`, `.ra-menu-row`, `.ra-theme`, `.ra-outline` and scoped tokens. **New:** `RasterAccountSettings`, `RasterSettingRow`, an inline save-state note. Render real preferences as labelled words and ink-selected segments on ruled rows. Do not import an avatar card or an embedded hosted profile UI. The existing menu's placeholder account/settings text becomes navigation to the full view.

**States.** Empty identity field: **Uppgift saknas**, without guessed initials/email. Loading: reserve the identity rows and disable only unresolved controls. Partial: known settings remain usable while plan information is unavailable; unbuilt subscription features remain explanatory text, not fake buttons. Save pending: **Sparar…** beside the changed row. Done: **Sparat** only after acknowledgment; failure rolls back and says **Kunde inte spara ändringen**. Signed-out state uses the existing authentication boundary. In a fixture-only bake-off, changes are local preview state and must not claim cross-device persistence or trigger real exports/deletion.

**Account boundary.** The current `konto.tsx` header says no deletion, but its rendered body includes `DeleteAccountSection` with an adjacent rule limiting it to deep account content. Pending owner confirmation, preserve the rendered behavior: export offered first, a clear explanation of permanence, exact typed **radera**, then **Radera kontot permanent**, with pending/error/done states. Never put it in the menu, primary index or default settings view. Do not add new retention promises or broaden account capabilities. This specification performs no account action.

**Navigation.** Konto is reachable from every primary page. Its menu opens **Konto**, **Inställningar**, theme and help; the full page has an explicit origin return. Theme changes preserve route, reading position and current selection. Tool links retain the existing destinations (Diagnostik, Avancerat, Feedback and support); Provpass is already in the main index. Any eventual sign-out uses the existing account/auth flow and remains separate from deletion.

**ADHD-PI and accessibility.** Small, stable groups; hide advanced tuning behind its labelled door. No success toast swarm or preview animation. Label controls with their setting and active value; keyboard-native single-choice groups, field-associated errors, polite save status and visible focus. The menu is a disclosure of controls, not an ARIA menu unless a full menu keyboard model is implemented. Closing it returns focus to Konto. Never intercept answer shortcuts while editing a setting.

## 14 · ELF-läsfråga

**Purpose and primary action.** Read an English passage, answer its actual question and inspect evidence. **Svara → Nästa fråga → Slutför texten**, matching the existing LÄS interaction. On phone the collapsed tray's sole yellow action is **Visa alternativen**; the expanded tray owns **Svara**.

**Data shown.** The real English passage, title/byline when present, paragraph boundaries, prompt, actual A–D options, current question/total, elapsed practice time, selected/eliminated answers, explanation, supported citations and passage provenance. Use a committed ELF item provided by the shared model, never translate a LÄS fixture into a claimed ELF source. P5 content has four options; the original round-1 brief's five-option instruction was corrected in the parent worklog.

**Desktop wireframe — 1440×900.** Keep Raster's seven-column reading surface and five-column question/feedback ledger. The passage stays put when the ledger changes.

```text
HP Coach | compact NAV                          Konto
[Avsluta] ELF / ÖVNINGSTEXT         03/04    [Visa tid]
------------------------------------------------------
[Om texten] [Styckefokus]    | Engelsk läsförståelse
English title               | English question in full
¶1  English passage ...     | A  English option [Stryk]
¶2  English passage ...     | B  English option [Stryk]
¶3  English passage ...     | C  English option [Stryk]
                            | D  English option [Stryk]
                            | == Svara                ==
```

**Phone wireframe — 390×844.** Passage first; full question in the opaque square tray. No ellipsis and no clipped final paragraph behind the tray.

```text
[Avsluta] ELF    03/04      [Visa tid]
[Om texten] [Styckefokus]
English title
¶1  English passage ...
¶2  English passage ...
-------------------------------------
Fråga 3 av 4
English question, wrapping in full.
== Visa alternativen                ==

Expanded: [Visa texten] / A–D rows
          == Svara                  ==
Feedback: verdict / evidence / Nästa
```

**Reuse/new and Raster signature.** Reuse `RasterDrill`, `RasterFeedback`, `PassageText`, `Cites`, `RichText`, `.ra-pilcrow`, `.ra-question-sheet`, `.ra-feedback-row` and paper/ink/signal. **New:** an ELF content adapter and a language-aware reading workspace; remove assumptions hardcoded to `UNIT`, **LÄS** and Swedish passage text when the later batch generalizes them. Hanging ¶ numbers, underlined evidence and a ruled facit margin carry Raster's identity in both languages.

**States.** Loading: reserve the passage and question independently, showing **Laddar texten…**. Empty/missing passage or choices: **Texten eller frågan saknas**, explicit **Till Öva**, no answer lock. Partial: missing byline is omitted; absent explanation/citations show the actual verdict and available text without invented references. Done: **Texten klar**, actual right/total and **Till Öva** or a supplied next-plan item. Citation visits keep details expanded and preserve a way back to the explanation.

**Language/content cases.** Put `lang="en"` on the passage article and separately on English question/option text; keep Swedish controls under `lang="sv"`. Do not put the entire bilingual screen under English. English explanation text is tagged according to its supplied language, never assumed Swedish. For generated material, reuse the approved **ÖVNINGSTEXT** badge and disclosure verbatim; authentic content shows its actual source instead. First-open disclosure versus resumed disclosure remains an owner question below.

The primary screen is ELF reading comprehension. The same adapter must safely handle the real app's cloze case: an empty prompt plus an ELF passage is a gap question, not automatically missing content. Show Swedish **Lucka 32**, mark the actual numbered gap in the English passage, and preserve surrounding real numbers. Use the existing gap-detection semantics; never synthesize a new English prompt or treat every number as a gap.

**Navigation.** ELF section row, mixed practice, compatible resume or lesson practice → 14. **Avsluta** uses the recorded origin. A ¶ citation lowers the phone tray, exposes the referenced paragraph, and allows **Till förklaringen** to restore the prior tray and scroll state. Next question in the same passage keeps reading position; a new passage starts at its heading. Timed ELF reuses this layout without explanations before submission, per screen 9.

**ADHD-PI and accessibility.** Default light opaque reading surface, optional paragraph focus, visible elimination and a hideable practice timer. Do not dim unfocused paragraphs below readable contrast. F/J/K focus aids supplement visible controls. Paragraph/citation names remain understandable (**Läs stycke 3**); decorative ¶ glyphs do not clutter announcements. Evidence links must resolve to real paragraphs; unsupported English references stay prose until a validated resolver exists. Expanded/peek/full controls are operable by buttons as well as drag, and a full-height tray keeps exit and its own return-to-text control reachable. At enlarged text, allow normal stacked flow rather than covering the entire passage with an unusable peek.

## Batch handoff and component inventory

These are implementation responsibilities for later beads, not added files or exports in B0. Generalize a shared Raster primitive once; each later batch extends it without introducing another chrome or token system.

| Batch | Reuse and extensions | New presentation responsibilities | Completion evidence for that batch |
| --- | --- | --- | --- |
| B1 · 5–8 | `RasterNav`, row/display/action styles, practice selection/feedback, real math and figure behavior | Practice index; repetition summary/replay; quantitative givens/statements; generic answer ledger; figure workspace with honest failures | Eight stable section doors; due/pile distinction; XYZ, KVA, NOG content variants; actual A–D/A–E options; DTK zoom/return and block continuity; partial explanation and completed replay |
| B2 · 9–11 | B1 content/figure rendering with separate timed-pass semantics; display/calibration/ledger styles | Mock hub/confirmation/runner/register/result; pacing ledger; progress, accessible trend and history | Start/abandon/submit guards; reload clock and answer preservation; expiry/failed settlement; incomplete denominator and score provenance; history round trip and sparse progress |
| B3 · 12–14 | Nav/account disclosure; reading/feedback/paragraph primitives; shared math; B1 answer ledger | Library/contents/family-aware lesson; account/settings rows and status; language-aware ELF adapter and cloze handling | Trap/protocol/lexicon examples; read/bookmark distinction; correct practice scope; setting rollback state; account placement; English language scopes, real citations and full phone prompt |

Every batch should inspect its own screens at 1440×900 and 390×844 in light and dark, plus enlarged text and reduced motion. Verify visible navigation, complete content, safe-area clearance, keyboard focus and the return path through the longest subflow. Inspect the dark and phone versions side by side with another direction: Raster should still read as the same numbered, flat, ruled system. Those are future implementation checks; this document does not claim rendered screenshots or runtime test results.

## Open questions for the owner

The defaults below keep the document implementable without silently changing product behavior. They are proposals, not recorded owner approvals.

1. **Account deletion wording conflict.** Confirm whether the deep export-first, typed-confirmation flow in the current rendered account page is the intended scope. Default: preserve it only deep in Konto, never in menus; fixture-only redesign views perform no real destructive action.
2. **DTK text alternatives.** Which reviewed descriptions or structured tables may the build use for image-only figures? Default: preserve the source figure and available description, explicitly record missing equivalent access; do not invent data or claim the image is fully accessible.
3. **First-open generated-text disclosure.** Should **Om texten** begin expanded for a new generated LÄS/ELF unit? Default: retain round 1's on-demand disclosure and always-visible badge; a changed first-open policy must keep the approved text verbatim.
4. **Raster versus global customization.** Should global palette/font/density preferences change the bake-off direction? Default: Raster keeps its own palette/type/spacing; light/dark works, other existing settings remain accessible through the established settings/advanced flow without claiming they restyle Raster. Do not add a “System” theme option before support exists.
5. **Unified history and goals.** Should a later product change combine mock/diagnostic history with drills and repetitions, and make target score editable? Default: preserve the currently supported history sources and only display a supplied goal. B0 introduces neither behavior.
6. **Failed timed-pass settlement.** Can the shared provider expose safe retry/recovery and confirmed save status? Default: retain answers, show an honest pending/error state and never fabricate completion or reset the clock. B2 must raise missing provider support as a dependency rather than simulating a successful save.

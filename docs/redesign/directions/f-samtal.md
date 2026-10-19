# F · Samtal — screens 5–14

Design specification for round 2, B0, bead `hpf-qr0p.38`. Source baseline:
`e6bea079e07bbab4155e0565863be2f029674149` (2026-10-19).

This is a proposed extension of Samtal, ready for the three implementation
batches to review. Screens 5–14 do not exist in this direction at this baseline.
All UI copy and illustrative numbers in the wireframes are **proposed examples**,
unless explicitly identified as existing source copy. Use actual supplied
content and counts in the build. Paragraphs, questions, answers, explanations,
and approved provenance disclosures must retain their source wording.

## Source anchors and limits

Paths below are relative to the repository root. They are implementation
references, not a request to change production routes in B0.

| Evidence | What it establishes |
| --- | --- |
| `app/src/components/devbake/redesign/f-samtal/meta.ts` | A calm coach in dialogue; no typing delay or conversational text input; optional reflection; one dominant reply. |
| `app/src/components/devbake/redesign/f-samtal/Samtal.tsx`, `SamtalNav.tsx`, `SamtalParts.tsx`, `SamtalHome.tsx` in that directory | Root scope, frame, conversation primitives, message attachments and home hierarchy. Other doors currently render `SamtalStub`; account rows mostly dismiss the menu. |
| `SamtalDrill.tsx`, `SamtalFeedback.tsx`, `samtal.css`, `Samtal.test.tsx` in the same directory | Opaque document, independent desktop conversation, phone tray with preserved reading position, answer selection then submission, optional reflection, explanation folds and citation return. |
| `docs/redesign/2026-10-round1-brief.md`; `docs/worklog/hpf-qr0p.md` | Five-door IA, reading measure, accessibility bar and critiques: clipped questions, equal-weight cards, hidden strike controls, duplicate progress and generic chrome. Historical test results are not verification of this proposal. |
| `app/src/routes/ova.tsx`, `repetition.tsx`, `drill.tsx` | Eight practice sections, direct-start doors, due-now versus today's repetition pile, recoverable unavailable questions and completed-session links. |
| `app/src/components/drill/DrillQuestion.tsx`, `KvaPrompt.tsx`, `QuestionFigure.tsx`, `PedagogyPanel.tsx`, `ExplanationPanel.tsx`; `app/src/components/MathText.tsx`; `app/src/lib/nogPrompt.ts` | Math, comparison/sufficiency structure, SVG/raster figures, optional explanation fields and ELF cloze handling. These contain production styling and are not Samtal-native components. |
| `app/src/routes/prov.tsx`; `app/src/components/mock/ConfirmSheet.tsx`, `MockRunner.tsx`, `MockResult.tsx`; `app/src/lib/normering.ts` | Pre-start confirmation, 55-minute clock, revisable answers, grading only at settlement, partial pass denominators and score provenance. |
| `app/src/screens/ProgressMobile.tsx`; `app/src/routes/historik.tsx` | Evidence-gated prognosis, section confidence, weekly activity and drill/repetition history. Mock history is separate today. |
| `app/src/routes/lektion.tsx`; `app/src/components/lesson/` | Section index, trap/protocol/lexicon families, read marks, bookmarks and practice links. |
| `app/src/routes/konto.tsx`, `mer.tsx`; `app/src/lib/tokens.ts` | Account identity, current tools/settings, export/deletion rendering, light/dark theme contract. |

The parallel shared-data work (`hpf-qr0p.7`) owns its interface. This document
names required information in ordinary language; proposed component names below
describe presentation responsibilities, not new data types or backend promises.
Fixture demonstrations must be visibly distinguishable from live persistence.

## One visual and interaction language

Samtal opens with one useful sentence, then lets the learner reply. A result,
table, figure or long lesson is an attachment or document; it does not become
twenty chat bubbles. Coach turns align left, learner choices align right, and
one filled plum action answers the current question. The distinction must remain
visible at thumbnail size and in dark mode: asymmetric speaker corners,
conversation-list navigation and a document beside the replies carry it.

### Existing vocabulary to preserve

| Existing token or part | Rule for these screens |
| --- | --- |
| `Coach`, `You`, `Replies`, `Divider` in `SamtalParts.tsx` | Short invitation, optional selected-response receipt, right-aligned controls, quiet section/date separators. `Coach` and `You` are semantic wrappers, not a chat service. |
| `Dots`, `DoorIcon`, `Kbd`, `Mark`, `Cites`, `Rich` | Short-session progress, consistent 1.75-stroke door icons, desktop shortcut hints, paired speech-mark logo, paragraph and step links. Do not use forty dots for a mock pass. |
| `--sa-page`, `--sa-side`, `--sa-card`, `--sa-doc` | Neutral canvas, conversation list, attachments and opaque reading surface. No glass behind content. |
| `--sa-coach`, `--sa-you`, `--sa-plum-ink`, `--sa-plum-line`, `--sa-plum-fill`, `--sa-on-plum` | Oat coach turns and tinted plum learner turns; deep filled plum for the principal action. Selected options keep a tint and outlined/filled letter rather than becoming another full-width primary. |
| `--sa-ink`, `--sa-ink-2`, `--sa-ink-3`, `--sa-line`, `--sa-line-2` | Main and secondary text, separators and meaningful state boundaries. Do not assume secondary ink passes the body-text bar on a new background. |
| `--sa-ok`, `--sa-bad`, `--sa-mark`, `--sa-mark-2`, `--sa-focus` | Worded verdict plus ringed glyph, evidence highlight and 2 px focus ring with 2 px offset. Error colour is local, never a page-wide wash. |
| `--sa-ui`, `--sa-read` | Hanken Grotesk for interface, coach and numerals; Lora for passages and extended lesson prose. Math keeps the canonical math renderer. No new font family. |
| `--sa-t12` through `--sa-t32` | Existing nine-size scale: 12, 13, 15, 16, 17, 19, 22, 26, 32 px. Lead 32 desktop/26 phone; question 22/19; reading 19/17.5 with 1.62/1.6 leading. Long equations may grow vertically. |
| `--sa-s1` through `--sa-s12` | Existing 4 px spacing family; 16 px phone gutters, 24 px desktop outer gutters, 32 px document/conversation gap. |
| `--sa-r0/r1/r2/r3`, `--sa-pill` | 6 px speaker corner, 10 px inner attachment, 18 px card/document, 24 px turn/tray and pill controls. Preserve nested-radius relationships. |
| `--sa-d-in/out/tray`, `--sa-ease` | 120 ms entrance, 90 ms exit, 200 ms tray; `cubic-bezier(0.2, 0.7, 0.2, 1)`. Existing entrance includes a 4 px translation. No staggered simulated messages; reduced motion removes movement and smooth scrolling. |

All additions remain under `[data-rd='samtal']` with `sa-` classes. No global
token changes. Existing dark overrides lower chroma: the page is
`oklch(19.5% 0.013 318)`, the document `oklch(22.4% 0.008 318)`, and the action
fill `oklch(50.5% 0.125 340)`. Retain those roles rather than inventing a second
dark palette. Diagrams retain their original information colours.

`SamtalFrame` and the parts above are exported. `DocPanel`, `Options`, `Dock`,
`QuestionTurn`, `AccountItems`, `PlanList` and `Scale` are currently local
functions; descriptions of reuse mean extracting/adapting them within Samtal,
not importing nonexistent exports. `Chip` is mentioned in a source comment but
is not an exported component: reply buttons currently use `.sa-chip`.

### Layout, navigation and shared states

- **Desktop, 1440 × 900:** non-drill screens reuse the 296 px conversation
  list (84 px collapsed) and centred `.sa-col`, maximum 680 px. Report tables
  remain readable within that column. Reading/figure practice uses the existing
  focus strip and document/conversation split, no sidebar. At intermediate
  widths, collapse the rail and then stack document and replies when readable
  measures no longer fit; the existing `data-width` switch alone is not a
  complete responsive implementation.
- **Phone, 390 × 844:** primary pages keep the top-right account trigger and
  labelled five-door bottom bar. Five destinations always retain their order:
  **Idag · Öva · Provpass · Uppslag · Framsteg**. Historik stays inside Framsteg;
  Repetera stays inside Öva. Account/settings share one entry per layout:
  desktop footer or phone top-right, never both. Screen 13 has no second
  account launcher in its content. A modal temporarily makes the background
  inert, then restores it.
- **Focus mode:** screens 6, 7, active 8, running 9 and 14 have a persistent
  labelled exit and textual progress. No account entry or primary tabs while
  answering. Normal practice offers `Avsluta`; timed work says `Avbryt
  provpass` and explains its different consequence. Keep the exit visible
  even with the tray fully open. Escape dismisses the topmost overlay or
  focus aid; it must not silently end a session.
- **One primary:** the wireframes mark it with `[> ...]`; all other brackets
  are subordinate controls. The primary can change with state, but never
  duplicate in a header and footer. Selected filters use a tint, outline and
  selected-state text/semantics; adapt `.sa-pick` for these screens rather
  than making several filter selections solid primary plum.
- **State truth:** loading reserves the final geometry with static skeletons.
  A failed request is not zero; stale/partial values are labelled and usable
  independently. Proposed failure copy: “Kunde inte hämta just nu.” Show
  `Försök igen` only where a real retry action exists. Never claim “sparat”
  until persistence is confirmed. Empty states give a relevant next action.
- **Reading and access:** aim for 55–70 characters on desktop, 17–18 px prose
  on phone, no fixed-height text clipping. Verify both themes at the brief's
  body contrast ≥ 7:1 and UI AA bar, text-spacing overrides and 200% zoom.
  Controls have at least 44 × 44 px hit areas; long option text wraps. Keep
  answer selection and elimination separate sibling controls. Use visible
  labels, native landmarks/headings and proper selected/expanded semantics.
- **Focus and motion:** focus the new question/verdict only after a learner
  action. Navigation changes focus the page heading; a dismissed dialog
  returns focus to its opener. Ordinary lists are not live chat logs. Announce
  only concise changes such as answer confirmation or save errors. Clocks
  never announce every second. Existing font fallbacks must remain usable
  without network access.

The wireframes are schematic, not fixed pixel boxes. Wrapped labels, translated
text and extra lines must grow rather than disappear behind the dock.

## 5 · Öva — choose the next practice

**Purpose and primary action.** Make the next useful practice obvious while
keeping all eight sections discoverable. Primary: `Öva KVA` when a supported
recommendation is KVA; with an active resumable practice use `Fortsätt övningen`
instead. With no recommendation or resume, use `Börja blandat`. All are proposed
copy, not evidence of an existing recommendation.

**Data.** Section names, available practice, supported recommendation and its
reason, any resumable session, due-now repetition count, today's pile count and
per-section counts. Keep these two repetition counts distinct: the production
hub's per-section waiting counts describe the pile, whereas the launch action
uses questions actually due now. Show a supplied session size; do not invent
minutes from the count.

**Desktop.** One lead `Coach` turn and its replies precede a quiet, grouped
section attachment. Repetition is a permanent lower section with its own
subordinate entry, including at zero.

```text
+----------------------+------------------------------------------+
| Idag                 |                 Öva                      |
| Öva (aktiv)          | Coach: KVA är ett förslag idag.           |
| Provpass             |             [> Öva KVA] [Börja blandat]   |
| Uppslag              | Öva nytt                                  |
| Framsteg             | Verbal: ORD  LÄS  MEK  ELF                |
|                      | Kvant:  XYZ  KVA  NOG  DTK                |
|                      | Repetera                                  |
| Konto                | 6 redo nu, 9 i dagens hög [Repetera 6]    |
+----------------------+------------------------------------------+
```

**Phone.** Same ordering, one column. Section doors wrap in stable verbal and
quantitative groups. The lead action spans the content width; repetition sits
in the scroll flow above the permanent tabs.

```text
+------------------------------------------------+
| HP-Coach                                Konto  |
| Öva                                            |
| Coach: KVA är ett förslag idag.                 |
| [> Öva KVA]                                    |
|                            [Börja blandat]     |
| Öva nytt: ORD  LÄS  MEK  ELF                    |
|           XYZ  KVA  NOG  DTK                    |
| Repetera: 6 redo nu [Repetera 6]                |
| Idag | Öva | Provpass | Uppslag | Framsteg      |
+------------------------------------------------+
```

**Reuse and additions.** `SamtalFrame`, `Coach`, `Replies`, `Divider`, `.sa-card`
and the `.sa-plan-row` rhythm; `--sa-coach`, `--sa-card`, `--sa-plum-fill`,
`--sa-r1/r2`. New `PracticeDoors` and `RepetitionSummary` adapt this vocabulary
to section availability and the two counts. No equal-sized card grid.

**States.** Empty history: “Välj något att börja med” with no “svagast” badge.
Loading: keep eight labels and the Repetera position; skeletonise only counts
and recommendation. Partial: practice remains available when repetition data
fails; show unknown counts as unavailable, never zero. Done: a return from
practice updates the queue and offers the next supplied activity without a
second celebration. A nonempty pile with nothing due says “Inget redo just nu”.

**Navigation.** Öva door or Idag practice link → this hub. Section doors start
their practice directly, consistent with `/drill?section=…&start=1`; DTK leads
to 7, quant to 6, ELF to 14. Repetition entry → active 8 when ready; a direct
Repetera deep link can show its idle state. No extra “Are you ready?” step.

**ADHD-PI and accessibility.** Stable section order, one recommendation with a
reason, no alarming queue badge. A section door has its full name in the
accessible label; counts are text, not dots alone. Samtal is recognisable in
the coach invitation and reply grouping, not a catalogue of coloured tiles.

## 6 · Kvantfråga — XYZ, KVA and NOG

**Purpose and primary action.** Read the entire problem, select deliberately,
then submit. Primary `Svara` is disabled until a valid selection; feedback
replaces it with `Nästa fråga`, or `Slutför övningen` on the last question.
This preserves Samtal's select-then-submit pattern; production
`DrillQuestion` currently commits on selection and must not dictate the new
presentation's interaction by accident.

**Data.** Section, current/total position, elapsed time if available, complete
stem, condition, quantities or numbered statements, optional figure, actual
option letters/text/figures, selected and eliminated answers, verdict and
available explanation. Render math in every location: stem, statements,
options, selected-answer receipt and explanation.

**Desktop.** For text-only quant use the centred 680 px conversation without
an empty document pane. The problem is an opaque attachment inside the opening
turn; replies sit below on the learner's edge. If a problem needs a sizeable
figure, use the document/answer split from 7.

```text
+----------------------------------------------------------------+
| Avsluta                         KVA · Fråga 3 av 10       02:14  |
|                  Coach: Jämför kvantiteterna.                   |
|                  +------------------------------------+        |
|                  | Villkor: [källans text och matematik]|        |
|                  | Kvantitet I  [uttryck]              |        |
|                  | Kvantitet II [uttryck]              |        |
|                  +------------------------------------+        |
|                         [A I är större än II] [Stryk A]         |
|                         [B II är större än I] [Stryk B]         |
|                         [C I är lika med II]  [Stryk C]         |
|                         [D informationen är otillräcklig]       |
|                         Ditt svar: B               [> Svara]   |
+----------------------------------------------------------------+
```

**Phone.** Quant without long supporting material is a continuous scroll,
not a reading tray hiding the condition. The dock sticks below the options,
with enough bottom padding for the final line. A figure variant uses 7's tray.

```text
+------------------------------------------------+
| Avsluta             NOG · Fråga 3 av 10        |
| Coach: [hela frågan]                           |
| +------------------------------------------+  |
| | (1) [påstående med matematik]             |  |
| | (2) [påstående med matematik]             |  |
| +------------------------------------------+  |
| Tillräcklig information ...                    |
| [A ...] [Stryk]                               |
| [B ...] [Stryk]                               |
| [C ...] [Stryk] [D ...] [Stryk]                |
| [E ...] [Stryk]                               |
| Ditt svar: E                       [> Svara]  |
+------------------------------------------------+
```

**Reuse and additions.** Extract/adapt Samtal's `Options`, `Dock`, `QuestionTurn`
and feedback into proposed `QuestionConversation` and `QuantAttachment`.
Reuse `MathText` and `parseNogPrompt` behavior; adapt `KvaPrompt`'s structure
with Samtal typography instead of its production CSS variables. Use
`--sa-doc`, `--sa-you`, `--sa-r0/r2`, `--sa-t19/t22` and the existing selected
letter treatment. XYZ keeps its whole stem and any figure; NOG keeps (1), (2)
and the sufficiency coda together; KVA keeps condition, I and II distinct.

**Answer contract.** Never manufacture A–E for every section. The inspected
`app/public/data/var-2024.json` examples contain XYZ A–D, KVA A–D, NOG A–E and
DTK A–D. The single five-option XYZ item `host-ver2-2019-kvant1-XYZ-002`
is an exception: render its supplied option entries; do not hard-code A–D.
KVA's existing option text is A “I är större än II”, B “II är större
än I”, C “I är lika med II”, D “informationen är otillräcklig”. Render the
supplied options verbatim and bind keys only to those letters. NOG's five
sufficiency meanings must not be shortened into ambiguous numeric answers.

**States.** Empty/unavailable question: explain and offer `Till Öva`, not a
fabricated problem. Loading: reserve problem and option geometry; no active
answer key. Partial: missing optional explanation leaves verdict/next usable;
incomplete essential stem, options or figure blocks submission and offers
recovery. Unsplit KVA/NOG falls back to the full source text. Done: reuse the
closing-turn pattern with actual answered/correct counts, then a single next
activity or `Till Öva`. Saving and save failure keep the selected answer visible.

**Navigation.** From 5, scoped lesson practice or a supported resume. Exit
returns to the initiating context (Öva fallback) with honest save status.
Feedback may open 12 for a real framework link, preserving question state.

**ADHD-PI and accessibility.** No pre-answer solution hints hidden in coach
copy. Fixed labels reduce comparison load; elimination is reversible and never
auto-submits. Math is selectable text; `MathText` currently emits HTML plus an
accessible flattened label, not structured MathML. Verify spoken quantities,
fractions and statements rather than claiming math accessibility is solved.
Long equations scroll locally if necessary, without shrinking the whole page.
The attachment/turn/reply sequence makes this Samtal even without a passage.

## 7 · DTK — inspect a diagram, table or map

**Purpose and primary action.** Let the learner read the actual figure while
answering the related question. Primary `Svara`, then `Nästa fråga`; `Förstora
figur` is an always-visible secondary tool, not the answer action.

**Data.** Source figure and aspect ratio, any supplied caption/description,
question and options, current position within the shared figure block and
whole session, selection and explanation. Do not invent data values or a
text-table equivalent from a raster screenshot.

**Desktop.** Adapt `.sa-dbody`: allocate roughly 60% to the opaque figure
document, the rest to the coach conversation, with the existing 32 px gap.
The figure has its own controls and scroll/pan region; the question stays
beside it. Preserve zoom, rotation and pan between questions sharing a figure.

```text
+-------------------------------------------------------------------+
| Avsluta                               DTK · Fråga 4 av 10          |
| +--------------------------------+   Coach: [hela frågan]          |
| | Underlag · samma sida           |          [A ...] [Stryk]        |
| | [diagram / tabell / karta]      |          [B ...] [Stryk]        |
| | axlar, enheter, teckenförklaring|          [C ...] [Stryk]        |
| | [Förstora figur] [Rotera]       |          [D ...] [Stryk]        |
| +--------------------------------+                                |
| Fråga 2 av 4 · samma sida                  Ditt svar: C [> Svara]  |
+-------------------------------------------------------------------+
```

**Phone.** Full-width figure first; the docked question tray peeks with the
whole prompt and opens to options. `Visa figuren` restores the figure's saved
position. Expanded inspection owns the screen until `Stäng figur`/Escape;
there is no timer pause implied by zoom.

```text
+------------------------------------------------+
| Avsluta              DTK · Fråga 4 av 10       |
| Underlag · Fråga 2 av 4 på samma sida           |
| +------------------------------------------+  |
| | [figur i ursprungliga proportioner]       |  |
| +------------------------------------------+  |
| [Förstora figur]                               |
| +------------------------------------------+  |
| | Coach: [hela frågan]                      |  |
| |                       [> Välj ett svar]   |  |
| +------------------------------------------+  |
+------------------------------------------------+
```

**Reuse and additions.** `QuestionConversation`, `.sa-doc`, `.sa-tray`, `.sa-dock`,
`Coach`, feedback and `--sa-doc/r2/r3/tray-shadow`. New `FigureDocument` wraps
the source-loading/aspect-ratio behavior from `QuestionFigure` and provides
Samtal controls. Existing raster inspection supports zoom/pan/rotation;
its 34 px controls, generic alt text and body portal need explicit adaptation.
A portal must carry Samtal's theme/scope; the production component's global
token assumptions must not leak into the bake-off.

**States.** Empty/missing required figure: “Underlaget saknas” with return or
retry, no enabled grading. Loading reserves aspect ratio and labels the wait.
Partial: a usable figure with missing explanation can still be answered; a
failed figure is not optional merely because text loaded. Done: when the block
ends, announce the new underlay once; when the session ends use the closing
turn. Next question within the same block retains the figure state.

**Navigation.** 5's DTK door, a scoped practice link, or the DTK portion of
repetition/mock → this composition. Close figure returns to its opener; return
from feedback citation/inspection restores the prior explanation position.
Timed use inherits 9's no-feedback behavior.

**ADHD-PI and accessibility.** No repeated figure animations or unsolicited
coach commentary during inspection. Original chart colours and units remain
intact in both themes. Supply caption and meaningful alternative description
when available; equivalent tables require real structured data. Zoom is not an
accessibility substitute. A figure dialog needs a labelled close button,
focus containment, inert background and keyboard zoom/pan equivalents. Use
44 px targets and no gesture-only controls. The steady document beside a
short exchange, not a chart dashboard, is Samtal's signature here.

## 8 · Repetera — a bounded return to missed questions

**Purpose and primary action.** Show what is ready now and make it easy to
complete a manageable batch. Idle primary `Repetera 6` uses the actual batch
size (up to the current production limit of 10); running uses `Svara`/`Nästa
fråga`; done uses `Till Öva`. No action promises that today's entire pile is due.

**Data.** Due questions, requested section if any, today's pile, resolvable
question content, saved active plan and progress, answers and resolution/save
status. Distinguish “never had misses”, “nothing due now”, “all due items
resolved” and “could not load”. A correct repetition resolves its mistake in
the production route; a wrong answer remains work to revisit.

**Desktop.** Centre a short coach invitation with a compact section breakdown
as an attachment. Active practice reuses 6/7/14 or the existing LÄS composition
according to the question, keeping Repetition in the progress strip.

```text
+----------------------+------------------------------------------+
| Idag                 | Repetera                                 |
| Öva (aktiv)          | Coach: 6 frågor är redo nu. Tar vi dem?   |
| Provpass             | +--------------------------------------+ |
| Uppslag              | | ORD 2 · KVA 4                         | |
| Framsteg             | | 9 i dagens hög, 6 redo nu             | |
|                      | +--------------------------------------+ |
|                      |              [Välj sektion] [> Repetera 6]|
| Konto                | [Till Öva]                               |
+----------------------+------------------------------------------+
```

**Phone.** Idle keeps primary navigation. The active session substitutes focus
chrome and a question-appropriate layout; the summary restores navigation.

```text
+------------------------------------------------+
| HP-Coach                                Konto  |
| Repetera                                       |
| Coach: 6 frågor är redo nu.                     |
| +------------------------------------------+  |
| | ORD 2 · KVA 4                            |  |
| +------------------------------------------+  |
| [> Repetera 6]                                 |
|                         [Välj sektion]        |
| [Till Öva]                                     |
| Idag | Öva | Provpass | Uppslag | Framsteg      |
+------------------------------------------------+
```

**Reuse and additions.** `Coach`, `Replies`, `Divider`, `Dots`, `.sa-attach`,
closing-turn/tally styles and `--sa-coach/you/card`. New `RepetitionOverview`
uses B1's `RepetitionSummary` and question conversation; no separate answer
system. The feedback's optional reflection remains skippable.

**States.** Empty: one invitation and `Till Öva`, no dead start button.
Loading: count slot reserved; launch disabled until due data and content are
known. Partial: preserve viable entries and explain the actual smaller batch;
prune stale/resolved items rather than replaying them to hit a target. Done:
actual completed/correct counts, then “Klart för den här omgången”; only claim
resolution after acknowledgement. Unresolved saves remain visible with a
recovery path and do not appear as completed queue removal.

**Navigation.** From 5 or the day's plan; ready hub entries start directly.
Support section-scoped entry and existing `/repetition?done=…` report links.
Returning from the report returns to Historik when opened there, otherwise
Öva. A stale saved plan falls back to a recoverable overview, never an endless
loading state or a silent restart at question one.

**ADHD-PI and accessibility.** A finite count and predictable exit replace
pressure to “clear everything”. Keep the queue's geography stable at zero.
Announce count changes after answers rather than moving focus or rows during
reading. Reuse answer/verdict semantics from 6. Samtal closes with a concise
coach acknowledgement and a reply, without loss framing or confetti.

## 9 · Provpass — choose, commit and run

**Purpose and primary action.** Make the commitment clear before the clock
starts, then provide uninterrupted timed work. Hub primary `Välj det här
passet` opens the one confirmation; confirmation primary `Starta nu` starts
the clock. Running primary `Nästa fråga` advances without grading; on the last
question it becomes `Granska svar`. In the answer overview the primary becomes
`Lämna in`. This is a proposed Samtal presentation of the existing mock contract.

**Data.** Authentic/generated mode, verbal/quantitative half, available
sittings/passes, actual question count and composition, prior exposure,
suggestion based on least exposure, session start/deadline, selected answers,
current position, answered count and save/settlement status. Preserve the
stored start time on resume; never restart a full 55 minutes on refresh.

**Desktop hub.** Same conversation column: one offer with a pass attachment,
then a quiet chronological register. Mode and half are subordinate reply-style
choices. All register choices go through the same confirmation.

```text
+----------------------+------------------------------------------+
| Idag                 | Provpass                                 |
| Öva                  | [Riktigt pass] [Genererat pass]           |
| Provpass (aktiv)     | [Verbal] [Kvantitativ]                    |
| Uppslag              | Coach: Det här passet har du sett minst. |
| Framsteg             | [provtillfälle · pass · antal · 55 min]  |
|                      |                     [> Välj det här passet]|
|                      | Andra provtillfällen / pass / sett antal |
| Konto                | [Välj en rad för samma bekräftelse]      |
+----------------------+------------------------------------------+
```

**Phone hub.** Chronological sitting rows open that sitting's least-seen pass
in the confirmation, matching the current phone picker. The confirmation names
the exact pass and actual count; backing out retains mode, half and scroll.

```text
+------------------------------------------------+
| HP-Coach                                Konto  |
| Provpass                                       |
| [Riktigt pass] [Genererat pass]                 |
| [Verbal] [Kvantitativ]                          |
| Coach: Det här passet har du sett minst.        |
| [provtillfälle · pass · antal · 55 min]         |
| [> Välj det här passet]                         |
| Andra provtillfällen [rad] [rad]                |
| Idag | Öva | Provpass | Uppslag | Framsteg      |
+------------------------------------------------+
```

The confirmation uses an oat coach heading plus a plain conditions list: no
pause, answers can change until submission/deadline, no feedback before
submission, aborting invalidates the pass, and wrong answers have no deduction.
It names any fewer-than-40 questions before commitment. `Inte nu` dismisses
without starting. Do not split this into two confirmations.

**Desktop running.** Remove primary navigation. The focus strip contains exit,
question position and clock; below it a compact answer overview affordance.
Use the document/conversation composition for passages/figures and the centred
quant composition otherwise. A selected answer records immediately and stays
editable; no `Svara` button, verdict, explanation or pre-answer coaching hint.

```text
+-------------------------------------------------------------------+
| Avbryt provpass         Fråga 18 av 40                 31:42 kvar |
| 16 besvarade  [Visa svarsöversikt]                                 |
| +-------------------------------+  Coach: [källans fråga]         |
| | [text / figur om det behövs]   |         [A ...] [B ...]         |
| |                               |         [C ...] [D ...]         |
| +-------------------------------+                                |
| [Föregående fråga]                         [> Nästa fråga]         |
+-------------------------------------------------------------------+
```

**Phone running.** Keep exit and clock visible when a passage tray expands.
`Visa svarsöversikt` opens a sheet with numbered 44 px targets, wrapping into
fewer columns than the existing production ten-column grid. Closing it returns
to the same question/reading position. The clock continues while sheets open.

```text
+------------------------------------------------+
| Avbryt provpass                  31:42 kvar    |
| Fråga 18 av 40 · 16 besvarade                  |
| [Visa svarsöversikt]                            |
| [text / figur / villkor]                       |
| Coach: [hela frågan]                           |
| [A ...] [B ...] [C ...] [D ...]               |
| [Föregående]                    [> Nästa fråga]|
+------------------------------------------------+
```

**Reuse and additions.** `Coach`, `Replies`, question/document patterns,
`.sa-strip`, `.sa-clock`, `.sa-tray`, `--sa-doc/you/line-2`. New `PassOffer`,
`PassConfirm`, `TimedConversation` and `AnswerOverview`; port the behavior
contract of `MockRunner`, not the practice grading loop. Keep radio/pressed
choices tinted so the single next action remains dominant.

**States.** Empty mode/half: explain unavailability and offer the other mode;
never launch zero questions. Loading: keep picker structure; confirmation
cannot start until the plan is known. Partial: disclose missing questions and
actual denominator before start; save failure is visible without dropping
answers. Done: settlement locks edits, shows `Lämnar in…`, then opens 10 when
the result exists. Deadline submits once; failed settlement offers recovery
without restarting time or fabricating a result. The current runner lacks a
complete visible retry state: demonstrating it is new presentation work, not
proof the existing backend flow already recovers. An expired/unresolvable
resume explains why it cannot continue and returns to the picker.

**Navigation.** Provpass door or prescribed Idag entry → selected half in hub.
Confirmation → running; overview can jump to any question, including blanks.
Early submit gives the actual unanswered count and a return-to-pass option.
Abort explicitly confirms invalidation and returns to the hub. Neither Escape
nor a background tap can abort. Completion → `/prov?result=…` equivalent, 10.

**ADHD-PI and accessibility.** No drip-fed tips, streaks, motion or correctness
colours during the timed pass. Overview cells announce number, section,
answered/unanswered and current state; current is outlined as well as coloured.
Letter shortcuts operate only on actual options, arrow navigation does not
steal focus from controls, and overlays suspend question shortcuts. Timer
warnings are restrained text at meaningful thresholds, not per-second live
announcements. Samtal's coach becomes quiet exam wording during the pass and
returns to dialogue only after settlement.

## 10 · Provpassresultat — interpret one completed pass

**Purpose and primary action.** Explain the result and its limits, then offer
one manageable next step. Primary `Till Öva`; a specific practice suggestion
may replace it only when a supported target is supplied. Do not promise a
queue of “all misses” without checking what is currently due.

**Data.** Result date, mode/half/sitting, actual presented/answered/correct
counts, score and its table/conversion basis, estimate basis / calibration
status (the stored, server-decided `estimateBasis`), per-section correct counts/time, pacing budget,
stored exposure snapshot, available trap summaries and same-mode/half history.
Current `MockResult` has missed-question identifiers and summary data, not
complete per-question answers: a detailed expandable facit is not assumed.

**Desktop.** One lead result turn, a score attachment and adjacent caveat,
followed by plain notes for sections, pacing and traps. The main reply appears
after the summary; detailed analysis remains below it, not a gate to leaving.

```text
+----------------------+------------------------------------------+
| Idag                 | Provpassresultat                         |
| Öva                  | Coach: Klart. 28 av 40 rätt.              |
| Provpass (aktiv)     | [skattning / härledd poäng + förklaring]  |
| Uppslag              |                              [> Till Öva] |
| Framsteg             | Genomgång                                |
|                      | Sektion | rätt/visade | tid | budget      |
|                      | [fällor med underlag]                    |
| Konto                | Sett tidigare: 7 av 40 · Tidigare pass   |
+----------------------+------------------------------------------+
```

**Phone.** Same narrative, compact per-section rows with stacked pacing labels;
no wide table forcing page-wide horizontal scroll. History is a disclosure
below the report, not a second dashboard.

```text
+------------------------------------------------+
| HP-Coach                                Konto  |
| Provpassresultat                               |
| Coach: Klart. 28 av 40 rätt.                    |
| [poäng och synlig förklaring av skattningen]    |
| [> Till Öva]                                   |
| Genomgång                                      |
| ORD 8/10 · Tid 06:00 · Budget 13:45             |
| [övriga sektioner och fällor]                   |
| Sett tidigare: 7/40 [Tidigare pass]             |
| Idag | Öva | Provpass | Uppslag | Framsteg      |
+------------------------------------------------+
```

**Reuse and additions.** `Coach`, `Divider`, `Replies`, `.sa-score`, `.sa-footnote`,
`.sa-notes`, `.sa-tally`; `--sa-ink/ink-2`, `--sa-line`, `--sa-ok/bad` only on
local glyphs. New `PassReport`, `SectionResultRows`, `PacingRows`; reuse
`MockResult`'s content/basis decisions without its M3 rails.

**States.** Empty/invalid result link: “Det här resultatet kunde inte hittas”
and `Till Provpass`; no zero-score report. Loading: skeleton summary, no
provisional score presented as final. Partial: display X/N, including an
explicit fewer-than-40 note; unknown is not incorrect. Keep raw counts usable
when normering, traps or history are unavailable. Done: stable result and
timestamp; revisiting never submits again or restarts a session.

**Score wording.** Authentic with a matching table can say the existing
“normerat (härlett)” meaning, with the explanation that an 80-question table is
applied to a scaled pass result. It is not an official 40-question result.
Without that basis, retain “skattad poäng” and the indicative/linear caveat.
Calibration is separate from the table/conversion basis: a result fed by any
P5 / övningstext question is **not calibrated**, even when a sitting table
supplies the “normerat (härlett)” conversion. Keep those questions in the raw
counts and the visible P5 / övningstext calibration caveat next to the score.
Use the stored estimate basis; do not infer calibration from Genererat pass mode.
Never hide the qualification behind hover or a tiny icon. Use the stored
prior-exposure count, not today's recalculated exposure.

**Navigation.** From completed 9, its permalink or same-mode/half mock history.
Keep Provpass selected; provide `Till Provpass` as secondary. Framework links
open 12 only when resolvable, with a way back to this report.

**ADHD-PI and accessibility.** Lead with one factual sentence, then one reply;
no row of competing progress rings. Use real table headers on desktop and
equivalent labelled values on phone. Colour never carries accuracy or pacing
alone. The score is a coach attachment with a footnote, and detailed analysis
uses Samtal's unboxed notes after the short conversation.

## 11 · Framsteg, including Historik

**Purpose and primary action.** Translate accumulated practice into one useful
next action without overstating certainty. Overview primary `Öva KVA` is a
proposed example for a supported focus recommendation; otherwise `Välj övning`
opens 5. Historik subview primary `Öppna senaste passet` when a completed pass
exists; an empty history uses `Till Öva`.

**Data.** Prognosis and basis, including estimate basis / calibration status,
verbal/quantitative breakdown, range/confidence,
supported change over time, observed weekly volume/accuracy/activity,
per-section estimates and attempt counts, focus recommendations, repetition
summary and completed drill/repetition rows. Missing weeks are gaps, not zero.
The current progress plot has a 1.8 reference goal; an editable target is not
established by this screen. Use a supplied target or label the reference
honestly rather than calling a hardcoded 1.8 “ditt mål”.
Any P5 / övningstext answer feeding the prognosis makes it **not calibrated**;
keep its contribution in the underlying counts and its visible calibration
caveat next to the prognosis. Read the supplied estimate basis independently
of pass mode or any sitting-table conversion; “normerat (härlett)” does not
remove the P5 / övningstext caveat.

**Desktop.** Coach summary and one reply, then a score attachment with caveat,
quiet trend, stable eight-section ledger, and activity disclosure. Historik is
a visible local tab/section within Framsteg, with its own heading and rows.

```text
+----------------------+------------------------------------------+
| Idag                 | Framsteg · [Översikt] [Historik]          |
| Öva                  | Coach: [en underbyggd observation]       |
| Provpass             |                              [> Öva KVA] |
| Uppslag              | [Prognos · intervall · underlag]         |
| Framsteg (aktiv)     | [veckotrend med luckor där data saknas]  |
|                      | Sektion | nivå | underlag | trend        |
|                      | [Närvaro] [Repetition]                   |
| Konto                | Historik: datum · pass · rätt/antal      |
+----------------------+------------------------------------------+
```

**Phone.** Same vertical rhythm; ledger rows wrap the evidence below the
section name. Historik replaces the overview content but retains primary
navigation, one account entry and an explicit `Till översikten` control.

```text
+------------------------------------------------+
| HP-Coach                                Konto  |
| Framsteg                                       |
| [Översikt] [Historik]                           |
| Coach: Här finns dina avslutade övningar.       |
| [> Öppna senaste passet]                        |
| Idag · KVA · 7/10 rätt                         |
| Igår · Repetition · 6/8 rätt                    |
| [Till översikten]                              |
| Idag | Öva | Provpass | Uppslag | Framsteg      |
+------------------------------------------------+
```

**Reuse and additions.** `Coach`, `Replies`, `Divider`, score/range/footnote
styles from Home and `.sa-recent`; adapt the local `Scale` only when real range
data exists. `--sa-range`, `--sa-plum-ink`, `--sa-line`, tabular numerals. New
`ProgressConversation`, `SectionLedger`, `TrendAttachment`, `HistoryList`.
Plain section rows carry evidence; multiple equal-size stat cards would erase
Samtal's hierarchy.

**States.** Empty: invite a first practice without a zero prognosis or fabricated
delta. Loading: skeleton metric slots while labels/navigation stay stable.
Partial: display only supported clauses in the coach sentence; one scored
section cannot be called the weakest among eight. Show low confidence and
counts; a trend needs at least two observed points. Failed history fetch is
not “inga pass”. Done: a settled practice updates the summary, but does not
reorder controls under the learner or animate numbers while reading.

**Navigation.** Framsteg door → overview; `Historik` → history, including direct
`/historik` entry inside this shell. Drill rows open `/drill?done=…`, repetition
rows `/repetition?done=…`; preserve return location. Mock/diagnostic history
is not included in today's list: offer a labelled link to Provpass for mock
results instead of inventing unified result routes. Section learning links
lead to 12, practice links to 5/6/7/14 as appropriate.

**ADHD-PI and accessibility.** One observation before analytics; activity
expansion is optional and contains no streak-loss message. Charts have an
equivalent text/table reading, discernible labels and focusable inspection
when interactive. Historik uses ordinary links in reading order; tabs use
correct tab semantics only if implementing a tab keyboard model. Samtal's
voice describes evidence briefly, then places the actual records in attachments.

## 12 · Uppslag & lektion — find and read a useful explanation

**Purpose and primary action.** Move from a named section/pattern to reading,
then practice without losing the place. Index primary `Läs KVA` is an example
when a valid suggestion exists; otherwise `Välj sektion` focuses the section
list. Reader primary `Öva detta mönster` when the open entry has resolvable
practice; otherwise `Öva hela KVA` for that section.

**Data.** Available sections, recommendation evidence, section title and scope,
entry count and supplied/derived reading estimate, ordered entries and their
family, optional fields, read marks, bookmark and available example questions.
Trap entries, protocols and word roots need different content structures.
There is no assumption of generated personalised lesson prose.

**Desktop index.** Conversation column with stable section order and a
suggestion above it. Preserve all section doors; mark unavailable content
plainly. Unlike today's ranking-based picker reorder, the proposed index
keeps geography stable and uses the lead suggestion for guidance.

```text
+----------------------+------------------------------------------+
| Idag                 | Uppslag                                  |
| Öva                  | Coach: Vill du läsa om jämförelser?      |
| Provpass             |                              [> Läs KVA] |
| Uppslag (aktiv)      | ORD · rötter      LÄS · frågetyper        |
| Framsteg             | MEK · samband     ELF · frågetyper       |
|                      | XYZ · fällor      KVA · fällor            |
| Konto                | NOG · fällor      DTK · taktiker          |
+----------------------+------------------------------------------+
```

**Phone index.** Same ordering, one readable row per section; no large eight-card
grid pushing the last section far below the fold.

```text
+------------------------------------------------+
| HP-Coach                                Konto  |
| Uppslag                                        |
| Coach: Vill du läsa om jämförelser?             |
| [> Läs KVA]                                    |
| ORD · Rötter                                   |
| LÄS · Frågetyper                               |
| MEK / ELF / XYZ / KVA / NOG / DTK (egna rader)  |
| Idag | Öva | Provpass | Uppslag | Framsteg      |
+------------------------------------------------+
```

**Desktop reader.** Keep the frame; use an opaque document within the main
column. A short coach opening precedes it, then an index of collapsed entry
titles. Expanded entries use plain `.sa-notes` hierarchy, not an endless
conversation. Practice reply follows the active entry; only that action is
primary while the section-wide practice link stays secondary.

```text
+----------------------+------------------------------------------+
| five doors           | [Alla sektioner] · KVA                    |
| Uppslag (aktiv)      | Coach: [kort introduktion]               |
|                      | +--------------------------------------+ |
|                      | | [mönstertitel v]                      | |
|                      | | Kärna / varför / kännetecken         | |
|                      | | Motåtgärd / genomräknat exempel      | |
|                      | | [Fler detaljer] [Markera som läst]   | |
|                      | +--------------------------------------+ |
| Konto                |                       [> Öva detta mönster]|
+----------------------+------------------------------------------+
```

**Phone reader.** Document stays in the page scroll above the tabs. A visible
`Alla sektioner` back control and in-flow practice action leave room for text
spacing and the on-screen keyboard when relevant; no compulsory bottom sheet.

```text
+------------------------------------------------+
| HP-Coach                                Konto  |
| [Alla sektioner] · KVA                          |
| Coach: [kort introduktion]                     |
| +------------------------------------------+  |
| | [mönstertitel v]                          |  |
| | [förklaring, matte och exempel]           |  |
| | [Fler detaljer] [Markera som läst]        |  |
| +------------------------------------------+  |
|                      [> Öva detta mönster]     |
| Idag | Öva | Provpass | Uppslag | Framsteg      |
+------------------------------------------------+
```

**Reuse and additions.** `Coach`, `Replies`, `Divider`, `.sa-doc`, `.sa-notes`,
`.sa-steps`, `--sa-read`, `--sa-doc`, `--sa-r1/r2`. New `ReferenceIndex` and
`LessonDocument` adapt the content order in `LessonReader`, `TrapCard`,
`ProtocolCard`, `LexiconCard`, `ExampleQuestions`, `MarkAsReadPill` and
`SectionPracticeCTA`; reuse math rendering rather than M3 typography.
Traps keep summary, cause, recognition, countermeasure and worked example;
protocols keep their ordered method; ORD roots keep origin, meaning and
example words. Optional fields and further examples disclose progressively.

**States.** Empty section: explain absent material and offer available sections.
Loading: document/heading skeleton, no false “read” marks. Partial: omit absent
optional blocks; unresolved example identifiers do not produce dead practice
links. Keep the lesson usable if bookmark/read-state persistence fails, with
an honest unsaved indication. Done: explicit `Läst` status after the supported
read action; opening or scrolling alone does not equal completion or mastery.

**Navigation.** Uppslag → section reader; 6/10/11 can deep-link to a real
framework entry. Preserve section/hash/bookmark and originating context.
`Alla sektioner` always works; a drill-origin link also offers `Tillbaka till
frågan`. Practice targets section or entry as supported; returning restores
the entry and scroll position, not the top of a long catalogue.

**ADHD-PI and accessibility.** Bounded opening copy, scan-friendly titles,
optional detail and visible reading time. Native disclosures with descriptive
summaries; separate practice buttons from disclosure toggles. Maintain logical
heading levels, accessible math and non-colour read status. The coach frames
a calm Lora document; the teaching material itself is not rephrased as chat.

## 13 · Konto & inställningar — adjust without losing context

**Purpose and primary action.** Make identity and preferences discoverable
from every primary page. Primary `Tillbaka till Öva` is an illustrative return
to the originating door; preferences apply through their supported controls,
not a fictional global Save button. Deep account operations have their own
deliberate subflow and never compete with the normal return action.

**Data.** Available account name/email/plan, current light/dark choice, supported
palette and coach choices, smart/random practice preference, persistence
status, actual tool/help/policy destinations and supported export/deletion
states. Do not invent editable name, billing management or exam-goal forms:
the inspected account route currently describes billing and sign-in management
with informational copy rather than an editable profile.
B3 must replace Samtal's demo Inställningar menu hint “Provdatum och mål”
in `SamtalNav` with copy about supported settings, such as “Tema och övningsval”;
the hint must not suggest exam-date or goal forms that production does not have.

**Desktop.** The existing sidebar footer opens an account disclosure. Its
Konto/Inställningar rows lead to the corresponding section of this single
conversation page. Close the popover once the page opens. Theme/voice choices
are labelled settings rows with reply-shaped controls; one small coach turn
introduces them.

```text
+----------------------+------------------------------------------+
| Idag                 | Konto och inställningar                  |
| Öva                  | Coach: Här ställer du in hur du vill öva.|
| Provpass             | [Konto] [Inställningar]                  |
| Uppslag              | Namn / fullständig e-post / plan         |
| Framsteg             | Tema [Ljust] [Mörkt]                     |
|                      | Coach [val] · Urval [Smart] [Slumpat]     |
|                      | Verktyg / hjälp / policyer               |
| Konto (enda entrén)  |                        [> Tillbaka till Öva]|
+----------------------+------------------------------------------+
```

**Phone.** The sole trigger remains top-right. Its sheet leads to a full
scrolling page for settings/account details, rather than nesting forms in a
small popup. The five-door bar remains present; the return button remembers
the initiating page.

```text
+------------------------------------------------+
| HP-Coach                     Konto (enda entrén)|
| Konto och inställningar                        |
| Coach: Här ställer du in hur du vill öva.       |
| [Konto] [Inställningar]                         |
| Namn · fullständig e-post                      |
| Tema [Ljust] [Mörkt]                            |
| Coach [val] · Urval [Smart] [Slumpat]            |
| [Verktyg] [Hjälp] [Policyer]                   |
| [> Tillbaka till Öva]                           |
| Idag | Öva | Provpass | Uppslag | Framsteg      |
+------------------------------------------------+
```

**Reuse and additions.** Adapt `AccountPopover`, `AccountSheet`, `AccountItems`
inside `SamtalNav`, plus `.sa-menu-item`, `.sa-theme-chips`, `Coach`, `Replies`
and `--sa-card/you/plum-line/r1`. New `AccountPage` and `PreferenceRows`.
Current production `ThemeMode` is **only light or dark**. Samtal's demo
`System` chip resolves a device preference into one of those modes; it is not
a persisted third production mode. B3 should show the two supported modes;
persistent System following remains an owner question. Palette choices may
be described using supplied preferences without silently replacing Samtal's
direction tokens during evaluation.

**States.** Empty identity field: omit or label unavailable; do not invent a
person or email. Loading: skeleton only the pending section. Partial: local
controls remain usable when remote preference status fails, but show “Kunde
inte spara ändringen” where applicable and preserve the intended choice for
recovery. Done: a brief `Sparat` indication only after acknowledgement; no toast
flood per control. Explicit sign-out can finish at the unauthenticated screen;
a prototype must not imply a real sign-out occurred if it only changes view.

**Sensitive existing subflow.** `konto.tsx` actually mounts export and permanent
deletion below the ordinary account content, with export offered first and
exact typed `radera` confirmation. Its header's “NO account deletion” comment
contradicts that implementation. Do not settle that policy conflict through a
redesign: retain the existing deep, guarded flow as the reference, keep it out
of menus and the primary conversation, and flag owner confirmation before a
production port. Samtal's no-text-field rule concerns conversational replies;
it cannot remove a required typed confirmation from an account operation.
No embedded hosted profile is proposed. B0 performs none of these operations.

**Navigation.** Sole account entry → Konto or Inställningar. Existing semantic
destinations remain `/konto` and `/mer`, with explicit return and primary doors.
Tools include Diagnostik, Provpass, Avancerat and Feedback where supported;
help and legal links remain visible. These links are not new screens in this
spec. Account is not a sixth main tab or a duplicate home card.

**ADHD-PI and accessibility.** Settings are a short form with labelled groups,
not a sequence of coach questions. Preserve the chosen value, focus and return
context. Use fieldset/legend and radio or pressed-button semantics; visible
status must not rely on a green tick. Long emails wrap. Dialogs have focus
return and real close controls; plain disclosures must not claim a menu role
without a menu keyboard model. The existing reply-chip vocabulary and one
brief coach introduction keep it Samtal without pretending settings are chat.

## 14 · ELF-läsfråga — read English with Swedish app chrome

**Purpose and primary action.** Read an English passage, answer the supplied
question and examine evidence without losing the reading place. Primary
`Svara`, then `Nästa fråga`/`Slutför texten`; a phone peek uses `Välj ett svar`
until the answer tray is open. They are successive states of one action slot.

**Data.** English passage/title/byline and paragraph structure, actual question
and option language, source/provenance disclosure, question/total position,
selection/elimination, explanation with real paragraph/step references and
completion counts. Include both cloze forms: an empty stem can mean a gap
question, and P5 cloze uses explicit prompts such as “Gap (1)”. Neither means
missing content. Preserve gap numbers and order.

**Fixture coverage.** `elf-b19-003` is the short unit (one paragraph, one
question); `elf-b18-002` is the five-question cloze. Neither matches the
three-paragraph, “Fråga 2 av 4” reading wireframe below. Require a
multi-paragraph ELF reading fixture from the shared kit hpf-qr0p.7, with real
question counts and paragraph references; do not present either existing unit
as coverage of that wireframe.

**Desktop.** Adapt Samtal's current LÄS document/conversation split. English
passage remains a calm opaque Lora document; the coach frame and functional
labels stay Swedish. The source question and answer options retain their
English wording. Never translate assessment content automatically.

```text
+-------------------------------------------------------------------+
| Avsluta                               ELF · Fråga 2 av 4     03:12 |
| +--------------------------------+   Coach: Fråga 2               |
| | ELF · [källans märkning]        |   [English source question]    |
| | [English title]                |          [A English option]    |
| | 1  [English paragraph]         |          [B English option]    |
| | 2  [English paragraph]         |          [C English option]    |
| | 3  [English paragraph]         |          [D English option]    |
| +--------------------------------+         Ditt svar: B [> Svara] |
+-------------------------------------------------------------------+
```

**Phone.** Passage first, the existing peek/open/full tray sequence. A citation
folds the tray, reveals the paragraph, and leaves `Tillbaka till förklaringen`
visible. Reopening restores explanation folds, scroll and focus. The final
paragraph remains scrollable above the peek in every state.

```text
+------------------------------------------------+
| Avsluta               ELF · Fråga 2 av 4       |
| ELF · [källans märkning] [Om texten]            |
| [English title]                                |
| 1  [English paragraph]                         |
| 2  [English paragraph]                         |
| +------------------------------------------+  |
| | Coach: Fråga 2                            |  |
| | [English source question, fully wrapped]  |  |
| |                       [> Välj ett svar]   |  |
| +------------------------------------------+  |
+------------------------------------------------+
```

**Reuse and additions.** Adapt `SamtalDrill`, `DocPanel`, `QuestionConversation`,
`YourAnswer`, `Verdict`, `Explanation`, `Closing`, `Cites`, `Rich`, `.sa-para`,
`.sa-ev`, `--sa-read/doc/mark/mark-2`. New `EnglishDocument` is a content and
language variant, not a second reading engine. The current drill hardcodes
LÄS, its fixture title and A–D dock hint; remove those assumptions in the
future adapter. The same actual-options rule as 6 applies.

**Language contract.** The root stays `lang="sv"`. Set **`lang="en"` on the
English passage container**, including title/byline, and on English question
and option text spans. Keep Swedish option labels and controls outside those
spans. Mark English quoted evidence inside Swedish feedback locally. This
markup is **new work**: no English `lang` markup was found in `app/src` at the
baseline. English hyphenation follows the local language rather than Swedish
rules. Do not mark the whole tray English when its controls are Swedish.

**States.** Empty: distinguish a missing passage from legitimate cloze forms
(an empty stem or an explicit P5 “Gap (1)” prompt); unavailable essential content
offers `Till Öva`. Loading: reserve the
document and question, no interactive phantom options. Partial: absent
explanation/citations do not block verdict and next; do not fabricate ¶ links.
Done: actual text/question counts and a single plan continuation or `Till Öva`.
For synthetic content, retain the approved ÖVNINGSTEXT disclosure and estimate
caveat from the shared source, once; authentic content does not receive that
badge just because the design began with the synthetic LÄS fixture.

**Navigation.** 5's ELF entry, saved reading session, scoped lesson practice or
ELF in repetition → this composition. Practice exit returns to its initiating
context. When inside 9, reuse reading/answer layout but remove immediate
feedback/reflection and use the timed pass controls. A citation never opens a
new route or discards the selected answer.

**ADHD-PI and accessibility.** Keep the whole question visible; no ellipsis
peek, no forced reflection. `Visa allt` exposes explanation detail immediately.
Optional paragraph focus must leave a readable way to inspect other paragraphs;
test its contrast instead of assuming the existing dimming passes. Correctness
uses a word and glyph. Screen-reader checks must confirm the language switch,
cloze gap labels and focus return; touch needs labelled paragraph/next-previous
focus controls equivalent to F/J/K if paragraph selection is retained. The
English document stays steady while Swedish coach turns and plum replies
continue Samtal's established conversation.

## Batch inventory and acceptance handoff

Names in this table are proposed presentation units. Extract a shared part once
and agree its behavior before another batch consumes it. Keep data loading and
session mutation in the shared-data integration; no batch should fork the
question bank or hardcode a second set of round-1 counts.

| Batch | Screens | Reuse/adapt | New responsibilities |
| --- | --- | --- | --- |
| B1 | 5–8 | Frame/parts, question/options/dock, feedback/closing, math and figure behavior | `PracticeDoors`, `RepetitionSummary`, `RepetitionOverview`, `QuestionConversation`, `QuantAttachment`, `FigureDocument`. Establish actual-option handling, submit-versus-select boundary, loading/error/partial states and return context. |
| B2 | 9–11 | B1 question/document presentation, frame, Home score/footnote, feedback notes | `PassOffer`, `PassConfirm`, `TimedConversation`, `AnswerOverview`, `PassReport`, `SectionResultRows`, `PacingRows`, `ProgressConversation`, `SectionLedger`, `TrendAttachment`, `HistoryList`. Timed mode must explicitly exclude practice feedback. |
| B3 | 12–14 | Frame/account disclosure, B1 conversation/document, existing lesson content and Samtal reading tray | `ReferenceIndex`, `LessonDocument`, `AccountPage`, `PreferenceRows`, `EnglishDocument`. Preserve supported settings and lesson navigation; add language boundaries and cloze-aware content. |

Each build batch should supply its desktop/phone and light/dark evidence at
1440 × 900 and 390 × 844, plus narrow/zoomed and text-spacing checks. Include
loading, empty, partial/error and done examples, not only the populated happy
path. Check one primary per state, exactly one account launcher per primary
layout, all five destinations, visible exits and no dead return links.

Exercise long KVA/NOG math, NOG's E option and the five supplied options of
XYZ `host-ver2-2019-kvant1-XYZ-002` (no hard-coded A–D), raster DTK zoom/rotation and a
same-figure next question; interruption/resume with honest save state; timed
answer revision, blank-answer overview, early submit, timeout and settlement
failure; incomplete-pass scoring and a missing normering table; sparse progress
and real history targets; absent lesson examples; settings persistence failure;
and English passage/option pronunciation plus citation return. Contrast,
keyboard behavior and screen-reader output require verification in the build;
this document does not claim they passed already.

## Open questions for the owner

1. **Persistent System theme:** should it become a supported preference?
   Recommended baseline: light/dark only; the demo's System chip is not proof
   of production support. Persistent following needs its own accepted contract.
2. **Account deletion policy conflict:** confirm that the deep export-first,
   typed-confirmation flow currently rendered in `/konto` remains intended.
   Recommended: preserve its location and safeguards; do not add it to menus
   or remove it based solely on the stale header comment.
3. **Figure alternatives:** who supplies equivalent text/tables for raster DTK
   material? Recommended: use verified supplied descriptions/data and flag
   missing equivalents; never invent chart readings to fill this gap.
4. **Personal targets and unified history:** are editable goals and combined
   drill/mock/diagnostic history part of a later product scope? Recommended:
   retain supplied target semantics and the existing supported report links
   for this round, with mock results reachable through Provpass.
5. **First-open source disclosure:** should the approved ÖVNINGSTEXT note open
   automatically on first encounter? Recommended: open once on first encounter,
   keep the badge and `Om texten` available thereafter, and preserve reading
   position. This is a proposal, not an existing persisted preference.

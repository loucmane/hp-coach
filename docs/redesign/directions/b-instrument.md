# Instrument — round 2 screen specification

Bead: `hpf-qr0p.34` · B0 · 2026-10-19 · design handoff, not an owner approval.
Source baseline: `b777074def8517fb7a3053fb103524a6eb57ba90`.

Instrument turns practice into a precise, quiet workspace. Its signature is a
grey chassis containing inset, ruled panels: readable work in the middle,
labelled measurements at the edges, and one signal-orange next action. Screens
5–14 must look like extensions of the existing Instrument, including in dark
mode and with the accent removed from a thumbnail.

This document covers B1 (5–8), B2 (9–11), and B3 (12–14). It describes data in
plain language; `hpf-qr0p.7` owns the shared data view model. Numbers in wireframes
are illustrative states, not new fixtures or computed facts. Future builders
must bind them to the shared model and its selected question content. Component
names marked **new** below are proposals, not existing exports. This handoff
does not authorize changes to production routes, persistence, or account policy.

## Source map and constraints

Paths below are relative to the repository root.

| Source | What this specification takes from it |
| --- | --- |
| `app/src/components/devbake/redesign/b-instrument/{meta.ts,Instrument.tsx,InstrumentHome.tsx,InstrumentDrill.tsx,parts.tsx,instrument.css}` | Actual identity, tokens, shell, key map, panels, question/feedback flow, phone sheet and completion illustration. |
| `docs/redesign/2026-10-round1-brief.md` | Shared five-destination IA, reading measure, ADHD-PI priorities, contrast and interaction bar. The latest bead extends all directions; the older brief's winner-selection plan is historical. |
| `docs/worklog/hpf-qr0p.md`, especially “B · Instrument” and “Side by side” | Preserve the chassis/panel distinction; avoid equal-weight cards, faint greys, cramped feedback, hidden elimination, clipped phone questions and duplicate progress. |
| `app/src/routes/ova.tsx`, `drill.tsx`, `repetition.tsx`; `app/src/components/drill/` | Eight sections, direct-start doors, queue semantics, question variants, missing content and progressive explanation. |
| `app/src/components/MathText.tsx`, `app/src/lib/nogPrompt.ts`, `app/src/components/drill/KvaPrompt.tsx`, `QuestionFigure.tsx` | Preserve math rendering, sufficiency statements, quantity labels, source figures, rotation and zoom behavior without importing the production visual chassis. |
| `app/src/routes/prov.tsx`; `app/src/components/mock/{ConfirmSheet,MockRunner,MockResult}.tsx` | Pass choice and exposure, explicit start gate, 55-minute clock, editable answers, submission, incomplete passes and score provenance. |
| `app/src/screens/ProgressMobile.tsx`, `app/src/routes/historik.tsx` | Estimates, uncertainty, weekly activity, section evidence, and completed drill/repetition links. |
| `app/src/routes/lektion.tsx`; `app/src/components/lesson/` | Section index, three content families, read marks, example questions, framework links and return paths. |
| `app/src/routes/konto.tsx`, `mer.tsx` | Identity, appearance, coach voice, question selection, tools and account-state limits. |
| `app/src/components/devbake/ovningstextFixtures.ts`, `redesign/r1Fixtures.ts` | Existing P5 text disclosure, estimate caveat, and genuine ELF reading/cloze specimens. |

## Common Instrument contract

### Tokens, type and composition

Keep the existing scoped `--in-*` tokens under `[data-rd='instrument']`. Do not
bring in the production M3 frame, global palettes, a second font system, or
unscoped CSS. No new colour tokens are needed for these screens.

| Role | Existing token and light value | Dark value / usage |
| --- | --- | --- |
| Chassis | `--in-chassis: oklch(91.6% 0.0035 85)` | `oklch(13.8% 0.003 85)`; frame, sidebar, top and status strips. |
| Work surface | `--in-bg-1: oklch(99.3% 0.0015 85)` | `oklch(21.4% 0.003 85)`; always opaque. |
| Internal surface | `--in-bg-2`, `--in-bg-3` | Existing toned cells and selected/secondary wells; no floating card grid. |
| Readable text | `--in-text`, `--in-text-2` | Body and necessary secondary text; `--in-text-3` must not carry essential instructions. |
| Primary action | `--in-accent: oklch(69.5% 0.172 46)` with `--in-on-accent` | `oklch(74% 0.158 52)` with its existing dark foreground. Use `--in-accent-text` for coloured text and `--in-accent-ui` for focus/selection. |
| Structure/state | `--in-edge`, `--in-stroke[-2]`, `--in-ok`, `--in-bad`, `--in-warn` | Edges and semantic states; colour is accompanied by a word, glyph or outline. |

Reuse Geist (`--in-ui`) for headings, labels and controls; Geist Mono
(`--in-mono`) for numbers, clocks, keycaps and short panel heads; Atkinson
Hyperlegible Next (`--in-read`) for passages, problem prose, options and
explanations. Preserve the 12/13/14/16/18.5/22/28/40 px type scale. Necessary
secondary prose starts at 13 px. Reading passages use 18.5 px desktop and
17.5 px phone, line height about 1.55, with 55–70 characters per desktop line.
Long lesson prose uses the same reading treatment. Do not shrink formulae,
table labels or answer text to make a layout fit.

The 4 px spacing grid and radii `--in-r1/r2/r3` (4/6/8 px) remain. Panels have
1 px edges (`--in-panel`), internal cells use rules, controls can use the crisp
key bevel (`--in-chip`). No soft card shadows, gradients or pills. Use the
existing 90 ms entry / 60 ms exit and `--in-ease`; no animated reading content,
shimmer or count-up. Existing citation emphasis can fade longer; new navigation
and feedback motion must not inherit that duration. Reduced motion makes
transitions effectively instant and citation scrolling immediate.

### Shell, navigation and sizing

- Desktop review target: 1440 × 900. Reuse the 232 px sidebar / 64 px folded
  rail, 52 px top strip, inset main panel and 36 px status strip. Hub content
  uses 24–32 px internal padding, panel gaps 8 px. Data tables may be dense;
  their interactive rows still have at least 44 px targets.
- Phone review target: 390 × 844, also check 320 CSS px and enlarged text.
  Keep the chassis-grey top bar with the account entry and the five labelled
  bottom destinations. Use 8 px outer panel insets and 16 px inner padding.
  Content scrolls above bottom controls with safe-area clearance. At larger
  text sizes, controls and rows wrap; fixed heights must not clip words.
- Non-drill screens always expose **Idag · Öva · Provpass · Uppslag · Framsteg**.
  Historik is inside Framsteg; Repetera inside Öva. Konto and Inställningar are
  reachable from the sidebar footer or phone avatar on every primary screen.
  In wireframes, `[navigation]` means all five labelled destinations, not a
  proposed generic menu button. A collapsed rail keeps accessible labels and
  focus tooltips.
- Focus work (6, 7, active 8, running 9, 14) keeps an explicit exit and one
  labelled progress source. The visible exit opens any required confirmation;
  Escape never silently abandons work. Practice can retain a dim rail; timed
  provpass cannot offer an unguarded navigation escape.
- Two-pane work at 1440 uses the existing resizable gap, question panel
  360–640 px (initially about 452 px). Feedback occupies that panel, around
  520 px where space permits. A third inspector is allowed only at ≥1680 px
  **and** if the source content retains its readable measure. Stack below that
  fit threshold; never force horizontal page scrolling. At intermediate widths,
  fold the rail before sacrificing content width.
- New phone question sheets follow the existing `peek / open / full` behavior,
  with labelled buttons as well as a grip. A peek must show the complete prompt.
  If it cannot fit, open the scrollable sheet instead of truncating it. Reserve
  enough trailing space to scroll the underlying text/figure clear of the sheet.
- Changing destinations moves focus to the new main heading; returning restores
  the originating row, filters and scroll position. For an unavailable return
  target, use its parent hub. Every route has a visible parent/exit control.

### Input, truthfulness and feedback

Keep current Instrument shortcuts rather than the older brief's proposed
numeric map. `A` through the last actual option select; `Shift` + that letter
strikes/undoes; `Enter` submits the selected practice answer, then advances in
feedback. `J/K` moves paragraph focus where paragraphs exist, `F` toggles focus,
`X` opens/closes an available explanation. The bake-off owns digit shortcuts.
Hubs can use the existing up/down command-list selection and Enter activation.
Keep G-sequences, Ctrl/⌘ K and Ctrl/⌘ B where applicable. Show only shortcuts
that work in the current state; hide hints on touch, keep visible controls.
Do not intercept typing, text selection, modal controls or browser shortcuts.
Timed-pass input has its own contract in screen 9.

The one primary action is a role, not a requirement for an orange button in
every state. It changes with the task phase. Secondary links and row actions
remain neutral. Do not place a second orange action inside an inspector.

For practice feedback, preserve Instrument's order: verdict with word and glyph,
question, chosen and correct answers in full; the chosen distractor's “Varför
det lockar / Varför det är fel”; “Teknik” and “Fallgrop” where available;
“Lösningen”; essential steps, expandable detail steps; other distractors behind
disclosure. Wrong answers open explanation; correct answers offer “Visa
förklaringen”. Quant steps use math; reading steps link to actual paragraph
evidence. Missing detail is omitted or labelled unavailable, never generated by
the UI. A missing explanation cannot prevent advancing after a valid answer.

Keep absent, loading, zero, stale and failed data distinct. The status strip may
say “Sparat” only when the relevant state is confirmed; the bake-off must not
claim cloud persistence for a local demonstration. A partial error occupies its
own cell, not an empty full-page reset. No fake certainty, default zero scores,
invented sparklines or fabricated “weakest section”.

All new controls need visible 2 px focus rings with 2 px offset and ≥44 px hit
areas; a drawn small key may have a larger hit box. Body contrast ≥7:1 and UI
contrast at least AA are acceptance targets to measure on the rendered screens,
not claims proved by this document. Tables need headers; charts need a text or
table alternative. Modal overlays need a name, contained focus, background
inertness, Escape/close and focus restoration. A nonmodal phone peek must not
trap focus. Reserve live announcements for state changes, not every clock tick.

## Screen 5 — Öva

**Purpose and primary action.** Start a useful practice block with no setup
maze. Default emphasis goes to **“Fortsätt övningen”** for a resumable drill;
otherwise **“Öva KVA”** for an evidenced recommendation, or **“Starta blandad
övning”** when no recommendation exists. These are mutually exclusive lead
states, not three hero buttons. Each section row remains a direct-start door.

**Data shown.** The eight section codes and full names, available question
content, a valid recommendation with its reason, active practice position,
today's repetition pile per section and total, and the number ready now. Copy
“3 redo nu · 7 i dagens hög” is used only when the counts differ. The nav badge
and section “väntar” counts refer to the same pile; neither pretends to be the
number replayable now. Estimated duration appears only when supplied.

**Desktop layout.** One inset panel: a selected lead row, a ruled section
directory and a full-width Repetera band. Group the directory under Verbal and
Kvantitativ without making eight equally weighted cards.

```text
+--------------+---------------------------------------------------+
| [navigation] | Sök eller hoppa...                 Konto           |
| Öva aktiv    +---------------------------------------------------+
|              | ÖVA                                               |
|              | Fortsätt: KVA · fråga 3 av 10   [Fortsätt övningen] |
|              +-------------------------+-------------------------+
|              | VERBAL                  | KVANTITATIV             |
|              | ORD  Ordförståelse  >   | XYZ  Problemlösning  >  |
|              | LÄS  Läsförståelse  >   | KVA  Jämförelser     >  |
|              | MEK  Komplettering >   | NOG  Datasufficiens >  |
|              | ELF  Engelska      >   | DTK  Diagram m.m.   >  |
|              +-------------------------+-------------------------+
|              | Blandad övning                                 >  |
|              | REPETERA  3 redo nu · 7 i dagens hög [Repetera 3]  |
+--------------+---------------------------------------------------+
| Upp/ned välj · Enter öppna                       status          |
+------------------------------------------------------------------+
```

**Phone layout.** Lead first, two labelled groups of full-width rows, Repetera
in the same stable position below. Each row includes its count as a trailing
readout or wrapping second line; keep full section names readable.

```text
+----------------------------------+
| HP   Öva                  [Konto]|
| Fortsätt: KVA · 3 av 10          |
| [Fortsätt övningen]              |
| VERBAL                          |
| ORD  Ordförståelse           >  |
| LÄS / MEK / ELF: egna rader      |
| KVANTITATIV                     |
| XYZ / KVA / NOG / DTK: rader     |
| Blandad övning               >  |
| REPETERA                        |
| 3 redo nu · 7 i dagens hög       |
| [Repetera 3]                    |
| [navigation: Öva aktiv]         |
+----------------------------------+
```

**Reuse / new.** Reuse `InstrumentFrame` shell, `Readout`, `Kc`, `DEST_ICONS`,
`.in-cmds`, `.in-cmd-row`, `.in-code`, `.in-cell-head`, `.in-btn` and neutral
buttons. **New:** `InstrumentPracticeHub`, `SectionDirectory`, `ReviewQueueBand`.
These use chassis/background/stroke tokens and tabular readouts; the orange lead
is separate from the neutral Repetera action when a resume is primary.

| State | Required behavior |
| --- | --- |
| Empty | All eight doors and Repetera remain. “Ingen övning än. Börja med en blandad övning.” No weakness badge or fabricated score. Confirmed empty review queue gets an explanatory sentence. |
| Loading | Directory labels are already present; static placeholders reserve count slots. A pending queue is not “Kön är tom”. Start only when the needed content is ready. |
| Partial data | Let available sections start while unavailable stats show “Statistiken kunde inte hämtas”. Unknown queue counts show an em dash and explanation. Known unavailable question content disables only that section, with a reason. |
| Ready | Lead action and all direct-start rows work. Repetera starts at most the available batch, currently capped at 10. |
| Done | Returning from a finished block updates counts and the lead row without moving the section directory; announce the change once. |

**Navigation.** Enter via Öva, Idag's plan, or a completed drill. Section doors
preserve `/drill?section=…&start=1` intent; mixed preserves `mixed=1`. Repetera
preserves `/repetition?start=1`, with optional section. A direct Repetera visit
can show its idle state. The bake-off maps these intentions inside Instrument
instead of ejecting to the production UI. All five destinations and account
remain available here.

**ADHD-PI and accessibility.** Keep section order stable during the visit; a
late recommendation may add a label, never reorder a focused row. Use real
buttons/links rather than a clickable container containing nested controls.
Each count has a spoken meaning. All eight sections are reachable by ordinary
Tab/touch without memorizing shortcuts.

**Unmistakably Instrument.** The section directory is a ruled command surface,
with square code chips and aligned numeric slots. It continues Idag's command
list instead of becoming a colourful course catalogue.

## Screen 6 — Kvantfråga: XYZ, KVA and NOG

**Purpose and primary action.** Solve the current quantitative problem. In
practice, select an option, then **“Svara B”**; in feedback the same action slot
becomes **“Nästa fråga”**, or **“Avsluta övningen”** at the end. Selection alone
does not grade in Instrument's practice interaction.

**Data shown.** Section, question position and total, full prompt with math,
optional source figure, actual answer options including any option images,
selection/elimination, elapsed time, and post-answer explanation. XYZ keeps the
supplied options. KVA keeps four fixed comparisons, A: quantity I larger,
B: quantity II larger, C: equal, D: insufficient information. Show their full
Swedish source wording, not just “I > II”. NOG keeps all five sufficiency choices
A–E and labels statements `(1)` and `(2)` separately; these are evidence, not
answers to select. Preserve the source option ordering and wording.

**Desktop layout.** Inset problem panel left; answer panel right. KVA has an
optional condition then distinct “Kvantitet I” and “Kvantitet II” rows. NOG has
stem then two numbered statements and its linking sentence. XYZ uses natural
problem flow. Optional diagrams sit with the problem, not squeezed into options.

```text
+--------------------------------------------------------------------+
| Öva / KVA · fråga 3 av 10       tid 02:14  [Fokus] [Avsluta]         |
+------------------------------------+-------------------------------+
| UPPGIFT                            | SVAR                          |
| Villkor                            | A  [full jämförelse]    [Stryk]|
| b = a + 1                          | B  [full jämförelse]    [Stryk]|
| ---------------------------------  | C  [full jämförelse]    [Stryk]|
| Kvantitet I                        | D  [full jämförelse]    [Stryk]|
| [uttryck med matematik]             |                               |
| Kvantitet II                       |                               |
| [uttryck med matematik]             | [Svara B]                     |
+------------------------------------+-------------------------------+
| A-D välj · Shift+bokstav stryk · Enter svara · F fokus               |
+--------------------------------------------------------------------+
```

**Phone layout.** A single scrolling problem/answer panel, not an unnecessary
reading sheet for a short equation. Keep the condition and both quantities in
reading order; allow scrolling before the five long NOG options. The bottom
action reserves its own space and never covers the last option.

```text
+----------------------------------+
| [Avsluta] KVA 3 av 10     02:14  |
| UPPGIFT                         |
| Villkor                         |
| Kvantitet I                     |
| [uttryck]                       |
| Kvantitet II                    |
| [uttryck]                       |
| A [full text]           [Stryk] |
| B [full text]           [Stryk] |
| C [full text]           [Stryk] |
| D [full text]           [Stryk] |
| [Svara B]                       |
+----------------------------------+
```

**Reuse / new.** Reuse/extract `TopBar`, `FocusChrome`, `Timer`, `Options`,
`AnswerSummary`, `Explanation`, `StatusBar` and `Done` from InstrumentDrill;
reuse `Segs` for a sequential short drill. These helpers currently live inside
that file and are tied to the LÄS fixture, so they need explicit content inputs.
Reuse `MathText` rendering and `splitKvaPrompt` / `parseNogPrompt` semantics;
the production `KvaPrompt`/`DrillQuestion` styles are not Instrument components.
**New:** `InstrumentQuantQuestion`, `QuantityRows`, `StatementRows`, math-capable
answer content. Use `--in-read`, `--in-bg-1`, `--in-r1`, state tokens and the
existing option borders.

| State | Required behavior |
| --- | --- |
| Empty | “Frågan är inte tillgänglig” with “Till Öva”; no zero-option question or enabled submit. |
| Loading | Reserve problem/figure/answer regions; exit stays usable. Selection remains unavailable until the question is complete. |
| Partial data | Unsplit KVA/NOG text renders intact through MathText instead of silently dropping a condition. Missing required figure/option prevents answering; missing optional explanation does not remove the verdict. State “Förklaring saknas för den här frågan”. |
| Answered | Correctness is word + glyph; freeze the graded choice. Convert the right panel into feedback; no forced third panel. Maths also render in explanations and answer summaries. |
| Done | Show actual answered/correct totals and one continuation to the next plan item, or “Till Öva” if absent. Never manufacture a next plan. |

**Navigation.** Enter from screen 5, a lesson example, repetition, or history
review. Preserve the originating section/framework and return target. “Avsluta”
leaves for that target through the existing session behavior. Saved-result
review is read-only and has “Tillbaka till Historik”, not a new answer submit.
Mock use of the same visual body follows screen 9's different answer semantics.

**ADHD-PI and accessibility.** The comparison and statements stay in view as
conceptual groups; no motivational blocks compete with the problem. Option
striking is always visible and reversible. Do not add “E eliminate”: E is a
real NOG answer. Preserve math semantics and test spoken names: current MathText
uses `role="math"` and flattened text, not structured MathML, so reuse alone is
not proof of equivalent screen-reader comprehension. Keep fractions/unary minus
legible at zoom; use a local scroll region for an irreducibly wide equation.

**Unmistakably Instrument.** The condition/quantity/statement cells resemble a
clear measurement sheet inside the chassis. The answer letters remain square
keys, with a single decisive submit control and a phase-specific status line.

## Screen 7 — DTK: diagram, table or map

**Purpose and primary action.** Read the source accurately, then answer the
current question. Primary is **“Svara C”**, becoming **“Nästa fråga”** after
feedback. “Förstora figur” is a prominent neutral utility, never a hidden hover
affordance.

**Data shown.** The original figure asset with dimensions/aspect, its supplied
title/caption and description, current question and real answer options, and
position within a group using the same figure. Example: “Fråga 2 av 4 · samma
sida” is local figure-group position; session position belongs in the top bar.
Show chart units, legend and source footnotes as part of the source, not a
redrawn approximate chart. Option figures are first-class answer content.

**Desktop layout.** Give the figure the larger left panel. Fit it without
cropping; allow a local viewer for detail. The right question panel changes to
feedback in place. In a figure group, keep the viewer's zoom/pan/rotation and
the figure itself stable while moving to the next question.

```text
+--------------------------------------------------------------------+
| Öva / DTK · fråga 6 av 10      08:12       [Fokus] [Avsluta]        |
+------------------------------------------+-------------------------+
| UNDERLAG  [Förstora figur] [Rotera]       | FRÅGA                   |
|                                          | [hela frågan]           |
| [originaldiagram / tabell / karta]        | A [...]         [Stryk] |
| [axlar, enheter, legend och källa]         | B [...]         [Stryk] |
|                                          | C [...]         [Stryk] |
| 2 av 4 frågor · samma sida                | D [...]         [Stryk] |
|                                          | [Svara C]               |
+------------------------------------------+-------------------------+
| A-D välj · Enter svara · F fokus                         status     |
+--------------------------------------------------------------------+
```

**Phone layout.** Source first, full content width inside its panel. Question
in the existing edge-to-edge Instrument sheet with grey head strip. Opening
the figure viewer temporarily covers the sheet; closing restores its state
and the source position, without choosing or submitting an answer.

```text
+----------------------------------+
| [Avsluta] DTK 6 av 10     08:12  |
| UNDERLAG                        |
| [originalsidan, proportionellt]  |
| [Förstora figur] [Rotera]        |
| 2 av 4 frågor · samma sida       |
+----------------------------------+
| FRÅGA 6 AV 10                   |
| [hela frågan]                   |
| [Visa alternativen 4]           |
| -- öppet: alternativ + Svara -- |
+----------------------------------+
```

**Reuse / new.** Reuse Instrument's `Split`, phone sheet, answer/feedback
pieces, `Kc`, `Timer` and panel tokens. `QuestionFigure` is a behavior reference
for aspect reservation, SVG/raster rendering and modal controls, not a
drop-in skin: it uses production tokens and portals. **New:**
`InstrumentFigureWorkspace`, `FigureGroupReadout`, `InstrumentFigureViewer`.
Keep any portal's Instrument theme scope intact. Original raster pages keep
their original opaque white background in dark mode; do not invert chart data.

| State | Required behavior |
| --- | --- |
| Empty | Missing required source: “Underlaget saknas. Frågan kan inte besvaras här.” Offer return to Öva; do not grade a guess caused by missing evidence. |
| Loading | Reserve the source aspect ratio, show “Laddar underlaget”, keep exit. Disable submit until required source and options are ready. |
| Partial data | Figure fetch failure gets explicit retry/return controls in this proposed viewer. A missing text alternative is a content gap, not “Figur” passed off as an equivalent; flag it for the owner. Available feedback stays readable if an optional explanation is absent. |
| Answered | Keep the figure visible while the right panel/sheet becomes feedback. Refer to real labels/rows/axes; do not invent paragraph citations or highlights on an unmapped raster. |
| Done | Group completion advances to the next actual group or session end. Reset viewer position only when the source changes. |

**Navigation.** Enter from DTK in Öva, relevant lesson, review or a mock pass.
“Stäng figur” returns to the exact question; “Avsluta” exits the session as in
screen 6. Zoom is not a new top-level destination. If the next question shares
the figure, only the question changes.

**ADHD-PI and accessibility.** Keep stable source context between related
questions; no pan/zoom reset on answer selection. Expose labelled zoom-in,
zoom-out, fit, rotate and close buttons plus keyboard-operable scrolling; pinch
and drag are optional. A readable table alternative must preserve row/column
headers and units when supplied. Figure alternatives must describe the problem
data without revealing the answer. Modal focus returns to “Förstora figur”.

**Unmistakably Instrument.** A docked inspection workspace with compact
readouts and square tool keys; the chart remains the student's evidence, not
an ambient illustration or another floating card.

## Screen 8 — Repetera

**Purpose and primary action.** Revisit ready mistakes in a bounded block.
Primary is **“Repetera 3”** (actual ready batch, up to 10), then the usual
practice submit/next action. When nothing is ready, **“Öva istället”** replaces
the inactive start action. Completing a batch is different from clearing the
entire queue.

**Data shown.** Ready-now count, today's pile, optional section scope, actual
batch size, current/recovered position, replay questions, graded answers and
confirmed queue updates. Preserve oldest-first selection as provided by the
existing replay logic; do not add an independent urgency ranking. Do not show
a due time unless one is available.

**Desktop layout.** Direct visits get one sparse queue panel with the batch
action and a few section rows. Hub direct-start visits bypass that idle panel.
Active review uses the appropriate quant, DTK or reading workspace with
“Repetera” in the breadcrumb, not another question renderer.

```text
+--------------+---------------------------------------------------+
| [navigation] | Öva / Repetera                         [Konto]    |
| Öva aktiv    +---------------------------------------------------+
|              | REDO NU  3       DAGENS HÖG  7                    |
|              | Repetera 3 frågor · de äldsta först               |
|              | [Repetera 3]                                     |
|              +---------------------------------------------------+
|              | KVA   2 redo nu                               >  |
|              | ELF   1 redo nu                               >  |
|              | Resten blir redo senare.                         |
|              | [Till Öva]                                       |
+--------------+---------------------------------------------------+
| Enter starta                                          status     |
+------------------------------------------------------------------+
```

**Phone layout.** Same queue band, no extra filtering step before starting.
The active state uses screen 6's stacked problem or screen 7/14's source-first
sheet. Completion returns to a calm summary, not a streak interstitial.

```text
+----------------------------------+
| HP   Repetera             [Konto]|
| [Till Öva]                      |
| 3 redo nu · 7 i dagens hög       |
| De äldsta först                 |
| [Repetera 3]                    |
| KVA  2 redo nu               >  |
| ELF  1 redo nu               >  |
|                                 |
| -- efter blocket --             |
| Repetitionen är klar            |
| 2 av 3 rätt                     |
| [Till Öva]                      |
| [navigation: Öva aktiv]         |
+----------------------------------+
```

**Reuse / new.** Reuse `ReviewQueueBand`, `Readout`, the B1 question workspace,
Instrument feedback and `Done`/`Landscape` composition. **New:**
`InstrumentReview` orchestration and a queue-change receipt. Use neutral count
cells and `--in-ok/--in-bad` only for actual answer outcomes, not queue size.

| State | Required behavior |
| --- | --- |
| Empty | First visit: “Inga missar än — när du svarar fel i en övning landar frågan här.” Ready zero with pile remaining: “Inget är redo just nu”; do not claim everything learned. “Öva istället” remains actionable. |
| Loading | Queue slots show pending state; no enabled start from an unresolved queue. |
| Partial data | Resolve only playable questions; state the actual offered batch size. If a resumed queue was pruned because items were resolved elsewhere, explain “Kön har uppdaterats”; never restart at question 1 invisibly. Fetch failure is “Kön kunde inte hämtas”, not an empty queue. |
| Answered | Correct answers follow the existing resolution behavior; wrong answers remain subject to the existing schedule. Keep any update-pending/error message beside the queue status; do not assert an item is removed before confirmation. |
| Done | “Repetitionen är klar” with answered/correct counts. State remaining ready items separately. Offer one next action: another ready block when requested, otherwise “Till Öva”. |

**Navigation.** Öva's Repetera door and section-specific ready rows enter this
flow; explicit `/repetition` may start at idle. A completed-history entry
reopens its saved summary, not a new queue. Active exit returns to Öva or the
recorded parent; completion supports the existing `done` permalink intention.
Keep `qid` navigation and the finished result distinct.

**ADHD-PI and accessibility.** Bound the commitment to the current batch; never
present the entire pile as a debt to clear today. Keep the location of Repetera
stable even when empty. Announce queue changes once, and use native controls
for section-scoped starts. Active question accessibility follows its actual
content type, including English language marking for ELF.

**Unmistakably Instrument.** A small queue readout that opens the familiar
workbench; the same instrument status strip tells the learner what is ready,
what is selected and what has actually been saved.

## Screen 9 — Provpass: hub, start gate and running pass

**Purpose and primary action.** Choose a pass deliberately, then finish it under
its stated conditions. Hub primary: **“Välj föreslaget pass”**, opening the start
gate rather than starting the clock. Gate primary: **“Starta nu”**. Running
primary: **“Lämna in”**. Answer selection saves a revisable choice; there is no
practice-style “Svara” or per-question verdict in this mode.

**Data shown.** Riktigt/Genererat, Verbal/Kvantitativ, available sitting and pass,
actual presented-question count, previously seen count, proposed pass and reason,
and section composition. The nominal pass is 40 questions in 55 minutes; an
incomplete source must state its actual count before start. Verbal composition
is ORD/LÄS/MEK/ELF 10 each; quantitative is XYZ 12, KVA 10, NOG 6, DTK 12.
Do not turn a partial corpus into an apparently complete 40-question pass.
Running data includes current position, editable answers, unanswered total,
section boundaries, elapsed/remaining time derived from the original start,
and submission state.

**Desktop layout.** The hub is a pass register with one selected lead row and
a quiet mode/half control band. The gate names the exact selected pass and its
conditions. Running mode replaces the hub with a question workspace and a
compact answer navigator; it does not keep a second progress strip duplicating
all 40 cells. For long passages/DTK, put that navigator in a collapsible drawer
instead of reducing the source's readable width.

```text
+--------------+----------------------------------------------------+
| [navigation] | PROVPASS                                  [Konto] |
| Provpass     | [Riktigt pass | Genererat pass] [Verbal | Kvant]   |
| aktiv        +----------------------------------------------------+
|              | FÖRESLAGET PASS                                    |
|              | [provtillfälle / pass] · 40 frågor · 55 min        |
|              | Sett 4 av 40 tidigare   [Välj föreslaget pass]     |
|              +----------------------------------------------------+
|              | PROVTILLFÄLLE        PASS 1          PASS 2       |
|              | [datum]              [Välj]          [Välj]       |
|              | [datum]              [Välj]          saknas       |
+--------------+----------------------------------------------------+

Start gate: [valt pass, antal, villkor] [Inte nu] [Starta nu]

+-------------------------------------------------------------------+
| PROVPASS · KVA 14 av 40    31:08 kvar   [Avsluta] [Lämna in]       |
+--------------------------------------+----------------------------+
| UPPGIFT / TEXT / UNDERLAG             | SVAR                       |
| [content-specific workspace]         | A [...]  B [...]           |
|                                      | C [...]  D [...]           |
|                                      | [Föregående] [Nästa]       |
+--------------------------------------+----------------------------+
| [Frågeöversikt: 13 besvarade, 27 obesvarade]                        |
| A-D välj · vänster/höger byt fråga                    sparstatus   |
+-------------------------------------------------------------------+
```

**Phone layout.** Register rows open the same deliberate gate. Running mode
has a persistent clock, exit and submission control; the grid is a named
disclosure/sheet, five cells per row at ≥44 px, not 40 tiny tap targets crammed
across the phone. Questions use the matching B1/B3 body without its grading UI.

```text
+----------------------------------+
| HP   Provpass             [Konto]|
| [Riktigt | Genererat]           |
| [Verbal | Kvantitativ]          |
| FÖRESLAGET PASS                 |
| [provtillfälle / pass]          |
| 40 frågor · 55 minuter          |
| [Välj föreslaget pass]          |
| Fler provtillfällen: rader      |
| [navigation: Provpass aktiv]    |
+----------------------------------+

+----------------------------------+
| [Avsluta]  31:08 kvar           |
| KVA 14 av 40   [Frågeöversikt]  |
| [problem / text / figur]        |
| [valbara svar, inget facit]     |
| [Föregående] [Nästa]            |
| [Lämna in]                     |
+----------------------------------+
```

**Start and exit contract.** The gate shows the chosen sitting/pass/half,
count and duration, plus “Ingen paus”, “Ingen feedback förrän du lämnar in”,
“Du kan ändra svar tills tiden går ut”, “Avbryter du blir provet ogiltigt”, and
“Lämna ingen fråga obesvarad — fel ger inga avdrag”. “Inte nu”, Escape or
dismissal returns to the hub without starting. Confirmation starts exactly once.

“Avsluta” during a run opens a confirmation explaining that abandonment makes
the pass invalid; it does not pause the clock. “Fortsätt provpasset” cancels;
“Avbryt provpass” confirms. “Lämna in” names any unanswered count and asks once
before submission. A running clock reaching zero submits once automatically.
Reloading a recoverable active pass restores answers/position and the original
clock; it never grants another 55 minutes. The inspected route instead voids
an already-expired active pass found on reload; represent that outcome honestly
with a notice, rather than promising a reconstructed scored result.

**Reuse / new.** Reuse Instrument frame, panel/row/button vocabulary, `Readout`,
`Kc`, focus chrome and content-specific question bodies. Read `ConfirmSheet`,
`MockRunner` and the picker for behavior only; their M3 styling and API writes
do not belong in the bake-off. **New:** `InstrumentMockHub`,
`InstrumentPassRegister`, `InstrumentConfirmDialog`, `InstrumentMockRunner`,
`AnswerNavigator`, `SubmissionStatus`. `Segs` assumes sequential completion and
must not represent revisitable mock answers; the new navigator uses actual
answered/current/unanswered state. Timer warnings use `--in-warn`/words, with no
pulse or animated urgency.

| State | Required behavior |
| --- | --- |
| Empty | Keep both mode and half controls. “Inga riktiga pass tillgängliga för den här halvan.” Offer a generated pass only if its content exists; explain its indicative result. |
| Loading | Keep register headings; pending counts remain unknown. Disable start while resolving the selected pass or recovering an active session. |
| Partial data | Disclose presented count and prior exposure before start. Unknown exposure is not “aldrig sett”. A missing required question in recovery prevents a normal-looking run; offer a clear return/recovery state. Save/submission failures retain answers and show an explicit retry state without declaring a result saved. |
| Running | Answers remain editable, no correctness colours, explanations, techniques or answer-revealing lesson links. Left/right moves between questions; A–last option selects. Enter activates the focused button normally and is not a global advance/submit shortcut. |
| Done | Successful submission opens screen 10. During submission show “Lämnar in…” and prevent duplicate activation. Confirmed abandonment returns to the hub with “Provpasset avbröts och fick inget resultat”. |

**Navigation.** Enter through the primary Provpass door, Idag's planned pass
or a settings shortcut. Preserve a prescribed half. All five destinations and
account work on the hub; the running surface uses guarded exit only. Open
results through the existing `/prov?result=…` intent. The bake-off must keep
mode, selected pass and local result together when simulating this flow.

**ADHD-PI and accessibility.** One start gate absorbs the commitment decision;
do not add another instructions page. Grid cells say “Fråga 14, besvarad,
aktuell” with shape/text as well as tone. A compact grid can use roving focus
with arrow navigation, with visible previous/next buttons as an alternative.
Don't steal arrow keys from the active grid or figure viewer. Announce time
milestones sparingly and once, never every second. Make the running surface's
scope clear so the familiar practice keys cannot accidentally submit a pass.

**Unmistakably Instrument.** Pass selection is a precise register; the run is
the same measured workbench with a real answer-state instrument. The design
gets denser only where navigation among 40 answers needs it.

## Screen 10 — Provpassresultat

**Purpose and primary action.** Understand the result and choose the next useful
practice step. Primary **“Öva KVA”** when the supplied evidence supports that
section; otherwise **“Till Öva”**. A Repetera action is offered only against an
actual ready queue, not inferred solely from this pass's missed count.

**Data shown.** Pass identity, mode/half, correct/presented, answered/unanswered,
missing source questions, score and its provenance, section correct/presented,
section time and proportional budget, available trap cluster, the pass's own
previous-exposure snapshot, and earlier passes of the same half and mode.
The current result contains missed question identifiers but not the full
per-question picked-answer reconstruction: do not promise expandable facit
for every missed question from these fields alone.

**Desktop layout.** A single result panel ruled into three horizontal parts:
receipt, section table, then secondary context. A restrained completion drawing
may appear beside the receipt only if it leaves the evidence above the fold.

```text
+--------------+----------------------------------------------------+
| [navigation] | Provpass / Resultat                       [Konto] |
| Provpass     | PROVPASSET KLART                                   |
| aktiv        | 28 av 39 rätt · 38 besvarade · 1 obesvarad          |
|              | 1 fråga saknas ur passet — rättat av 39            |
|              | [poäng + tydlig metod och förbehåll]               |
|              | [Öva KVA]                                         |
|              +----------------------------------------------------+
|              | SEKTION   RÄTT    TID    RIKTTID    KOMMENTAR      |
|              | XYZ       ...     ...    ...        ...           |
|              | KVA       ...     ...    ...        ...           |
|              | NOG / DTK: samma kolumner                          |
|              +----------------------------------------------------+
|              | FÄLLA [om belägg finns] | SETT TIDIGARE 4 av 39    |
|              | Tidigare pass av samma sort                    >  |
+--------------+----------------------------------------------------+
```

**Phone layout.** Raw result and caveat first, then the action. Reflow each
section into a two-line labelled row rather than horizontally scrolling a
wide timing table. The exposure/history context stays below the analysis.

```text
+----------------------------------+
| HP  Provpassresultat      [Konto]|
| [Till Provpass]                 |
| Provpasset klart                |
| 28 av 39 rätt                   |
| 1 obesvarad · 1 saknas i källan  |
| [poäng, metod och förbehåll]     |
| [Öva KVA]                       |
| SEKTIONER                       |
| XYZ  [rätt/antal]               |
| Tid ... / riktmärke ...         |
| KVA / NOG / DTK: egna rader      |
| Fälla · sett tidigare · historik|
| [navigation: Provpass aktiv]    |
+----------------------------------+
```

**Reuse / new.** Reuse `Readout`, `.in-cell`, `.in-mini`, `.in-num`, verdict
glyph style and optional existing `Landscape`. **New:** `InstrumentMockResult`,
`ScoreProvenance`, `SectionTimingTable`, `RelatedPassList`. Use existing chart
grid/text tokens and neutral bars; a budget overrun is labelled “Över riktmärket”
and is not shown as a failed exam. The source's proportional budget is a
planning comparison, not an official mandatory section time.

| State | Required behavior |
| --- | --- |
| Empty | Missing result link: “Resultatet kunde inte hittas” and “Till Provpass”; distinguish this from an authenticated result still loading. |
| Loading | Keep the result skeleton structured as receipt + rows. Never display 0/40 while awaiting the result. |
| Partial data | Raw counts remain usable if normering/history/trap detail is absent. For presented <40 show the missing count beside the denominator. Unknown time is “Tid saknas”, not 00:00. No compatible prior history is an invitation, not a failure. |
| Ready | Show method beside score, plus current-pass exposure. Historical comparators identify their own scoring method; do not compare a linear estimate with a derived normed score as if identical. |
| Done | This is already the completed-pass state. Revisiting does not resubmit or alter answers; the next-practice action starts a new flow, returning to this result when appropriate. |

**Score copy.** A score derived from a sitting's UHR table remains labelled
“Normerat, härlett”, with the existing explanation that UHR norms the 80-question
half and a 40-question pass is scaled up. A fallback/generated score says
“Skattad poäng” and “Linjär skattning — indikativ, inte UHR-normerad.” Do not
label either an official result for this individual pass. If an estimate includes
uncalibrated P5 LÄS/ELF data, retain that calibration caveat as well. No numeric
score when the source cannot compute one, especially with a zero denominator.

**Navigation.** Enter after submission, a saved result link, or a mock-history
row. “Till Provpass” returns to screen 9's hub. All five destinations and account
are restored. Trap-to-Uppslag links name the available lesson, and next-practice
links preserve section/parent context. Detailed missed-answer review is a data
dependency, not an invented new destination.

**ADHD-PI and accessibility.** Lead with what happened and one next step; do
not celebrate a score without its denominator. Use table headers and text values
for every bar. Do not announce the entire result at once: focus the main title
and expose the structured content. A completed pass is acknowledged calmly even
when its score is low.

**Unmistakably Instrument.** A readable measurement receipt: labelled values,
aligned sections and timing evidence, with no collection of equal-size KPI cards.

## Screen 11 — Framsteg, including Historik

**Purpose and primary action.** See where practice is helping and choose the
next evidence-backed focus. Primary **“Öva KVA”** for the current suggested
section, or **“Till Öva”** before enough evidence exists. Within Historik, the
primary task is **“Öppna pass”** on the selected row; no extra global CTA competes.

**Data shown.** Total and half estimates, score band/confidence where available,
the supported weekly change, question volume, section estimates and attempts,
weekly data, 12-week activity, repetition status, and completed pass records.
Keep the estimate scale fixed at 0–2,0. Include the LÄS/ELF calibration caveat
where those estimates contribute. The current progress source uses a 1,8 goal,
while the redesign brief describes a student aiming for 2,0: do not silently
turn 2,0 (the scale maximum) into a configured target; see owner questions.

**Desktop layout.** One readout band and one section table with mini trends.
“Översikt / Historik” is a local view switch within Framsteg, not a sixth primary
destination. Activity and supporting prose sit below the main evidence.

```text
+--------------+----------------------------------------------------+
| [navigation] | FRAMSTEG                                  [Konto] |
| Framsteg     | [Översikt | Historik]                              |
| aktiv        +----------------------------------------------------+
|              | PROGNOS 1,41 / 2,0   [band + förbehåll] [Öva KVA] |
|              | [12 veckor, fast skala, luckor för saknade data]   |
|              +----------------------------------------------------+
|              | SEKTION  POÄNG  UNDERLAG  TREND    ÅTGÄRD         |
|              | ORD      ...    ...       ...      Läs           |
|              | KVA      ...    ...       ...      Läs           |
|              | [alla åtta, i stabil ordning]                     |
|              +----------------------------------------------------+
|              | NÄRVARO [kompakt remsa] [Visa dagar]               |
|              | Repetition: redo / aktivt / återlärt              |
+--------------+----------------------------------------------------+
| Historik: DATUM | PASS | RÄTT/ANTAL | [Öppna pass]                |
+-------------------------------------------------------------------+
```

**Phone layout.** Readout, action, compact trend, then section rows. Each row
puts its confidence/attempt count under the value. Historik uses the same panel
with full-row links; an empty history still retains the view switch and nav.

```text
+----------------------------------+
| HP   Framsteg             [Konto]|
| [Översikt | Historik]           |
| Prognos 1,41 av 2,0             |
| [band, underlag, förbehåll]     |
| [Öva KVA]                      |
| [trend på fast skala]           |
| ORD  ...   [minitrend]          |
| ... försök · underlag ...       |
| [övriga sju sektioner]          |
| Närvaro [Visa dagar]            |
| -- Historik-vyn --              |
| 18 okt  KVA  7/10   [Öppna pass]|
| [navigation: Framsteg aktiv]    |
+----------------------------------+
```

**Reuse / new.** Reuse `Readout`, `Chart`'s fixed-scale language, `.in-mini`,
`.in-code`, command rows and neutral cells. `Chart` itself is local to Home and
fixture-bound, so it requires extraction/generalization. **New:**
`InstrumentProgress`, `SectionProgressTable`, `TrendStrip`, `ActivityDisclosure`,
`InstrumentHistory`; share `ScoreProvenance`/related-pass rows from B2. Optional
per-section sparklines require actual section time series; if the shared data
has only the current section score, render its value/confidence without a line.

| State | Required behavior |
| --- | --- |
| Empty | “Ingen prognos än — börja med en övning.” Show “—”, not 0, for unmeasured sections. Historik: “Inga avslutade pass än” plus “Till Öva”. |
| Loading | Stable section labels and static slots reserve the table; keep the view switch, history entry and navigation usable. |
| Partial data | Show which sections have evidence and their attempt counts. No “svagast” comparison with only one measured section. Require at least two actual points for a trend; gaps stay gaps. Failed stats and failed history have independent messages, preserving cached values with a freshness note if known. |
| Ready | One suggested focus appears above stable section order. Expanded activity gives dates/counts and verbal/quant split where supplied. No loss-framed streak language. |
| Done | Finished practice becomes a dated history record only when available. Returning from a record restores the history selection and scroll. Reaching a goal does not imply all sections are mastered. |

**History scope.** The inspected `/historik` lists completed drill and
`adaptive_review` sessions, reopening `/drill?done=…` or `/repetition?done=…`.
Mock history is a separate result source. In Instrument, keep “Övningar” and
“Provpass” as explicitly labelled local history categories only if both sources
are supplied; mock rows open screen 10. Do not insert diagnostic records or
invent a combined score series. A failed reconstruction shows an unavailable
record with “Till Historik”, not a new drill.

**Navigation.** The Framsteg primary destination opens overview; Idag's “Alla
pass” opens Historik. `/historik` intentions retain Framsteg as the active
destination. Section name/“Läs” opens screen 12; the primary suggested-practice
action opens the correct exercise. A saved practice review can reuse existing
completed-drill feedback, with an explicit history return.

**ADHD-PI and accessibility.** Summarize one focus, then let the learner inspect
the table. Avoid eight colourful charts competing for attention. Provide table
values and accessible descriptions for sparklines; activity colours need a
legend and keyboard-accessible dates. The local view switch is either proper
tabs with keyboard behavior or ordinary navigation links, not decorative pills.
No tiny hover-only trend tooltip may hold the only confidence information.

**Unmistakably Instrument.** Dense, precisely aligned section evidence inside
one panel, compact labelled trends and a searchable-looking history register;
the data density belongs here rather than spilling back onto Idag.

## Screen 12 — Uppslag and lesson reader

**Purpose and primary action.** Find the rule behind a difficulty, read it, and
try it. Index primary: **“Läs KVA”** for an available selected section. Reader
primary: **“Öva detta mönster”** for the selected entry with playable examples
(“Öva denna taktik”, “Öva denna regel” or “Öva denna frågetyp” where appropriate).
If no entry is selected, the action can be **“Öva hela KVA”**. Do not imply
entry-specific practice exists when its example list is empty.

**Data shown.** All section names and actual content availability, supplied
recommendation, framework title/headword, entry count and estimated reading
time if known, read marks and last reading position. Detail preserves the three
real content families: trap patterns with recognition/countermeasure/worked
example; tactic/rule/question-type protocols; ORD roots with origin, meaning and
example words. Keep optional counterexamples and distractor signatures where
present. Linked example questions show the real prompt/math, not the answer.
Reading an entry is not evidence of mastery.

**Desktop layout.** The index is a section command list. Within a reader, a
compact section/entry index and one opaque reading panel share the chassis.
The reading column keeps its measure; on constrained widths, fold the entry
index into “Innehåll”. Each entry is a ruled disclosure, not a deck of cards.

```text
+--------------+----------------------------------------------------+
| [navigation] | UPPSLAG                                   [Konto] |
| Uppslag      | SEKTION    INNEHÅLL                     [Läs KVA] |
| aktiv        | ORD        Rötter och ord                         |
|              | KVA        Jämförelser och fällor                  |
|              | [övriga sex sektioner]                            |
+--------------+-------------------+--------------------------------+
|              | INNEHÅLL          | Uppslag / KVA [Alla sektioner]|
|              | [mönstertitlar]   | [valt mönsters titel]         |
|              | läst / oläst      | [kort sammanfattning]         |
|              |                   | Igenkänningstecken            |
|              |                   | Motåtgärd                     |
|              |                   | [genomarbetat exempel]        |
|              |                   | [Markera som läst]            |
|              |                   | [Öva detta mönster]           |
+--------------+-------------------+--------------------------------+
```

**Phone layout.** The index is a stacked list. Reader replaces it with a
single readable column and a named “Innehåll” disclosure. Bottom navigation
stays visible because this is a primary reading destination, not an active
timed/drill session. The practice action follows the selected entry's content;
it is not a floating bar obscuring the final example.

```text
+----------------------------------+
| HP   Uppslag              [Konto]|
| [Alla sektioner]  KVA           |
| [Innehåll] ... mönster · ... min|
| [valt mönsters titel]           |
| [kort sammanfattning]           |
| Igenkänningstecken              |
| [läsbar brödtext]               |
| Motåtgärd                      |
| [exempel, eventuellt matematik] |
| [Fördjupning]                  |
| [Markera som läst]              |
| [Öva detta mönster]             |
| [navigation: Uppslag aktiv]     |
+----------------------------------+
```

**Reuse / new.** Reuse command rows, `Kc`, `.in-pane`, `.in-pane-head`,
`.in-step`, `.in-tipbox`, `.in-disclose`, the `--in-read` font token
and MathText. `LessonReader`, `TrapCard`, `ProtocolCard`,
`LexiconCard`, `ExampleQuestions`, `PracticeLink`, `SectionPracticeCTA` and
`MarkAsReadPill` supply content/behavior references, not styles to transplant.
**New:** `InstrumentLibrary`, `InstrumentLessonReader`, `LessonContents`,
`LessonEntry`, `ReadMarkControl`. Render all three entry families in the same
panel vocabulary; protocol steps remain ordered, roots remain dictionary
entries, and a genuine worked example retains its distinct beats.

| State | Required behavior |
| --- | --- |
| Empty | Section without a framework stays in the index with “Innehåll saknas ännu”. A directly opened unavailable reader offers “Alla sektioner”. No fake lesson or clickable practice for an empty example list. |
| Loading | Keep section/title frame and skeleton rows; don't show a zero entry count while loading. |
| Partial data | Available sections/entries remain readable. Omit absent optional fields; unresolved examples get “Exemplet är inte tillgängligt”. A failed read-mark update does not collapse the entry or claim success. |
| Reading | Entries are initially collapsed except the explicitly selected/deep-linked one. Keep headings/essential guidance visible when expanded; details are progressive. Read marks change only by an explicit control. |
| Done | “Markerad som läst” updates the entry's read mark and index count; it does not say “Behärskad”. The practice action remains available if there are playable examples. |

**Navigation.** Enter through Uppslag, a progress section, a plan item or a
feedback framework link. Preserve `/lektion?section=…` and an entry anchor's
meaning: open and focus the correct entry after loading. “Alla sektioner” goes
to the index; an explicit “Tillbaka till frågan” is available when entered from
practice feedback and restores the graded question. Practice carries the
section/framework intent; example links carry the actual question identity.
In the bake-off, supported examples stay inside the direction. Tools outside
the round-2 screen set are not silently replaced by unrelated demo questions.

**ADHD-PI and accessibility.** Reading should reveal the next useful idea, not
25 expanded entries on arrival. Once the learner opens an entry, arriving stats
must not reorder it. Keep the read control separate from the practice action,
with a reversible “Markera som oläst”. Use semantic headings and native
disclosures; do not nest practice buttons inside another clickable row. Preserve
lesson text measure and math accessibility. English examples/quotes get their
own `lang="en"`, while guidance and chrome stay Swedish.

**Unmistakably Instrument.** An indexed reference workbench: a compact contents
register, precise rule/step labels, and one readable panel. It remains different
from Folio's continuous book even when displaying long prose.

## Screen 13 — Konto and Inställningar

**Purpose and primary action.** Inspect the account and adjust the study
environment, then return to work. Primary task action is the currently chosen
setting; the single page-level completion action is **“Tillbaka till Öva”** (or
the actual originating destination). Settings apply immediately as in the source;
do not add an unsupported “Spara alla ändringar” transaction. No filled CTA is
needed when the user is simply inspecting identity.

**Data shown.** Supplied display name/full email/plan status; current theme and
system-follow preference; coach voice choices (Kompis, Professor, Taktiker);
Smart/Slumpat question selection with explanation; available tools and help/legal
links. Use a synthetic display identity for the bake-off. Show the account's
actual plan availability, not the hardcoded round-1 “Gratisplan” as a paid-service
promise. Authentication/provider actions and live exports are not simulated as
successful server changes.

**Desktop layout.** The account popover remains a compact command menu and now
opens real local Konto/Inställningar views rather than merely closing. Full views
live inside the existing main panel, with two local tabs and ruled setting rows.
Identity is a compact heading, not an oversized avatar hero.

```text
+--------------+----------------------------------------------------+
| [navigation] | KONTO OCH INSTÄLLNINGAR                           |
|              | [Konto | Inställningar] [Tillbaka till Öva]       |
|              +----------------------------------------------------+
|              | KONTO     [namn]                                  |
|              |           [fullständig e-postadress]              |
|              | Plan och betalning: [ärlig tillgänglighetsrad]    |
|              +----------------------------------------------------+
|              | UTSEENDE  Läge  [Ljust | Mörkt | Följ systemet]   |
|              | COACH     [Kompis | Professor | Taktiker]         |
|              | URVAL     [Smart | Slumpat]                       |
|              |           Frågor nära din nivå.                  |
|              +----------------------------------------------------+
|              | Verktyg / hjälp / villkor / integritet           |
| [Konto]      | [Logga ut]                                       |
+--------------+----------------------------------------------------+
| aktuell ändringsstatus                                            |
+-------------------------------------------------------------------+
```

**Phone layout.** Account avatar remains top-right everywhere; its two rows
open the same full page. Setting labels stack above controls and wrap without
turning touch targets into tiny words. Keep the primary nav visible here.

```text
+----------------------------------+
| HP   Inställningar        [Konto]|
| [Konto | Inställningar]         |
| [Tillbaka till Öva]             |
| LÄGE                           |
| [Ljust] [Mörkt] [Följ systemet] |
| COACH                          |
| [Kompis] [Professor] [Taktiker] |
| URVAL                          |
| [Smart] [Slumpat]               |
| Frågor nära din nivå.           |
| Verktyg / hjälp / juridiska länkar|
| [Logga ut]                     |
| [navigation]                   |
+----------------------------------+
```

**Reuse / new.** Reuse `AccountTrigger`, `MenuItem`, `Theming` behavior,
`.in-menu`, `.in-switch`, `.in-avatar`, `.in-btn2`, `--in-r2` and existing
selection/focus tokens. **New:** `InstrumentAccount`, `InstrumentSettings`,
`SettingRow`, `SettingChoiceGroup`, `PreferenceStatus`. If retaining ARIA menu
roles, implement their keyboard model; otherwise use a labelled disclosure
containing ordinary links/buttons. Styling is not a reason to promise menu
semantics the control does not implement.

| State | Required behavior |
| --- | --- |
| Empty | Missing account identity: “Kontouppgifter är inte tillgängliga”. Do not invent a person or plan; independent local appearance controls still work. Signed-out entry follows the app's auth boundary, not a fake signed-in page. |
| Loading | Identity slots and preference groups reserve space. A loading preference is not displayed as an already saved default. |
| Partial data | A failed preference update shows “Ändringen kunde inte sparas” by that row, retaining or restoring the last confirmed value. Other groups remain usable. Full email wraps; missing name has a neutral label. |
| Changed | Selected word/control has a visible checked state. Theme updates preview and system-follow resolution coherently; row-level pending/success is announced once. In local demo state, do not claim cross-device sync. |
| Done | Return restores the originating screen and position. A simulated sign-out/export/deletion outcome is clearly a preview state; no live account mutation is part of this bake-off. |

**Product boundaries.** The production `/mer` offers global palettes; Instrument
keeps its own neutral/orange palette during the comparison. Do not add those
palettes as working controls in this direction. If their omission needs a note,
use “Fler utseendeval finns i den ordinarie appen” only in explanatory preview
context, not as a new learner-facing product requirement. Keep the existing
coach and smart-selection choices; changes must affect the represented state
or be clearly unavailable, never silently do nothing.

Tools are ordinary labelled destinations: Provpass goes to screen 9; help/legal
and existing Diagnostik, Avancerat and Feedback intentions retain their meaning.
Where a tool is outside the bake-off's supported screens, state that limitation
before an explicit exit to the existing app, or show a clear preview notice.
Never unexpectedly change the design while the learner thinks they are still
inside Instrument. Account/menu logout remains a separate neutral action.

The account file's header says no deletion on this surface, but its rendered
body has an export-first, typed-confirmation deletion section deep below account
content. Do not resolve that policy conflict by adding a deletion command to
the menu. Keep the default round-2 account preview non-destructive, and leave
the deep deletion treatment conditional on the owner's answer. If retained
later, it stays below the normal settings, offers export first, requires the
exact typed confirmation and has separate busy/error/done states. No credential
management or hosted account-profile embed is introduced here.

**Navigation.** Konto and Inställningar are reachable from all primary screens
through the account entry, including Historik and result views. The selected
primary destination remains the originating one, with a clear local account
heading; account is not a sixth tab. Browser back and the visible return action
both work. A menu's dismiss/Escape restores focus to its trigger.

**ADHD-PI and accessibility.** Group appearance, coaching and tools separately;
avoid a settings scavenger hunt or a command-palette-only feature. Choices have
labels and checked state; theme preview cannot obscure focused controls.
Preserve system reduced-motion preferences. Any future app-specific calm/focus
default needs its own agreed persistence behavior rather than a decorative
switch. Save failures use text as well as colour.

**Unmistakably Instrument.** Settings are compact control rows with square
rockers and key-like selections, inside the same grey chassis. Full identity
and clear save state replace a generic profile dashboard.

## Screen 14 — ELF reading question

**Purpose and primary action.** Read English evidence and answer the associated
question without losing place. Primary **“Svara A”** after selection, then
**“Nästa fråga”**, or **“Avsluta texten”** at the unit's end. Swedish controls
frame the original English passage, prompt and answer options.

**Data shown.** Unit title/byline, original English paragraphs, real question
count and options, unit/session progress, disclosure appropriate to provenance,
elapsed time, selected/eliminated answers and available explanation/citations.
Do not relabel the existing LÄS fixture as ELF. The committed `ELF_SHORT_UNIT`
in `ovningstextFixtures.ts` is “Counting Pots from the Pavement”, with one
question and four options; its prompt begins “What does the writer say about
the pots on a single stack?”. Use its real content through the shared model
when selected. It does not prove long-passage layout: also exercise a genuine
long ELF reading fixture from the approved source set. `ELF_CLOZE_UNIT` is a
separate gap-fill specimen; it must not silently substitute for this reading
screen. If a mixed pass supplies cloze, the common reader must preserve its
real gaps and “Lucka …” context rather than guessing a missing prompt.

**Desktop layout.** Keep Instrument's reading split, paragraph margin and
resizable gap. The source never contracts just because the explanation opens;
feedback replaces the question panel, with a third inspector only when the
common width rule permits it. Header labels are Swedish, content English.

```text
+--------------------------------------------------------------------+
| Öva / ELF · fråga 1 av 1    00:48          [Fokus] [Avsluta]        |
+---------------------------------------+----------------------------+
| TEXT  ÖVNINGSTEXT [Om texten]          | FRÅGA 1 AV 1               |
| Counting Pots from the Pavement       | What does the writer ...?  |
|                                       | A [English option] [Stryk] |
| 1  [original English paragraph]       | B [English option] [Stryk] |
|    [complete text at readable width]  | C [English option] [Stryk] |
|    [byline]                           | D [English option] [Stryk] |
|                                       | [Svara A]                  |
+---------------------------------------+----------------------------+
| A-D välj · Shift+bokstav stryk · J/K stycke · Enter svara            |
+--------------------------------------------------------------------+
```

**Phone layout.** Passage first; the question sheet peeks with the whole prompt
and “Visa alternativen”. Opening/closing preserves passage scroll and focus.
After an evidence jump, fold to peek, expose the cited paragraph, and offer
“Tillbaka till facit”. Keep the top exit usable even while chrome is folded.

```text
+----------------------------------+
| [Avsluta] ELF 1 av 1      00:48  |
| ÖVNINGSTEXT [Om texten]          |
| Counting Pots from the Pavement |
| 1 [original English paragraph]  |
|   [text continues, scrollable]  |
|   [English byline]              |
+----------------------------------+
| FRÅGA 1 AV 1                   |
| What does the writer ...?       |
| [Visa alternativen 4]           |
| -- öppet: A-D + Svara A --      |
+----------------------------------+
```

The ellipses above abbreviate the wireframe only. No rendered question, title
or option may be line-clamped.

**Reuse / new.** Reuse the B1-extracted reading workspace from `InstrumentDrill`,
`PassageBody`, paragraph/citation helpers, `Options`, `AnswerSummary`,
`Explanation`, `NoteToggle`, `PhoneDrill`/sheet behavior and `Done` composition.
**New:** `InstrumentElfReading` as a content/mode composition, not a copied
drill implementation, plus explicit content language and provenance inputs.
Keep `--in-read`, the existing 680 px passage wrapper, quiet `--in-mark`
underlines and `--in-flash` for deliberate evidence jumps.

| State | Required behavior |
| --- | --- |
| Empty | “Texten är inte tillgänglig” with “Till Öva”. Missing/retired content must not render as an empty question or reuse another unit's explanation. |
| Loading | Reserve the two panels/sheet and passage heading. Do not replace loading prose with fake readable text; exit stays available. |
| Partial data | Passage without a complete prompt/options cannot be answered. Missing explanation leaves the correct-answer summary and continuation available. Render only citations that actually map to a paragraph; do not manufacture ¶3 for a one-paragraph text. |
| Answered | Wrong answer opens explanation; correct answer offers it. English answer text stays intact in the summary. Swedish explanation prose and English quoted evidence are language-marked separately. |
| Done | “Texten är klar” with actual counts/time and one real next step or “Till Öva”. One-question units end after one question. No extra questions are fabricated to fill a progress meter. |

**Disclosure.** For P5 practice content, display “ÖVNINGSTEXT” and the existing
authorship note verbatim: “Den här texten och frågorna är skapade för övning av
HP-Coach. De kommer inte från ett tidigare högskoleprov. Personer, citat och
händelser kan vara påhittade.” Reuse the source constant, not a translation.
First-display expansion versus resumed collapsed state remains an owner
question; either choice must leave “Om texten” discoverable. Authentic exam
content uses its actual provenance, never the synthetic disclosure by default.

**Navigation.** Enter from ELF in Öva, an ELF lesson example, repetition,
Idag resume or a mixed/mock pass. “Avsluta” returns to the appropriate parent
under that session's contract; a mock does not become pausable practice.
Post-answer framework links open screen 12 and preserve return to the same
graded question. History review is read-only with a visible return.

**ADHD-PI and accessibility.** Put `lang="en"` on the English passage,
title/byline, prompt and options, not on the Swedish application shell. Keep
Swedish buttons outside those wrappers or explicitly `lang="sv"`. English
quotes within Swedish explanations also get `lang="en"`; hyphenation follows
content language. Paragraph navigation, visible elimination and focus mode are
optional aids; no vocabulary popovers or translation overlays interrupt the
reading task. Text-spacing overrides, font fallback, zoom and screen-reader
pronunciation must be tested, including the phone sheet's citation round trip.

**Unmistakably Instrument.** The same docked reading instrument as LÄS, now
accurate about English content, evidence and unit length. No flags, new accent
colour or alternate visual brand is needed to announce the language.

## Component inventory and batch handoff

| Owner | Components / source to reuse | New or generalized work | Consumers |
| --- | --- | --- | --- |
| B1 foundation | `InstrumentFrame`, `AccountTrigger`, `Palette`; `parts.tsx` exports `Mark`, `DEST_ICONS`, `G_KEYS`, `Kc`, `Readout`, `Segs`, `useWidth` | Make page content, breadcrumb, real status and navigation explicit; extract helpers that are currently file-local rather than copying a second shell. Establish parent-return behavior and keep screens 1–4 working. | Every batch. B3 wires the account page content. |
| B1 question foundation | InstrumentDrill's split, chrome, source, options, summary, explanation, sheet and completion pieces | Separate content from its fixed LÄS unit; support real option count, rich math/image answers, provenance/language, and practice/review/mock presentation. Keep supplied content and explanation paired. | 6, 7, 8, 9, 14 and saved practice review. |
| B1 screens | Home command-list/cell vocabulary; MathText, KVA/NOG parsing and figure behavior | `InstrumentPracticeHub`, `SectionDirectory`, `ReviewQueueBand`, `InstrumentQuantQuestion`, `QuantityRows`, `StatementRows`, `InstrumentFigureWorkspace`, `FigureGroupReadout`, `InstrumentFigureViewer`, `InstrumentReview`. | Screens 5–8; B2/B3 reuse these without re-skinning. |
| B2 screens | B1 shell/question foundation; existing mock semantics and source scoring labels | `InstrumentMockHub`, `InstrumentPassRegister`, `InstrumentConfirmDialog`, `InstrumentMockRunner`, `AnswerNavigator`, `SubmissionStatus`, `InstrumentMockResult`, `ScoreProvenance`, `SectionTimingTable`, `RelatedPassList`. | 9–10; confirmation and state vocabulary may be reused by B3. |
| B2 progress | Existing Home chart/readout style and real progress/history content | `InstrumentProgress`, `SectionProgressTable`, `TrendStrip`, `ActivityDisclosure`, `InstrumentHistory`; local overview/history switching. | 11 and links from Idag/results. |
| B3 screens | B1 shell/reader, B2 status/confirmation patterns, lesson and settings content semantics | `InstrumentLibrary`, `InstrumentLessonReader`, `LessonContents`, `LessonEntry`, `ReadMarkControl`, `InstrumentAccount`, `InstrumentSettings`, `SettingRow`, `SettingChoiceGroup`, `PreferenceStatus`, `InstrumentElfReading`. | 12–14; updates account links on every primary screen. |

Inventory names describe responsibilities, not a mandated file/API schema.
No imported production component may bring M3 colours, global font variables,
live service writes or a portal outside Instrument's scoped theme unnoticed.
Data migration belongs to the accepted build contracts: consume the shared
model's content, states and intentions; do not define a competing model here.

Each batch hands the next one a small reuse note naming extracted components,
actual inputs and supported states. B1 establishes the shared question body;
B2 supplies mode-specific answer/navigation behavior; B3 supplies English
content and lessons. If B1's abstraction is insufficient, extend it in the
owning build's permitted scope instead of keeping three forks of Options or
three incompatible phone sheets. This document itself changes no source files.

## Acceptance scenes for the build batches

These are future implementation checks; B0 is a document-only handoff and has
not rendered these proposed screens.

1. Every screen 5–14 at 1440 × 900 and 390 × 844, light and dark. Additional
   fit checks at 320 CSS px, enlarged text, intermediate pane widths and the
   ≥1680 px inspector threshold. Verify actual fonts and fallback fonts.
2. For each screen, inspect empty, loading, partial/error and done states in
   addition to its normal content. Verify that no error becomes zero data,
   and any unavailable action states its reason.
3. Keyboard and touch journey: Idag → Öva → KVA → feedback → lesson → back to
   feedback → completion → Repetera; Provpass → gate → run → submit → result
   → Framsteg/Historik; account/settings reachable from each primary screen.
4. Content stress: long NOG statements/all five options, unsplit KVA fallback,
   fractions and option images, dense DTK page with viewer round trip, long
   ELF passage with language changes, a one-question unit, and missing
   explanation/citation. Keep passage position across shared-source questions.
5. Mock integrity: no feedback before submission, editable answers, unanswered
   confirmation, one timeout settlement, original-clock recovery and expired
   recovery notice, guarded exit and submission failure. No practice shortcut
   accidentally submits a mock.
6. Accessibility: focus order/restoration, labelled targets, modal behavior,
   actual ≥44 px hit areas, ≥7:1 body contrast, AA UI, reduced motion,
   text-spacing overrides, screen-reader math/English pronunciation, accessible
   figure information and chart/table alternatives. Known source limitations
   require checks; borrowing a helper is not proof they passed.
7. Identity check with accent hidden: chassis, inset panels, ruled cells,
   readout alignment and compact status/key grammar still distinguish
   Instrument from the other directions. No equal-weight card grid, rounded
   floating sheets, warm book surface or decorative progress display.

## Open questions for the owner

The proposed defaults below keep the design handoff usable; they do not mark
unresolved product policy approved. Resolve the relevant question before a
build wires the corresponding disputed behavior.

| Question | Recommended direction / temporary treatment | Affects |
| --- | --- | --- |
| Is deep account deletion part of this round's preview? `konto.tsx` has contradictory header/body instructions. | Keep it out of all menus and the default preview. If the owner retains the existing deep flow, preserve export-first and typed confirmation; no live destructive action in the bake-off. | B3 / 13. |
| Should an ÖVNINGSTEXT note expand on the first opening of a unit? Round 1 shows a resumed unit with it collapsed. | Expand once on first display, then preserve the learner's choice/resume state; keep the approved wording and visible “Om texten” control. | B1 reading foundation, B3 / 14. |
| Is the displayed personal target 1,8 or 2,0, and where is it supplied? | Use a supplied target. Until one is agreed, show the fixed 0–2,0 scale and omit a personal target line; never relabel the hardcoded production 1,8 as the learner's preference. | B2 / 11. |
| Does the shared model provide per-section history, detailed picked-answer mock review, and comparable score provenance for older mock rows? | Render only supplied evidence. Omit unsupported sparklines and per-question mock facit; keep drill/repetition history separate from mock results until both sources are available. | B2 / 10–11, shared-model owner. |
| Which DTK figures have an equivalent accessible description/table? | Select a real source with a supplied equivalent for acceptance; treat missing alternatives as a content dependency, not a UI-generated summary or a passing accessibility claim. | B1 / 7, content owner. |
| Which approved long ELF reading unit accompanies the existing short fixture? | Keep the real short unit for correctness and supply a real long unit for reading/sheet stress. Do not pad the short text or use cloze as the reading fixture. | B3 / 14, shared-model owner. |
| Should round 2 show global palette choices or persist a new reading/focus default? | Keep Instrument's identity palette, existing light/dark/system behavior and current focus control. Broader palette/persistence changes need a separate product choice. | B3 / 13 and shared shell. |

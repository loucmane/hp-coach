# A · Folio — round 2 screen spec (B0): screens 5–14

Bead hpf-qr0p.33 · 2026-10-19 · document only.

This spec turns direction A · Folio from four bake-off screens into one design for the whole app. Three worker sessions will build it:

| Batch | Screens |
|---|---|
| **B1** | 5 Öva · 6 Kvantfråga (XYZ, KVA, NOG) · 7 DTK · 8 Repetera |
| **B2** | 9 Provpass (hub and a running pass) · 10 Provpassresultat · 11 Framsteg (incl. Historik) |
| **B3** | 12 Uppslag & lektion · 13 Konto & inställningar · 14 ELF-läsfråga |

Screens 1–4 (Idag, Läsfråga, Facit, Navigering) are built in `app/src/components/devbake/redesign/a-folio/` and are the reference for everything here. Where this spec and that code disagree, the code wins, unless the spec says it changes something on purpose. **Change** marks a deliberate departure, either from that code or from the live app's behaviour; the text says which.

**Conventions.**
- UI copy is Swedish and is meant to be used as written. Everything else is English.
- "Today" always means the live app on `main` at `b777074`, as surveyed for this spec.
- Each screen's data is described in plain terms. The shared view model (bead hpf-qr0p.7) supplies it, and its type names are not used here.
- Class names are the existing `fo-` vocabulary. New components are named in PascalCase, with a proposed `fo-` class.
- Every number and string in a wireframe is an example. Real values come from the view model.

**Read for this spec:** Folio's `meta.ts`, `Folio.tsx`, `FolioHome.tsx`, `FolioDrill.tsx` and `folio.css`; `docs/redesign/2026-10-round1-brief.md`; `docs/worklog/hpf-qr0p.md` (every reviewer critique); and the real screens: `routes/ova.tsx`, `routes/drill.tsx` + `components/drill/*`, `routes/repetition.tsx`, `routes/prov.tsx` + `components/mock/*`, `screens/ProgressMobile.tsx` + `routes/historik.tsx`, `routes/lektion.tsx` + `components/lesson/*`, `routes/konto.tsx` + `routes/mer.tsx`.

---

## 1. Folio's language: the rules every batch follows

### 1.1 The material

**One sheet of paper.** Every screen is the same warm paper (`--fo-paper`). Rules, type and space carry the structure. There are no cards, panels, tinted sidebars, boxed tags, pills or drop shadows on the page.

Only things that float above the page are **slips**: the account slip, the phone question slip, and the new confirm and picker slips. A slip is:
- square-cut (2 px corners);
- lighter paper (`--fo-leaf` or `--fo-menu`);
- edged with a hairline;
- given the faintest lift: `--fo-pop` for the account and modal slips, while the phone question slip keeps its own softer shadow.

A slip's heading is underlined by the heavy rule. If anything ever looks like a card, it is wrong.

The structural devices, and the one job each has:

| Device | Built as | Its one job |
|---|---|---|
| **Heavy rule** | 2 px `--fo-rule-strong` | Opens the lead, the one thing the page is about. Also underlines a slip's heading. |
| **Hairline** | 1 px `--fo-rule` | Separates entries, rows and sections. |
| **Double rule** | `.fo-menu-sep` + the next hairline | Comes before a way out or a destructive act (Logga ut, Avbryt passet, Radera). |
| **Column rule** | 1 px `--fo-rule`, vertical | Sets marginalia apart from the main text (`.fo-aside`), and the contents from the page. |
| **Leader dots** | `.fo-leader` | Lead from an entry to its "page number": minutes, a count or a score. Phone drops the dots. |
| **Ribbon** | `.fo-ribbon` | Marks where you are: the paused text, the current pass, the lesson you are reading. **At most one per screen.** |
| **Running head** | `.fo-runhead` | Replaces the app bar on every focus screen (drill, repetition, pass, review). The lesson spread uses running heads too, inside the frame. |
| **Footnote rule** | 6 rem hairline (`.fo-facit::before`) | Opens explanations and fine print. |
| **Asterisk footnote** | `.fo-footnote` | Holds a caveat that belongs to one figure (the prognosis). |
| **Colophon (⁂)** | `Colophon` | Ends a unit, a repetition or a pass. |
| **Thumb index** | `.fo-thumb` | Folded navigation. The pass index (screen 9) borrows the idea for a pass's 40 questions. |

### 1.2 Tokens (existing; no batch adds a token unless §4 lists it)

| Role | Tokens | Used for |
|---|---|---|
| Paper | `--fo-paper`, `-2`, `-3`, `--fo-leaf`, `--fo-menu` | The page; the hover wash on slip entries; hover, disabled and skeleton bars; question and confirm slips; the account slip |
| Ink | `--fo-ink`, `--fo-ink-2`, `--fo-ink-3` | Text; secondary text; labels, glosses and leader dots |
| Rules | `--fo-rule`, `--fo-rule-2`, `--fo-rule-strong` | Hairlines; control edges, ticks and scale axes; the heavy rule |
| Accent (ink-blue, hue 258) | `--fo-accent`, `--fo-accent-ink`, `--fo-accent-soft`, `--fo-accent-fill`, `--fo-accent-fill-2`, `--fo-on-accent` | The ribbon, the current entry and the progress "now"; links and ¶ references; the selection wash and range bands; the one filled button |
| Verdict | `--fo-ok`, `--fo-bad` | Only in four places: the right option, the chosen wrong one (letter, margin mark, worded tag), the dotted underline of a quotation that says why the pick is wrong (round 1's `.fo-ev[data-kind='wrong']`), and the same pair in a result list. Never on a verdict line, a whole row or a heading. |
| Flash | `--fo-mark` | The 700 ms mark when a ¶ or step link lands |
| Focus | `--fo-focus` | A 2 px ring with a 2 px offset |
| Fold | `--fo-fold`, `--fo-fold-2` | A spread's spine shade |
| Scrim, lift | `--fo-scrim`, `--fo-pop` | Under modal slips, and around the account and modal slips |
| Type | `--fo-serif` (Literata, opsz), `--fo-sans` (Inter, opsz 14–32); `--fo-t12 … --fo-t56` | Nine sizes, nothing in between. `t56` is only for Idag's lead headline. `t44` is for the one largest item on a hub page, and for a word root (§1.3). |
| Space | `--fo-s1` 4 · `s2` 8 · `s3` 12 · `s4` 16 · `s6` 24 · `s8` 32 · `s12` 48 · `s16` 64 px | A 4 px scale with exactly these steps. There is no s5, s10 or anything between. |
| Radius | `--fo-r1` (6 px) for controls; 2 px for slips; 50 % for letters and dots | `--fo-r2` (12 px) is declared but unused. Keep it unused. |
| Motion | `--fo-ease`, `--fo-d1` 120 ms, `--fo-d2` 180 ms, `--fo-d-out` 100 ms, `--fo-flash` 700 ms | See §1.6 |

Declared but unused so far: `--fo-accent-2`, `--fo-ok-soft`, `--fo-bad-soft`, `--fo-r2`, and the `.fo-quiet-btn` class. `.fo-quiet-btn` (a hairline-outlined button) is now **the** secondary button (§1.5). The two `-soft` verdict tokens stay unused: a tinted row is a box by another name.

### 1.3 Type

**Faces.**
- **Literata** sets content, headings and the navigation words: passages, prompts, options, explanations, lesson text, entry titles in contents lists, slip entries and the tab words.
- **Inter** sets the interface: labels, glosses, meta lines, buttons, keycaps, table figures and form values.

**Sizes.**

| Size | Used for |
|---|---|
| `t56` | Idag's lead headline (`t44` on phone, as built) |
| `t44` | **The one largest item on a hub page:** a hub lead's headline (new `.fo-lead-title`), or the display figure that takes its place (the prognosis, a pass's score). Also a word root on a lesson spread. On phone, a hub lead's headline drops to `t32`; a display figure stays `t44`. |
| `t32` | The page title (`t24` on phone), the passage title, a lesson's chapter title |
| `t24` | Section heads (`.fo-h2`), the prompt, the verdict |
| `t19` | Passage body, marginalia heads (italic) and the wordmark |
| `t17` | Entry titles, options, explanation prose |
| `t15` | Body UI, glosses, meta |
| `t13` | Hints and small meta |
| `t12` | Caps labels, scale ticks and footnotes (`.fo-footnote`) |

**Rules for every batch.**
- **At most three caps labels (`.fo-label`) per screen.** Margin and section heads are serif (italic in the margin), not caps.
- **One largest thing per screen.**
  - On a hub page it is the lead's headline or the display figure that replaces it, never the greeting or the page title.
  - On spreads and focus screens it is the passage or chapter title (`t32`). A word root (`t44`) is the only exception.
  - On hub pages the title is `t32` and the lead `t44`; on phone, `t24` and `t32`.
  - **Do not reuse `.fo-resume-title` outside Idag.** It is `t56`, and its phone rule forces `t44`.
- `text-wrap: balance` on headings, `pretty` on prose.
- `hyphens: auto` only in narrow prose columns. It needs a correct `lang` on the container: `sv` at the root, `en` on ELF content. Prompts, options and names use `hyphens: manual`.
- Italic is for subtitles, margin heads, the colophon and fine print. Never use it for emphasis inside UI labels.

**Numerals.**
- Old-style proportional figures in running text: passages and prose (`.fo-passage`).
- Old-style tabular figures for the "page numbers" at the end of leader dots: minutes and counts (`.fo-plan-min`).
- **Lining tabular figures** for anything measured, compared or computed: scores (1,4), raw scores (31/40), clocks, percentages, tables, math, DTK figures and dates in tables. **Never old-style figures in math.**
- **Tie-break:** a score or count at the end of leader dots ("sett 3/40", "31/40 · 1,40") is something compared, so lining figures win over the page-number rule. Minutes stay old-style.
- Swedish number style: decimal comma (1,4), the real minus sign (−0,1), a thin no-break space for thousands (12 500), and a no-break space before % and units (62 %, 55 min).

**Words.**
- Write sentences, not tags: "Pausad idag 07:52 på telefonen", never "PAUSAD · 07:52 · TELEFON".
- **Each fact appears once per screen.**
  - The frame's own count (the number beside "Öva" in the contents) is chrome and is not counted as a repeat.
  - Within the page, say a thing once: in the masthead, the standfirst, the lead or the margin, never two of them.
- **Numbers in words or digits.**
  - In prose (whole sentences, including announcements), spell out numbers up to ten: "åtta missar", "Fem minuter kvar".
  - In data, labels and tables, use digits: "Fråga 3 av 10", "ca 9 min".
  - Numbers compared in one phrase take the same form: "10 av 23 missar", never "Tio av 23".
- Use real dashes and Swedish quotes ”…”. ELF text keeps English “…”.
- The verbs are fixed, one meaning each:

| Verb | Meaning |
|---|---|
| **Fortsätt** | Resume where you left off |
| **Börja** | Start something new |
| **Starta** | Start a provpass. The hub's "Starta provpasset" opens its conditions, and the slip's "Starta nu" starts the clock. The verb is used only there, because the clock cannot be stopped. |
| **Öva** | Practise; the object follows ("Öva NOG", "Öva detta mönster") |
| **Svara** | Lock in an answer |
| **Nästa** | Move on |
| **Slutför** | Finish a unit, a review or a chapter ("Slutför texten", "Slutför genomgången", "Läst – slutför kapitlet") |
| **Avsluta** | Leave mid-way; your answers are saved |
| **Lämna in** | Hand in a pass |
| **Avbryt passet** | Void a pass |
| **Repetera** | Review misses |
| **Slå upp** | Open a lesson |

### 1.4 The page grammar (every non-focus screen)

Öva, Repetera's start page, the Provpass hub, Provpassresultat, Framsteg, Historik, Uppslag and Konto are all set the way Idag is set:

```
 masthead   LABEL (caps) . . . . . . . . . . . . . . optional page meta (t15, ink-2)
            --------------------------------------------- hairline
 title      Page title, Literata t32                    (one h1 per page)
            One sentence that sums the page up, t17 ink-2 (the standfirst)
 lead       ============================================= heavy rule  [R = ribbon]
            the one thing this page is for; its headline is the page's largest type
            (( the screen's one filled button  ↵ ))   hint t13 ink-3
            --------------------------------------------- hairline
 sections   Section head (fo-h2) . . . . . . . . . . . . . . . . . meta
            ---------------------------------------------
            n   Entry title  gloss . . . . . . . . . . . . . page number →
                one line of why (t15 ink-2)
            ---------------------------------------------
 marginalia | Italic margin head (t19/500)        desktop: a 288 px column behind
            | note ≤ t15                           a 1 px column rule;
            | Länk till mer →                      phone: after the text, under a rule
```

- **Desktop.** The page sits beside the contents list (248 px, or the 76 px thumb index) and is `max-width: 1080px`, centred. Main column plus a 288 px margin, `column-gap: clamp(40px, 4vw, 64px)`, padding `32px clamp(40px,5vw,72px) 64px`. This is the `.fo-home` grid; reuse it as `FolioPage`.
- **Phone** (`.fo-phome`):
  - 20 px side padding;
  - the masthead becomes two stacked lines with no rule;
  - the title drops to `t24`, and the lead's headline to `t32`;
  - the leader dots drop (a 12 px gap instead);
  - the margin follows the main text under its own hairline;
  - a filled button spans the full width.
- The masthead holds the page's running label (e.g. "Öva") and one piece of page meta. **The exam countdown appears on Idag only.**

### 1.5 Controls and the one filled button

- **One filled button (`.fo-btn`) per screen state, and ↵ presses it.** ↵ does nothing extra while focus is in a control that already uses Enter.
- **Change: the filled button follows your choice.** When the reader picks something other than the page's default, the lead and its filled button follow that choice. The example is a different pass in the Provpass register (screen 9). There is never a second filled button. Entries that start at once, like Öva's, need no such step.
- **Two pages have no filled button on purpose:**
  - Konto (screen 13), where settings apply at once;
  - Historik (screen 11), a ledger whose rows are the actions.
- **A modal slip may carry its own filled button.** The page under its scrim is inert, so the screen still has one live filled button.
- **↵ never presses a destructive act.** In a slip that confirms one:
  - **Abandon, import and reset.** The safe choice ("Fortsätt provpasset", "Behåll min data", "Behåll baslinjen") is the filled button and holds ↵. The act is a quiet button under a double rule.
  - **Account deletion.** The act is `.fo-btn--grave` (filled ink, new). It is enabled only by the typed confirmation and never pressed by ↵. Esc and "Avbryt" leave.
- **The control ladder:**

| Control | Class | Used for |
|---|---|---|
| Filled | `.fo-btn` | The one action |
| Grave | `.fo-btn--grave` (new) | Account deletion only |
| Quiet | `.fo-quiet-btn` | Equal-rank alternatives that are not the default, and destructive acts in their slips |
| Ghost | `.fo-ghost` | Running-head tools: Avsluta, Styckefokus, Förstora, Översikt |
| Text link | `.fo-link` | Leaving for another page. This includes the colophon's way back: round 1's `.fo-colophon-home`, a `.fo-more` without its chevron, counts as this rung. |
| Disclosure | `.fo-more` | Opening in place (chevron turns 90°) |
| Word choice | `.fo-seg` | Two to four exclusive options, the chosen word underlined in the accent |

- `.fo-seg` is a fixed three-column grid today. **B2**, the first batch with two-word choices, makes its column count follow its words.

- **No toggle switches, no checkboxes styled as pills, no chevron rows** (the "stock UI" the reviewer removed). A boolean setting is a two-word `.fo-seg` ("Med klocka · Utan klocka").
- Keycaps (`.fo-kbd`) appear only on desktop. They are already hidden on phone.

### 1.6 Motion

- **Entering.**
  - A page enters with `fo-page-in` (180 ms, a 6 px rise and a fade).
  - A slip enters with `fo-menu-in` (4 px); a phone slip with `fo-sheet-in` (24 px).
  - The facit unfolds with `fo-unfold` (180 ms).
- **Leaving** takes 100 ms (`--fo-d-out`). Leaving is always faster than entering.
- **New: the quant spread opens** (screen 6).
  - **On Svara**, the stage switches to the spread grid. The problem column keeps its 640 px measure and moves from the centre to the verso by a FLIP translate (180 ms, `--fo-ease`, transform only), while the recto enters with `fo-page-in`.
  - **On Nästa fråga**, the recto leaves (100 ms) and the next problem enters centred with `fo-page-in`. The page never slides back.
- **Never** springs, bounces, counting-up numbers, confetti or motion during reading.
- **Input is never blocked.** An animation never delays a key or a tap.
- **Reduced motion** sets every duration to 1 ms (the existing rule). **Thumbnails** (`data-live='false'`) have no motion at all.

### 1.7 State patterns (named once, used by every screen)

| State | Folio pattern | Rules |
|---|---|---|
| **Loading** — "sättning" | The final layout, typeset without its text. Rules, ribbon and buttons are in place; headings and lines are `--fo-paper-3` bars at the real measure and line height. | Appears only after 300 ms, so fast loads never flash. No shimmer: it is static. The masthead label and the page title are real text at once, because they need no data. `aria-busy="true"` on the region, and one polite "Laddar …" for screen readers. |
| **Empty** — "blank sida" | One italic Literata sentence (t17, ink-2) that says what will be here and how to get it. The screen's filled button does exactly that. | Never "Ingen data", "Inget här" or an illustration. Example: *"Här samlas dina missar. Gör en övning, så hamnar det du svarar fel på här."* + **Börja en övning**. |
| **Partial** | Show what exists. A missing figure is an em dash (—) with an asterisk footnote that says why and when it appears. | Never a zero standing in for "unknown". |
| **Error** — "erratum" | A note set like `.fo-note`: a 1 px left rule, t15 ink-2, plain words, and one `.fo-link` "Försök igen". | Never a red box. Content already on the page stays. Errors are announced with `role="status"`, not `alert`, unless the user's work is at risk. |
| **Done** | The colophon (§1.1): ⁂, the title, a caps facts row between hairlines, an italic line or two, the filled button (the plan's next part), and a quiet text link back to where the reader came from ("Till Idag", "Till Öva", …). | Every unit, repetition and pass ends this way. There is no other celebration. Hub pages, Konto and Framsteg have no "done"; each says so. |

### 1.8 Frame and focus screens

- **Frame.** On desktop, the contents list folds to the thumb index (⌘B). On phone, there are serif-word tabs plus the avatar button. The account entry opens the slip from every frame page.
- **Change:** the slip's "Konto" and "Inställningar" entries now open the Konto & inställningar page (screen 13) instead of closing the slip.
- **Focus screens** have no frame: drills, Repetera's questions, a running pass and a pass's review. Lessons keep the frame (screen 12), because Uppslag is a place to move around in.
- **What a focus screen keeps:**
  - running heads;
  - an always-visible **Avsluta** (or **Avbryt passet**) at the far left of the first running head;
  - progress and the clock at the right of the last running head;
  - on phone, a head that folds to a 40 px strip while reading.
- **Leaving.** Avsluta and the colophon's links go back to where the reader came from: the `from` page, or Idag when there is none.

### 1.9 Accessibility baseline (inherited; per-screen notes add to it)

- **Contrast.** Body text ≥ 7:1 in both themes (round 1 measured ≥ 12.17:1); UI ≥ 4.5:1. `--fo-ink-3` is the lightest ink allowed for text.
- **Focus.** A 2 px `--fo-focus` ring with a 2 px offset. The tab order follows the reading order.
- **Hit areas.** At least 44 px everywhere, through the invisible `::after` extensions where the drawn control is small.
- **Colour never alone.** A verdict is a glyph plus a word plus a tag ("Ditt svar", "Rätt svar"). A trend is a word ("ökar"), not a colour.
- **Structure.**
  - One `h1` per page and a real heading outline.
  - **Landmarks.** Already built:
    - the desktop sidebar is an `aside` labelled "Huvudmeny" around its `nav`;
    - the phone tabs are a `nav` "Huvudmeny";
    - the desktop page is `main`.

    **New:** the phone page gets a `main` (today a plain `div`), and the marginalia become an `aside` labelled by their first margin head (today a plain `div`).
  - Tables are real `<table>` with `<th scope>`.
  - Progress dots and scales are `role="img"` with a sentence label.
  - Footnoted figures use `aria-describedby`.
- **Announcements are few, and this list is all of them:**
  1. the option echo ("Ditt val: B"), polite;
  2. the verdict, by moving focus to it. Any "kommer tillbaka om …" line sits inside it, so it is read once;
  3. one polite "Laddar …" per loading region;
  4. errors and failed saves, `role="status"`;
  5. "Förklaringen laddas …" after Svara;
  6. the provpass milestones at five and one minutes;
  7. the zoom level in Förstora.

  Never a ticking clock.
- **Language.** `lang="sv"` on the root, and `lang="en"` on every ELF passage, prompt, option and quoted English phrase.
- **Text.** WCAG 1.4.12 text spacing, and 320 px reflow with no horizontal scroll.
- **Modal slips** are `role="dialog"` with `aria-modal`. They trap focus, close on Esc and return focus to their opener. Under a full phone slip, the page is `inert`.

### 1.10 ADHD-PI baseline (the primary user; per-screen notes add to it)

- **One obvious next action**, the filled button, which ↵ presses.
- **A time-box on every entry.** Minutes are the "page numbers" of every contents list, because estimating effort is the hard part.
- **Progress is visible but quiet**: dots, a thin line, "Fråga 3 av 10". Never a percentage bar that crawls.
- **No streaks and no loss framing.** "4 av 5 dagar den här veckan", never "du missade igår". A miss is "väntar i nästa repetition", never "fel" in a list.
- **No alarm counts.** A dot or a notch, not a red badge (the round-1 critique).
- **Calm while reading.** The clock folds to a line; Styckefokus is on F; nothing moves.
- **State is always saved and always said** ("Dina svar är sparade"). Resume works from anywhere.
- **No auto-advance and no surprise.** Every "next" is the reader's keypress.
- **Short sentences, one idea each.** Rationale lines say why in one line.

### 1.11 Critiques not to repeat (from the round-1 readers, `docs/worklog/hpf-qr0p.md`)

1. A greeting or page title louder than the lead.
2. The same fact twice: the countdown, the ÖVNINGSTEXT badge, progress four times on phone.
3. More than three caps labels.
4. Machine strings instead of sentences.
5. Boxed tags, pills, dashed disclosure pills, chips.
6. Two indicators for one state (a chip plus a rule on the current nav entry).
7. Showing three of something nobody acts on. Show the one that matters, and link to the rest.
8. A verdict below the graded options. A wrong answer that shouts: five red signals, a red rule.
9. Hidden affordances: strike only on hover; a grip always visible.
10. Stock UI showing through the paper: avatar blocks, chevron rows, pictogram tab bars, green tickers.
11. Several right edges in one column. One measure per column.
12. Hard clipping under sticky heads. Fade over 20 px instead.
13. Endings that say nothing, or reuse the quit verb.
14. Headings lighter than the notes under them.
15. A phone sheet that clips the question with an ellipsis.

---

## 2. Screens 5–14

**How to read the wireframes.** They are schematic, not pixel-true. Desktop is the 1440 × 900 stage; phone is 390 × 844.

| Mark | Meaning |
|---|---|
| `====` | The heavy rule, and nothing else |
| `----` | Hairline |
| `\|` | Column rule or the contents list's edge |
| `R` | Ribbon |
| `<` | The 2 px accent rule of a current or suggested entry |
| `. . .` | Leader dots |
| `##########......` | A progress line, or the pass index (screen 9) with gaps between sections |
| `[###]` | A range band on a scale |
| `(( Text  ↵ ))` | The one filled button |
| `( Text )` | `.fo-quiet-btn` |
| `[ Text ]` | `.fo-ghost`, a running-head tool |
| `Text →` | `.fo-link` |
| `Text >` | `.fo-more` disclosure |
| `(A)` | An option's letter |
| `(x)`, `(✓)` | The verdict's glyph in its ring |
| `(/)` | The strike control (always visible) |
| `(o)` | The phone avatar button |
| `• ◦` | Progress dots: done, to do |
| `@` | The progress dot for "now" |
| `*` | Footnote marker |
| `I Ö P U F` (a narrow column) | The thumb index |
| `/ /` | A slip's edge |
| `<…>` | An image or figure |
| `[___2___]`, `[toll¹]` | A gap inside a passage: empty, or with the pencilled word |
| `{…}` | A value from the view model |
| `…` | An elision in the wireframe only. The screen never clips text with an ellipsis. |

Desktop frames show the contents list expanded. Every frame page also works with it folded to the thumb index.

### Screen 5 · Öva (B1)

**Purpose.** Pick what to practise and start it in one press.
- The **primary action** is the lead's filled button:
  - **Repetera** when misses are ready;
  - otherwise the suggested section;
  - otherwise, for a new reader with no attempts, a mixed set.
- Every other entry also starts at once, with no setup step, exactly as today: ten questions (DTK 10–13, because figure pages are never split), no clock.

**What it shows (plain terms).**
- **Repetera:**
  - how many misses are ready now;
  - the batch cap (at most ten per round, the oldest first);
  - the time a round takes.

  The ready count per section, and today's pile (ready now plus today's misses, which ripen ten minutes after the miss), are on Repetera's own page (screen 8).
- **Which count the navigation shows.** The number beside "Öva" in the contents is the ready-now count, and its screen-reader text says "att repetera". **Change:** today the nav numeral shows the pile (open question 18).
- **The eight sections** in the test's order, with code, full name and a one-line gloss:
  - **Verbal:** ORD Ordförståelse, LÄS Svensk läsförståelse, MEK Meningskomplettering, ELF Engelsk läsförståelse;
  - **Kvantitativ:** XYZ Matematisk problemlösning, KVA Kvantitativa jämförelser, NOG Kvantitativa resonemang, DTK Diagram, tabeller och kartor.
- An estimated time for each set of ten, from the view model: the reader's own pace, or a default per section.
- Which section is weakest "just nu". This is the scheduler's top weakness: it needs at least one attempt in the last 90 days, and it prefers sections with at least ten.
- **Blandat:** ten questions round-robin across all eight.
- The hot-trap offer. It lives here now, because today it only appears on a drill start screen that Öva always skips.
- The question-selection setting ("smart" or "slumpat"), shown read-only, with a link to change it.

**Layout — desktop.** The page grammar (§1.4).
- **The masthead** is the label alone.
- **The standfirst** names the suggestion, using today's copy: "Schemat föreslår NOG – svagast just nu. Välj fritt om du hellre tar något annat." It is the only place the suggestion is said.
- **Main column:**
  - the lead is Repetera. Its headline is the round, "Tio missar, ungefär 12 minuter" (`.fo-lead-title`), and the backlog is the small line under it ("23 väntar i kön"), as on screen 8. The page's largest type is the next step, never the backlog;
  - then "Delproven" as a contents list in two parts, "Verbal del" and "Kvantitativ del" (Literata italic part heads, t17). The real hub's single row of eight unlabelled chips becomes a register;
  - the "Blandat" entry closes the list after a hairline.
- **Margin:**
  - "Fällan just nu" (the hot-trap offer);
  - "Om övningarna", the fine print and the selection setting.

```
+-------------------+----------------------------------------------------------------------------+
| HP·Coach      <<  |  ÖVA                                                                       |
|                   |  ------------------------------------------------------------------------  |
|   Idag            |  Vad tränar vi?                                                            |
| | Öva          23 |  Schemat föreslår NOG – svagast just nu. Välj fritt om du hellre tar       |
|   Provpass        |  något annat.                                                              |
|   Uppslag         |                                                                            |
|   Framsteg        |  ==============================================  |  Fällan just nu         |
|                   |  REPETERA · DE ÄLDSTA FÖRST                      |  LÄS        3 gånger ↑  |
|                   |  Tio missar, ungefär 12 minuter                  |  Författarens hållning  |
|                   |  23 väntar i kön                                 |  Rätt valens, fel objekt|
|                   |                                                  |  Fem minuter på         |
|                   |  (( Börja repetera  ↵ ))     Välj delprov →      |  fällan först →         |
|                   |  ------------------------------------------------ |                        |
|                   |  Delproven                                       |  Om övningarna          |
|                   |  ------------------------------------------------ |  Tio frågor (DTK 10–13)|
|                   |  Verbal del                                      |  ingen klocka. Avsluta  |
|                   |  ORD  Ordförståelse . . . . . . . . . .  4 min → |  när du vill – svaren   |
|                   |       Vilket ord betyder ungefär samma sak?      |  sparas.                |
|                   |  ------------------------------------------------ |                        |
|                   |  LÄS  Svensk läsförståelse . . . . . . 22 min →  |  Frågeurval: smart      |
|                   |       Hela texter med frågor om innehåll         |  Ändra →                |
|                   |  ------------------------------------------------ |                        |
|                   |  MEK, ELF  … (the same entry)                    |                         |
|                   |                                                  |                         |
|                   |  Kvantitativ del                                 |                         |
|                   |  XYZ, KVA  … (the same entry)                    |                         |
|                   |  NOG  Kvantitativa resonemang . . . . . 14 min → |                         |
|                   |       Räcker (1), (2) eller båda?                |                         |
|                   |  DTK  Diagram, tabeller och kartor . . . 15 min →|                         |
|                   |       10–13 frågor, hela figursidor              |                         |
|                   |  ------------------------------------------------ |                        |
|                   |  Blandat  alla åtta delprov . . . . . . 12 min → |                         |
|  -----------------|                                                  |                         |
|  Konto            |                                                  |                         |
|  Inställningar …  |                                                  |                         |
+-------------------+----------------------------------------------------------------------------+
```

**Layout — phone.** One column, in this order:
1. The masthead.
2. The title and standfirst.
3. The lead, with a full-width filled button and "Välj delprov →" under it.
4. The register. Entries keep code, name, gloss and minutes, without leader dots.
5. The margin blocks, after a hairline.
6. The tabs.

```
+--------------------------------------+
| HP·Coach                        (o)  |
|                                      |
| ÖVA                                  |
| Vad tränar vi?                       |
| Schemat föreslår NOG – svagast just  |
| nu. Välj fritt om du hellre tar      |
| något annat.                         |
| ==================================== |
| REPETERA · DE ÄLDSTA FÖRST           |
| Tio missar, ungefär 12 minuter       |
| 23 väntar i kön                      |
| ((        Börja repetera         ))  |
|                       Välj delprov → |
| ------------------------------------ |
| Delproven                            |
| Verbal del                           |
| ORD  Ordförståelse          4 min →  |
|      Vilket ord betyder ungefär samma|
|      sak?                            |
| ------------------------------------ |
| LÄS  Svensk läsförståelse  22 min →  |
| …                                    |
+--------------------------------------+
| Idag   Öva•  Provpass  Uppslag  Fram |
+--------------------------------------+
```

**Reuses.**
- `FolioPage` (the `.fo-home` grid) and the masthead.
- `.fo-greet` / `.fo-day` as title and standfirst.
- `.fo-resume` + `.fo-ribbon` as the lead, with the new `.fo-lead-title` (`t44`, phone `t32`), not `.fo-resume-title`.
- `.fo-section-head` + `.fo-h2` + `.fo-meta`.
- `.fo-plan-row` as the entry. The number column becomes the section code, set in Inter 500 t13 with 0.06 em tracking, the way the trap's section is set (`.fo-trap-meta b`).
- `.fo-leader`, `.fo-plan-min`, `.fo-aside` + `.fo-aside-block` with the italic `.fo-h3` heads, `.fo-trap-*`, `.fo-link`.

**New.**
- `ContentsEntry`, extracted from `.fo-plan-row`. Its slots: code or number, title, inline gloss, page number, the line of why, and an optional italic note (e.g. "svagast just nu" on Uppslag, where no standfirst says it). B1 builds it once in a shared `parts.tsx`; every later contents list uses it.
- `.fo-lead-title`, the hub lead's headline (`t44`, phone `t32`).
- `PartHead`: the italic Literata part head ("Verbal del").

**States.**
- **Loading.** The register is static, so the eight entries, their names and glosses render at once. Their minutes use the default pace and settle without moving the layout.
  - Only the lead and the margin's trap are set as "sättning" bars.
  - **Never** show an empty-state sentence before the counts are known. This is the ghost-empty bug on today's Repetera start screen.
- **Empty (new reader, no attempts).**
  - The lead becomes Blandat. Title: "Vad tränar vi?" Standfirst: "Välj ett delprov att öva, eller ta en blandad övning över alla åtta."
  - The filled button is **Börja blandad övning ↵**.
  - The Repetera block shrinks to one italic line under the lead: "Inga missar än – när du svarar fel i en övning landar frågan här."
  - No suggestion.
- **Paused repetition.** The lead takes the ribbon: "PÅBÖRJAD · REPETITION", "Pausad vid miss 3 av 10", **Fortsätt repetitionen ↵**. It is shown only for a round of the same scope (screen 8).
- **Partial: the pile has misses, but none are ready.**
  - The lead is the suggested section: "NOG · Kvantitativa resonemang", **Börja med NOG ↵**.
  - The standfirst then carries what the lead does not: "Inget är redo just nu – tre missar ligger i dagens hög och blir redo om åtta minuter." This is the real copy, with the ripening time added; the view model knows each miss's ready time.
- **Partial: stats failed but the queue loaded, or the reverse.** The failed half gets the erratum "Gick inte att hämta just nu – försöker igen automatiskt." (the real copy). The other half and the whole register work.
- **All relearned.** The lead is the suggestion, and the standfirst says "Kön är tom just nu – allt du missat är återlärt." **No disabled button.** Today's "Kön är tom" CTA looks disabled but still navigates.
- **Done** does not apply; Öva is a hub. A drill or repetition started here ends in its colophon, whose quiet link reads "Till Öva" (§1.8).

**Navigation.**
- **In:**
  - the "Öva" contents entry or tab. Its count is the ready-now count, set in old-style numerals beside the word; folded, it is the rail's notch; on phone, the tab's dot;
  - the palette entry;
  - Historik's empty state;
  - the colophon's "Till Öva".
- **Out:**
  - each entry goes straight into its drill: LÄS → screen 2, XYZ, KVA and NOG → screen 6, DTK → screen 7, ELF → screen 14, ORD and MEK → screen 6's single page (see screen 6);
  - the lead's filled button starts the round, and "Välj delprov →" opens Repetera's page (screen 8) for a section-only round;
  - "Fem minuter på fällan först" goes to the targeted repetition;
  - "Ändra" goes to Konto & inställningar (screen 13), at the setting.
- **Wiring changes for B1** (§3):
  - Idag's plan rows open their item directly: Repetition → screen 8, "ORD-övning" → the drill. In round 1's Folio code they open the Öva page; the live app already links them directly.
  - The round-1 colophon's "Nästa: Repetition" opens screen 8, not Öva.

**ADHD-PI.**
- The choice is made for the reader (the lead), and ↵ takes it.
- Every entry shows its time cost.
- Ready misses are a plain count with a ceiling ("tio åt gången"), never an alarm.
- "svagast just nu" says the weakness is temporary.
- **Per-section miss counts appear only on Repetera's page, never on the drill entries.** Today "N väntar" sits on a chip that starts a *new* drill, which is the wrong door.
- No setup step stands between the wish and the first question.

**Accessibility.**
- **Accessible names.** Each entry is one button whose name reads as a sentence: "NOG, Kvantitativa resonemang, tio frågor, ungefär 14 minuter". The leader dots and the arrow are `aria-hidden`.
- **Structure.**
  - The parts are `h3` under the `h2` "Delproven", and each part is a list.
  - The lead is a `section` labelled by its headline.
  - "Välj delprov →" reads "Välj delprov att repetera".
- **Counts.** The nav count keeps its screen-reader text ("23 att repetera"), which is now true: the count is the ready-now number.

**Unmistakably Folio.**
- The practice hub reads as a book's table of contents: two parts, entries with leader dots to the minutes where page numbers go, and glosses in secondary ink.
- The lead sits under the heavy rule, with the ribbon only when a repetition is paused.
- The marginalia carry the trap, headed in italic.
- One ink-blue button.
- No chips, no tiles, no icons.

### Screen 6 · Kvantfråga — XYZ, KVA, NOG (B1; it also sets ORD and MEK)

**Purpose.** Solve one problem. The **primary action** is **Svara ↵** once an option is chosen, then **Nästa fråga ↵**.
- Folio keeps its round-1 two-step answer: choose, then Svara. The live app answers on the first tap; this is a **Change**. For an impulsive first tap, the second step is the cheapest safeguard there is.

**What it shows (plain terms).**
- **The problem.** Its number in the set, the prompt (inline math), and a figure for about one XYZ problem in five and some KVA/NOG.
- **Per section:**
  - **XYZ:** four free-text options, often math.
  - **KVA:** an optional leading condition (prose or one equation line), then *Kvantitet I* and *Kvantitet II*. Then the four fixed options:
    - A "I är större än II"
    - B "II är större än I"
    - C "I är lika med II"
    - D "informationen är otillräcklig"
  - **NOG:** the question, then statements (1) and (2), the lead-in "Tillräcklig information för lösningen erhålls", then five fixed options:
    - A "i (1) men ej i (2)"
    - B "i (2) men ej i (1)"
    - C "i (1) tillsammans med (2)"
    - D "i (1) och (2) var för sig"
    - E "ej genom de båda påståendena"
- **The pre-answer tactic.** A handle and one line, present on nearly every quant item.
- **Before answering:** the set's position, the elapsed time and the strike marks.
- **After answering:**
  - the verdict;
  - why the chosen option tempted and why it is wrong;
  - the pitfall and the technique, which are in the data on nearly every item but never rendered today;
  - the solution path;
  - the steps (6–18, about a third detail-tier);
  - the other options' reasons;
  - the framework by its readable name.

**Layout — desktop. A single page that opens into a spread when you answer (Change, new).**
- **Before answering:** one page, centred on the paper, at the recto's measure (640 px, edges 44/48 px).
  - **One running head** (`.fo-runhead--solo`): Avsluta · "KVANT · NOG" · dots, "Fråga 3 av 10" and the clock.
  - **The problem number hangs in the margin** at the prompt's first baseline, the way ¶ numbers do, in Inter 600 t13. There is no empty verso: a short problem does not need a facing page yet.
  - **The tactic** is a margin note in the right margin: italic Literata head "Taktik", the move in t15 ink-2. It disappears on answering and never shows in a provpass.
- **On Svara:** the problem column moves into the **verso** and the **recto opens** with the facit. This is the FLIP move of §1.6; it is instant under reduced motion.
  - The spine starts at 0.5.
  - The problem and all its options stay in view, now graded: the right one, the chosen one, the rest in `--fo-ink-2`. Quant options are short, so all are shown and no "Visa alla alternativ" is needed.
  - The spine is the round-1 resizable gutter.
  - **On Nästa fråga** the recto leaves, and the next problem enters as a single page.

```
 before answering
+----------------------------------------------------------------------------------------------+
| [x Avsluta]                    KVANT · NOG                ••@◦◦◦◦◦◦◦  Fråga 3 av 10  ◷ 04:12 |
| -------------------------------------------------------------------------------------------- |
|                                                                                              |
|              3  En skolklass har 28 elever. Hur många av                 Taktik              |
|                 eleverna är flickor?                                     Pröva (1) ensamt    |
|                 ---------------------------------------------           först, sedan (2).    |
|                 (1)  Antalet pojkar är 4 fler än antalet flickor.                            |
|                 (2)  Andelen flickor är 3/7.                                                 |
|                                                                                              |
|                 Tillräcklig information för lösningen erhålls                                |
|                 ---------------------------------------------                                |
|                 (A)  i (1) men ej i (2)                          (/)                         |
|                 (B)  i (2) men ej i (1)                          (/)                         |
|                 (C)  i (1) tillsammans med (2)                   (/)                         |
|                 (D)  i (1) och (2) var för sig                   (/)                         |
|                 (E)  ej genom de båda påståendena                (/)                         |
|                 ---------------------------------------------                                |
|                 A–E väljer · ↵ svarar · ⇧ + bokstav stryker                                  |
|                 (( Svara  ↵ ))   Välj ett alternativ                                         |
+----------------------------------------------------------------------------------------------+

 after Svara: the page becomes the verso, the facit opens as the recto
+----------------------------------------------+--+--------------------------------------------+
| [x Avsluta]          KVANT · NOG             |  |  ••@◦◦◦◦◦◦◦  Fråga 3 av 10        ◷ 05:40  |
| -------------------------------------------- |  | ------------------------------------------ |
|  3  En skolklass har 28 elever. Hur många    |  |  (x)  Fel. Rätt svar är D.                 |
|     av eleverna är flickor?                  |  |  ------                                    |
|     (1)  Antalet pojkar är 4 fler än …       |  |  Därför lockade C                          |
|     (2)  Andelen flickor är 3/7.             |  |  …  Se (1) (2)                             |
|     ------------------------------------     |  |  Varför C är fel                           |
|     (A)  i (1) men ej i (2)                  |  |  …                                         |
|     (B)  i (2) men ej i (1)                  |  |  Att ta med dig                            |
|     (C)  i (1) tillsammans …   x Ditt svar   |  |  Fallgropen  …   Tekniken  …               |
|     (D)  i (1) och (2) var …   ✓ Rätt svar   |  |  Lösningen                                 |
|     (E)  ej genom de båda påståendena        |  |  …                                         |
|                                              |  |  Steg för steg                             |
|                                              |  |  1  Ställ upp vad som söks …               |
|                                              |  |  2  …                     Fördjupning >    |
|                                              |  |  De andra alternativen   ·   Ramverk …     |
|                                              |  |  (( Nästa fråga  ↵ ))  Fråga 4 av 10 väntar|
+----------------------------------------------+--+--------------------------------------------+
```

**Anatomy per section.**
- **XYZ.** The prompt as it comes (conditions such as "x > 0" are not split out in the data), then the four options.
- **KVA.** The condition as its own line, then **the two quantities side by side**: a two-column ruled table under the heading row "Kvantitet I | Kvantitet II", with a column rule between them. This is a **Change**: today they are stacked. Comparing is a side-by-side act. Phone stacks them, each under its italic label.

```
   4  a > 0
      ------------------------------------------------------
      Kvantitet I                  |  Kvantitet II
      (a + 1)²                     |  a² + 1
      ------------------------------------------------------
      (A)  I är större än II                            (/)
      (B)  II är större än I                            (/)
      (C)  I är lika med II                             (/)
      (D)  informationen är otillräcklig                (/)
```

- **NOG.** The question, then (1) and (2) as a hanging list whose numbers sit in the margin (they are the statements' "¶ numbers"), then the italic lead-in, then A–E.
  - The facit's "Se (1)" references are buttons that flash the statement on the verso, like ¶ links.
  - This needs a kit rule that finds "(1)" and "(2)" in the explanation text. **That is a shared-kit change** (`r1Kit.ts`), like screen 14's. B1 needs it admitted to its write set or coordinated. Until it lands, the facit shows no "Se (1)" links rather than wrong ones.
- **ORD and MEK** (not separate screens) ride on this single page.
  - **ORD:** the word as the prompt in Literata `t32`. Today a prompt of 18 characters or less is set at 44–64 px; here such short prompts get `t32`, the page-title size, and never larger. ORD has five options A–E.
  - **MEK:** the sentence with its gaps as `GapMark`s (screen 14), and four options.
- **Figures.** XYZ, KVA and NOG figures are inline SVG drawn in `currentColor`, so they follow dark mode.
  - The figure is set like a book figure, above the prompt as today, centred on the measure, up to 280 px tall, with no frame.
  - A ghost **Förstora** under its right edge opens `FigureViewer` (screen 7).
  - SVG labels are paths, so the figure gets `role="img"` with `aria-label="Figur till uppgift 3"`. A described alternative is a data follow-up.

**Math.**
- **Renderer.** Math is KaTeX, inline only (there is no display math in the bank), through the existing `MathText`.
- **Sizing.** Folio sets KaTeX's own faces and sizes them so KaTeX's x-height matches Literata's at the prompt size. B1 measures it (start at 1.00 em, adjust in 0.02 em steps) and pins it as `--fo-math-scale`, the only new token (§4).
- **Figures in math.** Quant prompts, options and steps use **lining tabular figures** (`font-variant-numeric: lining-nums tabular-nums`). The passage rule (old-style figures) never reaches math.
- **Errors.** A KaTeX error renders the source as **plain ink text**, never KaTeX's red. Known data artefacts render as they are and are not the design's to fix: NOG options whose "(1)" is stored as math, leftover parse text on some KVA option D, nine items with raw LaTeX.

**Layout — phone.** One scrolling page, not the reading slip: a quant problem is short enough to sit with its options. **Change:** Folio's round-1 phone slip is for passages only.
- **The head** is the drill strip: Avsluta, "Fråga 3 av 10" and the clock, with the progress line along its foot. A single page has no slip, so the head names the question.
- **The page:** the problem, the figure (full width; a tap opens Förstora), "Taktik >" as a disclosure (closed), and the options.
- **The foot:** the action bar is anchored (**Svara** full width, with the echo).
- **On Svara**, in round 1's order (verdict, then graded options, then facit):
  - **the verdict is inserted directly above the option list**, with **Visa uppgiften ⌃** on its line;
  - all the options are graded in place;
  - **the page scrolls so the verdict sits under the head.** Today the result can land below the fold;
  - the facit follows the options;
  - the problem stays above, one press of "Visa uppgiften ⌃" away.

```
+--------------------------------------+     after Svara (scrolled to the verdict)
| [x]    Fråga 3 av 10        ◷ 04:12  |    +--------------------------------------+
| #########........................... |    | [x]    Fråga 3 av 10        ◷ 05:40  |
| KVANT · NOG                          |    | (x)  Fel. Rätt svar är D.            |
| 3  En skolklass har 28 elever. Hur   |    |                    Visa uppgiften ⌃  |
|    många av eleverna är flickor?     |    | ------------------------------------ |
|    (1) Antalet pojkar är 4 fler än   |    | (A) i (1) men ej i (2)               |
|        antalet flickor.              |    | (B) i (2) men ej i (1)               |
|    (2) Andelen flickor är 3/7.       |    | (C) i (1) tillsammans med (2)        |
|    Taktik >                          |    |     x Ditt svar                      |
| Tillräcklig information för          |    | (D) i (1) och (2) var för sig        |
| lösningen erhålls                    |    |     ✓ Rätt svar                      |
| ------------------------------------ |    | (E) ej genom de båda påståendena     |
| (A) i (1) men ej i (2)          (/)  |    | ------                               |
| (B) i (2) men ej i (1)          (/)  |    | Därför lockade C                     |
| …                                    |    | …                                    |
+--------------------------------------+    +--------------------------------------+
| ((             Svara             ))  |    | ((         Nästa fråga           ))  |
|          Välj ett alternativ         |    |        Fråga 4 av 10 väntar          |
+--------------------------------------+    +--------------------------------------+
```

**Reuses.**
- From the round-1 drill: `.fo-runhead` (`--solo` before answering), `Spread` and `.fo-gutter`, `Options` and `GradedOptions` (with a "show all" mode), `Verdict`, `Facit`, `Step`, `Distractor`, `Cites`, `Rich`, `ActionBar`, `ClockButton`/`TimeLine`, `Dots`, `Colophon`.
- `KeyHints`, made into a parameter. Today it hard-codes "A–D" and "F styckefokus"; quant needs A–E and no F.
- On phone: the phone drill head, `.fo-head-progress` and the anchored foot of the phone colophon.
- `MathText` as it is.

**New.**
- `QuantPage`: the single page and its opening spread.
- `QuantProblem`: the per-section anatomy. Its pieces are `KvaQuantities` (the two-column table) and `NogStatements` (the hanging list).
- `FixedOptions`: KVA's and NOG's fixed texts and NOG's lead-in.
- `FigureInline`: SVG plus Förstora.
- `TacticNote`: the margin note, or a disclosure on phone.
- `--fo-math-scale`.
- A drill-view **seam** that B2 and B3 depend on. Every drill view takes:
  - `mode`: `drill | repetition | pass | review`;
  - a running-head label;
  - an optional `Verdict.after`;
  - the next button's label;
  - the content's `lang`.

  `pass` turns grading off. `review` is graded and read-only.
- **B1 also converts the round-1 reading drill to the seam.** It is wired to the fixture's one LÄS unit today, and Repetera's LÄS misses need it.
- **B1 builds the ELF language wrapper** (`ElfPassage`: `lang="en"` plus the `:lang(en)` typography of screen 14), so ELF questions in Repetera (B1) and in the verbal pass (B2) are marked correctly before B3 builds the rest of screen 14.
- **The entry-name helper** (readable framework names, "LAS" → "LÄS"), for the facit's framework line. B1 builds it; B2's traps and B3's lessons reuse it.

**States.**
- **Loading.** The running head is real at once. The problem and options are "sättning" bars at the final measure, with hairlines between the option rows.
- **Explanation still loading after Svara.**
  - The verdict and graded options appear at once, because they need only the key.
  - The recto shows sättning bars under the footnote rule, and screen readers get the quiet line "Förklaringen laddas …". Today it says "Tänker igenom uppgiften…".
- **Explanation failed.** The verdict stays. Today the whole result block disappears. The recto shows the erratum "Förklaringen gick inte att hämta." + "Försök igen".
- **No explanation.** "Förklaring saknas ännu för den här frågan." + a quiet "Markera som saknad", which becomes "Markerad – tack." (the real copy).
- **Figure failed.** The erratum "Figuren gick inte att visa." + "Försök igen", in the figure's place. Today it is a silent faded box. A figure hidden on purpose (a known broken figure) leaves no placeholder.
- **Nothing to practise.** "Inga NOG-frågor klara att öva på just nu." + filled **Till Öva ↵**.
- **Question not found.** "Hittade inte frågan." + **Till Öva ↵**. Never the debug copy "Direktlänk …".
- **Done.** The colophon (round 1) with "Hela passet >" (`RoundList`).
  - For a single-section set, the italic sentence may add the section's new estimate in words, **only when it moved by 0,05 or more**: "NOG-prognosen steg till 1,30." It never shows a ten-question "detta pass 1,60", which is noise presented as a score.

**Navigation.**
- **In:** Öva's entries; Idag's plan; Framsteg's Fokus; a lesson's "Öva detta mönster"; an example question (`qid`); Repetera; a provpass (`mode: pass`).
- **Out:**
  - **Avsluta** is saved and resumable, and returns to the origin;
  - the colophon offers the plan's next part, or "Till Öva".
- **Keys:**
  - A–D (A–E for NOG and ORD) choose; ⇧ + letter strikes; ↵ answers and then goes on.
  - A letter with no option does nothing. Today `e` on a four-option question records a wrong answer.
  - Esc closes Förstora and slips, and never leaves the set.
  - Keys are suspended while Förstora is open. Today they leak through.

**ADHD-PI.**
- **The two-step answer** stops the impulsive first tap.
- **The problem stays in view while you read why** (the spread), so nothing has to be held in working memory.
- **The tactic is a quiet margin note**, there when wanted, gone after answering.
- **Detail steps are folded** ("Fördjupning"), so the essential path is short. Today all 10–12 steps are open.
- **The clock** can fold to its line.

**Accessibility.**
- **Math.** KaTeX output keeps `role="math"` with its flattened label. The KVA table is a real table ("Kvantitet I", "Kvantitet II" as column headers).
- **NOG.** The statements are a list labelled "Påståenden". The fixed options keep their full text as the accessible name ("Alternativ D: i (1) och (2) var för sig").
- **Headings.** The page's `h1` is visually hidden: "Kvantitativa resonemang, fråga 3 av 10". The running head's label is not a heading. The prompt is an `h2`, as in round 1.
- **The opening spread** moves focus to the verdict (`h2`), which is how it is announced (§1.9). The verso is a `region` labelled "Uppgift 3".
- **Reduced motion.** The slide is instant.

**Unmistakably Folio.**
- The problem is set like an exercise in a well-made textbook: its number hangs in the margin, the statements hang too, and a tactic sits in the margin as a printed hint.
- Answering opens the book to its answer key, *facit*, on the facing page.
- No boxes around options, no grey problem card, one ink-blue button.

### Screen 7 · DTK — a diagram, table or map figure (B1)

**Purpose.** Read a figure and answer the questions that belong to it. The **primary action** is **Svara ↵**, then **Nästa fråga ↵**.

**What it shows (plain terms).**
- **The figure is a full printed booklet page** (a JPEG). It includes its "DTK – Diagram, tabeller och kartor" header and page number, and charts are sometimes printed sideways.
- **Several questions share one page:**
  - 218 pages carry 648 questions;
  - most pages have three, some two or four, a couple one;
  - questions on one page come consecutively.
- **A DTK set is 10–13 questions,** because pages are never split.
- **61 pages are landscape,** with an aspect ratio of up to 2.97.
- **Prompts and options are plain text** ("1/3", "1982"). Eleven items have **image options**: pie-chart crops with their printed letter, 120–160 px tall, each with a text name ("Cirkeldiagram A") that is also its alt text.
- After answering, the same facit as screen 6.
- **The facit never claims to point at a region of the figure.** DTK explanations are known to misdescribe visual details, so the design must not imply precision the data lacks.

**Layout — desktop. Always a spread: the figure is DTK's passage.**
- **The verso is the plate** (new: `FigurePlate`).
  - The page image, fitted to the verso's width and the viewport's height, with a 1 px `--fo-rule-2` frame. It is a tipped-in plate.
  - Under it, the caption in italic t13 ink-3: "Sidan 16 i provhäftet · frågorna 4–6".
  - The verso's running head: Avsluta · "KVANT · DTK" · ghost **Förstora** and **Rotera**. These replace Styckefokus, which DTK does not have.
- **The recto:**
  - its running head (dots, "Fråga 5 av 12", the clock);
  - then the page cue as a sentence, "Andra av tre frågor till figuren" (new: `PageGroupCue`);
  - the prompt;
  - the tactic as a closed "Taktik >" disclosure under it (the recto has no free margin for screen 6's margin note);
  - the options and the action bar, exactly as in screen 6.
- **The plate stays put across its questions.** Moving to a question on the same page changes only the recto; the plate keeps its zoom, rotation and scroll. Today every question re-mounts the page, and it slides out and back. A new page turns the verso with `fo-page-in`.
- **Landscape pages** open with the spine at 0.62, so the plate is not a strip. Round 1's maximum (`SPLIT_MAX`) is 0.68, and `Spread` takes no start width today, so B1 adds a start-width prop. **Rotera** turns the plate 90° in place.

```
+----------------------------------------------+--+--------------------------------------------+
| [x Avsluta]  KVANT · DTK [Förstora] [Rotera] |  |  ••••@◦◦◦◦◦◦◦  Fråga 5 av 12       ◷ 09:31 |
| -------------------------------------------- |  | ------------------------------------------ |
|  +----------------------------------------+  |  |  Andra av tre frågor till figuren          |
|  | DTK – Diagram, tabeller och kartor     |  |  |                                            |
|  |                                        |  |  |  Hur stor andel av exporten gick till      |
|  |   <the printed page: a bar chart,      |  |  |  Norge år 2010?                            |
|  |    its table and legend>               |  |  |  Taktik >                                  |
|  |                                        |  |  |  ----------------------------------------- |
|  |                                   16   |  |  |  (A)  12 %                            (/)  |
|  +----------------------------------------+  |  |  (B)  18 %                            (/)  |
|  Sidan 16 i provhäftet · frågorna 4–6        |  |  (C)  24 %                            (/)  |
|                                              |  |  (D)  30 %                            (/)  |
|                                              |  |  ----------------------------------------- |
|                                              |  |  (( Svara  ↵ ))   Välj ett alternativ      |
+----------------------------------------------+--+--------------------------------------------+
```

**Förstora (new: `FigureViewer`).** A full-stage view on the page's own paper, not a black lightbox. It is shared with screen 6's SVG figures.
- **Controls:** fit to screen, drag to pan, pinch or ⌘/Ctrl + wheel to zoom from 100 to 600 %, and a toolbar of words: "Mindre · 150 % · Större · Rotera · Hela sidan".
- **Keys:** + / − / R / Esc.
- **The drill's keys are suspended** while it is open.
- Close returns focus to Förstora.
- **It is a dialog,** built on `FolioDialog` (new, B1): the focus-trap, Esc and return-focus primitive. B2's `FolioSlip` builds on the same primitive.

**Image options.** Each option row's text slot holds its crop (at most 140 px tall), beside the letter circle, with the option's text as the image's accessible name.
- Striking an image option dashes its letter and dims the image to 40 %, because a line-through cannot cross a picture.
- If a crop fails, the row shows the option's text instead.

**Dark theme.**
- **The plate stays a white printed page** inside its hairline frame on the dark paper.
- **It is never inverted or filtered.** Inverting a coloured chart changes what it says.
- The surrounding paper and the recto follow dark mode. This is open question 9.

**Layout — phone.** DTK uses the reading drill's slip, because the figure needs the page the way a passage does.
- **The page:** the plate at full width, a tap opening Förstora, and the caption.
- **The slip** names the question: "Fråga 5 av 12 · andra av tre".
  - The peek shows the prompt plus "Visa de fyra alternativen".
  - Once the slip is open or full, its head adds **Visa figuren ⌄**, which replaces "Visa texten". As in round 1, the peek has no way-back link.
- **The head:** Avsluta, the clock and **Förstora**, with the progress line along its foot. **It does not name the question; the slip does** (round 1's phone rule: progress said once).
- **Landscape pages** sit at full width and are short. The head's Förstora opens the viewer, where Rotera turns them.

```
+--------------------------------------+
| [x]                ◷ 09:31 [Förstora]|
| ####################................ |
| KVANT · DTK                          |
| +----------------------------------+ |
| | <the printed page, full width>   | |
| |                                  | |
| +----------------------------------+ |
| Sidan 16 i provhäftet · frågorna 4–6 |
+--------------------------------------+
| / Fråga 5 av 12 · andra av tre       |
| / Hur stor andel av exporten gick    |
| / till Norge år 2010?                |
| / ((  Visa de fyra alternativen  ))  |
+--------------------------------------+
```

**Reuses.**
- From screen 6: everything on the recto, the opening spread replaced by a spread that is always open, the facit, the colophon and the seam.
- From the round-1 phone drill: `useSheet` and the slip.
- `.fo-runhead`, `.fo-gutter`, `.fo-ghost`.

**New.**
- `FigurePlate`: the persistent verso (plate, caption, rotation).
- `FigureViewer` on `FolioDialog`.
- `ImageOption`.
- `PageGroupCue`: the "Andra av tre frågor till figuren" line.
- A start-width prop on `Spread`.

**States.**
- **Set loading.** The running heads are real at once. The plate is a `--fo-paper-3` box at a portrait page's ratio inside its frame, and the recto is sättning bars, as on screen 6.
- **Plate loading.**
  - A `--fo-paper-3` box at the page's own aspect ratio, inside the hairline frame, with no shimmer.
  - The recto is already readable: the question can be read before the figure arrives.
- **Plate failed.** The erratum inside the frame: "Figuren gick inte att visa." + "Försök igen". Svara stays available, because a reader may know the answer or choose to guess.
- **Image option failed.** The text name stands in.
- **Nothing to practise.** "Inga DTK-frågor klara att öva på just nu." + filled **Till Öva ↵**, as on screen 6.
- **Question not found.** "Hittade inte frågan." + **Till Öva ↵**.
- **Explanation states** are as on screen 6.
- **Done.** The colophon. The facts row counts the real number of questions ("12 FRÅGOR"). Öva's DTK entry says "10–13 frågor", not "10 frågor".

**Navigation.**
- As screen 6.
- Where the product keeps its ⌘K palette (an accelerator, never the way in), the palette gains the DTK drill command it lacks today.

**ADHD-PI.**
- **The figure never moves** while its questions change, so the reader keeps their place on the chart.
- **"Andra av tre frågor till figuren"** says how much of the page is left.
- **Zoom is one press** and returns exactly where it was.

**Accessibility.**
- **The plate's accessible name.** The plate is `role="img"`. Its name is "Figur: sidan 16 i provhäftet, hör till frågorna 4 till 6". A text description of each page is a data follow-up the design leaves room for: a "Beskrivning >" disclosure under the caption, hidden when there is no description.
- **The viewer** is a dialog, and its zoom level is announced.
- **Rotera** has the accessible name "Rotera figuren 90 grader".
- **Headings.** The page's `h1` is visually hidden: "Diagram, tabeller och kartor, fråga 5 av 12". The caption is not a heading, and the prompt is the `h2`.

**Unmistakably Folio.**
- The DTK page is a plate tipped into the book: a hairline frame, an italic caption that says where it is from, the facing page carrying the questions, and a spine.
- The plate stays put like a real plate does while the reader turns through its questions.

### Screen 8 · Repetera (B1)

**Purpose.** Answer the ready misses again, oldest first, until the round is done. The **primary action** is **Börja repetera ↵**, or **Fortsätt repetitionen ↵** when a round is paused.

**What it shows (plain terms).**

*The start page:*
- how many misses are ready now;
- the round's size (at most ten, the most overdue first) and a time estimate;
- the ready count per section, each a way to repeat only that section;
- today's pile as per-section notes of what ripens when ("en till blir redo om åtta minuter");
- the scheduling rule, in words: a right answer moves the miss up the ladder (1, 2, 4, 8, 16 and 30 days, then done); a wrong one brings it back in ten minutes;
- the no-penalty note.

*During the round:* each miss in its own drill layout, with the round's position and, after the answer, where the miss goes next.

*At the end:*
- right and wrong counts and the time;
- how many misses moved up and how many come back;
- the trap behind several misses, when there is one;
- every question of the round, with its graded facit.

**Layout — desktop, start page.** The page grammar (§1.4). The frame stays, and "Öva" stays current.
- The masthead names the place, "ÖVA · REPETERA", and has no meta.
- The standfirst states the rule: "De äldsta först, högst tio åt gången."
- The lead holds the round. Its headline is `.fo-lead-title`.
- The contents list "Kön per delprov" holds the section-only rounds. The counts are the "page numbers", and they sum to the lead's 23.
- The margin holds the scheduling rule and the no-penalty note.

```
+-------------------+----------------------------------------------------------------------------+
| HP·Coach      <<  |  ÖVA · REPETERA                                                            |
|                   |  ------------------------------------------------------------------------  |
|   Idag            |  Dina missar                                                               |
| | Öva          23 |  De äldsta först, högst tio åt gången.                                     |
|   Provpass        |                                                                            |
|   Uppslag         |  ==============================================  |  Så flyttas de fram     |
|   Framsteg        |  DEN HÄR OMGÅNGEN                                |  Rätt svar: frågan      |
|                   |  10 av 23 missar                                 |  kommer tillbaka om 1,  |
|                   |  ungefär 12 minuter                              |  2, 4, 8, 16 och 30     |
|                   |                                                  |  dagar – sedan är den   |
|                   |  (( Börja repetera  ↵ ))                         |  klar.                  |
|                   |  ------------------------------------------------ |  Fel svar: den kommer  |
|                   |  Kön per delprov                        redo nu  |  tillbaka om tio        |
|                   |  ------------------------------------------------ |  minuter.              |
|                   |  ORD  Ordförståelse . . . . . . . . . . . 7  →   |                         |
|                   |       en till blir redo om åtta minuter          |  Inga poängavdrag för   |
|                   |  LÄS  Svensk läsförståelse . . . . . . . . 4  →  |  fel – gissa hellre än  |
|                   |  MEK  Meningskomplettering . . . . . . . . 2  →  |  att lämna en fråga     |
|                   |  NOG  Kvantitativa resonemang . . . . . .  6  →  |  obesvarad.             |
|                   |  DTK  Diagram, tabeller och kartor . . . . 4  →  |                         |
+-------------------+----------------------------------------------------------------------------+
```

**Layout — desktop, during the round.** Focus mode: each miss opens in its section's drill layout (screen 2 for LÄS, 6, 7 and 14). Only the running heads change:
- **Verso head:** "Avsluta · REPETITION · LÄS · ÖVNINGSTEXT" (the badge only for P5 texts) · Styckefokus.
- **Recto head:** the round's dots, "Miss 3 av 10" and the clock.
- **The verdict gains one line** that says where the miss goes. It is the round's only new element:

```
   (x)  Fel. Rätt svar är D.
        Frågan kommer tillbaka om tio minuter.
   ---- (the facit follows, unchanged: Därför lockade A · Att ta med dig · Lösningen · Steg för steg)
   (( Nästa miss  ↵ ))        Miss 4 av 10 väntar
```
- A right answer reads: "Rätt. Svaret är D." / "Frågan kommer tillbaka om fyra dagar."
- The view model may supply the reader's earlier wrong pick. If it does, it sits in the recto's margin after grading, never before, so it cannot prime the answer: "Förra gången: A · 12 september".

**Layout — end of the round.** The colophon, with one addition: a disclosure "Hela omgången >" under the facts row. It opens a ruled list:
- one row per miss: its number, section, short stem, and the outcome as glyph plus word ("✓ rätt", "✗ ditt B · rätt A");
- each row opens that question in its graded, read-only facit view;
- "Tillbaka till omgången" returns to the list.

```
                         ⁂
                    Repetitionen
          ------------------------------------
          10 FRÅGOR · 7 RÄTT · 11 MIN
          ------------------------------------
     Sju missar flyttas fram och tre kommer tillbaka om tio
     minuter. Fällan bakom två av dem: Rätt valens, fel objekt.

              (( Nästa: ELF-lektion · 6 min  ↵ ))
                       Till Öva
                    Hela omgången >
```

**Layout — phone.**
- **Start page:** one column (lead → "Kön per delprov" → the margin's two notes), with a full-width filled button.
- **During the round:** the phone drill. A reading miss gets the passage and the question slip; a single-page miss gets the page with its foot action (screen 6). The slip's head reads "Miss 3 av 10".
- **The end:** the phone colophon, with the action anchored at the foot.

```
+--------------------------------------+
| HP·Coach                        (o)  |
| ÖVA · REPETERA                       |
| Dina missar                          |
| De äldsta först, högst tio åt        |
| gången.                              |
| ==================================== |
| DEN HÄR OMGÅNGEN                     |
| 10 av 23 missar                      |
| ungefär 12 minuter                   |
| ((       Börja repetera          ))  |
| ------------------------------------ |
| Kön per delprov              redo nu |
| ORD  Ordförståelse              7 →  |
|      en till blir redo om åtta       |
|      minuter                         |
| LÄS  Svensk läsförståelse       4 →  |
| …                                    |
+--------------------------------------+
| Idag   Öva•  Provpass  Uppslag  Fram |
+--------------------------------------+
```

**Reuses.**
- `FolioPage`, the masthead, `.fo-resume` as the lead (no ribbon unless paused), and `ContentsEntry` from screen 5.
- The drill layouts of screens 2, 6, 7 and 14, unchanged except for the running head's label and the verdict's second line.
- `Verdict`, extended with an optional `after` line.
- `Colophon`, extended with an optional disclosure slot.
- `.fo-more`, `Dots`.

**New.**
- `RoundList`: the ruled list of the round's questions, with an outcome word per row. B2's pass review (screen 10) reuses it.
- `Verdict.after`, the one-line "kommer tillbaka om …".

**States.**
- **Loading.**
  - The page's heads are real at once.
  - The lead is "sättning".
  - The button reads **Börja repetera** but is not yet focusable; it is drawn as `:disabled`.
  - **Never** an empty sentence before the queue is known. Today the start screen shows "Inga missar än" under "Laddar…".
- **Paused round.** The lead takes the ribbon: "Pausad vid miss 3 av 10 · idag 12:40". The filled button is **Fortsätt repetitionen ↵**, and a quiet "Börja om" sits beside it.
  - **Show it only for a round of the same scope.** Today "Fortsätt övning" shows for any open session and then silently starts a fresh one.
- **Ten or fewer ready.** The lead's headline is the count itself ("Sex missar"). More than ten reads "10 av 23 missar" (one comparison, one form), which carries the real copy's "Repetera 10 av 23 missar denna session" as a headline.
- **Empty, three distinct cases.** Each ends with the filled **Börja en övning** pointing at the suggested section, not a hard-coded ORD.

  | Case | Copy (real; the ripening time is new) |
  |---|---|
  | Never missed | "Inga missar än – när du svarar fel i en övning landar frågan här." |
  | Pile but none ready | "Inget är redo just nu – tre missar ligger i dagens hög och blir redo om åtta minuter." |
  | All relearned | "Kön är tom just nu – allt du missat är återlärt." |

- **Section scope, empty.** "Inga NOG-missar att repetera just nu."
  - When the whole queue has ready misses, the filled button is **Repetera hela kön ↵**. Today "Hela kön finns under Repetera i Öva" is plain text with no link.
  - When it does not, the filled button is **Börja en övning ↵**.
- **Section scope kept.** A section-only round stays section-only through "Börja om", resume and the end's links. Today the scope is dropped on finish and on resume.
- **A retired P5 text in the round.** Its row and its place in the round read "Den här övningstexten har tagits ur bruk." It is skipped, and it does not count as learned.
- **Error.** The erratum "Gick inte att hämta just nu – försöker igen automatiskt." The button stays drawn but inert. **Never** "Laddar…" forever.
- **Done.** The colophon above. With no misses: "Inga missar i den här omgången." + "Tre till blir redo om åtta minuter." when that is true. Today's "Snyggt." can be wrong when more misses wait.

**Navigation.**
- **In:**
  - Öva's lead and its "Välj delprov";
  - Idag's plan row "Repetition";
  - the colophon's "Nästa: Repetition";
  - the lesson page's "Repetera dina missar" (screen 12);
  - Historik's repetition rows, which open the end page of that round;
  - the palette.
- **Out, during the round:**
  - **Avsluta** leaves at once, saved and resumable. Its title says "Dina svar är sparade". There is no confirm sheet: today's sheet claims "Dina svar hittills sparas inte.", which is false.
  - Phone keeps the Avsluta in its head. Today the phone pass has no visible exit.
- **Out, at the end:** the plan's next part (filled), "Till Öva" (quiet), and Esc to the origin.

**ADHD-PI.**
- **A known, small round.** Ten at most, the time stated, oldest first, so the order is never a decision.
- **Outcomes said as time, not as failure.** "kommer tillbaka om tio minuter" makes a miss a scheduled return, not a mark against the reader.
- **One action at a time.** No streak and no "perfekt!".
- **Resume is honest**, and Avsluta never warns falsely.

**Accessibility.**
- **Announcements.** The verdict receives focus after Svara (screen 6), so it is announced once, with its "kommer tillbaka" line inside it (§1.9).
- **The round list.** Rows are buttons whose names read as sentences ("Fråga 4, NOG, fel: ditt B, rätt A. Visa facit"). The ✓/✗ glyphs are `aria-hidden` beside their words.
- **The section rounds** are an `h2`-headed list.

**Unmistakably Folio.**
- The round is a lead under the heavy rule.
- The queue per section is a contents list with counts where page numbers go.
- The scheduling rule is set as marginalia.
- The end is a colophon with an errata-like ruled list behind a quiet disclosure. There is no streak flame or confetti, and no progress ring.

### Screen 9 · Provpass — the hub and a running pass (B2)

**Purpose.**
- **Hub:** choose one pass and commit to it. The **primary action** is **Starta provpasset ↵** on the lead (the pass the reader has seen least). It opens the conditions slip, and only that slip's **Starta nu ↵** starts the clock.
- **Running pass:** answer 40 questions against a hard 55-minute clock with no feedback. The **primary action** is **Nästa fråga ↵**. On the last question it becomes **Lämna in ↵**.

**What it shows (plain terms).**

*Hub:*
- **Two choices:**
  - the half: Verbal or Kvantitativ;
  - the mode: Riktigt pass (one printed pass, in printed order) or Genererat pass (a mix from all sittings, the least-seen questions first, passages and DTK pages kept whole).
- **Each half's composition:**
  - Verbal: ORD 10 · LÄS 10 · MEK 10 · ELF 10;
  - Kvantitativ: XYZ 12 · KVA 10 · NOG 6 · DTK 12;
  - always 40 questions in 55 minutes.
- **The suggested pass** for the half: the sitting name, the pass number, how many of its 40 questions the reader has seen, and the reader's name ("Inskriven").
- **The register of sittings**, newest first: 27 today, each with Provpass 1 and 2 and the reader's exposure ("sett X/40"). Missing passes show "—"; a short pass shows its true size.
- **The conditions:**
  - no pause;
  - answers can change until time runs out;
  - abandoning voids the pass;
  - wrong answers cost nothing.
- How each mode is scored: the sitting's UHR table, or a linear estimate.
- A pass already running, with its time left.
- **New:** the last results. Today the hub shows none.

*Running pass:*
- the question, laid out as in its drill but never graded;
- the position;
- answered versus unanswered;
- the time left;
- the section;
- the whole pass's index;
- the ÖVNINGSTEXT badge on P5 texts. After the LÄS/ELF switch (hpf-8s3r), a verbal pass's LÄS and ELF are övningstexter.

**Layout — desktop, hub.** The page grammar.
- **The masthead** is the label alone. The last result lives in the margin.
- **Title and standfirst** are today's: "Anmälan." and "40 frågor, 55 minuter, riktiga provvillkor – ingen feedback förrän du lämnar in."
- **The two choices** are a line of `.fo-seg` word pairs under the standfirst.
- **The lead** is the *kallelse*, the exam notice, set under the heavy rule like a printed summons. Its headline (the pass) is `.fo-lead-title`.
- **The register** is a ruled table with leader dots from the sitting to its two passes.
- **Choosing a cell moves the lead to that pass.** Its label becomes "VALT PASS", and ↵ still starts it. The filled button stays in the lead and follows the choice.
- **Genererat pass:** the lead becomes the generated pass ("Hopplockat ur alla provtillfällen – de minst sedda frågorna först.") and the register is hidden. The margin's "Poängen" note then explains "indikativ".

```
+-------------------+----------------------------------------------------------------------------+
| HP·Coach      <<  |  PROVPASS                                                                  |
|                   |  ------------------------------------------------------------------------  |
|   Idag            |  Anmälan.                                                                  |
|   Öva          23 |  40 frågor, 55 minuter, riktiga provvillkor – ingen feedback förrän du     |
| | Provpass        |  lämnar in.                                                                |
|   Uppslag         |  Halva  Verbal · Kvantitativ          Läge  Riktigt pass · Genererat pass  |
|   Framsteg        |         ------                              ------------                   |
|                   |  ==============================================  |  Villkoren              |
|                   |  KALLELSE · MINST SETT                           |  Ingen paus. Du kan     |
|                   |  Hösten 2025, provpass 2                         |  ändra svar tills tiden |
|                   |  Verbal · ORD 10 · LÄS 10 · MEK 10 · ELF 10      |  går ut. Avbryter du    |
|                   |  Du har sett 3 av 40 frågor. Inskriven: {namn}   |  blir provet ogiltigt.  |
|                   |                                                  |  Fel ger inga avdrag.   |
|                   |  (( Starta provpasset  ↵ ))                      |                         |
|                   |  ------------------------------------------------ |  Poängen               |
|                   |  Register                     27 provtillfällen  |  Ett riktigt pass rättas|
|                   |  ------------------------------------------------ |  mot provtillfällets   |
|                   |                        Provpass 1    Provpass 2  |  normeringstabell.      |
|                   |  Hösten 2025 . . . . . sett 0/40     sett 3/40 < |                         |
|                   |  Våren 2025  . . . . . sett 12/40    sett 40/40  |  Senaste passen         |
|                   |  Hösten 2024 . . . . . —             sett 0/40   |  Verbal   31/40   1,55  |
|                   |  …                                               |  12 okt                 |
|                   |                                                  |  Alla pass i Historik → |
+-------------------+----------------------------------------------------------------------------+
```
(The `<` in the register marks the suggested cell with the 2 px accent rule of a current entry. The ribbon is kept for a running pass.)

**The conditions slip** (modal; desktop: centred in the top third over `--fo-scrim`; phone: a bottom slip). It replaces today's sheet and keeps its copy:

```
          / STARTA PROVPASS                                     /
          / ==================================================== /
          / Hösten 2025, provpass 2                              /
          / Verbal · 40 frågor · 55 minuter                      /
          / ---------------------------------------------------- /
          / 1  Ingen paus.                                       /
          / 2  Du kan ändra svar tills tiden går ut.             /
          / 3  Avbryter du blir provet ogiltigt.                 /
          / 4  Lämna ingen fråga obesvarad – fel ger inga avdrag./
          / ---------------------------------------------------- /
          / (( Starta nu  ↵ ))            Inte nu  (Esc)         /
```

**Layout — desktop, running pass.** Focus mode, no frame. Each question uses its drill layout: the reading spread (screens 2 and 14), the DTK spread (screen 7) or the single page (screen 6). Three things change.

1. **The running heads.**
   - Left of the first head: **Avbryt passet**. It is a ghost button, and it is the verb that voids.
   - Centre: "PROVPASS · LÄS · ÖVNINGSTEXT". On desktop the badge lives here only, as in round 1; the passage's tools row keeps just "Om texten".
   - Right of the last head: "Fråga 14 av 40", the ghost **Översikt**, and the clock as time *left* ("41:08 kvar").
2. **The pass index (new: `PassIndex`).** A 3 px strip under the last running head, cut into one segment per question with a gap between sections, like a thumb index on a booklet's edge.
   - Answered segments are `--fo-ink-2`, unanswered `--fo-rule-2`, and the current one `--fo-accent`.
   - Hover or focus pulls a tab out ("Fråga 22 · obesvarad"); a press goes there.
   - It sits out of the tab order. The keyboard uses ←/→ and the Översikt slip.
3. **The recto never grades.**
   - Choosing an option saves it, and the echo says so: "Ditt val: B · sparat".
   - Striking stays available.
   - **Nästa fråga works with nothing chosen.** Skipping is allowed, and the question stays unanswered in the index.
   - There is no "Taktik" hint, because these are real conditions.
   - The key hint row shows on the first question only.

```
+--------------------------------------------+--+---------------------------------------------+
| [x Avbryt passet] PROVPASS·LÄS·ÖVNINGSTEXT |  |  Fråga 14 av 40  [ Översikt ]  ◷ 41:08 kvar |
| ------------------------------------------ |  | ------------------------------------------- |
|  Om texten                                 |  | #### # ### ##.  ......  ..........  ....... | <- PassIndex
|  Magasinet i Hökaryd                       |  |                                             |
|  en handbok om socknens spannmål           |  |  Vad menar recensenten med att boken        |
|                                            |  |  ”förbigår” frågan om …?                    |
|  1  Det är inte varje dag …                |  |  ------------------------------------------ |
|  2  …                                      |  |  (A)  …                                (/)  |
|                                            |  |  (B)  …                    Ditt val    (/)  |
|                                            |  |  (C)  …                                (/)  |
|                                            |  |  (D)  …                                (/)  |
|                                            |  |  ------------------------------------------ |
|                                            |  |  (( Nästa fråga  ↵ ))  Ditt val: B · sparat |
+--------------------------------------------+--+---------------------------------------------+
```
For single-page questions (ORD, MEK, XYZ, KVA, NOG), one running head carries all of it: "[x Avbryt passet] · PROVPASS · ORD · Fråga 3 av 40 · [Översikt] · ◷ 52:40 kvar".

**The Översikt slip.** Four section groups, headed by the right codes: ORD LÄS MEK ELF, or XYZ KVA NOG DTK. Today's index says "SVE", "MEN", "ENG", "MAT", "DIA", and labels KVA and NOG alike.
- Each question is a numeral. Answered numerals are underlined in ink; unanswered ones are `--fo-ink-3` with the word "obesvarad" for screen readers; the current one has an accent ring.
- The slip's filled button is **Lämna in ↵**. "13 av 40 besvarade" stands in the slip's head.

```
     / ÖVERSIKT                                   13 av 40 besvarade /
     / ============================================================= /
     / ORD   1  2  3  4  5  6  7  8  9  10                           /
     /       -  -  -  -  -  -  -  -  -  -    (underlined = besvarad) /
     / LÄS   11 12 13 (14) 15 16 17 18 19 20  ( ) = här är du        /
     /       -  -  -                                                 /
     / MEK   21 … 30                                                 /
     / ELF   31 … 40                                                 /
     / ------------------------------------------------------------- /
     / (( Lämna in  ↵ ))                 Tillbaka till passet (Esc)  /
```

**The hand-in slip.**
- Title: "Lämna in provpasset?"
- Body: "Tre frågor är obesvarade – fel ger inga avdrag, så gissa hellre." The singular is right: "En fråga är obesvarad".
  - With nothing unanswered, the body reads "Alla 40 frågor är besvarade." and the number links are dropped.
- The unanswered numbers follow as links ("Fråga 14 · 22 · 37").
- **Lämna in ↵** (filled) and "Tillbaka till passet" (quiet). Handing in is not destructive: the answers are kept and scored.

```
     / LÄMNA IN PROVPASSET?                                          /
     / ============================================================= /
     / Tre frågor är obesvarade – fel ger inga avdrag, så gissa      /
     / hellre.  Fråga 14 →  22 →  37 →                               /
     / ------------------------------------------------------------- /
     / (( Lämna in  ↵ ))                 ( Tillbaka till passet )    /
```

**The abandon slip.**
- Title: "Avbryta provpasset?"
- Body: "Avbryter du blir provet ogiltigt. Dina missar hamnar i Repetera."
- The filled, safe default is **Fortsätt provpasset ↵**. **Avbryt passet** sits under a double rule as a quiet button.
- These slips replace today's browser `confirm()` dialogs.

```
     / AVBRYTA PROVPASSET?                                           /
     / ============================================================= /
     / Avbryter du blir provet ogiltigt. Dina missar hamnar i        /
     / Repetera.                                                     /
     / (( Fortsätt provpasset  ↵ ))                                  /
     / ------------------------------------------------------------- /
     / ------------------------------------------------------------- /
     / ( Avbryt passet )                                             /
```

**Layout — phone.**
- **Hub:**
  - title, standfirst and the two word pairs (wrapping);
  - the kallelse lead with a full-width button;
  - the register as entries grouped by sitting (an italic sitting head, then "Provpass 1 · sett 0/40 →" and "Provpass 2 · sett 3/40 →"). The phone reader can pick Provpass 1 or 2 again; today the phone auto-picks;
  - only the three newest sittings show until "Visa alla 27 provtillfällen >";
  - the margin's notes follow.
- **Running pass:** the phone drill.
  - **The head:** "[x] · ◷ 41:08 kvar · [Översikt]", folding to a strip while reading. The PassIndex is its foot line, replacing the progress line.
  - **The question is named once.**
    - Reading and DTK questions keep the slip, which names it ("Fråga 14 av 40"); the head does not.
    - Single-page questions have no slip, so their head adds "Fråga 3 av 40", and **Nästa fråga** is anchored at the foot.
  - **The badge** follows round 1's phone rule. It sits above the passage. The slip adds "· ÖVNINGSTEXT" only once the passage's badge has scrolled away.

```
+--------------------------------------+      +--------------------------------------+
| HP·Coach                        (o)  |      | [x]        ◷ 41:08 kvar  [Översikt]  |
| PROVPASS                             |      | #### # ### ##.  ......  .........    |
| Anmälan.                             |      | ÖVNINGSTEXT   Om texten              |
| 40 frågor, 55 minuter, riktiga       |      | Magasinet i Hökaryd                  |
| provvillkor – ingen feedback förrän  |      |  1  Det är inte varje dag …          |
| du lämnar in.                        |      |  2  …                                |
| Halva  Verbal · Kvantitativ          |      |                                      |
| Läge   Riktigt pass · Genererat pass |      +--------------------------------------+
| ==================================== |      | / Fråga 14 av 40                     |
| KALLELSE · MINST SETT                |      | / Vad menar recensenten med att      |
| Hösten 2025, provpass 2              |      | / boken ”förbigår” frågan om …?      |
| Verbal · ORD 10 · LÄS 10 · MEK 10 ·  |      | / (( Visa de fyra alternativen ))    |
| ELF 10                               |      +--------------------------------------+
| ((     Starta provpasset         ))  |
+--------------------------------------+
| Idag   Öva•  Provpass  Uppslag  Fram |
+--------------------------------------+
```

**Reuses.**
- `FolioPage`, the masthead, `.fo-seg` (the two choices), `.fo-resume` as the kallelse lead, and `ContentsEntry` (phone register).
- `.fo-menu` and `.fo-scrim` as the base of every slip.
- The drill layouts (screens 2, 6, 7 and 14) with `Options` but without grading.
- `.fo-runhead`, `ClockButton`, `TimeLine`, `.fo-echo`, `.fo-kbd`, and `useSheet` on phone.

**New.**
- `FolioSlip`: a modal slip, its heading underlined by the heavy rule, built on B1's `FolioDialog`. Desktop centres it over the scrim; phone is a bottom slip. Screen 13 reuses it.
- `RuledTable`: a real `<table>` with hairline rows, a Literata first column, lining tabular figures, and optional leader dots from the first column. Screens 10 and 11 reuse it.
- `PassIndex`: the strip, plus its slip grid.
- `Countdown`: the clock counting down from 55:00, with milestones.

**States.**

*Hub:*
- **First visit:** every pass reads "sett 0/40". The kallelse is the newest sitting's Provpass 1. The margin's "Senaste passen" says "Inga pass ännu – det första blir din baslinje."
- **Loading:** sättning. **Never** the empty message: today "Inga riktiga pass tillgängliga just nu …" shows while loading and stays forever on error.
- **Error:** the erratum "Passen gick inte att hämta just nu." + "Försök igen". The Genererat choice still works if the question bank is loaded.
- **A pass is running** (on this device or another): the lead takes the ribbon.
  - Label: "PÅGÅR · 32 MIN KVAR". Headline: the pass. Line: "13 av 40 besvarade".
  - The filled button is **Fortsätt provpasset ↵**. "Avbryt passet" follows as a quiet link under a double rule.
  - **This replaces today's silent jump into the pass.** Idag's lead shows the same running pass. Today nothing tells the reader a pass is running.
- **A pass older than 55 minutes:** ended, with a one-line note in the lead's place: "Passet från idag 09:10 hann ta slut innan det lämnades in. Det räknas inte."
- **After abandoning:** the erratum "Provet avbröts – ogiltigt. Dina missar ligger i Repetera." until the next start.

*Running pass:*
- **Loading** (the first question and its passage). The running heads, the clock and the index are real at once, because the clock is already running. The page is sättning bars; the slip on phone shows its head only.
- **Five minutes left:**
  - a folded clock comes back in place. The line gives way to the clock's figures by opacity only (120 ms), and nothing moves;
  - "Fem minuter kvar" is announced once (polite), and the clock's figures turn 600 weight in ink;
  - there is **no red and no flashing**. Today it turns bold red.
- **One minute left:** "En minut kvar", announced once.
- **Time out:** the pass is handed in automatically and the result says so (screen 10). Today there is no message.
- **Resumed:** a one-time line above the prompt: "Välkommen tillbaka – klockan har gått vidare. 32 min kvar."
- **Hand-in fails:** the erratum inside the hand-in slip, "Inlämningen gick inte fram. Dina svar är sparade.", and **Försök igen ↵**. Today the screen stays stuck with no retry.
- **Keys and taps that cannot count are ignored.** E on a four-option question records nothing, and a double tap on Starta nu creates one session.

**Navigation.**
- **In:**
  - the Provpass door;
  - Idag's plan, when it suggests a pass (the live Home's kallelse card). It goes **straight to this hub's conditions slip for that pass**. Today Home opens its own targetless sheet, and then the hub asks again;
  - the palette;
  - `?half=`.
- **Out:**
  - the conditions slip starts the pass;
  - **Lämna in** or time out opens screen 10;
  - **Avbryt passet** returns to the hub with the void note;
  - browser back or a deep link away during a pass opens the slip "Passet pågår – klockan går vidare. Du kan komma tillbaka så länge tiden räcker – 41 min kvar." with **Stanna ↵** and "Lämna sidan".

**ADHD-PI.**
- **Conditions said before the clock starts**, once, in four short lines. No surprise mid-pass.
- **The hub chooses for the reader** (the kallelse). The register is there only for those who want it.
- **Time pressure is bounded:**
  - the remaining time is always one glance away;
  - it can fold to the line;
  - milestones arrive as words, not alarms.
- **Plain progress.** The index shows what is left without a 40-cell grid shouting at the reader.
- **No auto-advance.**
- **A safe exit.** A mis-tap on Avbryt lands on a slip whose default is to continue.

**Accessibility.**
- **The clock** is `role="timer"` without `aria-live`. Its accessible name is "41 minuter och 8 sekunder kvar". Milestones are separate polite status messages.
- **The Översikt grid** is a `nav` "Frågor i passet" holding four lists. Each link reads "Fråga 22, LÄS, obesvarad".
- **Slips** are dialogs with focus trap, Esc and return of focus.
- **Choices** are `.fo-seg` groups (`fieldset` + `aria-pressed`).
- **The register** is a real table. Each cell's button reads "Hösten 2025, provpass 2, sett 3 av 40".

**Unmistakably Folio.**
- The hub is a printed exam notice: "Anmälan.", a kallelse under the heavy rule, a register with leader dots, and the conditions set as a numbered note on a slip.
- The pass keeps the book's running heads.
- Its index is cut into the page's edge like a booklet's thumb index.
- One ink-blue button throughout.

### Screen 10 · Provpassresultat (B2)

**Purpose.** Report the finished pass honestly, then turn it into learning. The **primary action** is **Gå igenom missarna ↵**: the pass's misses (wrong answers and blanks), one at a time, with their facit. Today the result has no action at all, and on phone it is a dead end with no navigation.

**What it shows (plain terms).**
- **Which pass:** the half, the mode, and the sitting and pass number. Today the sitting is not shown.
- **When and how it ended:** handed in, or time ran out.
- **The total time used** (saved today but not shown).
- **Right answers** of those presented (31 av 40), and a short pass's true size ("En fråga saknas i det här passet, så det rättades på 39.").
- **The score** on 0–2,0:
  - riktigt pass: read from the sitting's UHR table ("normerat (härlett)"), with two decimals;
  - genererat pass: "skattad poäng", indikativ, linear;
  - each with its footnote. A pass containing P5 texts adds the estimate caveat.
- **Per section, in test order** (today's are alphabetical):
  - right answers;
  - time used against the section's budget (55 min × quota ÷ 40: 13:45, 16:30 or 8:15). The budget is scaled for a short pass, which today it is not.
- The recurring trap, when two or more misses share one (today quant only).
- Exposure ("Du hade sett 6 av 40 frågor innan.").
- The earlier passes of the same half and mode, **on the same scale as this one**. Today history shows the linear value even for an authentic pass.
- **The misses**, wrong answers and blanks, with the reader's answer and the right one, and where they went. The final wrong answers join Repetera; blanks and corrected picks do not. Said once, under the list's head: "Sex missar ligger nu i Repetera; tre lämnades obesvarade."

**Layout — desktop.** The page grammar, with the frame back (the pass is over).
- **Colophon head:** a small ⁂ in the accent above the title "Provpasset klart." (the real heading). The standfirst is one sentence about the ending.
- **The lead holds the display figure:** `t44` lining figures plus its footnote asterisk, "normerat (härlett) · av 2,0", "31 av 40 rätt", and the round-1 `Scale` (0–2,0 ticks, a mark, no range band: this is one result, not a forecast). Then the filled button.
- **"Per delprov"** is one `RuledTable` that merges today's two blocks (per-section bars, tempo table). Over budget is said in words, "över budget", in italic ink-2, never red.
- **"Missarna"** is a `RoundList` (screen 8). Blanks are rows too ("obesvarad · rätt B").
- **Margin:** "Tidigare pass", "Återkommande fälla", "Exponering".
- **The footnotes** close the main column.
  - The normering footnote adapts today's copy so that "delprov" keeps this app's meaning (a section): "UHR normerar hela den verbala delen" (kvant: "den kvantitativa delen").
  - Today's copy reads "hela delprovet".

```
+-------------------+----------------------------------------------------------------------------+
| HP·Coach      <<  |  PROVPASS · RESULTAT                Hösten 2025, provpass 2 · idag 14:32   |
|                   |  ------------------------------------------------------------------------  |
|   Idag            |  ⁂                                                                         |
|   Öva          23 |  Provpasset klart.                                                         |
| | Provpass        |  Verbal, riktigt pass. Du lämnade in efter 52 minuter.                     |
|   Uppslag         |                                                                            |
|   Framsteg        |  ==============================================  |  Tidigare pass          |
|                   |  1,40*        normerat (härlett) · av 2,0        |  Verbal · riktiga pass  |
|                   |               31 av 40 rätt                      |  12 okt   29/40   1,30  |
|                   |  |-----|-----|-----|---|-|-----|                 |  28 sep   27/40   1,15  |
|                   |  0    0,5   1,0   1,5    2,0                     |  Alla pass i Historik → |
|                   |                                                  |                         |
|                   |  (( Gå igenom missarna  ↵ ))                     |  Exponering             |
|                   |  ------------------------------------------------ |  Du hade sett 6 av 40  |
|                   |  Per delprov                                     |  frågor innan.          |
|                   |  ------------------------------------------------ |                        |
|                   |               Rätt      Tid    Budget            |                         |
|                   |  ORD . . . .  9/10    06:12     13:45            |                         |
|                   |  LÄS . . . .  7/10    18:40     13:45  över budget                         |
|                   |  MEK . . . .  8/10    12:02     13:45            |                         |
|                   |  ELF . . . .  7/10    15:04     13:45  över budget                         |
|                   |  ------------------------------------------------ |                        |
|                   |  Missarna                                        |                         |
|                   |  Sex missar ligger nu i Repetera; tre lämnades obesvarade.                 |
|                   |  14  LÄS  Vad menar recensenten …  ditt B · rätt D  →                      |
|                   |  22  MEK  …                        ditt A · rätt C  →                      |
|                   |  37  ELF  …                        obesvarad · rätt B  →                   |
|                   |  …                                               |                         |
|                   |  ------                                          |                         |
|                   |  * Härlett ur UHR:s normeringstabell för detta provtillfälle. UHR          |
|                   |    normerar hela den verbala delen (80 frågor) – ett provpass på 40        |
|                   |    frågor har ingen officiell tabell, så poängen skalas upp och läses      |
|                   |    av tabellen.                                                            |
|                   |  ** Uppskattningen för LÄS och ELF bygger på HP-Coachs övningstexter, …    |
+-------------------+----------------------------------------------------------------------------+
```

**The review** (the primary action) is a focus screen.
- Each miss opens in its drill layout in the graded facit state (screens 3, 6, 7 and 14), with the pass's own answer as "Ditt svar". It is read-only.
- The running head reads "PROVPASSET · GENOMGÅNG · Miss 2 av 9".
- **Nästa miss ↵** is filled. "Tillbaka till resultatet" sits where Avsluta sits.
- The last miss's button is **Slutför genomgången ↵**, which returns to this page.

**Layout — phone.** One column:
1. The masthead (two lines), ⁂, the title and the sentence.
2. The figure (`t44`) and its scale.
3. A full-width **Gå igenom missarna**.
4. "Per delprov" as the table.
   - The four columns fit at 350 px, and "över budget" drops under its row.
   - Below 360 px, the Budget column joins that second line too ("budget 13:45 · över budget"), so the table reflows at 320 px without scrolling.
5. "Missarna" as entries.
6. The margin's three notes, then the footnotes.

The tabs are back.

```
+--------------------------------------+
| HP·Coach                        (o)  |
| PROVPASS · RESULTAT                  |
| Hösten 2025, provpass 2 · idag 14:32 |
| ⁂                                    |
| Provpasset klart.                    |
| Verbal, riktigt pass. Du lämnade in  |
| efter 52 minuter.                    |
| ==================================== |
| 1,40*  normerat (härlett) · av 2,0   |
| 31 av 40 rätt                        |
| |-----|-----|-----|---|-|-----|      |
| ((    Gå igenom missarna         ))  |
| ------------------------------------ |
| Per delprov     Rätt   Tid   Budget  |
| ORD             9/10  06:12  13:45   |
| LÄS             7/10  18:40  13:45   |
|                       över budget    |
| …                                    |
+--------------------------------------+
| Idag   Öva•  Provpass  Uppslag  Fram |
+--------------------------------------+
```

**Reuses.**
- `FolioPage`, the masthead, `.fo-resume` as the lead (no ribbon), `.fo-prog-n` (`t44`) for the figure, and `.fo-footnote` (now numbered `*`, `**`).
- `Scale`, with the band hidden. It is private to `FolioHome` and reads the fixture today, so B2 exports it with parameters.
- The marginalia blocks, `RoundList` (screen 8) and `RuledTable` (screen 9).
- The graded drill views for the review.

**New.** `ResultFigure`: the figure, its label, the raw count and the scale as one unit. Framsteg (screen 11) reuses it for its prognosis, then with the band.

**States.**
- **Loading:** sättning. The figure is a bar until its scale is known.
  - **Never** show the linear value first and then swap it for the normed one. Today an authentic score changes in front of the reader.
- **Just handed in:** sättning until the saved result is readable. **Never** flash "Hittar inte resultatet".
- **Time ran out:** the standfirst says "Tiden tog slut – passet lämnades in automatiskt efter 55 minuter."
- **Genererat pass:**
  - the label is "skattad poäng · av 2,0";
  - the footnote is "Linjär skattning – indikativ, inte UHR-normerad.";
  - the margin's "Tidigare pass" lists generated passes;
  - there is no sitting in the masthead, only "Genererat pass · idag 14:32".
- **Short pass:** "En fråga saknas i det här passet, så det rättades på 39." under the raw count. Today's wording is "1 fråga saknas ur detta pass — rättat av 39." The budgets are scaled.
- **No misses:**
  - the primary action becomes **Nytt provpass ↵**;
  - "Missarna" becomes one italic line: "Inga missar i det här passet.";
  - no confetti; the ⁂ is the celebration.
- **No earlier passes:** "Inga tidigare pass av samma sort ännu." (the real copy).
- **Not found or too old:**
  - "Hittar inte resultatet." + "Det här provpasset finns inte längre, eller så laddades det aldrig upp." (the real copy);
  - the filled button is **Till Provpass ↵**;
  - Idag stays one press away in the frame.
- **Partial:** a resumed pass's section times may be wrong today, because resumes add up running totals. When a time is not trustworthy, show it as "—" with a footnote ("Tiden kunde inte mätas för ett återupptaget pass.") rather than as an inflated number.

**Navigation.**
- **In:**
  - Lämna in, or time out;
  - Historik's pass rows, both on Framsteg and on its Historik page;
  - Idag's "Senaste passen", whose rows become links (§3);
  - a deep link (`?result=`).
- **Out:**
  - the review (filled);
  - "Nytt provpass →" to the hub;
  - the frame.
- **Esc** goes to Provpass, not browser back.

**ADHD-PI.**
- **One figure, said once, with its caveat attached.** The figure is not repeated in a hero, a table and the history.
- **Tempo said in words.** "över budget" tells the reader where the minutes went without a red alarm.
- **The next step is learning, not another score.** The review comes first.
- **The misses' destination is stated** ("ligger i Repetera"), so nothing feels lost.

**Accessibility.**
- **The figure.** Its accessible name is one sentence: "1,40 av 2,0, normerat och härlett, 31 av 40 rätt". The scale is `role="img"` with the same sentence. The footnotes are linked with `aria-describedby`.
- **The tables.** "Per delprov" has `<caption>` "Per delprov: rätt, tid och budget" and `th scope="row"` for each section.
- **Over budget is a word**, never a colour.

**Unmistakably Folio.**
- The result is set like a book's closing page and appendix: ⁂ over the title, one large light figure with a numbered footnote, a ruled table with leader dots in test order, and the misses as an errata list.
- One ink-blue button, and no dashboard tiles.

### Screen 11 · Framsteg, including Historik (B2)

**Purpose.** See where you stand, and do the one thing that lifts the estimate most.
- The **primary action** is the lead's **Öva ORD · 10 frågor ↵**: the first Fokus suggestion. Today Framsteg has no primary action.
- Historik is Framsteg's back matter: a dated ledger of every finished pass.

**What it shows (plain terms).**
- **The estimate.**
  - The projected total on 0–2,0: the mean of the verbal and kvant halves. It needs answers in both halves.
  - Each half's figure, and the change since last week. The change pools sections with at least five answers in both windows.
  - A likely range, when the view model has one. Today the total has no range, but each section has a 95 % band.
  - **The calibration caveat, verbatim, whenever LÄS or ELF feed the figure: "Uppskattningen för LÄS och ELF bygger på HP-Coachs övningstexter, vars svårighetsgrad ännu inte är kalibrerad mot riktiga HP-resultat."** Amendment 1 requires it wherever such an estimate is shown. Today Framsteg shows a bare number; this is a **Change**.
- **The week in one sentence.** Questions answered and accuracy, then the gap to the reader's goal and the two sections that carry it.
  - The sections are named without their figures; the table carries those.
  - The change and the halves are in the lead, so the sentence leaves them out.
  - The goal comes from Konto (screen 13). Today it is hard-coded to 1,8 while the target is 2,0.
- **The estimate over twelve weeks**, with the goal line and the weeks without practice.
- **Per section, in test order:**
  - the estimate, or "inget än";
  - its ± band (two answers or more);
  - the trend, this week against last;
  - the basis (attempts in 90 days, with a low, medium or high signal);
  - "16 dagar sedan" when untouched for 14 days or more.
- **Fokus.** Up to three ranked suggestions, each with its reason and its signal strength.
- **Fällor (new here).** The reader's recurring traps, each with section, name, pattern, count and whether it is rising. Idag's margin already links "Alla fällor i Framsteg" to this.
- **Practice days** in the last twelve weeks.
- **Repetition:** due now, still in the queue, and relearned.
- **The latest passes**, and the way into Historik.

**Layout — desktop, Framsteg.** The page grammar.
- **Title:** "Framsteg". Today the page's `h1` is the number.
- **Standfirst:** the week's sentence. It keeps today's prose paragraph, the most Folio thing the live app has, minus what the lead says.
- **The lead:**
  - the one display figure (`ResultFigure` from screen 10, now with its range band and the goal tick);
  - the halves;
  - the change in words;
  - **"Mest att vinna: ORD – lägst just nu och på väg ner."**, the Fokus reason, with the filled button.

  The goal tick's label "mål 2,0" is a link to Mål in Konto (screen 13).
- **Main column, then:**
  - "Prognos över tid": a line chart drawn as a book figure, with an italic caption;
  - "Delproven" as a `RuledTable`;
  - "Sedan": Fokus items 2–3 as `ContentsEntry`s. Item 1 is the lead, so it is never said twice;
  - "Historik": the latest five passes.
- **Margin:**
  - "Fällor": the first three traps, then **Alla fällor →**, which opens the Fällor sub-page (below);
  - "Repetitionen", with "23 att repetera nu" as a real link (today it is plain text);
  - "Övningsdagar", renamed from today's "Närvaro", which reads as attendance.

```
+-------------------+----------------------------------------------------------------------------+
| HP·Coach      <<  |  FRAMSTEG                                         Senaste 90 dagarna       |
|                   |  ------------------------------------------------------------------------  |
|   Idag            |  Framsteg                                                                  |
|   Öva          23 |  84 frågor den här veckan med 71 % träffsäkerhet. Gapet upp till målet     |
|   Provpass        |  bärs framför allt av ORD och NOG.                                         |
|   Uppslag         |                                                                            |
| | Framsteg        |                                                                            |
|                   |  ==============================================  |  Fällor                 |
|                   |  PROGNOS                                         |  LÄS        3 gånger ↑  |
|                   |  1,41*  av 2,0             +0,1 sedan förra veckan|  Författarens hållning |
|                   |  Verbal 1,30 · Kvant 1,52                        |  Rätt valens, fel objekt|
|                   |  |-----|-----|-----|-[###|#]-|-----|  mål 2,0 →  |  ELF        2 gånger    |
|                   |  0    0,5   1,0   1,5      2,0                   |  Slutsatsdragning       |
|                   |  Mest att vinna: ORD – lägst just nu och på väg  |  Alla fällor →          |
|                   |  ner.                                            |                         |
|                   |  (( Öva ORD · 10 frågor  ↵ ))   ca 5 min         |  Repetitionen           |
|                   |  ------------------------------------------------ |  23 att repetera nu →  |
|                   |  Prognos över tid                     12 veckor  |  41 i kön · 112         |
|                   |  ------------------------------------------------ |  återlärda             |
|                   |  2,0 - - - - - - - - - - - - - - - - - - mål 2,0 |                         |
|                   |  1,5                              ____•1,41      |  Övningsdagar           |
|                   |  1,0  ___/‾‾‾\__ . . . __/‾‾‾                    |  v.36  ••  två dagar    |
|                   |       v.31   v.33   v.35   v.37   v.39   v.41    |  …                      |
|                   |  Poäng per vecka. Prickat: veckor utan övning.   |  v.41  ••••  fyra dagar |
|                   |  ------------------------------------------------ |                        |
|                   |  Delproven        Prognos     ±   Trend  Underlag |                        |
|                   |  ORD . . . . . .   1,10   ±0,12   ↘ ner   84 · hög|                        |
|                   |  LÄS . . . . . .   1,35*  ±0,20   → oförändrad  22 · medel                 |
|                   |  …                                               |                         |
|                   |  ------------------------------------------------ |                        |
|                   |  Sedan                                           |                         |
|                   |  2  NOG · näst lägst just nu . . . . . Öva NOG → |                         |
|                   |  3  DTK · inte övad på 16 dagar . . .  Öva DTK → |                         |
|                   |  ------------------------------------------------ |                        |
|                   |  Historik                            Alla pass →  |                        |
|                   |  fre 9 okt   Provpass · Verbal   31/40 · 1,40  → |                         |
|                   |  fre 9 okt   Repetition           7/8         →  |                         |
|                   |  ------                                          |                         |
|                   |  * Uppskattningen för LÄS och ELF bygger på HP-Coachs övningstexter, vars  |
|                   |    svårighetsgrad ännu inte är kalibrerad mot riktiga HP-resultat.         |
+-------------------+----------------------------------------------------------------------------+
```

**The chart (new: `TrendChart`).** A book figure, drawn in SVG.
- **Lines:** hairline axes; three gridlines (1,0 · 1,5 · 2,0) in `--fo-rule`; the goal as a dashed `--fo-rule-2` line labelled at its right end; the estimate as a 1.5 px `--fo-ink` line.
- **The last point** is a 6 px accent dot with its value in lining figures.
- **Empty weeks** are a dotted bridge in `--fo-ink-3`.
- **Week labels** every other week ("v.31"). Today there is no x-axis.
- **Caption** below in italic t13: "Poäng per vecka, de senaste tolv veckorna." It adds "Prickat: veckor utan övning." only when such a bridge is drawn. Today the caption claims dashes that may not be there.
- **No hover-only information.** A "Visa som tabell >" disclosure opens the twelve values as a `RuledTable`, for everyone.
- **The chart's end value is the lead's figure.** The view model supplies one series. Today the hero, the delta and the sparkline use three formulas and disagree.

**Practice days (new: `WeekDots`, headed "Övningsdagar").** Calendar weeks in local time (**Change:** today, "week" is the last 7×24 hours in UTC).
- **One row per week:** one filled dot per day the reader practised, then the count in words ("fyra dagar").
- **There are no empty placeholders for the other days.** A row of seven with gaps would show the days missed, which is exactly the loss framing that Spår's reviewer removed.
- **No streak and no record.** The real page's "aktuell serie: 12 dagar (rekord)" is the loss-framed counter the ADHD-PI pillar rules out (open question 5).
- When a weekly goal is set, the current week reads "fyra av fem dagar den här veckan".

**The Fällor sub-page.** "Alla fällor →" opens "FRAMSTEG · FÄLLOR". It uses Historik's page and wireframes (desktop and phone), with trap rows in place of pass rows, plus a lead.
- **Title and standfirst:** "Dina fällor." / "Mönster som har lurat dig mer än en gång – de som ökar först."
- **The lead** is the rising trap's targeted repetition: "LÄS · Författarens hållning · ökar" and **Öva fällan · 5 min ↵**. So Fällor is not a third page without a filled button (§1.5 allows two).
- **The `TrapRegister`**, grouped by section in test order.
  - Each row shows the trap's name, pattern, count and trend in words ("ökar").
  - Each row links to its lesson entry ("Slå upp →", screen 12) and to its targeted repetition ("Öva →").
- **Loading:** sättning rows under real section heads.
- **Error:** the erratum "Fällorna gick inte att hämta just nu." + "Försök igen".
- **Empty:** "Inga återkommande fällor än – de syns här när samma mönster lurar dig mer än en gång." + **Till Öva ↵**.
- **Done** does not apply.

**Layout — desktop, Historik.**
- **A sub-page of Framsteg.** "Framsteg" stays current in the frame; today no entry is current. The masthead's "FRAMSTEG" is a link back, and Esc goes back.
- **Title and standfirst** are today's: "Tidigare pass." / "Öppna ett pass för att se hela facit igen – vilka frågor du fastnade på och pedagogiken bakom."
- **A ledger grouped by calendar week.** Each week has a head: "Vecka 41 · 5–11 oktober", with "4 pass · 38 min" at the right.
- **Each row:**
  - the weekday and date ("fre 9 okt");
  - the kind, in words: "NOG-övning", "Blandad övning", "Repetition", "Provpass · Verbal, riktigt", "Fällan: Bråkaddition". **Never raw tags** like "ar:DTK:DTK-TACTIC-004", and a mixed set is never called "ORD";
  - the result: "7/10", or for a pass "31/40 · 1,40";
  - the duration;
  - an arrow.
- **Provpass results are in the ledger.** **Change:** today Historik excludes them.
- **A row opens that pass's end page,** rebuilt as it was: the colophon with "Hela passet", or screen 10. Not today's numbers.

```
+-------------------+---------------------------------------------------------------------------+
| HP·Coach      <<  |  FRAMSTEG · HISTORIK                              48 pass · 120 dagar     |
|                   |  ------------------------------------------------------------------------ |
|   Idag            |  Tidigare pass.                                                           |
|   Öva          23 |  Öppna ett pass för att se hela facit igen – vilka frågor du fastnade på  |
|   Provpass        |  och pedagogiken bakom.                                                   |
|   Uppslag         |                                                                           |
| | Framsteg        |  Vecka 41 · 5–11 oktober                                 4 pass · 38 min  |
|                   |  ------------------------------------------------------------------------ |
|                   |  fre 9 okt   Provpass · Verbal, riktigt . . . . 31/40 · 1,40   52 min  →  |
|                   |  fre 9 okt   Repetition . . . . . . . . . . . . 7/8            9 min  →   |
|                   |  tor 8 okt   NOG-övning . . . . . . . . . . . . 4/6            8 min  →   |
|                   |  ons 7 okt   Fällan: Bråkaddition . . . . . . . 3/5            5 min  →   |
|                   |                                                                           |
|                   |  Vecka 40 · 28 september – 4 oktober                     6 pass · 51 min  |
|                   |  ------------------------------------------------------------------------ |
|                   |  …                                                                        |
|                   |  ------                                                                   |
|                   |  Pass äldre än 120 dagar sparas inte. Ett avbrutet provpass räknas inte.  |
+-------------------+---------------------------------------------------------------------------+
```

**Layout — phone.**
- **Framsteg**, one column:
  1. The masthead, the title and the sentence.
  2. The lead, with the figure at `t44`, the scale, the halves, and "Mest att vinna" with a full-width button.
  3. The chart at full width, labelling every third week.
  4. "Delproven" as the table's first two columns (section, estimate with its trend word). The band and the basis drop to a second line in t13. There are no leader dots on phone.
  5. "Sedan", "Historik" (three rows) and "Alla pass →".
  6. The margin's "Fällor", "Repetitionen" and "Övningsdagar".
  7. The footnote.
- **Historik:** the week heads, with each row in two lines ("fre 9 okt · Provpass · Verbal" / "31/40 · 1,40 · 52 min →"). The tabs keep "Framsteg" current.

```
 Framsteg                                      Historik
+--------------------------------------+      +--------------------------------------+
| HP·Coach                        (o)  |      | HP·Coach                        (o)  |
| FRAMSTEG                             |      | FRAMSTEG · HISTORIK                  |
| Senaste 90 dagarna                   |      | 48 pass · 120 dagar                  |
| Framsteg                             |      | Tidigare pass.                       |
| 84 frågor den här veckan med 71 %    |      | Öppna ett pass för att se hela facit |
| träffsäkerhet. Gapet upp till målet  |      | igen – vilka frågor du fastnade på   |
| bärs framför allt av ORD och NOG.    |      | och pedagogiken bakom.               |
| ==================================== |      | Vecka 41 · 5–11 oktober              |
| PROGNOS                              |      | 4 pass · 38 min                      |
| 1,41*  av 2,0                        |      | ------------------------------------ |
| +0,1 sedan förra veckan              |      | fre 9 okt · Provpass · Verbal        |
| Verbal 1,30 · Kvant 1,52             |      |   31/40 · 1,40 · 52 min           →  |
| |-----|-----|-----|-[###|#]-|-----|  |      | ------------------------------------ |
| Mest att vinna: ORD – lägst just nu  |      | fre 9 okt · Repetition               |
| och på väg ner.                      |      |   7/8 · 9 min                     →  |
| ((      Öva ORD · 10 frågor      ))  |      | ------------------------------------ |
| ------------------------------------ |      | tor 8 okt · NOG-övning               |
| Prognos över tid                     |      |   4/6 · 8 min                     →  |
| <chart, full width>                  |      | …                                    |
| ------------------------------------ |      | ------                               |
| Delproven                            |      | Pass äldre än 120 dagar sparas inte. |
| ORD                  1,10  ↘ ner     |      +--------------------------------------+
|   ±0,12 · 84 försök · hög            |      | Idag   Öva•  Provpass  Uppslag  Fram |
| …                                    |      +--------------------------------------+
+--------------------------------------+
| Idag   Öva•  Provpass  Uppslag  Fram |
+--------------------------------------+
```

**Reuses.**
- `FolioPage`, the masthead, `.fo-day` (the sentence), `.fo-resume` as the lead, and `ResultFigure` + `Scale` (screen 10), now with the range band and a goal tick.
- `.fo-footnote`, `RuledTable` (screen 9), `ContentsEntry` (screen 5), and the `.fo-trap-*` marginalia (round 1).
- `.fo-link`, and B1's entry-name helper for the traps' names.

**New.**
- `TrendChart`.
- `WeekDots`.
- `TrapRegister`: the Fällor sub-page's list.
- `Ledger`: Historik's week-grouped rows, also used for the five rows on Framsteg.

**States.**
- **Loading (sättning).**
  - The figure is a bar, and the sentence is two bars.
  - The eight section codes are real, with bars for their values.
  - The chart's axes and gridlines are drawn without a line.
  - Historik's week heads are bars.
- **Brand-new reader.**
  - The figure is "—".
  - The standfirst: "Ingen prognos än – svara på några frågor så börjar den här sidan leva." (the real copy).
  - The filled button is **Börja här · 10 frågor ↵**, which starts the diagnostic, as today.
  - The table rows read "inget än" in `--fo-ink-3`.
  - The chart's place holds one italic line: "Kurvan börjar när du har övat två veckor."
  - Historik: "Inga avslutade pass än. Kör en övning så landar den här." + **Till Öva**.
- **Only one half practised.**
  - The figure is "—" with an asterisk footnote: "Totalen visas när du har svarat på frågor i båda halvorna."
  - The halves line reads "Verbal 1,30 · Kvant —".
  - The filled button goes to the missing half: **Börja med kvant: XYZ · 10 frågor ↵**.
  - **Never the new-reader invitation.** Today someone with hundreds of verbal answers is told to start.
- **Error.**
  - **One** erratum under the masthead: "Framstegen gick inte att hämta just nu – försöker igen automatiskt." + "Försök igen". Today the same line prints four times on one page.
  - With cached figures, they stay, and a quiet line under the masthead says "Visar siffrorna från 14:02." Today stale data shows with no signal.
- **Too little data for a part.**
  - Bands hide under two answers.
  - The change hides without five answers per window. The sentence then opens "Den här veckan: 12 frågor …", never the bare stub "Den här veckan."
  - The chart waits for two active weeks.
- **Copy fixes.**
  - Ordinals are correct (2:a, 21:a, 22:a; today the code prints 2:e).
  - "1 dag", not "1 dagar".
- **Historik.**
  - **Error is not empty.** The erratum, not "Inga avslutade pass än". Today an outage reads as an empty history.
  - **Just finished.** The pass appears immediately. Today the list's 5-minute cache can hide it.
  - **No filled button.** Historik is one of the two documented exceptions (§1.5); its rows are the actions. Only its empty state has one (**Till Öva**).
- **Done** does not apply; Framsteg is a report, not a task.

**Navigation.**
- **In, Framsteg:**
  - the door;
  - Idag's margin links ("Alla fällor i Framsteg", "Alla pass i Framsteg");
  - Idag's prognosis head, now a link "Prognos →";
  - the palette;
  - Provpassresultat's "Alla pass i Historik" (straight to Historik).
- **Out, Framsteg:**
  - the lead and "Sedan" go to the drills;
  - a section row's name goes to that section in Uppslag, as today;
  - a trap goes to its lesson entry;
  - "23 att repetera nu" goes to Repetera;
  - "Alla fällor →" goes to the Fällor sub-page;
  - ledger rows go to their end pages;
  - "Alla pass" goes to Historik.
- **Historik:** Esc and the masthead's link go back to Framsteg. Today the footer goes to Home, even though the way in was from Framsteg.

**ADHD-PI.**
- **The week is one sentence**, then one action that gains the most. The page argues for one next step instead of offering a dashboard to interpret.
- **Every figure carries its uncertainty** (band, signal, caveat), so a bad week reads as noise, not verdict.
- **Days practised are counted; days missed are not.**
- **At most three suggestions,** and the first is the button.

**Accessibility.**
- **The chart.** `role="img"` with one sentence, e.g. "Prognos per vecka de senaste tolv veckorna, från 1,10 i vecka 31 till 1,41 i vecka 41; mål 2,0". Plus the table disclosure.
- **The section table.** A `<caption>` and `th scope="row"`. Trends are words, with the arrows `aria-hidden`.
- **WeekDots.** Each week is `role="img"` with the label "Vecka 41: fyra dagar".
- **Historik.** Week heads are `h2`, and each week is a list. A row's name reads "Fredag 9 oktober, provpass verbal, 31 av 40, 1,40, 52 minuter".

**Unmistakably Folio.**
- Framsteg reads as a report set in a book:
  - an editorial standfirst that tells the week;
  - one light display figure with its footnoted caveat;
  - a line chart drawn as a captioned figure;
  - ruled tables with leader dots;
  - an index of traps in the margin.
- Historik is a ledger by week, and its rows are entries, not cards.

### Screen 12 · Uppslag & lektion (B3)

**Purpose.** Look up a pattern before practising it, or read a section's library from where you left off.
- **Hub:** the **primary action** is **Fortsätt läsa ↵** at the bookmark, or **Läs NOG först ↵** for the suggested section when there is no bookmark.
- **Lesson:** the **primary action** is **Läst – nästa fälla ↵**. It marks the entry read and opens the next unread one.

*Uppslag* is Swedish for a book's spread. In Folio the lesson **is** a spread: the chapter's contents on the verso, the entry on the recto.

**What it shows (plain terms).**
- **One pattern library per section: 221 entries.** Three kinds:

  | Kind | Sections and counts |
  |---|---|
  | **Traps** | XYZ 59, KVA 54, NOG 25 |
  | **Protocols** | DTK 10 tactics, MEK 16 rules, LÄS 8 and ELF 8 question types |
  | **Word roots** | ORD 41 |

- **What each trap holds:**
  - what students typically do, and why;
  - recognition signs;
  - the countermeasure;
  - a worked example in four steps: Förutsättning, Fällans tanke, Korrekt tanke, Svar;
  - when the trap does not apply;
  - the typical wrong answer;
  - example questions from the bank.
- **Protocols by section:**
  - DTK: recognition signs;
  - MEK: the pattern rule;
  - LÄS and ELF: an attack protocol in numbered steps, and the common traps (each a pattern plus why it traps).
- **A word root:** the root, its origin, its meaning and example words.
- **Read state** per entry (synced), a bookmark per section, and a reading-time estimate.
- **The hub:**
  - sections ordered weakest first, using real data only (sections under ten attempts are left out of the ranking unless all are);
  - the section estimate;
  - **new:** read progress per section ("7 av 25 lästa");
  - the "practise directly" links.
- **Per section, practice:** the whole section, its weakest traps (when the reader has missed one), each pattern's own set, and each example question. A pattern's set and its example questions appear only when the drill can play them (the foot of every entry, below).

**Layout — desktop, hub.** The page grammar.
- **Title and standfirst** are today's: "Läs först." / "Varje delprov har sitt eget mönsterbibliotek – fällor, motåtgärder och taktiker hämtade från 27 riktiga prov."
- **The lead** is the bookmark, with the ribbon (it is "where you are"), or the suggested section without it.
  - Its headline (the section's name) is `.fo-lead-title`.
  - Its line says where and when: "Vid fälla 12 av 25 · senast igår 21:14 · ca 12 min kvar". There is no separate "Senast läst" note, and the read count is left to the register.
- **The register** "Delproven" comes in the two parts, as on Öva. Its page numbers are the read progress ("7 av 25"), with the size and kind in the gloss. Uppslag has no standfirst that names the suggestion, so the weakest section's entry carries "svagast just nu".
- **Margin:**
  - "Så används Uppslag";
  - "Öva direkt": today's "Eller öva direkt", with "Blandad övning →" and "Repetera dina missar →".

```
+-------------------+----------------------------------------------------------------------------+
| HP·Coach      <<  |  UPPSLAG                                       221 mönster i 8 delprov     |
|                   |  ------------------------------------------------------------------------  |
|   Idag            |  Läs först.                                                                |
|   Öva          23 |  Varje delprov har sitt eget mönsterbibliotek – fällor, motåtgärder och    |
|   Provpass        |  taktiker hämtade från 27 riktiga prov.                                    |
| | Uppslag         |                                                                            |
|   Framsteg        |  ============================================R=  |  Så används Uppslag     |
|                   |  PÅBÖRJAD · NOG                              R   |  Läs ett mönster, öva   |
|                   |  Kvantitativa resonemang                         |  sedan på det. Varje    |
|                   |  Vid fälla 12 av 25 · senast igår 21:14 ·        |  mönster har egna       |
|                   |  ca 12 min kvar                                  |  frågor från provet.    |
|                   |  (( Fortsätt läsa  ↵ ))                          |                         |
|                   |  ------------------------------------------------ |  Öva direkt            |
|                   |  Delproven                                       |  Blandad övning →       |
|                   |  ------------------------------------------------ |  Repetera dina missar →|
|                   |  Verbal del                                      |                         |
|                   |  ORD  Ordförståelse . . . . . . . . . .  0 av 41 |                         |
|                   |       41 ordrötter och deras betydelser          |                         |
|                   |  LÄS  Svensk läsförståelse . . . . . . .  3 av 8 |                         |
|                   |       8 frågetyper med angreppsprotokoll         |                         |
|                   |  …                                               |                         |
|                   |  Kvantitativ del                                 |                         |
|                   |  NOG  Kvantitativa resonemang . . . . . 7 av 25  |                         |
|                   |       25 fällor · datasufficiens  svagast just nu|                         |
|                   |  …                                               |                         |
+-------------------+----------------------------------------------------------------------------+
```

**Layout — desktop, lesson (the spread).** Opening a section folds the contents list to the thumb index, to make room for two pages; ⌘B unfolds it. The frame stays, because Uppslag is a place you move around in, not a timed focus screen.
- **The verso's running head:** "UPPSLAG · NOG", plus a ghost **Öva hela NOG** (running heads hold only ghost buttons, §1.5). With weak traps it adds "Öva de fyra svagaste fällorna".
- **The verso's body:**
  - the chapter opener: label "KAPITEL · NOG", the title "Kvantitativa resonemang" at `t32`, the italic subtitle "datasufficiens", and the meta "25 fällor · ca 18 min · 7 lästa";
  - then "Innehåll": the entries as a numbered contents list. Each entry's title is its one-line summary. Its page number is "läst" (ink-3) or the minutes.
  - **The ribbon marks the open entry, which is also the bookmark.** Opening an entry saves it, as today. There is no second accent rule.
- **The recto:**
  - its running head "Fälla 12 av 25", with the read toggle "Läst ✓" / "Markera som läst" at the right;
  - the entry as a reference page. Its title is `t24`, so on a word-root entry the root (`t44`) is the spread's one largest item.
- **No accordions.** One entry is open at a time, on its own page.

```
+----+---------------------------------------------+--+------------------------------------------+
| HP | UPPSLAG · NOG              [ Öva hela NOG ] |  |  Fälla 12 av 25         Markera som läst |
|    | ------------------------------------------- |  | ---------------------------------------- |
| I  | KAPITEL · NOG                               |  |  Tvärsummor som inte räcker              |
| Ö  | Kvantitativa resonemang                     |  |                                          |
| P  | datasufficiens                              |  |  Så gör man ofta                         |
| |U | 25 fällor · ca 18 min · 7 lästa             |  |  …                                       |
| F  | ------------------------------------------- |  |  Varför det händer                       |
|    | Innehåll                                    |  |  …                                       |
|    |  1  Att räkna klart i onödan . . . . . läst |  |  Igenkänningstecken                      |
|    |  2  … . . . . . . . . . . . . . . . . läst  |  |  · …                                     |
|    | R12 Tvärsummor som inte räcker . . . . 1 min|  |  | Motåtgärd                             |
|    | 13  … . . . . . . . . . . . . . . . . 1 min |  |  | …                                     |
|    | 14  …                                       |  |  Räkneexempel                            |
|    | …                                           |  |  1 Förutsättning   2 Fällans tanke       |
|    |                                             |  |  3 Korrekt tanke   4 Svar                |
|    |                                             |  |  När fällan inte gäller                  |
|    |                                             |  |  Exempelfrågor                           |
|    |                                             |  |  Vilken av …?  Hösten 2024 · NOG  Öva →  |
|    |                                             |  |  (( Läst – nästa fälla  ↵ ))             |
|    |                                             |  |                  Öva detta mönster →     |
+----+---------------------------------------------+--+------------------------------------------+
```

**The entry, by kind (the recto).**
- **Trap** (`TrapArticle`):
  - the title (its one-line summary), with "NOG · fälla 12" as plain text. **Never a raw id** such as "TRAP 012" or "MEK-RULE-001";
  - "Så gör man ofta" and "Varför det händer" (prose, t17);
  - "Igenkänningstecken" (a list with hairline separators, no bullets in boxes);
  - **"Motåtgärd" set as the one rule note** (the `.fo-note` left rule, ink, t17). It is the entry's takeaway;
  - "Räkneexempel" as a numbered four-step list (old-style numerals for the step numbers, lining figures and `MathText` inside);
  - "När fällan inte gäller" (italic);
  - the typical wrong answer (an italic footnote line);
  - "Exempelfrågor": each the stem's first line, its source in words in t13 ("Hösten 2024 · NOG", never the raw exam id), and "Öva →".
- **Protocol** (`ProtocolArticle`):
  - DTK: the tactic as the title, then "Igenkänningstecken";
  - MEK: the rule type, then "Mönsterregel";
  - LÄS and ELF: the question type, then "Angreppsprotokoll" (numbered steps, the numbers hanging in the margin), then "Vanliga fällor" (each pattern as a `.fo-h3`, with its "why" under it).
- **Word root** (`LexiconArticle`):
  - the root in Literata `t44` ("för-");
  - its origin in Swedish ("germanskt"; today the data's English "Germanic" shows);
  - the meaning in italic;
  - "Exempel" as a run-in list of words separated by middots. These are not pills.
- **The foot of every entry:**
  - the filled **Läst – nästa fälla ↵** (or "nästa taktik", "nästa regel", "nästa frågetyp", "nästa rot"). Its label and where it leads follow the table below;
  - the quiet practice link, named for its kind as today: "Öva detta mönster →" (traps), "Öva denna taktik →", "Öva denna regel →", "Öva denna frågetyp →" (protocols), "Öva ord med denna rot →" (roots). It appears only when the entry has questions to play (below).
  - Once the entry is read, the head's toggle reads "Läst ✓" with "Ångra" beside it.
- **The filled button goes to the next unread entry.** Entries open in any order (from the contents, by a deep link, with J/K), so the entry in last place is not always the last one read. "Nästa" means the next unread entry after the open one in the contents, wrapping round to the chapter's start.

  | The open entry | The filled button | What it does |
  |---|---|---|
  | Unread, with other entries unread | **Läst – nästa fälla ↵** | Marks it read and opens the next unread entry |
  | Unread, and the only unread entry left, wherever it sits | **Läst – slutför kapitlet ↵** | Marks it read and turns the recto to the chapter's colophon |
  | Read, with entries still unread | **Nästa fälla ↵** | Opens the next unread entry |
  | Read, and so is the whole chapter | **Till kapitlets slut ↵** | Opens the chapter's colophon. J and K still move between entries |

- **Practice only when there are questions to play.** Today's LexiconCard shows its practice links and example questions only when the root has example questions (`app/src/components/lesson/LexiconCard.tsx:27–31`), because `/drill?framework=` would otherwise open an empty drill. Folio keeps that guard, applies it to every kind, and makes it exact: an entry offers practice only when at least one of its example questions resolves to a question the framework drill will play.
  - **The test is the drill's own**, so the link and the drill never disagree. Today that is `pickFrameworkQuestions` (`app/src/routes/drill.tsx:540–551`): in the bank, fully parsed, with options. The same test decides which example questions are listed. While the bank loads, the link's place is held by sättning (§1.7).
  - **An entry with none** shows its whole article, with no "Exempelfrågor" and no practice link. Its foot holds the filled button alone: no greyed-out link, no "inga frågor" line. Today this is `ORD-ROOT-016` ("med-"), whose `example_questions` is empty (`app/public/frameworks/ord_roots.json:244`).
  - **The section's practice stays one quiet link away:** the verso head's ghost **Öva hela ORD** on desktop; on phone, "Öva hela ORD →" in the practice link's place above the foot bar.

**The chapter's end.** The colophon is gated on the whole chapter: it opens only once **every** entry is read, in whatever order, never because the reader reached the last place in the contents. Pressing **Läst – slutför kapitlet** turns the recto to it:
- ⁂, "Kapitlet är läst." and the facts row "25 FÄLLOR · LÄST 18 OKTOBER";
- the filled **Öva hela NOG ↵**. The verso head's ghost "Öva hela NOG" hides while it shows, so the action appears once;
- on later visits the verso's contents end with the same "⁂ Kapitlet är läst." line. If an entry is marked unread again ("Ångra"), the chapter is no longer read: the line goes, and the hub's count drops back ("24 av 25").

Today there is no all-read state.

**Layout — phone.**
- **Hub:** one column, with the lead first, then the register, then the margin's notes.
- **A section:**
  - the chapter opener;
  - the filled **Fortsätt vid fälla 12** (or **Börja läsa**) and a quiet "Öva hela NOG";
  - then "Innehåll", each entry a `ContentsEntry` with "läst" or minutes and the ribbon at the bookmark.
- **An entry** opens as its own page:
  - the head "← Innehåll · Fälla 12 av 25 · Markera som läst";
  - the article;
  - a foot bar with **Läst – nästa fälla** (full width; the label follows the desktop table) and "Öva detta mönster →" above it, or "Öva hela NOG →" when the entry has no questions to play.
- The tabs work here. Today the phone tab bar on Uppslag does nothing, and the page's end hides under it.

```
 hub
+--------------------------------------+
| HP·Coach                        (o)  |
| UPPSLAG                              |
| 221 mönster i 8 delprov              |
| Läs först.                           |
| Varje delprov har sitt eget          |
| mönsterbibliotek – fällor,           |
| motåtgärder och taktiker hämtade     |
| från 27 riktiga prov.                |
| ===============================R==== |
| PÅBÖRJAD · NOG                       |
| Kvantitativa resonemang              |
| Vid fälla 12 av 25 · senast igår     |
| 21:14 · ca 12 min kvar               |
| ((         Fortsätt läsa         ))  |
| ------------------------------------ |
| Delproven                            |
| Verbal del                           |
| ORD  Ordförståelse          0 av 41  |
|      41 ordrötter och deras          |
|      betydelser                      |
| …                                    |
+--------------------------------------+
| Idag   Öva•  Provpass  Uppslag  Fram |
+--------------------------------------+

 a section, and an entry
+--------------------------------------+     +--------------------------------------+
| HP·Coach                        (o)  |     | ← Innehåll   Fälla 12 av 25   Läst ✓ |
| UPPSLAG · NOG                        |     | ------------------------------------ |
| KAPITEL · NOG                        |     | Tvärsummor som inte räcker           |
| Kvantitativa resonemang              |     | Så gör man ofta                      |
| datasufficiens                       |     | …                                    |
| 25 fällor · ca 18 min · 7 lästa      |     | | Motåtgärd                          |
| ((    Fortsätt vid fälla 12      ))  |     | | …                                  |
| ( Öva hela NOG )                     |     | Räkneexempel                         |
| ------------------------------------ |     | 1 Förutsättning                      |
| Innehåll                             |     | …                                    |
|  1  Att räkna klart i onödan  läst   |     |                Öva detta mönster →   |
| R12 Tvärsummor som inte räcker 1 min |     | ((     Läst – nästa fälla        ))  |
| …                                    |     +--------------------------------------+
+--------------------------------------+
| Idag   Öva•  Provpass  Uppslag  Fram |
+--------------------------------------+
```

**Reuses.**
- `FolioPage`, the masthead, `.fo-resume` + `.fo-ribbon` (the bookmark), and `ContentsEntry` + `PartHead` (screen 5).
- `Spread` and `.fo-gutter` (round 1), `.fo-runhead`, and `.fo-note` (Motåtgärd).
- `.fo-prose`, `.fo-h3`, `.fo-sub`, `Step`-like numbering, `MathText`, `Colophon` and `.fo-link`.

**New.**
- `LessonSpread`: the verso's contents with bookmark and current entry, and the recto's entry page.
- `TrapArticle`, `ProtocolArticle`, `LexiconArticle`, `WorkedExample` (the four steps), `ExampleQuestionList`, and `ReadToggle`.
- It uses B1's **entry-name** helper (screen 6), which turns framework ids into readable labels and normalises "LAS" to "LÄS". The drill's facit line "Ramverk: Författarens hållning · Slå upp →" and Framsteg's traps use the same helper.

**States.**
- **Loading.** The title, standfirst and section codes are real. The lead, the progress figures and the recto are sättning bars.
- **Error.** The erratum "Uppslaget gick inte att ladda." + "Försök igen". Today the raw "Kunde inte ladda: {msg}" shows; the detail belongs in the console.
- **Brand-new reader.**
  - With no bookmark and no ranking, the lead is the plan's next lesson if Idag has one. Otherwise it is "BÖRJA HÄR · ORD" (the test's first section), and the filled button is **Läs ORD först ↵**.
  - No "svagast" and no estimates.
- **Partly read.** "7 av 25" in the register and "läst" in the contents.
- **All read.** The chapter colophon above. The hub's entry reads "25 av 25 · läst".
- **Example questions.** They come from the bank. An id the drill cannot play (the test under the foot of every entry) is left out, never "(laddar…)" forever.
- **Empty section.** "Inget innehåll här ännu." (the real copy, not reachable today).
- **Deep links.** `#ID` opens that entry **for every kind**; today only traps carry ids. Idag's plan links land on the entry, not the hub. A LÄS framework link from a drill works; today "LAS" shows as locked.

**Navigation.**
- **In:**
  - the Uppslag door;
  - the drill facit's framework line (now a link with the readable name);
  - Idag's plan ("ELF-lektion · Slutsatsdragning / implikation");
  - Framsteg's section rows and traps;
  - the adaptive detour "Läs mönstret i uppslaget först →";
  - the diagnostic's report;
  - the palette.
- **Out:**
  - the practice links go to their drills, keeping the section (today an example link loses it and shows ORD's debug copy);
  - "Repetera dina missar" goes to screen 8.
- **Keys:**
  - Esc goes from an entry to the chapter, from the chapter to the hub, and from the hub to Idag (as today, now listed under "Kortkommandon" on screen 13);
  - J/K move to the next and previous entry in the spread;
  - ↵ is the filled button.

**ADHD-PI.**
- **The ribbon returns the reader to the exact entry.**
- **One entry per page**, with its reading time, instead of a wall of 25 accordions.
- **The filled button keeps momentum** (read, next), and practice is always one quiet link away.
- **The read count shows progress** without making unread entries feel like debt: "7 av 25", never "18 olästa".

**Accessibility.**
- **Headings.** The chapter title is the page's `h1`. The entry title is the recto's `h2`. On the hub, the title "Läs först." is the `h1`.
- **The verso.** Only its Innehåll list is a `nav` ("Innehåll: Kvantitativa resonemang"). The chapter opener, with the `h1`, sits outside that landmark, in `main`. The open entry has `aria-current="page"`. The ribbon is decorative and adds no screen-reader text, because `aria-current` already says it.
- **The recto** is an `article` with its `h2`. A deep link moves focus to it.
- **The read toggle** is a button with `aria-pressed`.
- **Worked examples** are an ordered list. The countermeasure note is a `section` labelled "Motåtgärd".

**Unmistakably Folio.**
- Uppslag is literally an uppslag:
  - a chapter opener and a contents page with leader dots and a ribbon on the verso;
  - a reference entry on the recto with its takeaway set as a ruled margin note;
  - a chapter that ends with ⁂.
- It is the screen where the book metaphor stops being decoration and becomes the navigation.

### Screen 13 · Konto & inställningar (B3)

**Purpose.** Change a setting or manage the account, from one page reached from every screen.
- **There is deliberately no filled button on this page.** Settings apply the moment they are chosen. Filled buttons appear only inside the slips (§1.5): the safe choice in import and reset, the grave act in deletion.
- This is one of the two documented exceptions to §1.5; Historik is the other. Nothing here is a "next step".

**What it shows (plain terms).** One page replaces today's three. Today `/konto`, `/mer` and `/avancerat` do not link to each other, and "Logga ut" exists only in Home's menu.

| Section | Rows | Today |
|---|---|---|
| **Du** | Name, e-mail, how you sign in, the plan | — |
| **Provet** | **Provdatum**: the sitting you aim for. **Mål**: the goal on 0–2,0 | Both **New**. Today the sitting is picked automatically, the goal is hard-coded to 1,8, and neither can be set. Round 1's slip already promised "Provdatum och mål". |
| **Övningen** | **Frågeurval**: smart · slumpat, with "Frågor nära din nivå." / "Helt slumpade frågor." **Coach**: Kompis · Professor · Taktiker, with each voice's description now visible | Today the descriptions are screen-reader only |
| **Utseende** | **Tema**: Ljust · Mörkt · System | Ljust and Mörkt are saved and follow to other devices, as today. **System is New** (below) |
| **Din data** | Export, import, reset the diagnostic | Today import and reset live on Avancerat |
| **Hjälp** | Help and support (a person answers within a day), privacy policy, terms of use, the app version. The keyboard shortcuts are in the margin, once. | Today shortcuts are listed nowhere |
| *(after a double rule)* | **Logga ut**, **Radera kontot** | — |

- The plan row: "Gratis". Today's copy is "Kommer när HP-Coach går från gratis dogfood till betald tjänst — inget att göra här ännu." The word "dogfood" is internal, so the proposed copy is "Betalning kommer när HP-Coach blir en betald tjänst – inget att göra här ännu."
- Today's palette setting (sand, sage, ink, rose, spalt) is **not** carried into Folio. Folio is one palette (open question 7).
- **Tema · System is New** (open question 19).
  - Production saves only light or dark: `ThemeMode` (`app/src/lib/tokens.ts:14`), `UserPrefsPatch.mode` (`app/src/api/hooks/useUserPrefs.ts:23`) and the server's check (`worker/src/routes/me.ts:31`).
  - Round 1's slip keeps System only while the slip is open, and reads the device's setting once (`a-folio/Folio.tsx:294–298`, `337–347`). It is neither saved nor followed.
  - To keep the standfirst's promise, System needs a third saved value beside light and dark, synced like every other setting, and a live listener on `prefers-color-scheme`, so each device follows its own setting as it changes.
  - If the owner declines, Tema is **Ljust · Mörkt**, here and in the slip.

**Layout — desktop.** The page grammar, set like a book's imprint page.
- **Title and standfirst:** "Ditt konto." (today's) / "Ändringar gäller direkt och följer med till dina andra enheter."
- **Each section** is a `.fo-h2` under a hairline, followed by **definition rows**. Each row has a Literata label at left. Its value is either:
  - a `.fo-seg` word choice (the chosen word underlined in the accent); or
  - a value with leader dots and an "Ändra →" link that opens a slip (Mål's eleven values from 1,0 to 2,0; Provdatum's next sittings).
- **The margin:**
  - "På den här sidan": anchor links to the six sections, like a book's section index;
  - "Kortkommandon" (anchor `#kortkommandon`): the app's one list of shortcuts, grouped by where they work:
    - everywhere: ⌘B and Esc;
    - in a drill: A–E, ⇧ + letter, ↵, J/K and F;
    - in a provpass: ←/→;
    - in Förstora: + / − / R;
    - in Uppslag: J/K between entries.

    The wireframe shows it shortened. On phone it follows the page's sections.
- **The double rule** comes before Logga ut and Radera kontot, exactly as in the account slip.
- **The masthead** is the label alone. The standfirst already says that changes save at once.

```
+-------------------+----------------------------------------------------------------------------+
| HP·Coach      <<  |  KONTO                                                                     |
|                   |  ------------------------------------------------------------------------  |
|   Idag            |  Ditt konto.                                                               |
|   Öva          23 |  Ändringar gäller direkt och följer med till dina andra enheter.           |
|   Provpass        |                                                                            |
|   Uppslag         |  Du                                              |  På den här sidan       |
|   Framsteg        |  ------------------------------------------------ |  Du · Provet ·         |
|                   |  Namn . . . . . . . . . . . . . . . . . {namn}   |  Övningen · Utseende ·  |
|                   |  E-post . . . . . . . . . . . . . . {e-post}     |  Din data · Hjälp       |
|                   |  Inloggning . . . . . . . . . . . . via Google   |                         |
|                   |  Plan . . . . . . . . . . . . . . . . . Gratis   |  Kortkommandon          |
|                   |                                                  |  ⌘B  fäll menyn         |
|                   |  Provet                                          |  A–E välj · ↵ svara     |
|                   |  ------------------------------------------------ |  ⇧ + bokstav stryk     |
|                   |  Provdatum  Höstprov 26 . . . . . . . . Ändra →  |  J/K stycke · F fokus   |
|                   |  Mål        2,0 . . . . . . . . . . . . Ändra →  |  Esc stäng              |
|                   |                                                  |                         |
|                   |  Övningen                                        |                         |
|                   |  ------------------------------------------------ |                        |
|                   |  Frågeurval  smart · slumpat                     |                         |
|                   |              -----                               |                         |
|                   |              Frågor nära din nivå.               |                         |
|                   |  Coach       Kompis · Professor · Taktiker       |                         |
|                   |                                   --------       |                         |
|                   |              {röstens beskrivning}               |                         |
|                   |  Utseende                                        |                         |
|                   |  ------------------------------------------------ |                        |
|                   |  Tema        Ljust · Mörkt · System              |                         |
|                   |  Din data                                        |                         |
|                   |  ------------------------------------------------ |                        |
|                   |  Exportera min data →   Importera data →         |                         |
|                   |  Återställ diagnostiken →                        |                         |
|                   |  Hjälp                                           |                         |
|                   |  ------------------------------------------------ |                        |
|                   |  Hjälp & support →   Integritetspolicy →         |                         |
|                   |  Användarvillkor →                     v{x.y.z}  |                         |
|                   |  ------------------------------------------------ |                        |
|                   |  ------------------------------------------------ | (double rule)          |
|                   |  ( Logga ut )                    Radera kontot → |                         |
+-------------------+----------------------------------------------------------------------------+
```

**The deletion slip** (a `FolioSlip`). It keeps today's copy and order:
1. The warning: "Allt raderas direkt – konto, försök, missar och resultat. Säkerhetskopior tunnas ut inom 30 dagar. Det går inte att ångra."
2. "Exportera min data först →".
3. "Skriv ”radera” för att bekräfta." with the field. Today the word has no quotes.
4. The button **Radera kontot permanent**. It is enabled once the field reads "radera":
   - case does not matter, and surrounding spaces are trimmed. Today it is an exact match;
   - **new:** it is a `.fo-btn--grave` (filled `--fo-ink`, not the accent and not red). Deletion is weighty, not an alarm;
   - **↵ never presses it** (§1.5). ↵ in the field does nothing. The button needs a click, a tap, or Tab and Space;
   - the quiet "Avbryt" is the default for Esc.

```
     / RADERA KONTO                                               /
     / ========================================================== /
     / Allt raderas direkt – konto, försök, missar och resultat.  /
     / Säkerhetskopior tunnas ut inom 30 dagar. Det går inte att  /
     / ångra.                                                     /
     / Exportera min data först →                                 /
     / ---------------------------------------------------------- /
     / Skriv ”radera” för att bekräfta.                           /
     / |radera                        |   <- the text field       /
     / (( Radera kontot permanent ))  <- .fo-btn--grave, not ↵    /
     / ( Avbryt )  (Esc)                                          /
```

**The other slips** follow the abandon slip's pattern (§1.5): the safe choice is filled and holds ↵, and the act is quiet under a double rule.
- **Import:**
  - "Detta ersätter all din nuvarande data" (today's copy);
  - **Behåll min data ↵** (filled);
  - "Ersätt min data" (quiet, under the double rule).
- **Reset:**
  - "Återställa diagnostiken? Din baslinje börjar om nästa gång du gör diagnostiken.";
  - **Behåll baslinjen ↵** (filled);
  - "Återställ" (quiet, under the double rule).

  This replaces today's "Säkert? Tryck igen" double press.
- **Mål and Provdatum:** each a slip holding a short ruled list of words. Choosing one applies it and closes the slip. Nothing is destroyed, so there is no filled button.

**Layout — phone.** One column.
- The title, the standfirst, then the anchors as one wrapping line ("Du · Provet · Övningen · …").
- Rows stack: the label above, then its value or `.fo-seg` at full width.
- The double rule, Logga ut (full-width quiet button) and Radera kontot (a link).
- The tabs stay. Today the phone has no tab bar here and only Home's avatar leads in. The avatar sheet's entries both open this page.

```
+--------------------------------------+
| HP·Coach                        (o)  |
| KONTO                                |
| Ditt konto.                          |
| Ändringar gäller direkt och följer   |
| med till dina andra enheter.         |
| Du · Provet · Övningen · Utseende ·  |
| Din data · Hjälp                     |
| Du                                   |
| ------------------------------------ |
| Namn                                 |
| {namn}                               |
| …                                    |
| Provet                               |
| ------------------------------------ |
| Provdatum               Höstprov 26 →|
| Mål                             2,0 →|
| Övningen                             |
| ------------------------------------ |
| Frågeurval                           |
| smart · slumpat                      |
| -----                                |
| …                                    |
+--------------------------------------+
| Idag   Öva•  Provpass  Uppslag  Fram |
+--------------------------------------+
```

**Reuses.**
- `FolioPage`, the masthead and `.fo-h2`.
- `.fo-seg`: the account slip's three-word theme control for its look only, since its System behaviour is not reusable (Tema · System above), and two-word rows through B2's column-count change (§1.5).
- `.fo-menu-sep` (the double rule), `.fo-link`, `.fo-quiet-btn` (Logga ut), `FolioSlip` (screen 9) and `.fo-leader`.

**New.**
- `SettingRow`: a label with either a word choice, a value plus Ändra, or a link.
- `.fo-btn--grave` (§4).
- `FarewellPage`: ⁂, "Farväl", "Kontot är raderat.", "Allt är borta. Tack för att du testade HP-Coach." and **Till inloggningen ↵**. It stays until pressed. Today the message only flashes before the redirect.

**States.**
- **Loading.**
  - The identity rows are sättning. **Never** the sample identity "Loucmane Benali / loucmane@exempel.se", which is today's fallback while sign-in loads.
  - Settings show their stored values at once, because they are local first.
- **Saving.** A setting applies at once.
  - If the save fails, the setting returns to its old value **and** an erratum beside it says "Det gick inte att spara – försök igen."
  - Today it silently reverts.
- **Export:** "Exporterar …" on the link while running. On failure: "Kunde inte exportera just nu. Försök igen om en stund." (the real copy, now also for the menu's export, which fails silently today).
- **Import:**
  - "Importerar …", then "Klart – din data är återställd.";
  - the real error lines: "Filen är inte giltig JSON.", "Filen ser inte ut som en HP-Coach-export.", "Importen misslyckades.".
- **Delete:**
  - "Raderar …";
  - failure: "Kunde inte radera kontot. Inget raderades – försök igen.";
  - success: the farewell page.
- **Signed out.** Sign-in, as today. Help and legal stay public, and they keep the frame when the reader is signed in. Today they drop all app navigation.
- **Sign-in service failed** (app-wide): "Inloggningen kunde inte starta – det beror oftast på ett tillfälligt anslutningsfel. Försök igen." + **Ladda om ↵**. Today's copy says "en tillfällig anslutning".
- **Done** does not apply; Konto is a place, not a task.

**Navigation.**
- **In:**
  - the account slip's "Konto" (the page top) and "Inställningar" (`#provet`);
  - Öva's "Frågeurval · Ändra" (`#ovningen`);
  - Framsteg's goal tick "mål 2,0 →" (`#provet`);
  - the palette;
  - the legal pages.
- **Out:** the frame. Esc goes back to where the reader came from. Today `/mer` claims Esc works and it does not.
- The account slip keeps its quick theme control and its **Logga ut**. Folio's slip already has it on every frame page; today's app has it only in Home's menu.

**ADHD-PI.**
- **One place for every setting,** grouped by what the reader is thinking about (the exam, practice, looks, data), not by implementation.
- **Changes apply at once,** with no save step to forget.
- **Destructive acts are slow on purpose:** a slip, typed confirmation and a safe default.
- **The goal and the exam date** make every "gap to the goal" sentence elsewhere true to the reader.

**Accessibility.**
- **Word choices** are `fieldset`s with legends ("Frågeurval") and `aria-pressed` buttons. Their hints are linked with `aria-describedby`, so they are visible and announced.
- **The anchors** are a `nav` "På den här sidan".
- **The type-to-confirm field** has a visible label. The button's disabled reason is announced: "Skriv ”radera” för att aktivera knappen."
- **The farewell page** has `h1` "Farväl".

**Unmistakably Folio.**
- Settings set as an imprint page: definition rows with leader dots, word choices underlined in ink-blue instead of toggles, a margin index of the page, and the account's end behind the same double rule as the paper slip.
- No switches, no cards, no chevron rows.

### Screen 14 · ELF-läsfråga — English reading (B3)

**Purpose.** Read an English text and answer its questions. The **primary action** is **Svara ↵**, then **Nästa fråga ↵**, as in the Swedish reading drill.

**What it shows (plain terms).**
- **Övningstexter only.** After the LÄS/ELF switch (Amendment 1, PR4 not yet landed), ELF serves synthetic units, whole, with the ÖVNINGSTEXT badge and the authorship note. Once PR4 lands, authentic ELF is no longer served to students; until then, see States. There are 61 units and 173 questions today.
- **Three kinds of text:**

  | Kind | Length | Questions |
  |---|---|---|
  | Long text | about 700 words | several |
  | Short text | 105–160 words | one or two |
  | Gap text (cloze) | about 350 words | five gaps, each a question |

- **Each unit** has an English title (its own field), paragraphs, and a byline ("– Prudence Dabbershaw writes a column on working life for a monthly magazine.").
- **Questions** are English and formulaic: detail, inference, main idea, conclusion, attitude, vocabulary. Some quote the text with “…” or ‘…’, and some end in "…" for the options to complete.
- **Four options, A–D,** in English. A gap's options are single words.
- **The facit:** Swedish headings around **English explanations.** ELF explanations are English by policy. P5 explanations quote with “…” and refer to steps as "(step 2)".

**Layout — desktop.** Screen 2's spread, unchanged in structure, with the language marked. This is the screen's real work.
- **`lang="en"`** on:
  - the passage `article` (title, paragraphs, byline);
  - the prompt;
  - every option;
  - every English block of the facit (the bodies of "Därför lockade …", Fallgropen, Tekniken, Lösningen, the step titles and texts, the other options' reasons);
  - any English phrase quoted inside Swedish UI.
- **The chrome stays Swedish**, `lang="sv"`:
  - the running heads. On desktop the ÖVNINGSTEXT badge lives there only, as in round 1;
  - the passage's tools row ("Om texten", and on phone the badge) and the note. These take `lang="sv"` explicitly, because they sit inside the English article;
  - the verdict, the facit's headings, the key hints, the buttons and the echo.
- **English typography inside the English blocks:**
  - “…” and ‘…’ as in the source;
  - the spaced en dash as in the source;
  - `hyphens: auto` with English rules (they follow `lang`) and `hyphenate-limit-chars: 6 3 3`. Today the bake-offs would hyphenate English with Swedish rules;
  - the same measure (29 em ≈ 62–66 English characters) and the same Literata.
- **Short texts** use the same spread. The verso simply ends early, leaving paper below. A short text is not shrunk to a card.

```
 a long or short text ("lang:en" / "lang:sv" annotate a block's language; they are not on screen)
+----------------------------------------------+--+--------------------------------------------+
| [x Avsluta]  ELF·ÖVNINGSTEXT  [¶ Styckefokus]|  |  ••@◦◦  Fråga 3 av 5               ◷ 11:20 |
| -------------------------------------------- |  | ------------------------------------------ |
|  Om texten                          lang:sv  |  |                                   lang:en  |
|  {English title}                    lang:en  |  |  What is the writer’s main point in the    |
|                                              |  |  third paragraph?                          |
|  1  …                                        |  |  ----------------------------------------- |
|  2  …                                        |  |  (A)  …                               (/)  |
|  3  …                                        |  |  (B)  …                               (/)  |
|  – {byline}                                  |  |  (C)  …                               (/)  |
|                                              |  |  (D)  …                               (/)  |
|                                              |  |  A–D väljer · ↵ svarar          lang:sv    |
|                                              |  |  (( Svara  ↵ ))   Välj ett alternativ      |
+----------------------------------------------+--+--------------------------------------------+
```

**Gap texts (new: `GapMark`).** A gap is set in the passage as a ruled blank: 5 em wide, a 1 px `--fo-ink-3` bottom rule, and the gap number in Inter 600 t12 inside it. Its states:

| State | How it looks |
|---|---|
| Current | The rule and number turn `--fo-accent` (2 px), and the verso scrolls the gap into view (instant under reduced motion) |
| Chosen, not yet answered | The chosen word is pencilled into the gap in italic Literata `--fo-accent-ink`, the number moving to a superscript. The reader can hear the sentence with the word in place, which is how a gap is tested (open question 10) |
| After grading | The right word in ink with the evidence underline (`.fo-ev`). If the pick was wrong, it stays struck through with the dotted `--fo-bad` underline of a wrong quotation, followed by the right word. Colour stays on the chosen and the right answer only |

**The recto for a gap.**
- The recto's head names the question ("Fråga 1 av 5"). The prompt slot reads "Lucka 1" (Swedish chrome, `t24`), so the position is not said twice. The data's English "Gap (1)" is not shown.
- Under it, **the gap's sentence is quoted** (`lang="en"`, italic, `.fo-note`'s left rule): "… though it quietly takes its ___ on the general mood." Once an option is chosen, the quoted gap shows the pencilled word too.
- The options follow.
- The sentence is derived from the passage, so the reader never has to look away from the options to test one.

```
 a gap text (P5 "Left to Soak", gap 1, after choosing C; [toll¹] is a gap with its pencilled word)
+----------------------------------------------+--+--------------------------------------------+
| [x Avsluta]  ELF·ÖVNINGSTEXT  [¶ Styckefokus]|  |  @◦◦◦◦  Fråga 1 av 5               ◷ 01:05 |
| -------------------------------------------- |  | ------------------------------------------ |
|  Om texten                                   |  |  Lucka 1                                   |
|  Left to Soak                                |  |  | “… though it quietly takes its [toll]   |
|                                              |  |  | on the general mood.”          lang:en  |
|  1  By four o’clock the office sink has      |  |  ----------------------------------------- |
|     acquired a saucepan, two plates, a mug   |  |  (A)  price                           (/)  |
|     and the lid of somebody’s lunchbox. …    |  |  (B)  charge                          (/)  |
|     though it quietly takes its [toll¹]      |  |  (C)  toll           <- chosen        (/)  |
|     on the general mood.                     |  |  (D)  cost                            (/)  |
|  2  The first countermeasure is a notice. …  |  |  ----------------------------------------- |
|     beneath the sponge the message is        |  |  (( Svara  ↵ ))   Ditt val: C              |
|     [___2___], and it is aimed at certain    |  |                                            |
|     chairs. …                                |  |                                            |
+----------------------------------------------+--+--------------------------------------------+
```

**Layout — phone.** The round-1 phone drill: the passage first, the question slip peeking, opening and going full for the facit.
- **The slip names the question** ("Fråga 1 av 5"); the head does not. The badge follows round 1's rule: above the passage, and in the slip's head only once the passage's badge has scrolled away.
- **For a gap, the peek** holds "Lucka 1" and the quoted sentence above "Visa de fyra alternativen". The open slip adds "Visa texten ⌄" to its head.
- **The current gap is kept above the slip's top edge.** The passage scrolls by the slip's height when the slip opens.
- **Choosing** pencils the word into both the passage gap and the quoted sentence.

```
 the slip open, after choosing C
+--------------------------------------+
| [x Avsluta]    [¶ Fokus]    ◷ 01:05  |
| ######.............................. |
| ÖVNINGSTEXT   Om texten              |
| Left to Soak                         |
|  1  By four o’clock the office sink  |
|     has acquired a saucepan, …       |
|     though it quietly takes its      |
|     [toll¹] on the general mood.     |
+--------------------------------------+
| / Fråga 1 av 5         Visa texten ⌄ |
| / Lucka 1                            |
| / | “… quietly takes its [toll] on   |
| / | the general mood.”               |
| / (A) price                     (/)  |
| / (B) charge                    (/)  |
| / (C) toll       <- chosen      (/)  |
| / (D) cost                      (/)  |
| / ((            Svara            ))  |
| /           Ditt val: C              |
+--------------------------------------+
```

**Reuses.** All of round 1's reading drill:
- `Spread`, `PassageView`, `.fo-para`/`.fo-pnum`, Styckefokus, `Options`/`GradedOptions`, `Verdict`, `Facit`, `Cites`, `Rich`;
- the phone slip (`useSheet`);
- the colophon;
- the seam from screen 6 (repetition, pass and review modes).

**New.**
- **The `ElfPassage` wrapper** is built by B1 (screen 6), so ELF questions in Repetera and the pass are marked before this batch. It sets the language attributes and the English typography: `:lang(en)` rules for hyphenation limits and quotation glyphs. B3 completes it with the English facit blocks.
- **Gaps.** `GapMark`'s chosen and graded states (B1 builds the plain blank for MEK), the gap's quoted sentence (`GapContext`), and gap-aware scrolling.
- **English citation rules in the kit.** The kit's paragraph and quotation finders are Swedish-only today. They match "sjätte stycket" and ”…”, and miss "first paragraph", "opening/closing paragraph", "the first two paragraphs" and the 2000s years ELF texts use, and they mis-pair “…”. B3 needs an English mode: English ordinals, curly double and single quotes (nested), years 1500–2099, and the P5 "(step 2)" references (already matched).
  - **This is a shared-kit change:** coordinate it, or have it admitted to B3's write set.
  - **Until it lands, the ELF facit shows no ¶ links rather than wrong ones.**
- **The fixture.** The committed P5 sample (`pipeline/synthetic/infold/preview/sample/p5-bank-sample.json`) holds two ELF units, and **neither is a long text**: the gap text `elf-b18-002` "Left to Soak" (five gaps, with their explanations) and the short `elf-b19-003` "Counting Pots from the Pavement" (one paragraph, one question).
  - **A long unit is a needed shared-fixture addition.** The proposed source is `elf-b18-001` "Under the Flags": five paragraphs and five questions, approved by the owner's batch-18 ruling (`pipeline/synthetic/infold/approval-roster.json`). Its five explanations are already in `data/explanations/p5-pilot.json`.
  - It comes in through the shared view model and its fixtures (hpf-qr0p.7), by re-exporting the sample with the unit added. The fixtures are copied by script and pinned by tests, so it is never retyped.
  - **Until it lands,** B3 builds screen 14 on the two short units, with no invented or authentic long text as a stand-in. The long-text checks (several paragraphs at the measure, Styckefokus across them) wait for it.

**States.**
- **Loading.** The running heads are real at once. The passage is sättning bars at the English measure, with the ¶ numbers' margin kept, and the recto is bars as on screen 6.
- **The note.** It is shown on demand ("Om texten"). On a unit's first open it may be expanded (open question 13).
- **Explanation loading, failed or missing.** As screen 6: "Förklaringen laddas …", the erratum "Förklaringen gick inte att hämta." + "Försök igen", and "Förklaring saknas ännu för den här frågan." The verdict always stays.
- **An English body missing.** The Swedish headings never render empty. A missing block is dropped with its heading.
- **An authentic ELF unit** (until PR4 lands). There is no badge and no note, and its explanation keeps the source's straight quotes. It has no ¶ links, because authentic texts lost their paragraph breaks in parsing.
- **A retired unit**, opened from history or a repetition: "Den här övningstexten har tagits ur bruk." with **Till Öva ↵**.
- **Done.** The colophon, with the title in English (`lang="en"`), the facts row in Swedish, the plan's next part filled and the way back as a quiet link.

**Navigation.**
- **In:**
  - Öva's ELF entry;
  - Idag's plan (an ELF övning);
  - Repetera's ELF misses;
  - the verbal provpass (questions 31–40, `mode: pass`);
  - an ELF lesson entry's "Öva denna frågetyp" (screen 12);
  - Historik's rows, through the review.
- **Out:**
  - **Avsluta** returns to the origin, saved;
  - the colophon offers the plan's next part, or the quiet way back;
  - Esc clears Styckefokus and closes slips, as in round 1, and never leaves the text.

**ADHD-PI.**
- **The gap's sentence beside the options** removes the eye travel a gap text otherwise demands.
- **The pencilled word lets the reader test the sentence** before committing.
- **Styckefokus works on English paragraphs too.**
- **Every English question is one keypress from its evidence** (¶ links) once the kit's English rules land.

**Accessibility.**
- **The core is the language attributes.** Screen readers switch to an English voice for the text, question, options and English explanations, and back to Swedish for the chrome. Today the whole app, ELF included, is `lang="sv"`.
- **`GapMark`'s hidden label** is Swedish, with `lang="sv"` ("lucka 1, tom" / "lucka 1: toll"), because it is chrome inside English text.
- **The quoted sentence** is a `blockquote` with `lang="en"`.

**Unmistakably Folio.**
- The same book spread, now set in English with English typographic manners.
- Gaps are ruled blanks with the chosen word pencilled in like a margin correction, and the gap's sentence is quoted on the facing page.
- The only Swedish is the book's apparatus around the text.

---

## 3. Shared plumbing the batches depend on

- **Screens 5–14 in the stage.** The bake-off's screen list grows from four to fourteen. That is a shared registry change, not a direction's.
  - **Owner:** a shared enabler bead that lands before B1, as hpf-qr0p.2 did for round 1b. All eight directions need the same change to the switcher's screen list and screen type. If there is no such bead, B1's write set must admit those shared files.
  - Folio's root routes:
    - **frame pages** (Folio's `FolioFrame`): s5 → `ova`, s8 → Öva's Repetera page, s9 → `provpass`, s10 → the result, s11 → `framsteg`, s12 → `uppslag`, s13 → the Konto page;
    - **focus screens:** s6, s7, s14 and a running pass.
  - Every frame page is also reachable from Folio's own navigation, as round 1's stubs are now.
- **Data.** Every screen reads the shared view model (hpf-qr0p.7). Where a screen needs something the live app does not have, this spec marks it **New**:
  - Provdatum and Mål;
  - a saved System theme (screen 13, open question 19);
  - read progress per section;
  - the gap's sentence;
  - the ripening time of a miss;
  - an estimate range;
  - local calendar days;
  - the earlier wrong pick.
- **Shared-fixture addition** (screen 14): a long ELF unit, which the committed P5 sample lacks. The proposed source is the approved `elf-b18-001` "Under the Flags", added through hpf-qr0p.7.
- **The drill-view seam** (screen 6): `mode`, the running-head label, `Verdict.after`, the next label and the content's `lang`. B1 builds it and converts the round-1 reading drill to it; B2 and B3 use it.
- **Shared-kit changes** (`r1Kit.ts`), both outside a direction's folder:
  - B1's NOG "(1)/(2)" citation rule (screen 6);
  - B3's English citation mode (screen 14).

  Each needs its batch's write set to admit the kit, or a coordinated kit bead. Until it lands, the facit shows no links of that kind.
- **Wiring changes to the round-1 screens.** Each belongs to the batch whose screen it serves:

  | Batch | Change |
  |---|---|
  | B1 | Idag's plan rows open their item (Repetition → screen 8, an övning → its drill), not the Öva page. The colophon's "Nästa: Repetition" opens screen 8. |
  | B2 | Idag's lead can show a running pass (ribbon, **Fortsätt provpasset**). **A running pass outranks a paused text**, because its clock is running; the paused text becomes the first row under "Sedan" ("Fortsätt: Magasinet i Hökaryd"). Idag's prognosis head links to Framsteg. "Alla fällor i Framsteg" and "Alla pass i Framsteg" land on the Fällor sub-page and Historik. The "Senaste passen" rows become links to their end pages (today they are plain text). A plan item that suggests a pass opens screen 9's conditions slip. |
  | B3 | The facit's framework line becomes a link with the readable name (screen 12). Idag's lesson row ("ELF-lektion · Slutsatsdragning / implikation") opens that entry, not the hub. The account slip's Konto and Inställningar open screen 13. Its Hjälp, whose hint promises "Kortkommandon, frågor", opens screen 13 at `#kortkommandon`. |
- **One shared Folio parts file** (`a-folio/parts.tsx`) holds the page grammar and the shared components (§4). B1 creates it. **Later batches extend it rather than fork it.** If a batch's write set does not admit it, the batch says so in its notes instead of copying a component.
- **Tests.** The batches keep the round-1 `rd-*` test-id convention and extend the shared contract suite. The new ids are named by the shared contract's owner, not invented per direction.

---

## 4. Component inventory

| Component (proposed `fo-` class) | Built by | Used by | Notes |
|---|---|---|---|
| `FolioPage`, `Masthead` (`.fo-page`, `.fo-masthead`), `.fo-lead-title` | **B1** | 5, 8, 9, 10, 11, 12, 13 | The `.fo-home` grid made generic: a main column plus an optional 288 px margin. The hub lead's headline is `t44`, phone `t32` |
| `Lead` (`.fo-resume` + `.fo-ribbon`) | **B1** | 5, 8, 9, 10, 11, 12 | Heavy rule; ribbon only for "where you are" |
| `ContentsEntry`, `PartHead` (`.fo-entry`, `.fo-part`) | **B1** | 5, 8, 9 (phone), 11, 12 | Extracted from `.fo-plan-row` |
| `MarginBlock` (`.fo-aside-block`), as a labelled `aside` | **B1** | 5, 8, 9, 10, 11, 12, 13 | Italic heads |
| `Sattning`, `EmptyLine`, `Erratum` (`.fo-sk`, `.fo-empty`, `.fo-erratum`) | **B1** | all | The §1.7 state patterns |
| `FolioDialog` | **B1** | 6, 7 (Förstora); B2's `FolioSlip` | Focus trap, Esc, return of focus |
| Drill-view seam (`mode`, running-head label, `Verdict.after`, next label, `lang`), and the round-1 reading drill converted to it | **B1** | 2, 6, 7, 8, 9, 10, 14 | The cross-batch contract |
| `KeyHints` with parameters; `Spread` with a start width | **B1** | 6, 7, 14 | Today hard-coded to A–D and F, and to a 0.56 start |
| `QuantPage` + opening spread, `QuantProblem`, `KvaQuantities`, `NogStatements`, `FixedOptions` | **B1** | 6, 8, 9, 10 (review) | ORD and MEK ride on `QuantPage` |
| `FigureInline`, `FigureViewer`, `FigurePlate`, `ImageOption`, `PageGroupCue` | **B1** | 6, 7, 8, 9, 10 (review) | The plate persists across its questions |
| `TacticNote` | **B1** | 6, 7 | A margin note on 6, a disclosure on 7 and on phone; hidden in a pass |
| `ElfPassage` (`lang="en"` + `:lang(en)` typography) | **B1** | 8, 9, 14 | Built early so ELF is marked wherever it appears; B3 completes the facit blocks |
| `GapMark`, plain blank | **B1** | 6 (MEK), 14 | B3 adds the pencilled and graded states |
| Entry-name helper (readable framework names, "LAS" → "LÄS") | **B1** | 3/6 (facit line), 11, 12 | Fixes the raw-id chips |
| NOG "(1)/(2)" citation rule | **B1** (shared kit) | 6 | Needs the kit admitted; no links until then |
| `RoundList` (`.fo-roundlist`) | **B1** | 6, 7, 8, 10 | Outcome as glyph + word |
| `Colophon` slots (disclosure, estimate line) | **B1** | 6, 7, 8, 12 | Extends round 1's |
| `--fo-math-scale` (token) | **B1** | 6, 8, 9, 12 | The only new token. `.fo-btn--grave` (B3) is a class variant on existing tokens |
| `FolioSlip` (`.fo-slip`) | **B2** | 9, 13 | Built on `FolioDialog`, `.fo-menu` and `.fo-scrim` |
| `.fo-seg` with a column count that follows its words | **B2** | 9, 13 | Today a fixed three-column grid |
| `RuledTable` (`.fo-table`) | **B2** | 9, 10, 11 | A real table, with optional leader dots |
| `PassIndex` + the Översikt grid, `Countdown` | **B2** | 9 | Countdown milestones at five and one minute |
| `Scale` exported with parameters, `ResultFigure` | **B2** | 10, 11 | `t44` figure + label + scale (band optional) |
| `TrendChart`, `WeekDots`, `TrapRegister`, `Ledger` | **B2** | 11 (Framsteg, Historik, Fällor) | SVG chart with a table fallback; `Ledger` also serves Framsteg's five rows; `TrapRegister` fills the Fällor sub-page |
| `LessonSpread`, `TrapArticle`, `ProtocolArticle`, `LexiconArticle`, `WorkedExample`, `ExampleQuestionList`, `ReadToggle` | **B3** | 12 | Uppslag as a spread |
| `SettingRow`, `.fo-btn--grave`, `FarewellPage` | **B3** | 13 | `.fo-btn--grave` is filled ink, for deletion only |
| `GapMark` states, `GapContext`, gap-aware scrolling | **B3** | 14 | On B1's plain blank |
| Kit English citation mode | **B3** (shared kit) | 14 | Needs the kit admitted; no ¶ links until then |

**Order matters, and the table is ordered so no batch waits on a later one.**
- B1 builds everything its own screens use, plus the pieces later batches need early: the dialog, the seam, the ELF wrapper, the name helper and the plain gap.
- B2 and B3 only extend.

---

## 5. Open questions for the owner

1. **Quant layout.**
   - **Recommended:** a single page that opens to a spread on answering (screen 6).
   - **Alternatives:** always a spread, or always one column.
2. **Two-step answering in quant, ORD and MEK.** Choose, then Svara (Folio's round 1), versus the live app's answer-on-first-tap. **Recommended:** keep the two-step.
3. **The provpass clock.** **Recommended:** foldable to its line, with word milestones at 5 and 1 minutes. **Alternative:** always visible.
4. **Provpass marks.** Add "Markera för återkomst" (flagging a question in the index)? It is not in the live app.
5. **Framsteg's streak.** **Recommended:** drop "aktuell serie" and "rekord" in favour of days per week. **Alternative:** keep a neutral "längsta serie".
6. **Goal and exam date as settings** (screen 13). Needs data support. Until then, should Framsteg use 2,0, the product's target, instead of the hard-coded 1,8?
7. **The palette setting** (sand · sage · ink · rose · spalt). **Recommended:** drop it in Folio, because the direction is one palette.
8. **A text-size setting** ("Normal · Större"), as a new accessibility control? Font and density cannot be changed by users today.
9. **DTK plates in dark mode.** **Recommended:** keep the white printed page. **Alternative:** dim it.
10. **ELF and MEK gaps.** **Recommended:** pencil the chosen word into the gap before answering. **Alternative:** show it only after grading.
11. **Uppslag.** **Recommended:** a spread on desktop. **Alternative:** a single column of entries.
12. **"Läst – nästa"** as one action, versus a separate "Markera som läst".
13. **The ÖVNINGSTEXT note.** Expanded on a unit's first open, or on demand only (carried over from round 1)?
14. **The thumb-index rail and word-only phone tabs.** Round 1's deliberate risks; still the owner's call.
15. **A single-section drill's estimate line in the colophon.** **Recommended:** "NOG-prognosen steg till 1,30", only on a change of 0,05 or more. **Alternative:** never.
16. **ORD and MEK** have no screen of their own in 5–14. Confirm they ride on screen 6's single page.
17. **After a pass, the review comes first** (screen 10). Or should the primary action be a new pass, or Repetera?
18. **The Öva count in the navigation.** **Recommended:** the misses ready now, which is what its screen-reader text already says ("att repetera"). **Alternative:** today's pile, which includes misses ripening in the next ten minutes.
19. **Tema · System** (screen 13). Production saves only light or dark. Add System, saved and synced like the other settings, so that each device follows its own setting live? It is New work: a third saved value, in the app and on the server, and a listener. **Recommended:** add it. Round 1's slip already offers it, and following the device spares a manual switch every evening. **Alternative:** Ljust · Mörkt only, both saved and synced as today.

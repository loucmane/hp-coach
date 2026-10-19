# C · Spår — round 2 screen design spec (B0): screens 5–14

Bead `hpf-qr0p.35`, a document only, with no code. This spec extends direction C · Spår ("En uttrycksfull lärstig") from its four round-1 screens (Idag, Läsfråga, Facit, Navigering) to the rest of HP-Coach, so the three build batches read as one design:

| Batch | Screens |
|---|---|
| **B1** | 5 Öva · 6 Kvantfråga (XYZ, KVA, NOG) · 7 DTK · 8 Repetera |
| **B2** | 9 Provpass (hub and a running pass) · 10 Provpassresultat · 11 Framsteg (incl. Historik) |
| **B3** | 12 Uppslag & lektion · 13 Konto & inställningar · 14 ELF-läsfråga |

**Sources read.**
- The direction: `app/src/components/devbake/redesign/c-spar/` (`meta.ts`, `Spar.tsx`, `SparHome.tsx`, `SparDrill.tsx`, `sparParts.tsx`, `spar.css`).
- The shared kit and fixtures (`r1Kit.ts`, `r1Fixtures.ts`), the brief (`docs/redesign/2026-10-round1-brief.md`) and the round-1 worklog with every reader's critique (`docs/worklog/hpf-qr0p.md`).
- The real screens for content and states (`routes/ova.tsx`, `drill.tsx` + `components/drill/*`, `repetition.tsx`, `prov.tsx` + `components/mock/*`, `screens/ProgressMobile.tsx` + `routes/progress.tsx` + `historik.tsx`, `lektion.tsx` + `components/lesson/*`, `konto.tsx`, `mer.tsx`).
- Real P5 content from `pipeline/synthetic/infold/preview/sample/p5-bank-sample.json` and `data/explanations/p5-pilot.json`.

**Conventions.** UI copy is Swedish and appears in quotes or inside the wireframes; everything else is English. A parallel bead (`hpf-qr0p.7`) builds the shared data view model, so each screen describes its data in plain words, never as types. Class names in `code` are Spår's existing `sp-` classes. A name in **bold** with a `Spar` prefix is a new component that this spec asks a batch to build. The component inventory at the end (§4) lists who builds what.

**Wireframe legend.**
- `(◉)` is the account avatar; `[◉]` is the avatar pressed.
- `[XYZ]` is a section chip; `(XYZ)` is a section stop.
- `✓ ↻ ◉ ⚑ ○` are stop states (§1.2).
- `[ … ]` is a button. The green pill shows its key on desktop (`[ … ↵ ]`) and is drawn with double brackets on phone (`[[ … ]]`), where keys are hidden.
- `•` after a navbar or rail icon marks the current destination; `°` marks Öva's dot (misses waiting).
- Wireframes show structure and copy, not exact proportions.

---

## 1. Spår's language — the rules every batch keeps

### 1.1 The idea in one line

**Everything you move through is a path of stops.** Spår has one structural device and uses it everywhere: a *stig*, a sequence of *stops* (round nodes) joined by a 2 px line, with a clear end. Round 1 used it for the day (Idag), a text's questions (the drill's top bar), an explanation's steps and the unit's end. Round 2 uses the same device for every sequence the learner meets:

| Sequence | Where | Path form |
|---|---|---|
| The day's steps | Idag (built) | vertical, gutter 64 px, ends in a goal |
| A text's or a session's questions | every question screen's top bar (built) | horizontal, 32 px stops (DTK: grouped by page) |
| An explanation's steps | Facit (built) | vertical, 34 px dots |
| The ripe misses, oldest first | Öva's station (horizontal), Repetera's queue (vertical) | each stop ringed in its section's hue, ending in a goal |
| A Provpass's four legs | Provpass hub, top bar, result | the **route ribbon**: one bar split into section legs |
| The 40 questions of a Provpass | running pass, result | a **switchback**: rows of ten that turn back like a mountain trail |
| A section's catalogue | Uppslag & lektion | a vertical contents path; read entries ✓ |
| A trap's worked example | Uppslag & lektion | four stops: setup → the trap's thought (↻) → the right thought (✓) → answer (⚑) |
| Weeks of practice | Framsteg | an **elevation line** climbing towards the goal |
| Passes, day by day | Historik | vertical, grouped by day |

When a batch meets a new sequence, it draws a stig. It does not draw a list of cards, a table or a progress bar.

### 1.2 Stops: one vocabulary of states

A stop is a disc with a state. Round 1 drew these in four places (`sp-prog-node`, `sp-node-mark`, `sp-mini-node`, `sp-step-dot`), each restyled locally. Round 2 makes them one component, **`SparStop`**, built in B1 and used by every later batch.

| State | Look (light) | Glyph | Word for screen readers |
|---|---|---|---|
| `todo` | `--sp-sunk` disc, ink-3 number | the number | "kvar" |
| `now` | card disc, 3 px `--sp-ink` ring | the number | "pågår" |
| `right` / `done` | `--sp-ok` fill | ✓ (lucide `Check`, 3 px) | "rätt" / "klar" |
| `miss` | card disc, 2 px `--sp-warn` ring, `--sp-warn-ink` glyph | ↻ (`RotateCcw`) | "lagd i Repetera" |
| `answered` (running Provpass only: not yet graded) | solid `--sp-ink` disc, card-coloured number | the number | "besvarad" |
| `flagged` (Provpass only) | card disc, 2 px ink ring with a notch | ⚑ (`Flag`, 12 px) | "markerad" |
| `blank` (Provpass result only) | card disc, 2 px dashed `--sp-ink-3` ring | – | "obesvarad" |
| `goal` | `--sp-sunk` rounded square turned 45° | `Flag` | "mål" |
| `section` (Öva, Historik) | card disc, 3 px ring in the section's strong hue | the section code, 11 px | the section's name |

- Sizes: 20 (inside an ELF gap slot), 24 (compact top bar, phone), 32 (top bar, switchback, a lesson's contents), 36 (mini path, Historik, section rows), 44 (plan steps, section tiles, the Repetera queue), 64 (the current stop with its ring, Idag only).
- Connectors are 2 px `--sp-sunk-2` lines on vertical paths, and 6 px (4 px compact) pills on the top bar. A connector after a `right` stop fills with `--sp-ok`, and after a `miss` with `--sp-warn`. The fill runs on the spring.
- A miss is never red on a path. Red (`--sp-bad`) appears only on the verdict glyph and on the "Ditt svar" card of a graded question. The one exception outside grading is the irreversible "Radera kontot permanent" (screen 13).

**Variants.** Any stop can take three modifiers, so new sequences need no new component:
- **Ring hue:** `data-sec` puts the section's strong hue on the ring of a numbered stop. Used for NOG's statements (1) (2), Framsteg's ranked steps and the Repetera queue.
- **Glyph and word:** a custom glyph with its own spoken word. Examples:
  - the Roman numerals I and II on KVA's quantities;
  - ⌛ "provpass" and `↝` "blandad" in Historik, on a neutral ink ring;
  - ↻ "fällans tanke" in a lesson's worked example (the same amber ring, with a different word).
- **Outline:** a `right`/`done` stop drawn as a 2 px `--sp-ok` ring with an `--sp-ok-ink` glyph, where a fill would shout (the worked example's "Korrekt tanke").

In a running Provpass, an unanswered question is a plain `todo` stop whose word is "obesvarad". `blank` (the dashed ring) belongs to the result only.

Stop numerals and counts are set in Bricolage at any size, as built (`.sp-prog-node` at 14 px, `.sp-trap-count` at 17 px). §1.4's 19 px floor applies to words.

### 1.3 Tokens (existing; no batch invents colour)

Every round-2 screen uses the tokens in `spar.css` as they are. Light values are listed; dark lowers chroma (§1.6).

| Role | Tokens |
|---|---|
| Ground | `--sp-canvas` oklch(98.2% 0.006 95) · `--sp-card` white · `--sp-sunk` · `--sp-sunk-2` · `--sp-line` |
| Ink | `--sp-ink` oklch(24% 0.03 268) · `--sp-ink-2` · `--sp-ink-3` · `--sp-text` (the passage) |
| Go / the one action | `--sp-primary` oklch(49% 0.135 155) · `-2` (hover) · `-soft` · `-ink` · `--sp-on-primary` |
| Verdicts | `--sp-ok` (152) and `--sp-bad` (14), each with `-soft` and `-ink`; `--sp-warn` (80, "repeat") with `-ink` only (there is no `--sp-warn-soft`) |
| Neutral marks | `--sp-hl` + `--sp-hl-bar` (cited paragraphs, quotes) · `--sp-focus` (265) · `--sp-scrim` |
| Section hues | one lightness and chroma for all eight: tint 93.5 % / 0.045, strong 66 % / 0.14, ink 40 % / 0.12. Hue `--h`: ORD 110 · KVA 45 · ELF 190 · LÄS 235 · DTK 262 · XYZ 290 · NOG 315 · MEK 340 · REP 268 at near-zero chroma |
| Shape | `--sp-r-card` 28 · `--sp-r-inner` 20 · pill 999. Nested radius = outer − padding |
| Elevation | `--sp-shadow-1` (resting card) · `-2` (the dominant card, menus) · `-up` (tray, sheets) |
| Motion | `--sp-spring` (selection, progress) · `--sp-spring-pop` (a finish only) · `--sp-t-spring` 520 ms · `--sp-ease` · `--sp-t1` 160 ms · `--sp-t2` 260 ms |
| Layout | `--sp-col` 760 px (reading column, tray and sheet) |

**New tokens allowed in round 2.** Each is a layout or type value; none adds a hue.
- `--sp-col-wide: 1000px` — the figure column on DTK (§3, screen 7) and the switchback on a Provpass result.
- `--sp-page: 1180px` — the max width of a destination page. It is today's `.sp-home` value, lifted to a token so Öva, Provpass, Uppslag and Framsteg align with Idag.
- `--sp-math: 1.06em` — the size of math relative to its surrounding text (§3, screen 6).

### 1.4 Type

| Use | Face, size / line height, weight, width | Built as |
|---|---|---|
| Page title | Bricolage Grotesque 64/0.98, 800, wdth 88, −0.038 em (phone 40) | `.sp-display--xl` |
| Section or result title | Bricolage 52/1.02, 800, wdth 88 (phone 34–42) | `.sp-display` |
| Station-card title | Bricolage 38/1.04, 800 (phone 29) | `.sp-now-title` |
| Reading-card title | Bricolage 42/1.02 (phone 32) | `.sp-title` |
| Group heading | Bricolage 21/1.2, 750, wdth 92 | `.sp-h3` |
| Small heading | Figtree 15, 800 | `.sp-h4` |
| Lede | Figtree 18/1.5, ink-2, max 34 em | `.sp-lede` |
| Passage | Figtree 18.5/1.66 (phone 18/1.62), max 32 em, `hyphens: auto` | `.sp-passage` |
| Explanation | Figtree 16.5/1.6, max 36 em | `.sp-fb-p` |
| UI | Figtree 15.5 (body of the frame), labels 13–15 at 650–800 | — |
| Numbers | `font-variant-numeric: tabular-nums` on every score, count, clock and minute | — |

- `text-wrap: balance` on headings and `pretty` on body text.
- Display *words* are Bricolage only at 19 px and up, so its optical size works for them. Below that, words are Figtree. Numerals in stops and counts are the built exception (§1.2).
- Swedish hyphenation in narrow columns, with `hyphenate-limit-chars: 10 4 4`. Names and section codes never break.

### 1.5 The one green action

Each screen has **one** filled `--sp-primary` pill, `.sp-btn--primary` (54 px `--lg` when it is the screen's main action), and it is always the next step. Everything else is quiet:
- `.sp-btn--quiet` for secondary actions;
- `.sp-link` for "go somewhere else";
- `.sp-show` for "reveal more here";
- `.sp-icon-btn` for tools.

The pill carries its key (`↵`) on devices with a keyboard. Green also means "correct" (`--sp-ok`, hue 152, a near neighbour of the primary at 155). The two never meet on a graded surface: in Facit, the green pill sits in the sheet's foot, below the line, away from the answer cards.

A view with no single next step does not get a green pill. There are three:
- settings (screen 13);
- the Historik list while it has passes in it (its empty state has "Till Öva");
- Uppslag's library before you have read anything or have any stats, where the eight sections are equal choices.

Every other view keeps one, even when empty. In an error state the pill is either the retry or the step that still works (e.g. Öva's section tiles while the queue fails to load).

### 1.6 Colour rules

1. **Section hue belongs to the section's label, never to its text.** It appears on:
   - a section chip (`.sp-sec-chip`: the code on the strong hue, dark text);
   - a card's tinted band (`.sp-now-band`, `.sp-band`, `.sp-strip`), and in dark a 4 px top line instead of a fill;
   - a stop's ring;
   - a 4–5 px inset bar on a card's left or top edge (`.sp-trap`, `.sp-tile`).

   It never appears behind a passage, a stem, an option or an explanation.
2. **At most one tinted band per viewport.** A page shows many sections through rings and bars, not through many tinted bands. This answers the blind reader's "pastel chips… pull it toward generic edtech".
3. **Selection is neutral ink**: a 2 px ink border, and the letter morphs into a tilted ink squircle. Green means go and correct, amber means "lagd i Repetera", and red appears only on a graded wrong pick and on the one irreversible button (account deletion, screen 13).
4. **Repetition is not a section.** `data-sec="REP"` is near-neutral (chroma 0.008–0.02), never green.
5. **Dark** (built): chroma drops (tint 30 % / 0.02, strong 72 % / 0.1), section bands become 4 px top lines, the answer cards become plain cards with a coloured icon and a left bar, and filled glyphs keep dark text. No pure black. Body text stays ≥ 7:1 (round 1's lowest was 11.42:1).

### 1.7 Motion

- **One spring** (`--sp-spring`, 520 ms, written with `linear()`) for:
  - selection: an option's tile rounds out (18 → 22 px), and its letter becomes a squircle rotated −8° at scale 1.06;
  - progress: a connector fills, a stop pops;
  - shape morphs (§1.9).

  `--sp-spring-pop` is used for a finish only: the verdict glyph, a completed stop, the end-of-unit chip.
- **Nothing moves inside a reading or problem column.** The passage, stem, figure and options never translate or scale while the learner reads. Only colour or opacity may change there (the flash on a cited paragraph, paragraph focus).
- Entrances: a page fades and rises 14 px on the spring (`.sp-enter`). The tray and sheets rise 36 px. Exits are faster: `--sp-t1`, opacity only.
- **Reduced motion:** nothing moves, springs included. Colour and opacity may fade over 120 ms (built in `spar.css`).
- **Lugnt läge:** springs drop to 1 ms and animations are off (§1.10).

### 1.8 The frame

**Destination pages (Idag, Öva, Provpass hub, Uppslag, Framsteg, Konto).** These use the built frame:
- **Desktop.** The M3 expandable rail (`.sp-app`, `.sp-rail`): 100 px folded with icon and label, 272 px expanded as a drawer, ⌘B / Ctrl+B to toggle. The account button sits in the rail foot and opens a popover menu.
- **Phone.** The app bar (`.sp-appbar`: the trail mark, "HP-Coach", the avatar button opening the account sheet) and the bottom navigation bar (`.sp-navbar`, five items with pill indicators).
- Destinations and icons: Idag `Route`, Öva `Footprints`, Provpass `Hourglass`, Uppslag `Lightbulb`, Framsteg `Mountain`. Öva carries a dot (`.sp-navdot`), never a count, while misses are due.

Each destination page has the same head, **`SparPageHead`**, lifted from `.sp-home-head`:
- an eyebrow (`.sp-eyebrow`), a display title (`.sp-display--xl`) and a lede, all on the left;
- the page's tools on the right on desktop (e.g. the countdown pill and the calm switch on Idag), and under the lede on phone;
- the content, max `--sp-page` (1180 px) wide, centred, with padding `44px clamp(32px, 4.4vw, 64px) 80px` on desktop and `2px 18px 36px` on phone.

**Phone page titles.** When the display title scrolls under the app bar, the app bar's "HP-Coach" cross-fades (opacity only, `--sp-t1`) to the page's name, e.g. "Öva". This is M3's large top app bar, without movement.

**Sub-pages inside a destination** (Repetera's queue inside Öva, a lesson inside Uppslag, a past pass inside Historik):
- They keep the frame and the current destination highlighted.
- They add a back link (`.sp-link` with `ArrowLeft`: "Öva", "Uppslag", "Historik") above the eyebrow. On phone the back link takes the brand's place in the app bar, as in M3.
- Browser back also works, but it is never the only way back.

Framsteg's two views, Översikt and Historik, are siblings switched by a `SparSegmented` in the page head, not a sub-page.

**Focus screens (every question screen and a running Provpass).** A lesson is not one: it is reading you dip in and out of, so it keeps the frame (screen 12).
- The navigation recedes into the built top bar (`.sp-top`, 72 px desktop; `.sp-ptop`, 60 px phone): "Avsluta" (or "Avbryt" in a Provpass, where leaving voids the pass, and "Stäng" in a review, screen 10) at the left, the section chip + the stig + "Fråga n av N" in the middle, and the tools at the right (calm switch, Fokus, clock).
- On phone the bar has room for neither the calm switch nor the words "Fråga n av N", as built in round 1:
  - the compact stig is the count, and each stop speaks "Fråga 3 av 4, pågår";
  - Lugnt läge is set from Idag or the account menu, and it persists into every focus screen.
- On phone the head hides on scroll, leaving a 4 px progress line (`.sp-thin`) and a pinned 44 px exit (`.sp-pin-exit`). The exception is a Provpass, whose head never hides.
- Every focus screen has this explicit, always-visible exit. None relies on browser back. Today's drills have no exit control at all.

**The tray rule: fold only when folding buys room.** The question tray (built on screen 2) carries the question, the options and "Svara".
- **When the content needs the room**, the tray opens **folded** to the whole question (never clamped), with "Visa alternativen (n)". This is a long text: LÄS, a long ELF text or a gap-fill text.
- **When the content fits above an open tray**, the tray opens **open**: a one-paragraph ELF text, every quant problem, every DTK question.
- **It is sticky.** Under a short problem it sits directly beneath the card; when the content is taller than the room left, it docks to the bottom edge.
- **On phone:**
  - long texts and DTK pages use round 1's peek / open / full sheet, peeking with the whole question;
  - a short problem (quant, a one-paragraph ELF text) puts its options in the flow under it, with a sticky answer bar, **`SparAnswerBar`** ("Ditt val: C · Svara").
- T folds and unfolds the tray on desktop in every case.

**Sheets: persistent or modal.** Spår has two kinds of layer, and no surface is both.
- **Persistent reading surfaces are never modal.** These are the question tray (desktop), the phone question sheet and `SparAnswerBar`, and Facit (the desktop sheet, the phone sheet, and the review's Facit on screens 10 and 11). They stay open while the learner still needs the passage, the figure, the tools and the always-visible exit, so they are siblings of the reading column, as built (`SparDrill.tsx`: on phone the reader's scroll at :1330 and the sheet at :1341; on desktop the tray and Facit sheet beside the reader's scroll in `DeskBody`, :423–458).
  - No scrim, no focus trap and no `aria-modal`. Each is a labelled region ("Fråga 3", or the verdict for Facit).
  - The passage, the problem, the figure and its "Förstora", and the top bar's exit, tools and clock stay reachable by pointer and keyboard. Tab and Shift+Tab move through the top bar, the reading column and the surface in visual order.
  - Nothing outside closes them: scrolling or tapping the passage leaves them as they are. They change height only through their own controls (the grab handle, "Visa alternativen", "Visa texten", "Visa mer av facit", T, choosing an option, a ¶ or "Visa uppgiften" chip), never by Esc.
  - The column's keys keep working while they are open: F/J/K, Z, R, G.
- **Modal layers are for short tasks that end when you choose, confirm or close:**
  - menus (the account menu);
  - choices and filters: on phone "Bara ett delprov", "Innehåll", a leg's stops on the result and search; on both, the Provpass overview;
  - dialogs: confirmations (abort, hand-in, the phone's Provpass rules, import) and a glossary term;
  - the full-screen figure viewer, which covers the screen and carries its own question strip and "Stäng".

  Only these trap focus and close on a press outside them (the scrim, on a sheet or a dialog). They also close on Esc and return focus to their opener, as an in-place card does (§1.9).
- On phone, sheets of both kinds attach to the bottom edge: full width, 28 px top corners only, a grab handle. Only the modal ones have a scrim. Spår's sheets never float inset; floating panels are Lager's language.
- On desktop, a choice that belongs to a card opens **in place** (§1.9). A confirmation that guards something irreversible uses a centred dialog with the same 28 px corners.

### 1.9 Container transform — Spår's desktop "open"

On desktop, a card **grows into its own next layer** instead of opening a modal over the page. It is used in four places:
- Öva's Repetera station, and Repetera's queue, into the per-section list ("Bara ett delprov");
- a Provpass station into its rules card;
- a Framsteg section row into its two actions;
- a Historik row into its question stops.

The card keeps its band and stop, its corners morph 20 → 28 px, and its neighbours step aside on the spring. This is M3 Expressive's container transform, and the move that separates Spår from a stack of modals.
- Only the card being opened moves. Content inside other cards never moves.
- Under reduced motion or Lugnt läge the card simply re-renders in its open state.
- Focus moves to the opened card's heading. Esc or "Stäng" returns the card and puts focus back on its button.

Starting practice never needs it: a section, a mixed round or Repetera starts on one press, as it does today.

### 1.10 Lugnt läge (calm mode) — the contract

Lugnt läge is Spår's answer to its known risk (overload and streak anxiety). Round 1 kept it as local state; round 2 makes it a **setting** (screen 13) that persists with your other settings and is still switched in place. Its switch is visible on Idag, in every desktop focus screen's top bar (compact: "Lugnt") and in the account menu. On phone, focus screens have no room for it, so it is set before (on Idag or in the account menu) and carries over. A running Provpass has no switch, because calm is enforced there.

When on, it:
- drops section chroma to about a quarter (`--sp-c-*`), and drops springs and animations to 1 ms;
- **hides the extra numbers and marks**: the Öva nav dot, the week's goal dots, the prognosis bar and its range, trend glyphs, deltas ("+0,1 sedan förra veckan"), Framsteg's climb and mini scales, Öva's per-section due counts, reading rings, and the colour fills on paths;
- **keeps the words** that carry the same facts, e.g. "Prognos ≈ 1,4 av 2,0", "4 av 5 dagar", "9 frågor rätt av 12";
- **never hides** the exit, the clock of a timed Provpass, the progress count ("Fråga 3 av 4", or the compact stig on phone), verdicts, or the one action.

Each screen below lists its calm-mode delta.

### 1.11 State patterns (named once, used everywhere)

| Pattern | Rule | Example copy |
|---|---|---|
| **Loading** | Skeletons in the final layout: the band and stops draw as `--sp-sunk` shapes, and text lines as rounded 12 px bars at the real measure. No spinners on a page. A spinner is allowed only inside a pressed button (it keeps the button's width). | — |
| **Empty, first time** | Never "Ingen data". Name what will appear, and offer the step that makes it appear, as the green pill when it is the screen's next step. | "Här samlas dina missar. Svara fel på en fråga så hamnar den här, och kommer tillbaka när det är dags." |
| **Partial data** | Show what is real, label what is still growing, and put the threshold in words. | "Kurvan visas efter två veckor med övning." |
| **Done** | The path's end: a filled goal stop, one sentence, the next step. No confetti, no loss framing. | "Klart för idag." |
| **Error** | A quiet card with what happened, that nothing was lost, and one retry. Network errors never discard answers. | "Det gick inte att hämta frågorna. Dina svar är sparade. Försök igen" |
| **Offline** | A quiet line under the head, never a modal. | "Du är offline. Det du gör sparas och skickas när du är tillbaka." |

### 1.12 Accessibility baseline (inherited by every screen)

- **Landmarks:** `nav aria-label="Huvudmeny"`, one `main`, `aria-current="page"` on the destination. One `h1` per page (the display title, or the reading card's title on a focus screen).
- **Focus:** 2 px `--sp-focus` outline with a 2 px offset everywhere. The focus order follows the visual order. Modal layers (menus, choice and filter sheets, dialogs, the figure viewer) trap focus and return it to their opener. The persistent reading surfaces (the tray, the phone question sheet and answer bar, Facit) never trap it, so the passage stays reachable (§1.8). ¶ numbers stay out of the tab order (J/K/F drive the same aid).
- **Targets:** ≥ 44 × 44 px. Small pills (¶ chips, "Fördjupning", strike) keep invisible ≥ 44 px hit areas, as built.
- **Never colour alone:** every state has a glyph and a word (✓ "rätt", ↻ "lagd i Repetera", ⚑ "markerad"), and every section has its code as text.
- **Contrast:** body text ≥ 7:1, UI ≥ 4.5:1 (AA), and non-text marks ≥ 3:1 (switch tracks, stop rings, chart lines).
- **Text spacing (WCAG 1.4.12):** every screen survives the overrides without clipping. Line clamps are used only on secondary previews, and the full text is always one press away.
- **Reflow:** 320 CSS px wide (phone at 200 % zoom) with no horizontal scroll, except inside a figure viewer or a table that scrolls on its own.
- **Live regions** (`polite`): the selection echo ("Ditt val: B"), a timer warning, "Sparat".
- **Language:** `lang="sv"` on the root. Every English block (an ELF passage, question, options, an ELF explanation, an English example inside a lesson) carries `lang="en"`.
- **Motion:** `prefers-reduced-motion` is honoured as built, and Lugnt läge goes further.
- **Keys:** shortcuts never fire inside text fields or with ⌘/Ctrl held (`useKeyMap`'s `isForeignKey`). Key hints are hidden on touch (`@media (hover: none)`).

### 1.13 ADHD-PI baseline (the primary user)

- **One obvious next step per screen**, as the one green pill. A destination page leads with it; it is never below the fold on phone at 390 × 844.
- **Visible progress** wherever there is a sequence (the stig): "where am I, how much is left" in one glance.
- **Time made visible:** every startable thing says roughly how long it takes ("ca 9 min"). The clock counts up in practice and down only in a Provpass.
- **Defaults instead of decisions:** starting is one press, as in today's app (a section, a mixed round or Repetera starts at once: ten questions, no setup screen). Where a real choice exists (a Provpass's half and pass), the suggestion comes preselected.
- **No loss framing, no streaks:** a missed day never shows as an empty slot, a miss is "lagd i Repetera", and "Hinner du inte allt flyttas resten till imorgon".
- **Interruptions are safe:** every exit says that answers are saved ("Dina svar är sparade"), and every unfinished thing appears as the first stop on Idag.
- **Nothing moves while reading.** Lugnt läge is one press away on every desktop focus screen. On phone it is set once and persists.
- **Short wins:** 4–10 minute units are offered first. Long sessions (a Provpass) state their length and rules before they start.

### 1.14 Critiques not to repeat (round-1 readers, `docs/worklog/hpf-qr0p.md`)

| Reader's critique | Rule in round 2 |
|---|---|
| "Top-tier Home, template-grade drill and feedback" (second reader) | Every new screen gets a stig, a Bricolage display moment and a squircle morph. No screen is just a list of white cards. |
| "Pastel chips and green pills pull it toward generic edtech" (blind reader) | One tinted band per viewport, section chips only in card heads (never one per row), and one green pill per screen. Rows carry the hue in a stop ring or an edge bar. |
| Spår and Lager "could be swapped" on phone: answer tiles, the account sheet, "rounded red/green answer boxes" in dark | Sheets attach to the bottom edge (never float). Options keep the letter-blob → tilted-squircle morph. Dark answer cards stay plain with a left bar and a coloured icon. The account sheet stays an edge-attached M3 list with switches (Lager's is now a detached panel with a segmented control). |
| The tray ate the passage; the phone peek clipped the question | The tray opens folded to the whole question. The phone peek shows the whole question, never clamped. |
| Count badges and alarm red | A dot, never a count, on navigation. Counts live in the page. |
| Labels repeated; key hints on touch | Each label appears once. Keys are hidden on touch. |
| A wrong answer shouted (Folio) | One red signal: the glyph and the "Ditt svar" card. Paths use amber ↻. |
| Headings lighter than their content (Folio) | Headings are always the heaviest text in their block. |
| Hard clipping under sticky bars (Folio) | Text passing under a sticky head or tray fades over 20 px instead of being cut. |

---

## 2. Screen map and navigation

Every screen sits in one of two frames:
- **Destination pages** (5, 8's queue, 9's hub, 10, 11, 12, 13) keep the rail or the navbar and the account entry.
- **Focus screens** (6, 7, 8's round, 9's running pass, the review opened from 10 and 11, 14, and round 1's 2–3) have the top bar with its always-visible exit.

```
            frame: rail (desktop) · navbar (phone) · account menu on every destination page
 ┌───────────────────────────────────────────────────────────────────────────────────────────┐
 │                                                                                           │
 │  Idag ──plan steps──┬──► Öva (5) ──┬─ section tile ─► Kvantfråga (6) · DTK (7) · ELF (14) │
 │   │                 │              │                  · LÄS (2) — focus screens            │
 │   │                 │              ├─ Blandad övning ─► a mixed round                       │
 │   │                 │              └─ Repetera ───────► Repetera (8): queue ─► round        │
 │   │                 │                                                                       │
 │   │                 ├──► Provpass (9): hub ─► rules ─► running pass ─► Provpassresultat (10)│
 │   │                 │                                                    └─► review         │
 │   │                 ├──► Uppslag (12): library ─► lesson ─► "Öva detta mönster" ─► drill ─┐ │
 │   │                 │                                            ▲                        │ │
 │   │                 │                                            └──── back to the entry ─┘ │
 │   │                 ├──► Framsteg (11): Översikt ─► "Nästa steg" ─► drill / lesson         │
 │   │                 │                   Historik  ─► pass page · result (10)               │
 │   │                 └──► account menu ─► Konto & inställningar (13)                         │
 │   │                                                                                         │
 │   └── every focus screen: "Avsluta" (answers saved) ─► where it came from;                  │
 │       its end ─► the plan's next step (green) · "Tillbaka till …" (quiet)                   │
 └───────────────────────────────────────────────────────────────────────────────────────────┘
```

| # | Screen | Batch | Route today | Reached from | Leaves to | The one green pill |
|---|---|---|---|---|---|---|
| 5 | Öva | B1 | `/ova` | rail / navbar; Idag's plan; a unit's end; Historik's empty state | `/drill?section=X&start=1`, `/drill?mixed=1&start=1`, `/repetition?start=1` (`&section=X`), the adaptive review | "Repetera 8 · ca 9 min"; else "Öva KVA · ca 6 min"; else "Blandad övning · ca 9 min" |
| 6 | Kvantfråga | B1 | `/drill?section=XYZ\|KVA\|NOG` | Öva; Idag; Repetera; an Uppslag entry; Framsteg; the adaptive review | Facit → next → the end; "Avsluta" → origin | "Svara", then "Nästa fråga" |
| 7 | DTK | B1 | `/drill?section=DTK` | as 6 | as 6 | as 6 |
| 8 | Repetera | B1 | `/repetition` (queue), `?start=1` (round), `?done=<id>` (end) | Öva's station; Idag's plan; a paused round; a unit's end; Framsteg | the round; the plan's next step; Öva | "Starta repetition · 8 frågor" |
| 9 | Provpass | B2 | `/prov` | rail / navbar; Idag's plan; the palette | the running pass; the result | "Starta provpasset" → "Starta nu"; running: "Nästa fråga" → "Granska och lämna in" |
| 10 | Provpassresultat | B2 | `/prov?result=<id>` | hand-in or timeout; the hub's last passes; Historik | the review; the hub; Uppslag | "Gå igenom missarna · 9" |
| 11 | Framsteg + Historik | B2 | `/progress`, `/historik`, `/historik?pass=<id>` (a past pass) | rail / navbar; Idag's "Alla pass", and the "Prognosen i Framsteg" link B2 adds to Idag | drills, lessons, Repetera, pass pages, results | Översikt: "Öva LÄS · ca 10 min" (the first "Nästa steg"); the Historik list has none |
| 12 | Uppslag & lektion | B3 | `/lektion`, `/lektion?section=X#ID` | rail / navbar; Idag's lesson step; Facit's framework link; the adaptive review; Framsteg | the pattern drill (and back), the section drill | "Fortsätt läsa"; in a lesson "Nästa" |
| 13 | Konto & inställningar | B3 | `/konto`, `/mer` | the account menu on every page; the palette | the frame; sign-in | none |
| 14 | ELF-läsfråga | B3 | `/drill?section=ELF` | Öva; Idag; Repetera; an Uppslag ELF entry | Facit → next → the end | "Svara", then "Nästa fråga" |

**IA fixes this spec makes, everywhere** (all from the real screens):
- No screen without navigation. The phone tab bar is restored on Provpass, the result, Historik, Konto and Mer, and works on Uppslag.
- No exit by browser back only. Every focus screen has "Avsluta", or "Avbryt" in a Provpass.
- A drill returns to where it started (Öva or Uppslag), not always to Home.
- Nothing in progress is resumed silently. A paused round or lesson, or a Provpass still running ("pågående"), is Idag's first stop and its own page's station.

---

## 3. Screens

### Screen 5 · Öva (B1)

**Purpose.** The practice hub behind the Öva destination: drill one of the eight sections, take a mixed round, or repeat the misses. Today's hub (`routes/ova.tsx`) has no single primary action. Spår gives it one.

**The one action** is the best next practice, as the screen's only green pill:
1. **Misses are ripe:** "Repetera 8 · ca 9 min ↵". Old misses lose value while they wait, and the app already orders them oldest first. The estimate matches Idag's plan step for the same round (9 min).
2. **Nothing ripe:** "Öva KVA · ca 6 min ↵" on the section the scheduler suggests (today's "svagast" tag, ranked from the 90-day section score).
3. **A new user** (no answers, no suggestion yet): "Blandad övning · ca 9 min ↵". It tastes all eight sections and gives the scheduler its first data. Its estimate is the mean of the eight section times; the live app has none for a mixed round.

**What it shows.**
- **Repetera.**
  - How many misses are **ripe now** ("redo"), and how many are in **today's pile** (ripe, or missed today and not yet answered right). These two numbers differ, and the hub already shows both.
  - The next ripe misses, in the order they will play: most overdue first, then most errors, at most ten. For each, only its section is shown.
  - Which sections have misses waiting, for the "Bara ett delprov" choice.
- **Eight sections**, grouped **Verbal del** (ORD, LÄS, MEK, ELF) and **Kvantitativ del** (XYZ, KVA, NOG, DTK). The split already exists in the scoring code; today's hub shows one flat row. For each section:
  - code and full name: Spår's `SECTION_NAMES`, the test's official names (Ordförståelse, Läsförståelse, Meningskomplettering, Engelsk läsförståelse, Matematisk problemlösning, Kvantitativa jämförelser, Kvantitativa resonemang, Diagram, tabeller och kartor). The live app says "Svensk läsförståelse"; Spår keeps the official "Läsförståelse" everywhere;
  - the round's size: always 10, except DTK, which takes whole figure pages and so lands at 10–13;
  - its rough length: ORD 3, LÄS 10, MEK 5, ELF 10, XYZ 8, KVA 6, NOG 12, DTK 15 min (`lib/sectionDurations.ts`);
  - how many of today's misses belong to it ("2 väntar");
  - whether it is the scheduler's suggestion.
- **Blandad övning:** "10 frågor blandat från alla åtta delprov."
- **Återkommande fälla** (only when the adaptive review would offer it: ≥ 3 misses on one framework in seven days, not treated, not declined twice). It shows the trap's name and section and offers "Riktad repetition · 5 min". Today this offer appears only on a drill's intro screen, which the hub skips, so hub-started drills never see it. Öva gives it a home.

**Layout — desktop (1440 × 900, rail folded).**
```
┌──────┬────────────────────────────────────────────────────────────────────────────────────────────┐
│  ≡   │  Öva                                                                                       │
│ [◆]  │  Alla delprov                                                                              │
│      │  Repetera dina missar först, eller välj ett delprov. Ett varv är tio frågor.               │
│ (⌁)  │                                                                                            │
│ Idag │  ╭─ ↻  REPETERA ───────────────────────────── 23 i dagens hög ─╮   Återkommande fälla       │
│(▣)•° │  │                                                                │  ┃ [LÄS] Författarens   │
│ Öva  │  │  8 missar är redo nu, de äldsta först                         │  ┃ hållning               │
│ (⌛)  │  │  ◯───◯───◯───◯───◯───◯───◯───◯───⚑                            │  ┃ Tre missar på samma   │
│ Prov │  │  ORD LÄS NOG LÄS XYZ ORD MEK DTK                              │  ┃ fälla senaste veckan. │
│ (💡) │  │                                                                │  ┃ Riktad repetition ·   │
│Uppsl.│  │  [ Repetera 8 · ca 9 min   ↵ ]           Bara ett delprov ⌄    │  ┃ 5 min  →              │
│ (⛰)  │  ╰────────────────────────────────────────────────────────────────╯                          │
│Fram. │                                                                                            │
│      │  Verbal del                                   Kvantitativ del                              │
│      │  ╭──────────────────────╮ ╭──────────────────────╮  ╭──────────────────────╮ ╭────────────────────╮
│      │  │ (ORD)  Ordförståelse │ │ (LÄS)  Läsförståelse │  │ (XYZ)  Matematisk    │ │ (KVA) Kvantitativa │
│      │  │ 10 frågor · ca 3 min │ │                      │  │        problemlösning│ │       jämförelser  │
│      │  │ 2 väntar             │ │ 10 frågor · ca 10 min│  │ 10 frågor · ca 8 min │ │ 10 frågor · 6 min  │
│      │  ╰──────────────────────╯ ╰──────────────────────╯  ╰──────────────────────╯ │ [Föreslås]         │
│      │  ╭──────────────────────╮ ╭──────────────────────╮  ╭──────────────────────╮ ╰────────────────────╯
│      │  │ (MEK) Meningskompl.  │ │ (ELF) Engelsk läs-   │  │ (NOG) Kvantitativa   │ ╭────────────────────╮
│      │  │ 10 frågor · ca 5 min │ │ 10 frågor · ca 10 min│  │ 10 frågor · ca 12 min│ │ (DTK) Diagram, ta- │
│      │  ╰──────────────────────╯ ╰──────────────────────╯  ╰──────────────────────╯ │ 10–13 frågor · 15 m│
│ (◉)  │  ↝  Blandad övning — 10 frågor från alla åtta delprov · ca 9 min           →  ╰────────────────────╯
└──────┴────────────────────────────────────────────────────────────────────────────────────────────┘
```
- The **Repetera station** is the screen's dominant card: Idag's `sp-now` shape, with a near-neutral REP band (no section colour, never green). Its path draws the ripe misses as stops ringed in their sections' hues, ending in a goal stop. It carries the one green pill.
- **"Bara ett delprov ⌄"** opens the card in place (container transform, §1.9). The card grows to list the sections that have misses ("LÄS · 2 redo", "ORD · 2 redo", …, matching the path's stops). Each is a quiet button that starts a repetition scoped to that section.
- The **side note** is `.sp-trap` with its 4 px section edge and a quiet link. It never has a green pill.
- **Section tiles** carry no tinted band. The section lives in a 44 px `section` stop (a ring in the section's hue around its code). The tile is `--sp-card` with `--sp-shadow-1`. On hover and focus the corners morph 20 → 28 px on the spring, as `.sp-step` does on Idag. The whole tile is one button that starts the round at once, as today: no intro, no settings.
- The suggestion carries an ink "Föreslås" chip (`.sp-next-chip`). When nothing is ripe, the suggested tile is the one with the green pill ("Öva KVA · ca 6 min ↵", inside the tile), and the Repetera card turns quiet.
- **Blandad övning** is a full-width quiet row with the trail glyph `↝`, never a ninth tile.

**Layout — phone (390 × 844).** The green pill is visible without scrolling.
```
┌──────────────────────────────────────┐
│ [◆] HP-Coach                     (◉) │  ← "HP-Coach" fades to "Öva" once
│ Öva                                  │     the title has scrolled away
│ Alla delprov                         │
│ Repetera först, eller välj ett       │
│ delprov.                             │
│ ╭─ ↻ REPETERA ──── 23 i dagens hög ─╮│
│ │ 8 missar är redo nu,             ││
│ │ de äldsta först                  ││
│ │ ◯─◯─◯─◯─◯─◯─◯─◯─⚑                ││
│ │ [[  Repetera 8 · ca 9 min    ]]  ││
│ │      Bara ett delprov ⌄          ││
│ ╰──────────────────────────────────╯│
│ Verbal del                           │
│ (ORD) Ordförståelse           3 min ›│
│       2 väntar                       │
│ (LÄS) Läsförståelse          10 min ›│
│ (MEK) Meningskomplettering    5 min ›│
│ (ELF) Engelsk läsförståelse  10 min ›│
│ Kvantitativ del                      │
│ (XYZ) Matematisk problemlösn. 8 min ›│
│ (KVA) Kvantitativa jämförelser       │
│       [Föreslås]              6 min ›│
│ …                                    │
├──────────────────────────────────────┤
│ (⌁)Idag (▣•°)Öva (⌛)Prov (💡) (⛰)   │
└──────────────────────────────────────┘
```
- The sections are **rows**, not tiles: a 36 px section stop, the name, the facts under it, and the minutes and chevron at the right. Each row is a 64 px button that starts at once.
- "Bara ett delprov ⌄" opens a bottom sheet listing the sections that have misses.
- The trap note follows the Kvantitativ group, so it never pushes the pill down.

**Components.**
- *Reused:* the frame (rail, navbar, app bar, account), `.sp-now` / `.sp-now-band` / `.sp-now-body` / `.sp-now-foot` for the station, `.sp-btn--primary --lg`, `.sp-next-chip`, `.sp-trap`, `.sp-link`, `.sp-h3` group heads, the hover morph of `.sp-step`, and `CalmSwitch`.
- *New:*
  - **`SparPageHead`** (§1.8).
  - **`SparStation`**: `.sp-now` generalised, with `data-sec` for its band (any section or REP), an optional path, and a foot with the green pill plus one quiet action. Used again on screens 9 and 12.
  - **`SparStop`** and **`SparPath`**, horizontal and vertical (§1.2).
  - **`SparSectionTile`** (desktop) and **`SparSectionRow`** (phone).
  - **`SparDisclosureCard`**, the in-place expansion of §1.9.

**States.**

| State | What Öva shows |
|---|---|
| Loading | Skeleton station (band, three text bars, a pill-shaped bar) and eight skeleton tiles. Counts appear only when known. Never "Kön är tom" while loading. |
| New user (0 answers) | The station says "Här samlas dina missar. Svara fel på en fråga så hamnar den här, och kommer tillbaka när det är dags." with no button. The green pill moves to "Blandad övning · ca 9 min". No "Föreslås" yet. |
| Pile not yet ripe | "Inget är redo just nu. 3 missar ligger i dagens hög och blir redo snart." The station has no button (truly absent, not a muted link). The green pill moves to the suggestion. |
| Queue cleared | "Kön är tom. Allt du missat är återlärt." with a filled goal stop. The green pill moves to the suggestion. |
| Ripe | As drawn. More than ten ripe: "Repetera 10 av 14" (ten per round), with the path showing ten stops. |
| Error | Real copy: "Gick inte att hämta just nu — försöker igen automatiskt." in the station. The section tiles stay usable. |
| Calm | No per-section "väntar" counts, no path stops in the station (the sentence stays), no nav dot. |

**Navigation.**
- In:
  - the rail or navbar "Öva";
  - Idag's plan steps of kind övning or repetition;
  - a unit's end ("Fortsätt med …");
  - Historik's empty state ("Till Öva").

  The rail keeps Öva highlighted on `/drill` and `/repetition`, as today.
- Out:
  - a tile → `/drill?section=KVA&start=1` (a paused round in that section resumes instead, as today);
  - Blandad → `/drill?mixed=1&start=1`;
  - the station → `/repetition?start=1`, or `…&section=LÄS` from "Bara ett delprov";
  - the trap → the targeted review, `/drill?section=LÄS&framework=LAS-TYPE-003&ar=1`. The section must be passed: the live route defaults to ORD and looks the framework up inside it, so a LÄS trap opened without `section` finds nothing. `back=` stays what it is today: the section to return to when the offer interrupted a drill.
- Back: a round started from Öva ends with "Tillbaka till Öva" as its quiet action, beside the plan's next step. Today the end goes to Home.

**ADHD-PI.**
- One press from the hub to the first question, with nothing to configure.
- The green pill always answers "what should I do now?". Every tile says how long it takes, before it starts.
- The two groups halve the choice: verbal or kvant first, then one of four.
- The trap offer never competes with the pill; it is a quiet link.

**Accessibility.**
- Each tile is a `button` named in full: "Kvantitativa jämförelser, 10 frågor, cirka 6 minuter, föreslås". The section code is in the name, never in colour alone.
- The station's path is a `role="img"` with a text alternative ("Nästa missar: ORD, LÄS, NOG, …"). The count sentence above it carries the meaning.
- The disclosure has `aria-expanded` and `aria-controls`. Focus moves to the list it opened and returns to the toggle on Esc.
- The groups are `section`s with `h2`s ("Verbal del", "Kvantitativ del").

**Unmistakably Spår.**
- The queue as a path of section-ringed stops ending in a goal, under a big Bricolage "Alla delprov".
- Section stops instead of chips, and tiles that round out on the spring.
- One green pill that moves to wherever the next step is.
- The near-neutral REP band: repetition is not a section.


### Screen 6 · Kvantfråga — XYZ, KVA and NOG (B1; it also sets the short-stem layout for ORD and MEK)

**Purpose.** A quant problem: work it out, choose, see why. These are authentic questions from past tests, so there is no ÖVNINGSTEXT badge.

**The one action:** "Svara ↵" once an option is chosen, then "Nästa fråga ↵" in Facit.

**What it shows.**
- **The problem.**
  - **The stem**, with math. Math is LaTeX between private markers, rendered inline by KaTeX (`MathText`): fractions, roots, powers, indices, units set upright. There is never display math, in questions or explanations.
  - **An optional figure** before the stem: inline SVG that follows the theme's ink. 117 XYZ, 80 KVA and 16 NOG items have one. Four XYZ figures are scanned images and use the DTK viewer.
  - **Where it comes from:** the sitting, e.g. "Hösten 2025". It is in the question's id; today it is shown nowhere.
- **Options by section.**

  | Section | Options | Shape |
  |---|---|---|
  | XYZ | A–D (all 648) | usually short numbers or expressions |
  | KVA | A–D, fixed | "I är större än II", "II är större än I", "I är lika med II", "informationen är otillräcklig". The stem splits into an optional condition, then "Kvantitet I:" and "Kvantitet II:" (about 5 % don't split and show as one line) |
  | NOG | A–E, fixed | "i (1) men ej i (2)", "i (2) men ej i (1)", "i (1) tillsammans med (2)", "i (1) och (2) var för sig", "ej genom de båda påståendena", under the line "Tillräcklig information för lösningen erhålls". The stem splits into the question and the statements (1) and (2) |
  | ORD | A–E | one headword |
  | MEK | A–D | a sentence with "_____" gaps; multi-gap options joined by " – " |

- **Progress:** "Fråga n av 10", with right and missed so far shown as stops. Plus the count-up clock.
- **A strategy hint before answering**, on request: the explanation's `pregrade_tactic` ("Taktik · …"). Today it is always shown, and it can visibly swap from a section default to the real hint when the explanation loads. In Spår it is folded (open question 12), and it opens only once the real hint is there.
- **Facit:** the shared order.
  - **The verdict and the two answer cards.** KVA cards carry their relation, e.g. "I > II · I är större än II". NOG cards carry their statement glyph.
  - **Then:**
    - why your pick tempted, and why it is wrong;
    - **"Att ta med dig"**: `pitfall` and `technique`, never shown in today's app;
    - "Lösningen" (`solution_path`);
    - "Steg för steg", with detail steps folded behind "Fördjupning", as built in round 1 (the live app shows every tier expanded);
    - the other options;
    - the framework as a real link into Uppslag;
    - "Hjälpte förklaringen?".

**Layout rule — the tray follows a short problem.** Quant stems are short, so the tray is **open from the start** (no "Visa alternativen" fold). It is **sticky**:
- with a short problem it sits directly under the problem card;
- when the problem (figure + stem + statements) is taller than the space above it, it docks to the bottom edge as on screen 2.

This is the reading screen's model, with the fold used only when it buys room (§1.8).

The wireframes use real questions from Hösten 2025: `host-2025-kvant1-XYZ-002` (a figure with aspect 1.89, options in degrees), `KVA-014` (a condition and two quantities) and `NOG-024` (two statements, answer C).

**Layout — desktop XYZ with a figure (1440 × 900).**
```
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│ ✕ Avsluta        [XYZ]  ✓━━✓━━↻━━④━━⑤━━⑥━━⑦━━⑧━━⑨━━⑩   Fråga 4 av 10      🍃 Lugnt ○  ⏱ 06:12  │
│                                                                                               │
│                 ╭─────────────────────────────────────────────────────────────╮               │
│                 │ Matematisk problemlösning                       Hösten 2025 │ ← XYZ band     │
│                 ├─────────────────────────────────────────────────────────────┤   h 290 tint   │
│                 │         ┌──────────────────────────────────────┐     (⤢)    │               │
│                 │         │  two parallel lines L₁, L₂ and the   │            │               │
│                 │         │  angle v (SVG, aspect 1.89, 280 px)  │            │               │
│                 │         └──────────────────────────────────────┘            │               │
│                 │  Linjerna L₁ och L₂ är parallella. Hur stor är vinkeln v?   │ ← stem 20 px,  │
│                 │                                                             │   math 1.06 em │
│                 ╰─────────────────────────────────────────────────────────────╯               │
│                 ╭─────────────────────────────────────────────────────────────╮               │
│                 │ ╭(A) 102° ──╮ ╭(B) 115° ──╮ ╭(C) 139° ──╮ ╭(D) 143° ──╮ Taktik ⌄ │ ← one row: │
│                 │ ⇧ + bokstav stryker       Välj ett alternativ     [ Svara ↵ ] │  all short  │
│                 ╰─────────────────────────────────────────────────────────────╯               │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```
- **The problem card (`SparProblemCard`)** is the reading card's sibling: the same column, 28 px top corners, a band in the section's tint (dark: the 4 px line), and the section's full name.
  - The band's right side names the sitting in ink-2 ("Hösten 2025"), which marks the question as authentic.
  - The body has 28 px padding, the figure first, then the stem: Figtree 20/1.5, weight 600, max 34 em, `text-wrap: pretty`.
- **The figure (`SparFigure`)** sits on the card, max 280 px tall and at most the column's width, keeping its aspect. Its "Förstora" button (⤢, 44 px) sits at its top-right. In dark, SVG figures follow the ink (they use `currentColor`). Scanned figures sit on a white mat and are never filtered.
- **Options:** XYZ's use **one row** when every option is short (≤ 14 characters rendered), otherwise a column. Fractions in options are rendered at 1.06 em, so they never crush the line.

**KVA (desktop).** The two quantities stand **side by side**, which supports comparing them. Today's app stacks them.
```
                 ╭─────────────────────────────────────────────────────────────╮
                 │ Kvantitativa jämförelser                        Hösten 2025 │ ← KVA band h 45
                 ├─────────────────────────────────────────────────────────────┤
                 │  f(x) = −x⁄2 + 5        g(x) = x⁄2 − 1                       │ ← the condition,
                 │  ╭───────────────────────────╮   ╭────────────────────────╮ │   18 px ink-2
                 │  │ (I)   Kvantitet I         │   │ (II)  Kvantitet II     │ │
                 │  │       f(−2)               │   │       g(14)            │ │ ← 24 px, centred
                 │  ╰───────────────────────────╯   ╰────────────────────────╯ │
                 ╰─────────────────────────────────────────────────────────────╯
                 ╭─────────────────────────────────────────────────────────────╮
                 │ ╭(A) I > II   I är större än II ─╮ ╭(B) II > I  II är större än I╮│
                 │ ╭(C) I = II   I är lika med II ──╮ ╭(D)  ?   informationen är   ─╮│
                 │                                                otillräcklig   │
                 │ Välj ett alternativ                                [ Svara ↵ ] │
                 ╰─────────────────────────────────────────────────────────────╯
```
- Each quantity is a `--sp-sunk` tile (20 px corners). It carries a 32 px stop with the Roman numeral in Bricolage (I, II), the label "Kvantitet I", and the quantity at 24 px.
- An unsplittable item shows its raw line in one tile spanning both.
- The four fixed options are a 2 × 2 grid. Each tile has the letter blob, a small relation glyph in tabular figures ("I > II", "II > I", "I = II", "?"), and the words.

**NOG (desktop).** The statements are two stops on a short path, and every option carries a **statement glyph** that shows which statements it uses.
```
                 │ Kvantitativa resonemang                         Hösten 2025 │ ← NOG band h 315
                 ├─────────────────────────────────────────────────────────────┤
                 │  Sarah och Therese tävlade mot varandra i 100 meter frisim. │
                 │  Vem av dem vann?                                           │
                 │  (1)─ Sarahs medelhastighet var 1,91 m/s.                    │
                 │   │                                                         │
                 │  (2)─ Thereses tid var 50,6 sekunder.                        │
                 ╰─────────────────────────────────────────────────────────────╯
                 ╭─────────────────────────────────────────────────────────────╮
                 │ Tillräcklig information för lösningen erhålls                │
                 │ (A)  ●○    i (1) men ej i (2)                                │
                 │ (B)  ○●    i (2) men ej i (1)                                │
                 │ (C)  ●━●   i (1) tillsammans med (2)                         │
                 │ (D)  ●┊●   i (1) och (2) var för sig                         │
                 │ (E)  ○ ○   ej genom de båda påståendena                      │
                 │ Välj ett alternativ                                [ Svara ↵ ] │
                 ╰─────────────────────────────────────────────────────────────╯
```
- **Statements** are `SparStop`s numbered 1 and 2 (ring in the NOG hue), joined by the path's 2 px line, with the text at 18 px.
- **Normalising the references.** 147 of 324 NOG items store "(1)" as math, which renders as "(₁ )". The view model must normalise this to "(1)" in both the statements and the fixed options.
- **The glyph (`SparNogGlyph`)** is two 10 px dots for statements 1 and 2:
  - filled = used;
  - joined by a bar = used together;
  - a dotted divider = each on its own;
  - both empty = neither.

  It is a reading aid only. The words stay, and the glyph is `aria-hidden`.

**ORD and MEK use the same card and tray.** They are not among screens 5–14, but they need a layout.
- **ORD** has a single headword as the stem. It is set alone on the card in Bricolage at 42 px, the reading card's title size. This replaces today's giant italic `h1` for short stems. The five options (A–E) form one row on desktop when they are all single words, and a column on phone.
- **MEK** sets its sentence at the stem size. Each "_____" becomes an empty gap slot: B1 draws a plain 4 em blank, and B3's `SparGap` replaces it. Multi-gap options keep their " – " joins, shown as a thin divider between the words for each gap.

**Layout — phone (390 × 844), XYZ.** The problem scrolls, the options follow it in the flow, and the answer bar is sticky at the bottom.
```
┌──────────────────────────────────────┐
│ ✕ Avsluta  [XYZ] ✓━✓━↻━④━…   ⏱ 06:12 │
│ ╭──────────────────────────────────╮ │
│ │ Matematisk problemlösning        │ │
│ │  ┌────────────────────────┐ (⤢)  │ │
│ │  │ L₁, L₂ and v (SVG,     │      │ │
│ │  │ full width, ≤ 220 px)  │      │ │
│ │  └────────────────────────┘      │ │
│ │ Linjerna L₁ och L₂ är parallella.│ │
│ │ Hur stor är vinkeln v?           │ │
│ ╰──────────────────────────────────╯ │
│ ╭ (A)  102° ──────────────────── ⊘ ╮ │
│ ╭ (B)  115° ──────────────────── ⊘ ╮ │
│ ╭ (C)  139° ──────────────────── ⊘ ╮ │
│ ╭ (D)  143° ──────────────────── ⊘ ╮ │
│ Taktik ⌄                             │
│──────────────────────────────────────│
│ Ditt val: C            [[  Svara  ]] │ ← sticky, 72 px, above the home bar
└──────────────────────────────────────┘
```
- **KVA on phone:** the quantities stack as two tiles, I above II, each with its numeral stop. The fixed options form one column of four 60 px tiles.
- **NOG on phone:** the statements are the same short path. The five options are a column, each with its glyph.
- **Facit** rises as round 1's phone sheet, open at half height, so the stem and figure stay visible above it.

**Feedback specifics for quant.**
- **"Visa uppgiften" chip.** In the sheet head, a chip (the quant counterpart of the ¶ chip) drops the sheet to half and scrolls the column to the figure and stem. Explanations often say "i figuren".
- **Math in explanations** uses the same inline KaTeX at the explanation's size. Steps stay a path of numbered stops; a step's equations sit in its text, never as a display block.
- **The framework line becomes a link:** "Läs om fällan i Uppslag →" (`/lektion?section=XYZ#XYZ-TRAP-016`). For the 502 LÄS explanations whose ids do not map to a section today, the link names the section's library instead.

**Components.**
- *Reused:* the focus frame, `Options` (blob → squircle, strike), `Tray` (open and sticky), `FeedbackSheet`, `Verdict`, `VerdictChip`, `FeedbackBody`, `Rich`, `Done`, `CalmSwitch`.
- *New (B1):*
  - **`SparProblemCard`**: band, sitting, figure slot, stem.
  - **`SparFigure`**: inline SVG or image, a reserved aspect box, the zoom button, and the viewer shared with screen 7.
  - **`SparKvaPair`** and **`SparKvaOption`**.
  - **`SparNogStatements`** and **`SparNogGlyph`**.
  - **`Options` row layout** (shared with screen 14).
  - **`SparTacticHint`**: a folded "Taktik ⌄" disclosure showing `pregrade_tactic` in one line. Hidden in Lugnt läge and in a Provpass.
  - **A `MathText` wrapper** that sets `--sp-math` and lining tabular figures.

**States.**

| State | What the screen shows |
|---|---|
| Loading | Skeleton card (band, a reserved figure box at the figure's aspect, two stem lines) and skeleton tiles. Never "Laddar …" alone on a blank page. |
| Figure failed | The figure box shows "Figuren gick inte att hämta. Försök igen" with the retry inside the box. The question stays answerable when the stem stands on its own. |
| Explanation still loading | The verdict and the two answer cards appear at once. The sections below show skeleton lines and "Hämtar förklaringen…". |
| No explanation | "Förklaring saknas ännu för den här frågan." with "Markera som saknad", as today. The verdict always shows; today a transport error can hide it. |
| Incomplete question | "Frågan saknar fullständig text." with "Hoppa över". It is not counted. |
| No questions to play | The live copy, on the card: "Inga exempelfrågor hittades för det här mönstret." (a pattern drill), "Inga svaga mönster i XYZ än — öva sektionen så hittar vi dem." (`weak=1`) or "Inga XYZ-frågor klara att öva på just nu." The green pill names a step that works ("Öva hela XYZ · ca 8 min", or "Tillbaka till mönstret"). |
| Done | Screen 2's end, with the section ("XYZ-övningen är klar", "7 av 10 rätt", three in Repetera), the day's path, and "Tillbaka till Öva" when it started there. |
| Calm | No section tint (chroma drops), no hint disclosure, no springs. The clock and the count stay. |

**Navigation.**
- In:
  - Öva's tile (`/drill?section=XYZ&start=1`);
  - Idag's plan;
  - Repetera (a quant miss);
  - an Uppslag entry's "Öva detta mönster" (`?framework=…`);
  - Framsteg's "Nästa steg";
  - the adaptive review (`?section=XYZ&framework=…&ar=1`, always with its section, as on screen 5).
- Out:
  - "Avsluta", always visible (today there is no exit control at all, only browser back). It says "Dina svar är sparade", which is true: answers are saved per question. Today's leave sheet wrongly says "sparas inte".
  - The end's actions.
- Keys:
  - A–D (KVA, XYZ, MEK) or A–E (NOG, ORD) choose, validated against the item's own options (today "e" on a four-option item submits a phantom E);
  - ⇧ + letter strikes;
  - ↵ answers and goes on;
  - T folds the tray;
  - Z opens the figure.

**ADHD-PI.**
- The problem and the options are one glance apart: the tray follows a short stem.
- KVA's side-by-side quantities and NOG's statement glyphs cut down working memory.
- The hint is there when asked for, never in the way.
- The verdict comes with one concrete thing to take away (pitfall or technique) before the full solution.

**Accessibility.**
- Math keeps `role="math"` with a spoken label: today's flattened text ("a/b", "√(x)"), improved to Swedish words where the wrapper can ("a genom b", "roten ur x").
- Figures need real alt text. Today it is "Figur" or nothing. Until the view model carries descriptions, the figure's name is "Figur till fråga 4", and the stem must stand in for it.
- **KVA** is a group with two labelled regions ("Kvantitet I", "Kvantitet II"). The options' accessible names are the words, never the glyph.
- **NOG**'s statements are an ordered list named "Påståenden".
- The sticky phone bar never covers focused content (`scroll-padding-bottom` = its height).

**Unmistakably Spår.**
- Section-tinted problem cards, with statements as stops on a little path.
- Quantities in Roman-numeral stops, side by side.
- The blob that becomes a tilted ink squircle when you choose.
- The edge sheet with "Att ta med dig" before the solution.


### Screen 7 · DTK — a diagram, table or map page (B1)

**Purpose.** Read numbers off a printed page of figures and answer the questions about it. Usually three questions share one page.

**The one action:** "Svara ↵", then "Nästa fråga ↵". Questions on the same page follow one another without the page moving.

**What it shows.**
- **The page:** the full printed page as an image, never a crop.
  - 218 pages serve the 648 questions. Most are A4 portrait (≈ 0.707), 59 are A4 landscape (≈ 1.40), and two are odd crops (≈ 1.61, ≈ 2.97).
  - Pages hold 3 questions (180 pages), 2 (19), 4 (17) or 1 (2).
- **A round:** whole pages, appended until there are at least ten questions, so 10–13 questions.
- **"Fråga 2 av 3 på den här sidan"**, and the round's count.
- **Image options:** eleven DTK questions have pie charts as their options ("Cirkeldiagram A" … "D"), each a small near-square image.
- **Facit** as everywhere. DTK explanations often refer to the figure ("i diagrammet" ~350 times, "i tabellen" ~370), so the page must stay visible during Facit. Today it is not shown again after grading.

The wireframes use the real question `host-2025-kvant1-DTK-030`: a two-sentence prompt about pensioners, with four numeric options.

**Layout — desktop (1440 × 900).** DTK is the one screen with a **wide column**: `--sp-col-wide` (1000 px) for the page, so printed 10 pt text reads at about 17 px without zooming (at 760 px it would be about 13 px). The tray and the sheet keep the reading width of 760 px and dock centred under the page, like a drawer under a map.
```
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│ ✕ Avsluta   [DTK]  ✓━✓━✓ ┊ ↻━⑤━⑥ ┊ ⑦━⑧━⑨ ┊ ⑩━⑪   Fråga 5 av 11          🍃 Lugnt ○   ⏱ 11:40 │
│                       sida 1   sida 2    sida 3    sida 4                                      │
│            ╭──────────────────────────────────────────────────────────────────────╮           │
│            │ Diagram, tabeller och kartor · sida 2 av 4        (Bredd│Hela sidan) ⤢ ↻│ ← DTK band │
│            ├──────────────────────────────────────────────────────────────────────┤  h 262     │
│            │ ┌──────────────────────────────────────────────────────────────────┐ │           │
│            │ │                                                                  │ │           │
│            │ │        the printed page, 1000 px wide on a white mat;            │ │           │
│            │ │        portrait pages scroll inside the column                   │ │           │
│            │ │                                                                  │ │           │
│            │ └──────────────────────────────────────────────────────────────────┘ │           │
│            ░░░░░░░░░░░░░░░░ the page fades over 20 px under the tray ░░░░░░░░░░░░░░░           │
│                   ╭──────────────────────────────────────────────────────╮                    │
│                   │ Fråga 2 av 3 på den här sidan                         │                    │
│                   │ Studera antalet pensionärer med halvt respektive en   │                    │
│                   │ fjärdedels uttag av tilläggspension. Hur många fler   │                    │
│                   │ var männen än kvinnorna sammanlagt i dessa två grupper?│                   │
│                   │ ╭(A) 169╮ ╭(B) 351╮ ╭(C) 501╮ ╭(D) 729╮               │                    │
│                   │ Välj ett alternativ                     [ Svara ↵ ]   │                    │
│                   ╰──────────────────────────────────────────────────────╯                    │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```
- **The top bar's stig is grouped by page:** a 12 px gap and a small "sida n" label under each group. The round's shape is visible: four pages, eleven questions.
- **The figure card (`SparPageCard`)** has a DTK band naming the page ("sida 2 av 4") and a tool group at its right:
  - a `SparSegmented` "Bredd · Hela sidan" (fit the width and scroll, or fit the whole page in view);
  - "⤢ Förstora" (Z);
  - "↻ Rotera" (R; for landscape content printed on a portrait page).
- **The page sits on a white mat in both themes.** It is a scan whose colours the explanations refer to ("de mörkblå staplarna"), so it is never inverted, tinted or filtered. In dark, the mat has a 1 px `--sp-line` edge and the card around it is the dark card.
- **Moving to the next question on the same page keeps everything still:** the scroll position, the zoom fit and the rotation. Only the tray changes. Today the page re-mounts and replays its fade for every question.
- **When the page changes**, the column resets to the page's top and the band's "sida 3 av 4" changes. A polite live region says "Ny sida".
- **The tray is open from the start** (DTK options are short) and docked: the page is always taller than the room.

**The figure viewer (`SparFigureViewer`, shared with screen 6).** "Förstora" opens a full-screen sheet over the drill: the page at fit, then zoom from 100 % to 600 %. It carries:
- a toolbar pill: "−", "NNN %", "+", "↻", "Hela sidan", "Stäng";
- pinch, ⌘ or Ctrl + wheel, and drag to pan;
- keys Esc, +/=, −, R.

The question stays reachable: a compact strip at the viewer's foot repeats the question and the four options, so the learner can answer while zoomed, without closing the viewer.

**Image options (11 questions).** The tray shows the four pie charts as **image tiles** in one row (desktop) or a 2 × 2 grid (phone). Each tile has:
- the image at 140 px (phone 120 px);
- the letter blob;
- the label "Cirkeldiagram A";
- a small ⤢ that opens that chart alone in the viewer.

Selection is the usual 2 px ink border, and the blob's squircle morph. The image never scales on selection, because nothing that is read moves.

**Layout — phone (390 × 844).**
```
┌──────────────────────────────────────┐
│ ✕ Avsluta  [DTK] ✓✓✓┊↻⑤⑥┊…   ⏱ 11:40 │
│ ╭──────────────────────────────────╮ │
│ │ Sida 2 av 4        ⤢ Förstora    │ │
│ │ ┌──────────────────────────────┐ │ │
│ │ │ the page, full width (358 px)│ │ │ ← portrait page at width; pinch
│ │ │ scrolls in the column         │ │ │   zooms in place, double-tap
│ │ └──────────────────────────────┘ │ │   opens the viewer
│ ╭──────────────────────────────────╮ │
│ │              ━━━                 │ │
│ │ Fråga 2 av 3 på den här sidan    │ │
│ │ Studera antalet pensionärer med  │ │
│ │ halvt respektive en fjärdedels   │ │
│ │ uttag av tilläggspension. Hur    │ │
│ │ många fler var männen än …       │ │ ← the peek shows the whole question;
│ │ [  Visa alternativen (4)    ⌃ ]  │ │   "…" here only saves wireframe space
│ ╰──────────────────────────────────╯ │
└──────────────────────────────────────┘
```
- On phone the page is too small to read at width (≈ 6–7 px text), so **"Förstora" is the main way to read**.
- The sheet peeks with the whole question. Opened, it shows the options and "Svara".
- In the viewer, the foot strip holds the question and options, so answering while zoomed is one flow.

**Feedback.**
- The sheet opens at **40 % on desktop** (DTK's own default; other sections open at 58 %), so the page stays visible above the explanation it is about. "Visa mer av facit" (T) raises it.
- On phone, Facit opens at half, and **"Visa figuren"** in the sheet head opens the viewer with the facit kept behind it.

**Components.**
- *Reused:* the focus frame, `Tray`, `Options`, `FeedbackSheet`, `FeedbackBody`, `Done`; from screen 6, `SparFigureViewer`'s base (`SparFigure`), `SparTacticHint` (the folded "Taktik ⌄" in the tray, as on every practice question) and its explanation states.
- *New (B1):*
  - **`SparSegmented`**, for the fit control. It is first needed here, so B1 builds it and B2 and B3 reuse it.
  - **`SparPageCard`**: band with tools, white mat, fit modes, rotation, a stable scroll per page.
  - **`SparFigureViewer`**: zoom, pan, rotate, the answer strip.
  - **Image-option tiles** (`Options` `data-layout="images"`).
  - **The page-grouped `Progress`**.

**States.**

| State | What the screen shows |
|---|---|
| Loading a page | The mat appears at the page's real aspect (known before load) as `--sp-sunk`, with "Hämtar sidan…" centred. No opacity tricks: today the page sits at 35 % until it loads. |
| Page failed | "Sidan gick inte att hämta. Försök igen" inside the mat. The options are disabled with the reason ("Frågan behöver sidan."). "Hoppa över sidan" moves to the next page without counting. Today the failure is silent. |
| Image option failed | Its tile shows the label "Cirkeldiagram B" and "Bilden saknas", and stays choosable. |
| Explanation loading, missing, incomplete question, no questions to play | As screen 6, with DTK's wording ("Inga DTK-frågor klara att öva på just nu."). |
| Partial round | Resuming mid-page restores the page, the fit and the scroll position. |
| Done | The end screen's stops are grouped by page, as in the top bar. |
| Calm | The band tint drops, and the page tools stay. Nothing else changes, because the page itself is never styled. |

**Navigation.**
- In: Öva's DTK tile (`/drill?section=DTK&start=1`); Idag's plan; Repetera (a DTK miss opens its page at that question); Uppslag's DTK tactics ("Öva denna taktik").
- Out: "Avsluta" (saved) and the end's actions.
- Keys: A–D, ⇧ + letter, ↵, T (tray or sheet), Z (viewer), R (rotate). The fit control has no key of its own: F stays paragraph focus everywhere it exists, and DTK has no paragraphs.

**ADHD-PI.**
- The page never jumps between its questions, so a learner who found the table once does not lose it.
- "Fråga 3 av 3 på den här sidan" shows that a natural break is near.
- The viewer keeps the question at hand, so zooming never means remembering four numbers across a screen change.

**Accessibility.**
- **The page image** is named "Sida 2 av 4, diagram och tabeller till fråga 4–6". DTK pages have no text alternative in the data (open question 4 covers data asks). The viewer is a `dialog` labelled "Förstorad sida".
- **The fit control** is a radio group, and zoom changes announce "200 procent".
- **Image options:** the accessible name is the label ("Cirkeldiagram A"). The image is `alt=""` inside a named button, so the label is not read twice.
- **Rotation** never traps focus, and Esc always closes the viewer first, then nothing else.

**Unmistakably Spår.**
- The printed page held on a white mat inside a DTK-banded card, with the round's path grouped by page.
- A tray docked under the page like a drawer under a map.
- The viewer that keeps the question at hand. The blob → squircle choice, even on pie-chart tiles.


### Screen 8 · Repetera (B1)

**Purpose.** Replay ripe misses, at most ten a round, oldest first. Each right answer moves a miss up the spacing schedule (1 → 2 → 4 → 8 → 16 → 30 days, then it retires). A wrong answer brings it back in about ten minutes.
- **The one action:** "Starta repetition ↵" on the queue page, then, inside the round, "Svara" / "Nästa fråga", exactly as in any drill.
- The screen has three faces: **the queue** (`/repetition` without `start`, reached from Idag's plan), **the round** (a drill whose questions come from many sections) and **the end**.

**What it shows.**
- **Queue.** How many are ripe now and how many are in today's pile; the scope if it was started from one section ("Bara LÄS"); and the next ripe misses in play order, each with its section.

  Optional, if the view model can give it (open question 3): how long ago each was missed, and how many times.
- **Round.**
  - Each question in its own section's layout: a LÄS or ELF miss reopens its passage at that question, a quant miss is screen 6, a DTK miss is screen 7.
  - The top bar shows the REP chip, the round's stops ringed in each question's section hue, and "Fråga n av N".
- **After each answer, the visible change in the schedule:**
  - right → "Flyttad fram · tillbaka om 4 dagar", or "Inlärd · lämnar kön" after the 30-day step;
  - wrong → "Tillbaka om en stund".

  Today the app shows none of this, and nothing marks a question as a repeat. The data exists in the spacing schedule; open question 3 asks for it in the view model.
- **End.** Right of total; which misses moved forward and which come back soon; today's pile now; the trap behind several misses when two or more share one ("Fällan bakom flera av dem: Rätt valens, fel objekt").

**Layout — desktop, the queue (a sub-page of Öva: the rail keeps Öva highlighted).**
```
┌──────┬──────────────────────────────────────────────────────────────────────────────────────────┐
│ rail │  ← Öva                                                                                   │
│      │  Repetition                                                                              │
│      │  Dina missar                                                                             │
│      │  Repetera 8 av 23, de äldsta först. Ungefär 9 minuter.                                   │
│      │                                                                                          │
│      │   ╭───╮                                                                                  │
│      │   │ORD│  Ordförståelse · missad i fredags                                        1       │
│      │   ╰─┬─╯                                                                                  │
│      │   ╭─┴─╮                                                                                  │
│      │   │LÄS│  Läsförståelse · Magasinet i Hökaryd, fråga 2                            2       │
│      │   ╰─┬─╯                                                                                  │
│      │     ┆   … six more stops, each ringed in its section's hue                               │
│      │   ╭─┴─╮                                                                                  │
│      │   │ ⚑ │  Klart. Det du svarar rätt på flyttas fram i schemat.                            │
│      │   ╰───╯                                                                                  │
│      │                                                                                          │
│      │  [ Starta repetition · 8 frågor   ↵ ]        Bara ett delprov ⌄                          │
└──────┴──────────────────────────────────────────────────────────────────────────────────────────┘
```
The queue is a **vertical stig**: Idag's path at 44 px stops, one stop per miss, ending in a goal. More than ten ripe: the first ten are drawn, then "+ 13 till väntar i kön" in ink-3 under the goal.

"Bara ett delprov ⌄" works as on Öva. On desktop it opens in place (container transform) into the sections that have ripe misses ("LÄS · 2 redo", "ORD · 2 redo", …), each a quiet button that rescopes the round. On phone it is a bottom sheet. Choosing one changes the queue, the eyebrow ("Repetition · bara LÄS") and the pill ("Starta repetition · 2 frågor").

**Layout — the round (focus frame).** As screen 2, 6, 7 or 14, depending on the question. Only the top bar and the verdict chip differ:
```
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│ ✕ Avsluta    [↻ REP] [NOG]  ✓━━↻━━③━━④━━⑤━━⑥━━⑦━━⑧   Fråga 3 av 8      🍃 Lugnt ○   ⏱ 02:10   │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
          … the question in its own section's layout (here NOG, screen 6) …
╭───────────────────────────────────────────────────────────────────────────────────────────────╮
│ [✓]  Rätt!   Svaret är C.                               (✓ Flyttad fram · tillbaka om 4 dagar) │
```
- The REP chip is near-neutral, and the current question's section chip sits beside it. The stops wear each question's section ring until answered. Then they show ✓ (`--sp-ok`) or ↻ (amber).
- A ↻ in Repetera means "tillbaka om en stund", never a loss.

**Layout — phone.**
```
┌──────────────────────────────────────┐
│ ← Öva                            (◉) │
│ Repetition                           │
│ Dina missar                          │
│ Repetera 8 av 23, de äldsta först.   │
│ Ungefär 9 minuter.                   │
│ (ORD) Ordförståelse                  │
│   ┆   missad i fredags               │
│ (LÄS) Läsförståelse                  │
│   ┆   Magasinet i Hökaryd · fr. 2    │
│ (NOG) Kvantitativa resonemang        │
│   ┆   …                              │
│ (⚑)  Klart.                          │
│      Bara ett delprov ⌄              │
│ [[ Starta repetition · 8 frågor  ]]  │ ← sticky above the navbar once
├──────────────────────────────────────┤   the path scrolls
│ (⌁)Idag (▣•)Öva (⌛) (💡) (⛰)        │
└──────────────────────────────────────┘
```
In the round, the phone uses the question's own phone layout. Its compact top bar reads "✕ · [REP] · stops · ⏱".

**The end of a round.** It reuses `Done`: the chip "✓ Repetition klar", the display line "6 av 8 satt", and the stops in a row. Then:
- one sentence per outcome: "6 flyttades fram i schemat. 2 kommer tillbaka om en stund.";
- "Kvar i dagens hög: 17" (23 minus the 6 now answered right; the 2 missed again stay in the pile);
- the trap line when one exists.

It ends with the day's mini path (if Repetition was a plan step, its stop pops to done) and the green pill for the plan's next step. The quiet "Tillbaka till Öva" sits beside it. When nothing is left: "Kön är tom. Allt du missat är återlärt." with a filled goal stop.

**Components.**
- *Reused:* the whole focus frame and every question layout (screens 2, 6, 7 and 14), `Done`, `.sp-mini`, `VerdictChip`, and `.sp-trap`.
- *New:*
  - **`SparPath` vertical with `section` stops** (from screen 5).
  - **`VerdictChip` schedule variant**: the right-answer chip names the new interval instead of "n av N klara".
  - **REP chip**: `.sp-sec-chip` with `data-sec="REP"` and the ↻ glyph.

**States.**

| State | Copy and look |
|---|---|
| Loading | Skeleton path (eight sunk stops and text bars). The button reads "Laddar…" with its width kept. Never "Inga missar" while loading (today's bug). |
| New user | "Här samlas dina missar. Svara fel på en fråga så hamnar den här, och kommer tillbaka när det är dags." The green pill becomes "Blandad övning · ca 9 min" (today's "Öva istället · ORD →" always says ORD). |
| Nothing ripe yet | "Inget är redo just nu. 3 missar blir redo om en stund." No start button: the green pill moves to the suggested section, as on Öva ("Öva KVA · ca 6 min"). |
| Queue cleared | "Kön är tom. Allt du missat är återlärt." with a filled goal stop. The green pill becomes "Till Öva". |
| Scoped | The eyebrow reads "Repetition · bara LÄS". The scope survives the round and the end (today it is dropped). |
| Paused round | "Fortsätt repetitionen · fråga 4 av 8". The resumed round keeps its scope. |
| Error | "Det gick inte att hämta dina missar. Försök igen". The retry is real (today the error looks like the empty state). |
| Calm | No section rings on the queue stops (codes stay as text), no interval chip; the sentence "Rätt. Den flyttas fram." stays. |

**Navigation.**
- In:
  - Öva's station ("Repetera 8", which starts at once, as today);
  - Idag's plan step (opens the queue page);
  - a paused round's resume on Idag;
  - a unit's end ("Fortsätt med Repetition");
  - Framsteg's repetition line ("Till Repetera").
- Out: "Avsluta" (answers saved), back to where it came from. The end offers the plan's next step (green) and "Tillbaka till Öva" (quiet). The queue page's back link is "← Öva".

**ADHD-PI.**
- The queue shows exactly what is coming and how long it takes, before it starts.
- Every right answer shows its reward in schedule terms ("tillbaka om 4 dagar"), a real increment, not points.
- A wrong answer is "tillbaka om en stund", which is true and never shames.
- Rounds are capped at ten.

**Accessibility.**
- The queue is an ordered list (`ol`, labelled "Missar i den ordning de kommer"). Each stop is a list item with its section's name in words.
- The interval chip is part of the verdict's live region ("Rätt. Flyttad fram, tillbaka om 4 dagar.").
- A section scope is announced in the page's `h1` region ("Dina missar, bara Läsförståelse").

**Unmistakably Spår.**
- The misses as a vertical stig of section-ringed stops that ends in a flag.
- The repeat glyph ↻ in amber instead of red.
- The verdict chip that names the schedule step.
- The neutral REP chip next to the real section's chip.


### Screen 9 · Provpass — the hub and a running pass (B2)

**Purpose.** A whole half of the test under real conditions: Verbal or Kvant, 40 questions, 55 minutes, a hard countdown, and no facit until you hand in.
- **The hub's one action:** "Starta provpasset ↵" on the suggested pass. It opens the rules first, then "Starta nu ↵" starts the clock.
- **The running pass's one action:** answer and move on ("Nästa fråga ↵"). At the last question it becomes "Granska och lämna in ↵".

**What it shows.**
- **The pass.**
  - Its half (Verbal or Kvantitativ).
  - Its legs, which are fixed:
    - Verbal: ORD 1–10, LÄS 11–20, MEK 21–30, ELF 31–40;
    - Kvant: XYZ 1–12, KVA 13–22, NOG 23–28, DTK 29–40.
  - Its length (40 questions; an authentic pass can have fewer parsed questions and is then scored of those, e.g. "39 frågor").
  - 55 minutes.
  - LÄS and ELF legs drawn from P5 practice texts carry the ÖVNINGSTEXT badge in the pass, as in practice (open question 15).
- **Two kinds of pass.**
  - **Riktigt pass:** one real printed pass in its printed order, scored "normerat (härlett)" against that sitting's UHR table. Shown with the sitting's name ("Hösten 2025"), the pass number ("Provpass 2"), and exposure ("Du har sett 3 av 40 frågor tidigare"; exposure counts only the last ~120 days).
  - **Genererat pass:** a quota-matched set of least-seen questions, "Indikativt resultat — inte ett riktigt pass."
- **The register:** every sitting for the half, newest first, each with its two passes and how much of each you have seen. The least-seen pass is the suggestion ("minst sett").
- **The rules**, verbatim: "ingen paus" · "du kan ändra svar tills tiden går ut" · "avbryter du blir provet ogiltigt" · "lämna ingen fråga obesvarad — fel ger inga avdrag".
- **New on the hub:**
  - your last passes, each opening its result (today an old result is reachable only by its URL);
  - a pass in progress, if there is one ("Pågående provpass · 37 minuter kvar").
- **Running.**
  - The countdown (mm:ss).
  - "Fråga n av 40" and the current question's section.
  - Which questions are answered.
  - Which you have marked for review (**new**, see open question 5).
  - The question itself, in its section's layout, **without** any hint, verdict or explanation.

**Layout — desktop hub (1440 × 900).**
```
┌──────┬────────────────────────────────────────────────────────────────────────────────────────────┐
│ rail │  Provpass                                                                                  │
│      │  Hela sträckan                                    ( Verbal │ Kvantitativ )   segmented      │
│      │  40 frågor på 55 minuter, som på provdagen.       ( Riktigt pass │ Genererat pass )         │
│      │  Inget facit förrän du lämnar in.                                                          │
│      │                                                                                            │
│      │  ╭────────────────────────────────────────────────────────────────╮   Dina senaste pass   │
│      │  │ Föreslås · minst sett                                         │   ╭────────╮╭────────╮  │
│      │  │ Hösten 2025 · Provpass 2                                      │   │ Verbal ││ Kvant  │  │
│      │  │ Verbal · 40 frågor · 55 minuter                               │   │ 31/40  ││ 27/40  │  │
│      │  │ ▕█████████▕█████████▕█████████▕█████████▕  ← the route ribbon │   │ ≈ 1,25 ││ ≈ 1,05 │  │
│      │  │  ORD 1–10  LÄS 11–20 MEK 21–30 ELF 31–40                      │   │ 7 okt  ││ 30 sep │  │
│      │  │ Du har sett 3 av 40 frågor tidigare.                          │   ╰────────╯╰────────╯  │
│      │  │ [ Starta provpasset   ↵ ]                                     │                         │
│      │  ╰────────────────────────────────────────────────────────────────╯                         │
│      │                                                                                            │
│      │  Alla provtillfällen · Verbal                                         27 provtillfällen    │
│      │  Hösten 2025     Provpass 1 (◔ 12/40)    Provpass 2 (○ 3/40) [Föreslås]                    │
│      │  Våren 2025      Provpass 1 (◑ 22/40)    Provpass 2 (◔ 9/40)                               │
│      │  Hösten 2024     Provpass 1 (◔ 6/40)     Provpass 2 (◔ 11/40)                              │
│      │  …                                                                                         │
└──────┴────────────────────────────────────────────────────────────────────────────────────────────┘
```
- **The station** is the suggested pass. Its band is not one section's tint but the **route ribbon** (`SparRouteRibbon`): a 10 px rounded bar split into the pass's legs, each in its section's strong hue, proportional to its questions, and labelled under it with code and range in words. A pass spans four sections, so the ribbon is the one place where four hues sit together, always as a thin bar with labels, never behind text.
- **The register** is a list of sittings. Each pass is a **pass stop**: a 36 px ring that fills like Idag's `NodeRing` with the share you have seen, plus "12/40" in words. Choosing a pass stop makes it the station's pass (it does not start anything), so there is still one green pill.
- **"Starta provpasset"** opens the station in place (container transform, §1.9) into the rules card. It holds today's four rules word for word, set as sentences with a glyph each:
  ```
  ╭────────────────────────────────────────────────────────────────╮
  │ Innan du startar · Hösten 2025 · Provpass 2                    │
  │ ⌛  Ingen paus.                                                 │
  │ ↺  Du kan ändra svar tills tiden går ut.                       │
  │ ✕  Avbryter du blir provet ogiltigt.                           │
  │ ✓  Lämna ingen fråga obesvarad — fel ger inga avdrag.          │
  │ [ Starta nu   ↵ ]     Inte nu                                  │
  ╰────────────────────────────────────────────────────────────────╯
  ```
  - **Desktop:** the card opens in place (`SparDisclosureCard`). Focus moves to its heading, and Esc means "Inte nu". It is not modal: nothing else on the hub can start a pass.
  - **Phone:** the same card is a `SparDialog` bottom sheet with a focus trap.
  - **Either way**, "Starta nu" shows a busy state until the session exists.
  - **Coming from Idag's plan**, the hub opens with this card already open: one confirmation, not two.

**Layout — desktop, running pass (focus frame in exam mode).**
```
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│ ✕ Avbryt     Verbal · [LÄS]   ▕███████▕████░░░░▕░░░░░░░░▕░░░░░░░░▕   Fråga 14 av 40     ⏱ 37:12 │
│                                ORD     LÄS ↑    MEK      ELF        ☰ Översikt   Lämna in     │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
         … the question in its section's layout (screen 2 / 6 / 7 / 14), without facit …
                ╭──────────────────────────────────────────────────────────────╮
                │ Vilket av följande stämmer enligt texten?        ⚑ Markera   │
                │  (A) …   (B) …   (C) …   (D) …                               │
                │ Ditt val: C                  ‹ Föregående   [ Nästa fråga ↵ ]│
                ╰──────────────────────────────────────────────────────────────╯
```
- The top bar's path is the **route ribbon with a position**: the legs fill (neutral ink, never green) as questions are answered, and a 3 px ink tick marks where you are.
- The clock is the largest thing in the bar: a 44 px pill with tabular numbers. At 10:00 and 5:00 left it turns **inverse ink**, not red or amber, because amber means "repeat" in Spår. A polite live region says "10 minuter kvar" or "5 minuter kvar".
- At 5:00 a one-line note appears under the bar: "5 minuter kvar. 3 frågor är obesvarade — fel ger inga avdrag." Its "Visa dem" link opens the overview filtered to the blanks.
- "Avbryt" replaces "Avsluta", because leaving voids the pass. It opens a dialog:
  - "Avbryta provpasset?"
  - "Passet blir ogiltigt och räknas inte. Det du svarat fel på hittills läggs i Repetera."
  - [Fortsätt provpasset] (the default focus) · Avbryt passet.
- **No** calm switch: a running pass is always in Lugnt läge, with quarter chroma everywhere (the question card's band and the chip included) and no springs.
- **No** Fokus aid beyond paragraph focus, **no** Taktik hint (today's bug), and no verdict.

**The overview (`SparSwitchback`).** "☰ Översikt" opens a panel under the top bar (desktop) or a bottom sheet (phone). It draws the 40 questions as a **switchback**: four rows of ten stops that turn back at each end like a trail climbing a slope, each row starting with its section's code.
```
  ORD  ①─②─③─④─⑤─⑥─⑦─⑧─⑨─⑩─╮
                               │
  LÄS  ╭─⑳─⑲─⑱─⑰─⑯─⑮─⑭─⑬─⑫─⑪╯      ● besvarad   ◉ här   ⚑ markerad   ③ obesvarad
       │
  MEK  ╰─㉑─㉒─㉓─ … ─㉚─╮
                         │
  ELF  ╭─㊵─ … ─㉛───────╯
```
- **In a pass, "answered" is solid ink, never green**, because no answer has been graded. "Here" is the `now` ring, "marked" is ⚑, and an unanswered question is the plain numbered `todo` stop, spoken "obesvarad".
- Every stop is a button that jumps to its question.
- A filter row offers "Alla · Obesvarade (3) · Markerade (2)".
- In Kvant the rows are still ten long. Leg labels sit where each leg starts (XYZ 1, KVA 13, NOG 23, DTK 29), so the section codes in the labels are real (today's grid shows "SVE", "MEN", "MAT" and labels NOG "KVA").

**Handing in.** "Lämna in" (always in the bar), or "Granska och lämna in" on the last question, opens a dialog:
- the switchback in its compact size;
- "Lämna in provpasset?" plus "3 frågor är obesvarade." (or "1 fråga är obesvarad.", or "Alla 40 är besvarade.");
- [Lämna in ↵] (green) · "Fortsätt svara".
- At 0:00 the pass hands itself in. The result opens with the line "Tiden tog slut, så passet lämnades in automatiskt."

**Layout — phone, hub.** The same blocks stacked. The green pill in the station is visible at 390 × 844 without scrolling.
```
┌──────────────────────────────────────┐
│ [◆] HP-Coach                     (◉) │
│ Provpass                             │
│ Hela sträckan                        │
│ 40 frågor på 55 minuter, som på      │
│ provdagen. Inget facit förrän du     │
│ lämnar in.                           │
│ ( Verbal │ Kvantitativ )             │
│ ( Riktigt pass │ Genererat pass )    │
│ ╭──────────────────────────────────╮ │
│ │ Föreslås · minst sett            │ │
│ │ Hösten 2025 · Provpass 2         │ │
│ │ Verbal · 40 frågor · 55 minuter  │ │
│ │ ▕████▕████▕████▕████▕            │ │
│ │  ORD  LÄS  MEK  ELF              │ │
│ │ Du har sett 3 av 40 tidigare.    │ │
│ │ [[  Starta provpasset       ]]   │ │
│ ╰──────────────────────────────────╯ │
│ Alla provtillfällen                  │
│ Hösten 2025   (◔) 1   (○) 2 Föreslås │
│ Våren 2025    (◑) 1   (◔) 2          │
│ Dina senaste pass  [31/40] [27/40] › │
├──────────────────────────────────────┤
│ (⌁)Idag (▣)Öva (⌛•)Prov (💡) (⛰)    │
└──────────────────────────────────────┘
```
On phone the rules card opens as a `SparDialog` bottom sheet. The register's pass stops are 44 px targets, and "Dina senaste pass" is a horizontal row of tiles.

**Layout — phone, running.**
```
┌──────────────────────────────────────┐
│ ✕ Avbryt   Fråga 14 av 40   ⏱ 37:12 │
│ ▕███████▕███░░░▕░░░░░░▕░░░░░░▕       │ ← ribbon with the tick
│  ORD     LÄS↑   MEK    ELF           │
│ ╭──────────────────────────────────╮ │
│ │ [LÄS] (ÖVNINGSTEXT)              │ │
│ │ … passage …                      │ │
│ ╭──────────────────────────────────╮ │
│ │              ━━━                 │ │
│ │ Vilket av följande stämmer …     │ │
│ │ [ Visa alternativen (4)    ⌃ ]   │ │
│ │ ⚑ Markera  ☰ Översikt  Lämna in  │ │
│ ╰──────────────────────────────────╯ │
└──────────────────────────────────────┘
```
- The top bar never hides during a pass: the clock and the exit must stay in view.
- "Lämna in" is always one press away on phone too: in the sheet's tool row (beside "Markera" and "Översikt") and in the overview's foot.
- "Nästa fråga" and "‹ Föregående" sit in the sheet's foot once it is open. Swipe never moves between questions, so an accidental gesture cannot cost an answer.

**Components.**
- *Reused:* the frame, `SparPageHead`, `SparStation`, `SparDisclosureCard` and `SparSegmented` (all B1), `.sp-tiles` (last passes), the focus frame (`TopBar` re-slotted), every question layout in **exam mode** (no grading, no hint), `Options`, the phone sheet, `.sp-btn`.
- *New:*
  - **`SparRouteRibbon`** (with an optional position tick and fill);
  - **`SparPassStop`** (a seen-share ring);
  - **`SparSwitchback`** (40 stops, filterable, compact size);
  - **`SparClock`** (count-down, inverse at thresholds, live announcements);
  - **`SparDialog`** (centred on desktop, bottom sheet on phone, 28 px corners, focus trap; used for abort and hand-in, and on phone also for the start);
  - exam mode on the question layouts (`data-exam="true"`: hides Taktik, verdicts and facit; letter keys limited to the item's options);
  - the marking flag (⚑ on the tray, optional per open question 5).

**States.**

| State | What Provpass shows |
|---|---|
| Loading (hub) | Skeleton station and register rows. Never "Inga riktiga pass tillgängliga" until loading is done (today's false empty). |
| No authentic passes for the half | "Inga riktiga pass för verbal just nu. Prova ett genererat pass istället." with the Genererat segment as the quiet action. |
| Never taken a pass | Station eyebrow "Ditt första provpass", lede "Ett första pass ger en baslinje att jämföra med." |
| In progress | The station turns into the resume: "Pågående provpass · Hösten 2025 · Provpass 2 · 37 minuter kvar" with the green pill "Fortsätt provpasset". Idag shows the same as its first stop. A pass is never resumed silently. |
| Voided | A quiet notice above the station: "Provpasset avbröts och räknas inte. Det du svarat fel på ligger i Repetera." |
| Went stale while away (over 55 min) | The same notice, ending "…tiden gick ut medan du var borta." |
| Start or hand-in fails | Inside the dialog: "Det gick inte att starta passet. Försök igen" / "Inlämningen gick inte fram. Dina svar är sparade. Försök igen". The runner never freezes. |
| Offline while running | A line under the bar: "Du är offline. Svaren sparas och skickas när du är tillbaka." The clock keeps running, because the server's start time rules. |
| Calm | Enforced in a running pass. On the hub, the ribbon's hues drop to calm chroma and the pass stops lose their fills (the numbers stay). |

**Navigation.**
- In:
  - the rail or navbar "Provpass";
  - Idag's plan step "Provpass" (opens with the rules card open);
  - the command palette ("Starta provpass").
- During the pass:
  - the frame's navigation is gone: no rail spine, no tab bar;
  - the only exits are "Avbryt" (voids) and "Lämna in";
  - browser back opens the same "Avbryta provpasset?" dialog.
- Out: handing in → the result (screen 10, `/prov?result=…`); voiding → the hub with its notice.

**ADHD-PI.**
- The rules are four lines, shown once before the clock starts, never mid-pass.
- Time is visible but calm: inverse ink at thresholds, with no red flashing and no ticking sound.
- The 5-minute note turns time pressure into one concrete action: answer the blanks.
- The switchback shows how far you are along, and marking lets you park a question without losing it.
- A pass in progress is impossible to forget: it is the first stop on Idag and the station here.

**Accessibility.**
- The clock is `role="timer"` with `aria-live="off"`. Separate polite announcements fire at 10 and 5 minutes, and at hand-in.
- The switchback is a list of buttons named "Fråga 14, Läsförståelse, besvarad, markerad". The current one has `aria-current="step"`.
- Answered state is never colour-only: a solid disc plus the word in the name.
- The dialogs are `role="dialog"` with a label, a focus trap and Esc.
- The ribbon is `role="img"` with "Verbal: ORD fråga 1–10, LÄS 11–20, MEK 21–30, ELF 31–40". The position tick adds "du är på fråga 14".
- Letter keys accept only the item's options (A–D or A–E).

**Unmistakably Spår.**
- The pass as a route of four coloured legs, the switchback overview that turns like a mountain trail, and pass stops that fill as rings.
- The rules card that grows out of the station.
- Bricolage at display size for "Hela sträckan", and a clock that goes inverse instead of red.


### Screen 10 · Provpassresultat (B2)

**Purpose.** The end of the stretch: how the pass went, what it means on the 0–2,0 scale, where time went, and the misses to learn from. Today's result screen has **no action at all** (on phone it is a dead end). Spår gives it one.

**The one action:** "Gå igenom missarna · 9 ↵". It opens the first missed question in review (below), its Facit beside its own text, problem or page, with "Nästa miss" through all of them. A miss here is a wrong answer or a blank: 7 + 2 in the example. The wrong answers are already in Repetera, and the screen says so ("Dina 7 fel ligger redan i Repetera.").

**What it shows.**
- **Which pass:** the half; riktigt or genererat; the sitting and pass number ("Hösten 2025 · Provpass 2"); and when it was taken ("idag 14:10" right after handing in; "onsdag 14:10" when reopened later, as in the wireframes). The sitting and the date are not shown today.
- **Raw score:** "31 av 40 rätt", or of the number presented when a pass is short ("1 fråga saknas ur detta pass — rättat av 39.").
- **Score on 0–2,0:**
  - **Riktigt pass:** "normerat (härlett)", with the disclaimer verbatim: "Härlett ur UHR:s normeringstabell för detta provtillfälle. UHR normerar hela delprovet (80 frågor) — ett provpass på 40 frågor har ingen officiell tabell, så poängen skalas upp och läses av tabellen."
  - **Genererat pass:** "skattad poäng", with "Linjär skattning — indikativ, inte UHR-normerad."
  - When the pass contains P5 practice texts (LÄS or ELF), add the approved caveat verbatim: "Uppskattningen för LÄS och ELF bygger på HP-Coachs övningstexter, vars svårighetsgrad ännu inte är kalibrerad mot riktiga HP-resultat."
- **Per section, in exam order** (today alphabetical): right of presented, the time spent against the section's budget (55 min × its share: 13:45 for ten questions, 16:30 for XYZ and DTK, 8:15 for NOG), and "över budget" when over.
- **Every question:** right, missed or blank, in order. Each opens in review (below). The data for this is open question 4: today's result keeps only question ids.
- **The trap behind several misses** (today kvant-only; any section in Spår when the data has it): "3 av dina missar föll i samma fälla: …".
- **Exposure:** "Du hade sett 3 av 40 frågor innan. 2 lämnades obesvarade."
- **Earlier passes of the same kind**, each with the **same** score treatment as the headline (today's history is linear while the headline is normed).

**Layout — desktop (1440 × 900; the frame is back, Provpass highlighted).**
```
┌──────┬─────────────────────────────────────────────────────────────────────────────────────────────┐
│ rail │  Provpass · Hösten 2025 · Provpass 2 · Verbal · onsdag 14:10                                │
│      │  31 av 40 rätt                                              ╭ Normerat (härlett) ─────────╮ │
│      │  Starkast på ORD, mest tid på LÄS.                          │ ≈ 1,25  av 2,0               │ │
│      │                                                             │ 0 ─────────|──────── 2,0     │ │
│      │  [ Gå igenom missarna · 9   ↵ ]   Till Provpass             │ Härlett ur UHR:s … (verbatim)│ │
│      │  Dina 7 fel ligger redan i Repetera.                        │ Uppskattningen för LÄS och … │ │
│      │                                                             ╰──────────────────────────────╯ │
│      │  Sträckan                                                                                    │
│      │  ORD  ✓─✓─✓─↻─✓─✓─✓─✓─✓─✓─╮     9 av 10 · 7:40 av 13:45                                     │
│      │                             │                                                                │
│      │  LÄS  ╭─↻─✓─✓─○─✓─↻─✓─✓─✓─↻╯     6 av 10 · 16:02 av 13:45 · över budget                      │
│      │       │                                                                                      │
│      │  MEK  ╰─✓─✓─↻─✓─✓─✓─✓─✓─✓─✓─╮   9 av 10 · 11:20 av 13:45                                     │
│      │                               │                                                              │
│      │  ELF  ╭─✓─↻─✓─✓─↻─✓─✓─○─✓─✓─╯   7 av 10 · 17:58 av 13:45 · över budget                      │
│      │                                                                                              │
│      │  ✓ rätt   ↻ fel, lagd i Repetera   ○ obesvarad · Välj en fråga för att se dess facit.         │
│      │                                                                                              │
│      │  ╭ Återkommande fälla ───────────╮   Exponering                    Tidigare verbala pass      │
│      │  ┃ [LÄS] Författarens hållning   │   Du hade sett 3 av 40 frågor   23 sep  27/40 · ≈ 1,05    │
│      │  ┃ 3 av dina missar föll i samma │   innan. 2 lämnades obesvarade. 9 sep   24/40 · ≈ 0,90    │
│      │  ┃ fälla.  Läs i Uppslag →       │                                                          │
└──────┴──────────────────────────────────────────────────────────────────────────────────────────────┘
```
- **The headline** is the raw count in Bricolage (`.sp-display`), because it is the one number that needs no caveat. The normed score sits in a side card with Idag's `sp-scale` bar (a 0–2,0 track with the mark; no uncertainty range, because the table gives none), the "härlett" disclaimer and, when it applies, the P5 caveat.
- **The one-line read under the headline** comes from the data: the strongest section, plus the section where the most time went. Words, not a chart.
- **The switchback** (from screen 9) now carries verdicts:
  - ✓ `--sp-ok`;
  - ↻ amber, "lagd i Repetera";
  - ○ dashed, "obesvarad".

  Each leg's line ends in its numbers and tempo in words. "Över budget" is a word in ink-2, never red.
- **Choosing a stop opens that question in review** (`SparReview`, below): its Facit beside its own text, problem or page, with "‹ Föregående miss · Nästa miss ›" in its foot. The green pill does the same, starting at the first miss.

**Layout — phone.**
```
┌──────────────────────────────────────┐
│ [◆] HP-Coach                     (◉) │
│ Provpass · Verbal · onsdag 14:10     │
│ 31 av 40 rätt                        │
│ Normerat (härlett) ≈ 1,25 av 2,0     │
│ 0 ───────────|────── 2,0             │
│ Härlett ur UHR:s normeringstabell …  │ ← folded after two lines: "Läs mer"
│ Uppskattningen för LÄS och ELF …     │ ← the P5 caveat, never folded away
│ [[ Gå igenom missarna · 9       ]]   │
│ Dina 7 fel ligger i Repetera.        │
│ Sträckan                             │
│ ORD  9 av 10 · 7:40          ›       │ ← each leg is a row that opens its
│ LÄS  6 av 10 · 16:02 · över  ›       │   ten stops in a bottom sheet
│ MEK  9 av 10 · 11:20         ›       │
│ ELF  7 av 10 · 17:58 · över  ›       │
│ Återkommande fälla …                 │
│ Tidigare pass …                      │
├──────────────────────────────────────┤
│ (⌁)Idag (▣)Öva (⌛•)Prov (💡) (⛰)    │
└──────────────────────────────────────┘
```
The navbar is back, fixing today's tab-less dead end. A leg row opens a sheet with that leg's ten stops; a stop opens that question in review.

**Review (`SparReview`): the question again, with what its Facit refers to.** Facit cannot be lifted out on its own. `FeedbackBody` renders the prompt and the explanation only (`SparDrill.tsx:820`), and a ¶ chip only scrolls a paragraph that a mounted reading column has registered (`r1Kit.ts:630`). Over the result page, or inside Historik, no passage, problem or figure is mounted, so its citations would point at nothing. The review is therefore the question's own screen in its graded state, read-only. B2 builds it once; this screen and screen 11's pass page open it.
- **The frame.** A focus screen (§1.8), entered from a destination page. Its always-visible exit is "✕ Stäng", which returns to where the review was opened and puts focus back on the stop or green pill that opened it. The top bar holds the section chip, the stig of what is being reviewed with its count, and its tools: the calm switch (desktop only) and Fokus on a text. There is no clock, no "Svara", no strike and no "Taktik".
  - From the result, the stig is the misses as ↻ and ○ stops: "Miss 3 av 9". A right answer opened from its stop reads "Fråga 12 av 40", and the foot still steps between the misses.
  - From a pass page in Historik, it is every question of the pass with its verdict: "Fråga 3 av 6".
- **The question's context, read-only.** The layout of screen 2, 6, 7 or 14 as it is after "Svara":
  - **LÄS and ELF:** the whole reading card (band, ÖVNINGSTEXT and "Om texten", title, ¶-numbered paragraphs, byline), with the question's cited paragraphs marked. In a gap-fill text the gap slots show their graded states.
  - **Quant, ORD and MEK:** the problem card (band and sitting, the figure with "Förstora", the stem, KVA's quantities, NOG's statements).
  - **DTK:** the page card on its white mat, with "Bredd · Hela sidan", "Förstora" and "Rotera". Facit opens at 40 %, as in practice.
  - **No tray.** The picks are in Facit, as after any answer: the "Ditt svar" and "Rätt svar" cards and the other options. A blank gets the verdict "Obesvarad" with the dashed `blank` stop, and only the "Rätt svar" card.
- **Facit** is the practice sheet, non-modal (§1.8), with a review foot: "‹ Föregående miss" (quiet) and "Nästa miss ↵" (the green pill), which becomes "Tillbaka till resultatet ↵" at the last miss. From a pass page the foot is "‹ Föregående" (quiet) and "Nästa ↵" (the green pill), which becomes "Tillbaka till passet ↵" at the last question.
- **Citations that land.** The reading column and Facit are mounted together on this screen and share one set of citation targets, so every chip lands on this screen, never on the page behind it:
  - a ¶ chip lowers Facit (to 40 % on desktop, to half on phone), then scrolls to and flashes its paragraph above it, as in practice;
  - "Visa uppgiften" scrolls to the stem and the figure;
  - a "(steg 2)" link opens its step.

  While the context is loading, or if it fails ("Texten gick inte att hämta. Försök igen" in the column, or the problem's and page's own failure copy from screens 6 and 7), these chips show as plain text ("¶ 3"), never as buttons that do nothing. Facit itself always shows.
- **Figures and the viewer.** "Förstora" on a figure or page, and "Visa figuren" in Facit's head, open `SparFigureViewer` as in practice. In review its answer strip becomes a verdict strip: the question with "Ditt svar: C · Rätt svar: B", and nothing to choose.
- **The URL keeps the place** (`/prov?result=<id>&q=15`, `/historik?pass=<id>&q=3`). A reload stays on the question, and browser back returns to the result or the pass page.

**Layout — desktop review (miss 3 of 9: question 15, LÄS).**
```
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│ ✕ Stäng            [LÄS]  ↻━━↻━━③━━○━━↻━━↻━━○━━↻━━↻   Miss 3 av 9         🍃 Lugnt ○   ◎ Fokus │
│                                                                                               │
│                 ╭─────────────────────────────────────────────────────────────╮               │
│                 │ (ÖVNINGSTEXT)                                  ⓘ Om texten  │ ← LÄS band    │
│                 │ the title of question 15's text                             │               │
│                 ├─────────────────────────────────────────────────────────────┤               │
│                 │  ¶1  …                                                      │               │
│                 │  ¶2  … the paragraph "¶ 2" points at, flashing …            │ ← read-only,  │
│                 │  ¶3  …                                                      │   no tray     │
│                 ░░░░░░░░░░░░░░░░░ text fades over 20 px under Facit ░░░░░░░░░░░               │
│                 ╭─────────────────────────────────────────────────────────────╮               │
│                 │ [✕]  Fel   Rätt svar är B.            (↻ Lagd i Repetera)   │ ← Facit,      │
│                 │ Ditt svar · C …            Rätt svar · B …                  │   non-modal   │
│                 │ Varför C lockade … ¶ 2 · Att ta med dig … · Lösningen …     │               │
│                 │ Visa mer av texten  T   ‹ Föregående miss  [ Nästa miss ↵ ] │               │
│                 ╰─────────────────────────────────────────────────────────────╯               │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Layout — phone review.**
```
┌──────────────────────────────────────┐
│ ✕ Stäng  [LÄS] ↻━↻━③━○━↻━↻━○━↻━↻   ◎ │ ← each stop speaks "Miss 3 av 9,
│ ╭──────────────────────────────────╮ │   fråga 15, fel"
│ │ (ÖVNINGSTEXT)        ⓘ Om texten │ │
│ │ the title of question 15's text  │ │
│ │ ¶1 …                             │ │
│ │ ¶2 … flashing after "¶ 2" …      │ │ ← the text scrolls and stays
│ │ ¶3 …                             │ │   tappable above Facit
│ ╭──────────────────────────────────╮ │
│ │               ━━━                │ │
│ │ [✕] Fel · Rätt svar är B.        │ │ ← Facit at half height, non-modal
│ │ Ditt svar · C …                  │ │
│ │ Rätt svar · B …                  │ │
│ │ Varför C lockade … ¶ 2           │ │
│ │ (‹)             [[ Nästa miss ]] │ │
│ ╰──────────────────────────────────╯ │
└──────────────────────────────────────┘
```
- On phone a stop in a leg's sheet closes the sheet and opens the review. "Stäng" returns to the result with focus on that leg's row.
- The head hides on scroll, as on any phone focus screen, leaving the pinned exit.

**Components.**
- *Reused:* the frame, `SparPageHead` (the eyebrow carries pass, half and time), `.sp-display`, `sp-scale` (from Idag's Prognosis), `.sp-trap`. For the review: the question layouts of screens 2, 6, 7 and 14 in their graded state (`Reader`, `SparProblemCard`, `SparPageCard`, `SparFigure`, `SparFigureViewer`), the feedback sheet, and `FeedbackBody`, whose ¶ citations land in the review's own reading column.
- *New (B2):*
  - **`SparSwitchback`** verdict mode;
  - **`SparLegRow`** (phone);
  - **`SparScoreCard`** (normed or estimated score, scale, disclaimers);
  - **`SparReview`** (above): the read-only question screen with its context, the review foot (previous and next, no "Nästa fråga"), the viewer's verdict strip, and "Stäng" back to where it opened. Screen 11's pass page reuses it.

**States.**

| State | What the result shows |
|---|---|
| Loading | Skeleton in the final layout: headline bar, score card, four switchback rows. Today's "Hittar inte resultatet." flash right after handing in is a bug: the result must open from the hand-in's own data while the list refreshes. |
| Not found | Only on confirmed absence. A result is kept as long as its pass, 120 days after hand-in, but the list of results returns only the newest 50, so a full list alone never decides that a result is gone. A result opens from data already in hand (the hand-in, a Historik row) or is looked up by its id (open question 4). When the lookup, or a complete list fetched as the page opens (below), confirms there is no such result: "Det här provpasset finns inte längre. Provpass sparas i 120 dagar." with "Till Provpass" as the green pill. |
| Not in the current list | Until the lookup by id exists, a result that is missing from a full list (50 rows) cannot be told apart from a deleted one, so it is never called gone. A list with fewer than 50 rows is complete, so a result missing from it is confirmed absent ("Not found"), but only when that list was fetched as the page opened: a cached list can predate the result. For a full list: "Det här provpasset finns inte bland dina 50 senaste, så det kan inte visas här än." with "Till Provpass" as the green pill. |
| Fetch error | "Det gick inte att hämta resultatet. Försök igen", with the retry as the green pill. Today the same failure shows "Hittar inte resultatet.", as if the pass did not exist. |
| Normering table still loading | The score card shows a skeleton number. It never shows the linear value first and then swaps. |
| Timed out | "Tiden tog slut, så passet lämnades in automatiskt." under the headline. |
| No misses | "Inga missar. Hela passet satt." The green pill becomes "Till Idag". |
| Short pass | The "saknas" line under the raw score. |
| Calm | No score bar (the words "≈ 1,25 av 2,0" stay), no per-leg time (it stays one tap away in the leg), stops without colour fills (glyphs stay). |

**Navigation.**
- In: handing in (or the timeout); "Dina senaste pass" on the Provpass hub; Historik rows for passes (screen 11).
- Out:
  - "Gå igenom missarna" → the review (`/prov?result=<id>&q=<n>`);
  - "Till Provpass" (quiet);
  - the trap's "Läs i Uppslag →";
  - the frame's navigation.

  Browser back from the result goes to the hub, never into the finished pass.

**ADHD-PI.**
- One number first (raw right), and one next step (the misses).
- The normed score is explained right where it stands, and its uncertainty is named in words.
- Over-budget sections are stated, not shamed. They are the pacing lesson the pass exists for.
- The misses are reviewed one at a time, with a visible end ("Miss 3 av 9").

**Accessibility.**
- The switchback in verdict mode is a list grouped by leg (`h3` per leg). Each stop is a button named "Fråga 15, LÄS, fel, lagd i Repetera, visa facit".
- The score card's bar is `role="img"` with "Normerat ungefär 1,25 på skalan 0 till 2,0". The disclaimers are real text, not tooltips. The glossary terms ("härlett", "indikativ") open as small dialogs with focus management.
- The review is a focus screen whose Facit is non-modal (§1.8): nothing traps focus, and the text, problem or page stays reachable. "Stäng" returns focus to the stop or green pill that opened it (on phone, to the leg's row).

**Unmistakably Spår.**
- The pass drawn as the switchback trail it was walked on, every stop wearing its verdict glyph.
- Amber ↻ instead of red for misses.
- The scale bar from Idag, and one green pill that leads straight into learning.


### Screen 11 · Framsteg, including Historik (B2)

**Purpose.** Where you stand and what moves you up: the projected score with its honest uncertainty, the week in words, the eight sections, how regularly you practise, and every earlier pass (Historik).

**The one action:** the first item of "Nästa steg uppåt", e.g. "Öva LÄS · ca 10 min ↵", the section the weakness ranking puts first. Today Framsteg's Fokus block has these actions in small caps among many links. Spår promotes the first one to the screen's green pill. The Historik view has no green pill while it lists passes: each row is its own way in.

**What it shows — Översikt (`/progress`).**
- **Prognosis:** the total on 0–2,0 (the mean of the verbal and kvant halves; each section is twice its 90-day correct share) and its uncertainty. The halves: "Verbal 1,5 · Kvant 1,3" (Idag's fixture values). The **calibration caveat**, verbatim, whenever LÄS or ELF feed it (today it is missing from the live page): "Uppskattningen för LÄS och ELF bygger på HP-Coachs övningstexter, vars svårighetsgrad ännu inte är kalibrerad mot riktiga HP-resultat."
- **The week in words** (today's best idea, kept and tightened). Each clause appears only when its data exists:
  - "Prognosen steg +0,1 den här veckan" (or "föll −0,1", or "låg still");
  - "132 frågor med 71 % träffsäkerhet";
  - "Verbal (1,5) drar ifrån kvant (1,3)";
  - "gapet upp mot målet bärs främst av LÄS 1,1 och NOG 1,2".

  No streak clause (see Veckorna).
- **The climb ("Klättringen"):** the weekly estimate for the last 12 weeks, with weeks without practice bridged by a dotted line, and the goal as a line with a flag. The goal is 2,0 or the app's 1,8 (open question 1).
- **"Nästa steg uppåt":** up to three sections from the weakness ranking, each with its reason in words:
  - "Lägst just nu · 1,1";
  - "Inte övad på 16 dagar";
  - "På väg ner".

  Each has "Öva {SEK}" and "Läs i Uppslag". The first "Öva" is the green pill; the rest are quiet. Each item's mark is a numbered stop (1, 2, 3) ringed in its section's hue, with the code as text. Section chips are kept for card heads (§1.6).
- **"Delproven"** (all eight, in exam order, grouped Verbal / Kvant):
  - score;
  - its ± band (95 %, needs two answers);
  - trend over the last two weeks;
  - answers in 90 days, with how sure the estimate is in words ("osäker" under 10, "rimlig" 10–29, "säker" 30+; the code says låg, medel, hög);
  - "inte övad på N dagar" from 14 days.
- **"Veckorna" (replaces the streak and the heat strip):** days practised per week, as earned dots against the weekly goal ("4 av 5 dagar den här veckan"), for 12 weeks. A week without practice is a short column, never a row of empty past slots. No "serie", no "rekord", no "senast bruten".
- **Repetition:** "8 redo nu · 41 i kön · 63 inlärda", plus "Till Repetera". "I kön" counts every miss not yet learnt (the live "aktiva i kön"). Öva's "dagens hög" is only today's share of it, so the two numbers differ.
- **Historik:** the count of passes, and the way in (the segmented control and a link at the foot).

**What it shows — Historik (`/historik`).**
- Every finished pass, newest first, **grouped by day** ("Idag", "Igår", "Onsdag 7 okt"). Passes are kept for 120 days.
  - **"Visa äldre pass" needs paging.** Today each list (practice passes, Provpass results) returns only its newest 50 and cannot be asked for older ones. The button fetches the next passes from both lists, older than the last one shown (open question 4).
  - **The merged list has no holes.** Each list is complete down to its oldest row, so the merged list stops at the newer of the two lists' oldest rows; a list known to hold everything sets no limit. Every pass newer than the stop is shown. When the stop falls inside a day, that day's group ends at the stop and the list's end (the button, or the line below) follows at once, so part of a day never looks like the whole day.
  - **Until paging exists**, the list ends with a quiet line instead of the button unless both lists are known to hold everything: "Har du äldre pass än de här kan de inte visas ännu." It is worded as a condition because the list cannot know whether older passes exist. A results list under 50 rows holds everything, but the practice list cannot tell by its length, because the server cuts it from the newest 200 finished sessions. So paging must say whether more exist.
  - **An older pass or result opened from here** opens from its row's data or by its id, not by searching the newest 50, so it is never reported as gone just because it is old (screen 10's states, the pass page's states).
- **Per pass:**
  - kind and section ("LÄS-övning", "Repetition", "Blandad övning", "Riktad repetition · LÄS", "Provpass · Verbal");
  - for a text, its title;
  - right of total;
  - how long it took and when it ended (today's rows show neither).

  Provpass results join the list (today they are excluded); see open question 4.
- **A pass opened:** its questions in order, each with its verdict. Each opens in review (screen 10's `SparReview`), with its full Facit beside its text, problem or page. **Present-tense numbers never appear on an old pass**: no today's prognosis, no "dina nya missar".

**Layout — desktop Översikt (1440 × 900).** Idag's composition: a main column and a 332 px side column.
```
┌──────┬────────────────────────────────────────────────────────────────────────────────────────────┐
│ rail │  Framsteg · 9 dagar till Höstprov 26                          ( Översikt │ Historik )       │
│      │  ≈ 1,4 av 2,0                                                                               │
│      │  Prognosen steg +0,1 den här veckan — 132 frågor med 71 % träffsäkerhet. Verbal (1,5) drar │
│      │  ifrån kvant (1,3); gapet upp mot målet bärs främst av LÄS 1,1 och NOG 1,2.                │
│      │  Uppskattningen för LÄS och ELF bygger på HP-Coachs övningstexter, vars svårighetsgrad …   │
│      │                                                                                             │
│      │  Klättringen                          12 veckor │  Nästa steg uppåt                         │
│      │  2,0 ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ ⚑ mål │  (1) LÄS · Lägst just nu · 1,1            │
│      │  1,5                          ╱‾‾◉ ≈ 1,4 ▒       │      [ Öva LÄS · ca 10 min   ↵ ]          │
│      │  1,0 ──╱‾╲──╱‾‾‾┈┈┈╱‾‾╱‾‾‾                       │      Läs i Uppslag                        │
│      │      v.31                                v.42   │  (2) NOG · Inte övad på 16 dagar · 1,2    │
│      │                                                 │      Öva NOG · Läs i Uppslag              │
│      │  Delproven                                      │  (3) MEK · På väg ner · 1,3               │
│      │  Verbal · 1,5                                   │      Öva MEK · Läs i Uppslag              │
│      │  (ORD) Ordförståelse   1,6 ±0,1  ↗  0──────|─2,0 │   ← (1)(2)(3): numbered stops, each       │
│      │                        86 försök · säker        │     ringed in its section's hue           │
│      │  (LÄS) Läsförståelse   1,1 ±0,2  →  0───|────2,0 │  Veckorna                                 │
│      │                        34 försök · säker        │  dots per week: 3 5 4 2 5 5 3 4 5 5 3 4   │
│      │  … MEK, ELF                                     │  (stacked, oldest left) · 4 av 5 dagar    │
│      │  Kvant · 1,3                                    │  den här veckan                           │
│      │  (XYZ) … (KVA) … (NOG) … (DTK) …                │  Repetition                               │
│      │                                                 │  8 redo nu · 41 i kön · 63 inlärda        │
│      │                                                 │  Till Repetera →   Historik · 37 pass →   │
└──────┴────────────────────────────────────────────────────────────────────────────────────────────┘
```
- **The display title is the prognosis itself**, in Bricolage at 64 px: "≈ 1,4 av 2,0". The eyebrow names the page and the countdown. The paragraph is the lede (`.sp-lede`, 18 px, max 34 em). The caveat follows as `.sp-caveat` (12.5 px, ink-3), set as text, never hidden.
- **"Klättringen" (`SparClimb`)** is an elevation line.
  - **The line:** 2.5 px `--sp-ink`. Weeks without practice are drawn as a dotted bridge, the area under the line is a 6 % ink wash, and the goal is a dashed line ending in a `goal` stop (⚑).
  - **This week:** a `now` stop, with "≈ 1,4" set beside it and a hatched band for the current uncertainty, the same hatch as Idag's "osäkerhet".
  - **Axes:** ticks 1,0 · 1,5 · 2,0 and the week numbers at the ends.
  - **Not here:** gridlines, tooltips and green.
- **Section rows (`SparSectionLine`)** have:
  - a 36 px section stop;
  - the name, with the facts in a second line;
  - the score with ±;
  - the trend as a glyph and a word in the accessible name (↗ "uppåt", → "stilla", ↘ "nedåt"), with ↘ in ink-2, never red;
  - a 160 px mini scale, **`SparScaleMini`** (new in B2, since no small variant of Idag's `sp-scale` exists): a track, the hatched ± band and the mark.

  A row is a button that opens in place (container transform) to "Öva {SEK} · ca N min" and "Läs i Uppslag". Both are quiet buttons: the page's one green pill stays on the first "Nästa steg".
- **"Veckorna" (`SparWeeks`)**: twelve columns, one per week, each a stack of up to seven 10 px earned dots (days practised). A week that met the goal gets a tiny flag on top. The goal is a dotted line across at its height.

**Layout — desktop Historik.**
```
┌──────┬────────────────────────────────────────────────────────────────────────────────────────────┐
│ rail │  Framsteg                                                     ( Översikt │ Historik )       │
│      │  Historik                                                                                   │
│      │  Öppna ett pass för att se hela facit igen.        ( Allt │ Övning │ Repetition │ Provpass ) │
│      │                                                                                             │
│      │  Igår                                                                                       │
│      │  (ORD)  ORD-övning                                  9 av 10 rätt · 3 min · 18:02      ›     │
│      │    ┆                                                                                        │
│      │  (↻)    Repetition                                  7 av 8 rätt · 9 min · 17:40      ›      │
│      │    ┆                                                                                        │
│      │  Onsdag 7 okt                                                                               │
│      │  (NOG)  NOG-övning                                  4 av 6 rätt · 12 min · 19:30     ›      │
│      │    ┆                                                                                        │
│      │  (⌛)    Provpass · Verbal · Hösten 2025 · Provpass 2  31 av 40 · ≈ 1,25 · 53 min · 14:10 ›  │
│      │    ┆                                                                                        │
│      │  (ELF)  ELF-övning · Left to Soak                   4 av 5 rätt · 14 min · 08:15     ›      │
│      │    ┆                                                                                        │
│      │  …                                                                                          │
│      │  [ Visa äldre pass ]                                                                        │
└──────┴────────────────────────────────────────────────────────────────────────────────────────────┘
```
- A **vertical stig** grouped by day, with day headings in `.sp-h3`. Each pass is a stop ringed in its section's hue. Passes with no single section carry a glyph on a neutral ink ring: Repetition ↻ (REP's near-neutral), Provpass ⌛, Blandad `↝`.
- The rows match Idag's fixture ("Senaste passen": ORD 9/10 and Repetition 7/8 yesterday, NOG 4/6 on Wednesday). Nothing has been finished today, because the LÄS text is still paused, so the list starts at "Igår".
- A row **opens in place**: the row grows into the pass's question stops (✓/↻, or ✓/↻/○ for a Provpass), with "Visa hela facit". That opens the pass page. A Provpass opens its result (screen 10).
- **The pass page** is a sub-page of Historik at `/historik?pass=<id>`. The search parameter keeps it inside Historik's route, and the live `?done=<id>` permalinks redirect there when the pass is not the one just finished.
  - The head reads: eyebrow "Historik · onsdag 7 okt 19:30", title "NOG-övning", lede "4 av 6 rätt · 12 min".
  - The body is the questions as a vertical stig, each stop with its verdict and the question's first line, with "← Historik".
  - Choosing a question opens it in review (`SparReview`, screen 10) at `/historik?pass=<id>&q=<n>`, on desktop and phone alike: its text, problem or page read-only, its Facit with working citations, and "‹ Föregående · Nästa ›" through the pass. "Stäng" comes back to that stop. Facit never unfolds inside the list, where it would have no text to cite.
  - It reads in the past tense only, with no celebration replay.
  - States:
    - loading: skeleton stops and rows;
    - not found, only when the lookup by the pass's id confirms it is gone (never because it is older than the loaded list): "Passet finns inte längre. Pass sparas i 120 dagar." with "Till Historik" as the green pill;
    - error: "Det gick inte att hämta passet. Försök igen", with the retry as the pill.
  - Otherwise its green pill is "Öva NOG igen · ca 12 min".
- The filter is a `SparSegmented`. It never hides the day headings of the groups it keeps.

**Layout — phone.** Översikt stacks in the order that keeps the green pill above the fold:
```
┌──────────────────────────────────────┐
│ [◆] HP-Coach                     (◉) │
│ Framsteg · 9 dagar kvar              │
│ ≈ 1,4 av 2,0                         │
│ ( Översikt │ Historik )              │
│ Prognosen steg +0,1 den här veckan — │
│ 132 frågor med 71 % träffsäkerhet. … │
│ Uppskattningen för LÄS och ELF …     │
│ Nästa steg uppåt                     │
│ (1) LÄS · Lägst just nu · 1,1        │
│ [[  Öva LÄS · ca 10 min         ]]   │
│ ② NOG · ③ MEK  (quiet rows)          │
│ Klättringen (full width, 180 px)     │
│ Delproven (rows, mini scales)        │
│ Veckorna · Repetition · Historik →   │
├──────────────────────────────────────┤
│ (⌁)Idag (▣)Öva (⌛) (💡) (⛰•)        │
└──────────────────────────────────────┘
```
Historik on phone is the same day-grouped path, one row per pass. A row opens the pass page directly; there is no in-place growth on phone.
```
┌──────────────────────────────────────┐
│ [◆] HP-Coach                     (◉) │
│ Framsteg                             │
│ Historik                             │
│ ( Översikt │ Historik )              │
│ ( Allt │ Övning │ Repetition │ … ) › │
│ Igår                                 │
│ (ORD) ORD-övning                     │
│  ┆    9 av 10 rätt · 3 min · 18:02 › │
│ (↻)   Repetition                     │
│  ┆    7 av 8 rätt · 9 min · 17:40  › │
│ Onsdag 7 okt                         │
│ (NOG) NOG-övning                     │
│  ┆    4 av 6 rätt · 12 min · 19:30 › │
│ (⌛)   Provpass · Verbal              │
│  ┆    31 av 40 · ≈ 1,25 · 53 min   › │
│ …                                    │
├──────────────────────────────────────┤
│ (⌁)Idag (▣)Öva (⌛) (💡) (⛰•)        │
└──────────────────────────────────────┘
```
- **The navbar stays on Historik** (today it has no tab bar), with Framsteg current.
- On desktop the rail highlights Framsteg on both views (today Historik highlights nothing).

**Components.**
- *Reused:* the frame, `SparPageHead`, `.sp-display`, `.sp-lede`, the `sp-scale` family, `.sp-caveat`, `SparStop` / `SparPath`, `SparSegmented` and `SparDisclosureCard` (both B1), `SparReview` (B2, screen 10), `.sp-link`, and Idag's `.sp-home-grid` proportions.
- *New (B2):*
  - **`SparClimb`** (the elevation chart, with a table alternative);
  - **`SparSectionLine`**;
  - **`SparWeeks`**;
  - **`SparHistoryPath`** (a day-grouped vertical path with in-place growth);
  - the **pass page** (question stops, each opening `SparReview`).

**States.**

| State | What Framsteg shows |
|---|---|
| New user | Title "Ingen prognos än". Lede: "Svara på några frågor så börjar den här sidan leva." The green pill reads "Börja här · 10 frågor" and starts the diagnostic, as today. The climb is a single start stop on an empty trail. The section rows read "inget än" with their stops outlined. |
| Only one half practised | The title stays "Ingen prognos än". The lede says why: "Prognosen behöver både verbal och kvant. Du har övat verbal — en kvantrunda till så visas den." The green pill starts the missing half's suggested section, e.g. "Öva KVA · ca 6 min" (XYZ when nothing ranks yet). Today this case shows the misleading "svara på några frågor". |
| Little data | Each part says its threshold in words:<br>• the climb: "Kurvan visas efter två veckor med övning.";<br>• a section's ±: "Bandet visas efter två svar.";<br>• the delta: "Jämförelsen med förra veckan kräver minst fem svar i ett delprov båda veckorna." |
| Loading | Skeletons in the final layout. The climb and "Nästa steg" reserve their height, so nothing jumps when data arrives (today the chart and Fokus push the page down). |
| Error | "Gick inte att hämta just nu — försöker igen automatiskt." in each block, plus a "Försök igen" link. Cached data stays visible, with "Senast uppdaterad 15:40". |
| Historik empty | "Inga avslutade pass än. Kör en övning så landar den här." with the green pill "Till Öva". |
| Historik error | "Det gick inte att hämta dina pass. Försök igen". Never the empty copy. |
| Calm | Removes the climb (the paragraph carries the trend), the ± bands, the mini scales, the trend glyphs and the week dots. The words "4 av 5 dagar den här veckan" stay. |

**Navigation.**
- In:
  - the rail or navbar "Framsteg";
  - Idag's "Alla pass" (built; lands on Historik);
  - a quiet "Prognosen i Framsteg →" link in Idag's Prognos head, which B2 adds (B2's one change to round 1's Idag; the built Idag has no link there);
  - the command palette.
- Out:
  - "Nästa steg" → `/drill?section=…&start=1` (starts at once, like Öva) or `/lektion?section=…`;
  - section rows → the same two;
  - Repetition → `/repetition`;
  - Historik rows → the pass page, or screen 10 for a Provpass;
  - the pass page's "← Historik".

  The URL keeps the view (`/progress`, `/historik`), so browser back moves between them.

**ADHD-PI.**
- The page answers "how am I doing?" in one sentence of words before any chart, and "what now?" with one pill.
- No streak can be lost, and missed days are not drawn.
- Uncertainty is shown as a band and named "osäkerhet", so a dip in a noisy week is not read as failure.
- Historik groups by day, which matches how memory works ("what did I do yesterday?").

**Accessibility.**
- `h1` is the prognosis line, with a full spoken form ("Prognos: ungefär 1,4 av 2,0, osäkerhet 1,25 till 1,55").
- **The climb:**
  - it is a `figure`;
  - `figcaption` is the trend in words;
  - a "Visa som tabell" disclosure gives the weekly values (week, estimate, answers);
  - lines and stops keep ≥ 3:1 against the card.
- **Section rows** announce everything they show: "Läsförståelse, 1,1 plus minus 0,2, stilla, 34 försök, säker". Today the label replaces the content.
- **Veckorna** is `role="img"` with "Dagar med övning per vecka, senaste 12 veckorna: 3, 5, 4, …; målet 5". No 72 focusable cells, as today's heat grid has.
- Historik is a feed of headed groups (`h3` per day) with list items. The filter is a radio group.

**Unmistakably Spår.**
- The estimate as a climb toward a flag on the summit line (Framsteg's icon is a mountain).
- Sections as ringed stops with Idag's scale.
- Forgiving week dots instead of a streak.
- Historik as the trail you have walked, day by day.
- The prognosis set as a Bricolage display line.


### Screen 12 · Uppslag & lektion (B3)

**Purpose.** Uppslag is the library of patterns distilled from 27 real tests: traps, rules, tactics, question types and word roots, one catalogue per section. A *lektion* reads one section's catalogue.
- **The library's one action:** "Fortsätt läsa ↵" on the bookmark, or, with none, the suggested section ("Läs om LÄS · svagast just nu").
- **The lesson's one action:** "Nästa ↵" to the next entry. At the end it becomes "Öva hela NOG · ca 12 min".

**What it shows.**
- **The library.**
  - **Eight sections, grouped Verbal and Kvant**, each with:
    - its name;
    - what its catalogue holds, by kind and count: ORD 41 rötter, LÄS 8 frågetyper, MEK 16 regler, ELF 8 frågetyper, XYZ 59 fällor, KVA 54 fällor, NOG 25 fällor, DTK 10 taktiker (221 in all);
    - how many you have read;
    - its one-line blurb, verbatim from today (e.g. NOG "Datasufficiens — två radsummor räcker inte för en enskild cell.");
    - whether it is the weakest section ("svagast just nu").
  - **The bookmark:** the entry you last opened ("NOG · Fälla 3 · Yttre marginaler är inte en fylld tabell").
  - **A plan step of kind lesson**, when Idag has one. Its rationale is verbatim from the scheduler, e.g. "Grunden först: läs XYZ-regeln som den här KVA-fällan bygger på."
  - **"Hellre öva direkt?":** Blandad övning, and Repetera with its count.
- **A lesson (one section's catalogue).** The section's name and subline (e.g. "Kvantitativa resonemang — datasufficiens."), its entries in catalogue order with which you have read, and one entry at a time. Entries come in three kinds:

  | Kind | Sections | What one entry shows |
  |---|---|---|
  | **Fälla** (trap) | NOG, KVA, XYZ | The one-line lesson as the headline, then:<br>• the pattern and why it happens;<br>• "Igenkänningstecken";<br>• "Motåtgärd";<br>• "Räkneexempel" in four beats ("Förutsättning", "Fällans tanke", "Korrekt tanke", "Svar");<br>• "När fällan inte gäller";<br>• the typical wrong answer;<br>• example questions. |
  | **Protokoll** | LÄS and ELF (question types), MEK (rules), DTK (tactics) | Its name, then:<br>• LÄS/ELF: the "Angreppsprotokoll" as numbered steps, and "Vanliga fällor" (pattern + why it traps);<br>• MEK: "Mönsterregel";<br>• DTK: the tactic and "Igenkänningstecken". |
  | **Rot** (root) | ORD | The root (e.g. "för-"), its origin, its meaning, example words, and "Öva ord med denna rot". |

  Each entry offers its practice, which plays its example questions (`/drill?section=…&framework=…`). The label is in its kind's words, as today:
  - "Öva detta mönster" (fälla);
  - "Öva denna frågetyp" (LÄS, ELF);
  - "Öva denna regel" (MEK);
  - "Öva denna taktik" (DTK);
  - "Öva ord med denna rot" (ORD).

  This spec calls them all "Öva detta mönster" for short.

**Layout — desktop library (1440 × 900).**
```
┌──────┬────────────────────────────────────────────────────────────────────────────────────────────┐
│ rail │  Uppslag                                                ⌕ Sök bland 221 mönster            │
│      │  Mönster att känna igen                                                                    │
│      │  Fällor, regler och taktiker från 27 riktiga prov. Läs ett mönster, öva det direkt.        │
│      │                                                                                            │
│      │  ╭─ [NOG] Kvantitativa resonemang ─────────────────── Påbörjad ─╮                           │
│      │  │ Fälla 3 av 25                                               │                           │
│      │  │ Yttre marginaler är inte en fylld tabell                     │                           │
│      │  │ ✓━✓━◉━④━⑤━ … ━㉕   6 av 25 lästa                              │                           │
│      │  │ [ Fortsätt läsa   ↵ ]        Öva hela NOG · ca 12 min        │                           │
│      │  ╰─────────────────────────────────────────────────────────────╯                           │
│      │                                                                                            │
│      │  Verbal del                                    Kvantitativ del                             │
│      │  ╭(ORD) Ordförståelse ──╮ ╭(LÄS) Läsförståelse╮ ╭(XYZ) Matematisk … ─╮ ╭(KVA) Kvantitativa ─╮ │
│      │  │ 41 rötter   ◔ 12/41  │ │ 8 frågetyper ○ 0/8 │ │ 59 fällor  ◔ 9/59  │ │ 54 fällor  ○ 0/54  │ │
│      │  │ Täta rotkluster (för-,│ │ Det texten säger,  │ │ Minustecken över en│ │ Kvadrat-likhet     │ │
│      │  │ be-, över-) återkommer│ │ inte det den antyder│ │ parentes byter …   │ │ låser inte tecken. │ │
│      │  ╰──────────────────────╯ │ [svagast just nu]  │ ╰────────────────────╯ ╰────────────────────╯ │
│      │  ╭(MEK) …╮ ╭(ELF) …╮      ╰────────────────────╯ ╭(NOG) …╮ ╭(DTK) …╮                       │
│      │                                                                                            │
│      │  Hellre öva direkt?  ↝ Blandad övning · ca 9 min   ↻ Repetera 8 missar                     │
└──────┴────────────────────────────────────────────────────────────────────────────────────────────┘
```
- **The station** is the bookmark, as a `SparStation` with the section's band and a path of the catalogue's stops, read ones ✓. Long catalogues draw the stops as a thin bar of segments once there are more than 30.
- **Section tiles** are Öva's tiles (screen 5) with a **reading ring** (`SparPassStop`'s seen-share ring, here the read share) and the blurb in ink-2. A tile opens the lesson; it does not start a drill.
- **Search** (new; the catalogues are small and local) is a field in the head's tools. Results are rows with a section stop, the entry's kind and number ("NOG · Fälla 3") and its headline; they open the lesson at that entry.

**Layout — desktop lesson.** A sub-page of Uppslag (rail on Uppslag, a back link). A **contents path** on the left, and **one entry** on the right.
```
┌──────┬────────────────────────────────────────────────────────────────────────────────────────────┐
│ rail │  ← Uppslag                                                                                 │
│      │  Uppslag · NOG                                                                             │
│      │  Kvantitativa resonemang                       Öva hela NOG · ca 12 min   Svagaste fällorna │
│      │  Datasufficiens: när räcker informationen? 25 fällor · 6 lästa                     · 4    │
│      │                                                                                            │
│      │  Innehåll           │  NOG · Fälla 3 av 25                                       ca 2 min  │
│      │  (✓) Två radsummor… │  Yttre marginaler är inte en fylld tabell — radsummor och            │
│      │   │                 │  kolumnsummor lämnar varje cell fri.          ← Bricolage 30 px   │
│      │  (✓) Andelar utan … │                                                                      │
│      │   │                 │  Mönstret … (the pattern and why it happens, 16.5 px, 36 em)        │
│      │  (◉) Yttre margin…  │                                                                      │
│      │   │                 │  👁 Igenkänningstecken   (a sunk callout)                            │
│      │  (4) …              │  ↝ Motåtgärd             (a callout with the technique glyph)        │
│      │   │                 │                                                                      │
│      │  (5) …              │  Räkneexempel                                                        │
│      │   ┆                 │  (1) Förutsättning — Frågan: hur många ljushåriga flickor …          │
│      │  (⚑) Allt läst      │   │                                                                  │
│      │                     │  (↻) Fällans tanke — "Raderna och kolumnerna räcker …"  ← amber ring │
│      │                     │   │                                                                  │
│      │                     │  (✓) Korrekt tanke — …                                  ← ok ring    │
│      │                     │   │                                                                  │
│      │                     │  (⚑) Svar — E — informationen är otillräcklig även tillsammans.      │
│      │                     │                                                                      │
│      │                     │  När fällan inte gäller · Typiskt felsvar …                          │
│      │                     │  ─────────────────────────────────────────────────────────────────── │
│      │                     │  Öva detta mönster · 5 frågor        ‹ Föregående   [ Nästa ↵ ]      │
└──────┴────────────────────────────────────────────────────────────────────────────────────────────┘
```
- **The contents path (`SparContents`)** is a sticky vertical stig, 300 px wide, scrolling on its own.
  - Each entry is a 32 px stop: ✓ when read, the `now` ring for the current one, its number otherwise. Its headline is clamped to two lines (the full text is the stop's name). The path ends in a goal stop, "Allt läst".
  - Choosing a stop opens that entry. Moving through entries changes the page's URL hash (`#NOG-TRAP-003`), so browser back and deep links work.
- **The entry card** is one card at the explanation's measure (36 em).
  - Its eyebrow names the kind and place in Swedish: "Fälla 3 av 25", "Frågetyp 1 av 8", "Regel 4 av 16", "Rot 12 av 41", "Taktik 2 av 10". Today it shows raw ids such as "NOG · TRAP 003", "LAS · TYP 001" or "MEK-RULE-001".
  - Its headline is Bricolage 30 px.
- **"Räkneexempel" is a four-stop path:**
  - "Förutsättning" (a numbered stop);
  - "Fällans tanke" (the **amber ↻ ring**, with the word "fällans tanke": the thought the trap invites);
  - "Korrekt tanke" (the outline ✓ stop, §1.2);
  - "Svar" (the goal stop).

  The trap's logic becomes the same path language as a miss and a fix.
- **LÄS/ELF question types:** "Angreppsprotokoll" is a numbered vertical path (Facit's step dots), and "Vanliga fällor" are `.sp-trap` rows with their 4 px edge in the section's hue.
- **ORD roots:** the root is set in Bricolage display (52 px, "för-"), with the origin as an eyebrow ("germanskt"), the meaning in italic, the example words as neutral sunk pills, and "Öva ord med denna rot · 6 frågor".
- **"Nästa" marks the entry read and opens the next.** This is the screen's green pill. A read entry's ✓ can be undone from the entry's eyebrow ("Läst ✓ · Ångra"). The explicit "Markera som läst" of today stays for those who read without moving on.
- **"Öva detta mönster"** is quiet, beside the pill. It starts the pattern drill and returns to this entry when done.

**Layout — phone, library.**
```
┌──────────────────────────────────────┐
│ [◆] HP-Coach                     (◉) │
│ Uppslag                          ⌕   │ ← search opens a full-height sheet
│ Mönster att känna igen               │
│ Fällor, regler och taktiker från     │
│ 27 riktiga prov.                     │
│ ╭─ [NOG] Kvantitativa resonemang ──╮ │
│ │ Fälla 3 av 25 · Påbörjad         │ │
│ │ Yttre marginaler är inte en      │ │
│ │ fylld tabell                     │ │
│ │ ✓━✓━◉━④━ … ━㉕   6 av 25 lästa    │ │
│ │ [[     Fortsätt läsa        ]]   │ │
│ ╰──────────────────────────────────╯ │
│ Verbal del                           │
│ (ORD) Ordförståelse                  │
│       41 rötter · 12 lästa   (◔)  ›  │
│ (LÄS) Läsförståelse                  │
│       8 frågetyper  [svagast]  (○) › │
│ …                                    │
├──────────────────────────────────────┤
│ (⌁)Idag (▣)Öva (⌛) (💡•) (⛰)        │
└──────────────────────────────────────┘
```

**Layout — phone, lesson.**
```
┌──────────────────────────────────────┐
│ ← Uppslag                        (◉) │
│ NOG · Fälla 3 av 25       Innehåll ⌄ │ ← sticky strip under the app bar
│ ╭──────────────────────────────────╮ │
│ │ Yttre marginaler är inte en      │ │
│ │ fylld tabell                     │ │
│ │ Mönstret …                       │ │
│ │ 👁 Igenkänningstecken …          │ │
│ │ ↝ Motåtgärd …                    │ │
│ │ Räkneexempel                     │ │
│ │ (1)─ Förutsättning …             │ │
│ │ (↻)─ Fällans tanke …             │ │
│ │ (✓)─ Korrekt tanke …             │ │
│ │ (⚑)─ Svar …                      │ │
│ ╰──────────────────────────────────╯ │
│ Öva detta mönster · 5 frågor         │
│──────────────────────────────────────│
│ (‹)                  [[  Nästa  ]]   │ ← sticky foot
├──────────────────────────────────────┤
│ (⌁)Idag (▣)Öva (⌛) (💡•) (⛰)        │
└──────────────────────────────────────┘
```
- "Innehåll ⌄" opens the contents path in a bottom sheet, scrolled to the current stop.
- The navbar works on every Uppslag page. Today the tab bar on `/lektion` renders but does nothing when tapped.

**Components.**
- *Reused:* the frame, `SparPageHead`, `SparStation`, Öva's `SparSectionTile` / `SparSectionRow`, `SparStop` / `SparPath`, `.sp-trap`, Facit's step path (`.sp-steps`), `.sp-link`, `SparPassStop`'s ring.
- *New (B3):*
  - **`SparContents`**: the sticky contents path, and its phone sheet.
  - **`SparEntryCard`** with three bodies: trap, protocol, root.
  - **`SparWorkedExample`**: the four-stop path.
  - **`SparSearch`**: field and results.
  - **A `SparCallout`** for "Igenkänningstecken" and "Motåtgärd": a sunk card with an inner radius of 20 and a glyph in the heading.

**States.**

| State | What Uppslag shows |
|---|---|
| Loading (library) | Skeleton station and tiles in default section order. The order never shuffles under the reader: if the weakness ranking arrives later, only the "svagast just nu" chip appears. Today the list re-sorts. |
| Loading (lesson) | The head is real at once. The contents path and the entry card are skeletons. |
| Error | "Biblioteket gick inte att hämta. Försök igen". The retry really retries. Today the page shows "Kunde inte ladda: failed to load framework NOG: HTTP 500" and caches the failure. |
| Empty catalogue | "Inget innehåll här ännu." |
| Unknown entry in a link | The lesson opens at its first entry with a quiet line: "Mönstret finns inte längre. Här är början av NOG." |
| Every entry read | The contents path's goal stop fills. The card ends with "Allt i NOG är läst." The green pill becomes "Öva hela NOG · ca 12 min". |
| No bookmark, no stats | The station is replaced by one line: "Välj ett delprov att läsa om. Ett mönster tar ett par minuter." There is no green pill here, because the eight sections are equal choices (one of §1.5's exceptions). |
| Calm | No reading rings or catalogue stops (the counts "6 av 25 lästa" stay as words), no section tints, no springs. |

**Navigation.**
- In:
  - the rail or navbar "Uppslag";
  - Idag's plan step of kind lesson, which opens the lesson **at its entry**. Today's link drops the `#entry` and lands on the picker;
  - the resume of a paused lesson on Idag;
  - Facit's framework link ("Läs om fällan i Uppslag →");
  - the adaptive review's "Läs mönstret i uppslaget först →";
  - Framsteg's "Läs i Uppslag";
  - search.
- Out:
  - "Öva detta mönster" → the pattern drill, which returns to the entry;
  - "Öva hela NOG" → `/drill?section=NOG&start=1`;
  - "Svagaste fällorna" → `/drill?section=NOG&weak=1`;
  - "← Uppslag".

  Example questions play inside the pattern drill. Today's raw "Direktlänk … för granskning eller debug" screen is never shown to learners.

**ADHD-PI.**
- One entry at a time, with a visible path and an end. Today a catalogue is one long scroll of collapsed cards (KVA and XYZ run to 54 and 59).
- Each entry says roughly how long it takes to read ("ca 2 min"). The estimate counts only the visible text; today it counts hidden notes and ids, inflating to "~70 min".
- Learn, then do: every entry ends with its own practice, and the drill brings you back.
- The trap's thought is drawn as a ↻ stop, so a learner sees the wrong turn before the right one.

**Accessibility.**
- The contents path is a `nav` named "Innehåll", with `aria-current="step"` on the open entry.
- The entry is an `article` whose headline is the page's `h2` (the section name is the `h1`).
- The worked example is an ordered list. Each stop's role is in words ("Fällans tanke"), never only in the ring's colour.
- **ELF's question types** contain English examples: those spans carry `lang="en"`. Root origins written in English in the data ("GERMANIC") are shown in Swedish ("germanskt").
- Search results announce their count ("5 träffar").

**Unmistakably Spår.**
- The catalogue as a stig with a flag at its end.
- The worked example as a four-stop path whose wrong turn wears the amber ↻.
- Roots set as Bricolage display type.
- Section tiles with reading rings, and "Nästa" as the one green pill.


### Screen 13 · Konto & inställningar (B3)

**Purpose.** Who is signed in, how HP-Coach looks and behaves, and the account's data. Today this is split over `/konto` ("Ditt konto.") and `/mer` ("Inställningar."), which do not link to each other, plus a dead-end `/avancerat`. On phone the only way in is the account menu on Home. Spår makes it **one page**: `/konto` opens it at its first part, "Konto", and `/mer` opens it at "Utseende", where the settings begin.

**The one action:** none. This is one of the two views without a green pill (§1.5). Every change applies at once. There is no "Spara".

**What it shows.**
- **Konto.** Initials, name and email ("Inloggad som"); the plan, verbatim ("Plan och betalning — Kommer när HP-Coach går från gratis dogfood till betald tjänst — inget att göra här ännu."; "dogfood" is English jargon, see open question 16); sign-in, verbatim ("Lösenord och tvåfaktor — Hanteras via din inloggningsleverantör. Logga ut och in igen för att byta metod."); "Logga ut". Today sign-out exists only in Home's menu.
- **Utseende.**
  - Tema: "Ljust · Mörkt · Som systemet".
  - **Lugnt läge**, now persistent, with its hint "Färre färger och siffror, inga studsar".
  - Today's palette choice (sand, sage, ink, rose, spalt) does not apply inside a direction, because the direction is the palette (open question 8).
- **Övning.**
  - "Urval: Smart · Slumpat" with the hints verbatim ("Frågor nära din nivå." / "Helt slumpade frågor.").
  - "Taktik före svar" (on or off; open question 12).
  - The coach voice (Kompis, Professor, Taktiker) has no visible effect today, so it is hidden until it does (open question 8).
- **Provet.**
  - The sitting you are aiming for and the days left. This is derived automatically today ("Höstprov 26 · söndag 18 oktober · 9 dagar kvar"); a chooser is open question 7.
  - Your goal on 0–2,0 (open question 1).
  - Your weekly goal in days (open question 6).
- **Data.** "Exportera min data" (a JSON backup), "Importera…" (replaces everything, with today's warning verbatim) and "Återställ diagnostik".
- **Hjälp och villkor.** "Hjälp & support", "Feedback" (flagged questions and explanations), "Integritetspolicy", "Användarvillkor".
- **Radera konto.** Today's flow, verbatim:
  - the warning "Allt raderas direkt — konto, försök, missar och resultat. Säkerhetskopior tunnas ut inom 30 dagar. Det går inte att ångra.";
  - "Exportera min data först →";
  - "Skriv radera för att bekräfta.";
  - "Radera kontot permanent".

**Layout — desktop (1440 × 900).**
```
┌──────┬────────────────────────────────────────────────────────────────────────────────────────────┐
│ rail │  Konto och inställningar                                                                   │
│      │  Ditt konto                                                                                │
│      │                                                                                            │
│ [◉]  │  På sidan        ╭ Konto ───────────────────────────────────────────────────────╮          │
│      │  Konto           │ (LB)  Inloggad som                                           │          │
│      │  Utseende        │       Lina Berg · lina@example.se                            │          │
│      │  Övning          │ Plan och betalning                                           │          │
│      │  Provet          │ Kommer när HP-Coach går från gratis dogfood till betald …    │          │
│      │  Data            │ Lösenord och tvåfaktor                                       │          │
│      │  Hjälp           │ Hanteras via din inloggningsleverantör. …                    │          │
│      │  Radera konto    │                                                  Logga ut    │          │
│      │                  ╰──────────────────────────────────────────────────────────────╯          │
│      │                  ╭ Utseende ────────────────────────────────────────────────────╮          │
│      │                  │ Tema                         ( Ljust │ Mörkt │ Som systemet ) │          │
│      │                  │ 🍃 Lugnt läge                                          [●━━]  │          │
│      │                  │    Färre färger och siffror, inga studsar                    │          │
│      │                  ╰──────────────────────────────────────────────────────────────╯          │
│      │                  ╭ Övning ──────────────────────────────────────────────────────╮          │
│      │                  │ Urval                                  ( Smart │ Slumpat )    │          │
│      │                  │    Frågor nära din nivå.                                     │          │
│      │                  │ Taktik före svar                                      [━━○]   │          │
│      │                  ╰──────────────────────────────────────────────────────────────╯          │
│      │                  ╭ Provet ──────────────────────────────────────────────────────╮          │
│      │                  │ Provtillfälle   Höstprov 26 · söndag 18 oktober · 9 dagar kvar│          │
│      │                  │ Ditt mål        2,0                             ( − ) ( + )   │          │
│      │                  │ Veckans mål     5 dagar                         ( − ) ( + )   │          │
│      │                  ╰──────────────────────────────────────────────────────────────╯          │
│      │                  … Data · Hjälp och villkor · Radera konto                                 │
└──────┴────────────────────────────────────────────────────────────────────────────────────────────┘
```
- The title is set like every destination page: the eyebrow "Konto och inställningar", the display title "Ditt konto".
- **The left index ("På sidan")** is a sticky list of the parts. It highlights the part in view, and choosing one scrolls there.
- **Each part** is a `--sp-card` with 28 px corners and a Bricolage `h2` heading. Its rows (`SparSettingRow`) are 56 px or taller: the label, an optional one-line hint in ink-3, and the control at the right:
  - a `sp-switch`, which turns green when on;
  - or a `SparSegmented`;
  - or a quiet stepper;
  - or a link.
- **No palette dots, no "Avancerat" detour.** Every real setting is on this page.
- **"Radera konto" is the last card**: a `--sp-bad` 2 px top line, with the warning as text. The type-to-confirm field ("radera") and "Radera kontot permanent" follow. That button is **the only red-filled button in the app**, and it is enabled only when the field reads "radera".
- **The rail's account button shows a pressed state** while this page is open. No destination is current.

**Layout — phone.**
```
┌──────────────────────────────────────┐
│ [◆] HP-Coach                     [◉] │ ← avatar pressed
│ Konto och inställningar              │
│ Ditt konto                           │
│ ( Konto │ Utseende │ Övning │ … ) ›  │ ← the index as a scrolling chip row
│ ╭ Konto ───────────────────────────╮ │
│ │ (LB) Inloggad som                │ │
│ │      Lina Berg                   │ │
│ │      lina@example.se             │ │
│ │ Plan och betalning …             │ │
│ │ [ Logga ut ]                     │ │
│ ╰──────────────────────────────────╯ │
│ ╭ Utseende ────────────────────────╮ │
│ │ Tema                             │ │
│ │ ( Ljust │ Mörkt │ Som systemet ) │ │
│ │ 🍃 Lugnt läge            [●━━]   │ │
│ ╰──────────────────────────────────╯ │
│ …                                    │
├──────────────────────────────────────┤
│ (⌁)Idag (▣)Öva (⌛) (💡) (⛰)         │
└──────────────────────────────────────┘
```
- The navbar stays (today `/konto` and `/mer` have no tab bar on phone).
- On phone, a segmented control wider than the card wraps under its label.

**The account menu** (built in round 1: the rail popover on desktop, the bottom sheet on phone) stays the quick way in:
- "Konto" and "Inställningar" become links to this page, at "Konto" and at "Utseende";
- "Mörkt läge" and "Lugnt läge" stay as switches in the menu;
- "Hjälp" goes to `/hjalp`;
- "Logga ut" signs out.

Its head shows the user's name and plan in place of round 1's placeholder ("Ditt konto · Gratisplan · inloggad"). If no name is known it shows the email, **never a sample name**. Today a nameless user is shown a hard-coded sample name and its initials.

**Components.**
- *Reused:* the frame and the account menu (`Account`, `MenuItem`, `MenuSwitch`), `.sp-switch`, `SparPageHead`, `SparSegmented` (B1), `SparDialog` (B2; here for the import), `.sp-link`, `.sp-btn`, and the persisted Lugnt läge setting (B1 builds the store; this page only adds its row).
- *New (B3):*
  - **`SparSettingRow`**: label, hint and control, laid out on the 4 px grid.
  - **`SparStepper`** for the goal and the weekly goal.
  - **`SparPageIndex`**: sticky on desktop, a chip row on phone.
  - **`SparDangerCard`**: the in-page delete flow, with no dialog.

**States.**

| State | What the page shows |
|---|---|
| Loading | Skeleton cards with real headings. Controls appear disabled until the stored value is known, so they never flash a wrong position. |
| Saving | Optimistic. The control moves at once, and a polite "Sparat" is announced. |
| Save failed | The control returns to its old value. The row shows "Det gick inte att spara. Försök igen". Today a failed save reverts silently. |
| Export | The button shows "Exporterar…" and keeps its width. On failure, verbatim: "Kunde inte exportera just nu. Försök igen om en stund." |
| Import | A `SparDialog` with today's text verbatim: "Detta ersätter all din nuvarande data", "Allt du har idag — pass, misstag, inställningar, provresultat — skrivs över med innehållet i filen. Det går inte att ångra.", "Ersätt min data →", "Avbryt". |
| Reset diagnostic | Two-step in place: "Återställ diagnostik" → "Säkert? Tryck igen". |
| Delete | Busy "Raderar…". On failure, verbatim: "Kunde inte radera kontot. Inget raderades — försök igen." On success, a full-page farewell ("Farväl", "Kontot är raderat.", "Allt är borta. Tack för att du testade HP-Coach.") that stays until the sign-out redirect, instead of a flash. |
| Signed out | Not reachable: redirect to sign-in, as today. |

**Navigation.**
- In: the account menu's "Konto" and "Inställningar" (desktop rail foot, phone app bar, on every destination page, not only Home); the command palette ("Inställningar"); `/integritet`'s "Konto → Exportera", which lands on Data.
- Out: the frame's navigation; "Logga ut" → sign-in.
- The URL keeps the part (`/konto`, `/mer`, `#data`), so a link can point at the right card.

**ADHD-PI.**
- Few settings, each explained in one line. Nothing is hidden behind "Avancerat".
- Lugnt läge is one switch, and it stays on once set: no re-deciding every session.
- No save step, so nothing can be lost by leaving.

**Accessibility.**
- The page index is a `nav` named "På sidan". The cards are `section`s with `h2`s.
- Switches use `role="switch"` with labels and hints wired by `aria-describedby`. Segmented controls are radio groups.
- The delete card is a labelled region. Its input is labelled "Skriv radera för att bekräfta". The armed button announces itself enabled.
- Focus returns to the control that opened a dialog when it closes.

**Unmistakably Spår.**
- Big-cornered cards with Bricolage headings.
- The green switch track (green means go, here "on").
- The leaf-marked Lugnt läge switch that the whole direction keys off.
- The sticky index that works like a path's contents.
- One red button, at the very end.


### Screen 14 · ELF-läsfråga (B3)

**Purpose.** English reading practice (Engelsk läsförståelse) in the same reading model as Läsfråga (screen 2): an English text, its questions and its Facit, while the interface around it stays Swedish. **The one action:** answer the question in view, "Svara ↵", then "Nästa fråga ↵".

**What it shows (real P5 content, the only ELF source the app serves).** ELF units come in three shapes, all with four options (A–D):

| Shape | Real example | What is on screen |
|---|---|---|
| **Short text, one question** | `elf-b19-003` "Counting Pots from the Pavement": one paragraph, a byline ("– Silas Ludderby, writing on the architecture of ordinary streets"), the question "What does the writer say about the pots on a single stack?" | The whole text fits above the tray, so the tray opens with its options showing. |
| **Long text, several questions** | Built the same way as the LÄS unit in round 1 | Exactly screen 2: the tray opens folded to the question. |
| **Gap-fill (lucktext)** | `elf-b18-002` "Left to Soak": four paragraphs and a byline, with five gaps written `___(1)___` … `___(5)___` in the text. Each gap is a question whose prompt is "Gap (n)" and whose options are single words (gap 1: price · charge · toll · cost, answer C) | Numbered gap slots inside the text. The tray shows the sentence that holds the current gap. |

Each question shows the text's title, its paragraphs and byline (English), the ÖVNINGSTEXT badge and the "Om texten" note (Swedish, approved copy verbatim), the question and four options (English), the count "Fråga n av N", the clock, and in Facit the explanation's fields, written in **English** for ELF (`solution_path`, steps with essential and detail tiers, why each distractor tempts and why it is wrong, `technique`, `pitfall`), plus the framework name in Swedish ("Slutsatsdragning / implikation").

**Layout — desktop (1440 × 900), a gap-fill unit, question 2.** The tray opens folded when the text needs the room; this text does.
```
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│ ✕ Avsluta          [ELF]  ✓━━②━━③━━④━━⑤   Fråga 2 av 5        🍃 Lugnt ○   ◎ Fokus   ⏱ 03:41 │
│                                                                                               │
│                 ╭─────────────────────────────────────────────────────────────╮               │
│                 │ (ÖVNINGSTEXT)                                  ⓘ Om texten  │ ← ELF band    │
│                 │ Left to Soak                                                │   h 190 tint  │
│                 ├─────────────────────────────────────────────────────────────┤   (dark: 4 px │
│                 │  ¶1  By four o’clock the office sink has acquired a         │    top line)  │
│                 │      saucepan, two plates, a mug and the lid of somebody’s  │               │
│                 │      lunchbox. … and deciding whose is a contest nobody     │               │
│                 │      admits to entering, though it quietly takes its        │               │
│                 │      ⟮✓ toll  ⟯ on the general mood.                         │               │
│                 │                                                             │               │
│                 │  ¶2  The first countermeasure is a notice. … The tone is    │               │
│                 │      light, but nobody misreads it; beneath the sponge the  │               │
│                 │      message is ⟮②········⟯, and it is aimed at certain     │ ← current gap │
│                 │      chairs. For a day or two the draining board gleams. …  │   2 px ink    │
│                 ░░░░░░░░░░░░░░░░░ text fades over 20 px under the tray ░░░░░░░               │
│                 ╭─────────────────────────────────────────────────────────────╮               │
│                 │ Lucka 2 av 5                                    Visa i texten│               │
│                 │ “…beneath the sponge the message is ⟮②········⟯, and it is   │ lang="en"     │
│                 │  aimed at certain chairs.”                                  │               │
│                 │ [   Visa alternativen (4)   ⌃   T   ]                       │               │
│                 ╰─────────────────────────────────────────────────────────────╯               │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```
Opened (T, or a letter key), the tray shows the four words in **one row** of option tiles, since they are single words, so the open tray stays under 30 % of the height:
```
                 ╭─────────────────────────────────────────────────────────────╮
                 │ Lucka 2 av 5                                    Visa i texten│
                 │ “…beneath the sponge the message is ⟮② pointed⟯, and it is   │ ← your pick is
                 │  aimed at certain chairs.”                              ⌄    │   tried in the
                 │ ╭───────────╮ ╭───────────╮ ╭───────────╮ ╔═══════════╗      │   gap, ink-2
                 │ │ (A) relaxed│ │(B) spirited│ │(C) amused │ ║◆D pointed ║      │   italic, dotted
                 │ ╰───────────╯ ╰───────────╯ ╰───────────╯ ╚═══════════╝      │
                 │ T döljer frågan · F fokus      Ditt val: D      [ Svara ↵ ]  │
                 ╰─────────────────────────────────────────────────────────────╯
```
A short text (one paragraph, one question) shows the card, then the open tray directly under it, with no fold. A long text is screen 2 with English content.

**Layout — phone (390 × 844).** As screen 2: the passage first, the question in a sheet attached to the bottom edge that peeks with the whole sentence, and the head that hides on scroll (leaving the 4 px line and the pinned exit).
```
┌──────────────────────────────────────┐
│ ✕ Avsluta  [ELF] ✓━②━③━④━⑤   ◎ 03:41 │
│ ╭──────────────────────────────────╮ │
│ │ (ÖVNINGSTEXT)        ⓘ Om texten │ │
│ │ Left to Soak                     │ │
│ │                                  │ │
│ │ ¶1 By four o’clock the office    │ │
│ │    sink has acquired a saucepan, │ │
│ │    … takes its ⟮✓ toll⟯ on the   │ │
│ │    general mood.                 │ │
│ │ ¶2 The first countermeasure is a │ │
│ │    notice. … the message is      │ │
│ │    ⟮②·······⟯, and it is aimed … │ │
│ ╭──────────────────────────────────╮ │
│ │               ━━━                │ │
│ │ Lucka 2 av 5                     │ │
│ │ “…beneath the sponge the message │ │
│ │  is ⟮②·······⟯, and it is aimed  │ │
│ │  at certain chairs.”             │ │
│ │ [  Visa alternativen (4)    ⌃  ] │ │
│ ╰──────────────────────────────────╯ │
└──────────────────────────────────────┘
```
Opened, the four words sit in a **2 × 2 grid** of 60 px tiles above "Svara". Facit opens at half height with the verdict, so the gap's sentence stays visible above it.

**Components.**
- *Reused as built:* the focus frame (`TopBar`, `Progress`, `Timer`, `CalmSwitch`, the Fokus toggle), `Reader` (band, strip, ¶ numbers, cited bar, flash, `sp-quote` marks, paragraph focus), `Tray`, `Options` (letter blob → tilted squircle; strike), `FeedbackSheet`, `Verdict`, `VerdictChip`, `FeedbackBody`, `Cites`, `Rich`, `Done`, `PhoneDrill`, and `useSheet`.
- *Reused from B1:* `SparStop` for the top bar, the tray's follow mode (for a one-paragraph text), the `row` option layout, `SparTacticHint`, and the Facit additions (the framework link, "Hjälpte förklaringen?").
  - The ELF hint text is English (e.g. "Skim-then-locate"), so the hint's body carries `lang="en"`.
  - Its label "Taktik" stays Swedish.
- *New:*
  - **`SparGap`**, the gap slot. An inline pill 1.35 em tall with `--sp-sunk` fill and a 1.5 px `--sp-sunk-2` inset. It holds a 20 px `SparStop` with the gap's number and, once there is one, a word. Its width is fixed to the widest option of that gap, measured in the passage's font, so a word appearing in it never reflows the paragraph ("nothing moves in the column").
  - **`SparGapSentence`**, the tray's prompt for a gap: the sentence that holds the gap (cut at the sentence's ends, with "…" where it continues), with the gap drawn as a `SparGap`. If the sentence cannot be cut cleanly, it falls back to the Swedish label "Lucka n" alone. The data's English prompt "Gap (n)" is never shown.
  - **`sparCites.ts`**, a Spår-local citation helper (in `c-spar/`, wrapping the shared kit, which stays untouched). It teaches the ¶ citations English:
    - pair English curly quotes “…” as well as Swedish ”…”;
    - read English ordinals ("the second paragraph");
    - remove a gap's own text before matching, so a quotation that contains the gap ("it quietly takes its ___ on the general mood") still finds its sentence.
- The word options use B1's `row` layout (§4: a row when every option is ≤ 14 characters rendered), which gives one row of four on desktop and a 2 × 2 grid on phone.

**The gap slot's states.**

| State | Look | Accessible text (inside the slot, `lang="sv"`; each English word inside it wrapped in `lang="en"`) |
|---|---|---|
| Not yet reached | number stop `todo`, empty | "lucka 3, inte besvarad än" |
| Current | number stop `now`; the slot gets the selected option's 2 px ink border | "lucka 2, aktuell" |
| Current, word chosen | the chosen word in ink-2 italic with a dotted underline: the pick is *tried in the sentence* before it is locked | "lucka 2, ditt val: pointed" |
| Graded right | ✓ stop (`--sp-ok`); the right word in ink | "lucka 1: toll, rätt" |
| Graded wrong | ↻ stop (amber); the **right** word in ink, so the text reads correctly for the gaps still to come. Your pick lives in Facit's "Ditt svar" card | "lucka 1: toll, ditt svar var cost, lagd i Repetera" |

**States.**
- **Loading:** the card's band and title as skeletons, then 3–4 paragraph skeletons at the 32 em measure, and the tray as a skeleton at its folded height.
- **Empty:** not reachable; Öva only starts ELF when units exist. If a unit fails to load: "Texten gick inte att hämta. Dina svar är sparade. Försök igen".
- **Partial:** resuming mid-unit (as on Idag) shows the earlier answers as ✓/↻ stops in the top bar, and filled gaps in a gap-fill text.
- **Feedback:** the shared order (verdict and the two answer cards → why your pick tempted and why it is wrong → "Att ta med dig" → "Lösningen" → "Steg för steg" → the other options). For a gap, the two answer cards show the gap's sentence with the word in place: "…takes its **cost** on…" (Ditt svar · D) and "…takes its **toll** on…" (Rätt svar · C).
- **Done:** screen 2's end: "Left to Soak är klar", "4 av 5 rätt", the stops, and the day's mini path with the next step as the green pill.

**Navigation.**
- In: Öva's ELF tile (`/drill?section=ELF&start=1`, one press); Idag's plan when an ELF step is due; Repetera (an ELF miss reopens its text at that question); an Uppslag ELF entry's "Öva denna frågetyp".
- Out: "Avsluta" (always visible; answers saved) returns to where it came from. The unit's end offers the plan's next step as the green pill, and "Tillbaka till Öva" (or "Tillbaka till mönstret") as the quiet way back.
- Keys as screen 2: A–D choose, ⇧ + letter strikes, ↵ answers and goes on, T folds the tray or sheet, F / J / K drive paragraph focus. In a gap-fill text, **G** scrolls the text to the current gap ("Visa i texten").

**ADHD-PI.**
- The gap's own sentence sits in the tray, so the eye does not shuttle between text and tray to remember the frame.
- The chosen word is tried in the gap before it is locked, which is the technique the explanations teach ("read the words around the gap as a pattern").
- A one-paragraph text opens with its options showing, so a short task stays one press long.
- Lugnt läge drops the ELF tint, the springs and the gap stops' colours; the words and the ✓/↻ glyphs stay.

**Accessibility.**
- `lang="en"` on the title, the paragraphs, the byline, the question, every option, the gap sentence and every English explanation block (`solution_path`, step titles and texts, why-tempting and why-wrong, technique, pitfall). Swedish headings ("Varför D lockade", "Att ta med dig") stay `lang="sv"`, so screen readers switch voices at the right words and English hyphenation applies to English text. Today the live drill sets `lang` nowhere, so every ELF text is read aloud as Swedish.
- English text keeps its own curly quotes “…”; it is never converted to Swedish ”…”.
- A gap slot is text, not a control. Its spoken state is a visually hidden Swedish phrase (`lang="sv"`, see the table). "Visa i texten" (G) is the control that moves to it.
- In a gap-fill text, the margin numbers read "¶1", "¶2"…, so paragraph numbers and gap numbers (the stops inside the slots) can never be confused. Their shapes differ too: a margin pill against an inline disc.

**Unmistakably Spår.**
- The ELF teal band (h 190) and the stig in the top bar, five stops for five gaps.
- Gap slots are the path's own stops, set inside the sentence.
- The letter blob morphs to an ink squircle when you choose, and the facit rises as an edge sheet with "Varför D lockade" first.
- Bricolage sets the English title at display size.


---

## 4. Component inventory for the three batches

New parts are `Spar…` components in `c-spar/`, styled in `spar.css` under `[data-rd='spar']`. No batch touches `:root`, `index.css`, the shared kit (`r1Kit.ts`, `r1Fixtures.ts`) or another direction's folder.

**Round 1's four screens.** They keep their layout, but they share components with round 2, so they pick up the shared B1 changes:
- `SparStop` in the top bar;
- the Facit additions;
- `Done`'s return action.

The `rd-*` contract tests must keep passing. B1 re-shoots screens 1–4 to show that nothing else moved. B2's one deliberate change to Idag is the "Prognosen i Framsteg →" link.

**B1 lays the foundation, so it builds the shared parts first and the screens second.**

| Batch | Builds | Used again by |
|---|---|---|
| **B1 — foundation** | **`SparStop` + `SparPath`** (§1.2). They replace the four local stop styles, run horizontal or vertical, and cover the states `todo`, `now`, `right`/`done`, `miss`, `answered`, `flagged`, `blank`, `goal` and `section`, with the variants: ring hue, glyph + word, outline | everything |
| | **`SparPageHead`** (lifted from `.sp-home-head`), the phone title cross-fade, the phone back link in the app bar, and the tokens `--sp-col-wide`, `--sp-page`, `--sp-math` | 5, 8, 9, 10, 11, 12, 13 |
| | **`SparStation`** (generalised `.sp-now`: any `data-sec` including REP, an optional path, a foot with one green pill and one quiet action) | 5, 9, 12 |
| | **`SparSectionTile` / `SparSectionRow`**, **`SparDisclosureCard`** (the container transform of §1.9), **`SparSegmented`** | 8, 9, 11, 12, 13 |
| | **`SparSkeleton`** (the loading pattern of §1.11: sunk shapes in the final layout), **`SparAnswerBar`** (the phone's sticky "Ditt val · Svara" under a short problem) | everything / 14 |
| | **The persisted Lugnt läge**: one setting behind the switches on Idag, in the desktop top bar and in the account menu, so every batch's calm delta has a source. Screen 13 only adds its row | every screen |
| **B1 — screens** | Öva (5); Repetera's queue, its schedule `VerdictChip` and the REP chip (8) | — |
| | **`SparProblemCard`**, **`SparFigure`**, **`SparFigureViewer`** (zoom, pan, rotate, answer strip), **`SparPageCard`** (DTK page on a mat, fit, stable per page) | 6, 7, 9, 10, 11 |
| | **`SparKvaPair` / `SparKvaOption`**, **`SparNogStatements` / `SparNogGlyph`**, the `MathText` wrapper | 9, 10, 11 (in exam and review) |
| | **`Options` layouts:** `row` when every option is ≤ 14 characters rendered, and `images`. Letter keys are validated against the item's options. The tray gets its **follow** mode (open, sticky, under a short problem) | 9, 14 |
| | **`SparTacticHint`** (folded `pregrade_tactic`) | 14 |
| | **Facit additions:** the "Visa uppgiften" / "Visa figuren" chip, DTK's 40 % sheet, the framework line as a link, "Hjälpte förklaringen?" (Ja / Nej, then "Tack"), and the page-grouped `Progress`. Folding the detail steps is already built in round 1 | 8, 10, 14 |
| **B2** | **`SparDialog`** (centred on desktop, edge sheet on phone; focus trap, Esc): abort, hand-in, the phone's start | 10, 13 |
| | **`SparRouteRibbon`** (legs, position tick, fill), **`SparPassStop`** (seen-share ring), **`SparClock`** (count-down, inverse thresholds, announcements) | 12 (the ring) |
| | **`SparSwitchback`** (answered mode, verdict mode, filter, compact). **Exam mode** on the question layouts (`data-exam`): no hint, verdict or facit, and Lugnt läge enforced. The ⚑ marking (open question 5) | — |
| | **`SparScoreCard`**, **`SparLegRow`**, **`SparReview`** (a question's graded screen, read-only: its text, problem or page, Facit with working ¶ citations, the viewer's verdict strip, previous / next) | 11 (pass pages) |
| | **`SparClimb`** (with its table), **`SparSectionLine`**, **`SparScaleMini`**, **`SparWeeks`**, **`SparHistoryPath`**, the pass page (`/historik?pass=<id>`), and Idag's "Prognosen i Framsteg →" link | — |
| **B3** | **`SparContents`** (+ phone sheet), **`SparEntryCard`** (trap, protocol, root), **`SparWorkedExample`**, **`SparCallout`**, **`SparSearch`** | — |
| | **`SparSettingRow`**, **`SparStepper`**, **`SparPageIndex`**, **`SparDangerCard`**, and the Lugnt läge row on the settings page | — |
| | **`SparGap`**, **`SparGapSentence`**, and **`sparCites.ts`** (Spår-local English citations: “…” quotes, English ordinals, gap-aware matching; the shared kit stays untouched) | — |

**Done checklist, for every screen in every batch.**
1. One green pill, except for the three views listed in §1.5, and it is the next step. On phone it is visible at 390 × 844 without scrolling.
2. Every sequence on the screen is a stig of `SparStop`s.
3. At most one tinted band in view, and no section hue behind text.
4. Every state in the screen's table is built, with its copy. Loading never shows empty-state copy.
5. The Lugnt läge delta from the screen's table works, and reduced motion moves nothing.
6. ≥ 44 px targets; 2 px focus rings with a 2 px offset; the focus order follows the visual order; modal layers trap and return focus, and the tray and Facit never trap it (§1.8).
7. Never colour alone: a glyph and a word for every state.
8. `lang="en"` on every English block.
9. Light and dark at 1440 × 900 and 390 × 844, with body text ≥ 7:1 and UI ≥ 4.5:1.
10. WCAG 1.4.12 text spacing applied without clipping.
11. Swedish typography: real dashes, ”…” in Swedish copy, tabular numbers, and "1 fråga" / "2 frågor".

## 5. Open questions for the owner

Each question names the screens it affects. Where the spec had to choose, the default it uses is stated. Questions with visual character (6, 10, 12, 14) are not meant to be settled from this text: the batches build the default so you can react to it on screen, as with the bake-offs.

1. **The goal line: 2,0, 1,8 or yours?** Live Framsteg draws a hard-coded "mål 1,8". Spår's Idag measures against 2,0, your stated target. *Default here:* a goal you set in Konto & inställningar, starting at 2,0. (11, 13)
2. **How precise is the prognosis?** Live Framsteg shows two decimals ("1,41"); Spår's Idag shows one with a range ("≈ 1,4", 1,25–1,55). One decimal with the band is more honest about the noise. *Default:* one decimal, "≈", and the band everywhere. (11, Idag)
3. **Can the view model expose the spacing schedule?** Repetera's strongest moment is showing the real step: "Flyttad fram · tillbaka om 4 dagar", "Inlärd · lämnar kön", "Tillbaka om en stund". It also wants each miss's age ("missad i fredags"). The schedule exists on the server but no screen shows it today. *Default:* without it, the chip says "Rätt. Den flyttas fram." and the queue shows sections only. (8)
4. **Data the redesign needs that the app does not hand out yet.**
   - Per-question picks for a Provpass result, so its review can show each Facit (today the result keeps only ids).
   - Provpass results and their time in Historik.
   - Paging and lookup by id: older practice passes and Provpass results page by page (older than a given pass, saying whether more exist); one Provpass result by its id; and a practice pass's kind, section and times by its id (its questions and picks can already be read by its id, as the `?done=<id>` page does). Today both lists return only their newest 50, and a result is found only by searching that list.
   - A description for each figure and DTK page, for alt text.
   - The sitting's name on authentic questions.
   *Default:* each is drawn as specified, with its stated fallback. (6, 7, 9, 10, 11)
5. **Mark questions in a Provpass?** The paper test lets you mark a question and come back. The live runner has no marks. Spår adds ⚑ "Markera" and a "Markerade" filter in the overview. It is local to the pass and costs nothing in the data. *Default:* included. (9)
6. **Replace the streak with a weekly goal?** Live Framsteg counts "aktuell serie" with a record. Spår's language has no streak to lose ("4 av 5 dagar den här veckan", missed days never drawn). This needs a weekly-goal setting. *Default:* the weekly goal, 5 days, in Konto & inställningar. (11, 13)
7. **Choose your sitting?** The exam date is derived automatically today (e.g. "vårprov 27"). Spår shows it in Konto & inställningar. Should it be choosable there, e.g. for someone skipping a sitting? *Default:* shown, not choosable. (13)
8. **Palette and coach voice inside a direction.** The live palettes (sand, sage, ink, rose, spalt) don't apply when the direction is the palette, and the coach voice has no visible effect today. *Default:* both hidden in Spår until they mean something. (13)
9. **The trap offer on Öva.** The adaptive review ("Tre missar på samma fälla senaste veckan — 5 min riktad repetition först?") only appears on a drill's intro screen, which Öva's one-press start skips. Spår gives it a quiet home on Öva. *Default:* included, never as the green pill. (5)
10. **A lesson as one entry at a time.** Today a catalogue is one long scroll of collapsed cards. Spår reads one entry at a time on a contents path, marks an entry read when you press "Nästa" (with Ångra), and adds search over the 221 entries. *Default:* all three. (12)
11. **Where a round ends up.** Live drills always end on Home ("Stäng" → `/`). Spår ends with the plan's next step as the green pill and "Tillbaka till Öva" / "Tillbaka till mönstret" as the quiet way back to where you started. *Default:* that. (5, 6, 7, 12, 14)
12. **The tactic hint before you answer.** Live drills show "Taktik · …" under every question. For a reader who loses focus easily it is either a help or one more thing on screen. *Default:* folded ("Taktik ⌄"), off in Lugnt läge and never in a Provpass, plus a setting "Taktik före svar". (6, 7, 13, 14)
13. **The ÖVNINGSTEXT note on a text's first open.** Round 1 kept the authorship note behind "Om texten", because its fixture resumes mid-text. *Default:* expanded on the first question of a text you have never opened, folded after that. (2, 14)
14. **The playful titles.** Spår names pages like a trail guide: "Dagens stig", "Alla delprov", "Hela sträckan", "Klättringen", "Mönster att känna igen". The nav labels stay plain (Idag, Öva, Provpass, Uppslag, Framsteg). Keep the trail voice, or use the plain names as titles too? *Default:* the trail voice for display titles only, with the eyebrow always the plain nav name. (5, 9, 11, 12, Idag)
15. **A verbal "Riktigt pass" after the P5 switch.** Amendment 1 of `docs/p5-infold-design.md` says LÄS and ELF in Provpass come from P5 only. The live hub still assembles real printed passes, LÄS and ELF included. Spår marks every P5 text in a pass with ÖVNINGSTEXT and puts the calibration caveat on the result. Whether a verbal pass with P5 legs may still be called "riktigt", and normed against its sitting's table, is a product decision rather than a design one. (9, 10)
16. **"Gratis dogfood" in the plan copy.** Konto's plan line is today's copy verbatim: "Kommer när HP-Coach går från gratis dogfood till betald tjänst — inget att göra här ännu." "Dogfood" is English jargon in Swedish UI. *Default:* kept verbatim until you say otherwise. A plainer option: "Kommer när HP-Coach går från gratis testversion till betald tjänst." (13)

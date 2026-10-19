---
bead: "hpf-qr0p.3"
project: "hpfetcher"
session: "ci-wisp-4xyssfq"
status: "implemented_uncommitted"
---

# Worklog — hpf-qr0p.3

Redesign round 1b, direction **E · Svep — "Ett kort i taget"** (one card at a time), on the live bake-off route `/dev/redesign-2026-bakeoff` (`?d=e`). It is one of four new directions built in parallel after the owner asked for "as many options as possible" (decision 2026-10-19). It is built to the shared round-1 brief (`docs/redesign/2026-10-round1-brief.md`) and contract: the four screens at both widths and in both themes.

## Snapshot and boundaries

- **Claim.** `gc hook --claim --json` returned `hpf-qr0p.3` (assignee `ci-wisp-4xyssfq`, route `hpfetcher/gc.implementation-worker`). `bd show hpf-qr0p.3 --json` matched the id, the status (`in_progress`), the assignee and `gc.routed_to`.
- **Checkout.** Branch `codex/hpf-qr0p.3-redesign-round-1b-direction-e-svep-one-card-at-a-time`. HEAD is `99085f74aaf8d971b47991aa01a2ecfca6ab8bec` (= `gc.worktree_base_sha`; the enabler hpf-qr0p.2 is merged). No tracked file was modified at the start. The untracked root dotfiles (`.bash_profile`, `.bashrc`, `.gitconfig`, `.gitmodules`, `.idea`, `.mcp.json`, `.profile`, `.ripgreprc`, `.vscode`, `.zprofile`, `.zshrc`) belong to the sandbox and were not touched.
- **Upstream moved during the lane.** `origin/main` is now `cd0fd9ad9208444d4eebdc46735fd0c16038d5da`: G Raster, H Ljuskägla and unrelated PRs were merged. A read-only check shows they changed only their own folders (`g-raster/`, `h-ljuskagla/`). Nothing in `e-svep/` or in any shared file changed, so this work merges without overlap. I did not rebase, because the bead asks for uncommitted changes.
- **Constraints kept.**
  - Writes stayed inside the write set: `app/src/components/devbake/redesign/e-svep/*.{ts,tsx,css}` and this worklog.
  - No git writes and no dependency changes.
  - No edits to the kit (`r1Kit.ts`, `r1Fixtures.ts`), the registry, the page, `app/index.html`, `index.css` or another direction.
  - All CSS is scoped under `.sv-root`. Nothing is on `:root`, and keyframes are prefixed `sv-`.
  - Network: 127.0.0.1 only, for the harness.
- **Check script.** `gc.check_path` is `/home/loucmane/gascity/home/cache/repos/954ed14987da288bfb98feee4cdab5043a44de1a8a9cf47afaaa0ce6e438fd5f/gascity/assets/scripts/checks/build-artifact-valid.sh`, sha256 `71f17450e127055c8304a3cb44ce87b2439abe04ba41f225c7b386be3dc73911`. The bead names no validator, so I did not run it.

## Deliverables (uncommitted)

All paths are under `app/src/components/devbake/redesign/e-svep/` unless shown in full.

| Path | What |
|---|---|
| `Svep.tsx` | The stage. It replaces the stub and keeps the same `Svep` export. It covers fonts, scoping and the routing of the four screens; the desktop top bar of the five doors and its folded "hand"; the phone tab bar; the account card with its phone scrim; and the stub doors. |
| `SvepHome.tsx` | Idag: the seven-card deck, the day column, the deck's index, and the cards' bodies. |
| `SvepDrill.tsx` | Läsfråga and Facit: the text card, the question card and its turn, the five-card facit run, the phone question card, and the end of a unit. |
| `deck.ts` | `useDeck`: the deck's state, swipe and flick handling, and card positions. |
| `parts.tsx` | The deck stage, the counter with arrows, the index as small cards and dots, the unit's questions as cards, and the keycap. |
| `svep.css` | The design system: light and dark tokens, five table tints, card material, deck, frame, Idag, drill, phone sheet, motion, reduced motion, and a size container for narrow and short stages. |
| `meta.ts` | The registry entry, rewritten in Swedish (no longer `stub`). |
| `Svep.test.tsx` | 45 tests: the shared contract at both widths; every screen × width × theme; and Svep's own deck, run, keys, Space rule, phone card, account card and end of unit. |
| `docs/worklog/hpf-qr0p.3.md` | This worklog. |

## What Svep is, screen by screen

**The idea.** One thing on screen at a time. The app is a deck of cards on a table. The card in front is always the next thing to do, so there is no choice to make about where to look; this is built for ADHD-PI choice paralysis.

- **Cards** are real stock: a fine paper grain, a soft warm light from the top left, a lit top edge, and a little thickness along the foot.
- **The table** is quiet and matte, with a felt grain. It takes the tint of the section on the card in front: LÄS slate, ELF sea-grey, ORD sand, Repetition lilac, everything else warm stone. The tint fades over 360 ms.
- **One strong accent**, a raspberry magenta (`oklch(50% 0.2 352)`). It appears only on the next action (the filled button) and on the current position (the card in front in the index, the question you stopped at, the current door). Everything else is ink: selection, links, chips and data. Evidence in the text uses an ochre highlighter.
- **Type.** Schibsted Grotesk for interface and display (heavy, tight newspaper-grotesk headlines). Source Serif 4 with optical sizing for passages, the quoted question and the verdict's answer text.
- **Dark.** Warm charcoal cards on the section's tint at low light, with ink a step under white.

**1 · Idag.** A deck of seven cards in two groups. *Att göra* is Fortsätt, Repetition, ELF-lektion and ORD-övning. *Läget* is Prognos, Fälla and Senaste passen.

- **Fortsätt** (the top card):
  - "Fortsätt: LÄS · fråga 3 av 4" above the unit's title, which is the largest type on the page; the subtitle is in the serif.
  - The unit's questions as a small hand of cards. The answered ones lie face down (no verdicts on Idag), the one you stopped at stands up with a magenta rim, and the last waits.
  - "Där du slutade", with the waiting question itself in the text's face.
  - The screen's one filled button: "Fortsätt läsa ↵".
  - "Pausad idag 07:52 på telefonen · ca 6 min kvar" in the card's top row.
- **The plan cards** each carry one small figure: Repetition's eight misses as a fan of cards, ORD's ten questions as marks. Their actions are ink, never filled.
- **Prognos:**
  - "1,4*" large.
  - Beside it, seven weeks of estimates as honest bars on the full 0–2,0 scale ("Sju veckor · 1,1 → 1,4").
  - "+0,1 sedan förra veckan · Verbal 1,5 · Kvant 1,3".
  - A 0–2,0 scale with the likely range "Troligt 1,25–1,55" hatched.
  - The calibration caveat, verbatim, under an asterisk.
- **Fälla:** "Rätt valens, fel objekt", the question type, "3 gånger · ↑ ökar" (ink, not alarm red), "Två fällor till väntar i Framsteg" and a real action, "Öva på fällan".
- **Senaste passen:** three rows with score bars, then the forgiving week ("Fyra av fem dagar den här veckan"; no streak to lose).
- **Desktop.**
  - The deck sits centred, with the next two cards fanned out about 30 and 57 px to its right.
  - The day stands to the left: date, "God eftermiddag.", "Fyra saker idag, ungefär 25 minuter. Börja med kortet överst." and the countdown "9 dagar kvar till högskoleprovet, söndag 18 oktober".
  - The deck's small index stands to the right: numbered rows; the card in front is a small magenta card; minutes or a figure on each row.
  - Under the deck: "‹ 1 / 7 Fortsätt ›" with visible arrows, and a key hint.
- **Phone.**
  - The greeting and countdown at the top.
  - The deck, its edges stacked below it like Wallet.
  - "1 / 7 Fortsätt", then the index as a row of small cards for the to-dos and dots after a gap for Läget (44 px targets; the card in front stands up in magenta).
  - The tab bar.

**2 · Läsfråga.** The drill hides the navigation. A flat "× Avsluta" stays visible top left. Progress is the unit's questions as small cards, plus the clock.

- **Desktop:** a pair of cards.
  - The text is a tall card that scrolls. It carries LÄS · ÖVNINGSTEXT · Om texten · Styckefokus, the title, and nine paragraphs with ¶ numbers in the margin. Lines run about 65 characters, with Swedish hyphenation and a fade where text passes under the card's edges.
  - The question is a deck-sized card beside it, with the unit's waiting question as a card edge behind it.
  - Options are slips of the same stock (a hairline and a little thickness at the foot). The chosen slip lifts with an ink rim and an inked key. A struck slip lies flat and crossed out, still at 7:1 or better.
  - "Svara A ↵" (filled) names the choice. Key hints sit under the card.
- **Phone:**
  - The text card fills the screen. The question card peeks from below with its label, the whole prompt and a quiet "Till frågan ↑" in its head; a swipe up on its grab also works.
  - Raising the card never moves the text, so the reading position is kept. The text dims behind it.
  - "Till texten ⌄", a tap on the dimmed text, or a swipe down lowers the card.

**3 · Facit.** Answering turns the question card over: two half-turns in perspective, 2 × 130 ms. The foot fades in once the back has come round.

- **The back is set like a card's face**, on stock faintly tinted with the section, so even a still frame shows the turn:
  - "✕ Fel. Rätt svar är D." — a glyph and a word, never colour alone;
  - the right answer's letter as the card's large rank, with its text in the serif;
  - "Du valde A" and your answer under one thin red rule.
  - A miss shows exactly two red marks: the ring and the rule.
- **The explanation is a short run of five cards in the shared order**, one idea each:
  1. Utfallet (the verdict side).
  2. Därför lockade A — why it tempted, why it is wrong.
  3. Att ta med dig — the pitfall, then the technique and the question type to look up in Uppslag.
  4. Lösningen — the solution path, then the steps. The detail-tier step sits behind "Visa fördjupningen"; ¶ links are included.
  5. De andra alternativen, folded.
- **After a miss, the lesson leads.** The verdict side's one filled button is "Varför lockade A? →". "Nästa fråga ↵" stays visible but quiet until you move on, then it fills. On the last question it reads "Slutför texten".
- **The text leans on the card in front.** The evidence the steps quote is underlined in ochre. The sentence that answers your pick is dashed ink. The card in front lays the highlighter over what it leans on: Därför lockade over the lure's answer, Lösningen over the evidence. On desktop the text turns to that evidence as you move through the run. A ¶ link scrolls to the exact sentence and marks it.
- **Moving.** "‹ 1 / 5 Utfallet ›" moves the run: ←/→, a swipe, the arrows, or on phone the index of small cards.
- **Phone.** The facit lies on the table as cards. "Till texten ⌄" lowers it to a peek ("✕ Fel. Rätt svar är D." and "Till facit ↑") and opens the text at the cited evidence, marked for a moment rather than at ¶1. A ¶ link does the same.
- **The unit's end.**
  - "Hela leken är vänd.", with the unit's four answers as a hand of cards fanned face up (✓/✕ and your letter on each).
  - "Magasinet i Hökaryd · 4 frågor · 2 rätt · 9 min" and "Missarna läggs i nästa repetition, de äldsta först."
  - The day's next card as the one action: "Nästa kort: Repetition · 9 min ↵".

**4 · Navigering.**

- **Desktop.**
  - A slim top bar with the five doors laid straight on the table; the current door is a small card lying there.
  - The HP-Coach mark is three fanned cards, the front one magenta.
  - Folded (⌘B / Ctrl+B or the button), the doors become a **hand of five small cards** with their icons, fanned. The current one is raised with a magenta edge, and hover or focus names each. The wordmark stays, and the doors stay visible, as the IA requires.
  - The account is a round button that deals the **account card**: Konto, Inställningar, Tema (Ljust · Mörkt · System), Hjälp, Logga ut.
- **Phone.** The tab bar is a strip of card stock; the current door's icon lies on a small raised card. The account card drops from the avatar over a dimmed deck. A tap on the dim, Esc or "Stäng" puts it back.

**The other doors** (Öva, Provpass, Uppslag, Framsteg) are one card each on their own tinted table, saying round 2 builds them. Navigation and the account work from there.

## How it differs from A–D (and the other round-1b directions)

- **Composition.** A–D lay the whole day out at once: Folio as a front page, Instrument as a command list, Spår as a vertical path, Lager as two floating sheets. Svep shows one card and keeps the rest behind it, with the overview moved into a counter and an index.
  - On the drill, A and B are two-page or two-panel splits, C is a single column with a tray, and D is staggered floating sheets. Svep is a pair of cards of different heights, with the question deck's edges visible.
  - Its feedback is a card that turns over plus a run of cards you page through, not a scrolling panel or sheet.
- **Material.** Cards with grain, inner light, a lit rim and stock thickness, on a matte felt table. Not paper with rules (A), a grey chassis (B), flat squircles (C) or glass over a gradient field (D).
- **Colour.** Raspberry magenta, only for the next action and the current position, on a table whose quiet tint changes with the card in front. A is ink-blue, B signal orange, C green with eight hues, and D lagoon and apricot. G Raster (now merged) is signal yellow, and H Ljuskägla a dark teal-blue.
- **Signature details.**
  - The unit as a hand of cards: face down on Idag, face up at the end.
  - The answer's letter as the rank on the turned card's face.
  - The stacked edges, and the deck index with its dots for Läget.
  - The folded nav as a hand of door cards.
  - "Hela leken är vänd."
- **The closest call I see.** H Ljuskägla also leads Idag with one lit card, but in a dark room with the rest in shadow. Svep's day is a deck you move through, on a light tinted table.

## Interaction, keys and accessibility

- **Idag.**
  - ←/→ move the deck. **At either end of the deck, ←/→ are not taken**, so they fall through to the bake-off's screen keys; in the app they would do nothing.
  - Home/End jump.
  - Enter opens the card in front: Fortsätt opens the drill, a plan card its door, the trap card Öva.
  - A horizontal swipe or flick moves the deck. A vertical drag is left to the page, and a drag never ends in a click.
- **Drill.**
  - a–d choose; on phone this also raises the question card. Shift+letter strikes.
  - Enter and Space answer once a choice is made, then deal the next question. Space keeps its own meaning in two places: inside the text or a facit card it scrolls, and on a focused control it presses it.
  - J/K move the paragraph focus, and F toggles it.
  - **Esc never leaves the drill**; it only releases the paragraph focus.
  - In Facit, ←/→ move through the run and hand over to the switcher at the run's ends. Digits are left to the switcher.
- **Accessibility.**
  - The cards behind the front one are `inert`, like the hidden slides of a WAI-ARIA carousel. A card that leaves the front hands the focus to the new front card.
  - The deck is a labelled region ("kortlek"). Each card is a "kort" named "n av N: name", and the counter is a polite live region.
  - The text card is a labelled, focusable scroll region.
  - The ¶ numbers are out of the tab order; F, J and K drive the same aid.
  - Struck options stay at 7:1 or better.
  - **Reduced motion is a crossfade, as specified.** The app's global guard in `index.css` zeroes every duration with `!important`, so Svep's opacity-only fades are `!important` too (and more specific); nothing travels. Still thumbnails (`live=false`) never move.

## Self-check

**Method.**

- **Harness.** A scratch harness outside the repo, in `$SCRATCHPAD/harness/` (`run.mjs`, `sum.mjs`, `probe-edge.mjs`, `probe-pair.mjs`, `main.tsx`, `index.html`). It starts Vite's `createServer` on 127.0.0.1 with an entry that mounts only `Redesign2026Bakeoff` under the app's own `index.css`, so Tailwind preflight and the global reduced-motion guard apply as in the app. It then drives Playwright Chromium:
  - desktop 1440 × 900 at 1×;
  - phone 390 × 844 at 2×;
  - also 1280 × 800 and 1024 × 768;
  - URLs of the form `?d=e&s=…&w=…&t=…&bare=1`.
- **Probes on every page:**
  - overflow;
  - visible things outside the viewport;
  - clipped text;
  - overlapping text blocks inside a card (clip-aware);
  - control hit areas (`elementFromPoint` 21 px out on four sides);
  - body-text contrast from computed colours;
  - axe-core (WCAG 2.0/2.1 A/AA);
  - console and page errors;
  - the longest declared motion.
- **Further passes:**
  - the WCAG 1.4.12 text-spacing overrides on screens 1–3 at both widths;
  - a 26-Tab keyboard walk on screens 1–3 at both widths;
  - reduced-motion passes;
  - frozen motion frames, with every running animation paused at a set time through the Web Animations API;
  - side-by-side shots;
  - shots of A–D for comparison.
- **Fonts.** Google Fonts are unreachable offline, so every shot shows fallback faces (Liberation Sans and a Charter-like serif). I judged hierarchy, spacing, colour and composition, not letterforms.

**Rounds** (shots in `$SCRATCHPAD/shots/r1` … `r7` and `final/`):

1. **r1 — first build.** The concept read at once. Fixes:
   - The verdict card was too red (a pink band, a red word, a red ring, red boxes) → the band went and the word became ink.
   - The evidence wash in the text was heavy by default → underline only until a card leans on it.
   - The desktop question card was the full column height and looked empty → it became a deck-sized card (664 px) with the foot under it.
   - The duplicated "Fråga 3 av 4" → once, in the card.
   - On phone, the peek showed a sliver of the next content → the transform accounts for the 8 px inset.
   - On phone, the chosen option's rim was clipped → 4 px of room.
   - Struck text at 5.9:1 → ink-2 (≥ 9:1).
   - "Till Idag" was off-centre on the end card.
   - The ¶ numbers' and the grab's targets → 44 px.
   - Also: the prognosis got a seven-week bar chart (the old tick marks were cryptic); the resume card gained the unit as a hand of cards; one-idea cards are centred; option slips became stock, not grey wells; dark mode moved one step lighter.
2. **r2–r3 — motion and polish.** The frozen frames confirmed the card turn (70 and 200 ms) and the deal.
   - A deck move read as a double exposure → the leaving card now loses its face at once, and the new face prints in late.
   - The trap's "ökar" chip lost its alarm red.
   - On phone, the account card cut into the greeting → it moved down, and a dim now sits behind it.
3. **r4–r5 — text spacing.** The 1.4.12 overrides made the Idag card's content overlap (subtitle over progress, hand over button), a real fault → home cards now scroll inside when their content outgrows them, and the action stays pinned to the card's foot.
   - The end card and stub wrappers scroll too.
   - The probe gained a clip-aware overlap check, which then passed on all six spacing pages.
4. **r6–r7 — sizes.** At 1024 px the Facit foot (counter plus Nästa) widened the grid column and pushed the run off the edge, a real fault → the column can no longer grow past its track, and the narrow foot drops the card name.
   - At 1280 × 800 the index was truncated and the peeking edges touched it, and the resume card ran under its action → Svep's root became a size container, with width breakpoints at 1320 and 1120 px of stage and a height breakpoint at 820 px.
   - The app's global reduced-motion guard was overriding the specified crossfade → see Accessibility above.
5. **Independent second reader.** A fresh agent saw only the brief and the r6 shots of E and A–D.
   - **Verdict, verbatim:** "the strongest concept so far on phone, but on desktop and at the verdict it slips back to the shared template". It also said "'One card at a time' reads instantly on phone Idag, only faintly in the desktop drill, and not at all on the face of the verdict card."
   - **Keepers named:** the progress fan with the answered cards face down; the done card; phone Idag (one card, the button within thumb reach, a real stack); the card turning over as the answer moment; the links between the text and the explanation; the section-tinted table.
   - **Changed, in its order:**
     1. A typographic verdict face. The answer's letter is a large rank with its text in the serif, your pick sits under one thin red rule, there are no tinted boxes, and the back is tinted stock.
     2. After a miss, the lesson is the filled action and Nästa waits, quiet.
     3. The run went from seven cards to five, in the same order (pitfall + technique as "Att ta med dig", solution + steps as "Lösningen").
     4. Magenta is now only the next action and the current position. Selection, links, chips and data are ink, and evidence is an ochre highlighter.
     5. Dark mode: warm charcoal cards on the section's tint, with a quieter cross-hatch.
     6. The phone peek has a quiet "Till frågan" in its head instead of a filled bar, and "Till texten" from Facit opens at the cited evidence.
     7. The resume card no longer repeats its progress: the LÄS chip and the extra progress line are gone, and the minutes moved to the top row.
     8. The trap card got "Öva på fällan". Senaste passen lost its hole. The index uses numbers instead of checkbox-like squares; on phone, Läget shows as dots after a gap.
     9. The next cards peek further on desktop.
     10. A flat "× Avsluta".
     11. The folded bar keeps the wordmark.
     12. The Facit foot fades in after the turn, and the waiting edges stay during it.
     13. The rim no longer has a notch at the pinned foot.
   - **Not taken, because the bead requires them:**
     - "Delete the index" — the bead asks for "a small deck index" and "deck index and counter always visible". It is kept, made quieter and numbered.
     - "Set the question card 40 px lower" — that is Lager's signature stagger.
     - "Overlap the question card onto the text card" — it would cover the text's scrollbar.
   - Per round 1's stopping rule, no further reader was run. The owner's side-by-side look is the real test.

## Verification

| Check | Result |
|---|---|
| `pnpm typecheck` (from `app/`) | clean |
| `pnpm lint` (`biome check src`) | 0 errors, 0 warnings. 4 infos, all pre-existing (`LandingBakeoffR3/R4A/R4C.tsx`, `l12/M3.tsx`); none are in this change. |
| `pnpm test` | 93 files, **1133 passed**. Svep's own file has 45; the bake-off's shared suite passes too, including `?d=e` mounting Svep's stage and the eight-up side by side. |
| `vite build --outDir $SCRATCHPAD/dist` | Builds. Svep is its own lazy chunk (`Svep-*.js` 48.0 kB, `Svep-*.css` 59.4 kB). Relative colours and `safe center` survive minification; no `:root` rule. The route-file and >500 kB warnings were there before. |
| Screens (16: 4 × 2 widths × 2 themes) plus interaction extras, frozen motion frames and sizes | No overflow, clipping, outside-viewport content, overlap, axe findings or console/page errors on the final code (`final/`). |
| Body-text contrast (bar ≥ 7:1) | Lowest 8.47:1: the day sentence on the dark table. Drill text (passage, prompt, options) ≥ 11.85:1 dark and ≥ 16.18:1 light; Facit text ≥ 12.21:1. |
| UI contrast (AA) | axe colour-contrast clean on every page. One regression was caught and fixed in the final sweep: the new filled "Varför lockade A?" inherited an old link colour (3.13:1). |
| Text spacing (WCAG 1.4.12), screens 1–3 × 2 widths | No overflow, clipping or overlap. The Idag card scrolls inside under the overrides, and its action stays pinned. |
| Focus walk | Every stop has a visible 2 px ring, and the order is logical. Desktop Idag: the doors → fold → account → Fortsätt läsa → ‹ › → index. Drill: Avsluta → the text → Om texten → Styckefokus → the options and strikes. Facit: Avsluta → the text → … → Varför lockade A? → ‹ › → Nästa fråga. Phone: Avsluta → Styckefokus → the text → Om texten → Till frågan. |
| Motion | Card moves 240 ms, exits 200 ms, the turn 2 × 130 ms, the end card's fan 420 ms with a stagger. Reduced motion: opacity-only crossfades of 180 ms; nothing travels. |
| Hit areas under 44 px, kept on purpose | The ¶ margin numbers on phone (out of the tab order, and the 42 px margin leaves no room); the inline "(steg N)" links (WCAG 2.5.8's inline exception); a ¶ chip at a scroll edge, where the probe point falls outside the scroller. |

## Notes for the owner

- **Four options, not five.** As in round 1, every P5 LÄS unit has four options, so all screens and keys use A–D. The brief says "A–E"; the key map takes whatever letters the question has.
- **Fonts in the shots** are fallbacks (see Self-check). Live, Schibsted Grotesk and Source Serif 4 load on first mount through `useWebFonts`.
- **The right-hand light strip** in every shot, Svep's and A's alike, is the app-wide `html { scrollbar-gutter: stable }` in `index.css`. The bake-off's fixed page cannot cover that gutter. It is not Svep's and was left alone (outside the write set).
- **Deliberate calls the owner can react to:**
  - ←/→ belong to the deck while it can move, and to the bake-off's screen keys at its ends.
  - A five-card facit run (pitfall + technique and solution + steps share a card each, in the same order).
  - Magenta only for the next action and the current position.
  - Space advances like Enter, except inside the text or a facit card.
  - The table's tint follows the card in front.
  - The folded desktop nav as a fanned hand of door cards.
- **Stubs.** Only Idag and the drill are built. Öva, Provpass, Uppslag and Framsteg are one-card stubs. The end card's "Nästa kort: Repetition" and the plan and trap cards open those doors.
- **Not touched:** real routes, stores, loaders, the worker, data, the kit, the registry, other directions, `index.css` and `app/index.html`. No bake-off was deleted.

## Beads hand-off

- The bead asks for the changes to stay uncommitted and the bead to stay open (not closed), and for one one-line note ending `SVEP1 DONE: hpf-qr0p.3`.
- Written: `/home/loucmane/gascity/bin/bd update hpf-qr0p.3 --append-notes "…"` (one line), succeeded on the first attempt. Read back with `bd show hpf-qr0p.3`: the note is present, the status is still `in_progress`, and no metadata was changed.
- **HANDOFF.** Nothing is pending on this bead. The session was recycled afterwards at 86% context, as the runtime asked. A fresh session that claims `hpf-qr0p.3` again should treat it as done: the work is in this worktree (uncommitted, inside the write set) and the bead waits open for the coordinator, by its own instruction. The scratch harness and shots live in this session's scratchpad (`$SCRATCHPAD/harness/`, `$SCRATCHPAD/shots/final/`) and may not survive the reset. Re-run `harness/run.mjs` if the shots are needed again.

SVEP1 DONE: hpf-qr0p.3

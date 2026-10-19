---
bead: "hpf-qr0p.4"
project: "hpfetcher"
session: "ci-wisp-zwcxfxg"
status: "implemented_uncommitted"
---

# Worklog — hpf-qr0p.4 · Direction F · Samtal

Round 1b of the whole-app redesign bake-off (`/dev/redesign-2026-bakeoff`, epic hpf-qr0p). This is one of four new directions, built on the same screens, kit and fixtures as round 1.

F · Samtal — "En lugn coach i dialog": the app speaks to you like a calm tutor. Every screen is a short exchange with reply buttons, never free typing. The coach proposes, you choose.

## Snapshot and boundaries

- **Claim.** `gc hook --claim --json` returned `hpf-qr0p.4` (assignee `ci-wisp-zwcxfxg`, route `hpfetcher/gc.implementation-worker`). `bd show hpf-qr0p.4 --json` matched the id, the status (`in_progress`), the assignee and `gc.routed_to`.
- **Checkout.** Branch `codex/hpf-qr0p.4-redesign-round-1b-direction-f-samtal-calm-coach-dialogue` at `99085f74aaf8d971b47991aa01a2ecfca6ab8bec` (= `gc.worktree_base_sha`), clean at the start. `origin/main` has since moved to `7ba2482f6cc4f60ab0d7499b3bbefb72dbabb840` (other lanes); nothing here depends on that.
- **Write set kept.** Only the ten admitted paths were touched: the nine files in `app/src/components/devbake/redesign/f-samtal/` and this worklog. No shared file was edited: not `r1Kit.ts`, `r1Fixtures.ts`, `directions.ts`, the bake-off page or its tests, `app/index.html`, `index.css`, and nothing on `:root`. `git status` shows `Samtal.tsx` and `meta.ts` modified and the seven new folder files untracked, plus this worklog.
- **Other constraints.** No git writes; everything is uncommitted. No dependency changes.
  - **Network:** only the local Vite server on 127.0.0.1. The harness aborted the Google Fonts requests, so every shot shows fallback faces.
  - **Untracked dotfiles:** the root `.bash_profile`, `.bashrc`, `.gitconfig`, `.gitmodules`, `.idea`, `.mcp.json`, `.profile`, `.ripgreprc`, `.vscode`, `.zprofile` and `.zshrc` are the sandbox's mount-point placeholders. They were not touched and are not part of this change.
- **Check script.** `gc.check_path` is `…/gascity/assets/scripts/checks/build-artifact-valid.sh`, sha256 `71f17450e127055c8304a3cb44ce87b2439abe04ba41f225c7b386be3dc73911`. The bead names no validator, so it was not run.

## Deliverables (uncommitted)

| Path | What |
|---|---|
| `f-samtal/meta.ts` | The registry entry, rewritten in Swedish: name, tagline, five traits, the risk and its answer, references. `stub` is dropped. |
| `f-samtal/Samtal.tsx` | The stage. It injects Hanken Grotesk + Lora with `useWebFonts`, scopes everything under `[data-rd='samtal']` and routes screens 1/4 to the frame and 2/3 to the drill. |
| `f-samtal/SamtalNav.tsx` | The frame: the desktop list of conversations (expanded) and its rail (folded), the account card, the phone top bar, bottom bar and account sheet, and the round-2 stub pages. |
| `f-samtal/SamtalHome.tsx` | Idag. |
| `f-samtal/SamtalDrill.tsx` | Läsfråga and Facit: the document, the question turn, the reply options, the action bar, the phone reply tray, keys and focus. |
| `f-samtal/SamtalFeedback.tsx` | Your answer, the verdict, the coach's question about your pick, the notes, the steps, the other options and the unit's end. |
| `f-samtal/SamtalParts.tsx` | Shared speech marks: `Coach`, `You`, `Replies`, `Divider`, `Cites`, `Rich`, `Dots`, `DoorIcon`, `Kbd`, `Mark`. |
| `f-samtal/samtal.css` | The design system: OKLCH tokens (light and dark), type, space, radii and motion, with every rule scoped and `sa-`-prefixed. |
| `f-samtal/Samtal.test.tsx` | 57 tests (see Verification). |
| `docs/worklog/hpf-qr0p.4.md` | This worklog. |

## The design system

- **Speech, then notes.** Every screen is built from a few marks:
  - **The coach's turns** sit on a faint oat tint, left, with a small "speaker" corner at top left. Consecutive turns sit close, as one voice.
  - **Your turns** are a plum tint with a plum hairline, right, with the speaker corner at top right.
  - **Reply chips** stand where your next turn will go, as plum outlines.
  - **Solid plum is kept for the screen's one action** (Fortsätt, Svara, Nästa, "Ja, repetition").
  - **Cards** are white attachments with a hairline and a small head.
  - **The coach's notes** (the walk-through after a wrong answer) are untinted text under a hairline.
  - **Dated dividers** open a conversation, as in a messages thread.
  - There are no avatars, typing dots, bubble tails or gradients.
- **Type.** Hanken Grotesk for the interface. Lora for the passage, the paused text's title and the closing's title.
  - Nine sizes, 12–32 px.
  - `tabular-nums` on scores, clocks and counts.
  - `text-wrap: balance` on headings and `pretty` on prose.
  - Swedish hyphenation (`lang="sv"`, `hyphenate-limit-chars: 7 3 3`).
  - `&nbsp;` keeps numbers with their nouns ("9 dagar", "fråga 3 av 4").
- **Colour (OKLCH).**
  - **Light:** a soft neutral page with a whisper of plum (97.4 % L), oat coach turns (94.6 % L, C 0.018, h 78) and a warm white document (99.4 %). Your tint is 94 % L, C 0.024, h 340; the action fill is plum (43.5 % L, C 0.13). The coach points into the text with honey.
  - **Dark:** an aubergine charcoal page (19.5 % L, never black) and warm-grey coach turns one step above it (26.4 % L, C 0.009). Your tint is a dark plum (30.5 %). The action fill is a step lighter (50.5 % L), so the one action outweighs every outline. The coach points with a plum tint. Ink sits a step under white (91.5 %).
  - **Semantics:** green and red belong to the verdict only, always with a glyph and a word. On a wrong answer red appears once, in the verdict's ring.
- **Shape.** Radii: `r1` 10 px (inner pieces), `r2` 18 px (cards, options, the document), `r3` 24 px (turns), and pills. The speaker corner is `r0`, 6 px. Nested radius = outer − inset: the paused text inside the lead turn has a 10 px radius in a 24 px turn with a 14 px inset.
- **Motion.** One ease-out family:
  - Turns, cards and options fade in over 120 ms with a 4 px rise. Exits take 90 ms; the phone tray takes 200 ms.
  - Nothing blocks input.
  - Under `prefers-reduced-motion` every duration is 1 ms. Side-by-side thumbnails (`live=false`) have no motion.
  - The thread and the tray fade at their scroll edges, so nothing is cut in half.
- **Scope.** Every token and rule lives under `[data-rd='samtal']` with the `sa-` prefix. Nothing touches `:root`, `index.css` or `app/index.html`. The fonts load through `useWebFonts('f-samtal', …)` on first mount.

## What was built, per screen

### 1 · Idag

- **The opening.** A dated divider ("Fredag 9 oktober") opens the conversation. Then comes **one coach turn**, the width of the column:
  - the greeting, with the countdown said aloud: "God eftermiddag. **9 dagar** kvar till högskoleprovet.";
  - the screen's largest type, the question: "Du var mitt i LÄS, fråga 3 av 4. Fortsätta?" ("fråga 3 av 4" never breaks);
  - the paused text, **attached like a document in a message**: a file glyph, the title in Lora, the italic subtitle, progress dots, "ca 6 min kvar" and "Pausad idag 07:52 på telefonen".
- **Two replies,** right-aligned:
  - **Fortsätt ↵** is the only filled control (`rd-resume`, also on Enter). On phone it is full width.
  - **Visa dagens plan.** Choosing it makes it **your turn**, and the coach answers with the plan in full, each part with its reason. The replies then become "Fortsätt med texten ↵" and "Börja med repetition". At most three turns ever stand before the replies.
- **Below a quiet "Resten av dagen" divider,** the rest of the day comes as compact **message cards** in one column:
  - the plan (numbered rows, Repetition tagged "Härnäst", minutes, "14 minuter idag · fyra av fem dagar den här veckan");
  - the prognosis (1,4* av 2,0, +0,1, Verbal/Kvant, and a 0–2,0 scale where the score is a tick on the likely range, not a handle), with **the caveat as a footnote turn** under it (verbatim `ESTIMATE_CAVEAT`);
  - the one trap that matters now (Författarens hållning · ”Rätt valens, fel objekt” · 3 gånger ↑);
  - the recent passes, **said as one line** ("ORD 9/10 igår · Repetition 7/8 igår · NOG 4/6 onsdag").

### 2 · Läsfråga

- **Desktop.** Focus mode keeps only a slim strip: **Avsluta** on the left, and the progress dots, "Fråga 3 av 4" and the clock on the right.
- **The passage** is a calm, opaque document panel on the left:
  - a hairline border and a sticky head (LÄS · ÖVNINGSTEXT badge, "Om texten", "Styckefokus"); text passing under the head fades over 20 px;
  - the note on demand (verbatim `OVNINGSTEXT_NOTE`);
  - the Lora title and subtitle;
  - nine paragraphs at 19 px / 1.62 with the ¶ numbers in the margin, about 60 characters a line (35 rem);
  - the byline.
- **On the right, the question arrives as a coach turn** ("Fråga 3" over the prompt).
  - **The four options are replies in your lane.** They are shaped like your turns (speaker corner at top right), with a part-plum outline, the letter in a plum ring and **the strike control inside each card**.
  - **Choosing one** gives it your tint, a solid plum line and a filled letter. A struck option goes dashed and crossed out, with an undo.
- **The action bar** follows the options on one flat line — no field, nothing to type into:
  - "A–D väljer · ⇧+bokstav stryker · F styckefokus", then "Ditt svar: (A) · ↵ svarar", with **Svara ↵** disabled until a choice;
  - it sticks to the column's foot over a fade only once the thread outgrows the column;
  - the options and the bar share one right edge.
- **Phone.**
  - The passage comes first, edge to edge. The head (✕ Avsluta · Fråga 3 av 4 · ¶ · clock) folds to the exit and a progress line while you read.
  - The question is a **reply tray docked to the bottom.** It peeks with the coach's question and one reply, "Välj ett svar ⌃". It opens over the passage without moving it, keeping the scroll position.
  - Open, it shows the question at 18 px, the options full width with the strike inside each (three lines each, not five), and the action bar at the tray's foot.
  - "Visa texten ⌄" folds it back. The grab handle drags and taps but stays out of the tab order.
- **Keys.**
  - A–D choose and ⇧ + letter strikes.
  - Enter answers and moves on. Space moves on once answered; while you read, it still scrolls.
  - J, K and F drive the paragraph focus.
  - Esc only lets go of the paragraph focus and never leaves the drill.
  - Digits are left to the switcher.

### 3 · Facit — the shared order, as a dialogue, then notes

- **Your choice** stands as your turn: plum tint, labelled "Ditt svar" inside, the letter filled.
- **The dialogue:**
  1. **The verdict.** A ringed ✕ and "**Fel.** Rätt svar är D.", then the right option quoted with a green rule and "✓ Rätt svar".
  2. **One real, optional question: "Vad lockade dig med A?"** It has three reply chips — "Orden liknade texten", "Det lät rimligt", "Jag chansade" — and "Hoppa över".
     - A reply becomes your turn; skipping leaves no trace.
     - It never blocks: the coach's own answer is already there below it.
  3. **"Det som lockar med A"** (the why_tempting) and **"Men därför är A fel"** (the why_wrong), both in `rd-distractor-A` with their ¶ links.
- **The notes** follow under a "Genomgång" hairline as untinted text:
  1. **Se upp för** (the pitfall);
  2. **Nästa gång** (the technique);
  3. **Så hittar du D** (the solution);
  4. **Steg för steg**: five steps with oat discs; the detail tier waits behind a reply chip, **"Berätta mer"**;
  5. **De andra alternativen**: B and C folded, each opened with "Varför lockar B?";
  6. a system line naming the framework.
- **The action bar** holds the one way on, **Nästa fråga ↵** ("Slutför texten" on the last question), and an outlined **"Visa allt"** that opens every fold at once ("Visa mindre" closes them).
- **The coach points into the text.**
  - On arrival the document turns to the evidence (¶6), and the steps' verbatim quotations are lit (honey in light, plum in dark). The quotation that says why A is wrong is underlined in dotted red.
  - Cited ¶ numbers take the coach's tint.
  - Hovering or focusing a part lights its own quotations and turns its ¶ numbers plum.
  - A ¶ chip ("I texten ¶6") scrolls to the paragraph and lights the quoted sentence for 2.4 s.
- **Phone.**
  - The tray goes full for the answer, and the passage under it is inert.
  - A ¶ chip folds the tray to its peek (the compact verdict and "Tillbaka till förklaringen ⌃") so the cited paragraph shows.
  - Phones have no pointing, because touch has no hover.
- **The unit's end** is anchored low, as a conversation's newest turns are.
  - The coach sums up: "Klart. 4 frågor, 2 rätt.", a ✓/✕ tally per question, then "De två missarna lägger jag i nästa repetition. Det tog 9 minuter."
  - It proposes the plan's next part. The replies are "Till Idag" and, on the thumb side, the filled "Ja, repetition · 9 min ↵" (`rd-done-next`, which opens Öva). No confetti.

### 4 · Navigering

- **Desktop, expanded (on Idag).** The five doors are **a list of conversations**. Each has a round icon, its name and one line about what waits there:
  - "Fortsätt LÄS, fråga 3 av 4";
  - "23 missar att repetera", with a quiet plum dot;
  - "Ett helt pass, 55 minuter";
  - "Lektioner och ramverk";
  - "Prognos 1,4 av 2,0".

  The current door is a lifted white row with a plum icon. The logo is two speech marks, the coach's oat and your plum. Below the list sits the account ("Ditt konto · Inställningar och tema").
- **Desktop, folded (Navigering; ⌘B/Ctrl+B; `rd-collapse`).** A rail of 44 px round doors. The current door's icon is filled plum, Öva keeps its dot, and the names show as dark tooltips on hover and focus. The account card opens beside the rail: a head, plain rows, **the theme chosen with reply chips** (Ljust · Mörkt · System; `rd-theme-toggle` on Mörkt), then Hjälp and Logga ut.
- **Phone.** A slim top bar holds the logo and the account button (`rd-account`). The bottom bar of five doors marks the current one with a plum icon, its word in bold and a short plum bar from the top edge (no filled pill). The account opens as a sheet that **floats above the bottom bar**, which stays in view and is inert while the sheet is open.
- **Stubs.** Öva, Provpass, Uppslag and Framsteg are round-2 stubs: a coach turn that says so, and the reply "Tillbaka till Idag".

## Distinct from A–D, and from a chatbot

| | Folio | Instrument | Spår | Lager | **Samtal** |
|---|---|---|---|---|---|
| Metaphor | a book | a cockpit | a path | layers of sheets | **a conversation** |
| Idag | a front page with marginalia | a command list | the day as a vertical path | sheets on a gradient field | **one question with two replies; the rest as message cards and one spoken line** |
| Navigation | a contents list / thumb index | a chassis sidebar | an M3 rail | a floating glass dock | **a list of conversations with previews / a rail of round doors** |
| Drill | a book spread | two inset panels | one column + tray | staggered floating sheets | **a document beside a thread; the options are replies in your lane; a flat action bar** |
| Feedback | footnotes | an answer panel | a sheet | a third sheet | **a short dialogue (with one real, optional question), then the coach's notes, pointing into the text** |
| Colour | cream + ink-blue | grey + orange | pastels + green | peach field + lagoon | **soft neutral + oat + plum** |

- **Not a chatbot.** There is no text field anywhere, and nothing looks like a composer: the action bar is a flat status line with a button. There are no avatars, typing indicators or AI sparkle, and no delivery receipts (your answer's label sits inside your turn). The coach speaks briefly and in the "du" form, and nothing waits on the reader.
- **Plum (h 340)** is a hue no other direction uses (Folio 258, Instrument 46, Spår 155, Lager 214), and it keeps clear of both verdict hues.

## Process and critique log

Built in one lane, screen by screen, on the shared kit:
- the hooks: `useDrill`, `useSheet`, `useHideOnScroll`, `useKeyMap`, `useWebFonts`, `useDismiss`;
- the ¶ helpers `citeParagraphs` and `findQuotes`;
- the fixtures.

Every round was shot with the harness below — all screens at both widths and in both themes, plus interaction states — and corrected from the shots.

- **v1 → v2** (`shots-v1/`, 16 shots):
  - The probes found the rail's tooltips anchored to the stage root instead of their button, so the root overflowed by 101–117 px. → `.sa-tip { position: relative }`.
  - The lead turn read as a card plus buttons. → Narrowed to the coach's lane (later widened again; see v4 → v5).
  - The countdown sat in the dated divider and wrapped on phone. → The coach now says it in the greeting.
  - The oat tint read as beige. → Lighter and calmer. Dark's olive-brown turns became cocoa (later a warm grey).
  - The passage measure was computed in the wrong em (about 52 characters). → 35 rem, about 60 in Lora.
  - Four plum outlines shouted. → Part-plum lines.
  - Text under the document head was cut. → A 20 px fade.
  - Progress dots in dark were plum on near-black (2:1). → `--sa-plum-ink`.
  - The phone account sheet hid the bar. → It floats above the bar.
  - Phone replies stacked unevenly. → Fixed.
- **v2 → v3** (`shots-v2/`, 58 shots including interactions):
  - The scrolled Idag showed a lopsided two-column dashboard, round 1's "widget demo" failure. → The cards stack.
  - The exam date made the phone greeting three lines. → Dropped.
  - The plan turn's primary number vanished into the turn. → Fixed.
  - "Ditt svar" titled the tray before any answer. → Removed.
  - The desktop closing hugged the top. → Fixed.
- **v3 → v4:**
  - "4 / frågor" broke across lines. → `&nbsp;`.
  - The Öva dot collided with the active tab. → Fixed.
  - The stub repeated its name. → Fixed.
  - On touch, a tapped ¶ link left its turn "pointed at". → No pointing on phone.
  - The contrast script found three failures: `--sa-line-2` in both themes, and dark ink on the strongest mark. → Fixed, now 3.19 / 3.45 and 7.65:1.
  - In dark, the deep-berry primary barely outweighed the outlined replies. → A separate, lighter action fill, `--sa-plum-fill`.
  - Hard clipping at the edges of the scrolling thread and tray. → Edge fades.
- **Second reader** (a fresh agent that saw only the v4 shots, the brief and round 1's criticisms).
  - **Verdict:** "warm, careful work, but it looks like a generic chat UI, not a 2026 top-tier product — the ChatGPT/Claude.ai shell on desktop, iMessage/Intercom on phone… The drill and Facit are a quiz with a chat skin."
  - **Keepers:** the reply-then-answer exchange on Idag and at the unit's end; the sidebar rows with live state; the coach's voice; the ¶ pointing; the struck option and the ring-plus-word verdict.
  - **Distinctness:** Facit was "unmistakable", but the desktop drill was "Instrument's layout at thumbnail size", and phone Idag's nearest neighbour was Spår.
  - **v5–v7 applied its fixes in its order, inside the brief:**
    1. **Plum meant three things.** → Solid plum only for the one action. Your turns and the chosen option take a plum tint, and the chosen option gets a solid plum line and a filled letter.
    2. **The dock looked like a text field.** → It is now a flat action bar of status plus button. "Visa allt" is an outlined chip.
    3. **Facit was a monologue on a wall of oat, Socratic only in its headings.** →
       - Bubbles remain only for the verdict and the why-pair.
       - The coach now asks one real, optional question, "Vad lockade dig med A?", with reply chips and "Hoppa över". It never blocks.
       - Pitfall, technique, solution, steps and the other options are untinted coach notes under a hairline.
    4. **The desktop drill's column was misaligned, with a 190 px dead band.** → One right edge, the strike control inside each card, and the action bar following the options (sticky only on overflow).
    5. **The phone tray squeezed the options to 4–5 lines.** → Full width, strike inside, the question at 18 px.
    6. **Idag's right edges were ragged.** → The coach's content and cards span the column; only your turns are offset.
    7. **Hard clipping.** → Edge fades, and the action bar carries its own.
    8. **Dark mode muddied.** → Warm-grey coach turns one step above the page, plum-tinted evidence marks, a dark tooltip and a visible uncertainty band.
    9. **Idag below the fold was four equal white cards, and the score dot looked draggable.** → The recent passes are a spoken line, and the score is a tick.
    10. **The unit's end looked unfinished at the top of an empty page.** → Anchored low, with the action on the thumb side.
    11. **The phone headline broke "3 / av 4", and the outlined reply out-sized Fortsätt.** → Non-breaking spaces; Fortsätt full width on phone, the other reply below it.
    12. **Copy.** → "Så hittar du D" (the du voice), a constant "Om texten", "Välj ett svar" in both places, and the rail's current door as a filled icon instead of a focus-like ring.
  - **Taken in part.** The prognosis and trap stay compact message cards, because the bead asks for them. The phone tab bar's filled marker became a plum icon plus a plum bar, to move away from Spår.
- **v7** is the final sweep (below). Polish found on the way:
  - The new notes reused the ÖVNINGSTEXT note's class and drew boxes. → Renamed to `sa-notes-item`.
  - The tray's question size lost on specificity. → Fixed.
  - The chosen tint read pink. → Less chroma.
  - The ask chips wrapped "Hoppa över" onto its own line. → Compact chips.

## Verification

**Harness** (scratchpad, outside the repo: `…/scratchpad/harness/shoot.mjs`, `main.tsx`, `contrast.mjs`, `config.json`):
- Vite's `createServer` runs on `app/` with an inline config (React and Tailwind only; no router plugin, so `routeTree.gen.ts` is never touched). It binds to 127.0.0.1 with HMR and file watching off, and the dep cache stays in the scratchpad.
- The entry mounts only `Redesign2026Bakeoff` with the selection from the URL (`?d=f&s=…&w=…&t=…&bare=1`).
- Playwright Chromium shoots desktop at 1440 × 900 and phone at 390 × 844 at device scale 2, with Google Fonts aborted.
- The probes on every page:
  - root and document overflow;
  - text outside the viewport;
  - clipped text;
  - hit areas below 44 px, with `elementFromPoint` 21 px out;
  - axe-core (WCAG 2.0/2.1/2.2 A and AA, scoped to the direction);
  - console errors.
- Extra modes:
  - a keyboard focus walk (each stop and its ring);
  - the longest declared transition/animation under both `prefers-reduced-motion` values;
  - the WCAG 1.4.12 text-spacing overrides on screens 1–3 at both widths;
  - side by side with the other seven directions.

**Final sweep — `shots-v7/`** (77 entries in `report.json`: 16 screens, 46 interactions, 6 text-spacing pages, 7 focus walks and 2 motion runs, plus 9 side-by-side PNGs):

| Check | Result |
|---|---|
| 16 screen shots (4 screens × 2 widths × 2 themes) | 0 overflow, 0 outside, 0 clipped, 0 axe violations, 0 console errors |
| 46 interaction shots | All clean. Covered: plan reply, Idag scrolled, note open, option chosen + struck, the coach's question answered, ¶ cite followed, Visa allt, scrolled Facit with a step pointed at, unit end, expanded/hovered nav, phone tray open, phone reading |
| Text spacing, WCAG 1.4.12 (6 pages) | 0 overflow, clipping or axe findings |
| Motion, longest declared | 120 ms, and 1 ms under `prefers-reduced-motion` |
| Focus walk (7 screens) | Every stop has a 2 px solid ring with a 2 px offset. Logical orders: Idag nav → account → Fortsätt → Visa dagens plan → plan rows → links. Drill: Avsluta → Om texten → Styckefokus → each option then its strike. Facit: the coach's question chips → ¶ links → Berätta mer → other options → Visa allt → Nästa. Phone Facit: the passage under the full tray is out of the tab order. |
| Body-text contrast, token pairs (`contrast.mjs`) | 35/35 pairs pass in light and 35/35 in dark. Body text ≥ 10.6:1 (your turn, dark) and up to 16.7:1 (passage, light). Passage on the document: 16.7 light, 13.3 dark. Action labels: 8.2 light, 5.9 dark. State lines ≥ 3.19:1. |
| Side by side (`sbs-*`) | Samtal reads as its own thing at thumbnail size: a conversation column, a list of door conversations, plum replies. On the drill it is a coach bubble with right-aligned reply options, unlike Instrument's boxed options and Lager's well. |

**Hit areas below 44 px**, kept on purpose (all at least 24 px, as WCAG 2.5.8 allows):
- the ¶ margin numbers, which are out of the tab order (J/K/F drive the same aid);
- the phone tray's grab, which labelled buttons cover;
- the ¶ cite chips (40 × 30 drawn, with a 46 × 44 hit area);
- "Berätta mer" and "Varför lockar …" (32 px drawn, with a 44 px hit area).

**Tests and build** (from `app/`, on the final tree):
- `pnpm typecheck` (`tsc -b --noEmit`): clean.
- `pnpm lint` (`biome check src`): 0 errors and 0 warnings. The 4 infos are pre-existing, in `LandingBakeoffR3/R4A/R4C.tsx` and `l12/M3.tsx`, not in this change.
- `pnpm test` (`vitest run`): 93 files, **1145 tests passed**. `f-samtal/Samtal.test.tsx` is 57 of them:
  - every screen × theme × width renders live and as a still, with no console errors;
  - the shared contract (the same assertions as `Redesign2026Bakeoff.test.tsx`) at both widths;
  - Samtal's own behaviour:
    - Enter on Idag;
    - the plan as a reply;
    - a door and its way back;
    - the question turn and options;
    - A–D / ⇧ / Enter / Esc;
    - the content order;
    - the coach's question (reply and skip);
    - "Visa allt" open and closed;
    - ¶ links lighting the quoted sentence and letting go;
    - Nästa;
    - the unit's end and its next part;
    - Avsluta;
    - the theme;
    - the folded rail's names;
    - the door previews;
    - the phone tray peek/open/fold and full Facit with an inert passage.

  The shared suite's registry and stage tests also pass with F built. The stub test now skips F, because `meta.stub` is gone.
- **Fonts.** The sandbox has no route to Google Fonts (aborted in the harness), so every shot shows fallback faces: DejaVu/Ubuntu-style sans for Hanken Grotesk, and a Times-like serif for Lora. Live, `useWebFonts` injects Hanken Grotesk (300–800, italic) and Lora (400–700, italic) on first mount.

## Notes for the owner and round 2

- **Four options, not five.** As in round 1, the brief says A–E, but every P5 LÄS unit has four options, so all screens and keys use A–D.
- **The coach's question after a wrong answer** ("Vad lockade dig med A?") is the one real exchange in the drill. In the bake-off a reply only becomes your turn. In the app it could tag the miss for Repetera. It never blocks, and "Hoppa över" removes it.
- **Deliberate risks to react to:**
  - **The chat metaphor itself.** The second reader still saw a family resemblance to chat products. What separates Samtal:
    - no field anywhere;
    - plum for you, solid only for the action;
    - notes instead of a wall of bubbles;
    - the coach pointing into the passage;
    - doors as conversations with live previews.
  - **The desktop passage panel.** A bordered white document beside the thread is the least distinctive element at thumbnail size. The right-hand dialogue carries the difference.
  - **Idag is anchored on one question.** Prognosis, trap and recent passes sit below the fold on desktop, by design ("never more than three turns before the action").
- **Stubs.** Only Idag and the drill are built. Öva, Provpass, Uppslag and Framsteg say so in a coach turn, and the navigation and account work from them. "Ja, repetition" at a unit's end opens the Öva stub.
- **Not touched:** real routes, stores, loaders, the worker, data, other directions' folders, the shared kit, fixtures and page. No bake-off was deleted.

## Beads hand-off

- Planned write: one note, `bd update hpf-qr0p.4 --append-notes "…SAMTAL1 DONE: hpf-qr0p.4"`. The bead is **not** closed and no metadata is set, as the bead's delivery section asks.

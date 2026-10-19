# Worklog — hpf-qr0p.21

Redesign round 2, batch 1 for direction **E · Svep — "Ett kort i taget"**. This batch builds screens 5 Öva, 6 Kvantfråga, 7 DTK and 8 Repetera. It also moves Svep's screens 1–4 onto kit v2 (`useDirectionData()` and `useDrillCore()`), so the direction can later run on real data. The look and behaviour of screens 1–4 had to stay the same.

The work follows these documents:

- the brief in the bead;
- `docs/redesign/kit-v2.md`;
- the direction's merged round-2 spec, `docs/redesign/directions/e-svep.md` (B0, hpf-qr0p.37);
- the round-1 brief.

## Snapshot and boundaries

- **Claim.** `gc hook --claim --json` returned `hpf-qr0p.21` (assignee `ci-wisp-yykomkp`, route `hpfetcher/gc.implementation-worker`). `bd show hpf-qr0p.21 --json` matched:
  - the id;
  - the status (`in_progress`);
  - the assignee;
  - `gc.routed_to`.
- **Checkout.** The branch is `codex/hpf-qr0p.21-redesign-round-2-direction-e-svep-batch-1-va-kvantfr-ga-dtk-`. HEAD is `5953117d354c54c3b1174f61c2fe8ff3302b9aaf` (= `gc.worktree_base_sha`), with kit v2 merged.
  - No tracked file was modified at the start.
  - The untracked root dotfiles belong to the sandbox and were not touched: `.bash_profile`, `.bashrc`, `.gitconfig`, `.gitmodules`, `.idea`, `.mcp.json`, `.profile`, `.ripgreprc`, `.vscode`, `.zprofile`, `.zshrc`.
  - The same kind of stubs (`/dev/null` character devices) appeared under `app/` (`app/.claude/…`, `app/.mcp.json`) while commands ran from `app/`. They are the sandbox's mount points, not part of this change, and were left alone.
- **Constraints kept.**
  - Writes stayed inside the bead's write set. `deck.ts` needed no change.
  - No git writes and no dependency changes.
  - No edits to the shared kit:
    - `viewModel.ts`, `directionData.tsx`, `drillCore.ts`, `contract.ts`;
    - `r1Kit.ts`, `r1Fixtures.ts`, `r2Fixtures.ts`;
    - the registry and the page;
    - the spec, `index.css`, `app/index.html`;
    - any other direction.
  - All CSS is scoped under `.sv-root`. Nothing is on `:root`, and keyframes are still prefixed `sv-`.
  - Network: 127.0.0.1 only, for the harness. Google Fonts requests were aborted, so fallback faces are used.
- **Check script.** `gc.check_path` is `/home/loucmane/gascity/home/cache/repos/954ed14987da288bfb98feee4cdab5043a44de1a8a9cf47afaaa0ce6e438fd5f/gascity/assets/scripts/checks/build-artifact-valid.sh`, with sha256 `71f17450e127055c8304a3cb44ce87b2439abe04ba41f225c7b386be3dc73911`. The bead names no validator to run, so it was not run.

## Deliverables (uncommitted)

All paths are under `app/src/components/devbake/redesign/e-svep/` unless shown in full.

| Path | What |
|---|---|
| `Svep.tsx` | The root and the frame. Routes screens 1–8. The frame's page (Idag, Öva, Repetera, a later door) follows the switcher's screen. The doors and Idag's cards ask through `actions` and open their page at once. The account card reads `konto.identity` and asks for Konto and the sign-out through `actions`. |
| `SvepHome.tsx` | Idag on `data.home`. Every optional field drops out cleanly when absent. |
| `SvepDrill.tsx` | Läsfråga and Facit on `useDrillCore` with `data.drills.reading` and `actions.drill`, kept in step with the switcher as `useDrill` was. The shared drill pieces (question column, faces, facit run, phone sheet, keys, end card) are now generic and math-aware. |
| `SvepQuant.tsx` (new) | Kvantfråga (6) and DTK (7): the problem card, the KVA and NOG layouts, and the figure card. The figure card has a lens (zoom, quarter turn, fit, failed-load state) and a viewer dialog. |
| `SvepOva.tsx` (new) | Öva (5): three task cards, the eight section doors, Repetera's door, the common traps and the register. |
| `SvepRepetera.tsx` (new) | Repetera (8): the batch card with its hand, the section chips, the register, and the later pile, folded. |
| `parts.tsx` | Adds the section chip and tint, the section slug, the framework-kind label and the number words. `DeckStage` takes kind `ova`. |
| `svep.css` | Adds the round-2 screens, the neutral section chip and the paper and neutral-back tokens. Phone Idag rules now also cover phone Öva, written with `:is()` so their weight is unchanged. Adds container queries for 1320, 1180 and 1120 px and 820 px high, plus reduced-motion and still entries. |
| `meta.ts` | Declares `screens: [1, 2, 3, 4, 5, 6, 7, 8]` and adds one trait for round 2 (proposed copy). |
| `Svep.test.tsx` | Adopts `describeDirectionContract(meta, Svep)`, replacing the hand-copied contract. Then 8 screens × 2 widths × 2 themes without console errors, and Svep's own tests. Round 1's tests moved onto the kit's `mountDirection`. Total: 145. |
| `docs/worklog/hpf-qr0p.21.md` | This worklog. |

## The new screens, and why they are Svep

The grammar carries over from screens 1–4:

- one card in front, with the next cards' edges behind it;
- a counter and a named register that keep the whole task in view;
- card stock with grain and an inner light, on a matte table;
- one raspberry action;
- ink for everything else, and ochre only for evidence.

**5 · Öva — three task cards, eight doors.**

- **Desktop.** The page has three columns, like Idag:
  - **Left: orientation.** "Öva", one line of help, Repetera's own door (a card lying on the table with a small fan of lilac cards: "8 redo nu · 23 i dagens hög"), and the common traps as quiet rows. Each trap row opens practice on that framework (`startDrill({ kind: 'framework', … })`).
  - **Middle: the deck** of three cards:
    1. **Förslag.** The weakest section, "Matematisk problemlösning", with its estimate "1,2", the 0–2,0 scale with the likely band ("Troligt 1,10–1,30") and the evidence ("Skattningen bygger på 400 svar de senaste 90 dagarna"). Its button, **Öva XYZ**, is the screen's only filled one.
    2. **Blandat.** Ten marks for ten questions, and "Frågor från alla åtta delprov, ett i taget".
    3. **Repetera.** The fan of ready cards, "Högst 10 frågor i en omgång, de som väntat längst först".
  - **Right: the eight sections as small door cards** in exam order. Each shows its code, its estimate and "N väntar", and starts that section's drill directly. The weakest carries an ink index tab, "Svagast": a word, not a colour. Under the doors is the deck's register, "I leken · 3 kort".
- **Phone.** One scrolling column:
  - "Öva" and the account;
  - the doors in a compact 4 × 2 grid (code and estimate on one line, "N väntar" under them);
  - Repetera's door;
  - the deck, with "1 / 3 Öva XYZ" and three index cards above the bar;
  - the traps below the fold.
- **Table.** The tint is neutral, and lilac while Repetera is in front.
- **Keys.** ←/→ move the deck and hand back to the switcher at its ends; Enter takes the card in front.
- **Why it is Svep.** It is one recommendation as a card in front with its alternatives behind it, not a grid of eight competing hero cards. The doors are a register of physical small cards, the "Svagast" tab is a card-index tab, and the register and counter are Idag's.

**6 · Kvantfråga — one substantial problem card that turns into the facit run.**

- **Desktop.** The card stands alone, centred, with the waiting questions' edges behind it. Its head has the section chip and "Fråga 2 av 3". The drill's head has Avsluta, the sitting's name ("Kvantitativ övning", or "Repetition" for a repetition sitting) and the questions as small cards plus the clock.
- **XYZ.** The prompt with KaTeX math (the stacked fraction) and four options with rendered fractions. Keys sit level with the middle of a fraction.
- **KVA.** The condition ("y > 0"), then Kvantitet I and Kvantitet II side by side as two tiles, which stack on phone. The four fixed comparisons follow, verbatim. This uses the app's own `splitKvaPrompt`.
- **NOG.** The stem, then statements (1) and (2) as slips, the coda "Tillräcklig information för lösningen erhålls" leading into A–E, and the five choices. This uses `parseNogPrompt`. The lone card takes the stage's full height, so all five choices stay on it.
- **After the answer.** The card turns over into the same five-card run as Läsfråga:
  1. the verdict, with the right answer's letter as the rank and your pick under one red rule;
  2. why your pick tempted;
  3. pitfall and technique;
  4. the solution;
  5. the other options.
- **No ¶ links.** Quant has no passage, so none are invented. Instead the solution card sets **the problem again** in an "Uppgiften" box above the solution path.
- **After a miss.** "Varför lockade A?" is filled and Nästa is quiet; once you move on, Nästa fills. The last question says "Slutför övningen".
- **End card.** "Hela leken är vänd.", the hand turned face up, "3 frågor · 2 rätt · 1 min", **Stäng** (through the controller's exit) and "Öva igen". The pair matches the real app's "Stäng / öva igen".
- **Phone.** The card hugs its problem (Svara under the options), with the waiting questions as stacked edges under it. The run lies on the table after the answer.
- **Why it is Svep.** The problem stays still on one card while you think, then turns into the ordered learning deck.

**7 · DTK — the page as the tall reference card.**

- **Desktop.** A pair:
  - **The figure card** shows "DTK · Underlag · Hösten 2025 · Provpass 1" and the original page on its own **light sheet**. The sheet stays light and the print's colours are never inverted, in dark mode too. The lens is a quiet strip under the page: − / "Hela sidan" / + / Vrid / Anpassa (after a change) / Förstora.
  - **The question card** sits beside it, with the options and Svara.
- **The page itself is printed sideways** (the *Pensioner* table runs up the page), so **Vrid**, a quarter turn, is what makes it readable. Then zoom in 150, 200 and 300 % steps.
  - The page box turns with the image, so the page always fits whole at 1. This uses container query units inside a size container.
  - The region scrolls; arrows, the wheel, a finger or a mouse drag pan it.
  - While the page has the focus, ←/→ belong to it, not to the facit run.
- **Viewer.** "Förstora" opens the page enlarged in a labelled dialog over the dimmed, inert drill:
  - it shares the lens and keeps the focus inside;
  - Esc closes it (a local aid, never leaving the drill);
  - the focus goes back to Förstora;
  - while it is open the letters do not answer the question behind.
- **Failed load.** A page that fails to load says "Underlaget kunde inte laddas." and offers "Försök igen", in the paper's own dark ink.
- **Phone.** The page fills the screen with the lens as icons in the card's head. The question card peeks below with "Fråga 1 av 1", the whole prompt and "Till frågan"; raised, "Till figuren" lowers it. This is the reading drill's sheet.
- **Why it is Svep.** A large stationary evidence card and a smaller question card, then the same turn to feedback on the same table.

**8 · Repetera — today's misses as a finite hand.**

- **Desktop**, on the lilac table:
  - **Left: the page.** "Repetera", "Åtta är redo nu, 23 ligger i dagens hög.", the section chips (Alla 8 · LÄS 1 · ELF 1 · XYZ 2 · KVA 2 · NOG 1 · DTK 1) and "← Till Öva".
  - **Middle: the batch card**, with the rest of today's pile as two edges behind it. It shows:
    - "8 frågor redo nu", the numeral at Svep's display size;
    - the batch as a **hand of cards face up**, each with its section (LÄS and ELF cards in their tint);
    - "De som väntat längst först.";
    - "Högst 10 frågor i en omgång. Facit efter varje svar.";
    - **Repetera 8**, the one filled action.
  - **Right: the register**, "Omgången · 8 frågor". Each card shows its section, its question (math rendered; ELF questions marked `lang="en"`) and one quiet line with its trap or type, e.g. "Fälla: …" or "Frågetyp: …".
  - **The rest of today's pile** is folded under the register: "15 till blir redo senare", which opens.
- **Section chips.** A chip narrows the batch, the hand, the register and the start to one section (`startDrill({ kind: 'repetition', section })`). "Alla" widens it again.
- **Enter** starts the batch.
- **Empty states.** "Inga missar än" and "Inget redo just nu" each get one action, Till Öva. There is no overdue alarm and no streak language.
- **Phone.** One column: the chips as a sideways rail, the batch card, then the register.
- **Why it is Svep.** A finite hand as one card, not a list page. The register keeps every card in view.

## Screens 1–4 on kit v2

- **What moved.**
  - Idag reads `data.home`.
  - The drill reads `data.drills.reading` and runs on `useDrillCore` with `actions.drill`.
  - The frame reads `data.home.ovaDue` and `data.konto.identity`.
  - No Svep file imports `r1Fixtures`, `r2Fixtures` or `useDrill` any more.
  - Round 1's switcher moves stay on `onScreen`, exactly as `useDrill` kept them: Fortsätt → 2, a lock → 3, Nästa → 2, Avsluta → 1. The switcher sync for Facit and Läsfråga is unchanged.
- **Same look.** Screens 1–4 were shot before (round 1's files from HEAD, served through a harness alias) and after, at both widths and in both themes. **Screens 1, 2 and 3 are byte-identical in all 12 shots.** Screen 4 differs only in the account card's head line (below).
- **Deliberate differences**, all real-data readiness:
  1. **Account card head.** It shows `konto.identity` (name; e-mail, or "Inloggad · ‹plan›" when a plan is known). It used to show round 1's fixed "Ditt konto / Inloggad · gratisplan": a plan claim with no real source, and `identity.plan` is optional.
  2. **Account rows.** "Konto" and "Inställningar" ask `actions.openKonto()` and "Logga ut" asks `actions.signOut()`; round 1 only closed the card. In the bake-off, Konto lands on the shared "Inte byggd än i Svep" card until batch 3.
  3. **Doors and Idag's cards.** They ask through `actions` (`go`, `openPlanItem`) and also open their page in the frame at once. In the bake-off the switcher follows: Öva → 5, the repetition plan card → 8, a lesson → 12, which is "Inte byggd än". Round 1 opened Svep's own stubs. The stub's copy is updated for a stage that keeps Svep mounted (proposed copy).
  4. **End of the unit.** The end card's "Nästa kort: Repetition · 9 min" asks `actions.openPlanItem(first open item)`, which reaches Repetera (8) in the bake-off. Round 1 went to Idag with the Öva stub.
- **Why the frame also opens pages itself.** The real-app preview shell (`DirectionShell`, hpf-qr0p.8 step 1) mounts directions **without a provider**, so every action is a no-op there until step 2. With the local page, Svep's doors, plan cards, Öva and Repetera keep working in that shell.
  - Öva's and Repetera's own starts (section doors, mixed practice, Repetera, start) are requests only. The shared contract continues on the same screen after them, so they must not move the frame.

## Navigation: intents, not screen numbers

| Element | Request | Bake-off |
|---|---|---|
| A door | `go(dest)` (+ local page) | Idag 1, Öva 5, Provpass 9, Uppslag 12, Framsteg 11 ("Inte byggd än" for 9, 11 and 12) |
| Idag plan card / Enter | `openPlanItem(id)` (+ local page) | repetition 8 · lesson 12 · drill by section (ORD: none) |
| Öva section door / Förslag | `startDrill({ kind: 'section', section })` | LÄS 2 · XYZ/KVA/NOG 6 · DTK 7 · ELF 14 · ORD/MEK none |
| Öva Blandat | `startDrill({ kind: 'mixed' })` | 6 |
| Öva Repetera (door and card) | `openRepetera()` | 8 |
| Öva trap row | `startDrill({ kind: 'framework', frameworkId, section })` | by section |
| Repetera start / Enter | `startDrill({ kind: 'repetition', section? })` | 6 |
| Quant/DTK Avsluta, end card Stäng | `actions.drill.exit()` | back to the hub |
| Quant/DTK lock | `actions.drill.lock(q, letter)` | graded |

## Spec gaps (built only what kit v2 supports; rendered without the rest)

1. **§5 Öva — section batch length and minutes.** The view model has no batch length for a section drill (only `ova.mixed.questions`) and no minutes estimate. The suggestion card states no count; only the mixed card says "10 frågor".
2. **§5 Öva — "Fortsätt övningen" for a resumable section session.** `OvaView` has no per-section resume, so it is not shown.
3. **§5 / §8 — loading, partial and failed states** ("Kunde inte hämta antalet", retry on queue failure; unknown is never zero). The view model has no loading or error states. Rendered: empty history (no weakest → Blandat leads, its button filled), zero ready ("Inget redo just nu"), no traps (list left out), and an empty or not-ready pile on Repetera.
4. **§6 — pending or failed saves** ("answers saved unsuccessfully must be labelled pending/error"). `DrillController` has no save state. The quant drills make no "sparade" claim; round 1's reading drill keeps its Avsluta tooltip "Dina svar är sparade".
5. **§6 / §7 — "Avsluta returns to the caller with section context".** Left to the host's `drill.exit` (the bake-off returns to the hub screen). The view model carries no origin.
6. **§7 — figure block position** ("Fråga 2 av 4 · samma sida") **and figure title.** The DTK sitting has one question, and `DrillFigure` has no title. The card shows the source ("Hösten 2025 · Provpass 1"). The lens does keep zoom and turn across questions on the same page (`useLens` keys on `src`).
7. **§7 / owner question 5 — an accurate description of the DTK page.** `figure.alt` is the generic "Underlag till uppgift 29". **This accessibility gap is open:** the page has no text equivalent of the table's values. Nothing was invented.
8. **§7 — "disable Svara until the required diagram is usable".** A failed page says so and offers a retry, but Svara is not blocked: the core has no "blocked" input.
9. **§8 — the repetition run and its end card** (`SvepSessionEnd`: answered, right, remaining). There is no repetition sitting in `data.drills`. The bake-off maps a repetition start to screen 6 with the quant fixture, which says "Kvantitativ övning" (it would say "Repetition" for a `request.kind === 'repetition'` sitting).
10. **Shared §Layout — "Route changes focus the page heading".** Not added: the frame did not move focus on a door in round 1, and screens 1–4 must behave the same. Flagged for the owner.
11. **Owner question 1 — a saved "System" theme.** The account card keeps round 1's System button as a one-shot (it reads the device and sets light or dark). There is no saved System mode; production `ThemeMode` is light or dark.
12. **Kit — `ResumeView` has no prompt for the question where you stopped.** Idag reads it from `drills.reading` (the sitting the resume reopens) when the sections match, and leaves it out otherwise.
13. **Kit mapping — ORD and MEK drills have no bake-off screen** (`drillScreen` → null). Those doors and the ORD plan card send their request and nothing visible follows in the bake-off; in the real app they would start the drill. The ORD plan card still opens Öva locally, as round 1 did.

## Content defect seen (outside this bead)

The reviewed explanation of `host-2025-kvant2-XYZ-009`, step 9, has misplaced math markers. One segment reaches KaTeX unbalanced, so KaTeX shows its source ("\dfrac{2}{7} \cdot 63 = …") as an error span, painted red inline. Svep now keeps `.katex-error` in ink (it was 5.77:1, now ≥ 7:1), but the raw LaTeX remains: the source data is not this bead's to change. The contract's math checks (prompt and technique) pass.

## Proposed UI copy (new in this batch; none is approved yet)

- **Öva:**
  - "Öva", "Ett kort i taget. Förslaget ligger överst, alla delprov till höger."
  - "Alla delprov · starta direkt", "Svagast", "N väntar", "Inga missar"
  - "N redo nu", "Inget redo just nu", "N i dagens hög"
  - "Vanliga fällor", "N gånger" / "gång", "ökar"
  - "Förslag · ditt svagaste delprov just nu", "skattning av 2,0", "Troligt x–y"
  - "Skattningen bygger på N svar de senaste 90 dagarna.", "Du har inte övat det här delprovet än."
  - "Öva ‹kod›", "Blandad övning", "Blandat", "Frågor från alla åtta delprov, ett i taget."
  - "Bra när du vill hålla allt varmt utan att välja delprov.", "Starta blandad övning"
  - "Dina missar", "Högst N frågor i en omgång, de som väntat längst först."
  - "Inga missar än. Missar du en fråga läggs den här.", "Till Repetera", "startar kortet"
- **Kvantfråga and DTK:**
  - "Uppgiften", "Frågan saknar svarsalternativ just nu.", "Tillbaka", "Stäng", "Öva igen"
  - "‹sitting› · klart", "Fälla:" / "Taktik:" / "Frågetyp:" / "Ramverk:"
  - "Underlag", "Zooma ut" / "Zooma in", "Hela sidan", "N %"
  - "Vrid", "Vrid ett kvarts varv", "Anpassa", "Anpassa: hela sidan, rak"
  - "Förstora", "Förstora underlaget", "Underlaget · uppgift N", "Stäng förstoringen", "Till figuren"
  - "Underlaget kunde inte laddas.", "Försök igen"
  - Taken from the spec: "Slutför övningen", "Förklaringen saknas just nu."
- **Repetera:**
  - "‹Åtta› är redo nu, N ligger i dagens hög.", "Omgången", "Alla", "frågor redo nu"
  - "De som väntat längst först.", "Högst N frågor i en omgång. Facit efter varje svar."
  - "Högst N frågor i en omgång; resten tar du nästa gång."
  - "Repetera N", "Till Öva", "Nästa omgång", "N till blir redo senare", "Dölj resten av dagens hög"
  - "Inga missar än", "Inget redo just nu", "Resten av dagens hög blir redo senare."
- **Frame and meta:**
  - the stub note "Den här leken läggs senare i omgång 2. Menyn och kontot fungerar redan härifrån.";
  - the new `meta.ts` trait.

## Interaction, keys and accessibility

- **Keys.**
  - **Drills:** the question's own letters choose (a–d; a–e on NOG) and Shift+letter strikes; Enter and Space answer once a choice is made, then deal the next question. Space keeps its own meaning inside the text, the page, the viewer or a facit card.
  - **Facit:** ←/→ move the run and hand over to the switcher at its ends.
  - **Esc never leaves a drill:** in the reading drill it releases the paragraph focus, and on DTK it closes the viewer.
  - **Digits** are left to the switcher.
  - **Öva:** ←/→, Home, End, and Enter on the card in front. **Repetera:** Enter starts.
- **Accessibility.**
  - Visible 2 px rings on every Tab stop (walked on 5–8 at both widths).
  - Hit areas ≥ 44 px (no small controls found).
  - Inert rear cards; the viewer is a labelled modal that keeps the focus inside.
  - Section doors and trap rows are named in full, with spoken separators ("XYZ, Matematisk problemlösning, skattning 1,2, 5 väntar, svagast").
  - ELF prompts are marked `lang="en"`; math is named by MathText's `role="math"` labels.
  - Reduced motion: the viewer and its card join Svep's crossfade rules, and the new door cards do not lift.

## Self-check (Vite + Playwright on 127.0.0.1)

- **Harness** (scratchpad only, outside the repo).
  - A Vite server (`createServer`, `configFile: false`) mounts only `Redesign2026Bakeoff` under the app's `index.css` and KaTeX CSS. URLs take the form `?d=e&s=…&w=…&t=…&bare=1`.
  - It drives Playwright Chromium at 1440 × 900 (1×) and 390 × 844 (2×), plus 1280 × 800 and 1024 × 768.
  - The sandbox gives each command its own network, so the server runs inside the shooter's own process.
  - Round 1's files (from HEAD) can be served through an alias for before/after shots.
- **Probes on every page:**
  - horizontal overflow and controls outside the viewport;
  - clipped text (deliberate ellipses and visually hidden text apart) and overlapping text blocks in a card;
  - hit areas under 44 px;
  - contrast from computed colours (OKLCH → sRGB): body text ≥ 7:1, the rest ≥ 4.5:1;
  - axe-core (WCAG 2.0/2.1 A/AA);
  - console and page errors.
- **Further passes:**
  - the WCAG 1.4.12 text-spacing overrides on 5–8 and the quant facit;
  - a 22-stop Tab walk on 5–8 at both widths;
  - reduced motion;
  - a failed figure load.
- **Shots taken** (fonts are fallbacks offline, so hierarchy, spacing, colour and composition were judged, not letterforms):
  - the 16 views per screen;
  - facit, KVA, NOG, solution card, end card, viewer, zoom, turn, raised phone sheet, later pile, scoped batch, Repetera in front on Öva;
  - 1280 and 1024 px desktops.
- **Fixes the rounds found:**
  1. **Öva desktop.** The deck's rear edges hid the "A" of "Alla delprov" → the gap is now 80 px.
  2. **Öva phone.** The counter and register fell below the fold, and the suggestion card's evidence sat under its pinned button → compact doors (code and estimate on one line), the doors' heading said rather than shown, a shorter deck, the range in words instead of the scale on phone, and a duplicate sentence dropped.
  3. **Quant.** Option keys aligned to the top of a fraction → centred. The phone card stretched to full height with an empty middle → it hugs its problem, with stacked edges for what waits. NOG's fifth choice was under the fold → the lone card uses the stage's height and the statement slips are tighter. Inline fractions were small → statements and quantities are a size up.
  4. **axe** found NOG's formula boxes scrollable but unreachable (`scrollable-region-focusable`) → formulas wrap at their operators instead of scrolling.
  5. **Phone DTK.** The lens wrapped onto two rows → icons only; the zoom level and "Underlag" are said, not shown.
  6. **Repetera.** Some catalogs name a trap in a whole sentence, which buried the questions → question first, the trap one quiet line (with its whole name as a tooltip). The phone hand overlapped its line → a flatter fan and more room.
  7. **Door names** read "1,63 väntar" → spoken separators.
  8. **A failed page load** would have been blank → a message and a retry, in the paper's own ink so it reads in dark mode too.
- **Final pass** (`final/`), on 5–8 and every interaction state above:
  - no overflow, no control outside the viewport, no clipping;
  - no axe violations and no console or page errors;
  - every Tab stop ringed;
  - **body text ≥ 7.82:1** (lowest: DTK facit, dark), **UI ≥ 5.02:1**.
- **Remaining probe flags, by design:**
  - the end card's hand overlaps itself (fanned cards, as round 1);
  - the phone scope chips run off the edge (a sideways rail);
  - under the text-spacing overrides, Öva's card scrolls inside under its pinned foot (round 1's rule for Idag).
- **Screens 1–4** pass the same probes, and match round 1 as described above.
- **Not run.** No independent second reader.

## Verification

| Check (from `app/`) | Result |
|---|---|
| `pnpm typecheck` | Clean. |
| `pnpm lint` (`biome check src`) | 479 files, 0 errors, 0 warnings. 4 infos, all pre-existing and none in this change: `LandingBakeoffR3/R4A/R4C.tsx`, `l12/M3.tsx`. |
| `pnpm test` | 105 files, **1621 passed, 1 failed** (1622). Svep's own file has 145, all passing. That covers the shared contract for screens 1–8 at both widths, the theme switches, every screen without the view model's optional fields, the verdict without an explanation, and Svep's own deck, frame, drill, Öva, Kvantfråga, DTK and Repetera tests. |

**The one failure is in a shared test outside the write set, and comes from declaring screen 7 as the brief requires.** `Redesign2026Bakeoff.test.tsx:155–166`, "says in the 'Om' panel which directions have built the screen", hard-codes that no direction has built screen 7: it expects "Ingen riktning har byggt den här skärmen än." and now gets "Byggd i Svep.".

Every batch-1 direction declares screen 7, so this needs one fix in the shared test. The fix is to derive the expected line from the registry, as the panel does: `DIRECTIONS.filter((d) => builds(d, 7))` → "Byggd i …" or the empty sentence. That keeps it true as batches land. I did not edit it.

```
 FAIL  src/components/devbake/redesign/Redesign2026Bakeoff.test.tsx > bake-off switcher > says in the "Om" panel which directions have built the screen
Expected element to have text content: Ingen riktning har byggt den här skärmen än.
Received: Byggd i Svep.
 Test Files  1 failed | 104 passed (105)
      Tests  1 failed | 1621 passed (1622)
```

## Notes for the owner

- **Deliberate calls to react to:**
  - Öva leads with one suggestion card (the weakest section). Its button is the screen's only fill; the section doors start a drill directly.
  - "Svagast" is an ink index tab on the door, not a colour.
  - The quant facit sets the problem again above the solution.
  - DTK's page lies on a light sheet in both themes, and Vrid matters: the *Pensioner* table is printed sideways.
  - Repetera narrows to one section with chips. The later pile is folded.
- **Screens Svep has not built** (9–14) show the shared "Inte byggd än i Svep" card in the bake-off. Svep's doors to Provpass, Uppslag and Framsteg lead there.
- **Not touched:** real routes, stores, loaders, the worker, data, the kit, the registry, the spec, other directions, `index.css` and `app/index.html`. No bake-off was deleted.

SVEP1 DONE: hpf-qr0p.21

# Worklog — hpf-qr0p.15

Redesign round 2, direction C · Spår, batch 1: Öva (5), Kvantfråga (6), DTK (7), Repetera (8), and the move of screens 1–4 onto kit v2.

## Findings

- 2026-10-20: Claimed through `gc hook --claim --json` and checked with `bd show`: id, status `in_progress`, assignee and route all match. Worktree `hpf-qr0p.15`, branch `codex/hpf-qr0p.15-redesign-round-2-direction-c-sp-r-batch-1-va-kvantfr-ga-dtk-`, base `980c9b29c0dfadd0615319e2ca2c3faa529d1ac7`, clean at start.
- Read before building:
  - `docs/redesign/kit-v2.md`;
  - the B0 spec `docs/redesign/directions/c-spar.md` (§1 language, §2 map, §3 screens 5–8, §4 inventory, §5 open questions);
  - the shared kit files, which stay read-only: `viewModel.ts`, `directionData.tsx`, `drillCore.ts`, `contract.ts`, `r1Kit.ts`, `r2Fixtures.ts`;
  - Spår's round-1 code;
  - the two finished B1 worklogs (`hpf-qr0p.12` Instrument, `hpf-qr0p.18` Lager).
- The two shared tests that tripped earlier B1 batches (`contract.ts` image loading, the registry assertion in `Redesign2026Bakeoff.test.tsx`) were already fixed on main (`c47d87b`). Declaring screens 5–8 breaks no shared test (see Verification).
- Fixture facts the copy is fitted to:
  - Repetera: 8 misses due of 23 in the pile; ten per round.
  - Öva: the weakest section is XYZ; the first trap (LAS-TYPE-003) has 3 misses.
  - Kvantfråga: XYZ-009, then KVA-017, then NOG-025.
  - DTK: one question on one page (`host-2025-kvant1-p16.jpg`, 2316 × 3302), printed sideways.

## Decisions

- Spår stays one design system in its folder. New parts are in `sparParts.tsx`:
  - `SparStop` (the one stop vocabulary of spec §1.2);
  - `SparPageHead` (Idag's head, same DOM);
  - `SparSegmented` (native radios in one pill);
  - `useInPlace` (the in-place disclosure of §1.9);
  - `ScopePicker` ("Bara ett delprov": in place on desktop, a modal edge sheet on phone).
- The question-screen pieces live in `SparDrill.tsx` and are exported to `SparQuant.tsx`: top bar, stops, options, Facit sheet, verdict, explanation and end of round.
- Navigation asks the host through `useDirectionData().actions` (`go`, `openRepetera`, `startDrill`, `openPlanItem`, `openLesson`, `openKonto`, `signOut`, `drill.exit`). Round 1's own moves (resume → 2, lock → 3, next → 2, Avsluta → 1) keep `onScreen`, as kit v2 §3 says.
- The frame also keeps a local destination, so a host that does not move (a test, a preview) still shows the page.
- Lugnt läge stays in the direction's root for the mounted session; every routed screen shares it. The kit has no setting for it (see spec gaps).
- Tokens added (allowed by spec §1.3): `--sp-col-wide` (1000 px), `--sp-page` (1180 px) and `--sp-math` (1.06 em).
- The chroma moved into base tokens (`--sp-c-tint-base`, `--sp-c-strong-base`, `--sp-c-ink-base`). Every value is unchanged and no hue is added.
  - Cause: Repetition's low chroma was inherited by section stops nested in a REP card, so the station's path turned grey (found in the screenshots).
  - Fix: a section element now takes its base chroma back.
  - Round 1 re-verified pixel-identical afterwards.

## Built, per screen — and why it is Spår

**5 · Öva** (`SparOva.tsx`)
- The page uses Idag's head (`SparPageHead`): eyebrow "Öva", the Bricolage display title "Alla delprov", a lede.
- **The Repetera station** is the dominant card, in Idag's `sp-now` shape on a near-neutral REP band (repetition is no section, never green).
  - Its title "8 missar är redo nu ›" opens the queue (`rd-ova-repetera` → `openRepetera`).
  - "de äldsta först" sits under it.
  - The path shows the next ripe misses as section stops ringed in their hues, ending in a goal. It is a `role="img"` named "Nästa missar: KVA, LÄS, …". Phone shows at most 7 stops, then "+n".
  - The one green pill reads "Repetera 8 · ca 9 min ↵", using Idag's minutes for the same round, and starts the round at once (`startDrill({kind:'repetition'})`).
  - "Bara ett delprov ⌄" grows the card in place on desktop and is a modal edge sheet on phone. It lists the sections with ripe misses ("LÄS · 1 redo") and starts a scoped repetition.
  - The station has a state per case: new reader, nothing ripe ("Inget är redo just nu. 7 missar ligger i dagens hög …"), empty queue, and more than ten ripe ("Repetera 10 av 14").
- **Eight sections** are grouped "Verbal del" / "Kvantitativ del".
  - Each section is a tile: a 44 px section stop (the code in its hue's ring), the official name, "10 frågor · ca 3 min" (DTK "10–13"), "N väntar" and the "Föreslås" chip.
  - No tinted band; the corners morph 20 → 28 on the spring.
  - The whole tile starts the round. Its full spoken name reads like "Matematisk problemlösning, 10 frågor, cirka 8 minuter, 5 väntar, föreslås".
  - Phone shows the sections as 64 px rows.
  - When nothing is ripe, the green pill moves into the suggested tile ("Öva XYZ · ca 8 min ↵"). For a new reader it becomes "Blandad övning · ca 9 min ↵".
- **Blandad övning** is a quiet full-width row with the trail glyph, never a ninth tile (`rd-ova-mixed`).
- **Återkommande fälla** is a quiet `.sp-trap`-style note with the section edge, shown only from 3 misses on one trap. Its link reads "Riktad repetition · 5 min" (`startDrill({kind:'framework', …})`). It sits beside the station on desktop and after the sections on phone, so it never pushes the pill down.
- Calm hides the per-section counts, the path stops (the sentence stays) and the nav dot.
- Spår-specific: the queue drawn as a stig of section-ringed stops ending in a flag, under a big Bricolage title; section stops instead of chips; one green pill that moves to wherever the next step is; and the neutral REP band.

**6 · Kvantfråga** (`SparQuant.tsx`)
- **The problem card** is the reading card's sibling, in the same 760 px column. It has a band in the section's tint (dark: the 4 px line) and the sitting at the band's right ("Hösten 2025 · Provpass 2", which marks it authentic). The stem is Figtree 20/600 with math via `MathText` at `--sp-math`.
- **KVA**:
  - The condition sits on its own line, then the two quantities side by side in sunk tiles. Each tile has a 32 px stop with the Roman numeral, ringed in the KVA hue, and the quantity at 24 px.
  - The fixed options form a 2 × 2 grid. Each shows the relation glyph ("I > II", "?") in its own column, while the option's accessible name is the words only.
  - On phone the quantities stack and the options form one column.
  - A prompt that does not split stays verbatim.
- **NOG**:
  - The question comes first, then the statements as two stops on a short path ("Påståenden", an ordered list).
  - The caption "Tillräcklig information för lösningen erhålls" heads the options.
  - Each of the five options carries the statement glyph: ●○, ○●, ●━●, ●┊● or ○○.
  - "(₁ )"-style references are normalised to "(1)" for the fixed options.
- **XYZ** options form one row when all are short (≤ 14 characters rendered), otherwise a column. ORD would get the 42 px Bricolage headword and MEK gap blanks (4 em), as spec §3 asks.
- **The tray follows a short problem.** It is open from the start and sticky under the card, docking to the bottom edge only when the problem is taller than the room; the problem then fades under it over 20 px, detected with an IntersectionObserver sentinel.
  - The tray foot holds the fold button (T), key hints, "Ditt val: B" and the one green "Svara ↵".
  - "Taktik ⌄" is folded until asked for, shows the explanation's `pregrade_tactic`, and is hidden in Lugnt läge.
- **Facit** is the edge sheet at 58 % (T toggles to 40 %).
  - Its head has the verdict (glyph and word), the chip ("Lagd i Repetera", or the schedule in a repetition), and "Visa uppgiften" (drops the sheet and turns the column to the problem).
  - Then come the answer cards (KVA cards carry their relation), "Varför A lockade", "Att ta med dig", "Lösningen", "Steg för steg" with "Fördjupning", the other options, and the framework line with "Slå upp i Uppslag →".
  - Math is rendered everywhere, never raw markers.
- **Phone**: the problem scrolls, the options follow it in the flow, and the sticky answer bar shows "Ditt val: C · Svara". Facit rises as the edge sheet at half height, with "Visa uppgiften".
- **The top bar**: Avsluta, the current section chip, the stops (ringed per section in a mixed round), "Fråga n av N", Lugnt and the clock. In a repetition the bar adds the REP chip.
- **The end** reuses `Done`: "Övningen klar", "Kvantitativ övning är klar", "1 av 3 rätt", the stops, a no-loss sentence, and the day's mini path. The plan's next step is the green pill ("Fortsätt med Repetition · 9 min"); "Tillbaka till Öva" is the quiet way back ("Tillbaka till mönstret" for a pattern drill).
- **Empty sitting**: the spec's copy, plus one working step as the green pill ("Öva hela XYZ · ca 8 min", "Tillbaka till mönstret", "Till Öva").
- Spår-specific: section-tinted problem cards; statements as stops on a little path; quantities in Roman-numeral stops side by side; the blob that turns into a tilted ink squircle when chosen; the edge sheet with "Att ta med dig" before the solution.

**7 · DTK** (`SparQuant.tsx`)
- **The wide column** is `--sp-col-wide` (1000 px). The page card's band names the page ("Diagram, tabeller och kartor · sida 1 av 1") and carries its tools:
  - `SparSegmented` "Bredd · Hela sidan" (native radios; ←/→ move the choice, and the bake-off ignores keys from form fields);
  - "⤢ Förstora" (Z);
  - "↻ Rotera" (R). The fixture page prints its table sideways, which is exactly this case.
- **The page sits on a white mat in both themes**, never inverted or filtered. Loading shows the mat at the page's real aspect, sunk, with "Hämtar sidan…" behind the image as it paints (no half-transparent page).
- **Failure** shows "Sidan gick inte att hämta." with "Försök igen" inside the mat. The options are disabled with the reason "Frågan behöver sidan.", and Enter cannot grade either. A missing page shows "Sidan saknas.".
- **Fit and rotation are kept per page**, and the column keeps its scroll for the next question on the same page. A new page resets to the top and announces "Ny sida, sida n av N" politely.
- **The tray** (760 px) docks under the page like a drawer under a map. It shows "Fråga n av m på den här sidan" when a page holds more than one question.
- **The top bar's stig is grouped by page**, with "sida n" under each group.
- **Facit opens at 40 %** so the page stays in view; "Förstora sidan" sits in its head.
- **The viewer** (`FigureViewer`, shared with screen 6's figures) is a full-screen modal over the drill: `role="dialog"` named "Förstorad sida", focus moves in and back to its button, Tab stays inside.
  - Tools: "− NNN % + ↻ Hela sidan" in a pill, and "Stäng".
  - Zoom runs 100–600 % (+/=/−, ⌘/Ctrl + wheel, two-finger pinch). Pan by mouse drag or arrow keys; the arrow keys are kept from the bake-off's own arrows. R rotates, Esc closes.
  - A strip at the foot repeats the question and its options, so answering never means closing it. The phone strip is 2 × 2 with a full-width Svara.
  - Zoom changes are announced ("150 procent").
- **Phone**: the page is at width with "Sida 1 av 1 · ⤢ Förstora", and a double tap opens the viewer. The question sheet (`rd-sheet`) peeks with the whole question (never clamped) plus "Visa alternativen (4)". Facit opens at half, with "Visa figuren".
- **Image options** (the 11 pie-chart questions) show as chart tiles (4 in a row, 2 × 2 on phone) with "Bilden saknas" when one fails. Their accessible name is the label.
- Spår-specific: the printed page held on a white mat inside a DTK-banded card; the round's path grouped by page; a tray docked under the page like a drawer under a map; a viewer that keeps the question at hand.

**8 · Repetera** (`SparRepetera.tsx`)
- A sub-page of Öva: the rail and navbar keep Öva lit, with "← Öva" above the eyebrow on desktop and in the app bar's brand slot on phone.
- **The head**: "Repetition" / "Dina missar" / "Repetera 8 av 23, de äldsta först. Ungefär 9 minuter."
- **The queue** is a vertical stig of 44 px section stops (36 px on phone), ending in a goal: "Klart. Det du svarar rätt på flyttas fram i schemat."
  - It is an ordered list named "Missar i den ordning de kommer".
  - Each row shows the section's name (plus "2 fel den här veckan" when missed more than once), the question as a two-line preview (math rendered), "Fälla: …", and the place in the queue.
  - Ten play per round; more say "+ 4 till väntar i kön …".
- **The rest of today's pile** is counted by section ("15 missar till blir redo senare idag · ORD 3 · MEK 3 · …") and listed on request ("Visa dem").
- **"Bara ett delprov"** rescopes the queue in place. The eyebrow becomes "Repetition · bara KVA", the h1 is spoken "Dina missar, bara Kvantitativa jämförelser", the pill reads "Starta repetition · 2 frågor", and "Alla delprov" undoes the scope.
- **The one green pill** stays in reach: the page's foot is sticky, and what passes under it fades over 20 px.
- **Empty states**:
  - Nothing ripe: no start; the pill is the suggested section ("Öva XYZ · ca 8 min").
  - New reader: "Blandad övning · ca 9 min".
  - Empty pile: "Till Öva".
- **The round** is screen 6 or 7 (the host plays it). A repetition session gets the REP chip, section-ringed stops, "Den flyttas fram" / "Tillbaka om en stund", and the end "Repetition klar · N av M satt · N flyttas fram i schemat. N kommer tillbaka om en stund.".
- Spår-specific: the misses as a vertical stig of section-ringed stops ending in a flag; amber ↻ instead of red; the neutral REP chip beside the section's chip.

**1–4 · migrated to kit v2**
- **Idag** (`SparHome.tsx`) reads `data.home` (today, exam, plan, resume, prognosis, traps, recent, week). Plan rows call `openPlanItem`, Fortsätt calls `actions.resume()` plus `onScreen(2)`, and "Alla pass" calls `actions.go('framsteg')`.
  - Every optional field is left out when absent: `pausedAt`, `device`, `minutesLeft`, `stale` (gets its own line), `prognosis.low/high/target/delta`, `week.goal/daysPractised/minutesToday`, and `primary`.
  - Without a resume, the plan's first step becomes the dominant stop ("Börja · N min").
  - Empty traps or recent passes hide their block.
  - A falling delta is said in neutral ink, never alarm colours.
- **Läsfråga / Facit** (`SparDrill.tsx`) use `useDrillCore` with `data.drills.reading`, graded by `actions.drill`, and stay in step with the switcher (screen 3 opens graded with `wrongPick`; Läsfråga reopens, as `useDrill` did).
  - The title and subtitle, the ÖVNINGSTEXT badge and note come from the question's `passage` and `data.copy`; the framework names from `data.frameworks`; the day's path and next step from `data.home.plan`.
  - A missing explanation shows "Förklaring saknas ännu för den här frågan."
  - The clock is hidden when a sitting resumes without its own seconds.
- **The frame** (`Spar.tsx`):
  - destinations go through `actions.go`;
  - Öva's nav dot shows only while `home.ovaDue > 0`;
  - the account's Konto and Inställningar call `openKonto`, and Logga ut calls `signOut`;
  - a new page puts focus on its title (not on first mount);
  - the phone app bar cross-fades "HP-Coach" to the page's name once the title scrolls away (opacity only).
- **Look**: screens 1–4 are pixel-identical to round 1 (see Visual check). Four Idag strings (the lede, "· ca 6 min kvar", "Pausad … på telefonen" and the goal line) keep round 1's exact text-node splits, because Chrome positions glyphs differently otherwise.
- **Deliberate, spec-listed round-1 changes** (spec §4):
  - Facit's framework line gained the link "Slå upp i Uppslag →" (below the fold in screenshots);
  - Done's primary now asks the host for the plan step (`openPlanItem`) instead of a local stub;
  - Space advances once there is something to advance (the bead's keyboard rule; before that, Space still scrolls the passage).
- **Contract**: `Spar.test.tsx` adopts `describeDirectionContract(meta, Spar)`; Spår had no hand-copied contract before.

**Keyboard**
- a–e choose only the letters the item has; Shift + letter strikes; Enter answers, moves on and at the end takes the next step. Space does the same once there is a choice or a verdict.
- T folds the tray (desktop), Z opens the viewer, R rotates a page.
- Esc never leaves a drill: it clears paragraph focus, or closes the viewer.
- Digits are left to the switcher.

## Spec gaps (built what kit v2 supports; the rest renders without it)

- **§1.10 / §4 "The persisted Lugnt läge"**: `PrefsView` has no calm field. Lugnt läge lives in Spår's root while it is mounted (shared by every screen it routes) and resets on a new mount. Ask: a `calm` pref in the view model.
- **§1.11 Loading / Error / Offline**: kit v2 has no loading, error or offline signals (data is synchronous), so skeletons and error cards are not built. Figure loading and failure are handled locally.
- **§1.2 / §4 SparStop replaces the four local stop styles**:
  - Adopted in the top bar (pixel-identical to round 1) and on every new screen.
  - Idag's path marks, the end's mini path and Facit's step dots keep their round-1 styles, so screens 1–4 stay pixel-identical.
  - Proposal: move them in a batch that re-shoots 1–4 on purpose.
- **§3·5 Återkommande fälla**:
  - "Not treated, not declined twice" is not in the view model. Spår shows the first `weakTraps` entry with count ≥ 3.
  - The adaptive review's `ar=1` is not a `DrillRequest`; Spår sends `{kind:'framework', frameworkId, section}`.
  - `TrapView.count` counts due misses, not "the last week", so the copy says "Tre av dina missar hör till samma fälla".
- **§3·5 "Queue cleared"**: spec copy is "Kön är tom. Allt du missat är återlärt." An empty pile (`pile === 0`) does not prove everything is re-learned (later reviews may exist), so Spår says "Inget väntar i kön idag." (proposed). The same holds on screen 8.
- **§3·5 "a paused round in that section resumes instead"**: no per-section resume data, so a tile always calls `startDrill` (the host decides).
- **§3·5 / §5 Q11 "Tillbaka till Öva when it started there"**: the kit does not say where a sitting started. Quant and DTK ends always offer "Tillbaka till Öva" ("Tillbaka till mönstret" for a framework request). The reading drill keeps round 1's "Till Idag".
- **§3·6 figures**:
  - SVG figures inlined to follow the ink (`currentColor`) are not built: the kit hands a `src`, not markup. Spår shows every figure on a white mat, readable in both themes.
  - The page image keeps the view model's alt ("Underlag till uppgift 29"), which the contract requires; the spec's "Sida 2 av 4, diagram och tabeller till fråga 4–6" is not possible. The band's "sida n av N" is attached with `aria-describedby`.
- **§3·6 "(₁ )" normalisation**: the kit does not normalise. Spår normalises the five fixed NOG options for display and glyph matching; statements in the stem render as stored.
- **§3·6 states**:
  - "Explanation still loading" has no source (null = "not yet") and shows the "no explanation" copy.
  - "Markera som saknad" and "Hjälpte förklaringen?" (Ja/Nej → Tack) are not built: no kit action records them, and a button that says "Tack" while storing nothing would be a false affordance.
  - "Incomplete question → Hoppa över" shows the message only: the drill core has no skip.
- **§3·6 math names**: spoken Swedish math words ("a genom b") are not built; `MathText`'s flattened labels are used.
- **§3·7**:
  - "Hoppa över sidan" is not built (no skip in the core).
  - "Resuming mid-page restores the page, the fit and the scroll" works within the mounted session only (no persistence in the kit).
  - The per-tile ⤢ on image options is not built.
  - Pinch-to-zoom in place on the phone page uses the browser's own pinch; double tap opens the viewer.
- **§3·8 / §5 Q3 spacing schedule and a miss's age**: not in the view model. Defaults used:
  - the verdict chip says "Den flyttas fram" / "Tillbaka om en stund";
  - queue rows show section, question, trap and the week's errors;
  - "Kvar i dagens hög: N" and "Fällan bakom flera av dem" at the end are not shown (the host's pile after the round is not known);
  - "Fortsätt repetitionen · fråga 4 av 8" has no repetition-specific resume.
- **§3·8 the round in the bake-off**: `startDrill({kind:'repetition'})` maps to screen 6 with the quant session, whose request is `mixed`. The REP chip and the schedule chip are therefore unit-tested with a repetition session, not visible in the bake-off.
- **Theme**: production `ThemeMode` is light or dark only. Spår keeps round 1's dark switch; no System choice was added.

## Proposed UI copy (new in this batch; the spec's own wording reused where it gave one)

- **Öva**:
  - head: "Alla delprov"; "Repetera dina missar först, eller välj ett delprov. Ett varv är tio frågor." (phone "Repetera först, eller välj ett delprov."); without ripe misses "Välj ett delprov. Ett varv är tio frågor.";
  - station: "N missar är redo nu", "de äldsta först", "N i dagens hög", "Repetera N · ca M min", "Repetera 10 av 14";
  - station states: "Här samlas dina missar" (+ spec sentence), "Inget är redo just nu" / "N missar ligger i dagens hög och blir redo snart.", "Inget väntar i kön idag" / "Det du missar hamnar här och kommer tillbaka när det är dags.";
  - tiles: "N väntar", "Föreslås", "Öva XYZ · ca 8 min";
  - mixed: "Blandad övning", "10 frågor från alla åtta delprov · ca 9 min", "… — ett första smakprov som visar var du står.";
  - trap: "Återkommande fälla", "Tre av dina missar hör till samma fälla: …", "Riktad repetition · 5 min".
- **Bara ett delprov**: "Bara ett delprov", "N redo", "Alla delprov", "Stäng".
- **Repetera**:
  - head and queue: "Repetition", "Dina missar", "Repetition · bara KVA", "Repetera N av M, de äldsta först. Ungefär N minuter.", "Klart. Det du svarar rätt på flyttas fram i schemat.", "+ N till väntar i kön och kommer i nästa omgång.";
  - rows and the rest of the pile: "N missar till blir redo senare idag", "Visa dem" / "Dölj dem", "Fälla:", "N fel den här veckan";
  - start and empty states: "Starta repetition · N frågor", "Inget är redo just nu. N missar blir redo om en stund.", "Inget väntar i kön idag. …", "Till Öva".
- **Kvantfråga and DTK**:
  - tray: "Taktik", "⇧ + bokstav stryker", "T döljer", "Z förstorar";
  - Facit: "Visa uppgiften", "Förstora sidan", "Visa figuren", "Visa mer av uppgiften" / "Visa mer av sidan", "Fäll ner facit" / "Fäll ner frågan", "Klart med övningen";
  - figures and pages: "Hämtar figuren…" / "Hämtar sidan…", "Figuren / Sidan gick inte att hämta.", "Försök igen", "Sidan saknas.", "Bilden saknas", "sida n", "Rotera sidan";
  - viewer: "Zooma in", "Zooma ut", "Hela figuren", "Facit ligger kvar bakom.";
  - empty sitting: "Inga frågor här".
- **The end of a round**: "Övningen klar", "… är klar", "Allt satt.", "Tillbaka till Öva", "Tillbaka till mönstret", "Repetition klar", "N av M satt", "N flyttas fram i schemat. N kommer tillbaka om en stund.", "Ingen flyttades fram den här gången.", "Den flyttas fram", "Tillbaka om en stund".
- **Idag without an optional**: "N steg. Planen tar ungefär M minuter.", "Påbörjad för mer än en vecka sedan", "Påbörjad på telefonen", "Veckan", "N dagar den här veckan", "Prognosen visas när du har svarat i både den verbala och den kvantitativa delen.", "Nästa", "Börja · N min".
- **Facit**: "Slå upp i Uppslag".
- **Unbuilt destination** (only seen when a host does not move): "Den här sidan är inte byggd än i Spår. Menyn och kontot fungerar redan härifrån."
- The approved ÖVNINGSTEXT copy and the estimate caveat are unchanged (from `data.copy` and `prognosis.caveat`).

## Verification

From `app/` on the final tree:

| Check | Result |
| --- | --- |
| `pnpm typecheck` (`tsc -b --noEmit`) | PASS, no errors. |
| `pnpm lint` | PASS: "Checked 488 files … No fixes applied. Found 4 infos." The 4 infos are the pre-existing ones in unrelated files that the Lager and Instrument worklogs also report. |
| `pnpm exec vitest run src/components/devbake/redesign/c-spar/Spar.test.tsx` | PASS, **83/83**: the shared contract (54 checks, screens 1–8 × desktop/phone, both themes) plus 29 Spår tests. |
| `pnpm test` (whole app) | PASS: **Test Files 108 passed (108), Tests 1813 passed (1813)**. No shared test fails with screens 5–8 declared. |

The 29 Spår tests cover:
- **Idag**: optionals absent (no "Pausad", no "osäkerhet", "3 dagar den här veckan"), plan routing, leading with the plan when nothing resumes, host navigation and account actions.
- **Öva**: the one pill in each state (ripe, nothing ripe, new reader), Enter starts it, the path's spoken name, official names and DTK's "10–13", the in-place scope with focus in and back on Esc, the phone modal sheet, and the trap threshold.
- **Repetera**: path, rest of the pile on request, back link, scope → eyebrow, spoken h1 and scoped start, ten per round + "+ 4 till", no empty start, the suggested-section and "Till Öva" pills, and no "återlärt" claim.
- **Kvantfråga**: KVA regions and option names, NOG list and option names, letters limited to the item, Shift strikes, Esc and digits never exit, Space locks, the controller's verdict stands, the folded hint, a missing explanation, the end's next step and back, the REP chip and schedule chip, and the phone answer bar → half sheet → "Visa uppgiften".
- **DTK**: a failed page blocks pointer and keyboard grading, then retries; a missing page; fit radios and rotation; the viewer's zoom, arrow keys kept from window listeners, strip answering, and Esc closing with focus restored; the phone peek with the whole question.
- **Läsfråga**: the session from context, controller grading, no clock from zero on a resumed sitting, a missing explanation, the framework link, and Space only once something can be advanced.

### Visual check (the sandbox could run Vite + Playwright)

- **Why not the bake-off route**: a plain `vite` run in one command is unreachable from another (each sandboxed command has its own network), and `/dev/redesign-2026-bakeoff` cannot boot in this worktree. `main.tsx` needs `VITE_CLERK_PUBLISHABLE_KEY`; no `.env.local` here, and the user's env file was not borrowed. A placeholder key gets past the check, but then Clerk fails to load its script.
- **The harness**, so the coordinator's pass is still needed on the real route:
  - One Node process (scratchpad only, nothing in the repo) starts the app's own Vite with `root: app/`.
  - It serves a scratch page that mounts the exported `Redesign2026Bakeoff` (`d=c`, bare) without the auth shell, and shoots with Chromium at 1440 × 900 and 390 × 844.
  - Bare imports from the scratch entry resolve as if `main.tsx` made them (one pre-bundled React).
  - Google Fonts were reachable: Bricolage and Figtree render.
- **Shot**:
  - screens 5–8 × desktop/phone × light/dark (the 16 views);
  - interaction states: quant Facit after a wrong pick, KVA, NOG and the end screen (desktop, phone, dark), the DTK viewer (desktop, phone light and dark), and "Bara ett delprov" (Öva and Repetera, desktop and phone).
- **Fixed from the shots**:
  - the REP chroma leaking into nested section stops (grey rings);
  - the DTK tray's fade spanning the 1000 px page (now the tray's own width);
  - the quant sheet toggle reading "texten" (now "uppgiften" / "sidan");
  - KVA option D wrapping under its glyph (the glyph now has its own column);
  - "Meningskomplettering" crowding its tile (a soft hyphen in the name);
  - the phone viewer's wrapping toolbar and tall strip (one-line tools, ✕, 2 × 2 options);
  - 30 px stops in the scope list (now 36 px).
- **Round 1 regression, before vs after**:
  - The original Spår files came from `../audit-main`, read-only; their git blob hashes were checked equal to this branch's `HEAD` for all six files.
  - Old and new rendered under the same frozen clock with animations disabled, and the PNGs were compared.
  - **Screens 1–4 × desktop/phone × light/dark: 14 of 16 byte-identical.** Phone screen 3 (Facit), light and dark, differs only below threshold: no pixel's summed RGB difference exceeds 24 of 765 (antialiasing).
  - Getting there needed two fixes: no `tabular-nums` or `line-height` override on stops (the top bar's numerals), and round 1's exact text-node splits for four Idag strings.
- **Not measured**: rendered contrast ratios. The new screens use only Spår's existing tokens: body text is `--sp-ink` / `--sp-ink-2` on card or canvas; band text is the section's ink on its tint, as round 1's bands. Also not measured: 320 px reflow, WCAG text-spacing and reduced motion — for the coordinator's pass.

### Repo hygiene

- Changes are uncommitted and limited to the write set:
  - modified: `Spar.tsx`, `SparDrill.tsx`, `SparHome.tsx`, `meta.ts`, `spar.css`, `sparParts.tsx`;
  - new: `Spar.test.tsx`, `SparOva.tsx`, `SparQuant.tsx`, `SparRepetera.tsx`, and this worklog.
- `routeTree.gen.ts` is untouched.
- `git status` also shows empty, read-only files that are not mine and not part of the change: `.bash_profile`, `.bashrc`, `.gitconfig`, `.gitmodules`, `.idea`, `.mcp.json`, `.profile`, `.ripgreprc`, `.vscode`, `.zprofile`, `.zshrc` at the worktree root, and `app/.claude/`, `app/.mcp.json`. They are the sandbox's mount points for protected paths (0 bytes, created 01:00). Do not commit them.

## Handoff

- Done: screens 5–8 built at both widths and themes; 1–4 on kit v2 and pixel-identical; `meta.screens = [1…8]`; the contract and Spår tests; all gates green; a visual self-check through the harness.
- Left for the coordinator:
  - the 16-view pass per screen on the real `/dev/redesign-2026-bakeoff?dev=1&d=c&s=…` route;
  - contrast, 320 px, text-spacing and reduced-motion measurement;
  - review, commit and PR;
  - deciding the spec gaps above (persisted calm, schedule data, adaptive-review request, skip, figure descriptions, the source of a sitting).
- The bead is parked deferred and unassigned, not closed.

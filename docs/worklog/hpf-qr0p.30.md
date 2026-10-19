---
bead: "hpf-qr0p.30"
project: "hpfetcher"
session: "ci-wisp-ujpcpgy"
status: "implemented_uncommitted"
---

# Worklog — hpf-qr0p.30

Direction H · Ljuskägla, round 2 batch 1: screens 5 Öva, 6 Kvantfråga, 7 DTK and 8 Repetera, plus screens 1–4 moved from round 1's fixtures and `useDrill` onto kit v2 (`useDirectionData()`, `useDrillCore`).

## Findings

- 2026-10-19 ~21:00 UTC: claimed through the managed hook. The worktree was clean on its own branch at base `5953117d354c54c3b1174f61c2fe8ff3302b9aaf` (kit v2, hpf-qr0p.7, merged). The work is left uncommitted and the bead is not closed, as the brief requires.
- Read: `docs/redesign/kit-v2.md`; the shared kit files (`viewModel.ts`, `directionData.tsx`, `drillCore.ts`, `contract.ts`, `r1Kit.ts`, `r2Fixtures.ts`); the round-1 brief; the direction spec `docs/redesign/directions/h-ljuskagla.md` (shared rules, §5–§8); the worklogs of hpf-qr0p.6 (round 1) and hpf-qr0p.40 (spec); and the app's `MathText`, `KvaPrompt`/`splitKvaPrompt`, `lib/nogPrompt`, `QuestionFigure` and the bake-off stage.
- Baseline before any change: the direction's own suite passed 25/25.
- **Content defect in a shared fixture (not editable here).** `QUANT_EXPLANATIONS['host-2025-kvant2-XYZ-009']`, step 9, closes its second math fence in the middle of `\dfrac{2 \cdot 7 \cdot 9}{7}`. The text `9}{7}` falls outside the math, so KaTeX renders that segment as a parse error showing raw LaTeX. Every direction that renders the steps is affected. The fix belongs in the explanation corpus (and its copy via `app/scripts/redesign-fixtures.mjs`). No marker character ever reaches the screen. The direction's test checks rendered math on every field except that step.
- **Brittle shared test (outside the write set).** `Redesign2026Bakeoff.test.tsx:163` asserts that the "Om" panel says "Ingen riktning har byggt den här skärmen än." for screen 7. It pins the registry as it was when the kit merged. Now that this direction declares screen 7, the panel correctly says "Byggd i Ljuskägla.", and the assertion fails. Every batch-1 direction that declares screen 7 will hit the same line. Suggested fix, in the shared test: derive the expected text from `DIRECTIONS.filter((d) => builds(d, 7))`.
- **jsdom quirk.** `querySelectorAll('button:not(:disabled), [tabindex="0"]')` returned its results grouped by selector, not in document order. The viewer's focus trap therefore filters a single `*` query with `matches()`, so the order is correct in every engine.

## Decisions

- **Navigation through actions, with round 1's local fallback for the doors.**
  - Frame-level navigation asks the host and also opens the page inside the frame: the five doors (`actions.go`), Home's plan rows (`actions.openPlanItem`), the trap link (`actions.openLesson`) and Repetera's "Till Öva".
  - The stage remounts the frame for each screen, so a host that navigates (the bake-off) always wins.
  - A host that does not navigate keeps working as round 1's doors did. This covers a bare test mount and the real-app `DirectionShell`, which mounts directions without a provider (`NOOP_ACTIONS`).
  - Controls on the new screens only ask the host: Öva's section rows, mixed drill and Repetera door; Repetera's start; quant Avsluta and "Till Öva". The shared contract requires that these do not move the screen locally. For example, Öva's test clicks Repetera and then expects the mixed-drill row to still be there.
- **Round-1 transitions stay on `onScreen`, as the shared contract asserts.** Resume → 2, lock → 3, Nästa → 2, Avsluta → 1. The account's theme toggle stays on `onTheme`, the one path that works in every host.
- **Changes to screens 1–4 versus round 1, all deliberate wiring to the new screens.**
  - The LÄS receipt's "Nästa: Repetition" now asks `openPlanItem`, so the bake-off opens screen 8. Round 1 showed a local Öva placeholder on screen 1.
  - Home's plan rows and trap link ask the host. In the bake-off, Repetition opens screen 8 and the lesson row opens 12 (the "Inte byggd än" card). ORD-övning has no bake-off screen (the kit maps ORD to none), so the frame falls back to Öva in place.
  - Look and drill behaviour are otherwise unchanged. Before the test file was rewritten, 23 of round 1's 25 tests passed untouched against the migrated code. The two that failed were the same flow's final receipt step at both widths: it expected the local Öva placeholder and now asserts Repetera. The hand-copied contract block passed and is now replaced by `describeDirectionContract`.
- **Öva's lamp follows the spec's precedence (§5):** a paused session → "Fortsätt övningen"; else the weakest section → "Öva KVA"; else "Starta blandad övning". The fixtures always have a paused session, so the bake-off lights the resume. The weakest section is marked in its row, in words plus the warm beam. A null `weakest` (low confidence) is never called "svagast".
- **One data-driven quant drill for 6 and 7.** The layout is chosen per question: a raster page (DTK) gets the figure workspace; anything else gets the problem field. A mixed session, as the real app will send, therefore needs no separate screen.
- **The enlarged figure renders inside the direction's root** (absolutely over the drill), not in a portal, so the theme reaches it. This answers the spec's §7 note about `QuestionFigure`'s portal. Raster pages keep their own colours on an opaque backing in both themes; nothing is inverted or tinted.
- **The LÄS drill keeps Avsluta → Idag.** The spec asks new workflows not to copy that hard-coded return. The quant/DTK Avsluta calls `actions.drill.exit`, which the bake-off maps to "the screen the drill was started from". The round-1 contract for screen 2 asserts `onScreen(1)`.

## What was built, per screen, and why it is Ljuskägla

The vocabulary is round 1's throughout:
- `--lj-*` tokens unchanged (no new colour);
- Manrope for the interface, Spectral for reading and display;
- one opaque lamp surface with the warm beam on its left edge and the asymmetric `4px 20px 20px 4px` radius;
- everything else in open, divided rows in the shade;
- select, then confirm;
- 160 ms colour transitions only.

- **5 · Öva** (`LjuskaglaOva.tsx`)
  - Built: a page head; one lit lamp (`.lj-resume`); the Repetera doorway beside it on desktop and right under it on a phone (§5 phone order); the eight sections in fixed exam order as full-width row buttons; a quiet mixed-drill link; and, in the shade column, what "väntar" and "redo nu" mean plus the common traps (each opens its lesson).
  - Each row shows code, name, a quiet note (svagast / inte övat än / för lite underlag än / when last practised), score and "N väntar", with a full accessible name. A row starts its section's drill.
  - Repetera's door says "N redo nu · M i dagens hög", "Inget är redo just nu" or "Inga missar än", and is there even at zero.
  - Why H: a solitary pool of light above an unboxed, shaded list, not eight cards. The weakest section gets the same warm margin line that marks the lit paragraph in the reader.
- **6 · Kvantfråga** (`LjuskaglaQuant.tsx`)
  - Focus shell: `DrillHead` (Avsluta, section and place, clock, account, warm progress line), extracted from the LÄS drill and shared by every drill.
  - Desktop: the problem sits as a lit field (lamp surface, beam edge) on the paper column, beside the room-coloured answer column with ruled rows.
  - KVA: split with the app's `splitKvaPrompt` into the condition and "Kvantitet I / II", read together in one pool of light (side by side when they fit, stacked otherwise), with its four fixed options.
  - NOG: split with `parseNogPrompt` into the question and statements (1) and (2) in the same pool. Its canonical "Tillräcklig information för lösningen erhålls" leads the five options.
  - XYZ: rendered whole through `MathText`.
  - Phone: one scroll (problem, then answers), with the action bar in reserved space below, so the fifth NOG option is never covered.
  - Feedback replaces the answers while the problem stays in view. `LjuskaglaFeedback` keeps round 1's order and is now math-aware (`MathText` in every field, `Rich` keeps the "(steg N)" jumps). A missing explanation gives "Förklaring saknas för den här frågan." and invents nothing.
  - The receipt shows real "N av M rätt" and one "Till Öva".
  - Keyboard: only the question's own letters, Shift+letter strikes, Enter/Space confirm and advance, Escape never leaves, 1–8 are left to the switcher. Stills show no clock and take no keys.
  - Why H: the problem gets the reader's lit-paragraph treatment instead of a calculator dashboard, and answers are quiet rules.
- **7 · DTK** (`LjuskaglaQuant.tsx`, figure workspace)
  - Desktop: the real page (*Pensioner*, `host-2025-kvant1-p16.jpg`) takes the wider paper column, fitted to width and scrollable, with a warm beam along its edge, its source ("Underlag · Hösten 2025 · Provpass 1"), and "Förstora figur" and "Rotera" tools. The question column stays steady beside it.
  - Rotation turns the page in quarter turns. The box takes the turned page's shape, so nothing is clipped.
  - "Förstora figur" opens an opaque, full-stage dialog: focus starts on Stäng and is trapped; there are zoom −/+ (100–400 %), Rotera and "Hela bredden", plus the keys +, − and R. Answer keys wait while it is open. Escape closes the viewer, never the drill, and focus returns to "Förstora figur" with the selection kept.
  - Phone: page first, question in the same space-reserving peek/open/full sheet as the LÄS reader. Enter opens the sheet; feedback goes full and makes the page inert; "Visa underlaget" folds it.
  - Why H: a warm workspace edge and a steady question column, with the page's own colours on an opaque backing.
- **8 · Repetera** (`LjuskaglaRepetera.tsx`)
  - "Till Öva" back link (Repetera lives under the Öva door). One bounded lamp: "N frågor redo nu · De äldsta först", with a single "Repetera N frågor" capped at the session size (the note says so when capped).
  - Beside it, "I dagens hög", the whole pile and what becomes ready later. Below: section filters (only sections with due items; pressed chips take lamp and beam), "Redo nu" and then "Resten av dagens hög". Each miss shows its section, a two-line preview of the question (math rendered) and its trap; later items say when they become ready.
  - A filter narrows the start to `{ kind: 'repetition', section }`.
  - Empty states: "Inga missar än" or "Inget är redo just nu", each with "Öva istället" and no start.
  - Why H: a lit, finite invitation surrounded by quiet future work, with no red counters and no debt framing.
- **1–4 migration**
  - Home reads `data.home` and renders every optional field only when present: pause time, minutes left, device, goal, target, delta and the plan's `primary`. Without a resume, the lamp offers the plan's first step (still `rd-resume`). Without a total, the estimate says when it will appear.
  - The LÄS drill runs on `useDrillCore` with `data.drills.reading` and `actions.drill`, through a direction-local `useSwitcherDrill` that keeps round 1's switcher sync (Facit grades in place, Läsfråga reopens). The badge and note show only for a synthetic passage; the title comes from the passage when it has one.
  - The account, collapse and spotlight are unchanged.

## Spec gaps (built only what kit v2 carries; rendered gracefully without the rest)

- **Shared rules, "States":** no screen in the view model carries loading, partial or error flags. None of the loading skeletons or failure copy (§5 "Kunde inte hämta repetitionskön", §6/§7 retry for a missing diagram, §8 "the queue could not load") is built.
- **§5 Öva:**
  - A resumable session comes from `data.home.resume`; `OvaView` has none of its own.
  - The "recommendation and its reason" is only `weakest` and its score; there is no reason text in the view model.
  - Done/refresh after a session is not represented.
- **§6 Kvantfråga:**
  - "Läs om mönstret" to 12 with a return to the same question is not built (Uppslag is batch 3); the framework line stays text.
  - An essential missing diagram blocking the answer needs figure-load state the kit does not carry.
  - SVG figures render as `<img>` on the opaque backing, not inlined with `currentColor`: no fixture exercises one.
- **§7 DTK:**
  - Figure title/caption: `DrillFigure` has only `alt` (the kit's "Underlag till uppgift 29").
  - "Samma sida · n av m" is computed from the session's questions sharing a page. The DTK session carries one question, so it never shows with the fixtures.
  - A structured text/table equivalent for the page: owner question 4.
  - Image answer options render (`option.figure`, alt = its text) but no fixture exercises them.
  - Drag-to-pan is not built; panning is native (wheel, touch, scrollbars) plus arrow keys on the focusable page region.
  - The spec's stress case `var-2019-kvant1-DTK-029` is not in the kit. Built against the kit's `host-2025-kvant1-DTK-029`.
- **§8 Repetera:**
  - "Klart för nu" (a cleared queue) cannot be told apart from "Inget är redo just nu" without completion history.
  - No "Fortsätt repetitionen" resume; no `?done=` receipt data.
  - In the bake-off a section-scoped repetition maps to the same screen 6 (kit).
- **Focus shell:** "returning restores the originating screen and its selection". Quant/DTK return through `actions.drill.exit`, but selection inside the origin is not restored, since Öva has none to restore. LÄS keeps round 1's Avsluta → Idag (see Decisions).
- **ORD/MEK:** their rows ask `startDrill`, but the bake-off has no screen for them (kit: "ORD/MEK none"), so the click does nothing there. Production routes them normally.
- **Theme:** production `ThemeMode` is light or dark only; no System theme was built. The opening theme stays whatever the host passes (owner question 7).

## Proposed UI copy (new in this batch; all Swedish, all proposed)

- **Öva:**
  - Page and lamp: "Välj din övning.", "Påbörjad övning", "{sektion} · fråga {n} av {m}", "Förslag för idag", "Ditt svagaste delprov just nu, uppskattat {x} av 2,0.", "Ett lugnt sätt att börja", "{n} frågor från alla delprov."
  - Rows: "Alla delprov", "Välj ett för att börja", row notes ("Svagast just nu", "Inte övat än", "För lite underlag än", "Övat idag / igår / för N dagar sedan"), "{n} väntar", the row's accessible name ("Öva {S}, {namn}, …, uppskattat {x} av 2,0, {n} väntar i repetitionen"), "Blandad övning · {n} frågor från alla delprov".
  - Door: "{n} redo nu", "{n} i dagens hög", "Öppna Repetera".
  - Shade column: "”Väntar” är missar i dagens hög. ”Redo nu” är de som är mogna att repeteras just nu.", "Vanliga fällor", "{S} · {namn} · {n} missar".
  - Taken from the spec: "Fortsätt övningen", "Öva {S}", "Starta blandad övning", "Inga missar än", "Inget är redo just nu".
- **Kvantfråga / DTK:**
  - New: "{A}–{D} välj · ⇧ + bokstav stryk · Enter svara", "Övningen är klar", "{n} av {m} rätt · under en minut / {n} minuter", "Underlag · {källa}", "Visa underlaget", "Förstorat underlag", "Stäng", "Zooma ut", "Zooma in", "{n} %", "Hela bredden".
  - New accessible names: "Rotera figuren 90 grader", "Underlaget. Rulla för att se hela sidan.", "Det förstorade underlaget. Rulla för att panorera.", "{alt}, förstorat".
  - Taken from the spec: "Välj svar", "Förklaring saknas för den här frågan.", "Frågan saknar fullständig text.", "Till Öva", "Förstora figur", "Rotera", "Samma sida · fråga {n} av {m}".
  - Reused from round 1: "Svara {L}", "Välj ett svar", "Nästa", "En stund som räknas.".
- **Repetera:**
  - New: "Redo nu (· {S})", "{n} frågor redo nu", "Ett pass tar {n} åt gången.", "Ett kort pass, sedan är du klar för nu.", "Repetera {n} frågor i {S}", "När du svarar fel hamnar frågan här, så att du möter den igen när det är dags.", "{n} frågor blir redo senare.", "I dagens hög", "Högen är tom.", "{d} är redo nu, {l} blir redo senare.", "Allt i högen är redo nu.", "Visa delprov", "Alla", "Resten av dagens hög", "Frågetexten finns inte här.".
  - Taken from the spec: "De äldsta först.", "Repetera {n} frågor", "Öva istället", "Till Öva".
- **Home, only when a field is absent:** "Din övning finns kvar" (a non-reading resume), "Ungefär {n} minuter kvar i övningen.", "Pausat på din {enhet}", "{n} dagar med övning den här veckan", "Prognosen visas när du har svarat på frågor i båda provhalvorna.", "Dagens första steg", "Välj en övning", "Alla delprov finns under Öva.", "Börja: {titel}", "Resten av dagen", "klar".

## Accessibility notes (token reasoning, not a browser audit)

- No colour token was added or changed. Every new text uses round 1's measured pairs: ink, soft or accent on room, paper or lamp.
- I computed one new pair: the beam colour as text (light #826336) on the paper hover background is about 4.3:1, below AA. The weakest row's code is therefore ink; the beam appears only as a 3 px bar (about 5.1:1 against the room, above the 3:1 for non-text).
- All new controls are native buttons, inheriting round 1's 44 px minimum and 2 px focus ring. The two scrolling figure regions are focusable, labelled sections whose ring draws inside.
- Reduced motion and stills inherit round 1's global rules. Forced colours outline the lamp, problem and page, and the pressed filter.

## Verification

- `pnpm typecheck` (from `app/`): exit 0, no output.
- `pnpm lint`: exit 0. "Checked 479 files … Found 4 infos". All four are pre-existing and outside this write set: three `useIndexOf` in `LandingBakeoffR3/R4A/R4C.tsx` and one `noUselessFragments` in `l12/M3.tsx`. `biome check` on the direction folder: no diagnostics.
- `pnpm test`: **"Test Files 1 failed | 104 passed (105) · Tests 1 failed | 1590 passed (1591)"**. The one failure is `Redesign2026Bakeoff.test.tsx > bake-off switcher > says in the "Om" panel which directions have built the screen` (line 163, see Findings). It is caused by declaring screen 7, which the bead requires; the assertion is outside the write set.
- The direction's own suite: 94/94.
  - The shared contract (`describeDirectionContract(meta, Ljuskagla)`) for screens 1–8, desktop and phone, light and dark.
  - Round 1's behaviour on the drill core.
  - Optional fields absent on Home.
  - Öva: lamp precedence, fixed order, weakest in words, door states, traps, and the bake-off journey Idag → Öva → KVA → Avsluta → Öva → Repetera.
  - Kvantfråga: KaTeX, KVA terms, NOG statements and lead, keys, missing explanation, receipt, phone footer, stills.
  - DTK: alt, src, rotation, the viewer's focus, keys, zoom, Tab trap, Escape and return focus, phone sheet.
  - Repetera: order, filter requests, session cap, empty states, return, and start → Avsluta in the bake-off.
- CSS: every rule is scoped under `.ljuskagla`; braces balance (352 opening and 352 closing lines, none doubled).
- **Visual self-check not possible in this sandbox.** Vite started (`127.0.0.1:5199`, ready), but:
  - a second sandboxed command could not connect to it (curl exit 7: per-command isolation);
  - running a Playwright capture script was refused by this worker's command policy.
  No screenshots, browser contrast, text-spacing or real-font checks were made.
- **Coordinator:** please run the 16-view pass (desktop/phone × light/dark) for each of 5, 6, 7 and 8 at `/dev/redesign-2026-bakeoff?dev=1&d=h&s=<n>&w=<w>&t=<t>`, and recheck 1–4. Useful extra states:
  - 6: after answering, and on KVA and NOG (Nästa);
  - 7: "Förstora figur" on both widths, and the phone sheet open and full.
- **Stray files outside the delivery.** Eleven empty, read-only placeholders appeared at the worktree root at 23:31 local time, when a background command started: `.bash_profile`, `.bashrc`, `.gitconfig`, `.gitmodules`, `.idea`, `.mcp.json`, `.profile`, `.ripgreprc`, `.vscode`, `.zprofile` and `.zshrc`. They are the sandbox's bind-mount targets; `rm` from inside the sandbox fails with "Device or resource busy". They are not part of this work. Please delete them from outside the sandbox before delivery.

## Handoff

- **Done:**
  - Screens 5–8 built and declared (`meta.screens: [1…8]`).
  - Screens 1–4 on kit v2.
  - Direction tests on the shared contract.
  - All changes uncommitted, within the 13-file write set: 12 direction files plus this worklog. Three of them are new: `LjuskaglaOva.tsx`, `LjuskaglaQuant.tsx`, `LjuskaglaRepetera.tsx`.
- **Left:**
  - The shared test's screen-7 assertion: one line, kit owner or coordinator.
  - The XYZ-009 step-9 math fence: content corpus.
  - The screenshot pass and browser accessibility checks.
  - The stray placeholder files.
- **Next:** B2 (9–11) can reuse `DrillHead`, `AnswerRows`, the figure workspace and the hub vocabulary (`.lj-hub-*`, `.lj-rows`, `.lj-door`) in exam mode, without feedback.

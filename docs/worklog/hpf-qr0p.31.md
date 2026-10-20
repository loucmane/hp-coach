---
bead: "hpf-qr0p.31"
project: "hpfetcher"
session: "ci-wisp-a05dgh1"
status: "implemented_uncommitted"
---

# Worklog — hpf-qr0p.31

Direction H · Ljuskägla, round 2 batch 2: screens 9 Provpass (the hub and a running pass), 10 Provpassresultat and 11 Framsteg (with Historik).

## Findings

- 2026-10-20 ~01:37 UTC: claimed through the managed hook (session `ci-wisp-a05dgh1`). The worktree was clean on its own branch at base `d95d4385464e5a01d4f539ac0564fd092a69105e`, with the kit and this direction's batch 1 merged. All work is left uncommitted and the bead is not closed, as the brief requires.
- Read:
  - `docs/redesign/kit-v2.md`;
  - the shared kit (`viewModel.ts`, `directionData.tsx`, `drillCore.ts`, `contract.ts`, `r1Kit.ts`, the Provpass/Framsteg parts of `r2Fixtures.ts`);
  - the bake-off host (`Redesign2026Bakeoff.tsx`) and the real-app `DirectionShell`;
  - the direction spec `docs/redesign/directions/h-ljuskagla.md` (shared rules, §9–§11, the handoff and owner questions);
  - the round-1 brief;
  - batch 1's worklog (hpf-qr0p.30) and Lager's batch-2 worklog with its review fixes (hpf-qr0p.19), for the pitfalls;
  - the production `MockRunner` and `ConfirmSheet` for timing, keys and copy.
- **Shared tests:** none failed. `Redesign2026Bakeoff.test.tsx` and the `DirectionShell` tests derive their expectations from the registry and pass with screens 9–11 declared.
- **B1's quant parts are module-private.** `LjuskaglaQuant.tsx` keeps `problemParts`, `Problem`, `FigurePage`, `FigurePane`, `FigureViewer` and `useFigureView` unexported, and it is outside this write set. The running pass needs the same surfaces, so exam-ready versions now live in `LjuskaglaParts.tsx`, the direction's shared surface. `LjuskaglaQuant.tsx` still has its private copies. Follow-up (needs that file in a write set): import from `LjuskaglaParts` and delete the copies.
- **B1's practice drill does not gate on figures.** `LjuskaglaQuant.tsx` lets Svara, Enter and Space grade a DTK question before its page has loaded. That is the sibling-review pitfall, outside this write set. The running pass built here does gate (see Decisions).
- **Sandbox side effect (cleaned).** Changing directory inside this session made the sandbox create mount-point placeholders in each directory entered: `.mcp.json` in `app/` and down to `h-ljuskagla/`, and `.claude/` in `app/` and `h-ljuskagla/`. The `.mcp.json` ones vanished once commands ran from the worktree root again. I removed the two empty `.claude/` directories with `rmdir`. Nothing of them is tracked. From then on every command ran from the root with `pnpm -C app …`.
- **Pre-existing stray files:** the eleven empty dotfile placeholders at the worktree root (`.bash_profile` … `.zshrc`) are still there, untracked. They are not part of this work, and `rm` from inside the sandbox fails with "Device or resource busy". Please delete them from outside the sandbox.

## Decisions

- **One flow, owned by the root.**
  - `Ljuskagla.tsx` keeps the pass asked for (`requested`) and whether one was just abandoned.
  - The runner shows only when the host's `provpass.running.passId` matches the pass asked for. Any other selection asks the host (`startProvpass(id)`) and waits in the hub ("Provpasset förbereds"). The wrong pass never runs.
  - A host that answers the start by showing Provpass (screen 9) keeps the flow. Any other screen ends it, so a hand-in (→ 10) and a later return to 9 open a fresh hub.
- **The start's confirmation sits at the frame level.** The whole shell (sidebar or phone bar included) waits `inert` behind it.
- **Gates are in-root dialogs, not native `<dialog>`.** `Gate` in `LjuskaglaParts.tsx` is `role="dialog"`, `aria-modal`, marked `data-rd-keyscope`, and covers the stage over an opaque dusk.
  - Focus starts on the safe choice and Tab stays inside. Focus that leaves for the backdrop comes back.
  - Escape takes the safe choice.
  - Through `useGate`, focus returns to the trigger once the background is live again: a layout effect, after `inert` is gone.
  - Like B1's figure viewer, it renders inside the direction root, so the theme and the stage (phone frame, zoom) contain it. The accept button is `rd-confirm`.
- **The clock, decided once.**
  - The deadline and "already out of time" are fixed when the runner mounts.
  - It ticks locally once a second. The host's own `remainingSeconds` reaching zero hands in through the same one-shot guard.
  - The deadline is also checked at the moment of input, for timers a background tab held back.
  - The display is the lower of the two clocks.
  - A pass already out of time shows "Tiden gick ut." and never a result or a hand-in.
  - Time-up closes any open gate or viewer.
  - A five-minute note appears once (`role="status"`), with no flashing.
- **Keys in a running pass (spec §9 is more specific than the brief).**
  - The question's own letters choose; ←/→ change the question.
  - The switcher's digits 0–9 are held (`preventDefault` in the capture phase) wherever focus is, while the pass runs, is being handed in or has failed. The runner root is also `data-rd-keyscope`.
  - Inside a figure's pan region (`data-lj-pan`) the arrows keep their native scroll.
  - There is no global Enter or Space advance, as in the production runner ("no Enter-advance"). Enter and Space keep only their native meaning on focused controls; the practice drills keep their Enter/Space advance.
  - Escape never leaves: it closes a gate, the viewer or the account first.
- **Answers and figures.**
  - Choosing only records the answer; nothing is graded or explained before the hand-in.
  - Answers can change until time is up and are locked after the hand-in.
  - A figure question's options (and its letter keys) wait until every required image has loaded: the page or diagram, and each image option. Each is tracked by place and source, so a page shared by consecutive DTK questions stays ready ("Samma sida · fråga 2 av 3"). A new source starts over, and an image complete from the cache counts as loaded.
  - A failed image offers a retry that mounts a fresh image.
  - Moving between questions is never blocked.
- **Lists that change.**
  - The position is clamped, and kept clamped, when the pass shrinks.
  - The runner is keyed by pass id.
  - A picked pass that disappears falls back to the suggested one.
  - Answers and flags the host sends are merged under the reader's own changes.
- **Labels match actions.**
  - Till Öva → `go('ova')`, Till Framsteg → `go('framsteg')`, Till Provpass → `go('provpass')`.
  - Öva {S} → `startDrill({ kind: 'section', section })`.
  - Öppna Repetera → `openRepetera()`, Läs om mönstret → `openLesson(id)`.
  - Every result row → `openProvResult(its id)`.
  - Each frame action also opens its page locally, for a host that does not navigate, except results other than the one the frame holds, which are only asked for.
- **The reading text is shared, not forked.** The LÄS drill's paragraphs are now `PassageParagraphs` in `LjuskaglaParts.tsx`. The LÄS drill and a running pass both use it, with the passage's own `lang` (`en` for ELF). Screens 2–3 are unchanged; their tests pass untouched.
- **`Account` moved to `LjuskaglaParts.tsx`.** This avoids an import cycle with the frame; its behaviour is unchanged.
- **Focus.**
  - A running pass focuses the question heading on each new question.
  - A hand-in moves focus to its status.
  - The result focuses its heading on mount: where a hand-in lands.
  - An abandoned pass leaves focus on the hub's note.

## What was built, per screen, and why it is Ljuskägla

The vocabulary is batch 1's throughout:
- the `--lj-*` tokens, with one addition: `--lj-dusk`, the room with its lights down behind a gate (no text sits on it);
- Manrope for the interface, Spectral for numbers on display and for reading;
- one opaque lamp surface per state, with the warm beam on its edge and the asymmetric radius;
- everything else in open, divided rows in the shade;
- 160 ms colour transitions only.

- **9 · Provpass, hub** (`LjuskaglaProvHub`, `LjuskaglaProvpass.tsx`)
  - The halves are H's pill filters (lamp and beam when pressed), above one lit pass: the rhythm's half, its least-seen pass suggested. The lamp shows sitting and pass, half, questions and minutes, "Sett förut", the half's sections, "Starta provpass" and a footnote that the clock waits for confirmation.
  - Below it, a register of that half's real passes as unboxed rows ("sett N av M"). The chosen row carries the same warm margin line as the lit paragraph.
  - The quiet margin holds "Din rytm" (the prescription and exposure), earlier results (each opens its result) and the rules.
  - A partial pass says "39 av 40 frågor tillgängliga." before it starts.
  - An empty half offers the other half, never an empty start.
  - Phone: the same order in one column.
  - Why H: a solitary lit choice above a shaded register.
- **9 · Provpass, confirmation** (`PassConfirmation`)
  - The room's lights go down and the decision stays lit.
  - It shows the named pass, "Kvantitativ halva · 40 frågor · 55 minuter", what was seen before, and the four rules.
  - "Tillbaka" is the safe choice; "Starta nu" (`rd-confirm`) starts it.
- **9 · Provpass, running** (`LjuskaglaProvRunner`)
  - Focus shell, H's drill head: "Avbryt provpass" (asks first), the section and place, a steady Spectral countdown ("31:12 kvar"), a quiet "Lämna in", the account, and the warm line filling with answered questions.
  - The answer map is quiet 44 px cells per section run: answered = paper, unanswered = dashed, and the warm beam under the current question. A flag glyph marks flagged questions (only when the pass carries flags). On a phone the map is behind "Svarsöversikt · N av 40 besvarade" and closes when a cell is chosen.
  - The task takes practice's surfaces in exam mode:
    - a lit problem field (KVA quantities, NOG statements, math via `MathText`);
    - a DTK page on its warm edge with Förstora figur / Rotera and the viewer;
    - the reading room's paragraphs, a paragraph lit on demand.
    - On a phone, page and text questions keep the peek/open/full sheet; problems take one scroll with the action reserved below.
  - "Ditt svar: B", Markera, Föregående and "Nästa fråga", which becomes "Granska svar" at the last question.
  - The hand-in gate names what is blank ("24 frågor är obesvarade: 17–40.") and what is marked. Then the answers lock and "Provpasset lämnas in …" takes focus. A synchronous failure says so and offers a deliberate retry.
  - Why H: the work area stays lit while the shell recedes; the map is a quiet index with one current-location beam.
- **10 · Provpassresultat** (`LjuskaglaProvResult`)
  - One lit receipt: the raw count first ("27 / av 40 rätt", in large Spectral numerals).
  - A missing-question line when the pass lacked some, and "38 besvarade · 2 obesvarade · tid 53:30 av 55:00".
  - The score with its label ("Normerat (härlett)" / "Skattad"). Its method is written out beneath it, not in a tooltip.
  - The honest review limitation, and one next step: "Till Öva", or "Till Framsteg" when nothing was missed.
  - Below it, an open ledger: a real table (caption, row and column headers) of each section's correct and time against its share of the 55 minutes, with "N min över andelen" in words.
  - The quiet margin holds "Om passet" (pass, seen before, time) and "Tidigare pass av samma slag" (each opens its result).
  - A trap, when supplied, shows its pattern and "Läs om mönstret".
  - Why H: a plain receipt lit against a quiet room.
- **11 · Framsteg with Historik** (`LjuskaglaFramsteg.tsx`)
  - A quiet overview: the total in Spectral on a thin track with a target tick, only the known halves, the change and target when supplied, and the approved caveat verbatim.
  - Then one lit next step: the first focus section by name, why ("Behöver mest övning just nu: uppskattat 1,2 av 2,0 på 400 svar."), "Sedan: DTK och KVA." and "Öva XYZ". Without a basis it offers "Välj övning".
  - "Vecka för vecka": pooled weekly accuracy as a score, one accent line that breaks at weeks without answers, labelled ends, and the target as a distinct dashed line. A summary sentence and a "Visa värden" table say the same.
  - "Alla delprov": the eight sections in fixed order as an open ledger: the score with its ± band, then the evidence in words (answers, too little evidence, the week's change in percentage points, when last practised). An unpractised one says "Inte övat än", never 0.
  - The shade column:
    - "Veckans rytm": days this week, the current run and the longest, answers, accuracy and minutes, with "En dag utan övning tar inte bort något du har byggt upp.";
    - "Dagarna": the 84 days as a field of ink (aria-hidden), a summary, and a "Visa dagar" week-by-week table where unknown days are "–", distinct from 0;
    - Repetition, with totals and "Öppna Repetera".
  - Historik: finished drills and repetitions grouped by day, newest first. Provpass results keep their own doorway below.
  - Desktop shows everything, with "Översikt · Historik" as in-page jump links. A phone has a real two-tab view (roving tabindex, ←/→/Home/End, `data-rd-keyscope`).
  - Why H: evidence in a calm ledger, and light only on the next useful action. The beam is kept for the recommendation; charts use the accent ink.

## Spec gaps (built only what kit v2 carries)

- **Shared "States":** these screens' view models carry no loading, partial, stale or error flags. No skeletons or failure copy were built except where the direction itself knows the state: the image gate, the wait for a pass, a synchronous hand-in failure, expiry on entry.
- **§9 Provpass:**
  - "Riktigt pass / Genererat": the kit has no generated pass (no id, source or start), so no mode switch was built. It would be inert.
  - Only the one `provpass.running` snapshot can run. Other passes wait for the host.
  - No action records picks or flags, abandons a pass, or acknowledges a settlement asynchronously. Answers and marks live in the mounted runner. "Avbryt provpass" returns to the hub locally; the host is not told the pass is void. Only a synchronous throw from `submitProvpass` counts as a failure.
  - No start time or resume: the remaining seconds of the snapshot are the only time source. No claim of reload-safe time.
  - Verbal passes: text questions render through the shared LÄS paragraphs (`lang` from the passage). The final `ReadingWorkspace` is B3, so a verbal pass is not claimed fully covered. The kit has no verbal running snapshot; the test injects the ELF unit.
  - ORD and MEK in a pass use the problem field (prompt and options). No dedicated presentation exists in the contract yet.
- **§10 Provpassresultat:**
  - "Se frågorna du missade" (PassReview) needs question content and picks; `ProvResultView` has only the missed ids. The spec's fallback is built: the limitation and "Till Öva".
  - No calibrated or P5 flag on the result, so the P5 caveat (normering.ts:27–31) cannot be shown. A synthetic pass shows its linear method.
  - No loading or "Hittar inte resultatet" state, and no result date.
  - In the bake-off, `openProvResult(id)` always shows the kit's fixed result: a host limitation.
  - The optional per-section `estimate` is not shown: the spec does not ask for it, and it reads too easily as normed.
- **§11 Framsteg:**
  - "Visa passet" (reopen a finished drill or repetition) has no kit action. History rows are readable summaries, with no selected-pass summary.
  - No diagnostic entry ("Börja här · 10 frågor").
  - No loading, stale or failure state for Historik.
  - The weekly series is the kit's pooled accuracy, labelled so ("andel rätt som poäng"), not a projection.
  - The target is used only when supplied; nothing is hard-coded.
- **Theme:** production `ThemeMode` is light or dark only; no System theme was built.

## Proposed UI copy (new in this batch; all Swedish, all proposed)

- **Provpass hub:**
  - "Välj ditt provpass."
  - Half pills: "{n} frågor · {m} min".
  - "Förslag · det pass du sett minst av", "Valt provpass".
  - "{Halva} halva · {n} frågor · {m} minuter".
  - "{n} av {m} frågor tillgängliga. Passet rättas av dem som finns."
  - "Sett förut", "Delprov".
  - "Du får läsa villkoren först. Klockan startar när du bekräftar."
  - "Provpasset förbereds", "Frågorna hämtas. Klockan startar först när de finns på plats.", "Tillbaka till provpassen".
  - "Inga riktiga pass än", "Frågebanken har inget riktigt provpass för den här halvan just nu.", "Till {halva} halva".
  - "Provpasset avbröts. Det räknas inte, och inget resultat sparades."
  - "Din rytm", "Dags för ett kvantitativt/verbalt pass.", "Nästa: … om {n} dagar.", "Förra passet gjorde du för {n} dagar sedan.", "Du har sett {n} av {m} frågor i de riktiga passen."
  - "Riktiga pass · {Halva}", "Minst sedda först", "sett {n} av {m}", "Förslag", "Tidigare resultat", "Inga provpass än. Ditt första resultat hamnar här.", "Villkoren".
- **Confirmation:** "Starta provpass" (eyebrow), "Tillbaka", "Starta nu", "Du har sett {n} av {m} frågor förut.", "Villkoren". The rules come from the kit, first letter capitalised.
- **Running pass:**
  - "Avbryt provpass", "· fråga {n} av {m}", "{mm:ss} kvar", "Lämna in".
  - "Svarsöversikt", "{n} av {m} besvarade · {k} markerade", "Fylld ruta: besvarad. Streckad: obesvarad. Ljuslinjen visar var du är."
  - Cell names: "Fråga {n}, {S}, besvarad/obesvarad, markerad, visas nu".
  - "Fråga {n} av {m} · {S}", "Ditt svar: {L}", "Inget svar valt än", "Markera", "Markerad".
  - "Föregående", "Nästa fråga", "Granska svar", "{A}–{E} väljer · ← → byter fråga · svaren går att ändra tills tiden är ute".
  - "Svaren går att välja när underlaget har laddats.", "En bild som frågan behöver kunde inte visas. …", "Underlaget laddas …", "Underlaget kunde inte visas.", "Försök igen", "Hämta bilden för {L} igen".
  - "Frågan saknar svarsalternativ. Du kan gå vidare till nästa fråga."
  - "Fem minuter kvar. Ge varje obesvarad fråga ett svar."
  - Hand-in gate: "Lämna in provpasset?", "{n} av {m} frågor har ett svar.", "{n} frågor är obesvarade: {lista}. Fel svar ger inga avdrag, så ett svar på varje fråga lönar sig.", "Alla frågor har ett svar.", "Markerade: {lista}.", "Efter inlämningen går svaren inte att ändra.", "Tillbaka till frågorna".
  - Abort gate: "Avbryta provpasset?", "Avbryter du blir provet ogiltigt och inget resultat sparas.", "Det finns ingen paus: klockan går vidare även om du bara lämnar sidan.", "Fortsätt provpasset", "Avbryt provpasset".
  - Status: "Provpasset lämnas in …", "Tiden är ute. Provpasset lämnas in …", "Dina svar är låsta. Resultatet visas när det är sparat.", "Provpasset kunde inte lämnas in.", "Dina svar finns kvar här och är låsta. Försök igen.", "Försök lämna in igen".
  - Ended: "Provpasset är avslutat", "Tiden gick ut.", "Passet tog slut innan du kom tillbaka. Det finns inget resultat att visa för det.", "Provpasset går inte att visa", "Frågorna saknas.", "Till Provpass".
- **Result:**
  - "Provpass · resultat", "Provpasset är klart.", "{Halva} halva · riktigt prov / genererat pass".
  - "av {n} rätt", "{n} fråga/frågor saknas i passet, så det rättades av {n}.", "{n} besvarade · {k} obesvarade · tid {t} av {T}".
  - Method: "Normerat (härlett): {r} rätt av {n} räknas om till en hel provhalva på 80 frågor och läses av i provtillfällets normeringstabell. Det är en uppskattning – ett enskilt provpass har ingen officiell poäng.", "Skattad poäng: andelen rätt omräknad till 0–2,0. Den är indikativ och inte normerad av UHR.", "Ingen poäng för det här passet.", "Det gick inte att räkna fram en poäng för passet. Antalet rätt gäller."
  - "Genomgången av frågorna du missade finns inte här än. Under tiden kan du öva vidare på delproven."
  - "Delprov och tempo", "Rätt svar per delprov, och tiden mot delprovets andel av 55 minuter.", "{n} min över andelen".
  - "Om passet", "Prov", "Tid".
  - "Ett mönster att se", "{S} · {n} missar av samma slag", "Läs om mönstret".
  - "Tidigare pass av samma slag", "Inga tidigare pass av samma slag än."
  - Taken from the spec: "Till Öva", "Till Framsteg", "Till Provpass".
- **Framsteg:**
  - "Var du står just nu.", "Översikt", "Historik", "Uppskattat HP-resultat", "troligen {a}–{b}", "mål {x}".
  - "Nästa steg", "Behöver mest övning just nu: uppskattat {x} av 2,0 på {n} svar[, lite lägre än förra veckan][, senast övat för {n} dagar sedan][, underlaget är ännu litet].", "Sedan: {S} och {S}.", "Välj en övning", "Det finns inte tillräckligt med svar för ett förslag än. Alla delprov finns under Öva."
  - "Vecka för vecka", "andel rätt som poäng, {n} veckor", "Från {a} till {b} över {n} veckor med svar. {k} veckor utan svar syns som ett glapp.", "Visa värden", "Veckans andel rätt som poäng, äldst först.", "Vecka från", "Poäng", "inga svar".
  - "Alla delprov", "senaste 90 dagarna", "{n} svar · för lite underlag än · {n} procentenheter högre/lägre i veckan · som förra veckan · övat idag/igår/för {n} dagar sedan", "Inte övat än", "± är skattningens osäkerhet: poängen ligger troligen inom det spannet. Ett delprov du inte har övat visas utan poäng, aldrig som noll."
  - "Veckans rytm", "dagar med övning / av {n} planerade dagar", "{n} dagar i följd just nu · som längst {n}", "{n} svar den här veckan", "{p} rätt de senaste sju dagarna", "{n} minuter idag", "En dag utan övning tar inte bort något du har byggt upp."
  - "Dagarna", "{n} veckor", "{a} av {n} dagar med övning, {k} svar totalt.", "Visa dagar", "Svar per dag, vecka för vecka. Ett streck: inget underlag för dagen.", "Inga dagar med svar att visa än."
  - "Repetition", "{n} missar väntar på repetition. {n} har du redan klarat.", "Totalt {n} svar i {n} övningar."
  - "avslutade övningar och repetitioner, senaste först", "Utan datum", "Inga avslutade övningar än. När du har gjort klart en övning hamnar den här.", "Provpassresultat".
  - Taken from the spec: "Öva {S}", "Välj övning", "Öppna Repetera".

## Accessibility notes (token reasoning, not a browser audit)

- Text uses batch 1's measured pairs only: ink, soft or accent on room, paper or lamp. The new `--lj-dusk` carries no text. The heat field mixes the accent into the room and is `aria-hidden`; its summary and table carry the facts.
- Map cells are 44 × 44. State is in words (aria-label), in shape (dashed vs solid) and in the current cell's beam and `aria-current="step"`, never in colour alone. Every new control inherits the 44 px minimum and the 2 px focus ring.
- Forced colours: the gate panel and the hand-in status are outlined. The current cell, the chosen pass, a pressed flag and the selected tab are outlined in Highlight, and the beam bars become Highlight.
- No animation was added. The jump links scroll instantly under reduced motion, and stills (`live=false`) neither tick nor take keys.

## Verification

- `pnpm typecheck` (from `app/`, run as `pnpm -C app …`): exit 0, no output.
- `pnpm lint`: exit 0, "Checked 506 files … Found 4 infos". All four are pre-existing and outside this write set: three `useIndexOf` in `LandingBakeoffR3/R4A/R4C.tsx` and one `noUselessFragments` in `l12/M3.tsx`.
- `pnpm test`: **"Test Files 108 passed (108) · Tests 2458 passed (2458)"**.
- The direction's own file, `Ljuskagla.test.tsx`: **188/188**. It covers:
  - the shared contract (`describeDirectionContract`) for screens 1–11, desktop and phone, light and dark;
  - batch 1's tests, unchanged except one line: a bare mount's Framsteg door now checks for `rd-framsteg-prognosis` instead of round 1's "Framsteg" stub heading;
  - Hub: lamp, register and halves; the gate (focus, Escape, inert shell, no start on cancel); a partial pass; waiting for a pass not supplied; an empty half.
  - Running pass:
    - answers without grading, changing, kept across jumps; letters and arrows; flags, and none when absent;
    - the hand-in gate naming blanks and marks, then the lock; "Granska svar"; abort;
    - the local clock reaching zero once, with a gate open; the host's clock reaching zero first, once and never void; a held-back timer; expiry on entry;
    - a failed hand-in and its retry; a shrinking pass;
    - the figure gate page by page (shared page, new page, error, retry, cached image);
    - an ELF passage in `lang="en"` with the badge outside; the phone map and sheet;
    - the bake-off journey hub → result → hub at both widths.
  - Through the real `Redesign2026Bakeoff` host:
    - digits and arrows held with focus on an answer, a cell, the heading, the body or the switcher bar, and the switcher's keys back after an abort;
    - a page pans with the arrows;
    - the hand-in lands on the result with its heading focused;
    - Framsteg's phone tabs switch with the arrows without changing the screen.
  - Result: raw count, method, next step, ledger against quotas, history ids, a partial pass with no score, a linear score with nothing missed, a trap.
  - Framsteg: overview and recommendation, the cold state, the eight rows with an unpractised one, the curve with its gaps and table, the week and the days, Historik grouping and Provpass doorway, the jump links, the journey to the suggested drill and back.
  - Optional fields absent on 9 and 11: no placeholders.
  - The grid check: screens 9–11 at both widths, and a running pass at both widths, including the phone head's five named areas.
- **The tests catch what they claim (temporary mutations, all reverted, then 188/188 again):**
  - M1, digits not held: the five host-key tests failed. With focus on the body or the switcher bar, "1" changed the direction to Folio, unmounting the pass.
  - M2, the host's zero ignored: the host-clock test failed (0 hand-ins).
  - M3, no clamp: the shrink test failed (the runner fell to "Frågorna saknas.").
  - M4, no figure gate: the figure test failed (options enabled while the page loaded).
  - M6, expiry recomputed every render (alone): the host-clock test failed. Zero voided the pass instead of handing it in.
- `git diff --check`: clean. Changes stay inside the write set: eight modified files and two new ones (`LjuskaglaProvpass.tsx`, `LjuskaglaFramsteg.tsx`), plus this worklog.
- **Visual self-check not possible in this sandbox, and not attempted again.** Batch 1 found that a second sandboxed command cannot reach a Vite started by another (curl exit 7) and that the Playwright capture was refused. Lager's batch got `listen EPERM`. This worker may also run only one native command at a time, with no harnesses. No screenshots, browser contrast, text-spacing or real-font checks were made.
- **Coordinator:** please run the 16-view pass (desktop and phone × light and dark) for 9, 10 and 11 at `/dev/redesign-2026-bakeoff?dev=1&d=h&s=<n>&w=<w>&t=<t>`. Useful extra states:
  - 9: the start confirmation; the running pass on question 17 (KVA), on a DTK page (cell 29) and a diagram (cell 2); the phone map open and the phone sheet peek and open; the hand-in and abort gates.
  - 11: the phone Historik tab; Visa värden and Visa dagar open.
  - Recheck 2–3, since the paragraphs were extracted.

## Handoff

- **Done:**
  - Screens 9, 10 and 11 built and declared (`meta.screens: [1…11]`), the round-1 stubs for Provpass and Framsteg replaced, and the frame's doors wired to them.
  - All changes uncommitted, inside the 12-file write set.
- **Left:**
  - The screenshot pass and browser accessibility checks.
  - Removing B1's private copies from `LjuskaglaQuant.tsx` in favour of `LjuskaglaParts` (needs that file in a write set).
  - Gating B1's practice Svara on figure load, in the same file.
  - The kit gaps above.
  - Deleting the root dotfile placeholders from outside the sandbox.
- **Next:** B3 (12–14) can reuse `Gate`, `useGate`, `PassageParagraphs`, the figure workspace and the hub vocabulary. Its `ReadingWorkspace` should replace `PassageParagraphs` inside the running pass.

### Playbook proposal

- 2026-10-20 · Symptom: placeholder `.mcp.json` and `.claude/` entries appeared inside `app/src/…` and broke `biome check` on that folder with "Permission denied (os error 13)". Cause: the sandbox mounts its protected paths relative to the working directory, and `cd` into a subdirectory moved that directory. Rule: in this sandbox never `cd`; run `pnpm -C <app> …` and use absolute paths from the worktree root.

## Round 2 — review fixes (Codex review hpf-r4it), 2026-10-20

Session `ci-wisp-u5nvy84`, claimed through the managed hook. Starting state: clean `d25020d53a65bbb4a8a6811716a505348a794515` on the assigned branch (only the eleven untracked root dotfile placeholders). I read the review report (`~/scratch/hpf-qr0p.31/review-hpf-r4it.md`, VERDICT: HOLD, three P2 findings), the Round 2 brief in the Bead DESIGN, spec §9 and the shared rules in `docs/redesign/directions/h-ljuskagla.md`, the bake-off host and its provider, and Instrument's round-2 key fix (hpf-qr0p.13) as precedent. All changes are uncommitted and inside the write set: six files plus this worklog. Paths below are under `app/src/components/devbake/redesign/h-ljuskagla/`.

### Fix 1 · A failed hand-in no longer traps the reader

Coordinator decision followed: no resubmit button and no automatic retry.
- `LjuskaglaProvpass.tsx:568`–`:588`: one hand-in attempt. `submit` keeps its one-shot `settled` guard, and a throw from `submitProvpass` ends the attempt as `failed` (`:584`). The retry button and the separate `handIn` it called are gone, so neither the reader nor the clock can hand in again.
- `:879`–`:901`: the status shows the error with an honest line and an enabled **Till Provpass**. That button calls `leave` (`go('provpass')`, then `onLeave('ended')`): nothing is submitted, and no result is claimed.
- `:1181`–`:1208`: once the attempt has failed, the read-only pass renders in `FrameShell`, the normal shell, with Provpass lit. The status and map come first, then the question with its answers disabled. There is no focus head: the clock, Avbryt and Lämna in no longer apply.
  - The root carries no `data-rd-keyscope` there; the live runner keeps it (`:1210`–`:1216`).
  - The enlarged viewer still opens over it, with the shell inert behind it.
- `:682`: `holdKeys` is off once failed, so digits, 0 and the arrows reach the switcher again from the focused element or the body.
- `:1000` and `:973`: the footer (Föregående / Nästa fråga and its key hint) and the figure-wait notice are left out once the answers lock, since neither can act anymore.
- `:645`: the shell's doors call `goDoor` (`go(door)`, then `onLeave('ended', door)`). `Ljuskagla.tsx:39` and `:62` keep the page left for (`leftFor`), so a host that does not navigate still opens the door's page, as the frame's doors do. A new start or a screen change clears it.
- `LjuskaglaParts.tsx:149`: `FrameShell` is the frame's sidebar, phone head and bottom bar, moved out unchanged. `LjuskaglaNav.tsx:124` now renders the frame through it, with the same DOM, so the runner and the frame share one shell. `ljuskagla.css:503` lets the run fill the shell beside its doors.
- Red-first tests:
  - `Ljuskagla.test.tsx:1473`: through the real `Redesign2026Bakeoff` on screen 9. `failInHost` (`:1484`) makes the host's own `submitProvpass` throw: its request for screen 10 fails in the route (`BakeoffHost`'s new `ask`, `:830`). It hands in manually or lets the local clock run out under fake timers, then runs the clock far past the deadline.
  - `:1509`, manual and timed: the error heading has focus. `submitProvpass` was called once. There is no keyscope, the answer B stays pressed, all options are disabled and a letter changes nothing. There is no retry and Provpass is the lit door. Till Provpass lands on the hub at `h/9`, with no result and still one hand-in.
  - `:1543`, eight cases: manual or timed × the focused heading or the body × `3` or `ArrowLeft`. The switcher answers (`c/9`, `h/8`), and there is still one hand-in.
  - `:1556`: the Framsteg door leads to screen 11.
  - `:1140`: a non-navigating host, desktop and phone, opens Framsteg in the frame as well.
  - These replace the retry test that was at `:1091`.

### Fix 2 · Figure readiness belongs to the mounted image

- `LjuskaglaParts.tsx:899`–`:975`: `useFigureGate` keeps, for each place (`figure`, `option-<L>`), the image element mounted there now, with its key (place, source and retry) and its own load.
  - A kept ref callback per key (`:939`) registers each newly mounted element. It is `ready` only if it is already complete with pixels, otherwise `loading`. Its React 19 cleanup (`:946`) removes it on unmount.
  - `settle` (`:934`) accepts load and error only from the element now in the place.
  - `status` answers `loading` unless the place's current element has the asked key.
  - So a page shared by consecutive questions stays mounted and stays ready. A page come back to, a remounted layout and a sheet's image options start over, and the enlarged viewer keeps its own ungated image.
- `:589`: `FigureImg`'s handlers now receive the event, to know which element spoke.
- Red-first tests:
  - `Ljuskagla.test.tsx:1226`: load page A, then visit another page or a question without a figure, then return to A. The new `<img>` is a different element with the same source. The answers and letters stay blocked, and a late load from the old image changes nothing. They open once the new image loads. The viewer's own image failing leaves the gate ready.
  - `:1256`, phone: image options load in the open sheet, the sheet folds (letters then choose nothing: the images are not mounted) and opens again. The new images block until each has loaded.
  - The existing tests stay green: the shared page needs no second load, retry, and a cached image counts as loaded.

### Fix 3 · Question arrows yield to scroll regions and focused controls

- `LjuskaglaProvpass.tsx:441`–`:477`: `keepsArrows` recognises targets whose ←/→ are their own:
  - a control: `button`, `a[href]`, `summary`, the ARIA widget roles;
  - a panning page (`data-lj-pan`);
  - an element that scrolls itself: its computed overflow is `auto` or `scroll`, the page itself aside. That is what a browser focuses as a keyboard scroller, such as an overflowing problem column.
- `:692`–`:699`: text fields (the kit's foreign keys) keep their arrows without `preventDefault` now. A target that keeps its arrows inside the runner is left to its native scrolling. The runner's own `data-rd-keyscope` keeps the switcher away from it.
  - Outside the runner (the bake-off bar), such a target is held: `preventDefault`, no question change.
  - Anything else (the question heading focused on each new question, the body) still changes the question.
  - Digits and 0 stay held while the pass runs.
- Behaviour change to note: with focus on an answer, a map cell, a gate or the viewer's buttons, ←/→ no longer change the question or get swallowed. They keep their native meaning, which is scrolling. This is spec §9's "yield to focused controls", the same reading as Instrument's round 2. The letters still choose from anywhere.
- Red-first tests:
  - `Ljuskagla.test.tsx:1437`–`:1442`, real host with the direction sheet loaded (`withSheet`, `:872`): the KVA problem column (no figure inside) is focused. ArrowRight, ArrowLeft, Shift+ArrowRight and Shift+ArrowLeft are not prevented, and keep the question, the focus and the host selection. `1`, `8` and `0` stay held. jsdom has no layout, so the test lends the column the focusability that Chrome and Firefox give an overflowing scroller.
  - The heading inside the same column still steps.
  - `:1353`/`:1377`: the five-target host test now expects focused controls to keep their arrows, with no question change: native for the answer and the cell, held for the switcher bar. The heading and the body still step.

### Evidence

- **Red first.** The new and changed tests were written before any source change. Against the untouched `d25020d` source they failed: **20 failed | 184 passed (204)**, each at its intended assertion:
  - nav absent;
  - options enabled too early;
  - arrows prevented or stepping;
  - keyscope still on the failed pass;
  - switcher keys still held.
- **Green.** After the fix: **204/204** in `Ljuskagla.test.tsx`.
- **Mutation checks** (each reverted; the source re-checked by grep):
  - M1, `holdKeys` without `!failed`: the 8 switcher-key tests failed.
  - M2, `data-rd-keyscope` kept on the failed pass: the 2 exit tests and the 4 focused-heading key tests failed. The body ones correctly passed.
  - M3, no unmount cleanup in the figure gate: the phone sheet test failed at its folded-sheet letter check (`:1287`).
  - M4, `scrollsItself` always false: the scroll-region test failed.
  - M5, `button` removed from `OWN_ARROWS`: the answer, cell and switcher-bar cases failed.
  - Not mutation-sensitive: `settle`'s element check. React drops events from unmounted elements, so the "late event" assertion holds either way; the check is defence in depth.
- **Verification** (from the worktree root, never `cd`):
  - `pnpm -C app typecheck`: exit 0.
  - `pnpm -C app lint`: exit 0, 512 files, the same 4 pre-existing infos (three `useIndexOf` in `LandingBakeoffR3/R4A/R4C.tsx`, one `noUselessFragments` in `l12/M3.tsx`).
  - `pnpm -C app test`: **109 files, 2650/2650**.
  - `git diff --check`: clean.
- **Shared tests:** none failed; no file outside the write set was edited.

### Copy (Swedish, proposed)

- Removed: "Dina svar finns kvar här och är låsta. Försök igen." and "Försök lämna in igen".
- New, failed status: "Provpasset kunde inte lämnas in." (kept) and "[Tiden tog slut. ]Dina svar finns kvar här men går inte längre att ändra. Om inlämningen ändå gick fram finns resultatet under Tidigare resultat.", with **Till Provpass**.
- It promises neither way, since the hand-in may have reached the host.

### Left for the coordinator

- **Browser pass, not possible here:** a failed hand-in on desktop and phone, light and dark, after a manual hand-in and after time-up. Check:
  - the shell beside the read-only pass;
  - the status lamp, and focus on its heading;
  - the phone's head, map toggle, sheet and bottom bar;
  - the viewer opened over the failed state.
- In Chrome, Tab to an overflowing KVA/NOG problem column (desktop) and check that ←/→ scroll it, or do nothing, while the question stays.
- **Unchanged kit gap:** a hand-in that does not throw stays "Provpasset lämnas in …" until the host navigates. Kit v2 has no settlement acknowledgement, and this round treats only a failed attempt as ended.
- Still open from batch 2: `LjuskaglaQuant.tsx`'s private part copies and B1's ungated practice Svara (outside this write set), and the root dotfile placeholders (delete from outside the sandbox).

LJUSKAGLA2R2 DONE: hpf-qr0p.31

## Round 3 — review fix (Codex re-review hpf-hegb), 2026-10-20

Session `ci-wisp-ytfhdi0`, claimed through the managed hook. Starting state: clean `4400c0244755a0261f55cdb5ab8c7d640f353483` on the assigned branch (only the eleven untracked root dotfile placeholders).

I read:
- the review report (`~/scratch/hpf-qr0p.31/review-hpf-hegb.md`, VERDICT: HOLD, one P2);
- the Round 3 brief in the Bead DESIGN;
- the kit's `submitProvpass` and how both hosts implement it;
- Samtal's `PassHanded`, as precedent for the frame after a hand-in.

All changes are uncommitted and inside the write set: two files plus this worklog. Paths below are under `app/src/components/devbake/redesign/h-ljuskagla/`.

### Fix · A hand-in that returns while the host stays ends the attempt

- `LjuskaglaProvpass.tsx:438`: `Settle` is now `'active' | 'handed-in' | 'failed'`, and `'pending'` is gone.
  - Kit v2's `submitProvpass` is synchronous, so nothing could ever render between `'pending'` and the outcome. It was the state that trapped the reader.
- `:583`–`:591`: `submit` keeps its one-shot `settled` guard.
  - A normal return now sets `'handed-in'` (`:588`); a throw still sets `'failed'` (`:590`).
  - A host that shows the result unmounts the pass in the same update, so neither state renders there and nothing flashes. The bake-off and the real-app `DirectionShell` both call `show(10)` inside `submitProvpass`.
- `:566`–`:569`: `locked` (handed in or failed) is now the one switch for "the attempt has ended":
  - `:688`: `holdKeys` is off once the pass is locked, so digits, 0 and the arrows reach the switcher from the focused element or the body.
  - `:1002`: the footer (Föregående / Nästa fråga / Granska svar and its key hint) is left out.
  - `:1183`: the read-only pass renders in `FrameShell` with Provpass lit and no `data-rd-keyscope`. The live root keeps its keyscope (`:1218`).
  - As before, the clock stops (`active` needs `'active'`, `:565`) and `canAct` refuses input.
- `:883`–`:903`: the status says how the attempt ended. It always offers an enabled **Till Provpass** (`leave`: `go('provpass')`, then `onLeave('ended')`), which submits nothing.
  - Handed in: "Passet är inlämnat." (the brief's proposed copy), then "[Tiden tog slut. ]Dina svar finns kvar här men går inte längre att ändra. När resultatet är sparat finns det under Tidigare resultat." No saved result is claimed.
  - Failed: the rendered copy is unchanged; it now shares its first sentence with the handed-in copy.
- The live tree no longer renders `{status}`, since that tree shows only while the pass is active.
- Comments updated at `:436`, `:502`–`:507`, `:566`, `:583`, `:883` and `:1181`.
- `Ljuskagla.tsx` is unchanged: its `onLeave` and `leftFor` already serve both endings.

### Red-first tests (`Ljuskagla.test.tsx`, written before the source change)

- `:828`–`:855`: `BakeoffHost` gains `stays`, a change it never applies, like a route that keeps its place.
- `:1491`–`:1520`: the failed block's helper is hoisted as `handInInHost(how, route)`.
  - `'fails'` throws on the request for screen 10, as before.
  - `'stays'` lets `submitProvpass` return and keeps screen 9.
  - After the hand-in it moves the clock twice the pass's time past the deadline and lets five more ticks run.
  - The failed block's tests call it with `'fails'` and are otherwise unchanged.
- `:1585`–`:1657`: a new block, "hand-in the host does not follow", through the real `Redesign2026Bakeoff` on screen 9, for a manual and a clock-driven hand-in:
  - `:1594` (2 tests):
    - The host stays at `h/9`. "Passet är inlämnat." has focus, the runner has `data-settle="handed-in"`, and there is no keyscope and no result. "Tiden tog slut." shows after time-up.
    - B stays pressed, A–D are disabled, and a letter changes nothing. There is no Lämna in, retry, Nästa fråga or Granska svar.
    - Provpass is the lit door. Till Provpass lands on the hub at `h/9`, with no runner and no result.
    - One hand-in throughout, after the extra ticks too.
  - `:1634` (8 tests): manual or timed × the focused heading or the body × `3` or `ArrowLeft`. The switcher answers (`c/9`, `h/8`), with one hand-in.
  - `:1650` (2 tests): the Framsteg door leads to `h/11`, with one hand-in.
- `:1157`–`:1171` (2 tests): a spied host that does not navigate, on desktop and phone. After the hand-in the heading has focus and Provpass is lit. The Framsteg door calls `go('framsteg')` and opens Framsteg in the frame as well. One hand-in.
- Three tests encoded the trap and are updated:
  - `:1028`: a spied hand-in now expects "Passet är inlämnat." in focus and no Lämna in, instead of "Provpasset lämnas in …".
  - `:1076`: the local clock expects the same, plus "Tiden tog slut.". The timer is gone with the focus head.
  - `:1096`: the host's clock expects `data-settle="handed-in"` instead of the timer at 00:00.

### Evidence

- **Red first.** Against the untouched `4400c02` source: **17 failed | 201 passed (218)**, the 14 new tests and the 3 updated ones. Each failed at its intended assertion: the heading was missing, `data-settle` was `pending`, or the nav was absent.
- **Green.** After the fix: **218/218** in `Ljuskagla.test.tsx`.
- **Mutation checks** (each reverted; the source re-checked by grep):
  - M1, `holdKeys` with `!failed`: the 8 normal-return switcher-key tests failed.
  - M2, `data-rd-keyscope` on the handed-in shell: the 2 ended-state tests and the 4 focused-heading key tests failed. The body ones correctly passed.
  - M3, the clock left running after the hand-in and the one-shot guard removed: 25 failed, including all 12 normal-return host tests, which saw more than one hand-in.
  - M4, the footer kept once handed in: the 2 ended-state tests failed.
  - Not mutation-sensitive on its own: the guard alone, since the stopped clock and `canAct` already prevent a second call. It is defence in depth.
- **Verification** (from the worktree root, never `cd`):
  - `pnpm -C app typecheck`: exit 0.
  - `pnpm -C app lint`: 518 files, the same 4 pre-existing infos (three `useIndexOf` in `LandingBakeoffR3/R4A/R4C.tsx`, one `noUselessFragments` in `l12/M3.tsx`).
  - `pnpm -C app test`: **109 files, 2955/2955**.
  - `git diff --check`: clean.
- **Shared tests:** none failed; no file outside the write set was edited.

### Copy (Swedish, proposed)

- Removed: "Provpasset lämnas in …", "Tiden är ute. Provpasset lämnas in …" and "Dina svar är låsta. Resultatet visas när det är sparat."
- New, handed in: "Passet är inlämnat." and "[Tiden tog slut. ]Dina svar finns kvar här men går inte längre att ändra. När resultatet är sparat finns det under Tidigare resultat.", with **Till Provpass**.

### Left for the coordinator

- **Browser pass, not possible here:** the handed-in state on desktop and phone, light and dark, after a manual hand-in and after time-up, on a host that stays on screen 9. Check:
  - the shell beside the read-only pass;
  - the status lamp, and focus on its heading;
  - the phone's head, map toggle and bottom bar.
- Round 2's "unchanged kit gap" (a hand-in that does not throw stays pending) is resolved here. Kit v2 still has no settlement acknowledgement, so a host that navigates some time after the hand-in shows "Passet är inlämnat." until it does.
- Still open: `LjuskaglaQuant.tsx`'s private part copies and B1's ungated practice Svara (outside this write set), and the root dotfile placeholders (delete from outside the sandbox).

LJUSKAGLA2R3 DONE: hpf-qr0p.31

# Worklog — hpf-qr0p.16

Redesign round 2, direction C · Spår, batch 2: Provpass (9, the hub and a running pass), Provpassresultat (10), Framsteg with Historik (11).

## Findings

- 2026-10-20: Claimed through `gc hook --claim --json` and checked with `bd show`: id `hpf-qr0p.16`, status `in_progress`, assignee `ci-wisp-pg9qxcn` and route `hpfetcher/gc.implementation-worker` all match. Worktree `hpf-qr0p.16`, branch `codex/hpf-qr0p.16-redesign-round-2-direction-c-sp-r-batch-2-provpass-provpassr`, base `649bea0e0d148c39c677f21862b9fdf90619b90f`, clean at start.
- Read before building:
  - `docs/redesign/kit-v2.md` and the round-1 brief;
  - the merged B0 spec `docs/redesign/directions/c-spar.md`: §1 (language), §2 (map), §3 screens 9, 10 and 11, §4 (inventory) and §5 (open questions);
  - the shared kit, read-only: `viewModel.ts`, `directionData.tsx`, `drillCore.ts`, `contract.ts`, `r1Kit.ts`, `r2Fixtures.ts`, plus `Redesign2026Bakeoff.tsx` (the switcher's keys) and `components/direction-shell/DirectionShell.tsx`;
  - all of Spår's code and the batch-1 worklog `hpf-qr0p.15.md`.
- No sibling direction had built 9–11 on main yet; the only reference was the kit's minimal direction in `directionData.test.tsx`.
- Fixture facts the copy is fitted to:
  - hub: kvant is next (`MOCK_PRESCRIPTION`), and the suggestion is Hösten 2025 · Provpass 1 (6 of 40 seen), the same pass the running Provpass plays;
  - running: question 17 (KVA-017) on screen, 16 answered, XYZ-009 and KVA-014 marked, 31:12 left. DTK 29–31 share page p16, 32–34 p18, 35–37 p20 and 38–40 p22;
  - result: 27 of 40, 38 answered, so 11 wrong and 2 blank; two earlier kvant passes;
  - Framsteg: ≈ 1,4 (verbal 1,5, kvant 1,3, +0,1), focus XYZ · DTK · KVA, goal 2,0, a weekly goal of 5, ten history rows.
- `SparQuant.tsx` (Kvantfråga and DTK) is not in this write set. Its problem card, stem, options and page card are private, so the pass's exam mode has its own copies in `SparProvpass.tsx`, built from the same classes (see Spec gaps).

## Decisions

- **The Provpass flow lives in Spår's root** (`Spar.tsx:72`, `ProvFlow`): the hub, a running pass, or the result.
  - A new screen from the host settles it (`Spar.tsx:98`): 10 shows the result, anything else the hub. A pass that was running is left behind.
  - "Starta nu" calls `actions.startProvpass(id)` and runs the pass in place, since the bake-off's answer to a start is screen 9 again.
  - Handing in calls `actions.submitProvpass()` and shows the result. On a host that does not move (a test, a preview), the result opens here.
  - Voiding goes back to the hub with its notice. The kit has no action for it (see Spec gaps).
- **A running pass is a focus frame of its own**: no rail and no navbar. Lugnt läge is enforced (`data-calm` on the root, `Spar.tsx:139`), so there is no calm switch.
- **Answering is choosing.**
  - Choosing waits for every required image: the question's figure, the DTK page and option charts (`SparProvpass.tsx:663`, `useImages`).
  - Each image is keyed by its source; a retry remounts it. An image already complete when it mounts (cached) counts as loaded.
  - The next question on the same page is ready at once. A source that leaves the screen forgets its state, so a new or returning page waits for its own image.
  - "Nästa fråga" and "Föregående" never wait, so a failed figure cannot trap the reader on a question.
- **The clock** (`SparProvpass.tsx:739`):
  - The host's `remainingSeconds` sets a deadline each time it changes, and the clock counts down locally while live. A provider that ticks every second simply keeps it in step.
  - At 0:00, or when the run starts with no time left, the pass hands itself in exactly once (`:1515`, a ref guard). It never voids.
- **Keys:**
  - The bake-off switcher's digits and ←/→ are marked handled in a capture listener during a running pass, whatever has focus (`:1541`). Form fields and `data-rd-keyscope` regions are left alone: the switcher already ignores keys there, and the arrows keep panning a zoomed page.
  - a–e choose (only the item's letters); Shift + letter strikes; Enter moves on (at the last question it opens the hand-in).
  - Space moves on only once the question has an answer (`:1655`), so until then it keeps scrolling a long text or page.
  - Esc never leaves the pass. T folds the tray, R turns a page, Z zooms it.
- **`SparDialog`** (`sparParts.tsx:433`) is the modal layer of spec §1.8, used for hand-in, abort, the phone's rules and the overview.
  - It is a layer of Spår's root: centred on desktop (the overview hangs under the top bar), an edge sheet on phone, behind a scrim.
  - It carries `data-rd-keyscope`, keeps Tab inside, and closes on Esc or a press on the scrim. Focus moves in, and goes back to the opener on close.
  - Focus is restored in the effect body, not a cleanup (`:470`). React puts focus back after a commit's mutations, so a layer kept mounted would otherwise take it straight back. A red test found this.
  - The overview stays mounted (hidden), so its grid and cells keep the contract's ids.
- **Gates:** `rd-confirm` sits on "Starta nu", the hand-in's "Lämna in" and "Avbryt passet".
- **The running pass's exit:** "Avbryt" is `sp-prov-abort`, not `rd-exit`. The contract does not treat 9 as a focus screen, and Avbryt voids the pass rather than calling the drill's exit.
- **Framsteg's two views** are sibling panels switched by a `SparSegmented` in the head (spec §1.8). The inactive panel is `hidden`, so Historik's rows keep their ids while Översikt shows. Idag's "Alla pass" opens Historik through the root's `framsteg` state.
- **New shared parts** in `sparParts.tsx`:
  - `SparDialog`;
  - `SparScale` (Idag's 0–2,0 bar as a part, full or mini, `:363`);
  - a `testid` on each `SparSegmented` option (`:325`).
- `Options` (`SparDrill.tsx`) now takes just `{question, selected, eliminated}`, so the pass can use it without a drill core.

## Built, per screen — and why it is Spår

**9 · Provpass, the hub** (`SparProvHub`, `SparProvpass.tsx:271`)
- **The head** (`SparPageHead`): eyebrow "Provpass", the display title "Hela sträckan", the lede "40 frågor på 55 minuter, som på provdagen. Inget facit förrän du lämnar in.", and the half as a `SparSegmented` (Verbal · Kvantitativ, `rd-prov-half-<half>`).
- **The station is the suggested pass.**
  - Its band is the **route ribbon** (`RouteRibbon`, `:148`): one 10 px bar of the legs, each in its section's strong hue and as long as its questions, labelled with code and range ("XYZ 1–12 · KVA 13–22 · NOG 23–28 · DTK 29–40"). It is `role="img"` with the legs in words.
  - Under the band:
    - "Föreslås · minst sett" (or "Valt pass", or "Ditt första provpass" for a reader with no results);
    - "Hösten 2025 · Provpass 1" in Bricolage;
    - "Kvantitativ · 40 frågor · 55 minuter";
    - "Du har sett 6 av 40 frågor tidigare.";
    - the one green pill, "Starta provpasset ↵" (`rd-prov-start`).
- **The rules.**
  - On desktop, "Starta provpasset" grows the station in place into "Innan du startar · Hösten 2025 · Provpass 1". The four rules come from `hub.rules`, set as sentences with a glyph each (⌛ ↺ ✕ ✓), then "Starta nu ↵" and "Inte nu".
  - Focus moves to the heading; Esc is "Inte nu" and focus returns to the pill.
  - On phone the same rules are a `SparDialog` edge sheet.
  - Enter opens the rules, and Enter again starts.
- **The register** lists every sitting of the half, newest first ("Våren 2026", then "Hösten 2025").
  - Each pass is a **pass stop**: a 36 px ring that fills with the share you have seen, plus "6/40 sedda" and "Föreslås" (`rd-prov-pass-<pass>`).
  - Choosing a pass makes it the station's pass (`aria-pressed`) and starts nothing. If the chosen pass leaves the list, the suggestion returns.
- **The side column:** the rhythm in words ("Kvant står på tur om en dag. Ditt senaste pass var för sex dagar sedan.") and "Dina senaste pass" as Idag's tiles. Each tile opens its result (`openProvResult`).
- **States:**
  - no real passes for a half: "Inga riktiga pass för kvantitativ just nu", with the other half as the green step (or "Till Öva");
  - a first pass;
  - voided: "Provpasset avbröts och räknas inte. Det du svarat fel på ligger i Repetera.";
  - an empty question list: "Passet kunde inte starta".
- **Calm:** the ribbon drops to calm chroma and the rings lose their fill; the numbers stay.

**9 · Provpass, the running pass** (`SparProvRun`, `:1418`)
- **The desktop top bar**:
  - left: "✕ Avbryt";
  - middle: "Kvantitativ", the section chip, the ribbon with the legs filling in ink as questions are answered and a 3 px tick where you are (`role="img"` "…, du är på fråga 17"), and "Fråga 17 av 40";
  - right: the clock (`rd-prov-timer`), "Översikt" and "Lämna in" (`rd-prov-submit`).
- **The clock** is a 44 px pill in Bricolage tabular figures, `role="timer"` with `aria-live="off"`.
  - From 10:00 it turns inverse ink, never red or amber.
  - "10 minuter kvar" and "5 minuter kvar" are said once each through a polite live region.
  - Under five minutes a one-line note reads "5 minuter kvar. 24 frågor är obesvarade — fel ger inga avdrag. Visa dem". "Visa dem" opens the overview filtered to the blanks.
- **The question** sits in its section's layout in exam mode: no Taktik, no verdict, no facit.
  - The cards are those of Kvantfråga and DTK: KVA's two quantities with I/II stops, NOG's statements on a path with the statement glyphs on the options, an ORD headword, MEK gaps, figures on a white mat, the DTK page on its mat ("sida 1 av 4") with Rotera (R) and Förstora (Z, twice as wide in a pan region).
  - A LÄS or ELF passage reads in the card with ¶ numbers, `lang="en"` for ELF and the ÖVNINGSTEXT badge on a P5 text.
  - The tray is docked and sticky under the card. It holds the prompt (for a page or passage), "⚑ Markera" (`rd-prov-flag`, `aria-pressed`), the options with their blob → ink squircle morph, "Ditt svar: C", "‹ Föregående" and the one green pill, "Nästa fråga ↵". At the last question the pill is "Granska och lämna in".
- **The overview** is a modal panel under the bar: the **switchback** (`Switchback`, `:796`).
  - The 40 questions are rows of ten that turn back at each end like a trail up a slope. The leg code ("XYZ", "KVA 13", …) stands where each leg starts.
  - Each stop is a button to its question (`rd-prov-cell-<n>`, `data-answered`, `data-current`, `aria-current="step"`), named like "Fråga 17, Kvantitativa jämförelser, obesvarad, markerad, här".
  - Answered stops are solid ink, never green; here is the ink ring; marked is ⚑. An answered and marked stop keeps its ink disc and flag.
  - The filter is "Alla · Obesvarade (24) · Markerade (3)" (non-matching stops dim). A key and "Lämna in" sit at the foot.
  - On phone the panel is an edge sheet with five stops to a row (64 px targets).
- **Handing in:** "Lämna in provpasset?", the compact switchback, "24 frågor är obesvarade. Fel ger inga avdrag.", then "Lämna in ↵" (green) or "Fortsätt svara".
- **Abort:** "Avbryta provpasset?" and "Passet blir ogiltigt och räknas inte. Det du svarat fel på hittills läggs i Repetera." The default focus is "Fortsätt provpasset" (green); "Avbryt passet" voids.
- **Phone:** the bar never hides. It has "✕ Avbryt · Fråga 17 av 40 · 31:12", then the ribbon. The card and options are in the flow. A sticky two-row bar holds "⚑ Markera · Översikt · Lämna in" and "‹ · Nästa fråga".
- **Data that changes under it:** a shrinking question list keeps the place in range ("Fråga 10 av 10"), and a new `passId` starts over (the component is keyed by it).

**10 · Provpassresultat** (`SparProvResult`, `:2206`)
- **The head:**
  - eyebrow "Provpass · Hösten 2025 · Provpass 1 · Kvantitativ" ("· genererat pass" for a synthetic one);
  - the raw count as the display title, "27 av 40 rätt" — the one number that needs no caveat;
  - one line read from the legs, "Starkast på KVA, mest tid per fråga på NOG.".
- **The notes:** "Tiden tog slut, så passet lämnades in automatiskt." when the clock handed it in, and "1 fråga saknas ur detta pass — rättat av 39." for a short pass.
- **The next step:** "Dina 11 fel ligger redan i Repetera. Två frågor lämnades obesvarade." The one green pill is "Till Repetera ↵"; "Till Provpass →" is quiet. With no misses: "Inga missar. Hela passet satt." and "Till Idag".
- **The score card** (`rd-prov-score`):
  - "Normerat (härlett)" or "Skattad poäng", then "≈ N,N av 2,0" on Idag's scale (`SparScale`, `role="img"`), with no range, since the table gives none;
  - the disclaimer verbatim ("Härlett ur UHR:s normeringstabell…" or "Linjär skattning — indikativ, inte UHR-normerad.");
  - the approved P5 caveat on a pass with LÄS or ELF legs;
  - the combined total when the optional `total` is there.
- **Sträckan:**
  - the legs in **exam order**, whatever order the data has (`inExamOrder`, `:2190`). Each is a section stop with "8 av 12 · 17:30 av 16:30 · över budget" ("över budget" in ink-2, never red; `rd-prov-section-<sektion>`);
  - beside them, the switchback in verdict mode: ✓ right in `--sp-ok`, ↻ missed in amber, connectors filled after each. It is one picture named "27 av 40 rätt. Missade frågor: 2, 5, 9, …".
- **Below:**
  - "Återkommande fälla" when the optional trap is there, with "Läs i Uppslag →" (`openLesson`);
  - "Exponering": "Du hade sett 6 av 40 frågor innan. 2 frågor lämnades obesvarade.";
  - "Tidigare kvantitativa pass" with the same score treatment as the headline. Each row opens its result (`rd-prov-history`, `rd-prov-history-item-<n>`); with none: "Det här är ditt första kvantitativa pass.".
- **Calm:** no scale and no leg times; verdict stops lose their fills, the glyphs stay.

**11 · Framsteg** (`SparFramsteg`, `SparFramsteg.tsx:98`)
- **Översikt:**
  - **The head.** The eyebrow is "Framsteg · 9 dagar till Höstprov 26". The display title is the prognosis itself, "≈ 1,4 av 2,0" (`rd-framsteg-prognosis`), spoken "Prognos: ungefär 1,4 av 2,0" (with the range when there is one). The lede is the week in words (`weekWords`, `:389`): "Prognosen steg +0,1 den här veckan — 180 frågor med 70 % träffsäkerhet. Verbal (1,5) drar ifrån kvant (1,3); mest att hämta finns i XYZ (…) och DTK (…)." The approved caveat follows.
  - **"Nästa steg uppåt"** (`focusSteps`, `:329`) shows up to three numbered stops ringed in their sections' hues, each with its reason ("Lägst just nu", "På väg ner", "Inte övad på N dagar", "Mycket att hämta"). The first "Öva XYZ · ca 8 min ↵" is the one green pill; the others are quiet, and each has "Läs i Uppslag".
  - **Klättringen** (`Climb`, `:441`) is an elevation line: solid between consecutive weeks, a dotted bridge over weeks without practice, a 6 % ink wash. The goal is a dashed line ending in the goal's flag; this week is a `now` stop with "≈ 1,4"; the axis has 1,0 · 1,5 · 2,0 and the week numbers at its ends. It is a `figure` whose caption is the trend in words ("Från 1,0 till 1,4 på 10 veckor; målet är 2,0."), with "Visa som tabell".
  - **Delproven** (`SectionLine`, `:607`) are eight rows in two groups ("Verbal · 1,5", "Kvant · 1,3"). Each has a 36 px section stop, the name, "240 försök · säker" (attempts and how sure, plus "inte övad på N dagar" from 14 days), the score with its ± band, the trend glyph in ink-2 and a 140 px mini scale with the band. The spoken name says all of it. A row opens in place to "Öva LÄS · ca 10 min" and "Läs i Uppslag", and Esc folds it back with focus on the row.
  - **Veckorna** (`Weeks`, `:736`, `rd-framsteg-week`) are twelve Monday weeks of earned dots, a flag on a week that met the goal and the goal as a dashed line. It is `role="img"` with the values in words, plus "4 av 5 dagar den här veckan". No serie, rekord or empty past slots.
  - **Repetition** shows "8 redo nu · 61 i kön · 412 inlärda", "Till Repetera →" and "Historik · 10 pass →".
- **Historik** (`Historik`, `:872`, `rd-framsteg-history`):
  - the passes as a vertical stig of stops grouped by day ("Igår", "Onsdag 7 okt", …), each ringed in its section's hue (↻ on a near-neutral ring for a repetition);
  - each row: "ORD-övning", "9 av 10 rätt · 19:12";
  - the filter "Allt · Övning · Repetition" (a radio group) never drops the heading of a day it keeps;
  - there is no green pill while it lists passes, and the list ends with "Har du äldre pass än de här kan de inte visas ännu.";
  - empty: "Inga avslutade pass än. Kör en övning så landar den här." with "Till Öva".
- **States:**
  - a new reader: "Ingen prognos än", "Svara på några frågor så börjar den här sidan leva.", "Börja här · 10 frågor", the climb as a start stop and a flag, and rows reading "inget än" with neutral rings;
  - one half practised: "Prognosen behöver både verbal och kvant. Du har övat verbal — en kvantrunda till så visas den." with "Öva XYZ · ca 8 min";
  - little data: "Kurvan visas efter två veckor med övning.".
- **Calm:** no climb (the lede carries the trend), no bands, mini scales, trend glyphs or week dots; the words stay.
- **Idag (B2's one change):** "Prognosen i Framsteg →" under the prognosis, and "Alla pass" now opens Historik.

**Why it is Spår:**
- Every sequence is a stig:
  - the pass as a route of coloured legs;
  - the 40 questions as a switchback that turns like a mountain trail;
  - the climb toward a flag on the summit line;
  - the weeks as earned dots;
  - Historik as the trail walked, day by day.
- Stops come in one vocabulary (answered ink, here ring, ⚑, ✓, amber ↻), with section rings rather than tinted rows.
- The station grows into its rules instead of opening a modal.
- Bricolage display moments: "Hela sträckan", "27 av 40 rätt", "≈ 1,4 av 2,0".
- One green pill per view; the clock goes inverse, never red.

## P3 from batch 1: the phone top bar in a repetition round

- **Cause:** the bar's middle is centred and nothing in it shrinks. In a repetition round, the REP chip, the section chip and the stops spill over "Avsluta" and the clock.
- **Where:** the markup is in `SparQuant.tsx`, which is outside this write set. The layout is CSS in `spar.css`, which is in it. The fix is CSS only (`spar.css:5662`); no markup changed.
- **The fix:**
  - `.sp-ptop-mid` scrolls sideways inside itself (no scrollbar). It stays centred while it fits; the auto margins give way when it does not, so it starts at the left edge.
  - The stop on screen snaps into view (`scroll-snap-type: x mandatory`, with `scroll-snap-align: center` on `li[data-state='now']`).
  - Chips in the phone bar take the small size (24 px).
  - Nothing can overlap Avsluta or the clock at 360–390 px.
- **Not verified in a browser** (see Visual check). The reading drill's bar fits as before, so it does not scroll.

## Spec gaps (built what kit v2 supports; the rest renders without it)

- **§9 the two kinds of pass:** the hub's view model lists authentic passes only, so "Riktigt pass · Genererat pass" is not built. A synthetic result is named "genererat pass" on screen 10.
- **§9 a pass in progress** ("Pågående provpass · 37 minuter kvar" as the station, Idag's first stop): the hub has no in-progress pass.
- **§9 the rules opening at once from Idag's plan:** the hub cannot tell where it was opened from.
- **§9 busy, failure and offline states** ("Starta nu" busy, "Det gick inte att starta passet", "Inlämningen gick inte fram…", the offline line): the kit's actions are synchronous and carry no failure.
- **§9 voiding:**
  - No kit action voids a pass. "Avbryt passet" goes back to the hub with the notice locally; the real app needs an abort action.
  - "Went stale while away" (spec: void with "…tiden gick ut medan du var borta") has no signal. Per this batch's pitfall, a pass that starts with no time left is handed in once, never voided.
- **§9 answers, marks and strikes:**
  - No kit action records them; they live in the mounted pass.
  - Marks start from `running.flags` (optional) or `grid[].flagged`.
  - The real runner needs answer and mark actions.
- **§9 phone exam layout:**
  - The spec's peek/open/full sheet for long texts and DTK pages is not built in exam mode. On phone every question reads in the flow with a sticky two-row bar; desktop keeps the docked tray. The fixture pass is kvant.
  - Paragraph focus (the one Fokus aid the spec allows in a pass) and the ÖVNINGSTEXT note ("Om texten") are not built in exam mode; the badge is.
- **§9 the figure viewer:** `SparFigureViewer` is private to `SparQuant.tsx`. Exam mode gives a page Rotera (R) and Förstora (Z: twice as wide in a pan region marked `data-rd-keyscope`). Problem figures have no Förstora.
- **§10 the review (`SparReview`) and "Gå igenom missarna · N":**
  - The result has neither each question's pick nor its explanation (open question 4), so no review is built.
  - The green pill is "Till Repetera", where the wrong answers are. The verdict stops are a picture, not buttons.
- **§10 blank versus wrong:**
  - `missed` holds both, so stops are ✓ rätt or ↻ missad, and the ○ obesvarad stop is not drawn. The counts are given in words.
  - A stop's number comes from the qid's last segment (`lib/dueBySection`'s documented `{exam}-{half}-{SECTION}-{number}` shape). In a short pass the numbering may shift.
- **§10 when the pass was taken** ("idag 14:10"): `ProvResultView` has no timestamp.
- **§10 missing states:** loading, not found, "Not in the current list", fetch error and the normering skeleton have no signals.
- **§10 the P5 caveat:** the view model does not say whether a leg was P5. The caveat goes on every result with LÄS or ELF legs, the cautious choice.
- **§10 the timeout line:** the result has no "timed out" field. Spår's root keeps it after its own clock hands in.
- **§10 phone and glossary:**
  - Phone leg rows that open a sheet of stops, and the disclaimer folded behind "Läs mer", are not built. On phone the legs, the compact switchback and the whole disclaimer show.
  - The glossary dialogs ("härlett", "indikativ") are not built.
- **§11 per-section Uppslag:** "Läs i Uppslag" for a section goes to `go('uppslag')`, because no action opens Uppslag on a section.
- **§11 Historik:**
  - `framsteg.history` has no duration, text title, Provpass results or paging. Rows show kind/section, right of total and the end time.
  - Provpass results are not merged in (`hub.results` has no timestamps), so there is no "Provpass" filter.
  - Rows do not open, because there is no pass page or review data. "Visa äldre pass" is the spec's condition line.
- **§11 the diagnostic:** "Börja här" starts `startDrill({ kind: 'mixed' })`; the kit has no diagnostic request.
- **§11 little data:** "Bandet visas efter två svar." and the delta's threshold sentence are not shown (no per-week counts per section).
- **§11 loading, error and "Senast uppdaterad":** no signals.
- **§11 the goal and the weekly goal:** `prognosis.target` and `week.goal` are optional and left out when absent. Open questions 1 and 6 stand.
- **Idag's "Alla pass" → Historik:** the kit's `go('framsteg')` takes no view, so Spår's root carries it. The real app would route to `/historik`.
- **Persisted Lugnt läge:** still local to Spår's root (as in batch 1).
- **Duplication to lift later:**
  - `ExamStem`, `ExamOptions`, `ExamPage` and `NogGlyph` in `SparProvpass.tsx` mirror `SparQuant.tsx`'s private parts, with the same classes.
  - Proposal: move both into one shared module when `SparQuant.tsx` is next in a write set.
- **Theme:** production `ThemeMode` is light or dark only; nothing here adds a System choice.

## Proposed UI copy (new in this batch; the spec's wording reused where it gave one)

- **Hub:**
  - head: "Hela sträckan", "40 frågor på 55 minuter, som på provdagen. Inget facit förrän du lämnar in.";
  - station: "Föreslås · minst sett", "Valt pass", "Ditt första provpass", "Ett första pass ger en baslinje att jämföra med.", "Du har sett N av M frågor tidigare." / "Du har inte sett någon av frågorna tidigare.", "N fråga(or) gick inte att läsa in, så passet rättas av M.", "Starta provpasset";
  - rules: "Innan du startar", "Starta nu", "Inte nu";
  - register: "Alla provtillfällen · Kvantitativ", "N provtillfällen", "6/40 sedda", "Föreslås";
  - side: "Kvant står på tur om en dag.", "Dags för ett kvantitativt pass.", "Ditt senaste pass var för sex dagar sedan.", "Dina senaste pass";
  - states: "Inga riktiga pass för kvantitativ just nu", "Det finns verbala pass att göra under tiden.", "Visa verbala pass", "Passen kommer när provbanken är inläst.", "Provpasset avbröts och räknas inte. Det du svarat fel på ligger i Repetera.".
- **Running:**
  - bar and tray: "Avbryt", "Översikt", "Lämna in", "Markera", "Ditt svar: C", "Inget svar än", "Föregående", "Nästa fråga", "Granska och lämna in";
  - clock: "N minuter kvar", "10 minuter kvar", "5 minuter kvar"; "N frågor är obesvarade — fel ger inga avdrag.", "Visa dem", "Alla frågor är besvarade.";
  - overview: "Översikt", "16 av 40 besvarade", "Alla", "Obesvarade (N)", "Markerade (N)", "besvarad", "här", "markerad", "obesvarad", "Stäng översikten";
  - hand-in: "Lämna in provpasset?", "N frågor är obesvarade. Fel ger inga avdrag.", "Alla 40 är besvarade.", "Fortsätt svara";
  - abort: "Avbryta provpasset?", "Passet blir ogiltigt och räknas inte. Det du svarat fel på hittills läggs i Repetera.", "Fortsätt provpasset", "Avbryt passet";
  - images: "Frågan behöver sidan / figuren / bilderna.", "Förstora", "Rotera sidan", "Sidan förstorad: panorera med pilarna";
  - nothing to run: "Passet kunde inte starta", "Passets frågor gick inte att hämta. Klockan har inte börjat.", "Tillbaka till Provpass".
- **Result:**
  - head: "N av M rätt", "Starkast på KVA, mest tid per fråga på NOG.";
  - misses: "Dina N fel ligger redan i Repetera.", "Två frågor lämnades obesvarade.", "Inga missar. Hela passet satt.";
  - steps: "Till Repetera", "Till Provpass", "Till Idag";
  - score: "Normerat (härlett)", "Skattad poäng", "Poängen går inte att räkna ut för det här passet.";
  - sections: "Sträckan", "rätt", "missad", "över budget";
  - below: "Återkommande fälla", "N av dina missar föll i samma fälla.", "Läs i Uppslag", "Exponering", "Du hade sett N av M frågor innan.", "Tidigare kvantitativa pass", "Det här är ditt första kvantitativa pass.".
- **Framsteg:**
  - head: "Framsteg · 9 dagar till Höstprov 26", "≈ 1,4 av 2,0", the week-in-words clauses ("Prognosen steg/föll … den här veckan", "låg still", "N frågor med N % träffsäkerhet", "drar ifrån", "ligger jämnt", "mest att hämta finns i …");
  - steps: "Nästa steg uppåt", "Lägst just nu", "På väg ner", "Inte övad på N dagar", "Mycket att hämta", "Öva XYZ · ca 8 min";
  - climb: "Klättringen", "N veckor", "Från 1,0 till 1,4 på 10 veckor; målet är 2,0.", "Visa som tabell" / "Dölj tabellen", "Vecka", "Skattning", "ingen övning";
  - sections: "Delproven", "osäker / rimlig / säker", "inget än", "N försök";
  - weeks: "Veckorna", "N av 5 dagar den här veckan";
  - repetition: "Repetition", "redo nu · i kön · inlärda", "Till Repetera", "Historik · N pass";
  - Historik: "Historik", "Dina avslutade pass, dag för dag.", "N avslutade pass", "Allt · Övning · Repetition", "ORD-övning", "Blandad övning", "Igår", "Onsdag 7 okt", "N av M rätt", "Inga pass av det slaget än.", "Har du äldre pass än de här kan de inte visas ännu.";
  - states: "Ingen prognos än", "En första blandad runda visar var du står.", "Börja här · 10 frågor", "XYZ · Kvant saknas i prognosen".
- **Idag:** "Prognosen i Framsteg".
- The approved ÖVNINGSTEXT copy, the estimate caveat, the rules, the "härlett" and "Linjär skattning" disclaimers and the spec's own sentences are used verbatim.

## Verification

From `app/` on the final tree:

| Check | Result |
| --- | --- |
| `pnpm typecheck` (`tsc -b --noEmit`) | PASS, no errors. |
| `pnpm lint` | PASS: "Checked 499 files … No fixes applied. Found 4 infos." The 4 infos are the pre-existing ones in unrelated files (`LandingBakeoffR3/R4A/R4C.tsx`, `l12/M3.tsx`). |
| `pnpm exec vitest run src/components/devbake/redesign/c-spar/Spar.test.tsx` | PASS, **148/148**: the shared contract (72 checks, screens 1–11 × desktop/phone, both themes) plus 76 Spår tests (37 from batch 1, 39 new). |
| `pnpm test` (whole app, run alone) | PASS: **Test Files 108 passed (108), Tests 2232 passed (2232)**. No shared test fails with screens 9–11 declared, including `Redesign2026Bakeoff.test.tsx` (which also runs Spår's contract) and `DirectionShell.test.tsx`. |

The 39 new tests cover:
- **Hub:**
  - the suggestion, its ribbon's legs in words, the seen line, the rhythm and one green pill;
  - sittings newest first, and a chosen pass being the one that starts;
  - the half switch;
  - the rules in place, with focus in, Esc back and Enter then Enter;
  - the phone rules sheet keeping Tab inside and closing on Esc;
  - recent results opening through the host;
  - a first pass with no prescription;
  - a half with no passes;
  - falling back to the suggestion when the chosen pass leaves the list.
- **Running pass:**
  - the focus frame: no menu, calm enforced, 31:12, nothing that grades;
  - answering by click or key, with letters limited to the item, Space only after an answer, Enter and Föregående, and Esc never leaving;
  - the page gate: loading, then loaded, the same page ready at once, a new page waiting, and moving on never waiting;
  - a failed page with retry, its failure forgotten once its page has left;
  - marks and the overview: names, `aria-current`, both filters, Esc with focus back, a stop that jumps;
  - hand-in once through its gate, then the result with focus on its title;
  - "Granska och lämna in" at the last question;
  - abort with its default focus, Esc, then the void notice with focus on the hub's title;
  - the countdown under fake timers: inverse at 10:00, said once;
  - the five-minute note and "Visa dem";
  - a provider that ticks to 0, then 0 again and −1: one hand-in, never a void;
  - expired at the start: one hand-in;
  - a shrinking list and a new sitting;
  - the phone overview five to a row, with one mark and one hand-in;
  - **through the real host** (`Redesign2026Bakeoff`): the switcher's digits and ←/→ pressed on a focused button and on a focused grid stop change nothing, and handing in moves the host to screen 10.
- **Result:**
  - the raw count, the read line, the misses sentence and "Till Repetera" by Enter;
  - the normed card and its disclaimer, leg times and "över budget", the trail's name;
  - history through the host;
  - the linear score, a short pass, no misses ("Till Idag"), the trap and its lesson, and an empty history;
  - exam order from alphabetical data;
  - the P5 caveat on a verbal pass.
- **Framsteg:**
  - the spoken title, the week in words, the caveat, the reasons, one green pill by Enter;
  - a section row's full spoken name, opening in place, practising, and Esc with focus back;
  - the climb's caption and its table;
  - the weeks' picture and words, with no streak;
  - Historik by day and its filter;
  - Idag's two links;
  - no goal and no target;
  - a new reader;
  - one half practised.

### Visual check: not possible in this sandbox

- The bake-off route needs `VITE_CLERK_PUBLISHABLE_KEY`, and this worktree has no env file (as batch 1 found).
- The app's own Playwright setup (`app/playwright.config.ts`) signs in through `@clerk/testing` and starts the worker's dev server, so it needs live credentials and the network.
- This bead's rules forbid ad-hoc Node or JSDOM harnesses. So no screenshots were taken.
- **The coordinator's 16-view pass per screen is needed** on `/dev/redesign-2026-bakeoff?dev=1&d=c&s=9|10|11&w=desktop|phone&t=light|dark`, including:
  - the running pass (start it from the hub);
  - its overview and dialogs;
  - the phone repetition bar of P3 (not reachable in the bake-off, whose quant round is `mixed`).
- Not measured: rendered contrast, 320 px reflow, WCAG text spacing and reduced motion. The new screens use only Spår's existing tokens, and body text is `--sp-ink`/`--sp-ink-2` on card or canvas.
- **Places that most need eyes:**
  - the switchback's turn connectors;
  - the climb's labels at its right edge;
  - the desktop top bar's width with the ribbon below 1280 px;
  - the phone running bar at 360 px.

### Repo hygiene

- Changes are uncommitted and limited to the write set:
  - modified: `Spar.test.tsx`, `Spar.tsx`, `SparDrill.tsx`, `SparHome.tsx`, `meta.ts`, `spar.css`, `sparParts.tsx`;
  - new: `SparProvpass.tsx`, `SparFramsteg.tsx` and this worklog.
- `routeTree.gen.ts` is untouched; no dev server ran.
- `git status` also shows empty, read-only files at the worktree root that are not mine: `.bash_profile`, `.bashrc`, `.gitconfig`, `.gitmodules`, `.idea`, `.mcp.json`, `.profile`, `.ripgreprc`, `.vscode`, `.zprofile`, `.zshrc`. They are the sandbox's mount points for protected paths. Do not commit them.

## Handoff

- **Done:**
  - screens 9 (hub and running pass), 10 and 11 (Översikt and Historik), at both widths and themes;
  - `meta.screens = [1…11]`;
  - the contract plus 39 new Spår tests;
  - all gates green;
  - the P3 phone bar fix in CSS.
- **Left for the coordinator:**
  - the 16-view visual pass per screen on the real route (above);
  - review, commit and PR;
  - deciding the spec gaps, most of all:
    - the actions that record a pass's answers and marks, and void a pass;
    - per-question picks and explanations for the review;
    - Historik's missing fields and paging;
    - a section-scoped Uppslag action.
- The bead is parked deferred and unassigned, not closed.

## Round 2 — review fix (hpf-qmdr: HOLD, five P2)

- 2026-10-20: Claimed again through `gc hook --claim --json`; `bd show` matched id `hpf-qr0p.16`, status `in_progress`, assignee `ci-wisp-g7r3wo3` and route `hpfetcher/gc.implementation-worker`. Worktree clean at `5c0f4179ddb19f02045298f0f3714b51693efad2`. Read `/home/loucmane/scratch/hpf-qr0p.16/review-hpf-qmdr.md` first.
- **Red first:** the 8 new tests and 2 changed ones were written before any fix. On the unchanged code they ran 10 failed, 146 passed, and each failure was the defect itself (the all-blank result drew 40 "rätt" stops; the throwing hand-in escaped the runner as an uncaught error). After the fixes: 156/156.

### 1. No invented per-question verdicts
- **Fix:** `SparProvpass.tsx:2346` (`SparProvResult`, its doc says why) and `:2497`. Sträckan is the legs only, in exam order, each "8 av 12 · 17:30 av 16:30 · över budget". The verdict switchback, `missedNumbers` and the qid-suffix numbering are gone, so no question is called right, or missed, one by one.
  - `ProvResultView` has no ordered per-question outcomes (spec open question 4).
  - In production `missed` holds answered-and-wrong ids only (`lib/mock.ts:291–315`), with no place in the pass.
- **Layout:** the legs two to a row (`spar.css:6827`), one on phone (`:6949`). The verdict-only switchback rules, `.sp-res-route-grid` and `.sp-res-trail` are removed; `Switchback` lost its `mode` prop.
- **Red-first tests**, through the app's reducer and the kit's view builder (`computeMockSummary` + `provResultView`, `reducedResult` at `Spar.test.tsx:874`), not the fixture:
  - `:1675` an all-blank pass: 40 presented, 0 answered, and `missed` is `[]`;
  - `:1693` a short authentic pass: XYZ-001 missing, so KVA-013 (answered wrong) ran 12th;
  - `:1711` a synthetic pass whose first question is `var-2026-kvant2-XYZ-012`, answered wrong.
  - Each ends in `expectNoQuestionVerdicts` (`:927`). `:1656` (the fixture result) now asserts the same instead of the old trail name.
- **Fixture, not edited** (outside the write set): `r2Fixtures.ts:4597–4624` puts the two blank DTK questions (39, 40) in `PASS_RESULT`'s `missedQids`, against the production reducer, which leaves blanks out. Nothing on screen reads that field any more.

### 2. Image readiness belongs to the mounted element
- **Fix:** `SparProvpass.tsx:672` (`useImages`). A ref map records the element each source's state belongs to.
  - A new element for a source starts `loading`, unless it is already complete with a natural width (cached). New elements come from the DTK zoom's `div` → `section` remount, a page that returns, or a retry.
  - `onLoad` and `onError` count only from that element (`:696`).
  - The same element across re-renders keeps its state, so a page shared by consecutive questions stays ready.
- **Red-first test:** `Spar.test.tsx:1239`. Question 29 is loaded, then Z: the replacement `img` is a new element. The option is disabled, and a click and "a" answer nothing, until that element loads. Z again with `complete` and `naturalWidth` stubbed: ready at once. The existing 29 → 30 same-page test still passes.

### 3. The timeout notice belongs to its result
- **Fix:** `Spar.tsx:81`: `timedOut` is now `{ result: id | null }`.
  - The clock's hand-in adopts the id of the first result shown after it (`:112`).
  - The result page shows the notice for that id only (`:338`). Leaving screen 10 still clears it.
- **Decision:** scoped by identity rather than cleared on any open. So the pass that timed out says so again if it is reopened from another result's history while on 10.
- **Red-first test:** `Spar.test.tsx:1422`, with a host that moves (`ResultHost`, `:937`). It times out, opens an earlier result on the same screen 10 (no notice), then reopens the timed-out one (the notice).

### 4. Expired at entry: no resume, no hand-in
- **Coordinator decision applied** (it supersedes the round-1 brief). `PassEntry` (`SparProvpass.tsx:1479`) decides once, as the pass mounts.
  - `remainingSeconds <= 0` shows "Det tidigare passet kan inte återupptas", "Tiden för passet gick ut medan du var borta." and "Tillbaka till Provpass" (`RunNotice`, `:1496`, which also serves "Passet kunde inte starta").
  - Nothing is submitted, whatever the provider says later. A live run that reaches 0:00 still hands in once.
- **Test:** `Spar.test.tsx:1468` replaces the old expired-entry assertion (which expected one submit). It opens at 0, then the provider says −30: no submit, no timer, and back to the hub without the void notice. `:1398` (the ticking provider, once only) is unchanged.

### 5. A failed hand-in shows no success and traps no one
- **Fix, root:** `Spar.tsx:130`. `handIn` calls `actions.submitProvpass()` first and opens the result only when it returns. A throw returns `false` (`:135`). `leaveTo` (`:157`) is the failed runner's way out: the hub (not voided) plus `actions.go(d)`.
- **Fix, runner** (`SparProvpass.tsx`):
  - the once-only latch stays set, so nothing resubmits (`:1582`). On failure the gate and the overview close and any zoom resets (`:1587`); `failed` is `:1572`;
  - the clock stops (`:1573`), the 10- and 5-minute announcements stop (`:1608`), the switcher's key guard is released (`:1617`) and the key map is off (`:1751`);
  - the answers stay visible, read-only: the options are disabled with the pick still pressed (`:1866`), and choose, strike and flag are guarded (`:1684`, `:1688`, `:1698`). Page tools are hidden (`:1880`);
  - "Föregående" and "Nästa fråga" still read through the pass; "Nästa" no longer opens a hand-in (`:1726`);
  - the error sits in the runner (`:1883`, `role="alert"`), with "Till Provpass" as the one green pill, which takes focus;
  - Lämna in, Översikt, Avbryt, the flag and the clock are gone;
  - the frame's navigation comes back without remounting the pass. On desktop the rail sits beside it (`:2161`; `.sp-run-frame` is `display: contents` while running, `spar.css:6522`). On phone the navbar sits under it (`:2151`, `spar.css:6526`).
  - The five items are a new shared part, `SparNavItems` (`sparParts.tsx:139`), which the frame now uses too (`Spar.tsx:393`, `:424`).
- **Tests through the real host** (`Redesign2026Bakeoff` on Spår screen 9). Its own `submitProvpass` throws, because its move to screen 10 throws (`failingRoute`, `Spar.test.tsx:842`).
  - `:1559` is the manual hand-in, `:1589` the one at 0:00.
  - Both check (`expectFailedHandIn`, `:855`): one try; the alert; no result, and the host still on 9; no dialog; the nav back; focus on "Till Provpass"; and "3" reaching the host's switcher.
  - Manual adds: the answers read-only, no resubmit by Enter or a button, and the exit to the hub.
  - Timed adds: more ticks, still one try, and Idag in the nav moves the host to screen 1.
  - `:1613` covers the phone layout: the navbar, the focus, and a destination through `go`.
- **Limits:**
  - Only a synchronous throw is caught. Kit v2's actions are synchronous, so a rejected promise would not be seen here.
  - On a host that does not move, a destination from the failed runner's nav asks `go(d)` and shows the hub.

### Copy (new in round 2)
- "Inlämningen gick inte fram." / "Passet har inte lämnats in och kan inte skickas igen härifrån. Dina svar syns kvar här tills du går vidare." / "Till Provpass".
  - The spec's "Dina svar är sparade. Försök igen" is not used: no kit action saves the answers, and there is no safe resubmit.
- "Det tidigare passet kan inte återupptas" (the coordinator's) / "Tiden för passet gick ut medan du var borta." (the spec's §9 wording).

### Superseded round-1 notes
- Spec gaps §10 "blank versus wrong", including the qid-number bullet: superseded, since no stop is drawn per question.
- §9 voiding, "a pass that starts with no time left is handed in once": superseded by fix 4.

### Verification

| Check | Result |
| --- | --- |
| `pnpm -C app typecheck` | PASS, no errors. |
| `pnpm -C app lint` | PASS: "Checked 510 files … No fixes applied. Found 4 infos." (the same pre-existing infos). |
| `pnpm -C app exec vitest run src/components/devbake/redesign/c-spar/Spar.test.tsx` | PASS, **156/156** (148 + 8 new), no act or React warnings. |
| `pnpm -C app test` | PASS: **Test Files 109 passed (109), Tests 2574 passed (2574)** (2566 at the candidate + 8), no unhandled errors. |

- **Shared tests:** none failed, none edited.
- **Visual check:** still not possible here (see round 1). Most in need of eyes:
  - the desktop failed state (the rail beside the runner);
  - the phone navbar under the pass bar;
  - the result's legs, two to a row.
- **Repo hygiene:** changes are uncommitted and in the write set only: `Spar.test.tsx`, `Spar.tsx`, `SparProvpass.tsx`, `spar.css`, `sparParts.tsx` and this worklog. The empty dotfiles at the root are still the sandbox's mount points.

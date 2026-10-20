# Worklog — hpf-qr0p.9

Redesign round 2, direction A · Folio, batch 1: screens 5 Öva, 6 Kvantfråga, 7 DTK, 8 Repetera, and screens 1–4 moved onto kit v2.

## State

- 2026-10-20 · Claude worker, session `ci-wisp-vmt2xl8`. Base `980c9b2` (origin/main), branch `codex/hpf-qr0p.9-redesign-round-2-direction-a-folio-batch-1-va-kvantfr-ga-dtk`.
- Changes are **uncommitted**. Only the ten admitted files changed. The worktree's untracked dotfiles (`.bashrc`, `.idea`, …) were already there when I claimed the bead; they are not mine.
- Read before building:
  - `docs/redesign/kit-v2.md` and the shared kit files;
  - the spec `docs/redesign/directions/a-folio.md` (§1, screens 5–8, §3–§5);
  - the round-1 brief;
  - the worklogs of the B and D batch-1 beads (hpf-qr0p.12, hpf-qr0p.18).

## What was built, and why it is Folio

**5 · Öva** (`FolioOva.tsx`). The practice hub is set as a book's table of contents, in the page grammar of Idag:
- the masthead "Öva", then the title "Vad tränar vi?";
- a standfirst carrying the schedule's suggestion (the only place it is said);
- the lead under the heavy rule. It is the repetition round when misses are ready ("Åtta missar, ungefär 9 minuter", **Börja repetera ↵**), else the weakest section, else a mixed set.
- "Delproven" in two italic parts, Verbal del and Kvantitativ del. Each section is a contents entry: its code in the margin, name and gloss, and leader dots to the reader's level where a book prints the page number.
- The suggested section carries the 2 px accent rule in the margin, one indicator only. Blandat closes the list after a hairline.
- Marginalia: "Fällan just nu" (Öva detta mönster) and "Om övningarna" (the drill length, and Frågeurval read-only with a link to settings).
- One ink-blue button; no chips, tiles or icons.
- States: a new reader gets a mixed lead with the "Inga missar än …" line. Misses waiting with none ready give a section lead plus the "Inget är redo just nu – …" standfirst. All relearned gives "Kön är tom just nu – …".

**6 · Kvantfråga** (`FolioQuant.tsx`). One page, centred at the recto's 640 px measure, set like a textbook exercise:
- the problem's number hangs in the margin at the prompt's first baseline;
- KVA's condition is its own line, then the quantities side by side in a ruled table (`th scope="col"` "Kvantitet I | II", a column rule between them);
- NOG's question, then statements (1) and (2) hanging like ¶ numbers in a list named "Påståenden", then the italic lead-in;
- the pre-answer tactic (`pregrade_tactic`) is a printed margin note behind a column rule;
- math renders through `MathText`, with lining tabular figures.

On Svara the book opens to its answer key: the problem moves into the verso by a FLIP translate (180 ms, Web Animations; instant under reduced motion and in stills), with every option graded in place. The facit enters on the recto, and focus moves to the verdict. Nästa fråga returns to a single page.

On phone it is one scrolling page with the action anchored at the foot. After Svara the page scrolls so the verdict sits under the head, above the graded options, with "Visa uppgiften ⌃" on its line.

The set ends in the colophon. "Hela passet ›" opens the round's ruled list (outcome as glyph plus word), and each row opens that question's graded, read-only facit.

**7 · DTK** (`FolioQuant.tsx`). Always a spread, because the figure page is DTK's passage:
- The plate is tipped in on the verso: fitted to the verso's width and height (container query units), a hairline frame, and an italic caption from the data.
- It is keyed by its page, so it stays put while its questions change; "Första av tre frågor till figuren" shows when the sitting has several questions on one page.
- In dark mode the plate stays the white printed page. It is never inverted or filtered.
- **Förstora** opens `FigureViewer`: full-stage on the page's own paper, built on the new `FolioDialog`. It traps focus, closes on Esc and gives focus back to Förstora.
  - Toolbar of words: Mindre · 150 % · Större · Rotera · Hela sidan. Also + / − / R, arrows to pan, drag, and ⌘/Ctrl + wheel.
  - The zoom level is announced, the drill's keys rest while it is open, and zoom, scroll and rotation are kept per page for next time.
- Rotera turns the plate in place.
- If the plate fails, an erratum appears in the frame, with Försök igen. Svara stays available, as the spec asks.
- Image options are supported: a crop beside its letter, dimmed when struck, with the text standing in if the image fails.
- On phone the reading drill's slip carries the question ("Visa figuren ⌄"), and the plate is the page.

**8 · Repetera** (`FolioRepetera.tsx`). Inside Öva, so the contents keep Öva current:
- masthead "Öva · Repetera", then "Dina missar" with the rule as its standfirst;
- the lead is the round ("Åtta missar", "ungefär 9 minuter", **Börja repetera ↵**);
- "Kön per delprov" is a contents list whose page numbers are what is ready now, each entry a round of that section only. A section with nothing ready is a plain row: "Tre blir redo senare idag".
- "Missarna" lists the misses themselves, as kit v2 requires: section code, the question's stem (NOG's question, KVA's quantities, MEK blanks as gaps) and the trap behind it. The ready ones come first; the rest of today's pile is folded behind "Visa de 15 som blir redo senare".
- Margin: the real scheduling rule (1, 2, 4, 8, 16 and 30 days; ten minutes after a wrong answer, checked in `worker/src/lib/srs.ts`) and the no-penalty note.
- A miss is said as time, never as "fel" in a list.
- The three empty cases each end with **Börja en övning i {S}**.

**Shared, built once for later batches.**
- In `FolioHome.tsx`: the page grammar, which spec §3 wants in a `parts.tsx` that is not in this write set: `FolioPage`, `Masthead`, `Lead`, `ContentsEntry` (with a static-row mode), `PartHead`, `MarginBlock`, plus `inWords`, `capitalised`, `scoreOrDash` and `slug`.
- In `FolioDrill.tsx`:
  - the drill-view seam `DrillSeam` / `drillSeam()`: label, unit Fråga/Miss, next labels, `Verdict.after`, lang;
  - `ORIGIN` (Avsluta and the colophon go back where the reader came from);
  - `Verdict` (with `after` and a focus ref), `Options` (math and image options), `GradedOptions` (with `all`), `Facit`;
  - `Spread` (with a `start` width and a named verso), `Colophon` (with an `extra` slot), `KeyHints` (with parameters), `ActionBar`, `ExitButton`, `EmptyDrill`;
  - `FolioDialog`, `GapText` (the plain MEK blank), `questionStem`, and `entryName` (readable framework names, never raw ids).
- In `FolioQuant.tsx`: `RoundList`.
- One new token: `--fo-math-scale`.

## Screens 1–4 on kit v2

No direct `r1Fixtures`/`useDrill` import is left in Folio:
- Home, the frame, the drill and the colophon read `useDirectionData()`.
- The reading drill is `useDrillCore` graded by `actions.drill`, with round 1's switcher sync kept (screen 3 opens graded with the bake-off's wrong pick; Läsfråga/Facit clicks re-seat).
- Optional fields are left out when absent: pause time and device, minutes left, the prognosis range and delta, the weekly goal, a null resume (the plan's first part becomes the lead), and the drill clock (shown only when the sitting knows its time or starts fresh).
- On the fixture day the page is unchanged. `Folio.test.tsx` pins this word for word: the day sentence, "Pausad idag 07:52 på telefonen", "Fråga 3 av 4 · ca 6 min kvar", the week line, the scale's label and the nav count 23.

Deliberate changes, each spec'd or for data honesty:
- Idag's plan rows call `actions.openPlanItem(id)` (spec §3, B1 wiring). The colophon's "Nästa: Repetition" does the same, so in the bake-off it opens screen 8, not Öva.
- The contents call `actions.go(d)`. Idag and Öva turn at once; other destinations are the host's (the shared "Inte byggd än" card). Folio's round-1 stub and its CSS are removed.
- The account slip said "Inloggad · gratisplan", which had no source. It now says "Inloggad som {name}", or "Inloggad · {plan}" when `identity.plan` exists. Logga ut also calls `actions.signOut`.
- Avsluta on 2–3 still calls `onScreen(1)` when the reader came from Idag (the contract checks this), then the controller's `exit`. In the bake-off that returns to the hub, so coming from Öva it goes back to Öva.
- Space moves on from the facit and never answers, per the brief's keyboard floor. Enter is unchanged.
- Landmarks (spec §1.9 New): the phone page is a `main`, and the marginalia are an `aside` named by their first head. The reading verso is now an unnamed `section`, so no landmark and no visual change.
- The folded rail carries from screen 4 into Öva and Repetera. Screens 1 and 4 still re-seat it.

## Verification

| Check | Result |
|---|---|
| `pnpm typecheck` (from `app/`) | PASS |
| `pnpm lint` | PASS: 488 files, 4 informational notes, all already present in unrelated files (LandingBakeoffR3/R4A/R4C, l12/M3) |
| `pnpm test` | **1,804 passed / 1 failed**, 108 files. The one failure is the shared test below, outside the write set. |
| `Folio.test.tsx` alone | 75/75: the shared contract for 8 screens × 2 widths × 2 themes (54) plus 21 Folio tests |
| `git diff --check` | PASS (no whitespace errors). Biome formatted every Folio file; `git status` shows only the admitted files. |

The 21 Folio tests cover:
- Home: the round-1 copy kept exactly, optional fields absent, plan-led Home, plan rows through `openPlanItem`, the contents through `go`;
- Öva: the lead, ↵, the register, and the cold and none-ready states;
- Repetera: section rounds, folded later misses, stems, the empty state;
- the reading drill: controller grading with a supplied sitting, no explanation, Avsluta from Idag versus from Öva;
- quant: the XYZ/KVA/NOG anatomy, keys (no E on four options, digits and Esc ignored, Space never answers), focus on the verdict, the colophon round list and its review, the phone verdict above the options, the repetition seam, an inline SVG figure through a mocked fetch;
- DTK: the plate kept across three questions on one page with its cue and caption, Förstora (focus, inert page, keys resting, zoom, turn, arrows kept from the switcher, focus returned, zoom kept), a failed plate with Svara still open, the phone slip.

**Visual self-check.** Vite does serve on 127.0.0.1 in this sandbox, but only to the same command. The dev route itself needs `VITE_CLERK_PUBLISHABLE_KEY`, which this worktree lacks, so I did not use it.

Instead, a scratchpad harness mounted the router-free `Redesign2026Bakeoff` with Vite and Playwright in one Node process. Six views:
- 5 desktop light;
- 6 desktop light, before and after Svara;
- 7 desktop dark;
- 8 phone light;
- 6 phone dark after Svara.

No element was wider than the stage, and the only console errors were the blocked font requests. Google Fonts are blocked by the proxy (407), so the views show system fallback faces: **typography was not verified in Literata/Inter**.

The coordinator still needs the 16-view pass per screen with the real fonts.

## Shared test outside the write set (for the coordinator)

1. `app/src/components/devbake/redesign/Redesign2026Bakeoff.test.tsx:343–351`, "remounts a direction fresh when it comes back from a screen it lacks".
   - It uses `d: 'a'` (Folio) with `s: 5` as the screen Folio lacks. Folio now builds 5, so the assertion at `:348` fails.
   - Proposed fix: derive the lacking screen, e.g. `const lacking = APP_SCREENS.find((s) => !builds(DIRECTIONS[0], s.key))` and use `lacking.key` (9 today), or use `s: 11` as the side-by-side test does.

## Spec gaps (kit v2 does not carry them; rendered without; spec section)

**Öva (screen 5)**
- *What it shows.* No per-section minutes: Öva entries end at the level instead, and the drill length is said once in the margin. The round's minutes come from the plan's repetition item; Öva and Repetera have no field of their own for it.
- *ADHD-PI.* "Per-section miss counts appear only on Repetera's page" conflicts with the kit contract. `contract.ts:578` requires `rd-ova-section-<sektion>` to show its waiting count.
  - I followed the contract, wording the count as a note on where the misses wait ("5 missar väntar i Repetera") so the entry never poses as their door.
  - Owner or kit decision.
- *Which count the navigation shows* (a Change, open question 18). I kept the pile (`home.ovaDue`, as round 1): screens 1–4 must not change and the question is still open.
- *States.* The view model has no loading, error or paused-repetition state, so "sättning", the stats or queue erratum and "Pausad vid miss 3 av 10" are not built. The erratum pattern itself is built and used for figures.
- *The hot-trap offer.* There is no time for "Fem minuter på fällan först", so the link reads "Öva detta mönster" and starts `{ kind: 'framework' }`.

**Kvantfråga (screen 6)**
- *NOG.* "Se (1)" links need the shared kit rule (`r1Kit`/`drillCore`), which is not admitted. No such links are shown.
- *Done.* There is no estimate after a drill, so the "NOG-prognosen steg till …" line is not shown.
- *States.* No explanation-loading or failed state, and no "Markera som saknad" mutation. A null explanation shows "Förklaring saknas ännu för den här frågan."
- *KVA on phone.* I kept the two-column table at 390 px rather than stacking the quantities: both fit, and the table keeps its column headers for screen readers. Owner's call if stacked is wanted.
- *Motion.* The FLIP on Svara is built. The recto's 100 ms exit on Nästa is not; it is instant.
- *ORD and MEK* ride on the quant page: ORD's word at t32, MEK's blanks as `GapText`. But the bake-off maps ORD/MEK drills to no screen (`directionData.tsx` `drillScreen`). So in the bake-off, Öva's ORD/MEK entries and Idag's "ORD-övning" row do nothing. Kit gap.
- *Math.* `--fo-math-scale: 1.14em` was set by computation, not measured: KaTeX_Main's x-height (0.431 em) scaled to an estimated Literata x-height of about 0.49 em. Literata never loaded here, so measure it in a browser in 0.02 em steps.

**DTK (screen 7)**
- *Caption.* `DrillFigure` has no page number or question range, so the caption reads "Hösten 2025 · Provpass 1 · uppgift 29" (a range when the sitting has several questions on the page).
- *Accessible name.* The plate's name is the view model's alt, as the contract requires.
- *Description.* There is no description field, so there is no "Beskrivning ›".
- *Page cue.* It is derived from questions sharing a figure within the sitting. The fixture sitting has one DTK question, so the bake-off shows no cue; the tests cover it.
- *Förstora.* Touch pinch-zoom is not built.

**Repetera (screen 8)**
- *Missing data.* No paused round, retired P5 text, section-scope empty state or earlier wrong pick ("Förra gången: A").
- *The verdict's second line.* For a right answer it needs the miss's ladder step, which the view model lacks. Only the wrong-answer line shows ("tio minuter", the fixed relearning step).
- *The misses list.* The start page also lists the misses themselves (the kit requires `rd-repetera-item-<n>`). The spec's page has only the per-section list.

**Shared plumbing (§3) and frame (§1.8)**
- *Parts file.* `parts.tsx` is not admitted, so the parts live in `FolioHome.tsx`, `FolioDrill.tsx` and `FolioQuant.tsx` (listed above). Move them when a batch admits it.
- *Seam.* `drill` and `repetition` are built. Batch 2 adds `pass`, which needs a non-grading path because `useDrillCore` always grades on lock, and `review`.
  - The repetition mode applies to a sitting whose `request.kind` is `'repetition'`.
  - The bake-off's fixture quant sitting is `'mixed'`: its repetition action opens that same sitting.
- *Account slip.* The Change that makes its Konto and Inställningar open screen 13 belongs to batch 3 (§3 table). They still close the slip, as in round 1.
- *Theme.* Production saves light or dark only. The slip's "System" stays a one-time follow; no saved System preference.

## Proposed copy

All new Swedish UI strings are proposed, not approved product copy. The approved ÖVNINGSTEXT copy and the estimate caveat are used verbatim from `data.copy` and the view model.

The full set of new strings:

- **Öva:**
  - title and lead: "Vad tränar vi?", "Repetera · de äldsta först", "{n} missar, ungefär {m} minuter", "{n} till blir redo senare idag", "Välj delprov · {n} redo nu";
  - suggestion and new-reader leads: "Förslag · {S}", "Börja med {S}", "Börja här", "Blandad övning", "Börja blandad övning";
  - the four standfirsts;
  - register: "Delproven", "din nivå", "Verbal del" / "Kvantitativ del", the eight section glosses, "{n} missar väntar i Repetera";
  - the Blandat entry, the "—" footnote;
  - margin: "Fällan just nu", "Öva detta mönster", the "Om övningarna" note, "Frågeurval: smart/slumpat", "Ändra i inställningarna".
- **Repetera:**
  - "Dina missar", "De äldsta först, högst tio åt gången.", "Den här omgången", "Avsluta när du vill – svaren sparas efter varje fråga.";
  - "Kön per delprov", "redo nu", "{N} blir redo senare idag";
  - "Missarna", "Redo nu", "Senare idag", "Visa de {n} som blir redo senare", "Fälla: {name}";
  - "Så flyttas de fram" and its two rules, "Gissa hellre" and its note, "Börja en övning i {S}", the empty-case lines.
- **Drills:**
  - heads and units: "Kvant · {S}", "Repetition · {S}", "Miss {n} av {N}";
  - next and finish: "Nästa miss", "Slutför genomgången", "Sista missen i omgången", "Slutför övningen", "Sista frågan";
  - verdict and quant: "Frågan kommer tillbaka om tio minuter.", "Jämför de två kvantiteterna.", "Taktik";
  - figures: "Förstora", "Rotera", "Rotera figuren 90 grader", "Mindre", "Större", "Hela sidan", "Stäng", "Förstorad figur", "Figuren, förstorad – dra för att flytta", "Figuren gick inte att visa.", "Försök igen";
  - navigation within a page: "{Ordinal} av {n} frågor till figuren", "Visa figuren", "Visa uppgiften";
  - the end of a set: "Hela passet" / "Hela omgången", "Tillbaka till passet" / "Tillbaka till omgången", "Besvarad {datum}.", the repetition colophon lines, "Fällan bakom {n} av dem: {name}.", "Repetitionen";
  - empty and missing states: "Förklaring saknas ännu för den här frågan.", "Inga frågor att öva på just nu.".
- **Idag** (only when data is absent):
  - "Först idag · {S}", "Börja · {m} min", "Dagens plan är klar.";
  - "Prognosen visas när du har svarat i båda delarna.";
  - "Påbörjad för mer än en vecka sedan", "Fortsätt" and "Övningen öppnas vid fråga {n}." (for a non-text resume);
  - "Inloggad som {name}".

## Handoff

- **Done:** screens 5–8 at both widths and in both themes, the migration of 1–4, Folio's test file on the shared contract, the self-check above, and this worklog.
- **Left for the coordinator:**
  - the shared test fix above;
  - the 16-view screenshot pass per screen with the real fonts, including Förstora's focus trap in a real browser and 320 px reflow;
  - measuring `--fo-math-scale`;
  - review and commit.
- Kit and owner questions are listed under Spec gaps. Bead parked deferred after this note.

## Round 2 — review fixes (hpf-yyal)

- 2026-10-20 · Claude worker, session `ci-wisp-wga2m1u`. Started at `b64bf7f`: the batch `7b6b976` with origin/main merged in by the coordinator, clean. Changes are **uncommitted**, in four admitted source and test files plus this worklog.
- Coordinator decision on finding 1 (grading while a plate loads or fails): by design per the merged spec `docs/redesign/directions/a-folio.md:845–849` (Svara stays available), so not changed. The by-design test "keeps Svara open when the page fails to load" is untouched. It is now at `Folio.test.tsx:586`, moved from :461 only because new tests sit above it.

Each fix below names the test that proves it. All seven new tests were run on the unfixed code first: each failed where the review said, and all pass after the fixes.

1. **Finding 2 · a replaced sitting kept the old core.**
   - Fix: `FolioQuant.tsx:117–119` keys `QuantDrill` on `session.id` (screens 6 and 7), and `FolioDrill.tsx:283–285` keys `ReadingDrill` on `data.drills.reading.id`. A sitting the host replaces mounts a fresh core at its own start. An update of the same sitting (same id, new objects) keeps the reader's place. B · Instrument and D · Lager key their drills the same way.
   - Test: `Folio.test.tsx:300` "a sitting the host replaces", four cases (screens 2 and 6 × desktop and phone).
     - The sitting opens at index 1. The provider then hands down a one-question sitting, with a new id, from index 0.
     - It checks "Fråga 1 av 1" and grades the new question through the controller.
     - It then hands down the same sitting with its explanation gone: the verdict stays and "Förklaring saknas ännu …" appears.
   - Red: all four threw `TypeError: Cannot read properties of undefined (reading 'qid')` in `useDrillCore` (`drillCore.ts:483`) on the rerender.
2. **Finding 3 · Repetera could hide the whole later pile.**
   - Fix: `FolioRepetera.tsx:209–210, 226`. `open` now means only "opened by the reader" and starts false; the list renders when `!folded || open`. While there is a round to start, the later pile is folded as before. Once nothing is ready, it is the list itself, with no disclosure.
   - Test: `Folio.test.tsx:228`. Mount the fixture queue (8 ready, 15 later, the later list closed), then hand down the queue with only the 15 later misses. There is no "Visa de … som blir redo senare" button, and there are 15 miss rows.
   - Red: zero rows (`Unable to find … rd-repetera-item-` at :237).
3. **Finding 4 · the finished round's review dropped SVG figures.**
   - Fix: `FolioQuant.tsx:1599–1611`. `Review` sets an SVG figure above the problem with `FigureInline`, as the drill does before the answer and in the facit. A raster figure stays the plate.
   - Its Förstora works. The one viewer in `QuantDrill` now holds the figure it shows (`FolioQuant.tsx:169–181, 308–319`): the drill opens it on the question's figure, and the review (`QuantDone` → `Review`, `onZoom`) on the reviewed one. While it is open, keys rest and the page is inert, as before.
   - Test: `Folio.test.tsx:465`, a one-question XYZ sitting with an SVG figure.
     - The figure is there before the answer and in the facit.
     - After Slutför, Hela passet › Fråga 1 shows it inlined.
     - Förstora opens the viewer on it, Enter does not reach the colophon, and Esc gives focus back to Förstora.
   - Red: the review ("Fråga 1 av 1 · XYZ") had no image named "Figur till uppgift 1".
4. **Finding 5 · an option picture's failure outlived its source.**
   - Fix: `FolioDrill.tsx:983–1001`. `OptionContent` records which source failed and keys the `<img>` on its source. A new source is tried at once; the text stands in only for the source that failed.
   - Test: `Folio.test.tsx:510`.
     - Option A is a picture (`figures/old-option.png`). The reader picks A, the picture fails, and the text stands in.
     - The provider then sends `figures/new-option.png` for the same option. The picture renders from the new source, on the same question, with A still picked.
   - Red: no image after the new source (`Folio.test.tsx:528`).

Test plumbing:
- `mount()` in `Folio.test.tsx` gained `supply(data)`, a provider rerender with new data.
- The SVG review test waits with Testing Library's `waitFor`, not `vi.waitFor`, so React's act(...) check does not flag the async SVG load.

### Verification (round 2)

| Check | Result |
|---|---|
| `pnpm typecheck` (from `app/`) | PASS |
| `pnpm lint` | PASS: 488 files, the same 4 informational notes in unrelated files (LandingBakeoffR3/R4A/R4C, l12/M3) |
| `pnpm test` | PASS: **1,815 passed / 0 failed**, 108 files (1,808 at the candidate + the 7 new tests) |
| `Folio.test.tsx` alone | 82/82; this file prints no act(...) warnings |
| `git diff --check` | PASS. `git status` shows only admitted files modified: the four source and test files and this worklog. |

- The round-1 shared-test failure (`Redesign2026Bakeoff.test.tsx:348`) passes now: the coordinator's merge brought in main's fix. I did not edit it, and no shared test outside the write set fails.
- Not done this round: real-browser screenshots. The fixes change no layout or CSS; the review's SVG figure uses the drill's own figure block and styles.

### Left open

- In the review, a raster (DTK) plate still has no Förstora, as in round 1. The finding was about SVG figures, so the plate is unchanged. Passing `onOpen={() => onZoom(figure)}` to it would add one (coordinator's or owner's call).

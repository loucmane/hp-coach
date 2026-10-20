# Worklog — hpf-qr0p.10

Redesign round 2, direction A · Folio, batch 2: screens 9 Provpass (the hub and a running pass), 10 Provpassresultat and 11 Framsteg (with Historik).

## State

- 2026-10-20 · Claude worker, session `ci-wisp-tyyul7o`. Base `9e77e36` (origin/main), branch `codex/hpf-qr0p.10-redesign-round-2-direction-a-folio-batch-2-provpass-provpass`.
- Changes are **uncommitted**, in the nine admitted files only: `Folio.test.tsx`, `Folio.tsx`, `FolioDrill.tsx`, `FolioFramsteg.tsx` (new), `FolioHome.tsx`, `FolioProvpass.tsx` (new), `folio.css`, `meta.ts` and this worklog.
- Untracked files that are not mine: the worktree root's dotfiles (`.bashrc`, `.idea`, …), there when I claimed the bead, and `app/.claude/` plus `app/.mcp.json`, which are the sandbox's bind-mount placeholders (character devices owned by `nobody`).
- Read before building:
  - `docs/redesign/kit-v2.md` and the shared kit files;
  - the spec `docs/redesign/directions/a-folio.md` (§1, screens 9–11, §3–§5);
  - the round-1 brief;
  - Folio's batch-1 worklog (`hpf-qr0p.9.md`);
  - the reviewed Provpass and Framsteg of B · Instrument and D · Lager, for the pitfalls their reviews found.

## What was built, and why it is Folio

**9 · Provpass, the hub** (`FolioProvpass.tsx`). A printed exam notice, set in the page grammar:
- Masthead "Provpass" alone; the title "Anmälan."; the live app's standfirst ("40 frågor, 55 minuter, riktiga provvillkor – ingen feedback förrän du lämnar in.").
- The half as a word pair, "Halva  Verbal · Kvantitativ" (`.fo-seg`, the chosen word underlined in the accent).
- The lead is the *kallelse*, the summons, under the heavy rule. It names the pass the reader has seen least for the half: "KALLELSE · MINST SETT", the pass as the page's largest type ("Hösten 2025, provpass 1", t44), the half's composition ("Kvantitativ · XYZ 12 · KVA 10 · NOG 6 · DTK 12"), "Du har sett 6 av 40 frågor." and "Inskriven: {namn}". The screen's one filled button, **Starta provpasset ↵**, sits under it.
- The register is a real ruled table: a sitting per row, newest first, leader dots from the sitting to its two passes, each cell "sett 6/40". Choosing a cell moves the lead to that pass ("VALT PASS"), and the filled button follows. On phone it is entries grouped under each sitting (italic head), the three newest shown until "Visa alla …"; the chosen pass's sitting always shows.
- Marginalia: "Villkoren" (the four rules as sentences), "Poängen", "Senaste passen" (each opens its result) and "Alla pass i Historik".
- **Starta provpasset only opens the conditions**, a modal slip: the pass, "Kvantitativ · 40 frågor · 55 minuter", the four rules as a numbered note between hairlines, **Starta nu ↵** (the shared `rd-confirm`) and "Inte nu (Esc)". A second press of Starta nu starts nothing more. The frame under the slip is inert.

**9 · Provpass, the running pass.** Focus mode: the frame steps aside, and each question keeps its drill layout, never graded.
- XYZ, KVA, NOG, ORD and MEK are the single page (screen 6), DTK the plate spread (screen 7), LÄS and ELF the reading spread (screens 2 and 14).
- **The running heads.** Avbryt passet is at the far left of the first head. The centre reads "PROVPASS · KVA", or "PROVPASS · LÄS · ÖVNINGSTEXT", where the badge lives on desktop. The last head holds "Fråga 17 av 40", **Översikt**, the clock as time left ("31:12 kvar") and **Lämna in**.
- **The clock** is a `role="timer"` named in words ("31 minuter och 12 sekunder kvar"), never live. It folds to its line on a press. At five minutes it comes back on its own, heavier, in ink, never red. "Fem minuter kvar" and "En minut kvar" are said once each, in a polite status.
- **The pass index** sits under the last head: one segment a question, a gap between sections, like a booklet's thumb index. Answered segments are ink, unanswered a rule, the current one the accent; a marked one has a folded corner. A hover pulls its tab out ("Fråga 22 · obesvarad"), and a press goes there. It stays out of the tab order: the keyboard has ←/→ and Översikt. On phone it is the head's foot line.
- **Never graded.** Choosing an option saves it, said in the echo "Ditt val: B · sparat". Striking stays. **Nästa fråga ↵** works with nothing chosen; on the last question it becomes **Lämna in ↵**. There is no tactic note. The key line shows on the question the reader came in on.
- **Markera** (only when the host has flags) folds the page's corner: a dog-ear on the question, a folded corner on its index segment and on its Översikt numeral.
- **Slips.** Översikt shows the four sections by their codes, each question a numeral: underlined once answered, ringed where the reader is. Its filled button is Lämna in, and "16 av 40 besvarade" stands in its head. The hand-in slip says the blanks in words ("En fråga är obesvarad – fel ger inga avdrag, så gissa hellre.", or "Alla 40 frågor är besvarade."), with links to up to twelve of them. A failed hand-in shows the erratum "Inlämningen gick inte fram. Dina svar är sparade." and **Försök igen**. The abandon slip's filled, safe default is **Fortsätt provpasset ↵**; **Avbryt passet** sits under a double rule.
- **Phone.** Single-page questions keep one page with the bar anchored at the foot; the page names the question once. DTK and reading questions keep the slip that peeks and opens. The head carries Avbryt, the clock, Översikt and Lämna in.

**10 · Provpassresultat.** The book's closing page and appendix, with the frame back:
- masthead "Provpass · Resultat" and the pass;
- ⁂ in the accent over the title "Provpasset klart.", then one sentence on how it ended ("Kvantitativ, riktigt pass. Du lämnade in efter 53 minuter.", or "Tiden tog slut – …");
- the lead holds the display figure: t44 lining figures with HP's two decimals and its footnote mark, "normerat (härlett) · av 2,0" or "skattad poäng · av 2,0", "27 av 40 rätt", a short pass's true size, and the 0–2,0 scale with no band (one result, not a forecast);
- "Per delprov" is one ruled table in the test's order, leader dots to "Rätt · Tid · Budget", with "över budget" said in italic words, never red; a short pass's budgets are scaled to the questions it had;
- "Missarna" is an errata list (place, section, stem, "rätt B"), under "11 missar ligger nu i Repetera; två lämnades obesvarade.";
- margin: "Tidigare pass" (same half and mode, each opening its result), "Återkommande fälla" when there is one, "Exponering";
- the normering footnote closes the main column ("UHR normerar hela den kvantitativa delen (80 frågor) – …").
- The filled button is **Till Repetera ↵**, where the misses now wait. With no wrong answers it is **Nytt provpass ↵**. Esc goes to Provpass.

**11 · Framsteg** (`FolioFramsteg.tsx`). A report set in a book:
- title "Framsteg"; the standfirst is the week in one sentence ("180 frågor den här veckan med 70 % träffsäkerhet. Gapet upp till målet bärs framför allt av XYZ och DTK.");
- the lead is one light figure, the prognosis "1,4*", with "+0,1 sedan förra veckan", "Verbal 1,5 · Kvant 1,3" and the scale with its goal tick ("mål 2,0 →" opens Konto). Then "Mest att vinna: XYZ – lägst just nu men på väg upp." and the one filled button, **Öva XYZ · 10 frågor ↵**;
- "Poäng över tid" is a line chart drawn as a book figure. It has hairline axes, three gridlines, the goal dashed and labelled at its end, and the weeks as a 1.5 px ink line with the last point an accent dot and its value. Weeks without practice are a dotted bridge. Below come an italic caption and a "Visa som tabell" disclosure with all the values;
- "Delproven" is a ruled table in test order: the estimate (LÄS and ELF carry the caveat's asterisk), its ± band, the trend in words ("↗ upp", the arrow hidden from screen readers), the basis ("400 · hög") and "16 dagar sedan" when stale;
- "Sedan" holds the next two suggestions as contents entries; "Historik" the latest five rows and "Alla pass →";
- margin: "Fällor" (the first three traps, "Alla fällor →"), "Repetitionen" ("8 att repetera nu →", "61 i kön · 412 återlärda") and "Övningsdagar". The last is one row per calendar week, a dot for each day practised and the count in words ("fyra av fem dagar" this week). There are no places for the days missed, and no streak or record anywhere;
- the caveat, verbatim, is the figure's footnote.

**Historik**, Framsteg's back matter:
- masthead "FRAMSTEG · HISTORIK", whose "Framsteg" is a link back; Esc goes back too. Framsteg stays current in the contents;
- "Tidigare pass." over a ledger by calendar week: a head per week ("Vecka 41 · 5–11 oktober", "4 pass"), then rows of the day ("tor 8 okt"), the kind in words ("ORD-övning", "Repetition", "Blandad övning", never a raw tag) and leader dots to the result;
- the finished provpass are a part of their own, each opening its result.

**Fällor**: "Dina fällor.", the growing trap as the lead (**Öva fällan ↵**), and the register by section in test order; each trap has "Slå upp →" and "Öva →".

**Idag (spec §3, batch-2 wiring).** The prognosis head is a link to Framsteg. "Alla fällor i Framsteg" opens Fällor and "Alla pass i Framsteg" opens Historik. A plan item that suggests a pass (`kind: 'mock'`) opens that hub's conditions slip once the host lands on screen 9.

**Shared parts, extended rather than forked** (spec §4):
- `FolioDrill.tsx`:
  - `FolioSlip`, the modal slip on `FolioDialog`, for B3's Konto too;
  - `FolioDialog` now carries `data-rd-keyscope`, takes `labelledBy`, and ignores a held key's repeat on its buttons;
  - `Options` and `PassageView` (now exported) take only what they read, so a never-graded pass can hand them its state;
  - the spread's two pages and the phone reading drill's scroll are `data-rd-keyscope` regions.
- `FolioHome.tsx`: `Scale` exported with parameters (a mark, an optional band and goal tick), `ResultFigure`, `Masthead` with a crumb, `MarginBlock` with a linked head, `Lead` with a test id.
- `folio.css`: `.fo-seg`'s columns now follow its words (the spec's B2 change). The batch-2 block adds `.fo-table` (the ruled table), the slip, the pass index and the other new pieces, all on the existing tokens; **no new token**.

**Lifted from `FolioQuant.tsx`, which is outside this write set.** The running pass needs screen 6–7's quant problem, DTK plate, inline SVG figure, Förstora and erratum. They are private to `FolioQuant.tsx`, so `FolioProvpass.tsx` carries copies: `QuantProblem`, `FigurePlate`, `FigureInline`/`SvgFigure`, `FigureViewer` and `Erratum`, the same parts set the same way. The spec (§3) asks a batch not to fork its parts. Follow-up for the coordinator: export these five from `FolioQuant.tsx` and delete the copies (a mechanical change).

## The known pitfalls, each handled and tested

| Pitfall (brief) | What Folio does | Test (`Folio.test.tsx`) |
|---|---|---|
| Required figures gate answering | By design per the merged spec (a-folio.md:845–849), answering stays open while a plate loads or has failed; the pass never gates a choice. A plate, an SVG and an option image are each keyed by their source, so a new source starts fresh. | "sets a DTK question on its plate …" |
| Switcher keys | The pass's capture handler `preventDefault`s 0–9 and ←/→ whatever has focus. Slips and Förstora are `data-rd-keyscope`, as are the pass root and the scroll regions. | "keeps the switcher's keys inside a running pass, from the {option, cell, heading, body}" and "keeps a slip's keys its own …", both through the real `Redesign2026Bakeoff` |
| A provider countdown reaching 0 | The deadline is set once, at the start; the host's count can only bring it closer. At 0 the pass hands in once, also with a slip open, and is never voided. If that hand-in fails with the time up, the pass waits for the reader's retry. | "hands the pass in once when the host's countdown reaches zero …", "… on its own clock too, even with the abandon slip open", "tries a failed hand-in at time out once …" |
| Decide expiry once | Expiry is decided when the run opens. A pass already out of time never runs and does not count ("Passet hann ta slut …"), with no hand-in. | "never starts a pass whose time is up when it opens …" |
| Shrinking lists, new ids | The pass clamps its place, and none-left is a blank page with the way back. The runner is keyed by the pass id, and a different running pass returns to the hub. A pass, its slip or a pick that vanishes falls back to the summons. | "keeps its place in range when the host hands down fewer questions" |
| Labels match actions | "Till Repetera" → `openRepetera`; "Nytt provpass" → `go('provpass')`; "Till Öva" → `go('ova')`; "Slå upp" → `openLesson`; "mål 2,0" → `openKonto`. | result and Framsteg tests |
| Failure states reset on a new source | The plate and inline figure are keyed by source; option images keep batch 1's source-bound failure. | as above |
| A viewer must not share the inline readiness | No readiness gate, so nothing to share; closing Förstora never blocks anything. | "sets a DTK question …" |
| Scroll regions keep their arrows | The pass's page, spread pages and phone scroll are `data-rd-keyscope` + `data-fo-region`. A focused region keeps ←/→; a focused control moves the question. Batch 1's reading drill pages now keep their arrows from the switcher too. | "lets a focused scroll region keep its arrows …", "keeps the arrows inside the reading drill's pages from the switcher" (real host) |

## Verification

| Check | Result |
|---|---|
| `pnpm typecheck` (from `app/`) | PASS |
| `pnpm lint` | PASS: 512 files; the same 4 informational notes in unrelated files that batch 1 recorded (LandingBakeoffR3/R4A/R4C, l12/M3) |
| `pnpm test` | PASS: **2,638 passed / 0 failed**, 109 files |
| `Folio.test.tsx` alone | 141/141: the shared contract for 11 screens × 2 widths (72) plus 69 Folio tests, 41 of them new in this batch; no act(...) warnings |
| `git status` | only the nine admitted files (see State for the files that are not mine) |

The 41 new tests cover:
- the hub, five;
- the running pass, seventeen;
- the real bake-off host, six (four of them one `it.each`);
- the result page, two;
- Framsteg, Historik and Fällor, nine;
- Idag's wiring, two.

The one batch-1 test that assumed Provpass was unbuilt now checks that Provpass and Framsteg turn at once and that Uppslag stays the host's card.

**Shared tests outside the write set.** None failed. `Redesign2026Bakeoff.test.tsx` also runs Folio's contract, which now has 11 screens, and its registry-derived tests pass.

**Visual self-check: not done.** The sandbox cannot render the dev route: `main.tsx` throws without `VITE_CLERK_PUBLISHABLE_KEY`, which this worktree lacks, and Clerk cannot load offline. This brief rules out an ad-hoc harness. Instead I reviewed the layout by hand against the measures (stage 1440 × 900, phone 390 px, the 288 px margin, the 640 px recto) and fixed what that turned up:
- on phone, batch 1's rule `.fo-phome .fo-plan-row:has(> .fo-entry-code)` would have restored the code column in the register;
- table sub-lines now wrap on phone, and the columns sit closer there.

**The coordinator still needs the 16-view screenshot pass per screen (9, 10, 11) with the real fonts.** It should include:
- the running pass at a single-page, a DTK and a reading question;
- the four slips;
- the Historik and Fällor sub-pages;
- 320 px reflow.

## Spec gaps (kit v2 does not carry them; rendered without; spec section)

**Provpass (screen 9)**
- *What it shows: the mode* (Riktigt pass · Genererat pass). The kit has no generated pass to start (`startProvpass(passId)` takes an authentic pass), so there is no Läge choice and no generated lead.
- *States: a pass already running* ("PÅGÅR · 32 MIN KVAR", Fortsätt provpasset), and Idag's lead showing it (§3, B2). The view model always carries a `running` view and says nothing about whether a pass is under way. Not built.
- *States: loading (sättning) and the error erratum* for the passes. The kit has no loading or error state. Not built.
- *States, running: "Välkommen tillbaka – klockan har gått vidare."* There is no "resumed" signal. In the bake-off a just-started pass opens at the fixture's 31:12, which looks like a resume.
- *Running: Styckefokus on a reading question.* Not offered in a pass: no extra scope. Its ¶ numbers still dim the others on a press.
- *Navigation: leaving mid-pass* ("Passet pågår – klockan går vidare …" with Stanna ↵). This needs a route-leave hook the host does not offer. The bake-off bar can still change the screen.
- *Kit: a pass's answers, flags and abandon never reach the host.* There is no action to record a choice or a flag, and none to void a pass. `submitProvpass()` takes no answers. Folio keeps them locally, seeded from `running.answers` and `running.flags`; Avbryt passet returns to the hub with the void note but tells the host nothing.
- *Kit: the bake-off has one running pass* (host-2025 kvant1). Starting any other pass shows the honest "Frågorna till passet är inte framme än." with "Välj ett annat pass". The real app's provider would hand down the started pass.

**Provpassresultat (screen 10)**
- *The review* ("Gå igenom missarna ↵", each miss in its graded drill layout with "Ditt svar"). The result has neither the reader's per-question picks nor the questions' explanations. Not built.
  - The filled button is "Till Repetera ↵" instead: the final wrong answers wait there, with their facit.
  - The misses list shows each miss's stem and right answer but not "ditt B", and the count sentence names the blanks without saying which they are.
  - Open question 17 is the owner's.
- *What it shows: when it ended* ("idag 14:32") and *how* (handed in or time out). There is no date and no ending in `ProvResultView`. The time out is inferred from a duration of 55 minutes or more.
- *The P5 caveat on a verbal pass.* The result does not say whether its texts were övningstexter, so it is not shown.
- *States: loading, just handed in, not found, untrustworthy section times.* No such state in the kit.
- *Misses for a pass whose questions the host no longer has.* Then the list falls back to what the qid says: section and number.

**Framsteg and Historik (screen 11)**
- *The week's sentence: "Gapet upp till målet bärs framför allt av X och Y."* The spec marks this sentence New (§3). It is derived here from the goal (`prognosis.target`, optional) and the first two Fokus sections. It is left out without a goal.
- *Fokus reasons.* The view model's `focus` has no reasons. "lägst just nu", "näst lägst just nu", "inte övad på 16 dagar" and "men på väg upp / och på väg ner" are derived from each section's score, rank, trend and days since.
- *The chart* is the view model's weekly series (pooled accuracy, `weekly`), not the projection. Its section is therefore headed "Poäng över tid" (the spec says "Prognos över tid") and captioned "Poäng per vecka …". The lead's figure is the prognosis, so the two can differ. The fixture's last week and the prognosis are both 1,4.
- *Historik: provpass among the weeks.* The result summaries carry a date label but no date, so they cannot be placed in the week ledger. They are a "Provpass" part of their own.
- *Historik: a drill row opening its end page.* There is no end page for a finished drill in the kit, so drill rows are plain. The standfirst is therefore not the live app's "Öppna ett pass för att se hela facit igen …"; it is a sentence that promises nothing it cannot do.
- *Historik: durations* ("52 min", "4 pass · 38 min"). `HistoryRowView` has no duration. The 120-day retention line is left out: the view model says nothing about it.
- *A section row's name opening that section in Uppslag.* There is no action for a section (`openLesson` takes a framework). Not linked.
- *States: loading, error, cached figures.* No such state in the kit.
- *Fällor: "· 5 min" on the lead.* No minutes. The count is the trap's due misses (`TrapView.count`), said as "3 gånger" as on Idag.
- *Ledger dates* use the reader's local calendar; the view model's days are UTC days (kit §7).

**Idag wiring (§3, B2)**
- *"Senaste passen" rows as links.* `home.recent` rows are drills with no end page and no result id. Still plain text.

**Shared plumbing (§3, §4)**
- *`parts.tsx`* is not admitted. The shared parts live in `FolioHome.tsx`, `FolioDrill.tsx` and, as copies, `FolioProvpass.tsx` (see above).
- *`RuledTable`* is a shared class and markup (`.fo-table`, `th scope`, `caption`) rather than a component: the three tables differ in their columns.

## Deliberate departures from the spec (for review)

- **The result's filled button is "Till Repetera"**, not "Gå igenom missarna"; see Spec gaps.
- **Lämna in is in the running head too**, not only in Översikt and on the last question. The kit's contract presses `rd-prov-submit` mid-pass. It is a ghost there; the filled button stays Nästa fråga.
- **The key line** shows on the question the reader came in on, not on question 1. In the bake-off a pass opens at question 17, where "the first question only" would never show it.
- **The index strip** is a 24 px row on desktop (a 3 px line drawn in it) and the 3 px foot line on phone. Its segments are below the brief's 44 px floor, as the spec's strip must be. The equivalent control, Översikt (44 px numerals), is the keyboard's way, and the strip is out of the tab order, as the spec asks.
- **The verbal composition and the rules** come from the view model; the rules are set as sentences, their em dash as a spaced en dash.

## Proposed copy

Every new Swedish string is proposed, not approved product copy. The approved copy is used verbatim from `data.copy` and the view model: the estimate caveat, the ÖVNINGSTEXT badge and note, and the rules.

- **Hub:**
  - masthead, title and lead: "Anmälan.", "Halva", "Kallelse · minst sett", "Valt pass", "Du har sett {n} av {m} frågor.", "Inskriven: {namn}", "Passet har {n} frågor – {en|n} saknas i källan.";
  - "Starta provpasset", "Villkoren först – klockan startar när du säger till.";
  - states: "Frågorna till passet är inte framme än.", "Välj ett annat pass", "Inga riktiga pass att välja i den här halvan just nu.";
  - register: "Register", "{n} provtillfällen", "sett {n}/{m}", "Visa alla {n} provtillfällen";
  - margin: "Villkoren", "Poängen", "Ett riktigt pass rättas mot provtillfällets normeringstabell.", "Senaste passen", "Inga pass ännu – det första blir din baslinje.", "Alla pass i Historik".
- **Conditions:** "Starta provpass", "Starta nu", "Inte nu", "{N} frågor saknas i källan, så passet rättas på {n}."
- **Running pass:**
  - heads: "Avbryt passet", "Provpass · {S}", "Fråga {n} av {m}", "Översikt", "{mm:ss} kvar", "Lämna in", "Dölj klockan", "Visa klockan";
  - the bar: "Nästa fråga", "Ditt val: {L} · sparat", "Inget svar än – du kan hoppa över frågan.", "Markera (för återkomst)";
  - keys: "väljer och sparar", "byter fråga", "nästa fråga";
  - announcements: "Fem minuter kvar", "En minut kvar", "Passet lämnas in. Dina svar är sparade.";
  - states: "Passets frågor gick inte att visa.", "Inget har räknats. Välj ett pass i anmälan igen.", "Till anmälan";
  - hub notes: "Provet avbröts – ogiltigt. Dina missar ligger i Repetera.", "Passet hann ta slut innan det lämnades in. Det räknas inte.", "Passets frågor gick inte att visa. Inget har räknats."
- **Slips:**
  - Översikt: "Översikt", "{n} av {m} besvarade", "Understruken: besvarad. Ring: här är du. Vikt hörn: markerad.", "Tillbaka till passet";
  - hand-in: "Lämna in provpasset?", "Alla {n} frågor är besvarade.", "{N} frågor är obesvarade – fel ger inga avdrag, så gissa hellre.", "Tiden är slut.", "Inlämningen gick inte fram. Dina svar är sparade.", "Försök igen";
  - abandon: "Avbryta provpasset?", "Avbryter du blir provet ogiltigt. Dina missar hamnar i Repetera.", "Fortsätt provpasset", "Avbryt passet".
- **Result:**
  - head and lead: "Provpass · Resultat", "Provpasset klart.", "{Halva}, {riktigt|genererat} pass.", "Du lämnade in efter {n} minuter.", "Tiden tog slut – passet lämnades in automatiskt efter {n} minuter.";
  - the figure: "normerat (härlett) · av 2,0", "skattad poäng · av 2,0", "{n} av {m} rätt", "En fråga saknas i det här passet, så det rättades på {n}.";
  - the action: "Till Repetera", "{N} missar väntar där, de äldsta först.", "Nytt provpass";
  - sections: "Per delprov", "i provets ordning", "Rätt · Tid · Budget", "över budget";
  - misses: "Missarna", "{N} missar ligger nu i Repetera; {n} lämnades obesvarade.", "Inga missar i det här passet.", "rätt {L}";
  - margin: "Tidigare pass", "{Halva} · riktiga pass", "Inga tidigare pass av samma sort ännu.", "Återkommande fälla", "Slå upp", "Exponering", "Du hade sett {n} av {m} frågor innan.";
  - the two footnotes.
- **Framsteg:**
  - head and lead: "Senaste 90 dagarna", the week's sentence, "Gapet upp till målet bärs framför allt av {X} och {Y}.", "Mest att vinna: {S} – {reason}.", the reasons, "Öva {S} · {n} frågor", "mål {g}";
  - the chart: "Poäng över tid", "Poäng per vecka, de senaste {n} veckorna.", "Prickat: veckor utan övning.", "Visa som tabell", "Dölj tabellen", "ingen övning", "Kurvan börjar när du har övat två veckor.";
  - sections: "Delproven", "underlag: 90 dagar", "Prognos · ± · Trend · Underlag", "upp/ner/oförändrad", "inget än", "{n} dagar sedan", "{n} försök";
  - next and history: "Sedan", "Historik", "Alla pass";
  - margin: "Fällor", "Alla fällor", "Repetitionen", "{n} att repetera nu", "Inget att repetera just nu.", "{n} i kön · {m} återlärda", "Övningsdagar", "{n} av {m} dagar", "ingen dag", "Visa alla {n} veckor", "Visa de senaste sex veckorna";
  - states: "Totalen visas när du har svarat på frågor i båda halvorna.", "Börja här · {n} frågor", "Börja med {halva}: {S} · {n} frågor".
- **Historik:** "Historik", "Tidigare pass.", "Dina avslutade övningar och repetitioner, vecka för vecka – och provpassen för sig.", "Vecka {v} · {d1}–{d2} {månad}", "{n} pass", "{S}-övning", "Blandad övning", "Provpass · {Halva}, {riktigt|genererat}", "Ett avbrutet provpass räknas inte.", "Inga avslutade pass än. Kör en övning så landar den här.", "Till Öva".
- **Fällor:** "Dina fällor.", "Mönster som har lurat dig mer än en gång – de som ökar först.", "{S} · ökar", "Öva fällan", "Register", "{n} gånger · ökar", "Öva", "Inga återkommande fällor än – de syns här när samma mönster lurar dig mer än en gång."
- **Om panel** (`meta.ts`): the new trait sentence about Provpass, the result, Framsteg and Historik.

## Handoff

- **Done:**
  - screens 9 (hub and running pass), 10 and 11 (with Historik and Fällor) at both widths and in both themes, declared in `meta.ts`;
  - the batch-2 Idag wiring;
  - the contract ids, and Folio's tests extended;
  - typecheck, lint and the full suite green;
  - this worklog.
- **Left for the coordinator:**
  - the 16-view screenshot pass for 9–11 with the real fonts (see Verification);
  - the `FolioQuant.tsx` export follow-up for the lifted parts;
  - review and commit.
- Kit and owner questions are listed under Spec gaps. Bead parked deferred after this note.

## Round 2 (review hpf-k2v8, HOLD)

- 2026-10-20 · Claude worker, session `ci-wisp-cptqe68`. Started from `3913bb0` (the merge of batch commit `cf99b76` with origin/main), clean.
- Read first: the review at `~/scratch/hpf-qr0p.10/review-hpf-k2v8.md`.
- Changes are **uncommitted**, in four admitted files plus this worklog: `FolioProvpass.tsx`, `Folio.tsx`, `folio.css` and `Folio.test.tsx`.
- **Red-first.** I wrote the new and replaced tests before any fix and ran them on the old code: 12 failed (each failure is listed below). All of them pass after the fix.

### Fix 1 · A hand-in never traps the reader

The old runner set `settling` before calling `submitProvpass()`. If the host stayed on screen 9, or the action threw, it was left locked, with no frame, no exit, and the keys still captured.

**The fix: the hand-in ends the pass.** It is tried once, in `FolioProvpass.tsx:810-824`:
- a normal return gives the outcome `submitted`, a throw gives `failed`;
- either way the runner hands a `PassEnd` up (`FolioProvpass.tsx:653`: the outcome, the pass as it ran and the answers as they stood).

**The frame.** It keeps the end as screen 9's third state, `ended` (`Folio.tsx:133`, `:247-250`).
- A host that opens the result (the bake-off's `show(10)`) moves on exactly as before.
- A host that stays on screen 9 — kit v2's NOOP fallback, or a real one — gets the pass's closing page, `FolioPassEnded` (`FolioProvpass.tsx:1892`; it is rendered at `Folio.tsx:285`), inside the frame.

**What the closing page holds:**
- The contents (desktop) or the tabs and the account button (phone) are back. "Provpass" in the contents also leaves the page for the hub (`Folio.tsx:218`).
- **Submitted:** ⁂ over "Passet är inlämnat.", then "Svaren nedan är de du lämnade in."
- **Failed:** the title "Inlämningen gick inte fram." and an erratum that stays: "Passet går inte att lämna in igen härifrån. Svaren nedan är dina, som de stod vid inlämningen."
- A lead names the pass ("Kvantitativ · riktigt pass", "Hösten 2025, provpass 1", "17 av 40 frågor besvarade"). It holds the screen's one filled button, **Till anmälan ↵**, which opens a fresh hub.
- "Dina svar": the answers by section, read-only (number and letter; the screen reader hears "Fråga 17, svar B" or "Fråga 22, obesvarad"). Nothing on the page can answer, strike or hand in.
- The title takes the focus on arrival, so the end is heard. It draws no ring (`folio.css:4736`); it is not a control.
- ↵ is Till anmälan's, but a key repeat is ignored (`FolioProvpass.tsx:1913-1927`): a ↵ held down on the slip's Lämna in can't skip the error. Esc does nothing here, so the error stays.

**Keys.** The runner unmounts, so its capture listener and its root `data-rd-keyscope` go with it. The closing page has no keyscope, and digits and ←/→ reach the switcher again.

**Why a page in the frame, not the runner kept in place.** The running layouts are full-stage: the spread and the phone sheet are height-100 % boxes with their own scroll regions. Moving the live runner under the frame's scrolling `main` would change the pass's layout while it runs, and I can't check that visually here. The runner's state is kept as a snapshot instead. So the error is shown on screen 9, where the pass was, as the page that ends it, never in a slip that Esc dismisses.

**Gone from the old code:**
- the settling line "Passet lämnas in. Dina svar är sparade." and its status;
- in the hand-in slip, "Tiden är slut.", the erratum "Inlämningen gick inte fram. Dina svar är sparade." and **Försök igen**;
- `.fo-pass-settling` in `folio.css`.

"Dina svar är sparade" is no longer claimed anywhere: Folio keeps the answers only locally, and the kit has no action that saves them.

**Tests** (they replace the ones that asserted the trapped states, old `Folio.test.tsx:867-905` and `976-1002`). The shared check `expectEnded` (`Folio.test.tsx:641`) asserts:
- no runner;
- the title;
- an enabled Till anmälan;
- `rd-nav-idag` enabled, with Provpass current;
- no `[data-rd-keyscope]` anywhere;
- '3', ← and → on the focused element not prevented.

| Test (`Folio.test.tsx`) | What it pins | Red before the fix |
|---|---|---|
| `:919` "hands the pass in once when the host's countdown reaches zero, then ends it for good" | host's zero → one call → closing page; the answers read-only ("Fråga 17, svar B", no option buttons); later ticks add no call; Till anmälan → hub | the runner was still mounted |
| `:947` "hands in once on its own clock too, even with the abandon slip open" | local deadline → one call, slip closed, closing page | same |
| `:968` "ends calmly on the kit's NOOP hand-in, the frame back at both widths" | no `submitProvpass` given (NOOP) → "Passet är inlämnat.", the account entry and the contents back; contents' Provpass → hub | same |
| `:1002` "asks before handing in … then one hand-in" (its tail updated) | after the confirm: closing page "40 av 40"; ↵ → hub, still one call | same |
| `:1085` "says a failed hand-in at time out plainly and for good, with the way out" | thrown at the host's zero → error page, no slip; after Esc and a repeated ↵ the page is still there; a fresh ↵ → hub; no void or expired note | the error slip was still open |

### Fix 2 · Never hand in again

The old `catch` cleared the latch and returned to `running`. The time-out effect, or `canAct()`, then called `submitProvpass()` again with no new confirmation.

**The fix.**
- One latch, `attempted` (`FolioProvpass.tsx:782`), is set before the call and never cleared.
- `submit` returns at once once it is set (`:811`).
- So do the time-out effect (`:829-831`, through `submit`), `canAct()` (`:857`) and the key handler (`:938`, which also hands every key back).
- Defence in depth: the runner is unmounted by then anyway (fix 1).

**Test** `:1037`, "ends the pass on a failed hand-in and never hands it in again, on either clock":
1. With fake timers: answer, hand in by hand with half an hour left; it throws. One call.
2. The provider supplies `remainingSeconds: 0`. Still one call.
3. The system clock moves 40 minutes past the deadline, the interval runs, and a letter is pressed. Still one call.
4. Then: the closing page with the persistent error, no Försök igen, "Fråga 17, svar A" read-only; Esc keeps the page; the contents lead on to Idag.

**Red before the fix:** "expected vi.fn() to be called 1 times, but got 2 times", at step 2.

### Fix 3 · The focused heading is the page, not a scroll region

The old handler treated every non-control inside `[data-fo-region]` as the region. It also prevented ←/→ before deciding. Since the runner focuses its question heading, which sits inside `.fo-qscroll`, a spread page or the phone scroll, ←/→ and space did nothing from the default focus. The region could not scroll with its own arrows either.

**The fix** (`FolioProvpass.tsx:939-949`):
- only `event.target` carrying `data-fo-region` itself keeps ←/→ and space;
- those arrows are no longer prevented, so the surface scrolls natively, and its own `data-rd-keyscope` keeps the switcher off;
- every other target (the heading, text, an option, a cell, the body) changes the question with the arrow prevented, as before;
- digits stay prevented everywhere.

**Tests.** They dispatch on `document.activeElement` through a new helper, `pressFocused` (`:69`), as the review's playbook note asks. `press` still dispatches on `window` for the older tests.

| Test | What it pins | Red before the fix |
|---|---|---|
| `:877` (desktop and phone) "moves from where the focus really is, the question's heading" | after opening, the focused heading sits inside a region; on it, → (prevented) goes to 18; then from the new heading ← → 17, space → 18, ↵ → 19; desktop also on a plate's recto page (29 → 30) | → did not move |
| `:1310` (real `Redesign2026Bakeoff`) "moves the question from the focused heading while the switcher stays put" | → / space / ← on `document.activeElement` change the question; → on `.fo-qscroll` itself keeps it; `onSelect` never called | → did not move |
| `:861` "lets a focused scroll region keep its arrows" (now stricter) | → and space on the region are *not* prevented, and the question stays | "expected false to be true" (the arrow was prevented) |

### Fix 4 · The calibration caveat when P5 provenance is known

The result showed only the basis footnote.

**Where provenance is read** (`FolioProvpass.tsx:2069`), only from the data the result has:
- the matching pass's own questions (`running.passId === result.passId`) with a passage marked `synthetic: true`;
- or a missed qid in the P5 namespace (`isP5Qid`, `lib/provenance.ts`'s `p5-` prefix).

**What it shows then:**
- the approved `data.copy.estimateCaveat` verbatim, as a second footnote `**` (`:2223-2228`). Both footnotes take `.fo-footnote--wide`, as on Framsteg;
- the figure carries both marks, `*,**` (`:2103`);
- the figure's spoken sentence ends ", med förbehåll i fotnoten", Framsteg's phrase.

**Unknown provenance claims nothing:** a non-matching pass with authentic misses gets no caveat and the single `*`.

**No per-section marks.** A mark on LÄS or ELF would claim one section's provenance when only one P5 miss may be known.

| Test | What it pins | Red before the fix |
|---|---|---|
| `:1462` "adds the calibration caveat when the pass's own questions carry P5 texts" | a verbal result on the P5 reading unit: `**` + the caveat, figure `*,**` and its sentence, the basis still `*` | "Unable to find an element with the text: Uppskattningen för LÄS och ELF …" |
| `:1491` "adds it for P5 misses too, and never claims P5 when the provenance is unknown" | not the running pass + a `p5-elf-…-ELF-001` miss → caveat; authentic misses only → no caveat, mark `*`, no "förbehåll" | same |
| `:1412` (added to the quant result test) | an authentic quant pass: no caveat | (passed; it guards the negative) |

### Fix 5 (P3) · Phone masthead and tabs

- **The masthead.** `.fo-phome .fo-count` is now a block (`folio.css:2439`). The meta drops under the label, two lines as on Idag, whose meta was already a `<p>`.
  - It fixes Framsteg ("FRAMSTEGSenaste 90 dagarna").
  - The same rule fixes Historik and Provpassresultat, whose metas were spans with the same run-on ("PROVPASS · RESULTATHösten 2025, provpass 1").
- **The tabs.** `.fo-tabs` gets 12 px side padding instead of 4 (`folio.css:2525`), so the outer words keep off the edges.
- **No jsdom test:** jsdom has no layout. These need the coordinator's screenshots.

### Verification

| Check | Result |
|---|---|
| `pnpm -C app typecheck` | PASS |
| `pnpm -C app lint` | PASS: 514 files, the same 4 pre-existing infos (LandingBakeoffR3/R4A/R4C, l12/M3) |
| `pnpm -C app test` | PASS: **2,696 / 2,696**, 109 files. The act() warnings in stderr come from unrelated files (useDailyPlan, DrillQuestion, konto, HomeMobile, PedagogyPanel); none from Folio |
| `Folio.test.tsx` alone | 147 / 147. Red-first run: 12 failed, all new or replaced tests |
| Shared tests outside the write set | none failed |
| `git status` | only the admitted files; the untracked root dotfiles are the sandbox's, as in round 1 |

**Visual check: not done**, for the same reason as round 1 (the dev route needs a Clerk key, and no ad-hoc harness is allowed). The coordinator should screenshot:
- the closing page, *submitted* and *failed*, at desktop and phone, light and dark. To reach it in the bake-off, use a provider whose `submitProvpass` stays on screen 9 or throws: the bake-off host always opens 10, so it never shows there;
- phone Framsteg, Historik and Provpassresultat mastheads;
- the phone tabs at 390 and 320 px.

### Proposed copy (new in round 2)

- From the brief: "Passet är inlämnat."
- New: "Svaren nedan är de du lämnade in.", "Passet går inte att lämna in igen härifrån. Svaren nedan är dina, som de stod vid inlämningen.", "{Halva} · {riktigt|genererat} pass", "{n} av {m} frågor besvarade", "Till anmälan", "Dina svar".
- Screen reader only: "Fråga {n}, svar {L}", "Fråga {n}, obesvarad".
- Reused: "Inlämningen gick inte fram." (round 1), "i provets ordning", ", med förbehåll i fotnoten" (Framsteg).

### Notes for the coordinator

- **Kit gap.** `submitProvpass` is `() => void`, with no status. A provider that returns a promise and rejects later would be read as handed in, so Folio would show "Passet är inlämnat.". Not handled: it is outside the kit's contract. Worth a kit-level status if the real provider is async.
- **Tests replaced.** The round-1 tests that asserted the retry ("keeps the answers and offers the hand-in again when it fails") and the trapped states are replaced, as the brief asks. Their old behaviour contradicts the coordinator's decision on fix 2.

### Handoff

- **Done:** fixes 1–5 in the write set, the red-first tests, all three checks green, and this section.
- **Left:** the coordinator's screenshots (above), the re-review and the commit.
- Bead parked deferred after the note.

# Worklog — hpf-qr0p.11

Redesign round 2, direction A · Folio, batch 3: screens 12 Uppslag & lektion, 13 Konto & inställningar and 14 ELF-läsfråga.

## State

- 2026-10-20 · Claude worker, session `ci-wisp-vxlhnm7`. Base `0b36bfe` (origin/main), branch `codex/hpf-qr0p.11-redesign-round-2-direction-a-folio-batch-3-uppslag-lektion-k`.
- Changes are **uncommitted**, in admitted files only: `Folio.test.tsx`, `Folio.tsx`, `FolioDrill.tsx`, `FolioHome.tsx`, `FolioKonto.tsx` (new), `FolioUppslag.tsx` (new), `folio.css`, `meta.ts` and this worklog.
- Untracked files that are not mine: the worktree root's dotfiles (`.bashrc`, `.idea`, `.mcp.json`, …). They are the sandbox's bind-mount placeholders (character devices owned by `nobody`) and were there when I claimed the bead.
- Read before building:
  - `docs/redesign/kit-v2.md`, the shared kit files and `contract.ts`;
  - the spec `docs/redesign/directions/a-folio.md` (§1, screens 12–14, §3–§5);
  - Folio's batch-1 and batch-2 worklogs;
  - the merged Spår and Samtal batch-3 worklogs and Konto code, for what their reviews found (stale Konto jumps, the delete preview, ELF gap classes).

## What was built, and why it is Folio

**12 · Uppslag & lektion** (`FolioUppslag.tsx`). Uppslag is literally an *uppslag*, a book's spread, inside the frame.
- **Desktop.** Opening Uppslag folds the contents to the thumb index (spec: "to make room for two pages"). ⌘B unfolds it for that visit; the reader's own fold on other pages is kept (`Folio.tsx:245`, `:449`).
- **The verso is the book's contents page** (reuses `Spread`, start 0.46):
  - running head "UPPSLAG · LÄS" with the ghost **Öva hela LÄS**;
  - the chapter opener: "KAPITEL 2", the section's name as the page's h1 (t32), the italic "Åtta frågetyper med angreppsprotokoll";
  - "Innehåll" (a `nav` "Innehåll: Svensk läsförståelse"): numbered entries with leader dots to their page number — "läst", the open entry's reading time ("1 min", from its own text), or "begärd". The **ribbon hangs at the open entry**, which is the bookmark and carries `aria-current="page"`. Never a raw id.
  - "Kapitlen": the book's eight chapters in their two parts (Verbal del, Kvantitativ del), each "2 av 8" and its kind, the current one marked by the 2 px accent rule, the weakest "svagast just nu". A chapter line turns the verso to that chapter's contents.
  - "Öva direkt": Blandad övning →, Repetera dina missar →.
- **The recto is the open entry as a reference page.** Its running head is "Frågetyp 3 av 8", with the read toggle "Markera som läst" / "✓ Läst Ångra" (`aria-pressed`). The article is set by kind (`Article`, `FolioUppslag.tsx:761`):
  - LÄS/ELF: "Angreppsprotokoll", numbered, the old-style numbers hanging in the margin; "Vanliga fällor", each pattern with its why;
  - a trap: the kicker as the title, "Så gör man ofta", "Varför det händer", "Igenkänningstecken", **Motåtgärd as the one ruled note** (a `section` labelled Motåtgärd), "Räkneexempel" as a four-step list (Förutsättning, Fällans tanke in italic, Korrekt tanke, Svar), "När fällan inte gäller", and the typical wrong answer as a footnote line;
  - DTK: the tactic, "Igenkänningstecken"; MEK: the rule type, "Mönsterregel";
  - a word root at t44, the spread's one largest item, its origin in Swedish ("germanskt") and "Exempel" as a run-in list with middots, no pills.
- **The foot**: one filled button that follows the spec's table — **Läst – nästa frågetyp ↵** (marks read, asks for the next unread entry after the open one, wrapping), **Läst – slutför kapitlet**, **Nästa frågetyp**, **Till kapitlets slut** — and the quiet practice link named for its kind ("Öva denna frågetyp →", "Öva detta mönster →", "Öva ord med denna rot →"). "Exempelfrågor" says where the questions come from: "Tio frågor ur riktiga prov, från hösten 2013 till våren 2025."
- **The chapter's end** opens only when the data says every entry is read: ⁂, "Kapitlet är läst.", "8 FRÅGETYPER · LÄST 9 OKTOBER", the filled **Öva hela LÄS ↵** (the head's ghost hides meanwhile). Later visits close the contents with "⁂ Kapitlet är läst.".
- **Another entry is the host's to open.** A contents entry, J/K, the filled button, Idag's lesson row and a facit's "Slå upp" all ask with `actions.openLesson`. While the host has not delivered, the open text stays, the asked entry reads "begärd", and the recto says exactly: "Lektion begärd. Den öppna texten ligger kvar tills den nya har laddats." (`FolioUppslag.tsx:96`). When the provider hands down the new lesson, the notice goes and the ribbon and the spread follow.
- **Phone**: one page. The entry comes first, where the ribbon left the reader ("Frågetyp 3 av 8 · Markera som läst", the article, "Öva denna frågetyp →" over the full-width filled button). The contents and the chapters follow it as the book's back matter; "Innehåll ↓" in the masthead jumps there.

**13 · Konto & inställningar** (`FolioKonto.tsx`). The account set as a book's imprint page, in the page grammar.
- Masthead "KONTO" alone; "Ditt konto."; the standfirst "Ett val gäller så fort du gör det." (no sync claim, see Proposed copy).
- Six sections, each a serif head under a hairline over definition rows:
  - **Du**: Namn, E-post (and Plan when the view model has one), with leader dots (`rd-konto-identity`);
  - **Provet**: Provdatum "Höstprov 26" (read-only, see Spec gaps);
  - **Övningen**: Frågeurval "Smart · Slumpat" and Coach "Kompis · Professor · Taktiker" as word choices, the chosen word underlined in the accent, each voice's description visible and read with it (`aria-describedby`);
  - **Utseende**: Tema "Ljust · Mörkt";
  - **Din data**: "Exportera min data →";
  - **Hjälp**: the supplied links.
- Then **Logga ut** (quiet) and **Radera kontot →** behind the double rule, as on the account slip.
- **There is no filled button on the page** (spec §1.5): each choice applies at once. The theme is `actions.setTheme`; every other choice sends its own `setPrefs` patch. A save that throws says "Det gick inte att spara – försök igen." beside its row; the value never moved.
- The margin holds "På den här sidan" (anchors to the six sections; on phone a wrapping line under the standfirst) and **Kortkommandon**, the app's one list of shortcuts, by where they work.
- **The deletion slip** is a native `showModal` dialog with the slip's look, placed on Folio's own stage. It has today's warning, "Exportera min data först →", "Skriv ”radera” för att bekräfta." and its field (`rd-konto-delete-word`). The grave act, **Radera kontot permanent** (`.fo-btn--grave`, filled ink, not red), is enabled only by the word (case and surrounding spaces ignored); its disabled reason is its description. ↵ never presses it. It is sent once.
  - The slip is labelled "Förhandsvisning". A request that is sent is said as sent ("Begäran om radering är skickad. I förhandsvisningen raderas ingenting."), never as a deletion under way. A refusal says "Kunde inte radera kontot. Inget raderades – försök igen." and frees the act again.
  - Avbryt and Esc (the dialog's cancel) close it with `dialog.close()` before the state change that unmounts it, then give focus back to Radera kontot. A backdrop press closes it when the point is outside the slip's box.
- **Arrival keeps focus and scroll where they are.** Only an account-slip row moves the page: **Konto** → the title, **Inställningar** → Övningen, **Hjälp** → Kortkommandon (each scrolls its own box and focuses its head). A jump belongs to its visit: it is cleared when the host leaves 13. No destination is `aria-current` on Konto. Esc goes back to the page before Konto.

**14 · ELF-läsfråga** (`FolioDrill.tsx`). Screen 2's spread, unchanged in structure, on `data.drills.elf`, with the language marked:
- `lang="en"` on the passage article (title, paragraphs, byline), the prompt, each option's text, the facit's bodies (Därför lockade, Varför … är fel, Fallgropen, Tekniken, Lösningen, the step titles and texts, the other options and their reasons) and the colophon's title;
- the chrome stays Swedish: the running heads (ELF · ÖVNINGSTEXT), the verdict, the facit's heads, the keys line, the buttons and the echo. Inside the English article, the tools row, the note and the ¶ numbers carry `lang="sv"`; the options' spoken "Alternativ A:" and the strike buttons do too;
- English typography: `:lang(en)` hyphenation limits (6 3 3);
- no ¶ links and no underlined quotations in the ELF facit, rather than wrong ones (spec 14, "English citation rules in the kit"); "(steps 2 and 3)" still jump to the steps;
- a–d choose, ↵ answers and moves on, Esc never leaves; Avsluta asks the controller only (no switcher move);
- **focus follows the reader's own moves only**: to the verdict on Svara, the next prompt on Nästa, the colophon's title at the end; never on a mount or a switcher jump (also on 2 and 3).
- **Gap texts**:
  - each `___(n)___` is a `GapMark`: a ruled blank with its number; the open one in the accent; the chosen word pencilled in (italic accent ink, the number lifted); once answered, the right word in ink with the evidence underline, a wrong pick struck through with the dotted `--fo-bad` underline before it. Its spoken name is Swedish: "lucka 1, tom", "lucka 1: charge", "lucka 2: ditt ord cover, rätt ord settle".
  - The recto says "Lucka 1" (Swedish chrome) and quotes the gap's sentence, cut to its clause when long ("“… though nobody quite takes ___ for the descaling.”"), with the chosen word pencilled in too. On phone the slip's peek holds both.
  - The verso scrolls the open gap into view (instant under reduced motion).
- The colophon: the title in English, the facts in Swedish ("1 fråga · 1 rätt · 1 min"), the plan's next part filled, "Till Idag" as the quiet way back.

## Changes beyond the three screens (each in the write set)

- **The drill pages are no keyscope any more** (`FolioDrill.tsx:1083`, `:1111`, `:2336`). The spread's verso and recto and the phone drill's scroll only scroll vertically, so they no longer carry `data-rd-keyscope` (direction notes). The bake-off's digits and ←/→ now get through from the passage, an option, the verdict and the facit's controls on 2, 3, 6, 7 and 14. `data-fo-region` stays, for the running pass, whose own root (`rd-prov-running`) keeps its scope, so the pass is unchanged. Batch 2's test "keeps the arrows inside the reading drill's pages from the switcher" asserted the old behaviour; it is replaced by the real-host tests below.
- **The reading colophon's "Till …" goes to the page it names** (`actions.go`, or `openKonto`), not through the drill's exit (`FolioDrill.tsx:2056`; `Origin.to`; `Folio.tsx` ORIGINS). Avsluta still asks the controller.
- **The facit's framework line is a link**: "Ramverk: Författarens hållning · Slå upp →" (`FolioDrill.tsx:1675`). It asks `actions.openLesson`, and Folio's root remembers the ask (`LessonAskContext`) so Uppslag can name it. It applies to every Folio facit (2, 3, 6, 7, 14).
- **The account slip** (`Folio.tsx:612`): Konto, Inställningar and Hjälp open Konto at their own places (spec §3, B3). Tema is "Ljust · Mörkt": the old third word, System, applied the device's setting once and was neither saved nor followed. Production saves only light or dark (spec 13, "Tema · System is New").
- **Idag**: a finished part of the plan is a plain row, never offered as work; with only the paused text left the day sentence says "Idag: läs klart texten – resten av dagens plan är klar." (`FolioHome.tsx`).
- `PassageView` sets an ELF passage's paragraphs as `rd-elf-passage` (Swedish ones keep `rd-passage`) and a gap text's blanks as GapMarks, also in a running pass. Options and the facit mark English content, also in the pass's ELF questions.
- The reading colophon says "1 fråga", not "1 frågor".
- `meta.ts`: screens 1–14; `omits: { konto: ['palette', 'font', 'density'] }` with its spec reference (see Departures); one trait line for batch 3.
- `folio.css`: the Uppslag, Konto, deletion slip, `.fo-btn--grave`, `.fo-key`, ELF and gap blocks (`folio.css:5147`, `:5591`, `:5832`, `:5904`, `:5919`). They use the existing tokens only; **no new token** (`.fo-btn--grave` is a class variant, as the spec's §4 says).

## Known pitfalls and the coordinator's notes, each handled and tested

| Pitfall / note | What Folio does | Test (`Folio.test.tsx`) |
|---|---|---|
| Keyscopes only on dialogs, menus and pan areas; keys fired on the focused element | No page, column or scroll of 2/3/6/7/12/13/14 is a keyscope; only Folio's dialogs (and the running pass's root) are. | Real host: "lets the switcher's keys through from every part of reading drill {2, 14} on {desktop, phone}" (entry focus, passage, paragraph, option, verdict after Svara, Nästa, a facit disclosure), "… from the Facit screen …", "… from every part of Uppslag …", "… on Konto …, and keeps them in its slip" |
| Never move focus into a keyscope on mount or a switcher preview | Focus moves only after Svara/Nästa/the end, on an account-slip row, or into the deletion slip the reader opened. | "… from the Facit screen on %s, focus where it was"; Konto "sets the imprint page …" (activeElement is body on arrival) |
| Native dialogs; `close()` before unmount; backdrop by coordinates | `DeleteSlip` (`FolioKonto.tsx:454`). | "asks for the typed word on a slip …", Konto host test |
| Konto omissions declared with the spec section | `meta.ts` `omits`; the contract checks they are absent. | shared contract (13) |
| Typed word with `rd-konto-delete-word`; preview labelled; no pending-deletion claim | As above. | contract (13); "asks for the typed word …"; "says a refused deletion …" |
| Light/dark through the host; each preference its own patch; no unconfirmed save or sync | `setTheme`; `setPrefs({ coach })`, `setPrefs({ smartDrill })`; the standfirst does not claim sync; export is "begärd". | contract (13); "sends each choice as its own patch …"; "says an export as asked for, never as done" |
| Konto entry keeps focus and scroll; distinct rows to distinct places; no nav item current | `jump` only from a row, cleared on leaving 13. | "opens at the place each account-slip row names …", "sets the imprint page …" |
| Uppslag: honest notice when openLesson only changes the screen; never fake content | The open text stays; "Lektion begärd. …"; the asked entry "begärd". | "asks the host for another entry …", "names a lesson asked for from Idag's plan …", "looks up the facit's pattern …" |
| Read/practice labels match their actions; no practice without examples | The read toggle and the filled button call `toggleLessonRead(open.id)`; practice calls the framework drill and is absent with no examples (see Departures). | contract (12); "marks read and asks …", "reads the toggle …", "offers practice only when …" |
| ELF: only English content is `lang="en"` | As described. | "marks only the English content lang="en" …" |
| Home: say the plan is done | Both cases (with or without a paused text); finished rows are plain. | "offers a finished part of the plan as a plain row …" |
| Labels match actions ("Till Öva" goes to Öva) | The reading colophon's way back is `actions.go(origin)`. | "answers on a–d and ↵ …" ("Till Idag" → `go('idag')`), "leaves mid-text through Avsluta …" ("Till Uppslag") |
| Lists that shrink; a new sitting id resets | The reading drills are keyed by sitting id and by a shrink epoch: a sitting cut short opens at its start. Uppslag looks entries up by id; with no catalog it says "Inget innehåll här ännu." | "opens a sitting the host cuts short at its start …", "says plainly that there is nothing here yet …" |
| Esc does not leave a drill | Esc clears Styckefokus only. | "answers on a–d and ↵ …" |

## Verification

| Check | Result |
|---|---|
| `pnpm -C app typecheck` | PASS |
| `pnpm -C app lint` | PASS: 532 files; the same 4 informational notes in unrelated files that batches 1 and 2 recorded (LandingBakeoffR3/R4A/R4C, l12/M3) |
| `pnpm -C app test` | PASS: **3,655 passed / 0 failed**, 109 files |
| `Folio.test.tsx` alone | 202/202: the shared contract for 14 screens × 2 widths (90) plus 112 Folio tests, 38 of them new in this batch (one batch-2 test replaced) |
| `git status` | only the admitted files (see State for the placeholders that are not mine) |

The 38 new tests:
- Uppslag, 13 (one `it.each` of two);
- Konto, 7 (one `it.each` of two);
- ELF, 7 (one `it.each` of two);
- the real bake-off host, 10 (four `it.each`);
- Idag's plan wiring, 1.

**Updated test**: "asks the host for a destination and turns to the pages it has built". Uppslag is now built, so it turns to Uppslag's chapter (h1 "Svensk läsförståelse") instead of staying on Framsteg.

**Shared tests outside the write set.** None failed. `Redesign2026Bakeoff.test.tsx` also runs Folio's contract, now with 14 screens, and its registry-derived "Inte byggd än" tests find other directions with unbuilt screens. `DirectionShell.test.tsx` passes unchanged.

**Visual self-check: not done.** Starting the dev server (`vite --host 127.0.0.1`) is outside this worker's command allowlist and was refused. Batch 2 also found that the route needs a Clerk key this worktree lacks. **The coordinator still needs the 16-view screenshot pass for 12, 13 and 14**, with the real fonts, and should include:
- 12: the spread at 1440 with the thumb index; a trap and a word-root entry (supply them); the notice after picking another entry; the chapter's colophon; another chapter on the verso; phone with the back matter; 320 px reflow;
- 13: both widths; the deletion slip open on desktop (centred on the stage) and phone (at the stage's foot, not the window's); the slip's backdrop; dark mode's grave button. The slip is a top-layer dialog placed from the stage's box, divided by the frame's measured CSS `zoom` (the bake-off zooms its phone). Whether the engine applies the ancestors' zoom to a top-layer dialog is the one thing I could not verify; check the phone slip on a short window;
- 14: the short text; a gap text (only test data has one); the phone slip's peek and full facit;
- 2 and 3: a regression look, since the shared drill changed (focus ring on the verdict after Svara).

## Spec gaps (kit v2 does not carry them; rendered without; spec section)

**Uppslag (screen 12)**
- *Layout — desktop, hub* ("Läs först.", the bookmark lead, the register "Delproven", the margin). The kit has one open lesson and the contract mounts screen 12 once with the catalog and that lesson together, so the hub's register is the verso's "Kapitlen" and the lead is the recto itself. See Departures.
- *What it shows: a bookmark per section, "senast igår 21:14", "ca 12 min kvar".* There is no bookmark, time or per-entry reading time in `UppslagView`. Only the open entry's minutes are known, from its own text.
- *Exempelfrågor: each stem's first line, its source and "Öva →".* The kit has neither the stems nor a single-question drill request. Folio says where the questions come from in one sentence; the entry's practice link plays them.
- *Practice only when the drill can play them* (`pickFrameworkQuestions`). Not in the kit: Folio uses `open.practice.questions > 0`.
- *"Öva de fyra svagaste fällorna"* in a trap chapter's head. `UppslagView` has no per-chapter misses. Not shown.
- *States: loading (sättning) and the erratum "Uppslaget gick inte att ladda."* No loading or error signal in the kit. An empty catalog says "Inget innehåll här ännu.".
- *Brand-new reader* (the plan's next lesson as the lead, "BÖRJA HÄR · ORD"). The kit always has an open lesson.
- *Keys: Esc from an entry to the chapter, to the hub, to Idag.* With one spread state there is no chain; Esc does nothing on Uppslag. J/K are built.
- *Deep links (#ID)*: an `openLesson` request; what opens is the host's.

**Konto (screen 13)**
- *Tema · System* (open question 19): production saves light or dark only. Not built, here or on the slip.
- *Provet: Provdatum and Mål with "Ändra →" slips* (New). The kit has no setters and no goal in `KontoView`; Provdatum is shown read-only, Mål is left out.
- *Du: Inloggning ("via Google")* and *the app version*: no source. *Plan* only when `identity.plan` is present.
- *Din data: import and resetting the diagnostic.* No kit actions; not shown.
- *Loading: the identity as sättning, never the sample.* No loading flag; the view model's identity is shown.
- *Export: "Exporterar …" while it runs.* `exportData()` returns nothing: "Exporten är begärd." after a press; a throw says the real failure copy.
- *Delete: "Raderar …" and the FarewellPage.* The kit confirms nothing and the bake-off deletes nothing; the preview says the request was sent.

**ELF (screen 14)**
- *Kit English citation mode* (English ordinals, “…” and ‘…’ quotes, years). Not in kit v2, a shared-kit change: the ELF facit shows no ¶ links and no underlined quotations.
- *The long ELF unit* (elf-b18-001 "Under the Flags") and *a gap unit* are not in the kit's fixtures. The screen runs on the short elf-b19-003. Gaps are built and tested with test-only data (`gapData()` in the test file), never shown in the bake-off.
- *States: explanation loading or failed; a retired unit.* No kit signal. A missing explanation says "Förklaring saknas ännu för den här frågan.".
- *Phone: the passage scrolling by the slip's height when it opens.* Built for gap texts (the open gap is kept above the slip); not for plain texts.

## Departures from the spec (deliberate; for review)

1. **One spread instead of a hub page plus a lesson page (screen 12).** The contract mounts 12 and needs every section, the open lesson's chapter entries and the lesson at once, at both widths. The kit has one open lesson. So the hub's register became the verso's "Kapitlen", the lead became the recto, and the phone page is the entry first with the contents and chapters as back matter (a Swedish book's contents often stand at its end). "Läs först." remains only on the empty page.
2. **The chapter opener has no meta line** ("25 fällor · ca 18 min · 7 lästa"). The register below says how far along each chapter is, and each fact is said once per screen (§1.3). The opener's subtitle carries the count and the kind.
3. **Practice without examples is absent, not disabled.** The direction notes ask to disable it. The spec is more specific (12, "Practice only when there are questions to play": "no practice link … no greyed-out link"), and the brief says to follow the spec where it is more specific. The entry's practice is never offered; the section's practice stays one quiet link away (the verso's head; on phone, in the link's place).
4. **Konto omits palette, font and density** (`meta.ts`). The spec's 13 has no such rows: the palette is not carried into Folio (open question 7), and users cannot set font or density today (open question 8).
5. **Inställningar opens Övningen, not Provet** (spec 13, Navigation). Provet holds nothing to set in this build, so the row and its hint ("Frågeurval, coach och tema") go to the first section with settings.
6. **The standfirst does not say "… och följer med till dina andra enheter."** The kit confirms no sync (direction notes).

## Proposed copy (new UI text, for the owner)

- Uppslag: "Kapitel 2"; the chapter glosses ("med angreppsprotokoll", "för luckorna i en mening", "för figursidor", "i problemlösning", "i jämförelser", "i datasufficiens", "och deras betydelser"); "begärd"; "Kapitlen"; "Öva direkt" (the spec's); "Tio frågor ur riktiga prov, från hösten 2013 till våren 2025."; "Det typiska felsvaret:"; "Varje sida i kapitlet är läst. Öva nu på det, eller slå upp ett annat kapitel."; "Tillbaka till sidan"; "Innehåll ↓"; the origin words "germanskt", "latinskt", "grekiskt".
- Konto: "Ett val gäller så fort du gör det."; "Appen räknar mot nästa provtillfälle."; "Smart · Slumpat"; "En fil med allt du har gjort i appen."; "Exporten är begärd."; "Kortkommandona står i marginalen." (phone: "… längst ned på sidan."); the shortcut list's wording; "Förhandsvisning"; "Begäran om radering är skickad. I förhandsvisningen raderas ingenting."; "I förhandsvisningen raderas ingenting."
- Account slip hints: "Namn och e-post", "Frågeurval, coach och tema", "Kortkommandon och länkar".
- Idag: "Idag: läs klart texten – resten av dagens plan är klar."
- ELF: "Lucka 1"; the gaps' spoken names ("lucka 1, tom", "lucka 1: …", "lucka 2: ditt ord …, rätt ord …").
- Verbatim from the spec, today's app or the direction notes: "Lektion begärd. Den öppna texten ligger kvar tills den nya har laddats.", the deletion warning, "Skriv ”radera” för att bekräfta.", "Skriv ”radera” för att aktivera knappen.", "Kunde inte radera kontot. Inget raderades – försök igen.", "Kunde inte exportera just nu. Försök igen om en stund.", "Det gick inte att spara – försök igen.", "Inget innehåll här ännu."

## Follow-ups outside this write set (for the coordinator)

- `FolioQuant.tsx`: its colophon's "Till …" still calls the drill's exit. Give it `Origin.to` the way the reading colophon now has it (direction notes, "labels match actions").
- `FolioProvpass.tsx` puts `lang="en"` on a whole ELF question in a pass, Swedish labels included. The shared `Options` now marks its own labels `lang="sv"`, which corrects most of it. Its `PassHeading` and bar are still inside the English container.
- Kit: the English citation mode, and a long ELF unit plus a gap unit in `r2Fixtures` (spec 14 "The fixture").
- Batch 2's note on lifting `FolioQuant` parts still stands.

## Round 2 (review hpf-ku8j: HOLD, two P2)

- 2026-10-20 · Claude worker, session `ci-wisp-fcbymoj`. Started from the worktree at `75aa0e1` (merge head of `de5f435`), clean; read `review-hpf-ku8j.md` first.
- Changes are **uncommitted**, in admitted files only: `Folio.tsx`, `FolioDrill.tsx`, `folio.css`, `Folio.test.tsx` and this worklog. `FolioFramsteg.tsx` and `FolioProvpass.tsx` are untouched.

### Fix 1 — Svara answers only a complete current question (`FolioDrill.tsx`)

- **One predicate.** `answerable(question, selected, pictures)` (`FolioDrill.tsx:610`): the chosen option is one of the current question's own, and `lackOf(question, pictures)` (`:582`) finds nothing missing:
  - a passage with at least one paragraph with words;
  - a prompt. `null` is no prompt. An explicitly empty stem (`''`) is valid in a gap text, where the gap is the question (the bank's authentic ELF gap items 31–35 have `prompt: ""` and `31_____` gaps; P5 gap items have `''` or `Gap (n)`). The gap's number is not required to resolve, because `gapNumbers` numbers by order across a sitting;
  - at least one option, each with its words (an image option's label is required text in the bank);
  - every option picture loaded on each of its mounted instances. A picture that is not on the page (the phone slip at its peek) has not loaded, and a failed one is a lack too.
- **Both sites read it.** `ReadingDrill` evaluates it once per render (`:748`). The lock handler refuses unless it holds (`:785`). `ActionBar`'s `disabled` is `!gate.ready` (`:1359`), passed by both layouts (`:1082`, `:2597`). So every way of pressing Svara goes through it:
  - a click (a disabled button, and the handler);
  - ↵ (the drill's keymap calls the handler; ↵ on the focused button is a native click);
  - space on the button (a native click).

  `ActionBar` without a `gate` (FolioQuant) behaves as before.
- **A choice the host takes away is no choice** (`:801-805`). Nothing shows as chosen, the gap pencils nothing, the echo says "Välj ett alternativ" and Svara is held. The core keeps its own state (`drillCore.ts` is outside the write set); a new pick among the options left answers as before.
- **Pictures per mounted instance.** `OptionContent` (`:1582`) reports each mounted picture's state (loading, loaded or failed, keyed by source and try) to its reading drill through `PictureGate` (`:562`). It does so in a layout effect, so Svara is held before paint. Outside a reading drill (quant, DTK, the pass) nobody listens and nothing changes.
- **The honest missing-content state** (`LackNote`, `:645`). The spec's erratum (§1.7: a 1 px rule, `role="status"`, test id `rd-incomplete`) stands above the prompt on the recto (`:1080`) and at the top of the phone slip in each of its states while the question is open (`:2564`). It says one of:
  - "Texten till frågan saknas."
  - "Frågetexten saknas."
  - "Svarsalternativen saknas."
  - "Alternativ C saknar sin text."
  - "Bilden till alternativ D gick inte att visa." with "Försök igen", which tries every picture on the page afresh.

  Svara's echo says why it is held (`holdOf`, `:618`): "Frågan går inte att besvara än.", or "Bilderna laddas …" while pictures load. `folio.css:3491` spaces the note.
- `LessonAskContext` is removed, since fix 2 supersedes it; the facit's Slå upp only calls `actions.openLesson` (`:1852`).
- `ReadingDrill` is shared, so screens 2 and 3 (LÄS) get the gate too. The switcher's Facit (`gradeAs` on screen 3) is a display state and is not gated.

### Fix 2 — every lesson request is recorded (`Folio.tsx`)

- `Folio` wraps its subtree in a nested `DirectionDataProvider` (`Folio.tsx:195`) with the same data and the host's actions. The one change is `openLesson`, which records the id and then calls the host's own (`:175-185`). Every descendant asks through it, with no change to the batch-2 files: the facit, Framsteg's Fällor, the result's recurring trap, and Uppslag's contents, J/K and filled button.
- A plan row's lesson goes as `openPlanItem`; the frame still records it (`:324`).
- A request made on Uppslag itself is Uppslag's own. Leaving Uppslag forgets it (the effect's cleanup, `:262-268`), so a later visit opens plainly, as "asked once" did before.

### Red-first tests (`Folio.test.tsx`)

Each fix test was run on the unfixed source and failed for the reason it guards. For that run, HEAD's `Folio.tsx` and `FolioDrill.tsx` were restored for the run only, from verified scratch backups, then put back byte-identical (`cmp`). Every test passes with the fixes.

| Test | Line | On the unfixed code |
|---|---|---|
| (a) "on desktop/phone holds Svara while the passage/prompt is missing, the options intact" (4) | 2670 | the controller's lock received A |
| (b) "on desktop/phone never sends a choice the host has taken away (click/Enter/Space on Svara)" (6) | 2717 | the lock received the removed D, on every path |
| (c) "on desktop/phone holds Svara until every option picture on the page has loaded" (2) | 2749 | the lock received A while the pictures loaded |
| (c) "on phone waits for pictures the slip has not shown: ↵ at its peek answers nothing" | 2781 | the lock received A |
| Real `Redesign2026Bakeoff`: "names the lesson Fällor looks up on Uppslag, the open one kept" (desktop, phone) | 1556 | no "Lektion begärd" on 12 |
| Bake-off provider: "names the lesson a result's recurring trap looks up on Uppslag" (desktop, phone) | 1567 | no "Lektion begärd" on 12 |

Both Uppslag tests also check the requested entry ("begärd" in its chapter's contents) and the provider's old lesson still open (`expectAsked`, `:1339`).

Two guards were green before and after:
- "keeps a gap text's empty stem answerable" (`:2697`);
- "forgets an entry asked for on Uppslag itself once the reader leaves it" (`:2290`).

Notes:
- **Screen 10 cannot run in the real host.** The bake-off's fixtures never give a result a recurring trap (`directionData.tsx`, `provResultView`: `trap: null`), so the real `Redesign2026Bakeoff` never shows that link. That test mounts Folio in the bake-off's own provider value instead (`useBakeoffDirectionData`, whose `openLesson` only shows 12), with a trap supplied (`mountBakeoffWith`, `:1313`). The Fällor path runs in the real `Redesign2026Bakeoff`.
- **How (b) presses Svara.** Space uses user-event (native button activation). ↵ is pressed both on the focused Svara (native) and on the window (the drill's keymap).

### Verification (round 2)

| Check | Result |
|---|---|
| `pnpm -C app typecheck` | PASS |
| `pnpm -C app lint` | PASS: the same 4 informational notes in unrelated files |
| `pnpm -C app test` | PASS: **3,820 / 3,820**, 109 files (3,801 at the merge head plus 19 new) |
| `git status` | only the admitted files, plus the sandbox's placeholders (see State) |

- Three existing host tests log React `act(...)` warnings from `DeskDrill`. They are "lets the switcher's keys through from every part of reading drill 2/14 on desktop" and "… from the Facit screen on desktop". The same warnings appear on the unfixed code (checked), and they are not failures.
- Shared tests outside the write set: none failed.
- **Visual check: not done** (the dev server is outside this worker's allowlist). Coordinator screenshots wanted, in both themes:
  - the note on the recto and in the phone slip, with a passage missing and with a failed picture and its Försök igen;
  - Svara held, with its echo.

### Follow-ups (outside this write set)

- `drillCore.ts`: a choice the host takes away stays in the core's state, and only Folio's view hides it. A core-level reconciliation would serve every direction.
- `FolioQuant.tsx`: the DTK image options have no picture gate. `PictureGate` could be adopted there.
- `gapNumbers` (pre-existing, display only): it numbers empty-stem gap questions by order across the whole sitting, so a sitting with two gap texts would show "Lucka 6" for the second text's first gap. The gate does not depend on it.

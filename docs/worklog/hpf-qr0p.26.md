---
bead: "hpf-qr0p.26"
project: "hpfetcher"
session: "ci-wisp-pfuz5mg"
status: "implemented_uncommitted"
---

# Worklog — hpf-qr0p.26 · Direction F · Samtal, round 2 batch 3

Redesign round 2, epic hpf-qr0p, batch 3 for F · Samtal: screens 12 Uppslag & lektion, 13 Konto & inställningar and 14 ELF-läsfråga. Built on kit v2 (hpf-qr0p.7) from the direction's merged B0 spec (`docs/redesign/directions/f-samtal.md` §12–§14), on top of batches 1 and 2 (PR 424, PR 433).

## Snapshot and boundaries

- **Claim.** `gc hook --claim --json` returned `hpf-qr0p.26`, assignee `ci-wisp-pfuz5mg`, route `hpfetcher/gc.implementation-worker`. `bd show hpf-qr0p.26 --json` matched the id, the status (`in_progress`), the assignee and `gc.routed_to`.
- **Checkout.** Branch `codex/hpf-qr0p.26-redesign-round-2-direction-f-samtal-batch-3-uppslag-lektion-` at `d3f7bdb` (= `gc.worktree_base_sha`: kit v2, the B0 spec, Samtal batches 1–2 and the sibling batch-3 merges), clean at the start; HEAD unchanged.
- **Write set kept.** Nine files modified and two new, all admitted, plus this worklog:
  - new: `f-samtal/SamtalUppslag.tsx`, `f-samtal/SamtalKonto.tsx`;
  - modified: `Samtal.tsx`, `SamtalNav.tsx`, `SamtalDrill.tsx`, `SamtalFeedback.tsx`, `SamtalParts.tsx`, `SamtalHome.tsx`, `meta.ts`, `samtal.css`, `Samtal.test.tsx`.
  - No shared kit file, shared test or spec was edited. `SamtalFramsteg.tsx`, `SamtalProvpass.tsx`, `SamtalQuant.tsx`, `SamtalOva.tsx` and `SamtalRepetera.tsx` are outside the write set and unchanged. Nothing on `:root`.
- **Untracked, not mine.** The root dotfiles (`.bash_profile` … `.zshrc`, `.idea`, `.vscode`, `.mcp.json`, `.gitmodules`, `.ripgreprc`): the sandbox's mount placeholders. Left alone.
- **Delivery rules.** Uncommitted, no dependency changes, offline. Aegis ignored (frozen). The bead is parked, not closed.
- **Check script.** `gc.check_path` names `…/checks/build-artifact-valid.sh`; the bead names no validator, so none was run.

## Deliverables (uncommitted)

| Path (under `app/src/components/devbake/redesign/f-samtal/`) | What |
|---|---|
| `SamtalUppslag.tsx` (new) | Screen 12: `SamtalUppslag` (`:152`) — the coach's line, `LessonDocument` (`:326`) with `LessonBody` per family (`:415`), the replies, `SectionDoors` (`:547`) and `Catalog` (`:627`). |
| `SamtalKonto.tsx` (new) | Screen 13: `SamtalKonto` (`:76`) — the coach's line and the way back, `Identity` (`:186`), `Preferences` + `PrefGroup` (`:237`, `:332`), `YourData` (`:386`) and `DeleteAccount` (`:444`). Exports `KontoSection`/`KontoAsk` for the frame. |
| `SamtalDrill.tsx` | Screen 14: `SamtalElf` (`:834`) → `ElfDrill` (`:897`), keyed by sitting and deck; `readingBlock` (`:800`); `NoReading` (`:848`). The reading composition generalised for it: `DocPanel` takes the passage's test id and marks gap items (`gapRun`/`gapSpans`, `:1225`–`:1250`, woven with the evidence marks by `weave`, `:1182`); its ¶ control speaks Swedish inside English (`:1391`); the title is English only when it is the text's own; `QuestionTurn` (`:1094`) says "Lucka N" for a gap item, wraps the stem in `En` and shows a figure the question carries (`TurnFigure`, `:1132`); the strip and phone head name the section. |
| `SamtalFeedback.tsx` | The content's own words — options, your answer, the right answer, pitfall, technique, solution, steps, the distractors' reasons — wrapped in `En` (lang="en" in ELF, a plain span elsewhere); `Closing` takes `titleLang`. |
| `SamtalParts.tsx` | `ContentLangContext` + `En` (`:136`, `:141`), `isPromise` (`:154`), `bringIntoView` (`:168`). |
| `SamtalNav.tsx` | Pages `uppslag` and `konto`; Konto is no door's (`:79`); the Uppslag door's preview names the open lesson (`:107`); the account card (`AccountItems`, `:489`): who is signed in, rows Konto/Inställningar/Hjälp to their own section of Konto (`openAccount`, `:209`), the two modes (System removed, spec §13), "Tema och övningsval" (spec), Logga ut that asks and says so; an unfollowed section ask is dropped on the next page (`:219`). |
| `Samtal.tsx` | Routes 14 to `SamtalElf` (`:128`); remembers the last door for Konto's way back (`DOOR_OF`, `:68`, `:85`). |
| `SamtalHome.tsx` | Coordinator note: "when every plan item is complete and there is nothing to resume, say the plan is done" — now also when every part is done before the plan's own flag says so. |
| `meta.ts` | `screens: [1 … 14]`; an eighth trait (proposed copy). No `omits`: every Konto control is built. |
| `samtal.css` | "Round 2, batch 3" sections: shared (replies, a disabled reply, empty live regions), Uppslag, Konto, ELF gaps; `.sa-pick` adapted to the spec's chosen-filter look; the door preview kept to one line; paragraph focus dims to 0.7, not 0.38. All under `[data-rd='samtal']`, `sa-` classes, Samtal's tokens. |
| `Samtal.test.tsx` | Batch-3 suites (see Verification); screens 1–14 in the render loop; the batch-1 bake-off walk now ends on a built Uppslag. |

## What was built, per screen, and why it is Samtal

The language is batches 1–2's, unchanged: the coach's turns oat and left with a speaker corner; your choices plum and right; one filled plum action per state; attachments and documents opaque and calm; dated dividers; no text field in the conversation, no avatars, no typing dots.

### 12 · Uppslag & lektion — the coach hands over the lesson

- **The opening.** The date, then "Alla delprov" (spec's "Alla sektioner": the way down to the doors, focusing them). The coach's turn says where the reader stands ("**LÄS** · 2 av 8 frågetyper lästa") and one useful sentence: "Läs igenom den här frågetypen, så övar vi sedan på den." — read: "Du har läst den här frågetypen. Ska vi öva på den?"; no examples: "Läs igenom den här frågetypen." The family names the noun (frågetypen, fällan, taktiken, regeln, roten).
- **The lesson as a document** (`rd-lesson` on its title): an opaque Lora document across the column, not chat — its head "LÄS · Frågetyp" and "ca 2 min läsning" (derived from the entry's words at 200/min, as the app's reader estimates), the title, the state in words ("Inte läst"/"✓ Läst", and "Du lär dig den" from the progress row), then the catalog entry verbatim in its family's order (the app's `ProtocolCard`/`TrapCard`/`LexiconCard`):
  - question types (LÄS, ELF): "Så angriper du frågan" as numbered steps, "Vanliga fällor" as pattern + why it traps;
  - traps: the tldr as kicker, the pattern (not repeated when it is the title), "Varför det händer", "Igenkänningstecken", "Motåtgärd"; "Fler detaljer" (spec) discloses "Räkneexempel" (Förutsättning, Fällans tanke, Korrekt tanke, Svar), "När fällan inte gäller" and the distractor signature;
  - tactics "Igenkänningstecken", rules "Mönsterregel", roots "Ursprung", "Betydelse", "Exempel".
  - The foot: "Markera som läst" (`rd-lesson-read`, `aria-pressed`, a box you tick) and "Den räknas som läst först när du markerar den." Opening or scrolling never marks anything.
- **The replies:** "Öva hela LÄS" (quiet) and the one filled plum "Öva denna frågetyp · 10 frågor ↵" (`rd-lesson-practice`, the app's per-family label; Enter takes it). Without example questions the practice reply is disabled and described ("Det finns inga övningsfrågor till frågetypen än."), and "Öva hela LÄS" leads.
- **Below "Hela ramverket":** "Alla delprov" — the eight sections as Öva's reply-shaped doors in two stable groups (`rd-uppslag-section-<sektion>`, `aria-pressed` for the listed one, "Öppen" on the lesson's section, "frågetyper · 2 av 8 lästa"); then the listed section's entries as numbered rows (`rd-uppslag-entry-<id>`): title, kicker, "✓ Läst"/"Inte läst", progress ("lär dig", "övar", "repeterar", "sitter"), "10 övningsfrågor". A long catalog shows eight rows, "Visa alla 49 fällor" the rest (the open entry always shows). A door lists its section and moves focus to the list's heading.
- **Asking for a lesson.** A row calls `openLesson(id)`. The open text stays — only the open lesson has a body — and the coach says, where it was asked: "Lektion begärd. Den öppna texten ligger kvar tills den nya har laddats." (coordinator's copy), the row tagged "Begärd". When the host opens it, the notice goes and its title takes focus; a lesson the host opens unasked is shown without moving focus. The open lesson's own row ("Öppen ovan", `aria-current`) goes to the lesson and asks for nothing.
- **Why Samtal.** The coach frames, the document teaches, your choices are replies: one sentence, one attachment, one filled reply — the catalog is the conversation's appendix, not a dashboard of cards.

### 13 · Konto & inställningar — a short form in the coach's language

- **The opening.** The date, "Inloggad som Loucmane Benali.", "Här ställer du in hur du vill öva." (spec) and "Varje val skickas när du gör det, så det finns ingen spara-knapp." One reply, the filled plum: "Tillbaka till Öva ↵" — to the door the reader came from (remembered by the root; Idag without one). No door is current on Konto; the account entry is its only way in (spec: one launcher per layout, none in the content).
- **Ditt konto** (`rd-konto-identity`): initials, the name, the whole e-mail (wraps, never cut), the plan only when the account has one, "Provet: Höstprov 26 · 9 dagar kvar", and "Lösenord och tvåfaktor hanteras via din inloggningsleverantör." A missing name or e-mail is said ("Inget namn i kontot"), never invented.
- **Inställningar:** labelled groups (`fieldset`/`legend`, pressed-button semantics) of reply chips — "Utseende": Tema (`rd-konto-mode-light|dark`, through `actions.setTheme`: the host's theme changes), Palett, Typsnitt, Täthet; "Övning": Coachens röst (the chosen voice's blurb under it) and Frågeurval (Smart/Slumpat, the app's own hints). Each choice sends its own `setPrefs` patch (`rd-konto-<palette|font|density|coach>-<id>`); the chosen one is what the account says, shown with your tint, a solid plum line and a drawn check — never the filled plum. A refused choice (thrown, or a rejected promise) says "Kunde inte spara ändringen." in its own group and offers "Försök igen: Geometric". "Palett, typsnitt och täthet gäller appens vanliga utseende. Samtal behåller sina egna färger och typsnitt här." (spec: describe, never silently replace the direction's tokens).
- **Hjälp och villkor:** the supplied links.
- **Dina data:** "Exportera mina data" (`rd-konto-export`: "Export begärd."), "Logga ut" (`rd-konto-signout`: "Utloggning begärd."), and deepest "Radera konto" — the app's consequence text first, then "Radera kontot …" (`rd-konto-delete`, a disclosure) opening the flow: "Förhandsvisning – här raderas ingenting.", the export offered again before the word, "Skriv **radera** för att bekräfta." (`rd-konto-delete-word`), "Avbryt" (focus back to the toggle) and "Radera kontot permanent" (`rd-konto-delete-confirm`, `aria-disabled` until the exact word; pressed early: "Skriv radera först."). The request goes once: "Begäran om radering skickad. I förhandsvisningen raderas ingenting."; a refusal: "Kunde inte radera kontot. Inget raderades — försök igen." and the confirm is free again. Nothing ever says the account is deleted.
- **The account card** (every framed screen; screen 4 shows it open): who is signed in (name and e-mail), "Konto — Namn, e-post och dina data", "Inställningar — Tema och övningsval" (spec), the theme as two reply chips, "Hjälp — Support och villkor", and "Logga ut" (asks, then "Utloggning begärd."). Each row opens its own section of Konto and only then focuses and scrolls to it; arriving on Konto any other way moves nothing.
- **Why Samtal.** One coach line and one reply frame a plain form whose choices are the same reply chips as everywhere — not a sequence of coach questions, no fictional Save.

### 14 · ELF-läsfråga — English text, Swedish coach

- **The composition** is the LÄS drill's (spec §14: a content and language variant, not a second engine): focus mode with Avsluta (`rd-exit`, the controller's way out) and "ELF · Fråga 1 av 1"; the English text a calm opaque Lora document (`rd-elf-passage`, `lang="en"` on its title, paragraphs and byline), ÖVNINGSTEXT and "Om texten" Swedish outside it; the question as the coach's turn and the options as replies (`rd-option-<L>`, strike controls, `rd-lock`); phone: passage first, the reply tray.
- **Language boundaries.** `lang="en"` on the English only — the title, the paragraphs, the byline, the stem, each option's words, your answer, the right answer and every part of the explanation — while "Fråga 1", "Alternativ A", "Nästa gång", "Vad lockade dig med B?", the reply chips and the ¶ controls (`lang="sv"` inside the text) stay Swedish.
- **Facit in place** (no switcher steps: the screen stays 14): the verdict with glyph and word, your answer, the coach's Swedish question about the lure, the English explanation, "Visa allt" and "Nästa fråga"/"Slutför texten". The end: "Texten är läst", the English title marked English, the tally, and the plan's next part — never a done one — or "Till Öva".
- **Gap items** (spec: both cloze forms are legitimate): an empty stem is "Lucka 32", with "Välj det alternativ som passar i lucka 32 i texten."; the text marks its gaps as the printed test does (the ascending run of two-digit numbers through the question's own, as the app's drill reads it — a year, an age, "78%" stay text), the question's own gap in your tint, each said "lucka 32" in Swedish.
- **What it lacks:** no text, no stem (null), no options — Svara rests, the reason is said, "Till Öva" is the way out; a sitting without questions says so with Öva as the way on. A figure or option images it carries hold the answer while loading (calm word), stop it on failure with a real retry (a new load, waited for again), and a cached image is ready at once.
- **Decks.** A new sitting, or a deck whose questions change under the screen, opens a fresh drill (keyed by id and qids), so a shorter deck is never read out of range.
- **Why Samtal.** The document stays still and English while the conversation — coach turns, plum replies, one action in the reply dock — goes on in Swedish.

## Known pitfalls and coordinator notes: how each is met, and the tests

| Pitfall / note | Where | Test (`Samtal.test.tsx`, both widths) |
|---|---|---|
| Keys: digits 1–8, 0 and ←/→ reach the host from every focused part of 12, 13, 14; no keyscope on reading columns, questions, options, verdicts or sheets; never move focus on mount | No `data-rd-keyscope` anywhere in batch 3; nothing focuses on mount (Konto's ask, Uppslag's asked lesson and chosen door are user moves) | `:3836` through the real `Redesign2026Bakeoff`: on 12 (entry, a door, a catalog row, the lesson, the read mark, the practice reply), 13 (entry, a choice, a section heading, the delete toggle, the way back), 14 (entry, an option, a strike control, the passage, a ¶ number, the verdict, a lure reply, Visa allt, Nästa), "3" picks Spår and → steps the screen; the typed word keeps its digits |
| Required figures gate Svara/Enter while loading, failed or retrying; cached = ready; new source resets | `readingBlock` `SamtalDrill.tsx:800`; `FigureLoadsContext` in `ElfDrill` | `:3597` block, "an option's image holds the answer …" |
| A new sitting resets; a shrinking deck never reads out of range | `deck` key `SamtalDrill.tsx:842` | "a shorter deck, or a new sitting, opens fresh" |
| Labels match actions; done plan parts never offered | "Till Öva" → `go('ova')`; "Öva hela LÄS" → section drill; `next` from `nextPlanItem` unless `allComplete` | ELF end tests; Uppslag reply tests |
| Konto omissions declared | none: every control built (`meta.omits` undefined) | meta test; the shared contract |
| Typed-word delete | `rd-konto-delete-word`, exact `radera` | shared contract + "the deletion is deepest …" |
| Delete preview labelled, no pending deletion claimed | "Förhandsvisning – här raderas ingenting.", "Begäran … skickad." | same |
| Light/dark updates the host; one patch per other preference; no save claimed | `setTheme` for mode; `setPrefs({[key]: value})` | "the mode themes the stage …"; bake-off "the light/dark choice … themes the whole stage" |
| Konto entry keeps focus and scroll; a section only on a menu row; no door current; distinct rows → distinct places | `SamtalKonto.tsx:107`; `PAGE_DOOR.konto = null`; `openAccount` | "one coach line …", bake-off "each row of the account card …", "arriving at Konto by the switcher moves nothing" |
| Uppslag: honest notice; never fake content; practice disabled without examples | `Catalog` notice `:659`; `canPractise` `:222` | "a row asks for its lesson …", "an entry without example questions …" |
| ELF: only English content in `lang="en"` | `En`, `DocPanel`, `Closing.titleLang` | "the English text … stay English …", "the answer opens Facit in place …", "a wrong answer …" |
| Home: the plan said done when every part is | `SamtalHome.tsx` `done` | `:1236` |
| Dialogs: close before unmount, focus to the opener | No dialog added; the delete flow is an inline disclosure whose Avbryt returns focus to its toggle | "a refused deletion … Avbryt gives focus back to the toggle" |

**Mutation checks** (each edit made, the named tests run red, the edit reverted; `grep MUTANT` finds none; full suite green again):
- `data-rd-keyscope` on the ELF passage → 8 real-host key cases red (passage and ¶, "3" and →, both widths);
- `ElfDrill` not keyed by its deck → "a shorter deck …" red at both widths (`TypeError: Cannot read properties of undefined (reading 'qid')` in the core);
- the delete confirm without its once-only latch → "the deletion is deepest …" red (2 calls);
- Konto as Idag's page (`PAGE_DOOR.konto = 'idag'`) → 4 red (no door current, host row walk);
- option images not waited for → "an option's image holds the answer …" red;
- Konto focusing Inställningar on arrival → the arrival tests red.

Red-first in the plain sense: declaring screens 12–14 in `meta.ts` turned the two stale batch-1/2 assertions red (meta's screen list; "Uppslag shows the unbuilt card"); the shared contract for 12–14 passed on the first run.

## Spec gaps

Built only what kit v2 carries; every screen renders without the missing parts.

1. **§12 Data: only the open lesson has a body.** `UppslagView` gives index rows for every entry and the full entry for `open` only; `openLesson(id)` in the bake-off changes the screen alone. A row asks the host and the open text stays, said honestly; another lesson's body needs the provider.
2. **§12 States/Navigation: bookmark, return anchor, "Tillbaka till frågan", loading, error, read-sync.** Not in the view model: no bookmark or drill-origin link, no skeleton or failure state, no "unsaved" read state (`toggleLessonRead` is fire-and-forget; the mark shows what the provider says).
3. **§12 Index suggestion ("Vill du läsa om jämförelser? [> Läs KVA]").** Kit screen 12 always has an open lesson, so the coach's line is about it; the doors keep the exam's order with no "weakest" tag (`sections[].score` unused). The spec's index and reader are one page here (reader first, index below, "Alla delprov" at the top) because kit screen 12 needs both on screen.
4. **§12 Section scope and reading estimate.** Only the open entry's reading time (derived); no section-level scope text or estimate.
5. **§12 Example questions.** Only their count (`examples`, `practice.questions`); the question bodies (the app's `ExampleQuestions`) are not in the kit.
6. **§13 Persistence status ("Sparat", "Kunde inte spara ändringen").** Actions return void: the page says "Kunde inte spara ändringen." only for a thrown or rejected request and never claims a save.
7. **§13 Tools (Diagnostik, Provpass, Avancerat, Feedback).** No such links in `KontoView.links`; only the supplied help and policy links are shown.
8. **§13 System theme.** Removed from the account card (spec: B3 shows the two supported modes); persistent System following stays owner question 1.
9. **§13 The delete preview label.** "Förhandsvisning – här raderas ingenting." is true for the bake-off; the kit has no flag for a real delete, so a real provider must drop the label. The deep guarded flow is kept (owner question 2).
10. **§13 `showStreak` and `dailyMinutes`.** In `PrefsView` but not in the spec's settings list or in `KontoView.options`; not shown.
11. **§14 Fixture coverage.** The kit's ELF sitting is `elf-b19-003` (one paragraph, one question); the multi-paragraph reading fixture and the five-question cloze `elf-b18-002` the spec asks for are not in kit v2. The gap path is tested with a constructed question.
12. **§14 Explanation language.** No field says it: ELF content (passage, stem, options, explanation) is taken as English from the section and the passage's `lang`, per the kit's screen 14 ("feedback (English explanation)").
13. **§14 Citations in English explanations.** The shared `citeParagraphs` reads Swedish ordinals and ”…” quotations; English “…” quotes do not resolve, so only rare tokens (a year, a name) cite ¶ in ELF. Unchanged (shared `drillCore.ts`).
14. **§14 Estimate caveat, loading, first-open disclosure.** No estimate is shown on the drill, so no caveat; no loading flag; the note opens on demand (owner question 5).
15. **§12–§14 intermediate widths, text spacing, 200 % zoom.** Only the bake-off's `data-width` switch, as in batches 1–2.
16. **B3 inventory names.** Built as `SamtalUppslag` + `SectionDoors`/`Catalog` (ReferenceIndex) and `LessonDocument`, `SamtalKonto` (AccountPage) + `Preferences`/`PrefGroup` (PreferenceRows), and the ELF variant of `DocPanel` (EnglishDocument).

## Shared tests and follow-ups outside this write set

- **No shared test failed** (`contract.ts`, `Redesign2026Bakeoff.test.tsx`, `DirectionShell`-style suites all pass with screens 12–14 declared).
- **Follow-up (batch 2 file, not in this write set):** `SamtalFramsteg.tsx:195` (the `.sa-views` tablist) and `:437` (the weekly chart) carry `data-rd-keyscope`, so the switcher's digits and 0 are swallowed while a Framsteg tab or the chart has focus. Both already `preventDefault` their own arrows/Home/End, so the keyscope can go (the same fix Lager's round 2 asked for `LagerFramsteg.tsx`).
- **Seen, not changed:** `SamtalQuant.tsx` still keeps its own figure parts (batch 2 note).

## Proposed copy (new UI strings)

All new UI copy is **proposed**; spec copy is marked (spec), the coordinator's (coord), the app's own (app); source content (lessons, ELF text and explanation, approved disclosures, the deletion consequence) is verbatim.

- **Uppslag:** "Alla delprov" · "{LÄS} · {2} av {8} {frågetyper} lästa" · "Läs igenom den här {frågetypen}, så övar vi sedan på den." / "Läs igenom den här {frågetypen}." / "Du har läst den här {frågetypen}. Ska vi öva på den?" / "Du har läst den här {frågetypen}." · "Frågetyp/Fälla/Taktik/Regel/Rot" · "ca {N} min läsning" · "Inte läst" / "Läst" · "Du lär dig den" / "Du övar på den" / "Du repeterar den" / "Den sitter" · "Så angriper du frågan" · "Vanliga fällor" (app) · "Mönstret" · "Varför det händer" · "Igenkänningstecken", "Motåtgärd", "Räkneexempel", "Förutsättning", "Fällans tanke", "Korrekt tanke", "Svar", "När fällan inte gäller", "Mönsterregel", "Exempel" (app) · "Ursprung", "Betydelse" · "Så ser felsvaret ut" · "Fler detaljer" (spec) / "Färre detaljer" · "Markera som läst" (app) · "Den räknas som läst först när du markerar den." · "Tryck igen för att ta bort markeringen." · "Öva hela {LÄS}" (app) · "Öva denna frågetyp/taktik/regel", "Öva detta mönster", "Öva ord med denna rot" (app) + " · {N} frågor" · "Det finns inga övningsfrågor till {frågetypen} än." · "Hela ramverket" · "I provets ordning" · "Öppen" · "inget än" · "{N} av {M} lästa" · "{LÄS} · {Läsförståelse}" · "Öppen ovan" · "Begärd" · "lär dig/övar/repeterar/sitter" · "{N} övningsfrågor" / "inga övningsfrågor" · "Visa alla {N} {fällor}" / "Visa färre" · "Det finns inget att läsa i {KVA} än." · "Uppslaget är tomt just nu." · "Lektion begärd. Den öppna texten ligger kvar tills den nya har laddats." (coord) · the door preview "{LÄS} · {titel}".
- **Konto:** "Inloggad som {namn}." / "Konto och inställningar." · "Här ställer du in hur du vill öva." (spec) · "Varje val skickas när du gör det, så det finns ingen spara-knapp." · "Tillbaka till {Öva}" (spec pattern) · "Ditt konto och dina val" · "Ditt konto" · "Namn", "E-post", "Plan", "Provet" · "{Höstprov 26} · {9} dagar kvar" · "Inget namn i kontot" · "Ingen e-post i kontot" · "Lösenord och tvåfaktor hanteras via din inloggningsleverantör." (after the app) · "Inställningar", "Utseende", "Tema", "Palett", "Typsnitt", "Täthet", "Övning", "Coachens röst", "Frågeurval" · "Smart"/"Slumpat", "Frågor nära din nivå."/"Helt slumpade frågor." (app) · "Palett, typsnitt och täthet gäller appens vanliga utseende. Samtal behåller sina egna färger och typsnitt här." · "Kunde inte spara ändringen." (spec) · "Försök igen: {val}" · "Hjälp och villkor" · "Dina data" · "En fil med allt HP-Coach har sparat om dig." · "Exportera mina data" · "Export begärd." · "Kunde inte exportera just nu. Försök igen om en stund." (app) · "Logga ut från HP-Coach." · "Utloggning begärd." · "Kunde inte logga ut just nu." · "Radera konto" (app) · "Radera kontot …" · "Förhandsvisning – här raderas ingenting." · "Vill du ha kvar dina data, exportera dem först." · "Begärd." · "Skriv radera för att bekräfta." (app) · "Avbryt" · "Radera kontot permanent" (app) · "Skriv radera först." · "Begäran om radering skickad. I förhandsvisningen raderas ingenting." · "Kunde inte radera kontot. Inget raderades — försök igen." (app).
- **Account card:** "Namn, e-post och dina data" · "Tema och övningsval" (spec) · "Support och villkor" · "Utloggning begärd." · "Kunde inte logga ut just nu."
- **ELF:** "ELF · Fråga {N} av {M}" · "Lucka {N}" (app) · "Välj det alternativ som passar i lucka {N} i texten." · "lucka {N}", ", den här frågan" (screen reader) · "Texten saknas, så frågan kan inte besvaras." · "Det finns ingen text att läsa här just nu." · batch 1's other drill copy.
- **`meta.ts`:** the eighth trait.

## Verification

Commands as the bead asks (never `cd`; the shell's folder is the worktree):

- `pnpm -C app typecheck` → `tsc -b --noEmit`: **PASS**, no output.
- `pnpm -C app lint` → `biome check src`: **PASS** — "Checked 520 files … Found 4 infos." (`useIndexOf` in `LandingBakeoffR3.tsx`, `LandingBakeoffR4A.tsx`, `LandingBakeoffR4C.tsx`, `noUselessFragments` in `l12/M3.tsx`: pre-existing, outside the write set). 0 errors, 0 warnings.
- `pnpm -C app exec vitest run src/components/devbake/redesign/f-samtal/Samtal.test.tsx` → **562/562 PASS** (batch 2 ended at 365): the shared contract on 1–14 at both widths, the render loop on 1–14, and the batch-3 suites — Uppslag ×2 widths (9 tests each), Konto ×2 (11 each), the bake-off Uppslag/Konto walk ×2 (5 each), ELF ×2 (12 each), the paragraph-focus floor, and the real-host key matrix ×2 (40 cases each + the typed word).
- `pnpm -C app test` (final run, after the last edit) → **Test Files 109 passed (109) · Tests 3127 passed (3127)**. The stderr lines in that run (act warnings, `useRouter` outside a router) come from untouched suites (`useDailyPlan.hook`, `DrillQuestion`, `konto.test`, `HomeMobile`, `PedagogyPanel`, `DrillResult`); none from Samtal.
- **Browser self-check: not run.** One attempt to start Vite on 127.0.0.1 (`NODE_OPTIONS=--max-old-space-size=3072 pnpm -C app exec vite --host 127.0.0.1 --port 5191 --strictPort`) was denied by the permission policy. No screenshots, computed contrast, native focus, text-spacing or zoom sign-off is claimed; the coordinator's 16-view pass per screen (12, 13, 14; desktop/phone; light/dark) is needed, plus Konto's delete flow open, Uppslag with a trap lesson and "Fler detaljer" open, and ELF in Facit on the phone.

## Handoff

- HEAD `d3f7bdb9e194ad5e3eaa89adc351633adc8a5fe5`; the change is uncommitted and unstaged in the eleven admitted source/test/CSS files and this worklog. No dependency, shared-kit, shared-test or spec edits; no commits or remote actions.
- Coordinator next: the browser screenshot pass (above), commit, independent cross-vendor review at the exact head, and the Framsteg keyscope follow-up (outside this write set).

SAMTAL3 DONE: hpf-qr0p.26

## Round 2 — review hpf-64dw (HOLD, one P2): ELF image readiness per mounted image

- **Claim.** `gc hook --claim --json` returned `hpf-qr0p.26`, assignee `ci-wisp-hqs580l`, route `hpfetcher/gc.implementation-worker`; `bd show hpf-qr0p.26 --json` matched the id, the status (`in_progress`), the assignee and `gc.routed_to`.
- **Checkout.** HEAD `38c3fbad3de273f2605ad7a581804a05d7b1b0db` (the batch commit `56719ec` merged with `origin/main`), clean at the start apart from the sandbox's mount placeholders (above). Report read first: `/home/loucmane/scratch/hpf-qr0p.26/review-hpf-64dw.md`.

### The finding

ELF kept readiness per source (`useFigureLoadState`), but `TurnFigure` and `Options` mounted their images without `fresh`. A new, incomplete image therefore reported nothing, and the source's earlier `ready` stood for it. Svara was enabled, and Enter graded, before the image on screen had loaded. This happened on the phone when the open tray replaced the peek's loaded figure, and when the unanswered tray folded and reopened its option images. It also happened at any width when a later question showed an earlier image URL in a new element. On the desktop, the options remount after Facit, and a figure remounts after a question without one.

### The fix (paths under `app/src/components/devbake/redesign/f-samtal/`)

- `SamtalDrill.tsx:1164`: `TurnFigure` mounts its `FigureImg` with `fresh`. Each image mounted anew reports `loading` unless it is already complete. The open tray therefore waits for its own figure, and the next question's peek and tray wait for theirs.
- `SamtalDrill.tsx:137`: `DrillChrome.fresh?`, opt-in. `Options` passes it to `OptionBody` (`:322`), and `ElfDrill` sets `fresh: true` (`:996`). The quant drill leaves it unset, so its behaviour is unchanged.
- `SamtalParts.tsx:343`–`:362`: only a mounted image reports. A `mounted` ref is set in the mount layout effect and cleared in its cleanup, and `onLoad`/`onError` go through `say`, which drops a report from an image that has gone. React 19 already ignores a load or error from an element it has removed, so this changes nothing a test can observe (M5 below). The guard states the "older instances never speak" contract in `FigureImg` itself, for every screen that uses it.
- **Unchanged:**
  - An image that stays mounted keeps its load. It is not remounted and reports nothing new, e.g. the desktop figure from one question to the next.
  - An image complete at mount is ready at once (the existing layout-effect check).
  - A failed figure still needs a real retry: its alert replaces the image, so nothing remounts.
  - A retry is a new image, as before.
- Doc comments: `SamtalDrill.tsx` header (`:35`–`:38`), `DrillChrome.fresh` (`:134`–`:136`), `Options` (`:282`–`:284`), `TurnFigure` (`:1141`–`:1143`); `SamtalParts.tsx` header (`:15`–`:17`), `FigureImg` (`:341`–`:342`).

### Red-first tests (`Samtal.test.tsx:3829`, "ELF waits for each image where it is mounted (review hpf-64dw)")

- **phone `:3863`.** The question's figure loads in the peek, then the tray opens while its new image is incomplete. Svara is disabled with "Figuren laddas – du kan svara när den syns.", Svara (click) and Enter are refused, and no verdict shows. A load on the peek's old image changes nothing. The new image's load enables Svara, and Enter grades once. **Red on 38c3fba.**
- **phone `:3889`.** The option images load, the tray folds and opens again, and the images are new elements. The choice is kept (`aria-pressed`). Svara is disabled with "Bilderna till svarsalternativen laddas …", and Enter is refused. Loads on the folded-away images change nothing. With every new image but the last loaded, Svara is still disabled. After the last, it is enabled, and Enter grades once. **Red.**
- **phone `:3919`.** The next question has the same figure URL. After Nästa, the peek and then the open tray mount it anew, and Svara and Enter refuse until it loads. **Red.**
- **phone `:3942`, guard.** Images the browser already holds (complete at mount) are ready at once each time the tray mounts them (open, fold, open). Nothing says "laddas", and Enter grades. Green before and after: it guards against over-correction.
- **desktop `:3967`.** The next question has the same option images. The options remount after Facit, and Svara and Enter refuse until the images load. **Red.**
- **desktop `:3986`.** The figure that stays on screen into the next question is the same element and keeps its load: Svara is enabled at once. After a question without the figure, it mounts anew and is waited for. **Red** (in the second half).
- Run on the unchanged source: 5 failed, all at `expect(send()).toBeDisabled()`; 1 passed (the cached-image guard).

**Mutation checks** (each edit made, run on the six tests, then reverted):
- M1, `TurnFigure` without `fresh`: 3 red (phone peek → open, phone next question, desktop figure after a gap).
- M2, `ElfDrill` without `fresh: true`: 2 red (phone fold and reopen, desktop next-question options).
- M3, `TurnFigure` keyed by question (remounts on every question; an over-correction): the desktop "stays on screen keeps its load" test is red.
- M4, `FigureImg` ignoring the cache when `fresh`: the cached-image guard is red.
- M5, `FigureImg` without the `mounted` guard: all six green. React 19 drops events from a removed image; the stale-image assertions in `:3863` and `:3889` pin that behaviour.

### Verification (round 2; the Samtal run came just before the formatting-only fix below, and the full run after it includes those tests)

- `pnpm -C app typecheck`: **PASS**, no output.
- `pnpm -C app lint`: **PASS**, "Checked 524 files … Found 4 infos." These are the same four pre-existing infos as above, outside the write set. 0 errors, 0 warnings. The first run flagged this round's `FigureImg` return line for formatting; it was reformatted as Biome prints it.
- `pnpm -C app test src/components/devbake/redesign/f-samtal/`: **568/568 PASS** (562 + 6).
- `pnpm -C app test`: **Test Files 109 passed (109) · Tests 3319 passed (3319)** (3313 at the merge head + 6).
- **No shared test failed, and none was edited.** Changed this round: `SamtalDrill.tsx`, `SamtalParts.tsx`, `Samtal.test.tsx` and this worklog, all admitted. `FigureImg`'s guard also covers `SamtalQuant.tsx` and `SamtalProvpass.tsx`, which mount `FigureImg`. Their behaviour is unchanged (React already drops those events), and their suites pass.
- **Browser self-check: not run** this round (last round's Vite attempt was denied by the permission policy).

### Follow-up outside this write set (seen, not changed)

- `SamtalQuant.tsx` (batch 1, not admitted) keeps readiness per source the same way.
  - DTK's phone tray (`TrayDrill`) folds and reopens its option images (the eleven pie-chart questions), and its chrome (`:344`) leaves `fresh` unset. A reopened, still-incomplete image can therefore pass on its source's earlier `ready`.
  - Its `Diagram` (`:680`) can do the same when a later question shows a diagram again after a question without it.
  - The fix is the same opt-in: `fresh: true` in its chrome and `fresh` on `Diagram`.

SAMTAL3R2 DONE: hpf-qr0p.26

# Worklog — hpf-qr0p.23

Redesign round 2, batch 3 for direction **E · Svep — "Ett kort i taget"**: screens 12 Uppslag & lektion, 13 Konto & inställningar and 14 ELF-läsfråga, at desktop and phone, light and dark, all read through `useDirectionData()`.

The work follows:

- the bead's DESIGN brief (round 1b instruction for a Claude worker), including the coordinator's direction notes from the batch-3 reviews of Instrument, Lager and Raster;
- `docs/redesign/kit-v2.md` (view model, data context, contract ids per screen, Konto omissions, the typed-word delete);
- the direction's merged round-2 spec, `docs/redesign/directions/e-svep.md` (§12–§14 and the shared Svep grammar);
- `docs/redesign/2026-10-round1-brief.md` (shared IA, reading UX, craft bar);
- batch 1 and 2's worklogs, `docs/worklog/hpf-qr0p.21.md` and `docs/worklog/hpf-qr0p.22.md`.

## Snapshot and boundaries

- **Claim.** `gc hook --claim --json` returned `hpf-qr0p.23` (assignee `ci-wisp-bw97ocb`, route `hpfetcher/gc.implementation-worker`). `bd show hpf-qr0p.23 --json` matched the id, the status (`in_progress`), the assignee and `gc.routed_to`.
- **Checkout.** Branch `codex/hpf-qr0p.23-redesign-round-2-direction-e-svep-batch-3-uppslag-lektion-ko` at `c5e8d4d` (= `gc.worktree_base_sha`, batch 2 merged as PR 436), clean at the start. The untracked root dotfiles are the sandbox's and were not touched.
- **Write set kept.** Changed: `Svep.tsx`, `SvepDrill.tsx`, `SvepHome.tsx`, `parts.tsx`, `svep.css`, `meta.ts`, `Svep.test.tsx`; new: `SvepUppslag.tsx`, `SvepKonto.tsx`, this worklog. `deck.ts` needed no change. No shared kit file, spec, registry, page, other direction or dependency was touched; no git writes; nothing committed.
- **Check script.** `gc.check_path` is `…/gascity/assets/scripts/checks/build-artifact-valid.sh`, sha256 `71f17450e127055c8304a3cb44ce87b2439abe04ba41f225c7b386be3dc73911`. The bead names no validator to run, so it was not run.
- **Network.** None used.

## Deliverables (uncommitted)

All paths are under `app/src/components/devbake/redesign/e-svep/`.

| Path | What |
|---|---|
| `SvepUppslag.tsx` (new) | Screen 12: the eight section doors, the open lesson as one reference card (every entry family: protocol, trap, tactic, rule, root), another section's card ("Öppna KVA"), the neighbours' arrows, the contents register and the "Lektion begärd" notice. |
| `SvepKonto.tsx` (new) | Screen 13: the account as a three-card deck (Konto, Inställningar, Hjälp) with its register, and the account's details under it (sign-in, plan, export, the typed-word deletion labelled a preview). |
| `SvepDrill.tsx` | Screen 14: `SvepElf` — the reading table on the drill core alone, keyed per sitting, with the missing-text state. The reading table is shared by 2–3 and 14 (`ReadingTable`); English content is marked `lang="en"` through `contentLang(question)`; `Prompt` names an empty ELF stem "Lucka N"; `Options` says when a question has no options; `DoneCard` takes the title's language and says "1 fråga". Screens 2–3 behave as before. |
| `Svep.tsx` | Routes 12 → Uppslag, 13 → Konto (a page of the frame, none of the five doors current), 14 → `SvepElf` on the ELF table. The account card's rows open Konto at their own card and remember the page they were asked from; a plan's lesson carries its entry id to Uppslag. The "kommer senare i omgång 2" stub is gone (every door is built). Both reading drills are keyed by their sitting. |
| `SvepHome.tsx` | A finished plan part says "Klart för idag" and offers nothing to start; open parts come first; with every part done and nothing to resume, the deck opens on "Dagens plan är klar." with Till Öva. |
| `parts.tsx` | Deck kind `konto`; `DeckStage` takes `swipe={false}` for a deck whose cards hold controls. |
| `svep.css` | The batch's styles, all under `.sv-root` and on the existing tokens; one new token pair `--sv-back-elf` (the turned card on the ELF table); the `konto` deck joins the existing card rules; container queries for 1320/1120 px wide and 820 px high; reduced motion covers the new choice slips. The dead stub styles are removed. |
| `meta.ts` | `screens: [1 … 14]`, no `omits`, one trait for batch 3 (proposed copy). |
| `Svep.test.tsx` | 354 tests (265 before): the shared contract now covers 12–14 at both widths, plus Svep's own tests for this batch (below). |

## The screens, and why they are Svep

The grammar is batch 1 and 2's: one card in front with the next cards' edges behind it, a counter and a named register, real card stock on a matte table that takes the tint of the section in front, one raspberry action, ink for every other state, no colour for right or wrong.

**12 · Uppslag & lektion — a reference card with its place kept.** Left: "Uppslag", a line, and all eight sections as small door cards in two columns (the Öva door cards, now with "N avsnitt" and "N lästa"; "Innehåll saknas ännu" when a catalog is empty; the weakest section's ink "Svagast" tab only when at least two sections have a score). The door of the section on show is raised with an ink rim (a state, as Provpass's halves). Middle: the open lesson as one tall reading card of practice's stock — section chip, "Frågetyp · Lär in", "Avsnitt 3 av 8" — the title, then the entry in its family's own order, its prose in the passages' reading face (Source Serif, 18,5/1,6): a protocol's method as numbered steps on small number cards and its common wrong answers under a thin rule; a trap's kicker, why it happens, its recognition cue, the wrong answer's signature, the countermeasure, the worked example and the counter-example; a tactic's "När den passar"; a rule; a root's meaning, origin and example words. Math goes through MathText; optional fields are left out. The next entries' blank edges stand behind the card; under it "‹ Avsnitt 3 av 8 ›" asks for the neighbours by name. The card's foot holds the read marker — "Markera som läst" / "Läst ✓", a pressed state in words and an ink rim, never set by opening or scrolling — and the one filled action, practising this entry, labelled as the real reader labels it per family ("Öva denna frågetyp · 10 frågor"); with no examples it is off ("Inga exempelfrågor än") and "Öva hela LÄS i stället" is offered by that name. Right: the contents register — every entry by number and name (two lines for a trap's sentence), what is open, read or asked for in a word. Choosing another section deals that section's card ("KVA · N avsnitt", how much is read, "Nästa olästa …", **Öppna KVA**) and its contents in the register. The table takes the tint of the card in front (LÄS slate, ELF sea-grey, ORD sand, else stone). Phone: one column — the doors four a row, the card as tall as its text with its edges below, its arrows and **Innehåll** (to the register), then the register.

- *Honest requests.* An entry, an arrow or Öppna asks `openLesson(id)`. While the data's open lesson is not the one asked for, the card keeps the open text and says so in a status: "Lektion begärd. Den öppna texten ligger kvar tills den nya har laddats." with "Begärd: KVA · …"; the register marks that entry "Begärd". It goes when the host has that lesson open, or when the reader asks for the open one or picks another section. A plan's lesson from Idag arrives the same way (its entry id travels with the request): in the bake-off, "ELF-lektion" lands on the open LÄS lesson with the notice naming "ELF · Slutsatsdragning / implikation", the register on ELF, the focus on the card's heading.

**13 · Konto & inställningar — one place, one account entry.** The account card is dealt open from the avatar and expands into the same indexed stock: a deck of three cards on the neutral table. **Konto**: a non-interactive avatar picture, the name as the card's heading and the full e-mail (it wraps; never cut), the plan when there is one, and Tema (Ljust/Mörkt — production's two modes). **Inställningar**: Palett, Coach (each voice with its blurb), Urval (Smart/Slumpat with the real page's hint line), then under "Finjustering" Typsnitt and Täthet. Every choice is a slip of stock; the one in use lies raised with an ink rim (selection is a state, not a second filled action). **Hjälp**: Svep's keys (on a phone, its moves), then the support and legal pages, which open beside the bake-off. Each card's foot holds the screen's one filled action, the way back named after the page Konto was asked from ("Tillbaka till Öva", "Tillbaka till Repetera", "Tillbaka till resultatet"; "Till Idag" when reached another way). Left: the page, a line and the exam countdown as read-only context. Right: the deck's register and "Längre ned" (Inloggning, Plan och betalning, Dina data — each brings its section into view with its heading focused). Under the deck, on the table, the account's details in the real page's order: Inloggning (the provider line, **Logga ut**), Plan och betalning (the real page's honest line, or the plan), Dina data (**Exportera min data**, then, last and quietest, **Radera konto** with a "Förhandsvisning" badge, the real consequences copy, and on its own button the typed-word confirmation). Phone: the three cards as tabs over the deck, then the details.

- *Entry and focus.* Reached by the switcher or a link, the focus and the page stay where they were and the deck opens at Konto. Reached from an account-card row, the popover closes first (one account panel at a time), that card comes to the front and its heading takes the focus. The three rows go to three places; the old "Hjälp" row that only closed the popover now opens Hjälp, and the "Inställningar" hint no longer promises an exam-date editor that does not exist.
- *What is claimed.* The theme asks `actions.setTheme`; every other choice sends its own `setPrefs` patch; the pressed state is what the data then says, announced once in a polite region ("Palett: Sage"). Nothing says "sparat". Export says "Exporten är begärd. Förhandsvisningen skapar ingen fil." The deletion opens on its button, focuses the word field, enables "Radera kontot permanent" only for the exact word `radera`, closes on Esc or Avbryt with the focus back on its button, and after the confirm says "Det här är en förhandsvisning: inget har raderats." — never a pending or done deletion. Enter outside the button deletes nothing.
- *Movement.* The deck moves by its register, its arrows and (phone) its tabs. It takes neither ←/→ (they stay the bake-off's, on a card of choices) nor a swipe (the cards hold controls; `DeckStage swipe={false}`).

**14 · ELF-läsfråga — English content, Swedish controls.** The reading pair of 2–3 on the sea-grey ELF table: one tall English reading card (title, numbered paragraphs, byline) and its question card with the unit's waiting questions as edges; on phone the text fills the screen and the question card peeks with its whole prompt and **Till frågan**. Answering turns the card to the verdict on sea-grey stock and the explanation runs as the same short sequence of evidence cards as LÄS, the text underlining what the card in front leans on. The English content is marked `lang="en"`: the title, the passage (`rd-elf-passage`), the prompt, each option's text, the right answer and your pick on the verdict card, and the explanation's prose (solution, steps, technique, pitfall, why tempting/why wrong — ELF explanations are written in English). Everything Swedish stays outside it or restores it: the badge, Om texten and the note, Styckefokus, the paragraph numbers' buttons (`lang="sv"` inside the English body), "Alternativ A:" for a screen reader, Svara, the verdict sentence, every heading of the facit run, Avsluta. An empty cloze stem is named by its gap in Swedish ("Lucka 32") and the numbered gap stays in the English text. Keys: the question's own letters (A–D here: no E), Shift+letter strikes, Enter/Space answer and go on, F/J/K the paragraph focus, Esc only lets go of that focus — it never leaves. Avsluta asks the controller (the bake-off returns to where the drill started). The end card is the unit's hand face up: "Counting Pots from the Pavement · 1 fråga · 1 rätt · 1 min" (the title marked English), the plan's next open part as the filled action, "Till Idag" (`go('idag')`) quietly. A sitting without questions or text is never an answerable shell ("Texten saknas just nu." with Avsluta); a question without options says so and Svara stays off; a new sitting (id or questions) starts afresh.

**Idag (direction note).** A finished part of the plan says "Klart för idag" with a check glyph and has no button; Enter on it takes nothing; open parts come first and the first open one leads (filled with nothing to resume). With every part done and nothing to resume the deck opens on "Dagens plan är klar." with **Till Öva**, and the day's line says the same.

## Navigation: intents, not screen numbers

| Element | Request | Bake-off |
|---|---|---|
| Uppslag's entry, arrows, Öppna KVA | `openLesson(id)` | 12 (same lesson: the notice) |
| Uppslag's Markera som läst | `toggleLessonRead(id)` | kept for the session |
| Uppslag's practice / whole section | `startDrill({ kind: 'framework', frameworkId, section })` / `startDrill({ kind: 'section', section })` | by section (LÄS 2, ELF 14, quant 6, DTK 7) |
| Idag's lesson plan item | `openPlanItem(id)` + the entry id to Uppslag | 12 |
| Account card rows | `openKonto()` + the card (Konto, Inställningar, Hjälp) | 13 |
| Konto's way back | `go(dest)` / `openRepetera()` / `openProvResult(id)` | the page asked from |
| Konto's Tema / each preference | `setTheme(mode)` / `setPrefs({ key: value })` | `t` / kept for the session |
| Konto's export, deletion, sign-out | `exportData()`, `deleteAccount()` (after the word), `signOut()` | nothing |
| ELF's Avsluta | `drill.exit()` | the screen the drill was started from |
| ELF's end: next part / Till Idag | `openPlanItem(id)` / `go('idag')` | by kind / 1 |

## The known pitfalls and the direction notes, each with its test

- **Keys through the real host** (`Redesign2026Bakeoff` held still on 12, 13 and 14, keys fired on the focused element): on 12 and 13, "3" and → reach the switcher from the entry focus and from every control on the screen (a sweep of all buttons, links and focusable regions, both widths). On 14 the same holds in the question phase, before and after a choice (passage region, options, strike buttons, Om texten, Styckefokus, paragraph numbers, Svara, Avsluta). No `data-rd-keyscope` exists on 12–14. Tests: "Svep, batch 3 inside the bake-off".
- **In Facit (3 and 14), ← and → turn the run of facit cards** — Svep's declared grammar since round 1 (meta traits; batch 1's screen-3 tests) — and reach the switcher at the run's ends; "3" reaches it from every control in Facit. This is deliberate and tested ("in Facit "3" always reaches the switcher; → turns the run, then reaches it at its end"). If the coordinator wants → to reach the switcher from inside Facit too, the change is the run's two arrow bindings in `useDrillKeys` (`SvepDrill.tsx`), and it would change screen 3 with it.
- **Dialogs**: none added. The deletion confirmation is an inline disclosure (Esc and Avbryt hand the focus back to its button); the account popover is round 1's.
- **Konto omissions**: none — every control is there and live (`meta.omits` absent, tested). The delete reproduces the real typed word with `rd-konto-delete-word`; the shared contract's typed-word path passes; the preview label and "inget har raderats" are tested.
- **Konto entry**: the switcher's entry keeps the focus on the page (`document.body`) and the deck at Konto; each account-card row lands on its own card with the heading focused; no door is `aria-current` on Konto; the rows go to distinct places. Tests: "Konto: each account row opens its own card …" (both widths, through the real host), "Konto: opened by the switcher …".
- **Uppslag**: the notice, the requested entry in the register, its disappearance once the host has it open, the arrows asking by name, labels matching actions, practice off without examples. Tests: "Svep, Uppslag".
- **ELF language boundaries**: every English element `lang="en"`, every Swedish control resolving to `lang="sv"`, in the question and in Facit, both widths. Tests: "Svep, ELF-läsfråga".
- **Lists that shrink and new sittings**: the ELF sitting is keyed by its id and questions, so a new or shrunk sitting remounts the drill core instead of keeping an out-of-range index (the core does not clamp); the LÄS drill is keyed the same way. The Konto deck's cards are fixed. Uppslag's register follows the data; a removed open entry drops the position and the arrows instead of pointing past the list.
- **Labels match actions**: "Till Idag" calls `go('idag')`; the way back names its page; Öppna KVA asks for KVA's first unread entry; practice names what it practises; a finished plan part is never offered as next work.

## Spec gaps (built only what kit v2 supports; rendered without the rest)

1. **§12 Data shown — reading time and last-read bookmark.** `UppslagView` has neither; not shown.
2. **§12 States — loading, bookmark failure, unresolved vs zero examples.** No loading or failure state in the kit, and `practice.questions` is a number: zero means none, "unresolved" cannot be told apart.
3. **§12 Navigation — opening another entry.** In the bake-off `openLesson` only changes the screen and the data keeps one open lesson (LAS-TYPE-003). The screen never fakes the requested content: it keeps the open text and shows the coordinator's notice. The real host must answer `openLesson(id)` with that entry in `uppslag.open`.
4. **§12 Navigation — practice returns to the entry.** True for drills that leave through `drill.exit` (ELF 14, quant 6, DTK 7: the bake-off returns to 12; tested). The LÄS drill on 2–3 keeps round 1's Avsluta → Idag because the shared contract asserts `onScreen(1)` there; a LÄS lesson's practice therefore returns to Idag in the bake-off (tested as such). A kit-level "return to caller" for screens 2–3 would close it.
5. **§12 Reuse — "[Fördjupning]" disclosure.** The catalog entries carry no separate depth part, so the card reads in one flow; no disclosure is invented.
6. **§13 Data shown — Diagnostik, Avancerat and Feedback links.** Not in `KontoView.links`; only the kit's links (help, legal) are shown, in Hjälp.
7. **§13 States — pending, failed or unsynced preference saves, and retry as the primary.** `setPrefs`/`setTheme` return nothing; the screen shows the data's value and claims no save.
8. **§13 States — signed out.** "Du är inte inloggad" is shown when the identity is empty, but the kit has no sign-in action to offer.
9. **§13 Account deletion boundary — pending, error and completed states; export's result.** `deleteAccount()` and `exportData()` return nothing, so the deletion is labelled a preview and claims nothing; export says only that it was asked for. The real app needs a status from the kit to show its existing states.
10. **§13 / owner question 1 — System theme.** Konto offers Ljust and Mörkt (production's modes). The account popover keeps round 1's "System" (resolved once on press, not a saved mode); unchanged here.
11. **§13 — exam date/goal editor.** Not drawn (no route or contract); the exam is read-only context.
12. **§13 — `dailyMinutes` and `showStreak`.** In `PrefsView` but not in the spec's list and without an option list for minutes; not shown.
13. **§14 Disclosure / owner question 2 — first-unit note.** The kit has no "first encounter" signal; the note stays on demand ("Om texten"), as Svep's has been.
14. **§14 States — retry and loading.** No retry request and no loading state; a missing text offers Avsluta only.
15. **§14 — the explanation's language.** `Explanation` has no language field; ELF explanations are marked English by the question's section. A future Swedish-authored ELF explanation would need a `lang` from the kit.

No shared test outside the write set failed, so there is nothing to hand the coordinator.

## Proposed UI copy (new in this batch; none is approved yet)

- **Uppslag:** "Ett avsnitt i taget. Läst markerar du själv."; "Delprov · 8 ramverk"; "N avsnitt", "N lästa", "Inget läst", "Innehåll saknas ännu"; kinds "Fälla", "Taktik", "Regel", "Frågetyp", "Ordrot"; progress "Inte övat", "Lär in", "Övar", "Repeterar", "Befäst"; "Avsnitt 3 av 8"; "Begärd: …" (the notice sentence itself is the coordinator's); part titles "Så angriper du frågan", "Vanliga felsvar", "Att tänka på", "När den passar", "Regeln", "Betydelse", "Ursprung", "Exempelord", "Varför det händer", "Känn igen den", "Så ser felsvaret ut", "Motdraget", "Exempel" (Uppgiften, Fällan, Rätt tänkt, Svar), "När det inte är en fälla"; "N frågor", "Inga exempelfrågor än", "Öva hela LÄS i stället"; "KVA · N avsnitt", "tomt än", "N av M lästa.", "Allt är läst – slå upp vad du vill igen.", "Nästa olästa", "Först i registret", "Till LÄS"; "Innehåll · LÄS", "N avsnitt · M lästa", "Öppen", "Läst", "Begärd"; "Föregående avsnitt: …", "Nästa avsnitt: …", "Innehåll". (Existing real copy reused: "Markera som läst", "Läst ✓", the per-family practice labels.)
- **Konto:** "Ett kort för kontot, ett för inställningarna och ett för hjälpen. Uppgifterna om kontot ligger längre ned."; "dagar kvar till …"; "Konto · inloggad som"; "Så ser HP-Coach ut för dig"; "Palett", "Coach", "Urval", "Finjustering", "Typsnitt", "Täthet"; "Kortkommandon", "Så rör du korten" and the key and move descriptions; "(öppnas i en ny flik)"; "Till Idag", "Tillbaka till resultatet"; "Kontot · 3 kort", "Längre ned"; "Kontouppgifter", "Dina data", "En kopia av allt du har gjort i HP-Coach: försök, missar och resultat.", "Exportera min data", "Exporten är begärd. Förhandsvisningen skapar ingen fil.", "Förhandsvisning", "Radera konto …", "Avbryt", "Det här är en förhandsvisning: inget har raderats."; the popover's row hints "Namn, e-post och inloggning", "Palett, typsnitt och coach", "Kortkommandon och support". (Existing real copy reused: the sign-in and plan lines, the deletion consequences, "Skriv radera för att bekräfta.", "Radera kontot permanent", the selection hints; the spec's "Konto och inställningar", "Tillbaka till Öva", "Du är inte inloggad".)
- **ELF:** "Lucka N" (spec), "ELF · engelsk läsförståelse", "Texten saknas just nu.", "Övningen kan inte visas utan sin text, så det finns inget att svara på här. Avsluta och välj en annan övning så länge.", "Svarsalternativen saknas just nu.", "1 fråga".
- **Idag:** "Dagens plan är klar.", "Planens enda del är gjord." / "Alla fyra delarna är gjorda.", "Vill du öva mer finns alla delprov och dina missar i Öva.", "Klart för idag", "Planen är klar", "klart".
- **meta.ts:** the batch-3 trait.

## Verification

- `pnpm -C app typecheck` — clean.
- `pnpm -C app lint` — 0 errors, 0 warnings; 4 infos, all in files outside this write set (`LandingBakeoffR3/R4A/R4C.tsx`, `l12/M3.tsx`), pre-existing.
- `pnpm -C app exec vitest run src/components/devbake/redesign/e-svep/Svep.test.tsx` — 354/354.
- `pnpm -C app exec vitest run src/components/devbake/redesign` — 14 files, 2144/2144.
- `pnpm -C app test` — 109 files, 3205/3205.
- **Browser self-check: not done.** Running the coordinator's screenshot harness (a copy of `~/scratch/redesign-harness` in this session's scratchpad: Vite on 127.0.0.1 and Playwright) was denied by the session's command policy, and per the brief it was not retried another way. The layout, contrast and overflow of 12–14 are therefore checked only by reading the stylesheet against batch 1–2's rules and by jsdom; the coordinator's 16-view pass per screen is still needed (12 catalogue and reader, 13 account and settings, 14 reading and feedback; desktop and phone; light and dark).

## Owner questions carried

From e-svep.md: 1 (System theme) and 2 (first synthetic-text disclosure) bear on this batch; both keep the proposed defaults above. New: should ←/→ stay the facit run's own in Svep's Facit (3 and 14), as since round 1, or always go to the switcher?

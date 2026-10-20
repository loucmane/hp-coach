---
bead: "hpf-qr0p.32"
project: "hpfetcher"
session: "ci-wisp-0ljmcli"
status: "implemented_uncommitted"
---

# Worklog — hpf-qr0p.32

Direction H · Ljuskägla, round 2 batch 3: screens 12 Uppslag & lektion, 13 Konto & inställningar and 14 ELF-läsfråga. Also the two required batch-1 carry-overs in `LjuskaglaQuant.tsx` and the Home "plan is done" note.

## Findings

- 2026-10-20 05:40 UTC: claimed through the managed hook (session `ci-wisp-0ljmcli`).
  - Starting state: clean on the assigned branch at base `e7325ece34da92b2c340f8b0594370c66a0f3d7c`, with the kit and batches 1–2 merged.
  - All work is uncommitted and the bead is not closed, as the brief requires.
- Read:
  - `docs/redesign/kit-v2.md`;
  - the shared kit (`viewModel.ts`, `directionData.tsx`, `drillCore.ts`, `contract.ts`, `r1Kit.ts`, the Uppslag/Konto/ELF parts of `r2Fixtures.ts`);
  - the bake-off host's key handling (`Redesign2026Bakeoff.tsx`);
  - the direction spec `docs/redesign/directions/h-ljuskagla.md` (the shared rules, §12–§14, the handoff and the owner questions);
  - batch 2's worklog (`hpf-qr0p.31`, including its two review rounds);
  - the real `routes/konto.tsx` and `routes/mer.tsx`, and the app's lesson cards, for copy and semantics;
  - Raster's `RasterUppslag.tsx` and the Konto files of Raster and Lager, as precedent only.
- **Shared tests:** none failed. `Redesign2026Bakeoff.test.tsx`, the `DirectionShell` tests and `directionData.test.tsx` pass with screens 12–14 declared. No file outside the write set was edited.
- **Sandbox:** every command ran from the worktree root with `pnpm -C app …`, never `cd` (batch 2's playbook note).
  - The eleven untracked dotfile placeholders at the worktree root (`.bash_profile` … `.zshrc`) predate this work. They are not part of it.
- **The kit's `openLesson` only changes the screen.** In the bake-off, the open lesson is always `LAS-TYPE-003`. Asking for another entry therefore shows the coordinator's honest notice, and the open text stays.

## What was built, per screen, and why it is Ljuskägla

The vocabulary is batches 1–2's throughout:
- the `--lj-*` tokens, with no new colours;
- Manrope for the interface, Spectral for reading and display;
- one opaque lamp surface per state, with the warm beam on its left edge and the asymmetric `4px 20px 20px 4px` radius;
- everything else in open, divided rows in the shade (`.lj-shade`);
- 160 ms colour transitions only.

### 12 · Uppslag & lektion (`LjuskaglaUppslag.tsx`, new)

- **The lit reading place.** The open lesson is the one lamp, a 66ch Spectral reading field beside a quiet directory. It shows:
  - an eyebrow: "LÄS · Svensk läsförståelse · frågetyp";
  - the title (`rd-lesson`);
  - "Läses på ungefär N minuter", estimated from the entry's own words, and its progress in words ("under inlärning");
  - its family's own content, not one generic card:
    - question types (LÄS, ELF): "Så tar du dig an frågan" as numbered steps, and "Vanliga felsvar" as pattern + why it traps;
    - traps (XYZ, KVA, NOG): the kicker in italic Spectral, "Mönstret", "Känn igen det", "Varför det lurar", "Det lockande felsvaret", "Motdraget", a worked example on an inset paper well, and "När mönstret inte gäller";
    - tactics (DTK), rules (MEK) and roots (ORD, the root set large, then its words).
- **One filled action.** At the end of the lesson:
  - "Markera som läst" (`rd-lesson-read`, which becomes "Läst · ångra");
  - the family's own practice words from the app's cards, with the count: "Öva denna frågetyp · 10 exempelfrågor" (`rd-lesson-practice`, which calls `startDrill({ kind: 'framework', … })`). Practice is disabled, with the reason, when there are no examples.
- **The directory.** The eight sections sit in their stable order as divided rows (`rd-uppslag-section-<s>`), each with "N av M frågetyper lästa" or "Inget innehåll här ännu".
  - One section at a time unfolds its entries (`rd-uppslag-entry-<id>`, `aria-expanded`). At the start that is the open lesson's section.
  - The open entry sits on the lamp with the warm beam (`aria-current`). Every entry says "läst / inte läst" and its progress.
- **Asking for another entry.**
  - It calls `openLesson(id)` and shows, in the lesson: "Lektion begärd: {titel}. Den öppna texten ligger kvar tills den nya har laddats." The requested entry says "begärd". No borrowed body is shown.
  - When the host supplies the new lesson, its section opens and its title takes focus.
  - Choosing the open entry again ends the wait and focuses the title.
- **The read mark is the host's.** The button shows `open.read`, and "Markerad som läst." is said only once the host shows it. A host that does not update shows no claim.
- **Phone.** The directory folds into one "Innehåll · LÄS · Författarens hållning" disclosure above one continuous reading scroll. The bottom bar stays, with Uppslag lit.
- **Why H:** the lit reading place beside a quiet directory, the warm line on the open entry, and restrained Spectral prose. It extends the reading room beyond passages.

### 13 · Konto & inställningar (`LjuskaglaKonto.tsx`, new)

- **The reading room first, in one modest lamp: "Ditt läsrum".**
  - **Läge:** Ljust / Mörkt (`rd-konto-mode-<mode>`) through `actions.setTheme`, so the host's theme changes.
  - **Styckeljus:** on / off (`rd-konto-spotlight`). This is the paragraph light the drills use, lifted to the direction's root so Konto and screens 2, 3 and 14 share one switch. It says plainly that it applies only in this preview and is not saved (owner question 2).
  - A polite status names each change ("Mörkt läge.", "Styckeljuset är av.").
  - **The page's one filled action, "Tillbaka till …":** back to where the reader came from (Öva, Repetera, Provpass, the result, "läsningen" for Uppslag, Framsteg), or Idag when Konto was entered straight in. Each label calls the matching action.
- **Quiet rows in the shade.**
  - "Coachens röst" (`rd-konto-coach-<key>`, each with its blurb) and "Urval" (Smart / Slumpat): each sends its own `setPrefs` patch.
  - "Avancerat": Typsnitt (`rd-konto-font-<key>`) and Täthet (`rd-konto-density-<key>`) also send their own patches. They say these apply to the app's own pages, while Ljuskägla keeps Manrope, Spectral and its rhythm.
  - "Palett" names the app's palette but offers no choice (see Decisions).
  - "Hjälp och villkor" lists the kit's links.
- **The account below** (`rd-konto-identity`):
  - the initials, the name in Spectral and the whole e-mail, wrapping and never cut;
  - the exam and days left;
  - the real app's informational "Plan och betalning" and "Lösenord och tvåfaktor" lines;
  - "Logga ut" (`rd-konto-signout`) → "Utloggning begärd.";
  - "Din data" → "Exportera din data" (`rd-konto-export`) → "Exporten är begärd.".
- **Deletion, at the very bottom.**
  - The real app's text and "Förhandsvisning: här raderas ingenting." come first.
  - "Radera kontot …" (`rd-konto-delete`, `aria-expanded`) opens an inline confirmation and focuses its field. The confirmation offers:
    - "Exportera min data först";
    - "Skriv radera för att bekräfta." with the exact-word field (`rd-konto-delete-word`, as `routes/konto.tsx`);
    - "Avbryt", which returns focus to "Radera kontot …";
    - "Radera kontot permanent" (`rd-konto-delete-confirm`), enabled only for exactly "radera". It calls `deleteAccount` once and then stays disabled. It says "Bekräftat. I förhandsvisningen raderas ingenting, och du är kvar här." It never claims a pending deletion.
- **Entry.**
  - Straight in, nothing takes focus and nothing scrolls.
  - The account menu's two new rows each focus and bring their own part to the top: "Inställningar" → "Ditt läsrum", "Konto" → "Konto". The local jump links "Inställningar · Konto" do the same.
  - No door is lit on Konto.
- **Why H:** settings are a reading room with one pool of light. The focused group is the only lit thing, never a wall of luminous switches.

### 14 · ELF-läsfråga (`LjuskaglaDrill.tsx`)

- **One workspace for both texts.** The LÄS drill became a data-driven `ReadingWorkspace` that serves both LÄS (screens 2–3, still kept in step with the switcher) and ELF (`LjuskaglaElf`, its own drill core with `actions.drill`). It is not a fork. It uses:
  - the opaque paper reading column with the paragraph light, J/K and ↑/↓;
  - "ÖVNINGSTEXT" and "Om texten" (`rd-badge`, `rd-note-toggle`, `rd-note`) outside the passage, the note collapsed as before (owner question 1);
  - the quiet question surface or phone sheet (peek / open / full);
  - select, then "Svara B", then the feedback in its calm order.
- **The English island.** `lang="en"` sits on the English content's own elements:
  - the passage article (`rd-elf-passage`, `rd-para-<n>`), with its byline inside;
  - the title (h1), the prompt (h2) and each option's text;
  - the verdict's answer text, and every English explanation text (distractor reasons, pitfall, technique, solution, step texts and English step titles; `LjuskaglaFeedback`'s new `lang`).
  - The Swedish controls, headings, letters and labels stay outside it, including the paragraph-number buttons inside the article, which carry `lang="sv"`.
- **The end.** "Texten är färdigläst", the real "1 av 1 rätt" and the time spent. Then one filled "Till Öva" (`go('ova')`), and quietly "Nästa i dagens plan: {titel}" (the first step not completed).
- **Leaving.** Avsluta goes through the host's controller (`drill.exit`, back to where the drill was started); Escape never leaves.
- **Missing data.**
  - A session without questions shows "Inga frågor att visa just nu.", with Avsluta and "Till Öva", never a receipt.
  - A question without its text or options says so, instead of offering answers.
  - A new session id, or a change in its number of questions, opens the drill fresh.
- **Why H:** warm light on a real English paragraph, with a quiet, separate question surface.

### Carry-overs and Home

- **B1 figure gate (`LjuskaglaQuant.tsx`).** Practice now waits for the figures a question needs, through the same `useFigureGate` the running pass uses.
  - The answer rows (now disabled), the letter keys, Shift+letter, Svara and Enter's lock all wait. Enter still opens a phone sheet.
  - Readiness belongs to the mounted image:
    - a page shared by consecutive questions stays ready;
    - a new page, an image option mounted afresh by a phone sheet, or a retry starts over;
    - an image already complete from the cache counts as ready.
  - A failed page says so and offers "Försök igen"; a failed image option offers "Hämta bilden för {L} igen".
  - The enlarged viewer has its own image, outside the gate.
  - A status line says why the answers wait.
- **B1 private copies.** `LjuskaglaQuant.tsx` now imports `problemParts`, `QuantProblem`, `FigurePage`/`FigurePane`, `FigureViewer` and `useFigureView` from `LjuskaglaParts.tsx`. Its copies are deleted (386 lines removed, 47 added). Behaviour is the same apart from the gate.
- **Home** (`LjuskaglaHome.tsx`):
  - With nothing to resume and every plan step done, the lamp says "Dagens plan är klar." with "Till Öva" (still the one `rd-resume`), and the rows are headed "Gjort idag".
  - A finished step is never a button, so it is never offered as next work, beside a resume too.
- **Removed:** round 1's Uppslag stub (`LjuskaglaDestination`), and the account menu's unsourced "Konto · Gratisplan" claim. The menu now shows the kit's name and e-mail.

## Decisions

- **One root state for what outlives a screen** (`Ljuskagla.tsx`):
  - the paragraph light (`spotlight`, shared by 2, 3, 14 and Konto);
  - how Konto was reached (`visit`: the page it came from, the part asked for, and a counter). The visit survives the host's move to 13 and is forgotten on any other move.
  - The quant and ELF drills are keyed by session id and question count. An empty session renders `NoQuestions` instead of mounting the drill core, which needs at least one question.
- **Konto from the account menu, normal shell only.** In a focus head (practice drills, the running pass) the account keeps only what helps the reading in place: the mode and the reading help. The reason:
  - kit v2 has no action that returns to a drill's place;
  - a running pass ends on any screen change, and spec §13 says opening settings must not reset a pass.
  - Spec §13 asks for Konto from the focus header too. This is a deliberate deviation, listed under Spec gaps.
- **Exclusive choices are labelled groups of pressed buttons, not radio groups.** Each is a `<fieldset>` named by its heading, one `aria-pressed` choice at a time, and the state also shown in words and with a check.
  - Spec §13 asks for radio groups. A radio group owns ←/→, so on the bake-off a focused choice would change a setting instead of the screen. The coordinator's key notes require "3" and → to reach the host from these controls.
  - Production, with no switcher, can use native radios.
- **The palette is omitted:** `meta.ts` declares `omits: { konto: ['palette'] }`. The reasons are spec §13 "Reuse and additions" (palette controls must not recolor H's comparison preview) and owner question 6 ("leave H's comparison palette fixed here"). Konto names the app's palette instead of offering inert choices. Font and density stay as working app preferences.
- **Key scopes:** none were added. No region of 12, 13 or 14 owns keys the host uses. The reading column, the lesson, the directory, the settings, the question sheet and the feedback all leave digits and ←/→ to the switcher. The only key scopes in the direction are batch 1–2's figure pan, viewer, gates, running pass and Framsteg's phone tabs.
- **Focus only where asked.** Nothing moves focus on mount or in a still. Focus moves for a requested lesson that arrives, a click on the open entry, a menu row or a jump link (with the part brought to the top of the page's own scroller, `bringToTop`), and when the deletion opens or is cancelled.
- **Uppslag is a reader with the directory beside it.** Kit v2 always supplies an open lesson, so the screen opens on that lesson with the directory as its contents (spec §12's desktop reader). The picker's lit "Fortsätt läsa" is the open entry lit in the directory.

## Spec gaps (built only what kit v2 carries)

- **§12 Uppslag:**
  - A picker without an open lesson ("Läs KVA" / "Fortsätt läsa KVA", "Till Uppslag"): `UppslagView.open` is never absent, so that state cannot occur. Also missing from the view model: recommendation evidence, section descriptions and reading-position bookmarks.
  - Loading, failed fetch with retry, and "could not restore your place": the kit has no such states.
  - Example questions as individual links: the kit has only their count. Practice is the framework drill.
  - Return to the same entry after practice: no kit action. In the bake-off, a LÄS lesson's practice opens screen 2, whose Avsluta goes to Idag (the round-1 contract); a quant trap's practice opens 6, whose Avsluta returns to Uppslag.
  - `openLesson` in the bake-off only shows screen 12 again. The honest notice covers it.
- **§13 Konto:**
  - Tool destinations Diagnostik, Avancerat and Feedback are not in `konto.links`, so they are not shown. Provpass is already a door.
  - Export pending/success/failure, deletion success with signed-out completion, and persistence failure next to a control: the kit's actions return nothing. The page says only "begärd" or, for deletion, that the preview deletes nothing.
  - Return "to the previous scroll/selection": the bake-off remounts the origin page.
  - Konto from the focus header: deliberately not offered (Decisions).
  - Radio groups: replaced by pressed groups (Decisions).
  - The kit's sample identity (AccountMenu's own sample in `r2Fixtures.ts`) is rendered as supplied. The spec asks for an invented demo identity, but the fixture is the kit's to change.
- **§14 ELF:**
  - The multi-paragraph ELF fixture the spec requires is not in the kit. Only the one-paragraph `ELF_UNIT` exists. The workspace is built for any number of paragraphs (the same one LÄS uses with nine), but the long-English-text layout has not been seen.
  - The cloze state: no cloze unit in the fixtures.
  - A loading state.
  - The kit's `citeParagraphs` (read-only) recognises Swedish ”…” quotations and ordinals. In English explanations it finds years and names only, so the ELF unit cites ¶1 through "1961".
- **B2 exam mode:** the running pass still renders its own passage field. `LjuskaglaProvpass.tsx` is outside this write set; switching the runner to `ReadingWorkspace` is a follow-up. It already shares `PassageParagraphs`, whose numbers now carry `lang="sv"` inside an English text.
- **Theme:** production `ThemeMode` is light or dark only; no System theme was built.

## Proposed UI copy (new in this batch; all Swedish, all proposed)

- **Uppslag:**
  - Head and directory:
    - "Uppslag" / "Ett mönster i taget.", "Delprov", "Innehåll";
    - "{n} av {m} frågetyper|mönster|taktiker|regler|ordrötter lästa", "Inget innehåll här ännu", "Inget innehåll här ännu. Välj ett annat delprov.";
    - entry notes "öppen nu · begärd · läst · inte läst · under inlärning · övas · repeteras · befäst".
  - Lesson head:
    - "{S} · {namn} · frågetyp|mönster|taktik|regel|ordrot";
    - "Läses på ungefär en minut | {n} minuter";
    - "Lektion begärd: {titel}. Den öppna texten ligger kvar tills den nya har laddats." (the coordinator's sentence, with the title).
  - Blocks:
    - "Så tar du dig an frågan", "Vanliga felsvar";
    - "Mönstret", "Känn igen det", "Varför det lurar", "Det lockande felsvaret", "Motdraget";
    - "Ett genomräknat exempel" (with "Uppgiften", "Tankefällan", "Så tänker du rätt", "Svar"), "När mönstret inte gäller";
    - "Taktiken", "När du använder den", "Villkoret", "Regeln";
    - "Ursprung", "Betydelse", "Ord med roten", "Att tänka på".
  - Actions:
    - "Markera som läst", "Läst · ångra", "Markerad som läst.", "Markeringen som läst är borttagen.";
    - "{practice} · {n} exempelfrågor", "Det finns inga exempelfrågor till den här frågetypen|det här mönstret|… än.";
    - the practice words are the app's own: "Öva denna frågetyp", "Öva detta mönster", "Öva denna taktik", "Öva denna regel", "Öva ord med denna rot".
- **Konto:**
  - Head: "Konto och inställningar" / "Ställ in ditt läsrum.", jump links "Inställningar", "Konto".
  - The lamp:
    - "Ditt läsrum", "Läge" (options from the kit), "Styckeljus";
    - "Lyser upp stycket du läser. Gäller bara här i förhandsvisningen och sparas inte.", "Styckeljus på|av";
    - "Mörkt läge.", "Ljust läge.", "Styckeljuset är på|av.";
    - "Tillbaka till Idag|Öva|Repetera|Provpass|resultatet|läsningen|Framsteg".
  - Rows:
    - "Coachens röst" + "Hur förklaringar och påminnelser låter.";
    - "Urval" + "Hur frågorna till en övning väljs.", with "Smart — Frågor nära din nivå" and "Slumpat — Helt slumpade frågor" (from `/mer`'s labels);
    - "Avancerat", "Typsnitt och täthet gäller appens egna sidor. Ljuskägla behåller Manrope, Spectral och sin egen rytm medan riktningarna jämförs.", "Typsnitt", "Täthet";
    - "Palett", "Appens palett är {namn}. Ljuskägla behåller sina egna färger medan riktningarna jämförs; vilken palett appen får sedan avgörs när en riktning är vald.";
    - "Hjälp och villkor".
  - Account:
    - "Inloggad som", "Kontouppgifter saknas. Logga ut och in igen för att visa dem.";
    - "Provet", "{prov} · om {n} dagar";
    - "Logga ut", "Utloggning begärd.";
    - "Din data", "Hämta en kopia av det du har gjort i HP-Coach.", "Exportera din data", "Exporten är begärd.".
  - Deletion:
    - "Förhandsvisning: här raderas ingenting.", "Radera kontot …", "Avbryt";
    - "Bekräftat. I förhandsvisningen raderas ingenting, och du är kvar här.".
  - Taken verbatim from `routes/konto.tsx`: "Plan och betalning", "Lösenord och tvåfaktor" and their lines; the deletion text; "Exportera min data först"; "Skriv radera för att bekräfta."; "Radera kontot permanent".
- **Account menu:** rows "Inställningar — Läge, styckeljus, coach och urval" and "Konto — Namn, e-post, export och radering"; the theme toggle's heading "Läge" (it was "Inställningar").
- **ELF and reading:**
  - "Texten går inte att läsa här.", "Frågan saknar sin text, så den kan inte besvaras.", "Frågan saknar sina svarsalternativ, så den kan inte besvaras.";
  - "Inga frågor att visa just nu.", "Övningen kom utan frågor. Välj en annan övning under Öva.";
  - "Nästa i dagens plan: {titel}";
  - the key hint now follows the question's letters ("A–D välj · …"; LÄS said "A–E").
- **Home:** "Dagens plan", "Dagens plan är klar.", "Allt du planerade för idag är gjort. Vill du öva mer finns alla delprov under Öva.", "Gjort idag".
- **Quant gate (batch 2's runner copy, reused):** "Svaren går att välja när underlaget har laddats.", "En bild som frågan behöver kunde inte visas. Svaren går att välja när den har laddats.", "Hämta bilden för {L} igen".

## Accessibility notes (token reasoning, not a browser audit)

- Text uses batches 1–2's measured pairs only: ink, soft or accent on room, paper or lamp. No colour was added.
- Language boundaries are as described under screen 14. The page root stays `lang="sv"`.
- **Names.** Directory rows and choices have a composed accessible name that starts with the visible label. Blurbs and kickers are their descriptions (`aria-describedby`). Buttons with two text parts have a real space between them.
- **Focus:** only where the reader asked (Decisions). The 2px ring with a 3px offset is unchanged.
- **Status:** polite status regions announce the lesson request, the read mark, mode and light changes, and export, sign-out and deletion. No ticking is announced.
- **Targets.** Every new control inherits the 44px minimum; the Konto links and the word field are 44px tall.
- **Forced colours.** The lesson and the läsrum lamp are outlined. Pressed choices, the open entry and the read mark are outlined in Highlight, and the open entry's beam becomes Highlight.
- **Motion.** No animation was added; `bringToTop` scrolls instantly.

## Verification

- `pnpm -C app typecheck`: exit 0.
- `pnpm -C app lint`: exit 0. It checked 526 files and found the same 4 pre-existing infos, all outside this write set: three `useIndexOf` in `LandingBakeoffR3/R4A/R4C.tsx` and one `noUselessFragments` in `l12/M3.tsx`.
- `pnpm -C app test`: **Test Files 109 passed (109) · Tests 3365 passed (3365)**.
- `Ljuskagla.test.tsx`: **364/364**.
  - **The shared contract** (`describeDirectionContract`) now covers screens 1–14 at both widths, in light and dark, with the palette omission.
  - **Figure gate** (`:703`):
    - an incomplete page holds the rows, the letters, Enter and Svara;
    - a cached page counts as ready;
    - a failed page blocks until a retry loads a fresh image, and a late event from the old image changes nothing;
    - a shared page stays ready and a new page starts over;
    - the viewer's own image never holds answers;
    - phone image options block again each time the sheet mounts them, with the choice kept.
    - Three older DTK tests now load the page before answering (`loadPage`, `:601`).
  - **Idag** (`:2078`): the plan is done; finished steps are never offered.
  - **Uppslag** (`:2130`):
    - the directory order and the lit open entry; the lesson's family content;
    - the honest request notice; a supplied lesson focused in its section; browsing and folding a section;
    - the read mark through the bake-off and no claim with a spied host;
    - practice in the family's words, disabled without examples;
    - trap, tactic, rule and root bodies; an empty section; the phone disclosure; Idag → lesson → practice in the bake-off.
    - The one round-1 test that looked for the stub's "Uppslag" heading (`:374`) now checks the real screen.
  - **Konto** (`:2390`):
    - straight in (no focus, no lit door, back to Idag); both menu rows focusing their own part and returning to Öva;
    - Uppslag → Konto → "Tillbaka till läsningen" through the bake-off;
    - mode through the host, and one paragraph light reaching the ELF drill;
    - one patch per preference, and no palette choice;
    - the exact typed word, preview copy and no second deletion; cancel; export and sign-out;
    - identity, exam, notes and links; missing identity; jump links; phone order.
  - **Account menu** (`:2547`): the identity and no "Gratisplan"; no destinations in a focus head.
  - **ELF** (`:2568`):
    - the English island and the Swedish controls; its own letters; English explanations under Swedish headings;
    - the receipt, "Till Öva" and the quiet plan step; Avsluta via the controller, never Escape;
    - the phone citation fold-back; no questions; no text; a new session opening fresh; a still thumbnail;
    - Öva → ELF → Avsluta → Öva at both widths.
  - **Through the real `Redesign2026Bakeoff`** (`:2737`), with keys fired on the focused element: "3" and → reach the switcher (Spår, or the next screen) from:
    - on 12: the entry focus, a section, an entry, the lesson title, the read mark and the practice action;
    - on 13: the entry focus, a mode, a coach, the paragraph light, export and deletion; typing the word never changes direction;
    - on 14 at both widths: the entry focus, an option, the passage, the verdict, a detail step and Nästa;
    - on screens 2 and 3 at both widths (the shared drill was refactored): the entry focus, an option, the passage, the verdict, a ¶ link and Nästa.
    - That is 73 tests.
- **Red first:** the figure-gate block was written before `LjuskaglaQuant.tsx` changed. Against the untouched file it gave **4 failed | 2 passed**. The two that passed are guards that hold trivially without a gate (the cached page, the viewer).
- **Mutation checks** (each reverted; the source checked by grep afterwards):
  - M1, `data-rd-keyscope` on the ELF reading column and on the Uppslag lesson: 10 host-key tests failed. They are exactly the targets inside those regions: the lesson title, read mark and practice × two keys, and the ELF passage × two keys × two widths.
  - M2, the root forgetting the Konto visit on the move to 13: "through the bake-off, opens Konto from Uppslag and leads back to the reading" failed.
  - M3, the deletion's duplicate guard removed: "asks for the exact typed word … and never twice" failed.
- `git diff --check`: clean.
- **Changes stay inside the write set:** ten modified files and two new ones (`LjuskaglaUppslag.tsx`, `LjuskaglaKonto.tsx`), plus this worklog.
- **No visual self-check.** Batch 1 found that a second sandboxed command cannot reach a Vite started by another (curl exit 7), and the Playwright capture was refused. Lager's batch got `listen EPERM`. This worker runs one native command at a time, with no harnesses. So no screenshots, browser contrast, text-spacing or real-font checks were made.
- **Coordinator: please run the 16-view pass** (desktop and phone × light and dark) for 12, 13 and 14 at `/dev/redesign-2026-bakeoff?dev=1&d=h&s=<n>&w=<w>&t=<t>`. Useful extra states:
  - 12: KVA unfolded; another entry requested (the notice); the phone "Innehåll" open.
  - 13: entered from Öva's account menu "Konto" (scrolled and focused); the deletion opened with the word typed.
  - 14: the phone sheet open, feedback full, and a ¶ citation folded back; the receipt.
  - The account menu on 4 (it gained two rows). Also recheck 2–3, since the reading workspace was extracted, and 7, whose answers now wait for the page.

## Handoff

- **Done:**
  - Screens 12, 13 and 14 built and declared (`meta.screens: [1…14]`, `omits.konto: ['palette']`).
  - The Uppslag stub replaced; the doors, the account menu and the drills wired to the new screens.
  - Both batch-1 carry-overs, and the Home plan-done note.
  - All changes uncommitted, inside the write set.
- **Left:**
  - The screenshot pass and browser accessibility checks.
  - The spec gaps above, notably the multi-paragraph ELF fixture (hpf-qr0p.7) and switching the running pass to `ReadingWorkspace` (needs `LjuskaglaProvpass.tsx` in a write set).
  - The root dotfile placeholders, to delete from outside the sandbox.
- **Next:** review, then the coordinator's visual pass.

LJUSKAGLA3 DONE: hpf-qr0p.32

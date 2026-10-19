---
bead: "hpf-qr0p.24"
project: "hpfetcher"
session: "ci-wisp-xubi3k0"
status: "implemented_uncommitted"
---

# Worklog — hpf-qr0p.24 · Direction F · Samtal, round 2 batch 1

Redesign round 2, epic hpf-qr0p, batch 1 for F · Samtal: screens 5 Öva, 6 Kvantfråga, 7 DTK and 8 Repetera, built on kit v2 (hpf-qr0p.7) from the direction's own B0 spec (`docs/redesign/directions/f-samtal.md`, hpf-qr0p.38), plus the move of screens 1–4 onto kit v2's data context and drill core.

## Snapshot and boundaries

- **Claim.** `gc hook --claim --json` returned `hpf-qr0p.24`, assignee `ci-wisp-xubi3k0`, route `hpfetcher/gc.implementation-worker`. `bd show hpf-qr0p.24 --json` matched the id, the status (`in_progress`), the assignee (`gc.session_id`) and `gc.routed_to`.
- **Checkout.** Branch `codex/hpf-qr0p.24-redesign-round-2-direction-f-samtal-batch-1-va-kvantfr-ga-dt` at `5953117d` (= `gc.worktree_base_sha`, kit v2 and the B0 spec merged), clean at the start.
- **Write set kept.** Only admitted paths changed: nine files in `app/src/components/devbake/redesign/f-samtal/` were modified, three are new (`SamtalOva.tsx`, `SamtalQuant.tsx`, `SamtalRepetera.tsx`), plus this worklog. `SamtalParts.tsx` was touched, `Samtal.test.tsx` rewritten.
  - No shared kit file was edited: `viewModel.ts`, `directionData.tsx`, `drillCore.ts`, `contract.ts`, `r1Kit.ts`, `r1Fixtures.ts`, `r2Fixtures.ts`, `directions.ts`, the page and its tests are untouched.
  - Nothing on `:root`. The spec was not edited.
- **Untracked, not mine.** The root dotfiles (`.bash_profile` … `.zshrc`, `.idea`, `.vscode`, `.mcp.json`, `.gitmodules`) are the sandbox's mount placeholders, as in round 1. `app/.claude/` (an empty `.cc-writes` folder) appeared when the shell's working directory moved into `app/`. It is the tool harness's write log, write-protected for this session, and not part of the change.
- **Delivery rules.** Uncommitted, no dependency changes, offline. Aegis ignored (frozen). The bead is parked, not closed.
- **Check script.** `gc.check_path` names `…/checks/build-artifact-valid.sh`. The bead names no validator, so none was run.

## Deliverables (uncommitted)

| Path | What |
|---|---|
| `f-samtal/Samtal.tsx` | The root routes 1–8: the frame for 1, 4, 5 and 8, the reading drill for 2–3, and the quant drill for 6–7 (keyed by screen, so each sitting opens fresh). |
| `f-samtal/SamtalNav.tsx` | The frame. The page follows the screen: Repetera lives inside Öva, so the Öva door stays current on it. Doors ask `actions.go`. The fold survives moves between doors. The previews come from `data.home`. The round-1 stub page is gone (see "Navigation"). |
| `f-samtal/SamtalHome.tsx` | Idag on `data.home`, with every no-real-source field optional. Without a paused sitting, the coach offers the plan instead. |
| `f-samtal/SamtalDrill.tsx` | Läsfråga/Facit on `useDrillCore` (round 1's switcher steps kept). It also holds the drill pieces the quant screens share: `Conversation`, `Options`, `Dock`, `TrayDrill` (the phone reply tray), `ExitButton`, `StripProgress` and `useFolds`. |
| `f-samtal/SamtalFeedback.tsx` | Facit for any question shape: math everywhere, image options, a missing explanation, the section-fit "Vad lockade dig?" replies, and the generic closing turn. |
| `f-samtal/SamtalOva.tsx` | New: screen 5. |
| `f-samtal/SamtalQuant.tsx` | New: screens 6 and 7. Includes the DTK `FigureDocument`, pan region and `FigureInspector`. |
| `f-samtal/SamtalRepetera.tsx` | New: screen 8. |
| `f-samtal/SamtalParts.tsx` | `Rich` renders math; `Cites`/`Rich` are typed on the drill core; `words`, `count` and `cx` were added. |
| `f-samtal/samtal.css` | Round 2's sections (shared, Öva, Repetera, Kvantfråga, DTK and its enlarged view, phone quant), all under `[data-rd='samtal']` with `sa-` classes and Samtal's own tokens. One new token pair is `--sa-paper`/`--sa-paper-ink`: figures sit on paper in both themes. |
| `f-samtal/meta.ts` | `screens: [1…8]`; a sixth trait for the new screens (proposed copy). |
| `f-samtal/Samtal.test.tsx` | `describeDirectionContract(meta, Samtal)` replaces the hand-copied contract, plus Samtal's own tests (183 in all, see Verification). |

## What was built, per screen, and why it is Samtal

The language is the round-1 one, unchanged:
- **The coach's turns** are oat, left, with a speaker corner top left.
- **Your turns and replies** are plum, right; solid plum is kept for the one action.
- **Attachments and cards** are white documents inside or under the conversation.
- **The coach's notes** are untinted, under a hairline.
- **Dated dividers** open a conversation.
- No text field, avatars or typing dots anywhere.

### 5 · Öva — what to practise next, as a short exchange

- **One coach turn, one useful sentence, one reason** (spec §5). The coach says one of three things:
  - the practice left half-done: "Du har LÄS på gång, fråga 3 av 4." / "Fortsätta där du var?", then in a second turn "Annars föreslår jag XYZ – där behöver du mest övning just nu.";
  - without a resume, the suggestion: "XYZ är mitt förslag idag – där behöver du mest övning just nu." / "Ska vi öva XYZ?";
  - with neither: "Välj något att börja med." (spec copy).
- **At most two replies.** The one action is Fortsätt övningen (`actions.resume`), Öva XYZ or Börja blandat, in the spec's order of preference. The next best stands beside it. Enter takes the action.
- **The practice as one message card** ("Öva ett delprov"):
  - The eight sections are reply-shaped doors: your speaker corner top right, a part-plum line and the code in plum. They sit in their two stable groups (Verbal del, Kvantitativ del), four across on desktop and two on the phone. Each door shows its level ("nivå 1,6") and its waiting misses ("3 väntar") as two whole phrases.
  - The full section name opens each door's accessible name ("Matematisk problemlösning, XYZ …").
  - The suggestion is tagged "Förslag" (Idag's "Härnäst" pill) and gets a whole plum line. It is never moved or tinted, since a tint means "chosen".
  - A door starts its drill directly (`startDrill({kind:'section'})`).
  - The mixed drill carries `rd-ova-mixed` wherever it stands: a reply when it is among the two, otherwise a wide door "Blandat · 10 frågor från alla delprov". There is always exactly one.
- **Repetera is a card of its own that stays at zero:**
  - with misses ready: "8 missar är redo nu." and "Visa de 8 som är redo →";
  - with nothing ready: "Inget redo just nu." and "Visa dagens hög";
  - with an empty pile: "Inga missar att repetera." and "Öppna Repetera".
  - The entry calls `openRepetera` (the contract's id; see "Spec gaps" on the spec's direct start).
- **"Fällor som återkommer"** is said as one coach line (as Idag says the recent passes). Each trap is a small reply that starts practice on it (`startDrill({kind:'framework'})`).
- **Why Samtal.** The coach proposes once, with a reason, and you answer with replies. The sections are replies you can give, not a catalogue of tiles: one card and no dashboard grid of equal cards.

### 6 · Kvantfråga — the problem as an attachment in the coach's turn

- **Desktop.** Focus mode keeps the strip: Avsluta, the dots and "XYZ · Fråga 1 av 3". There is no clock, because the sitting supplies no time (see "Spec gaps").
  - There is no passage, so there is no document pane to leave empty. The conversation stands in one centred 680 px column (spec §6).
  - The coach's turn says the question's place ("Fråga 2 · KVA") and carries the problem (`rd-quant-prompt`). Each shape stays whole:
    - **XYZ:** the whole stem as the turn's question, math set by KaTeX through `MathText`.
    - **KVA:** "Jämför kvantiteterna." (spec copy), then an opaque attachment. It holds "Villkor y > 0" over a hairline, then Kvantitet I and II side by side with a hairline between them, so the comparison is the attachment's shape. A prose condition (`isProseCondition`) reads as a setup line. The split uses the app's `splitKvaPrompt`. An unsplit prompt falls back to its full text.
    - **NOG:** the question as the turn's question, then an attachment with (1) and (2) as numbered lines and the coda "Tillräcklig information för lösningen erhålls" closing it. The split uses `parseNogPrompt`, with the same fallback.
    - **A quant diagram (SVG):** an image on a paper plate inside the attachment. If it fails, it says so in place and leaves the question open, as the app's figure does.
  - The options are replies in your lane with the strike inside each card, the math rendered. Only the letters the question has appear: A–D, NOG's A–E. Image options show their figure with the option text as its name.
  - **Select, then send.** Choosing grades nothing (`controller.pick` only). Svara in the flat action bar is disabled until a choice and is the one action. The bar's key hint is built from the question's own letters ("A–E väljer" on NOG).
  - **Feedback is round 1's Facit:** your answer as your turn, the ringed verdict and the right answer, then "Vad lockade dig med A?" with replies that fit the question ("Jag räknade fel", "Jag tolkade frågan fel", "Jag chansade"; "Hoppa över"). Then the why-pair and the notes, the math rendered in every part.
  - "Nästa fråga", then "Slutför övningen" (spec copy) on the last question.
  - **The set ends with the closing turn,** anchored low: "Övningen är klar", "Klart. 3 frågor, 3 rätt.", the ✓/✕ tally, the plan's next part ("Ja, repetition · 9 min") and "Till Öva".
- **Phone.** One continuous scroll: no tray hides the condition (spec §6). The head shows Avsluta and "KVA · Fråga 2 av 3" over a progress line. The action bar sticks under the options; KVA's quantities stack.
- **Keys.** a–e answer only the letters present, ⇧ + letter strikes, Enter sends and moves on, Space moves on once answered. Esc never leaves; digits are left to the switcher.
- **Why Samtal.** The attachment/turn/reply sequence makes it Samtal even without a passage. The problem is something the coach hands you, and your answers are replies.

### 7 · DTK — the page as the document beside a short exchange

- **Desktop.** The page is the drill's document (`rd-figure`), about three fifths of the width, opaque and on paper in both themes, so the printed colours stay intact.
  - Its head reads "DTK Underlag" and holds the tools: Zooma ut, a "100 %" readout, Zooma in, Rotera and "Förstora figur".
  - The page pans by drag, by arrow keys or by scrolling, and +/− zoom when the region has focus. The region claims the arrows, so the switcher's ←/→ leave them alone.
  - The fixture page (*Pensioner*) is printed sideways. Rotera turns it upright, and at 150 % it reads beside the question.
  - Zoom, rotation and pan are kept per page. Questions on the same page find it as the last one left it, and are told "Fråga 2 av 4 till samma underlag".
- **Förstora figur** opens the page over the whole drill. It is an opaque dialog inside the direction's root, not a body portal, so it keeps Samtal's theme scope.
  - It opens with the whole page on screen and has the same tools plus "Hela sidan". The one filled action is "Stäng figur".
  - The drill under it is inert and Tab stays inside. Esc or Stäng figur closes it, and focus returns to the opener. The question's keys rest while it is open.
- **Phone.** The page comes first, full width in the page's scroll, under the head "DTK Underlag · Rotera · Förstora figur" (the enlarged view is the phone's zoom).
  - The question sits in round 1's reply tray: the whole prompt and "Välj ett svar" at the peek, the options when open, Facit when full. "Visa figuren" folds it.
- **States.**
  - A DTK question without a figure says "Underlaget saknas för den här frågan." and cannot be sent.
  - A page that fails to load says "Underlaget gick inte att ladda." with a real retry (the image reloads) and blocks the answer.
  - While loading, the page keeps its box and shows "Hämtar underlaget …".
  - A question without options cannot be sent and says why.
- **Why Samtal.** The steady document beside a short exchange is the same composition as Läsfråga. The page is a document the coach points to, not a chart dashboard.

### 8 · Repetera — one bounded round

- **The coach's turn.**
  - The hello names the page ("**Repetera** · 23 i dagens hög").
  - The headline is the round: "8 frågor är redo nu. Tar vi dem?". With more ready than a round holds: "… Vi tar 10 i taget." The round is the actual batch, up to `sessionSize`.
  - The attachment shows what is ready by section in exam order (LÄS 1 · ELF 1 · XYZ 2 · KVA 2 · NOG 1 · DTK 1), and "15 frågor till blir redo senare idag." ("De äldsta först." when the round is cut).
- **Two replies.**
  - "Välj sektion" becomes your turn, and the coach answers "Vilken av dem?" with chips "Bara XYZ · 2" … (`startDrill({kind:'repetition', section})`).
  - The one action is "Repetera 8" (`rd-repetera-start`, `startDrill({kind:'repetition'})`). Enter takes it.
- **The queue as one card.** "Redo nu" lists the ready ones first, each with its section, its question (math rendered), "Ramverk: …", its misses this week and "nu" (`rd-repetera-item-<n>`).
  - "Senare idag 15" folds the rest of today's pile, so the screen leads with one finite round.
  - "Tillbaka till Öva" sits under the card.
- **Empty states.** "Inget är redo just nu." or "Inga missar att repetera.", a short reason, and "Till Öva" as the one action — no dead start button.
- **Why Samtal.** A finite count asked as a question, the breakdown as an attachment, the section choice as an exchange, and the queue as a document, not as twenty bubbles.

## Screens 1–4 on kit v2

- **Idag** reads `data.home`, the copy from `data.copy`, framework names from `data.frameworks`. With the fixtures it renders exactly as round 1: the shots of 1, 3 and 4 match round 1's description in every element.
- **No-real-source fields render gracefully when absent** (kit-v2 §7, tested):
  - **Paused sitting:** without a pause time, device or minutes left, those parts of the "Pausad …" line and "ca … min kvar" are left out. Without a sitting at all, the coach offers the plan (see "Proposed copy").
  - **Prognosis:** without a range, the scale shows just the tick, labelled "Nivå 1,4 på skalan 0 till 2,0". Without a target, the scale is HP's 0–2,0, as it always was. Without a delta, "sedan förra veckan" is left out.
  - **Week:** without a goal, "fyra dagar den här veckan".
  - **Plan:** without a lead marker, no "Härnäst"; the first undone item leads.
  - **Traps:** a trap without `rising` gets no arrow.
- **Läsfråga/Facit** run on `useDrillCore` with `data.drills.reading` and `actions.drill`. A local `useReadingDrill` keeps round 1's switcher steps exactly, as `useDrill` did: screen 3 opens graded with the fixture's wrong pick, an answer goes to 3, Nästa to 2 and Avsluta to 1. The controller hears every move. The look is unchanged.
- **Generalised for real data, without changing the fixture's look:**
  - the ÖVNINGSTEXT badge and "Om texten" appear only on a practice text (`passage.synthetic`);
  - an authentic passage is titled with its source label;
  - the section tag comes from the question;
  - the key hint comes from the question's letters;
  - the clock shows only when the sitting supplies a time;
  - `lang="en"` goes on an English passage.

## Navigation

- **Doors.** Every door asks `actions.go(dest)`. In the bake-off the switcher moves to Öva 5, Provpass 9, Uppslag 12 or Framsteg 11, so the URL and the side-by-side follow the page. Doors Samtal has not built yet show the kit's shared "Inte byggd än i Samtal." card, which links back to the built screens.
  - This replaces round 1's local stub page for Provpass, Uppslag and Framsteg.
  - Idag's look is unchanged; only what an unbuilt door opens is now the shared card. The page's heading takes focus after a door the reader chose.
- **The fold** survives a move between doors. Only Navigering (4) folds the list and opens the account, and the way back to Idag (1) unfolds it, as before.
- **Plan rows, "Börja med …" and the unit's end ("Ja, repetition")** ask `openPlanItem(id)`. The repetition now opens Samtal's own Repetera (8) instead of round 1's Öva stub. "Till Idag" asks `go('idag')`.
- **Avsluta.**
  - **Quant and DTK:** `controller.exit` returns where the drill was started from (Öva or Repetera).
  - **Reading drill:** round 1's `onScreen(1)` first, which the shared contract checks, then `controller.exit`. In the bake-off a reading drill started from Öva therefore returns to Öva, from Idag to Idag. The route's `replace: true` search merge settles on the last request.
- **Verified end to end** in a test through the real bake-off page (Idag → Öva → KVA → Avsluta → Öva → Repetera → round → Avsluta → Repetera → Provpass card, plus LÄS from Öva and back) and in the browser.

## Spec gaps

Built only what kit v2 carries. Each gap is listed with its spec section; the screens render without the missing data.

1. **§"State truth", §5–§8 States: loading, failed, partial and stale states.** The view model has no loading, error or staleness flags, so there are no skeletons, no "Kunde inte hämta just nu." and no "unknown, never zero" counts. What is representable is built:
   - an empty pile, nothing ready, no suggestion, no resume;
   - a missing explanation, a question without options;
   - a missing or failed DTK page, a failed diagram.
2. **§5 the recommendation's reason.** The view model has `weakest` (`rankWeakness`: level, trend and time since practice) but no reason text. The coach's reason, "där behöver du mest övning just nu", is proposed copy that says what the ranking measures.
3. **§5 Navigation, "Repetition entry → active 8 when ready".** The contract requires `rd-ova-repetera` to call `openRepetera`, so Öva's entry opens the overview, worded "Visa de 8 som är redo". "Repetera 8" there starts the round. The contract wins over the spec's direct start.
4. **§5 Done** ("a return from practice updates the queue and offers the next activity"). There is no session result in the view model.
5. **§6 Data, "elapsed time if available".** The clock shows only when `elapsedSeconds` is supplied. The fixture's quant and DTK sittings have none, so they show no clock.
6. **§6 Navigation, "honest save status" and §6 States, "saving and save failure".** There is no save state in the view model, so no "sparat" claim is made in round 2 copy. Avsluta's round-1 tooltip "Dina svar är sparade" (shared ExitButton) predates the spec's rule. It was left as it was for screens 2–3 and flags a decision for the owner.
7. **§6 "Feedback may open 12 for a real framework link".** The framework stays a system line, as in round 1, not a link.
8. **§6 Answer contract: `host-ver2-2019-kvant1-XYZ-002` (five options) and image options.** Both are handled generically: options render whatever the question supplies, and image options show their figure. There is no fixture coverage.
9. **§7 Data, "any supplied caption/description".** Only the figure's generic alt ("Underlag till uppgift 29") exists. There is no caption or text alternative; the spec's owner question 3 is still open.
10. **§7 Done, "when the block ends, announce the new underlay once".** Not built. The run within a page is derived ("Fråga 2 av 4 till samma underlag"); the fixture's DTK sitting has one question, so it shows in the tests only.
11. **§7 Navigation, "timed use inherits 9's no-feedback behaviour".** Screen 9 is batch 2.
12. **§8 Data, the distinction between "never had misses", "nothing due", "all due resolved" and "could not load", and saved plans or resolution status.** Only an empty pile and nothing due are representable.
13. **§8 Navigation, `/repetition?done=…` report links.** Not in the view model. A section-scoped start is built.
14. **§8 the active round "reuses 6/7/14 or the LÄS composition according to the question".** In the bake-off, the kit maps `startDrill({kind:'repetition'})` to screen 6, which plays the quant fixture sitting, not the pile's questions. The closing says "Klart för den här omgången." only when the sitting's request is a repetition; the fixture quant sitting is `mixed`.
15. **§"Layout" intermediate widths** ("collapse the rail and then stack"). Only the bake-off's `data-width` switch is honoured, as in round 1.
16. **§9 Phone running** and the rest of batch 2 and 3. Out of scope. B3's change of the menu hint "Provdatum och mål" (§13) is left for B3, so screen 4 stays as it was.
17. **B1 inventory names (§"Batch inventory").** Built as:
   - `PracticeDoor` (PracticeDoors);
   - the Repetera card on Öva and `SamtalRepetera` (RepetitionSummary, RepetitionOverview);
   - `Conversation`, `QuantTurn` and `Problem` (QuestionConversation, QuantAttachment);
   - `FigureDocument`, `FigurePage`, `FigurePan` and `FigureInspector` (FigureDocument).

## Proposed copy (new UI strings)

All new UI copy is **proposed**. Spec copy is marked (spec). Source wording (prompts, options, explanations, section labels "Kvantitet I/II", the NOG coda) is unchanged.

- **Öva:**
  - the lead: "Du har {S} på gång, fråga N av M." · "Fortsätta där du var?" · "{S} är mitt förslag idag – där behöver du mest övning just nu." · "Ska vi öva {S}?" · "Annars föreslår jag {S} – där behöver du mest övning just nu." · "Välj något att börja med." (spec);
  - the replies: "Fortsätt övningen" (spec) · "Öva {S}" (spec) · "Börja blandat" (spec);
  - the doors: "Allt du kan öva" · "Öva ett delprov" · "Nivå av 2,0 · missar som väntar" · "Verbal del" · "Kvantitativ del" · "nivå 1,6" · "3 väntar" · "inte övat än" · "Förslag" · "Blandat" · "10 frågor från alla delprov";
  - Repetera and the traps: "N i dagens hög" / "Högen är tom" · "8 missar är redo nu." · "Inget redo just nu." (spec) · "Inga missar att repetera." · "Visa de 8 som är redo" / "Visa dagens hög" / "Öppna Repetera" · "Fällor som återkommer" · "N gånger" · (screen reader) "Öva på fällan".
- **Repetera:**
  - the lead: "Repetera · 23 i dagens hög" · "8 frågor är redo nu. Tar vi dem?" (spec, with the actual count) · "En fråga är redo nu. Tar vi den?" · "N frågor är redo nu. Vi tar 10 i taget." · "De äldsta först." · "N frågor till blir redo senare idag." · "Inget mer väntar idag.";
  - the empty states: "Inget är redo just nu." · "Inga missar att repetera." · "Missarna i högen blir redo senare idag, var och en när det är dags." · "Missar du en fråga lägger jag den här, så tar vi den igen när det är dags.";
  - the replies: "Välj sektion" (spec) · "Vilken av dem?" · "Bara {S} · N" · "Repetera N" (spec) · "Till Öva" (spec);
  - the queue: "Kön" · "Redo nu" · "Senare idag" · "Ramverk: …" · "N fel den senaste veckan" · "Frågan visas när du repeterar" · "En lucka i texten" · "Tillbaka till Öva".
- **Kvantfråga and DTK:**
  - the question: "Fråga N · {S}" · "{S} · Fråga N av M" · "Jämför kvantiteterna." (spec) · "Villkor" (spec) · (screen reader) "Påstående 1:", "Påstående 2:";
  - blocked or missing: "Frågetexten saknas." · "Underlaget saknas för den här frågan." · "Figuren gick inte att ladda." · "Frågan saknar svarsalternativ och kan inte besvaras här." · "Underlaget saknas, så frågan kan inte besvaras." · "Underlaget gick inte att ladda, så frågan kan inte besvaras.";
  - the answer: "Slutför övningen" (spec) · "Jag räknade fel" · "Jag tolkade frågan fel" · "Jag läste fel i underlaget" · "Jag chansade" (round 1) · "Förklaringen till den här frågan är inte klar än.";
  - the end: "Övningen är klar" · "Omgången är klar" · "Klart för den här omgången." (spec);
  - the page: "DTK Underlag" · "Zooma ut", "Zooma in" (names) · "Rotera" / "Rotera underlaget 90 grader" · "Förstora figur" (spec) · "Stäng figur" (spec) · "Hela sidan" (the app's own figure viewer) · "Fråga N av M till samma underlag" · "Underlaget gick inte att ladda." · "Försök igen" (spec) · "Hämtar underlaget …" · "Visa figuren" (spec);
  - accessible names: "Underlaget. Piltangenterna flyttar, plus och minus zoomar." · "Förstorat underlag" · "Underlagets verktyg" · "Förstoring och rotering".
- **Idag** (only when the data lacks a field): "Idag väntar tre saker, ungefär 19 minuter. Ska vi börja?" · "Dagens plan är klar. Vill du öva mer?" · "Vad vill du öva idag?" · "Börja med {del}" · "Prognosen visas när du har svarat i båda delarna." · "Pausad för mer än en vecka sedan" · "Fortsätt med övningen".
- **Door previews** (only when the data lacks a field): "Dagens plan, N min" · "Alla delprov och Repetera" · "Prognos och historik".
- **`meta.ts`:** the sixth trait.

## Verification

### Tests, types and lint (from `app/`, on the final tree)

- `pnpm typecheck` (`tsc -b --noEmit`): clean.
- `pnpm lint` (`biome check src`): **0 errors, 0 warnings**; 479 files checked. The 4 infos are pre-existing and outside this folder (round 1 recorded them in `LandingBakeoffR3/R4A/R4C.tsx` and `l12/M3.tsx`).
- `pnpm exec vitest run src/components/devbake/redesign/f-samtal`: **183 passed (183)**.
  - **The shared contract** (`describeDirectionContract`) on screens 1–8 at both widths:
    - every screen in both themes with its root;
    - round 1's A–D loop;
    - Öva's sections, Repetera and mixed;
    - Kvantfråga's rendered math, KVA's fixed options, NOG's five and the controller's grading;
    - DTK's figure, named by its alt;
    - Repetera's due items and one start.
  - **Samtal's own** (both widths unless noted):
    - **Render:** every screen 1–8 × theme, live and as a still, with no console errors.
    - **Round 1:** Idag's question and Enter; the plan as a reply; the door → `go` and plan row → `openPlanItem`; Läsfråga's turn and options; the keys; Avsluta → `onScreen(1)` and `drill.exit`; Facit's order, the coach's question (reply and skip), "Visa allt" and the ¶ flash; the unit's end → `openPlanItem('rep')` and "Till Idag" → `go('idag')`; the folded rail and the previews; the phone tray (round 1's review tests R1/R2, unchanged).
    - **Öva:** the resume lead, the suggestion and its tag; the no-resume lead; the no-suggestion lead; the doors' order, names, levels and counts; Repetera at zero; traps → framework drill; Enter.
    - **Kvantfråga:** KVA's Villkor/I/II and NOG's statements and coda; math in the prompt, options, your answer, the verdict and the notes, with no marker anywhere; select-then-send; letter keys bound to the question's letters only; reversible strike; the closing; the clock only with a time; no explanation; no options.
    - **DTK:** Förstora figur (dialog, inert drill, keys resting, Esc, focus return); a failed page blocks and retries. Desktop only: zoom and turn; two questions on one page keep zoom and turn. Phone: the page first and the tray.
    - **Repetera:** ready first, the rest folded; "Välj sektion"; ten at a time; nothing ready or nothing at all; Öva's door current.
    - **Optional fields:** Idag without the no-source fields; Idag without a resume; screens 5–8 without them.
    - **In the real bake-off page:** door → Öva → section → Avsluta → Öva → Repetera → round → Avsluta → Repetera → Provpass card; LÄS from Öva → Avsluta → Öva.
- `pnpm test` (`vitest run`, all of `app/`): **105 files, 1643 tests: 1641 passed, 2 failed**. Both failures are in the shared `Redesign2026Bakeoff.test.tsx` (outside the write set), which hard-codes round-2 screens as unbuilt. They fail because Samtal now builds screens 7 and 8, as the brief requires:
  1. `:155` "says in the "Om" panel which directions have built the screen". At `s: 7` it expects "Ingen riktning har byggt den här skärmen än."; it now reads "Byggd i Samtal.".
  2. `:319` "takes a step from "Inte byggd än" to a screen the direction has built". It renders `d: 'f', s: 8` and expects the "Inte byggd än" card; Samtal now builds 8.
  - **Suggested fix for the kit owner:** pick the screen dynamically instead of a literal, e.g. `APP_SCREENS.find((x) => !builds(DIRECTIONS[5], x.key))` for `:319`, and a screen no direction builds (or the "Byggd i Samtal." text) for `:161–165`. Every batch-1 lane that builds 7 or 8 will hit the same two lines.
  - Without those two, every test in the app passes.

### Browser self-check (Vite + Playwright on 127.0.0.1)

The sandbox ran it. The harness is in the scratchpad, outside the repo:
- `harness/shoot.mjs` and `main.tsx`; a `node_modules` symlink to `app/node_modules`.
- Vite's `createServer` serves only the bake-off page, with the app's `@` alias, its `public/` (the DTK pages) and the KaTeX stylesheet. HMR and file watching are off.
- Playwright Chromium (`@playwright/test` 1.59) shoots desktop 1440×900 and phone 390×844 with reduced motion and Google Fonts aborted, so **every shot shows fallback faces**: a DejaVu-style sans for Hanken Grotesk and a serif for Lora.

Each page is probed for:
- root and document overflow;
- text outside the viewport;
- clipped text;
- leaked math markers;
- hit areas under 44 px (`elementFromPoint` 21 px out);
- axe-core WCAG 2.0/2.1/2.2 A+AA, scoped to the direction;
- console errors.

| Pass | Result |
|---|---|
| `shots-v2`: 32 screens (1–8 × 2 widths × 2 themes) + 43 interaction shots | No overflow, text outside, clipping, leaked math or console errors; **0 axe violations**. Interactions: Öva scrolled, quant feedback (+ Visa allt), KVA, KVA chosen + struck, NOG, the closing, DTK open/feedback/enlarged/zoomed + turned, Repetera "Välj sektion" and folded rest, Idag scrolled. Two enlarged-zoom shots failed in the harness: its step clicked the drill's inert zoom, not the dialog's; fixed and re-shot. |
| Hit areas under 44 px | Only round 1's documented exemptions: the ¶ margin numbers (out of the tab order), the ¶ cite chips and "Berätta mer"/"Dölj igen" (padded hit areas), and the phone tray's grab. That includes DTK's tray grab, whose labelled replies cover it. |
| Fixed from the shots | The Öva door's second line wrapped mid-phrase ("3 / väntar"): it is now two whole phrases, level left and misses right. The queue's "·" could start a line: it is now two phrases that wrap whole. |
| `shots-v3`: 24 re-shot after the fixes (Öva, Repetera, the enlarged page, Öva scrolled) | All clean. |
| Enhanced contrast (axe `color-contrast-enhanced`, 7:1) on 18 desktop shots of 5–8 and their states, both themes | **No body text under 7:1.** What is under 7:1 is UI text at AA or better, round-1 classes and values: door previews 5.84, turn labels 5.77/5.94, dividers 6.25, card meta 6.41–6.67, "Rätt svar" 6.99, the primary label in dark 5.85 (round 1: "5.9 dark"). |
| Screens 1–4 (regression) | Idag, Facit and Navigering match round 1's worklog element for element. Screen 2's shot is unchanged in layout. |

**Not run here, left to the coordinator's 16-view pass:**
- the focus-walk screenshots;
- WCAG 1.4.12 text-spacing overrides and 200 % zoom;
- intermediate widths;
- screen-reader output (math is HTML plus a flat label from `MathText`, not MathML);
- real fonts.

The `aria-busy` and live regions were not checked with a reader.

## Notes for the coordinator and the owner

- **The two shared-test failures** above need the kit owner's one-line fixes. They are not defects in Samtal.
- **The DTK fixture page is printed sideways.** The page opens as printed (0°), and Rotera turns it upright; nothing in the data says which way a page reads.
- **Round-1 copy that meets round 2's rules:**
  - Avsluta's tooltip "Dina svar är sparade" claims a save the bake-off cannot confirm (spec §"State truth"). It was left for screens 2–3; an owner call.
  - The Facit's "lägger jag i nästa repetition" is round 1's approved line, kept.
- **Kept as decided before:** the menu's "System" chip is round 1's demo (production is light/dark only), unchanged on screen 4; B3 owns it (spec §13, owner question 1). New screens theme only through the stage.
- **No bake-off route was deleted.** Real routes, stores and other directions were not touched.

## Beads hand-off

- One note on the bead, ending `SAMTAL1 DONE: hpf-qr0p.24`. Then the bead is parked: status deferred, no assignee. It is not closed and no metadata is set, as the delivery rules ask.

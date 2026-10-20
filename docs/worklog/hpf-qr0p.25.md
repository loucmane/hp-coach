---
bead: "hpf-qr0p.25"
project: "hpfetcher"
session: "ci-wisp-3gndzk2"
status: "implemented_uncommitted"
---

# Worklog — hpf-qr0p.25 · Direction F · Samtal, round 2 batch 2

Redesign round 2, epic hpf-qr0p, batch 2 for F · Samtal: screens 9 Provpass (the hub and a running pass), 10 Provpassresultat and 11 Framsteg with Historik. Built on kit v2 (hpf-qr0p.7) from the direction's merged B0 spec (`docs/redesign/directions/f-samtal.md` §9–§11) on top of batch 1 (hpf-qr0p.24, PR 424).

## Snapshot and boundaries

- **Claim.** `gc hook --claim --json` returned `hpf-qr0p.25`, assignee `ci-wisp-3gndzk2`, route `hpfetcher/gc.implementation-worker`. `bd show hpf-qr0p.25 --json` matched the id, the status (`in_progress`), the assignee (`gc.session_id`) and `gc.routed_to`.
- **Checkout.** Branch `codex/hpf-qr0p.25-redesign-round-2-direction-f-samtal-batch-2-provpass-provpas` at `649bea0` (= `gc.worktree_base_sha`: kit v2, the B0 spec and Samtal batch 1 merged), clean at the start. The local `origin/main` was 9 commits ahead (Instrument batch 2, PR 425); those commits touch only `b-instrument/` and its worklog, so nothing shared moved. Not merged in: the brief fixes the starting state, and the coordinator merges.
- **Write set kept.** Eight files modified and two new, all admitted, plus this worklog:
  - new: `f-samtal/SamtalProvpass.tsx`, `f-samtal/SamtalFramsteg.tsx`;
  - modified: `Samtal.tsx`, `SamtalNav.tsx`, `SamtalParts.tsx`, `SamtalHome.tsx`, `SamtalFeedback.tsx`, `meta.ts`, `samtal.css`, `Samtal.test.tsx`;
  - untouched admitted file: `SamtalDrill.tsx`.
  - No shared kit file and no spec was edited. `SamtalQuant.tsx`, `SamtalOva.tsx` and `SamtalRepetera.tsx` are outside the write set and unchanged (only imported). Nothing on `:root`.
- **Untracked, not mine.** The root dotfiles (`.bash_profile` … `.zshrc`, `.idea`, `.vscode`, `.mcp.json`, `.gitmodules`) and, once the shell's working directory moved into `app/`, `app/.claude/` and `app/.mcp.json`: the sandbox's mount placeholders (character devices bound to `/dev/null`) and the harness's write log. Not part of the change; left alone.
- **Delivery rules.** Uncommitted, no dependency changes, offline. Aegis ignored (frozen). The bead is parked, not closed.
- **Check script.** `gc.check_path` names `…/checks/build-artifact-valid.sh`; the bead names no validator, so none was run.

## Deliverables (uncommitted)

| Path (under `app/src/components/devbake/redesign/f-samtal/`) | What |
|---|---|
| `SamtalProvpass.tsx` (new) | Screen 9's hub (`SamtalProvpassHub`) and its gate (`PassConfirm`); the running pass (`SamtalPass` → `PassRunner`: strip, turn, options, dock, `AnswerOverview`, `ReviewGate`, `AbortGate`, `HandingIn`, `PassPassage`, `PassPage`); screen 10 (`SamtalResult`: `ResultScore`, `ResultSections`, `ResultHistory`). |
| `SamtalFramsteg.tsx` (new) | Screen 11: tabs `Översikt` / `Historik` (`ViewTabs`), `Overview` (observation, `ScoreCard`, `WeeklyTrend`, `SectionLedger`, `WeekRhythm` + `Heat`), `History`. |
| `Samtal.tsx` | Routes 9–11. Holds the started pass (`run`): screen 9 shows the running pass in place of the frame until it is handed in or given up; any other screen ends the run. Provides `SamtalRoot` (the root element gates stand in). |
| `SamtalNav.tsx` | The frame's pages `provpass`, `resultat` (Provpass door current, as Repetera keeps Öva's), `framsteg`; the Provpass door's preview from the rhythm; Framsteg's view state (door → overview, Idag's history link → Historik); the frame goes inert under a hub gate. |
| `SamtalParts.tsx` | New shared parts: `Gate`, `SamtalRoot`, `useFigureLoadState`, `FigurePage`/`FigurePan`/`FigureInspector`, `ScoreCard`/`Scale` (moved from Home, ids now `useId`, optional target marker), `fmtScore2`, `fmtDuration`; `FigureImg` gains an opt-in `fresh` (each mount is a load of its own). |
| `SamtalHome.tsx` | Uses the shared `ScoreCard` (look unchanged); "Alla pass i Framsteg" opens Historik (`onHistory`). |
| `SamtalFeedback.tsx` | `OptionBody` passes an opt-in `fresh` to `FigureImg`. Default behaviour unchanged. |
| `meta.ts` | `screens: [1 … 11]`; a seventh trait for the new screens (proposed copy). |
| `samtal.css` | "Round 2, batch 2" sections: shared (gate, rules, `[hidden]`, heat ramp, scale target), Provpass hub, running pass, result, Framsteg. All under `[data-rd='samtal']`, `sa-` classes, Samtal's tokens. |
| `Samtal.test.tsx` | Batch-2 suites (see Verification); screens 1–11 in the render loop; batch-1 tests that assumed 9–11 unbuilt now walk them. |

## What was built, per screen, and why it is Samtal

The language is batch 1's, unchanged: the coach's turns oat and left with a speaker corner; your choices plum and right; one filled plum action per state; attachments and cards as white documents; the coach's notes untinted under a hairline; dated dividers; no text field, avatars or typing dots.

### 9 · Provpass — the hub: one offer, one gate

- **The halves** are two reply-shaped choices at the top (your corner top right): "Verbal" / "Kvantitativ", each with its questions and minutes and its sections (`rd-prov-half-verbal|kvant`, `aria-pressed`). The chosen one takes your tint, a solid plum line and a drawn check — never the filled plum, which is the offer's (spec: "adapt `.sa-pick`").
- **The coach's one offer** (spec copy): "Det här passet har du sett minst." under the rhythm line "Ditt senaste provpass var för sex dagar sedan. Nästa kvantitativa pass står på tur om en dag." (from `hub.prescription`, for its own half only). The suggested pass is attached to the turn like Idag's paused text (`rd-prov-pass-<pass>`): "Hösten 2025 · Provpass 1", "Kvantitativ · 40 frågor · 55 min", "XYZ 12 · KVA 10 · NOG 6 · DTK 12", "Sett förut: 6 av 40 frågor", and a short pass's gap before it starts.
- **Two replies:** "Välj ett annat pass" (to the register) and the one action "Välj det här passet ↵" (`rd-prov-start`, spec). Enter takes it.
- **The gate** (`PassConfirm`, the spec's single confirmation): the exact pass as the coach's heading, its size and minutes, any missing questions, "När du startar går klockan, och det här gäller:" and the kit's four rules as a plain list, then "Facit och resultat får du när du har lämnat in." Replies "Inte nu" and "Starta nu" (`rd-confirm`, spec). Esc, a press outside or "Inte nu" back out with nothing started; the half and the scroll stay; focus returns to the opener. While it stands, the frame under it is inert. It is an in-root dialog (`Gate`, portalled to Samtal's root, `data-rd-keyscope`), so it stays inside the bake-off's phone frame and Samtal's theme.
- **Below a quiet line:** every other pass of the half as a register by sitting, newest first (`rd-prov-pass-<pass>`, "Provpass 2 · sett 28 av 40"), each through the same gate; "Dina senaste provpass" as one coach line whose entries open their results (`openProvResult`); "Så går ett provpass till" with the rules.
- **States:** a half without passes says so and offers the other half; no pass at all offers Öva; a given-up pass leaves "Provpasset avbröts och blev ogiltigt." on the hub once.
- **Why Samtal.** A commitment made in one exchange — a proposal with its reason, the pass as an attachment, your choice as a reply, the gate as the coach's question with two answers — not a picker grid.

### 9 · Provpass — the running pass: the coach goes quiet

- **Focus mode** (spec §9 Desktop running): no doors, no account. The strip has "Avbryt provpass" (`rd-exit`), "Fråga 17 av 40 · KVA" and the clock "31:12 kvar" (`rd-prov-timer`); under it "16 av 40 besvarade · Visa svarsöversikt". Phone: the head keeps the exit and the clock; the rest is one scroll.
- **The question** is the coach's turn in quiet exam wording ("Fråga 17 · KVA", the problem kept whole: KVA's Villkor and Kvantitet I/II, NOG's (1), (2) and coda, XYZ's stem, an ELF gap as "Lucka N", math by KaTeX). A passage (LÄS/ELF, with ÖVNINGSTEXT and "Om texten" for a practice text, `lang="en"` for English) or a DTK page (zoom, rotate, "Förstora figur", pan) is the document beside it, as in the drills.
- **Your answer** is a reply that records at once and stays changeable (`rd-prov-option-<L>`, `aria-pressed`): no Svara, no verdict, no explanation, nothing graded (`drill.lock` is never called). The dock gives the receipt "Ditt svar: B · du kan ändra det tills du lämnar in", "Föregående fråga" and the one action "Nästa fråga ↵", on the last question "Granska svar ↵" (spec).
- **The answer overview** (`rd-prov-grid`) under the conversation: every question by section ("XYZ 1–12" …) as 46 px cells (`rd-prov-cell-<n>`): your letter under the number on an answered one, an ink ring outside the current one (`aria-current="step"`), a flag on a flagged one; each cell names its number, section, answer or "obesvarad", flag and "här nu"; each is a way to its question. A key line, and "Lämna in …" (`rd-prov-submit`).
- **The flag** "Markera" (`rd-prov-flag`, `aria-pressed`) shows only when the running pass carries flags (no real source).
- **The hand-in gate** (`ReviewGate`, the spec's "answer overview" whose primary is Lämna in): "Lämna in passet?", "39 av 40 besvarade · 31:12 kvar" (the clock still running), the unanswered count with zero/one/many wording and each unanswered (and flagged) question as a way back, then "Tillbaka till passet" and "Lämna in" (`rd-confirm`). Handing in locks the answers and shows "Lämnar in …" until the result opens; time running out says "Tiden är ute." first.
- **Giving up** (`AbortGate`): "Avbryta provpasset?" and "Avbryter du blir provet ogiltigt, och passet får inget resultat." The filled reply is the safe one, "Fortsätt passet"; "Avbryt provpasset" (`rd-confirm`) returns to the hub. Neither Esc nor a press outside can end a pass.
- **Why Samtal.** The same conversation shapes as the drills — question as turn, answers as replies, the document beside — with the coach deliberately silent until the hand-in.

### 10 · Provpassresultat — said plainly, then the notes

- **The lead turn** (`rd-prov-result`): "Kvantitativ · riktigt pass" and "Klart. 27 av 40 rätt." (spec), then what is partial — missing questions ("… så det rättas av 38.") and blanks ("2 frågor lämnades obesvarade.") as separate facts, unknown never counted as wrong.
- **The score attached, its basis beside it** (`rd-prov-score`, never behind a hover): "1,20 av 2,0 · normerat (härlett)" with "Härlett ur UHR:s normeringstabell för Hösten 2025. UHR normerar hela den kvantitativa delen, 80 frågor, och ett pass har ingen egen tabell. Därför räknas dina 27 av 40 om till 80 frågor och läses av i tabellen – en skattning, inte ett officiellt resultat." The count is the pass's own (38 for a short pass). Without a table: "skattad" and the linear-estimate sentence; with nothing to score, no number.
- **Two replies:** "Till Provpass" and the one action "Till Öva ↵" (spec); a trap the result names replaces it with "Öva på fällan i KVA" (`startDrill({kind:'framework'})`).
- **Below "Genomgång":** "Delprov för delprov" — a real table on the desktop (Delprov · Rätt · Tid · Tidsandel), labelled rows on the phone (`rd-prov-section-<sektion>`); a section over its share said in words ("17:30 · 01:00 över"), not colour. The trap line when there is one; "Sett tidigare: 6 av 40 frågor · Tid: 53:30"; "Tidigare kvantitativa pass, riktiga" (`rd-prov-history`): raw counts, each opening its result — a fold on the phone (spec).
- **Why Samtal.** One factual sentence and one reply first; the analysis as the coach's notes, not a dashboard of rings.

### 11 · Framsteg with Historik — one observation, then the evidence

- **Tabs** at the top: "Översikt" and "Historik 10" with full tab semantics (tablist, tab, tabpanel, roving tabindex, ←/→ wrapping, Home/End, claimed from the switcher). Chosen with a tint and a line, never filled.
- **Översikt.** The hello says the week ("180 svar den här veckan."); the lead says what the data supports: "Din prognos är 1,4 – upp 0,1 sedan förra veckan." and, with at least two sections scored, "Mest att vinna just nu finns i XYZ, matematisk problemlösning." Replies "Välj övning" and the one action "Öva XYZ ↵"; without a supported focus "Välj övning" leads (spec). Below "Underlaget":
  - the prognosis card with its caveat as the footnote (Idag's), and a supplied target named on the scale ("mål");
  - "Veckorna": share right per week on the 0–2,0 scale — one plum line on hairline rules, gaps where a week had no answers, the first and last values labelled, each week inspected by pointer or (focused) ←/→/Home/End with a live readout under it, and "Visa som tabell" (dataviz method: single series, no legend, direct end labels, table view);
  - "Delproven": the eight sections in their two groups — level with its band, the answers behind it and how sure that is, the week's change in words ("↗ uppåt 3", said in full to a reader), the focus tagged "Fokus" (`rd-framsteg-section-<sektion>`);
  - "Veckans rytm" (`rd-framsteg-week`): "Fyra av fem dagar och 180 svar den här veckan · 70 % rätt de senaste sju dagarna · 14 minuter idag.", a run of days only if the reader keeps it on, never a loss; the 84 days folded under it (a quiet one-plum calendar, four monotone steps, with a sentence and a week-by-week table for a reader); the misses waiting and "Till Repetera";
  - "Senast avslutat" as Idag says it, and "Hela historiken".
- **Historik** (`rd-framsteg-history`): "Här finns dina avslutade övningar." (spec), "Provpassen och deras resultat finns i Provpass.", replies "Till översikten" and "Till Öva ↵"; every finished drill and repetition newest first ("8 okt · ORD · övning · 9 av 10 rätt"); "Till Provpass och resultaten".
- **Why Samtal.** The coach describes the evidence briefly, then hands over the records as attachments; plain section rows instead of equal stat cards.

## Known pitfalls, how each is met, and the tests

| Pitfall (brief) | Where (`SamtalProvpass.tsx` unless named) | Test (`Samtal.test.tsx`, both widths) |
|---|---|---|
| Required figures gate the answer while loading, failed or retrying, keyed by source and mounted instance; a cached complete image counts as ready; a page shared by neighbours keeps its state, a new source resets | `passBlock` `:682`; `pick` refuses while blocked `:823`; `FigureImg` `fresh` in `SamtalParts.tsx` (a mounted image reports `loading` unless already complete). In a pass the answer is the click or the letter (there is no Svara); Nästa still moves on — an unanswered question is only unanswered. | `:1968` (page loading, failed, retry, shared by neighbours, shown again, new page), `:2012` (cached), `:2028` (option images, a diagram) |
| The switcher's digits, 0 and ←/→ never leave a running pass, whatever has focus | the capture handler prevents them before any other check `:877`; the pass root is `data-rd-keyscope` `:1069`; the DTK pan region and the tabs handle their own arrows | `:2144` through the real `Redesign2026Bakeoff`: option, cell, turn and body × 1, 5, 8, 0, ←, → |
| A provider countdown reaching 0 hands in once, never voids; expiry decided once at the run start | `expiredAtStart` `:570` (`useState`); the deadline taken once `:790`; `left = min(local, provider)` `:797`; `handIn` once `:804`, `:815` | `:2057`, `:2078`, `:2095` (fake timers), `:2108` (already out of time: explained, no result) |
| Shrinking lists keep a valid index; a new sitting resets | `at = clamp(index…)` `:775`; overview runs derived from the questions; the runner keyed by `running.passId`; a pass the host did not start is refused `:573` | `:1937`, `:1948`, `:1958` |
| Labels match actions | "Till Öva" → `go('ova')`, "Till Provpass" → `go('provpass')`, "Till Repetera" → `openRepetera` | `:1744`, `:2213`, `:2343`, `:2459` |
| Failure states reset when the source changes | per-source status; the page after a failed one starts loading | `:1968` (last step) |
| Letters work from a focused control | letters resolved before the control check `:881` | `:1885` |

**Each pitfall test was proven red against a mutant**, then the code restored (every `MUTANT` edit reverted; `grep` finds none; 329/329 again):
- no switcher `preventDefault` → `:2144` red (2/2);
- expiry computed on every render → `:2078` red (2/2);
- no index clamp → `:1937` red (2/2);
- figures gated only on failure, not while loading → `:1968` and `:2028` red (4/4);
- the DTK page without `fresh` → `:1968` red (2/2);
- `FigureImg` not reporting a cached image → `:2012` red (2/2).

## Spec gaps

Built only what kit v2 carries; every screen renders without the missing parts.

1. **§9 Data/hub: generated mode ("Riktigt pass / Genererat pass").** The kit's hub lists only authentic passes and `startProvpass` takes an authentic pass id. No mode toggle is shown (a one-option toggle would be a dead control).
2. **§9 Data/States: start time, deadline, save and settlement status.** `ProvRunningView` has `remainingSeconds` but no `startedAt`/deadline and no saving, saved, failed or settled state. The screen takes its deadline once from `remainingSeconds` at the start; "Lämnar in …" stays until the host opens the result; there is no "sparat" claim, no save-failure line and no failed-settlement recovery (spec: "demonstrating it is new presentation work").
3. **§9 Running: recording answers, flags and the place.** `DirectionActions` has no action for a pass answer, a flag or the position, and `submitProvpass()` takes no answers. They live in the screen until the hand-in (the real MockRunner records each pick itself). Needed from the kit owner for the real app.
4. **§9 Navigation: giving a pass up.** There is no abandon/void action. "Avbryt provpasset" returns to the hub locally (in the app, MockRunner's `abandon` ends the session).
5. **§9 Running: one pass in the fixtures.** Only `host-2025:kvant1` runs. A register pass the host does not supply says "… kan inte öppnas här just nu." and leads back instead of showing another pass's questions; a provider that switches `running.passId` mid-run ends the run the same way.
6. **§9 Phone hub "sitting rows open that sitting's least-seen pass".** Built as one row per sitting with each of its passes as a reply (same gate); the half's least-seen pass is the offer above.
7. **§9 "Visa svarsöversikt opens a sheet" (phone) and an on-demand overview (desktop).** Kit v2 requires the running screen to show the question grid, flags and Lämna in (kit-v2.md §1 screen 9; contract `rd-prov-grid`, `rd-prov-submit`). The overview therefore stands in the screen under the conversation and "Visa svarsöversikt" takes focus to it; the hand-in gate is the spec's review step with "Lämna in" as its primary. A deviation for the owner to judge in the screenshots.
8. **§9 Loading.** No loading flag: no skeletons; the gate starts only a known pass.
9. **§10 Data: result date, calibration status (`estimateBasis`), missing or invalid result.** `ProvResultView` has no date, no estimate basis and no "not found" state. The divider names the sitting and pass instead of a date; the P5/övningstext calibration caveat is **not shown** (a review of Instrument found a guessed caveat wrong; the kit must supply the basis); "Det här resultatet kunde inte hittas" is not built.
10. **§10 per-section estimates.** `sections[].estimate` (linear, optional) is not shown: a 6-question section's linear level would read as precise.
11. **§10 history scores.** Shown as raw counts only: the summaries carry a score but not how it was made.
12. **§11 Navigation: Historik rows to `/drill?done=…`, `/repetition?done=…`, and "Öppna senaste passet".** No action opens a finished drill, so rows are records, not links, and Historik's one action is "Till Öva" (the spec's empty-history fallback). Direct `/historik` entry has no kit signal; inside Samtal, Idag's link opens Historik.
13. **§11 failed history fetch, freshness, per-section series, a range for the total.** Not in the view model.
14. **§11 the week's goal and the target.** Shown only when supplied (the fixture supplies both); the target is named "mål" on the prognosis scale, not on the weekly curve (that series is pooled accuracy, not the projection).
15. **§9–§11 intermediate widths, text spacing, 200 % zoom.** Only the bake-off's `data-width` switch is honoured, as in batch 1.
16. **B2 inventory names.** Built as `SamtalProvpassHub` + `PassAttachment` (PassOffer), `PassConfirm`, `PassRunner` (TimedConversation), `AnswerOverview`, `SamtalResult` + `ResultScore` (PassReport), `ResultSections` (SectionResultRows and PacingRows, one table), `Overview` (ProgressConversation), `SectionLedger`, `WeeklyTrend` (TrendAttachment), `History` (HistoryList).
17. **Duplication to fold later.** `SamtalQuant.tsx` (outside this write set) keeps its own `Problem`, figure document and inspector; the pass uses `SamtalParts`' new `FigurePage`/`FigurePan`/`FigureInspector` and its own `PassProblem`. A later batch with `SamtalQuant.tsx` in its write set can switch it to the shared parts.

## Proposed copy (new UI strings)

All new UI copy is **proposed**; spec copy is marked (spec); source wording (prompts, options, rules, section names, the approved caveat) is unchanged.

- **Hub:** "Del av provet" (legend) · "Verbal" / "Kvantitativ" · "40 frågor · 55 min" · "Det här passet har du sett minst." (spec) · "Här är passet för den {verbala} delen." · "Det finns inget riktigt {verbalt} pass att göra just nu." · "Det finns {kvantitativa} pass att välja i stället." · "Passen visas här när frågebanken har dem." · "Ditt senaste provpass var för {sex dagar} sedan." / "… var idag." · "Nästa {kvantitativa} pass står på tur om {en dag}." / "… idag." · "Nu är det dags för ett {kvantitativt} pass." · "Sett förut: N av M frågor" · "N frågor saknas i det här passet, så det rättas av M." · "Välj ett annat pass" · "Välj det här passet" (spec) · "Visa {kvantitativa} pass" · "Till Öva" (spec) · "Andra pass" / "Om provpassen" · "Alla riktiga pass · {Kvantitativ}" · "sett N av M" · "Dina senaste provpass" · "Så går ett provpass till" · "Provpasset avbröts och blev ogiltigt." (after the app's "Provet avbröts — ogiltigt.").
- **Gate:** "När du startar går klockan, och det här gäller:" · "Facit och resultat får du när du har lämnat in." · "Inte nu" (spec) · "Starta nu" (spec).
- **Running:** "Avbryt provpass" (spec) · "Fråga N av M" · "N av M besvarade" · "Visa svarsöversikt" (spec) · "Tid kvar:" (reader) · "kvar" · "Tio/Fem minuter kvar." · "En minut kvar." (reader, once) · "Markera" / "Markera frågan för att komma tillbaka till den" · "Lucka N" (the app's) · "Ditt svar: B" · "du kan ändra det tills du lämnar in" · "Inget svar än" · "A–D svarar · ← → byter fråga" · "Föregående fråga" / "Föregående" · "Nästa fråga" (spec) · "Granska svar" (spec) · "Svarsöversikt" · "besvarad · här nu · markerad" · "Lämna in …" · "Texten saknas, så frågan kan inte besvaras." · batch 1's figure reasons.
- **Gates in the pass:** "Lämna in passet?" · "N av M besvarade · 31:12 kvar" · "Alla N frågor är besvarade." · "En fråga är obesvarad: fråga N. Fel ger inga avdrag, så ett svar är bättre än inget." · "N frågor är obesvarade. …" · "Fråga N" · "Till fråga N, den första" · "Du markerade fråga N." / "Du markerade {fem} frågor." · "Klockan går medan du granskar. När du har lämnat in går det inte att ändra något." · "Tillbaka till passet" · "Lämna in" (spec) · "Avbryta provpasset?" · "Avbryter du blir provet ogiltigt, och passet får inget resultat. Klockan går medan du bestämmer dig." · "Avbryt provpasset" · "Fortsätt passet" · "Lämnar in …" · "Tiden är ute." · "N av M frågor besvarade. Resultatet öppnas när det är klart." · "… kan inte öppnas här just nu." · "Välj ett annat pass i Provpass." · "Passet har inga frågor att visa." · "Tiden för det här passet har redan gått ut." · "Ett provpass kan inte pausas, så det här kan inte fortsätta. Starta ett nytt när du vill."
- **Result:** "{Kvantitativ} · riktigt/genererat pass" · "Klart. N av M rätt." (spec) · "En fråga lämnades obesvarad." / "N frågor lämnades obesvarade." · the official-derived basis sentence (after MockResult's) · the linear sentence · "Ingen poäng: inga frågor kunde rättas i passet." · "Till Provpass" (spec) · "Öva på fällan i {KVA}" · "Genomgång" (spec) · "Delprov för delprov" · "Tidsandel: delprovets del av 55 minuter" · "Delprov · Rätt · Tid · Tidsandel" · "· 01:00 över" · "Samma fälla" · "{Två} av dina missar föll på samma sätt: …" · "Sett tidigare: N av M frågor" (spec) · "Tid: …" · "Tidigare {kvantitativa} pass, riktiga" · "Visa/Dölj tidigare pass" · "Inga tidigare pass av samma sort ännu." (the app's).
- **Framsteg:** "Översikt" / "Historik" (spec) · "N svar den här veckan." · "Inga svar än den här veckan." · "Din prognos är 1,4 – upp 0,1 sedan förra veckan." · "Din prognos ligger kvar på …" · "Din prognos är … av 2,0." · "Här syns dina framsteg när du har börjat öva." · "Mest att vinna just nu finns i {XYZ}, {matematisk problemlösning}." · "Öva {XYZ}" (spec pattern) · "Välj övning" (spec) · "Underlaget" · "mål" · "Veckorna" · "Andel rätt per vecka, på skalan 0–2,0" · "Veckan från 5 okt: 1,4" / "… inga svar" · "Kurvan visas när du har övat två veckor." · "Visa som tabell" / "Dölj tabellen" · "Delproven" · "Nivå av 2,0 · svar senaste 90 dagarna · veckan" · "låg säkerhet / medelsäkert / säkert" · "inte övat än" · "inga svar" · "↗ uppåt N" / "↘ nedåt N" / "stilla" (with a reader sentence) · "Fokus" · "Veckans rytm" · "Det här har du gjort" · the rhythm sentence · "{Fyra} dagar i rad just nu; som längst … dagar." · "De senaste 84 dagarna" · "Inga … flest svar" · "N missar att repetera, N lösta." · "Till Repetera" · "Senast avslutat" · "Hela historiken" · "Här finns dina avslutade övningar." (spec) · "Här hamnar dina övningar när du har avslutat dem." · "Provpassen och deras resultat finns i Provpass." · "Till översikten" (spec) · "Övningar och repetitioner" · "Senaste först" · "Inga avslutade övningar än." · "Till Provpass och resultaten".
- **Door preview:** "Nästa: kvant, om en dag" / "Dags för ett pass: kvant".
- **`meta.ts`:** the seventh trait.

## Verification

From `app/`, on the final tree:

- `pnpm typecheck` (`tsc -b --noEmit`): **clean**.
- `pnpm lint` (`biome check src`): **0 errors, 0 warnings**, 499 files; the 4 infos are pre-existing and outside this folder (batch 1 recorded the same four).
- `pnpm exec vitest run src/components/devbake/redesign/f-samtal/Samtal.test.tsx`: **329 passed (329)**:
  - the shared contract (`describeDirectionContract`) on screens 1–11 at both widths, including screen 9's gated start and hand-in (`pressThroughGate`), the timer, the grid's answered and current cells and the flag; 10's result, sections and history; 11's prognosis with its caveat, sections, week and Historik;
  - Samtal's own batch-2 suites at both widths (`Samtal.test.tsx:1609` onward): the hub (offer, halves, register, results, gate in and out, focus return, inert frame, empty and short passes); the running pass (answers without grading, navigation and overview, review and hand-in once, abort, keys, flags, a shrinking list, a pass the host did not start, no questions, figures, the clock ×4); through the real bake-off host (the switcher's keys in a running pass, door → gate → pass → hand-in → result → Öva, a screen change ending the run); the result (basis, sections, history fold, linear, no score, short pass, trap); Framsteg (observation and reply, ledger, week, 84 days, the weekly curve and its table, tabs with their keyboard model, Historik, Idag's link, sparse data);
  - screens 1–11 render in both themes, live and as a still, without console errors.
- `pnpm test` (`vitest run`, all of `app/`): **108 files, 2273 tests passed (2273)**. No shared test fails: `Redesign2026Bakeoff.test.tsx` already derives built screens from the registry.

### Browser self-check: not run

The brief asks for any node process to run as `NODE_OPTIONS=--max-old-space-size=3072 node …`; this session's permission policy denies that command (even `NODE_OPTIONS=… node --version`). So no Playwright driver was written or run and no Vite server was started for screenshots. Nothing here claims rendered contrast, overflow, clipping or axe results; **the coordinator's 16-view pass per screen is needed**, at least for:
- 9: the hub, the gate (desktop card, phone sheet), the running pass on a quant question and on a DTK page, the review and abort gates, "Lämnar in …";
- 10 and 11 at both widths and themes, Framsteg's Historik tab and the 84 days opened;
- Spec gap 7 (the overview in the screen, not a sheet), and whether the phone pass's one scroll (no tray) reads well for long LÄS passages.

### Candidate source fingerprints (SHA-256, under `app/src/components/devbake/redesign/f-samtal/`)

| File | SHA-256 |
|---|---|
| `Samtal.test.tsx` | `0af89e94cc7ad5f595b98c9614e4d88414affded28a208f8f5c02e6f7b2ce8c9` |
| `Samtal.tsx` | `2ea421a41fcf7ee17a07a2fb5ce0d48e9bb764f78f0f75ba33762aec9db27ed1` |
| `SamtalFeedback.tsx` | `ec89463bbfa5ec80b2618e480efc6e07fcde5f1155290a731ece4fec8d7314af` |
| `SamtalFramsteg.tsx` | `ac1d35fa2584cb9b713c4eb2fb59d838c4176eb1d8833fc90c5cd33c3f93aa0a` |
| `SamtalHome.tsx` | `acffd2096ed1bda7e610b9d5ef3c9699f50cd92c0de57489a2e44c75f4a701b8` |
| `SamtalNav.tsx` | `2a49e157b6f502cd6d80c5ad744b57bc4a0295346ae90b7d78daa6585aacdfc5` |
| `SamtalParts.tsx` | `7154dc10b1a1183fd96895fdb85033175bee2b4e8df21c935addb6142692fd93` |
| `SamtalProvpass.tsx` | `9da317e95d26508780c440a97544b2850807ba55bfdbcf2bbb5c086fe261133a` |
| `meta.ts` | `e39a3b8fd3b9ee4db8c98e9aeb933e1b260f1a801477ecd2e907df60326edb98` |
| `samtal.css` | `5896f9b1b87000d425bc38fab75493af357845c99bd467bd6ec369e887f3531b` |

## Notes for the coordinator and the owner

- **No shared-test repairs are needed** this round.
- **Screens 1–8 look the same.** Idag's prognosis card moved to `SamtalParts` (same markup; ids now unique; real spaces between the number and "av 2,0", so readers and copy-paste get words); "Alla pass i Framsteg" now opens Historik.
- **The pass's keys and the switcher:** while a pass runs, the bake-off's digits, 0 and ←/→ do nothing outside the pass; the bar's own buttons still move (and end the run).
- **Owner calls:** Spec gaps 7 (the overview's placement), 9 (no calibration caveat on a result until the kit carries the basis) and 1 (no generated mode).
- **Playbook proposal — gas-city-coordinator — 2026-10-20:** a worker's file writes outside `app/` were refused after `cd app && …` made `app/` the session's working directory (the write scope follows it). Rule: run checks as `pnpm -C app …` or return to the worktree root before writing worklogs.
- **No bake-off route was deleted.** Real routes, stores and other directions were not touched.

## Beads hand-off

- One completion note on the bead, then parked `deferred` with the assignee cleared, confirmed with `bd show`; then `gc runtime drain-ack`. Not closed: review and delivery are the coordinator's.

## Round 2 — review hpf-3lt1 (HOLD, four P2)

Session `ci-wisp-5vlue9g`, 2026-10-20. `gc hook --claim --json` returned `hpf-qr0p.25` (route `hpfetcher/gc.implementation-worker`); `bd show` matched the id, the status (`in_progress`), the assignee and `gc.routed_to`. The worktree was clean at `21a10186a32c8e7cb534d165d465b8d0ecabffb5` (the untracked root dotfiles are the sandbox's placeholders, as in round 1). The review report was read first from `scratch/hpf-qr0p.25/review-hpf-3lt1.md`.

**Write set kept.** Modified: `Samtal.test.tsx`, `Samtal.tsx`, `SamtalFramsteg.tsx`, `SamtalNav.tsx`, `SamtalProvpass.tsx`, `samtal.css`, and this worklog. No shared kit file, spec or other direction was touched. Uncommitted.

**Red first.** Every new test was written before any source change and run against the source at `21a1018`: **30 failed | 331 passed (361)**, plus **6 unhandled errors** (the refused hand-in's exception escaping the runner: from the click handler for the reader, from a passive effect for the clock). Each failure was for the reason it tests (traces checked). The sweep's register-gate test passed on the old code (marked "already safe" below). Two cases added after that run — Space in a pane, and the Provpass door as a way out — were proven red against mutants (6 of 6 failed: the pane check removed from Space; the door's return to the hub disabled), then the code was restored (`rg MUTANT` finds nothing).

Paths below are under `app/src/components/devbake/redesign/f-samtal/`; line numbers are at the final tree.

### Fix 1 — a refused hand-in no longer traps the reader

- **Hand-in, once.** `SamtalProvpass.tsx:852` `handIn`: the `handed` latch stays; the answers and flags are frozen into a `HandedPass` (type at `:1807`) and given to the screen (`onHandIn`), which ends the run; then `actions.submitProvpass()` is called inside `try`/`catch` (`:868`), and a returned promise's rejection is observed too (`:873`, `settlesLater` at `:792`). Either failure calls `onHandInFailed`. Nothing resends: there is no retry, and the clock cannot fire again because the runner is gone. The clock path (`:877`) calls the latest `handIn` through a ref.
- **The run ends at the hand-in.** `Samtal.tsx:63–87`: `handed` (`{ pass, failed }`); `handIn` sets `run = null`; `refused` marks only the pass on show (a late rejection for another pass changes nothing); `toHub` clears it; a screen change clears it, as it does the run.
- **The frame and its doors come back.** `SamtalNav.tsx:204`: Provpass shows `PassHanded` in place of the hub (`view` at `:128`). Its "Till Provpass" and Enter, and once the hand-in has failed the Provpass door (`:181`), return to the hub; the hub's question then takes focus (the focus effect now runs per view, `:197`).
- **What the reader sees.** `SamtalProvpass.tsx:1825` `PassHanded`, in the frame's column, with its heading focused (on the hand-in, and again when it fails):
  - while the host settles it, "Lämnar in …" with `role="status"` "N av M frågor besvarade. Resultatet öppnas när det är klart." (same as before, but now with the doors);
  - refused: "Passet kunde inte lämnas in." (h1), `role="alert"` "Något gick fel när passet skulle lämnas in, så det finns inget resultat att visa.", a quiet line that the answers stay as they were, cannot be changed and cannot be handed in again from here, the one action "Till Provpass ↵" (Enter at `:1841`), and `AnswerRecord` (`:1905`). The record is the overview's cells as a read-only list (no buttons): letters, flags, "N av M besvarade · K markerade", and reader text per cell ("Fråga 9, XYZ, svar B, markerad"). CSS: `samtal.css:4397–4411` (`.sa-overview--record`, `.sa-cell--still`).
- **Keys and key scope let go.** The runner, with its capture listener and its `data-rd-keyscope` (now only while live, `:1148`), unmounts at the hand-in. The handler also checks the latch before it prevents anything (`:966`), so a handed-in pass never swallows a key.
- **Tests** (both widths):
  - Through the real host (`Redesign2026Bakeoff` on Samtal screen 9). The harness's `onSelect` throws once on the request for screen 10, which is how the bake-off's `submitProvpass` fails; no module mock. A second run lets the clock reach zero under fake timers. Test `Samtal.test.tsx:2451`, by the reader and by the clock: the error is visible (h1 and alert); the record shows "16 av 40 besvarade · 2 markerade", all 40 items, no buttons, question 9 flagged and 17 "obesvarad"; the doors are not inert; the heading has focus. A letter and five more seconds hand nothing in, so there is exactly one request for screen 10. → on the focused heading moves the switcher to 10, ← brings back the fresh hub, and `2` switches the direction.
  - `:2497` is the way out: "Till Provpass", Enter or the Provpass door, by the reader and by the clock. Each leads to the hub with its question focused and still one hand-in, and the doors lead on.
  - Provider level: `:1930` checks that, once handed in, the frame and doors are back, the heading has focus, no key scope remains, and digits and arrows are not prevented. `:1951` covers a promise that rejects: "Lämnar in …" first, then the refusal with B recorded on question 17, sent once.
  - The round-1 hand-in tests (`:1915`, the clock at `:2203` and `:2224`, the shared contract) are unchanged and green.

### Fix 2 — the weekly chart reads only weeks it has, and the sweep

- `SamtalFramsteg.tsx:357–360`: the chosen week is clamped against the current series when it is read (`at = min(chosen, weekly.length − 1)`); a shorter series keeps its last week.
- Test `Samtal.test.tsx:2797` (both widths): Home, then End (week 12 of 12). The provider then replaces the series with two scored weeks: the readout shows the last of the two (1,3), two dots are drawn, and ← reads the first (1,1). Red at `21a1018`: `TypeError: Cannot read properties of undefined (reading 'score')` in `WeeklyTrend`.
- **Sweep.** Every retained index or selection in screens 9–11, tested by choosing the last entry, then a shorter, still-populated collection:

| Retained | Where | Result | Test |
|---|---|---|---|
| The question on screen | `PassRunner` `index`, clamped to `at` | already safe | `:2049` (question 40, then 30 questions) |
| The enlarged page over a question that goes | `PassRunner` `showing` (`:934`) | fixed: it used to leave the pass inert (fix 4) | `:2185` (question 29, then 20 questions) |
| The chosen week | `WeeklyTrend` | fixed | `:2797` |
| The chosen half | hub: `chosen` gives way to a listed half (`:215`) | fixed: no half used to be pressed while the other half's pass was offered | `:1809` |
| The gate's pass | hub `asking`, held by value | already safe: the gate stays whole, and the start is the host's call ("kan inte öppnas här just nu") | `:1822` |
| Answers and flags (by qid), page views and loads (by src), zoom steps (fixed lists), the Framsteg tab (two fixed views), folds (booleans) | — | not indexes into provider lists | — |

### Fix 3 — a scroll pane with focus keeps its arrows

- `SamtalProvpass.tsx:784` `inPane` recognises two kinds of pane. One is the conversation's own column when it has focus itself (`.sa-thread--pass` on the desktop, `.sa-ppass-scroll` on the phone). The other is anywhere in the document beside the question (`.sa-pass-doc`: the passage, the DTK page and its pan).
- In the capture handler (`:969`), arrows in a pane are not prevented, so they scroll natively and, with Shift, select; they do not move the question. Space there scrolls. The digits and 0 are still prevented whatever has focus, and the pass's key scope keeps a pane's arrows from the switcher.
- `:1995`: the desktop passage, which scrolls on its own, is a keyboard stop (`tabIndex={0}`, so a keyboard can reach and scroll it; axe's scrollable-region-focusable).
- Test `Samtal.test.tsx:2519` (both widths), through the real host:
  - **Data.** The fixtures' running pass is quantitative and has no passage. The test spies on `useBakeoffDirectionData` (`vi.spyOn` on the module, restored after each test) so that the real hook's value comes back with question 17 replaced by a reading question with its passage. Everything else is the real host.
  - **Checks.** Question 17 is answered first. The panes are the passage (focused) and the thread on the desktop, and the one scroll on the phone. In each, ←, →, ⇧←, ⇧→ and Space are not prevented, question 17 stays, and the host stays on screen 9. 1, 5, 8 and 0 are prevented, the direction stays f and side by side stays off. The DTK pan still pans, and outside a pane → still moves the question.
  - **Red at `21a1018`.** On the desktop the passage could not take focus; on the phone the arrows were prevented and moved the question.
  - **jsdom note.** jsdom cannot focus a scroller without a tabindex, so for the thread and the phone's scroll the key is dispatched on the pane itself. That is what a browser does when the scroller has focus: Firefox, and Chrome's keyboard-focusable scrollers.

### Fix 4 — focus comes back from the enlarged page

- `SamtalProvpass.tsx:934–953`: `inspect(from)` saves the opener (`PassPage` passes `e.currentTarget`, `:2140`). The inspector shows only while its question has the page (`showing`), and the pass's `inert` follows it.
- Once it closes and the inert is gone (a passive effect, as `SamtalQuant.tsx:279–293` does), focus returns to "Förstora figur". If that control went with the page, or is disabled, focus goes to the question (its turn, named by its heading).
- A page that goes from under the inspector now closes it; it used to leave the pass inert with no dialog. A pass that ends under it (the clock) unmounts the runner, and the hand-in's heading takes focus.
- Tests (both widths):
  - `:2166`, Escape and "Stäng figur": while open, the close button has focus and the pass is inert; after closing there is no dialog, the pass is not inert, focus is on "Förstora figur" and question 29 is still on screen.
  - `:2185`: the list shrinks to 20 under the inspector. It closes, "Fråga 20 · KVA" is on screen, the pass is not inert and the question has focus. Red at `21a1018`: the pass stayed inert.
  - `:2254`: the clock runs out under the enlarged page. The pass is handed in once, the dialog is gone, and "Lämnar in …" has focus.

### Proposed copy (round 2)

"Passet kunde inte lämnas in." · "Något gick fel när passet skulle lämnas in, så det finns inget resultat att visa." · "Dina svar står kvar nedan, som de var. De kan inte ändras, och passet kan inte lämnas in igen härifrån." · "Till Provpass" (as on the result) · "Dina svar" (quiet divider) · "Svarsöversikt" (as in the running pass) · per cell for a reader: "Fråga N, SEKTION, svar X[, markerad]" / "…, obesvarad".

The raw exception text is not shown, because it is the host's wording and may be English or technical. The owner may want it under a disclosure.

### Notes for the coordinator and the owner

- **Behaviour changes.**
  - "Lämnar in …" now stands in the frame with its doors; in round 1 it was in focus mode with no way out. A host that never settles therefore cannot trap the reader. In the bake-off it is never seen, because the result opens at once.
  - In a focused scroll pane, Space now scrolls (it used to move on once answered), and ←/→ there no longer change the question.
  - The desktop passage is a Tab stop.
- **Spec gap 2, updated.** An observable failure (a throw or a rejection) is now said, with the answers. There is still no "sparat" claim, no settlement status and no resubmit, because the kit has no safe signal for one.
- **No shared test failed**, and none was edited.
- **Browser self-check: not run.** It is not in this round's VERIFY, and an ad-hoc harness is not allowed. The coordinator's visual pass should add the refused hand-in (both widths and themes, the record's cells) and the passage's focus ring.
- **Playbook proposal — gas-city-coordinator — 2026-10-20.** To test a host action that fails through the real bake-off, have the harness's `onSelect` throw for the screen the action requests (`submitProvpass` asks for 10). The real action then throws, with no module mock. Count those requests to prove "called once".

### Verification (round 2, final tree, never `cd`)

- `pnpm -C app typecheck`: **clean**.
- `pnpm -C app lint`: **0 errors, 0 warnings**, 512 files. The 4 infos are pre-existing and outside `f-samtal/`.
- `pnpm -C app test src/components/devbake/redesign/f-samtal/Samtal.test.tsx`: **365 passed (365)**, 36 more than round 1's 329.
- `pnpm -C app test`: **109 files, 2713 passed (2713)**, the 2677 at the candidate plus these 36.

### Round 2 source fingerprints (SHA-256, under `app/src/components/devbake/redesign/f-samtal/`)

| File | SHA-256 |
|---|---|
| `Samtal.test.tsx` | `1e051a44485b9d915d15b212d14173adac31ea0bf80a657602442052ca792e1b` |
| `Samtal.tsx` | `fff0da30a174c613adae90c944bd1f12ad1b395812385db2fcaebb0138b96a2a` |
| `SamtalFramsteg.tsx` | `f5ebd018e4bd9c444ac50cb881e1e2f0be7c293e1ce639bd1eb9c04576a2995d` |
| `SamtalNav.tsx` | `7dd9115a84b5e90a9b0451faee81eefb945d77fe35ac3cd45fd95e2a68dccef2` |
| `SamtalProvpass.tsx` | `df1c6383785344839a013f0961c02de4b4d27949cdec2c4a756946f963e1cb73` |
| `samtal.css` | `7fb424ba90a7ffea4efa4f86ecfb7f85a7ddf00eed592320ef0d2885f4496f19` |

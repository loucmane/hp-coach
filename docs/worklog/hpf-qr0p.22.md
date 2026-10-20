# Worklog — hpf-qr0p.22

Redesign round 2, batch 2 for direction **E · Svep — "Ett kort i taget"**: screens 9 Provpass (the hub and a running pass), 10 Provpassresultat and 11 Framsteg with Historik, at desktop and phone, light and dark, all read through `useDirectionData()`.

The work follows:

- the bead's DESIGN brief (round 1b instruction for a Claude worker);
- `docs/redesign/kit-v2.md` (view model, data context, contract ids per screen);
- the direction's merged round-2 spec, `docs/redesign/directions/e-svep.md` (§9–§11 and the shared Svep grammar);
- `docs/redesign/2026-10-round1-brief.md` (shared IA, reading UX, craft bar);
- batch 1's worklog, `docs/worklog/hpf-qr0p.21.md`.

## Snapshot and boundaries

- **Claim.** `gc hook --claim --json` returned `hpf-qr0p.22` (assignee `ci-wisp-rp6vvyq`, route `hpfetcher/gc.implementation-worker`). `bd show hpf-qr0p.22 --json` matched the id, the status (`in_progress`), the assignee and `gc.routed_to`.
- **Checkout.** Branch `codex/hpf-qr0p.22-redesign-round-2-direction-e-svep-batch-2-provpass-provpassr` at `c639a84` (= `gc.worktree_base_sha`, batch 1 merged), clean at the start. The untracked root dotfiles are the sandbox's and were not touched.
- **Write set kept.** Changed: `Svep.tsx`, `SvepHome.tsx`, `parts.tsx`, `svep.css`, `meta.ts`, `Svep.test.tsx`; new: `SvepProvpass.tsx`, `SvepFramsteg.tsx`, this worklog. `SvepDrill.tsx` and `deck.ts` needed no change. No shared kit file, spec, registry, page, other direction or dependency was touched; no git writes.
- **Check script.** `gc.check_path` is `…/gascity/assets/scripts/checks/build-artifact-valid.sh`, sha256 `71f17450e127055c8304a3cb44ce87b2439abe04ba41f225c7b386be3dc73911`. The bead names no validator to run, so it was not run.
- **Network.** 127.0.0.1 only, for the scratch harness; Google Fonts requests were aborted, so the shots use fallback faces.

## Deliverables (uncommitted)

All paths are under `app/src/components/devbake/redesign/e-svep/`.

| Path | What |
|---|---|
| `SvepProvpass.tsx` (new) | Screen 9: the hub (`SvepProvpass`), its confirmation card, the running pass (`SvepPassRun`) with its question card, page card, viewer, register and phone register sheet; screen 10 (`SvepResult`). |
| `SvepFramsteg.tsx` (new) | Screen 11: Framsteg as a five-card deck, Historik its last card. |
| `Svep.tsx` | Routes 9 → Provpass, 10 → its result (a page inside Provpass's door), 11 → Framsteg. A started pass runs as its own focus stage on screen 9 (no doors, no account) until it is handed in or voided; the switcher moving on ends it. The frame gains `openResult` and `framsteg(card)`. |
| `parts.tsx` | Shared: `DeckRegister`, `useDeckKeys` (Enter takes the card in front once — a held key does not repeat), `Gate` (the confirmation card), `Scale` (moved from Idag), `SCALE_MAX`, `fmtRange`; `DeckCard.meta`/`metaSaid`; deck kinds `prov`, `res`, `fs`. |
| `SvepHome.tsx` | Uses the shared `Scale`. Its estimate opens Framsteg at Översikt and its recent passes at Historik ("the matching card"). A mock plan item's button says "Förbered provpasset" (it opens the hub; it never starts a clock). |
| `svep.css` | The batch's styles, all under `.sv-root`: the three-column table, the phone column, half doors, the pass's hand, the gate, the run and its register, result and Framsteg cards; container queries for 1320/1120 px wide and 820 px high; reduced motion; the existing phone and card rules now also cover the new decks (`:is()` lists, same specificity). |
| `meta.ts` | `screens: [1 … 11]` and one trait for batch 2 (proposed copy). |
| `Svep.test.tsx` | 250 tests (162 before): the shared contract now covers 9–11 at both widths, plus Svep's own tests for this batch (below). |

## The screens, and why they are Svep

The grammar is batch 1's: one card in front with the next cards' edges behind it, a counter and a named register, card stock on a matte neutral table, one raspberry action, ink for everything else, no colour for right or wrong.

**9 · Provpass — the hub.** The passes of one half are a dealt deck: the pass seen least in front ("Förslag · det pass du sett minst av"), the others behind it. Each card names the sitting and the pass with its real question count, shows the half's sections as a small fanned hand of cards (XYZ 12 · KVA 10 · NOG 6 · DTK 12, only for a whole pass), and "6 av 40 sedda tidigare" with a thin bar. Its one filled action is **Förbered provpass**. Left: the page, the two halves as door cards (the one the rhythm points to carries an ink "Näst på tur" tab, a word not a colour), the rhythm line from the prescription and the rules verbatim. Right: the deck's register ("6/40", said in full to a screen reader) and the earlier results, each opening its result. Phone: one scrolling column — halves, deck, counter and ticks, results, rules. An empty half deals one card that offers the other half (or Öva), never a start.

**9 · the gate.** "Förbered provpass" (or Enter on the card) deals one card over the dimmed table: "Starta provpass", the sitting, "Provpass 1 · 40 frågor · 55 minuter", the missing count if the bank lacks questions, "Du har sett 6 av 40 frågor förut." and the rules. **Starta provpasset** (`rd-confirm`) or **Inte nu**; Esc or a press on the table puts it back. The focus goes to its heading, so a second or held Enter accepts nothing. Phone: a full sheet from the bottom edge.

**9 · the running pass.** Focus mode: Avsluta, "Kvant · Hösten 2025 · Provpass 1", the clock ("31:12 kvar") and a quiet **Lämna in**. One question card with the next questions' edges behind it; KVA, NOG and XYZ set as in batch 1 (condition with Kvantitet I and II, statements (1) and (2), math rendered); DTK as a pair — the page on its light sheet with the lens (zoom, Vrid, Anpassa, Förstora), titled by the questions that share it ("Underlag · frågorna 29–31"); a reading question with its text as the tall reference card (ELF marked `lang="en"`, Swedish controls inside it restored to `lang="sv"`). Choosing a slip is the answer and stays changeable; there is no Svara and no facit. The card's foot: "Svar C. Du kan ändra det tills tiden går ut.", **Föregående** and **Nästa fråga**, which becomes **Lämna in** on the last question. The register is the pass's hand: every question a small card in its section's run — face down (raised stock) once answered, an outline while blank, the current one standing with an accent rim, a flagged one with its corner turned — and any card opens its question. Phone: the head holds Avsluta, "17/40", the clock and Lämna in; the column scrolls with the way on pinned at its foot; the register is a button with the pass as a thin hand, opening a sheet with an explicit Stäng.

**10 · Provpassresultat.** The pass turned over, read one evidence card at a time with a register: Översikt ("27 av 40 rätt", "38 besvarade · 2 obesvarade", the bank's missing count when there is one, the score with its derivation next to it — UHR's table, or "Linjär skattning — indikativ, inte UHR-normerad." — the seen count and the time used, and "Mest att hämta i XYZ: 8 av 12 rätt."); Per delprov (labelled bars, real denominators); Tempo (time used against each section's share of the 55 minutes, the share a mark on the bar, "1:00 över" in words — never red); Missarna (the count, how many were blank, the trap pattern when there is one, the missed questions' places by section); Tidigare pass (this pass on top, then the earlier passes of the same half and mode, each opening its result). One next step: **Öva XYZ** for the evidenced weak section (lowest share right with at least two misses; ties to more misses, then exam order), else **Till Framsteg**. Cards without content are left out.

**11 · Framsteg with Historik.** A five-card deck: Översikt (the prognosis with its caveat, verbal/kvant and the week's change, the 0–2,0 scale with its band when there is one, and the weeks as bars on the full scale with gaps for weeks without answers and the target as a line, all in a screen-reader table; **Öva ‹first focus›**); Delprov (all eight on one card: estimate, ± band on a slim track, answers and confidence — "Inte övat än", never a zero); Närvaro (days in a row, answers this week, share right, and the 84 days as a heat of small cards — a real table, so every date and count is spoken — with a legend; no loss framing); Nästa fokus (three rows, each a way into its practice, and the repetition line with **Till Repetera**); Historik (dated rows that scroll inside the card; an empty journal says so and leads to Öva; a quiet line and **Till Provpass** for the separate pass results). Left: the period, the countdown, the totals and Historik's own door. Phone: "Översikt | Historik" tabs over the same deck.

## Navigation: intents, not screen numbers

| Element | Request | Bake-off |
|---|---|---|
| Hub's Starta provpasset (gate) | `startProvpass(passId)` | 9 (the run is Svep's own) |
| Run's Lämna in (gate) or the clock's end | `submitProvpass()` | 10 |
| Hub's earlier result / result's earlier pass | `openProvResult(id)` (+ local page) | 10 |
| Result's Öva XYZ | `startDrill({ kind: 'section', section })` | 6 |
| Result's trap card | `startDrill({ kind: 'framework', … })` | by section |
| Result's Till Framsteg / Till Provpass | `go('framsteg')` / `go('provpass')` | 11 / 9 |
| Framsteg's next step and focus rows | `startDrill({ kind: 'section', section })` | by section |
| Framsteg's Till Repetera / Alla delprov i Öva / Till Provpass | `openRepetera()` / `go('ova')` / `go('provpass')` | 8 / 5 / 9 |
| Idag's estimate / recent passes | `go('framsteg')` + Framsteg at Översikt / Historik | 11 |

## The known pitfalls, each with its test

- **Required pictures gate answering**, keyed by src and by the mounted image: a page shared by consecutive questions stays loaded (29 → 30); a new page waits for its own load (→ 32); a cached, complete image counts at once; a failed page says so and offers another try; a figure-less DTK question cannot be answered and offers the next question; an XYZ question's own SVG figure gates too; picture options are covered by the same gate. In a pass the answer is the choice itself, so the gate refuses the choice (click or letter) and says why. Tests: "Svep, a pass question that needs its picture".
- **Keys through the real host** (`Redesign2026Bakeoff` on Svep's screen 9): digits 1–8, 0 and ←/→ pressed on the window, the body, a register cell, a choice, the flag, Lämna in and Avsluta never move the switcher; ←/→ move between questions instead; keys inside the gate stay there (`data-rd-keyscope`). The run's capture handler marks them used whatever has the focus; the page's pan region and the dialogs are key scopes. Tests: "Svep, a running pass inside the bake-off".
- **The clock hands in exactly once, never voids**: its deadline is decided once when the run starts; a provider that counts down itself can only bring it closer (a restored run never gains minutes); reaching 0 calls `submitProvpass` once however often the provider renders; a pass already out of time hands in at once, once. Tests: "Svep, the pass clock" (fake timers and provider rerenders).
- **Shrinking data**: questions that shrink under the current one keep a valid place; an empty pass says "Frågorna kunde inte visas" with the clock and both ways out; a new `passId` remounts the run; Framsteg keeps the card in front when a card before it goes; the hub's deck follows the half's passes. Tests: "Svep, a pass on data that changes", "keeps the card in front when a card before it goes".
- **Labels match actions**: "Till Provpass", "Till Framsteg", "Till Repetera", "Till Öva" each call their own request; Idag's mock plan item now says "Förbered provpasset".
- **Failure states reset**: a page's failed state is per src; a retry or a new page mounts a fresh image.
- **Confirmation gates** carry `rd-confirm` on the start, the hand-in and the void; the shared contract checks the start and the hand-in wait for it.

## Spec gaps (built only what kit v2 supports; rendered without the rest)

1. **§9 — answers, position, flags and a void have no request in kit v2.** MockRunner's pick (`useSubmitAttempt`), `goTo` (`useUpdateSession`) and abandon have no `DirectionActions`. The run keeps answers, position and flags locally, seeded from `running.answers/current/flags`; Avsluta, confirmed, returns to the hub with "Provpasset avbröts." but cannot tell a real host. A later kit needs `answerProvpass`, `moveProvpass` and `abandonProvpass`.
2. **§9 — Riktigt/Genererat mode.** `ProvHubView` lists authentic passes only and `startProvpass` takes a pass id; no generated pass can be offered. Only authentic passes are shown.
3. **§9 — an existing active session on the hub** ("existing active session if any") and an expired-session notice: the view model has no such state. The running view is shown after the gate, whatever pass the bake-off's fixture runs (always host-2025 kvant1).
4. **§9 / §10 — pending saves and failed submission.** No save state exists; after Lämna in the run shows "Lämnas in …", freezes the answers and blocks a second hand-in until the host shows the result. A failed submission cannot be shown.
5. **§10 — the result's date** (`ProvResultView` has no `when`) and **detailed answer review** (proposed by the spec, not wired). The missed questions are listed by their places only.
6. **§10 — per-section normed score / combined total** (`estimate`, `total`): optional with no real source; not shown (one plain outcome, not five scores).
7. **§11 — Historik's "Öppna pass"** (`/drill?done=`, `/repetition?done=`): no request in kit v2, so the rows are not links.
8. **§11 — "Starta diagnostik" on day zero**: no request; day zero leads to Öva. **Failed history fetch** and loading states: no state in the view model.
9. **§11 / owner question 4 — the target.** Shown only when `prognosis.target` is supplied (the fixture's 2,0); no editor. Framsteg's prognosis has no range (`framstegView` passes none), so no band is drawn there.
10. **§9 — threshold announcements** are said once each at 10, 5 and 1 minutes left in a polite region; the timer itself is not read out. The spec's wording was not given; the copy is proposed.
11. **Consolidation.** SvepQuant's prompt and figure pieces are module-private and `SvepQuant.tsx` was outside this write set, so the pass has its own exam versions (no strike, picture readiness per mounted image, the page as a key scope). One shared module would be a later batch's change.

No shared test outside the write set failed, so there is nothing to hand the coordinator.

## Proposed UI copy (new in this batch; none is approved yet)

- **Hub:** "Ett helt pass under riktiga villkor. Facit kommer först när du har lämnat in.", "Halvorna", "Näst på tur", "Villkoren", "Tidigare resultat", "Inga inlämnade pass än.", "Förslag · det pass du sett minst av", "Riktigt provpass", "‹N› av ‹M› sedda tidigare", "Ju färre frågor du mött förut, desto mer säger resultatet.", "‹N› frågor saknas i banken: passet rättas av ‹M›.", "Förbered provpass", "förbereder passet", "Senaste passet idag/igår/för ‹n› dagar sedan.", "Nästa pass: ‹halva›, imorgon/om ‹n› dagar.", "Dags för nästa nu: ‹halva›.", "Inga pass här än", "Banken har inga riktiga pass för den verbala/kvantitativa halvan just nu.", "Visa verbala/kvantitativa pass", "Provpasset avbröts. Det räknas inte som ett resultat.", "Stäng meddelandet".
- **Gates:** "Starta provpass" (eyebrow, from ConfirmSheet), "Starta provpasset" (from the spec), "Inte nu", "Du har sett ‹N› av ‹M› frågor förut.", "Lämna in provpasset", "‹N› frågor är obesvarade." (from MockRunner), "Lämna in ändå", "Fortsätt provet", "‹mm:ss› kvar av 55 minuter.", "När du lämnar in rättas passet, och svaren går inte att ändra efteråt.", "Till fråga ‹N›, den första obesvarade", "Avsluta provpasset", "Avbryter du blir provet ogiltigt." (from MockRunner), "Avbryt provpasset", "Passet sparas inte som ett resultat. Vill du få det rättat, välj Lämna in i stället."
- **Run:** "kvar", "Lämnas in …", "Tiden är ute. Provpasset lämnas in.", "Provpasset lämnas in.", "Tio/Fem minuter kvar.", "En minut kvar.", "Markera"/"Markerad", "Svar ‹L›. Du kan ändra det tills tiden går ut.", "Inget svar än.", "Föregående", "Nästa fråga", "Lucka ‹N›", "Frågeregister · ‹N› av ‹M› besvarade", "Besvarad", "Obesvarad", "Markerad", "Frågorna", "Stäng frågeregistret", "Underlag · frågorna ‹a›–‹b›", "Till nästa fråga", "Figuren till uppgift ‹N› kunde inte laddas.", "Frågorna kunde inte visas", "Klockan går vidare. Lämna in det du har svarat, eller avsluta passet."; the picture gate reuses batch 1's lines.
- **Result:** "Provpasset klart." (from MockResult), "Utfallet först, sedan ett kort i taget om var poängen kom ifrån.", "Riktigt pass"/"Genererat pass", "‹N› besvarade · ‹M› obesvarade", "Alla ‹N› besvarade", "Inga svar lämnades in i passet.", "· av 2,00", "Du hade sett ‹N› av ‹M› frågor innan." (MockResult's sentence), "Passet tog ‹mm:ss› av 55:00.", "Mest att hämta i ‹kod›: ‹N› av ‹M› rätt.", "Öva ‹kod›", "Till Framsteg", "Till Provpass", "Översikt", "Per delprov", "Så gick det per delprov", "Tempo · tiden mot delprovets andel", "Var tiden tog vägen", "i takt", "‹mm:ss› över/kvar", "Hela passet: …. Strecket är delprovets andel av tiden.", "Missarna", "Att öva vidare", "‹N› frågor fel eller obesvarade", "Av dem lämnades ‹N› obesvarade.", "‹N› av missarna har samma mönster", "Öva på mönstret", "Tidigare pass", "Jämfört med förut", "Det här passet". The derivation sentences are MockResult's own.
- **Framsteg:** "Senaste ‹tolv› veckorna", "Ett kort i taget: prognosen, delproven, närvaron, fokus och historiken.", "‹N› svar · ‹M› pass hittills", "Historik", "‹N› avslutade pass", "Prognos · hela provet", "Ingen prognos än", "Prognosen räknas fram när du har svarat på frågor i båda halvorna.", "Vecka för vecka · andelen rätt omräknad till 0–2,0", "För få veckor med svar för en kurva än.", "Mål", "Delprov · skattning och osäkerhet", "‹Åtta› delprov", "Inte övat än", "låg säkerhet"/"medelsäker"/"hög säkerhet", "Alla delprov i Öva", "Närvaro · veckans rytm", "dagar i rad", "svar den här veckan", "rätt senaste veckan", "Inga … Många svar", "‹Fyra› av ‹fem› dagar den här veckan.", "Längsta svit hittills: ‹n› dagar.", "Nästa fokus · förslag utifrån dina svar", "Öva på det här härnäst", "Repetera: ‹N› redo nu · ‹M› i kön · ‹K› utlärda", "Till Repetera", "Historik · övningar och repetitioner", "Avslutade pass", "Provpassen och deras resultat ligger under Provpass.", "Översikt"/"Historik" (phone tabs). "Inga avslutade pass än. Kör en övning så landar den här." is Historik's existing copy.
- **Idag:** "Förbered provpasset" (a mock plan item). **Meta:** the new trait.

## Interaction, keys and accessibility

- **Hub, result, Framsteg:** ←/→ move the deck and hand over to the switcher at its ends; Home/End; Enter takes the card in front (on the hub: prepares, never starts), ignoring a held key.
- **Running pass:** a–e choose (only the question's own letters); ←/→ move between questions; the digits, 0 and ←/→ never reach the switcher; Enter is not a shortcut forward; Esc never leaves (it closes the viewer, the register sheet or a gate). The page's region pans on the arrows.
- **Focus:** a gate's heading takes the focus and the focus returns to its opener; the run's title takes the focus when it starts; the viewer and the sheet return the focus to their buttons; Tab wraps inside every dialog.
- **Screen readers:** the clock is a `timer` with a label, not read every second; thresholds once each; register cells are named "Fråga 17, obesvarad, markerad"; the weekly series and the 84 days are tables; result bars carry "‹N› av ‹M› rätt".
- **Motion:** the gate, sheet and viewer cards crossfade under reduced motion; door and register lifts drop; stills never move.

## Self-check (Vite + Playwright on 127.0.0.1)

- **Harness** (scratchpad only): Vite with `configFile: false` mounts just `Redesign2026Bakeoff` under the app's `index.css` and KaTeX CSS; Playwright Chromium in the same process at 1440 × 900 (1×), 390 × 844 (2×), 1280 × 800 and 1024 × 768, reduced motion, `?d=e&s=…&w=…&t=…&bare=1`.
- **Views (≈100):** 9, 10, 11 at both widths and themes; the gate, the run, the run on a DTK page, the hand-in gate (both widths and themes); XYZ with its figure, KVA-021, NOG answered, the last question, the register sheet (light and dark), the void gate and the voided hub, the viewer; every result and Framsteg card at both widths (Framsteg in both themes); 1280 and 1024 px desktops.
- **Probes per view:** sideways overflow, controls outside the stage, hit targets under 44 px, clipped text, contrast from computed colours (OKLCH → sRGB, alpha over the real background), axe-core (WCAG 2.0/2.1 A/AA), console and page errors.
- **Result:** no sideways overflow, no axe violation, no page error, no target under 44 px, no text under 4.5:1. Every text under 7:1 is a UI label from Svep's existing styles (register numbers and figures, group heads, deck hints, door labels, scale ticks, the filled button), lowest 5.18:1; no body text is under 7:1. The remaining "outside" flags are content below the fold of a scrolling column or register, as intended, and the "clipped" flags are visually hidden headings.
- **Fixes the browser found:** (1) the phone question card scrolled its own options (the last one cut) — the column now scrolls and the way on is pinned at its foot; (2) register rows were truncated — the figure is a short "6/40", said in full to a screen reader; (3) the rules' bullets read as letters — tiny filled cards; (4) the pass's page title wrapped beside a redundant source label — the label is gone (the bar names the pass); (5) the result's next step did not say why — "Mest att hämta i XYZ: 8 av 12 rätt.", and its deck hint now shows ↵; (6) Framsteg's goal line sat under the scale's ticks — more room.
- **Not checked:** an independent second reader; letterforms (fonts offline); real devices.

## Verification (from `app/`)

| Check | Result |
|---|---|
| `pnpm typecheck` | Clean. |
| `pnpm lint` (`biome check src`) | 489 files, 0 errors, 0 warnings. 4 infos, all pre-existing and outside this change (`LandingBakeoffR3/R4A/R4C.tsx`, `l12/M3.tsx`). |
| `pnpm test` | 107 files, **1914 passed, 0 failed**. Svep's file has 250 (162 before): the shared contract for 1–11 at both widths and both themes, every screen without console errors and without the optional fields, and the batch-2 tests: the hub (6), the run (9), the clock (5), pictures (6), data that changes (3), the real bake-off (4), the result (8), Framsteg (11); the contract and the per-screen loops add 36 for screens 9–11. |

```
 Test Files  107 passed (107)
      Tests  1914 passed (1914)
```

## Notes for the owner

- **Calls to react to:** the hub leads with the least-seen pass of the half the rhythm points to; the run's register is the pass's hand (answered face down, flagged with a turned corner); a pass needs a deliberate gate to start, and Avsluta asks first; the result's one next step is the section with the most to win; Framsteg keeps Historik as its own card with a door of its own, and the pass results stay under Provpass (owner question 3, recommended default).
- **In the bake-off:** whichever pass you start, the running fixture is host-2025 kvant1 at question 17 with 31:12 left; Lämna in moves the switcher to 10; any earlier result opens the one fixture result.

SVEP2 DONE: hpf-qr0p.22

## Round 2 — review fixes (cross-vendor Codex review hpf-irxd: HOLD, two P2)

- **Claim.** `gc hook --claim --json` returned `hpf-qr0p.22` (assignee `ci-wisp-ni6xfxc`, route `hpfetcher/gc.implementation-worker`); `bd show` matched the id, the status (`in_progress`), the assignee and `gc.routed_to`. Start: `09344f8` (the reviewed merge head), clean apart from the sandbox's root dotfiles (character devices bound to `/dev/null`, not touched).
- **Evidence read first:** `/home/loucmane/scratch/hpf-qr0p.22/review-hpf-irxd.md`.
- **Write set kept.** Changed: `SvepProvpass.tsx`, `Svep.test.tsx` and this worklog. No shared file, other direction or dependency touched; no git writes; uncommitted.

Paths below are under `app/src/components/devbake/redesign/e-svep/`; line numbers are the uncommitted tree's.

### 1. Picture readiness belongs to the place that shows it

**Finding.** `useRunPictures` kept one last-writer state per src, and the page on its card and the enlarged viewer both reported into it. A viewer mounting before its load overwrote the card's `ready` with `loading`, and nothing unregistered it on close, so the answers stayed blocked with no retry. The other way round, a viewer's load could open a question whose card page was still loading.

**Fix.** I took both options the brief offers:

- **Readiness is tracked per mounted place.** `Place`, `RunPictures` and `useRunPictures` are at `SvepProvpass.tsx:695–759`. Each place (`usePicture`, `:786`) registers its own state under a `useId`, keeps its own tries, and leaves on unmount (`:800`). A failed image gives way to its message while the place stays mounted, so the failure holds until another try.
- **The enlarged page is excluded from the gate.** The gate (`gateFor`, `:844`) asks `needed()` (`:764`), which counts only the places the question is answered from. A src is ready once every one of those holds it, failed once one of them failed, and loading otherwise (also while no such place is mounted). The viewer's `PageSheet` passes `need={false}` (`:2201`), so it never opens or shuts a question.
- **The three kinds of place** use the same hook: `OptionPicture` (`:1683`, split out of `OptionFace` so the hook is unconditional), `InlineFigure` (`:1719`) and `PageSheet` (`:1922`). `Picture` (`:811`) only renders the place's image under the place's key.

**Red-first tests** (each failed at `09344f8`):

| Test (`Svep.test.tsx`) | Red at `09344f8` |
|---|---|
| `:1638` "keeps the page on its card when the enlarged page is closed before it loads" (desktop, phone) | Card page loaded, viewer opened and closed before its load: the answer was refused (stuck at loading). |
| `:1654` "never lets the enlarged page speak for the page on the card: each keeps its own state" | The viewer loaded first and the answer was taken while the card's page was still loading. Also covers the viewer failing alone: it says so inside the dialog, the card keeps its page and answers. |
| `:1679` "does not let the enlarged page mend a failed page on the card" | The viewer showed the card's failure instead of trying its own image. Now the viewer's own load leaves the card failed until its own "Försök igen". |

### 2. The running text owns its arrows

**Finding.** The text's scroll region could take the focus but had no `data-rd-keyscope`. The run's capture handler therefore turned ←/→ (with or without Shift) pressed inside it into question changes, which swapped the text at a text boundary.

**Fix.**

- **The scroll region is a key scope.** `data-rd-keyscope` sits on the text's scroll region (`SvepProvpass.tsx:1782`). The run's handler (`:1077–1087`) leaves arrows pressed inside any scope alone, so the text scrolls natively, and the bake-off's switcher ignores them too (`inOwnKeyScope`).
- **The run's other keys are unchanged.** The text owns only its arrows: the question's letters still answer from inside it (`:1086`), as they did before this fix and as the drill does. The digits and 0 are still taken everywhere. Outside the text, ←/→ still move between questions. The DTK page region and the dialogs behave as before.

**Red-first test, through the real host:**

- `Svep.test.tsx:1837` "leaves the arrows to the focused text: it scrolls, the question and the screen stay" (desktop, phone). It renders `Redesign2026Bakeoff` on Svep's screen 9, starts a verbal pass standing on the first text's last question (the boundary), focuses the text and presses ←/→ with and without Shift.
  - Asserts: no handler takes the keys, the question and the text stay, `onSelect` is never called, and the screen stays 9.
  - Red at `09344f8`: the run took the arrow (`preventDefault`).

**Guard** (green before and after): `:1856` "answers on the letters from inside the text; outside it the arrows are the pass's". The letter answers from the focused text, the digits are taken, and after blur → deals the next text while the screen stays 9.

**Test seam.** The bake-off's own running fixture (host-2025 kvant1) has no text. The test file therefore mocks `useBakeoffDirectionData` as a passthrough (`Svep.test.tsx:55–71`, `vi.hoisted` + `vi.mock` with `importOriginal`, as `useDailyPlan.prereqs.test.tsx` does). Its patch is null except in these two tests, which hand it a verbal run (`:1180–1209`); `afterEach` resets it. The real host, switcher, provider and Svep run unchanged.

### Verification (from `app/`)

| Check | Result |
|---|---|
| Red run (new tests on the unfixed source) | `Svep.test.tsx`: 6 failed, 251 passed (257) — exactly the six red-first cases above. |
| `pnpm typecheck` | Clean. |
| `pnpm lint` | 504 files, 0 errors, 0 warnings; the 4 infos are the pre-existing ones (`LandingBakeoffR3/R4A/R4C.tsx`, `l12/M3.tsx`). |
| `pnpm test` | 108 files, **2409 passed, 0 failed**; `Svep.test.tsx` 257 (250 + 7). |
| `git diff --check` | Clean. |

No shared test outside the write set failed. Per the brief, no browser harness was run, so the checks above are jsdom only.

### Notes

- **Visible change.** Opening the enlarged page after the card's page failed now tries the viewer's own image, and shows the page if it loads. The question still waits for the card's own "Försök igen".
- **Unchanged by brief.** Letters pressed while the DTK page region has the focus are still left alone, as in round 1. The drill answers from there, so a later batch could align the two.

SVEP2R2 DONE: hpf-qr0p.22

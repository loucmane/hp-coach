---
bead: "hpf-qr0p.35"
project: "hpfetcher"
session: "ci-wisp-t30cq4y"
status: "implemented_uncommitted"
---

# Worklog — hpf-qr0p.35

Redesign round 2, direction C · Spår, B0: the screen design spec for screens 5–14. It is a document only, so the three build batches (B1: 5 Öva, 6 Kvantfråga, 7 DTK, 8 Repetera; B2: 9 Provpass, 10 Provpassresultat, 11 Framsteg; B3: 12 Uppslag & lektion, 13 Konto & inställningar, 14 ELF-läsfråga) build one design in Spår's language instead of three guesses. Parent epic: `hpf-qr0p`.

## Snapshot and boundaries

- **Claim.** `gc hook --claim --json` returned `hpf-qr0p.35` (assignee `ci-wisp-t30cq4y`, route `hpfetcher/gc.implementation-worker`). `bd show hpf-qr0p.35 --json` matched the id, the status (`in_progress`), the assignee and `gc.routed_to`.
- **Checkout.** Branch `codex/hpf-qr0p.35-redesign-round-2-direction-c-sp-r-b0-screen-design-spec-for-`. `git rev-parse HEAD origin/main` returned `b777074def8517fb7a3053fb103524a6eb57ba90` for both. No tracked file was modified at the start. The untracked dotfile placeholders the sandbox mounts (`.bash_profile`, `.bashrc`, `.gitconfig`, `.gitmodules`, `.idea`, `.mcp.json`, `.profile`, `.ripgreprc`, `.vscode`, `.zprofile`, `.zshrc`) are untouched and not part of this change.
- **Write set kept.** Only `docs/redesign/directions/c-spar.md` (new) and this worklog (new) were written. There is no source change. Everything is **uncommitted**, and the bead is **not closed**, as the bead's delivery rules ask.
- **Check script.** `gc.check_path` is `…/gascity/assets/scripts/checks/build-artifact-valid.sh`, sha256 `71f17450e127055c8304a3cb44ce87b2439abe04ba41f225c7b386be3dc73911` (the same digest as in round 1). The bead names no validator, so it was not run.

## Method

- **Read in full:**
  - Spår's source: `meta.ts`, `Spar.tsx`, `SparHome.tsx`, `SparDrill.tsx`, `sparParts.tsx`, and all 3,684 lines of `spar.css` (tokens, type, controls, path, drill, tray, sheet, phone, calm and reduced motion);
  - the shared kit's metadata and destinations (`r1Kit.ts`) and the Home fixtures (`r1Fixtures.ts`);
  - the round-1 brief;
  - the round-1 worklog `docs/worklog/hpf-qr0p.md`, every reader's critique of Spår and the side-by-side findings in particular.
- **Real content:**
  - **The P5 sample** (`pipeline/synthetic/infold/preview/sample/p5-bank-sample.json`):
    - the gap-fill unit `elf-b18-002` "Left to Soak": five gaps written `___(n)___`, prompts "Gap (n)", one-word options;
    - the one-paragraph unit `elf-b19-003`.
  - **Their explanations** (`data/explanations/p5-pilot.json`), which are written in English.
  - **`docs/p5-infold-design.md` Amendment 1** (P5-only LÄS/ELF, the approved disclosure and caveat).
- **The real screens**, read by five read-only Explore subagents in parallel, with file:line references:
  1. `routes/ova.tsx` + `routes/repetition.tsx`;
  2. `routes/drill.tsx` + `components/drill/*` + `MathText` + `QuestionFigure`;
  3. `routes/prov.tsx` + `components/mock/*`;
  4. `screens/ProgressMobile.tsx` + `routes/progress.tsx` + `routes/historik.tsx`;
  5. `routes/lektion.tsx` + `components/lesson/*` + `routes/konto.tsx` + `routes/mer.tsx`.

  Their facts and the live bugs they found are folded into each screen's "What it shows" and "States".
- **Siblings.** Only the heading outlines of the parallel B0 specs (`a-folio.md`, `d-lager.md` in their own worktrees) were looked at, to keep the document's top-level shape comparable for the owner. Their content was not read, so Spår's design stays its own. The switcher-shell doc on `hpf-qr0p.8` was read for how directions map to app routes.
- **Review.** One independent reviewer agent read the finished spec against Spår's source and the round-1 critiques. Its findings and what changed are under Review below.

## Deliverable (uncommitted)

| Path | What |
|---|---|
| `docs/redesign/directions/c-spar.md` | The spec. §1 Spår's language: 14 rules that every batch keeps (the stig and its stop states, tokens, type, the one green pill, colour, motion, the frame, the tray rule, the container transform, Lugnt läge, state patterns, accessibility, ADHD-PI, critiques not to repeat). §2 the screen map with routes and navigation. §3 screens 5–14, each with: purpose and one action, data in plain words, desktop and phone ASCII wireframes, components reused and new, states, navigation, ADHD-PI, accessibility, and what makes it unmistakably Spår. §4 the component inventory by batch, and a done checklist. §5 fifteen open questions for the owner, each with the default the spec uses. |
| `docs/worklog/hpf-qr0p.35.md` | This worklog. |

## The design in brief

- **One structural device: the stig.**
  - Every sequence is a path of stops with an end: the day, a round's questions, an explanation's steps, the Repetera queue, a Provpass's four legs (the *route ribbon*) and its 40 questions (a *switchback*), a lesson's catalogue, a trap's worked example, the weeks (an *elevation line*), and Historik by day.
  - The round-1 stop styles become one `SparStop` with one state vocabulary: todo, now, right/done, miss (amber ↻ "lagd i Repetera", never red), answered (Provpass, ink), flagged, blank, goal, section.
- **One green pill per screen**, always the next step:
  - Öva: "Repetera 8", or else the scheduler's suggestion, or else "Blandad övning";
  - Framsteg: the weakest section;
  - the Provpass result: "Gå igenom missarna".

  Three views have none: settings, the Historik list while it has passes, and Uppslag before any reading or stats.
- **The tray rule.** The question tray folds only when folding buys reading room. Long texts open folded; quant, DTK and short ELF texts open with their options, sticky under a short problem.
- **Desktop "open" is a container transform** in four places (Öva's per-section repetition, the Provpass rules, Framsteg's section rows, Historik rows). Phone surfaces are bottom-edge sheets, never floating panels (Lager's language).
- **Lugnt läge becomes a persisted setting.** Each screen lists what it hides; it never hides the exit, the Provpass clock, progress counts, verdicts or the one action.
- **Per screen:**
  - Öva grouped Verbal/Kvant, with the misses as a section-ringed path.
  - KVA's quantities side by side in Roman-numeral stops, and NOG statements as a two-stop path with statement glyphs on the fixed options.
  - DTK in a 1,000 px column with the scan on an unfiltered white mat, still between its questions, and a viewer with an answer strip.
  - Repetera's verdict chip naming the schedule step.
  - The Provpass route ribbon, the switchback overview, a clock that turns inverse ink (not red), and real dialogs.
  - The result as the switchback with verdicts plus a review mode.
  - Framsteg's climb, forgiving week dots instead of a streak, and Historik as a day-grouped path.
  - Uppslag one entry at a time on a contents path, with the worked example as a four-stop path whose trap thought wears ↻.
  - Settings on one page.
  - ELF gap slots set inside the sentence (fixed width so nothing reflows), the gap's sentence in the tray, and `lang="en"` on every English block.

## Live-app facts the spec designs around (from the subagents' reads)

These are facts and bugs in today's app that the spec either keeps (facts) or fixes by design (bugs). Each screen's section has the detail.

- **Öva and Repetera.**
  - Facts:
    - A section starts on one press, ten questions, no setup (`routes/ova.tsx:162-165`). DTK takes whole pages, so 10–13 questions (`lib/drill.ts:150-181`).
    - The rough lengths are in `lib/sectionDurations.ts:11-20`. "Svagast" comes from the 90-day score (`lib/scoring.ts:195-231`).
    - Due ≠ pile (`useMistakes.ts:3-17`).
    - The spacing schedule runs 1→2→4→8→16→30 days and then retires; a wrong answer returns in ~10 min (`worker/src/lib/srs.ts`).
  - Bugs:
    - the hub's adaptive offer is skipped by one-press starts;
    - `/repetition` shows "no misses" while loading;
    - the scope is dropped;
    - drills always end on Home.
- **Drill.**
  - Facts:
    - KaTeX is inline only, between private-use markers (`components/MathText.tsx`).
    - KVA and NOG fixed options are verbatim in the data. 147 of 324 NOG items store "(1)" as math.
    - Option counts: ORD/NOG five, the rest four.
    - DTK serves full A4 pages: 218 pages for 648 questions, eleven of them with pie-chart image options.
    - The ELF cloze stem is "Lucka {n}".
  - Bugs:
    - no exit control during a session;
    - the leave sheet says answers are not saved (they are);
    - "e" on four-option items;
    - technique and pitfall never rendered;
    - detail steps not folded;
    - figures not shown after grading;
    - silent figure failures;
    - no `lang="en"` anywhere.
- **Provpass.**
  - Facts: the legs and the 40/55 setup (`routes/prov.tsx:160-176`), riktigt (normed "härlett") vs genererat (indikativ), and the four rules verbatim (`components/mock/ConfirmSheet.tsx:27-34`).
  - Bugs:
    - a false empty state while loading;
    - two confirm sheets from Home;
    - wrong grid labels ("SVE", "KVA" for NOG);
    - a red clock at 5 minutes only, with no live region;
    - a silent resume or void;
    - a frozen runner on a failed submit;
    - the result has no actions or per-question review, sorts sections alphabetically, and shows linear history beside a normed headline;
    - no tab bar on phone.
- **Framsteg and Historik.**
  - Facts:
    - The total is the mean of the halves, and a section is 2 × its 90-day share (`lib/scoring.ts:93-139`).
    - Per-section ± 95 % bands and confidence tiers exist.
    - The week paragraph exists. The goal is hard-coded at 1,8.
  - Bugs:
    - the ESTIMATE caveat is missing;
    - a misleading empty state for one-half users;
    - a streak instead of a weekly goal;
    - Historik has no date, duration or day grouping, uses present-tense numbers on old passes, and has no tab bar or rail highlight.
- **Uppslag and Konto.**
  - Facts:
    - 221 catalogue entries in three kinds (traps NOG 25 / KVA 54 / XYZ 59; protocols LÄS 8, ELF 8, MEK 16, DTK 10; ORD 41 roots).
    - Per-entry read state syncs.
    - Settings are split over `/konto` and `/mer`.
  - Bugs:
    - the plan's lesson link drops `#entry`;
    - the phone tab bar on `/lektion` is inert;
    - the read-time estimate is inflated;
    - raw English errors;
    - an inert coach-voice setting;
    - a sample name shown for nameless users.

## Review

An independent reviewer (a fresh agent, read-only) checked the spec against Spår's source (`spar.css`, `Spar*.tsx`), the round-1 critiques, the real routes and the cited Hösten 2025 questions.

**Confirmed correct:**
- every `sp-` class named;
- token values, hues, calm and REP chroma;
- the rail at 100/272, the 1,180 px page and paddings;
- the bar heights;
- stop sizes;
- the sheet heights;
- the selection morph;
- the account-menu copy;
- route params;
- section durations;
- question counts.

It reported 46 findings in six groups. All were applied; none were rejected.

- **Internal contradictions (16):**
  - The phone focus bar now has no calm switch and no "Fråga n av N", as built. The compact stig is the count, and Lugnt läge is set on Idag or in the account menu and persists.
  - The red exception for account deletion is written into §1.2 and §1.6.
  - The Provpass rules card is the in-place card on desktop and a `SparDialog` sheet on phone.
  - The views without a green pill are listed (settings, a non-empty Historik, Uppslag before any reading). Repetera "nothing ripe", the result's "not found" and the pass page each got their pill.
  - Section chips on the ranked steps became numbered, hue-ringed stops.
  - `Options` row layout ownership is settled, with one trigger rule (≤ 14 characters).
  - The persisted Lugnt läge store moved to B1. `SparSegmented` is a B1 build.
  - Round 1's screens are stated to adopt the shared B1 changes, with the contract tests and re-shoots as the guard.
  - The "Prognosen i Framsteg" link is assigned to B2.
  - The adaptive-review URL now always carries `section` (the live default to ORD would miss a LÄS trap).
  - "Till Öva" copy, DTK-on-phone in the tray rule, exam-mode calm, the open-question screen lists, and "pågående" for a Provpass.
- **Requirement gaps (5):**
  - "Lämna in" on phone before the last question;
  - the pass page's route (`/historik?pass=<id>`) and states;
  - empty states for screens 6 and 7;
  - the result's fetch error and the P5 caveat on phone;
  - Repetera's "Bara ett delprov" behaviour.
- **Source mismatches (6):**
  - there is no `--sp-warn-soft`;
  - Bricolage numerals below 19 px are the built exception;
  - folding detail steps is already built;
  - Repetera's time aligned with Idag's 9 min;
  - `SparScaleMini` is new B2 work, and `.sp-caveat` is 12.5 px;
  - "Läsförståelse" (Spår's `SECTION_NAMES`) replaces the live app's "Svensk läsförståelse" everywhere.
- **Wireframe numbers (8):**
  - the pile left after a round is 17, not 15;
  - least-seen exposure;
  - LÄS · 2 redo;
  - the stop named in an example is now a miss (question 15);
  - the week dots;
  - ribbon labels moved under the bar;
  - one consistent Wednesday Provpass (53 min) matching Idag's fixture (ORD and Repetition yesterday, NOG Wednesday);
  - the sitting is "Hösten 2025" throughout.
- **Builder confusion (8):**
  - stop variants (ring hue, glyph + word, outline) and the Provpass "obesvarad" defined in §1.2;
  - `SparSkeleton` and `SparAnswerBar` named and given to B1;
  - `SparStation`'s users corrected;
  - the English citation work moved to a Spår-local `sparCites.ts`, so the shared kit stays untouched;
  - the wireframe legend's markers disambiguated (`•` current, `°` Öva's dot, `[◉]` pressed, `[[ … ]]` the phone's green pill);
  - one name per thing ("i kön" vs "dagens hög" made distinct, the practice labels per entry kind, "Tillbaka till Öva", "Blandad övning · ca 9 min");
  - screen 13's `/mer` anchor, `SparDialog` and `SparStepper` uses;
  - Framsteg's opened rows marked quiet.
- **Copy language (3):**
  - the cloze fallback shows "Lucka n", never the English "Gap (n)";
  - English words inside the gap slot's spoken Swedish carry `lang="en"`;
  - "gratis dogfood" is flagged as open question 16.

Before the review, these were also replaced on the author's own pass:
- the invented quant and DTK examples, with real questions (`host-2025-kvant1-XYZ-002`, `KVA-014`, `NOG-024`, `DTK-030`);
- a non-existent sitting ("Våren 2021") in a wireframe;
- the DTK round size of "8–13" taken from a stale code comment (the code appends whole pages until ≥ 10, so 10–13).

## Verification

- A document only: no code, so no tests or build were run.
- **No placeholders:** `grep` for `<!--`, `TODO`, `TBD` and `XXX` over the spec finds none.
- **Requirements:** every screen section has purpose and one action, desktop and phone wireframes, components, states, navigation, ADHD-PI, accessibility and "Unmistakably Spår". This was checked by hand and by the reviewer.
- **Cross-references:** the open-question numbers cited inside the screens point at the right questions in §5: 1 goal, 3 schedule data, 4 data asks, 5 marking, 6 weekly goal, 7 sitting, 8 palette and voice, 12 tactic hint, 15 P5 in Provpass, 16 "dogfood". This was re-checked by `grep` after the review fixes.
- **Spot checks against the code:**
  - the section durations (`lib/sectionDurations.ts:12-19`);
  - the KVA and NOG fixed options in `app/public/data/host-2025.json` (32 lines per exam: 20 KVA + 12 NOG);
  - the 27 sitting files (there is no spring 2020 or 2021).

## Beads hand-off

- **Write:** exactly one one-line note, `/home/loucmane/gascity/bin/bd update hpf-qr0p.35 --append-notes "…SPECC DONE: hpf-qr0p.35"`. It succeeded on the first attempt.
- **Read-back:** `bd show hpf-qr0p.35 --json` returns:
  - the note as written, ending in `SPECC DONE: hpf-qr0p.35`;
  - status `in_progress`;
  - no new metadata.
- The bead is **not closed**, as the bead asks. The two files stay uncommitted in this worktree for the coordinator. No further routed work was claimed in this worktree, so these changes are not mixed with another bead's.

## Round 2

The Codex cross-vendor review of the round-1 spec (head `886c70d`, review bead `hpf-po55`) returned **HOLD** with three P2 design defects. Everything else passed. Round 2 fixes those three and nothing else.

### Snapshot and boundaries

- **Two sessions.** An earlier session (assignee `ci-wisp-6ivdmiz`) drafted the round-2 edits in both files, then stopped before its Beads hand-off: it wrote no note and did not park the bead. This session (assignee `ci-wisp-ypki10n`) was routed the same bead and found that draft uncommitted on `886c70d`. It checked the draft line by line against the brief and the code, kept what held, corrected what did not (see "Corrections in the second session"), and did the hand-off.
- **Claim.** In this session, `gc hook --claim --json` returned `hpf-qr0p.35` (assignee `ci-wisp-ypki10n`, route `hpfetcher/gc.implementation-worker`). `bd show hpf-qr0p.35 --json` matched the id, the status (`in_progress`), the assignee and `gc.routed_to`.
- **Checkout.** HEAD `886c70d` (the round-1 spec). The brief expected a clean tree. Instead, the two admitted files held the earlier session's uncommitted draft, and no other tracked file was modified. The sandbox's dotfile placeholders listed above are untouched.
- **Brief.** The bead's design field quotes the three defects with their line references. The review's own worklog sits in the vault (`/home/loucmane/vaults/…/hpf-po55.md`), which this sandbox cannot read, so the bead's text was the brief.
- **Write set kept.** Only `docs/redesign/directions/c-spar.md` and this worklog changed. There is no source change. Everything is **uncommitted**, and the bead is **not closed**.

### Source facts the fixes rest on

- `SparDrill.tsx` keeps the persistent surfaces non-modal:
  - on phone the reader's scroll (:1330) and the question sheet (:1341) are sibling elements, the sheet a plain `section` with an `aria-label`;
  - on desktop `DeskBody` (:423–458) puts the tray and the Facit sheet beside the reader's scroll the same way.

  The only `aria-modal` with a scrim in Spår is the phone account menu (`Spar.tsx:346–368`).
- `FeedbackBody` (`SparDrill.tsx:820`) renders the prompt and the explanation only. `cite` (`r1Kit.ts:630`) scrolls `paraEls.get(n)`, which holds only paragraphs a mounted `Reader` has registered. Without a mounted reading column a ¶ chip does nothing.
- `GET /api/mock-results` (`worker/src/routes/mockResults.ts:54–64`) returns the newest 50 and has no lookup by id. The client finds `/prov?result=<id>` by searching that list (`routes/prov.tsx:410`, then `ResultNotFound` at :493).
- Retention reaps finished sessions after 120 days (`worker/src/lib/retention.ts:21, :35`), and a result is deleted with its session (`worker/src/db/schema.ts:385`, `onDelete: 'cascade'`).
- `GET /api/sessions/history` (`worker/src/routes/sessions.ts:87–121`) reads the newest 200 finished non-Provpass sessions, keeps the completed ones and returns at most 50, with no cursor.
- `GET /api/sessions/:id/attempts` (`sessions.ts:133–150`) already reads one pass's questions and picks by its id, scoped to the user. The `?done=<id>` page rebuilds a pass from it (`components/session/SessionPlayer.tsx:550–578`).
- The persistent surfaces' own behaviour, as built in `SparDrill.tsx`:
  - `Tray` (:574–579) is a `section` labelled "Fråga n", and the desktop Facit sheet (`FeedbackSheet`, :725–730) is a `section` labelled by its verdict.
  - Esc only clears paragraph focus (:196).
  - Choosing an option opens the tray (:172–180) or the phone sheet (:1261–1266), and a ¶ chip lowers the desktop sheet to 40 % (`SHEET_PCT`, :358; :412–416).

### The three fixes

Line numbers are *was* (at `886c70d`) → *now* (the working tree).

1. **The tray and Facit are non-modal** (was :207 and :251).
   - §1.8 "Sheets" became **"Sheets: persistent or modal"** (was :206–208 → now :206–220).
     - **Persistent reading surfaces:** the desktop tray, the phone question sheet and `SparAnswerBar`, and Facit (desktop, phone and the review's). They are siblings of the reading column, as built, with no scrim, no focus trap and no `aria-modal`. The passage, problem, figure, exit, tools and clock stay reachable by pointer and keyboard. Nothing outside closes them, and neither does Esc; only their own controls change their height. The column's keys keep working.
     - **Modal layers** are named: menus, choices and filters, dialogs (confirmations, a glossary term), and the full-screen figure viewer. Only they trap focus and close on a press outside them. Like an in-place card (§1.9), they also close on Esc and return focus. On phone only the modal sheets have a scrim.
   - §1.12 Focus (was :251 → now :263) and done-checklist item 6 (was :2126 → now :2208) say the same.
   - The one sentence that put a trap on a reading surface, screen 10's "The review sheet traps focus" (was :1327), now says the review's Facit is non-modal (now :1404).
2. **Review shows the question's context** (was :1260, :1288 and :1450).
   - A new **`SparReview`** block on screen 10 (now :1299–1361) defines review as the question's own screen in its graded state, read-only, opened from the result and from Historik's pass page:
     - **Frame:** a focus screen with "✕ Stäng", which returns focus to the stop or green pill that opened it, and the misses' stig ("Miss 3 av 9") or the pass's ("Fråga 3 av 6"). It has no clock, "Svara", strike or "Taktik".
     - **Context:** LÄS/ELF get the whole reading card with cited paragraphs and graded gap slots; quant, ORD and MEK the problem card with its figure; DTK the page on its mat with its tools. There is no tray, and a blank reads "Obesvarad".
     - **Facit:** the non-modal practice sheet with a review foot. "Nästa miss ↵" is the green pill, then "Tillbaka till resultatet ↵"; from a pass page it is "Nästa ↵", then "Tillbaka till passet ↵".
     - **Citations that land:** the reading column and Facit are mounted together, so ¶ chips, "Visa uppgiften" and "(steg n)" links act on this screen. While the context loads or fails, the chips show as plain text.
     - **Figures:** "Förstora" and "Visa figuren" open `SparFigureViewer`, whose answer strip becomes a verdict strip.
     - **URL:** `&q=<n>` keeps the place across a reload and browser back.
     - **Wireframes:** desktop and phone, with the phone flow from a leg's sheet.
   - Screen 10's stop and pill text (was :1260 → now :1272), "The one action" (now :1222), "Every question" (now :1232), the phone leg line (now :1297), Components (was :1288 → now :1364, :1369) and Navigation (now :1388) point at the review.
   - Screen 11's pass page (was :1450 → now :1531–1532) lists the questions with their verdicts, and each opens `SparReview` at `/historik?pass=<id>&q=<n>` on desktop and phone. Facit no longer unfolds inside the list. "A pass opened" (now :1457) and Components (now :1589, :1595) follow.
   - Consistency edits that follow from the same fix: §1.8's top bar names "Stäng" as the review's exit, beside "Avsluta" and "Avbryt" (now :190). §2 lists the review among the focus screens (now :305), and its map and table say "review", not "review sheet" (now :317, :337). §4's inventory names `SparReview` for B2 (was :2114 → now :2196) and adds screen 11 to the reused B1 parts (now :2188–2189).
3. **The 50-row cap is not retention** (was :1300, plus the older-history flow at :1368 and the pass page at :1454).
   - Screen 10's states (was :1300 → now :1376–1377) are rewritten around the facts above.
     - **"Not found"** shows only on confirmed absence: a lookup by id, or a list of fewer than 50 rows, which holds everything, fetched as the page opens (a cached list can predate the result). A result opens from data in hand or by its id. The copy is "Det här provpasset finns inte längre. Provpass sparas i 120 dagar."
     - **A new "Not in the current list" state** covers a result missing from a full list while no lookup exists. It is never called gone: "Det här provpasset finns inte bland dina 50 senaste, så det kan inte visas här än."
   - Historik (was :1368 → now :1445–1449):
     - Passes are kept for 120 days.
     - "Visa äldre pass" needs paging from both lists.
     - The merged list stops at the newer of the two lists' oldest rows, so no pass above the stop is missing. A day the stop cuts through ends there, with the list's end straight after it.
     - Until paging exists, the list ends with the conditional line "Har du äldre pass än de här kan de inte visas ännu." unless both lists are known to hold everything. The practice list cannot tell by its length, because of the 200-session scan.
     - An older pass or result opens from its row or by id, never reported as gone for being old.
   - The pass page's "not found" (was :1454 → now :1536) shows only when the lookup by id confirms the pass is gone.
   - Open question 4 (now :2225) adds the data ask: paging that says whether more exist, a lookup by id of a Provpass result, and a practice pass's kind, section and times by its id. Its questions and picks already come by id.

### Corrections in the second session

This session's changes to the draft. Each stays inside one of the three fixes and rewrites text within its own line, so no line moved, and the line numbers above hold for the final text.

1. **:210 (fix 1).** The controls that change a persistent surface's height now include choosing an option and the "Visa uppgiften" chip. The built tray and phone sheet open when an option is chosen (`SparDrill.tsx:172–180`, :1261–1266), so the draft's "only" list was incomplete.
2. **:218 (fix 1).** "Only these … close on Esc" contradicted §1.9 and screens 5 and 9, where a non-modal in-place card also closes on Esc. "Only" now covers what the brief reserves for modal layers: the focus trap and closing on a press outside.
3. **:190, :1300, :1404 (fix 2).**
   - §1.8 names "Stäng" as the review's exit, beside "Avsluta" and "Avbryt".
   - "Stäng" returns focus to the stop or the green pill that opened the review. The draft covered only a stop, but "Gå igenom missarna" opens the review too.
4. **:1376–1377 (fix 3).** Absence is confirmed only by a list fetched as the page opens, because a cached list can predate the result (for example, a pass handed in on another device).
5. **:1447 (fix 3).** The draft promised "No day is shown with some of its passes missing", but its own stop rule can fall inside a day. A day cut by the stop now ends there, with the list's end straight after it.
6. **:1448 (fix 3).** The end line shows on every list until paging exists, because the practice list can never prove it holds everything. Worded "Pass som är äldre än de här kan inte visas än.", it told a new user with three passes about older passes they do not have. It is now a condition: "Har du äldre pass än de här kan de inte visas ännu."
7. **:2225 (fix 3).** Open question 4 no longer implies that a practice pass cannot be read by its id. Its questions and picks already can be (`GET /api/sessions/:id/attempts`, which `?done=<id>` uses). What is missing is its kind, section and times.

### Verification

- **Scope:** `git diff --stat` touches only the two admitted files. Every changed spec passage belongs to one of the three fixes above.
- **Source facts:** this session re-read every file and line cited above.
- **Leftovers:** `rg` for "review sheet", "review mode", "folding facit", "50 most recent", "only the 50", the old end line and "No day is shown" finds nothing. The remaining focus traps are all on modal layers: `SparDialog` (abort, hand-in, the phone rules sheet, import), the menus and the figure viewer.
- **Wireframes:** this session's corrections touch prose lines only.
  - `rg -n "^.{97}$"` confirms all 18 rows of the desktop review wireframe (:1320–1337) are 97 characters, like the other desktop focus wireframes. The earlier session found the fade row one character short and fixed it.
  - An anchored `rg` confirms every phone review row (:1342–1358, borders included) closes its frame at column 40.
- **The worked example adds up.** The review's stig (↻ ↻ ③ ○ ↻ ↻ ○ ↻ ↻) matches the result's switchback: misses at questions 4, 11, 15, 17, 20, 23, 33, 36 and 39, seven wrong and two blank, with miss 3 at question 15 (LÄS). The legs' 9 + 6 + 9 + 7 make "31 av 40 rätt".
- **No placeholders:** no `TODO`, `TBD` or `XXX` was added.

### Not changed (outside the three fixes)

- The full-screen figure viewer (screen 7) covers the top bar, so during a running Provpass the clock is out of view while the viewer is open. This predates round 2 and was not part of the review. It is noted here for the coordinator, not changed.
- Open question 4's ask for a Provpass result's per-question picks ("today the result keeps only ids") stands, with one nuance for the data bead (`hpf-qr0p.7`):
  - The picks of answered questions can already be read through the result's session (`GET /api/sessions/:id/attempts` with the result's `sessionId`).
  - The blanks and the pass's order cannot. `missedQids` holds wrong answers only (`app/src/lib/mock.ts:291`), and no read endpoint serves an ended session's plan.

  Noted, not changed.

### Beads hand-off

- **Note:** exactly one one-line note, `/home/loucmane/gascity/bin/bd update hpf-qr0p.35 --append-notes "…SPECC2 DONE: hpf-qr0p.35"`. It succeeded on the first attempt.
- **Park:** `bd update hpf-qr0p.35 --status deferred --assignee ""` succeeded on the first attempt.
- **Read-back:** `bd show hpf-qr0p.35` shows the status `DEFERRED` and the note as written, ending in `SPECC2 DONE: hpf-qr0p.35`.
- **Not done:** the bead is not closed and nothing is committed. The coordinator commits the two files. No further routed work was claimed in this worktree, so these changes are not mixed with another bead's.

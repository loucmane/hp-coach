---
bead: "hpf-qr0p.33"
project: "hpfetcher"
session: "ci-wisp-tazy7v9"
status: "implemented_uncommitted"
---

# Worklog — hpf-qr0p.33

Redesign round 2, direction **A · Folio**, batch **B0**: the screen design spec for screens 5–14. The three build batches extend Folio across the whole app:
- **B1:** Öva, Kvantfråga, DTK, Repetera.
- **B2:** Provpass, Provpassresultat, Framsteg with Historik.
- **B3:** Uppslag & lektion, Konto & inställningar, ELF-läsfråga.

This bead is document only. The deliverable is `docs/redesign/directions/a-folio.md`.

## Snapshot and boundaries

- **Claim.** `gc hook --claim --json` returned `hpf-qr0p.33` (assignee `ci-wisp-tazy7v9`, route `hpfetcher/gc.implementation-worker`). `bd show hpf-qr0p.33 --json` matched the id, the status (`in_progress`), the assignee and `gc.routed_to`.
- **Checkout.** Branch `codex/hpf-qr0p.33-redesign-round-2-direction-a-folio-b0-screen-design-spec-for`. HEAD = `origin/main` = `gc.worktree_base_sha` = `b777074def8517fb7a3053fb103524a6eb57ba90`.
  - No tracked file was modified at the start.
  - The untracked root dotfiles (`.bash_profile`, `.bashrc`, `.gitconfig`, `.gitmodules`, `.idea`, `.mcp.json`, `.profile`, `.ripgreprc`, `.vscode`, `.zprofile`, `.zshrc`) belong to the sandbox and were not touched.
- **Constraints kept.**
  - **Write set.** Writes stayed inside the bead's write set: `docs/redesign/directions/a-folio.md` (new; the `directions/` folder is new with it) and this worklog.
  - **Uncommitted, not closed.** No source change and no git write. The changes are left uncommitted. The bead is **not** closed, as its delivery rules say.
  - **Read-only research.** All research was read-only. The subagents were briefed not to write, and the final `git status` shows only the two files.
  - **Network.** None.
- **Check script.** `gc.check_path` is `/home/loucmane/gascity/home/cache/repos/954ed14987da288bfb98feee4cdab5043a44de1a8a9cf47afaaa0ce6e438fd5f/gascity/assets/scripts/checks/build-artifact-valid.sh`, sha256 `71f17450e127055c8304a3cb44ce87b2439abe04ba41f225c7b386be3dc73911`. The bead names no validator, so I did not run it.

## Deliverables (uncommitted)

| Path | What |
|---|---|
| `docs/redesign/directions/a-folio.md` | The spec. See its sections below. |
| `docs/worklog/hpf-qr0p.33.md` | This worklog |

The spec's sections:

| § | Contents |
|---|---|
| §1 | Folio's language as rules every batch follows: material and structural devices, tokens, type and numerals, the page grammar, controls and the one-filled-button rule, motion, the five state patterns, frame and focus screens, the accessibility and ADHD-PI baselines, and the fifteen round-1 critiques not to repeat |
| §2 | Screens 5–14. For each: purpose and primary action, desktop and phone ASCII wireframes, reuses and new components, states, navigation, ADHD-PI, accessibility, "unmistakably Folio" |
| §3 | Shared plumbing: the stage's screen keys, data needs marked New, the drill-view seam, the shared parts file, wiring changes to the round-1 screens |
| §4 | The component inventory per batch |
| §5 | Eighteen open questions for the owner |

## Method

1. **Folio's source, read in full:** `meta.ts`, `Folio.tsx`, `FolioHome.tsx`, `FolioDrill.tsx` and all 3,028 lines of `folio.css`. From it I took the token set, the type scale, the component vocabulary, and which tokens and classes are declared but unused (`--fo-accent-2`, `--fo-ok-soft`, `--fo-bad-soft`, `--fo-r2`, `.fo-quiet-btn`).
2. **The brief and the round-1 worklog** (`docs/worklog/hpf-qr0p.md`). Every reviewer critique is folded into §1.11 and the per-screen rules. Also read: the P5 infold design (`docs/p5-infold-design.md`, Amendment 1), for the ÖVNINGSTEXT copy, the estimate caveat and the retirement copy.
3. **The real screens, through six read-only survey subagents in parallel**, one per area:
   - Öva and Repetera;
   - the quant and DTK drill;
   - Provpass;
   - Framsteg and Historik;
   - Uppslag and Konto/Mer;
   - ELF.

   Each returned the displayed data, every state with its verbatim Swedish copy, the navigation in and out, the keys, desktop against phone, and the quirks, with file:line references. The spec quotes the real copy where it is good, and marks every departure.
4. **One independent read-only reviewer** checked the finished spec against the Folio source, the brief and the round-1 critiques. Its findings and what I did with them are recorded below.

## Survey findings that changed the brief

- **Framsteg** has no calibration caveat and no range on its prognosis, and no traps. **Historik** excludes Provpass. The goal is hard-coded to 1,8. The spec adds the caveat (Amendment 1 requires it), a trap register and the passes.
- **Öva** has no options and no grouping. Every drill is ten questions with no clock, and DTK sets are 10–13, because figure pages are never split. The hot-trap offer is unreachable from Öva.
- **The live drill answers on the first tap.** It has no strike, no exit control, an unbound Esc and no visible timer. The `technique` and `pitfall` fields are never rendered, and detail steps are not folded.
- **DTK figures** are whole printed booklet pages (JPEG): 218 pages carry 648 questions. Eleven items have image options.
- **ELF:**
  - nothing in the app carries `lang="en"` today;
  - ELF explanations are **English** by policy;
  - the round-1 kit's citation rules are Swedish-only;
  - P5 gap texts use `___(n)___`.
- **Uppslag** is organised by section: 221 entries of three kinds (traps, protocols, word roots), with no per-section read progress.
- **There is no setting** for the exam date or the goal anywhere, though Folio's round-1 slip promises "Provdatum och mål".

## Key design decisions (all in the spec, several put to the owner in §5)

- **One page grammar for every frame page,** taken from Idag: masthead, title and standfirst, lead under the heavy rule, contents lists with leader dots, marginalia.
- **Five named state patterns:** "sättning" skeletons, the blank page, partial data with footnotes, the erratum, the colophon.
- **The filled button follows the reader's choice.** There is never a second one. Konto and Historik are the two documented pages without one, and ↵ never fires a destructive act.
- **Quant: a single page that opens into a spread on Svara,** so the problem stays beside its facit. KVA's two quantities sit side by side. NOG's statements hang in the margin like ¶ numbers. The two-step answer is kept.
- **DTK: a persistent plate** on the verso, with a paper-coloured zoom viewer. In dark mode the plate stays a white print and is never inverted.
- **Provpass:**
  - a printed exam notice ("Anmälan.", kallelse, register);
  - modal slips instead of browser `confirm()`;
  - a thumb-index strip for the 40 questions;
  - word milestones instead of a red clock.
- **Provpassresultat leads to the review of the misses,** where today it is a dead end.
- **Framsteg** argues for one action. Practice days are counted per week, with no streak. **Historik** is a week-grouped ledger that includes passes.
- **Uppslag is a spread:** contents on the verso with the ribbon at the bookmark, the entry on the recto.
- **Konto & inställningar:** one imprint-style page replacing three.
- **ELF:**
  - the reading spread with language attributes and English typography;
  - gap texts with ruled blanks, the chosen word pencilled in, and the gap's sentence quoted beside the options;
  - a shared-kit English citation mode as a stated dependency.

## Live-app defects observed during the survey (read-only; for the coordinator)

The spec designs these out where they touch Folio's screens. They are listed so they can become beads if wanted. Each was reported by a survey subagent with file:line evidence; I did not re-verify every line.

**Öva and Repetera**
- **Counts and offers:**
  - the hot-trap offer never appears from Öva (`start=true` skips the start screen);
  - "N väntar" sits on a chip that starts a new drill;
  - the aria-disabled "Kön är tom" CTA still navigates.
- **Session identity:**
  - a mixed drill is saved and shown as ORD, so resume can swap mixed and ORD;
  - Repetera's start screen shows empty-state copy while loading;
  - its fallback is hard-coded to ORD;
  - the section scope is lost on finish and resume.
- **False copy:** the leave sheet says "Dina svar hittills sparas inte." although answers are saved, and "esc avbryt" is advertised but Esc is not bound.
- **Phone:** no visible exit during a pass.

**Drill**
- **Input:**
  - `e` on a four-option question records a wrong answer;
  - keys leak through the figure zoom.
- **Feedback:**
  - an explanation fetch error removes the verdict;
  - the framework chip shows raw ids;
  - no auto-scroll to the verdict on phone.
- **DTK:** the shared DTK page re-mounts on every question.
- **Wording:** "Avsluta" means both finish and abandon.
- **Palette:** ⌘K lacks a DTK drill.

**Provpass**
- **Hub:**
  - loading and error show the permanent "Inga riktiga pass tillgängliga …";
  - Home's start opens a second, targetless confirm sheet;
  - exposure numbers are not refreshed.
- **Running pass:**
  - the grid's labels are wrong (SVE, MEN, ENG, MAT, DIA, and KVA for both KVA and NOG);
  - `e` is accepted on four-option questions;
  - "1 frågor";
  - browser `confirm()` dialogs;
  - no time-out message;
  - a failed submit is stuck with no retry;
  - resume and void are silent;
  - no resume cue anywhere.
- **Result:**
  - the sitting, total time and ending are not shown;
  - sections are alphabetical;
  - history shows the linear score for authentic passes;
  - budgets are not scaled for short passes;
  - no actions, and a dead end on phone.

**Framsteg and Historik**
- **The numbers:**
  - three different prognosis formulas;
  - "week" is the last 7 × 24 h in UTC;
  - "2:e" ordinals, and "1 dagar";
  - the stub sentence "Den här veckan.";
  - the caption claims dashes that may not be drawn;
  - the expanded heat view samples 3 of 7 days;
  - the Fokus rank wording can be wrong;
  - "N att repetera nu" is not a link.
- **States:**
  - the error prints four times;
  - a one-half user gets the new-user invitation;
  - the `h1` is the number.
- **Historik:**
  - it excludes Provpass and shows raw tags such as "ar:DTK:DTK-TACTIC-004";
  - an error renders as empty;
  - back goes to Home and no nav item is current;
  - a 5-minute cache can hide a just-finished pass.

**Uppslag, Konto, Mer**
- **Navigation:**
  - the phone tab bar does nothing on `/lektion`;
  - deep links open entries only for traps;
  - LÄS framework links are broken ("LAS");
  - MEK labels show raw ids;
  - Home's lesson links land on the hub;
  - example-question links drop the section and show debug copy;
  - a missing example id shows "(laddar…)" forever.
- **Settings:**
  - there is no exam-date or goal setting;
  - font and density are unreachable (a loop through ⌘K);
  - `/mer` and `/konto` don't link to each other, and Logga ut is only in Home's menu;
  - a failed setting save reverts silently;
  - deletion needs an exact-match "radera";
  - the identity fallback is a hard-coded sample name;
  - help and legal pages drop the app's navigation.

**ELF**
- **Language:** there is no `lang="en"` anywhere.
- **Drill content:**
  - drills pick ELF questions singly, so a ~700-word text can appear for one question;
  - the live drill would not recognise P5 gaps `___(n)___` (already a PR4b item).
- **Parser artefacts in authentic ELF:** lost paragraph breaks, bylines as paragraphs, a wrong passage on `host-2025-verb1-ELF-032`, and a mirrored watermark.

## Reviewer pass

An independent read-only reviewer checked the first full draft against Folio's source, the shared kit and fixtures, the brief and the round-1 worklog. It reported 21 issue groups, the first six serious enough that a batch would have built them wrong. All were applied.

1. **ÖVNINGSTEXT and the question number shown twice.** This repeated two round-1 fixes.
   - On desktop the badge now lives in the running head only.
   - On phone it follows round 1's rule: above the passage, and in the slip only once it has scrolled away.
   - On phone the slip names the question and the head does not; single pages without a slip name it in the head.
2. **The phone quant verdict sat below the graded options.** It is now inserted above them, in round 1's order, and the page scrolls to it.
3. **Batches depending on later batches.** Moved to B1, so B2 and B3 only extend:
   - the dialog primitive;
   - the drill-view seam and the conversion of the round-1 reading drill to it;
   - the ELF language wrapper;
   - the readable framework-name helper;
   - the plain gap mark;
   - the NOG citation rule, flagged as a shared-kit change.

   The stage's screen 5–14 change now has an owner: a shared enabler bead, as hpf-qr0p.2 was for round 1b.
4. **Each fact said once.** Repeats removed on every hub: masthead meta, standfirsts, button hints, margin notes, the shortcut list. The frame's own count is declared chrome.
5. **Sizes.** Hub leads get a new `.fo-lead-title` at `t44` (phone `t32`) under a `t32` title. `.fo-resume-title` stays Idag's. On the lesson spread, the chapter title is `t32` and a word root is the only `t44`.
6. **The filled button.**
   - The "follows your choice" example is now screen 9's register.
   - Historik and Konto are the two documented pages without one.
   - Repetera's empty section-only state gets **Repetera hela kön**.
7. **Destructive acts never fire on ↵.** Abandon, import and reset have the safe choice filled. Deletion uses a new `.fo-btn--grave` that only the typed confirmation enables.
8. **Announcements.** §1.9 now lists every allowed announcement. The verdict is announced by moving focus to it, once.
9. **Wrong code claims corrected:**
   - the spread's maximum is 0.68, and a start-width prop is new;
   - footnotes are 12 px;
   - the exact space steps;
   - the slip's heavy rule sits under its heading;
   - the trap code's weight is 500;
   - the margin is a plain `div` and the phone page has no `main` (both are now new requirements);
   - `.fo-seg` is a fixed three-column grid (B2 changes it);
   - the wrong-quotation underline uses `--fo-bad`;
   - `Scale` and `KeyHints` are hard-wired (both get parameters);
   - plan rows open the Öva page in round 1's code, not in the live app.
10. **Example data made consistent:**
    - Framsteg's first suggestion is ORD (lowest and falling);
    - the pass has six wrong answers in Repetera and three blanks;
    - Repetera's per-section counts sum to its 23;
    - the nav count is the ready-now count (open question 18).
11. **The lesson spread marks the open entry once,** with the ribbon (it is the bookmark).
12. **Practice days show filled dots only,** headed "Övningsdagar". Missed days are not drawn.
13. **Missing parts added:**
    - the Historik and Uppslag-hub phone wireframes;
    - DTK's empty, not-found and loading states;
    - the running pass's loading state, the hand-in slip with nothing unanswered, and wireframes for the overview, hand-in and abandon slips;
    - the KVA table wireframe;
    - ELF's own full states and navigation;
    - Öva's paused-repetition state;
    - "done does not apply" on Framsteg and Konto.
14. **Cross-references, wiring and the inventory corrected.** Added: Idag's recent-pass rows as links, its lesson row opening the entry, the Fällor sub-page, and the trap register's place.
15. **Swedish copy** corrected in sixteen places; the verb table gained Starta and Öva; spell-out and figure rules were made consistent.
16. **Wireframe notation:**
    - separate marks for ghost buttons, progress lines, range bands, gaps, the verdict glyph and elisions;
    - no back link in a peek;
    - gaps show the pencilled word.
17. **Ambiguities resolved:**
    - the quant spread's motion (a FLIP move, no slide back);
    - the five-minute warning (opacity only);
    - skipping in a pass;
    - a running pass outranks a paused text on Idag;
    - headings (`h1`) on the focus screens and the lesson spread;
    - 320 px reflow of the result table;
    - authentic ELF before the P5 switch;
    - an already-read entry's button;
    - the verso's quiet duplicate.

The reviewer's list of what should not change was kept intact.

**Re-review** (the same reviewer, resumed with its context, on the revised spec).
- **Result:** 13 of the 21 groups resolved, 8 partly resolved, and 5 new problems, three of them blockers. Its verdict at that point was "Ready for the batches: no".
- **A final pass applied every item:**
  - **Fällor sub-page.** It now has its required parts: title, standfirst, a lead with a filled button, loading, error and empty states. It reuses Historik's wireframes.
  - **Lesson landmark.** Only the lesson's Innehåll list is a `nav`, so the `h1` sits in `main`. The ribbon adds no duplicate screen-reader text.
  - **"Starta"** is redefined to match the hub, where it opens the conditions and "Starta nu" starts the clock.
  - **"Largest item" rule** is limited to hubs. Spreads and focus screens use their `t32` title, and a word root is the only exception.
  - **Öva's lead** headlines the round ("Tio missar, ungefär 12 minuter"), and the backlog moves to the small line.
  - **Facts said once.** The goal value appears once on Framsteg, and DTK's 10–13 is stated wherever "tio frågor" was.
  - **"10 av 23"** follows the same-form rule for numbers in one comparison, which is now in §1.3.
  - **Copy fixes:** the live strings quoted correctly, "åtta minuter", and "Lämna in"'s count in the slip's head.
  - **Kortkommandon:**
    - the shortcuts list is complete and anchored;
    - the account slip's Hjälp opens it;
    - screen 12 points there;
    - the running head's button is a ghost.
  - **Navigation and inventory.** Screen 9 lost a wrong way in, and the §4 rows list screen 10's review.
  - **ELF:** the authentic-unit wording and the phone wireframe's choice and echo.
- **Not checked again.** This last pass was not re-reviewed a third time. A batch that finds a contradiction should follow §1 and note it.

## Verification

- Document only: nothing to build or test.
- Checks run on the spec:
  - every `§` and "screen N" reference resolves;
  - no box-drawing characters in the wireframes (ASCII structure; Swedish letters and the UI's own glyphs ↵ ¶ ⁂ · – are content);
  - every screen 5–14 has the eight required parts and both wireframes (`grep` counts: ten of each heading).
- **Wireframe widths.** A scratch script (outside the repo) measured every boxed wireframe line.
  - About 120 lines were off by one to four characters, mostly margin rows one wider than their border. A padding script and a list of exact, verified replacements fixed them.
  - The 23 that remain are intentional: two annotations beside a box, and side-by-side phones of unequal height in one block.
  - The check was re-run after the final pass, with the same 23.
- `git status --porcelain` at hand-off lists only the two files in the write set, plus the untouched sandbox dotfiles.

## Beads hand-off

- Write: `/home/loucmane/gascity/bin/bd update hpf-qr0p.33 --append-notes "…"`, one line ending `SPECA DONE: hpf-qr0p.33`. No close, as the delivery rules say.
- **Result:** it succeeded on the first attempt. `bd show hpf-qr0p.33 --json` reads back:
  - the note, ending `SPECA DONE: hpf-qr0p.33`;
  - status `in_progress`;
  - assignee `ci-wisp-tazy7v9`.
- `git status` at hand-off: only the two write-set files are new and uncommitted, beside the untouched sandbox dotfiles.

SPECA DONE: hpf-qr0p.33

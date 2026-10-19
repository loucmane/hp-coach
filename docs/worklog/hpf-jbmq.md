---
bead: "hpf-jbmq"
project: "hpfetcher"
session: "ci-wisp-dzihu3c"
status: "implementation_complete"
---

# Worklog — hpf-jbmq

## Findings

- 2026-10-19: branch
  `codex/hpf-jbmq-hide-the-ord-practice-this-root-link-when-an-entry-has-no-ex`
  at base `22384725d31273114241cffd34afb960dde5508e` (origin/main). The tree
  was clean.
  - Inside the command sandbox, `git status` also lists untracked dotfiles
    (`.bashrc`, `.gitconfig`, `.mcp.json`, `.vscode`, …). They are `/dev/null`
    bind mounts from the sandbox (character device 1,3), not files from this
    change, and are left untouched.
- **The card had two copies of the link, not one.** Both render
  "Öva ord med denna rot →" and both open `/drill?section=ORD&framework=<id>`:
  - the footer `<Link>` the brief names (was `:141-155`);
  - the `PracticeLink` in `<summary>` (was `:92-96`). It is the copy shown
    while the card is collapsed. `index.css:577` hides it once the card is
    open, and then the footer copy takes over.

  Hiding only the footer copy would leave the collapsed card linking to the
  same empty drill. The red run below confirms both copies are rendered: the
  empty-list test found **2** links.
- The drill plays only the entry's `example_questions`
  (`drill.tsx:540-551`, `pickFrameworkQuestions`). An empty or missing list
  returns `[]`.
- Today no framework file has an empty list: `grep '"example_questions": \[\]'`
  over `frameworks/` and `app/public/` finds nothing. The hidden state only
  shows up in the app once hpf-7og2 empties ORD-ROOT-016 (med-).

## Decisions

- **One condition, `hasExampleQuestions`** (`LexiconCard.tsx:31`). It is the
  same expression the example-questions block already used, and it gates
  three things:
  - the summary `PracticeLink` (`:98-104`);
  - the `ExampleQuestions` block (`:136`, behaviour unchanged);
  - the footer link (`:147-163`).

  So practice is offered exactly when the card has example questions to show.
- **The condition is "at least one id"**, as the brief asks. It does not repeat
  the drill's own drillability filter, because that would need the question
  bank inside the card. See "Other candidates".
- **Read pill unchanged.** It still renders whenever `onToggleRead` is passed,
  and `LessonReader.tsx:308-313` always passes it.
- **No footer style change.**
  - Without the link, the pill is the row's only flex item. With
    `justify-content: space-between`, a single item falls back to
    `flex-start`.
  - So the pill sits at the left edge of the reading column, under the
    "Exempel" chips. That is the same spot it already takes when the row
    wraps on a narrow screen.
  - Pushing a lone pill to the far right would look like a gap where
    something is missing.
- **Not added:** a guard that drops the footer row when there is neither a
  link nor `onToggleRead`. No production caller passes that combination. The
  only effect of the empty row would be its 24 px top margin, since a flex
  row with no children has no height.

## Changes

- `app/src/components/lesson/LexiconCard.tsx` (+31/−23, mostly
  re-indentation):
  - adds `hasExampleQuestions`, with a comment explaining why;
  - renders the summary `PracticeLink` and the footer `Link` only when it is
    true;
  - reuses it for the `ExampleQuestions` guard.
- `app/src/components/lesson/LexiconCard.test.tsx` (new, 73 lines), two tests.
  - Setup:
    - The router `Link` is stubbed to an `<a>` whose `href` is built from
      `to` + `search` (the RecentPassesCard.test.tsx stub, plus the href).
    - `ExampleQuestions` is stubbed to a marker, because the real one loads
      the whole question bank.
  - Entry with example questions: both practice links have href
    `/drill?section=ORD&framework=ORD-ROOT-016`, the examples block renders,
    and the read toggle is present.
  - Entry with `example_questions: []`: the "Markera som läst" button is still
    there, and none of these render:
    - a link named "Öva ord med denna rot →";
    - the `lesson-practice-link` element;
    - the examples block.
- `docs/worklog/hpf-jbmq.md`: this file.

## Verification — 2026-10-19 (offline, from `app/`)

- **Red first** (new test, unchanged component):
  `vitest run src/components/lesson/LexiconCard.test.tsx` → exit 1.
  ```
  × shows no practice link for an entry without example questions, but keeps the read toggle
  AssertionError: expected [ <a …(4)></a>, <a …(2)></a> ] to have a length of +0 but got 2
   Test Files  1 failed (1)
        Tests  1 failed | 1 passed (2)
  ```
  The two anchors are the summary `PracticeLink` (4 attributes) and the footer
  `Link` (2 attributes). The populated-entry test also passed before the
  change, because it pins existing behaviour.
- **Green** (same file, after the change):
  `Test Files  1 passed (1)` / `Tests  2 passed (2)`.
- **`pnpm typecheck`** (`tsc -b --noEmit`): PASS, exit 0, no diagnostics. This
  lane has `worker/node_modules`, so the hpf-l3ws environment failure does not
  occur here.
- **`pnpm lint`** (`biome check src`): PASS, exit 0.
  - Output: "Checked 419 files … No fixes applied. Found 4 infos."
  - All 4 infos were already there, in `src/components/devbake/*`:
    `LandingBakeoffR3.tsx:452`, `LandingBakeoffR4A.tsx:438`,
    `LandingBakeoffR4C.tsx:362` and `l12/M3.tsx:1060`. None are in the touched
    files.
- **`pnpm test`** (`vitest run`): PASS.
  `Test Files  91 passed (91)` / `Tests  1062 passed (1062)`.
- **`git diff --check`**: clean. HEAD is still `2238472`, and nothing is staged
  or committed.
- **Not done: a visual render.** The lane is offline with no dev server, and no
  current entry has an empty list. Once hpf-7og2 lands, check by expanding
  med- on `/lektion?section=ORD`:
  - there is no öva link, collapsed or open;
  - "Markera som läst" sits at the left of the footer row.

[S:ci-wisp-dzihu3c|W:hpf-jbmq|H:implementation-verification|E:2238472 + uncommitted lane diff; red-first 1 failed/1 passed → 2/2; pnpm typecheck PASS; pnpm lint PASS (4 pre-existing infos); pnpm test 1062/1062]

## Other candidates (not edited)

- **TrapCard and ProtocolCard have the same unconditional pair**: a summary
  `PracticeLink` plus a footer `Link` (`TrapCard.tsx:110,212-226`,
  `ProtocolCard.tsx:130,211-225`).
  - Both already hide `ExampleQuestions` when the list is empty.
  - No entry is empty today, so the problem is latent.
  - If a NOG/KVA/XYZ/DTK/MEK/LÄS/ELF entry is ever emptied, the same gate
    would apply there.
- **Ids that resolve to nothing drillable.**
  - `pickFrameworkQuestions` keeps only questions with
    `parsing_status === 'complete'` and options.
  - So a non-empty list made only of other ids would still show the link and
    open an empty drill.
  - Closing that gap would need either the bank resolved inside the card, or a
    pipeline check that every `example_questions` id is drillable.

## Handoff

The change is complete in the lane and left uncommitted and unstaged:
`LexiconCard.tsx`, the new `LexiconCard.test.tsx`, and this worklog. No
dependencies, servers, network, framework JSON or git writes were used, and
the Bead is not closed.

## Bead note

ORD LexiconCard: both copies of the "Öva ord med denna rot →" link now render
only when `example_questions` is non-empty. One is the collapsed-summary
PracticeLink and one is the footer Link; both open the same drill. The read
pill stays, alone at the footer's start. The new LexiconCard.test.tsx was red
first (the empty-list test found 2 links) and is now 2/2. `pnpm typecheck` and
`pnpm lint` pass, and `pnpm test` passes 1062/1062. Changes are uncommitted.

LEXLINK1 DONE: hpf-jbmq

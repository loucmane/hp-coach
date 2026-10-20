# hpf-bz6f.2 — Repetera: a new question with the same trap

Intended path: `docs/worklog/hpf-bz6f.2.md`. The worker session could not write
it (Write denied), so it was saved here for the operator to copy.

Status: **PARTIAL. The worker session's permission policy blocked three
write-set files.** Everything else in the write set is written and tested.
Changes are uncommitted in the worktree.

## Blocked (needs the operator)

In don't-ask mode the harness refused these writes. I did not route around the
refusals.

| File | Tool | Result |
|---|---|---|
| `scripts/build_trap_index.mjs` | Write ×2 (with and without the `#!` line) | denied |
| `worker/src/routes/mistakes.ts` | Edit ×2 (schema, route) | denied |
| `docs/worklog/hpf-bz6f.2.md` | Write ×1 | denied (this file) |
| `app/public/trap-index.json` | not attempted | generator output; needs the generator |

`app/**` and the worker test file were writable. The policy appears to admit
`app/**` and `*.test.ts` but not `worker/src/**` source, `scripts/**` or
`docs/**`. The bead's admitted write set includes all of them.

### To finish

1. Create `scripts/build_trap_index.mjs` from the block below.
2. Make the two `worker/src/routes/mistakes.ts` insertions below.
3. From the repo root, run
   `NODE_OPTIONS=--max-old-space-size=3072 node scripts/build_trap_index.mjs`.
   This writes `app/public/trap-index.json`. Bead facts predict about 2,996
   questions and 174 traps; the script prints the counts.
4. Copy this file to `docs/worklog/hpf-bz6f.2.md`.
5. Re-run the six verify commands. The 3 app failures, 6 worker failures and
   1 app typecheck error listed under "Verify" are exactly what these files
   unblock.

Neither blocked code file has been executed. The app test
`trapIndex.test.ts > equals what scripts/build_trap_index.mjs derives`
compares the committed index with `renderTrapIndex()`, so a broken generator
fails loudly. The test imports the generator through a computed dynamic
`import()`, so tsc stays out of the `.mjs`. That import path has only been
seen failing for the missing file ("Cannot find module …"), never loading
the real one.

#### `scripts/build_trap_index.mjs` (new file)

```js
#!/usr/bin/env node
// Build app/public/trap-index.json — which Layer 1 trap each question
// carries (hpf-bz6f.2).
//
// Repetera repeats a LÄS/MEK/ELF/quant miss through a NEW question with the
// same trap ("Samma fälla, ny fråga"). The trap is each explanation's
// `framework_id`; this script distils app/public/explanations/{exam}.json
// into a small static map — question ids and trap ids only, no content —
// that the SPA loads as a public asset (app/src/lib/trapIndex.ts).
// Questions without a trap id (all of ORD, and the untagged rest) are left
// out.
//
// Deterministic: qids sorted, two-space JSON, trailing newline. The app's
// src/lib/trapIndex.test.ts asserts the committed file equals
// renderTrapIndex(), so re-run this after any change to the explanations.
//
// Usage:
//   node scripts/build_trap_index.mjs          # write the index
//   node scripts/build_trap_index.mjs --check  # exit 1 when it is stale

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const EXPLANATIONS_DIR = path.join(REPO_ROOT, 'app/public/explanations')
const OUT_FILE = path.join(REPO_ROOT, 'app/public/trap-index.json')
const OUT_LABEL = 'app/public/trap-index.json'
// Exam files only: `_index.json` and the audit notes start with `_`.
const EXAM_FILE_RE = /^[a-z0-9-]+\.json$/

/** qid → framework id for every explanation that carries one, in qid order. */
export function collectTraps(dir = EXPLANATIONS_DIR) {
  const traps = new Map()
  const files = readdirSync(dir)
    .filter((file) => EXAM_FILE_RE.test(file))
    .sort()
  for (const file of files) {
    const explanations = JSON.parse(readFileSync(path.join(dir, file), 'utf8'))
    for (const [qid, explanation] of Object.entries(explanations)) {
      const trap = explanation?.framework_id
      if (typeof trap === 'string' && trap.length > 0) traps.set(qid, trap)
    }
  }
  return Object.fromEntries([...traps.keys()].sort().map((qid) => [qid, traps.get(qid)]))
}

/** The exact text of app/public/trap-index.json. */
export function renderTrapIndex(dir = EXPLANATIONS_DIR) {
  const index = {
    version: 1,
    generator: 'scripts/build_trap_index.mjs',
    traps: collectTraps(dir),
  }
  return `${JSON.stringify(index, null, 2)}\n`
}

function main(args) {
  const text = renderTrapIndex()
  const traps = Object.values(JSON.parse(text).traps)
  const summary = `${traps.length} questions, ${new Set(traps).size} traps`
  if (args.includes('--check')) {
    let current = null
    try {
      current = readFileSync(OUT_FILE, 'utf8')
    } catch {
      // Missing reads as stale.
    }
    if (current !== text) {
      console.error(`build_trap_index: ${OUT_LABEL} is stale (${summary}); re-run without --check`)
      process.exit(1)
    }
    console.log(`build_trap_index: ${OUT_LABEL} is up to date (${summary})`)
    return
  }
  writeFileSync(OUT_FILE, text)
  console.log(`build_trap_index: wrote ${OUT_LABEL} (${summary})`)
}

// Run only as a script; the app's test imports renderTrapIndex directly.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2))
}
```

#### `worker/src/routes/mistakes.ts`: insertion 1, directly after `const PatchBody = … .strict()`

```ts

const ReviewBody = z
  .object({
    correct: z.boolean(),
  })
  .strict()
```

#### `worker/src/routes/mistakes.ts`: insertion 2, directly before the `// PATCH /api/mistakes/:id — { resolve: true } reports a correct` comment

The existing `/:id` and `/by-question` routes stay unchanged. The full patched
file is also in this scratchpad as `mistakes.ts`. Diffing it against the repo
file shows only these two insertions.

```ts
  // PATCH /api/mistakes/:id/review — { correct } (hpf-bz6f.2). Repetera
  // repeats a LÄS/MEK/ELF/quant miss through a NEW question with the same
  // trap ("Samma fälla, ny fråga"), so the answer arrives on a different
  // questionId than the row's and the question-keyed paths would miss it
  // (or, on a wrong answer, record the new question as a mistake of its
  // own). The client addresses the source mistake by row id instead, and
  // this route moves THAT row the way the existing paths move a
  // same-question repeat, so the due / pile scopes stay right:
  //   - correct → nextOnCorrect, as in /by-question: advance, resume after
  //     a lapse, or graduate at the cap. Only an active row moves; one
  //     resolved meanwhile (e.g. on another device) is left as it is.
  //   - wrong   → the lapse POST / applies to an existing row: relearn
  //     rung + banked height, errorCount7d + 1, lastErrorAt = now, status
  //     back to 'active' — the item stays on today's pile. Never an
  //     insert: a miss on the new question lapses the ORIGINAL mistake.
  // Same ownership rule as /:id: another user's row is a 404.
  .patch('/:id/review', zValidator('param', IdParam), zValidator('json', ReviewBody), async (c) => {
    const { id } = c.req.valid('param')
    const { correct } = c.req.valid('json')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)

    const [existing] = await db
      .select()
      .from(mistakes)
      .where(and(eq(mistakes.id, id), eq(mistakes.userId, userId)))
      .limit(1)
    if (!existing) {
      return c.json({ error: { code: 'not_found', message: 'Mistake not found' } }, 404)
    }

    if (!correct) {
      const now = new Date()
      const wrong = nextOnWrong(now, {
        intervalMinutes: existing.intervalMinutes ?? 0,
        lapseIntervalMinutes: existing.lapseIntervalMinutes ?? null,
      })
      const [row] = await db
        .update(mistakes)
        .set({
          status: 'active',
          errorCount7d: (existing.errorCount7d ?? 0) + 1,
          lastErrorAt: now,
          intervalMinutes: wrong.intervalMinutes,
          nextReviewAt: wrong.nextReviewAt,
          lapseIntervalMinutes: wrong.lapseIntervalMinutes > 0 ? wrong.lapseIntervalMinutes : null,
        })
        .where(eq(mistakes.id, existing.id))
        .returning()
      return c.json({ mistake: row })
    }

    if (existing.status !== 'active') {
      return c.json({ mistake: existing })
    }
    const outcome = nextOnCorrect(
      existing.intervalMinutes ?? 0,
      new Date(),
      existing.lapseIntervalMinutes ?? null,
    )
    if (outcome.graduated) {
      const [row] = await db
        .update(mistakes)
        .set({ status: 'resolved' })
        .where(eq(mistakes.id, existing.id))
        .returning()
      return c.json({ mistake: row })
    }
    const [row] = await db
      .update(mistakes)
      .set({
        intervalMinutes: outcome.intervalMinutes,
        nextReviewAt: outcome.nextReviewAt,
        // Consume/clear any stashed lapse height (null on every correct).
        lapseIntervalMinutes: outcome.lapseIntervalMinutes,
      })
      .where(eq(mistakes.id, existing.id))
      .returning()
    return c.json({ mistake: row })
  })

```

## What changed (written files)

- `app/src/lib/trapIndex.ts` (new). Holds the `TrapIndexFile` shape
  `{ version: 1, generator, traps: { qid: frameworkId } }`. Other exports:
  - `buildTrapIndex(traps)` returns `trapOf(qid)` and `qidsFor(frameworkId)`,
    with qids sorted;
  - `EMPTY_TRAP_INDEX`;
  - `loadTrapIndex()`, a memoised static `fetch('/trap-index.json')` like
    `loadFramework`. A 404 means no traps; other failures throw and leave the
    memo so the next call retries;
  - `TRAP_INDEX_URL` and the test helper `__resetTrapIndexCache`.

  The index is public on purpose: ids only, no content, unlike the gated
  explanations.
- `app/src/lib/replay.ts`
  - `ReplayItem` is now `{ question, mistakeId, sourceQid, sibling }`.
  - `pickReplayQuestions(due, count, { exposure, traps })`. A due miss whose
    question carries a trap gets a sibling:
    - same framework id and same section;
    - complete with options and not in `EXCLUDED_QUESTIONS`;
    - not the source, not already in the round, and not any due miss's
      question;
    - unseen preferred (`n = 0`), else least recently seen, else qid order.

    ORD never gets a sibling, even if an ORD question is tagged someday. A
    null id or no candidate left replays the same qid, as before. A stub
    source with a sibling now plays the sibling; without one it is still
    skipped. If the trap index fails to load, every item falls back to the
    same qid.
  - `prunePlan(qids, due, traps)` now returns `PlanLink[]` and keeps siblings
    (see "Resume").
  - `resolveReplayPlan(qids, due)` is `prunePlan` resolved against the bank.
    It drops stale qids instead of throwing.
- `app/src/api/hooks/useMistakes.ts`: `useReviewMistake()` sends
  `PATCH /api/mistakes/:id/review { correct }` and invalidates the due,
  active and pile keys.
- `app/src/routes/repetition.tsx`
  - Both fresh picks and resumes record the round as a `qid → ReplayItem`
    map in state.
  - On a planned item, right and wrong answers both go through
    `useReviewMistake` for the source mistake's row id. A wrong answer on a
    sibling never records a mistake. A question outside the round, which
    should not happen, falls back to the old `by-question` / `POST` paths.
  - `pickQuestions` awaits the exposure query when it is still pending. A
    failed query reads as all unseen.
  - A sibling item shows the label "Samma fälla, ny fråga" (see "Label").
- Tests: `app/src/lib/trapIndex.test.ts` (new), `app/src/lib/replay.test.ts`
  (extended; the `prunePlan` cases were adapted to the link shape),
  `app/src/routes/-repetition.test.tsx` (new),
  `worker/src/routes/mistakes.test.ts` (new describe block for the review
  route).

## Resume: the mapping is re-derived, not stored

**Superseded in round 2:** the links are now stored with the session and never
re-derived. See "Round 2" below.

The server session keeps only qids, and `SessionPlayer` and the sessions route
are outside the write set. So `prunePlan` rebuilds each stored entry's link
against the current due list, with no stored state, which also makes it work
across devices:

1. A stored qid that is a due mistake's own question repeats that mistake.
   These entries claim their mistakes first.
2. Any other stored qid with a trap repeats the first due mistake, in due
   order, that has the same trap and section and is still unclaimed. ORD
   entries are never linked this way.
3. Anything left unlinked is dropped. This is the ghost-replay guard: a
   sibling whose source left the due list goes too.

With an unchanged due list this rebuilds exactly the links the picker made,
because the picker walks the due list in the same order and never uses a due
qid as a sibling. If the due list changed, a sibling can re-link to another
due mistake with the same trap. That is acceptable, since it is the same skill.

## Label

`SessionPlayer` and `DrillQuestion` own the question chrome and are not in the
write set, so the route renders the label beside the player. It shows when the
URL `?qid=` (kept in sync by `SessionPlayer`) maps to a sibling item:

- class `hpc-m3-eyebrow`, the drill eyebrow's style (mono 11px, uppercase,
  muted);
- fixed, centred at the top: 20px at desktop, on the due station's line; at
  phone, `safe-area + 6px`, above the question eyebrow;
- `zIndex 7`, above the sticky due band, with a `var(--bg)` pill so text
  scrolling under it stays legible.

**Not visually verified.** There is no browser or authenticated app in this
sandbox, and the bead allows only the project's test commands.

Follow-up worth a bead: a `SessionPlayer` prop that puts this cue inside
`DrillQuestion`'s eyebrow row instead of a fixed caption.

## Server route semantics (as tested)

`PATCH /api/mistakes/:id/review` with body `{ correct: boolean }`, strict:

- A row owned by another user, or an unknown id, is a 404 and the row is
  untouched.
- `correct: true` on an active row runs `nextOnCorrect`: day 1, resume at
  half after a lapse, or graduate at the cap. On a non-active row it is a
  no-op that returns the row.
- `correct: false` runs `nextOnWrong`: relearn rung, banked height,
  `errorCount7d + 1`, `lastErrorAt = now`, `status = 'active'`. This matches
  the POST upsert, so the row stays on today's pile. It never inserts a row.

## Red-first evidence

- Worker, before the route existed (`pnpm test src/routes/mistakes.test.ts`):
  `Tests 6 failed | 21 passed (27)`. The failures:
  - correct advances THAT row…
  - correct at the 30-day cap…
  - correct after a lapse…
  - wrong lapses THAT row…
  - a resolved row stays resolved…
  - rejects a body without a boolean `correct`

  Three new tests passed vacuously against the missing route (404 behaviour):
  no-row-for-other-question, other-user 404, unknown-id 404.
- `trapIndex.test.ts`, before `trapIndex.ts` existed: the suite failed to load
  with `Failed to resolve import "./trapIndex"`.
- `replay.test.ts`, with `trapIndex.ts` in place and the old `replay.ts`:
  `Tests 19 failed | 9 passed (28)`. All 11 sibling tests and the link-shape
  `prunePlan`/`resolveReplayPlan` tests failed. The original 5 picker tests
  passed.
- `-repetition.test.tsx`, with the new `replay.ts` and the old route:
  `Tests 7 failed | 3 passed (10)`. The failures:
  - review routing (×2);
  - label (×2);
  - exposure wait;
  - resume mapping;
  - resume prune (the route still called the old `prunePlan`).

## Verify (current tree)

| Check | Result |
|---|---|
| app `pnpm typecheck` | **1 error**, `src/api/hooks/useMistakes.ts(205,49)`: `Property 'review' does not exist`. The typed Hono client has no `/:id/review` until worker insertion 2 lands. Nothing else. |
| app `pnpm lint` | pass. 4 pre-existing infos in devbake files, none in this change. |
| app `pnpm test` | **3 failed, 4006 passed (2 of 113 files failed).** All 3 need the blocked files: `trapIndex.test.ts` committed-index ×2 (no generator / no `trap-index.json`), and `replay.test.ts` "loads the committed trap index by default" (ENOENT). |
| worker `pnpm typecheck` | pass |
| worker `pnpm lint` | pass |
| worker `pnpm test` | **6 failed, 398 passed (1 of 24 files failed).** All 6 are the new review-route tests (route blocked). |

Changed-file subsets: trapIndex 6 of 8 pass, replay 27 of 28,
`-repetition` 10 of 10.

## Notes

- `repetition.tsx` was formatted with `biome format --write` on that file
  only. `lint:fix` was avoided because it would also touch the pre-existing
  devbake infos outside the write set.
- The e2e specs that drive /repetition (`repetition-numeral`, `mistakes`) use
  ORD only, so same-item repetition and the review route's pile semantics
  match their expectations. They were not run.
- The idle subcopy still says "Repetera N frågor du svarat fel på". With
  siblings, some of those will be new questions. Product copy is out of
  scope; flagged for the owner.

## Coordinator completion (2026-10-20 ~23:05 CEST)

The worker's harness refused writes outside `app/**` and `*.test.ts` (don't-ask mode), so the coordinator finished the blocked steps on the host:
- Applied the worker's prepared `worker/src/routes/mistakes.ts` (`ReviewBody` and `PATCH /:id/review`). It is the scratchpad file, identical to the two insertions above.
- Created `scripts/build_trap_index.mjs` from the block above. Ran it: 2,996 questions, 174 traps. `--check` reports the file is up to date.
- `trapIndex.test.ts`: the generator test now runs `node scripts/build_trap_index.mjs --check` as a child process instead of a dynamic `import()`, because Vitest refused to import a file URL outside `app/` ("Cannot find module"). Mutation-checked: corrupting one trap id in the committed index fails the test.
- Host verify:
  - worker: typecheck and lint clean, tests 404/404;
  - app: typecheck and lint clean, tests 4009/4009.

## Round 2

Codex's exact-head review of a6fc247 (review bead hpf-kudz) returned **HOLD**
with two findings. Both are fixed, and every write landed inside the admitted
set. Changes are uncommitted.

### P1: a resume linked new questions by the current due order

`prunePlan` rebuilt each stored new question's source from the due list as it
stood at resume time. Take misses A and B with one trap, played as X→A and
Y→B. Once X was answered, A left the due list and a resume produced X→B:
- at position 1, Y was dropped and the unfinished round ended;
- at position 0, an answer on X moved B;
- a newer due miss C with the same trap could take Y's link.

**Fix: the links are stored with the session.** `SessionPlayer` (outside the
write set) creates the session with `plan: picked.map((q) => q.qid)`, so the
route cannot change what that POST stores. The links are written into the same
`sessions.plan` entries right after it:

- **Entry format** (`lib/replay.ts`, `planEntry` / `parsePlanEntry`): a new
  question is stored as `"<qid>~<sourceQid>"`. Any other question stays a
  plain qid, which repeats its own mistake. That is also all an older plan
  holds, so old plans resume exactly as before.
  - Qids never contain `~`.
  - The longest qid in the trap index is 29 characters, so a link fits the
    80-character entry limit. A link that would not fit stays plain (see
    below).
  - The source is a qid, not a row id: one mistake per (user, question) is
    the table's invariant, and a qid survives export/import, which re-numbers
    rows.
- **Server**, `PUT /api/mistakes/round/:sessionId { plan }`
  (`worker/src/routes/mistakes.ts`). It only annotates:
  - the session must be the caller's own (another user's is a 404), of kind
    `adaptive_review`, and still open at the write;
  - every entry must be well formed (one `~` between two non-empty qids) and
    keep the question stored at its index, at the same length;
  - the plan obeys the sessions route's bounds (1–80 characters per entry, at
    most 500 entries);
  - only `plan` is written. Position, current question and device stay
    `SessionPlayer`'s.

  The mistakes route now reads and writes `sessions`. `mockResults.ts`
  already reads it for its own checks, and `routes/sessions.ts` is outside
  the write set. There is no new column and no D1 migration.
- **Client:**
  - `useLinkRound()` (`useMistakes.ts`) sends the PUT and writes the returned
    plan through to the `['sessions', 'active']` cache. Only the plan; the
    cursor fields stay `SessionPlayer`'s.
  - `repetition.tsx` keeps a fresh round's linked plan (only when it has a new
    question). When that round's session shows up in the active-sessions
    cache without its links, it writes them, with one write in flight at a
    time.
  - It keeps the plan for the life of the round, so a failed write is retried
    on the session's next cache update. A slower `SessionPlayer` PATCH
    response that puts the plain plan back in the cache also triggers a
    re-write. The server is idempotent for the same links.

**The cursor is reconciled** (`prunePlan(entries, due, position)`; `resolveReplayPlan` returns `{ questions, items, remaining }`):
- **Before the saved cursor**, answered questions are kept whatever their
  mistakes' state. The player's stored position and its
  `?qid=`/`currentQuestionId` seek still land on the paused question, and the
  Klart summary still counts them.
- **From the cursor on**, an entry plays only while the mistake stored with it
  is due, and each due mistake plays once. Due order and newly due mistakes
  never matter.
- `remaining === 0` is the only "round over" signal. It replaces the old
  `position >= pruned length` test, which compared a stored-plan index with a
  pruned length.
- A resume reads the due list fresh (`due.refetch`), because the cache can
  trail an answer given on another device by minutes.

**A question whose source is no longer due is skipped, not answered against
its source. The round goes on.** Why:
1. The commonest way a source leaves the due list mid-round is that its own
   question was answered and the student left before "Nästa". Then its
   mistake has just moved: a right answer reschedules it, a wrong one sets
   the 10-minute relearn rung. Skipping avoids a second review of the same
   miss in one round.
2. Otherwise it moved elsewhere: resolved by a correct answer elsewhere, or
   graduated. Answering it here would be an off-schedule review that
   advances or re-lapses it twice for one moment of practice. That is the
   double-count the ghost-replay guard (#290) exists to prevent.
3. Nothing is lost. The mistake comes back in a later round once it is due,
   with its own pick.

A plain new question (no stored link) is never re-derived. A link fails to
exist only in three cases:
- a link too long to store;
- the moment between the session's creation and the PUT;
- a PUT that never landed.

Such an entry repeats only its own mistake, which it normally does not have,
so from the cursor on it is skipped. The rest of the round plays on. If it was
the last one left, the round ends and the next Start picks a fresh round.

### P2: a fresh round reused a stale exposure map

Picking siblings unseen-first needs a map that includes the round just played.
`useExposure` caches it for five minutes, and nothing invalidates it on an
answer.

**Fix, inside `repetition.tsx`:**
- Every fresh pick awaits `exposure.refetch({ cancelRefetch: false })`.
- Every question answered on this visit (`onCorrect`/`onWrong`) counts as
  just seen (`n ≥ 1`, `last` = now in epoch seconds, like the server's
  `max(attempts.created_at)`), even before its attempt reaches the map.
- A failed read still never blocks the round: the rest count as unseen.

Not done: invalidating `EXPOSURE_KEY` in `useSubmitAttempt`'s `onSuccess`
(`app/src/api/hooks/useAttempts.ts`, outside the write set). The exact change
would be `qc.invalidateQueries({ queryKey: EXPOSURE_KEY })` next to its
`STATS_KEY` invalidation. It would refresh the map for every exposure consumer
(Provpass picker included). The route-level fix above covers Repetera without
it.

### Red-first evidence

The regression tests ran against the round-1 code at a6fc247, before any
implementation change.

- `app` `pnpm test src/routes/-repetition.test.tsx`: **`Tests 8 failed | 10
  passed (18)`**.
  - **P1**, `resuming a partly answered round after the due list changed`:
    - A left the due list: expected the plan `[LÄS-013, LÄS-014]`, got `[]`.
      The unfinished round ended.
    - A newer due miss with the same trap: both answers on Y reviewed
      mistake **103** (the newer C), not 102 (B).
    - At the cursor (position 0): expected `[LÄS-014]`, got `[LÄS-013,
      LÄS-014]`. X was kept, re-linked to B.
  - **P2**, `the next round after a round`:
    - reads the exposure map afresh: round two re-picked `LÄS-012`, the
      question round one had just played;
    - counts a question answered on this visit as seen: same re-pick.
  - The new storage format:
    - stores each new question with the mistake it repeats: no PUT was sent;
    - keeps a stored new question, mapped: the linked entry was dropped;
    - labels a resumed new question too: same cause.
- `worker` `pnpm test src/routes/mistakes.test.ts`, before the route existed:
  **`Tests 6 failed | 28 passed (34)`**. Every new PUT case got a 404. The
  other-user 404 test passed vacuously.
- `app` `pnpm test src/lib/replay.test.ts`, against round 1's `replay.ts`:
  **`Tests 11 failed | 23 passed (34)`**.
  - `planEntry`/`parsePlanEntry` were missing.
  - Stored links were dropped, or the trap-based relinking ran.
  - `resolveReplayPlan` had the old return shape.

  "Never re-derives a source for a stored new question that carries none"
  passed vacuously: the old default trap index was empty.

After the red run, the route file gained one test ("writes the links again
whenever the session shows up without them"). Another became "never links a
session that is not this open round": an ended session with the same plan
must not be linked. The five P1/P2 regression tests are unchanged since the
red run.

### Tests changed

- `-repetition.test.tsx` mocks `useActiveSessionOfKind`, `useLinkRound` and
  `useDueMistakes().refetch`. It resumes with linked entries. The old "cursor
  past the end of the pruned plan" test now reads "nothing left from the
  cursor on", because the old expectation was the P1 bug.
- `replay.test.ts`: round 1's trap-based `prunePlan` cases are replaced by
  link-based ones:
  - stored links survive a reordered due list that gains a same-trap miss;
  - a plain new question is never re-derived;
  - the cursor keeps answered questions and skips non-due ones after it;
  - each due mistake plays once.

  There are also `planEntry`/`parsePlanEntry` tests and the new
  `resolveReplayPlan` shape.
- `mistakes.test.ts` covers the PUT:
  - storing the links leaves the cursor untouched;
  - a retry is idempotent;
  - another question, a reorder, a shorter or a longer plan are all refused;
  - malformed links are refused;
  - a drill or an ended round is refused;
  - another user's session is a 404;
  - bounds: an 81-character entry, an empty plan, an extra key, a missing
    plan.

### Verify (round 2, final tree)

| Check | Result |
|---|---|
| app `pnpm typecheck` | pass |
| app `pnpm lint` | pass. The same 4 pre-existing infos in devbake files, none in this change. |
| app `pnpm test` | **113 files, 4024 / 4024 pass** |
| worker `pnpm test` | **24 files, 411 / 411 pass** |
| worker `pnpm typecheck`, `pnpm lint` | pass (run as well) |

### Residuals

- **The link write lands just after the session's creation.** A resume in
  that gap never mis-links; it skips the round's new questions. This also
  applies if the PUT never lands, on any device. A `SessionPlayer` prop
  would remove the gap and the extra request: for example
  `planEntries?: (picked: Question[]) => string[]`, used as
  `plan: props.planEntries?.(picked) ?? picked.map((q) => q.qid)` in
  `begin()`'s `startSession` call. The session would then be created with
  links. It is outside the write set, so this is follow-up material.
- **A failed due read on resume reads as "nothing due".** The round then ends,
  as before round 2.
- **The cursor fallback can land on an answered question.** If a stored qid
  before the cursor stops resolving in the bank, and the paused question was
  itself skipped, `SessionPlayer`'s position fallback is off by the number of
  missing entries. The question ids in the bank are stable, so this is
  theoretical.
- Not visually verified, as in round 1. Nothing visible changed in round 2.

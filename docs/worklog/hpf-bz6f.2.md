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

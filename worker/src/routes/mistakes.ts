// /api/mistakes — wrong-answer ledger + spaced replay queue.
//
// Per-row semantics (one mistake per (userId, questionId)):
//
//   - status="active"  → live in the queue. The user will see it again
//                        once nextReviewAt has passed.
//   - status="resolved"→ graduated out — got it right at the cap step.
//   - errorCount7d     → bumped each wrong answer; ranks "frequent
//                        stumbles" first when we tie-break the queue.
//   - intervalMinutes  → current rung of the SM-2-lite ladder. See
//                        lib/srs.ts for the doubling schedule and the
//                        graduation rule.
//   - nextReviewAt     → derived from intervalMinutes on every write.
//                        The /due endpoint filters by `≤ now`, so a
//                        mistake stays "out of view" until its rung
//                        elapses.
//
// Why upsert vs separate rows per attempt:
//   The mistakes table is a *replay queue*, not an audit log. The audit
//   lives in `attempts`. Keeping mistakes one-row-per-question means the
//   queue is naturally deduped without group-by gymnastics on the read
//   path, and bumping a counter is cheaper than another insert.
//
// Authorization: every query is scoped by userId from the auth middleware.
// A mistake row from a different user surfaces as 404, not 403, so we
// don't leak existence either way.

import { zValidator } from '@hono/zod-validator'
import { and, desc, eq, gte, isNull, lte, or, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { getDb } from '../db/client'
import { mistakes } from '../db/schema'
import { ensureUserRow } from '../lib/ensureUser'
import { nextOnCorrect, nextOnWrong, RELEARN_MINUTES } from '../lib/srs'
import type { Env, Vars } from '../types'

const RecordBody = z
  .object({
    questionId: z.string().min(1).max(60),
    // Optional Layer 1 tags. Empty array is fine; null means "untagged".
    layer1Ids: z.array(z.string().min(1).max(40)).max(8).optional(),
  })
  .strict()

const PatchBody = z
  .object({
    resolve: z.literal(true).optional(),
  })
  .strict()

const IdParam = z.object({ id: z.coerce.number().int().positive() })

const DueQuery = z
  .object({
    // Optional section filter — "ORD", "MEK", etc. The questionId already
    // carries section as the 4th hyphenated part, so we filter via LIKE.
    section: z.string().min(2).max(8).optional(),
    // 1..500 — protects against accidental dataset dumps. Bumped from
    // 50 to match the client's display needs: Home shows "10 av N
    // missar" where N is the full backlog count, so the hook needs
    // enough rows to render the total accurately. Dogfood scale
    // (single user, SRS spacing) keeps the active set well under 500.
    limit: z.coerce.number().int().min(1).max(500).default(10),
    // Which slice of the queue to return:
    //   - "due" (default) — only mistakes whose nextReviewAt has elapsed
    //     (or is NULL): what the user can replay RIGHT NOW ("redo nu").
    //   - "all" — every active mistake regardless of nextReviewAt: the
    //     whole repetition queue ("hela repetitionskön"). Kept for any
    //     consumer that genuinely wants the unbounded queue.
    //   - "pile" — TODAY'S PILE (owner 2026-07-13): the single "att
    //     repetera" number shown on every numeral station, the Öva hub
    //     lanes, and DrillResult. An active mistake counts when it is
    //     due now (nextReviewAt ≤ now / NULL) OR it was touched today
    //     (lastErrorAt ≥ dayStart). The lastErrorAt branch is what makes
    //     the count behave the way the target user expects:
    //       · a fresh wrong answer (lastErrorAt = now) → +1 immediately;
    //       · a WRONG repetition resets nextReviewAt to +10 min (no
    //         longer "due") but bumps lastErrorAt to now, so the item
    //         STAYS in the pile → the number is dead static, never a
    //         phantom −1 (owner clarification 2026-07-13);
    //       · a CORRECT repetition on an older mistake pushes nextReviewAt
    //         days out and does NOT touch lastErrorAt, so an item last
    //         errored on a previous day LEAVES the pile → −1 immediately.
    //     (The mistakes table has no createdAt column — lastErrorAt is
    //     the honest "touched/created today" signal, and it is exactly
    //     the discriminator the wrong-vs-correct behaviour needs.)
    scope: z.enum(['due', 'all', 'pile']).default('due'),
    // Client's local-midnight epoch (ms). Required in spirit for
    // scope=pile (the worker has no user timezone); the client always
    // sends it. Absent → the lastErrorAt branch is simply disabled and
    // pile degrades to due. Ignored for scope=due / scope=all.
    dayStart: z.coerce.number().int().nonnegative().optional(),
  })
  .strict()

export const mistakesRoute = new Hono<{ Bindings: Env; Variables: Vars }>()
  // POST /api/mistakes — record a wrong answer; upsert if already present.
  // Schedule: a wrong answer sends the SRS ladder back to the 10-minute
  // relearn rung so the item is due again today — but it no longer forgets
  // how high the item had climbed. The previous height is stashed in
  // `lapseIntervalMinutes` (FSRS-lite, PL-L.2) so the next correct answer
  // resumes at half of it instead of restarting at day 1. See lib/srs.ts.
  .post('/', zValidator('json', RecordBody), async (c) => {
    const body = c.req.valid('json')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)

    // Look for an existing row first. We could use INSERT … ON CONFLICT
    // but Drizzle's D1 dialect doesn't expose a clean upsert helper, and
    // the read+write here is one round-trip per mistake — fine at our
    // scale. If this becomes hot we can revisit with raw SQL.
    const [existing] = await db
      .select()
      .from(mistakes)
      .where(and(eq(mistakes.userId, userId), eq(mistakes.questionId, body.questionId)))
      .limit(1)

    if (existing) {
      // Lapse memory: stash the height this row had climbed to (or keep
      // the height already banked from an earlier lapse) before the
      // relearn rung overwrites the interval. See lib/srs.ts. Store 0 as
      // NULL so "no banked height" stays a clean NULL in the column.
      const wrong = nextOnWrong(new Date(), {
        intervalMinutes: existing.intervalMinutes ?? 0,
        lapseIntervalMinutes: existing.lapseIntervalMinutes ?? null,
      })
      const [row] = await db
        .update(mistakes)
        .set({
          status: 'active',
          errorCount7d: (existing.errorCount7d ?? 0) + 1,
          lastErrorAt: new Date(),
          intervalMinutes: wrong.intervalMinutes,
          nextReviewAt: wrong.nextReviewAt,
          lapseIntervalMinutes: wrong.lapseIntervalMinutes > 0 ? wrong.lapseIntervalMinutes : null,
          // Layer 1 tags: keep whichever set is non-empty. Server is the
          // source of truth once tagging starts (task 38).
          layer1Ids: body.layer1Ids ?? existing.layer1Ids ?? null,
        })
        .where(eq(mistakes.id, existing.id))
        .returning()
      return c.json({ mistake: row })
    }

    // Brand-new mistake — no prior height to stash, so lapse memory stays
    // NULL (the column default). Behaviour identical to the old reset.
    const wrong = nextOnWrong()
    const [row] = await db
      .insert(mistakes)
      .values({
        userId,
        questionId: body.questionId,
        layer1Ids: body.layer1Ids ?? null,
        status: 'active',
        errorCount7d: 1,
        intervalMinutes: wrong.intervalMinutes,
        nextReviewAt: wrong.nextReviewAt,
      })
      .returning()
    return c.json({ mistake: row }, 201)
  })

  // GET /api/mistakes/due — replay queue for this user.
  //
  // Filter: status='active' AND (nextReviewAt IS NULL OR nextReviewAt ≤ now).
  // The NULL branch handles legacy rows from before the SRS branch;
  // they're treated as "due now" so the user sees them on their next
  // visit and the ladder gets bootstrapped naturally.
  //
  // Sort: most-overdue first (nextReviewAt asc, NULL before non-NULL),
  // then most-frequent stumbles (errorCount desc) as the tiebreaker.
  // This keeps the queue from accumulating — long-overdue items rise
  // to the top instead of being buried under recent mistakes.
  .get('/due', zValidator('query', DueQuery), async (c) => {
    const { section, limit, scope, dayStart } = c.req.valid('query')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)
    const now = new Date()

    // The scope-specific gate on top of (userId, status='active'):
    //   - "all"  → no gate (whole active queue).
    //   - "due"  → ripe-only: nextReviewAt ≤ now / NULL (the replay flow).
    //   - "pile" → due-now OR touched-today (lastErrorAt ≥ dayStart) — the
    //     "att repetera" number every station shows. See the DueQuery
    //     comment for why lastErrorAt (not a createdAt) is the right signal.
    // Sort, cap, section filter, and auth are identical across all three.
    let scopeClause: ReturnType<typeof or> | null = null
    if (scope === 'due') {
      scopeClause = or(isNull(mistakes.nextReviewAt), lte(mistakes.nextReviewAt, now))
    } else if (scope === 'pile') {
      const dueNow = or(isNull(mistakes.nextReviewAt), lte(mistakes.nextReviewAt, now))
      scopeClause =
        dayStart != null
          ? or(
              dueNow,
              // "Missed today AND not yet correctly repeated": the
              // relearn rung (intervalMinutes ≤ RELEARN_MINUTES) is the
              // discriminator — a correct answer climbs to ≥1 day and
              // LEAVES this branch (owner 2026-07-14: a same-day miss,
              // once correctly repeated, must −1 like any other; the
              // bare lastErrorAt branch kept it pinned all day). A wrong
              // repetition resets to the relearn rung and stays.
              and(
                gte(mistakes.lastErrorAt, new Date(dayStart)),
                lte(mistakes.intervalMinutes, RELEARN_MINUTES),
              ),
            )
          : dueNow
    }
    const conds = scopeClause
      ? [eq(mistakes.userId, userId), eq(mistakes.status, 'active'), scopeClause]
      : [eq(mistakes.userId, userId), eq(mistakes.status, 'active')]
    if (section) {
      // questionId format: "var-2026-verb1-ORD-001". Section is the 4th
      // hyphen-segment; LIKE on "%-{section}-%" pins it without ambiguity.
      conds.push(sql`${mistakes.questionId} LIKE ${`%-${section}-%`}`)
    }

    const rows = await db
      .select()
      .from(mistakes)
      .where(and(...conds))
      // SQLite sorts NULL first under ASC by default, which is what we
      // want here — legacy rows surface immediately.
      .orderBy(mistakes.nextReviewAt, desc(mistakes.errorCount7d))
      .limit(limit)
    return c.json({ mistakes: rows })
  })

  // PATCH /api/mistakes/by-question — { questionId, resolve: true }.
  // Same ladder as /:id, addressed by QUESTION instead of row id. Added
  // 2026-07-14 (owner: "the number is completely static"): /repetition
  // resolved via a client-side qid→rowId map built from the CURRENT due
  // list, but an adopted session's stored plan can drift from that list
  // — the map missed, onCorrect silently no-oped, and correct answers
  // never decremented the pile. The server owns the lookup now: any
  // correctly-answered question with an active row advances/graduates,
  // regardless of how the session plan drifted. No active row → 200
  // { mistake: null } (nothing to resolve is a fine outcome, not an
  // error — e.g. replaying an already-graduated question).
  .patch(
    '/by-question',
    zValidator('json', z.object({ questionId: z.string().min(1), resolve: z.literal(true) })),
    async (c) => {
      const { questionId } = c.req.valid('json')
      const db = getDb(c.env.DB)
      const userId = await ensureUserRow(db, c.var.userId)
      const [existing] = await db
        .select()
        .from(mistakes)
        .where(
          and(
            eq(mistakes.userId, userId),
            eq(mistakes.questionId, questionId),
            eq(mistakes.status, 'active'),
          ),
        )
        .limit(1)
      if (!existing) {
        return c.json({ mistake: null })
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
    },
  )

  // PATCH /api/mistakes/:id — { resolve: true } reports a correct
  // answer in /repetition. The server advances the row up the ladder
  // (or graduates it to status='resolved' if it was at the cap). The
  // client doesn't need to know the doubling schedule; we own that.
  .patch('/:id', zValidator('param', IdParam), zValidator('json', PatchBody), async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)

    if (!body.resolve) {
      return c.json({ error: { code: 'bad_request', message: 'No-op patch' } }, 400)
    }

    // Read the current rung so we can compute the next one — D1 doesn't
    // expose row-level conditional updates, and we need both branches
    // (advance vs graduate) anyway.
    const [existing] = await db
      .select()
      .from(mistakes)
      .where(and(eq(mistakes.id, id), eq(mistakes.userId, userId)))
      .limit(1)
    if (!existing) {
      return c.json({ error: { code: 'not_found', message: 'Mistake not found' } }, 404)
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
        .where(eq(mistakes.id, id))
        .returning()
      return c.json({ mistake: row })
    }

    const [row] = await db
      .update(mistakes)
      .set({
        // status stays 'active' — the row is still in the queue, just
        // not visible until nextReviewAt elapses.
        intervalMinutes: outcome.intervalMinutes,
        nextReviewAt: outcome.nextReviewAt,
        // Consume/clear any stashed lapse height (null on every correct).
        lapseIntervalMinutes: outcome.lapseIntervalMinutes,
      })
      .where(eq(mistakes.id, id))
      .returning()
    return c.json({ mistake: row })
  })

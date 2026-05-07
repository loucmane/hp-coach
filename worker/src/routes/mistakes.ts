// /api/mistakes — wrong-answer ledger + replay queue.
//
// MVP semantics (one-bit-per-question):
//   - Each (userId, questionId) has at most one row.
//   - status="active"  → still in the replay queue
//   - status="resolved"→ user got it right in replay; falls out of the queue
//   - errorCount7d     → bumped each time the user gets it wrong; lets us
//                        rank "frequent stumbles" first when picking 10
//   - nextReviewAt     → reserved column, set to null in this MVP. A later
//                        SRS branch will populate it (1d/2d/4d/8d cadence).
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
import { and, desc, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { getDb } from '../db/client'
import { mistakes } from '../db/schema'
import { ensureUserRow } from '../lib/ensureUser'
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
    // 1..50 — protects against accidental dataset dumps.
    limit: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict()

export const mistakesRoute = new Hono<{ Bindings: Env; Variables: Vars }>()
  // POST /api/mistakes — record a wrong answer; upsert if already present.
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
      const [row] = await db
        .update(mistakes)
        .set({
          status: 'active',
          errorCount7d: (existing.errorCount7d ?? 0) + 1,
          lastErrorAt: new Date(),
          // Layer 1 tags: keep whichever set is non-empty. Server is the
          // source of truth once tagging starts (task 38).
          layer1Ids: body.layer1Ids ?? existing.layer1Ids ?? null,
        })
        .where(eq(mistakes.id, existing.id))
        .returning()
      return c.json({ mistake: row })
    }

    const [row] = await db
      .insert(mistakes)
      .values({
        userId,
        questionId: body.questionId,
        layer1Ids: body.layer1Ids ?? null,
        status: 'active',
        errorCount7d: 1,
      })
      .returning()
    return c.json({ mistake: row }, 201)
  })

  // GET /api/mistakes/due — replay queue for this user.
  // Sort: most-frequent stumbles first (errorCount desc), then most recent
  // (lastErrorAt desc) — surfaces "the things you keep getting wrong".
  .get('/due', zValidator('query', DueQuery), async (c) => {
    const { section, limit } = c.req.valid('query')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)

    const conds = [eq(mistakes.userId, userId), eq(mistakes.status, 'active')]
    if (section) {
      // questionId format: "var-2026-verb1-ORD-001". Section is the 4th
      // hyphen-segment; LIKE on "%-{section}-%" pins it without ambiguity.
      conds.push(sql`${mistakes.questionId} LIKE ${'%-' + section + '-%'}`)
    }

    const rows = await db
      .select()
      .from(mistakes)
      .where(and(...conds))
      .orderBy(desc(mistakes.errorCount7d), desc(mistakes.lastErrorAt))
      .limit(limit)
    return c.json({ mistakes: rows })
  })

  // PATCH /api/mistakes/:id — { resolve: true } graduates a mistake out
  // of the replay queue. Reserved for "right answer during replay".
  .patch('/:id', zValidator('param', IdParam), zValidator('json', PatchBody), async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)

    if (!body.resolve) {
      // Future: bump nextReviewAt for SRS spacing. Today we only support
      // resolve:true, so an empty patch is a 400.
      return c.json({ error: { code: 'bad_request', message: 'No-op patch' } }, 400)
    }

    const [row] = await db
      .update(mistakes)
      .set({ status: 'resolved' })
      .where(and(eq(mistakes.id, id), eq(mistakes.userId, userId)))
      .returning()
    if (!row) {
      return c.json({ error: { code: 'not_found', message: 'Mistake not found' } }, 404)
    }
    return c.json({ mistake: row })
  })

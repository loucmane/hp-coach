// /api/sessions — start, resume, update position, end.
//
// Cross-device device-swap contract:
//   - GET  /active           → all in-flight sessions (≤1 per kind) +
//                              `session` (the freshest) for back-compat
//   - GET  /:id/attempts      → this session's attempts (summary hydration)
//   - POST /                  → start a session; ENDS any prior active
//                              session of the same kind first (≤1 active
//                              per kind, also guarded by a partial unique
//                              index in the schema); stores the ordered
//                              `plan` so another device replays the exact
//                              sequence
//   - PATCH /:id              → update position / currentQuestionId / device
//                              / endedAt
//
// Authorization is implicit: every query is scoped by user_id (the row
// returned by ensureUserRow), so a forged session id from another user
// surfaces as 404, not 403, by design.

import { zValidator } from '@hono/zod-validator'
import { and, asc, desc, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { getDb } from '../db/client'
import { attempts, DEVICE_KINDS, sessions } from '../db/schema'
import { ensureUserRow } from '../lib/ensureUser'
import type { Env, Vars } from '../types'

const StartBody = z
  .object({
    kind: z.enum(['drill', 'mock', 'mock_diagnostic', 'lesson', 'adaptive_review']),
    sections: z.string().max(120).optional(),
    // Ordered qids that make up this session's plan — so a resume on
    // another device replays the exact sequence. Optional (mock_diagnostic
    // and ad-hoc starts may omit it).
    plan: z.array(z.string().min(1).max(80)).max(500).optional(),
    device: z.enum(DEVICE_KINDS).optional(),
  })
  .strict()

const UpdateBody = z
  .object({
    position: z.number().int().min(0).max(10_000).optional(),
    currentQuestionId: z.string().min(1).max(80).nullable().optional(),
    device: z.enum(DEVICE_KINDS).optional(),
    end: z.literal(true).optional(), // shorthand for endedAt = now
  })
  .strict()

const IdParam = z.object({ id: z.coerce.number().int().positive() })

export const sessionsRoute = new Hono<{ Bindings: Env; Variables: Vars }>()
  // GET /api/sessions/active — every in-flight session for this user, at
  // most one per kind (enforced on write). Returns the full array so the
  // client can offer a per-kind resume; `session` is kept as the freshest
  // single row for backward compatibility with clients that predate the
  // array shape (lets the worker deploy ahead of the frontend safely).
  .get('/active', async (c) => {
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)
    const rows = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, userId), isNull(sessions.endedAt)))
      .orderBy(desc(sessions.startedAt))
    return c.json({ sessions: rows, session: rows[0] ?? null })
  })

  // GET /api/sessions/:id/attempts — the answered questions for a session,
  // oldest first. Powers summary hydration: when a paused drill is adopted
  // on resume, the client pre-fills picks[] for questions answered before
  // the pause so the "Klart." payoff shows the true total, not just the
  // post-resume answers.
  .get('/:id/attempts', zValidator('param', IdParam), async (c) => {
    const { id } = c.req.valid('param')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)
    // Scope by user via the parent session — a forged id surfaces as [].
    const rows = await db
      .select({
        questionId: attempts.questionId,
        selectedAnswer: attempts.selectedAnswer,
        correct: attempts.correct,
      })
      .from(attempts)
      .where(and(eq(attempts.sessionId, id), eq(attempts.userId, userId)))
      .orderBy(asc(attempts.id))
    return c.json({ attempts: rows })
  })

  // POST /api/sessions — start a session. Ends any prior active session of
  // the same kind first (≤1 active per kind; the partial unique index is
  // the race-proof backstop). Stores the ordered plan + device so resume
  // on another device is exact.
  .post('/', zValidator('json', StartBody), async (c) => {
    const body = c.req.valid('json')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)

    // Friendly path for the single-active-per-kind invariant: retire any
    // prior open session of this kind before inserting. The unique index
    // would otherwise reject the insert.
    await db
      .update(sessions)
      .set({ endedAt: new Date() })
      .where(
        and(eq(sessions.userId, userId), eq(sessions.kind, body.kind), isNull(sessions.endedAt)),
      )

    const [row] = await db
      .insert(sessions)
      .values({
        userId,
        kind: body.kind,
        sections: body.sections ?? null,
        position: 0,
        plan: body.plan ?? null,
        device: body.device ?? null,
      })
      .returning()
    return c.json({ session: row }, 201)
  })

  // PATCH /api/sessions/:id — partial update. `end: true` is sugar for
  // setting endedAt to now; otherwise position / currentQuestionId /
  // device update (device so a resume re-stamps where work continued).
  .patch('/:id', zValidator('param', IdParam), zValidator('json', UpdateBody), async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)

    const patch: Partial<typeof sessions.$inferInsert> = {}
    if (typeof body.position === 'number') patch.position = body.position
    if (body.currentQuestionId !== undefined) patch.currentQuestionId = body.currentQuestionId
    if (body.device !== undefined) patch.device = body.device
    if (body.end) patch.endedAt = new Date()

    const [row] = await db
      .update(sessions)
      .set(patch)
      .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
      .returning()
    if (!row) {
      return c.json({ error: { code: 'not_found', message: 'Session not found' } }, 404)
    }
    return c.json({ session: row })
  })

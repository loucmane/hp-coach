// /api/sessions — start, resume, update position, end.
//
// Mid-session device-swap contract:
//   - GET  /active           → returns the row with endedAt=null, or null
//   - POST /                  → starts a fresh session
//   - PATCH /:id              → update position / currentQuestionId / endedAt
//
// Authorization is implicit: every query is scoped by user_id (the row
// returned by ensureUserRow), so a forged session id from another user
// surfaces as 404, not 403, by design.

import { zValidator } from '@hono/zod-validator'
import { and, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { getDb } from '../db/client'
import { sessions } from '../db/schema'
import { ensureUserRow } from '../lib/ensureUser'
import type { Env, Vars } from '../types'

const StartBody = z
  .object({
    kind: z.enum(['drill', 'mock', 'mock_diagnostic', 'lesson', 'adaptive_review']),
    sections: z.string().max(120).optional(),
  })
  .strict()

const UpdateBody = z
  .object({
    position: z.number().int().min(0).max(10_000).optional(),
    currentQuestionId: z.string().min(1).max(60).nullable().optional(),
    end: z.literal(true).optional(), // shorthand for endedAt = now
  })
  .strict()

const IdParam = z.object({ id: z.coerce.number().int().positive() })

export const sessionsRoute = new Hono<{ Bindings: Env; Variables: Vars }>()
  // GET /api/sessions/active — current in-flight session for this user.
  // Returns { session: null } if none, so the client can branch cleanly
  // on a typed shape rather than a 404.
  .get('/active', async (c) => {
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)
    const [row] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, userId), isNull(sessions.endedAt)))
      .orderBy(sessions.startedAt)
      .limit(1)
    return c.json({ session: row ?? null })
  })

  // POST /api/sessions — start a new session. If one is already active,
  // we still create another (caller may have explicitly chosen to start
  // fresh). UI is responsible for offering "resume vs new".
  .post('/', zValidator('json', StartBody), async (c) => {
    const body = c.req.valid('json')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)
    const [row] = await db
      .insert(sessions)
      .values({
        userId,
        kind: body.kind,
        sections: body.sections ?? null,
        position: 0,
      })
      .returning()
    return c.json({ session: row }, 201)
  })

  // PATCH /api/sessions/:id — partial update. `end: true` is sugar for
  // setting endedAt to now; otherwise position / currentQuestionId update.
  .patch('/:id', zValidator('param', IdParam), zValidator('json', UpdateBody), async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)

    const patch: Partial<typeof sessions.$inferInsert> = {}
    if (typeof body.position === 'number') patch.position = body.position
    if (body.currentQuestionId !== undefined) patch.currentQuestionId = body.currentQuestionId
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

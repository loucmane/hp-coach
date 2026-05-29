// /api/attempts — one row per question answered.
//
// Drill / mock / lesson all funnel here. The session row is the parent
// (sessions.id FK), so an attempt without a session is rejected. We
// validate that the session belongs to this user before insert — that
// way a forged sessionId from another user surfaces as 404, not as a
// silent cross-user write.
//
// Mistakes table writes are deliberately NOT in this route. They depend
// on Layer 1 framework tagging (task 38) and SRS scheduling (task 17),
// which are separate branches. Once those land, mistake-on-wrong logic
// hooks in here.

import { zValidator } from '@hono/zod-validator'
import { and, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { getDb } from '../db/client'
import { attempts, sessions, users } from '../db/schema'
import { ensureUserRow } from '../lib/ensureUser'
import type { Env, Vars } from '../types'

const AttemptBody = z
  .object({
    sessionId: z.number().int().positive(),
    questionId: z.string().min(1).max(60),
    selectedAnswer: z.string().min(1).max(8),
    correct: z.boolean(),
    timeTakenMs: z
      .number()
      .int()
      .min(0)
      .max(60 * 60 * 1000)
      .optional(),
  })
  .strict()

export const attemptsRoute = new Hono<{ Bindings: Env; Variables: Vars }>()
  // POST /api/attempts — record one answered question.
  .post('/', zValidator('json', AttemptBody), async (c) => {
    const body = c.req.valid('json')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)

    // Verify the session belongs to this user. Cheap query; prevents the
    // SPA from accidentally posting against a stale id from another login.
    const [session] = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.id, body.sessionId), eq(sessions.userId, userId)))
      .limit(1)
    if (!session) {
      return c.json({ error: { code: 'not_found', message: 'Session not found' } }, 404)
    }

    // Insert the attempt AND bump the user's lifetime counter atomically
    // (one D1 transaction), so the all-time total stays correct even after
    // the retention cron prunes old attempts rows.
    const [inserted] = await db.batch([
      db
        .insert(attempts)
        .values({
          userId,
          sessionId: body.sessionId,
          questionId: body.questionId,
          selectedAnswer: body.selectedAnswer,
          correct: body.correct,
          timeTakenMs: body.timeTakenMs ?? null,
        })
        .returning(),
      db
        .update(users)
        .set({ attemptsTotal: sql`${users.attemptsTotal} + 1` })
        .where(eq(users.id, userId)),
    ])
    return c.json({ attempt: inserted[0] }, 201)
  })

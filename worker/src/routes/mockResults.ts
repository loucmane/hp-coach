// /api/mock-results — the per-pass Provpass (mock exam) summary.
//
// A mock is graded as a whole pass, distinct from the per-question
// `attempts` rows (still written during the mock so mistakes/mastery/
// exposure are unaffected). One row per session; POST upserts on the
// session_id unique index so a retried submit (flaky network, duplicate
// tab) never double-writes.
//
//   - POST /  → grade + store a finished mock. Requires the session to
//               exist, belong to this user, be kind='mock', and already
//               be ended (end the session first, then post the summary).
//   - GET  /  → this user's rows, newest-first, capped at 50.

import { zValidator } from '@hono/zod-validator'
import { and, desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { getDb } from '../db/client'
import { mockResults, sessions } from '../db/schema'
import { ensureUserRow } from '../lib/ensureUser'
import type { Env, Vars } from '../types'

const BreakdownSchema = z
  .object({
    perSection: z.record(
      z.string(),
      z.object({
        presented: z.number().int().min(0),
        correct: z.number().int().min(0),
        timeMs: z.number().int().min(0),
      }),
    ),
    missedQids: z.array(z.string()),
    version: z.literal(1),
  })
  .strict()

const PostBody = z
  .object({
    sessionId: z.number().int().positive(),
    mode: z.enum(['authentic', 'synthetic']),
    half: z.enum(['verbal', 'kvant']),
    examId: z.string().min(1).max(40).nullable().optional(),
    provpass: z.string().min(1).max(40).nullable().optional(),
    presented: z.number().int().min(0),
    answered: z.number().int().min(0),
    correct: z.number().int().min(0),
    seenBefore: z.number().int().min(0),
    durationMs: z.number().int().min(0),
    breakdown: BreakdownSchema,
  })
  .strict()

export const mockResultsRoute = new Hono<{ Bindings: Env; Variables: Vars }>()
  // GET /api/mock-results — this user's rows, newest-first, capped at 50.
  .get('/', async (c) => {
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)
    const rows = await db
      .select()
      .from(mockResults)
      .where(eq(mockResults.userId, userId))
      .orderBy(desc(mockResults.createdAt))
      .limit(50)
    return c.json({ results: rows })
  })

  // POST /api/mock-results — grade + store. Validates the session exists,
  // belongs to this user, is kind='mock', and is already ended (end the
  // session first via PATCH /api/sessions/:id, then POST the summary).
  // Upserts on the session_id unique index — idempotent retries.
  .post('/', zValidator('json', PostBody), async (c) => {
    const body = c.req.valid('json')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)

    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, body.sessionId), eq(sessions.userId, userId)))
      .limit(1)
    if (!session) {
      return c.json({ error: { code: 'not_found', message: 'Session not found' } }, 404)
    }
    if (session.kind !== 'mock') {
      return c.json(
        { error: { code: 'invalid_kind', message: 'Session is not a mock session' } },
        400,
      )
    }
    if (!session.endedAt) {
      return c.json(
        { error: { code: 'not_ended', message: 'Session must be ended before posting a result' } },
        400,
      )
    }

    const [row] = await db
      .insert(mockResults)
      .values({
        userId,
        sessionId: body.sessionId,
        mode: body.mode,
        half: body.half,
        examId: body.examId ?? null,
        provpass: body.provpass ?? null,
        presented: body.presented,
        answered: body.answered,
        correct: body.correct,
        seenBefore: body.seenBefore,
        durationMs: body.durationMs,
        breakdown: body.breakdown,
      })
      .onConflictDoUpdate({
        target: mockResults.sessionId,
        set: {
          mode: body.mode,
          half: body.half,
          examId: body.examId ?? null,
          provpass: body.provpass ?? null,
          presented: body.presented,
          answered: body.answered,
          correct: body.correct,
          seenBefore: body.seenBefore,
          durationMs: body.durationMs,
          breakdown: body.breakdown,
        },
      })
      .returning()
    return c.json({ result: row })
  })

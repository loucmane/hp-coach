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
//
// P5 infold PR 3 (docs/p5-infold-design.md Amendment 1 E): a pass's P5
// questions count in its result like any other; unknown questions never do.
// The stored result and what it rests on, `estimateBasis`, are decided HERE
// from the session's stored plan and the attempts it stored, each classified
// on the server (lib/mockScore.ts scoreMockResult): the posted summary is
// kept as it came only when it can rest on nothing but authentic and synthetic
// questions of the session; otherwise the server scores the pass from its own
// records. A basis in the body is accepted and ignored.

import { zValidator } from '@hono/zod-validator'
import { and, asc, desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { getDb } from '../db/client'
import { attempts, mockResults, sessions } from '../db/schema'
import { ensureUserRow } from '../lib/ensureUser'
import { MockBreakdownSchema, scoreMockResult } from '../lib/mockScore'
import type { Env, Vars } from '../types'

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
    breakdown: MockBreakdownSchema,
    // A client echoing a stored row may send the server's own basis back.
    // Accepted so the result still lands, and never read.
    estimateBasis: z.unknown().optional(),
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

    // From the session's own records — the plan it stored at start and the
    // attempts it stored, oldest first — never from the body's say-so.
    const sessionAttempts = await db
      .select({
        questionId: attempts.questionId,
        selectedAnswer: attempts.selectedAnswer,
        correct: attempts.correct,
        source: attempts.source,
      })
      .from(attempts)
      .where(and(eq(attempts.sessionId, session.id), eq(attempts.userId, userId)))
      .orderBy(asc(attempts.id))
    const scored = scoreMockResult(session.plan ?? null, sessionAttempts, {
      presented: body.presented,
      answered: body.answered,
      correct: body.correct,
      seenBefore: body.seenBefore,
      breakdown: body.breakdown,
    })
    const stored = {
      mode: body.mode,
      half: body.half,
      examId: body.examId ?? null,
      provpass: body.provpass ?? null,
      presented: scored.presented,
      answered: scored.answered,
      correct: scored.correct,
      seenBefore: scored.seenBefore,
      durationMs: body.durationMs,
      breakdown: scored.breakdown,
      estimateBasis: scored.estimateBasis,
    }

    const [row] = await db
      .insert(mockResults)
      .values({ userId, sessionId: body.sessionId, ...stored })
      .onConflictDoUpdate({ target: mockResults.sessionId, set: stored })
      .returning()
    return c.json({ result: row })
  })

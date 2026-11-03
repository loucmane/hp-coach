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
//                              / endedAt, and a Provpass's Markera `marks`
//                              (the owner's open mock session only)
//
// Authorization is implicit: every query is scoped by user_id (the row
// returned by ensureUserRow), so a forged session id from another user
// surfaces as 404, not 403, by design.

import { zValidator } from '@hono/zod-validator'
import { and, asc, desc, eq, isNotNull, isNull, ne, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { getDb } from '../db/client'
import { attempts, DEVICE_KINDS, sessions, users } from '../db/schema'
import { ensureUserRow } from '../lib/ensureUser'
import type { Env, Vars } from '../types'

const StartBody = z
  .object({
    kind: z.enum(['drill', 'mock', 'mock_diagnostic', 'lesson', 'adaptive_review', 'onboarding']),
    sections: z.string().max(120).optional(),
    // Ordered qids that make up this session's plan — so a resume on
    // another device replays the exact sequence. Optional (mock_diagnostic
    // and ad-hoc starts may omit it).
    plan: z.array(z.string().min(1).max(80)).max(500).optional(),
    device: z.enum(DEVICE_KINDS).optional(),
  })
  .strict()

// A question id: the sitting or P5 unit as lower-case tokens, then the
// section and a three-digit number (host-2014-kvant1-NOG-026,
// p5-las-b19-002-r1-LÄS-001). The sections are lib/section.ts's, including
// its legacy LAS spelling of LÄS.
const QID = /^[a-z0-9]+(?:-[a-z0-9]+)*-(?:ORD|L[ÄA]S|MEK|ELF|XYZ|KVA|NOG|DTK)-[0-9]{3}$/

const UpdateBody = z
  .object({
    position: z.number().int().min(0).max(10_000).optional(),
    currentQuestionId: z.string().min(1).max(80).nullable().optional(),
    device: z.enum(DEVICE_KINDS).optional(),
    end: z.literal(true).optional(), // shorthand for endedAt = now
    // A Provpass's Markera marks (LJ-12): the whole set of marked qids, which
    // replaces the stored one. Only an open mock session takes them.
    marks: z.array(z.string().max(80).regex(QID)).max(80).optional(),
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

  // GET /api/sessions/history — COMPLETED passes, newest first, with a
  // per-pass tally (answered + correct) so the drill-history view can render
  // "KVA · 7/10 · 3 juli" rows that permalink to ?done=<id>.
  //
  // "Completed" = the user answered the whole stored plan (answered >=
  // plan length). This is the load-bearing filter: a session is ended on
  // BOTH real completion AND abandonment (starting a new drill retires the
  // prior active one, stamping endedAt). Without it, history fills with
  // "0/1 · 1/2" abandoned stubs — the owner's early sessions. Sessions with
  // no stored plan (pre-plan-storage rows) can't be judged complete, so
  // they're dropped too. Repetition passes are legitimately < 10 (bounded by
  // the due-mistake count), so we compare to the plan, not a fixed 10.
  // Capped at 50 recent.
  //
  // kind='mock' is EXCLUDED — a 40-question Provpass run has its own
  // completion + summary surface (/api/mock-results) and would otherwise
  // pollute this drill-history view with a very differently-shaped row.
  .get('/history', async (c) => {
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)
    const rows = await db
      .select({
        id: sessions.id,
        kind: sessions.kind,
        sections: sessions.sections,
        startedAt: sessions.startedAt,
        endedAt: sessions.endedAt,
        planLen: sql<number | null>`json_array_length(${sessions.plan})`,
        total: sql<number>`count(${attempts.id})`,
        correct: sql<number>`coalesce(sum(case when ${attempts.correct} = 1 then 1 else 0 end), 0)`,
      })
      .from(sessions)
      .leftJoin(attempts, eq(attempts.sessionId, sessions.id))
      .where(
        and(
          eq(sessions.userId, userId),
          isNotNull(sessions.endedAt),
          ne(sessions.kind, 'mock'),
          ne(sessions.kind, 'onboarding'),
        ),
      )
      .groupBy(sessions.id)
      .orderBy(desc(sessions.endedAt))
      .limit(200)
    return c.json({
      sessions: rows
        .filter((r) => {
          const total = Number(r.total)
          const planLen = r.planLen == null ? null : Number(r.planLen)
          return planLen != null && planLen > 0 && total >= planLen
        })
        .slice(0, 50)
        .map(({ planLen: _planLen, ...r }) => ({
          ...r,
          total: Number(r.total),
          correct: Number(r.correct),
        })),
    })
  })

  // GET /api/sessions/:id/attempts — the answered questions for a session,
  // oldest first. Powers summary hydration: when a paused drill is adopted
  // on resume, the client pre-fills picks[] for questions answered before
  // the pause so the "Klart." payoff shows the true total, not just the
  // post-resume answers. `createdAt`/`timeTakenMs` are included so a
  // reload-adopted Provpass mock can rebuild its answer-sheet dwell times
  // (lib/mockSheet.ts sheetFromAttempts) rather than losing pacing data on
  // every resume — additive columns, existing (non-mock) consumers ignore
  // the extra fields. `confidence` (LJ-12) is additive the same way: how
  // sure the student said they were, null when none was given (and always
  // on a Provpass).
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
        timeTakenMs: attempts.timeTakenMs,
        createdAt: attempts.createdAt,
        confidence: attempts.confidence,
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

    // Single-active-per-kind: retire any prior open session of this kind,
    // then insert the new one — ATOMICALLY. D1's batch() runs the pair as
    // one transaction, so two near-simultaneous POSTs from a user's two
    // devices can't interleave between the "end prior" and the insert.
    // Without the batch, device A's insert could land an active row in the
    // gap between device B's update and B's insert, and B's insert would
    // then trip the (user, kind) partial unique index with a UNIQUE
    // violation (500). Concurrent batches serialize on D1's primary, so
    // each device's end-prior+insert is isolated and the invariant holds.
    // Bump the lifetime drill counter in the same transaction when this is
    // a drill start (only kind='drill' feeds the "pass" total), so the
    // count survives session-row retention. Spread in conditionally; the
    // insert stays at index 1 either way.
    const drillBump =
      body.kind === 'drill'
        ? [
            db
              .update(users)
              .set({ drillsTotal: sql`${users.drillsTotal} + 1` })
              .where(eq(users.id, userId)),
          ]
        : []
    const [, inserted] = await db.batch([
      db
        .update(sessions)
        .set({ endedAt: new Date() })
        .where(
          and(eq(sessions.userId, userId), eq(sessions.kind, body.kind), isNull(sessions.endedAt)),
        ),
      db
        .insert(sessions)
        .values({
          userId,
          kind: body.kind,
          sections: body.sections ?? null,
          position: 0,
          plan: body.plan ?? null,
          device: body.device ?? null,
        })
        .returning(),
      ...drillBump,
    ])
    const row = inserted[0]
    return c.json({ session: row }, 201)
  })

  // PATCH /api/sessions/:id — partial update. `end: true` is sugar for
  // setting endedAt to now; otherwise position / currentQuestionId /
  // device update (device so a resume re-stamps where work continued).
  //
  // `marks` (LJ-12) stores a Provpass's Markera set, so the marks survive a
  // device swap and reach Historik. Only the owner's open mock session takes
  // them, and both conditions are part of the write itself: a pass that ended
  // meanwhile on another device keeps the marks it ended with. A PATCH that
  // carries marks is refused whole, so none of its other fields apply either.
  // Another user's id is a 404, as everywhere; a session of another kind, or
  // one that has ended, is a 409. Without marks the PATCH is unchanged.
  .patch('/:id', zValidator('param', IdParam), zValidator('json', UpdateBody), async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)

    const patch: Partial<typeof sessions.$inferInsert> = {}
    if (typeof body.position === 'number') patch.position = body.position
    if (body.currentQuestionId !== undefined) patch.currentQuestionId = body.currentQuestionId
    if (body.device !== undefined) patch.device = body.device
    // A set: a repeated qid is one mark, first occurrence first.
    if (body.marks !== undefined) patch.marks = [...new Set(body.marks)]
    if (body.end) patch.endedAt = new Date()

    const owned = and(eq(sessions.id, id), eq(sessions.userId, userId))
    const writable =
      body.marks === undefined
        ? owned
        : and(owned, eq(sessions.kind, 'mock'), isNull(sessions.endedAt))
    const [row] = await db.update(sessions).set(patch).where(writable).returning()
    if (row) return c.json({ session: row })

    if (body.marks !== undefined) {
      // The guarded write missed: say why. A session never changes kind or
      // reopens, so an owned mock found here is one that has ended.
      const [session] = await db
        .select({ kind: sessions.kind })
        .from(sessions)
        .where(owned)
        .limit(1)
      if (session && session.kind !== 'mock') {
        return c.json(
          { error: { code: 'invalid_kind', message: 'Session is not a mock session' } },
          409,
        )
      }
      if (session) {
        return c.json({ error: { code: 'ended', message: 'The pass has ended' } }, 409)
      }
    }
    return c.json({ error: { code: 'not_found', message: 'Session not found' } }, 404)
  })

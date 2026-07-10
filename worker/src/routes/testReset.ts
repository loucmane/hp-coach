// /api/test-reset — e2e fixture helper for deterministic mistakes state.
//
// The mistakes e2e (app/tests-e2e/mistakes.spec.ts) was CI-skipped because
// the POST /api/mistakes → GET /api/mistakes/due chain has a built-in
// timing trap: a freshly-recorded wrong answer gets `nextReviewAt = now +
// 10min` from the SRS first-rung relearn interval, so /due returns an
// empty list right after Phase 1 records it. Locally the test passes
// because the dogfood D1 already has older mistakes whose nextReviewAt
// has elapsed; CI's fresher state has only the just-seeded row.
//
// This endpoint solves it without watering down the test:
//   - `action: "clear"` — wipe every mistake + session row for the
//     authenticated user. Lets the test start from a known zero state.
//   - `action: "expire-all"` — backdate `nextReviewAt` on every active
//     mistake so they're immediately due. The test calls this between
//     Phase 1 (record a miss) and Phase 2 (replay) so the just-seeded
//     row surfaces in /due regardless of wall-clock timing.
//   - `action: "seed"` — insert ONE active mistake for `questionId`,
//     already due (nextReviewAt = epoch, intervalMinutes = 0). This lets
//     the replay loop establish its precondition deterministically —
//     without drilling a whole session through the UI just to miss one
//     question, which is the slow, Clerk-refresh-sensitive part of the
//     old flow. The qid must exist in the question bank the SPA loads so
//     the replay queue can render it; the caller passes one it knows.
//   - `action: "seed-mocks"` — insert one ended `mock` session + one
//     `mock_results` row per half (verbal, kvant), both dated `now`.
//     Added for task #175 (home.spec.ts e2e flake): `useDailyPlan`'s
//     scheduler treats a user with no mock history as "baseline due"
//     (scheduler.ts `prescribeMock`) and renders the Kallelse summons
//     instead of an ordinary plan row; when the Kallelse item is the
//     ONLY plan item, `DailyPlanCard` renders null (mock-only day —
//     see its own comment), so neither `daily-plan-card` nor
//     `daily-plan-skeleton` ever appears and home.spec.ts:40's
//     `card.or(skeleton)` wait times out. Seeding one fresh result per
//     half makes both halves "just mocked" so `prescribeMock` returns
//     `due: false` and the ordinary numbered plan renders deterministically.
//
// Safety: route is mounted in index.ts ONLY when ENVIRONMENT !== 'production'.
// We also gate inside the handler so a future routing slip can't bypass.

import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { getDb } from '../db/client'
import { mistakes, mockResults, sessions, users } from '../db/schema'
import { ensureUserRow } from '../lib/ensureUser'
import type { Env, Vars } from '../types'

const Body = z
  .object({
    action: z.enum(['clear', 'expire-all', 'seed', 'seed-mocks']).default('clear'),
    // Only read for action:'seed'. The qid to log as a due mistake; must
    // be a real question in the SPA's bank so the replay queue can render
    // it. Bounded like the other qid params in the API.
    questionId: z.string().min(1).max(80).optional(),
  })
  .strict()

export const testResetRoute = new Hono<{ Bindings: Env; Variables: Vars }>().post(
  '/',
  zValidator('json', Body),
  async (c) => {
    if (c.env.ENVIRONMENT === 'production') {
      return c.json(
        { error: { code: 'forbidden', message: '/test-reset is disabled in production' } },
        403,
      )
    }
    const { action } = c.req.valid('json')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)

    if (action === 'clear') {
      // Sessions first, because mistakes might reference session ids via
      // attempts in a future schema. Today they're independent, but the
      // ordering is conservative against future fk edges.
      const sDel = await db
        .delete(sessions)
        .where(eq(sessions.userId, userId))
        .returning({ id: sessions.id })
      const mDel = await db
        .delete(mistakes)
        .where(eq(mistakes.userId, userId))
        .returning({ id: mistakes.id })
      // Zero the lifetime counters too — they're maintained incrementally,
      // so a row wipe must reset them or they'd drift from the (now empty)
      // tables and make stats non-deterministic for tests.
      await db.update(users).set({ attemptsTotal: 0, drillsTotal: 0 }).where(eq(users.id, userId))
      return c.json({
        ok: true as const,
        action,
        deleted: { mistakes: mDel.length, sessions: sDel.length },
      })
    }
    if (action === 'seed') {
      const questionId = c.req.valid('json').questionId
      if (!questionId) {
        return c.json(
          {
            error: { code: 'bad_request', message: "action:'seed' requires questionId" },
          },
          400,
        )
      }
      // One active, immediately-due mistake. Mirrors the shape a real miss
      // leaves behind (status active, errorCount7d 1, intervalMinutes 0)
      // but with nextReviewAt backdated to the epoch so /api/mistakes/due
      // returns it without the 10-minute relearn wait — no expire-all hop
      // needed. The caller clears first, so there's no (user, qid) clash.
      const [row] = await db
        .insert(mistakes)
        .values({
          userId,
          questionId,
          status: 'active',
          errorCount7d: 1,
          lastErrorAt: new Date(),
          nextReviewAt: new Date(0),
          intervalMinutes: 0,
        })
        .returning({ id: mistakes.id })
      return c.json({ ok: true as const, action, seeded: { id: row.id, questionId } })
    }
    if (action === 'seed-mocks') {
      // One ended `mock` session + one `mock_results` row per half, both
      // dated `now`. `sessions.kind` has no partial-unique constraint
      // outside "one ACTIVE session per (user, kind)" (endedAt IS NULL),
      // so multiple ended mock sessions coexist fine — no clear needed
      // first. `mock_results.sessionId` is unique, so each session gets
      // exactly one result row (upsert not needed — these are fresh ids).
      const halves = ['verbal', 'kvant'] as const
      const seeded: { half: string; sessionId: number; resultId: number }[] = []
      for (const half of halves) {
        const [session] = await db
          .insert(sessions)
          .values({
            userId,
            kind: 'mock',
            sections: half,
            position: 0,
            endedAt: new Date(),
          })
          .returning({ id: sessions.id })
        const [result] = await db
          .insert(mockResults)
          .values({
            userId,
            sessionId: session.id,
            mode: 'synthetic',
            half,
            presented: 12,
            answered: 12,
            correct: 10,
            seenBefore: 0,
            durationMs: 600_000,
            breakdown: { perSection: {}, missedQids: [], version: 1 },
          })
          .returning({ id: mockResults.id })
        seeded.push({ half, sessionId: session.id, resultId: result.id })
      }
      return c.json({ ok: true as const, action, seeded })
    }
    // action === 'expire-all'
    // Backdate every active mistake's nextReviewAt to the unix epoch so
    // they all satisfy `nextReviewAt <= now` in /api/mistakes/due. We
    // pass `new Date(0)` because the column is mode:'timestamp' and
    // drizzle's D1 dialect serializes a Date to a unix epoch integer.
    const updated = await db
      .update(mistakes)
      .set({ nextReviewAt: new Date(0) })
      .where(eq(mistakes.userId, userId))
      .returning({ id: mistakes.id })
    return c.json({
      ok: true as const,
      action,
      updated: { mistakes: updated.length },
    })
  },
)

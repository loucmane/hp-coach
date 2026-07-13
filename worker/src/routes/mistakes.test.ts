// Integration tests for /api/mistakes — the wrong-answer ledger + spaced
// replay queue. Drives the REAL Hono route against an in-memory D1
// (node:sqlite shim from the generated migrations), mirroring
// mockResults.test.ts / dailyPlans.test.ts.
//
// Focus: the GET /due endpoint's `scope` query param — `due` (default,
// nextReviewAt-gated) vs `all` (whole active queue, ungated). The two
// vocabularies must stay honest: `all` counts a fresh mistake scheduled
// for tomorrow; `due` does not until it ripens.

import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it } from 'vitest'

import { getDb } from '../db/client'
import { mistakes, users } from '../db/schema'
import { makeTestD1, type ShimD1 } from '../lib/testD1'
import type { Env, Vars } from '../types'
import { mistakesRoute } from './mistakes'

let d1: ShimD1

function appFor(asUser: string) {
  const env = { DB: d1 } as unknown as Env
  const app = new Hono<{ Bindings: Env; Variables: Vars }>()
    .use('*', async (c, next) => {
      c.set('userId', asUser)
      await next()
    })
    .route('/', mistakesRoute)
  return { app, env }
}

/** Seed a mistake row directly so tests control status + nextReviewAt
 *  precisely (bypassing the SRS ladder the POST path would apply). */
async function seedMistake(
  d1_: ShimD1,
  clerkUserId: string,
  opts: {
    questionId: string
    status?: string
    nextReviewAt?: Date | null
    errorCount7d?: number
    /** When set, controls the row's lastErrorAt — the "touched today"
     *  signal scope=pile reads. Omitted → defaults to `now` (a fresh
     *  mistake). Pass a prior-day Date to model an older, dormant miss. */
    lastErrorAt?: Date
  },
): Promise<{ userId: number }> {
  const db = getDb(d1_ as unknown as D1Database)
  let [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId))
  if (!user) {
    ;[user] = await db.insert(users).values({ clerkUserId }).returning()
  }
  await db.insert(mistakes).values({
    userId: user.id,
    questionId: opts.questionId,
    status: opts.status ?? 'active',
    errorCount7d: opts.errorCount7d ?? 1,
    intervalMinutes: 10,
    lastErrorAt: opts.lastErrorAt ?? new Date(),
    nextReviewAt: opts.nextReviewAt === undefined ? new Date(Date.now() - 1000) : opts.nextReviewAt,
  })
  return { userId: user.id }
}

async function getDue(asUser: string, query: Record<string, string> = {}) {
  const { app, env } = appFor(asUser)
  const qs = new URLSearchParams(query).toString()
  const res = await app.request(`/due${qs ? `?${qs}` : ''}`, {}, env)
  return { res, body: (await res.json()) as { mistakes: Array<{ questionId: string }> } }
}

beforeEach(() => {
  d1 = makeTestD1()
})

describe('GET /api/mistakes/due — scope param', () => {
  it('defaults to scope=due: only ripe (nextReviewAt ≤ now / NULL) mistakes', async () => {
    // one ripe (past), one scheduled for tomorrow (future)
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-001',
      nextReviewAt: new Date(Date.now() - 60_000),
    })
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-002',
      nextReviewAt: new Date(Date.now() + 24 * 3600_000),
    })

    const { res, body } = await getDue('u1')
    expect(res.status).toBe(200)
    expect(body.mistakes.map((m) => m.questionId)).toEqual(['var-2026-verb1-ORD-001'])
  })

  it('scope=all returns every active mistake regardless of nextReviewAt', async () => {
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-001',
      nextReviewAt: new Date(Date.now() - 60_000),
    })
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-002',
      nextReviewAt: new Date(Date.now() + 24 * 3600_000),
    })

    const { res, body } = await getDue('u1', { scope: 'all' })
    expect(res.status).toBe(200)
    expect(body.mistakes.map((m) => m.questionId).sort()).toEqual([
      'var-2026-verb1-ORD-001',
      'var-2026-verb1-ORD-002',
    ])
  })

  it('scope=all still excludes resolved (graduated) mistakes', async () => {
    await seedMistake(d1, 'u1', { questionId: 'var-2026-verb1-ORD-001', status: 'active' })
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-002',
      status: 'resolved',
      nextReviewAt: null,
    })

    const { body } = await getDue('u1', { scope: 'all' })
    expect(body.mistakes.map((m) => m.questionId)).toEqual(['var-2026-verb1-ORD-001'])
  })

  it('scope=all honours the section filter', async () => {
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-001',
      nextReviewAt: new Date(Date.now() + 3600_000),
    })
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-kvant1-XYZ-004',
      nextReviewAt: new Date(Date.now() + 3600_000),
    })

    const { body } = await getDue('u1', { scope: 'all', section: 'ORD' })
    expect(body.mistakes.map((m) => m.questionId)).toEqual(['var-2026-verb1-ORD-001'])
  })

  it('scope is per-user scoped (no cross-user leakage)', async () => {
    await seedMistake(d1, 'u1', { questionId: 'var-2026-verb1-ORD-001' })
    await seedMistake(d1, 'u2', { questionId: 'var-2026-verb1-ORD-009' })

    const { body } = await getDue('u1', { scope: 'all' })
    expect(body.mistakes.map((m) => m.questionId)).toEqual(['var-2026-verb1-ORD-001'])
  })

  it('rejects an invalid scope value', async () => {
    const { res } = await getDue('u1', { scope: 'everything' })
    expect(res.status).toBe(400)
  })
})

describe("GET /api/mistakes/due — scope=pile (today's pile)", () => {
  // Client's local-midnight epoch, as the app sends it.
  const dayStart = (() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return String(d.getTime())
  })()
  const HOUR = 3600_000
  const DAY = 24 * HOUR

  it('includes a due-now item', async () => {
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-001',
      nextReviewAt: new Date(Date.now() - 60_000),
      lastErrorAt: new Date(Date.now() - 3 * DAY),
    })
    const { res, body } = await getDue('u1', { scope: 'pile', dayStart })
    expect(res.status).toBe(200)
    expect(body.mistakes.map((m) => m.questionId)).toEqual(['var-2026-verb1-ORD-001'])
  })

  it('includes a created-today item even when scheduled for tomorrow', async () => {
    // Made today (lastErrorAt now), then answered correct once → pushed to
    // tomorrow. Still on today's pile because it was touched today.
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-002',
      nextReviewAt: new Date(Date.now() + DAY),
      lastErrorAt: new Date(),
    })
    const { body } = await getDue('u1', { scope: 'pile', dayStart })
    expect(body.mistakes.map((m) => m.questionId)).toEqual(['var-2026-verb1-ORD-002'])
  })

  it('EXCLUDES an old item scheduled for tomorrow (dormant, not touched today)', async () => {
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-003',
      nextReviewAt: new Date(Date.now() + DAY),
      lastErrorAt: new Date(Date.now() - 3 * DAY),
    })
    const { body } = await getDue('u1', { scope: 'pile', dayStart })
    expect(body.mistakes).toEqual([])
  })

  it('EXCLUDES resolved (graduated) mistakes', async () => {
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-004',
      status: 'resolved',
      nextReviewAt: null,
      lastErrorAt: new Date(),
    })
    const { body } = await getDue('u1', { scope: 'pile', dayStart })
    expect(body.mistakes).toEqual([])
  })

  it('keeps a just-WRONGED older mistake in the pile (static, no phantom −1)', async () => {
    // The wrong-repetition invariant: an old mistake answered WRONG in
    // /repetition has nextReviewAt reset to +10 min (no longer "due") but
    // lastErrorAt bumped to now — so it must STAY on today's pile. If this
    // dropped, the numeral would tick down on a wrong answer (owner bug).
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-005',
      nextReviewAt: new Date(Date.now() + 10 * 60_000),
      lastErrorAt: new Date(),
    })
    const { body } = await getDue('u1', { scope: 'pile', dayStart })
    expect(body.mistakes.map((m) => m.questionId)).toEqual(['var-2026-verb1-ORD-005'])
  })

  it('failing an existing active mistake does not duplicate its row (POST upsert)', async () => {
    // Record a wrong answer twice for the SAME question via the real POST
    // path → one row (upsert by questionId), so the pile can never double
    // count a repeated stumble.
    const { app, env } = appFor('u1')
    const record = (questionId: string) =>
      app.request(
        '/',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ questionId }),
        },
        env,
      )
    await record('var-2026-verb1-ORD-006')
    await record('var-2026-verb1-ORD-006')
    const { body } = await getDue('u1', { scope: 'pile', dayStart })
    expect(body.mistakes.map((m) => m.questionId)).toEqual(['var-2026-verb1-ORD-006'])
  })

  it('honours the section filter', async () => {
    await seedMistake(d1, 'u1', { questionId: 'var-2026-verb1-ORD-001', lastErrorAt: new Date() })
    await seedMistake(d1, 'u1', { questionId: 'var-2026-kvant1-XYZ-004', lastErrorAt: new Date() })
    const { body } = await getDue('u1', { scope: 'pile', dayStart, section: 'ORD' })
    expect(body.mistakes.map((m) => m.questionId)).toEqual(['var-2026-verb1-ORD-001'])
  })
})

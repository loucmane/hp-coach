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

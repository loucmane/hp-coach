// Integration tests for /api/mock-results — the Provpass (mock exam)
// per-pass summary. Drives the REAL Hono route against an in-memory D1
// (node:sqlite shim from the generated migrations), mirroring
// dailyPlans.test.ts / lessonReads.test.ts.

import { Hono } from 'hono'
import { beforeEach, describe, expect, it } from 'vitest'

import { getDb } from '../db/client'
import { sessions, users } from '../db/schema'
import { makeTestD1, type ShimD1 } from '../lib/testD1'
import type { Env, Vars } from '../types'
import { mockResultsRoute } from './mockResults'

let d1: ShimD1

function appFor(asUser: string) {
  const env = { DB: d1 } as unknown as Env
  const app = new Hono<{ Bindings: Env; Variables: Vars }>()
    .use('*', async (c, next) => {
      c.set('userId', asUser)
      await next()
    })
    .route('/', mockResultsRoute)
  return { app, env }
}

const BREAKDOWN = {
  perSection: { XYZ: { presented: 12, correct: 10, timeMs: 500_000 } },
  missedQids: ['var-2024-XYZ-003'],
  version: 1 as const,
}

// Directly seed a session row (bypassing the sessions route) so tests can
// control kind/endedAt precisely. Mirrors how the mock-results route reads
// sessions: scoped by (id, userId).
async function seedSession(
  d1_: ShimD1,
  clerkUserId: string,
  opts: { kind?: string; ended?: boolean } = {},
): Promise<{ userId: number; sessionId: number }> {
  const db = getDb(d1_ as unknown as D1Database)
  const [user] = await db.insert(users).values({ clerkUserId }).returning()
  const [session] = await db
    .insert(sessions)
    .values({
      userId: user.id,
      kind: opts.kind ?? 'mock',
      endedAt: opts.ended === false ? null : new Date(),
    })
    .returning()
  return { userId: user.id, sessionId: session.id }
}

function postBody(sessionId: number, overrides: Record<string, unknown> = {}) {
  return {
    sessionId,
    mode: 'authentic',
    half: 'kvant',
    examId: 'var-2024',
    provpass: 'kvant-1',
    presented: 40,
    answered: 40,
    correct: 30,
    seenBefore: 5,
    durationMs: 3_600_000,
    breakdown: BREAKDOWN,
    ...overrides,
  }
}

async function post(asUser: string, body: unknown) {
  const { app, env } = appFor(asUser)
  return app.request(
    '/',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
    env,
  )
}

async function get(asUser: string) {
  const { app, env } = appFor(asUser)
  const res = await app.request('/', {}, env)
  return { res, body: (await res.json()) as { results: unknown[] } }
}

beforeEach(() => {
  d1 = makeTestD1()
})

describe('POST /api/mock-results', () => {
  it('stores a mock result for an ended mock session', async () => {
    const { sessionId } = await seedSession(d1, 'user_a')
    const res = await post('user_a', postBody(sessionId))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { result: Record<string, unknown> }
    expect(body.result.sessionId).toBe(sessionId)
    expect(body.result.correct).toBe(30)
    expect(body.result.breakdown).toEqual(BREAKDOWN)
  })

  it('is idempotent — a retry with the same sessionId upserts, not duplicates', async () => {
    const { sessionId } = await seedSession(d1, 'user_a')
    await post('user_a', postBody(sessionId))
    const second = await post('user_a', postBody(sessionId, { correct: 32 }))
    expect(second.status).toBe(200)

    const { body } = await get('user_a')
    expect(body.results).toHaveLength(1)
    expect((body.results[0] as { correct: number }).correct).toBe(32)
  })

  it('404s on a forged/unowned sessionId', async () => {
    const { sessionId } = await seedSession(d1, 'user_a')
    const res = await post('user_b', postBody(sessionId))
    expect(res.status).toBe(404)
  })

  it('404s on a sessionId that does not exist at all', async () => {
    const res = await post('user_a', postBody(999_999))
    expect(res.status).toBe(404)
  })

  it('400s when the session kind is not "mock"', async () => {
    const { sessionId } = await seedSession(d1, 'user_a', { kind: 'drill' })
    const res = await post('user_a', postBody(sessionId))
    expect(res.status).toBe(400)
  })

  it('400s when the session has not been ended yet', async () => {
    const { sessionId } = await seedSession(d1, 'user_a', { ended: false })
    const res = await post('user_a', postBody(sessionId))
    expect(res.status).toBe(400)
  })

  it('rejects a malformed body (zod validation)', async () => {
    const { sessionId } = await seedSession(d1, 'user_a')
    const res = await post('user_a', postBody(sessionId, { mode: 'bogus' }))
    expect(res.status).toBe(400)
  })
})

describe('GET /api/mock-results', () => {
  it('returns this user’s rows newest-first with breakdown parsed to JSON', async () => {
    const s1 = await seedSession(d1, 'user_a')
    await post('user_a', postBody(s1.sessionId))

    const { userId } = s1
    // Second session for the same user, ended later.
    const db = getDb(d1 as unknown as D1Database)
    const [session2] = await db
      .insert(sessions)
      .values({ userId, kind: 'mock', endedAt: new Date(Date.now() + 10_000) })
      .returning()
    await post('user_a', postBody(session2.id, { correct: 20 }))

    const { body } = await get('user_a')
    expect(body.results).toHaveLength(2)
    const [newest, oldest] = body.results as Array<{
      sessionId: number
      correct: number
      breakdown: unknown
    }>
    expect(newest.sessionId).toBe(session2.id)
    expect(oldest.sessionId).toBe(s1.sessionId)
    expect(newest.correct).toBe(20)
    expect(newest.breakdown).toEqual(BREAKDOWN)
  })

  it('caps at 50 rows', async () => {
    const { sessionId, userId } = await seedSession(d1, 'user_a')
    await post('user_a', postBody(sessionId))
    const db = getDb(d1 as unknown as D1Database)
    for (let i = 0; i < 55; i++) {
      const [s] = await db
        .insert(sessions)
        .values({ userId, kind: 'mock', endedAt: new Date(Date.now() + i * 1000) })
        .returning()
      await post('user_a', postBody(s.id))
    }
    const { body } = await get('user_a')
    expect(body.results).toHaveLength(50)
  })

  it('never leaks one user’s mock results to another', async () => {
    const a = await seedSession(d1, 'user_a')
    const b = await seedSession(d1, 'user_b')
    await post('user_a', postBody(a.sessionId))
    await post('user_b', postBody(b.sessionId))

    const resA = await get('user_a')
    const resB = await get('user_b')
    expect(resA.body.results).toHaveLength(1)
    expect(resB.body.results).toHaveLength(1)
  })
})

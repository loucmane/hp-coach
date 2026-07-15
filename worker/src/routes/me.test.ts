// Integration tests for /api/me — currently scoped to GET /me/exposure,
// the per-question exposure map that seeds a mock's seenBefore snapshot
// and (client-side) drives "you've seen this before" surfaces.
//
// NOTE: exposure is a LIVE aggregate over `attempts`, unlike
// mock_results.seenBefore (a stored snapshot). attempts rows are pruned
// after ~120 days (lib/retention.ts), so this endpoint's counts silently
// shrink as old attempts age out — by design, documented on the route.

import { Hono } from 'hono'
import { beforeEach, describe, expect, it } from 'vitest'

import { getDb } from '../db/client'
import { attempts, sessions, users } from '../db/schema'
import { makeTestD1, type ShimD1 } from '../lib/testD1'
import type { Env, Vars } from '../types'
import { meRoute } from './me'

let d1: ShimD1

function appFor(asUser: string) {
  const env = { DB: d1 } as unknown as Env
  const app = new Hono<{ Bindings: Env; Variables: Vars }>()
    .use('*', async (c, next) => {
      c.set('userId', asUser)
      await next()
    })
    .route('/', meRoute)
  return { app, env }
}

async function getExposure(asUser = 'user_a') {
  const { app, env } = appFor(asUser)
  const res = await app.request('/exposure', {}, env)
  return {
    res,
    body: (await res.json()) as { exposure: Record<string, { n: number; last: string | number }> },
  }
}

async function seedAttempt(clerkUserId: string, questionId: string, createdAt: Date = new Date()) {
  const db = getDb(d1 as unknown as D1Database)
  const [user] = await db
    .insert(users)
    .values({ clerkUserId })
    .onConflictDoUpdate({ target: users.clerkUserId, set: { clerkUserId } })
    .returning()
  const [session] = await db
    .insert(sessions)
    .values({ userId: user.id, kind: 'drill', endedAt: new Date() })
    .returning()
  await db.insert(attempts).values({
    userId: user.id,
    sessionId: session.id,
    questionId,
    correct: true,
    createdAt,
  })
}

beforeEach(() => {
  d1 = makeTestD1()
})

describe('GET /api/me/exposure', () => {
  it('returns an empty map for a fresh user', async () => {
    const { res, body } = await getExposure()
    expect(res.status).toBe(200)
    expect(body.exposure).toEqual({})
  })

  it('groups attempts by question, counting n and tracking the latest timestamp', async () => {
    await seedAttempt('user_a', 'var-2024-XYZ-001', new Date('2026-01-01T00:00:00Z'))
    await seedAttempt('user_a', 'var-2024-XYZ-001', new Date('2026-02-01T00:00:00Z'))
    await seedAttempt('user_a', 'var-2024-KVA-002', new Date('2026-01-15T00:00:00Z'))

    const { body } = await getExposure()
    expect(body.exposure['var-2024-XYZ-001'].n).toBe(2)
    expect(body.exposure['var-2024-KVA-002'].n).toBe(1)
  })

  it('never leaks one user’s exposure to another', async () => {
    await seedAttempt('user_a', 'var-2024-XYZ-001')
    await seedAttempt('user_b', 'var-2024-XYZ-001')

    const a = await getExposure('user_a')
    const b = await getExposure('user_b')
    expect(a.body.exposure['var-2024-XYZ-001'].n).toBe(1)
    expect(b.body.exposure['var-2024-XYZ-001'].n).toBe(1)
  })
})

describe('PATCH /api/me/prefs — mockDeferredDate ("Inte idag" defer)', () => {
  async function patchPrefs(body: unknown, asUser = 'user_a') {
    const { app, env } = appFor(asUser)
    const res = await app.request(
      '/prefs',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      },
      env,
    )
    return { res, body: (await res.json()) as { prefs?: { mockDeferredDate?: string | null } } }
  }

  it('persists a valid YYYY-MM-DD defer date and reads it back', async () => {
    const { res, body } = await patchPrefs({ mockDeferredDate: '2026-07-15' })
    expect(res.status).toBe(200)
    expect(body.prefs?.mockDeferredDate).toBe('2026-07-15')
  })

  it('clears the defer with null', async () => {
    await patchPrefs({ mockDeferredDate: '2026-07-15' })
    const { body } = await patchPrefs({ mockDeferredDate: null })
    expect(body.prefs?.mockDeferredDate).toBeNull()
  })

  it('rejects a malformed defer date (not YYYY-MM-DD)', async () => {
    const { res } = await patchPrefs({ mockDeferredDate: 'today' })
    expect(res.status).toBe(400)
  })

  it('defaults to null for a fresh user row', async () => {
    // A prefs GET lazily creates the row; the new column has no default.
    const { app, env } = appFor('user_fresh')
    const res = await app.request('/prefs', {}, env)
    const body = (await res.json()) as { prefs?: { mockDeferredDate?: string | null } }
    expect(body.prefs?.mockDeferredDate ?? null).toBeNull()
  })
})

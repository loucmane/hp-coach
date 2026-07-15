// Integration tests for the PL-L.1 read/trigger endpoints:
//   GET  /api/item-stats?section=X   (itemStatsRoute)
//   POST /api/fit/run                (fitRoute)
//   GET  /api/me/ability             (meRoute)
//
// Drives the REAL Hono routes against an in-memory D1 (migration-built
// shim), mirroring mistakes.test.ts / me.test.ts. Auth is stubbed by a
// middleware that sets c.var.userId directly; the shapes + per-user scoping
// are what these assert. The fit MATH is covered in lib/fit.test.ts.

import { Hono } from 'hono'
import { beforeEach, describe, expect, it } from 'vitest'

import { getDb } from '../db/client'
import { attempts, sessions, users } from '../db/schema'
import { makeTestD1, type ShimD1 } from '../lib/testD1'
import type { Env, Vars } from '../types'
import { fitRoute, itemStatsRoute } from './fit'
import { meRoute } from './me'

let d1: ShimD1

// A single app wiring all three routes under their real prefixes so the
// request paths match production (/item-stats, /fit, /me).
function appFor(asUser: string) {
  const env = { DB: d1 } as unknown as Env
  const app = new Hono<{ Bindings: Env; Variables: Vars }>()
    .use('*', async (c, next) => {
      c.set('userId', asUser)
      await next()
    })
    .route('/item-stats', itemStatsRoute)
    .route('/fit', fitRoute)
    .route('/me', meRoute)
  return { app, env }
}

// An app with NO auth middleware — userId is never set. Used to prove the
// endpoints depend on the auth var (the real requireAuth sets it upstream).
function unauthedAppFor() {
  const env = { DB: d1 } as unknown as Env
  const app = new Hono<{ Bindings: Env; Variables: Vars }>()
    .route('/item-stats', itemStatsRoute)
    .route('/fit', fitRoute)
    .route('/me', meRoute)
  return { app, env }
}

async function seedAttempt(clerkUserId: string, questionId: string, correct: boolean) {
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
  await db.insert(attempts).values({ userId: user.id, sessionId: session.id, questionId, correct })
}

async function runFitVia(asUser = 'u1') {
  const { app, env } = appFor(asUser)
  const res = await app.request('/fit/run', { method: 'POST' }, env)
  return { res, body: (await res.json()) as { processed: number; watermark: number } }
}

beforeEach(() => {
  d1 = makeTestD1()
})

describe('POST /api/fit/run', () => {
  it('runs the fit and reports processed count + watermark', async () => {
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', true)
    await seedAttempt('u1', 'var-2026-verb1-ORD-002', false)
    const { res, body } = await runFitVia()
    expect(res.status).toBe(200)
    expect(body.processed).toBe(2)
    expect(body.watermark).toBeGreaterThan(0)
  })

  it('is idempotent — a second call processes nothing new', async () => {
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', true)
    await runFitVia()
    const { body } = await runFitVia()
    expect(body.processed).toBe(0)
  })
})

describe('GET /api/item-stats', () => {
  it('returns { [qid]: difficulty } for the requested section only', async () => {
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', false) // ORD, gets harder
    await seedAttempt('u1', 'var-2026-kvant1-XYZ-001', false) // XYZ, other section
    await runFitVia()

    const { app, env } = appFor('u1')
    const res = await app.request('/item-stats?section=ORD', {}, env)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { difficulties: Record<string, number> }
    expect(Object.keys(body.difficulties)).toEqual(['var-2026-verb1-ORD-001'])
    expect(body.difficulties['var-2026-verb1-ORD-001']).toBeGreaterThan(0)
  })

  it('is empty before any fit has run (no fitted rows yet)', async () => {
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', true)
    const { app, env } = appFor('u1')
    const res = await app.request('/item-stats?section=ORD', {}, env)
    const body = (await res.json()) as { difficulties: Record<string, number> }
    expect(body.difficulties).toEqual({})
  })

  it('is GLOBAL — an item shows the same difficulty to any user', async () => {
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', false)
    await seedAttempt('u2', 'var-2026-verb1-ORD-001', false)
    await runFitVia()

    const read = async (asUser: string) => {
      const { app, env } = appFor(asUser)
      const res = await app.request('/item-stats?section=ORD', {}, env)
      return ((await res.json()) as { difficulties: Record<string, number> }).difficulties
    }
    const a = await read('u1')
    const b = await read('u2')
    expect(a).toEqual(b)
  })

  it('rejects an unknown section with 400', async () => {
    const { app, env } = appFor('u1')
    const res = await app.request('/item-stats?section=NOPE', {}, env)
    expect(res.status).toBe(400)
  })

  it('requires the section param', async () => {
    const { app, env } = appFor('u1')
    const res = await app.request('/item-stats', {}, env)
    expect(res.status).toBe(400)
  })
})

describe('GET /api/me/ability', () => {
  it('returns { [section]: { ability, attempts } } for the caller', async () => {
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', true)
    await seedAttempt('u1', 'var-2026-kvant1-XYZ-001', false)
    await runFitVia()

    const { app, env } = appFor('u1')
    const res = await app.request('/me/ability', {}, env)
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      ability: Record<string, { ability: number; attempts: number }>
    }
    expect(Object.keys(body.ability).sort()).toEqual(['ORD', 'XYZ'])
    expect(body.ability.ORD.ability).toBeGreaterThan(0)
    expect(body.ability.ORD.attempts).toBe(1)
    expect(body.ability.XYZ.ability).toBeLessThan(0)
  })

  it('is per-user scoped — never leaks another user’s ability', async () => {
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', true)
    await seedAttempt('u2', 'var-2026-verb1-ORD-001', false)
    await runFitVia()

    const { app, env } = appFor('u2')
    const res = await app.request('/me/ability', {}, env)
    const body = (await res.json()) as {
      ability: Record<string, { ability: number; attempts: number }>
    }
    // u2 only ever answered wrong → their ORD ability is negative, distinct
    // from u1's positive one.
    expect(body.ability.ORD.ability).toBeLessThan(0)
  })

  it('returns an empty map for a user with no fitted attempts', async () => {
    const { app, env } = appFor('fresh-user')
    const res = await app.request('/me/ability', {}, env)
    const body = (await res.json()) as { ability: Record<string, unknown> }
    expect(body.ability).toEqual({})
  })
})

describe('auth dependency', () => {
  // Without the auth middleware, ensureUserRow gets an undefined clerk id
  // and the request fails rather than silently serving data — proof these
  // routes are gated by the upstream requireAuth that sets c.var.userId.
  it('/me/ability throws without an authenticated user', async () => {
    const { app, env } = unauthedAppFor()
    const res = await app.request('/me/ability', {}, env)
    expect(res.status).toBe(500)
  })
})

// Integration tests for DELETE /api/account — Clerk-first account deletion.
//
// Drives the REAL Hono route against an in-memory D1 (node:sqlite shim),
// with global fetch stubbed to stand in for Clerk's Backend API. Proves
// the safety-critical ordering:
//   - Clerk success → local rows are cascade-deleted.
//   - Clerk 5xx     → 502, and EVERY local row is left intact.
//   - Clerk 404     → user already gone, local cascade still proceeds.

import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getDb } from '../db/client'
import {
  attempts,
  dailyPlans,
  frameworkProgress,
  lessonProgress,
  lessonReads,
  mastery,
  mistakes,
  mockResults,
  sessions,
  srsState,
  users,
} from '../db/schema'
import { makeTestD1, type ShimD1 } from '../lib/testD1'
import type { Env, Vars } from '../types'
import { accountRoute } from './account'

let d1: ShimD1

function appFor(asUser: string) {
  const env = { DB: d1, CLERK_SECRET_KEY: 'sk_test_xxx' } as unknown as Env
  const app = new Hono<{ Bindings: Env; Variables: Vars }>()
    .use('*', async (c, next) => {
      c.set('userId', asUser)
      await next()
    })
    .route('/account', accountRoute)
  return { app, env }
}

async function deleteAccount(asUser: string) {
  const { app, env } = appFor(asUser)
  const res = await app.request('/account', { method: 'DELETE' }, env)
  return { res, body: await res.json() }
}

// Seed a realistic slice of data for a user across every user-scoped table.
async function seedUserData(clerkUserId: string) {
  const db = getDb(d1 as unknown as D1Database)
  const [user] = await db
    .insert(users)
    .values({ clerkUserId, coach: 'professor', palette: 'sage', dailyMinutes: 30 })
    .returning()

  const [drillSession] = await db
    .insert(sessions)
    .values({ userId: user.id, kind: 'drill', endedAt: new Date() })
    .returning()
  await db.insert(attempts).values({
    userId: user.id,
    sessionId: drillSession.id,
    questionId: 'var-2024-XYZ-001',
    selectedAnswer: 'B',
    correct: true,
    timeTakenMs: 12_000,
  })
  await db.insert(mistakes).values({
    userId: user.id,
    questionId: 'var-2024-KVA-002',
    layer1Ids: ['KVA-NEG-001'],
    status: 'active',
  })
  await db
    .insert(lessonProgress)
    .values({ userId: user.id, section: 'ord', frameworkId: 'ORD-ROOT-001' })
  await db.insert(lessonReads).values({ userId: user.id, entryId: 'ORD-ROOT-001' })
  await db.insert(dailyPlans).values({ userId: user.id, date: '2026-07-15', plan: { items: [] } })
  await db.insert(srsState).values({ userId: user.id, itemId: 'root-1', itemKind: 'ord_root' })
  await db
    .insert(mastery)
    .values({ userId: user.id, section: 'ord', layer1Id: 'ORD-ROOT-001', score: 0.4 })
  await db
    .insert(frameworkProgress)
    .values({ userId: user.id, layer1Id: 'ORD-ROOT-001', status: 'learning' })

  const [mockSession] = await db
    .insert(sessions)
    .values({ userId: user.id, kind: 'mock', endedAt: new Date() })
    .returning()
  await db.insert(mockResults).values({
    userId: user.id,
    sessionId: mockSession.id,
    mode: 'authentic',
    half: 'kvant',
    examId: 'var-2024',
    presented: 40,
    answered: 40,
    correct: 30,
    seenBefore: 5,
    durationMs: 3_600_000,
    breakdown: { perSection: {}, missedQids: [], version: 1 },
  })

  return { userId: user.id }
}

async function countAllRowsForUser(userId: number) {
  const db = getDb(d1 as unknown as D1Database)
  const [s, a, m, mr, lp, lr, dp, ss, ma, fp] = await Promise.all([
    db.select().from(sessions).where(eq(sessions.userId, userId)),
    db.select().from(attempts).where(eq(attempts.userId, userId)),
    db.select().from(mistakes).where(eq(mistakes.userId, userId)),
    db.select().from(mockResults).where(eq(mockResults.userId, userId)),
    db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId)),
    db.select().from(lessonReads).where(eq(lessonReads.userId, userId)),
    db.select().from(dailyPlans).where(eq(dailyPlans.userId, userId)),
    db.select().from(srsState).where(eq(srsState.userId, userId)),
    db.select().from(mastery).where(eq(mastery.userId, userId)),
    db.select().from(frameworkProgress).where(eq(frameworkProgress.userId, userId)),
  ])
  return {
    sessions: s.length,
    attempts: a.length,
    mistakes: m.length,
    mockResults: mr.length,
    lessonProgress: lp.length,
    lessonReads: lr.length,
    dailyPlans: dp.length,
    srsState: ss.length,
    mastery: ma.length,
    frameworkProgress: fp.length,
  }
}

const ZERO = {
  sessions: 0,
  attempts: 0,
  mistakes: 0,
  mockResults: 0,
  lessonProgress: 0,
  lessonReads: 0,
  dailyPlans: 0,
  srsState: 0,
  mastery: 0,
  frameworkProgress: 0,
}

/** Stub global fetch with a fixed Clerk response (or a thrown network error). */
function stubClerk(opts: { status?: number; throws?: boolean }) {
  const spy = vi.fn(async (_url: string | URL, _init?: RequestInit) => {
    if (opts.throws) throw new Error('network down')
    return new Response(JSON.stringify({ deleted: true }), { status: opts.status ?? 200 })
  })
  vi.stubGlobal('fetch', spy)
  return spy
}

beforeEach(() => {
  d1 = makeTestD1()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('DELETE /api/account — Clerk success', () => {
  it('cascade-deletes every local row and removes the user row', async () => {
    const { userId } = await seedUserData('user_a')
    const before = await countAllRowsForUser(userId)
    expect(before.sessions).toBeGreaterThan(0)

    const fetchSpy = stubClerk({ status: 200 })
    const { res, body } = await deleteAccount('user_a')

    expect(res.status).toBe(200)
    expect((body as { ok: boolean; deleted: boolean }).ok).toBe(true)
    expect((body as { deleted: boolean }).deleted).toBe(true)

    // Clerk was called first, with a DELETE to the user's endpoint.
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('/users/user_a')
    expect((init as RequestInit).method).toBe('DELETE')

    // Every local row for this user is gone, including the users row.
    expect(await countAllRowsForUser(userId)).toEqual(ZERO)
    const db = getDb(d1 as unknown as D1Database)
    const remaining = await db.select().from(users).where(eq(users.id, userId))
    expect(remaining).toHaveLength(0)
  })

  it('never touches another user’s rows', async () => {
    const a = await seedUserData('user_a')
    const b = await seedUserData('user_b')
    const beforeB = await countAllRowsForUser(b.userId)

    stubClerk({ status: 200 })
    await deleteAccount('user_a')

    expect(await countAllRowsForUser(a.userId)).toEqual(ZERO)
    // user_b is entirely untouched.
    expect(await countAllRowsForUser(b.userId)).toEqual(beforeB)
  })
})

describe('DELETE /api/account — Clerk failure leaves local data intact', () => {
  it('returns 502 and deletes NOTHING locally on a Clerk 5xx', async () => {
    const { userId } = await seedUserData('user_a')
    const before = await countAllRowsForUser(userId)

    stubClerk({ status: 500 })
    const { res, body } = await deleteAccount('user_a')

    expect(res.status).toBe(502)
    expect((body as { error: { code: string } }).error.code).toBe('clerk_delete_failed')
    // The invariant: local rows are fully intact — the user is still alive.
    expect(await countAllRowsForUser(userId)).toEqual(before)
    const db = getDb(d1 as unknown as D1Database)
    expect(await db.select().from(users).where(eq(users.id, userId))).toHaveLength(1)
  })

  it('returns 502 and deletes NOTHING when the Clerk call throws (network error)', async () => {
    const { userId } = await seedUserData('user_a')
    const before = await countAllRowsForUser(userId)

    stubClerk({ throws: true })
    const { res } = await deleteAccount('user_a')

    expect(res.status).toBe(502)
    expect(await countAllRowsForUser(userId)).toEqual(before)
  })
})

describe('DELETE /api/account — Clerk 404 (already gone)', () => {
  it('proceeds with the local cascade when Clerk says the user is already gone', async () => {
    const { userId } = await seedUserData('user_a')

    stubClerk({ status: 404 })
    const { res, body } = await deleteAccount('user_a')

    expect(res.status).toBe(200)
    expect((body as { ok: boolean }).ok).toBe(true)
    expect(await countAllRowsForUser(userId)).toEqual(ZERO)
  })
})

describe('DELETE /api/account — no local rows', () => {
  it('is a no-op (deleted:false) when the user has no local data', async () => {
    stubClerk({ status: 200 })
    const { res, body } = await deleteAccount('user_ghost')
    expect(res.status).toBe(200)
    expect((body as { ok: boolean; deleted: boolean }).ok).toBe(true)
    expect((body as { deleted: boolean }).deleted).toBe(false)
  })
})

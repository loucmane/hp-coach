// Integration tests for /api/me/export + /api/me/import — the full-account
// JSON backup/restore. Drives the REAL Hono routes against an in-memory D1
// (node:sqlite shim from the generated migrations), mirroring
// mockResults.test.ts.

import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it } from 'vitest'

import { getDb } from '../db/client'
import { attempts, mistakes, mockResults, sessions, users } from '../db/schema'
import { makeTestD1, type ShimD1 } from '../lib/testD1'
import type { Env, Vars } from '../types'
import { exportRoute, importRoute, SCHEMA_VERSION } from './export'

let d1: ShimD1

function appFor(asUser: string) {
  const env = { DB: d1 } as unknown as Env
  const app = new Hono<{ Bindings: Env; Variables: Vars }>()
    .use('*', async (c, next) => {
      c.set('userId', asUser)
      await next()
    })
    .route('/export', exportRoute)
    .route('/import', importRoute)
  return { app, env }
}

async function getExport(asUser: string) {
  const { app, env } = appFor(asUser)
  const res = await app.request('/export', {}, env)
  return { res, body: await res.json() }
}

async function postImport(asUser: string, payload: unknown) {
  const { app, env } = appFor(asUser)
  const res = await app.request(
    '/import',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof payload === 'string' ? payload : JSON.stringify(payload),
    },
    env,
  )
  return { res, body: await res.json() }
}

// Seed a realistic slice of data for a user: a session, an attempt tied to
// it, a mistake, and a mock result tied to a second (ended) session.
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
  const [s, a, m, mr] = await Promise.all([
    db.select().from(sessions).where(eq(sessions.userId, userId)),
    db.select().from(attempts).where(eq(attempts.userId, userId)),
    db.select().from(mistakes).where(eq(mistakes.userId, userId)),
    db.select().from(mockResults).where(eq(mockResults.userId, userId)),
  ])
  return { sessions: s.length, attempts: a.length, mistakes: m.length, mockResults: mr.length }
}

beforeEach(() => {
  d1 = makeTestD1()
})

describe('GET /api/me/export', () => {
  it('returns an envelope with schemaVersion, exportedAt, user, and all tables', async () => {
    await seedUserData('user_a')
    const { res, body } = await getExport('user_a')
    expect(res.status).toBe(200)
    const b = body as Record<string, unknown>
    expect(b.schemaVersion).toBe(SCHEMA_VERSION)
    expect(typeof b.exportedAt).toBe('string')
    expect(b.user).toBeTruthy()
    const tables = b.tables as Record<string, unknown[]>
    expect(tables.sessions).toHaveLength(2)
    expect(tables.attempts).toHaveLength(1)
    expect(tables.mistakes).toHaveLength(1)
    expect(tables.mockResults).toHaveLength(1)
    expect(tables.lessonProgress).toHaveLength(0)
    expect(tables.lessonReads).toHaveLength(0)
    expect(tables.dailyPlans).toHaveLength(0)
  })

  it('never leaks another user’s rows', async () => {
    await seedUserData('user_a')
    await seedUserData('user_b')
    const { body } = await getExport('user_a')
    const tables = (body as { tables: Record<string, unknown[]> }).tables
    // user_a's export should only contain user_a's 2 sessions, not user_b's.
    expect(tables.sessions).toHaveLength(2)
  })
})

describe('round-trip: export → wipe → import', () => {
  it('restores rows exactly after a wipe', async () => {
    const { userId } = await seedUserData('user_a')
    const before = await countAllRowsForUser(userId)

    const { body: exported } = await getExport('user_a')

    // Wipe this user's rows directly (simulating account loss / new device).
    const db = getDb(d1 as unknown as D1Database)
    await db.delete(mockResults).where(eq(mockResults.userId, userId))
    await db.delete(mistakes).where(eq(mistakes.userId, userId))
    await db.delete(attempts).where(eq(attempts.userId, userId))
    await db.delete(sessions).where(eq(sessions.userId, userId))
    expect(await countAllRowsForUser(userId)).toEqual({
      sessions: 0,
      attempts: 0,
      mistakes: 0,
      mockResults: 0,
    })

    const { res, body: importResult } = await postImport('user_a', exported)
    expect(res.status).toBe(200)
    expect((importResult as { ok: boolean }).ok).toBe(true)

    const after = await countAllRowsForUser(userId)
    expect(after).toEqual(before)

    // Spot-check a field survived the round trip intact.
    const { body: reExported } = await getExport('user_a')
    const tables = (reExported as { tables: Record<string, unknown[]> }).tables
    const mistakeRows = tables.mistakes as Array<{ questionId: string }>
    expect(mistakeRows[0].questionId).toBe('var-2024-KVA-002')
  })

  it('overwrites (does not duplicate) existing data on import without a wipe', async () => {
    const { userId } = await seedUserData('user_a')
    const { body: exported } = await getExport('user_a')

    await postImport('user_a', exported)

    const after = await countAllRowsForUser(userId)
    expect(after).toEqual({ sessions: 2, attempts: 1, mistakes: 1, mockResults: 1 })
  })

  it('restores user prefs but keeps clerkUserId/counters server-derived', async () => {
    const { userId } = await seedUserData('user_a')
    const db = getDb(d1 as unknown as D1Database)
    await db.update(users).set({ attemptsTotal: 999 }).where(eq(users.id, userId))

    const { body: exported } = await getExport('user_a')
    await postImport('user_a', exported)

    const [row] = await db.select().from(users).where(eq(users.id, userId))
    expect(row.coach).toBe('professor')
    expect(row.palette).toBe('sage')
    expect(row.clerkUserId).toBe('user_a')
    // Lifetime counters are never taken from the payload.
    expect(row.attemptsTotal).toBe(999)
  })
})

describe('cross-user isolation on import', () => {
  it('importing user A’s export as user B never writes A’s rows to B, and does not touch A', async () => {
    const a = await seedUserData('user_a')
    const b = await seedUserData('user_b')
    const { body: exportedA } = await getExport('user_a')

    const { res } = await postImport('user_b', exportedA)
    expect(res.status).toBe(200)

    // B now has A's data volume (2 sessions, 1 attempt, 1 mistake, 1 mock)
    // REMAPPED to B's own userId — not a new row addressed to A.
    const afterB = await countAllRowsForUser(b.userId)
    expect(afterB).toEqual({ sessions: 2, attempts: 1, mistakes: 1, mockResults: 1 })

    // A's own rows are untouched.
    const afterA = await countAllRowsForUser(a.userId)
    expect(afterA).toEqual({ sessions: 2, attempts: 1, mistakes: 1, mockResults: 1 })

    // Every row B now owns is actually scoped to B in the DB, not A.
    const db = getDb(d1 as unknown as D1Database)
    const bSessions = await db.select().from(sessions).where(eq(sessions.userId, b.userId))
    for (const s of bSessions) {
      expect(s.userId).toBe(b.userId)
      expect(s.userId).not.toBe(a.userId)
    }
  })

  it('a user’s own export never contains another user’s rows', async () => {
    await seedUserData('user_a')
    await seedUserData('user_b')
    const { body: exportedB } = await getExport('user_b')
    const tables = (exportedB as { tables: Record<string, unknown[]> }).tables
    expect(tables.sessions).toHaveLength(2)
    // (Sanity: total sessions across both users is 4; B's export must be 2.)
  })
})

describe('validation', () => {
  it('rejects an unsupported schemaVersion with a clear error', async () => {
    await seedUserData('user_a')
    const { body: exported } = await getExport('user_a')
    const bad = { ...(exported as Record<string, unknown>), schemaVersion: 999 }
    const { res, body } = await postImport('user_a', bad)
    expect(res.status).toBe(400)
    expect((body as { error: { code: string } }).error.code).toBe('unsupported_schema_version')
  })

  it('rejects malformed JSON', async () => {
    const { res, body } = await postImport('user_a', '{not json')
    expect(res.status).toBe(400)
    expect((body as { error: { code: string } }).error.code).toBe('bad_request')
  })

  it('rejects a payload missing required table keys', async () => {
    const { res } = await postImport('user_a', {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      user: {},
      tables: { sessions: [] }, // missing the rest
    })
    expect(res.status).toBe(400)
  })

  it('rejects an oversize payload', async () => {
    const bigString = 'x'.repeat(6 * 1024 * 1024)
    const { res, body } = await postImport('user_a', bigString)
    expect(res.status).toBe(413)
    expect((body as { error: { code: string } }).error.code).toBe('payload_too_large')
  })
})

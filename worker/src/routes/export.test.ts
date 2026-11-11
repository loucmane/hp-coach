// Integration tests for /api/me/export + /api/me/import — the full-account
// JSON backup/restore. Drives the REAL Hono routes against an in-memory D1
// (node:sqlite shim from the generated migrations), mirroring
// mockResults.test.ts.

import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it } from 'vitest'

import { getDb } from '../db/client'
import {
  attempts,
  firstTries,
  lessonProgress,
  mistakes,
  mockResults,
  sessions,
  users,
} from '../db/schema'
import { firstTryAggregates, firstTryHistory, writeFirstTries } from '../lib/firstTries'
import { makeTestD1, type ShimD1 } from '../lib/testD1'
import type { Env, Vars } from '../types'
import { attemptsRoute } from './attempts'
import { exportRoute, importRoute, SCHEMA_VERSION, TABLE_ROW_CAPS } from './export'

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
    .route('/attempts', attemptsRoute)
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

describe('first-try backup portability', () => {
  const qid = 'var-2024-verb1-ORD-001'
  const at = new Date('2027-01-06T12:00:00Z')
  async function seedLedger() {
    const { userId } = await seedUserData('user_a')
    const db = getDb(d1 as unknown as D1Database)
    await db.insert(firstTries).values({
      userId,
      questionId: qid,
      sessionId: 900,
      attemptId: 800,
      createdAt: new Date('2026-09-07T12:00:00Z'),
      correct: false,
      source: 'authentic',
      kind: 'mock',
      mockAnswers: [
        {
          id: 801,
          createdAt: Date.parse('2026-09-08T12:00:00Z') / 1000,
          correct: true,
          source: 'authentic',
        },
        {
          id: 802,
          createdAt: Date.parse('2026-09-15T12:00:00Z') / 1000,
          correct: false,
          source: 'authentic',
        },
      ],
    })
    await writeFirstTries(db, userId)
    return userId
  }
  async function summary(userId: number) {
    return firstTryAggregates(await firstTryHistory(getDb(d1 as unknown as D1Database), userId), at)
  }

  it('remaps live mock ids and preserves their tie order across import and another pick', async () => {
    const { userId } = await seedUserData('user_a')
    const db = getDb(d1 as unknown as D1Database)
    const [mock] = await db.select().from(sessions).where(eq(sessions.kind, 'mock'))
    const when = new Date('2027-01-01T12:00:00Z')
    for (const correct of [false, true]) {
      await db.insert(attempts).values({
        userId,
        sessionId: mock.id,
        questionId: qid,
        correct,
        source: 'authentic',
        createdAt: when,
      })
    }
    await writeFirstTries(db, userId)
    const exported = (await getExport('user_a')).body
    expect((await postImport('user_b', exported)).res.status).toBe(200)
    const [b] = await db.select().from(users).where(eq(users.clerkUserId, 'user_b'))
    const [row] = (await db.select().from(firstTries).where(eq(firstTries.userId, b.id))).filter(
      (r) => r.questionId === qid,
    )
    expect(row.sessionId).not.toBe(mock.id)
    expect((await summary(b.id)).ORD.firstTryCorrect90d).toBe(1)
    const { app, env } = appFor('user_b')
    expect(
      (
        await app.request(
          '/attempts',
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              sessionId: row.sessionId,
              questionId: qid,
              selectedAnswer: 'A',
              correct: false,
              createdAt: when.toISOString(),
            }),
          },
          env,
        )
      ).status,
    ).toBe(201)
    expect((await summary(b.id)).ORD).toMatchObject({ firstTry90d: 1, firstTryCorrect90d: 0 })
    expect((await summary(userId)).ORD.firstTryCorrect90d).toBe(1)
  })

  it('exports and restores ledger evidence after the original attempts and sessions are gone', async () => {
    const userId = await seedLedger()
    const before = await summary(userId)
    const exported = (await getExport('user_a')).body as { tables: Record<string, unknown[]> }
    expect(exported.tables.firstTries).toHaveLength(2)
    const imported = await postImport('user_b', exported)
    expect(imported.res.status).toBe(200)
    const db = getDb(d1 as unknown as D1Database)
    const [b] = await db.select().from(users).where(eq(users.clerkUserId, 'user_b'))
    expect(await summary(b.id)).toEqual(before)
    const asOf = new Date('2026-09-14T00:00:00Z')
    const past = async (id: number) =>
      firstTryAggregates(
        (await firstTryHistory(db, id)).filter((a) => (a.createdAt?.getTime() ?? 0) < +asOf),
        asOf,
      )
    expect((await past(userId)).ORD).toMatchObject({ firstTry90d: 1, firstTryCorrect90d: 1 })
    expect(await past(b.id)).toEqual(await past(userId))
    const rows = await db.select().from(firstTries).where(eq(firstTries.userId, b.id))
    const restored = rows.find((r) => r.questionId === qid)!
    expect(restored).toMatchObject({
      userId: b.id,
      correct: false,
      kind: 'mock',
      source: 'authentic',
    })
    expect(restored.mockAnswers.map((p) => [p.createdAt, p.correct, p.source])).toEqual([
      [Date.parse('2026-09-15T12:00:00Z') / 1000, false, 'authentic'],
      [Date.parse('2026-09-08T12:00:00Z') / 1000, true, 'authentic'],
    ])
    expect((await postImport('user_b', (await getExport('user_b')).body)).res.status).toBe(200)
    expect(await summary(b.id)).toEqual(before)
    expect(await summary(userId)).toEqual(before)
    expect(await past(b.id)).toEqual(await past(userId))
  })

  it('rebuilds an old export using original id tie ordering, with no ledger member', async () => {
    const { userId } = await seedUserData('user_a')
    const exported = (await getExport('user_a')).body as {
      tables: Record<string, Array<Record<string, unknown>>>
    }
    delete exported.tables.firstTries
    const sessionId = exported.tables.sessions[0].id
    exported.tables.attempts = [
      { id: 20, sessionId, questionId: qid, correct: true, createdAt: '2027-01-01T12:00:00Z' },
      { id: 10, sessionId, questionId: qid, correct: false, createdAt: '2027-01-01T12:00:00Z' },
    ]
    expect((await postImport('user_a', exported)).res.status).toBe(200)
    const rows = await getDb(d1 as unknown as D1Database)
      .select()
      .from(firstTries)
    expect(rows).toMatchObject([
      { userId, questionId: qid, correct: false, kind: 'drill', source: 'authentic' },
    ])
    expect(rows).toHaveLength(1)
    expect((await summary(userId)).ORD).toMatchObject({ firstTry90d: 1, firstTryCorrect90d: 0 })
  })

  it('validates malformed and duplicate ledger rows before wiping any data', async () => {
    const userId = await seedLedger()
    const exported = (await getExport('user_a')).body as {
      tables: Record<string, Array<Record<string, unknown>>>
    }
    expect(exported.tables.firstTries).toBeDefined()
    const original = exported.tables.firstTries
    const before = await summary(userId)
    for (const rows of [
      [{ ...original[0], createdAt: 'invalid-date' }],
      [original[0], original[0]],
      [
        {
          ...original[0],
          mockAnswers: Array.from({ length: 41 }, () => ({
            id: 1,
            createdAt: 1,
            correct: true,
            source: 'authentic',
          })),
        },
      ],
    ]) {
      exported.tables.firstTries = rows
      expect((await postImport('user_a', exported)).res.status).toBe(400)
      expect(await summary(userId)).toEqual(before)
    }
  })
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

  it('rejects an over-cap table BEFORE deleting existing data (wipe-then-fail guard)', async () => {
    const { userId } = await seedUserData('user_a')
    const before = await countAllRowsForUser(userId)
    expect(before.mistakes).toBeGreaterThan(0)

    const { body: exported } = await getExport('user_a')
    const envelope = exported as {
      schemaVersion: number
      exportedAt: string
      user: unknown
      tables: { mistakes: Array<Record<string, unknown>> } & Record<string, unknown>
    }

    // Build a `mistakes` table one row over its documented cap — small
    // rows so the payload stays well under MAX_IMPORT_BYTES and the test
    // exercises the row-cap check specifically, not the byte-size check.
    const template = envelope.tables.mistakes[0]
    const overCapMistakes = Array.from({ length: TABLE_ROW_CAPS.mistakes + 1 }, (_, i) => ({
      ...template,
      id: i + 1,
      questionId: `synthetic-${i}`,
    }))

    const payload = {
      ...envelope,
      tables: { ...envelope.tables, mistakes: overCapMistakes },
    }

    const { res, body } = await postImport('user_a', payload)
    expect(res.status).toBe(413)
    const err = (body as { error: { code: string; message: string } }).error
    expect(err.code).toBe('table_row_cap_exceeded')
    expect(err.message).toContain('mistakes')

    // The invariant under test: existing data must be UNTOUCHED — the
    // delete phase must never run for a payload that fails cap validation.
    const after = await countAllRowsForUser(userId)
    expect(after).toEqual(before)
  })

  it('id-remapping stays correct across insert-chunk boundaries', async () => {
    const { userId } = await seedUserData('user_a')
    const { body: exported } = await getExport('user_a')
    const envelope = exported as {
      schemaVersion: number
      exportedAt: string
      user: unknown
      tables: {
        sessions: Array<Record<string, unknown>>
        attempts: Array<Record<string, unknown>>
        mistakes: Array<Record<string, unknown>>
        lessonProgress: unknown[]
        lessonReads: unknown[]
        dailyPlans: unknown[]
        mockResults: Array<Record<string, unknown>>
      }
    }

    // Build a payload with 250 sessions (spans multiple insert-chunk
    // boundaries at any chunk size <= 100) and an attempt referencing the
    // LAST session, to prove the id map is fully built (across every
    // chunk) before dependent-table inserts read from it.
    const sessionTemplate = envelope.tables.sessions.find((s) => s.kind === 'drill')
    const attemptTemplate = envelope.tables.attempts[0]
    const sessionCount = 250
    const payloadSessions = Array.from({ length: sessionCount }, (_, i) => ({
      ...sessionTemplate,
      id: 10_000 + i,
      kind: 'drill',
    }))
    const lastSessionPayloadId = 10_000 + sessionCount - 1
    const payloadAttempts = [
      {
        ...attemptTemplate,
        id: 1,
        sessionId: lastSessionPayloadId,
        questionId: 'chunk-boundary-q',
      },
    ]

    const payload = {
      ...envelope,
      tables: {
        ...envelope.tables,
        sessions: payloadSessions,
        attempts: payloadAttempts,
        mockResults: [],
      },
    }

    const { res, body: importResult } = await postImport('user_a', payload)
    expect(res.status).toBe(200)
    expect((importResult as { ok: boolean }).ok).toBe(true)
    expect((importResult as { restored: { sessions: number; attempts: number } }).restored).toEqual(
      expect.objectContaining({ sessions: sessionCount, attempts: 1 }),
    )

    const db = getDb(d1 as unknown as D1Database)
    const attemptRows = await db.select().from(attempts).where(eq(attempts.userId, userId))
    expect(attemptRows).toHaveLength(1)
    expect(attemptRows[0].questionId).toBe('chunk-boundary-q')

    // The attempt's remapped sessionId must point at a REAL session row
    // owned by this user (proving the map entry for the 250th/last session
    // — inserted in a later chunk — was captured correctly).
    const sessionRows = await db.select().from(sessions).where(eq(sessions.userId, userId))
    const sessionIds = new Set(sessionRows.map((s) => s.id))
    expect(sessionIds.has(attemptRows[0].sessionId)).toBe(true)
    expect(sessionRows).toHaveLength(sessionCount)
  })
})

// P5 infold PR 3 (docs/p5-infold-design.md Amendment 1 E): provenance is the
// server's call on import too. A payload's source, itemRevision or
// estimateBasis (exports carry them) is never trusted: every attempt is
// re-classified from its qid, and a mock result is stored as POST
// /api/mock-results stores one, from its imported session's plan and
// attempts (lib/mockScore.ts).
describe('import — provenance is re-derived on the server', () => {
  const PLAN = ['var-2024-verb1-ORD-001', 'p5-las-b19-002-r1-LÄS-001', 'p5-las-b7-002-r1-LÄS-001']

  function payload() {
    return {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      user: {},
      tables: {
        sessions: [
          { id: 7, kind: 'drill', endedAt: Date.now() },
          { id: 8, kind: 'mock', endedAt: Date.now(), plan: PLAN },
          { id: 9, kind: 'mock', endedAt: Date.now() },
        ],
        attempts: [
          // Forged: an authentic qid exported as synthetic, a revoked P5 qid
          // exported as authentic, a registered P5 qid with a wrong revision.
          {
            id: 1,
            sessionId: 7,
            questionId: 'var-2024-verb1-ORD-001',
            correct: true,
            source: 'synthetic',
            itemRevision: 3,
          },
          {
            id: 2,
            sessionId: 7,
            questionId: 'p5-las-b7-002-r1-LÄS-001',
            correct: true,
            source: 'authentic',
          },
          {
            id: 3,
            sessionId: 7,
            questionId: 'p5-las-b7-002-r2-LÄS-001',
            correct: false,
            source: 'unknown',
            itemRevision: 9,
          },
        ],
        mistakes: [],
        lessonProgress: [],
        lessonReads: [],
        dailyPlans: [],
        mockResults: [8, 9].map((sessionId, i) => ({
          id: i + 1,
          sessionId,
          mode: 'synthetic',
          half: 'verbal',
          presented: 3,
          answered: 3,
          correct: 2,
          seenBefore: 0,
          durationMs: 60_000,
          breakdown: { perSection: {}, missedQids: [], version: 1 },
          estimateBasis: {
            authentic: 3,
            synthetic: 0,
            unknown: 0,
            calibrated: true,
            perSection: {},
          },
        })),
      },
    }
  }

  it('re-classifies every imported attempt from its qid', async () => {
    const { res } = await postImport('user_a', payload())
    expect(res.status).toBe(200)
    const db = getDb(d1 as unknown as D1Database)
    const rows = await db.select().from(attempts).orderBy(attempts.id)
    expect(rows.map((r) => [r.questionId, r.source, r.itemRevision])).toEqual([
      ['var-2024-verb1-ORD-001', 'authentic', null],
      ['p5-las-b7-002-r1-LÄS-001', 'unknown', null],
      ['p5-las-b7-002-r2-LÄS-001', 'synthetic', 2],
    ])
  })

  it('stores each imported mock result as POST /api/mock-results would, ignoring its basis', async () => {
    await postImport('user_a', payload())
    const db = getDb(d1 as unknown as D1Database)
    const rows = await db.select().from(mockResults).orderBy(mockResults.id)
    expect(
      rows.map(({ presented, answered, correct }) => ({ presented, answered, correct })),
    ).toEqual([
      // Session 8 answered nothing: its two scored questions are blanks, and
      // the revoked P5 qid is never scored.
      { presented: 2, answered: 0, correct: 0 },
      // Session 9 has no plan and no attempt: nothing the server can score.
      { presented: 0, answered: 0, correct: 0 },
    ])
    expect(rows.map((r) => r.estimateBasis)).toEqual([
      {
        authentic: 1,
        synthetic: 1,
        unknown: 1,
        unclassified: 0,
        calibrated: false,
        perSection: {
          ORD: { authentic: 1, synthetic: 0, unknown: 0, calibrated: true },
          LÄS: { authentic: 0, synthetic: 1, unknown: 1, calibrated: false },
        },
      },
      {
        authentic: 0,
        synthetic: 0,
        unknown: 0,
        unclassified: 3,
        calibrated: false,
        perSection: {},
      },
    ])
  })

  it('an exported authentic result round-trips unchanged', async () => {
    const plan = ['var-2024-verb1-ORD-001', 'var-2024-verb1-ORD-002']
    const result = {
      id: 1,
      sessionId: 10,
      mode: 'authentic',
      half: 'verbal',
      examId: 'var-2024',
      provpass: 'verb1',
      presented: 2,
      answered: 2,
      correct: 1,
      seenBefore: 1,
      durationMs: 60_000,
      breakdown: {
        perSection: { ORD: { presented: 2, correct: 1, timeMs: 50_000 } },
        missedQids: ['var-2024-verb1-ORD-002'],
        version: 1,
      },
    }
    const body = payload()
    body.tables.sessions.push({ id: 10, kind: 'mock', endedAt: Date.now(), plan })
    body.tables.attempts.push(
      { id: 4, sessionId: 10, questionId: plan[0], correct: true, source: 'authentic' },
      { id: 5, sessionId: 10, questionId: plan[1], correct: false, source: 'authentic' },
    )
    const withResult = { ...body, tables: { ...body.tables, mockResults: [result] } }
    const { res } = await postImport('user_a', withResult)
    expect(res.status).toBe(200)
    const db = getDb(d1 as unknown as D1Database)
    const [row] = await db.select().from(mockResults)
    expect(row).toMatchObject({
      presented: 2,
      answered: 2,
      correct: 1,
      seenBefore: 1,
      breakdown: result.breakdown,
      estimateBasis: { authentic: 2, synthetic: 0, unknown: 0, unclassified: 0, calibrated: true },
    })
  })
})

// LJ-11 (rebuild map §2): the export carries every field 0016 added for
// Ljusbord, import restores each of them, and a backup written before 0016
// still imports.
describe('the Ljusbord fields (LJ-11)', () => {
  /** Every Konto pref away from its 0016 default, so a restore that drops one shows. */
  const KONTO = {
    answerConfidence: false,
    facitTiming: 'end',
    showMyTime: true,
    mockClockVisible: false,
    mockReminder: false,
    textSize: 'xlarge',
    motion: 'none',
    shortcuts: false,
    modeFollowSystem: true,
    targetScore: 18,
    quantRepeat: 'same',
  } as const
  /** The same prefs for a user who never opened Konto. */
  const DEFAULTS = {
    answerConfidence: true,
    facitTiming: 'each',
    showMyTime: false,
    mockClockVisible: true,
    mockReminder: true,
    textSize: 'normal',
    motion: 'system',
    shortcuts: true,
    modeFollowSystem: false,
    targetScore: null,
    quantRepeat: 'new',
  }
  const PLAN = ['var-2024-verb1-ORD-001', 'var-2024-verb1-ORD-002', 'var-2024-verb1-ORD-003']
  const KVA = 'var-2024-kvant1-KVA-004'

  type Row = Record<string, unknown>
  type Envelope = { user: Row; tables: Record<string, Row[]> }

  /** An account with every Ljusbord field set: drill answers given with and
   *  without confidence, mistakes with their reasons, a lesson paused at a
   *  step, and a Hel halva, two marked passes whose results share a run id. */
  async function seedLjusbord(clerkUserId: string) {
    const db = getDb(d1 as unknown as D1Database)
    const [user] = await db
      .insert(users)
      .values({ clerkUserId, ...KONTO })
      .returning()
    const [drill] = await db
      .insert(sessions)
      .values({ userId: user.id, kind: 'drill', endedAt: new Date() })
      .returning()
    await db.insert(attempts).values([
      {
        userId: user.id,
        sessionId: drill.id,
        questionId: PLAN[0],
        correct: true,
        confidence: 'saker',
      },
      {
        userId: user.id,
        sessionId: drill.id,
        questionId: PLAN[1],
        correct: true,
        confidence: 'gissar',
      },
      { userId: user.id, sessionId: drill.id, questionId: PLAN[2], correct: false },
    ])
    await db.insert(mistakes).values([
      { userId: user.id, questionId: PLAN[1], reason: 'lucky', lastConfidence: 'gissar' },
      { userId: user.id, questionId: PLAN[2], lastConfidence: 'tror' },
      { userId: user.id, questionId: KVA, reason: 'manual' },
    ])
    await db.insert(lessonProgress).values({
      userId: user.id,
      section: 'KVA',
      frameworkId: 'KVA-TRAP-001',
      step: 2,
      guess: 'c',
    })
    for (const [i, marks] of [[PLAN[0]], [PLAN[1], PLAN[2]]].entries()) {
      const [pass] = await db
        .insert(sessions)
        .values({ userId: user.id, kind: 'mock', endedAt: new Date(), plan: PLAN, marks })
        .returning()
      await db.insert(mockResults).values({
        userId: user.id,
        sessionId: pass.id,
        mode: 'authentic',
        half: 'verbal',
        examId: 'var-2024',
        provpass: `verb${i + 1}`,
        presented: 3,
        answered: 0,
        correct: 0,
        seenBefore: 0,
        durationMs: 3_300_000,
        breakdown: { perSection: {}, missedQids: [], version: 1 },
        halfRunId: 'hel-halva-1',
      })
    }
    return { userId: user.id }
  }

  /** The Ljusbord fields of an export, each row with what tells it apart, in a
   *  stable order. Ids are left out: import gives every row a new one. */
  function ljusbordFields(envelope: unknown) {
    const { user, tables } = envelope as Envelope
    const pick = (row: Row, keys: readonly string[]) =>
      Object.fromEntries(keys.map((key) => [key, row[key]]))
    const rows = (table: string, keys: readonly string[]) =>
      tables[table]
        .map((row) => pick(row, keys))
        .sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1))
    return {
      user: pick(user, Object.keys(KONTO)),
      sessions: rows('sessions', ['kind', 'marks']),
      attempts: rows('attempts', ['questionId', 'confidence']),
      mistakes: rows('mistakes', ['questionId', 'reason', 'lastConfidence']),
      lessonProgress: rows('lessonProgress', ['section', 'step', 'guess']),
      mockResults: rows('mockResults', ['provpass', 'halfRunId']),
    }
  }

  /** A backup written before 0016, as the export wrote it then: every column
   *  of that time, and none of the Ljusbord fields. */
  const OLD_EXPORT = {
    schemaVersion: 1,
    exportedAt: '2026-10-20T08:00:00.000Z',
    user: {
      id: 41,
      clerkUserId: 'user_old',
      daysToExam: 170,
      dailyMinutes: 30,
      targetSittingId: 'var-2027',
      coach: 'kompis',
      palette: 'spalt',
      mode: 'dark',
      font: 'hyperlegible',
      density: 'regular',
      showStreak: false,
      smartDrill: true,
      mockDeferredDate: null,
      attemptsTotal: 2,
      drillsTotal: 1,
      createdAt: '2026-09-01T10:00:00.000Z',
    },
    tables: {
      sessions: [
        {
          id: 501,
          userId: 41,
          startedAt: '2026-10-19T18:00:00.000Z',
          endedAt: '2026-10-19T18:06:00.000Z',
          kind: 'drill',
          sections: 'ORD',
          position: 2,
          currentQuestionId: null,
          plan: [PLAN[0], PLAN[1]],
          device: 'phone',
        },
        {
          id: 502,
          userId: 41,
          startedAt: '2026-10-18T09:00:00.000Z',
          endedAt: '2026-10-18T09:55:00.000Z',
          kind: 'mock',
          sections: 'ORD',
          position: 3,
          currentQuestionId: null,
          plan: PLAN,
          device: 'desktop',
        },
      ],
      attempts: [
        {
          id: 9001,
          userId: 41,
          sessionId: 501,
          questionId: PLAN[0],
          selectedAnswer: 'B',
          correct: true,
          timeTakenMs: 14_000,
          createdAt: '2026-10-19T18:01:00.000Z',
          source: 'authentic',
          itemRevision: null,
        },
        {
          id: 9002,
          userId: 41,
          sessionId: 501,
          questionId: PLAN[1],
          selectedAnswer: 'D',
          correct: false,
          timeTakenMs: 21_000,
          createdAt: '2026-10-19T18:02:00.000Z',
          source: 'authentic',
          itemRevision: null,
        },
      ],
      mistakes: [
        {
          id: 77,
          userId: 41,
          questionId: PLAN[1],
          layer1Ids: ['ORD-ROOT-012'],
          status: 'active',
          errorCount7d: 1,
          lastErrorAt: '2026-10-19T18:02:00.000Z',
          nextReviewAt: '2026-10-20T18:02:00.000Z',
          intervalMinutes: 1440,
          lapseIntervalMinutes: null,
        },
      ],
      lessonProgress: [
        {
          id: 3,
          userId: 41,
          section: 'KVA',
          frameworkId: 'KVA-TRAP-001',
          device: 'desktop',
          updatedAt: '2026-10-17T20:00:00.000Z',
        },
      ],
      lessonReads: [
        { id: 5, userId: 41, entryId: 'KVA-TRAP-001', readAt: '2026-10-17T20:05:00.000Z' },
      ],
      dailyPlans: [
        {
          id: 8,
          userId: 41,
          date: '2026-10-19',
          plan: { version: 11, items: [] },
          updatedAt: '2026-10-19T07:00:00.000Z',
        },
      ],
      mockResults: [
        {
          id: 12,
          userId: 41,
          sessionId: 502,
          mode: 'authentic',
          half: 'verbal',
          examId: 'var-2024',
          provpass: 'verb1',
          presented: 3,
          answered: 0,
          correct: 0,
          seenBefore: 0,
          durationMs: 3_300_000,
          breakdown: { perSection: {}, missedQids: [], version: 1 },
          createdAt: '2026-10-18T09:55:00.000Z',
          estimateBasis: {
            authentic: 3,
            synthetic: 0,
            unknown: 0,
            unclassified: 0,
            calibrated: true,
            perSection: {},
          },
        },
      ],
    },
  }

  it('the export carries every field 0016 added', async () => {
    await seedLjusbord('user_a')
    const { body } = await getExport('user_a')
    expect(ljusbordFields(body)).toEqual({
      user: KONTO,
      sessions: [
        { kind: 'drill', marks: null },
        { kind: 'mock', marks: [PLAN[0]] },
        { kind: 'mock', marks: [PLAN[1], PLAN[2]] },
      ],
      attempts: [
        { questionId: PLAN[0], confidence: 'saker' },
        { questionId: PLAN[1], confidence: 'gissar' },
        { questionId: PLAN[2], confidence: null },
      ],
      mistakes: [
        { questionId: KVA, reason: 'manual', lastConfidence: null },
        { questionId: PLAN[1], reason: 'lucky', lastConfidence: 'gissar' },
        { questionId: PLAN[2], reason: 'wrong', lastConfidence: 'tror' },
      ],
      lessonProgress: [{ section: 'KVA', step: 2, guess: 'c' }],
      mockResults: [
        { provpass: 'verb1', halfRunId: 'hel-halva-1' },
        { provpass: 'verb2', halfRunId: 'hel-halva-1' },
      ],
    })
  })

  it('import restores every one of them on the importing account, and again on a second round trip', async () => {
    await seedLjusbord('user_a')
    const { body: exported } = await getExport('user_a')
    // user_b starts at the defaults, so every value it ends with was imported.
    const { res } = await postImport('user_b', exported)
    expect(res.status).toBe(200)
    const { body: restored } = await getExport('user_b')
    expect(ljusbordFields(restored)).toEqual(ljusbordFields(exported))

    expect((await postImport('user_b', restored)).res.status).toBe(200)
    const { body: again } = await getExport('user_b')
    expect(ljusbordFields(again)).toEqual(ljusbordFields(exported))
  })

  it("a backup's null target clears the account's; a null or missing Konto pref keeps the account's own", async () => {
    await seedLjusbord('user_a')
    const { body: exported } = await getExport('user_a')
    const envelope = exported as Envelope
    const { motion: _dropped, ...user } = envelope.user
    const payload = { ...envelope, user: { ...user, targetScore: null, textSize: null } }
    expect((await postImport('user_a', payload)).res.status).toBe(200)
    const { body } = await getExport('user_a')
    expect(ljusbordFields(body).user).toEqual({ ...KONTO, targetScore: null })
  })

  it('a backup from before 0016 still imports, with every Ljusbord field at its default', async () => {
    const { res, body } = await postImport('user_c', OLD_EXPORT)
    expect(res.status).toBe(200)
    expect((body as { restored: Record<string, number> }).restored).toEqual({
      sessions: 2,
      attempts: 2,
      mistakes: 1,
      lessonProgress: 1,
      lessonReads: 1,
      dailyPlans: 1,
      mockResults: 1,
    })
    const { body: now } = await getExport('user_c')
    expect(ljusbordFields(now)).toEqual({
      user: DEFAULTS,
      sessions: [
        { kind: 'drill', marks: null },
        { kind: 'mock', marks: null },
      ],
      attempts: [
        { questionId: PLAN[0], confidence: null },
        { questionId: PLAN[1], confidence: null },
      ],
      mistakes: [{ questionId: PLAN[1], reason: 'wrong', lastConfidence: null }],
      lessonProgress: [{ section: 'KVA', step: null, guess: null }],
      mockResults: [{ provpass: 'verb1', halfRunId: null }],
    })
    // What the backup did hold came through as before.
    expect((now as Envelope).user).toMatchObject({
      daysToExam: 170,
      dailyMinutes: 30,
      targetSittingId: 'var-2027',
      coach: 'kompis',
      mode: 'dark',
    })
  })

  it("a backup from before 0016 leaves the account's Konto prefs as they are", async () => {
    await seedLjusbord('user_a')
    expect((await postImport('user_a', OLD_EXPORT)).res.status).toBe(200)
    const { body } = await getExport('user_a')
    expect(ljusbordFields(body).user).toEqual(KONTO)
  })

  // A value no write path stores fails the whole import, before the wipe. The
  // prefs follow PATCH /api/me/prefs; the other fields, their schema.ts type.
  it.each([
    ['user', 'answerConfidence', 'yes'],
    ['user', 'facitTiming', 'later'],
    ['user', 'textSize', 'huge'],
    ['user', 'motion', 'reduce'],
    ['user', 'targetScore', 21],
    ['user', 'targetScore', 1.5],
    ['user', 'quantRepeat', 'samma'],
    // The stored levels are the Swedish words, not the map's English ones.
    ['attempts', 'confidence', 'sure'],
    ['mistakes', 'reason', 'missed'],
    ['mistakes', 'lastConfidence', 'Säker'],
    ['sessions', 'marks', PLAN[0]],
    ['lessonProgress', 'step', '2'],
    ['lessonProgress', 'step', 2.5],
    ['lessonProgress', 'guess', 3],
    ['mockResults', 'halfRunId', 7],
  ])('refuses %s.%s = %j before touching the account', async (table, key, value) => {
    const { userId } = await seedLjusbord('user_a')
    const before = await countAllRowsForUser(userId)
    const { body: exported } = await getExport('user_a')
    const envelope = exported as Envelope
    const payload =
      table === 'user'
        ? { ...envelope, user: { ...envelope.user, [key]: value } }
        : {
            ...envelope,
            tables: {
              ...envelope.tables,
              [table]: envelope.tables[table].map((row, i) =>
                i === 0 ? { ...row, [key]: value } : row,
              ),
            },
          }
    const { res, body } = await postImport('user_a', payload)
    expect(res.status).toBe(400)
    expect((body as { error: { code: string } }).error.code).toBe('invalid_payload')
    expect(await countAllRowsForUser(userId)).toEqual(before)
    const { body: after } = await getExport('user_a')
    expect(ljusbordFields(after)).toEqual(ljusbordFields(exported))
  })
})

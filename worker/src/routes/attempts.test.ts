// Integration tests for POST /api/attempts — the attempt row itself plus
// the two aggregates it now feeds: `mastery` and `framework_progress`.
//
// Drives the REAL Hono route against an in-memory D1 (node:sqlite shim
// built from the generated migrations). Auth is stubbed by setting the
// `userId` context var directly — the shape the Clerk verify middleware
// sets in production — so ensureUserRow scoping is exercised per user.
//
// The aggregates were write-dead before this suite existed: nothing in
// production ever inserted into `mastery` or `framework_progress`, so any
// scheduler reading them read empty rows forever. These tests are the
// proof that the production grading path fills them.

import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it } from 'vitest'

import { getDb } from '../db/client'
import { attempts, frameworkProgress, mastery, sessions, users } from '../db/schema'
import { makeTestD1, type ShimD1 } from '../lib/testD1'
import type { Env, Vars } from '../types'
import { attemptsRoute } from './attempts'

let d1: ShimD1

function appFor(asUser: string) {
  const env = { DB: d1 } as unknown as Env
  const app = new Hono<{ Bindings: Env; Variables: Vars }>()
    .use('*', async (c, next) => {
      c.set('userId', asUser)
      await next()
    })
    .route('/', attemptsRoute)
  return { app, env }
}

type AttemptPayload = {
  sessionId: number
  questionId: string
  selectedAnswer: string
  correct: boolean
  timeTakenMs?: number
  layer1Ids?: string[]
}

async function post(payload: AttemptPayload, asUser = 'user_a') {
  const { app, env } = appFor(asUser)
  return app.request(
    '/',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    },
    env,
  )
}

/** Seed a user + one open drill session and hand back the session id. */
async function seedSession(clerkUserId: string) {
  const db = getDb(d1 as unknown as D1Database)
  const [user] = await db.insert(users).values({ clerkUserId }).returning()
  const [session] = await db.insert(sessions).values({ userId: user.id, kind: 'drill' }).returning()
  return { userId: user.id, sessionId: session.id }
}

function db() {
  return getDb(d1 as unknown as D1Database)
}

async function masteryRows(userId: number) {
  return db().select().from(mastery).where(eq(mastery.userId, userId))
}

async function progressRow(userId: number, layer1Id: string) {
  const [row] = await db()
    .select()
    .from(frameworkProgress)
    .where(and(eq(frameworkProgress.userId, userId), eq(frameworkProgress.layer1Id, layer1Id)))
    .limit(1)
  return row ?? null
}

const KVA_QID = 'var-2024-kvant1-KVA-002'

beforeEach(() => {
  d1 = makeTestD1()
})

describe('POST /api/attempts — the attempt row', () => {
  it('records the attempt and bumps the lifetime counter', async () => {
    const { userId, sessionId } = await seedSession('user_a')
    const res = await post({
      sessionId,
      questionId: KVA_QID,
      selectedAnswer: 'B',
      correct: true,
      timeTakenMs: 9_000,
    })
    expect(res.status).toBe(201)

    const rows = await db().select().from(attempts).where(eq(attempts.userId, userId))
    expect(rows).toHaveLength(1)
    expect(rows[0].questionId).toBe(KVA_QID)

    const [user] = await db().select().from(users).where(eq(users.id, userId))
    expect(user.attemptsTotal).toBe(1)
  })

  it('404s on a session belonging to another user, writing nothing', async () => {
    const { sessionId } = await seedSession('user_a')
    const other = await seedSession('user_b')
    const res = await post(
      { sessionId, questionId: KVA_QID, selectedAnswer: 'B', correct: true },
      'user_b',
    )
    expect(res.status).toBe(404)
    expect(await masteryRows(other.userId)).toHaveLength(0)
  })
})

describe('POST /api/attempts — mastery writer', () => {
  it('creates a mastery row keyed by (section, layer1Id) on the first tagged attempt', async () => {
    const { userId, sessionId } = await seedSession('user_a')
    await post({
      sessionId,
      questionId: KVA_QID,
      selectedAnswer: 'B',
      correct: true,
      layer1Ids: ['KVA-NEG-001'],
    })

    const rows = await masteryRows(userId)
    expect(rows).toHaveLength(1)
    expect(rows[0].section).toBe('KVA')
    expect(rows[0].layer1Id).toBe('KVA-NEG-001')
    // Neutral prior nudged toward 1 — decidedly not "mastered" off one hit.
    expect(rows[0].score).toBeCloseTo(0.65, 5)
    expect(rows[0].lastUpdatedAt).toBeInstanceOf(Date)
  })

  it('UPDATES the same row on later attempts instead of piling up duplicates', async () => {
    const { userId, sessionId } = await seedSession('user_a')
    for (let i = 0; i < 3; i++) {
      await post({
        sessionId,
        questionId: KVA_QID,
        selectedAnswer: 'B',
        correct: true,
        layer1Ids: ['KVA-NEG-001'],
      })
    }
    const rows = await masteryRows(userId)
    expect(rows).toHaveLength(1)
    expect(rows[0].score).toBeCloseTo(0.8285, 5)
  })

  it('drops the score on a wrong answer', async () => {
    const { userId, sessionId } = await seedSession('user_a')
    await post({
      sessionId,
      questionId: KVA_QID,
      selectedAnswer: 'B',
      correct: true,
      layer1Ids: ['KVA-NEG-001'],
    })
    await post({
      sessionId,
      questionId: KVA_QID,
      selectedAnswer: 'A',
      correct: false,
      layer1Ids: ['KVA-NEG-001'],
    })
    const rows = await masteryRows(userId)
    expect(rows).toHaveLength(1)
    expect(rows[0].score!).toBeLessThan(0.65)
  })

  it('writes one row per tag when a question carries several Layer 1 ids', async () => {
    const { userId, sessionId } = await seedSession('user_a')
    await post({
      sessionId,
      questionId: KVA_QID,
      selectedAnswer: 'B',
      correct: true,
      layer1Ids: ['KVA-NEG-001', 'KVA-UNIT-004'],
    })
    const rows = await masteryRows(userId)
    expect(rows.map((r) => r.layer1Id).sort()).toEqual(['KVA-NEG-001', 'KVA-UNIT-004'])
  })

  it('keeps mastery per user — one user’s practice never touches another’s row', async () => {
    const a = await seedSession('user_a')
    const b = await seedSession('user_b')
    await post(
      {
        sessionId: a.sessionId,
        questionId: KVA_QID,
        selectedAnswer: 'B',
        correct: true,
        layer1Ids: ['KVA-NEG-001'],
      },
      'user_a',
    )
    expect(await masteryRows(a.userId)).toHaveLength(1)
    expect(await masteryRows(b.userId)).toHaveLength(0)
  })

  it('skips mastery when the attempt carries no Layer 1 tag (attempt still lands)', async () => {
    const { userId, sessionId } = await seedSession('user_a')
    const res = await post({ sessionId, questionId: KVA_QID, selectedAnswer: 'B', correct: true })
    expect(res.status).toBe(201)
    expect(await masteryRows(userId)).toHaveLength(0)
    expect(await db().select().from(attempts).where(eq(attempts.userId, userId))).toHaveLength(1)
  })

  it('skips mastery when the qid has no derivable section (section is NOT NULL)', async () => {
    const { userId, sessionId } = await seedSession('user_a')
    const res = await post({
      sessionId,
      questionId: 'not-a-real-qid',
      selectedAnswer: 'B',
      correct: true,
      layer1Ids: ['KVA-NEG-001'],
    })
    expect(res.status).toBe(201)
    expect(await masteryRows(userId)).toHaveLength(0)
  })
})

describe('POST /api/attempts — framework_progress writer', () => {
  it('moves an untouched framework straight to practicing on first practice', async () => {
    const { userId, sessionId } = await seedSession('user_a')
    await post({
      sessionId,
      questionId: KVA_QID,
      selectedAnswer: 'B',
      correct: true,
      layer1Ids: ['KVA-NEG-001'],
    })
    const row = await progressRow(userId, 'KVA-NEG-001')
    expect(row?.status).toBe('practicing')
    expect(row?.lastTransitionAt).toBeInstanceOf(Date)
  })

  it('climbs practicing → retaining → mastered as the score accumulates', async () => {
    const { userId, sessionId } = await seedSession('user_a')
    const correct = () =>
      post({
        sessionId,
        questionId: KVA_QID,
        selectedAnswer: 'B',
        correct: true,
        layer1Ids: ['KVA-NEG-001'],
      })

    await correct()
    expect((await progressRow(userId, 'KVA-NEG-001'))?.status).toBe('practicing')
    await correct()
    expect((await progressRow(userId, 'KVA-NEG-001'))?.status).toBe('retaining')
    await correct()
    await correct()
    expect((await progressRow(userId, 'KVA-NEG-001'))?.status).toBe('mastered')
  })

  it('demotes out of mastered when the evidence stops supporting it', async () => {
    const { userId, sessionId } = await seedSession('user_a')
    for (let i = 0; i < 4; i++) {
      await post({
        sessionId,
        questionId: KVA_QID,
        selectedAnswer: 'B',
        correct: true,
        layer1Ids: ['KVA-NEG-001'],
      })
    }
    expect((await progressRow(userId, 'KVA-NEG-001'))?.status).toBe('mastered')
    await post({
      sessionId,
      questionId: KVA_QID,
      selectedAnswer: 'A',
      correct: false,
      layer1Ids: ['KVA-NEG-001'],
    })
    expect((await progressRow(userId, 'KVA-NEG-001'))?.status).toBe('practicing')
  })

  it('keeps exactly one progress row per (user, layer1Id)', async () => {
    const { userId, sessionId } = await seedSession('user_a')
    for (let i = 0; i < 5; i++) {
      await post({
        sessionId,
        questionId: KVA_QID,
        selectedAnswer: 'B',
        correct: true,
        layer1Ids: ['KVA-NEG-001'],
      })
    }
    const rows = await db()
      .select()
      .from(frameworkProgress)
      .where(eq(frameworkProgress.userId, userId))
    expect(rows).toHaveLength(1)
  })

  it('advances a framework that was only READ (learning) once it is practised', async () => {
    const { userId, sessionId } = await seedSession('user_a')
    await db()
      .insert(frameworkProgress)
      .values({ userId, layer1Id: 'KVA-NEG-001', status: 'learning' })
    await post({
      sessionId,
      questionId: KVA_QID,
      selectedAnswer: 'B',
      correct: true,
      layer1Ids: ['KVA-NEG-001'],
    })
    expect((await progressRow(userId, 'KVA-NEG-001'))?.status).toBe('practicing')
  })
})

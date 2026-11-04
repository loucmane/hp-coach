// Integration tests for /api/sessions — GET /history (which must exclude
// kind='mock' so 40-question Provpass runs don't pollute the drill-history
// view; mocks get their own summary surface via /api/mock-results),
// GET /:id/attempts (Provpass PR 4's reload-adopt reads timeTakenMs/
// createdAt from here to rebuild an in-flight mock's answer sheet) and the
// Markera marks a Provpass stores with PATCH /:id (LJ-12).

import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it } from 'vitest'

import { getDb } from '../db/client'
import { attempts, sessions, users } from '../db/schema'
import { makeTestD1, type ShimD1 } from '../lib/testD1'
import type { Env, Vars } from '../types'
import { sessionsRoute } from './sessions'

let d1: ShimD1

function appFor(asUser: string) {
  const env = { DB: d1 } as unknown as Env
  const app = new Hono<{ Bindings: Env; Variables: Vars }>()
    .use('*', async (c, next) => {
      c.set('userId', asUser)
      await next()
    })
    .route('/', sessionsRoute)
  return { app, env }
}

async function getHistory(asUser = 'user_a') {
  const { app, env } = appFor(asUser)
  const res = await app.request('/history', {}, env)
  return {
    res,
    body: (await res.json()) as { sessions: Array<{ id: number; kind: string }> },
  }
}

// Seed a COMPLETED session (endedAt set, plan length === answered attempts)
// of a given kind — the shape /history's completion filter requires.
async function seedCompletedSession(clerkUserId: string, kind: string, startedAt = new Date()) {
  const db = getDb(d1 as unknown as D1Database)
  const [user] = await db
    .insert(users)
    .values({ clerkUserId })
    .onConflictDoUpdate({ target: users.clerkUserId, set: { clerkUserId } })
    .returning()
  const [session] = await db
    .insert(sessions)
    .values({
      userId: user.id,
      kind,
      startedAt,
      endedAt: new Date(),
      plan: ['q1'],
    })
    .returning()
  await db.insert(attempts).values({
    userId: user.id,
    sessionId: session.id,
    questionId: 'q1',
    correct: true,
  })
  return session.id
}

beforeEach(() => {
  d1 = makeTestD1()
})

describe('POST /api/sessions', () => {
  it('stores linked repetition entries verbatim in the create and active-session responses', async () => {
    const { app, env } = appFor('user_a')
    const plan = ['X~A', 'Y~B', 'ORD-1']
    const created = await app.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'adaptive_review', sections: 'alla', plan, device: 'phone' }),
      },
      env,
    )
    expect(created.status).toBe(201)
    const { session } = (await created.json()) as { session: { id: number; plan: string[] } }
    expect(session.plan).toEqual(plan)

    // A separate client reads the first write, without any linking PUT or
    // cursor PATCH in between. Check the database too, not just the echo.
    const stored = await getDb(d1 as unknown as D1Database)
      .select()
      .from(sessions)
    expect(stored).toHaveLength(1)
    expect(stored[0].plan).toEqual(plan)
    const otherDevice = appFor('user_a')
    const active = await otherDevice.app.request('/active', {}, otherDevice.env)
    expect(active.status).toBe(200)
    expect(await active.json()).toMatchObject({
      sessions: [{ id: session.id, plan, position: 0, currentQuestionId: null }],
    })
  })
})

describe('GET /api/sessions/history', () => {
  it('accepts onboarding sessions and keeps their completed runs out of history', async () => {
    const { app, env } = appFor('user_a')
    const res = await app.request(
      '/',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: 'onboarding', sections: 'ORD', plan: ['q1', 'q2', 'q3'] }),
      },
      env,
    )
    expect(res.status).toBe(201)
    await seedCompletedSession('user_b', 'onboarding')
    const history = await getHistory('user_b')
    expect(history.body.sessions).toEqual([])
  })

  it('returns the original startedAt timestamp for each completed pass, scoped to its user', async () => {
    const id = await seedCompletedSession('user_a', 'drill', new Date('2026-10-21T05:52:00Z'))
    await seedCompletedSession('user_b', 'drill')
    const db = getDb(d1 as unknown as D1Database)
    const stored = await db.select().from(sessions)
    const expected = stored.find((row) => row.id === id)?.startedAt?.toISOString()
    expect(expected).toBeDefined()
    const { body } = await getHistory()
    expect(body.sessions).toEqual([expect.objectContaining({ id, startedAt: expected })])
  })

  it('excludes mock sessions', async () => {
    const drillId = await seedCompletedSession('user_a', 'drill')
    await seedCompletedSession('user_a', 'mock')

    const { body } = await getHistory()
    expect(body.sessions.map((s) => s.id)).toEqual([drillId])
    expect(body.sessions.every((s) => s.kind !== 'mock')).toBe(true)
  })

  it('still includes other completed kinds', async () => {
    await seedCompletedSession('user_a', 'drill')
    await seedCompletedSession('user_a', 'adaptive_review')

    const { body } = await getHistory()
    expect(body.sessions).toHaveLength(2)
  })
})

describe('GET /api/sessions/:id/attempts', () => {
  it('includes timeTakenMs and createdAt alongside questionId/selectedAnswer/correct', async () => {
    const db = getDb(d1 as unknown as D1Database)
    const [user] = await db
      .insert(users)
      .values({ clerkUserId: 'user_a' })
      .onConflictDoUpdate({ target: users.clerkUserId, set: { clerkUserId: 'user_a' } })
      .returning()
    const [session] = await db
      .insert(sessions)
      .values({ userId: user.id, kind: 'mock', plan: ['q1'] })
      .returning()
    await db.insert(attempts).values({
      userId: user.id,
      sessionId: session.id,
      questionId: 'q1',
      selectedAnswer: 'A',
      correct: true,
      timeTakenMs: 4500,
    })

    const { app, env } = appFor('user_a')
    const res = await app.request(`/${session.id}/attempts`, {}, env)
    const body = (await res.json()) as {
      attempts: Array<{
        questionId: string
        selectedAnswer: string | null
        correct: boolean | null
        timeTakenMs: number | null
        createdAt: number | string | null
      }>
    }
    expect(body.attempts).toHaveLength(1)
    expect(body.attempts[0]).toMatchObject({
      questionId: 'q1',
      selectedAnswer: 'A',
      timeTakenMs: 4500,
    })
    expect(body.attempts[0].createdAt).not.toBeNull()
  })

  it("a forged/other-user session id resolves to an empty list, not another user's attempts", async () => {
    const db = getDb(d1 as unknown as D1Database)
    const [owner] = await db
      .insert(users)
      .values({ clerkUserId: 'user_owner' })
      .onConflictDoUpdate({ target: users.clerkUserId, set: { clerkUserId: 'user_owner' } })
      .returning()
    const [session] = await db
      .insert(sessions)
      .values({ userId: owner.id, kind: 'mock', plan: ['q1'] })
      .returning()
    await db.insert(attempts).values({
      userId: owner.id,
      sessionId: session.id,
      questionId: 'q1',
      selectedAnswer: 'A',
      correct: true,
    })

    const { app, env } = appFor('user_intruder')
    const res = await app.request(`/${session.id}/attempts`, {}, env)
    const body = (await res.json()) as { attempts: unknown[] }
    expect(body.attempts).toEqual([])
  })

  it('returns each attempt’s confidence, and null where none was given (LJ-12)', async () => {
    const db = getDb(d1 as unknown as D1Database)
    const [user] = await db.insert(users).values({ clerkUserId: 'user_a' }).returning()
    const [session] = await db
      .insert(sessions)
      .values({ userId: user.id, kind: 'drill', plan: ['q1', 'q2', 'q3'] })
      .returning()
    const answer = { userId: user.id, sessionId: session.id, selectedAnswer: 'A', correct: true }
    await db.insert(attempts).values([
      { ...answer, questionId: 'q1', confidence: 'saker' },
      { ...answer, questionId: 'q2', confidence: 'gissar' },
      { ...answer, questionId: 'q3' },
    ])

    const { app, env } = appFor('user_a')
    const res = await app.request(`/${session.id}/attempts`, {}, env)
    const body = (await res.json()) as {
      attempts: Array<{ questionId: string; confidence: string | null }>
    }
    expect(body.attempts.map((a) => [a.questionId, a.confidence])).toEqual([
      ['q1', 'saker'],
      ['q2', 'gissar'],
      ['q3', null],
    ])
  })
})

// LJ-12 (rebuild map §2): Markera in a Provpass is stored on its session, so
// the marks survive a device swap and reach Historik. PATCH { marks } sends
// the whole set, at most 80 qids, and works only on the owner's open mock
// session. Another user's id stays a 404, as on every route here; a session
// of another kind, or a pass that has ended, is a 409. A PATCH without marks
// behaves as it always has.
describe('PATCH /api/sessions/:id — Markera marks', () => {
  const A = 'host-2022-kvant2-KVA-017'
  const B = 'var-2018-1-kvant1-NOG-026'
  const C = 'p5-las-b19-002-r1-LÄS-001'

  async function seedSession(
    clerkUserId: string,
    opts: { kind?: string; endedAt?: Date | null; marks?: string[] | null } = {},
  ): Promise<number> {
    const db = getDb(d1 as unknown as D1Database)
    let [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId))
    if (!user) {
      ;[user] = await db.insert(users).values({ clerkUserId }).returning()
    }
    const [row] = await db
      .insert(sessions)
      .values({
        userId: user.id,
        kind: opts.kind ?? 'mock',
        sections: 'KVA,NOG',
        position: 1,
        currentQuestionId: B,
        plan: [A, B, C],
        endedAt: opts.endedAt ?? null,
        marks: opts.marks ?? null,
      })
      .returning()
    return row.id
  }

  async function patch(asUser: string, id: number, body: unknown) {
    const { app, env } = appFor(asUser)
    return app.request(
      `/${id}`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      },
      env,
    )
  }

  async function sessionById(id: number) {
    const db = getDb(d1 as unknown as D1Database)
    const [row] = await db.select().from(sessions).where(eq(sessions.id, id))
    return row
  }

  it('stores the marks on the owner’s open pass, and another device reads them back', async () => {
    const id = await seedSession('user_a')
    const res = await patch('user_a', id, { marks: [B, C] })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ session: { id, marks: [B, C] } })
    // The cursor and the open state are left alone.
    expect(await sessionById(id)).toMatchObject({
      marks: [B, C],
      position: 1,
      currentQuestionId: B,
      endedAt: null,
    })

    const otherDevice = appFor('user_a')
    const active = await otherDevice.app.request('/active', {}, otherDevice.env)
    expect(await active.json()).toMatchObject({ sessions: [{ id, marks: [B, C] }] })
  })

  it('replaces the whole set on each PATCH, and an empty list clears it', async () => {
    const id = await seedSession('user_a', { marks: [A] })
    expect((await patch('user_a', id, { marks: [C, A] })).status).toBe(200)
    expect((await sessionById(id)).marks).toEqual([C, A])
    expect((await patch('user_a', id, { marks: [] })).status).toBe(200)
    expect((await sessionById(id)).marks).toEqual([])
  })

  it('collapses a repeated qid into one mark', async () => {
    const id = await seedSession('user_a')
    expect((await patch('user_a', id, { marks: [A, B, A, B] })).status).toBe(200)
    expect((await sessionById(id)).marks).toEqual([A, B])
  })

  it('takes up to 80 marks and refuses 81', async () => {
    const id = await seedSession('user_a')
    const qids = Array.from(
      { length: 81 },
      (_, i) => `host-2022-kvant2-KVA-${String(i + 1).padStart(3, '0')}`,
    )
    expect((await patch('user_a', id, { marks: qids.slice(0, 80) })).status).toBe(200)
    expect((await patch('user_a', id, { marks: qids })).status).toBe(400)
    expect((await sessionById(id)).marks).toEqual(qids.slice(0, 80))
  })

  it('refuses anything but a list of qids, writing nothing', async () => {
    const id = await seedSession('user_a', { marks: [A] })
    for (const marks of [
      ['q1'], // a seed id, not a qid
      [`${A}~${B}`], // a Repetera plan link
      ['host-2022-kvant2-KVA-17'], // a two-digit number
      ['host-2022-kvant2-kva-017'], // a lower-case section
      ['host-2022-kvant2-ABC-017'], // not a section
      ['KVA-017'], // no sitting
      [` ${A}`], // padded
      [''],
      [17],
      [null],
      A, // not a list
      null,
    ]) {
      expect((await patch('user_a', id, { marks })).status).toBe(400)
    }
    expect((await sessionById(id)).marks).toEqual([A])
  })

  it('another user’s pass is a 404 and keeps its marks', async () => {
    const id = await seedSession('user_a', { marks: [A] })
    const res = await patch('user_b', id, { marks: [B] })
    expect(res.status).toBe(404)
    expect(await res.json()).toMatchObject({ error: { code: 'not_found' } })
    expect((await sessionById(id)).marks).toEqual([A])
  })

  it('a session of another kind is a 409, and nothing in the PATCH is applied', async () => {
    for (const kind of ['drill', 'adaptive_review', 'mock_diagnostic', 'lesson']) {
      const id = await seedSession('user_a', { kind })
      const res = await patch('user_a', id, { marks: [A], position: 2 })
      expect(res.status).toBe(409)
      expect(await res.json()).toMatchObject({ error: { code: 'invalid_kind' } })
      expect(await sessionById(id)).toMatchObject({ marks: null, position: 1 })
    }
  })

  it('a pass that has ended is a 409 and keeps the marks it ended with', async () => {
    const endedAt = new Date('2026-10-30T10:00:00Z')
    const id = await seedSession('user_a', { endedAt, marks: [A] })
    const res = await patch('user_a', id, { marks: [B], end: true })
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ error: { code: 'ended' } })
    expect(await sessionById(id)).toMatchObject({ marks: [A], endedAt })
  })

  it('stores the last marks and ends the pass in one PATCH', async () => {
    const id = await seedSession('user_a')
    expect((await patch('user_a', id, { marks: [C], end: true })).status).toBe(200)
    const row = await sessionById(id)
    expect(row.marks).toEqual([C])
    expect(row.endedAt).toBeInstanceOf(Date)
  })

  it('a PATCH without marks works as before, on any session, and leaves marks alone', async () => {
    const drill = await seedSession('user_a', { kind: 'drill' })
    expect((await patch('user_a', drill, { position: 2, currentQuestionId: C })).status).toBe(200)
    expect(await sessionById(drill)).toMatchObject({
      position: 2,
      currentQuestionId: C,
      marks: null,
    })

    const pass = await seedSession('user_a', { marks: [A] })
    expect((await patch('user_a', pass, { position: 3, device: 'phone' })).status).toBe(200)
    expect(await sessionById(pass)).toMatchObject({ position: 3, device: 'phone', marks: [A] })

    const otherDevice = appFor('user_a')
    const active = await otherDevice.app.request('/active', {}, otherDevice.env)
    const { sessions: rows } = (await active.json()) as {
      sessions: Array<{ id: number; marks: string[] | null }>
    }
    expect(rows.sort((x, y) => x.id - y.id).map((s) => [s.id, s.marks])).toEqual([
      [drill, null],
      [pass, [A]],
    ])

    // An ended session still takes a cursor update, as it always has.
    const ended = await seedSession('user_b', { endedAt: new Date(), marks: [B] })
    expect((await patch('user_b', ended, { position: 5 })).status).toBe(200)
    expect(await sessionById(ended)).toMatchObject({ position: 5, marks: [B] })
  })
})

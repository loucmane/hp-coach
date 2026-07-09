// Integration tests for /api/sessions — GET /history (which must exclude
// kind='mock' so 40-question Provpass runs don't pollute the drill-history
// view; mocks get their own summary surface via /api/mock-results) and
// GET /:id/attempts (Provpass PR 4's reload-adopt reads timeTakenMs/
// createdAt from here to rebuild an in-flight mock's answer sheet).

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
async function seedCompletedSession(clerkUserId: string, kind: string) {
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

describe('GET /api/sessions/history', () => {
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
})

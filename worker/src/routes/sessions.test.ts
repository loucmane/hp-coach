// Integration tests for /api/sessions — currently scoped to GET /history,
// which must exclude kind='mock' so 40-question Provpass runs don't
// pollute the drill-history view (mocks get their own summary surface via
// /api/mock-results).

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

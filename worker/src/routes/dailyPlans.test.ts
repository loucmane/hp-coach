// Integration tests for /api/daily-plans — the server plan baseline.
//
// Drives the REAL Hono route against an in-memory D1 (node:sqlite shim
// from the generated migrations). Auth is stubbed via the `userId` context
// var (the shape requireAuth sets) so the tests exercise real per-user
// scoping and the (user, date) unique-index upsert.

import { Hono } from 'hono'
import { beforeEach, describe, expect, it } from 'vitest'

import { makeTestD1, type ShimD1 } from '../lib/testD1'
import type { Env, Vars } from '../types'
import { dailyPlansRoute } from './dailyPlans'

let d1: ShimD1

function appFor(asUser: string) {
  const env = { DB: d1 } as unknown as Env
  const app = new Hono<{ Bindings: Env; Variables: Vars }>()
    .use('*', async (c, next) => {
      c.set('userId', asUser)
      await next()
    })
    .route('/', dailyPlansRoute)
  return { app, env }
}

// A representative plan blob — the exact shape savePlan stores, incl.
// attemptsSnapshot / totalAttemptsSnapshot, to prove round-trip fidelity.
const PLAN_A = {
  version: 6,
  date: '2026-07-09',
  items: [
    {
      id: 'drill-nog',
      kind: 'drill',
      section: 'NOG',
      headline: 'NOG · 10 frågor',
      completed: false,
    },
  ],
  estimatedMinutes: 12,
  attemptsSnapshot: { NOG: 3 },
  totalAttemptsSnapshot: 42,
}

async function getPlan(date: string, asUser = 'user_a') {
  const { app, env } = appFor(asUser)
  const res = await app.request(`/${date}`, {}, env)
  return { res, body: (await res.json()) as { plan: unknown } }
}

async function putPlan(date: string, plan: unknown, asUser = 'user_a') {
  const { app, env } = appFor(asUser)
  return app.request(
    `/${date}`,
    {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan }),
    },
    env,
  )
}

beforeEach(() => {
  d1 = makeTestD1()
})

describe('GET /api/daily-plans/:date', () => {
  it('returns null when no plan exists for the date', async () => {
    const { res, body } = await getPlan('2026-07-09')
    expect(res.status).toBe(200)
    expect(body.plan).toBeNull()
  })

  it('rejects a malformed date param', async () => {
    const { res } = await getPlan('not-a-date')
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/daily-plans/:date', () => {
  it('stores a plan and round-trips the exact blob (incl. snapshots)', async () => {
    const put = await putPlan('2026-07-09', PLAN_A)
    expect(put.status).toBe(200)
    const { body } = await getPlan('2026-07-09')
    expect(body.plan).toEqual(PLAN_A)
  })

  it('first-generator-wins: a second PUT overwrites in place (no duplicate rows)', async () => {
    await putPlan('2026-07-09', PLAN_A)
    const planB = { ...PLAN_A, estimatedMinutes: 99, totalAttemptsSnapshot: 100 }
    await putPlan('2026-07-09', planB)
    const { body } = await getPlan('2026-07-09')
    expect(body.plan).toEqual(planB)
  })

  it('keys plans independently per date', async () => {
    await putPlan('2026-07-09', PLAN_A)
    const planNext = { ...PLAN_A, date: '2026-07-10' }
    await putPlan('2026-07-10', planNext)
    expect((await getPlan('2026-07-09')).body.plan).toEqual(PLAN_A)
    expect((await getPlan('2026-07-10')).body.plan).toEqual(planNext)
  })

  it('rejects a non-object plan body', async () => {
    const { app, env } = appFor('user_a')
    const res = await app.request(
      '/2026-07-09',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan: 'nope' }),
      },
      env,
    )
    expect(res.status).toBe(400)
  })
})

describe('user scoping', () => {
  it('never serves one user’s plan to another', async () => {
    await putPlan('2026-07-09', PLAN_A, 'user_a')
    const b = await getPlan('2026-07-09', 'user_b')
    expect(b.body.plan).toBeNull()

    const planB = { ...PLAN_A, totalAttemptsSnapshot: 7 }
    await putPlan('2026-07-09', planB, 'user_b')
    expect((await getPlan('2026-07-09', 'user_a')).body.plan).toEqual(PLAN_A)
    expect((await getPlan('2026-07-09', 'user_b')).body.plan).toEqual(planB)
  })
})

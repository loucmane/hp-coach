import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getDb } from '../db/client'
import { attempts, sessions, users } from '../db/schema'
import { attemptsRoute } from '../routes/attempts'
import { insightsRoute } from '../routes/insights'
import { meRoute } from '../routes/me'
import type { Env, Vars } from '../types'
import {
  type FirstTryAgg,
  firstTryAggregates,
  retainedAnswerHistory,
  writeFirstTries,
} from './firstTries'
import { runRetention } from './retention'
import { makeTestD1, type ShimD1 } from './testD1'

const NOW = new Date('2027-01-06T12:00:00Z')
const QID = 'var-2024-verb1-ORD-001'
let d1: ShimD1
let env: Env
const app = new Hono<{ Bindings: Env; Variables: Vars }>()
  .use('*', async (c, next) => {
    c.set('userId', 'ledger-user')
    await next()
  })
  .route('/attempts', attemptsRoute)
  .route('/me', meRoute)
  .route('/insights', insightsRoute)

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  d1 = makeTestD1()
  env = { DB: d1 } as unknown as Env
})
afterEach(() => vi.useRealTimers())

async function parent(kind = 'drill') {
  const db = getDb(env.DB)
  await db.insert(users).values({ clerkUserId: 'ledger-user' }).onConflictDoNothing()
  const [user] = await db.select().from(users).where(eq(users.clerkUserId, 'ledger-user'))
  const [s] = await db.insert(sessions).values({ userId: user.id, kind }).returning()
  return s
}

async function answer(
  sessionId: number,
  at: string,
  correct: boolean,
  questionId = QID,
  offline = false,
) {
  if (!offline) vi.setSystemTime(new Date(at))
  const res = await app.request(
    '/attempts',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        questionId,
        correct,
        selectedAnswer: 'A',
        ...(offline ? { createdAt: at } : {}),
      }),
    },
    env,
  )
  expect(res.status).toBe(201)
  return ((await res.json()) as { attempt: { id: number } }).attempt
}

async function read(path: string) {
  const response = await app.request(path, {}, env)
  expect(response.status).toBe(200)
  return response.json() as Promise<{
    weeks: Array<{ bySection: Record<string, FirstTryAgg> }>
    stats: { bySection: Record<string, FirstTryAgg> }
  }>
}

async function ledger() {
  return (await d1.prepare('SELECT * FROM first_tries ORDER BY user_id, question_id').all()).results
}

describe('durable first tries', () => {
  it('bounds a long-running mock while preserving all 26 requested windows', async () => {
    const mock = await parent('mock')
    const db = getDb(env.DB)
    for (let week = 0; week < 50; week++) {
      for (const correct of [false, true]) {
        await db.insert(attempts).values({
          userId: mock.userId,
          sessionId: mock.id,
          questionId: QID,
          correct,
          source: 'authentic',
          createdAt: new Date(Date.UTC(2026, 0, 26, 12) + week * 7 * 86_400_000),
        })
      }
    }
    const raw = await retainedAnswerHistory(db, mock.userId)
    await writeFirstTries(db, mock.userId)
    const [row] = await ledger()
    expect(JSON.parse(row.mock_answers as string)).toHaveLength(40)
    const before = await read('/insights/prognosis-weekly?weeks=26')
    for (const [i, week] of before.weeks.entries()) {
      const end = i === 25 ? NOW : new Date(Date.UTC(2027, 0, 4) - (24 - i) * 7 * 86_400_000)
      const held = i === 25 ? raw : raw.filter((a) => +a.createdAt! < +end)
      expect(week.bySection).toEqual(firstTryAggregates(held, end))
    }
    await runRetention(db, NOW)
    expect(await read('/insights/prognosis-weekly?weeks=26')).toEqual(before)
  })

  it('finds the last pick of a newly earliest mock after an older offline arrival', async () => {
    const drill = await parent()
    const mock = await parent('mock')
    await answer(drill.id, '2026-12-29T12:00:00Z', false)
    await answer(mock.id, '2027-01-01T12:00:00Z', true)
    await answer(mock.id, '2026-12-28T12:00:00Z', false, QID, true)
    vi.setSystemTime(NOW)
    expect((await read('/me/stats?firstTry=1')).stats.bySection.ORD).toMatchObject({
      firstTry90d: 1,
      firstTryCorrect90d: 1,
    })
    expect(await ledger()).toMatchObject([{ session_id: mock.id, correct: 0 }])
  })

  it('keeps the first answer, replaces it for an older offline arrival, and uses id to break ties', async () => {
    const s = await parent()
    await answer(s.id, '2026-12-29T12:00:00Z', true)
    await answer(s.id, '2026-12-30T12:00:00Z', false)
    expect(await ledger()).toMatchObject([
      { correct: 1, created_at: Date.parse('2026-12-29T12:00:00Z') / 1000 },
    ])
    const older = await answer(s.id, '2026-12-28T12:00:00Z', false, QID, true)
    await answer(s.id, '2026-12-28T12:00:00Z', true, QID, true)
    expect(await ledger()).toMatchObject([{ correct: 0, attempt_id: older.id }])
    expect(await ledger()).toHaveLength(1)
  })

  it('does not promote a retained retry after pruning the original (the W53 review regression)', async () => {
    const s = await parent()
    await answer(s.id, '2026-09-07T12:00:00Z', false)
    await answer(s.id, '2026-12-29T12:00:00Z', true)
    vi.setSystemTime(NOW)
    const before = await read('/insights/prognosis-weekly?weeks=26')
    const stats = await read('/me/stats?firstTry=1')
    expect(before.weeks.at(-2)!.bySection.ORD.firstTry90d).toBe(0)
    expect(stats.stats.bySection.ORD.firstTry90d).toBe(0)
    await runRetention(getDb(env.DB), NOW)
    expect(await getDb(env.DB).select().from(attempts)).toHaveLength(1)
    expect(await read('/insights/prognosis-weekly?weeks=26')).toEqual(before)
    expect(await read('/me/stats?firstTry=1')).toEqual(stats)
    expect(await ledger()).toHaveLength(1)
  })

  it.each([
    'adaptive_review',
    'onboarding',
  ])('preserves the %s exclusion after its session is pruned', async (kind) => {
    const s = await parent(kind)
    await answer(s.id, '2026-09-07T12:00:00Z', false)
    await getDb(env.DB)
      .update(sessions)
      .set({ endedAt: new Date('2026-09-07T13:00:00Z') })
      .where(eq(sessions.id, s.id))
    await answer((await parent()).id, '2026-12-29T12:00:00Z', true)
    vi.setSystemTime(NOW)
    await runRetention(getDb(env.DB), NOW)
    expect((await read('/me/stats?firstTry=1')).stats.bySection.ORD.firstTry90d).toBe(0)
    expect(await ledger()).toMatchObject([{ kind }])
  })

  it('keeps LAS aliases together, the last mock pick, and unknown-source tombstones', async () => {
    const mock = await parent('mock')
    await answer(mock.id, '2027-01-03T23:59:00Z', false, 'var-2024-verb1-LAS-011')
    await answer(mock.id, '2027-01-04T00:01:00Z', true, 'var-2024-verb1-LÄS-011')
    await answer((await parent()).id, '2027-01-05T12:00:00Z', false, 'var-2024-verb1-LAS-011')
    await answer(mock.id, '2027-01-05T12:00:00Z', true, 'unrecognised-ORD-001')
    vi.setSystemTime(NOW)
    const { weeks } = await read('/insights/prognosis-weekly?weeks=2')
    expect(weeks[0].bySection.LÄS).toMatchObject({ firstTry90d: 1, firstTryCorrect90d: 0 })
    expect(weeks[1].bySection.LÄS).toMatchObject({ firstTry90d: 1, firstTryCorrect90d: 1 })
    expect(weeks[1].bySection.ORD.firstTry90d).toBe(0)
    expect(await ledger()).toHaveLength(2)
    expect(await ledger()).toContainEqual(expect.objectContaining({ source: 'unknown' }))
  })

  it('preserves weekly mock picks when a mock spans weeks and its old picks are pruned', async () => {
    const mock = await parent('mock')
    await answer(mock.id, '2026-08-30T23:59:00Z', false)
    await answer(mock.id, '2026-08-31T00:01:00Z', true)
    await answer(mock.id, '2026-09-07T12:00:00Z', false)
    await answer(mock.id, '2026-12-29T12:00:00Z', true)
    vi.setSystemTime(NOW)
    const before = await read('/insights/prognosis-weekly?weeks=26')
    await runRetention(getDb(env.DB), NOW)
    expect(await read('/insights/prognosis-weekly?weeks=26')).toEqual(before)
  })
})

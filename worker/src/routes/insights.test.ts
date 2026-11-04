// Real SQL and production registration/auth; only external services are stubbed.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getDb } from '../db/client'
import { attempts, type Confidence, sessions, users } from '../db/schema'
import worker from '../index'
import { ensureUserRow } from '../lib/ensureUser'
import { retentionCutoff } from '../lib/retention'
import { makeTestD1, type ShimD1 } from '../lib/testD1'
import type { Env } from '../types'

const verifyToken = vi.hoisted(() => vi.fn())
vi.mock('@clerk/backend', () => ({ verifyToken, createClerkClient: vi.fn() }))
vi.mock('@sentry/cloudflare', () => ({
  withSentry: (_options: unknown, handler: unknown) => handler,
  captureException: vi.fn(),
}))

const NOW = new Date('2027-01-06T12:00:00Z')
const ORD = 'var-2026-verb1-ORD-001'
const LAS = 'var-2026-verb1-LAS-011'
let d1: ShimD1
let env: Env

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  d1 = makeTestD1()
  env = { DB: d1, ENVIRONMENT: 'dev' } as unknown as Env
  verifyToken.mockReset().mockImplementation(async (token: string) => {
    if (token !== 'user_a' && token !== 'user_b') throw new Error('Invalid token')
    return { sub: token }
  })
})
afterEach(() => vi.useRealTimers())

function request(path: string, token: string | null = 'user_a') {
  return worker.fetch!(
    new Request(`https://test.invalid/api/me/insights${path}`, {
      headers: token === null ? {} : { Authorization: `Bearer ${token}` },
    }),
    env,
    {} as ExecutionContext,
  )
}

async function get(path: string, token = 'user_a') {
  const res = await request(path, token)
  expect(res.status).toBe(200)
  return res.json()
}

async function session(kind = 'drill', sections: string | null = null, asUser = 'user_a') {
  const db = getDb(env.DB)
  const userId = await ensureUserRow(db, asUser)
  const [row] = await db
    .insert(sessions)
    .values({ userId, kind, sections, startedAt: NOW, endedAt: NOW })
    .returning()
  return row
}

async function attempt(
  parent: { id: number; userId: number },
  values: Partial<typeof attempts.$inferInsert> = {},
) {
  await getDb(env.DB)
    .insert(attempts)
    .values({
      userId: parent.userId,
      sessionId: parent.id,
      questionId: ORD,
      selectedAnswer: 'A',
      correct: true,
      createdAt: NOW,
      timeTakenMs: 10_000,
      source: 'authentic',
      ...values,
    })
}

describe('insights routing and empty history', () => {
  it('requires authentication on every endpoint', async () => {
    for (const path of ['/calibration', '/tempo', '/outcomes']) {
      expect((await request(path, null)).status).toBe(401)
      expect((await request(path, 'invalid')).status).toBe(401)
    }
  })

  it('returns honest empty data without provisioning or changing a user', async () => {
    const prepare = vi.spyOn(d1, 'prepare')
    expect(await get('/calibration')).toEqual({
      since: null,
      levels: {
        gissar: { n: 0, correct: 0 },
        tror: { n: 0, correct: 0 },
        saker: { n: 0, correct: 0 },
      },
      verdictAt: 20,
    })
    expect(await get('/tempo?weeks=2')).toEqual({
      weeks: [
        { iso: '2026-W53', bySection: {} },
        { iso: '2027-W01', bySection: {} },
      ],
    })
    expect(await get('/outcomes')).toEqual({})
    expect(prepare.mock.calls.every(([query]) => /^select /i.test(query))).toBe(true)
    expect(await getDb(env.DB).select().from(users)).toEqual([])
  })
})

describe('calibration', () => {
  it('counts each stored confidence, excluding mocks, ungraded/unconfident rows and other users', async () => {
    const drill = await session()
    const review = await session('adaptive_review')
    for (const confidence of ['gissar', 'tror', 'saker'] as Confidence[]) {
      await attempt(drill, { confidence, createdAt: new Date('2027-01-01T12:00:00Z') })
      await attempt(review, { confidence, correct: false })
    }
    await attempt(drill, { confidence: 'saker' })
    await attempt(drill, { confidence: 'saker', correct: null })
    await attempt(drill)
    await attempt(await session('mock'), { confidence: 'saker' })
    await attempt(await session('drill', null, 'user_b'), { confidence: 'saker' })
    expect(await get('/calibration')).toEqual({
      since: '2027-01-01T12:00:00.000Z',
      levels: {
        gissar: { n: 2, correct: 1 },
        tror: { n: 2, correct: 1 },
        saker: { n: 3, correct: 2 },
      },
      verdictAt: 20,
    })
    expect(await get('/calibration', 'user_b')).toMatchObject({
      levels: { saker: { n: 1, correct: 1 } },
    })
  })

  it('enforces the 120-day window before pruning and excludes future or undated rows', async () => {
    const drill = await session()
    const cutoff = retentionCutoff(NOW)
    for (const createdAt of [new Date(+cutoff - 1000), new Date(+NOW + 1000), null]) {
      await attempt(drill, { confidence: 'saker', createdAt })
    }
    await attempt(drill, { confidence: 'gissar', createdAt: cutoff })
    expect(await get('/calibration')).toEqual({
      since: cutoff.toISOString(),
      levels: {
        gissar: { n: 1, correct: 1 },
        tror: { n: 0, correct: 0 },
        saker: { n: 0, correct: 0 },
      },
      verdictAt: 20,
    })
  })
})

describe('tempo', () => {
  it('uses timed practice and summed mock dwell with interpolated percentiles in seconds', async () => {
    const timed = await session('drill', 'ORD · PÅ TID')
    for (const timeTakenMs of [10_000, 20_000, 30_000]) await attempt(timed, { timeTakenMs })
    const mock = await session('mock')
    await attempt(mock, { timeTakenMs: 15_000 })
    await attempt(mock, { timeTakenMs: 25_000 })
    await attempt(mock, { questionId: LAS, timeTakenMs: 1500 })
    for (const [kind, sections] of [
      ['drill', 'ORD'],
      ['drill', 'ORD · PÅ TID EXTRA'],
      ['lesson', 'ORD · PÅ TID'],
      ['mock_diagnostic', 'ORD'],
    ])
      await attempt(await session(kind, sections), { timeTakenMs: 900_000 })
    await attempt(await session('mock', null, 'user_b'), { timeTakenMs: 900_000 })
    expect(await get('/tempo?weeks=1')).toEqual({
      weeks: [
        {
          iso: '2027-W01',
          bySection: {
            ORD: { n: 4, p25: 17.5, median: 25, p75: 32.5 },
            LÄS: { n: 1, p25: 1.5, median: 1.5, p75: 1.5 },
          },
        },
      ],
    })
  })

  it('keeps mock sessions distinct and groups across a Monday before applying the requested week window', async () => {
    const first = await session('mock')
    await attempt(first, { createdAt: new Date('2027-01-03T23:59:59Z'), timeTakenMs: 10_000 })
    await attempt(first, { createdAt: new Date('2027-01-04T00:00:00Z'), timeTakenMs: 20_000 })
    await attempt(await session('mock'), { timeTakenMs: 50_000 })
    expect(await get('/tempo?weeks=1')).toEqual({
      weeks: [{ iso: '2027-W01', bySection: { ORD: { n: 2, p25: 35, median: 40, p75: 45 } } }],
    })
  })

  it('uses the ISO week-year at New Year and fills gaps chronologically', async () => {
    const timed = await session('drill', 'ord · på tid')
    for (const createdAt of [
      '2026-12-27T23:59:59Z',
      '2026-12-28T00:00:00Z',
      '2027-01-03T23:59:59Z',
    ]) {
      await attempt(timed, { createdAt: new Date(createdAt) })
    }
    expect(await get('/tempo?weeks=3')).toEqual({
      weeks: [
        { iso: '2026-W52', bySection: { ORD: { n: 1, p25: 10, median: 10, p75: 10 } } },
        { iso: '2026-W53', bySection: { ORD: { n: 2, p25: 10, median: 10, p75: 10 } } },
        { iso: '2027-W01', bySection: {} },
      ],
    })
  })

  it('omits unknown/invalid time and sections, retains measured zero, and does not invent partial mock totals', async () => {
    const timed = await session('drill', 'ORD · PÅ TID')
    for (const timeTakenMs of [null, -1, 0, 1000, 2000]) await attempt(timed, { timeTakenMs })
    await attempt(timed, { questionId: 'unparseable' })
    await attempt(timed, { questionId: LAS })
    const mock = await session('mock')
    await attempt(mock, { timeTakenMs: null })
    await attempt(mock, { timeTakenMs: 10_000 })
    await attempt(timed, { createdAt: new Date(+NOW + 1000) })
    await attempt(timed, { createdAt: new Date(+retentionCutoff(NOW) - 1000) })
    expect(await get('/tempo?weeks=1')).toEqual({
      weeks: [{ iso: '2027-W01', bySection: { ORD: { n: 3, p25: 0.5, median: 1, p75: 1.5 } } }],
    })
  })

  it('defaults to nine weeks and rejects invalid or retention-exceeding windows', async () => {
    expect(await get('/tempo')).toMatchObject({ weeks: expect.any(Array) })
    const body = (await get('/tempo')) as { weeks: unknown[] }
    expect(body.weeks).toHaveLength(9)
    for (const weeks of ['0', '-1', '18', '1.5', 'bad', '']) {
      expect((await request(`/tempo?weeks=${weeks}`)).status).toBe(400)
    }
  })
})

describe('outcomes', () => {
  it('counts distinct right UTC days, retained graded rows, and isolates users', async () => {
    const drill = await session()
    for (const createdAt of [
      '2027-01-01T23:59:00Z',
      '2027-01-01T23:59:59Z',
      '2027-01-02T00:00:00Z',
    ]) {
      await attempt(drill, { createdAt: new Date(createdAt) })
    }
    await attempt(drill, { correct: false })
    await attempt(drill, { correct: null })
    await attempt(drill, { createdAt: new Date(+retentionCutoff(NOW) - 1000) })
    await attempt(drill, { createdAt: new Date(+NOW + 1000) })
    await attempt(drill, { createdAt: null })
    await attempt(drill, { questionId: LAS, correct: false })
    await attempt(await session('drill', null, 'user_b'))
    expect(await get('/outcomes')).toEqual({
      [ORD]: { n: 4, right: 3, rightDays: 2 },
      [LAS]: { n: 1, right: 0, rightDays: 0 },
    })
    expect(await get('/outcomes', 'user_b')).toEqual({ [ORD]: { n: 1, right: 1, rightDays: 1 } })
  })

  it('uses the last mock pick once, breaks timestamp ties by id, and supports an owned session filter', async () => {
    const mock = await session('mock')
    await attempt(mock, { correct: true })
    await attempt(mock, { correct: false })
    await attempt(mock, { questionId: LAS, correct: false })
    await attempt(mock, { questionId: LAS, correct: true })
    await attempt(await session())
    expect(await get(`/outcomes?sessionId=${mock.id}`)).toEqual({
      [ORD]: { n: 1, right: 0, rightDays: 0 },
      [LAS]: { n: 1, right: 1, rightDays: 1 },
    })
    expect(await get('/outcomes')).toEqual({
      [ORD]: { n: 2, right: 1, rightDays: 1 },
      [LAS]: { n: 1, right: 1, rightDays: 1 },
    })
    const other = await session('mock', null, 'user_b')
    expect((await request(`/outcomes?sessionId=${other.id}`)).status).toBe(404)
    expect((await request('/outcomes?sessionId=99999')).status).toBe(404)
    for (const id of ['0', '-1', '1.1', 'bad', '']) {
      expect((await request(`/outcomes?sessionId=${id}`)).status).toBe(400)
    }
  })

  it('returns an empty map for an owned session without answers', async () => {
    const empty = await session()
    expect(await get(`/outcomes?sessionId=${empty.id}`)).toEqual({})
  })
})

it('does not count inconsistent attempt/session ownership in any insight', async () => {
  const own = await session('drill', 'ORD · PÅ TID')
  const other = await session('drill', 'ORD · PÅ TID', 'user_b')
  await attempt(other, { userId: own.userId, confidence: 'saker' })
  await attempt(own, { userId: other.userId, confidence: 'saker' })
  expect(await get('/calibration')).toMatchObject({ levels: { saker: { n: 0, correct: 0 } } })
  expect(await get('/tempo?weeks=1')).toEqual({ weeks: [{ iso: '2027-W01', bySection: {} }] })
  expect(await get('/outcomes')).toEqual({})
})

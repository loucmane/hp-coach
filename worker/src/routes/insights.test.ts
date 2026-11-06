// Real SQL and production registration/auth; only external services are stubbed.
import { gte } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getDb } from '../db/client'
import { type AttemptSource, attempts, type Confidence, sessions, users } from '../db/schema'
import worker from '../index'
import { ensureUserRow } from '../lib/ensureUser'
import { retentionCutoff } from '../lib/retention'
import { SECTIONS, type Section } from '../lib/section'
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

function request(path: string, token: string | null = 'user_a', base = '/api/me/insights') {
  return worker.fetch!(
    new Request(`https://test.invalid${base}${path}`, {
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

// A section's first-try aggregates, in the order /me/stats?firstTry=1 sends them.
const FIRST_TRY = {
  firstTry7d: 0,
  firstTryCorrect7d: 0,
  firstTry7to14d: 0,
  firstTryCorrect7to14d: 0,
  firstTry90d: 0,
  firstTryCorrect90d: 0,
}
type FirstTry = typeof FIRST_TRY

/** Every section at zero, apart from `counts`. */
function sections(counts: Partial<Record<Section, Partial<FirstTry>>> = {}) {
  return Object.fromEntries(SECTIONS.map((s) => [s, { ...FIRST_TRY, ...counts[s] }]))
}

describe('insights routing and empty history', () => {
  it('requires authentication on every endpoint', async () => {
    for (const path of ['/calibration', '/tempo', '/outcomes', '/prognosis-weekly']) {
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
    expect(await get('/prognosis-weekly?weeks=2')).toEqual({
      weeks: [
        { iso: '2026-W53', end: '2027-01-04T00:00:00.000Z', bySection: sections() },
        { iso: '2027-W01', end: NOW.toISOString(), bySection: sections() },
      ],
    })
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

describe('prognosis-weekly', () => {
  type Week = { iso: string; end: string; bySection: Record<Section, FirstTry> }
  const DAY_MS = 86_400_000
  const at = (iso: string) => new Date(iso)
  const ord = (n: number) => `var-2026-verb1-ORD-${String(n).padStart(3, '0')}`
  const XYZ = 'var-2026-kvant1-XYZ-001'
  const KVA = 'host-2024-kvant1-KVA-013'

  async function weekly(path = '', token = 'user_a'): Promise<Week[]> {
    return ((await get(`/prognosis-weekly${path}`, token)) as { weeks: Week[] }).weeks
  }

  /** The first-try fields of GET /api/me/stats?firstTry=1, section by section. */
  async function statsFirstTry(token = 'user_a'): Promise<Record<Section, FirstTry>> {
    const res = await request('/stats?firstTry=1', token, '/api/me')
    expect(res.status).toBe(200)
    const { stats } = (await res.json()) as {
      stats: { bySection: Record<Section, Record<string, number>> }
    }
    return Object.fromEntries(
      SECTIONS.map((s) => [
        s,
        Object.fromEntries(Object.keys(FIRST_TRY).map((key) => [key, stats.bySection[s][key]])),
      ]),
    ) as Record<Section, FirstTry>
  }

  /** 200 answers over the last 100 days in every kind, source and section,
   *  plus first tries on the week edges and a retry of an undated answer. */
  async function seedVariedHistory() {
    // mulberry32, so the history is fixed.
    let seed = 34
    const random = () => {
      seed = (seed + 0x6d2b79f5) >>> 0
      let t = seed
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    const pick = <T>(xs: readonly T[]) => xs[Math.floor(random() * xs.length)]
    const kinds = [
      'drill',
      'drill',
      'drill',
      'adaptive_review',
      'mock',
      'mock_diagnostic',
      'lesson',
      'onboarding',
    ]
    const parents = new Map<string, { id: number; userId: number }>()
    for (const kind of new Set(kinds)) parents.set(kind, await session(kind))
    const families = [
      'verb1-ORD',
      'verb1-LÄS',
      'verb1-LAS',
      'verb2-MEK',
      'verb2-ELF',
      'kvant1-XYZ',
      'kvant1-KVA',
      'kvant2-NOG',
      'kvant2-DTK',
    ]
    const sources: AttemptSource[] = ['authentic', 'authentic', 'synthetic', 'unknown']
    for (let i = 0; i < 200; i++) {
      const number = String(1 + Math.floor(random() * 12)).padStart(3, '0')
      await attempt(parents.get(pick(kinds))!, {
        questionId: random() < 0.03 ? 'unparseable' : `var-2026-${pick(families)}-${number}`,
        correct: random() < 0.6,
        source: pick(sources),
        createdAt: new Date(+NOW - Math.floor(random() * 100 * 86_400) * 1000),
      })
    }
    // Each edge answer is its own question's first try. The undated answer
    // sorts first, so the dated one after it is a retry.
    for (const [n, createdAt] of [
      [20, at('2026-12-27T23:59:59Z')],
      [21, at('2026-12-28T00:00:00Z')],
      [22, at('2027-01-04T00:00:00Z')],
      [23, null],
      [23, at('2027-01-05T10:00:00Z')],
    ] as const) {
      await attempt(parents.get('drill')!, { questionId: ord(n), createdAt })
    }
  }

  it('computes each past week as of its end, across the Monday boundaries', async () => {
    const drill = await session()
    // 91 days before NOW: outside today's 90-day window, inside W52's and W53's.
    await attempt(drill, { questionId: ord(1), createdAt: at('2026-10-07T12:00:00Z') })
    await attempt(drill, { questionId: ord(2), createdAt: at('2026-12-27T23:59:59Z') })
    await attempt(drill, {
      questionId: ord(3),
      correct: false,
      createdAt: at('2026-12-28T00:00:00Z'),
    })
    await attempt(drill, { questionId: ord(4), createdAt: at('2027-01-03T23:59:59Z') })
    await attempt(drill, { questionId: ord(5), createdAt: at('2027-01-04T00:00:00Z') })
    expect(await weekly('?weeks=3')).toEqual([
      // A past week's 7 days are the ISO week itself, its 7–14 days the week before.
      {
        iso: '2026-W52',
        end: '2026-12-28T00:00:00.000Z',
        bySection: sections({
          ORD: { firstTry7d: 1, firstTryCorrect7d: 1, firstTry90d: 2, firstTryCorrect90d: 2 },
        }),
      },
      {
        iso: '2026-W53',
        end: '2027-01-04T00:00:00.000Z',
        bySection: sections({
          ORD: {
            firstTry7d: 2,
            firstTryCorrect7d: 1,
            firstTry7to14d: 1,
            firstTryCorrect7to14d: 1,
            firstTry90d: 4,
            firstTryCorrect90d: 3,
          },
        }),
      },
      // The current week has not ended: it stands as of now, on /me/stats's windows.
      {
        iso: '2027-W01',
        end: NOW.toISOString(),
        bySection: sections({
          ORD: {
            firstTry7d: 2,
            firstTryCorrect7d: 2,
            firstTry7to14d: 2,
            firstTryCorrect7to14d: 1,
            firstTry90d: 4,
            firstTryCorrect90d: 3,
          },
        }),
      },
    ])
  })

  it('counts first tries only, as they stood at each end', async () => {
    const drill = await session()
    const repetera = await session('adaptive_review')
    const mock = await session('mock')
    const onboarding = await session('onboarding')
    // A first try in W53; its Repetera replay and its W01 retry do not count.
    await attempt(drill, {
      questionId: ord(1),
      correct: false,
      createdAt: at('2026-12-29T10:00:00Z'),
    })
    await attempt(repetera, { questionId: ord(1), createdAt: at('2026-12-29T11:00:00Z') })
    await attempt(drill, { questionId: ord(1), createdAt: at('2027-01-05T10:00:00Z') })
    // First met in Repetera: no first try at all, so the later drill answer is a retry.
    await attempt(repetera, { questionId: KVA, createdAt: at('2026-12-29T12:00:00Z') })
    await attempt(drill, { questionId: KVA, createdAt: at('2027-01-05T11:00:00Z') })
    // Seen but never assessed: an unknown source, and a taught onboarding example.
    await attempt(drill, {
      questionId: ord(2),
      source: 'unknown',
      createdAt: at('2026-12-29T13:00:00Z'),
    })
    await attempt(drill, { questionId: ord(2), createdAt: at('2027-01-05T12:00:00Z') })
    await attempt(onboarding, { questionId: ord(3), createdAt: at('2026-12-29T14:00:00Z') })
    await attempt(drill, { questionId: ord(3), createdAt: at('2027-01-05T13:00:00Z') })
    // The legacy LAS spelling is the same bank question as its LÄS qid.
    await attempt(drill, { questionId: LAS, correct: false, createdAt: at('2026-12-29T15:00:00Z') })
    await attempt(drill, {
      questionId: 'var-2026-verb1-LÄS-011',
      createdAt: at('2027-01-05T14:00:00Z'),
    })
    // A mock pick changed after midnight: W53 ended on the wrong pick; now it is right.
    await attempt(mock, { questionId: XYZ, correct: false, createdAt: at('2027-01-03T23:59:00Z') })
    await attempt(mock, { questionId: XYZ, createdAt: at('2027-01-04T00:01:00Z') })
    expect(await weekly('?weeks=2')).toEqual([
      {
        iso: '2026-W53',
        end: '2027-01-04T00:00:00.000Z',
        bySection: sections({
          ORD: { firstTry7d: 1, firstTry90d: 1 },
          LÄS: { firstTry7d: 1, firstTry90d: 1 },
          XYZ: { firstTry7d: 1, firstTry90d: 1 },
        }),
      },
      {
        iso: '2027-W01',
        end: NOW.toISOString(),
        bySection: sections({
          ORD: { firstTry7to14d: 1, firstTry90d: 1 },
          LÄS: { firstTry7to14d: 1, firstTry90d: 1 },
          XYZ: { firstTry7d: 1, firstTryCorrect7d: 1, firstTry90d: 1, firstTryCorrect90d: 1 },
        }),
      },
    ])
  })

  it('ends on exactly what /me/stats?firstTry=1 returns now, field for field', async () => {
    await seedVariedHistory()
    const stats = await statsFirstTry()
    for (const path of ['', '?weeks=1', '?weeks=26']) {
      const current = (await weekly(path)).at(-1)!
      expect(current).toMatchObject({ iso: '2027-W01', end: NOW.toISOString() })
      // The same keys in the same order, with the same values.
      expect(JSON.stringify(current.bySection)).toBe(JSON.stringify(stats))
    }
    // Not vacuous: the history reaches every window.
    const sum = (key: keyof FirstTry) => Object.values(stats).reduce((n, s) => n + s[key], 0)
    expect(sum('firstTry7d')).toBeGreaterThan(0)
    expect(sum('firstTry7to14d')).toBeGreaterThan(0)
    expect(sum('firstTry90d')).toBeGreaterThan(sum('firstTry7d') + sum('firstTry7to14d'))
  })

  it("is, for each past week, what /me/stats?firstTry=1 said at that week's end", async () => {
    await seedVariedHistory()
    const weeks = await weekly()
    expect(weeks).toHaveLength(12)
    // Walk back in time: drop the answers given since each end, then ask /me/stats at it.
    for (const week of weeks.slice(0, -1).reverse()) {
      const end = new Date(week.end)
      await getDb(env.DB).delete(attempts).where(gte(attempts.createdAt, end))
      vi.setSystemTime(end)
      expect(JSON.stringify(week.bySection)).toBe(JSON.stringify(await statsFirstTry()))
    }
    expect(weeks.some((w) => w.bySection.ORD.firstTry7d > 0)).toBe(true)
  })

  it('keeps the weeks before the first answer at zero, and a quiet week as it ended', async () => {
    await attempt(await session(), { createdAt: at('2026-12-24T10:00:00Z') })
    const once = { firstTry90d: 1, firstTryCorrect90d: 1 }
    expect(await weekly('?weeks=4')).toEqual([
      { iso: '2026-W51', end: '2026-12-21T00:00:00.000Z', bySection: sections() },
      {
        iso: '2026-W52',
        end: '2026-12-28T00:00:00.000Z',
        bySection: sections({ ORD: { ...once, firstTry7d: 1, firstTryCorrect7d: 1 } }),
      },
      // A week without answers still has the prognosis it ended on, never a gap or a guess.
      {
        iso: '2026-W53',
        end: '2027-01-04T00:00:00.000Z',
        bySection: sections({ ORD: { ...once, firstTry7to14d: 1, firstTryCorrect7to14d: 1 } }),
      },
      {
        iso: '2027-W01',
        end: NOW.toISOString(),
        bySection: sections({ ORD: { ...once, firstTry7to14d: 1, firstTryCorrect7to14d: 1 } }),
      },
    ])
  })

  it('defaults to twelve weeks, allows one to twenty-six, and rejects the rest', async () => {
    const twelve = await weekly()
    expect(twelve.map((w) => w.iso)).toEqual([
      '2026-W43',
      '2026-W44',
      '2026-W45',
      '2026-W46',
      '2026-W47',
      '2026-W48',
      '2026-W49',
      '2026-W50',
      '2026-W51',
      '2026-W52',
      '2026-W53',
      '2027-W01',
    ])
    const mondays = Array.from({ length: 11 }, (_, i) =>
      new Date(Date.UTC(2026, 9, 26) + i * 7 * DAY_MS).toISOString(),
    )
    expect(twelve.map((w) => w.end)).toEqual([...mondays, NOW.toISOString()])
    expect(await weekly('?weeks=1')).toEqual([
      { iso: '2027-W01', end: NOW.toISOString(), bySection: sections() },
    ])
    const most = await weekly('?weeks=26')
    expect(most).toHaveLength(26)
    expect(most[0]).toEqual({
      iso: '2026-W29',
      end: '2026-07-20T00:00:00.000Z',
      bySection: sections(),
    })
    for (const weeks of ['0', '-1', '27', '1.5', 'bad', '']) {
      expect((await request(`/prognosis-weekly?weeks=${weeks}`)).status).toBe(400)
    }
  })

  it("reads only the signed-in student's answers", async () => {
    // B answers first; A's later answer to the same question is still A's first try.
    await attempt(await session('drill', null, 'user_b'), {
      createdAt: at('2027-01-05T10:00:00Z'),
    })
    await attempt(await session(), { correct: false, createdAt: at('2027-01-05T11:00:00Z') })
    await attempt(await session('drill', null, 'user_b'), {
      questionId: LAS,
      createdAt: at('2027-01-05T12:00:00Z'),
    })
    const [a] = await weekly('?weeks=1')
    const [b] = await weekly('?weeks=1', 'user_b')
    expect(a.bySection).toEqual(sections({ ORD: { firstTry7d: 1, firstTry90d: 1 } }))
    const right = { firstTry7d: 1, firstTryCorrect7d: 1, firstTry90d: 1, firstTryCorrect90d: 1 }
    expect(b.bySection).toEqual(sections({ ORD: right, LÄS: right }))
    expect(a.bySection).toEqual(await statsFirstTry())
    expect(b.bySection).toEqual(await statsFirstTry('user_b'))
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

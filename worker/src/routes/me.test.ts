// Integration tests for /api/me — currently scoped to GET /me/exposure,
// the per-question exposure map that seeds a mock's seenBefore snapshot
// and (client-side) drives "you've seen this before" surfaces.
//
// NOTE: exposure is a LIVE aggregate over `attempts`, unlike
// mock_results.seenBefore (a stored snapshot). attempts rows are pruned
// after ~120 days (lib/retention.ts), so this endpoint's counts silently
// shrink as old attempts age out — by design, documented on the route.

import { Hono } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getDb } from '../db/client'
import { type AttemptSource, attempts, sessions, users } from '../db/schema'
import { classifyAttempt } from '../lib/provenance'
import { makeTestD1, type ShimD1 } from '../lib/testD1'
import type { Env, Vars } from '../types'
import { meRoute } from './me'

let d1: ShimD1

function appFor(asUser: string) {
  const env = { DB: d1 } as unknown as Env
  const app = new Hono<{ Bindings: Env; Variables: Vars }>()
    .use('*', async (c, next) => {
      c.set('userId', asUser)
      await next()
    })
    .route('/', meRoute)
  return { app, env }
}

async function getExposure(asUser = 'user_a') {
  const { app, env } = appFor(asUser)
  const res = await app.request('/exposure', {}, env)
  return {
    res,
    body: (await res.json()) as { exposure: Record<string, { n: number; last: string | number }> },
  }
}

async function seedAttempt(
  clerkUserId: string,
  questionId: string,
  createdAt: Date = new Date(),
  timeTakenMs?: number,
) {
  const db = getDb(d1 as unknown as D1Database)
  const [user] = await db
    .insert(users)
    .values({ clerkUserId })
    .onConflictDoUpdate({ target: users.clerkUserId, set: { clerkUserId } })
    .returning()
  const [session] = await db
    .insert(sessions)
    .values({ userId: user.id, kind: 'drill', endedAt: new Date() })
    .returning()
  await db.insert(attempts).values({
    userId: user.id,
    sessionId: session.id,
    questionId,
    correct: true,
    createdAt,
    timeTakenMs: timeTakenMs ?? null,
    // Classified from the qid, as POST /api/attempts stores it.
    ...classifyAttempt(questionId),
  })
}

beforeEach(() => {
  d1 = makeTestD1()
})

describe('GET /api/me/exposure', () => {
  it('returns an empty map for a fresh user', async () => {
    const { res, body } = await getExposure()
    expect(res.status).toBe(200)
    expect(body.exposure).toEqual({})
  })

  it('groups attempts by question, counting n and tracking the latest timestamp', async () => {
    await seedAttempt('user_a', 'var-2024-XYZ-001', new Date('2026-01-01T00:00:00Z'))
    await seedAttempt('user_a', 'var-2024-XYZ-001', new Date('2026-02-01T00:00:00Z'))
    await seedAttempt('user_a', 'var-2024-KVA-002', new Date('2026-01-15T00:00:00Z'))

    const { body } = await getExposure()
    expect(body.exposure['var-2024-XYZ-001'].n).toBe(2)
    expect(body.exposure['var-2024-KVA-002'].n).toBe(1)
  })

  it('never leaks one user’s exposure to another', async () => {
    await seedAttempt('user_a', 'var-2024-XYZ-001')
    await seedAttempt('user_b', 'var-2024-XYZ-001')

    const a = await getExposure('user_a')
    const b = await getExposure('user_b')
    expect(a.body.exposure['var-2024-XYZ-001'].n).toBe(1)
    expect(b.body.exposure['var-2024-XYZ-001'].n).toBe(1)
  })
})

describe('GET /api/me/stats — timeMsToday (Home "minuter idag" stat)', () => {
  async function getStats(asUser = 'user_a') {
    const { app, env } = appFor(asUser)
    const res = await app.request('/stats', {}, env)
    return { res, body: (await res.json()) as { stats: { timeMsToday: number } } }
  }

  it('is 0 for a fresh user with no attempts (day-zero shows 0, not the plan estimate)', async () => {
    const { res, body } = await getStats('user_fresh')
    expect(res.status).toBe(200)
    expect(body.stats.timeMsToday).toBe(0)
  })

  it('sums timeTakenMs over attempts created today (UTC) only', async () => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60_000)
    await seedAttempt('user_a', 'var-2024-XYZ-001', now, 90_000)
    await seedAttempt('user_a', 'var-2024-ORD-002', now, 30_000)
    // Yesterday's practice must not leak into today's stat.
    await seedAttempt('user_a', 'var-2024-KVA-003', yesterday, 600_000)
    // Null timeTakenMs rows contribute nothing (never NaN).
    await seedAttempt('user_a', 'var-2024-NOG-004', now)

    const { body } = await getStats()
    expect(body.stats.timeMsToday).toBe(120_000)
  })
})

describe('PATCH /api/me/prefs — mockDeferredDate ("Inte idag" defer)', () => {
  async function patchPrefs(body: unknown, asUser = 'user_a') {
    const { app, env } = appFor(asUser)
    const res = await app.request(
      '/prefs',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      },
      env,
    )
    return { res, body: (await res.json()) as { prefs?: { mockDeferredDate?: string | null } } }
  }

  it('persists a valid YYYY-MM-DD defer date and reads it back', async () => {
    const { res, body } = await patchPrefs({ mockDeferredDate: '2026-07-15' })
    expect(res.status).toBe(200)
    expect(body.prefs?.mockDeferredDate).toBe('2026-07-15')
  })

  it('clears the defer with null', async () => {
    await patchPrefs({ mockDeferredDate: '2026-07-15' })
    const { body } = await patchPrefs({ mockDeferredDate: null })
    expect(body.prefs?.mockDeferredDate).toBeNull()
  })

  it('rejects a malformed defer date (not YYYY-MM-DD)', async () => {
    const { res } = await patchPrefs({ mockDeferredDate: 'today' })
    expect(res.status).toBe(400)
  })

  it('defaults to null for a fresh user row', async () => {
    // A prefs GET lazily creates the row; the new column has no default.
    const { app, env } = appFor('user_fresh')
    const res = await app.request('/prefs', {}, env)
    const body = (await res.json()) as { prefs?: { mockDeferredDate?: string | null } }
    expect(body.prefs?.mockDeferredDate ?? null).toBeNull()
  })
})

// P5 infold PR 3 (docs/p5-infold-design.md Amendment 1 E): synthetic (P5)
// answers count toward the section scores, the weekly trend and accuracy7d,
// and every estimate they feed says so in estimateBasis. Unknown answers are
// stored but never assessed; they still count as practice effort.
describe('GET /api/me/stats — provenance', () => {
  const NOW = new Date('2026-10-08T12:00:00Z')
  const HOUR = 60 * 60_000
  const DAY = 24 * HOUR
  const LAS_A = ['var-2026-verb1-LÄS-011', 'var-2026-verb1-LÄS-012']
  const LAS_P5 = [
    'p5-las-b19-002-r1-LÄS-001',
    'p5-las-b19-002-r1-LÄS-002',
    'p5-las-b7-002-r2-LÄS-001',
  ]
  const UNKNOWN = ['p5-las-b7-002-r1-LÄS-001', 'var-2099-verb1-LÄS-011', 'q1']

  type Basis = { authentic: number; synthetic: number; calibrated: boolean }
  type SectionBody = {
    attempts7d: number
    correct7d: number
    attempts7to14d: number
    correct7to14d: number
    attempts90d: number
    correct90d: number
    avgTimeMs: number | null
    lastAttemptedAt: number | null
    attemptsToday: number
    estimateBasis: Basis
  }
  type WeeklyBody = { weekStart: number; attempts: number; correct: number; estimateBasis: Basis }
  type StatsBody = {
    attempts: { total: number; today: number; thisWeek: number }
    accuracy7d: number | null
    timeMsToday: number
    streakDays: number
    bySection: Record<string, SectionBody>
    weekly: WeeklyBody[]
    attemptsDaily: Array<{ date: string; n: number; verbal: number; quant: number }>
  }

  async function seedGraded(
    questionId: string,
    correct: boolean,
    createdAt: Date,
    opts: { timeTakenMs?: number; source?: AttemptSource } = {},
  ) {
    const db = getDb(d1 as unknown as D1Database)
    const [user] = await db
      .insert(users)
      .values({ clerkUserId: 'user_p' })
      .onConflictDoUpdate({ target: users.clerkUserId, set: { clerkUserId: 'user_p' } })
      .returning()
    const [session] = await db
      .insert(sessions)
      .values({ userId: user.id, kind: 'drill', endedAt: createdAt })
      .returning()
    const provenance = classifyAttempt(questionId)
    await db.insert(attempts).values({
      userId: user.id,
      sessionId: session.id,
      questionId,
      correct,
      createdAt,
      timeTakenMs: opts.timeTakenMs ?? null,
      source: opts.source ?? provenance.source,
      itemRevision: provenance.itemRevision,
    })
  }

  async function stats(): Promise<StatsBody> {
    const { app, env } = appFor('user_p')
    const res = await app.request('/stats', {}, env)
    expect(res.status).toBe(200)
    return ((await res.json()) as { stats: StatsBody }).stats
  }

  /** Two authentic LÄS answers (1 right) an hour ago, one authentic ORD answer 10 days ago. */
  async function seedAuthentic() {
    await seedGraded(LAS_A[0], true, new Date(NOW.getTime() - HOUR), { timeTakenMs: 60_000 })
    await seedGraded(LAS_A[1], false, new Date(NOW.getTime() - HOUR), { timeTakenMs: 30_000 })
    await seedGraded('var-2026-verb1-ORD-001', true, new Date(NOW.getTime() - 10 * DAY))
  }

  /** Three synthetic LÄS answers, all right, two hours ago. */
  async function seedSynthetic() {
    for (const qid of LAS_P5) {
      await seedGraded(qid, true, new Date(NOW.getTime() - 2 * HOUR), { timeTakenMs: 90_000 })
    }
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('synthetic answers move the section score inputs, the weekly trend and accuracy7d', async () => {
    await seedAuthentic()
    const before = await stats()
    expect(before.bySection.LÄS).toMatchObject({
      attempts7d: 2,
      correct7d: 1,
      attempts90d: 2,
      correct90d: 1,
    })
    expect(before.accuracy7d).toBeCloseTo(1 / 2, 12)

    await seedSynthetic()
    const after = await stats()
    expect(after.bySection.LÄS).toMatchObject({
      attempts7d: 5,
      correct7d: 4,
      attempts90d: 5,
      correct90d: 4,
      // (60 + 30 + 3 × 90) s / 5 answers
      avgTimeMs: 72_000,
      lastAttemptedAt: NOW.getTime() - HOUR,
      attemptsToday: 5,
    })
    expect(after.accuracy7d).toBeCloseTo(4 / 5, 12)
    const current = after.weekly[after.weekly.length - 1]
    expect(current).toMatchObject({ attempts: 5, correct: 4 })
    // The other sections did not move.
    expect(after.bySection.ORD).toEqual(before.bySection.ORD)
  })

  it('estimateBasis marks every estimate a synthetic answer feeds as uncalibrated', async () => {
    await seedAuthentic()
    await seedSynthetic()
    const s = await stats()
    expect(s.bySection.LÄS.estimateBasis).toEqual({ authentic: 2, synthetic: 3, calibrated: false })
    expect(s.bySection.ORD.estimateBasis).toEqual({ authentic: 1, synthetic: 0, calibrated: true })
    expect(s.bySection.ELF.estimateBasis).toEqual({ authentic: 0, synthetic: 0, calibrated: true })
    const current = s.weekly[s.weekly.length - 1]
    const tenDaysAgo = s.weekly[s.weekly.length - 2]
    expect(current.estimateBasis).toEqual({ authentic: 2, synthetic: 3, calibrated: false })
    expect(tenDaysAgo).toMatchObject({
      attempts: 1,
      estimateBasis: { authentic: 1, synthetic: 0, calibrated: true },
    })
    for (const bucket of s.weekly.slice(0, -2)) {
      expect(bucket.estimateBasis).toEqual({ authentic: 0, synthetic: 0, calibrated: true })
    }
  })

  it('an authentic-only history is calibrated everywhere', async () => {
    await seedAuthentic()
    const s = await stats()
    for (const section of Object.values(s.bySection)) {
      expect(section.estimateBasis.synthetic).toBe(0)
      expect(section.estimateBasis.calibrated).toBe(true)
      expect(section.estimateBasis.authentic).toBe(section.attempts90d)
    }
    for (const bucket of s.weekly) {
      expect(bucket.estimateBasis).toEqual({
        authentic: bucket.attempts,
        synthetic: 0,
        calibrated: true,
      })
    }
  })

  it('unknown answers are stored but excluded from every assessed number', async () => {
    await seedAuthentic()
    await seedSynthetic()
    const before = await stats()
    for (const qid of UNKNOWN) {
      await seedGraded(qid, true, new Date(NOW.getTime() - 3 * HOUR), { timeTakenMs: 600_000 })
    }
    const after = await stats()
    expect(after.accuracy7d).toBe(before.accuracy7d)
    expect(after.weekly).toEqual(before.weekly)
    for (const section of Object.keys(before.bySection)) {
      const { attemptsToday: todayAfter, ...assessedAfter } = after.bySection[section]
      const { attemptsToday: todayBefore, ...assessedBefore } = before.bySection[section]
      expect(assessedAfter).toEqual(assessedBefore)
      // Practice effort still counts them where a section parses.
      expect(todayAfter).toBe(todayBefore + (section === 'LÄS' ? 2 : 0))
    }
    // Effort: every answer is practice, whatever its source.
    expect(after.attempts.today).toBe(before.attempts.today + 3)
    expect(after.timeMsToday).toBe(before.timeMsToday + 3 * 600_000)
    const today = after.attemptsDaily[after.attemptsDaily.length - 1]
    const todayBefore = before.attemptsDaily[before.attemptsDaily.length - 1]
    expect(today.verbal).toBe(todayBefore.verbal + 2)
  })

  it('trusts the stored source: an authentic qid stored unknown is not assessed', async () => {
    await seedGraded(LAS_A[0], true, new Date(NOW.getTime() - HOUR), { source: 'unknown' })
    const s = await stats()
    expect(s.bySection.LÄS).toMatchObject({ attempts90d: 0, attemptsToday: 1 })
    expect(s.accuracy7d).toBeNull()
  })
})

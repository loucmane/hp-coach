// Integration tests for /api/me — currently scoped to GET /me/exposure,
// the per-question exposure map that seeds a mock's seenBefore snapshot
// and (client-side) drives "you've seen this before" surfaces.
//
// NOTE: exposure is a LIVE aggregate over `attempts`, unlike
// mock_results.seenBefore (a stored snapshot). attempts rows are pruned
// after ~120 days (lib/retention.ts), so this endpoint's counts silently
// shrink as old attempts age out — by design, documented on the route.

import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getDb } from '../db/client'
import { type AttemptSource, attempts, sessions, users } from '../db/schema'
import { FITTED_KINDS } from '../lib/fit'
import { classifyAttempt } from '../lib/provenance'
import { examFor } from '../lib/sittings'
import { makeTestD1, type ShimD1 } from '../lib/testD1'
import type { Env, Vars } from '../types'
import { attemptsRoute } from './attempts'
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

describe('onboarding assessment exclusion', () => {
  it('reads plans only for ended onboarding sessions, using the user-kind index', async () => {
    const { app, env } = appFor('query_shape')
    const prepare = vi.spyOn(d1, 'prepare')
    const res = await app.request('/stats?firstTry=1', {}, env)
    expect(res.status).toBe(200)
    const queries = prepare.mock.calls.map(([query]) => query)
    const history = queries.filter((query) => query.includes('from "attempts"'))
    expect(history.length).toBeGreaterThan(0)
    expect(history.every((query) => !query.includes('"plan"'))).toBe(true)
    const plans = queries.filter((query) => query.includes('"plan"'))
    expect(plans).toHaveLength(1)
    expect(plans[0]).toContain('from "sessions"')
    expect(plans[0]).toContain('"sessions"."user_id" = ?')
    expect(plans[0]).toContain('"sessions"."kind" = ?')
    expect(plans[0]).toContain('"sessions"."ended_at" is not null')
    const explained = await d1
      .prepare(`EXPLAIN QUERY PLAN ${plans[0]}`)
      .bind(1, 'onboarding')
      .all<{ detail: string }>()
    expect(explained.results.some((row) => row.detail.includes('idx_sessions_user_kind'))).toBe(
      true,
    )
    prepare.mockClear()
    await app.request('/stats', {}, env)
    expect(prepare.mock.calls.some(([query]) => query.includes('"plan"'))).toBe(false)
    prepare.mockRestore()
  })

  it('never marks a retired partial pass or repeated answers as a completed first pass', async () => {
    const { app, env } = appFor('partial')
    const db = getDb(d1 as unknown as D1Database)
    const [user] = await db.insert(users).values({ clerkUserId: 'partial' }).returning()
    const plan = ['host-2016-verb2-ORD-004', 'host-2021-verb2-ORD-003', 'host-2025-verb2-ORD-010']
    const [session] = await db
      .insert(sessions)
      .values({ userId: user.id, kind: 'onboarding', plan, endedAt: new Date() })
      .returning()
    for (let i = 0; i < 3; i++) {
      await db
        .insert(attempts)
        .values({ userId: user.id, sessionId: session.id, questionId: plan[0], correct: true })
    }
    const body = (await (await app.request('/stats?firstTry=1', {}, env)).json()) as {
      stats: { onboardingCompletedAt?: string }
    }
    expect(body.stats.onboardingCompletedAt).toBeUndefined()
  })

  it('retains effort and exposure, but supplies no assessment or first-try signal', async () => {
    const { app, env } = appFor('user_first')
    const api = new Hono<{ Bindings: Env; Variables: Vars }>()
      .use('*', async (c, next) => {
        c.set('userId', 'user_first')
        await next()
      })
      .route('/', attemptsRoute)
    await app.request('/stats', {}, env)
    const db = getDb(d1 as unknown as D1Database)
    const [user] = await db.select().from(users)
    const qids = ['host-2016-verb2-ORD-004', 'host-2021-verb2-ORD-003', 'host-2025-verb2-ORD-010']
    const [session] = await db
      .insert(sessions)
      .values({ userId: user.id, kind: 'onboarding', plan: qids })
      .returning()
    for (const questionId of qids) {
      const res = await api.request(
        '/',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.id,
            questionId,
            correct: true,
            selectedAnswer: 'A',
            timeTakenMs: 1000,
          }),
        },
        env,
      )
      expect(res.status).toBe(201)
    }
    const read = async () => {
      const body = (await (await app.request('/stats?firstTry=1', {}, env)).json()) as {
        stats: {
          attempts: { total: number; today: number; thisWeek: number }
          streakDays: number
          timeMsToday: number
          accuracy7d: number | null
          bySection: Record<string, { attempts90d: number; firstTry90d: number }>
          weekly: Array<{ attempts: number }>
          attemptsDaily: Array<{ n: number }>
          onboardingCompletedAt?: string
        }
      }
      return body.stats
    }
    const stats = await read()
    expect(stats.attempts).toEqual({ total: 3, today: 3, thisWeek: 3 })
    expect(stats.streakDays).toBe(1)
    expect(stats.timeMsToday).toBe(3000)
    expect(stats.accuracy7d).toBeNull()
    expect(stats.bySection.ORD).toMatchObject({
      attemptsToday: 3,
      attempts7d: 0,
      correct7d: 0,
      attempts7to14d: 0,
      attempts90d: 0,
      avgTimeMs: null,
      lastAttemptedAt: null,
      firstTry90d: 0,
      firstTry7d: 0,
      estimateBasis: { authentic: 0, synthetic: 0 },
    })
    expect(stats.weekly.every((w: { attempts: number }) => w.attempts === 0)).toBe(true)
    expect(stats.attemptsDaily.at(-1)?.n).toBe(3)
    expect(stats.onboardingCompletedAt).toBeUndefined()
    expect(FITTED_KINDS.has('onboarding')).toBe(false)
    const endedAt = new Date(Math.floor(Date.now() / 1000) * 1000)
    await db.update(sessions).set({ endedAt }).where(eq(sessions.id, session.id))
    expect((await read()).onboardingCompletedAt).toBe(endedAt.toISOString())
    const other = appFor('another_student')
    const unrelated = (await (
      await other.app.request('/stats?firstTry=1', {}, other.env)
    ).json()) as { stats: { onboardingCompletedAt?: string } }
    expect(unrelated.stats.onboardingCompletedAt).toBeUndefined()
    const exposure = await getExposure('user_first')
    expect(exposure.body.exposure[qids[0]].n).toBe(1)
    // A later ordinary retry is effort/assessment, never an unseen first try.
    await seedAttempt('user_first', qids[0], new Date(Date.now() + 1000))
    const retried = await read()
    expect(retried.bySection.ORD.attempts90d).toBe(1)
    expect(retried.bySection.ORD.firstTry90d).toBe(0)
  })
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

describe('PATCH /api/me/prefs — targetSittingId', () => {
  it('persists the chosen sitting for exam-aware spacing, even when another exam is sooner', async () => {
    const { app, env } = appFor('user_sitting')
    const patch = await app.request(
      '/prefs',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetSittingId: 'var-2027' }),
      },
      env,
    )
    expect(patch.status).toBe(200)
    expect(await patch.json()).toMatchObject({ prefs: { targetSittingId: 'var-2027' } })

    const read = await app.request('/prefs', {}, env)
    expect(read.status).toBe(200)
    const body = (await read.json()) as { prefs: { targetSittingId: string | null } }
    expect(body.prefs.targetSittingId).toBe('var-2027')
    const now = new Date(2026, 8, 1)
    expect(examFor(null, now)).toEqual(new Date(2026, 9, 18))
    expect(examFor(body.prefs.targetSittingId, now)).toEqual(new Date(2027, 3, 10))
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

// hpf-bz6f.4: the honest prognosis counts each question's FIRST TRY only — not
// a retry, not a Repetera replay, and a changed answer in a mock once.
// GET /stats?firstTry=1 adds those aggregates per section. The default body
// stays exactly as it was: assessmentGolden.test.ts pins it whole.
describe('GET /api/me/stats?firstTry=1 — first tries only', () => {
  const NOW = new Date('2026-10-08T12:00:00Z')
  const MINUTE = 60_000
  const DAY = 24 * 60 * MINUTE
  /** `days` before NOW, then `minutes` later. */
  const ago = (days: number, minutes = 0) => new Date(NOW.getTime() - days * DAY + minutes * MINUTE)
  const ORD = ['var-2026-verb1-ORD-001', 'var-2026-verb1-ORD-002', 'host-2025-verb2-ORD-003']
  const XYZ = ['var-2026-kvant1-XYZ-001', 'var-2022-1-kvant1-XYZ-002']
  const KVA = ['host-2024-kvant1-KVA-013', 'host-2024-kvant2-KVA-014']
  const NOG = 'var-2025-kvant2-NOG-023'
  const FIRST_TRY_KEYS = [
    'firstTry7d',
    'firstTryCorrect7d',
    'firstTry7to14d',
    'firstTryCorrect7to14d',
    'firstTry90d',
    'firstTryCorrect90d',
  ]

  type StatsBody = { bySection: Record<string, Record<string, unknown>> } & Record<string, unknown>

  async function userId(): Promise<number> {
    const db = getDb(d1 as unknown as D1Database)
    const [user] = await db
      .insert(users)
      .values({ clerkUserId: 'user_ft' })
      .onConflictDoUpdate({ target: users.clerkUserId, set: { clerkUserId: 'user_ft' } })
      .returning()
    return user.id
  }

  async function session(kind: string): Promise<number> {
    const db = getDb(d1 as unknown as D1Database)
    const [row] = await db
      .insert(sessions)
      .values({ userId: await userId(), kind, endedAt: NOW })
      .returning()
    return row.id
  }

  async function answer(
    sessionId: number,
    questionId: string,
    correct: boolean,
    createdAt: Date,
    source?: AttemptSource,
  ) {
    const db = getDb(d1 as unknown as D1Database)
    const provenance = classifyAttempt(questionId)
    await db.insert(attempts).values({
      userId: await userId(),
      sessionId,
      questionId,
      correct,
      createdAt,
      source: source ?? provenance.source,
      itemRevision: provenance.itemRevision,
    })
  }

  async function stats(path = '/stats?firstTry=1'): Promise<StatsBody> {
    const { app, env } = appFor('user_ft')
    const res = await app.request(path, {}, env)
    expect(res.status).toBe(200)
    return ((await res.json()) as { stats: StatsBody }).stats
  }

  function withoutFirstTry(s: StatsBody): StatsBody {
    const bySection = Object.fromEntries(
      Object.entries(s.bySection).map(([section, agg]) => [
        section,
        Object.fromEntries(Object.entries(agg).filter(([key]) => !FIRST_TRY_KEYS.includes(key))),
      ]),
    )
    return { ...s, bySection }
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('adds the first-try fields only when asked, and changes nothing else', async () => {
    const drill = await session('drill')
    await answer(drill, ORD[0], false, ago(10))
    await answer(drill, ORD[0], true, ago(3))
    const plain = await stats('/stats')
    const honest = await stats()
    for (const section of Object.values(plain.bySection)) {
      for (const key of FIRST_TRY_KEYS) expect(section).not.toHaveProperty(key)
    }
    for (const section of Object.values(honest.bySection)) {
      for (const key of FIRST_TRY_KEYS) expect(section).toHaveProperty(key)
    }
    // Every existing number means what it meant: opting in only adds.
    expect(withoutFirstTry(honest)).toEqual(plain)
    expect(honest.bySection.ORD).toMatchObject({ firstTry90d: 1, firstTryCorrect90d: 0 })
  })

  it('a retry is not a first try', async () => {
    const first = await session('drill')
    const later = await session('drill')
    await answer(first, ORD[0], false, ago(10))
    await answer(later, ORD[0], true, ago(3))
    await answer(later, ORD[1], true, ago(2))
    // The legacy LAS spelling names the same bank question as its LÄS qid.
    await answer(first, 'var-2026-verb1-LAS-011', false, ago(30))
    await answer(later, 'var-2026-verb1-LÄS-011', true, ago(1))
    const s = await stats()
    expect(s.bySection.ORD).toMatchObject({
      // Every attempt, as before.
      attempts7d: 2,
      correct7d: 2,
      attempts7to14d: 1,
      correct7to14d: 0,
      attempts90d: 3,
      correct90d: 2,
      // First tries: ORD-001 wrong 10 days ago, ORD-002 right 2 days ago.
      firstTry7d: 1,
      firstTryCorrect7d: 1,
      firstTry7to14d: 1,
      firstTryCorrect7to14d: 0,
      firstTry90d: 2,
      firstTryCorrect90d: 1,
    })
    expect(s.bySection.LÄS).toMatchObject({
      attempts90d: 2,
      correct90d: 1,
      firstTry7d: 0,
      firstTry90d: 1,
      firstTryCorrect90d: 0,
    })
  })

  it('a Repetera (adaptive_review) answer is never a first try', async () => {
    const drill = await session('drill')
    const repetera = await session('adaptive_review')
    await answer(drill, KVA[0], false, ago(5))
    await answer(repetera, KVA[0], true, ago(1))
    // A question first met in Repetera (its original answer pruned) has no
    // first try at all: the drill answer after it is a retry.
    await answer(repetera, KVA[1], true, ago(4))
    await answer(drill, KVA[1], true, ago(2))
    const s = await stats()
    expect(s.bySection.KVA).toMatchObject({
      attempts7d: 4,
      correct7d: 3,
      firstTry7d: 1,
      firstTryCorrect7d: 0,
      firstTry90d: 1,
      firstTryCorrect90d: 0,
    })
  })

  it('a changed answer in a mock counts once, as its last pick', async () => {
    const mock = await session('mock')
    await answer(mock, XYZ[0], false, ago(2))
    await answer(mock, XYZ[0], true, ago(2, 1))
    await answer(mock, XYZ[1], true, ago(2, 2))
    await answer(mock, XYZ[1], false, ago(2, 3))
    const drill = await session('drill')
    // A later drill answer on a mock question is a retry.
    await answer(drill, XYZ[0], false, ago(1))
    // Outside a mock the first answer stands: a second pass is a retry.
    await answer(drill, NOG, false, ago(1))
    await answer(drill, NOG, true, ago(1, 1))
    const s = await stats()
    expect(s.bySection.XYZ).toMatchObject({
      attempts90d: 5,
      correct90d: 2,
      firstTry7d: 2,
      firstTryCorrect7d: 1,
      firstTry90d: 2,
      firstTryCorrect90d: 1,
    })
    expect(s.bySection.NOG).toMatchObject({
      attempts90d: 2,
      correct90d: 1,
      firstTry90d: 1,
      firstTryCorrect90d: 0,
    })
  })

  it('the 90-day edge: a question first answered before the window has no first try in it', async () => {
    const drill = await session('drill')
    await answer(drill, ORD[0], true, ago(95))
    await answer(drill, ORD[0], false, ago(10))
    await answer(drill, ORD[1], true, ago(89))
    const s = await stats()
    expect(s.bySection.ORD).toMatchObject({
      attempts7to14d: 1,
      attempts90d: 2,
      correct90d: 1,
      firstTry7to14d: 0,
      firstTry90d: 1,
      firstTryCorrect90d: 1,
    })
  })

  it('an attempt whose session row is gone counts as an ordinary answer', async () => {
    const uid = await userId()
    // Only a database without the foreign key can hold one; the LEFT JOIN keeps it.
    await d1.exec('PRAGMA foreign_keys = OFF')
    const db = getDb(d1 as unknown as D1Database)
    await db.insert(attempts).values({
      userId: uid,
      sessionId: 987_654,
      questionId: ORD[2],
      correct: true,
      createdAt: ago(1),
      ...classifyAttempt(ORD[2]),
    })
    const s = await stats()
    expect(s.bySection.ORD).toMatchObject({
      attempts90d: 1,
      firstTry7d: 1,
      firstTryCorrect7d: 1,
      firstTry90d: 1,
      firstTryCorrect90d: 1,
    })
  })

  it('an unknown answer is never assessed, but the question was still seen', async () => {
    const drill = await session('drill')
    await answer(drill, ORD[0], true, ago(6), 'unknown')
    await answer(drill, ORD[0], true, ago(2))
    const s = await stats()
    expect(s.bySection.ORD).toMatchObject({ attempts90d: 1, firstTry90d: 0, firstTry7d: 0 })
  })
})

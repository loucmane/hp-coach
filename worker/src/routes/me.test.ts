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

import registry from '../../data/p5-qid-registry.json'
import { getDb } from '../db/client'
import { attempts, sessions, users } from '../db/schema'
import { classifyAttemptSource } from '../lib/provenance'
import { extractSection, SECTIONS } from '../lib/section'
import { formatDayUTC, startOfUtcDay } from '../lib/stats'
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

// P5 infold PR 3 (docs/p5-infold-design.md §E). Synthetic (P5) and unknown
// attempts may move practice EFFORT — counts, minutes, completions, streak,
// the consistency heatmap — and P5 accuracy is reported apart in
// `practiceSynthetic`. Every authentic assessment input stays byte-identical:
// the bySection score/trend/confidence/recency/time fields, the weekly score
// trend and accuracy7d.
describe('GET /api/me/stats — provenance', () => {
  // A frozen clock: both reads of a trial see the same `now`, so window edges
  // cannot move between them.
  const NOW = Date.UTC(2026, 9, 7, 15, 30, 0)
  const HOUR = 60 * 60_000
  const DAY = 24 * HOUR

  type SectionStats = {
    attempts7d: number
    correct7d: number
    attempts7to14d: number
    correct7to14d: number
    attempts90d: number
    correct90d: number
    avgTimeMs: number | null
    lastAttemptedAt: number | null
    attemptsToday: number
  }
  type Stats = {
    attempts: { total: number; today: number; thisWeek: number }
    drills: { total: number; thisWeek: number }
    mistakes: { active: number; due: number; resolved: number }
    accuracy7d: number | null
    streakDays: number
    timeMsToday: number
    bySection: Record<string, SectionStats>
    weekly: Array<{ weekStart: number; attempts: number; correct: number }>
    attemptsDaily: Array<{ date: string; n: number; verbal: number; quant: number }>
    practiceSynthetic: {
      attempts90d: number
      correct90d: number
      attempts7d: number
      correct7d: number
    }
  }
  type Seeded = { qid: string; ts: number; correct: boolean; timeMs: number | null }

  // Authentic qids across all eight sections and several sittings.
  const AUTHENTIC = [
    'var-2024-verb1-ORD-001',
    'var-2024-verb1-ORD-007',
    'var-2024-verb1-LÄS-011',
    'var-2022-1-verb2-LÄS-015',
    'var-2024-verb1-MEK-021',
    'var-2024-verb2-ELF-031',
    'host-ver1-2019-verb2-ELF-038',
    'var-2024-kvant1-XYZ-001',
    'var-2024-kvant1-KVA-013',
    'host-2025-kvant1-NOG-023',
    'var-2024-kvant2-DTK-029',
  ]
  const SYNTHETIC = registry.units.flatMap((u) => u.qids)
  // Unknown ids, most with a section the stats can parse: a revoked P5
  // revision, a retired unit, an unknown sitting, an old fixture shape.
  const UNKNOWN = [
    'p5-las-b7-002-r1-LÄS-001',
    'p5-elf-b14-002-r1-ELF-001',
    'var-2099-verb1-ORD-001',
    'var-2024-XYZ-001',
    'q1',
  ]

  /** mulberry32 — a tiny seeded PRNG so every trial is reproducible. */
  function rng(seed: number): () => number {
    let a = seed >>> 0
    return () => {
      a = (a + 0x6d2b79f5) >>> 0
      let t = a
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  /** A timestamp in one of the windows the stats read: today, this week,
   *  last week, the rest of the 90 days, or older. */
  function timestamp(r: () => number): number {
    const todayStart = startOfUtcDay(new Date(NOW)).getTime()
    switch (Math.floor(r() * 5)) {
      case 0:
        return todayStart + Math.floor(r() * (NOW - todayStart))
      case 1:
        return NOW - HOUR - Math.floor(r() * (6 * DAY))
      case 2:
        return NOW - 7 * DAY - HOUR - Math.floor(r() * (6 * DAY))
      case 3:
        return NOW - 14 * DAY - HOUR - Math.floor(r() * (75 * DAY))
      default:
        return NOW - 91 * DAY - Math.floor(r() * (30 * DAY))
    }
  }

  function draw(r: () => number, pool: string[], n: number): Seeded[] {
    return Array.from({ length: n }, () => ({
      qid: pool[Math.floor(r() * pool.length)],
      ts: timestamp(r),
      correct: r() < 0.6,
      timeMs: r() < 0.15 ? null : 5_000 + Math.floor(r() * 120_000),
    }))
  }

  /** Insert attempts the way POST /api/attempts stores them: the source is
   *  classified from the qid on the server. */
  async function seed(rows: Seeded[]) {
    const db = getDb(d1 as unknown as D1Database)
    const [user] = await db
      .insert(users)
      .values({ clerkUserId: 'user_a' })
      .onConflictDoUpdate({ target: users.clerkUserId, set: { clerkUserId: 'user_a' } })
      .returning()
    const [session] = await db
      .insert(sessions)
      .values({ userId: user.id, kind: 'drill', endedAt: new Date(NOW) })
      .returning()
    for (const row of rows) {
      await db.insert(attempts).values({
        userId: user.id,
        sessionId: session.id,
        questionId: row.qid,
        correct: row.correct,
        timeTakenMs: row.timeMs,
        createdAt: new Date(row.ts),
        source: classifyAttemptSource(row.qid),
      })
    }
  }

  async function readStats(): Promise<Stats> {
    const { app, env } = appFor('user_a')
    const res = await app.request('/stats', {}, env)
    expect(res.status).toBe(200)
    return ((await res.json()) as { stats: Stats }).stats
  }

  /** Everything an authentic assessment number is computed from. */
  function assessment(s: Stats) {
    const bySection = Object.fromEntries(
      Object.entries(s.bySection).map(([section, { attemptsToday: _effort, ...inputs }]) => [
        section,
        inputs,
      ]),
    )
    return { accuracy7d: s.accuracy7d, weekly: s.weekly, bySection }
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('reports zero P5 practice for a user with only authentic answers', async () => {
    await seed(draw(rng(7), AUTHENTIC, 12))
    expect((await readStats()).practiceSynthetic).toEqual({
      attempts90d: 0,
      correct90d: 0,
      attempts7d: 0,
      correct7d: 0,
    })
  })

  for (const trial of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
    it(`trial ${trial}: injected synthetic and unknown answers move effort only`, async () => {
      const r = rng(trial)
      const authentic = draw(r, AUTHENTIC, 20 + Math.floor(r() * 30))
      const synthetic = draw(r, SYNTHETIC, 5 + Math.floor(r() * 25))
      const unknown = draw(r, UNKNOWN, 1 + Math.floor(r() * 10))
      for (const row of authentic) expect(classifyAttemptSource(row.qid)).toBe('authentic')
      for (const row of synthetic) expect(classifyAttemptSource(row.qid)).toBe('synthetic')
      for (const row of unknown) expect(classifyAttemptSource(row.qid)).toBe('unknown')

      await seed(authentic)
      const before = await readStats()
      const injected = [...synthetic, ...unknown]
      // Interleave the injected rows by shuffling them in as later inserts.
      await seed(injected.sort(() => r() - 0.5))
      const after = await readStats()

      // Byte-identical authentic assessment inputs.
      expect(JSON.stringify(assessment(after))).toBe(JSON.stringify(assessment(before)))
      expect(after.mistakes).toEqual(before.mistakes)

      // Effort moves by exactly the injected practice.
      const todayStart = startOfUtcDay(new Date(NOW)).getTime()
      const weekStart = NOW - 7 * DAY
      const today = injected.filter((x) => x.ts >= todayStart)
      expect(after.attempts.today - before.attempts.today).toBe(today.length)
      expect(after.attempts.thisWeek - before.attempts.thisWeek).toBe(
        injected.filter((x) => x.ts >= weekStart).length,
      )
      expect(after.timeMsToday - before.timeMsToday).toBe(
        today.reduce((sum, x) => sum + (x.timeMs ?? 0), 0),
      )
      for (const section of SECTIONS) {
        expect(
          after.bySection[section].attemptsToday - before.bySection[section].attemptsToday,
        ).toBe(today.filter((x) => extractSection(x.qid) === section).length)
      }
      const heatDays = new Set(
        Array.from({ length: 84 }, (_, i) => formatDayUTC(new Date(NOW - i * DAY))),
      )
      const heatTotal = (s: Stats) => s.attemptsDaily.reduce((sum, d) => sum + d.n, 0)
      expect(heatTotal(after) - heatTotal(before)).toBe(
        injected.filter(
          (x) =>
            extractSection(x.qid) != null &&
            NOW - x.ts < 84 * DAY &&
            heatDays.has(formatDayUTC(new Date(x.ts))),
        ).length,
      )
      expect(after.streakDays).toBeGreaterThanOrEqual(before.streakDays)

      // P5 accuracy is reported apart, and only for registered P5 answers.
      const p90 = synthetic.filter((x) => x.ts >= NOW - 90 * DAY)
      const p7 = synthetic.filter((x) => x.ts >= weekStart)
      expect(before.practiceSynthetic).toEqual({
        attempts90d: 0,
        correct90d: 0,
        attempts7d: 0,
        correct7d: 0,
      })
      expect(after.practiceSynthetic).toEqual({
        attempts90d: p90.length,
        correct90d: p90.filter((x) => x.correct).length,
        attempts7d: p7.length,
        correct7d: p7.filter((x) => x.correct).length,
      })
    })
  }

  it('a section score never sees P5 or unknown answers, even when they are all there is', async () => {
    const lasP5 = SYNTHETIC.find((qid) => qid.includes('-LÄS-')) as string
    await seed([
      { qid: lasP5, ts: NOW - HOUR, correct: true, timeMs: 30_000 },
      { qid: 'p5-las-b7-002-r1-LÄS-001', ts: NOW - HOUR, correct: true, timeMs: 30_000 },
    ])
    const stats = await readStats()
    expect(stats.bySection.LÄS).toEqual({
      attempts7d: 0,
      correct7d: 0,
      attempts7to14d: 0,
      correct7to14d: 0,
      attempts90d: 0,
      correct90d: 0,
      avgTimeMs: null,
      lastAttemptedAt: null,
      attemptsToday: 2,
    })
    expect(stats.accuracy7d).toBeNull()
    expect(stats.weekly.every((w) => w.attempts === 0)).toBe(true)
    expect(stats.attempts.today).toBe(2)
    expect(stats.timeMsToday).toBe(60_000)
    expect(stats.practiceSynthetic).toEqual({
      attempts90d: 1,
      correct90d: 1,
      attempts7d: 1,
      correct7d: 1,
    })
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

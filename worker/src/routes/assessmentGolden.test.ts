// Regression guard for P5 infold PR 3 (bead hpf-94i5, docs/p5-infold-design.md
// Amendment 1 E): a user without P5 answers must get exactly the assessment
// numbers the pre-provenance worker gave them.
//
// The snapshot file beside this test was recorded against the unmodified
// implementation (origin/main 6adb990, before attempts had a source) and must
// never be re-recorded to absorb a change: a diff here IS the regression.
//
// The history goes in through the real POST /api/attempts route, so each row
// carries whatever source the route derives, and the real Elo fit runs over it
// in two incremental runs. The fields P5 provenance adds (estimateBasis,
// uncalibrated, and the new columns, which the table reads leave out) are
// stripped before the comparison; their authentic-only values are pinned by
// the provenance tests.

import { asc } from 'drizzle-orm'
import { Hono } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getDb } from '../db/client'
import { itemStats, sessions, userAbility, users } from '../db/schema'
import { runFit } from '../lib/fit'
import { SECTIONS } from '../lib/section'
import { makeTestD1, type ShimD1 } from '../lib/testD1'
import type { Env, Vars } from '../types'
import { attemptsRoute } from './attempts'
import { itemStatsRoute } from './fit'
import { meRoute } from './me'

const NOW = new Date('2026-10-08T12:00:00Z')
const DAY_MS = 24 * 60 * 60_000
const KINDS = ['drill', 'drill', 'drill', 'adaptive_review', 'mock', 'mock_diagnostic', 'lesson']
const USERS = ['golden_a', 'golden_b']
// Authentic qids across all eight sections, including the legacy LAS spelling.
const QIDS = [
  'var-2026-verb1-ORD-001',
  'var-2026-verb1-ORD-002',
  'host-2025-verb2-ORD-003',
  'var-2026-verb1-LÄS-011',
  'var-2026-verb1-LÄS-012',
  'var-2024-verb1-LAS-013',
  'host-2025-verb2-MEK-021',
  'host-2025-verb2-MEK-022',
  'var-2026-verb2-ELF-031',
  'var-2026-verb2-ELF-032',
  'host-ver1-2019-verb1-ELF-033',
  'var-2026-kvant1-XYZ-001',
  'var-2022-1-kvant1-XYZ-002',
  'host-2024-kvant1-KVA-013',
  'host-2024-kvant2-KVA-014',
  'var-2025-kvant2-NOG-023',
  'host-2025-kvant2-DTK-030',
  'host-2025-kvant2-DTK-031',
]
const PROVENANCE_KEYS = new Set(['estimateBasis', 'uncalibrated'])

let d1: ShimD1

function db() {
  return getDb(d1 as unknown as D1Database)
}

function appFor(asUser: string) {
  const env = { DB: d1 } as unknown as Env
  const app = new Hono<{ Bindings: Env; Variables: Vars }>()
    .use('*', async (c, next) => {
      c.set('userId', asUser)
      await next()
    })
    .route('/attempts', attemptsRoute)
    .route('/me', meRoute)
    .route('/item-stats', itemStatsRoute)
  return { app, env }
}

async function getJson(asUser: string, path: string): Promise<unknown> {
  const { app, env } = appFor(asUser)
  const res = await app.request(path, {}, env)
  expect(res.status).toBe(200)
  return res.json()
}

/** mulberry32: a small seeded PRNG, so the history is fixed. */
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

type Planned = {
  user: string
  kind: string
  qid: string
  correct: boolean
  timeTakenMs?: number
  createdAt: Date
}

/** 160 attempts over the last 100 days, oldest first (ids stay chronological). */
function history(): Planned[] {
  const r = rng(94)
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)]
  const out: Planned[] = []
  for (let i = 0; i < 160; i++) {
    const daysAgo = r() * 100
    out.push({
      user: pick(USERS),
      kind: pick(KINDS),
      qid: pick(QIDS),
      correct: r() < 0.6,
      timeTakenMs: r() < 0.15 ? undefined : 5_000 + Math.floor(r() * 115_000),
      createdAt: new Date(NOW.getTime() - Math.round(daysAgo * DAY_MS)),
    })
  }
  return out.sort((x, y) => x.createdAt.getTime() - y.createdAt.getTime())
}

async function seedHistory(): Promise<void> {
  const sessionIds = new Map<string, number>()
  for (const user of USERS) {
    const [row] = await db().insert(users).values({ clerkUserId: user }).returning()
    for (const kind of new Set(KINDS)) {
      const [s] = await db().insert(sessions).values({ userId: row.id, kind }).returning()
      sessionIds.set(`${user}:${kind}`, s.id)
    }
  }
  const planned = history()
  for (const [i, a] of planned.entries()) {
    vi.setSystemTime(a.createdAt)
    const { app, env } = appFor(a.user)
    const res = await app.request(
      '/attempts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIds.get(`${a.user}:${a.kind}`),
          questionId: a.qid,
          selectedAnswer: a.correct ? 'A' : 'B',
          correct: a.correct,
          ...(a.timeTakenMs === undefined ? {} : { timeTakenMs: a.timeTakenMs }),
        }),
      },
      env,
    )
    expect(res.status).toBe(201)
    // Two incremental fits, as the nightly cron would split the history.
    if (i === 99) {
      vi.setSystemTime(NOW)
      await runFit(db())
    }
  }
  vi.setSystemTime(NOW)
  await runFit(db())
}

function stripProvenance(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripProvenance)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !PROVENANCE_KEYS.has(key))
        .map(([key, v]) => [key, stripProvenance(v)]),
    )
  }
  return value
}

beforeEach(() => {
  d1 = makeTestD1()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('authentic-only assessment — unchanged by P5 provenance', () => {
  it('GET /api/me/stats', async () => {
    await seedHistory()
    for (const user of USERS) {
      expect(stripProvenance(await getJson(user, '/me/stats'))).toMatchSnapshot(user)
    }
  })

  it('GET /api/me/ability and GET /api/item-stats', async () => {
    await seedHistory()
    for (const user of USERS) {
      expect(stripProvenance(await getJson(user, '/me/ability'))).toMatchSnapshot(user)
    }
    for (const section of SECTIONS) {
      const body = await getJson(USERS[0], `/item-stats?section=${encodeURIComponent(section)}`)
      expect(stripProvenance(body)).toMatchSnapshot(section)
    }
  })

  it('the item_stats and user_ability rating tables', async () => {
    await seedHistory()
    const items = await db()
      .select({
        questionId: itemStats.questionId,
        difficulty: itemStats.difficulty,
        attempts: itemStats.attempts,
      })
      .from(itemStats)
      .orderBy(asc(itemStats.questionId))
    const abilities = await db()
      .select({
        userId: userAbility.userId,
        section: userAbility.section,
        ability: userAbility.ability,
        attempts: userAbility.attempts,
      })
      .from(userAbility)
      .orderBy(asc(userAbility.userId), asc(userAbility.section))
    expect(items.length).toBeGreaterThan(10)
    expect(abilities.length).toBeGreaterThan(8)
    expect({ items, abilities }).toMatchSnapshot()
  })
})

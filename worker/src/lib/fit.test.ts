// Unit + integration tests for the learned item-difficulty fit (PL-L.1).
//
// Two layers:
//   1. Pure-math tests on expectedScore / kFactor / clampRating — symmetry,
//      K decay, clamp band.
//   2. runFit against a REAL in-memory D1 (the migration-built shim): the
//      watermark idempotency contract, chronological-order sensitivity,
//      per-user isolation, and the clamp holding through many updates.

import { asc, eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'

import registry from '../../data/p5-qid-registry.json'
import { getDb } from '../db/client'
import { type AttemptSource, attempts, itemStats, sessions, userAbility, users } from '../db/schema'
import {
  CLAMP,
  clampRating,
  expectedScore,
  flooredExpectedScore,
  GUESS_FLOOR,
  K_EARLY,
  K_SETTLED,
  kFactor,
  REPLAY_ITEM_K_FACTOR,
  runFit,
} from './fit'
import { classifyAttemptSource } from './provenance'
import { makeTestD1, type ShimD1 } from './testD1'

let d1: ShimD1

beforeEach(() => {
  d1 = makeTestD1()
})

// ── seed helpers ──────────────────────────────────────────────────────

async function ensureUser(clerkUserId: string): Promise<number> {
  const db = getDb(d1 as unknown as D1Database)
  let [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId))
  if (!user) [user] = await db.insert(users).values({ clerkUserId }).returning()
  return user.id
}

/** One session per (user, kind) so attempts have a valid FK and a readable
 *  session kind. Cached by `${userId}:${kind}`. */
const sessionByUser = new Map<string, number>()
async function ensureSession(userId: number, kind: string): Promise<number> {
  const key = `${userId}:${kind}`
  const cached = sessionByUser.get(key)
  if (cached) return cached
  const db = getDb(d1 as unknown as D1Database)
  const [s] = await db.insert(sessions).values({ userId, kind }).returning()
  sessionByUser.set(key, s.id)
  return s.id
}

/** Insert one attempt (default kind 'drill'). Returns its row id. Insertion
 *  order == id order == the chronological order runFit folds them in. The
 *  source is classified from the qid, as POST /api/attempts stores it,
 *  unless a test pins it. */
async function seedAttempt(
  clerkUserId: string,
  questionId: string,
  correct: boolean,
  kind = 'drill',
  source: AttemptSource = classifyAttemptSource(questionId),
): Promise<number> {
  const db = getDb(d1 as unknown as D1Database)
  const userId = await ensureUser(clerkUserId)
  const sessionId = await ensureSession(userId, kind)
  const [row] = await db
    .insert(attempts)
    .values({ userId, sessionId, questionId, correct, source })
    .returning()
  return row.id
}

/** Both rating tables, ordered, as plain rows — for byte-identity checks. */
async function ratings() {
  const db = getDb(d1 as unknown as D1Database)
  const items = await db
    .select({
      questionId: itemStats.questionId,
      difficulty: itemStats.difficulty,
      attempts: itemStats.attempts,
    })
    .from(itemStats)
    .orderBy(asc(itemStats.questionId))
  const abilities = await db
    .select({
      userId: userAbility.userId,
      section: userAbility.section,
      ability: userAbility.ability,
      attempts: userAbility.attempts,
    })
    .from(userAbility)
    .orderBy(asc(userAbility.userId), asc(userAbility.section))
  return { items, abilities }
}

async function itemDifficulty(
  qid: string,
): Promise<{ difficulty: number; attempts: number } | null> {
  const db = getDb(d1 as unknown as D1Database)
  const [row] = await db.select().from(itemStats).where(eq(itemStats.questionId, qid)).limit(1)
  return row ? { difficulty: row.difficulty, attempts: row.attempts } : null
}

async function ability(
  clerkUserId: string,
  section: string,
): Promise<{ ability: number; attempts: number } | null> {
  const db = getDb(d1 as unknown as D1Database)
  const userId = await ensureUser(clerkUserId)
  const [row] = await db
    .select()
    .from(userAbility)
    .where(eq(userAbility.userId, userId))
    .limit(50)
    .then((rows) => rows.filter((r) => r.section === section))
  return row ? { ability: row.ability, attempts: row.attempts } : null
}

beforeEach(() => {
  sessionByUser.clear()
})

// ── 1. pure math ──────────────────────────────────────────────────────

describe('expectedScore', () => {
  it('is exactly 0.5 for an equal matchup', () => {
    expect(expectedScore(0, 0)).toBe(0.5)
    expect(expectedScore(300, 300)).toBe(0.5)
  })

  it('is symmetric: E(d,a) + E(a,d) === 1', () => {
    const pairs: Array<[number, number]> = [
      [100, -100],
      [400, 0],
      [-250, 375],
    ]
    for (const [d, a] of pairs) {
      expect(expectedScore(d, a) + expectedScore(a, d)).toBeCloseTo(1, 12)
    }
  })

  it('a 400-point ability edge gives ~10:1 odds (~0.909)', () => {
    // ability 400 above difficulty → high win prob.
    expect(expectedScore(0, 400)).toBeCloseTo(10 / 11, 6)
    // difficulty 400 above ability → low win prob.
    expect(expectedScore(400, 0)).toBeCloseTo(1 / 11, 6)
  })

  it('rises monotonically with ability', () => {
    const a = expectedScore(0, -200)
    const b = expectedScore(0, 0)
    const c = expectedScore(0, 200)
    expect(a).toBeLessThan(b)
    expect(b).toBeLessThan(c)
  })
})

describe('flooredExpectedScore — guess floor', () => {
  it('floors an equal matchup at g + (1-g)*0.5', () => {
    expect(flooredExpectedScore(0, 0)).toBeCloseTo(GUESS_FLOOR + (1 - GUESS_FLOOR) * 0.5, 12)
  })

  it('never drops below the guess floor even for a hopeless matchup', () => {
    // Very hard item vs very weak user → raw ≈ 0, but floored ≥ g.
    const floored = flooredExpectedScore(800, -800)
    expect(floored).toBeGreaterThanOrEqual(GUESS_FLOOR)
    expect(floored).toBeLessThan(GUESS_FLOOR + 0.01)
  })

  it('is always ≥ the raw logistic (the floor only ever lifts expected)', () => {
    for (const [d, a] of [
      [0, 0],
      [300, -300],
      [-300, 300],
      [500, 100],
    ] as Array<[number, number]>) {
      expect(flooredExpectedScore(d, a)).toBeGreaterThanOrEqual(expectedScore(d, a))
    }
  })

  it('a weak user beating a hard item moves ratings LESS than raw Elo would', () => {
    // Weak solver (a = -300) vs hard item (d = +300). The surprise of a
    // correct answer is (actual - expected); flooring RAISES expected, so
    // the win earns a SMALLER move than raw Elo — some of it could be luck.
    const d = 300
    const a = -300
    const raw = expectedScore(d, a)
    const floored = flooredExpectedScore(d, a)
    const K = 32
    const rawWin = K * (1 - raw)
    const flooredWin = K * (1 - floored)
    expect(flooredWin).toBeLessThan(rawWin)
    // ...and conversely a MISS on such a matchup bites harder than raw.
    const rawMiss = K * (0 - raw)
    const flooredMiss = K * (0 - floored)
    expect(flooredMiss).toBeLessThan(rawMiss) // more negative
  })
})

describe('kFactor decay', () => {
  it('is K_EARLY for the first 30 attempts, K_SETTLED after', () => {
    expect(kFactor(0)).toBe(K_EARLY)
    expect(kFactor(29)).toBe(K_EARLY)
    expect(kFactor(30)).toBe(K_SETTLED)
    expect(kFactor(31)).toBe(K_SETTLED)
    expect(kFactor(1000)).toBe(K_SETTLED)
  })
})

describe('clampRating', () => {
  it('pins values into the ±CLAMP band', () => {
    expect(clampRating(0)).toBe(0)
    expect(clampRating(CLAMP + 500)).toBe(CLAMP)
    expect(clampRating(-CLAMP - 500)).toBe(-CLAMP)
    expect(clampRating(CLAMP)).toBe(CLAMP)
  })
})

// ── 2. runFit against real D1 ─────────────────────────────────────────

describe('runFit — single attempt', () => {
  it('moves ability up and difficulty down on a correct answer', async () => {
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', true)
    const res = await runFit(getDb(d1 as unknown as D1Database))
    expect(res.processed).toBe(1)

    // First correct answer from 0/0: base = 0.5, floored expected =
    // 0.2 + 0.8*0.5 = 0.6, K = 32.
    // ability += 32 * (1 - 0.6) = +12.8; difficulty += 32 * (0.6 - 1) = -12.8.
    expect((await ability('u1', 'ORD'))?.ability).toBeCloseTo(12.8, 6)
    expect((await itemDifficulty('var-2026-verb1-ORD-001'))?.difficulty).toBeCloseTo(-12.8, 6)
  })

  it('moves ability down and difficulty up on a wrong answer', async () => {
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', false)
    await runFit(getDb(d1 as unknown as D1Database))
    // floored expected = 0.6. ability += 32*(0 - 0.6) = -19.2;
    // difficulty += 32*(0.6 - 0) = +19.2. The miss bites harder than the
    // win rewarded — the guess-floor asymmetry.
    expect((await ability('u1', 'ORD'))?.ability).toBeCloseTo(-19.2, 6)
    expect((await itemDifficulty('var-2026-verb1-ORD-001'))?.difficulty).toBeCloseTo(19.2, 6)
  })

  it('records the fitted attempt count on both poles', async () => {
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', true)
    await seedAttempt('u1', 'var-2026-verb1-ORD-002', false)
    await runFit(getDb(d1 as unknown as D1Database))
    // Two ORD attempts → ability.attempts = 2; each item seen once.
    expect((await ability('u1', 'ORD'))?.attempts).toBe(2)
    expect((await itemDifficulty('var-2026-verb1-ORD-001'))?.attempts).toBe(1)
    expect((await itemDifficulty('var-2026-verb1-ORD-002'))?.attempts).toBe(1)
  })
})

describe('runFit — watermark idempotency', () => {
  it('a second run with no new attempts changes nothing', async () => {
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', true)
    await seedAttempt('u1', 'var-2026-verb1-ORD-002', false)
    const first = await runFit(getDb(d1 as unknown as D1Database))
    const abilityAfterFirst = await ability('u1', 'ORD')

    const second = await runFit(getDb(d1 as unknown as D1Database))
    expect(second.processed).toBe(0)
    expect(second.watermark).toBe(first.watermark)
    // Ratings untouched by the no-op re-run.
    expect((await ability('u1', 'ORD'))?.ability).toBeCloseTo(abilityAfterFirst?.ability ?? NaN, 12)
    expect((await ability('u1', 'ORD'))?.attempts).toBe(abilityAfterFirst?.attempts)
  })

  it('processing the same attempts in two runs === processing them in one', async () => {
    // Run A: seed 3, fit, seed 2 more, fit again (incremental).
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', true)
    await seedAttempt('u1', 'var-2026-verb1-ORD-002', false)
    await seedAttempt('u1', 'var-2026-verb1-ORD-003', true)
    await runFit(getDb(d1 as unknown as D1Database))
    await seedAttempt('u1', 'var-2026-verb1-ORD-004', false)
    await seedAttempt('u1', 'var-2026-verb1-ORD-005', true)
    await runFit(getDb(d1 as unknown as D1Database))
    const incremental = await ability('u1', 'ORD')

    // Run B (fresh DB): seed all 5, fit once.
    d1 = makeTestD1()
    sessionByUser.clear()
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', true)
    await seedAttempt('u1', 'var-2026-verb1-ORD-002', false)
    await seedAttempt('u1', 'var-2026-verb1-ORD-003', true)
    await seedAttempt('u1', 'var-2026-verb1-ORD-004', false)
    await seedAttempt('u1', 'var-2026-verb1-ORD-005', true)
    await runFit(getDb(d1 as unknown as D1Database))
    const oneShot = await ability('u1', 'ORD')

    expect(incremental?.ability).toBeCloseTo(oneShot?.ability ?? NaN, 10)
    expect(incremental?.attempts).toBe(oneShot?.attempts)
  })

  it('only folds attempts newer than the watermark on an incremental run', async () => {
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', true)
    const first = await runFit(getDb(d1 as unknown as D1Database))
    await seedAttempt('u1', 'var-2026-verb1-ORD-002', false)
    const second = await runFit(getDb(d1 as unknown as D1Database))
    expect(second.processed).toBe(1)
    expect(second.watermark).toBeGreaterThan(first.watermark)
  })
})

describe('runFit — chronological ordering', () => {
  it('the fold is order-sensitive: reversing the sequence changes the result', async () => {
    // Sequence A: correct on a fresh item, then wrong on another.
    await seedAttempt('uA', 'var-2026-verb1-ORD-001', true)
    await seedAttempt('uA', 'var-2026-verb1-ORD-002', false)
    await runFit(getDb(d1 as unknown as D1Database))
    const abilityA = (await ability('uA', 'ORD'))?.ability

    // Sequence B (fresh DB): the SAME two outcomes, reversed order.
    d1 = makeTestD1()
    sessionByUser.clear()
    await seedAttempt('uB', 'var-2026-verb1-ORD-002', false)
    await seedAttempt('uB', 'var-2026-verb1-ORD-001', true)
    await runFit(getDb(d1 as unknown as D1Database))
    const abilityB = (await ability('uB', 'ORD'))?.ability

    // Different items each step means the running expected-score differs by
    // order, so the two folds land on different abilities.
    expect(abilityA).not.toBeCloseTo(abilityB ?? NaN, 4)
  })
})

describe('runFit — per-user isolation', () => {
  it('each user gets their own ability; items are shared globally', async () => {
    // u1 aces the item; u2 misses it.
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', true)
    await seedAttempt('u2', 'var-2026-verb1-ORD-001', false)
    await runFit(getDb(d1 as unknown as D1Database))

    const a1 = await ability('u1', 'ORD')
    const a2 = await ability('u2', 'ORD')
    expect(a1?.ability).toBeGreaterThan(0)
    expect(a2?.ability).toBeLessThan(0)
    expect(a1?.attempts).toBe(1)
    expect(a2?.attempts).toBe(1)

    // One shared item row, moved by BOTH attempts (attempts count = 2).
    const item = await itemDifficulty('var-2026-verb1-ORD-001')
    expect(item?.attempts).toBe(2)
  })

  it('ability is tracked per section, not pooled across sections', async () => {
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', true)
    await seedAttempt('u1', 'var-2026-kvant1-XYZ-001', false)
    await runFit(getDb(d1 as unknown as D1Database))
    expect((await ability('u1', 'ORD'))?.ability).toBeGreaterThan(0)
    expect((await ability('u1', 'XYZ'))?.ability).toBeLessThan(0)
  })
})

describe('runFit — clamp + skips', () => {
  it('a long wrong streak clamps difficulty at +CLAMP (never runs away)', async () => {
    // 200 distinct users all miss the same item → difficulty pushed up hard,
    // but pinned at the band edge.
    for (let i = 0; i < 200; i++) {
      await seedAttempt(`bad-${i}`, 'var-2026-verb1-ORD-001', false)
    }
    await runFit(getDb(d1 as unknown as D1Database))
    const item = await itemDifficulty('var-2026-verb1-ORD-001')
    expect(item?.difficulty).toBeLessThanOrEqual(CLAMP)
    expect(item?.difficulty).toBeGreaterThan(CLAMP - 1) // parked at the ceiling
  })

  it('skips attempts whose qid has no resolvable section (still advances watermark)', async () => {
    await seedAttempt('u1', 'not-a-real-qid', true)
    const res = await runFit(getDb(d1 as unknown as D1Database))
    // The row is consumed (watermark past it) but produced no rating rows.
    expect(res.processed).toBe(0)
    expect(res.watermark).toBeGreaterThan(0)
    expect(await ability('u1', 'ORD')).toBeNull()
  })
})

describe('runFit — session-kind weighting', () => {
  it('an adaptive_review attempt damps the ITEM update to K/4 but not the USER', async () => {
    // Same fresh 0/0 matchup, correct answer, via two different session
    // kinds and distinct users/items so they don't interact.
    await seedAttempt('uD', 'var-2026-verb1-ORD-100', true, 'drill')
    await seedAttempt('uR', 'var-2026-verb1-ORD-200', true, 'adaptive_review')
    await runFit(getDb(d1 as unknown as D1Database))

    const drillItem = (await itemDifficulty('var-2026-verb1-ORD-100'))?.difficulty ?? NaN
    const replayItem = (await itemDifficulty('var-2026-verb1-ORD-200'))?.difficulty ?? NaN
    // Drill item moved -12.8; replay item moved a QUARTER of that.
    expect(drillItem).toBeCloseTo(-12.8, 6)
    expect(replayItem).toBeCloseTo(-12.8 * REPLAY_ITEM_K_FACTOR, 6)

    // The user (ability) side is full weight in BOTH — recovery is real.
    expect((await ability('uD', 'ORD'))?.ability).toBeCloseTo(12.8, 6)
    expect((await ability('uR', 'ORD'))?.ability).toBeCloseTo(12.8, 6)
  })

  it('folds mock and mock_diagnostic attempts at full weight', async () => {
    await seedAttempt('um', 'var-2026-verb1-ORD-001', true, 'mock')
    await seedAttempt('umd', 'var-2026-verb1-ORD-002', false, 'mock_diagnostic')
    const res = await runFit(getDb(d1 as unknown as D1Database))
    expect(res.processed).toBe(2)
    expect((await ability('um', 'ORD'))?.ability).toBeCloseTo(12.8, 6)
    expect((await ability('umd', 'ORD'))?.ability).toBeCloseTo(-19.2, 6)
  })

  it('skips non-graded session kinds (e.g. lesson) entirely', async () => {
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', true, 'lesson')
    const res = await runFit(getDb(d1 as unknown as D1Database))
    expect(res.processed).toBe(0)
    expect(await ability('u1', 'ORD')).toBeNull()
    expect(await itemDifficulty('var-2026-verb1-ORD-001')).toBeNull()
    // ...but the watermark still advanced past the skipped row.
    expect(res.watermark).toBeGreaterThan(0)
  })
})

// P5 infold PR 3 (docs/p5-infold-design.md §E): only authentic attempts move
// item difficulty or user ability. Synthetic (P5) and unknown attempts are
// consumed — the watermark passes them so no run re-scans them — and fold
// into nothing.
describe('runFit — provenance', () => {
  const P5 = registry.units.flatMap((u) => u.qids)
  const LAS_P5 = P5.find((q) => q.includes('-LÄS-')) as string
  const ELF_P5 = P5.find((q) => q.includes('-ELF-')) as string
  const UNKNOWN = ['p5-las-b7-002-r1-LÄS-001', 'var-2099-verb2-ELF-031', 'not-a-real-qid']

  it('a synthetic or unknown attempt moves no rating, in any graded kind', async () => {
    for (const kind of ['drill', 'adaptive_review', 'mock', 'mock_diagnostic']) {
      await seedAttempt('u1', LAS_P5, false, kind)
      await seedAttempt('u1', ELF_P5, true, kind)
      for (const qid of UNKNOWN) await seedAttempt('u1', qid, false, kind)
    }
    const res = await runFit(getDb(d1 as unknown as D1Database))
    expect(res.processed).toBe(0)
    expect(await ratings()).toEqual({ items: [], abilities: [] })
  })

  it('advances the watermark past excluded rows, so a later run never re-scans them', async () => {
    await seedAttempt('u1', 'var-2026-verb1-LÄS-011', true)
    await seedAttempt('u1', LAS_P5, false)
    await seedAttempt('u1', 'p5-las-b7-002-r1-LÄS-001', false)
    const last = await seedAttempt('u1', ELF_P5, true)
    const first = await runFit(getDb(d1 as unknown as D1Database))
    expect(first).toEqual({ processed: 1, watermark: last })

    const afterFirst = await ratings()
    const second = await runFit(getDb(d1 as unknown as D1Database))
    expect(second).toEqual({ processed: 0, watermark: last })
    expect(await ratings()).toEqual(afterFirst)

    // A tail of nothing but excluded rows still moves the watermark.
    const tail = await seedAttempt('u1', LAS_P5, true)
    const third = await runFit(getDb(d1 as unknown as D1Database))
    expect(third).toEqual({ processed: 0, watermark: tail })
    expect(await ratings()).toEqual(afterFirst)
  })

  it('trusts the stored source: an authentic qid stored unknown is skipped', async () => {
    // What an attempt written by the pre-migration worker looks like until
    // the backfill (drizzle/0013_attempt_source_backfill.sql) is re-run.
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', true, 'drill', 'unknown')
    const res = await runFit(getDb(d1 as unknown as D1Database))
    expect(res.processed).toBe(0)
    expect(res.watermark).toBeGreaterThan(0)
    expect(await ratings()).toEqual({ items: [], abilities: [] })
  })

  // Property-style: an authentic history fitted alone and the same history
  // with synthetic/unknown attempts interleaved (in any kind, for the same
  // and other users) land on byte-identical rating tables.
  const AUTHENTIC = [
    'var-2026-verb1-ORD-001',
    'var-2026-verb1-ORD-002',
    'var-2026-verb1-LÄS-011',
    'var-2026-verb2-ELF-031',
    'var-2026-kvant1-XYZ-001',
    'host-2025-kvant2-DTK-030',
  ]
  const KINDS = ['drill', 'adaptive_review', 'mock', 'mock_diagnostic', 'lesson']
  const USERS = ['u1', 'u2', 'u3']

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
  const pick = <T>(r: () => number, xs: readonly T[]) => xs[Math.floor(r() * xs.length)]

  for (const trial of [1, 2, 3, 4, 5, 6, 7, 8]) {
    it(`trial ${trial}: interleaved P5/unknown attempts leave every rating byte-identical`, async () => {
      const r = rng(trial)
      const history = Array.from({ length: 40 + Math.floor(r() * 40) }, () => ({
        user: pick(r, USERS),
        qid: pick(r, AUTHENTIC),
        correct: r() < 0.55,
        kind: pick(r, KINDS),
      }))
      const injected = (at: number) =>
        Array.from({ length: Math.floor(r() * 3) }, () => ({
          user: pick(r, USERS),
          qid: r() < 0.7 ? pick(r, P5) : pick(r, UNKNOWN),
          correct: r() < 0.5,
          kind: pick(r, KINDS),
          at,
        }))
      // Extras go before history[i]; those at history.length trail the last row.
      const extras = [...history.flatMap((_, i) => injected(i)), ...injected(history.length)]
      const runs = 1 + Math.floor(r() * 3)
      const split = (n: number) => Math.floor((history.length * n) / runs)

      // Fit A: the authentic history alone, in `runs` incremental runs.
      for (const user of USERS) await ensureUser(user)
      for (let n = 0; n < runs; n++) {
        for (const h of history.slice(split(n), split(n + 1))) {
          await seedAttempt(h.user, h.qid, h.correct, h.kind)
        }
        await runFit(getDb(d1 as unknown as D1Database))
      }
      const alone = await ratings()

      // Fit B (fresh DB, same user ids): the history with the extras interleaved.
      d1 = makeTestD1()
      sessionByUser.clear()
      for (const user of USERS) await ensureUser(user)
      let lastId = 0
      const seedExtras = async (at: number) => {
        for (const x of extras.filter((e) => e.at === at)) {
          lastId = await seedAttempt(x.user, x.qid, x.correct, x.kind)
        }
      }
      for (let n = 0; n < runs; n++) {
        for (let i = split(n); i < split(n + 1); i++) {
          await seedExtras(i)
          const h = history[i]
          lastId = await seedAttempt(h.user, h.qid, h.correct, h.kind)
        }
        if (n === runs - 1) await seedExtras(history.length)
        const res = await runFit(getDb(d1 as unknown as D1Database))
        expect(res.watermark).toBe(lastId)
      }
      expect(JSON.stringify(await ratings())).toBe(JSON.stringify(alone))
      expect(alone.items.length).toBeGreaterThan(0)
    })
  }
})

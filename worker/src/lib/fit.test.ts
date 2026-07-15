// Unit + integration tests for the learned item-difficulty fit (PL-L.1).
//
// Two layers:
//   1. Pure-math tests on expectedScore / kFactor / clampRating — symmetry,
//      K decay, clamp band.
//   2. runFit against a REAL in-memory D1 (the migration-built shim): the
//      watermark idempotency contract, chronological-order sensitivity,
//      per-user isolation, and the clamp holding through many updates.

import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'

import { getDb } from '../db/client'
import { attempts, itemStats, sessions, userAbility, users } from '../db/schema'
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
 *  order == id order == the chronological order runFit folds them in. */
async function seedAttempt(
  clerkUserId: string,
  questionId: string,
  correct: boolean,
  kind = 'drill',
): Promise<number> {
  const db = getDb(d1 as unknown as D1Database)
  const userId = await ensureUser(clerkUserId)
  const sessionId = await ensureSession(userId, kind)
  const [row] = await db
    .insert(attempts)
    .values({ userId, sessionId, questionId, correct })
    .returning()
  return row.id
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

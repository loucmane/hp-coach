// Unit + integration tests for the learned item-difficulty fit (PL-L.1).
//
// Two layers:
//   1. Pure-math tests on expectedScore / kFactor / clampRating — symmetry,
//      K decay, clamp band.
//   2. runFit against a REAL in-memory D1 (the migration-built shim): the
//      watermark idempotency contract, chronological-order sensitivity,
//      per-user isolation, and the clamp holding through many updates.

import { createHash } from 'node:crypto'
import { and, asc, eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'

import registry from '../../data/p5-qid-registry.json'
import { getDb } from '../db/client'
import {
  type AttemptSource,
  attempts,
  fitState,
  itemStats,
  sessions,
  userAbility,
  users,
} from '../db/schema'
import {
  CLAMP,
  clampRating,
  expectedScore,
  FITTED_KINDS,
  flooredExpectedScore,
  GUESS_FLOOR,
  K_DECAY_AFTER,
  K_EARLY,
  K_SETTLED,
  kFactor,
  REPLAY_ITEM_K_FACTOR,
  runFit,
} from './fit'
import { classifyAttempt } from './provenance'
import { extractSection } from './section'
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
  source?: AttemptSource,
): Promise<number> {
  const db = getDb(d1 as unknown as D1Database)
  const userId = await ensureUser(clerkUserId)
  const sessionId = await ensureSession(userId, kind)
  const provenance = classifyAttempt(questionId)
  const [row] = await db
    .insert(attempts)
    .values({
      userId,
      sessionId,
      questionId,
      correct,
      source: source ?? provenance.source,
      itemRevision: provenance.itemRevision,
    })
    .returning()
  return row.id
}

/** Both rating tables, every column but updatedAt, ordered — for byte-identity checks. */
async function ratings() {
  const db = getDb(d1 as unknown as D1Database)
  const items = await db
    .select({
      questionId: itemStats.questionId,
      difficulty: itemStats.difficulty,
      attempts: itemStats.attempts,
      source: itemStats.source,
    })
    .from(itemStats)
    .orderBy(asc(itemStats.questionId))
  const abilities = await db
    .select({
      userId: userAbility.userId,
      section: userAbility.section,
      ability: userAbility.ability,
      attempts: userAbility.attempts,
      syntheticAttempts: userAbility.syntheticAttempts,
      authenticAbility: userAbility.authenticAbility,
    })
    .from(userAbility)
    .orderBy(asc(userAbility.userId), asc(userAbility.section))
  return { items, abilities }
}

/** One user's ability row for a section, every rating column, or null. */
async function abilityRow(clerkUserId: string, section: string) {
  const db = getDb(d1 as unknown as D1Database)
  const userId = await ensureUser(clerkUserId)
  const [row] = await db
    .select({
      ability: userAbility.ability,
      attempts: userAbility.attempts,
      syntheticAttempts: userAbility.syntheticAttempts,
      authenticAbility: userAbility.authenticAbility,
    })
    .from(userAbility)
    .where(and(eq(userAbility.userId, userId), eq(userAbility.section, section)))
  return row ?? null
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
    await seedAttempt('uD', 'var-2026-verb1-ORD-009', true, 'drill')
    await seedAttempt('uR', 'var-2026-verb1-ORD-010', true, 'adaptive_review')
    await runFit(getDb(d1 as unknown as D1Database))

    const drillItem = (await itemDifficulty('var-2026-verb1-ORD-009'))?.difficulty ?? NaN
    const replayItem = (await itemDifficulty('var-2026-verb1-ORD-010'))?.difficulty ?? NaN
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

// ── 3. provenance (P5 infold PR 3, docs/p5-infold-design.md Amendment 1 E) ──
//
// Authentic and synthetic answers both move the user's section ability; a
// synthetic answer is fitted against the section's mean authentic difficulty
// (the interim, UNCALIBRATED method) while its own item difficulty is learned
// apart and never feeds that mean. Unknown answers move nothing; the
// watermark still passes them.

const P5 = registry.units.flatMap((u) => u.qids)
const LAS_P5 = 'p5-las-b19-002-r1-LÄS-001'
const LAS_P5_2 = 'p5-las-b14-002-r1-LÄS-001'
const ELF_P5 = 'p5-elf-b19-003-r1-ELF-001'
const UNKNOWN = [
  'p5-las-b7-002-r1-LÄS-001',
  'var-2099-verb2-ELF-031',
  'not-a-real-qid',
  // Bank-shaped, of a sitting the bank holds, but not one of its questions
  // (verb1's ORD questions are 001-010): unknown by bank membership.
  'var-2026-verb1-ORD-015',
]

async function syntheticAttempts(clerkUserId: string, section: string): Promise<number | null> {
  const db = getDb(d1 as unknown as D1Database)
  const userId = await ensureUser(clerkUserId)
  const rows = await db.select().from(userAbility).where(eq(userAbility.userId, userId))
  return rows.find((r) => r.section === section)?.syntheticAttempts ?? null
}

async function itemSource(qid: string): Promise<string | null> {
  const db = getDb(d1 as unknown as D1Database)
  const [row] = await db.select().from(itemStats).where(eq(itemStats.questionId, qid)).limit(1)
  return row?.source ?? null
}

/** mulberry32: a small seeded PRNG for the property-style histories. */
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

const AUTHENTIC = [
  'var-2026-verb1-ORD-001',
  'var-2026-verb1-ORD-002',
  'var-2026-verb1-LÄS-011',
  'var-2024-verb1-LAS-013',
  'var-2026-verb2-ELF-031',
  'var-2026-kvant1-XYZ-001',
  'host-2025-kvant2-DTK-030',
]
const KINDS = ['drill', 'adaptive_review', 'mock', 'mock_diagnostic', 'lesson']
const USERS = ['u1', 'u2', 'u3']

type Answer = { user: string; qid: string; correct: boolean; kind: string }

/** Whether some user answers an authentic question, in a fitted kind, after a
 *  synthetic one of the same section: the case review finding R2-B1 is about. */
function syntheticThenAuthentic(history: readonly Answer[]): boolean {
  const split = new Set<string>()
  for (const h of history) {
    if (!FITTED_KINDS.has(h.kind)) continue
    const key = `${h.user}/${extractSection(h.qid)}`
    const { source } = classifyAttempt(h.qid)
    if (source === 'synthetic') split.add(key)
    else if (source === 'authentic' && split.has(key)) return true
  }
  return false
}

describe('runFit — synthetic answers move ability (uncalibrated)', () => {
  it('a synthetic answer in a section with no rated authentic item is fitted against 0', async () => {
    await seedAttempt('u1', LAS_P5, true)
    const res = await runFit(getDb(d1 as unknown as D1Database))
    expect(res.processed).toBe(1)
    // floored expected = 0.2 + 0.8 * 0.5 = 0.6 on both sides, K = 32.
    expect((await ability('u1', 'LÄS'))?.ability).toBeCloseTo(12.8, 10)
    expect((await ability('u1', 'LÄS'))?.attempts).toBe(1)
    expect(await syntheticAttempts('u1', 'LÄS')).toBe(1)
    expect((await itemDifficulty(LAS_P5))?.difficulty).toBeCloseTo(-12.8, 10)
    expect((await itemDifficulty(LAS_P5))?.attempts).toBe(1)
    expect(await itemSource(LAS_P5)).toBe('synthetic')
  })

  it.each([
    ['in the same run', false],
    ['after an earlier run', true],
  ])('is fitted against the mean difficulty of the section’s rated authentic items (%s)', async (_label, split) => {
    // Three authentic LÄS items rated by other users, one in the legacy LAS spelling.
    await seedAttempt('u2', 'var-2026-verb1-LÄS-011', false)
    await seedAttempt('u2', 'var-2026-verb1-LÄS-012', true)
    await seedAttempt('u3', 'var-2024-verb1-LAS-013', false)
    // An authentic item of another section must not enter the LÄS anchor.
    await seedAttempt('u3', 'var-2026-verb2-ELF-031', true)
    if (split) await runFit(getDb(d1 as unknown as D1Database))
    await seedAttempt('u1', LAS_P5, true)
    await runFit(getDb(d1 as unknown as D1Database))

    const d = async (qid: string) => (await itemDifficulty(qid))?.difficulty ?? Number.NaN
    // Summed in qid order, as the fit does.
    const anchor =
      ((await d('var-2024-verb1-LAS-013')) +
        (await d('var-2026-verb1-LÄS-011')) +
        (await d('var-2026-verb1-LÄS-012'))) /
      3
    expect(anchor).not.toBe(0)
    expect((await ability('u1', 'LÄS'))?.ability).toBeCloseTo(
      K_EARLY * (1 - flooredExpectedScore(anchor, 0)),
      10,
    )
    // The item side learns the P5 item's own difficulty against u1's ability.
    expect((await itemDifficulty(LAS_P5))?.difficulty).toBeCloseTo(
      K_EARLY * (flooredExpectedScore(0, 0) - 1),
      10,
    )
  })

  it('keeps synthetic item difficulties out of the anchor', async () => {
    // Twenty users miss one P5 item: its own (uncalibrated) difficulty climbs.
    for (let i = 0; i < 20; i++) await seedAttempt(`miss-${i}`, LAS_P5, false)
    await runFit(getDb(d1 as unknown as D1Database))
    expect((await itemDifficulty(LAS_P5))?.difficulty).toBeGreaterThan(100)
    expect(await itemSource(LAS_P5)).toBe('synthetic')
    // A fresh solver on another P5 item is still fitted against the authentic
    // anchor — 0 here, since LÄS has no rated authentic item.
    await seedAttempt('fresh', LAS_P5_2, true)
    await runFit(getDb(d1 as unknown as D1Database))
    expect((await ability('fresh', 'LÄS'))?.ability).toBeCloseTo(12.8, 10)
  })

  it('counts synthetic answers per (user, section) and marks every item row with its source', async () => {
    await seedAttempt('u1', 'var-2026-verb1-LÄS-011', true)
    await seedAttempt('u1', LAS_P5, false)
    await seedAttempt('u1', LAS_P5_2, true)
    await seedAttempt('u1', ELF_P5, true)
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', true)
    const res = await runFit(getDb(d1 as unknown as D1Database))
    expect(res.processed).toBe(5)
    expect(await ability('u1', 'LÄS')).toMatchObject({ attempts: 3 })
    expect(await syntheticAttempts('u1', 'LÄS')).toBe(2)
    expect(await syntheticAttempts('u1', 'ELF')).toBe(1)
    expect(await syntheticAttempts('u1', 'ORD')).toBe(0)
    expect(await itemSource('var-2026-verb1-LÄS-011')).toBe('authentic')
    expect(await itemSource('var-2026-verb1-ORD-001')).toBe('authentic')
    for (const qid of [LAS_P5, LAS_P5_2, ELF_P5]) expect(await itemSource(qid)).toBe('synthetic')
  })

  it('damps only the item side of a synthetic adaptive_review answer', async () => {
    await seedAttempt('uR', LAS_P5, true, 'adaptive_review')
    await runFit(getDb(d1 as unknown as D1Database))
    expect((await ability('uR', 'LÄS'))?.ability).toBeCloseTo(12.8, 10)
    expect((await itemDifficulty(LAS_P5))?.difficulty).toBeCloseTo(-12.8 * REPLAY_ITEM_K_FACTOR, 10)
  })

  it('stays finite and inside the clamp over a long synthetic-only history', async () => {
    const r = rng(7)
    const skill: Record<string, number> = { strong: 0.95, weak: 0.08, mid: 0.5 }
    for (let i = 0; i < 600; i++) {
      const user = pick(r, Object.keys(skill))
      await seedAttempt(user, pick(r, P5), r() < skill[user], pick(r, KINDS))
    }
    await runFit(getDb(d1 as unknown as D1Database))
    const { items, abilities } = await ratings()
    expect(items.length).toBeGreaterThan(100)
    for (const row of [...items.map((i) => i.difficulty), ...abilities.map((a) => a.ability)]) {
      expect(Number.isFinite(row)).toBe(true)
      expect(Math.abs(row)).toBeLessThanOrEqual(CLAMP)
    }
    expect(items.every((i) => i.source === 'synthetic')).toBe(true)
    expect(abilities.every((a) => a.syntheticAttempts === a.attempts)).toBe(true)
    // No authentic answer: each authentic-only rating is the 0 it split off at.
    expect(abilities.every((a) => a.authenticAbility === 0)).toBe(true)
    expect((await ability('strong', 'LÄS'))?.ability).toBeGreaterThan(0)
    expect((await ability('weak', 'ELF'))?.ability).toBeLessThan(0)
  })
})

describe('runFit — unknown answers fail closed', () => {
  it('an unknown answer moves no rating, in any graded kind', async () => {
    for (const kind of ['drill', 'adaptive_review', 'mock', 'mock_diagnostic']) {
      for (const qid of UNKNOWN) await seedAttempt('u1', qid, false, kind)
    }
    const res = await runFit(getDb(d1 as unknown as D1Database))
    expect(res.processed).toBe(0)
    expect(await ratings()).toEqual({ items: [], abilities: [] })
  })

  it('advances the watermark past unknown rows, so a later run never re-scans them', async () => {
    await seedAttempt('u1', 'var-2026-verb1-LÄS-011', true)
    await seedAttempt('u1', UNKNOWN[0], false)
    const last = await seedAttempt('u1', UNKNOWN[1], true)
    expect(await runFit(getDb(d1 as unknown as D1Database))).toEqual({
      processed: 1,
      watermark: last,
    })
    const afterFirst = await ratings()
    expect(await runFit(getDb(d1 as unknown as D1Database))).toEqual({
      processed: 0,
      watermark: last,
    })
    expect(await ratings()).toEqual(afterFirst)
    const tail = await seedAttempt('u1', UNKNOWN[2], true)
    expect(await runFit(getDb(d1 as unknown as D1Database))).toEqual({
      processed: 0,
      watermark: tail,
    })
    expect(await ratings()).toEqual(afterFirst)
  })

  it('trusts the stored source: an authentic qid stored unknown is skipped', async () => {
    // What an attempt the pre-migration worker wrote looks like until the
    // backfill (drizzle/0013_attempt_provenance_backfill.sql) is re-run.
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', true, 'drill', 'unknown')
    const res = await runFit(getDb(d1 as unknown as D1Database))
    expect(res.processed).toBe(0)
    expect(res.watermark).toBeGreaterThan(0)
    expect(await ratings()).toEqual({ items: [], abilities: [] })
  })

  // Property-style: an authentic history fitted alone and the same history
  // with unknown answers interleaved (any kind, any user) land on
  // byte-identical rating tables.
  for (const trial of [1, 2, 3, 4, 5]) {
    it(`trial ${trial}: interleaved unknown answers leave every rating byte-identical`, async () => {
      const r = rng(trial)
      const history = Array.from({ length: 40 + Math.floor(r() * 40) }, () => ({
        user: pick(r, USERS),
        qid: pick(r, AUTHENTIC),
        correct: r() < 0.55,
        kind: pick(r, KINDS),
      }))
      const extras = history.map(() =>
        Array.from({ length: Math.floor(r() * 3) }, () => ({
          user: pick(r, USERS),
          qid: pick(r, UNKNOWN),
          correct: r() < 0.5,
          kind: pick(r, KINDS),
        })),
      )

      // Same user ids in both databases, whoever answers first.
      for (const user of USERS) await ensureUser(user)
      for (const h of history) await seedAttempt(h.user, h.qid, h.correct, h.kind)
      await runFit(getDb(d1 as unknown as D1Database))
      const alone = await ratings()

      d1 = makeTestD1()
      sessionByUser.clear()
      for (const user of USERS) await ensureUser(user)
      for (const [i, h] of history.entries()) {
        for (const x of extras[i]) await seedAttempt(x.user, x.qid, x.correct, x.kind)
        await seedAttempt(h.user, h.qid, h.correct, h.kind)
      }
      await runFit(getDb(d1 as unknown as D1Database))
      expect(JSON.stringify(await ratings())).toBe(JSON.stringify(alone))
      expect(alone.items.length).toBeGreaterThan(0)
    })
  }
})

describe('runFit — mixed histories stay incremental and idempotent', () => {
  // Authentic, synthetic and unknown answers interleaved: fitting the history
  // in several incremental runs lands on exactly the ratings of one run, bit
  // for bit — the anchor is recomputed from persisted state, never carried.
  for (const trial of [11, 12, 13, 14]) {
    it(`trial ${trial}: incremental runs === one run, byte for byte`, async () => {
      const r = rng(trial)
      const history = Array.from({ length: 60 + Math.floor(r() * 60) }, () => {
        const roll = r()
        return {
          user: pick(r, USERS),
          qid: roll < 0.45 ? pick(r, AUTHENTIC) : roll < 0.9 ? pick(r, P5) : pick(r, UNKNOWN),
          correct: r() < 0.6,
          kind: pick(r, KINDS),
        }
      })
      const runs = 2 + Math.floor(r() * 3)
      const split = (n: number) => Math.floor((history.length * n) / runs)

      for (const user of USERS) await ensureUser(user)
      for (let n = 0; n < runs; n++) {
        for (const h of history.slice(split(n), split(n + 1))) {
          await seedAttempt(h.user, h.qid, h.correct, h.kind)
        }
        await runFit(getDb(d1 as unknown as D1Database))
      }
      const incremental = await ratings()
      expect(await runFit(getDb(d1 as unknown as D1Database))).toMatchObject({ processed: 0 })
      expect(await ratings()).toEqual(incremental)

      d1 = makeTestD1()
      sessionByUser.clear()
      for (const user of USERS) await ensureUser(user)
      for (const h of history) await seedAttempt(h.user, h.qid, h.correct, h.kind)
      await runFit(getDb(d1 as unknown as D1Database))
      expect(JSON.stringify(await ratings())).toBe(JSON.stringify(incremental))
      expect(incremental.items.some((i) => i.source === 'synthetic')).toBe(true)
      expect(incremental.abilities.some((a) => a.syntheticAttempts > 0)).toBe(true)
      // The authentic-only ratings are compared too, and some moved after splitting off.
      expect(syntheticThenAuthentic(history)).toBe(true)
    })
  }
})

// ── 4. authentic calibration ignores synthetic answers (review finding R2-B1) ──
//
// One rating per (user, section) used to be both the user's estimate, which
// counts synthetic answers, and the opponent an authentic item's difficulty was
// learned against. After a synthetic answer, the user's next authentic answer
// moved that authentic item with a P5-influenced rating, and an authentic-only
// user who answered the item later inherited it, while /me/ability called them
// calibrated. Authentic item difficulties, and so every authentic-only user's
// ability, must be exactly what the fit gives with every synthetic answer
// deleted. The estimate that counts synthetic answers keeps its behaviour.

describe('runFit — authentic items play the authentic-only rating (R2-B1)', () => {
  const REPRO_QID = 'var-2024-verb1-LÄS-011'
  // User B's LÄS ability from the authentic answers alone (the control).
  const CONTROL_B = 12.328643808700775
  // User A's LÄS ability, which counts A's synthetic answer, as 782f9c2 fitted it.
  const HEAD_A = 25.128643808700772
  const P5_LAS = P5.filter((q) => extractSection(q) === 'LÄS')

  const refit = () => runFit(getDb(d1 as unknown as D1Database))

  it.each([
    ['in one run', false],
    ['with a run after each step', true],
  ])('the reviewer’s repro: user B gets exactly the authentic-only control (%s)', async (_label, stepwise) => {
    // 1. A answers a synthetic LÄS question. 2. A answers the authentic one.
    // 3. B answers only the authentic one.
    await seedAttempt('A', LAS_P5, true)
    if (stepwise) await refit()
    await seedAttempt('A', REPRO_QID, true)
    if (stepwise) await refit()
    await seedAttempt('B', REPRO_QID, true)
    await refit()
    const a = await abilityRow('A', 'LÄS')
    const b = await abilityRow('B', 'LÄS')
    const item = await itemDifficulty(REPRO_QID)

    // The control: the same authentic answers, without the synthetic one.
    d1 = makeTestD1()
    sessionByUser.clear()
    await seedAttempt('A', REPRO_QID, true)
    await seedAttempt('B', REPRO_QID, true)
    await refit()
    const control = { a: await abilityRow('A', 'LÄS'), b: await abilityRow('B', 'LÄS') }
    expect(control.b).toEqual({
      ability: CONTROL_B,
      attempts: 1,
      syntheticAttempts: 0,
      authenticAbility: null,
    })

    // A's estimate still counts the synthetic answer, exactly as 782f9c2 fitted
    // it, and stays uncalibrated (1 of its 2 answers is synthetic).
    expect(a?.ability).toBe(HEAD_A)
    const afterSynthetic = K_EARLY * (1 - flooredExpectedScore(0, 0))
    expect(HEAD_A).toBe(afterSynthetic + K_EARLY * (1 - flooredExpectedScore(0, afterSynthetic)))
    // B is the control exactly: no synthetic answer, so calibrated.
    expect(b).toEqual(control.b)
    // The authentic item is the control's, difficulty and count.
    expect(item).toEqual(await itemDifficulty(REPRO_QID))
    // A's authentic-only rating is A's ability in the control.
    expect(a).toEqual({
      ability: HEAD_A,
      attempts: 2,
      syntheticAttempts: 1,
      authenticAbility: control.a?.ability,
    })
  })

  it('keeps the authentic-only rating null for a user without synthetic answers', async () => {
    await seedAttempt('u1', REPRO_QID, true)
    await seedAttempt('u1', 'var-2026-verb1-ORD-001', false)
    await refit()
    expect((await ratings()).abilities.map((a) => a.authenticAbility)).toEqual([null, null])
  })

  it('splits the authentic-only rating off at the first synthetic answer and moves it on authentic answers only', async () => {
    await seedAttempt('u1', REPRO_QID, true)
    await seedAttempt('u1', LAS_P5, false)
    await seedAttempt('u1', LAS_P5_2, true)
    await seedAttempt('u1', 'var-2026-verb1-LÄS-012', true)
    await refit()
    // After the first, authentic, answer both ratings are r1. The synthetic
    // answers move only the section ability. The fresh authentic item then
    // plays r1, and r1 moves against it.
    const r1 = K_EARLY * (1 - flooredExpectedScore(0, 0))
    const row = await abilityRow('u1', 'LÄS')
    expect(row).toMatchObject({
      attempts: 4,
      syntheticAttempts: 2,
      authenticAbility: r1 + K_EARLY * (1 - flooredExpectedScore(0, r1)),
    })
    expect(row?.ability).not.toBe(row?.authenticAbility)
    expect(await itemDifficulty('var-2026-verb1-LÄS-012')).toEqual({
      difficulty: K_EARLY * (flooredExpectedScore(0, r1) - 1),
      attempts: 1,
    })
  })

  it('moves the authentic-only rating with its own K: 30 synthetic answers move no authentic item', async () => {
    for (let i = 0; i < K_DECAY_AFTER; i++) {
      await seedAttempt('u1', P5_LAS[i % P5_LAS.length], i % 3 !== 0)
    }
    await seedAttempt('u1', REPRO_QID, true)
    await refit()
    // The section ability is settled (K_SETTLED), but the authentic-only
    // rating has no authentic answer yet (K_EARLY). The item moves exactly as
    // for a user with no answer at all.
    const fresh = K_EARLY * (1 - flooredExpectedScore(0, 0))
    expect(await abilityRow('u1', 'LÄS')).toMatchObject({
      attempts: K_DECAY_AFTER + 1,
      syntheticAttempts: K_DECAY_AFTER,
      authenticAbility: fresh,
    })
    expect(await itemDifficulty(REPRO_QID)).toEqual({ difficulty: -fresh, attempts: 1 })
  })

  it('refuses a row with synthetic answers and no authentic-only rating, and writes nothing', async () => {
    // What the fit before the authentic-only rating left behind. drizzle/0015
    // resets such state. Guessing the rating could put synthetic answers back
    // into authentic items.
    const userId = await ensureUser('old')
    await getDb(d1 as unknown as D1Database)
      .insert(userAbility)
      .values({ userId, section: 'LÄS', ability: 30, attempts: 3, syntheticAttempts: 2 })
    await seedAttempt('old', REPRO_QID, true)
    const before = await ratings()
    await expect(refit()).rejects.toThrow(/no authentic_ability/)
    expect(await ratings()).toEqual(before)
    expect(
      await getDb(d1 as unknown as D1Database)
        .select()
        .from(fitState),
    ).toEqual([])
  })

  // Property-style: a history mixing authentic, synthetic and unknown answers,
  // fitted in one to three runs, against the same history with every synthetic
  // answer deleted, fitted in one run.
  const MIXED = ['m1', 'm2']
  const PURE = ['p1', 'p2']

  function mixedHistory(r: () => number): Answer[] {
    return Array.from({ length: 80 + Math.floor(r() * 80) }, () => {
      const user = pick(r, [...MIXED, ...PURE])
      const roll = r()
      const pool = PURE.includes(user) || roll < 0.45 ? AUTHENTIC : roll < 0.9 ? P5 : UNKNOWN
      return { user, qid: pick(r, pool), correct: r() < 0.6, kind: pick(r, KINDS) }
    })
  }

  for (const trial of [21, 22, 23, 24, 25]) {
    it(`trial ${trial}: authentic ratings are exactly the fit with every synthetic answer deleted`, async () => {
      const r = rng(trial)
      const history = mixedHistory(r)
      expect(syntheticThenAuthentic(history)).toBe(true)
      const runs = 1 + Math.floor(r() * 3)
      const split = (n: number) => Math.floor((history.length * n) / runs)

      for (const user of [...MIXED, ...PURE]) await ensureUser(user)
      for (let n = 0; n < runs; n++) {
        for (const h of history.slice(split(n), split(n + 1))) {
          await seedAttempt(h.user, h.qid, h.correct, h.kind)
        }
        await refit()
      }
      const mixed = await ratings()

      d1 = makeTestD1()
      sessionByUser.clear()
      for (const user of [...MIXED, ...PURE]) await ensureUser(user)
      for (const h of history) {
        if (classifyAttempt(h.qid).source === 'synthetic') continue
        await seedAttempt(h.user, h.qid, h.correct, h.kind)
      }
      await refit()
      const control = await ratings()

      // Every authentic item, byte for byte.
      expect(JSON.stringify(mixed.items.filter((i) => i.source === 'authentic'))).toBe(
        JSON.stringify(control.items),
      )
      // Every (user, section) without a synthetic answer, every pure user's
      // among them, byte for byte. With synthetic answers, the authentic-only
      // rating and its count are that (user, section) of the control, or the
      // fresh 0 and 0 where the control has no row.
      const key = (a: { userId: number; section: string }) => `${a.userId}/${a.section}`
      const controlRows = new Map(control.abilities.map((a) => [key(a), a]))
      for (const row of mixed.abilities) {
        const without = controlRows.get(key(row))
        if (row.syntheticAttempts === 0) {
          expect(JSON.stringify(row)).toBe(JSON.stringify(without))
        } else {
          expect(row.authenticAbility).toBe(without?.ability ?? 0)
          expect(row.attempts - row.syntheticAttempts).toBe(without?.attempts ?? 0)
        }
      }
      const mixedKeys = new Set(mixed.abilities.map(key))
      expect(control.abilities.filter((a) => !mixedKeys.has(key(a)))).toEqual([])
      expect(mixed.abilities.some((a) => a.syntheticAttempts === 0 && a.attempts > 0)).toBe(true)
    })
  }

  // Where no user answers an authentic question after a synthetic one of its
  // section, the fit at 782f9c2 was already right. Every rating there is what
  // it fitted, the estimates that count synthetic answers included. The
  // digests were recorded against it. Only the new column differs. The
  // histories draw P5 qids from the registry, so a registry change moves them:
  // these were re-recorded against 782f9c2's fit on the registry without
  // las-b3-001 and las-b5-001 (retired 2026-10-08, bead hpf-c5tb.2), without
  // elf-b1-002, elf-b3-004, elf-b4-001, elf-b5-002, elf-b7-002 and
  // elf-b8-002 (retired 2026-10-09, bead hpf-c5tb.13) and without elf-b12-001
  // (retired the same day, bead hpf-c5tb.17).
  const HEAD_DIGESTS: Array<[number, string]> = [
    [31, '157fdef26d2a85cfdcdce950ab038d85490b312b638dc6c5f658c2b8326fac64'],
    [32, '14ac9d848db8b9536ac4fbfc824ad937d7b49408f27a18c1acc4bb9acb234c90'],
    [33, '61784f26b1fc7b849387b04967ace41b7ac5e78236cf7bd7db5aa077b37ef56c'],
  ]
  for (const [trial, digest] of HEAD_DIGESTS) {
    it(`trial ${trial}: without the R2-B1 case every rating is what 782f9c2 fitted`, async () => {
      const r = rng(trial)
      const split = new Set<string>()
      const history = mixedHistory(r).filter((h) => {
        if (!FITTED_KINDS.has(h.kind)) return true
        const key = `${h.user}/${extractSection(h.qid)}`
        const { source } = classifyAttempt(h.qid)
        if (source === 'synthetic') split.add(key)
        return !(source === 'authentic' && split.has(key))
      })
      expect(syntheticThenAuthentic(history)).toBe(false)
      for (const user of [...MIXED, ...PURE]) await ensureUser(user)
      for (const h of history) await seedAttempt(h.user, h.qid, h.correct, h.kind)
      await refit()
      const { items, abilities } = await ratings()
      expect(items.some((i) => i.source === 'synthetic')).toBe(true)
      expect(abilities.some((a) => a.syntheticAttempts > 0)).toBe(true)
      // The columns 782f9c2 had, in its order.
      const atHead = {
        items,
        abilities: abilities.map((a) => ({
          userId: a.userId,
          section: a.section,
          ability: a.ability,
          attempts: a.attempts,
          syntheticAttempts: a.syntheticAttempts,
        })),
      }
      expect(createHash('sha256').update(JSON.stringify(atHead)).digest('hex')).toBe(digest)
    })
  }
})

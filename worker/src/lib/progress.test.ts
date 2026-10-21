// Unit tests for the mastery EWMA + framework-progress ladder.
//
// Pure score tests plus dated writer/reader evidence against in-memory D1.
// routes/attempts.test.ts and routes/lessonReads.test.ts also prove these
// transitions through the production grading and reading routes.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getDb } from '../db/client'
import { frameworkProgress, mastery, users } from '../db/schema'
import {
  applyMasteryOutcome,
  MASTERED_AT,
  MASTERY_ALPHA,
  MASTERY_PRIOR,
  nextMasteryScore,
  RETAINING_AT,
  readFrameworkProgress,
  statusForScore,
} from './progress'
import { makeTestD1 } from './testD1'

describe('nextMasteryScore', () => {
  it('seeds a brand-new item from the neutral prior, not from the outcome', () => {
    // A first correct answer must NOT read as certainty — with no
    // exposure-count column on `mastery`, the neutral prior is the only
    // thing keeping one lucky hit from looking like mastery.
    expect(nextMasteryScore(null, true)).toBe(MASTERY_PRIOR + MASTERY_ALPHA * (1 - MASTERY_PRIOR))
    expect(nextMasteryScore(null, false)).toBe(MASTERY_PRIOR + MASTERY_ALPHA * (0 - MASTERY_PRIOR))
  })

  it('treats a missing/legacy score as the neutral prior too', () => {
    expect(nextMasteryScore(undefined, true)).toBe(nextMasteryScore(null, true))
  })

  it('moves toward 1 on correct and toward 0 on wrong', () => {
    expect(nextMasteryScore(0.5, true)).toBeGreaterThan(0.5)
    expect(nextMasteryScore(0.5, false)).toBeLessThan(0.5)
  })

  it('stays inside [0, 1] however lopsided the streak', () => {
    let s = nextMasteryScore(null, true)
    for (let i = 0; i < 50; i++) s = nextMasteryScore(s, true)
    expect(s).toBeLessThanOrEqual(1)
    for (let i = 0; i < 100; i++) s = nextMasteryScore(s, false)
    expect(s).toBeGreaterThanOrEqual(0)
  })

  it('rounds to 4 decimals so repeated writes do not accumulate float noise', () => {
    const s = nextMasteryScore(0.8285, true)
    expect(s).toBe(Number(s.toFixed(4)))
  })

  it('needs FOUR consecutive corrects from cold to reach the mastered band', () => {
    let s = nextMasteryScore(null, true)
    expect(statusForScore(s)).toBe('practicing')
    s = nextMasteryScore(s, true)
    expect(statusForScore(s)).toBe('retaining')
    s = nextMasteryScore(s, true)
    expect(statusForScore(s)).toBe('retaining')
    s = nextMasteryScore(s, true)
    expect(statusForScore(s)).toBe('mastered')
  })
})

describe('dated mastery evidence', () => {
  let db: ReturnType<typeof getDb>
  let userId: number
  const dayOne = new Date('2026-10-01T23:59:00Z')
  const dayTwo = new Date('2026-10-02T00:01:00Z')
  const layer1Id = 'KVA-NEG-001'
  const answer = (correct = true) => applyMasteryOutcome(db, userId, 'KVA', layer1Id, correct)

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(dayOne)
    db = getDb(makeTestD1() as unknown as D1Database)
    const [user] = await db.insert(users).values({ clerkUserId: 'mastery-test' }).returning()
    userId = user.id
  })

  afterEach(() => vi.useRealTimers())

  it('caps a whole sitting at retaining, without resetting its transition time', async () => {
    for (let i = 0; i < 10; i++) await answer()
    expect(await readFrameworkProgress(db, userId)).toEqual([
      { layer1Id, status: 'retaining', lastTransitionAt: dayOne },
    ])
    vi.setSystemTime(new Date('2026-10-01T23:59:59Z'))
    expect((await answer()).status).toBe('retaining')
    const [stored] = await db.select().from(frameworkProgress)
    expect(stored.lastTransitionAt).toEqual(dayOne)
  })

  it('promotes on the next UTC day and keeps supported mastery on subsequent answers', async () => {
    for (let i = 0; i < 4; i++) await answer()
    vi.setSystemTime(dayTwo)
    expect((await answer()).status).toBe('mastered')
    expect((await answer()).status).toBe('mastered')
    const [stored] = await db.select().from(frameworkProgress)
    expect(stored.lastTransitionAt).toEqual(dayTwo)
  })

  it.each([
    'learning',
    'practicing',
    'untaught',
  ])('does not promote a legacy high score directly from %s', async (status) => {
    await db.insert(mastery).values({ userId, section: 'KVA', layer1Id, score: 1 })
    await db
      .insert(frameworkProgress)
      .values({ userId, layer1Id, status, lastTransitionAt: dayOne })
    vi.setSystemTime(dayTwo)
    expect((await answer()).status).toBe('retaining')
  })

  it('does not treat an undated retaining row as earlier-day evidence', async () => {
    await db.insert(mastery).values({ userId, section: 'KVA', layer1Id, score: 1 })
    await db.insert(frameworkProgress).values({
      userId,
      layer1Id,
      status: 'retaining',
      lastTransitionAt: null,
    })
    expect((await answer()).status).toBe('retaining')
  })

  it.each([
    [true, 0.825],
    [false, 0.525],
  ])('decays toward the prior before folding correct=%s after 30 days', async (correct, expected) => {
    await db
      .insert(mastery)
      .values({ userId, section: 'KVA', layer1Id, score: 1, lastUpdatedAt: dayOne })
    await db.insert(frameworkProgress).values({ userId, layer1Id, status: 'mastered' })
    const later = new Date(dayOne.getTime() + 30 * 86_400_000)
    vi.setSystemTime(later)
    const result = await answer(correct)
    expect(result.score).toBe(expected)
    expect(result.status).toBe(correct ? 'retaining' : 'practicing')
    const [stored] = await db.select().from(mastery)
    expect(stored.lastUpdatedAt).toEqual(later)
  })

  it('does not amplify a score when the previous timestamp is in the future', async () => {
    await db
      .insert(mastery)
      .values({ userId, section: 'KVA', layer1Id, score: 0.8, lastUpdatedAt: dayTwo })
    expect((await answer()).score).toBe(0.86)
  })

  it('derives stale mastered rows as retaining after 30 days without writing either table', async () => {
    await db
      .insert(mastery)
      .values({ userId, section: 'KVA', layer1Id, score: 1, lastUpdatedAt: dayOne })
    await db
      .insert(frameworkProgress)
      .values({ userId, layer1Id, status: 'mastered', lastTransitionAt: dayOne })
    const beforeMastery = await db.select().from(mastery)
    const beforeProgress = await db.select().from(frameworkProgress)
    vi.setSystemTime(new Date(dayOne.getTime() + 30 * 86_400_000))
    expect((await readFrameworkProgress(db, userId))[0].status).toBe('mastered')
    vi.setSystemTime(new Date(dayOne.getTime() + 30 * 86_400_000 + 1_000))
    expect(await readFrameworkProgress(db, userId)).toEqual([
      { layer1Id, status: 'retaining', lastTransitionAt: dayOne },
    ])
    expect(await db.select().from(mastery)).toEqual(beforeMastery)
    expect(await db.select().from(frameworkProgress)).toEqual(beforeProgress)
  })
})

describe('statusForScore', () => {
  it('bands the score into the practiced rungs of the ladder', () => {
    expect(statusForScore(0)).toBe('practicing')
    expect(statusForScore(RETAINING_AT - 0.0001)).toBe('practicing')
    expect(statusForScore(RETAINING_AT)).toBe('retaining')
    expect(statusForScore(MASTERED_AT - 0.0001)).toBe('retaining')
    expect(statusForScore(MASTERED_AT)).toBe('mastered')
    expect(statusForScore(1)).toBe('mastered')
  })

  it('never returns an unpractised rung — practice is a one-way door', () => {
    for (const score of [0, 0.2, 0.5, 0.9, 1]) {
      expect(['practicing', 'retaining', 'mastered']).toContain(statusForScore(score))
    }
  })
})

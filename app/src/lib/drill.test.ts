// Drill picker — deterministic via seeded RNG. We want to verify:
//   1) Returns the requested count when the pool is large enough
//   2) Returns ≤ pool size when the pool is short
//   3) No duplicates within a single pick
//   4) Different seeds produce different orderings (sanity, not crypto)
//   5) The same seed produces the same ordering (replayability)
//   6) Only fully-parsed questions are in the pool — stubs are filtered

import { beforeAll, describe, expect, it } from 'vitest'

import { loadBank, type Question, questionsInSection } from '@/data/questions'

import {
  bandDistance,
  type DrillRatings,
  pickDrillQuestions,
  pickMixedDrillQuestions,
  predictedPCorrect,
  questionBandScore,
  seededRng,
} from './drill'

// Hot-load the bank once per file. After this every test (and every
// pickDrillQuestions call inside it) hits the cached Promise.
let bank: readonly Question[]
beforeAll(async () => {
  bank = await loadBank()
})

describe('pickDrillQuestions', () => {
  it('returns the requested count for a section with enough questions', async () => {
    const picked = await pickDrillQuestions('ORD', 10, seededRng(1))
    expect(picked).toHaveLength(10)
  })

  it('returns no duplicates', async () => {
    const picked = await pickDrillQuestions('ORD', 10, seededRng(7))
    const ids = picked.map((q) => q.qid)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only picks fully-parsed questions (no answer-only stubs)', async () => {
    const picked = await pickDrillQuestions('ORD', 10, seededRng(3))
    for (const q of picked) {
      expect(q.parsing_status).toBe('complete')
      expect(q.options).not.toBeNull()
    }
  })

  it('returns ≤ pool size when the pool is short', async () => {
    const picked = await pickDrillQuestions('DTK', 10, seededRng(1))
    expect(picked.length).toBeGreaterThan(0)
    expect(picked.length).toBeLessThanOrEqual(questionsInSection(bank, 'DTK').length)
  })

  it('is deterministic for a fixed seed', async () => {
    const a = (await pickDrillQuestions('ORD', 10, seededRng(42))).map((q) => q.qid)
    const b = (await pickDrillQuestions('ORD', 10, seededRng(42))).map((q) => q.qid)
    expect(a).toEqual(b)
  })

  it('different seeds usually produce different orderings', async () => {
    const a = (await pickDrillQuestions('ORD', 10, seededRng(1))).map((q) => q.qid)
    const b = (await pickDrillQuestions('ORD', 10, seededRng(99))).map((q) => q.qid)
    expect(a).not.toEqual(b)
  })
})

describe('pickDrillQuestions — DTK block-grouping', () => {
  // DTK is drilled as BLOCKS: one figure page + its ~3-4 questions worked as
  // a unit (block membership = shared figure.src). The picker keeps a block's
  // questions CONSECUTIVE and WHOLE so you orient to a dense page once, not
  // 4× scattered — mirroring the real exam. (Panel decision 2026-07-05.)

  const pageOf = (q: Question) => q.figure?.src ?? q.qid

  it('keeps block-mates (same figure page) consecutive — never interleaved', async () => {
    const picked = await pickDrillQuestions('DTK', 10, seededRng(5))
    expect(picked.length).toBeGreaterThan(0)
    // Walk the sequence: once we leave a page we must never return to it.
    const closed = new Set<string>()
    let prev: string | null = null
    for (const q of picked) {
      const page = pageOf(q)
      if (page !== prev) {
        expect(closed.has(page)).toBe(false) // returning = interleaved
        if (prev !== null) closed.add(prev)
        prev = page
      }
    }
  })

  it('picks WHOLE blocks — every page in the result contributes all its pool questions', async () => {
    const picked = await pickDrillQuestions('DTK', 10, seededRng(11))
    const pool = questionsInSection(bank, 'DTK')
    const poolByPage = new Map<string, number>()
    for (const q of pool) poolByPage.set(pageOf(q), (poolByPage.get(pageOf(q)) ?? 0) + 1)
    const resByPage = new Map<string, number>()
    for (const q of picked) resByPage.set(pageOf(q), (resByPage.get(pageOf(q)) ?? 0) + 1)
    for (const [page, n] of resByPage) {
      expect(n).toBe(poolByPage.get(page)) // whole block, no partials
    }
  })

  it('orders questions within a block by number (natural cluster order)', async () => {
    const picked = await pickDrillQuestions('DTK', 12, seededRng(3))
    for (let i = 1; i < picked.length; i++) {
      if (pageOf(picked[i]) === pageOf(picked[i - 1])) {
        expect(picked[i].number).toBeGreaterThan(picked[i - 1].number)
      }
    }
  })

  it('is deterministic for a fixed seed', async () => {
    const a = (await pickDrillQuestions('DTK', 10, seededRng(42))).map((q) => q.qid)
    const b = (await pickDrillQuestions('DTK', 10, seededRng(42))).map((q) => q.qid)
    expect(a).toEqual(b)
  })

  it('does NOT block-group the other sections (they stay individually shuffled)', async () => {
    // ORD has no shared figures, so this is really a guard that the DTK branch
    // is section-scoped — ORD still returns exactly `count`.
    const picked = await pickDrillQuestions('ORD', 10, seededRng(9))
    expect(picked).toHaveLength(10)
  })
})

describe('pickMixedDrillQuestions', () => {
  it('returns the requested count drawn across multiple sections (interleaved)', async () => {
    const picked = await pickMixedDrillQuestions(10, seededRng(5))
    expect(picked).toHaveLength(10)
    const sections = new Set(picked.map((q) => q.section))
    // Genuinely mixed — not the old bug where bare /drill played ORD-only.
    expect(sections.size).toBeGreaterThanOrEqual(3)
  })

  it('returns no duplicates', async () => {
    const picked = await pickMixedDrillQuestions(10, seededRng(8))
    const ids = picked.map((q) => q.qid)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only picks fully-parsed, playable questions', async () => {
    const picked = await pickMixedDrillQuestions(10, seededRng(2))
    for (const q of picked) {
      expect(q.parsing_status).toBe('complete')
      expect(q.options).not.toBeNull()
    }
  })

  it('is deterministic for a fixed seed', async () => {
    const a = (await pickMixedDrillQuestions(10, seededRng(42))).map((q) => q.qid)
    const b = (await pickMixedDrillQuestions(10, seededRng(42))).map((q) => q.qid)
    expect(a).toEqual(b)
  })
})

// ── Smart picking (PL-L.3): learning-band targeting ───────────────────────
//
// When the caller passes learned `ratings`, the picker prefers questions
// predicted to land in the 0.70–0.85 band. The scoring formula mirrors the
// server Elo fit (worker/src/lib/fit.ts). ability=0 throughout; difficulties
// are chosen so P(correct) lands in / out of band deterministically.

// P(correct) at ability 0 for a few reference difficulties:
//   d = -163 → ~0.775 (band centre, IN band)
//   d = +400 → ~0.273 (HARD, well below band)
const IN_BAND_D = -163
const HARD_D = 400

describe('band scoring helpers', () => {
  it('predictedPCorrect matches the guess-floored logistic (floor 0.2)', () => {
    // Equal ability/difficulty → raw 0.5 → 0.2 + 0.8*0.5 = 0.6
    expect(predictedPCorrect(0, 0)).toBeCloseTo(0.6, 5)
    // Chosen in-band difficulty really lands in the band.
    const p = predictedPCorrect(IN_BAND_D, 0)
    expect(p).toBeGreaterThanOrEqual(0.7)
    expect(p).toBeLessThanOrEqual(0.85)
  })

  it('bandDistance is 0 inside the band and positive outside', () => {
    expect(bandDistance(0.775)).toBe(0)
    expect(bandDistance(0.7)).toBe(0)
    expect(bandDistance(0.85)).toBe(0)
    expect(bandDistance(0.99)).toBeGreaterThan(0)
    expect(bandDistance(0.3)).toBeGreaterThan(0)
  })

  it('gives unrated questions the neutral in-band score (0)', () => {
    const ratings: DrillRatings = { difficulty: {}, ability: 0 }
    expect(questionBandScore('nonexistent-qid', ratings)).toBe(0)
  })
})

describe('pickDrillQuestions — smart band targeting', () => {
  // Rate the WHOLE ORD pool: half in-band, half hard. With no unrated
  // questions, an in-band-preferring picker must return only in-band items.
  it('clusters the pick inside the learning band when every item is rated', async () => {
    const pool = questionsInSection(bank, 'ORD')
    const difficulty: Record<string, number> = {}
    const inBand = new Set<string>()
    pool.forEach((q, i) => {
      if (i % 2 === 0) {
        difficulty[q.qid] = IN_BAND_D
        inBand.add(q.qid)
      } else {
        difficulty[q.qid] = HARD_D
      }
    })
    const picked = await pickDrillQuestions('ORD', 10, seededRng(1), { difficulty, ability: 0 })
    expect(picked).toHaveLength(10)
    for (const q of picked) {
      expect(inBand.has(q.qid)).toBe(true)
      const p = predictedPCorrect(difficulty[q.qid], 0)
      expect(p).toBeGreaterThanOrEqual(0.7)
      expect(p).toBeLessThanOrEqual(0.85)
    }
  })

  // Unrated items score neutral-in-band (0), so they beat clearly-out-of-band
  // rated items — new content keeps circulating rather than being buried.
  it('prefers unrated items over clearly out-of-band rated ones', async () => {
    const pool = questionsInSection(bank, 'ORD')
    // Rate only the first 5 as HARD; leave the rest unrated.
    const difficulty: Record<string, number> = {}
    const hard = new Set<string>()
    for (let i = 0; i < 5; i++) {
      difficulty[pool[i].qid] = HARD_D
      hard.add(pool[i].qid)
    }
    const picked = await pickDrillQuestions('ORD', 10, seededRng(2), { difficulty, ability: 0 })
    expect(picked).toHaveLength(10)
    // The hard rated items are worse than every unrated one, and there are
    // plenty of unrated items, so none of the hard five should be picked.
    for (const q of picked) expect(hard.has(q.qid)).toBe(false)
  })

  // Circulation guard: when only a few items are rated in-band and the rest
  // are unrated (also neutral-in-band), the pick still fills to `count` from
  // the unrated pool — smart picking never starves fresh content.
  it('still fills the session from unrated items when few are rated', async () => {
    const pool = questionsInSection(bank, 'ORD')
    const difficulty: Record<string, number> = {}
    const rated = new Set<string>()
    for (let i = 0; i < 3; i++) {
      difficulty[pool[i].qid] = IN_BAND_D
      rated.add(pool[i].qid)
    }
    const picked = await pickDrillQuestions('ORD', 10, seededRng(3), { difficulty, ability: 0 })
    expect(picked).toHaveLength(10)
    // Includes unrated questions (new content circulates).
    expect(picked.some((q) => !rated.has(q.qid))).toBe(true)
  })

  // Regression pin: passing `ratings: undefined` must be byte-for-byte
  // identical to the old three-arg random picker.
  it('is byte-identical to the random picker when ratings are absent', async () => {
    const withArg = (await pickDrillQuestions('ORD', 10, seededRng(42), undefined)).map(
      (q) => q.qid,
    )
    const withoutArg = (await pickDrillQuestions('ORD', 10, seededRng(42))).map((q) => q.qid)
    expect(withArg).toEqual(withoutArg)
  })

  // Group-atomic under smart picking: DTK blocks stay WHOLE and CONSECUTIVE
  // even when band-sorted — the picker reorders blocks, never splits them.
  it('preserves DTK block-atomicity under smart band sorting', async () => {
    const pool = questionsInSection(bank, 'DTK')
    // Rate every DTK question in-band so the band sort is fully engaged.
    const difficulty: Record<string, number> = {}
    for (const q of pool) difficulty[q.qid] = IN_BAND_D
    const picked = await pickDrillQuestions('DTK', 10, seededRng(7), { difficulty, ability: 0 })
    expect(picked.length).toBeGreaterThan(0)
    const pageOf = (q: Question) => q.figure?.src ?? q.qid
    // Once we leave a page we never return to it (whole + consecutive).
    const closed = new Set<string>()
    let prev: string | null = null
    for (const q of picked) {
      const page = pageOf(q)
      if (page !== prev) {
        expect(closed.has(page)).toBe(false)
        if (prev !== null) closed.add(prev)
        prev = page
      }
    }
    // Every page present contributes ALL its pool questions (no partial block).
    const poolByPage = new Map<string, number>()
    for (const q of pool) poolByPage.set(pageOf(q), (poolByPage.get(pageOf(q)) ?? 0) + 1)
    const resByPage = new Map<string, number>()
    for (const q of picked) resByPage.set(pageOf(q), (resByPage.get(pageOf(q)) ?? 0) + 1)
    for (const [page, n] of resByPage) expect(n).toBe(poolByPage.get(page))
  })
})

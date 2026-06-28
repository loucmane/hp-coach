// Drill picker — deterministic via seeded RNG. We want to verify:
//   1) Returns the requested count when the pool is large enough
//   2) Returns ≤ pool size when the pool is short
//   3) No duplicates within a single pick
//   4) Different seeds produce different orderings (sanity, not crypto)
//   5) The same seed produces the same ordering (replayability)
//   6) Only fully-parsed questions are in the pool — stubs are filtered

import { beforeAll, describe, expect, it } from 'vitest'

import { loadBank, type Question, questionsInSection } from '@/data/questions'

import { pickDrillQuestions, pickMixedDrillQuestions, seededRng } from './drill'

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
    // DTK is currently answer-only (parser MVP), so the pool is empty.
    const picked = await pickDrillQuestions('DTK', 10, seededRng(1))
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

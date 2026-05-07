// Drill picker — deterministic via seeded RNG. We want to verify:
//   1) Returns the requested count when the pool is large enough
//   2) Returns ≤ pool size when the pool is short
//   3) No duplicates within a single pick
//   4) Different seeds produce different orderings (sanity, not crypto)
//   5) The same seed produces the same ordering (replayability)
//   6) Only fully-parsed questions are in the pool — stubs are filtered

import { describe, expect, it } from 'vitest'

import { ALL_QUESTIONS, questionsInSection } from '@/data/questions'

import { pickDrillQuestions, seededRng } from './drill'

describe('pickDrillQuestions', () => {
  it('returns the requested count for a section with enough questions', () => {
    const picked = pickDrillQuestions('ORD', 10, seededRng(1))
    expect(picked).toHaveLength(10)
  })

  it('returns no duplicates', () => {
    const picked = pickDrillQuestions('ORD', 10, seededRng(7))
    const ids = picked.map((q) => q.qid)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only picks fully-parsed questions (no answer-only stubs)', () => {
    const picked = pickDrillQuestions('ORD', 10, seededRng(3))
    for (const q of picked) {
      expect(q.parsing_status).toBe('complete')
      expect(q.options).not.toBeNull()
    }
  })

  it('returns ≤ pool size when the pool is small', () => {
    // LÄS is currently answer-only (parser MVP), so the pool is empty.
    const picked = pickDrillQuestions('LÄS', 10, seededRng(1))
    expect(picked.length).toBeLessThanOrEqual(questionsInSection(ALL_QUESTIONS, 'LÄS').length)
  })

  it('is deterministic for a fixed seed', () => {
    const a = pickDrillQuestions('ORD', 10, seededRng(42)).map((q) => q.qid)
    const b = pickDrillQuestions('ORD', 10, seededRng(42)).map((q) => q.qid)
    expect(a).toEqual(b)
  })

  it('different seeds usually produce different orderings', () => {
    const a = pickDrillQuestions('ORD', 10, seededRng(1)).map((q) => q.qid)
    const b = pickDrillQuestions('ORD', 10, seededRng(99)).map((q) => q.qid)
    expect(a).not.toEqual(b)
  })
})

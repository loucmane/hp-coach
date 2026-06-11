// findQuestion contract — covers:
//   1) Resolves a present qid to its Question
//   2) Returns undefined (never throws) for a missing qid — persisted
//      qids (session plans, deep-links, saved cursors) drift out of
//      sync with the corpus, and a stale qid must degrade to a
//      recoverable state in drill/diagnostik/repetition flows.

import { beforeAll, describe, expect, it } from 'vitest'

import { findQuestion, loadBank, type Question } from './questions'

let bank: readonly Question[]

beforeAll(async () => {
  bank = await loadBank()
})

describe('findQuestion', () => {
  it('resolves a present qid to its Question', () => {
    const known = bank[0]
    expect(findQuestion(bank, known.qid)).toBe(known)
  })

  it('returns undefined for a missing qid instead of throwing', () => {
    expect(() => findQuestion(bank, 'var-2026-verb1-ORD-999')).not.toThrow()
    expect(findQuestion(bank, 'var-2026-verb1-ORD-999')).toBeUndefined()
  })

  it('returns undefined for a malformed qid', () => {
    expect(findQuestion(bank, '')).toBeUndefined()
    expect(findQuestion(bank, 'q1')).toBeUndefined()
  })
})

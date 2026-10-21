// findQuestion contract — covers:
//   1) Resolves a present qid to its Question
//   2) Returns undefined (never throws) for a missing qid — persisted
//      qids (session plans, deep-links, saved cursors) drift out of
//      sync with the corpus, and a stale qid must degrade to a
//      recoverable state in drill/diagnostik/repetition flows.

import { beforeAll, describe, expect, it } from 'vitest'

import {
  findQuestion,
  loadBank,
  type Question,
  questionsInSection,
  SECTION_KEYS,
} from './questions'
import { WORKED_EXAMPLE_QIDS } from './workedExamples.generated'

let bank: readonly Question[]

beforeAll(async () => {
  bank = await loadBank()
})

it('withholds worked examples from section pools while retaining direct lookup', () => {
  for (const section of SECTION_KEYS) {
    expect(
      questionsInSection(bank, section)
        .filter((q) => WORKED_EXAMPLE_QIDS.has(q.qid))
        .map((q) => q.qid),
    ).toEqual([])
  }
  for (const qid of WORKED_EXAMPLE_QIDS) expect(findQuestion(bank, qid)).toBeDefined()
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

describe('corpus option integrity', () => {
  // Regression guard for the "lost-radical" corpus defect (task #77):
  // a parser bug once stripped `\sqrt{…}` from math options, collapsing
  // distinct alternatives into byte-identical strings — e.g.
  // var-2024-kvant2-XYZ-010 rendered options B and D both as "b = a/2".
  // Two identical option texts make a question unanswerable (the student
  // cannot tell them apart) and always signal a source corruption, never
  // a legitimate item. Assert no drillable question ships duplicate
  // option strings so this signature can't silently reappear.
  it('has no question with two identical option texts', () => {
    const offenders: string[] = []
    for (const q of bank) {
      if (q.parsing_status !== 'complete' || !q.options) continue
      const seen = new Set<string>()
      for (const opt of q.options) {
        // Figure-only options carry an empty text label (the alternative
        // is an image); several such questions legitimately share "".
        if (opt.text === '') continue
        if (seen.has(opt.text)) {
          offenders.push(`${q.qid}: duplicate option text ${JSON.stringify(opt.text)}`)
          break
        }
        seen.add(opt.text)
      }
    }
    expect(offenders).toEqual([])
  })
})

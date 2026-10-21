import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Question } from '@/data/questions'
import {
  FIRST_SESSION_FALLBACK,
  FIRST_SESSION_QIDS,
  FIRST_SESSION_ROOT,
  firstSessionDoneLine,
  firstSessionOrigin,
  pickFirstSessionQuestions,
} from './firstSession'

const bank = ['host-2013', 'host-2016', 'host-2021', 'host-2025'].flatMap((exam) => {
  const data = JSON.parse(readFileSync(resolve('public/data', `${exam}.json`), 'utf8'))
  return data as Question[]
})

describe('first real ORD session', () => {
  it('uses three complete real questions from the o- root, in the agreed order', () => {
    const questions = pickFirstSessionQuestions(bank)
    expect(questions.map((q) => q.qid)).toEqual(FIRST_SESSION_QIDS)
    expect(questions.map((q) => q.prompt)).toEqual(['otidsenlig', 'otjänlig', 'obemedlad'])
    const lexicon = JSON.parse(readFileSync(resolve('../frameworks/ord_roots.json'), 'utf8'))
    const root = lexicon.entries.find((e: { id: string }) => e.id === FIRST_SESSION_ROOT)
    expect(root.root).toBe('o-')
    for (const q of questions) expect(root.example_questions).toContain(q.qid)
  })

  it('replaces a missing or incomplete question with the authentic fallback, without duplicates', () => {
    for (const missing of FIRST_SESSION_QIDS) {
      const picked = pickFirstSessionQuestions(bank.filter((q) => q.qid !== missing))
      expect(picked).toHaveLength(3)
      expect(picked.some((q) => q.qid === FIRST_SESSION_FALLBACK)).toBe(true)
      expect(new Set(picked.map((q) => q.qid)).size).toBe(3)
    }
    const partial = bank.map((q) => (q.qid === FIRST_SESSION_QIDS[0] ? { ...q, options: null } : q))
    expect(pickFirstSessionQuestions(partial)).toHaveLength(3)
  })

  it('returns no session when three real questions cannot be assembled', () => {
    expect(pickFirstSessionQuestions(bank.filter((q) => q.qid === FIRST_SESSION_QIDS[0]))).toEqual(
      [],
    )
  })

  it('labels origins in plain Swedish and never invents one', () => {
    expect(firstSessionOrigin(FIRST_SESSION_QIDS[0])).toBe('Högskoleprovet hösten 2016')
    expect(firstSessionOrigin(FIRST_SESSION_FALLBACK)).toBe('Högskoleprovet hösten 2013')
    expect(firstSessionOrigin('made-up')).toBeNull()
  })

  it('celebrates only three real answers, with no score for a mixed result', () => {
    const questions = pickFirstSessionQuestions(bank)
    expect(
      firstSessionDoneLine(
        questions,
        questions.map((q) => q.answer),
      ),
    ).toBe('Du klarade 3 av 3 frågor från riktiga högskoleprov')
    expect(firstSessionDoneLine(questions, ['A', 'A', 'A'])).toBe(
      'Du har gjort dina första 3 frågor från riktiga högskoleprov',
    )
    expect(firstSessionDoneLine(questions, [null, null, null])).toBeNull()
    expect(firstSessionDoneLine(questions.slice(0, 2), ['A', 'B'])).toBeNull()
  })
})

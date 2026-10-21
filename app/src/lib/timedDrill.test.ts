import { describe, expect, it } from 'vitest'

import { loadBank, type Question } from '@/data/questions'
import { isTimedDrillPlan, pickTimedDrillQuestions, timedDrill } from './timedDrill'

function question(number: number, overrides: Partial<Question> = {}): Question {
  return {
    qid: `q-${number}`,
    exam_id: '2024-var',
    provpass: 'verb1',
    section: 'LÄS',
    number,
    prompt: 'Fråga',
    context: 'En hel text',
    options: [{ letter: 'A', text: 'Svar' }],
    answer: 'A',
    parsing_status: 'complete',
    ...overrides,
  }
}

describe('timed delprov drills', () => {
  it('can select both accepted drill shapes from the shipped bank', async () => {
    const bank = await loadBank()
    for (const section of ['ORD', 'LÄS'] as const) {
      const picked = pickTimedDrillQuestions(bank, section, () => 0.5)
      expect(isTimedDrillPlan(picked, section)).toBe(true)
      expect(picked).toHaveLength(section === 'ORD' ? 10 : 4)
    }
  })

  it('uses the existing UHR budgets and supports only ORD and LÄS', () => {
    expect(timedDrill('ORD')).toEqual({ section: 'ORD', count: 10, budgetMs: 180_000 })
    expect(timedDrill('LÄS')).toEqual({ section: 'LÄS', count: 4, budgetMs: 528_000 })
    for (const section of ['MEK', 'ELF', 'XYZ', 'KVA', 'NOG', 'DTK', 'unknown']) {
      expect(timedDrill(section)).toBeNull()
    }
  })

  it('selects exactly ten distinct playable ORD questions', () => {
    const bank = Array.from({ length: 12 }, (_, i) => question(i, { section: 'ORD' }))
    bank.push(question(20, { section: 'ORD', parsing_status: 'answer_only' }))
    bank.push(question(21, { section: 'ORD', options: null }))
    const picked = pickTimedDrillQuestions(bank, 'ORD', () => 0.5)
    expect(picked).toHaveLength(10)
    expect(new Set(picked.map((q) => q.qid)).size).toBe(10)
    expect(picked.every((q) => q.number < 12)).toBe(true)
    expect(pickTimedDrillQuestions(bank.slice(0, 9), 'ORD')).toEqual([])
  })

  it('selects one complete four-question passage in printed order', () => {
    const bank = [4, 2, 1, 3].map((n) => question(n))
    bank.push(...[5, 6].map((n) => question(n, { context: 'Kort text' })))
    bank.push(...[7, 8, 9, 10].map((n) => question(n, { context: 'Annan text' })))
    const picked = pickTimedDrillQuestions(bank, 'LÄS', () => 0)
    expect(picked.map((q) => q.number)).toEqual([1, 2, 3, 4])
    expect(new Set(picked.map((q) => q.context))).toEqual(new Set(['En hel text']))
    expect(pickTimedDrillQuestions(bank, 'LÄS', () => 0.99).map((q) => q.number)).toEqual([
      7, 8, 9, 10,
    ])
    expect(bank[0].number).toBe(4)
  })

  it('does not combine texts across exams or passes, or trim a longer group', () => {
    const bank = [1, 2].map((n) => question(n))
    bank.push(...[3, 4].map((n) => question(n, { provpass: 'verb2' })))
    bank.push(...[5, 6].map((n) => question(n, { exam_id: '2025-var' })))
    bank.push(...[7, 8, 9, 10, 11].map((n) => question(n, { context: 'Fem frågor' })))
    bank.push(...[12, 13, 14, 15].map((n) => question(n, { context: null })))
    expect(pickTimedDrillQuestions(bank, 'LÄS')).toEqual([])
  })

  it('rejects a four-question passage with a missing or unplayable member', () => {
    const bank = [1, 2, 3, 4].map((n) => question(n))
    bank[3] = question(4, { parsing_status: 'answer_only', options: null })
    expect(pickTimedDrillQuestions(bank, 'LÄS')).toEqual([])
    expect(isTimedDrillPlan(bank, 'LÄS')).toBe(false)
  })

  it('admits only a matching whole plan for resume', () => {
    const las = [1, 2, 3, 4].map((n) => question(n))
    expect(isTimedDrillPlan(las, 'LÄS')).toBe(true)
    expect(
      isTimedDrillPlan([...las.slice(0, 3), question(4, { context: 'Annan text' })], 'LÄS'),
    ).toBe(false)
    expect(isTimedDrillPlan([...las.slice(0, 3), las[0]], 'LÄS')).toBe(false)
    expect(isTimedDrillPlan(las, 'ORD')).toBe(false)
    expect(
      isTimedDrillPlan(
        Array.from({ length: 10 }, (_, i) => question(i, { section: 'ORD' })),
        'ORD',
      ),
    ).toBe(true)
  })
})

// Figure-audit overrides (docs/figure-audit.md, 2026-06-26): 40 of 214
// extracted quant figures were broken. These tests pin the two remediations:
//   - SUPPRESSED_FIGURES: figure is junk/empty/leaked but the prompt is
//     self-contained → hide the figure, question STAYS drillable.
//   - EXCLUDED_QUESTIONS: figure is load-bearing AND broken → drop the
//     question from the drillable pool until (if) re-extracted.

import { beforeAll, describe, expect, it } from 'vitest'

import { EXCLUDED_QUESTIONS, SUPPRESSED_FIGURES } from './figureOverrides'
import { loadBank, type Question, questionsInSection } from './questions'

let bank: readonly Question[]
beforeAll(async () => {
  bank = await loadBank()
})

describe('figure override sets', () => {
  it('suppresses 32 leaked/junk/empty figures whose prompt is self-contained', () => {
    expect(SUPPRESSED_FIGURES.size).toBe(32)
    expect(SUPPRESSED_FIGURES.has('var-2026-kvant2-XYZ-002')).toBe(true) // the "Steg 1-4" fragment
    expect(SUPPRESSED_FIGURES.has('var-2016-kvant1-XYZ-004')).toBe(true) // rectangle leaked onto 1002^3
  })

  it('excludes 12 load-bearing-but-broken questions from drilling', () => {
    expect(EXCLUDED_QUESTIONS.size).toBe(12)
    expect(EXCLUDED_QUESTIONS.has('host-2014-kvant1-XYZ-006')).toBe(true) // scatter with no points
    expect(EXCLUDED_QUESTIONS.has('host-2025-kvant2-XYZ-008')).toBe(true) // f+g graph = black blob
  })

  it('the two sets are disjoint', () => {
    for (const qid of SUPPRESSED_FIGURES) expect(EXCLUDED_QUESTIONS.has(qid)).toBe(false)
  })
})

describe('loadBank strips suppressed figures', () => {
  it('nulls the figure on a suppressed question', () => {
    const q = bank.find((x) => x.qid === 'var-2026-kvant2-XYZ-002')
    expect(q, 'qid must exist in the bank').toBeTruthy()
    expect(q?.figure ?? null).toBeNull()
  })

  it('leaves a good figure intact', () => {
    const q = bank.find((x) => x.qid === 'host-2022-kvant1-XYZ-007') // pristine geometry
    expect(q?.figure).toBeTruthy()
  })

  it('keeps a suppressed question DRILLABLE (only the figure is hidden)', () => {
    const xyz = questionsInSection(bank, 'XYZ').map((q) => q.qid)
    expect(xyz).toContain('var-2026-kvant2-XYZ-002')
  })
})

describe('questionsInSection drops excluded questions', () => {
  it('removes excluded XYZ questions from the drillable pool', () => {
    const xyz = questionsInSection(bank, 'XYZ').map((q) => q.qid)
    expect(xyz).not.toContain('host-2014-kvant1-XYZ-006')
    expect(xyz).not.toContain('host-2025-kvant2-XYZ-008')
    expect(xyz).not.toContain('var-2024-kvant1-XYZ-006')
  })

  it('removes the excluded KVA question', () => {
    const kva = questionsInSection(bank, 'KVA').map((q) => q.qid)
    expect(kva).not.toContain('var-2024-kvant2-KVA-014')
  })
})

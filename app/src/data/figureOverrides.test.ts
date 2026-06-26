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

  it('excludes 6 load-bearing-but-broken questions from drilling', () => {
    // Was 12; Tranche 1 recovered 6 via the parse_figures.py fix.
    expect(EXCLUDED_QUESTIONS.size).toBe(6)
    expect(EXCLUDED_QUESTIONS.has('host-2025-kvant2-XYZ-008')).toBe(true) // still excluded (multi-figure model)
    expect(EXCLUDED_QUESTIONS.has('host-2014-kvant1-XYZ-006')).toBe(false) // recovered via raster fallback
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

describe('questionsInSection drops still-excluded questions', () => {
  it('removes still-excluded XYZ questions from the drillable pool', () => {
    const xyz = questionsInSection(bank, 'XYZ').map((q) => q.qid)
    expect(xyz).not.toContain('host-2025-kvant2-XYZ-008')
    expect(xyz).not.toContain('var-2024-kvant1-XYZ-006')
  })

  it('removes a still-excluded KVA question (Tranche 2 reextract)', () => {
    const kva = questionsInSection(bank, 'KVA').map((q) => q.qid)
    expect(kva).not.toContain('var-2022-1-kvant1-KVA-013')
  })
})

describe('Tranche 1 recovered figures are back in circulation', () => {
  it('host-2014 (raster scatter) is drillable again, with a raster figure', () => {
    const q = bank.find((x) => x.qid === 'host-2014-kvant1-XYZ-006')
    expect(q?.figure?.kind).toBe('raster')
    expect(questionsInSection(bank, 'XYZ').map((x) => x.qid)).toContain('host-2014-kvant1-XYZ-006')
  })

  it('var-2024 hexagon + the 4 black-blob recoveries are drillable again', () => {
    const drillable = new Set([
      ...questionsInSection(bank, 'XYZ').map((q) => q.qid),
      ...questionsInSection(bank, 'KVA').map((q) => q.qid),
    ])
    for (const qid of [
      'var-2024-kvant2-KVA-014',
      'host-2018-kvant1-KVA-017',
      'var-2019-kvant2-KVA-019',
      'var-2025-kvant1-XYZ-012',
      'var-2016-kvant1-XYZ-008',
    ]) {
      expect(drillable.has(qid), `${qid} should be drillable again`).toBe(true)
    }
  })
})

import { describe, expect, it } from 'vitest'

import type { Framework, Lexicon, TrapCatalog } from '@/data/frameworks'

import { type FrameworkProgressRow, summarizeFrameworkProgress } from './frameworkProgress'

const nog: TrapCatalog = {
  section: 'NOG',
  family: 'nog_traps',
  version: 1,
  authored_at: '2026-10-06',
  entries: ['NOG-Z', 'NOG-A', 'NOG-M', 'NOG-B', 'NOG-C'].map((id) => ({
    id,
    pattern_description: id,
    why_it_occurs: '',
    common_distractor_signature: '',
    countermeasure: '',
    example_questions: [],
  })),
}
const ord: Lexicon = {
  section: 'ORD',
  family: 'ord_roots',
  version: 1,
  authored_at: '2026-10-06',
  entries: [
    {
      id: 'ORD-1',
      root: 'root',
      origin: '',
      meaning: '',
      example_words: [],
      example_questions: [],
    },
  ],
}
const frameworks: Framework[] = [nog, ord]

function row(layer1Id: string, status: FrameworkProgressRow['status']): FrameworkProgressRow {
  return { layer1Id, status, lastTransitionAt: '2026-10-06T10:00:00.000Z' }
}

describe('summarizeFrameworkProgress', () => {
  it('counts every entry as untaught when no rows exist, including ORD', () => {
    const result = summarizeFrameworkProgress([], frameworks)
    expect(result.frameworks.map((fw) => [fw.section, fw.family, fw.total])).toEqual([
      ['NOG', 'nog_traps', 5],
      ['ORD', 'ord_roots', 1],
    ])
    expect(result.overall).toEqual({
      total: 6,
      counts: { untaught: 6, learning: 0, practicing: 0, retaining: 0, mastered: 0 },
      completionPercentage: 0,
      nextUntaught: nog.entries[0],
      allMastered: false,
      noData: true,
    })
    for (const fw of result.frameworks) {
      expect(fw.noData).toBe(true)
      expect(fw.allMastered).toBe(false)
      expect(fw.counts.untaught).toBe(fw.total)
      expect(fw.completionPercentage).toBe(0)
    }
    expect(result.frameworks[1].nextUntaught).toEqual(ord.entries[0])
    expect(result.orphans).toEqual([])
  })

  it('counts mixed statuses per framework and weights overall completion by entry count', () => {
    const rows = [
      row('NOG-Z', 'mastered'),
      row('NOG-A', 'learning'),
      row('NOG-M', 'practicing'),
      row('NOG-B', 'retaining'),
      row('ORD-1', 'mastered'),
    ]
    const result = summarizeFrameworkProgress(rows, frameworks)
    expect(result.frameworks[0].counts).toEqual({
      untaught: 1,
      learning: 1,
      practicing: 1,
      retaining: 1,
      mastered: 1,
    })
    expect(result.frameworks[0].completionPercentage).toBe(20)
    expect(result.frameworks[0].nextUntaught).toEqual(nog.entries[4])
    expect(result.frameworks[0].noData).toBe(false)
    expect(result.frameworks[1].completionPercentage).toBe(100)
    expect(result.overall.counts).toEqual({
      untaught: 1,
      learning: 1,
      practicing: 1,
      retaining: 1,
      mastered: 2,
    })
    expect(result.overall.completionPercentage).toBeCloseTo(100 / 3)
    expect(result.overall.allMastered).toBe(false)
    expect(result.overall.noData).toBe(false)
  })

  it('sets allMastered and clears nextUntaught only when every entry is mastered', () => {
    const rows = frameworks.flatMap((fw) => fw.entries.map((entry) => row(entry.id, 'mastered')))
    const result = summarizeFrameworkProgress(rows, frameworks)
    for (const summary of [...result.frameworks, result.overall]) {
      expect(summary.allMastered).toBe(true)
      expect(summary.noData).toBe(false)
      expect(summary.nextUntaught).toBeNull()
      expect(summary.completionPercentage).toBe(100)
      expect(summary.counts.mastered).toBe(summary.total)
    }
  })

  it('reports orphan rows separately without counting them or treating them as known data', () => {
    const orphan = row('removed-entry', 'mastered')
    const result = summarizeFrameworkProgress([orphan], frameworks)
    expect(result.orphans).toEqual([orphan])
    expect(result.overall.total).toBe(6)
    expect(result.overall.counts.mastered).toBe(0)
    expect(result.overall.counts.untaught).toBe(6)
    expect(result.overall.completionPercentage).toBe(0)
    expect(result.overall.noData).toBe(true)
  })

  it('chooses nextUntaught by framework order, including explicit untaught rows', () => {
    const rows = [row('NOG-A', 'untaught'), row('NOG-Z', 'untaught')]
    const result = summarizeFrameworkProgress(rows, frameworks)
    expect(result.frameworks[0].nextUntaught).toEqual(nog.entries[0])
    expect(result.frameworks[0].noData).toBe(false)
    expect(result.frameworks[1].noData).toBe(true)
    const taughtFirst = summarizeFrameworkProgress([row('NOG-Z', 'learning')], frameworks)
    expect(taughtFirst.frameworks[0].nextUntaught).toEqual(nog.entries[1])
  })

  it('can have no untaught entries without being all mastered', () => {
    const rows = nog.entries.map((entry) => row(entry.id, 'practicing'))
    const result = summarizeFrameworkProgress(rows, frameworks)
    expect(result.frameworks[0].nextUntaught).toBeNull()
    expect(result.frameworks[0].allMastered).toBe(false)
    expect(result.overall.nextUntaught).toEqual(ord.entries[0])
  })

  it('returns finite zero completion and false allMastered for empty catalogs', () => {
    const result = summarizeFrameworkProgress([], [{ ...nog, entries: [] }])
    for (const summary of [...result.frameworks, result.overall]) {
      expect(summary.total).toBe(0)
      expect(summary.completionPercentage).toBe(0)
      expect(summary.nextUntaught).toBeNull()
      expect(summary.allMastered).toBe(false)
      expect(summary.noData).toBe(true)
    }
    const orphan = row('not-loaded', 'learning')
    const unloaded = summarizeFrameworkProgress([orphan], [])
    expect(unloaded.frameworks).toEqual([])
    expect(unloaded.orphans).toEqual([orphan])
    expect(unloaded.overall).toEqual(result.overall)
  })

  it('does not mutate either input and follows the supplied framework order overall', () => {
    const rows = Object.freeze([Object.freeze(row('NOG-A', 'learning'))])
    const snapshot = structuredClone(frameworks)
    const result = summarizeFrameworkProgress(rows, Object.freeze([ord, nog]))
    expect(result.overall.nextUntaught).toEqual(ord.entries[0])
    expect(frameworks).toEqual(snapshot)
    expect(rows).toEqual([row('NOG-A', 'learning')])
  })
})

import { describe, expect, it } from 'vitest'

import type { FrameworkLeverage } from '@/data/leverage'

import { orderLessonEntries } from './lessonOrder'
import { type PrereqGraph, pickLessonEntry } from './prereqs'

const entries = ['low', 'high', 'early', 'same', 'zero'].map((id) => ({ id }))
const leverage: FrameworkLeverage = new Map([
  ['low', { coverage: 4, position: 1 }],
  ['high', { coverage: 10, position: 8 }],
  ['early', { coverage: 10, position: 2 }],
  ['same', { coverage: 10, position: 2 }],
  ['zero', { coverage: 0, position: null }],
])
const ids = (items: readonly { id: string }[]) => items.map((entry) => entry.id)

describe('orderLessonEntries', () => {
  it('prioritizes coverage, then lower position, then original catalog order', () => {
    expect(ids(orderLessonEntries(entries, leverage))).toEqual([
      'early',
      'same',
      'high',
      'low',
      'zero',
    ])
    expect(ids(entries)).toEqual(['low', 'high', 'early', 'same', 'zero'])
  })

  it('weights even one miss, reaching at most 2x at four misses', () => {
    const bank: FrameworkLeverage = new Map([
      ['a', { coverage: 10, position: 1 }],
      ['b', { coverage: 8, position: 2 }],
      ['c', { coverage: 17, position: 3 }],
    ])
    const candidates = ['a', 'b', 'c'].map((id) => ({ id }))
    expect(ids(orderLessonEntries(candidates, bank, new Map([['b', 1]])))).toEqual(['c', 'a', 'b'])
    expect(ids(orderLessonEntries(candidates, bank, new Map([['b', 2]])))).toEqual(['c', 'b', 'a'])
    expect(ids(orderLessonEntries(candidates, bank, new Map([['b', 4]])))).toEqual(['c', 'b', 'a'])
    expect(ids(orderLessonEntries(candidates, bank, new Map([['b', 100]])))).toEqual([
      'c',
      'b',
      'a',
    ])
    expect(ids(orderLessonEntries(candidates, bank, new Map([['a', 4]])))).toEqual(['a', 'c', 'b'])
  })

  it('zero, unknown and invalid miss counts preserve coverage order', () => {
    for (const misses of [
      undefined,
      new Map([['low', 0]]),
      new Map([['low', Number.NaN]]),
      new Map([['low', -2]]),
    ]) {
      expect(ids(orderLessonEntries(entries, leverage, misses))).toEqual([
        'early',
        'same',
        'high',
        'low',
        'zero',
      ])
    }
  })

  it('sorts unknown position last and preserves catalog order for equal unknown positions', () => {
    const bank: FrameworkLeverage = new Map([
      ['a', { coverage: 3, position: null }],
      ['b', { coverage: 3, position: 6 }],
      ['c', { coverage: 3, position: null }],
    ])
    expect(
      ids(
        orderLessonEntries(
          ['a', 'b', 'c'].map((id) => ({ id })),
          bank,
        ),
      ),
    ).toEqual(['b', 'a', 'c'])
  })

  it('preserves exact catalog order when leverage is missing or any candidate is absent', () => {
    expect(orderLessonEntries(entries, null, new Map([['high', 4]]))).toEqual(entries)
    expect(
      orderLessonEntries(entries, new Map([['high', { coverage: 100, position: 1 }]])),
    ).toEqual(entries)
    expect(orderLessonEntries([], leverage)).toEqual([])
  })

  it('keeps zero-coverage ties in catalog order even with misses', () => {
    const bank: FrameworkLeverage = new Map(
      entries.map(({ id }) => [id, { coverage: 0, position: null }]),
    )
    expect(orderLessonEntries(entries, bank, new Map([['zero', 4]]))).toEqual(entries)
  })

  it('retains soft-first grouping and leverage within each group', () => {
    const graph: PrereqGraph = { hard: new Map(), soft: new Map([['early', ['missing']]]) }
    expect(
      pickLessonEntry({
        entries: orderLessonEntries(entries, leverage),
        reads: new Set(),
        taught: new Set(),
        graph,
        canShow: () => true,
      }),
    ).toEqual({ id: 'same' })
  })

  it('still pulls forward the deepest untaught hard prerequisite of the ranked candidate', () => {
    const graph: PrereqGraph = {
      hard: new Map([
        ['early', ['high']],
        ['high', ['low']],
      ]),
      soft: new Map(),
    }
    expect(
      pickLessonEntry({
        entries: orderLessonEntries(entries, leverage),
        reads: new Set(),
        taught: new Set(),
        graph,
        canShow: () => true,
      }),
    ).toEqual({ id: 'low', blockedId: 'early' })
  })
})

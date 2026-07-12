import { describe, expect, it } from 'vitest'

import { dueCountsBySection, sectionOfQid } from './dueBySection'

describe('sectionOfQid', () => {
  it('reads the second-to-last dash segment as the section', () => {
    expect(sectionOfQid('host-2022-verb1-ORD-001')).toBe('ORD')
    expect(sectionOfQid('var-2026-kvant2-DTK-112')).toBe('DTK')
    expect(sectionOfQid('host-2020-verb2-ELF-032')).toBe('ELF')
  })

  it('handles LÄS (non-ASCII section token)', () => {
    expect(sectionOfQid('var-2024-verb1-LÄS-021')).toBe('LÄS')
  })

  it('returns null for unresolvable qids (seed rows, corpus drift)', () => {
    expect(sectionOfQid('q1')).toBeNull()
    expect(sectionOfQid('')).toBeNull()
    expect(sectionOfQid('host-2022-verb1-ZZZ-001')).toBeNull()
  })
})

describe('dueCountsBySection', () => {
  it('buckets rows per section and zero-fills every section key', () => {
    const counts = dueCountsBySection([
      { questionId: 'host-2022-verb1-ORD-001' },
      { questionId: 'host-2022-verb1-ORD-002' },
      { questionId: 'var-2026-kvant1-XYZ-004' },
    ])
    expect(counts.ORD).toBe(2)
    expect(counts.XYZ).toBe(1)
    expect(counts.LÄS).toBe(0)
    expect(counts.DTK).toBe(0)
  })

  it('drops unresolvable rows instead of mis-bucketing', () => {
    const counts = dueCountsBySection([{ questionId: 'q1' }, { questionId: 'trasig' }])
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(0)
  })

  it('tolerates undefined input (query still loading)', () => {
    const counts = dueCountsBySection(undefined)
    expect(counts.ORD).toBe(0)
  })
})

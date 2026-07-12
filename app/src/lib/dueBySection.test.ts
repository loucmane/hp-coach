import { describe, expect, it } from 'vitest'

import { countsBySection, dueCountsBySection, sectionOfQid } from './dueBySection'

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

describe('countsBySection', () => {
  it('buckets rows per section and zero-fills every section key', () => {
    const counts = countsBySection([
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
    const counts = countsBySection([{ questionId: 'q1' }, { questionId: 'trasig' }])
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(0)
  })

  it('tolerates undefined input (query still loading)', () => {
    const counts = countsBySection(undefined)
    expect(counts.ORD).toBe(0)
  })

  it('counts whatever slice it is fed — the active queue includes not-yet-due rows', () => {
    // The Öva lanes now feed the ACTIVE queue (scope=all), so a section can
    // show a lane count that exceeds its due-now count. The counter is
    // slice-agnostic: pass active rows in, get per-section active counts out.
    const active = countsBySection([
      { questionId: 'var-2026-verb1-ORD-001' }, // due now
      { questionId: 'var-2026-verb1-ORD-002' }, // scheduled tomorrow — still active
      { questionId: 'var-2026-verb1-ORD-003' }, // scheduled tomorrow — still active
    ])
    expect(active.ORD).toBe(3)
  })

  it('dueCountsBySection remains a working alias', () => {
    expect(dueCountsBySection([{ questionId: 'host-2022-verb1-MEK-001' }]).MEK).toBe(1)
  })
})

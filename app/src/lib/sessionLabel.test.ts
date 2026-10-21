import { describe, expect, it } from 'vitest'

import { passLabel } from './sessionLabel'

describe('session labels shared by Home and history', () => {
  it.each([
    ['ORD · PÅ TID', 'ORD på tid'],
    ['LÄS · PÅ TID', 'LÄS på tid'],
    ['ORD · ORDBANK', 'Ordbank'],
    ['ORD', 'ORD'],
    ['XYZ', 'XYZ'],
    ['ar:ORD:FW', 'ORD · repetition'],
    ['ar:LÄS:LÄS-TRAP-001', 'LÄS · repetition'],
    [null, 'Övning'],
  ])('labels %s as %s', (sections, label) => {
    expect(passLabel({ kind: 'drill', sections })).toBe(label)
  })

  it('uses the full repetition label by default and offers a short form for Home', () => {
    const row = { kind: 'adaptive_review', sections: 'ORD' }
    expect(passLabel(row)).toBe('Repetition')
    expect(passLabel(row, { short: true })).toBe('Rep')
  })
})

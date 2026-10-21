import { describe, expect, it } from 'vitest'

import { passLabel } from './sessionLabel'

describe('session labels shared by Home and history', () => {
  it.each([
    ['ORD · PÅ TID', 'ORD på tid'],
    ['LÄS · PÅ TID', 'LÄS på tid'],
    ['ORD · ORDBANK', 'Ordbank'],
    ['ORD', 'ORD'],
    ['XYZ', 'XYZ'],
    [null, 'Övning'],
  ])('labels %s as %s', (sections, label) => {
    expect(passLabel({ kind: 'drill', sections })).toBe(label)
  })

  it('keeps the repetition label', () => {
    expect(passLabel({ kind: 'adaptive_review', sections: 'ORD' })).toBe('Rep')
  })
})

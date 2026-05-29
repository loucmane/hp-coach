import { describe, expect, it } from 'vitest'

import { RETENTION_DAYS, retentionCutoff } from './retention'

describe('retentionCutoff', () => {
  it('is exactly RETENTION_DAYS before now', () => {
    const now = new Date('2026-05-29T12:00:00.000Z')
    const cutoff = retentionCutoff(now)
    const deltaDays = (now.getTime() - cutoff.getTime()) / (24 * 60 * 60 * 1000)
    expect(deltaDays).toBe(RETENTION_DAYS)
  })

  it('keeps a comfortable margin past the 90-day read window', () => {
    // The longest read (rolling-90d section breakdown + streak) must stay
    // inside the retained window, with headroom.
    expect(RETENTION_DAYS).toBeGreaterThan(90)
  })
})

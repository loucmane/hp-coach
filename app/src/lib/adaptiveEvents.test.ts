import { beforeEach, describe, expect, it } from 'vitest'

import { __resetAdaptiveEvents, loadAdaptiveEvents, logAdaptiveEvent } from './adaptiveEvents'

describe('adaptiveEvents', () => {
  beforeEach(() => {
    __resetAdaptiveEvents()
  })

  it('starts empty', () => {
    expect(loadAdaptiveEvents()).toEqual([])
  })

  it('records an event with type, meta, and a timestamp', () => {
    const before = Date.now()
    logAdaptiveEvent('offer_shown', { framework_id: 'DTK-TACTIC-004' })
    const events = loadAdaptiveEvents()
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('offer_shown')
    expect(events[0].meta).toEqual({ framework_id: 'DTK-TACTIC-004' })
    expect(events[0].at).toBeGreaterThanOrEqual(before)
  })

  it('appends the full funnel in order', () => {
    logAdaptiveEvent('offer_shown')
    logAdaptiveEvent('offer_accepted')
    logAdaptiveEvent('detour_completed')
    expect(loadAdaptiveEvents().map((e) => e.type)).toEqual([
      'offer_shown',
      'offer_accepted',
      'detour_completed',
    ])
  })

  it('caps the ring buffer at ~500 events, dropping the oldest', () => {
    for (let i = 0; i < 520; i++) {
      logAdaptiveEvent('offer_shown', { i })
    }
    const events = loadAdaptiveEvents()
    expect(events.length).toBeLessThanOrEqual(500)
    expect(events[events.length - 1].meta).toEqual({ i: 519 })
  })

  it('is resilient to corrupt storage', () => {
    window.localStorage.setItem('hpc-adaptive-events', 'not json')
    expect(loadAdaptiveEvents()).toEqual([])
    logAdaptiveEvent('suppressed')
    expect(loadAdaptiveEvents()).toHaveLength(1)
  })
})

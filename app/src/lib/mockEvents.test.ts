import { beforeEach, describe, expect, it } from 'vitest'

import { __resetMockEvents, loadMockEvents, logMockEvent } from './mockEvents'

describe('mockEvents', () => {
  beforeEach(() => {
    __resetMockEvents()
  })

  it('starts empty', () => {
    expect(loadMockEvents()).toEqual([])
  })

  it('records an event with type, meta, and a timestamp', () => {
    const before = Date.now()
    logMockEvent('provpassdag_shown', { half: 'verbal' })
    const events = loadMockEvents()
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('provpassdag_shown')
    expect(events[0].meta).toEqual({ half: 'verbal' })
    expect(events[0].at).toBeGreaterThanOrEqual(before)
  })

  it('appends multiple events in order', () => {
    logMockEvent('confirm_shown')
    logMockEvent('confirm_started')
    logMockEvent('confirm_backed_out')
    const events = loadMockEvents()
    expect(events.map((e) => e.type)).toEqual([
      'confirm_shown',
      'confirm_started',
      'confirm_backed_out',
    ])
  })

  it('accepts an event with no meta', () => {
    logMockEvent('voided')
    expect(loadMockEvents()[0].meta).toBeUndefined()
  })

  it('caps the ring buffer at ~500 events, dropping the oldest', () => {
    for (let i = 0; i < 520; i++) {
      logMockEvent('started_via_line', { i })
    }
    const events = loadMockEvents()
    expect(events.length).toBeLessThanOrEqual(500)
    // Oldest events dropped — the last recorded event (i=519) survives.
    expect(events[events.length - 1].meta).toEqual({ i: 519 })
  })

  it('__resetMockEvents clears the log', () => {
    logMockEvent('window_slid')
    __resetMockEvents()
    expect(loadMockEvents()).toEqual([])
  })

  it('is resilient to corrupt storage', () => {
    window.localStorage.setItem('hpc-mock-events', 'not json')
    expect(loadMockEvents()).toEqual([])
    // logMockEvent should still work after a corrupt read.
    logMockEvent('confirm_shown')
    expect(loadMockEvents()).toHaveLength(1)
  })
})

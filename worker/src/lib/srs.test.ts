// SRS ladder math. Pure functions; no DB, no network — just verify the
// schedule progresses and resets the way the docstring claims.

import { describe, expect, it } from 'vitest'

import {
  FIRST_INTERVAL_MINUTES,
  MAX_INTERVAL_MINUTES,
  nextOnCorrect,
  nextOnWrong,
  RELEARN_MINUTES,
} from './srs'

const NOW = new Date('2026-05-08T10:00:00Z')

describe('nextOnWrong', () => {
  it('always sends the user back to the relearn step', () => {
    const out = nextOnWrong(NOW)
    expect(out.intervalMinutes).toBe(RELEARN_MINUTES)
    expect(out.nextReviewAt.getTime()).toBe(NOW.getTime() + RELEARN_MINUTES * 60_000)
  })

  // Even after the user has worked the mistake all the way to the cap,
  // a wrong answer fully resets — binary feedback can't distinguish
  // "almost right" from "off by a mile", so partial credit is unsafe.
  it('resets even from a long interval', () => {
    // Caller will pass in the row's previous interval, but the function
    // ignores it on wrong — the relearn step is the reset.
    const out = nextOnWrong(NOW)
    expect(out.intervalMinutes).toBe(RELEARN_MINUTES)
  })
})

describe('nextOnCorrect', () => {
  it('jumps from a fresh mistake (interval=0) to the first step (1 day)', () => {
    const out = nextOnCorrect(0, NOW)
    expect(out.graduated).toBe(false)
    if (out.graduated) return
    expect(out.intervalMinutes).toBe(FIRST_INTERVAL_MINUTES)
    expect(out.nextReviewAt.getTime()).toBe(NOW.getTime() + FIRST_INTERVAL_MINUTES * 60_000)
  })

  it('jumps from the relearn step (10 min) to the first step, not 20 min', () => {
    // Otherwise the user gets stuck below 1d forever after a single
    // wrong→right cycle. The ladder must escape the relearn region.
    const out = nextOnCorrect(RELEARN_MINUTES, NOW)
    expect(out.graduated).toBe(false)
    if (out.graduated) return
    expect(out.intervalMinutes).toBe(FIRST_INTERVAL_MINUTES)
  })

  it('doubles a normal-step interval', () => {
    const out = nextOnCorrect(FIRST_INTERVAL_MINUTES, NOW)
    expect(out.graduated).toBe(false)
    if (out.graduated) return
    expect(out.intervalMinutes).toBe(FIRST_INTERVAL_MINUTES * 2)
  })

  it('caps the interval at MAX_INTERVAL_MINUTES (30 days)', () => {
    // Halfway-to-cap doubles to past-cap; should clamp.
    const halfway = MAX_INTERVAL_MINUTES / 2 + 1
    const out = nextOnCorrect(halfway, NOW)
    expect(out.graduated).toBe(false)
    if (out.graduated) return
    expect(out.intervalMinutes).toBe(MAX_INTERVAL_MINUTES)
  })

  it('graduates when the user gets it right after holding the cap', () => {
    const out = nextOnCorrect(MAX_INTERVAL_MINUTES, NOW)
    expect(out.graduated).toBe(true)
  })

  it('graduates regardless of overshoot', () => {
    // Defensive — even if a row somehow has interval > cap (e.g. a future
    // tuning that we didn't migrate), the graduation gate still fires.
    const out = nextOnCorrect(MAX_INTERVAL_MINUTES * 2, NOW)
    expect(out.graduated).toBe(true)
  })
})

describe('full ladder progression', () => {
  it('takes 7 correct answers to graduate from a fresh mistake', () => {
    // Walk: wrong → 7×correct → graduated. The progression is
    //   relearn → 1d → 2d → 4d → 8d → 16d → 30d → graduate
    // i.e. six interval transitions plus a final cap-confirm correct.
    let interval = nextOnWrong(NOW).intervalMinutes
    let steps = 0
    while (steps < 20) {
      const out = nextOnCorrect(interval, NOW)
      steps++
      if (out.graduated) break
      interval = out.intervalMinutes
    }
    expect(steps).toBe(7)
  })
})

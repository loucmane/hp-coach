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

// ── FSRS-lite lapse memory (PL-L.2) ──────────────────────────────────
describe('nextOnWrong — lapse stashes the ladder height', () => {
  it('still relearns today: interval + nextReviewAt unchanged from the reset', () => {
    // The pile invariant: a lapse must keep the 10-min relearn rung so
    // the item stays due today. Only the stash is additive.
    const out = nextOnWrong(NOW, { intervalMinutes: 8 * 24 * 60, lapseIntervalMinutes: null })
    expect(out.intervalMinutes).toBe(RELEARN_MINUTES)
    expect(out.nextReviewAt.getTime()).toBe(NOW.getTime() + RELEARN_MINUTES * 60_000)
  })

  it('stashes the previous height it fell from', () => {
    const eightDays = 8 * 24 * 60
    const out = nextOnWrong(NOW, { intervalMinutes: eightDays })
    expect(out.lapseIntervalMinutes).toBe(eightDays)
  })

  it('a second lapse during relearn keeps the MAX (banked height is not erased)', () => {
    // Row already lapsed from 8d → interval=10, stash=8d. Lapsing again
    // (interval now the relearn rung) must not overwrite 8d with 10.
    const eightDays = 8 * 24 * 60
    const out = nextOnWrong(NOW, {
      intervalMinutes: RELEARN_MINUTES,
      lapseIntervalMinutes: eightDays,
    })
    expect(out.lapseIntervalMinutes).toBe(eightDays)
  })

  it('no prior height → stash is 0 (caller stores NULL)', () => {
    const out = nextOnWrong(NOW)
    expect(out.lapseIntervalMinutes).toBe(0)
    // Regression pin: the no-stash path is byte-identical to the old reset.
    expect(out.intervalMinutes).toBe(RELEARN_MINUTES)
    expect(out.nextReviewAt.getTime()).toBe(NOW.getTime() + RELEARN_MINUTES * 60_000)
  })
})

describe('nextOnCorrect — resumes from the stash at half height', () => {
  it('resumes at half the stashed height and clears the stash', () => {
    const eightDays = 8 * 24 * 60
    const out = nextOnCorrect(RELEARN_MINUTES, NOW, eightDays)
    expect(out.graduated).toBe(false)
    if (out.graduated) return
    expect(out.intervalMinutes).toBe(Math.floor(eightDays * 0.5)) // 4 days
    expect(out.nextReviewAt.getTime()).toBe(NOW.getTime() + Math.floor(eightDays * 0.5) * 60_000)
    expect(out.lapseIntervalMinutes).toBeNull()
  })

  it('floors the resume at FIRST_INTERVAL_MINUTES', () => {
    // Half of a 1-day stash is 12h — below the 1-day floor, so clamp up.
    const out = nextOnCorrect(RELEARN_MINUTES, NOW, FIRST_INTERVAL_MINUTES)
    expect(out.graduated).toBe(false)
    if (out.graduated) return
    expect(out.intervalMinutes).toBe(FIRST_INTERVAL_MINUTES)
    expect(out.lapseIntervalMinutes).toBeNull()
  })

  it('does not graduate while a stash is present (resume wins over the cap gate)', () => {
    // Even a defensively over-cap prevInterval must resume, not graduate,
    // as long as a stash is live — the row is really on the relearn rung.
    const out = nextOnCorrect(MAX_INTERVAL_MINUTES, NOW, MAX_INTERVAL_MINUTES)
    expect(out.graduated).toBe(false)
    if (out.graduated) return
    expect(out.intervalMinutes).toBe(MAX_INTERVAL_MINUTES / 2)
    expect(out.lapseIntervalMinutes).toBeNull()
  })

  it('after resume, later corrects double normally', () => {
    const eightDays = 8 * 24 * 60
    const resumed = nextOnCorrect(RELEARN_MINUTES, NOW, eightDays)
    if (resumed.graduated) throw new Error('unreachable')
    const next = nextOnCorrect(resumed.intervalMinutes, NOW, null)
    if (next.graduated) throw new Error('unreachable')
    expect(next.intervalMinutes).toBe(resumed.intervalMinutes * 2) // 4d → 8d
  })

  it('no-stash path is byte-identical to the pre-FSRS-lite behaviour', () => {
    // Regression pin: passing null/omitted stash must behave exactly like
    // the old two-arg signature at every rung.
    expect(nextOnCorrect(0, NOW)).toMatchObject(nextOnCorrect(0, NOW, null))
    expect(nextOnCorrect(0, NOW, null).graduated).toBe(false)
    const fresh = nextOnCorrect(0, NOW, null)
    if (fresh.graduated) return
    expect(fresh.intervalMinutes).toBe(FIRST_INTERVAL_MINUTES)
    expect(nextOnCorrect(MAX_INTERVAL_MINUTES, NOW, null).graduated).toBe(true)
    expect(nextOnCorrect(MAX_INTERVAL_MINUTES, NOW, 0).graduated).toBe(true) // 0 stash == no stash
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

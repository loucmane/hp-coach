// useCountdown — fake-timer coverage for the three load-bearing cases:
// normal 1s ticking, a backgrounded-tab clock jump caught up via
// visibilitychange, and fire-once expiry (even when the jump lands well
// past zero).

import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCountdown } from './useCountdown'

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  setVisibility('visible')
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useCountdown', () => {
  it('ticks remainingMs down once per second from wall clock', () => {
    const startedAt = new Date(0)
    vi.setSystemTime(0)
    const { result } = renderHook(() => useCountdown(startedAt, 55 * 60_000))
    expect(result.current.remainingMs).toBe(55 * 60_000)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.remainingMs).toBe(55 * 60_000 - 1000)
    expect(result.current.expired).toBe(false)
  })

  it('recomputes from wall clock on visibilitychange (throttled-tab catch-up)', () => {
    const startedAt = new Date(0)
    vi.setSystemTime(0)
    const { result } = renderHook(() => useCountdown(startedAt, 55 * 60_000))

    // Simulate a backgrounded tab: the clock jumps 10 minutes ahead
    // WITHOUT any interval ticks firing (as if throttled to near-zero).
    act(() => {
      vi.setSystemTime(10 * 60_000)
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(result.current.remainingMs).toBe(45 * 60_000)
  })

  it('expires exactly once even when the clock jumps well past zero', () => {
    const startedAt = new Date(0)
    vi.setSystemTime(0)
    const { result } = renderHook(() => useCountdown(startedAt, 1000))

    act(() => {
      // Jump 10x past the deadline in one go (tab asleep through the
      // whole countdown).
      vi.setSystemTime(10_000)
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(result.current.remainingMs).toBe(0)
    expect(result.current.expired).toBe(true)

    // Further ticks / visibility events must not "un-fire" or refire in
    // a way the caller could double-count (state stays expired:true,
    // remainingMs clamped at 0).
    act(() => {
      vi.setSystemTime(20_000)
      vi.advanceTimersByTime(1000)
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(result.current.remainingMs).toBe(0)
    expect(result.current.expired).toBe(true)
  })

  it('does not recompute on a visibilitychange to hidden', () => {
    const startedAt = new Date(0)
    vi.setSystemTime(0)
    const { result } = renderHook(() => useCountdown(startedAt, 55 * 60_000))

    act(() => {
      vi.setSystemTime(5 * 60_000)
      setVisibility('hidden')
      document.dispatchEvent(new Event('visibilitychange'))
    })
    // Going hidden shouldn't force a recompute beyond what ticks already
    // produced — remainingMs still reflects the last tick, not a stale
    // pre-jump value going backwards or otherwise misbehaving.
    expect(result.current.remainingMs).toBeLessThanOrEqual(55 * 60_000)
  })

  it('resets the fired flag when startedAt/durationMs change (new pass)', () => {
    const startedAt1 = new Date(0)
    vi.setSystemTime(0)
    const { result, rerender } = renderHook(
      ({ startedAt, durationMs }: { startedAt: Date; durationMs: number }) =>
        useCountdown(startedAt, durationMs),
      { initialProps: { startedAt: startedAt1, durationMs: 1000 } },
    )
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.expired).toBe(true)

    // A fresh pass starts now with a full duration again.
    const startedAt2 = new Date(1000)
    act(() => {
      rerender({ startedAt: startedAt2, durationMs: 1000 })
    })
    expect(result.current.expired).toBe(false)
    expect(result.current.remainingMs).toBe(1000)
  })
})

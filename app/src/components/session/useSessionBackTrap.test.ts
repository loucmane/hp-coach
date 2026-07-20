// useSessionBackTrap — history contract tests (jsdom), mirroring the
// proven takeover-history patterns in LandingBakeoffR3.logic.test.ts.
//
// The trap's job: while a drill/diagnostic session is ACTIVE, one browser
// back gesture must NOT silently discard the session. The hook pushes a
// single marker entry when the session starts; a popstate past it re-arms
// the marker and surfaces the confirm sheet (onBackAttempt); leaving for
// real goes through `leave()`, which suppresses the trap and performs the
// real back past both entries.

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useSessionBackTrap } from './useSessionBackTrap'

describe('useSessionBackTrap — back-gesture contract', () => {
  it('pushes exactly one marker entry when the session becomes active', () => {
    const before = window.history.length
    renderHook(({ a }) => useSessionBackTrap(a, () => {}), { initialProps: { a: true } })
    expect(window.history.length).toBe(before + 1)
    expect((window.history.state as { hpcSessionTrap?: boolean } | null)?.hpcSessionTrap).toBe(true)
  })

  it('does not push a second entry when the marker is already current (StrictMode remount)', () => {
    const first = renderHook(({ a }) => useSessionBackTrap(a, () => {}), {
      initialProps: { a: true },
    })
    const after = window.history.length
    first.unmount()
    renderHook(({ a }) => useSessionBackTrap(a, () => {}), { initialProps: { a: true } })
    expect(window.history.length).toBe(after)
  })

  it('does not arm while inactive (idle/done phases): no push, no trap', () => {
    const onBack = vi.fn()
    const before = window.history.length
    renderHook(({ a }) => useSessionBackTrap(a, onBack), { initialProps: { a: false } })
    expect(window.history.length).toBe(before)
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }))
    })
    expect(onBack).not.toHaveBeenCalled()
  })

  it('a pop that still lands on a marker entry is bookkeeping — no confirm', () => {
    const onBack = vi.fn()
    renderHook(({ a }) => useSessionBackTrap(a, onBack), { initialProps: { a: true } })
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: { hpcSessionTrap: true } }))
    })
    expect(onBack).not.toHaveBeenCalled()
  })

  it('a real back gesture surfaces the confirm AND re-arms the marker', async () => {
    const onBack = vi.fn()
    renderHook(({ a }) => useSessionBackTrap(a, onBack), { initialProps: { a: true } })
    act(() => {
      window.history.back()
    })
    // jsdom traverses asynchronously; wait for the popstate to land.
    await vi.waitFor(() => expect(onBack).toHaveBeenCalledTimes(1))
    // Re-armed: the marker entry is current again, so a second reflexive
    // back-swipe is trapped too instead of leaving the SPA.
    expect((window.history.state as { hpcSessionTrap?: boolean } | null)?.hpcSessionTrap).toBe(true)
  })

  it('leave() performs the real back without re-surfacing the confirm', async () => {
    const onBack = vi.fn()
    // Give the trap a known "previous route" entry to land on.
    act(() => {
      window.history.pushState({ marker: 'prev-route' }, '')
      window.history.pushState({ marker: 'session-route' }, '')
    })
    const hook = renderHook(({ a }) => useSessionBackTrap(a, onBack), {
      initialProps: { a: true },
    })
    act(() => {
      hook.result.current.leave()
    })
    await vi.waitFor(() =>
      expect((window.history.state as { marker?: string } | null)?.marker).toBe('prev-route'),
    )
    expect(onBack).not.toHaveBeenCalled()
  })

  it('deactivation (session completes) consumes the marker entry silently', async () => {
    const onBack = vi.fn()
    const hook = renderHook(({ a }) => useSessionBackTrap(a, onBack), {
      initialProps: { a: true },
    })
    expect((window.history.state as { hpcSessionTrap?: boolean } | null)?.hpcSessionTrap).toBe(true)
    act(() => {
      hook.rerender({ a: false })
    })
    await vi.waitFor(() =>
      expect(
        (window.history.state as { hpcSessionTrap?: boolean } | null)?.hpcSessionTrap,
      ).toBeFalsy(),
    )
    expect(onBack).not.toHaveBeenCalled()
  })
})

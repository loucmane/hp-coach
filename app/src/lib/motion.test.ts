// Tests for withViewTransition — the theme-crossfade helper (task W3).
//
// jsdom has no `document.startViewTransition`, so every test manages the
// presence of that API explicitly via `installStartViewTransition` /
// `removeStartViewTransition` below, and mocks `window.matchMedia` to
// control the `prefers-reduced-motion` branch.

import { render } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  __resetFirstContentSignalForTests,
  dispatchFirstContent,
  hasFirstContentFired,
  useFirstContentSignal,
  withViewTransition,
} from './motion'

function mockMatchMedia(reduced: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reduced : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

function installStartViewTransition() {
  const startViewTransition = vi.fn((cb: () => void) => {
    cb()
    return {
      ready: Promise.resolve(),
      updateCallbackDone: Promise.resolve(),
      finished: Promise.resolve(),
      skipTransition: vi.fn(),
    }
  })
  Object.defineProperty(document, 'startViewTransition', {
    value: startViewTransition,
    configurable: true,
    writable: true,
  })
  return startViewTransition
}

function removeStartViewTransition() {
  if ('startViewTransition' in document) {
    delete (document as { startViewTransition?: unknown }).startViewTransition
  }
}

describe('withViewTransition', () => {
  afterEach(() => {
    removeStartViewTransition()
    vi.restoreAllMocks()
  })

  it('runs fn inside document.startViewTransition when the API is available', () => {
    mockMatchMedia(false)
    const startViewTransition = installStartViewTransition()
    const fn = vi.fn()

    withViewTransition(fn)

    expect(startViewTransition).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('falls back to a plain synchronous call when startViewTransition is unavailable (Firefox)', () => {
    mockMatchMedia(false)
    removeStartViewTransition()
    expect(document.startViewTransition).toBeUndefined()
    const fn = vi.fn()

    withViewTransition(fn)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('skips the transition under prefers-reduced-motion: reduce, even when the API is available', () => {
    mockMatchMedia(true)
    const startViewTransition = installStartViewTransition()
    const fn = vi.fn()

    withViewTransition(fn)

    expect(startViewTransition).not.toHaveBeenCalled()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('still calls fn exactly once when reduced motion is on and the API is unavailable', () => {
    mockMatchMedia(true)
    removeStartViewTransition()
    const fn = vi.fn()

    withViewTransition(fn)

    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('dispatchFirstContent / useFirstContentSignal — boot veil one-shot (#305)', () => {
  afterEach(() => {
    __resetFirstContentSignalForTests()
  })

  it('dispatches hpc:first-content exactly once, even when called repeatedly', () => {
    const onSignal = vi.fn()
    window.addEventListener('hpc:first-content', onSignal)

    dispatchFirstContent()
    dispatchFirstContent()
    dispatchFirstContent()

    window.removeEventListener('hpc:first-content', onSignal)
    expect(onSignal).toHaveBeenCalledTimes(1)
  })

  it('sets the synchronous __hpcFirstContentFired flag alongside the event', () => {
    expect(hasFirstContentFired()).toBe(false)
    dispatchFirstContent()
    expect(hasFirstContentFired()).toBe(true)
  })

  it('stays one-shot app-wide across independent callers (a second caller is a no-op)', () => {
    const onSignal = vi.fn()
    window.addEventListener('hpc:first-content', onSignal)

    dispatchFirstContent() // caller A (e.g. Skrift)
    dispatchFirstContent() // caller B (e.g. a route's useFirstContentSignal)

    window.removeEventListener('hpc:first-content', onSignal)
    expect(onSignal).toHaveBeenCalledTimes(1)
  })

  it('useFirstContentSignal fires the signal once on mount', () => {
    const onSignal = vi.fn()
    window.addEventListener('hpc:first-content', onSignal)

    function Probe() {
      useFirstContentSignal()
      return null
    }
    render(createElement(Probe))

    window.removeEventListener('hpc:first-content', onSignal)
    expect(onSignal).toHaveBeenCalledTimes(1)
    expect(hasFirstContentFired()).toBe(true)
  })

  it('useFirstContentSignal does not re-fire the app-wide signal on re-render', () => {
    const onSignal = vi.fn()
    window.addEventListener('hpc:first-content', onSignal)

    function Probe({ n }: { n: number }) {
      useFirstContentSignal()
      return createElement('span', null, n)
    }
    const { rerender } = render(createElement(Probe, { n: 1 }))
    rerender(createElement(Probe, { n: 2 }))
    rerender(createElement(Probe, { n: 3 }))

    window.removeEventListener('hpc:first-content', onSignal)
    expect(onSignal).toHaveBeenCalledTimes(1)
  })
})

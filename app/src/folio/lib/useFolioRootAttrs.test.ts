import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type FolioPrefsValues, useFolioPrefs } from './folioPrefs'
import { useFolioMotion } from './useFolioMotion'
import { useFolioRootAttrs } from './useFolioRootAttrs'

const DARK = '(prefers-color-scheme: dark)'
const REDUCE = '(prefers-reduced-motion: reduce)'

/** A matchMedia whose answers the test flips live, firing `change` like a browser. */
function mockMedia(initial: Record<string, boolean> = {}) {
  const matches = new Map(Object.entries(initial))
  const listeners = new Map<string, Set<() => void>>()
  const of = (query: string) => {
    let set = listeners.get(query)
    if (!set) {
      set = new Set()
      listeners.set(query, set)
    }
    return set
  }
  window.matchMedia = vi.fn((query: string) => ({
    get matches() {
      return matches.get(query) ?? false
    },
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: () => void) => {
      of(query).add(listener)
    },
    removeEventListener: (_type: string, listener: () => void) => {
      of(query).delete(listener)
    },
    addListener: (listener: () => void) => {
      of(query).add(listener)
    },
    removeListener: (listener: () => void) => {
      of(query).delete(listener)
    },
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
  return {
    set(query: string, value: boolean) {
      matches.set(query, value)
      for (const listener of [...of(query)]) listener()
    },
    listeners: (query: string) => of(query).size,
  }
}

const original = window.matchMedia
let media: ReturnType<typeof mockMedia>

beforeEach(() => {
  localStorage.clear()
  useFolioPrefs.getState().resetPrefs()
  media = mockMedia()
})

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: original,
  })
})

const setPrefs = (patch: Partial<FolioPrefsValues>) =>
  act(() => useFolioPrefs.getState().setPrefs(patch))

describe('useFolioRootAttrs', () => {
  it('resolves the defaults: system theme on a light OS, Spalt, full motion, keys on', () => {
    const { result } = renderHook(() => useFolioRootAttrs())
    expect(result.current).toEqual({
      'data-theme': 'light',
      'data-palette': 'spalt',
      'data-motion': 'full',
      'data-kbd': 'on',
      'data-text': 'normal',
    })
  })

  it('follows prefers-color-scheme live while the theme is Som systemet', () => {
    media = mockMedia({ [DARK]: true })
    const { result } = renderHook(() => useFolioRootAttrs())
    expect(result.current['data-theme']).toBe('dark')
    act(() => media.set(DARK, false))
    expect(result.current['data-theme']).toBe('light')
    act(() => media.set(DARK, true))
    expect(result.current['data-theme']).toBe('dark')
  })

  it('an explicit Ljust or Mörkt ignores the OS', () => {
    media = mockMedia({ [DARK]: true })
    const { result } = renderHook(() => useFolioRootAttrs())
    setPrefs({ theme: 'light' })
    expect(result.current['data-theme']).toBe('light')
    act(() => media.set(DARK, false))
    setPrefs({ theme: 'dark' })
    expect(result.current['data-theme']).toBe('dark')
    act(() => media.set(DARK, true))
    act(() => media.set(DARK, false))
    expect(result.current['data-theme']).toBe('dark')
  })

  it('resolves motion: Som systemet honours prefers-reduced-motion live, Mindre and Ingen hold', () => {
    const { result } = renderHook(() => useFolioRootAttrs())
    expect(result.current['data-motion']).toBe('full')
    act(() => media.set(REDUCE, true))
    expect(result.current['data-motion']).toBe('none')
    setPrefs({ motion: 'less' })
    expect(result.current['data-motion']).toBe('less')
    act(() => media.set(REDUCE, false))
    expect(result.current['data-motion']).toBe('less')
    setPrefs({ motion: 'none' })
    expect(result.current['data-motion']).toBe('none')
    setPrefs({ motion: 'system' })
    expect(result.current['data-motion']).toBe('full')
  })

  it('passes kbd, text size and palette through', () => {
    const { result } = renderHook(() => useFolioRootAttrs())
    setPrefs({ kbd: false, textSize: 'xlarge', palette: 'ink' })
    expect(result.current).toMatchObject({
      'data-kbd': 'off',
      'data-text': 'xlarge',
      'data-palette': 'ink',
    })
  })

  it('keeps the same object while nothing changes', () => {
    const { result, rerender } = renderHook(() => useFolioRootAttrs())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })

  it('drops its media listeners on unmount', () => {
    const { unmount } = renderHook(() => useFolioRootAttrs())
    expect(media.listeners(DARK)).toBeGreaterThan(0)
    expect(media.listeners(REDUCE)).toBeGreaterThan(0)
    unmount()
    expect(media.listeners(DARK)).toBe(0)
    expect(media.listeners(REDUCE)).toBe(0)
  })

  it('falls back to light and full motion where matchMedia is missing', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: undefined,
    })
    const { result } = renderHook(() => useFolioRootAttrs())
    expect(result.current).toMatchObject({ 'data-theme': 'light', 'data-motion': 'full' })
  })
})

// useFolioMotion shares the motion resolution, so its tests live here.
describe('useFolioMotion', () => {
  it('allows motion by default, with the system.css tokens', () => {
    const { result } = renderHook(() => useFolioMotion())
    expect(result.current).toEqual({
      allowed: true,
      level: 'full',
      durations: { d1: 140, d2: 260, d3: 600 },
      ease: [0.2, 0.7, 0.2, 1],
      scrollBehavior: 'smooth',
    })
  })

  it('turns motion off live when the OS asks for reduced motion under Som systemet', () => {
    const { result } = renderHook(() => useFolioMotion())
    act(() => media.set(REDUCE, true))
    expect(result.current).toMatchObject({ allowed: false, level: 'none', scrollBehavior: 'auto' })
    expect(result.current.durations).toEqual({ d1: 140, d2: 260, d3: 600 })
    act(() => media.set(REDUCE, false))
    expect(result.current).toMatchObject({ allowed: true, level: 'full' })
  })

  it('disallows motion under Mindre and Ingen, whatever the OS says', () => {
    const { result } = renderHook(() => useFolioMotion())
    setPrefs({ motion: 'less' })
    expect(result.current).toMatchObject({ allowed: false, level: 'less', scrollBehavior: 'auto' })
    setPrefs({ motion: 'none' })
    expect(result.current).toMatchObject({ allowed: false, level: 'none', scrollBehavior: 'auto' })
  })

  it('returns one stable object per level', () => {
    const { result, rerender } = renderHook(() => useFolioMotion())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})

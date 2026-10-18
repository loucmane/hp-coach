import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_THEME } from '@/lib/tokens'

import { useCoachStore } from './coachStore'
import { useDaysRemaining, useExamStore, useSitting } from './examStore'
import { applyThemeToDocument, useUiStore } from './uiStore'

beforeEach(() => {
  // Wipe persisted state between tests so localStorage from a previous run
  // can't bleed into the next one.
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
  // Reset every store so cross-test bleed never confuses state.
  useCoachStore.setState({ coach: 'taktiker' })
  useExamStore.setState({ sittingId: null })
  useUiStore.setState({ ...DEFAULT_THEME })
  // Clear any inline vars or .dark class set during applyThemeToDocument.
  document.documentElement.removeAttribute('style')
  document.documentElement.classList.remove('dark')
})

describe('useCoachStore', () => {
  it('defaults to taktiker', () => {
    expect(useCoachStore.getState().coach).toBe('taktiker')
  })
  it('setCoach swaps the active voice', () => {
    useCoachStore.getState().setCoach('professor')
    expect(useCoachStore.getState().coach).toBe('professor')
  })
})

describe('useExamStore + useSitting + useDaysRemaining', () => {
  // Render, read, unmount: no hook stays subscribed when afterEach resets
  // the store (a re-render outside act() would warn).
  const read = <T>(hook: () => T): T => {
    const { result, unmount } = renderHook(hook)
    const value = result.current
    unmount()
    return value
  }
  const sittingAt = (now?: Date) => read(() => useSitting(now))
  const daysAt = (now?: Date) => read(() => useDaysRemaining(now))

  it('saves no target by default', () => {
    expect(useExamStore.getInitialState().sittingId).toBeNull()
  })
  it('setSitting updates the active sitting', () => {
    useExamStore.getState().setSitting('var-2027')
    expect(useExamStore.getState().sittingId).toBe('var-2027')
  })
  it('setSitting ignores unknown ids', () => {
    useExamStore.getState().setSitting('host-2026')
    useExamStore.getState().setSitting('host-9999' as 'host-2026')
    expect(useExamStore.getState().sittingId).toBe('host-2026')
  })
  it('defaults to the next sitting not yet over', () => {
    expect(sittingAt(new Date(2026, 9, 1, 12, 0)).id).toBe('host-2026')
    expect(sittingAt(new Date(2026, 9, 18, 23, 30)).id).toBe('host-2026')
    expect(sittingAt(new Date(2026, 9, 19, 0, 30)).id).toBe('var-2027')
  })
  it('useDaysRemaining computes against today=fixed', () => {
    expect(daysAt(new Date(2026, 4, 6))).toBe(165)
  })
  it('counts 0 through the exam day of a saved target', () => {
    useExamStore.getState().setSitting('host-2026')
    expect(sittingAt(new Date(2026, 9, 18, 9, 0)).id).toBe('host-2026')
    expect(daysAt(new Date(2026, 9, 18, 9, 0))).toBe(0)
    expect(daysAt(new Date(2026, 9, 18, 23, 30))).toBe(0)
  })
  it('rolls a saved höstprov 26 target to vårprov 27 on 19 October, read-side only', () => {
    useExamStore.getState().setSitting('host-2026')
    const now = new Date(2026, 9, 19, 0, 30)
    expect(sittingAt(now).label).toBe('Vårprov 27')
    expect(daysAt(now)).toBe(173)
    // The saved id (and so the server row it mirrors) is never rewritten.
    expect(useExamStore.getState().sittingId).toBe('host-2026')
  })
  it('keeps a saved vårprov 27 target while höstprov 26 is still ahead', () => {
    useExamStore.getState().setSitting('var-2027')
    expect(sittingAt(new Date(2026, 9, 1, 12, 0)).id).toBe('var-2027')
  })
  it('falls back to the last configured sitting once every sitting is over', () => {
    useExamStore.getState().setSitting('host-2026')
    const now = new Date(2027, 3, 11, 0, 30)
    expect(sittingAt(now).id).toBe('var-2027')
    expect(daysAt(now)).toBe(-1)
  })
  it('reads the system clock when no instant is passed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 19, 0, 30))
    useExamStore.getState().setSitting('host-2026')
    expect(sittingAt().id).toBe('var-2027')
    expect(daysAt()).toBe(173)
  })
})

describe('useUiStore', () => {
  it('defaults match the prototype canvas defaults', () => {
    const s = useUiStore.getState()
    // Boksidan (2026): default palette is Spalt (L12 ivory + cobalt).
    expect(s.palette).toBe('spalt')
    expect(s.mode).toBe('light')
    // Phase A.6V Edition Strip — defaults now come from the
    // Editorial edition bundle: literary font, comfy density, StyleA
    // drill layout. `edition` itself isn't stored — the active
    // edition is derived from (font, density, drillLayout) via
    // resolveEdition / useActiveEdition. See docs/edition-strip.md.
    expect(s.font).toBe('literary')
    expect(s.density).toBe('comfy')
    expect(s.drillLayout).toBe('a')
    expect(s.useFluid).toBe(true)
    expect(s.studioRails).toBe(false)
  })

  it('toggleMode flips light <-> dark', () => {
    useUiStore.getState().toggleMode()
    expect(useUiStore.getState().mode).toBe('dark')
    useUiStore.getState().toggleMode()
    expect(useUiStore.getState().mode).toBe('light')
  })

  it('setPalette swaps the palette', () => {
    useUiStore.getState().setPalette('rose')
    expect(useUiStore.getState().palette).toBe('rose')
  })

  it('setFont and setDensity swap their respective axes', () => {
    useUiStore.getState().setFont('hyperlegible')
    useUiStore.getState().setDensity('comfy')
    expect(useUiStore.getState().font).toBe('hyperlegible')
    expect(useUiStore.getState().density).toBe('comfy')
  })

  it('toggleStudioRails flips the studio side-rails preference', () => {
    expect(useUiStore.getState().studioRails).toBe(false)
    useUiStore.getState().toggleStudioRails()
    expect(useUiStore.getState().studioRails).toBe(true)
    useUiStore.getState().toggleStudioRails()
    expect(useUiStore.getState().studioRails).toBe(false)
  })

  it('applyThemeToDocument writes vars + classes + datasets to <html> (stepwise)', () => {
    // useFluid=false: density vars are plain pixel values, matching
    // the pre-Phase-A canonical stepwise behavior.
    act(() => applyThemeToDocument('sage', 'dark', 'geometric', 'compact', false))
    const root = document.documentElement
    // Sage dark bg from the prototype's tokens.jsx
    expect(root.style.getPropertyValue('--bg')).toBe('oklch(0.18 0.014 200)')
    expect(root.style.getPropertyValue('--pad')).toBe('14px')
    expect(root.style.getPropertyValue('--font-display')).toContain('Geist')
    expect(root.classList.contains('dark')).toBe(true)
    expect(root.dataset.palette).toBe('sage')
    expect(root.dataset.font).toBe('geometric')
    expect(root.dataset.density).toBe('compact')
    expect(root.dataset.fluid).toBe('off')
  })

  it('applyThemeToDocument emits clamp() padding when fluid is on (default)', () => {
    // useFluid defaults true (Phase A responsive default). Density
    // padding should be a clamp() between the stepwise baseline and a
    // 1.5×-ish max — actual numbers tested by checking it starts with
    // 'clamp(' and contains the baseline value.
    act(() => applyThemeToDocument('sand', 'light', 'literary', 'regular'))
    const root = document.documentElement
    const pad = root.style.getPropertyValue('--pad')
    expect(pad.startsWith('clamp(')).toBe(true)
    // The regular density baseline is 18px; it must appear as the lower bound.
    expect(pad).toContain('18px')
    expect(root.dataset.fluid).toBe('on')
  })

  it('applyThemeToDocument removes .dark when mode is light', () => {
    act(() => applyThemeToDocument('sand', 'dark', 'literary', 'regular'))
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    act(() => applyThemeToDocument('sand', 'light', 'literary', 'regular'))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})

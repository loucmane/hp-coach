import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_THEME } from '@/lib/tokens'

import { useCoachStore } from './coachStore'
import { useDaysRemaining, useExamStore } from './examStore'
import { applyThemeToDocument, useUiStore } from './uiStore'

beforeEach(() => {
  // Wipe persisted state between tests so localStorage from a previous run
  // can't bleed into the next one.
  localStorage.clear()
})

afterEach(() => {
  // Reset every store so cross-test bleed never confuses state.
  useCoachStore.setState({ coach: 'taktiker' })
  useExamStore.setState({ sittingId: 'host-2026' })
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

describe('useExamStore + useDaysRemaining', () => {
  it('defaults to höstprov 26', () => {
    expect(useExamStore.getState().sittingId).toBe('host-2026')
  })
  it('setSitting updates the active sitting', () => {
    useExamStore.getState().setSitting('var-2027')
    expect(useExamStore.getState().sittingId).toBe('var-2027')
  })
  it('setSitting ignores unknown ids', () => {
    useExamStore.getState().setSitting('host-9999' as 'host-2026')
    expect(useExamStore.getState().sittingId).toBe('host-2026')
  })
  it('useDaysRemaining computes against today=fixed', () => {
    const { result } = renderHook(() => useDaysRemaining(new Date(2026, 4, 6)))
    expect(result.current).toBe(172)
  })
})

describe('useUiStore', () => {
  it('defaults match the prototype canvas defaults', () => {
    const s = useUiStore.getState()
    expect(s.palette).toBe('sand')
    expect(s.mode).toBe('light')
    expect(s.font).toBe('literary')
    expect(s.density).toBe('regular')
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

import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useCoachStore } from './coachStore'
import { useDaysRemaining, useExamStore } from './examStore'
import { applyUiToDocument, useUiStore } from './uiStore'

beforeEach(() => {
  // Wipe persisted state between tests so localStorage from a previous run
  // can't bleed into the next one.
  localStorage.clear()
})

afterEach(() => {
  // Reset every store between tests so cross-test bleed never confuses state.
  useCoachStore.setState({ coach: 'taktiker' })
  useExamStore.setState({ sittingId: 'host-2026' })
  useUiStore.setState({ theme: 'light', density: 'regular' })
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
  it('toggleTheme flips light <-> dark', () => {
    useUiStore.getState().toggleTheme()
    expect(useUiStore.getState().theme).toBe('dark')
    useUiStore.getState().toggleTheme()
    expect(useUiStore.getState().theme).toBe('light')
  })

  it('applyUiToDocument writes density vars to <html>', () => {
    act(() => applyUiToDocument('light', 'compact'))
    const root = document.documentElement
    expect(root.style.getPropertyValue('--pad')).toBe('14px')
    expect(root.style.getPropertyValue('--gap')).toBe('10px')
    expect(root.classList.contains('dark')).toBe(false)
    act(() => applyUiToDocument('dark', 'regular'))
    expect(root.classList.contains('dark')).toBe(true)
    expect(root.style.getPropertyValue('--pad')).toBe('18px')
    // Reset so other tests don't see the .dark class
    act(() => applyUiToDocument('light', 'regular'))
  })
})

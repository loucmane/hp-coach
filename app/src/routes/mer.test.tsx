import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { setSitting } = vi.hoisted(() => ({ setSitting: vi.fn() }))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  useNavigate: () => vi.fn(),
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}))
vi.mock('@/api/useSyncedPrefs', () => ({ useSyncedPrefs: () => ({ setSitting }) }))
vi.mock('@/components/MobileFrame', () => ({
  MobileFrame: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/components/Page', () => ({ Page: ({ children }: { children: ReactNode }) => children }))
vi.mock('@/components/drill/DrillRailSection', () => ({
  DrillRailSection: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/lib/devSurface', () => ({ isDevSurface: vi.fn(() => true) }))

import { isDevSurface } from '@/lib/devSurface'
import { DESIGN_DIRECTIONS, useDesignStore } from '@/stores/designStore'
import { useExamStore } from '@/stores/examStore'
import { useUiStore } from '@/stores/uiStore'
import { Route } from './mer'

const MerRoute = Route.options.component!

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 21, 12))
  setSitting.mockReset().mockResolvedValue(undefined)
  vi.mocked(isDevSurface).mockReturnValue(true)
  useDesignStore.setState({ direction: null })
  useExamStore.setState({ sittingId: null })
  useUiStore.setState({ folioPreview: false })
  localStorage.clear()
})

afterEach(() => vi.useRealTimers())

describe('/mer exam sitting', () => {
  it('offers upcoming sittings in production and saves a choice through synced prefs', () => {
    vi.mocked(isDevSurface).mockReturnValue(false)
    render(<MerRoute />)
    expect(screen.getByText('Prov', { exact: true })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Prov:/ })).toHaveLength(2)
    const spring = screen.getByRole('button', { name: 'Prov: Vårprov 27' })
    expect(spring).toHaveAttribute('aria-pressed', 'true')
    const autumn = screen.getByRole('button', { name: 'Prov: Höstprov 27' })
    expect(autumn).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('button', { name: 'Prov: Höstprov 26' })).toBeNull()
    fireEvent.click(autumn)
    expect(setSitting).toHaveBeenCalledExactlyOnceWith('host-2027')
    expect(useExamStore.getState().sittingId).toBeNull()
  })

  it('keeps the current exam selectable throughout exam day', () => {
    vi.setSystemTime(new Date(2026, 9, 18, 23, 59, 59))
    useExamStore.setState({ sittingId: 'var-2027' })
    render(<MerRoute />)
    expect(screen.getAllByRole('button', { name: /^Prov:/ })).toHaveLength(3)
    const autumn = screen.getByRole('button', { name: 'Prov: Höstprov 26' })
    expect(autumn).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Prov: Vårprov 27' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(autumn)
    expect(setSitting).toHaveBeenCalledExactlyOnceWith('host-2026')
  })

  it('handles a rejected synced write without an unhandled promise', async () => {
    setSitting.mockRejectedValueOnce(new Error('offline'))
    render(<MerRoute />)
    fireEvent.click(screen.getByRole('button', { name: 'Prov: Vårprov 27' }))
    await Promise.resolve()
    expect(setSitting).toHaveBeenCalledExactlyOnceWith('var-2027')
  })
})

describe('/mer design direction', () => {
  it('offers and persists the preview outside dev, with a way back', () => {
    vi.mocked(isDevSurface).mockReturnValue(false)
    render(<MerRoute />)
    expect(screen.getByText('Design', { exact: true })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ny design (förhandsvisning)' }))
    expect(useUiStore.getState().folioPreview).toBe(true)
    expect(JSON.parse(localStorage.getItem('hpc-ui')!).state.folioPreview).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Klassisk' }))
    expect(useUiStore.getState().folioPreview).toBe(false)
  })
  it('offers nine choices, marks the active one and writes only the device preference', () => {
    render(<MerRoute />)
    expect(screen.getByRole('heading', { name: 'Designriktning' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Riktning:/ })).toHaveLength(9)
    expect(screen.getByRole('button', { name: 'Riktning: vanliga appen' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    for (const { key, name } of DESIGN_DIRECTIONS) {
      const button = screen.getByRole('button', { name: `Riktning: ${name}` })
      fireEvent.click(button)
      expect(button).toHaveAttribute('aria-pressed', 'true')
      expect(useDesignStore.getState().direction).toBe(key)
      expect(localStorage.getItem('hpc-design-direction')).toBe(JSON.stringify(key))
    }
    fireEvent.click(screen.getByRole('button', { name: 'Riktning: vanliga appen' }))
    expect(useDesignStore.getState().direction).toBeNull()
  })

  it('hides the entire section outside the dev surface, even with a saved direction', () => {
    useDesignStore.setState({ direction: 'a' })
    vi.mocked(isDevSurface).mockReturnValue(false)
    render(<MerRoute />)
    expect(screen.queryByRole('heading', { name: 'Designriktning' })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Riktning:/ })).toBeNull()
  })
})

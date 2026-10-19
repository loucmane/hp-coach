import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  useNavigate: () => vi.fn(),
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}))
vi.mock('@/api/useSyncedPrefs', () => ({ useSyncedPrefs: () => ({}) }))
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
import { Route } from './mer'

const MerRoute = Route.options.component!

beforeEach(() => {
  vi.mocked(isDevSurface).mockReturnValue(true)
  useDesignStore.setState({ direction: null })
  localStorage.clear()
})

describe('/mer design direction', () => {
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

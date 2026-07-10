// TweaksLauncher gating — task #76 (dev chrome hidden from normal
// product chrome; the mobile overlap regression got fixed alongside).

import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

let mockViewport: 'phone' | 'reader' | 'studio' = 'reader'
vi.mock('@/hooks/useViewport', () => ({
  useViewport: () => mockViewport,
}))

let mockDevSurface = true
vi.mock('@/lib/devSurface', () => ({
  isDevSurface: () => mockDevSurface,
}))

vi.mock('@tanstack/react-router', () => ({
  useRouterState: () => '/',
  Link: ({
    children,
    to,
    ...rest
  }: {
    children?: React.ReactNode
    to: string
    [key: string]: unknown
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

import { TweaksLauncher } from './TweaksLauncher'

describe('TweaksLauncher — dev-surface gating', () => {
  afterEach(() => {
    sessionStorage.clear()
    mockViewport = 'reader'
    mockDevSurface = true
  })

  it('renders when the dev surface gate is on', () => {
    mockDevSurface = true
    render(<TweaksLauncher />)
    expect(screen.getByRole('link', { name: 'Öppna design-tweaks' })).toBeInTheDocument()
  })

  it('is absent from normal product chrome when the dev surface gate is off', () => {
    mockDevSurface = false
    render(<TweaksLauncher />)
    expect(screen.queryByRole('link', { name: 'Öppna design-tweaks' })).not.toBeInTheDocument()
  })

  it('lifts above the phone tab bar instead of the bare bottom:18 offset', () => {
    mockViewport = 'phone'
    render(<TweaksLauncher />)
    const link = screen.getByRole('link', { name: 'Öppna design-tweaks' })
    expect(link.style.bottom).toBe('calc(var(--frame-tabbar) + 12px)')
  })

  it('keeps the reader/studio bottom:18 offset (no bottom chrome to clash with there)', () => {
    mockViewport = 'reader'
    render(<TweaksLauncher />)
    const link = screen.getByRole('link', { name: 'Öppna design-tweaks' })
    expect(link.style.bottom).toBe('18px')
  })
})

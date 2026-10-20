// CommandPalette a11y regression net (2026-07 a11y pass; PRD § 6.4 — ⌘K
// is a hard requirement, so this surface matters). The search input had
// no accessible name (placeholder alone doesn't count) — fixed with
// aria-label="Sök kommandon" in CommandPalette.tsx. This guards against
// that regressing, plus the general DOM-shape half of WCAG AA (axe's
// color-contrast is disabled under jsdom — see src/test/a11y.ts).

import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@/lib/devSurface', () => ({
  isDevSurface: vi.fn(() => false),
}))

import { isDevSurface } from '@/lib/devSurface'
import { DESIGN_DIRECTIONS, useDesignStore } from '@/stores/designStore'
import { formatViolations, runAxe } from '@/test/a11y'
import { CommandPalette } from './CommandPalette'

function openPalette() {
  fireEvent.keyDown(window, { key: 'k', metaKey: true })
}

beforeEach(() => {
  vi.mocked(isDevSurface).mockReturnValue(false)
  useDesignStore.setState({ direction: null })
  localStorage.clear()
})

describe('CommandPalette', () => {
  // The dev affordances that used to float as pills (tweaks,
  // share-debug) live here now — but never in prod sessions
  // (isDevSurface mocked false above).
  it('hides the dev-only commands when the dev gate is off', () => {
    render(<CommandPalette />)
    openPalette()
    expect(screen.queryByText('Dev panel')).toBeNull()
    expect(screen.queryByText('Kopiera felsökningssnapshot')).toBeNull()
    expect(screen.queryByRole('button', { name: /^Riktning:/ })).toBeNull()
  })

  it('selects every direction and restores the normal app from dev commands', () => {
    vi.mocked(isDevSurface).mockReturnValue(true)
    render(<CommandPalette />)
    for (const { key, name } of DESIGN_DIRECTIONS) {
      openPalette()
      expect(screen.getAllByRole('button', { name: /^Riktning:/ })).toHaveLength(10)
      fireEvent.click(screen.getByRole('button', { name: `Riktning: ${name}` }))
      expect(useDesignStore.getState().direction).toBe(key)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    }
    openPalette()
    fireEvent.click(screen.getByRole('button', { name: 'Riktning: vanliga appen' }))
    expect(useDesignStore.getState().direction).toBeNull()
  })

  it('is closed by default', () => {
    render(<CommandPalette />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens on Cmd+K with a labelled search input', () => {
    render(<CommandPalette />)
    openPalette()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    // #root is a stacking context; overlays must share the body's layer
    // with the full-viewport direction shell so Cmd+K remains above it.
    expect(screen.getByRole('dialog').parentElement).toBe(document.body)
    expect(screen.getByRole('textbox', { name: 'Sök kommandon' })).toBeInTheDocument()
  })

  it('has no axe violations when open', async () => {
    render(<CommandPalette />)
    openPalette()
    const violations = await runAxe()
    expect(violations, formatViolations(violations)).toEqual([])
  })
})

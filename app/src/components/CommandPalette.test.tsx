// CommandPalette a11y regression net (2026-07 a11y pass; PRD § 6.4 — ⌘K
// is a hard requirement, so this surface matters). The search input had
// no accessible name (placeholder alone doesn't count) — fixed with
// aria-label="Sök kommandon" in CommandPalette.tsx. This guards against
// that regressing, plus the general DOM-shape half of WCAG AA (axe's
// color-contrast is disabled under jsdom — see src/test/a11y.ts).

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@/lib/devSurface', () => ({
  isDevSurface: () => false,
}))

import { formatViolations, runAxe } from '@/test/a11y'
import { CommandPalette } from './CommandPalette'

function openPalette() {
  fireEvent.keyDown(window, { key: 'k', metaKey: true })
}

describe('CommandPalette', () => {
  // The dev affordances that used to float as pills (tweaks,
  // share-debug) live here now — but never in prod sessions
  // (isDevSurface mocked false above).
  it('hides the dev-only commands when the dev gate is off', () => {
    render(<CommandPalette />)
    openPalette()
    expect(screen.queryByText('Dev panel')).toBeNull()
    expect(screen.queryByText('Kopiera felsökningssnapshot')).toBeNull()
  })

  it('is closed by default', () => {
    render(<CommandPalette />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens on Cmd+K with a labelled search input', () => {
    render(<CommandPalette />)
    openPalette()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Sök kommandon' })).toBeInTheDocument()
  })

  it('has no axe violations when open', async () => {
    render(<CommandPalette />)
    openPalette()
    const violations = await runAxe()
    expect(violations, formatViolations(violations)).toEqual([])
  })
})

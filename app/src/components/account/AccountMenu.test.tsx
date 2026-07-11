// AccountMenu — component + a11y regression net for the production
// account/identity surface (bake-off winner R2B1 "Kolofonkortet").
//
// Covers: open / Esc / scrim close, focus-return to the trigger, the full
// APG roving arrow-key set INCLUDING the footer Inställningar item (the
// R2B1 listRef-scoping bug this port fixes), initials derivation, the
// signed-out slot, and an axe pass on the open menu. The never-mounts-off-
// Home contract lives in AccountMenu.placement.test.tsx.

import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── provider stubs (this surface is Clerk + router + query connected) ──

const navigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}))

const signOut = vi.fn()
let mockUser: { fullName: string | null; primaryEmailAddress: { emailAddress: string } | null }
vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ user: mockUser, isLoaded: true }),
  useClerk: () => ({ signOut }),
}))

const exportMutate = vi.fn(() => Promise.resolve({ schemaVersion: 1 }))
const downloadExport = vi.fn()
vi.mock('@/api/hooks/useDataExport', () => ({
  useExportData: () => ({ mutateAsync: exportMutate, isPending: false }),
  downloadExport: (...args: unknown[]) => downloadExport(...args),
}))

let mockViewport: 'phone' | 'reader' | 'studio' = 'reader'
vi.mock('@/hooks/useViewport', () => ({
  useViewport: () => mockViewport,
}))

import { formatViolations, runAxe } from '@/test/a11y'
import { AccountMenu, deriveInitials } from './AccountMenu'

beforeEach(() => {
  navigate.mockClear()
  signOut.mockClear()
  exportMutate.mockClear()
  downloadExport.mockClear()
  mockViewport = 'reader'
  mockUser = {
    fullName: 'Loucmane Benali',
    primaryEmailAddress: { emailAddress: 'lookmanbenali@gmail.com' },
  }
})

function openMenu() {
  fireEvent.click(screen.getByRole('button', { name: 'Kontomeny' }))
}

describe('deriveInitials', () => {
  it('takes first + last initial of a two-part name', () => {
    expect(deriveInitials('Loucmane Benali')).toBe('LB')
  })
  it('takes first + last of a three-part name (skips the middle)', () => {
    expect(deriveInitials('Anna Maria Svensson')).toBe('AS')
  })
  it('takes a single letter for a one-word name', () => {
    expect(deriveInitials('Madonna')).toBe('M')
  })
  it('uppercases lowercase input', () => {
    expect(deriveInitials('erik ek')).toBe('EE')
  })
  it('collapses extra whitespace', () => {
    expect(deriveInitials('  Erik   Ek  ')).toBe('EE')
  })
  it('falls back to a middot for an empty name', () => {
    expect(deriveInitials('   ')).toBe('·')
  })
})

describe('AccountMenu — trigger + menu', () => {
  it('is closed by default (no menu role)', () => {
    render(<AccountMenu />)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('opens on trigger click and shows the identity + owner-law actions', () => {
    render(<AccountMenu />)
    openMenu()
    const menu = screen.getByRole('menu')
    expect(within(menu).getByText('Loucmane Benali')).toBeInTheDocument()
    expect(within(menu).getByText('lookmanbenali@gmail.com')).toBeInTheDocument()
    const labels = screen
      .getAllByRole('menuitem')
      .map((n) => n.textContent?.replace(/→/g, '').trim())
    expect(labels).toEqual(['Konto', 'Exportera min data', 'Logga ut', 'Inställningar'])
    // Owner law: deletion appears NOWHERE.
    expect(within(menu).queryByText(/radera/i)).not.toBeInTheDocument()
  })

  it('focuses the first menu item on open', () => {
    render(<AccountMenu />)
    openMenu()
    expect(screen.getAllByRole('menuitem')[0]).toHaveFocus()
  })

  it('closes on Escape and returns focus to the trigger', () => {
    render(<AccountMenu />)
    const trigger = screen.getByRole('button', { name: 'Kontomeny' })
    openMenu()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('closes when the scrim is clicked', () => {
    render(<AccountMenu />)
    openMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Stäng menyn' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('roves the arrow keys across ALL items including the footer Inställningar', () => {
    render(<AccountMenu />)
    openMenu()
    const items = screen.getAllByRole('menuitem')
    const menu = screen.getByRole('menu')
    // ArrowDown from item 0 → 1
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(items[1]).toHaveFocus()
    // End jumps to the LAST item — the footer Inställningar (the bug fix)
    fireEvent.keyDown(menu, { key: 'End' })
    expect(items[3]).toHaveFocus()
    expect(items[3]).toHaveTextContent('Inställningar')
    // ArrowDown wraps from last → first
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(items[0]).toHaveFocus()
    // ArrowUp wraps from first → last (Inställningar)
    fireEvent.keyDown(menu, { key: 'ArrowUp' })
    expect(items[3]).toHaveFocus()
    // Home returns to the first
    fireEvent.keyDown(menu, { key: 'Home' })
    expect(items[0]).toHaveFocus()
  })

  it('Tab out of the open menu closes it', () => {
    render(<AccountMenu />)
    openMenu()
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Tab' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('routes Konto to /konto and closes', () => {
    render(<AccountMenu />)
    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Konto' }))
    expect(navigate).toHaveBeenCalledWith({ to: '/konto' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('Inställningar routes to /mer', () => {
    render(<AccountMenu />)
    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Inställningar →' }))
    expect(navigate).toHaveBeenCalledWith({ to: '/mer' })
  })

  it('Logga ut calls the real signOut', () => {
    render(<AccountMenu />)
    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Logga ut' }))
    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('Exportera min data runs the export flow', async () => {
    render(<AccountMenu />)
    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Exportera min data' }))
    expect(exportMutate).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(downloadExport).toHaveBeenCalledTimes(1))
  })

  it('derives initials from the resolved name, not the raw email (GRAFT 2)', () => {
    // No name set on the Clerk account → falls back to the SAMPLE name,
    // and the glyph must match THAT name, never the email local-part.
    mockUser = { fullName: null, primaryEmailAddress: { emailAddress: 'zzz@example.com' } }
    render(<AccountMenu />)
    // SAMPLE name is "Loucmane Benali" → LB, not "ZZ" from the email.
    expect(screen.getByRole('button', { name: 'Kontomeny' })).toHaveTextContent('LB')
  })

  it('has no axe violations when open', async () => {
    render(<AccountMenu />)
    openMenu()
    const violations = await runAxe()
    expect(violations, formatViolations(violations)).toEqual([])
  })
})

describe('AccountMenu — phone presentation (GRAFT 1)', () => {
  beforeEach(() => {
    mockViewport = 'phone'
  })

  it('opens the house bottom sheet with the same menu contents', () => {
    render(<AccountMenu />)
    openMenu()
    const menu = screen.getByRole('menu')
    expect(within(menu).getByText('Loucmane Benali')).toBeInTheDocument()
    expect(screen.getAllByRole('menuitem')).toHaveLength(4)
  })

  it('closes on scrim tap', () => {
    render(<AccountMenu />)
    openMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Stäng menyn' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

describe('AccountMenu — signed out (GRAFT 3)', () => {
  it('shows the accent Logga in slot routing to /sign-in', () => {
    render(<AccountMenu signedOut />)
    expect(screen.queryByRole('button', { name: 'Kontomeny' })).not.toBeInTheDocument()
    const signIn = screen.getByRole('button', { name: 'Logga in' })
    expect(signIn).toHaveTextContent('Logga in →')
    fireEvent.click(signIn)
    expect(navigate).toHaveBeenCalledWith({ to: '/sign-in' })
  })

  it('has no axe violations in the signed-out slot', async () => {
    render(<AccountMenu signedOut />)
    const violations = await runAxe()
    expect(violations, formatViolations(violations)).toEqual([])
  })
})

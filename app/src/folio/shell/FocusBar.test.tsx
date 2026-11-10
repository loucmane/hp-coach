import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { runAxe } from '@/test/a11y'
import { type FocusDock, type FocusRequest, type FocusStrip, ShellFocusContext } from '../host'
import { useFolioPrefs } from '../lib/folioPrefs'
import { useShellFocus } from '../useShellFocus'
import { AccountMenu } from './AccountMenu'
import { DockBar } from './DockBar'
import { FocusBar } from './FocusBar'
import { ThemePicker } from './ThemePicker'

const mocks = vi.hoisted(() => ({ setMode: vi.fn(), setPalette: vi.fn(), signOut: vi.fn() }))
vi.mock('@/api/useSyncedPrefs', () => ({ useSyncedPrefs: () => mocks }))
vi.mock('@clerk/clerk-react', () => ({
  useClerk: () => ({ signOut: mocks.signOut }),
  useUser: () => ({ user: null }),
}))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...props }: ComponentProps<'a'> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

beforeEach(() => {
  vi.clearAllMocks()
  useFolioPrefs.getState().resetPrefs()
  mocks.setMode.mockResolvedValue(undefined)
  mocks.setPalette.mockResolvedValue(undefined)
})

function strip(): FocusStrip {
  return {
    section: 'KVA',
    cells: Array.from({ length: 10 }, (_, index) => ({
      id: `q${index + 1}`,
      state: index === 0 ? 'back' : index === 1 ? 'ok' : index === 2 ? 'cur' : undefined,
      onSelect: vi.fn(),
    })),
  }
}

function dock(): FocusDock {
  return {
    primary: { label: 'Nästa fråga', onClick: vi.fn(), kbd: '↵' },
    secondary: { label: 'Lägg i Repetera ändå', onClick: vi.fn() },
    detail: 'Fråga 4 av 10 härnäst · KVA · ca 30 s',
  }
}

// The intended shell composition: actions follow the question in DOM order.
// FolioShell's companion wiring is outside this bead's admitted write set.
function FocusPreview({ dock: actions, ...request }: FocusRequest & { onExit: () => void }) {
  return (
    <>
      <FocusBar {...request} />
      <main>
        <h1>Fråga</h1>
      </main>
      {actions && <DockBar {...actions} />}
    </>
  )
}

describe('focus chrome', () => {
  it('preserves the wordmark, default exit, custom label and hidden exit for old callers', () => {
    const onExit = vi.fn()
    const view = render(<FocusBar onExit={onExit} />)
    expect(screen.getByRole('img', { name: 'HP-Coach' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Avsluta' }))
    expect(onExit).toHaveBeenCalledOnce()
    expect(screen.queryByRole('navigation')).toBeNull()
    expect(screen.queryByRole('contentinfo')).toBeNull()
    view.rerender(<FocusBar onExit={onExit} exitLabel="Tillbaka" />)
    expect(screen.getByRole('button', { name: 'Tillbaka' })).toBeInTheDocument()
    view.rerender(<FocusBar onExit={onExit} exitLabel={null} />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders ten operable cells with truthful labels and current position', async () => {
    const progress = strip()
    render(<FocusBar onExit={vi.fn()} strip={progress} where="KVA · 3 av 10" />)
    const nav = screen.getByRole('navigation', { name: 'Frågor i passet' })
    expect(within(nav).getAllByRole('button')).toHaveLength(10)
    const back = within(nav).getByRole('button', { name: 'Fråga 1 av 10, kommer tillbaka' })
    expect(within(nav).getByRole('button', { name: 'Fråga 2 av 10, rätt' })).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: 'Fråga 3 av 10, ej besvarad' })).toHaveAttribute(
      'aria-current',
      'step',
    )
    expect(
      within(nav).getByRole('button', { name: 'Fråga 10 av 10, ej besvarad' }),
    ).toBeInTheDocument()
    expect(screen.getByText('KVA · 3 av 10')).toBeInTheDocument()
    back.focus()
    await userEvent.keyboard('{Enter}')
    expect(progress.cells[0].onSelect).toHaveBeenCalledOnce()
  })

  it('keeps the current halo after an answer, and derives totals from the actual pass', () => {
    const progress = strip()
    progress.cells = progress.cells
      .slice(0, 3)
      .map((cell, index) => (index === 2 ? { ...cell, state: 'ok', current: true } : cell))
    render(<FocusBar onExit={vi.fn()} strip={progress} />)
    const current = screen.getByRole('button', { name: 'Fråga 3 av 3, rätt' })
    expect(current).toHaveAttribute('aria-current', 'step')
    expect(current).toHaveAttribute('data-state', 'ok')
    expect(screen.getAllByRole('button', { name: /^Fråga/ })).toHaveLength(3)
  })

  it.each(['true', 'false'])('renders a single working dock in phone=%s chrome', async (phone) => {
    const actions = dock()
    const view = render(
      <div data-folio="">
        <div className="fa-app" data-focus="true" data-phone={phone}>
          <FocusPreview onExit={vi.fn()} strip={strip()} dock={actions} />
        </div>
      </div>,
    )
    const footer = screen.getByRole('contentinfo', { name: 'Åtgärder i passet' })
    expect(view.container.querySelectorAll('.fa-ui-go')).toHaveLength(1)
    await userEvent.click(within(footer).getByRole('button', { name: 'Nästa fråga' }))
    await userEvent.click(within(footer).getByRole('button', { name: 'Lägg i Repetera ändå' }))
    expect(actions.primary.onClick).toHaveBeenCalledOnce()
    expect(actions.secondary?.onClick).toHaveBeenCalledOnce()
    expect(within(footer).getByText(actions.detail as string)).toBeInTheDocument()
    expect(within(footer).getByRole('button', { name: 'Nästa fråga' })).toHaveAttribute(
      'type',
      'button',
    )
  })

  it('supports a disabled primary without a secondary or an invented keyboard binding', () => {
    const actions = dock()
    render(<DockBar primary={{ ...actions.primary, disabled: true }} />)
    const next = screen.getByRole('button', { name: 'Nästa fråga' })
    expect(next).toBeDisabled()
    fireEvent.click(next)
    expect(actions.primary.onClick).not.toHaveBeenCalled()
    expect(next).not.toHaveAttribute('aria-keyshortcuts')
    expect(screen.queryByRole('button', { name: 'Lägg i Repetera ändå' })).toBeNull()
  })

  it('registers and updates optional chrome, keeps exit callbacks fresh and releases only its owner', () => {
    const register = vi.fn()
    const first: FocusRequest = {
      onExit: vi.fn(),
      strip: strip(),
      where: 'KVA · 3 av 10',
      dock: dock(),
    }
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ShellFocusContext.Provider value={register}>{children}</ShellFocusContext.Provider>
    )
    const hook = renderHook((request: FocusRequest) => useShellFocus(request), {
      initialProps: first,
      wrapper,
    })
    const request = register.mock.calls.at(-1)?.[0] as FocusRequest
    expect(request).toMatchObject({ strip: first.strip, where: first.where, dock: first.dock })
    const second = { ...first, onExit: vi.fn() }
    hook.rerender(second)
    request.onExit?.()
    expect(first.onExit).not.toHaveBeenCalled()
    expect(second.onExit).toHaveBeenCalledOnce()
    const third = { ...second, where: 'KVA · 4 av 10', strip: strip(), dock: dock() }
    hook.rerender(third)
    const latest = register.mock.calls.at(-1)?.[0] as FocusRequest
    expect(latest).toMatchObject({ strip: third.strip, where: third.where, dock: third.dock })
    hook.unmount()
    const release = register.mock.calls.at(-1)?.[0]
    expect(release(latest)).toBeNull()
    expect(release(first)).toBe(first)
  })

  it('remains inert outside the shell and releases chrome when inactive', () => {
    const outside = renderHook(() => useShellFocus({ strip: strip(), dock: dock() }))
    outside.unmount()
    const register = vi.fn()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ShellFocusContext.Provider value={register}>{children}</ShellFocusContext.Provider>
    )
    const hook = renderHook(({ active }) => useShellFocus({ active }), {
      initialProps: { active: true },
      wrapper,
    })
    const request = register.mock.calls.at(-1)?.[0]
    hook.rerender({ active: false })
    expect(register.mock.calls.at(-1)?.[0](request)).toBeNull()
  })
})

describe('theme and account', () => {
  it('offers three mutually exclusive themes and five palettes with local-first synchronization', async () => {
    render(<ThemePicker />)
    const themes = within(screen.getByRole('group', { name: 'Tema' }))
    const palettes = within(screen.getByRole('group', { name: 'Färg' }))
    expect(themes.getAllByRole('button')).toHaveLength(3)
    expect(palettes.getAllByRole('button')).toHaveLength(5)
    expect(themes.getByRole('button', { name: 'Som systemet' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    mocks.setMode.mockImplementation(async (mode) => {
      expect(useFolioPrefs.getState().theme).toBe(mode)
    })
    for (const [label, value] of [
      ['Ljust', 'light'],
      ['Mörkt', 'dark'],
    ] as const) {
      await userEvent.click(themes.getByRole('button', { name: label }))
      expect(mocks.setMode).toHaveBeenLastCalledWith(value)
      expect(themes.getAllByRole('button', { pressed: true })).toEqual([
        themes.getByRole('button', { name: label }),
      ])
    }
    await userEvent.click(themes.getByRole('button', { name: 'Som systemet' }))
    expect(useFolioPrefs.getState().theme).toBe('system')
    expect(mocks.setMode).toHaveBeenCalledTimes(2)
    mocks.setPalette.mockImplementation(async (palette) => {
      expect(useFolioPrefs.getState().palette).toBe(palette)
    })
    for (const [label, key] of [
      ['Sand', 'sand'],
      ['Salvia', 'sage'],
      ['Bläck', 'ink'],
      ['Ros', 'rose'],
      ['Spalt', 'spalt'],
    ] as const) {
      await userEvent.click(palettes.getByRole('button', { name: label }))
      expect(mocks.setPalette).toHaveBeenLastCalledWith(key)
      expect(palettes.getAllByRole('button', { pressed: true })).toEqual([
        palettes.getByRole('button', { name: label }),
      ])
    }
  })

  it('reflects external preference changes and retains local choices when sync fails', async () => {
    render(<ThemePicker />)
    act(() => useFolioPrefs.getState().setPrefs({ theme: 'dark', palette: 'rose' }))
    expect(screen.getByRole('button', { name: 'Mörkt' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Ros' })).toHaveAttribute('aria-pressed', 'true')
    mocks.setMode.mockRejectedValue(new Error('offline'))
    mocks.setPalette.mockRejectedValue(new Error('offline'))
    await userEvent.click(screen.getByRole('button', { name: 'Ljust' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sand' }))
    expect(useFolioPrefs.getState()).toMatchObject({ theme: 'light', palette: 'sand' })
  })

  it.each([
    false,
    true,
  ])('keeps Konto and dismissal in the account menu, phone=%s', async (phone) => {
    const close = vi.fn()
    render(<AccountMenu phone={phone} open onToggle={vi.fn()} close={close} />)
    expect(screen.getByRole('button', { name: 'Konto och inställningar' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    )
    const menu = screen.getByRole('dialog', { name: 'Konto och inställningar' })
    expect(menu).toHaveAttribute('data-anchor', phone ? 'sheet' : 'side')
    expect(within(menu).getByRole('link', { name: /^Konto/ })).toHaveAttribute('href', '/konto')
    await userEvent.click(within(menu).getByRole('link', { name: /^Konto/ }))
    expect(close).toHaveBeenCalledOnce()
    fireEvent.keyDown(menu, { key: 'Escape' })
    expect(close).toHaveBeenCalledTimes(2)
  })
})

it.each([false, true])('passes axe for focus, dock and account, phone=%s', async (phone) => {
  const view = render(
    <div data-folio="">
      <FocusPreview onExit={vi.fn()} strip={strip()} where="KVA · 3 av 10" dock={dock()} />
    </div>,
  )
  expect(await runAxe(view.container)).toEqual([])
  view.unmount()
  const account = render(
    <div data-folio="">
      <AccountMenu phone={phone} open onToggle={vi.fn()} close={vi.fn()} />
    </div>,
  )
  expect(await runAxe(account.container)).toEqual([])
})

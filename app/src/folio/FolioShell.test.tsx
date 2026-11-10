import { act, fireEvent, render, screen, within } from '@testing-library/react'
import type { ComponentProps, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  pathname: '/',
  phone: false,
  reader: false,
  navigate: vi.fn(),
  setMode: vi.fn(),
  setPalette: vi.fn(),
  signOut: vi.fn(),
  signedIn: true,
  updateSession: vi.fn(),
  submitAttempt: vi.fn(),
  user: {
    fullName: 'Ada Lovelace',
    firstName: 'Ada',
    primaryEmailAddress: { emailAddress: 'ada@example.test' },
  } as {
    fullName: string | null
    firstName: string | null
    primaryEmailAddress: { emailAddress: string } | null
  } | null,
}))
vi.mock('@tanstack/react-router', () => ({
  createRootRoute: (options: unknown) => ({ options }),
  Outlet: () => (
    <RouteContent>
      <h1>Routesidan</h1>
    </RouteContent>
  ),
  useLocation: () => ({ pathname: mocks.pathname }),
  useNavigate: () => mocks.navigate,
  Link: ({ to, children, ...props }: ComponentProps<'a'> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))
vi.mock('@clerk/clerk-react', () => ({
  useClerk: () => ({ signOut: mocks.signOut }),
  useAuth: () => ({ isLoaded: true, userId: 'folio-test-user' }),
  useUser: () => ({ user: mocks.user }),
  SignedIn: ({ children }: { children: ReactNode }) => (mocks.signedIn ? children : null),
  SignedOut: ({ children }: { children: ReactNode }) => (mocks.signedIn ? null : children),
}))
vi.mock('@/hooks/useViewport', () => ({
  useViewport: () => (mocks.phone ? 'phone' : mocks.reader ? 'reader' : 'studio'),
}))
vi.mock('@/api/useSyncedPrefs', () => ({
  useHydratePrefs: () => {},
  useSyncedPrefs: () => ({ setMode: mocks.setMode, setPalette: mocks.setPalette }),
}))
vi.mock('@/components/landing/PublicLanding', () => ({ PublicLanding: () => <h1>Välkommen</h1> }))
vi.mock('@/components/motion/RouteScene', () => ({
  RouteScene: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/components/direction-shell/DirectionShell', () => ({
  DirectionShell: () => <h1>Vald designriktning</h1>,
}))
vi.mock('@/lib/welcome', () => ({ isWelcomed: () => true }))
vi.mock('@/lib/devSurface', () => ({ isDevSurface: () => true }))
vi.mock('./data/useShellData', () => ({
  useFolioShellData: () => ({
    subtitles: {
      idag: 'Dagens plan',
      ova: '8 redo · 9 min',
      repetera: '8 redo · ca 9 min',
      provpass: 'Ett helt pass',
      uppslag: 'Lektioner',
      framsteg: 'Prognos',
      historik: '12 pass',
    },
    dueCount: 8,
    identity: { name: 'Ada' },
  }),
}))
// Keep classic chrome real while replacing its data-heavy leaf only through the
// hooks it consumes. Folio mode must never mount that leaf.
vi.mock('@/api/hooks/useMistakes', () => ({
  usePileMistakes: () => ({ data: [] }),
  useRecordMistake: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/api/hooks/useAttempts', () => ({
  useSubmitAttempt: () => ({ mutate: mocks.submitAttempt }),
}))
vi.mock('@/api/hooks/useSessions', () => ({
  useUpdateSession: () => ({ mutate: mocks.updateSession }),
}))
vi.mock('@/api/hooks/useMockResults', () => ({ useSubmitMockResult: () => ({ mutate: vi.fn() }) }))
vi.mock('@/hooks/useCountdown', () => ({
  useCountdown: () => ({ expired: false, remainingMs: 60000 }),
}))
vi.mock('@/components/drill/DrillQuestion', () => ({ DrillQuestion: () => <p>Provfråga</p> }))
vi.mock('@/components/StudyDesk', () => ({ StudyDesk: () => <p>Provfråga</p> }))
vi.mock('@/components/motion/QuestionPan', () => ({
  QuestionPan: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/api/hooks/useStats', () => ({ useStats: () => ({ data: undefined }) }))
vi.mock('@/components/home/useResumptionCandidate', () => ({ useResumptionCandidate: () => null }))

import { CommandPalette } from '@/components/CommandPalette'
import { Frame } from '@/components/Frame'
import { MobileFrame } from '@/components/MobileFrame'
import { MockRunner } from '@/components/mock/MockRunner'
import { RailShell } from '@/components/NavRail'
import { Route } from '@/routes/__root'
import { useDesignStore } from '@/stores/designStore'
import { useUiStore } from '@/stores/uiStore'
import { runAxe } from '@/test/a11y'
import { FolioHost } from './FolioHost'
import { FolioShell } from './FolioShell'
import type { FocusStrip } from './host'
import { useFolioPrefs } from './lib/folioPrefs'
import { useShellFocus } from './useShellFocus'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.pathname = '/'
  mocks.phone = false
  mocks.reader = false
  mocks.signedIn = true
  mocks.setMode.mockResolvedValue(undefined)
  mocks.setPalette.mockResolvedValue(undefined)
  mocks.user = {
    fullName: 'Ada Lovelace',
    firstName: 'Ada',
    primaryEmailAddress: { emailAddress: 'ada@example.test' },
  }
  useDesignStore.setState({ direction: null })
  useUiStore.setState({ folioPreview: false, palette: 'spalt', mode: 'light' })
  useFolioPrefs.getState().resetPrefs()
})

afterEach(() => vi.restoreAllMocks())

function RouteContent({ children }: { children?: ReactNode }) {
  return (
    <Frame>
      <MobileFrame>{mocks.phone ? children : <RailShell>{children}</RailShell>}</MobileFrame>
    </Frame>
  )
}

describe('Folio shell', () => {
  it.each([false, true])('restores navigation after leaving welcome, phone=%s', (phone) => {
    mocks.phone = phone
    mocks.pathname = '/welcome'
    const view = render(
      <FolioShell>
        <h1>Välkommen</h1>
      </FolioShell>,
    )
    expect(screen.getByTestId('folio-app')).toHaveAttribute('data-focus', 'true')
    expect(screen.queryByRole('navigation')).toBeNull()
    expect(screen.queryByTestId('fa-exit')).toBeNull()
    mocks.pathname = '/'
    view.rerender(
      <FolioShell>
        <h1>Idag</h1>
      </FolioShell>,
    )
    expect(screen.getByTestId('folio-app')).toHaveAttribute('data-focus', 'false')
    expect(screen.getByRole('link', { name: 'Idag' })).toBeInTheDocument()
  })
  it.each([false, true])('retains the classic content cap and gutters, reader=%s', (reader) => {
    mocks.reader = reader
    const classic = render(
      <Frame>
        <p>Innehåll</p>
      </Frame>,
    )
    const classicCanvas = classic.container.querySelector<HTMLElement>('.hpc-frame-canvas')!
    const dimensions = {
      width: classicCanvas.style.width,
      maxWidth: classicCanvas.style.maxWidth,
      margin: classicCanvas.style.margin,
    }
    classic.unmount()
    const { container } = render(
      <FolioShell>
        <Frame>
          <p>Innehåll</p>
        </Frame>
      </FolioShell>,
    )
    const canvas = screen.getByText('Innehåll').parentElement!
    expect(canvas.style.maxWidth).toBe(
      reader ? 'var(--canvas-max-w-reader)' : 'var(--canvas-max-w)',
    )
    expect({
      width: canvas.style.width,
      maxWidth: canvas.style.maxWidth,
      margin: canvas.style.margin,
    }).toEqual(dimensions)
    expect(canvas.style.background).toBe('')
    expect(canvas.parentElement?.style.background).toBe('')
    expect(container.querySelector('.hpc-frame')).toBeNull()
  })

  it('has seven rail entries and account; Repetera has its own current state', () => {
    mocks.pathname = '/repetition'
    render(
      <FolioShell>
        <h1>Repetera</h1>
      </FolioShell>,
    )
    expect(within(screen.getByRole('navigation')).getAllByRole('link')).toHaveLength(7)
    expect(screen.getByRole('link', { name: 'Repetera' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Öva' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'Idag' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: 'Konto och inställningar' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Fäll ihop menyn' }))
    expect(screen.getByTestId('folio-app')).toHaveAttribute('data-collapsed', 'true')
    fireEvent.keyDown(document.body, { key: 'b', metaKey: true })
    expect(screen.getByTestId('folio-app')).toHaveAttribute('data-collapsed', 'false')
  })

  it.each([false, true])('puts the working skip link first, phone=%s', (phone) => {
    mocks.phone = phone
    const { container } = render(
      <FolioShell>
        <h1>Idag</h1>
      </FolioShell>,
    )
    const skip = screen.getByRole('link', { name: 'Hoppa till innehållet' })
    expect(container.querySelector('a, button, input, [tabindex="0"]')).toBe(skip)
    expect(skip).toHaveAttribute('href', '#innehall')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'innehall')
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
    fireEvent.click(skip)
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('keeps skip navigation in focus mode', () => {
    mocks.pathname = '/drill'
    function Session() {
      useShellFocus({ active: true })
      return <h1>Fråga</h1>
    }
    const { container } = render(
      <FolioShell>
        <Session />
      </FolioShell>,
    )
    expect(container.querySelector('a, button')).toBe(
      screen.getByRole('link', { name: 'Till frågan' }),
    )
  })

  it.each([
    '/repetition',
    '/historik',
    '/prov',
  ])('keeps five phone tabs with the current family at %s', (pathname) => {
    mocks.phone = true
    mocks.pathname = pathname
    render(
      <FolioShell>
        <h1>Sida</h1>
      </FolioShell>,
    )
    const tabs = within(screen.getByTestId('folio-tabs'))
    expect(tabs.getAllByRole('link').map((link) => link.getAttribute('aria-label'))).toEqual([
      'Idag',
      'Öva',
      'Prov',
      'Uppslag',
      'Framsteg',
    ])
    const label =
      pathname === '/repetition' ? 'Öva' : pathname === '/historik' ? 'Framsteg' : 'Prov'
    expect(tabs.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page')
  })

  it.each([
    false,
    true,
  ])('opens the actual command palette from visible search, phone=%s', async (phone) => {
    mocks.phone = phone
    render(
      <>
        <CommandPalette />
        <FolioShell>
          <h1>Idag</h1>
        </FolioShell>
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Sök' }))
    expect(screen.getByRole('textbox', { name: 'Sök kommandon' })).toBeInTheDocument()
    expect(await runAxe()).toEqual([])
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(screen.getByRole('textbox', { name: 'Sök kommandon' })).toBeInTheDocument()
  })

  it('uses live Folio root preferences, including system theme and motion', () => {
    let dark = true
    const listeners = new Set<() => void>()
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query.includes('color-scheme') ? dark : true,
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) =>
        listeners.add(listener as () => void),
      removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) =>
        listeners.delete(listener as () => void),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: () => false,
    }))
    useFolioPrefs.getState().setPrefs({ palette: 'ink', textSize: 'xlarge', kbd: false })
    render(
      <FolioShell>
        <h1>Idag</h1>
      </FolioShell>,
    )
    const root = screen.getByTestId('folio-shell')
    expect(root).toHaveAttribute('data-theme', 'dark')
    expect(root).toHaveAttribute('data-palette', 'ink')
    expect(root).toHaveAttribute('data-motion', 'none')
    expect(root).toHaveAttribute('data-kbd', 'off')
    expect(root).toHaveAttribute('data-text', 'xlarge')
    act(() => {
      dark = false
      for (const listener of listeners) listener()
    })
    expect(root).toHaveAttribute('data-theme', 'light')
    act(() => useFolioPrefs.getState().setPrefs({ theme: 'dark', motion: 'less' }))
    expect(root).toHaveAttribute('data-theme', 'dark')
    expect(root).toHaveAttribute('data-motion', 'less')
    fireEvent.keyDown(document.body, { key: 'b', ctrlKey: true })
    expect(screen.getByTestId('folio-app')).toHaveAttribute('data-collapsed', 'true')
  })

  it('ignores collapse shortcuts while editing text', () => {
    render(
      <FolioShell>
        <label>
          Svar
          <input />
        </label>
        <div contentEditable data-testid="editable-note" />
      </FolioShell>,
    )
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Svar' }), { key: 'b', metaKey: true })
    fireEvent.keyDown(screen.getByTestId('editable-note'), { key: 'b', ctrlKey: true })
    expect(screen.getByTestId('folio-app')).toHaveAttribute('data-collapsed', 'false')
  })

  it('renders phone tabs and preserves route state across widths', () => {
    function Counter() {
      const [n, setN] = useState(0)
      return (
        <button type="button" onClick={() => setN(n + 1)}>
          Svar {n}
        </button>
      )
    }
    function StableRoute() {
      return (
        <Frame>
          <MobileFrame>
            <RailShell>
              <Counter />
            </RailShell>
          </MobileFrame>
        </Frame>
      )
    }
    const view = render(
      <FolioShell>
        <StableRoute />
      </FolioShell>,
    )
    fireEvent.click(screen.getByText('Svar 0'))
    mocks.phone = true
    view.rerender(
      <FolioShell>
        <StableRoute />
      </FolioShell>,
    )
    expect(screen.getByTestId('folio-tabs')).toBeInTheDocument()
    expect(screen.queryByTestId('folio-rail')).toBeNull()
    expect(screen.getByText('Svar 1')).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it('focus hides navigation, calls the latest exit callback and restores navigation', () => {
    const first = vi.fn(),
      next = vi.fn()
    function Session({ active, onExit }: { active: boolean; onExit: () => void }) {
      useShellFocus({ active, onExit })
      const [n, setN] = useState(0)
      return (
        <button type="button" onClick={() => setN(n + 1)}>
          Fråga {n}
        </button>
      )
    }
    const view = render(
      <FolioShell>
        <Session active onExit={first} />
      </FolioShell>,
    )
    fireEvent.click(screen.getByText('Fråga 0'))
    expect(screen.queryByRole('navigation')).toBeNull()
    view.rerender(
      <FolioShell>
        <Session active onExit={next} />
      </FolioShell>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Avsluta' }))
    expect(first).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledOnce()
    expect(mocks.navigate).not.toHaveBeenCalled()
    view.rerender(
      <FolioShell>
        <Session active={false} onExit={next} />
      </FolioShell>,
    )
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByText('Fråga 1')).toBeInTheDocument()
  })

  it('forwards strip, where and dock from useShellFocus and releases them', () => {
    mocks.pathname = '/drill'
    const go = vi.fn(),
      pick = vi.fn()
    const strip: FocusStrip = {
      section: 'KVA',
      cells: [
        { id: 'q1', state: 'ok', onSelect: pick },
        { id: 'q2', state: 'back', onSelect: pick },
        { id: 'q3', state: 'cur', onSelect: pick },
      ],
    }
    function Session({ active, n }: { active: boolean; n: number }) {
      useShellFocus({
        active,
        strip,
        where: `KVA · ${n} av 3`,
        dock: { primary: { label: n === 3 ? 'Se facit' : 'Nästa', onClick: go } },
      })
      return <h1>Fråga {n}</h1>
    }
    const view = render(
      <FolioShell>
        <Session active n={2} />
      </FolioShell>,
    )
    const bar = screen.getByRole('navigation', { name: 'Frågor i passet' })
    expect(
      within(bar)
        .getAllByRole('button')
        .map((cell) => cell.getAttribute('aria-label')),
    ).toEqual(['Fråga 1 av 3, rätt', 'Fråga 2 av 3, kommer tillbaka', 'Fråga 3 av 3, ej besvarad'])
    fireEvent.click(within(bar).getByRole('button', { name: 'Fråga 2 av 3, kommer tillbaka' }))
    expect(pick).toHaveBeenCalledOnce()
    expect(screen.getByText('KVA · 2 av 3')).toBeInTheDocument()
    const dock = screen.getByRole('contentinfo', { name: 'Åtgärder i passet' })
    const main = screen.getByRole('main')
    expect(main.compareDocumentPosition(dock) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.click(within(dock).getByRole('button', { name: /Nästa/ }))
    expect(go).toHaveBeenCalledOnce()

    view.rerender(
      <FolioShell>
        <Session active n={3} />
      </FolioShell>,
    )
    expect(screen.getByText('KVA · 3 av 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Se facit/ })).toBeInTheDocument()

    view.rerender(
      <FolioShell>
        <Session active={false} n={3} />
      </FolioShell>,
    )
    expect(screen.queryByRole('navigation', { name: 'Frågor i passet' })).toBeNull()
    expect(screen.queryByText('KVA · 3 av 3')).toBeNull()
    expect(screen.queryByRole('contentinfo', { name: 'Åtgärder i passet' })).toBeNull()
  })

  it('routes theme and palette through synced setters and reads the store', async () => {
    const { container } = render(
      <FolioShell>
        <h1>Idag</h1>
      </FolioShell>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Konto och inställningar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mörkt' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvia' }))
    expect(mocks.setMode).toHaveBeenCalledWith('dark')
    expect(mocks.setPalette).toHaveBeenCalledWith('sage')
    // The root follows the Folio prefs the picker writes, at once.
    expect(screen.getByTestId('folio-shell')).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByTestId('folio-shell')).toHaveAttribute('data-palette', 'sage')
    expect(await runAxe(container)).toEqual([])
    act(() => useUiStore.getState().setFolioPreview(true))
    fireEvent.click(screen.getByText('Tillbaka till klassisk design'))
    expect(useUiStore.getState().folioPreview).toBe(false)
  })

  it('contains focus in the phone account sheet and restores the trigger on Escape', async () => {
    mocks.phone = true
    const { container } = render(
      <FolioShell>
        <h1>Idag</h1>
      </FolioShell>,
    )
    const trigger = screen.getByRole('button', { name: 'Konto och inställningar' })
    fireEvent.click(trigger)
    expect(screen.getByRole('main')).toHaveAttribute('inert')
    expect(screen.getByTestId('folio-tabs')).toHaveAttribute('inert')
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('dialog').querySelector('a')?.getAttribute('href')).toBe('/konto')
    expect(document.activeElement?.textContent).toContain('Konto')
    fireEvent.keyDown(document.activeElement!, { key: 'Tab', shiftKey: true })
    expect(document.activeElement?.textContent).toBe('Stäng')
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' })
    expect(document.activeElement?.textContent).toContain('Konto')
    expect(await runAxe(container)).toEqual([])
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('main')).not.toHaveAttribute('inert')
    expect(document.activeElement === trigger).toBe(true)
  })

  it.each([false, true])('shows Clerk identity in the account menu, phone=%s', (phone) => {
    mocks.phone = phone
    render(
      <FolioShell>
        <h1>Idag</h1>
      </FolioShell>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Konto och inställningar' }))
    const menu = within(screen.getByRole('dialog'))
    expect(menu.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(menu.getByText('ada@example.test')).toBeInTheDocument()
  })

  it('uses email when the student has no name and a neutral fallback while loading', () => {
    mocks.user = null
    const view = render(
      <FolioShell>
        <h1>Idag</h1>
      </FolioShell>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Konto och inställningar' }))
    expect(within(screen.getByRole('dialog')).getAllByText('Ditt konto')).toHaveLength(1)
    mocks.user = {
      fullName: null,
      firstName: null,
      primaryEmailAddress: { emailAddress: 'student@example.test' },
    }
    view.rerender(
      <FolioShell>
        <h1>Idag</h1>
      </FolioShell>,
    )
    expect(screen.getByTestId('fa-account-menu').querySelector('b')).toHaveTextContent(
      'student@example.test',
    )
    expect(
      screen.getByTestId('fa-account-menu').querySelector('.fa-menu-head span'),
    ).toHaveTextContent('student@example.test')
  })

  it('handles rejected mode and palette saves', async () => {
    const rejected = Promise.reject(new Error('offline'))
    // Keep the red run free of an unrelated global rejection; assert that each
    // picker action itself attaches a rejection handler to the returned save.
    void rejected.catch(() => {})
    const handled = vi.spyOn(rejected, 'catch')
    mocks.setMode.mockReturnValue(rejected)
    mocks.setPalette.mockReturnValue(rejected)
    render(
      <FolioShell>
        <h1>Idag</h1>
      </FolioShell>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Konto och inställningar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ljust' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mörkt' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvia' }))
    expect(handled).toHaveBeenCalledTimes(3)
    await act(async () => {})
  })

  it('uses the previous destination if a focus consumer has no exit callback', () => {
    function Session({ active }: { active: boolean }) {
      useShellFocus({ active })
      return <h1>Övning</h1>
    }
    mocks.pathname = '/lektion'
    const view = render(
      <FolioShell>
        <Session active={false} />
      </FolioShell>,
    )
    mocks.pathname = '/drill'
    view.rerender(
      <FolioShell>
        <Session active />
      </FolioShell>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Avsluta' }))
    expect(mocks.navigate).toHaveBeenCalledWith({ to: '/lektion', replace: true })
  })

  it.each([
    false,
    true,
  ])('Provpass has one main and voids only after confirmation, phone=%s', async (phone) => {
    mocks.phone = phone
    const onVoid = vi.fn()
    const { container } = render(
      <FolioShell>
        <Frame>
          <MockRunner
            plan={[1, 2, 3].map((number) => ({
              qid: `q${number}`,
              section: 'ORD',
              number,
              exam_id: 'var-2024',
              provpass: 'verb1',
              prompt: 'Ord',
              options: [{ letter: 'A', text: 'Svar' }],
              answer: 'A',
              context: null,
              figure: null,
              parsing_status: 'complete',
            }))}
            session={{ id: 42, startedAt: new Date(), mode: 'synthetic', half: 'verbal' }}
            seenBefore={0}
            onSettled={vi.fn()}
            onVoid={onVoid}
          />
        </Frame>
      </FolioShell>,
    )
    expect(screen.queryByRole('navigation')).toBeNull()
    expect(screen.getAllByRole('main')).toHaveLength(1)
    const canvas = container.querySelector<HTMLElement>('.hpc-frame-canvas')
    if (phone) {
      expect(canvas).toBeNull()
    } else {
      expect(canvas).toContainElement(screen.getByTestId('mock-runner'))
      expect(canvas?.style.maxWidth).toBe('var(--canvas-max-w)')
      expect(canvas?.style.margin).toBe('0px auto')
    }
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(screen.getByTestId('mock-cell-2')).toHaveAttribute('data-current', 'true')
    mocks.updateSession.mockClear()
    screen.getByTestId('fa-exit').focus()
    fireEvent.click(screen.getByTestId('fa-exit'))
    const dialog = screen.getByRole('dialog', { name: 'Avbryt provpasset?' })
    expect(dialog).toHaveTextContent('Avbryter du nu blir provpasset ogiltigt.')
    expect(dialog).not.toHaveTextContent('övning')
    expect(await runAxe(container)).toEqual([])
    const stay = within(dialog).getByRole('button', { name: 'Fortsätt provpasset' })
    const leave = within(dialog).getByRole('button', { name: 'Avbryt provpasset' })
    expect(stay).toHaveFocus()
    fireEvent.keyDown(stay, { key: 'Tab', shiftKey: true })
    expect(leave).toHaveFocus()
    fireEvent.keyDown(leave, { key: 'Tab' })
    expect(stay).toHaveFocus()
    for (const key of ['a', 'b', 'c', 'd', 'e', 'ArrowLeft', 'ArrowRight', 'm']) {
      fireEvent.keyDown(stay, { key })
    }
    expect(mocks.submitAttempt).not.toHaveBeenCalled()
    expect(mocks.updateSession).not.toHaveBeenCalled()
    expect(screen.getByTestId('mock-cell-2')).toHaveAttribute('data-current', 'true')
    expect(screen.getByRole('button', { name: /Osäker/ })).toHaveAttribute('aria-pressed', 'false')
    expect(onVoid).not.toHaveBeenCalled()
    fireEvent.click(stay)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByTestId('fa-exit')).toHaveFocus()
    fireEvent.keyDown(document.body, { key: 'a' })
    fireEvent.keyDown(document.body, { key: 'm' })
    expect(mocks.submitAttempt).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: /Osäker/ })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByTestId('fa-exit'))
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onVoid).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('fa-exit'))
    fireEvent.click(screen.getByRole('button', { name: 'Avbryt provpasset' }))
    expect(onVoid).toHaveBeenCalledOnce()
    expect(mocks.updateSession).toHaveBeenCalledWith({ id: 42, patch: { end: true } })
    expect(mocks.navigate).not.toHaveBeenCalled()
  })

  it.each([false, true])('classic chrome stays with flag off (phone=%s)', (phone) => {
    mocks.phone = phone
    render(
      <FolioHost pathname="/">
        <RouteContent>
          <h1>Idag</h1>
        </RouteContent>
      </FolioHost>,
    )
    expect(screen.queryByTestId('folio-shell')).toBeNull()
    expect(screen.getByTestId(phone ? 'bottom-tabs' : 'nav-rail')).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it.each([
    false,
    true,
  ])('preview has one main and no classic navigation (phone=%s)', async (phone) => {
    mocks.phone = phone
    useUiStore.setState({ folioPreview: true })
    let mounts = 0
    function Content() {
      useEffect(() => {
        mounts++
      }, [])
      return <h1>Idag</h1>
    }
    const { container } = render(
      <FolioHost pathname="/">
        <RouteContent>
          <Content />
        </RouteContent>
      </FolioHost>,
    )
    await screen.findByTestId('folio-shell')
    expect(screen.queryByTestId('nav-rail')).toBeNull()
    expect(screen.queryByTestId('bottom-tabs')).toBeNull()
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(mounts).toBe(1)
    expect(await runAxe(container)).toEqual([])
  })

  it.each(['/hjalp', '/integritet', '/dev/redesign-2026'])('leaves %s untouched', (pathname) => {
    useUiStore.setState({ folioPreview: true })
    render(
      <FolioHost pathname={pathname}>
        <h1>Vanliga sidan</h1>
      </FolioHost>,
    )
    expect(screen.queryByTestId('folio-shell')).toBeNull()
    expect(screen.getByText('Vanliga sidan')).toBeInTheDocument()
  })
})

describe('authenticated root composition', () => {
  const Root = Route.options.component!
  it.each([false, true])('switches chrome at the real root, phone=%s', async (phone) => {
    mocks.phone = phone
    const view = render(<Root />)
    expect(screen.getByTestId(phone ? 'bottom-tabs' : 'nav-rail')).toBeInTheDocument()
    act(() => useUiStore.getState().setFolioPreview(true))
    await screen.findByTestId('folio-shell')
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.queryByTestId('nav-rail')).toBeNull()
    expect(screen.queryByTestId('bottom-tabs')).toBeNull()
    expect(view.container.querySelector('.hpc-frame')).toBeNull()
  })
  it('wraps welcome, keeps public routes classic and honours the dev direction', async () => {
    useUiStore.setState({ folioPreview: true })
    mocks.pathname = '/welcome'
    const view = render(<Root />)
    await screen.findByTestId('folio-shell')
    mocks.pathname = '/hjalp'
    view.rerender(<Root />)
    expect(screen.queryByTestId('folio-shell')).toBeNull()
    mocks.pathname = '/'
    useDesignStore.setState({ direction: 'a' })
    view.rerender(<Root />)
    await screen.findByText('Vald designriktning')
    expect(screen.queryByTestId('folio-shell')).toBeNull()
    expect(screen.queryByText('Routesidan')).toBeNull()
  })
  it('never mounts the preview for a signed-out visitor', () => {
    mocks.signedIn = false
    useUiStore.setState({ folioPreview: true })
    render(<Root />)
    expect(screen.getByText('Välkommen')).toBeInTheDocument()
    expect(screen.queryByTestId('folio-shell')).toBeNull()
  })
})

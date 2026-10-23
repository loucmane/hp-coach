import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from '@tanstack/react-router'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { type ComponentType, type ReactNode, StrictMode, useContext, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionPlayerProps } from '@/components/session/SessionPlayer'
import type { Question } from '@/data/questions'
import { FolioShell } from '@/folio/FolioShell'
import { FolioHostContext } from '@/folio/host'
import { Rail } from '@/folio/shell/Rail'
import { TabBar } from '@/folio/shell/TabBar'
import { useShellFocus } from '@/folio/useShellFocus'
import { FIRST_SESSION_QIDS } from '@/lib/firstSession'
import { Route as DrillRoute } from '@/routes/drill'
import { Route } from '@/routes/welcome'
import { useExamStore } from '@/stores/examStore'
import { useUiStore } from '@/stores/uiStore'
import { runAxe } from '@/test/a11y'
import FolioWelcome from './FolioWelcome'

const h = vi.hoisted(() => ({
  navigate: vi.fn(),
  setSitting: vi.fn(),
  setMode: vi.fn(),
  setPalette: vi.fn(),
  update: vi.fn(),
  prefs: { targetSittingId: null as string | null, dailyMinutes: 20 },
  attempts: 0,
  active: null as { id: number } | null,
  pending: false,
  failed: false,
  refetch: vi.fn(),
  bank: [] as Question[],
  player: null as SessionPlayerProps | null,
  load: vi.fn(),
  phone: false,
  playerIdle: false,
  welcomeLoad: null as Promise<void> | null,
  doneLoad: null as Promise<void> | null,
}))
vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ user: { firstName: 'Kim' } }),
  useClerk: () => ({ signOut: vi.fn() }),
}))
vi.mock('@tanstack/react-router', async (original) => ({
  ...(await original<typeof import('@tanstack/react-router')>()),
  createFileRoute: () => (options: unknown) => ({ options }),
  useNavigate: () => h.navigate,
  useLocation: () => ({ pathname: '/welcome' }),
}))
vi.mock('@/hooks/useViewport', () => ({ useViewport: () => (h.phone ? 'phone' : 'studio') }))
vi.mock('@/folio/data/useShellData', () => ({
  useFolioShellData: () => ({ subtitles: {}, dueCount: 0 }),
}))
vi.mock('@/folio/shell/Rail', { spy: true })
vi.mock('@/folio/shell/TabBar', { spy: true })
// Hold the real lazy screens in Suspense until the test releases them.
vi.mock('./FolioWelcome', async (original) => {
  const { default: Welcome } = await original<typeof import('./FolioWelcome')>()
  return {
    default: () => {
      if (h.welcomeLoad) throw h.welcomeLoad
      return <Welcome />
    },
  }
})
vi.mock('./FolioWelcomeDone', async (original) => {
  const { default: Done } = await original<typeof import('./FolioWelcomeDone')>()
  return {
    default: (props: React.ComponentProps<typeof Done>) => {
      if (h.doneLoad) throw h.doneLoad
      return <Done {...props} />
    },
  }
})
vi.mock('@/api/useSyncedPrefs', () => ({ useSyncedPrefs: () => h }))
vi.mock('@/api/hooks/useUserPrefs', () => ({
  useUserPrefs: () => ({ data: h.prefs, isError: false, refetch: h.refetch }),
  useUpdateUserPrefs: () => ({ mutateAsync: h.update }),
}))
vi.mock('@/api/hooks/useStats', () => ({
  useStats: () => ({
    data: h.pending ? undefined : { attempts: { total: h.attempts } },
    isError: h.failed,
    refetch: h.refetch,
  }),
}))
vi.mock('@/api/hooks/useSessions', () => ({
  useActiveSessionOfKind: () => ({
    data: h.active,
    isPending: h.pending,
    isError: h.failed,
    refetch: h.refetch,
  }),
}))
vi.mock('@/lib/motion', async (original) => ({
  ...(await original<typeof import('@/lib/motion')>()),
  useFirstContentSignal: vi.fn(),
}))
vi.mock('@/data/frameworks', () => ({ loadFramework: () => h.load() }))
vi.mock('@/data/questions', async (original) => ({
  ...(await original<typeof import('@/data/questions')>()),
  loadBank: async () => h.bank,
}))
vi.mock('@/components/session/SessionPlayer', () => ({
  SessionPlayer: (props: SessionPlayerProps) => {
    h.player = props
    const folio = useContext(FolioHostContext)
    const [done, setDone] = useState(false)
    const [idle, setIdle] = useState(h.playerIdle)
    useShellFocus({ active: !done && !idle, onExit: () => {} })
    if (done)
      return props.renderDone?.({
        summary: { questions: h.bank, picks: ['B', 'A', 'B'] },
      } as Parameters<NonNullable<SessionPlayerProps['renderDone']>>[0])
    if (idle)
      return (
        <div>
          <p>{props.emptyCopy}</p>
          {props.idleSecondaryCta}
          <button type="button" onClick={() => setIdle(false)}>
            Ladda testfrågorna
          </button>
        </div>
      )
    return (
      <div data-testid="real-player-contract" data-folio-host={String(folio)}>
        <h1>Tre frågor</h1>
        <button type="button" onClick={() => setDone(true)}>
          Slutför testpass
        </button>
      </div>
    )
  },
}))

function Harness({ children, folio = true }: { children: ReactNode; folio?: boolean }) {
  if (folio) return <FolioShell>{children}</FolioShell>
  return (
    <FolioHostContext.Provider value={folio}>
      <main>{children}</main>
    </FolioHostContext.Provider>
  )
}
function mount(child: ReactNode = <FolioWelcome />, folio = true) {
  const router = createRouter({ routeTree: createRootRoute(), history: createMemoryHistory() })
  const view = render(
    <StrictMode>
      <RouterContextProvider router={router}>
        <Harness folio={folio}>{child}</Harness>
      </RouterContextProvider>
    </StrictMode>,
  )
  return { ...view, router }
}
const go = async (name: string) => {
  await act(async () => fireEvent.click(await screen.findByRole('button', { name })))
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 23, 12))
  vi.clearAllMocks()
  localStorage.clear()
  h.pending = false
  h.failed = false
  h.attempts = 0
  h.active = null
  h.phone = false
  h.playerIdle = false
  h.welcomeLoad = null
  h.doneLoad = null
  h.prefs = { targetSittingId: null, dailyMinutes: 20 }
  h.bank = FIRST_SESSION_QIDS.map(
    (qid) =>
      ({
        qid,
        section: 'ORD',
        parsing_status: 'complete',
        answer: 'B',
        options: [
          { letter: 'A', text: 'ett' },
          { letter: 'B', text: 'två' },
        ],
      }) as Question,
  )
  h.player = null
  h.load.mockReset().mockResolvedValue({
    family: 'ord_roots',
    entries: [
      {
        id: 'ORD-ROOT-010',
        root: 'o-',
        meaning: 'negationsprefix, germanskt ursprung',
        example_words: ['obetydlig', 'otidsenlig', 'oansenlig'],
      },
    ],
  })
  h.update.mockReset().mockResolvedValue(undefined)
  h.setSitting.mockReset().mockImplementation(async (id) => useExamStore.getState().setSitting(id))
  h.setMode.mockReset().mockImplementation(async (mode) => useUiStore.setState({ mode }))
  h.setPalette.mockReset().mockImplementation(async (palette) => useUiStore.setState({ palette }))
  useUiStore.setState({ palette: 'spalt', mode: 'light' })
  useExamStore.setState({ sittingId: null })
})
afterEach(() => vi.useRealTimers())

describe('Folio first run', () => {
  it('preselects the next sitting and saves the untouched default exactly once on continue', async () => {
    mount()
    expect(await screen.findByRole('radio', { name: /Vårprov 27/ })).toBeChecked()
    expect(h.setSitting).not.toHaveBeenCalled()
    await go('Fortsätt')
    expect(h.setSitting).toHaveBeenCalledExactlyOnceWith('var-2027')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Hur mycket tid passar dig?',
    )
    await go('Prov, klart')
    await go('Fortsätt')
    expect(h.setSitting).toHaveBeenCalledTimes(1)
  })
  it('keeps an explicit unknown sitting through continue without saving the default', async () => {
    mount()
    fireEvent.click(await screen.findByRole('radio', { name: /Vet inte än/ }))
    await waitFor(() => expect(h.update).toHaveBeenCalledExactlyOnceWith({ targetSittingId: null }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Fortsätt' })).toBeEnabled())
    await go('Fortsätt')
    expect(h.setSitting).not.toHaveBeenCalled()
    await go('Prov, klart')
    expect(screen.getByRole('radio', { name: /Vet inte än/ })).toBeChecked()
  })
  it('waits for the default save and retries failure before advancing', async () => {
    let reject!: (error: Error) => void
    h.setSitting.mockReturnValueOnce(
      new Promise((_resolve, no) => {
        reject = no
      }),
    )
    mount()
    await go('Fortsätt')
    expect(screen.getByRole('button', { name: 'Minuter' })).toBeDisabled()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Vilket prov siktar du på?')
    await act(async () => reject(new Error('offline')))
    expect(screen.getByRole('alert')).toHaveTextContent('Det gick inte att spara')
    await go('Försök igen')
    expect(h.setSitting).toHaveBeenCalledTimes(2)
    expect(h.setSitting).toHaveBeenLastCalledWith('var-2027')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Hur mycket tid passar dig?',
    )
  })
  it('explains an unpublished next sitting above the unknown choice', async () => {
    vi.setSystemTime(new Date(2030, 0, 1, 12))
    mount()
    const note = await screen.findByText(
      'Nästa provdatum är inte publicerat här än. Du kan välja det senare.',
    )
    const unknown = screen.getByRole('radio', { name: /Vet inte än/ })
    expect(unknown).toBeChecked()
    expect(note.compareDocumentPosition(unknown) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getAllByRole('radio')).toHaveLength(1)
    await go('Fortsätt')
    expect(h.setSitting).not.toHaveBeenCalled()
  })
  it.each([
    false,
    true,
  ])('keeps focus while the route chunk is suspended, phone=%s', async (phone) => {
    h.phone = phone
    let release!: () => void
    h.welcomeLoad = new Promise<void>((resolve) => {
      release = resolve
    })
    const Welcome = Route.options.component as ComponentType
    mount(<Welcome />)
    await screen.findByRole('button', { name: 'Hoppa över välkomsten' })
    expect(screen.queryByRole('heading', { name: 'Vilket prov siktar du på?' })).toBeNull()
    expect(screen.getByTestId('folio-app')).toHaveAttribute('data-focus', 'true')
    expect(Rail).not.toHaveBeenCalled()
    expect(TabBar).not.toHaveBeenCalled()
    await go('Hoppa över välkomsten')
    expect(localStorage.getItem('hpc-welcomed')).toBe('1')
    expect(h.navigate).toHaveBeenCalledWith({ to: '/' })
    await act(async () => {
      h.welcomeLoad = null
      release()
    })
    await screen.findByRole('heading', { name: 'Vilket prov siktar du på?' })
    expect(Rail).not.toHaveBeenCalled()
    expect(TabBar).not.toHaveBeenCalled()
  })
  it.each([
    false,
    true,
  ])('keeps focus before the player answers and through lazy done, phone=%s', async (phone) => {
    h.phone = phone
    h.playerIdle = true
    let release!: () => void
    h.doneLoad = new Promise<void>((resolve) => {
      release = resolve
    })
    mount()
    await go('Ordmönster')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Prova tre frågor' })).toBeEnabled(),
    )
    await go('Prova tre frågor')
    expect(screen.getByTestId('folio-app')).toHaveAttribute('data-focus', 'true')
    expect(screen.queryByTestId('fa-exit')).toBeNull()
    expect(Rail).not.toHaveBeenCalled()
    expect(TabBar).not.toHaveBeenCalled()
    await go('Ladda testfrågorna')
    expect(screen.getByTestId('fa-exit')).toHaveTextContent('Avsluta')
    expect(screen.queryByRole('button', { name: 'Hoppa över välkomsten' })).toBeNull()
    await go('Slutför testpass')
    expect(screen.queryByRole('heading', { name: /Du klarade/ })).toBeNull()
    expect(screen.queryByTestId('fa-exit')).toBeNull()
    expect(screen.getByTestId('folio-app')).toHaveAttribute('data-focus', 'true')
    expect(Rail).not.toHaveBeenCalled()
    expect(TabBar).not.toHaveBeenCalled()
    await act(async () => {
      h.doneLoad = null
      release()
    })
    await screen.findByRole('heading', { name: /Du klarade 2 av 3/ })
    expect(Rail).not.toHaveBeenCalled()
    expect(TabBar).not.toHaveBeenCalled()
  })
  it('lets an empty or stale session skip welcome and reach home', async () => {
    h.active = { id: 7 }
    h.playerIdle = true
    mount()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Prova tre frågor' })).toBeEnabled(),
    )
    await go('Prova tre frågor')
    expect(screen.getByText(/Frågorna kunde inte laddas/)).toBeInTheDocument()
    await go('Hoppa över välkomsten')
    expect(localStorage.getItem('hpc-welcomed')).toBe('1')
    expect(h.navigate).toHaveBeenCalledWith({ to: '/' })
  })
  it.each([
    ['Fortsätt öva', '/drill?section=ORD&start=true'],
    ['Till Idag', '/'],
  ])('navigates %s with the router', async (name, href) => {
    h.attempts = 12
    const { router } = mount()
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(undefined)
    const link = await screen.findByRole('link', { name })
    expect(link).toHaveAttribute('href', href)
    if (name === 'Fortsätt öva') {
      const validate = DrillRoute.options.validateSearch as (
        input: Record<string, unknown>,
      ) => unknown
      const search = router.options.parseSearch!(new URL(href, 'https://example.test').search)
      expect(validate(search)).toMatchObject({ section: 'ORD', start: true })
    }
    expect(fireEvent.click(link, { button: 0 })).toBe(false)
    expect(navigate).toHaveBeenCalledOnce()
    expect(localStorage.getItem('hpc-welcomed')).toBe('1')
  })
  it('navigates only setup steps, marks completion, and focuses each heading', async () => {
    mount()
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Vilket prov siktar du på?' }),
    ).toHaveFocus()
    const nav = screen.getByRole('navigation', { name: 'Välkomststeg' })
    expect(
      within(nav)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Prov', 'Minuter', 'Utseende', 'Ordmönster'])
    expect(within(nav).getByRole('button', { name: 'Prov' })).toHaveAttribute(
      'aria-current',
      'step',
    )
    await go('Fortsätt')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Hur mycket tid passar dig?',
    )
    expect(within(nav).getByRole('button', { name: /Prov/ })).toHaveAttribute(
      'data-complete',
      'true',
    )
    await go('Fortsätt')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Gör den till din.')
    await go('Behåll så här')
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Ett litet o- vänder betydelsen',
    )
    await go('Prov, klart')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Vilket prov siktar du på?')
    expect(screen.queryByRole('button', { name: 'Klart' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Tre frågor' })).toBeNull()
  })
  it('saves exam and minutes on selection and clears both server and local target', async () => {
    mount()
    fireEvent.click(await screen.findByRole('radio', { name: /Höstprov 27/ }))
    await waitFor(() => expect(h.setSitting).toHaveBeenCalledWith('host-2027'))
    expect(await screen.findByText(/om 366 dagar/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('radio', { name: /Vet inte än/ })).toBeEnabled())
    fireEvent.click(screen.getByRole('radio', { name: /Vet inte än/ }))
    await waitFor(() => expect(h.update).toHaveBeenCalledWith({ targetSittingId: null }))
    await waitFor(() => expect(useExamStore.getState().sittingId).toBeNull())
    await go('Minuter')
    fireEvent.click(screen.getByRole('radio', { name: '30 minuter' }))
    await waitFor(() => expect(h.update).toHaveBeenCalledWith({ dailyMinutes: 30 }))
  })
  it('keeps failed choices retryable and prevents navigating away during a save', async () => {
    let reject!: (e: Error) => void
    h.setSitting.mockReturnValueOnce(
      new Promise((_yes, no) => {
        reject = no
      }),
    )
    mount()
    fireEvent.click(await screen.findByRole('radio', { name: /Höstprov 27/ }))
    expect(screen.getByRole('button', { name: 'Minuter' })).toBeDisabled()
    await act(async () => reject(new Error('offline')))
    expect(screen.getByRole('alert')).toHaveTextContent('Det gick inte att spara')
    await go('Försök igen')
    await waitFor(() => expect(h.setSitting).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
  })
  it('rolls an expired target forward for display without writing a new preference', async () => {
    h.prefs.targetSittingId = 'host-2026'
    mount()
    expect(await screen.findByRole('radio', { name: /Vårprov 27/ })).toBeChecked()
    expect(h.setSitting).not.toHaveBeenCalled()
    expect(h.update).not.toHaveBeenCalled()
  })
  it('uses named theme radios and keeps the current appearance without a write', async () => {
    mount()
    await go('Utseende')
    expect(screen.getAllByRole('radio').map((r) => r.getAttribute('value'))).toEqual([
      'light',
      'dark',
      'spalt',
      'sand',
      'sage',
      'ink',
      'rose',
    ])
    fireEvent.click(screen.getByRole('radio', { name: 'Mörkt' }))
    await waitFor(() => expect(h.setMode).toHaveBeenCalledWith('dark'))
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Salvia' })).toBeEnabled())
    fireEvent.click(screen.getByRole('radio', { name: 'Salvia' }))
    await waitFor(() => expect(h.setPalette).toHaveBeenCalledWith('sage'))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Behåll så här' })).toBeEnabled())
    await go('Behåll så här')
    expect(h.setMode).toHaveBeenCalledTimes(1)
    expect(h.setPalette).toHaveBeenCalledTimes(1)
  })
  it('hands focus registration to the player and back to the result without a skip action', async () => {
    mount()
    await go('Ordmönster')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Prova tre frågor' })).toBeEnabled(),
    )
    expect(screen.getByTestId('folio-app')).not.toHaveTextContent(
      /negationsprefix|germanskt ursprung|Klart för idag|räcker/,
    )
    expect(screen.getByRole('button', { name: 'Hoppa över välkomsten' })).toBeInTheDocument()
    await go('Prova tre frågor')
    expect(screen.getByTestId('real-player-contract')).toHaveAttribute('data-folio-host', 'true')
    expect(screen.getByRole('button', { name: 'Avsluta' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Hoppa över välkomsten' })).toBeNull()
    expect(screen.getByTestId('folio-app')).toHaveAttribute('data-focus', 'true')
    expect(h.player?.sessionKind).toBe('onboarding')
    expect(await h.player?.resolvePlan?.(FIRST_SESSION_QIDS.slice())).toHaveLength(3)
    expect(
      await h.player?.resolvePlan?.([
        FIRST_SESSION_QIDS[0],
        FIRST_SESSION_QIDS[0],
        FIRST_SESSION_QIDS[2],
      ]),
    ).toEqual([])
    await go('Slutför testpass')
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Du klarade 2 av 3')
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus()
    expect(screen.queryByTestId('fa-exit')).toBeNull()
    await waitFor(() =>
      expect(screen.getByTestId('folio-app')).toHaveAttribute('data-focus', 'true'),
    )
    expect(screen.getByRole('link', { name: 'Fortsätt öva' })).toHaveAttribute(
      'href',
      '/drill?section=ORD&start=true',
    )
    expect(screen.getByRole('link', { name: 'Till Idag' })).toHaveAttribute('href', '/')
    expect(localStorage.getItem('hpc-welcomed')).toBe('1')
    expect(await runAxe()).toEqual([])
  })
  it('skips setup for established accounts and resumes onboarding on the pattern', async () => {
    h.attempts = 12
    const first = mount()
    expect(await screen.findByRole('heading', { name: 'Du är igång.' })).toHaveFocus()
    expect(screen.queryByRole('navigation')).toBeNull()
    first.unmount()
    h.active = { id: 7 }
    mount()
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Ett litet o-')
    expect(within(screen.getByRole('navigation')).getAllByRole('button')).toHaveLength(1)
  })
  it('does not offer a made-up result while account queries are pending or failed', async () => {
    h.pending = true
    h.failed = true
    mount()
    expect(screen.queryByText('Du är igång.')).toBeNull()
    await go('Försök igen')
    expect(h.refetch).toHaveBeenCalled()
  })
  it('keeps the newest focus owner when an earlier registration is released', async () => {
    function Owner({ active = true, label }: { active?: boolean; label: string }) {
      useShellFocus({ active, exitLabel: label })
      return null
    }
    function Handoff() {
      const [oldActive, setOldActive] = useState(true)
      const [newActive, setNewActive] = useState(false)
      return (
        <>
          <Owner active={oldActive} label="Tidigare" />
          {newActive && <Owner label="Ny" />}
          <button type="button" onClick={() => setNewActive(true)}>
            Nytt fokus
          </button>
          <button type="button" onClick={() => setOldActive(false)}>
            Släpp tidigare
          </button>
        </>
      )
    }
    mount(<Handoff />)
    expect(screen.getByTestId('fa-exit')).toHaveTextContent('Tidigare')
    await go('Nytt fokus')
    expect(screen.getByTestId('fa-exit')).toHaveTextContent('Ny')
    await go('Släpp tidigare')
    expect(screen.getByTestId('fa-exit')).toHaveTextContent('Ny')
  })
  it('retries a failed root load without enabling an incomplete three-question session', async () => {
    h.load.mockRejectedValueOnce(new Error('offline'))
    mount()
    await go('Ordmönster')
    expect(await screen.findByRole('alert')).toHaveTextContent('Första passet kunde inte laddas')
    expect(screen.getByRole('button', { name: 'Prova tre frågor' })).toBeDisabled()
    await go('Försök igen')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Prova tre frågor' })).toBeEnabled(),
    )
    expect(screen.queryByRole('alert')).toBeNull()
  })
  it('marks welcome and goes home when skipped', async () => {
    mount()
    await go('Hoppa över välkomsten')
    expect(localStorage.getItem('hpc-welcomed')).toBe('1')
    expect(h.navigate).toHaveBeenCalledWith({ to: '/' })
  })
  it.each([
    'Prov',
    'Minuter',
    'Utseende',
    'Ordmönster',
  ])('has no axe violations on %s', async (step) => {
    mount()
    await go(step)
    if (step === 'Ordmönster') await screen.findByRole('heading', { name: 'o-' })
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(await runAxe()).toEqual([])
  })
  it.each([
    false,
    true,
  ])('selects the real route branch through FolioHostContext=%s', async (folio) => {
    const Welcome = Route.options.component as ComponentType
    mount(<Welcome />, folio)
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: folio ? 'Vilket prov siktar du på?' : 'Kim, gör den till din.',
      }),
    ).toBeInTheDocument()
    expect(!!screen.queryByRole('navigation', { name: 'Välkomststeg' })).toBe(folio)
  })
})

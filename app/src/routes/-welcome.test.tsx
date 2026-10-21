import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from '@tanstack/react-router'
import {
  createEvent,
  fireEvent,
  renderHook,
  render as renderUI,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import type { ComponentType, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DailyPlanCard } from '@/components/home/DailyPlanCard'
import type { SessionPlayerProps } from '@/components/session/SessionPlayer'
import type { Question } from '@/data/questions'
import { useDailyPlan } from '@/hooks/useDailyPlan'
import { FIRST_SESSION_FALLBACK, FIRST_SESSION_QIDS } from '@/lib/firstSession'
import { type DailyPlan, generateDailyPlan, loadPlan, savePlan } from '@/lib/scheduler'
import { Route } from './welcome'

const h = vi.hoisted(() => ({
  navigate: vi.fn(),
  setSitting: vi.fn(),
  update: vi.fn(),
  prefs: {} as { targetSittingId?: string; dailyMinutes?: number } | undefined,
  stats: {
    data: { attempts: { total: 0 } } as { attempts: { total: number } } | undefined,
    isError: false,
    refetch: vi.fn(),
  },
  active: null as { id: number } | null,
  player: null as SessionPlayerProps | null,
  bank: [] as Question[],
  planMode: false,
  empty: [],
  serverPlan: null as DailyPlan | null,
  putPlan: vi.fn(),
}))
vi.mock('@clerk/clerk-react', () => ({ useUser: () => ({ user: { firstName: 'Kim' } }) }))
vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  createFileRoute: () => (options: unknown) => ({ options }),
  useNavigate: () => h.navigate,
}))
vi.mock('@/api/useSyncedPrefs', () => ({
  useSyncedPrefs: () => ({ setMode: vi.fn(), setPalette: vi.fn(), setSitting: h.setSitting }),
}))
vi.mock('@/api/hooks/useUserPrefs', () => ({
  useUpdateUserPrefs: () => ({ mutate: h.update }),
  useUserPrefs: () => ({ data: h.prefs }),
}))
vi.mock('@/api/hooks/useStats', () => ({ useStats: () => h.stats }))
vi.mock('@/api/hooks/useSessions', () => ({
  useActiveSessions: () => ({ data: h.empty }),
  useActiveSessionOfKind: () => ({ data: h.active, isPending: false }),
  useUpdateSession: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/lib/motion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/motion')>()),
  useFirstContentSignal: vi.fn(),
}))
vi.mock('@/api/hooks/useDailyPlanApi', () => ({
  useDailyPlanQuery: () => ({ data: h.serverPlan, isLoading: false }),
  usePutDailyPlan: () => ({ mutate: h.putPlan }),
}))
vi.mock('@/api/hooks/useMistakes', () => ({
  useDueMistakes: () => ({ data: h.empty, isLoading: false }),
}))
vi.mock('@/api/hooks/useTopTraps', () => ({ useTopTraps: () => h.empty }))
vi.mock('@/api/hooks/useMockResults', () => ({ useMockResults: () => ({ data: h.empty }) }))
vi.mock('@/api/hooks/useAdaptiveReview', () => ({ useAdaptiveReview: () => ({ hotTrap: null }) }))
vi.mock('@/api/hooks/useLessonReadsApi', () => ({ useLessonReadsQuery: () => ({ data: h.empty }) }))
vi.mock('@/api/hooks/useFrameworkProgress', () => ({
  useFrameworkProgress: () => ({ data: h.empty, isLoading: false }),
}))
vi.mock('@/data/leverage', () => ({ loadFrameworkLeverage: async () => null }))
vi.mock('@/data/frameworks', () => ({
  loadPrereqGraph: async () => ({ version: 1, edges: [] }),
  entryHeadword: () => null,
  loadFramework: async () =>
    h.planMode
      ? null
      : {
          family: 'ord_roots',
          entries: [
            { id: 'ORD-ROOT-010', root: 'o-', meaning: 'icke, inte', example_words: ['obetydlig'] },
          ],
        },
}))
vi.mock('@/data/questions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/data/questions')>()),
  loadBank: async () => h.bank,
}))
vi.mock('@/components/session/SessionPlayer', () => ({
  SessionPlayer: (props: SessionPlayerProps) => {
    h.player = props
    return <div data-testid="first-player">Frågorna</div>
  },
}))

const Welcome = Route.options.component as ComponentType
function render(ui: ReactNode) {
  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory(),
  })
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(undefined)
  const view = renderUI(ui, {
    wrapper: ({ children }) => (
      <RouterContextProvider router={router}>{children}</RouterContextProvider>
    ),
  })
  return { ...view, navigate }
}

const stopNudge = /idag · klart|klart för idag|räcker|dagens klart/i
const next = () => fireEvent.click(screen.getByRole('button', { name: /Fortsätt/ }))
async function toMinutes() {
  render(<Welcome />)
  next()
  await screen.findByRole('heading', { name: 'Vilket prov siktar du på?' })
  next()
  await screen.findByRole('heading', { name: 'Hur mycket tid passar dig?' })
}
async function toSession() {
  await toMinutes()
  next()
  fireEvent.click(await screen.findByRole('button', { name: /Prova tre frågor/ }))
  await screen.findByTestId('first-player')
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 21, 12))
  vi.clearAllMocks()
  localStorage.clear()
  h.setSitting.mockResolvedValue(undefined)
  h.update.mockImplementation((_patch, callbacks) => callbacks.onSuccess())
  h.stats.data = { attempts: { total: 0 } }
  h.stats.isError = false
  h.prefs = {}
  h.active = null
  h.player = null
  h.planMode = false
  h.serverPlan = null
  h.bank = FIRST_SESSION_QIDS.map(
    (qid) =>
      ({
        qid,
        section: 'ORD',
        answer: 'B',
        parsing_status: 'complete',
        options: [
          { letter: 'A', text: 'ett' },
          { letter: 'B', text: 'två' },
        ],
      }) as Question,
  )
})

describe('first-pass Home integration', () => {
  it.each([
    'server',
    'local',
  ] as const)('replaces a %s cold plan, stays complete on reload and restores tomorrow’s diagnostic', async (cache) => {
    h.planMode = true
    const now = new Date(2026, 9, 21, 12)
    const date = '2026-10-21'
    const cold = generateDailyPlan({ now, sectionScores: [], dueMistakeCount: 0 })
    if (cache === 'server') h.serverPlan = cold
    else savePlan(cold)
    const bySection = Object.fromEntries(
      ['ORD', 'LÄS', 'MEK', 'ELF', 'XYZ', 'KVA', 'NOG', 'DTK'].map((section) => [
        section,
        {
          attempts7d: 0,
          correct7d: 0,
          attempts7to14d: 0,
          correct7to14d: 0,
          attempts90d: 0,
          correct90d: 0,
          avgTimeMs: null,
          lastAttemptedAt: null,
          attemptsToday: section === 'ORD' ? 3 : 0,
        },
      ]),
    )
    h.stats.data = Object.assign(
      { attempts: { total: 3 } },
      { bySection, onboardingCompletedAt: now.toISOString() },
    )
    const first = renderHook(() => useDailyPlan(now))
    await waitFor(() => expect(first.result.current.plan?.items[0].headline).toBe('Första passet'))
    expect(first.result.current.allComplete).toBe(true)
    expect(first.result.current.plan?.estimatedMinutes).toBe(0)
    const saved = loadPlan(date)
    expect(saved?.items[0].completed).toBe(true)
    expect(h.putPlan).toHaveBeenCalledWith(saved)
    const navigate = vi.fn()
    const card = render(<DailyPlanCard plan={saved} allComplete onNavigate={navigate} />)
    const link = screen.getByRole('link', { name: /Första passet/ })
    expect(link.className).toBe('hpc-m3-plan-t')
    expect(link.style.textDecoration).toBe('underline')
    expect(link).toHaveStyle({ textDecoration: 'underline' })
    fireEvent.click(link)
    expect(navigate).toHaveBeenCalledWith('/lektion?section=ORD#ORD-ROOT-010')
    const practice = screen.getByRole('link', { name: 'Vill du fortsätta? Öva en sektion →' })
    expect(practice).toHaveAttribute('href', '/ova')
    fireEvent.click(practice)
    expect(navigate).toHaveBeenLastCalledWith('/ova')
    expect(card.container).not.toHaveTextContent(stopNudge)
    expect(screen.queryByTestId('daily-plan-first-cta')).not.toBeInTheDocument()
    card.unmount()
    first.unmount()
    h.serverPlan = saved
    const reloaded = renderHook(() => useDailyPlan(now))
    await waitFor(() => expect(reloaded.result.current.allComplete).toBe(true))
    reloaded.unmount()
    const tomorrow = renderHook(() => useDailyPlan(new Date(2026, 9, 22, 12)))
    await waitFor(() =>
      expect(tomorrow.result.current.plan?.items[0].href).toBe('/diagnostik?start=1'),
    )
    expect(tomorrow.result.current.allComplete).toBe(false)
  })
})

describe('first-run flow', () => {
  it('lists both upcoming 2027 sittings on the Prov step', () => {
    render(<Welcome />)
    next()

    expect(screen.getByRole('heading', { name: 'Vilket prov siktar du på?' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Vårprov|Höstprov/ })).toHaveLength(2)
    expect(screen.getByRole('button', { name: /Vårprov 27/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: /Höstprov 27/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('preselects and saves Höstprov 27 after the spring sitting has passed', async () => {
    vi.setSystemTime(new Date(2027, 3, 11, 12))
    h.prefs = { targetSittingId: 'var-2027' }
    render(<Welcome />)
    next()

    expect(screen.queryByRole('button', { name: /Vårprov 27/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Höstprov 27/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    next()
    await screen.findByRole('heading', { name: 'Hur mycket tid passar dig?' })
    expect(h.setSitting).toHaveBeenCalledWith('host-2027')
  })

  it('seeds an upcoming saved sitting and minutes without writing unchanged values', async () => {
    vi.setSystemTime(new Date(2026, 8, 1, 12))
    h.prefs = { targetSittingId: 'var-2027', dailyMinutes: 45 }
    render(<Welcome />)
    next()
    expect(screen.getByRole('button', { name: /Vårprov 27/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: /Höstprov 26/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    next()
    await screen.findByRole('heading', { name: 'Hur mycket tid passar dig?' })
    expect(screen.getByRole('button', { name: '45 minuter' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    next()
    await screen.findByText('icke, inte')
    expect(h.setSitting).not.toHaveBeenCalled()
    expect(h.update).not.toHaveBeenCalled()
  })

  it('waits for delayed saved prefs before allowing a preference save', async () => {
    h.prefs = undefined
    const view = render(<Welcome />)
    next()
    expect(screen.getByRole('button', { name: /Fortsätt/ })).toBeDisabled()
    h.prefs = { targetSittingId: 'var-2027', dailyMinutes: 45 }
    view.rerender(<Welcome />)
    next()
    await screen.findByRole('heading', { name: 'Hur mycket tid passar dig?' })
    expect(screen.getByRole('button', { name: '45 minuter' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    next()
    await screen.findByText('icke, inte')
    expect(h.update).not.toHaveBeenCalled()
    expect(h.setSitting).not.toHaveBeenCalled()
  })

  it('rolls past sittings forward and defaults unsupported minutes to 20', async () => {
    h.prefs = { targetSittingId: 'host-2026', dailyMinutes: 60 }
    await toMinutes()
    expect(h.setSitting).toHaveBeenCalledWith('var-2027')
    expect(screen.getByRole('button', { name: '20 minuter' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    next()
    expect(h.update).toHaveBeenCalledWith({ dailyMinutes: 20 }, expect.anything())
  })

  it('keeps the palette first, saves the next sitting and chosen minutes, and teaches the root', async () => {
    await toMinutes()
    expect(h.setSitting).toHaveBeenCalledWith('var-2027')
    for (const minutes of [10, 20, 30, 45])
      expect(screen.getByRole('button', { name: `${minutes} minuter` })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '30 minuter' }))
    next()
    expect(h.update).toHaveBeenCalledWith({ dailyMinutes: 30 }, expect.anything())
    expect(await screen.findByText('icke, inte')).toBeInTheDocument()
    const pattern = screen.getByRole('region', { name: 'Ordmönster' })
    expect(within(pattern).getByRole('heading', { name: 'o-' })).toHaveStyle({
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(28px, 2vw + 16px, 40px)',
    })
    expect(within(pattern).getByRole('list')).toHaveTextContent('obetydlig')
    expect(screen.queryByText(/Diagnos/)).not.toBeInTheDocument()
  })

  it('mounts the whole-page onboarding player without a welcome wrapper or strip', async () => {
    await toSession()
    expect(h.player).toMatchObject({ sessionKind: 'onboarding', sections: 'ORD', autoStart: true })
    expect(h.player?.onWrong).toBeUndefined()
    expect((await h.player?.pickQuestions())?.map((q) => q.qid)).toEqual(FIRST_SESSION_QIDS)
    expect(await h.player?.resolvePlan?.([...FIRST_SESSION_QIDS])).toHaveLength(3)
    expect(await h.player?.resolvePlan?.(['unknown', ...FIRST_SESSION_QIDS.slice(1)])).toEqual([])
    const player = screen.getByTestId('first-player')
    expect(player.parentElement?.parentElement === document.body).toBe(true)
    expect(screen.queryByTestId('first-session-origin')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Hoppa över' })).not.toBeInTheDocument()
  })

  it.each([
    ['B', 'B', 'B'],
    ['A', 'B', 'B'],
  ] as const)('uses the true completion sentence for %j', async (...picks) => {
    await toSession()
    const result = h.player?.renderDone?.({
      summary: { questions: h.bank, picks: [...picks] },
      onReplay: vi.fn(),
      onHome: vi.fn(),
    })
    render(result)
    const heading = screen.getByRole('heading', {
      level: 1,
      name:
        picks[0] === 'B'
          ? 'Du klarade 3 av 3 frågor från riktiga högskoleprov'
          : 'Du har gjort dina första 3 frågor från riktiga högskoleprov',
    })
    expect(heading).toHaveFocus()
    // This JSDOM drops viewport-based clamp() font sizes. Check the responsive
    // size in the host browser; toHaveStyle would normalize it to an empty value.
    expect(heading).toHaveStyle({
      fontFamily: 'var(--font-display)',
      fontWeight: 500,
      lineHeight: 1.1,
      color: 'var(--ink)',
      margin: 0,
    })
    const completion = heading.closest('section')
    expect(completion).toHaveStyle({ display: 'flex', justifyContent: 'center' })
    expect(completion?.firstElementChild).toHaveStyle({ width: '100%', maxWidth: 720 })
    expect(screen.queryByText(/fel|2 av 3/)).not.toBeInTheDocument()
    expect(completion).not.toHaveTextContent(stopNudge)
    expect(screen.getByRole('link', { name: 'Fortsätt öva nu →' })).toHaveAttribute('href', '/ova')
    const ordered = [
      screen.getByText('Din start'),
      heading,
      screen.getByText(
        'Frågorna kom från högskoleprovet hösten 2016, hösten 2021 och hösten 2025.',
      ),
      screen.getByText('Imorgon väntar en kort diagnos.'),
      screen.getByRole('button', { name: 'Till Hem' }),
      screen.getByRole('link', { name: 'Fortsätt öva nu →' }),
    ]
    for (let index = 1; index < ordered.length; index++) {
      expect(
        ordered[index - 1].compareDocumentPosition(ordered[index]) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    }
    fireEvent.click(screen.getByRole('button', { name: 'Till Hem' }))
    expect(h.navigate).toHaveBeenCalledWith({ to: '/' })
  })

  it('continues through the router without reloading the document', async () => {
    await toSession()
    const done = render(
      h.player?.renderDone?.({
        summary: { questions: h.bank, picks: ['B', 'B', 'B'] },
        onReplay: vi.fn(),
        onHome: vi.fn(),
      }),
    )
    const link = screen.getByRole('link', { name: 'Fortsätt öva nu →' })
    const click = createEvent.click(link, { button: 0 })
    fireEvent(link, click)
    expect(click.defaultPrevented).toBe(true)
    expect(done.navigate).toHaveBeenCalledWith(expect.objectContaining({ to: '/ova' }))
  })

  it('labels the actual completed plan when a fallback question was played', async () => {
    await toSession()
    const played = [h.bank[0], h.bank[1], { ...h.bank[2], qid: FIRST_SESSION_FALLBACK }]
    render(
      h.player?.renderDone?.({
        summary: { questions: played, picks: ['B', 'B', 'B'] },
        onReplay: vi.fn(),
        onHome: vi.fn(),
      }),
    )
    expect(
      screen.getByText(
        'Frågorna kom från högskoleprovet hösten 2016, hösten 2021 och hösten 2013.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/hösten 2025/)).not.toBeInTheDocument()
  })

  it('skips the session for an existing account on a new device', async () => {
    h.stats.data = { attempts: { total: 12 } }
    await toMinutes()
    next()
    expect(await screen.findByRole('button', { name: 'Till Hem' })).toBeInTheDocument()
    expect(h.player).toBeNull()
  })

  it('does not guess that an unloaded account is new; skipping remains available', async () => {
    h.stats.data = undefined
    await toMinutes()
    expect(screen.getByRole('button', { name: /Fortsätt/ })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Hoppa över' }))
    expect(h.navigate).toHaveBeenCalledWith({ to: '/' })
  })

  it('offers recovery and skipping when the real question bank is incomplete', async () => {
    h.bank = []
    await toMinutes()
    next()
    expect(await screen.findByRole('alert')).toHaveTextContent('Första passet kunde inte laddas')
    expect(screen.getByRole('button', { name: /Prova tre frågor/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Hoppa över' })).toBeEnabled()
    expect(h.player).toBeNull()
  })

  it('resumes an existing first pass even though its earlier answers count as effort', async () => {
    h.stats.data = { attempts: { total: 1 } }
    h.active = { id: 7 }
    render(<Welcome />)
    fireEvent.click(await screen.findByRole('button', { name: /Prova tre frågor/ }))
    await screen.findByTestId('first-player')
    expect(h.player?.resolvePlan).toBeDefined()
    expect(h.setSitting).not.toHaveBeenCalled()
    expect(h.update).not.toHaveBeenCalled()
  })

  it('resumes when the active session arrives after mount', async () => {
    const view = render(<Welcome />)
    h.active = { id: 7 }
    view.rerender(<Welcome />)
    expect(await screen.findByRole('button', { name: /Prova tre frågor/ })).toBeInTheDocument()
    expect(screen.queryByText('Palett')).not.toBeInTheDocument()
  })

  it('keeps the minutes choice recoverable after a failed save', async () => {
    h.update.mockImplementation((_patch, callbacks) => callbacks.onError())
    await toMinutes()
    next()
    expect(await screen.findByRole('alert')).toHaveTextContent('spara tiden')
    expect(screen.getByRole('button', { name: /Fortsätt/ })).toBeEnabled()
  })

  it('allows skipping from the first screen without claiming any completed questions', () => {
    render(<Welcome />)
    expect(screen.getByText('Palett')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Hoppa över' }))
    expect(h.navigate).toHaveBeenCalledWith({ to: '/' })
    expect(localStorage.getItem('hpc-welcomed')).toBe('1')
    expect(h.player).toBeNull()
  })

  it('keeps the sitting choice recoverable after a failed save', async () => {
    h.setSitting.mockRejectedValue(new Error('offline'))
    render(<Welcome />)
    next()
    next()
    expect(await screen.findByRole('alert')).toHaveTextContent(/spara/)
    expect(screen.getByRole('heading', { name: 'Vilket prov siktar du på?' })).toBeInTheDocument()
    h.setSitting.mockResolvedValue(undefined)
    next()
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Hur mycket tid passar dig?' }),
      ).toBeInTheDocument(),
    )
  })
})

import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import type { ComponentType } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DailyPlanCard } from '@/components/home/DailyPlanCard'
import type { SessionPlayerProps } from '@/components/session/SessionPlayer'
import type { Question } from '@/data/questions'
import { useDailyPlan } from '@/hooks/useDailyPlan'
import { FIRST_SESSION_QIDS } from '@/lib/firstSession'
import { type DailyPlan, generateDailyPlan, loadPlan, savePlan } from '@/lib/scheduler'
import { Route } from './welcome'

const h = vi.hoisted(() => ({
  navigate: vi.fn(),
  setSitting: vi.fn(),
  update: vi.fn(),
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
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  useNavigate: () => h.navigate,
}))
vi.mock('@/api/useSyncedPrefs', () => ({
  useSyncedPrefs: () => ({ setMode: vi.fn(), setPalette: vi.fn(), setSitting: h.setSitting }),
}))
vi.mock('@/api/hooks/useUserPrefs', () => ({
  useUpdateUserPrefs: () => ({ mutate: h.update }),
  useUserPrefs: () => ({ data: {} }),
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
    fireEvent.click(link)
    expect(navigate).toHaveBeenCalledWith('/lektion?section=ORD#ORD-ROOT-010')
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
  it('keeps the palette first, saves the next sitting and chosen minutes, and teaches the root', async () => {
    await toMinutes()
    expect(h.setSitting).toHaveBeenCalledWith('var-2027')
    for (const minutes of [10, 20, 30, 45])
      expect(screen.getByRole('button', { name: `${minutes} minuter` })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '30 minuter' }))
    next()
    expect(h.update).toHaveBeenCalledWith({ dailyMinutes: 30 }, expect.anything())
    expect(await screen.findByText('icke, inte')).toBeInTheDocument()
    expect(screen.queryByText(/Diagnos/)).not.toBeInTheDocument()
  })

  it('mounts an onboarding player with the exact plan, origin labels and no mistake writes', async () => {
    await toSession()
    expect(h.player).toMatchObject({ sessionKind: 'onboarding', sections: 'ORD', autoStart: true })
    expect(h.player?.onWrong).toBeUndefined()
    expect((await h.player?.pickQuestions())?.map((q) => q.qid)).toEqual(FIRST_SESSION_QIDS)
    expect(await h.player?.resolvePlan?.([...FIRST_SESSION_QIDS])).toHaveLength(3)
    expect(await h.player?.resolvePlan?.(['unknown', ...FIRST_SESSION_QIDS.slice(1)])).toEqual([])
    for (const qid of FIRST_SESSION_QIDS) {
      act(() => h.player?.urlSyncedQid?.setQid(qid))
      expect(screen.getByTestId('first-session-origin')).toHaveTextContent(
        `Högskoleprovet hösten ${qid.split('-')[1]}`,
      )
    }
    fireEvent.click(screen.getByRole('button', { name: 'Hoppa över' }))
    expect(h.navigate).toHaveBeenCalledWith({ to: '/' })
    expect(localStorage.getItem('hpc-welcomed')).toBe('1')
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
    expect(
      screen.getByRole('heading', {
        name:
          picks[0] === 'B'
            ? 'Du klarade 3 av 3 frågor från riktiga högskoleprov'
            : 'Du har gjort dina första 3 frågor från riktiga högskoleprov',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/fel|2 av 3/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Till Hem' }))
    expect(h.navigate).toHaveBeenCalledWith({ to: '/' })
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
    await toSession()
    expect(h.player?.resolvePlan).toBeDefined()
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

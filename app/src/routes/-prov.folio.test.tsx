import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from '@tanstack/react-router'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ComponentProps, ComponentType, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockResultRow } from '@/api/hooks/useMockResults'
import type { ActiveSession } from '@/api/hooks/useSessions'
import type { MockRunner } from '@/components/mock/MockRunner'
import type { Question } from '@/data/questions'
import { FolioShell } from '@/folio/FolioShell'
import { FolioHostContext } from '@/folio/host'
import type { FolioProvResultProps } from '@/folio/screens/prov/FolioProvResult'
import { Rail } from '@/folio/shell/Rail'
import { TabBar } from '@/folio/shell/TabBar'
import { Route } from './prov'

const state = vi.hoisted(() => ({
  search: {} as { result?: number; half?: 'verbal' | 'kvant' },
  navigate: vi.fn(),
  results: [] as MockResultRow[],
  exposure: {},
  start: vi.fn(),
  update: vi.fn(),
  bank: [] as Question[],
  active: null as ActiveSession | null,
  attempts: vi.fn(),
  startError: false,
  resetStart: vi.fn(),
  phone: false,
  realRun: false,
  runLoad: null as Promise<void> | null,
}))
vi.mock('@tanstack/react-router', async (original) => ({
  ...(await original<typeof import('@tanstack/react-router')>()),
  createFileRoute: () => (options: unknown) => ({ options, useSearch: () => state.search }),
  useNavigate: () => state.navigate,
  useLocation: () => ({ pathname: '/prov' }),
}))
vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ user: null }),
  useAuth: () => ({ userId: 'student-a' }),
  useClerk: () => ({ signOut: vi.fn() }),
}))
vi.mock('@/lib/motion', () => ({ useFirstContentSignal: vi.fn() }))
vi.mock('@/hooks/useViewport', () => ({ useViewport: () => (state.phone ? 'phone' : 'studio') }))
vi.mock('@/folio/data/useShellData', () => ({
  useFolioShellData: () => ({ subtitles: {}, dueCount: 0 }),
}))
vi.mock('@/folio/shell/Rail', { spy: true })
vi.mock('@/folio/shell/TabBar', { spy: true })
vi.mock('@/api/hooks/useAttempts', () => ({ useSubmitAttempt: () => ({ mutate: vi.fn() }) }))
vi.mock('@/api/hooks/useMistakes', () => ({ useRecordMistake: () => ({ mutate: vi.fn() }) }))
vi.mock('@/api/hooks/useMockResults', () => ({
  useMockResults: () => ({ data: state.results, isLoading: false, isError: false }),
  useExposure: () => ({ data: state.exposure }),
  useSubmitMockResult: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/api/hooks/useSessions', () => ({
  useActiveSessionOfKind: () => ({ data: state.active, isLoading: false }),
  useSessionAttempts: state.attempts,
  useStartSession: () => ({
    mutate: state.start,
    isPending: false,
    isError: state.startError,
    reset: state.resetStart,
  }),
  useUpdateSession: () => ({ mutate: state.update }),
}))
vi.mock('@/data/questions', async (original) => ({
  ...(await original<typeof import('@/data/questions')>()),
  loadBank: async () => state.bank,
}))
vi.mock('@/components/MobileFrame', () => ({
  MobileFrame: ({ children }: { children: ReactNode }) => (
    <div data-testid="classic-prov">{children}</div>
  ),
}))
vi.mock('@/components/Page', () => ({ Page: ({ children }: { children: ReactNode }) => children }))
vi.mock('@/components/mock/MockResult', () => ({
  MockResult: () => <div data-testid="classic-result" />,
}))
vi.mock('@/components/mock/MockRunner', () => ({
  MockRunner: (props: ComponentProps<typeof MockRunner>) => (
    <div data-testid="classic-runner">
      <button
        type="button"
        onClick={() =>
          props.onSettled(state.results[0], { flagged: ['q1'], answers: new Map([['q1', 'B']]) })
        }
      >
        Lämna in
      </button>
      <button type="button" onClick={props.onVoid}>
        Avbryt
      </button>
    </div>
  ),
}))
vi.mock('@/folio/screens/prov/FolioPassRun', async (original) => {
  const { default: Run } = await original<typeof import('@/folio/screens/prov/FolioPassRun')>()
  return {
    default: (props: ComponentProps<typeof MockRunner>) => {
      if (state.runLoad) throw state.runLoad
      if (state.realRun) return <Run {...props} />
      return (
        <div data-testid="folio-runner">
          <button
            type="button"
            onClick={() =>
              props.onSettled(state.results[0], {
                flagged: ['q1'],
                answers: new Map([['q1', 'B']]),
              })
            }
          >
            Lämna in
          </button>
          <button type="button" onClick={props.onVoid}>
            Avbryt
          </button>
        </div>
      )
    },
  }
})
vi.mock('@/folio/screens/prov/FolioProvResult', () => ({
  default: ({ flags, submittedAnswers }: FolioProvResultProps) => (
    <div data-testid="folio-result">
      {flags?.flagged.join(',') ?? 'utan markeringar'}
      <span data-testid="submitted-answer">
        {submittedAnswers?.answers.get('q1') ?? 'utan svar'}
      </span>
    </div>
  ),
}))
const Component = Route.options.component as ComponentType
function renderRoute(folio: boolean) {
  return render(
    <FolioHostContext.Provider value={folio}>
      <Component />
    </FolioHostContext.Provider>,
  )
}
beforeEach(() => {
  state.phone = false
  state.realRun = false
  state.runLoad = null
  vi.mocked(Rail).mockClear()
  vi.mocked(TabBar).mockClear()
  state.search = {}
  state.navigate.mockClear()
  state.start.mockReset()
  state.update.mockClear()
  state.active = null
  state.attempts.mockReset().mockReturnValue({ data: [], isLoading: false, isError: false })
  state.startError = false
  state.resetStart.mockReset().mockImplementation(() => {
    state.startError = false
  })
  state.bank = [
    {
      qid: 'q1',
      section: 'ORD',
      number: 1,
      exam_id: 'var-2024',
      provpass: 'verb1',
      prompt: 'Ordet',
      options: [{ letter: 'A', text: 'Svaret' }],
      answer: 'A',
      context: null,
      figure: null,
      parsing_status: 'complete',
    },
  ]
  state.results = [
    {
      id: 5,
      userId: 1,
      sessionId: 3,
      mode: 'authentic',
      half: 'verbal',
      examId: 'var-2024',
      provpass: 'verb1',
      presented: 1,
      answered: 1,
      correct: 1,
      seenBefore: 0,
      durationMs: 1,
      createdAt: 1,
      breakdown: { version: 1, missedQids: [], perSection: {} },
    },
  ]
  state.start.mockImplementation(
    (
      _input: unknown,
      options: { onSuccess: (session: { id: number; startedAt: number }) => void },
    ) => options.onSuccess({ id: 3, startedAt: Date.now() }),
  )
})
describe('Prov route Folio branch', () => {
  it.each([
    false,
    true,
  ])('keeps shell navigation out of the suspended run, phone=%s', async (phone) => {
    state.phone = phone
    state.realRun = true
    let release!: () => void
    state.runLoad = new Promise<void>((resolve) => {
      release = resolve
    })
    const router = createRouter({ routeTree: createRootRoute(), history: createMemoryHistory() })
    render(
      <RouterContextProvider router={router}>
        <FolioShell>
          <Component />
        </FolioShell>
      </RouterContextProvider>,
    )
    fireEvent.click(await screen.findByTestId('prov-start'))
    expect(screen.getByTestId(phone ? 'folio-tabs' : 'folio-rail')).toBeVisible()
    expect(phone ? TabBar : Rail).toHaveBeenCalled()
    vi.mocked(Rail).mockClear()
    vi.mocked(TabBar).mockClear()
    fireEvent.click(screen.getByTestId('mock-confirm-start'))
    expect(await screen.findByRole('status')).toHaveTextContent('Laddar provpasset …')
    expect(screen.queryByTestId('mock-runner')).toBeNull()
    expect(screen.getByTestId('folio-app')).toHaveAttribute('data-focus', 'true')
    expect(screen.queryByTestId('folio-rail')).toBeNull()
    expect(screen.queryByTestId('folio-tabs')).toBeNull()
    expect(screen.queryByTestId('fa-exit')).toBeNull()
    expect(Rail).not.toHaveBeenCalled()
    expect(TabBar).not.toHaveBeenCalled()

    await act(async () => {
      state.runLoad = null
      release()
    })
    expect(await screen.findByTestId('mock-runner', {}, { timeout: 5000 })).toBeVisible()
    const exit = await screen.findByTestId('fa-exit')
    expect(screen.getByTestId('folio-app')).toHaveAttribute('data-focus', 'true')
    expect(Rail).not.toHaveBeenCalled()
    expect(TabBar).not.toHaveBeenCalled()
    fireEvent.click(exit)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Avbryter du nu blir provpasset ogiltigt.')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Avbryt provpasset' }))
    expect(await screen.findByTestId('prov-void-notice')).toBeVisible()
    expect(screen.getByTestId('folio-app')).toHaveAttribute('data-focus', 'false')
    expect(screen.getByTestId(phone ? 'folio-tabs' : 'folio-rail')).toBeVisible()
  })
  it('retains the classic runner when the Folio host is off', async () => {
    const view = renderRoute(true)
    fireEvent.click(await screen.findByTestId('prov-start'))
    fireEvent.click(screen.getByTestId('mock-confirm-start'))
    expect(await screen.findByTestId('folio-runner')).toBeVisible()
    expect(screen.queryByTestId('classic-runner')).toBeNull()
    view.rerender(
      <FolioHostContext.Provider value={false}>
        <Component />
      </FolioHostContext.Provider>,
    )
    expect(screen.getByTestId('classic-runner')).toBeVisible()
    expect(screen.queryByTestId('folio-runner')).toBeNull()
  })
  it('does not fetch resume attempts for the session it just started', async () => {
    state.start.mockImplementation((input, options) => {
      state.active = {
        id: 3,
        kind: 'mock',
        userId: 1,
        sections: input.sections,
        plan: input.plan,
        position: 0,
        currentQuestionId: null,
        device: null,
        startedAt: new Date().toISOString(),
        endedAt: null,
      }
      options.onSuccess(state.active)
    })
    renderRoute(true)
    fireEvent.click(await screen.findByTestId('prov-start'))
    fireEvent.click(screen.getByTestId('mock-confirm-start'))
    expect(await screen.findByTestId('folio-runner')).toBeVisible()
    expect(state.attempts.mock.calls.some(([id]) => id === 3)).toBe(false)
  })
  it('clears a previous start error when reopening the conditions', async () => {
    const view = renderRoute(true)
    fireEvent.click(await screen.findByTestId('prov-start'))
    state.startError = true
    view.rerender(
      <FolioHostContext.Provider value={true}>
        <Component />
      </FolioHostContext.Provider>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Kunde inte starta passet')
    fireEvent.click(screen.getByTestId('mock-confirm-dismiss'))
    fireEvent.click(screen.getByTestId('prov-start'))
    expect(screen.queryByText(/Kunde inte starta passet/)).toBeNull()
    expect(state.resetStart).toHaveBeenCalledTimes(2)
  })
  it('lets an empty synthetic plan return to the picker and retry', async () => {
    state.bank = []
    renderRoute(true)
    fireEvent.click(await screen.findByTestId('prov-mode-synthetic'))
    fireEvent.click(screen.getByTestId('prov-start'))
    fireEvent.click(screen.getByTestId('mock-confirm-start'))
    expect(screen.getByRole('status')).toHaveTextContent('Inget pass kunde startas')
    expect(state.start).not.toHaveBeenCalled()
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByTestId('prov-start'))
    expect(screen.queryByRole('status')).toBeNull()
  })
  it('shows the Folio hub and result, while keeping classic surfaces when the host is off', async () => {
    const view = renderRoute(true)
    expect(await screen.findByTestId('folio-prov')).toBeVisible()
    expect(screen.queryByTestId('classic-prov')).toBeNull()
    state.search = { result: 5 }
    view.rerender(
      <FolioHostContext.Provider value={true}>
        <Component />
      </FolioHostContext.Provider>,
    )
    expect(await screen.findByTestId('folio-result')).toHaveTextContent('utan markeringar')
    view.rerender(
      <FolioHostContext.Provider value={false}>
        <Component />
      </FolioHostContext.Provider>,
    )
    expect(screen.getByTestId('classic-result')).toBeVisible()
    state.search = {}
    view.rerender(
      <FolioHostContext.Provider value={false}>
        <Component />
      </FolioHostContext.Provider>,
    )
    expect(screen.getByTestId('classic-prov')).toBeVisible()
    expect(screen.getByTestId('prov-picker')).toBeVisible()
  })
  it('starts through the conditions into the Folio runner and keeps flags only for its result', async () => {
    const view = renderRoute(true)
    fireEvent.click(await screen.findByTestId('prov-start'))
    fireEvent.click(screen.getByTestId('mock-confirm-start'))
    expect(await screen.findByTestId('folio-runner')).toBeVisible()
    expect(state.start).toHaveBeenCalledTimes(1)
    expect(state.start.mock.calls[0][0]).toEqual({
      kind: 'mock',
      sections: 'authentic:verbal:var-2024:verb1',
      plan: ['q1'],
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lämna in' }))
    expect(state.navigate).toHaveBeenCalledWith({ to: '/prov', search: { result: 5 } })
    state.search = { result: 5 }
    view.rerender(
      <FolioHostContext.Provider value={true}>
        <Component />
      </FolioHostContext.Provider>,
    )
    expect(await screen.findByTestId('folio-result')).toHaveTextContent('q1')
    expect(screen.getByTestId('submitted-answer')).toHaveTextContent('B')
    state.search = { result: 6 }
    view.rerender(
      <FolioHostContext.Provider value={true}>
        <Component />
      </FolioHostContext.Provider>,
    )
    expect(screen.getByTestId('folio-result')).toHaveTextContent('utan markeringar')
    expect(screen.getByTestId('submitted-answer')).toHaveTextContent('utan svar')
    view.unmount()
    state.search = { result: 5 }
    renderRoute(true)
    expect(await screen.findByTestId('folio-result')).toHaveTextContent('utan markeringar')
    expect(screen.getByTestId('submitted-answer')).toHaveTextContent('utan svar')
  })
  it('returns to the Folio hub with the void notice when a run is abandoned', async () => {
    renderRoute(true)
    fireEvent.click(await screen.findByTestId('prov-start'))
    fireEvent.click(screen.getByTestId('mock-confirm-start'))
    await waitFor(() => expect(screen.getByTestId('folio-runner')).toBeVisible())
    fireEvent.click(screen.getByRole('button', { name: 'Avbryt' }))
    expect(await screen.findByTestId('prov-void-notice')).toHaveTextContent(
      'Provet avbröts — ogiltigt.',
    )
  })
})

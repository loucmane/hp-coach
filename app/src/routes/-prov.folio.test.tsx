import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentProps, ComponentType, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockResultRow } from '@/api/hooks/useMockResults'
import type { MockRunner } from '@/components/mock/MockRunner'
import type { Question } from '@/data/questions'
import { FolioHostContext } from '@/folio/host'
import { Route } from './prov'

const state = vi.hoisted(() => ({
  search: {} as { result?: number; half?: 'verbal' | 'kvant' },
  navigate: vi.fn(),
  results: [] as MockResultRow[],
  exposure: {},
  start: vi.fn(),
  update: vi.fn(),
  bank: [] as Question[],
}))
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({ options, useSearch: () => state.search }),
  useNavigate: () => state.navigate,
}))
vi.mock('@clerk/clerk-react', () => ({ useUser: () => ({ user: null }) }))
vi.mock('@/lib/motion', () => ({ useFirstContentSignal: vi.fn() }))
vi.mock('@/hooks/useViewport', () => ({ useViewport: () => 'studio' }))
vi.mock('@/api/hooks/useMockResults', () => ({
  useMockResults: () => ({ data: state.results, isLoading: false, isError: false }),
  useExposure: () => ({ data: state.exposure }),
}))
vi.mock('@/api/hooks/useSessions', () => ({
  useActiveSessionOfKind: () => ({ data: null, isLoading: false }),
  useSessionAttempts: () => ({ data: [], isLoading: false, isError: false }),
  useStartSession: () => ({ mutate: state.start, isPending: false, isError: false }),
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
      <button type="button" onClick={() => props.onSettled(state.results[0], { flagged: ['q1'] })}>
        Lämna in
      </button>
      <button type="button" onClick={props.onVoid}>
        Avbryt
      </button>
    </div>
  ),
}))
vi.mock('@/folio/screens/prov/FolioProvResult', () => ({
  default: ({ flags }: { flags: { flagged: string[] } | null }) => (
    <div data-testid="folio-result">{flags?.flagged.join(',') ?? 'utan markeringar'}</div>
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
  state.search = {}
  state.navigate.mockClear()
  state.start.mockReset()
  state.update.mockClear()
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
  it('starts through the conditions into MockRunner and keeps flags only for its result', async () => {
    const view = renderRoute(true)
    fireEvent.click(await screen.findByTestId('prov-start'))
    fireEvent.click(screen.getByTestId('mock-confirm-start'))
    expect(await screen.findByTestId('classic-runner')).toBeVisible()
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
    state.search = { result: 6 }
    view.rerender(
      <FolioHostContext.Provider value={true}>
        <Component />
      </FolioHostContext.Provider>,
    )
    expect(screen.getByTestId('folio-result')).toHaveTextContent('utan markeringar')
    view.unmount()
    state.search = { result: 5 }
    renderRoute(true)
    expect(await screen.findByTestId('folio-result')).toHaveTextContent('utan markeringar')
  })
  it('returns to the Folio hub with the void notice when a run is abandoned', async () => {
    renderRoute(true)
    fireEvent.click(await screen.findByTestId('prov-start'))
    fireEvent.click(screen.getByTestId('mock-confirm-start'))
    await waitFor(() => expect(screen.getByTestId('classic-runner')).toBeVisible())
    fireEvent.click(screen.getByRole('button', { name: 'Avbryt' }))
    expect(await screen.findByTestId('prov-void-notice')).toHaveTextContent(
      'Provet avbröts — ogiltigt.',
    )
  })
})

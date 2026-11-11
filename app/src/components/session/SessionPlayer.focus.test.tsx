import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { type ComponentProps, type ReactNode, useState } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import type { ActiveSession } from '@/api/hooks/useSessions'
import type { Question } from '@/data/questions'
import { type FocusRequest, FolioHostContext, ShellFocusContext } from '@/folio/host'
import { FocusBar } from '@/folio/shell/FocusBar'
import { endedSessionIdsThisTab } from '@/lib/endedSessions'

const h = vi.hoisted(() => ({
  active: null as ActiveSession | null,
  attempts: [] as { questionId: string; selectedAnswer: string }[],
  start: vi.fn(),
  update: vi.fn(),
  submit: vi.fn(),
  requests: [] as FocusRequest[],
}))
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children, ...props }: ComponentProps<'a'> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))
vi.mock('@/api/hooks/useSessions', () => ({
  useActiveSessionOfKind: () => ({ data: h.active, isPending: false }),
  useStartSession: () => ({ mutateAsync: h.start, isPending: false }),
  useUpdateSession: () => ({ mutate: h.update }),
  useSessionAttempts: () => ({ data: h.attempts }),
}))
vi.mock('@/api/hooks/useAttempts', () => ({ useSubmitAttempt: () => ({ mutate: h.submit }) }))
vi.mock('@/data/explanations', () => ({
  loadExplanation: async () => null,
  peekExplanation: () => null,
}))
vi.mock('@/hooks/useViewport', () => ({ useViewport: () => 'phone' }))
vi.mock('@/components/motion/DueNumeral', () => ({ DueHeaderStation: () => null }))
vi.mock('@/components/drill/DrillResult', () => ({ DrillResult: () => <h1>Klart</h1> }))
vi.mock('@/components/motion/QuestionPan', () => ({
  QuestionPan: ({ children }: { children: ReactNode }) => children,
}))

import { SessionPlayer } from './SessionPlayer'

const plan: Question[] = [1, 2, 3].map((n) => ({
  qid: `host-2022-kvant2-KVA-${n}`,
  exam_id: 'host-2022',
  provpass: 'kvant2',
  section: 'KVA',
  number: n,
  prompt: 'Kvantitet I: 2\nKvantitet II: 1',
  context: null,
  answer: 'A',
  parsing_status: 'complete',
  options: [
    { letter: 'A', text: 'I är större än II' },
    { letter: 'B', text: 'II är större än I' },
  ],
}))
function Host({ folio, children }: { folio: boolean; children: ReactNode }) {
  const [request, setRequest] = useState<FocusRequest | null>(null)
  if (request) h.requests.push(request)
  return (
    <FolioHostContext.Provider value={folio}>
      <ShellFocusContext.Provider value={setRequest}>
        {request && <FocusBar {...request} onExit={request.onExit ?? (() => {})} />}
        {children}
      </ShellFocusContext.Provider>
    </FolioHostContext.Provider>
  )
}
function mount(folio = true, questions = plan) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  client.setQueryData(['question-bank'], questions)
  const tree = () => (
    <QueryClientProvider client={client}>
      <Host folio={folio}>
        <SessionPlayer
          sessionKind="drill"
          sections="KVA"
          pickQuestions={() => questions}
          resolvePlan={async () => questions}
          idleEyebrow="Öva"
          idleHeadline="Övning"
          idleSubcopy="KVA"
          activeTab="ova"
          autoStart
        />
      </Host>
    </QueryClientProvider>
  )
  const result = render(tree())
  return { ...result, refresh: () => result.rerender(tree()) }
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  vi.spyOn(window.history, 'back').mockImplementation(() => {})
  window.history.replaceState(null, '')
  endedSessionIdsThisTab.clear()
  h.active = null
  h.attempts = []
  h.requests = []
  h.start.mockResolvedValue({ id: 42 })
})

it('feeds real progress and sequential navigation to the Folio bar, then clears it at completion', async () => {
  mount()
  await screen.findByTestId('fa-lock')
  const strip = screen.getByRole('navigation', { name: 'Frågor i passet' })
  expect(screen.getByText('KVA · 1 av 3')).toBeInTheDocument()
  let cells = within(strip).getAllByRole('button')
  expect(cells).toHaveLength(3)
  expect(cells[0]).toHaveAttribute('data-state', 'cur')
  expect(cells.every((cell) => (cell as HTMLButtonElement).disabled)).toBe(true)
  h.update.mockClear()
  fireEvent.click(cells[2])
  expect(h.update).not.toHaveBeenCalled()
  fireEvent.click(screen.getByTestId('option-B'))
  fireEvent.click(screen.getByTestId('fa-lock'))
  cells = within(screen.getByRole('navigation', { name: 'Frågor i passet' })).getAllByRole('button')
  expect(cells[0]).toHaveAccessibleName('Fråga 1 av 3, kommer tillbaka')
  expect(cells[0]).toHaveAttribute('aria-current', 'step')
  expect(cells[1]).toBeEnabled()
  expect(cells[2]).toBeDisabled()
  fireEvent.click(cells[1])
  expect(h.update).toHaveBeenCalledWith({
    id: 42,
    patch: { position: 1, currentQuestionId: plan[1].qid },
  })
  expect(screen.getByText('KVA · 2 av 3')).toBeInTheDocument()
  for (let n = 1; n < 3; n++) {
    fireEvent.click(await screen.findByTestId('option-A'))
    fireEvent.click(screen.getByTestId('fa-lock'))
    expect(screen.getByRole('button', { name: `Fråga ${n + 1} av 3, rätt` })).toHaveAttribute(
      'data-state',
      'ok',
    )
    fireEvent.click(screen.getByTestId('drill-next'))
  }
  expect(screen.queryByRole('navigation', { name: 'Frågor i passet' })).toBeNull()
  expect(screen.queryByText(/KVA · \d av 3/)).toBeNull()
})

it('restores answered cells from session attempts without leaking answer text', async () => {
  h.active = {
    id: 73,
    userId: 1,
    kind: 'drill',
    sections: 'KVA',
    position: 2,
    currentQuestionId: plan[2].qid,
    plan: plan.map((q) => q.qid),
    device: 'desktop',
    startedAt: null,
    endedAt: null,
  }
  h.attempts = [
    { questionId: plan[0].qid, selectedAnswer: 'B' },
    { questionId: plan[1].qid, selectedAnswer: 'A' },
  ]
  const { refresh } = mount()
  await screen.findByTestId('fa-lock')
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Fråga 2 av 3, rätt' })).toHaveAttribute(
      'data-state',
      'ok',
    ),
  )
  expect(screen.getByRole('button', { name: 'Fråga 1 av 3, kommer tillbaka' })).toHaveAttribute(
    'data-state',
    'back',
  )
  expect(screen.getByText('KVA · 3 av 3')).toBeInTheDocument()
  expect(screen.queryByText(/Rätt svar/)).toBeNull()
  const last = h.requests.at(-1)!
  refresh()
  await act(async () => {})
  expect(h.requests.at(-1)?.strip).toBe(last.strip)
  expect(h.start).not.toHaveBeenCalled()
})

it('advances the reading core as well as the session cursor inside a shared passage', async () => {
  const questions = plan.map((q) => ({
    ...q,
    section: 'LÄS' as const,
    context: 'En gemensam text.',
  }))
  mount(true, questions)
  await screen.findByTestId('fa-lock')
  fireEvent.click(screen.getByTestId('option-A'))
  fireEvent.click(screen.getByTestId('fa-lock'))
  fireEvent.click(screen.getByRole('button', { name: 'Fråga 2 av 3, ej besvarad' }))
  expect(screen.getByTestId('drill-question')).toHaveAttribute('data-qid', questions[1].qid)
  expect(screen.getByTestId('drill-question')).toHaveAttribute('data-phase', 'question')
  expect(screen.getByText('LÄS · 2 av 3')).toBeInTheDocument()
  expect(screen.getByTestId('fa-lock')).toBeDisabled()
})

it('keeps strip and where absent outside the Folio host and retains direct classic answering', async () => {
  mount(false)
  await screen.findByTestId('option-A')
  expect(screen.queryByRole('navigation', { name: 'Frågor i passet' })).toBeNull()
  expect(h.requests.at(-1)?.strip).toBeUndefined()
  expect(h.requests.at(-1)?.where).toBeUndefined()
  fireEvent.keyDown(document.body, { key: 'a' })
  await act(async () => {})
  expect(h.submit).toHaveBeenCalledTimes(1)
})

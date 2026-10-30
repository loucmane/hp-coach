import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentProps, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActiveSession } from '@/api/hooks/useSessions'
import type { Question } from '@/data/questions'

type SavedAttempt = { questionId: string; selectedAnswer: string }

const h = vi.hoisted(() => ({
  active: null as ActiveSession | null,
  attempts: vi.fn<() => Promise<SavedAttempt[]>>(),
  start: vi.fn(),
  update: vi.fn(),
  submit: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => h.navigate,
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
  useSessionAttempts: (id: number | null) =>
    useQuery({
      queryKey: ['sessions', 'attempts', id],
      queryFn: h.attempts,
      enabled: id !== null,
      staleTime: Infinity,
    }),
}))
vi.mock('@/api/hooks/useAttempts', () => ({ useSubmitAttempt: () => ({ mutate: h.submit }) }))
vi.mock('@/data/explanations', () => ({
  loadExplanation: async () => null,
  peekExplanation: () => null,
}))
vi.mock('@/hooks/useViewport', () => ({ useViewport: () => 'studio' }))
vi.mock('@/components/motion/DueNumeral', () => ({ DueHeaderStation: () => null }))
vi.mock('@/components/motion/QuestionPan', () => ({
  QuestionPan: ({ children }: { children: ReactNode }) => children,
}))

import { FolioHostContext } from '@/folio/host'
import { endedSessionIdsThisTab } from '@/lib/endedSessions'
import { SessionPlayer } from './SessionPlayer'

const plan: Question[] = [30, 31, 32, 33].map((number) => ({
  qid: `host-2025-verb1-ELF-${number}`,
  exam_id: 'host-2025',
  provpass: 'verb1',
  section: 'ELF',
  number,
  prompt: '',
  // A preceding block ensures saved answers are indexed by the whole plan.
  context:
    number === 30 ? 'An earlier text.' : 'A title\n\nWe 31_____ it, 32_____ it, and 33_____ it.',
  answer: 'A',
  parsing_status: 'complete',
  options: [
    { letter: 'A', text: 'read' },
    { letter: 'B', text: 'ignore' },
    { letter: 'C', text: 'remember' },
    { letter: 'D', text: 'write' },
  ],
}))
const saved: SavedAttempt[] = [
  { questionId: plan[0].qid, selectedAnswer: 'A' },
  { questionId: plan[1].qid, selectedAnswer: 'B' },
  { questionId: plan[2].qid, selectedAnswer: 'A' },
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  vi.spyOn(window.history, 'back').mockImplementation(() => {})
  window.history.replaceState(null, '')
  endedSessionIdsThisTab.clear()
  h.active = {
    id: 73,
    userId: 1,
    kind: 'drill',
    sections: 'ELF',
    position: 3,
    currentQuestionId: plan[3].qid,
    plan: plan.map((q) => q.qid),
    device: 'desktop',
    startedAt: null,
    endedAt: null,
  }
})

describe('SessionPlayer restores prior Folio ELF answers on resume', () => {
  it.each([
    'cached',
    'while choosing',
    'after grading',
  ] as const)('shows graded earlier gaps when attempts arrive %s', async (arrival) => {
    let resolveAttempts!: (rows: SavedAttempt[]) => void
    h.attempts.mockReturnValue(
      new Promise((resolve) => {
        resolveAttempts = resolve
      }),
    )
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    })
    if (arrival === 'cached') client.setQueryData(['sessions', 'attempts', 73], saved)
    const resolvePlan = vi.fn(async () => plan)
    const pickQuestions = vi.fn(() => plan)
    const { container } = render(
      <QueryClientProvider client={client}>
        <FolioHostContext.Provider value={true}>
          <SessionPlayer
            sessionKind="drill"
            sections="ELF"
            pickQuestions={pickQuestions}
            resolvePlan={resolvePlan}
            idleEyebrow="Öva"
            idleHeadline="Övning"
            idleSubcopy="Engelsk läsförståelse"
            activeTab="ova"
            autoStart
          />
        </FolioHostContext.Provider>
      </QueryClientProvider>,
    )
    const lock = await screen.findByTestId('fa-lock')
    expect(resolvePlan).toHaveBeenCalledWith(h.active?.plan, 3)
    expect(h.start).not.toHaveBeenCalled()
    expect(pickQuestions).not.toHaveBeenCalled()
    expect(screen.getByTestId('drill-prompt')).toHaveTextContent('Lucka 33')
    fireEvent.keyDown(document.body, { key: 'b' })
    expect(h.submit).not.toHaveBeenCalled()
    if (arrival === 'after grading') fireEvent.click(lock)
    if (arrival !== 'cached') {
      expect(container.querySelector('[data-gap="31"]')).toHaveAttribute('data-state', 'blank')
      await act(async () => resolveAttempts(saved))
    }
    await waitFor(() => {
      expect(container.querySelector('[data-gap="31"]')).toHaveAttribute('data-state', 'wrong')
      expect(container.querySelector('[data-gap="32"]')).toHaveAttribute('data-state', 'right')
    })
    expect(container.querySelector('[data-gap="31"] s')).toHaveTextContent('ignore')
    expect(container.querySelector('[data-gap="32"] .rd-gapword')).toHaveTextContent('read')
    expect(screen.getByTestId('drill-prompt')).toHaveTextContent('Lucka 33')
    if (arrival !== 'after grading') {
      expect(screen.getByTestId('option-B')).toHaveAttribute('aria-pressed', 'true')
      expect(h.submit).not.toHaveBeenCalled()
      fireEvent.click(lock)
    }
    expect(screen.getByTestId('fa-verdict')).toHaveTextContent('Fel.')
    expect(container.querySelector('[data-gap="33"]')).toHaveAttribute('data-state', 'wrong')
    expect(container.querySelector('[data-gap="31"] s')).toHaveTextContent('ignore')
    expect(h.submit).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        sessionId: 73,
        questionId: plan[3].qid,
        selectedAnswer: 'B',
        correct: false,
      }),
    )
  })
})

import { focusManager, QueryClientProvider } from '@tanstack/react-query'
import {
  act,
  fireEvent,
  render as renderView,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockResultRow } from '@/api/hooks/useMockResults'
import { createQueryClient } from '@/api/queryClient'
import type { Question } from '@/data/questions'
import type { MockAttemptRow } from '@/lib/mockSheet'
import type { NormeringSitting } from '@/lib/normering'
import type { TrapCluster } from '@/lib/trapCluster'
import FolioProvResult, { type FolioProvResultProps } from './FolioProvResult'

const state = vi.hoisted(() => ({
  attempts: [] as MockAttemptRow[],
  table: null as NormeringSitting | null,
  cluster: null as TrapCluster | null,
  viewport: 'studio',
  getAttempts: vi.fn(),
}))
vi.mock('@/hooks/useViewport', () => ({ useViewport: () => state.viewport }))
// Keep the real query hook and adapter: the response envelope/field names
// match worker/src/routes/sessions.ts GET /:id/attempts.
vi.mock('@/api/useApiClient', () => ({
  useApiClient: () => ({
    api: { sessions: { ':id': { attempts: { $get: state.getAttempts } } } },
  }),
}))
vi.mock('@/lib/normering', async (original) => ({
  ...(await original<typeof import('@/lib/normering')>()),
  loadNormeringTable: async () => state.table,
}))
vi.mock('@/lib/trapCluster', () => ({ useTrapCluster: () => state.cluster }))
vi.mock('@/data/frameworks', () => ({ loadFramework: async () => null, entryHeadword: () => null }))
const bank: Question[] = ['ORD', 'LÄS'].map((section, i) => ({
  qid: `q${i}`,
  section: section as Question['section'],
  number: i + 1,
  exam_id: 'var-2024',
  provpass: 'verb1',
  prompt: i ? 'Vilken slutsats?' : 'Vad betyder ordet?',
  options: [
    { letter: 'A', text: 'Alpha' },
    { letter: 'B', text: 'Beta' },
  ],
  answer: 'A',
  context: null,
  figure: null,
  parsing_status: 'complete',
}))
const row: MockResultRow = {
  id: 5,
  userId: 1,
  sessionId: 3,
  mode: 'authentic',
  half: 'verbal',
  examId: 'var-2024',
  provpass: 'verb1',
  presented: 3,
  answered: 2,
  correct: 1,
  seenBefore: 0,
  durationMs: 600_000,
  createdAt: 100,
  breakdown: {
    version: 1,
    missedQids: ['q0'],
    perSection: {
      ORD: { presented: 1, correct: 0, timeMs: 60_000 },
      LÄS: { presented: 2, correct: 1, timeMs: 540_000 },
    },
  },
}
const navigateHref = vi.fn()
let queryClient = createQueryClient()
function render(ui: ReactElement) {
  return renderView(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })
}
function props(overrides: Partial<FolioProvResultProps> = {}): FolioProvResultProps {
  return {
    resultId: 5,
    results: { data: [row, { ...row, id: 6 }] },
    bank,
    flags: { resultId: 5, flagged: ['q0', 'q1'] },
    navigateHref,
    ...overrides,
  }
}
beforeEach(() => {
  queryClient = createQueryClient()
  navigateHref.mockClear()
  state.viewport = 'studio'
  state.getAttempts.mockReset().mockImplementation(async () => ({
    ok: true,
    json: async () => ({ attempts: state.attempts }),
  }))
  state.cluster = null
  state.table = null
  state.attempts = [
    { questionId: 'q0', selectedAnswer: 'B', timeTakenMs: 1, createdAt: 1 },
    { questionId: 'q1', selectedAnswer: 'A', timeTakenMs: 1, createdAt: 2 },
  ]
})
afterEach(() => {
  queryClient.clear()
  focusManager.setFocused(undefined)
})
describe('Folio Provpass result', () => {
  it('uses the snapshot during the first fetch but retains initial loading after reload', () => {
    state.getAttempts.mockImplementation(() => new Promise(() => {}))
    const submittedAnswers = { resultId: 5, answers: new Map([['q0', 'B']]) }
    const { rerender } = render(<FolioProvResult {...props({ submittedAnswers })} />)
    fireEvent.click(screen.getByRole('button', { name: /Vad betyder ordet/ }))
    expect(screen.getByText(/Ditt svar: B/)).toBeVisible()
    expect(screen.queryByText(/Hämtar ditt svar/)).toBeNull()
    rerender(<FolioProvResult {...props({ submittedAnswers: null })} />)
    expect(screen.getByText(/Hämtar ditt svar/)).toBeVisible()
  })
  it.each([
    { attempts: [] },
    { attempts: [{ questionId: 'q0', selectedAnswer: 'A', timeTakenMs: 1, createdAt: 1 }] },
  ])('prefers submitted answers while a slow final attempt is missing from the API: %j', async ({
    attempts,
  }) => {
    // The attempt POST has not landed: GET returns either no pick or the previous one.
    state.attempts = attempts
    const submittedAnswers = {
      resultId: 5,
      answers: new Map([
        ['q0', 'B'],
        ['q1', 'A'],
      ]),
    }
    queryClient.setQueryData(['sessions', 'attempts', row.sessionId], state.attempts)
    const { rerender } = render(<FolioProvResult {...props({ submittedAnswers })} />)
    fireEvent.click(screen.getByRole('button', { name: /Vad betyder ordet/ }))
    expect(screen.getByText(/Ditt svar: B/)).toBeVisible()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
    expect(state.getAttempts).toHaveBeenCalled()
    expect(screen.getByText('Beta').closest('li')).toHaveAttribute('data-grade', 'wrong')
    expect(screen.getByTestId('prov-res-flagged')).toBeVisible()
    // A different result or a reload must use persisted attempts, never this snapshot.
    queryClient.setQueryData(
      ['sessions', 'attempts', row.sessionId],
      [{ questionId: 'q0', selectedAnswer: 'A', timeTakenMs: 1, createdAt: 1 }],
    )
    rerender(
      <FolioProvResult {...props({ submittedAnswers: { ...submittedAnswers, resultId: 8 } })} />,
    )
    expect(await screen.findByText(/Ditt svar: A/)).toBeVisible()
    rerender(<FolioProvResult {...props({ submittedAnswers: null })} />)
    expect(screen.getByText(/Ditt svar: A/)).toBeVisible()
  })
  it('keeps the saved answer visible while refocus refreshes attempts in the background', async () => {
    render(<FolioProvResult {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: /Vad betyder ordet/ }))
    expect(await screen.findByText(/Ditt svar: B/)).toBeVisible()
    state.getAttempts.mockImplementationOnce(() => new Promise(() => {}))
    await act(async () => {
      await queryClient.invalidateQueries({
        queryKey: ['sessions', 'attempts', row.sessionId],
        refetchType: 'none',
      })
      focusManager.setFocused(false)
      focusManager.setFocused(true)
    })
    await waitFor(() => expect(queryClient.isFetching()).toBe(1))
    expect(screen.queryByText(/Hämtar ditt svar/)).toBeNull()
    expect(screen.getByText(/Ditt svar: B/)).toBeVisible()
  })
  it('opens the real facit with the saved answer and shows flagged-right only', async () => {
    const user = userEvent.setup()
    const { container, rerender } = render(<FolioProvResult {...props()} />)
    expect(container.querySelectorAll('.fa-btn')).toHaveLength(1)
    expect(screen.getByText('1 obesvarade')).toBeVisible()
    const marked = await screen.findByTestId('prov-res-flagged')
    expect(within(marked).getAllByRole('button')).toHaveLength(1)
    expect(marked).toHaveTextContent('Vilken slutsats?')
    await user.click(screen.getByRole('button', { name: /Vad betyder ordet/ }))
    expect(screen.getByText(/Ditt svar: B · rätt svar:/)).toHaveTextContent(
      'Ditt svar: B · rätt svar: A.',
    )
    expect(screen.getByText('Alpha')).toBeVisible()
    expect(screen.getByText('Beta')).toBeVisible()
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(navigateHref).toHaveBeenCalledExactlyOnceWith('/repetition')
    rerender(<FolioProvResult {...props({ flags: { resultId: 8, flagged: ['q1'] } })} />)
    expect(screen.queryByTestId('prov-res-flagged')).toBeNull()
    rerender(<FolioProvResult {...props({ flags: null })} />)
    expect(screen.queryByTestId('prov-res-flagged')).toBeNull()
  })
  it('uses normed scoring, history and practice links, and preserves native modified clicks', async () => {
    state.table = {
      exam_id: 'var-2024',
      source_url: '',
      verbal: { source_pdf: '', bands: [], table: Array(81).fill(1.25) },
    }
    render(<FolioProvResult {...props()} />)
    await waitFor(() => expect(screen.getByTestId('mock-result-score')).toHaveTextContent('1,25'))
    expect(screen.getByText(/Härlett ur UHR/)).toBeVisible()
    const history = within(screen.getByTestId('mock-result-history')).getByRole('link')
    expect(history).toHaveAttribute('href', '/prov?result=6')
    expect(history).toHaveTextContent('1/3')
    expect(history).not.toHaveTextContent('0,65')
    expect(history).not.toHaveAccessibleName(/linjär skattning/)
    expect(screen.queryByText(/Poängen i listan/)).toBeNull()
    const pattern = within(screen.getByTestId('prov-res-pattern')).getByRole('link')
    expect(pattern).toHaveAttribute('href', '/drill?section=ORD&start=1')
    fireEvent.click(pattern, { ctrlKey: true })
    expect(navigateHref).not.toHaveBeenCalled()
    fireEvent.click(pattern)
    expect(navigateHref).toHaveBeenCalledWith('/drill?section=ORD&start=1')
  })
  it.each([
    { cached: [] },
    {
      cached: [
        { questionId: 'var-2024-ORD-001', selectedAnswer: 'A', timeTakenMs: 1, createdAt: 1 },
      ],
    },
  ])('refreshes fresh resume-cache answers from the real API envelope: $cached', async ({
    cached,
  }) => {
    const q = { ...bank[0], qid: 'var-2024-ORD-001' }
    const result = { ...row, breakdown: { ...row.breakdown, missedQids: [q.qid] } }
    queryClient.setQueryData(['sessions', 'attempts', row.sessionId], cached)
    const attempts = [
      {
        questionId: q.qid,
        selectedAnswer: 'A',
        correct: true,
        timeTakenMs: 2000,
        createdAt: '2026-10-22T18:00:00.000Z',
      },
      {
        questionId: q.qid,
        selectedAnswer: 'B',
        correct: false,
        timeTakenMs: 3000,
        createdAt: '2026-10-22T18:00:05.000Z',
      },
    ]
    state.getAttempts.mockResolvedValue({ ok: true, json: async () => ({ attempts }) })
    render(<FolioProvResult {...props({ results: { data: [result] }, bank: [q], flags: null })} />)
    fireEvent.click(screen.getByRole('button', { name: /Vad betyder ordet/ }))
    await waitFor(() => expect(screen.getByText(/Ditt svar: B · rätt svar:/)).toBeVisible())
    expect(state.getAttempts).toHaveBeenCalledWith({ param: { id: '3' } })
    expect(screen.getByText('Beta').closest('li')).toHaveAttribute('data-grade', 'wrong')
    expect(screen.queryByText(/Ditt svar: obesvarad/)).toBeNull()
  })
  it('does not mislabel missing persisted answers as blank questions', async () => {
    state.attempts = []
    render(<FolioProvResult {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: /Vad betyder ordet/ }))
    await waitFor(() => expect(screen.getByText(/Ditt svar kunde inte hämtas/)).toBeVisible())
    expect(screen.queryByText(/Ditt svar: obesvarad/)).toBeNull()
  })
  it.each([
    'studio',
    'phone',
  ])('shows no elapsed time or tempo for an unvisited section on %s', (viewport) => {
    state.viewport = viewport
    const result = {
      ...row,
      answered: row.presented,
      breakdown: {
        ...row.breakdown,
        perSection: {
          ...row.breakdown.perSection,
          MEK: { presented: 10, correct: 0, timeMs: 0 },
        },
      },
    }
    render(<FolioProvResult {...props({ results: { data: [result] } })} />)
    const section = within(screen.getByTestId('mock-result-pace-MEK'))
    expect(section.getByTestId('mock-result-pace-note-MEK')).toHaveTextContent(/^—$/)
    expect(section.getAllByRole('cell')[1]).toHaveTextContent(/^—/)
    expect(section.getAllByRole('cell')[2]).toHaveTextContent('8:00')
    expect(screen.queryByText('0 obesvarade')).toBeNull()
  })
  it('shows a new pass primary with no misses and a not-found state for an absent result', () => {
    const clean = { ...row, breakdown: { ...row.breakdown, missedQids: [] } }
    const { rerender } = render(
      <FolioProvResult {...props({ results: { data: [clean] }, flags: null })} />,
    )
    expect(screen.getByRole('link', { name: 'Nytt provpass' })).toHaveClass('fa-btn')
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(navigateHref).toHaveBeenCalledWith('/prov')
    rerender(<FolioProvResult {...props({ resultId: 99 })} />)
    expect(screen.getByTestId('prov-result-not-found')).toHaveTextContent(
      'Resultatet hittades inte.',
    )
  })
  it('discloses P5 text and keeps ELF content in English within the facit', () => {
    const q: Question = {
      ...bank[0],
      qid: 'p5-unit-r1-ELF-001',
      section: 'ELF',
      prompt: 'What is implied?',
      context: 'A title\n\nThis is an English passage.',
    }
    const p5row = {
      ...row,
      breakdown: { ...row.breakdown, missedQids: [q.qid] },
      estimateBasis: {
        authentic: 2,
        synthetic: 1,
        unknown: 0,
        unclassified: 0,
        calibrated: false,
        perSection: {},
      },
    }
    render(<FolioProvResult {...props({ results: { data: [p5row] }, bank: [q] })} />)
    fireEvent.click(screen.getByRole('button', { name: /What is implied/ }))
    expect(screen.getByText('Övningstext')).toBeVisible()
    expect(screen.getByText(/Personer, citat/)).toBeVisible()
    expect(screen.getByText('This is an English passage.').closest('[lang]')).toHaveAttribute(
      'lang',
      'en',
    )
    expect(screen.getByText(/Uppskattningen för LÄS/)).toBeVisible()
  })
  it('passes axe on the result and expanded facit', async () => {
    const { container } = render(
      <div data-folio>
        <FolioProvResult {...props()} />
      </div>,
    )
    fireEvent.click(screen.getByRole('button', { name: /Vad betyder ordet/ }))
    expect(
      (await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })).violations,
    ).toEqual([])
  })
})

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockResultRow } from '@/api/hooks/useMockResults'
import type { Question } from '@/data/questions'
import type { MockAttemptRow } from '@/lib/mockSheet'
import type { NormeringSitting } from '@/lib/normering'
import type { TrapCluster } from '@/lib/trapCluster'
import FolioProvResult, { type FolioProvResultProps } from './FolioProvResult'

const state = vi.hoisted(() => ({
  attempts: [] as MockAttemptRow[],
  table: null as NormeringSitting | null,
  cluster: null as TrapCluster | null,
}))
vi.mock('@/hooks/useViewport', () => ({ useViewport: () => 'studio' }))
vi.mock('@/api/hooks/useSessions', () => ({
  useSessionAttempts: () => ({ data: state.attempts, isLoading: false, isError: false }),
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
  navigateHref.mockClear()
  state.cluster = null
  state.table = null
  state.attempts = [
    { questionId: 'q0', selectedAnswer: 'B', timeTakenMs: 1, createdAt: 1 },
    { questionId: 'q1', selectedAnswer: 'A', timeTakenMs: 1, createdAt: 2 },
  ]
})
describe('Folio Provpass result', () => {
  it('opens the real facit with the saved answer and shows flagged-right only', async () => {
    const user = userEvent.setup()
    const { container, rerender } = render(<FolioProvResult {...props()} />)
    expect(container.querySelectorAll('.fa-btn')).toHaveLength(1)
    expect(screen.getByText('1 obesvarade')).toBeVisible()
    const marked = screen.getByTestId('prov-res-flagged')
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
    const pattern = within(screen.getByTestId('prov-res-pattern')).getByRole('link')
    expect(pattern).toHaveAttribute('href', '/drill?section=ORD&start=1')
    fireEvent.click(pattern, { ctrlKey: true })
    expect(navigateHref).not.toHaveBeenCalled()
    fireEvent.click(pattern)
    expect(navigateHref).toHaveBeenCalledWith('/drill?section=ORD&start=1')
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

// MockResult — post-Provpass analysis screen. Fixture-driven: a
// realistic MockResultRow (verbal, 38/40, one section over pacing
// budget, two misses sharing a trap) exercises every section the task
// spec calls for.

import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { MockResultRow } from '@/api/hooks/useMockResults'
import type { NormeringSitting } from '@/lib/normering'
import { MockResult } from './MockResult'

let mockHistoryRows: MockResultRow[] = []
vi.mock('@/api/hooks/useMockResults', () => ({
  useMockResults: () => ({ data: mockHistoryRows, isLoading: false }),
}))

// Normering loader is mocked so the component's official-vs-linear
// branch is exercised deterministically (jsdom has no static assets).
let mockSitting: NormeringSitting | null = null
vi.mock('@/lib/normering', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/normering')>()
  return {
    ...actual,
    loadNormeringTable: () => Promise.resolve(mockSitting),
  }
})

// A sitting whose verbal 80q table maps raw 60 -> 1.4 (so a 40q pass of
// 30/40 scales to raw 60 and derives 1.4, distinct from linear 1.5).
function sittingWithVerbal(): NormeringSitting {
  const table = Array.from({ length: 81 }, (_, raw) =>
    raw >= 60 ? 1.4 : Math.min(2, Math.round((raw / 40) * 100) / 100),
  )
  table[80] = 2.0
  return {
    exam_id: 'var-2018-1',
    source_url: 'https://studera.nu/x',
    verbal: { source_pdf: 'https://studera.nu/x.pdf', bands: [], table },
  }
}

let mockCluster: {
  framework_id: string
  section: string
  count: number
  headline: string | null
} | null = null
vi.mock('@/lib/trapCluster', () => ({
  useTrapCluster: () => mockCluster,
}))

function row(overrides: Partial<MockResultRow> = {}): MockResultRow {
  return {
    id: 1,
    userId: 1,
    sessionId: 100,
    mode: 'authentic',
    half: 'verbal',
    examId: 'var-2018-1',
    provpass: 'verb1',
    presented: 40,
    answered: 40,
    correct: 30,
    seenBefore: 6,
    durationMs: 50 * 60_000,
    breakdown: {
      perSection: {
        ORD: { presented: 10, correct: 8, timeMs: 6 * 60_000 },
        LÄS: { presented: 10, correct: 7, timeMs: 15 * 60_000 }, // budget 13:45 → over
        MEK: { presented: 10, correct: 9, timeMs: 6 * 60_000 },
        ELF: { presented: 10, correct: 6, timeMs: 13 * 60_000 },
      },
      missedQids: ['q1', 'q2'],
      version: 1,
    },
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('MockResult', () => {
  beforeEach(() => {
    mockHistoryRows = []
    mockCluster = null
    mockSitting = null
  })

  it('renders the headline and raw X/40 score', () => {
    render(<MockResult result={row()} />)
    expect(screen.getByTestId('mock-result-headline')).toHaveTextContent('Provpasset klart.')
    expect(screen.getByTestId('mock-result-raw')).toHaveTextContent('30 av 40')
  })

  it('shows the linear indikativ disclaimer for a synthetic pass', () => {
    render(<MockResult result={row({ mode: 'synthetic', correct: 30, presented: 40 })} />)
    // linear 30/40 * 2 = 1.5 → '1,50'
    expect(screen.getByTestId('mock-result-score')).toHaveTextContent('1,50')
    expect(screen.getByTestId('mock-result-disclaimer')).toHaveTextContent(
      'Linjär skattning — indikativ, inte UHR-normerad.',
    )
    expect(screen.getByTestId('mock-result-score').nextSibling).toHaveTextContent('skattad poäng')
  })

  it('shows the linear fallback for an authentic pass with no sourced table', () => {
    mockSitting = null
    render(<MockResult result={row({ correct: 30, presented: 40 })} />)
    expect(screen.getByTestId('mock-result-score')).toHaveTextContent('1,50')
    expect(screen.getByTestId('mock-result-disclaimer')).toHaveTextContent(
      'Linjär skattning — indikativ',
    )
  })

  it('derives the normed score from the UHR table for an authentic sourced pass', async () => {
    mockSitting = sittingWithVerbal()
    render(<MockResult result={row({ correct: 30, presented: 40 })} />)
    // 30/40 scales to raw 60 -> table[60] = 1.4 (not linear 1.5).
    await waitFor(() => expect(screen.getByTestId('mock-result-score')).toHaveTextContent('1,40'))
    expect(screen.getByTestId('mock-result-disclaimer')).toHaveTextContent('UHR:s normeringstabell')
    expect(screen.getByTestId('mock-result-score').nextSibling).toHaveTextContent(
      'normerat (härlett)',
    )
  })

  it('shows the X/39 disclosure line only when presented < 40', () => {
    render(
      <MockResult
        result={row({
          presented: 39,
          correct: 29,
          breakdown: {
            perSection: {
              ORD: { presented: 10, correct: 8, timeMs: 6 * 60_000 },
              LÄS: { presented: 9, correct: 7, timeMs: 12 * 60_000 },
              MEK: { presented: 10, correct: 8, timeMs: 6 * 60_000 },
              ELF: { presented: 10, correct: 6, timeMs: 13 * 60_000 },
            },
            missedQids: [],
            version: 1,
          },
        })}
      />,
    )
    expect(screen.getByTestId('mock-result-incomplete-note')).toHaveTextContent(
      '1 fråga saknas ur detta pass — rättat av 39.',
    )
  })

  it('hides the incomplete note when presented is 40', () => {
    render(<MockResult result={row()} />)
    expect(screen.queryByTestId('mock-result-incomplete-note')).not.toBeInTheDocument()
  })

  it('renders one section bar per breakdown.perSection entry with correct/presented', () => {
    render(<MockResult result={row()} />)
    expect(screen.getByTestId('mock-result-section-ORD')).toHaveTextContent('8/10')
    expect(screen.getByTestId('mock-result-section-LÄS')).toHaveTextContent('7/10')
    expect(screen.getByTestId('mock-result-section-MEK')).toHaveTextContent('9/10')
    expect(screen.getByTestId('mock-result-section-ELF')).toHaveTextContent('6/10')
  })

  it('renders the pacing table and flags the section over its proportional budget', () => {
    render(<MockResult result={row()} />)
    // ORD budget: 55min * 10/40 = 13:45, actual 6:00 → under, no flag.
    expect(screen.queryByTestId('mock-result-pace-over-ORD')).not.toBeInTheDocument()
    // LÄS budget: 13:45, actual 15:00 → over, flagged.
    expect(screen.getByTestId('mock-result-pace-over-LÄS')).toBeInTheDocument()
    expect(screen.getByTestId('mock-result-pace-LÄS')).toHaveTextContent('15:00')
    expect(screen.getByTestId('mock-result-pace-LÄS')).toHaveTextContent('13:45')
  })

  it('renders the trap cluster callout when useTrapCluster returns one', () => {
    mockCluster = {
      framework_id: 'ORD-01',
      section: 'ORD',
      count: 2,
      headline: 'Falska vänner luras av ytlig likhet.',
    }
    render(<MockResult result={row()} />)
    expect(screen.getByTestId('mock-result-cluster')).toHaveTextContent(
      '2 av dina missar tappade samma mönster.',
    )
    expect(screen.getByTestId('mock-result-cluster')).toHaveTextContent(
      'Falska vänner luras av ytlig likhet.',
    )
  })

  it('omits the trap cluster section when there is no cluster', () => {
    mockCluster = null
    render(<MockResult result={row()} />)
    expect(screen.queryByTestId('mock-result-cluster')).not.toBeInTheDocument()
  })

  it('renders the exposure line from the snapshot fields', () => {
    render(<MockResult result={row({ seenBefore: 6, presented: 40 })} />)
    expect(screen.getByTestId('mock-result-exposure')).toHaveTextContent(
      'Du hade sett 6/40 frågor innan.',
    )
  })

  it('notes unanswered questions in the exposure line when answered < presented', () => {
    render(<MockResult result={row({ answered: 37, presented: 40 })} />)
    expect(screen.getByTestId('mock-result-exposure')).toHaveTextContent('3 lämnades obesvarade.')
  })

  it('renders own-mock history filtered to same half+mode, newest first, excluding self', () => {
    mockHistoryRows = [
      row({ id: 1, createdAt: 3000 }), // self — excluded
      row({ id: 2, createdAt: 1000, correct: 20 }),
      row({ id: 3, createdAt: 2000, correct: 25 }),
      row({ id: 4, half: 'kvant', createdAt: 5000 }), // different half — excluded
      row({ id: 5, mode: 'synthetic', createdAt: 6000 }), // different mode — excluded
    ]
    render(<MockResult result={row({ id: 1, createdAt: 3000 })} />)
    const history = screen.getByTestId('mock-result-history')
    const items = history.querySelectorAll('li')
    expect(items).toHaveLength(2)
    // Newest (id 3, createdAt 2000) first.
    expect(items[0]).toHaveAttribute('data-testid', 'mock-result-history-3')
    expect(items[1]).toHaveAttribute('data-testid', 'mock-result-history-2')
  })

  it('shows the empty-history state when there are no prior passes of the same half+mode', () => {
    mockHistoryRows = []
    render(<MockResult result={row()} />)
    expect(screen.getByTestId('mock-result-history-empty')).toBeInTheDocument()
  })
})

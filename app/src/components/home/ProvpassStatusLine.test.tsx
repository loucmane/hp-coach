import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockResultRow } from '@/api/hooks/useMockResults'
import { __resetMockEvents, loadMockEvents } from '@/lib/mockEvents'
import type { MockPrescription } from '@/lib/scheduler'

const navigateMock = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}))

import { ProvpassStatusLine } from './ProvpassStatusLine'

function prescription(overrides: Partial<MockPrescription> = {}): MockPrescription {
  return {
    due: false,
    half: 'verbal',
    daysSinceLast: 5,
    daysUntilNext: 2,
    interval: 7,
    ...overrides,
  }
}

function resultRow(overrides: Partial<MockResultRow> = {}): MockResultRow {
  return {
    id: 1,
    userId: 1,
    sessionId: 1,
    mode: 'authentic',
    half: 'verbal',
    examId: 'var-2026',
    provpass: '1',
    presented: 40,
    answered: 40,
    correct: 31,
    seenBefore: 0,
    durationMs: 3_000_000,
    breakdown: { perSection: {}, missedQids: [], version: 1 },
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('ProvpassStatusLine', () => {
  beforeEach(() => {
    __resetMockEvents()
    navigateMock.mockClear()
  })

  it('countdown state: renders senast <half> <correct>/<presented> · nästa om N dagar', () => {
    render(
      <ProvpassStatusLine
        prescription={prescription({ due: false, daysUntilNext: 2 })}
        lastResult={resultRow({ half: 'verbal', correct: 31, presented: 40 })}
        showingKallelse={false}
      />,
    )
    const row = screen.getByTestId('provpass-status-line')
    expect(row).toHaveTextContent('PROVPASS')
    expect(row).toHaveTextContent('senast Verbal 31/40')
    expect(row).toHaveTextContent('nästa om 2 dagar')
  })

  it('due-today + Kallelse showing: suppresses the line entirely', () => {
    render(
      <ProvpassStatusLine
        prescription={prescription({ due: true })}
        lastResult={resultRow()}
        showingKallelse
      />,
    )
    expect(screen.queryByTestId('provpass-status-line')).not.toBeInTheDocument()
  })

  it('slid/ready state (due, not in plan): renders "redo när du är" with no day-count or guilt copy', () => {
    render(
      <ProvpassStatusLine
        prescription={prescription({ due: true })}
        lastResult={resultRow()}
        showingKallelse={false}
      />,
    )
    const row = screen.getByTestId('provpass-status-line')
    expect(row).toHaveTextContent('PROVPASS · redo när du är')
    const text = row.textContent ?? ''
    expect(text).not.toMatch(/\d+\s*dag/i)
    expect(text.toLowerCase()).not.toMatch(/sedan|försenad|dröjt|väntat/)
  })

  it('no-result-ever state: renders "inga pass ännu"', () => {
    render(
      <ProvpassStatusLine
        prescription={prescription({ due: false })}
        lastResult={null}
        showingKallelse={false}
      />,
    )
    expect(screen.getByTestId('provpass-status-line')).toHaveTextContent(
      'PROVPASS · inga pass ännu',
    )
  })

  it('renders a chevron affordance and navigates to /prov on click', () => {
    render(
      <ProvpassStatusLine
        prescription={prescription({ due: false })}
        lastResult={resultRow()}
        showingKallelse={false}
      />,
    )
    screen.getByTestId('provpass-status-line').click()
    expect(navigateMock).toHaveBeenCalledWith({ to: '/prov' })
  })

  it('logs started_via_line on click', () => {
    render(
      <ProvpassStatusLine
        prescription={prescription({ due: false })}
        lastResult={resultRow()}
        showingKallelse={false}
      />,
    )
    screen.getByTestId('provpass-status-line').click()
    const events = loadMockEvents().filter((e) => e.type === 'started_via_line')
    expect(events).toHaveLength(1)
  })
})

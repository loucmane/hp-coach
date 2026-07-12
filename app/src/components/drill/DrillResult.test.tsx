// DrillResult — the ratified C+A "Klart." composition (klart-bakeoff,
// 2026-07-04): Klart. display + stats row, the FACIT spread (every
// question marked ✓/✗), and the IMORGON payoff. Facit rows expand IN
// PLACE into the full graded review (question + pedagogy) — no new
// session, no navigation.

import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Question } from '@/data/questions'
import { formatViolations, runAxe } from '@/test/a11y'
import { DrillResult } from './DrillResult'

vi.mock('@/data/explanations', () => ({
  loadExplanation: async () => null,
}))
// Mutable so a test can supply per-section stats and exercise the
// "detta pass" delta-vs-average band.
let mockStats: unknown
vi.mock('@/api/hooks/useStats', () => ({
  useStats: () => ({ data: mockStats }),
}))
vi.mock('@/lib/trapCluster', () => ({
  useTrapCluster: () => null,
}))
// The Imorgon coda reads the whole active repetition queue. Mutable so a
// test can assert the synced total shows in the copy.
let mockActiveCount = 0
vi.mock('@/api/hooks/useMistakes', () => ({
  useActiveMistakes: () => ({
    data: Array.from({ length: mockActiveCount }, (_, i) => ({ id: i })),
  }),
}))

function sectionStats(attempts90d: number, correct90d: number) {
  return {
    attempts7d: 0,
    correct7d: 0,
    attempts7to14d: 0,
    correct7to14d: 0,
    attempts90d,
    correct90d,
    avgTimeMs: null,
    lastAttemptedAt: Date.now(),
  }
}

function q(n: number, prompt: string, answer: 'A' | 'B'): Question {
  return {
    qid: `var-2019-verb1-ORD-00${n}`,
    exam_id: 'var-2019',
    provpass: 'verb1',
    section: 'ORD',
    number: n,
    prompt,
    options: [
      { letter: 'A', text: 'alternativ a' },
      { letter: 'B', text: 'alternativ b' },
    ],
    answer,
    context: null,
    parsing_status: 'complete',
  }
}

const SUMMARY = {
  questions: [q(1, 'begrunda', 'A'), q(2, 'exil', 'B'), q(3, 'yrsel', 'A')],
  picks: ['A', 'A', 'A'] as ('A' | 'B')[],
}

describe('DrillResult (facit rebuild)', () => {
  beforeEach(() => {
    mockStats = undefined
    mockActiveCount = 0
  })

  it('renders Klart., the stats row, and one facit row per question', () => {
    render(<DrillResult summary={SUMMARY} onReplay={() => {}} onHome={() => {}} />)
    expect(screen.getByTestId('drill-result-headline')).toHaveTextContent('Klart.')
    expect(screen.getByTestId('drill-result-detaljer')).toHaveTextContent('2 av 3')
    // this pass's own score on the 0–2 scale (2/3 correct → 1,33)
    expect(screen.getByTestId('drill-result-pass')).toHaveTextContent('1,33')
    expect(screen.getByTestId('drill-result-pass')).toHaveTextContent('detta pass')
    expect(screen.getAllByTestId(/^facit-row-/)).toHaveLength(3)
    // the miss carries your-vs-correct in the mono cell
    expect(screen.getByTestId('facit-row-2')).toHaveTextContent(/ditt a\)/)
    expect(screen.getByTestId('facit-row-2')).toHaveTextContent(/rätt b\)/)
  })

  it('expands a facit row into the graded review in place', () => {
    render(<DrillResult summary={SUMMARY} onReplay={() => {}} onHome={() => {}} />)
    expect(screen.queryByTestId('drill-prompt')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('facit-row-2'))
    // the full graded question renders inline (prompt + options)
    expect(screen.getByTestId('drill-prompt')).toHaveTextContent('exil')
    expect(screen.getByTestId('option-A')).toHaveAttribute('data-state', 'incorrect')
    // collapse again
    fireEvent.click(screen.getByTestId('facit-row-2'))
    expect(screen.queryByTestId('drill-prompt')).not.toBeInTheDocument()
  })

  it('the imorgon coda names the synced repetition-queue total (not the session count)', () => {
    // The whole active queue is 5 (this pass's misses already logged in).
    mockActiveCount = 5
    render(<DrillResult summary={SUMMARY} onReplay={() => {}} onHome={() => {}} />)
    const tomorrow = screen.getByTestId('drill-result-tomorrow')
    expect(tomorrow).toHaveTextContent(/I repetitionskön: 5 frågor/)
    expect(tomorrow).toHaveTextContent(/dina nya missar ligger först/)
  })

  it("shows the pass score's delta vs the section average when stats exist", () => {
    // ORD 90d: 70/100 → score 1,40. This pass scored 1,33 (2/3) → the
    // band reads −0,07 mot snittet.
    mockStats = { bySection: { ORD: sectionStats(100, 70) } }
    render(<DrillResult summary={SUMMARY} onReplay={() => {}} onHome={() => {}} />)
    const pass = screen.getByTestId('drill-result-pass')
    expect(pass).toHaveTextContent('1,33')
    expect(pass).toHaveTextContent('−0,07 mot snittet')
    // the section prognosis stat is also present
    expect(screen.getByTestId('drill-result-detaljer')).toHaveTextContent('ORD-prognos')
  })

  it('renders a NEGATIVE pass delta in red (var(--bad)), not green', () => {
    // Below-average pass (1,33 vs 1,40 prognosis) → delta −0,07 → red.
    mockStats = { bySection: { ORD: sectionStats(100, 70) } }
    render(<DrillResult summary={SUMMARY} onReplay={() => {}} onHome={() => {}} />)
    const delta = screen.getByTestId('drill-result-delta')
    expect(delta).toHaveTextContent('−0,07 mot snittet')
    expect(delta).toHaveStyle({ color: 'var(--bad)' })
  })

  it('renders a POSITIVE pass delta in green (var(--ok))', () => {
    // Weak average (50/100 → 1,00) so this 1,33 pass beats it: +0,33 → green.
    mockStats = { bySection: { ORD: sectionStats(100, 50) } }
    render(<DrillResult summary={SUMMARY} onReplay={() => {}} onHome={() => {}} />)
    const delta = screen.getByTestId('drill-result-delta')
    expect(delta).toHaveTextContent('+0,33 mot snittet')
    expect(delta).toHaveStyle({ color: 'var(--ok)' })
  })

  // WCAG 2.2 AA regression net (2026-07 a11y pass) — see the matching
  // comment in DrillQuestion.test.tsx for what this does and doesn't
  // cover (color-contrast is disabled; that's the live Playwright audit's
  // job).
  it('has no axe violations on the session-end summary', async () => {
    render(<DrillResult summary={SUMMARY} onReplay={() => {}} onHome={() => {}} />)
    const violations = await runAxe()
    expect(violations, formatViolations(violations)).toEqual([])
  })

  it('has no axe violations with a facit row expanded', async () => {
    render(<DrillResult summary={SUMMARY} onReplay={() => {}} onHome={() => {}} />)
    fireEvent.click(screen.getByTestId('facit-row-2'))
    const violations = await runAxe()
    expect(violations, formatViolations(violations)).toEqual([])
  })
})

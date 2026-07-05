// DrillResult — the ratified C+A "Klart." composition (klart-bakeoff,
// 2026-07-04): Klart. display + stats row, the FACIT spread (every
// question marked ✓/✗), and the IMORGON payoff. Facit rows expand IN
// PLACE into the full graded review (question + pedagogy) — no new
// session, no navigation.

import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Question } from '@/data/questions'
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

  it('the imorgon coda names the repetition load', () => {
    render(<DrillResult summary={SUMMARY} onReplay={() => {}} onHome={() => {}} />)
    expect(screen.getByTestId('drill-result-tomorrow')).toHaveTextContent(/1 fråga/)
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
})

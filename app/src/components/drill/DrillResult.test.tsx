// DrillResult — the ratified C+A "Klart." composition (klart-bakeoff,
// 2026-07-04): Klart. display + stats row, the FACIT spread (every
// question marked ✓/✗), and the IMORGON payoff. Facit rows expand IN
// PLACE into the full graded review (question + pedagogy) — no new
// session, no navigation.

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Question } from '@/data/questions'
import { DrillResult } from './DrillResult'

vi.mock('@/data/explanations', () => ({
  loadExplanation: async () => null,
}))
vi.mock('@/api/hooks/useStats', () => ({
  useStats: () => ({ data: undefined }),
}))
vi.mock('@/lib/trapCluster', () => ({
  useTrapCluster: () => null,
}))

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
  it('renders Klart., the stats row, and one facit row per question', () => {
    render(<DrillResult summary={SUMMARY} onReplay={() => {}} onHome={() => {}} />)
    expect(screen.getByTestId('drill-result-headline')).toHaveTextContent('Klart.')
    expect(screen.getByTestId('drill-result-detaljer')).toHaveTextContent('2 av 3')
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
})

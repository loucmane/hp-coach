// M1 pre-answer apparatus — the M3 eyebrow, tactic aside, and keys hint.
//
// The eyebrow (LONG_LABEL · FRÅGA n AV total) only renders when the caller
// threads position/total from the session plan; legacy mounts without a
// session must not render a broken "FRÅGA undefined AV undefined" line.

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Question } from '@/data/questions'
import { DrillQuestion } from './DrillQuestion'

// Explanation fetch is out of scope (test fetch shim only serves /data/).
vi.mock('@/data/explanations', () => ({
  loadExplanation: async () => null,
}))

const ORD_QUESTION: Question = {
  qid: 'var-2019-verb1-ORD-003',
  exam_id: 'var-2019',
  provpass: 'verb1',
  section: 'ORD',
  number: 3,
  prompt: 'begrunda',
  options: [
    { letter: 'A', text: 'fundera över' },
    { letter: 'B', text: 'motivera' },
    { letter: 'C', text: 'anklaga' },
    { letter: 'D', text: 'skryta' },
    { letter: 'E', text: 'undvika' },
  ],
  answer: 'A',
  context: null,
  parsing_status: 'complete',
}

describe('DrillQuestion pre-answer apparatus', () => {
  it('renders the eyebrow when position/total are threaded in', () => {
    render(
      <DrillQuestion
        question={ORD_QUESTION}
        picked={null}
        graded={false}
        onPick={() => {}}
        position={3}
        total={10}
      />,
    )
    expect(screen.getByTestId('drill-eyebrow')).toHaveTextContent('ORDFÖRSTÅELSE · FRÅGA 3 AV 10')
  })

  it('omits the eyebrow when position/total are missing', () => {
    render(<DrillQuestion question={ORD_QUESTION} picked={null} graded={false} onPick={() => {}} />)
    expect(screen.queryByTestId('drill-eyebrow')).not.toBeInTheDocument()
  })

  it('keeps drill-prompt textContent to just the headword (eyebrow is a sibling)', () => {
    render(
      <DrillQuestion
        question={ORD_QUESTION}
        picked={null}
        graded={false}
        onPick={() => {}}
        position={3}
        total={10}
      />,
    )
    expect(screen.getByTestId('drill-prompt')).toHaveTextContent(/^begrunda$/)
  })

  it('shows the tactic aside pre-grade and hides it once graded', async () => {
    const { rerender } = render(
      <DrillQuestion question={ORD_QUESTION} picked={null} graded={false} onPick={() => {}} />,
    )
    // Corpus explanation is mocked away → hash-rotation fallback tactic.
    expect(await screen.findByText(/^Taktik · /)).toBeInTheDocument()
    rerender(<DrillQuestion question={ORD_QUESTION} picked={'B'} graded={true} onPick={() => {}} />)
    expect(screen.queryByText(/^Taktik · /)).not.toBeInTheDocument()
  })

  it("labels the ORD options rail 'Välj synonym' (M4; other sections keep 'Välj svar')", () => {
    render(<DrillQuestion question={ORD_QUESTION} picked={null} graded={false} onPick={() => {}} />)
    expect(screen.getByText('Välj synonym')).toBeInTheDocument()
    expect(screen.queryByText('Välj svar')).not.toBeInTheDocument()
  })

  it('shows the dynamic keys hint pre-grade and hides it once graded', () => {
    const { rerender } = render(
      <DrillQuestion question={ORD_QUESTION} picked={null} graded={false} onPick={() => {}} />,
    )
    expect(screen.getByText('Tangenter a–e väljer · klick fungerar också')).toBeInTheDocument()
    rerender(<DrillQuestion question={ORD_QUESTION} picked={'B'} graded={true} onPick={() => {}} />)
    expect(
      screen.queryByText('Tangenter a–e väljer · klick fungerar också'),
    ).not.toBeInTheDocument()
  })
})

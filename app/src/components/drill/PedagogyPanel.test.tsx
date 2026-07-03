// M2 — the graded pedagogy rewritten to M3 (plan hashed-twirling-zephyr):
// verdict + verdict-sub (replacing the coach voice), numbered steps with
// kärna/detalj tier badges, distractor rows that re-print the struck
// option text (the single-column flip depends on this — post-grade the
// options scroll away), and NO pre-grade rendering at all.

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Explanation } from '@/data/explanations'
import type { Option } from '@/data/questions'
import { PedagogyPanel } from './PedagogyPanel'

const EXPLANATION: Explanation = {
  solution_path: 'Ordet betyder att fundera över något.',
  steps: [
    { n: 1, title: 'Hitta stammen', text: 'Ordet bär "grund-".', tier: 'essential' },
    { n: 2, title: 'Testa i mening', text: 'Sätt in kandidaten.', tier: 'detail' },
  ],
  distractors: [
    { letter: 'B', why_tempting: 'Låter formellt.', why_wrong: 'Betyder något annat.' },
  ],
  technique: 'Stamordskartan',
  pitfall: null,
}

let mockExplanation: Explanation | null = EXPLANATION
vi.mock('@/data/explanations', () => ({
  loadExplanation: async () => mockExplanation,
}))

const OPTIONS: Option[] = [
  { letter: 'A', text: 'fundera över' },
  { letter: 'B', text: 'motivera' },
]

function renderPanel(over: Partial<Parameters<typeof PedagogyPanel>[0]> = {}) {
  return render(
    <PedagogyPanel
      qid="var-2019-verb1-ORD-003"
      graded
      correct={false}
      answer="A"
      options={OPTIONS}
      {...over}
    />,
  )
}

describe('PedagogyPanel (M2 graded rewrite)', () => {
  it('renders nothing pre-grade — M3 has no waiting pedagogy', () => {
    mockExplanation = EXPLANATION
    const { container } = renderPanel({ graded: false })
    expect(container).toBeEmptyDOMElement()
  })

  it('wrong answer → verdict-sub states the correct answer (M3 template)', async () => {
    mockExplanation = EXPLANATION
    renderPanel()
    expect(await screen.findByText(/Rätt svar är a\)/)).toBeInTheDocument()
    expect(screen.getByText(/Häng med i varför/)).toBeInTheDocument()
    // The old coach-voice line is gone.
    expect(screen.queryByText(/Fel den här gången/)).not.toBeInTheDocument()
  })

  it('correct answer → the M3 praise line', async () => {
    mockExplanation = EXPLANATION
    renderPanel({ correct: true })
    expect(await screen.findByText('Snyggt — rätt tänkt hela vägen.')).toBeInTheDocument()
  })

  it('steps render with serif ordinal and kärna/detalj tier badges', async () => {
    mockExplanation = EXPLANATION
    renderPanel()
    const step1 = await screen.findByTestId('pedagogy-step-1')
    expect(step1).toHaveTextContent('1.')
    expect(step1).toHaveTextContent('Hitta stammen')
    expect(step1).toHaveTextContent('kärna')
    expect(screen.getByTestId('pedagogy-step-2')).toHaveTextContent('detalj')
  })

  it('distractor rows re-print the struck option text with both M3 labels', async () => {
    mockExplanation = EXPLANATION
    renderPanel()
    const dis = await screen.findByTestId('pedagogy-distractor-B')
    expect(dis).toHaveTextContent('motivera')
    expect(dis.querySelector('s')).toHaveTextContent('motivera')
    expect(dis).toHaveTextContent('Varför det lockar')
    expect(dis).toHaveTextContent('Varför det är fel')
    expect(dis).toHaveTextContent('Låter formellt.')
    expect(dis).toHaveTextContent('Betyder något annat.')
  })

  it('missing explanation → M3 missing line + the flag CTA survives', async () => {
    mockExplanation = null
    renderPanel()
    expect(
      await screen.findByText('Förklaring saknas ännu för den här frågan.'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('pedagogy-flag-missing')).toBeInTheDocument()
  })
})

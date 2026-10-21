import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TrapEntry } from '@/data/frameworks'
import { WORKED_EXAMPLES } from '@/data/workedExamples.generated'
import { ExampleQuestions } from './ExampleQuestions'
import { LexiconCard } from './LexiconCard'
import { ProtocolCard } from './ProtocolCard'
import { TrapCard } from './TrapCard'

const h = vi.hoisted(() => ({
  userId: 'alice' as string | null,
  bank: vi.fn(),
  explanation: vi.fn(),
}))
vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ isLoaded: true, user: h.userId ? { id: h.userId } : null }),
}))
vi.mock('@/data/questions', () => ({ loadBank: h.bank }))
vi.mock('@/data/explanations', () => ({ loadExplanation: h.explanation }))
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    search,
    children,
  }: {
    to: string
    search: Record<string, string>
    children: ReactNode
  }) => <a href={`${to}?${new URLSearchParams(search)}`}>{children}</a>,
}))

const example = WORKED_EXAMPLES.find((x) => x.section === 'NOG') as (typeof WORKED_EXAMPLES)[number]
const entry: TrapEntry = {
  id: example.entryId,
  pattern_description: 'Pattern',
  why_it_occurs: 'Reason',
  countermeasure: 'Strategy',
  common_distractor_signature: 'Signature',
  example_questions: [example.qid, 'ordinary'],
  worked_example: {
    setup: 'Authored setup',
    trap_thinking: 'Trap thought',
    correct_thinking: 'Correct thought',
    answer: 'Authored answer',
  },
}
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  h.userId = 'alice'
  h.bank.mockResolvedValue([
    {
      qid: example.qid,
      section: 'NOG',
      prompt: 'Real example',
      answer: 'A',
      options: [{ letter: 'A', text: 'Choice' }],
    },
    { qid: 'ordinary', prompt: 'Ordinary example' },
  ])
  h.explanation.mockResolvedValue({
    framework_id: example.entryId,
    steps: [1, 2, 3].map((n) => ({ n, text: `Step ${n}`, tier: 'essential' })),
  })
})

describe('lesson worked example wiring', () => {
  it('omits the authored narrative before opening and after loading a signed-in example', async () => {
    render(<TrapCard entry={entry} section="NOG" />)
    fireEvent.click(screen.getByText('Pattern'))
    expect(screen.queryByText('Authored setup')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Ett exempel, steg för steg'))
    await screen.findByText('Real example')
    expect(screen.queryByText('Authored setup')).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Öva detta mönster/ })).toHaveLength(2)
  })

  it.each([
    'rejection',
    'missing',
    'mismatch',
  ])('keeps the authored fallback after %s', async (kind) => {
    if (kind === 'rejection') h.explanation.mockRejectedValue(new Error('offline'))
    if (kind === 'missing') h.explanation.mockResolvedValue(null)
    if (kind === 'mismatch') h.explanation.mockResolvedValue({ framework_id: 'other', steps: [] })
    render(<TrapCard entry={entry} section="NOG" />)
    fireEvent.click(screen.getByText('Pattern'))
    fireEvent.click(screen.getByText('Ett exempel, steg för steg'))
    await screen.findByText('Exemplet kunde inte hämtas.')
    expect(screen.getByText('Authored setup')).toBeInTheDocument()
    const summary = screen.getByText('Ett exempel, steg för steg').closest('summary')!
    expect(summary.parentElement).toContainElement(screen.getByText('Authored setup'))
    expect(screen.getByRole('button', { name: 'Försök igen' })).toBeInTheDocument()
  })

  it('leaves the authored trap narrative for signed-out readers', async () => {
    h.userId = null
    render(<TrapCard entry={entry} section="NOG" />)
    await screen.findByText('Ordinary example')
    expect(screen.getByText('Authored setup')).toBeInTheDocument()
    expect(screen.queryByText('Ett exempel, steg för steg')).not.toBeInTheDocument()
    expect(h.explanation).not.toHaveBeenCalled()
  })

  it('omits worked question links, retaining ordinary ones', async () => {
    render(<ExampleQuestions qids={[example.qid, 'ordinary']} />)
    const link = await screen.findByRole('link', { name: /Ordinary example/ })
    expect(link).toHaveAttribute('href', '/drill?qid=ordinary')
    expect(screen.queryByRole('link', { name: new RegExp(example.qid) })).not.toBeInTheDocument()
  })

  it('renders no empty question list for an all-worked entry', () => {
    const { container } = render(<ExampleQuestions qids={[example.qid]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('offers the reader and practice on MEK protocol cards', () => {
    const mek = WORKED_EXAMPLES.find((x) => x.section === 'MEK') as (typeof WORKED_EXAMPLES)[number]
    render(
      <ProtocolCard
        section="MEK"
        entry={{
          id: mek.entryId,
          constraint_type: 'Constraint',
          rule: 'Rule',
          example_questions: [mek.qid],
        }}
      />,
    )
    expect(screen.getByText('Ett exempel, steg för steg')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Öva denna regel/ })).toHaveLength(2)
  })

  it('adds no worked example to ORD lexicon cards in this slice', async () => {
    render(
      <LexiconCard
        entry={{
          id: 'ORD-ROOT-001',
          root: 'Root',
          origin: 'Origin',
          meaning: 'Meaning',
          example_words: [],
          example_questions: ['ordinary'],
        }}
      />,
    )
    await screen.findByText('Ordinary example')
    expect(screen.queryByText('Ett exempel, steg för steg')).not.toBeInTheDocument()
  })
})

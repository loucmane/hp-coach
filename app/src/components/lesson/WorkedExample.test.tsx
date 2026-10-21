import { act, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Explanation } from '@/data/explanations'
import type { Question } from '@/data/questions'
import { WORKED_EXAMPLES } from '@/data/workedExamples.generated'
import { completeWorkedExample, readWorkedExampleLevel } from '@/lib/workedExampleFade'
import { WorkedExample } from './WorkedExample'

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

const example = WORKED_EXAMPLES[0]
const question: Question = {
  qid: example.qid,
  section: example.section,
  exam_id: 'exam',
  provpass: 'kvant1',
  number: 1,
  prompt: 'Synthetic question',
  options: [{ letter: 'A', text: 'First option' }],
  answer: 'A',
  context: null,
  parsing_status: 'complete',
}
function explanation(count = 4): Explanation {
  return {
    framework_id: example.entryId,
    solution_path: '',
    technique: '',
    pitfall: null,
    distractors: [],
    steps: [
      ...Array.from({ length: count }, (_, i) => ({
        n: i + 1,
        text: `Step body ${i + 1}`,
        tier: 'essential' as const,
      })),
      { n: count + 1, title: 'Fördjupning', text: 'Detail body', tier: 'detail' },
    ],
  }
}
beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  h.userId = 'alice'
  h.bank.mockResolvedValue([question])
  h.explanation.mockResolvedValue(explanation())
})
async function open() {
  fireEvent.click(screen.getByText('Ett exempel, steg för steg'))
  await screen.findByText('Synthetic question')
}
function reveal(label = 'Nästa steg') {
  fireEvent.click(screen.getByRole('button', { name: label }))
}

describe('worked example reader', () => {
  it('loads only on open, reveals one step per tap and the answer only at the end', async () => {
    render(
      <StrictMode>
        <WorkedExample entryId={example.entryId} />
      </StrictMode>,
    )
    expect(h.bank).not.toHaveBeenCalled()
    expect(h.explanation).not.toHaveBeenCalled()
    await open()
    expect(screen.getByText('First option')).toBeInTheDocument()
    expect(screen.queryByText('Step body 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Svar: A')).not.toBeInTheDocument()
    for (let i = 1; i <= 4; i++) {
      reveal()
      expect(screen.getByText(`steg ${i} av 4`)).toBeInTheDocument()
      expect(screen.getByText(`Step body ${i}`)).toBeInTheDocument()
      if (i < 4) expect(screen.queryByText('Svar: A')).not.toBeInTheDocument()
    }
    expect(screen.getByText('Svar: A')).toBeInTheDocument()
    const detail = screen.getByText('Detail body').closest('details')
    expect(detail).not.toHaveAttribute('open')
    expect(readWorkedExampleLevel('alice', example.section)).toBe(1)
    fireEvent.click(screen.getByText('Ett exempel, steg för steg'))
    await open()
    expect(readWorkedExampleLevel('alice', example.section)).toBe(1)
  })

  it.each([1, 2])('fades the final steps at level %s', async (level) => {
    for (let i = 0; i < level; i++) completeWorkedExample('alice', example.section)
    render(<WorkedExample entryId={example.entryId} />)
    await open()
    for (let i = 0; i < 4 - level; i++) reveal()
    expect(screen.queryByRole('button', { name: 'Nästa steg' })).not.toBeInTheDocument()
    for (let i = 0; i < level; i++) reveal('Försök själv först')
    expect(screen.getByText('Svar: A')).toBeInTheDocument()
  })

  it('keeps two ordinary steps even at level two with three essential steps', async () => {
    completeWorkedExample('alice', example.section)
    completeWorkedExample('alice', example.section)
    h.explanation.mockResolvedValue(explanation(3))
    render(<WorkedExample entryId={example.entryId} />)
    await open()
    reveal()
    reveal()
    reveal('Försök själv först')
    expect(screen.getByText('Svar: A')).toBeInTheDocument()
  })

  it('adds nothing and fetches nothing when signed out', () => {
    h.userId = null
    const { container } = render(<WorkedExample entryId={example.entryId} />)
    expect(container).toBeEmptyDOMElement()
    expect(h.bank).not.toHaveBeenCalled()
  })

  it('removes loaded content and resets the reader across accounts', async () => {
    const { rerender } = render(<WorkedExample entryId={example.entryId} />)
    await open()
    reveal()
    h.userId = 'bob'
    rerender(<WorkedExample entryId={example.entryId} />)
    expect(screen.queryByText('Synthetic question')).not.toBeInTheDocument()
    await open()
    expect(screen.queryByText('Step body 1')).not.toBeInTheDocument()
    expect(readWorkedExampleLevel('bob', example.section)).toBe(0)
  })

  it('ignores an in-flight load after sign-out', async () => {
    let finish: (rows: Question[]) => void = () => {}
    h.bank.mockReturnValue(
      new Promise<Question[]>((resolve) => {
        finish = resolve
      }),
    )
    const { rerender, container } = render(<WorkedExample entryId={example.entryId} />)
    fireEvent.click(screen.getByText('Ett exempel, steg för steg'))
    await act(async () => {})
    h.userId = null
    rerender(<WorkedExample entryId={example.entryId} />)
    await act(async () => finish([question]))
    expect(container).toBeEmptyDOMElement()
  })
})

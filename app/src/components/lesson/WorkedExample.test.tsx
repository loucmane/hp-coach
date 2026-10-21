import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Explanation } from '@/data/explanations'
import type { Question } from '@/data/questions'
import { WORKED_EXAMPLES } from '@/data/workedExamples.generated'
import { completeWorkedExample, readWorkedExampleLevel } from '@/lib/workedExampleFade'
import { WorkedExample } from './WorkedExample'

const h = vi.hoisted(() => ({
  isLoaded: true,
  userId: 'alice' as string | null,
  bank: vi.fn(),
  explanation: vi.fn(),
}))
vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ isLoaded: h.isLoaded, user: h.userId ? { id: h.userId } : null }),
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
  vi.resetAllMocks()
  h.userId = 'alice'
  h.isLoaded = true
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
    for (let i = 0; i < level; i++) completeWorkedExample('alice', example.section, `prior-${i}`)
    render(<WorkedExample entryId={example.entryId} />)
    await open()
    for (let i = 0; i < 4 - level; i++) reveal()
    expect(screen.queryByRole('button', { name: 'Nästa steg' })).not.toBeInTheDocument()
    expect(screen.getByText('Försök själv först.')).toBeInTheDocument()
    for (let i = 0; i < level; i++) reveal('Visa steget')
    expect(screen.getByText('Svar: A')).toBeInTheDocument()
  })

  it('keeps two ordinary steps even at level two with three essential steps', async () => {
    completeWorkedExample('alice', example.section, 'prior-1')
    completeWorkedExample('alice', example.section, 'prior-2')
    h.explanation.mockResolvedValue(explanation(3))
    render(<WorkedExample entryId={example.entryId} />)
    await open()
    reveal()
    reveal()
    reveal('Visa steget')
    expect(screen.getByText('Svar: A')).toBeInTheDocument()
  })

  it('shows toggle cues and hairline pill buttons with a keyboard focus class', async () => {
    render(<WorkedExample entryId={example.entryId} />)
    const summary = screen.getByText('Ett exempel, steg för steg').closest('summary')
    expect(summary?.querySelector('.trap-card-toggle')).not.toBeNull()
    expect(summary).toHaveClass('hpc-btn')
    await open()
    const button = screen.getByRole('button', { name: 'Nästa steg' })
    expect(button).toHaveClass('hpc-btn')
    expect(button.style.border).toBe('1px solid var(--hairline)')
    expect(button.style.borderRadius).toBe('999px')
    for (let i = 0; i < 4; i++) reveal()
    const detailSummary = screen.getByText('Fördjupning').closest('summary')
    expect(detailSummary?.querySelector('.trap-card-toggle')).not.toBeNull()
    expect(detailSummary).toHaveClass('hpc-btn')
  })

  it('announces each newly revealed step in a live region', async () => {
    const { container } = render(<WorkedExample entryId={example.entryId} />)
    await open()
    const liveRegion = container.querySelector('[aria-live="polite"]')
    expect(liveRegion).toBeInTheDocument()
    for (let i = 1; i <= 4; i++) {
      reveal()
      expect(liveRegion).toContainElement(screen.getByText(`Step body ${i}`))
    }
    expect(liveRegion).toHaveAttribute('aria-relevant', 'additions')
  })

  it('renders KVA conditions and quantities in separate rows', async () => {
    const kva = WORKED_EXAMPLES.find((row) => row.section === 'KVA')!
    h.bank.mockResolvedValue([
      {
        ...question,
        qid: kva.qid,
        section: 'KVA',
        prompt: 'x > 0\tKvantitet I:\tx + 1\tKvantitet II:\tx',
      },
    ])
    h.explanation.mockResolvedValue({ ...explanation(), framework_id: kva.entryId })
    render(<WorkedExample entryId={kva.entryId} />)
    fireEvent.click(screen.getByText('Ett exempel, steg för steg'))
    expect(await screen.findByTestId('kva-condition')).toHaveTextContent('x > 0')
    expect(within(screen.getByTestId('kva-i')).getByText('x + 1')).toBeInTheDocument()
    expect(within(screen.getByTestId('kva-ii')).getByText('x')).toBeInTheDocument()
  })

  it('does not advance fading when the same example is reread after remount', async () => {
    const first = render(<WorkedExample entryId={example.entryId} />)
    await open()
    for (let i = 0; i < 4; i++) reveal()
    first.unmount()
    render(<WorkedExample entryId={example.entryId} />)
    await open()
    for (let i = 0; i < 3; i++) reveal()
    reveal('Visa steget')
    expect(readWorkedExampleLevel('alice', example.section)).toBe(1)
  })

  it('retries a failed load in place, showing fallback only below the summary on failure', async () => {
    h.bank.mockRejectedValueOnce(new Error('offline'))
    render(<WorkedExample entryId={example.entryId} fallback={<p>Authored fallback</p>} />)
    expect(screen.queryByText('Authored fallback')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Ett exempel, steg för steg'))
    await screen.findByText('Exemplet kunde inte hämtas.')
    const summary = screen.getByText('Ett exempel, steg för steg').closest('summary')!
    const fallback = screen.getByText('Authored fallback')
    expect(summary.parentElement).toContainElement(fallback)
    expect(
      summary.compareDocumentPosition(fallback) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    const retry = screen.getByRole('button', { name: 'Försök igen' })
    expect(retry).toHaveClass('hpc-btn')
    fireEvent.click(retry)
    await screen.findByText('Synthetic question')
    expect(h.bank).toHaveBeenCalledTimes(2)
    expect(screen.queryByText('Authored fallback')).not.toBeInTheDocument()
    expect(screen.queryByText('Exemplet kunde inte hämtas.')).not.toBeInTheDocument()
    expect(screen.getByText('steg 0 av 4')).toBeInTheDocument()
  })

  it('adds nothing and fetches nothing when signed out', () => {
    h.userId = null
    const { container } = render(<WorkedExample entryId={example.entryId} />)
    expect(container).toBeEmptyDOMElement()
    expect(h.bank).not.toHaveBeenCalled()
  })

  it('does not flash the authored fallback while authentication or the example is loading', async () => {
    h.isLoaded = false
    h.userId = null
    let finish: (rows: Question[]) => void = () => {}
    h.bank.mockReturnValue(
      new Promise<Question[]>((resolve) => {
        finish = resolve
      }),
    )
    const { rerender } = render(
      <WorkedExample entryId={example.entryId} fallback={<p>Authored fallback</p>} />,
    )
    expect(screen.queryByText('Authored fallback')).not.toBeInTheDocument()
    expect(h.bank).not.toHaveBeenCalled()
    h.isLoaded = true
    h.userId = 'alice'
    rerender(<WorkedExample entryId={example.entryId} fallback={<p>Authored fallback</p>} />)
    fireEvent.click(screen.getByText('Ett exempel, steg för steg'))
    await screen.findByText('Laddar exempel …')
    expect(screen.queryByText('Authored fallback')).not.toBeInTheDocument()
    await act(async () => finish([question]))
    expect(screen.getByText('Synthetic question')).toBeInTheDocument()
    expect(screen.queryByText('Authored fallback')).not.toBeInTheDocument()
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

import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mistake } from '@/api/hooks/useMistakes'
import type { ActiveSession } from '@/api/hooks/useSessions'
import type { Stats } from '@/api/hooks/useStats'
import type { Question } from '@/data/questions'
import FolioRepetera from './FolioRepetera'

const h = vi.hoisted(() => ({
  now: new Date(2026, 9, 22, 12),
  pile: [] as Mistake[] | undefined,
  bank: [] as Question[] | undefined,
  stats: undefined as Stats | undefined,
  pileError: false,
}))
vi.mock('./useRepeteraExtras', () => ({
  useRepeteraExtras: () => ({
    now: h.now,
    examDate: new Date(2027, 9, 24),
    pileMistakes: h.pile,
    bank: h.bank,
    stats: h.stats,
    pileError: h.pileError,
  }),
}))

function miss(id: number, section = 'ORD', next: Date | null = null): Mistake {
  return {
    id,
    userId: 1,
    questionId: `2026-test-${section}-${id}`,
    layer1Ids: ['trap-name-must-stay-hidden'],
    status: 'active',
    errorCount7d: 5,
    lastErrorAt: null,
    nextReviewAt: next?.getTime() ?? null,
  }
}
const navigate = vi.fn()
const due = [miss(1), miss(2, 'MEK')]
const later = miss(3, 'LÄS', new Date(2026, 9, 22, 14))
const future = miss(4, 'KVA', new Date(2026, 9, 23, 14))
const props = () => ({ dueMistakes: due, navigateHref: navigate })

beforeEach(() => {
  vi.clearAllMocks()
  h.pile = [...due, later]
  h.bank = [
    { qid: due[0].questionId, section: 'ORD', prompt: 'förnimma' },
    { qid: due[1].questionId, section: 'MEK', prompt: 'Det var _____ att se _____ igen.' },
    { qid: later.questionId, section: 'LÄS', prompt: 'Vad menar författaren?' },
    { qid: future.questionId, section: 'KVA', prompt: 'Kvantitet I: 2 Kvantitet II: 3' },
  ] as Question[]
  h.stats = undefined
  h.pileError = false
})

describe('Folio Repetera overview', () => {
  it('has one primary, preserves the start id, and Enter clicks that action', () => {
    const { container } = render(<FolioRepetera {...props()} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Dina missar' })).toBeInTheDocument()
    expect(container.querySelectorAll('.fa-btn')).toHaveLength(1)
    expect(screen.getByTestId('repetera-start')).toHaveAttribute('href', '/repetition?start=1')
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/repetition?start=1')
    expect(container.textContent).not.toMatch(
      /trap-name-must-stay-hidden|\bfel\b|\bklar\b|Avsluta/i,
    )
    expect(screen.getByText('lucka 1')).toBeInTheDocument()
    expect(screen.getByText('lucka 2')).toBeInTheDocument()
  })

  it('uses real section links, even when a section has no ready misses', () => {
    render(<FolioRepetera {...props()} />)
    const queue = screen.getByRole('region', { name: 'Kön per delprov' })
    const links = within(queue).getAllByRole('link')
    expect(links).toHaveLength(3)
    expect(links.every((link) => link.tagName === 'A')).toBe(true)
    expect(links[0]).toHaveAttribute('href', '/repetition?start=1&section=ORD')
    expect(links[1]).toHaveAttribute('href', '/repetition?section=L%C3%84S')
    fireEvent.click(links[0])
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/repetition?start=1&section=ORD')
    fireEvent.click(links[0], { ctrlKey: true })
    expect(navigate).toHaveBeenCalledTimes(1)
  })

  it('does not take Enter from a link, disclosure, editable field, dialog or modified event', () => {
    render(
      <>
        <FolioRepetera {...props()} />
        <input aria-label="Sök" />
        <div role="dialog">
          <p>Dialog</p>
        </div>
      </>,
    )
    const more = screen.getByRole('button', { name: /Visa.*redo senare/ })
    fireEvent.keyDown(more, { key: 'Enter' })
    fireEvent.keyDown(screen.getByTestId('repetera-start'), { key: 'Enter' })
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })
    fireEvent.keyDown(screen.getByText('Dialog'), { key: 'Enter' })
    for (const extra of [
      { ctrlKey: true },
      { shiftKey: true },
      { altKey: true },
      { metaKey: true },
      { repeat: true },
      { isComposing: true },
    ]) {
      fireEvent.keyDown(document.body, { key: 'Enter', ...extra })
    }
    expect(navigate).not.toHaveBeenCalled()
  })

  it('folds later-today misses only while a round is ready', () => {
    const result = render(<FolioRepetera {...props()} />)
    expect(screen.queryByText('Vad menar författaren?')).not.toBeVisible()
    const more = screen.getByRole('button', { name: /Visa.*redo senare/ })
    expect(more).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(more)
    expect(more).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Vad menar författaren?')).toBeVisible()
    fireEvent.click(more)
    h.pile = [later]
    result.rerender(<FolioRepetera {...props()} dueMistakes={[]} />)
    expect(screen.queryByRole('button', { name: /Visa.*redo senare/ })).not.toBeInTheDocument()
    expect(screen.getByText('Vad menar författaren?')).toBeVisible()
    expect(screen.getByText('senare idag')).toBeVisible()
  })

  it('separates tomorrow from later today and shows its actual due label', () => {
    h.pile = [future]
    render(<FolioRepetera {...props()} dueMistakes={[]} />)
    expect(screen.getByRole('heading', { name: 'Kommande dagar' })).toBeInTheDocument()
    expect(screen.getByText('imorgon')).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Senare idag' })).not.toBeInTheDocument()
    expect(screen.queryByText(/blir redo senare idag/)).not.toBeInTheDocument()
  })

  it('shows only the section until the question bank resolves', () => {
    h.bank = undefined
    render(<FolioRepetera {...props()} />)
    expect(screen.queryByText('förnimma')).not.toBeInTheDocument()
    const ready = screen.getByRole('list', { name: 'Redo nu' })
    expect(within(ready).getAllByRole('link')).toHaveLength(2)
    expect(within(ready).getByText('ORD')).toBeVisible()
  })

  it('uses an honest day-zero fallback and keeps its existing test id', () => {
    h.pile = []
    h.stats = {
      attempts: { total: 0 },
      mistakes: { resolved: 0, active: 0 },
      bySection: {},
    } as Stats
    const { container } = render(<FolioRepetera {...props()} dueMistakes={[]} />)
    const fallback = screen.getByTestId('repetition-fallback-link')
    expect(fallback).toHaveAttribute('href', '/drill?start=1')
    expect(fallback).toHaveTextContent('Börja en övning')
    expect(container.querySelectorAll('.fa-btn')).toHaveLength(1)
    expect(container.textContent).not.toMatch(/\bfel\b|\bklar\b|Avsluta/i)
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/drill?start=1')
  })

  it('waits for stats before describing an empty pile, then shows the day-zero line', () => {
    h.pile = []
    const result = render(<FolioRepetera {...props()} dueMistakes={[]} />)
    expect(result.container.textContent).not.toContain('nästa repetition följer din planering')
    expect(result.container.querySelector('.fa-empty')).not.toBeInTheDocument()
    expect(screen.getByTestId('repetition-fallback-link')).toHaveTextContent('Börja en övning')
    h.stats = {
      attempts: { total: 0 },
      mistakes: { resolved: 0, active: 0 },
      bySection: {},
    } as Stats
    result.rerender(<FolioRepetera {...props()} dueMistakes={[]} />)
    expect(screen.getByText('Här samlas dina missar från övningarna.')).toBeVisible()
    expect(result.container.textContent).not.toContain('nästa repetition följer din planering')
  })

  it('does not claim everything is relearned just because today’s pile is empty', () => {
    h.pile = []
    h.stats = {
      attempts: { total: 20 },
      mistakes: { resolved: 4, active: 3 },
      bySection: {},
    } as Stats
    const result = render(<FolioRepetera {...props()} dueMistakes={[]} />)
    expect(result.container.textContent).not.toContain('allt du missat är återlärt')
    expect(result.container.textContent).not.toContain('Inga missar än')
    h.stats.mistakes.active = 0
    result.rerender(<FolioRepetera {...props()} dueMistakes={[]} />)
    expect(result.container.textContent).toContain('återlärt')
  })

  it('labels an adoptable round and navigates through the existing start path', () => {
    const roundSession = {
      id: 42,
      sections: 'alla',
      plan: ['q1', 'q2', 'q3'],
      position: 1,
      endedAt: null,
    } as ActiveSession
    render(<FolioRepetera {...props()} roundSession={roundSession} />)
    expect(screen.getByTestId('repetera-start')).toHaveTextContent(
      'Fortsätt omgången · fråga 2 av 3',
    )
    fireEvent.click(screen.getByTestId('repetera-start'))
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/repetition?start=1')
  })

  it('holds the primary during loading/error and does not report an empty queue', () => {
    const result = render(<FolioRepetera navigateHref={navigate} />)
    expect(screen.getByRole('status')).toHaveTextContent('Laddar')
    expect(screen.getByTestId('repetera-start')).toBeDisabled()
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(navigate).not.toHaveBeenCalled()
    result.rerender(<FolioRepetera navigateHref={navigate} dueError />)
    expect(screen.getByRole('status')).toHaveTextContent('hämta')
    expect(screen.queryByTestId('repetition-fallback-link')).not.toBeInTheDocument()
  })

  it('describes siblings, remembered spacing and the selected exam without an unconditional promise', () => {
    render(<FolioRepetera {...props()} />)
    const margin = screen.getByRole('complementary')
    expect(margin).toHaveTextContent('ORD som samma ord')
    expect(margin).toHaveTextContent('halva')
    expect(margin).toHaveTextContent('24 okt')
    expect(margin).toHaveTextContent('veckan före')
    expect(margin).toHaveTextContent('inga poängavdrag')
    expect(margin).not.toHaveTextContent('1, 2, 4, 8, 16 och 30 dagar')
  })

  it('explains the same-question fallback when no sibling is available', () => {
    render(<FolioRepetera {...props()} />)
    expect(screen.getByRole('complementary')).toHaveTextContent(
      'LÄS, MEK, ELF och kvant kommer tillbaka som en ny fråga med samma fälla när det finns en, annars som samma fråga igen; ORD som samma ord.',
    )
  })

  it('states the exam graduation-hold window in days', () => {
    render(<FolioRepetera {...props()} />)
    expect(screen.getByRole('complementary')).toHaveTextContent(
      'Från 60 dagar före provet fram till sista veckan behålls även sådant du kan för en sista repetition.',
    )
    expect(screen.getByRole('complementary')).not.toHaveTextContent('Nära provet')
  })
})

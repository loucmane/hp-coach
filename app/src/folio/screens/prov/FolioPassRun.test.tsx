import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockPassProps } from '@/components/mock/useMockPass'
import type { AnswerLetter, Question, Section } from '@/data/questions'
import { type FocusRequest, ShellFocusContext } from '@/folio/host'
import { loadMockFlags, saveMockFlags } from '@/lib/mockSheet'
import { formatViolations, runAxe } from '@/test/a11y'
import FolioPassRun from './FolioPassRun'

const h = vi.hoisted(() => ({
  userId: 'student-a',
  phone: false,
  attempt: vi.fn(),
  mistake: vi.fn(),
  update: vi.fn(),
  submit: vi.fn(),
  explanation: vi.fn(),
}))
vi.mock('@clerk/clerk-react', () => ({ useAuth: () => ({ userId: h.userId }) }))
vi.mock('@/hooks/useViewport', () => ({ useViewport: () => (h.phone ? 'phone' : 'studio') }))
vi.mock('@/api/hooks/useAttempts', () => ({ useSubmitAttempt: () => ({ mutate: h.attempt }) }))
vi.mock('@/api/hooks/useMistakes', () => ({ useRecordMistake: () => ({ mutate: h.mistake }) }))
vi.mock('@/api/hooks/useSessions', () => ({ useUpdateSession: () => ({ mutate: h.update }) }))
vi.mock('@/api/hooks/useMockResults', () => ({ useSubmitMockResult: () => ({ mutate: h.submit }) }))
vi.mock('@/data/explanations', () => ({ loadExplanation: h.explanation }))

function question(section: Section, n = 1): Question {
  return {
    qid: `${section}-${n}`,
    section,
    number: n,
    exam_id: 'var-2024',
    provpass: 'verb1',
    prompt: `${section} fråga ${n}`,
    options: (['A', 'B', 'C', 'D', 'E'] as AnswerLetter[]).map((letter) => ({
      letter,
      text: `Val ${letter}`,
    })),
    answer: 'B',
    context: ['LÄS', 'ELF'].includes(section) ? 'Textens titel\n\nEtt stycke i texten.' : null,
    figure: section === 'DTK' ? { src: 'fig.svg', aspect_ratio: 1, kind: 'svg' } : null,
    parsing_status: 'complete',
  }
}
function props(overrides: Partial<MockPassProps> = {}): MockPassProps {
  return {
    plan: [question('ORD'), question('ORD', 2), question('LÄS', 3)],
    session: { id: 42, startedAt: new Date(), half: 'verbal', mode: 'authentic' },
    seenBefore: 0,
    onSettled: vi.fn(),
    onVoid: vi.fn(),
    ...overrides,
  }
}
function mount(overrides: Partial<MockPassProps> = {}) {
  const p = props(overrides)
  const register = vi.fn()
  const renderPass = (next = p) => (
    <div data-folio>
      <ShellFocusContext.Provider value={register}>
        <FolioPassRun {...next} />
      </ShellFocusContext.Provider>
    </div>
  )
  return { ...render(renderPass()), p, register, renderPass }
}
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  h.userId = 'student-a'
  h.phone = false
  h.update.mockImplementation((_input, options) => options?.onSuccess?.({}))
  h.submit.mockImplementation((_input, options) => options?.onSuccess?.({ id: 99 }))
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Folio ungraded pass', () => {
  it.each<Section>([
    'ORD',
    'MEK',
    'XYZ',
    'KVA',
    'NOG',
    'LÄS',
    'ELF',
    'DTK',
  ])('renders %s without grading after wrong and right picks', (section) => {
    const { container } = mount({ plan: [question(section)] })
    expect(screen.getByTestId('drill-prompt')).toBeVisible()
    for (const letter of ['A', 'B']) {
      fireEvent.click(screen.getByTestId(`option-${letter}`))
      expect(screen.getByTestId(`option-${letter}`)).toHaveAttribute('aria-pressed', 'true')
      expect(container.querySelector('[data-grade], .fa-verdict, .fa-facit')).toBeNull()
      expect(screen.queryByText(/Rätt svar|Ditt svar/)).toBeNull()
      fireEvent.keyDown(screen.getByTestId(`option-${letter}`), { key: 'Enter' })
      expect(h.submit).not.toHaveBeenCalled()
    }
    if (section === 'DTK') expect(screen.getByTestId('rd-plate')).toBeVisible()
    if (section === 'LÄS') expect(screen.getByTestId('rd-passage')).toBeVisible()
    if (section === 'ELF') expect(screen.getByTestId('rd-elf-passage')).toBeVisible()
    expect(h.explanation).not.toHaveBeenCalled()
  })
  it('keeps ELF cloze choices ungraded when revisiting another gap', () => {
    const context = 'A passage\n\nThe first ___38___ and the second ___39___ are here.'
    const plan = [38, 39].map((n) => ({ ...question('ELF', n), prompt: '', context }))
    const { container } = mount({ plan })
    fireEvent.click(screen.getByTestId('option-A'))
    fireEvent.click(screen.getByRole('button', { name: 'Nästa fråga' }))
    fireEvent.click(screen.getByTestId('option-B'))
    expect(
      container.querySelector('[data-state="right"], [data-state="wrong"], [data-grade]'),
    ).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Föregående fråga' }))
    expect(screen.getByTestId('option-A')).toHaveAttribute('aria-pressed', 'true')
  })
  it('uses the reading plate and phone tools and suspends shortcuts inside the figure viewer', () => {
    h.phone = true
    const { container } = mount({ plan: [question('DTK'), question('DTK', 2)] })
    const image = screen.getByRole('img')
    fireEvent.click(screen.getByRole('button', { name: 'Nästa fråga' }))
    expect(screen.getByRole('img')).toBe(image)
    fireEvent.click(screen.getByTestId('question-figure'))
    expect(screen.getByRole('dialog')).toBeVisible()
    fireEvent.keyDown(document.body, { key: 'a' })
    expect(h.attempt).not.toHaveBeenCalled()
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(container.querySelector('.rd-sheet')).toBeInTheDocument()
  })
  it('marks questions, exposes answer/blank/marked states in the index and jumps', async () => {
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByTestId('option-A'))
    await user.click(screen.getByRole('button', { name: 'Markera' }))
    expect(screen.getByTestId('prov-dog-ear')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Översikt' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByTestId('mock-cell-1')).toHaveAccessibleName(/1.*Besvarad.*Markerad/)
    expect(within(dialog).getByTestId('mock-cell-3')).toHaveAccessibleName(/3.*Obesvarad/)
    await user.click(within(dialog).getByTestId('mock-cell-3'))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByTestId('drill-prompt')).toHaveTextContent('LÄS fråga 3')
    expect(h.update).toHaveBeenCalledWith({
      id: 42,
      patch: { position: 2, currentQuestionId: 'LÄS-3' },
    })
  })
  it('supports letters/numbers, arrows/J/K and M, but ignores modified, repeated, composing and editable events', () => {
    mount()
    fireEvent.keyDown(document.body, { key: '2' })
    expect(screen.getByTestId('option-B')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.keyDown(document.body, { key: 'j' })
    fireEvent.keyDown(document.body, { key: 'a' })
    fireEvent.keyDown(document.body, { key: 'm' })
    expect(screen.getByRole('button', { name: 'Markera' })).toHaveAttribute('aria-pressed', 'true')
    for (const modifiers of [
      { ctrlKey: true },
      { metaKey: true },
      { altKey: true },
      { repeat: true },
      { isComposing: true },
    ])
      fireEvent.keyDown(document.body, { key: 'b', ...modifiers })
    const input = document.createElement('input')
    screen.getByTestId('mock-runner').appendChild(input)
    fireEvent.keyDown(input, { key: 'b' })
    input.remove()
    expect(h.attempt).toHaveBeenCalledTimes(2)
    fireEvent.keyDown(document.body, { key: 'k' })
    expect(screen.getByTestId('option-B')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' })
    expect(screen.getByTestId('option-B')).toHaveAttribute('aria-pressed', 'true')
  })
  it('warns once at 5:00 with a fixed blank list and stays silent after dismissal', () => {
    vi.useFakeTimers()
    const now = new Date('2026-10-29T10:00:00Z')
    vi.setSystemTime(now)
    mount({
      session: {
        id: 42,
        startedAt: new Date(now.getTime() - 49 * 60_000 - 59_000),
        half: 'verbal',
        mode: 'authentic',
      },
    })
    fireEvent.click(screen.getByTestId('option-A'))
    expect(screen.queryByTestId('prov-pace-warn')).toBeNull()
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByTestId('mock-countdown')).toHaveTextContent('05:00')
    const warning = screen.getByTestId('prov-pace-warn')
    expect(warning).toHaveTextContent('Fem minuter kvar. 2 frågor är obesvarade: 2, 3.')
    fireEvent.keyDown(document.body, { key: 'j' })
    fireEvent.keyDown(document.body, { key: 'a' })
    act(() => vi.advanceTimersByTime(1000))
    expect(warning).toHaveTextContent('2 frågor är obesvarade: 2, 3.')
    fireEvent.click(screen.getByRole('button', { name: 'Stäng tidsnotisen' }))
    act(() => vi.advanceTimersByTime(20_000))
    fireEvent(document, new Event('visibilitychange'))
    expect(screen.queryByTestId('prov-pace-warn')).toBeNull()
  })
  it('hands in only from its slip, names blanks, traps/restores focus and settles once', async () => {
    const user = userEvent.setup()
    const { p } = mount()
    await user.click(screen.getByTestId('option-B'))
    await user.click(screen.getByRole('button', { name: 'Markera' }))
    await user.click(screen.getByTestId('mock-submit'))
    let dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('2 frågor är obesvarade: 2, 3.')
    expect(within(dialog).getByRole('button', { name: 'Fortsätt provpasset' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(within(dialog).getByRole('button', { name: 'Lämna in' })).toHaveFocus()
    fireEvent.keyDown(document.body, { key: 'a' })
    expect(h.attempt).toHaveBeenCalledTimes(1)
    await user.keyboard('{Escape}')
    expect(screen.getByTestId('mock-submit')).toHaveFocus()
    expect(h.submit).not.toHaveBeenCalled()
    await user.click(screen.getByTestId('mock-submit'))
    dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Lämna in' }))
    expect(p.onSettled).toHaveBeenCalledWith(
      { id: 99 },
      { flagged: ['ORD-1'], answers: new Map([['ORD-1', 'B']]) },
    )
    expect(h.submit).toHaveBeenCalledTimes(1)
    expect(h.mistake).toHaveBeenCalledWith({ questionId: 'ORD-1' })
    expect(loadMockFlags(h.userId, 42).size).toBe(0)
  })
  it('shell exit and abort both use the safe slip and preserve void semantics', () => {
    const { p, register } = mount()
    const request = register.mock.calls
      .map(([value]) => value)
      .find((value) => typeof value === 'object') as FocusRequest
    fireEvent.click(screen.getByTestId('option-A'))
    act(() => request.onExit?.())
    expect(screen.getByRole('dialog')).toHaveTextContent('Avbryter du nu blir provpasset ogiltigt.')
    expect(screen.getByRole('button', { name: 'Fortsätt provpasset' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Fortsätt provpasset' }))
    expect(p.onVoid).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('mock-abandon'))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Avbryt provpasset' }),
    )
    expect(p.onVoid).toHaveBeenCalledTimes(1)
    expect(h.submit).not.toHaveBeenCalled()
    expect(h.mistake).toHaveBeenCalledWith({ questionId: 'ORD-1' })
  })
  it('times out exactly once even while a slip is open', () => {
    vi.useFakeTimers()
    const { p } = mount({ durationMsOverride: 1000 })
    fireEvent.click(screen.getByRole('button', { name: 'Översikt' }))
    act(() => vi.advanceTimersByTime(1000))
    act(() => vi.advanceTimersByTime(2000))
    expect(h.submit).toHaveBeenCalledTimes(1)
    expect(p.onSettled).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('resets sheet and warning state at account/session boundaries', () => {
    saveMockFlags(h.userId, 42, new Set(['ORD-1']))
    const { p, rerender, renderPass } = mount()
    fireEvent.click(screen.getByTestId('option-A'))
    expect(screen.getByRole('button', { name: 'Markera' })).toHaveAttribute('aria-pressed', 'true')
    h.userId = 'student-b'
    rerender(renderPass())
    expect(screen.getByTestId('option-A')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Markera' })).toHaveAttribute('aria-pressed', 'false')
    rerender(renderPass({ ...p, session: { ...p.session, id: 43 } }))
    expect(screen.getByTestId('option-A')).toHaveAttribute('aria-pressed', 'false')
  })
  it('passes axe on the stage, overview, hand-in and abort slips', async () => {
    const { container } = mount()
    for (const name of [null, 'Översikt', 'Lämna in', 'Avbryt provpass']) {
      if (name) fireEvent.click(screen.getByRole('button', { name }))
      const violations = await runAxe(container)
      expect(violations, formatViolations(violations)).toEqual([])
      if (name) fireEvent.keyDown(document.body, { key: 'Escape' })
    }
  })
})

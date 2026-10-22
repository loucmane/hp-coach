import { readFileSync } from 'node:fs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActiveSession } from '@/api/hooks/useSessions'
import type { Explanation } from '@/data/explanations'
import type { Question } from '@/data/questions'

const h = vi.hoisted(() => ({
  start: vi.fn(),
  update: vi.fn(),
  submit: vi.fn(),
  navigate: vi.fn(),
  load: vi.fn(),
  bank: [] as Question[],
  explanation: null as Explanation | null,
  loadedExplanations: new Map<string, Explanation | null>(),
  active: null as ActiveSession | null,
  phone: false,
}))
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => h.navigate,
  useLocation: () => ({ pathname: '/drill' }),
  Link: ({ to, children, ...props }: ComponentProps<'a'> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))
vi.mock('@/api/hooks/useSessions', () => ({
  useActiveSessionOfKind: () => ({ data: h.active, isPending: false }),
  useStartSession: () => ({ mutateAsync: h.start, isPending: false }),
  useUpdateSession: () => ({ mutate: h.update }),
  useSessionAttempts: () => ({ data: [] }),
}))
vi.mock('@/api/hooks/useAttempts', () => ({ useSubmitAttempt: () => ({ mutate: h.submit }) }))
vi.mock('@/data/questions', async (original) => ({
  ...(await original<typeof import('@/data/questions')>()),
  loadBank: async () => h.bank,
}))
vi.mock('@/data/explanations', () => ({
  loadExplanation: (qid: string) => h.load(qid),
  peekExplanation: (qid: string) => h.loadedExplanations.get(qid) ?? null,
}))
vi.mock('@/data/frameworks', async (original) => ({
  ...(await original<typeof import('@/data/frameworks')>()),
  loadFramework: async () => ({
    family: 'ord_roots',
    entries: [{ id: 'ORD-ROOT-001', root: 'Ordets rot' }],
  }),
}))
vi.mock('@/hooks/useViewport', () => ({ useViewport: () => (h.phone ? 'phone' : 'studio') }))
vi.mock('@/folio/data/useShellData', () => ({
  useFolioShellData: () => ({ subtitles: {}, dueCount: 0, identity: { name: 'Ada' } }),
}))
vi.mock('@/folio/shell/AccountMenu', () => ({ AccountMenu: () => null }))
vi.mock('@/components/motion/DueNumeral', () => ({ DueHeaderStation: () => null }))
vi.mock('@/components/drill/DrillResult', () => ({ DrillResult: () => <h1>Klart.</h1> }))
vi.mock('@/components/motion/QuestionPan', () => ({
  QuestionPan: ({ children }: { children: ReactNode }) => children,
}))

import { SessionPlayer, type SessionPlayerProps } from '@/components/session/SessionPlayer'
import { peekExplanation } from '@/data/explanations'
import { FolioShell } from '@/folio/FolioShell'
import { endedSessionIdsThisTab } from '@/lib/endedSessions'
import { useUiStore } from '@/stores/uiStore'
import { formatViolations, runAxe } from '@/test/a11y'
import FolioSessionStage from './FolioSessionStage'

function fixture(n = 1, section: Question['section'] = 'ORD'): Question {
  return {
    qid: `host-2025-verb1-${section}-${n}`,
    exam_id: 'host-2025',
    provpass: 'verb1',
    section,
    number: n,
    prompt: 'begrunda',
    context: null,
    answer: 'A',
    parsing_status: 'complete',
    options: [
      { letter: 'A', text: 'fundera' },
      { letter: 'B', text: 'skynda' },
      { letter: 'C', text: 'tvivla' },
      { letter: 'D', text: 'ropa' },
    ],
  }
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  // History traversals are asynchronous in jsdom. Keep one completed test's
  // marker consumption from opening the next mounted session's leave sheet.
  vi.spyOn(window.history, 'back').mockImplementation(() => {})
  window.history.replaceState(null, '')
  endedSessionIdsThisTab.clear()
  h.active = null
  h.phone = false
  h.bank = [fixture(), fixture(2)]
  h.explanation = {
    solution_path: 'Så finner du svaret.',
    distractors: ['B', 'C', 'D'].map((letter) => ({
      letter,
      why_tempting: `Lockar ${letter}`,
      why_wrong: `Orsak ${letter}`,
    })),
    technique: 'Läs noga.',
    pitfall: 'Blanda inte ihop orden.',
    framework_id: 'ORD-ROOT-001',
    steps: [
      { n: 1, title: 'Läs ordet', text: 'Första steget.' },
      { n: 2, title: 'Kontrollera', text: 'Andra steget.', tier: 'detail' },
    ],
    pregrade_tactic: { handle: 'Pröva en synonym', move: 'Sätt in ordet i en mening.' },
  }
  h.loadedExplanations.clear()
  h.load.mockImplementation(async (qid: string) => {
    h.loadedExplanations.set(qid, h.explanation)
    return h.explanation
  })
  h.start.mockResolvedValue({ id: 42 })
  useUiStore.setState({ folioPreview: false, mode: 'light' })
})
function mount(folio = true, props: Partial<SessionPlayerProps> = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  client.setQueryData(['question-bank'], h.bank)
  const player = (
    <SessionPlayer
      sessionKind="drill"
      sections="ORD"
      pickQuestions={() => h.bank}
      idleEyebrow="Öva"
      idleHeadline="Övning"
      idleSubcopy="Ord"
      activeTab="ova"
      autoStart
      {...props}
    />
  )
  return render(
    <QueryClientProvider client={client}>
      {folio ? <FolioShell>{player}</FolioShell> : player}
    </QueryClientProvider>,
  )
}
async function questionReady() {
  const lock = await screen.findByTestId('fa-lock')
  await act(async () => {})
  return lock
}
function key(key: string, shiftKey = false) {
  fireEvent.keyDown(document.body, { key, shiftKey })
}

describe('Folio through the real SessionPlayer', () => {
  it('selects without committing; Svara submits once and retains wrong-answer effects', async () => {
    const onWrong = vi.fn()
    expect(peekExplanation(h.bank[0].qid)).toBeNull()
    mount(true, { onWrong })
    const lock = await questionReady()
    key('b')
    expect(h.submit).not.toHaveBeenCalled()
    expect(screen.getByTestId('option-B')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(lock)
    fireEvent.click(lock)
    expect(h.submit).toHaveBeenCalledTimes(1)
    expect(h.submit).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 42,
        selectedAnswer: 'B',
        correct: false,
        layer1Ids: ['ORD-ROOT-001'],
      }),
    )
    expect(h.load).toHaveBeenCalledWith(h.bank[0].qid)
    expect(peekExplanation(h.bank[0].qid)?.framework_id).toBe('ORD-ROOT-001')
    expect(onWrong).toHaveBeenCalledWith(h.bank[0])
    expect(screen.getByTestId('fa-verdict')).toHaveTextContent('Fel.')
  })
  it('submits once with Enter on a clicked option and advances from feedback', async () => {
    const user = userEvent.setup()
    mount()
    await questionReady()
    const option = screen.getByTestId('option-B')
    await user.click(option)
    expect(option).toHaveFocus()
    expect(option).toHaveAttribute('aria-pressed', 'true')
    expect(h.submit).not.toHaveBeenCalled()
    await user.keyboard('{Enter}')
    expect(h.submit).toHaveBeenCalledTimes(1)
    expect(h.submit).toHaveBeenCalledWith(expect.objectContaining({ selectedAnswer: 'B' }))
    expect(screen.getByTestId('fa-verdict')).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('drill-question')).toHaveAttribute('data-qid', h.bank[1].qid)
    expect(h.submit).toHaveBeenCalledTimes(1)
  })
  it('selects a tabbed-to option with Enter before committing on a second Enter', async () => {
    const user = userEvent.setup()
    mount()
    await questionReady()
    await user.tab()
    const option = screen.getByTestId('option-A')
    expect(option).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(h.submit).not.toHaveBeenCalled()
    expect(option).toHaveAttribute('aria-pressed', 'true')
    expect(option).toHaveFocus()
    expect(screen.getByTestId('fa-lock')).toBeEnabled()
    await user.keyboard('{Enter}')
    expect(h.submit).toHaveBeenCalledTimes(1)
    expect(h.submit).toHaveBeenCalledWith(expect.objectContaining({ selectedAnswer: 'A' }))
  })
  it('selects focused B with Enter when A was selected, then commits B exactly once', async () => {
    const user = userEvent.setup()
    mount()
    await questionReady()
    await user.click(screen.getByTestId('option-A'))
    await user.tab()
    await user.tab()
    const option = screen.getByTestId('option-B')
    expect(option).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(h.submit).not.toHaveBeenCalled()
    expect(screen.getByTestId('option-A')).toHaveAttribute('aria-pressed', 'false')
    expect(option).toHaveAttribute('aria-pressed', 'true')
    expect(option).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(h.submit).toHaveBeenCalledTimes(1)
    expect(h.submit).toHaveBeenCalledWith(expect.objectContaining({ selectedAnswer: 'B' }))
  })
  it('eliminates with Shift+letter and Enter submits, advances and ends', async () => {
    mount()
    await questionReady()
    key('b', true)
    expect(screen.getByRole('button', { name: 'Ångra strykningen av B' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    key('a')
    key('Enter')
    expect(h.submit).toHaveBeenCalledTimes(1)
    key('Enter')
    expect(h.update).toHaveBeenCalledWith({
      id: 42,
      patch: { position: 1, currentQuestionId: h.bank[1].qid },
    })
    expect(screen.getByTestId('drill-question')).toHaveAttribute('data-qid', h.bank[1].qid)
    key('a')
    key('Enter')
    key('Enter')
    expect(h.submit).toHaveBeenCalledTimes(2)
    expect(h.update).toHaveBeenCalledWith({ id: 42, patch: { end: true } })
    expect(screen.getByText('Klart.')).toBeInTheDocument()
  })
  it('keeps one block across advances and starts a resumed block at its saved index', async () => {
    h.bank = [fixture(), fixture(2), fixture(3)].map((q) => ({ ...q, context: 'Gemensam text.' }))
    mount(true, { urlSyncedQid: { qid: h.bank[1].qid, setQid: vi.fn() } })
    await questionReady()
    expect(screen.getByTestId('drill-question')).toHaveAttribute('data-qid', h.bank[1].qid)
    await waitFor(() => expect(h.load).toHaveBeenCalledWith(h.bank[0].qid))
    expect(h.load).toHaveBeenCalledWith(h.bank[2].qid)
    key('a')
    key('Enter')
    key('Enter')
    expect(screen.getByTestId('drill-question')).toHaveAttribute('data-qid', h.bank[2].qid)
    expect(screen.getByTestId('fa-lock')).toBeDisabled()
  })
  it('uses the shell exit and suppresses drill shortcuts while the leave sheet is open', async () => {
    mount()
    await questionReady()
    await waitFor(() => expect(screen.queryByRole('navigation')).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: 'Avsluta' }))
    expect(screen.getByTestId('session-leave-sheet')).toBeInTheDocument()
    key('a')
    key('Enter')
    expect(h.submit).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('session-leave-continue'))
    key('a')
    key('Enter')
    expect(h.submit).toHaveBeenCalledTimes(1)
  })
  it('adopts the stored session at its cursor without creating another session', async () => {
    h.bank = [fixture(), fixture(2), fixture(3)].map((q) => ({ ...q, context: 'Samma stycke.' }))
    h.active = {
      id: 73,
      userId: 1,
      kind: 'drill',
      sections: 'ORD',
      position: 1,
      currentQuestionId: h.bank[1].qid,
      plan: h.bank.map((q) => q.qid),
      device: 'desktop',
      startedAt: null,
      endedAt: null,
    }
    const resolvePlan = vi.fn(async () => h.bank)
    const pickQuestions = vi.fn(() => h.bank)
    mount(true, { resolvePlan, pickQuestions })
    await questionReady()
    expect(resolvePlan).toHaveBeenCalledWith(h.active.plan, 1)
    expect(pickQuestions).not.toHaveBeenCalled()
    expect(h.start).not.toHaveBeenCalled()
    expect(screen.getByTestId('drill-question')).toHaveAttribute('data-qid', h.bank[1].qid)
    key('a')
    key('Enter')
    key('Enter')
    expect(h.submit).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 73, questionId: h.bank[1].qid }),
    )
    expect(h.update).toHaveBeenCalledWith({
      id: 73,
      patch: { position: 2, currentQuestionId: h.bank[2].qid },
    })
  })
  it('keeps adaptive review labels and caller grading hooks', async () => {
    h.bank = [fixture()]
    const onCorrect = vi.fn()
    const onComplete = vi.fn()
    mount(true, { sessionKind: 'adaptive_review', onCorrect, onComplete })
    await questionReady()
    expect(screen.getByRole('heading', { name: 'Repetition · ORD' })).toBeInTheDocument()
    key('a')
    key('Enter')
    expect(onCorrect).toHaveBeenCalledWith(h.bank[0])
    fireEvent.click(screen.getByRole('button', { name: /Slutför genomgången/ }))
    expect(onComplete).toHaveBeenCalledWith(42)
  })
  it('renders MEK gaps and follows step references into collapsed detail', async () => {
    h.bank = [{ ...fixture(1, 'MEK'), prompt: 'Han _____ hem.' }]
    h.explanation!.distractors[0].why_wrong = 'Se (steg 2).'
    mount()
    await questionReady()
    expect(screen.getByText('lucka 1')).toBeInTheDocument()
    key('b')
    key('Enter')
    fireEvent.click(screen.getByRole('button', { name: '(steg 2)' }))
    expect(screen.getByText('Andra steget.')).toBeInTheDocument()
  })
  it('leaves Enter on the tactic disclosure and eliminate control to their native buttons', async () => {
    const user = userEvent.setup()
    mount()
    await questionReady()
    key('a')
    const tactic = await screen.findByRole('button', { name: 'Visa taktik' })
    tactic.focus()
    await user.keyboard('{Enter}')
    expect(h.submit).not.toHaveBeenCalled()
    expect(screen.getByText('Sätt in ordet i en mening.')).toBeInTheDocument()
    screen.getByRole('button', { name: 'Stryk B' }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Ångra strykningen av B' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(h.submit).not.toHaveBeenCalled()
  })
  it('renders every distractor, steps on request, detail toggles and the framework', async () => {
    mount()
    await questionReady()
    key('b')
    key('Enter')
    expect(await screen.findByText('Ordets rot')).toBeInTheDocument()
    expect(screen.getByText('Lockar B')).toBeInTheDocument()
    expect(screen.getByText('Blanda inte ihop orden.')).toBeInTheDocument()
    for (const letter of ['C', 'D']) {
      fireEvent.click(screen.getByRole('button', { name: `Varför inte ${letter}` }))
      expect(screen.getByText(`Orsak ${letter}`)).toBeInTheDocument()
    }
    expect(screen.queryByText('Första steget.')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Visa steg för steg' }))
    expect(screen.getByText('Första steget.')).toBeInTheDocument()
    expect(screen.queryByText('Andra steget.')).toBeNull()
    fireEvent.click(screen.getByTestId('fa-step-toggle-2'))
    expect(screen.getByText('Andra steget.')).toBeInTheDocument()
    expect(screen.queryByText('Slå upp')).toBeNull()
  })
  it('uses resolveSteps for prose-only explanations', async () => {
    h.explanation = { ...h.explanation!, steps: undefined, solution_path: 'Del ett.\n\nDel två.' }
    mount()
    await questionReady()
    key('a')
    key('Enter')
    fireEvent.click(screen.getByRole('button', { name: 'Visa steg för steg' }))
    expect(screen.getByTestId('fa-step-1')).toHaveTextContent('Del ett.')
    expect(screen.getByTestId('fa-step-2')).toHaveTextContent('Del två.')
  })
  it.each([
    'XYZ',
    'KVA',
    'NOG',
  ] as const)('renders accessible %s math in both phases', async (section) => {
    h.bank = [
      {
        ...fixture(1, section),
        prompt:
          section === 'XYZ'
            ? 'Vilket bråk är lika med \uE000\\frac{3}{8}\uE001?'
            : section === 'KVA'
              ? '\uE000x>0\uE001\nKvantitet I: \uE000\\frac{x}{2}\uE001\nKvantitet II: \uE000x\uE001'
              : 'Vad är \uE000x\uE001?\n(1) \uE000x>1\uE001\n(2) \uE000x<3\uE001',
        options: fixture().options!.map((option, i) => ({
          ...option,
          text: `\uE000\\frac{${i + 3}}{8}\uE001`,
        })),
      },
    ]
    const { container } = mount()
    await questionReady()
    if (section !== 'XYZ') {
      expect(
        screen.getByRole('group', {
          name: section === 'KVA' ? 'Villkoret och kvantiteterna' : 'Frågan och påståendena',
        }),
      ).toBeInTheDocument()
      const mathSelector = section === 'KVA' ? '.fa-kva td .katex' : '.fa-nog li .katex'
      expect(container.querySelectorAll(mathSelector)).toHaveLength(2)
    }
    expect(screen.getByTestId('drill-prompt').querySelector('.katex')).not.toBeNull()
    expect(screen.getByTestId('option-A').querySelector('.katex .mfrac')).not.toBeNull()
    const questionViolations = await runAxe(container)
    expect(questionViolations, formatViolations(questionViolations)).toEqual([])
    key('b')
    key('Enter')
    expect(screen.getByTestId('fa-verdict')).toBeInTheDocument()
    expect(container.querySelectorAll('.fa-opt .katex .mfrac')).toHaveLength(4)
    expect(container.querySelectorAll('.fa-dis-opt .katex .mfrac')).toHaveLength(2)
    const feedbackViolations = await runAxe(container)
    expect(feedbackViolations, formatViolations(feedbackViolations)).toEqual([])
  })
  it.each([false, true])('has accessible question and feedback, phone=%s', async (phone) => {
    h.phone = phone
    const { container } = mount()
    await questionReady()
    const questionViolations = await runAxe(container)
    expect(questionViolations, formatViolations(questionViolations)).toEqual([])
    key('b')
    key('Enter')
    expect(screen.getByTestId('drill-question')).toHaveAttribute('data-phase', 'feedback')
    fireEvent.click(screen.getByRole('button', { name: 'Visa steg för steg' }))
    fireEvent.click(screen.getByTestId('fa-step-toggle-2'))
    for (const letter of ['C', 'D']) {
      fireEvent.click(screen.getByRole('button', { name: `Varför inte ${letter}` }))
    }
    const feedbackViolations = await runAxe(container)
    expect(feedbackViolations, formatViolations(feedbackViolations)).toEqual([])
  })
  it('keeps the classic option IDs and direct letter commit with the flag off', async () => {
    h.phone = true
    mount(false)
    await screen.findByTestId('option-A')
    await act(async () => {})
    expect(screen.queryByTestId('fa-lock')).toBeNull()
    key('a')
    expect(h.submit).toHaveBeenCalledTimes(1)
  })
  it.each(['LÄS', 'ELF', 'DTK'] as const)('uses Folio controls for %s', async (section) => {
    h.phone = true
    h.bank = [fixture(1, section)]
    mount()
    await screen.findByTestId('option-A')
    await act(async () => {})
    expect(screen.getByTestId('fa-lock')).toBeInTheDocument()
    key('a')
    expect(h.submit).not.toHaveBeenCalled()
    key('Enter')
    expect(h.submit).toHaveBeenCalledTimes(1)
  })
  it('switches between Folio and classic questions in one plan', async () => {
    h.phone = true
    h.bank = [fixture(), { ...fixture(2, 'DTK'), options: null }, fixture(3)]
    mount()
    await questionReady()
    key('a')
    key('Enter')
    key('Enter')
    expect(screen.queryByTestId('fa-lock')).toBeNull()
    // An options-less item stays classic; its existing keyboard path can advance.
    expect(screen.getByTestId('drill-question')).toHaveAttribute('data-qid', h.bank[1].qid)
    key('a')
    key('Enter')
    await questionReady()
    expect(screen.getByTestId('drill-question')).toHaveAttribute('data-qid', h.bank[2].qid)
    expect(h.start).toHaveBeenCalledTimes(1)
    expect(h.submit).toHaveBeenCalledTimes(2)
  })
  it('renders question and option figures', async () => {
    h.bank = [
      {
        ...fixture(),
        figure: { src: 'figure.svg', aspect_ratio: 1.5 },
        options: [{ letter: 'A', text: 'Bild A', figure: { src: 'option.svg', aspect_ratio: 2 } }],
      },
    ]
    mount()
    await questionReady()
    expect(screen.getByAltText('Figur till uppgift 1')).toHaveAttribute('src', '/figure.svg')
    expect(within(screen.getByTestId('option-A')).getByRole('img')).toHaveAttribute(
      'src',
      '/option.svg',
    )
  })
  it('handles absent explanations without blocking a grade', async () => {
    h.load.mockRejectedValue(new Error('offline'))
    h.explanation = null
    mount()
    await questionReady()
    key('a')
    key('Enter')
    expect(
      await screen.findByText('Förklaring saknas ännu för den här frågan.'),
    ).toBeInTheDocument()
    expect(h.submit).toHaveBeenCalledTimes(1)
  })
})

it.each([
  { section: 'XYZ', phone: false },
  { section: 'NOG', phone: true },
  { section: 'DTK', phone: false },
  { section: 'LÄS', phone: true },
  { section: 'ELF', phone: true },
  { section: 'DTK', phone: true },
] as const)('starts new $section questions at the top except within phone reading blocks, phone=$phone', async ({
  section,
  phone,
}) => {
  h.phone = phone
  const reading = ['LÄS', 'ELF', 'DTK'].includes(section)
  h.bank = [1, 2, 3].map((n) => ({
    ...fixture(n, section),
    context: section === 'LÄS' || section === 'ELF' ? `Text ${n < 3 ? 1 : 2}.` : null,
    figure:
      section === 'DTK' ? { src: `plate-${n < 3 ? 1 : 2}.jpg`, aspect_ratio: 0.7 } : undefined,
  }))
  const scroll = vi.mocked(window.scrollTo)
  const focus = vi.spyOn(HTMLElement.prototype, 'focus')
  try {
    mount()
    await questionReady()
    for (let index = 1; index < h.bank.length; index++) {
      scroll.mockClear()
      key('a')
      key('Enter')
      expect(scroll).not.toHaveBeenCalled()
      focus.mockClear()
      fireEvent.click(screen.getByTestId('drill-next'))
      await questionReady()
      expect(screen.getByTestId('drill-question')).toHaveAttribute('data-qid', h.bank[index].qid)
      const question = screen.getByRole('region', { name: `Uppgift ${index + 1}` })
      expect(question).toHaveFocus()
      const focusIndex = focus.mock.contexts.indexOf(question)
      expect(focusIndex).toBeGreaterThanOrEqual(0)
      expect(focus.mock.calls[focusIndex]).toEqual([{ preventScroll: true }])
      if (phone && reading && index === 1) {
        expect(scroll).not.toHaveBeenCalled()
      } else {
        expect(scroll).toHaveBeenCalledExactlyOnceWith({ top: 0 })
        expect(scroll.mock.invocationCallOrder[0]).toBeLessThan(
          focus.mock.invocationCallOrder[focusIndex],
        )
      }
    }
  } finally {
    focus.mockRestore()
  }
})

it.each([
  false,
  true,
])('does not reset scroll when the figure viewer closes, phone=%s', async (phone) => {
  h.phone = phone
  h.bank = [{ ...fixture(1, 'DTK'), figure: { src: 'plate.jpg', aspect_ratio: 0.7 } }]
  mount()
  await questionReady()
  vi.mocked(window.scrollTo).mockClear()
  fireEvent.click(screen.getByRole('button', { name: 'Förstora' }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Stäng' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByRole('region', { name: 'Uppgift 1' })).toHaveFocus()
  expect(window.scrollTo).not.toHaveBeenCalled()
})

it.each([
  false,
  true,
])('does not reset scroll when the leave sheet closes, phone=%s', async (phone) => {
  h.phone = phone
  h.bank = [fixture(1, 'NOG')]
  mount()
  await questionReady()
  vi.mocked(window.scrollTo).mockClear()
  fireEvent.click(screen.getByRole('button', { name: 'Avsluta' }))
  expect(screen.getByTestId('session-leave-sheet')).toBeInTheDocument()
  fireEvent.click(screen.getByTestId('session-leave-continue'))
  expect(screen.queryByTestId('session-leave-sheet')).toBeNull()
  expect(screen.getByRole('region', { name: 'Uppgift 1' })).toHaveFocus()
  expect(window.scrollTo).not.toHaveBeenCalled()
})

it('retains question focus when switching between desktop and phone layouts', async () => {
  const props = {
    plan: [{ ...fixture(1, 'DTK'), figure: { src: 'plate.jpg', aspect_ratio: 0.7 } }],
    index: 0,
    picked: null,
    graded: false,
    onPick: h.submit,
    onNext: vi.fn(),
    sessionKind: 'drill' as const,
  }
  const { rerender } = render(<FolioSessionStage {...props} />)
  await questionReady()
  vi.mocked(window.scrollTo).mockClear()
  for (const phone of [true, false]) {
    h.phone = phone
    rerender(<FolioSessionStage {...props} />)
    expect(screen.getByRole('region', { name: 'Uppgift 1' })).toHaveFocus()
    expect(window.scrollTo).not.toHaveBeenCalled()
  }
})

it.each([
  false,
  true,
])('focuses a DTK question without scrolling but scrolls to feedback, phone=%s', async (phone) => {
  h.phone = phone
  h.bank = [{ ...fixture(1, 'DTK'), figure: { src: 'plate.jpg', aspect_ratio: 0.7 } }]
  const focus = vi.spyOn(HTMLElement.prototype, 'focus')
  try {
    mount()
    await questionReady()
    expect(window.scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 0 })
    const question = screen.getByRole('region', { name: 'Uppgift 1' })
    const questionCalls = focus.mock.calls.filter((_, i) => focus.mock.contexts[i] === question)
    expect(questionCalls.length).toBeGreaterThan(0)
    expect(questionCalls.every(([options]) => options?.preventScroll === true)).toBe(true)
    key('a')
    key('Enter')
    const verdict = screen.getByTestId('fa-verdict')
    expect(verdict).toHaveFocus()
    expect(focus.mock.calls.filter((_, i) => focus.mock.contexts[i] === verdict)).toContainEqual([
      { preventScroll: false },
    ])
  } finally {
    focus.mockRestore()
  }
})

it.each([
  false,
  true,
])('restores earlier ELF gaps without resetting the current choice, late=%s', async (late) => {
  const context = 'A title\n\nWe 31_____ it, then 32_____ it and 33_____ it.'
  const plan = [
    fixture(),
    ...[31, 32, 33].map((n) => ({
      ...fixture(n, 'ELF'),
      prompt: '',
      context,
    })),
  ]
  const props = {
    plan,
    index: 3,
    picked: null,
    graded: false,
    onPick: h.submit,
    onNext: vi.fn(),
    sessionKind: 'drill' as const,
  }
  const picks = ['A', 'B', 'A', null] as const
  const { container, rerender } = render(<FolioSessionStage {...props} picks={late ? [] : picks} />)
  await questionReady()
  key('b')
  if (late) rerender(<FolioSessionStage {...props} picks={picks} />)
  expect(screen.getByTestId('drill-prompt')).toHaveTextContent('Lucka 33')
  expect(container.querySelector('[data-gap="31"]')).toHaveAttribute('data-state', 'wrong')
  expect(container.querySelector('[data-gap="31"] s')).toHaveTextContent('skynda')
  expect(container.querySelector('[data-gap="32"]')).toHaveAttribute('data-state', 'right')
  expect(container.querySelector('[data-gap="32"] .rd-gapword')).toHaveTextContent('fundera')
  expect(screen.getByTestId('option-B')).toHaveAttribute('aria-pressed', 'true')
  expect(h.submit).not.toHaveBeenCalled()
  key('Enter')
  expect(container.querySelector('[data-gap="33"]')).toHaveAttribute('data-state', 'wrong')
  expect(container.querySelector('[data-gap="31"] s')).toHaveTextContent('skynda')
  expect(h.submit).toHaveBeenCalledTimes(1)
})

it.each([
  '.fa-opt .katex .mfrac',
  '.fa-dis-opt .katex .mfrac',
])('enlarges only stacked fractions in %s', (selector) => {
  const css = readFileSync('src/folio/screens/drill/drill.css', 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  )
  // 17px text * 1.14 math scale * 0.7 fraction digits * 1.25 = about 17px.
  const rule = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find((match) =>
    match[1].split(',').some((part) => part.trim() === `[data-folio] .fa-drill ${selector}`),
  )
  expect(rule?.[2] ?? '').toMatch(/font-size:\s*1\.25em/)
})

it.each([
  '.fa-opt',
  '.fa-dis-opt',
])('keeps non-fraction math in %s at the relative scale', (option) => {
  const css = readFileSync('src/folio/screens/drill/drill.css', 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  )
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((match) =>
    match[1]
      .split(',')
      .some((part) =>
        [`[data-folio] .fa-drill .katex`, `[data-folio] .fa-drill ${option} .katex`].includes(
          part.trim(),
        ),
      ),
  )
  expect(rules.length).toBeGreaterThan(0)
  for (const rule of rules) {
    expect(rule[2]).toMatch(/font-size:\s*var\(--fa-math-scale\)/)
  }
})

it.each(['drill.css', 'reading.css'])('keeps %s local and uses neutral ink for errors', (file) => {
  const css = readFileSync(`src/folio/screens/drill/${file}`, 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  )
  expect(css).not.toMatch(/--fa-bad|\bred\b|#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch)\(/i)
  for (const match of css.matchAll(/([^{}]+)\{/g)) {
    const selector = match[1].trim()
    if (selector.startsWith('@media')) continue
    for (const part of selector.split(/,(?![^()]*\))/))
      expect(part.trim()).toMatch(/^\[data-folio\] \.fa-drill/)
  }
})

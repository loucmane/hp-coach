import { readFileSync } from 'node:fs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
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
  coreMounts: new Set<unknown>(),
}))
vi.mock('./drillCore', async (original) => {
  const core = await original<typeof import('./drillCore')>()
  return {
    ...core,
    useDrillCore: (options: Parameters<typeof core.useDrillCore>[0]) => {
      const result = core.useDrillCore(options)
      h.coreMounts.add(result.act.select)
      return result
    },
  }
})
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
import { FolioShell } from '@/folio/FolioShell'
import { endedSessionIdsThisTab } from '@/lib/endedSessions'
import { useUiStore } from '@/stores/uiStore'
import { formatViolations, runAxe } from '@/test/a11y'

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
  // History traversals are asynchronous in jsdom. Keep one completed test's
  // marker consumption from opening the next mounted session's leave sheet.
  vi.spyOn(window.history, 'back').mockImplementation(() => {})
  window.history.replaceState(null, '')
  endedSessionIdsThisTab.clear()
  h.active = null
  h.phone = false
  h.coreMounts.clear()
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

const note =
  'Den här texten och frågorna är skapade för övning av HP-Coach. De kommer inte från ett tidigare högskoleprov. Personer, citat och händelser kan vara påhittade.'
const body = ['Det första stycket beskriver frågan.', 'Det andra stycket innehåller belägget.']
function reading(section: 'LÄS' | 'ELF' = 'LÄS'): Question {
  return {
    ...fixture(11, section),
    qid: 'host-2022-verb1-LÄS-011',
    prompt: 'Vad menar författaren?',
    context: ['En titel', ...body].join('\n\n'),
  }
}
async function accessible(container: HTMLElement) {
  const violations = await runAxe(container)
  expect(violations, formatViolations(violations)).toEqual([])
}
beforeEach(() => {
  h.bank = [reading()]
  h.explanation = {
    solution_path: 'Läs andra styckets början.',
    technique: '',
    pitfall: null,
    distractors: [],
    steps: [
      {
        n: 1,
        title: 'Hitta belägget',
        text: 'Se "Det andra stycket innehåller belägget." i andra stycket.',
      },
    ],
  }
})

describe('Reading through SessionPlayer and the Folio host', () => {
  it.each([
    false,
    true,
  ])('keeps DTK rotation within a block and carries it into the viewer, phone=%s', async (phone) => {
    h.phone = phone
    h.bank = [29, 30, 31].map((n) => ({
      ...fixture(n, 'DTK'),
      figure: {
        src: n === 31 ? 'next.jpg' : 'plate.jpg',
        aspect_ratio: 0.7,
        kind: 'raster' as const,
      },
    }))
    mount()
    await questionReady()
    const plate = screen.getByTestId('rd-plate')
    const image = within(plate).getByRole('img')
    const rotate = within(plate).getByRole('button', { name: 'Rotera figur 90 grader' })
    for (const rotation of [90, 180, 270, 0, 90]) {
      fireEvent.click(rotate)
      expect(image.style.transform).toContain(`rotate(${rotation}deg)`)
      expect(Number.parseFloat(image.parentElement!.style.aspectRatio)).toBeCloseTo(
        rotation % 180 ? 1 / 0.7 : 0.7,
      )
    }
    fireEvent.click(screen.getByTestId('question-figure'))
    const dialog = screen.getByRole('dialog', { name: 'Förstorad figur' })
    const viewerImage = within(dialog).getByRole('img')
    expect(viewerImage.style.transform).toContain('rotate(90deg)')
    key('r')
    expect(viewerImage.style.transform).toContain('rotate(180deg)')
    for (const letter of ['a', 'b', 'c', 'd', 'e']) key(letter)
    key('Enter')
    expect(h.submit).not.toHaveBeenCalled()
    expect(screen.getByTestId('fa-lock')).toBeDisabled()
    key('Escape')
    key('a')
    key('Enter')
    key('Enter')
    expect(screen.getByTestId('rd-plate') === plate).toBe(true)
    expect(image.style.transform).toContain('rotate(90deg)')
    key('a')
    key('Enter')
    key('Enter')
    const nextImage = within(screen.getByTestId('rd-plate')).getByRole('img')
    expect(nextImage).toHaveAttribute('src', '/next.jpg')
    expect(nextImage.style.transform).toContain('rotate(0deg)')
    expect(Number.parseFloat(nextImage.parentElement!.style.aspectRatio)).toBeCloseTo(0.7)
    fireEvent.click(screen.getByTestId('question-figure'))
    expect(within(screen.getByRole('dialog')).getByRole('img').style.transform).toContain(
      'rotate(0deg)',
    )
  })

  it.each([false, true])('separates the verdict from the question, phone=%s', async (phone) => {
    h.phone = phone
    mount()
    await questionReady()
    const question = screen.getByRole('region', { name: 'Uppgift 1' })
    expect(question).toHaveFocus()
    expect(question.firstElementChild === screen.getByTestId('drill-prompt')).toBe(true)
    key('b')
    expect(question).toHaveFocus()
    key('Enter')
    const verdict = screen.getByTestId('fa-verdict')
    const prompt = screen.getByTestId('drill-prompt')
    const content = phone
      ? screen.getByTestId('rd-sheet').querySelector('.rd-sheet-body')
      : question
    expect(
      Array.from(content?.children ?? [])
        .slice(0, 4)
        .map((node) => node.className),
    ).toEqual(
      phone
        ? ['fa-verdict', 'fa-prompt', 'fa-opts', 'fa-facit']
        : ['fa-prompt', 'fa-opts', 'fa-verdict', 'fa-facit'],
    )
    expect(verdict).toHaveTextContent('Fel. Rätt svar är A.')
    expect(verdict).toHaveFocus()
    if (phone) expect(prompt).toHaveAttribute('data-after', 'true')
    else expect(prompt).not.toHaveAttribute('data-after')
  })
  it.each([
    false,
    true,
  ])('numbers body paragraphs, cites evidence and handles the sheet, phone=%s', async (phone) => {
    h.phone = phone
    const { container } = mount()
    await questionReady()
    expect(screen.getByRole('heading', { name: 'En titel' })).toBeInTheDocument()
    expect(screen.getByTestId('rd-para-1')).toHaveTextContent(body[0])
    expect(screen.queryByTestId('rd-para-3')).toBeNull()
    expect(screen.queryByTestId('rd-badge')).toBeNull()
    if (phone) expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'peek')
    await accessible(container)
    key('a')
    fireEvent.click(screen.getByTestId('fa-lock'))
    expect(screen.getByTestId('fa-verdict')).toHaveFocus()
    if (phone) {
      expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'full')
      expect(screen.getByTestId('rd-document')).toHaveAttribute('inert')
    }
    fireEvent.click(screen.getByRole('button', { name: 'Visa steg för steg' }))
    await accessible(container)
    const citedBefore = [1, 2].map((n) =>
      screen.getByTestId(`rd-para-${n}`).getAttribute('data-cited'),
    )
    expect(citedBefore).toEqual(['false', 'true'])
    expect(screen.getByTestId('rd-para-2')).toHaveAttribute('data-flash', 'false')
    fireEvent.click(screen.getByTestId('rd-cite-2'))
    expect(
      [1, 2].map((n) => screen.getByTestId(`rd-para-${n}`).getAttribute('data-cited')),
    ).toEqual(citedBefore)
    expect(screen.getByTestId('rd-para-2')).toHaveAttribute('data-flash', 'true')
    if (phone) {
      expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'peek')
      expect(screen.getByTestId('rd-document')).not.toHaveAttribute('inert')
      await accessible(container)
      fireEvent.click(screen.getByRole('button', { name: 'Tillbaka till facit' }))
      expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'full')
      expect(screen.getByTestId('fa-verdict')).toHaveFocus()
    }
  })
  it('keeps focus on the grab handle when toggling full and open feedback', async () => {
    h.phone = true
    mount()
    await questionReady()
    key('a')
    key('Enter')
    const handle = screen.getByRole('button', { name: 'Visa mindre facit' })
    handle.focus()
    fireEvent.click(handle)
    expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'open')
    expect(handle).toHaveFocus()
    fireEvent.click(handle)
    expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'full')
    expect(handle).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Visa texten' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tillbaka till facit' }))
    expect(screen.getByTestId('fa-verdict')).toHaveFocus()
  })
  it('shows only synthetic disclosure and toggles its verbatim note', async () => {
    h.bank = [{ ...reading(), qid: 'p5-las-b19-002-r1-LÄS-001' }]
    const { container } = mount()
    await questionReady()
    expect(screen.getByTestId('rd-badge')).toHaveTextContent('Övningstext')
    expect(screen.getByTestId('rd-note')).not.toBeVisible()
    fireEvent.click(screen.getByTestId('rd-note-toggle'))
    expect(screen.getByTestId('rd-note')).toHaveTextContent(note)
    expect(screen.getByTestId('rd-note')).toBeVisible()
    await accessible(container)
    fireEvent.click(screen.getByTestId('rd-note-toggle'))
    expect(screen.getByTestId('rd-note')).not.toBeVisible()
  })
  it('uses English only for ELF content and fills authentic gaps across a block', async () => {
    const context =
      'Read the text and choose the best alternative for each gap.\n\nA title\n\nWe 31_____ the account.\n\nThey 32 the result. Around the age of 40.'
    h.bank = [31, 32].map((n) => ({
      ...fixture(n, 'ELF'),
      qid: `host-2013-verb2-ELF-0${n}`,
      number: n,
      prompt: '',
      context,
      options: [
        { letter: 'A', text: 'read' },
        { letter: 'B', text: 'wrote' },
      ],
    }))
    h.explanation = {
      solution_path: 'Choose the verb.',
      technique: 'Read the sentence.',
      pitfall: null,
      distractors: [],
    }
    const { container } = mount()
    await questionReady()
    expect(screen.getByTestId('drill-prompt')).toHaveTextContent('Lucka 31')
    expect(screen.getByTestId('drill-prompt')).toHaveAttribute('lang', 'en')
    expect(screen.getByText('Lucka 31')).toHaveAttribute('lang', 'sv')
    expect(screen.getByRole('article')).toHaveAttribute('lang', 'en')
    expect(
      screen.getByText('Read the text and choose the best alternative for each gap.'),
    ).toHaveAttribute('lang', 'en')
    expect(
      within(screen.getByTestId('option-A')).getByText('read').closest('[lang]'),
    ).toHaveAttribute('lang', 'en')
    expect(screen.getByTestId('fa-lock').closest('[lang]')).toHaveAttribute('lang', 'sv')
    expect(container.querySelector('[data-gap="40"]')).toBeNull()
    key('b')
    key('Enter')
    expect(container.querySelector('[data-gap="31"] s')).toHaveTextContent('wrote')
    expect(screen.getByText('Choose the verb.').closest('[lang]')).toHaveAttribute('lang', 'en')
    await accessible(container)
    key('Enter')
    expect(screen.getByTestId('drill-prompt')).toHaveTextContent('Lucka 32')
    expect(container.querySelector('[data-gap="31"] s')).toHaveTextContent('wrote')
    expect(container.querySelector('[data-gap="32"]')).toHaveAttribute('data-state', 'current')
    await accessible(container)
  })
  it.each([
    false,
    true,
  ])('retains one DTK plate, pauses keys for the viewer and restores focus, phone=%s', async (phone) => {
    h.phone = phone
    h.bank = [29, 30, 31].map((n) => ({
      ...fixture(n, 'DTK'),
      figure: { src: 'figures/dtk/plate.jpg', aspect_ratio: 0.7, kind: 'raster' as const },
    }))
    const { container } = mount()
    await questionReady()
    const plate = screen.getByTestId('rd-plate')
    expect(screen.getByText('Första av tre frågor till figuren')).toBeInTheDocument()
    expect(plate).toHaveTextContent('uppgifterna 29–31')
    fireEvent.click(screen.getByTestId('question-figure'))
    const dialog = screen.getByRole('dialog', { name: 'Förstorad figur' })
    expect(dialog.closest('.fa-drill')).not.toBeNull()
    for (const letter of ['a', 'b', 'c', 'd', 'e']) key(letter)
    key('Enter')
    expect(h.submit).not.toHaveBeenCalled()
    expect(screen.getByTestId('fa-lock')).toBeDisabled()
    await accessible(container)
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Förstorad figur' })).toBeNull()
    expect(screen.getByRole('region', { name: 'Uppgift 1' })).toHaveFocus()
    for (const cue of ['Andra', 'Tredje']) {
      key('a')
      key('Enter')
      await accessible(container)
      if (phone) fireEvent.click(screen.getByRole('button', { name: 'Visa texten' }))
      fireEvent.click(screen.getByTestId('question-figure'))
      key('Enter')
      fireEvent.keyDown(screen.getByRole('dialog', { name: 'Förstorad figur' }), { key: 'Escape' })
      expect(screen.getByTestId('fa-verdict')).toHaveFocus()
      if (phone) expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'full')
      key('Enter')
      expect(screen.getByTestId('rd-plate') === plate).toBe(true)
      expect(screen.getByText(`${cue} av tre frågor till figuren`)).toBeInTheDocument()
    }
    expect(h.submit).toHaveBeenCalledTimes(2)
    expect(h.coreMounts.size).toBe(1)
    await accessible(container)
  })
})

function readingRule(selector: string) {
  const css = readFileSync('src/folio/screens/drill/reading.css', 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  )
  return (
    [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find((match) => match[1].trim() === selector)?.[2] ??
    ''
  )
}

it('separates the desktop facit and phone verdict with explicit spacing', () => {
  expect(readingRule('[data-folio] .fa-drill .rd-question > .fa-verdict')).toMatch(
    /margin-top:\s*var\(--fa-s8\)/,
  )
  const phoneVerdict = readingRule('[data-folio] .fa-drill .rd-sheet .fa-verdict')
  expect(phoneVerdict).toMatch(/display:\s*block/)
  expect(phoneVerdict).toMatch(/margin-bottom:\s*var\(--fa-s6\)/)
})

it('suppresses only the programmatic question frame and retains control focus rings', () => {
  expect(readingRule("[data-folio] .fa-drill.rd-drill .rd-question[tabindex='-1']:focus")).toMatch(
    /outline:\s*none/,
  )
  expect(readingRule('[data-folio] .fa-drill.rd-drill :focus-visible')).toMatch(
    /outline:\s*2px solid var\(--fa-focus\)/,
  )
})

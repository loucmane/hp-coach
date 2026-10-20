import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import {
  describeDirectionContract,
  reveal,
  stubLayout,
} from '@/components/devbake/redesign/contract'
import { DirectionDataProvider, FIXTURE_DATA } from '@/components/devbake/redesign/directionData'
import {
  Redesign2026Bakeoff,
  type Selection,
} from '@/components/devbake/redesign/Redesign2026Bakeoff'
import type { DirectionProps } from '@/components/devbake/redesign/r1Kit'
import type { DirectionActions, DirectionData } from '@/components/devbake/redesign/viewModel'
import { Lager } from './Lager'
import { meta } from './meta'

describeDirectionContract(meta, Lager)

function mount(
  s: DirectionProps['screen'],
  data = structuredClone(FIXTURE_DATA),
  actions: Partial<DirectionActions> = {},
  width: DirectionProps['width'] = 'desktop',
) {
  const onScreen = vi.fn()
  return {
    ...render(
      <DirectionDataProvider data={data} actions={actions}>
        <Lager screen={s} width={width} theme="light" live onScreen={onScreen} onTheme={vi.fn()} />
      </DirectionDataProvider>,
    ),
    onScreen,
  }
}

function oneQuestion(kind: 'reading' | 'quant' | 'dtk' | 'elf'): DirectionData {
  const data = structuredClone(FIXTURE_DATA)
  data.drills[kind].questions = [data.drills[kind].questions[0]]
  data.drills[kind].start = { index: 0, results: [] }
  return data
}

function BakeoffHost({ initialScreen = 9 }: { initialScreen?: Selection['s'] }) {
  const [sel, setSel] = useState<Selection>({
    d: 'd',
    s: initialScreen,
    w: 'desktop',
    t: 'light',
    sbs: false,
    bare: false,
  })
  return (
    <>
      <Redesign2026Bakeoff sel={sel} onSelect={(next) => setSel((old) => ({ ...old, ...next }))} />
      <output data-testid="host-selection">{`${sel.d}/${sel.s}/${sel.sbs}`}</output>
    </>
  )
}

function TickingPass({ submitProvpass }: Pick<DirectionActions, 'submitProvpass'>) {
  const [remaining, setRemaining] = useState(4)
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining((left) => Math.max(0, left - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const data = structuredClone(FIXTURE_DATA)
  data.provpass.running.remainingSeconds = remaining
  return (
    <DirectionDataProvider data={data} actions={{ submitProvpass }}>
      <Lager screen={9} width="desktop" theme="light" live onScreen={vi.fn()} onTheme={vi.fn()} />
    </DirectionDataProvider>
  )
}

describe('Lager: data boundary and practice states', () => {
  beforeAll(() => {
    stubLayout()
    // jsdom has no browser top layer. These stubs cover lifecycle only;
    // the host browser pass must verify modal focus trapping and inertness.
    HTMLDialogElement.prototype.showModal ??= function () {
      this.setAttribute('open', '')
    }
    HTMLDialogElement.prototype.close ??= function () {
      this.removeAttribute('open')
    }
  })

  it('renders supplied lesson content and waits for provider read state', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.uppslag.open = {
      id: 'own-trap',
      section: 'KVA',
      family: 'kva_traps',
      title: 'Ett eget mönster',
      entry: {
        id: 'own-trap',
        pattern_description: 'Ett eget mönster',
        why_it_occurs: 'Varför det händer',
        common_distractor_signature: 'Fällans tecken',
        countermeasure: 'Pröva båda fallen',
        example_questions: [],
        worked_example: {
          setup: 'Anta x = 2',
          trap_thinking: 'Ett fall räcker',
          correct_thinking: 'Pröva även x = 0',
          answer: 'D',
        },
      },
      read: false,
      practice: { questions: 0 },
    }
    const toggleLessonRead = vi.fn()
    mount(12, data, { toggleLessonRead })
    expect(screen.getByTestId('rd-lesson')).toHaveTextContent('Pröva även x = 0')
    expect(screen.getByTestId('rd-lesson-practice')).toBeDisabled()
    fireEvent.click(screen.getByTestId('rd-lesson-read'))
    expect(toggleLessonRead).toHaveBeenCalledWith('own-trap')
    expect(screen.getByTestId('rd-lesson-read')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByText('Sparat')).toBeNull()
  })

  it('keeps an empty reference directory usable and preserves the supplied article', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.uppslag.sections = []
    mount(12, data, {}, 'phone')
    expect(screen.getByText('Inget innehåll här ännu.')).toBeInTheDocument()
    expect(screen.getByTestId('rd-lesson')).toHaveTextContent(data.uppslag.open.title)
    expect(screen.getByTestId('rd-nav-ova')).toBeInTheDocument()
  })

  it.each([
    {
      entry: {
        id: 'tactic',
        tactic: 'Läs skalan',
        when_to_apply: 'När axeln byter enhet',
        example_questions: [],
      },
      text: 'När axeln byter enhet',
    },
    {
      entry: {
        id: 'constraint',
        constraint_type: 'Motsats',
        rule: 'Följ sambandsordet',
        example_questions: [],
      },
      text: 'Följ sambandsordet',
    },
    {
      entry: {
        id: 'root',
        root: 'bio',
        origin: 'grekiska',
        meaning: 'liv',
        example_words: ['biologi'],
        example_questions: [],
      },
      text: 'biologi',
    },
  ])('renders the supplied lesson family: $entry.id', ({ entry, text }) => {
    const data = structuredClone(FIXTURE_DATA)
    data.uppslag.open.entry = entry
    mount(12, data)
    expect(screen.getByTestId('rd-lesson')).toHaveTextContent(text)
  })

  it('renders a confirmed read state and focuses only a changed lesson', () => {
    const data = structuredClone(FIXTURE_DATA)
    const subject = (next: DirectionData) => (
      <DirectionDataProvider data={next}>
        <Lager screen={12} width="phone" theme="light" live onScreen={vi.fn()} onTheme={vi.fn()} />
      </DirectionDataProvider>
    )
    const { rerender } = render(subject(data))
    const read = screen.getByTestId('rd-lesson-read')
    read.focus()
    const updated = structuredClone(data)
    updated.uppslag.open.read = true
    rerender(subject(updated))
    expect(read).toHaveAttribute('aria-pressed', 'true')
    expect(read).toHaveFocus()
    updated.uppslag.open = {
      ...updated.uppslag.open,
      id: 'another-entry',
      title: 'En annan lektion',
    }
    rerender(subject(updated))
    expect(screen.getByRole('heading', { name: 'En annan lektion' })).toHaveFocus()
  })

  it('keeps optional account information absent and validates editable minutes against the real bounds', () => {
    const data = structuredClone(FIXTURE_DATA)
    delete data.konto.identity.plan
    for (const options of Object.values(data.konto.options))
      for (const option of options) delete option.blurb
    const setPrefs = vi.fn()
    const signOut = vi.fn()
    mount(13, data, { setPrefs, signOut }, 'phone')
    expect(screen.getByTestId('rd-konto-identity')).not.toHaveTextContent(/undefined|Plus/)
    const minutes = screen.getByLabelText('Daglig studietid (minuter)')
    fireEvent.change(minutes, { target: { value: '' } })
    expect(minutes).toHaveValue(null)
    fireEvent.change(minutes, { target: { value: '42' } })
    fireEvent.blur(minutes)
    expect(setPrefs).toHaveBeenCalledWith({ dailyMinutes: 42 })
    setPrefs.mockClear()
    fireEvent.change(minutes, { target: { value: '4' } })
    fireEvent.blur(minutes)
    expect(setPrefs).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent('Välj mellan 5 och 240 minuter.')
    fireEvent.click(screen.getByTestId('rd-konto-signout'))
    expect(signOut).toHaveBeenCalledOnce()
  })

  it('restores account launcher focus on Escape', () => {
    mount(12)
    fireEvent.click(screen.getByTestId('rd-account'))
    screen.getByRole('button', { name: 'Konto' }).focus()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('rd-account-menu')).toBeNull()
    expect(screen.getByTestId('rd-account')).toHaveFocus()
  })

  it('requires exact typed deletion confirmation and offers export first', () => {
    const deleteAccount = vi.fn()
    const exportData = vi.fn()
    mount(13, undefined, { deleteAccount, exportData })
    fireEvent.click(screen.getByTestId('rd-konto-delete'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    const confirm = screen.getByTestId('rd-konto-delete-confirm')
    expect(confirm).toBeDisabled()
    fireEvent.click(confirm)
    expect(deleteAccount).not.toHaveBeenCalled()
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Exportera mina data' }),
    )
    expect(exportData).toHaveBeenCalledOnce()
    fireEvent.change(screen.getByLabelText('Skriv radera för att bekräfta'), {
      target: { value: 'RADERA' },
    })
    expect(confirm).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Skriv radera för att bekräfta'), {
      target: { value: 'radera' },
    })
    fireEvent.click(confirm)
    expect(deleteAccount).toHaveBeenCalledOnce()
    expect(screen.queryByText('Kontot är raderat')).toBeNull()
  })

  it.each([
    'desktop',
    'phone',
  ] as const)('shows authentic ELF provenance and language boundaries on %s', (width) => {
    const data = oneQuestion('elf')
    const q = data.drills.elf.questions[0]
    q.source = { ...q.source, authentic: true, label: 'Hösten 2025 · Provpass 2' }
    if (q.passage) {
      q.passage.synthetic = false
      delete q.passage.title
    }
    mount(14, data, {}, width)
    expect(screen.queryByTestId('rd-badge')).toBeNull()
    expect(screen.getByText(q.source.label)).toBeInTheDocument()
    expect(screen.getByTestId('rd-elf-passage').closest('[lang]')).toHaveAttribute('lang', 'en')
    expect(screen.getByRole('heading', { name: q.prompt! })).toHaveAttribute('lang', 'en')
    reveal('rd-option-A')
    expect(screen.getByTestId('rd-option-A').querySelector('[lang="en"]')).toHaveTextContent(
      q.options![0].text,
    )
  })

  it('blocks ELF grading without its passage through pointer, Enter and Space', () => {
    const data = oneQuestion('elf')
    data.drills.elf.questions[0].passage = null
    const lock = vi.fn(() => ({ correct: true }))
    mount(14, data, { drill: { lock } })
    expect(screen.getByText('Texten kunde inte hämtas.')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-option-A'))
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.keyDown(window, { key: 'Enter' })
    fireEvent.keyDown(window, { key: ' ' })
    expect(lock).not.toHaveBeenCalled()
  })

  it('keeps ELF feedback on screen 14 and exits through its controller', () => {
    const data = oneQuestion('elf')
    const lock = vi.fn(() => ({ correct: false }))
    const exit = vi.fn()
    const { onScreen } = mount(14, data, { drill: { lock, exit } })
    fireEvent.keyDown(window, { key: 'a' })
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
    expect(onScreen).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(exit).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(exit).toHaveBeenCalledOnce()
    expect(onScreen).not.toHaveBeenCalled()
  })

  it('keeps required ELF images gated across loading, failure, retry and a new source', () => {
    const data = oneQuestion('elf')
    const first = data.drills.elf.questions[0]
    first.figure = {
      src: 'elf-first.png',
      alt: 'Source diagram',
      width: 200,
      height: 100,
      kind: 'raster',
    }
    first.options![0].figure = {
      src: 'elf-option.png',
      alt: 'Option image',
      width: 100,
      height: 100,
    }
    data.drills.elf.questions.push({
      ...structuredClone(first),
      qid: 'elf-next',
      figure: { ...first.figure, src: 'elf-next.png' },
    })
    const lock = vi.fn(() => ({ correct: true }))
    mount(14, data, { drill: { lock } })
    fireEvent.click(screen.getByTestId('rd-option-A'))
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.load(screen.getByAltText('Source diagram'))
    fireEvent.error(screen.getByAltText('Option image'))
    fireEvent.keyDown(window, { key: 'Enter' })
    fireEvent.keyDown(window, { key: ' ' })
    expect(lock).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Försök hämta alternativ A igen' }))
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.load(screen.getByAltText('Option image'))
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
    fireEvent.click(screen.getByTestId('rd-lock'))
    fireEvent.click(screen.getByTestId('rd-next'))
    fireEvent.click(screen.getByTestId('rd-option-A'))
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(lock).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.load(screen.getByAltText('Source diagram'))
    fireEvent.load(screen.getByAltText('Option image'))
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
  })

  it('accepts cached images and retains the same mounted passage figure across ELF questions', () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
    const naturalWidth = vi
      .spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get')
      .mockReturnValue(100)
    try {
      const data = oneQuestion('elf')
      const first = data.drills.elf.questions[0]
      first.figure = {
        src: 'shared.png',
        alt: 'Shared figure',
        width: 100,
        height: 100,
        kind: 'raster',
      }
      data.drills.elf.questions.push({ ...first, qid: 'next-shared' })
      mount(14, data)
      const image = screen.getByAltText('Shared figure')
      fireEvent.click(screen.getByTestId('rd-option-A'))
      expect(screen.getByTestId('rd-lock')).toBeEnabled()
      fireEvent.click(screen.getByTestId('rd-lock'))
      fireEvent.click(screen.getByTestId('rd-next'))
      expect(screen.getByAltText('Shared figure')).toBe(image)
      fireEvent.click(screen.getByTestId('rd-option-B'))
      expect(screen.getByTestId('rd-lock')).toBeEnabled()
    } finally {
      complete.mockRestore()
      naturalWidth.mockRestore()
    }
  })

  it('handles a shrinking ELF deck and resets for a new sitting', () => {
    const data = structuredClone(FIXTURE_DATA)
    const first = data.drills.elf.questions[0]
    data.drills.elf.questions = [
      first,
      { ...first, qid: 'elf-two' },
      { ...first, qid: 'elf-three' },
    ]
    data.drills.elf.start = { index: data.drills.elf.questions.length - 1 }
    const subject = (next: DirectionData) => (
      <DirectionDataProvider data={next}>
        <Lager
          screen={14}
          width="desktop"
          theme="light"
          live
          onScreen={vi.fn()}
          onTheme={vi.fn()}
        />
      </DirectionDataProvider>
    )
    const { rerender } = render(subject(data))
    fireEvent.click(screen.getByTestId('rd-option-A'))
    const smaller = structuredClone(data)
    smaller.drills.elf.questions = [smaller.drills.elf.questions[0]]
    rerender(subject(smaller))
    expect(
      screen.getByRole('heading', { name: smaller.drills.elf.questions[0].prompt! }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.click(screen.getByTestId('rd-option-B'))
    rerender(
      subject({
        ...smaller,
        drills: { ...smaller.drills, elf: { ...smaller.drills.elf, id: 'new-sitting' } },
      }),
    )
    expect(screen.getByTestId('rd-option-B')).toHaveAttribute('aria-pressed', 'false')
  })

  it('labels cloze gaps without changing ordinary numbers and labels exact English quotes in feedback', () => {
    const data = oneQuestion('elf')
    const q = data.drills.elf.questions[0]
    q.prompt = ''
    q.number = 32
    q.passage!.paragraphs = [
      'At age 40, they found 31_____ pots. They counted 32_____ more. They kept 33_____ pieces.',
    ]
    data.drills.elf.explanations[q.qid] = {
      ...data.drills.elf.explanations[q.qid]!,
      solution_path: 'Texten säger ”They counted 32_____ more.” Det är belägget.',
    }
    mount(14, data)
    expect(screen.getByRole('heading', { name: 'Lucka 32' })).toHaveAttribute('lang', 'sv')
    const passage = screen.getByTestId('rd-elf-passage')
    expect(passage).toHaveTextContent('At age 40')
    expect(passage.querySelectorAll('.la-cloze-gap')).toHaveLength(3)
    expect(passage.querySelector('[data-active="true"]')).toHaveTextContent('32_____')
    fireEvent.click(screen.getByTestId('rd-option-A'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(screen.getByText('”They counted 32_____ more.”')).toHaveAttribute('lang', 'en')
    expect(screen.getByRole('heading', { name: 'Lösningen' }).closest('[lang]')).toHaveAttribute(
      'lang',
      'sv',
    )
  })

  it('routes account return, lookup and ELF through the real host and contains reading scroll keys', async () => {
    const width = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1440)
    const height = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(900)
    try {
      render(<BakeoffHost initialScreen={5} />)
      await screen.findByTestId('rd-lager')
      fireEvent.click(screen.getByTestId('rd-account'))
      fireEvent.click(screen.getByRole('button', { name: 'Inställningar' }))
      expect(screen.getByTestId('host-selection')).toHaveTextContent('d/13/false')
      expect(screen.getByRole('heading', { name: 'Inställningar' })).toHaveFocus()
      fireEvent.click(screen.getByRole('button', { name: 'Tillbaka' }))
      expect(screen.getByTestId('host-selection')).toHaveTextContent('d/5/false')
      fireEvent.click(screen.getByTestId('rd-nav-uppslag'))
      expect(screen.getByTestId('rd-lesson')).toBeInTheDocument()
      fireEvent.click(screen.getByTestId('rd-nav-ova'))
      fireEvent.click(screen.getByTestId('rd-ova-section-elf'))
      expect(screen.getByTestId('host-selection')).toHaveTextContent('d/14/false')
      const passage = screen.getByTestId('rd-elf-passage').closest('article')!
      fireEvent.keyDown(passage, { key: 'ArrowRight' })
      expect(screen.getByTestId('host-selection')).toHaveTextContent('d/14/false')
      fireEvent.keyDown(window, { key: 'a' })
      fireEvent.keyDown(window, { key: 'Enter' })
      expect(screen.getByTestId('rd-verdict')).toHaveFocus()
      expect(screen.getByTestId('host-selection')).toHaveTextContent('d/14/false')
      fireEvent.click(screen.getByTestId('rd-exit'))
      expect(screen.getByTestId('host-selection')).toHaveTextContent('d/5/false')
      fireEvent.keyDown(window, { key: '3' })
      expect(screen.getByTestId('host-selection')).toHaveTextContent('c/5/false')
    } finally {
      width.mockRestore()
      height.mockRestore()
    }
  })

  it('reads changed Home data and omits every unavailable optional projection', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.home.today.greeting = 'En egen hälsning'
    if (data.home.resume) {
      delete data.home.resume.pausedAt
      delete data.home.resume.device
      delete data.home.resume.minutesLeft
    }
    data.home.prognosis = { total: null, verbal: null, quant: null, caveat: null }
    data.home.week = { minutesToday: null }
    mount(1, data)
    expect(screen.getByRole('heading', { name: 'En egen hälsning.' })).toBeInTheDocument()
    expect(screen.queryByText(/Pausad/)).toBeNull()
    expect(screen.getByTestId('rd-lager')).not.toHaveTextContent(
      /undefined|NaN|min kvar|veckans mål/,
    )
    expect(document.querySelector('.la-range')).toBeNull()
  })

  it('opens an actual plan item through the host action and handles Home without a resume', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.home.resume = null
    const openPlanItem = vi.fn()
    mount(1, data, { openPlanItem })
    expect(screen.queryByTestId('rd-resume')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: new RegExp(data.home.plan.items[0].title) }))
    expect(openPlanItem).toHaveBeenCalledWith(data.home.plan.items[0].id)
  })

  it('separates the due count from the pile and offers mixed practice on a cold start', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.home.resume = null
    data.ova.weakest = null
    data.ova.repetera = { dueNow: 3, pile: 7 }
    const startDrill = vi.fn()
    mount(5, data, { startDrill })
    expect(screen.getByTestId('rd-ova-repetera')).toHaveTextContent('3 redo nu · 7 i dagens hög')
    expect(screen.queryByText(/svagast just nu/)).toBeNull()
    expect(screen.getAllByTestId('rd-ova-mixed')).toHaveLength(1)
    fireEvent.click(screen.getByTestId('rd-ova-mixed'))
    expect(startDrill).toHaveBeenCalledWith({ kind: 'mixed' })
  })

  it('keeps an empty repetition queue navigable without an empty start', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.repetera = { ...data.repetera, dueNow: 0, pile: 7, items: [] }
    const go = vi.fn()
    mount(8, data, { go }, 'phone')
    expect(screen.getByRole('heading', { name: 'Inget att repetera just nu.' })).toBeInTheDocument()
    expect(screen.getByText('Resten av dagens hög blir redo senare.')).toBeInTheDocument()
    expect(screen.queryByTestId('rd-repetera-start')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Öva istället' }))
    expect(go).toHaveBeenCalledWith('ova')
    expect(screen.getByTestId('rd-account')).toBeInTheDocument()
  })

  it('shows due items before later ones without reordering within each group, and caps the batch', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.repetera.dueNow = 14
    data.repetera.sessionSize = 14
    const [a, b, c] = data.repetera.items
    data.repetera.items = [
      { ...a, n: 1, dueNow: false },
      { ...b, n: 2, dueNow: true },
      { ...c, n: 3, dueNow: true },
    ]
    mount(8, data)
    expect(screen.getByTestId('rd-repetera-start')).toHaveTextContent('Repetera 10')
    expect(screen.getAllByTestId(/rd-repetera-item/).map((el) => el.dataset.testid)).toEqual([
      'rd-repetera-item-2',
      'rd-repetera-item-3',
      'rd-repetera-item-1',
    ])
  })

  it('migrates the reading prompt, passage, clock and grading to the supplied session', () => {
    const data = oneQuestion('reading')
    const q = data.drills.reading.questions[0]
    q.prompt = 'Vilket resonemang stöds av den nya texten?'
    if (q.passage) q.passage.paragraphs = ['Det här är den tillförda texten.']
    data.drills.reading.elapsedSeconds = undefined
    data.drills.reading.explanations[q.qid] = null
    // The controller, rather than a local answer comparison, owns the verdict.
    const lock = vi.fn(() => ({ correct: false }))
    mount(2, data, { drill: { lock } })
    expect(screen.getByTestId('rd-passage')).toHaveTextContent('Det här är den tillförda texten.')
    expect(screen.getByRole('heading', { name: q.prompt })).toBeInTheDocument()
    expect(screen.queryByRole('timer')).toBeNull()
    fireEvent.click(screen.getByTestId(`rd-option-${q.answer}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(lock).toHaveBeenCalledWith(q, q.answer)
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
    expect(screen.getByText('Förklaringen kunde inte hämtas.')).toBeInTheDocument()
  })

  it('keeps Escape and switcher digits out of exit, selects A–E, and advances only once', () => {
    const data = oneQuestion('quant')
    const lock = vi.fn(() => ({ correct: true }))
    const exit = vi.fn()
    const next = vi.fn()
    mount(6, data, { drill: { lock, exit, next } }, 'phone')
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.keyDown(window, { key: '1' })
    expect(exit).not.toHaveBeenCalled()
    expect(lock).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'A', shiftKey: true })
    expect(screen.getByTestId('rd-eliminate-A')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.keyDown(window, { key: 'b' })
    expect(screen.getByTestId('rd-quant-option-B')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(lock).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(window, { key: ' ' })
    expect(next).toHaveBeenCalledWith(null)
    expect(screen.getByTestId('rd-done')).toHaveTextContent('1 besvarade · 1 rätt')
    expect(screen.getByTestId('rd-done')).not.toHaveTextContent(/sparad|Kön är tom/)
  })

  it('preserves malformed KVA content and safely returns from an empty session', () => {
    const data = oneQuestion('quant')
    data.drills.quant.questions[0].section = 'KVA'
    data.drills.quant.questions[0].prompt = 'Kvantitet I: bara en kvantitet finns här'
    const { unmount } = mount(6, data)
    expect(screen.getByTestId('rd-quant-prompt')).toHaveTextContent(
      data.drills.quant.questions[0].prompt,
    )
    unmount()
    data.drills.quant.questions = []
    mount(6, data)
    expect(screen.getByRole('heading', { name: 'Ingen fråga att visa' })).toBeInTheDocument()
    expect(screen.getByTestId('rd-exit')).toBeInTheDocument()
  })

  it('blocks both pointer and keyboard grading after a required figure fails, then recovers', () => {
    const data = oneQuestion('dtk')
    const lock = vi.fn(() => ({ correct: true }))
    mount(7, data, { drill: { lock } })
    fireEvent.click(reveal('rd-quant-option-A'))
    fireEvent.error(within(screen.getByTestId('rd-figure')).getByRole('img'))
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.click(screen.getByTestId('rd-lock'))
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(lock).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Försök hämta figuren igen' }))
    fireEvent.load(within(screen.getByTestId('rd-figure')).getByRole('img'))
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(lock).toHaveBeenCalledTimes(1)
  })

  it.each([
    'main',
    'option',
  ] as const)('waits for every %s image and stays blocked during retries', (kind) => {
    const data = oneQuestion('dtk')
    const q = data.drills.dtk.questions[0]
    if (kind === 'option' && q.options)
      q.options[0].figure = {
        src: 'test-option.svg',
        alt: 'Alternativets figur',
        width: 80,
        height: 80,
      }
    const lock = vi.fn(() => ({ correct: true }))
    mount(7, data, { drill: { lock } })
    fireEvent.click(reveal('rd-quant-option-A'))
    const main = within(screen.getByTestId('rd-figure')).getByRole('img')
    if (kind === 'option') fireEvent.load(main)
    const img = kind === 'main' ? main : screen.getByRole('img', { name: 'Alternativets figur' })
    for (const key of ['Enter', ' ']) fireEvent.keyDown(window, { key })
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(lock).not.toHaveBeenCalled()
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.error(img)
    fireEvent.click(
      screen.getByRole('button', {
        name: kind === 'main' ? 'Försök hämta figuren igen' : 'Försök hämta alternativ A igen',
      }),
    )
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(lock).not.toHaveBeenCalled()
    fireEvent.load(
      kind === 'main'
        ? within(screen.getByTestId('rd-figure')).getByRole('img')
        : screen.getByRole('img', { name: 'Alternativets figur' }),
    )
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
    fireEvent.keyDown(window, { key: ' ' })
    expect(lock).toHaveBeenCalledTimes(1)
  })

  it.each([true, false])('reconciles a cached main and option image (success=%s)', (success) => {
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
    const width = vi
      .spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get')
      .mockReturnValue(success ? 80 : 0)
    try {
      const data = oneQuestion('dtk')
      const q = data.drills.dtk.questions[0]
      if (q.options)
        q.options[0].figure = { src: 'cached.svg', alt: 'Cachad figur', width: 80, height: 80 }
      const lock = vi.fn(() => ({ correct: true }))
      mount(7, data, { drill: { lock } })
      fireEvent.click(reveal('rd-quant-option-A'))
      expect(screen.getByTestId('rd-lock').hasAttribute('disabled')).toBe(!success)
      fireEvent.keyDown(window, { key: 'Enter' })
      expect(lock).toHaveBeenCalledTimes(success ? 1 : 0)
    } finally {
      complete.mockRestore()
      width.mockRestore()
    }
  })

  it('waits for an option instance even when it shares the main figure URL', () => {
    const data = oneQuestion('dtk')
    const q = data.drills.dtk.questions[0]
    q.options![0].figure = { ...q.figure!, alt: 'Samma bild i alternativ A' }
    const lock = vi.fn(() => ({ correct: true }))
    mount(7, data, { drill: { lock } })
    fireEvent.click(reveal('rd-quant-option-A'))
    fireEvent.load(within(screen.getByTestId('rd-figure')).getByRole('img'))
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.load(screen.getByRole('img', { name: 'Samma bild i alternativ A' }))
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
  })

  it('contains viewer digits through the real bake-off host', async () => {
    const width = vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(1440)
    const height = vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(900)
    try {
      const onSelect = vi.fn()
      render(
        <Redesign2026Bakeoff
          sel={{ d: 'd', s: 7, w: 'desktop', t: 'light', sbs: false, bare: false }}
          onSelect={onSelect}
        />,
      )
      fireEvent.load(within(await screen.findByTestId('rd-figure')).getByRole('img'))
      fireEvent.click(screen.getByRole('button', { name: 'Förstora figur' }))
      const viewer = screen.getByRole('dialog', { name: 'Förstorad figur' })
      for (const key of ['1', '4', '8', 'ArrowRight'])
        fireEvent.keyDown(within(viewer).getByRole('region'), { key })
      expect(onSelect).not.toHaveBeenCalled()
      expect(within(viewer).getByRole('region')).toHaveAttribute('data-rd-keyscope')
      fireEvent.click(within(viewer).getByRole('button', { name: 'Stäng' }))
      fireEvent.keyDown(window, { key: '1' })
      expect(onSelect).toHaveBeenCalledWith({ d: 'a', sbs: false })
    } finally {
      width.mockRestore()
      height.mockRestore()
    }
  })

  it('does not start on a cancelled commitment and returns focus to the candidate', () => {
    const startProvpass = vi.fn()
    mount(9, undefined, { startProvpass })
    const start = screen.getByTestId('rd-prov-start')
    start.focus()
    fireEvent.click(start)
    expect(startProvpass).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Tillbaka' }))
    expect(startProvpass).not.toHaveBeenCalled()
    expect(start).toHaveFocus()
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
  })

  it.each([
    'answer',
    'grid',
    'heading',
    'body',
    'switcher',
  ])('keeps all switcher digits inside the running pass with focus on %s', async (target) => {
    const width = vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(1440)
    const height = vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(900)
    try {
      render(<BakeoffHost />)
      fireEvent.click(await screen.findByTestId('rd-prov-start'))
      fireEvent.click(screen.getByTestId('rd-confirm'))
      const runner = screen.getByTestId('rd-prov-running')
      const answer = screen.getByTestId('rd-prov-option-A')
      fireEvent.click(answer)
      const flag = screen.getByTestId('rd-prov-flag')
      fireEvent.click(flag)
      const flagged = flag.getAttribute('aria-pressed')
      const focused =
        target === 'answer'
          ? answer
          : target === 'grid'
            ? screen.getByTestId('rd-prov-cell-2')
            : target === 'heading'
              ? screen.getByRole('heading', { name: /^Fråga \d+ av/ })
              : target === 'switcher'
                ? within(screen.getByTestId('rb26-bar')).getAllByRole('button')[0]
                : document.body
      focused.focus()
      for (const key of ['3', '0', '1', '2', '4', '5', '6', '7', '8']) {
        expect(fireEvent.keyDown(focused, { key })).toBe(false)
        expect(screen.getByTestId('host-selection')).toHaveTextContent('d/9/false')
        expect(screen.getByTestId('rd-prov-running')).toBe(runner)
        expect(answer).toHaveAttribute('aria-pressed', 'true')
        expect(flag).toHaveAttribute('aria-pressed', flagged)
      }
      expect(runner).toHaveAttribute('data-rd-keyscope')
      fireEvent.click(screen.getByTestId('rd-exit'))
      fireEvent.click(screen.getByTestId('rd-confirm'))
      fireEvent.keyDown(window, { key: '3' })
      expect(screen.getByTestId('host-selection')).toHaveTextContent('c/9/false')
      fireEvent.keyDown(window, { key: '0' })
      expect(screen.getByTestId('host-selection')).toHaveTextContent('c/9/true')
    } finally {
      width.mockRestore()
      height.mockRestore()
    }
  })

  it.each([
    false,
    true,
  ])('settles once when a ticking provider reaches zero (failure=%s)', (fail) => {
    vi.useFakeTimers()
    try {
      const submitProvpass = vi.fn()
      if (fail)
        submitProvpass.mockImplementationOnce(() => {
          throw new Error('offline')
        })
      const { unmount } = render(<TickingPass submitProvpass={submitProvpass} />)
      act(() => vi.advanceTimersByTime(1500))
      fireEvent.click(screen.getByTestId('rd-prov-start'))
      fireEvent.click(screen.getByTestId('rd-confirm'))
      fireEvent.click(screen.getByTestId('rd-prov-option-A'))
      // Provider expires at 4 s, before the runner's local deadline at 4.5 s.
      for (let i = 0; i < 25; i++) act(() => vi.advanceTimersByTime(100))
      expect(submitProvpass).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('rd-prov-timer')).toHaveTextContent('0:00')
      expect(screen.getByTestId('rd-prov-option-A')).toBeDisabled()
      expect(screen.getByTestId('rd-prov-option-A')).toHaveAttribute('aria-pressed', 'true')
      act(() => vi.advanceTimersByTime(5000))
      expect(submitProvpass).toHaveBeenCalledTimes(1)
      expect(screen.queryByText('Tiden för provpasset har gått ut.')).toBeNull()
      if (fail) {
        fireEvent.click(screen.getByRole('button', { name: 'Försök lämna in igen' }))
        expect(submitProvpass).toHaveBeenCalledTimes(2)
      }
      expect(screen.getByText('Lämnar in…')).toBeInTheDocument()
      unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('clamps the current question when the same pass shrinks and retains that position on growth', () => {
    const data = structuredClone(FIXTURE_DATA)
    const view = (value: DirectionData) => (
      <DirectionDataProvider data={value}>
        <Lager screen={9} width="desktop" theme="light" live onScreen={vi.fn()} onTheme={vi.fn()} />
      </DirectionDataProvider>
    )
    const { rerender } = render(view(data))
    fireEvent.click(screen.getByTestId('rd-prov-start'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    fireEvent.click(screen.getByTestId('rd-prov-cell-5'))
    const smaller = structuredClone(data)
    smaller.provpass.running.questions = smaller.provpass.running.questions.slice(0, 2)
    smaller.provpass.running.grid = smaller.provpass.running.grid.slice(0, 2)
    rerender(view(smaller))
    expect(screen.getByRole('heading', { name: 'Fråga 2 av 2' })).toHaveFocus()
    expect(screen.getByTestId('rd-prov-cell-2')).toHaveAttribute('data-current', 'true')
    rerender(view(data))
    expect(screen.getByTestId('rd-prov-cell-2')).toHaveAttribute('data-current', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Föregående' }))
    expect(screen.getByTestId('rd-prov-cell-1')).toHaveAttribute('data-current', 'true')
  })

  it.each([
    false,
    true,
  ])('focuses the settlement heading after confirmation (failure=%s)', (fail) => {
    const submitProvpass = vi.fn(() => {
      if (fail) throw new Error('offline')
    })
    mount(9, undefined, { submitProvpass })
    fireEvent.click(screen.getByTestId('rd-prov-start'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    const submit = screen.getByTestId('rd-prov-submit')
    submit.focus()
    fireEvent.click(submit)
    const confirm = screen.getByTestId('rd-confirm')
    confirm.focus()
    fireEvent.click(confirm)
    expect(submit).toBeDisabled()
    expect(within(screen.getByRole('status')).getByRole('heading')).toHaveFocus()
  })

  it('focuses the result heading after hand-in through the real host', async () => {
    const width = vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(1440)
    const height = vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(900)
    try {
      render(<BakeoffHost />)
      fireEvent.click(await screen.findByTestId('rd-prov-start'))
      fireEvent.click(screen.getByTestId('rd-confirm'))
      fireEvent.click(screen.getByTestId('rd-prov-submit'))
      screen.getByTestId('rd-confirm').focus()
      fireEvent.click(screen.getByTestId('rd-confirm'))
      expect(screen.getByRole('heading', { name: 'Provpassresultat' })).toHaveFocus()
    } finally {
      width.mockRestore()
      height.mockRestore()
    }
  })

  it('offers labelled progress tabs with roving focus without changing the host screen', async () => {
    const width = vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(1440)
    const height = vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(900)
    try {
      render(<BakeoffHost initialScreen={11} />)
      const list = await screen.findByRole('tablist', { name: 'Visa framsteg' })
      const overview = within(list).getByRole('tab', { name: 'Översikt' })
      const history = within(list).getByRole('tab', { name: 'Historik' })
      const check = (active: HTMLElement, inactive: HTMLElement) => {
        expect(active).toHaveAttribute('aria-selected', 'true')
        expect(active).toHaveAttribute('tabindex', '0')
        expect(inactive).toHaveAttribute('aria-selected', 'false')
        expect(inactive).toHaveAttribute('tabindex', '-1')
        const panel = screen.getByRole('tabpanel', { name: active.textContent! })
        expect(panel.id).toBe(active.getAttribute('aria-controls'))
        expect(panel).toHaveAttribute('aria-labelledby', active.id)
        expect(screen.getByTestId('host-selection')).toHaveTextContent('d/11/false')
      }
      overview.focus()
      check(overview, history)
      for (const [key, active, inactive] of [
        ['ArrowRight', history, overview],
        ['ArrowRight', overview, history],
        ['ArrowLeft', history, overview],
        ['Home', overview, history],
        ['End', history, overview],
      ] as const) {
        fireEvent.keyDown(document.activeElement!, { key })
        check(active, inactive)
        expect(active).toHaveFocus()
      }
      fireEvent.click(overview)
      check(overview, history)
      fireEvent.click(history)
      check(history, overview)
    } finally {
      width.mockRestore()
      height.mockRestore()
    }
  })

  it('requests another selected pass without mislabelling the supplied running snapshot', () => {
    const startProvpass = vi.fn()
    mount(9, undefined, { startProvpass })
    fireEvent.click(screen.getByTestId('rd-prov-half-verbal'))
    fireEvent.click(screen.getByTestId('rd-prov-start'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(startProvpass).toHaveBeenCalledWith(expect.stringContaining('verb'))
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Väntar på provpasset' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tillbaka till provpassen' }))
    expect(screen.getByTestId('rd-prov-start')).toBeInTheDocument()
  })

  it('shows actual partial counts, empty halves and an absent optional flag', () => {
    const data = structuredClone(FIXTURE_DATA)
    const run = data.provpass.running
    data.provpass.hub.passes = data.provpass.hub.passes.filter((p) => p.id === run.passId)
    data.provpass.hub.passes[0].presented = 39
    delete run.flags
    mount(9, data)
    expect(screen.getByText('39 av 40 frågor tillgängliga.')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-prov-half-verbal'))
    expect(
      screen.getByRole('heading', { name: 'Inga provpass tillgängliga för det här valet' }),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('rd-prov-start')).toBeNull()
    fireEvent.click(screen.getByTestId('rd-prov-half-kvant'))
    fireEvent.click(screen.getByTestId('rd-prov-start'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(screen.queryByTestId('rd-prov-flag')).toBeNull()
    expect(screen.queryByTestId('rd-nav-idag')).toBeNull()
  })

  it.each([
    'desktop',
    'phone',
  ] as const)('changes answers without grading and preserves them across jumps on %s', (width) => {
    const data = structuredClone(FIXTURE_DATA)
    const run = data.provpass.running
    run.current = 0
    run.answers = {}
    const lock = vi.fn(() => ({ correct: true }))
    const submitProvpass = vi.fn()
    mount(9, data, { drill: { lock }, submitProvpass }, width)
    fireEvent.click(screen.getByTestId('rd-prov-start'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    fireEvent.keyDown(window, { key: 'a' })
    expect(screen.getByTestId('rd-prov-option-A')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.keyDown(window, { key: 'b' })
    expect(screen.getByTestId('rd-prov-option-B')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(screen.getByTestId('rd-prov-cell-2')).toHaveAttribute('data-current', 'true')
    fireEvent.click(screen.getByTestId('rd-prov-cell-1'))
    expect(screen.getByTestId('rd-prov-option-B')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('rd-prov-cell-1')).toHaveAttribute('data-answered', 'true')
    expect(lock).not.toHaveBeenCalled()
    expect(screen.queryByTestId('rd-verdict')).toBeNull()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    expect(screen.getByRole('dialog')).toHaveTextContent(
      `${run.questions.length - 1} av ${run.questions.length} frågor är obesvarade`,
    )
    expect(submitProvpass).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(submitProvpass).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Lämnar in…')).toBeInTheDocument()
    expect(screen.getByTestId('rd-prov-option-B')).toBeDisabled()
  })

  it('requires confirmation before aborting and keeps selections when that gate is cancelled', () => {
    mount(9)
    fireEvent.click(screen.getByTestId('rd-prov-start'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(screen.getByRole('dialog')).toHaveTextContent('ingen paus')
    fireEvent.click(screen.getByRole('button', { name: 'Tillbaka' }))
    expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-exit'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
    expect(screen.getByTestId('rd-nav-provpass')).toBeInTheDocument()
  })

  it('submits once on timeout, including while a confirmation is open', () => {
    vi.useFakeTimers()
    try {
      const data = structuredClone(FIXTURE_DATA)
      data.provpass.running.remainingSeconds = 2
      const submitProvpass = vi.fn()
      const { unmount } = mount(9, data, { submitProvpass })
      fireEvent.click(screen.getByTestId('rd-prov-start'))
      fireEvent.click(screen.getByTestId('rd-confirm'))
      fireEvent.click(screen.getByTestId('rd-exit'))
      act(() => vi.advanceTimersByTime(6000))
      expect(submitProvpass).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(screen.getByTestId('rd-prov-submit')).toBeDisabled()
      fireEvent.keyDown(window, { key: 'a' })
      act(() => vi.advanceTimersByTime(6000))
      expect(submitProvpass).toHaveBeenCalledTimes(1)
      unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('rejects a late answer when the timer callback was delayed', () => {
    vi.useFakeTimers()
    try {
      const data = structuredClone(FIXTURE_DATA)
      data.provpass.running.current = 0
      data.provpass.running.answers = {}
      data.provpass.running.remainingSeconds = 2
      const submitProvpass = vi.fn()
      const { unmount } = mount(9, data, { submitProvpass })
      fireEvent.click(screen.getByTestId('rd-prov-start'))
      fireEvent.click(screen.getByTestId('rd-confirm'))
      vi.setSystemTime(Date.now() + 3000)
      fireEvent.keyDown(window, { key: 'a' })
      expect(screen.getByTestId('rd-prov-option-A')).toHaveAttribute('aria-pressed', 'false')
      expect(submitProvpass).toHaveBeenCalledTimes(1)
      unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('preserves answers after a synchronous submission failure and retries deliberately', () => {
    const submitProvpass = vi.fn().mockImplementationOnce(() => {
      throw new Error('unavailable')
    })
    mount(9, undefined, { submitProvpass })
    fireEvent.click(screen.getByTestId('rd-prov-start'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    fireEvent.keyDown(window, { key: 'a' })
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(screen.getByTestId('rd-prov-option-A')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('rd-prov-option-A')).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Försök lämna in igen' }))
    expect(submitProvpass).toHaveBeenCalledTimes(2)
    expect(screen.getByText('Lämnar in…')).toBeInTheDocument()
  })

  it('does not invent a result for an already expired snapshot', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.provpass.running.remainingSeconds = 0
    const submitProvpass = vi.fn()
    mount(9, data, { submitProvpass })
    fireEvent.click(screen.getByTestId('rd-prov-start'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(
      screen.getByRole('heading', { name: 'Tiden för provpasset har gått ut.' }),
    ).toBeInTheDocument()
    expect(submitProvpass).not.toHaveBeenCalled()
  })

  it('renders English passage content without exposing an answer key in a running pass', () => {
    const data = structuredClone(FIXTURE_DATA)
    const run = data.provpass.running
    run.questions = [data.drills.elf.questions[0]]
    run.current = 0
    run.answers = {}
    mount(9, data)
    fireEvent.click(screen.getByTestId('rd-prov-start'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(screen.getByTestId('rd-prov-passage')).toHaveAttribute('lang', 'en')
    expect(screen.getByTestId('rd-prov-running').querySelector('[data-grade]')).toBeNull()
    expect(screen.queryByTestId('rd-verdict')).toBeNull()
  })

  it('keeps a zero result, missing norming and actual denominator honest', () => {
    const data = structuredClone(FIXTURE_DATA)
    const r = data.provpass.result
    r.correct = 0
    r.presented = 39
    r.answered = 37
    r.score.value = null
    r.trap = null
    r.history = []
    delete r.total
    r.sections.forEach((s) => {
      delete s.estimate
    })
    const go = vi.fn()
    mount(10, data, { go })
    expect(screen.getByTestId('rd-prov-result')).toHaveTextContent('0 av 39 rätt')
    expect(screen.getByTestId('rd-prov-result')).toHaveTextContent('1 fråga saknas')
    expect(screen.getByTestId('rd-prov-score')).toHaveTextContent('Ingen poäng tillgänglig.')
    expect(screen.getByText(/37 besvarade · 2 obesvarade/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Repetera missar' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Till Idag' }))
    expect(go).toHaveBeenCalledWith('idag')
  })

  it('routes comparable mock history through its actual result identifier', () => {
    const openProvResult = vi.fn()
    mount(10, undefined, { openProvResult })
    fireEvent.click(within(screen.getByTestId('rd-prov-history-item-1')).getByRole('button'))
    expect(openProvResult).toHaveBeenCalledWith(FIXTURE_DATA.provpass.result.history[0].id)
  })

  it('keeps weekly gaps, separates practice and mock history, and starts the evidenced focus', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.framsteg.weekly = [
      { weekStart: '2026-09-28', score: 1 },
      { weekStart: '2026-10-05', score: null },
      { weekStart: '2026-10-12', score: 1.4 },
    ]
    data.framsteg.focus = ['KVA']
    const startDrill = vi.fn()
    mount(11, data, { startDrill })
    const line = document.querySelector('.la-trend-line')!
    expect(line.getAttribute('d')).not.toContain('L')
    expect(screen.getByText('Underlag saknas')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Öva KVA' }))
    expect(startDrill).toHaveBeenCalledWith({ kind: 'section', section: 'KVA' })
    fireEvent.click(screen.getByRole('tab', { name: 'Historik' }))
    expect(screen.queryByRole('heading', { name: 'Din prognos' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Övning och repetition' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Provpass' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Översikt' }))
    expect(screen.getByRole('heading', { name: 'Din prognos' })).toBeInTheDocument()
  })

  it('handles a cold prognosis, unknown attendance and absent optional fields without invented values', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.framsteg.prognosis = { total: null, verbal: null, quant: null, caveat: null }
    data.framsteg.week = {
      streakDays: 0,
      attemptsThisWeek: 0,
      accuracy7d: null,
      minutesToday: null,
    }
    data.framsteg.weekly = []
    data.framsteg.days = []
    data.framsteg.history = []
    data.framsteg.focus = []
    data.framsteg.sections.forEach((s) => {
      s.score = null
      delete s.band
      s.daysSince = null
    })
    mount(11, data)
    expect(screen.getByText('Närvarouppgifter saknas.')).toBeInTheDocument()
    expect(screen.getByText('Inga avslutade pass än.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Till Öva' })).toBeInTheDocument()
    expect(screen.getByTestId('rd-lager')).not.toHaveTextContent(
      /undefined|NaN|Målnivå|Intervall|95 %/,
    )
    expect(document.querySelector('.la-trend-line')).toBeNull()
  })

  it.each([false, true])('excludes completed plan work (all complete=%s)', (all) => {
    const data = structuredClone(FIXTURE_DATA)
    data.home.resume = null
    data.home.plan.items.forEach((item, i) => {
      item.completed = all || i === 0
    })
    data.home.plan.allComplete = all
    const openPlanItem = vi.fn()
    mount(1, data, { openPlanItem })
    for (const item of data.home.plan.items.filter((item) => item.completed)) {
      expect(screen.queryByRole('button', { name: new RegExp(item.title) })).toBeNull()
    }
    if (all) expect(screen.getByText('Dagens plan är klar.')).toBeInTheDocument()
    else {
      const next = data.home.plan.items.find((item) => !item.completed)!
      fireEvent.click(screen.getByRole('button', { name: new RegExp(next.title) }))
      expect(openPlanItem).toHaveBeenCalledWith(next.id)
    }
  })

  it('blocks grading when the DTK figure is missing entirely', () => {
    const data = oneQuestion('dtk')
    data.drills.dtk.questions[0].figure = null
    mount(7, data)
    fireEvent.click(screen.getByTestId('rd-quant-option-A'))
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    expect(screen.getAllByText('Underlaget saknas.').length).toBeGreaterThan(0)
  })

  it('zooms, rotates and fits the source, suspends drill shortcuts and restores focus on close', () => {
    const modal = vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(function (
      this: HTMLDialogElement,
    ) {
      this.setAttribute('open', '')
    })
    const close = vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function (
      this: HTMLDialogElement,
    ) {
      this.removeAttribute('open')
    })
    mount(7)
    const trigger = screen.getByRole('button', { name: 'Förstora figur' })
    fireEvent.click(trigger)
    expect(modal).toHaveBeenCalled()
    const viewer = screen.getByRole('dialog', { name: 'Förstorad figur' })
    const switchScreen = vi.fn()
    window.addEventListener('keydown', switchScreen)
    for (const key of ['ArrowRight', '1', '4', '8']) {
      fireEvent.keyDown(within(viewer).getByRole('region'), { key })
    }
    expect(switchScreen).not.toHaveBeenCalled()
    window.removeEventListener('keydown', switchScreen)
    fireEvent.click(within(viewer).getByRole('button', { name: 'Zooma in' }))
    expect(within(viewer).getByText('150%')).toBeInTheDocument()
    fireEvent.click(within(viewer).getByRole('button', { name: 'Rotera' }))
    expect(within(viewer).getByRole('img')).toHaveStyle({
      transform: 'translate(-50%, -50%) rotate(90deg)',
    })
    fireEvent.keyDown(window, { key: 'b' })
    expect(screen.getByTestId('rd-quant-option-B')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(within(viewer).getByRole('button', { name: 'Anpassa' }))
    expect(within(viewer).getByText('100%')).toBeInTheDocument()
    fireEvent(viewer, new Event('cancel', { bubbles: false, cancelable: true }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(trigger).toHaveFocus()
    modal.mockRestore()
    close.mockRestore()
  })
})

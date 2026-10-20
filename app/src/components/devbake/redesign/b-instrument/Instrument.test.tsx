import { readFileSync } from 'node:fs'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { entryHeadword, type Framework } from '@/data/frameworks'
import type { Question } from '@/data/questions'
import {
  describeDirectionContract,
  mountDirection,
  reveal,
  spyActions,
  stubLayout,
} from '../contract'
import { DirectionDataProvider, drillQuestion, FIXTURE_DATA } from '../directionData'
import { Redesign2026Bakeoff, type Selection } from '../Redesign2026Bakeoff'
import type { AppScreenKey, WidthKey } from '../r1Kit'
import type { DirectionData } from '../viewModel'
import { Instrument } from './Instrument'
import { meta } from './meta'

let cachedImages = true
const dialogMethods = ['showModal', 'close'] as const
const dialogDescriptors = dialogMethods.map((name) =>
  Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, name),
)
beforeAll(() => {
  stubLayout()
  // The real bake-off only mounts its lazy stage after it measures the viewport.
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1440)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(900)
  // jsdom has no image loader. Model cached assets for the shared contract;
  // the loading/error cases below explicitly turn this off and send events.
  vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockImplementation(() => cachedImages)
  vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockImplementation(() =>
    cachedImages ? 800 : 0,
  )
  for (const name of dialogMethods)
    Object.defineProperty(HTMLDialogElement.prototype, name, {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = name === 'showModal'
      },
    })
})
beforeEach(() => {
  cachedImages = true
})
afterAll(() => {
  vi.restoreAllMocks()
  dialogMethods.forEach((name, index) => {
    const descriptor = dialogDescriptors[index]
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor)
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name)
  })
})

describeDirectionContract(meta, Instrument)

describe('Instrument batch 3 regressions', () => {
  it.each([
    'desktop',
    'phone',
  ] as const)('reads a genuine long ELF passage without synthetic disclosure at %s width', (width) => {
    const bank: Question[] = JSON.parse(readFileSync('public/data/host-2025.json', 'utf8'))
    const raw = bank.find((q) => q.qid === 'host-2025-verb1-ELF-033')!
    expect(raw.context!.length).toBeGreaterThan(4000)
    const q = drillQuestion(raw)
    const data = dataCopy()
    data.drills.elf = { ...data.drills.elf, questions: [q], explanations: {}, start: {} }
    delete data.drills.elf.elapsedSeconds
    mountData(data, 14, width)
    const passage = screen.getByTestId('rd-elf-passage')
    for (const paragraph of q.passage!.paragraphs) expect(passage).toHaveTextContent(paragraph)
    expect(screen.queryByTestId('rd-badge')).toBeNull()
    expect(screen.queryByTestId('rd-note-toggle')).toBeNull()
    expect(screen.queryByRole('timer')).toBeNull()
    reveal(`rd-option-${q.answer}`)
    fireEvent.click(screen.getByTestId(`rd-option-${q.answer}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
    fireEvent.click(screen.getByRole('button', { name: /visa förklaringen/i }))
    expect(screen.getByText('Förklaring saknas för den här frågan.')).toBeInTheDocument()
    expect(screen.queryByTestId('rd-cite-1')).toBeNull()
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(screen.getByText('Texten är klar')).toBeInTheDocument()
  })

  it.each([
    'passage',
    'prompt',
    'options',
  ] as const)('does not grade partial ELF content missing %s', (field) => {
    const data = dataCopy()
    data.drills.elf.questions[0][field] = null
    const { actions } = mountData(data, 14)
    fireEvent.keyDown(document.body, { key: 'a' })
    fireEvent.keyDown(document.body, { key: 'Enter' })
    fireEvent.keyDown(document.body, { key: ' ' })
    expect(actions.drill.lock).not.toHaveBeenCalled()
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    expect(screen.getByTestId('rd-exit')).toBeEnabled()
  })

  it('keeps ELF explanation language, phone citations, and the passage position', () => {
    mountData(dataCopy(), 14, 'phone')
    reveal('rd-option-B')
    const passage = screen.getByTestId('rd-elf-passage')
    fireEvent.click(screen.getByTestId('rd-option-B'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
    const solution = screen.getByText(
      FIXTURE_DATA.drills.elf.explanations[FIXTURE_DATA.drills.elf.questions[0].qid]!.solution_path,
    )
    expect(solution.closest('[lang]')).toHaveAttribute('lang', 'en')
    expect(screen.getByRole('heading', { name: 'Lösningen' }).closest('[lang]')).toHaveAttribute(
      'lang',
      'sv',
    )
    const citations = screen.getAllByTestId('rd-cite-1')
    expect(screen.queryByTestId('rd-cite-2')).toBeNull()
    fireEvent.click(citations[0])
    expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'peek')
    expect(screen.getByTestId('rd-elf-passage')).toBe(passage)
    fireEvent.click(screen.getByRole('button', { name: 'Tillbaka till facit' }))
    expect(screen.getByTestId('rd-sheet')).not.toHaveAttribute('data-state', 'peek')
  })

  it.each([
    2, 6, 14,
  ] as const)('resets safely for shrinking decks and new sitting IDs on screen %s', (page) => {
    const data = dataCopy()
    const slot = page === 2 ? 'reading' : page === 6 ? 'quant' : 'elf'
    const q = data.drills[slot].questions[0]
    data.drills[slot].questions = [q, { ...q, qid: `${q.qid}-last` }]
    data.drills[slot].start = { index: 1 }
    const { actions, rerenderData } = mountData(data, page)
    fireEvent.keyDown(document.body, { key: 'a' })
    const next = structuredClone(data)
    next.drills[slot].questions = [q]
    expect(() => rerenderData(next)).not.toThrow()
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.keyDown(document.body, { key: 'a' })
    fireEvent.keyDown(document.body, { key: 'Enter' })
    next.drills[slot].id += '-new-sitting'
    rerenderData(structuredClone(next))
    expect(screen.queryByTestId('rd-verdict')).toBeNull()
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    expect(actions.drill.lock).toHaveBeenCalledOnce()
  })

  it.each([
    'nog_traps',
    'dtk_tactics',
    'mek_protocol',
    'las_taxonomy',
    'ord_roots',
  ])('renders the real %s lesson family and confirmed read changes', (name) => {
    const framework: Framework = JSON.parse(readFileSync(`public/frameworks/${name}.json`, 'utf8'))
    const entry = framework.entries[0]
    const data = dataCopy()
    data.uppslag.open = {
      id: entry.id,
      title: entryHeadword(entry, framework)!,
      entry,
      family: framework.family,
      section: framework.section,
      read: false,
      practice: { questions: entry.example_questions.length },
    }
    const { actions, rerenderData } = mountData(data, 12)
    expect(screen.getByTestId('rd-lesson')).toHaveTextContent(data.uppslag.open.title)
    expect(screen.getByTestId('rd-lesson')).not.toHaveTextContent(/[\uE000\uE001]/)
    fireEvent.click(screen.getByTestId('rd-lesson-read'))
    expect(actions.toggleLessonRead).toHaveBeenCalledWith(entry.id)
    expect(screen.getByTestId('rd-lesson-read')).toHaveAttribute('aria-pressed', 'false')
    const next = structuredClone(data)
    next.uppslag.open.read = true
    next.uppslag.sections
      .find((s) => s.section === framework.section)!
      .entries.find((e) => e.id === entry.id)!.read = true
    rerenderData(next)
    expect(screen.getByTestId('rd-lesson-read')).toHaveTextContent('Markera som oläst')
  })

  it('keeps catalog selections valid when sections disappear, including an empty catalog', () => {
    const data = dataCopy()
    const { rerenderData } = mountData(data, 12)
    const next = structuredClone(data)
    next.uppslag.sections = []
    expect(() => rerenderData(next)).not.toThrow()
    expect(screen.getByText('Innehåll saknas ännu.')).toBeInTheDocument()
    expect(screen.queryByTestId('rd-lesson-practice')).toBeNull()
  })

  it('themes the actual host, updates supported preferences, and routes library/account navigation', async () => {
    const onSelect = mountBakeoff(12)
    await screen.findByTestId('rd-lesson')
    fireEvent.click(screen.getByTestId('rd-account'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Inställningar' }))
    await screen.findByTestId('rd-konto-identity')
    expect(screen.getByTestId('rd-nav-uppslag')).toHaveAttribute('aria-current', 'page')
    fireEvent.click(screen.getByTestId('rd-konto-mode-dark'))
    expect(screen.getByTestId('rd-instrument')).toHaveAttribute('data-theme', 'dark')
    for (const pref of ['font', 'density', 'coach'] as const) {
      const other = FIXTURE_DATA.konto.options[pref].find(
        (o) => o.key !== FIXTURE_DATA.konto.prefs[pref],
      )!
      fireEvent.click(screen.getByTestId(`rd-konto-${pref}-${other.key}`))
      expect(screen.getByTestId(`rd-konto-${pref}-${other.key}`)).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    }
    fireEvent.click(screen.getByRole('button', { name: 'Tillbaka till Öva' }))
    expect(onSelect).toHaveBeenCalledWith({ s: 5 })
    await screen.findByTestId('rd-ova-section-elf')
    fireEvent.click(screen.getByTestId('rd-ova-section-elf'))
    await screen.findByTestId('rd-elf-passage')
    expect(screen.getByTestId('rd-instrument')).toHaveAttribute('data-theme', 'dark')
    fireEvent.click(screen.getByTestId('rd-exit'))
    await screen.findByTestId('rd-ova-section-elf')
  })

  it('keeps the command dialog and account menu keys inside the real host and restores focus', async () => {
    const onSelect = mountBakeoff(12)
    await screen.findByTestId('rd-lesson')
    const trigger = screen.getByTestId('rd-account')
    fireEvent.click(trigger)
    const item = screen.getByRole('menuitem', { name: 'Konto' })
    expect(item).toHaveFocus()
    onSelect.mockClear()
    for (const key of ['1', 'ArrowRight']) fireEvent.keyDown(item, { key })
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.keyDown(item, { key: 'ArrowDown' })
    expect(screen.getByRole('menuitem', { name: 'Inställningar' })).toHaveFocus()
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(trigger).toHaveFocus()
    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true })
    const dialog = screen.getByRole('dialog', { name: 'Kommandon' })
    expect(dialog).toHaveAttribute('open')
    fireEvent.keyDown(dialog, { key: '1' })
    fireEvent.keyDown(dialog, { key: 'ArrowRight' })
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent(dialog, new Event('cancel', { bubbles: false, cancelable: true }))
    expect(screen.queryByRole('dialog', { name: 'Kommandon' })).toBeNull()
  })

  it.each([
    2, 6,
  ] as const)('resets failed option images when the source changes on screen %s', (page) => {
    cachedImages = false
    const data = dataCopy()
    const slot = page === 2 ? 'reading' : 'quant'
    data.drills[slot].start = {}
    const q = data.drills[slot].questions[0]
    q.figure = null
    q.options![0].figure = { src: 'failed.svg', alt: 'Alternativbild', width: 100, height: 100 }
    const { actions, rerenderData } = mountData(data, page)
    fireEvent.error(screen.getByRole('img', { name: 'Alternativbild' }))
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    const next = structuredClone(data)
    next.drills[slot].questions[0].options![0].figure!.src = 'replacement.svg'
    rerenderData(next)
    expect(screen.queryByText('Bilden kunde inte visas.')).toBeNull()
    fireEvent.keyDown(document.body, { key: 'a' })
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(actions.drill.lock).not.toHaveBeenCalled()
    fireEvent.load(screen.getByRole('img', { name: 'Alternativbild' }))
    fireEvent.keyDown(document.body, { key: 'a' })
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(actions.drill.lock).toHaveBeenCalledOnce()
  })
  it('requires DTK evidence in a mixed session on screen 6', () => {
    const data = dataCopy()
    const q = { ...data.drills.dtk.questions[0], figure: null }
    data.drills.quant = { ...data.drills.quant, questions: [q], start: {} }
    const { actions } = mountData(data, 6)
    fireEvent.keyDown(document.body, { key: 'a' })
    fireEvent.keyDown(document.body, { key: 'Enter' })
    fireEvent.keyDown(document.body, { key: ' ' })
    expect(actions.drill.lock).not.toHaveBeenCalled()
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
  })

  it.each([2, 6] as const)('waits for newly mounted reused option images on screen %s', (page) => {
    cachedImages = false
    const data = dataCopy()
    const slot = page === 2 ? 'reading' : 'quant'
    const q = structuredClone(data.drills[slot].questions[0])
    q.figure = null
    q.options![0].figure = { src: 'same.svg', alt: 'Samma alternativbild', width: 100, height: 100 }
    data.drills[slot] = {
      ...data.drills[slot],
      questions: [q, { ...q, qid: `${q.qid}-two` }],
      start: {},
    }
    const { actions } = mountData(data, page)
    const first = screen.getByRole('img', { name: 'Samma alternativbild' })
    fireEvent.load(first)
    fireEvent.keyDown(document.body, { key: 'a' })
    fireEvent.keyDown(document.body, { key: 'Enter' })
    fireEvent.keyDown(document.body, { key: 'Enter' })
    vi.mocked(actions.drill.lock).mockClear()
    expect(screen.getByRole('img', { name: 'Samma alternativbild' })).not.toBe(first)
    fireEvent.keyDown(document.body, { key: 'a' })
    fireEvent.keyDown(document.body, { key: 'Enter' })
    fireEvent.keyDown(document.body, { key: ' ' })
    expect(actions.drill.lock).not.toHaveBeenCalled()
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.load(screen.getByRole('img', { name: 'Samma alternativbild' }))
    fireEvent.keyDown(document.body, { key: 'a' })
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(actions.drill.lock).toHaveBeenCalledOnce()
  })

  it('isolates quant figure panning and its dialog in the real host', async () => {
    const onSelect = mountBakeoff(7)
    await screen.findByTestId('rd-figure')
    const pan = screen.getByRole('region', { name: 'Figur, rulla för att läsa hela underlaget' })
    pan.focus()
    onSelect.mockClear()
    for (const key of ['1', 'ArrowRight', 'ArrowLeft']) fireEvent.keyDown(pan, { key })
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Förstora figur' }))
    const dialog = screen.getByRole('dialog', { name: 'Underlag' })
    const close = within(dialog).getByRole('button', { name: 'Stäng figur' })
    close.focus()
    for (const key of ['1', 'ArrowRight']) fireEvent.keyDown(close, { key })
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('keeps Home command selection valid after removing resume', () => {
    const data = dataCopy()
    const { actions, rerenderData } = mountData(data, 1)
    for (let i = 0; i < data.home.plan.items.length; i++)
      fireEvent.keyDown(document.body, { key: 'ArrowDown' })
    const next = structuredClone(data)
    next.home.resume = null
    rerenderData(next)
    expect(document.querySelectorAll('.in-cmd[data-active="true"]')).toHaveLength(1)
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(actions.openPlanItem).toHaveBeenCalledWith(next.home.plan.items.at(-1)!.id)
  })

  it.each([
    1, 2, 6,
  ] as const)('never offers completed plan items as next work on screen %s', (page) => {
    const data = dataCopy()
    data.home.plan.items.forEach((item) => {
      item.completed = true
    })
    if (page !== 1) {
      const slot = page === 2 ? 'reading' : 'quant'
      data.drills[slot].questions = [data.drills[slot].questions[0]]
      data.drills[slot].start = {}
    }
    const { actions } = mountData(data, page)
    if (page === 1) {
      expect(screen.queryByText(/Sedan repetition|Nästa: repetition/i)).toBeNull()
      expect(screen.queryAllByRole('button', { name: /Repetition/ })).toHaveLength(0)
    } else {
      fireEvent.keyDown(document.body, { key: 'a' })
      fireEvent.keyDown(document.body, { key: 'Enter' })
      fireEvent.keyDown(document.body, { key: 'Enter' })
      fireEvent.click(screen.getByRole('button', { name: /Till Öva/ }))
      expect(actions.go).toHaveBeenCalledWith('ova')
      expect(actions.openPlanItem).not.toHaveBeenCalled()
    }
  })

  it.each([
    2, 6, 7, 14,
  ] as const)('routes the empty-session Öva control by its label on screen %s', (page) => {
    const data = dataCopy()
    data.drills[
      page === 2 ? 'reading' : page === 6 ? 'quant' : page === 7 ? 'dtk' : 'elf'
    ].questions = []
    const { actions } = mountData(data, page)
    fireEvent.click(screen.getByRole('button', { name: 'Till Öva' }))
    expect(actions.go).toHaveBeenCalledWith('ova')
    expect(actions.drill.exit).not.toHaveBeenCalled()
  })

  it('renders the supplied lesson and keeps practice unavailable without examples', () => {
    const data = dataCopy()
    data.uppslag.open.practice.questions = 0
    const { actions } = mountData(data, 12)
    expect(screen.getByTestId('rd-lesson')).toHaveTextContent(data.uppslag.open.title)
    expect(screen.getByTestId('rd-lesson-practice')).toBeDisabled()
    fireEvent.click(screen.getByTestId('rd-lesson-read'))
    expect(actions.toggleLessonRead).toHaveBeenCalledWith(data.uppslag.open.id)
  })

  it('keeps the account preview non-destructive and its settings truthful', () => {
    const { actions } = mountData(dataCopy(), 13)
    expect(screen.getByTestId('rd-konto-identity')).toHaveTextContent(
      FIXTURE_DATA.konto.identity.email,
    )
    expect(screen.getByTestId('rd-konto-delete')).toBeDisabled()
    fireEvent.click(screen.getByTestId('rd-konto-export'))
    expect(actions.exportData).toHaveBeenCalledOnce()
    expect(screen.queryByText(/Exporten är klar|Sparat/)).toBeNull()
  })

  it('uses the genuine ELF unit, language boundaries, and ends after its one question', () => {
    const data = dataCopy()
    data.home.plan.items = []
    const { actions } = mountData(data, 14)
    const q = data.drills.elf.questions[0]
    expect(screen.getByTestId('rd-elf-passage')).toHaveAttribute('lang', 'en')
    expect(screen.getByRole('heading', { name: q.passage!.title })).toHaveAttribute('lang', 'en')
    expect(screen.getByText(q.prompt!)).toHaveAttribute('lang', 'en')
    fireEvent.keyDown(document.body, { key: q.answer.toLowerCase() })
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(actions.drill.lock).toHaveBeenCalledWith(q, q.answer)
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(screen.getByTestId('rd-done')).toHaveTextContent('1/1')
    fireEvent.click(screen.getByRole('button', { name: /Till Öva/ }))
    expect(actions.go).toHaveBeenCalledWith('ova')
  })
})

function mountData(data: DirectionData, page: AppScreenKey, width: WidthKey = 'desktop') {
  const actions = spyActions()
  const tree = (s: AppScreenKey, value = data) => (
    <DirectionDataProvider data={value} actions={actions}>
      <Instrument
        screen={s}
        theme="light"
        width={width}
        live
        onScreen={vi.fn()}
        onTheme={vi.fn()}
      />
    </DirectionDataProvider>
  )
  const rendered = render(tree(page))
  return {
    actions,
    goTo: (s: AppScreenKey) => rendered.rerender(tree(s)),
    rerenderData: (value: DirectionData) => rendered.rerender(tree(page, value)),
  }
}

function dataCopy(): DirectionData {
  return structuredClone(FIXTURE_DATA)
}

describe('Instrument data and interactions', () => {
  it('reads home, account and plan actions from the provider without optional fixture-only fields', () => {
    const data = dataCopy()
    data.home.today.greeting = 'God morgon, Ada'
    if (data.home.resume) {
      delete data.home.resume.minutesLeft
      delete data.home.resume.pausedAt
      delete data.home.resume.device
    }
    data.home.prognosis = { total: null, verbal: null, quant: null, caveat: null }
    data.home.week = { minutesToday: null }
    data.home.traps = []
    data.konto.identity.name = 'Ada'
    const { actions } = mountData(data, 1)
    expect(screen.getByText('God morgon, Ada')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /Prognosen/ })).toBeNull()
    expect(screen.queryByText(/undefined|NaN|pausad|ca .* min kvar/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: new RegExp(data.home.plan.items[0].title) }))
    expect(actions.openPlanItem).toHaveBeenCalledWith(data.home.plan.items[0].id)
    fireEvent.click(screen.getByTestId('rd-account'))
    expect(screen.getByText('Ada')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Konto' }))
    expect(actions.openKonto).toHaveBeenCalledOnce()
  })

  it('renders an empty home without manufacturing a resume, trap, time bar or prognosis', () => {
    const data = dataCopy()
    data.home.resume = null
    data.home.plan.items = []
    data.home.traps = []
    data.home.recent = []
    data.home.prognosis = { total: null, verbal: null, quant: null, caveat: null }
    mountData(data, 1, 'phone')
    expect(screen.queryByTestId('rd-resume')).toBeNull()
    expect(screen.queryByText(/undefined|NaN/)).toBeNull()
    expect(screen.getByText('Din övning börjar här.')).toBeInTheDocument()
  })

  it('migrates reading content, grading, next and exit to the supplied controller', () => {
    const data = dataCopy()
    const q = data.drills.reading.questions[2]
    q.prompt = 'Vilket påstående stöds av texten?'
    if (q.passage) q.passage.title = 'En annan text: Ett nytt sammanhang'
    delete data.drills.reading.elapsedSeconds
    data.drills.reading.explanations[q.qid] = null
    const { actions, goTo } = mountData(data, 2)
    expect(screen.getByText(q.prompt)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'En annan text' })).toBeInTheDocument()
    expect(screen.queryByRole('timer')).toBeNull()
    vi.mocked(actions.drill.lock).mockReturnValue({ correct: false })
    fireEvent.click(screen.getByTestId(`rd-option-${q.answer}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
    goTo(3)
    expect(actions.drill.lock).toHaveBeenCalledWith(q, q.answer)
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
    expect(screen.getByText('Förklaring saknas för den här frågan.')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(actions.drill.next).toHaveBeenCalledWith(3)
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(actions.drill.exit).toHaveBeenCalledOnce()
  })

  it('opens all navigation destinations and the new Öva screen through actions', () => {
    const { actions, goTo } = mountDirection(Instrument, 1, 'desktop')
    fireEvent.click(screen.getByTestId('rd-nav-ova'))
    expect(actions.go).toHaveBeenCalledWith('ova')
    goTo(5)
    expect(screen.getByRole('heading', { name: 'Öva' })).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-ova-repetera'))
    expect(actions.openRepetera).toHaveBeenCalledOnce()
    goTo(8)
    expect(screen.getByRole('heading', { name: 'Repetera' })).toBeInTheDocument()
  })

  it('keeps unpractised sections and an empty repetition door without a fabricated weakest score', () => {
    const data = dataCopy()
    data.home.resume = null
    data.ova.weakest = null
    data.ova.sections.forEach((s) => {
      s.score = null
      s.waiting = 0
    })
    data.ova.repetera = { dueNow: 0, pile: 0 }
    mountData(data, 5, 'phone')
    expect(screen.queryByText('Svagast')).toBeNull()
    expect(screen.getAllByText('Ej övat')).toHaveLength(8)
    expect(screen.getByTestId('rd-ova-repetera')).toHaveTextContent('Inga missar väntar.')
  })

  it('keeps the repetition due partition and caps the primary batch at ten', () => {
    const data = dataCopy()
    data.repetera.dueNow = 16
    data.repetera.sessionSize = 16
    data.repetera.items.reverse()
    const { actions } = mountData(data, 8)
    const items = screen.getAllByTestId(/^rd-repetera-item-/)
    const ordered = [
      ...data.repetera.items.filter((i) => i.dueNow),
      ...data.repetera.items.filter((i) => !i.dueNow),
    ]
    expect(items.map((el) => el.dataset.testid)).toEqual(
      ordered.map((i) => `rd-repetera-item-${i.n}`),
    )
    expect(screen.getByTestId('rd-repetera-start')).toHaveTextContent('Repetera 10')
    fireEvent.click(screen.getByTestId('rd-repetera-start'))
    expect(actions.startDrill).toHaveBeenCalledWith({ kind: 'repetition' })
  })

  it.each([0, 4])('shows an honest no-due state with pile %s', (pile) => {
    const data = dataCopy()
    data.repetera = { dueNow: 0, pile, sessionSize: 0, items: [] }
    const { actions } = mountData(data, 8, 'phone')
    expect(screen.queryByTestId('rd-repetera-start')).toBeNull()
    expect(screen.getByText(pile ? /Inget är redo/ : /Inga missar än/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Öva istället/ }))
    expect(actions.go).toHaveBeenCalledWith('ova')
  })

  it('preserves KVA conditions and quantities', () => {
    const data = dataCopy()
    data.drills.quant.start.index = 1
    mountData(data, 6)
    expect(screen.getByText('Kvantitet I')).toBeInTheDocument()
    expect(screen.getByText('Kvantitet II')).toBeInTheDocument()
  })

  it('keeps an unsplit NOG prompt and missing explanation readable', () => {
    const data = dataCopy()
    const q = data.drills.quant.questions[2]
    q.prompt = 'Villkoret saknar numrerade påståenden.'
    data.drills.quant = { ...data.drills.quant, questions: [q], explanations: {}, start: {} }
    mountData(data, 6, 'phone')
    expect(screen.getByTestId('rd-quant-prompt')).toHaveTextContent(q.prompt)
    fireEvent.click(screen.getByTestId(`rd-quant-option-${q.answer}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(screen.getByText('Förklaring saknas för den här frågan.')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(screen.getByText('Övningen är klar')).toBeInTheDocument()
  })

  it('gives E to NOG, shift-E to striking, Space to advance and leaves digits/Escape alone', () => {
    const data = dataCopy()
    data.drills.quant.start.index = 2
    const { actions } = mountData(data, 6)
    expect(screen.getByText('(1)')).toBeInTheDocument()
    expect(screen.getByText('(2)')).toBeInTheDocument()
    fireEvent.keyDown(document.body, { key: 'e', shiftKey: true })
    expect(screen.getByTestId('rd-eliminate-E')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.keyDown(document.body, { key: 'e' })
    expect(screen.getByTestId('rd-quant-option-E')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.keyDown(document.body, { key: '8' })
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(actions.drill.exit).not.toHaveBeenCalled()
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(actions.drill.lock).toHaveBeenCalledOnce()
    fireEvent.keyDown(document.body, { key: ' ' })
    expect(actions.drill.next).toHaveBeenCalledWith(null)
  })

  it.each([6, 7] as const)('keeps an explicit exit for an empty drill on screen %s', (page) => {
    const data = dataCopy()
    data.drills[page === 7 ? 'dtk' : 'quant'].questions = []
    const { actions } = mountData(data, page)
    expect(screen.getByText('Frågan är inte tillgänglig')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(actions.go).toHaveBeenCalledWith('ova')
  })

  it('prevents grading a DTK question with loading or failed evidence and allows a successful retry', () => {
    cachedImages = false
    const { actions } = mountData(dataCopy(), 7)
    const img = within(screen.getByTestId('rd-figure')).getByRole('img')
    expect(screen.getByText('Laddar underlaget…')).toBeInTheDocument()
    expect(screen.getByTestId('rd-quant-option-A')).toBeDisabled()
    fireEvent.keyDown(document.body, { key: 'a' })
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(actions.drill.lock).not.toHaveBeenCalled()
    fireEvent.error(img)
    expect(screen.getByText(/Underlaget kunde inte hämtas/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Försök igen' }))
    fireEvent.load(within(screen.getByTestId('rd-figure')).getByRole('img'))
    expect(screen.getByTestId('rd-quant-option-A')).toBeEnabled()
  })

  it('does not enable a DTK question without its required figure', () => {
    const data = dataCopy()
    data.drills.dtk.questions[0].figure = null
    mountData(data, 7)
    expect(screen.getByText('Underlaget saknas. Frågan kan inte besvaras här.')).toBeInTheDocument()
    expect(screen.getByTestId('rd-quant-option-A')).toBeDisabled()
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
  })

  it('waits for option images and keeps the correct figure in feedback', () => {
    cachedImages = false
    const data = dataCopy()
    const q = data.drills.quant.questions[0]
    q.figure = null
    const option = q.options?.find((o) => o.letter === q.answer)
    if (!option) throw new Error('fixture needs a correct option')
    option.figure = { src: 'option.svg', alt: 'Ett cirkeldiagram', width: 100, height: 100 }
    mountData(data, 6)
    expect(screen.getByTestId(`rd-quant-option-${q.answer}`)).toBeDisabled()
    fireEvent.load(screen.getByRole('img', { name: 'Ett cirkeldiagram' }))
    fireEvent.click(screen.getByTestId(`rd-quant-option-${q.answer}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'true')
    expect(screen.getByRole('img', { name: 'Ett cirkeldiagram' })).toBeInTheDocument()
  })

  it('keeps figure tools and selection separate, restores viewer focus, and retains zoom within a figure group', () => {
    const data = dataCopy()
    const q = data.drills.dtk.questions[0]
    data.drills.dtk.questions.push({ ...q, qid: `${q.qid}-next` })
    const { actions } = mountData(data, 7, 'phone')
    const open = screen.getByRole('button', { name: 'Förstora figur' })
    fireEvent.click(screen.getByRole('button', { name: 'Zooma in' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rotera' }))
    fireEvent.click(open)
    const dialog = screen.getByRole('dialog', { name: 'Underlag' })
    fireEvent.keyDown(dialog, { key: 'a' })
    expect(actions.drill.pick).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Stäng figur' }))
    expect(open).toHaveFocus()
    expect(screen.getByText('150 %')).toBeInTheDocument()
    reveal('rd-quant-option-A')
    fireEvent.click(screen.getByTestId('rd-quant-option-A'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(screen.getByText('150 %')).toBeInTheDocument()
    expect(within(screen.getByTestId('rd-figure')).getByRole('img')).toHaveStyle({
      transform: 'translate(-50%, -50%) rotate(90deg)',
      width: `${100 * (q.figure!.width / q.figure!.height)}%`,
    })
  })
})

function startPass() {
  fireEvent.click(screen.getByTestId('rd-prov-start'))
  fireEvent.click(screen.getByRole('button', { name: 'Starta nu' }))
}

function mountBakeoff(page: AppScreenKey) {
  const onSelect = vi.fn()
  function Host() {
    const [selection, setSelection] = useState<Selection>({
      d: 'b',
      s: page,
      w: 'desktop',
      t: 'light',
      sbs: false,
      bare: false,
    })
    return (
      <Redesign2026Bakeoff
        sel={selection}
        onSelect={(next) => {
          onSelect(next)
          setSelection((previous) => ({ ...previous, ...next }))
        }}
      />
    )
  }
  render(<Host />)
  return onSelect
}

describe('Instrument round 2 review regressions', () => {
  it('keeps inline figure panning available while blocking the bake-off switcher', async () => {
    const onSelect = mountBakeoff(9)
    await screen.findByTestId('rd-prov-start')
    startPass()
    const index = FIXTURE_DATA.provpass.running.questions.findIndex((q) => q.figure)
    expect(index).toBeGreaterThanOrEqual(0)
    fireEvent.click(screen.getByTestId(`rd-prov-cell-${index + 1}`))
    const pan = screen.getByRole('region', { name: 'Underlag, rulla för att läsa hela figuren' })
    pan.focus()
    pan.scrollLeft = 80
    onSelect.mockClear()
    expect(fireEvent.keyDown(pan, { key: 'ArrowRight' })).toBe(false)
    expect(pan.scrollLeft).toBeGreaterThan(80)
    expect(fireEvent.keyDown(pan, { key: 'ArrowLeft' })).toBe(false)
    expect(pan.scrollLeft).toBe(80)
    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.getByTestId(`rd-prov-cell-${index + 1}`)).toHaveAttribute('data-current', 'true')
    const answer = screen.getByTestId('in-pass-option-A')
    const previous = answer.getAttribute('aria-pressed')
    fireEvent.keyDown(pan, { key: 'a' })
    expect(answer).toHaveAttribute('aria-pressed', previous)
  })

  it.each([
    'answer',
    'grid',
    'heading',
    'body',
  ] as const)('keeps switcher keys inside a running pass from the %s in the real bake-off', async (targetKind) => {
    const onSelect = mountBakeoff(9)
    await screen.findByTestId('rd-prov-start')
    startPass()
    onSelect.mockClear()
    for (const key of ['ArrowRight', 'ArrowLeft', '1', '8', '9', '0']) {
      const target =
        targetKind === 'answer'
          ? screen.getByTestId('in-pass-option-A')
          : targetKind === 'grid'
            ? screen.getByTestId('rd-prov-cell-1')
            : targetKind === 'heading'
              ? screen.getByRole('heading', { level: 1 })
              : document.body
      if (targetKind === 'answer') fireEvent.click(target)
      target.focus()
      expect(fireEvent.keyDown(target, { key })).toBe(false)
      expect(onSelect).not.toHaveBeenCalled()
      expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
    }
    expect(screen.getByTestId('rd-prov-running')).toHaveAttribute('data-rd-keyscope')
  })

  it('lets a provider countdown reach zero without voiding a run and hands in exactly once', () => {
    vi.useFakeTimers()
    try {
      const data = dataCopy()
      data.provpass.running.remainingSeconds = 3
      const { actions, rerenderData } = mountData(data, 9)
      startPass()
      fireEvent.click(screen.getByTestId('in-pass-option-B'))
      const next = structuredClone(data)
      next.provpass.running.remainingSeconds = 0
      // The provider renders at expiry before the runner's interval gets its turn.
      vi.setSystemTime(Date.now() + 3000)
      rerenderData(next)
      act(() => vi.advanceTimersByTime(1000))
      expect(actions.submitProvpass).toHaveBeenCalledOnce()
      expect(screen.queryByRole('heading', { name: 'Provpassets tid har gått ut' })).toBeNull()
      expect(screen.getByText('Inlämning begärd.')).toBeInTheDocument()
      expect(screen.getByTestId('in-pass-option-B')).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByTestId('rd-prov-submit')).toBeDisabled()
      rerenderData(structuredClone(next))
      act(() => vi.advanceTimersByTime(10_000))
      expect(actions.submitProvpass).toHaveBeenCalledOnce()
    } finally {
      vi.useRealTimers()
    }
  })

  it('clamps the current question when the provider shrinks the same running pass', () => {
    const data = dataCopy()
    const { rerenderData } = mountData(data, 9)
    startPass()
    fireEvent.click(screen.getByTestId(`rd-prov-cell-${data.provpass.running.grid.at(-1)!.n}`))
    const next = structuredClone(data)
    const run = next.provpass.running
    run.questions = run.questions.slice(0, -1)
    run.grid = run.grid.slice(0, -1)
    run.sections = run.sections.map((section) => ({
      ...section,
      end: Math.min(section.end, run.questions.length),
    }))
    next.provpass.hub.passes.find((pass) => pass.id === run.passId)!.presented =
      run.questions.length
    expect(() => rerenderData(next)).not.toThrow()
    const last = run.grid.at(-1)!
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      `${run.questions.length} av ${run.questions.length}`,
    )
    expect(screen.getByTestId(`rd-prov-cell-${last.n}`)).toHaveAttribute('data-current', 'true')
    expect(screen.getByRole('button', { name: 'Nästa' })).toBeDisabled()
    fireEvent.click(screen.getByTestId('in-pass-option-B'))
    expect(screen.getByTestId(`rd-prov-cell-${last.n}`)).toHaveAttribute('data-answered', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Föregående' }))
    expect(screen.getByTestId(`rd-prov-cell-${run.grid.at(-2)!.n}`)).toHaveAttribute(
      'data-current',
      'true',
    )
  })

  it.each([
    'answer',
    'grid',
  ] as const)('keeps A–E answer keys working with focus on a %s button', (targetKind) => {
    const data = dataCopy()
    const nog = data.provpass.running.questions.findIndex((q) => q.section === 'NOG')
    data.provpass.running.current = nog
    mountData(data, 9)
    startPass()
    const target = screen.getByTestId(
      targetKind === 'answer' ? 'in-pass-option-A' : 'rd-prov-cell-1',
    )
    target.focus()
    for (const letter of ['A', 'B', 'C', 'D', 'E']) {
      fireEvent.keyDown(target, { key: letter.toLowerCase() })
      expect(screen.getByTestId(`in-pass-option-${letter}`)).toHaveAttribute('aria-pressed', 'true')
      expect(target).toHaveFocus()
    }
    expect(screen.getByTestId(`rd-prov-cell-${nog + 1}`)).toHaveAttribute('data-current', 'true')
  })

  it.each([
    [0, 'Alla frågor är besvarade.'],
    [1, '1 fråga är obesvarad.'],
    [2, '2 frågor är obesvarade.'],
  ] as const)('names %i unanswered questions in the submission gate', (unanswered, copy) => {
    const data = dataCopy()
    const run = data.provpass.running
    run.answers = Object.fromEntries(
      run.questions.slice(unanswered).map((q) => [q.qid, 'A' as const]),
    )
    mountData(data, 9)
    startPass()
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    expect(screen.getByRole('dialog')).toHaveTextContent(
      `${copy} Efter inlämning kan du inte ändra svaren.`,
    )
  })

  it('uses the actual presented count in the derived normering explanation', () => {
    const data = dataCopy()
    data.provpass.result.presented = 39
    data.provpass.result.score.derived = 'official-derived'
    mountData(data, 10)
    expect(screen.getByTestId('rd-prov-score')).toHaveTextContent('39 frågor skalas upp')
    expect(screen.getByTestId('rd-prov-score')).not.toHaveTextContent('40 frågor')
  })

  it('does not infer P5 calibration from a generated verbal result', () => {
    const data = dataCopy()
    data.provpass.result.mode = 'synthetic'
    data.provpass.result.half = 'verbal'
    data.provpass.result.score.derived = 'linear'
    mountData(data, 10)
    expect(screen.queryByText(data.copy.estimateCaveat)).toBeNull()
    expect(screen.getByTestId('rd-prov-score')).toHaveTextContent('Linjär skattning')
  })

  it('exposes linked tabs with roving focus and local arrow keys through the real bake-off', async () => {
    const onSelect = mountBakeoff(11)
    const tabs = await screen.findByRole('tablist', { name: 'Visa framsteg' })
    const overview = within(tabs).getByRole('tab', { name: 'Översikt' })
    const history = within(tabs).getByRole('tab', { name: 'Historik' })
    const expectSelected = (tab: HTMLElement, other: HTMLElement) => {
      expect(tab).toHaveAttribute('aria-selected', 'true')
      expect(tab).toHaveAttribute('tabindex', '0')
      expect(other).toHaveAttribute('aria-selected', 'false')
      expect(other).toHaveAttribute('tabindex', '-1')
      const panel = screen.getByRole('tabpanel', { name: tab.textContent! })
      expect(tab).toHaveAttribute('aria-controls', panel.id)
      expect(panel).toHaveAttribute('aria-labelledby', tab.id)
    }
    expectSelected(overview, history)
    overview.focus()
    for (const [key, tab, other] of [
      ['ArrowRight', history, overview],
      ['ArrowRight', overview, history],
      ['ArrowLeft', history, overview],
      ['Home', overview, history],
      ['End', history, overview],
    ] as const) {
      fireEvent.keyDown(document.activeElement!, { key })
      expectSelected(tab, other)
      expect(tab).toHaveFocus()
    }
    fireEvent.click(overview)
    expectSelected(overview, history)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it.each([
    false,
    true,
  ])('shows practice history when selected mock results disappear (empty practice: %s)', (empty) => {
    const data = dataCopy()
    if (empty) data.framsteg.history = []
    const { rerenderData } = mountData(data, 11)
    // Query by text so this regression also reaches the old toggle-button UI.
    fireEvent.click(screen.getByText('Historik', { selector: 'button' }))
    const history = screen.getByTestId('rd-framsteg-history')
    fireEvent.click(within(history).getByRole('button', { name: 'Provpass' }))
    const next = structuredClone(data)
    next.provpass.hub.results = []
    rerenderData(next)
    expect(within(history).queryByRole('group', { name: 'Typ av historik' })).toBeNull()
    expect(within(history).queryByRole('heading', { name: 'Avslutade provpass' })).toBeNull()
    if (empty) expect(screen.getByText('Inga avslutade pass än.')).toBeVisible()
    else expect(screen.getByTestId('rd-framsteg-history-item-1')).toBeVisible()
  })
})

describe('Instrument pass and progress safeguards', () => {
  it('opens Historik from Home and restores the overview through the primary destination', () => {
    const { actions, goTo } = mountData(dataCopy(), 1)
    fireEvent.click(screen.getByRole('button', { name: 'Alla pass i Framsteg' }))
    expect(actions.go).toHaveBeenCalledWith('framsteg')
    goTo(11)
    expect(screen.getByRole('tab', { name: 'Historik' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByTestId('rd-nav-framsteg'))
    expect(screen.getByRole('tab', { name: 'Översikt' })).toHaveAttribute('aria-selected', 'true')
  })

  it.each([
    'desktop',
    'phone',
  ] as const)('confirms start, keeps revisable answers and confirms submission at %s width', (width) => {
    const data = dataCopy()
    const { actions } = mountData(data, 9, width)
    const start = screen.getByTestId('rd-prov-start')
    start.focus()
    fireEvent.click(start)
    expect(actions.startProvpass).not.toHaveBeenCalled()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Ingen paus')
    expect(screen.getByRole('button', { name: 'Inte nu' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Inte nu' }))
    expect(start).toHaveFocus()
    startPass()
    expect(actions.startProvpass).toHaveBeenCalledExactlyOnceWith(data.provpass.running.passId)
    expect(screen.queryByTestId('rd-nav-idag')).toBeNull()
    expect(screen.queryByTestId('rd-account')).toBeNull()
    expect(screen.getByTestId('rd-prov-timer')).toHaveTextContent('31:12')
    const run = data.provpass.running
    const q = run.questions[run.current]
    fireEvent.click(screen.getByTestId('in-pass-option-A'))
    fireEvent.click(screen.getByTestId('in-pass-option-B'))
    expect(screen.getByTestId('in-pass-option-B')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId(`rd-prov-cell-${run.current + 1}`)).toHaveAttribute(
      'data-answered',
      'true',
    )
    expect(screen.queryByTestId('rd-verdict')).toBeNull()
    expect(actions.drill.lock).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('rd-prov-flag'))
    expect(screen.getByTestId('rd-prov-flag')).toHaveAttribute(
      'aria-pressed',
      String(!run.flags?.includes(q.qid)),
    )
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    expect(actions.submitProvpass).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toHaveTextContent('obesvarade')
    fireEvent.click(screen.getByRole('button', { name: 'Fortsätt svara' }))
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    fireEvent.click(screen.getByRole('button', { name: 'Lämna in nu' }))
    expect(actions.submitProvpass).toHaveBeenCalledOnce()
    expect(screen.getByTestId('rd-prov-submit')).toBeDisabled()
  })

  it('uses pass keyboard semantics, guards exit and keeps grid input independent', () => {
    const data = dataCopy()
    const { actions } = mountData(data, 9)
    startPass()
    const current = data.provpass.running.current
    fireEvent.keyDown(document.body, { key: 'a' })
    expect(screen.getByTestId('in-pass-option-A')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.keyDown(document.body, { key: 'Enter' })
    fireEvent.keyDown(document.body, { key: ' ' })
    fireEvent.keyDown(document.body, { key: '8' })
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(screen.getByTestId(`rd-prov-cell-${current + 1}`)).toHaveAttribute(
      'data-current',
      'true',
    )
    expect(actions.submitProvpass).not.toHaveBeenCalled()
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(screen.getByTestId(`rd-prov-cell-${current + 2}`)).toHaveAttribute(
      'data-current',
      'true',
    )
    fireEvent.keyDown(screen.getByTestId('rd-prov-cell-1'), { key: 'ArrowRight' })
    expect(screen.getByTestId(`rd-prov-cell-${current + 2}`)).toHaveAttribute(
      'data-current',
      'true',
    )
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(screen.getByRole('dialog')).toHaveTextContent('ogiltigt')
    fireEvent.keyDown(document.body, { key: 'b' })
    fireEvent.click(screen.getByRole('button', { name: 'Fortsätt provpasset' }))
    expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-exit'))
    fireEvent.click(screen.getByRole('button', { name: 'Avbryt provpass' }))
    expect(screen.getByText('Provpasset avbröts och fick inget resultat.')).toBeInTheDocument()
    expect(screen.getByTestId('rd-nav-provpass')).toBeInTheDocument()
    expect(actions.submitProvpass).not.toHaveBeenCalled()
  })

  it('uses elapsed wall time and submits once even while an exit confirmation is open', () => {
    vi.useFakeTimers()
    try {
      const data = dataCopy()
      data.provpass.running.remainingSeconds = 10
      const { actions } = mountData(data, 9)
      startPass()
      fireEvent.click(screen.getByTestId('rd-exit'))
      act(() => {
        vi.setSystemTime(Date.now() + 20_000)
        vi.advanceTimersByTime(1000)
      })
      expect(screen.getByTestId('rd-prov-timer')).toHaveTextContent('00:00')
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(actions.submitProvpass).toHaveBeenCalledOnce()
      act(() => vi.advanceTimersByTime(10_000))
      expect(actions.submitProvpass).toHaveBeenCalledOnce()
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not substitute another pass when the selected content is unavailable', () => {
    const data = dataCopy()
    data.provpass.running.passId = 'different-pass'
    const { actions } = mountData(data, 9)
    startPass()
    expect(screen.getByRole('heading', { name: 'Passet är inte tillgängligt' })).toBeInTheDocument()
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
    expect(actions.submitProvpass).not.toHaveBeenCalled()
  })

  it('does not grant time or submit an already expired source snapshot', () => {
    const data = dataCopy()
    data.provpass.running.remainingSeconds = 0
    const { actions } = mountData(data, 9)
    startPass()
    expect(screen.getByRole('heading', { name: 'Provpassets tid har gått ut' })).toBeInTheDocument()
    expect(actions.submitProvpass).not.toHaveBeenCalled()
    expect(screen.queryByTestId('rd-prov-timer')).toBeNull()
  })

  it('keeps an empty half available without inventing a pass', () => {
    const data = dataCopy()
    data.provpass.hub.passes = data.provpass.hub.passes.filter((pass) => pass.half === 'kvant')
    const { actions } = mountData(data, 9, 'phone')
    fireEvent.click(screen.getByTestId('rd-prov-half-verbal'))
    expect(
      screen.getByText('Inga riktiga pass tillgängliga för den här halvan.'),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('rd-prov-start')).toBeNull()
    expect(actions.startProvpass).not.toHaveBeenCalled()
  })

  it('discloses partial sources before the start action', () => {
    const data = dataCopy()
    const pass = data.provpass.hub.passes.find(
      (item) => item.half === data.provpass.hub.half && item.suggested,
    )!
    pass.presented = 39
    const { actions } = mountData(data, 9)
    fireEvent.click(screen.getByTestId('rd-prov-start'))
    expect(screen.getByRole('dialog')).toHaveTextContent(
      '1 fråga saknas i källan. Du får 39 frågor.',
    )
    expect(actions.startProvpass).not.toHaveBeenCalled()
  })

  it('omits unsupported flags and blocks answers until all required media has loaded', () => {
    cachedImages = false
    const data = dataCopy()
    delete data.provpass.running.flags
    const run = data.provpass.running
    const q = run.questions[run.current]
    q.figure = {
      src: 'source.svg',
      alt: 'Nödvändigt diagram',
      width: 400,
      height: 300,
      kind: 'svg',
    }
    mountData(data, 9)
    startPass()
    expect(screen.queryByTestId('rd-prov-flag')).toBeNull()
    expect(screen.getByTestId('in-pass-option-A')).toBeDisabled()
    const image = screen.getByRole('img', { name: 'Nödvändigt diagram' })
    fireEvent.error(image)
    expect(screen.getByText('Underlaget kunde inte hämtas.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Försök igen' }))
    fireEvent.load(screen.getByRole('img', { name: 'Nödvändigt diagram' }))
    expect(screen.getByTestId('in-pass-option-A')).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Zooma in' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rotera' }))
    const open = screen.getByRole('button', { name: 'Förstora figur' })
    fireEvent.click(open)
    const viewer = screen.getByRole('dialog', { name: 'Underlag' })
    expect(within(viewer).getByRole('img')).toHaveStyle({
      transform: 'translate(-50%, -50%) rotate(90deg)',
    })
    const before = screen.getByTestId('in-pass-option-A').getAttribute('aria-pressed')
    fireEvent.keyDown(viewer, { key: 'a' })
    expect(screen.getByTestId('in-pass-option-A')).toHaveAttribute('aria-pressed', before)
    fireEvent.click(within(viewer).getByRole('button', { name: 'Stäng figur' }))
    expect(open).toHaveFocus()
    expect(screen.getByText('150 %')).toBeInTheDocument()
  })

  it('shows raw results, source gaps and score provenance without a false review or repetition action', () => {
    const data = dataCopy()
    const result = data.provpass.result
    result.presented = 39
    result.answered = 38
    result.score = { value: 1.2, derived: 'linear', label: 'Skattad' }
    delete result.total
    delete result.trap
    result.history = []
    data.repetera.dueNow = 0
    const { actions } = mountData(data, 10, 'phone')
    expect(screen.getByText('1 fråga saknas i källan — rättat av 39.')).toBeInTheDocument()
    expect(screen.getByTestId('rd-prov-score')).toHaveTextContent(
      'Linjär skattning — indikativ, inte UHR-normerad.',
    )
    expect(screen.queryByRole('button', { name: /Repetera/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /facit/i })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Till Provpass' }))
    expect(actions.go).toHaveBeenCalledWith('provpass')
  })

  it('never presents a numeric result score for a zero denominator', () => {
    const data = dataCopy()
    data.provpass.result.presented = 0
    data.provpass.result.score.value = 1.7
    mountData(data, 10)
    expect(screen.getByTestId('rd-prov-score')).not.toHaveTextContent('1,7')
    expect(screen.getByText('Poäng kan inte beräknas med det här underlaget.')).toBeInTheDocument()
  })

  it('keeps historical practice separate from mock results, without starting a new drill', () => {
    const data = dataCopy()
    const { actions } = mountData(data, 11)
    fireEvent.click(screen.getByRole('tab', { name: 'Historik' }))
    const history = screen.getByTestId('rd-framsteg-history')
    fireEvent.click(within(screen.getByTestId('rd-framsteg-history-item-1')).getByRole('button'))
    expect(
      screen.getByText('Svaren för det här passet är inte tillgängliga här.'),
    ).toBeInTheDocument()
    expect(actions.startDrill).not.toHaveBeenCalled()
    fireEvent.click(within(history).getByRole('button', { name: 'Provpass' }))
    fireEvent.click(within(history).getAllByRole('button', { name: /Öppna resultat/ })[0])
    expect(actions.openProvResult).toHaveBeenCalledWith(data.provpass.hub.results[0].id)
  })

  it('renders missing progress as unmeasured, keeps trend gaps, and exposes all activity values', () => {
    const data = dataCopy()
    data.framsteg.prognosis = { total: null, verbal: null, quant: null, caveat: null }
    data.framsteg.focus = ['KVA']
    data.framsteg.sections.forEach((section) => {
      section.score = null
      section.attempts90d = 0
      delete section.band
    })
    data.framsteg.week = {
      streakDays: 0,
      attemptsThisWeek: 0,
      accuracy7d: null,
      minutesToday: null,
    }
    data.framsteg.history = []
    data.framsteg.weekly.forEach((point, index) => {
      point.score = index === 0 || index === 2 ? 1 : null
    })
    const { actions } = mountData(data, 11, 'phone')
    expect(screen.getByText('Ingen prognos än — börja med en övning.')).toBeInTheDocument()
    expect(screen.queryByText(/Ditt mål/)).toBeNull()
    expect(screen.getAllByText('Ej övat')).toHaveLength(8)
    const plot = screen.getByRole('img', { name: /Veckoutfall på fast skala/ })
    expect(plot.querySelectorAll('.in-trend-line')).toHaveLength(0)
    expect(plot.querySelectorAll('circle')).toHaveLength(2)
    fireEvent.click(screen.getByText('Visa dagar'))
    expect(screen.getByText(data.framsteg.days[0].date)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Till Öva' }))
    expect(actions.go).toHaveBeenCalledWith('ova')
    fireEvent.click(screen.getByRole('tab', { name: 'Historik' }))
    expect(screen.getByText('Inga avslutade pass än.')).toBeInTheDocument()
  })
})

import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  describeDirectionContract,
  mountDirection,
  reveal,
  spyActions,
  stubLayout,
} from '../contract'
import { DirectionDataProvider, FIXTURE_DATA } from '../directionData'
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

function mountData(data: DirectionData, page: AppScreenKey, width: WidthKey = 'desktop') {
  const actions = spyActions()
  const tree = (s: AppScreenKey) => (
    <DirectionDataProvider data={data} actions={actions}>
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
  return { actions, goTo: (s: AppScreenKey) => rendered.rerender(tree(s)) }
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
    expect(actions.drill.exit).toHaveBeenCalledOnce()
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

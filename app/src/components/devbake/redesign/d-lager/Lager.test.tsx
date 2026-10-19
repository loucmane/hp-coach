import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import {
  describeDirectionContract,
  reveal,
  stubLayout,
} from '@/components/devbake/redesign/contract'
import { DirectionDataProvider, FIXTURE_DATA } from '@/components/devbake/redesign/directionData'
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

function oneQuestion(kind: 'reading' | 'quant' | 'dtk'): DirectionData {
  const data = structuredClone(FIXTURE_DATA)
  data.drills[kind].questions = [data.drills[kind].questions[0]]
  data.drills[kind].start = { index: 0, results: [] }
  return data
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
    fireEvent.keyDown(within(viewer).getByRole('region'), { key: 'ArrowRight' })
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

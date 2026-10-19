import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import {
  describeDirectionContract,
  loadImages,
  stubLayout,
} from '@/components/devbake/redesign/contract'
import { DirectionDataProvider, FIXTURE_DATA } from '@/components/devbake/redesign/directionData'
import type { DirectionProps } from '@/components/devbake/redesign/r1Kit'
import type { DirectionActions, DirectionData } from '@/components/devbake/redesign/viewModel'
import { meta } from './meta'
import { Spar } from './Spar'

describeDirectionContract(meta, Spar)

function mount(
  s: DirectionProps['screen'],
  {
    data = FIXTURE_DATA,
    actions = {},
    width = 'desktop',
  }: {
    data?: DirectionData
    actions?: Partial<DirectionActions>
    width?: DirectionProps['width']
  } = {},
) {
  const onScreen = vi.fn()
  const utils = render(
    <DirectionDataProvider data={data} actions={actions}>
      <Spar screen={s} width={width} theme="light" live onScreen={onScreen} onTheme={vi.fn()} />
    </DirectionDataProvider>,
  )
  return { ...utils, onScreen }
}

const clone = () => structuredClone(FIXTURE_DATA)

/** The screen's green pills: filled primary buttons on screen. */
function greenPills(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.sp-btn--primary')).filter(
    (el) => !el.closest('[hidden]'),
  )
}

function key(k: string, init: KeyboardEventInit = {}) {
  fireEvent.keyDown(window, { key: k, ...init })
}

describe('Spår: data, states and interaction', () => {
  beforeAll(stubLayout)

  describe('Idag', () => {
    it('reads Home from the context and leaves out every optional it lacks', () => {
      const data = clone()
      const resume = data.home.resume
      if (!resume) throw new Error('the fixture resumes a sitting')
      delete resume.pausedAt
      delete resume.minutesLeft
      delete resume.device
      data.home.today.greeting = 'God kväll'
      data.home.prognosis = { ...data.home.prognosis, low: undefined, high: undefined, delta: null }
      data.home.week = { minutesToday: null, daysPractised: 3 }
      mount(1, { data })
      const root = screen.getByTestId('rd-spar')
      expect(root).toHaveTextContent('God kväll')
      expect(root).not.toHaveTextContent(/Pausad|min kvar|osäkerhet|sedan förra veckan/)
      expect(root).toHaveTextContent('3 dagar den här veckan')
      expect(root).not.toHaveTextContent(/undefined|NaN/)
      expect(screen.getAllByTestId('rd-resume')).toHaveLength(1)
    })

    it('opens a plan step through the host, and leads with the plan when nothing resumes', () => {
      const data = clone()
      data.home.resume = null
      const openPlanItem = vi.fn()
      mount(1, { data, actions: { openPlanItem } })
      expect(screen.queryByTestId('rd-resume')).toBeNull()
      const [first, second] = data.home.plan.items
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Börja · ${first.minutes}`) }))
      expect(openPlanItem).toHaveBeenLastCalledWith(first.id)
      fireEvent.click(screen.getByRole('button', { name: new RegExp(second.title) }))
      expect(openPlanItem).toHaveBeenLastCalledWith(second.id)
      expect(greenPills()).toHaveLength(1)
    })

    it('asks the host for a destination and the account, and keeps Avsluta-free navigation', () => {
      const go = vi.fn()
      const openKonto = vi.fn()
      const signOut = vi.fn()
      mount(1, { actions: { go, openKonto, signOut } })
      fireEvent.click(screen.getByTestId('rd-nav-ova'))
      expect(go).toHaveBeenCalledWith('ova')
      // A host that does not move still shows the page.
      expect(screen.getByRole('heading', { level: 1, name: 'Alla delprov' })).toBeInTheDocument()
      fireEvent.click(screen.getByTestId('rd-account'))
      fireEvent.click(screen.getByRole('menuitem', { name: 'Konto' }))
      expect(openKonto).toHaveBeenCalled()
      fireEvent.click(screen.getByTestId('rd-account'))
      fireEvent.click(screen.getByRole('menuitem', { name: 'Logga ut' }))
      expect(signOut).toHaveBeenCalled()
    })
  })

  describe('Öva', () => {
    it('leads with the ripe misses: one green pill that starts the round', () => {
      const startDrill = vi.fn()
      mount(5, { actions: { startDrill } })
      const { dueNow, pile } = FIXTURE_DATA.ova.repetera
      expect(screen.getByTestId('rd-ova-repetera')).toHaveTextContent(`${dueNow} missar är redo nu`)
      expect(screen.getByTestId('rd-spar')).toHaveTextContent(`${pile} i dagens hög`)
      const pills = greenPills()
      expect(pills).toHaveLength(1)
      expect(pills[0]).toHaveTextContent(`Repetera ${dueNow} · ca 9 min`)
      key('Enter')
      expect(startDrill).toHaveBeenLastCalledWith({ kind: 'repetition' })
      // The path names the next misses' sections, in play order.
      const path = screen.getByRole('img', { name: /^Nästa missar:/ })
      const due = FIXTURE_DATA.repetera.items.filter((i) => i.dueNow).map((i) => i.section)
      expect(path).toHaveAccessibleName(`Nästa missar: ${due.join(', ')}`)
    })

    it('keeps the official section names, the halves and the round lengths', () => {
      mount(5)
      expect(screen.getByTestId('rd-ova-section-las')).toHaveTextContent('Läsförståelse')
      expect(screen.getByTestId('rd-ova-section-las')).not.toHaveTextContent('Svensk')
      expect(screen.getByTestId('rd-ova-section-dtk')).toHaveTextContent('10–13 frågor · ca 15 min')
      expect(screen.getByRole('heading', { name: 'Verbal del' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Kvantitativ del' })).toBeInTheDocument()
      expect(screen.getByTestId('rd-ova-section-xyz')).toHaveAccessibleName(
        /Matematisk problemlösning, 10 frågor, cirka 8 minuter, 5 väntar, föreslås/,
      )
    })

    it('moves the green pill to the suggested section when nothing is ripe', () => {
      const data = clone()
      data.ova.repetera = { dueNow: 0, pile: 7 }
      const startDrill = vi.fn()
      mount(5, { data, actions: { startDrill } })
      expect(screen.getByTestId('rd-ova-repetera')).toHaveTextContent('Inget är redo just nu')
      expect(screen.getByTestId('rd-spar')).toHaveTextContent('7 missar ligger i dagens hög')
      const pills = greenPills()
      expect(pills).toHaveLength(1)
      expect(pills[0]).toHaveTextContent('Öva XYZ · ca 8 min')
      key('Enter')
      expect(startDrill).toHaveBeenLastCalledWith({ kind: 'section', section: 'XYZ' })
    })

    it('offers a new reader a mixed round as the one green pill', () => {
      const data = clone()
      data.ova.repetera = { dueNow: 0, pile: 0 }
      data.ova.weakest = null
      for (const s of data.ova.sections) s.attempts90d = 0
      const startDrill = vi.fn()
      mount(5, { data, actions: { startDrill } })
      expect(screen.getByTestId('rd-ova-repetera')).toHaveTextContent('Här samlas dina missar')
      const pills = greenPills()
      expect(pills).toHaveLength(1)
      expect(pills[0]).toBe(screen.getByTestId('rd-ova-mixed'))
      fireEvent.click(pills[0])
      expect(startDrill).toHaveBeenLastCalledWith({ kind: 'mixed' })
    })

    it('narrows the round to one section in place, and Esc hands focus back', () => {
      const startDrill = vi.fn()
      mount(5, { actions: { startDrill } })
      const toggle = screen.getByRole('button', { name: 'Bara ett delprov' })
      fireEvent.click(toggle)
      const region = screen.getByRole('region', { name: 'Bara ett delprov' })
      expect(within(region).getByRole('heading', { name: 'Bara ett delprov' })).toHaveFocus()
      const ripe = FIXTURE_DATA.ova.sections.filter((s) => s.dueNow > 0)
      expect(within(region).getAllByRole('button', { name: /redo$/ })).toHaveLength(ripe.length)
      fireEvent.keyDown(region, { key: 'Escape' })
      expect(screen.queryByRole('region', { name: 'Bara ett delprov' })).toBeNull()
      expect(toggle).toHaveFocus()
      fireEvent.click(toggle)
      const reopened = screen.getByRole('region', { name: 'Bara ett delprov' })
      fireEvent.click(within(reopened).getByRole('button', { name: /^Läsförståelse/ }))
      expect(startDrill).toHaveBeenLastCalledWith({ kind: 'repetition', section: 'LÄS' })
    })

    it('opens "Bara ett delprov" as a modal edge sheet on phone', () => {
      mount(5, { width: 'phone' })
      fireEvent.click(screen.getByRole('button', { name: 'Bara ett delprov' }))
      const sheet = screen.getByRole('dialog', { name: 'Bara ett delprov' })
      expect(sheet).toHaveAttribute('aria-modal', 'true')
      fireEvent.keyDown(sheet, { key: 'Escape' })
      expect(screen.queryByRole('dialog', { name: 'Bara ett delprov' })).toBeNull()
    })

    it('gives a recurring trap a quiet home, only from three misses', () => {
      const startDrill = vi.fn()
      const { unmount } = mount(5, { actions: { startDrill } })
      const [trap] = FIXTURE_DATA.ova.weakTraps
      fireEvent.click(screen.getByRole('button', { name: /Riktad repetition/ }))
      expect(startDrill).toHaveBeenLastCalledWith({
        kind: 'framework',
        frameworkId: trap.frameworkId,
        section: trap.section,
      })
      unmount()
      const data = clone()
      for (const t of data.ova.weakTraps) t.count = 2
      mount(5, { data })
      expect(screen.queryByText('Återkommande fälla')).toBeNull()
    })
  })

  describe('Repetera', () => {
    it('shows the round as a path, the rest of the pile on request, and one start', () => {
      const startDrill = vi.fn()
      const go = vi.fn()
      mount(8, { actions: { startDrill, go } })
      const r = FIXTURE_DATA.repetera
      const due = r.items.filter((i) => i.dueNow)
      expect(screen.getByTestId('rd-spar')).toHaveTextContent(
        `Repetera ${due.length} av ${r.pile}, de äldsta först. Ungefär 9 minuter.`,
      )
      const queue = screen.getByRole('list', { name: 'Missar i den ordning de kommer' })
      expect(within(queue).getAllByTestId(/^rd-repetera-item-/)).toHaveLength(due.length)
      const later = r.items.filter((i) => !i.dueNow)
      expect(screen.queryByTestId(`rd-repetera-item-${later[0].n}`)).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: 'Visa dem' }))
      expect(screen.getByTestId(`rd-repetera-item-${later[0].n}`)).toHaveTextContent(
        later[0].dueLabel,
      )
      expect(screen.getByTestId('rd-repetera-start')).toHaveTextContent(
        `Starta repetition · ${due.length} frågor`,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Öva' }))
      expect(go).toHaveBeenCalledWith('ova')
    })

    it('rescopes the round to one section, and the start follows the scope', () => {
      const startDrill = vi.fn()
      mount(8, { actions: { startDrill } })
      fireEvent.click(screen.getByRole('button', { name: 'Bara ett delprov' }))
      fireEvent.click(screen.getByRole('button', { name: /Kvantitativa jämförelser/ }))
      expect(screen.getByText('Repetition · bara KVA')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(
        'Dina missar, bara Kvantitativa jämförelser',
      )
      const kva = FIXTURE_DATA.repetera.items.filter((i) => i.dueNow && i.section === 'KVA')
      expect(screen.getAllByTestId(/^rd-repetera-item-/)).toHaveLength(kva.length)
      fireEvent.click(screen.getByTestId('rd-repetera-start'))
      expect(startDrill).toHaveBeenLastCalledWith({ kind: 'repetition', section: 'KVA' })
    })

    it('draws ten a round and says how many more wait', () => {
      const data = clone()
      const base = data.repetera.items[0]
      data.repetera.items = Array.from({ length: 14 }, (_, i) => ({
        ...base,
        n: i + 1,
        mistakeId: 1000 + i,
        dueNow: true,
      }))
      data.repetera.dueNow = 14
      mount(8, { data })
      expect(screen.getAllByTestId(/^rd-repetera-item-/)).toHaveLength(10)
      expect(screen.getByText(/\+ 4 till väntar i kön/)).toBeInTheDocument()
      expect(screen.getByTestId('rd-repetera-start')).toHaveTextContent('10 frågor')
    })

    it('without ripe misses: no empty start, the green pill names a step that works', () => {
      const data = clone()
      data.repetera = {
        ...data.repetera,
        dueNow: 0,
        items: data.repetera.items.filter((i) => !i.dueNow),
      }
      const startDrill = vi.fn()
      const { unmount } = mount(8, { data, actions: { startDrill } })
      expect(screen.queryByTestId('rd-repetera-start')).toBeNull()
      expect(screen.getByTestId('rd-spar')).toHaveTextContent('Inget är redo just nu.')
      fireEvent.click(screen.getByRole('button', { name: /^Öva XYZ · ca 8 min/ }))
      expect(startDrill).toHaveBeenLastCalledWith({ kind: 'section', section: 'XYZ' })
      unmount()
      const empty = clone()
      empty.repetera = { ...empty.repetera, dueNow: 0, pile: 0, items: [] }
      const go = vi.fn()
      mount(8, { data: empty, actions: { go } })
      expect(screen.getByTestId('rd-spar')).toHaveTextContent('Inget väntar i kön idag.')
      expect(screen.getByTestId('rd-spar')).not.toHaveTextContent('återlärt')
      fireEvent.click(screen.getByRole('button', { name: /^Till Öva/ }))
      expect(go).toHaveBeenCalledWith('ova')
    })
  })

  describe('Kvantfråga', () => {
    it('lays out KVA as two quantities and NOG as two statements, words as the names', () => {
      const data = clone()
      data.drills.quant.start = { index: 1, results: [] }
      const { unmount } = mount(6, { data })
      expect(screen.getByRole('region', { name: 'Kvantitet I' })).toHaveTextContent('x - y')
      expect(screen.getByRole('region', { name: 'Kvantitet II' })).toHaveTextContent('3x - 2y')
      expect(screen.getByTestId('rd-quant-option-A')).toHaveAccessibleName(
        'Alternativ A: I är större än II',
      )
      expect(screen.getByTestId('rd-quant-option-A')).toHaveTextContent('I > II')
      unmount()
      data.drills.quant.start = { index: 2, results: [] }
      mount(6, { data })
      const statements = screen.getByRole('list', { name: 'Påståenden' })
      expect(within(statements).getAllByRole('listitem')).toHaveLength(2)
      expect(screen.getByText('Tillräcklig information för lösningen erhålls')).toBeInTheDocument()
      expect(screen.getByTestId('rd-quant-option-E')).toHaveAccessibleName(
        'Alternativ E: ej genom de båda påståendena',
      )
    })

    it('takes only its own letters, strikes with Shift, never leaves on Esc or a digit', () => {
      const exit = vi.fn()
      const lock = vi.fn(() => ({ correct: false }))
      mount(6, { actions: { drill: { lock, exit } } })
      key('e')
      expect(screen.queryByTestId('rd-quant-option-E')).toBeNull()
      key('a', { shiftKey: true })
      expect(screen.getByTestId('rd-eliminate-A')).toHaveAttribute('aria-pressed', 'true')
      key('Escape')
      key('2')
      expect(exit).not.toHaveBeenCalled()
      key('b')
      expect(screen.getByTestId('rd-quant-option-B')).toHaveAttribute('aria-pressed', 'true')
      key(' ')
      expect(lock).toHaveBeenCalledTimes(1)
      // The controller grades: its verdict stands, even on the right letter.
      expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
      expect(screen.getByTestId('rd-spar')).toHaveTextContent('Lagd i Repetera')
      key('Enter')
      expect(screen.getByTestId('rd-quant-option-A')).toHaveTextContent('I är större än II')
    })

    it('keeps the hint folded until asked for, and shows a verdict without an explanation', () => {
      const data = clone()
      const [xyz] = data.drills.quant.questions
      const tactic = data.drills.quant.explanations[xyz.qid]?.pregrade_tactic
      if (!tactic) throw new Error('the fixture XYZ has a tactic')
      mount(6, { data })
      expect(screen.queryByText(tactic.handle, { exact: false })).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: 'Taktik' }))
      expect(screen.getByText(`${tactic.handle}.`)).toBeInTheDocument()
    })

    it('stands without an explanation', () => {
      const data = clone()
      const [xyz] = data.drills.quant.questions
      data.drills.quant.explanations[xyz.qid] = null
      mount(6, { data })
      fireEvent.click(screen.getByTestId(`rd-quant-option-${xyz.answer}`))
      fireEvent.click(screen.getByTestId('rd-lock'))
      expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'true')
      expect(screen.getByText('Förklaring saknas ännu för den här frågan.')).toBeInTheDocument()
      expect(screen.queryByTestId('rd-technique')).toBeNull()
    })

    it('ends with the plan’s next step and the way back to Öva', () => {
      const data = clone()
      const [xyz] = data.drills.quant.questions
      data.drills.quant.questions = [xyz]
      const openPlanItem = vi.fn()
      const go = vi.fn()
      const next = vi.fn()
      mount(6, {
        data,
        actions: { openPlanItem, go, drill: { lock: () => ({ correct: true }), next } },
      })
      fireEvent.click(screen.getByTestId(`rd-quant-option-${xyz.answer}`))
      fireEvent.click(screen.getByTestId('rd-lock'))
      fireEvent.click(screen.getByTestId('rd-next'))
      expect(next).toHaveBeenCalledWith(null)
      const done = screen.getByTestId('rd-done')
      expect(done).toHaveTextContent('Kvantitativ övning är klar')
      expect(done).toHaveTextContent('1 av 1 rätt')
      const plan = data.home.plan.items[0]
      fireEvent.click(
        within(done).getByRole('button', {
          name: `Fortsätt med ${plan.title} · ${plan.minutes} min`,
        }),
      )
      expect(openPlanItem).toHaveBeenCalledWith(plan.id)
      fireEvent.click(within(done).getByRole('button', { name: 'Tillbaka till Öva' }))
      expect(go).toHaveBeenCalledWith('ova')
    })

    it('marks a repetition: the REP chip, and the schedule in the verdict', () => {
      const data = clone()
      data.drills.quant.request = { kind: 'repetition' }
      mount(6, { data })
      expect(screen.getByTitle('Repetition')).toHaveTextContent('REP')
      const [xyz] = data.drills.quant.questions
      fireEvent.click(screen.getByTestId(`rd-quant-option-${xyz.answer}`))
      fireEvent.click(screen.getByTestId('rd-lock'))
      expect(screen.getByTestId('rd-verdict')).toHaveTextContent('Den flyttas fram')
    })

    it('answers from the phone’s sticky bar, then rises Facit as the edge sheet', () => {
      mount(6, { width: 'phone' })
      const [xyz] = FIXTURE_DATA.drills.quant.questions
      expect(screen.getByTestId('rd-lock')).toBeDisabled()
      fireEvent.click(screen.getByTestId(`rd-quant-option-${xyz.answer}`))
      expect(screen.getByText(`Ditt val: ${xyz.answer}`)).toBeInTheDocument()
      fireEvent.click(screen.getByTestId('rd-lock'))
      expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'open')
      fireEvent.click(screen.getByRole('button', { name: 'Visa uppgiften' }))
      expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'peek')
    })
  })

  describe('DTK', () => {
    it('keeps the question unanswerable while its page has failed, then retries', () => {
      const lock = vi.fn(() => ({ correct: true }))
      mount(7, { actions: { drill: { lock } } })
      const figure = screen.getByTestId('rd-figure')
      fireEvent.error(within(figure).getByRole('img'))
      expect(screen.getByText('Sidan gick inte att hämta.')).toBeInTheDocument()
      expect(screen.getByText('Frågan behöver sidan.')).toBeInTheDocument()
      expect(screen.getByTestId('rd-quant-option-A')).toBeDisabled()
      key('a')
      key('Enter')
      expect(lock).not.toHaveBeenCalled()
      fireEvent.click(screen.getByRole('button', { name: 'Försök igen' }))
      loadImages()
      expect(screen.getByTestId('rd-quant-option-A')).toBeEnabled()
      fireEvent.click(screen.getByTestId('rd-quant-option-C'))
      fireEvent.click(screen.getByTestId('rd-lock'))
      expect(lock).toHaveBeenCalledTimes(1)
    })

    it('says so when the page is missing', () => {
      const data = clone()
      data.drills.dtk.questions[0].figure = null
      mount(7, { data })
      expect(screen.getByText('Sidan saknas.')).toBeInTheDocument()
      expect(screen.getByTestId('rd-quant-option-A')).toBeDisabled()
    })

    it('fits the page to its width or whole, and turns it', () => {
      mount(7)
      const fit = screen.getByRole('group', { name: 'Visa sidan' })
      expect(within(fit).getByRole('radio', { name: 'Bredd' })).toBeChecked()
      fireEvent.click(within(fit).getByRole('radio', { name: 'Hela sidan' }))
      expect(within(fit).getByRole('radio', { name: 'Hela sidan' })).toBeChecked()
      expect(within(fit).getByRole('radio', { name: 'Bredd' })).not.toBeChecked()
      fireEvent.click(screen.getByRole('button', { name: 'Rotera sidan' }))
      expect(screen.getByTestId('rd-figure')).toHaveAttribute('data-turned', 'true')
    })

    it('opens the viewer: zoom, keys kept from the switcher, the question at hand, focus back', () => {
      const lock = vi.fn(() => ({ correct: true }))
      mount(7, { actions: { drill: { lock } } })
      const opener = screen.getByRole('button', { name: /^Förstora/ })
      opener.focus()
      fireEvent.click(opener)
      const viewer = screen.getByRole('dialog', { name: 'Förstorad sida' })
      expect(within(viewer).getByRole('button', { name: /Stäng/ })).toHaveFocus()
      fireEvent.click(within(viewer).getByRole('button', { name: 'Zooma in' }))
      expect(within(viewer).getByText('150 %')).toBeInTheDocument()
      const switcher = vi.fn()
      window.addEventListener('keydown', (e) => {
        if (!e.defaultPrevented) switcher(e.key)
      })
      key('ArrowRight')
      expect(switcher).not.toHaveBeenCalled()
      key('-')
      expect(within(viewer).getByText('100 %')).toBeInTheDocument()
      // Answering while zoomed: the strip's options and Svara.
      fireEvent.click(within(viewer).getByRole('button', { name: /Alternativ C/ }))
      expect(screen.getByTestId('rd-quant-option-C')).toHaveAttribute('aria-pressed', 'true')
      key('Escape')
      expect(screen.queryByRole('dialog', { name: 'Förstorad sida' })).toBeNull()
      expect(opener).toHaveFocus()
      expect(lock).not.toHaveBeenCalled()
    })

    it('peeks the page’s question sheet on phone with the whole question', () => {
      mount(7, { width: 'phone' })
      const sheet = screen.getByTestId('rd-sheet')
      expect(sheet).toHaveAttribute('data-state', 'peek')
      const [q] = FIXTURE_DATA.drills.dtk.questions
      expect(within(sheet).getByTestId('rd-quant-prompt')).toHaveTextContent(q.prompt ?? '')
      fireEvent.click(within(sheet).getByRole('button', { name: /Visa alternativen/ }))
      expect(sheet).toHaveAttribute('data-state', 'open')
    })
  })

  describe('Läsfråga (kit v2)', () => {
    it('reads its session from the context and is graded by the controller', () => {
      const data = clone()
      const session = data.drills.reading
      const q = session.questions[session.start.index ?? 0]
      if (q.passage) q.passage.paragraphs = ['Den tillförda texten.', 'Ett andra stycke.']
      q.prompt = 'Vad säger den tillförda texten?'
      session.elapsedSeconds = undefined
      session.explanations[q.qid] = null
      const lock = vi.fn(() => ({ correct: false }))
      const { onScreen } = mount(2, { data, actions: { drill: { lock } } })
      expect(screen.getByTestId('rd-passage')).toHaveTextContent('Den tillförda texten.')
      expect(screen.getByRole('heading', { name: q.prompt })).toBeInTheDocument()
      // Resumed mid-sitting without its own seconds: no clock from zero.
      expect(screen.queryByRole('timer')).toBeNull()
      fireEvent.click(screen.getByTestId(`rd-option-${q.answer}`))
      fireEvent.click(screen.getByTestId('rd-lock'))
      expect(lock).toHaveBeenCalledWith(expect.objectContaining({ qid: q.qid }), q.answer)
      expect(onScreen).toHaveBeenCalledWith(3)
      expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
      expect(screen.getByText('Förklaring saknas ännu för den här frågan.')).toBeInTheDocument()
    })

    it('links the framework into Uppslag from Facit', () => {
      const openLesson = vi.fn()
      mount(3, { actions: { openLesson } })
      fireEvent.click(screen.getByRole('button', { name: /Slå upp i Uppslag/ }))
      expect(openLesson).toHaveBeenCalledWith(expect.stringMatching(/^LAS-/))
    })

    it('advances with Space only once there is something to advance', () => {
      const lock = vi.fn(() => ({ correct: true }))
      mount(2, { actions: { drill: { lock } } })
      key(' ')
      expect(lock).not.toHaveBeenCalled()
      key('a')
      act(() => {
        key(' ')
      })
      expect(lock).toHaveBeenCalledTimes(1)
    })
  })
})

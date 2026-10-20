import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import {
  describeDirectionContract,
  loadImages,
  stubLayout,
} from '@/components/devbake/redesign/contract'
import { DirectionDataProvider, FIXTURE_DATA } from '@/components/devbake/redesign/directionData'
import type { DirectionProps } from '@/components/devbake/redesign/r1Kit'
import type {
  DirectionActions,
  DirectionData,
  DrillQuestion,
} from '@/components/devbake/redesign/viewModel'
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

/** A box's place on screen, for the layout jsdom does not have. */
function rect(top: number, height: number): DOMRect {
  return {
    top,
    bottom: top + height,
    height,
    left: 0,
    right: 0,
    width: 0,
    x: 0,
    y: top,
    toJSON: () => ({}),
  }
}

/** Opens the phone's "Bara ett delprov" sheet on screen `s`, then checks
 *  that Tab never leaves it: from the heading it opens on, from its last
 *  control and from its first. Esc closes it with focus back on its
 *  button. */
async function expectScopeSheetKeepsFocus(s: DirectionProps['screen']) {
  const user = userEvent.setup()
  mount(s, { width: 'phone' })
  const toggle = screen.getByRole('button', { name: 'Bara ett delprov' })
  await user.click(toggle)
  const sheet = screen.getByRole('dialog', { name: 'Bara ett delprov' })
  expect(within(sheet).getByRole('heading', { name: 'Bara ett delprov' })).toHaveFocus()
  const controls = within(sheet).getAllByRole('button')
  const first = controls[0]
  const last = controls[controls.length - 1]
  expect(controls.length).toBeGreaterThan(1)
  // Straight from the heading, before anything else: round to the end.
  await user.tab({ shift: true })
  expect(last).toHaveFocus()
  await user.tab()
  expect(first).toHaveFocus()
  await user.tab({ shift: true })
  expect(last).toHaveFocus()
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog', { name: 'Bara ett delprov' })).toBeNull()
  expect(toggle).toHaveFocus()
}

/** A mixed round whose first question is a LÄS question with its passage
 *  (Läsfråga's question 3, whose second step cites ¶ 6 with two
 *  quotations), as a repetition of misses from several sections plays. */
function passageRound(): { data: DirectionData; q: DrillQuestion } {
  const data = clone()
  const reading = data.drills.reading
  const q = reading.questions[2]
  data.drills.quant = {
    ...data.drills.quant,
    request: { kind: 'repetition' },
    questions: [q, ...data.drills.quant.questions],
    explanations: { ...data.drills.quant.explanations, [q.qid]: reading.explanations[q.qid] },
    start: { index: 0, results: [] },
  }
  return { data, q }
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

    it('keeps Tab inside the phone sheet, from the heading it opens on', async () => {
      await expectScopeSheetKeepsFocus(5)
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

    it('keeps Tab inside the phone scope sheet, from the heading it opens on', async () => {
      await expectScopeSheetKeepsFocus(8)
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

    it('takes the step its end shows with Enter too, past the repetition just done', () => {
      const data = clone()
      const [xyz] = data.drills.quant.questions
      data.drills.quant.questions = [xyz]
      data.drills.quant.request = { kind: 'repetition' }
      const [rep, after] = data.home.plan.items
      expect(rep).toMatchObject({ kind: 'repetition', completed: false })
      expect(after.completed).toBe(false)
      const openPlanItem = vi.fn()
      mount(6, { data, actions: { openPlanItem } })
      fireEvent.click(screen.getByTestId(`rd-quant-option-${xyz.answer}`))
      fireEvent.click(screen.getByTestId('rd-lock'))
      fireEvent.click(screen.getByTestId('rd-next'))
      const done = screen.getByTestId('rd-done')
      expect(done).toHaveTextContent('Repetition klar')
      const pill = within(done).getByRole('button', {
        name: `Fortsätt med ${after.title} · ${after.minutes} min`,
      })
      key('Enter')
      expect(openPlanItem).toHaveBeenCalledTimes(1)
      expect(openPlanItem).toHaveBeenLastCalledWith(after.id)
      fireEvent.click(pill)
      expect(openPlanItem).toHaveBeenLastCalledWith(after.id)
      expect(openPlanItem).not.toHaveBeenCalledWith(rep.id)
    })

    it('goes back with Enter when the repetition just done was the plan’s only step', () => {
      const data = clone()
      const [xyz] = data.drills.quant.questions
      data.drills.quant.questions = [xyz]
      data.drills.quant.request = { kind: 'repetition' }
      const rep = data.home.plan.items.find((i) => i.kind === 'repetition')
      if (!rep) throw new Error('the fixture plan has a repetition step')
      data.home.plan.items = [rep]
      const openPlanItem = vi.fn()
      const go = vi.fn()
      mount(6, { data, actions: { openPlanItem, go } })
      fireEvent.click(screen.getByTestId(`rd-quant-option-${xyz.answer}`))
      fireEvent.click(screen.getByTestId('rd-lock'))
      fireEvent.click(screen.getByTestId('rd-next'))
      const pills = greenPills()
      expect(pills).toHaveLength(1)
      expect(pills[0]).toHaveAccessibleName('Tillbaka till Öva')
      key('Enter')
      expect(go).toHaveBeenCalledWith('ova')
      expect(openPlanItem).not.toHaveBeenCalled()
    })

    const widths = ['desktop', 'phone'] as const
    it.each(widths)('turns to a cited paragraph of a passage across sections (%s)', (width) => {
      const { data, q } = passageRound()
      mount(6, { data, width })
      const wrong = q.options?.find((o) => o.letter !== q.answer)?.letter ?? 'A'
      fireEvent.click(screen.getByTestId(`rd-quant-option-${wrong}`))
      fireEvent.click(screen.getByTestId('rd-lock'))
      const para = document.querySelector<HTMLElement>('.sp-qpara[data-n="6"]')
      if (!para) throw new Error('the passage shows its sixth paragraph')
      expect(para).toHaveAttribute('data-cited', 'true')
      expect(para).toHaveAttribute('data-flash', 'false')
      const column = para.closest<HTMLElement>(width === 'phone' ? '.sp-qpscroll' : '.sp-qscroll')
      if (!column) throw new Error('the passage sits in the drill’s column')
      // The layout jsdom lacks: the column scrolls and is 400 px tall,
      // paragraph 6 lies 900 px down it.
      column.style.overflowY = 'auto'
      const scrollTo = vi.fn()
      column.scrollTo = scrollTo
      vi.spyOn(column, 'getBoundingClientRect').mockReturnValue(rect(0, 400))
      vi.spyOn(para, 'getBoundingClientRect').mockReturnValue(rect(900, 60))
      const frame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        cb(0)
        return 0
      })
      try {
        fireEvent.click(within(screen.getByTestId('rd-step-2')).getByTestId('rd-cite-6'))
      } finally {
        frame.mockRestore()
      }
      // Centred in the column: 900 − (400 − 60) / 2.
      expect(scrollTo).toHaveBeenCalledWith({ top: 730, behavior: 'smooth' })
      expect(para).toHaveAttribute('data-flash', 'true')
      // The step's two quotations are marked where they stand.
      expect(para.querySelectorAll('mark')).toHaveLength(2)
      if (width === 'desktop') {
        // As on Läsfråga, Facit drops below half to leave the text in view.
        expect(document.querySelector('.sp-fsheet')).toHaveAttribute('data-state', 'half')
      }
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

    it('takes no answer before its page is on screen: loading, after a retry, then the same page', () => {
      const lock = vi.fn(() => ({ correct: true }))
      const data = clone()
      const [q] = data.drills.dtk.questions
      data.drills.dtk.questions = [q, { ...q, qid: `${q.qid}-2`, number: q.number + 1 }]
      mount(7, { data, actions: { drill: { lock } } })
      const option = () => screen.getByTestId('rd-quant-option-A')
      // Still loading: nothing to choose or answer yet.
      expect(option()).toBeDisabled()
      key('a')
      key('Enter')
      expect(option()).toHaveAttribute('aria-pressed', 'false')
      expect(lock).not.toHaveBeenCalled()
      // Failed, then retried: loading again, and still closed.
      fireEvent.error(within(screen.getByTestId('rd-figure')).getByRole('img'))
      fireEvent.click(screen.getByRole('button', { name: 'Försök igen' }))
      expect(screen.queryByText('Frågan behöver sidan.')).toBeNull()
      expect(option()).toBeDisabled()
      key('a')
      key('Enter')
      expect(lock).not.toHaveBeenCalled()
      // On screen: answerable.
      loadImages()
      expect(option()).toBeEnabled()
      key(q.answer.toLowerCase())
      key('Enter')
      expect(lock).toHaveBeenCalledTimes(1)
      // The next question on the same page needs no new load.
      key('Enter')
      expect(screen.getByText('Fråga 2 av 2 på den här sidan')).toBeInTheDocument()
      expect(option()).toBeEnabled()
      key('a')
      key('Enter')
      expect(lock).toHaveBeenCalledTimes(2)
    })

    it('keeps the phone’s sheet and the viewer’s strip closed to answers until the page is on screen', () => {
      const lock = vi.fn(() => ({ correct: true }))
      const { unmount } = mount(7, { width: 'phone', actions: { drill: { lock } } })
      fireEvent.click(screen.getByRole('button', { name: /Visa alternativen/ }))
      expect(screen.getByTestId('rd-quant-option-A')).toBeDisabled()
      key('a')
      key('Enter')
      expect(lock).not.toHaveBeenCalled()
      loadImages()
      fireEvent.click(screen.getByTestId('rd-quant-option-A'))
      fireEvent.click(screen.getByTestId('rd-lock'))
      expect(lock).toHaveBeenCalledTimes(1)
      unmount()
      mount(7, { actions: { drill: { lock } } })
      fireEvent.click(screen.getByRole('button', { name: /^Förstora/ }))
      const viewer = screen.getByRole('dialog', { name: 'Förstorad sida' })
      expect(within(viewer).getByRole('button', { name: /Alternativ A/ })).toBeDisabled()
      key('a')
      key('Enter')
      expect(lock).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('dialog', { name: 'Förstorad sida' })).toBeInTheDocument()
      loadImages()
      fireEvent.click(within(viewer).getByRole('button', { name: /Alternativ A/ }))
      key('Enter')
      expect(lock).toHaveBeenCalledTimes(2)
      expect(screen.queryByRole('dialog', { name: 'Förstorad sida' })).toBeNull()
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
      // The page is on screen, so its question takes answers.
      loadImages()
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

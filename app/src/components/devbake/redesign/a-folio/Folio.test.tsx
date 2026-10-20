import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  describeDirectionContract,
  loadImages,
  reveal,
  stubLayout,
} from '@/components/devbake/redesign/contract'
import { DirectionDataProvider, FIXTURE_DATA } from '@/components/devbake/redesign/directionData'
import type { DrillController } from '@/components/devbake/redesign/drillCore'
import type { DirectionProps } from '@/components/devbake/redesign/r1Kit'
import type { DirectionActions, DirectionData } from '@/components/devbake/redesign/viewModel'
import { Folio } from './Folio'
import { meta } from './meta'

describeDirectionContract(meta, Folio)

type Mount = {
  data?: DirectionData
  actions?: Partial<DirectionActions>
  width?: DirectionProps['width']
}

function mount(s: DirectionProps['screen'], opts: Mount = {}) {
  let data = opts.data ?? structuredClone(FIXTURE_DATA)
  let shown = s
  const width = opts.width ?? 'desktop'
  const onScreen = vi.fn()
  const tree = () => (
    <DirectionDataProvider data={data} actions={opts.actions}>
      <Folio
        screen={shown}
        width={width}
        theme="light"
        live
        onScreen={onScreen}
        onTheme={vi.fn()}
      />
    </DirectionDataProvider>
  )
  const utils = render(tree())
  return {
    ...utils,
    onScreen,
    goTo: (next: DirectionProps['screen']) => {
      shown = next
      utils.rerender(tree())
    },
    /** The provider hands down new data, as the host does when it changes. */
    supply: (next: DirectionData) => {
      data = next
      utils.rerender(tree())
    },
  }
}

const press = (key: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(window, { key, ...init })

beforeAll(stubLayout)

describe('Folio · Idag on the data context', () => {
  it('keeps round 1’s page word for word on the fixture day', () => {
    mount(1)
    expect(
      screen.getByText(
        'Idag: läs klart texten, repetera åtta missar, gör en kort ELF-lektion och en snabb ORD-övning – ungefär 25 minuter.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Pausad idag 07:52 på telefonen')).toBeInTheDocument()
    expect(screen.getByText('Fråga 3 av 4 · ca 6 min kvar')).toBeInTheDocument()
    expect(
      screen.getByText('14 minuter idag · fyra av fem dagar den här veckan'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Trolig nivå 1,3 till 1,6 på skalan 0 till 2,0' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('rd-nav-ova')).toHaveTextContent('23')
  })

  it('reads changed data and leaves out every field the view model lacks', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.home.today.greeting = 'God morgon'
    if (data.home.resume) {
      delete data.home.resume.pausedAt
      delete data.home.resume.device
      delete data.home.resume.minutesLeft
    }
    data.home.prognosis = { ...data.home.prognosis, low: undefined, high: undefined, delta: null }
    data.home.week = { minutesToday: 14, daysPractised: 4 }
    mount(1, { data })
    expect(screen.getByRole('heading', { level: 1, name: 'God morgon.' })).toBeInTheDocument()
    expect(screen.queryByText(/Pausad/)).toBeNull()
    expect(screen.queryByText(/min kvar/)).toBeNull()
    expect(screen.queryByText(/sedan förra veckan/)).toBeNull()
    expect(screen.getByText(/resten av planen tar ungefär 19 minuter\.$/)).toBeInTheDocument()
    expect(screen.getByText('14 minuter idag · fyra dagar den här veckan')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /^Prognos 1,4 på skalan/ })).toBeInTheDocument()
    expect(screen.getByTestId('rd-folio')).not.toHaveTextContent(/undefined|NaN/)
  })

  it('opens a plan row’s own item, and leads with the plan when nothing is paused', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.home.resume = null
    const openPlanItem = vi.fn()
    mount(1, { data, actions: { openPlanItem } })
    expect(screen.queryByTestId('rd-resume')).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'Repetition' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Börja · 9 min/ }))
    expect(openPlanItem).toHaveBeenLastCalledWith('rep')
    const lesson = screen.getByText(data.home.plan.items[1].rationale).closest('button')
    if (!lesson) throw new Error('the lesson row is not a button')
    fireEvent.click(lesson)
    expect(openPlanItem).toHaveBeenLastCalledWith(data.home.plan.items[1].id)
  })

  it('asks the host for a destination and turns to the pages it has built', () => {
    const go = vi.fn()
    mount(1, { actions: { go } })
    fireEvent.click(screen.getByTestId('rd-nav-ova'))
    expect(go).toHaveBeenLastCalledWith('ova')
    expect(screen.getByRole('heading', { level: 1, name: 'Vad tränar vi?' })).toBeInTheDocument()
    expect(screen.getByTestId('rd-nav-ova')).toHaveAttribute('aria-current', 'page')
    fireEvent.click(screen.getByTestId('rd-nav-provpass'))
    expect(go).toHaveBeenLastCalledWith('provpass')
    // Provpass is the host's to show (its "Inte byggd än" card): no stub.
    expect(screen.getByRole('heading', { level: 1, name: 'Vad tränar vi?' })).toBeInTheDocument()
  })
})

describe('Folio · Öva', () => {
  it('leads with the round, starts it on ↵, and sets the register as contents', () => {
    const startDrill = vi.fn()
    const openKonto = vi.fn()
    mount(5, { actions: { startDrill, openKonto } })
    expect(screen.getByRole('heading', { level: 2, name: 'Åtta missar, ungefär 9 minuter' }))
    expect(
      screen.getByText(
        'Schemat föreslår XYZ – svagast just nu. Välj fritt om du hellre tar något annat.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('15 till blir redo senare idag')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Börja repetera/ }))
    expect(startDrill).toHaveBeenLastCalledWith({ kind: 'repetition' })
    startDrill.mockClear()
    press('Enter')
    expect(startDrill).toHaveBeenLastCalledWith({ kind: 'repetition' })
    const xyz = screen.getByTestId('rd-ova-section-xyz')
    expect(xyz.closest('[data-suggested]')).toHaveAttribute('data-suggested', 'true')
    expect(xyz).toHaveTextContent('5 missar väntar i Repetera')
    expect(xyz).toHaveAccessibleName(/^XYZ, Matematisk problemlösning, nivå \d,\d, föreslagen/)
    expect(screen.getByRole('heading', { level: 3, name: 'Verbal del' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Kvantitativ del' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Öva detta mönster/ }))
    expect(startDrill).toHaveBeenLastCalledWith({
      kind: 'framework',
      frameworkId: 'LAS-TYPE-003',
      section: 'LÄS',
    })
    fireEvent.click(screen.getByRole('button', { name: /Ändra i inställningarna/ }))
    expect(openKonto).toHaveBeenCalled()
  })

  it('offers a mixed set to a new reader, with nothing to repeat yet', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.ova.repetera = { dueNow: 0, pile: 0 }
    data.ova.weakest = null
    data.ova.sections = data.ova.sections.map((s) => ({ ...s, waiting: 0, dueNow: 0 }))
    data.framsteg.totals.mistakesResolved = 0
    const startDrill = vi.fn()
    mount(5, { data, actions: { startDrill } })
    expect(screen.getByRole('heading', { level: 2, name: 'Blandad övning' })).toBeInTheDocument()
    expect(
      screen.getByText('Välj ett delprov att öva, eller ta en blandad övning över alla åtta.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Inga missar än – när du svarar fel i en övning landar frågan här.'),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('rd-ova-repetera')).toBeNull()
    expect(screen.getAllByTestId('rd-ova-mixed')).toHaveLength(1)
    fireEvent.click(screen.getByTestId('rd-ova-mixed'))
    expect(startDrill).toHaveBeenLastCalledWith({ kind: 'mixed' })
  })

  it('suggests the weakest section when misses wait but none is ready', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.ova.repetera = { dueNow: 0, pile: 3 }
    const startDrill = vi.fn()
    mount(5, { data, actions: { startDrill } })
    expect(
      screen.getByText(
        'Inget är redo just nu – tre missar ligger i dagens hög och blir redo senare idag.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Matematisk problemlösning' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Börja med XYZ/ }))
    expect(startDrill).toHaveBeenLastCalledWith({ kind: 'section', section: 'XYZ' })
    expect(screen.getByTestId('rd-ova-repetera')).toHaveTextContent('0 redo nu')
  })
})

describe('Folio · Repetera', () => {
  it('starts the round, offers each section’s own round and folds the later misses', () => {
    const startDrill = vi.fn()
    mount(8, { actions: { startDrill } })
    expect(screen.getByRole('heading', { level: 2, name: 'Åtta missar' })).toBeInTheDocument()
    expect(screen.getByText('ungefär 9 minuter')).toBeInTheDocument()
    expect(screen.getByTestId('rd-nav-ova')).toHaveAttribute('aria-current', 'page')
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Repetera bara KVA, Kvantitativa jämförelser, 2 redo nu',
      }),
    )
    expect(startDrill).toHaveBeenLastCalledWith({ kind: 'repetition', section: 'KVA' })
    // ORD and MEK have nothing ready: plain rows that say when, no button.
    expect(screen.getAllByText('Tre blir redo senare idag')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /Repetera bara ORD/ })).toBeNull()
    expect(screen.queryByTestId('rd-repetera-item-9')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Visa de 15 som blir redo senare' }))
    expect(screen.getByTestId('rd-repetera-item-9')).toHaveTextContent('ORD')
    fireEvent.click(screen.getByTestId('rd-repetera-start'))
    expect(startDrill).toHaveBeenLastCalledWith({ kind: 'repetition' })
  })

  it('lists the later misses outright once nothing is ready, with nothing to unfold', () => {
    const { supply } = mount(8)
    expect(screen.queryByTestId('rd-repetera-item-9')).toBeNull()
    // The round is done: the host's queue keeps only the later misses.
    const data = structuredClone(FIXTURE_DATA)
    const later = data.repetera.items.filter((i) => !i.dueNow)
    data.repetera = { ...data.repetera, dueNow: 0, pile: later.length, items: later }
    supply(data)
    expect(screen.queryByRole('button', { name: /som blir redo senare/ })).toBeNull()
    expect(screen.getAllByTestId(/^rd-repetera-item-/)).toHaveLength(15)
  })

  it('shows each miss by its stem: NOG’s question, KVA’s quantities, the trap behind it', () => {
    mount(8)
    const nog = screen.getByTestId('rd-repetera-item-4')
    expect(nog).toHaveTextContent('Vilket värde har x + y?')
    expect(nog).not.toHaveTextContent('Tillräcklig information')
    expect(screen.getByTestId('rd-repetera-item-1')).toHaveTextContent(
      'y > 0 · I: x - y · II: 3x - 2y',
    )
    expect(screen.getByTestId('rd-repetera-item-1')).toHaveTextContent(/Fälla: /)
  })

  it('says why the queue is empty and points at a drill instead', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.repetera = { ...data.repetera, dueNow: 0, pile: 0, items: [] }
    const startDrill = vi.fn()
    mount(8, { data, actions: { startDrill }, width: 'phone' })
    expect(screen.getByText('Kön är tom just nu – allt du missat är återlärt.')).toBeInTheDocument()
    expect(screen.queryByTestId('rd-repetera-start')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Börja en övning i XYZ/ }))
    expect(startDrill).toHaveBeenLastCalledWith({ kind: 'section', section: 'XYZ' })
    expect(screen.getByTestId('rd-account')).toBeInTheDocument()
  })
})

describe('Folio · the reading drill on the kit', () => {
  it('reads the supplied sitting and lets the controller grade it', () => {
    const data = structuredClone(FIXTURE_DATA)
    const session = data.drills.reading
    const q = session.questions[session.start.index ?? 0]
    q.prompt = 'Vilket påstående stöds av den nya texten?'
    if (q.passage) q.passage.paragraphs = ['Det här är den tillförda texten.']
    session.explanations[q.qid] = null
    const lock = vi.fn(() => ({ correct: false }))
    const { onScreen } = mount(2, { data, actions: { drill: { lock } } })
    expect(screen.getByTestId('rd-passage')).toHaveTextContent('Det här är den tillförda texten.')
    expect(screen.getByRole('heading', { level: 2, name: q.prompt })).toBeInTheDocument()
    fireEvent.click(screen.getByTestId(`rd-option-${q.answer}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(lock).toHaveBeenCalledWith(expect.objectContaining({ qid: q.qid }), q.answer)
    expect(onScreen).toHaveBeenCalledWith(3)
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
    expect(screen.getByText('Förklaring saknas ännu för den här frågan.')).toBeInTheDocument()
  })

  it('leaves for where the reader came from: Idag by the switcher, Öva by the controller', () => {
    const exit = vi.fn()
    const lock = vi.fn(() => ({ correct: true }))
    const fromIdag = mount(2, { actions: { drill: { lock, exit } } })
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(fromIdag.onScreen).toHaveBeenCalledWith(1)
    expect(exit).toHaveBeenCalledTimes(1)
    fromIdag.unmount()
    const fromOva = mount(5, { actions: { drill: { lock, exit } } })
    fromOva.goTo(2)
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(fromOva.onScreen).not.toHaveBeenCalledWith(1)
    expect(exit).toHaveBeenCalledTimes(2)
  })
})

describe('Folio · a sitting the host replaces', () => {
  it.each([
    [2, 'desktop'],
    [2, 'phone'],
    [6, 'desktop'],
    [6, 'phone'],
  ] as const)('screen %i on %s opens a new sitting at its own start, and keeps its place through an update', (s, width) => {
    const data = structuredClone(FIXTURE_DATA)
    const kind = s === 2 ? 'reading' : 'quant'
    data.drills[kind].start = { index: 1, results: [] }
    const lock = vi.fn<DrillController['lock']>(() => ({ correct: true }))
    const { supply } = mount(s, { data, width, actions: { drill: { lock } } })
    expect(screen.getByText(/^Fråga 2 av \d$/)).toBeInTheDocument()
    // A new sitting, one question long, from its first question.
    const next = structuredClone(data)
    const old = next.drills[kind]
    const q = old.questions[2]
    next.drills[kind] = {
      ...old,
      id: `${old.id}-next`,
      questions: [q],
      start: { index: 0, results: [] },
    }
    supply(next)
    expect(screen.getByText('Fråga 1 av 1')).toBeInTheDocument()
    fireEvent.click(reveal(`${s === 2 ? 'rd-option' : 'rd-quant-option'}-${q.answer}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(lock).toHaveBeenLastCalledWith(expect.objectContaining({ qid: q.qid }), q.answer)
    // The same sitting, updated: the verdict stays and the update shows.
    const update = structuredClone(next)
    update.drills[kind].explanations[q.qid] = null
    supply(update)
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'true')
    expect(screen.getByText('Förklaring saknas ännu för den här frågan.')).toBeInTheDocument()
  })
})

describe('Folio · Kvantfråga', () => {
  it('sets XYZ, KVA and NOG the textbook way and keeps the keys to the drill', () => {
    const lock = vi.fn<DrillController['lock']>((q, l) => ({ correct: q.answer === l }))
    const exit = vi.fn()
    const next = vi.fn()
    mount(6, { actions: { drill: { lock, exit, next } } })
    // XYZ: the tactic hangs in the margin until the answer.
    expect(screen.getByRole('complementary', { name: 'Taktik' })).toHaveTextContent(
      'Stapelbråksreceptet',
    )
    expect(document.querySelector('.fo-qnum')).toHaveTextContent('1')
    press('e') // no E on a four-option problem
    press('1') // the switcher's
    press('Escape') // never leaves
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0)
    expect(exit).not.toHaveBeenCalled()
    press(' ') // Space never answers
    expect(lock).not.toHaveBeenCalled()
    press('a', { shiftKey: true })
    expect(screen.getByTestId('rd-eliminate-A')).toHaveAttribute('aria-pressed', 'true')
    press('b')
    expect(screen.getByTestId('rd-quant-option-B')).toHaveAttribute('aria-pressed', 'true')
    press('Enter')
    expect(lock).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('rd-verdict')).toHaveFocus()
    expect(screen.queryByRole('complementary', { name: 'Taktik' })).toBeNull()
    expect(screen.getByRole('region', { name: 'Uppgift 1' })).toBeInTheDocument()
    press(' ')
    expect(next).toHaveBeenLastCalledWith(1)
    // KVA: the condition, then the quantities side by side in a table.
    expect(screen.getByRole('heading', { level: 2, name: 'y > 0' })).toBeInTheDocument()
    const table = screen.getByRole('table')
    expect(within(table).getByRole('columnheader', { name: 'Kvantitet I' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Kvantitet II' })).toBeInTheDocument()
    expect(
      within(table)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['x - y', '3x - 2y'])
    press('d')
    press('Enter')
    press('Enter')
    // NOG: the question, two hanging statements and the lead-in.
    expect(screen.getByRole('heading', { level: 2, name: /Vilket värde har x \+ y\?/ }))
    expect(
      within(screen.getByRole('list', { name: 'Påståenden' })).getAllByRole('listitem'),
    ).toHaveLength(2)
    expect(screen.getByText('Tillräcklig information för lösningen erhålls')).toBeInTheDocument()
    expect(screen.getByTestId('rd-quant-option-E')).toBeInTheDocument()
  })

  it('ends in a colophon whose round list opens each question’s facit', () => {
    const openPlanItem = vi.fn()
    mount(6, { actions: { openPlanItem } })
    for (const letter of ['D', 'D', 'B']) {
      fireEvent.click(screen.getByTestId(`rd-quant-option-${letter}`))
      fireEvent.click(screen.getByTestId('rd-lock'))
      fireEvent.click(screen.getByTestId('rd-next'))
    }
    const done = screen.getByTestId('rd-done')
    expect(done).toHaveTextContent('3 frågor · 2 rätt')
    expect(done).toHaveTextContent('Missen väntar i nästa repetition')
    fireEvent.click(screen.getByRole('button', { name: 'Hela passet' }))
    const third = screen.getByRole('button', {
      name: 'Fråga 3, NOG, fel: ditt B, rätt A. Visa facit',
    })
    fireEvent.click(third)
    expect(screen.getByRole('button', { name: /Tillbaka till passet/ })).toHaveFocus()
    expect(screen.getByTestId('rd-verdict')).toHaveTextContent('Rätt svar är A.')
    expect(screen.getByTestId('rd-distractor-B')).toHaveTextContent('Därför lockade B')
    fireEvent.click(screen.getByRole('button', { name: /Tillbaka till passet/ }))
    fireEvent.click(screen.getByTestId('rd-done-next'))
    expect(openPlanItem).toHaveBeenCalledWith('rep')
  })

  it('on phone puts the verdict above the graded options, the problem a press away', () => {
    mount(6, { width: 'phone' })
    expect(screen.queryByTestId('rd-sheet')).toBeNull()
    fireEvent.click(screen.getByTestId('rd-quant-option-A'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    const verdict = screen.getByTestId('rd-verdict')
    const graded = screen.getByRole('list', { name: 'Svarsalternativ, rättade' })
    expect(verdict.compareDocumentPosition(graded) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole('button', { name: /Visa uppgiften/ })).toBeInTheDocument()
    expect(screen.getByTestId('rd-next')).toHaveTextContent('Nästa fråga')
  })

  it('in a repetition round says Miss, moves on with Nästa miss and says when a miss returns', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.drills.quant.request = { kind: 'repetition' }
    mount(6, { data })
    expect(screen.getByText('Repetition · XYZ')).toBeInTheDocument()
    expect(screen.getByText('Miss 1 av 3')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-quant-option-A'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(screen.getByTestId('rd-verdict')).toHaveTextContent(
      'Frågan kommer tillbaka om tio minuter.',
    )
    expect(screen.getByTestId('rd-next')).toHaveTextContent('Nästa miss')
  })

  describe('with a figure', () => {
    afterEach(() => vi.unstubAllGlobals())

    it('inlines an SVG figure so it takes the ink colour, named by its alt', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          text: async () =>
            '<svg viewBox="0 0 10 10"><path d="M0 0L10 10" stroke="currentColor"/></svg>',
        })),
      )
      const data = structuredClone(FIXTURE_DATA)
      data.drills.quant.questions[0].figure = {
        src: 'figures/test-figure.svg',
        alt: 'Figur till uppgift 9',
        width: 1000,
        height: 600,
        kind: 'svg',
      }
      mount(6, { data })
      const figure = await screen.findByRole('img', { name: 'Figur till uppgift 9' })
      await vi.waitFor(() => expect(figure.querySelector('svg')).not.toBeNull())
      expect(figure.querySelector('svg')).toHaveAttribute('width', '100%')
      expect(screen.getByRole('button', { name: /Förstora/ })).toBeInTheDocument()
    })

    it('keeps an SVG figure in the finished round’s facit, Förstora and all', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          text: async () =>
            '<svg viewBox="0 0 10 10"><path d="M0 0L10 10" stroke="currentColor"/></svg>',
        })),
      )
      const data = structuredClone(FIXTURE_DATA)
      const [q] = data.drills.quant.questions
      q.figure = {
        src: 'figures/review-figure.svg',
        alt: 'Figur till uppgift 1',
        width: 1000,
        height: 600,
        kind: 'svg',
      }
      data.drills.quant.questions = [q]
      const openPlanItem = vi.fn()
      mount(6, { data, actions: { openPlanItem } })
      const name = 'Figur till uppgift 1'
      expect(screen.getByRole('img', { name })).toBeInTheDocument()
      fireEvent.click(screen.getByTestId(`rd-quant-option-${q.answer}`))
      fireEvent.click(screen.getByTestId('rd-lock'))
      expect(screen.getByRole('img', { name })).toBeInTheDocument()
      fireEvent.click(screen.getByTestId('rd-next'))
      fireEvent.click(screen.getByRole('button', { name: 'Hela passet' }))
      fireEvent.click(screen.getByRole('button', { name: 'Fråga 1, XYZ, rätt. Visa facit' }))
      const figure = screen.getByRole('img', { name })
      await waitFor(() => expect(figure.querySelector('svg')).not.toBeNull())
      const zoom = screen.getByRole('button', { name: 'Förstora' })
      zoom.focus()
      fireEvent.click(zoom)
      const viewer = screen.getByRole('dialog', { name: 'Förstorad figur' })
      await waitFor(() =>
        expect(within(viewer).getByRole('img', { name }).querySelector('svg')).not.toBeNull(),
      )
      press('Enter') // the colophon's keys rest while it is open
      expect(openPlanItem).not.toHaveBeenCalled()
      press('Escape')
      expect(screen.queryByRole('dialog')).toBeNull()
      await waitFor(() => expect(zoom).toHaveFocus())
    })

    it('tries an option’s new picture after its old one failed, on the same question', () => {
      const data = structuredClone(FIXTURE_DATA)
      const option = data.drills.quant.questions[0].options?.[0]
      if (!option) throw new Error('the first problem has no options')
      const name = 'Ett stapeldiagram'
      option.text = name
      option.figure = { src: 'figures/old-option.png', alt: name, width: 240, height: 160 }
      const { supply } = mount(6, { data })
      fireEvent.click(screen.getByTestId('rd-quant-option-A'))
      fireEvent.error(screen.getByRole('img', { name }))
      expect(screen.queryByRole('img', { name })).toBeNull()
      expect(screen.getByTestId('rd-quant-option-A')).toHaveTextContent(name)
      // The host sends a new picture for the same option.
      const next = structuredClone(data)
      const figure = next.drills.quant.questions[0].options?.[0].figure
      if (!figure) throw new Error('the option lost its picture')
      figure.src = 'figures/new-option.png'
      supply(next)
      expect(screen.getByRole('img', { name })).toHaveAttribute('src', '/figures/new-option.png')
      expect(screen.getByTestId('rd-quant-option-A')).toHaveAttribute('aria-pressed', 'true')
    })
  })
})

describe('Folio · DTK', () => {
  it('tips the page in as a plate with its caption and keeps it across its questions', () => {
    const data = structuredClone(FIXTURE_DATA)
    const [first] = data.drills.dtk.questions
    data.drills.dtk.questions = [0, 1, 2].map((i) => ({
      ...structuredClone(first),
      qid: `${first.qid}-${i}`,
      number: first.number + i,
    }))
    data.drills.dtk.explanations = Object.fromEntries(
      data.drills.dtk.questions.map((q) => [q.qid, null]),
    )
    mount(7, { data })
    const plate = screen.getByTestId('rd-figure')
    expect(within(plate).getByRole('img', { name: first.figure?.alt })).toBeInTheDocument()
    expect(plate).toHaveTextContent('Hösten 2025 · Provpass 1 · uppgifterna 29–31')
    expect(screen.getByText('Första av tre frågor till figuren')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-quant-option-C'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(screen.getByText('Andra av tre frågor till figuren')).toBeInTheDocument()
    expect(screen.getByTestId('rd-figure')).toBe(plate)
  })

  it('opens Förstora over the drill: keys rest, zoom and turn, Esc gives focus back', async () => {
    mount(7)
    const opener = screen.getByRole('button', { name: 'Förstora' })
    opener.focus()
    fireEvent.click(opener)
    const viewer = screen.getByRole('dialog', { name: 'Förstorad figur' })
    expect(within(viewer).getByRole('button', { name: /Stäng/ })).toHaveFocus()
    expect(document.querySelector('.fo-qroot')).toHaveAttribute('inert')
    press('b')
    expect(screen.getByTestId('rd-quant-option-B')).toHaveAttribute('aria-pressed', 'false')
    expect(within(viewer).getByText('100 %')).toBeInTheDocument()
    press('+')
    expect(within(viewer).getByText('150 %')).toBeInTheDocument()
    press('r')
    expect(within(viewer).getByRole('img').style.transform).toContain('rotate(90deg)')
    // The arrows pan the page; the bake-off's switcher never hears them.
    const switcher = vi.fn()
    window.addEventListener('keydown', switcher)
    fireEvent.keyDown(within(viewer).getByRole('region'), { key: 'ArrowRight' })
    expect(switcher).not.toHaveBeenCalled()
    window.removeEventListener('keydown', switcher)
    press('Escape')
    expect(screen.queryByRole('dialog')).toBeNull()
    await vi.waitFor(() => expect(opener).toHaveFocus())
    fireEvent.click(opener)
    expect(within(screen.getByRole('dialog')).getByText('150 %')).toBeInTheDocument()
  })

  it('keeps Svara open when the page fails to load, with a way to try again', () => {
    mount(7)
    const plate = screen.getByTestId('rd-figure')
    fireEvent.error(within(plate).getByRole('img'))
    expect(within(plate).getByRole('status')).toHaveTextContent('Figuren gick inte att visa.')
    fireEvent.click(screen.getByTestId('rd-quant-option-A'))
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
    fireEvent.click(within(plate).getByRole('button', { name: 'Försök igen' }))
    act(() => loadImages())
    expect(within(plate).getByRole('img')).toBeInTheDocument()
  })

  it('on phone keeps the plate as the page and the question on the slip', () => {
    mount(7, { width: 'phone' })
    expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'peek')
    expect(screen.getByRole('button', { name: 'Visa de fyra alternativen' })).toBeInTheDocument()
    reveal('rd-quant-option-A')
    expect(screen.getAllByRole('button', { name: /Visa figuren/ }).length).toBeGreaterThan(0)
    expect(screen.getByTestId('rd-figure')).toBeInTheDocument()
  })
})

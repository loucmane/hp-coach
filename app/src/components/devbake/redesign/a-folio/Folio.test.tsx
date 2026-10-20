import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  describeDirectionContract,
  loadImages,
  reveal,
  stubLayout,
} from '@/components/devbake/redesign/contract'
import { DirectionDataProvider, FIXTURE_DATA } from '@/components/devbake/redesign/directionData'
import type { DrillController } from '@/components/devbake/redesign/drillCore'
import {
  Redesign2026Bakeoff,
  type Selection,
} from '@/components/devbake/redesign/Redesign2026Bakeoff'
import type { AppScreenKey, DirectionProps, WidthKey } from '@/components/devbake/redesign/r1Kit'
import type { DirectionActions, DirectionData } from '@/components/devbake/redesign/viewModel'
import { Folio } from './Folio'
import { fmtPassScore } from './FolioProvpass'
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
    expect(screen.getByRole('heading', { level: 1, name: 'Anmälan.' })).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-nav-framsteg'))
    expect(go).toHaveBeenLastCalledWith('framsteg')
    expect(screen.getByRole('heading', { level: 1, name: 'Framsteg' })).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-nav-uppslag'))
    expect(go).toHaveBeenLastCalledWith('uppslag')
    // Uppslag is the host's to show (its "Inte byggd än" card): no stub.
    expect(screen.getByRole('heading', { level: 1, name: 'Framsteg' })).toBeInTheDocument()
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

// ── Batch 2: Provpass, Provpassresultat, Framsteg ────────────────────

const RUN = FIXTURE_DATA.provpass.running
const RESULT = FIXTURE_DATA.provpass.result

/** Through the hub's gate: Starta provpasset, then the slip's Starta nu. */
function startPass() {
  fireEvent.click(screen.getByTestId('rd-prov-start'))
  fireEvent.click(screen.getByTestId('rd-confirm'))
}

const cell = (n: number) => screen.getByTestId(`rd-prov-cell-${n}`)

describe('Folio · Provpass, the hub', () => {
  it('summons the least-seen pass of the half; a cell of the register moves the lead', () => {
    const startProvpass = vi.fn()
    const openProvResult = vi.fn()
    mount(9, { actions: { startProvpass, openProvResult } })
    expect(screen.getByRole('heading', { level: 1, name: 'Anmälan.' })).toBeInTheDocument()
    expect(
      screen.getByText(
        '40 frågor, 55 minuter, riktiga provvillkor – ingen feedback förrän du lämnar in.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByTestId('rd-prov-half-kvant')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Kallelse · minst sett')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Hösten 2025, provpass 1' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Kvantitativ · XYZ 12 · KVA 10 · NOG 6 · DTK 12')).toBeInTheDocument()
    expect(screen.getByText(/^Du har sett 6 av 40 frågor\./)).toBeInTheDocument()
    expect(screen.getByText(`Inskriven: ${FIXTURE_DATA.konto.identity.name}`)).toBeInTheDocument()
    // The register: sittings newest first, leader dots to their two passes.
    const table = screen.getByRole('table')
    const sittings = within(table)
      .getAllByRole('rowheader')
      .map((th) => th.textContent)
    expect(sittings).toEqual(['Våren 2026', 'Hösten 2025'])
    expect(screen.getByTestId('rd-prov-pass-host-2025-kvant1')).toHaveTextContent('sett 6/40')
    expect(screen.getByTestId('rd-prov-pass-host-2025-kvant1')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(screen.getByTestId('rd-prov-pass-var-2026-kvant2'))
    expect(screen.getByText('Valt pass')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Våren 2026, provpass 2' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('rd-prov-pass-var-2026-kvant2')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    // The one filled button follows the choice; ↵ presses it.
    press('Enter')
    expect(screen.getByRole('dialog', { name: 'Starta provpass' })).toHaveTextContent(
      'Våren 2026, provpass 2',
    )
    expect(startProvpass).not.toHaveBeenCalled()
    press('Escape')
    // The latest passes in the margin open their results.
    fireEvent.click(
      screen.getByRole('button', { name: /^Verbal, Våren 2026, provpass 1, 29 av 40 rätt/ }),
    )
    expect(openProvResult).toHaveBeenCalledWith(FIXTURE_DATA.provpass.hub.results[0].id)
  })

  it('turns to the verbal half: its summons, its sections, its register', () => {
    mount(9)
    fireEvent.click(screen.getByTestId('rd-prov-half-verbal'))
    expect(screen.getByTestId('rd-prov-half-verbal')).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('heading', { level: 2, name: 'Hösten 2025, provpass 2' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Verbal · ORD 10 · LÄS 10 · MEK 10 · ELF 10')).toBeInTheDocument()
    expect(screen.getByTestId('rd-prov-pass-host-2025-verb2')).toHaveTextContent('sett 9/40')
    expect(screen.queryByTestId('rd-prov-pass-host-2025-kvant1')).toBeNull()
  })

  it('reads the conditions on a slip first; only Starta nu starts, and only once', async () => {
    const startProvpass = vi.fn()
    mount(9, { actions: { startProvpass } })
    const start = screen.getByTestId('rd-prov-start')
    start.focus()
    fireEvent.click(start)
    const slip = screen.getByRole('dialog', { name: 'Starta provpass' })
    expect(
      within(slip)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual([
      '1Ingen paus.',
      '2Du kan ändra svar tills tiden går ut.',
      '3Avbryter du blir provet ogiltigt.',
      '4Lämna ingen fråga obesvarad – fel ger inga avdrag.',
    ])
    expect(within(slip).getByTestId('rd-confirm')).toHaveFocus()
    expect(document.querySelector('.fo-app')).toHaveAttribute('inert')
    fireEvent.click(within(slip).getByRole('button', { name: /Inte nu/ }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(startProvpass).not.toHaveBeenCalled()
    await waitFor(() => expect(start).toHaveFocus())
    fireEvent.click(start)
    press('Escape')
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(start)
    const accept = screen.getByTestId('rd-confirm')
    fireEvent.click(accept)
    fireEvent.click(accept)
    expect(startProvpass).toHaveBeenCalledTimes(1)
    expect(startProvpass).toHaveBeenCalledWith(RUN.passId)
    expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
  })

  it('waits honestly for a pass whose questions the host has not handed down', () => {
    const startProvpass = vi.fn()
    mount(9, { actions: { startProvpass } })
    fireEvent.click(screen.getByTestId('rd-prov-pass-var-2026-kvant1'))
    startPass()
    expect(startProvpass).toHaveBeenCalledWith('var-2026:kvant1')
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
    expect(screen.getByText('Frågorna till passet är inte framme än.')).toBeInTheDocument()
    expect(screen.queryByTestId('rd-prov-start')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Välj ett annat pass' }))
    expect(screen.getByTestId('rd-prov-start')).toBeInTheDocument()
  })

  it('says a short pass’s true size, and a first visit or an empty half plainly', () => {
    const data = structuredClone(FIXTURE_DATA)
    const pass = data.provpass.hub.passes.find((p) => p.id === RUN.passId)
    if (!pass) throw new Error('the running pass is not in the register')
    pass.presented = 39
    data.provpass.hub.results = []
    data.provpass.hub.passes = data.provpass.hub.passes.filter((p) => p.half === 'kvant')
    mount(9, { data })
    expect(screen.getByText('Passet har 39 frågor – en saknas i källan.')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-prov-start'))
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'En fråga saknas i källan, så passet rättas på 39.',
    )
    press('Escape')
    expect(screen.getByText('Inga pass ännu – det första blir din baslinje.')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-prov-half-verbal'))
    expect(
      screen.getByText('Inga riktiga pass att välja i den här halvan just nu.'),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('rd-prov-start')).toBeNull()
    expect(screen.queryByRole('table')).toBeNull()
  })
})

describe('Folio · Provpass, the running pass', () => {
  afterEach(() => vi.useRealTimers())

  it('runs in focus mode at the host’s place: the heads, time left, the index', () => {
    mount(9)
    startPass()
    expect(screen.queryByTestId('rd-nav-idag')).toBeNull()
    expect(screen.getByTestId('rd-exit')).toHaveTextContent('Avbryt passet')
    expect(screen.getByText('Provpass · KVA')).toBeInTheDocument()
    expect(screen.getByText('Fråga 17 av 40')).toBeInTheDocument()
    expect(
      screen.getByRole('timer', { name: '31 minuter och 12 sekunder kvar' }),
    ).toHaveTextContent('31:12 kvar')
    // KVA as in its drill: the condition, then the quantities side by side.
    expect(screen.getByRole('heading', { level: 2, name: 'y > 0' })).toBeInTheDocument()
    expect(
      within(screen.getByRole('table'))
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['x - y', '3x - 2y'])
    // The index: a segment a question, the sections apart.
    expect(screen.getByTestId('rd-prov-grid').querySelectorAll('.fo-passindex-run')).toHaveLength(4)
    expect(cell(16)).toHaveAttribute('data-answered', 'true')
    expect(cell(17)).toHaveAttribute('data-current', 'true')
    expect(cell(9)).toHaveAttribute('data-flagged', 'true')
    expect(cell(22)).toHaveAccessibleName('Fråga 22, KVA, obesvarad')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Kvantitativa jämförelser, fråga 17 av 40' }),
    ).toHaveFocus()
    expect(screen.getByText('Inget svar än – du kan hoppa över frågan.')).toBeInTheDocument()
  })

  it('saves a choice on a–d and never grades it; ←/→, ↵ and space move; E, digits and Esc do nothing', () => {
    const lock = vi.fn<DrillController['lock']>(() => ({ correct: true }))
    const exit = vi.fn()
    mount(9, { actions: { drill: { lock, exit } } })
    startPass()
    press('b')
    expect(screen.getByTestId('rd-prov-option-B')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Ditt val: B · sparat')).toBeInTheDocument()
    expect(cell(17)).toHaveAttribute('data-answered', 'true')
    press('e') // no E on a KVA question
    expect(screen.queryByTestId('rd-prov-option-E')).toBeNull()
    expect(screen.getByTestId('rd-prov-option-B')).toHaveAttribute('aria-pressed', 'true')
    expect(fireEvent.keyDown(window, { key: '3' })).toBe(false) // the switcher's, swallowed
    press('Escape')
    expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
    expect(fireEvent.keyDown(window, { key: 'ArrowRight' })).toBe(false)
    expect(cell(18)).toHaveAttribute('data-current', 'true')
    expect(screen.getByRole('heading', { level: 1, name: /fråga 18 av 40$/ })).toHaveFocus()
    press('a', { shiftKey: true })
    expect(screen.getByTestId('rd-eliminate-A')).toHaveAttribute('aria-pressed', 'true')
    press('Enter')
    expect(cell(19)).toHaveAttribute('data-current', 'true')
    press(' ')
    expect(cell(20)).toHaveAttribute('data-current', 'true')
    press('ArrowLeft')
    expect(cell(19)).toHaveAttribute('data-current', 'true')
    // A focused control keeps ↵ to itself.
    const option = screen.getByTestId('rd-prov-option-C')
    option.focus()
    fireEvent.keyDown(option, { key: 'Enter' })
    expect(cell(19)).toHaveAttribute('data-current', 'true')
    // Back on 17 the choice is still there.
    fireEvent.click(cell(17))
    expect(screen.getByTestId('rd-prov-option-B')).toHaveAttribute('aria-pressed', 'true')
    expect(lock).not.toHaveBeenCalled()
    expect(exit).not.toHaveBeenCalled()
    expect(screen.queryByTestId('rd-verdict')).toBeNull()
  })

  it('lets a focused scroll region keep its arrows: the question stays', () => {
    mount(9)
    startPass()
    const region = document.querySelector<HTMLElement>('.fo-qscroll')
    if (!region) throw new Error('the page has no scroll region')
    expect(region).toHaveAttribute('data-rd-keyscope')
    fireEvent.keyDown(region, { key: 'ArrowRight' })
    expect(cell(17)).toHaveAttribute('data-current', 'true')
  })

  it('folds the clock to its line and brings it back, in words, at five minutes', () => {
    vi.useFakeTimers()
    const data = structuredClone(FIXTURE_DATA)
    data.provpass.running.remainingSeconds = 302
    mount(9, { data })
    startPass()
    fireEvent.click(screen.getByRole('button', { name: 'Dölj klockan' }))
    expect(screen.getByTestId('rd-prov-timer')).not.toHaveTextContent('05:02')
    expect(document.querySelector('.fo-timeline')).not.toBeNull()
    act(() => vi.advanceTimersByTime(3000))
    expect(screen.getByText('Fem minuter kvar')).toBeInTheDocument()
    expect(screen.getByTestId('rd-prov-timer')).toHaveTextContent('04:59 kvar')
    expect(screen.getByTestId('rd-prov-timer')).toHaveAttribute('data-urgent', 'true')
  })

  it('hands the pass in once when the host’s countdown reaches zero, never voiding it', () => {
    vi.useFakeTimers()
    const data = structuredClone(FIXTURE_DATA)
    data.provpass.running.remainingSeconds = 3
    const submitProvpass = vi.fn()
    const { supply } = mount(9, { data, actions: { submitProvpass } })
    startPass()
    fireEvent.click(screen.getByTestId('rd-prov-option-B'))
    // The host ticks to zero before the pass's own interval does.
    const next = structuredClone(data)
    next.provpass.running.remainingSeconds = 0
    supply(next)
    expect(submitProvpass).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
    expect(screen.queryByText(/ogiltigt|räknas inte/)).toBeNull()
    expect(screen.getByText('Passet lämnas in. Dina svar är sparade.')).toBeInTheDocument()
    expect(screen.getByTestId('rd-prov-option-B')).toHaveAttribute('aria-pressed', 'true')
    act(() => vi.advanceTimersByTime(5000))
    supply(structuredClone(next))
    expect(submitProvpass).toHaveBeenCalledTimes(1)
  })

  it('hands in once on its own clock too, even with the abandon slip open', () => {
    vi.useFakeTimers()
    const data = structuredClone(FIXTURE_DATA)
    data.provpass.running.remainingSeconds = 10
    const submitProvpass = vi.fn()
    mount(9, { data, actions: { submitProvpass } })
    startPass()
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(screen.getByRole('dialog', { name: 'Avbryta provpasset?' })).toBeInTheDocument()
    act(() => {
      vi.setSystemTime(Date.now() + 11_000)
      vi.advanceTimersByTime(1000)
    })
    expect(submitProvpass).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByTestId('rd-prov-timer')).toHaveTextContent('00:00')
    act(() => vi.advanceTimersByTime(10_000))
    expect(submitProvpass).toHaveBeenCalledTimes(1)
  })

  it('never starts a pass whose time is up when it opens: it does not count', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.provpass.running.remainingSeconds = 0
    const submitProvpass = vi.fn()
    mount(9, { data, actions: { submitProvpass } })
    startPass()
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
    expect(
      screen.getByText('Passet hann ta slut innan det lämnades in. Det räknas inte.'),
    ).toBeInTheDocument()
    expect(submitProvpass).not.toHaveBeenCalled()
    expect(screen.queryByTestId('rd-prov-timer')).toBeNull()
  })

  it('asks before handing in: the blanks in words, links to them, then one hand-in', () => {
    const submitProvpass = vi.fn()
    const data = structuredClone(FIXTURE_DATA)
    const run = data.provpass.running
    // Every question answered but the 22nd.
    run.answers = Object.fromEntries(
      run.questions.filter((_, i) => i !== 21).map((q) => [q.qid, 'A' as const]),
    )
    mount(9, { data, actions: { submitProvpass } })
    startPass()
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    const slip = screen.getByRole('dialog', { name: 'Lämna in provpasset?' })
    expect(slip).toHaveTextContent('En fråga är obesvarad – fel ger inga avdrag, så gissa hellre.')
    fireEvent.click(within(slip).getByRole('button', { name: 'Gå till fråga 22' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(cell(22)).toHaveAttribute('data-current', 'true')
    press('c')
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    expect(screen.getByRole('dialog')).toHaveTextContent('Alla 40 frågor är besvarade.')
    fireEvent.click(screen.getByRole('button', { name: 'Tillbaka till passet' }))
    expect(submitProvpass).not.toHaveBeenCalled()
    // On the last question ↵ asks to hand in.
    fireEvent.click(cell(40))
    press('Enter')
    fireEvent.click(within(screen.getByRole('dialog')).getByTestId('rd-confirm'))
    expect(submitProvpass).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Passet lämnas in. Dina svar är sparade.')).toBeInTheDocument()
    expect(screen.getByTestId('rd-prov-submit')).toBeDisabled()
    press('Enter')
    expect(submitProvpass).toHaveBeenCalledTimes(1)
  })

  it('keeps the answers and offers the hand-in again when it fails', () => {
    const submitProvpass = vi.fn(() => {
      throw new Error('offline')
    })
    mount(9, { actions: { submitProvpass } })
    startPass()
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    expect(screen.getByRole('dialog')).toHaveTextContent(
      '24 frågor är obesvarade – fel ger inga avdrag, så gissa hellre.',
    )
    fireEvent.click(screen.getByTestId('rd-confirm'))
    const slip = screen.getByRole('dialog', { name: 'Lämna in provpasset?' })
    expect(within(slip).getByRole('status')).toHaveTextContent(
      'Inlämningen gick inte fram. Dina svar är sparade.',
    )
    fireEvent.click(within(slip).getByRole('button', { name: /Försök igen/ }))
    expect(submitProvpass).toHaveBeenCalledTimes(2)
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Tillbaka till passet' }),
    )
    press('a')
    expect(screen.getByTestId('rd-prov-option-A')).toHaveAttribute('aria-pressed', 'true')
  })

  it('tries a failed hand-in at time out once, then leaves the retry to the reader', () => {
    const submitProvpass = vi.fn(() => {
      throw new Error('offline')
    })
    const data = structuredClone(FIXTURE_DATA)
    const { supply } = mount(9, { data, actions: { submitProvpass } })
    startPass()
    // The host's clock reaches zero well before the pass's own deadline.
    const next = structuredClone(data)
    next.provpass.running.remainingSeconds = 0
    supply(next)
    expect(submitProvpass).toHaveBeenCalledTimes(1)
    const slip = screen.getByRole('dialog', { name: 'Lämna in provpasset?' })
    expect(slip).toHaveTextContent('Tiden är slut.')
    expect(within(slip).getByRole('status')).toHaveTextContent('Inlämningen gick inte fram.')
    expect(within(slip).queryByRole('button', { name: 'Tillbaka till passet' })).toBeNull()
    press('Escape')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(submitProvpass).toHaveBeenCalledTimes(1)
    press('b') // time is up: nothing more is answered
    expect(screen.getByTestId('rd-prov-option-B')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Försök igen/ }))
    expect(submitProvpass).toHaveBeenCalledTimes(2)
  })

  it('asks before voiding: Fortsätt provpasset is the default, Avbryt passet voids', () => {
    const submitProvpass = vi.fn()
    mount(9, { actions: { submitProvpass } })
    startPass()
    fireEvent.click(screen.getByTestId('rd-exit'))
    const slip = screen.getByRole('dialog', { name: 'Avbryta provpasset?' })
    const stay = within(slip).getByRole('button', { name: /Fortsätt provpasset/ })
    expect(stay).toHaveFocus()
    press('b') // the pass's keys rest under the slip
    expect(screen.getByTestId('rd-prov-option-B')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(stay)
    expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-exit'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Provet avbröts – ogiltigt. Dina missar ligger i Repetera.',
    )
    expect(submitProvpass).not.toHaveBeenCalled()
    expect(screen.getByTestId('rd-nav-provpass')).toHaveAttribute('aria-current', 'page')
  })

  it('lays the pass out in Översikt by section and goes where it is pressed', () => {
    mount(9)
    startPass()
    fireEvent.click(screen.getByRole('button', { name: 'Översikt' }))
    const slip = screen.getByRole('dialog', { name: 'Översikt' })
    expect(slip).toHaveTextContent('16 av 40 besvarade')
    const nav = within(slip).getByRole('navigation', { name: 'Frågor i passet' })
    expect(within(nav).getAllByRole('list')).toHaveLength(4)
    expect(
      within(nav).getByRole('button', { name: 'Fråga 9, XYZ, besvarad, markerad' }),
    ).toBeInTheDocument()
    expect(
      within(nav).getByRole('button', { name: 'Fråga 17, KVA, obesvarad, här är du' }),
    ).toHaveAttribute('aria-current', 'step')
    fireEvent.click(within(nav).getByRole('button', { name: 'Fråga 29, DTK, obesvarad' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(cell(29)).toHaveAttribute('data-current', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Översikt' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Lämna in/ }))
    expect(screen.getByRole('dialog', { name: 'Lämna in provpasset?' })).toBeInTheDocument()
  })

  it('marks a question with a folded corner, and has no Markera when the host has no flags', () => {
    const first = mount(9)
    startPass()
    const flag = screen.getByTestId('rd-prov-flag')
    expect(flag).toHaveAccessibleName('Markera för återkomst')
    fireEvent.click(flag)
    expect(flag).toHaveAttribute('aria-pressed', 'true')
    expect(cell(17)).toHaveAttribute('data-flagged', 'true')
    expect(document.querySelector('.fo-pass-q')).toHaveAttribute('data-dogear', 'true')
    first.unmount()
    const data = structuredClone(FIXTURE_DATA)
    delete data.provpass.running.flags
    mount(9, { data })
    startPass()
    expect(screen.queryByTestId('rd-prov-flag')).toBeNull()
    expect(cell(9)).not.toHaveAttribute('data-flagged')
  })

  it('keeps its place in range when the host hands down fewer questions', () => {
    const data = structuredClone(FIXTURE_DATA)
    const { supply } = mount(9, { data })
    startPass()
    fireEvent.click(cell(40))
    const next = structuredClone(data)
    next.provpass.running.questions = next.provpass.running.questions.slice(0, 30)
    next.provpass.running.grid = next.provpass.running.grid.slice(0, 30)
    expect(() => supply(next)).not.toThrow()
    expect(cell(30)).toHaveAttribute('data-current', 'true')
    expect(screen.queryByTestId('rd-prov-cell-31')).toBeNull()
    press('ArrowLeft')
    expect(cell(29)).toHaveAttribute('data-current', 'true')
    // No questions at all: a blank page that says so, and the way back.
    const none = structuredClone(next)
    none.provpass.running.questions = []
    none.provpass.running.grid = []
    supply(none)
    fireEvent.click(screen.getByRole('button', { name: 'Till anmälan' }))
    expect(
      screen.getByText('Passets frågor gick inte att visa. Inget har räknats.'),
    ).toBeInTheDocument()
  })

  it('sets a DTK question on its plate, kept across the page’s questions, with Förstora', () => {
    mount(9)
    startPass()
    fireEvent.click(cell(29))
    const plate = screen.getByTestId('rd-figure')
    expect(plate).toHaveTextContent('Hösten 2025 · Provpass 1 · uppgifterna 29–31')
    expect(screen.getByText('Första av tre frågor till figuren')).toBeInTheDocument()
    press('ArrowRight')
    expect(screen.getByText('Andra av tre frågor till figuren')).toBeInTheDocument()
    expect(screen.getByTestId('rd-figure')).toBe(plate)
    const opener = screen.getByRole('button', { name: 'Förstora' })
    opener.focus()
    fireEvent.click(opener)
    expect(screen.getByRole('dialog', { name: 'Förstorad figur' })).toBeInTheDocument()
    press('b') // the pass's keys rest while it is open
    expect(screen.getByTestId('rd-prov-option-B')).toHaveAttribute('aria-pressed', 'false')
    press('ArrowRight') // pans the page, never the question
    press('Escape')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(cell(30)).toHaveAttribute('data-current', 'true')
  })

  it('sets a reading question on its spread, the ÖVNINGSTEXT badge in the head', () => {
    const data = structuredClone(FIXTURE_DATA)
    const run = data.provpass.running
    run.questions = data.drills.reading.questions
    run.current = 0
    run.answers = {}
    mount(9, { data })
    startPass()
    expect(screen.getByText(`Provpass · LÄS · ${data.copy.ovningstextBadge}`)).toBeInTheDocument()
    expect(screen.getByTestId('rd-passage')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-note-toggle'))
    expect(screen.getByTestId('rd-note')).toHaveTextContent(data.copy.ovningstextNote)
    press('c')
    expect(screen.getByTestId('rd-prov-option-C')).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('heading', { level: 2, name: 'Svensk läsförståelse, fråga 1 av 4' }),
    ).toHaveFocus()
  })

  it('on phone keeps one page with the bar at the foot, and the slip for a plate', () => {
    mount(9, { width: 'phone' })
    startPass()
    expect(screen.getByText('Fråga 17 av 40')).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('31:12 kvar')
    expect(document.querySelector('.fo-pfoot')).toContainElement(
      screen.getByRole('button', { name: /^Nästa fråga/ }),
    )
    fireEvent.click(cell(29))
    const sheet = screen.getByRole('region', { name: 'Fråga 29' })
    expect(sheet).toHaveAttribute('data-state', 'peek')
    expect(within(sheet).getByText('Fråga 29 av 40 · första av tre')).toBeInTheDocument()
    fireEvent.click(within(sheet).getByRole('button', { name: /Visa de fyra alternativen/ }))
    expect(within(sheet).getByTestId('rd-prov-option-A')).toBeInTheDocument()
  })
})

/** The real bake-off around Folio, its selection merged on every change. */
function mountHost(s: AppScreenKey, w: WidthKey = 'desktop') {
  const onSelect = vi.fn()
  function Host() {
    const [sel, setSel] = useState<Selection>({ d: 'a', s, w, t: 'light', sbs: false, bare: false })
    return (
      <Redesign2026Bakeoff
        sel={sel}
        onSelect={(next) => {
          onSelect(next)
          setSel((prev) => ({ ...prev, ...next }))
        }}
      />
    )
  }
  render(<Host />)
  return onSelect
}

describe('Folio · in the real bake-off', () => {
  // jsdom has no layout: give the stage the room of a 1440 × 900 window.
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(1440)
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(848)
  })
  afterEach(() => vi.restoreAllMocks())

  it.each([
    'option',
    'cell',
    'heading',
    'body',
  ] as const)('keeps the switcher’s keys inside a running pass, from the %s', async (target) => {
    const onSelect = mountHost(9)
    fireEvent.click(await screen.findByTestId('rd-prov-start', {}, { timeout: 5000 }))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    onSelect.mockClear()
    for (const key of ['1', '4', '8', '0', 'ArrowRight', 'ArrowLeft']) {
      const el =
        target === 'option'
          ? screen.getByTestId('rd-prov-option-A')
          : target === 'cell'
            ? screen.getByTestId('rd-prov-cell-3')
            : target === 'heading'
              ? screen.getByRole('heading', { level: 1 })
              : document.body
      el.focus()
      expect(fireEvent.keyDown(el, { key })).toBe(false)
      expect(onSelect).not.toHaveBeenCalled()
      expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
    }
    expect(screen.getByTestId('rd-prov-running')).toHaveAttribute('data-rd-keyscope')
  })

  it('keeps a slip’s keys its own, and hands the pass in on to the result', async () => {
    const onSelect = mountHost(9)
    fireEvent.click(await screen.findByTestId('rd-prov-start', {}, { timeout: 5000 }))
    const slip = screen.getByRole('dialog', { name: 'Starta provpass' })
    onSelect.mockClear()
    fireEvent.keyDown(within(slip).getByTestId('rd-confirm'), { key: '2' })
    fireEvent.keyDown(within(slip).getByTestId('rd-confirm'), { key: 'ArrowRight' })
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.click(within(slip).getByTestId('rd-confirm'))
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(onSelect).toHaveBeenLastCalledWith({ s: 10 })
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Provpasset klart.' }),
    ).toBeInTheDocument()
  })

  it('keeps the arrows inside the reading drill’s pages from the switcher', async () => {
    const onSelect = mountHost(2)
    const passage = await screen.findByTestId('rd-passage', {}, { timeout: 5000 })
    onSelect.mockClear()
    fireEvent.keyDown(passage, { key: 'ArrowRight' })
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenLastCalledWith({ s: 3 })
  })
})

describe('Folio · Provpassresultat', () => {
  it('reports the pass as a closing page: the figure and its basis, each section, the misses', () => {
    const openRepetera = vi.fn()
    const openProvResult = vi.fn()
    const go = vi.fn()
    mount(10, { actions: { openRepetera, openProvResult, go } })
    expect(screen.getByRole('heading', { level: 1, name: 'Provpasset klart.' })).toBeInTheDocument()
    expect(
      screen.getByText('Kvantitativ, riktigt pass. Du lämnade in efter 53 minuter.'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('rd-nav-provpass')).toHaveAttribute('aria-current', 'page')
    const value = RESULT.score.value
    if (value == null) throw new Error('the fixture result has no score')
    const score = screen.getByTestId('rd-prov-score')
    expect(score).toHaveTextContent(`${fmtPassScore(value)}*normerat (härlett) · av 2,0`)
    expect(score).toHaveTextContent('27 av 40 rätt')
    expect(
      within(score).getByRole('img', { name: `${fmtPassScore(value)} på skalan 0 till 2,0` }),
    ).toBeInTheDocument()
    // Per delprov, in the test's order, the tempo in words.
    const rows = within(screen.getByRole('table', { name: 'Per delprov: rätt, tid och budget' }))
      .getAllByRole('row')
      .slice(1)
    expect(rows.map((r) => r.dataset.testid)).toEqual([
      'rd-prov-section-xyz',
      'rd-prov-section-kva',
      'rd-prov-section-nog',
      'rd-prov-section-dtk',
    ])
    const xyz = screen.getByTestId('rd-prov-section-xyz')
    for (const text of ['8/12', '17:30', '16:30', 'över budget']) {
      expect(xyz).toHaveTextContent(text)
    }
    expect(screen.getByTestId('rd-prov-section-nog')).toHaveTextContent('över budget')
    expect(screen.getByTestId('rd-prov-section-kva')).not.toHaveTextContent('över budget')
    // The misses, and where they went.
    expect(
      screen.getByText('11 missar ligger nu i Repetera; två lämnades obesvarade.'),
    ).toBeInTheDocument()
    const errata = screen.getByRole('list', { name: 'Missarna' })
    expect(within(errata).getAllByRole('listitem')).toHaveLength(RESULT.missed.length)
    expect(within(errata).getAllByRole('listitem')[0]).toHaveTextContent('XYZ')
    expect(within(errata).getAllByRole('listitem')[0]).toHaveTextContent('rätt B')
    // The margin: earlier passes of the kind, exposure; the footnote.
    const history = screen.getByTestId('rd-prov-history')
    expect(within(history).getAllByRole('listitem')).toHaveLength(RESULT.history.length)
    fireEvent.click(within(history).getAllByRole('button')[0])
    expect(openProvResult).toHaveBeenCalledWith(RESULT.history[0].id)
    expect(screen.getByText('Du hade sett 6 av 40 frågor innan.')).toBeInTheDocument()
    expect(
      screen.getByText(/UHR normerar hela den kvantitativa delen \(80 frågor\)/),
    ).toBeInTheDocument()
    // Learning first: Repetera holds the misses. Esc goes to Provpass.
    fireEvent.click(screen.getByRole('button', { name: /^Till Repetera/ }))
    expect(openRepetera).toHaveBeenCalledTimes(1)
    press('Enter')
    expect(openRepetera).toHaveBeenCalledTimes(2)
    press('Escape')
    expect(go).toHaveBeenLastCalledWith('provpass')
    expect(screen.getByRole('heading', { level: 1, name: 'Anmälan.' })).toBeInTheDocument()
  })

  it('says a clean pass, a linear estimate, a time-out and a short pass plainly', () => {
    const data = structuredClone(FIXTURE_DATA)
    const r = data.provpass.result
    r.presented = 39
    r.answered = 39
    r.correct = 39
    r.missed = []
    r.score = { value: 1.62, derived: 'linear', label: 'skattad' }
    r.durationSeconds = 55 * 60
    r.history = []
    r.sections = [...r.sections].reverse()
    const go = vi.fn()
    mount(10, { data, actions: { go } })
    expect(
      screen.getByText(
        'Kvantitativ, riktigt pass. Tiden tog slut – passet lämnades in automatiskt efter 55 minuter.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByTestId('rd-prov-score')).toHaveTextContent('1,62*skattad poäng · av 2,0')
    expect(
      screen.getByText('En fråga saknas i det här passet, så det rättades på 39.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Inga missar i det här passet.')).toBeInTheDocument()
    expect(screen.getByText('Linjär skattning – indikativ, inte UHR-normerad.')).toBeInTheDocument()
    expect(screen.getByTestId('rd-prov-history')).toHaveTextContent(
      'Inga tidigare pass av samma sort ännu.',
    )
    // Still in the test's order.
    expect(
      within(screen.getByRole('table'))
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.dataset.testid),
    ).toEqual(['xyz', 'kva', 'nog', 'dtk'].map((s) => `rd-prov-section-${s}`))
    fireEvent.click(screen.getByRole('button', { name: /^Nytt provpass/ }))
    expect(go).toHaveBeenLastCalledWith('provpass')
  })
})

describe('Folio · Framsteg', () => {
  const F = FIXTURE_DATA.framsteg
  const TOP = F.focus[0]

  it('reads as a report: the week, one figure with its caveat, the one thing to practise', () => {
    const startDrill = vi.fn()
    const openKonto = vi.fn()
    mount(11, { actions: { startDrill, openKonto } })
    expect(screen.getByRole('heading', { level: 1, name: 'Framsteg' })).toBeInTheDocument()
    expect(
      screen.getByText(
        `180 frågor den här veckan med 70 % träffsäkerhet. Gapet upp till målet bärs framför allt av ${F.focus[0]} och ${F.focus[1]}.`,
      ),
    ).toBeInTheDocument()
    const lead = screen.getByTestId('rd-framsteg-prognosis')
    expect(lead).toHaveTextContent('1,4*av 2,0')
    expect(lead).toHaveTextContent('+0,1 sedan förra veckan')
    expect(lead).toHaveTextContent('Verbal 1,5 · Kvant 1,3')
    expect(
      within(lead).getByRole('img', { name: 'Prognos 1,4 på skalan 0 till 2,0, mål 2,0' }),
    ).toBeInTheDocument()
    fireEvent.click(within(lead).getByRole('button', { name: /^mål 2,0/ }))
    expect(openKonto).toHaveBeenCalled()
    expect(lead).toHaveTextContent(`Mest att vinna: ${TOP} –`)
    fireEvent.click(within(lead).getByRole('button', { name: new RegExp(`^Öva ${TOP}`) }))
    expect(startDrill).toHaveBeenLastCalledWith({ kind: 'section', section: TOP })
    startDrill.mockClear()
    press('Enter')
    expect(startDrill).toHaveBeenLastCalledWith({ kind: 'section', section: TOP })
    // The caveat is the figure's footnote, verbatim.
    expect(screen.getByText(FIXTURE_DATA.copy.estimateCaveat)).toBeInTheDocument()
    // No streak and no record: the days practised are counted, never lost.
    expect(screen.getByTestId('rd-folio')).not.toHaveTextContent(/serie|rekord/i)
  })

  it('sets the eight sections as a ruled table in test order, the trends in words', () => {
    mount(11)
    const table = screen.getByRole('table', {
      name: 'Delproven: prognos, osäkerhet, trend och underlag',
    })
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows.map((r) => r.dataset.testid)).toEqual(
      ['ord', 'las', 'mek', 'elf', 'xyz', 'kva', 'nog', 'dtk'].map(
        (s) => `rd-framsteg-section-${s}`,
      ),
    )
    // LÄS and ELF carry the caveat's mark; the others do not.
    expect(within(screen.getByTestId('rd-framsteg-section-las')).getByText('*')).toBeInTheDocument()
    expect(within(screen.getByTestId('rd-framsteg-section-ord')).queryByText('*')).toBeNull()
    for (const s of F.sections) {
      const word =
        s.trend == null ? '–' : s.trend <= -0.02 ? 'ner' : s.trend >= 0.02 ? 'upp' : 'oförändrad'
      const id = s.section.toLocaleLowerCase('sv-SE').replace('ä', 'a')
      expect(screen.getByTestId(`rd-framsteg-section-${id}`)).toHaveTextContent(word)
    }
  })

  it('offers the next two sections and the latest passes, then the whole ledger', () => {
    const startDrill = vi.fn()
    mount(11, { actions: { startDrill } })
    const sedan = screen.getByRole('region', { name: 'Sedan' })
    const entries = within(sedan).getAllByRole('button')
    expect(entries).toHaveLength(2)
    fireEvent.click(entries[0])
    expect(startDrill).toHaveBeenLastCalledWith({ kind: 'section', section: F.focus[1] })
    const hist = screen.getByRole('region', { name: 'Historik' })
    const items = within(hist).getAllByRole('listitem')
    expect(items).toHaveLength(5)
    expect(items[0]).toHaveTextContent('tor 8 okt')
    expect(items[0]).toHaveTextContent('ORD-övning')
    expect(items[0]).toHaveTextContent('9/10')
    expect(items[1]).toHaveTextContent('Repetition')
    fireEvent.click(within(hist).getByRole('button', { name: /^Alla pass/ }))
    expect(screen.getByRole('heading', { level: 1, name: 'Tidigare pass.' })).toBeInTheDocument()
    expect(screen.getByTestId('rd-nav-framsteg')).toHaveAttribute('aria-current', 'page')
  })

  it('keeps Historik as a ledger by week, the provpass apart; Esc and the masthead go back', () => {
    const openProvResult = vi.fn()
    mount(11, { actions: { openProvResult } })
    fireEvent.click(screen.getByRole('button', { name: /^Alla pass/ }))
    const ledger = screen.getByTestId('rd-framsteg-history')
    expect(
      within(ledger).getByRole('heading', { level: 2, name: 'Vecka 41 · 5–11 oktober' }),
    ).toBeInTheDocument()
    expect(
      within(ledger).getByRole('heading', {
        level: 2,
        name: 'Vecka 40 · 28 september – 4 oktober',
      }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('rd-framsteg-history-item-1')).toHaveTextContent('tor 8 okt')
    const prov = within(ledger).getByRole('region', { name: 'Provpass' })
    fireEvent.click(within(prov).getAllByRole('button')[0])
    expect(openProvResult).toHaveBeenCalledWith(FIXTURE_DATA.provpass.hub.results[0].id)
    press('Escape')
    expect(screen.getByRole('heading', { level: 1, name: 'Framsteg' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Alla pass/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Framsteg, tillbaka' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Framsteg' })).toBeInTheDocument()
  })

  it('draws the weeks as a captioned figure, bridges the empty weeks, offers the table', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.framsteg.weekly[6].score = null
    mount(11, { data })
    const chart = screen.getByRole('img', { name: /^Poäng per vecka de senaste 12 veckorna, från/ })
    expect(chart.querySelectorAll('.fo-chart-bridge')).toHaveLength(1)
    expect(screen.getByText(/Prickat: veckor utan övning\./)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Visa som tabell' }))
    const table = screen.getByRole('table', { name: 'Poäng per vecka' })
    expect(within(table).getAllByRole('row')).toHaveLength(13)
    expect(within(table).getAllByText('ingen övning')).toHaveLength(3)
  })

  it('waits for two active weeks before it draws the curve', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.framsteg.weekly = data.framsteg.weekly.map((w, i) => ({
      ...w,
      score: i === data.framsteg.weekly.length - 1 ? 1.4 : null,
    }))
    mount(11, { data })
    expect(screen.getByText('Kurvan börjar när du har övat två veckor.')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /^Poäng per vecka/ })).toBeNull()
  })

  it('counts the practice days per week as dots, never the days missed', () => {
    mount(11)
    const days = screen.getByTestId('rd-framsteg-week')
    const weeks = within(days).getAllByRole('img')
    expect(weeks).toHaveLength(6)
    const now = weeks[weeks.length - 1]
    expect(now).toHaveAccessibleName(/, den här veckan: fyra av fem dagar$/)
    expect(now.querySelectorAll('i')).toHaveLength(4)
    fireEvent.click(within(days).getByRole('button', { name: /^Visa alla \d+ veckor/ }))
    expect(within(days).getAllByRole('img').length).toBeGreaterThan(6)
  })

  it('begins plainly without an estimate, and points at the half that is missing', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.framsteg.prognosis = { total: null, verbal: null, quant: null, caveat: null }
    data.framsteg.week.attemptsThisWeek = 0
    data.framsteg.history = []
    const startDrill = vi.fn()
    const fresh = mount(11, { data, actions: { startDrill } })
    expect(
      screen.getByText('Ingen prognos än – svara på några frågor så börjar den här sidan leva.'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('rd-framsteg-prognosis')).toHaveTextContent('—')
    fireEvent.click(screen.getByRole('button', { name: /^Börja här · 10 frågor/ }))
    expect(startDrill).toHaveBeenLastCalledWith({ kind: 'mixed' })
    expect(
      screen.getByText('Inga avslutade pass än. Kör en övning så landar den här.'),
    ).toBeInTheDocument()
    fresh.unmount()
    const half = structuredClone(FIXTURE_DATA)
    half.framsteg.prognosis = { ...half.framsteg.prognosis, total: null, quant: null }
    mount(11, { data: half, actions: { startDrill } })
    expect(screen.getByTestId('rd-framsteg-prognosis')).toHaveTextContent('Verbal 1,5 · Kvant —')
    expect(
      screen.getByText('Totalen visas när du har svarat på frågor i båda halvorna.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Börja med kvant: XYZ · 10 frågor/ }))
    expect(startDrill).toHaveBeenLastCalledWith({ kind: 'section', section: 'XYZ' })
  })

  it('lists the traps by section in Fällor, led by the growing one', () => {
    const startDrill = vi.fn()
    const openLesson = vi.fn()
    mount(11, { actions: { startDrill, openLesson } })
    fireEvent.click(screen.getByRole('button', { name: /^Alla fällor/ }))
    expect(screen.getByRole('heading', { level: 1, name: 'Dina fällor.' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Författarens hållning' }),
    ).toBeInTheDocument()
    expect(screen.getByText('LÄS · ökar')).toBeInTheDocument()
    press('Enter')
    expect(startDrill).toHaveBeenLastCalledWith({
      kind: 'framework',
      frameworkId: 'LAS-TYPE-003',
      section: 'LÄS',
    })
    expect(
      screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent?.split(' · ')[0]),
    ).toEqual(['LÄS', 'ELF', 'XYZ'])
    fireEvent.click(screen.getByRole('button', { name: 'Slå upp Bråkaddition' }))
    expect(openLesson).toHaveBeenCalledWith('XYZ-TRAP-016')
    press('Escape')
    expect(screen.getByRole('heading', { level: 1, name: 'Framsteg' })).toBeInTheDocument()
  })
})

describe('Folio · Idag into Provpass and Framsteg', () => {
  it('opens Framsteg, its Historik and its Fällor from the margin', () => {
    const go = vi.fn()
    mount(1, { actions: { go } })
    fireEvent.click(screen.getByRole('button', { name: /Alla pass i Framsteg/ }))
    expect(go).toHaveBeenLastCalledWith('framsteg')
    expect(screen.getByRole('heading', { level: 1, name: 'Tidigare pass.' })).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-nav-idag'))
    fireEvent.click(screen.getByRole('button', { name: /Alla fällor i Framsteg/ }))
    expect(screen.getByRole('heading', { level: 1, name: 'Dina fällor.' })).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-nav-idag'))
    fireEvent.click(screen.getByRole('button', { name: 'Prognos' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Framsteg' })).toBeInTheDocument()
  })

  it('opens the conditions of the summoned pass when the plan’s provpass lands on the hub', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.home.resume = null
    data.home.plan.items = [
      {
        id: 'mock',
        kind: 'mock',
        section: null,
        title: 'Provpass',
        detail: 'Kvantitativ',
        rationale: 'Det är dags för ett provpass i den kvantitativa halvan.',
        minutes: 55,
        completed: false,
      },
    ]
    const openPlanItem = vi.fn()
    const { goTo } = mount(1, { data, actions: { openPlanItem } })
    fireEvent.click(screen.getByRole('button', { name: /^Börja · 55 min/ }))
    expect(openPlanItem).toHaveBeenCalledWith('mock')
    goTo(9)
    expect(screen.getByRole('dialog', { name: 'Starta provpass' })).toHaveTextContent(
      'Hösten 2025, provpass 1',
    )
  })
})

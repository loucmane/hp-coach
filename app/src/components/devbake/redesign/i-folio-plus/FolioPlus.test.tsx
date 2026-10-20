import { readFileSync } from 'node:fs'
import path from 'node:path'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useMemo, useState } from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  describeDirectionContract,
  loadImages,
  reveal,
  stubLayout,
} from '@/components/devbake/redesign/contract'
import {
  DirectionDataProvider,
  FIXTURE_DATA,
  useBakeoffDirectionData,
} from '@/components/devbake/redesign/directionData'
import type { DrillController } from '@/components/devbake/redesign/drillCore'
import {
  Redesign2026Bakeoff,
  type Selection,
} from '@/components/devbake/redesign/Redesign2026Bakeoff'
import type {
  AppScreenKey,
  DirectionProps,
  ThemeKey,
  WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import type {
  DirectionActions,
  DirectionData,
  DrillQuestion,
  LessonView,
} from '@/components/devbake/redesign/viewModel'
import type { LexiconEntry, ProtocolEntry, TrapEntry } from '@/data/frameworks'
import { FolioPlus as Folio } from './FolioPlus'
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

/** A key where a real one lands: on whatever has focus (after a pass opens
 *  or moves, its question's heading), so the ancestors' rules apply. */
const pressFocused = (key: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(document.activeElement ?? document.body, { key, ...init })

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
    expect(screen.getByTestId('rd-folio-plus')).not.toHaveTextContent(/undefined|NaN/)
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
    expect(screen.getByRole('heading', { level: 1, name: 'Öva på tid.' })).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-nav-framsteg'))
    expect(go).toHaveBeenLastCalledWith('framsteg')
    expect(screen.getByRole('heading', { level: 1, name: 'Framsteg' })).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-nav-uppslag'))
    expect(go).toHaveBeenLastCalledWith('uppslag')
    // Uppslag opens on the open lesson's chapter: its title is the page's h1.
    expect(
      screen.getByRole('heading', { level: 1, name: 'Svensk läsförståelse' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('rd-nav-uppslag')).toHaveAttribute('aria-current', 'page')
  })

  it('offers a finished part of the plan as a plain row, and says when only the text is left', () => {
    const data = structuredClone(FIXTURE_DATA)
    for (const item of data.home.plan.items) item.completed = true
    const openPlanItem = vi.fn()
    mount(1, { data, actions: { openPlanItem } })
    expect(
      screen.getByText('Idag: läs klart texten – resten av dagens plan är klar.'),
    ).toBeInTheDocument()
    const row = screen.getByText(data.home.plan.items[1].rationale).closest('.fp-plan-row')
    expect(row?.tagName).toBe('DIV')
    expect(row).toHaveTextContent('klar')
    expect(screen.getAllByTestId('rd-resume')).toHaveLength(1)
    expect(openPlanItem).not.toHaveBeenCalled()
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
    // XYZ: the tactic waits in the margin behind "Visa taktik" until the answer.
    fireEvent.click(screen.getByRole('button', { name: 'Visa taktik' }))
    expect(screen.getByRole('complementary', { name: 'Taktik' })).toHaveTextContent(
      'Stapelbråksreceptet',
    )
    expect(document.querySelector('.fp-qnum')).toHaveTextContent('1')
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
    expect(document.querySelector('.fp-qroot')).toHaveAttribute('inert')
    press('b') // Folio+: the viewer keeps the question; a letter chooses on the drill's state
    expect(screen.getByTestId('rd-quant-option-B')).toHaveAttribute('aria-pressed', 'true')
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
    // Folio+: focus goes to the question, not back to Förstora (Enter would reopen it).
    await vi.waitFor(() =>
      expect(document.activeElement?.hasAttribute('data-fp-qregion')).toBe(true),
    )
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

/** A pass that is over while the host stays on screen 9: the runner gone,
 *  the page saying so, an enabled way to the hub and the contents, and the
 *  switcher's keys free again (no capture, no keyscope). */
function expectEnded(title: string) {
  expect(screen.queryByTestId('rd-prov-running')).toBeNull()
  expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^Till provpassen/ })).toBeEnabled()
  expect(screen.getByTestId('rd-nav-idag')).toBeEnabled()
  expect(screen.getByTestId('rd-nav-provpass')).toHaveAttribute('aria-current', 'page')
  expect(document.querySelector('[data-rd-keyscope]')).toBeNull()
  for (const key of ['3', 'ArrowRight', 'ArrowLeft']) {
    expect(pressFocused(key)).toBe(true)
  }
}

describe('Folio · Provpass, the hub', () => {
  it('summons the least-seen pass of the half; a cell of the register moves the lead', () => {
    const startProvpass = vi.fn()
    const openProvResult = vi.fn()
    mount(9, { actions: { startProvpass, openProvResult } })
    expect(screen.getByRole('heading', { level: 1, name: 'Öva på tid.' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'Ett övningspass under riktiga provvillkor: 40 frågor på 55 minuter – ingen feedback förrän du lämnar in.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByTestId('rd-prov-half-kvant')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Förslag · minst sett')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Hösten 2025, provpass 1' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Kvantitativ · XYZ 12 · KVA 10 · NOG 6 · DTK 12')).toBeInTheDocument()
    expect(screen.getByText(/^Du har sett 6 av 40 frågor\./)).toBeInTheDocument()
    expect(screen.queryByText(/^Inskriven:/)).toBeNull()
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
    expect(document.querySelector('.fp-app')).toHaveAttribute('inert')
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
    expect(screen.getByTestId('rd-prov-grid').querySelectorAll('.fp-passindex-run')).toHaveLength(4)
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
    const region = document.querySelector<HTMLElement>('.fp-qscroll')
    if (!region) throw new Error('the page has no scroll region')
    expect(region).toHaveAttribute('data-rd-keyscope')
    // Not prevented, so the region itself scrolls; its keyscope keeps the
    // switcher off.
    expect(fireEvent.keyDown(region, { key: 'ArrowRight' })).toBe(true)
    expect(fireEvent.keyDown(region, { key: ' ' })).toBe(true)
    expect(cell(17)).toHaveAttribute('data-current', 'true')
  })

  it.each([
    'desktop',
    'phone',
  ] as const)('moves from where the focus really is, the question’s heading, on %s', (width) => {
    mount(9, { width })
    startPass()
    const focused = () => document.activeElement
    // Opened: the heading has focus, inside the page's scroll region.
    expect(focused()).toHaveAccessibleName('Kvantitativa jämförelser, fråga 17 av 40')
    expect(focused()?.closest('[data-fp-region]')).not.toBeNull()
    expect(pressFocused('ArrowRight')).toBe(false)
    expect(cell(18)).toHaveAttribute('data-current', 'true')
    // Moved: the next heading has it, and the keys go on working from there.
    expect(focused()).toHaveAccessibleName(/fråga 18 av 40$/)
    expect(pressFocused('ArrowLeft')).toBe(false)
    expect(cell(17)).toHaveAttribute('data-current', 'true')
    pressFocused(' ')
    expect(cell(18)).toHaveAttribute('data-current', 'true')
    pressFocused('Enter')
    expect(cell(19)).toHaveAttribute('data-current', 'true')
    expect(focused()).toHaveAccessibleName(/fråga 19 av 40$/)
    if (width === 'desktop') {
      // A plate's question: the heading on the spread's recto page.
      fireEvent.click(cell(29))
      expect(focused()?.closest('.fp-page--recto')).not.toBeNull()
      expect(pressFocused('ArrowRight')).toBe(false)
      expect(cell(30)).toHaveAttribute('data-current', 'true')
    }
  })

  it('folds the clock to its line and brings it back, in words, at five minutes', () => {
    vi.useFakeTimers()
    const data = structuredClone(FIXTURE_DATA)
    data.provpass.running.remainingSeconds = 302
    mount(9, { data })
    startPass()
    fireEvent.click(screen.getByRole('button', { name: 'Dölj klockan' }))
    expect(screen.getByTestId('rd-prov-timer')).not.toHaveTextContent('05:02')
    expect(document.querySelector('.fp-timeline')).not.toBeNull()
    act(() => vi.advanceTimersByTime(3000))
    expect(screen.getByText('Fem minuter kvar')).toBeInTheDocument()
    expect(screen.getByTestId('rd-prov-timer')).toHaveTextContent('04:59 kvar')
    expect(screen.getByTestId('rd-prov-timer')).toHaveAttribute('data-urgent', 'true')
  })

  it('hands the pass in once when the host’s countdown reaches zero, then ends it for good', () => {
    vi.useFakeTimers()
    const data = structuredClone(FIXTURE_DATA)
    data.provpass.running.remainingSeconds = 3
    const submitProvpass = vi.fn()
    const { supply } = mount(9, { data, actions: { submitProvpass } })
    startPass()
    fireEvent.click(screen.getByTestId('rd-prov-option-B'))
    // The host ticks to zero before the pass's own interval does; then it
    // stays on screen 9.
    const next = structuredClone(data)
    next.provpass.running.remainingSeconds = 0
    supply(next)
    expect(submitProvpass).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/ogiltigt|räknas inte/)).toBeNull()
    expectEnded('Passet är inlämnat.')
    // The answers as handed in, read-only: no option to press any more.
    const answers = screen.getByRole('region', { name: 'Dina svar' })
    expect(within(answers).getByText('Fråga 17, svar B')).toBeInTheDocument()
    expect(within(answers).getByText('Fråga 22, obesvarad')).toBeInTheDocument()
    expect(screen.queryByTestId('rd-prov-option-B')).toBeNull()
    act(() => vi.advanceTimersByTime(5000))
    supply(structuredClone(next))
    expect(submitProvpass).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: /^Till provpassen/ }))
    expect(screen.getByRole('heading', { level: 1, name: 'Öva på tid.' })).toBeInTheDocument()
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
    expect(screen.queryByText(/ogiltigt|räknas inte/)).toBeNull()
    expectEnded('Passet är inlämnat.')
    act(() => vi.advanceTimersByTime(10_000))
    expect(submitProvpass).toHaveBeenCalledTimes(1)
  })

  it('ends calmly on the kit’s NOOP hand-in, the frame back at both widths', () => {
    for (const width of ['desktop', 'phone'] as const) {
      // No submitProvpass: the provider's NOOP stands in, and the host
      // never leaves screen 9.
      const view = mount(9, { width })
      startPass()
      fireEvent.click(screen.getByTestId('rd-prov-submit'))
      fireEvent.click(screen.getByTestId('rd-confirm'))
      expectEnded('Passet är inlämnat.')
      expect(screen.getByText('Svaren nedan är de du lämnade in.')).toBeInTheDocument()
      expect(screen.getByTestId('rd-prov-ended')).toHaveTextContent('16 av 40 frågor besvarade')
      // The account entry is back with the contents.
      expect(screen.getByTestId('rd-account')).toBeEnabled()
      // The contents' Provpass opens the hub too.
      fireEvent.click(screen.getByTestId('rd-nav-provpass'))
      expect(screen.getByRole('heading', { level: 1, name: 'Öva på tid.' })).toBeInTheDocument()
      view.unmount()
    }
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
    fireEvent.click(within(slip).getByRole('button', { name: 'Till fråga 22, obesvarad' }))
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
    // The host stays on screen 9: the pass says it is in, and ↵ goes on to
    // the hub, never to a second hand-in.
    expectEnded('Passet är inlämnat.')
    expect(screen.getByTestId('rd-prov-ended')).toHaveTextContent('40 av 40 frågor besvarade')
    press('Enter')
    expect(screen.getByRole('heading', { level: 1, name: 'Öva på tid.' })).toBeInTheDocument()
    expect(submitProvpass).toHaveBeenCalledTimes(1)
  })

  it('ends the pass on a failed hand-in and never hands it in again, on either clock', () => {
    vi.useFakeTimers()
    const submitProvpass = vi.fn(() => {
      throw new Error('offline')
    })
    const data = structuredClone(FIXTURE_DATA)
    const { supply } = mount(9, { data, actions: { submitProvpass } })
    startPass()
    press('a')
    // By hand, with half an hour left.
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    expect(screen.getByRole('dialog')).toHaveTextContent(
      '23 frågor är obesvarade – fel ger inga avdrag, så gissa hellre.',
    )
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(submitProvpass).toHaveBeenCalledTimes(1)
    // The host's countdown reaches zero, then the pass's own deadline
    // passes: neither hands it in again.
    const next = structuredClone(data)
    next.provpass.running.remainingSeconds = 0
    supply(next)
    expect(submitProvpass).toHaveBeenCalledTimes(1)
    act(() => {
      vi.setSystemTime(Date.now() + 40 * 60_000)
      vi.advanceTimersByTime(2000)
    })
    press('b')
    expect(submitProvpass).toHaveBeenCalledTimes(1)
    // Over for good, and said so where the pass was.
    expect(screen.queryByRole('dialog')).toBeNull()
    expectEnded('Inlämningen gick inte fram.')
    expect(
      screen.getByText(
        'Passet går inte att lämna in igen härifrån. Svaren nedan är dina, som de stod vid inlämningen.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Försök igen/ })).toBeNull()
    expect(
      within(screen.getByRole('region', { name: 'Dina svar' })).getByText('Fråga 17, svar A'),
    ).toBeInTheDocument()
    // The error stays where it is.
    press('Escape')
    expect(screen.getByRole('heading', { level: 1, name: 'Inlämningen gick inte fram.' }))
    fireEvent.click(screen.getByTestId('rd-nav-idag'))
    expect(screen.getByTestId('rd-nav-idag')).toHaveAttribute('aria-current', 'page')
    expect(submitProvpass).toHaveBeenCalledTimes(1)
  })

  it('says a failed hand-in at time out plainly and for good, with the way out', () => {
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
    expect(screen.queryByRole('dialog')).toBeNull()
    expectEnded('Inlämningen gick inte fram.')
    press('Escape')
    // A ↵ held down from before never skips the error; a fresh one leaves.
    press('Enter', { repeat: true })
    expect(
      screen.getByRole('heading', { level: 1, name: 'Inlämningen gick inte fram.' }),
    ).toBeInTheDocument()
    press('Enter')
    expect(submitProvpass).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Öva på tid.' })).toBeInTheDocument()
    // Handed in, not voided or run out: the hub has no note to give.
    expect(screen.queryByText(/^Provet avbröts|^Passet hann ta slut/)).toBeNull()
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
    expect(document.querySelector('.fp-pass-q')).toHaveAttribute('data-dogear', 'true')
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
    fireEvent.click(screen.getByRole('button', { name: 'Till provpassen' }))
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
    expect(document.querySelector('.fp-pfoot')).toContainElement(
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
    const [sel, setSel] = useState<Selection>({ d: 'i', s, w, t: 'light', sbs: false, bare: false })
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

/** The bake-off's own provider value (useBakeoffDirectionData: its fixtures
 *  and its actions, which move a switcher of its own) around Folio, with
 *  `edit` applied to the data: for what the bake-off's fixtures never show,
 *  such as a handed-in pass's recurring trap. */
function mountBakeoffWith(
  s: AppScreenKey,
  edit: (data: DirectionData) => DirectionData,
  w: WidthKey = 'desktop',
) {
  function Host() {
    const [shown, setShown] = useState<AppScreenKey>(s)
    const [theme, setTheme] = useState<ThemeKey>('light')
    const direction = useBakeoffDirectionData({
      screen: shown,
      theme,
      onScreen: setShown,
      onTheme: setTheme,
    })
    const data = useMemo(() => edit(direction.data), [direction.data])
    return (
      <DirectionDataProvider data={data} actions={direction.actions}>
        <Folio screen={shown} width={w} theme={theme} live onScreen={setShown} onTheme={setTheme} />
      </DirectionDataProvider>
    )
  }
  render(<Host />)
}

/** Uppslag names `id` as the lesson asked for, in its chapter's contents,
 *  while the provider's open lesson (the fixtures' own) stays on the page. */
function expectAsked(id: string) {
  expect(screen.getByRole('status')).toHaveTextContent(
    'Lektion begärd. Den öppna texten ligger kvar tills den nya har laddats.',
  )
  expect(screen.getByTestId(`rd-uppslag-entry-${id}`)).toHaveTextContent('begärd')
  expect(screen.getByTestId('rd-lesson')).toHaveTextContent(FIXTURE_DATA.uppslag.open.title)
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

  it('moves the question from the focused heading while the switcher stays put', async () => {
    const onSelect = mountHost(9)
    fireEvent.click(await screen.findByTestId('rd-prov-start', {}, { timeout: 5000 }))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    onSelect.mockClear()
    expect(document.activeElement).toHaveAccessibleName(/fråga 17 av 40$/)
    expect(pressFocused('ArrowRight')).toBe(false)
    expect(screen.getByTestId('rd-prov-cell-18')).toHaveAttribute('data-current', 'true')
    expect(document.activeElement).toHaveAccessibleName(/fråga 18 av 40$/)
    pressFocused(' ')
    expect(screen.getByTestId('rd-prov-cell-19')).toHaveAttribute('data-current', 'true')
    pressFocused('ArrowLeft')
    expect(screen.getByTestId('rd-prov-cell-18')).toHaveAttribute('data-current', 'true')
    // The page's own scroll region keeps its arrows; the switcher stays out.
    const region = document.querySelector<HTMLElement>('.fp-qscroll')
    if (!region) throw new Error('the page has no scroll region')
    fireEvent.keyDown(region, { key: 'ArrowRight' })
    expect(screen.getByTestId('rd-prov-cell-18')).toHaveAttribute('data-current', 'true')
    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
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

  /** The real bake-off on one fixed selection: the switcher's answers are
   *  recorded and never applied, so Folio stays on stage between keys. */
  function stayHost(s: AppScreenKey, w: WidthKey = 'desktop') {
    const onSelect = vi.fn()
    render(
      <Redesign2026Bakeoff
        sel={{ d: 'i', s, w, t: 'light', sbs: false, bare: false }}
        onSelect={onSelect}
      />,
    )
    return onSelect
  }

  /** "3" and ←/→ from the element that has focus reach the switcher. */
  function expectSwitcherKeys(onSelect: ReturnType<typeof vi.fn>, s: AppScreenKey) {
    const from = document.activeElement ?? document.body
    onSelect.mockClear()
    fireEvent.keyDown(from, { key: '3' })
    expect(onSelect).toHaveBeenLastCalledWith({ d: 'c', sbs: false })
    fireEvent.keyDown(from, { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenLastCalledWith({ s: s === 14 ? 1 : s + 1 })
    fireEvent.keyDown(from, { key: 'ArrowLeft' })
    expect(onSelect).toHaveBeenLastCalledWith({ s: s - 1 })
  }

  /** Focus `el` (or, for a region no key would ever be pressed on, leave
   *  the key's target to it) and check the switcher's keys from there. */
  function fromElement(el: HTMLElement, onSelect: ReturnType<typeof vi.fn>, s: AppScreenKey) {
    if (el.tabIndex >= 0 || el.matches('button, input, [tabindex]')) {
      el.focus()
      expect(document.activeElement).toBe(el)
      expectSwitcherKeys(onSelect, s)
      return
    }
    onSelect.mockClear()
    fireEvent.keyDown(el, { key: '3' })
    expect(onSelect).toHaveBeenLastCalledWith({ d: 'c', sbs: false })
    fireEvent.keyDown(el, { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenLastCalledWith({ s: s === 14 ? 1 : s + 1 })
  }

  it.each([
    [2, 'desktop'],
    [2, 'phone'],
    [14, 'desktop'],
    [14, 'phone'],
  ] as const)('lets the switcher’s keys through from every part of reading drill %i on %s', async (s, w) => {
    const onSelect = stayHost(s, w)
    const testId = s === 14 ? 'rd-elf-passage' : 'rd-passage'
    const passage = await screen.findByTestId(testId, {}, { timeout: 5000 })
    // No page or scroll of the drill is a keyscope; only Folio's dialogs are.
    expect(passage.closest('[data-rd-keyscope]')).toBeNull()
    // From where focus is on entry, the passage, and an option.
    expectSwitcherKeys(onSelect, s)
    fromElement(passage, onSelect, s)
    fromElement(passage.querySelector<HTMLElement>('.fp-para') as HTMLElement, onSelect, s)
    const option = reveal('rd-option-A')
    fromElement(option, onSelect, s)
    expect(option.closest('[data-rd-keyscope]')).toBeNull()
    // Svara: focus lands on the verdict, and the keys still get through.
    fireEvent.click(screen.getByTestId('rd-option-A'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    const verdict = screen.getByTestId('rd-verdict')
    expect(document.activeElement).toBe(verdict)
    expectSwitcherKeys(onSelect, s)
    // The facit's controls: Nästa and a disclosure.
    fromElement(screen.getByTestId('rd-next'), onSelect, s)
    const more = document.querySelector<HTMLElement>('.fp-facit .fp-more')
    if (more) fromElement(more, onSelect, s)
  })

  it.each([
    'desktop',
    'phone',
  ] as const)('lets the switcher’s keys through from the Facit screen on %s, focus where it was', async (w) => {
    const onSelect = stayHost(3, w)
    const verdict = await screen.findByTestId('rd-verdict', {}, { timeout: 5000 })
    // Opened graded by the switcher: no focus move on a mount.
    expect(document.activeElement).not.toBe(verdict)
    expectSwitcherKeys(onSelect, 3)
    fromElement(verdict, onSelect, 3)
    fromElement(screen.getByTestId('rd-next'), onSelect, 3)
    fromElement(screen.getAllByTestId(/^rd-step-toggle-/)[0], onSelect, 3)
  })

  it.each([
    'desktop',
    'phone',
  ] as const)('lets the switcher’s keys through from every part of Uppslag on %s', async (w) => {
    const onSelect = stayHost(12, w)
    await screen.findByTestId('rd-lesson', {}, { timeout: 5000 })
    expect(document.querySelector('[data-rd-keyscope]')).toBeNull()
    expectSwitcherKeys(onSelect, 12)
    for (const id of [
      'rd-uppslag-entry-LAS-TYPE-002',
      'rd-lesson-read',
      'rd-lesson-practice',
      'rd-uppslag-section-nog',
    ]) {
      fromElement(screen.getByTestId(id), onSelect, 12)
    }
    fromElement(screen.getByTestId('rd-lesson'), onSelect, 12)
  })

  it.each([
    'desktop',
    'phone',
  ] as const)('lets the switcher’s keys through on Konto on %s, and keeps them in its slip', async (w) => {
    const onSelect = stayHost(13, w)
    await screen.findByTestId('rd-konto-identity', {}, { timeout: 5000 })
    expectSwitcherKeys(onSelect, 13)
    for (const id of ['rd-konto-coach-kompis', 'rd-konto-mode-dark', 'rd-konto-export']) {
      fromElement(screen.getByTestId(id), onSelect, 13)
    }
    const remove = screen.getByTestId('rd-konto-delete')
    fromElement(remove, onSelect, 13)
    fireEvent.click(remove)
    const slip = screen.getByRole('dialog', { name: 'Radera konto' })
    onSelect.mockClear()
    for (const key of ['3', 'ArrowRight']) {
      fireEvent.keyDown(within(slip).getByRole('button', { name: 'Avbryt' }), { key })
      fireEvent.keyDown(within(slip).getByTestId('rd-konto-delete-word'), { key })
    }
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.click(within(slip).getByRole('button', { name: 'Avbryt' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(screen.getByTestId('rd-konto-delete'))
    expectSwitcherKeys(onSelect, 13)
  })

  // The bake-off's openLesson only shows screen 12: its open lesson stays
  // the fixtures' own, so Uppslag must say which one was asked for.
  it.each([
    'desktop',
    'phone',
  ] as const)('names the lesson Fällor looks up on Uppslag, the open one kept, on %s', async (w) => {
    const onSelect = mountHost(11, w)
    fireEvent.click(await screen.findByRole('button', { name: /^Alla fällor/ }, { timeout: 5000 }))
    fireEvent.click(screen.getByRole('button', { name: 'Slå upp Bråkaddition' }))
    expect(onSelect).toHaveBeenLastCalledWith({ s: 12 })
    expectAsked('XYZ-TRAP-016')
  })

  it.each([
    'desktop',
    'phone',
  ] as const)('names the lesson a result’s recurring trap looks up on Uppslag, on %s', (w) => {
    // The fixtures' result has no recurring trap (directionData.tsx,
    // provResultView): the bake-off's provider value carries one here.
    mountBakeoffWith(
      10,
      (data) => {
        const next = structuredClone(data)
        next.provpass.result.trap = {
          frameworkId: 'NOG-TRAP-001',
          section: 'NOG',
          count: 3,
          headline: null,
        }
        return next
      },
      w,
    )
    const trap = screen.getByRole('region', { name: 'Återkommande fälla' })
    fireEvent.click(within(trap).getByRole('button', { name: /^Slå upp/ }))
    expectAsked('NOG-TRAP-001')
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
    // An authentic quant pass rests on no övningstext: no calibration caveat.
    expect(screen.queryByText(FIXTURE_DATA.copy.estimateCaveat)).toBeNull()
    // Learning first: Repetera holds the misses. Esc goes to Provpass.
    fireEvent.click(screen.getByRole('button', { name: /^Till Repetera/ }))
    expect(openRepetera).toHaveBeenCalledTimes(1)
    press('Enter')
    expect(openRepetera).toHaveBeenCalledTimes(2)
    press('Escape')
    expect(go).toHaveBeenLastCalledWith('provpass')
    expect(screen.getByRole('heading', { level: 1, name: 'Öva på tid.' })).toBeInTheDocument()
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

  it('adds the calibration caveat when the pass’s own questions carry P5 texts', () => {
    const data = structuredClone(FIXTURE_DATA)
    const run = data.provpass.running
    const r = data.provpass.result
    // The pass's questions are still at hand: a verbal pass whose LÄS text
    // is a P5 unit (an övningstext).
    run.questions = data.drills.reading.questions
    run.half = 'verbal'
    r.passId = run.passId
    r.half = 'verbal'
    r.presented = run.questions.length
    r.answered = run.questions.length
    r.correct = run.questions.length - 1
    r.missed = [run.questions[1].qid]
    r.sections = [{ section: 'LÄS', presented: 4, correct: 3, timeSeconds: 700, quotaSeconds: 825 }]
    r.trap = null
    mount(10, { data })
    const caveat = screen.getByText(data.copy.estimateCaveat)
    expect(caveat.closest('.fp-footnote')).toHaveTextContent(/^\*\*Uppskattningen/)
    // The figure carries both marks, and says so in words.
    const score = screen.getByTestId('rd-prov-score')
    expect(within(score).getByText('*,**')).toBeInTheDocument()
    expect(score).toHaveTextContent('rätt, med förbehåll i fotnoten')
    // The basis footnote is still the first.
    expect(
      screen.getByText(/UHR normerar hela den verbala delen/).closest('.fp-footnote'),
    ).toHaveTextContent(/^\*Härlett/)
  })

  it('adds it for P5 misses too, and never claims P5 when the provenance is unknown', () => {
    const data = structuredClone(FIXTURE_DATA)
    const r = data.provpass.result
    // Another pass than the running one: its questions are not at hand.
    r.passId = 'var-2026:verb1'
    r.half = 'verbal'
    r.sitting = 'Våren 2026'
    r.pass = 'Provpass 1'
    r.sections = (['ORD', 'LÄS', 'MEK', 'ELF'] as const).map((section) => ({
      section,
      presented: 10,
      correct: 8,
      timeSeconds: 780,
      quotaSeconds: 825,
    }))
    r.trap = null
    r.missed = ['var-2026-verb1-ORD-006', 'p5-elf-b19-003-r1-ELF-001']
    const known = mount(10, { data })
    expect(screen.getByText(data.copy.estimateCaveat)).toBeInTheDocument()
    expect(within(screen.getByTestId('rd-prov-score')).getByText('*,**')).toBeInTheDocument()
    known.unmount()
    // Nothing says where its texts came from: no caveat, no second mark.
    const unknown = structuredClone(data)
    unknown.provpass.result.missed = ['var-2026-verb1-ORD-006', 'var-2026-verb1-ELF-033']
    mount(10, { data: unknown })
    expect(screen.queryByText(data.copy.estimateCaveat)).toBeNull()
    expect(within(screen.getByTestId('rd-prov-score')).getByText('*')).toBeInTheDocument()
    expect(screen.getByTestId('rd-prov-score')).not.toHaveTextContent('förbehåll')
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
    expect(screen.getByTestId('rd-folio-plus')).not.toHaveTextContent(/serie|rekord/i)
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
    expect(chart.querySelectorAll('.fp-chart-bridge')).toHaveLength(1)
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

// ── Batch 3: Uppslag, Konto, ELF ─────────────────────────────────────

const OPEN = FIXTURE_DATA.uppslag.open

/** The fixture data with another lesson open (a test's own entry). */
function withOpen(
  open: Omit<LessonView, 'read' | 'practice'> & Partial<LessonView>,
): DirectionData {
  const data = structuredClone(FIXTURE_DATA)
  data.uppslag.open = {
    read: false,
    practice: { questions: open.entry.example_questions.length },
    ...open,
  }
  return data
}

/** A LÄS entry as the catalog holds one (test text). */
function lasEntry(id: string, title: string): ProtocolEntry {
  return {
    id,
    question_type: title,
    attack_protocol: ['Läs frågan först.', 'Leta upp stället i texten.'],
    common_distractors: [{ pattern: 'Rätt ord, fel ställe', why_it_traps: 'Det låter bekant.' }],
    example_questions: ['host-2020-verb1-LÄS-001'],
  }
}

/** Marks the LÄS chapter's entries read (all, or all but `except`). */
function readLas(data: DirectionData, except?: string): void {
  const las = data.uppslag.sections.find((s) => s.section === 'LÄS')
  for (const e of las?.entries ?? []) e.read = e.id !== except
  if (data.uppslag.open.section === 'LÄS') data.uppslag.open.read = data.uppslag.open.id !== except
}

describe('Folio · Uppslag & lektion', () => {
  it('sets the spread: the chapter’s contents with the ribbon at the open entry, the chapters, the entry', () => {
    mount(12)
    const opener = screen
      .getByRole('heading', { level: 1, name: 'Svensk läsförståelse' })
      .closest('header') as HTMLElement
    expect(opener).toHaveTextContent('Kapitel 2')
    expect(within(opener).getByText('Åtta frågetyper med angreppsprotokoll')).toBeInTheDocument()
    const toc = screen.getByRole('navigation', { name: 'Innehåll: Svensk läsförståelse' })
    const open = within(toc).getByTestId(`rd-uppslag-entry-${OPEN.id}`)
    expect(open).toHaveAttribute('aria-current', 'page')
    expect(open.querySelector('.fp-ribbon')).not.toBeNull()
    expect(toc.querySelectorAll('.fp-ribbon')).toHaveLength(1)
    // Read entries say so; the open one its reading time; never a raw id.
    expect(within(toc).getByTestId('rd-uppslag-entry-LAS-TYPE-001')).toHaveAccessibleName(
      'Direkt detalj, läst',
    )
    expect(open).toHaveAccessibleName(/^Författarens hållning, \d+ min$/)
    expect(screen.getByTestId('rd-folio-plus')).not.toHaveTextContent(/LAS-TYPE|TYPE 0/)
    // The entry: its protocol, its traps, where its questions come from.
    const lesson = screen.getByTestId('rd-lesson')
    expect(within(lesson).getByRole('heading', { level: 2 })).toHaveTextContent(OPEN.title)
    const steps = within(lesson).getAllByRole('listitem')
    expect(steps).toHaveLength(5)
    expect(within(lesson).getByRole('heading', { name: 'Vanliga fällor' })).toBeInTheDocument()
    expect(
      within(lesson).getByText('Tio frågor ur riktiga prov, från hösten 2013 till våren 2025.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Frågetyp 3 av 8')).toBeInTheDocument()
    // The book's chapters, the LÄS one current, each with what is read.
    expect(screen.getByTestId('rd-uppslag-section-las')).toHaveAttribute('aria-current', 'true')
    expect(screen.getByTestId('rd-uppslag-section-las')).toHaveAccessibleName(
      'LÄS, Svensk läsförståelse, 2 av 8 lästa',
    )
    // One filled button on the page.
    expect(document.querySelectorAll('.fp-btn')).toHaveLength(1)
  })

  it('asks the host for another entry and says plainly that the open one stays until it comes', () => {
    const openLesson = vi.fn()
    const { supply } = mount(12, { actions: { openLesson } })
    fireEvent.click(screen.getByTestId('rd-uppslag-entry-LAS-TYPE-002'))
    expect(openLesson).toHaveBeenCalledWith('LAS-TYPE-002')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Lektion begärd. Den öppna texten ligger kvar tills den nya har laddats.',
    )
    expect(screen.getByTestId('rd-uppslag-entry-LAS-TYPE-002')).toHaveTextContent('begärd')
    expect(screen.getByTestId('rd-lesson')).toHaveTextContent(OPEN.title)
    // The host opens it: the notice goes, the ribbon and the page follow.
    supply(
      withOpen({
        id: 'LAS-TYPE-002',
        section: 'LÄS',
        family: 'las_taxonomy',
        title: 'Slutsatsdragning / implikation',
        entry: lasEntry('LAS-TYPE-002', 'Slutsatsdragning / implikation'),
      }),
    )
    expect(screen.queryByText(/Lektion begärd/)).toBeNull()
    expect(screen.getByTestId('rd-lesson')).toHaveTextContent('Slutsatsdragning / implikation')
    expect(screen.getByTestId('rd-uppslag-entry-LAS-TYPE-002')).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByText('Frågetyp 2 av 8')).toBeInTheDocument()
  })

  it('marks read and asks for the next unread entry; J and K step, ↵ presses the button', () => {
    const toggleLessonRead = vi.fn()
    const openLesson = vi.fn()
    mount(12, { actions: { toggleLessonRead, openLesson } })
    fireEvent.click(screen.getByRole('button', { name: /^Läst – nästa frågetyp/ }))
    expect(toggleLessonRead).toHaveBeenCalledWith(OPEN.id)
    // 1 and 4 are read: the next unread one after 3 is 5.
    expect(openLesson).toHaveBeenLastCalledWith('LAS-TYPE-005')
    press('j')
    expect(openLesson).toHaveBeenLastCalledWith('LAS-TYPE-006')
    press('k')
    press('k')
    expect(openLesson).toHaveBeenLastCalledWith('LAS-TYPE-004')
    // Back on the open entry: nothing to ask for, the notice goes.
    press('k')
    expect(openLesson).toHaveBeenCalledTimes(4)
    expect(screen.queryByText(/Lektion begärd/)).toBeNull()
    press('Enter')
    expect(toggleLessonRead).toHaveBeenCalledTimes(2)
  })

  it('reads the toggle from the data, and Ångra undoes it', () => {
    const toggleLessonRead = vi.fn()
    const data = structuredClone(FIXTURE_DATA)
    data.uppslag.open.read = true
    mount(12, { data, actions: { toggleLessonRead } })
    const read = screen.getByTestId('rd-lesson-read')
    expect(read).toHaveAttribute('aria-pressed', 'true')
    expect(read).toHaveTextContent('LästÅngra')
    fireEvent.click(read)
    expect(toggleLessonRead).toHaveBeenCalledWith(OPEN.id)
    // Read already: the button moves on without marking.
    expect(screen.getByRole('button', { name: /^Nästa frågetyp/ })).toBeInTheDocument()
  })

  it('ends the chapter only once the data says every entry is read', () => {
    const toggleLessonRead = vi.fn()
    const startDrill = vi.fn()
    const data = structuredClone(FIXTURE_DATA)
    readLas(data, OPEN.id)
    const { supply } = mount(12, { data, actions: { toggleLessonRead, startDrill } })
    fireEvent.click(screen.getByRole('button', { name: /^Läst – slutför kapitlet/ }))
    expect(toggleLessonRead).toHaveBeenCalledWith(OPEN.id)
    // Not confirmed yet: no colophon.
    expect(screen.queryByText('Kapitlet är läst.')).toBeNull()
    const confirmed = structuredClone(data)
    readLas(confirmed)
    supply(confirmed)
    expect(screen.getByRole('heading', { name: /Kapitlet är läst\./ })).toBeInTheDocument()
    // Its one action replaces the head's: the chapter's practice, once.
    expect(screen.getAllByRole('button', { name: /^Öva hela LÄS/ })).toHaveLength(1)
    press('Enter')
    expect(startDrill).toHaveBeenLastCalledWith({ kind: 'section', section: 'LÄS' })
    fireEvent.click(screen.getByRole('button', { name: 'Tillbaka till sidan' }))
    expect(screen.getByTestId('rd-lesson')).toBeInTheDocument()
    // Later visits close the contents with the colophon's line.
    expect(screen.getByText(/Kapitlet är läst\./)).toHaveClass('fp-up-ended')
  })

  it.each([
    'desktop',
    'phone',
  ] as const)('offers practice only when the entry has questions to play (%s)', (width) => {
    const data = structuredClone(FIXTURE_DATA)
    data.uppslag.open = {
      ...data.uppslag.open,
      entry: { ...OPEN.entry, example_questions: [] },
      practice: { questions: 0 },
    }
    const startDrill = vi.fn()
    mount(12, { data, width, actions: { startDrill } })
    expect(screen.queryByTestId('rd-lesson-practice')).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Exempelfrågor' })).toBeNull()
    const whole = screen.getAllByRole('button', { name: /^Öva hela LÄS/ })
    expect(whole.length).toBeGreaterThan(0)
    fireEvent.click(whole[whole.length - 1])
    expect(startDrill).toHaveBeenLastCalledWith({ kind: 'section', section: 'LÄS' })
  })

  it('sets a trap with its countermeasure as the one ruled note, and a word root at the largest size', () => {
    const trap: TrapEntry = {
      id: 'NOG-TRAP-001',
      pattern_description: 'Studenten ser ett värde i (1) och slutar läsa.',
      why_it_occurs: 'Det första som räcker känns som svaret.',
      common_distractor_signature: 'A, fast (2) behövs.',
      countermeasure: 'Pröva påståendena var för sig och sedan tillsammans.',
      example_questions: [],
      tldr: 'Ett värde i (1) är inte samma sak som tillräcklig information.',
      worked_example: {
        setup: 'x och y är heltal.',
        trap_thinking: '(1) ger x, alltså räcker det.',
        correct_thinking: 'y är fortfarande okänd.',
        answer: 'C',
      },
    }
    const { unmount } = mount(12, {
      data: withOpen({
        id: trap.id,
        section: 'NOG',
        family: 'nog_traps',
        title: trap.pattern_description,
        entry: trap,
      }),
    })
    const lesson = screen.getByTestId('rd-lesson')
    expect(within(lesson).getByRole('heading', { level: 2 })).toHaveTextContent(trap.tldr ?? '')
    expect(within(lesson).getByRole('region', { name: 'Motåtgärd' })).toHaveTextContent(
      trap.countermeasure,
    )
    expect(within(lesson).getByText('Fällans tanke')).toBeInTheDocument()
    expect(within(lesson).getByText(/Det typiska felsvaret/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Läst – nästa fälla/ })).toBeInTheDocument()
    expect(screen.getByText('Fälla 1 av 25')).toBeInTheDocument()
    unmount()
    const root: LexiconEntry = {
      id: 'ORD-ROOT-001',
      root: 'för-',
      origin: 'Germanic',
      meaning: 'framför, före, bort eller förändring',
      example_words: ['förklara', 'förändra'],
      example_questions: ['host-2019-verb1-ORD-001'],
    }
    mount(12, {
      data: withOpen({
        id: root.id,
        section: 'ORD',
        family: 'ord_roots',
        title: root.root,
        entry: root,
      }),
    })
    const word = screen.getByRole('heading', { level: 2, name: 'för-' })
    expect(word).toHaveClass('fp-up-root')
    expect(screen.getByText('germanskt')).toBeInTheDocument()
    expect(screen.getByText('förklara')).toBeInTheDocument()
    expect(screen.getByTestId('rd-lesson-practice')).toHaveTextContent('Öva ord med denna rot')
  })

  it('says plainly that there is nothing here yet when no catalog has come', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.uppslag.sections = []
    mount(12, { data })
    expect(screen.getByRole('heading', { level: 1, name: 'Läs först.' })).toBeInTheDocument()
    expect(screen.getByText('Inget innehåll här ännu.')).toBeInTheDocument()
  })

  it('turns the verso to another chapter from the chapter list, the open entry kept', () => {
    mount(12)
    fireEvent.click(screen.getByTestId('rd-uppslag-section-nog'))
    expect(
      screen.getByRole('heading', { level: 1, name: 'Kvantitativa resonemang' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('rd-uppslag-entry-NOG-TRAP-001')).toBeInTheDocument()
    expect(screen.getByTestId('rd-uppslag-section-nog')).toHaveAttribute('aria-current', 'true')
    expect(screen.getByTestId('rd-lesson')).toHaveTextContent(OPEN.title)
    expect(screen.getByText('Uppslag · NOG')).toBeInTheDocument()
  })

  it('folds the contents to the thumb index for the spread, and ⌘B opens them there only', () => {
    mount(1)
    const app = () => document.querySelector('.fp-app')
    expect(app()).toHaveAttribute('data-collapsed', 'false')
    fireEvent.click(screen.getByTestId('rd-nav-uppslag'))
    expect(app()).toHaveAttribute('data-collapsed', 'true')
    press('b', { ctrlKey: true })
    expect(app()).toHaveAttribute('data-collapsed', 'false')
    fireEvent.click(screen.getByTestId('rd-nav-framsteg'))
    expect(app()).toHaveAttribute('data-collapsed', 'false')
    fireEvent.click(screen.getByTestId('rd-nav-uppslag'))
    expect(app()).toHaveAttribute('data-collapsed', 'true')
  })

  it('names a lesson asked for from Idag’s plan while the open one stays', () => {
    const openPlanItem = vi.fn()
    const { goTo } = mount(1, { actions: { openPlanItem } })
    const item = FIXTURE_DATA.home.plan.items.find((i) => i.kind === 'lesson')
    if (!item?.framework) throw new Error('the fixture plan has no lesson')
    const row = screen.getByText(item.rationale).closest('button')
    if (!row) throw new Error('the lesson row is not a button')
    fireEvent.click(row)
    expect(openPlanItem).toHaveBeenCalledWith(item.id)
    goTo(12)
    expect(screen.getByRole('status')).toHaveTextContent(/^Lektion begärd\./)
    expect(screen.getByTestId(`rd-uppslag-entry-${item.framework}`)).toHaveTextContent('begärd')
    // Asked once: a later visit opens plainly.
    goTo(1)
    goTo(12)
    expect(screen.queryByText(/Lektion begärd/)).toBeNull()
  })

  it('looks up the facit’s pattern in Uppslag from a drill', () => {
    const openLesson = vi.fn()
    const { goTo } = mount(14, { actions: { openLesson } })
    fireEvent.click(screen.getByTestId('rd-option-A'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(screen.getByText('Direkt detaljhämtning')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Slå upp/ }))
    expect(openLesson).toHaveBeenCalledWith('ELF-TYPE-001')
    goTo(12)
    expect(screen.getByRole('status')).toHaveTextContent(/^Lektion begärd\./)
    expect(screen.getByTestId('rd-uppslag-entry-ELF-TYPE-001')).toHaveTextContent('begärd')
  })

  it('forgets an entry asked for on Uppslag itself once the reader leaves it', () => {
    const openLesson = vi.fn()
    const { goTo } = mount(12, { actions: { openLesson } })
    fireEvent.click(screen.getByTestId('rd-uppslag-entry-LAS-TYPE-002'))
    expect(openLesson).toHaveBeenCalledWith('LAS-TYPE-002')
    expect(screen.getByRole('status')).toHaveTextContent(/^Lektion begärd\./)
    // The host never delivered it; a later visit opens plainly.
    goTo(1)
    goTo(12)
    expect(screen.queryByText(/Lektion begärd/)).toBeNull()
    expect(screen.getByTestId('rd-uppslag-entry-LAS-TYPE-002')).not.toHaveTextContent('begärd')
  })
})

describe('Folio · Konto & inställningar', () => {
  it.each([
    'desktop',
    'phone',
  ] as const)('sets the imprint page: six sections, its index, the shortcuts, no filled button (%s)', (width) => {
    mount(13, { width })
    expect(screen.getByRole('heading', { level: 1, name: 'Ditt konto.' })).toBeInTheDocument()
    for (const title of ['Du', 'Provet', 'Övningen', 'Utseende', 'Din data', 'Hjälp']) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument()
    }
    expect(screen.getByRole('navigation', { name: 'På den här sidan' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Kortkommandon' })).toBeInTheDocument()
    expect(document.querySelector('.fp-kt .fp-btn')).toBeNull()
    // Konto is no destination: nothing in the contents is current.
    for (const nav of screen.getAllByTestId(/^rd-nav-/)) {
      expect(nav).not.toHaveAttribute('aria-current')
    }
    // Left out by the spec (meta.omits): no font or density rows. Folio+
    // brings the palette back.
    expect(screen.queryByTestId(/^rd-konto-(font|density)-/)).toBeNull()
    expect(screen.getByTestId('rd-konto-palette-sage')).toBeInTheDocument()
    expect(screen.getByTestId('rd-konto-identity')).toHaveTextContent(
      FIXTURE_DATA.konto.identity.email,
    )
    // On arrival the page keeps its focus and its top.
    expect(document.activeElement).toBe(document.body)
  })

  it('sends each choice as its own patch, the theme through setTheme, and says a failed save', () => {
    const setPrefs = vi.fn()
    const setTheme = vi.fn()
    const { unmount } = mount(13, { actions: { setPrefs, setTheme } })
    fireEvent.click(screen.getByRole('button', { name: 'Slumpat' }))
    expect(setPrefs).toHaveBeenLastCalledWith({ smartDrill: false })
    fireEvent.click(screen.getByTestId('rd-konto-coach-kompis'))
    expect(setPrefs).toHaveBeenLastCalledWith({ coach: 'kompis' })
    fireEvent.click(screen.getByTestId('rd-konto-mode-dark'))
    expect(setTheme).toHaveBeenLastCalledWith('dark')
    // The chosen voice's description is shown and read with the choice.
    const coach = screen.getByRole('group', { name: 'Coach' })
    expect(coach).toHaveAccessibleDescription(
      FIXTURE_DATA.konto.options.coach.find((o) => o.key === 'taktiker')?.blurb ?? '',
    )
    unmount()
    const failing = vi.fn(() => {
      throw new Error('offline')
    })
    mount(13, { actions: { setPrefs: failing } })
    fireEvent.click(screen.getByTestId('rd-konto-coach-kompis'))
    expect(screen.getByText('Det gick inte att spara – försök igen.')).toBeInTheDocument()
    expect(screen.getByTestId('rd-konto-coach-taktiker')).toHaveAttribute('aria-pressed', 'true')
  })

  it('opens at the place each account-slip row names, and Esc goes back to the page before', () => {
    const openKonto = vi.fn()
    const go = vi.fn()
    mount(5, { actions: { openKonto, go } })
    const row = (name: RegExp) => {
      fireEvent.click(screen.getByTestId('rd-account'))
      const menu = screen.getByTestId('rd-account-menu')
      return within(menu).getByRole('button', { name })
    }
    fireEvent.click(screen.getByTestId('rd-account'))
    // Tema is the two words production saves.
    expect(within(screen.getByTestId('rd-account-menu')).queryByText('System')).toBeNull()
    fireEvent.click(screen.getByTestId('rd-account'))
    fireEvent.click(row(/^Inställningar/))
    expect(openKonto).toHaveBeenCalledTimes(1)
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Övningen' }))
    fireEvent.click(row(/^Hjälp/))
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Kortkommandon' }))
    fireEvent.click(row(/^Konto/))
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 }))
    expect(openKonto).toHaveBeenCalledTimes(3)
    press('Escape')
    expect(go).toHaveBeenLastCalledWith('ova')
    expect(screen.getByRole('heading', { level: 1, name: 'Vad tränar vi?' })).toBeInTheDocument()
  })

  it('asks for the typed word on a slip; ↵ never presses the act; it is sent once, as a preview', () => {
    const deleteAccount = vi.fn()
    const go = vi.fn()
    mount(13, { actions: { deleteAccount, go } })
    const remove = screen.getByTestId('rd-konto-delete')
    remove.focus()
    fireEvent.click(remove)
    const slip = screen.getByRole('dialog', { name: 'Radera konto' })
    expect(slip.tagName).toBe('DIALOG')
    expect(slip).toHaveTextContent('Förhandsvisning')
    const word = within(slip).getByTestId('rd-konto-delete-word')
    expect(document.activeElement).toBe(word)
    const act = within(slip).getByTestId('rd-konto-delete-confirm')
    expect(act).toHaveAttribute('aria-disabled', 'true')
    expect(act).toHaveAccessibleDescription('Skriv ”radera” för att aktivera knappen.')
    // Case and the spaces around it do not matter.
    fireEvent.change(word, { target: { value: ' Radera ' } })
    expect(act).toHaveAttribute('aria-disabled', 'false')
    expect(fireEvent.keyDown(act, { key: 'Enter' })).toBe(false)
    expect(deleteAccount).not.toHaveBeenCalled()
    // The page's Esc rests while the slip is open.
    press('Escape')
    expect(go).not.toHaveBeenCalled()
    fireEvent.click(act)
    fireEvent.click(act)
    expect(deleteAccount).toHaveBeenCalledTimes(1)
    expect(within(slip).getByRole('status')).toHaveTextContent(
      'Begäran om radering är skickad. I förhandsvisningen raderas ingenting.',
    )
    expect(screen.queryByText(/Kontot är raderat/)).toBeNull()
    // Esc (the dialog's cancel) closes it and gives focus back.
    fireEvent(slip, new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(screen.getByTestId('rd-konto-delete'))
  })

  it('says a refused deletion and a failed export plainly, and lets them be tried again', () => {
    const deleteAccount = vi.fn(() => {
      throw new Error('nope')
    })
    const exportData = vi.fn(() => {
      throw new Error('nope')
    })
    mount(13, { actions: { deleteAccount, exportData } })
    fireEvent.click(screen.getByTestId('rd-konto-export'))
    expect(
      screen.getByText(/^Kunde inte exportera just nu\. Försök igen om en stund\./),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Försök igen' }))
    expect(exportData).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByTestId('rd-konto-delete'))
    const slip = screen.getByRole('dialog', { name: 'Radera konto' })
    fireEvent.change(within(slip).getByTestId('rd-konto-delete-word'), {
      target: { value: 'radera' },
    })
    fireEvent.click(within(slip).getByTestId('rd-konto-delete-confirm'))
    expect(within(slip).getByRole('status')).toHaveTextContent(
      'Kunde inte radera kontot. Inget raderades – försök igen.',
    )
    fireEvent.click(within(slip).getByTestId('rd-konto-delete-confirm'))
    expect(deleteAccount).toHaveBeenCalledTimes(2)
  })

  it('says an export as asked for, never as done', () => {
    const exportData = vi.fn()
    mount(13, { actions: { exportData } })
    fireEvent.click(screen.getByTestId('rd-konto-export'))
    expect(exportData).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Exporten är begärd.')).toBeInTheDocument()
  })
})

/** An ELF sitting of a gap text: two gaps, each a question (test text). */
function gapData(): DirectionData {
  const data = structuredClone(FIXTURE_DATA)
  const elf = data.drills.elf
  const base = elf.questions[0]
  const passage = {
    paragraphs: [
      'The kettle sits on the counter, and by nine o’clock it has become a small parliament: each colleague who passes adds a remark, though nobody quite takes ___(1)___ for the descaling.',
      'A rota on the fridge is meant to ___(2)___ the matter.',
    ],
    byline: null,
    title: 'Test Gaps',
    lang: 'en' as const,
    synthetic: true,
    unitId: 'elf-test-gaps',
  }
  const gap = (n: number, words: string[]): DrillQuestion => ({
    ...base,
    qid: `elf-test-gaps-${n}`,
    number: n,
    prompt: `Gap (${n})`,
    passage,
    options: words.map((text, i) => ({ letter: (['A', 'B', 'C', 'D'] as const)[i], text })),
    answer: 'A',
  })
  data.drills.elf = {
    ...elf,
    id: 'elf-gaps',
    questions: [
      gap(1, ['charge', 'credit', 'notice', 'turns']),
      gap(2, ['settle', 'cover', 'carry', 'mind']),
    ],
    explanations: {},
    start: { index: 0, results: [] },
  }
  return data
}

describe('Folio · ELF-läsfråga', () => {
  const Q = FIXTURE_DATA.drills.elf.questions[0]

  it('marks only the English content lang="en"; the chrome stays Swedish, inside the article too', () => {
    mount(14)
    const passage = screen.getByTestId('rd-elf-passage')
    expect(passage.closest('article')).toHaveAttribute('lang', 'en')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Counting Pots from the Pavement',
    )
    expect(screen.getByTestId('rd-note-toggle').closest('[lang]')).toHaveAttribute('lang', 'sv')
    expect(screen.getByTestId('rd-note')).toHaveAttribute('lang', 'sv')
    expect(screen.getByTestId('rd-badge').closest('[lang]')).toHaveAttribute('lang', 'sv')
    expect(passage.querySelector('.fp-pnum')).toHaveAttribute('lang', 'sv')
    expect(screen.getByRole('heading', { level: 2, name: Q.prompt ?? '' })).toHaveAttribute(
      'lang',
      'en',
    )
    const option = screen.getByTestId('rd-option-A')
    expect(
      within(option)
        .getByText(Q.options?.[0].text ?? '')
        .closest('[lang]'),
    ).toHaveAttribute('lang', 'en')
    expect(within(option).getByText(/Alternativ A/)).toHaveAttribute('lang', 'sv')
    expect(screen.getByTestId('rd-eliminate-A')).toHaveAttribute('lang', 'sv')
    // The facit: Swedish heads over English bodies, and no ¶ links.
    fireEvent.click(option)
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(screen.getByTestId('rd-verdict').closest('[lang]')).toHaveAttribute('lang', 'sv')
    const head = screen.getByRole('heading', { name: 'Lösningen' })
    expect(head.closest('[lang]')).toHaveAttribute('lang', 'sv')
    expect(head.nextElementSibling).toHaveAttribute('lang', 'en')
    expect(screen.getByText('Understand the question').closest('[lang]')).toHaveAttribute(
      'lang',
      'en',
    )
    expect(screen.getByTestId('rd-technique').querySelector('p')).toHaveAttribute('lang', 'en')
    expect(screen.queryAllByTestId(/^rd-cite-/)).toHaveLength(0)
    expect(passage.querySelector('mark')).toBeNull()
  })

  it.each([
    'desktop',
    'phone',
  ] as const)('answers on a–d and ↵, moves focus to the verdict, then to the colophon (%s)', (width) => {
    const lock = vi.fn(() => ({ correct: true }))
    const exit = vi.fn()
    const go = vi.fn()
    const { onScreen } = mount(14, { width, actions: { go, drill: { lock, exit } } })
    reveal('rd-option-A')
    press('a')
    expect(screen.getByTestId('rd-option-A')).toHaveAttribute('aria-pressed', 'true')
    // Esc never leaves the text.
    press('Escape')
    expect(exit).not.toHaveBeenCalled()
    press('Enter')
    expect(lock).toHaveBeenCalledWith(expect.objectContaining({ qid: Q.qid }), 'A')
    expect(document.activeElement).toBe(screen.getByTestId('rd-verdict'))
    // No switcher move: ELF asks only through its controller.
    expect(onScreen).not.toHaveBeenCalled()
    press('Enter')
    const title = screen.getByRole('heading', { name: /Counting Pots from the Pavement/ })
    expect(title).toHaveAttribute('lang', 'en')
    expect(document.activeElement).toBe(title)
    expect(screen.getByTestId('rd-done')).toHaveTextContent('1 fråga · 1 rätt')
    // "Till Idag" goes to Idag, the page its label names.
    fireEvent.click(screen.getByRole('button', { name: 'Till Idag' }))
    expect(go).toHaveBeenLastCalledWith('idag')
    expect(exit).not.toHaveBeenCalled()
    expect(onScreen).not.toHaveBeenCalled()
  })

  it('leaves mid-text through Avsluta and the controller alone, for where the reader came from', () => {
    const exit = vi.fn()
    const { goTo, onScreen } = mount(12, {
      actions: { drill: { lock: () => ({ correct: true }), exit } },
    })
    goTo(14)
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(exit).toHaveBeenCalledTimes(1)
    expect(onScreen).not.toHaveBeenCalled()
    // The colophon names the page the text was opened from.
    goTo(12)
    goTo(14)
    fireEvent.click(screen.getByTestId('rd-option-A'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(screen.getByRole('button', { name: 'Till Uppslag' })).toBeInTheDocument()
  })

  it('opens a sitting the host cuts short at its start, never past its end', () => {
    const data = structuredClone(FIXTURE_DATA)
    const [q] = data.drills.elf.questions
    data.drills.elf.questions = [1, 2, 3].map((n) => ({ ...q, qid: `${q.qid}-${n}`, number: n }))
    const { supply } = mount(14, { data })
    for (let n = 0; n < 2; n++) {
      fireEvent.click(screen.getByTestId('rd-option-A'))
      fireEvent.click(screen.getByTestId('rd-lock'))
      fireEvent.click(screen.getByTestId('rd-next'))
    }
    expect(screen.getByText('Fråga 3 av 3')).toBeInTheDocument()
    const cut = structuredClone(data)
    cut.drills.elf.questions = cut.drills.elf.questions.slice(0, 1)
    supply(cut)
    expect(screen.getByText('Fråga 1 av 1')).toBeInTheDocument()
  })

  it('sets a gap text’s gaps as blanks, pencils the chosen word in, then grades it in ink', () => {
    mount(14, { data: gapData() })
    const passage = screen.getByTestId('rd-elf-passage')
    const marks = () => passage.querySelectorAll<HTMLElement>('.fp-gapmark')
    expect(marks()).toHaveLength(2)
    expect(marks()[0]).toHaveAttribute('data-state', 'current')
    expect(marks()[1]).toHaveAttribute('data-state', 'blank')
    expect(within(marks()[0]).getByText('lucka 1, tom')).toHaveAttribute('lang', 'sv')
    expect(passage).not.toHaveTextContent('___')
    // The recto names the gap in Swedish and quotes its sentence in English.
    const slot = screen.getByRole('heading', { level: 2, name: 'Lucka 1' })
    expect(slot.closest('[lang]')).toHaveAttribute('lang', 'sv')
    const quote = document.querySelector('.fp-gapquote')
    expect(quote).toHaveAttribute('lang', 'en')
    expect(quote).toHaveTextContent(/^“… though nobody quite takes/)
    expect(quote).toHaveTextContent(/for the descaling\.”$/)
    press('a')
    expect(within(marks()[0]).getByText('lucka 1: charge')).toBeInTheDocument()
    expect(marks()[0]).toHaveAttribute('data-filled', 'true')
    expect(quote).toHaveTextContent('charge')
    press('Enter')
    expect(marks()[0]).toHaveAttribute('data-state', 'right')
    press('Enter')
    expect(marks()[1]).toHaveAttribute('data-state', 'current')
    expect(marks()[0]).toHaveAttribute('data-state', 'right')
    press('b')
    press('Enter')
    expect(marks()[1]).toHaveAttribute('data-state', 'wrong')
    expect(
      within(marks()[1]).getByText('lucka 2: ditt ord cover, rätt ord settle'),
    ).toBeInTheDocument()
    expect(marks()[1].querySelector('s')).toHaveTextContent('cover')
  })

  it('holds the gap and its sentence beside the inline options on phone', () => {
    mount(14, { data: gapData(), width: 'phone' })
    const sheet = screen.getByTestId('rd-sheet')
    expect(sheet).toHaveAttribute('data-state', 'peek')
    // Folio+: the question stands inline under the passage, options and all.
    const question = document.querySelector('.fp-pq') as HTMLElement
    expect(within(question).getByRole('heading', { level: 2, name: 'Lucka 1' })).toBeInTheDocument()
    expect(question.querySelector('.fp-gapquote')).toHaveTextContent('though nobody quite takes')
    expect(within(question).getByTestId('rd-option-A')).toBeInTheDocument()
  })
})

/** The fixture data with the ELF sitting's one question changed by `edit`:
 *  the same sitting and question, as a host hands them down again. */
function elfWith(edit: (q: DrillQuestion) => void): DirectionData {
  const data = structuredClone(FIXTURE_DATA)
  edit(data.drills.elf.questions[0])
  return data
}

/** Gives every option of `q` a picture (test sources). */
function withPictures(q: DrillQuestion): void {
  for (const o of q.options ?? []) {
    o.figure = { src: `figures/options/test-${o.letter}.png`, alt: o.text, width: 400, height: 300 }
  }
}

/** Gives every option of `q` a picture, D's from `src` instead (null: D
 *  has none and answers by its words). */
function picturesWithD(src: string | null): (q: DrillQuestion) => void {
  return (q) => {
    withPictures(q)
    const d = q.options?.find((o) => o.letter === 'D')
    if (d?.figure) d.figure = src == null ? null : { ...d.figure, src }
  }
}

/** The name of the question's own figure in these tests. */
const FIGURE_ALT = 'Figur till frågan'

/** Gives `q` a figure of its own (a test source). */
function withFigure(q: DrillQuestion): void {
  q.figure = {
    src: 'figures/test-question.png',
    alt: FIGURE_ALT,
    width: 400,
    height: 300,
    kind: 'raster',
  }
}

describe('Folio · ELF answers only a complete question', () => {
  const Q = FIXTURE_DATA.drills.elf.questions[0]
  const svara = () => screen.getByTestId('rd-lock')
  const pictures = () => Array.from(document.querySelectorAll<HTMLImageElement>('img.fp-opt-img'))

  it.each([
    ['desktop', 'passage'],
    ['desktop', 'prompt'],
    ['phone', 'passage'],
    ['phone', 'prompt'],
  ] as const)('on %s holds Svara while the %s is missing, the options intact', (width, part) => {
    const lock = vi.fn(() => ({ correct: true }))
    const { supply } = mount(14, { width, actions: { drill: { lock } } })
    fireEvent.click(reveal('rd-option-A'))
    expect(svara()).toBeEnabled()
    supply(
      elfWith((q) => {
        if (part === 'passage') q.passage = null
        else q.prompt = null
      }),
    )
    expect(screen.getByTestId('rd-option-A')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(svara())
    press('Enter')
    expect(lock).not.toHaveBeenCalled()
    expect(svara()).toBeDisabled()
    expect(screen.getByTestId('rd-incomplete')).toHaveTextContent(
      part === 'passage' ? 'Texten till frågan saknas.' : 'Frågetexten saknas.',
    )
    expect(svara().parentElement).toHaveTextContent('Frågan går inte att besvara än.')
    // Handed down whole again: the choice stands and Svara answers.
    supply(structuredClone(FIXTURE_DATA))
    expect(screen.queryByTestId('rd-incomplete')).toBeNull()
    press('Enter')
    expect(lock).toHaveBeenCalledWith(expect.objectContaining({ qid: Q.qid }), 'A')
  })

  it('keeps a gap text’s empty stem answerable: the gap is its question', () => {
    const lock = vi.fn(() => ({ correct: true }))
    const data = gapData()
    for (const q of data.drills.elf.questions) q.prompt = ''
    mount(14, { data, actions: { drill: { lock } } })
    expect(screen.getByRole('heading', { level: 2, name: 'Lucka 1' })).toBeInTheDocument()
    press('a')
    expect(svara()).toBeEnabled()
    expect(screen.queryByTestId('rd-incomplete')).toBeNull()
    press('Enter')
    expect(lock).toHaveBeenCalledWith(expect.objectContaining({ qid: 'elf-test-gaps-1' }), 'A')
  })

  it.each([
    ['desktop', 'click'],
    ['desktop', 'Enter'],
    ['desktop', 'Space'],
    ['phone', 'click'],
    ['phone', 'Enter'],
    ['phone', 'Space'],
  ] as const)('on %s never sends a choice the host has taken away (%s on Svara)', async (width, how) => {
    const user = userEvent.setup()
    const lock = vi.fn(() => ({ correct: true }))
    const { supply } = mount(14, { width, actions: { drill: { lock } } })
    fireEvent.click(reveal('rd-option-D'))
    svara().focus()
    expect(document.activeElement).toBe(svara())
    // The same sitting and question, still one question long, without D.
    supply(
      elfWith((q) => {
        q.options = q.options?.filter((o) => o.letter !== 'D') ?? null
      }),
    )
    expect(screen.queryByTestId('rd-option-D')).toBeNull()
    if (how === 'click') fireEvent.click(svara())
    else if (how === 'Enter') {
      await user.keyboard('{Enter}')
      press('Enter')
    } else await user.keyboard(' ')
    expect(lock).not.toHaveBeenCalled()
    expect(svara()).toBeDisabled()
    expect(svara().parentElement).toHaveTextContent('Välj ett alternativ')
    // A choice among the options left answers as before.
    fireEvent.click(screen.getByTestId('rd-option-B'))
    fireEvent.click(svara())
    expect(lock).toHaveBeenCalledTimes(1)
    expect(lock).toHaveBeenCalledWith(expect.objectContaining({ qid: Q.qid }), 'B')
  })

  it.each([
    'desktop',
    'phone',
  ] as const)('on %s holds Svara until every option picture on the page has loaded', (width) => {
    const lock = vi.fn(() => ({ correct: true }))
    const { supply } = mount(14, { width, actions: { drill: { lock } } })
    fireEvent.click(reveal('rd-option-A'))
    // The same question, its options now pictures.
    supply(elfWith(withPictures))
    expect(pictures()).toHaveLength(4)
    press('Enter')
    expect(lock).not.toHaveBeenCalled()
    expect(svara()).toBeDisabled()
    expect(svara().parentElement).toHaveTextContent('Bilderna laddas …')
    for (const img of pictures().slice(0, 3)) fireEvent.load(img)
    fireEvent.click(svara())
    press('Enter')
    expect(lock).not.toHaveBeenCalled()
    expect(svara()).toBeDisabled()
    // One fails: the page says so plainly, with a way to try again.
    fireEvent.error(pictures()[3])
    const note = screen.getByTestId('rd-incomplete')
    expect(note).toHaveTextContent('Bilden till alternativ D gick inte att visa.')
    expect(svara()).toBeDisabled()
    fireEvent.click(within(note).getByRole('button', { name: 'Försök igen' }))
    // Every picture on the page is tried afresh; once loaded, Svara answers.
    expect(pictures()).toHaveLength(4)
    expect(svara()).toBeDisabled()
    loadImages()
    expect(svara()).toBeEnabled()
    expect(svara().parentElement).toHaveTextContent('Ditt val: A')
    press('Enter')
    expect(lock).toHaveBeenCalledWith(expect.objectContaining({ qid: Q.qid }), 'A')
  })

  it('on phone waits for pictures the slip has not shown: ↵ at its peek answers nothing', () => {
    const lock = vi.fn(() => ({ correct: true }))
    mount(14, { width: 'phone', data: elfWith(withPictures), actions: { drill: { lock } } })
    expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'peek')
    press('a')
    press('Enter')
    expect(lock).not.toHaveBeenCalled()
    reveal('rd-option-A')
    loadImages()
    expect(svara()).toBeEnabled()
    press('Enter')
    expect(lock).toHaveBeenCalledWith(expect.objectContaining({ qid: Q.qid }), 'A')
  })

  /** Every way of pressing Svara, at both widths. */
  const WAYS = [
    ['desktop', 'click'],
    ['desktop', 'Enter'],
    ['desktop', 'Space'],
    ['phone', 'click'],
    ['phone', 'Enter'],
    ['phone', 'Space'],
  ] as const

  /** Presses Svara one way: a click; ↵ on the focused button (native) and
   *  on the window (the drill's keys); or space on the focused button
   *  (native). Focus lands only on an enabled Svara. */
  async function pressSvara(
    user: ReturnType<typeof userEvent.setup>,
    how: (typeof WAYS)[number][1],
  ): Promise<void> {
    if (how === 'click') {
      fireEvent.click(svara())
      return
    }
    svara().focus()
    if (how === 'Enter') {
      await user.keyboard('{Enter}')
      press('Enter')
    } else await user.keyboard(' ')
  }

  const figure = () => screen.getByRole('img', { name: FIGURE_ALT })
  const pictureOf = (letter: string) =>
    within(screen.getByTestId(`rd-option-${letter}`)).getByRole('img')

  it.each(
    WAYS,
  )('on %s holds Svara while the question’s own figure has not loaded (%s on Svara)', async (width, how) => {
    const user = userEvent.setup()
    const lock = vi.fn(() => ({ correct: true }))
    const { supply } = mount(14, { width, actions: { drill: { lock } } })
    fireEvent.click(reveal('rd-option-A'))
    expect(svara()).toBeEnabled()
    // The same question, now with a figure of its own.
    supply(elfWith(withFigure))
    await pressSvara(user, how)
    expect(lock).not.toHaveBeenCalled()
    expect(svara()).toBeDisabled()
    expect(svara().parentElement).toHaveTextContent('Figuren laddas …')
    // The figure on the page loads: Svara answers, the same way.
    fireEvent.load(figure())
    expect(svara()).toBeEnabled()
    await pressSvara(user, how)
    expect(lock).toHaveBeenCalledTimes(1)
    expect(lock).toHaveBeenCalledWith(expect.objectContaining({ qid: Q.qid }), 'A')
  })

  it.each(
    WAYS,
  )('on %s holds Svara when the question’s own figure fails, until a new try loads (%s on Svara)', async (width, how) => {
    const user = userEvent.setup()
    const lock = vi.fn(() => ({ correct: true }))
    const { supply } = mount(14, { width, actions: { drill: { lock } } })
    fireEvent.click(reveal('rd-option-A'))
    supply(elfWith(withFigure))
    fireEvent.error(figure())
    // The page says so plainly; the figure's name stands in for it.
    const note = screen.getByTestId('rd-incomplete')
    expect(note).toHaveTextContent('Figuren till frågan gick inte att visa.')
    expect(screen.queryByRole('img', { name: FIGURE_ALT })).toBeNull()
    expect(screen.getByTestId('rd-qfigure')).toHaveTextContent(FIGURE_ALT)
    await pressSvara(user, how)
    expect(lock).not.toHaveBeenCalled()
    expect(svara()).toBeDisabled()
    expect(svara().parentElement).toHaveTextContent('Frågan går inte att besvara än.')
    // Försök igen mounts the figure afresh; once it loads, Svara answers.
    fireEvent.click(within(note).getByRole('button', { name: 'Försök igen' }))
    expect(svara()).toBeDisabled()
    fireEvent.load(figure())
    expect(svara()).toBeEnabled()
    await pressSvara(user, how)
    expect(lock).toHaveBeenCalledTimes(1)
    expect(lock).toHaveBeenCalledWith(expect.objectContaining({ qid: Q.qid }), 'A')
  })

  it.each(
    WAYS,
  )('on %s holds Svara for a picture that comes back until the new image loads (%s on Svara)', async (width, how) => {
    const user = userEvent.setup()
    const lock = vi.fn(() => ({ correct: true }))
    const { supply } = mount(14, {
      width,
      data: elfWith(withPictures),
      actions: { drill: { lock } },
    })
    fireEvent.click(reveal('rd-option-A'))
    loadImages()
    expect(svara()).toBeEnabled()
    // D's picture goes (its words answer for it) …
    supply(elfWith(picturesWithD(null)))
    expect(within(screen.getByTestId('rd-option-D')).queryByRole('img')).toBeNull()
    expect(svara()).toBeEnabled()
    // … and the same picture comes back: a new image, with no load yet.
    supply(elfWith(withPictures))
    expect(pictureOf('D')).toHaveAttribute('src', '/figures/options/test-D.png')
    await pressSvara(user, how)
    expect(lock).not.toHaveBeenCalled()
    expect(svara()).toBeDisabled()
    expect(svara().parentElement).toHaveTextContent('Bilderna laddas …')
    fireEvent.load(pictureOf('D'))
    expect(svara()).toBeEnabled()
    await pressSvara(user, how)
    expect(lock).toHaveBeenCalledTimes(1)
    expect(lock).toHaveBeenCalledWith(expect.objectContaining({ qid: Q.qid }), 'A')
  })

  it.each(
    WAYS,
  )('on %s holds Svara when a picture goes from A to a pending B and back to A (%s on Svara)', async (width, how) => {
    const user = userEvent.setup()
    const lock = vi.fn(() => ({ correct: true }))
    const { supply } = mount(14, {
      width,
      data: elfWith(withPictures),
      actions: { drill: { lock } },
    })
    fireEvent.click(reveal('rd-option-A'))
    loadImages()
    expect(svara()).toBeEnabled()
    // D's picture moves to another source, still loading …
    supply(elfWith(picturesWithD('figures/options/test-D-2.png')))
    expect(pictureOf('D')).toHaveAttribute('src', '/figures/options/test-D-2.png')
    expect(svara()).toBeDisabled()
    // … and back to the first before that one loads: a new image again.
    supply(elfWith(withPictures))
    expect(pictureOf('D')).toHaveAttribute('src', '/figures/options/test-D.png')
    await pressSvara(user, how)
    expect(lock).not.toHaveBeenCalled()
    expect(svara()).toBeDisabled()
    expect(svara().parentElement).toHaveTextContent('Bilderna laddas …')
    fireEvent.load(pictureOf('D'))
    expect(svara()).toBeEnabled()
    await pressSvara(user, how)
    expect(lock).toHaveBeenCalledTimes(1)
    expect(lock).toHaveBeenCalledWith(expect.objectContaining({ qid: Q.qid }), 'A')
  })
})

describe('Folio+ · the way back from a lesson, through the host', () => {
  // jsdom has no layout: give the stage the room of a 1440 × 900 window.
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(1440)
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(848)
  })
  afterEach(() => vi.restoreAllMocks())

  it('opens the facit’s lesson on Uppslag and brings the reader back to that feedback', async () => {
    const Q3 = FIXTURE_DATA.drills.reading.questions[2]
    const wrong = FIXTURE_DATA.drills.reading.wrongPick?.[Q3.qid]
    const pick = (['A', 'B', 'C', 'D'] as const).find((l) => l !== Q3.answer && l !== wrong)
    if (!pick) throw new Error('no other wrong option')
    const onSelect = mountHost(2)
    fireEvent.click(await screen.findByTestId(`rd-option-${pick}`, {}, { timeout: 5000 }))
    fireEvent.click(screen.getByTestId('rd-lock'))
    fireEvent.click(screen.getByRole('button', { name: /^Slå upp/ }))
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ s: 12 }))
    fireEvent.click(await screen.findByRole('button', { name: 'Tillbaka till frågan' }))
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ s: 3 }))
    const mine = (await screen.findByText('Ditt svar')).closest('.fp-opt')
    expect(mine).toHaveTextContent(new RegExp(`^${pick}`))
  }, 15000)

  it('offers no way back on a lesson reached from the contents', async () => {
    mountHost(12)
    await screen.findByTestId('rd-lesson', {}, { timeout: 5000 })
    expect(screen.queryByRole('button', { name: 'Tillbaka till frågan' })).toBeNull()
  }, 15000)
})

describe('Folio+ · Konto’s Färg recolours the book', () => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(1440)
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(848)
  })
  afterEach(() => vi.restoreAllMocks())

  it('opens on Spalt, the app’s own palette, and a pick takes the whole direction', async () => {
    mountHost(13)
    const spalt = await screen.findByTestId('rd-konto-palette-spalt', {}, { timeout: 5000 })
    const root = screen.getByTestId('rd-folio-plus')
    expect(spalt).toHaveAttribute('aria-pressed', 'true')
    expect(root).toHaveAttribute('data-palette', 'spalt')
    fireEvent.click(screen.getByTestId('rd-konto-palette-sage'))
    expect(root).toHaveAttribute('data-palette', 'sage')
    expect(screen.getByTestId('rd-konto-palette-sage')).toHaveAttribute('aria-pressed', 'true')
    // It carries to the other pages: the choice is the reader's, not Konto's.
    fireEvent.click(screen.getByTestId('rd-nav-idag'))
    expect(await screen.findByTestId('rd-resume')).toBeInTheDocument()
    expect(screen.getByTestId('rd-folio-plus')).toHaveAttribute('data-palette', 'sage')
  }, 15000)

  it('gives every palette, Spalt included, its own light and dark tokens', () => {
    const css = readFileSync(
      path.join(process.cwd(), 'src/components/devbake/redesign/i-folio-plus/fpPalette.css'),
      'utf8',
    )
    for (const p of ['spalt', 'sand', 'sage', 'ink', 'rose']) {
      expect(css).toContain(`[data-palette='${p}']:not([data-theme='dark'])`)
      expect(css).toContain(`[data-theme='dark'][data-palette='${p}']`)
    }
  })
})

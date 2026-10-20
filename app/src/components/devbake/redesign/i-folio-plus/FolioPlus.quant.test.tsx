// Folio+ · the quant and DTK drill's borrowings and fixes, and Framsteg's
// section colours with its "Nästa steg uppåt" (bead hpf-qr0p.48).

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { stubLayout } from '@/components/devbake/redesign/contract'
import { DirectionDataProvider, FIXTURE_DATA } from '@/components/devbake/redesign/directionData'
import type { DrillController } from '@/components/devbake/redesign/drillCore'
import type { DirectionProps } from '@/components/devbake/redesign/r1Kit'
import type { DirectionActions, DirectionData } from '@/components/devbake/redesign/viewModel'
import { FolioPlus as Folio } from './FolioPlus'

type Mount = {
  data?: DirectionData
  actions?: Partial<DirectionActions>
  width?: DirectionProps['width']
}

function mount(s: DirectionProps['screen'], opts: Mount = {}) {
  const data = opts.data ?? structuredClone(FIXTURE_DATA)
  return render(
    <DirectionDataProvider data={data} actions={opts.actions}>
      <Folio
        screen={s}
        width={opts.width ?? 'desktop'}
        theme="light"
        live
        onScreen={vi.fn()}
        onTheme={vi.fn()}
      />
    </DirectionDataProvider>,
  )
}

const press = (key: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(window, { key, ...init })

/** A key where a real one lands: on whatever has focus. */
const pressFocused = (key: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(document.activeElement ?? document.body, { key, ...init })

/** Enter where focus is; on a focused button a browser clicks it. */
const enterFocused = () => {
  const el = document.activeElement
  const handled = !fireEvent.keyDown(el ?? document.body, { key: 'Enter' })
  if (!handled && el instanceof HTMLButtonElement) fireEvent.click(el)
}

beforeAll(stubLayout)

function drillActions() {
  const lock = vi.fn<DrillController['lock']>((q, l) => ({ correct: q.answer === l }))
  return { lock, actions: { drill: { lock, exit: vi.fn(), next: vi.fn() } } }
}

const DTK = FIXTURE_DATA.drills.dtk.questions[0]

describe('Folio+ · Förstora keeps the question', () => {
  it('sets the question, its options and Svara inside the viewer, on the drill’s own state', async () => {
    const { lock, actions } = drillActions()
    mount(7, { actions })
    fireEvent.click(screen.getByTestId('rd-quant-option-A'))
    fireEvent.click(screen.getByRole('button', { name: 'Förstora' }))
    const viewer = screen.getByRole('dialog', { name: 'Förstorad figur' })
    const q = within(viewer).getByRole('group', { name: 'Frågan' })
    expect(q).toHaveTextContent(DTK.prompt ?? '')
    // The choice made outside is the viewer's.
    expect(within(q).getByTestId('fp-viewer-option-A')).toHaveAttribute('aria-pressed', 'true')
    // A letter key chooses there, and the drill under it has the same choice.
    press('b')
    expect(within(q).getByTestId('fp-viewer-option-B')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('rd-quant-option-B')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(within(q).getByTestId(`fp-viewer-option-${DTK.answer}`))
    expect(screen.getByTestId(`rd-quant-option-${DTK.answer}`)).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(within(q).getByRole('button', { name: /^Svara/ }))
    expect(lock).toHaveBeenCalledTimes(1)
    expect(lock).toHaveBeenLastCalledWith(expect.objectContaining({ qid: DTK.qid }), DTK.answer)
    // Answered: the viewer closes on the verdict, and the verdict has focus.
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'true')
    await waitFor(() => expect(screen.getByTestId('rd-verdict')).toHaveFocus())
  })

  it('answers from the keyboard inside the viewer: a letter, then Enter', async () => {
    const { lock, actions } = drillActions()
    mount(7, { actions })
    fireEvent.click(screen.getByRole('button', { name: 'Förstora' }))
    // Focus starts on Stäng; a letter moves it to the question, so Enter answers.
    pressFocused('c')
    enterFocused()
    expect(lock).toHaveBeenLastCalledWith(expect.objectContaining({ qid: DTK.qid }), 'C')
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(screen.getByTestId('rd-verdict')).toHaveFocus())
  })

  it('holds Svara until a choice, and gives the verdict once answered', () => {
    const { actions } = drillActions()
    mount(7, { actions })
    fireEvent.click(screen.getByRole('button', { name: 'Förstora' }))
    const viewer = screen.getByRole('dialog', { name: 'Förstorad figur' })
    expect(within(viewer).getByRole('button', { name: /^Svara/ })).toBeDisabled()
    press('Escape')
    fireEvent.click(screen.getByTestId('rd-quant-option-B'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    fireEvent.click(screen.getByRole('button', { name: 'Förstora' }))
    const after = screen.getByRole('dialog', { name: 'Förstorad figur' })
    expect(within(after).queryByRole('button', { name: /^Svara/ })).toBeNull()
    expect(within(after).getByRole('group', { name: 'Frågan' })).toHaveTextContent(
      `Rätt svar är ${DTK.answer}.`,
    )
  })
})

describe('Folio+ · after Förstora, the keys answer', () => {
  it('Förstora, Esc, a letter, Enter: the answer is locked and the viewer stays closed', async () => {
    const { lock, actions } = drillActions()
    mount(7, { actions })
    const opener = screen.getByRole('button', { name: 'Förstora' })
    opener.focus()
    fireEvent.click(opener)
    expect(screen.getByRole('dialog', { name: 'Förstorad figur' })).toBeInTheDocument()
    press('Escape')
    expect(screen.queryByRole('dialog')).toBeNull()
    // Focus lands on the question and its options, never back on Förstora.
    await waitFor(() => expect(document.activeElement?.hasAttribute('data-fp-qregion')).toBe(true))
    expect(opener).not.toHaveFocus()
    pressFocused('b')
    enterFocused()
    expect(lock).toHaveBeenCalledTimes(1)
    expect(lock).toHaveBeenLastCalledWith(expect.objectContaining({ qid: DTK.qid }), 'B')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByTestId('rd-verdict')).toBeInTheDocument()
  })

  it('does the same on phone', async () => {
    const { lock, actions } = drillActions()
    mount(7, { actions, width: 'phone' })
    const [opener] = screen.getAllByRole('button', { name: 'Förstora figuren' })
    opener.focus()
    fireEvent.click(opener)
    press('Escape')
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(document.activeElement?.hasAttribute('data-fp-qregion')).toBe(true))
    pressFocused('d')
    enterFocused()
    expect(lock).toHaveBeenLastCalledWith(expect.objectContaining({ qid: DTK.qid }), 'D')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('Folio+ · the viewer’s tools on phone', () => {
  it('keeps every tool named, Hela sidan included, on a row of its own under the title', () => {
    mount(7, { width: 'phone' })
    fireEvent.click(screen.getAllByRole('button', { name: 'Förstora figuren' })[0])
    const viewer = screen.getByRole('dialog', { name: 'Förstorad figur' })
    const tools = within(viewer).getByRole('toolbar', { name: 'Zoom och rotation' })
    for (const name of ['Mindre', 'Större', 'Rotera figuren 90 grader', 'Hela sidan']) {
      expect(within(tools).getByRole('button', { name })).toBeInTheDocument()
    }
    // Stäng shares the title's row, so the tools have the full width.
    expect(within(tools).queryByRole('button', { name: /Stäng/ })).toBeNull()
    expect(tools).toHaveAttribute('data-fp-compact', 'true')
  })
})

describe('Folio+ · Taktik on request', () => {
  it('keeps the desktop tactic behind “Visa taktik” until asked, and gone after the answer', () => {
    const { actions } = drillActions()
    mount(6, { actions })
    expect(screen.queryByRole('complementary', { name: 'Taktik' })).toBeNull()
    expect(screen.queryByText('Stapelbråksreceptet')).toBeNull()
    const show = screen.getByRole('button', { name: 'Visa taktik' })
    expect(show).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(show)
    expect(screen.getByRole('complementary', { name: 'Taktik' })).toHaveTextContent(
      'Stapelbråksreceptet',
    )
    const hide = screen.getByRole('button', { name: 'Dölj taktik' })
    expect(hide).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(hide)
    expect(screen.queryByText('Stapelbråksreceptet')).toBeNull()
    fireEvent.click(screen.getByTestId('rd-quant-option-B'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(screen.queryByRole('button', { name: 'Visa taktik' })).toBeNull()
  })

  it('folds it the same way on the DTK recto and on phone', () => {
    const first = mount(7)
    expect(screen.getByRole('button', { name: 'Visa taktik' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    first.unmount()
    mount(6, { width: 'phone' })
    expect(screen.getByRole('button', { name: 'Visa taktik' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.queryByText('Stapelbråksreceptet')).toBeNull()
  })
})

describe('Folio+ · Framsteg: section colours and the next step up', () => {
  const F = FIXTURE_DATA.framsteg
  const ORDER = ['ORD', 'LÄS', 'MEK', 'ELF', 'XYZ', 'KVA', 'NOG', 'DTK']

  it('marks each section of Delproven with its own colour', () => {
    mount(11)
    for (const s of F.sections) {
      const id = s.section.toLocaleLowerCase('sv-SE').replace('ä', 'a')
      const row = screen.getByTestId(`rd-framsteg-section-${id}`)
      expect(row).toHaveAttribute('data-fp-sec', s.section)
      expect(row.querySelector('.fp-sec-mark')).not.toBeNull()
    }
  })

  it('gives one concrete step per section toward its next level, in test order', () => {
    const startDrill = vi.fn()
    mount(11, { actions: { startDrill } })
    const up = screen.getByRole('region', { name: 'Nästa steg uppåt' })
    const steps = within(up).getAllByRole('listitem')
    expect(steps.map((li) => li.getAttribute('data-fp-sec'))).toEqual(ORDER)
    const step = (s: string) => steps[ORDER.indexOf(s)]
    // The next level is the next tenth above the estimate.
    expect(step('ORD')).toHaveTextContent('1,6 → 1,7')
    expect(step('XYZ')).toHaveTextContent('1,2 → 1,3')
    // A trap in the section is the step: LÄS has the rising one.
    expect(step('LÄS')).toHaveTextContent('Författarens hållning')
    fireEvent.click(within(step('LÄS')).getByRole('button'))
    expect(startDrill).toHaveBeenLastCalledWith({
      kind: 'framework',
      frameworkId: 'LAS-TYPE-003',
      section: 'LÄS',
    })
    // Misses ready now in a section without a trap: repeat them.
    expect(step('KVA')).toHaveTextContent('Repetera två KVA-missar')
    fireEvent.click(within(step('KVA')).getByRole('button'))
    expect(startDrill).toHaveBeenLastCalledWith({ kind: 'repetition', section: 'KVA' })
    // Otherwise a round in the section.
    fireEvent.click(within(step('ORD')).getByRole('button'))
    expect(startDrill).toHaveBeenLastCalledWith({ kind: 'section', section: 'ORD' })
    for (const li of steps) expect(li.querySelector('.fp-sec-mark')).not.toBeNull()
  })

  it('starts a section that has no estimate yet, and holds at 2,0', () => {
    const data = structuredClone(FIXTURE_DATA)
    const ord = data.framsteg.sections.find((s) => s.section === 'ORD')
    const mek = data.framsteg.sections.find((s) => s.section === 'MEK')
    if (!ord || !mek) throw new Error('fixture lacks ORD or MEK')
    Object.assign(ord, { score: null, band: null, trend: null, attempts90d: 0, daysSince: null })
    mek.score = 2
    mount(11, { data })
    const up = screen.getByRole('region', { name: 'Nästa steg uppåt' })
    const [first, , third] = within(up).getAllByRole('listitem')
    expect(first).toHaveTextContent('Gör en första ORD-runda')
    expect(third).toHaveTextContent('Håll 2,0')
    expect(up).not.toHaveTextContent(/undefined|NaN/)
  })
})

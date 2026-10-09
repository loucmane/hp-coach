// The round-1 redesign bake-off's shared contract, checked for all four
// directions at both widths through the rd-* test ids every direction
// carries: Idag has one resume action, the five destinations, the account
// entry and the estimate caveat; the drill shows the ÖVNINGSTEXT badge
// outside the passage, nine numbered paragraphs and the authorship note on
// demand; answering grades the question; Facit shows the verdict, a detail
// step on demand, technique, pitfall, every distractor and ¶ links; Nästa
// moves on; Navigering opens the account menu with a working theme switch.
// Plus the switcher's buttons and keys.

import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ComponentType } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { Folio } from '@/components/devbake/redesign/a-folio/Folio'
import { Instrument } from '@/components/devbake/redesign/b-instrument/Instrument'
import { Spar } from '@/components/devbake/redesign/c-spar/Spar'
import { Lager } from '@/components/devbake/redesign/d-lager/Lager'
import {
  Redesign2026Bakeoff,
  type Selection,
} from '@/components/devbake/redesign/Redesign2026Bakeoff'
import {
  ESTIMATE_CAVEAT,
  EXPLANATIONS,
  OVNINGSTEXT_NOTE,
  UNIT,
} from '@/components/devbake/redesign/r1Fixtures'
import {
  DESTINATIONS,
  type DirectionProps,
  type ScreenKey,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'

beforeAll(() => {
  // jsdom has no layout: give the scroll and resize APIs inert stand-ins.
  Element.prototype.scrollTo ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

const DIRECTION_COMPONENTS: [string, ComponentType<DirectionProps>][] = [
  ['folio', Folio],
  ['instrument', Instrument],
  ['spar', Spar],
  ['lager', Lager],
]
const WIDTHS: WidthKey[] = ['desktop', 'phone']

const Q3 = UNIT.questions[2]
const Q4 = UNIT.questions[3]
const E3 = EXPLANATIONS[Q3.qid]
const DETAIL = (E3.steps ?? []).find((s) => s.tier === 'detail')
if (!DETAIL) throw new Error('fixture question 3 must have a detail-tier step')

function mount(Direction: ComponentType<DirectionProps>, screenKey: ScreenKey, width: WidthKey) {
  const onScreen = vi.fn()
  const onTheme = vi.fn()
  const props = (s: ScreenKey): DirectionProps => ({
    screen: s,
    width,
    theme: 'light',
    live: true,
    onScreen,
    onTheme,
  })
  const utils = render(<Direction {...props(screenKey)} />)
  return {
    onScreen,
    onTheme,
    /** What the bake-off stage does when a direction asks for a screen. */
    goTo: (s: ScreenKey) => utils.rerender(<Direction {...props(s)} />),
  }
}

/** The phone question sheet starts at its peek: open it if the options
 *  are not on screen yet (the first collapsed toggle inside the sheet). */
function revealOptions() {
  if (screen.queryByTestId('rd-option-A')) return
  const sheet = screen.getByTestId('rd-sheet')
  const toggle = sheet.querySelector<HTMLElement>('[aria-expanded="false"]')
  if (!toggle) throw new Error('no way to open the question sheet')
  fireEvent.click(toggle)
}

function visible(el: HTMLElement | null): boolean {
  return el != null && !el.hidden && el.closest('[hidden]') == null
}

describe.each(DIRECTION_COMPONENTS)('redesign direction %s', (slug, Direction) => {
  describe.each(WIDTHS)('%s', (width) => {
    it('Idag: one resume action, the five destinations, the account entry and the caveat', () => {
      const { onScreen } = mount(Direction, 1, width)
      expect(screen.getByTestId(`rd-${slug}`)).toBeInTheDocument()
      for (const d of DESTINATIONS) expect(screen.getByTestId(`rd-nav-${d.id}`)).toBeInTheDocument()
      expect(screen.getByTestId('rd-account')).toBeInTheDocument()
      expect(screen.getAllByText(ESTIMATE_CAVEAT).length).toBeGreaterThan(0)
      expect(screen.getAllByTestId('rd-resume')).toHaveLength(1)
      fireEvent.click(screen.getByTestId('rd-resume'))
      expect(onScreen).toHaveBeenCalledWith(2)
    })

    it('Läsfråga: the badge outside the passage, nine numbered paragraphs, the note on demand', () => {
      mount(Direction, 2, width)
      const passage = screen.getByTestId('rd-passage')
      const badge = screen.getByTestId('rd-badge')
      expect(badge).toHaveTextContent(/övningstext/i)
      expect(passage).not.toContainElement(badge)
      for (let n = 1; n <= 9; n++) expect(screen.getByTestId(`rd-para-${n}`)).toBeInTheDocument()
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(visible(screen.queryByTestId('rd-note'))).toBe(false)
      fireEvent.click(screen.getByTestId('rd-note-toggle'))
      expect(screen.getByTestId('rd-note')).toHaveTextContent(OVNINGSTEXT_NOTE)
      expect(visible(screen.getByTestId('rd-note'))).toBe(true)
      if (width === 'phone') {
        expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'peek')
      }
    })

    it('Läsfråga: choosing, striking and answering grades the question', () => {
      const { onScreen, goTo } = mount(Direction, 2, width)
      revealOptions()
      for (const l of ['A', 'B', 'C', 'D']) {
        expect(screen.getByTestId(`rd-option-${l}`)).toBeInTheDocument()
      }
      fireEvent.click(screen.getByTestId('rd-eliminate-B'))
      expect(screen.getByTestId('rd-eliminate-B')).toHaveAttribute('aria-pressed', 'true')
      fireEvent.click(screen.getByTestId('rd-option-A'))
      fireEvent.click(screen.getByTestId('rd-lock'))
      expect(onScreen).toHaveBeenCalledWith(3)
      goTo(3)
      expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
    })

    it('Facit: verdict, a detail step on demand, technique, pitfall, distractors and ¶ links', () => {
      mount(Direction, 3, width)
      const verdict = screen.getByTestId('rd-verdict')
      expect(verdict).toHaveAttribute('data-correct', 'false')
      expect(verdict).toHaveTextContent(Q3.answer)
      expect(screen.getByTestId(`rd-step-${DETAIL.n}`)).toBeInTheDocument()
      expect(screen.queryByText(DETAIL.text)).toBeNull()
      fireEvent.click(screen.getByTestId(`rd-step-toggle-${DETAIL.n}`))
      expect(screen.getByText(DETAIL.text)).toBeInTheDocument()
      expect(screen.getByTestId('rd-technique')).toHaveTextContent(E3.technique)
      expect(screen.getByTestId('rd-pitfall')).toHaveTextContent(E3.pitfall ?? '')
      for (const d of E3.distractors) {
        expect(screen.getByTestId(`rd-distractor-${d.letter}`)).toBeInTheDocument()
      }
      // The picked distractor's reasons are shown without a click.
      const picked = within(screen.getByTestId('rd-distractor-A'))
      expect(picked.getByText(E3.distractors[0].why_tempting)).toBeInTheDocument()
      expect(screen.getAllByTestId('rd-cite-6').length).toBeGreaterThan(0)
    })

    it('Facit: Nästa moves on to question 4', () => {
      const { onScreen, goTo } = mount(Direction, 3, width)
      fireEvent.click(screen.getByTestId('rd-next'))
      expect(onScreen).toHaveBeenCalledWith(2)
      goTo(2)
      expect(screen.getAllByText(Q4.prompt).length).toBeGreaterThan(0)
    })

    it('Läsfråga: Avsluta leaves the drill for Idag', () => {
      const { onScreen } = mount(Direction, 2, width)
      fireEvent.click(screen.getByTestId('rd-exit'))
      expect(onScreen).toHaveBeenCalledWith(1)
    })

    it('Navigering: the account menu is open and switches the theme', () => {
      const { onTheme } = mount(Direction, 4, width)
      expect(screen.getByTestId('rd-account-menu')).toBeInTheDocument()
      for (const d of DESTINATIONS) expect(screen.getByTestId(`rd-nav-${d.id}`)).toBeInTheDocument()
      fireEvent.click(screen.getByTestId('rd-theme-toggle'))
      expect(onTheme).toHaveBeenCalledWith('dark')
    })
  })
})

describe('bake-off switcher', () => {
  const base: Selection = { d: 'a', s: 1, w: 'desktop', t: 'light', sbs: false, bare: false }

  it('picks direction, screen, width, theme and side by side from the bar', () => {
    const onSelect = vi.fn()
    render(<Redesign2026Bakeoff sel={base} onSelect={onSelect} />)
    fireEvent.click(screen.getByTestId('rb26-direction-c'))
    expect(onSelect).toHaveBeenLastCalledWith({ d: 'c', sbs: false })
    fireEvent.click(screen.getByTestId('rb26-screen-3'))
    expect(onSelect).toHaveBeenLastCalledWith({ s: 3 })
    fireEvent.click(screen.getByTestId('rb26-width-phone'))
    expect(onSelect).toHaveBeenLastCalledWith({ w: 'phone' })
    fireEvent.click(screen.getByTestId('rb26-theme-dark'))
    expect(onSelect).toHaveBeenLastCalledWith({ t: 'dark' })
    fireEvent.click(screen.getByTestId('rb26-sbs'))
    expect(onSelect).toHaveBeenLastCalledWith({ sbs: true })
  })

  it('answers 1–4, ←/→ and 0 on the keyboard', () => {
    const onSelect = vi.fn()
    render(<Redesign2026Bakeoff sel={{ ...base, s: 4 }} onSelect={onSelect} />)
    fireEvent.keyDown(window, { key: '2' })
    expect(onSelect).toHaveBeenLastCalledWith({ d: 'b', sbs: false })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenLastCalledWith({ s: 1 })
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(onSelect).toHaveBeenLastCalledWith({ s: 3 })
    fireEvent.keyDown(window, { key: '0' })
    expect(onSelect).toHaveBeenLastCalledWith({ sbs: true })
  })

  it('hides the bar with bare=1 and shows four thumbnails side by side', () => {
    const { rerender } = render(
      <Redesign2026Bakeoff sel={{ ...base, bare: true }} onSelect={() => {}} />,
    )
    expect(screen.queryByTestId('rb26-bar')).toBeNull()
    rerender(<Redesign2026Bakeoff sel={{ ...base, sbs: true }} onSelect={() => {}} />)
    expect(screen.getByTestId('rb26-sbs-grid')).toBeInTheDocument()
    expect(screen.getByTestId('rb26-sbs')).toHaveAttribute('aria-pressed', 'true')
  })
})

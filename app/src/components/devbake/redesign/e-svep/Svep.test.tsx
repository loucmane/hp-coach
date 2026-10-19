// E · Svep's own checks. First the bake-off's shared contract — the same
// rd-* ids and moves Redesign2026Bakeoff.test.tsx drives for A–D — at both
// widths; then every screen at both widths and both themes; then what is
// Svep's own: the deck on Idag (counter, arrows, index, keys that hand back
// to the switcher at the deck's ends, Enter on the card in front, the
// table's tint), the facit run, the keys in the drill, the phone question
// card, the account card and the end of the unit.

import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import {
  ESTIMATE_CAVEAT,
  EXPLANATIONS,
  OVNINGSTEXT_NOTE,
  UNIT,
} from '@/components/devbake/redesign/r1Fixtures'
import {
  DESTINATIONS,
  type DirectionProps,
  SCREENS,
  type ScreenKey,
  THEMES,
  type ThemeKey,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import { meta } from './meta'
import { Svep } from './Svep'

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

const WIDTHS: WidthKey[] = ['desktop', 'phone']
const Q3 = UNIT.questions[2]
const Q4 = UNIT.questions[3]
const E3 = EXPLANATIONS[Q3.qid]
const DETAIL = (E3.steps ?? []).find((s) => s.tier === 'detail')
if (!DETAIL) throw new Error('fixture question 3 must have a detail-tier step')

function mount(screenKey: ScreenKey, width: WidthKey, theme: ThemeKey = 'light') {
  const onScreen = vi.fn()
  const onTheme = vi.fn()
  const props = (s: ScreenKey): DirectionProps => ({
    screen: s,
    width,
    theme,
    live: true,
    onScreen,
    onTheme,
  })
  const utils = render(<Svep {...props(screenKey)} />)
  return {
    onScreen,
    onTheme,
    /** What the bake-off stage does when a direction asks for a screen. */
    goTo: (s: ScreenKey) => utils.rerender(<Svep {...props(s)} />),
  }
}

/** The card in front of a deck ("home" on Idag, "run" in Facit). */
function front(kind: 'home' | 'run'): string | null {
  return (
    document
      .querySelector(`.sv-deck[data-kind="${kind}"] [data-pos="front"]`)
      ?.getAttribute('data-card') ?? null
  )
}

function visible(el: HTMLElement | null): boolean {
  return el != null && !el.hidden && el.closest('[hidden]') == null
}

/** fireEvent's result: false when a handler took the key (preventDefault). */
const press = (key: string, target: Window | Element = window) => fireEvent.keyDown(target, { key })

describe.each(WIDTHS)('Svep, the shared contract (%s)', (width) => {
  it('Idag: one resume action, the five destinations, the account entry and the caveat', () => {
    const { onScreen } = mount(1, width)
    expect(screen.getByTestId('rd-svep')).toBeInTheDocument()
    for (const d of DESTINATIONS) expect(screen.getByTestId(`rd-nav-${d.id}`)).toBeInTheDocument()
    expect(screen.getByTestId('rd-account')).toBeInTheDocument()
    expect(screen.getAllByText(ESTIMATE_CAVEAT).length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('rd-resume')).toHaveLength(1)
    fireEvent.click(screen.getByTestId('rd-resume'))
    expect(onScreen).toHaveBeenCalledWith(2)
  })

  it('Läsfråga: the badge outside the passage, nine numbered paragraphs, the note on demand', () => {
    mount(2, width)
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
    const { onScreen, goTo } = mount(2, width)
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
    mount(3, width)
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
    const { onScreen, goTo } = mount(3, width)
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(onScreen).toHaveBeenCalledWith(2)
    goTo(2)
    expect(screen.getAllByText(Q4.prompt).length).toBeGreaterThan(0)
  })

  it('Läsfråga: Avsluta leaves the drill for Idag', () => {
    const { onScreen } = mount(2, width)
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(onScreen).toHaveBeenCalledWith(1)
  })

  it('Navigering: the account menu is open and switches the theme', () => {
    const { onTheme } = mount(4, width)
    expect(screen.getByTestId('rd-account-menu')).toBeInTheDocument()
    for (const d of DESTINATIONS) expect(screen.getByTestId(`rd-nav-${d.id}`)).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-theme-toggle'))
    expect(onTheme).toHaveBeenCalledWith('dark')
  })
})

describe('Svep, every screen', () => {
  const KEY_IDS: Record<ScreenKey, string[]> = {
    1: ['rd-resume', 'rd-account', ...DESTINATIONS.map((d) => `rd-nav-${d.id}`)],
    2: ['rd-exit', 'rd-badge', 'rd-note-toggle', 'rd-passage', 'rd-lock', 'rd-option-A'],
    3: ['rd-exit', 'rd-verdict', 'rd-next', 'rd-technique', 'rd-pitfall', 'rd-distractor-A'],
    4: ['rd-account', 'rd-account-menu', 'rd-theme-toggle'],
  }
  for (const w of WIDTHS) {
    for (const t of THEMES) {
      it.each(SCREENS)(`renders $label at ${w}, ${t.label.toLowerCase()}`, ({ key }) => {
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
        mount(key, w, t.key)
        const root = screen.getByTestId('rd-svep')
        expect(root).toHaveAttribute('data-theme', t.key)
        expect(root).toHaveAttribute('data-width', w)
        expect(root).toHaveAttribute('lang', 'sv')
        for (const id of KEY_IDS[key]) expect(screen.getByTestId(id)).toBeInTheDocument()
        if (key === 4 && w === 'desktop') {
          expect(screen.getByTestId('rd-collapse')).toHaveAttribute('aria-expanded', 'false')
        }
        if ((key === 2 || key === 3) && w === 'phone') {
          expect(screen.getByTestId('rd-sheet')).toHaveAttribute(
            'data-state',
            key === 2 ? 'peek' : 'full',
          )
        }
        expect(errors).not.toHaveBeenCalled()
        errors.mockRestore()
      })
    }
  }

  it('is built: the registry entry is no longer a stub', () => {
    expect(meta.stub).toBeUndefined()
    expect(meta.name).toBe('Svep')
    expect(meta.tagline).toBe('Ett kort i taget')
    expect(meta.traits.length).toBeGreaterThanOrEqual(4)
    expect(meta.risk).toMatch(/^Risk: /)
  })
})

describe('Svep, the deck on Idag', () => {
  it('moves by its arrows, its index and ←/→, and hands ←/→ back at either end', () => {
    mount(1, 'desktop')
    expect(front('home')).toBe('resume')
    // At the first card ← belongs to the switcher; → moves the deck.
    expect(press('ArrowLeft')).toBe(true)
    expect(press('ArrowRight')).toBe(false)
    expect(front('home')).toBe('rep')
    fireEvent.click(screen.getByRole('button', { name: 'Nästa kort' }))
    expect(front('home')).toBe('lektion')
    fireEvent.click(screen.getByRole('button', { name: 'Föregående kort' }))
    expect(front('home')).toBe('rep')
    const index = within(screen.getByRole('navigation', { name: 'Kortregister' }))
    fireEvent.click(index.getByRole('button', { name: /Senaste passen/ }))
    expect(front('home')).toBe('recent')
    expect(index.getByRole('button', { name: /Senaste passen/ })).toHaveAttribute(
      'aria-current',
      'true',
    )
    // The last card: → goes on to the switcher, the arrow says it is spent.
    expect(press('ArrowRight')).toBe(true)
    expect(screen.getByRole('button', { name: 'Nästa kort' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    press('Home')
    expect(front('home')).toBe('resume')
  })

  it('keeps only the card in front reachable; the rest are inert', () => {
    mount(1, 'desktop')
    const cards = document.querySelectorAll('.sv-deck[data-kind="home"] .sv-dcard')
    expect(cards).toHaveLength(7)
    const inert = [...cards].filter((c) => c.hasAttribute('inert'))
    expect(inert).toHaveLength(6)
    expect(document.querySelector('[data-pos="front"]')).not.toHaveAttribute('inert')
  })

  it('takes the card in front on Enter: Fortsätt opens the drill, a plan card its door', () => {
    const { onScreen } = mount(1, 'desktop')
    press('Enter')
    expect(onScreen).toHaveBeenCalledWith(2)
    press('ArrowRight')
    press('Enter')
    expect(screen.getByTestId('rd-nav-ova')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { level: 1, name: 'Öva' })).toBeInTheDocument()
  })

  it('tints the table with the section of the card in front (phone index)', () => {
    mount(1, 'phone')
    const root = screen.getByTestId('rd-svep')
    expect(root).toHaveAttribute('data-tint', 'las')
    const ticks = within(screen.getByRole('list', { name: 'Kortregister' }))
    fireEvent.click(ticks.getByRole('button', { name: 'Kort 3: ELF-lektion' }))
    expect(front('home')).toBe('lektion')
    expect(root).toHaveAttribute('data-tint', 'elf')
    fireEvent.click(ticks.getByRole('button', { name: 'Kort 5: Prognos' }))
    expect(root).toHaveAttribute('data-tint', 'none')
  })

  it('opens the account card and puts it back on Esc', () => {
    mount(1, 'phone')
    expect(screen.queryByTestId('rd-account-menu')).toBeNull()
    fireEvent.click(screen.getByTestId('rd-account'))
    expect(screen.getByTestId('rd-account-menu')).toBeInTheDocument()
    press('Escape')
    expect(screen.queryByTestId('rd-account-menu')).toBeNull()
  })

  it('folds the desktop doors into a hand and back', () => {
    mount(1, 'desktop')
    const fold = screen.getByTestId('rd-collapse')
    expect(fold).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(fold)
    expect(fold).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByTestId('rd-nav-ova')).toHaveAccessibleName('Öva, 23 att repetera')
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
    expect(fold).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('Svep, the drill', () => {
  it('answers on a–d and Space, but Space inside the text scrolls it', () => {
    const { onScreen } = mount(2, 'desktop')
    const text = screen.getByRole('region', { name: /Magasinet i Hökaryd/ })
    // Nothing chosen: Space is not taken.
    expect(press(' ')).toBe(true)
    press('d')
    expect(screen.getByTestId('rd-option-D')).toHaveAttribute('aria-pressed', 'true')
    expect(press(' ', text)).toBe(true)
    expect(onScreen).not.toHaveBeenCalled()
    expect(press(' ')).toBe(false)
    expect(onScreen).toHaveBeenCalledWith(3)
  })

  it('never leaves on Esc', () => {
    const { onScreen } = mount(2, 'desktop')
    press('f')
    press('Escape')
    expect(onScreen).not.toHaveBeenCalled()
  })

  it('deals the next question on Space in Facit, but not from inside a facit card', () => {
    const { onScreen } = mount(3, 'desktop')
    const card = document.querySelector('.sv-deck[data-kind="run"] [data-pos="front"]')
    if (!card) throw new Error('no facit card in front')
    expect(press(' ', card)).toBe(true)
    expect(onScreen).not.toHaveBeenCalled()
    expect(press(' ')).toBe(false)
    expect(onScreen).toHaveBeenCalledWith(2)
  })

  it('moves through the facit run with ←/→ and its arrows; Enter deals the next question', () => {
    const { onScreen } = mount(3, 'desktop')
    const run = document.querySelectorAll('.sv-deck[data-kind="run"] .sv-dcard')
    expect([...run].map((c) => c.getAttribute('data-card'))).toEqual([
      'svar',
      'lockade',
      'tamed',
      'losning',
      'andra',
    ])
    expect(front('run')).toBe('svar')
    // After a miss the lesson is the filled action and Nästa waits, quiet.
    expect(screen.getByTestId('rd-next')).toHaveClass('sv-btn--quiet')
    fireEvent.click(screen.getByRole('button', { name: /Varför lockade A/ }))
    expect(front('run')).toBe('lockade')
    expect(screen.getByTestId('rd-next')).toHaveClass('sv-btn--primary')
    press('ArrowRight')
    expect(front('run')).toBe('tamed')
    fireEvent.click(screen.getByRole('button', { name: 'Nästa kort' }))
    expect(front('run')).toBe('losning')
    press('ArrowLeft')
    expect(front('run')).toBe('tamed')
    press('Enter')
    expect(onScreen).toHaveBeenCalledWith(2)
  })

  it('turns the run to the solution card when a "(steg 4)" link is followed', () => {
    mount(3, 'desktop')
    for (let i = 0; i < 4; i++) press('ArrowRight')
    expect(front('run')).toBe('andra')
    // The last card: → is the switcher's again.
    expect(press('ArrowRight')).toBe(true)
    const c = screen.getByTestId('rd-distractor-C')
    fireEvent.click(within(c).getByRole('button', { name: /Varför det lockar/ }))
    fireEvent.click(within(c).getByRole('button', { name: '(steg 4)' }))
    expect(front('run')).toBe('losning')
    expect(screen.getByText(DETAIL.text)).toBeInTheDocument()
  })

  it('raises and lowers the phone question card, the text staying put', () => {
    mount(2, 'phone')
    const sheet = screen.getByTestId('rd-sheet')
    expect(sheet).toHaveAttribute('data-state', 'peek')
    const raise = within(sheet).getByText('Till frågan').closest('button')
    if (!raise) throw new Error('no Till frågan button')
    expect(raise).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(raise)
    expect(sheet).toHaveAttribute('data-state', 'open')
    fireEvent.click(within(sheet).getByText('Till texten').closest('button') as HTMLElement)
    expect(sheet).toHaveAttribute('data-state', 'peek')
  })

  it.each(WIDTHS)('ends the unit in the hand turned face up, then deals the plan (%s)', (w) => {
    const { onScreen, goTo } = mount(3, w)
    fireEvent.click(screen.getByTestId('rd-next'))
    goTo(2)
    fireEvent.click(screen.getByTestId(`rd-option-${Q4.answer}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
    goTo(3)
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'true')
    fireEvent.click(screen.getByTestId('rd-next'))
    const done = screen.getByTestId('rd-done')
    expect(within(done).getAllByRole('listitem')).toHaveLength(4)
    expect(done).toHaveTextContent('Hela leken är vänd.')
    onScreen.mockClear()
    fireEvent.click(screen.getByTestId('rd-done-next'))
    expect(onScreen).toHaveBeenCalledWith(1)
  })
})

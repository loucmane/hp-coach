// E · Svep's own checks. First the bake-off's shared contract
// (describeDirectionContract: the rd-* ids and moves for every screen Svep
// declares, at both widths); then every screen at both widths and both
// themes; then what is Svep's own: the deck on Idag (counter, arrows,
// index, keys that hand back to the switcher at the deck's ends, Enter on
// the card in front, the table's tint), the frame's doors and account, the
// reading drill's facit run and keys, Öva's three cards and section doors,
// the quant problem card, the DTK page's lens and viewer, Repetera's batch,
// and every screen rendered without the fields the real app cannot fill.
// Round 2's review fixes: the DTK page keeps its arrows inside the real
// bake-off, a question waits for the pictures it needs, and the decks on
// Idag and Öva hold when their data changes under them.

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  describeDirectionContract,
  loadImages,
  mountDirection,
  reveal,
  spyActions,
} from '@/components/devbake/redesign/contract'
import {
  DirectionDataProvider,
  drillQuestion,
  FIXTURE_DATA,
} from '@/components/devbake/redesign/directionData'
import {
  Redesign2026Bakeoff,
  type Selection,
} from '@/components/devbake/redesign/Redesign2026Bakeoff'
import {
  type AppScreenKey,
  type DirectionProps,
  THEMES,
  type ThemeKey,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import { DTK_PAGES, PASS_QUESTIONS } from '@/components/devbake/redesign/r2Fixtures'
import type { DirectionData, DrillQuestion } from '@/components/devbake/redesign/viewModel'
import type { Question } from '@/data/questions'
import { meta } from './meta'
import { Svep } from './Svep'

beforeAll(() => {
  // jsdom has no layout: give the scroll and resize APIs inert stand-ins.
  Element.prototype.scrollTo ??= () => {}
  Element.prototype.scrollBy ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

const WIDTHS: WidthKey[] = ['desktop', 'phone']
const D = FIXTURE_DATA
const READING = D.drills.reading
const Q3 = READING.questions[2]
const Q4 = READING.questions[3]
const E3 = READING.explanations[Q3.qid]
const DETAIL = (E3?.steps ?? []).find((s) => s.tier === 'detail')
if (!E3 || !DETAIL)
  throw new Error('fixture question 3 must have an explanation with a detail step')
const [XYZ, KVA, NOG] = D.drills.quant.questions
const [DTK] = D.drills.dtk.questions

/** The stage's mount: Svep inside a provider with spied actions. */
const mount = (s: AppScreenKey, width: WidthKey, theme: ThemeKey = 'light') =>
  mountDirection(Svep, s, width, theme)

/** The card in front of a deck ("home" on Idag, "ova" on Öva, "run" in Facit). */
function front(kind: 'home' | 'ova' | 'run'): string | null {
  return (
    document
      .querySelector(`.sv-deck[data-kind="${kind}"] [data-pos="front"]`)
      ?.getAttribute('data-card') ?? null
  )
}

/** fireEvent's result: false when a handler took the key (preventDefault). */
const press = (key: string, target: Window | Element = window) => fireEvent.keyDown(target, { key })

/** Locks `letter` on the open quant question. */
function answer(letter: string) {
  fireEvent.click(screen.getByTestId(`rd-quant-option-${letter}`))
  fireEvent.click(screen.getByTestId('rd-lock'))
}

/** Svep on screen `s` inside a provider fed `data`, with spied actions;
 *  `rerender` hands the screens already mounted new data. */
function host(data: DirectionData, s: AppScreenKey, width: WidthKey = 'desktop') {
  const actions = spyActions()
  const props: DirectionProps = {
    screen: s,
    width,
    theme: 'light',
    live: true,
    onScreen: vi.fn(),
    onTheme: vi.fn(),
  }
  const tree = (d: DirectionData) => (
    <DirectionDataProvider data={d} actions={actions}>
      <Svep {...props} />
    </DirectionDataProvider>
  )
  const utils = render(tree(data))
  return { actions, rerender: (d: DirectionData) => utils.rerender(tree(d)) }
}

describeDirectionContract(meta, Svep)

describe('Svep, every screen', () => {
  for (const w of WIDTHS) {
    for (const t of THEMES) {
      it.each(
        meta.screens ?? [],
      )(`renders screen %s at ${w}, ${t.label.toLowerCase()}, without a console error`, (s) => {
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
        mount(s, w, t.key)
        const root = screen.getByTestId('rd-svep')
        expect(root).toHaveAttribute('data-theme', t.key)
        expect(root).toHaveAttribute('data-width', w)
        expect(root).toHaveAttribute('lang', 'sv')
        if (s === 4 && w === 'desktop') {
          expect(screen.getByTestId('rd-collapse')).toHaveAttribute('aria-expanded', 'false')
        }
        if ((s === 2 || s === 3) && w === 'phone') {
          expect(screen.getByTestId('rd-sheet')).toHaveAttribute(
            'data-state',
            s === 2 ? 'peek' : 'full',
          )
        }
        expect(errors).not.toHaveBeenCalled()
        errors.mockRestore()
      })
    }
  }

  it('is built: screens 1–8, the registry entry no longer a stub', () => {
    expect(meta.stub).toBeUndefined()
    expect(meta.screens).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(meta.name).toBe('Svep')
    expect(meta.tagline).toBe('Ett kort i taget')
    expect(meta.traits.length).toBeGreaterThanOrEqual(4)
    expect(meta.risk).toMatch(/^Risk: /)
  })

  it('lays every non-drill screen on a quiet table: Repetera lilac, quant neutral', () => {
    const tint = (s: AppScreenKey) => {
      const { unmount } = render(
        <Svep
          screen={s}
          width="desktop"
          theme="light"
          live
          onScreen={() => {}}
          onTheme={() => {}}
        />,
      )
      const value = screen.getByTestId('rd-svep').getAttribute('data-tint')
      unmount()
      return value
    }
    expect(tint(1)).toBe('las')
    expect(tint(2)).toBe('las')
    expect(tint(5)).toBe('none')
    expect(tint(6)).toBe('none')
    expect(tint(7)).toBe('none')
    expect(tint(8)).toBe('rep')
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

  it('reads the day from the view model: the sentence, the countdown and the caveat', () => {
    mount(1, 'desktop')
    expect(
      screen.getByText('Fyra saker idag, ungefär 25 minuter. Börja med kortet överst.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'God eftermiddag.' })).toBeInTheDocument()
    expect(screen.getAllByText(D.home.prognosis.caveat ?? '').length).toBeGreaterThan(0)
    expect(document.querySelector('.sv-countdown-n')).toHaveTextContent(
      String(D.home.exam.daysLeft),
    )
  })

  it('takes the card in front on Enter: Fortsätt opens the drill, a plan card its item', () => {
    const { onScreen, actions } = mount(1, 'desktop')
    press('Enter')
    expect(onScreen).toHaveBeenCalledWith(2)
    press('ArrowRight')
    press('Enter')
    expect(actions.openPlanItem).toHaveBeenCalledWith('rep')
    // The frame opens the page at once: Repetera, inside Öva's door.
    expect(screen.getByTestId('rd-nav-ova')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { level: 1, name: 'Repetera' })).toBeInTheDocument()
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
})

describe('Svep, the frame', () => {
  it('asks the host for a door and opens its page at once', () => {
    const { actions } = mount(1, 'desktop')
    fireEvent.click(screen.getByTestId('rd-nav-ova'))
    expect(actions.go).toHaveBeenCalledWith('ova')
    expect(screen.getByTestId('rd-nav-ova')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { level: 1, name: 'Öva' })).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-nav-provpass'))
    expect(actions.go).toHaveBeenCalledWith('provpass')
  })

  it('re-seats on the switcher: screen 8 is Repetera inside Öva, screen 1 Idag again', () => {
    const { goTo } = mount(8, 'desktop')
    expect(screen.getByRole('heading', { level: 1, name: 'Repetera' })).toBeInTheDocument()
    expect(screen.getByTestId('rd-nav-ova')).toHaveAttribute('aria-current', 'page')
    goTo(1)
    expect(screen.getByTestId('rd-nav-idag')).toHaveAttribute('aria-current', 'page')
    expect(front('home')).toBe('resume')
  })

  it('opens the account card and puts it back on Esc', () => {
    mount(1, 'phone')
    expect(screen.queryByTestId('rd-account-menu')).toBeNull()
    fireEvent.click(screen.getByTestId('rd-account'))
    expect(screen.getByTestId('rd-account-menu')).toBeInTheDocument()
    press('Escape')
    expect(screen.queryByTestId('rd-account-menu')).toBeNull()
  })

  it('shows who is signed in, and asks for Konto and the sign-out through the context', () => {
    const { actions } = mount(4, 'desktop')
    const card = within(screen.getByTestId('rd-account-menu'))
    expect(card.getByText(D.konto.identity.name)).toBeInTheDocument()
    expect(card.getByText(D.konto.identity.email)).toBeInTheDocument()
    fireEvent.click(card.getByRole('button', { name: /^Konto/ }))
    expect(actions.openKonto).toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('rd-account'))
    fireEvent.click(within(screen.getByTestId('rd-account-menu')).getByText('Logga ut'))
    expect(actions.signOut).toHaveBeenCalled()
  })

  it('folds the desktop doors into a hand and back', () => {
    mount(1, 'desktop')
    const fold = screen.getByTestId('rd-collapse')
    expect(fold).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(fold)
    expect(fold).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByTestId('rd-nav-ova')).toHaveAccessibleName(
      `Öva, ${D.home.ovaDue} att repetera`,
    )
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
    expect(fold).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('Svep, the reading drill', () => {
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

  it('grades through the context’s controller and never leaves on Esc', () => {
    const { onScreen, actions } = mount(2, 'desktop')
    press('f')
    press('Escape')
    expect(onScreen).not.toHaveBeenCalled()
    press('b')
    press('Enter')
    expect(actions.drill.lock).toHaveBeenCalledWith(expect.objectContaining({ qid: Q3.qid }), 'B')
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
    const { onScreen, goTo, actions } = mount(3, w)
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
    expect(done).toHaveTextContent('Magasinet i Hökaryd · 4 frågor')
    fireEvent.click(screen.getByTestId('rd-done-next'))
    expect(actions.openPlanItem).toHaveBeenCalledWith(D.home.plan.items[0].id)
    fireEvent.click(within(done).getByRole('button', { name: 'Till Idag' }))
    expect(onScreen).toHaveBeenLastCalledWith(1)
  })
})

describe('Svep, Öva', () => {
  it('leads with the suggestion: the weakest section, its one filled action and its tab', () => {
    mount(5, 'desktop')
    expect(front('ova')).toBe('forslag')
    const suggestion = document.querySelector('[data-card="forslag"]') as HTMLElement
    expect(suggestion).toHaveTextContent('ditt svagaste delprov just nu')
    expect(within(suggestion).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Matematisk problemlösning',
    )
    // One raspberry action on the screen, and the weakest door's tab.
    const filled = document.querySelectorAll('.sv-btn--primary')
    expect(filled).toHaveLength(1)
    expect(filled[0]).toHaveTextContent('Öva XYZ')
    expect(screen.getByTestId('rd-ova-section-xyz')).toHaveTextContent('Svagast')
    expect(document.querySelectorAll('.sv-sdoor-tab')).toHaveLength(1)
  })

  it('takes the card in front on Enter, and hands → back at the deck’s end', () => {
    const { actions } = mount(5, 'desktop')
    press('Enter')
    expect(actions.startDrill).toHaveBeenLastCalledWith({ kind: 'section', section: 'XYZ' })
    press('ArrowRight')
    expect(front('ova')).toBe('blandat')
    press('Enter')
    expect(actions.startDrill).toHaveBeenLastCalledWith({ kind: 'mixed' })
    press('ArrowRight')
    expect(front('ova')).toBe('repetera')
    expect(press('ArrowRight')).toBe(true)
    press('Enter')
    expect(actions.openRepetera).toHaveBeenCalled()
  })

  it('tints the table lilac only while Repetera is in front', () => {
    mount(5, 'desktop')
    const root = screen.getByTestId('rd-svep')
    expect(root).toHaveAttribute('data-tint', 'none')
    const index = within(screen.getByRole('navigation', { name: 'Kortregister' }))
    fireEvent.click(index.getByRole('button', { name: /Repetera/ }))
    expect(root).toHaveAttribute('data-tint', 'rep')
    fireEvent.click(index.getByRole('button', { name: /Blandat/ }))
    expect(root).toHaveAttribute('data-tint', 'none')
  })

  it('lists the eight sections in the exam’s order, each with its full name', () => {
    mount(5, 'desktop')
    const doors = screen.getAllByTestId(/^rd-ova-section-/)
    expect(doors.map((d) => d.dataset.testid)).toEqual(
      ['ord', 'las', 'mek', 'elf', 'xyz', 'kva', 'nog', 'dtk'].map((s) => `rd-ova-section-${s}`),
    )
    expect(screen.getByTestId('rd-ova-section-dtk')).toHaveAccessibleName(
      /Diagram, tabeller och kartor/,
    )
    expect(screen.getByTestId('rd-ova-repetera')).toHaveTextContent(
      `${D.ova.repetera.pile} i dagens hög`,
    )
  })

  it('opens practice on a common trap', () => {
    const { actions } = mount(5, 'desktop')
    const trap = D.ova.weakTraps[0]
    fireEvent.click(screen.getByRole('button', { name: new RegExp(trap.pattern ?? trap.name) }))
    expect(actions.startDrill).toHaveBeenCalledWith({
      kind: 'framework',
      frameworkId: trap.frameworkId,
      section: trap.section,
    })
  })

  it('on phone keeps the doors above the deck and its index as small cards', () => {
    mount(5, 'phone')
    const ticks = within(screen.getByRole('list', { name: 'Kortregister' }))
    expect(ticks.getAllByRole('button')).toHaveLength(3)
    fireEvent.click(ticks.getByRole('button', { name: 'Kort 2: Blandat' }))
    expect(front('ova')).toBe('blandat')
  })
})

describe('Svep, Kvantfråga', () => {
  it('keeps KVA’s condition and both quantities on the one card, above the four comparisons', () => {
    mount(6, 'desktop')
    answer(XYZ.answer)
    fireEvent.click(screen.getByTestId('rd-next'))
    const prompt = screen.getByTestId('rd-quant-prompt')
    expect(prompt).toHaveTextContent('y > 0')
    const quantities = prompt.querySelectorAll('.sv-kva-q')
    expect(quantities).toHaveLength(2)
    expect(quantities[0]).toHaveTextContent('Kvantitet I')
    expect(quantities[1]).toHaveTextContent('Kvantitet II')
    expect(screen.getAllByTestId(/^rd-quant-option-/)).toHaveLength(KVA.options?.length ?? 0)
  })

  it('sets NOG’s stem, statements (1) and (2) and the coda together with five choices', () => {
    mount(6, 'desktop')
    answer(XYZ.answer)
    fireEvent.click(screen.getByTestId('rd-next'))
    answer(KVA.answer)
    fireEvent.click(screen.getByTestId('rd-next'))
    const prompt = screen.getByTestId('rd-quant-prompt')
    expect(prompt.querySelectorAll('.sv-nog-st')).toHaveLength(2)
    expect(prompt).toHaveTextContent('Tillräcklig information för lösningen erhålls')
    expect(screen.getAllByTestId(/^rd-quant-option-/)).toHaveLength(NOG.options?.length ?? 0)
    expect(screen.getByText('E', { selector: '.sv-kbd' })).toBeInTheDocument()
  })

  it('chooses on the question’s own letters, answers on Enter and never leaves on Esc', () => {
    const { actions } = mount(6, 'desktop')
    expect(press('e')).toBe(true)
    press('d')
    expect(screen.getByTestId('rd-quant-option-D')).toHaveAttribute('aria-pressed', 'true')
    press('Escape')
    expect(actions.drill.exit).not.toHaveBeenCalled()
    press('Enter')
    expect(actions.drill.lock).toHaveBeenCalledWith(expect.objectContaining({ qid: XYZ.qid }), 'D')
  })

  it('turns into the facit run with the problem set again above the solution, no ¶ links', () => {
    mount(6, 'desktop')
    const wrong = (XYZ.options ?? []).find((o) => o.letter !== XYZ.answer)?.letter ?? 'A'
    answer(wrong)
    const run = document.querySelectorAll('.sv-deck[data-kind="run"] .sv-dcard')
    expect([...run].map((c) => c.getAttribute('data-card'))).toEqual([
      'svar',
      'lockade',
      'tamed',
      'losning',
      'andra',
    ])
    expect(screen.queryAllByTestId(/^rd-cite-/)).toHaveLength(0)
    const problem = document.querySelector('[data-card="losning"] .sv-rc-problem')
    expect(problem).not.toBeNull()
    expect(problem?.textContent).not.toMatch(/\\dfrac|\\tfrac/)
    expect(document.querySelector('[data-card="losning"] .katex')).not.toBeNull()
  })

  it('ends in the hand turned face up: Stäng leaves through the controller', () => {
    const { actions } = mount(6, 'desktop')
    for (const q of [XYZ, KVA, NOG]) {
      answer(q.answer)
      fireEvent.click(screen.getByTestId('rd-next'))
    }
    const done = screen.getByTestId('rd-done')
    expect(done).toHaveTextContent('Hela leken är vänd.')
    expect(done).toHaveTextContent('3 frågor · 3 rätt')
    expect(within(done).getAllByRole('listitem')).toHaveLength(3)
    fireEvent.click(screen.getByTestId('rd-done-close'))
    expect(actions.drill.exit).toHaveBeenCalled()
    fireEvent.click(within(done).getByRole('button', { name: 'Öva igen' }))
    expect(screen.getByTestId('rd-quant-prompt')).toBeInTheDocument()
    expect(screen.queryByTestId('rd-done')).toBeNull()
  })

  it('keeps the card alone on the phone table, the run on the table after the answer', () => {
    mount(6, 'phone')
    expect(screen.queryByTestId('rd-sheet')).toBeNull()
    answer(XYZ.answer)
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'true')
    expect(screen.getByRole('list', { name: 'Facitkorten' })).toBeInTheDocument()
  })
})

describe('Svep, DTK', () => {
  it('zooms the page, turns it a quarter and fits it again', () => {
    mount(7, 'desktop')
    const figure = within(screen.getByTestId('rd-figure'))
    const page = () => document.querySelector('.sv-fig-page') as HTMLElement
    expect(figure.getByRole('status')).toHaveTextContent('Hela sidan')
    expect(figure.getByRole('button', { name: 'Zooma ut' })).toBeDisabled()
    fireEvent.click(figure.getByRole('button', { name: 'Zooma in' }))
    expect(figure.getByRole('status')).toHaveTextContent('150 %')
    fireEvent.click(figure.getByRole('button', { name: 'Vrid ett kvarts varv' }))
    expect(page()).toHaveAttribute('data-turned', 'true')
    fireEvent.click(figure.getByRole('button', { name: 'Anpassa' }))
    expect(figure.getByRole('status')).toHaveTextContent('Hela sidan')
    expect(page()).toHaveAttribute('data-turned', 'false')
  })

  it('opens the page enlarged in a dialog that holds the keys, and Esc closes it', () => {
    mount(7, 'desktop')
    fireEvent.click(screen.getByRole('button', { name: /Förstora/ }))
    const dialog = screen.getByRole('dialog', { name: `Underlaget · uppgift ${DTK.number}` })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'Stäng förstoringen' })).toHaveFocus()
    // The question behind does not hear the letters while the viewer is open.
    press('c')
    expect(screen.getByTestId('rd-quant-option-C')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    press('c')
    expect(screen.getByTestId('rd-quant-option-C')).toHaveAttribute('aria-pressed', 'true')
  })

  it('leaves the arrows to the page while it has the focus', () => {
    mount(7, 'desktop')
    loadImages()
    answer(DTK.answer)
    expect(front('run')).toBe('svar')
    const region = screen.getByRole('region', { name: `Underlaget till uppgift ${DTK.number}` })
    act(() => region.focus())
    // The page takes the key (it pans) and marks it used.
    expect(press('ArrowRight', region)).toBe(false)
    expect(front('run')).toBe('svar')
    act(() => region.blur())
    press('ArrowRight')
    expect(front('run')).not.toBe('svar')
  })

  it('on phone lays the page under the question card, which peeks and rises', () => {
    mount(7, 'phone')
    const sheet = screen.getByTestId('rd-sheet')
    expect(sheet).toHaveAttribute('data-state', 'peek')
    expect(within(sheet).getByTestId('rd-quant-prompt')).toHaveTextContent(DTK.prompt ?? '')
    fireEvent.click(within(sheet).getByText('Till frågan').closest('button') as HTMLElement)
    expect(sheet).toHaveAttribute('data-state', 'open')
    fireEvent.click(within(sheet).getByText('Till figuren').closest('button') as HTMLElement)
    expect(sheet).toHaveAttribute('data-state', 'peek')
  })
})

describe('Svep, Repetera', () => {
  it('counts the batch on its one card and starts it on Enter', () => {
    const { actions } = mount(8, 'desktop')
    expect(document.querySelector('.sv-rep-n')).toHaveTextContent(String(D.repetera.dueNow))
    expect(screen.getByTestId('rd-repetera-start')).toHaveTextContent(
      `Repetera ${D.repetera.dueNow}`,
    )
    press('Enter')
    expect(actions.startDrill).toHaveBeenCalledWith({ kind: 'repetition' })
  })

  it('narrows the batch to a section and widens it again', () => {
    const { actions } = mount(8, 'desktop')
    const kva = D.repetera.items.filter((i) => i.dueNow && i.section === 'KVA')
    const other = D.repetera.items.find((i) => i.dueNow && i.section !== 'KVA')
    if (!other) throw new Error('the fixture pile has more than KVA ready')
    fireEvent.click(screen.getByRole('button', { name: `KVA ${kva.length}` }))
    expect(screen.getByTestId('rd-repetera-start')).toHaveTextContent(`Repetera ${kva.length}`)
    expect(screen.queryByTestId(`rd-repetera-item-${other.n}`)).toBeNull()
    fireEvent.click(screen.getByTestId('rd-repetera-start'))
    expect(actions.startDrill).toHaveBeenCalledWith({ kind: 'repetition', section: 'KVA' })
    fireEvent.click(screen.getByRole('button', { name: /^Alla/ }))
    expect(screen.getByTestId(`rd-repetera-item-${other.n}`)).toBeInTheDocument()
  })

  it('keeps the rest of today’s pile folded under the batch', () => {
    mount(8, 'desktop')
    const later = D.repetera.items.filter((i) => !i.dueNow)
    const toggle = screen.getByRole('button', { name: `${later.length} till blir redo senare` })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId(`rd-repetera-item-${later[0].n}`)).toBeNull()
    fireEvent.click(toggle)
    expect(screen.getByTestId(`rd-repetera-item-${later[0].n}`)).toHaveTextContent(later[0].section)
  })

  it('names each card’s question and trap, the English ones marked English', () => {
    mount(8, 'desktop')
    const elf = D.repetera.items.find((i) => i.section === 'ELF')
    const trap = D.repetera.items.find((i) => i.dueNow && i.frameworkName)
    if (!elf || !trap) throw new Error('the fixture pile has an ELF miss and a named trap')
    const elfItem = screen.getByTestId(`rd-repetera-item-${elf.n}`)
    expect(elfItem.querySelector('[lang="en"]')).not.toBeNull()
    expect(screen.getByTestId(`rd-repetera-item-${trap.n}`)).toHaveTextContent(
      trap.frameworkName ?? '',
    )
  })

  it('goes back to Öva through the door', () => {
    const { actions } = mount(8, 'desktop')
    fireEvent.click(screen.getByRole('button', { name: 'Till Öva' }))
    expect(actions.go).toHaveBeenCalledWith('ova')
  })
})

// ── Without what the real app cannot fill ────────────────────────────

/** The fixtures without the view model's optional fields: no range, target
 *  or weekly series for the prognosis, no rising trap, no weekly goal, no
 *  pause time, minutes or device on the resume, no plan marker, no drill
 *  clock and no wrong pick. */
function withoutOptional(data: DirectionData): DirectionData {
  const { low: _l, high: _h, target: _t, weeks: _w, ...prognosis } = data.home.prognosis
  const paused = data.home.resume
  const resume = paused
    ? (({ pausedAt: _p, minutesLeft: _m, device: _d, ...rest }: typeof paused) => rest)(paused)
    : null
  const { goal: _g, ...week } = data.home.week
  const drill = (s: DirectionData['drills']['reading']) => {
    const { elapsedSeconds: _e, wrongPick: _wp, ...rest } = s
    return rest
  }
  return {
    ...data,
    home: {
      ...data.home,
      prognosis,
      resume,
      week,
      traps: data.home.traps.map(({ rising: _r, ...t }) => t),
      plan: {
        ...data.home.plan,
        items: data.home.plan.items.map(({ primary: _pr, ...i }) => i),
      },
    },
    drills: {
      reading: drill(data.drills.reading),
      quant: drill(data.drills.quant),
      dtk: drill(data.drills.dtk),
      elf: drill(data.drills.elf),
    },
  }
}

describe('Svep, without the fields the real app cannot fill', () => {
  const props = (s: AppScreenKey, width: WidthKey): DirectionProps => ({
    screen: s,
    width,
    theme: 'light',
    live: true,
    onScreen: vi.fn(),
    onTheme: vi.fn(),
  })

  it.each(
    WIDTHS.flatMap((w) => (meta.screens ?? []).map((s) => [s, w] as const)),
  )('renders screen %s (%s) with no hole where a field is missing', (s, w) => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <DirectionDataProvider data={withoutOptional(D)}>
        <Svep {...props(s, w)} />
      </DirectionDataProvider>,
    )
    const text = screen.getByTestId('rd-svep').textContent ?? ''
    expect(text).not.toMatch(/undefined|NaN|null/)
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })

  it('leaves the minutes out of the day rather than sum a part it lacks', () => {
    render(
      <DirectionDataProvider data={withoutOptional(D)}>
        <Svep {...props(1, 'desktop')} />
      </DirectionDataProvider>,
    )
    expect(screen.getByText('Fyra saker idag. Börja med kortet överst.')).toBeInTheDocument()
    expect(screen.queryByText(/Mål/)).toBeNull()
    expect(screen.queryByText(/Troligt/)).toBeNull()
    // The plan's order is its priority: its first item leads.
    expect(document.querySelector('[data-card="rep"]')).toHaveTextContent('först i planen')
  })

  it('shows the verdict without an explanation that is not there yet', () => {
    const data: DirectionData = {
      ...D,
      drills: {
        ...D.drills,
        quant: {
          ...D.drills.quant,
          explanations: Object.fromEntries(D.drills.quant.questions.map((q) => [q.qid, null])),
        },
      },
    }
    render(
      <DirectionDataProvider data={data}>
        <Svep {...props(6, 'desktop')} />
      </DirectionDataProvider>,
    )
    answer('A')
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
    expect(screen.getByText('Förklaringen saknas just nu.')).toBeInTheDocument()
    expect(document.querySelectorAll('.sv-deck[data-kind="run"] .sv-dcard')).toHaveLength(1)
  })
})

// ── Round 2: the DTK page's keys, inside the bake-off itself ─────────

const ARROWS = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']

describe('Svep, the DTK page inside the bake-off', () => {
  // jsdom has no layout: give every box the room under the bar of a
  // 1440 × 900 window, so the stage mounts the direction.
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(1440)
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(848)
  })
  afterEach(() => vi.restoreAllMocks())

  /** The bake-off page on Svep's DTK screen, its selection kept as the
   *  route keeps it, every change recorded. `pan` spies on the scrolls. */
  async function bakeoff() {
    const onSelect = vi.fn<(next: Partial<Selection>) => void>()
    function Page() {
      const [sel, setSel] = useState<Selection>({
        d: 'e',
        s: 7,
        w: 'desktop',
        t: 'light',
        sbs: false,
        bare: false,
      })
      return (
        <Redesign2026Bakeoff
          sel={sel}
          onSelect={(next) => {
            onSelect(next)
            setSel((s) => ({ ...s, ...next }))
          }}
        />
      )
    }
    render(<Page />)
    const stage = screen.getByTestId('rb26-stage')
    await within(stage).findByTestId('rd-svep', {}, { timeout: 5000 })
    const pan = vi.spyOn(Element.prototype, 'scrollBy')
    const region = within(stage).getByRole('region', {
      name: `Underlaget till uppgift ${DTK.number}`,
    })
    return { onSelect, stage, pan, region }
  }

  it('keeps the arrows in the focused page: it pans, and the screen stays DTK', async () => {
    const { onSelect, stage, pan, region } = await bakeoff()
    act(() => region.focus())
    for (const key of ARROWS) fireEvent.keyDown(region, { key })
    expect(onSelect).not.toHaveBeenCalled()
    expect(stage).toHaveAttribute('data-screen', '7')
    expect(pan).toHaveBeenCalledTimes(ARROWS.length)
    // In Facit too: the run stays on its verdict and the screen on DTK.
    loadImages()
    answer(DTK.answer)
    act(() => region.focus())
    for (const key of ARROWS) fireEvent.keyDown(region, { key })
    expect(onSelect).not.toHaveBeenCalled()
    expect(front('run')).toBe('svar')
    expect(stage).toHaveAttribute('data-screen', '7')
  })

  it('gives → back to the switcher once the page lets go of the focus', async () => {
    const { onSelect, stage, region } = await bakeoff()
    act(() => region.focus())
    fireEvent.keyDown(region, { key: 'ArrowRight' })
    act(() => region.blur())
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenLastCalledWith({ s: 8 })
    expect(stage).toHaveAttribute('data-screen', '8')
  })

  it('keeps the arrows in the enlarged page, wherever the focus is in it', async () => {
    const { onSelect, stage, pan } = await bakeoff()
    fireEvent.click(within(stage).getByRole('button', { name: /Förstora/ }))
    const dialog = screen.getByRole('dialog', { name: `Underlaget · uppgift ${DTK.number}` })
    const close = within(dialog).getByRole('button', { name: 'Stäng förstoringen' })
    expect(close).toHaveFocus()
    for (const key of ARROWS) fireEvent.keyDown(close, { key })
    const region = within(dialog).getByRole('region', {
      name: `Underlaget förstorat, uppgift ${DTK.number}`,
    })
    act(() => region.focus())
    for (const key of ARROWS) fireEvent.keyDown(region, { key })
    expect(onSelect).not.toHaveBeenCalled()
    expect(stage).toHaveAttribute('data-screen', '7')
    expect(screen.getByRole('dialog')).toBe(dialog)
    expect(pan).toHaveBeenCalledTimes(2 * ARROWS.length)
  })
})

// ── Round 2: a question waits for the pictures it needs ─────────────

/** The fixtures with `questions` as the DTK sitting. */
function dtkWith(questions: DrillQuestion[]): DirectionData {
  return { ...D, drills: { ...D.drills, dtk: { ...D.drills.dtk, questions } } }
}

/** The DTK page on screen (the figure card's, not the viewer's). */
const page = () =>
  within(screen.getByTestId('rd-figure')).getByRole('img', { name: DTK.figure?.alt })
const lockButton = () => screen.getByTestId('rd-lock')
/** Svara's line: why it waits, when it does. */
const echo = () => document.querySelector('.sv-lockbar .sv-echo')

describe('Svep, a question that needs its pictures', () => {
  it.each(
    WIDTHS,
  )('cannot be answered before its page has loaded: not by Svara, Enter or Space (%s)', (w) => {
    const { actions } = mount(7, w)
    fireEvent.click(reveal(`rd-quant-option-${DTK.answer}`))
    expect(lockButton()).toBeDisabled()
    expect(echo()).toHaveTextContent('Väntar på underlaget.')
    press('Enter')
    press(' ')
    fireEvent.click(lockButton())
    expect(actions.drill.lock).not.toHaveBeenCalled()
    fireEvent.load(page())
    expect(lockButton()).toBeEnabled()
    press('Enter')
    expect(actions.drill.lock).toHaveBeenCalledWith(
      expect.objectContaining({ qid: DTK.qid }),
      DTK.answer,
    )
  })

  it('says when the page failed, stays shut and answers after another try', () => {
    const { actions } = mount(7, 'desktop')
    fireEvent.error(page())
    expect(screen.getByRole('alert')).toHaveTextContent('Underlaget kunde inte laddas.')
    press(DTK.answer.toLowerCase())
    expect(lockButton()).toBeDisabled()
    expect(echo()).toHaveTextContent('Underlaget behövs för att svara.')
    press('Enter')
    press(' ')
    fireEvent.click(lockButton())
    expect(actions.drill.lock).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Försök igen' }))
    expect(screen.queryByRole('alert')).toBeNull()
    // The new try has not loaded yet.
    expect(lockButton()).toBeDisabled()
    fireEvent.load(page())
    expect(lockButton()).toBeEnabled()
    fireEvent.click(lockButton())
    expect(actions.drill.lock).toHaveBeenCalledTimes(1)
  })

  it('counts a page the browser already holds (a cached load) at once', () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(2316)
    try {
      const { actions } = mount(7, 'desktop')
      press(DTK.answer.toLowerCase())
      expect(lockButton()).toBeEnabled()
      press('Enter')
      expect(actions.drill.lock).toHaveBeenCalledTimes(1)
    } finally {
      vi.restoreAllMocks()
    }
  })

  it('keeps a page shared by consecutive questions loaded: one load serves both', () => {
    const [first, second] = ['host-2025-kvant1-DTK-029', 'host-2025-kvant1-DTK-030'].map((qid) =>
      drillQuestion(PASS_QUESTIONS.find((q) => q.qid === qid) as Question, DTK_PAGES),
    )
    expect(second.figure?.src).toBe(first.figure?.src)
    const { actions } = host(dtkWith([first, second]), 7)
    fireEvent.load(page())
    answer(first.answer)
    fireEvent.click(screen.getByTestId('rd-next'))
    // The same page is still on screen: no new load comes, and none is needed.
    fireEvent.click(screen.getByTestId(`rd-quant-option-${second.answer}`))
    expect(lockButton()).toBeEnabled()
    fireEvent.click(lockButton())
    expect(actions.drill.lock).toHaveBeenLastCalledWith(
      expect.objectContaining({ qid: second.qid }),
      second.answer,
    )
  })

  it('waits for picture options too, says when one failed and tries it again', () => {
    const pictures: DrillQuestion = {
      ...DTK,
      options: (DTK.options ?? []).map((o) => ({
        ...o,
        figure: {
          src: `figures/dtk/test-option-${o.letter}.png`,
          alt: `Cirkeldiagram ${o.letter}`,
          width: 400,
          height: 400,
        },
      })),
    }
    const { actions } = host(dtkWith([pictures]), 7)
    const picture = (l: string) =>
      within(screen.getByTestId(`rd-quant-option-${l}`)).getByRole('img', {
        name: `Cirkeldiagram ${l}`,
      })
    fireEvent.load(page())
    press(pictures.answer.toLowerCase())
    // The page is in, the pictures not yet.
    expect(lockButton()).toBeDisabled()
    expect(echo()).toHaveTextContent('Väntar på bilderna.')
    for (const l of ['A', 'C', 'D']) fireEvent.load(picture(l))
    fireEvent.error(picture('B'))
    expect(screen.getByTestId('rd-quant-option-B')).toHaveTextContent('Bilden kunde inte laddas.')
    expect(lockButton()).toBeDisabled()
    expect(echo()).toHaveTextContent('En bild kunde inte laddas.')
    press('Enter')
    press(' ')
    expect(actions.drill.lock).not.toHaveBeenCalled()
    const lockbar = lockButton().closest('.sv-lockbar') as HTMLElement
    fireEvent.click(within(lockbar).getByRole('button', { name: 'Försök igen' }))
    expect(lockButton()).toBeDisabled()
    fireEvent.load(picture('B'))
    expect(lockButton()).toBeEnabled()
    press('Enter')
    expect(actions.drill.lock).toHaveBeenCalledWith(
      expect.objectContaining({ qid: pictures.qid }),
      pictures.answer,
    )
  })

  it.each(
    WIDTHS,
  )('says when a DTK page is missing and offers the way back, never a guess (%s)', (w) => {
    const { actions } = host(dtkWith([{ ...DTK, figure: null }]), 7, w)
    const card = screen.getByTestId('rd-figure')
    expect(card).toHaveTextContent('Underlaget saknas just nu.')
    press(DTK.answer.toLowerCase())
    expect(lockButton()).toBeDisabled()
    press('Enter')
    press(' ')
    expect(actions.drill.lock).not.toHaveBeenCalled()
    fireEvent.click(within(card).getByRole('button', { name: 'Tillbaka' }))
    expect(actions.drill.exit).toHaveBeenCalled()
  })
})

// ── Round 2: the decks hold when their data changes ──────────────────

/** A day with nothing on it: no sitting to resume, an empty plan, no
 *  estimate yet, no traps and no passes. */
const EMPTY_DAY: DirectionData = {
  ...D,
  home: {
    ...D.home,
    resume: null,
    plan: { ...D.home.plan, items: [], minutes: 0 },
    prognosis: { ...D.home.prognosis, total: null },
    traps: [],
    recent: [],
  },
}

const cardsOf = (kind: 'home' | 'ova') =>
  [...document.querySelectorAll(`.sv-deck[data-kind="${kind}"] .sv-dcard`)].map((c) =>
    c.getAttribute('data-card'),
  )

describe('Svep, decks on data that changes', () => {
  it('keeps the last card in front on Idag when the resume goes from under it', () => {
    const { rerender } = host(D, 1)
    press('End')
    expect(front('home')).toBe('recent')
    rerender({ ...D, home: { ...D.home, resume: null } })
    expect(cardsOf('home')).toHaveLength(6)
    expect(front('home')).toBe('recent')
    // The deck still moves from there.
    press('ArrowLeft')
    expect(front('home')).toBe('trap')
  })

  it('keeps the card in front when a card before it goes', () => {
    const { rerender } = host(D, 1)
    const index = within(screen.getByRole('navigation', { name: 'Kortregister' }))
    fireEvent.click(index.getByRole('button', { name: /Prognos/ }))
    expect(front('home')).toBe('prognos')
    rerender({ ...D, home: { ...D.home, resume: null } })
    expect(front('home')).toBe('prognos')
    expect(screen.getByTestId('rd-svep')).toHaveAttribute('data-tint', 'none')
  })

  it.each(WIDTHS)('lays one calm card on a day with nothing on it (%s)', (w) => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { actions } = host(EMPTY_DAY, 1, w)
    expect(cardsOf('home')).toEqual(['empty'])
    expect(screen.getByText('Inget inplanerat idag.')).toBeInTheDocument()
    const card = document.querySelector('[data-card="empty"]') as HTMLElement
    expect(within(card).getByRole('heading', { level: 2 })).toHaveTextContent('Öva fritt')
    press('Enter')
    expect(actions.go).toHaveBeenCalledWith('ova')
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })

  it('shrinks to that card when the day empties under its last card, and grows back', () => {
    const { rerender } = host(D, 1)
    press('End')
    rerender(EMPTY_DAY)
    expect(front('home')).toBe('empty')
    rerender(D)
    expect(cardsOf('home')).toHaveLength(7)
    expect(front('home')).toBe('resume')
  })

  it('keeps Repetera in front on Öva when the suggestion goes', () => {
    const { rerender } = host(D, 5)
    const index = within(screen.getByRole('navigation', { name: 'Kortregister' }))
    fireEvent.click(index.getByRole('button', { name: /Repetera/ }))
    expect(front('ova')).toBe('repetera')
    rerender({ ...D, ova: { ...D.ova, weakest: null } })
    expect(cardsOf('ova')).toEqual(['blandat', 'repetera'])
    expect(front('ova')).toBe('repetera')
    expect(screen.getByTestId('rd-svep')).toHaveAttribute('data-tint', 'rep')
  })
})

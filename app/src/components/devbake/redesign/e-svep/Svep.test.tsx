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
// Idag and Öva hold when their data changes under them. Batch 2: the
// Provpass hub and its gate, the running pass (keys inside the real
// bake-off, the clock, the hand-in and the void, pictures, data that
// changes), the result and Framsteg with Historik. Batch 2's round 2: a
// picture's state belongs to the place that shows it (the enlarged page
// never speaks for the page on the card), and a running pass's text keeps
// its arrows inside the real bake-off. Batch 2's round 3: a hand-in that
// fails, or that the host does not follow with the result, lets go of the
// pass inside the real bake-off and is never sent again.

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

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
import { DIRECTIONS } from '@/components/devbake/redesign/directions'
import {
  Redesign2026Bakeoff,
  type Selection,
} from '@/components/devbake/redesign/Redesign2026Bakeoff'
import {
  type AppScreenKey,
  DESTINATIONS,
  type DirectionProps,
  fmtClock,
  fmtScore,
  THEMES,
  type ThemeKey,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import { DTK_PAGES, PASS_QUESTIONS } from '@/components/devbake/redesign/r2Fixtures'
import type {
  DirectionActions,
  DirectionData,
  DrillQuestion,
} from '@/components/devbake/redesign/viewModel'
import type { Question } from '@/data/questions'
import { meta } from './meta'
import { Svep } from './Svep'
import { SETTLE_MS } from './SvepProvpass'

// The bake-off's own data and requests, changed for one test: the real
// hook, its data passed through `bakeoffData.patch` and its requests
// through `bakeoffData.actions` while one is set.
const bakeoffData = vi.hoisted(() => ({
  patch: null as ((data: DirectionData) => DirectionData) | null,
  actions: null as ((actions: DirectionActions) => DirectionActions) | null,
}))

vi.mock('@/components/devbake/redesign/directionData', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/components/devbake/redesign/directionData')>()
  const { useMemo } = await import('react')
  function useBakeoffDirectionData(...args: Parameters<typeof actual.useBakeoffDirectionData>) {
    const value = actual.useBakeoffDirectionData(...args)
    const { patch, actions } = bakeoffData
    return useMemo(
      () =>
        patch || actions
          ? {
              data: patch ? patch(value.data) : value.data,
              actions: actions ? actions(value.actions) : value.actions,
            }
          : value,
      [value, patch, actions],
    )
  }
  return { ...actual, useBakeoffDirectionData }
})

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

/** The card in front of a deck ("home" on Idag, "ova" on Öva, "run" in
 *  Facit, "prov" on Provpass, "res" on its result, "fs" on Framsteg). */
function front(kind: 'home' | 'ova' | 'run' | 'prov' | 'res' | 'fs'): string | null {
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

  it('is built: screens 1–11, the registry entry no longer a stub', () => {
    expect(meta.stub).toBeUndefined()
    expect(meta.screens).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
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
    expect(tint(9)).toBe('none')
    expect(tint(10)).toBe('none')
    expect(tint(11)).toBe('none')
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
 *  clock and no wrong pick; no Provpass rhythm, flags, combined total, trap
 *  or per-section estimate. */
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
  const { prescription: _pre, ...hub } = data.provpass.hub
  const { flags: _flags, ...running } = data.provpass.running
  const { total: _total, trap: _trap, ...result } = data.provpass.result
  const { low: _fl, high: _fh, target: _ft, weeks: _fw, ...fsPrognosis } = data.framsteg.prognosis
  const { goal: _fg, record: _fr, daysPractised: _fd, ...fsWeek } = data.framsteg.week
  return {
    ...data,
    provpass: {
      hub,
      running: { ...running, grid: running.grid.map(({ flagged: _f, ...c }) => c) },
      result: { ...result, sections: result.sections.map(({ estimate: _e, ...s }) => s) },
    },
    framsteg: { ...data.framsteg, prognosis: fsPrognosis, week: fsWeek },
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

const cardsOf = (kind: 'home' | 'ova' | 'prov' | 'res' | 'fs') =>
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

// ── Batch 2: Provpass ────────────────────────────────────────────────

const HUB = D.provpass.hub
const RUN = D.provpass.running
const RESULT = D.provpass.result
const F = D.framsteg

/** The hub's suggested pass of a half: the one seen least. */
function suggested(half: 'verbal' | 'kvant') {
  const pass = HUB.passes.find((p) => p.suggested && p.half === half)
  if (!pass) throw new Error(`the hub suggests no ${half} pass`)
  return pass
}

/** Starts the suggested pass through its gate. */
function startPass() {
  fireEvent.click(screen.getByTestId('rd-prov-start'))
  fireEvent.click(screen.getByTestId('rd-confirm'))
}

const cell = (n: number) => screen.getByTestId(`rd-prov-cell-${n}`)
const currentCell = () =>
  document
    .querySelector('[data-testid^="rd-prov-cell-"][data-current="true"]')
    ?.getAttribute('data-testid')
const choice = (l: string) => screen.getByTestId(`rd-prov-option-${l}`)

/** The fixtures with the running pass changed. */
const running = (patch: Partial<typeof RUN>): DirectionData => ({
  ...D,
  provpass: { ...D.provpass, running: { ...RUN, ...patch } },
})

/** A verbal pass: the reading unit's text, then the ELF unit's, standing on
 *  the first text's last question — where an arrow taken by the run deals
 *  the next text in its place. */
const TEXT_QUESTIONS = [...D.drills.reading.questions, ...D.drills.elf.questions]
const TEXT_END = D.drills.reading.questions.length
const VERBAL_RUN: typeof RUN = {
  ...RUN,
  half: 'verbal',
  questions: TEXT_QUESTIONS,
  grid: TEXT_QUESTIONS.map((q, i) => ({
    n: i + 1,
    qid: q.qid,
    section: q.section,
    answered: false,
  })),
  current: TEXT_END - 1,
  answers: {},
  flags: [],
}
const LAS_TEXT = D.drills.reading.questions[0]?.passage
const ELF_TEXT = D.drills.elf.questions[0]?.passage
if (!LAS_TEXT?.title || !ELF_TEXT) {
  throw new Error('the fixture units must have their texts, the reading one a title')
}
/** The reading text's region is named by its title. */
const LAS_TITLE = LAS_TEXT.title
const withVerbalRun = (d: DirectionData): DirectionData => ({
  ...d,
  provpass: { ...d.provpass, running: VERBAL_RUN },
})

describe('Svep, the Provpass hub', () => {
  it('deals the half the rhythm says is next, its least-seen pass in front, one filled action', () => {
    mount(9, 'desktop')
    const kvant = suggested('kvant')
    expect(screen.getByTestId('rd-prov-half-kvant')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('rd-prov-half-kvant')).toHaveTextContent('Näst på tur')
    expect(front('prov')).toBe(kvant.id)
    expect(cardsOf('prov')).toEqual(HUB.passes.filter((p) => p.half === 'kvant').map((p) => p.id))
    const filled = document.querySelectorAll('.sv-btn--primary')
    expect(filled).toHaveLength(1)
    expect(filled[0]).toHaveTextContent('Förbered provpass')
    // The rules, as the source says them, on the table.
    for (const rule of HUB.rules) expect(screen.getByText(rule)).toBeInTheDocument()
  })

  it('switches half with its door and deals that half from its least-seen pass', () => {
    mount(9, 'desktop')
    fireEvent.click(screen.getByTestId('rd-prov-half-verbal'))
    const verbal = suggested('verbal')
    expect(screen.getByTestId('rd-prov-half-verbal')).toHaveAttribute('aria-pressed', 'true')
    expect(front('prov')).toBe(verbal.id)
    expect(screen.getByTestId(`rd-prov-pass-${verbal.id.replace(':', '-')}`)).toHaveTextContent(
      `${verbal.seenBefore} av ${verbal.presented} sedda tidigare`,
    )
    expect(screen.getByTestId('rd-prov-start')).toHaveTextContent('Förbered provpass')
  })

  it('prepares on Enter but never starts: the gate waits, and Esc or Inte nu put it back', () => {
    const { actions } = mount(9, 'desktop')
    const kvant = suggested('kvant')
    press('Enter')
    const gate = screen.getByRole('dialog', { name: kvant.sitting })
    expect(gate).toHaveTextContent(`${kvant.pass} · ${kvant.presented} frågor · 55 minuter`)
    expect(gate).toHaveTextContent(
      `Du har sett ${kvant.seenBefore} av ${kvant.presented} frågor förut.`,
    )
    for (const rule of HUB.rules) expect(within(gate).getByText(rule)).toBeInTheDocument()
    // The focus is on the card's heading: a second Enter, or a held one,
    // accepts nothing.
    expect(within(gate).getByRole('heading', { level: 2 })).toHaveFocus()
    press('Enter')
    fireEvent.keyDown(window, { key: 'Enter', repeat: true })
    expect(actions.startProvpass).not.toHaveBeenCalled()
    fireEvent.keyDown(within(gate).getByRole('heading', { level: 2 }), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    press('Enter')
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Inte nu' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(actions.startProvpass).not.toHaveBeenCalled()
  })

  it('starts the confirmed pass once and turns to it in focus mode', () => {
    const { actions } = mount(9, 'desktop')
    fireEvent.click(screen.getByTestId('rd-prov-start'))
    expect(actions.startProvpass).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(actions.startProvpass).toHaveBeenCalledTimes(1)
    expect(actions.startProvpass).toHaveBeenCalledWith(suggested('kvant').id)
    // No doors and no account; Avsluta, the clock and Lämna in instead.
    expect(screen.queryByTestId('rd-nav-idag')).toBeNull()
    expect(screen.queryByTestId('rd-account')).toBeNull()
    expect(screen.getByTestId('rd-exit')).toHaveTextContent('Avsluta')
    const title = screen.getByRole('heading', { level: 1 })
    expect(title).toHaveTextContent(`Kvant · ${RUN.sitting} · ${RUN.pass}`)
    expect(title).toHaveFocus()
  })

  it('opens an earlier result from the hub, its door staying Provpass', () => {
    const { actions } = mount(9, 'desktop')
    const [first] = HUB.results
    fireEvent.click(
      screen.getByRole('button', {
        name: new RegExp(`${first.correct} av ${first.presented} rätt`),
      }),
    )
    expect(actions.openProvResult).toHaveBeenCalledWith(first.id)
    expect(screen.getByTestId('rd-prov-result')).toBeInTheDocument()
    expect(screen.getByTestId('rd-nav-provpass')).toHaveAttribute('aria-current', 'page')
  })

  it('offers the other half on a half without passes, never a start', () => {
    const passes = HUB.passes.filter((p) => p.half === 'kvant')
    host({ ...D, provpass: { ...D.provpass, hub: { ...HUB, passes } } }, 9)
    fireEvent.click(screen.getByTestId('rd-prov-half-verbal'))
    expect(screen.queryByTestId('rd-prov-start')).toBeNull()
    expect(cardsOf('prov')).toEqual(['empty'])
    const card = document.querySelector('[data-card="empty"]') as HTMLElement
    expect(card).toHaveTextContent('Inga pass här än')
    fireEvent.click(within(card).getByRole('button', { name: /Visa kvantitativa pass/ }))
    expect(screen.getByTestId('rd-prov-half-kvant')).toHaveAttribute('aria-pressed', 'true')
    expect(front('prov')).toBe(suggested('kvant').id)
  })
})

describe('Svep, a running pass', () => {
  it.each(
    WIDTHS,
  )('answers on the question’s own letters, changeably, and never shows a facit (%s)', (w) => {
    mount(9, w)
    startPass()
    expect(currentCell()).toBe(`rd-prov-cell-${RUN.current + 1}`)
    press('b')
    expect(choice('B')).toHaveAttribute('aria-pressed', 'true')
    expect(cell(RUN.current + 1)).toHaveAttribute('data-answered', 'true')
    press('c')
    expect(choice('C')).toHaveAttribute('aria-pressed', 'true')
    expect(choice('B')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Svar C. Du kan ändra det tills tiden går ut.')).toBeInTheDocument()
    // KVA has four choices: E is no key here.
    expect(press('e')).toBe(true)
    expect(screen.queryByTestId('rd-verdict')).toBeNull()
    expect(document.body).not.toHaveTextContent(/Rätt\.|Fel\.|Rätt svar/)
  })

  it('moves between questions on ←/→ and the register; the last one hands in, asking first', () => {
    const { actions } = mount(9, 'desktop')
    startPass()
    press('ArrowRight')
    expect(currentCell()).toBe(`rd-prov-cell-${RUN.current + 2}`)
    press('ArrowLeft')
    press('ArrowLeft')
    expect(currentCell()).toBe(`rd-prov-cell-${RUN.current}`)
    fireEvent.click(cell(40))
    expect(currentCell()).toBe('rd-prov-cell-40')
    const card = screen.getByRole('region', { name: 'Fråga 40 av 40' })
    fireEvent.click(within(card).getByRole('button', { name: 'Lämna in' }))
    const open = RUN.questions.filter((q) => RUN.answers[q.qid] == null).length
    const gate = screen.getByRole('dialog', { name: `${open} frågor är obesvarade.` })
    expect(gate).toHaveTextContent(`${fmtClock(RUN.remainingSeconds)} kvar av 55 minuter.`)
    expect(within(gate).getByTestId('rd-confirm')).toHaveTextContent('Lämna in ändå')
    fireEvent.click(within(gate).getByRole('button', { name: 'Fortsätt provet' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(actions.submitProvpass).not.toHaveBeenCalled()
    // The gate's way to the first blank question.
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    fireEvent.click(screen.getByRole('button', { name: /den första obesvarade/ }))
    expect(currentCell()).toBe(`rd-prov-cell-${RUN.current + 1}`)
    expect(actions.submitProvpass).not.toHaveBeenCalled()
  })

  it('hands in once on a confirmed Lämna in, then holds every answer still', () => {
    const { actions } = mount(9, 'desktop')
    startPass()
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    expect(actions.submitProvpass).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByTestId('rd-prov-submit')).toBeDisabled()
    expect(screen.getByText('Lämnas in …')).toBeInTheDocument()
    press('a')
    expect(choice('A')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
  })

  it('asks before Avsluta and voids: the hub comes back and says so, nothing handed in', () => {
    const { actions } = mount(9, 'desktop')
    startPass()
    // Esc never leaves a pass.
    press('Escape')
    expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-exit'))
    const gate = screen.getByRole('dialog', { name: 'Avbryter du blir provet ogiltigt.' })
    // The way back is the filled one: Avbryt loses the pass.
    expect(within(gate).getByRole('button', { name: 'Fortsätt provet' })).toHaveClass(
      'sv-btn--primary',
    )
    fireEvent.click(within(gate).getByRole('button', { name: 'Fortsätt provet' }))
    expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-exit'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
    expect(screen.getByText('Provpasset avbröts.')).toBeInTheDocument()
    expect(actions.submitProvpass).not.toHaveBeenCalled()
    expect(actions.startProvpass).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Stäng meddelandet' }))
    expect(screen.queryByText('Provpasset avbröts.')).toBeNull()
  })

  it('flags a question on its card and turns its register card’s corner', () => {
    mount(9, 'desktop')
    startPass()
    const flag = screen.getByTestId('rd-prov-flag')
    expect(flag).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(flag)
    expect(flag).toHaveAttribute('aria-pressed', 'true')
    expect(cell(RUN.current + 1)).toHaveAttribute('data-flagged', 'true')
    expect(cell(RUN.current + 1)).toHaveAccessibleName(
      `Fråga ${RUN.current + 1}, obesvarad, markerad`,
    )
  })

  it('has no flag at all where the data has none (the real runner has none)', () => {
    const { flags: _flags, ...rest } = RUN
    host(
      {
        ...D,
        provpass: {
          ...D.provpass,
          running: { ...rest, grid: rest.grid.map(({ flagged: _f, ...c }) => c) },
        },
      },
      9,
    )
    startPass()
    expect(screen.queryByTestId('rd-prov-flag')).toBeNull()
    expect(screen.getByTestId('rd-prov-grid')).not.toHaveTextContent('Markerad')
  })

  it('opens the phone register as a sheet, jumps from it and closes on Esc', () => {
    mount(9, 'phone')
    startPass()
    const button = screen.getByRole('button', { name: /Frågeregister/ })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(button)
    const sheet = screen.getByRole('dialog', { name: 'Frågorna' })
    fireEvent.click(within(sheet).getByTestId('rd-prov-cell-5'))
    expect(currentCell()).toBe('rd-prov-cell-5')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(button)
    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Frågorna' }), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('reads a verbal pass: the text as the reference card, English text marked English', () => {
    const questions = [...D.drills.reading.questions, ...D.drills.elf.questions]
    host(
      running({
        half: 'verbal',
        questions,
        grid: questions.map((q, i) => ({
          n: i + 1,
          qid: q.qid,
          section: q.section,
          answered: false,
        })),
        current: 0,
        answers: {},
        flags: [],
      }),
      9,
    )
    startPass()
    const [las] = D.drills.reading.questions
    expect(screen.getByText(las.passage?.paragraphs[0] ?? '')).toBeInTheDocument()
    expect(screen.getByText(D.copy.ovningstextBadge)).toBeInTheDocument()
    fireEvent.click(cell(D.drills.reading.questions.length + 1))
    const [elf] = D.drills.elf.questions
    const paragraph = screen.getByText(elf.passage?.paragraphs[0] ?? '')
    expect(paragraph.closest('[lang]')).toHaveAttribute('lang', 'en')
    // The Swedish controls inside an English choice stay Swedish.
    const sr = choice('A').querySelector('.sv-sr')
    expect(sr).toHaveAttribute('lang', 'sv')
    expect(sr?.closest('[lang="en"]')).not.toBeNull()
  })
})

describe('Svep, the pass clock', () => {
  afterEach(() => vi.useRealTimers())
  const at = (seconds: number) => running({ remainingSeconds: seconds })
  const timer = () => screen.getByTestId('rd-prov-timer')

  it('counts down from where the pass stands and hands it in once at the end — never a void', () => {
    vi.useFakeTimers()
    const { actions } = host(at(3), 9)
    startPass()
    expect(timer()).toHaveTextContent('00:03')
    act(() => vi.advanceTimersByTime(1000))
    expect(timer()).toHaveTextContent('00:02')
    act(() => vi.advanceTimersByTime(3000))
    expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Lämnas in …')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(5000))
    expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
    // The stage stayed on the pass: handed in, said calmly — never a void.
    expect(screen.getByTestId('rd-prov-handed')).toHaveAttribute('data-outcome', 'sent')
    expect(screen.getByRole('heading', { level: 1, name: 'Inlämnat' })).toBeInTheDocument()
    expect(screen.queryByText('Provpasset avbröts.')).toBeNull()
  })

  it('hands in once when a provider-driven countdown reaches 0, however often it renders', () => {
    const { actions, rerender } = host(at(2), 9)
    startPass()
    rerender(at(1))
    expect(timer()).toHaveTextContent('00:01')
    expect(actions.submitProvpass).not.toHaveBeenCalled()
    rerender(at(0))
    rerender(at(0))
    rerender(at(-1))
    expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
  })

  it('never gives a restored run new minutes: a provider value that jumps up is ignored', () => {
    vi.useFakeTimers()
    const { rerender } = host(at(120), 9)
    startPass()
    act(() => vi.advanceTimersByTime(30_000))
    expect(timer()).toHaveTextContent('01:30')
    rerender(at(55 * 60))
    expect(timer()).toHaveTextContent('01:30')
  })

  it('hands a pass in at once, and once, when its time ran out before it opened', () => {
    const { actions } = host(at(0), 9)
    startPass()
    expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Lämnas in …')).toBeInTheDocument()
  })

  it('says the last minutes once each, never every second', () => {
    vi.useFakeTimers()
    host(at(302), 9)
    startPass()
    const said = () => document.querySelector('.sv-run ~ .sv-sr[aria-live]')?.textContent ?? ''
    expect(said()).toBe('')
    act(() => vi.advanceTimersByTime(3000))
    expect(said()).toBe('Fem minuter kvar.')
    act(() => vi.advanceTimersByTime(10_000))
    expect(said()).toBe('Fem minuter kvar.')
  })
})

describe('Svep, a pass question that needs its picture', () => {
  const page = () =>
    within(document.querySelector('.sv-run-page') as HTMLElement).getByRole('img', {
      name: /^Underlag till uppgift/,
    })

  it.each(
    WIDTHS,
  )('cannot be answered before its page is in; a page shared by the next ones stays in (%s)', (w) => {
    mount(9, w)
    startPass()
    fireEvent.click(cell(29))
    press('a')
    expect(choice('A')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Väntar på underlaget.')).toBeInTheDocument()
    fireEvent.load(page())
    press('a')
    expect(choice('A')).toHaveAttribute('aria-pressed', 'true')
    // Question 30 is on the same page: no new load, and none needed.
    press('ArrowRight')
    press('b')
    expect(choice('B')).toHaveAttribute('aria-pressed', 'true')
    // A new page waits for its own load.
    fireEvent.click(cell(32))
    press('a')
    expect(choice('A')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.load(page())
    press('a')
    expect(choice('A')).toHaveAttribute('aria-pressed', 'true')
  })

  it('says when the page failed, stays shut and answers after another try', () => {
    mount(9, 'desktop')
    startPass()
    fireEvent.click(cell(29))
    fireEvent.error(page())
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Underlaget kunde inte laddas.')
    press('a')
    expect(choice('A')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText(/Underlaget behövs för att svara\./)).toBeInTheDocument()
    fireEvent.click(within(alert).getByRole('button', { name: 'Försök igen' }))
    expect(screen.queryByRole('alert')).toBeNull()
    press('a')
    expect(choice('A')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.load(page())
    press('a')
    expect(choice('A')).toHaveAttribute('aria-pressed', 'true')
  })

  it('counts a page the browser already holds at once', () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(2316)
    try {
      mount(9, 'desktop')
      startPass()
      fireEvent.click(cell(29))
      press('a')
      expect(choice('A')).toHaveAttribute('aria-pressed', 'true')
    } finally {
      vi.restoreAllMocks()
    }
  })

  it('cannot answer a DTK question without its page; the way on is the next question', () => {
    host(
      running({ questions: RUN.questions.map((q, i) => (i === 28 ? { ...q, figure: null } : q)) }),
      9,
    )
    startPass()
    fireEvent.click(cell(29))
    expect(screen.getByText('Underlaget saknas just nu.')).toBeInTheDocument()
    press('a')
    expect(choice('A')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Frågan kan inte besvaras utan underlaget.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Till nästa fråga' }))
    expect(currentCell()).toBe('rd-prov-cell-30')
  })

  it('waits for a quant question’s own figure too', () => {
    mount(9, 'desktop')
    startPass()
    const q = RUN.questions[20]
    expect(q.figure?.kind).toBe('svg')
    fireEvent.click(cell(21))
    press('a')
    expect(choice('A')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.load(screen.getByRole('img', { name: q.figure?.alt }))
    press('a')
    expect(choice('A')).toHaveAttribute('aria-pressed', 'true')
  })

  // Round 2: the enlarged page is a second image of the same page, and the
  // question is answered from the one on the card.

  /** Opens the enlarged page from the page's card. */
  function enlarge() {
    fireEvent.click(screen.getByRole('button', { name: /^Förstora/ }))
    return screen.getByRole('dialog', { name: /^Underlaget · uppgift/ })
  }
  const shut = (viewer: HTMLElement) =>
    fireEvent.click(within(viewer).getByRole('button', { name: 'Stäng förstoringen' }))

  it.each(
    WIDTHS,
  )('keeps the page on its card when the enlarged page is closed before it loads (%s)', (w) => {
    mount(9, w)
    startPass()
    fireEvent.click(cell(29))
    fireEvent.load(page())
    // The enlarged page opens still on its way and is closed before it loads.
    const viewer = enlarge()
    expect(within(viewer).getByRole('img', { name: /^Underlag till uppgift/ })).toBeInTheDocument()
    shut(viewer)
    expect(screen.queryByRole('dialog')).toBeNull()
    // The page on the card is in: the question answers at once.
    press('a')
    expect(choice('A')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText('Väntar på underlaget.')).toBeNull()
  })

  it('never lets the enlarged page speak for the page on the card: each keeps its own state', () => {
    mount(9, 'desktop')
    startPass()
    fireEvent.click(cell(29))
    // The enlarged page loads first; the card's page is still on its way.
    let viewer = enlarge()
    fireEvent.load(within(viewer).getByRole('img'))
    shut(viewer)
    press('a')
    expect(choice('A')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Väntar på underlaget.')).toBeInTheDocument()
    fireEvent.load(page())
    press('a')
    expect(choice('A')).toHaveAttribute('aria-pressed', 'true')
    // The enlarged page fails on its own: it says so there, and only there.
    viewer = enlarge()
    fireEvent.error(within(viewer).getByRole('img'))
    expect(within(viewer).getByRole('alert')).toHaveTextContent('Underlaget kunde inte laddas.')
    shut(viewer)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(page()).toBeInTheDocument()
    press('b')
    expect(choice('B')).toHaveAttribute('aria-pressed', 'true')
  })

  it('does not let the enlarged page mend a failed page on the card', () => {
    mount(9, 'desktop')
    startPass()
    fireEvent.click(cell(29))
    fireEvent.error(page())
    // The enlarged page is a try of its own, and its load is its own.
    const viewer = enlarge()
    fireEvent.load(within(viewer).getByRole('img'))
    shut(viewer)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Underlaget kunde inte laddas.')
    press('a')
    expect(choice('A')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText(/Underlaget behövs för att svara\./)).toBeInTheDocument()
    fireEvent.click(within(alert).getByRole('button', { name: 'Försök igen' }))
    fireEvent.load(page())
    press('a')
    expect(choice('A')).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('Svep, a pass on data that changes', () => {
  it('keeps a valid place when the questions shrink under the current one', () => {
    const { rerender } = host(D, 9)
    startPass()
    fireEvent.click(cell(40))
    rerender(running({ questions: RUN.questions.slice(0, 20), grid: RUN.grid.slice(0, 20) }))
    expect(currentCell()).toBe('rd-prov-cell-20')
    expect(screen.queryByTestId('rd-prov-cell-21')).toBeNull()
    expect(screen.getByRole('region', { name: 'Fråga 20 av 20' })).toBeInTheDocument()
  })

  it('says so when a pass has no questions; the clock and the ways out stay', () => {
    host(running({ questions: [], grid: [] }), 9)
    startPass()
    expect(screen.getByText('Frågorna kunde inte visas')).toBeInTheDocument()
    expect(screen.getByTestId('rd-prov-timer')).toBeInTheDocument()
    expect(screen.getByTestId('rd-prov-submit')).toBeEnabled()
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(
      screen.getByRole('dialog', { name: 'Avbryter du blir provet ogiltigt.' }),
    ).toBeInTheDocument()
  })

  it('starts afresh for a new sitting', () => {
    const { rerender } = host(D, 9)
    startPass()
    press('b')
    expect(cell(RUN.current + 1)).toHaveAttribute('data-answered', 'true')
    rerender(running({ passId: 'host-2025:kvant2', current: 0, answers: {} }))
    expect(currentCell()).toBe('rd-prov-cell-1')
    expect(cell(RUN.current + 1)).toHaveAttribute('data-answered', 'false')
  })
})

describe('Svep, a running pass inside the bake-off', () => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(1440)
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(848)
  })
  afterEach(() => {
    bakeoffData.patch = null
    vi.restoreAllMocks()
  })

  /** The bake-off page on Svep's Provpass screen, its selection kept as the
   *  route keeps it, every change recorded. */
  async function bakeoff(w: WidthKey) {
    const onSelect = vi.fn<(next: Partial<Selection>) => void>()
    function Page() {
      const [sel, setSel] = useState<Selection>({
        d: 'e',
        s: 9,
        w,
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
    return { onSelect, stage }
  }

  const SWITCHER_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '0', 'ArrowLeft', 'ArrowRight']

  it.each(
    WIDTHS,
  )('keeps the switcher’s keys in the pass, whatever has the focus (%s)', async (w) => {
    const { onSelect, stage } = await bakeoff(w)
    fireEvent.click(within(stage).getByTestId('rd-prov-start'))
    // The gate is the pass's own: its keys stay there too.
    for (const key of SWITCHER_KEYS) fireEvent.keyDown(within(stage).getByRole('dialog'), { key })
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.click(within(stage).getByTestId('rd-confirm'))
    // The bake-off maps the start onto the screen it is already on.
    expect(onSelect).toHaveBeenLastCalledWith({ s: 9 })
    onSelect.mockClear()
    const targets: (() => Window | Element)[] = [
      () => window,
      () => document.body,
      () => within(stage).getByTestId(`rd-prov-cell-${RUN.current + 1}`),
      () => within(stage).getByTestId('rd-prov-option-A'),
      () => within(stage).getByTestId('rd-prov-flag'),
      () => within(stage).getByTestId('rd-prov-submit'),
      () => within(stage).getByTestId('rd-exit'),
    ]
    for (const target of targets) {
      for (const key of SWITCHER_KEYS) fireEvent.keyDown(target(), { key })
    }
    expect(onSelect).not.toHaveBeenCalled()
    expect(stage).toHaveAttribute('data-screen', '9')
    expect(within(stage).getByTestId('rd-prov-running')).toBeInTheDocument()
  })

  it('turns the arrows into the pass’s own: they move between questions', async () => {
    const { onSelect, stage } = await bakeoff('desktop')
    fireEvent.click(within(stage).getByTestId('rd-prov-start'))
    fireEvent.click(within(stage).getByTestId('rd-confirm'))
    onSelect.mockClear()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(within(stage).getByTestId(`rd-prov-cell-${RUN.current + 2}`)).toHaveAttribute(
      'data-current',
      'true',
    )
    fireEvent.keyDown(within(stage).getByTestId('rd-prov-option-A'), { key: 'ArrowLeft' })
    expect(within(stage).getByTestId(`rd-prov-cell-${RUN.current + 1}`)).toHaveAttribute(
      'data-current',
      'true',
    )
    expect(onSelect).not.toHaveBeenCalled()
  })

  // Round 2: the text of a verbal pass is a scroll region of its own.

  /** The bake-off on a running verbal pass, and its text. */
  async function onText(w: WidthKey) {
    bakeoffData.patch = withVerbalRun
    const host = await bakeoff(w)
    fireEvent.click(within(host.stage).getByTestId('rd-prov-start'))
    fireEvent.click(within(host.stage).getByTestId('rd-confirm'))
    host.onSelect.mockClear()
    const text = within(host.stage).getByRole('region', { name: LAS_TITLE })
    return { ...host, text }
  }

  it.each(
    WIDTHS,
  )('leaves the arrows to the focused text: it scrolls, the question and the screen stay (%s)', async (w) => {
    const { onSelect, stage, text } = await onText(w)
    expect(currentCell()).toBe(`rd-prov-cell-${TEXT_END}`)
    act(() => text.focus())
    for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowRight']) {
      for (const shiftKey of [false, true]) {
        // Nobody takes it: the text scrolls as any scroll region does.
        expect(fireEvent.keyDown(text, { key, shiftKey })).toBe(true)
      }
    }
    // Still the first text's last question, its text still on the card.
    expect(currentCell()).toBe(`rd-prov-cell-${TEXT_END}`)
    expect(within(stage).getByText(LAS_TEXT.paragraphs[0])).toBeInTheDocument()
    expect(within(stage).queryByText(ELF_TEXT.paragraphs[0])).toBeNull()
    expect(onSelect).not.toHaveBeenCalled()
    expect(stage).toHaveAttribute('data-screen', '9')
    expect(within(stage).getByTestId('rd-prov-running')).toBeInTheDocument()
  })

  it('answers on the letters from inside the text; outside it the arrows are the pass’s', async () => {
    const { onSelect, stage, text } = await onText('desktop')
    act(() => text.focus())
    fireEvent.keyDown(text, { key: 'b' })
    expect(within(stage).getByTestId('rd-prov-option-B')).toHaveAttribute('aria-pressed', 'true')
    for (const key of ['1', '0']) expect(fireEvent.keyDown(text, { key })).toBe(false)
    act(() => text.blur())
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(currentCell()).toBe(`rd-prov-cell-${TEXT_END + 1}`)
    expect(within(stage).getByText(ELF_TEXT.paragraphs[0])).toBeInTheDocument()
    expect(onSelect).not.toHaveBeenCalled()
    expect(stage).toHaveAttribute('data-screen', '9')
  })

  it('hands the screen to the result once the pass is handed in', async () => {
    const { onSelect, stage } = await bakeoff('desktop')
    fireEvent.click(within(stage).getByTestId('rd-prov-start'))
    fireEvent.click(within(stage).getByTestId('rd-confirm'))
    fireEvent.click(within(stage).getByTestId('rd-prov-submit'))
    fireEvent.click(within(stage).getByTestId('rd-confirm'))
    expect(onSelect).toHaveBeenLastCalledWith({ s: 10 })
    expect(stage).toHaveAttribute('data-screen', '10')
    expect(await within(stage).findByTestId('rd-prov-result')).toBeInTheDocument()
    expect(within(stage).getByTestId('rd-nav-provpass')).toHaveAttribute('aria-current', 'page')
  })
})

// ── Round 3: a hand-in that does not reach the result ───────────────

/** Every switcher key, and what the switcher asks for on it from E's
 *  screen 9. */
const SWITCHER_REQUESTS: [string, Partial<Selection>][] = [
  ...DIRECTIONS.map((d, i): [string, Partial<Selection>] => [
    String(i + 1),
    { d: d.key, sbs: false },
  ]),
  ['0', { sbs: true }],
  ['ArrowLeft', { s: 8 }],
  ['ArrowRight', { s: 10 }],
]

describe('Svep, a hand-in that does not reach the result', () => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(1440)
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(848)
  })
  afterEach(() => {
    bakeoffData.patch = null
    bakeoffData.actions = null
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  /** The bake-off on Svep's Provpass screen with the host's hand-in replaced
   *  by `submit`, the pass `seconds` from its end. The switcher's requests
   *  are recorded and never followed, so the stage stays on screen 9
   *  whatever the hand-in or a key asks for, and every key can be tried on
   *  the same stage. The pass is started on a fake clock and its current
   *  question answered B. */
  async function stuck(w: WidthKey, submit: () => void, seconds = RUN.remainingSeconds) {
    const submitProvpass = vi.fn(submit)
    bakeoffData.actions = (a) => ({ ...a, submitProvpass })
    bakeoffData.patch = (d) => ({
      ...d,
      provpass: { ...d.provpass, running: { ...d.provpass.running, remainingSeconds: seconds } },
    })
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onSelect = vi.fn<(next: Partial<Selection>) => void>()
    render(
      <Redesign2026Bakeoff
        sel={{ d: 'e', s: 9, w, t: 'light', sbs: false, bare: false }}
        onSelect={onSelect}
      />,
    )
    const stage = screen.getByTestId('rb26-stage')
    await within(stage).findByTestId('rd-svep', {}, { timeout: 5000 })
    vi.useFakeTimers()
    fireEvent.click(within(stage).getByTestId('rd-prov-start'))
    fireEvent.click(within(stage).getByTestId('rd-confirm'))
    fireEvent.keyDown(window, { key: 'b' })
    expect(within(stage).getByTestId('rd-prov-option-B')).toHaveAttribute('aria-pressed', 'true')
    onSelect.mockClear()
    return { stage, onSelect, submitProvpass, errors }
  }

  /** Lämna in, confirmed. */
  function handIn(stage: HTMLElement) {
    fireEvent.click(within(stage).getByTestId('rd-prov-submit'))
    fireEvent.click(within(stage).getByTestId('rd-confirm'))
  }

  /** Ticks of the clock, a second each. */
  function tick(times: number) {
    for (let i = 0; i < times; i++) act(() => vi.advanceTimersByTime(1000))
  }

  /** Every switcher key pressed on `target`: the switcher takes each one,
   *  nothing of the pass in its way. */
  function expectSwitcherKeys(target: Element, onSelect: Mock<(next: Partial<Selection>) => void>) {
    for (const [key, next] of SWITCHER_REQUESTS) {
      onSelect.mockClear()
      expect(fireEvent.keyDown(target, { key })).toBe(false)
      expect(onSelect).toHaveBeenCalledTimes(1)
      expect(onSelect).toHaveBeenLastCalledWith(next)
    }
  }

  /** The pass is over and holds on to nothing. Every switcher key reaches
   *  the switcher from the body; the frame's doors and account are back;
   *  the card says `title` and `text`, with the focus on its heading, and
   *  the keys reach the switcher from there too; no key scope is left; the
   *  answers read as handed in, question by question, and cannot change;
   *  nothing can hand the pass in again. Then the way back asks for
   *  Provpass and opens the hub. */
  function expectReleased(
    stage: HTMLElement,
    onSelect: Mock<(next: Partial<Selection>) => void>,
    outcome: 'failed' | 'sent',
    title: string,
    text: RegExp,
  ) {
    expectSwitcherKeys(document.body, onSelect)
    expect(within(stage).queryByTestId('rd-prov-running')).toBeNull()
    const handed = within(stage).getByTestId('rd-prov-handed')
    expect(handed).toHaveAttribute('data-outcome', outcome)
    for (const d of DESTINATIONS) {
      expect(within(stage).getByTestId(`rd-nav-${d.id}`)).toBeInTheDocument()
    }
    expect(within(stage).getByTestId('rd-account')).toBeInTheDocument()
    const heading = within(handed).getByRole('heading', { level: 1, name: title })
    expect(heading).toHaveFocus()
    expect(handed).toHaveTextContent(text)
    expect(within(handed).getByRole(outcome === 'failed' ? 'alert' : 'status')).toContainElement(
      heading,
    )
    expectSwitcherKeys(heading, onSelect)
    expect(stage.querySelector('[data-rd-keyscope]')).toBeNull()

    // The answers as handed in: readable, never changeable.
    const chosen = within(stage).getByTestId('rd-prov-option-B')
    expect(chosen).toHaveAttribute('aria-pressed', 'true')
    expect(chosen).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(within(stage).getByTestId('rd-prov-option-C'))
    expect(fireEvent.keyDown(document.body, { key: 'c' })).toBe(true)
    expect(chosen).toHaveAttribute('aria-pressed', 'true')
    expect(within(stage).getByTestId('rd-prov-option-C')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(within(stage).getByTestId('rd-prov-cell-1'))
    const first = within(stage).getByRole('region', {
      name: `Fråga 1 av ${RUN.questions.length}`,
    })
    for (const option of within(first).getAllByRole('button', { name: /^Alternativ/ })) {
      expect(option).toHaveAttribute('aria-disabled', 'true')
    }
    // Nothing hands it in again.
    expect(within(stage).queryByTestId('rd-prov-submit')).toBeNull()
    expect(within(stage).queryByRole('button', { name: /Lämna in/ })).toBeNull()
    expect(within(stage).queryByTestId('rd-prov-timer')).toBeNull()

    onSelect.mockClear()
    fireEvent.click(within(stage).getByTestId('rd-exit'))
    expect(onSelect).toHaveBeenLastCalledWith({ s: 9 })
    expect(within(stage).queryByTestId('rd-prov-handed')).toBeNull()
    expect(within(stage).getByTestId('rd-prov-start')).toBeInTheDocument()
    expect(within(stage).getByTestId('rd-nav-provpass')).toHaveAttribute('aria-current', 'page')
  }

  it.each(
    WIDTHS,
  )('says so when Lämna in fails, keeps the answers read-only and lets go of the keys (%s)', async (w) => {
    const failure = new Error('Nätet svarar inte.')
    const { stage, onSelect, submitProvpass, errors } = await stuck(w, () => {
      throw failure
    })
    handIn(stage)
    expect(submitProvpass).toHaveBeenCalledTimes(1)
    expectReleased(
      stage,
      onSelect,
      'failed',
      'Provpasset kunde inte lämnas in',
      /Något gick fel när passet skulle lämnas in\. Svaren står kvar/,
    )
    // Logged for whoever runs the host, never swallowed.
    expect(errors).toHaveBeenCalledWith(expect.any(String), failure)
    tick(10)
    expect(submitProvpass).toHaveBeenCalledTimes(1)
  })

  it.each(
    WIDTHS,
  )('says so when the clock’s hand-in fails, and never tries again on a later tick (%s)', async (w) => {
    const { stage, onSelect, submitProvpass, errors } = await stuck(
      w,
      () => {
        throw new Error('Nätet svarar inte.')
      },
      3,
    )
    tick(4)
    expect(submitProvpass).toHaveBeenCalledTimes(1)
    tick(6)
    expect(submitProvpass).toHaveBeenCalledTimes(1)
    expectReleased(
      stage,
      onSelect,
      'failed',
      'Provpasset kunde inte lämnas in',
      /Tiden tog slut, men passet kunde inte lämnas in\. Svaren står kvar/,
    )
    expect(errors).toHaveBeenCalledWith(expect.any(String), expect.any(Error))
    tick(6)
    expect(submitProvpass).toHaveBeenCalledTimes(1)
  })

  it.each(
    WIDTHS,
  )('says Inlämnat when Lämna in returns but the stage stays on the pass (%s)', async (w) => {
    const { stage, onSelect, submitProvpass } = await stuck(w, () => {})
    handIn(stage)
    expect(submitProvpass).toHaveBeenCalledTimes(1)
    // The host has a moment to show the result: until then it is on its way.
    expect(within(stage).getByTestId('rd-prov-running')).toBeInTheDocument()
    expect(within(stage).getByText('Lämnas in …')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(SETTLE_MS))
    expectReleased(stage, onSelect, 'sent', 'Inlämnat', /Provpasset är inlämnat\./)
    tick(10)
    expect(submitProvpass).toHaveBeenCalledTimes(1)
  })

  it.each(
    WIDTHS,
  )('says Inlämnat when the clock’s hand-in returns and the stage stays, however long it ticks (%s)', async (w) => {
    const { stage, onSelect, submitProvpass } = await stuck(w, () => {}, 2)
    tick(3)
    expect(submitProvpass).toHaveBeenCalledTimes(1)
    tick(8)
    expect(submitProvpass).toHaveBeenCalledTimes(1)
    expectReleased(
      stage,
      onSelect,
      'sent',
      'Inlämnat',
      /Tiden tog slut och provpasset är inlämnat\./,
    )
    tick(8)
    expect(submitProvpass).toHaveBeenCalledTimes(1)
  })
})

// ── Batch 2: Provpassresultat ────────────────────────────────────────

/** The fixtures with the handed-in pass changed. */
const result = (patch: Partial<typeof RESULT>): DirectionData => ({
  ...D,
  provpass: { ...D.provpass, result: { ...RESULT, ...patch } },
})

describe('Svep, Provpassresultat', () => {
  it('leads with the outcome and how its score was read; the one next step is the weak section', () => {
    const { actions } = mount(10, 'desktop')
    expect(front('res')).toBe('oversikt')
    expect(screen.getByTestId('rd-prov-result')).toHaveTextContent(
      new RegExp(`${RESULT.correct}\\s*av ${RESULT.presented} rätt`),
    )
    const score = screen.getByTestId('rd-prov-score')
    expect(score).toHaveTextContent((RESULT.score.value ?? 0).toFixed(2).replace('.', ','))
    expect(score).toHaveTextContent(RESULT.score.label)
    expect(score).toHaveTextContent('Härlett ur UHR:s normeringstabell för detta provtillfälle.')
    expect(
      screen.getByText(
        `${RESULT.answered} besvarade · ${RESULT.presented - RESULT.answered} obesvarade`,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`Du hade sett ${RESULT.seenBefore} av ${RESULT.presented}`)),
    ).toBeInTheDocument()
    const filled = document.querySelectorAll('.sv-btn--primary')
    expect(filled).toHaveLength(1)
    expect(filled[0]).toHaveTextContent('Öva XYZ')
    fireEvent.click(filled[0])
    expect(actions.startDrill).toHaveBeenCalledWith({ kind: 'section', section: 'XYZ' })
  })

  it('takes the card in front on Enter, once — a held key does not', () => {
    const { actions } = mount(10, 'desktop')
    fireEvent.keyDown(window, { key: 'Enter', repeat: true })
    expect(actions.startDrill).not.toHaveBeenCalled()
    press('Enter')
    expect(actions.startDrill).toHaveBeenCalledTimes(1)
  })

  it('reads each section, the time against its share, the misses and the earlier passes', () => {
    const { actions } = mount(10, 'desktop')
    expect(cardsOf('res')).toEqual(['oversikt', 'delprov', 'tempo', 'missar', 'tidigare'])
    const register = within(screen.getByRole('navigation', { name: 'Resultatets kort' }))
    fireEvent.click(register.getByRole('button', { name: /Tempo/ }))
    expect(front('res')).toBe('tempo')
    const tempo = document.querySelector('[data-card="tempo"]') as HTMLElement
    for (const s of RESULT.sections) {
      expect(tempo).toHaveTextContent(`${fmtClock(s.timeSeconds)} av ${fmtClock(s.quotaSeconds)}`)
    }
    const misses = document.querySelector('[data-card="missar"]') as HTMLElement
    expect(misses).toHaveTextContent(`${RESULT.missed.length} frågor fel eller obesvarade`)
    expect(misses).toHaveTextContent('2 · 5 · 9 · 11')
    const first = within(screen.getByTestId('rd-prov-history-item-1')).getByRole('button')
    fireEvent.click(first)
    expect(actions.openProvResult).toHaveBeenCalledWith(RESULT.history[0].id)
  })

  it('says what the bank lacks and what was left blank, apart', () => {
    host(result({ presented: 38, answered: 35, correct: 25 }), 10)
    expect(screen.getByText('2 frågor saknas ur detta pass — rättat av 38.')).toBeInTheDocument()
    expect(screen.getByText('35 besvarade · 3 obesvarade')).toBeInTheDocument()
  })

  it('calls a linear score an estimate', () => {
    host(result({ score: { value: 1.35, derived: 'linear', label: 'skattad' } }), 10)
    const score = screen.getByTestId('rd-prov-score')
    expect(score).toHaveTextContent('1,35')
    expect(score).toHaveTextContent('skattad')
    expect(score).toHaveTextContent('Linjär skattning — indikativ, inte UHR-normerad.')
  })

  it('makes no claim when nothing was answered: the next step is Framsteg', () => {
    const { actions } = host(
      result({
        answered: 0,
        correct: 0,
        sections: RESULT.sections.map((s) => ({ ...s, correct: 0 })),
      }),
      10,
    )
    expect(screen.getByText('Inga svar lämnades in i passet.')).toBeInTheDocument()
    const filled = document.querySelectorAll('.sv-btn--primary')
    expect(filled[0]).toHaveTextContent('Till Framsteg')
    fireEvent.click(filled[0])
    expect(actions.go).toHaveBeenCalledWith('framsteg')
  })

  it('leaves out a card it has nothing for', () => {
    host(
      result({ history: [], sections: RESULT.sections.map((s) => ({ ...s, timeSeconds: 0 })) }),
      10,
    )
    expect(cardsOf('res')).toEqual(['oversikt', 'delprov', 'missar'])
    expect(screen.queryByTestId('rd-prov-history')).toBeNull()
  })

  it('goes back to the hub without a clock', () => {
    const { actions } = mount(10, 'desktop')
    fireEvent.click(screen.getByRole('button', { name: 'Till Provpass' }))
    expect(actions.go).toHaveBeenCalledWith('provpass')
    expect(actions.startProvpass).not.toHaveBeenCalled()
    expect(screen.getByTestId('rd-prov-half-kvant')).toBeInTheDocument()
  })
})

// ── Batch 2: Framsteg and Historik ───────────────────────────────────

/** The fixtures with Framsteg changed. */
const framsteg = (patch: Partial<typeof F>): DirectionData => ({
  ...D,
  framsteg: { ...F, ...patch },
})

describe('Svep, Framsteg', () => {
  it('leads with the prognosis, its caveat and the weeks in a table; one next step', () => {
    const { actions } = mount(11, 'desktop')
    expect(front('fs')).toBe('oversikt')
    expect(cardsOf('fs')).toEqual(['oversikt', 'delprov', 'narvaro', 'fokus', 'historik'])
    const p = screen.getByTestId('rd-framsteg-prognosis')
    expect(p).toHaveTextContent(fmtScore(F.prognosis.total ?? 0))
    expect(screen.getAllByText(F.prognosis.caveat ?? '').length).toBeGreaterThan(0)
    const table = within(p).getByRole('table', { name: /Vecka för vecka/ })
    expect(within(table).getAllByRole('row')).toHaveLength(F.weekly.length + 1)
    const filled = document.querySelectorAll('.sv-btn--primary')
    expect(filled).toHaveLength(1)
    expect(filled[0]).toHaveTextContent(`Öva ${F.focus[0]}`)
    press('Enter')
    expect(actions.startDrill).toHaveBeenCalledWith({ kind: 'section', section: F.focus[0] })
  })

  it('lists every section with its estimate; one not practised says so, never a zero', () => {
    const sections = F.sections.map((s) =>
      s.section === 'MEK' ? { ...s, score: null, band: null, attempts90d: 0 } : s,
    )
    host(framsteg({ sections }), 11)
    const mek = screen.getByTestId('rd-framsteg-section-mek')
    expect(mek).toHaveTextContent('Inte övat än')
    expect(mek).not.toHaveTextContent('0,0')
    const xyz = F.sections.find((s) => s.section === 'XYZ')
    if (!xyz || xyz.score == null) throw new Error('the fixture scores XYZ')
    const row = screen.getByTestId('rd-framsteg-section-xyz')
    expect(row).toHaveTextContent(fmtScore(xyz.score))
    expect(row).toHaveTextContent(`${xyz.attempts90d} svar`)
  })

  it('on day zero shows no estimate and no zero — the way to Öva', () => {
    const { actions } = host(
      framsteg({
        prognosis: { ...F.prognosis, total: null, verbal: null, quant: null },
        focus: [],
      }),
      11,
    )
    expect(screen.getByTestId('rd-framsteg-prognosis')).toHaveTextContent('Ingen prognos än')
    expect(cardsOf('fs')).not.toContain('fokus')
    const filled = document.querySelectorAll('.sv-btn--primary')
    expect(filled[0]).toHaveTextContent('Till Öva')
    press('Enter')
    expect(actions.go).toHaveBeenCalledWith('ova')
  })

  it('shows the week in plain numbers and every day as a cell of a table', () => {
    mount(11, 'desktop')
    const week = screen.getByTestId('rd-framsteg-week')
    expect(week).toHaveTextContent(new RegExp(`${F.week.streakDays}\\s*dagar i rad`))
    const heat = within(week).getByRole('table')
    expect(heat.querySelectorAll('td[data-level]')).toHaveLength(F.days.length)
    const last = F.days[F.days.length - 1]
    expect(within(heat).getAllByText(new RegExp(`: ${last.n} svar$`)).length).toBeGreaterThan(0)
  })

  it('keeps Historik as its own card, its finished passes as dated rows', () => {
    mount(11, 'desktop')
    const history = screen.getByTestId('rd-framsteg-history')
    F.history.forEach((h, i) => {
      const row = within(history).getByTestId(`rd-framsteg-history-item-${i + 1}`)
      expect(row).toHaveTextContent(h.when)
      expect(within(row).getByRole('img')).toHaveAccessibleName(`${h.correct} av ${h.total} rätt`)
    })
  })

  it('keeps Historik with an empty journal, which says so and leads to Öva', () => {
    const { actions } = host(framsteg({ history: [] }), 11)
    expect(cardsOf('fs')).toContain('historik')
    const history = screen.getByTestId('rd-framsteg-history')
    expect(history).toHaveTextContent('Inga avslutade pass än. Kör en övning så landar den här.')
    const index = within(screen.getByRole('navigation', { name: 'Kortregister' }))
    fireEvent.click(index.getByRole('button', { name: /Historik/ }))
    press('Enter')
    expect(actions.go).toHaveBeenCalledWith('ova')
  })

  it('opens Historik from its door, and the next focus and the journal lead where they say', () => {
    const { actions } = mount(11, 'desktop')
    fireEvent.click(screen.getByRole('button', { name: /avslutade pass/ }))
    expect(front('fs')).toBe('historik')
    fireEvent.click(
      within(document.querySelector('[data-card="historik"]') as HTMLElement).getByRole('button', {
        name: 'Till Provpass',
      }),
    )
    expect(actions.go).toHaveBeenCalledWith('provpass')
  })

  it('leads from the next focus to its practice and to Repetera', () => {
    const { actions } = mount(11, 'desktop')
    const index = within(screen.getByRole('navigation', { name: 'Kortregister' }))
    fireEvent.click(index.getByRole('button', { name: /Nästa fokus/ }))
    expect(front('fs')).toBe('fokus')
    const card = within(document.querySelector('[data-card="fokus"]') as HTMLElement)
    fireEvent.click(card.getByRole('button', { name: new RegExp(`Öva ${F.focus[1]}`) }))
    expect(actions.startDrill).toHaveBeenCalledWith({ kind: 'section', section: F.focus[1] })
    fireEvent.click(card.getByRole('button', { name: 'Till Repetera' }))
    expect(actions.openRepetera).toHaveBeenCalled()
  })

  it('opens Översikt and Historik with the phone’s two tabs', () => {
    mount(11, 'phone')
    const tabs = within(screen.getByRole('group', { name: 'Visa' }))
    fireEvent.click(tabs.getByRole('button', { name: 'Historik' }))
    expect(front('fs')).toBe('historik')
    expect(tabs.getByRole('button', { name: 'Historik' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(tabs.getByRole('button', { name: 'Översikt' }))
    expect(front('fs')).toBe('oversikt')
  })

  it('opens at the card Idag’s links ask for: the recent passes at Historik, the estimate at Översikt', () => {
    const { actions, goTo } = mount(1, 'desktop')
    press('End')
    fireEvent.click(screen.getByRole('button', { name: /Alla pass i Framsteg/ }))
    expect(actions.go).toHaveBeenCalledWith('framsteg')
    expect(front('fs')).toBe('historik')
    goTo(4)
    goTo(1)
    const index = within(screen.getByRole('navigation', { name: 'Kortregister' }))
    fireEvent.click(index.getByRole('button', { name: /Prognos/ }))
    fireEvent.click(screen.getByRole('button', { name: /Prognosen i Framsteg/ }))
    expect(front('fs')).toBe('oversikt')
  })

  it('keeps the card in front when a card before it goes', () => {
    const { rerender } = host(D, 11)
    const index = within(screen.getByRole('navigation', { name: 'Kortregister' }))
    fireEvent.click(index.getByRole('button', { name: /Historik/ }))
    rerender(framsteg({ focus: [] }))
    expect(cardsOf('fs')).toEqual(['oversikt', 'delprov', 'narvaro', 'historik'])
    expect(front('fs')).toBe('historik')
  })
})

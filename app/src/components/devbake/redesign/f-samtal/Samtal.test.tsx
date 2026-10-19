// F · Samtal against the round-1 bake-off contract (the rd-* test ids the
// shared suite in ../Redesign2026Bakeoff.test.tsx drives), at both widths:
// every screen renders, Idag has one resume action, the five doors, the
// account and the caveat; the drill shows the badge outside the passage,
// nine paragraphs and the note on demand; answering grades; Facit shows
// the verdict, a detail step on demand, technique, pitfall, every
// distractor and ¶ links; Nästa moves on; Navigering opens the account
// with a working theme switch. Plus what is Samtal's own: the plan as a
// reply on Idag, "Visa allt" opening every fold at once, the phone reply
// tray, the keys, and the unit's end proposing the plan's next part. And
// the phone tray keeps the reader's place: opening and folding it never
// moves the passage, and a ¶ link's way back finds the explanation as it
// was left (round 2, review hpf-xt77 R1 and R2).

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  ESTIMATE_CAVEAT,
  EXPLANATIONS,
  OVNINGSTEXT_NOTE,
  PLAN,
  UNIT,
} from '@/components/devbake/redesign/r1Fixtures'
import {
  DESTINATIONS,
  type DirectionProps,
  type ScreenKey,
  type ThemeKey,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
// Not imported as `meta`: Vite's SSR transform would then rewrite the
// `meta` of `import.meta` (used below) as well, and fail.
import { meta as entry } from './meta'
import { Samtal } from './Samtal'

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
const SCREENS: ScreenKey[] = [1, 2, 3, 4]
const THEMES: ThemeKey[] = ['light', 'dark']

const Q3 = UNIT.questions[2]
const Q4 = UNIT.questions[3]
const E3 = EXPLANATIONS[Q3.qid]
const DETAIL = (E3.steps ?? []).find((s) => s.tier === 'detail')
if (!DETAIL) throw new Error('fixture question 3 must have a detail-tier step')

function mount(
  screenKey: ScreenKey,
  width: WidthKey,
  { theme = 'light', live = true }: { theme?: ThemeKey; live?: boolean } = {},
) {
  const onScreen = vi.fn()
  const onTheme = vi.fn()
  const props = (s: ScreenKey): DirectionProps => ({
    screen: s,
    width,
    theme,
    live,
    onScreen,
    onTheme,
  })
  const utils = render(<Samtal {...props(screenKey)} />)
  return {
    onScreen,
    onTheme,
    /** What the bake-off stage does when a direction asks for a screen. */
    goTo: (s: ScreenKey) => utils.rerender(<Samtal {...props(s)} />),
  }
}

/** The phone tray starts at its peek: open it if the options are not on
 *  screen yet (the first collapsed toggle inside the tray). */
function revealOptions() {
  if (screen.queryByTestId('rd-option-A')) return
  const tray = screen.getByTestId('rd-sheet')
  const toggle = tray.querySelector<HTMLElement>('[aria-expanded="false"]')
  if (!toggle) throw new Error('no way to open the reply tray')
  fireEvent.click(toggle)
}

function visible(el: HTMLElement | null): boolean {
  return el != null && !el.hidden && el.closest('[hidden]') == null
}

function key(k: string, init: KeyboardEventInit = {}) {
  fireEvent.keyDown(window, { key: k, ...init })
}

describe('F · Samtal meta', () => {
  it('is built: no stub flag, Swedish traits, risk and references', () => {
    expect(entry.key).toBe('f')
    expect(entry.slug).toBe('f-samtal')
    expect(entry.name).toBe('Samtal')
    expect(entry.stub).toBeUndefined()
    expect(entry.traits.length).toBeGreaterThanOrEqual(4)
    expect(entry.risk).toMatch(/^Risk: /)
    expect(entry.references).not.toBe('')
  })
})

describe.each(WIDTHS)('F · Samtal, %s', (width) => {
  it.each(
    SCREENS.flatMap((s) => THEMES.map((t) => [s, t] as const)),
  )('renders screen %s in %s without errors, live and as a still', (s, t) => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    for (const live of [true, false]) {
      const { unmount } = render(
        <Samtal
          screen={s}
          width={width}
          theme={t}
          live={live}
          onScreen={() => {}}
          onTheme={() => {}}
        />,
      )
      const root = screen.getByTestId('rd-samtal')
      expect(root).toHaveAttribute('data-rd', 'samtal')
      expect(root).toHaveAttribute('data-theme', t)
      expect(root).toHaveAttribute('data-width', width)
      expect(root).toHaveAttribute('lang', 'sv')
      if (s === 1 || s === 4) {
        for (const d of DESTINATIONS) {
          expect(screen.getByTestId(`rd-nav-${d.id}`)).toBeInTheDocument()
        }
        expect(screen.getByTestId('rd-account')).toBeInTheDocument()
      } else {
        expect(screen.getByTestId('rd-exit')).toBeInTheDocument()
        expect(screen.getByTestId('rd-passage')).toBeInTheDocument()
        expect(screen.getByTestId('rd-badge')).toBeInTheDocument()
      }
      if (s === 3) expect(screen.getByTestId('rd-verdict')).toBeInTheDocument()
      if (s === 4) expect(screen.getByTestId('rd-account-menu')).toBeInTheDocument()
      unmount()
    }
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })

  it('Idag: one resume action, the five doors, the account entry and the caveat', () => {
    const { onScreen } = mount(1, width)
    expect(screen.getByTestId('rd-samtal')).toBeInTheDocument()
    for (const d of DESTINATIONS) expect(screen.getByTestId(`rd-nav-${d.id}`)).toBeInTheDocument()
    expect(screen.getByTestId('rd-nav-idag')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('rd-account')).toBeInTheDocument()
    expect(screen.getAllByText(ESTIMATE_CAVEAT).length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('rd-resume')).toHaveLength(1)
    fireEvent.click(screen.getByTestId('rd-resume'))
    expect(onScreen).toHaveBeenCalledWith(2)
  })

  it('Idag: the coach asks one question and Enter answers it', () => {
    const { onScreen } = mount(1, width)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Du var mitt i LÄS, fråga\s3 av\s4\. Fortsätta\?/,
    )
    key('Enter')
    expect(onScreen).toHaveBeenCalledWith(2)
  })

  it('Idag: "Visa dagens plan" becomes your turn and the coach answers with the plan', () => {
    const { onScreen } = mount(1, width)
    // Before: the plan is a compact card below the conversation.
    expect(screen.getByRole('heading', { name: 'Dagens plan' })).toBeInTheDocument()
    expect(screen.queryByText(PLAN.items[1].rationale)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Visa dagens plan' }))
    // Your turn, then the coach's answer with every part's reason.
    expect(screen.getByText('Visa dagens plan', { selector: 'p' })).toBeInTheDocument()
    for (const item of PLAN.items) expect(screen.getByText(item.rationale)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dagens plan' })).toBeNull()
    // Still exactly one resume action, now worded for the plan's context.
    const resume = screen.getAllByTestId('rd-resume')
    expect(resume).toHaveLength(1)
    expect(resume[0]).toHaveTextContent('Fortsätt med texten')
    fireEvent.click(resume[0])
    expect(onScreen).toHaveBeenCalledWith(2)
  })

  it('Idag: a door opens its page, which offers the way back', () => {
    mount(1, width)
    fireEvent.click(screen.getByTestId('rd-nav-provpass'))
    expect(screen.getByTestId('rd-nav-provpass')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { level: 1, name: 'Provpass' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tillbaka till Idag' }))
    expect(screen.getByTestId('rd-nav-idag')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('rd-resume')).toBeInTheDocument()
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

  it('Läsfråga: the question is a coach turn and the options are replies', () => {
    mount(2, width)
    revealOptions()
    expect(screen.getByRole('heading', { level: 2, name: Q3.prompt })).toBeInTheDocument()
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    for (const o of Q3.options) {
      expect(screen.getByTestId(`rd-option-${o.letter}`)).toHaveAttribute('aria-pressed', 'false')
    }
  })

  it('Läsfråga: choosing, striking and answering grades the question', () => {
    const { onScreen, goTo } = mount(2, width)
    revealOptions()
    for (const l of ['A', 'B', 'C', 'D']) {
      expect(screen.getByTestId(`rd-option-${l}`)).toBeInTheDocument()
    }
    fireEvent.click(screen.getByTestId('rd-eliminate-B'))
    expect(screen.getByTestId('rd-eliminate-B')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByTestId('rd-option-A'))
    expect(screen.getByTestId('rd-option-A')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(onScreen).toHaveBeenCalledWith(3)
    goTo(3)
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
  })

  it('Läsfråga: A–D choose, ⇧ strikes, Enter answers, Esc stays in the drill', () => {
    const { onScreen, goTo } = mount(2, width)
    revealOptions()
    key('d')
    expect(screen.getByTestId('rd-option-D')).toHaveAttribute('aria-pressed', 'true')
    key('B', { shiftKey: true })
    expect(screen.getByTestId('rd-eliminate-B')).toHaveAttribute('aria-pressed', 'true')
    key('Escape')
    expect(onScreen).not.toHaveBeenCalledWith(1)
    key('Enter')
    expect(onScreen).toHaveBeenCalledWith(3)
    goTo(3)
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'true')
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
    expect(picked.getByText(E3.distractors[0].why_wrong)).toBeInTheDocument()
    expect(screen.getAllByTestId('rd-cite-6').length).toBeGreaterThan(0)
  })

  it('Facit: the turns keep the shared content order', () => {
    mount(3, width)
    const order = [
      screen.getByTestId('rd-verdict'),
      screen.getByTestId('rd-distractor-A'),
      screen.getByTestId('rd-pitfall'),
      screen.getByTestId('rd-technique'),
      screen.getByText(E3.solution_path),
      screen.getByTestId('rd-step-1'),
      screen.getByTestId('rd-distractor-B'),
    ]
    for (let i = 1; i < order.length; i++) {
      expect(
        order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    }
    expect(screen.getByRole('heading', { name: 'Vad lockade dig med A?' })).toBeInTheDocument()
  })

  it('Facit: the coach asks what tempted you; a reply becomes your turn, and nothing waits on it', () => {
    mount(3, width)
    const lure = within(screen.getByTestId('rd-distractor-A'))
    // The coach's own answer is there before any reply: the question never blocks.
    expect(lure.getByText(E3.distractors[0].why_tempting)).toBeInTheDocument()
    const reply = lure.getByRole('button', { name: 'Orden liknade texten' })
    fireEvent.click(reply)
    expect(lure.getByText('Orden liknade texten', { selector: 'p' })).toBeInTheDocument()
    expect(lure.queryByRole('button', { name: 'Hoppa över' })).toBeNull()
    expect(lure.getByText(E3.distractors[0].why_tempting)).toBeInTheDocument()
  })

  it('Facit: the question can be skipped without a trace', () => {
    mount(3, width)
    const lure = within(screen.getByTestId('rd-distractor-A'))
    fireEvent.click(lure.getByRole('button', { name: 'Hoppa över' }))
    expect(lure.queryByRole('button', { name: 'Det lät rimligt' })).toBeNull()
    expect(lure.queryByText('Det lät rimligt')).toBeNull()
  })

  it('Facit: "Visa allt" opens every fold at once, and closes them again', () => {
    mount(3, width)
    // A why_wrong may carry a "(steg N)" link, so read the option's text.
    const others = E3.distractors.filter((d) => d.letter !== 'A')
    const option = (letter: string) => screen.getByTestId(`rd-distractor-${letter}`)
    expect(screen.queryByText(DETAIL.text)).toBeNull()
    for (const d of others) expect(option(d.letter)).not.toHaveTextContent(d.why_wrong)
    fireEvent.click(screen.getByRole('button', { name: 'Visa allt' }))
    expect(screen.getByText(DETAIL.text)).toBeInTheDocument()
    for (const d of others) expect(option(d.letter)).toHaveTextContent(d.why_wrong)
    fireEvent.click(screen.getByRole('button', { name: 'Visa mindre' }))
    expect(screen.queryByText(DETAIL.text)).toBeNull()
    for (const d of others) expect(option(d.letter)).not.toHaveTextContent(d.why_wrong)
  })

  it('Facit: a ¶ link lights the sentence its step quotes, then lets go', () => {
    vi.useFakeTimers()
    try {
      mount(3, width)
      const para = screen.getByTestId('rd-para-6')
      expect(para).toHaveAttribute('data-cited', 'true')
      expect(para.querySelector('mark[data-flash="true"]')).toBeNull()
      // Step 2 quotes ¶6: its link lights the quoted sentence itself.
      fireEvent.click(screen.getAllByTestId('rd-cite-6')[0])
      expect(
        screen.getByTestId('rd-para-6').querySelector('mark[data-flash="true"]'),
      ).not.toBeNull()
      if (width === 'phone') {
        // The tray folds so the cited paragraph shows.
        expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'peek')
      }
      act(() => {
        vi.advanceTimersByTime(3000)
      })
      expect(screen.getByTestId('rd-para-6').querySelector('mark[data-flash="true"]')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('Facit: Nästa moves on to question 4', () => {
    const { onScreen, goTo } = mount(3, width)
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(onScreen).toHaveBeenCalledWith(2)
    goTo(2)
    expect(screen.getAllByText(Q4.prompt).length).toBeGreaterThan(0)
  })

  it('the last question ends the unit, and the coach proposes the plan’s next part', () => {
    const { onScreen, goTo } = mount(3, width)
    fireEvent.click(screen.getByTestId('rd-next'))
    goTo(2)
    revealOptions()
    fireEvent.click(screen.getByTestId(`rd-option-${Q4.answer}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
    goTo(3)
    expect(screen.getByTestId('rd-next')).toHaveTextContent('Slutför texten')
    fireEvent.click(screen.getByTestId('rd-next'))
    const done = screen.getByTestId('rd-done')
    expect(done).toHaveTextContent(`${UNIT.questions.length} frågor`)
    expect(screen.getByTestId('rd-done-next')).toHaveTextContent(PLAN.items[0].title.toLowerCase())
    // The plan's next part opens its door (Öva for the repetition).
    fireEvent.click(screen.getByTestId('rd-done-next'))
    expect(onScreen).toHaveBeenLastCalledWith(1)
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

describe('F · Samtal, desktop only', () => {
  it('Navigering folds the list into a rail of round doors; the collapse button unfolds it', () => {
    mount(4, 'desktop')
    const collapse = screen.getByTestId('rd-collapse')
    expect(collapse).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByTestId('rd-nav-ova')).toHaveAccessibleName(/^Öva, \d+ att repetera$/)
    fireEvent.click(collapse)
    expect(screen.getByTestId('rd-collapse')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('rd-nav-ova')).toHaveTextContent(/missar att repetera/)
  })

  it('Idag lists the doors as conversations, each with what waits there', () => {
    mount(1, 'desktop')
    expect(screen.getByTestId('rd-nav-idag')).toHaveTextContent('Fortsätt LÄS, fråga 3 av 4')
    expect(screen.getByTestId('rd-nav-framsteg')).toHaveTextContent('Prognos 1,4 av 2,0')
  })
})

describe('F · Samtal, phone only', () => {
  it('the reply tray peeks with the question, opens to the replies and folds back', () => {
    mount(2, 'phone')
    const tray = screen.getByTestId('rd-sheet')
    expect(within(tray).getByText(Q3.prompt)).toBeInTheDocument()
    expect(screen.queryByTestId('rd-option-A')).toBeNull()
    fireEvent.click(within(tray).getByRole('button', { name: /Välj ett svar/ }))
    expect(tray).toHaveAttribute('data-state', 'open')
    expect(screen.getByTestId('rd-option-A')).toBeInTheDocument()
    // The labelled reply, not the grab (which shares its name for pointers).
    fireEvent.click(within(tray).getByText('Visa texten'))
    expect(tray).toHaveAttribute('data-state', 'peek')
  })

  it('Facit opens the tray full; the passage under it is inert', () => {
    mount(3, 'phone')
    expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'full')
    expect(screen.getByTestId('rd-passage').closest('[inert]')).not.toBeNull()
  })
})

// ── The phone tray keeps the reader's place ──────────────────────────

const HERE = path.dirname(fileURLToPath(import.meta.url))
/** The reply chips under "Vad lockade dig med A?". */
const LURE_REPLIES = ['Orden liknade texten', 'Det lät rimligt', 'Jag chansade']

/**
 * The phone passage's scroll range. jsdom lays nothing out, so this stands
 * in for the one browser rule at stake: the passage scrolls over its text
 * plus the spacer under it (its height from samtal.css), and when that
 * range shrinks, a reader near its end is pulled back inside it.
 */
function passageScroll() {
  const pdoc = screen.getByTestId('rd-passage').closest<HTMLElement>('.sa-pdoc')
  const spacer = pdoc?.querySelector<HTMLElement>('.sa-pdoc-spacer')
  if (!pdoc || !spacer) throw new Error('no scrolling passage on the phone')
  // The passage's own height, and the phone's view of it (844 less the head).
  const TEXT = 2400
  const VIEW = 788
  const extent = () => getComputedStyle(spacer).height
  /** Lays the passage out: the end of its range, the reader kept inside. */
  const settle = () => {
    const end = TEXT + Number.parseFloat(extent()) - VIEW
    pdoc.scrollTop = Math.min(pdoc.scrollTop, end)
    return end
  }
  return { pdoc, extent, settle }
}

describe('F · Samtal, phone: the reply tray never moves the passage', () => {
  // Vitest leaves CSS out (css: false): load Samtal's own sheet so the
  // spacer under the passage has the height a browser gives it.
  const sheet = document.createElement('style')
  beforeAll(() => {
    sheet.textContent = readFileSync(path.join(HERE, 'samtal.css'), 'utf8')
    document.head.appendChild(sheet)
  })
  afterAll(() => sheet.remove())

  it('Läsfråga: at the end of the text, opening the tray and folding it leaves the reader there', () => {
    mount(2, 'phone')
    const tray = screen.getByTestId('rd-sheet')
    const p = passageScroll()
    const peek = p.extent()
    expect(Number.parseFloat(peek)).toBeGreaterThan(0)
    p.pdoc.scrollTop = p.settle()
    const end = p.pdoc.scrollTop
    fireEvent.click(within(tray).getByRole('button', { name: /Välj ett svar/ }))
    expect(tray).toHaveAttribute('data-state', 'open')
    p.settle()
    const open = p.extent()
    fireEvent.click(within(tray).getByText('Visa texten'))
    expect(tray).toHaveAttribute('data-state', 'peek')
    p.settle()
    expect(p.pdoc.scrollTop).toBe(end)
    expect(open).toBe(peek)
  })

  it('Facit: at the end of the text, the way back to the explanation and out again leaves the reader there', () => {
    mount(3, 'phone')
    const tray = screen.getByTestId('rd-sheet')
    const p = passageScroll()
    const full = p.extent()
    fireEvent.click(within(tray).getByText('Visa texten'))
    expect(tray).toHaveAttribute('data-state', 'peek')
    const peek = p.extent()
    expect(Number.parseFloat(peek)).toBeGreaterThan(0)
    p.pdoc.scrollTop = p.settle()
    const end = p.pdoc.scrollTop
    fireEvent.click(within(tray).getByRole('button', { name: /Tillbaka till förklaringen/ }))
    expect(tray).toHaveAttribute('data-state', 'full')
    p.settle()
    fireEvent.click(within(tray).getByText('Visa texten'))
    expect(tray).toHaveAttribute('data-state', 'peek')
    p.settle()
    expect(p.pdoc.scrollTop).toBe(end)
    expect(full).toBe(peek)
  })
})

describe('F · Samtal, phone: a ¶ link and the way back find the explanation as it was', () => {
  /** How far the reader had scrolled the explanation (jsdom keeps it). */
  const PLACE = 640

  it.each([
    'Orden liknade texten',
    'Hoppa över',
  ])('after "%s" on the coach’s question, a ¶ link, then "Tillbaka till förklaringen"', (choice) => {
    mount(3, 'phone')
    const tray = screen.getByTestId('rd-sheet')
    const lure = () => within(screen.getByTestId('rd-distractor-A'))
    fireEvent.click(lure().getByRole('button', { name: choice }))
    const body = tray.querySelector<HTMLElement>('.sa-tray-body')
    if (!body) throw new Error('no explanation in the tray')
    body.scrollTop = PLACE
    // The reader follows a ¶ link: the tray folds so the paragraph shows…
    const link = within(tray).getAllByTestId('rd-cite-6')[0]
    link.focus()
    fireEvent.click(link)
    expect(tray).toHaveAttribute('data-state', 'peek')
    // …and comes back.
    const back = within(tray).getByRole('button', { name: /Tillbaka till förklaringen/ })
    back.focus()
    fireEvent.click(back)
    expect(tray).toHaveAttribute('data-state', 'full')
    // The reply or the skip stands: the coach does not ask again.
    for (const l of [...LURE_REPLIES, 'Hoppa över']) {
      expect(lure().queryByRole('button', { name: l })).toBeNull()
    }
    if (choice === 'Hoppa över') {
      for (const l of LURE_REPLIES) expect(lure().queryByText(l)).toBeNull()
    } else {
      expect(lure().getByText(choice, { selector: 'p' })).toBeInTheDocument()
    }
    // The explanation is where the reader left it, the link they followed in focus.
    expect(tray.querySelector('.sa-tray-body')?.scrollTop).toBe(PLACE)
    expect(document.activeElement).toBe(link)
  })

  it('while the tray peeks at the passage, the explanation waits behind it, out of reach', () => {
    mount(3, 'phone')
    const tray = screen.getByTestId('rd-sheet')
    fireEvent.click(within(tray).getAllByTestId('rd-cite-6')[0])
    expect(tray).toHaveAttribute('data-state', 'peek')
    expect(screen.getByTestId('rd-distractor-A').closest('[inert]')).not.toBeNull()
    // The peek's compact verdict is a summary: one rd-verdict on the page.
    expect(screen.getAllByTestId('rd-verdict')).toHaveLength(1)
  })
})

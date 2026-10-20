// F · Samtal against the shared rd-* contract (describeDirectionContract,
// kit v2) on every screen it declares — 1 to 8 — at both widths, plus what
// is Samtal's own:
//   - round 1: every screen renders live and as a still; the coach's one
//     question on Idag and the plan as a reply; the keys; the coach's
//     question after a wrong answer, reply or skip; "Visa allt"; the ¶
//     links; the set's end proposing the plan's next part; the folded rail
//     and the door previews; the phone reply tray, which keeps the reader's
//     place (review hpf-xt77 R1 and R2);
//   - round 2: Öva's suggestion with its reason, the doors in their groups
//     and Repetera at zero; Kvantfråga's KVA and NOG kept whole, math
//     wherever it stands, only the question's letters, select then send;
//     DTK's page that zooms, turns, enlarges and holds for every question on
//     it; Repetera's one bounded round; the doors and drills moving the
//     bake-off's switcher; and every screen without the fields the real app
//     cannot fill (kit-v2.md §7);
//   - round 2's review (hpf-nw6s): a question without its stem, or with a
//     diagram that failed, is never graded and offers the way back; a
//     sitting without questions says so; a finished plan part never leads
//     Idag; a failed diagram stays with its own source;
//   - round 3: a figure the question needs — the DTK page, a diagram, the
//     options' images — that is still loading holds the answer with a calm
//     word, and a retry is a new load the answer waits for; a figure the
//     browser already holds is ready at once.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  describeDirectionContract,
  loadImages,
  mountDirection,
  spyActions,
  stubLayout,
} from '@/components/devbake/redesign/contract'
import {
  DirectionDataProvider,
  drillQuestion,
  FIXTURE_DATA,
  fixtureDirectionData,
} from '@/components/devbake/redesign/directionData'
import {
  Redesign2026Bakeoff,
  type Selection,
} from '@/components/devbake/redesign/Redesign2026Bakeoff'
import { EXPLANATIONS, PLAN, UNIT } from '@/components/devbake/redesign/r1Fixtures'
import {
  type AppScreenKey,
  DESTINATIONS,
  type ThemeKey,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import { DTK_PAGES, PASS_QUESTIONS } from '@/components/devbake/redesign/r2Fixtures'
import type {
  DirectionData,
  DrillQuestion,
  ResumeView,
} from '@/components/devbake/redesign/viewModel'
// Not imported as `meta`: Vite's SSR transform would then rewrite the
// `meta` of `import.meta` (used below) as well, and fail.
import { meta as entry } from './meta'
import { Samtal } from './Samtal'

beforeAll(stubLayout)

describeDirectionContract(entry, Samtal)

const WIDTHS: WidthKey[] = ['desktop', 'phone']
const THEMES: ThemeKey[] = ['light', 'dark']
const SCREENS: AppScreenKey[] = [1, 2, 3, 4, 5, 6, 7, 8]
const D = FIXTURE_DATA

const Q3 = UNIT.questions[2]
const Q4 = UNIT.questions[3]
const E3 = EXPLANATIONS[Q3.qid]
const DETAIL = (E3.steps ?? []).find((s) => s.tier === 'detail')
if (!DETAIL) throw new Error('fixture question 3 must have a detail-tier step')

/** The bank's math markers, U+E000 and U+E001, built from their codes so no
 *  editor can strip a private-use character from this file. */
const MATH_MARKERS = new RegExp(`[${String.fromCharCode(0xe000, 0xe001)}]`)
const LATEX = /\\(?:frac|dfrac|tfrac|sqrt|cdot|Rightarrow)/

/** Samtal on its own, outside any provider: the fixtures, and actions that
 *  do nothing; round 1's switcher moves arrive through `onScreen`. */
function mount(
  screenKey: AppScreenKey,
  width: WidthKey,
  { theme = 'light', live = true }: { theme?: ThemeKey; live?: boolean } = {},
) {
  const onScreen = vi.fn()
  const onTheme = vi.fn()
  const element = (s: AppScreenKey) => (
    <Samtal
      screen={s}
      width={width}
      theme={theme}
      live={live}
      onScreen={onScreen}
      onTheme={onTheme}
    />
  )
  const utils = render(element(screenKey))
  return {
    onScreen,
    onTheme,
    unmount: utils.unmount,
    /** What the bake-off stage does when a direction asks for a screen. */
    goTo: (s: AppScreenKey) => utils.rerender(element(s)),
  }
}

/** Samtal on `data`, with spied actions. */
function mountWith(data: DirectionData, s: AppScreenKey, width: WidthKey) {
  const actions = spyActions()
  const onScreen = vi.fn()
  const { unmount } = render(
    <DirectionDataProvider data={data} actions={actions}>
      <Samtal screen={s} width={width} theme="light" live onScreen={onScreen} onTheme={() => {}} />
    </DirectionDataProvider>,
  )
  return { actions, onScreen, unmount }
}

/** The fixtures without what the real app cannot fill (kit-v2.md §7): no
 *  pause time, minutes left or device on the resume, no prognosis range,
 *  target or weekly curve, no delta, no weekly goal, no plan lead, no rising
 *  traps, no clock on any drill. */
function withoutOptional(): DirectionData {
  const d = fixtureDirectionData()
  const {
    pausedAt: _pausedAt,
    minutesLeft: _minutesLeft,
    device: _device,
    ...resume
  } = d.home.resume as ResumeView
  const { low: _low, high: _high, target: _target, weeks: _weeks, ...prognosis } = d.home.prognosis
  const { goal: _goal, ...week } = d.home.week
  return {
    ...d,
    home: {
      ...d.home,
      resume,
      prognosis: { ...prognosis, delta: null },
      week,
      plan: { ...d.home.plan, items: d.home.plan.items.map(({ primary: _p, ...item }) => item) },
      traps: d.home.traps.map(({ rising: _r, ...trap }) => trap),
      provpass: null,
    },
    drills: {
      ...d.drills,
      reading: { ...d.drills.reading, elapsedSeconds: undefined, wrongPick: undefined },
    },
  }
}

/** The fixtures, the quant sitting holding `questions`. */
function withQuant(questions: DrillQuestion[]): DirectionData {
  const base = fixtureDirectionData()
  return { ...base, drills: { ...base.drills, quant: { ...base.drills.quant, questions } } }
}

/** The pass's real questions `qids`, as the drill core takes them. */
function passQuestions(qids: string[]): DrillQuestion[] {
  return PASS_QUESTIONS.filter((q) => qids.includes(q.qid)).map((q) => drillQuestion(q))
}

/** `q` with an image on every option, as the eleven DTK questions whose
 *  choices are pie charts have. */
function withOptionImages(q: DrillQuestion): DrillQuestion {
  return {
    ...q,
    options: (q.options ?? []).map((o) => ({
      ...o,
      figure: {
        src: `figures/test-option-${o.letter}.svg`,
        alt: `Diagram ${o.letter}`,
        width: 800,
        height: 600,
      },
    })),
  }
}

/** Images the browser already holds: complete, with their pixels, when they
 *  mount. jsdom loads no image, so this stands in for the cache. Returns
 *  the way back to jsdom's own. */
function cachedImages(): () => void {
  const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
  const width = vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(800)
  return () => {
    complete.mockRestore()
    width.mockRestore()
  }
}

/** A figure the question needs, three ways: the DTK page beside it, a
 *  diagram in its problem, an image on each option. `images` are what the
 *  answer waits for (the first is the one made to fail); `waits` is the
 *  action bar's calm word while they load, `stops` its reason once one has
 *  failed. */
const NEEDED_FIGURES = [
  {
    kind: 'the DTK page',
    s: 7,
    data: () => fixtureDirectionData(),
    images: () => [within(screen.getByTestId('rd-figure')).getByRole('img')],
    waits: 'Underlaget laddas – du kan svara när det syns.',
    stops: 'Underlaget gick inte att ladda, så frågan kan inte besvaras.',
  },
  {
    kind: 'a diagram',
    s: 6,
    data: () => withQuant(passQuestions(['host-2025-kvant1-XYZ-002'])),
    images: () => [
      within(screen.getByTestId('rd-quant-prompt')).getByRole('img', {
        name: 'Figur till uppgift 2',
      }),
    ],
    waits: 'Figuren laddas – du kan svara när den syns.',
    stops: 'Figuren gick inte att ladda, så frågan kan inte besvaras.',
  },
  {
    kind: 'the options’ images',
    s: 6,
    data: () => withQuant([withOptionImages(D.drills.quant.questions[0])]),
    images: () => screen.getAllByRole('img', { name: /^Diagram [A-D]$/ }),
    waits: 'Bilderna till svarsalternativen laddas – du kan svara när de syns.',
    stops: 'Bilden till alternativ A gick inte att ladda, så frågan kan inte besvaras.',
  },
] as const

/** The phone tray starts at its peek: open it if the options are not on
 *  screen yet (the first collapsed toggle inside the tray). */
function revealOptions(prefix = 'rd-option') {
  if (screen.queryByTestId(`${prefix}-A`)) return
  const tray = screen.getByTestId('rd-sheet')
  const toggle = tray.querySelector<HTMLElement>('[aria-expanded="false"]')
  if (!toggle) throw new Error('no way to open the reply tray')
  fireEvent.click(toggle)
}

function key(k: string, init: KeyboardEventInit = {}) {
  fireEvent.keyDown(window, { key: k, ...init })
}

/** Locks `letter` on the current quant or DTK question, once its figures
 *  have "loaded": the answer waits for them, and jsdom loads no image. */
function answer(letter: string) {
  loadImages()
  revealOptions('rd-quant-option')
  loadImages() // a phone tray may have just mounted option images
  fireEvent.click(screen.getByTestId(`rd-quant-option-${letter}`))
  fireEvent.click(screen.getByTestId('rd-lock'))
}

describe('F · Samtal meta', () => {
  it('is built, in Swedish, and declares screens 1–8', () => {
    expect(entry.key).toBe('f')
    expect(entry.slug).toBe('f-samtal')
    expect(entry.name).toBe('Samtal')
    expect(entry.stub).toBeUndefined()
    expect(entry.traits.length).toBeGreaterThanOrEqual(4)
    expect(entry.risk).toMatch(/^Risk: /)
    expect(entry.references).not.toBe('')
    expect(entry.screens).toEqual(SCREENS)
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
      if (s === 1 || s === 4 || s === 5 || s === 8) {
        for (const d of DESTINATIONS) {
          expect(screen.getByTestId(`rd-nav-${d.id}`)).toBeInTheDocument()
        }
        expect(screen.getByTestId('rd-account')).toBeInTheDocument()
        expect(screen.queryByTestId('rd-exit')).toBeNull()
      } else {
        expect(screen.getByTestId('rd-exit')).toBeInTheDocument()
        expect(screen.queryByTestId('rd-account')).toBeNull()
      }
      if (s === 2 || s === 3) {
        expect(screen.getByTestId('rd-passage')).toBeInTheDocument()
        expect(screen.getByTestId('rd-badge')).toBeInTheDocument()
      }
      if (s === 3) expect(screen.getByTestId('rd-verdict')).toBeInTheDocument()
      if (s === 4) expect(screen.getByTestId('rd-account-menu')).toBeInTheDocument()
      if (s === 6) expect(screen.getByTestId('rd-quant-prompt')).toBeInTheDocument()
      if (s === 7) expect(screen.getByTestId('rd-figure')).toBeInTheDocument()
      unmount()
    }
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })

  // ── Round 1 ──

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

  it('Idag: a door asks for its destination; the current one is marked', () => {
    const { actions } = mountDirection(Samtal, 1, width)
    expect(screen.getByTestId('rd-nav-idag')).toHaveAttribute('aria-current', 'page')
    fireEvent.click(screen.getByTestId('rd-nav-provpass'))
    expect(actions.go).toHaveBeenCalledWith('provpass')
    fireEvent.click(screen.getByTestId('rd-nav-ova'))
    expect(actions.go).toHaveBeenCalledWith('ova')
    // A plan row asks for its item.
    fireEvent.click(screen.getAllByRole('button', { name: /Repetition/ })[0])
    expect(actions.openPlanItem).toHaveBeenCalledWith('rep')
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

  it('Läsfråga: Avsluta takes round 1’s way to Idag and tells the controller', () => {
    const { onScreen, actions } = mountDirection(Samtal, 2, width)
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(onScreen).toHaveBeenCalledWith(1)
    expect(actions.drill.exit).toHaveBeenCalled()
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
    // The picked distractor's reasons are shown without a click.
    const picked = within(screen.getByTestId('rd-distractor-A'))
    expect(picked.getByText(E3.distractors[0].why_wrong)).toBeInTheDocument()
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

  it('the last question ends the unit, and the coach proposes the plan’s next part', () => {
    const { actions, goTo } = mountDirection(Samtal, 3, width)
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
    expect(done).toHaveTextContent('Texten är läst')
    expect(screen.getByTestId('rd-done-next')).toHaveTextContent(PLAN.items[0].title.toLowerCase())
    // The plan's next part asks for its item (the repetition opens Repetera).
    fireEvent.click(screen.getByTestId('rd-done-next'))
    expect(actions.openPlanItem).toHaveBeenCalledWith(PLAN.items[0].id)
    fireEvent.click(within(done).getByRole('button', { name: 'Till Idag' }))
    expect(actions.go).toHaveBeenCalledWith('idag')
  })

  // ── Öva ──

  it('Öva: the coach leads with the practice left half-done, then its suggestion with the reason', () => {
    const { actions } = mountDirection(Samtal, 5, width)
    const lead = screen.getByRole('heading', { level: 1 })
    expect(lead).toHaveTextContent('Fortsätta där du var?')
    expect(screen.getByText(/Du har LÄS på gång, fråga\s3\sav\s4\./)).toBeInTheDocument()
    expect(
      screen.getByText('Annars föreslår jag XYZ – där behöver du mest övning just nu.'),
    ).toBeInTheDocument()
    // One filled reply, and the next best beside it.
    const resume = screen.getByRole('button', { name: /Fortsätt övningen/ })
    expect(resume).toHaveClass('sa-chip--primary')
    fireEvent.click(resume)
    expect(actions.resume).toHaveBeenCalled()
    const suggest = screen.getByRole('button', { name: 'Öva XYZ' })
    expect(suggest).not.toHaveClass('sa-chip--primary')
    fireEvent.click(suggest)
    expect(actions.startDrill).toHaveBeenCalledWith({ kind: 'section', section: 'XYZ' })
    // The suggestion is tagged where it always stands; no other door is.
    expect(screen.getByTestId('rd-ova-section-xyz')).toHaveAttribute('data-suggested', 'true')
    expect(screen.getByTestId('rd-ova-section-xyz')).toHaveTextContent('Förslag')
    expect(screen.getAllByText('Förslag')).toHaveLength(1)
    // The mixed drill stands below as a door of its own.
    expect(screen.getAllByTestId('rd-ova-mixed')).toHaveLength(1)
    expect(screen.getByTestId('rd-ova-mixed')).toHaveTextContent('10 frågor från alla delprov')
    key('Enter')
    expect(actions.resume).toHaveBeenCalledTimes(2)
  })

  it('Öva: without a paused practice, the suggestion is the one action and the mixed drill its reply', () => {
    const data = { ...fixtureDirectionData(), home: { ...D.home, resume: null } }
    const { actions } = mountWith(data, 5, width)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ska vi öva XYZ?')
    expect(
      screen.getByText(/är mitt förslag idag – där behöver du mest övning/),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Öva XYZ/ })).toHaveClass('sa-chip--primary')
    const mixed = screen.getAllByTestId('rd-ova-mixed')
    expect(mixed).toHaveLength(1)
    expect(mixed[0]).toHaveTextContent('Börja blandat')
    fireEvent.click(mixed[0])
    expect(actions.startDrill).toHaveBeenCalledWith({ kind: 'mixed' })
  })

  it('Öva: with nothing to suggest, an open invitation and no tag', () => {
    const base = fixtureDirectionData()
    const data = {
      ...base,
      home: { ...base.home, resume: null },
      ova: { ...base.ova, weakest: null },
    }
    mountWith(data, 5, width)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Välj något att börja med.')
    expect(screen.getByTestId('rd-ova-mixed')).toHaveClass('sa-chip--primary')
    expect(screen.queryByText('Förslag')).toBeNull()
  })

  it('Öva: the doors read their full names, levels and waiting misses, in the exam’s order', () => {
    const { actions } = mountDirection(Samtal, 5, width)
    const doors = screen.getAllByTestId(/^rd-ova-section-/)
    expect(doors.map((d) => d.dataset.testid)).toEqual(
      ['ord', 'las', 'mek', 'elf', 'xyz', 'kva', 'nog', 'dtk'].map((s) => `rd-ova-section-${s}`),
    )
    D.ova.sections.forEach((s, i) => {
      expect(doors[i]).toHaveAccessibleName(new RegExp(`^${s.name}, ${s.section}`))
      if (s.score != null) expect(doors[i]).toHaveTextContent(/nivå \d,\d/)
      if (s.waiting > 0) expect(doors[i]).toHaveTextContent(`${s.waiting} väntar`)
    })
    expect(screen.getByRole('heading', { name: 'Verbal del' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Kvantitativ del' })).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-ova-section-dtk'))
    expect(actions.startDrill).toHaveBeenCalledWith({ kind: 'section', section: 'DTK' })
  })

  it('Öva: Repetera keeps its place and its entry, also at zero', () => {
    const base = fixtureDirectionData()
    const later = { ...base, ova: { ...base.ova, repetera: { dueNow: 0, pile: 5 } } }
    const { actions, unmount } = mountWith(later, 5, width)
    expect(screen.getByText('Inget redo just nu.')).toBeInTheDocument()
    expect(screen.getByTestId('rd-ova-repetera')).toHaveTextContent('Visa dagens hög')
    fireEvent.click(screen.getByTestId('rd-ova-repetera'))
    expect(actions.openRepetera).toHaveBeenCalled()
    unmount()
    mountWith({ ...base, ova: { ...base.ova, repetera: { dueNow: 0, pile: 0 } } }, 5, width)
    expect(screen.getByText('Inga missar att repetera.')).toBeInTheDocument()
    expect(screen.getByTestId('rd-ova-repetera')).toHaveTextContent('Öppna Repetera')
  })

  it('Öva: a trap that keeps coming back starts practice on it', () => {
    const { actions } = mountDirection(Samtal, 5, width)
    const [trap] = D.ova.weakTraps
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`Öva på fällan ${trap.name}`) }))
    expect(actions.startDrill).toHaveBeenCalledWith({
      kind: 'framework',
      frameworkId: trap.frameworkId,
      section: trap.section,
    })
  })

  // ── Kvantfråga ──

  it('Kvantfråga: KVA keeps its condition and both quantities apart, NOG its statements and coda', () => {
    mount(6, width)
    answer('A')
    fireEvent.click(screen.getByTestId('rd-next'))
    const kva = within(screen.getByTestId('rd-quant-prompt'))
    expect(kva.getByRole('heading', { level: 2 })).toHaveTextContent('Jämför kvantiteterna.')
    expect(kva.getByText('Villkor').parentElement).toHaveTextContent('Villkory > 0')
    expect(kva.getByText('Kvantitet I').nextElementSibling).toHaveTextContent('x - y')
    expect(kva.getByText('Kvantitet II').nextElementSibling).toHaveTextContent('3x - 2y')
    answer('D')
    fireEvent.click(screen.getByTestId('rd-next'))
    const nog = within(screen.getByTestId('rd-quant-prompt'))
    expect(nog.getByRole('heading', { level: 2 })).toHaveTextContent('Vilket värde har x + y?')
    const statements = nog.getAllByRole('listitem')
    expect(statements).toHaveLength(2)
    expect(statements[0]).toHaveTextContent(/^\(1\)Påstående 1:/)
    expect(statements[1]).toHaveTextContent('Påstående 2: y = 6x')
    expect(nog.getByText('Tillräcklig information för lösningen erhålls')).toBeInTheDocument()
    // NOG's five options, its own words kept.
    for (const o of D.drills.quant.questions[2].options ?? []) {
      expect(screen.getByTestId(`rd-quant-option-${o.letter}`)).toHaveTextContent(o.text)
    }
  })

  it('Kvantfråga: math is rendered wherever it stands — the problem, the options, your answer, the verdict, the notes', () => {
    mount(6, width)
    const clean = (el: HTMLElement) => {
      expect(el.textContent).not.toMatch(MATH_MARKERS)
      expect(el.textContent).not.toMatch(LATEX)
    }
    clean(screen.getByTestId('rd-quant-prompt'))
    for (const l of ['A', 'B', 'C', 'D']) clean(screen.getByTestId(`rd-quant-option-${l}`))
    answer('A')
    clean(screen.getByText('Ditt svar').closest('.sa-turn') as HTMLElement)
    clean(screen.getByTestId('rd-verdict'))
    clean(screen.getByTestId('rd-technique'))
    clean(screen.getByTestId('rd-pitfall'))
    // No marker reaches the screen anywhere, not even inside a broken step.
    fireEvent.click(screen.getByRole('button', { name: 'Visa allt' }))
    expect(screen.getByTestId('rd-samtal').textContent).not.toMatch(MATH_MARKERS)
    // KaTeX sets the math; its spoken form is a flat label.
    expect(screen.getByTestId('rd-quant-prompt').querySelector('[role="math"]')).not.toBeNull()
  })

  it('Kvantfråga: select, then send — choosing grades nothing, Svara is the one action', () => {
    const { actions } = mountDirection(Samtal, 6, width)
    const send = screen.getByTestId('rd-lock')
    expect(send).toBeDisabled()
    fireEvent.click(screen.getByTestId('rd-quant-option-B'))
    expect(screen.getByTestId('rd-quant-option-B')).toHaveAttribute('aria-pressed', 'true')
    expect(actions.drill.pick).toHaveBeenCalled()
    expect(actions.drill.lock).not.toHaveBeenCalled()
    expect(send).toBeEnabled()
    fireEvent.click(send)
    expect(actions.drill.lock).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('rd-next')).toHaveTextContent('Nästa fråga')
  })

  it('Kvantfråga: the keys answer only the letters the question has', () => {
    const { actions } = mountDirection(Samtal, 6, width)
    key('e')
    expect(screen.queryByTestId('rd-quant-option-E')).toBeNull()
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    key('b')
    expect(screen.getByTestId('rd-quant-option-B')).toHaveAttribute('aria-pressed', 'true')
    key('C', { shiftKey: true })
    expect(screen.getByTestId('rd-eliminate-C')).toHaveAttribute('aria-pressed', 'true')
    key('Escape')
    expect(actions.drill.exit).not.toHaveBeenCalled()
    key('Enter')
    expect(actions.drill.lock).toHaveBeenCalledTimes(1)
    key('Enter')
    key('Enter')
    answer('D')
    key('Enter')
    // NOG has an E.
    key('e')
    expect(screen.getByTestId('rd-quant-option-E')).toHaveAttribute('aria-pressed', 'true')
  })

  it('Kvantfråga: striking is reversible and never sends', () => {
    const { actions } = mountDirection(Samtal, 6, width)
    const strike = screen.getByTestId('rd-eliminate-A')
    fireEvent.click(strike)
    expect(strike).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByTestId('rd-eliminate-A'))
    expect(screen.getByTestId('rd-eliminate-A')).toHaveAttribute('aria-pressed', 'false')
    expect(actions.drill.lock).not.toHaveBeenCalled()
  })

  it('Kvantfråga: the set ends with the coach’s tally, the plan’s next part and the way back to Öva', () => {
    const { actions } = mountDirection(Samtal, 6, width)
    const [xyz, kva, nog] = D.drills.quant.questions
    answer(xyz.answer)
    fireEvent.click(screen.getByTestId('rd-next'))
    answer(kva.answer)
    fireEvent.click(screen.getByTestId('rd-next'))
    answer('B')
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute(
      'data-correct',
      String(nog.answer === 'B'),
    )
    expect(screen.getByTestId('rd-next')).toHaveTextContent('Slutför övningen')
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(actions.drill.next).toHaveBeenLastCalledWith(null)
    const done = screen.getByTestId('rd-done')
    expect(done).toHaveTextContent('Övningen är klar')
    expect(done).toHaveTextContent(/Klart\. 3\sfrågor, 2\srätt\./)
    expect(within(done).getAllByRole('listitem')).toHaveLength(3)
    fireEvent.click(screen.getByTestId('rd-done-next'))
    expect(actions.openPlanItem).toHaveBeenCalledWith('rep')
    fireEvent.click(within(done).getByRole('button', { name: 'Till Öva' }))
    expect(actions.go).toHaveBeenCalledWith('ova')
  })

  it('Kvantfråga: no clock without a supplied time; with one, it shows', () => {
    const { unmount } = mount(6, width)
    expect(screen.queryByRole('timer')).toBeNull()
    unmount()
    const base = fixtureDirectionData()
    mountWith(
      { ...base, drills: { ...base.drills, quant: { ...base.drills.quant, elapsedSeconds: 120 } } },
      6,
      width,
    )
    expect(screen.getByRole('timer')).toHaveAccessibleName('Tid 02:00')
  })

  it('Kvantfråga: without an explanation, the verdict and the way on are still there', () => {
    const base = fixtureDirectionData()
    mountWith(
      { ...base, drills: { ...base.drills, quant: { ...base.drills.quant, explanations: {} } } },
      6,
      width,
    )
    answer('A')
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
    expect(
      screen.getByText('Förklaringen till den här frågan är inte klar än.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Visa allt' })).toBeNull()
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(screen.getByTestId('rd-quant-prompt')).toHaveTextContent('Jämför kvantiteterna.')
  })

  it('Kvantfråga: a question without options cannot be sent, and says why', () => {
    const base = fixtureDirectionData()
    const [xyz, ...rest] = base.drills.quant.questions
    mountWith(
      {
        ...base,
        drills: {
          ...base.drills,
          quant: { ...base.drills.quant, questions: [{ ...xyz, options: null }, ...rest] },
        },
      },
      6,
      width,
    )
    expect(screen.queryByTestId('rd-quant-option-A')).toBeNull()
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    expect(screen.getByText(/Frågan saknar svarsalternativ/)).toBeInTheDocument()
  })

  it.each([
    ['no', null],
    ['an empty', ''],
  ] as const)('Kvantfråga: a question with %s stem cannot be graded, by Svara or by Enter, and the way back is Öva', (_, prompt) => {
    const base = fixtureDirectionData()
    const [xyz, ...rest] = base.drills.quant.questions
    const { actions } = mountWith(
      {
        ...base,
        drills: {
          ...base.drills,
          quant: { ...base.drills.quant, questions: [{ ...xyz, prompt }, ...rest] },
        },
      },
      6,
      width,
    )
    expect(screen.getByTestId('rd-quant-prompt')).toHaveTextContent('Frågetexten saknas.')
    fireEvent.click(screen.getByTestId('rd-quant-option-B'))
    const send = screen.getByTestId('rd-lock')
    expect(send).toBeDisabled()
    fireEvent.click(send)
    key('Enter')
    expect(actions.drill.lock).not.toHaveBeenCalled()
    expect(screen.queryByTestId('rd-verdict')).toBeNull()
    expect(screen.getByText('Frågetexten saknas, så frågan kan inte besvaras.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Till Öva' }))
    expect(actions.go).toHaveBeenCalledWith('ova')
  })

  it('Kvantfråga: a diagram that fails to load blocks the answer until a real retry brings it back', () => {
    const base = fixtureDirectionData()
    const questions = PASS_QUESTIONS.filter((q) => q.qid === 'host-2025-kvant1-XYZ-002').map((q) =>
      drillQuestion(q),
    )
    const { actions } = mountWith(
      { ...base, drills: { ...base.drills, quant: { ...base.drills.quant, questions } } },
      6,
      width,
    )
    const prompt = () => within(screen.getByTestId('rd-quant-prompt'))
    const img = prompt().getByRole('img', { name: 'Figur till uppgift 2' })
    fireEvent.click(screen.getByTestId('rd-quant-option-B'))
    fireEvent.error(img)
    expect(prompt().getByRole('alert')).toHaveTextContent('Figuren gick inte att ladda.')
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    key('Enter')
    expect(actions.drill.lock).not.toHaveBeenCalled()
    expect(
      screen.getByText('Figuren gick inte att ladda, så frågan kan inte besvaras.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Till Öva' })).toBeInTheDocument()
    // The retry loads the diagram afresh: a new load, which the answer
    // waits for — Svara and Enter refuse until it is in…
    fireEvent.click(prompt().getByRole('button', { name: 'Försök igen' }))
    expect(prompt().queryByRole('alert')).toBeNull()
    const again = prompt().getByRole('img', { name: 'Figur till uppgift 2' })
    expect(again).not.toBe(img)
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.click(screen.getByTestId('rd-lock'))
    key('Enter')
    expect(actions.drill.lock).not.toHaveBeenCalled()
    expect(screen.queryByTestId('rd-verdict')).toBeNull()
    expect(screen.getByText('Figuren laddas – du kan svara när den syns.')).toBeInTheDocument()
    // …and once it has loaded, the kept choice is sent.
    fireEvent.load(again)
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
    key('Enter')
    expect(actions.drill.lock).toHaveBeenCalledTimes(1)
  })

  it('Kvantfråga: a failed diagram stays with its own source — the next question’s diagram shows', () => {
    const base = fixtureDirectionData()
    const qids = ['host-2025-kvant1-XYZ-002', 'host-2025-kvant1-XYZ-005']
    const questions = PASS_QUESTIONS.filter((q) => qids.includes(q.qid)).map((q) =>
      drillQuestion(q),
    )
    mountWith(
      { ...base, drills: { ...base.drills, quant: { ...base.drills.quant, questions } } },
      6,
      width,
    )
    const prompt = () => within(screen.getByTestId('rd-quant-prompt'))
    answer(questions[0].answer)
    // The first diagram fails late, once the answer is in.
    fireEvent.error(prompt().getByRole('img', { name: 'Figur till uppgift 2' }))
    expect(prompt().getByText('Figuren gick inte att ladda.')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-next'))
    const next = prompt().getByRole('img', { name: 'Figur till uppgift 5' })
    expect(prompt().queryByText('Figuren gick inte att ladda.')).toBeNull()
    fireEvent.load(next)
    fireEvent.click(screen.getByTestId('rd-quant-option-C'))
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
  })

  it.each(
    NEEDED_FIGURES,
  )('while $kind is still loading, the answer waits — Svara, Enter and Space refuse — with a calm word; once loaded, it goes', ({
    s,
    data,
    images,
    waits,
  }) => {
    const { actions } = mountWith(data(), s, width)
    revealOptions('rd-quant-option')
    fireEvent.click(screen.getByTestId('rd-quant-option-B'))
    const send = screen.getByTestId('rd-lock')
    expect(send).toBeDisabled()
    fireEvent.click(send)
    key('Enter')
    key(' ')
    expect(actions.drill.lock).not.toHaveBeenCalled()
    expect(screen.queryByTestId('rd-verdict')).toBeNull()
    // A wait, not a failure: the reason, calmly — no alert, no way out.
    expect(screen.getByText(waits)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Till Öva' })).toBeNull()
    // The answer waits for every image it needs, the last one included.
    const all = images()
    for (const img of all.slice(0, -1)) fireEvent.load(img)
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.load(all[all.length - 1])
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
    expect(screen.queryByText(waits)).toBeNull()
    key('Enter')
    expect(actions.drill.lock).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('rd-verdict')).toBeInTheDocument()
  })

  it.each(
    NEEDED_FIGURES,
  )('$kind that the browser already holds can be answered at once, and at once again after a retry', ({
    s,
    data,
    images,
    stops,
  }) => {
    const restore = cachedImages()
    try {
      const { actions } = mountWith(data(), s, width)
      revealOptions('rd-quant-option')
      fireEvent.click(screen.getByTestId('rd-quant-option-B'))
      // No load event: an image complete when it mounts is ready, and
      // nothing says it is loading.
      expect(screen.getByTestId('rd-lock')).toBeEnabled()
      expect(screen.queryByText(/Hämtar underlaget|laddas/)).toBeNull()
      const [first] = images()
      fireEvent.error(first)
      expect(screen.getByTestId('rd-lock')).toBeDisabled()
      expect(screen.getByText(stops)).toBeInTheDocument()
      // The retry mounts a new image, and that one is held too.
      fireEvent.click(screen.getByRole('button', { name: 'Försök igen' }))
      expect(images()[0]).not.toBe(first)
      expect(screen.getByTestId('rd-lock')).toBeEnabled()
      key('Enter')
      expect(actions.drill.lock).toHaveBeenCalledTimes(1)
    } finally {
      restore()
    }
  })

  it('Kvantfråga: an option’s image that fails stops the answer and says which, in place with a real retry; the new images are waited for', () => {
    const { actions } = mountWith(
      withQuant([withOptionImages(D.drills.quant.questions[0])]),
      6,
      width,
    )
    const [a, b, c, d] = screen.getAllByRole('img', { name: /^Diagram [A-D]$/ })
    fireEvent.load(b)
    fireEvent.load(d)
    fireEvent.click(screen.getByTestId('rd-quant-option-B'))
    fireEvent.error(a)
    const note = () => screen.getByRole('alert')
    expect(note()).toHaveTextContent('Bilden till alternativ A gick inte att ladda.')
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    key('Enter')
    expect(actions.drill.lock).not.toHaveBeenCalled()
    expect(
      screen.getByText(
        'Bilden till alternativ A gick inte att ladda, så frågan kan inte besvaras.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Till Öva' })).toBeInTheDocument()
    fireEvent.error(c)
    expect(note()).toHaveTextContent('Bilderna till alternativ A och C gick inte att ladda.')
    // One retry loads both afresh: a new load, which the answer waits for.
    fireEvent.click(within(note()).getByRole('button', { name: 'Försök igen' }))
    expect(screen.queryByRole('alert')).toBeNull()
    const againA = screen.getByRole('img', { name: 'Diagram A' })
    const againC = screen.getByRole('img', { name: 'Diagram C' })
    expect(againA).not.toBe(a)
    expect(againC).not.toBe(c)
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    key('Enter')
    expect(actions.drill.lock).not.toHaveBeenCalled()
    expect(
      screen.getByText('Bilderna till svarsalternativen laddas – du kan svara när de syns.'),
    ).toBeInTheDocument()
    fireEvent.load(againA)
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.load(againC)
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
    key('Enter')
    expect(actions.drill.lock).toHaveBeenCalledTimes(1)
  })

  it.each([
    [6, 'quant'],
    [7, 'dtk'],
  ] as const)('screen %s without questions says so, and its one way on is Öva', (s, drill) => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const base = fixtureDirectionData()
    const { actions } = mountWith(
      { ...base, drills: { ...base.drills, [drill]: { ...base.drills[drill], questions: [] } } },
      s,
      width,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Det finns ingen fråga att visa här just nu.',
    )
    expect(screen.queryByTestId('rd-quant-prompt')).toBeNull()
    expect(screen.queryByTestId('rd-lock')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Till Öva' }))
    expect(actions.go).toHaveBeenCalledWith('ova')
    key('Enter')
    expect(actions.go).toHaveBeenCalledTimes(2)
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })

  // ── DTK ──

  it('DTK: "Förstora figur" lays the page over the drill; Esc closes it and focus returns', () => {
    const { actions } = mountDirection(Samtal, 7, width)
    const open = screen.getByRole('button', { name: 'Förstora figur' })
    open.focus()
    fireEvent.click(open)
    const dialog = screen.getByRole('dialog', { name: D.drills.dtk.questions[0].figure?.alt })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(within(dialog).getByRole('button', { name: 'Stäng figur' })).toHaveFocus()
    expect(screen.getByTestId('rd-figure').closest('[inert]')).not.toBeNull()
    // The question's keys rest while the page is enlarged.
    key('c')
    expect(actions.drill.pick).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Zooma in' }))
    expect(within(dialog).getByText('150 %')).toBeInTheDocument()
    key('Escape')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(actions.drill.exit).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Förstora figur' })).toHaveFocus()
  })

  it('DTK: a page that fails to load blocks the answer and offers a real retry, whose new load the answer waits for', () => {
    const { actions } = mountDirection(Samtal, 7, width)
    const img = within(screen.getByTestId('rd-figure')).getByRole('img')
    fireEvent.error(img)
    expect(screen.getByRole('alert')).toHaveTextContent('Underlaget gick inte att ladda.')
    revealOptions('rd-quant-option')
    fireEvent.click(screen.getByTestId('rd-quant-option-C'))
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    expect(screen.getByText(/Underlaget gick inte att ladda, så frågan/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Försök igen' }))
    expect(screen.queryByRole('alert')).toBeNull()
    const again = within(screen.getByTestId('rd-figure')).getByRole('img')
    expect(again).not.toBe(img)
    // Back to loading: Svara and Enter refuse until the new page is in.
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    key('Enter')
    expect(actions.drill.lock).not.toHaveBeenCalled()
    expect(screen.getByText('Underlaget laddas – du kan svara när det syns.')).toBeInTheDocument()
    fireEvent.load(again)
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
    key('Enter')
    expect(actions.drill.lock).toHaveBeenCalledTimes(1)
  })

  // ── Repetera ──

  it('Repetera: the ready misses first, each with its section, question and framework; the rest folded under its count', () => {
    mountDirection(Samtal, 8, width)
    const r = D.repetera
    const ready = r.items.filter((i) => i.dueNow)
    for (const item of ready) {
      const row = screen.getByTestId(`rd-repetera-item-${item.n}`)
      expect(row).toHaveTextContent(item.section)
      if (item.frameworkName) expect(row).toHaveTextContent(`Ramverk: ${item.frameworkName}`)
    }
    const later = r.items.filter((i) => !i.dueNow)
    expect(screen.queryByTestId(`rd-repetera-item-${later[0].n}`)).toBeNull()
    const fold = screen.getByRole('button', { name: /Senare idag/ })
    expect(fold).toHaveAttribute('aria-expanded', 'false')
    expect(fold).toHaveTextContent(String(later.length))
    fireEvent.click(fold)
    expect(screen.getByTestId(`rd-repetera-item-${later[0].n}`)).toBeInTheDocument()
  })

  it('Repetera: one round; "Välj sektion" becomes your turn and narrows it', () => {
    const { actions } = mountDirection(Samtal, 8, width)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      `${D.repetera.dueNow} frågor är redo nu. Tar vi dem?`,
    )
    expect(screen.getByTestId('rd-repetera-start')).toHaveTextContent(
      `Repetera ${D.repetera.dueNow}`,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Välj sektion' }))
    expect(screen.getByText('Välj sektion', { selector: 'p' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Välj sektion' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /^Bara XYZ/ }))
    expect(actions.startDrill).toHaveBeenCalledWith({ kind: 'repetition', section: 'XYZ' })
    key('Enter')
    expect(actions.startDrill).toHaveBeenLastCalledWith({ kind: 'repetition' })
  })

  it('Repetera: more ready than a round holds — ten at a time', () => {
    const base = fixtureDirectionData()
    const items = base.repetera.items.map((i) => ({ ...i, dueNow: true, dueLabel: 'nu' }))
    mountWith({ ...base, repetera: { ...base.repetera, dueNow: items.length, items } }, 8, width)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      `${items.length} frågor är redo nu. Vi tar 10 i taget.`,
    )
    expect(screen.getByTestId('rd-repetera-start')).toHaveTextContent('Repetera 10')
  })

  it('Repetera: nothing ready, or nothing at all — no start, and the way on is Öva', () => {
    const base = fixtureDirectionData()
    const items = base.repetera.items.map((i) => ({ ...i, dueNow: false, dueLabel: 'senare idag' }))
    const { actions, unmount } = mountWith(
      { ...base, repetera: { ...base.repetera, dueNow: 0, items } },
      8,
      width,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Inget är redo just nu.')
    expect(screen.queryByTestId('rd-repetera-start')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Till Öva/ }))
    expect(actions.go).toHaveBeenCalledWith('ova')
    unmount()
    mountWith({ ...base, repetera: { ...base.repetera, dueNow: 0, pile: 0, items: [] } }, 8, width)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Inga missar att repetera.')
    expect(screen.queryByTestId('rd-repetera-start')).toBeNull()
  })

  it('Repetera lives inside Öva: its door is the current one', () => {
    const { actions } = mountDirection(Samtal, 8, width)
    expect(screen.getByTestId('rd-nav-ova')).toHaveAttribute('aria-current', 'page')
    fireEvent.click(screen.getByTestId('rd-nav-ova'))
    expect(actions.go).toHaveBeenCalledWith('ova')
  })

  // ── Without the optional fields ──

  it('Idag renders without the fields the real app cannot fill', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    mountWith(withoutOptional(), 1, width)
    const root = screen.getByTestId('rd-samtal')
    expect(root.textContent).not.toMatch(/undefined|NaN|null/)
    expect(root).not.toHaveTextContent('Pausad')
    expect(root).not.toHaveTextContent('min kvar')
    expect(root).not.toHaveTextContent('Härnäst')
    expect(root).not.toHaveTextContent('sedan förra veckan')
    expect(screen.getByRole('img', { name: 'Nivå 1,4 på skalan 0 till 2,0' })).toBeInTheDocument()
    expect(root).toHaveTextContent('14 minuter idag · fyra dagar den här veckan')
    // The plan's first part still leads once the text is done.
    fireEvent.click(screen.getByRole('button', { name: 'Visa dagens plan' }))
    expect(screen.getByRole('button', { name: 'Börja med repetition' })).toBeInTheDocument()
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })

  it('Idag without a paused sitting offers the plan as the one action', () => {
    const base = fixtureDirectionData()
    const { actions } = mountWith({ ...base, home: { ...base.home, resume: null } }, 1, width)
    expect(screen.queryByTestId('rd-resume')).toBeNull()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /^Idag väntar tre saker, ungefär 19\sminuter\. Ska vi börja\?$/,
    )
    const start = screen.getByRole('button', { name: /Börja med repetition/ })
    expect(start).toHaveClass('sa-chip--primary')
    key('Enter')
    expect(actions.openPlanItem).toHaveBeenCalledWith('rep')
  })

  it('Idag: a finished part never leads — the first part still to do does, by click and by Enter', () => {
    const base = fixtureDirectionData()
    // The lead marker sits on the part that is already done.
    const items = base.home.plan.items.map((i) => (i.id === 'rep' ? { ...i, completed: true } : i))
    const { actions } = mountWith(
      { ...base, home: { ...base.home, resume: null, plan: { ...base.home.plan, items } } },
      1,
      width,
    )
    const start = screen.getByRole('button', { name: /Börja med elf-lektion/ })
    expect(start).toHaveClass('sa-chip--primary')
    key('Enter')
    expect(actions.openPlanItem).toHaveBeenLastCalledWith('lektion')
    fireEvent.click(start)
    expect(actions.openPlanItem).toHaveBeenLastCalledWith('lektion')
    expect(actions.openPlanItem).not.toHaveBeenCalledWith('rep')
    // The finished part is not "Härnäst" either.
    expect(screen.queryByText('Härnäst')).toBeNull()
  })

  it('Idag: with the whole plan done, the one way on is Öva, by click and by Enter', () => {
    const base = fixtureDirectionData()
    const items = base.home.plan.items.map((i) => ({ ...i, completed: true }))
    const { actions } = mountWith(
      {
        ...base,
        home: { ...base.home, resume: null, plan: { ...base.home.plan, items, allComplete: true } },
      },
      1,
      width,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Dagens plan är klar. Vill du öva mer?',
    )
    const out = screen.getByRole('button', { name: 'Till Öva' })
    key('Enter')
    expect(actions.go).toHaveBeenCalledWith('ova')
    fireEvent.click(out)
    expect(actions.go).toHaveBeenCalledTimes(2)
    expect(actions.openPlanItem).not.toHaveBeenCalled()
  })

  it.each([5, 6, 7, 8] as const)('screen %s renders without the optional fields', (s) => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    mountWith(withoutOptional(), s, width)
    expect(screen.getByTestId('rd-samtal').textContent).not.toMatch(/undefined|NaN/)
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
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
    expect(screen.getByTestId('rd-nav-ova')).toHaveTextContent('23 missar att repetera')
    expect(screen.getByTestId('rd-nav-framsteg')).toHaveTextContent('Prognos 1,4 av 2,0')
  })

  it('Kvantfråga stands in one centred column, without a document pane', () => {
    mount(6, 'desktop')
    expect(screen.getByTestId('rd-samtal').querySelector('.sa-qbody .sa-talk--solo')).not.toBeNull()
    expect(screen.getByTestId('rd-samtal').querySelector('.sa-doc')).toBeNull()
  })

  it('DTK: the page zooms in place and turns, its box taking the turned shape', () => {
    mount(7, 'desktop')
    const doc = within(screen.getByTestId('rd-figure'))
    const box = () => screen.getByTestId('rd-figure').querySelector<HTMLElement>('.sa-fig-box')
    const page = D.drills.dtk.questions[0].figure
    if (!page) throw new Error('the DTK question must have its page')
    expect(doc.getByText('100 %')).toBeInTheDocument()
    expect(doc.getByRole('button', { name: 'Zooma ut' })).toBeDisabled()
    expect(box()?.style.width).toBe('100%')
    expect(box()).toHaveAttribute('data-turned', 'false')
    fireEvent.click(doc.getByRole('button', { name: 'Zooma in' }))
    expect(doc.getByText('125 %')).toBeInTheDocument()
    expect(box()?.style.width).toBe('125%')
    fireEvent.click(doc.getByRole('button', { name: 'Rotera underlaget 90 grader' }))
    expect(box()).toHaveAttribute('data-turned', 'true')
    // Turned a quarter, the page's image is sized to the turned box.
    const img = doc.getByRole('img', { name: page.alt })
    expect(img.style.transform).toContain('rotate(90deg)')
    expect(Number.parseFloat(img.style.width)).toBeCloseTo((100 * page.width) / page.height, 1)
    // The page pans by keys, which the switcher then leaves alone.
    const region = doc.getByRole('region', { name: /^Underlaget/ })
    const right = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    })
    region.dispatchEvent(right)
    expect(right.defaultPrevented).toBe(true)
  })

  it('DTK: questions on the same page share it — the zoom and the turn hold, and the run is named', () => {
    const base = fixtureDirectionData()
    const qids = ['host-2025-kvant1-DTK-029', 'host-2025-kvant1-DTK-030']
    const questions = PASS_QUESTIONS.filter((q) => qids.includes(q.qid)).map((q) =>
      drillQuestion(q, DTK_PAGES),
    )
    mountWith(
      { ...base, drills: { ...base.drills, dtk: { ...base.drills.dtk, questions } } },
      7,
      'desktop',
    )
    const doc = () => within(screen.getByTestId('rd-figure'))
    expect(doc().getByText('Fråga 1 av 2 till samma underlag')).toBeInTheDocument()
    fireEvent.click(doc().getByRole('button', { name: 'Zooma in' }))
    fireEvent.click(doc().getByRole('button', { name: 'Rotera underlaget 90 grader' }))
    answer(questions[0].answer)
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(doc().getByText('Fråga 2 av 2 till samma underlag')).toBeInTheDocument()
    expect(doc().getByText('125 %')).toBeInTheDocument()
    const box = screen.getByTestId('rd-figure').querySelector<HTMLElement>('.sa-fig-box')
    expect(box).toHaveAttribute('data-turned', 'true')
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

  it('Kvantfråga is one scroll: no tray hides the problem', () => {
    mount(6, 'phone')
    expect(screen.queryByTestId('rd-sheet')).toBeNull()
    expect(screen.getByTestId('rd-quant-option-A')).toBeInTheDocument()
    expect(screen.getByText('Välj ett svar')).toBeInTheDocument()
  })

  it('DTK: the page first, the whole question in the tray; "Visa figuren" folds it back', () => {
    mount(7, 'phone')
    const tray = screen.getByTestId('rd-sheet')
    expect(tray).toHaveAttribute('data-state', 'peek')
    expect(within(tray).getByTestId('rd-quant-prompt')).toHaveTextContent(
      D.drills.dtk.questions[0].prompt ?? '',
    )
    fireEvent.click(within(tray).getByRole('button', { name: /Välj ett svar/ }))
    expect(tray).toHaveAttribute('data-state', 'open')
    expect(screen.getByTestId('rd-quant-option-A')).toBeInTheDocument()
    fireEvent.click(within(tray).getByText('Visa figuren'))
    expect(tray).toHaveAttribute('data-state', 'peek')
    // The phone's zoom is the enlarged page, not a zoom in place.
    expect(screen.queryByRole('button', { name: 'Zooma in' })).toBeNull()
  })
})

// ── In the bake-off: the doors and the drills move the switcher ──────

describe('F · Samtal in the bake-off', () => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(1440)
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(848)
  })
  afterEach(() => vi.restoreAllMocks())

  function Host() {
    const [sel, setSel] = useState<Selection>({
      d: 'f',
      s: 1,
      w: 'desktop',
      t: 'light',
      sbs: false,
      bare: true,
    })
    return (
      <div data-testid="host" data-screen={sel.s}>
        <Redesign2026Bakeoff sel={sel} onSelect={(next) => setSel((s) => ({ ...s, ...next }))} />
      </div>
    )
  }

  it('Idag → Öva → a section → Avsluta back to Öva → Repetera → its round and back; an unbuilt door shows the shared card', async () => {
    render(<Host />)
    await screen.findByTestId('rd-samtal', {}, { timeout: 5000 })
    const host = screen.getByTestId('host')
    // The fold survives a move between doors.
    fireEvent.click(screen.getByTestId('rd-collapse'))
    fireEvent.click(screen.getByTestId('rd-nav-ova'))
    expect(host).toHaveAttribute('data-screen', '5')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Fortsätta där du var?')
    expect(screen.getByTestId('rd-nav-ova')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('rd-collapse')).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(screen.getByTestId('rd-ova-section-kva'))
    expect(host).toHaveAttribute('data-screen', '6')
    expect(screen.getByTestId('rd-quant-prompt')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(host).toHaveAttribute('data-screen', '5')
    fireEvent.click(screen.getByTestId('rd-ova-repetera'))
    expect(host).toHaveAttribute('data-screen', '8')
    expect(screen.getByTestId('rd-nav-ova')).toHaveAttribute('aria-current', 'page')
    fireEvent.click(screen.getByTestId('rd-repetera-start'))
    expect(host).toHaveAttribute('data-screen', '6')
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(host).toHaveAttribute('data-screen', '8')
    fireEvent.click(screen.getByTestId('rd-nav-provpass'))
    expect(host).toHaveAttribute('data-screen', '9')
    expect(screen.getByTestId('rd-not-built')).toHaveTextContent('Inte byggd än i Samtal.')
  })

  it('the reading drill’s Avsluta returns where it was started from', async () => {
    render(<Host />)
    await screen.findByTestId('rd-samtal', {}, { timeout: 5000 })
    const host = screen.getByTestId('host')
    fireEvent.click(screen.getByTestId('rd-nav-ova'))
    fireEvent.click(screen.getByTestId('rd-ova-section-las'))
    expect(host).toHaveAttribute('data-screen', '2')
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(host).toHaveAttribute('data-screen', '5')
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

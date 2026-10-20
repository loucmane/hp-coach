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
//     browser already holds is ready at once;
//   - batch 2 (screens 9–11): the Provpass hub's one offer and its one gate;
//     the running pass — answers that record and change without grading,
//     the overview, the hand-in and abort gates, the keys (the switcher's
//     never leave a running pass, through the real host), the clock that
//     hands in once at zero (also when the provider's ticks reach it) and a
//     snapshot already out of time, a list that shrinks, a pass the host
//     did not start, figures that hold the answer while loading or failed;
//     the result with its basis, sections and history; Framsteg's
//     observation, ledger, weeks and rhythm, its tabs and Historik, and all
//     of it on sparse data;
//   - batch 2's review (hpf-3lt1): a hand-in the host refuses — by the
//     reader or by the clock, through the real host — is said with the
//     answers as they stood, read-only, the doors, the way out and the
//     switcher's keys back and nothing sent twice; a scroll pane with focus
//     keeps its arrows; the enlarged page gives focus back to its opener;
//     the weekly chart, the halves and the register keep to the
//     collections the provider has now;
//   - batch 3 (screens 12–14): Uppslag's open lesson as a document with
//     practice as the reply, each family in its own order, a row that asks
//     for its lesson honestly, the doors and a long catalog, an entry
//     without questions; Konto's one way back, its sections reached from
//     the account card and only then focused, every preference as its own
//     request with a refusal said and retried, the export, the sign-out
//     and the deep, typed, once-only deletion labelled a preview; ELF's
//     English kept English and the coach Swedish, Facit in place, the end,
//     gap items, missing content, figures that hold the answer and decks
//     that change; and, through the real host, the switcher's keys from
//     every focused part of 12, 13 and 14;
//   - batch 3's review (hpf-64dw): an image ELF needs is waited for where it
//     is mounted — the question's figure when the tray opens over the peek,
//     the options' images when the tray folds and opens again, an earlier
//     question's image shown again — while an image still on screen keeps
//     its load and one the browser holds is there at once.

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
  visible,
} from '@/components/devbake/redesign/contract'
import * as kit from '@/components/devbake/redesign/directionData'
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
  fmtScore,
  type ThemeKey,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import { DTK_PAGES, PASS_QUESTIONS } from '@/components/devbake/redesign/r2Fixtures'
import type {
  DirectionData,
  DrillQuestion,
  LessonView,
  ProvRunningView,
  ResumeView,
} from '@/components/devbake/redesign/viewModel'
import type {
  ConstraintEntry,
  LexiconEntry,
  ProtocolEntry,
  TacticEntry,
  TrapEntry,
} from '@/data/frameworks'
import { formatSwedishDateShort } from '@/lib/scoring'
import { COACH_BLURBS } from '@/lib/voice'
// Not imported as `meta`: Vite's SSR transform would then rewrite the
// `meta` of `import.meta` (used below) as well, and fail.
import { meta as entry } from './meta'
import { Samtal } from './Samtal'
import { slug } from './SamtalOva'
import { fmtScore2 } from './SamtalParts'

beforeAll(stubLayout)

describeDirectionContract(entry, Samtal)

const WIDTHS: WidthKey[] = ['desktop', 'phone']
const THEMES: ThemeKey[] = ['light', 'dark']
const SCREENS: AppScreenKey[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
/** The screens in the frame: the doors and the account are on them. */
const FRAMED: AppScreenKey[] = [1, 4, 5, 8, 9, 10, 11, 12, 13]
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
  it('is built, in Swedish, and declares all fourteen screens, omitting no Konto control', () => {
    expect(entry.key).toBe('f')
    expect(entry.slug).toBe('f-samtal')
    expect(entry.name).toBe('Samtal')
    expect(entry.stub).toBeUndefined()
    expect(entry.traits.length).toBeGreaterThanOrEqual(4)
    expect(entry.risk).toMatch(/^Risk: /)
    expect(entry.references).not.toBe('')
    expect(entry.screens).toEqual(SCREENS)
    // Every Konto control is built (palette, font, density, coach, delete).
    expect(entry.omits).toBeUndefined()
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
      if (FRAMED.includes(s)) {
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
      if (s === 12) expect(screen.getByTestId('rd-lesson')).toBeInTheDocument()
      if (s === 13) expect(screen.getByTestId('rd-konto-identity')).toBeInTheDocument()
      if (s === 14) expect(screen.getByTestId('rd-elf-passage')).toBeInTheDocument()
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

  it('Idag: every part done says the plan is done, also before the plan’s own flag says so', () => {
    const base = fixtureDirectionData()
    const items = base.home.plan.items.map((i) => ({ ...i, completed: true }))
    const { actions } = mountWith(
      {
        ...base,
        home: {
          ...base.home,
          resume: null,
          plan: { ...base.home.plan, items, allComplete: false },
        },
      },
      1,
      width,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Dagens plan är klar. Vill du öva mer?',
    )
    key('Enter')
    expect(actions.go).toHaveBeenCalledWith('ova')
    expect(actions.openPlanItem).not.toHaveBeenCalled()
  })

  it.each([
    5, 6, 7, 8, 12, 13, 14,
  ] as const)('screen %s renders without the optional fields', (s) => {
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

  it('Idag → Öva → a section → Avsluta back to Öva → Repetera → its round and back → Provpass → Uppslag, built', async () => {
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
    expect(screen.getByTestId('rd-nav-provpass')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Det här passet har du sett minst.',
    )
    fireEvent.click(screen.getByTestId('rd-nav-uppslag'))
    expect(host).toHaveAttribute('data-screen', '12')
    expect(screen.queryByTestId('rd-not-built')).toBeNull()
    expect(screen.getByTestId('rd-nav-uppslag')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('rd-lesson')).toHaveTextContent(D.uppslag.open.title)
    // The door chosen: the page's question takes focus.
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 }))
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

// ── Batch 2: Provpass, Provpassresultat, Framsteg ────────────────────

const RUN = D.provpass.running
const HUB = D.provpass.hub
const RES = D.provpass.result
const FRAM = D.framsteg

/** The fixtures with the Provpass view changed by `patch`. */
function withProv(
  patch: (p: DirectionData['provpass']) => Partial<DirectionData['provpass']>,
): DirectionData {
  const base = fixtureDirectionData()
  return { ...base, provpass: { ...base.provpass, ...patch(base.provpass) } }
}

/** The fixtures, the running pass changed by `patch`. */
function withRunning(patch: Partial<ProvRunningView>): DirectionData {
  return withProv((p) => ({ running: { ...p.running, ...patch } }))
}

/** The fixtures, Framsteg changed by `patch`. */
function withFram(patch: Partial<DirectionData['framsteg']>): DirectionData {
  const base = fixtureDirectionData()
  return { ...base, framsteg: { ...base.framsteg, ...patch } }
}

/** Opens the enlarged page on question 29, the first DTK page, once the
 *  page has loaded; its opener has focus, as a click gives it. */
function inspectPage(): HTMLElement {
  fireEvent.click(cell(29))
  fireEvent.load(within(screen.getByTestId('rd-prov-figure')).getByRole('img'))
  const open = screen.getByRole('button', { name: 'Förstora figur' })
  open.focus()
  fireEvent.click(open)
  return open
}

/** The running pass's main region: inert while a gate or the enlarged page
 *  stands over it. */
function passMain(): Element | null {
  return screen.getByTestId('rd-prov-running').querySelector('.sa-pass-main')
}

/** Samtal on `data` at `s`, with spied actions. `update` serves new data
 *  (and a screen) to the same tree, as a provider re-render does. */
function mountOn(data: DirectionData, s: AppScreenKey, width: WidthKey) {
  const actions = spyActions()
  const tree = (d: DirectionData, at: AppScreenKey) => (
    <DirectionDataProvider data={d} actions={actions}>
      <Samtal screen={at} width={width} theme="light" live onScreen={() => {}} onTheme={() => {}} />
    </DirectionDataProvider>
  )
  const utils = render(tree(data, s))
  return {
    actions,
    update: (d: DirectionData, at: AppScreenKey = s) => utils.rerender(tree(d, at)),
  }
}

/** The hub's offer, through its gate (the opener focused, as a click does). */
function startOffer() {
  const start = screen.getByTestId('rd-prov-start')
  start.focus()
  fireEvent.click(start)
  fireEvent.click(screen.getByTestId('rd-confirm'))
}

/** "Fråga 17 · KVA": the question a running pass shows. */
function onQuestion(): string | null | undefined {
  return screen.getByTestId('rd-prov-running').querySelector('.sa-turn-label')?.textContent
}

function cell(n: number): HTMLElement {
  return within(screen.getByTestId('rd-prov-grid')).getByTestId(`rd-prov-cell-${n}`)
}

/** The running pass's action bar: the answer's receipt, or why there is
 *  none yet. */
function dockStatus(): string {
  return screen.getByTestId('rd-prov-running').querySelector('.sa-dock-status')?.textContent ?? ''
}

function rule(r: string): string {
  return r.charAt(0).toLocaleUpperCase('sv-SE') + r.slice(1)
}

/** The filled replies on show (a hidden tab panel's do not count). */
function primaries(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('.sa-chip--primary')].filter((el) =>
    visible(el),
  )
}

function weekOf(iso: string): string {
  return formatSwedishDateShort(new Date(iso))
}

describe.each(WIDTHS)('F · Samtal, %s: Provpass', (width) => {
  it('the hub: the coach offers the least-seen pass of the half that is next, attached with what was seen', () => {
    mountOn(fixtureDirectionData(), 9, width)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Det här passet har du sett minst.',
    )
    expect(
      screen.getByText(
        'Ditt senaste provpass var för sex dagar sedan. Nästa kvantitativa pass står på tur om en dag.',
      ),
    ).toBeInTheDocument()
    const offer = screen.getByTestId('rd-prov-pass-host-2025-kvant1')
    expect(offer).toHaveTextContent('Hösten 2025 · Provpass 1')
    expect(offer).toHaveTextContent('Sett förut: 6 av 40 frågor')
    expect(offer).toHaveTextContent('XYZ 12 · KVA 10 · NOG 6 · DTK 12')
    expect(screen.getByTestId('rd-prov-half-kvant')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('rd-prov-half-verbal')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('rd-prov-half-verbal')).toHaveTextContent('ORD · LÄS · MEK · ELF')
    // The other passes as a register, newest sitting first.
    expect(screen.getAllByTestId(/^rd-prov-pass-/).map((el) => el.dataset.testid)).toEqual([
      'rd-prov-pass-host-2025-kvant1',
      'rd-prov-pass-var-2026-kvant1',
      'rd-prov-pass-var-2026-kvant2',
      'rd-prov-pass-host-2025-kvant2',
    ])
    expect(screen.getByTestId('rd-prov-pass-var-2026-kvant1')).toHaveTextContent('sett 31 av 40')
    // The conditions are on the hub too, and one action leads.
    for (const r of HUB.rules) expect(screen.getByText(rule(r))).toBeInTheDocument()
    expect(primaries()).toHaveLength(1)
  })

  it('the hub: the other half offers its own least-seen pass; the rhythm speaks only of its half', () => {
    mountOn(fixtureDirectionData(), 9, width)
    fireEvent.click(screen.getByTestId('rd-prov-half-verbal'))
    expect(screen.getByTestId('rd-prov-half-verbal')).toHaveAttribute('aria-pressed', 'true')
    const offer = screen.getByTestId('rd-prov-pass-host-2025-verb2')
    expect(offer).toHaveTextContent('Hösten 2025 · Provpass 2')
    expect(offer).toHaveTextContent('Sett förut: 9 av 40 frågor')
    expect(offer).toHaveTextContent('ORD 10 · LÄS 10 · MEK 10 · ELF 10')
    expect(screen.queryByText(/står på tur/)).toBeNull()
  })

  it('the hub: the last results open their result', () => {
    const { actions } = mountOn(fixtureDirectionData(), 9, width)
    const first = HUB.results[0]
    fireEvent.click(
      screen.getByRole('button', {
        name: new RegExp(`^Verbal ${first.correct}/${first.presented}`),
      }),
    )
    expect(actions.openProvResult).toHaveBeenCalledWith(first.id)
  })

  it('the gate: the exact pass and its conditions; Inte nu and Esc back out with nothing started and the half kept', () => {
    const { actions } = mountOn(fixtureDirectionData(), 9, width)
    fireEvent.click(screen.getByTestId('rd-prov-half-verbal'))
    const start = screen.getByTestId('rd-prov-start')
    start.focus()
    fireEvent.click(start)
    const gate = screen.getByRole('dialog', { name: 'Hösten 2025 · Provpass 2' })
    expect(gate).toHaveTextContent('Verbal · 40 frågor · 55 minuter')
    for (const r of HUB.rules) expect(within(gate).getByText(rule(r))).toBeInTheDocument()
    expect(gate).toHaveTextContent('Facit och resultat får du när du har lämnat in.')
    // The question has focus; the frame under the gate is out of reach.
    expect(document.activeElement).toHaveTextContent('Hösten 2025 · Provpass 2')
    expect(screen.getByTestId('rd-nav-idag').closest('[inert]')).not.toBeNull()
    fireEvent.click(within(gate).getByRole('button', { name: 'Inte nu' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(actions.startProvpass).not.toHaveBeenCalled()
    expect(screen.getByTestId('rd-prov-half-verbal')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('rd-nav-idag').closest('[inert]')).toBeNull()
    expect(document.activeElement).toBe(start)
    // Esc backs out the same way.
    fireEvent.click(start)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    key('Escape')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(actions.startProvpass).not.toHaveBeenCalled()
    // Enter on the hub opens the gate for the offer.
    key('Enter')
    expect(screen.getByRole('dialog', { name: 'Hösten 2025 · Provpass 2' })).toBeInTheDocument()
  })

  it('the gate: Starta nu starts the offered pass, and it runs in focus mode with its clock', () => {
    const { actions } = mountOn(fixtureDirectionData(), 9, width)
    startOffer()
    expect(actions.startProvpass).toHaveBeenCalledWith(RUN.passId)
    expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
    expect(screen.queryByTestId('rd-nav-idag')).toBeNull()
    expect(screen.queryByTestId('rd-account')).toBeNull()
    expect(screen.getByTestId('rd-exit')).toHaveTextContent('Avbryt provpass')
    expect(screen.getByTestId('rd-prov-timer')).toHaveTextContent('31:12 kvar')
    expect(screen.getByTestId('rd-prov-running')).toHaveTextContent('Fråga 17 av 40')
    expect(screen.getAllByText('16 av 40 besvarade').length).toBeGreaterThan(0)
    expect(onQuestion()).toBe('Fråga 17 · KVA')
    // The question takes focus after the start.
    expect(document.activeElement).toBe(
      screen.getByTestId('rd-prov-running').querySelector('.sa-turn--pass'),
    )
  })

  it('a pass in the register goes through the same gate; one the host does not run says so and leads back', () => {
    const { actions } = mountOn(fixtureDirectionData(), 9, width)
    fireEvent.click(screen.getByTestId('rd-prov-pass-var-2026-kvant1'))
    const gate = screen.getByRole('dialog', { name: 'Våren 2026 · Provpass 1' })
    fireEvent.click(within(gate).getByTestId('rd-confirm'))
    expect(actions.startProvpass).toHaveBeenCalledWith('var-2026:kvant1')
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
    expect(screen.getByTestId('rd-prov-unavailable')).toHaveTextContent(
      'Våren 2026 · Provpass 1 kan inte öppnas här just nu.',
    )
    fireEvent.click(screen.getByRole('button', { name: /^Till Provpass/ }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Det här passet har du sett minst.',
    )
  })

  it('a half without passes says so and offers the other half', () => {
    mountOn(
      withProv((p) => ({
        hub: { ...p.hub, passes: p.hub.passes.filter((x) => x.half === 'kvant') },
      })),
      9,
      width,
    )
    fireEvent.click(screen.getByTestId('rd-prov-half-verbal'))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Det finns inget riktigt verbalt pass att göra just nu.',
    )
    expect(screen.queryByTestId('rd-prov-start')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /^Visa kvantitativa pass/ }))
    expect(screen.getByTestId('rd-prov-half-kvant')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('rd-prov-start')).toBeInTheDocument()
  })

  it('with no pass in either half there is nothing to start, and the way on is Öva', () => {
    const { actions } = mountOn(
      withProv((p) => ({ hub: { ...p.hub, passes: [] } })),
      9,
      width,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Det finns inget riktigt kvantitativt pass att göra just nu.',
    )
    expect(screen.queryByTestId('rd-prov-start')).toBeNull()
    expect(screen.getByText('Passen visas här när frågebanken har dem.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Till Öva/ }))
    expect(actions.go).toHaveBeenCalledWith('ova')
    expect(actions.startProvpass).not.toHaveBeenCalled()
  })

  it('a short pass names what is missing before it starts', () => {
    mountOn(
      withProv((p) => ({
        hub: {
          ...p.hub,
          passes: p.hub.passes.map((x) => (x.id === RUN.passId ? { ...x, presented: 38 } : x)),
        },
      })),
      9,
      width,
    )
    const said = '2 frågor saknas i det här passet, så det rättas av 38.'
    expect(screen.getByTestId('rd-prov-pass-host-2025-kvant1')).toHaveTextContent(said)
    fireEvent.click(screen.getByTestId('rd-prov-start'))
    expect(screen.getByRole('dialog')).toHaveTextContent(said)
    expect(screen.getByRole('dialog')).toHaveTextContent('Kvantitativ · 38 frågor · 55 minuter')
  })

  it('the hub: the last half chosen, then a provider with one half left — the hub shows a half it can name', () => {
    const { update } = mountOn(fixtureDirectionData(), 9, width)
    fireEvent.click(screen.getByTestId('rd-prov-half-verbal'))
    fireEvent.click(screen.getByTestId('rd-prov-half-kvant'))
    update(withProv((p) => ({ hub: { ...p.hub, halves: p.hub.halves.slice(0, 1) } })))
    expect(screen.queryByTestId('rd-prov-half-kvant')).toBeNull()
    expect(screen.getByTestId('rd-prov-half-verbal')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('rd-prov-pass-host-2025-verb2')).toHaveTextContent(
      'Hösten 2025 · Provpass 2',
    )
    expect(screen.queryByTestId('rd-prov-pass-host-2025-kvant1')).toBeNull()
  })

  it('the gate for the last pass in the register stays whole when the register shrinks under it; starting it is the host’s call', () => {
    const { actions, update } = mountOn(fixtureDirectionData(), 9, width)
    const register = screen.getAllByTestId(/^rd-prov-pass-/)
    fireEvent.click(register[register.length - 1])
    const name = 'Hösten 2025 · Provpass 2'
    expect(screen.getByRole('dialog', { name })).toBeInTheDocument()
    update(
      withProv((p) => ({
        hub: { ...p.hub, passes: p.hub.passes.filter((x) => x.id !== 'host-2025:kvant2') },
      })),
    )
    expect(screen.getByRole('dialog', { name })).toHaveTextContent(
      'Kvantitativ · 40 frågor · 55 minuter',
    )
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(actions.startProvpass).toHaveBeenCalledWith('host-2025:kvant2')
    expect(screen.getByTestId('rd-prov-unavailable')).toHaveTextContent(
      'kan inte öppnas här just nu',
    )
  })

  it('running: a choice is the answer at once and stays changeable; nothing is graded or explained', () => {
    const { actions } = mountOn(fixtureDirectionData(), 9, width)
    startOffer()
    fireEvent.click(screen.getByTestId('rd-prov-option-B'))
    expect(screen.getByTestId('rd-prov-option-B')).toHaveAttribute('aria-pressed', 'true')
    expect(dockStatus()).toContain('Ditt svar: B')
    expect(cell(17)).toHaveAttribute('data-answered', 'true')
    expect(cell(17)).toHaveTextContent('B')
    fireEvent.click(screen.getByTestId('rd-prov-option-D'))
    expect(screen.getByTestId('rd-prov-option-B')).toHaveAttribute('aria-pressed', 'false')
    expect(cell(17)).toHaveTextContent('D')
    expect(actions.drill.lock).not.toHaveBeenCalled()
    expect(screen.queryByTestId('rd-verdict')).toBeNull()
    expect(screen.queryByTestId('rd-lock')).toBeNull()
    expect(screen.getByTestId('rd-prov-running')).not.toHaveTextContent(/Rätt\.|Fel\./)
    expect(actions.submitProvpass).not.toHaveBeenCalled()
  })

  it('running: Nästa and Föregående move without grading; the overview goes to any question and says each one’s state', () => {
    mountOn(fixtureDirectionData(), 9, width)
    startOffer()
    fireEvent.click(screen.getByTestId('rd-prov-next'))
    expect(onQuestion()).toBe('Fråga 18 · KVA')
    expect(cell(18)).toHaveAttribute('data-current', 'true')
    expect(cell(18)).toHaveAttribute('aria-current', 'step')
    expect(cell(17)).toHaveAttribute('data-current', 'false')
    fireEvent.click(screen.getByRole('button', { name: /^Föregående/ }))
    expect(onQuestion()).toBe('Fråga 17 · KVA')
    fireEvent.click(cell(1))
    expect(onQuestion()).toBe('Fråga 1 · XYZ')
    expect(screen.getByRole('button', { name: /^Föregående/ })).toBeDisabled()
    // A flagged, answered cell says both; an unanswered one says so.
    expect(cell(9)).toHaveAccessibleName(/^Fråga 9, XYZ, svar [A-E], markerad$/)
    expect(cell(30)).toHaveAccessibleName('Fråga 30, DTK, obesvarad')
    expect(cell(1)).toHaveAccessibleName(/, här nu$/)
    fireEvent.click(screen.getByRole('button', { name: 'Visa svarsöversikt' }))
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Svarsöversikt' }))
  })

  it('running: the last question reviews before the hand-in; the gate leads back to what is unanswered', () => {
    const answers = Object.fromEntries(RUN.questions.slice(0, 39).map((q) => [q.qid, q.answer]))
    const { actions } = mountOn(withRunning({ answers, current: 38 }), 9, width)
    startOffer()
    expect(screen.getByTestId('rd-prov-next')).toHaveTextContent('Nästa fråga')
    fireEvent.click(screen.getByTestId('rd-prov-next'))
    expect(onQuestion()).toBe('Fråga 40 · DTK')
    expect(screen.getByTestId('rd-prov-next')).toHaveTextContent('Granska svar')
    fireEvent.click(screen.getByTestId('rd-prov-next'))
    const gate = screen.getByRole('dialog', { name: 'Lämna in passet?' })
    expect(gate).toHaveTextContent('En fråga är obesvarad: fråga 40.')
    expect(gate).toHaveTextContent('39 av 40 besvarade')
    expect(actions.submitProvpass).not.toHaveBeenCalled()
    fireEvent.click(within(gate).getByRole('button', { name: 'Tillbaka till passet' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Fråga 40' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onQuestion()).toBe('Fråga 40 · DTK')
    expect(actions.submitProvpass).not.toHaveBeenCalled()
  })

  it.each([
    [40, 'Alla 40 frågor är besvarade.'],
    [38, '2 frågor är obesvarade. Fel ger inga avdrag, så ett svar är bättre än inget.'],
  ])('running: with %s answered, the hand-in gate says so', (n, said) => {
    const answers = Object.fromEntries(RUN.questions.slice(0, n).map((q) => [q.qid, q.answer]))
    mountOn(withRunning({ answers }), 9, width)
    startOffer()
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    expect(screen.getByRole('dialog', { name: 'Lämna in passet?' })).toHaveTextContent(said)
  })

  it('running: Lämna in hands the pass in once, and the answers are locked while it goes', () => {
    const { actions } = mountOn(fixtureDirectionData(), 9, width)
    startOffer()
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
    const handing = screen.getByTestId('rd-prov-handing')
    expect(handing).toHaveTextContent('Lämnar in …')
    expect(handing).toHaveTextContent('16 av 40 frågor besvarade.')
    key('a')
    key('Enter')
    expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
  })

  it('running: handed in, the pass lets go — the frame and its doors come back, its word has focus, and the keys are free again', () => {
    const { actions } = mountOn(fixtureDirectionData(), 9, width)
    startOffer()
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    const handing = screen.getByTestId('rd-prov-handing')
    expect(document.activeElement).toBe(
      within(handing).getByRole('heading', { level: 1, name: 'Lämnar in …' }),
    )
    for (const d of DESTINATIONS) {
      expect(screen.getByTestId(`rd-nav-${d.id}`).closest('[inert]')).toBeNull()
    }
    expect(screen.getByTestId('rd-nav-provpass')).toHaveAttribute('aria-current', 'page')
    // No key scope and no capture of its own: the switcher's keys pass.
    expect(document.querySelector('[data-rd-keyscope]')).toBeNull()
    for (const k of ['1', '0', 'ArrowLeft', 'ArrowRight']) {
      expect(fireEvent.keyDown(window, { key: k })).toBe(true)
    }
    expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
  })

  it('running: a hand-in the host refuses later (its promise rejects) is said, with the answers as they stood, read-only; it is sent once', async () => {
    const { actions } = mountOn(fixtureDirectionData(), 9, width)
    vi.mocked(actions.submitProvpass).mockImplementation(() => Promise.reject(new Error('offline')))
    startOffer()
    fireEvent.click(screen.getByTestId('rd-prov-option-B'))
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(screen.getByTestId('rd-prov-handing')).toHaveTextContent('Lämnar in …')
    await act(async () => {})
    expect(screen.queryByTestId('rd-prov-handing')).toBeNull()
    const failed = screen.getByTestId('rd-prov-failed')
    expect(within(failed).getByRole('heading', { level: 1 })).toHaveTextContent(
      'Passet kunde inte lämnas in.',
    )
    expect(within(failed).getByRole('alert')).toHaveTextContent(
      'Något gick fel när passet skulle lämnas in',
    )
    const record = within(failed).getByTestId('rd-prov-record')
    expect(record).toHaveTextContent('17 av 40 besvarade · 2 markerade')
    expect(within(record).getByText('Fråga 17, KVA, svar B')).toBeInTheDocument()
    expect(within(record).getByText('Fråga 30, DTK, obesvarad')).toBeInTheDocument()
    expect(within(record).queryAllByRole('button')).toHaveLength(0)
    key('Enter')
    expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
  })

  it('running: giving up asks first and says what it costs; Esc and Fortsätt passet keep the pass', () => {
    const { actions } = mountOn(fixtureDirectionData(), 9, width)
    startOffer()
    fireEvent.click(screen.getByTestId('rd-exit'))
    const gate = screen.getByRole('dialog', { name: 'Avbryta provpasset?' })
    expect(gate).toHaveTextContent('Avbryter du blir provet ogiltigt')
    key('Escape')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-exit'))
    fireEvent.click(screen.getByRole('button', { name: 'Fortsätt passet' }))
    expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-exit'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
    expect(screen.getByText('Provpasset avbröts och blev ogiltigt.')).toBeInTheDocument()
    expect(screen.getByTestId('rd-prov-start')).toBeInTheDocument()
    expect(actions.submitProvpass).not.toHaveBeenCalled()
  })

  it('running: a–e answer only the question’s letters, from a focused control too; ←/→ and Enter move; Space waits for an answer; Esc stays', () => {
    mountOn(fixtureDirectionData(), 9, width)
    startOffer()
    // Question 17 is KVA: A–D, no E.
    key('e')
    expect(dockStatus()).not.toContain('Ditt svar')
    key('c')
    expect(dockStatus()).toContain('Ditt svar: C')
    // From a focused cell the letters still answer, and the cell keeps the arrows.
    cell(5).focus()
    fireEvent.keyDown(cell(5), { key: 'a' })
    expect(dockStatus()).toContain('Ditt svar: A')
    fireEvent.keyDown(cell(5), { key: 'ArrowRight' })
    expect(onQuestion()).toBe('Fråga 17 · KVA')
    // From the page the arrows move.
    key('ArrowRight')
    expect(onQuestion()).toBe('Fråga 18 · KVA')
    key('ArrowLeft')
    expect(onQuestion()).toBe('Fråga 17 · KVA')
    key('Enter')
    expect(onQuestion()).toBe('Fråga 18 · KVA')
    key(' ')
    expect(onQuestion()).toBe('Fråga 18 · KVA')
    key('b')
    key(' ')
    expect(onQuestion()).toBe('Fråga 19 · KVA')
    // NOG has its E.
    fireEvent.click(cell(23))
    key('e')
    expect(dockStatus()).toContain('Ditt svar: E')
    key('Escape')
    expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('running: the flag marks the question in the overview; a pass without flags has none', () => {
    const { update } = mountOn(fixtureDirectionData(), 9, width)
    startOffer()
    const flag = screen.getByTestId('rd-prov-flag')
    expect(flag).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(flag)
    expect(screen.getByTestId('rd-prov-flag')).toHaveAttribute('aria-pressed', 'true')
    expect(cell(17)).toHaveAttribute('data-flagged', 'true')
    expect(cell(17)).toHaveAccessibleName(/markerad/)
    // A pass whose data carries no flags (the real runner has none).
    const noFlags = withProv(({ running: { flags: _flags, ...rest } }) => ({ running: rest }))
    update(noFlags)
    expect(screen.queryByTestId('rd-prov-flag')).toBeNull()
    expect(cell(9)).not.toHaveAttribute('data-flagged')
    expect(cell(9)).not.toHaveAccessibleName(/markerad/)
  })

  it('running: a list that shrinks under the reader keeps a real question on screen', () => {
    const { update } = mountOn(fixtureDirectionData(), 9, width)
    startOffer()
    fireEvent.click(cell(40))
    expect(onQuestion()).toBe('Fråga 40 · DTK')
    update(withRunning({ questions: RUN.questions.slice(0, 30), grid: RUN.grid.slice(0, 30) }))
    expect(onQuestion()).toBe('Fråga 30 · DTK')
    expect(within(screen.getByTestId('rd-prov-grid')).queryByTestId('rd-prov-cell-31')).toBeNull()
    expect(screen.getByTestId('rd-prov-next')).toHaveTextContent('Granska svar')
  })

  it('a new sitting from the provider ends the run instead of showing another pass’s questions', () => {
    const { update } = mountOn(fixtureDirectionData(), 9, width)
    startOffer()
    update(withRunning({ passId: 'host-2025:kvant2' }))
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
    expect(screen.getByTestId('rd-prov-unavailable')).toHaveTextContent(
      'kan inte öppnas här just nu',
    )
  })

  it('a pass without questions never starts a clock', () => {
    const { actions } = mountOn(withRunning({ questions: [], grid: [] }), 9, width)
    startOffer()
    expect(screen.getByTestId('rd-prov-unavailable')).toHaveTextContent(
      'Passet har inga frågor att visa.',
    )
    expect(screen.queryByTestId('rd-prov-timer')).toBeNull()
    expect(actions.submitProvpass).not.toHaveBeenCalled()
  })

  it('running: a DTK page holds the answer while it loads and once it fails, until a real retry has loaded; its neighbours on the page keep it', () => {
    mountOn(fixtureDirectionData(), 9, width)
    startOffer()
    const page = () => within(screen.getByTestId('rd-prov-figure')).getByRole('img')
    fireEvent.click(cell(29))
    expect(page()).toHaveAccessibleName('Underlag till uppgift 29')
    expect(dockStatus()).toBe('Underlaget laddas – du kan svara när det syns.')
    expect(screen.getByTestId('rd-prov-option-A')).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(screen.getByTestId('rd-prov-option-A'))
    key('b')
    expect(cell(29)).toHaveAttribute('data-answered', 'false')
    fireEvent.load(page())
    fireEvent.click(screen.getByTestId('rd-prov-option-A'))
    expect(cell(29)).toHaveTextContent('A')
    // The next question reads the same page: it is there already.
    fireEvent.click(screen.getByTestId('rd-prov-next'))
    expect(onQuestion()).toBe('Fråga 30 · DTK')
    key('c')
    expect(cell(30)).toHaveTextContent('C')
    // A page shown again is a load of its own.
    fireEvent.click(cell(17))
    fireEvent.click(cell(31))
    expect(dockStatus()).toBe('Underlaget laddas – du kan svara när det syns.')
    fireEvent.load(page())
    // A new page is a new load; one that fails stops the answer, and the
    // retry is waited for again.
    fireEvent.click(cell(32))
    expect(dockStatus()).toBe('Underlaget laddas – du kan svara när det syns.')
    fireEvent.error(page())
    expect(dockStatus()).toBe('Underlaget gick inte att ladda, så frågan kan inte besvaras.')
    key('a')
    expect(cell(32)).toHaveAttribute('data-answered', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'Försök igen' }))
    expect(dockStatus()).toBe('Underlaget laddas – du kan svara när det syns.')
    key('a')
    expect(cell(32)).toHaveAttribute('data-answered', 'false')
    fireEvent.load(page())
    key('a')
    expect(cell(32)).toHaveTextContent('A')
    // The failure stayed with its page: the next page loads as new.
    fireEvent.click(cell(35))
    expect(dockStatus()).toBe('Underlaget laddas – du kan svara när det syns.')
  })

  it('running: a page or a diagram the browser already holds is ready at once', () => {
    const restore = cachedImages()
    try {
      mountOn(fixtureDirectionData(), 9, width)
      startOffer()
      fireEvent.click(cell(35))
      key('d')
      expect(cell(35)).toHaveTextContent('D')
      fireEvent.click(cell(21))
      key('b')
      expect(cell(21)).toHaveTextContent('B')
    } finally {
      restore()
    }
  })

  it('running: a diagram and the options’ images hold the answer until they are there', () => {
    const images = RUN.questions.map((q, i) => (i === 16 ? withOptionImages(q) : q))
    mountOn(withRunning({ questions: images }), 9, width)
    startOffer()
    expect(dockStatus()).toBe('Bilderna till svarsalternativen laddas – du kan svara när de syns.')
    key('a')
    expect(cell(17)).toHaveAttribute('data-answered', 'false')
    const pictures = screen.getAllByRole('img', { name: /^Diagram [A-D]$/ })
    fireEvent.error(pictures[0])
    expect(dockStatus()).toBe(
      'Bilden till alternativ A gick inte att ladda, så frågan kan inte besvaras.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Försök igen' }))
    for (const img of screen.getAllByRole('img', { name: /^Diagram [A-D]$/ })) fireEvent.load(img)
    key('a')
    expect(cell(17)).toHaveTextContent('A')
    // Question 21's diagram (KVA-021) is waited for too.
    fireEvent.click(cell(21))
    expect(dockStatus()).toBe('Figuren laddas – du kan svara när den syns.')
    key('b')
    expect(cell(21)).toHaveAttribute('data-answered', 'false')
    fireEvent.load(screen.getByRole('img', { name: 'Figur till uppgift 21' }))
    key('b')
    expect(cell(21)).toHaveTextContent('B')
  })

  it.each([
    'Escape',
    'Stäng figur',
  ])('running: the enlarged page closed with %s gives focus back to "Förstora figur", the pass in reach again', (how) => {
    mountOn(fixtureDirectionData(), 9, width)
    startOffer()
    inspectPage()
    const dialog = screen.getByRole('dialog')
    const close = within(dialog).getByRole('button', { name: 'Stäng figur' })
    expect(document.activeElement).toBe(close)
    expect(passMain()).toHaveAttribute('inert')
    if (how === 'Escape') fireEvent.keyDown(close, { key: 'Escape' })
    else fireEvent.click(close)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(passMain()).not.toHaveAttribute('inert')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Förstora figur' }))
    expect(onQuestion()).toBe('Fråga 29 · DTK')
  })

  it('running: when the enlarged page’s question goes from under it, the page closes, the pass is in reach and the question has focus', () => {
    const { update } = mountOn(fixtureDirectionData(), 9, width)
    startOffer()
    inspectPage()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    // The provider's list shrinks to twenty: question 29 and its page are gone.
    update(withRunning({ questions: RUN.questions.slice(0, 20), grid: RUN.grid.slice(0, 20) }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onQuestion()).toBe('Fråga 20 · KVA')
    expect(passMain()).not.toHaveAttribute('inert')
    expect(document.activeElement).toBe(
      screen.getByTestId('rd-prov-running').querySelector('.sa-turn--pass'),
    )
  })

  describe('the clock', () => {
    afterEach(() => vi.useRealTimers())

    it('hands the pass in once when it runs out, and never again', () => {
      vi.useFakeTimers()
      const { actions } = mountOn(withRunning({ remainingSeconds: 3 }), 9, width)
      startOffer()
      expect(screen.getByTestId('rd-prov-timer')).toHaveTextContent('00:03')
      act(() => {
        vi.advanceTimersByTime(2000)
      })
      expect(screen.getByTestId('rd-prov-timer')).toHaveTextContent('00:01')
      expect(actions.submitProvpass).not.toHaveBeenCalled()
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('rd-prov-handing')).toHaveTextContent('Tiden är ute.')
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
    })

    it('a provider whose clock ticks to zero hands the pass in once — it never voids a live pass', () => {
      vi.useFakeTimers()
      const { actions, update } = mountOn(withRunning({ remainingSeconds: 60 }), 9, width)
      startOffer()
      update(withRunning({ remainingSeconds: 30 }))
      expect(screen.getByTestId('rd-prov-timer')).toHaveTextContent('00:30')
      update(withRunning({ remainingSeconds: 0 }))
      expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
      expect(screen.queryByTestId('rd-prov-unavailable')).toBeNull()
      expect(screen.getByTestId('rd-prov-handing')).toBeInTheDocument()
      update(withRunning({ remainingSeconds: 0 }))
      act(() => {
        vi.advanceTimersByTime(3000)
      })
      expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
    })

    it('runs through the gates', () => {
      vi.useFakeTimers()
      mountOn(fixtureDirectionData(), 9, width)
      startOffer()
      fireEvent.click(screen.getByTestId('rd-prov-submit'))
      act(() => {
        vi.advanceTimersByTime(2000)
      })
      expect(screen.getByRole('dialog')).toHaveTextContent('31:10 kvar')
      fireEvent.click(screen.getByRole('button', { name: 'Tillbaka till passet' }))
      expect(screen.getByTestId('rd-prov-timer')).toHaveTextContent('31:10')
    })

    it('runs out under the enlarged page: the page closes, the pass is handed in once and the hand-in’s word has focus', () => {
      vi.useFakeTimers()
      const { actions } = mountOn(withRunning({ remainingSeconds: 3 }), 9, width)
      startOffer()
      inspectPage()
      act(() => {
        vi.advanceTimersByTime(3000)
      })
      expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(document.activeElement).toBe(
        screen.getByRole('heading', { level: 1, name: 'Lämnar in …' }),
      )
    })

    it('a pass already out of time when it starts cannot continue and makes no result', () => {
      const { actions } = mountOn(withRunning({ remainingSeconds: 0 }), 9, width)
      startOffer()
      expect(screen.getByTestId('rd-prov-unavailable')).toHaveTextContent(
        'Tiden för det här passet har redan gått ut.',
      )
      expect(actions.submitProvpass).not.toHaveBeenCalled()
      fireEvent.click(screen.getByRole('button', { name: /^Till Provpass/ }))
      expect(screen.getByTestId('rd-prov-start')).toBeInTheDocument()
    })
  })
})

describe.each(WIDTHS)('F · Samtal in the bake-off, %s: Provpass', (width) => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(1440)
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(848)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  /** The host's hand-in made to fail: while armed, the next request for
   *  screen 10 — the one the bake-off's submitProvpass makes — throws, once.
   *  Every screen asked for is kept. */
  type Fault = { armed: boolean; asked: AppScreenKey[] }

  function Host({
    s = 9,
    bare = true,
    fault,
  }: {
    s?: AppScreenKey
    bare?: boolean
    fault?: Fault
  }) {
    const [sel, setSel] = useState<Selection>({
      d: 'f',
      s,
      w: width,
      t: 'light',
      sbs: false,
      bare,
    })
    return (
      <div data-testid="host" data-screen={sel.s} data-direction={sel.d} data-sbs={String(sel.sbs)}>
        <Redesign2026Bakeoff
          sel={sel}
          onSelect={(next) => {
            if (fault && next.s != null) fault.asked.push(next.s)
            if (fault?.armed && next.s === 10) {
              fault.armed = false
              throw new Error('Inlämningen nådde inte fram.')
            }
            setSel((x) => ({ ...x, ...next }))
          }}
        />
      </div>
    )
  }

  /** Through the real host: the offered pass started, then handed in — by
   *  the reader through the hand-in gate, or by the clock at zero — and the
   *  host's submitProvpass throws. `handIns` counts the host's hand-ins. */
  async function refusedHandIn(by: 'reader' | 'time') {
    const fault: Fault = { armed: true, asked: [] }
    render(<Host fault={fault} />)
    await screen.findByTestId('rd-samtal', {}, { timeout: 5000 })
    if (by === 'time') vi.useFakeTimers()
    startOffer()
    if (by === 'reader') {
      fireEvent.click(screen.getByTestId('rd-prov-submit'))
      fireEvent.click(screen.getByTestId('rd-confirm'))
    } else {
      act(() => {
        vi.setSystemTime(Date.now() + RUN.remainingSeconds * 1000)
        vi.advanceTimersByTime(1000)
      })
    }
    return {
      host: screen.getByTestId('host'),
      handIns: () => fault.asked.filter((s) => s === 10).length,
    }
  }

  /** The bake-off's own running pass with a reading question where the
   *  reader stands (question 17): the fixtures run a quantitative pass,
   *  which has no passage. The real host still renders and switches; only
   *  the answer of its data hook is changed (vi.restoreAllMocks undoes it). */
  function readingInHostPass() {
    const real = kit.useBakeoffDirectionData
    const reading = D.drills.reading.questions[0]
    const served = new WeakMap<DirectionData, DirectionData>()
    vi.spyOn(kit, 'useBakeoffDirectionData').mockImplementation((args) => {
      const value = real(args)
      let data = served.get(value.data)
      if (!data) {
        const { running } = value.data.provpass
        data = {
          ...value.data,
          provpass: {
            ...value.data.provpass,
            running: {
              ...running,
              questions: running.questions.map((q, i) => (i === running.current ? reading : q)),
            },
          },
        }
        served.set(value.data, data)
      }
      return { ...value, data }
    })
  }

  it('the switcher’s digits and arrows never leave a running pass, wherever focus is', async () => {
    render(<Host />)
    await screen.findByTestId('rd-samtal', {}, { timeout: 5000 })
    startOffer()
    const host = screen.getByTestId('host')
    const targets = [
      () => screen.getByTestId('rd-prov-option-A'),
      () => cell(3),
      () => screen.getByTestId('rd-prov-running').querySelector<HTMLElement>('.sa-turn--pass'),
      () => document.body,
    ]
    for (const target of targets) {
      for (const k of ['1', '5', '8', '0', 'ArrowLeft', 'ArrowRight']) {
        const el = target()
        if (!el) throw new Error('no target to press keys on')
        el.focus()
        fireEvent.keyDown(el, { key: k })
        expect(host).toHaveAttribute('data-screen', '9')
        expect(host).toHaveAttribute('data-direction', 'f')
        expect(host).toHaveAttribute('data-sbs', 'false')
        expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
      }
    }
  })

  it('Provpass → the gate → the running pass → hand-in → its result; Till Öva opens Öva', async () => {
    render(<Host s={1} />)
    await screen.findByTestId('rd-samtal', {}, { timeout: 5000 })
    const host = screen.getByTestId('host')
    fireEvent.click(screen.getByTestId('rd-nav-provpass'))
    expect(host).toHaveAttribute('data-screen', '9')
    startOffer()
    expect(host).toHaveAttribute('data-screen', '9')
    expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(host).toHaveAttribute('data-screen', '10')
    expect(screen.getByTestId('rd-prov-result')).toHaveTextContent('Klart. 27 av 40 rätt.')
    expect(screen.getByTestId('rd-nav-provpass')).toHaveAttribute('aria-current', 'page')
    fireEvent.click(screen.getByRole('button', { name: /^Till Öva/ }))
    expect(host).toHaveAttribute('data-screen', '5')
  })

  it('a move to another screen ends the run: Provpass opens on its hub again, its word on a given-up pass said once', async () => {
    render(<Host bare={false} />)
    await screen.findByTestId('rd-samtal', {}, { timeout: 5000 })
    const host = screen.getByTestId('host')
    startOffer()
    expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
    // The bar stands outside the pass: its screen buttons still move.
    fireEvent.click(screen.getByRole('button', { name: 'Nästa skärm' }))
    expect(host).toHaveAttribute('data-screen', '10')
    fireEvent.click(screen.getByRole('button', { name: 'Föregående skärm' }))
    expect(host).toHaveAttribute('data-screen', '9')
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
    expect(screen.getByTestId('rd-prov-start')).toBeInTheDocument()
    // Given up, the hub says so — once.
    startOffer()
    fireEvent.click(screen.getByTestId('rd-exit'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(screen.getByText('Provpasset avbröts och blev ogiltigt.')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-nav-framsteg'))
    expect(host).toHaveAttribute('data-screen', '11')
    fireEvent.click(screen.getByTestId('rd-nav-provpass'))
    expect(screen.queryByText('Provpasset avbröts och blev ogiltigt.')).toBeNull()
  })

  it.each([
    'reader',
    'time',
  ] as const)('handed in by the %s and refused by the host: the error, the answers as they stood and the doors; nothing is sent again; the switcher’s keys work again', async (by) => {
    const { host, handIns } = await refusedHandIn(by)
    expect(handIns()).toBe(1)
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
    const failed = screen.getByTestId('rd-prov-failed')
    const heading = within(failed).getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Passet kunde inte lämnas in.')
    expect(within(failed).getByRole('alert')).toHaveTextContent(
      'Något gick fel när passet skulle lämnas in',
    )
    if (by === 'time') expect(failed).toHaveTextContent('Tiden är ute.')
    // The answers as they stood, read-only.
    const record = within(failed).getByTestId('rd-prov-record')
    expect(record).toHaveTextContent('16 av 40 besvarade · 2 markerade')
    expect(within(record).getAllByRole('listitem')).toHaveLength(RUN.questions.length)
    expect(within(record).getByText(/^Fråga 9, XYZ, svar [A-E], markerad$/)).toBeInTheDocument()
    expect(within(record).getByText('Fråga 17, KVA, obesvarad')).toBeInTheDocument()
    expect(within(record).queryAllByRole('button')).toHaveLength(0)
    // The frame is back with its doors in reach, the heading in focus.
    for (const d of DESTINATIONS) {
      expect(screen.getByTestId(`rd-nav-${d.id}`).closest('[inert]')).toBeNull()
    }
    expect(document.activeElement).toBe(heading)
    // Nothing hands it in again: not a letter, not the clock.
    key('a')
    if (by === 'time') {
      act(() => {
        vi.advanceTimersByTime(5000)
      })
    }
    expect(handIns()).toBe(1)
    // The switcher's keys reach the switcher again, from the page too.
    fireEvent.keyDown(heading, { key: 'ArrowRight' })
    expect(host).toHaveAttribute('data-screen', '10')
    expect(screen.getByTestId('rd-prov-result')).toBeInTheDocument()
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' })
    expect(host).toHaveAttribute('data-screen', '9')
    expect(screen.queryByTestId('rd-prov-failed')).toBeNull()
    expect(screen.getByTestId('rd-prov-start')).toBeInTheDocument()
    fireEvent.keyDown(document.body, { key: '2' })
    expect(host).toHaveAttribute('data-direction', 'b')
  })

  it.each([
    ['reader', 'Till Provpass'],
    ['time', 'Till Provpass'],
    ['reader', 'Enter'],
    ['time', 'Enter'],
    ['reader', 'the Provpass door'],
    ['time', 'the Provpass door'],
  ] as const)('handed in by the %s and refused: %s is the way out to the hub, whose question takes focus; the doors lead on', async (by, way) => {
    const { host, handIns } = await refusedHandIn(by)
    if (way === 'Enter') key('Enter')
    else if (way === 'the Provpass door') fireEvent.click(screen.getByTestId('rd-nav-provpass'))
    else fireEvent.click(screen.getByRole('button', { name: /^Till Provpass/ }))
    expect(screen.queryByTestId('rd-prov-failed')).toBeNull()
    const lead = screen.getByRole('heading', { level: 1 })
    expect(lead).toHaveTextContent('Det här passet har du sett minst.')
    expect(document.activeElement).toBe(lead)
    expect(host).toHaveAttribute('data-screen', '9')
    expect(handIns()).toBe(1)
    fireEvent.click(screen.getByTestId('rd-nav-framsteg'))
    expect(host).toHaveAttribute('data-screen', '11')
  })

  it('a scroll pane with focus keeps its arrows, with Shift too, and Space — they scroll it natively and leave the question — while the digits and 0 never leave the pass', async () => {
    readingInHostPass()
    render(<Host />)
    await screen.findByTestId('rd-samtal', {}, { timeout: 5000 })
    const host = screen.getByTestId('host')
    startOffer()
    expect(onQuestion()).toBe('Fråga 17 · LÄS')
    // Answered, so that Space would move on outside a pane.
    key('a')
    expect(dockStatus()).toContain('Ditt svar: A')
    const running = screen.getByTestId('rd-prov-running')
    // Desktop: the passage beside the question and the conversation's own
    // column; phone: the pass's one scroll. (jsdom focuses only what has a
    // tabindex; the keys go to the pane either way, as a browser sends them
    // to a scroll pane that has focus.)
    const panes =
      width === 'desktop'
        ? [
            screen.getByTestId('rd-prov-passage'),
            running.querySelector<HTMLElement>('.sa-thread--pass'),
          ]
        : [running.querySelector<HTMLElement>('.sa-ppass-scroll')]
    for (const pane of panes) {
      if (!pane) throw new Error('no scroll pane')
      pane.focus()
      // The passage is a stop of its own, so a keyboard can reach and scroll it.
      if (pane.dataset.testid === 'rd-prov-passage') expect(document.activeElement).toBe(pane)
      for (const init of [
        { key: 'ArrowRight' },
        { key: 'ArrowLeft' },
        { key: 'ArrowRight', shiftKey: true },
        { key: 'ArrowLeft', shiftKey: true },
        { key: ' ' },
      ]) {
        // Not prevented: the pane scrolls, or selects, as it would anywhere.
        expect(fireEvent.keyDown(pane, init)).toBe(true)
        expect(onQuestion()).toBe('Fråga 17 · LÄS')
        expect(host).toHaveAttribute('data-screen', '9')
      }
      for (const k of ['1', '5', '8', '0']) {
        expect(fireEvent.keyDown(pane, { key: k })).toBe(false)
        expect(host).toHaveAttribute('data-direction', 'f')
        expect(host).toHaveAttribute('data-sbs', 'false')
        expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
      }
    }
    if (width === 'desktop') {
      // The DTK page's pan keeps its arrows too (it pans them itself).
      fireEvent.click(cell(29))
      const pan = within(screen.getByTestId('rd-prov-figure')).getByRole('region')
      pan.focus()
      fireEvent.keyDown(pan, { key: 'ArrowRight' })
      expect(onQuestion()).toBe('Fråga 29 · DTK')
      expect(host).toHaveAttribute('data-screen', '9')
      fireEvent.click(cell(17))
    }
    // Outside a pane the arrows still turn the question.
    key('ArrowRight')
    expect(onQuestion()).toBe('Fråga 18 · KVA')
    expect(host).toHaveAttribute('data-screen', '9')
  })
})

describe.each(WIDTHS)('F · Samtal, %s: Provpassresultat', (width) => {
  it('the count first, the score with its basis beside it, then each section against its share of the time', () => {
    const { actions } = mountOn(fixtureDirectionData(), 10, width)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Klart. 27 av 40 rätt.')
    expect(screen.getByTestId('rd-prov-result')).toHaveTextContent('2 frågor lämnades obesvarade.')
    const score = screen.getByTestId('rd-prov-score')
    expect(score).toHaveTextContent(
      `${fmtScore2(RES.score.value as number)} av 2,0 · normerat (härlett)`,
    )
    expect(score).toHaveTextContent('Härlett ur UHR:s normeringstabell för Hösten 2025.')
    expect(score).toHaveTextContent('räknas dina 27 av 40 om till 80 frågor')
    expect(score).toHaveTextContent('inte ett officiellt resultat')
    expect(screen.getByTestId('rd-prov-section-xyz')).toHaveTextContent('8 av 12')
    expect(screen.getByTestId('rd-prov-section-xyz')).toHaveTextContent('17:30 · 01:00 över')
    expect(screen.getByTestId('rd-prov-section-nog')).toHaveTextContent('09:30 · 01:15 över')
    expect(screen.getByTestId('rd-prov-section-kva')).not.toHaveTextContent('över')
    expect(screen.getByText('Sett tidigare: 6 av 40 frågor')).toBeInTheDocument()
    if (width === 'desktop') {
      expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
        'Delprov',
        'Rätt',
        'Tid',
        'Tidsandel',
      ])
    } else {
      expect(screen.queryByRole('table')).toBeNull()
    }
    // One action leads; the way back to Provpass beside it.
    expect(primaries()).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: /^Till Öva/ }))
    expect(actions.go).toHaveBeenCalledWith('ova')
    fireEvent.click(screen.getByRole('button', { name: 'Till Provpass' }))
    expect(actions.go).toHaveBeenCalledWith('provpass')
    expect(screen.getByTestId('rd-nav-provpass')).toHaveAttribute('aria-current', 'page')
    // Showing a result never hands anything in.
    expect(actions.submitProvpass).not.toHaveBeenCalled()
  })

  it('the earlier passes of the same half and kind, as raw counts, each opening its result', () => {
    const { actions } = mountOn(fixtureDirectionData(), 10, width)
    const history = screen.getByTestId('rd-prov-history')
    expect(history).toHaveTextContent('Tidigare kvantitativa pass, riktiga')
    const first = within(history).getByTestId('rd-prov-history-item-1')
    if (width === 'phone') {
      // On the phone the history is a fold under the report.
      const fold = within(history).getByRole('button', { name: /Visa tidigare pass/ })
      expect(fold).toHaveAttribute('aria-expanded', 'false')
      expect(visible(first)).toBe(false)
      fireEvent.click(fold)
      expect(fold).toHaveAttribute('aria-expanded', 'true')
    }
    expect(visible(first)).toBe(true)
    expect(first).toHaveTextContent('Våren 2026 · Provpass 2')
    expect(first).toHaveTextContent('25 av 40 rätt')
    expect(within(history).getAllByTestId(/^rd-prov-history-item-/)).toHaveLength(
      RES.history.length,
    )
    fireEvent.click(first)
    expect(actions.openProvResult).toHaveBeenCalledWith(RES.history[0].id)
  })

  it('without a sitting table the score is a linear estimate, said as one; with nothing to score, no number', () => {
    const { update } = mountOn(
      withProv((p) => ({
        result: { ...p.result, score: { value: 1.35, derived: 'linear', label: 'skattad' } },
      })),
      10,
      width,
    )
    expect(screen.getByTestId('rd-prov-score')).toHaveTextContent('1,35 av 2,0 · skattad')
    expect(screen.getByTestId('rd-prov-score')).toHaveTextContent(
      'linjär skattning av andelen rätt',
    )
    expect(screen.getByTestId('rd-prov-score')).not.toHaveTextContent('UHR:s normeringstabell')
    update(
      withProv((p) => ({
        result: { ...p.result, score: { value: null, derived: 'linear', label: 'skattad' } },
      })),
    )
    expect(screen.getByTestId('rd-prov-score')).toHaveTextContent(
      'Ingen poäng: inga frågor kunde rättas i passet.',
    )
    expect(screen.getByTestId('rd-prov-score')).not.toHaveTextContent('av 2,0')
  })

  it('a short pass is scored on what it had: the denominator named, in the count and the basis', () => {
    mountOn(
      withProv((p) => ({ result: { ...p.result, presented: 38, answered: 38 } })),
      10,
      width,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Klart. 27 av 38 rätt.')
    expect(screen.getByTestId('rd-prov-result')).toHaveTextContent(
      '2 frågor saknas i det här passet, så det rättas av 38.',
    )
    expect(screen.getByTestId('rd-prov-result')).not.toHaveTextContent('obesvarad')
    expect(screen.getByTestId('rd-prov-score')).toHaveTextContent('dina 27 av 38')
  })

  it('a trap the result names becomes the one way on; no earlier passes is said plainly', () => {
    const trap = {
      frameworkId: 'KVA-TRAP-010',
      section: 'KVA' as const,
      count: 2,
      headline: 'Kvantiteten jämförs innan villkoret är prövat.',
    }
    const { actions } = mountOn(
      withProv((p) => ({ result: { ...p.result, trap, history: [] } })),
      10,
      width,
    )
    expect(screen.getByText(/Två av dina missar föll på samma sätt/)).toHaveTextContent(
      trap.headline,
    )
    fireEvent.click(screen.getByRole('button', { name: /^Öva på fällan i KVA/ }))
    expect(actions.startDrill).toHaveBeenCalledWith({
      kind: 'framework',
      frameworkId: trap.frameworkId,
      section: 'KVA',
    })
    expect(screen.queryByRole('button', { name: /^Till Öva/ })).toBeNull()
    expect(screen.getByTestId('rd-prov-history')).toHaveTextContent(
      'Inga tidigare pass av samma sort ännu.',
    )
  })
})

describe.each(WIDTHS)('F · Samtal, %s: Framsteg', (width) => {
  const focus = FRAM.sections.find((s) => s.section === FRAM.focus[0])
  if (!focus) throw new Error('the fixture names a focus section')

  it('one supported observation and one reply, then the prognosis, the ledger and the week', () => {
    const { actions } = mountOn(fixtureDirectionData(), 11, width)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Din prognos är 1,4 – upp 0,1 sedan förra veckan.',
    )
    expect(screen.getByText(/Mest att vinna just nu finns i/)).toHaveTextContent(
      `${focus.section}, ${focus.name.toLocaleLowerCase('sv-SE')}.`,
    )
    expect(primaries()).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Öva ${focus.section}`) }))
    expect(actions.startDrill).toHaveBeenCalledWith({ kind: 'section', section: focus.section })
    fireEvent.click(screen.getByRole('button', { name: 'Välj övning' }))
    expect(actions.go).toHaveBeenCalledWith('ova')
    // The supplied target is named on the scale.
    expect(screen.getByRole('img', { name: /målet 2,0$/ })).toBeInTheDocument()
    for (const s of FRAM.sections) {
      const row = screen.getByTestId(`rd-framsteg-section-${slug(s.section)}`)
      expect(row).toHaveTextContent(s.section)
      expect(row).toHaveTextContent(s.score != null ? fmtScore(s.score) : 'inte övat än')
      expect(row).toHaveTextContent(`${s.attempts90d} svar`)
    }
    expect(screen.getByTestId(`rd-framsteg-section-${slug(focus.section)}`)).toHaveTextContent(
      'Fokus',
    )
    const week = screen.getByTestId('rd-framsteg-week')
    expect(week).toHaveTextContent('Fyra av fem dagar och 180 svar den här veckan')
    expect(week).toHaveTextContent('70 % rätt de senaste sju dagarna')
    expect(week).toHaveTextContent('14 minuter idag')
    expect(week).toHaveTextContent('Fyra dagar i rad just nu')
    // Nothing to lose: no loss is ever threatened.
    expect(week).not.toHaveTextContent(/förlora|tappa|bryt|missa inte/i)
    fireEvent.click(within(week).getByRole('button', { name: /Till Repetera/ }))
    expect(actions.openRepetera).toHaveBeenCalled()
  })

  it('the 84 days fold under the week: said in words, and week by week as a table', () => {
    mountOn(fixtureDirectionData(), 11, width)
    const week = screen.getByTestId('rd-framsteg-week')
    const fold = within(week).getByRole('button', {
      name: `De senaste ${FRAM.days.length} dagarna`,
    })
    expect(fold).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(fold)
    const active = FRAM.days.filter((d) => d.n > 0).length
    expect(
      within(week).getByRole('img', { name: new RegExp(`^Övat ${active} av de senaste`) }),
    ).toBeInTheDocument()
    const table = within(week).getByRole('table', { name: 'Svar vecka för vecka' })
    const total = within(table)
      .getAllByRole('row')
      .slice(1)
      .reduce((n, r) => n + Number(within(r).getAllByRole('cell')[0].textContent), 0)
    expect(total).toBe(FRAM.days.reduce((n, d) => n + d.n, 0))
  })

  it('the weeks: a gap where nothing was practised, each week inspected by keys, the same numbers as a table', () => {
    mountOn(fixtureDirectionData(), 11, width)
    const W = FRAM.weekly
    const last = W[W.length - 1]
    const chart = screen.getByRole('figure', { name: 'Veckorna' })
    expect(chart).toHaveAccessibleDescription(
      `Veckan från ${weekOf(last.weekStart)}: ${fmtScore(last.score as number)}`,
    )
    chart.focus()
    expect(fireEvent.keyDown(chart, { key: 'ArrowLeft' })).toBe(false)
    const prev = W[W.length - 2]
    expect(chart).toHaveAccessibleDescription(
      `Veckan från ${weekOf(prev.weekStart)}: ${fmtScore(prev.score as number)}`,
    )
    fireEvent.keyDown(chart, { key: 'Home' })
    expect(chart).toHaveAccessibleDescription(`Veckan från ${weekOf(W[0].weekStart)}: inga svar`)
    // The empty first weeks are a gap, not a zero: the line starts after them.
    expect(chart.querySelectorAll('.sa-trend-line')).toHaveLength(1)
    expect(chart.querySelectorAll('.sa-trend-dot')).toHaveLength(
      W.filter((w) => w.score != null).length,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Visa som tabell' }))
    const table = screen.getByRole('table', { name: 'Andel rätt per vecka' })
    expect(within(table).getAllByRole('row')).toHaveLength(W.length + 1)
    expect(within(table).getAllByText('inga svar')).toHaveLength(
      W.filter((w) => w.score == null).length,
    )
  })

  it('the weeks: the last week chosen, then a provider with two scored weeks — the chart reads a week it has', () => {
    const { update } = mountOn(fixtureDirectionData(), 11, width)
    const W = FRAM.weekly
    const chart = screen.getByRole('figure', { name: 'Veckorna' })
    chart.focus()
    fireEvent.keyDown(chart, { key: 'Home' })
    fireEvent.keyDown(chart, { key: 'End' })
    const last = W[W.length - 1]
    expect(chart).toHaveAccessibleDescription(
      `Veckan från ${weekOf(last.weekStart)}: ${fmtScore(last.score as number)}`,
    )
    const two = W.slice(-2).map((w, i) => ({ ...w, score: i ? 1.3 : 1.1 }))
    update(withFram({ weekly: two }))
    const now = screen.getByRole('figure', { name: 'Veckorna' })
    expect(now).toHaveAccessibleDescription(`Veckan från ${weekOf(two[1].weekStart)}: 1,3`)
    expect(now.querySelectorAll('.sa-trend-dot')).toHaveLength(2)
    fireEvent.keyDown(now, { key: 'ArrowLeft' })
    expect(now).toHaveAccessibleDescription(`Veckan från ${weekOf(two[0].weekStart)}: 1,1`)
  })

  it('Översikt and Historik are tabs: ←/→, Home and End move between them, claimed from the switcher', () => {
    mountOn(fixtureDirectionData(), 11, width)
    const tabs = screen.getByRole('tablist', { name: 'Framsteg' })
    const [over, hist] = within(tabs).getAllByRole('tab')
    expect(over).toHaveAttribute('aria-selected', 'true')
    expect(over).toHaveAttribute('tabindex', '0')
    expect(hist).toHaveAttribute('tabindex', '-1')
    expect(hist).toHaveAccessibleName(`Historik ${FRAM.history.length}`)
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', over.id)
    over.focus()
    expect(fireEvent.keyDown(over, { key: 'ArrowRight' })).toBe(false)
    expect(hist).toHaveAttribute('aria-selected', 'true')
    expect(document.activeElement).toBe(hist)
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', hist.id)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Här finns dina avslutade övningar.',
    )
    const rows = within(screen.getByTestId('rd-framsteg-history')).getAllByTestId(
      /^rd-framsteg-history-item-/,
    )
    expect(rows).toHaveLength(FRAM.history.length)
    expect(rows[0]).toHaveTextContent(FRAM.history[0].when)
    expect(rows[0]).toHaveTextContent(FRAM.history[0].label)
    expect(rows[0]).toHaveTextContent(`${FRAM.history[0].correct} av ${FRAM.history[0].total} rätt`)
    fireEvent.keyDown(hist, { key: 'Home' })
    expect(over).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(over, { key: 'End' })
    expect(hist).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(hist, { key: 'ArrowRight' })
    expect(over).toHaveAttribute('aria-selected', 'true')
  })

  it('Historik: the way back to the overview takes focus there; Till Öva and Provpass’s results', () => {
    const { actions } = mountOn(fixtureDirectionData(), 11, width)
    fireEvent.click(screen.getByRole('button', { name: /Hela historiken/ }))
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { level: 1, name: 'Här finns dina avslutade övningar.' }),
    )
    expect(screen.getByText('Provpassen och deras resultat finns i Provpass.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Till Öva/ }))
    expect(actions.go).toHaveBeenCalledWith('ova')
    fireEvent.click(screen.getByRole('button', { name: /Till Provpass och resultaten/ }))
    expect(actions.go).toHaveBeenCalledWith('provpass')
    fireEvent.click(screen.getByRole('button', { name: 'Till översikten' }))
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { level: 1, name: /Din prognos/ }),
    )
  })

  it('Idag’s "Alla pass i Framsteg" opens Historik; Framsteg’s door opens the overview', () => {
    const { actions, update } = mountOn(FIXTURE_DATA, 1, width)
    fireEvent.click(screen.getByRole('button', { name: /Alla pass i Framsteg/ }))
    expect(actions.go).toHaveBeenCalledWith('framsteg')
    update(FIXTURE_DATA, 11)
    expect(screen.getByRole('tab', { name: /^Historik/ })).toHaveAttribute('aria-selected', 'true')
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { level: 1, name: 'Här finns dina avslutade övningar.' }),
    )
    fireEvent.click(screen.getByTestId('rd-nav-framsteg'))
    expect(screen.getByRole('tab', { name: 'Översikt' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('rd-nav-framsteg')).toHaveAttribute('aria-current', 'page')
  })

  it('on sparse data the coach claims nothing the data cannot carry', () => {
    const base = fixtureDirectionData()
    const sections = base.framsteg.sections.map((s, i) =>
      i === 0 ? s : { ...s, score: null, band: null, trend: null, attempts90d: 0 },
    )
    const sparse: DirectionData = {
      ...base,
      framsteg: {
        ...base.framsteg,
        sections,
        focus: [sections[0].section],
        prognosis: {
          ...base.framsteg.prognosis,
          total: null,
          quant: null,
          delta: null,
          target: undefined,
        },
        weekly: base.framsteg.weekly.map((w, i, all) =>
          i === all.length - 1 ? w : { ...w, score: null },
        ),
        history: [],
      },
      konto: { ...base.konto, prefs: { ...base.konto.prefs, showStreak: false } },
    }
    mountOn(sparse, 11, width)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Prognosen visas när du har svarat i båda delarna.',
    )
    // One scored section is no "weakest of eight".
    expect(screen.queryByText(/Mest att vinna/)).toBeNull()
    expect(screen.queryByText('Fokus')).toBeNull()
    expect(screen.getByRole('button', { name: /^Välj övning/ })).toHaveClass('sa-chip--primary')
    expect(screen.getByText('Kurvan visas när du har övat två veckor.')).toBeInTheDocument()
    expect(screen.queryByRole('figure', { name: 'Veckorna' })).toBeNull()
    expect(screen.getByTestId('rd-framsteg-section-xyz')).toHaveTextContent('inte övat än')
    expect(screen.getByTestId('rd-framsteg-section-xyz')).toHaveTextContent('inga svar')
    // The reader keeps no run of days: none is said.
    expect(screen.getByTestId('rd-framsteg-week')).not.toHaveTextContent('i rad')
    expect(screen.queryByText(/Hela historiken/)).toBeNull()
    fireEvent.click(screen.getByRole('tab', { name: /^Historik/ }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Här hamnar dina övningar när du har avslutat dem.',
    )
    expect(screen.getByText('Inga avslutade övningar än.')).toBeInTheDocument()
  })
})

// ── Batch 3: Uppslag, Konto and ELF ──────────────────────────────────

/** The fixtures with Uppslag's open lesson replaced. */
function withLesson(open: LessonView): DirectionData {
  const base = fixtureDirectionData()
  return { ...base, uppslag: { ...base.uppslag, open } }
}

/** A lesson of any family, as the kit would hand it over. */
function lesson(
  entry: LessonView['entry'],
  rest: Pick<LessonView, 'section' | 'family' | 'title'> & Partial<LessonView>,
): LessonView {
  return { id: entry.id, entry, read: false, practice: { questions: 2 }, ...rest }
}

const TRAP: TrapEntry = {
  id: 'KVA-TRAP-001',
  pattern_description: 'Eleven ser x² = y² och drar slutsatsen att x = y.',
  why_it_occurs: 'Kvadreringen tar bort tecknet, och det glöms.',
  common_distractor_signature: 'Alternativ A lockar den som har glömt tecknet.',
  countermeasure: 'Pröva både x = y och x = −y innan du svarar.',
  example_questions: ['q1', 'q2'],
  tldr: 'Kvadratlikhet låser inte tecknet.',
  recognition_cue: 'Två kvadrater sätts lika med varandra.',
  worked_example: {
    setup: 'x² = 9 och y² = 9.',
    trap_thinking: 'Alltså är x = y.',
    correct_thinking: 'x kan vara 3 och y −3.',
    answer: 'D',
  },
  counter_example: 'Om både x och y är positiva gäller x = y.',
}
const ROOT: LexiconEntry = {
  id: 'ORD-ROOT-001',
  root: 'för-',
  origin: 'Lågtyska',
  meaning: 'Gör något till något annat, eller för långt.',
  example_words: ['förstora', 'förvärra'],
  example_questions: ['q1'],
}
const TACTIC: TacticEntry = {
  id: 'DTK-TACTIC-003',
  tactic: 'Läs axlarna först',
  when_to_apply: 'När ett diagram har två skalor.',
  example_questions: ['q1'],
}
const RULE: ConstraintEntry = {
  id: 'MEK-RULE-002',
  constraint_type: 'Prepositionsrektion',
  rule: 'Vissa verb kräver en viss preposition.',
  example_questions: ['q1'],
}

describe.each(WIDTHS)('F · Samtal, %s: Uppslag och lektion', (width) => {
  const open = D.uppslag.open
  const entry = open.entry as ProtocolEntry

  it('the coach hands over the open lesson as a document; practising it is the one reply', () => {
    const { actions } = mountOn(FIXTURE_DATA, 12, width)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Läs igenom den här frågetypen, så övar vi sedan på den.',
    )
    expect(screen.getAllByText(/2 av 8 frågetyper lästa/).length).toBeGreaterThan(0)
    // The lesson, verbatim, in its family's order.
    const doc = screen.getByRole('article', { name: open.title })
    expect(within(doc).getByTestId('rd-lesson')).toHaveTextContent(open.title)
    expect(within(doc).getByRole('heading', { name: 'Så angriper du frågan' })).toBeInTheDocument()
    for (const step of entry.attack_protocol)
      expect(within(doc).getByText(step)).toBeInTheDocument()
    for (const d of entry.common_distractors) {
      expect(within(doc).getByText(d.pattern)).toBeInTheDocument()
      expect(within(doc).getByText(d.why_it_traps)).toBeInTheDocument()
    }
    expect(within(doc).getByText(/^ca \d+ min läsning$/)).toBeInTheDocument()
    expect(within(doc).getByText('Inte läst')).toBeInTheDocument()
    expect(within(doc).getByText('Du lär dig den')).toBeInTheDocument()
    // One filled reply: practise this entry, with its count.
    const practice = screen.getByTestId('rd-lesson-practice')
    expect(practice).toHaveClass('sa-chip--primary')
    expect(practice).toHaveTextContent(`Öva denna frågetyp · ${open.practice.questions} frågor`)
    expect(document.querySelectorAll('.sa-chip--primary')).toHaveLength(1)
    key('Enter')
    expect(actions.startDrill).toHaveBeenLastCalledWith({
      kind: 'framework',
      frameworkId: open.id,
      section: open.section,
    })
    fireEvent.click(screen.getByRole('button', { name: `Öva hela ${open.section}` }))
    expect(actions.startDrill).toHaveBeenLastCalledWith({ kind: 'section', section: open.section })
    // Uppslag is its door's page; arriving moves nothing.
    expect(screen.getByTestId('rd-nav-uppslag')).toHaveAttribute('aria-current', 'page')
    expect(document.activeElement).toBe(document.body)
  })

  it('a row asks for its lesson: the open text stays, the coach says so, and the lesson that comes takes focus', () => {
    const base = fixtureDirectionData()
    const { actions, update } = mountOn(base, 12, width)
    const row = screen.getByTestId('rd-uppslag-entry-LAS-TYPE-001')
    fireEvent.click(row)
    expect(actions.openLesson).toHaveBeenCalledWith('LAS-TYPE-001')
    expect(
      screen.getByText('Lektion begärd. Den öppna texten ligger kvar tills den nya har laddats.'),
    ).toHaveAttribute('role', 'status')
    expect(within(row).getByText('Begärd')).toBeInTheDocument()
    // Nothing made up: the open lesson is still the one shown.
    expect(screen.getByTestId('rd-lesson')).toHaveTextContent(open.title)
    // The lesson comes: the notice goes and its title takes focus.
    const next = lesson(
      {
        id: 'LAS-TYPE-001',
        question_type: 'Direkt detalj',
        attack_protocol: ['Hitta stället i texten.'],
        common_distractors: [],
        example_questions: ['q1'],
      },
      { section: 'LÄS', family: 'las_taxonomy', title: 'Direkt detalj', read: true },
    )
    update({ ...base, uppslag: { ...base.uppslag, open: next } })
    expect(screen.queryByText(/Lektion begärd/)).toBeNull()
    expect(screen.getByTestId('rd-lesson')).toHaveTextContent('Direkt detalj')
    expect(document.activeElement).toBe(screen.getByTestId('rd-lesson'))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Du har läst den här frågetypen. Ska vi öva på den?',
    )
    expect(screen.getByTestId('rd-uppslag-entry-LAS-TYPE-001')).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('a lesson the host opens unasked is shown without taking focus', () => {
    const base = fixtureDirectionData()
    const { update } = mountOn(base, 12, width)
    const other = lesson(TACTIC, { section: 'DTK', family: 'dtk_tactics', title: TACTIC.tactic })
    update({ ...base, uppslag: { ...base.uppslag, open: other } })
    expect(screen.getByTestId('rd-lesson')).toHaveTextContent(TACTIC.tactic)
    expect(document.activeElement).toBe(document.body)
    // Its section is the one listed now.
    expect(screen.getByTestId('rd-uppslag-section-dtk')).toHaveAttribute('aria-pressed', 'true')
  })

  it('the open entry’s own row goes to the lesson and asks for nothing', () => {
    const { actions } = mountOn(FIXTURE_DATA, 12, width)
    const row = screen.getByTestId(`rd-uppslag-entry-${open.id}`)
    expect(row).toHaveAttribute('aria-current', 'true')
    expect(within(row).getByText('Öppen ovan')).toBeInTheDocument()
    fireEvent.click(row)
    expect(actions.openLesson).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(screen.getByTestId('rd-lesson'))
  })

  it('a door lists its section’s entries — a long catalog folds — and the open lesson stays', () => {
    mountOn(FIXTURE_DATA, 12, width)
    const long = D.uppslag.sections.find((s) => s.entries.length > 8)
    if (!long) throw new Error('the fixtures need a catalog longer than eight entries')
    expect(screen.getByTestId('rd-uppslag-section-las')).toHaveAttribute('aria-pressed', 'true')
    const door = screen.getByTestId(`rd-uppslag-section-${slug(long.section)}`)
    expect(door).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(door)
    expect(door).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByTestId('rd-uppslag-entry-LAS-TYPE-001')).toBeNull()
    long.entries.forEach((e, i) => {
      expect(visible(screen.getByTestId(`rd-uppslag-entry-${e.id}`))).toBe(i < 8)
    })
    // The chosen section's list takes focus.
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { level: 2, name: `${long.section} · ${long.name}` }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: new RegExp(`^Visa alla ${long.entries.length}`) }),
    )
    for (const e of long.entries) {
      expect(visible(screen.getByTestId(`rd-uppslag-entry-${e.id}`))).toBe(true)
    }
    expect(screen.getByTestId('rd-lesson')).toHaveTextContent(open.title)
    // "Alla delprov" at the top goes to the doors.
    fireEvent.click(screen.getByRole('button', { name: 'Alla delprov' }))
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { level: 2, name: 'Alla delprov' }),
    )
  })

  it('an entry without example questions cannot be practised: it says why, and the section’s practice leads', () => {
    const { actions } = mountOn(withLesson({ ...open, practice: { questions: 0 } }), 12, width)
    const practice = screen.getByTestId('rd-lesson-practice')
    expect(practice).toBeDisabled()
    expect(practice).toHaveAccessibleDescription('Det finns inga övningsfrågor till frågetypen än.')
    fireEvent.click(practice)
    expect(actions.startDrill).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: `Öva hela ${open.section}` })).toHaveClass(
      'sa-chip--primary',
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Läs igenom den här frågetypen.',
    )
    key('Enter')
    expect(actions.startDrill).toHaveBeenCalledWith({ kind: 'section', section: open.section })
  })

  it('a trap keeps its order — the rule in short, the pattern, why, recognition, countermeasure — the rest on request', () => {
    mountOn(
      withLesson(
        lesson(TRAP, { section: 'KVA', family: 'kva_traps', title: TRAP.pattern_description }),
      ),
      12,
      width,
    )
    const doc = screen.getByRole('article', { name: TRAP.pattern_description })
    expect(within(doc).getByText(TRAP.tldr ?? '')).toBeInTheDocument()
    // The pattern is the title: not said twice.
    expect(within(doc).queryByRole('heading', { name: 'Mönstret' })).toBeNull()
    const order = ['Varför det händer', 'Igenkänningstecken', 'Motåtgärd'].map((h) =>
      within(doc).getByRole('heading', { name: h }),
    )
    for (let i = 1; i < order.length; i++) {
      expect(order[i - 1].compareDocumentPosition(order[i])).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    }
    const more = within(doc).getByRole('button', { name: /^Fler detaljer/ })
    expect(more).toHaveAttribute('aria-expanded', 'false')
    expect(visible(within(doc).getByText(TRAP.worked_example?.trap_thinking ?? ''))).toBe(false)
    fireEvent.click(more)
    expect(visible(within(doc).getByText(TRAP.worked_example?.trap_thinking ?? ''))).toBe(true)
    expect(within(doc).getByText(TRAP.counter_example ?? '')).toBeInTheDocument()
    expect(screen.getByTestId('rd-lesson-practice')).toHaveTextContent(
      'Öva detta mönster · 2 frågor',
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Läs igenom den här fällan, så övar vi sedan på den.',
    )
  })

  it.each([
    [
      'a root',
      ROOT,
      'ORD',
      'ord_roots',
      'Öva ord med denna rot',
      ['Ursprung', 'Betydelse', 'Exempel'],
    ],
    ['a tactic', TACTIC, 'DTK', 'dtk_tactics', 'Öva denna taktik', ['Igenkänningstecken']],
    ['a rule', RULE, 'MEK', 'mek_protocol', 'Öva denna regel', ['Mönsterregel']],
  ] as const)('%s keeps its own fields and its own practice', (_kind, e, section, family, label, parts) => {
    const title = 'root' in e ? e.root : 'tactic' in e ? e.tactic : e.constraint_type
    mountOn(withLesson(lesson(e, { section, family, title })), 12, width)
    const doc = screen.getByRole('article', { name: title })
    for (const h of parts) expect(within(doc).getByRole('heading', { name: h })).toBeInTheDocument()
    expect(screen.getByTestId('rd-lesson-practice')).toHaveTextContent(label)
  })

  it('on sparse data it says what is missing: no progress, no sections', () => {
    const base = fixtureDirectionData()
    mountOn(
      { ...base, uppslag: { sections: [], open: { ...base.uppslag.open, status: undefined } } },
      12,
      width,
    )
    expect(screen.getByText('Uppslaget är tomt just nu.')).toBeInTheDocument()
    expect(screen.queryByText('Du lär dig den')).toBeNull()
    expect(screen.getByTestId('rd-lesson')).toHaveTextContent(base.uppslag.open.title)
    expect(screen.queryByText(/frågetyper lästa/)).toBeNull()
  })
})

describe.each(WIDTHS)('F · Samtal, %s: Konto och inställningar', (width) => {
  it('one coach line and one reply, back to the door the reader came from; no door is current; arriving moves nothing', () => {
    const { actions, update } = mountOn(FIXTURE_DATA, 5, width)
    update(FIXTURE_DATA, 13)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Här ställer du in hur du vill öva.',
    )
    for (const d of DESTINATIONS) {
      expect(screen.getByTestId(`rd-nav-${d.id}`)).not.toHaveAttribute('aria-current')
    }
    const back = screen.getByRole('button', { name: /^Tillbaka till Öva/ })
    expect(back).toHaveClass('sa-chip--primary')
    expect(document.querySelectorAll('.sa-chip--primary')).toHaveLength(1)
    expect(document.activeElement).toBe(document.body)
    key('Enter')
    expect(actions.go).toHaveBeenCalledWith('ova')
  })

  it('without a door before it, the way back is Idag’s', () => {
    const { actions } = mountOn(FIXTURE_DATA, 13, width)
    fireEvent.click(screen.getByRole('button', { name: /^Tillbaka till Idag/ }))
    expect(actions.go).toHaveBeenCalledWith('idag')
  })

  it('the identity as the account says it: the whole e-mail, a plan only when there is one, nothing made up', () => {
    const base = fixtureDirectionData()
    const { unmount } = mountWith(base, 13, width)
    const who = screen.getByTestId('rd-konto-identity')
    expect(who).toHaveTextContent(base.konto.identity.name)
    expect(who).toHaveTextContent(base.konto.identity.email)
    expect(who).toHaveTextContent(
      `${base.konto.exam.label} · ${base.konto.exam.daysLeft} dagar kvar`,
    )
    expect(within(who).queryByText('Plan')).toBeNull()
    unmount()
    mountWith(
      {
        ...base,
        konto: { ...base.konto, identity: { name: '', email: '', initials: '', plan: 'Gratis' } },
      },
      13,
      width,
    )
    const none = screen.getByTestId('rd-konto-identity')
    expect(none).toHaveTextContent('Inget namn i kontot')
    expect(none).toHaveTextContent('Ingen e-post i kontot')
    expect(within(none).getByText('Plan')).toBeInTheDocument()
    expect(none).toHaveTextContent('Gratis')
    expect(screen.getByText('Konto och inställningar.')).toBeInTheDocument()
  })

  it('the mode themes the stage; every other choice sends its own patch; the chosen one is what the account says', () => {
    const { actions, stage } = mountDirection(Samtal, 13, width)
    fireEvent.click(screen.getByTestId('rd-konto-mode-dark'))
    expect(actions.setTheme).toHaveBeenCalledWith('dark')
    expect(stage().theme).toBe('dark')
    expect(screen.getByTestId('rd-konto-mode-dark')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('rd-konto-mode-light')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByTestId('rd-konto-palette-sage'))
    expect(actions.setPrefs).toHaveBeenLastCalledWith({ palette: 'sage' })
    expect(screen.getByTestId('rd-konto-palette-sage')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('rd-konto-palette-spalt')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByTestId('rd-konto-coach-kompis'))
    expect(screen.getByText(COACH_BLURBS.kompis)).toBeInTheDocument()
    const drills = screen.getByRole('group', { name: 'Frågeurval' })
    fireEvent.click(within(drills).getByRole('button', { name: 'Slumpat' }))
    expect(actions.setPrefs).toHaveBeenLastCalledWith({ smartDrill: false })
    expect(within(drills).getByRole('button', { name: 'Slumpat' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(within(drills).getByText('Helt slumpade frågor.')).toBeInTheDocument()
    // One preference per patch; the mode never through setPrefs.
    for (const [patch] of vi.mocked(actions.setPrefs).mock.calls) {
      expect(Object.keys(patch)).toHaveLength(1)
      expect(patch).not.toHaveProperty('mode')
    }
    // Samtal keeps its own look, and says so; nothing claims a save.
    expect(
      screen.getByText(/Samtal behåller sina egna färger och typsnitt här\./),
    ).toBeInTheDocument()
    expect(screen.queryByText(/^(Sparat|Sparad)|är sparad/)).toBeNull()
  })

  it('a choice the host refuses is said in its own group, keeps what the account says, and a real retry sends it again', async () => {
    const actions = spyActions()
    vi.mocked(actions.setPrefs).mockImplementation(() => {
      throw new Error('nej')
    })
    render(
      <DirectionDataProvider data={FIXTURE_DATA} actions={actions}>
        <Samtal
          screen={13}
          width={width}
          theme="light"
          live
          onScreen={() => {}}
          onTheme={() => {}}
        />
      </DirectionDataProvider>,
    )
    const fonts = screen.getByRole('group', { name: 'Typsnitt' })
    fireEvent.click(within(fonts).getByTestId('rd-konto-font-geometric'))
    expect(within(fonts).getByRole('alert')).toHaveTextContent('Kunde inte spara ändringen.')
    expect(within(fonts).getByTestId('rd-konto-font-literary')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(within(screen.getByRole('group', { name: 'Palett' })).queryByRole('alert')).toBeNull()
    vi.mocked(actions.setPrefs).mockImplementation(() => {})
    fireEvent.click(within(fonts).getByRole('button', { name: 'Försök igen: Geometric' }))
    expect(actions.setPrefs).toHaveBeenLastCalledWith({ font: 'geometric' })
    expect(within(fonts).queryByRole('alert')).toBeNull()
    // A refusal that comes later, as a rejected promise, is heard too.
    vi.mocked(actions.setTheme).mockImplementation(
      () => Promise.reject(new Error('nej')) as unknown as undefined,
    )
    fireEvent.click(screen.getByTestId('rd-konto-mode-dark'))
    const modes = screen.getByRole('group', { name: 'Tema' })
    expect(await within(modes).findByRole('alert')).toHaveTextContent('Kunde inte spara ändringen.')
  })

  it('the export and the sign-out say what was asked for, never that it is done', () => {
    const { actions } = mountOn(FIXTURE_DATA, 13, width)
    fireEvent.click(screen.getByTestId('rd-konto-export'))
    expect(actions.exportData).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Export begärd.')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-konto-signout'))
    expect(actions.signOut).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Utloggning begärd.')).toBeInTheDocument()
    expect(screen.queryByText(/exporterad|utloggad|^(Sparat|Sparad)|är sparad/)).toBeNull()
  })

  it('a refused export says so', () => {
    const actions = spyActions()
    vi.mocked(actions.exportData).mockImplementation(() => {
      throw new Error('nej')
    })
    render(
      <DirectionDataProvider data={FIXTURE_DATA} actions={actions}>
        <Samtal
          screen={13}
          width={width}
          theme="light"
          live
          onScreen={() => {}}
          onTheme={() => {}}
        />
      </DirectionDataProvider>,
    )
    fireEvent.click(screen.getByTestId('rd-konto-export'))
    expect(
      screen.getByText('Kunde inte exportera just nu. Försök igen om en stund.'),
    ).toBeInTheDocument()
  })

  it('the deletion is deepest: its cost said first, the export before the word, the typed word, sent once, labelled a preview', () => {
    const { actions } = mountOn(FIXTURE_DATA, 13, width)
    const toggle = screen.getByTestId('rd-konto-delete')
    const signout = screen.getByTestId('rd-konto-signout')
    expect(signout.compareDocumentPosition(toggle)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(
      screen.getByText(/^Allt raderas direkt — konto, försök, missar och resultat\./),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('rd-konto-delete-word')).toBeNull()
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const flow = document.getElementById(toggle.getAttribute('aria-controls') ?? '')
    if (!flow) throw new Error('the deletion flow is not where its toggle says')
    expect(within(flow).getByText('Förhandsvisning – här raderas ingenting.')).toBeInTheDocument()
    const again = within(flow).getByRole('button', { name: 'Exportera mina data' })
    const word = screen.getByTestId('rd-konto-delete-word')
    expect(again.compareDocumentPosition(word)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    fireEvent.click(again)
    expect(actions.exportData).toHaveBeenCalledTimes(1)
    const confirm = screen.getByTestId('rd-konto-delete-confirm')
    expect(confirm).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(confirm)
    expect(actions.deleteAccount).not.toHaveBeenCalled()
    expect(within(flow).getByText('Skriv radera först.')).toBeInTheDocument()
    fireEvent.change(word, { target: { value: 'Radera' } })
    fireEvent.click(confirm)
    expect(actions.deleteAccount).not.toHaveBeenCalled()
    fireEvent.change(word, { target: { value: 'radera' } })
    expect(confirm).toHaveAttribute('aria-disabled', 'false')
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    expect(actions.deleteAccount).toHaveBeenCalledTimes(1)
    expect(confirm).toHaveAttribute('aria-disabled', 'true')
    expect(
      within(flow).getByText('Begäran om radering skickad. I förhandsvisningen raderas ingenting.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Kontot är raderat|raderas nu/)).toBeNull()
  })

  it('a refused deletion says nothing was deleted and may be tried again; Avbryt gives focus back to the toggle', () => {
    const actions = spyActions()
    vi.mocked(actions.deleteAccount).mockImplementation(() => {
      throw new Error('nej')
    })
    render(
      <DirectionDataProvider data={FIXTURE_DATA} actions={actions}>
        <Samtal
          screen={13}
          width={width}
          theme="light"
          live
          onScreen={() => {}}
          onTheme={() => {}}
        />
      </DirectionDataProvider>,
    )
    const toggle = screen.getByTestId('rd-konto-delete')
    fireEvent.click(toggle)
    fireEvent.change(screen.getByTestId('rd-konto-delete-word'), { target: { value: 'radera' } })
    fireEvent.click(screen.getByTestId('rd-konto-delete-confirm'))
    expect(
      screen.getByText('Kunde inte radera kontot. Inget raderades — försök igen.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-konto-delete-confirm'))
    expect(actions.deleteAccount).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole('button', { name: 'Avbryt' }))
    expect(screen.queryByTestId('rd-konto-delete-word')).toBeNull()
    expect(document.activeElement).toBe(toggle)
  })

  it('the account card: who is signed in, the two modes, rows that say where they lead, and a sign-out that says it asked', () => {
    const { actions } = mountOn(FIXTURE_DATA, 4, width)
    const menu = screen.getByTestId('rd-account-menu')
    expect(menu).toHaveTextContent(D.konto.identity.name)
    expect(menu).toHaveTextContent(D.konto.identity.email)
    expect(menu).not.toHaveTextContent('gratisplan')
    expect(within(menu).queryByRole('button', { name: 'System' })).toBeNull()
    expect(within(menu).getByRole('button', { name: 'Ljust' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(menu).toHaveTextContent('Tema och övningsval')
    expect(menu).not.toHaveTextContent('Provdatum och mål')
    fireEvent.click(within(menu).getByText('Logga ut'))
    expect(actions.signOut).toHaveBeenCalledTimes(1)
    expect(within(menu).getByText('Utloggning begärd.')).toBeInTheDocument()
    fireEvent.click(within(menu).getByText('Inställningar'))
    expect(actions.openKonto).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('rd-account-menu')).toBeNull()
  })
})

describe.each(WIDTHS)('F · Samtal in the bake-off, %s: Uppslag and Konto', (width) => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(1440)
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(848)
  })
  afterEach(() => vi.restoreAllMocks())

  function Host({ s }: { s: AppScreenKey }) {
    const [sel, setSel] = useState<Selection>({
      d: 'f',
      s,
      w: width,
      t: 'light',
      sbs: false,
      bare: true,
    })
    return (
      <div data-testid="host" data-screen={sel.s} data-direction={sel.d}>
        <Redesign2026Bakeoff sel={sel} onSelect={(next) => setSel((x) => ({ ...x, ...next }))} />
      </div>
    )
  }

  /** The account card's row named `name`. */
  function row(name: string): HTMLElement {
    fireEvent.click(screen.getByTestId('rd-account'))
    const item = within(screen.getByTestId('rd-account-menu')).getByText(name).closest('button')
    if (!item) throw new Error(`no row ${name} in the account card`)
    return item
  }

  it('each row of the account card opens its own section of Konto, focused only then; the way back is the door', async () => {
    render(<Host s={5} />)
    await screen.findByTestId('rd-samtal', {}, { timeout: 5000 })
    const host = screen.getByTestId('host')
    fireEvent.click(row('Inställningar'))
    expect(host).toHaveAttribute('data-screen', '13')
    expect(screen.queryByTestId('rd-account-menu')).toBeNull()
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { level: 2, name: 'Inställningar' }),
    )
    fireEvent.click(row('Konto'))
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { level: 2, name: 'Ditt konto' }),
    )
    fireEvent.click(row('Hjälp'))
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { level: 2, name: 'Hjälp och villkor' }),
    )
    for (const d of DESTINATIONS) {
      expect(screen.getByTestId(`rd-nav-${d.id}`)).not.toHaveAttribute('aria-current')
    }
    fireEvent.click(screen.getByRole('button', { name: /^Tillbaka till Öva/ }))
    expect(host).toHaveAttribute('data-screen', '5')
    expect(screen.getByTestId('rd-nav-ova')).toHaveAttribute('aria-current', 'page')
  })

  it('arriving at Konto by the switcher moves nothing', async () => {
    render(<Host s={12} />)
    await screen.findByTestId('rd-samtal', {}, { timeout: 5000 })
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(screen.getByTestId('host')).toHaveAttribute('data-screen', '13')
    expect(document.activeElement).toBe(document.body)
  })

  it('the light/dark choice on Konto themes the whole stage', async () => {
    render(<Host s={13} />)
    await screen.findByTestId('rd-samtal', {}, { timeout: 5000 })
    fireEvent.click(screen.getByTestId('rd-konto-mode-dark'))
    expect(screen.getByTestId('rb26')).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByTestId('rd-samtal')).toHaveAttribute('data-theme', 'dark')
  })

  it('Uppslag’s read mark holds: the lesson says Läst, the coach moves on to practice', async () => {
    render(<Host s={12} />)
    await screen.findByTestId('rd-samtal', {}, { timeout: 5000 })
    const mark = screen.getByTestId('rd-lesson-read')
    expect(mark).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(mark)
    expect(screen.getByTestId('rd-lesson-read')).toHaveAttribute('aria-pressed', 'true')
    const doc = screen.getByRole('article', { name: D.uppslag.open.title })
    expect(within(doc).getByText('Läst')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Du har läst den här frågetypen. Ska vi öva på den?',
    )
    expect(screen.getAllByText(/3 av 8 frågetyper lästa/).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByTestId('rd-lesson-read'))
    expect(screen.getByTestId('rd-lesson-read')).toHaveAttribute('aria-pressed', 'false')
  })

  it('Uppslag’s practice opens the drill; a row asks the host, which keeps the open text', async () => {
    render(<Host s={12} />)
    await screen.findByTestId('rd-samtal', {}, { timeout: 5000 })
    fireEvent.click(screen.getByTestId('rd-uppslag-entry-LAS-TYPE-004'))
    expect(screen.getByTestId('host')).toHaveAttribute('data-screen', '12')
    expect(screen.getByTestId('rd-lesson')).toHaveTextContent(D.uppslag.open.title)
    expect(screen.getByText(/^Lektion begärd\./)).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-lesson-practice'))
    expect(screen.getByTestId('host')).toHaveAttribute('data-screen', '2')
  })
})

describe.each(WIDTHS)('F · Samtal, %s: ELF-läsfråga', (width) => {
  const session = D.drills.elf
  const [q] = session.questions
  const e = session.explanations[q.qid]
  if (!e) throw new Error('the ELF fixture must have its explanation')

  /** The fixtures with the ELF sitting holding `questions`. */
  function withElf(
    questions: DrillQuestion[],
    rest: Partial<DirectionData['drills']['elf']> = {},
  ): DirectionData {
    const base = fixtureDirectionData()
    return {
      ...base,
      drills: { ...base.drills, elf: { ...base.drills.elf, questions, ...rest } },
    }
  }

  function langOf(el: Element | null): string | null | undefined {
    return el?.closest('[lang]')?.getAttribute('lang')
  }

  it('the English text, its question and its options stay English; the coach, the labels and the controls Swedish', () => {
    mountOn(FIXTURE_DATA, 14, width)
    const passage = screen.getByTestId('rd-elf-passage')
    expect(passage).toHaveAttribute('lang', 'en')
    expect(passage).toHaveTextContent(q.passage?.byline ?? '')
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('lang', 'en')
    // The badge and the note are Swedish, outside the text.
    expect(langOf(screen.getByTestId('rd-badge'))).toBe('sv')
    fireEvent.click(screen.getByTestId('rd-note-toggle'))
    expect(langOf(screen.getByTestId('rd-note'))).toBe('sv')
    // The ¶ control speaks Swedish inside the English text.
    expect(within(passage).getByRole('button', { name: 'Stycke 1' })).toHaveAttribute('lang', 'sv')
    expect(screen.getByText(/ELF · Fråga 1 av 1/)).toBeInTheDocument()
    revealOptions()
    expect(langOf(screen.getAllByText(q.prompt ?? '')[0])).toBe('en')
    expect(langOf(screen.getAllByText('Fråga 1')[0])).toBe('sv')
    for (const o of q.options ?? []) {
      const option = screen.getByTestId(`rd-option-${o.letter}`)
      expect(langOf(within(option).getByText(o.text))).toBe('en')
      expect(langOf(within(option).getByText(new RegExp(`^Alternativ ${o.letter}`)))).toBe('sv')
    }
  })

  it('the answer opens Facit in place: the explanation English, its headings Swedish; no switcher steps', () => {
    const { actions, onScreen } = mountWith(FIXTURE_DATA, 14, width)
    revealOptions()
    fireEvent.click(screen.getByTestId(`rd-option-${q.answer}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(actions.drill.lock).toHaveBeenCalledWith(
      expect.objectContaining({ qid: q.qid }),
      q.answer,
    )
    expect(onScreen).not.toHaveBeenCalled()
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'true')
    const technique = screen.getByTestId('rd-technique')
    expect(langOf(within(technique).getByText(e.technique))).toBe('en')
    expect(langOf(within(technique).getByRole('heading', { name: 'Nästa gång' }))).toBe('sv')
    expect(langOf(within(screen.getByTestId('rd-pitfall')).getByText(e.pitfall ?? ''))).toBe('en')
    const first = screen.getByTestId('rd-step-1')
    expect(langOf(within(first).getByText(e.steps?.[0]?.title ?? ''))).toBe('en')
    expect(langOf(within(first).getByText(/^Steg 1:/))).toBe('sv')
  })

  it('a wrong answer: the coach asks in Swedish; why it tempts, in English', () => {
    mountWith(FIXTURE_DATA, 14, width)
    const wrong = e.distractors[0]
    revealOptions()
    fireEvent.click(screen.getByTestId(`rd-option-${wrong.letter}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
    const lure = screen.getByTestId(`rd-distractor-${wrong.letter}`)
    expect(langOf(within(lure).getByText(`Vad lockade dig med ${wrong.letter}?`))).toBe('sv')
    expect(langOf(within(lure).getByText(wrong.why_tempting))).toBe('en')
    expect(within(lure).getByRole('button', { name: 'Orden liknade texten' })).toBeInTheDocument()
    // Your answer, its words English.
    const mine = (q.options ?? []).find((o) => o.letter === wrong.letter)
    const yours = document.querySelector('[data-anchor="answer"]')
    expect(langOf(within(yours as HTMLElement).getByText(mine?.text ?? ''))).toBe('en')
  })

  it('Avsluta is the controller’s; the end offers the plan’s next part — never a done one — or Till Öva', () => {
    const { actions, onScreen } = mountWith(FIXTURE_DATA, 14, width)
    fireEvent.click(screen.getAllByTestId('rd-exit')[0])
    expect(actions.drill.exit).toHaveBeenCalledTimes(1)
    expect(onScreen).not.toHaveBeenCalled()
    revealOptions()
    fireEvent.click(screen.getByTestId(`rd-option-${q.answer}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
    fireEvent.click(screen.getByTestId('rd-next'))
    const done = screen.getByTestId('rd-done')
    expect(done).toHaveTextContent('Texten är läst')
    expect(done).toHaveTextContent('Klart. 1 fråga, 1 rätt.')
    expect(within(done).getByText(q.passage?.title ?? '')).toHaveAttribute('lang', 'en')
    const next = D.home.plan.items.find((i) => !i.completed)
    fireEvent.click(screen.getByTestId('rd-done-next'))
    expect(actions.openPlanItem).toHaveBeenCalledWith(next?.id)
  })

  it('with the whole plan done, the end’s one way on is Till Öva', () => {
    const base = fixtureDirectionData()
    const plan = {
      ...base.home.plan,
      allComplete: true,
      items: base.home.plan.items.map((i) => ({ ...i, completed: true })),
    }
    const { actions } = mountWith({ ...base, home: { ...base.home, plan } }, 14, width)
    revealOptions()
    fireEvent.click(screen.getByTestId(`rd-option-${q.answer}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(screen.queryByTestId('rd-done-next')).toBeNull()
    const out = screen.getByRole('button', { name: /^Till Öva/ })
    expect(out).toHaveClass('sa-chip--primary')
    key('Enter')
    expect(actions.go).toHaveBeenCalledWith('ova')
  })

  it('a gap item is "Lucka N": its gap is marked in the text, the real numbers stay text, and it can be answered', () => {
    const gap: DrillQuestion = {
      ...q,
      qid: 'test-elf-gap-32',
      number: 32,
      prompt: '',
      answer: 'B',
      passage: {
        ...(q.passage as NonNullable<DrillQuestion['passage']>),
        paragraphs: [
          'In 1961 the mill closed, 31 and the town shrank by 78% within a decade.',
          'Its people stayed, 32 the work was gone; 33 they built a co-operative.',
        ],
        byline: null,
      },
    }
    const { actions } = mountWith(withElf([gap]), 14, width)
    revealOptions()
    expect(screen.getAllByText('Lucka 32').length).toBeGreaterThan(0)
    const passage = screen.getByTestId('rd-elf-passage')
    expect(within(passage).getByTestId('sa-gap-32')).toHaveAttribute('data-current', 'true')
    expect(within(passage).getByTestId('sa-gap-31')).toHaveAttribute('data-current', 'false')
    expect(within(passage).getByTestId('sa-gap-33')).toBeInTheDocument()
    expect(within(passage).queryByTestId('sa-gap-78')).toBeNull()
    expect(within(passage).getByTestId('sa-gap-32')).toHaveAttribute('lang', 'sv')
    expect(passage).toHaveTextContent('78%')
    expect(passage).toHaveTextContent('1961')
    fireEvent.click(screen.getByTestId('rd-option-B'))
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(actions.drill.lock).toHaveBeenCalledWith(expect.objectContaining({ qid: gap.qid }), 'B')
    // No explanation yet: the verdict and the way on, nothing else.
    expect(
      screen.getByText('Förklaringen till den här frågan är inte klar än.'),
    ).toBeInTheDocument()
  })

  it.each([
    ['its text', { passage: null }, 'Texten saknas, så frågan kan inte besvaras.'],
    ['its stem', { prompt: null }, 'Frågetexten saknas, så frågan kan inte besvaras.'],
    ['its options', { options: null }, 'Frågan saknar svarsalternativ och kan inte besvaras här.'],
  ] as const)('a question without %s cannot be answered: it says why, and Till Öva is the way out', (_what, patch, reason) => {
    const { actions } = mountWith(withElf([{ ...q, ...patch }]), 14, width)
    // The phone's tray opens to the replies (there may be none to choose).
    if (width === 'phone') revealOptions()
    const option = screen.queryByTestId(`rd-option-${q.answer}`)
    if (option) fireEvent.click(option)
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    expect(screen.getByText(reason)).toBeInTheDocument()
    key('Enter')
    expect(actions.drill.lock).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Till Öva' }))
    expect(actions.go).toHaveBeenCalledWith('ova')
  })

  it('an option’s image holds the answer while it loads and stops it if it fails, with a real retry; a cached one is there at once', () => {
    const { actions, unmount } = mountWith(withElf([withOptionImages(q)]), 14, width)
    revealOptions()
    fireEvent.click(screen.getByTestId(`rd-option-${q.answer}`))
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    expect(
      screen.getByText('Bilderna till svarsalternativen laddas – du kan svara när de syns.'),
    ).toBeInTheDocument()
    key('Enter')
    expect(actions.drill.lock).not.toHaveBeenCalled()
    const [first, ...rest] = screen.getAllByRole('img', { name: /^Diagram [A-D]$/ })
    fireEvent.error(first)
    for (const img of rest) fireEvent.load(img)
    expect(screen.getAllByText(/^Bilden till alternativ A gick inte att ladda/).length).toBe(2)
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Försök igen' }))
    // The retry is a new load: still waited for.
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    loadImages()
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(actions.drill.lock).toHaveBeenCalledTimes(1)
    unmount()
    const restore = cachedImages()
    mountWith(withElf([withOptionImages(q)]), 14, width)
    revealOptions()
    fireEvent.click(screen.getByTestId(`rd-option-${q.answer}`))
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
    restore()
  })

  it('a shorter deck, or a new sitting, opens fresh — never out of range', () => {
    const deck = [1, 2, 3].map((n) => ({ ...q, qid: `test-elf-${n}`, number: n }))
    const three = withElf(deck, { start: { index: 2, results: [] } })
    const { update } = mountOn(three, 14, width)
    expect(screen.getByText(/ELF · Fråga 3 av 3/)).toBeInTheDocument()
    update(withElf([deck[0]], { start: { index: 2, results: [] } }))
    expect(screen.getByText(/ELF · Fråga 1 av 1/)).toBeInTheDocument()
    update(withElf(deck, { id: 'elf-2', start: { index: 1, results: [] } }))
    expect(screen.getByText(/ELF · Fråga 2 av 3/)).toBeInTheDocument()
  })

  it('a sitting without questions says so; Öva is the way on', () => {
    const { actions } = mountWith(withElf([]), 14, width)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Det finns ingen text att läsa här just nu.',
    )
    key('Enter')
    expect(actions.go).toHaveBeenCalledWith('ova')
  })
})

// ── Batch 3's review (hpf-64dw): each image ELF mounts is its own load ──

describe('F · Samtal: ELF waits for each image where it is mounted (review hpf-64dw)', () => {
  const [q] = D.drills.elf.questions
  /** A figure in the question, as an ELF item may carry one. */
  const FIGURE = {
    src: 'figures/test-elf-figure.svg',
    alt: 'Figur till frågan',
    width: 800,
    height: 600,
    kind: 'svg',
  } as const
  const WAITS_FIGURE = 'Figuren laddas – du kan svara när den syns.'
  const WAITS_IMAGES = 'Bilderna till svarsalternativen laddas – du kan svara när de syns.'

  /** The fixtures with the ELF sitting holding `questions`. */
  function elfWith(questions: DrillQuestion[]): DirectionData {
    const base = fixtureDirectionData()
    return { ...base, drills: { ...base.drills, elf: { ...base.drills.elf, questions } } }
  }

  /** The ELF question again as question `n` of a deck, changed by `patch`. */
  function nth(n: number, patch: Partial<DrillQuestion> = {}): DrillQuestion {
    return { ...q, qid: `test-elf-image-${n}`, number: n, ...patch }
  }

  const tray = () => screen.getByTestId('rd-sheet')
  const figure = () => screen.getByRole('img', { name: FIGURE.alt })
  const images = () => screen.getAllByRole('img', { name: /^Diagram [A-D]$/ })
  const send = () => screen.getByTestId('rd-lock')
  const choose = () => fireEvent.click(screen.getByTestId(`rd-option-${q.answer}`))
  const openTray = () =>
    fireEvent.click(within(tray()).getByRole('button', { name: /Välj ett svar/ }))
  const foldTray = () => fireEvent.click(within(tray()).getByText('Visa texten'))

  describe('phone: the tray mounts its images anew', () => {
    it('the question’s figure, loaded in the peek, is waited for again in the open tray: Svara and Enter refuse until that image loads', () => {
      const { actions } = mountWith(elfWith([{ ...q, figure: FIGURE }]), 14, 'phone')
      const peeked = figure()
      fireEvent.load(peeked)
      openTray()
      expect(tray()).toHaveAttribute('data-state', 'open')
      const opened = figure()
      expect(opened).not.toBe(peeked)
      choose()
      expect(send()).toBeDisabled()
      expect(screen.getByText(WAITS_FIGURE)).toBeInTheDocument()
      fireEvent.click(send())
      key('Enter')
      expect(actions.drill.lock).not.toHaveBeenCalled()
      expect(screen.queryByTestId('rd-verdict')).toBeNull()
      // The peek's image has gone: what it does now speaks for nothing.
      fireEvent.load(peeked)
      expect(send()).toBeDisabled()
      fireEvent.load(opened)
      expect(send()).toBeEnabled()
      expect(screen.queryByText(WAITS_FIGURE)).toBeNull()
      key('Enter')
      expect(actions.drill.lock).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('rd-verdict')).toBeInTheDocument()
    })

    it('the options’ images, loaded, folded away with the tray and opened again, are waited for again: Svara and Enter refuse until they load', () => {
      const { actions } = mountWith(elfWith([withOptionImages(q)]), 14, 'phone')
      openTray()
      const before = images()
      loadImages()
      choose()
      expect(send()).toBeEnabled()
      foldTray()
      expect(tray()).toHaveAttribute('data-state', 'peek')
      openTray()
      const after = images()
      for (const [i, img] of after.entries()) expect(img).not.toBe(before[i])
      // The choice is the drill's: it stands, and waits with the images.
      expect(screen.getByTestId(`rd-option-${q.answer}`)).toHaveAttribute('aria-pressed', 'true')
      expect(send()).toBeDisabled()
      expect(screen.getByText(WAITS_IMAGES)).toBeInTheDocument()
      fireEvent.click(send())
      key('Enter')
      expect(actions.drill.lock).not.toHaveBeenCalled()
      // The folded-away images have gone: their loads speak for nothing.
      for (const img of before) fireEvent.load(img)
      expect(send()).toBeDisabled()
      for (const img of after.slice(0, -1)) fireEvent.load(img)
      expect(send()).toBeDisabled()
      fireEvent.load(after[after.length - 1])
      expect(send()).toBeEnabled()
      key('Enter')
      expect(actions.drill.lock).toHaveBeenCalledTimes(1)
    })

    it('the next question’s figure, the same image as the last one’s, is waited for again where the tray mounts it', () => {
      const deck = [nth(1, { figure: FIGURE }), nth(2, { figure: FIGURE })]
      const { actions } = mountWith(elfWith(deck), 14, 'phone')
      fireEvent.load(figure())
      openTray()
      fireEvent.load(figure())
      choose()
      key('Enter')
      expect(actions.drill.lock).toHaveBeenCalledTimes(1)
      fireEvent.click(screen.getByTestId('rd-next'))
      expect(tray()).toHaveAttribute('data-state', 'peek')
      openTray()
      choose()
      expect(send()).toBeDisabled()
      expect(screen.getByText(WAITS_FIGURE)).toBeInTheDocument()
      key('Enter')
      expect(actions.drill.lock).toHaveBeenCalledTimes(1)
      fireEvent.load(figure())
      expect(send()).toBeEnabled()
      key('Enter')
      expect(actions.drill.lock).toHaveBeenCalledTimes(2)
    })

    it('images the browser already holds are there at once, each time the tray mounts them', () => {
      const restore = cachedImages()
      try {
        const { actions } = mountWith(
          elfWith([withOptionImages({ ...q, figure: FIGURE })]),
          14,
          'phone',
        )
        openTray()
        choose()
        expect(send()).toBeEnabled()
        foldTray()
        openTray()
        // No load event: complete when they mount, so ready at once.
        expect(send()).toBeEnabled()
        expect(screen.queryByText(/laddas/)).toBeNull()
        key('Enter')
        expect(actions.drill.lock).toHaveBeenCalledTimes(1)
      } finally {
        restore()
      }
    })
  })

  describe('desktop: an image mounted anew is waited for; one still on screen keeps its load', () => {
    it('the next question’s options, with the same images as the last one’s, are mounted anew: Svara and Enter refuse until their images load', () => {
      const deck = [withOptionImages(nth(1)), withOptionImages(nth(2))]
      const { actions } = mountWith(elfWith(deck), 14, 'desktop')
      loadImages()
      choose()
      key('Enter')
      expect(actions.drill.lock).toHaveBeenCalledTimes(1)
      fireEvent.click(screen.getByTestId('rd-next'))
      choose()
      expect(send()).toBeDisabled()
      expect(screen.getByText(WAITS_IMAGES)).toBeInTheDocument()
      key('Enter')
      expect(actions.drill.lock).toHaveBeenCalledTimes(1)
      loadImages()
      expect(send()).toBeEnabled()
      key('Enter')
      expect(actions.drill.lock).toHaveBeenCalledTimes(2)
    })

    it('the question’s figure that stays on screen into the next question keeps its load; shown again after a question without it, it is waited for again', () => {
      const deck = [
        nth(1, { figure: FIGURE }),
        nth(2, { figure: FIGURE }),
        nth(3, { figure: null }),
        nth(4, { figure: FIGURE }),
      ]
      const { actions } = mountWith(elfWith(deck), 14, 'desktop')
      const first = figure()
      fireEvent.load(first)
      choose()
      key('Enter')
      fireEvent.click(screen.getByTestId('rd-next'))
      // Question 2 shows the same image, never unmounted: still loaded.
      expect(figure()).toBe(first)
      choose()
      expect(send()).toBeEnabled()
      key('Enter')
      fireEvent.click(screen.getByTestId('rd-next'))
      // Question 3 has no figure; question 4 mounts the image anew.
      expect(screen.queryByRole('img', { name: FIGURE.alt })).toBeNull()
      choose()
      key('Enter')
      fireEvent.click(screen.getByTestId('rd-next'))
      expect(actions.drill.lock).toHaveBeenCalledTimes(3)
      const again = figure()
      expect(again).not.toBe(first)
      choose()
      expect(send()).toBeDisabled()
      expect(screen.getByText(WAITS_FIGURE)).toBeInTheDocument()
      key('Enter')
      expect(actions.drill.lock).toHaveBeenCalledTimes(3)
      fireEvent.load(again)
      expect(send()).toBeEnabled()
      key('Enter')
      expect(actions.drill.lock).toHaveBeenCalledTimes(4)
    })
  })
})

describe('F · Samtal: paragraph focus keeps the other paragraphs readable', () => {
  it('dims them no further than 0.7, which keeps their ink near 5:1 on the page', () => {
    const css = readFileSync(path.join(HERE, 'samtal.css'), 'utf8')
    const rule = css.match(
      /\.sa-pbody\[data-focus='true'\] \.sa-para:not\(\[data-focused='true'\]\) \{\s*opacity: ([\d.]+);/,
    )
    expect(Number(rule?.[1])).toBeGreaterThanOrEqual(0.7)
  })
})

// ── Batch 3 through the real host: the switcher's keys ───────────────

describe.each(
  WIDTHS,
)('F · Samtal in the bake-off, %s: the switcher’s keys from 12, 13 and 14', (width) => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(1440)
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(848)
  })
  afterEach(() => vi.restoreAllMocks())

  function Host({ s }: { s: AppScreenKey }) {
    const [sel, setSel] = useState<Selection>({
      d: 'f',
      s,
      w: width,
      t: 'light',
      sbs: false,
      bare: true,
    })
    return (
      <div data-testid="host" data-screen={sel.s} data-direction={sel.d}>
        <Redesign2026Bakeoff sel={sel} onSelect={(next) => setSel((x) => ({ ...x, ...next }))} />
      </div>
    )
  }

  /** Where focus can be on a screen, after its setup. */
  type Spot = { setup?: () => void; at: () => HTMLElement | null }
  const answered = (letter: string) => () => {
    revealOptions()
    fireEvent.click(screen.getByTestId(`rd-option-${letter}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
  }
  const wrong =
    D.drills.elf.explanations[D.drills.elf.questions[0].qid]?.distractors[0]?.letter ?? 'B'
  const SPOTS: Record<12 | 13 | 14, Record<string, Spot>> = {
    12: {
      'the entry focus': { at: () => document.body },
      'a section door': { at: () => screen.getByTestId('rd-uppslag-section-kva') },
      'a catalog row': { at: () => screen.getByTestId('rd-uppslag-entry-LAS-TYPE-001') },
      'the lesson': { at: () => screen.getByTestId('rd-lesson') },
      'the read mark': { at: () => screen.getByTestId('rd-lesson-read') },
      'the practice reply': { at: () => screen.getByTestId('rd-lesson-practice') },
    },
    13: {
      'the entry focus': { at: () => document.body },
      'a choice': { at: () => screen.getByTestId('rd-konto-palette-sage') },
      'a section heading': {
        at: () => screen.getByRole('heading', { level: 2, name: 'Inställningar' }),
      },
      'the deletion toggle': { at: () => screen.getByTestId('rd-konto-delete') },
      'the way back': { at: () => screen.getByTestId('sa-konto-back') },
    },
    14: {
      'the entry focus': { at: () => document.body },
      'an option': {
        setup: revealOptions,
        at: () => screen.getByTestId('rd-option-A'),
      },
      'a strike control': {
        setup: revealOptions,
        at: () => screen.getByTestId('rd-eliminate-A'),
      },
      'the passage': { at: () => screen.getByTestId('rd-elf-passage') },
      'a ¶ number': {
        at: () =>
          within(screen.getByTestId('rd-elf-passage')).getByRole('button', { name: /^Stycke 1/ }),
      },
      'the verdict': { setup: answered(wrong), at: () => screen.getByTestId('rd-verdict') },
      'a reply to the coach': {
        setup: answered(wrong),
        at: () => screen.getByRole('button', { name: 'Orden liknade texten' }),
      },
      'Visa allt': {
        setup: answered(wrong),
        at: () => screen.getByRole('button', { name: /^Visa allt/ }),
      },
      Nästa: { setup: answered(wrong), at: () => screen.getByTestId('rd-next') },
    },
  }
  const cases = ([12, 13, 14] as const).flatMap((s) =>
    Object.keys(SPOTS[s]).flatMap((where) =>
      (['3', 'ArrowRight'] as const).map((k) => [s, where, k] as const),
    ),
  )

  it.each(cases)('screen %s, from %s: "%s" reaches the host', async (s, where, k) => {
    render(<Host s={s} />)
    await screen.findByTestId('rd-samtal', {}, { timeout: 5000 })
    const spot = SPOTS[s][where]
    spot.setup?.()
    const el = spot.at()
    if (!el) throw new Error(`nothing at ${where}`)
    // Focus as the reader's Tab would (a part may light up on focus).
    act(() => el.focus())
    const target = (document.activeElement as HTMLElement | null) ?? el
    fireEvent.keyDown(target === document.body ? el : target, { key: k })
    const host = screen.getByTestId('host')
    if (k === '3') expect(host).toHaveAttribute('data-direction', 'c')
    else expect(host).toHaveAttribute('data-screen', String(s === 14 ? 1 : s + 1))
  })

  it('the typed word on Konto keeps its digits: typing never switches', async () => {
    render(<Host s={13} />)
    await screen.findByTestId('rd-samtal', {}, { timeout: 5000 })
    fireEvent.click(screen.getByTestId('rd-konto-delete'))
    const word = screen.getByTestId('rd-konto-delete-word')
    word.focus()
    fireEvent.keyDown(word, { key: '3' })
    fireEvent.keyDown(word, { key: 'ArrowRight' })
    expect(screen.getByTestId('host')).toHaveAttribute('data-screen', '13')
    expect(screen.getByTestId('host')).toHaveAttribute('data-direction', 'f')
  })
})

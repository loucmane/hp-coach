import { readFileSync } from 'node:fs'
import path from 'node:path'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  describeDirectionContract,
  spyActions,
  stubLayout,
} from '@/components/devbake/redesign/contract'
import {
  DirectionDataProvider,
  FIXTURE_DATA,
  useBakeoffDirectionData,
} from '@/components/devbake/redesign/directionData'
import { builds } from '@/components/devbake/redesign/directions'
import {
  Redesign2026Bakeoff,
  type Selection,
} from '@/components/devbake/redesign/Redesign2026Bakeoff'
import {
  type AppScreenKey,
  type DirectionProps,
  fmtClock,
  fmtScore,
  type ScreenKey,
  type ThemeKey,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import type {
  DirectionActions,
  DirectionData,
  DrillQuestion,
  DrillSessionView,
  ProvResultView,
  ProvRunningView,
  RepeteraItemView,
} from '@/components/devbake/redesign/viewModel'
import { Ljuskagla } from './Ljuskagla'
import { meta } from './meta'

describeDirectionContract(meta, Ljuskagla)

const D = FIXTURE_DATA
const READING = D.drills.reading
const Q3 = READING.questions[2]
const Q4 = READING.questions[3]
const E3 = READING.explanations[Q3.qid]
const [XYZ, KVA, NOG] = D.drills.quant.questions
/** The bank's math markers, U+E000 and U+E001, built from their codes. */
const MATH_MARKERS = new RegExp(`[${String.fromCharCode(0xe000, 0xe001)}]`)

beforeAll(stubLayout)
afterEach(() => vi.restoreAllMocks())

/** Round 1's bare mount: no provider (the fixtures and actions that do
 *  nothing), the screen and theme kept like the switcher keeps them. */
function Bare({
  initial,
  width,
  theme = 'dark',
}: {
  initial: ScreenKey
  width: WidthKey
  theme?: ThemeKey
}) {
  const [page, setPage] = useState<AppScreenKey>(initial)
  const [appearance, setAppearance] = useState(theme)
  return (
    <Ljuskagla
      screen={page}
      width={width}
      theme={appearance}
      live
      onScreen={setPage}
      onTheme={setAppearance}
    />
  )
}

function bare(initial: ScreenKey, width: WidthKey = 'desktop') {
  return render(<Bare initial={initial} width={width} />)
}

/** The bake-off's stage in miniature: its provider maps every action onto
 *  the switcher, and a screen this direction has not built shows a card. */
function Stage({ initial, width }: { initial: AppScreenKey; width: WidthKey }) {
  const [s, setS] = useState(initial)
  const [t, setT] = useState<ThemeKey>('dark')
  const host = useBakeoffDirectionData({ screen: s, theme: t, onScreen: setS, onTheme: setT })
  return (
    <DirectionDataProvider data={host.data} actions={host.actions}>
      {builds(meta, s) ? (
        <Ljuskagla screen={s} width={width} theme={t} live onScreen={setS} onTheme={setT} />
      ) : (
        <p data-testid="not-built">Skärm {s}</p>
      )}
    </DirectionDataProvider>
  )
}

function stage(initial: AppScreenKey, width: WidthKey = 'desktop') {
  return render(<Stage initial={initial} width={width} />)
}

/** One screen inside a provider with spied actions and, optionally, other data. */
function spied(
  s: AppScreenKey,
  {
    data = D,
    width = 'desktop',
    live = true,
  }: { data?: DirectionData; width?: WidthKey; live?: boolean } = {},
) {
  const actions = spyActions()
  const props: DirectionProps = {
    screen: s,
    width,
    theme: 'light',
    live,
    onScreen: vi.fn(),
    onTheme: vi.fn(),
  }
  render(
    <DirectionDataProvider data={data} actions={actions}>
      <Ljuskagla {...props} />
    </DirectionDataProvider>,
  )
  return { actions, props }
}

function withHome(patch: Partial<DirectionData['home']>): DirectionData {
  return { ...D, home: { ...D.home, ...patch } }
}

function withQuant(patch: Partial<DrillSessionView>): DirectionData {
  return { ...D, drills: { ...D.drills, quant: { ...D.drills.quant, ...patch } } }
}

function openSheet() {
  const sheet = screen.queryByTestId('rd-sheet')
  if (sheet?.dataset.state === 'peek')
    fireEvent.click(within(sheet).getByRole('button', { name: /Visa frågan|Tillbaka till facit/ }))
}

function lockQuant(letter: string) {
  fireEvent.click(screen.getByTestId(`rd-quant-option-${letter}`))
  fireEvent.click(screen.getByTestId('rd-lock'))
}

function wrongOf(q: (typeof D.drills.quant.questions)[number]) {
  return (q.options ?? []).find((o) => o.letter !== q.answer)?.letter ?? 'A'
}

// ── Round 1, now on the data context and the drill core ─────────────

describe.each<WidthKey>(['desktop', 'phone'])('Ljuskägla reading on %s', (width) => {
  it('resumes, discloses approved copy, eliminates, answers and completes the real unit', () => {
    stage(1, width)
    fireEvent.click(screen.getByTestId('rd-resume'))
    expect(screen.getByTestId('rd-note')).not.toBeVisible()
    fireEvent.click(screen.getByTestId('rd-note-toggle'))
    expect(screen.getByTestId('rd-note')).toHaveTextContent(D.copy.ovningstextNote)
    openSheet()
    fireEvent.click(screen.getByTestId('rd-eliminate-A'))
    expect(screen.getByTestId('rd-eliminate-A')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByTestId('rd-option-A'))
    expect(screen.getByTestId('rd-eliminate-A')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(screen.getByTestId('rd-ljuskagla')).toHaveTextContent(Q4.prompt ?? '')
    openSheet()
    fireEvent.click(screen.getByTestId(`rd-option-${Q4.answer}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'true')
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(screen.getByTestId('rd-done')).toHaveTextContent('2 av 4 rätt')
    // The plan's next step is today's repetition: the host opens Repetera.
    fireEvent.click(screen.getByTestId('rd-done-next'))
    expect(screen.getByTestId('rd-repetera-start')).toBeInTheDocument()
    expect(screen.getByTestId('rd-nav-ova')).toHaveAttribute('aria-current', 'page')
  })

  it('keeps feedback ordered, opens detail steps and lights citations in the text', () => {
    stage(3, width)
    const explanation = E3
    if (!explanation) throw new Error('the reading fixture must have an explanation')
    const detail = explanation.steps?.find((step) => step.tier === 'detail')
    if (!detail) throw new Error('fixture must have a detail step')
    expect(screen.queryByText(detail.text)).toBeNull()
    fireEvent.click(screen.getByTestId(`rd-step-toggle-${detail.n}`))
    expect(screen.getByText(detail.text)).toBeInTheDocument()
    expect(screen.getByTestId('rd-technique')).toHaveTextContent(explanation.technique)
    expect(screen.getByTestId('rd-pitfall')).toHaveTextContent(explanation.pitfall ?? '')
    expect(
      within(screen.getByTestId('rd-distractor-A')).getByText(
        explanation.distractors[0].why_tempting,
      ),
    ).toBeInTheDocument()
    const order = [
      'rd-verdict',
      'rd-distractor-A',
      'rd-pitfall',
      'rd-technique',
      'rd-solution',
      'rd-step-1',
      'rd-other-options',
    ]
    for (let i = 0; i < order.length - 1; i++)
      expect(
        screen.getByTestId(order[i]).compareDocumentPosition(screen.getByTestId(order[i + 1])) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    for (const d of explanation.distractors)
      expect(screen.getByTestId(`rd-distractor-${d.letter}`)).toBeInTheDocument()
    expect(
      screen.getByText(`Uppslag · ${D.frameworks[explanation.framework_id ?? '']}`),
    ).toBeInTheDocument()
    fireEvent.click(screen.getAllByTestId('rd-cite-6')[0])
    expect(screen.getByTestId('rd-para-6')).toHaveAttribute('data-lit', 'true')
    if (width === 'phone') {
      expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'peek')
      expect(screen.getByTestId('rd-passage').closest('[inert]')).toBeNull()
      openSheet()
      expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
    }
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(screen.getByTestId('rd-resume')).toBeInTheDocument()
  })
})

describe('Ljuskägla spotlight and keyboard', () => {
  it('follows paragraphs, arrow keys and J/K, respects boundaries, and can switch off', () => {
    bare(2)
    expect(screen.getByTestId('rd-para-1')).toHaveAttribute('data-lit', 'true')
    fireEvent.keyDown(window, { key: 'j' })
    expect(screen.getByTestId('rd-para-2')).toHaveAttribute('data-lit', 'true')
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    expect(screen.getByTestId('rd-para-3')).toHaveAttribute('data-lit', 'true')
    fireEvent.keyDown(window, { key: 'k' })
    fireEvent.keyDown(window, { key: 'ArrowUp' })
    fireEvent.keyDown(window, { key: 'ArrowUp' })
    expect(screen.getByTestId('rd-para-1')).toHaveAttribute('data-lit', 'true')
    fireEvent.click(screen.getByTestId('rd-para-9').querySelector('p')!)
    fireEvent.keyDown(window, { key: 'j' })
    expect(screen.getByTestId('rd-para-9')).toHaveAttribute('data-lit', 'true')
    fireEvent.click(screen.getByTestId('rd-spotlight-toggle'))
    expect(screen.getByTestId('rd-spotlight-toggle')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('rd-para-9')).toHaveAttribute('data-lit', 'false')
    const scrollKey = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true })
    window.dispatchEvent(scrollKey)
    expect(scrollKey.defaultPrevented).toBe(false)
    fireEvent.click(screen.getByTestId('rd-spotlight-toggle'))
    expect(screen.getByTestId('rd-para-9')).toHaveAttribute('data-lit', 'true')
  })

  it('follows the paragraph intersecting the reading line when scrolled', () => {
    bare(2)
    const scroll = screen.getByTestId('rd-passage-scroll')
    vi.spyOn(scroll, 'getBoundingClientRect').mockReturnValue({ top: 0, height: 500 } as DOMRect)
    for (let n = 1; n <= 9; n++)
      vi.spyOn(screen.getByTestId(`rd-para-${n}`), 'getBoundingClientRect').mockReturnValue({
        top: (n - 3) * 200,
        bottom: (n - 2) * 200,
      } as DOMRect)
    fireEvent.scroll(scroll)
    expect(screen.getByTestId('rd-para-3')).toHaveAttribute('data-lit', 'true')
    fireEvent.click(screen.getByTestId('rd-spotlight-toggle'))
    expect(screen.getByTestId('rd-para-3')).toHaveAttribute('data-lit', 'false')
  })

  it('uses answer keys, Enter and Space while leaving Escape and 1–8 to their owners', () => {
    bare(2, 'phone')
    const digit = new KeyboardEvent('keydown', { key: '8', cancelable: true })
    window.dispatchEvent(digit)
    expect(digit.defaultPrevented).toBe(false)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByTestId('rd-passage')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'a' })
    expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'open')
    expect(screen.getByTestId('rd-option-A')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
    fireEvent.keyDown(window, { key: ' ' })
    expect(screen.getByTestId('rd-ljuskagla')).toHaveTextContent(Q4.prompt ?? '')
  })

  it('does not steal Enter from controls or answer while the account is open', () => {
    bare(2)
    fireEvent.keyDown(screen.getByTestId('rd-spotlight-toggle'), { key: 'Enter' })
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.click(screen.getByTestId('rd-account'))
    fireEvent.keyDown(window, { key: 'a' })
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('rd-account-menu')).toBeNull()
    expect(screen.getByTestId('rd-passage')).toBeInTheDocument()
  })

  it('keeps thumbnails still and the expanded/collapsed navigation operable', () => {
    const props: DirectionProps = {
      screen: 2,
      width: 'desktop',
      theme: 'dark',
      live: false,
      onScreen: vi.fn(),
      onTheme: vi.fn(),
    }
    const { rerender } = render(<Ljuskagla {...props} />)
    fireEvent.keyDown(window, { key: 'j' })
    fireEvent.keyDown(window, { key: 'a' })
    expect(screen.getByTestId('rd-para-1')).toHaveAttribute('data-lit', 'true')
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    rerender(<Ljuskagla {...props} screen={4} />)
    expect(screen.getByTestId('rd-collapse')).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(screen.getByTestId('rd-collapse'))
    expect(screen.getByTestId('rd-collapse')).toHaveAttribute('aria-expanded', 'true')
    // Without a host that navigates, a door still opens its page in the frame.
    fireEvent.click(screen.getByTestId('rd-nav-framsteg'))
    expect(screen.getByTestId('rd-framsteg-prognosis')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-nav-ova'))
    expect(screen.getByTestId('rd-ova-repetera')).toBeInTheDocument()
  })
})

// ── Idag without what the real app cannot fill ──────────────────────

describe('Ljuskägla Idag with optional fields absent', () => {
  it('leaves out the pause, minutes, device, goal, target and range without placeholders', () => {
    const resume = D.home.resume
    if (!resume) throw new Error('the fixture day has a resume')
    spied(1, {
      data: withHome({
        resume: { ...resume, pausedAt: undefined, minutesLeft: undefined, device: null },
        prognosis: {
          ...D.home.prognosis,
          low: undefined,
          high: undefined,
          target: undefined,
          weeks: undefined,
          delta: null,
        },
        week: { minutesToday: 14, daysPractised: 4 },
        plan: {
          ...D.home.plan,
          items: D.home.plan.items.map((i) => ({ ...i, primary: undefined })),
        },
      }),
    })
    const root = screen.getByTestId('rd-ljuskagla')
    expect(root).not.toHaveTextContent(/undefined|null|NaN/)
    expect(root).not.toHaveTextContent(/Pausat|minuter kvar|mål |näst på tur|sedan förra veckan/)
    expect(root).toHaveTextContent('Två frågor bakom dig.')
    expect(root).toHaveTextContent('14 minuter idag · 4 dagar med övning den här veckan')
    expect(screen.getAllByTestId('rd-resume')).toHaveLength(1)
  })

  it('without a resume lights the plan’s first step, and without a total explains the estimate', () => {
    const { actions } = spied(1, {
      data: withHome({ resume: null, prognosis: { ...D.home.prognosis, total: null } }),
    })
    expect(screen.getByTestId('rd-ljuskagla')).toHaveTextContent(
      'Prognosen visas när du har svarat på frågor i båda provhalvorna.',
    )
    const first = D.home.plan.items[0]
    const resume = screen.getByTestId('rd-resume')
    expect(resume).toHaveTextContent(`Börja: ${first.title}`)
    fireEvent.click(resume)
    expect(actions.openPlanItem).toHaveBeenCalledWith(first.id)
  })

  it('asks the host for a plan row, and opens its page in the frame as well', () => {
    const { actions } = spied(1)
    fireEvent.click(screen.getByRole('button', { name: /ELF-lektion/ }))
    expect(actions.openPlanItem).toHaveBeenCalledWith(D.home.plan.items[1].id)
    expect(screen.getByRole('heading', { name: 'Uppslag' })).toBeInTheDocument()
  })

  it('asks the host for the trap’s lesson', () => {
    const { actions } = spied(1)
    fireEvent.click(screen.getByRole('button', { name: /Läs om frågetypen/ }))
    expect(actions.openLesson).toHaveBeenCalledWith(D.home.traps[0].frameworkId)
  })
})

// ── 5 · Öva ─────────────────────────────────────────────────────────

describe('Ljuskägla Öva', () => {
  it('lights the paused session above the eight sections in their fixed order', () => {
    const { actions } = spied(5)
    const lamp = screen.getByRole('region', { name: 'Förslag' })
    expect(lamp).toHaveTextContent(D.home.resume?.title ?? '')
    fireEvent.click(within(lamp).getByRole('button', { name: /Fortsätt övningen/ }))
    expect(actions.resume).toHaveBeenCalled()
    const rows = screen.getAllByTestId(/^rd-ova-section-/)
    expect(rows.map((r) => r.dataset.testid)).toEqual([
      'rd-ova-section-ord',
      'rd-ova-section-las',
      'rd-ova-section-mek',
      'rd-ova-section-elf',
      'rd-ova-section-xyz',
      'rd-ova-section-kva',
      'rd-ova-section-nog',
      'rd-ova-section-dtk',
    ])
    expect(screen.getAllByTestId('rd-ova-mixed')).toHaveLength(1)
    expect(screen.getByTestId('rd-nav-ova')).toHaveAttribute('aria-current', 'page')
  })

  it('marks the weakest section in words and names every row for assistive technology', () => {
    spied(5)
    const weakest = D.ova.sections.find((s) => s.section === D.ova.weakest)
    if (!weakest) throw new Error('the fixture day has a weakest section')
    const slug = weakest.section.toLocaleLowerCase('sv-SE').replace('ä', 'a')
    const row = screen.getByTestId(`rd-ova-section-${slug}`)
    expect(row.closest('li')).toHaveAttribute('data-weakest', 'true')
    expect(row).toHaveTextContent('Svagast just nu')
    expect(row).toHaveAccessibleName(new RegExp(`^Öva ${weakest.section}, ${weakest.name}`))
    expect(screen.getAllByText(/svagast just nu/i)).toHaveLength(1)
  })

  it('without a paused session suggests the weakest section, else a mixed drill', () => {
    const weakest = D.ova.weakest
    if (!weakest) throw new Error('the fixture day has a weakest section')
    const first = spied(5, { data: withHome({ resume: null }) })
    fireEvent.click(screen.getByRole('button', { name: `Öva ${weakest}` }))
    expect(first.actions.startDrill).toHaveBeenCalledWith({ kind: 'section', section: weakest })
  })

  it('offers a mixed drill as the one lit action when nothing else is known', () => {
    const { actions } = spied(5, {
      data: { ...withHome({ resume: null }), ova: { ...D.ova, weakest: null } },
    })
    const mixed = screen.getAllByTestId('rd-ova-mixed')
    expect(mixed).toHaveLength(1)
    expect(mixed[0]).toHaveTextContent('Starta blandad övning')
    expect(screen.queryByText(/svagast/i)).toBeNull()
    fireEvent.click(mixed[0])
    expect(actions.startDrill).toHaveBeenCalledWith({ kind: 'mixed' })
  })

  it('keeps the Repetera door at zero and says what it means', () => {
    spied(5, { data: { ...D, ova: { ...D.ova, repetera: { dueNow: 0, pile: 0 } } } })
    expect(screen.getByTestId('rd-ova-repetera')).toHaveTextContent('Inga missar än')
  })

  it('distinguishes a pile with nothing ready yet, and opens a trap’s lesson', () => {
    const { actions } = spied(5, {
      data: { ...D, ova: { ...D.ova, repetera: { dueNow: 0, pile: 6 } } },
    })
    const door = screen.getByTestId('rd-ova-repetera')
    expect(door).toHaveTextContent('Inget är redo just nu')
    expect(door).toHaveTextContent('6 i dagens hög')
    const trap = D.ova.weakTraps[0]
    fireEvent.click(screen.getByRole('button', { name: new RegExp(trap.name) }))
    expect(actions.openLesson).toHaveBeenCalledWith(trap.frameworkId)
  })

  it.each<WidthKey>([
    'desktop',
    'phone',
  ])('on %s, goes from Idag to Öva to a section’s drill, and Avsluta returns to Öva', (width) => {
    stage(1, width)
    fireEvent.click(screen.getByTestId('rd-nav-ova'))
    fireEvent.click(screen.getByTestId('rd-ova-section-kva'))
    expect(screen.getByTestId('rd-quant-prompt')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(screen.getByTestId('rd-ova-section-kva')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-ova-repetera'))
    expect(screen.getByTestId('rd-repetera-start')).toBeInTheDocument()
  })
})

// ── 6 · Kvantfråga ──────────────────────────────────────────────────

describe('Ljuskägla Kvantfråga', () => {
  it('renders the XYZ math, grades through the controller and keeps math out of raw text', () => {
    const { actions } = spied(6)
    const prompt = screen.getByTestId('rd-quant-prompt')
    expect(prompt.querySelector('.katex')).not.toBeNull()
    expect(screen.getByTestId('rd-ljuskagla').textContent).not.toMatch(MATH_MARKERS)
    expect(screen.queryByTestId('rd-quant-option-E')).toBeNull()
    lockQuant(wrongOf(XYZ))
    expect(actions.drill.lock).toHaveBeenCalledWith(
      expect.objectContaining({ qid: XYZ.qid }),
      wrongOf(XYZ),
    )
    expect(screen.getByTestId('rd-verdict')).toHaveTextContent(`Rätt svar är ${XYZ.answer}`)
    // Feedback carries math too: no marker ever reaches the screen, and the
    // fields are rendered, not shown as LaTeX. (Step 9 of this explanation
    // fences its math mid-fraction in the content itself; KaTeX reports that
    // segment as an error, so the check stays on the fields that parse.)
    expect(screen.getByTestId('rd-ljuskagla').textContent).not.toMatch(MATH_MARKERS)
    for (const id of ['rd-quant-prompt', 'rd-verdict', 'rd-technique', 'rd-pitfall', 'rd-solution'])
      expect(screen.getByTestId(id).textContent).not.toMatch(/\\(?:frac|dfrac|tfrac|cdot)/)
    expect(screen.getByTestId('rd-step-7').querySelector('.katex')).not.toBeNull()
    // The problem stays in view beside the feedback.
    expect(screen.getByTestId('rd-quant-prompt')).toBeInTheDocument()
  })

  it('splits KVA into Kvantitet I and II with its four fixed options', () => {
    spied(6, { data: withQuant({ start: { index: 1, results: [] } }) })
    const prompt = screen.getByTestId('rd-quant-prompt')
    const terms = within(prompt).getAllByRole('term')
    expect(terms.map((t) => t.textContent)).toEqual(['Kvantitet I', 'Kvantitet II'])
    const values = within(prompt).getAllByRole('definition')
    expect(values.map((v) => v.textContent)).toEqual(['x - y', '3x - 2y'])
    expect(prompt).toHaveTextContent('y > 0')
    for (const o of KVA.options ?? [])
      expect(screen.getByTestId(`rd-quant-option-${o.letter}`)).toHaveTextContent(o.text)
    expect(screen.queryByTestId('rd-quant-option-E')).toBeNull()
  })

  it('keeps NOG’s two statements together and leads its five options with the sufficiency line', () => {
    spied(6, { data: withQuant({ start: { index: 2, results: [] } }) })
    const prompt = screen.getByTestId('rd-quant-prompt')
    const statements = within(prompt).getAllByRole('listitem')
    expect(statements).toHaveLength(2)
    expect(statements[0]).toHaveTextContent('(1)')
    expect(statements[1]).toHaveTextContent('(2)y = 6x')
    expect(prompt).not.toHaveTextContent('Tillräcklig information')
    expect(
      screen.getByRole('list', { name: 'Tillräcklig information för lösningen erhålls' }),
    ).toBeInTheDocument()
    for (const o of NOG.options ?? [])
      expect(screen.getByTestId(`rd-quant-option-${o.letter}`)).toBeInTheDocument()
    expect(prompt.textContent).not.toMatch(MATH_MARKERS)
  })

  it('answers with the question’s own letters, strikes with Shift and advances with Enter and Space', () => {
    spied(6)
    fireEvent.keyDown(window, { key: 'e' })
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.keyDown(window, { key: 'b' })
    expect(screen.getByTestId('rd-quant-option-B')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.keyDown(window, { key: 'C', shiftKey: true })
    expect(screen.getByTestId('rd-eliminate-C')).toHaveAttribute('aria-pressed', 'true')
    const digit = new KeyboardEvent('keydown', { key: '3', cancelable: true })
    window.dispatchEvent(digit)
    expect(digit.defaultPrevented).toBe(false)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByTestId('rd-exit')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(screen.getByTestId('rd-verdict')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: ' ' })
    expect(screen.getByTestId('rd-quant-prompt')).toHaveTextContent('Kvantitet I')
  })

  it('gives the verdict without inventing an explanation when there is none', () => {
    spied(6, {
      data: withQuant({ explanations: { ...D.drills.quant.explanations, [XYZ.qid]: null } }),
    })
    lockQuant(XYZ.answer)
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'true')
    expect(screen.getByText('Förklaring saknas för den här frågan.')).toBeInTheDocument()
    expect(screen.queryByTestId('rd-technique')).toBeNull()
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(screen.getByTestId('rd-quant-prompt')).toHaveTextContent('Kvantitet I')
  })

  it.each<WidthKey>([
    'desktop',
    'phone',
  ])('on %s, ends with a receipt of the real result and one way back to Öva', (width) => {
    const { actions } = spied(6, { width })
    for (const [i, q] of [XYZ, KVA, NOG].entries()) {
      lockQuant(i === 0 ? wrongOf(q) : q.answer)
      fireEvent.click(screen.getByTestId('rd-next'))
    }
    expect(screen.getByTestId('rd-done')).toHaveTextContent('2 av 3 rätt')
    fireEvent.click(screen.getByTestId('rd-done-next'))
    expect(actions.go).toHaveBeenCalledWith('ova')
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(actions.drill.exit).toHaveBeenCalled()
  })

  it('on a phone keeps the action below the scroll, never over the fifth option', () => {
    spied(6, { width: 'phone', data: withQuant({ start: { index: 2, results: [] } }) })
    const scroll = screen.getByTestId('rd-quant-option-E').closest('.lj-quant-scroll')
    expect(scroll).not.toBeNull()
    expect(scroll).not.toContainElement(screen.getByTestId('rd-lock'))
  })

  it('stands still as a thumbnail: no clock and no keys', () => {
    spied(6, { live: false })
    expect(screen.queryByRole('timer')).toBeNull()
    fireEvent.keyDown(window, { key: 'a' })
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
  })
})

// ── 7 · DTK ─────────────────────────────────────────────────────────

describe('Ljuskägla DTK', () => {
  const [Q] = D.drills.dtk.questions

  it('shows the real page with its alt text and turns it in quarter turns', () => {
    spied(7)
    const figure = screen.getByTestId('rd-figure')
    const img = within(figure).getByRole('img', { name: Q.figure?.alt })
    expect(img).toHaveAttribute('src', `/${Q.figure?.src}`)
    expect(figure).toHaveTextContent(Q.source.label)
    fireEvent.click(within(figure).getByRole('button', { name: 'Rotera figuren 90 grader' }))
    expect(img.style.transform).toContain('rotate(90deg)')
    fireEvent.click(within(figure).getByRole('button', { name: 'Rotera figuren 90 grader' }))
    fireEvent.click(within(figure).getByRole('button', { name: 'Rotera figuren 90 grader' }))
    fireEvent.click(within(figure).getByRole('button', { name: 'Rotera figuren 90 grader' }))
    expect(img.style.transform).toContain('rotate(0deg)')
  })

  it('enlarges into a dialog that holds focus and keys, then returns to the same place', () => {
    spied(7)
    fireEvent.click(screen.getByTestId('rd-quant-option-C'))
    const enlarge = screen.getByRole('button', { name: 'Förstora figur' })
    fireEvent.click(enlarge)
    const dialog = screen.getByRole('dialog', { name: 'Förstorat underlag' })
    const close = within(dialog).getByRole('button', { name: 'Stäng' })
    expect(document.activeElement).toBe(close)
    expect(within(dialog).getByRole('img', { name: `${Q.figure?.alt}, förstorat` })).toBeVisible()
    // Answer keys wait while the viewer is open.
    fireEvent.keyDown(window, { key: 'a' })
    expect(screen.getByTestId('rd-quant-option-C')).toHaveAttribute('aria-pressed', 'true')
    // Zoom and turn from the viewer's own controls and keys.
    expect(within(dialog).getByRole('button', { name: 'Zooma ut' })).toBeDisabled()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Zooma in' }))
    expect(dialog).toHaveTextContent('125 %')
    fireEvent.keyDown(window, { key: '+' })
    expect(dialog).toHaveTextContent('156 %')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hela bredden' }))
    expect(dialog).toHaveTextContent('100 %')
    // Tab stays inside the dialog.
    const last = within(dialog).getByRole('button', { name: 'Rotera figuren 90 grader' })
    last.focus()
    fireEvent.keyDown(last, { key: 'Tab' })
    expect(document.activeElement).toBe(close)
    // Escape closes the viewer, not the drill, and focus comes home.
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(enlarge)
    expect(screen.getByTestId('rd-exit')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'true')
    // The page stays beside the feedback.
    expect(screen.getByTestId('rd-figure')).toBeInTheDocument()
  })

  it('on a phone puts the page first and the question in a sheet that opens and folds', () => {
    spied(7, { width: 'phone' })
    const sheet = screen.getByTestId('rd-sheet')
    expect(sheet).toHaveAttribute('data-state', 'peek')
    expect(screen.getByTestId('rd-quant-prompt')).toHaveTextContent(Q.prompt ?? '')
    expect(screen.queryByTestId('rd-quant-option-A')).toBeNull()
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(sheet).toHaveAttribute('data-state', 'open')
    lockQuant(Q.answer)
    expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'full')
    expect(screen.getByTestId('rd-figure').closest('[inert]')).not.toBeNull()
    fireEvent.click(
      within(screen.getByTestId('rd-sheet')).getByRole('button', { name: /Visa underlaget/ }),
    )
    expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'peek')
    expect(screen.getByTestId('rd-figure').closest('[inert]')).toBeNull()
  })
})

// ── 8 · Repetera ────────────────────────────────────────────────────

describe('Ljuskägla DTK keys inside the page and the viewer', () => {
  // The bake-off switcher leaves keys alone inside a data-rd-keyscope region
  // (Redesign2026Bakeoff.test.tsx proves that); here every focus target that
  // uses the arrows sits inside one.
  it('puts the scroll region and the enlarged viewer inside a key scope', () => {
    spied(7)
    const figure = screen.getByTestId('rd-figure')
    const scroll = figure.querySelector<HTMLElement>('.lj-figure-scroll')
    if (!scroll) throw new Error('no scroll region')
    expect(scroll.closest('[data-rd-keyscope]')).not.toBeNull()
    fireEvent.click(within(figure).getByRole('button', { name: /Förstora figur/ }))
    const viewer = screen.getByTestId('rd-figure-viewer')
    for (const el of [viewer, ...viewer.querySelectorAll<HTMLElement>('button, [tabindex]')]) {
      expect(el.closest('[data-rd-keyscope]')).not.toBeNull()
    }
  })
})

describe('Ljuskägla Repetera', () => {
  const due = D.repetera.items.filter((i) => i.dueNow)
  const later = D.repetera.items.filter((i) => !i.dueNow)

  it('lists what is due first, each with its section and trap, then the rest of the pile', () => {
    spied(8)
    const items = screen.getAllByTestId(/^rd-repetera-item-/)
    expect(items.map((el) => el.dataset.testid)).toEqual(
      D.repetera.items.map((i) => `rd-repetera-item-${i.n}`),
    )
    for (const item of due) {
      const el = screen.getByTestId(`rd-repetera-item-${item.n}`)
      expect(el).toHaveTextContent(item.section)
      if (item.frameworkName) expect(el).toHaveTextContent(item.frameworkName)
    }
    if (later[0])
      expect(screen.getByTestId(`rd-repetera-item-${later[0].n}`)).toHaveTextContent(
        later[0].dueLabel,
      )
    expect(screen.getByTestId('rd-repetera-start')).toHaveTextContent(
      `Repetera ${Math.min(due.length, D.repetera.sessionSize)} frågor`,
    )
    expect(screen.getByTestId('rd-ljuskagla')).not.toHaveTextContent(MATH_MARKERS)
  })

  it('narrows the session to one section, and back to all', () => {
    const { actions } = spied(8)
    const kva = due.filter((i) => i.section === 'KVA')
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Visa delprov' })).getByRole('button', {
        name: /^KVA/,
      }),
    )
    expect(screen.getAllByTestId(/^rd-repetera-item-/)).toHaveLength(
      kva.length + later.filter((i) => i.section === 'KVA').length,
    )
    fireEvent.click(screen.getByTestId('rd-repetera-start'))
    expect(actions.startDrill).toHaveBeenLastCalledWith({ kind: 'repetition', section: 'KVA' })
    fireEvent.click(screen.getByRole('button', { name: /^Alla/ }))
    fireEvent.click(screen.getByTestId('rd-repetera-start'))
    expect(actions.startDrill).toHaveBeenLastCalledWith({ kind: 'repetition' })
  })

  it('caps a session at its size and says so', () => {
    spied(8, {
      data: { ...D, repetera: { ...D.repetera, sessionSize: 5 } },
    })
    expect(screen.getByTestId('rd-repetera-start')).toHaveTextContent('Repetera 5 frågor')
    expect(screen.getByText(/Ett pass tar 5 åt gången/)).toBeInTheDocument()
  })

  it.each<[string, RepeteraItemView[], string]>([
    ['no misses yet', [], 'Inga missar än'],
    ['nothing due now', later, 'Inget är redo just nu'],
  ])('with %s offers practice instead of a start', (_, items, heading) => {
    const { actions } = spied(8, {
      data: {
        ...D,
        repetera: { ...D.repetera, items, dueNow: 0, pile: items.length },
      },
    })
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    expect(screen.queryByTestId('rd-repetera-start')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Öva istället/ }))
    expect(actions.go).toHaveBeenCalledWith('ova')
  })

  it('returns to Öva, in the frame too when the host does not navigate', () => {
    const { actions } = spied(8)
    fireEvent.click(screen.getByRole('button', { name: /Till Öva/ }))
    expect(actions.go).toHaveBeenCalledWith('ova')
    expect(screen.getByTestId('rd-ova-repetera')).toBeInTheDocument()
  })

  it('starts the repetition from the bake-off and Avsluta comes back to Repetera', () => {
    stage(8)
    fireEvent.click(screen.getByTestId('rd-repetera-start'))
    expect(screen.getByTestId('rd-exit')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(screen.getByTestId('rd-repetera-start')).toBeInTheDocument()
  })
})

// ── 9 · Provpass ────────────────────────────────────────────────────

const HUB = D.provpass.hub
const RUN = D.provpass.running
const RESULT = D.provpass.result
const F = D.framsteg
/** The first DTK question of the running pass: a raster page. */
const PAGE_AT = RUN.questions.findIndex((q) => q.figure?.kind === 'raster')
const slug = (s: string) => s.toLocaleLowerCase('sv-SE').replace('ä', 'a')
const capitalized = (s: string) => s.charAt(0).toLocaleUpperCase('sv-SE') + s.slice(1)

function withProv(patch: {
  hub?: Partial<DirectionData['provpass']['hub']>
  running?: Partial<ProvRunningView>
  result?: Partial<ProvResultView>
}): DirectionData {
  return {
    ...D,
    provpass: {
      hub: { ...HUB, ...patch.hub },
      running: { ...RUN, ...patch.running },
      result: { ...RESULT, ...patch.result },
    },
  }
}

/** Screen 9 with spied actions, its suggested pass started through the gate. */
function startPass(opts: Parameters<typeof spied>[1] = {}) {
  const out = spied(9, opts)
  fireEvent.click(screen.getByTestId('rd-prov-start'))
  fireEvent.click(screen.getByTestId('rd-confirm'))
  return out
}

/** A host whose own clock ticks the running pass down, a second at a time. */
function TickingHost({ actions, from }: { actions: DirectionActions; from: number }) {
  const [left, setLeft] = useState(from)
  useEffect(() => {
    const id = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(id)
  }, [])
  return (
    <DirectionDataProvider
      data={withProv({ running: { remainingSeconds: left } })}
      actions={actions}
    >
      <Ljuskagla
        screen={9}
        width="desktop"
        theme="light"
        live
        onScreen={vi.fn()}
        onTheme={vi.fn()}
      />
    </DirectionDataProvider>
  )
}

/** The real bake-off page, its selection on show. `ask` sees each change
 *  the page asks its route for first, and may throw as a failing route does;
 *  a change `stays` picks is never made, as a route that keeps its place. */
function BakeoffHost({
  s = 9,
  w = 'desktop',
  ask,
  stays,
}: {
  s?: AppScreenKey
  w?: WidthKey
  ask?: (next: Partial<Selection>) => void
  stays?: (next: Partial<Selection>) => boolean
}) {
  const [sel, setSel] = useState<Selection>({ d: 'h', s, w, t: 'light', sbs: false, bare: false })
  return (
    <>
      <Redesign2026Bakeoff
        sel={sel}
        onSelect={(next) => {
          ask?.(next)
          if (!stays?.(next)) setSel((old) => ({ ...old, ...next }))
        }}
      />
      <output data-testid="host-selection">{`${sel.d}/${sel.s}/${sel.sbs}`}</output>
    </>
  )
}

/** The stage measures its box before it mounts a direction; jsdom has none. */
function stageBox() {
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(1440)
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(900)
}

/** The real host on Ljuskägla's Provpass, its suggested pass started. */
async function startInHost() {
  render(<BakeoffHost />)
  fireEvent.click(await screen.findByTestId('rd-prov-start', {}, { timeout: 5000 }))
  fireEvent.click(screen.getByTestId('rd-confirm'))
  return screen.getByTestId('rd-prov-running')
}

/** Vitest leaves CSS out (css: false): loads the direction's own sheet into
 *  jsdom around a block, as Samtal's tests do. jsdom lays nothing out, so
 *  this gives the cascade, not the geometry; the coordinator's browser pass
 *  checks the geometry. */
function withSheet() {
  const sheet = document.createElement('style')
  beforeAll(() => {
    sheet.textContent = readFileSync(
      path.resolve(process.cwd(), 'src/components/devbake/redesign/h-ljuskagla/ljuskagla.css'),
      'utf8',
    )
    document.head.appendChild(sheet)
  })
  afterAll(() => sheet.remove())
}

describe('Ljuskägla Provpass hub', () => {
  const suggested = HUB.passes.find((p) => p.half === HUB.half && p.suggested)
  const verbal = HUB.passes.find((p) => p.half === 'verbal' && p.suggested)
  if (!suggested || !verbal) throw new Error('the hub suggests a pass in each half')

  it('lights the rhythm’s suggested pass, a picked one from the register, and the other half’s', () => {
    spied(9)
    const lamp = screen.getByTestId('rd-prov-start').closest('section') as HTMLElement
    expect(lamp).toHaveTextContent(`${suggested.sitting}${suggested.pass}`)
    expect(lamp).toHaveTextContent('Förslag · det pass du sett minst av')
    expect(lamp).toHaveTextContent(`${suggested.seenBefore} av ${suggested.presented} frågor`)
    expect(screen.getByTestId(`rd-prov-pass-${suggested.id.replace(':', '-')}`)).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    const other = HUB.passes.find((p) => p.half === HUB.half && !p.suggested)
    if (!other) throw new Error('the fixture has more than one pass per half')
    fireEvent.click(screen.getByTestId(`rd-prov-pass-${other.id.replace(':', '-')}`))
    expect(lamp).toHaveTextContent(`${other.sitting}${other.pass}`)
    expect(lamp).toHaveTextContent('Valt provpass')
    fireEvent.click(screen.getByTestId('rd-prov-half-verbal'))
    expect(screen.getByTestId('rd-prov-half-verbal')).toHaveAttribute('aria-pressed', 'true')
    expect(lamp).toHaveTextContent(`${verbal.sitting}${verbal.pass}`)
    expect(screen.getByRole('complementary', { name: 'Din rytm' })).toHaveTextContent(
      'Nästa: ett kvantitativt pass om 1 dag.',
    )
    for (const rule of HUB.rules) expect(screen.getByText(capitalized(rule))).toBeInTheDocument()
    expect(screen.getByTestId('rd-nav-provpass')).toHaveAttribute('aria-current', 'page')
  })

  it('asks first: the gate names the pass and its rules, and backing out starts nothing', () => {
    const { actions } = spied(9)
    const start = screen.getByTestId('rd-prov-start')
    start.focus()
    fireEvent.click(start)
    const dialog = screen.getByRole('dialog', { name: `${suggested.sitting} · ${suggested.pass}` })
    expect(dialog).toHaveTextContent('Kvantitativ halva · 40 frågor · 55 minuter')
    expect(dialog).toHaveTextContent('Du har sett 6 av 40 frågor förut.')
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(HUB.rules.length)
    expect(within(dialog).getByRole('button', { name: 'Tillbaka' })).toHaveFocus()
    expect(screen.getByTestId('rd-nav-idag').closest('[inert]')).not.toBeNull()
    // Escape takes the safe choice, and focus comes home.
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(start).toHaveFocus()
    fireEvent.click(start)
    fireEvent.click(screen.getByRole('button', { name: 'Tillbaka' }))
    expect(actions.startProvpass).not.toHaveBeenCalled()
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
  })

  it('discloses a pass with missing questions before it starts', () => {
    const passes = HUB.passes.map((p) => (p.id === RUN.passId ? { ...p, presented: 39 } : p))
    spied(9, { data: withProv({ hub: { passes } }) })
    const lamp = screen.getByTestId('rd-prov-start').closest('section') as HTMLElement
    expect(lamp).toHaveTextContent('39 av 40 frågor tillgängliga.')
    fireEvent.click(screen.getByTestId('rd-prov-start'))
    expect(screen.getByRole('dialog')).toHaveTextContent('39 av 40 frågor tillgängliga.')
    expect(screen.getByRole('dialog')).toHaveTextContent('Kvantitativ halva · 39 frågor')
  })

  it('asks the host for a pass it has not supplied and waits, never running another one', () => {
    const { actions } = spied(9)
    fireEvent.click(screen.getByTestId('rd-prov-half-verbal'))
    fireEvent.click(screen.getByTestId('rd-prov-start'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(actions.startProvpass).toHaveBeenCalledWith(verbal.id)
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
    expect(
      screen.getByRole('heading', { name: `${verbal.sitting} · ${verbal.pass}` }),
    ).toHaveFocus()
    expect(
      screen.getByText('Frågorna hämtas. Klockan startar först när de finns på plats.'),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('rd-prov-start')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Tillbaka till provpassen/ }))
    expect(screen.getByTestId('rd-prov-start')).toBeInTheDocument()
  })

  it('with no real pass in a half, offers the other half instead of a start', () => {
    spied(9, { data: withProv({ hub: { passes: HUB.passes.filter((p) => p.half === 'kvant') } }) })
    fireEvent.click(screen.getByTestId('rd-prov-half-verbal'))
    expect(screen.getByRole('heading', { name: 'Inga riktiga pass än' })).toBeInTheDocument()
    expect(screen.queryByTestId('rd-prov-start')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Till kvantitativ halva' }))
    expect(screen.getByTestId('rd-prov-start')).toBeInTheDocument()
  })
})

describe('Ljuskägla running pass', () => {
  it('records answers without grading, lets them change and keeps them across jumps', () => {
    const { actions } = startPass()
    const q = RUN.questions[RUN.current]
    const n = RUN.current + 1
    expect(
      screen.getByRole('heading', { name: `Fråga ${n} av ${RUN.questions.length} · ${q.section}` }),
    ).toHaveFocus()
    expect(screen.getByTestId('rd-prov-timer')).toHaveTextContent('31:12 kvar')
    expect(screen.queryByTestId('rd-nav-idag')).toBeNull()
    fireEvent.keyDown(window, { key: 'a' })
    expect(screen.getByTestId('rd-prov-option-A')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByTestId('rd-prov-option-B'))
    expect(screen.getByTestId('rd-prov-option-A')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Ditt svar: B')).toBeInTheDocument()
    expect(screen.getByTestId(`rd-prov-cell-${n}`)).toHaveAttribute('data-answered', 'true')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId(`rd-prov-cell-${n + 1}`)).toHaveAttribute('data-current', 'true')
    expect(screen.getByText('Inget svar valt än')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-prov-cell-1'))
    expect(screen.getByTestId('rd-prov-cell-1')).toHaveAttribute('data-current', 'true')
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByTestId('rd-prov-cell-1')).toHaveAttribute('data-current', 'true')
    fireEvent.click(screen.getByTestId(`rd-prov-cell-${n}`))
    expect(screen.getByTestId('rd-prov-option-B')).toHaveAttribute('aria-pressed', 'true')
    // Only the question's own letters choose; no verdict, and Escape never leaves.
    fireEvent.keyDown(window, { key: 'e' })
    expect(screen.queryByTestId('rd-prov-option-E')).toBeNull()
    expect(actions.drill.lock).not.toHaveBeenCalled()
    expect(screen.queryByTestId('rd-verdict')).toBeNull()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
  })

  it('marks a question in the map', () => {
    startPass()
    const flag = screen.getByTestId('rd-prov-flag')
    expect(flag).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(flag)
    expect(flag).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId(`rd-prov-cell-${RUN.current + 1}`)).toHaveAttribute(
      'data-flagged',
      'true',
    )
  })

  it('leaves the mark out when the pass carries no flags', () => {
    startPass({ data: withProv({ running: { flags: undefined } }) })
    expect(screen.queryByTestId('rd-prov-flag')).toBeNull()
    expect(screen.getByTestId('rd-prov-running')).not.toHaveTextContent(/markera/i)
  })

  it('hands in through a gate that names what is blank, then locks the answers', () => {
    const { actions } = startPass()
    const submit = screen.getByTestId('rd-prov-submit')
    submit.focus()
    fireEvent.click(submit)
    const dialog = screen.getByRole('dialog', { name: 'Lämna in provpasset?' })
    expect(dialog).toHaveTextContent('16 av 40 frågor har ett svar.')
    expect(dialog).toHaveTextContent('24 frågor är obesvarade: 17–40.')
    expect(dialog).toHaveTextContent('Markerade: 9 och 14.')
    expect(actions.submitProvpass).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tillbaka till frågorna' }))
    expect(submit).toHaveFocus()
    fireEvent.click(submit)
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
    // This host stays on Provpass: the pass is handed in, and ended (review hpf-hegb).
    expect(screen.getByRole('heading', { name: 'Passet är inlämnat.' })).toHaveFocus()
    expect(screen.getByTestId('rd-prov-option-A')).toBeDisabled()
    expect(screen.queryByTestId('rd-prov-submit')).toBeNull()
    fireEvent.keyDown(window, { key: 'b' })
    expect(screen.getByTestId('rd-prov-option-B')).toHaveAttribute('aria-pressed', 'false')
  })

  it('turns Nästa fråga into Granska svar at the last question', () => {
    startPass()
    fireEvent.click(screen.getByTestId(`rd-prov-cell-${RUN.questions.length}`))
    fireEvent.click(screen.getByRole('button', { name: /Granska svar/ }))
    expect(screen.getByRole('dialog', { name: 'Lämna in provpasset?' })).toBeInTheDocument()
  })

  it('asks before abandoning: Fortsätt keeps the pass, Avbryt voids it with no result', () => {
    const { actions } = startPass()
    fireEvent.click(screen.getByTestId('rd-prov-option-C'))
    fireEvent.click(screen.getByTestId('rd-exit'))
    const dialog = screen.getByRole('dialog', { name: 'Avbryta provpasset?' })
    expect(dialog).toHaveTextContent('Avbryter du blir provet ogiltigt och inget resultat sparas.')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Fortsätt provpasset' }))
    expect(screen.getByTestId('rd-prov-option-C')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByTestId('rd-exit'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
    expect(actions.submitProvpass).not.toHaveBeenCalled()
    expect(
      screen.getByText('Provpasset avbröts. Det räknas inte, och inget resultat sparades.'),
    ).toHaveFocus()
    expect(screen.getByTestId('rd-nav-provpass')).toHaveAttribute('aria-current', 'page')
  })

  it('hands in exactly once when its own clock runs out, even with a gate open', () => {
    vi.useFakeTimers()
    try {
      const { actions } = startPass({ data: withProv({ running: { remainingSeconds: 3 } }) })
      expect(screen.getByText('Fem minuter kvar. Ge varje obesvarad fråga ett svar.')).toBeVisible()
      fireEvent.click(screen.getByTestId('rd-exit'))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      act(() => vi.advanceTimersByTime(3500))
      expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(screen.getByRole('heading', { name: 'Passet är inlämnat.' })).toBeInTheDocument()
      expect(screen.getByText(/^Tiden tog slut\./)).toBeInTheDocument()
      expect(screen.queryByTestId('rd-prov-timer')).toBeNull()
      act(() => vi.advanceTimersByTime(5000))
      expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('hands in exactly once when the host’s own clock reaches zero first, and never voids it', () => {
    vi.useFakeTimers()
    try {
      const actions = spyActions()
      render(<TickingHost actions={actions} from={4} />)
      // The host is at 3 s, mid-second: its zero (4 s) comes before the pass's deadline (4.5 s).
      act(() => vi.advanceTimersByTime(1500))
      fireEvent.click(screen.getByTestId('rd-prov-start'))
      fireEvent.click(screen.getByTestId('rd-confirm'))
      act(() => vi.advanceTimersByTime(2600))
      expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('rd-prov-running')).toHaveAttribute('data-settle', 'handed-in')
      expect(screen.queryByText('Tiden gick ut.')).toBeNull()
      act(() => vi.advanceTimersByTime(5000))
      expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('checks the deadline at the moment of input when a timer was held back', () => {
    vi.useFakeTimers()
    try {
      const { actions } = startPass({ data: withProv({ running: { remainingSeconds: 2 } }) })
      vi.setSystemTime(Date.now() + 3000)
      fireEvent.keyDown(window, { key: 'a' })
      expect(screen.getByTestId('rd-prov-option-A')).toHaveAttribute('aria-pressed', 'false')
      expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows a pass that was out of time on entry as ended, with no result and no hand-in', () => {
    const { actions } = startPass({ data: withProv({ running: { remainingSeconds: 0 } }) })
    expect(screen.getByRole('heading', { name: 'Tiden gick ut.' })).toBeInTheDocument()
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
    expect(actions.submitProvpass).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Till Provpass/ }))
    expect(actions.go).toHaveBeenCalledWith('provpass')
    expect(screen.getByTestId('rd-prov-start')).toBeInTheDocument()
  })

  it.each<WidthKey>([
    'desktop',
    'phone',
  ])('on %s, after a failed hand-in opens a door in the frame too when the host does not navigate', (width) => {
    const { actions } = startPass({ width })
    vi.mocked(actions.submitProvpass).mockImplementation(() => {
      throw new Error('offline')
    })
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(screen.getByRole('heading', { name: 'Provpasset kunde inte lämnas in.' })).toHaveFocus()
    fireEvent.click(screen.getByTestId('rd-nav-framsteg'))
    expect(actions.go).toHaveBeenCalledWith('framsteg')
    expect(screen.getByTestId('rd-framsteg-prognosis')).toBeInTheDocument()
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
    expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
  })

  it.each<WidthKey>([
    'desktop',
    'phone',
  ])('on %s, after a hand-in the host does not follow opens a door in the frame too', (width) => {
    const { actions } = startPass({ width })
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(screen.getByRole('heading', { name: 'Passet är inlämnat.' })).toHaveFocus()
    expect(screen.getByTestId('rd-nav-provpass')).toHaveAttribute('aria-current', 'page')
    fireEvent.click(screen.getByTestId('rd-nav-framsteg'))
    expect(actions.go).toHaveBeenCalledWith('framsteg')
    expect(screen.getByTestId('rd-framsteg-prognosis')).toBeInTheDocument()
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
    expect(actions.submitProvpass).toHaveBeenCalledTimes(1)
  })

  it('keeps its place inside a pass that shrinks, and stays there when it grows back', () => {
    const actions = spyActions()
    const view = (data: DirectionData) => (
      <DirectionDataProvider data={data} actions={actions}>
        <Ljuskagla
          screen={9}
          width="desktop"
          theme="light"
          live
          onScreen={vi.fn()}
          onTheme={vi.fn()}
        />
      </DirectionDataProvider>
    )
    const { rerender } = render(view(D))
    fireEvent.click(screen.getByTestId('rd-prov-start'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    rerender(view(withProv({ running: { questions: RUN.questions.slice(0, 5) } })))
    expect(screen.getByTestId('rd-prov-cell-5')).toHaveAttribute('data-current', 'true')
    expect(screen.queryByTestId('rd-prov-cell-6')).toBeNull()
    expect(screen.getByRole('heading', { name: /^Fråga 5 av 5/ })).toBeInTheDocument()
    rerender(view(D))
    expect(screen.getByTestId('rd-prov-cell-5')).toHaveAttribute('data-current', 'true')
  })

  it('holds a figure question’s answers until its page has loaded, page by page', () => {
    startPass()
    const page = () => within(screen.getByTestId('rd-figure')).getByRole('img')
    fireEvent.click(screen.getByTestId(`rd-prov-cell-${PAGE_AT + 1}`))
    expect(screen.getByTestId('rd-prov-option-A')).toBeDisabled()
    expect(screen.getByText('Svaren går att välja när underlaget har laddats.')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'a' })
    expect(screen.getByTestId('rd-prov-option-A')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.load(page())
    expect(screen.getByTestId('rd-prov-option-A')).toBeEnabled()
    // The next question on the same page needs no second load.
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('rd-figure')).toHaveTextContent('Samma sida · fråga 2 av 3')
    expect(screen.getByTestId('rd-prov-option-A')).toBeEnabled()
    // A new page starts over; a failed one waits for a retry that loads afresh.
    const first = RUN.questions[PAGE_AT].figure?.src
    const next = RUN.questions.findIndex(
      (q, i) => i > PAGE_AT && q.figure && q.figure.src !== first,
    )
    fireEvent.click(screen.getByTestId(`rd-prov-cell-${next + 1}`))
    expect(screen.getByTestId('rd-prov-option-A')).toBeDisabled()
    fireEvent.error(page())
    expect(screen.getByText('Underlaget kunde inte visas.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Försök igen/ }))
    expect(screen.getByText('Underlaget laddas …')).toBeInTheDocument()
    expect(screen.getByTestId('rd-prov-option-A')).toBeDisabled()
    fireEvent.load(page())
    expect(screen.getByTestId('rd-prov-option-A')).toBeEnabled()
  })

  it('counts a page already complete from the cache as loaded', () => {
    startPass()
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(1200)
    fireEvent.click(screen.getByTestId(`rd-prov-cell-${PAGE_AT + 1}`))
    expect(screen.getByTestId('rd-prov-option-A')).toBeEnabled()
  })

  // Readiness belongs to the image mounted now, not to a source that loaded
  // once (review hpf-r4it): a page that comes back is a new image.
  it.each<[string, (page: string | undefined) => number]>([
    [
      'another page',
      (page) => RUN.questions.findIndex((q, i) => i > PAGE_AT && q.figure && q.figure.src !== page),
    ],
    ['a question without a figure', () => RUN.questions.findIndex((q) => !q.figure)],
  ])('holds a page’s answers again when it comes back after %s, until the new image loads', (_, away) => {
    startPass()
    const page = () => within(screen.getByTestId('rd-figure')).getByRole('img')
    fireEvent.click(screen.getByTestId(`rd-prov-cell-${PAGE_AT + 1}`))
    const first = page()
    fireEvent.load(first)
    expect(screen.getByTestId('rd-prov-option-A')).toBeEnabled()
    fireEvent.click(
      screen.getByTestId(`rd-prov-cell-${away(RUN.questions[PAGE_AT].figure?.src) + 1}`),
    )
    fireEvent.click(screen.getByTestId(`rd-prov-cell-${PAGE_AT + 1}`))
    const again = page()
    expect(again).not.toBe(first)
    expect(again).toHaveAttribute('src', first.getAttribute('src'))
    expect(screen.getByTestId('rd-prov-option-A')).toBeDisabled()
    expect(screen.getByText('Svaren går att välja när underlaget har laddats.')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'a' })
    expect(screen.getByTestId('rd-prov-option-A')).toHaveAttribute('aria-pressed', 'false')
    // A late event from the image that left changes nothing.
    fireEvent.load(first)
    expect(screen.getByTestId('rd-prov-option-A')).toBeDisabled()
    fireEvent.load(again)
    expect(screen.getByTestId('rd-prov-option-A')).toBeEnabled()
    // The enlarged page is the viewer's own: its failure leaves the gate be.
    fireEvent.click(screen.getByRole('button', { name: 'Förstora figur' }))
    fireEvent.error(within(screen.getByTestId('rd-figure-viewer')).getByRole('img'))
    fireEvent.click(screen.getByRole('button', { name: 'Stäng' }))
    expect(screen.getByTestId('rd-prov-option-A')).toBeEnabled()
  })

  it('holds image answers again when a phone sheet mounts them afresh, until each loads', () => {
    const imaged = (q: DrillQuestion): DrillQuestion => ({
      ...q,
      options:
        q.options?.map((o) => ({
          ...o,
          figure: {
            src: `figures/${q.qid}-${o.letter}.svg`,
            alt: `Bildalternativ ${o.letter}`,
            width: 240,
            height: 120,
          },
        })) ?? null,
    })
    const questions = RUN.questions.map((q, i) => (i === PAGE_AT ? imaged(q) : q))
    startPass({ width: 'phone', data: withProv({ running: { questions } }) })
    fireEvent.click(screen.getByRole('button', { name: /Svarsöversikt/ }))
    fireEvent.click(screen.getByTestId(`rd-prov-cell-${PAGE_AT + 1}`))
    fireEvent.load(within(screen.getByTestId('rd-figure')).getByRole('img'))
    const sheet = screen.getByRole('region', { name: `Fråga ${PAGE_AT + 1}` })
    const toggle = () => fireEvent.click(within(sheet).getByRole('button', { name: /^Visa / }))
    const options = () => screen.getAllByRole('img', { name: /^Bildalternativ / })
    toggle()
    expect(screen.getByTestId('rd-prov-option-A')).toBeDisabled()
    for (const img of options()) fireEvent.load(img)
    expect(screen.getByTestId('rd-prov-option-A')).toBeEnabled()
    const before = options()
    toggle()
    expect(sheet).toHaveAttribute('data-state', 'peek')
    // Folded away, the image answers are not there to choose among.
    fireEvent.keyDown(window, { key: 'b' })
    expect(within(sheet).queryByText(/ditt svar/)).toBeNull()
    toggle()
    const [first, ...rest] = options()
    expect(first).not.toBe(before[0])
    expect(screen.getByTestId('rd-prov-option-A')).toBeDisabled()
    for (const img of rest) fireEvent.load(img)
    expect(screen.getByTestId('rd-prov-option-A')).toBeDisabled()
    fireEvent.load(first)
    expect(screen.getByTestId('rd-prov-option-A')).toBeEnabled()
  })

  it('reads a text question in the reading room: English as English, the badge outside it', () => {
    const elf = D.drills.elf.questions
    startPass({ data: withProv({ running: { questions: elf, current: 0, answers: {} } }) })
    const passage = screen.getByTestId('rd-prov-passage')
    expect(passage).toHaveAttribute('lang', 'en')
    expect(screen.getByText(D.copy.ovningstextBadge)).toBeInTheDocument()
    expect(passage).not.toContainElement(screen.getByText(D.copy.ovningstextBadge))
    fireEvent.click(within(passage).getByRole('button', { name: 'Lys upp stycke 1' }))
    expect(passage.querySelector('[data-paragraph="1"]')).toHaveAttribute('data-lit', 'true')
    expect(screen.queryByTestId('rd-verdict')).toBeNull()
  })

  it('on a phone keeps the map one tap away, and a page’s question in a sheet', () => {
    startPass({ width: 'phone' })
    const toggle = screen.getByRole('button', { name: /Svarsöversikt/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByTestId('rd-prov-grid').closest('[hidden]')).not.toBeNull()
    fireEvent.click(toggle)
    expect(screen.getByTestId('rd-prov-grid').closest('[hidden]')).toBeNull()
    fireEvent.click(screen.getByTestId(`rd-prov-cell-${PAGE_AT + 1}`))
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    const sheet = screen.getByRole('region', { name: `Fråga ${PAGE_AT + 1}` })
    expect(sheet).toHaveAttribute('data-state', 'peek')
    expect(screen.queryByTestId('rd-prov-option-A')).toBeNull()
    fireEvent.click(within(sheet).getByRole('button', { name: /Visa frågan/ }))
    expect(sheet).toHaveAttribute('data-state', 'open')
    expect(screen.getByTestId('rd-prov-option-A')).toBeInTheDocument()
  })

  it.each<WidthKey>([
    'desktop',
    'phone',
  ])('on %s, runs from the hub to a handed-in result in the bake-off, and back', (width) => {
    stage(9, width)
    fireEvent.click(screen.getByTestId('rd-prov-start'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(screen.getByTestId('rd-prov-result')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Till Provpass/ }))
    expect(screen.getByTestId('rd-prov-start')).toBeInTheDocument()
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
  })
})

describe('Ljuskägla running pass through the real bake-off host', () => {
  beforeEach(stageBox)

  it.each([
    'answer',
    'cell',
    'heading',
    'body',
    'switcher',
  ] as const)('holds every switcher key inside a running pass with focus on the %s', async (target) => {
    const runner = await startInHost()
    const answer = screen.getByTestId('rd-prov-option-A')
    fireEvent.click(answer)
    const focused =
      target === 'answer'
        ? answer
        : target === 'cell'
          ? screen.getByTestId('rd-prov-cell-2')
          : target === 'heading'
            ? screen.getByRole('heading', { name: /^Fråga 17 av 40/ })
            : target === 'switcher'
              ? within(screen.getByTestId('rb26-bar')).getAllByRole('button')[0]
              : document.body
    focused.focus()
    for (const key of ['1', '2', '3', '4', '5', '6', '7', '8', '0']) {
      expect(fireEvent.keyDown(focused, { key })).toBe(false)
      expect(screen.getByTestId('host-selection')).toHaveTextContent('h/9/false')
      expect(screen.getByTestId('rd-prov-running')).toBe(runner)
      expect(answer).toHaveAttribute('aria-pressed', 'true')
    }
    // The arrows change the question from the heading or the body, never the
    // screen. A focused control keeps them: natively inside the pass, held
    // outside it (review hpf-r4it).
    const control = target === 'answer' || target === 'cell' || target === 'switcher'
    expect(fireEvent.keyDown(focused, { key: 'ArrowRight' })).toBe(target !== 'switcher' && control)
    expect(screen.getByTestId('host-selection')).toHaveTextContent('h/9/false')
    expect(screen.getByTestId(`rd-prov-cell-${control ? 17 : 18}`)).toHaveAttribute(
      'data-current',
      'true',
    )
    expect(runner).toHaveAttribute('data-rd-keyscope')
    // An abandoned pass gives the switcher its keys back.
    fireEvent.click(screen.getByTestId('rd-exit'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    fireEvent.keyDown(window, { key: '3' })
    expect(screen.getByTestId('host-selection')).toHaveTextContent('c/9/false')
  })

  it('lets a page pan with the arrows inside a running pass', async () => {
    await startInHost()
    fireEvent.click(screen.getByTestId(`rd-prov-cell-${PAGE_AT + 1}`))
    const pan = screen.getByRole('region', { name: /Underlaget\. Rulla/ })
    pan.focus()
    expect(fireEvent.keyDown(pan, { key: 'ArrowRight' })).toBe(true)
    expect(screen.getByTestId(`rd-prov-cell-${PAGE_AT + 1}`)).toHaveAttribute(
      'data-current',
      'true',
    )
    expect(screen.getByTestId('host-selection')).toHaveTextContent('h/9/false')
  })

  it('hands in through the host and lands on the result, its heading in focus', async () => {
    await startInHost()
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(screen.getByTestId('host-selection')).toHaveTextContent('h/10/false')
    expect(screen.getByRole('heading', { name: 'Provpasset är klart.' })).toHaveFocus()
    expect(screen.getByTestId('rd-nav-provpass')).toHaveAttribute('aria-current', 'page')
    fireEvent.click(screen.getByRole('button', { name: /Till Provpass/ }))
    expect(screen.getByTestId('host-selection')).toHaveTextContent('h/9/false')
    expect(screen.getByTestId('rd-prov-start')).toBeInTheDocument()
  })

  it('switches Framsteg’s two views on a phone with the arrows, never the screen', async () => {
    render(<BakeoffHost s={11} w="phone" />)
    const list = await screen.findByRole('tablist', { name: 'Framsteg' }, { timeout: 5000 })
    const [overview, history] = within(list).getAllByRole('tab')
    expect(overview).toHaveAttribute('aria-selected', 'true')
    expect(history).toHaveAttribute('tabindex', '-1')
    overview.focus()
    expect(fireEvent.keyDown(overview, { key: 'ArrowRight' })).toBe(false)
    expect(history).toHaveAttribute('aria-selected', 'true')
    expect(history).toHaveFocus()
    expect(screen.getByTestId('host-selection')).toHaveTextContent('h/11/false')
    expect(screen.getByRole('tabpanel', { name: 'Historik' })).toContainElement(
      screen.getByTestId('rd-framsteg-history'),
    )
    fireEvent.keyDown(history, { key: 'Home' })
    expect(overview).toHaveAttribute('aria-selected', 'true')
    expect(overview).toHaveFocus()
  })
})

describe('Ljuskägla running pass, a focused scroll region through the real bake-off host', () => {
  // The region scrolls by its own CSS: the sheet supplies it.
  withSheet()
  beforeEach(stageBox)

  it('keeps its arrows, Shift included, while the digits stay held', async () => {
    const runner = await startInHost()
    const column = runner.querySelector<HTMLElement>('.lj-problem-column')
    if (!column) throw new Error('question 17 is a problem in its own column')
    expect(column.querySelector('[data-lj-pan]')).toBeNull()
    // Chrome and Firefox let an overflowing scroll region with nothing to tab
    // to inside take focus on its own; jsdom lays nothing out, so the column
    // is given that focusability here.
    column.tabIndex = -1
    column.focus()
    for (const shiftKey of [false, true]) {
      for (const key of ['ArrowRight', 'ArrowLeft']) {
        expect(fireEvent.keyDown(column, { key, shiftKey })).toBe(true)
        expect(column).toHaveFocus()
        expect(screen.getByTestId('rd-prov-cell-17')).toHaveAttribute('data-current', 'true')
        expect(screen.getByTestId('host-selection')).toHaveTextContent('h/9/false')
      }
    }
    for (const key of ['1', '8', '0']) {
      expect(fireEvent.keyDown(column, { key })).toBe(false)
      expect(screen.getByTestId('host-selection')).toHaveTextContent('h/9/false')
    }
    // The question's heading, inside the same column, still changes question.
    const heading = screen.getByRole('heading', { name: /^Fråga 17 av 40/ })
    heading.focus()
    expect(fireEvent.keyDown(heading, { key: 'ArrowRight', shiftKey: true })).toBe(false)
    expect(screen.getByTestId('rd-prov-cell-18')).toHaveAttribute('data-current', 'true')
    expect(screen.getByTestId('host-selection')).toHaveTextContent('h/9/false')
  })
})

/**
 * Runs the suggested pass in the real host until it is handed in, by the
 * reader or by the clock. The host's submitProvpass asks its route for the
 * result (screen 10). A route that `fails` throws there, as an offline one
 * would; one that `stays` lets the hand-in return and keeps screen 9.
 * Question 17 keeps the answer B. Then the clock runs far past the deadline,
 * where a second hand-in would show. Returns how many hand-ins the host has
 * seen.
 */
async function handInInHost(how: 'hand-in' | 'time', route: 'fails' | 'stays') {
  const ask = vi.fn((next: Partial<Selection>) => {
    if (route === 'fails' && next.s === 10) throw new Error('offline')
  })
  render(<BakeoffHost ask={ask} stays={(next) => route === 'stays' && next.s === 10} />)
  fireEvent.click(await screen.findByTestId('rd-prov-start', {}, { timeout: 5000 }))
  vi.useFakeTimers()
  fireEvent.click(screen.getByTestId('rd-confirm'))
  fireEvent.click(screen.getByTestId('rd-prov-option-B'))
  if (how === 'hand-in') {
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
  } else {
    vi.setSystemTime(Date.now() + RUN.remainingSeconds * 1000)
    act(() => vi.advanceTimersByTime(1000))
  }
  vi.setSystemTime(Date.now() + 2 * RUN.remainingSeconds * 1000)
  act(() => vi.advanceTimersByTime(5000))
  vi.useRealTimers()
  return () => ask.mock.calls.filter(([next]) => next.s === 10).length
}

describe('Ljuskägla failed hand-in through the real bake-off host', () => {
  beforeEach(stageBox)
  afterEach(() => vi.useRealTimers())

  it.each([
    'hand-in',
    'time',
  ] as const)('after a failed %s shows the error over read-only answers, once, with a way back to the hub', async (how) => {
    const handIns = await handInInHost(how, 'fails')
    expect(screen.getByRole('heading', { name: 'Provpasset kunde inte lämnas in.' })).toHaveFocus()
    expect(handIns()).toBe(1)
    const runner = screen.getByTestId('rd-prov-running')
    expect(runner).toHaveAttribute('data-settle', 'failed')
    expect(runner.closest('[data-rd-keyscope]')).toBeNull()
    expect(screen.getByTestId('rd-prov-option-B')).toHaveAttribute('aria-pressed', 'true')
    for (const letter of ['A', 'B', 'C', 'D'])
      expect(screen.getByTestId(`rd-prov-option-${letter}`)).toBeDisabled()
    fireEvent.keyDown(document.body, { key: 'c' })
    expect(screen.getByTestId('rd-prov-option-C')).toHaveAttribute('aria-pressed', 'false')
    // No resubmit: kit v2 cannot tell a lost answer from a failed hand-in.
    expect(screen.queryByRole('button', { name: /igen/ })).toBeNull()
    expect(screen.getByTestId('rd-nav-provpass')).toHaveAttribute('aria-current', 'page')
    fireEvent.click(screen.getByRole('button', { name: /Till Provpass/ }))
    expect(screen.getByTestId('host-selection')).toHaveTextContent('h/9/false')
    expect(screen.getByTestId('rd-prov-start')).toBeInTheDocument()
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
    expect(screen.queryByTestId('rd-prov-result')).toBeNull()
    expect(handIns()).toBe(1)
  })

  it.each(
    (['hand-in', 'time'] as const).flatMap((how) =>
      (['focused heading', 'body'] as const).flatMap((where) =>
        (
          [
            ['3', 'c/9/false'],
            ['ArrowLeft', 'h/8/false'],
          ] as const
        ).map(([key, after]) => [how, key, where, after] as const),
      ),
    ),
  )('after a failed %s gives the switcher its %s back on the %s', async (how, key, where, after) => {
    const handIns = await handInInHost(how, 'fails')
    const heading = screen.getByRole('heading', { name: 'Provpasset kunde inte lämnas in.' })
    expect(heading).toHaveFocus()
    if (where === 'body') {
      heading.blur()
      expect(document.body).toHaveFocus()
    }
    fireEvent.keyDown(where === 'body' ? document.body : heading, { key })
    expect(screen.getByTestId('host-selection')).toHaveTextContent(after)
    expect(handIns()).toBe(1)
  })

  it('after a failed hand-in leads through its doors as well', async () => {
    const handIns = await handInInHost('hand-in', 'fails')
    fireEvent.click(screen.getByTestId('rd-nav-framsteg'))
    expect(screen.getByTestId('host-selection')).toHaveTextContent('h/11/false')
    expect(screen.getByTestId('rd-framsteg-prognosis')).toBeInTheDocument()
    expect(handIns()).toBe(1)
  })
})

// A hand-in that returns while the host stays on Provpass has ended the
// attempt just the same (review hpf-hegb).
describe('Ljuskägla hand-in the host does not follow, through the real bake-off host', () => {
  beforeEach(stageBox)
  afterEach(() => vi.useRealTimers())

  it.each([
    'hand-in',
    'time',
  ] as const)('after a %s that returns on screen 9 ends the pass calmly over read-only answers, once, with a way back to the hub', async (how) => {
    const handIns = await handInInHost(how, 'stays')
    expect(screen.getByTestId('host-selection')).toHaveTextContent('h/9/false')
    expect(screen.getByRole('heading', { name: 'Passet är inlämnat.' })).toHaveFocus()
    expect(handIns()).toBe(1)
    const runner = screen.getByTestId('rd-prov-running')
    expect(runner).toHaveAttribute('data-settle', 'handed-in')
    expect(runner.closest('[data-rd-keyscope]')).toBeNull()
    if (how === 'time') expect(runner).toHaveTextContent('Tiden tog slut.')
    expect(screen.queryByTestId('rd-prov-result')).toBeNull()
    expect(screen.getByTestId('rd-prov-option-B')).toHaveAttribute('aria-pressed', 'true')
    for (const letter of ['A', 'B', 'C', 'D'])
      expect(screen.getByTestId(`rd-prov-option-${letter}`)).toBeDisabled()
    fireEvent.keyDown(document.body, { key: 'c' })
    expect(screen.getByTestId('rd-prov-option-C')).toHaveAttribute('aria-pressed', 'false')
    // Never a second hand-in, and no moving on.
    expect(screen.queryByTestId('rd-prov-submit')).toBeNull()
    expect(
      screen.queryByRole('button', { name: /Lämna in|igen|Nästa fråga|Granska svar/ }),
    ).toBeNull()
    expect(screen.getByTestId('rd-nav-provpass')).toHaveAttribute('aria-current', 'page')
    fireEvent.click(screen.getByRole('button', { name: /Till Provpass/ }))
    expect(screen.getByTestId('host-selection')).toHaveTextContent('h/9/false')
    expect(screen.getByTestId('rd-prov-start')).toBeInTheDocument()
    expect(screen.queryByTestId('rd-prov-running')).toBeNull()
    expect(screen.queryByTestId('rd-prov-result')).toBeNull()
    expect(handIns()).toBe(1)
  })

  it.each(
    (['hand-in', 'time'] as const).flatMap((how) =>
      (['focused heading', 'body'] as const).flatMap((where) =>
        (
          [
            ['3', 'c/9/false'],
            ['ArrowLeft', 'h/8/false'],
          ] as const
        ).map(([key, after]) => [how, key, where, after] as const),
      ),
    ),
  )('after a %s that returns on screen 9 gives the switcher its %s back on the %s', async (how, key, where, after) => {
    const handIns = await handInInHost(how, 'stays')
    const heading = screen.getByRole('heading', { name: 'Passet är inlämnat.' })
    expect(heading).toHaveFocus()
    if (where === 'body') {
      heading.blur()
      expect(document.body).toHaveFocus()
    }
    fireEvent.keyDown(where === 'body' ? document.body : heading, { key })
    expect(screen.getByTestId('host-selection')).toHaveTextContent(after)
    expect(handIns()).toBe(1)
  })

  it.each([
    'hand-in',
    'time',
  ] as const)('after a %s that returns on screen 9 leads through its doors as well', async (how) => {
    const handIns = await handInInHost(how, 'stays')
    fireEvent.click(screen.getByTestId('rd-nav-framsteg'))
    expect(screen.getByTestId('host-selection')).toHaveTextContent('h/11/false')
    expect(screen.getByTestId('rd-framsteg-prognosis')).toBeInTheDocument()
    expect(handIns()).toBe(1)
  })
})

// ── 10 · Provpassresultat ───────────────────────────────────────────

describe('Ljuskägla Provpassresultat', () => {
  it('leads with the raw result, then how the score was made, and one next step', () => {
    const { actions } = spied(10)
    const receipt = screen.getByTestId('rd-prov-result')
    expect(receipt).toHaveTextContent(`av ${RESULT.presented} rätt`)
    expect(receipt).toHaveTextContent('38 besvarade · 2 obesvarade · tid 53:30 av 55:00')
    const score = screen.getByTestId('rd-prov-score')
    expect(RESULT.score.derived).toBe('official-derived')
    expect(score).toHaveTextContent(fmtScore(RESULT.score.value ?? 0))
    expect(score).toHaveTextContent('Normerat (härlett)')
    expect(receipt).toHaveTextContent('räknas om till en hel provhalva på 80 frågor')
    expect(receipt).toHaveTextContent('Genomgången av frågorna du missade finns inte här än.')
    fireEvent.click(within(receipt).getByRole('button', { name: /Till Öva/ }))
    expect(actions.go).toHaveBeenCalledWith('ova')
  })

  it('sets each section against its share of the time, with earlier passes of the kind beside it', () => {
    const { actions } = spied(10)
    expect(screen.getByRole('table')).toHaveTextContent('Rätt svar per delprov')
    for (const s of RESULT.sections) {
      const row = screen.getByTestId(`rd-prov-section-${slug(s.section)}`)
      expect(row).toHaveTextContent(`${s.correct} av ${s.presented}`)
      expect(row).toHaveTextContent(`${fmtClock(s.timeSeconds)} av ${fmtClock(s.quotaSeconds)}`)
      if (s.timeSeconds > s.quotaSeconds) expect(row).toHaveTextContent('över andelen')
      else expect(row).not.toHaveTextContent('över andelen')
    }
    const history = screen.getByTestId('rd-prov-history')
    RESULT.history.forEach((h, i) => {
      const item = within(history).getByTestId(`rd-prov-history-item-${i + 1}`)
      fireEvent.click(within(item).getByRole('button'))
      expect(actions.openProvResult).toHaveBeenLastCalledWith(h.id)
    })
  })

  it('says when a pass lacked questions, and keeps a missing score absent', () => {
    spied(10, {
      data: withProv({
        result: {
          presented: 39,
          answered: 39,
          score: { value: null, derived: 'linear', label: 'skattad' },
        },
      }),
    })
    const receipt = screen.getByTestId('rd-prov-result')
    expect(receipt).toHaveTextContent('1 fråga saknas i passet, så det rättades av 39.')
    expect(receipt).not.toHaveTextContent('obesvarade')
    expect(screen.getByTestId('rd-prov-score')).toHaveTextContent('Ingen poäng för det här passet.')
    expect(screen.getByTestId('rd-prov-score')).not.toHaveTextContent(/\d,\d/)
  })

  it('names a linear estimate as one, and with nothing missed points on to Framsteg', () => {
    const { actions } = spied(10, {
      data: withProv({
        result: {
          missed: [],
          score: { value: 1.2, derived: 'linear', label: 'skattad' },
          history: [],
        },
      }),
    })
    const receipt = screen.getByTestId('rd-prov-result')
    expect(screen.getByTestId('rd-prov-score')).toHaveTextContent('Skattad')
    expect(receipt).toHaveTextContent('indikativ och inte normerad av UHR')
    expect(receipt).not.toHaveTextContent('Genomgången')
    expect(screen.getByTestId('rd-prov-history')).toHaveTextContent(
      'Inga tidigare pass av samma slag än.',
    )
    fireEvent.click(within(receipt).getByRole('button', { name: /Till Framsteg/ }))
    expect(actions.go).toHaveBeenCalledWith('framsteg')
    // The frame opens Framsteg itself as well, for a host that does not navigate.
    expect(screen.getByTestId('rd-framsteg-prognosis')).toBeInTheDocument()
  })

  it('shows a trap behind several misses, its lesson one step away', () => {
    const trap = {
      frameworkId: 'KVA-TRAP-010',
      section: 'KVA' as const,
      count: 3,
      headline: 'Samma okända tecken i båda kvantiteterna',
    }
    const { actions } = spied(10, { data: withProv({ result: { trap } }) })
    expect(screen.getByText(trap.headline)).toBeInTheDocument()
    expect(screen.getByText('KVA · 3 missar av samma slag')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Läs om mönstret/ }))
    expect(actions.openLesson).toHaveBeenCalledWith('KVA-TRAP-010')
  })
})

// ── 11 · Framsteg ───────────────────────────────────────────────────

describe('Ljuskägla Framsteg', () => {
  it('gives the estimate with its caveat, and lights the section that needs practice most', () => {
    const { actions } = spied(11)
    const overview = screen.getByTestId('rd-framsteg-prognosis')
    const p = F.prognosis
    expect(overview).toHaveTextContent(fmtScore(p.total ?? 0))
    expect(overview).toHaveTextContent(
      `Verbal ${fmtScore(p.verbal ?? 0)} · Kvantitativ ${fmtScore(p.quant ?? 0)}`,
    )
    expect(overview).toHaveTextContent(D.copy.estimateCaveat)
    const top = F.sections.find((s) => s.section === F.focus[0])
    if (!top?.score) throw new Error('the fixture day has a focus section with a score')
    const lamp = screen.getByRole('region', { name: 'Nästa steg' })
    expect(lamp).toHaveTextContent(top.name)
    expect(lamp).toHaveTextContent(`uppskattat ${fmtScore(top.score)} av 2,0`)
    fireEvent.click(within(lamp).getByRole('button', { name: `Öva ${top.section}` }))
    expect(actions.startDrill).toHaveBeenCalledWith({ kind: 'section', section: top.section })
  })

  it('without a basis offers Välj övning, and without a total says when the estimate comes', () => {
    const prognosis = { ...F.prognosis, total: null, verbal: null, quant: null, delta: null }
    const { actions } = spied(11, {
      data: { ...D, framsteg: { ...F, focus: [], prognosis: { ...prognosis, target: undefined } } },
    })
    const overview = screen.getByTestId('rd-framsteg-prognosis')
    expect(overview).toHaveTextContent(
      'Prognosen visas när du har svarat på frågor i båda provhalvorna.',
    )
    expect(overview).not.toHaveTextContent(/\d,\d/)
    fireEvent.click(screen.getByRole('button', { name: 'Välj övning' }))
    expect(actions.go).toHaveBeenCalledWith('ova')
  })

  it('lists the eight sections in order with their evidence, an unpractised one without a score', () => {
    const sections = F.sections.map((s) =>
      s.section === 'MEK'
        ? {
            ...s,
            score: null,
            band: null,
            trend: null,
            daysSince: null,
            attempts90d: 0,
            confidence: 'low' as const,
          }
        : s,
    )
    spied(11, { data: { ...D, framsteg: { ...F, sections } } })
    expect(screen.getAllByTestId(/^rd-framsteg-section-/).map((r) => r.dataset.testid)).toEqual(
      ['ord', 'las', 'mek', 'elf', 'xyz', 'kva', 'nog', 'dtk'].map(
        (s) => `rd-framsteg-section-${s}`,
      ),
    )
    const mek = screen.getByTestId('rd-framsteg-section-mek')
    expect(mek).toHaveTextContent('Inte övat än')
    expect(mek).not.toHaveTextContent(/\d/)
    expect(screen.getByTestId('rd-framsteg-section-ord')).toHaveTextContent(
      `${F.sections[0].attempts90d} svar`,
    )
  })

  it('draws the weekly curve with its gaps and says the same in words and a table', () => {
    spied(11)
    const trend = screen.getByRole('figure', { name: 'Vecka för vecka' })
    const known = F.weekly.filter((w) => w.score != null)
    const gaps = F.weekly.length - known.length
    expect(trend).toHaveTextContent(
      `Från ${fmtScore(known[0].score ?? 0)} till ${fmtScore(known[known.length - 1].score ?? 0)} över ${known.length} veckor med svar.`,
    )
    expect(trend).toHaveTextContent(`${gaps} veckor utan svar syns som ett glapp.`)
    expect(trend.querySelectorAll('polyline')).toHaveLength(1)
    fireEvent.click(within(trend).getByText('Visa värden'))
    expect(within(within(trend).getByRole('table')).getAllByRole('row')).toHaveLength(
      F.weekly.length + 1,
    )
    expect(within(trend).getAllByText('inga svar')).toHaveLength(gaps)
  })

  it('keeps the week’s rhythm with nothing to lose, and the days in words as well as light', () => {
    spied(11)
    const week = screen.getByTestId('rd-framsteg-week')
    expect(week).toHaveTextContent(`${F.week.streakDays} dagar i följd just nu`)
    expect(week).toHaveTextContent(`${F.week.attemptsThisWeek} svar den här veckan`)
    expect(week).toHaveTextContent('70 % rätt de senaste sju dagarna')
    expect(week).toHaveTextContent('En dag utan övning tar inte bort något du har byggt upp.')
    const days = screen.getByRole('region', { name: 'Dagarna' })
    const practised = F.days.filter((d) => d.n > 0).length
    expect(days).toHaveTextContent(`${practised} av ${F.days.length} dagar med övning`)
    fireEvent.click(within(days).getByText('Visa dagar'))
    expect(
      within(within(days).getByRole('table')).getAllByRole('row').length,
    ).toBeGreaterThanOrEqual(13)
  })

  it('lists Historik by day, newest first, and Provpass results through their own door', () => {
    const { actions } = spied(11)
    const history = screen.getByTestId('rd-framsteg-history')
    const items = within(history).getAllByTestId(/^rd-framsteg-history-item-/)
    expect(items.map((el) => el.dataset.testid)).toEqual(
      F.history.map((_, i) => `rd-framsteg-history-item-${i + 1}`),
    )
    F.history.forEach((row, i) => {
      expect(items[i]).toHaveTextContent(`${row.correct} av ${row.total} rätt`)
    })
    expect(
      within(history)
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent),
    ).toEqual([...new Set(F.history.map((r) => r.when)), 'Provpassresultat'])
    const first = HUB.results[0]
    fireEvent.click(
      within(history).getByRole('button', {
        name: new RegExp(`^${first.correct} av ${first.presented} rätt`),
      }),
    )
    expect(actions.openProvResult).toHaveBeenCalledWith(first.id)
  })

  it('on a desktop jumps to Historik and back within the page', () => {
    spied(11)
    fireEvent.click(screen.getByRole('button', { name: 'Historik' }))
    expect(screen.getByRole('heading', { name: 'Historik' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Översikt' }))
    expect(screen.getByRole('heading', { name: 'Uppskattat HP-resultat' })).toHaveFocus()
  })

  it.each<WidthKey>([
    'desktop',
    'phone',
  ])('on %s, goes from Framsteg to the suggested drill and back in the bake-off', (width) => {
    stage(11, width)
    fireEvent.click(screen.getByRole('button', { name: `Öva ${F.focus[0]}` }))
    expect(screen.getAllByTestId('rd-exit').length).toBeGreaterThan(0)
    fireEvent.click(screen.getAllByTestId('rd-exit')[0])
    expect(screen.getByTestId('rd-framsteg-prognosis')).toBeInTheDocument()
  })
})

// ── 9–11 without what the real app cannot fill ──────────────────────

describe('Ljuskägla Provpass and Framsteg with optional fields absent', () => {
  it('Provpass leaves the rhythm out without a placeholder', () => {
    spied(9, { data: withProv({ hub: { prescription: null } }) })
    const root = screen.getByTestId('rd-ljuskagla')
    expect(root).not.toHaveTextContent(/undefined|null|NaN/)
    expect(root).not.toHaveTextContent(/Nästa: |Förra passet/)
    expect(screen.getByTestId('rd-prov-start')).toBeInTheDocument()
  })

  it('Framsteg leaves out the goal, the record, the range, the target and the change', () => {
    spied(11, {
      data: {
        ...D,
        framsteg: {
          ...F,
          prognosis: {
            ...F.prognosis,
            target: undefined,
            low: undefined,
            high: undefined,
            delta: null,
          },
          week: { ...F.week, goal: undefined, record: undefined, daysPractised: undefined },
        },
      },
    })
    const root = screen.getByTestId('rd-ljuskagla')
    expect(root).not.toHaveTextContent(/undefined|null|NaN/)
    expect(root).not.toHaveTextContent(
      /mål \d|planerade dagar|som längst|sedan förra veckan|troligen \d/,
    )
    expect(screen.getByTestId('rd-framsteg-week')).toHaveTextContent(
      `${F.week.streakDays} dagar i följd just nu`,
    )
  })
})

// ── Every named grid area has its cell ──────────────────────────────

describe('Ljuskägla grids', () => {
  withSheet()

  /** A plain track list's tracks, with the arguments of minmax() and the
   *  like folded away (a repeat() counts as one). */
  function tracks(list: string) {
    let flat = list
    for (let last = ''; flat !== last; ) {
      last = flat
      flat = flat.replace(/\([^()]*\)/g, '')
    }
    return flat.split(/\s+/).filter(Boolean)
  }

  /**
   * Every child that a grid places by an area name, as "grid › area", and
   * the ones it cannot place. A name the grid's template does not declare,
   * or a template row wider or narrower than the grid's columns, leaves the
   * child to implicit tracks: Repetera's section and prompt once shared a
   * single implicit cell that way (review hpf-n2ra).
   */
  function namedAreas(root: HTMLElement) {
    const placed: string[] = []
    const stray: string[] = []
    for (const child of root.querySelectorAll('*')) {
      const area = getComputedStyle(child).getPropertyValue('grid-area').trim()
      const grid = child.parentElement
      if (!grid || !/^[a-z][\w-]*$/i.test(area) || area === 'auto') continue
      const style = getComputedStyle(grid)
      if (!style.display.includes('grid')) continue
      const label = `${grid.getAttribute('class')} › ${area}`
      const rows = (style.getPropertyValue('grid-template-areas').match(/"[^"]*"/g) ?? []).map(
        (row) => row.slice(1, -1).split(/\s+/).filter(Boolean),
      )
      const columns = tracks(style.getPropertyValue('grid-template-columns')).length
      placed.push(label)
      if (!rows.some((row) => row.includes(area)) || rows.some((row) => row.length !== columns))
        stray.push(label)
    }
    return { placed, stray }
  }

  it.each(
    (meta.screens ?? []).flatMap((s) =>
      (['desktop', 'phone'] as const).map((w) => [s, w] as const),
    ),
  )('screen %i on %s gives every named grid area a declared cell', (s, width) => {
    spied(s, { width })
    expect(namedAreas(screen.getByTestId('rd-ljuskagla')).stray).toEqual([])
  })

  // Repetera's rows are the regression; Öva's, which always declared their
  // five areas, show that the check sees a row grid and lets a sound one pass.
  it.each<[WidthKey, AppScreenKey, string, string[]]>([
    ['desktop', 8, 'lj-rep-item', ['code', 'main']],
    ['phone', 8, 'lj-rep-item', ['code', 'main']],
    ['desktop', 5, 'lj-row', ['code', 'main', 'score', 'count', 'arrow']],
    ['phone', 5, 'lj-row', ['code', 'main', 'score', 'count', 'arrow']],
  ])('on %s, screen %i sets each part of a .%s in its own declared area', (width, s, grid, areas) => {
    spied(s, { width })
    const { placed, stray } = namedAreas(screen.getByTestId('rd-ljuskagla'))
    expect(stray).toEqual([])
    expect(new Set(placed)).toEqual(new Set(areas.map((area) => `${grid} › ${area}`)))
  })

  // A running pass is reached by a click, so the sweep above never sees it.
  it.each<WidthKey>([
    'desktop',
    'phone',
  ])('a running pass on %s gives every named grid area a declared cell', (width) => {
    startPass({ width })
    const { placed, stray } = namedAreas(screen.getByTestId('rd-ljuskagla'))
    expect(stray).toEqual([])
    if (width === 'phone') {
      expect(placed).toEqual(
        expect.arrayContaining(
          ['exit', 'progress', 'clock', 'submit', 'account'].map(
            (area) => `lj-drill-head lj-run-head › ${area}`,
          ),
        ),
      )
    }
  })
})

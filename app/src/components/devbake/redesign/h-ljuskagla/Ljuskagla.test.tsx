import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
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
import type {
  AppScreenKey,
  DirectionProps,
  ScreenKey,
  ThemeKey,
  WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import type {
  DirectionData,
  DrillSessionView,
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
    expect(screen.getByRole('heading', { name: 'Framsteg' })).toBeInTheDocument()
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

// ── Every named grid area has its cell ──────────────────────────────

describe('Ljuskägla grids', () => {
  // Vitest leaves CSS out (css: false): load the direction's own sheet, as
  // Samtal's tests do. jsdom lays nothing out, so this reads the cascade,
  // not the geometry; the coordinator's browser pass checks the geometry.
  const sheet = document.createElement('style')
  beforeAll(() => {
    sheet.textContent = readFileSync(
      path.resolve(process.cwd(), 'src/components/devbake/redesign/h-ljuskagla/ljuskagla.css'),
      'utf8',
    )
    document.head.appendChild(sheet)
  })
  afterAll(() => sheet.remove())

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
})

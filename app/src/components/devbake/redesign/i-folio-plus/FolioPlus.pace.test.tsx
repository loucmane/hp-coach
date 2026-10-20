// Folio+ · the pacing pack (bead hpf-qr0p.48, round 3): UHR's recommended
// times per delprov on the result, a ghost pace tick and the delprov seams
// in the running pass, a five-minute warning that names the blanks, and
// "Markerade men rätt" — with every errata row opening its facit in place.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { stubLayout } from '@/components/devbake/redesign/contract'
import { DirectionDataProvider, FIXTURE_DATA } from '@/components/devbake/redesign/directionData'
import type { DirectionProps } from '@/components/devbake/redesign/r1Kit'
import type { DirectionActions, DirectionData } from '@/components/devbake/redesign/viewModel'
import { FolioPlus as Folio } from './FolioPlus'
import { UHR_TIME } from './FolioProvpass'

type Mount = {
  data?: DirectionData
  actions?: Partial<DirectionActions>
  width?: DirectionProps['width']
}

function mount(s: DirectionProps['screen'], opts: Mount = {}) {
  const data = opts.data ?? structuredClone(FIXTURE_DATA)
  let shown = s
  const tree = () => (
    <DirectionDataProvider data={data} actions={opts.actions}>
      <Folio
        screen={shown}
        width={opts.width ?? 'desktop'}
        theme="light"
        live
        onScreen={vi.fn()}
        onTheme={vi.fn()}
      />
    </DirectionDataProvider>
  )
  const utils = render(tree())
  return {
    ...utils,
    goTo: (next: DirectionProps['screen']) => {
      shown = next
      utils.rerender(tree())
    },
  }
}

beforeAll(stubLayout)
afterEach(() => vi.useRealTimers())

const RUN = FIXTURE_DATA.provpass.running
const RESULT = FIXTURE_DATA.provpass.result
const cell = (n: number) => screen.getByTestId(`rd-prov-cell-${n}`)
const statuses = () =>
  Array.from(document.querySelectorAll('[role="status"]')).map((el) => el.textContent)
const paceCss = readFileSync(join(__dirname, 'fpPace.css'), 'utf8')

function startPass() {
  fireEvent.click(screen.getByTestId('rd-prov-start'))
  fireEvent.click(screen.getByTestId('rd-confirm'))
}

/** A pass opened fresh: the first question, nothing answered, the whole
 *  55 minutes left. */
function freshPass(): DirectionData {
  const data = structuredClone(FIXTURE_DATA)
  const run = data.provpass.running
  run.current = 0
  run.answers = {}
  run.flags = []
  run.remainingSeconds = run.durationSeconds
  return data
}

// ── 1. UHR's times on the result ─────────────────────────────────────

describe('Folio+ pace · the result reads UHR’s recommended times', () => {
  it('keeps the booklets’ times per delprov, with their question counts', () => {
    expect(Object.fromEntries(Object.entries(UHR_TIME).map(([s, t]) => [s, t.minutes]))).toEqual({
      ORD: 3,
      LÄS: 22,
      MEK: 8,
      ELF: 22,
      XYZ: 12,
      KVA: 10,
      NOG: 10,
      DTK: 23,
    })
    expect(UHR_TIME.NOG.questions).toBe(6)
    expect(UHR_TIME.DTK.questions).toBe(12)
  })

  it('sets UHR:s tid beside each delprov’s time, said neutrally, never “över budget”', () => {
    mount(10)
    const table = screen.getByRole('table', {
      name: 'Per delprov: rätt, tid och UHR:s rekommenderade tid',
    })
    expect(within(table).getByRole('columnheader', { name: 'UHR:s tid' })).toBeInTheDocument()
    expect(within(table).queryByRole('columnheader', { name: 'Budget' })).toBeNull()
    // The sample: XYZ 17:30 on 12, KVA 12:00 on 10, NOG 9:30 on 10, DTK
    // 14:30 on 23 — XYZ and KVA took time from DTK, which got less.
    const xyz = screen.getByTestId('rd-prov-section-xyz')
    expect(xyz).toHaveTextContent('17:30')
    expect(xyz).toHaveTextContent('12:00')
    expect(xyz).toHaveTextContent('tog 5½ min från DTK')
    expect(screen.getByTestId('rd-prov-section-kva')).toHaveTextContent('tog 2 min från DTK')
    expect(screen.getByTestId('rd-prov-section-nog')).toHaveTextContent('i takt')
    const dtk = screen.getByTestId('rd-prov-section-dtk')
    expect(dtk).toHaveTextContent('23:00')
    expect(dtk).toHaveTextContent('fick 8½ min mindre')
    expect(table).not.toHaveTextContent(/över|budget|efter/i)
    // Nothing is scaled in a full pass: no footnote for it.
    expect(screen.queryByText(/skalad/)).toBeNull()
  })

  it('says “min kvar till” the last delprov when a delprov finished early', () => {
    const data = structuredClone(FIXTURE_DATA)
    const kva = data.provpass.result.sections.find((s) => s.section === 'KVA')
    if (!kva) throw new Error('no KVA row')
    kva.timeSeconds = 8 * 60
    mount(10, { data })
    expect(screen.getByTestId('rd-prov-section-kva')).toHaveTextContent('2 min kvar till DTK')
  })

  it('scales a short delprov’s time to its questions and says so in a footnote', () => {
    const data = structuredClone(FIXTURE_DATA)
    const dtk = data.provpass.result.sections.find((s) => s.section === 'DTK')
    if (!dtk) throw new Error('no DTK row')
    dtk.presented = 10
    dtk.correct = 7
    mount(10, { data })
    const row = screen.getByTestId('rd-prov-section-dtk')
    // 23 min × 10/12 = 19:10.
    expect(row).toHaveTextContent('19:10†')
    expect(screen.getByTestId('rd-prov-section-xyz')).not.toHaveTextContent('†')
    const note = screen.getByText(/skalad efter antalet frågor/)
    expect(note.closest('.fp-footnote')).toHaveTextContent('DTK: 23 min × 10/12')
  })

  it('tells the pattern’s time against UHR’s, not a budget', () => {
    mount(10)
    const pattern = screen.getByRole('region', { name: 'Ett mönster att öva på' })
    expect(pattern).toHaveTextContent('XYZ')
    expect(pattern).toHaveTextContent('mer än UHR:s tid')
    expect(pattern).not.toHaveTextContent(/budget/)
  })
})

// ── 2. The pace tick and the seams ───────────────────────────────────

describe('Folio+ pace · the running pass shows where UHR’s times put you', () => {
  it.each([
    'desktop',
    'phone',
  ] as const)('sets a ghost tick in the index, with a legend for screen readers, on %s', (w) => {
    // The fixture: 31:12 left of 55 min, so 23:48 gone — past XYZ (12) and
    // KVA (10), 1:48 into NOG's 10 minutes: by UHR's times, question 24.
    mount(9, { width: w })
    startPass()
    const index = screen.getByTestId('rd-prov-grid')
    const tick = within(index).getByTestId('fp-pace-tick')
    expect(tick).toHaveAttribute('aria-hidden', 'true')
    // In NOG's run (questions 23–28), 18 % in.
    expect(tick.parentElement).toContainElement(cell(23))
    expect(tick.style.left).toBe('18%')
    const legend = document.getElementById(index.getAttribute('aria-describedby') ?? '')
    expect(legend).toHaveTextContent(
      'Det tunna strecket i frågeraden visar var UHR:s rekommenderade tider sätter dig nu: vid fråga 24, NOG.',
    )
    // The index stays an index: the tick adds no text of its own.
    expect(index.textContent?.replace(/Fråga \d+ · (obe|be)svarad/g, '').trim()).toBe('')
    // It folds away with the clock, legend and all.
    fireEvent.click(screen.getByRole('button', { name: 'Dölj klockan' }))
    expect(within(index).queryByTestId('fp-pace-tick')).toBeNull()
    expect(index).not.toHaveAttribute('aria-describedby')
    fireEvent.click(screen.getByRole('button', { name: 'Visa klockan' }))
    expect(within(index).getByTestId('fp-pace-tick')).toBeInTheDocument()
  })

  it('is never red and never animated', () => {
    const tick = paceCss.slice(paceCss.indexOf('.fp-pace-tick {'))
    expect(tick.slice(0, tick.indexOf('}'))).toMatch(/background: var\(--fp-ink-3\)/)
    expect(paceCss).not.toMatch(/animation|transition|--fp-bad|--fp-err|red\b/)
  })

  it('says one quiet line at a delprov seam: how long it took, and UHR’s time', () => {
    vi.useFakeTimers()
    mount(9, { data: freshPass() })
    startPass()
    expect(screen.queryByTestId('fp-pace-seam')).toBeNull()
    act(() => vi.advanceTimersByTime(14 * 60 * 1000))
    fireEvent.click(cell(12))
    expect(screen.queryByTestId('fp-pace-seam')).toBeNull()
    fireEvent.click(cell(13))
    expect(screen.getByTestId('fp-pace-seam')).toHaveTextContent(
      'XYZ klart på 14 min · UHR:s tid 12',
    )
    expect(statuses()).toContain('XYZ klart på 14 minuter, UHR:s tid 12 minuter.')
    // It stays while the reader is in KVA, and goes when they leave it.
    fireEvent.click(cell(14))
    expect(screen.getByTestId('fp-pace-seam')).toBeInTheDocument()
    fireEvent.click(cell(2))
    expect(screen.queryByTestId('fp-pace-seam')).toBeNull()
    // Said once: coming back into KVA says nothing more.
    fireEvent.click(cell(13))
    expect(screen.queryByTestId('fp-pace-seam')).toBeNull()
  })

  it('folds the seam line with the clock', () => {
    vi.useFakeTimers()
    mount(9, { data: freshPass() })
    startPass()
    fireEvent.click(screen.getByRole('button', { name: 'Dölj klockan' }))
    act(() => vi.advanceTimersByTime(14 * 60 * 1000))
    fireEvent.click(cell(13))
    expect(screen.queryByTestId('fp-pace-seam')).toBeNull()
  })

  it('claims no seam for a delprov the pass opened in the middle of', () => {
    mount(9)
    startPass()
    // The fixture opens on question 17, in KVA, 23:48 in: when KVA began is
    // not known, so leaving it says nothing.
    fireEvent.click(cell(23))
    expect(screen.queryByTestId('fp-pace-seam')).toBeNull()
  })
})

// ── 3. The five-minute warning names the blanks ──────────────────────

describe('Folio+ pace · five minutes left, the blanks named', () => {
  it('says how many are blank and to guess now, once', () => {
    vi.useFakeTimers()
    const data = structuredClone(FIXTURE_DATA)
    data.provpass.running.remainingSeconds = 302
    mount(9, { data })
    startPass()
    expect(screen.queryByTestId('fp-pace-warn')).toBeNull()
    act(() => vi.advanceTimersByTime(3000))
    // The fixture has 16 of 40 answered.
    const warn = screen.getByTestId('fp-pace-warn')
    expect(warn).toHaveTextContent(
      'Fem minuter kvar · 24 obesvarade – gissa på dem nu, fel svar kostar inget.',
    )
    expect(statuses()).toContain('Fem minuter kvar')
    expect(statuses()).toContain('24 obesvarade – gissa på dem nu, fel svar kostar inget.')
    // A guess brings the count down where it is seen; nothing is said again.
    fireEvent.click(screen.getByTestId('rd-prov-option-B'))
    expect(screen.getByTestId('fp-pace-warn')).toHaveTextContent('23 obesvarade')
    expect(statuses()).toContain('24 obesvarade – gissa på dem nu, fel svar kostar inget.')
    act(() => vi.advanceTimersByTime(4 * 60 * 1000))
    expect(
      statuses().filter((s) => s?.includes('obesvarade') || s?.includes('minut kvar')),
    ).toHaveLength(1)
    expect(warn).not.toHaveTextContent(/över|bakom|efter/)
  })

  it('says all are answered when none is blank', () => {
    vi.useFakeTimers()
    const data = structuredClone(FIXTURE_DATA)
    const run = data.provpass.running
    run.answers = Object.fromEntries(run.questions.map((q) => [q.qid, q.answer]))
    run.remainingSeconds = 302
    mount(9, { data })
    startPass()
    act(() => vi.advanceTimersByTime(3000))
    expect(screen.getByTestId('fp-pace-warn')).toHaveTextContent(
      'Fem minuter kvar · alla frågor besvarade.',
    )
  })
})

// ── 4. The errata open in place; Markerade men rätt ──────────────────

describe('Folio+ pace · the misses open their facit in place', () => {
  it('opens a miss’s question and the right answer under its row, and closes it', () => {
    mount(10)
    expect(screen.queryByRole('region', { name: 'Markerade men rätt' })).toBeNull()
    const errata = screen.getByRole('list', { name: 'Missarna' })
    const rows = within(errata).getAllByRole('listitem')
    expect(rows).toHaveLength(RESULT.missed.length)
    const first = RUN.questions.find((q) => q.qid === RESULT.missed[0])
    if (!first) throw new Error('the first miss is not in the pass')
    const toggle = within(rows[0]).getByRole('button', { name: /^Fråga 2, XYZ/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(rows[0]).toHaveTextContent(`rätt ${first.answer}`)
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const facit = document.getElementById(toggle.getAttribute('aria-controls') ?? '')
    expect(facit).not.toBeNull()
    const right = within(facit as HTMLElement)
      .getAllByRole('listitem')
      .find((li) => li.dataset.right === 'true')
    expect(right).toHaveTextContent(`${first.answer}`)
    expect(right).toHaveTextContent('rätt svar')
    // No answers of the reader's at hand here: none is claimed.
    expect(facit).not.toHaveTextContent('ditt svar')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('lists the marked questions answered right after a pass run here, each with its facit', () => {
    const { goTo } = mount(9)
    startPass()
    // Question 3 (XYZ) is answered right in the fixture; mark it.
    const third = RUN.questions[2]
    expect(RUN.answers[third.qid]).toBe(third.answer)
    fireEvent.click(cell(3))
    fireEvent.click(screen.getByTestId('rd-prov-flag'))
    // And answer question 2 wrong, as the fixture's reader does.
    fireEvent.click(cell(2))
    const wrong = RUN.questions[1].options?.find((o) => o.letter !== RUN.questions[1].answer)
    if (!wrong) throw new Error('question 2 has no wrong option')
    fireEvent.click(screen.getByTestId(`rd-prov-option-${wrong.letter}`))
    fireEvent.click(screen.getByTestId('rd-prov-submit'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    goTo(10)
    const flagged = screen.getByRole('region', { name: 'Markerade men rätt' })
    expect(flagged).toHaveTextContent('Du var osäker – värda en repris.')
    // The fixture's two marks are both misses: only question 3 is listed.
    const items = within(flagged).getAllByRole('listitem')
    expect(items).toHaveLength(1)
    expect(items[0]).toHaveTextContent(`rätt ${third.answer}`)
    const toggle = within(items[0]).getByRole('button', { name: /^Fråga 3, XYZ/ })
    fireEvent.click(toggle)
    const facit = document.getElementById(toggle.getAttribute('aria-controls') ?? '')
    expect(facit).toHaveTextContent(`Ditt svar: ${third.answer} – rätt.`)
    // The misses list after it, and a miss's facit now says the reader's answer.
    const miss = within(screen.getByRole('list', { name: 'Missarna' })).getByRole('button', {
      name: /^Fråga 2, XYZ/,
    })
    fireEvent.click(miss)
    expect(document.getElementById(miss.getAttribute('aria-controls') ?? '')).toHaveTextContent(
      `Ditt svar: ${wrong.letter} · rätt svar: ${RUN.questions[1].answer}.`,
    )
    const misses = screen.getByRole('heading', { name: 'Missarna' })
    expect(misses.compareDocumentPosition(flagged) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('claims no marks for another result of the same pass', () => {
    // The pass run in the last test bound its marks to result 319 only.
    const data = structuredClone(FIXTURE_DATA)
    data.provpass.result.id = '999'
    mount(10, { data })
    expect(screen.queryByRole('region', { name: 'Markerade men rätt' })).toBeNull()
  })
})

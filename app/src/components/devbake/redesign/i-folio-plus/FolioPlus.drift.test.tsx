// Folio+ · round 3, drift recovery (bead hpf-qr0p.48, ADHD lens R2–R4):
// the drill clock counts active time only and stands still while the tab is
// hidden (never the Provpass clock); a return after a while away names the
// place, never the time away, and relights the paragraph for the visit;
// Styckeljus is kept across days and bookmarks the last lit paragraph of a
// text; and the drill shows Idag's own "ca N min kvar" with a visible time
// line scaled to the sitting's estimate, the digits one click away.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { stubLayout } from '@/components/devbake/redesign/contract'
import { DirectionDataProvider, FIXTURE_DATA } from '@/components/devbake/redesign/directionData'
import type { DirectionProps } from '@/components/devbake/redesign/r1Kit'
import type { DirectionActions, DirectionData } from '@/components/devbake/redesign/viewModel'
import { FolioPlus as Folio } from './FolioPlus'

type Mount = {
  data?: DirectionData
  actions?: Partial<DirectionActions>
  width?: DirectionProps['width']
}

function mount(s: DirectionProps['screen'], opts: Mount = {}) {
  const data = opts.data ?? structuredClone(FIXTURE_DATA)
  return render(
    <DirectionDataProvider data={data} actions={opts.actions}>
      <Folio
        screen={s}
        width={opts.width ?? 'desktop'}
        theme="light"
        live
        onScreen={vi.fn()}
        onTheme={vi.fn()}
      />
    </DirectionDataProvider>,
  )
}

const driftCss = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'fpDrift.css'),
  'utf8',
)

const press = (key: string) => fireEvent.keyDown(window, { key })
const lightBtn = () => screen.getByRole('button', { name: 'Styckeljus' })
const litParas = () =>
  Array.from(document.querySelectorAll<HTMLElement>('.fp-para[data-focused="true"]')).map((p) =>
    Number(p.dataset.n),
  )
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms))
/** The drill clock's digits, shown with one click. */
const showDigits = () => fireEvent.click(screen.getByRole('button', { name: 'Visa aktiv tid' }))
const digits = () => screen.getByRole('button', { name: /^Aktiv tid / })
const cue = () => document.querySelector<HTMLElement>('.fp-drift-said')

// The tab's visibility, as the browser reports it.
let hidden = false
function setHidden(next: boolean) {
  hidden = next
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}
/** Away from the tab for `ms`, then back. */
function away(ms: number) {
  setHidden(true)
  tick(ms)
  setHidden(false)
}

beforeAll(() => {
  stubLayout()
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => (hidden ? 'hidden' : 'visible'),
  })
})
beforeEach(() => {
  hidden = false
  window.sessionStorage.clear()
  window.localStorage.clear()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// ── 1. The drill clock pauses while the tab is hidden ────────────────

describe('Folio+ · the drill clock counts active time only', () => {
  it.each(['desktop', 'phone'] as const)('stands still while the tab is hidden on %s', (w) => {
    vi.useFakeTimers()
    mount(2, { width: w })
    showDigits()
    expect(digits()).toHaveTextContent('09:24')
    tick(5000)
    expect(digits()).toHaveTextContent('09:29')
    setHidden(true)
    tick(90_000)
    // Hidden: the figure holds.
    expect(digits()).toHaveTextContent('09:29')
    setHidden(false)
    expect(digits()).toHaveTextContent('09:29')
    tick(1000)
    expect(digits()).toHaveTextContent('09:30')
    expect(digits()).toHaveAccessibleName('Aktiv tid 09:30')
  })

  it('pauses the quant drill too', () => {
    vi.useFakeTimers()
    mount(6)
    showDigits()
    tick(3000)
    expect(digits()).toHaveTextContent('00:03')
    away(60_000)
    tick(1000)
    expect(digits()).toHaveTextContent('00:04')
  })

  it('says the minutes in the colophon are active ones', () => {
    vi.useFakeTimers()
    mount(2)
    away(10 * 60_000)
    // Two questions left: answer and go on.
    for (let i = 0; i < 2; i++) {
      press('a')
      press('Enter')
      press('Enter')
    }
    // 9:24 on the clock, not 19:24: the time away is not counted.
    expect(document.querySelector('.fp-colophon-facts')).toHaveTextContent(/· 9 min$/)
  })

  it('never pauses the Provpass clock', () => {
    vi.useFakeTimers()
    mount(9)
    fireEvent.click(screen.getByTestId('rd-prov-start'))
    fireEvent.click(screen.getByTestId('rd-confirm'))
    expect(screen.getByTestId('rd-prov-timer')).toHaveTextContent('31:12 kvar')
    away(60_000)
    expect(screen.getByTestId('rd-prov-timer')).toHaveTextContent('30:12 kvar')
    expect(cue()?.textContent ?? '').toBe('')
  })
})

// ── 2. The return cue ────────────────────────────────────────────────

describe('Folio+ · back after a while away: one quiet line naming the place', () => {
  it.each(['desktop', 'phone'] as const)('names the paragraph and relights it on %s', (w) => {
    vi.useFakeTimers()
    mount(2, { width: w })
    fireEvent.click(lightBtn())
    press('j')
    press('j')
    const n = litParas()[0]
    expect(n).toBeGreaterThan(1)
    away(25_000)
    expect(screen.getByText(`Du läste stycke ${n}`)).toBeInTheDocument()
    expect(litParas()).toEqual([n])
    // Once to screen readers: a polite status, said once.
    expect(cue()).toHaveAttribute('role', 'status')
    expect(cue()).toHaveTextContent(`Du läste stycke ${n}`)
    expect(document.querySelectorAll('.fp-drift-said')).toHaveLength(1)
    // The place, never the time away.
    expect(cue()).not.toHaveTextContent(/min|sek|borta|tid/i)
  })

  it('relights the paragraph for the visit only: the Styckeljus setting stays off', () => {
    vi.useFakeTimers()
    mount(2)
    expect(lightBtn()).toHaveAttribute('aria-pressed', 'false')
    away(25_000)
    expect(screen.getByText('Du läste stycke 1')).toBeInTheDocument()
    expect(litParas()).toEqual([1])
    expect(window.localStorage.getItem('fp-styckeljus')).not.toBe('on')
    // The next question leaves the visit's light behind.
    press('a')
    press('Enter')
    press('Enter')
    expect(litParas()).toEqual([])
  })

  it('says nothing after a short look away', () => {
    vi.useFakeTimers()
    mount(2)
    away(10_000)
    expect(cue()?.textContent ?? '').toBe('')
    expect(screen.queryByText(/Du läste/)).toBeNull()
    expect(litParas()).toEqual([])
  })

  it('goes on the next action, keeping that action', () => {
    vi.useFakeTimers()
    mount(2)
    away(25_000)
    expect(screen.getByText('Du läste stycke 1')).toBeInTheDocument()
    // Tab only moves the focus: the line stays, so its close is reachable.
    press('Tab')
    expect(screen.getByText('Du läste stycke 1')).toBeInTheDocument()
    press('b')
    expect(screen.queryByText('Du läste stycke 1')).toBeNull()
    expect(cue()?.textContent).toBe('')
    expect(screen.getByTestId('rd-option-B')).toHaveAttribute('aria-pressed', 'true')
  })

  it('offers a close', () => {
    vi.useFakeTimers()
    mount(2)
    away(25_000)
    fireEvent.click(screen.getByRole('button', { name: 'Stäng' }))
    expect(screen.queryByText('Du läste stycke 1')).toBeNull()
  })

  it.each(['desktop', 'phone'] as const)('names the question in quant on %s', (w) => {
    vi.useFakeTimers()
    mount(6, { width: w })
    away(25_000)
    expect(screen.getByText('Du var på fråga 1')).toBeInTheDocument()
  })

  it('names the facit when the reader was in it', () => {
    vi.useFakeTimers()
    mount(3)
    away(25_000)
    expect(screen.getByText('Du läste facit till fråga 3')).toBeInTheDocument()
  })
})

// ── 3. Styckeljus is kept across days ────────────────────────────────

describe('Folio+ · Styckeljus is kept on this device', () => {
  it('is stored in localStorage, shared by the drill’s F and Konto’s switch', () => {
    const first = mount(2)
    press('f')
    expect(window.localStorage.getItem('fp-styckeljus')).toBe('on')
    first.unmount()
    // A new day: the session is gone, the setting is not.
    window.sessionStorage.clear()
    const konto = mount(13)
    const group = screen.getByRole('group', { name: 'Styckeljus' })
    expect(within(group).getByRole('button', { name: 'På' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(within(group).getByRole('button', { name: 'Av' }))
    expect(window.localStorage.getItem('fp-styckeljus')).toBe('off')
    konto.unmount()
    mount(2)
    expect(lightBtn()).toHaveAttribute('aria-pressed', 'false')
  })

  it('still works, for the page, when the browser keeps no storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const first = mount(2)
    fireEvent.click(lightBtn())
    expect(lightBtn()).toHaveAttribute('aria-pressed', 'true')
    first.unmount()
    mount(14)
    expect(lightBtn()).toHaveAttribute('aria-pressed', 'true')
    press('f')
  })
})

// ── 4. Styckeljus as a bookmark ──────────────────────────────────────

describe('Folio+ · Styckeljus bookmarks the last lit paragraph of a text', () => {
  it('reopens a resumed text at the paragraph last lit in it', () => {
    const first = mount(2)
    fireEvent.click(lightBtn())
    press('j')
    press('j')
    const n = litParas()[0]
    expect(n).toBeGreaterThan(1)
    first.unmount()
    mount(2)
    expect(litParas()).toEqual([n])
  })

  it('keeps a mark per text: another text starts at its own first paragraph', () => {
    const first = mount(2)
    fireEvent.click(lightBtn())
    press('j')
    press('j')
    first.unmount()
    mount(14)
    expect(litParas()).toEqual([1])
  })

  it('starts a fresh sitting of the text at its top, and leaves the light off when it is off', () => {
    const first = mount(2)
    fireEvent.click(lightBtn())
    press('j')
    press('j')
    press('f')
    first.unmount()
    // The light is off: the mark lights nothing by itself.
    const second = mount(2)
    expect(litParas()).toEqual([])
    second.unmount()
    // A fresh sitting of the same text reads from the top.
    window.localStorage.setItem('fp-styckeljus', 'on')
    const data = structuredClone(FIXTURE_DATA)
    data.drills.reading.start = { index: 0, results: [] }
    mount(2, { data })
    expect(litParas()).toEqual([1])
  })
})

// ── 5. Drill time against Idag's estimate ────────────────────────────

describe('Folio+ · the drill shows Idag’s estimate, and the time as a line', () => {
  it.each(['desktop', 'phone'] as const)('says Idag’s "ca 6 min kvar" in the head on %s', (w) => {
    vi.useFakeTimers()
    mount(2, { width: w })
    const left = document.querySelector('.fp-left')
    expect(left).toHaveTextContent('ca 6 min kvar')
    tick(61_000)
    expect(document.querySelector('.fp-left')).toHaveTextContent('ca 5 min kvar')
    // Past the estimate it simply goes: no "över", no "behind".
    tick(6 * 60_000)
    expect(document.querySelector('.fp-left')).toBeNull()
    const head = document.querySelector('.fp-runhead--recto, .fp-pdrill-head')
    expect(head).not.toHaveTextContent(/över|efter|bakom|sen\b/)
  })

  it('shows the line by default, scaled to the sitting’s estimate, the digits one click away', () => {
    mount(2)
    const line = document.querySelector<HTMLElement>('.fp-dline i')
    expect(line).not.toBeNull()
    // 9:24 of an estimated 9:24 + 6:00.
    expect(line?.style.width).toBe(`${(564 / 924) * 100}%`)
    expect(screen.queryByText('09:24')).toBeNull()
    showDigits()
    expect(digits()).toHaveTextContent('09:24')
    // The line stays with the digits.
    expect(document.querySelector('.fp-dline')).not.toBeNull()
    fireEvent.click(digits())
    expect(screen.queryByText('09:24')).toBeNull()
  })

  it('keeps the digits as the reader set them from one question to the next', () => {
    mount(2)
    showDigits()
    press('a')
    press('Enter')
    expect(digits()).toBeInTheDocument()
    press('Enter')
    expect(digits()).toBeInTheDocument()
  })

  it('says no estimate where Idag has none, and still draws the line', () => {
    mount(6)
    expect(document.querySelector('.fp-left')).toBeNull()
    expect(screen.queryByText(/min kvar/)).toBeNull()
    expect(document.querySelector('.fp-dline i')).not.toBeNull()
  })

  it('takes a plan item’s minutes for a fresh sitting of its kind', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.drills.quant.request = { kind: 'section', section: 'ORD' }
    data.home.plan.items = [
      { ...data.home.plan.items[0], id: 'q', kind: 'drill', section: 'ORD', minutes: 4 },
    ]
    mount(6, { data })
    expect(document.querySelector('.fp-left')).toHaveTextContent('ca 4 min kvar')
  })

  it('draws the line at least 3 px, in a neutral ink, never red', () => {
    const rule = driftCss.slice(driftCss.indexOf('.fp-dline {'))
    const height = Number(/height:\s*(\d+)px/.exec(rule)?.[1])
    expect(height).toBeGreaterThanOrEqual(3)
    expect(driftCss).not.toMatch(/--fp-(bad|ok)|wrong|danger|\bred\b|urgent|warn/)
  })
})

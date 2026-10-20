// Folio+ · Ljuskägla's ADHD-PI qualities in Folio's terms (bead
// hpf-qr0p.48, round 2): the reading place a ¶ link keeps (light, focus and
// a way back to the facit), the facit's calm order, the quant problem kept
// whole and the choice kept while the figure is consulted, the running
// pass's quiet index and its one warning, the result's one lit pattern, and
// Styckeljus as a switch on Konto that the drill's F shares.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { stubLayout } from '@/components/devbake/redesign/contract'
import { DirectionDataProvider, FIXTURE_DATA } from '@/components/devbake/redesign/directionData'
import type { DirectionProps } from '@/components/devbake/redesign/r1Kit'
import type { DirectionActions, DirectionData } from '@/components/devbake/redesign/viewModel'
import { FolioDrill, ORIGIN_IDAG } from './FolioDrill'
import { FolioKonto } from './FolioKonto'
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

const press = (key: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(window, { key, ...init })

/** FolioDialog hands focus back in a microtask, after its commit. */
const settle = () => act(async () => {})

const lightBtn = () => screen.getByRole('button', { name: 'Styckeljus' })
const para = (n: number) => screen.getByTestId(`rd-para-${n}`)
const litParas = () =>
  Array.from(document.querySelectorAll<HTMLElement>('.fp-para[data-focused="true"]')).map((p) =>
    Number(p.dataset.n),
  )
const citeOf = (el: HTMLElement) => Number(el.dataset.testid?.replace('rd-cite-', ''))

/** fpFocus.css as written (the test run loads no CSS). */
const focusCss = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'fpFocus.css'),
  'utf8',
)
function rule(selector: string): string {
  const at = focusCss.indexOf(`${selector} {`)
  if (at < 0) throw new Error(`no rule for ${selector}`)
  return focusCss.slice(at, focusCss.indexOf('}', at))
}

beforeAll(stubLayout)
beforeEach(() => {
  window.sessionStorage.clear()
  window.localStorage.clear()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// ── 1. The reading place (principle 5) ───────────────────────────────

describe('Folio+ · a ¶ link keeps the reading place', () => {
  it.each([
    'desktop',
    'phone',
  ] as const)('lights the cited paragraph with Styckeljus and moves focus to it on %s', (w) => {
    mount(3, { width: w })
    expect(lightBtn()).toHaveAttribute('aria-pressed', 'false')
    const cite = screen.getAllByTestId(/^rd-cite-\d+$/)[0]
    const n = citeOf(cite)
    fireEvent.click(cite)
    expect(lightBtn()).toHaveAttribute('aria-pressed', 'true')
    expect(litParas()).toEqual([n])
    expect(para(n)).toHaveFocus()
    if (w === 'phone') expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'peek')
  })

  it('lights the evidence for the visit only: the reader’s Styckeljus setting stays off', () => {
    mount(3)
    fireEvent.click(screen.getAllByTestId(/^rd-cite-\d+$/)[0])
    expect(litParas()).toHaveLength(1)
    // Konto's switch and the next drill read the setting, not the visit.
    expect(window.localStorage.getItem('fp-styckeljus')).not.toBe('on')
    // The next question leaves the visit's light behind.
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(litParas()).toEqual([])
    expect(lightBtn()).toHaveAttribute('aria-pressed', 'false')
  })

  it('offers “Tillbaka till facit” beside the evidence; it and Esc go back to the ¶ link', () => {
    mount(3)
    const cite = screen.getAllByTestId(/^rd-cite-\d+$/)[0]
    const n = citeOf(cite)
    fireEvent.click(cite)
    const back = within(para(n)).getByRole('button', { name: /Tillbaka till facit/ })
    fireEvent.click(back)
    expect(screen.getAllByTestId(`rd-cite-${n}`)[0]).toHaveFocus()
    expect(screen.queryByRole('button', { name: /Tillbaka till facit/ })).toBeNull()
    // The light stays where the evidence was.
    expect(litParas()).toEqual([n])
    // Esc does the same, and only then turns the light off as before.
    fireEvent.click(screen.getAllByTestId(`rd-cite-${n}`)[0])
    expect(para(n)).toHaveFocus()
    press('Escape')
    expect(screen.getAllByTestId(`rd-cite-${n}`)[0]).toHaveFocus()
    expect(lightBtn()).toHaveAttribute('aria-pressed', 'true')
    press('Escape')
    expect(lightBtn()).toHaveAttribute('aria-pressed', 'false')
  })

  it('goes back to the facit on phone: the sheet opens again on the ¶ link', () => {
    mount(3, { width: 'phone' })
    const cite = screen.getAllByTestId(/^rd-cite-\d+$/)[0]
    const n = citeOf(cite)
    fireEvent.click(cite)
    expect(para(n)).toHaveFocus()
    fireEvent.click(within(para(n)).getByRole('button', { name: /Tillbaka till facit/ }))
    expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'full')
    expect(within(screen.getByTestId('rd-sheet')).getAllByTestId(`rd-cite-${n}`)[0]).toHaveFocus()
    // Esc from the evidence does the same.
    fireEvent.click(within(screen.getByTestId('rd-sheet')).getAllByTestId(`rd-cite-${n}`)[0])
    press('Escape')
    expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'full')
    expect(within(screen.getByTestId('rd-sheet')).getAllByTestId(`rd-cite-${n}`)[0]).toHaveFocus()
  })

  it('lets the scroll move the light, never the focus', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })
    mount(3)
    const cite = screen.getAllByTestId(/^rd-cite-\d+$/)[0]
    const n = citeOf(cite)
    fireEvent.click(cite)
    expect(para(n)).toHaveFocus()
    const box = screen.getByTestId('rd-passage').closest<HTMLElement>('.fp-page--verso')
    if (!box) throw new Error('no verso')
    const rect = (top: number, height: number) =>
      ({
        top,
        bottom: top + height,
        height,
        left: 0,
        right: 600,
        width: 600,
        x: 0,
        y: top,
      }) as DOMRect
    box.getBoundingClientRect = () => rect(0, 600)
    const count = document.querySelectorAll('.fp-pbody .fp-para[data-n]').length
    const target = n === 4 ? 5 : 4
    // The reading line (200) falls in ¶target.
    for (let k = 1; k <= count; k++) {
      para(k).getBoundingClientRect = () => rect(100 * (k - target) + 160, 100)
    }
    // The reader's own scroll, after the link's own has settled.
    const later = Date.now() + 5000
    vi.spyOn(Date, 'now').mockReturnValue(later)
    fireEvent.scroll(box)
    expect(litParas()).toEqual([target])
    expect(para(n)).toHaveFocus()
  })

  it('marks the lit paragraph in the margin with a quiet rule, no motion', () => {
    const mark = rule(
      "[data-rd='folio-plus'] .fp-pbody[data-focus='true'] .fp-para[data-focused='true']::after",
    )
    expect(mark).toMatch(/content: ''/)
    expect(mark).toMatch(/width: 2px/)
    expect(mark).not.toMatch(/animation/)
    mount(2)
    press('f')
    expect(litParas()).toEqual([1])
  })
})

// ── 2. The facit's calm order ────────────────────────────────────────

describe('Folio+ · the facit reads calmly, from your answer to the technique', () => {
  it('orders verdict, your option, why it tempted, the pitfall, the technique, the solution', () => {
    mount(3)
    const order = [
      screen.getByTestId('rd-verdict'),
      screen.getByText('Ditt svar').closest('.fp-opt') as HTMLElement,
      screen.getByTestId('rd-distractor-A'),
      screen.getByTestId('rd-pitfall'),
      screen.getByTestId('rd-technique'),
      screen.getByRole('heading', { name: 'Lösningen' }),
    ]
    for (let i = 1; i < order.length; i++) {
      expect(
        order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    }
  })

  it('marks the wrong answer in a ring and words, not a filled red disc', () => {
    const letter = rule("[data-rd='folio-plus'] .fp-opt[data-grade='wrong'] .fp-letter")
    expect(letter).toMatch(/background: transparent/)
    const tag = rule("[data-rd='folio-plus'] .fp-opt[data-grade='wrong'] .fp-opt-tag")
    expect(tag).toMatch(/color: var\(--fp-ink-2\)/)
  })
})

// ── 3. Quant and DTK ─────────────────────────────────────────────────

describe('Folio+ · the quant problem kept whole', () => {
  it('keeps KVA’s condition and its two quantities in one group, asked and answered', () => {
    mount(6)
    // XYZ first: answer it to reach KVA.
    fireEvent.click(screen.getByTestId('rd-quant-option-A'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    fireEvent.click(screen.getByTestId('rd-next'))
    const group = screen.getByRole('group', { name: 'Villkoret och kvantiteterna' })
    expect(within(group).getByRole('heading', { level: 2 })).toBeInTheDocument()
    expect(within(group).getByRole('columnheader', { name: 'Kvantitet I' })).toBeInTheDocument()
    expect(within(group).getByRole('columnheader', { name: 'Kvantitet II' })).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('rd-quant-option-A'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    const after = screen.getByRole('group', { name: 'Villkoret och kvantiteterna' })
    expect(within(after).getByRole('table')).toBeInTheDocument()
  })

  it('keeps NOG’s question and its two statements together', () => {
    mount(6)
    for (let i = 0; i < 2; i++) {
      fireEvent.click(screen.getByTestId('rd-quant-option-A'))
      fireEvent.click(screen.getByTestId('rd-lock'))
      fireEvent.click(screen.getByTestId('rd-next'))
    }
    const group = screen.getByRole('group', { name: 'Frågan och påståendena' })
    expect(within(group).getByRole('list', { name: 'Påståenden' })).toBeInTheDocument()
  })
})

describe('Folio+ · the choice is kept while the figure is consulted', () => {
  it('keeps a desktop choice through Förstora and back', async () => {
    mount(7)
    fireEvent.click(screen.getByTestId('rd-quant-option-C'))
    fireEvent.click(screen.getByRole('button', { name: 'Förstora' }))
    const viewer = screen.getByRole('dialog', { name: 'Förstorad figur' })
    expect(within(viewer).getByTestId('fp-viewer-option-C')).toHaveAttribute('aria-pressed', 'true')
    press('Escape')
    await settle()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByTestId('rd-quant-option-C')).toHaveAttribute('aria-pressed', 'true')
  })

  it('says the choice on the phone’s folded slip while the figure shows', () => {
    mount(7, { width: 'phone' })
    const sheet = screen.getByTestId('rd-sheet')
    fireEvent.click(within(sheet).getByRole('button', { name: /^Visa de .* alternativen/ }))
    fireEvent.click(screen.getByTestId('rd-quant-option-B'))
    const fold = within(sheet)
      .getAllByRole('button', { name: 'Visa figuren' })
      .find((b) => b.textContent?.includes('Visa figuren'))
    if (!fold) throw new Error('the slip has no Visa figuren')
    fireEvent.click(fold)
    expect(sheet).toHaveAttribute('data-state', 'peek')
    expect(within(sheet).getByText('Ditt val: B')).toBeInTheDocument()
  })
})

// ── 4. The running pass (principle 3) ────────────────────────────────

function startPass() {
  fireEvent.click(screen.getByTestId('rd-prov-start'))
  fireEvent.click(screen.getByTestId('rd-confirm'))
}

describe('Folio+ · the running pass stays steady', () => {
  it('warns once, at five minutes, and never again at one; the clock is never live', () => {
    vi.useFakeTimers()
    const data = structuredClone(FIXTURE_DATA)
    data.provpass.running.remainingSeconds = 302
    mount(9, { data })
    startPass()
    const timer = screen.getByTestId('rd-prov-timer')
    expect(timer).toHaveAttribute('role', 'timer')
    expect(timer).not.toHaveAttribute('aria-live', 'polite')
    expect(timer).not.toHaveAttribute('aria-live', 'assertive')
    act(() => vi.advanceTimersByTime(3000))
    const status = () =>
      Array.from(document.querySelectorAll('[role="status"]')).map((el) => el.textContent)
    expect(status()).toContain('Fem minuter kvar')
    act(() => vi.advanceTimersByTime(4 * 60 * 1000))
    expect(screen.getByTestId('rd-prov-timer')).toHaveTextContent('00:59 kvar')
    expect(status()).not.toContain('En minut kvar')
    expect(screen.queryByText('En minut kvar')).toBeNull()
  })

  it('sets the clock’s figures tabular, steady and still', () => {
    const clock = rule("[data-rd='folio-plus'] .fp-countdown .fp-clock")
    expect(clock).toMatch(/font-variant-numeric: tabular-nums/)
    expect(clock).not.toMatch(/animation/)
  })

  it.each([
    'desktop',
    'phone',
  ] as const)('marks one current place only, in a quiet index, on %s', (w) => {
    mount(9, { width: w })
    startPass()
    const page = screen.getByTestId('rd-prov-running')
    expect(page.querySelectorAll('[aria-current]')).toHaveLength(1)
    expect(page.querySelectorAll('[data-current="true"]')).toHaveLength(1)
    const index = screen.getByTestId('rd-prov-grid')
    // An index, not a second dashboard: no counts or scores of its own.
    expect(index.textContent?.replace(/Fråga \d+ · (obe|be)svarad/g, '').trim()).toBe('')
  })

  it.each([
    ['Översikt', 'Översikt'],
    ['Lämna in', 'Lämna in provpasset?'],
    ['Avbryt passet', 'Avbryta provpasset?'],
  ] as const)('gives focus back to %s and holds the pass’s keys while its slip is open', async (opener, title) => {
    mount(9)
    startPass()
    const before = screen.getByTestId('rd-prov-cell-17')
    expect(before).toHaveAttribute('data-current', 'true')
    const button =
      opener === 'Lämna in'
        ? screen.getByTestId('rd-prov-submit')
        : opener === 'Avbryt passet'
          ? screen.getByTestId('rd-exit')
          : screen.getByRole('button', { name: opener })
    button.focus()
    fireEvent.click(button)
    const slip = screen.getByRole('dialog', { name: title })
    expect(slip).toContainElement(document.activeElement as HTMLElement)
    for (const key of ['b', 'ArrowRight', 'ArrowLeft']) press(key)
    expect(screen.getByTestId('rd-prov-option-B')).toHaveAttribute('aria-pressed', 'false')
    expect(before).toHaveAttribute('data-current', 'true')
    press('Escape')
    await settle()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(button).toHaveFocus()
    expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
  })
})

// ── 5. The result (principle 4) ──────────────────────────────────────

const RESULT = FIXTURE_DATA.provpass.result

describe('Folio+ · the result: what happened, then one pattern', () => {
  it('lights one pattern after the result: the section with the most misses, one way to practise it', () => {
    const startDrill = vi.fn()
    mount(10, { actions: { startDrill } })
    // XYZ and DTK both miss four; XYZ's share is no lower and it ran over
    // its budget.
    const misses = (s: (typeof RESULT.sections)[number]) => s.presented - s.correct
    const most = Math.max(...RESULT.sections.map(misses))
    expect(RESULT.sections.filter((s) => misses(s) === most).map((s) => s.section)).toContain('XYZ')
    const pattern = screen.getByRole('region', { name: 'Ett mönster att öva på' })
    expect(pattern).toHaveTextContent('XYZ')
    expect(pattern).toHaveTextContent('fyra av 12')
    const buttons = within(pattern).getAllByRole('button')
    expect(buttons).toHaveLength(1)
    fireEvent.click(buttons[0])
    expect(startDrill).toHaveBeenCalledWith({ kind: 'section', section: 'XYZ' })
    // In the main column, after the result and before the ledger.
    const lead = screen.getByTestId('rd-prov-result')
    const ledger = screen.getByRole('heading', { name: 'Per delprov' })
    expect(lead.compareDocumentPosition(pattern) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(pattern.compareDocumentPosition(ledger) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(pattern.closest('aside')).toBeNull()
    // Only one: no second pattern in the margin.
    expect(screen.queryByRole('region', { name: 'Återkommande fälla' })).toBeNull()
  })

  it('lights the recurring trap instead when the pass has one, out of the margin', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.provpass.result.trap = {
      frameworkId: 'NOG-TRAP-001',
      section: 'NOG',
      count: 3,
      headline: null,
    }
    const openLesson = vi.fn()
    mount(10, { data, actions: { openLesson } })
    const trap = screen.getByRole('region', { name: 'Återkommande fälla' })
    expect(trap.closest('aside')).toBeNull()
    expect(screen.queryByRole('region', { name: 'Ett mönster att öva på' })).toBeNull()
    fireEvent.click(within(trap).getByRole('button', { name: /^Slå upp/ }))
    expect(openLesson).toHaveBeenCalledWith('NOG-TRAP-001')
  })

  it('shows no pattern for a clean pass, and ranks against no one', () => {
    const data = structuredClone(FIXTURE_DATA)
    const r = data.provpass.result
    r.correct = r.answered = r.presented
    r.missed = []
    r.sections = r.sections.map((s) => ({ ...s, correct: s.presented }))
    mount(10, { data })
    expect(screen.queryByRole('region', { name: 'Ett mönster att öva på' })).toBeNull()
    const page = document.body.textContent ?? ''
    expect(page).not.toMatch(
      /percentil|bättre än|sämre än|andra (användare|elever|deltagare)|topp \d/i,
    )
  })
})

// ── 6. Konto: Styckeljus as a switch ─────────────────────────────────

function mountKontoAndDrill() {
  return render(
    <div data-rd="folio-plus" lang="sv">
      <DirectionDataProvider data={structuredClone(FIXTURE_DATA)}>
        <FolioKonto width="desktop" live jump={null} onBack={vi.fn()} />
        <FolioDrill
          screen={2}
          width="desktop"
          theme="light"
          live={false}
          onScreen={vi.fn()}
          onTheme={vi.fn()}
          origin={ORIGIN_IDAG}
        />
      </DirectionDataProvider>
    </div>,
  )
}

describe('Folio+ · Konto: Styckeljus under Utseende', () => {
  it('is a labelled Av/På choice beside Tema and Färg; a choice applies at once, focus kept', () => {
    mount(13)
    const looks = screen.getByRole('region', { name: 'Utseende' })
    const light = within(looks).getByRole('group', { name: 'Styckeljus' })
    const words = within(light).getAllByRole('button')
    expect(words.map((b) => b.textContent)).toEqual(['Av', 'På'])
    expect(words[0]).toHaveAttribute('aria-pressed', 'true')
    words[1].focus()
    fireEvent.click(words[1])
    expect(words[1]).toHaveAttribute('aria-pressed', 'true')
    expect(words[0]).toHaveAttribute('aria-pressed', 'false')
    expect(words[1]).toHaveFocus()
    expect(window.localStorage.getItem('fp-styckeljus')).toBe('on')
    // One quiet page: three choices in Utseende, no switch wall.
    expect(within(looks).getAllByRole('group')).toHaveLength(3)
    expect(document.querySelector('.fp-kt [role="switch"]')).toBeNull()
  })

  it('shares its state with the drill’s F, both ways', () => {
    mountKontoAndDrill()
    const light = screen.getByRole('group', { name: 'Styckeljus' })
    fireEvent.click(within(light).getByRole('button', { name: 'På' }))
    expect(screen.getByRole('button', { name: 'Styckeljus' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Styckeljus' }))
    expect(within(light).getByRole('button', { name: 'Av' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('opens the drill lit when Konto turned it on earlier in the session', () => {
    const first = mount(13)
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Styckeljus' })).getByRole('button', { name: 'På' }),
    )
    first.unmount()
    mount(2)
    expect(lightBtn()).toHaveAttribute('aria-pressed', 'true')
    expect(litParas()).toEqual([1])
  })

  it('keeps every rd-konto id', () => {
    mount(13)
    for (const id of [
      'rd-konto-identity',
      'rd-konto-coach-taktiker',
      'rd-konto-mode-light',
      'rd-konto-mode-dark',
      'rd-konto-palette-spalt',
      'rd-konto-export',
      'rd-konto-signout',
      'rd-konto-delete',
    ]) {
      expect(screen.getByTestId(id)).toBeInTheDocument()
    }
  })
})

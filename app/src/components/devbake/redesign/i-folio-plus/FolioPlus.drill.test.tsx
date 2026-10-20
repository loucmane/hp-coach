// Folio+ · the reading drill's borrowings and fixes: Styckeljus (from
// Ljuskägla), the ¶ numbers' hit areas, the distractor disclosures' names,
// the phone's inline options, and the way back from a lesson the facit
// looked up.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { stubLayout } from '@/components/devbake/redesign/contract'
import { DirectionDataProvider, FIXTURE_DATA } from '@/components/devbake/redesign/directionData'
import type { DirectionProps } from '@/components/devbake/redesign/r1Kit'
import type { DirectionActions, DirectionData } from '@/components/devbake/redesign/viewModel'
import { FolioDrill, ORIGIN_IDAG } from './FolioDrill'
import { FolioPlus as Folio } from './FolioPlus'
import { FolioUppslag, type UppslagBack } from './FolioUppslag'

type Mount = {
  data?: DirectionData
  actions?: Partial<DirectionActions>
  width?: DirectionProps['width']
}

function mount(s: DirectionProps['screen'], opts: Mount = {}) {
  const data = opts.data ?? structuredClone(FIXTURE_DATA)
  const onScreen = vi.fn()
  const utils = render(
    <DirectionDataProvider data={data} actions={opts.actions}>
      <Folio
        screen={s}
        width={opts.width ?? 'desktop'}
        theme="light"
        live
        onScreen={onScreen}
        onTheme={vi.fn()}
      />
    </DirectionDataProvider>,
  )
  return { ...utils, onScreen }
}

/** The reading drill alone, as the shell mounts it (FolioPlus.tsx), with
 *  `returning` as the shell would hand it back from a lesson. */
function mountDrill(s: 2 | 3 | 14, opts: Mount & { returning?: boolean } = {}) {
  return render(
    <div data-rd="folio-plus" lang="sv">
      <DirectionDataProvider
        data={opts.data ?? structuredClone(FIXTURE_DATA)}
        actions={opts.actions}
      >
        <FolioDrill
          screen={s}
          width={opts.width ?? 'desktop'}
          theme="light"
          live
          onScreen={vi.fn()}
          onTheme={vi.fn()}
          origin={ORIGIN_IDAG}
          returning={opts.returning}
        />
      </DirectionDataProvider>
    </div>,
  )
}

const press = (key: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(window, { key, ...init })

const lightBtn = () => screen.getByRole('button', { name: 'Styckeljus' })
const para = (n: number) => screen.getByTestId(`rd-para-${n}`)
const litParas = () =>
  Array.from(document.querySelectorAll<HTMLElement>('.fp-para[data-focused="true"]')).map((p) =>
    Number(p.dataset.n),
  )

beforeAll(stubLayout)
beforeEach(() => window.sessionStorage.clear())
afterEach(() => vi.restoreAllMocks())

// ── 1. Styckeljus ────────────────────────────────────────────────────

describe('Folio+ · Styckeljus, the paragraph light', () => {
  it.each(['desktop', 'phone'] as const)('is off by default on %s, with a visible toggle', (w) => {
    mount(2, { width: w })
    expect(lightBtn()).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('rd-passage')).toHaveAttribute('data-focus', 'false')
    expect(litParas()).toEqual([])
    fireEvent.click(lightBtn())
    expect(lightBtn()).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('rd-passage')).toHaveAttribute('data-focus', 'true')
    // One paragraph in the light, every other one dimmed.
    expect(litParas()).toEqual([1])
    fireEvent.click(lightBtn())
    expect(lightBtn()).toHaveAttribute('aria-pressed', 'false')
    expect(litParas()).toEqual([])
  })

  it('keeps F, J, K and Esc: F turns it on, J and K move it, Esc turns it off', () => {
    mount(2)
    press('f')
    expect(litParas()).toEqual([1])
    press('j')
    press('j')
    expect(litParas()).toEqual([3])
    press('k')
    expect(litParas()).toEqual([2])
    press('Escape')
    expect(lightBtn()).toHaveAttribute('aria-pressed', 'false')
    expect(litParas()).toEqual([])
    // J alone turns it on, as before.
    press('j')
    expect(lightBtn()).toHaveAttribute('aria-pressed', 'true')
    expect(litParas()).toHaveLength(1)
    press('f')
    expect(litParas()).toEqual([])
  })

  it('follows the paragraph the reader moves to: a ¶ number, and a ¶ link', () => {
    mount(2)
    fireEvent.click(within(para(4)).getByRole('button', { name: /^Stycke 4/ }))
    expect(lightBtn()).toHaveAttribute('aria-pressed', 'true')
    expect(litParas()).toEqual([4])
    expect(within(para(4)).getByRole('button', { name: /^Stycke 4/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    // The lit number again turns the light off.
    fireEvent.click(within(para(4)).getByRole('button', { name: /^Stycke 4/ }))
    expect(litParas()).toEqual([])
    // On again, then a ¶ link in the facit carries the light to its paragraph.
    press('f')
    fireEvent.click(screen.getByTestId('rd-option-A'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    const cite = screen.getAllByTestId(/^rd-cite-\d+$/)[0]
    const n = Number(cite.dataset.testid?.replace('rd-cite-', ''))
    fireEvent.click(cite)
    expect(litParas()).toEqual([n])
  })

  it('follows the scroll: the paragraph on the reading line takes the light', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })
    mount(2)
    fireEvent.click(lightBtn())
    expect(litParas()).toEqual([1])
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
    // Paragraph n spans 100 n − 260 … 100 n − 160: the line (200, a third
    // down the box) falls in ¶4.
    for (let n = 1; n <= 9; n++) para(n).getBoundingClientRect = () => rect(100 * n - 260, 100)
    fireEvent.scroll(box)
    expect(litParas()).toEqual([4])
  })

  it('is remembered within the session, from one drill to the next', () => {
    const first = mount(2)
    fireEvent.click(lightBtn())
    first.unmount()
    mount(14)
    expect(lightBtn()).toHaveAttribute('aria-pressed', 'true')
    expect(litParas()).toEqual([1])
    fireEvent.click(lightBtn())
    expect(window.sessionStorage.getItem('fp-styckeljus')).toBe('off')
  })

  it('keeps the light through to the next question of the text', () => {
    mount(2)
    press('j')
    press('j')
    fireEvent.click(screen.getByTestId('rd-option-A'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(lightBtn()).toHaveAttribute('aria-pressed', 'true')
    expect(litParas()).toEqual([2])
  })
})

// ── 2. The ¶ numbers' hit areas ──────────────────────────────────────

/** fpDrill.css as written (the test run loads no CSS). */
const drillCss = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'fpDrill.css'),
  'utf8',
)

/** The declarations of the rule for `selector` in fpDrill.css. */
function rule(selector: string): string {
  const at = drillCss.indexOf(`${selector} {`)
  if (at < 0) throw new Error(`no rule for ${selector}`)
  return drillCss.slice(at, drillCss.indexOf('}', at))
}

describe('Folio+ · the ¶ numbers’ hit areas', () => {
  it('sets the ¶ number’s own box to at least 24 px tall, and 44 × 44 px on phone', () => {
    const desk = rule("[data-rd='folio-plus'] .fp-pnum.fp-pnum")
    expect(desk).toMatch(/min-height: 24px/)
    const phone = rule("[data-rd='folio-plus'] .fp-pdrill .fp-pnum.fp-pnum")
    expect(phone).toMatch(/width: 44px/)
    expect(phone).toMatch(/min-height: 44px/)
    expect(phone).toMatch(/box-sizing: border-box/)
  })

  it('keeps every ¶ number a button out of the tab order', () => {
    mount(2, { width: 'phone' })
    const n = within(para(1)).getByRole('button', { name: /^Stycke 1/ })
    expect(n).toHaveClass('fp-pnum')
    expect(n).toHaveAttribute('tabindex', '-1')
  })
})

// ── 3. The distractor disclosures ────────────────────────────────────

describe('Folio+ · the facit’s other options', () => {
  it.each(['desktop', 'phone'] as const)('names each disclosure by its own letter on %s', (w) => {
    mount(3, { width: w })
    const buttons = screen.getAllByRole('button', { name: /^Varför inte [A-E]$/ })
    expect(buttons.length).toBeGreaterThanOrEqual(2)
    const names = buttons.map((b) => b.textContent)
    expect(new Set(names).size).toBe(names.length)
    for (const b of buttons) {
      const letter = b.textContent?.slice(-1) ?? ''
      expect(b.closest(`[data-testid="rd-distractor-${letter}"]`)).not.toBeNull()
      expect(b).toHaveAttribute('aria-expanded', 'false')
    }
    fireEvent.click(buttons[0])
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true')
    // Its name stays its own when open: the state is aria-expanded.
    expect(buttons[0]).toHaveAccessibleName(names[0] ?? '')
    expect(document.getElementById(buttons[0].getAttribute('aria-controls') ?? '')).not.toBeNull()
  })
})

// ── 4. Phone: the options inline ─────────────────────────────────────

describe('Folio+ · phone: the options inline under the passage', () => {
  it('shows the options on the page at once, Svara in the dock at its peek', () => {
    const lock = vi.fn(() => ({ correct: false }))
    mount(2, { width: 'phone', actions: { drill: { lock } } })
    const sheet = screen.getByTestId('rd-sheet')
    expect(sheet).toHaveAttribute('data-state', 'peek')
    expect(screen.queryByRole('button', { name: /^Visa de .* alternativen/ })).toBeNull()
    const scroll = document.querySelector('.fp-pdrill-scroll') as HTMLElement
    for (const l of ['A', 'B', 'C', 'D']) {
      const o = screen.getByTestId(`rd-option-${l}`)
      expect(scroll).toContainElement(o)
      expect(sheet).not.toContainElement(o)
    }
    // The question follows the passage in the same column.
    const passage = screen.getByTestId('rd-passage')
    const prompt = within(scroll).getByRole('heading', { level: 2 })
    expect(passage.compareDocumentPosition(prompt) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // The dock: the place, the jump, Svara.
    expect(within(sheet).getByText('Fråga 3 av 4')).toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: 'Till frågan' })).toBeInTheDocument()
    const svara = within(sheet).getByTestId('rd-lock')
    expect(svara).toBeDisabled()
    fireEvent.click(screen.getByTestId('rd-option-B'))
    expect(svara).toBeEnabled()
    expect(svara.parentElement).toHaveTextContent('Ditt val: B')
    fireEvent.click(svara)
    expect(lock).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('rd-verdict')).toBeInTheDocument()
    expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'full')
  })

  it('jumps to the question from the dock, focus on its prompt', () => {
    mount(2, { width: 'phone' })
    fireEvent.click(screen.getByRole('button', { name: 'Till frågan' }))
    const scroll = document.querySelector('.fp-pdrill-scroll') as HTMLElement
    expect(within(scroll).getByRole('heading', { level: 2 })).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Till frågan' })).toBeNull()
  })

  it('takes the letters too, with the passage in view', () => {
    mount(14, { width: 'phone' })
    press('c')
    expect(screen.getByTestId('rd-option-C')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'peek')
  })
})

// ── 5. Back from a lesson ────────────────────────────────────────────

function mountUppslag(back?: UppslagBack, width: DirectionProps['width'] = 'desktop') {
  return render(
    <div data-rd="folio-plus" lang="sv">
      <DirectionDataProvider data={structuredClone(FIXTURE_DATA)}>
        <FolioUppslag width={width} live asked={null} back={back} />
      </DirectionDataProvider>
    </div>,
  )
}

describe('Folio+ · back from a lesson to the question', () => {
  it.each([
    'desktop',
    'phone',
  ] as const)('shows “Tillbaka till frågan” on Uppslag on %s; it and Esc go back', (w) => {
    const onBack = vi.fn()
    mountUppslag({ onBack }, w)
    const back = screen.getByRole('button', { name: 'Tillbaka till frågan' })
    expect(screen.getByTestId('rd-lesson')).toBeInTheDocument()
    fireEvent.click(back)
    expect(onBack).toHaveBeenCalledTimes(1)
    press('Escape')
    expect(onBack).toHaveBeenCalledTimes(2)
  })

  it('shows no way back, and Esc does nothing, on a lesson opened from elsewhere', () => {
    mountUppslag(undefined)
    expect(screen.queryByRole('button', { name: 'Tillbaka till frågan' })).toBeNull()
    expect(press('Escape')).toBe(true)
  })

  it('reopens the ELF drill at the feedback it looked the lesson up from', () => {
    const openLesson = vi.fn()
    const lock = vi.fn(() => ({ correct: false }))
    const first = mountDrill(14, { actions: { openLesson, drill: { lock } } })
    fireEvent.click(screen.getByTestId('rd-option-C'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    const before = screen.getByTestId('rd-verdict').textContent
    fireEvent.click(screen.getByRole('button', { name: /^Slå upp/ }))
    expect(openLesson).toHaveBeenCalledWith('ELF-TYPE-001')
    first.unmount()
    mountDrill(14, { returning: true, actions: { drill: { lock } } })
    const verdict = screen.getByTestId('rd-verdict')
    expect(verdict.textContent).toBe(before)
    expect(verdict).toHaveFocus()
    expect(screen.getByText('Ditt svar')).toBeInTheDocument()
    // Graded as it was: the controller hears no second answer.
    expect(lock).toHaveBeenCalledTimes(1)
  })

  it('reopens the LÄS drill at the reader’s own pick, not the bake-off’s', () => {
    const Q3 = FIXTURE_DATA.drills.reading.questions[2]
    const wrong = FIXTURE_DATA.drills.reading.wrongPick?.[Q3.qid]
    const pick = (['A', 'B', 'C', 'D'] as const).find((l) => l !== Q3.answer && l !== wrong)
    if (!pick) throw new Error('no other wrong option')
    const first = mountDrill(2)
    fireEvent.click(screen.getByTestId(`rd-option-${pick}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
    fireEvent.click(screen.getByRole('button', { name: /^Slå upp/ }))
    first.unmount()
    mountDrill(3, { returning: true })
    const mine = screen.getByText('Ditt svar').closest('.fp-opt')
    expect(mine).toHaveTextContent(new RegExp(`^${pick}`))
    expect(screen.getByText('Fråga 3 av 4')).toBeInTheDocument()
  })

  it('opens a sitting fresh when the reader is not coming back from a lesson', () => {
    const first = mountDrill(14)
    fireEvent.click(screen.getByTestId('rd-option-C'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    fireEvent.click(screen.getByRole('button', { name: /^Slå upp/ }))
    first.unmount()
    mountDrill(14)
    expect(screen.queryByTestId('rd-verdict')).toBeNull()
    expect(screen.getByTestId('rd-option-C')).toHaveAttribute('aria-pressed', 'false')
  })
})

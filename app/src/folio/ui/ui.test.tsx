import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { formatViolations, runAxe } from '@/test/a11y'
import { useFolioPrefs } from '../lib/folioPrefs'
import { Chip, ChipRow } from './ChipRow'
import { Go } from './Go'
import { Kbd, Keys } from './Kbd'
import { Lit } from './Lit'
import { BAND_CORE, bandGeometry, RangeBand, svNumber } from './RangeBand'
import { SecChip } from './SecChip'
import { Seg } from './Seg'
import { Stepper, type StepperStep } from './Stepper'

const inFolio = (ui: ReactNode) => render(<div data-folio="">{ui}</div>)

/** The OS asks for reduced motion (or not); Konto's Rörelse stays Som systemet. */
function osReducedMotion(reduce: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: reduce && query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  )
}

beforeEach(() => {
  useFolioPrefs.getState().resetPrefs()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SecChip', () => {
  it.each([
    ['ORD', 'ord'],
    ['LÄS', 'las'],
    ['MEK', 'mek'],
    ['ELF', 'elf'],
    ['XYZ', 'xyz'],
    ['KVA', 'kva'],
    ['NOG', 'nog'],
    ['DTK', 'dtk'],
  ] as const)('shows %s in its own section colour', (section, key) => {
    inFolio(<SecChip section={section} />)
    const chip = screen.getByText(section)
    expect(chip).toHaveClass('fa-ui-sec')
    expect(chip).toHaveAttribute('data-sec', key)
    expect(chip).not.toHaveAttribute('data-size')
  })

  it('has a larger size for a chapter heading', () => {
    inFolio(<SecChip section="KVA" size="l" />)
    expect(screen.getByText('KVA')).toHaveAttribute('data-size', 'l')
  })
})

describe('Kbd', () => {
  it('renders a key cap', () => {
    inFolio(<Kbd>J</Kbd>)
    const cap = screen.getByText('J')
    expect(cap.tagName).toBe('KBD')
    expect(cap).toHaveClass('fa-ui-kbd')
  })

  it('can speak a key whose glyph a screen reader would garble', () => {
    inFolio(<Kbd label="Enter">↵</Kbd>)
    expect(screen.getByText('↵')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Enter')).toHaveClass('fa-ui-sr')
    expect(screen.getByText('Enter').closest('kbd')).toHaveClass('fa-ui-kbd')
  })

  it('shows no key cap and no hint row when Enbokstavs-kortkommandon is off (kbd=off)', () => {
    useFolioPrefs.getState().setPrefs({ kbd: false })
    const { container } = inFolio(
      <>
        <Kbd>J</Kbd>
        <Keys>
          <Kbd>J</Kbd> <Kbd>K</Kbd> nästa och förra fällan
        </Keys>
      </>,
    )
    expect(container.querySelector('kbd')).toBeNull()
    expect(container.querySelector('.fa-ui-keys')).toBeNull()
    expect(screen.queryByText(/nästa och förra fällan/)).toBeNull()
  })

  it('keeps a hint row together with its caps while shortcuts are on', () => {
    inFolio(
      <Keys>
        <Kbd>J</Kbd> <Kbd>K</Kbd> nästa och förra fällan
      </Keys>,
    )
    const row = screen.getByText(/nästa och förra fällan/)
    expect(row).toHaveClass('fa-ui-keys')
    expect(
      within(row)
        .getAllByText(/^[JK]$/)
        .map((cap) => cap.tagName),
    ).toEqual(['KBD', 'KBD'])
  })
})

describe('Go', () => {
  it('is one filled ink button by default', async () => {
    const onClick = vi.fn()
    const { container } = inFolio(<Go onClick={onClick}>Svara</Go>)
    const go = screen.getByRole('button', { name: 'Svara' })
    expect(go).toHaveClass('fa-ui-go')
    expect(go).toHaveAttribute('type', 'button')
    expect(container.querySelectorAll('.fa-ui-go')).toHaveLength(1)
    await userEvent.click(go)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is a real link when it has an href', () => {
    inFolio(<Go href="/uppslag/kva#steg-2">Fortsätt fälla 1</Go>)
    const go = screen.getByRole('link', { name: 'Fortsätt fälla 1' })
    expect(go).toHaveClass('fa-ui-go')
    expect(go).toHaveAttribute('href', '/uppslag/kva#steg-2')
    expect(go).not.toHaveAttribute('type')
  })

  it('shows its key as a hint that the name leaves out, and names the shortcut', () => {
    inFolio(
      <Go href="/uppslag/kva#steg-2" kbd="↵" keyshortcuts="Enter">
        Fortsätt fälla 1
      </Go>,
    )
    const go = screen.getByRole('link', { name: 'Fortsätt fälla 1' })
    expect(go).toHaveAttribute('aria-keyshortcuts', 'Enter')
    const cap = within(go).getByText('↵')
    expect(cap.tagName).toBe('KBD')
    expect(cap).toHaveClass('fa-ui-kbd')
    expect(cap).toHaveAttribute('aria-hidden', 'true')
  })

  it('drops the hint and the shortcut when shortcuts are off (kbd=off)', () => {
    useFolioPrefs.getState().setPrefs({ kbd: false })
    inFolio(
      <Go kbd="↵" keyshortcuts="Enter">
        Nästa fråga
      </Go>,
    )
    const go = screen.getByRole('button', { name: 'Nästa fråga' })
    expect(go).not.toHaveAttribute('aria-keyshortcuts')
    expect(go.querySelector('kbd')).toBeNull()
  })

  it('marks a docked action, so the phone dock can hide the hint', () => {
    inFolio(
      <Go dock kbd="↵">
        Fortsätt fälla 1 · ca 1 min
      </Go>,
    )
    const go = screen.getByRole('button', { name: 'Fortsätt fälla 1 · ca 1 min' })
    expect(go).toHaveAttribute('data-dock')
    expect(within(go).getByText('↵')).toHaveClass('fa-ui-kbd')
  })

  it('takes keyboard focus in reading order', async () => {
    inFolio(
      <>
        <Go href="#a">Först</Go>
        <Go>Sedan</Go>
      </>,
    )
    await userEvent.tab()
    expect(screen.getByRole('link', { name: 'Först' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Sedan' })).toHaveFocus()
  })

  it.each([
    ['system', false, 'full'],
    ['system', true, 'none'],
    ['less', false, 'less'],
    ['none', false, 'none'],
  ] as const)('follows Rörelse %s (OS reduce: %s) with data-motion=%s', (motion, reduce, level) => {
    osReducedMotion(reduce)
    useFolioPrefs.getState().setPrefs({ motion })
    inFolio(<Go>Svara</Go>)
    expect(screen.getByRole('button', { name: 'Svara' })).toHaveAttribute('data-motion', level)
  })
})

describe('Lit', () => {
  it('is the one lit sheet: data-lit, an article by default', () => {
    const { container } = inFolio(
      <Lit aria-labelledby="now-title">
        <h2 id="now-title">Fortsätt lektionen där du slutade</h2>
      </Lit>,
    )
    const lit = screen.getByRole('article', { name: 'Fortsätt lektionen där du slutade' })
    expect(lit).toHaveClass('fa-ui-lit')
    expect(lit).toHaveAttribute('data-lit', 'true')
    expect(container.querySelectorAll('[data-lit="true"]')).toHaveLength(1)
  })

  it('can be another sectioning element', () => {
    inFolio(
      <Lit as="section" aria-label="Föreslaget">
        Avsluta fälla 1
      </Lit>,
    )
    const lit = screen.getByRole('region', { name: 'Föreslaget' })
    expect(lit.tagName).toBe('SECTION')
    expect(lit).toHaveAttribute('data-lit', 'true')
  })

  it('warns in development when a second lit sheet mounts, and only then', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const first = inFolio(<Lit>Ett</Lit>)
    expect(warn).not.toHaveBeenCalled()
    const second = inFolio(<Lit>Två</Lit>)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toMatch(/one lit/i)
    second.unmount()
    first.unmount()
    inFolio(<Lit>Tre</Lit>)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['system', false, 'full'],
    ['system', true, 'none'],
    ['less', false, 'less'],
    ['none', false, 'none'],
  ] as const)('rises in only with motion: Rörelse %s (OS reduce: %s) gives %s', (motion, reduce, level) => {
    osReducedMotion(reduce)
    useFolioPrefs.getState().setPrefs({ motion })
    inFolio(<Lit>Nästa grepp</Lit>)
    expect(screen.getByText('Nästa grepp')).toHaveAttribute('data-motion', level)
  })
})

describe('RangeBand', () => {
  it.each([
    // r6/A: the Idag and Framsteg prognosis, two Öva level bands, the Provresultat hit rate.
    [0.4, 0.7, 0, 2, 15, 25],
    [0.3, 1.0, 0, 2, 3.333, 58.333],
    [0, 0.6, 0, 2, -10, 50],
    [0.55, 0.95, 0, 1, 41.667, 66.667],
  ])('draws %s–%s on %s–%s where the design does', (low, high, min, max, left, width) => {
    const box = bandGeometry(low, high, min, max)
    expect(box.left).toBeCloseTo(left, 2)
    expect(box.width).toBeCloseTo(width, 2)
    // The solid core is the stated range, exactly; only the edges fade.
    const at = (value: number) => ((value - min) / (max - min)) * 100
    expect(box.left + BAND_CORE.start * box.width).toBeCloseTo(at(low), 3)
    expect(box.left + BAND_CORE.end * box.width).toBeCloseTo(at(high), 3)
  })

  it('is labelled for screen readers and drawn with the honest geometry', () => {
    const { container } = inFolio(<RangeBand low={0.4} high={0.7} max={2} />)
    const plot = screen.getByRole('img', { name: 'mellan 0,4 och 0,7' })
    expect(plot.closest('.fa-ui-band')).not.toBeNull()
    const range = container.querySelector<HTMLElement>('.fa-ui-band-range')
    expect(range).not.toBeNull()
    expect(range?.style.left).toBe('15%')
    expect(range?.style.width).toBe('25%')
  })

  it('takes a fuller label, or stays silent beside numbers already in the text', () => {
    const { container } = inFolio(
      <>
        <RangeBand low={0.55} high={0.95} label="Träffsäkerhet troligen mellan 55 och 95 procent" />
        <RangeBand low={0.4} high={0.7} max={2} decorative />
      </>,
    )
    expect(
      screen.getByRole('img', { name: 'Träffsäkerhet troligen mellan 55 och 95 procent' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('img')).toHaveLength(1)
    const quiet = container.querySelectorAll('.fa-ui-band-plot')[1]
    expect(quiet).toHaveAttribute('aria-hidden', 'true')
    expect(quiet).not.toHaveAttribute('role')
  })

  it('formats with a decimal comma and a real minus', () => {
    expect([0.4, 0.7, 2, 0.55, 1.25, -0.2, 0.333].map(svNumber)).toEqual([
      '0,4',
      '0,7',
      '2',
      '0,55',
      '1,25',
      '−0,2',
      '0,33',
    ])
    inFolio(<RangeBand low={0.55} high={0.95} format={(n) => `${Math.round(n * 100)} %`} />)
    expect(screen.getByRole('img', { name: 'mellan 55 % och 95 %' })).toBeInTheDocument()
  })

  it('marks the goal, the observed value and the axis, without exposing them twice', () => {
    const { container } = inFolio(
      <RangeBand
        low={0.55}
        high={0.95}
        point={10 / 12}
        goal={{ value: 1, label: 'Mål' }}
        ticks={['0 %', '50 %', '100 %']}
      />,
    )
    const point = container.querySelector<HTMLElement>('.fa-ui-band-point')
    expect(point?.style.left).toBe('83.3333%')
    expect(container.querySelector('.fa-ui-band-goal')).toHaveTextContent('Mål')
    const ticks = container.querySelector('.fa-ui-band-ticks')
    expect(ticks).toHaveAttribute('aria-hidden', 'true')
    expect(ticks?.textContent).toBe('0 %50 %100 %')
    // The goal and the point sit inside the labelled image, so its name is all a reader hears.
    expect(screen.getByRole('img', { name: 'mellan 0,55 och 0,95' })).toContainElement(point)
  })

  it('colours a section band with its section, as data', () => {
    const { container } = inFolio(
      <RangeBand low={0} high={0.6} max={2} section="KVA" size="mini" />,
    )
    const band = container.querySelector('.fa-ui-band')
    expect(band).toHaveAttribute('data-sec', 'kva')
    expect(band).toHaveAttribute('data-size', 'mini')
  })

  it.each([
    ['system', false, 'full'],
    ['system', true, 'none'],
    ['less', false, 'less'],
    ['none', false, 'none'],
  ] as const)('grows from its lower bound only with motion: Rörelse %s (OS reduce: %s) gives %s', (motion, reduce, level) => {
    osReducedMotion(reduce)
    useFolioPrefs.getState().setPrefs({ motion })
    const { container } = inFolio(<RangeBand low={0.4} high={0.7} max={2} />)
    expect(container.querySelector('.fa-ui-band')).toHaveAttribute('data-motion', level)
  })
})

describe('Seg', () => {
  const SIZES = [
    { value: 5, label: '5' },
    { value: 10, label: '10' },
    { value: 20, label: '20' },
  ]

  it('is a labelled group of toggle buttons with exactly one pressed', async () => {
    const onChange = vi.fn()
    inFolio(<Seg label="Antal frågor" options={SIZES} value={10} onChange={onChange} />)
    const group = screen.getByRole('group', { name: 'Antal frågor' })
    expect(group).toHaveClass('fa-ui-seg')
    expect(group.tagName).toBe('FIELDSET')
    const buttons = within(group).getAllByRole('button')
    expect(buttons.map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([
      ['5', 'false'],
      ['10', 'true'],
      ['20', 'false'],
    ])
    expect(within(group).getByRole('button', { pressed: true })).toHaveTextContent('10')
    await userEvent.click(buttons[2])
    expect(onChange).toHaveBeenCalledWith(20)
    // A choice, never a toggle: the pressed option stays chosen.
    await userEvent.click(buttons[1])
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('works from the keyboard', async () => {
    const onChange = vi.fn()
    inFolio(
      <Seg
        label="Frågeurval"
        options={[
          { value: 'near', label: 'Nära min nivå' },
          { value: 'random', label: 'Slumpat' },
        ]}
        value="near"
        onChange={onChange}
      />,
    )
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Nära min nivå' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Slumpat' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('random')
  })

  it('carries a second line in the name, and can be labelled by visible text', () => {
    inFolio(
      <>
        <b id="sitting">Provtillfälle</b>
        <Seg
          aria-labelledby="sitting"
          options={[
            { value: 'v27', label: 'Vårprovet 2027', hint: 'lördag 10 april · 158 dagar' },
            { value: 'h27', label: 'Höstprovet 2027', hint: 'oktober' },
          ]}
          value="v27"
          onChange={() => {}}
        />
      </>,
    )
    const group = screen.getByRole('group', { name: 'Provtillfälle' })
    expect(
      within(group).getByRole('button', {
        name: 'Vårprovet 2027 lördag 10 april · 158 dagar',
        pressed: true,
      }),
    ).toBeInTheDocument()
    expect(within(group).getByText('oktober').tagName).toBe('SMALL')
  })

  it('keeps a disabled option out of the choice', async () => {
    const onChange = vi.fn()
    inFolio(
      <Seg
        label="Antal frågor"
        options={[...SIZES.slice(0, 2), { value: 20, label: '20', disabled: true }]}
        value={10}
        onChange={onChange}
      />,
    )
    const off = screen.getByRole('button', { name: '20' })
    expect(off).toBeDisabled()
    await userEvent.click(off)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('can stretch its options across the row', () => {
    inFolio(<Seg label="Antal frågor" options={SIZES} value={5} onChange={() => {}} stretch />)
    expect(screen.getByRole('group', { name: 'Antal frågor' })).toHaveAttribute('data-stretch')
  })
})

const LESSON: StepperStep[] = [
  { id: 'steg-1', label: 'Känn igen', href: '#steg-1', done: true },
  { id: 'steg-2', label: 'Gissa först', href: '#steg-2' },
  { id: 'steg-3', label: 'Fällan', href: '#steg-3' },
  { id: 'steg-4', label: 'Motdraget', href: '#steg-4' },
  { id: 'steg-5', label: 'Öva', href: '#steg-5' },
]

describe('Stepper', () => {
  it('is a labelled list where every step is a real link and the current one is marked', () => {
    inFolio(<Stepper label="Stegen i fällan" steps={LESSON} current="steg-2" />)
    const nav = screen.getByRole('navigation', { name: 'Stegen i fällan' })
    const list = within(nav).getByRole('list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(5)
    const links = within(list).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '#steg-1',
      '#steg-2',
      '#steg-3',
      '#steg-4',
      '#steg-5',
    ])
    expect(screen.getByRole('link', { name: 'Känn igen, steg 1 av 5, klart' })).toBeInTheDocument()
    const current = screen.getByRole('link', { name: 'Gissa först, steg 2 av 5' })
    expect(current).toHaveAttribute('aria-current', 'step')
    expect(nav.querySelectorAll('[aria-current]')).toHaveLength(1)
    expect(links.every((link) => link.classList.contains('fa-ui-step'))).toBe(true)
  })

  it('draws a done step with a tick and the others with their number, hidden from readers', () => {
    const { container } = inFolio(
      <Stepper label="Stegen i fällan" steps={LESSON} current="steg-2" />,
    )
    const numerals = [...container.querySelectorAll('.fa-ui-step-n')]
    expect(numerals.map((n) => n.textContent)).toEqual(['✓', '2', '3', '4', '5'])
    expect(numerals.every((n) => n.getAttribute('aria-hidden') === 'true')).toBe(true)
    expect(screen.getByRole('link', { name: /Känn igen/ })).toHaveAttribute('data-done')
    expect(screen.getByRole('link', { name: /Fällan/ })).not.toHaveAttribute('data-done')
  })

  it('makes a step a button when it is an action, and reports a choice', async () => {
    const onSelect = vi.fn()
    inFolio(
      <Stepper
        label="Stegen i fällan"
        steps={[
          { id: 'a', label: 'Känn igen', onSelect },
          { id: 'b', label: 'Gissa först', onSelect },
        ]}
        current="a"
      />,
    )
    const step = screen.getByRole('button', { name: 'Gissa först, steg 2 av 2' })
    await userEvent.click(step)
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Känn igen, steg 1 av 2' })).toHaveAttribute(
      'aria-current',
      'step',
    )
  })

  it('lets a link step run its own navigation', async () => {
    const onSelect = vi.fn((event: { preventDefault: () => void }) => event.preventDefault())
    inFolio(
      <Stepper
        label="Stegen i fällan"
        steps={[{ id: 'a', label: 'Känn igen', href: '/uppslag/kva#steg-1', onSelect }]}
        current="a"
      />,
    )
    await userEvent.click(screen.getByRole('link', { name: 'Känn igen, steg 1 av 1' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('sits in a chip row that wraps on wide screens', () => {
    inFolio(<Stepper label="Stegen i fällan" steps={LESSON} current="steg-2" />)
    const list = within(screen.getByRole('navigation')).getByRole('list')
    expect(list).toHaveClass('fa-ui-chiprow')
    expect(list).toHaveAttribute('data-wrap')
  })
})

/** jsdom has no layout: give one element a scroll box. */
function scrollBox(el: Element, box: { scrollWidth: number; clientWidth: number }) {
  let left = 0
  Object.defineProperty(el, 'scrollWidth', { configurable: true, value: box.scrollWidth })
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: box.clientWidth })
  Object.defineProperty(el, 'scrollLeft', {
    configurable: true,
    get: () => left,
    set: (value: number) => {
      left = value
    },
  })
}

const JUMPS = (current?: string) =>
  ['Provet', 'Övningen', 'Provpass', 'Läsning', 'Tangentbord', 'Data', 'Hjälp'].map((word) => (
    <Chip key={word} href={`#${word}`} current={word === current} data-testid={word}>
      {word}
    </Chip>
  ))

describe('ChipRow', () => {
  it('is one row of real links, in the element it is given', () => {
    inFolio(
      <ChipRow as="nav" aria-label="På sidan">
        {JUMPS('Provet')}
      </ChipRow>,
    )
    const row = screen.getByRole('navigation', { name: 'På sidan' })
    expect(row).toHaveClass('fa-ui-chiprow')
    expect(row).not.toHaveAttribute('data-wrap')
    const chips = within(row).getAllByRole('link')
    expect(chips).toHaveLength(7)
    expect(chips.every((chip) => chip.classList.contains('fa-ui-chip'))).toBe(true)
    expect(screen.getByRole('link', { name: 'Provet' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('link', { name: 'Hjälp' })).not.toHaveAttribute('aria-current')
  })

  it('makes a chip a button when it is an action, with any current kind', async () => {
    const onClick = vi.fn()
    inFolio(
      <ChipRow>
        <Chip onClick={onClick}>Steg 1</Chip>
        <Chip current="step">Steg 2</Chip>
      </ChipRow>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Steg 1' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Steg 1' })).toHaveAttribute('type', 'button')
    expect(screen.getByRole('button', { name: 'Steg 2' })).toHaveAttribute('aria-current', 'step')
  })

  it('fades only the edge that hides more chips', () => {
    inFolio(
      <ChipRow as="nav" aria-label="På sidan">
        {JUMPS()}
      </ChipRow>,
    )
    const row = screen.getByRole('navigation', { name: 'På sidan' })
    // Without layout nothing is hidden, so nothing fades.
    expect(row).not.toHaveAttribute('data-overflow')
    scrollBox(row, { scrollWidth: 600, clientWidth: 300 })
    fireEvent.scroll(row)
    expect(row).toHaveAttribute('data-overflow', 'end')
    row.scrollLeft = 150
    fireEvent.scroll(row)
    expect(row).toHaveAttribute('data-overflow', 'both')
    row.scrollLeft = 300
    fireEvent.scroll(row)
    expect(row).toHaveAttribute('data-overflow', 'start')
    scrollBox(row, { scrollWidth: 300, clientWidth: 300 })
    fireEvent.scroll(row)
    expect(row).not.toHaveAttribute('data-overflow')
  })

  describe('brings the current chip into view', () => {
    const scrollTo = vi.fn()
    let restore = () => {}
    // Rows and chips by test id, the stepper's own row by class and its steps by href.
    const RECTS: Record<string, { left: number; width: number }> = {
      row: { left: 0, width: 300 },
      Provet: { left: 0, width: 70 },
      Provpass: { left: 160, width: 80 },
      Tangentbord: { left: 380, width: 110 },
      Hjälp: { left: 560, width: 60 },
      '#steg-5': { left: 420, width: 90 },
    }
    const keyOf = (el: Element) =>
      el.getAttribute('data-testid') ??
      el.getAttribute('href') ??
      (el.classList.contains('fa-ui-chiprow') ? 'row' : '')

    beforeEach(() => {
      scrollTo.mockClear()
      const own = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTo')
      Object.defineProperty(Element.prototype, 'scrollTo', {
        configurable: true,
        writable: true,
        value: scrollTo,
      })
      restore = () => {
        if (own) Object.defineProperty(Element.prototype, 'scrollTo', own)
        else Reflect.deleteProperty(Element.prototype, 'scrollTo')
      }
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
        this: Element,
      ) {
        const { left, width } = RECTS[keyOf(this)] ?? { left: 0, width: 0 }
        return {
          left,
          width,
          right: left + width,
          x: left,
          top: 0,
          y: 0,
          height: 40,
          bottom: 40,
          toJSON: () => ({}),
        } as DOMRect
      })
    })

    afterEach(() => restore())

    const row = (current: string) => (
      <ChipRow as="nav" aria-label="På sidan" data-testid="row">
        {JUMPS(current)}
      </ChipRow>
    )

    it('scrolls a clipped current chip to the start at once on arrival', () => {
      inFolio(row('Tangentbord'))
      expect(scrollTo).toHaveBeenCalledTimes(1)
      expect(scrollTo.mock.contexts[0]).toBe(screen.getByRole('navigation'))
      expect(scrollTo).toHaveBeenCalledWith({ left: 364, behavior: 'auto' })
    })

    it('leaves the row alone while the current chip is in view', () => {
      inFolio(row('Provpass'))
      expect(scrollTo).not.toHaveBeenCalled()
    })

    it('follows a new current chip smoothly, and not when the screen re-renders', () => {
      const view = inFolio(row('Provet'))
      expect(scrollTo).not.toHaveBeenCalled()
      view.rerender(<div data-folio="">{row('Hjälp')}</div>)
      expect(scrollTo).toHaveBeenCalledWith({ left: 544, behavior: 'smooth' })
      view.rerender(<div data-folio="">{row('Hjälp')}</div>)
      expect(scrollTo).toHaveBeenCalledTimes(1)
    })

    it('jumps instead of gliding when motion is off', () => {
      useFolioPrefs.getState().setPrefs({ motion: 'none' })
      const view = inFolio(row('Provet'))
      view.rerender(<div data-folio="">{row('Hjälp')}</div>)
      expect(scrollTo).toHaveBeenCalledWith({ left: 544, behavior: 'auto' })
    })

    it('scrolls the lesson stepper to its current step', () => {
      inFolio(<Stepper label="Stegen i fällan" steps={LESSON} current="steg-5" />)
      expect(scrollTo).toHaveBeenCalledWith({ left: 404, behavior: 'auto' })
      expect(scrollTo.mock.contexts[0]).toBe(
        within(screen.getByRole('navigation')).getByRole('list'),
      )
    })

    it('does nothing before the row has a layout', () => {
      RECTS.row = { left: 0, width: 0 }
      try {
        inFolio(row('Hjälp'))
        expect(scrollTo).not.toHaveBeenCalled()
      } finally {
        RECTS.row = { left: 0, width: 300 }
      }
    })
  })
})

describe('the primitives together', () => {
  it('pass axe on one lit sheet', async () => {
    const { container } = inFolio(
      <main>
        <Lit aria-labelledby="sug">
          <SecChip section="KVA" />
          <h2 id="sug">Avsluta fälla 1, öva den sedan</h2>
          <RangeBand
            low={0.4}
            high={0.7}
            max={2}
            goal={{ value: 2, label: 'Mål 2,0' }}
            ticks={['0', '0,5', '1,0', '1,5', '2,0']}
          />
          <RangeBand low={0.3} high={1} max={2} section="ORD" size="mini" decorative />
          <Seg
            label="Antal frågor"
            options={[
              { value: 5, label: '5' },
              { value: 10, label: '10' },
              { value: 20, label: '20' },
            ]}
            value={10}
            onChange={() => {}}
          />
          <Stepper label="Stegen i fällan" steps={LESSON} current="steg-2" />
          <ChipRow as="nav" aria-label="På sidan">
            {JUMPS('Provet')}
          </ChipRow>
          <Keys>
            <Kbd>J</Kbd> <Kbd>K</Kbd> nästa och förra fällan
          </Keys>
          <Go href="#steg-2" kbd="↵" keyshortcuts="Enter">
            Avsluta fälla 1 · ca 1 min
          </Go>
        </Lit>
      </main>,
    )
    expect(container.querySelectorAll('[data-lit="true"]')).toHaveLength(1)
    expect(container.querySelectorAll('.fa-ui-go')).toHaveLength(1)
    const violations = await runAxe(container)
    expect(violations, formatViolations(violations)).toEqual([])
  })
})

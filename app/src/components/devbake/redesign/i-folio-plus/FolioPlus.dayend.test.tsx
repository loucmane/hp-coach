// Folio+ · round 3, the day's end and its re-entry (bead hpf-qr0p.48): the
// end card names the one useful next thing and lights it, never a nudge to
// stop; it says what tomorrow starts with only as far as the data knows; a
// shaded "Kort om tid? 5 minuter" under the Idag lead; the misses said as
// what is ready now, never a growing pile; and Repetera's rows keep the trap
// back until the facit.

import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { stubLayout } from '@/components/devbake/redesign/contract'
import { DirectionDataProvider, FIXTURE_DATA } from '@/components/devbake/redesign/directionData'
import type { DirectionProps } from '@/components/devbake/redesign/r1Kit'
import type { DirectionActions, DirectionData } from '@/components/devbake/redesign/viewModel'
import { FolioPlus as Folio } from './FolioPlus'
import { readyLine } from './FolioRepetera'

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

const press = (key: string) => fireEvent.keyDown(window, { key })

const shaded = (el: Element | null) => el?.closest('[data-fp-shade]') != null

/** The page's filled buttons: the lit action is the only one. */
const filled = () =>
  Array.from(screen.getByRole('main').querySelectorAll('.fp-btn')).filter(
    (b) => !b.closest('[hidden]'),
  )

/** Every step of the day done, nothing paused. */
function dayDone(): DirectionData {
  const data = structuredClone(FIXTURE_DATA)
  data.home.resume = null
  for (const item of data.home.plan.items) item.completed = true
  data.home.plan.allComplete = true
  return data
}

/** Nothing in Repetera at all. */
function emptyQueue(data: DirectionData): DirectionData {
  data.repetera = { ...data.repetera, dueNow: 0, pile: 0, items: [] }
  data.ova = { ...data.ova, repetera: { dueNow: 0, pile: 0 } }
  data.home.ovaDue = 0
  return data
}

beforeAll(stubLayout)

describe('Folio+ day end · the end card', () => {
  it.each([
    'desktop',
    'phone',
  ] as const)('lights the one useful next thing, the misses ready now, with ↵ (%s)', (width) => {
    const startDrill = vi.fn()
    mount(1, { data: dayDone(), actions: { startDrill }, width })
    const card = screen.getByRole('region', { name: 'Klart för idag' })
    expect(filled()).toHaveLength(1)
    const go = within(card).getByRole('button', { name: /^Repetera 8 missar · 9 min/ })
    expect(go).toHaveClass('fp-btn')
    expect(shaded(go)).toBe(false)
    fireEvent.click(go)
    expect(startDrill).toHaveBeenLastCalledWith({ kind: 'repetition' })
    press('Enter')
    expect(startDrill).toHaveBeenCalledTimes(2)
  })

  it('never nudges the student to stop: no rest, no break, no pause', () => {
    mount(1, { data: dayDone() })
    const card = screen.getByRole('region', { name: 'Klart för idag' })
    expect(card).not.toHaveTextContent(/vila|paus|rast|sluta|stäng/i)
    expect(within(card).queryByRole('button', { name: 'Till Öva' })).toBeNull()
    // What is done is still said, plainly.
    expect(card).toHaveTextContent('Alla tre stegen är gjorda.')
  })

  it('says honestly what tomorrow brings when it cannot name the first step', () => {
    mount(1, { data: dayDone() })
    const line = document.querySelector('[data-fp-tomorrow]')
    expect(line).toHaveTextContent('I morgon: dina missar från idag kommer tillbaka.')
    expect(line).not.toHaveTextContent(/börjar du med/)
  })

  it('names tomorrow’s first step when the queue says what comes back tomorrow', () => {
    const data = dayDone()
    const later = data.repetera.items.filter((i) => !i.dueNow)
    for (const item of later.slice(0, 3)) item.dueLabel = 'imorgon'
    mount(1, { data })
    expect(document.querySelector('[data-fp-tomorrow]')).toHaveTextContent(
      'I morgon börjar du med: Repetera 3 missar · 3 min',
    )
  })

  it('offers a drill in the weakest section when nothing is ready, and leaves tomorrow out', () => {
    const startDrill = vi.fn()
    mount(1, { data: emptyQueue(dayDone()), actions: { startDrill } })
    const card = screen.getByRole('region', { name: 'Klart för idag' })
    fireEvent.click(within(card).getByRole('button', { name: /^Öva XYZ/ }))
    expect(startDrill).toHaveBeenLastCalledWith({ kind: 'section', section: 'XYZ' })
    expect(card).toHaveTextContent('XYZ är din svagaste del just nu.')
    expect(document.querySelector('[data-fp-tomorrow]')).toBeNull()
  })

  it('falls back to Öva itself when the data suggests nothing', () => {
    const data = emptyQueue(dayDone())
    data.ova.weakest = null
    const go = vi.fn()
    mount(1, { data, actions: { go } })
    const card = screen.getByRole('region', { name: 'Klart för idag' })
    fireEvent.click(within(card).getByRole('button', { name: 'Till Öva' }))
    expect(go).toHaveBeenLastCalledWith('ova')
  })
})

describe('Folio+ day end · “Kort om tid? 5 minuter”', () => {
  it.each([
    'desktop',
    'phone',
  ] as const)('under the paused text: a shaded link to the shortest open part of the plan (%s)', (width) => {
    const openPlanItem = vi.fn()
    mount(1, { actions: { openPlanItem }, width })
    const link = screen.getByRole('button', { name: /^Kort om tid\? 5 minuter/ })
    expect(link).toHaveTextContent('ORD-övning, 10 frågor · 4 min')
    expect(link).not.toHaveClass('fp-btn')
    expect(shaded(link)).toBe(true)
    // The paused text keeps the page's one filled button.
    expect(filled()).toHaveLength(1)
    expect(filled()[0]).toHaveAttribute('data-testid', 'rd-resume')
    fireEvent.click(link)
    expect(openPlanItem).toHaveBeenLastCalledWith('ord')
  })

  it('cuts the repetition lead to one section’s ready misses', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.home.resume = null
    const startDrill = vi.fn()
    mount(1, { data, actions: { startDrill } })
    const link = screen.getByRole('button', { name: /^Kort om tid\? 5 minuter/ })
    expect(link).toHaveTextContent('repetera bara XYZ, 2 missar · 2 min')
    fireEvent.click(link)
    expect(startDrill).toHaveBeenLastCalledWith({ kind: 'repetition', section: 'XYZ' })
    expect(filled()).toHaveLength(1)
  })

  it('is left out when the lead already fits in five minutes, and on the end card', () => {
    const data = structuredClone(FIXTURE_DATA)
    if (data.home.resume) data.home.resume.minutesLeft = 4
    const first = mount(1, { data })
    expect(screen.queryByRole('button', { name: /Kort om tid/ })).toBeNull()
    first.unmount()
    mount(1, { data: dayDone() })
    expect(screen.queryByRole('button', { name: /Kort om tid/ })).toBeNull()
  })
})

describe('Folio+ day end · the misses as what is ready now', () => {
  it('says today’s misses as ready now and minutes, never the whole growing pile', () => {
    mount(1)
    const line = document.querySelector('[data-fp-misses]')
    expect(line).toHaveTextContent('↺ Lagd i Repetera: 8 redo · 9 min')
    expect(line).not.toHaveTextContent(/totalt|61|23/)
  })

  it('gives the nav its line from the same data', () => {
    expect(readyLine(FIXTURE_DATA)).toBe('8 redo · 9 min')
    expect(readyLine(emptyQueue(structuredClone(FIXTURE_DATA)))).toBeNull()
  })
})

describe('Folio+ day end · Repetera keeps the trap for the facit', () => {
  it('shows each miss by its section and stem only, the round still finite', () => {
    mount(8)
    for (const item of FIXTURE_DATA.repetera.items.filter((i) => i.dueNow)) {
      const row = screen.getByTestId(`rd-repetera-item-${item.n}`)
      expect(row).toHaveTextContent(item.section)
      expect(row).not.toHaveTextContent(/Fälla/)
      if (item.frameworkName) expect(row).not.toHaveTextContent(item.frameworkName)
    }
    expect(screen.getByTestId('rd-repetera-item-4')).toHaveTextContent('Vilket värde har x + y?')
    expect(screen.getByText(/Sedan är omgången klar\./)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Åtta missar' })).toBeInTheDocument()
  })
})

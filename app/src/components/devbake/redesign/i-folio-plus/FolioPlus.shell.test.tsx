// Folio+ · the shell's borrowings (bead hpf-qr0p.48): Spår's day path on
// Idag, Samtal's nav subtitles, icons on the phone tabs and the folded
// rail, and Konto's visible way back to where the reader came from.

import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { stubLayout } from '@/components/devbake/redesign/contract'
import { DirectionDataProvider, FIXTURE_DATA } from '@/components/devbake/redesign/directionData'
import { DESTINATIONS, type DirectionProps } from '@/components/devbake/redesign/r1Kit'
import type { DirectionActions, DirectionData } from '@/components/devbake/redesign/viewModel'
import { FolioPlus as Folio } from './FolioPlus'

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

const press = (key: string) => fireEvent.keyDown(window, { key })

/** The day path's steps, in order, by their state. */
function steps(): string[] {
  const path = screen.getByRole('list', { name: 'Dagens steg' })
  return within(path)
    .getAllByRole('listitem')
    .map((li) => li.getAttribute('data-fp-step') ?? '')
    .filter(Boolean)
}

beforeAll(stubLayout)

describe('Folio+ · Idag as a day path', () => {
  it.each([
    'desktop',
    'phone',
  ] as const)('sets the paused text as the current step and the plan as the steps to come (%s)', (width) => {
    mount(1, { width })
    expect(steps()).toEqual(['now', 'next', 'next', 'next'])
    const path = screen.getByRole('list', { name: 'Dagens steg' })
    const now = path.querySelector('[data-fp-step="now"]') as HTMLElement
    expect(now).toHaveTextContent(FIXTURE_DATA.home.resume?.title ?? '')
    // The current step points at the lead: the page keeps one action.
    expect(within(now).queryByRole('button')).toBeNull()
    expect(screen.getAllByTestId('rd-resume')).toHaveLength(1)
    expect(screen.queryByRole('region', { name: 'Klart för idag' })).toBeNull()
  })

  it('shows the steps done first, the current one, then the rest, each to come opening its item', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.home.resume = null
    data.home.plan.items[0].completed = true
    const openPlanItem = vi.fn()
    mount(1, { data, actions: { openPlanItem } })
    expect(steps()).toEqual(['done', 'now', 'next'])
    const path = screen.getByRole('list', { name: 'Dagens steg' })
    const done = path.querySelector('[data-fp-step="done"]') as HTMLElement
    expect(done).toHaveTextContent('Repetition')
    expect(done).toHaveTextContent('klar')
    expect(within(done).queryByRole('button')).toBeNull()
    const next = path.querySelector('[data-fp-step="next"]') as HTMLElement
    fireEvent.click(within(next).getByRole('button'))
    expect(openPlanItem).toHaveBeenLastCalledWith('ord')
    // The lead is the current step: the lesson, the page's one filled button.
    expect(screen.getByRole('heading', { level: 2, name: 'ELF-lektion' })).toBeInTheDocument()
  })

  it('ends with the card “Klart för idag” once every step is done', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.home.resume = null
    for (const item of data.home.plan.items) item.completed = true
    data.home.plan.allComplete = true
    const go = vi.fn()
    mount(1, { data, actions: { go } })
    expect(steps()).toEqual(['done', 'done', 'done'])
    const card = screen.getByRole('region', { name: 'Klart för idag' })
    expect(card).toHaveAttribute('data-fp-end')
    fireEvent.click(within(card).getByRole('button', { name: 'Till Öva' }))
    expect(go).toHaveBeenLastCalledWith('ova')
  })

  it('labels today’s misses “↺ Lagd i Repetera”, today’s pile apart from the whole queue', () => {
    mount(1)
    const line = document.querySelector('[data-fp-misses]')
    expect(line).toHaveTextContent('↺ Lagd i Repetera')
    expect(line).toHaveTextContent(`${FIXTURE_DATA.home.ovaDue} missar idag`)
    expect(line).toHaveTextContent(`${FIXTURE_DATA.framsteg.totals.mistakesActive} totalt`)
    expect(line).not.toHaveTextContent(/fel|misslyck|tyvärr|dålig/i)
  })
})

describe('Folio+ · nav subtitles', () => {
  it('gives each desktop entry a live line from the data, its name kept short', () => {
    mount(1)
    const sub = (id: string) => screen.getByTestId(`rd-nav-${id}`).querySelector('[data-fp-sub]')
    expect(sub('idag')).toHaveTextContent('Fortsätt LÄS, fråga 3 av 4')
    expect(sub('ova')).toHaveTextContent('23 missar att repetera idag')
    expect(sub('provpass')).toHaveTextContent('Nästa: kvant, om en dag')
    expect(sub('uppslag')).toHaveTextContent(FIXTURE_DATA.uppslag.open.title ?? '')
    expect(sub('framsteg')).toHaveTextContent('Prognos 1,4 av 2,0')
    const ova = screen.getByTestId('rd-nav-ova')
    expect(ova).toHaveAccessibleName('Öva')
    expect(ova).toHaveAccessibleDescription('23 missar att repetera idag')
  })

  it('leaves the subtitles off the phone and the folded rail', () => {
    const { unmount } = mount(1, { width: 'phone' })
    expect(document.querySelector('[data-fp-sub]')).toBeNull()
    unmount()
    mount(4)
    expect(document.querySelector('[data-fp-sub]')).toBeNull()
  })
})

describe('Folio+ · icons', () => {
  it('sets an icon above each phone tab’s word', () => {
    mount(1, { width: 'phone' })
    for (const d of DESTINATIONS) {
      const tab = screen.getByTestId(`rd-nav-${d.id}`)
      const icon = tab.querySelector('svg')
      expect(icon).not.toBeNull()
      expect(icon).toHaveAttribute('aria-hidden', 'true')
      expect(tab).toHaveTextContent(d.label)
      // The icon comes first: above the word.
      expect(tab.firstElementChild?.contains(icon as SVGElement)).toBe(true)
    }
  })

  it('shows icons on the folded rail, the full name as tooltip and accessible name', () => {
    mount(4)
    for (const d of DESTINATIONS) {
      const entry = screen.getByTestId(`rd-nav-${d.id}`)
      expect(entry.querySelector('svg')).not.toBeNull()
      expect(entry).toHaveAccessibleName(d.label)
      expect(entry).toHaveAttribute('data-tip', d.label)
      // No bare thumb-index letter.
      expect(entry.querySelector('.fp-thumb')?.textContent ?? '').toBe('')
    }
  })
})

describe('Folio+ · Konto’s way back', () => {
  const toKonto = () => {
    fireEvent.click(screen.getByTestId('rd-account'))
    fireEvent.click(
      within(screen.getByTestId('rd-account-menu')).getByRole('button', { name: /^Konto/ }),
    )
  }

  it.each([
    'desktop',
    'phone',
  ] as const)('offers “← Tillbaka till” the page the reader came from, and goes there (%s)', (width) => {
    const go = vi.fn()
    mount(1, { width, actions: { go } })
    fireEvent.click(screen.getByTestId('rd-nav-ova'))
    toKonto()
    const back = screen.getByRole('button', { name: 'Tillbaka till Öva' })
    expect(back).toHaveTextContent('← Tillbaka till Öva')
    fireEvent.click(back)
    expect(go).toHaveBeenLastCalledWith('ova')
    expect(screen.getByRole('heading', { level: 1, name: 'Vad tränar vi?' })).toBeInTheDocument()
  })

  it('names Framsteg from Framsteg, Idag on a direct visit, and keeps Esc', () => {
    const go = vi.fn()
    const { unmount } = mount(13, { actions: { go } })
    expect(screen.getByRole('button', { name: 'Tillbaka till Idag' })).toBeInTheDocument()
    unmount()
    mount(11, { actions: { go } })
    toKonto()
    expect(screen.getByRole('button', { name: 'Tillbaka till Framsteg' })).toBeInTheDocument()
    press('Escape')
    expect(go).toHaveBeenLastCalledWith('framsteg')
  })
})

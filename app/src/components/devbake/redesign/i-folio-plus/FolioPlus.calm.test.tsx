// Folio+ · round 2, Ljuskägla's ADHD qualities on the hub pages (bead
// hpf-qr0p.48): one lit thing per screen with the rest in the shade, a
// finite batch stated before entry, no urgency or loss framing, and on
// Framsteg what happened first, then one action, each chart said in words.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, screen, within } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

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

/** The page's own margin (the shell has an aside of its own). */
const margin = () => screen.getByRole('main').querySelector('.fp-aside')

const shaded = (el: Element | null) => el?.closest('[data-fp-shade]') != null

/** The page's filled buttons: the lit action is the only one. */
const filled = () =>
  Array.from(screen.getByRole('main').querySelectorAll('.fp-btn')).filter(
    (b) => !b.closest('[hidden]'),
  )

/** No debt, no alarm, no loss: the words a calm page never uses. */
const URGENT =
  /försen|förfall|överskrid|skuld|brådsk|snabbt nu|förlor|tappa|missa inte|serie|rekord|!/i

beforeAll(stubLayout)

describe('Folio+ calm · Idag', () => {
  it.each([
    'desktop',
    'phone',
  ] as const)('lights the lead only: Dagens steg and the margin sit in the shade (%s)', (width) => {
    mount(1, { width })
    expect(shaded(screen.getByTestId('rd-resume'))).toBe(false)
    const path = screen.getByRole('region', { name: 'Dagens steg' })
    expect(shaded(path)).toBe(true)
    expect(path.querySelector('[data-fp-step="now"]')).not.toBeNull()
    const margin = screen.getByRole('complementary', { name: 'Prognos' })
    expect(shaded(margin)).toBe(true)
    for (const name of ['Prognos', 'Din vanligaste fälla just nu', 'Senaste passen']) {
      expect(shaded(within(margin).getByRole('region', { name }))).toBe(true)
    }
    expect(filled()).toHaveLength(1)
  })

  it('keeps the plan’s lead lit and the steps after it shaded when nothing is paused', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.home.resume = null
    mount(1, { data })
    const lead = screen.getByRole('button', { name: /Börja · 9 min/ })
    expect(shaded(lead)).toBe(false)
    expect(shaded(screen.getByRole('region', { name: 'Dagens steg' }))).toBe(true)
  })

  it('keeps the end card, quieter, and the day path in the shade beneath it', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.home.resume = null
    for (const item of data.home.plan.items) item.completed = true
    mount(1, { data })
    const end = screen.getByRole('region', { name: 'Klart för idag' })
    expect(end).toHaveAttribute('data-fp-end')
    expect(end).toHaveAttribute('data-fp-quiet', 'true')
    expect(shaded(end)).toBe(false)
    expect(shaded(screen.getByRole('region', { name: 'Dagens steg' }))).toBe(true)
  })
})

describe('Folio+ calm · Öva', () => {
  const ORDER = ['ord', 'las', 'mek', 'elf', 'xyz', 'kva', 'nog', 'dtk'].map(
    (s) => `rd-ova-section-${s}`,
  )
  const rows = () =>
    Array.from(document.querySelectorAll('[data-testid^="rd-ova-section-"]')).map((el) =>
      el.getAttribute('data-testid'),
    )

  it('lights one suggested start above a shaded section list and margin', () => {
    mount(5)
    const lead = screen.getByRole('region', { name: /^Åtta missar, ungefär 9 minuter$/ })
    expect(shaded(lead)).toBe(false)
    expect(shaded(screen.getByRole('region', { name: 'Delproven' }))).toBe(true)
    expect(shaded(margin())).toBe(true)
    expect(filled()).toHaveLength(1)
    expect(within(lead).getAllByRole('button')[0]).toHaveClass('fp-btn')
  })

  it('keeps every row in its place, whichever section is suggested', () => {
    const first = mount(5)
    expect(rows()).toEqual(ORDER)
    first.unmount()
    const data = structuredClone(FIXTURE_DATA)
    data.ova.weakest = 'MEK'
    data.ova.repetera = { dueNow: 0, pile: 0 }
    mount(5, { data })
    expect(rows()).toEqual(ORDER)
  })

  it('says counts in plain words, explains them, and wears no badge', () => {
    mount(5)
    const list = screen.getByRole('region', { name: 'Delproven' })
    expect(list).not.toHaveTextContent(URGENT)
    expect(list.querySelector('[class*="badge"], [class*="bad"]')).toBeNull()
    expect(screen.getByTestId('rd-ova-section-xyz')).toHaveTextContent('5 missar väntar i Repetera')
    expect(
      screen.getByText(
        '”Väntar” är missar i dagens hög. ”Redo nu” är de som går att repetera just nu.',
      ),
    ).toBeInTheDocument()
  })

  it('states the round as count and minutes even when the plan has no repetition', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.home.plan.items = data.home.plan.items.filter((i) => i.kind !== 'repetition')
    mount(5, { data })
    expect(
      screen.getByRole('heading', { level: 2, name: /^Åtta missar, ungefär \d+ minuter$/ }),
    ).toBeInTheDocument()
  })
})

describe('Folio+ calm · Repetera', () => {
  it('states the finite batch before entry: how many, how long, and that it ends', () => {
    mount(8)
    const lead = screen.getByRole('region', { name: 'Åtta missar' })
    expect(lead).toHaveTextContent('ungefär 9 minuter')
    expect(lead).toHaveTextContent('Sedan är omgången klar.')
    expect(shaded(lead)).toBe(false)
    expect(filled()).toHaveLength(1)
  })

  it('says how many wait for another round when the queue is longer than one', () => {
    const data = structuredClone(FIXTURE_DATA)
    data.repetera.sessionSize = 5
    data.home.plan.items = data.home.plan.items.filter((i) => i.kind !== 'repetition')
    mount(8, { data })
    const lead = screen.getByRole('region', { name: '5 av 8 missar' })
    expect(lead).toHaveTextContent(/ungefär \d+ minuter/)
    expect(lead).toHaveTextContent('Sedan är omgången klar. Tre till väntar på nästa omgång.')
  })

  it('has no overdue or red counters and no loss framing; the lists sit in the shade', () => {
    const { container } = mount(8)
    expect(container).not.toHaveTextContent(URGENT)
    expect(container.querySelector('[class*="bad"]')).toBeNull()
    expect(shaded(screen.getByRole('region', { name: 'Kön per delprov' }))).toBe(true)
    expect(shaded(screen.getByRole('region', { name: 'Missarna' }))).toBe(true)
    expect(shaded(margin())).toBe(true)
  })
})

describe('Folio+ calm · Framsteg', () => {
  const TOP = FIXTURE_DATA.framsteg.focus[0]

  it('shows what happened first, then the one lit action, Nästa steg uppåt shaded below it', () => {
    mount(11)
    const report = screen.getByTestId('rd-framsteg-prognosis')
    const next = screen.getByTestId('fp-framsteg-next')
    expect(report.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(report).queryByRole('button', { name: new RegExp(`^Öva ${TOP}`) })).toBeNull()
    expect(within(next).getByRole('button', { name: new RegExp(`^Öva ${TOP}`) })).toHaveClass(
      'fp-btn',
    )
    expect(next).toHaveTextContent(`Mest att vinna: ${TOP} –`)
    expect(shaded(next)).toBe(false)
    expect(filled()).toHaveLength(1)
    const up = screen.getByRole('region', { name: 'Nästa steg uppåt' })
    expect(shaded(up)).toBe(true)
    // Directly below the action: nothing else between them.
    expect(next.nextElementSibling).toBe(up)
    for (const name of ['Poäng över tid', 'Delproven', 'Historik']) {
      expect(shaded(screen.getByRole('region', { name }))).toBe(true)
    }
    expect(shaded(margin())).toBe(true)
  })

  it('says a day without practice takes nothing away, and keeps no streak', () => {
    mount(11)
    const days = screen.getByTestId('rd-framsteg-week')
    expect(days).toHaveTextContent('En dag utan övning tar inte bort något du har byggt upp.')
    expect(screen.getByTestId('rd-folio-plus')).not.toHaveTextContent(/serie|rekord|i rad/i)
  })

  it('gives each chart a short text summary', () => {
    mount(11)
    expect(
      screen.getByText('Från 1,0 i vecka 31 till 1,4 i vecka 40 – upp 0,4.'),
    ).toBeInTheDocument()
    const days = screen.getByTestId('rd-framsteg-week')
    expect(
      within(days).getByText(/^(\d+|[A-ZÅÄÖ][a-zåäö]+) övningsdagar de senaste sex veckorna\.$/),
    ).toBeInTheDocument()
  })

  it('says a falling or flat curve as plainly', () => {
    const data = structuredClone(FIXTURE_DATA)
    const last = data.framsteg.weekly.length - 1
    data.framsteg.weekly[last].score = 1
    mount(11, { data })
    expect(
      screen.getByText('Från 1,0 i vecka 31 till 1,0 i vecka 40 – samma nivå.'),
    ).toBeInTheDocument()
  })
})

// ── The shade, as written ────────────────────────────────────────────

/** fpCalm.css as written (the test run loads no CSS). */
const calmCss = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'fpCalm.css'),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '')

describe('Folio+ calm · the shade in fpCalm.css', () => {
  it('quiets by colour, never by opacity, and only with ink tokens of full contrast', () => {
    expect(calmCss).not.toMatch(/opacity/)
    expect(calmCss).not.toMatch(/filter\s*:/)
    const colours = [...calmCss.matchAll(/(?:^|[\s;{])color:\s*([^;]+);/g)].map((m) => m[1].trim())
    expect(colours.length).toBeGreaterThan(0)
    for (const c of colours) {
      expect(c).toMatch(/^var\(--fp-(ink|ink-2|ink-3|accent-ink)\)$/)
    }
  })

  it('never shrinks the shaded text, and lights it again on hover and focus', () => {
    expect(calmCss).not.toMatch(/font-size/)
    expect(calmCss).toMatch(/:hover/)
    expect(calmCss).toMatch(/:focus-within/)
  })

  it('scopes every rule under the direction', () => {
    const selectors = [...calmCss.matchAll(/(?:^|[{}])\s*([^{}]+?)\s*\{/g)]
      .map((m) => m[1])
      .filter((s) => !s.startsWith('@'))
    expect(selectors.length).toBeGreaterThan(0)
    for (const sel of selectors) {
      for (const part of sel.split(/,(?![^(]*\))/)) {
        expect(part.trim()).toMatch(/^\[data-rd='folio-plus'\]/)
      }
    }
  })
})

describe('Folio+ · the shade leaves the prognosis scale its colour', () => {
  it('has no shade rule for the scale’s mark or range', () => {
    const css = readFileSync(
      path.join(process.cwd(), 'src/components/devbake/redesign/i-folio-plus/fpCalm.css'),
      'utf8',
    )
    expect(css).not.toMatch(/\[data-fp-shade\][^{]*\.fp-scale-(mark|range)/)
  })
})

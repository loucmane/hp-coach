// The redesign bake-off: the shared rd-* contract for round 1's four
// directions (contract.ts describeDirectionContract, on the screens each
// declares — today round 1's four), the switcher's buttons and keys over
// all fourteen screens, the registry's eight directions and their declared
// screens, and the stage: every key mounts its folder's stage on a screen
// it has built, the shared "Inte byggd än" card on every other screen at
// both widths and themes, and side by side, and its data context keeps one
// theme with the switcher. Directions E–H run the same contract from their
// own tests as they adopt it.

import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { Folio } from '@/components/devbake/redesign/a-folio/Folio'
import { meta as folioMeta } from '@/components/devbake/redesign/a-folio/meta'
import { Instrument } from '@/components/devbake/redesign/b-instrument/Instrument'
import { meta as instrumentMeta } from '@/components/devbake/redesign/b-instrument/meta'
import { meta as sparMeta } from '@/components/devbake/redesign/c-spar/meta'
import { Spar } from '@/components/devbake/redesign/c-spar/Spar'
import { describeDirectionContract, stubLayout } from '@/components/devbake/redesign/contract'
import { Lager } from '@/components/devbake/redesign/d-lager/Lager'
import { meta as lagerMeta } from '@/components/devbake/redesign/d-lager/meta'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  builds,
  DEFAULT_SCREENS,
  DIRECTIONS,
  STAGES,
  screensOf,
} from '@/components/devbake/redesign/directions'
import {
  Redesign2026Bakeoff,
  type Selection,
} from '@/components/devbake/redesign/Redesign2026Bakeoff'
import {
  APP_SCREENS,
  type DirectionMeta,
  type DirectionProps,
  DIRECTIONS as KIT_DIRECTIONS,
  SCREENS,
  THEMES,
  WIDTHS as WIDTH_OPTIONS,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'

beforeAll(stubLayout)

const WIDTHS: WidthKey[] = ['desktop', 'phone']

describeDirectionContract(folioMeta, Folio)
describeDirectionContract(instrumentMeta, Instrument)
describeDirectionContract(sparMeta, Spar)
describeDirectionContract(lagerMeta, Lager)

describe('bake-off switcher', () => {
  const base: Selection = { d: 'a', s: 1, w: 'desktop', t: 'light', sbs: false, bare: false }

  it('picks direction, screen, width, theme and side by side from the bar', () => {
    const onSelect = vi.fn()
    render(<Redesign2026Bakeoff sel={base} onSelect={onSelect} />)
    fireEvent.click(screen.getByTestId('rb26-direction-c'))
    expect(onSelect).toHaveBeenLastCalledWith({ d: 'c', sbs: false })
    fireEvent.click(screen.getByTestId('rb26-screen-3'))
    expect(onSelect).toHaveBeenLastCalledWith({ s: 3 })
    fireEvent.click(screen.getByTestId('rb26-screen-12'))
    expect(onSelect).toHaveBeenLastCalledWith({ s: 12 })
    fireEvent.click(screen.getByTestId('rb26-width-phone'))
    expect(onSelect).toHaveBeenLastCalledWith({ w: 'phone' })
    fireEvent.click(screen.getByTestId('rb26-theme-dark'))
    expect(onSelect).toHaveBeenLastCalledWith({ t: 'dark' })
    fireEvent.click(screen.getByTestId('rb26-sbs'))
    expect(onSelect).toHaveBeenLastCalledWith({ sbs: true })
  })

  it('offers the fourteen screens in order, in two rounds, the picked one pressed', () => {
    render(<Redesign2026Bakeoff sel={{ ...base, s: 9 }} onSelect={() => {}} />)
    const bar = screen.getByTestId('rb26-screen')
    const buttons = within(bar).getAllByRole('button')
    expect(buttons.map((b) => b.dataset.testid)).toEqual(
      APP_SCREENS.map((s) => `rb26-screen-${s.key}`),
    )
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(
      APP_SCREENS.map((s) => String(s.key === 9)),
    )
    const rounds = bar.querySelectorAll('[data-round]')
    expect([...rounds].map((r) => r.querySelectorAll('button').length)).toEqual([4, 10])
    expect(within(bar).getByTestId('rb26-screen-13')).toHaveTextContent('13Konto')
  })

  it('answers 1–8, ←/→ across all fourteen screens and 0 on the keyboard', () => {
    const onSelect = vi.fn()
    const { rerender } = render(<Redesign2026Bakeoff sel={{ ...base, s: 4 }} onSelect={onSelect} />)
    fireEvent.keyDown(window, { key: '2' })
    expect(onSelect).toHaveBeenLastCalledWith({ d: 'b', sbs: false })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenLastCalledWith({ s: 5 })
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(onSelect).toHaveBeenLastCalledWith({ s: 3 })
    rerender(<Redesign2026Bakeoff sel={{ ...base, s: 14 }} onSelect={onSelect} />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenLastCalledWith({ s: 1 })
    rerender(<Redesign2026Bakeoff sel={{ ...base, s: 1 }} onSelect={onSelect} />)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(onSelect).toHaveBeenLastCalledWith({ s: 14 })
    fireEvent.keyDown(window, { key: '0' })
    expect(onSelect).toHaveBeenLastCalledWith({ sbs: true })
  })

  it('steps the screens with the bar’s arrows too', () => {
    const onSelect = vi.fn()
    render(<Redesign2026Bakeoff sel={{ ...base, s: 14 }} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Nästa skärm' }))
    expect(onSelect).toHaveBeenLastCalledWith({ s: 1 })
    fireEvent.click(screen.getByRole('button', { name: 'Föregående skärm' }))
    expect(onSelect).toHaveBeenLastCalledWith({ s: 13 })
  })

  it('hides the bar with bare=1 and shows the thumbnails side by side', () => {
    const { rerender } = render(
      <Redesign2026Bakeoff sel={{ ...base, bare: true }} onSelect={() => {}} />,
    )
    expect(screen.queryByTestId('rb26-bar')).toBeNull()
    rerender(<Redesign2026Bakeoff sel={{ ...base, sbs: true }} onSelect={() => {}} />)
    expect(screen.getByTestId('rb26-sbs-grid')).toBeInTheDocument()
    expect(screen.getByTestId('rb26-sbs')).toHaveAttribute('aria-pressed', 'true')
  })

  it('offers all eight directions on the bar and answers 1–8 in that order', () => {
    const onSelect = vi.fn()
    render(<Redesign2026Bakeoff sel={base} onSelect={onSelect} />)
    const items = within(screen.getByTestId('rb26-direction')).getAllByRole('button')
    expect(items.map((b) => b.dataset.testid)).toEqual(
      DIRECTIONS.map((d) => `rb26-direction-${d.key}`),
    )
    DIRECTIONS.forEach((d, i) => {
      expect(items[i]).toHaveTextContent(`${i + 1}${d.name}`)
      fireEvent.keyDown(window, { key: String(i + 1) })
      expect(onSelect).toHaveBeenLastCalledWith({ d: d.key, sbs: false })
    })
    fireEvent.click(screen.getByTestId('rb26-direction-h'))
    expect(onSelect).toHaveBeenLastCalledWith({ d: 'h', sbs: false })
    onSelect.mockClear()
    fireEvent.keyDown(window, { key: '9' })
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('lists every direction and the 1–8 keys in the side-by-side "Om" panel', () => {
    render(<Redesign2026Bakeoff sel={{ ...base, sbs: true }} onSelect={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Om riktningarna' }))
    const info = screen.getByTestId('rb26-info')
    expect(within(info).getAllByRole('heading', { level: 2 })).toHaveLength(DIRECTIONS.length)
    expect(info).toHaveTextContent('Tangenter: 1–8 riktning')
  })

  it('says in the "Om" panel which directions have built the screen', () => {
    const { rerender } = render(<Redesign2026Bakeoff sel={base} onSelect={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: `Om ${DIRECTIONS[0].name}` }))
    expect(screen.getByTestId('rb26-info-built')).toHaveTextContent(
      `Byggd i ${DIRECTIONS.map((d) => d.name).join(', ')}.`,
    )
    // Round-2 batches add screens one direction at a time, so the expected
    // list comes from the registry rather than a fixed snapshot.
    rerender(<Redesign2026Bakeoff sel={{ ...base, s: 7 }} onSelect={() => {}} />)
    expect(screen.getByTestId('rb26-info')).toHaveTextContent('Skärm 7 · DTK')
    const dtkBuilders = DIRECTIONS.filter((d) => builds(d, 7))
    expect(screen.getByTestId('rb26-info-built')).toHaveTextContent(
      dtkBuilders.length === 0
        ? 'Ingen riktning har byggt den här skärmen än.'
        : `Byggd i ${dtkBuilders.map((d) => d.name).join(', ')}.`,
    )
    const unbuilt = APP_SCREENS.find((s) => !DIRECTIONS.some((d) => builds(d, s.key)))
    if (unbuilt) {
      rerender(<Redesign2026Bakeoff sel={{ ...base, s: unbuilt.key }} onSelect={() => {}} />)
      expect(screen.getByTestId('rb26-info-built')).toHaveTextContent(
        'Ingen riktning har byggt den här skärmen än.',
      )
    }
  })
})

describe('direction registry', () => {
  it('registers eight directions a–h with unique keys, slugs and names, each with a stage', () => {
    const keys = DIRECTIONS.map((d) => d.key)
    expect(keys).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])
    expect(new Set(keys).size).toBe(8)
    expect(DIRECTIONS.map((d) => d.slug)).toEqual([
      'a-folio',
      'b-instrument',
      'c-spar',
      'd-lager',
      'e-svep',
      'f-samtal',
      'g-raster',
      'h-ljuskagla',
    ])
    expect(new Set(DIRECTIONS.map((d) => d.slug)).size).toBe(8)
    expect(new Set(DIRECTIONS.map((d) => d.name)).size).toBe(8)
    for (const d of DIRECTIONS) {
      expect(d.tagline).not.toBe('')
      expect(d.traits.length).toBeGreaterThan(0)
    }
    expect(Object.keys(STAGES)).toEqual(keys)
    // The kit's older export is the registry's list, not a copy.
    expect(KIT_DIRECTIONS).toBe(DIRECTIONS)
  })

  it('keeps round 1 built: only E–H may still be stubs', () => {
    for (const d of DIRECTIONS.slice(0, 4)) expect(d.stub).toBeUndefined()
  })

  it('gives a direction round 1’s four screens until its meta declares more', () => {
    expect(DEFAULT_SCREENS).toEqual(SCREENS.map((s) => s.key))
    for (const d of DIRECTIONS) {
      expect(screensOf(d)).toEqual(d.screens ?? [1, 2, 3, 4])
      for (const s of screensOf(d)) expect(APP_SCREENS.map((x) => x.key)).toContain(s)
    }
    const declared: DirectionMeta = { ...DIRECTIONS[0], screens: [1, 2, 3, 4, 5, 11] }
    expect(screensOf(declared)).toEqual([1, 2, 3, 4, 5, 11])
    expect(builds(declared, 11)).toBe(true)
    expect(builds(declared, 12)).toBe(false)
  })

  it('names the fourteen screens with Swedish labels and blurbs, round 1 first', () => {
    expect(APP_SCREENS.map((s) => s.key)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])
    expect(APP_SCREENS.map((s) => s.label)).toEqual([
      'Idag',
      'Läsfråga',
      'Facit',
      'Navigering',
      'Öva',
      'Kvantfråga',
      'DTK',
      'Repetera',
      'Provpass',
      'Provpassresultat',
      'Framsteg',
      'Uppslag & lektion',
      'Konto & inställningar',
      'ELF-läsfråga',
    ])
    // Round 1's four are SCREENS, unchanged.
    expect(APP_SCREENS.slice(0, 4).map(({ key, label, blurb }) => ({ key, label, blurb }))).toEqual(
      SCREENS,
    )
    for (const s of APP_SCREENS) {
      expect(s.round).toBe(s.key <= 4 ? 1 : 2)
      expect(s.blurb.length).toBeGreaterThan(60)
      expect(s.short.length).toBeLessThanOrEqual(s.label.length)
    }
  })
})

describe('bake-off stage', () => {
  const base: Selection = { d: 'a', s: 1, w: 'desktop', t: 'light', sbs: false, bare: false }
  const stageRoot = (d: DirectionMeta) => `rd-${d.slug.slice(2)}`
  const lazyWait = { timeout: 5000 }
  // A direction and a screen it has not built yet, from the registry, so
  // these tests keep working as round-2 batches add screens.
  const unbuilt = () => {
    for (const d of DIRECTIONS) {
      const s = APP_SCREENS.find((x) => !builds(d, x.key))
      if (s) return { d, s: s.key }
    }
    return null
  }
  const ROUND_2 = APP_SCREENS.filter((s) => s.round === 2)

  // jsdom has no layout: give every box the room under the bar of a
  // 1440 × 900 window, so the stage mounts its directions.
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(1440)
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(848)
  })
  afterEach(() => vi.restoreAllMocks())

  it.each(DIRECTIONS)('?d=$key mounts the $name stage from its folder', async (d) => {
    render(<Redesign2026Bakeoff sel={{ ...base, d: d.key }} onSelect={() => {}} />)
    const stage = screen.getByTestId('rb26-stage')
    expect(stage).toHaveAttribute('data-direction', d.key)
    expect(stage).toHaveAttribute('data-built', 'true')
    expect(await within(stage).findByTestId(stageRoot(d), {}, lazyWait)).toBeInTheDocument()
  })

  it.each(WIDTHS)('a stub shows "Under arbete" on every screen it declares (%s)', async (w) => {
    const width = WIDTH_OPTIONS.find((o) => o.key === w)?.label
    for (const d of DIRECTIONS.filter((x) => x.stub)) {
      const sel = { ...base, d: d.key, w }
      const { rerender, unmount } = render(<Redesign2026Bakeoff sel={sel} onSelect={() => {}} />)
      const card = await screen.findByTestId('rd-stub', {}, lazyWait)
      expect(card).toHaveTextContent('Under arbete')
      expect(card).toHaveTextContent(d.name)
      expect(card).toHaveTextContent(d.tagline)
      for (const s of APP_SCREENS.filter((x) => builds(d, x.key))) {
        for (const t of THEMES) {
          rerender(<Redesign2026Bakeoff sel={{ ...sel, s: s.key, t: t.key }} onSelect={() => {}} />)
          expect(screen.getByTestId(stageRoot(d))).toHaveAttribute('data-theme', t.key)
          expect(screen.getByTestId('rd-stub-where')).toHaveTextContent(
            `Skärm ${s.key} · ${s.label} · ${width} · ${t.label}`,
          )
        }
      }
      unmount()
    }
  })

  it.each(
    WIDTHS,
  )('shows "Inte byggd än" on every screen a direction has not built, both themes (%s)', (w) => {
    const width = WIDTH_OPTIONS.find((o) => o.key === w)?.label
    for (const d of DIRECTIONS) {
      const sel = { ...base, d: d.key, w }
      const { rerender, unmount } = render(
        <Redesign2026Bakeoff sel={{ ...sel, s: ROUND_2[0].key }} onSelect={() => {}} />,
      )
      for (const s of ROUND_2.filter((x) => !builds(d, x.key))) {
        for (const t of THEMES) {
          rerender(<Redesign2026Bakeoff sel={{ ...sel, s: s.key, t: t.key }} onSelect={() => {}} />)
          const stage = screen.getByTestId('rb26-stage')
          expect(stage).toHaveAttribute('data-screen', String(s.key))
          expect(stage).toHaveAttribute('data-built', 'false')
          const card = within(stage).getByTestId('rd-not-built')
          expect(card).toHaveTextContent(`Inte byggd än i ${d.name}.`)
          expect(within(card).getByRole('heading', { level: 1 })).toHaveTextContent(s.label)
          expect(card).toHaveTextContent(s.blurb)
          expect(within(stage).getByTestId('rd-not-built-stage')).toHaveAttribute(
            'data-theme',
            t.key,
          )
          expect(within(stage).getByTestId('rd-stub-where')).toHaveTextContent(
            `Skärm ${s.key} · ${s.label} · ${width} · ${t.label}`,
          )
          // The direction itself is not mounted on a screen it lacks.
          expect(within(stage).queryByTestId(stageRoot(d))).toBeNull()
        }
      }
      unmount()
    }
  })

  it('takes a step from "Inte byggd än" to a screen the direction has built', () => {
    const pair = unbuilt()
    if (!pair) return // every direction builds every screen: no card to step from
    const onSelect = vi.fn()
    render(<Redesign2026Bakeoff sel={{ ...base, d: pair.d.key, s: pair.s }} onSelect={onSelect} />)
    const card = screen.getByTestId('rd-not-built')
    const built = within(card).getAllByRole('button')
    expect(built.map((b) => b.dataset.testid)).toEqual(
      screensOf(pair.d).map((s) => `rd-not-built-go-${s}`),
    )
    fireEvent.click(within(card).getByTestId('rd-not-built-go-2'))
    expect(onSelect).toHaveBeenLastCalledWith({ s: 2 })
  })

  it('remounts a direction fresh when it comes back from a screen it lacks', async () => {
    const pair = unbuilt()
    if (!pair) return // every direction builds every screen: nothing to leave
    const at = (s: Selection['s']) => ({ ...base, d: pair.d.key, s })
    const root = stageRoot(pair.d)
    const { rerender } = render(<Redesign2026Bakeoff sel={at(2)} onSelect={() => {}} />)
    const stage = screen.getByTestId('rb26-stage')
    expect(await within(stage).findByTestId(root, {}, lazyWait)).toBeInTheDocument()
    rerender(<Redesign2026Bakeoff sel={at(pair.s)} onSelect={() => {}} />)
    expect(within(stage).queryByTestId(root)).toBeNull()
    expect(within(stage).getByTestId('rd-not-built')).toBeInTheDocument()
    rerender(<Redesign2026Bakeoff sel={at(2)} onSelect={() => {}} />)
    expect(await within(stage).findByTestId(root, {}, lazyWait)).toBeInTheDocument()
  })

  it.each(WIDTHS)('side by side shows all eight directions, two rows of four (%s)', async (w) => {
    const onSelect = vi.fn()
    render(<Redesign2026Bakeoff sel={{ ...base, w, sbs: true }} onSelect={onSelect} />)
    const grid = screen.getByTestId('rb26-sbs-grid')
    expect(grid.style.getPropertyValue('--rb26-cols')).toBe('4')
    const thumbs = within(grid).getAllByTestId(/^rb26-thumb-[a-z]$/)
    expect(thumbs.map((f) => f.dataset.testid)).toEqual(
      DIRECTIONS.map((d) => `rb26-thumb-${d.key}`),
    )
    for (const [i, d] of DIRECTIONS.entries()) {
      expect(await within(thumbs[i]).findByTestId(stageRoot(d), {}, lazyWait)).toBeInTheDocument()
    }
    fireEvent.click(screen.getByRole('button', { name: 'Öppna Ljuskägla i full storlek' }))
    expect(onSelect).toHaveBeenLastCalledWith({ d: 'h', sbs: false })
  })

  it.each(WIDTHS)('side by side works on a round-2 screen: card or stage (%s)', async (w) => {
    render(<Redesign2026Bakeoff sel={{ ...base, w, s: 11, sbs: true }} onSelect={() => {}} />)
    const grid = screen.getByTestId('rb26-sbs-grid')
    expect(grid).toHaveAttribute('data-screen', '11')
    const thumbs = within(grid).getAllByTestId(/^rb26-thumb-[a-z]$/)
    expect(thumbs).toHaveLength(DIRECTIONS.length)
    // Round-2 batches build screen 11 one direction at a time: the registry
    // says which thumbnails show the direction and which the calm card.
    for (const [i, d] of DIRECTIONS.entries()) {
      if (builds(d, 11)) {
        expect(await within(thumbs[i]).findByTestId(stageRoot(d), {}, lazyWait)).toBeInTheDocument()
        expect(within(thumbs[i]).queryByTestId('rd-not-built')).toBeNull()
      } else {
        const card = within(thumbs[i]).getByTestId('rd-not-built')
        expect(card).toHaveTextContent(`Inte byggd än i ${d.name}.`)
        expect(card).toHaveTextContent('Framsteg')
      }
    }
  })

  it('keeps one theme: prefs.mode is the switcher’s t from ?t= on, however it changes', () => {
    // A probe in Folio's place on screen 4 (Folio builds it) reads the
    // stage's data context and themes by each path a screen may take.
    function Probe({ theme, onTheme }: DirectionProps) {
      const { data, actions } = useDirectionData()
      const other = theme === 'dark' ? 'light' : 'dark'
      return (
        <div data-testid="probe" data-theme={theme} data-mode={data.konto.prefs.mode}>
          <button
            type="button"
            data-testid="probe-set-theme"
            onClick={() => actions.setTheme(other)}
          />
          <button
            type="button"
            data-testid="probe-set-prefs"
            onClick={() => actions.setPrefs({ mode: other })}
          />
          <button type="button" data-testid="probe-on-theme" onClick={() => onTheme(other)} />
        </div>
      )
    }
    /** The route: the selection is the URL's, onSelect merges into it. */
    function Page({ initial }: { initial: Selection }) {
      const [sel, setSel] = useState(initial)
      return (
        <Redesign2026Bakeoff sel={sel} onSelect={(next) => setSel((s) => ({ ...s, ...next }))} />
      )
    }
    const folio = STAGES.a
    STAGES.a = Probe
    try {
      render(<Page initial={{ ...base, s: 4, t: 'dark' }} />)
      /** The page's theme, the one the stage hands the direction, and the
       *  mode in its data context. */
      const shown = () => {
        const probe = screen.getByTestId('probe')
        return [screen.getByTestId('rb26').dataset.theme, probe.dataset.theme, probe.dataset.mode]
      }
      expect(shown()).toEqual(['dark', 'dark', 'dark'])
      fireEvent.click(screen.getByTestId('rb26-theme-light'))
      expect(shown()).toEqual(['light', 'light', 'light'])
      // setPrefs then setTheme, onTheme, setTheme then setPrefs: each flips
      // all three together.
      let now = 'light'
      for (const path of ['set-prefs', 'set-theme', 'on-theme', 'set-theme', 'set-prefs']) {
        fireEvent.click(screen.getByTestId(`probe-${path}`))
        now = now === 'dark' ? 'light' : 'dark'
        expect(shown()).toEqual([now, now, now])
      }
    } finally {
      STAGES.a = folio
    }
  })
})

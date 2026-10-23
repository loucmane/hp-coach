import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fireEvent, render, screen, within } from '@testing-library/react'
import axe from 'axe-core'
import { type ComponentType, createElement, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PALETTES, QUESTIONS, ROOT, STEPS } from '@/components/devbake/welcome/welcomeFixtures'
import type { Question } from '@/data/questions'
import { daysUntil, EXAM_SITTINGS } from '@/lib/dates'
import { FIRST_SESSION_QIDS } from '@/lib/firstSession'
import { Route, validateSearch } from './dev_.welcome-bakeoff'

const routing = vi.hoisted(() => ({ search: {} as Record<string, unknown>, navigate: vi.fn() }))
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({
    options,
    fullPath: '/dev/welcome-bakeoff',
    useSearch: () => routing.search,
  }),
  useNavigate: () => routing.navigate,
}))
vi.mock('@/lib/motion', () => ({ useFirstContentSignal: vi.fn() }))

const HERE = path.dirname(fileURLToPath(import.meta.url))
const APP = path.resolve(HERE, '../..')

function mount(initial: Record<string, unknown> = {}) {
  function Host() {
    const [search, setSearch] = useState(initial)
    routing.search = search
    routing.navigate.mockImplementation(({ search: update }) => setSearch(update))
    return createElement(Route.options.component as ComponentType)
  }
  return render(createElement(Host))
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-23T12:00:00Z'))
  vi.stubEnv('DEV', false)
  sessionStorage.clear()
  window.history.replaceState({}, '', '/dev/welcome-bakeoff?dev=1')
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describe('/dev/welcome-bakeoff', () => {
  it('gates the page and honors the same sticky dev opt-in as other bake-offs', async () => {
    window.history.replaceState({}, '', '/dev/welcome-bakeoff')
    const view = mount()
    expect(screen.getByText('dev-yta — lägg till ?dev=1')).toBeInTheDocument()
    expect(screen.queryByTestId('welcome-bakeoff')).not.toBeInTheDocument()
    sessionStorage.setItem('hpc-dev-mode', '1')
    view.rerender(createElement(Route.options.component as ComponentType))
    expect(await screen.findByTestId('welcome-bakeoff')).toBeInTheDocument()
  })

  it('validates shareable direction, step, frame, theme and palette selections', () => {
    expect(validateSearch({ d: 'c', s: '6', w: 'phone', t: 'dark', p: 'sage', sbs: '1' })).toEqual({
      d: 'c',
      s: 6,
      w: 'phone',
      t: 'dark',
      p: 'sage',
      sbs: true,
    })
    expect(validateSearch({ d: 'd', s: 7, w: 'wide', t: 'pink', p: 'green', sbs: '0' })).toEqual({})
  })

  it.each(
    ['a', 'b', 'c'].flatMap((d) =>
      ['desktop', 'phone'].flatMap((w) => ['light', 'dark'].map((t) => ({ d, w, t }))),
    ),
  )('renders every step in $d, $w, $t', async ({ d, w, t }) => {
    mount({ d, w, t })
    const stage = await screen.findByTestId(`welcome-${d}`)
    expect(stage).toHaveAttribute('data-width', w)
    expect(stage).toHaveAttribute('data-theme', t)
    const steps = within(screen.getByRole('group', { name: 'Steg' }))
    for (const step of STEPS) {
      fireEvent.click(steps.getByRole('button', { name: step.label }))
      expect(stage).toHaveAttribute('data-step', String(step.key))
      expect(within(stage).getByRole('heading', { level: 2 })).toBeInTheDocument()
    }
    expect(
      within(stage).getByText('Du klarade 3 av 3 frågor från riktiga högskoleprov'),
    ).toBeInTheDocument()
    expect(
      within(stage).getByText(
        'Frågorna kom från högskoleprovet hösten 2016, hösten 2021 och hösten 2025.',
      ),
    ).toBeInTheDocument()
    expect(within(stage).getByRole('button', { name: 'Till Idag' })).toBeInTheDocument()
    expect(stage.textContent).not.toMatch(/klart för idag|räcker|förlor|skam|⌘/i)
  })

  it.each([
    'a',
    'b',
    'c',
  ])('can complete the real three questions in %s without saving account data', async (d) => {
    const before = localStorage.getItem('hpc-ui')
    mount({ d, s: 1 })
    const stage = within(await screen.findByTestId(`welcome-${d}`))
    expect(stage.getByText(/Du kan ändra dem under Konto när som helst/)).toBeInTheDocument()
    fireEvent.click(stage.getByRole('button', { name: 'Fortsätt →' }))
    expect(stage.getByRole('heading', { name: 'Vilket prov siktar du på?' })).toBeInTheDocument()
    fireEvent.click(stage.getByRole('button', { name: 'Fortsätt →' }))
    fireEvent.click(stage.getByRole('button', { name: '30 minuter' }))
    expect(stage.getByText(/Ditt val sparas och går att ändra under Konto/)).toBeInTheDocument()
    fireEvent.click(stage.getByRole('button', { name: 'Fortsätt →' }))
    expect(
      stage.getByText(
        'Det här första passet är till för att prova. Det påverkar inte din prognos.',
      ),
    ).toBeInTheDocument()
    fireEvent.click(stage.getByRole('button', { name: 'Prova tre frågor →' }))
    for (const [i, question] of QUESTIONS.entries()) {
      expect(stage.getByText(question.prompt!)).toBeInTheDocument()
      // A mixed run must use the score-free done line.
      const pick = i === 0 ? 'A' : question.answer
      fireEvent.click(stage.getByRole('button', { name: new RegExp(`^${pick} `) }))
      fireEvent.click(stage.getByRole('button', { name: 'Visa svar' }))
      expect(stage.getByRole('status')).toHaveTextContent('Rätt svar')
      fireEvent.click(
        stage.getByRole('button', { name: i === 2 ? 'Se din start →' : 'Nästa fråga →' }),
      )
    }
    expect(
      stage.getByText('Du har gjort dina första 3 frågor från riktiga högskoleprov'),
    ).toBeInTheDocument()
    expect(stage.queryByText(/2 av 3|Fel\./)).not.toBeInTheDocument()
    fireEvent.click(stage.getByRole('button', { name: 'Till Idag' }))
    expect(stage.getByRole('heading', { name: 'Välkommen, Kim.' })).toBeInTheDocument()
    expect(localStorage.getItem('hpc-ui')).toBe(before)
  })

  it('synchronizes side-by-side steps, palettes and themes and only Fokus has swatches', async () => {
    mount({ sbs: true, w: 'phone' })
    await screen.findByTestId('welcome-c')
    const controls = within(screen.getByTestId('welcome-controls'))
    fireEvent.click(controls.getByRole('button', { name: 'Mörkt' }))
    for (const palette of PALETTES) {
      fireEvent.click(controls.getByRole('button', { name: palette.label }))
      for (const d of ['a', 'b', 'c']) {
        expect(screen.getByTestId(`welcome-${d}`)).toHaveAttribute('data-palette', palette.key)
        expect(screen.getByTestId(`welcome-${d}`)).toHaveAttribute('data-theme', 'dark')
        expect(screen.getByTestId(`welcome-${d}`)).toHaveAttribute('data-width', 'phone')
      }
    }
    expect(screen.getByTestId('welcome-a').querySelectorAll('.wb-swatch')).toHaveLength(0)
    expect(screen.getByTestId('welcome-b').querySelectorAll('.wb-swatch')).toHaveLength(5)
    expect(screen.getByTestId('welcome-c').querySelectorAll('.wb-swatch')).toHaveLength(0)
    fireEvent.click(within(screen.getByTestId('welcome-b')).getByRole('button', { name: 'Ordet' }))
    for (const d of ['a', 'b', 'c'])
      expect(screen.getByTestId(`welcome-${d}`)).toHaveAttribute('data-step', '4')
  })

  it('previews the real upcoming sitting and retains choices after going back', async () => {
    mount({ d: 'c', s: 2 })
    const stage = within(await screen.findByTestId('welcome-c'))
    const upcoming = EXAM_SITTINGS.filter((s) => daysUntil(s.date) >= 0)
    expect(stage.queryByRole('button', { name: /Höstprov 26/ })).not.toBeInTheDocument()
    for (const sitting of upcoming) {
      fireEvent.click(stage.getByRole('button', { name: new RegExp(sitting.label) }))
      expect(stage.getByRole('region', { name: 'Ditt prov' })).toHaveTextContent(
        `${daysUntil(sitting.date)} dagar · ${sitting.label.toLocaleLowerCase('sv-SE')}`,
      )
    }
    fireEvent.click(stage.getByRole('button', { name: 'Fortsätt →' }))
    fireEvent.click(stage.getByRole('button', { name: '45 minuter' }))
    expect(stage.getByRole('region', { name: 'Ditt tidsval' })).toHaveTextContent('45 minuter')
    fireEvent.click(stage.getByRole('button', { name: '← Tillbaka' }))
    expect(stage.getByRole('button', { name: /Höstprov 27/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(stage.getByRole('button', { name: 'Fortsätt →' }))
    expect(stage.getByRole('button', { name: '45 minuter' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('keeps the flow usable once the published sitting calendar runs out', async () => {
    vi.setSystemTime(new Date('2028-01-01T12:00:00Z'))
    mount({ d: 'a', s: 2 })
    const stage = within(await screen.findByTestId('welcome-a'))
    expect(stage.getByText(/Nästa provdatum är inte publicerat/)).toBeInTheDocument()
    fireEvent.click(stage.getByRole('button', { name: 'Fortsätt →' }))
    expect(stage.getByRole('heading', { name: 'Hur mycket tid passar dig?' })).toBeInTheDocument()
  })

  it.each(['a', 'b', 'c'])('passes axe on the theme step in direction %s', async (d) => {
    const { container } = mount({ d })
    await screen.findByTestId(`welcome-${d}`)
    expect(
      (await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })).violations,
    ).toEqual([])
  })

  it('uses the authentic root and all three authentic first-session questions', () => {
    const rootFile = JSON.parse(
      readFileSync(path.join(APP, 'public/frameworks/ord_roots.json'), 'utf8'),
    )
    expect(rootFile.entries.find((r: { id: string }) => r.id === ROOT.id)).toMatchObject(ROOT)
    expect(QUESTIONS.map((q) => q.qid)).toEqual(FIRST_SESSION_QIDS)
    for (const question of QUESTIONS) {
      const bank = JSON.parse(
        readFileSync(path.join(APP, `public/data/${question.exam_id}.json`), 'utf8'),
      ) as Question[]
      expect(bank.find((q) => q.qid === question.qid)).toEqual(question)
    }
  })

  it('keeps welcome devbake out of production imports and behind a lazy route boundary', () => {
    function files(dir: string): string[] {
      return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
      )
    }
    const production = [...files(HERE), ...files(path.join(APP, 'src/folio'))].filter(
      (file) =>
        /\.tsx?$/.test(file) &&
        !file.includes('.test.') &&
        !path.basename(file).includes('bakeoff'),
    )
    for (const file of production)
      expect(readFileSync(file, 'utf8')).not.toMatch(/devbake\/welcome/)
    const route = readFileSync(path.join(HERE, 'dev_.welcome-bakeoff.tsx'), 'utf8')
    expect(route).toContain("import('@/components/devbake/welcome/WelcomeBakeoff')")
    expect(route).not.toMatch(/^import\s+(?!type\s)[^\n]*from ['"][^'"]*devbake/m)
  })
})

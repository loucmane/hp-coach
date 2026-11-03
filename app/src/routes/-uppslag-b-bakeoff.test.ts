import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fireEvent, render, screen, within } from '@testing-library/react'
import axe from 'axe-core'
import { type ComponentType, createElement, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, validateSearch } from './dev_.uppslag-b-bakeoff'

const routing = vi.hoisted(() => ({ search: {} as Record<string, unknown>, navigate: vi.fn() }))
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({
    options,
    fullPath: '/dev/uppslag-b-bakeoff',
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
  vi.stubEnv('DEV', false)
  sessionStorage.clear()
  window.history.replaceState({}, '', '/dev/uppslag-b-bakeoff?dev=1')
})
afterEach(() => vi.unstubAllEnvs())

describe('/dev/uppslag-b-bakeoff', () => {
  it('gates the lazy preview with the established sticky dev opt-in', async () => {
    window.history.replaceState({}, '', '/dev/uppslag-b-bakeoff')
    const view = mount()
    expect(screen.getByText('dev-yta — lägg till ?dev=1')).toBeInTheDocument()
    expect(screen.queryByTestId('uppslag-b-bakeoff')).not.toBeInTheDocument()
    sessionStorage.setItem('hpc-dev-mode', '1')
    view.rerender(createElement(Route.options.component as ComponentType))
    expect(await screen.findByTestId('uppslag-b-bakeoff')).toBeInTheDocument()
  })

  it('validates shareable view and appearance selections', () => {
    expect(
      validateSearch({ d: 'c', s: '8', e: '5', w: 'phone', t: 'dark', p: 'sage', sbs: '1' }),
    ).toEqual({
      d: 'c',
      s: 8,
      e: 5,
      w: 'phone',
      t: 'dark',
      p: 'sage',
      sbs: true,
    })
    expect(
      validateSearch({ d: 'x', s: 9, e: -1, w: 'wide', t: 'blue', p: 'green', sbs: '0' }),
    ).toEqual({})
  })

  it.each(
    ['a', 'b', 'c'].flatMap((d) =>
      ['desktop', 'phone'].flatMap((w) => ['light', 'dark'].map((t) => ({ d, w, t }))),
    ),
  )('renders all eight views in $d / $w / $t', async ({ d, w, t }) => {
    const { VIEWS } = await import('@/components/devbake/uppslagB/uppslagBFixtures')
    mount({ d, w, t })
    const stage = await screen.findByTestId(`uppslag-b-${d}`)
    const controls = within(screen.getByRole('group', { name: 'Vy' }))
    for (const view of VIEWS) {
      fireEvent.click(controls.getByRole('button', { name: view.label }))
      const current = screen.getByTestId(`uppslag-b-${d}`)
      expect(current).toHaveAttribute('data-view', String(view.key))
      expect(current).toHaveAttribute('data-width', w)
      expect(current).toHaveAttribute('data-theme', t)
      expect(within(current).getAllByRole('heading').length).toBeGreaterThan(0)
      if (view.key === 2) expect(current).toHaveTextContent('Ett vanligt provpass är 55 minuter.')
      if (view.key === 3)
        expect(
          within(current).getByRole('table', { name: 'UHR:s rekommenderade tider' }),
        ).toBeInTheDocument()
      if (view.key === 4)
        expect(
          within(current).getByRole('table', {
            name: 'Tillräcklig information för lösningen erhålls',
          }),
        ).toBeInTheDocument()
      if (view.key === 7) expect(current).toHaveTextContent('Försök själv först.')
      if (view.key < 8) expect(within(current).queryByText(/^Svar: /)).not.toBeInTheDocument()
      else expect(within(current).getByText('Svar: D')).toBeInTheDocument()
    }
    expect(stage.textContent).not.toMatch(/⌘|skam|förlor/)
  })

  it.each([
    'a',
    'b',
    'c',
  ])('reveals one real step per tap and saves no progress in %s', async (d) => {
    const { ESSENTIAL } = await import('@/components/devbake/uppslagB/uppslagBFixtures')
    const before = { ...localStorage }
    mount({ d, s: 5 })
    const stage = within(await screen.findByTestId(`uppslag-b-${d}`))
    expect(stage.getByRole('table').textContent).toContain('Kvantitet I')
    for (let count = 1; count <= ESSENTIAL.length; count++) {
      expect(stage.getAllByTestId('worked-step')).toHaveLength(count)
      if (count < ESSENTIAL.length) {
        expect(stage.queryByText('Svar: D')).not.toBeInTheDocument()
        expect(stage.queryByText(ESSENTIAL[count].title!)).not.toBeInTheDocument()
        if (count >= ESSENTIAL.length - 2)
          expect(stage.getByText('Försök själv först.')).toBeInTheDocument()
        fireEvent.click(stage.getByRole('button', { name: 'Nästa steg' }))
      }
    }
    expect(stage.getByText('Svar: D')).toBeInTheDocument()
    expect(stage.getByText('Svar: D')).toHaveFocus()
    expect(stage.queryByRole('button', { name: 'Nästa steg' })).not.toBeInTheDocument()
    fireEvent.click(stage.getByRole('button', { name: 'Från början' }))
    expect(stage.getAllByTestId('worked-step')).toHaveLength(1)
    expect(stage.queryByText('Svar: D')).not.toBeInTheDocument()
    expect({ ...localStorage }).toEqual(before)
  })

  it.each([
    'a',
    'b',
    'c',
  ])('opens all six reference entries without fetching or practice controls in %s', async (d) => {
    const { PROVTEKNIK } = await import('@/data/frameworks')
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    mount({ d })
    await screen.findByTestId(`uppslag-b-${d}`)
    for (const entry of PROVTEKNIK.entries) {
      let stage = within(screen.getByTestId(`uppslag-b-${d}`))
      const link = stage.getByRole('button', { name: entry.headline })
      link.focus()
      fireEvent.click(link)
      stage = within(screen.getByTestId(`uppslag-b-${d}`))
      expect(stage.getByRole('heading', { name: entry.headline })).toBeInTheDocument()
      expect(stage.getByRole('heading', { name: entry.headline })).toHaveFocus()
      expect(stage.getByText(entry.body)).toBeInTheDocument()
      expect(stage.queryByRole('button', { name: /läst|öva/i })).not.toBeInTheDocument()
      fireEvent.click(stage.getByRole('button', { name: 'Alla råd' }))
    }
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('synchronizes all candidates, palettes and steps', async () => {
    const { PALETTES } = await import('@/components/devbake/uppslagB/uppslagBFixtures')
    mount({ sbs: true, s: 5, w: 'phone' })
    await screen.findByTestId('uppslag-b-c')
    const controls = within(screen.getByTestId('uppslag-b-controls'))
    fireEvent.click(controls.getByRole('button', { name: 'Mörkt' }))
    fireEvent.click(
      within(screen.getByTestId('uppslag-b-b')).getByRole('button', { name: 'Nästa steg' }),
    )
    for (const palette of PALETTES) {
      fireEvent.click(controls.getByRole('button', { name: palette.label }))
      for (const d of ['a', 'b', 'c']) {
        const stage = screen.getByTestId(`uppslag-b-${d}`)
        expect(stage).toHaveAttribute('data-palette', palette.key)
        expect(stage).toHaveAttribute('data-theme', 'dark')
        expect(stage).toHaveAttribute('data-width', 'phone')
        expect(within(stage).getAllByTestId('worked-step')).toHaveLength(2)
      }
    }
  })

  it('pages through Kort in order with working boundary controls', async () => {
    const { PROVTEKNIK } = await import('@/data/frameworks')
    mount({ d: 'b', s: 2 })
    await screen.findByTestId('uppslag-b-b')
    for (const [index, entry] of PROVTEKNIK.entries.entries()) {
      const stage = within(screen.getByTestId('uppslag-b-b'))
      expect(stage.getByRole('heading', { name: entry.headline })).toBeInTheDocument()
      const previous = stage.getByRole('button', { name: 'Föregående' })
      expect(previous.hasAttribute('disabled')).toBe(index === 0)
      const next = stage.getByRole('button', { name: 'Nästa' })
      if (index < PROVTEKNIK.entries.length - 1) fireEvent.click(next)
      else {
        expect(next).toBeDisabled()
        fireEvent.click(previous)
        expect(
          within(screen.getByTestId('uppslag-b-b')).getByRole('heading', {
            name: PROVTEKNIK.entries[index - 1].headline,
          }),
        ).toBeInTheDocument()
      }
    }
  })

  it.each(['a', 'b', 'c'])('passes axe for the worked reader in %s', async (d) => {
    const { container } = mount({ d, s: 7 })
    await screen.findByTestId(`uppslag-b-${d}`)
    expect(
      (await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })).violations,
    ).toEqual([])
  })

  it('keeps the question and explanation faithful to the manifest and bank', async () => {
    const { QUESTION, EXAMPLE, STEPS } = await import(
      '@/components/devbake/uppslagB/uppslagBFixtures'
    )
    const { WORKED_EXAMPLES } = await import('@/data/workedExamples.generated')
    expect(WORKED_EXAMPLES).toContainEqual(EXAMPLE)
    const bank = JSON.parse(
      readFileSync(path.join(APP, `public/data/${QUESTION.exam_id}.json`), 'utf8'),
    )
    expect(bank.find((q: { qid: string }) => q.qid === QUESTION.qid)).toEqual(QUESTION)
    const explanation = JSON.parse(
      readFileSync(path.join(APP, `public/explanations/${QUESTION.exam_id}.json`), 'utf8'),
    )[QUESTION.qid]
    expect(explanation.framework_id).toBe(EXAMPLE.entryId)
    expect(STEPS).toEqual(explanation.steps)
  })

  it('isolates devbake behind the lazy dev route', () => {
    function files(dir: string): string[] {
      return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
      )
    }
    for (const file of [...files(HERE), ...files(path.join(APP, 'src/folio'))].filter(
      (f) => /\.tsx?$/.test(f) && !f.includes('.test.') && !path.basename(f).startsWith('dev'),
    ))
      expect(readFileSync(file, 'utf8')).not.toMatch(/devbake\/uppslagB/)
    const route = readFileSync(path.join(HERE, 'dev_.uppslag-b-bakeoff.tsx'), 'utf8')
    expect(route).toContain("import('@/components/devbake/uppslagB/UppslagBBakeoff')")
    expect(route).not.toMatch(/^import\s+(?!type\s)[^\n]*from ['"][^'"]*devbake/m)
  })
})

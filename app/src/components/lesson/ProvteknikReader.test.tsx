import { readFileSync } from 'node:fs'
import path from 'node:path'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const routeState = vi.hoisted(() => ({
  search: {} as { section?: string; chapter?: string },
  navigate: vi.fn(),
  progressHook: vi.fn(() => ({ mutate: vi.fn() })),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({
    children,
    to,
    search,
  }: {
    children: ReactNode
    to: string
    search?: Record<string, string>
  }) => <a href={search ? `${to}?${new URLSearchParams(search)}` : to}>{children}</a>,
  useNavigate: () => routeState.navigate,
  createFileRoute: () => (options: unknown) => ({
    options,
    useSearch: () => routeState.search,
  }),
}))
vi.mock('@/components/MobileFrame', () => ({
  MobileFrame: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/components/Page', () => ({
  Page: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/api/hooks/useStats', () => ({ useStats: () => ({ data: undefined }) }))
vi.mock('@/api/hooks/useMistakes', () => ({ useDueMistakes: () => ({ data: undefined }) }))
vi.mock('@/api/hooks/useLessonProgress', () => ({ usePutLessonProgress: routeState.progressHook }))

import { __resetFrameworkCache } from '@/data/frameworks'
import { SECTION_KEYS } from '@/data/questions'
import { UHR_DELPROV, UHR_ORDER, uhrTimeMs } from '@/lib/uhrPacing'
import { PickerBody, Route, validateSearch } from '@/routes/lektion'
import { ProvteknikReader } from './ProvteknikReader'

function chapterData() {
  return JSON.parse(readFileSync(path.resolve('public/frameworks/provteknik.json'), 'utf8'))
}

beforeEach(() => {
  __resetFrameworkCache()
  vi.clearAllMocks()
  routeState.search = {}
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function serveChapter() {
  const data = chapterData()
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(data)))
  vi.stubGlobal('fetch', fetcher)
  return { data, fetcher }
}

describe('ProvteknikReader', () => {
  it('loads collapsed native cards, renders steps and the NOG table, without practice or credit', async () => {
    const { data, fetcher } = serveChapter()
    const { container } = render(<ProvteknikReader />)
    expect(screen.getByRole('status')).toHaveTextContent('Laddar')
    await screen.findByText(data.entries[0].headline)
    const cards = container.querySelectorAll('details')
    expect(cards).toHaveLength(data.entries.length)
    for (const [index, card] of Array.from(cards).entries()) {
      expect(card.id).toBe(data.entries[index].id)
      expect(card.open).toBe(false)
      fireEvent.click(card.querySelector('summary') as HTMLElement)
      expect(card.open).toBe(true)
      expect(card).toHaveTextContent(data.entries[index].body)
    }
    const nog = screen.getByRole('table', { name: 'Tillräcklig information för lösningen erhålls' })
    expect(within(nog).getAllByRole('row')).toHaveLength(6)
    expect(nog).toHaveTextContent('i (1) och (2) var för sig')
    expect(screen.getAllByRole('list').length).toBeGreaterThan(0)
    expect(screen.queryByText(/Markera som läst|Öva detta|Öva denna/)).not.toBeInTheDocument()
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(routeState.progressHook).not.toHaveBeenCalled()
  })

  it('derives pass duration and every recommended time from the shared pacing data', async () => {
    serveChapter()
    const { container } = render(<ProvteknikReader />)
    await screen.findByText('Sätt en gräns och gå vidare')
    for (const card of container.querySelectorAll('details')) card.open = true
    const passMinutes = UHR_ORDER.slice(0, 4).reduce((sum, s) => sum + UHR_DELPROV[s].minutes, 0)
    expect(screen.getByText(`Ett vanligt provpass är ${passMinutes} minuter.`)).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'UHR:s rekommenderade tider' })
    for (const section of UHR_ORDER) {
      const row = within(table).getByRole('rowheader', { name: section }).closest('tr')
      expect(row).toHaveTextContent(`${UHR_DELPROV[section].minutes} min`)
      expect(row).toHaveTextContent(`${UHR_DELPROV[section].questions}`)
      expect(row).toHaveTextContent(`${(uhrTimeMs(section, 1) ?? 0) / 1000} s`)
    }
    expect(
      screen.getByText(/ett genomsnitt, inte en tidsgräns för varje fråga/),
    ).toBeInTheDocument()
  })

  it('shows a readable error without exposing diagnostics', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('internal diagnostic')))
    render(<ProvteknikReader />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Kunde inte ladda provtekniken')
    expect(screen.queryByText(/internal diagnostic/)).not.toBeInTheDocument()
  })

  it.each([
    null,
    { chapter: 'provteknik', entries: [] },
  ])('handles unavailable content: %j', async (data) => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          data === null ? new Response('', { status: 404 }) : new Response(JSON.stringify(data)),
        ),
    )
    render(<ProvteknikReader />)
    expect(await screen.findByText('Provtekniken är inte tillgänglig just nu.')).toBeInTheDocument()
  })
})

describe('lektion chapter routing', () => {
  it('accepts the chapter, preserves valid sections and ignores unknown search values', () => {
    expect(validateSearch({ chapter: 'provteknik' })).toEqual({ chapter: 'provteknik' })
    for (const section of SECTION_KEYS) expect(validateSearch({ section })).toEqual({ section })
    expect(validateSearch({ chapter: 'unknown', section: 'NOG' })).toEqual({ section: 'NOG' })
    expect(validateSearch({ chapter: 'provteknik', section: 'NOG' })).toEqual({
      chapter: 'provteknik',
    })
    expect(validateSearch({ chapter: ['provteknik'], section: 'bad' })).toEqual({})
  })

  it('places a chapter link before the section list', () => {
    render(<PickerBody />)
    const chapter = screen.getByRole('link', { name: /Provteknik/ })
    expect(chapter).toHaveAttribute('href', '/lektion?chapter=provteknik')
    const section = screen.getByRole('button', { name: /NOG/ })
    expect(chapter.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getAllByRole('button')).toHaveLength(SECTION_KEYS.length)
  })

  it('opens the chapter without mounting the bookmark writer and Escape returns to the picker', async () => {
    const { data, fetcher } = serveChapter()
    routeState.search = { chapter: 'provteknik' }
    const Component = Route.options.component
    if (!Component) throw new Error('Missing route component')
    render(<Component />)
    const headline = await screen.findByText(data.entries[0].headline)
    vi.useFakeTimers()
    const card = headline.closest('details') as HTMLDetailsElement
    fireEvent.click(card.querySelector('summary') as HTMLElement)
    fireEvent(card, new Event('toggle'))
    await act(async () => vi.advanceTimersByTime(1000))
    expect(routeState.progressHook).not.toHaveBeenCalled()
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledWith('/frameworks/provteknik.json')
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(routeState.navigate).toHaveBeenCalledWith({ to: '/lektion' })
  })
})

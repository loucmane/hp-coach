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

import { PROVTEKNIK } from '@/data/frameworks'
import { SECTION_KEYS } from '@/data/questions'
import { UHR_DELPROV, UHR_ORDER } from '@/lib/uhrPacing'
import { PickerBody, Route, validateSearch } from '@/routes/lektion'
import { ProvteknikReader } from './ProvteknikReader'

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
  routeState.search = {}
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('ProvteknikReader', () => {
  it('renders collapsed native cards immediately offline, without practice or credit', () => {
    const data = PROVTEKNIK
    const { container } = render(<ProvteknikReader />)
    expect(screen.getByText(data.entries[0].headline)).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
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
    expect(fetch).not.toHaveBeenCalled()
    expect(routeState.progressHook).not.toHaveBeenCalled()
  })

  it('shows a 55-minute pass and every recommended time from the shared pacing data', () => {
    const { container } = render(<ProvteknikReader />)
    for (const card of container.querySelectorAll('details')) card.open = true
    expect(screen.getByText('Ett vanligt provpass är 55 minuter.')).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'UHR:s rekommenderade tider' })
    for (const section of UHR_ORDER) {
      const row = within(table).getByRole('rowheader', { name: section }).closest('tr')
      expect(row).toHaveTextContent(`${UHR_DELPROV[section].minutes} min`)
      expect(row).toHaveTextContent(`${UHR_DELPROV[section].questions}`)
    }
    expect(screen.getByText(/Snittet är ingen gräns för varje fråga/)).toBeInTheDocument()
  })

  it('formats average times as seconds below a minute and minutes plus seconds otherwise', () => {
    const { container } = render(<ProvteknikReader />)
    for (const card of container.querySelectorAll('details')) card.open = true
    const table = screen.getByRole('table', { name: 'UHR:s rekommenderade tider' })
    const averages = {
      ORD: '18 s',
      LÄS: '2 min 12 s',
      MEK: '48 s',
      ELF: '2 min 12 s',
      XYZ: '1 min 0 s',
      KVA: '1 min 0 s',
      NOG: '1 min 40 s',
      DTK: '1 min 55 s',
    }
    for (const [section, average] of Object.entries(averages)) {
      const row = within(table).getByRole('rowheader', { name: section }).closest('tr')
      expect(row).not.toBeNull()
      expect(within(row as HTMLElement).getAllByRole('cell')[2].textContent).toBe(average)
    }
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
    const data = PROVTEKNIK
    routeState.search = { chapter: 'provteknik' }
    const Component = Route.options.component
    if (!Component) throw new Error('Missing route component')
    render(<Component />)
    const headline = screen.getByText(data.entries[0].headline)
    vi.useFakeTimers()
    const card = headline.closest('details') as HTMLDetailsElement
    fireEvent.click(card.querySelector('summary') as HTMLElement)
    fireEvent(card, new Event('toggle'))
    await act(async () => vi.advanceTimersByTime(1000))
    expect(routeState.progressHook).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(routeState.navigate).toHaveBeenCalledWith({ to: '/lektion' })
  })
})

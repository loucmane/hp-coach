import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  useNavigate,
} from '@tanstack/react-router'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { type ComponentType, type FunctionComponent, type ReactNode, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLessonProgress } from '@/api/hooks/useLessonProgress'
import type { Framework, Lexicon, ProtocolCatalog, TrapCatalog } from '@/data/frameworks'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { WORKED_EXAMPLE_QIDS } from '@/data/workedExamples.generated'
import { FolioHostContext } from '@/folio/host'
import { useLessonReads } from '@/hooks/useLessonReads'
import { Route, validateSearch } from '@/routes/lektion'
import FolioUppslag from './FolioUppslag'

const state = vi.hoisted(() => ({
  hash: '',
  viewport: 'studio',
  reads: [] as string[],
  bookmark: null as { section: string; frameworkId: string } | null,
  bookmarkPending: false,
  searchHook: vi.fn(),
  locationHook: vi.fn(),
  realReads: false,
  getReads: vi.fn(),
  getBookmark: vi.fn(),
  due: [] as unknown[],
  traps: [] as { section: Section }[],
  search: {} as { section?: Section; chapter?: 'provteknik' },
  put: vi.fn(),
  navigate: vi.fn(),
  load: vi.fn(),
  worked: vi.fn(),
}))
vi.mock('@tanstack/react-router', async (original) => {
  const router = await original<typeof import('@tanstack/react-router')>()
  return {
    ...router,
    createFileRoute: () => (options: unknown) => ({
      options,
      useSearch: state.searchHook,
    }),
    useNavigate: vi.fn(),
    useLocation: state.locationHook,
    Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
  }
})
vi.mock('@/data/frameworks', async (original) => ({
  ...(await original<typeof import('@/data/frameworks')>()),
  loadFramework: state.load,
}))
vi.mock('@/hooks/useLessonReads', () => ({ useLessonReads: vi.fn() }))
vi.mock('@/api/hooks/useLessonProgress', async (original) => ({
  ...(await original<typeof import('@/api/hooks/useLessonProgress')>()),
  usePutLessonProgress: () => ({ mutate: state.put }),
}))
vi.mock('@/api/useApiClient', () => ({
  useApiClient: () => ({
    api: {
      'lesson-progress': { $get: state.getBookmark },
      'lesson-reads': {
        $get: state.getReads,
        $put: vi.fn(),
        ':entryId': { $delete: vi.fn() },
      },
    },
  }),
}))
vi.mock('@/api/hooks/useStats', () => ({ useStats: () => ({ data: undefined }) }))
vi.mock('@/api/hooks/useMistakes', () => ({ useDueMistakes: () => ({ data: state.due }) }))
vi.mock('@/api/hooks/useTopTraps', () => ({ useTopTraps: () => state.traps }))
vi.mock('@/hooks/useViewport', () => ({ useViewport: () => state.viewport }))
vi.mock('@/lib/motion', () => ({
  useFirstContentSignal: vi.fn(),
  useArketMotion: () => ({ rm: true }),
  uppslagDoorLayoutId: (s: string) => s,
}))
vi.mock('@/components/lesson/WorkedExample', () => ({
  WorkedExample: (props: { entryId: string; fallback?: ReactNode }) => {
    state.worked(props.entryId)
    return <div data-testid="classic-worked">{props.fallback}</div>
  },
}))
vi.mock('@/components/lesson/LessonReader', () => ({ LessonReader: () => <p>Classic lesson</p> }))
vi.mock('@/components/lesson/ProvteknikReader', () => ({
  ProvteknikReader: () => <p>Classic Provteknik</p>,
}))
vi.mock('@/components/MobileFrame', () => ({
  MobileFrame: ({ children }: { children: ReactNode }) => (
    <div data-testid="classic-shell">{children}</div>
  ),
}))
vi.mock('@/components/Page', () => ({ Page: ({ children }: { children: ReactNode }) => children }))

const trap: TrapCatalog = {
  section: 'NOG',
  family: 'nog_traps',
  version: 1,
  authored_at: '',
  entries: ['NOG-A', 'NOG-B', 'NOG-C'].map((id, i) => ({
    id,
    tldr: `Mönster ${i + 1}`,
    pattern_description: 'Prövar båda samtidigt.',
    why_it_occurs: 'Det ser tillräckligt ut.',
    recognition_cue: 'Två påståenden.',
    countermeasure: 'Pröva ett i taget.',
    counter_example: 'När allt redan är känt.',
    common_distractor_signature: 'Ett för snabbt C.',
    worked_example: {
      setup: '$x=2$',
      trap_thinking: 'Anta båda.',
      correct_thinking: 'Pröva ensamt.',
      answer: 'A',
    },
    example_questions: i === 1 ? [] : ['host-2013-kvant2-NOG-015'],
  })),
}
const protocol: ProtocolCatalog = {
  section: 'LÄS',
  family: 'las_taxonomy',
  version: 1,
  authored_at: '',
  entries: Array.from({ length: 8 }, (_, i) => ({
    id: `LAS-${i + 1}`,
    question_type: `Frågetyp ${i + 1}`,
    attack_protocol: ['Läs först.', 'Sök stöd.'],
    common_distractors: [{ pattern: 'För brett', why_it_traps: 'Låter rimligt.' }],
    example_questions: [],
  })),
}
const lexicon: Lexicon = {
  section: 'ORD',
  family: 'ord_roots',
  version: 1,
  authored_at: '',
  entries: [
    {
      id: 'ORD-A',
      root: 'för-',
      origin: 'Germanic',
      meaning: 'framåt',
      example_words: ['förflytta', 'förbereda'],
      example_questions: [],
    },
  ],
}
const catalogs: Partial<Record<Section, Framework>> = { NOG: trap, LÄS: protocol, ORD: lexicon }
const realRouter =
  await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')
const { useLessonReads: realUseLessonReads } =
  await vi.importActual<typeof import('@/hooks/useLessonReads')>('@/hooks/useLessonReads')
const navigateHref = vi.fn()
function useMockReads() {
  const [reads, setReads] = useState(new Set(state.reads))
  return {
    reads,
    isRead: (id: string) => reads.has(id),
    toggleRead: (id: string) =>
      setReads((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      }),
  }
}
function makeClient(pending = false) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  })
  if (!state.bookmarkPending) client.setQueryData(['lesson-progress'], state.bookmark)
  if (!state.realReads) client.setQueryData(['lesson-reads'], state.reads)
  if (!pending)
    for (const s of SECTION_KEYS) client.setQueryData(['folio-lesson', s], catalogs[s] ?? null)
  return client
}
function mount(section?: Section, pending = false) {
  const client = makeClient(pending)
  const ui = (s = section) => (
    <QueryClientProvider client={client}>
      <main data-folio lang="sv">
        <FolioUppslag section={s} navigateHref={navigateHref} />
      </main>
    </QueryClientProvider>
  )
  return { ...render(ui()), client, ui }
}
beforeEach(() => {
  state.hash = ''
  state.viewport = 'studio'
  state.reads = []
  state.bookmark = null
  state.bookmarkPending = false
  state.searchHook.mockImplementation(() => state.search)
  vi.mocked(useNavigate).mockImplementation(() => state.navigate)
  state.locationHook.mockImplementation(
    ({ select }: { select: (location: { hash: string }) => unknown }) =>
      select({ hash: state.hash }),
  )
  vi.mocked(useLessonReads).mockImplementation(useMockReads)
  state.realReads = false
  state.getReads.mockReset().mockResolvedValue({ ok: true, json: async () => ({ entryIds: [] }) })
  state.getBookmark.mockReset().mockImplementation(() => new Promise(() => {}))
  localStorage.clear()
  state.due = []
  state.traps = []
  state.search = {}
  state.put.mockClear()
  state.navigate.mockClear()
  state.worked.mockClear()
  navigateHref.mockClear()
  state.load.mockReset().mockImplementation(async (s: Section) => catalogs[s] ?? null)
  window.history.replaceState({ retained: true }, '', '/lektion')
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Folio Uppslag', () => {
  it('renders the bare index with eight chapter links and unnumbered Provteknik first', () => {
    const { container } = mount()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Läs först.')
    expect(screen.getAllByTestId(/^fa-uppslag-section-/)).toHaveLength(8)
    expect(screen.getByRole('link', { name: /Provteknik/ })).toHaveAttribute(
      'href',
      '/lektion?chapter=provteknik',
    )
    expect(screen.getByTestId('lektion-mixed')).toHaveAttribute('href', '/drill?mixed=1&start=1')
    expect(screen.queryByTestId('lektion-repetition')).toBeNull()
    expect(screen.queryByTestId('fa-lesson')).toBeNull()
    expect(container.textContent).not.toMatch(/svagast|avsluta|sluta|stopp/i)
    expect(state.worked).not.toHaveBeenCalled()
  })

  it('renders one open entry, one ribbon, accessible names and one filled primary', () => {
    state.hash = 'LAS-3'
    const { container } = mount('LÄS')
    expect(screen.getByText('Frågetyp 3 av 8')).toBeInTheDocument()
    const toc = screen.getByTestId('fa-uppslag-entry-LAS-3')
    expect(toc).toHaveAttribute('aria-current', 'page')
    expect(toc).toHaveAccessibleName(/Frågetyp 3.*1 min/)
    expect(container.querySelectorAll('.fa-ribbon')).toHaveLength(1)
    expect(toc.querySelector('.fa-ribbon')).not.toBeNull()
    expect(container.querySelectorAll('.fa-btn')).toHaveLength(1)
    expect(screen.getAllByTestId('fa-lesson')).toHaveLength(1)
    expect(screen.queryByTestId('lesson-practice-link')).toBeNull()
    expect(screen.getByRole('region', { name: 'Angreppsprotokoll' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Vanliga fällor' })).toBeInTheDocument()
  })

  it('marks read and advances with Enter, steps with J/K, and can undo a read mark', () => {
    state.hash = 'NOG-C'
    const { container } = mount('NOG')
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(navigateHref).toHaveBeenLastCalledWith('/lektion?section=NOG#NOG-A')
    expect(screen.getByTestId('fa-uppslag-entry-NOG-C')).toHaveAccessibleName(/läst/)
    fireEvent.keyDown(document.body, { key: 'j' })
    expect(screen.getByTestId('fa-uppslag-entry-NOG-B')).toHaveAttribute('aria-current', 'page')
    fireEvent.keyDown(document.body, { key: 'k' })
    const read = screen.getByTestId('lesson-mark-as-read')
    expect(read).toHaveAttribute('data-read', 'false')
    expect(read).toHaveTextContent(/^Markera som läst$/)
    expect(read).toHaveAccessibleName('Markera som läst')
    expect(read).not.toHaveAttribute('aria-pressed')
    fireEvent.click(read)
    expect(read).toHaveAttribute('data-read', 'true')
    expect(read).toHaveTextContent(/^Läst ✓ · Ångra$/)
    expect(read).toHaveAccessibleName('Läst · Ångra')
    expect(read).not.toHaveAttribute('aria-pressed')
    fireEvent.click(read)
    expect(read).toHaveAttribute('data-read', 'false')
    expect(read).toHaveTextContent(/^Markera som läst$/)
    expect(read).toHaveAccessibleName('Markera som läst')
    expect(container.querySelectorAll('.fa-btn')).toHaveLength(1)
  })

  it('ignores keyboard shortcuts on native controls, modifiers, inert content and dialogs', () => {
    state.hash = 'NOG-A'
    mount('NOG')
    const link = screen.getByTestId('fa-uppslag-entry-NOG-B')
    for (const key of ['j', 'k', 'Enter']) fireEvent.keyDown(link, { key })
    fireEvent.keyDown(document.body, { key: 'j', ctrlKey: true })
    fireEvent.keyDown(document.body, { key: 'Enter', repeat: true })
    const dialog = document.createElement('dialog')
    dialog.open = true
    document.body.appendChild(dialog)
    fireEvent.keyDown(document.body, { key: 'j' })
    dialog.remove()
    const inert = document.createElement('div')
    inert.setAttribute('inert', '')
    document.body.appendChild(inert)
    fireEvent.keyDown(inert, { key: 'Enter' })
    inert.remove()
    expect(navigateHref).not.toHaveBeenCalled()
  })

  it('opens the chapter end only after every entry is read and keeps practice links real', () => {
    state.reads = ['NOG-A', 'NOG-B']
    state.hash = 'NOG-C'
    state.traps = [{ section: 'NOG' }]
    const { container } = mount('NOG')
    expect(screen.queryByRole('heading', { name: 'Kapitlet är läst.' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Läst – slutför kapitlet' }))
    expect(screen.getByRole('heading', { name: 'Kapitlet är läst.' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Kapitlet är läst.' })).toHaveFocus()
    expect(screen.getByText('3 fällor · alla lästa')).toBeInTheDocument()
    expect(screen.getByTestId('section-practice-all')).toHaveAttribute(
      'href',
      '/drill?section=NOG&start=1',
    )
    expect(screen.getByTestId('section-practice-weak')).toHaveAttribute(
      'href',
      '/drill?section=NOG&weak=1',
    )
    expect(screen.getByTestId('section-practice-weak')).toHaveTextContent(
      'Öva dina vanligaste fällor',
    )
    expect(container.textContent).not.toMatch(/svagast|avsluta|sluta|stopp/i)
    expect(container.querySelectorAll('.fa-btn')).toHaveLength(1)
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(navigateHref).toHaveBeenLastCalledWith('/drill?section=NOG&start=1')
    fireEvent.click(screen.getByRole('button', { name: 'Tillbaka till sidan' }))
    expect(screen.getByTestId('fa-lesson')).toHaveFocus()
    fireEvent.click(screen.getByTestId('lesson-mark-as-read'))
    expect(screen.queryByRole('heading', { name: 'Kapitlet är läst.' })).toBeNull()
  })

  it('renders the trap regions and the classic worked example with an authored Folio fallback', () => {
    const { container } = mount('NOG')
    expect(container.textContent).not.toMatch(/svagast|avsluta|sluta|stopp/i)
    for (const name of [
      'Så gör man ofta',
      'Varför det händer',
      'Igenkänningstecken',
      'Motåtgärd',
      'När fällan inte gäller',
    ])
      expect(screen.getByRole('region', { name })).toBeInTheDocument()
    expect(screen.getByText(/Det typiska felsvaret/)).toBeInTheDocument()
    expect(state.worked).toHaveBeenCalledWith('NOG-A')
    expect(screen.getByTestId('classic-worked').parentElement).toHaveClass('fa-up-worked')
    expect(
      within(screen.getByTestId('classic-worked')).getByText('Förutsättning'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('lesson-practice-link')).toHaveAttribute(
      'href',
      '/drill?section=NOG&framework=NOG-A&start=1',
    )
    expect(screen.getByRole('link', { name: 'Hösten 2013 · fråga 15' })).toHaveAttribute(
      'href',
      '/drill?qid=host-2013-kvant2-NOG-015',
    )
  })

  it('sets the ORD root at the largest article size and puts the phone entry before contents', () => {
    state.viewport = 'phone'
    const { container } = mount('ORD')
    expect(screen.getByRole('heading', { level: 1, name: 'för-' })).toHaveClass('fa-up-root')
    expect(screen.getByText('germanskt ursprung')).toBeInTheDocument()
    expect(container.textContent?.indexOf('för-')).toBeLessThan(
      container.textContent?.indexOf('Kapitlen') ?? 0,
    )
    fireEvent.click(screen.getByRole('button', { name: /Innehåll/ }))
    expect(screen.getByTestId('fa-uppslag-entry-ORD-A')).toHaveFocus()
    expect(state.worked).not.toHaveBeenCalled()
  })

  it.each([
    ['Germanic', 'germanskt ursprung'],
    ['Latin', 'latinskt ursprung'],
    ['Greek', 'grekiskt ursprung'],
    ['French', 'franskt ursprung'],
    ['Arabic', 'Arabic'],
  ])('renders ORD origin %s as %s', async (origin, label) => {
    const { client } = mount('ORD')
    act(() =>
      client.setQueryData(['folio-lesson', 'ORD'], {
        ...lexicon,
        entries: [{ ...lexicon.entries[0], origin }],
      }),
    )
    expect(await within(screen.getByTestId('fa-lesson')).findByText(label)).toBeInTheDocument()
  })

  it('debounces the arrival bookmark and subsequent changes, retaining history state', async () => {
    vi.useFakeTimers()
    state.bookmark = { section: 'NOG', frameworkId: 'NOG-B' }
    mount('NOG')
    expect(navigateHref).toHaveBeenCalledWith('/lektion?section=NOG#NOG-B', { replace: true })
    expect(window.history.state).toEqual({ retained: true })
    act(() => vi.advanceTimersByTime(399))
    expect(state.put).not.toHaveBeenCalled()
    fireEvent.keyDown(document.body, { key: 'j' })
    act(() => vi.advanceTimersByTime(400))
    expect(state.put).toHaveBeenCalledTimes(1)
    expect(state.put).toHaveBeenCalledWith(
      expect.objectContaining({ section: 'NOG', frameworkId: 'NOG-C' }),
    )
  })

  it('waits for the arriving bookmark without overwriting it, but a valid hash wins immediately', async () => {
    state.bookmarkPending = true
    const { client, rerender, ui } = mount('NOG')
    expect(screen.getByRole('status')).toHaveTextContent('Laddar')
    expect(state.put).not.toHaveBeenCalled()
    act(() => client.setQueryData(['lesson-progress'], { section: 'NOG', frameworkId: 'NOG-C' }))
    await waitFor(() =>
      expect(screen.getByTestId('fa-uppslag-entry-NOG-C')).toHaveAttribute('aria-current', 'page'),
    )
    state.hash = 'NOG-A'
    state.bookmarkPending = true
    rerender(ui())
    expect(screen.getByTestId('fa-uppslag-entry-NOG-A')).toHaveAttribute('aria-current', 'page')
  })

  it('waits for server reads to be reconciled before choosing and bookmarking the first unread', async () => {
    state.realReads = true
    vi.mocked(useLessonReads).mockImplementation(realUseLessonReads)
    let finishReads!: (response: unknown) => void
    state.getReads.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishReads = resolve
        }),
    )
    mount('NOG')
    expect(screen.getByRole('status')).toHaveTextContent('Laddar')
    expect(screen.queryByTestId('fa-lesson')).toBeNull()
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 450))
    })
    expect(state.put).not.toHaveBeenCalled()
    expect(navigateHref).not.toHaveBeenCalled()
    await act(async () =>
      finishReads({ ok: true, json: async () => ({ entryIds: ['NOG-A', 'NOG-B'] }) }),
    )
    await waitFor(() =>
      expect(screen.getByTestId('fa-uppslag-entry-NOG-C')).toHaveAttribute('aria-current', 'page'),
    )
    await waitFor(() =>
      expect(state.put).toHaveBeenCalledWith(expect.objectContaining({ frameworkId: 'NOG-C' })),
    )
    expect(state.put).toHaveBeenCalledTimes(1)
    expect(state.getReads).toHaveBeenCalledTimes(1)
  })

  it('falls back on the first bookmark failure while shared retries continue', async () => {
    vi.useFakeTimers()
    state.bookmarkPending = true
    state.getBookmark.mockRejectedValue(new Error('offline'))
    const client = makeClient()
    client.setDefaultOptions({ queries: { retry: 3, retryDelay: 1000, staleTime: Infinity } })
    render(
      <QueryClientProvider client={client}>
        <FolioUppslag section="NOG" navigateHref={navigateHref} />
      </QueryClientProvider>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Laddar')
    await act(() => vi.advanceTimersByTimeAsync(20))
    expect(state.getBookmark).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('fa-lesson')).toBeInTheDocument()
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByTestId('fa-uppslag-entry-NOG-A')).toHaveAttribute('aria-current', 'page')
    await act(() => vi.advanceTimersByTimeAsync(3000))
    expect(state.getBookmark).toHaveBeenCalledTimes(4)
    expect(screen.getByTestId('fa-uppslag-entry-NOG-A')).toHaveAttribute('aria-current', 'page')
  })

  it.each([
    'classic-first',
    'folio-first',
  ] as const)('shares bookmark retries and results with another reader mounted %s', async (order) => {
    vi.useFakeTimers()
    state.bookmarkPending = true
    state.reads = ['NOG-A']
    const progress = { section: 'NOG', frameworkId: 'NOG-C' }
    state.getBookmark
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValue({ ok: true, json: async () => ({ progress }) })
    const client = makeClient()
    client.setDefaultOptions({ queries: { retry: 1, retryDelay: 1000, staleTime: Infinity } })
    function SharedReader() {
      const bookmark = useLessonProgress()
      return <p data-testid="shared-bookmark">{bookmark.data?.frameworkId}</p>
    }
    render(
      <QueryClientProvider client={client}>
        {order === 'classic-first' && <SharedReader />}
        <FolioUppslag section="NOG" navigateHref={navigateHref} />
        {order === 'folio-first' && <SharedReader />}
      </QueryClientProvider>,
    )
    await act(() => vi.advanceTimersByTimeAsync(20))
    expect(state.getBookmark).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('fa-uppslag-entry-NOG-B')).toHaveAttribute('aria-current', 'page')
    expect(navigateHref).toHaveBeenCalledWith('/lektion?section=NOG#NOG-B', { replace: true })
    await act(() => vi.advanceTimersByTimeAsync(1000))
    expect(screen.getByTestId('shared-bookmark')).toHaveTextContent('NOG-C')
    // A recovered shared bookmark must not turn the page under the Folio reader.
    expect(screen.getByTestId('fa-uppslag-entry-NOG-B')).toHaveAttribute('aria-current', 'page')
    expect(navigateHref).toHaveBeenCalledTimes(1)
    expect(state.put).toHaveBeenCalledWith(expect.objectContaining({ frameworkId: 'NOG-B' }))
    expect(state.getBookmark).toHaveBeenCalledTimes(2)
    const queries = client.getQueryCache().findAll({ queryKey: ['lesson-progress'] })
    expect(queries).toHaveLength(1)
    expect(queries[0].getObserversCount()).toBe(2)
  })

  it('still reconciles server reads before choosing a failed-bookmark fallback', async () => {
    vi.useFakeTimers()
    state.bookmarkPending = true
    state.realReads = true
    vi.mocked(useLessonReads).mockImplementation(realUseLessonReads)
    state.getBookmark.mockRejectedValue(new Error('offline'))
    let finishReads!: (response: unknown) => void
    state.getReads.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishReads = resolve
        }),
    )
    const client = makeClient()
    client.setDefaultOptions({ queries: { retry: 1, retryDelay: 1000, staleTime: Infinity } })
    render(
      <QueryClientProvider client={client}>
        <FolioUppslag section="NOG" navigateHref={navigateHref} />
      </QueryClientProvider>,
    )
    await act(() => vi.advanceTimersByTimeAsync(20))
    expect(screen.getByRole('status')).toHaveTextContent('Laddar')
    expect(state.put).not.toHaveBeenCalled()
    expect(navigateHref).not.toHaveBeenCalled()
    await act(async () => {
      finishReads({ ok: true, json: async () => ({ entryIds: ['NOG-A', 'NOG-B'] }) })
      await vi.advanceTimersByTimeAsync(20)
    })
    expect(state.getBookmark).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('fa-uppslag-entry-NOG-C')).toHaveAttribute('aria-current', 'page')
  })

  it.each([
    '',
    '#NOG-A',
  ])('restores arrival %s, row and J through real router Back and Forward', async (hash) => {
    state.searchHook.mockImplementation(() => realRouter.useSearch({ strict: false }))
    vi.mocked(useNavigate).mockImplementation(realRouter.useNavigate)
    state.locationHook.mockImplementation(realRouter.useLocation)
    window.history.replaceState({ retained: true }, '', `/lektion?section=NOG${hash}`)
    const history = createBrowserHistory({ window })
    const root = createRootRoute()
    const lesson = createRoute({
      getParentRoute: () => root,
      path: '/lektion',
      validateSearch,
      component: Route.options.component as FunctionComponent,
    })
    const router = createRouter({ routeTree: root.addChildren([lesson]), history })
    const push = vi.spyOn(window.history, 'pushState')
    const replace = vi.spyOn(window.history, 'replaceState')
    const client = makeClient()
    const view = render(
      <QueryClientProvider client={client}>
        <FolioHostContext.Provider value>
          <RouterProvider router={router} />
        </FolioHostContext.Provider>
      </QueryClientProvider>,
    )
    const at = async (id: string) => {
      await waitFor(() => {
        expect(window.location.hash).toBe(`#${id}`)
        expect(screen.getByTestId(`fa-uppslag-entry-${id}`)).toHaveAttribute('aria-current', 'page')
      })
    }
    try {
      await at('NOG-A')
      expect(push).not.toHaveBeenCalled()
      fireEvent.click(screen.getByTestId('fa-uppslag-entry-NOG-B'))
      await at('NOG-B')
      fireEvent.keyDown(document.body, { key: 'j' })
      await at('NOG-C')
      expect(push).toHaveBeenCalledTimes(2)
      act(() => history.back())
      await at('NOG-B')
      act(() => history.back())
      await at('NOG-A')
      act(() => history.forward())
      await at('NOG-B')
      act(() => history.forward())
      await at('NOG-C')
      expect(push).toHaveBeenCalledTimes(2)
      expect(replace).toHaveBeenCalledTimes(hash ? 0 : 1)
      fireEvent.keyDown(document.body, { key: 'k' })
      await at('NOG-B')
      fireEvent.click(screen.getByRole('button', { name: 'Läst – nästa fälla' }))
      await at('NOG-C')
      fireEvent.click(screen.getByTestId('fa-uppslag-section-ord'))
      await at('ORD-A')
      expect(push).toHaveBeenCalledTimes(5)
      expect(replace).toHaveBeenCalledTimes(hash ? 0 : 1)
      act(() => history.back())
      await at('NOG-C')
      act(() => history.back())
      await at('NOG-B')
    } finally {
      view.unmount()
      history.destroy()
      client.clear()
    }
  })

  it('resolves from cached server reads after the read hook reconciles them', () => {
    state.realReads = true
    vi.mocked(useLessonReads).mockImplementation(realUseLessonReads)
    const client = makeClient()
    client.setQueryData(['lesson-reads'], ['NOG-A', 'NOG-B'])
    render(
      <QueryClientProvider client={client}>
        <FolioUppslag section="NOG" navigateHref={navigateHref} />
      </QueryClientProvider>,
    )
    expect(screen.getByTestId('fa-uppslag-entry-NOG-C')).toHaveAttribute('aria-current', 'page')
    expect(navigateHref).toHaveBeenCalledExactlyOnceWith('/lektion?section=NOG#NOG-C', {
      replace: true,
    })
  })

  it('falls back to local reads when the server read request fails', async () => {
    state.realReads = true
    vi.mocked(useLessonReads).mockImplementation(realUseLessonReads)
    localStorage.setItem('hpc-lesson-read-NOG-A', '1')
    state.getReads.mockRejectedValue(new Error('offline'))
    mount('NOG')
    await waitFor(() =>
      expect(screen.getByTestId('fa-uppslag-entry-NOG-B')).toHaveAttribute('aria-current', 'page'),
    )
  })

  it('shows neutral loading, empty and failed states', async () => {
    state.load.mockImplementation(() => new Promise(() => {}))
    const { client } = mount('NOG', true)
    expect(screen.getByRole('status')).toHaveTextContent('Laddar')
    act(() => client.setQueryData(['folio-lesson', 'NOG'], null))
    await waitFor(() => expect(screen.getByText('Inget innehåll här ännu.')).toBeInTheDocument())
  })

  it('reports a failed catalog without pretending it is empty', async () => {
    state.load.mockRejectedValue(new Error('catalog unavailable'))
    mount('NOG', true)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/Gick inte att hämta/))
    expect(screen.queryByText('Inget innehåll här ännu.')).toBeNull()
  })

  it('shares the eight framework cache entries across page turns and section changes', async () => {
    const { rerender, ui } = mount('NOG', true)
    await screen.findByTestId('fa-lesson')
    expect(state.load.mock.calls.map(([s]) => s)).toEqual(SECTION_KEYS)
    fireEvent.keyDown(document.body, { key: 'j' })
    rerender(ui('LÄS'))
    await screen.findByText('Frågetyp 1 av 8')
    expect(state.load).toHaveBeenCalledTimes(8)
    expect(screen.getByTestId('fa-uppslag-entry-LAS-1')).toHaveAttribute('aria-current', 'page')
  })

  it('does not offer examples or entry practice when all questions are held out', async () => {
    const { client } = mount('NOG')
    act(() =>
      client.setQueryData(['folio-lesson', 'NOG'], {
        ...trap,
        entries: [{ ...trap.entries[0], example_questions: [[...WORKED_EXAMPLE_QIDS][0]] }],
      }),
    )
    await waitFor(() => expect(screen.queryByTestId('lesson-practice-link')).toBeNull())
    expect(screen.queryByRole('region', { name: 'Exempelfrågor' })).toBeNull()
    expect(screen.getByTestId('section-practice-all')).toHaveAttribute(
      'href',
      '/drill?section=NOG&start=1',
    )
  })

  it('preserves modified link clicks and focuses a contents entry after normal navigation', () => {
    state.hash = 'NOG-A'
    mount('NOG')
    const link = screen.getByTestId('fa-uppslag-entry-NOG-B')
    fireEvent.click(link, { ctrlKey: true })
    fireEvent.click(link, { metaKey: true })
    expect(navigateHref).not.toHaveBeenCalled()
    fireEvent.click(link)
    expect(navigateHref).toHaveBeenCalledExactlyOnceWith('/lektion?section=NOG#NOG-B')
    expect(screen.getByTestId('fa-lesson')).toHaveFocus()
  })

  it.each([
    {
      section: 'DTK',
      family: 'dtk_tactics',
      entry: { tactic: 'Läs axeln', when_to_apply: 'När enheten är tusental.' },
      heading: 'Igenkänningstecken',
      text: 'När enheten är tusental.',
    },
    {
      section: 'MEK',
      family: 'mek_protocol',
      entry: { constraint_type: 'Kollokation', rule: 'Pröva verbet med objektet.' },
      heading: 'Mönsterregel',
      text: 'Pröva verbet med objektet.',
    },
    {
      section: 'ELF',
      family: 'elf_taxonomy',
      entry: {
        question_type: 'Slutsats',
        attack_protocol: ['Sök stöd för ”according to the text”.'],
        common_distractors: [],
      },
      heading: 'Angreppsprotokoll',
      text: 'Sök stöd för ”according to the text”.',
    },
  ] as const)('renders the $section prose verbatim in its named region', async ({
    section,
    family,
    entry,
    heading,
    text,
  }) => {
    const { client } = mount(section)
    act(() =>
      client.setQueryData(['folio-lesson', section], {
        section,
        family,
        version: 1,
        authored_at: '',
        entries: [{ id: `${section}-A`, example_questions: [], ...entry }],
      }),
    )
    expect(await screen.findByRole('region', { name: heading })).toHaveTextContent(text)
    expect(state.worked).toHaveBeenCalledWith(`${section}-A`)
  })

  it('renders the conditional repetition link and distinguishes an empty index from loading', async () => {
    state.due = [{}]
    const { client } = mount()
    expect(screen.getByTestId('lektion-repetition')).toHaveAttribute('href', '/repetition')
    act(() => {
      for (const s of SECTION_KEYS) client.setQueryData(['folio-lesson', s], null)
    })
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Inget innehåll här ännu.'),
    )
  })

  it('keeps the route classic outside Folio and keeps Provteknik classic inside it', async () => {
    const Component = Route.options.component as ComponentType
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const ui = (host: boolean) => (
      <QueryClientProvider client={client}>
        <FolioHostContext.Provider value={host}>
          <Component />
        </FolioHostContext.Provider>
      </QueryClientProvider>
    )
    const { rerender } = render(ui(false))
    expect(screen.getByTestId('classic-shell')).toBeInTheDocument()
    rerender(ui(true))
    expect(await screen.findByTestId('folio-uppslag')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: /Provteknik/ }))
    expect(state.navigate).toHaveBeenCalledWith({
      to: '/lektion',
      search: { chapter: 'provteknik' },
      hash: '',
    })
    state.search = { chapter: 'provteknik' }
    rerender(ui(true))
    expect(screen.getByText('Classic Provteknik')).toBeInTheDocument()
    expect(screen.queryByTestId('folio-uppslag')).toBeNull()
    state.search = { section: 'NOG' }
    rerender(ui(false))
    expect(screen.getByText('Classic lesson')).toBeInTheDocument()
  })

  it.each(['index', 'lesson', 'end'] as const)('has no axe violations on the %s', async (page) => {
    if (page === 'end') state.reads = trap.entries.map((e) => e.id)
    const { container } = mount(page === 'index' ? undefined : 'NOG')
    if (page === 'end') fireEvent.click(screen.getByRole('button', { name: 'Till kapitlets slut' }))
    const axe = (await import('axe-core')).default
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(
      result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([])
  })
})

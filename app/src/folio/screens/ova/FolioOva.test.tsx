import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ComponentType, type ReactNode, StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TopTrap } from '@/api/hooks/useTopTraps'
import { SECTION_KEYS } from '@/data/questions'
import { FolioHostContext } from '@/folio/host'
import type { SectionStats } from '@/lib/scoring'
import { Route } from '@/routes/ova'
import { useUiStore } from '@/stores/uiStore'
import FolioOva, { type FolioOvaProps } from './FolioOva'

const extras = vi.hoisted(() => ({
  viewport: 'studio',
  smartDrill: true,
  topTraps: [] as TopTrap[],
  trapNames: {} as Record<string, string>,
}))
vi.mock('./useOvaExtras', () => ({ useOvaExtras: () => extras }))
const loadFramework = vi.hoisted(() => vi.fn())
vi.mock('@/api/hooks/useTopTraps', () => ({ useTopTraps: () => extras.topTraps }))
vi.mock('@/data/frameworks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/data/frameworks')>()),
  loadFramework,
}))
const routeState = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  useNavigate: () => routeState.navigate,
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a {...props} href={to}>
      {children}
    </a>
  ),
}))
vi.mock('@/api/hooks/useStats', () => ({ useStats: () => ({ data: undefined, isPending: true }) }))
vi.mock('@/api/hooks/useMistakes', () => ({
  useDueMistakes: () => ({ data: [], isPending: false }),
  usePileMistakes: () => ({ data: [], isPending: false }),
}))
vi.mock('@/lib/motion', () => ({
  useArketMotion: () => ({ rm: true }),
  useFirstContentSignal: vi.fn(),
  sectionDoorLayoutId: (s: string) => s,
}))
vi.mock('@/components/MobileFrame', () => ({
  MobileFrame: ({ children }: { children: ReactNode }) => (
    <div data-testid="classic-ova">{children}</div>
  ),
}))
vi.mock('@/components/Page', () => ({ Page: ({ children }: { children: ReactNode }) => children }))
vi.mock('@/components/drill/DrillRailSection', () => ({
  DrillRailSection: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}))
vi.mock('@/components/motion/Skrift', () => ({
  Skrift: ({ children }: { children: ReactNode }) => children,
  SkriftLine: ({ children }: { children: ReactNode }) => children,
  InkDryOnMount: ({ children }: { children: ReactNode }) => children,
}))
const navigateHref = vi.fn()
const rows = (section: string, count: number) =>
  Array.from({ length: count }, (_, i) => ({ questionId: `2025-v-p1-${section}-${i + 1}` }))
const props = (overrides: Partial<FolioOvaProps> = {}): FolioOvaProps => ({
  stats: { data: { attempts: { total: 0 }, mistakes: { resolved: 0 }, bySection: {} } },
  due: { data: [] },
  pile: { data: [] },
  navigateHref,
  ...overrides,
})
beforeEach(() => {
  navigateHref.mockClear()
  routeState.navigate.mockClear()
  extras.viewport = 'studio'
  extras.smartDrill = true
  extras.topTraps = []
  extras.trapNames = {}
  loadFramework.mockReset()
})

describe('Folio Öva screen', () => {
  it('keeps exam order as the suggested section changes and explains a small score sample', () => {
    const sample: SectionStats = {
      attempts7d: 2,
      correct7d: 1,
      attempts7to14d: 0,
      correct7to14d: 0,
      attempts90d: 2,
      correct90d: 1,
      attemptsToday: 0,
      avgTimeMs: null,
      lastAttemptedAt: Date.now(),
      firstTry7d: 2,
      firstTryCorrect7d: 1,
      firstTry7to14d: 0,
      firstTryCorrect7to14d: 0,
      firstTry90d: 2,
      firstTryCorrect90d: 1,
    }
    const withSuggestion = (section: 'ORD' | 'KVA') =>
      props({
        stats: {
          data: {
            attempts: { total: 2 },
            mistakes: { resolved: 0 },
            bySection: { [section]: sample },
          },
        },
      })
    const { container, rerender } = render(<FolioOva {...withSuggestion('KVA')} />)
    expect(screen.getByRole('link', { name: 'Börja med KVA' })).toHaveClass('fa-btn')
    expect(
      within(screen.getByTestId('ova-section-KVA')).getByText('underlag: 2 svar'),
    ).toBeInTheDocument()
    expect(within(screen.getByTestId('ova-section-KVA')).getByText('1,0')).toBeInTheDocument()
    expect(screen.getByTestId('ova-section-KVA')).toHaveAccessibleName(/föreslagen/)
    expect(within(screen.getByTestId('ova-section-KVA')).getByText('föreslagen')).toBeVisible()
    expect(screen.getAllByText('föreslagen')).toHaveLength(1)
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(navigateHref).toHaveBeenLastCalledWith('/drill?section=KVA&start=1')
    rerender(<FolioOva {...withSuggestion('ORD')} />)
    expect(screen.getAllByTestId(/^ova-section-/).map((a) => a.dataset.testid)).toEqual(
      SECTION_KEYS.map((s) => `ova-section-${s}`),
    )
    expect(screen.getByRole('link', { name: 'Börja med ORD' })).toHaveClass('fa-btn')
    expect(within(screen.getByTestId('ova-section-ORD')).getByText('föreslagen')).toBeVisible()
    expect(within(screen.getByTestId('ova-section-KVA')).queryByText('föreslagen')).toBeNull()
    expect(screen.getAllByText('föreslagen')).toHaveLength(1)
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(navigateHref).toHaveBeenLastCalledWith('/drill?section=ORD&start=1')
    expect(container.querySelectorAll('.fa-btn')).toHaveLength(1)
    expect(container.textContent).not.toMatch(/svagast|avsluta|sluta|stopp/i)
  })

  it('renders the named trap with neutral trend text and a working practice link', () => {
    extras.topTraps = [
      {
        framework_id: 'KVA-TRAP-001',
        section: 'KVA',
        count: 3,
        headline: 'Pröva flera värden.',
        trend: { kind: 'delta', delta: 2, daysAgo: 7 },
      },
    ]
    extras.trapNames = { 'KVA-TRAP-001': 'Teckenbyte' }
    render(<FolioOva {...props()} />)
    const margin = screen.getByRole('complementary')
    expect(within(margin).getByText('3 gånger · ↑ ökar')).toBeInTheDocument()
    expect(within(margin).getByRole('link', { name: 'Teckenbyte' })).toHaveAttribute(
      'href',
      '/drill?section=KVA&framework=KVA-TRAP-001&start=1',
    )
    fireEvent.click(within(margin).getByRole('link', { name: /Öva detta mönster/ }))
    expect(navigateHref).toHaveBeenCalledExactlyOnceWith(
      '/drill?section=KVA&framework=KVA-TRAP-001&start=1',
    )
    expect(within(margin).getByRole('link', { name: /Ändra i inställningarna/ })).toHaveAttribute(
      'href',
      '/mer',
    )
  })

  it('loads trap names once per section and follows the live preference in the real extras hook', async () => {
    const { useOvaExtras } =
      await vi.importActual<typeof import('./useOvaExtras')>('./useOvaExtras')
    extras.topTraps = [
      {
        framework_id: 'KVA-TRAP-001',
        section: 'KVA',
        count: 3,
        headline: null,
        trend: { kind: 'unknown' },
      },
      {
        framework_id: 'KVA-TRAP-002',
        section: 'KVA',
        count: 2,
        headline: null,
        trend: { kind: 'unknown' },
      },
    ]
    loadFramework.mockResolvedValue({
      family: 'kva_traps',
      entries: [
        { id: 'KVA-TRAP-001', pattern_description: 'Teckenbyte' },
        { id: 'KVA-TRAP-002', pattern_description: 'Noll och negativa tal' },
      ],
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const previous = useUiStore.getState().smartDrill
    useUiStore.setState({ smartDrill: true })
    const { result, rerender, unmount } = renderHook(useOvaExtras, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    })
    try {
      await waitFor(() => expect(result.current.trapNames['KVA-TRAP-001']).toBe('Teckenbyte'))
      expect(result.current.trapNames['KVA-TRAP-002']).toBe('Noll och negativa tal')
      expect(loadFramework).toHaveBeenCalledExactlyOnceWith('KVA')
      act(() => useUiStore.setState({ smartDrill: false }))
      expect(result.current.smartDrill).toBe(false)
      extras.topTraps = []
      rerender()
      expect(result.current.trapNames).toEqual({})
    } finally {
      unmount()
      client.clear()
      useUiStore.setState({ smartDrill: previous })
    }
  })

  it('keeps every section, mixed, words, timed and repetition entry as a native anchor', () => {
    render(
      <FolioOva {...props({ pile: { data: rows('ORD', 3) }, due: { data: rows('ORD', 1) } })} />,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Vad tränar vi?')
    expect(screen.getAllByTestId(/^ova-section-/).map((a) => a.dataset.testid)).toEqual(
      SECTION_KEYS.map((s) => `ova-section-${s}`),
    )
    for (const s of SECTION_KEYS) {
      const link = screen.getByTestId(`ova-section-${s}`)
      expect(link.tagName).toBe('A')
      expect(link).toHaveAttribute('href', `/drill?section=${encodeURIComponent(s)}&start=1`)
    }
    expect(screen.getByTestId('ova-due-ORD')).toHaveTextContent('3 missar väntar i Repetera')
    expect(screen.getByTestId('ova-rep-ORD')).toHaveAttribute(
      'href',
      '/repetition?section=ORD&start=1',
    )
    expect(screen.getByTestId('ova-rep-ORD')).toHaveTextContent('1 redo nu')
    expect(screen.getByTestId('ova-repetition')).toHaveAttribute('href', '/repetition?start=1')
    expect(screen.getByTestId('ova-mixed')).toHaveAttribute('href', '/drill?mixed=1&start=1')
    expect(screen.getByRole('link', { name: 'Ordbank · 10 ord' })).toHaveAttribute(
      'href',
      '/drill?section=ORD&words=1&start=1',
    )
    expect(screen.getByRole('link', { name: 'ORD på tid · 10 frågor, 3 min' })).toHaveAttribute(
      'href',
      '/drill?section=ORD&timed=1&start=1',
    )
    expect(screen.getByRole('link', { name: 'En LÄS-text på tid · ca 9 min' })).toHaveAttribute(
      'href',
      '/drill?section=L%C3%84S&timed=1&start=1',
    )
    expect(screen.getByRole('link', { name: /Välj delprov · 1 redo nu/ })).toHaveAttribute(
      'href',
      '/repetition',
    )
  })

  it('has one filled action, starts it once with Enter and releases the listener on unmount', () => {
    const { container, unmount } = render(
      <StrictMode>
        <FolioOva {...props({ pile: { data: rows('ORD', 2) }, due: { data: rows('ORD', 2) } })} />
      </StrictMode>,
    )
    expect(container.querySelectorAll('.fa-btn')).toHaveLength(1)
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(navigateHref).toHaveBeenCalledExactlyOnceWith('/repetition?start=1')
    unmount()
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(navigateHref).toHaveBeenCalledTimes(1)
  })

  it.each([
    'all',
    'stats',
    'pile',
    'due',
  ] as const)('keeps the lead neutral and Enter inactive while %s loads, including after a ready render', (key) => {
    const ready = props({ pile: { data: rows('ORD', 2) }, due: { data: rows('ORD', 1) } })
    const loading = {
      ...ready,
      ...(key === 'all'
        ? { stats: { isPending: true }, pile: { isPending: true }, due: { isPending: true } }
        : { [key]: { isPending: true } }),
    }
    const { container, rerender } = render(<FolioOva {...loading} />)
    expect(fireEvent.keyDown(document.body, { key: 'Enter' })).toBe(true)
    expect(navigateHref).not.toHaveBeenCalled()
    expect(container.querySelectorAll('.fa-btn, .fa-kbd')).toHaveLength(0)
    expect(screen.getByRole('heading', { level: 2, name: /Laddar/ })).toBeVisible()
    expect(screen.getByTestId('ova-repetition')).toHaveAttribute('href', '/repetition')

    rerender(<FolioOva {...ready} />)
    expect(screen.getByRole('link', { name: 'Börja repetera' })).toHaveClass('fa-btn')
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(navigateHref).toHaveBeenCalledExactlyOnceWith('/repetition?start=1')
    navigateHref.mockClear()

    rerender(<FolioOva {...loading} />)
    expect(fireEvent.keyDown(document.body, { key: 'Enter' })).toBe(true)
    expect(navigateHref).not.toHaveBeenCalled()
    expect(container.querySelectorAll('.fa-btn, .fa-kbd')).toHaveLength(0)
  })

  it.each([
    'stats',
    'pile',
    'due',
  ] as const)('retains the visible queue and counts after a failed %s background refetch', (key) => {
    const cached = props({ pile: { data: rows('ORD', 2) } })
    const { rerender } = render(<FolioOva {...cached} />)
    const queueLine = 'Inget är redo just nu — 2 missar i dagens hög blir redo senare.'
    expect(screen.getByText(queueLine)).toBeVisible()
    rerender(<FolioOva {...cached} {...{ [key]: { ...cached[key], isError: true } }} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText(queueLine)).toBeVisible()
    expect(screen.getByTestId('ova-due-ORD')).toHaveTextContent('2 missar väntar i Repetera')
    expect(screen.getByRole('link', { name: 'Börja blandad övning' })).toHaveClass('fa-btn')
    expect(screen.queryByText('föreslagen')).not.toBeInTheDocument()
  })

  it('preserves Enter on focused links and modified clicks', async () => {
    const user = userEvent.setup()
    render(<FolioOva {...props()} />)
    const link = screen.getByTestId('ova-section-ORD')
    link.focus()
    await user.keyboard('{Enter}')
    expect(navigateHref).toHaveBeenCalledExactlyOnceWith('/drill?section=ORD&start=1')
    navigateHref.mockClear()
    fireEvent.click(link, { ctrlKey: true })
    fireEvent.click(link, { metaKey: true })
    fireEvent.keyDown(document.body, { key: 'Enter', ctrlKey: true })
    fireEvent.keyDown(document.body, { key: 'Enter', repeat: true })
    fireEvent.keyDown(document.body, { key: 'Enter', isComposing: true })
    expect(navigateHref).not.toHaveBeenCalled()
  })

  it('does not start practice from a form, dialog, or inert page', () => {
    const { container } = render(
      <>
        <input aria-label="Sök" />
        <div data-testid="page">
          <FolioOva {...props()} />
        </div>
      </>,
    )
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })
    expect(navigateHref).not.toHaveBeenCalled()
    const page = screen.getByTestId('page')
    page.setAttribute('inert', '')
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(navigateHref).not.toHaveBeenCalled()
    page.removeAttribute('inert')
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    container.appendChild(dialog)
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(navigateHref).not.toHaveBeenCalled()
  })

  it('keeps Repetera clickable and never uses forbidden encouragement or urgency copy', () => {
    const { container } = render(<FolioOva {...props()} />)
    const link = screen.getByTestId('ova-repetition')
    expect(link).toHaveAttribute('href', '/repetition')
    expect(link).not.toHaveAttribute('aria-disabled')
    fireEvent.click(link)
    expect(navigateHref).toHaveBeenCalledExactlyOnceWith('/repetition')
    expect(container.textContent).not.toMatch(/svagast|avsluta|sluta|stopp/i)
    expect(container.querySelectorAll('.fa-btn')).toHaveLength(1)
    expect(screen.getByText(/— betyder/)).toBeInTheDocument()
  })

  it.each([
    'stats',
    'pile',
    'due',
  ] as const)('shows loading and retry instead of an empty queue for %s', (key) => {
    const { container, rerender } = render(<FolioOva {...props({ [key]: { isPending: true } })} />)
    expect(screen.getByRole('status')).toHaveTextContent(/Laddar/)
    expect(container.textContent).not.toMatch(/Kön är tom|återlärt|Inga missar än/)
    rerender(<FolioOva {...props({ [key]: { isError: true } })} />)
    expect(screen.getByRole('status')).toHaveTextContent(
      'Gick inte att hämta just nu — försöker igen automatiskt.',
    )
    expect(container.textContent).not.toMatch(/Kön är tom|återlärt|Inga missar än/)
    expect(screen.getByTestId('ova-repetition')).not.toHaveAttribute('aria-disabled')
  })

  it('uses the phone layout and live smart/slumpat preference', () => {
    extras.viewport = 'phone'
    extras.smartDrill = false
    render(<FolioOva {...props()} />)
    expect(screen.getByTestId('folio-ova')).toHaveClass('fa-phome')
    expect(within(screen.getByRole('complementary')).getByText('slumpat')).toBeInTheDocument()
  })

  it('switches the route after its hooks and retains classic Öva outside the Folio host', async () => {
    const Component = Route.options.component as ComponentType
    const { rerender } = render(
      <FolioHostContext.Provider value={false}>
        <Component />
      </FolioHostContext.Provider>,
    )
    expect(screen.getByTestId('classic-ova')).toBeInTheDocument()
    expect(screen.queryByTestId('folio-ova')).not.toBeInTheDocument()
    rerender(
      <FolioHostContext.Provider value={true}>
        <Component />
      </FolioHostContext.Provider>,
    )
    expect(await screen.findByTestId('folio-ova')).toBeInTheDocument()
    expect(screen.queryByTestId('classic-ova')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Ordbank · 10 ord' }))
    expect(routeState.navigate).toHaveBeenCalledWith({
      to: '/drill',
      search: { section: 'ORD', words: '1', start: '1' },
      hash: '',
    })
    rerender(
      <FolioHostContext.Provider value={false}>
        <Component />
      </FolioHostContext.Provider>,
    )
    expect(screen.getByTestId('classic-ova')).toBeInTheDocument()
  })
})

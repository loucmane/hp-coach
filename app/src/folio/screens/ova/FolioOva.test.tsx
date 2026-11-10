import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ReactNode, StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Framework } from '@/data/frameworks'
import { SECTION_KEYS } from '@/data/questions'
import { useFolioPrefs } from '@/folio/lib/folioPrefs'
import { type DailyPlan, PLAN_SCHEMA_VERSION } from '@/lib/scheduler'
import { useUiStore } from '@/stores/uiStore'
import { runAxe } from '@/test/a11y'
import FolioOva, { type FolioOvaProps } from './FolioOva'

const h = vi.hoisted(() => ({
  viewport: 'studio',
  smartDrill: true,
  setSmartDrill: vi.fn(),
  saving: false,
  preferenceError: false,
  plan: { data: null as DailyPlan | null, isPending: false, isError: false },
  lesson: {
    data: { section: 'KVA', frameworkId: 'KVA-TRAP-001' } as {
      section: string
      frameworkId: string
    } | null,
  },
  reads: { data: new Set<string>() },
  catalogs: {} as Partial<Record<string, Framework>>,
  loadFramework: vi.fn(),
  synced: vi.fn(),
}))
vi.mock('./useOvaExtras', () => ({ useOvaExtras: () => h }))
vi.mock('@/hooks/useDailyPlan', () => ({
  useDailyPlan: () => ({ plan: h.plan.data, isLoading: h.plan.isPending, isError: h.plan.isError }),
}))
vi.mock('@/api/hooks/useLessonProgress', () => ({ useLessonProgress: () => h.lesson }))
vi.mock('@/api/hooks/useLessonReadsApi', () => ({
  useLessonReadsQuery: () => ({ data: [...h.reads.data], isPending: false }),
}))
vi.mock('@/hooks/useLessonReads', () => ({ useLessonReads: () => ({ reads: h.reads.data }) }))
vi.mock('@/api/useSyncedPrefs', () => ({ useSyncedPrefs: () => ({ setSmartDrill: h.synced }) }))
vi.mock('@/data/frameworks', async (original) => ({
  ...(await original<typeof import('@/data/frameworks')>()),
  loadFramework: h.loadFramework,
}))
vi.mock('@/lib/motion', () => ({ useFirstContentSignal: vi.fn() }))
const navigateHref = vi.fn()
const props = (overrides: Partial<FolioOvaProps> = {}): FolioOvaProps => ({
  stats: { data: { attempts: { total: 0 }, mistakes: { resolved: 0 }, bySection: {} } },
  due: { data: Array.from({ length: 17 }, (_, i) => ({ questionId: `2025-v-p1-KVA-${i}` })) },
  pile: { data: [] },
  navigateHref,
  ...overrides,
})
const renderPage = (p = props(), kbd = 'on') =>
  render(
    <StrictMode>
      <div data-folio data-kbd={kbd}>
        <FolioOva {...p} />
      </div>
    </StrictMode>,
  )
beforeEach(() => {
  navigateHref.mockReset()
  h.setSmartDrill.mockReset()
  h.synced.mockReset().mockResolvedValue(undefined)
  h.loadFramework.mockReset()
  h.viewport = 'studio'
  h.smartDrill = true
  h.saving = false
  h.preferenceError = false
  h.plan = {
    data: {
      version: PLAN_SCHEMA_VERSION,
      date: '2026-11-05',
      estimatedMinutes: 4,
      items: [
        {
          id: 'lesson',
          kind: 'lesson',
          section: 'KVA',
          framework: 'KVA-TRAP-001',
          headline: 'SECRET ANSWER',
          rationale: 'SECRET RATIONALE',
          estimatedMinutes: 4,
          href: '/lektion?section=KVA#KVA-TRAP-001',
          completed: false,
        },
      ],
    },
    isPending: false,
    isError: false,
  }
  h.lesson = { data: { section: 'KVA', frameworkId: 'KVA-TRAP-001' } }
  h.reads = { data: new Set() }
  h.catalogs = {
    KVA: {
      section: 'KVA',
      family: 'kva_traps',
      version: 1,
      authored_at: '',
      entries: [
        {
          id: 'KVA-TRAP-001',
          question_title: 'Vilken kvantitet är störst?',
          pattern_description: 'SECRET ANSWER',
          why_it_occurs: '',
          countermeasure: '',
          common_distractor_signature: '',
          example_questions: [],
        },
      ],
    },
  }
  useFolioPrefs.setState({ kbd: true })
})

describe('Ljusbord Öva', () => {
  it('has one lit suggestion and one Go, real chain controls and the due count', () => {
    const { container } = renderPage()
    expect(container.querySelectorAll('[data-lit="true"]')).toHaveLength(1)
    expect(container.querySelectorAll('.fa-ui-go')).toHaveLength(1)
    expect(screen.getByText('Föreslaget')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Vilken kvantitet är störst?' })).toHaveAttribute(
      'href',
      '/lektion?section=KVA#KVA-TRAP-001',
    )
    expect(screen.getByRole('group', { name: 'Antal frågor' })).toBeVisible()
    expect(screen.getByTestId('ova-repetition')).toHaveTextContent('17 är redo')
    expect(container.textContent).not.toMatch(
      /SECRET|svit|streak|sluta|avsluta|stopp|startar av sig själva/i,
    )
  })
  it('switches the completed lesson to the family drill and updates its size, estimate and URL', () => {
    h.reads.data.add('KVA-TRAP-001')
    const { container } = renderPage()
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Antal frågor' })).getByRole('button', {
        name: '20',
      }),
    )
    const go = container.querySelector<HTMLAnchorElement>('.fa-ui-go')!
    expect(new URL(go.href).searchParams.get('count')).toBe('20')
    expect(go.textContent).toContain('12 min')
    expect(go).toHaveAttribute('href', expect.stringContaining('traps=KVA-TRAP-001'))
    fireEvent.click(go)
    expect(navigateHref).toHaveBeenCalledExactlyOnceWith(go.getAttribute('href'))
  })
  it('keeps the first action on the lesson when the second step length changes', () => {
    const { container } = renderPage()
    fireEvent.click(screen.getByRole('button', { name: '5' }))
    expect(container.querySelector('.fa-ui-go')).toHaveAttribute(
      'href',
      '/lektion?section=KVA#KVA-TRAP-001',
    )
    expect(screen.getByRole('link', { name: /Frågor med fällorna 1–12/ })).toHaveAttribute(
      'href',
      expect.stringContaining('count=5'),
    )
  })
  it('renders section doors in exam order, format links and the working preference segment', () => {
    renderPage()
    expect(screen.getAllByTestId(/^ova-section-/).map((a) => a.dataset.testid)).toEqual(
      SECTION_KEYS.map((s) => `ova-section-${s}`),
    )
    for (const section of SECTION_KEYS)
      expect(screen.getByTestId(`ova-section-${section}`)).toHaveAttribute(
        'href',
        `/drill?section=${encodeURIComponent(section)}&start=1`,
      )
    for (const name of [
      'Välj själv',
      'Andra format',
      'Frågeurval',
      'Så funkar ett pass',
      'Gissa hellre',
    ])
      expect(screen.getByRole('heading', { name })).toBeVisible()
    expect(screen.getByRole('link', { name: /Ordbanken/ })).toHaveAttribute(
      'href',
      '/drill?section=ORD&words=1&start=1',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Slumpat' }))
    expect(h.setSmartDrill).toHaveBeenCalledExactlyOnceWith(false)
  })
  it('only handles Enter inside the suggestion, respects preferences and releases on unmount', () => {
    const { unmount } = renderPage()
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(navigateHref).not.toHaveBeenCalled()
    const region = screen.getByTestId('ova-suggestion')
    region.focus()
    fireEvent.keyDown(region, { key: 'Enter' })
    expect(navigateHref).toHaveBeenCalledTimes(1)
    for (const event of [{ ctrlKey: true }, { repeat: true }, { isComposing: true }])
      fireEvent.keyDown(region, { key: 'Enter', ...event })
    act(() => useFolioPrefs.setState({ kbd: false }))
    fireEvent.keyDown(region, { key: 'Enter' })
    expect(navigateHref).toHaveBeenCalledTimes(1)
    unmount()
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(navigateHref).toHaveBeenCalledTimes(1)
  })
  it('preserves native link Enter, modified clicks, and typing/modal/inert targets', async () => {
    const user = userEvent.setup()
    renderPage()
    const link = screen.getByTestId('ova-section-ORD')
    link.focus()
    await user.keyboard('{Enter}')
    expect(navigateHref).toHaveBeenCalledExactlyOnceWith('/drill?section=ORD&start=1')
    navigateHref.mockClear()
    fireEvent.click(link, { ctrlKey: true })
    const region = screen.getByTestId('ova-suggestion')
    const input = document.createElement('input')
    region.appendChild(input)
    fireEvent.keyDown(input, { key: 'Enter' })
    region.setAttribute('inert', '')
    fireEvent.keyDown(region, { key: 'Enter' })
    region.removeAttribute('inert')
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    region.appendChild(dialog)
    fireEvent.keyDown(region, { key: 'Enter' })
    expect(navigateHref).not.toHaveBeenCalled()
  })
  it('uses one dock action on phone and shows neutral loading without an active shortcut', () => {
    h.viewport = 'phone'
    const { container, rerender } = renderPage()
    expect(container.querySelectorAll('.fa-ui-go[data-dock]')).toHaveLength(1)
    h.plan.isPending = true
    h.plan.data = null
    rerender(
      <div data-folio>
        <FolioOva {...props()} />
      </div>,
    )
    expect(container.querySelectorAll('[data-lit="true"]')).toHaveLength(1)
    expect(container.querySelector('.fa-ui-go')).toBeDisabled()
    fireEvent.keyDown(screen.getByTestId('ova-suggestion'), { key: 'Enter' })
    expect(navigateHref).not.toHaveBeenCalled()
  })
  it('passes axe with the lesson chain and family-only state', async () => {
    const { container, rerender } = renderPage()
    expect(await runAxe(container)).toEqual([])
    h.reads.data.add('KVA-TRAP-001')
    rerender(
      <div data-folio>
        <FolioOva {...props()} />
      </div>,
    )
    expect(await runAxe(container)).toEqual([])
  })
  it('loads catalog data behind the lazy hook and saves Frågeurval through synced prefs', async () => {
    const { useOvaExtras } =
      await vi.importActual<typeof import('./useOvaExtras')>('./useOvaExtras')
    h.loadFramework.mockResolvedValue(h.catalogs.KVA)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result, unmount } = renderHook(useOvaExtras, {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    })
    await waitFor(() => expect(result.current.catalogs.KVA).toEqual(h.catalogs.KVA))
    expect(h.loadFramework).toHaveBeenCalledExactlyOnceWith('KVA')
    await act(async () => {
      await result.current.setSmartDrill(false)
    })
    expect(h.synced).toHaveBeenCalledExactlyOnceWith(false)
    unmount()
    client.clear()
    useUiStore.setState({ smartDrill: true })
  })
})

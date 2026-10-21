import { readFileSync } from 'node:fs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import type { FunctionComponent, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@clerk/clerk-react', () => ({ useAuth: vi.fn() }))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/lektion">{children}</a>,
  createFileRoute: () => (options: unknown) => ({ options }),
  useNavigate: () => vi.fn(),
}))
vi.mock('@/api/hooks/useFrameworkProgress', () => ({ useFrameworkProgress: vi.fn() }))
vi.mock('@/api/hooks/useStats', () => ({
  useStats: () => ({ data: undefined, isPending: true, isError: false }),
}))
vi.mock('@/data/frameworks', () => ({ loadFramework: vi.fn() }))
vi.mock('@/components/MobileFrame', () => ({
  MobileFrame: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/Page', () => ({
  Page: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

import { useAuth } from '@clerk/clerk-react'

import { useFrameworkProgress } from '@/api/hooks/useFrameworkProgress'
import { type Framework, loadFramework } from '@/data/frameworks'
import { SECTION_KEYS } from '@/data/questions'
import type { FrameworkProgressRow } from '@/lib/frameworkProgress'
import { rememberPatternsHeld } from '@/lib/patternsHeld'
import { Route } from '@/routes/progress'

import { ProgressMobile } from './ProgressMobile'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('Framsteg — mönster som sitter', () => {
  it('renders the quiet Swedish count, including a real zero', () => {
    const { rerender } = render(<ProgressMobile patternsHeld={{ mastered: 0, total: 221 }} />)
    expect(screen.getByText('Mönster som sitter: 0 av 221')).toBeInTheDocument()
    rerender(<ProgressMobile patternsHeld={{ mastered: 14, total: 221 }} />)
    expect(screen.getByText('Mönster som sitter: 14 av 221')).toBeInTheDocument()
  })

  it('does not fabricate a count before the optional summary arrives', () => {
    render(<ProgressMobile />)
    expect(screen.queryByText(/Mönster som sitter/)).not.toBeInTheDocument()
  })

  it('never visibly lowers the count after decay or a remount', () => {
    const first = render(
      <ProgressMobile userId="user-a" patternsHeld={{ mastered: 14, total: 221 }} />,
    )
    first.rerender(<ProgressMobile userId="user-a" patternsHeld={{ mastered: 3, total: 221 }} />)
    expect(screen.getByText('Mönster som sitter: 14 av 221')).toBeInTheDocument()
    first.unmount()
    render(<ProgressMobile userId="user-a" patternsHeld={{ mastered: 3, total: 221 }} />)
    expect(screen.getByText('Mönster som sitter: 14 av 221')).toBeInTheDocument()
  })

  it('keeps its mounted high-water mark when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { rerender } = render(
      <ProgressMobile userId="user-a" patternsHeld={{ mastered: 14, total: 221 }} />,
    )
    rerender(<ProgressMobile userId="user-a" patternsHeld={{ mastered: 3, total: 221 }} />)
    expect(screen.getByText('Mönster som sitter: 14 av 221')).toBeInTheDocument()
    rerender(<ProgressMobile userId="user-b" patternsHeld={{ mastered: 0, total: 221 }} />)
    expect(screen.getByText('Mönster som sitter: 0 av 221')).toBeInTheDocument()
  })

  it('resets mounted state when accounts change and restores only their own peak', () => {
    const { rerender } = render(
      <ProgressMobile userId="user-a" patternsHeld={{ mastered: 14, total: 221 }} />,
    )
    rerender(<ProgressMobile userId="user-b" patternsHeld={{ mastered: 0, total: 221 }} />)
    expect(screen.getByText('Mönster som sitter: 0 av 221')).toBeInTheDocument()
    rerender(<ProgressMobile userId="user-a" patternsHeld={{ mastered: 3, total: 221 }} />)
    expect(screen.getByText('Mönster som sitter: 14 av 221')).toBeInTheDocument()
  })

  it('uses only live counts when the user becomes unknown', () => {
    const { rerender } = render(
      <ProgressMobile userId="user-a" patternsHeld={{ mastered: 14, total: 221 }} />,
    )
    rerender(<ProgressMobile patternsHeld={{ mastered: 3, total: 221 }} />)
    expect(screen.getByText('Mönster som sitter: 3 av 221')).toBeInTheDocument()
    rerender(<ProgressMobile patternsHeld={{ mastered: 0, total: 221 }} />)
    expect(screen.getByText('Mönster som sitter: 0 av 221')).toBeInTheDocument()
  })

  it('clamps the displayed peak to a shrinking catalog, including an empty catalog', () => {
    rememberPatternsHeld(14, 'user-a')
    const { rerender } = render(
      <ProgressMobile userId="user-a" patternsHeld={{ mastered: 3, total: 10 }} />,
    )
    expect(screen.getByText('Mönster som sitter: 10 av 10')).toBeInTheDocument()
    rerender(<ProgressMobile userId="user-a" patternsHeld={{ mastered: 0, total: 0 }} />)
    expect(screen.getByText('Mönster som sitter: 0 av 0')).toBeInTheDocument()
    rerender(<ProgressMobile userId="user-a" patternsHeld={{ mastered: 3, total: 221 }} />)
    expect(screen.getByText('Mönster som sitter: 14 av 221')).toBeInTheDocument()
  })
})

describe('Framsteg route — catalog-backed mastery', () => {
  const catalogs = [
    'nog_traps',
    'kva_traps',
    'xyz_traps',
    'mek_protocol',
    'dtk_tactics',
    'ord_roots',
    'las_taxonomy',
    'elf_taxonomy',
  ].map((file) => JSON.parse(readFileSync(`public/frameworks/${file}.json`, 'utf8')) as Framework)
  const entries = catalogs.flatMap<Framework['entries'][number]>((catalog) => catalog.entries)
  const Component = Route.options.component as FunctionComponent
  let client: QueryClient

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ userId: 'user-a' } as ReturnType<typeof useAuth>)
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    vi.mocked(loadFramework)
      .mockReset()
      .mockImplementation(
        async (section) => catalogs.find((catalog) => catalog.section === section) ?? null,
      )
  })
  afterEach(() => client.clear())

  function show(rows: FrameworkProgressRow[] | undefined) {
    vi.mocked(useFrameworkProgress).mockReturnValue({ data: rows } as ReturnType<
      typeof useFrameworkProgress
    >)
    return render(
      <QueryClientProvider client={client}>
        <Component />
      </QueryClientProvider>,
    )
  }

  it('loads every catalog, counts mastered entries only, and ignores unknown ids', async () => {
    show([
      { layer1Id: entries[0].id, status: 'mastered', lastTransitionAt: null },
      { layer1Id: entries[1].id, status: 'learning', lastTransitionAt: null },
      { layer1Id: entries[2].id, status: 'retaining', lastTransitionAt: null },
      { layer1Id: 'not-in-a-catalog', status: 'mastered', lastTransitionAt: null },
    ])
    expect(
      await screen.findByText(`Mönster som sitter: 1 av ${entries.length}`),
    ).toBeInTheDocument()
    expect(loadFramework).toHaveBeenCalledTimes(8)
    expect(
      vi
        .mocked(loadFramework)
        .mock.calls.map(([section]) => section)
        .sort(),
    ).toEqual([...SECTION_KEYS].sort())
  })

  it('shows zero for lesson reads even when every catalog entry has been read', async () => {
    show(
      entries.map((entry) => ({ layer1Id: entry.id, status: 'learning', lastTransitionAt: null })),
    )
    expect(
      await screen.findByText(`Mönster som sitter: 0 av ${entries.length}`),
    ).toBeInTheDocument()
  })

  it('passes the signed-in identity through to the peak counter', async () => {
    rememberPatternsHeld(14, 'user-a')
    rememberPatternsHeld(2, 'user-b')
    vi.mocked(useAuth).mockReturnValue({ userId: 'user-b' } as ReturnType<typeof useAuth>)
    show([])
    expect(
      await screen.findByText(`Mönster som sitter: 2 av ${entries.length}`),
    ).toBeInTheDocument()
  })

  it('uses the live count when the route has no signed-in identity', async () => {
    rememberPatternsHeld(14, 'user-a')
    vi.mocked(useAuth).mockReturnValue({ userId: undefined } as ReturnType<typeof useAuth>)
    show([])
    expect(
      await screen.findByText(`Mönster som sitter: 0 av ${entries.length}`),
    ).toBeInTheDocument()
  })

  it('waits for a real progress response', async () => {
    show(undefined)
    await waitFor(() =>
      expect(client.getQueryState(['framework-catalogs'])?.status).toBe('success'),
    )
    expect(screen.queryByText(/Mönster som sitter/)).not.toBeInTheDocument()
  })

  it('does not substitute a smaller denominator when a catalog is missing', async () => {
    vi.mocked(loadFramework).mockImplementation(async (section) =>
      section === 'ORD' ? null : (catalogs.find((catalog) => catalog.section === section) ?? null),
    )
    show([])
    await waitFor(() => expect(client.getQueryState(['framework-catalogs'])?.status).toBe('error'))
    expect(screen.queryByText(/Mönster som sitter/)).not.toBeInTheDocument()
  })
})

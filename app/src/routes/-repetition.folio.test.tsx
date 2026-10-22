import { act, render, screen } from '@testing-library/react'
import type { FunctionComponent } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActiveSession } from '@/api/hooks/useSessions'
import type { SessionPlayerProps } from '@/components/session/SessionPlayer'
import { FolioHostContext } from '@/folio/host'

const h = vi.hoisted(() => ({
  search: {} as Record<string, unknown>,
  props: null as SessionPlayerProps | null,
  navigate: vi.fn(),
  due: vi.fn(),
  overview: vi.fn(),
  roundSession: null as ActiveSession | null,
}))
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({ options, useSearch: () => h.search }),
  useNavigate: () => h.navigate,
  Link: () => null,
}))
// No pile hook: it belongs exclusively to the lazy screen.
vi.mock('@/api/hooks/useMistakes', () => ({
  useDueMistakes: (section?: string) => {
    h.due(section)
    return { data: [], refetch: vi.fn() }
  },
  useReviewMistake: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/api/hooks/useMockResults', () => ({ useExposure: () => ({ refetch: vi.fn() }) }))
vi.mock('@/api/hooks/useSessions', () => ({
  useActiveSessionOfKind: () => ({ data: h.roundSession }),
}))
vi.mock('@/components/session/SessionPlayer', () => ({
  SessionPlayer: (props: SessionPlayerProps) => {
    h.props = props
    return <div data-testid="session-player" />
  },
}))
vi.mock('@/folio/screens/repetera/FolioRepetera', () => ({
  default: (props: unknown) => {
    h.overview(props)
    return <div data-testid="folio-overview" />
  },
}))

import { Route } from './repetition'

const Screen = Route.options.component as FunctionComponent
const page = (folio = true) => (
  <FolioHostContext.Provider value={folio}>
    <Screen />
  </FolioHostContext.Provider>
)

beforeEach(() => {
  h.search = {}
  h.props = null
  h.roundSession = null
  vi.clearAllMocks()
})

describe('Folio repetition boundary', () => {
  it('passes the stored round plan and cursor to the overview unchanged', async () => {
    h.roundSession = {
      id: 42,
      sections: 'alla',
      plan: ['answered-ORD-1', 'stored-ELF-3~source-ELF-8', 'stored-ORD-2'],
      position: 1,
      endedAt: null,
    } as ActiveSession
    render(page())
    await screen.findByTestId('folio-overview')
    expect(h.overview).toHaveBeenLastCalledWith(
      expect.objectContaining({ roundSession: h.roundSession }),
    )
  })

  it('shows a lazy overview for the bare route and passes the section scope', async () => {
    const result = render(page())
    expect(await screen.findByTestId('folio-overview')).toBeInTheDocument()
    expect(screen.queryByTestId('session-player')).not.toBeInTheDocument()
    h.search = { section: 'MEK' }
    result.rerender(page())
    expect(h.due).toHaveBeenLastCalledWith('MEK')
    expect(h.overview).toHaveBeenLastCalledWith(expect.objectContaining({ section: 'MEK' }))
  })
  it('keeps the classic bare route on SessionPlayer', () => {
    render(page(false))
    expect(screen.getByTestId('session-player')).toBeInTheDocument()
    expect(h.overview).not.toHaveBeenCalled()
  })
  it('parses screen links into route search, preserving an encoded section', async () => {
    render(page())
    await screen.findByTestId('folio-overview')
    const props = h.overview.mock.lastCall?.[0] as { navigateHref: (href: string) => void }
    props.navigateHref('/repetition?start=1&section=L%C3%84S')
    expect(h.navigate).toHaveBeenLastCalledWith({
      to: '/repetition',
      search: { start: '1', section: 'LÄS' },
      replace: true,
    })
    props.navigateHref('/drill?section=KVA&start=1')
    expect(h.navigate).toHaveBeenLastCalledWith({
      to: '/drill',
      search: { section: 'KVA', start: '1' },
      replace: false,
    })
  })
  it.each([
    ['/repetition?start=1', { start: '1' }],
    ['/repetition?start=1&section=ORD', { start: '1', section: 'ORD' }],
  ])('replaces the overview history entry when starting or resuming at %s', async (href, search) => {
    const result = render(page())
    await screen.findByTestId('folio-overview')
    const props = h.overview.mock.lastCall?.[0] as { navigateHref: (href: string) => void }
    props.navigateHref(href)
    expect(h.navigate).toHaveBeenCalledExactlyOnceWith({
      to: '/repetition',
      search,
      replace: true,
    })
    h.search = { ...search, start: true }
    result.rerender(page())
    const mounted = screen.getByTestId('session-player')
    expect(h.props?.autoStart).toBe(true)
    act(() => h.props?.urlSyncedQid?.setQid(null))
    h.search = 'section' in search ? { section: search.section } : {}
    result.rerender(page())
    expect(screen.getByTestId('session-player')).toBe(mounted)
    expect(screen.queryByTestId('folio-overview')).not.toBeInTheDocument()
  })
  it('keeps section browsing in history', async () => {
    render(page())
    await screen.findByTestId('folio-overview')
    const props = h.overview.mock.lastCall?.[0] as { navigateHref: (href: string) => void }
    props.navigateHref('/repetition?section=MEK')
    expect(h.navigate).toHaveBeenCalledExactlyOnceWith({
      to: '/repetition',
      search: { section: 'MEK' },
      replace: false,
    })
  })
  it.each([
    { start: true },
    { qid: 'saved-qid' },
    { done: 42 },
  ])('opens SessionPlayer for %j', (search) => {
    h.search = search
    render(page())
    expect(screen.getByTestId('session-player')).toBeInTheDocument()
    expect(h.overview).not.toHaveBeenCalled()
  })
  it.each([
    { start: true },
    { qid: 'saved-qid' },
    { done: 42 },
  ])('holds the session after setQid(null) from %j', async (search) => {
    const result = render(page())
    await screen.findByTestId('folio-overview')
    h.search = { ...search, section: 'ORD' }
    result.rerender(page())
    const mounted = screen.getByTestId('session-player')
    act(() => h.props?.urlSyncedQid?.setQid(null))
    expect(h.navigate).toHaveBeenLastCalledWith({
      to: '/repetition',
      search: { section: 'ORD' },
      replace: true,
    })
    h.search = { section: 'ORD' }
    result.rerender(page())
    expect(screen.getByTestId('session-player')).toBe(mounted)
    expect(screen.queryByTestId('folio-overview')).not.toBeInTheDocument()
  })
})

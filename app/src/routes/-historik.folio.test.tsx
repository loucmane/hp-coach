import { fireEvent, render, screen } from '@testing-library/react'
import type { ComponentType, ReactNode } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { FolioHostContext } from '@/folio/host'
import { Route } from './historik'

const state = vi.hoisted(() => ({ navigate: vi.fn(), mockResults: vi.fn(), refetch: vi.fn() }))
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  useNavigate: () => state.navigate,
  Link: ({
    to,
    search,
    children,
    ...props
  }: {
    to: string
    search?: { done: number }
    children: ReactNode
  }) => (
    <a href={`${to}${search ? `?done=${search.done}` : ''}`} {...props}>
      {children}
    </a>
  ),
}))
vi.mock('@/api/hooks/useSessions', () => ({
  useSessionHistory: () => ({
    data: [
      {
        id: 7,
        kind: 'drill',
        sections: 'KVA',
        endedAt: '2026-10-20T12:00:00',
        correct: 7,
        total: 10,
      },
    ],
    isPending: false,
    refetch: state.refetch,
  }),
}))
vi.mock('@/api/hooks/useMockResults', () => ({
  useMockResults: () => {
    state.mockResults()
    return { data: [], isPending: false, refetch: state.refetch }
  },
}))
vi.mock('@/stores/examStore', () => ({
  useSitting: () => ({ label: 'Vårprov 27' }),
  useDaysRemaining: () => 170,
}))
vi.mock('@/components/MobileFrame', () => ({
  MobileFrame: ({ children }: { children: ReactNode }) => (
    <div data-testid="classic-historik">{children}</div>
  ),
}))
vi.mock('@/components/Page', () => ({
  Page: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/drill/DrillRailSection', () => ({
  DrillRailSection: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}))
beforeEach(() => vi.clearAllMocks())

it('toggles Folio after every route hook while preserving classic content and data fetching', async () => {
  const Component = Route.options.component as ComponentType
  const { rerender } = render(
    <FolioHostContext.Provider value={false}>
      <Component />
    </FolioHostContext.Provider>,
  )
  expect(screen.getByTestId('classic-historik')).toBeInTheDocument()
  expect(screen.getByTestId('historik-pass-7')).toHaveTextContent('7/10')
  expect(state.mockResults).not.toHaveBeenCalled()
  rerender(
    <FolioHostContext.Provider value={true}>
      <Component />
    </FolioHostContext.Provider>,
  )
  expect(await screen.findByTestId('folio-historik')).toBeInTheDocument()
  expect(screen.queryByTestId('classic-historik')).not.toBeInTheDocument()
  expect(screen.getByTestId('historik-pass-7')).toHaveTextContent('7 av 10')
  fireEvent.click(screen.getByTestId('historik-pass-7'))
  expect(state.navigate).toHaveBeenCalledWith({ to: '/drill', search: { done: '7' }, hash: '' })
  rerender(
    <FolioHostContext.Provider value={false}>
      <Component />
    </FolioHostContext.Provider>,
  )
  expect(screen.getByTestId('classic-historik')).toBeInTheDocument()
  expect(screen.queryByTestId('folio-historik')).not.toBeInTheDocument()
})

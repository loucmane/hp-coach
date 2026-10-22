import { fireEvent, render, screen } from '@testing-library/react'
import type { ComponentType, ReactNode } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import type { Stats } from '@/api/hooks/useStats'
import { FolioHostContext } from '@/folio/host'
import { Route } from './progress'

const state = vi.hoisted(() => ({
  navigate: vi.fn(),
  stats: { isPending: true, data: undefined as Stats | undefined },
}))
beforeEach(() => {
  state.navigate.mockClear()
  state.stats = { isPending: true, data: undefined }
})

vi.mock('@clerk/clerk-react', () => ({ useAuth: () => ({ userId: 'test-user' }) }))
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: undefined }) }))
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  useNavigate: () => state.navigate,
}))
vi.mock('@/api/hooks/useStats', () => ({ useStats: () => state.stats }))
vi.mock('@/api/hooks/useFrameworkProgress', () => ({
  useFrameworkProgress: () => ({ data: undefined }),
}))
vi.mock('@/lib/motion', () => ({ useFirstContentSignal: () => {} }))
vi.mock('@/components/MobileFrame', () => ({
  MobileFrame: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/Page', () => ({
  Page: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/screens/ProgressMobile', () => ({
  ProgressMobile: () => <div data-testid="classic-progress" />,
}))
vi.mock('@/folio/screens/framsteg/useFramstegExtras', () => ({
  useFramstegExtras: () => ({
    viewport: 'studio',
    days: 170,
    sitting: { label: 'Vårprov 27' },
    history: { data: [] },
  }),
}))

it('switches after all route hooks and keeps the classic route when the flag is off', async () => {
  const Component = Route.options.component as ComponentType
  const { rerender } = render(
    <FolioHostContext.Provider value={false}>
      <Component />
    </FolioHostContext.Provider>,
  )
  expect(screen.getByTestId('classic-progress')).toBeInTheDocument()
  expect(screen.queryByTestId('folio-framsteg')).not.toBeInTheDocument()
  rerender(
    <FolioHostContext.Provider value={true}>
      <Component />
    </FolioHostContext.Provider>,
  )
  expect(await screen.findByTestId('folio-framsteg')).toBeInTheDocument()
  expect(screen.queryByTestId('classic-progress')).not.toBeInTheDocument()
  rerender(
    <FolioHostContext.Provider value={false}>
      <Component />
    </FolioHostContext.Provider>,
  )
  expect(screen.getByTestId('classic-progress')).toBeInTheDocument()
})

it('adapts real Folio links to router paths and decoded search values', async () => {
  state.stats = {
    isPending: false,
    data: {
      bySection: {} as Stats['bySection'],
      attempts: { total: 0, today: 0, thisWeek: 0 },
      drills: { total: 0, thisWeek: 0 },
      mistakes: { active: 0, due: 0, resolved: 0 },
      accuracy7d: null,
      streakDays: 0,
      weekly: [],
    },
  }
  const Component = Route.options.component as ComponentType
  render(
    <FolioHostContext.Provider value={true}>
      <Component />
    </FolioHostContext.Provider>,
  )
  fireEvent.click(await screen.findByTestId('progress-empty-cta'))
  expect(state.navigate).toHaveBeenLastCalledWith({
    to: '/diagnostik',
    search: { start: '1' },
    hash: '',
  })
  fireEvent.click(screen.getByTestId('progress-section-LÄS'))
  expect(state.navigate).toHaveBeenLastCalledWith({
    to: '/lektion',
    search: { section: 'LÄS' },
    hash: '',
  })
})

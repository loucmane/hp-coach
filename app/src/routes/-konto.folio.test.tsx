import { fireEvent, render, screen } from '@testing-library/react'
import type { ComponentType, ReactNode } from 'react'
import { expect, it, vi } from 'vitest'
import { FolioHostContext } from '@/folio/host'
import { Route } from './konto'

const navigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  useNavigate: () => navigate,
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}))
vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ user: null }),
  useClerk: () => ({ signOut: vi.fn() }),
}))
vi.mock('@/components/MobileFrame', () => ({
  MobileFrame: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/components/Page', () => ({ Page: ({ children }: { children: ReactNode }) => children }))
vi.mock('@/lib/motion', () => ({ useFirstContentSignal: () => {} }))
vi.mock('@/api/hooks/useDataExport', () => ({ useExportData: () => ({}), downloadExport: vi.fn() }))
vi.mock('@/api/hooks/useDeleteAccount', () => ({ useDeleteAccount: () => ({}) }))
vi.mock('@/folio/screens/konto/FolioKonto', () => ({
  default: ({ entry, navigateHref }: { entry: string; navigateHref: (href: string) => void }) => (
    <button
      type="button"
      data-testid="folio-konto"
      onClick={() => navigateHref('/hjalp?from=konto#kontakt')}
    >
      {entry}
    </button>
  ),
}))

it('keeps classic Konto with the flag off and lazily passes the konto entry and navigation', async () => {
  const Component = Route.options.component as ComponentType
  const { rerender } = render(
    <FolioHostContext.Provider value={false}>
      <Component />
    </FolioHostContext.Provider>,
  )
  expect(screen.getByTestId('konto-identity')).toBeInTheDocument()
  expect(screen.queryByTestId('folio-konto')).not.toBeInTheDocument()
  rerender(
    <FolioHostContext.Provider value={true}>
      <Component />
    </FolioHostContext.Provider>,
  )
  expect(await screen.findByTestId('folio-konto')).toHaveTextContent('konto')
  expect(screen.queryByTestId('konto-identity')).not.toBeInTheDocument()
  fireEvent.click(screen.getByTestId('folio-konto'))
  expect(navigate).toHaveBeenCalledExactlyOnceWith({
    to: '/hjalp',
    search: { from: 'konto' },
    hash: 'kontakt',
  })
  rerender(
    <FolioHostContext.Provider value={false}>
      <Component />
    </FolioHostContext.Provider>,
  )
  expect(screen.getByTestId('konto-identity')).toBeInTheDocument()
})

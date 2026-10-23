import { fireEvent, render, screen } from '@testing-library/react'
import type { ComponentType, ReactNode } from 'react'
import { expect, it, vi } from 'vitest'
import { FolioHostContext } from '@/folio/host'
import { Route } from './mer'

const navigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  useNavigate: () => navigate,
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}))
vi.mock('@/api/useSyncedPrefs', () => ({ useSyncedPrefs: () => ({ setSitting: vi.fn() }) }))
vi.mock('@/components/MobileFrame', () => ({
  MobileFrame: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/components/Page', () => ({ Page: ({ children }: { children: ReactNode }) => children }))
vi.mock('@/lib/devSurface', () => ({ isDevSurface: () => false }))
vi.mock('@/folio/screens/konto/FolioKonto', () => ({
  default: ({ entry, navigateHref }: { entry: string; navigateHref: (href: string) => void }) => (
    <button type="button" data-testid="folio-konto" onClick={() => navigateHref('/avancerat')}>
      {entry}
    </button>
  ),
}))

it('keeps classic Mer with the flag off and lazily passes the mer entry and navigation', async () => {
  const Component = Route.options.component as ComponentType
  const { rerender } = render(
    <FolioHostContext.Provider value={false}>
      <Component />
    </FolioHostContext.Provider>,
  )
  expect(screen.getByRole('heading', { name: 'Inställningar.' })).toBeInTheDocument()
  expect(screen.queryByTestId('folio-konto')).not.toBeInTheDocument()
  rerender(
    <FolioHostContext.Provider value={true}>
      <Component />
    </FolioHostContext.Provider>,
  )
  expect(await screen.findByTestId('folio-konto')).toHaveTextContent('mer')
  expect(screen.queryByRole('heading', { name: 'Inställningar.' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByTestId('folio-konto'))
  expect(navigate).toHaveBeenCalledExactlyOnceWith({ to: '/avancerat', search: {}, hash: '' })
  rerender(
    <FolioHostContext.Provider value={false}>
      <Component />
    </FolioHostContext.Provider>,
  )
  expect(screen.getByRole('heading', { name: 'Inställningar.' })).toBeInTheDocument()
})

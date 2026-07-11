// AccountMenu placement contract: identity chrome exists ONLY on Home.
//
// Two guards:
//   1. RENDER — HomeMobile mounts the medallion only when the route passes
//      the `accountMenu` node; without it, no account trigger appears. This
//      is why HomeMobile stays presentational (its own tests need no Clerk)
//      and why non-Home surfaces, which never pass the prop, can't show it.
//   2. SOURCE — the drill and provpass route modules must not import the
//      AccountMenu at all, so it cannot mount there by any path. Home's
//      route (index.tsx) must import it.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/home/useResumptionCandidate', () => ({
  useResumptionCandidate: () => null,
  pickCandidate: () => null,
}))

import { HomeMobile } from '@/screens/HomeMobile'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROUTES = path.resolve(HERE, '..', '..', 'routes')
const IMPORT_RE = /components\/account\/AccountMenu/

function routeSource(file: string): string {
  return readFileSync(path.join(ROUTES, file), 'utf8')
}

describe('AccountMenu placement', () => {
  it('does not mount in HomeMobile without the accountMenu prop', () => {
    render(<HomeMobile forceLayout="phone" />)
    expect(screen.queryByTestId('home-account-slot')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Kontomeny' })).not.toBeInTheDocument()
  })

  it('mounts the passed account node in HomeMobile', () => {
    render(
      <HomeMobile forceLayout="phone" accountMenu={<div data-testid="acct-probe">seal</div>} />,
    )
    const slot = screen.getByTestId('home-account-slot')
    expect(slot).toBeInTheDocument()
    expect(screen.getByTestId('acct-probe')).toBeInTheDocument()
  })

  it('is imported by the Home route (index.tsx)', () => {
    expect(IMPORT_RE.test(routeSource('index.tsx'))).toBe(true)
  })

  it('is NOT imported by the drill route', () => {
    expect(IMPORT_RE.test(routeSource('drill.tsx'))).toBe(false)
  })

  it('is NOT imported by the provpass route', () => {
    expect(IMPORT_RE.test(routeSource('prov.tsx'))).toBe(false)
  })
})

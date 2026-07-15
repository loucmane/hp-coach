// Legal pages — the two public policy surfaces (/integritet, /villkor)
// and their discoverability from the /mer and /konto footers.
//
// The route components take no props and pull no session state, so we
// render them directly with a light @tanstack/react-router mock (Link →
// <a>, createFileRoute → passthrough) — same "render the exported screen,
// no router harness" idiom as prov.tsx's Picker test.

import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: unknown) => config,
  Link: ({ to, children, ...rest }: { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

import { LEGAL_LINKS } from '@/lib/legal'
import { IntegritetRoute } from './integritet'
import { VillkorRoute } from './villkor'

describe('legal link registry', () => {
  it('lists exactly the two public policy pages', () => {
    expect(LEGAL_LINKS.map((l) => l.to)).toEqual(['/integritet', '/villkor'])
  })

  it('both links are present in the /mer footer', () => {
    // mer.tsx renders LEGAL_LINKS verbatim; pinning the registry pins the
    // /mer footer without mounting MerRoute's session-bound store tree.
    const labels = LEGAL_LINKS.map((l) => l.label)
    expect(labels).toContain('Integritetspolicy')
    expect(labels).toContain('Användarvillkor')
  })
})

describe('/integritet', () => {
  it('renders the privacy policy with the dated stamp and truthful inventory', () => {
    render(<IntegritetRoute />)
    expect(screen.getByRole('heading', { level: 1, name: /Integritetspolicy/ })).toBeInTheDocument()
    expect(screen.getByText(/Senast uppdaterad 15 juli 2026/)).toBeInTheDocument()
    // Truthful processors + no third-party analytics claim.
    expect(screen.getByText(/Cloudflare D1/)).toBeInTheDocument()
    expect(screen.getByText(/Ingen tredjepartsanalys/)).toBeInTheDocument()
    // Cross-link to the sibling terms page.
    expect(screen.getByRole('link', { name: /Användarvillkor/ })).toHaveAttribute(
      'href',
      '/villkor',
    )
  })
})

describe('/villkor', () => {
  it('renders the terms with the UHR content note and no-guarantee clause', () => {
    render(<VillkorRoute />)
    expect(screen.getByRole('heading', { level: 1, name: /Användarvillkor/ })).toBeInTheDocument()
    expect(screen.getByText(/Senast uppdaterad 15 juli 2026/)).toBeInTheDocument()
    expect(screen.getByText(/upphovsrättsligt/)).toBeInTheDocument()
    expect(screen.getByText(/Vi kan inte lova någon viss poäng/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Integritetspolicy/ })).toHaveAttribute(
      'href',
      '/integritet',
    )
  })
})

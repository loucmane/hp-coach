// /hjalp — the public support page (P2.4). Same light-router idiom as
// the legal-page tests: render the exported screen, no router harness.

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

import { SUPPORT_EMAIL, SUPPORT_MAILTO, SUPPORT_REPLY_LINE } from '@/lib/support'
import { HjalpRoute } from './hjalp'

describe('/hjalp', () => {
  it('renders the support page: promise, mailto door, version colophon', () => {
    render(<HjalpRoute />)
    expect(screen.getByRole('heading', { level: 1, name: /Hjälp & support/ })).toBeInTheDocument()
    // Owner-ratified reply-time line, verbatim.
    expect(screen.getByText(SUPPORT_REPLY_LINE)).toBeInTheDocument()
    // The one door: a mailto carrying the canonical address + version body.
    const door = screen.getByTestId('hjalp-mailto')
    expect(door).toHaveAttribute('href', SUPPORT_MAILTO)
    expect(door).toHaveTextContent(SUPPORT_EMAIL)
    // The colophon tells the user the version travels with the mail.
    expect(screen.getByText(/App-version/)).toBeInTheDocument()
    // Way back into the app.
    expect(screen.getByRole('link', { name: /till appen/ })).toHaveAttribute('href', '/')
  })
})

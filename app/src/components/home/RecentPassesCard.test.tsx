import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { SessionHistoryRow } from '@/api/hooks/useSessions'

// Stub Link → plain anchor so the card renders without a router.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...rest }: { children: ReactNode; [k: string]: unknown }) => {
    const { to: _to, search: _search, ...attrs } = rest as Record<string, unknown>
    return <a {...attrs}>{children}</a>
  },
}))

import { RecentPassesCard } from './RecentPassesCard'

function row(over: Partial<SessionHistoryRow> = {}): SessionHistoryRow {
  return {
    id: 1,
    kind: 'drill',
    sections: 'ORD',
    endedAt: '2026-07-05T10:00:00.000Z',
    total: 10,
    correct: 8,
    ...over,
  }
}

describe('RecentPassesCard', () => {
  it('renders nothing when there are no completed passes', () => {
    render(<RecentPassesCard passes={[]} />)
    expect(screen.queryByTestId('home-recent-passes')).not.toBeInTheDocument()
  })

  it('renders up to 3 passes with their score, extras dropped', () => {
    render(
      <RecentPassesCard
        passes={[
          row({ id: 1, sections: 'ORD', correct: 8, total: 10 }),
          row({ id: 2, kind: 'adaptive_review', sections: 'ORD', correct: 5, total: 8 }),
          row({ id: 3, sections: 'KVA', correct: 6, total: 10 }),
          row({ id: 4, sections: 'XYZ', correct: 9, total: 10 }),
        ]}
      />,
    )
    expect(screen.getByTestId('home-recent-passes')).toBeInTheDocument()
    expect(screen.getByTestId('home-recent-pass-1')).toHaveTextContent('8/10')
    expect(screen.getByTestId('home-recent-pass-2')).toHaveTextContent('5/8') // repetition, true size
    expect(screen.getByTestId('home-recent-pass-2')).toHaveTextContent('Rep')
    expect(screen.getByTestId('home-recent-pass-3')).toHaveTextContent('6/10')
    expect(screen.queryByTestId('home-recent-pass-4')).not.toBeInTheDocument()
    expect(screen.getByTestId('home-recent-all')).toBeInTheDocument()
  })
})

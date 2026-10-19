// LexiconCard's "Öva ord med denna rot →" links open /drill?framework=<id>,
// which plays ONLY that entry's example_questions (drill.tsx
// pickFrameworkQuestions). An entry with none would open an empty drill, so
// the card must not offer practice for it, while the read toggle stays.
//
// Router-free: Link is stubbed to a plain anchor (RecentPassesCard.test.tsx
// precedent) whose href is built from `to` + `search`, so the drill target
// can be asserted. ExampleQuestions is stubbed to a marker because it
// resolves its qids against the full question bank, which is not under test.

import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { LexiconEntry } from '@/data/frameworks'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...rest }: { children: ReactNode; [k: string]: unknown }) => {
    const { to, search, ...attrs } = rest as Record<string, unknown>
    const query = new URLSearchParams(search as Record<string, string>).toString()
    return (
      <a href={`${to}${query ? `?${query}` : ''}`} {...attrs}>
        {children}
      </a>
    )
  },
}))

vi.mock('./ExampleQuestions', () => ({
  ExampleQuestions: ({ qids }: { qids: string[] }) => (
    <div data-testid="example-questions">{qids.join(' ')}</div>
  ),
}))

import { LexiconCard } from './LexiconCard'

const PRACTICE = 'Öva ord med denna rot →'

function entry(over: Partial<LexiconEntry> = {}): LexiconEntry {
  return {
    id: 'ORD-ROOT-016',
    root: 'med-',
    origin: 'Germanic',
    meaning: 'tillsammans med, deltagande',
    example_words: ['medverkan', 'medgivande', 'meddela'],
    example_questions: ['host-2015-verb1-ORD-008', 'host-2023-verb2-ORD-007'],
    ...over,
  }
}

describe('LexiconCard — practice link', () => {
  it('links to the drill for this root when the entry has example questions', () => {
    render(<LexiconCard entry={entry()} onToggleRead={vi.fn()} />)

    // Surfaced copy in <summary> (collapsed card) + end-of-read copy in the body.
    const links = screen.getAllByRole('link', { name: PRACTICE })
    expect(links).toHaveLength(2)
    for (const link of links) {
      expect(link).toHaveAttribute('href', '/drill?section=ORD&framework=ORD-ROOT-016')
    }
    expect(screen.getByTestId('example-questions')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Markera som läst' })).toBeInTheDocument()
  })

  it('shows no practice link for an entry without example questions, but keeps the read toggle', () => {
    render(<LexiconCard entry={entry({ example_questions: [] })} onToggleRead={vi.fn()} />)

    expect(screen.queryAllByRole('link', { name: PRACTICE })).toHaveLength(0)
    expect(screen.queryByTestId('lesson-practice-link')).not.toBeInTheDocument()
    expect(screen.queryByTestId('example-questions')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Markera som läst' })).toBeInTheDocument()
  })
})

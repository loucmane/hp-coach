// W4 — the uppslag door's landing station. LessonReader's header eyebrow
// (the h1 headline) is where the section-code chip morphs to on arrival
// from the Uppslag picker; this test pins that the reader carries the
// shared `uppslagDoorLayoutId` on that element so the contract with
// lektion.tsx's picker chip (the OTHER half — see lektion.door.test.tsx)
// can't silently drift apart.
//
// Router-free: Link is stubbed to a plain anchor (RecentPassesCard.test.tsx
// precedent). `motion/react` is stubbed so `motion.span`'s `layoutId` prop
// — invisible to a real DOM query, framer-motion strips it before render —
// surfaces as a `data-layout-id` attribute we can assert on. The data hooks
// (lesson progress PUT, read-marks, framework load) are stubbed so the test
// exercises real component wiring without a QueryClient or fetch.

import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...rest }: { children: ReactNode; [k: string]: unknown }) => {
    const { to: _to, search: _search, ...attrs } = rest as Record<string, unknown>
    return <a {...attrs}>{children}</a>
  },
}))

vi.mock('motion/react', () => ({
  motion: {
    span: ({
      layoutId,
      children,
      transition: _transition,
      ...rest
    }: {
      layoutId?: string
      children: ReactNode
      transition?: unknown
      [k: string]: unknown
    }) => (
      <span data-layout-id={layoutId} {...rest}>
        {children}
      </span>
    ),
  },
  useReducedMotion: () => false,
}))

vi.mock('@/api/hooks/useLessonProgress', () => ({
  usePutLessonProgress: () => ({ mutate: vi.fn() }),
}))

vi.mock('@/hooks/useLessonReads', () => ({
  useLessonReads: () => ({ isRead: () => false, toggleRead: vi.fn() }),
}))

vi.mock('@/data/frameworks', () => ({
  loadFramework: async () => ({ family: 'nog_traps', entries: [] }),
}))

// SectionPracticeCTA reaches into Clerk-authed API hooks (useTopTraps →
// useAuth) unrelated to the door contract this test pins; stub it out
// rather than standing up a ClerkProvider + QueryClient just to satisfy
// an unrelated subtree.
vi.mock('./SectionPracticeCTA', () => ({
  SectionPracticeCTA: () => null,
}))

import { uppslagDoorLayoutId } from '@/lib/motion'
import { LessonReader } from './LessonReader'

describe('LessonReader — uppslag door landing station', () => {
  it('wires the section-code headline to the shared uppslag-door layoutId', async () => {
    render(<LessonReader section="NOG" />)

    const heading = await screen.findByRole('heading', { level: 1, name: 'NOG' })
    const morphSpan = heading.querySelector('[data-layout-id]')
    expect(morphSpan).not.toBeNull()
    expect(morphSpan).toHaveAttribute('data-layout-id', uppslagDoorLayoutId('NOG'))
    expect(morphSpan?.textContent).toBe('NOG')
  })
})

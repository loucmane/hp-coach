// ResumptionPanel rendering tests.
//
// The TanStack `<Link>` would need a router context to render; tests
// stub it via vi.mock to render a plain anchor with the same `to`
// prop. That keeps these tests router-free, matching the existing
// HomeMobile screen tests.

import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    // biome-ignore lint/a11y/useValidAnchor: stub
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

import { usePausedSessionStore } from '@/stores/pausedSessionStore'
import { ResumptionPanel } from './ResumptionPanel'

beforeEach(() => {
  usePausedSessionStore.getState().reset()
})

afterEach(() => {
  usePausedSessionStore.getState().reset()
})

describe('ResumptionPanel', () => {
  it('renders nothing when no paused session exists', () => {
    const { container } = render(<ResumptionPanel now={new Date(2026, 4, 28, 9)} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a paused lesson with the framework-entry anchor', () => {
    const now = new Date(2026, 4, 28, 9)
    const pausedAt = new Date(2026, 4, 27, 19, 42).getTime()
    usePausedSessionStore.getState().setLesson({
      kind: 'lesson',
      section: 'XYZ',
      frameworkId: 'XYZ-TRAP-016',
      step: 3,
      totalSteps: 7,
      pausedAt,
    })
    render(<ResumptionPanel now={now} />)
    expect(screen.getByTestId('home-resumption-eyebrow')).toHaveTextContent(/igår · 19:42/i)
    expect(screen.getByTestId('home-resumption-headline')).toHaveTextContent('XYZ-lektion · pausad')
    expect(screen.getByTestId('home-resumption-marginalia')).toHaveTextContent('vid XYZ-TRAP-016')
    const link = screen.getByTestId('home-resumption-link') as HTMLAnchorElement
    // section is a search param (not a path segment) and the anchor is
    // a real hash after the query — `/lektion/XYZ…` 404s.
    expect(link.getAttribute('href')).toBe('/lektion?section=XYZ#XYZ-TRAP-016')
  })

  it('falls back to "pågående lektion" when the lesson has no entry anchor', () => {
    const now = new Date(2026, 4, 28, 9)
    usePausedSessionStore.getState().setLesson({
      kind: 'lesson',
      section: 'NOG',
      step: 1,
      totalSteps: 5,
      pausedAt: new Date(2026, 4, 27, 10).getTime(),
    })
    render(<ResumptionPanel now={now} />)
    expect(screen.getByTestId('home-resumption-marginalia')).toHaveTextContent('pågående lektion')
  })

  it('renders a paused drill with question indicator and qid-resume href', () => {
    const now = new Date(2026, 4, 28, 9)
    const pausedAt = new Date(2026, 4, 27, 18, 5).getTime()
    usePausedSessionStore.getState().setDrill({
      kind: 'drill',
      section: 'ORD',
      qid: 'host-2013-verb1-ORD-005',
      questionIndex: 4,
      totalQuestions: 12,
      pausedAt,
    })
    render(<ResumptionPanel now={now} />)
    expect(screen.getByTestId('home-resumption-headline')).toHaveTextContent('ORD-övning · pausad')
    expect(screen.getByTestId('home-resumption-marginalia')).toHaveTextContent('vid fråga 4 av 12')
    const link = screen.getByTestId('home-resumption-link') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('/drill?qid=host-2013-verb1-ORD-005')
  })

  it('picks the most recent paused session when multiple slots are set', () => {
    const now = new Date(2026, 4, 28, 9)
    const olderLesson = new Date(2026, 4, 26, 10).getTime()
    const newerDrill = new Date(2026, 4, 27, 20).getTime()
    usePausedSessionStore.getState().setLesson({
      kind: 'lesson',
      section: 'NOG',
      step: 1,
      totalSteps: 4,
      pausedAt: olderLesson,
    })
    usePausedSessionStore.getState().setDrill({
      kind: 'drill',
      qid: 'q-x',
      questionIndex: 2,
      totalQuestions: 10,
      pausedAt: newerDrill,
    })
    render(<ResumptionPanel now={now} />)
    expect(screen.getByTestId('home-resumption-headline')).toHaveTextContent('Övning · pausad')
  })

  it('renders same-day pause as "Idag · HH:MM"', () => {
    const now = new Date(2026, 4, 28, 9)
    const earlierToday = new Date(2026, 4, 28, 2, 14).getTime()
    usePausedSessionStore.getState().setDrill({
      kind: 'drill',
      qid: 'q-x',
      questionIndex: 1,
      totalQuestions: 5,
      pausedAt: earlierToday,
    })
    render(<ResumptionPanel now={now} />)
    expect(screen.getByTestId('home-resumption-eyebrow')).toHaveTextContent(/idag · 02:14/i)
  })

  it('renders "X dagar sedan" for older pauses', () => {
    const now = new Date(2026, 4, 28, 9)
    const fiveDaysAgo = new Date(2026, 4, 23, 11).getTime()
    usePausedSessionStore.getState().setDrill({
      kind: 'drill',
      qid: 'q-x',
      questionIndex: 1,
      totalQuestions: 5,
      pausedAt: fiveDaysAgo,
    })
    render(<ResumptionPanel now={now} />)
    expect(screen.getByTestId('home-resumption-eyebrow')).toHaveTextContent(/5 dagar sedan/i)
  })
})

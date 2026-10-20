// Framsteg's prognosis (hpf-bz6f.4): the hero counts each question's first
// try only — never a Repetera retry or a changed mock answer — says so once,
// and names a week-over-week change only when it clears the noise.

import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { Stats } from '@/api/hooks/useStats'
import { SECTION_KEYS, type Section } from '@/data/questions'
import type { SectionStats } from '@/lib/scoring'

// Stub Link → plain anchor so the screen renders without a router.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...rest }: { children: ReactNode; [k: string]: unknown }) => {
    const { to: _to, search: _search, ...attrs } = rest as Record<string, unknown>
    return <a {...attrs}>{children}</a>
  },
}))

import { ProgressMobile } from './ProgressMobile'

const NOTE = 'Prognosen räknar bara första försöket på varje fråga, inte repetitioner.'

function section(over: Partial<SectionStats> = {}): SectionStats {
  return {
    attempts7d: 0,
    correct7d: 0,
    attempts7to14d: 0,
    correct7to14d: 0,
    attempts90d: 0,
    correct90d: 0,
    avgTimeMs: null,
    lastAttemptedAt: null,
    attemptsToday: 0,
    ...over,
  }
}

/** Every attempt reads 1,8; the first tries read 1,2. */
const RETRIED = { attempts90d: 50, correct90d: 45, firstTry90d: 20, firstTryCorrect90d: 12 }

function makeStats(bySection: Partial<Record<Section, SectionStats>>): Stats {
  return {
    attempts: { total: 300, today: 0, thisWeek: 40 },
    drills: { total: 12, thisWeek: 3 },
    mistakes: { active: 4, due: 2, resolved: 9 },
    accuracy7d: 0.8,
    streakDays: 3,
    timeMsToday: 0,
    bySection: Object.fromEntries(
      SECTION_KEYS.map((s) => [s, bySection[s] ?? section()]),
    ) as Stats['bySection'],
    weekly: [],
    attemptsDaily: [],
  }
}

describe('ProgressMobile — the honest prognosis', () => {
  it('the hero projects first tries, not every attempt', () => {
    render(<ProgressMobile stats={makeStats({ ORD: section(RETRIED), KVA: section(RETRIED) })} />)
    const hero = screen.getByTestId('progress-projected')
    expect(hero).toHaveTextContent('1,20')
    expect(hero).not.toHaveTextContent('1,80')
  })

  it('the gap to the goal names the sections by their first-try scores', () => {
    render(<ProgressMobile stats={makeStats({ ORD: section(RETRIED), KVA: section(RETRIED) })} />)
    const prose = screen.getByTestId('progress-prose')
    expect(prose).toHaveTextContent('Verbal (1,20) och kvant (1,20) följs åt')
    expect(prose).toHaveTextContent('ORD 1,20')
    expect(prose).toHaveTextContent('KVA 1,20')
    expect(prose).not.toHaveTextContent('1,80')
  })

  it('says once, quietly, that it counts first tries only', () => {
    render(<ProgressMobile stats={makeStats({ ORD: section(RETRIED), KVA: section(RETRIED) })} />)
    expect(screen.getAllByText(NOTE)).toHaveLength(1)
  })

  it('has no note before there is a prognosis to explain', () => {
    render(<ProgressMobile stats={makeStats({})} />)
    expect(screen.getByText(/Ingen prognos än/)).toBeInTheDocument()
    expect(screen.queryByText(NOTE)).not.toBeInTheDocument()
  })

  it('a week change inside the noise reads "stabil, inom felmarginalen", with no figure', () => {
    const stats = makeStats({
      ORD: section({
        ...RETRIED,
        // Counting every attempt this read "+0,6": this week's retries were right.
        attempts7d: 30,
        correct7d: 29,
        attempts7to14d: 30,
        correct7to14d: 20,
        // First tries: 2·0,75 − 2·0,70 = +0,1 against a band of ≈ 0,55.
        firstTry7d: 20,
        firstTryCorrect7d: 15,
        firstTry7to14d: 20,
        firstTryCorrect7to14d: 14,
      }),
      KVA: section(RETRIED),
    })
    render(<ProgressMobile stats={stats} />)
    const prose = screen.getByTestId('progress-prose')
    expect(prose).toHaveTextContent('Prognosen är stabil, inom felmarginalen')
    expect(prose).not.toHaveTextContent(/[+−±]\s?\d/)
  })

  it('a week change beyond the noise is named with its first-try figure', () => {
    const stats = makeStats({
      ORD: section({
        attempts90d: 260,
        correct90d: 200,
        firstTry90d: 200,
        firstTryCorrect90d: 130,
        // Every attempt: 2·100/120 − 2·77/110 ≈ +0,3.
        attempts7d: 120,
        correct7d: 100,
        attempts7to14d: 110,
        correct7to14d: 77,
        // First tries: 2·0,80 − 2·0,50 = +0,6 against a band of ≈ 0,25.
        firstTry7d: 100,
        firstTryCorrect7d: 80,
        firstTry7to14d: 100,
        firstTryCorrect7to14d: 50,
      }),
      KVA: section(RETRIED),
    })
    render(<ProgressMobile stats={stats} />)
    const prose = screen.getByTestId('progress-prose')
    expect(prose).toHaveTextContent('Prognosen steg +0,6 den här veckan')
    expect(prose).not.toHaveTextContent('+0,3')
  })
})

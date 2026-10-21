import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildReturnCalendar,
  claimReturnPrompt,
  googleCalendarUrl,
  returnSummary,
  suggestReturnTime,
} from './returnPrompt'

const now = new Date(2026, 9, 21, 18)
const session = (date: Date) => ({ startedAt: date.toISOString() })

describe('suggestReturnTime', () => {
  it('uses the earliest local-today start, ignores invalid/other-day/future times, and rounds to five minutes', () => {
    const result = suggestReturnTime(
      [
        session(new Date(2026, 9, 21, 15)),
        session(new Date(2026, 9, 20, 6)),
        { startedAt: null },
        { startedAt: 'invalid' },
        {},
        session(new Date(2026, 9, 21, 7, 52)),
        session(new Date(2026, 9, 22, 3)),
      ],
      now,
    )
    expect(result).toEqual(new Date(2026, 9, 22, 7, 50))
  })

  it('rounds up and carries tomorrow across the year boundary', () => {
    expect(
      suggestReturnTime([session(new Date(2026, 11, 31, 7, 53))], new Date(2026, 11, 31, 18)),
    ).toEqual(new Date(2027, 0, 1, 7, 55))
  })

  it('keeps a late-night suggestion on tomorrow, at 23:55', () => {
    expect(
      suggestReturnTime(
        [session(new Date(2026, 9, 21, 23, 59))],
        new Date(2026, 9, 21, 23, 59, 30),
      ),
    ).toEqual(new Date(2026, 9, 22, 23, 55))
  })

  it('uses local calendar days even when the ISO date differs', () => {
    const early = new Date(2026, 9, 21, 0, 2)
    expect(suggestReturnTime([session(early)], now)).toEqual(new Date(2026, 9, 22, 0))
  })

  it('does not invent a time when no usable start exists today', () => {
    expect(suggestReturnTime([], now)).toBeNull()
    expect(suggestReturnTime([session(new Date(2026, 9, 20, 8))], now)).toBeNull()
    expect(suggestReturnTime([session(new Date(2026, 9, 21, 20))], now)).toBeNull()
  })

  it('keeps the wall time across DST and suppresses a nonexistent spring-forward time', () => {
    const beforeSpring = new Date(2026, 2, 28, 18)
    expect(suggestReturnTime([session(new Date(2026, 2, 28, 7, 50))], beforeSpring)).toEqual(
      new Date(2026, 2, 29, 7, 50),
    )
    const gap = new Date(2026, 2, 29, 2, 30)
    expect(suggestReturnTime([session(new Date(2026, 2, 28, 2, 30))], beforeSpring)).toEqual(
      gap.getHours() === 2 ? gap : null,
    )
    expect(
      suggestReturnTime([session(new Date(2026, 9, 24, 7, 50))], new Date(2026, 9, 24, 18)),
    ).toEqual(new Date(2026, 9, 25, 7, 50))
  })
})

describe('calendar export', () => {
  const event = { start: new Date(2026, 9, 22, 7, 50), summary: 'HP-Coach · Repetition + ORD' }

  it('names and deduplicates the content, without copying rationales or progress counts', () => {
    expect(
      returnSummary([
        { kind: 'repetition', section: null },
        { kind: 'lesson', section: 'ORD' },
        { kind: 'drill', section: 'ORD' },
      ]),
    ).toBe(event.summary)
    expect(returnSummary([{ kind: 'mock', section: null }])).toBe('HP-Coach · Provpass')
  })

  it('writes a floating-local 30 minute VEVENT with stable UID, UTC stamp, and CRLF', () => {
    const text = buildReturnCalendar(event, new Date('2026-10-21T16:00:00Z'))
    const lines = text.split('\r\n')
    expect(lines).toEqual(
      expect.arrayContaining([
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        'DTSTAMP:20261021T160000Z',
        'DTSTART:20261022T075000',
        'DTEND:20261022T082000',
        `SUMMARY:${event.summary}`,
        'END:VEVENT',
        'END:VCALENDAR',
      ]),
    )
    expect(text.endsWith('\r\n')).toBe(true)
    expect(text.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)
    const uid = lines.find((line) => line.startsWith('UID:'))
    expect(uid).toMatch(/^UID:.+@hp-coach$/)
    expect(buildReturnCalendar(event, new Date('2026-10-21T17:00:00Z'))).toContain(uid)
    expect(text).not.toContain('VALARM')
  })

  it('escapes content and folds long UTF-8 lines without splitting characters', () => {
    const summary = `HP-Coach · Räksmörgås, ORD; \\övning\n${'Åäö🧠'.repeat(30)}`
    const text = buildReturnCalendar({ ...event, summary }, now)
    for (const line of text.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
    }
    expect(text.replace(/\r\n /g, '')).toContain(
      `SUMMARY:HP-Coach · Räksmörgås\\, ORD\\; \\\\övning\\n${'Åäö🧠'.repeat(30)}`,
    )
  })

  it('encodes a Google template with matching local times, timezone and content', () => {
    const url = new URL(googleCalendarUrl(event, 'Europe/Stockholm'))
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      action: 'TEMPLATE',
      text: event.summary,
      dates: '20261022T075000/20261022T082000',
      ctz: 'Europe/Stockholm',
    })
  })

  it('carries the event end over midnight', () => {
    const late = { ...event, start: new Date(2026, 11, 31, 23, 55) }
    expect(buildReturnCalendar(late, now)).toContain('DTEND:20270101T002500')
    expect(new URL(googleCalendarUrl(late, 'Europe/Stockholm')).searchParams.get('dates')).toBe(
      '20261231T235500/20270101T002500',
    )
  })
})

describe('per-user daily presentation flag', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('consumes the local day once, independently per user and across midnight', () => {
    const late = new Date(2026, 9, 21, 23, 59)
    const early = new Date(2026, 9, 22, 0, 1)
    expect(claimReturnPrompt('student-a', late)).toBe(true)
    expect(claimReturnPrompt('student-a', late)).toBe(false)
    expect(claimReturnPrompt('student-b', late)).toBe(true)
    expect(claimReturnPrompt('student-a', early)).toBe(true)
    expect(claimReturnPrompt('student-a', early)).toBe(false)
  })

  it('suppresses when storage reads or writes are refused, or identity is absent', () => {
    expect(claimReturnPrompt('', now)).toBe(false)
    const denied = () => {
      throw new Error('storage unavailable')
    }
    expect(claimReturnPrompt('a', now, { getItem: denied, setItem: vi.fn() })).toBe(false)
    expect(claimReturnPrompt('a', now, { getItem: () => null, setItem: denied })).toBe(false)
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(denied)
    expect(claimReturnPrompt('a', now)).toBe(false)
  })
})

// provdatum — the landing's dated strings.
//
// The public landing derives every dated string (dateline, countdown,
// timeline destination, ledger footer) from here. The date itself is not
// kept here: it is the next sitting not yet over in the app's one exam
// calendar (lib/dates EXAM_SITTINGS). Per exam cycle the owner adds UHR's
// next sitting there and nothing else.
//
// Graceful degradation: through the exam day itself the date stands with
// days = 0 (the landing hides the count); from the midnight after it the
// next sitting takes over. Only once every configured sitting is over does
// `getProvdatum` return null, and the landing hides its dated pieces — it
// never shows a negative countdown or last cycle's date.

import { daysUntil, nextSitting } from './dates'

export type Provdatum = {
  date: Date
  /** Whole days until the exam, 0 on exam day itself — never negative. */
  days: number
  /** 'söndag 18 oktober' — the dateline register. */
  label: string
  /** '18 oktober' — for running prose ("vägen mot den 18 oktober"). */
  dayMonth: string
  /** '18 okt' — the timeline-station register. */
  short: string
}

const WEEKDAY = new Intl.DateTimeFormat('sv-SE', { weekday: 'long' })
const DAY_MONTH = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long' })
const DAY_MONTH_SHORT = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' })

/** The landing's strings for an exam on `date`, counted from `now`. */
export function formatProvdatum(date: Date, now: Date = new Date()): Provdatum {
  const dayMonth = DAY_MONTH.format(date)
  return {
    date,
    // Local calendar days, the same count as every in-app countdown.
    days: Math.max(0, daysUntil(date, now)),
    label: `${WEEKDAY.format(date)} ${dayMonth}`,
    dayMonth,
    // sv-SE short months carry a trailing period ('okt.') — the landing's
    // mono register sets them bare ('18 okt').
    short: DAY_MONTH_SHORT.format(date).replace(/\.$/, ''),
  }
}

/**
 * The next exam date, formatted for the landing — or null once every
 * configured sitting is over.
 */
export function getProvdatum(now: Date = new Date()): Provdatum | null {
  const sitting = nextSitting(now)
  return sitting ? formatProvdatum(sitting.date, now) : null
}

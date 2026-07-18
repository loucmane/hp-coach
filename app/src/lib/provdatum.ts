// provdatum — the ONE place the exam date lives.
//
// The public landing derives every dated string (dateline, countdown,
// timeline destination, ledger footer) from here. Per exam cycle the
// owner updates PROV_DATE and nothing else.
//
// Graceful degradation: if PROV_DATE is null (not yet announced) or in
// the past (stale config after an exam), `getProvdatum` returns null and
// the landing hides its dated pieces — it never shows a negative
// countdown or last cycle's date.

// TODO(owner): update per exam cycle. Next HP sitting: 18 oktober 2026.
// Set to null between cycles if the next date is not yet announced.
export const PROV_DATE: Date | null = new Date(2026, 9, 18)

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

/**
 * The current exam date, formatted for the landing — or null when no
 * future (or today's) exam date is configured.
 */
export function getProvdatum(now: Date = new Date()): Provdatum | null {
  if (!PROV_DATE) return null
  // PROV_DATE is local midnight; ceil keeps days=0 through exam day
  // itself and goes negative only once the day is fully over.
  const raw = Math.ceil((PROV_DATE.getTime() - now.getTime()) / 86_400_000)
  if (raw < 0) return null
  // Math.ceil of a negative fraction (an exam-day afternoon) is -0;
  // normalize so displays never print "-0".
  const days = Math.max(0, raw)
  const dayMonth = DAY_MONTH.format(PROV_DATE)
  return {
    date: PROV_DATE,
    days,
    label: `${WEEKDAY.format(PROV_DATE)} ${dayMonth}`,
    dayMonth,
    // sv-SE short months carry a trailing period ('okt.') — the landing's
    // mono register sets them bare ('18 okt').
    short: DAY_MONTH_SHORT.format(PROV_DATE).replace(/\.$/, ''),
  }
}

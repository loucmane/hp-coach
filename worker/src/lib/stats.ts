// Stats helpers — date math + streak computation.
//
// Pure functions; no DB access. The /api/me/stats endpoint pulls a
// list of distinct activity days from D1, hands them to
// `currentStreak`, and ships the result with the rest of the row.
// Keeping this here makes the streak rule testable in isolation
// (which is the part that tends to drift) and keeps the SQL routine
// in routes/me.ts focused on aggregation.

/**
 * Format a Date as "YYYY-MM-DD" using the **UTC** calendar — same
 * convention SQLite's `date(created_at, 'unixepoch')` produces. We
 * deliberately ignore local timezones here: a streak is a calendar
 * fact, and the server has to pick one calendar to anchor on. UTC is
 * the only one that round-trips cleanly across devices for a single
 * Clerk user. Cost: a user studying at 23:30 in Stockholm rolls into
 * the next "day" 30 min later than they'd intuit. Tradeoff worth it.
 */
export function formatDayUTC(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Floor a Date to 00:00:00.000 UTC on the same calendar day. Same UTC-
 * anchoring tradeoff as `formatDayUTC` (see its docstring) — used by
 * `/api/me/stats` to compute the same-day monotonic `attemptsToday`
 * counter that backs the section-drill completion gate. Pure; does not
 * mutate the input.
 */
export function startOfUtcDay(d: Date): Date {
  const out = new Date(d)
  out.setUTCHours(0, 0, 0, 0)
  return out
}

/**
 * Subtract one calendar day from a "YYYY-MM-DD" string. Returns the
 * same shape. Operates entirely in UTC.
 */
export function previousDay(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() - 1)
  return formatDayUTC(dt)
}

/**
 * Count consecutive activity days ending at today *or* yesterday.
 *
 * `days` must be the user's DISTINCT activity days, sorted DESCENDING
 * (newest first). Including yesterday in the anchor is on purpose: we
 * don't want to break a streak the moment the user opens the app at
 * 09:00 before their first session of the day. By 23:59 they will
 * either drill (extending the streak) or won't (in which case
 * tomorrow's morning visit will see "yesterday had no activity" and
 * report 0).
 *
 *   today, yesterday, day-before, ...   → streak grows by 1 each step
 *   first gap                           → streak stops there
 *   neither today nor yesterday active  → streak = 0
 */
export function currentStreak(days: readonly string[], now: Date = new Date()): number {
  if (days.length === 0) return 0

  const today = formatDayUTC(now)
  const yesterday = previousDay(today)

  // Pick the anchor: prefer today if it's there, else yesterday.
  // If neither is the most recent activity, the streak is broken.
  let cursor: string
  if (days[0] === today) cursor = today
  else if (days[0] === yesterday) cursor = yesterday
  else return 0

  let streak = 0
  for (const d of days) {
    if (d === cursor) {
      streak++
      cursor = previousDay(cursor)
    } else if (d < cursor) {
      // Gap. The descending sort means everything past here is older.
      break
    }
    // d > cursor would mean dupes or unsorted input — silently skip.
  }
  return streak
}

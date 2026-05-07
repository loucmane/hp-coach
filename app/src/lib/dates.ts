// Swedish date helpers + HP exam calendar.
//
// HP-Coach is calendrical at heart: the Daily Home shows "172 dagar kvar
// · höstprov 26", every adaptive interval is in days, and the schedule
// generator anchors on the target sitting. Keeping this in one place
// (typed, tested) prevents off-by-one creep from leaking into screens.

export type ExamSitting = {
  /** Stable id, e.g. `host-2026`. Used as a foreign key in the schedule store. */
  id: string
  /** Display label in Swedish UI ("Höstprov 26"). */
  label: string
  /** Local-midnight Date for the sitting. */
  date: Date
}

/** HP exam sittings — UHR publishes two per year. Update as official dates land. */
export const EXAM_SITTINGS: ReadonlyArray<ExamSitting> = [
  { id: 'host-2026', label: 'Höstprov 26', date: new Date(2026, 9, 25) }, // 25 Oct 2026
  { id: 'var-2027', label: 'Vårprov 27', date: new Date(2027, 2, 21) }, //  21 Mar 2027
]

const SV_WEEKDAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'] as const
const SV_MONTHS = [
  'jan',
  'feb',
  'mars',
  'apr',
  'maj',
  'juni',
  'juli',
  'aug',
  'sep',
  'okt',
  'nov',
  'dec',
] as const

/**
 * "Onsdag · 6 maj" — Swedish weekday + day + lowercase month abbreviation.
 * Matches the prototype's date pill exactly. Locale-pinned to sv-SE.
 */
export function formatSwedishHeader(d: Date): string {
  const wd = SV_WEEKDAYS[d.getDay()]
  const m = SV_MONTHS[d.getMonth()]
  return `${wd} · ${d.getDate()} ${m}`
}

/**
 * Days remaining until target, calendrical (midnight-anchored). Negative if
 * the target has passed. `from` is exposed for testability — production code
 * should call `daysUntil(target)` and let it default to `new Date()`.
 */
export function daysUntil(target: Date, from: Date = new Date()): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const b = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())
  const ms = b - a
  return Math.round(ms / 86_400_000)
}

import type { MockResultRow } from '@/api/hooks/useMockResults'
import type { SessionHistoryRow } from '@/api/hooks/useSessions'
import { passLabel } from '@/lib/sessionLabel'

export type HistorikRow = {
  id: number
  label: string
  href: string
  date: string
  score: string
}
export type HistorikWeek = { key: string; label: string; rows: HistorikRow[] }

const DAY = 86_400_000
const dateFormat = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const monthFormat = new Intl.DateTimeFormat('sv-SE', { month: 'long', timeZone: 'UTC' })

function dateOf(value: string | number | null): Date | null {
  if (value == null || value === '') return null
  const date = new Date(typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value)
  return Number.isFinite(date.getTime()) ? date : null
}

/** Local calendar dates, represented in UTC so DST cannot shorten a week. */
function mondayOf(date: Date): Date {
  const day = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7))
  return day
}

function weekLabel(monday: Date): string {
  const thursday = new Date(monday.getTime() + 3 * DAY)
  const week = Math.ceil(
    ((thursday.getTime() - Date.UTC(thursday.getUTCFullYear(), 0, 1)) / DAY + 1) / 7,
  )
  const sunday = new Date(monday.getTime() + 6 * DAY)
  const startMonth = monthFormat.format(monday)
  const endMonth = monthFormat.format(sunday)
  const startYear = monday.getUTCFullYear()
  const endYear = sunday.getUTCFullYear()
  const start =
    startYear !== endYear
      ? `${monday.getUTCDate()} ${startMonth} ${startYear}`
      : monday.getUTCMonth() !== sunday.getUTCMonth()
        ? `${monday.getUTCDate()} ${startMonth}`
        : `${monday.getUTCDate()}`
  return `Vecka ${week} · ${start}–${sunday.getUTCDate()} ${endMonth} ${endYear}`
}

function newestFirst<T>(rows: readonly T[], date: (row: T) => string | number | null) {
  return rows
    .map((row) => ({ row, date: dateOf(date(row)) }))
    .sort((a, b) => (b.date?.getTime() ?? -Infinity) - (a.date?.getTime() ?? -Infinity))
}

export function buildHistorikView(
  history: readonly SessionHistoryRow[],
  results: readonly MockResultRow[],
) {
  const weeks = new Map<string, HistorikWeek>()
  for (const { row, date } of newestFirst(history, (row) => row.endedAt)) {
    if (row.kind !== 'drill' && row.kind !== 'adaptive_review') continue
    const monday = date ? mondayOf(date) : null
    const key = monday?.toISOString().slice(0, 10) ?? 'undated'
    let group = weeks.get(key)
    if (!group) {
      group = { key, label: monday ? weekLabel(monday) : 'Datum saknas', rows: [] }
      weeks.set(key, group)
    }
    group.rows.push({
      id: row.id,
      label: passLabel(row),
      href: `${row.kind === 'adaptive_review' ? '/repetition' : '/drill'}?done=${row.id}`,
      date: date ? dateFormat.format(date) : 'Datum saknas',
      score: `${row.correct} av ${row.total}`,
    })
  }
  return {
    weeks: [...weeks.values()],
    provpass: newestFirst(results, (row) => row.createdAt).map(
      ({ row, date }): HistorikRow => ({
        id: row.id,
        label: `${row.half === 'verbal' ? 'Verbal' : 'Kvant'} · ${row.mode === 'authentic' ? 'tidigare prov' : 'blandat pass'}`,
        href: `/prov?result=${row.id}`,
        date: date ? dateFormat.format(date) : 'Datum saknas',
        score: `${row.correct} av ${row.presented}`,
      }),
    ),
  }
}

// trapHistory — localStorage snapshot of the user's top-trap counts.
//
// useTopTraps reports today's trap signal — which patterns the user
// is currently accumulating misses on. But "currently" doesn't tell
// them whether they're improving. trapHistory snapshots that signal
// daily so a week later we can compute a delta: "kvotjakten · 4 ggr ↓2
// jämfört förra veckan."
//
// Storage:
//   { v: 1, snapshots: [{ date, traps: [{framework_id, count}] }] }
//   newest first, capped at MAX_SNAPSHOTS (14).
//
// One snapshot per day. We dedupe by `date` (YYYY-MM-DD), so multiple
// Home renders on the same day overwrite — only the last call wins,
// which is fine because the count is just the current queue size and
// idempotent within a day.
//
// Trend window:
//   Target 7 days ago. Accept anything in the [5, 10] day band as
//   "last week" — tolerates the user skipping a day or two without
//   losing the signal.

import { localDateString } from './scheduler'

const STORAGE_KEY = 'hpc-trap-history-v1'
const MAX_SNAPSHOTS = 14
const TREND_WINDOW_MIN_DAYS = 5
const TREND_WINDOW_MAX_DAYS = 10
const TREND_WINDOW_TARGET_DAYS = 7

export type TrapSnapshot = {
  /** YYYY-MM-DD, local-date. Same shape as scheduler's plan key. */
  date: string
  traps: Array<{ framework_id: string; count: number }>
}

type StoredHistory = {
  v: 1
  snapshots: TrapSnapshot[]
}

/** What the UI renders next to each row. `delta` is signed: negative
 *  = fewer misses than a week ago = improving. `daysAgo` lets the
 *  copy stay honest ("jämfört för 8 dagar sedan" when the comparison
 *  isn't exactly 7d). When no historical snapshot is in window:
 *  `kind: 'new'` — the trap appeared this week. */
export type TrapTrend =
  | { kind: 'delta'; delta: number; daysAgo: number }
  | { kind: 'new' }
  | { kind: 'unknown' }

function readHistory(): StoredHistory {
  if (typeof window === 'undefined') return { v: 1, snapshots: [] }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { v: 1, snapshots: [] }
    const parsed = JSON.parse(raw) as StoredHistory
    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.snapshots)) {
      return { v: 1, snapshots: [] }
    }
    return parsed
  } catch {
    return { v: 1, snapshots: [] }
  }
}

function writeHistory(history: StoredHistory): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    /* ignore — quota, private mode */
  }
}

/** Record today's snapshot. Idempotent within a day (replaces the
 *  same-date entry). Returns the persisted history for the caller's
 *  convenience. */
export function recordTrapSnapshot(
  now: Date,
  traps: Array<{ framework_id: string; count: number }>,
): StoredHistory {
  const date = localDateString(now)
  const history = readHistory()
  const filtered = history.snapshots.filter((s) => s.date !== date)
  const next: TrapSnapshot = {
    date,
    traps: traps.map((t) => ({ framework_id: t.framework_id, count: t.count })),
  }
  // Newest first; cap at MAX_SNAPSHOTS.
  const snapshots = [next, ...filtered].slice(0, MAX_SNAPSHOTS)
  const out = { v: 1 as const, snapshots }
  writeHistory(out)
  return out
}

/** Compute the trend for a single framework_id, given today's count.
 *  Picks the snapshot whose date is closest to TREND_WINDOW_TARGET_DAYS
 *  ago, falling back to anything in [MIN, MAX] window. */
export function computeTrapTrend(
  now: Date,
  framework_id: string,
  currentCount: number,
  history: StoredHistory = readHistory(),
): TrapTrend {
  if (history.snapshots.length === 0) return { kind: 'unknown' }
  const today = startOfDay(now)
  // Find snapshots whose date sits in the [MIN, MAX] day band.
  const candidates: Array<{ snapshot: TrapSnapshot; daysAgo: number }> = []
  for (const s of history.snapshots) {
    const d = parseDate(s.date)
    if (!d) continue
    const daysAgo = Math.round((today.getTime() - d.getTime()) / (24 * 60 * 60 * 1000))
    if (daysAgo >= TREND_WINDOW_MIN_DAYS && daysAgo <= TREND_WINDOW_MAX_DAYS) {
      candidates.push({ snapshot: s, daysAgo })
    }
  }
  if (candidates.length === 0) return { kind: 'unknown' }
  // Pick the one closest to TARGET days ago.
  candidates.sort(
    (a, b) =>
      Math.abs(a.daysAgo - TREND_WINDOW_TARGET_DAYS) -
      Math.abs(b.daysAgo - TREND_WINDOW_TARGET_DAYS),
  )
  const { snapshot, daysAgo } = candidates[0]
  const past = snapshot.traps.find((t) => t.framework_id === framework_id)
  if (!past) return { kind: 'new' }
  return { kind: 'delta', delta: currentCount - past.count, daysAgo }
}

function parseDate(s: string): Date | null {
  // localDateString format: YYYY-MM-DD.
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Test-only: clear localStorage backing. */
export function __resetTrapHistory(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

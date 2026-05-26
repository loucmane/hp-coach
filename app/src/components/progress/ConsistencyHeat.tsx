// ConsistencyHeat — the long-arc story on /progress.
//
// Cat 3 winner from /loop-bakeoff (director-refined Variant C). A
// GitHub-style 12-week dot grid showing daily activity, but executed
// in the HP-Coach editorial language — no rainbow-saturated ramp,
// single-color OKLCH mix that follows whatever palette the user
// picks (Sand / Sage / Ink / Rose).
//
// Two stacked strips:
//   - Verbal half (ORD / LÄS / MEK / ELF) on top
//   - Quant half (XYZ / KVA / NOG / DTK) on bottom
// separated by a 1px hairline so the exam's structural axis reads
// at a glance. Same component, twice the story — the HP-specific
// move the director called out.
//
// Sparse month eyebrows above the grid (Mar / Apr / Maj) anchor the
// 12 columns in real calendar time. The summary line beneath surfaces
// the current trailing streak or the longest historical streak.
// Hover/focus outline at --accent for keyboard nav.
//
// Data comes from `stats.attemptsDaily` (84 entries, last 84 days).
// When the field is missing (worker rollout window) the component
// renders empty — better than a 12-week grid of guessed zeros.

import type { AttemptsDailyBucket } from '@/api/hooks/useStats'
import { Eyebrow } from '@/components/primitives'

const WEEKS = 12
const DAYS_PER_WEEK = 7
const HALF_ROWS = 3 // 3 verbal-rows + hairline + 3 quant-rows = a 6-row stack
const TOTAL_DAYS = WEEKS * DAYS_PER_WEEK // 84

// Theme-aware ramp via OKLCH color-mix. Sand/Sage/Ink/Rose all just
// work — when the palette changes, every cell re-derives without
// authoring four ramps. Zero floor is `--hairline-2` (a touch above
// hairline) so empty days still exist on the grid.
const RAMP = [
  'var(--hairline-2)',
  'color-mix(in oklch, var(--accent) 22%, var(--bg))',
  'color-mix(in oklch, var(--accent) 55%, var(--bg))',
  'var(--accent)',
]

function bucket(n: number): number {
  if (n <= 0) return 0
  if (n < 5) return 1
  if (n < 12) return 2
  return 3
}

type Props = {
  /** From `stats.attemptsDaily`. Pass null/undefined to render the
   *  empty placeholder while stats are loading or the worker hasn't
   *  rolled out the field yet. */
  days: readonly AttemptsDailyBucket[] | null | undefined
}

export function ConsistencyHeat({ days }: Props) {
  // Use only the last TOTAL_DAYS entries; if we get more from a
  // future schema bump, trim from the head (oldest entries dropped).
  const safeDays =
    days && days.length >= TOTAL_DAYS
      ? days.slice(-TOTAL_DAYS)
      : days && days.length > 0
        ? padToWindow(days)
        : null

  return (
    <section
      data-testid="consistency-heat"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Eyebrow>Närvaro · senaste 12 veckorna</Eyebrow>
        <Legend />
      </div>

      {safeDays ? <MonthLabels days={safeDays} /> : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <HalfGrid days={safeDays} half="verbal" rows={HALF_ROWS} />
        <div style={{ height: 1, background: 'var(--hairline)', margin: '2px 0' }} />
        <HalfGrid days={safeDays} half="quant" rows={HALF_ROWS} />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        <span>Verbal ↑ · Kvant ↓</span>
        <span>{safeDays ? signalSummary(safeDays) : 'väntar på data'}</span>
      </div>
    </section>
  )
}

// Pad shorter daily arrays out to the 84-entry window with zero days
// at the head so the grid never has missing columns. Helps the first
// session ever (when only one day of data exists) still render the
// 12-week shape.
function padToWindow(days: readonly AttemptsDailyBucket[]): AttemptsDailyBucket[] {
  const out: AttemptsDailyBucket[] = []
  const need = TOTAL_DAYS - days.length
  if (need > 0) {
    // Derive synthetic earlier-day entries — date strings backfilled
    // from the oldest known entry, all with zero counts.
    const oldest = days[0]
    const oldestDate = new Date(`${oldest.date}T00:00:00Z`)
    for (let i = need; i > 0; i--) {
      const d = new Date(oldestDate.getTime() - i * 24 * 60 * 60_000)
      const ymd = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
      out.push({ date: ymd, n: 0, verbal: 0, quant: 0 })
    }
  }
  for (const d of days) out.push(d)
  return out
}

function HalfGrid({
  days,
  half,
  rows,
}: {
  days: readonly AttemptsDailyBucket[] | null
  half: 'verbal' | 'quant'
  rows: number
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${WEEKS}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gridAutoFlow: 'column',
        gap: 4,
        aspectRatio: `${WEEKS} / ${rows}`,
        width: '100%',
      }}
      role="img"
      aria-label={half === 'verbal' ? 'Verbal närvaro' : 'Kvant närvaro'}
    >
      {Array.from({ length: WEEKS * rows }).map((_, i) => {
        const col = Math.floor(i / rows)
        const row = i % rows
        // Each half-row samples weekdays 0, 2, 4 of the column's
        // week — a representative slice that fills the 3-row grid
        // without showing the same day twice in the same half.
        const dayIndex = col * DAYS_PER_WEEK + row * 2
        const d = days?.[dayIndex]
        if (!d) {
          // Empty placeholder cells when stats haven't loaded. The
          // grid is position-keyed by design; biome flags index keys
          // as a smell but here every cell IS its position.
          return (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: position-as-key intentional
              key={`empty-${col}-${row}-${half}`}
              style={{
                background: 'var(--hairline-2)',
                aspectRatio: '1 / 1',
                display: 'block',
              }}
            />
          )
        }
        const n = half === 'verbal' ? d.verbal : d.quant
        const b = bucket(n)
        return (
          <button
            type="button"
            key={`${d.date}-${half}-${row}`}
            title={`${d.date} · ${n} ${half === 'verbal' ? 'verbala' : 'kvant'}-frågor`}
            className="hpc-heat-cell"
            style={{
              background: RAMP[b],
              aspectRatio: '1 / 1',
              display: 'block',
              border: 'none',
              padding: 0,
              cursor: 'help',
            }}
          />
        )
      })}
      <style>{`
        .hpc-heat-cell:hover, .hpc-heat-cell:focus-visible {
          outline: 1px solid var(--accent);
          outline-offset: 1px;
        }
      `}</style>
    </div>
  )
}

function MonthLabels({ days }: { days: readonly AttemptsDailyBucket[] }) {
  // Walk the 12 column boundaries and emit a month label only when
  // crossing a new month. Sparse so the grid stays uncluttered.
  const labels: Array<{ col: number; label: string }> = []
  let lastMonth = -1
  for (let col = 0; col < WEEKS; col++) {
    const firstDay = days[col * DAYS_PER_WEEK]
    if (!firstDay) continue
    const m = new Date(`${firstDay.date}T00:00:00Z`).getUTCMonth()
    if (m !== lastMonth) {
      labels.push({ col, label: SV_MONTHS[m] })
      lastMonth = m
    }
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${WEEKS}, 1fr)`,
        fontFamily: 'var(--font-mono)',
        fontSize: 10.5,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        height: 14,
      }}
    >
      {Array.from({ length: WEEKS }).map((_, col) => {
        const label = labels.find((l) => l.col === col)
        return (
          // Position is the identity here.
          // biome-ignore lint/suspicious/noArrayIndexKey: position-as-key intentional
          <span key={col} style={{ textAlign: 'left' }}>
            {label?.label ?? ''}
          </span>
        )
      })}
    </div>
  )
}

const SV_MONTHS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'maj',
  'jun',
  'jul',
  'aug',
  'sep',
  'okt',
  'nov',
  'dec',
]

function Legend() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-mono)',
        fontSize: 10.5,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
      }}
    >
      <span>färre</span>
      {RAMP.map((c) => (
        <span key={c} style={{ background: c, width: 10, height: 10, display: 'inline-block' }} />
      ))}
      <span>fler</span>
    </div>
  )
}

// Surface a signal-bearing summary instead of a tally. The director's
// read called the "84 aktiva dagar · 1247 frågor totalt" line dead
// copy — replaced with the trailing streak (when it ties the record)
// or the longest streak with the date it broke.
function signalSummary(days: readonly AttemptsDailyBucket[]): string {
  let longest = 0
  let running = 0
  let longestEndIso: string | null = null
  let runningEndIso: string | null = null
  for (const d of days) {
    if (d.n > 0) {
      running += 1
      runningEndIso = d.date
      if (running > longest) {
        longest = running
        longestEndIso = runningEndIso
      }
    } else {
      running = 0
    }
  }
  let current = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].n > 0) current += 1
    else break
  }
  if (longest === 0) return 'inga aktiva dagar än'
  if (current === longest && current > 0) return `Aktuell serie: ${current} dagar (rekord)`
  const brokeAt = findBrokeAt(days, longestEndIso)
  return brokeAt
    ? `Längsta serie: ${longest} dagar · senast bruten ${formatSwedishShort(brokeAt)}`
    : `Längsta serie: ${longest} dagar`
}

function findBrokeAt(
  days: readonly AttemptsDailyBucket[],
  longestEndIso: string | null,
): string | null {
  if (!longestEndIso) return null
  const idx = days.findIndex((d) => d.date === longestEndIso)
  if (idx < 0 || idx === days.length - 1) return null
  return days[idx + 1].date
}

function formatSwedishShort(iso: string): string {
  const [, m, d] = iso.split('-')
  const month = SV_MONTHS[parseInt(m, 10) - 1]
  return `${parseInt(d, 10)} ${month}`
}

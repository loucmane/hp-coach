// Heat Strip Variant C — Director's read.
//
// Variant B plus every refinement from the design critique:
//
//   - Theme-aware accent ramp via `color-mix(in oklch, var(--accent)
//     <pct>%, var(--bg))`. Sand/Sage/Ink/Rose palettes all work
//     without authoring four ramps. Zero floor is `--hairline-2`
//     (not pure background) so empty days still exist on the grid.
//   - Sparse month eyebrows above the grid (Mar / Apr / Maj) at
//     column boundaries. The 12-week grid was a calendar without
//     dates — now it's anchored.
//   - Two-halves stack (verbal top / quant bottom) — HP-specific
//     move. Same component, twice the story: the dogfood user
//     splits practice along the exam's structural axis daily.
//   - Real signal-bearing summary line: `Längsta serie: …` instead
//     of `N aktiva dagar · N frågor totalt` (which is a tally, not
//     a story).
//   - Hover outline on cells at `--accent` plus focus state for
//     keyboard navigation.

import { Eyebrow } from '@/components/primitives'
import { FIXTURE_HEAT_DAYS, type HeatDay } from '@/lib/devbakeFixtures'

const WEEKS = 12
const DAYS_PER_WEEK = 7
const HALF_ROWS = 3 // 3+1 separator+3 → 6 weekday rows split into verbal/quant. Spacer between.

// Single-color OKLCH ramp. Zero floor is hairline-2 (a touch above
// hairline) so empty days exist on the grid without being invisible.
// The other three buckets mix the user's --accent with --bg at
// increasing weights — when the palette changes (Sand/Sage/Ink/Rose),
// every cell re-derives.
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

// Synthetic verbal/quant split. The fixture has only total counts per
// day; for the bake-off we split deterministically (60% verbal / 40%
// quant on heavy days, randomised on light days using day index as a
// stable seed). Production data will arrive pre-split from the worker.
function splitHalves(d: HeatDay): { verbal: number; quant: number } {
  if (d.n === 0) return { verbal: 0, quant: 0 }
  const seed = parseInt(d.date.replace(/-/g, ''), 10) % 7
  const verbalShare = 0.45 + (seed / 7) * 0.3
  const verbal = Math.round(d.n * verbalShare)
  return { verbal, quant: d.n - verbal }
}

export function HeatStripC() {
  const days = FIXTURE_HEAT_DAYS.slice(-(WEEKS * DAYS_PER_WEEK))

  return (
    <section
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--radius)',
        padding: 'clamp(20px, 2vw + 12px, 32px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Eyebrow>Närvaro · senaste 12 veckorna</Eyebrow>
        <Legend />
      </div>

      <MonthLabels days={days} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Verbal half — top 3 rows */}
        <HalfGrid days={days} half="verbal" rows={HALF_ROWS} />
        {/* Hairline between halves so the structural split reads */}
        <div style={{ height: 1, background: 'var(--hairline)', margin: '2px 0' }} />
        {/* Quant half — bottom 3 rows */}
        <HalfGrid days={days} half="quant" rows={HALF_ROWS} />
      </div>

      {/* Half labels under the grid */}
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
        <span>{signalSummary(days)}</span>
      </div>
    </section>
  )
}

function HalfGrid({
  days,
  half,
  rows,
}: {
  days: HeatDay[]
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
        // Each column maps to a week (7 days). For a 3-row half, we
        // sample 3 of the week's 7 days (representative — production
        // would aggregate properly).
        const row = i % rows
        const dayIndex = col * DAYS_PER_WEEK + row * 2 // sample weekdays 0, 2, 4
        const d = days[dayIndex]
        if (!d) return <span key={`empty-${col}-${row}-${half}`} />
        const split = splitHalves(d)
        const n = half === 'verbal' ? split.verbal : split.quant
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

function MonthLabels({ days }: { days: HeatDay[] }) {
  // Find which columns cross a month boundary; render a sparse
  // mono label above the grid only at those columns.
  const labels: Array<{ col: number; label: string }> = []
  let lastMonth = -1
  for (let col = 0; col < WEEKS; col++) {
    const firstDay = days[col * DAYS_PER_WEEK]
    if (!firstDay) continue
    const m = new Date(firstDay.date).getMonth()
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
          // Grid columns have no natural id — position IS the identity.
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

function signalSummary(days: HeatDay[]): string {
  // Walk backward from today, count consecutive non-zero days for
  // the current streak and the longest streak in the window. Also
  // surface when the longest streak ended.
  let longest = 0
  let current = 0
  let longestEndIso: string | null = null
  let running = 0
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
  // Current trailing streak — count from end backwards while >0.
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].n > 0) current += 1
    else break
  }
  if (longest === 0) return 'inga aktiva dagar än'
  if (current === longest) return `Aktuell serie: ${current} dagar (rekord)`
  // Find when the longest broke — first zero after the longestEndIso
  const brokeAt = findBrokeAt(days, longestEndIso)
  return brokeAt
    ? `Längsta serie: ${longest} dagar · senast bruten ${formatSwedishShort(brokeAt)}`
    : `Längsta serie: ${longest} dagar`
}

function findBrokeAt(days: HeatDay[], longestEndIso: string | null): string | null {
  if (!longestEndIso) return null
  const idx = days.findIndex((d) => d.date === longestEndIso)
  if (idx < 0 || idx === days.length - 1) return null
  // The day after the longest streak's last active day — that's when it broke.
  const next = days[idx + 1]
  return next.date
}

function formatSwedishShort(iso: string): string {
  const [, m, d] = iso.split('-')
  const month = SV_MONTHS[parseInt(m, 10) - 1]
  return `${parseInt(d, 10)} ${month}`
}

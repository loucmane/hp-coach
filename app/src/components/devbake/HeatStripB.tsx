// Heat Strip Variant B — 12-week GitHub-style heatmap.
//
// 12×7 grid (84 cells, ~12 weeks). Each cell is a dot whose intensity
// scales to attempts that day, in 4 buckets (none / light / medium /
// heavy) on a single-color ramp (`--hairline` → `--ink`). Mirrors the
// GitHub contribution graph in shape, but executed in the HP-Coach
// editorial language — no green-saturation rainbow.
//
// Fixture data lives in @/lib/devbakeFixtures (FIXTURE_HEAT_DAYS, 84
// entries). The bake-off renders the SHAPE so the dogfood user can
// judge whether to commit to the worker change needed for live data.

import { Eyebrow } from '@/components/primitives'
import { FIXTURE_HEAT_DAYS, type HeatDay } from '@/lib/devbakeFixtures'

const WEEKS = 12
const DAYS_PER_WEEK = 7
const TOTAL_DAYS = WEEKS * DAYS_PER_WEEK // 84

// Single-color ramp — pencil to ink. Four levels keep the grid
// legible at 12 cells across; finer buckets blur into noise at this
// size. `--hairline` for zero so empty days are still rendered (the
// gaps are part of the story).
const RAMP = ['var(--hairline)', 'var(--muted-2)', 'var(--ink-2)', 'var(--ink)']

function bucket(n: number): number {
  if (n <= 0) return 0
  if (n < 5) return 1
  if (n < 12) return 2
  return 3
}

export function HeatStripB() {
  // Last `TOTAL_DAYS` entries from the fixture, oldest first. We render
  // a 12-column × 7-row grid where column = week, row = weekday.
  const days = FIXTURE_HEAT_DAYS.slice(-TOTAL_DAYS)
  // Each cell at (col, row) maps to day index `col * 7 + row`.
  const cell = (col: number, row: number): HeatDay | undefined => days[col * DAYS_PER_WEEK + row]

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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${WEEKS}, 1fr)`,
          gridTemplateRows: `repeat(${DAYS_PER_WEEK}, 1fr)`,
          gridAutoFlow: 'column',
          gap: 4,
          aspectRatio: `${WEEKS} / ${DAYS_PER_WEEK}`,
          width: '100%',
        }}
        role="img"
        aria-label="Närvaro de senaste 12 veckorna"
      >
        {Array.from({ length: TOTAL_DAYS }).map((_, i) => {
          const col = Math.floor(i / DAYS_PER_WEEK)
          const row = i % DAYS_PER_WEEK
          const d = cell(col, row)
          if (!d) return <span key={`empty-${col}-${row}`} />
          const b = bucket(d.n)
          return (
            <span
              key={d.date}
              title={`${d.date} · ${d.n} frågor`}
              style={{
                background: RAMP[b],
                borderRadius: 2,
                aspectRatio: '1 / 1',
                display: 'block',
              }}
            />
          )
        })}
      </div>

      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {summary(days)}
      </div>
    </section>
  )
}

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
        <span
          key={c}
          style={{ background: c, width: 10, height: 10, borderRadius: 2, display: 'inline-block' }}
        />
      ))}
      <span>fler</span>
    </div>
  )
}

function summary(days: HeatDay[]): string {
  const active = days.filter((d) => d.n > 0).length
  const total = days.reduce((n, d) => n + d.n, 0)
  return `${active} aktiva dagar · ${total} frågor totalt`
}

// TrendChart — 12-week SVG line chart of projected score over time.
//
// Editorial chart language: thin ink polyline, dashed accent line at
// the 1.8 "mål" target, dot per real data point (skip when a week had
// zero attempts). Y-axis gridlines at 0.5 / 1.0 / 1.5 / 2.0 in mono
// at 9px. No grid lines on x — labels only at v—12 / v—6 / now.
//
// Ported from the original design prototype (`05 · Framsteg & Mock`,
// screens-desktop.jsx#DskProgress). The composition is mostly verbatim;
// we adapted the data shape to our WeeklyBucket type and added a null-
// gap polyline so weeks with zero attempts don't fake a flat line.

import type { WeeklyBucket } from '@/api/hooks/useStats'
import { isoWeek, weeklyScore } from '@/lib/scoring'

const TARGET = 1.8 // top-percentile threshold; tunable

export function TrendChart({ weekly }: { weekly: WeeklyBucket[] }) {
  const W = 580
  const H = 200
  const PAD_X = 20
  const PAD_Y = 20

  // Map a 0..2 score to an SVG y coordinate (inverted, since SVG y
  // grows downward). The plot region is H - 2*PAD_Y tall.
  const yFor = (score: number) => H - PAD_Y - (score / 2.0) * (H - 2 * PAD_Y)
  const xFor = (i: number) =>
    weekly.length > 1 ? PAD_X + (i / (weekly.length - 1)) * (W - 2 * PAD_X) : W / 2

  // Split the series into runs of non-null points so we draw multiple
  // polylines instead of one line that jumps across a null gap.
  const runs: { i: number; score: number }[][] = []
  let cur: { i: number; score: number }[] = []
  weekly.forEach((b, i) => {
    const s = weeklyScore(b)
    if (s == null) {
      if (cur.length > 0) runs.push(cur)
      cur = []
    } else {
      cur.push({ i, score: s })
    }
  })
  if (cur.length > 0) runs.push(cur)

  const hasData = runs.length > 0
  const xLabels = weekly.length > 0 ? buildXLabels(weekly) : []

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', maxHeight: H, display: 'block' }}
      role="img"
      aria-label="Projicerat resultat senaste 12 veckorna"
    >
      <title>Trend — senaste 12 veckorna</title>
      {/* Horizontal gridlines */}
      {[0.5, 1.0, 1.5, 2.0].map((g) => (
        <g key={g}>
          <line
            x1={PAD_X}
            x2={W - PAD_X}
            y1={yFor(g)}
            y2={yFor(g)}
            stroke="var(--hairline)"
            strokeDasharray="2 3"
          />
          <text
            x={0}
            y={yFor(g) - 4}
            fontSize="9"
            fill="var(--muted)"
            fontFamily="var(--font-mono)"
          >
            {g.toFixed(1)}
          </text>
        </g>
      ))}
      {/* Target line at 1.8 — the editorial "mål 1,8" hairline */}
      <line
        x1={PAD_X}
        x2={W - PAD_X}
        y1={yFor(TARGET)}
        y2={yFor(TARGET)}
        stroke="var(--accent)"
        strokeDasharray="3 3"
        opacity="0.55"
      />
      <text
        x={W - PAD_X - 40}
        y={yFor(TARGET) - 6}
        fontSize="9"
        fill="var(--accent)"
        fontFamily="var(--font-mono)"
      >
        mål {TARGET.toFixed(1)}
      </text>
      {/* Trend runs — keyed by the first bucket's week-index so React
       *  preserves animation state across re-renders. */}
      {runs.map((run) => (
        <polyline
          key={`run-${run[0].i}`}
          fill="none"
          stroke="var(--ink)"
          strokeWidth="1.6"
          points={run.map((p) => `${xFor(p.i)},${yFor(p.score)}`).join(' ')}
        />
      ))}
      {runs.flat().map((p) => (
        <circle key={p.i} cx={xFor(p.i)} cy={yFor(p.score)} r={2.4} fill="var(--ink)" />
      ))}
      {/* X labels — three anchor points for readability */}
      {xLabels.map((label) => (
        <text
          key={label.i}
          x={xFor(label.i)}
          y={H - 4}
          fontSize="9"
          fill="var(--muted)"
          fontFamily="var(--font-mono)"
          textAnchor="middle"
        >
          {label.text}
        </text>
      ))}
      {!hasData && (
        <text
          x={W / 2}
          y={H / 2}
          fontSize="11"
          fill="var(--muted)"
          fontFamily="var(--font-display)"
          textAnchor="middle"
          fontStyle="italic"
        >
          Inga försök ännu — börja drilla för att se trenden
        </text>
      )}
    </svg>
  )
}

function buildXLabels(weekly: WeeklyBucket[]): { i: number; text: string }[] {
  if (weekly.length === 0) return []
  // Three anchors: first, middle, last
  const anchors = [0, Math.floor(weekly.length / 2), weekly.length - 1]
  return anchors.map((i) => {
    const wk = isoWeek(new Date(weekly[i].weekStart))
    return { i, text: `v${wk}` }
  })
}

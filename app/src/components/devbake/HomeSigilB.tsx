// Home Sigil Variant B — Quarter-arc.
//
// An editorial arc curving from the top-right corner inward, divided
// into N segments matching `plan.items.length`. Completed segments
// render in `--ink`; pending in `--hairline`. The arc's curvature
// mirrors the corner-bracket BrandMark, so the wordmark and sigil
// read as a typographic pair (one in each top corner of the page).
//
// When all complete, a small em-dash + date stamp flourishes under
// the arc — the "I closed today" moment. Single-fire per day.

import { FIXTURE_PLAN } from '@/lib/devbakeFixtures'

import { HomeHeroPreview } from './HomeSigilA'

const STREAK_DAYS = 14

export function HomeSigilB() {
  const total = FIXTURE_PLAN.items.length
  const completed = FIXTURE_PLAN.items.filter((i) => i.completed).length
  const allDone = completed === total

  return (
    <HomeHeroPreview>
      <QuarterArc segments={total} filled={completed} />
      <div
        style={{
          marginTop: 10,
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'right',
        }}
      >
        {allDone ? `— klart · ${STREAK_DAYS} dagar` : `${completed} / ${total} · ${STREAK_DAYS} d`}
      </div>
      {allDone && (
        <div
          style={{
            marginTop: 4,
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ink-2)',
            textAlign: 'right',
          }}
        >
          26 maj
        </div>
      )}
    </HomeHeroPreview>
  )
}

function QuarterArc({ segments, filled }: { segments: number; filled: number }) {
  // SVG quarter-circle, 64×64, stroke-only. Path goes from (8, 56)
  // up to (56, 8) — a quadrant arc anchored to the bottom-left,
  // curving toward the top-right corner. Divide into `segments`
  // equal arcs along the path length (totalLength = approx π·R/2
  // for R≈48 → ~75 units). We use stroke-dasharray to draw N
  // independent dash segments with small gaps.
  const size = 64
  const radius = 48
  const cx = 8 // start x
  const cy = size - 8 // start y (bottom-left)
  // End point top-right (after the quarter turn):
  const ex = size - 8
  const ey = 8

  // Arc length for a quarter circle of radius R = π·R/2
  const arcLen = (Math.PI * radius) / 2
  const gap = 2.5
  const segLen = (arcLen - gap * (segments - 1)) / segments

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Dagens framsteg: ${filled} av ${segments} klart`}
      style={{ display: 'block' }}
    >
      {/* Background arc — pencil outline for pending segments */}
      <path
        d={`M ${cx} ${cy} A ${radius} ${radius} 0 0 1 ${ex} ${ey}`}
        fill="none"
        stroke="var(--hairline)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Filled arc — one dasharray per filled segment. We construct
       *  the dasharray so the first `filled` segments are visible (in
       *  ink), the remaining segments are invisible (pencil outline
       *  shows through). */}
      {filled > 0 && (
        <path
          d={`M ${cx} ${cy} A ${radius} ${radius} 0 0 1 ${ex} ${ey}`}
          fill="none"
          stroke="var(--ink)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={buildDashArray(segments, filled, segLen, gap)}
          style={{
            transition: 'stroke-dasharray 360ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      )}
    </svg>
  )
}

function buildDashArray(total: number, filled: number, segLen: number, gap: number): string {
  // Produce a dasharray that draws the first `filled` segments fully
  // and leaves the rest as 0-length dashes (with gap). e.g. 4 segs,
  // 2 filled, segLen 18, gap 2.5 →
  // "18,2.5,18,2.5,0,2.5,0,2.5,99999"
  // (The trailing huge gap ensures no wraparound rendering.)
  const parts: number[] = []
  for (let i = 0; i < total; i++) {
    parts.push(i < filled ? segLen : 0)
    if (i < total - 1) parts.push(gap)
  }
  parts.push(99999)
  return parts.join(',')
}

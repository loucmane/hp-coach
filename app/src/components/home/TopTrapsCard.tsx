// TopTrapsCard — Home surface that names the user's recurring trap
// patterns from their active mistake queue.
//
// Sits between the score line ("just nu · 0.65 / 2.0") and the
// daily plan card. Renders only when at least one trap meets the
// minimum miss-count threshold — empty state is intentionally silent
// so the surface vanishes during the user's good days.
//
// Each row:
//   1. Trap ID (mono, like KVA-TRAP-010)
//   2. Headline (display italic, from frameworks JSON tldr)
//   3. Miss count + week-over-week trend chip (mono, tabular nums)
//   4. Tap-target: the whole row links to /drill?framework=ID
//
// Mirrors the editorial rhythm of DiagnosticReport's ClusterCallout
// so the dogfood user feels the *same* aesthetic in both surfaces —
// the post-diagnostic moment AND the every-morning return.

import type { TopTrap } from '@/api/hooks/useTopTraps'
import { Eyebrow, Hairline } from '@/components/primitives'
import type { TrapTrend } from '@/lib/trapHistory'

type TopTrapsCardProps = {
  traps: TopTrap[]
}

export function TopTrapsCard({ traps }: TopTrapsCardProps) {
  if (traps.length === 0) return null

  return (
    <section
      data-testid="home-top-traps"
      className="reveal"
      style={{
        animationDelay: '120ms',
        paddingLeft: 'clamp(14px, 1vw + 8px, 22px)',
        borderLeft: '2px solid var(--ink)',
      }}
    >
      <Eyebrow>Återkommande fällor</Eyebrow>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '10px 0 0 0',
        }}
      >
        {traps.map((trap, i) => (
          <li
            key={trap.framework_id}
            data-testid={`top-trap-row-${i}`}
            style={{
              marginTop: i === 0 ? 0 : 14,
              paddingTop: i === 0 ? 0 : 14,
              borderTop: i === 0 ? 'none' : '1px solid var(--hairline)',
            }}
          >
            <TrapRow trap={trap} />
          </li>
        ))}
      </ul>
      <Hairline style={{ marginTop: 18, marginBottom: 0 }} />
    </section>
  )
}

function TrapRow({ trap }: { trap: TopTrap }) {
  // Plain anchor (not TanStack <Link>) — keeps the test render simple
  // (no router context needed) and the surface is a one-tap target, so
  // we don't need router-level prefetch behaviour.
  //
  // Target is `/drill?framework=ID` rather than the lesson page —
  // action-first per ADHD-PI: the user has already missed this trap
  // 2+ times, so they don't need to re-read it; they need fresh
  // exposure to the same pattern.
  const href = `/drill?framework=${trap.framework_id}`
  return (
    <a
      href={href}
      data-testid="top-trap-link"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: '4px clamp(10px, 1vw + 6px, 18px)',
        alignItems: 'baseline',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        style={{
          gridColumn: '1 / 2',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: 'var(--font-mono-track)',
          textTransform: 'uppercase',
          color: 'var(--ink-2)',
        }}
      >
        {trap.framework_id}
      </div>
      <div
        style={{
          gridColumn: '2 / 3',
          gridRow: '1 / 3',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 3,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: 'var(--ink)' }}>{trap.count} ggr</span>
        <TrendChip trend={trap.trend} />
      </div>
      <div
        style={{
          gridColumn: '1 / 2',
          fontFamily: 'var(--font-display)',
          fontStyle: trap.headline ? 'italic' : 'normal',
          fontSize: 'clamp(15px, 0.4vw + 13px, 17px)',
          lineHeight: 1.35,
          color: trap.headline ? 'var(--ink)' : 'var(--ink-2)',
          marginTop: 2,
        }}
      >
        {trap.headline ?? 'Öva detta mönster →'}
      </div>
    </a>
  )
}

/** Small trend signal next to the miss count. Renders nothing when
 *  there's no comparable history — week 1 users see plain counts
 *  until snapshots build up. */
function TrendChip({ trend }: { trend: TrapTrend }) {
  if (trend.kind === 'unknown') {
    return null
  }
  if (trend.kind === 'new') {
    return (
      <span
        data-testid="trap-trend"
        data-trend="new"
        style={{ color: 'var(--muted)', fontSize: 10 }}
      >
        ny
      </span>
    )
  }
  const { delta } = trend
  if (delta === 0) {
    return (
      <span
        data-testid="trap-trend"
        data-trend="flat"
        style={{ color: 'var(--muted)', fontSize: 10 }}
      >
        ↔
      </span>
    )
  }
  const arrow = delta < 0 ? '↓' : '↑'
  // Down = good (fewer misses), up = struggling. We don't color these
  // — the arrow direction carries the meaning, and chroma would push
  // a value judgement onto every glance. Subtle muted tone keeps the
  // chip background-noise rather than alarm-stripe.
  return (
    <span
      data-testid="trap-trend"
      data-trend={delta < 0 ? 'down' : 'up'}
      style={{ color: 'var(--ink-2)', fontSize: 10 }}
    >
      {arrow}
      {Math.abs(delta)}
    </span>
  )
}

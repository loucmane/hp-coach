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
import { Eyebrow } from '@/components/primitives'
import type { TrapTrend } from '@/lib/trapHistory'

type TopTrapsCardProps = {
  traps: TopTrap[]
}

export function TopTrapsCard({ traps }: TopTrapsCardProps) {
  if (traps.length === 0) return null

  return (
    <section data-testid="home-top-traps" className="reveal" style={{ animationDelay: '120ms' }}>
      <Eyebrow>Återkommande fällor</Eyebrow>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '14px 0 0 0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {traps.map((trap, i) => (
          <li
            key={trap.framework_id}
            data-testid={`top-trap-row-${i}`}
            style={{
              borderTop: i === 0 ? '1px solid var(--hairline)' : 'none',
              borderBottom: '1px solid var(--hairline)',
            }}
          >
            <TrapRow trap={trap} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function TrapRow({ trap }: { trap: TopTrap }) {
  // Demoted from the original italic+heavy-left-rule treatment to a
  // quiet `120px · 1fr · 56px` ruled row — the strip is diagnostic
  // (here are the patterns you keep falling into), not prescriptive.
  // It sits below the focal plan card via Home's composition and
  // shouldn't compete with it for first-read.
  //
  // Target is `/drill?framework=ID` rather than the lesson page —
  // action-first per ADHD-PI: user has already missed this 2+ times.
  const href = `/drill?framework=${trap.framework_id}`
  return (
    <a
      href={href}
      data-testid="top-trap-link"
      style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr 56px',
        gap: 16,
        alignItems: 'baseline',
        padding: '12px 0',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: 'var(--font-mono-track)',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        {trap.framework_id}
      </div>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          lineHeight: 1.4,
          color: 'var(--ink-2)',
        }}
      >
        {trap.headline ?? 'Öva detta mönster →'}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: 'var(--font-mono-track)',
          textTransform: 'uppercase',
          color: 'var(--ink-2)',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          display: 'inline-flex',
          gap: 6,
          justifyContent: 'flex-end',
          alignItems: 'baseline',
          whiteSpace: 'nowrap',
        }}
      >
        <span>{trap.count} ggr</span>
        <TrendChip trend={trap.trend} />
      </span>
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

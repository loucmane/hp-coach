// TopTrapsCard — Home surface that names the user's recurring trap
// patterns from their active mistake queue.
//
// Sits between the score line ("just nu · 0.65 / 2.0") and the
// daily plan card. Renders only when at least one trap meets the
// minimum miss-count threshold — empty state is intentionally silent
// so the surface vanishes during the user's good days. A signal-
// without-noise card.
//
// Each row:
//   1. Trap ID (mono, like KVA-TRAP-010)
//   2. Headline (display italic, from frameworks JSON tldr)
//   3. Miss count (mono, tabular nums)
//   4. Tap-target: the whole row links to /lektion#trap-id
//
// Mirrors the editorial rhythm of DiagnosticReport's ClusterCallout
// so the dogfood user feels the *same* aesthetic in both surfaces —
// the post-diagnostic moment AND the every-morning return.

import type { TopTrap } from '@/api/hooks/useTopTraps'
import { Eyebrow, Hairline } from '@/components/primitives'

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
  // exposure to the same pattern. The drill route's `?framework=`
  // deep-link (B1.1) plays the framework entry's authored
  // example_questions. The lesson is still one tap away via the
  // framework chip inside the drill flow.
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
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--ink)',
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {trap.count} ggr
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

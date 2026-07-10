// TopTrapsCard — "Dina fällor just nu" as M3 flat trap rows (M3H;
// spec devbake/l12/M3.tsx L831-843).
//
// A rail section (MÖNSTER) listing the user's recurring trap patterns
// from their active mistake queue: section tag + plain-language
// headline on the left, the trap id + miss count + week-over-week
// trend on the mono right. Renders full rows once at least one trap
// meets the threshold.
//
// Each row links to /drill?framework=ID — action-first per ADHD-PI:
// the user has already missed this pattern 2+ times.
//
// No traps yet (task #78 — the low-data Home shouldn't leave an empty
// void where this section would sit): a single muted invitation line,
// same rail chassis, no boxed empty-state card and no illustration —
// this is a book page, not a SaaS dashboard.

import type { TopTrap } from '@/api/hooks/useTopTraps'
import { DrillRailSection } from '@/components/drill/DrillRailSection'
import type { TrapTrend } from '@/lib/trapHistory'

type TopTrapsCardProps = {
  traps: TopTrap[]
}

export function TopTrapsCard({ traps }: TopTrapsCardProps) {
  if (traps.length === 0) {
    return (
      <section data-testid="home-top-traps-empty">
        <DrillRailSection meta="Mönster" delay={320}>
          <p className="hpc-m3-quiet-line">Inga återkommande fällor än — de dyker upp här.</p>
        </DrillRailSection>
      </section>
    )
  }

  return (
    <section data-testid="home-top-traps">
      <DrillRailSection meta="Mönster" delay={320}>
        <h2 className="hpc-m3-h">Dina fällor just nu</h2>
        <div>
          {traps.map((trap) => (
            <a
              key={trap.framework_id}
              href={`/drill?framework=${trap.framework_id}`}
              data-testid="top-trap-link"
              className="hpc-m3-trap"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <span className="hpc-m3-trap-t">
                <span className="hpc-m3-tag">{trap.section}</span>
                {trap.headline ?? 'Öva detta mönster →'}
              </span>
              <span className="hpc-m3-trap-n">
                {trap.framework_id} · {trap.count} ggr <TrendChip trend={trap.trend} />
              </span>
            </a>
          ))}
        </div>
      </DrillRailSection>
    </section>
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
  // Down = good (fewer misses), up = struggling. Uncolored — the arrow
  // carries the meaning; chroma would push a value judgement onto
  // every glance.
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

// RecentPassesCard — the "Senaste passen" glance on Home (bake-off B).
//
// Sits at the BOTTOM of Home, below the daily plan + traps: history is
// reflection, not the next action, so it must not compete with "what do
// I do now". A compact horizontal strip of the last 3 completed passes,
// each linking to its Klart via ?done=<id>; "alla pass →" opens the full
// /historik journal (which the nav-rail 'historik' link also reaches).
//
// Renders nothing until there's at least one completed pass — a first-day
// user sees no empty shell.

import { Link } from '@tanstack/react-router'

import type { SessionHistoryRow } from '@/api/hooks/useSessions'
import { DrillRailSection } from '@/components/drill/DrillRailSection'

function passLabel(row: SessionHistoryRow): string {
  return row.kind === 'adaptive_review' ? 'Rep' : (row.sections ?? 'Övning')
}

function passRoute(row: SessionHistoryRow): '/drill' | '/repetition' {
  return row.kind === 'adaptive_review' ? '/repetition' : '/drill'
}

// Presentational — the route fetches history (via useSessionHistory) and
// passes it down, keeping HomeMobile QueryClient-free like its siblings.
export function RecentPassesCard({ passes }: { passes: readonly SessionHistoryRow[] }) {
  const rows = passes.slice(0, 3)
  if (rows.length === 0) return null

  return (
    <DrillRailSection meta="Tidigare pass" delay={360} testid="home-recent-passes">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h2 className="hpc-m3-h" style={{ marginBottom: 0 }}>
          Senaste passen
        </h2>
        <Link
          to="/historik"
          data-testid="home-recent-all"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            textDecoration: 'none',
          }}
        >
          alla pass →
        </Link>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
        {rows.map((row) => (
          <Link
            key={row.id}
            to={passRoute(row)}
            search={{ done: row.id }}
            data-testid={`home-recent-pass-${row.id}`}
            style={{
              flex: '0 0 auto',
              minWidth: 92,
              border: '1px solid var(--hairline)',
              borderRadius: 'calc(var(--radius) * 0.5)',
              padding: '11px 14px',
              textDecoration: 'none',
              color: 'inherit',
              background: 'var(--panel)',
            }}
          >
            <span className="hpc-m3-tag">{passLabel(row)}</span>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                letterSpacing: '-0.01em',
                marginTop: 5,
              }}
            >
              {row.correct}/{row.total}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--muted)',
                marginTop: 1,
              }}
            >
              rätt
            </div>
          </Link>
        ))}
      </div>
    </DrillRailSection>
  )
}

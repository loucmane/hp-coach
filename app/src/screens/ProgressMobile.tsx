// /progress — Framsteg.
//
// Editorial pattern: one bold streak number at the top sets the tone,
// then three quiet sections (övning, repetition, träffsäkerhet) flow
// underneath separated by hairlines. Numbers are display-font tabular
// nums; labels are muted mono. Same visual grammar as DrillResult.
//
// All values come from /api/me/stats (useStats hook). While the query
// is loading we render dimmed placeholders ("—") so the layout doesn't
// thrash on hydration.

import type { Stats } from '@/api/hooks/useStats'
import { Eyebrow, Hairline, Mono } from '@/components/primitives'

type ProgressMobileProps = {
  stats?: Stats
  loading?: boolean
}

export function ProgressMobile({ stats, loading }: ProgressMobileProps) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        // 100px clears the absolutely-positioned BottomTabs.
        padding: '36px 22px 100px',
        overflowY: 'auto',
        color: 'var(--ink)',
      }}
    >
      <Mono>Framsteg</Mono>

      {/* Streak — the headline number. Big display font, tabular nums so
          a 1→2 day transition doesn't shift the layout. */}
      <div
        style={{
          marginTop: 18,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 6,
        }}
      >
        <BigNumber value={stats?.streakDays} loading={loading} />
        <Mono>{stats?.streakDays === 1 ? 'Dag i rad' : 'Dagar i rad'}</Mono>
      </div>

      <Hairline style={{ marginTop: 28, marginBottom: 24 }} />

      <Eyebrow>Övning</Eyebrow>
      <StatList
        rows={[
          {
            label: 'besvarade idag',
            value: stats?.attempts.today,
          },
          {
            label: 'denna vecka',
            value: stats?.attempts.thisWeek,
          },
          {
            label: 'totalt',
            value: stats?.attempts.total,
          },
          {
            label: 'övningar denna vecka',
            value: stats?.drills.thisWeek,
          },
          {
            label: 'rätt senaste veckan',
            value: stats?.accuracy7d == null ? null : `${Math.round(stats.accuracy7d * 100)} %`,
          },
        ]}
        loading={loading}
      />

      <Hairline style={{ marginTop: 24, marginBottom: 24 }} />

      <Eyebrow>Repetition</Eyebrow>
      <StatList
        rows={[
          {
            label: 'att repetera nu',
            value: stats?.mistakes.due,
          },
          {
            label: 'aktiva i kön',
            value: stats?.mistakes.active,
          },
          {
            label: 'utlärda',
            value: stats?.mistakes.resolved,
          },
        ]}
        loading={loading}
      />
    </div>
  )
}

// ── Internals ─────────────────────────────────────────────────────────

function BigNumber({ value, loading }: { value: number | undefined; loading?: boolean }) {
  // While loading, show the em-dash placeholder; once data arrives,
  // even a 0 streak gets a real "0" — that's a true value, not missing.
  const display = loading || value === undefined ? '—' : String(value)
  return (
    <span
      data-testid="progress-streak"
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 64,
        lineHeight: 1,
        color: 'var(--ink)',
        letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {display}
    </span>
  )
}

type Row = {
  label: string
  value: number | string | null | undefined
}

function StatList({ rows, loading }: { rows: Row[]; loading?: boolean }) {
  return (
    <div
      style={{
        marginTop: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {rows.map((r) => (
        <div
          key={r.label}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            color: 'var(--ink-2)',
          }}
        >
          <span>{r.label}</span>
          <span
            style={{
              color: 'var(--ink)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {loading || r.value === undefined || r.value === null ? '—' : r.value}
          </span>
        </div>
      ))}
    </div>
  )
}

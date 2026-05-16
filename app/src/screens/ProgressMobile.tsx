// /progress — Framsteg, redesigned for the Phase B2 score model.
//
// The deliberate-practice composition:
//   1. PROJECTED TOTAL — the hero number. "1.62 / 2.00" reads as a
//      grade card cover, not a dashboard chip.
//   2. HALVES — verbal · quant, two quiet subscores under the hero.
//   3. PER-SECTION TABLE — every section as a row: letters · score ·
//      trend · confidence · last-touched. The user scans this to find
//      where to deliberately practice next.
//   4. FOKUS — the top 1-3 sections ranked by weakness. Concrete
//      drill-this-next recommendations. Skipped when no signal.
//   5. AKTIVITET — existing streak, drills, mistakes stats preserved
//      lower in the page (they're real, just not the hero anymore).
//
// All values come from /api/me/stats. The bySection block is the new
// data; lib/scoring.ts turns it into the grades / trends / weakness
// ranking rendered here.

import { Link } from '@tanstack/react-router'

import type { Stats } from '@/api/hooks/useStats'
import { Eyebrow, Hairline, Mono } from '@/components/primitives'
import { TrendChart } from '@/components/progress/TrendChart'
import { SECTION_KEYS, type Section } from '@/data/questions'
import {
  computeProjected,
  computeSectionScore,
  formatScore,
  formatSwedishDateShort,
  formatTrend,
  isoWeek,
  rankWeakness,
  type SectionScore,
} from '@/lib/scoring'

type ProgressMobileProps = {
  stats?: Stats
  loading?: boolean
}

export function ProgressMobile({ stats, loading }: ProgressMobileProps) {
  // Derived state — only meaningful when stats has landed.
  const scores: SectionScore[] = stats?.bySection
    ? SECTION_KEYS.map((section) => computeSectionScore(section, stats.bySection[section]))
    : []
  const projected = stats ? computeProjected(scores) : null
  const weak = stats ? rankWeakness(scores).slice(0, 3) : []

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 'clamp(28px, 2vw + 20px, 56px) var(--pad-lg) var(--frame-tabbar)',
        overflowY: 'auto',
        color: 'var(--ink)',
        maxWidth: '720px',
      }}
    >
      <Mono>FRAMSTEG</Mono>

      <ProjectedHero projected={projected?.total ?? null} loading={loading} />
      <Halves
        verbal={projected?.verbal ?? null}
        quant={projected?.quant ?? null}
        loading={loading}
      />

      <Hairline style={{ marginTop: 36, marginBottom: 24 }} />

      <WeeklyMasthead stats={stats} />

      {stats?.weekly && stats.weekly.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <TrendChart weekly={stats.weekly} />
        </div>
      )}

      <Hairline style={{ marginTop: 36, marginBottom: 24 }} />

      <Eyebrow>Sektioner</Eyebrow>
      <SectionTable scores={scores} loading={loading} />

      {weak.length > 0 && (
        <>
          <Hairline style={{ marginTop: 36, marginBottom: 24 }} />
          <Eyebrow>Fokus — drilla detta härnäst</Eyebrow>
          <FokusList weak={weak} />
        </>
      )}

      <Hairline style={{ marginTop: 36, marginBottom: 24 }} />

      <Eyebrow>Aktivitet</Eyebrow>
      <StatList
        rows={[
          { label: 'besvarade idag', value: stats?.attempts.today },
          { label: 'denna vecka', value: stats?.attempts.thisWeek },
          { label: 'totalt', value: stats?.attempts.total },
          { label: 'övningar denna vecka', value: stats?.drills.thisWeek },
          { label: 'streak', value: stats == null ? null : `${stats.streakDays} d` },
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
          { label: 'att repetera nu', value: stats?.mistakes.due },
          { label: 'aktiva i kön', value: stats?.mistakes.active },
          { label: 'utlärda', value: stats?.mistakes.resolved },
        ]}
        loading={loading}
      />
    </div>
  )
}

// ── Projected hero ────────────────────────────────────────────────

function ProjectedHero({ projected, loading }: { projected: number | null; loading?: boolean }) {
  return (
    <div
      style={{
        marginTop: 18,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 6,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.02em',
        }}
      >
        <span
          data-testid="progress-projected"
          style={{
            fontSize: 'clamp(64px, 12vw, 112px)',
            lineHeight: 1,
            color: 'var(--ink)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {loading ? '—' : formatScore(projected)}
        </span>
        <span
          style={{
            fontSize: 'clamp(20px, 2vw + 8px, 28px)',
            color: 'var(--muted)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          / 2.00
        </span>
      </div>
      <Mono>Projicerat resultat</Mono>
    </div>
  )
}

function Halves({
  verbal,
  quant,
  loading,
}: {
  verbal: number | null
  quant: number | null
  loading?: boolean
}) {
  return (
    <div
      style={{
        marginTop: 28,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        columnGap: 36,
        maxWidth: 360,
      }}
    >
      <HalfCell label="Verbal" value={loading ? null : verbal} />
      <HalfCell label="Kvant" value={loading ? null : quant} />
    </div>
  )
}

function HalfCell({ label, value }: { label: string; value: number | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Mono>{label}</Mono>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 3vw + 12px, 44px)',
          lineHeight: 1,
          letterSpacing: '-0.015em',
          color: 'var(--ink)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatScore(value)}
      </span>
    </div>
  )
}

// ── Per-section table ─────────────────────────────────────────────

function SectionTable({ scores, loading }: { scores: SectionScore[]; loading?: boolean }) {
  if (loading) return <EmptyText>Laddar…</EmptyText>
  if (scores.length === 0) return <EmptyText>Inga övningar än.</EmptyText>
  return (
    <div style={{ marginTop: 14 }}>
      {scores.map((s, i) => (
        <SectionRow key={s.section} s={s} isFirst={i === 0} />
      ))}
    </div>
  )
}

function SectionRow({ s, isFirst }: { s: SectionScore; isFirst: boolean }) {
  const hasAttempts = s.attempts90d > 0
  const trendColor =
    s.trend == null
      ? 'var(--muted)'
      : s.trend > 0.05
        ? 'var(--ink)'
        : s.trend < -0.05
          ? 'var(--accent)'
          : 'var(--muted)'
  const stale = hasAttempts && s.daysSinceLastAttempt >= 14
  return (
    <Link
      to="/lektion"
      search={{ section: s.section }}
      style={{
        display: 'grid',
        gridTemplateColumns: '52px minmax(60px, 1fr) auto auto',
        columnGap: 16,
        alignItems: 'baseline',
        paddingBlock: 14,
        borderTop: isFirst ? 'none' : '1px solid var(--hairline)',
        textDecoration: 'none',
        color: 'inherit',
        opacity: hasAttempts ? 1 : 0.55,
      }}
      aria-label={`Sektion ${s.section}, score ${formatScore(s.score)}`}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(22px, 1.5vw + 12px, 30px)',
          lineHeight: 1,
          letterSpacing: '-0.015em',
          color: 'var(--ink)',
        }}
      >
        {s.section}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          color: 'var(--ink-2)',
          lineHeight: 1.4,
        }}
      >
        {hasAttempts ? (
          <>
            <span style={{ color: 'var(--muted)' }}>{s.attempts90d} försök</span>
            {stale && (
              <span style={{ color: 'var(--accent)' }}>
                {' · '}
                {s.daysSinceLastAttempt} dagar sedan
              </span>
            )}
            {s.confidence === 'low' && hasAttempts && (
              <span style={{ color: 'var(--muted)' }}> · liten provstorlek</span>
            )}
          </>
        ) : (
          <span style={{ color: 'var(--muted)' }}>Inget än</span>
        )}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          letterSpacing: '0.06em',
          color: trendColor,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatTrend(s.trend)}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(20px, 1.4vw + 11px, 26px)',
          color: 'var(--ink)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
        }}
      >
        {formatScore(s.score)}
      </span>
    </Link>
  )
}

// ── Fokus list ────────────────────────────────────────────────────

function FokusList({ weak }: { weak: SectionScore[] }) {
  return (
    <ol style={{ listStyle: 'none', padding: 0, marginTop: 14 }}>
      {weak.map((s, idx) => (
        <li
          key={s.section}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 16,
            paddingBlock: 12,
            borderTop: idx === 0 ? 'none' : '1px solid var(--hairline)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.14em',
              color: 'var(--muted)',
              minWidth: 24,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {String(idx + 1).padStart(2, '0')}
          </span>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(16px, 1vw + 12px, 19px)',
                color: 'var(--ink)',
                lineHeight: 1.4,
              }}
            >
              {reasonFor(s)}
            </span>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
              <Link to="/drill" search={drillSearchFor(s.section)} style={drillActionStyle}>
                Öva {s.section} →
              </Link>
              <Link
                to="/lektion"
                search={{ section: s.section }}
                style={{ ...drillActionStyle, color: 'var(--muted)' }}
              >
                Läs lektion
              </Link>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

const drillActionStyle = {
  fontFamily: 'var(--font-mono)' as const,
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: 'var(--ink)',
  textDecoration: 'none' as const,
  borderBottom: '1px solid var(--hairline)',
  paddingBottom: 2,
}

// DTK is not yet drillable (image pipeline pending). Other sections
// fall through to /drill?section=X directly.
function drillSearchFor(section: Section): { section?: Exclude<Section, 'DTK'> } {
  return section === 'DTK' ? {} : { section: section as Exclude<Section, 'DTK'> }
}

function reasonFor(s: SectionScore): string {
  const score = formatScore(s.score)
  if (s.trend != null && s.trend < -0.1) {
    return `${s.section} — ${score}, sjunker denna vecka (${formatTrend(s.trend)})`
  }
  if (s.daysSinceLastAttempt >= 14 && s.score != null) {
    return `${s.section} — ${score}, inte rörd på ${s.daysSinceLastAttempt} dagar`
  }
  return `${s.section} — ${score}, lägsta sektionen just nu`
}

// ── Bottom stat groups (existing) ─────────────────────────────────

type Row = { label: string; value: number | string | null | undefined }

function StatList({ rows, loading }: { rows: Row[]; loading?: boolean }) {
  return (
    <div
      style={{
        marginTop: 14,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        columnGap: 24,
        rowGap: 10,
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
          <span style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
            {loading || r.value == null ? '—' : r.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Weekly masthead — "Vecka N · DD mån – DD mån" + summary chips ─

function WeeklyMasthead({ stats }: { stats: Stats | undefined }) {
  const today = new Date()
  const weekNum = isoWeek(today)
  // Sunday of this week → Saturday next. Anchor to today; the original
  // design used Monday–Sunday and we follow Sweden's calendar
  // convention. JS Date.getDay() returns 0 = Sunday, so we step back
  // (dayOfWeek === 0 ? 6 : dayOfWeek - 1) days to land on the prior
  // Monday.
  const dayOfWeek = today.getDay()
  const stepBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(today)
  monday.setDate(today.getDate() - stepBack)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const range = `${formatSwedishDateShort(monday)} – ${formatSwedishDateShort(sunday)}`
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <Mono>Veckorapport</Mono>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(24px, 1.6vw + 14px, 32px)',
            lineHeight: 1.1,
            letterSpacing: '-0.015em',
            color: 'var(--ink)',
            margin: '8px 0 0 0',
          }}
        >
          Vecka {weekNum} · {range}
        </h2>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 20,
          flexWrap: 'wrap',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <SummaryChip
          label="Frågor"
          value={stats?.attempts.thisWeek != null ? String(stats.attempts.thisWeek) : '—'}
        />
        <SummaryChip
          label="Träffsäkerhet"
          value={stats?.accuracy7d == null ? '—' : `${Math.round(stats.accuracy7d * 100)}%`}
        />
        <SummaryChip label="Streak" value={stats == null ? '—' : `${stats.streakDays} d`} />
      </div>
    </div>
  )
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <Mono>{label}</Mono>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 'clamp(18px, 1vw + 12px, 22px)',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--ink)',
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        marginTop: 12,
        fontFamily: 'var(--font-display)',
        fontSize: 16,
        color: 'var(--muted)',
      }}
    >
      {children}
    </p>
  )
}

// /progress — Framsteg, rebuilt to the M3 "Rapporten" composition the
// owner picked from /progress-bakeoff (2026-07-04), with two grafts:
//
//   FRAMSTEG   hero prognosis (1,41 av 2,0) + Variant B's written
//              paragraph instead of a stat row — the week narrated:
//              delta, volume, accuracy, streak, halves comparison and
//              which sections carry the gap to 1,8. Every clause is
//              data-gated so a sparse week degrades to shorter prose,
//              never to fabricated numbers.
//   12 V       prognosis sparkline against the 1,8 goal line, from
//              the rolling weekly buckets.
//   SEKTIONER  every section as a flat ledger row (home-trap idiom):
//              tag · score · ±band · trend arrow · attempts + trust.
//              Rows link to the section lesson.
//   NÄRVARO    compact 12-week heat strip that EXPANDS on interaction
//              (owner request) into the full ConsistencyHeat — month
//              labels, verbal/quant split, per-day tooltips.
//   FOKUS      top-3 weakness ranking as numbered plan items with
//              drill / lesson actions.
//   REPETITION quiet mono ledger line: queue + lifetime volume.
//
// All numbers derive from /api/me/stats via lib/scoring.ts. Swedish
// comma-decimals throughout (formatScoreSv precedent from M3H).

import { Link } from '@tanstack/react-router'
import { type ReactNode, useMemo, useState } from 'react'

import type { Stats, WeeklyBucket } from '@/api/hooks/useStats'
import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { ConsistencyHeat } from '@/components/progress/ConsistencyHeat'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { useViewport } from '@/hooks/useViewport'
import {
  computeProjected,
  computeProjectedDelta,
  computeSectionScore,
  formatDeltaSv,
  rankWeakness,
  type SectionScore,
  scoreBand,
  weeklyScore,
} from '@/lib/scoring'
import { useDaysRemaining, useSitting } from '@/stores/examStore'

type ProgressMobileProps = {
  stats?: Stats
  loading?: boolean
}

/** `1,41` — two-decimal Swedish comma form. /progress is the page
 *  where precision matters (the home compass rounds to one). */
function fmtSv(score: number | null): string {
  return score == null ? '—' : score.toFixed(2).replace('.', ',')
}

const CONF_SV = { low: 'låg', medium: 'medel', high: 'hög' } as const

export function ProgressMobile({ stats, loading }: ProgressMobileProps) {
  const viewport = useViewport()
  const days = useDaysRemaining()
  const sitting = useSitting()

  const scores: SectionScore[] = useMemo(
    () =>
      stats?.bySection
        ? SECTION_KEYS.map((section) => computeSectionScore(section, stats.bySection[section]))
        : [],
    [stats],
  )
  const projected = stats ? computeProjected(scores) : null
  const delta = stats ? computeProjectedDelta(stats.bySection) : null
  const weak = stats ? rankWeakness(scores).slice(0, 3) : []

  return (
    <div
      className="hpc-m3-page"
      style={{ height: '100%', overflowY: 'auto', width: '100%', color: 'var(--ink)' }}
    >
      <div
        className="hpc-m3-frame"
        style={{ paddingBottom: viewport === 'phone' ? 'var(--frame-tabbar)' : 120 }}
      >
        {/* ── Framsteg — hero + the written week ─────────────────── */}
        <DrillRailSection
          meta={
            <>
              <strong>Framsteg</strong>
              {days} dagar · {sitting.label.toLowerCase()}
            </>
          }
          delay={0}
        >
          <h1 className="hpc-m3-display" style={{ marginTop: 0 }}>
            <span data-testid="progress-projected">
              {loading ? '—' : fmtSv(projected?.total ?? null)}
            </span>
            <span style={{ fontSize: '0.45em', color: 'var(--muted)' }}> av 2,0</span>
          </h1>
          <PrognosParagraph stats={stats} projected={projected} delta={delta} scores={scores} />
        </DrillRailSection>

        {/* ── Prognos över tid — sparkline vs the goal ────────────── */}
        {stats && countScoredWeeks(stats.weekly) >= 2 && (
          <DrillRailSection
            meta={
              <>
                <strong>{stats.weekly.length} v</strong>mot 1,8
              </>
            }
            delay={60}
          >
            <h2 className="hpc-m3-h">Prognos över tid</h2>
            <Sparkline weekly={stats.weekly} />
          </DrillRailSection>
        )}

        {/* ── Sektioner — the ledger ──────────────────────────────── */}
        <DrillRailSection meta="Sektioner" delay={120}>
          <h2 className="hpc-m3-h">Var poängen finns</h2>
          {loading ? (
            <MonoNote>laddar…</MonoNote>
          ) : scores.length === 0 ? (
            <MonoNote>inga övningar än</MonoNote>
          ) : (
            <div>
              {scores.map((s) => (
                <SectionRow key={s.section} s={s} />
              ))}
            </div>
          )}
        </DrillRailSection>

        {/* ── Närvaro — compact strip, expands on interaction ─────── */}
        <DrillRailSection meta="Närvaro" delay={180}>
          <h2 className="hpc-m3-h">Senaste 12 veckorna</h2>
          <NarvaroBlock stats={stats} />
        </DrillRailSection>

        {/* ── Fokus — drill this next ─────────────────────────────── */}
        {weak.length > 0 && (
          <DrillRailSection meta="Fokus" delay={240}>
            <div>
              {weak.map((s, i) => (
                <FokusItem key={s.section} s={s} index={i} />
              ))}
            </div>
          </DrillRailSection>
        )}

        {/* ── Repetition + lifetime ledger ────────────────────────── */}
        <DrillRailSection meta="Repetition" delay={300}>
          <MonoNote>
            {stats == null ? (
              '—'
            ) : (
              <>
                {stats.mistakes.due} att repetera nu · {stats.mistakes.active} aktiva i kön ·{' '}
                {stats.mistakes.resolved} utlärda
              </>
            )}
          </MonoNote>
          {stats != null && (
            <MonoNote style={{ marginTop: 6 }}>
              {stats.attempts.total} frågor totalt · {stats.attempts.today} idag ·{' '}
              {stats.drills.thisWeek} pass denna vecka
            </MonoNote>
          )}
        </DrillRailSection>
      </div>
    </div>
  )
}

// ── The written week (Variant B graft) ─────────────────────────────
//
// Composes the hero paragraph from live data, clause by clause. Every
// clause has a presence condition; the sentence contracts gracefully
// instead of printing null-shaped filler.

function PrognosParagraph({
  stats,
  projected,
  delta,
  scores,
}: {
  stats: Stats | undefined
  projected: { verbal: number | null; quant: number | null; total: number | null } | null
  delta: number | null
  scores: SectionScore[]
}) {
  if (!stats) return null

  if (projected?.total == null) {
    return (
      <Paragraph>Ingen prognos än — svara på några frågor så börjar den här sidan leva.</Paragraph>
    )
  }

  // Sentence 1 — the week: delta + volume + accuracy + streak.
  const week = stats.attempts.thisWeek
  const acc = stats.accuracy7d
  const streak = stats.streakDays
  const deltaRounded = delta == null ? null : Math.round(delta * 10) / 10
  const lead =
    deltaRounded == null
      ? 'Den här veckan'
      : deltaRounded > 0
        ? 'Prognosen steg '
        : deltaRounded < 0
          ? 'Prognosen föll '
          : 'Prognosen låg still den här veckan'
  const tailBits: string[] = []
  if (week > 0) {
    tailBits.push(
      acc == null
        ? `${week} frågor`
        : `${week} frågor med ${Math.round(acc * 100)} % träffsäkerhet`,
    )
  }
  if (streak > 1) tailBits.push(`${streak}:e dagen i rad`)
  const tail = tailBits.join(', ')

  // Sentence 2 — the halves. Only when both exist.
  const { verbal, quant } = projected
  let halves: ReactNode = null
  if (verbal != null && quant != null) {
    const diff = quant - verbal
    halves =
      Math.abs(diff) >= 0.03 ? (
        <>
          {diff > 0 ? 'Kvant' : 'Verbal'} (<Strong>{fmtSv(diff > 0 ? quant : verbal)}</Strong>) drar
          ifrån {diff > 0 ? 'verbal' : 'kvant'} (<Strong>{fmtSv(diff > 0 ? verbal : quant)}</Strong>
          )
        </>
      ) : (
        <>
          Verbal (<Strong>{fmtSv(verbal)}</Strong>) och kvant (<Strong>{fmtSv(quant)}</Strong>)
          följs åt
        </>
      )
  }

  // Sentence 3 — who carries the gap to 1,8. The two lowest scored
  // sections with real attempts; skipped once the goal is reached.
  const scored = scores
    .filter((s) => s.score != null && s.attempts90d > 0)
    .sort((a, b) => (a.score ?? 2) - (b.score ?? 2))
  const gap =
    projected.total < 1.8 && scored.length >= 2 ? (
      <>
        ; gapet upp till målet 1,8 bärs framför allt av{' '}
        <Strong>
          {scored[0].section} {fmtSv(scored[0].score)}
        </Strong>{' '}
        och{' '}
        <Strong>
          {scored[1].section} {fmtSv(scored[1].score)}
        </Strong>
      </>
    ) : null

  return (
    <Paragraph data-testid="progress-prose">
      {lead}
      {deltaRounded != null && deltaRounded !== 0 && <Strong>{formatDeltaSv(deltaRounded)}</Strong>}
      {deltaRounded != null && deltaRounded !== 0 && ' den här veckan'}
      {tail && (deltaRounded == null ? ': ' : ' — ')}
      {tail}.{' '}
      {halves != null && (
        <>
          {halves}
          {gap}.
        </>
      )}
    </Paragraph>
  )
}

function Paragraph({ children, ...rest }: { children: ReactNode; 'data-testid'?: string }) {
  return (
    <p
      {...rest}
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 17,
        lineHeight: 1.6,
        color: 'var(--ink-2)',
        maxWidth: '58ch',
        margin: '10px 0 0',
      }}
    >
      {children}
    </p>
  )
}

function Strong({ children }: { children: ReactNode }) {
  return <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{children}</strong>
}

// ── Sparkline — weekly prognosis vs the 1,8 goal ───────────────────

const GOAL = 1.8

function countScoredWeeks(weekly: WeeklyBucket[]): number {
  return weekly.reduce((n, b) => (weeklyScore(b) == null ? n : n + 1), 0)
}

function Sparkline({ weekly }: { weekly: WeeklyBucket[] }) {
  const W = 560
  const H = 84
  const pts = weekly.map(weeklyScore)
  const real = pts.filter((v): v is number => v != null)
  const min = Math.min(0.9, ...real) - 0.05
  const max = 2.0
  const x = (i: number) => (weekly.length > 1 ? (i / (weekly.length - 1)) * W : W / 2)
  const y = (v: number) => H - ((v - min) / (max - min)) * H

  // Empty weeks break the polyline (a flat line through a week of
  // silence would be a lie) — restart with M after each gap.
  let path = ''
  let pen = false
  pts.forEach((v, i) => {
    if (v == null) {
      pen = false
      return
    }
    path += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)} `
    pen = true
  })
  const lastIdx = pts.reduce<number>((acc, v, i) => (v == null ? acc : i), -1)
  const last = lastIdx >= 0 ? pts[lastIdx] : null

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', maxWidth: W, display: 'block' }}
      role="img"
      aria-label="Prognos per vecka mot målet 1,8"
    >
      <line
        x1={0}
        y1={y(GOAL)}
        x2={W}
        y2={y(GOAL)}
        stroke="var(--hairline)"
        strokeDasharray="4 4"
      />
      <text
        x={W - 4}
        y={y(GOAL) - 5}
        textAnchor="end"
        fontSize="10"
        fill="var(--muted-2)"
        fontFamily="var(--font-mono)"
      >
        mål 1,8
      </text>
      <path d={path.trim()} fill="none" stroke="var(--accent)" strokeWidth={1.75} />
      {last != null && <circle cx={x(lastIdx)} cy={y(last)} r={3} fill="var(--accent)" />}
    </svg>
  )
}

// ── Section ledger row ─────────────────────────────────────────────

function SectionRow({ s }: { s: SectionScore }) {
  const hasAttempts = s.attempts90d > 0
  const band = scoreBand(s.score, s.attempts90d)
  const arrow = s.trend == null ? '' : s.trend > 0.05 ? '↗' : s.trend < -0.05 ? '↘' : '→'
  const stale = hasAttempts && s.daysSinceLastAttempt >= 14
  return (
    <Link
      to="/lektion"
      search={{ section: s.section }}
      className="hpc-m3-trap"
      data-testid={`progress-section-${s.section}`}
      aria-label={`Sektion ${s.section}, poäng ${fmtSv(s.score)}`}
      style={{ textDecoration: 'none', color: 'inherit', opacity: hasAttempts ? 1 : 0.55 }}
    >
      <span className="hpc-m3-trap-t">
        <span className="hpc-m3-tag">{s.section}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500 }}>
          {fmtSv(s.score)}
        </span>
        {band != null && (
          <span style={{ ...mono11, marginLeft: 8 }} data-testid={`progress-band-${s.section}`}>
            ±{band.toFixed(2).replace('.', ',')}
          </span>
        )}
        {arrow && (
          <span
            style={{
              marginLeft: 10,
              color: arrow === '↘' ? 'var(--bad)' : 'var(--ink-2)',
              fontSize: 13,
            }}
          >
            {arrow}
          </span>
        )}
      </span>
      <span className="hpc-m3-trap-n">
        {hasAttempts ? (
          <>
            {s.attempts90d} försök · {CONF_SV[s.confidence]}
            {stale && (
              <span style={{ color: 'var(--accent)' }}> · {s.daysSinceLastAttempt} d sedan</span>
            )}
          </>
        ) : (
          'inget än'
        )}
      </span>
    </Link>
  )
}

// ── Närvaro — compact strip that grows on interaction ──────────────
//
// Idle: a 12×7 single-intensity strip, streak line beneath. Click (or
// Enter) swells it into the full ConsistencyHeat — month labels,
// verbal/quant split, per-day tooltips — rendered `bare` because the
// rail already owns the title. The owner asked for exactly this
// gesture: "the Närvaro part gets larger when you interact with it."

const WEEKS = 12
const DAYS = WEEKS * 7

function NarvaroBlock({ stats }: { stats: Stats | undefined }) {
  const [open, setOpen] = useState(false)
  const days = stats?.attemptsDaily
  if (!days || days.length === 0) return <MonoNote>väntar på data</MonoNote>

  const window = days.slice(-DAYS)
  const padded = [
    ...Array.from({ length: Math.max(0, DAYS - window.length) }, () => 0),
    ...window.map((d) => d.n),
  ]
  const longest = longestStreak(padded)
  const current = stats?.streakDays ?? 0

  // The expanded grid renders OUTSIDE the toggle — ConsistencyHeat's
  // day cells are buttons themselves, and nesting them inside the
  // toggle button would be invalid HTML (and every tooltip hover a
  // collapse hazard). It also carries its own streak summary, so the
  // compact line only renders alongside the compact strip.
  return (
    <div>
      {open && <ConsistencyHeat days={window} bare />}
      <button
        type="button"
        className="hpc-heat-toggle"
        aria-expanded={open}
        data-testid="progress-heat-toggle"
        onClick={() => setOpen(!open)}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'block',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {!open && (
          <div style={{ display: 'flex', gap: 3 }} aria-hidden>
            {Array.from({ length: WEEKS }, (_, w) => (
              <div
                key={`w${String(w)}`}
                style={{ display: 'flex', flexDirection: 'column', gap: 3 }}
              >
                {Array.from({ length: 7 }, (_, d) => (
                  <span
                    key={`w${String(w)}d${String(d)}`}
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 1,
                      background: RAMP[bucket(padded[w * 7 + d])],
                      display: 'block',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
        <span style={{ ...mono11, display: 'inline-block', marginTop: 10, color: 'var(--accent)' }}>
          {open ? '▴ visa mindre' : '▾ visa detalj'}
        </span>
      </button>
      {!open && (
        <p style={{ ...mono11, marginTop: 6 }}>
          aktuell serie: {current} {current === 1 ? 'dag' : 'dagar'}
          {longest > current ? ` (rekord ${longest})` : current > 0 ? ' (rekord)' : ''}
        </p>
      )}
    </div>
  )
}

const RAMP = [
  'var(--hairline-2)',
  'color-mix(in oklch, var(--accent) 22%, var(--bg))',
  'color-mix(in oklch, var(--accent) 55%, var(--bg))',
  'var(--accent)',
]

function bucket(n: number): number {
  if (n <= 0) return 0
  if (n < 5) return 1
  if (n < 12) return 2
  return 3
}

function longestStreak(counts: number[]): number {
  let longest = 0
  let run = 0
  for (const n of counts) {
    run = n > 0 ? run + 1 : 0
    if (run > longest) longest = run
  }
  return longest
}

// ── Fokus items ────────────────────────────────────────────────────

function FokusItem({ s, index }: { s: SectionScore; index: number }) {
  const headline =
    s.trend != null && s.trend < -0.1
      ? `${fmtSv(s.score)} och på väg ner`
      : s.daysSinceLastAttempt >= 14 && s.score != null
        ? `${fmtSv(s.score)} · inte rörd på ${s.daysSinceLastAttempt} dagar`
        : `Lägsta sektionen just nu · ${fmtSv(s.score)}`
  return (
    <div className="hpc-m3-plan-item">
      <span className="hpc-m3-plan-n">{index + 1}.</span>
      <div>
        <div className="hpc-m3-plan-t">
          <span className="hpc-m3-tag">{s.section}</span>
          {headline}
        </div>
        <div className="hpc-m3-plan-r">
          {s.attempts90d} försök — signalen är {CONF_SV[s.confidence]}.
        </div>
        <span style={{ display: 'flex', gap: 18, marginTop: 6 }}>
          <Link to="/drill" search={drillSearchFor(s.section)} style={actionWord}>
            öva {s.section} →
          </Link>
          <Link
            to="/lektion"
            search={{ section: s.section }}
            style={{ ...actionWord, color: 'var(--muted-2)' }}
          >
            läs lektion
          </Link>
        </span>
      </div>
    </div>
  )
}

// DTK is not yet drillable (image pipeline pending) — send it to the
// generic drill idle instead of a broken section param.
function drillSearchFor(section: Section): { section?: Exclude<Section, 'DTK'> } {
  return section === 'DTK' ? {} : { section: section as Exclude<Section, 'DTK'> }
}

const actionWord = {
  fontFamily: 'var(--font-mono)' as const,
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: 'var(--accent)',
  textDecoration: 'none' as const,
}

// ── Shared bits ────────────────────────────────────────────────────

const mono11 = {
  fontFamily: 'var(--font-mono)' as const,
  fontSize: 11,
  color: 'var(--muted)',
  fontVariantNumeric: 'tabular-nums' as const,
}

function MonoNote({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <p style={{ ...mono11, margin: 0, ...style }}>{children}</p>
}

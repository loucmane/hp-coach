// DrillResult — the "Klart." payoff, rebuilt to the owner-ratified
// C+A composition from /klart-bakeoff (2026-07-04):
//
//   {SECTION}        Klart.                                (italic display)
//   PASS SLUT        [ N av M rätt · X,XX prognos · K till repetition ]
//
//   FACIT            Hela passet — every question as a marked row
//                    (✓ muted / ✗ red with 'ditt b) · rätt a)').
//                    Rows EXPAND IN PLACE into the full graded review
//                    (DrillQuestion + the M2 pedagogy) — no new session,
//                    no navigation, one tap in and out.
//
//   IMORGON          the payoff coda: repetition load + the trap
//                    cluster named when ≥2 misses share a framework —
//                    then Stäng / öva igen / esc hem.
//
// Kept from the EDITION screen: the Esc-to-home handler, the motion
// fade on Klart., the useTrapCluster causation lookup, MathText on
// every stem (task 124). Dropped: the coach-voice line (M2 direction),
// the score-delta band (its 'before' snapshot was the 'after' — an
// honest delta needs session-start wiring; follow-up), DetaljerCard
// and TomorrowBlock (their facts live in the stats row + coda now).
// Misses still enter the repetition queue automatically via
// SessionPlayer's recordMistake.mutate.

import { motion, useReducedMotion } from 'motion/react'
import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react'

import { useActiveMistakes } from '@/api/hooks/useMistakes'
import { useStats } from '@/api/hooks/useStats'
import { DrillQuestion } from '@/components/drill/DrillQuestion'
import { MathText } from '@/components/MathText'
import type { AnswerLetter, Question, Section } from '@/data/questions'
import { ARK_KORT_LAYOUT_ID, TRANSITION, useArketMotion } from '@/lib/motion'
import { computeSectionScore } from '@/lib/scoring'
import { useTrapCluster } from '@/lib/trapCluster'

export type DrillSummary = {
  questions: Question[]
  picks: (AnswerLetter | null)[]
}

type Props = {
  summary: DrillSummary
  onReplay: () => void
  onHome: () => void
  /** Optional extra CTA in the coda button row — e.g. the adaptive-review
   *  detour's "Tillbaka till din övning" continuation (task #16). Rendered
   *  after the quiet "öva igen" word, before the "esc hem" hint. */
  continuation?: ReactNode
}

export function DrillResult({ summary, onReplay, onHome, continuation }: Props) {
  const { questions, picks } = summary
  const total = questions.length
  const correct = picks.reduce<number>((n, p, i) => (p === questions[i].answer ? n + 1 : n), 0)
  const reduced = useReducedMotion()
  const [expanded, setExpanded] = useState<number | null>(null)

  // Section the drill ran in. Mixed-section sessions (repetition,
  // diagnostic) get the neutral 'Blandat' rail label and no prognosis
  // stat (there's no single anchor to score).
  const sections = useMemo(() => new Set(questions.map((q) => q.section)), [questions])
  const section: Section | null = sections.size === 1 ? questions[0].section : null

  const missedQids = useMemo(
    () =>
      questions
        .map((q, i) => ({ q, picked: picks[i] }))
        .filter(({ q, picked }) => picked !== q.answer)
        .map(({ q }) => q.qid),
    [questions, picks],
  )
  const cluster = useTrapCluster(missedQids)

  // The Imorgon coda names the WHOLE repetition queue (active, scope=all),
  // not just this pass's misses — by the time this mounts SessionPlayer has
  // logged the fresh mistakes and invalidated the active query, so this
  // run's misses are already counted here. This is the same numeral the nav
  // rail shows, so the two can never disagree (the owner's core complaint).
  // The per-pass "till repetition" stat below stays session-scoped.
  const activeCount = useActiveMistakes().data?.length ?? 0

  // Post-session section prognosis. By the time this mounts the
  // attempts have landed, so the score already includes this pass.
  const stats = useStats()
  const prognos =
    section && stats.data?.bySection[section]
      ? computeSectionScore(section, stats.data.bySection[section]).score
      : null

  // This pass's own score on the 0–2 grade scale (correct fraction ×2).
  // A single session barely moves the 90d prognosis, so a before/after
  // delta would read ±0,00 — instead we surface how THIS pass compared
  // to the running average, which is the honest, motivating signal:
  // "1,60 this pass vs your 1,47 usual". Delta is pass − prognos, shown
  // only for single-section passes where the average exists and the
  // gap rounds to something visible.
  const passScore = total > 0 ? Math.min(2, (correct / total) * 2) : null
  const passDelta = passScore != null && prognos != null ? passScore - prognos : null
  const passDeltaShown = passDelta != null && Math.abs(passDelta) >= 0.005

  // Esc-to-home — the parent-exit affordance, kept from EDITION.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if ((e.target as HTMLElement | null)?.closest('[data-palette-open]')) return
      e.preventDefault()
      onHome()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onHome])

  return (
    <div
      data-testid="drill-result"
      className="hpc-m3-page"
      style={{ height: '100%', overflowY: 'auto', width: '100%' }}
    >
      <div className="hpc-m3-frame" style={{ paddingBottom: 120 }}>
        {/* ── Klart. + stats ─────────────────────────────────────── */}
        {/* ark-kort (A2 "Klart folds home"): this block and Home's
         *  day-card are one sheet — leaving for Hem folds the Klart
         *  panel back into "Dagens plan". */}
        <Rail
          arkKort
          meta={
            <>
              <strong>{section ?? 'Blandat'}</strong>
              pass slut
            </>
          }
        >
          <motion.h1
            className="hpc-m3-display"
            id="drill-result-headline"
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={TRANSITION.chrome}
            style={{ marginTop: 0 }}
          >
            <span data-testid="drill-result-headline">Klart.</span>
          </motion.h1>
          <div className="hpc-m3-stats" data-testid="drill-result-detaljer">
            <div>
              <div className="hpc-m3-stat-n">
                {correct} av {total}
              </div>
              <div className="hpc-m3-stat-l">rätt</div>
            </div>
            {passScore != null && section && (
              <div data-testid="drill-result-pass">
                <div className="hpc-m3-stat-n">{passScore.toFixed(2).replace('.', ',')}</div>
                <div className="hpc-m3-stat-l">detta pass</div>
                {passDeltaShown && passDelta != null && (
                  // Color by SIGN, not hard-coded green: a pass BELOW your
                  // average is a negative delta and must read red (--bad), a
                  // pass at/above reads green (--ok). The CSS class keeps the
                  // layout (size/margin); the inline color overrides its
                  // hard-coded --ok.
                  <div
                    className="hpc-m3-stat-d"
                    data-testid="drill-result-delta"
                    style={{ color: passDelta >= 0 ? 'var(--ok)' : 'var(--bad)' }}
                  >
                    {passDelta >= 0 ? '+' : '−'}
                    {Math.abs(passDelta).toFixed(2).replace('.', ',')} mot snittet
                  </div>
                )}
              </div>
            )}
            {prognos != null && section && (
              <div>
                <div className="hpc-m3-stat-n">{prognos.toFixed(2).replace('.', ',')}</div>
                <div className="hpc-m3-stat-l">{section}-prognos</div>
              </div>
            )}
            {missedQids.length > 0 && (
              <div>
                <div className="hpc-m3-stat-n">{missedQids.length}</div>
                <div className="hpc-m3-stat-l">till repetition</div>
              </div>
            )}
          </div>
        </Rail>

        {/* ── Facit ──────────────────────────────────────────────── */}
        <Rail meta="Facit">
          <h2 className="hpc-m3-h">Hela passet</h2>
          <div>
            {questions.map((q, i) => (
              <FacitRow
                key={q.qid}
                question={q}
                picked={picks[i]}
                index={i}
                open={expanded === i}
                onToggle={() => setExpanded(expanded === i ? null : i)}
              />
            ))}
          </div>
        </Rail>

        {/* ── Imorgon ────────────────────────────────────────────── */}
        <Rail meta="Imorgon">
          <p
            data-testid="drill-result-tomorrow"
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 16,
              lineHeight: 1.55,
              color: 'var(--ink-2)',
              margin: 0,
              maxWidth: '60ch',
            }}
          >
            {missedQids.length === 0 ? (
              'Inga missar — inget att repetera. Snyggt.'
            ) : (
              <>
                I repetitionskön: {activeCount} {activeCount === 1 ? 'fråga' : 'frågor'} — dina nya
                missar ligger först i morgondagens plan.
                {cluster?.headline && (
                  <>
                    {' '}
                    Fällan bakom flera av dem:{' '}
                    <span style={{ color: 'var(--ink)' }}>{cluster.headline}</span>
                  </>
                )}
              </>
            )}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 32 }}>
            <button type="button" onClick={onHome} className="hpc-m3-cta" style={ctaReset}>
              Stäng
            </button>
            <button type="button" onClick={onReplay} style={quietWord}>
              öva igen
            </button>
            {continuation}
            <span style={{ ...quietWord, cursor: 'default' }}>esc hem</span>
          </div>
        </Rail>
      </div>
    </div>
  )
}

// ── Facit row + inline review ──────────────────────────────────────

function FacitRow({
  question,
  picked,
  index,
  open,
  onToggle,
}: {
  question: Question
  picked: AnswerLetter | null
  index: number
  open: boolean
  onToggle: () => void
}) {
  const ok = picked === question.answer
  return (
    <div>
      <button
        type="button"
        data-testid={`facit-row-${index + 1}`}
        aria-expanded={open}
        onClick={onToggle}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'grid',
          gridTemplateColumns: '22px 30px minmax(0, 1fr) auto',
          gap: 12,
          alignItems: 'baseline',
          width: '100%',
          boxSizing: 'border-box',
          padding: '10px 0',
          borderBottom: '1px solid var(--hairline-2)',
        }}
      >
        <span
          aria-hidden
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 700,
            color: ok ? 'var(--ok)' : 'var(--bad)',
          }}
        >
          {ok ? '✓' : '✗'}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            // WCAG AA: --muted-2 fails 4.5:1 at 11px — --muted passes.
            color: 'var(--muted)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {index + 1}.
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 14.5,
            color: ok ? 'var(--ink-2)' : 'var(--ink)',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'left',
          }}
        >
          <MathText>{question.prompt ?? question.qid}</MathText>
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            // WCAG AA: --muted-2 fails 4.5:1 at 11px — --muted passes.
            // --bad already passes for the wrong-answer branch.
            color: ok ? 'var(--muted)' : 'var(--bad)',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {ok
            ? `${question.answer.toLowerCase()})`
            : `ditt ${picked?.toLowerCase() ?? '—'}) · rätt ${question.answer.toLowerCase()})`}
          <span aria-hidden style={{ marginLeft: 10, color: 'var(--muted-2)' }}>
            {open ? '▴' : '▾'}
          </span>
        </span>
      </button>
      {open && (
        <div
          data-testid={`facit-review-${index + 1}`}
          style={{
            // The inline review — the graded page replayed. A left
            // accent rule marks it as an inset of the row above; the
            // pedagogy's own rail sections render inside.
            borderLeft: '2px solid var(--accent)',
            padding: '8px 0 24px 18px',
            margin: '0 0 4px',
          }}
        >
          <DrillQuestion
            question={question}
            picked={picked}
            graded
            onPick={() => {}}
            fill={false}
          />
          <button type="button" onClick={onToggle} style={{ ...quietWord, marginTop: 12 }}>
            ▴ stäng granskning
          </button>
        </div>
      )}
    </div>
  )
}

// ── Shared bits ────────────────────────────────────────────────────

const quietWord: CSSProperties = {
  all: 'unset',
  cursor: 'pointer',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  // WCAG AA: --muted-2 fails 4.5:1 at 11px for this real button/link
  // text ("stäng granskning" etc.) — --muted passes.
  color: 'var(--muted)',
}

const ctaReset: CSSProperties = {
  border: 'none',
  cursor: 'pointer',
}

function Rail({
  meta,
  arkKort = false,
  children,
}: {
  meta: ReactNode
  /** This rail section IS the ark-kort sheet (shared with Home's
   *  day-card) — the Klart block only. */
  arkKort?: boolean
  children: ReactNode
}) {
  const ark = useArketMotion()
  const inner = (
    <>
      <hr className="hpc-m3-rule" />
      <div className="hpc-m3-row">
        <div className="hpc-m3-meta">{meta}</div>
        <div className="hpc-m3-spine" />
        <div className="hpc-m3-content">{children}</div>
      </div>
    </>
  )
  if (arkKort && !ark.rm) {
    return (
      <motion.section
        className="hpc-m3-section hpc-arkkort"
        layoutId={ARK_KORT_LAYOUT_ID}
        transition={ark.arket}
      >
        {inner}
      </motion.section>
    )
  }
  return <section className="hpc-m3-section">{inner}</section>
}

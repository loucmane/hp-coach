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
import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { usePileMistakes } from '@/api/hooks/useMistakes'
import { useStats } from '@/api/hooks/useStats'
import { DrillQuestion } from '@/components/drill/DrillQuestion'
import { MathText } from '@/components/MathText'
import type { AnswerLetter, Question, Section } from '@/data/questions'
import {
  ARK_KORT_LAYOUT_ID,
  EASE,
  KLART,
  KLART_SATS,
  KLART_SLAG,
  khRowDelay,
  khTick,
  useArketMotion,
  useMountGo,
} from '@/lib/motion'
import { computeSectionScore } from '@/lib/scoring'
import { useTrapCluster } from '@/lib/trapCluster'

// ── KH · "Hybriden" — the session-end ceremony (owner W2 verdict) ─────
//
// The real session-complete surface performs the KH ceremony, adapted
// honestly to its shipped information architecture (klart-bakeoff C+A,
// 2026-07-04): the reference chip's `KLARTH` moved the stats to the
// bottom because a fixture may; this surface's stats block is ratified
// AT THE TOP (and locked by DrillResult.test), so the mapping is:
//
//   • the page is pre-set at faint ink (0.18), state-driven via
//     `useMountGo` so it survives RouteScene's mount suppression;
//   • after a beat of stillness "Klart." is STRUCK on KLART_SLAG — the
//     one z-moment — launching the pressure wave;
//   • the wave inks the head furniture (the stats block, then the Facit
//     heading) at head cadence, so "Klart." and its settled headline
//     stats land together (K1's motion: the header receives the blow);
//   • over the real FacitRows it SLOWS to counting cadence — each row
//     displaces 2 px and inks to full, and the live "summa · N av M" at
//     the foot of the facit advances in lockstep (`khRowDelay` drives
//     both the row ink and the tally — they cannot desync). This is
//     K3's earned bottom;
//   • the bookkeeper's rule draws under the summa when the wave runs
//     out, and the Imorgon coda seats on KLART_SATS — the ceremony ends
//     in house physics.
//
// FOLD-REACH RULE (the honest simple rule): the wave inks strictly in
// DOM order and the FACIT ROWS are the long beat. The tick compresses
// for long sessions (`khTick`) so a 40-question pass still counts inside
// the ~2 s budget rather than ticking for four seconds. Everything below
// the facit (the summa, rule, coda) is gated on the wave finishing, so
// it seats after the count regardless of scroll position — nothing is
// left "unreached below the fold". The top "N av M rätt" headline stat
// and the facit-foot "summa" show the same total once settled: the
// headline is the settled fact, the summa the ledger subtotal earned
// during the count — a receipt's summary box over its tallied column.
//
// Reduced motion: `useMountGo` starts `go` true and every transition
// collapses to the final state on the first frame (parity contract).
// State-driven throughout, so a fresh mount replays it and RouteScene
// cannot veto it.

/** Faint pre-ink the wave lifts to full. */
const KH_FAINT = 0.18

/**
 * An element the KH pressure wave passes through: pre-set at faint ink,
 * displaced 2 px and inked to full when its `delay` (seconds) comes.
 * Opacity + a tiny y-nudge only — no layout travel (settle law).
 */
function Wave({
  go,
  rm,
  delay,
  children,
  style,
}: {
  go: boolean
  rm: boolean
  delay: number
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <motion.div
      initial={false}
      animate={go ? { opacity: 1, y: rm ? 0 : [0, 2, 0] } : { opacity: rm ? 1 : KH_FAINT, y: 0 }}
      transition={
        rm
          ? { duration: 0 }
          : { delay: go ? delay : 0, duration: go ? 0.3 : 0, ease: [...EASE.reading] }
      }
      style={style}
    >
      {children}
    </motion.div>
  )
}

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

  // The Imorgon coda names TODAY'S PILE (scope=pile) — the same "att
  // repetera" number the nav rail shows, so the two can never disagree. By
  // the time this mounts SessionPlayer has logged the fresh mistakes and
  // invalidated the pile query, so this run's misses are already counted
  // here. The per-pass "till repetition" stat below stays session-scoped.
  const pileCount = usePileMistakes().data?.length ?? 0

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

  // ── KH ceremony state (see the header note) ─────────────────────────
  const rm = reduced === true
  const go = useMountGo(rm)
  // The counting cadence, compressed for long sessions so the ledger
  // stays inside the one-beat budget.
  const tick = useMemo(() => khTick(total), [total])
  // `step` = how many facit rows the wave has inked (drives the live
  // summa); `phase` advances when the wave runs out. Reduced motion
  // starts them at the final state.
  const [step, setStep] = useState(rm ? total : 0)
  const [phase, setPhase] = useState<'wave' | 'rule' | 'settle'>(rm ? 'settle' : 'wave')
  const timers = useRef<number[]>([])
  useEffect(() => {
    if (rm || !go) return
    const t: number[] = []
    for (let i = 0; i < total; i++) {
      t.push(window.setTimeout(() => setStep(i + 1), khRowDelay(i, tick) * 1000))
    }
    const lastMark = khRowDelay(Math.max(0, total - 1), tick)
    t.push(window.setTimeout(() => setPhase('rule'), (lastMark + KLART.ruleDelay) * 1000))
    t.push(window.setTimeout(() => setPhase('settle'), (lastMark + KLART.settleDelay) * 1000))
    timers.current = t
    return () => {
      for (const id of t) clearTimeout(id)
      timers.current = []
    }
  }, [rm, go, total, tick])
  // The live tally — right answers among the rows the wave has inked.
  const rightSoFar = picks
    .slice(0, step)
    .reduce<number>((n, p, i) => (p === questions[i].answer ? n + 1 : n), 0)
  const settled = phase === 'settle'
  // Head-cadence delays: the stats block, then the Facit heading, ride
  // the wave as it leaves the strike point (K1's "the header feels it").
  const statsDelay = KLART.strike + KLART.waveLead
  const facitHeadDelay = statsDelay + KLART.headStep
  const settleTransition = rm ? { duration: 0 } : { opacity: { duration: 0.24 }, scale: KLART_SATS }

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
          {/* The strike — "Klart." struck into the sheet on KLART_SLAG,
           *  the ceremony's one z-moment (scale 1.14 → 1, ink slapped on
           *  in 70 ms). Under reduced motion it renders seated. */}
          <motion.h1
            className="hpc-m3-display"
            id="drill-result-headline"
            initial={false}
            animate={go ? { opacity: 1, scale: 1 } : { opacity: 0, scale: rm ? 1 : 1.14 }}
            transition={
              rm || !go
                ? { duration: 0 }
                : {
                    opacity: { delay: KLART.strike, duration: 0.07, ease: [...EASE.exit] },
                    scale: { delay: KLART.strike, ...KLART_SLAG },
                  }
            }
            style={{ marginTop: 0, transformOrigin: '0% 80%' }}
          >
            <span data-testid="drill-result-headline">Klart.</span>
          </motion.h1>
          {/* The settled headline stats ride the head wave — "Klart." and
           *  its facts land together. Values are final ink (the tally is
           *  earned below, at the facit foot). */}
          <Wave go={go} rm={rm} delay={statsDelay}>
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
          </Wave>
        </Rail>

        {/* ── Facit ──────────────────────────────────────────────── */}
        <Rail meta="Facit">
          <Wave go={go} rm={rm} delay={facitHeadDelay}>
            <h2 className="hpc-m3-h">Hela passet</h2>
          </Wave>
          <div>
            {/* Over the facit the wave slows to counting cadence: each
             *  row inks as its mark is counted (khRowDelay(i)). */}
            {questions.map((q, i) => (
              <Wave key={q.qid} go={go} rm={rm} delay={khRowDelay(i, tick)}>
                <FacitRow
                  question={q}
                  picked={picks[i]}
                  index={i}
                  open={expanded === i}
                  onToggle={() => setExpanded(expanded === i ? null : i)}
                />
              </Wave>
            ))}
          </div>
          {/* K3's earned bottom: the live summa the wave has been writing
           *  (advances in lockstep with the inked rows), and the
           *  bookkeeper's rule that draws when the count is done. */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginTop: 12,
            }}
          >
            <motion.span
              initial={false}
              animate={{ opacity: rm || step > 0 ? 1 : KH_FAINT }}
              transition={rm ? { duration: 0 } : { duration: 0.2, ease: [...EASE.reading] }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
              }}
            >
              summa
            </motion.span>
            <motion.span
              data-testid="drill-result-summa"
              initial={false}
              animate={{ opacity: rm || step > 0 ? 1 : KH_FAINT }}
              transition={rm ? { duration: 0 } : { duration: 0.2, ease: [...EASE.reading] }}
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: 22,
                color: 'var(--ink)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {rightSoFar} av {step > 0 ? step : total}
            </motion.span>
          </div>
          <motion.div
            aria-hidden
            initial={false}
            animate={{ scaleX: phase === 'wave' && !rm ? 0 : 1 }}
            transition={rm ? { duration: 0 } : { duration: 0.32, ease: [...EASE.reading] }}
            style={{ height: 2, background: 'var(--ink)', transformOrigin: '0% 50%', marginTop: 8 }}
          />
        </Rail>

        {/* ── Imorgon ────────────────────────────────────────────── */}
        {/* The coda seats on KLART_SATS when the wave runs out — the
         *  ceremony ends by handing control back to house physics. */}
        <Rail meta="Imorgon">
          <motion.div
            initial={false}
            animate={settled ? { opacity: 1, scale: 1 } : { opacity: 0, scale: rm ? 1 : 0.96 }}
            transition={settleTransition}
            style={{ transformOrigin: '0% 0%' }}
          >
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
                  Att repetera: {pileCount} {pileCount === 1 ? 'fråga' : 'frågor'} — dina nya missar
                  ligger först i morgondagens plan.
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
          </motion.div>
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

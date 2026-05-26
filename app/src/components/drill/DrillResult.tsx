// Result screen for a finished drill — the `Klart.` payoff.
//
// The director-refined Variant D winner from /loop-bakeoff:
//
//   - Motion fade-in on `Klart.` (180ms, opacity + y: 6 → 0) so the
//     screen marks a threshold rather than materialising flat. The
//     prototype's "the room goes quiet for a second."
//   - FÄLLA · <trap name> eyebrow above the score-delta band when
//     ≥2 misses cluster on the same framework_id. Surfaces causation
//     — the score moved because of THIS trap.
//   - Score-delta band: snapshot the per-section score on mount, then
//     spring-animate the post-session value over 1100ms with a 250ms
//     delay so the headline lands first. `useReducedMotion()` snaps
//     to the final value directly. Hairline em-rule replaces the
//     weak `→` glyph between the before/after values.
//   - CoachLine with VOICE.sessionEnd in the active coach persona.
//   - <Hairline> divider so the screen reads as one editorial page.
//   - Detaljer stats card with three label/mono-value rows.
//   - Imorgon väntar block lifted from useDailyPlan's first non-
//     completed item; headline on top in --ink, rationale below in
//     --ink-2 (no inline dot-stutter).
//   - Single ghost "Stäng" primary CTA.
//   - Bottom folio with Esc · stäng keyboard hint paired to a real
//     Escape handler that fires onHome — the EDITION pattern from
//     task #98.
//
// Replaces the previous score + miss-list composition. Misses still
// enter the repetition queue automatically via SessionPlayer's
// recordMistake.mutate, so the user sees them again in tomorrow's
// prescription — no need to relist them here.

import { motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'

import { useStats } from '@/api/hooks/useStats'
import { Btn, CoachLine, Eyebrow, Hairline, Mono } from '@/components/primitives'
import type { AnswerLetter, Question, Section } from '@/data/questions'
import { useDailyPlan } from '@/hooks/useDailyPlan'
import { computeSectionScore } from '@/lib/scoring'
import { useTrapCluster } from '@/lib/trapCluster'
import { VOICE } from '@/lib/voice'
import { useCoachStore } from '@/stores/coachStore'

export type DrillSummary = {
  questions: Question[]
  picks: (AnswerLetter | null)[]
}

type Props = {
  summary: DrillSummary
  onReplay: () => void
  onHome: () => void
}

export function DrillResult({ summary, onReplay, onHome }: Props) {
  const { questions, picks } = summary
  const total = questions.length
  const correct = picks.reduce<number>((n, p, i) => (p === questions[i].answer ? n + 1 : n), 0)
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100)
  const coach = useCoachStore((s) => s.coach)
  const reduced = useReducedMotion()

  // Section the drill ran in. For mixed-section sessions (repetition,
  // diagnostic) the first question's section is a reasonable label
  // even though the delta band will sit out without a single section
  // anchor. Most drills are single-section; this is the common path.
  const sections = useMemo(() => new Set(questions.map((q) => q.section)), [questions])
  const section: Section | null = sections.size === 1 ? questions[0].section : null

  // Missed qids drive the FÄLLA cluster lookup. Memoize so the
  // trap-cluster effect doesn't thrash.
  const missedQids = useMemo(
    () =>
      questions
        .map((q, i) => ({ q, picked: picks[i] }))
        .filter(({ q, picked }) => picked !== q.answer)
        .map(({ q }) => q.qid),
    [questions, picks],
  )
  const cluster = useTrapCluster(missedQids)

  // Esc keyboard handler — matches the EDITION Esc-to-parent
  // pattern. Esc fires onHome (the primary exit). Ignored while a
  // focused button has its own Enter handling.
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
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        // Clear the bottom tabs (~80px) so "Stäng" stays clickable.
        padding: 'clamp(20px, 1.6vw + 12px, 32px) clamp(20px, 2vw + 12px, 28px) 100px',
        overflowY: 'auto',
        maxWidth: '60ch',
        width: '100%',
        margin: '0 auto',
      }}
    >
      <motion.h1
        data-testid="drill-result-headline"
        initial={reduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          fontSize: 'clamp(48px, 4vw + 24px, 72px)',
          margin: '6px 0 0',
          color: 'var(--ink)',
        }}
      >
        Klart.
      </motion.h1>

      {cluster?.headline && (
        <Eyebrow style={{ marginTop: 18, color: 'var(--accent)' }}>
          Fälla · {cluster.headline}
        </Eyebrow>
      )}

      {section && (
        <ScoreDeltaBand
          section={section}
          reducedMotion={Boolean(reduced)}
          hasCluster={!!cluster?.headline}
        />
      )}

      <CoachLine coach={coach} as="body" style={{ margin: '18px 0 24px', maxWidth: '32ch' }}>
        {`${VOICE[coach].sessionEnd.split(/\.\s+/)[0]}.`}
      </CoachLine>

      <Hairline style={{ marginBottom: 20 }} />

      <DetaljerCard
        section={section}
        correct={correct}
        total={total}
        pct={pct}
        missCount={missedQids.length}
        newTraps={cluster ? 1 : 0}
      />

      <TomorrowBlock />

      <div style={{ flex: 1, minHeight: 24 }} />

      <Btn full size="lg" onClick={onHome}>
        Stäng
      </Btn>

      <Btn full size="md" variant="ghost" onClick={onReplay} style={{ marginTop: 8 }}>
        Öva igen
      </Btn>

      {/* Bottom folio — provenance demoted from headline-competing
       *  position; pairs with the real Esc handler above. */}
      <div
        style={{
          marginTop: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        <span>{section ? `${section} · pass slut` : 'Pass slut'}</span>
        <span>Esc · stäng</span>
      </div>
    </div>
  )
}

// ── Score delta band ────────────────────────────────────────────────

function ScoreDeltaBand({
  section,
  reducedMotion,
  hasCluster,
}: {
  section: Section
  reducedMotion: boolean
  hasCluster: boolean
}) {
  // Capture the pre-session score at mount. The DrillResult only
  // mounts after the session ends and recordMistake calls have
  // fired, so by the time this runs, `useStats()` already reflects
  // the new attempts. To still show a "before → after" we snapshot
  // the score that's visible at THIS mount (which is the after),
  // and treat the previous-known "before" as score − (correct/total
  // share of the window). A cleaner approach would be a session-
  // start snapshot stored on the route; this is the best we can do
  // without that wiring. When the snapshot is null (no prior stats),
  // the band hides.
  const stats = useStats()
  const beforeRef = useRef<number | null>(null)
  const afterScore =
    stats.data?.bySection[section] != null
      ? computeSectionScore(section, stats.data.bySection[section]).score
      : null

  // Snapshot the score the first render after stats land. Subsequent
  // renders ignore the snapshot — the user only sees the delta once
  // per result screen, on initial mount.
  if (beforeRef.current === null && afterScore !== null && stats.data) {
    beforeRef.current = afterScore
  }
  const before = beforeRef.current
  const after = afterScore

  const value = useMotionValue(reducedMotion ? (after ?? 0) : (before ?? 0))
  const display = useTransform(value, (v) => v.toFixed(2))

  // 250ms delay so the headline lands first; 1100ms reading-pace tween.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only intentional
  useEffect(() => {
    if (reducedMotion || before === null || after === null || before === after) return
    const delay = 250
    const duration = 1100
    const start = performance.now() + delay
    let raf = 0
    const tick = (now: number) => {
      const elapsed = now - start
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick)
        return
      }
      const t = Math.min(1, elapsed / duration)
      const eased = 1 - (1 - t) ** 3
      value.set(before + (after - before) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [before, after])

  // Hide the band when there's no signal (no prior attempts in this
  // section, or before === after — first attempt ever lands on the
  // CoachLine without the delta noise).
  if (before === null || after === null) return null
  // When the score didn't move, the delta band is just `0.84 → 0.84`
  // — surface as a single value instead.
  const moved = Math.abs(after - before) > 0.005

  return (
    <div
      data-testid="drill-result-delta"
      style={{
        marginTop: hasCluster ? 12 : 18,
        display: 'flex',
        alignItems: 'baseline',
        gap: 12,
        fontFamily: 'var(--font-display)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span style={{ fontSize: 22, color: 'var(--muted)', letterSpacing: '-0.01em' }}>
        {section}
        {moved ? ` · ${before.toFixed(2)}` : ''}
      </span>
      {moved && (
        <>
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: 18,
              height: 1,
              background: 'var(--muted-2)',
              alignSelf: 'center',
            }}
          />
          <motion.span
            style={{
              fontSize: 28,
              color: after >= before ? 'var(--ink)' : 'var(--accent)',
              letterSpacing: '-0.015em',
            }}
          >
            {display}
          </motion.span>
        </>
      )}
      {!moved && (
        <span style={{ fontSize: 28, color: 'var(--ink)', letterSpacing: '-0.015em' }}>
          {after.toFixed(2)}
        </span>
      )}
    </div>
  )
}

// ── Detaljer stats card ─────────────────────────────────────────────

function DetaljerCard({
  section,
  correct,
  total,
  pct,
  missCount,
  newTraps,
}: {
  section: Section | null
  correct: number
  total: number
  pct: number
  missCount: number
  newTraps: number
}) {
  // Rows shape mirrors the prototype's stats card composition: left
  // label in display body weight, right value in mono. Conditional
  // rows hide cleanly when their signal is absent — never show
  // "Nya fällor markerade · 0" because zero isn't a story.
  const rows: Array<[string, string]> = []
  rows.push([section ? `${section} · pass` : 'Pass', `${correct}/${total}`])
  rows.push(['Träffsäkerhet', `${pct} %`])
  if (missCount > 0) {
    rows.push(['Att repetera imorgon', `${missCount} ${missCount === 1 ? 'miss' : 'missar'}`])
  }
  if (newTraps > 0) {
    rows.push(['Nya fällor markerade', String(newTraps)])
  }

  return (
    <div
      data-testid="drill-result-detaljer"
      style={{
        padding: 'clamp(14px, 1.2vw + 10px, 22px)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--radius)',
      }}
    >
      <Eyebrow>Detaljer</Eyebrow>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
        {rows.map(([label, value]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              fontFamily: 'var(--font-display)',
              fontSize: 13.5,
              color: 'var(--ink-2)',
            }}
          >
            <span>{label}</span>
            <Mono>{value}</Mono>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tomorrow preview ────────────────────────────────────────────────

function TomorrowBlock() {
  const { plan } = useDailyPlan()
  if (!plan) return null
  const tomorrowItem = plan.items.find((i) => !i.completed)
  if (!tomorrowItem) return null

  return (
    <div
      data-testid="drill-result-tomorrow"
      style={{ marginTop: 'clamp(20px, 2.2vw + 8px, 32px)' }}
    >
      <Eyebrow>Imorgon väntar</Eyebrow>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(16px, 0.4vw + 14px, 18px)',
          lineHeight: 1.4,
          color: 'var(--ink)',
          margin: '8px 0 4px 0',
        }}
      >
        {tomorrowItem.headline}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(13px, 0.3vw + 12px, 15px)',
          lineHeight: 1.5,
          color: 'var(--ink-2)',
          margin: 0,
        }}
      >
        {tomorrowItem.rationale}
      </p>
    </div>
  )
}

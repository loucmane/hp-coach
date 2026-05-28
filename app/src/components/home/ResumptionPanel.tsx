// ResumptionPanel — Home's right column at studio width.
//
// Renders a single editorial block when there's a paused session
// across any of the three surfaces (lesson / drill / repetition).
// Returns null when nothing is paused — the right column is air by
// default. State of the art is to *use* this space only when it's
// functionally earned.
//
// Composition (matches the F1 bake-off pick):
//   1. Mono eyebrow with the relative time ("Igår · 19:42" or
//      "X dagar sedan" or same-day "Idag · 02:14")
//   2. Serif body line naming the paused thing ("XYZ-lektion · pausad")
//   3. Italic marginalia step indicator ("vid steg 3 av 7")
//   4. Sage-accent "Fortsätt här →" CTA — the single moment of
//      --accent on the page
//
// The activation-energy win: every paused-yesterday morning becomes
// a one-tap continuation instead of a re-locate / re-orient task.

import { Link } from '@tanstack/react-router'
import type { PausedSession } from '@/stores/pausedSessionStore'
import { useMostRecentPausedSession } from '@/stores/pausedSessionStore'

type ResumptionPanelProps = {
  /** Override "now" for tests. */
  now?: Date
}

export function ResumptionPanel({ now }: ResumptionPanelProps) {
  const paused = useMostRecentPausedSession()
  if (!paused) return null
  return <ResumptionBlock paused={paused} now={now ?? new Date()} />
}

function ResumptionBlock({ paused, now }: { paused: PausedSession; now: Date }) {
  const eyebrow = formatRelative(paused.pausedAt, now)
  const headline = formatHeadline(paused)
  const marginalia = formatMarginalia(paused)
  const href = resumeHref(paused)

  return (
    <aside
      data-testid="home-resumption-panel"
      style={{
        padding: 'clamp(40px, 5vh, 72px) 28px 0 0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          fontVariantNumeric: 'tabular-nums',
        }}
        data-testid="home-resumption-eyebrow"
      >
        {eyebrow}
      </div>

      <div style={{ height: 12 }} />

      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          lineHeight: 1.35,
          color: 'var(--ink)',
        }}
        data-testid="home-resumption-headline"
      >
        {headline}
      </div>

      <div style={{ height: 6 }} />

      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--ink-2)',
        }}
        data-testid="home-resumption-marginalia"
      >
        {marginalia}
      </div>

      <div style={{ height: 18 }} />

      <Link
        to={href}
        data-testid="home-resumption-link"
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 8,
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          color: 'var(--accent)',
          textDecoration: 'none',
          width: 'fit-content',
        }}
      >
        Fortsätt här
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>→</span>
      </Link>
    </aside>
  )
}

// ── Formatters ─────────────────────────────────────────────────────

function formatRelative(pausedAt: number, now: Date): string {
  const pausedDate = new Date(pausedAt)
  const sameDay =
    pausedDate.getFullYear() === now.getFullYear() &&
    pausedDate.getMonth() === now.getMonth() &&
    pausedDate.getDate() === now.getDate()
  if (sameDay) {
    return `Idag · ${formatTime(pausedDate)}`
  }
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  const wasYesterday =
    pausedDate.getFullYear() === yesterday.getFullYear() &&
    pausedDate.getMonth() === yesterday.getMonth() &&
    pausedDate.getDate() === yesterday.getDate()
  if (wasYesterday) {
    return `Igår · ${formatTime(pausedDate)}`
  }
  // Older — render `X dagar sedan` rounded to whole days.
  const days = Math.max(
    1,
    Math.round((now.getTime() - pausedDate.getTime()) / (1000 * 60 * 60 * 24)),
  )
  return `${days} dagar sedan`
}

function formatTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function formatHeadline(p: PausedSession): string {
  if (p.kind === 'lesson') {
    return `${p.section}-lektion · pausad`
  }
  if (p.kind === 'drill') {
    return p.section ? `${p.section}-övning · pausad` : 'Övning · pausad'
  }
  return 'Repetition · pausad'
}

function formatMarginalia(p: PausedSession): string {
  if (p.kind === 'lesson') {
    return `vid steg ${p.step} av ${p.totalSteps}`
  }
  return `vid fråga ${p.questionIndex} av ${p.totalQuestions}`
}

function resumeHref(p: PausedSession): string {
  if (p.kind === 'lesson') {
    const anchor = p.frameworkId ? `#${p.frameworkId}` : ''
    return `/lektion/${p.section}${anchor}?step=${p.step}`
  }
  if (p.kind === 'drill') {
    return `/drill?qid=${encodeURIComponent(p.qid)}`
  }
  return `/repetition?qid=${encodeURIComponent(p.qid)}`
}

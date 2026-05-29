// Home resumption panel — "Fortsätt här →" (desktop / studio right column).
//
// Reads SERVER state via the shared useResumptionCandidate hook, so a
// session paused on one device surfaces on another. Renders the single
// freshest resumable thing across kinds within the EDITION vocabulary:
// mono eyebrow (relative time + device provenance) → display headline
// (subject · pausad) → marginalia (progress) → Sage-accent CTA. When
// nothing is resumable, renders nothing (the right column is air).
//
// The phone surface (PhoneResumptionLine) consumes the same hook, so the
// two never drift.

import { Link } from '@tanstack/react-router'

import { useResumptionCandidate } from './useResumptionCandidate'

const MONO_TRACK = 'var(--font-mono-track, 0.08em)'

export function ResumptionPanel({ now }: { now: Date }) {
  const c = useResumptionCandidate(now)
  if (!c) return null

  const dimColor = c.stale ? 'var(--muted-2, var(--muted))' : 'var(--muted)'
  const eyebrow = [c.relativeLabel, c.deviceLabel, c.stale ? 'för gammal' : null]
    .filter(Boolean)
    .join(' · ')

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
        data-testid="home-resumption-eyebrow"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: MONO_TRACK,
          textTransform: 'uppercase',
          color: dimColor,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {eyebrow}
      </div>
      <div
        aria-hidden
        style={{ height: 1, background: 'var(--hairline)', margin: '14px 0 18px' }}
      />
      <h2
        data-testid="home-resumption-headline"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(20px, 1vw + 16px, 26px)',
          lineHeight: 1.15,
          letterSpacing: '-0.01em',
          color: c.stale ? 'var(--ink-2)' : 'var(--ink)',
          margin: 0,
        }}
      >
        {c.headline}
      </h2>
      <div
        data-testid="home-resumption-marginalia"
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 14,
          color: c.stale ? 'var(--muted-2, var(--muted))' : 'var(--ink-2)',
          margin: '8px 0 0 0',
        }}
      >
        {c.progress}
      </div>
      <Link
        to={c.href}
        data-testid="home-resumption-link"
        style={{
          marginTop: 22,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          letterSpacing: MONO_TRACK,
          textTransform: 'uppercase',
          color: 'var(--accent)',
          textDecoration: 'none',
        }}
      >
        Fortsätt här →
      </Link>
    </aside>
  )
}

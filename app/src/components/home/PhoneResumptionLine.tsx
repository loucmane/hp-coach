// Phone resumption line — "Fortsätt" (variant C, the bake-off pick).
//
// The phone Home stacks in one ~390px column, so the resumption surface
// can't be a second hero block (that's variant A) — it sits between the
// greeting and the daily plan as one warm, obvious line: a Sage-led mono
// eyebrow (the verb FIRST — "Fortsätt" — then time + device) over a
// single display line "subject · progress" with a Sage arrow. Subordinate
// to the daily prescription, but unmistakably tappable.
//
// Shares useResumptionCandidate with the desktop panel, so the two never
// drift. Renders nothing when there's nothing to resume. Stale (>7d)
// drops the Sage warmth, dims, and appends "· för gammal".

import { Link } from '@tanstack/react-router'

import { useResumptionCandidate } from './useResumptionCandidate'

const MONO_TRACK = 'var(--font-mono-track, 0.08em)'

export function PhoneResumptionLine({ now }: { now: Date }) {
  const c = useResumptionCandidate(now)
  if (!c) return null

  const eyebrow = ['Fortsätt', c.relativeLabel, c.deviceLabel, c.stale ? 'för gammal' : null]
    .filter(Boolean)
    .join(' · ')
  const accent = c.stale ? 'var(--muted)' : 'var(--accent)'

  return (
    <Link
      to={c.href}
      data-testid="home-resumption-line-phone"
      className="hpc-resume-line"
      style={{ display: 'block', textDecoration: 'none' }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: MONO_TRACK,
          textTransform: 'uppercase',
          color: c.stale ? 'var(--muted-2, var(--muted))' : 'var(--accent)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          marginTop: 8,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            lineHeight: 1.2,
            color: c.stale ? 'var(--ink-2)' : 'var(--ink)',
          }}
        >
          {c.subject} · {c.progress}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: accent }}>→</span>
      </div>
    </Link>
  )
}

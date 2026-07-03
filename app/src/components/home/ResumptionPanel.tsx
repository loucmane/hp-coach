// ResumptionPanel — the "Påbörjad" resume band, M3 style (M3H; spec
// devbake/l12/M3.tsx L788-803).
//
// Reads SERVER state via the shared useResumptionCandidate hook, so a
// session paused on one device surfaces on another. One surface for
// every viewport now (the old phone line + desktop right-column panel
// merged): an accent-soft band with the headline, a mono sub-line
// (progress · device · relative time), and the cobalt "Fortsätt här"
// CTA. When nothing is resumable, renders nothing.

import { Link } from '@tanstack/react-router'

import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { useResumptionCandidate } from './useResumptionCandidate'

export function ResumptionPanel({ now }: { now: Date }) {
  const c = useResumptionCandidate(now)
  if (!c) return null

  const sub = [c.progress, c.deviceLabel, c.relativeLabel, c.stale ? 'för gammal' : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <DrillRailSection meta="Påbörjad" delay={120}>
      <div
        className="hpc-m3-resume"
        data-testid="home-resumption-panel"
        style={c.stale ? { opacity: 0.7 } : undefined}
      >
        <div style={{ minWidth: 0 }}>
          <div className="hpc-m3-resume-t" data-testid="home-resumption-headline">
            {c.headline}
          </div>
          <div className="hpc-m3-resume-s" data-testid="home-resumption-marginalia">
            {sub}
          </div>
        </div>
        <Link to={c.href} data-testid="home-resumption-link" className="hpc-m3-cta">
          Fortsätt här
        </Link>
      </div>
    </DrillRailSection>
  )
}

// /adaptive-verify — dev-only visual verification harness for the
// adaptive-review hot-trap offer (task #16). The real offer renders inside
// SessionPlayer's Clerk-gated drill tree behind seeded mistakes; this route
// renders the prop-driven AdaptiveReviewOffer directly (no QueryClient /
// Clerk / seeded state) so the house "screenshot real components" rule can
// be met without the full auth+API stack.
//
// Dev-gated via isDevSurface(). Kept per the "keep bake-offs" house rule.

import { createFileRoute } from '@tanstack/react-router'

import { AdaptiveReviewOffer } from '@/components/session/AdaptiveReviewOffer'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/adaptive-verify')({
  component: AdaptiveVerify,
})

function AdaptiveVerify() {
  if (!isDevSurface()) {
    return (
      <div style={{ padding: 40, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
        /adaptive-verify is a dev-only surface. Append <code>?dev=1</code> to opt in.
      </div>
    )
  }

  const noop = () => {}

  return (
    <div
      style={{ background: 'var(--bg)', minHeight: '100dvh', padding: 'clamp(24px, 4vw, 64px)' }}
    >
      {/* Idle-masthead context: the offer leads, the chapter opening follows,
       *  exactly as SessionPlayer's IdleBody composes it. */}
      <div style={{ maxWidth: 560, margin: '0 auto', display: 'grid', gap: 40 }}>
        <section>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 14,
            }}
          >
            Offer · DTK-fälla
          </div>
          <AdaptiveReviewOffer
            trapName="Läs av rätt axel innan du jämför staplar"
            section="DTK"
            onAccept={noop}
            onDecline={noop}
          />
        </section>

        <section>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 14,
            }}
          >
            Offer · KVA-fälla (fallback till id)
          </div>
          <AdaptiveReviewOffer
            trapName="KVA-TRAP-024"
            section="KVA"
            onAccept={noop}
            onDecline={noop}
          />
        </section>
      </div>
    </div>
  )
}

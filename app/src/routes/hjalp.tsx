// /hjalp — Hjälp & support (P2.4).
//
// A letter, not a portal: one public Boksidan reading column in the same
// register as /villkor and /integritet (bare chassis, no authed chrome —
// a locked-out user needs this page most). No FAQ machinery, no form.
// One promise, one door (mailto), and a quiet colophon with the deploy
// SHA. The mailto body prefills the version line so a bug report carries
// the SHA without the user knowing to ask.
//
// Reached from the /mer footer row, the ⌘K command, and directly.

import { createFileRoute, Link } from '@tanstack/react-router'

import { P, PROSE_STYLE } from '@/components/legal/LegalPage'
import { Eyebrow } from '@/components/primitives'
import { useFirstContentSignal } from '@/lib/motion'
import { APP_VERSION, SUPPORT_EMAIL, SUPPORT_MAILTO, SUPPORT_REPLY_LINE } from '@/lib/support'

export const Route = createFileRoute('/hjalp')({
  component: HjalpRoute,
})

// Exported for the render test — same "render the exported screen, no
// router harness" idiom as the legal pages.
export function HjalpRoute() {
  useFirstContentSignal()
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'clamp(40px, 8vh, 96px) clamp(24px, 5vw, 80px)',
        color: 'var(--ink)',
      }}
    >
      <article
        style={{
          width: '100%',
          maxWidth: '42rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(28px, 4vh, 44px)',
        }}
      >
        <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Eyebrow>HP-Coach</Eyebrow>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 'clamp(32px, 5vw, 48px)',
              lineHeight: 1.08,
              letterSpacing: '-0.015em',
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            Hjälp &amp; support.
          </h1>
          <p style={PROSE_STYLE}>{SUPPORT_REPLY_LINE}</p>
        </header>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Eyebrow>Skriv till oss</Eyebrow>
          <P>
            Något som är fel, ser konstigt ut eller inte fungerar? Skriv som du pratar — inga
            ärendenummer, inget formulär. Beskriv vad du gjorde och vad som hände, så tar vi det
            därifrån.
          </P>
          <a
            href={SUPPORT_MAILTO}
            data-testid="hjalp-mailto"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(20px, 2.4vw, 26px)',
              fontWeight: 500,
              letterSpacing: '-0.01em',
              color: 'var(--ink)',
              textDecoration: 'underline',
              textUnderlineOffset: 4,
              width: 'fit-content',
            }}
          >
            {SUPPORT_EMAIL}
          </a>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.06em',
              color: 'var(--muted)',
              margin: 0,
            }}
          >
            App-version {APP_VERSION} — den följer med i mejlet automatiskt, så du behöver inte
            tänka på den.
          </p>
        </section>

        <footer
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px 24px',
            marginTop: 'clamp(12px, 3vh, 28px)',
            paddingTop: 22,
            borderTop: '1px solid var(--hairline)',
          }}
        >
          <Link to="/" style={FOOTER_LINK_STYLE}>
            ← till appen
          </Link>
        </footer>
      </article>
    </div>
  )
}

const FOOTER_LINK_STYLE = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  textDecoration: 'none',
} as const

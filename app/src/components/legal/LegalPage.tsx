// LegalPage — the shared reading-column chassis for the two public legal
// surfaces (/integritet, /villkor).
//
// These pages must render logged-OUT (they're in __root's PUBLIC_ROUTES),
// so they deliberately do NOT use MobileFrame/Page/NavRail — that chrome
// links into authed routes and pulls session-only stores. Instead this is
// a bare, self-contained Boksidan reading column, the same register as
// /welcome and /sign-in: mono eyebrow masthead, serif reading column
// capped near ~70ch, mono section eyebrows, one dated "Senast uppdaterad"
// line. Plain Swedish, no legalese theater — house voice.

import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { Eyebrow } from '@/components/primitives'

export type LegalSection = {
  /** Mono eyebrow above the section. */
  eyebrow: string
  /** Serif section heading. */
  heading: string
  /** One or more serif reading paragraphs (ReactNode so copy can carry links). */
  body: ReactNode
}

export function LegalPage({
  title,
  lastUpdated,
  intro,
  sections,
  otherDoc,
}: {
  title: string
  /** Human date string, e.g. "15 juli 2026". */
  lastUpdated: string
  /** Lead paragraph under the masthead. */
  intro: ReactNode
  sections: LegalSection[]
  /** Cross-link to the sibling legal page. */
  otherDoc: { to: string; label: string }
}) {
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
          // ~70ch reading measure for the serif column.
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
            {title}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              margin: 0,
            }}
          >
            Senast uppdaterad {lastUpdated}
          </p>
          <p style={PROSE_STYLE}>{intro}</p>
        </header>

        {sections.map((s) => (
          <section key={s.eyebrow} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Eyebrow>{s.eyebrow}</Eyebrow>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: 'clamp(20px, 2.4vw, 26px)',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              {s.heading}
            </h2>
            {s.body}
          </section>
        ))}

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
          <Link to={otherDoc.to} style={FOOTER_LINK_STYLE}>
            {otherDoc.label} →
          </Link>
          <Link to="/" style={FOOTER_LINK_STYLE}>
            ← till appen
          </Link>
        </footer>
      </article>
    </div>
  )
}

// Serif reading paragraph — the house body register for these pages.
export const PROSE_STYLE = {
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(16px, 1.4vw, 18px)',
  lineHeight: 1.6,
  color: 'var(--ink-2)',
  margin: 0,
} as const

const FOOTER_LINK_STYLE = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  textDecoration: 'none',
} as const

/** A serif paragraph in the legal reading register. */
export function P({ children }: { children: ReactNode }) {
  return <p style={PROSE_STYLE}>{children}</p>
}

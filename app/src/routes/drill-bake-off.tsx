// /drill-bake-off — index page linking to all four drill-page candidates.
//
// Side-by-side comparison surface for the dogfood user to evaluate
// each direction in isolation:
//
//   - Nuvarande:    /drill?qid=host-2013-kvant2-KVA-016
//   - A · Editorial Pure:           /drill-style-a
//   - B · Reader Single-Column:     /drill-style-b
//   - C · Cockpit Terminal:         /drill-style-c
//
// All four routes render the SAME question + pedagogy, so the
// comparison is purely about layout, typography, and composition.
// After the user picks the winner this route can be retired in the
// same PR that promotes the winner to /drill.

import { createFileRoute, Link } from '@tanstack/react-router'

const DEFAULT_QID = 'host-2013-kvant2-KVA-016'

type Variant = {
  slug: string
  href: string
  label: string
  tagline: string
  thesis: string
  signature: string
}

const VARIANTS: Variant[] = [
  {
    slug: 'current',
    href: `/drill?qid=${DEFAULT_QID}`,
    label: 'Nuvarande',
    tagline: '2-kolumn sticky desk · frosted chrome · floating CTA',
    thesis:
      'Vad du har idag. Editorial register med sticky frågekolumn till vänster, pedagogik till höger, frosted chrome överst och nederst, frosted-glass floating Nästa-knapp i nedre höger.',
    signature: 'Frosted-glass chrome envelope',
  },
  {
    slug: 'a',
    href: '/drill-style-a',
    label: 'A · Editorial Pure',
    tagline: 'Samma 2-kolumn — men allt frost försvinner · Newsreader 20px/1.7 i pedagogiken',
    thesis:
      'Strip ornamentet. Pedagogiken är hjälten med 20px Newsreader / 1.7 leading. Frågekolumnen finns men viskar. Inget frostat glas. Ingen flytande pill — CTA är en typografisk länk i slutet av pedagogiken.',
    signature: 'Hängande stegnummer med matchande hairline (rim på folio-glyfen)',
  },
  {
    slug: 'b',
    href: '/drill-style-b',
    label: 'B · Reader Single-Column',
    tagline: 'Sidofältet dör · fråga som pinned strip · pedagogik 720px reading column',
    thesis:
      'Döda 2-kolumn-splitten. Frågan blir en tunn pinned-strip överst (~140px) med inline option-pills. Pedagogiken är EN bred reading-column under, 22px Newsreader / 1.75. Inga flytande knappar. Inline "Nästa →" i slutet. Status line har 2-rad state-machine.',
    signature: '01 ── Pythagoras i två rörelser  (hängande mono-nummer + em-dash)',
  },
  {
    slug: 'c',
    href: '/drill-style-c',
    label: 'C · Cockpit Terminal',
    tagline: 'Bloomberg × vim × tmux · multi-row status bar · keycap-boxed alternativ',
    thesis:
      'Mono överallt på chrome och fråga, Newsreader bara i pedagogi-body. 3-rad status bar med state machine: "[c] picked · 18s · ↵ nästa →". Keycap-boxed bokstäver. Ingen body-scroll — fyra interna paneler. Keyboard-primärt, noll synliga knappar.',
    signature: '3-rad status bar med live state-machine ([c] correct · 18s · ↵ nästa →)',
  },
]

export const Route = createFileRoute('/drill-bake-off')({
  component: DrillBakeOff,
})

function DrillBakeOff() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        color: 'var(--ink)',
        padding: 'clamp(40px, 5vh, 64px) clamp(24px, 5vw, 64px) clamp(80px, 10vh, 120px)',
      }}
    >
      {/* Header */}
      <header style={{ maxWidth: 1200, margin: '0 auto', marginBottom: 56 }}>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            margin: 0,
            marginBottom: 12,
          }}
        >
          Drill page · style bake-off
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 3vw + 16px, 56px)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            fontWeight: 500,
            margin: 0,
            marginBottom: 24,
          }}
        >
          Tre riktningar att jämföra.
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(17px, 0.9rem + 0.4vw, 20px)',
            lineHeight: 1.6,
            color: 'var(--ink-2)',
            maxWidth: 680,
            margin: 0,
          }}
        >
          Samma fråga (KVA-016) renderas i fyra olika layouter. Klicka in i varje, klicka ett
          alternativ för att se hela pedagogiken i den riktningens typografi. Återgå hit för att
          jämföra.
        </p>
        <p
          style={{
            marginTop: 20,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.08em',
            color: 'var(--muted)',
            maxWidth: 680,
          }}
        >
          Designerns rekommendation:&nbsp;
          <strong style={{ color: 'var(--ink)' }}>B som default</strong>, C som opt-in power-mode
          bakom <code>⌘k → mode: cockpit</code>. A retireras (för nära nuvarande). Men du bestämmer
          — vi har specen för alla tre.
        </p>
      </header>

      {/* Grid of variant cards */}
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '0 auto',
          maxWidth: 1200,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 'clamp(20px, 2vw, 32px)',
        }}
      >
        {VARIANTS.map((v) => (
          <li key={v.slug}>
            <Link
              to={v.href.split('?')[0]}
              search={(prev) => ({ ...prev, qid: DEFAULT_QID })}
              style={{
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                background: 'var(--panel)',
                border: '1px solid var(--hairline)',
                borderRadius: 4,
                padding: 'clamp(24px, 3vw, 36px)',
                height: '100%',
                transition: 'border-color 200ms, background 200ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--ink)'
                e.currentTarget.style.background = 'var(--panel-2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--hairline)'
                e.currentTarget.style.background = 'var(--panel)'
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  margin: 0,
                  marginBottom: 10,
                }}
              >
                {v.slug === 'current' ? 'baseline' : `variant ${v.slug.toUpperCase()}`}
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 24,
                  lineHeight: 1.2,
                  letterSpacing: '-0.018em',
                  fontWeight: 500,
                  margin: 0,
                  marginBottom: 8,
                }}
              >
                {v.label}
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: '0.04em',
                  color: 'var(--accent)',
                  margin: 0,
                  marginBottom: 16,
                }}
              >
                {v.tagline}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: 'var(--ink-2)',
                  margin: 0,
                  marginBottom: 16,
                }}
              >
                {v.thesis}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  margin: 0,
                  marginBottom: 4,
                }}
              >
                Signature
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: 'var(--ink)',
                  fontStyle: 'italic',
                  margin: 0,
                  marginBottom: 24,
                }}
              >
                {v.signature}
              </p>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  gap: 6,
                  fontFamily: 'var(--font-display)',
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'var(--ink)',
                  borderBottom: '1px solid var(--ink)',
                  paddingBottom: 2,
                }}
              >
                Öppna →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}

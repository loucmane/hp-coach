// HomeVariantF1 — AIR + RESUMPTION (UX lead's pick).
//
// The right half stays empty most mornings. The ONLY thing that ever
// appears there is a single resumption line — when yesterday's
// session was paused mid-flow, a 4-line block at the top-right notes
// what was paused and offers a one-tap "fortsätt här" link.
//
// Most days: air. The whitespace is the design.
// Some days: one functional line, generated from a real paused state.
//
// Day-100 test: still works. Air is permanent; resumption is
// structurally tied to behavior that won't go away.

import { BLeftColumn } from './HomeRound2Shared'

export function HomeVariantF1() {
  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        display: 'grid',
        gridTemplateColumns: '58fr 42fr',
        gap: 'clamp(48px, 5vw, 88px)',
        color: 'var(--ink)',
        minHeight: 720,
      }}
    >
      <BLeftColumn />
      <ResumptionPanel />
    </div>
  )
}

function ResumptionPanel() {
  return (
    <aside
      style={{
        padding: 'clamp(40px, 5vh, 72px) 28px 0 0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Eyebrow — the single mono register on the right. Matches the
       *  left column's kicker so the eye reads them as parallel. */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        Igår · 27 maj
      </div>

      <div style={{ height: 12 }} />

      {/* The paused item — serif body, slightly elevated. */}
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          lineHeight: 1.35,
          color: 'var(--ink)',
        }}
      >
        XYZ-lektion · pausad
      </div>

      <div style={{ height: 6 }} />

      {/* Marginalia step indicator. */}
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--ink-2)',
        }}
      >
        vid steg 3 av 7
      </div>

      <div style={{ height: 18 }} />

      {/* Single accent affordance — the one moment of --accent on the
       *  page. Click resumes exactly where yesterday ended. */}
      <a
        href="/lektion/XYZ#step-3"
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 8,
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          color: 'var(--accent)',
          textDecoration: 'none',
        }}
      >
        Fortsätt här
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>→</span>
      </a>

      {/* The rest of the column is air. By design. */}
    </aside>
  )
}

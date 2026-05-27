// TrapCardDropCap — Cat 5 preview.
//
// Trap card today (collapsed accordion + expanded body when open) vs
// elevated: hanging-indent masthead with section letters at pull-quote
// scale, and a real drop-cap on the first paragraph of why_it_occurs.

const ENTRY = {
  id: 'KVA-TRAP-008',
  tldr: 'Kvadrat-likhet låser inte tecken — x² = y² öppnar både x = y och x = −y.',
  pattern_description:
    'När bägge kvantiteterna är kvadrater, eller när "x² = y²" finns i premisserna, finns det ofta två möjliga relationer mellan x och y, inte en.',
  why_it_occurs:
    'Studenten ser likhet och drar slutsatsen att kvantiteterna är lika. Hjärnan tar genvägen "lika kvadrater → lika tal" och hoppar över det andra tecknet. För ADHD-PI-läsaren är det här tysta fall där den första rimliga tanken tar över. Räkneexemplet nedan visar hur det andra fallet öppnas.',
}

export function TrapCardDropCap() {
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
      className="hpc-elev-grid"
    >
      <Preview label="Idag">
        <CurrentTrap />
      </Preview>
      <Preview label="Eleverad — drop-cap + hanging indent">
        <ElevatedTrap />
      </Preview>
      <style>{`
        @media (max-width: 768px) {
          .hpc-elev-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function Preview({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        {label}
      </span>
      <div
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--hairline)',
          borderRadius: 'var(--radius)',
          padding: 'clamp(16px, 1.4vw + 8px, 24px)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function CurrentTrap() {
  return (
    <div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        {ENTRY.id} · trap 008
      </span>
      <h3
        style={{
          margin: '12px 0 0',
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          lineHeight: 1.25,
          letterSpacing: '-0.012em',
          color: 'var(--ink)',
        }}
      >
        {ENTRY.tldr}
      </h3>

      <div
        style={{
          marginTop: 18,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        Pattern
      </div>
      <p
        style={{
          margin: '6px 0 0',
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          lineHeight: 1.55,
          color: 'var(--ink-2)',
        }}
      >
        {ENTRY.pattern_description}
      </p>

      <div
        style={{
          marginTop: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        Varför det händer
      </div>
      <p
        style={{
          margin: '6px 0 0',
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          lineHeight: 1.55,
          color: 'var(--ink-2)',
        }}
      >
        {ENTRY.why_it_occurs}
      </p>
    </div>
  )
}

function ElevatedTrap() {
  return (
    <div>
      {/* Hanging-indent masthead — id hangs in left margin */}
      <div style={{ position: 'relative', paddingLeft: 56, minHeight: 100 }}>
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 4,
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            writingMode: 'horizontal-tb',
            textAlign: 'right',
            width: 44,
            lineHeight: 1.3,
          }}
        >
          KVA
          <br />
          TRAP
          <br />
          008
        </span>
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 2vw + 16px, 44px)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
          }}
        >
          Kvadrat-likhet låser inte tecken.
        </h3>
        <div
          style={{
            marginTop: 10,
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 14,
            lineHeight: 1.5,
            color: 'var(--ink-2)',
            maxWidth: '42ch',
          }}
        >
          x² = y² öppnar både x = y och x = −y — den första rimliga tanken är inte den enda.
        </div>
      </div>

      {/* First paragraph with real drop-cap */}
      <div style={{ marginTop: 28 }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            lineHeight: 1.6,
            color: 'var(--ink)',
          }}
          className="hpc-dropcap"
        >
          {ENTRY.why_it_occurs}
        </p>
      </div>

      <style>{`
        .hpc-dropcap::first-letter {
          font-family: var(--font-display);
          font-weight: 500;
          color: var(--accent);
          float: left;
          font-size: 4.2em;
          line-height: 0.92;
          padding-right: 8px;
          padding-top: 6px;
          margin-left: -2px;
          letter-spacing: -0.02em;
        }
      `}</style>
    </div>
  )
}

// KlartPull — Cat 7 preview.
//
// CoachLine today: one sentence, accent left-border. Elevated: two-line
// editorial pull — body line is the quote, second line is an 11px mono
// kicker citing the trap framework_id. Quote + attribution.

export function KlartPull() {
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
      className="hpc-elev-grid"
    >
      <Preview label="Idag">
        <CurrentCoach />
      </Preview>
      <Preview label="Eleverad — citat + attribution">
        <ElevatedCoach />
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
          padding: '24px 28px',
          minHeight: 200,
        }}
      >
        {children}
      </div>
    </div>
  )
}

function CurrentCoach() {
  return (
    <div>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 48,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          color: 'var(--ink)',
          margin: '0 0 24px',
        }}
      >
        Klart.
      </h1>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          borderLeft: '1.5px solid var(--accent)',
          paddingLeft: 14,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 16,
            lineHeight: 1.45,
            color: 'var(--ink)',
            maxWidth: '32ch',
          }}
        >
          Bra jobbat idag.
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          — COACH · TAKTIKER
        </div>
      </div>
    </div>
  )
}

function ElevatedCoach() {
  return (
    <div>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 48,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          color: 'var(--ink)',
          margin: '0 0 24px',
        }}
      >
        Klart.
      </h1>
      {/* Body line as editorial pull */}
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 'clamp(17px, 0.5vw + 15px, 19px)',
          lineHeight: 1.45,
          color: 'var(--ink)',
          maxWidth: '34ch',
        }}
      >
        Det andra fallet öppnades — kvadrat-likhet låser inte tecken.
      </p>
      {/* Second line: mono attribution citing the trap */}
      <div
        style={{
          marginTop: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        — fällan · KVA-TRAP-008 · stacked-fraction inversion
      </div>
    </div>
  )
}

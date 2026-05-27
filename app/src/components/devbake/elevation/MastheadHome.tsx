// MastheadHome — Cat 3 preview.
//
// Side-by-side: today's 6-element header stack (date + days kvar +
// phase + tillbaka + diagnostik + streak + sigil + greeting) vs the
// elevated 3-element masthead (dateline + italic sub-deck +
// rotating marginalia opposite the streak).

export function MastheadHome() {
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
      className="hpc-elev-grid"
    >
      <Preview label="Idag — 6 element">
        <CurrentMasthead />
      </Preview>
      <Preview label="Eleverad — 3 element">
        <ElevatedMasthead />
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
          padding: 'clamp(20px, 2vw + 8px, 28px)',
          minHeight: 320,
        }}
      >
        {children}
      </div>
    </div>
  )
}

function CurrentMasthead() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Mono>Tisdag · 27 maj</Mono>
          <Mono dim style={{ marginTop: 4 }}>
            152 dagar kvar · höstprov 26
          </Mono>
          <Mono caps style={{ marginTop: 2 }}>
            mittfas · stadig rytm
          </Mono>
          <Mono caps style={{ marginTop: 6 }}>
            tillbaka · 3 dagar sedan
          </Mono>
          <Mono caps style={{ marginTop: 4 }}>
            diagnostik · 2 d sedan · baseline 0.62 ·{' '}
            <span style={{ color: 'var(--accent)' }}>rebaseline →</span>
          </Mono>
        </div>
        <Badge>14 d</Badge>
      </div>

      <Sigil completed={2} total={4} />
      <Marginalia text="2 av 4" />

      <h1
        style={{
          margin: '22px 0 0',
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 32,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          color: 'var(--ink)',
        }}
      >
        God morgon, Loucmane.
      </h1>
    </div>
  )
}

function ElevatedMasthead() {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div>
          {/* Dateline */}
          <Mono>Tisdag · 27 maj</Mono>
          {/* Italic sub-deck: days + phase merged into one editorial line */}
          <div
            style={{
              marginTop: 6,
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 14,
              lineHeight: 1.5,
              color: 'var(--ink-2)',
              maxWidth: '32ch',
            }}
          >
            152 dagar till höstprov 26 — mittfas, stadig rytm.
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <Badge>14 d</Badge>
          {/* Rotating marginalia — single line, alternates between visit / diagnostic */}
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 11.5,
              color: 'var(--ink-2)',
              textAlign: 'right',
              maxWidth: '18ch',
            }}
          >
            tillbaka · 3 d · baseline 0.62
          </div>
        </div>
      </div>

      <Sigil completed={2} total={4} />
      <div
        style={{
          marginTop: 10,
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--ink-2)',
        }}
      >
        2 av 4 idag — börja med drill · XYZ
      </div>

      <h1
        style={{
          margin: '32px 0 0',
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 32,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          color: 'var(--ink)',
        }}
      >
        God morgon, Loucmane.
      </h1>
    </div>
  )
}

function Mono({
  children,
  caps,
  dim,
  style,
}: {
  children: React.ReactNode
  caps?: boolean
  dim?: boolean
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: caps ? 11 : 12,
        letterSpacing: caps ? '0.06em' : 'var(--font-mono-track, 0.03em)',
        textTransform: caps ? 'uppercase' : 'none',
        color: dim ? 'var(--muted)' : 'var(--ink-2)',
        fontVariantNumeric: 'tabular-nums',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '4px 8px',
        border: '1px solid var(--hairline)',
        borderRadius: 6,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--ink-2)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {children}
    </div>
  )
}

function Sigil({ completed, total }: { completed: number; total: number }) {
  const fraction = completed / total
  return (
    <div
      style={{
        marginTop: 18,
        position: 'relative',
        height: 1,
        background: 'var(--hairline-2)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: `${fraction * 100}%`,
          background: 'var(--ink)',
        }}
      />
    </div>
  )
}

function Marginalia({ text }: { text: string }) {
  return (
    <div
      style={{
        marginTop: 8,
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontSize: 13,
        color: 'var(--ink-2)',
      }}
    >
      {text}
    </div>
  )
}

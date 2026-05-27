// SectionRowsProgress — Cat 4 preview.
//
// /progress section rows today vs chapter-opener numerals. Stops the
// table reading like Excel and starts it reading like a TOC.

const ROWS = [
  { section: 'XYZ', score: 1.78, attempts: 87, trend: '↗ +4%' },
  { section: 'KVA', score: 1.42, attempts: 51, trend: '→ ±0%' },
  { section: 'NOG', score: 0.94, attempts: 14, trend: '↘ −6%' },
  { section: 'DTK', score: 0.62, attempts: 8, trend: '— —' },
]

export function SectionRowsProgress() {
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
      className="hpc-elev-grid"
    >
      <Preview label="Idag">
        <CurrentRows />
      </Preview>
      <Preview label="Eleverad — kapitelnumrerad">
        <ElevatedRows />
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
          padding: '20px 24px',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function CurrentRows() {
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
        Sektioner
      </span>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
        {ROWS.map((row, i) => (
          <div
            key={row.section}
            style={{
              display: 'grid',
              gridTemplateColumns: '52px 1fr auto auto',
              columnGap: 12,
              alignItems: 'baseline',
              paddingBlock: 12,
              borderTop: i === 0 ? 'none' : '1px solid var(--hairline)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                lineHeight: 1,
                letterSpacing: '-0.015em',
                color: 'var(--ink)',
              }}
            >
              {row.section}
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{row.attempts} försök</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--ink-2)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {row.trend}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                color: 'var(--ink)',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.01em',
              }}
            >
              {row.score.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ElevatedRows() {
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
        Innehåll
      </span>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
        {ROWS.map((row, i) => (
          <div
            key={row.section}
            style={{
              display: 'grid',
              gridTemplateColumns: '36px 60px 1fr auto',
              columnGap: 16,
              alignItems: 'baseline',
              paddingBlock: 14,
              borderTop: i === 0 ? 'none' : '1px solid var(--hairline)',
            }}
          >
            {/* Chapter numeral — small-caps mono */}
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            {/* Section letters — same scale as numerals would be in a TOC */}
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 17,
                lineHeight: 1,
                letterSpacing: '0.04em',
                color: 'var(--ink)',
              }}
            >
              {row.section}
            </span>
            {/* Subtle dotted leader — Stripe Press / book TOC move */}
            <span
              aria-hidden
              style={{
                borderBottom: '1px dotted var(--hairline)',
                alignSelf: 'baseline',
                position: 'relative',
                top: -3,
              }}
            />
            {/* Score becomes THE number (editorial weight) */}
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24,
                color: 'var(--ink)',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.01em',
              }}
            >
              {row.score.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

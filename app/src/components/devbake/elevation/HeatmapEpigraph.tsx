// HeatmapEpigraph — Cat 6 preview.
//
// Heatmap today (strip + summary) vs paired with a hand-set epigraph
// at studio width. The data gets a title page.

const RAMP = [
  'var(--hairline-2)',
  'color-mix(in oklch, var(--accent) 22%, var(--bg))',
  'color-mix(in oklch, var(--accent) 55%, var(--bg))',
  'var(--accent)',
]

export function HeatmapEpigraph() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Preview label="Idag — strippen ensam">
        <CurrentHeatmap />
      </Preview>
      <Preview label="Eleverad — paret med epigraf">
        <ElevatedHeatmap />
      </Preview>
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
        }}
      >
        {children}
      </div>
    </div>
  )
}

function HeatGrid() {
  // Synthetic 12×6 grid with realistic density pattern
  const cells: number[] = []
  for (let i = 0; i < 12 * 6; i++) {
    const week = Math.floor(i / 6)
    const recencyBoost = Math.max(0, week - 8) * 2
    const r = (i * 7919) % 11
    if (r < 2) cells.push(0)
    else if (r < 5) cells.push(1)
    else if (r < 9) cells.push(2 + Math.min(1, recencyBoost))
    else cells.push(3)
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridTemplateRows: 'repeat(6, 1fr)',
        gridAutoFlow: 'column',
        gap: 4,
        aspectRatio: '12 / 6',
        width: '100%',
      }}
    >
      {cells.map((b, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: position-as-key intentional
          key={i}
          style={{
            background: RAMP[b],
            display: 'block',
            aspectRatio: '1 / 1',
          }}
        />
      ))}
    </div>
  )
}

function CurrentHeatmap() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          Närvaro · senaste 12 veckorna
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          färre ▢▢▢▢ fler
        </span>
      </div>
      <HeatGrid />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        Aktuell serie: 14 dagar (rekord)
      </span>
    </div>
  )
}

function ElevatedHeatmap() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.6fr) minmax(180px, 1fr)',
        gap: 32,
        alignItems: 'center',
      }}
      className="hpc-epigraph-grid"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          Närvaro · senaste 12 veckorna
        </span>
        <HeatGrid />
      </div>
      {/* Epigraph — hand-set, single declarative sentence, italic */}
      <div
        style={{
          borderLeft: '1px solid var(--hairline)',
          paddingLeft: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 'clamp(17px, 0.8vw + 14px, 22px)',
            lineHeight: 1.4,
            color: 'var(--ink)',
          }}
        >
          Du har dykt upp 11 av de senaste 14 dagarna. Det är hur det görs.
        </p>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          — Aktuell serie · 14 d · rekord
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .hpc-epigraph-grid { grid-template-columns: 1fr !important; gap: 18px !important; }
          .hpc-epigraph-grid > div:last-child { border-left: none !important; padding-left: 0 !important; }
        }
      `}</style>
    </div>
  )
}

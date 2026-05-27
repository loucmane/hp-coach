// RunningHeadEdition — Cat 2 preview.
//
// Side-by-side: current "HP-COACH · LEKTION" running head vs the
// elevated "EDITION III · SPREAD 04 · LEKTION" treatment. The
// elevated version turns the chrome strip into a numbered editorial
// header that counts.

export function RunningHeadEdition() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
      <Preview label="Idag">
        <CurrentRunningHead />
      </Preview>
      <Preview label="Eleverad">
        <ElevatedRunningHead />
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
          padding: '20px 28px',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function CurrentRunningHead() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 12,
        paddingBottom: 14,
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        fontSize: 13,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--ink-2)',
        borderBottom: '1px solid var(--hairline)',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, color: 'var(--ink)' }}>
        <span style={{ fontSize: 14, letterSpacing: 0 }}>⌜</span>
        HP-COACH
      </span>
      <span style={{ color: 'var(--ink-2)' }}>· LEKTION · KVA</span>
    </div>
  )
}

function ElevatedRunningHead() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 12,
        paddingBottom: 14,
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        fontSize: 13,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--ink-2)',
        borderBottom: '1px solid var(--hairline)',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, color: 'var(--ink)' }}>
        <span style={{ fontSize: 14, letterSpacing: 0 }}>⌜</span>
        EDITION III
      </span>
      <span style={{ color: 'var(--ink-2)' }}>
        · SPREAD 04 · LEKTION · <span style={{ color: 'var(--ink)' }}>KVA</span>
      </span>
    </div>
  )
}

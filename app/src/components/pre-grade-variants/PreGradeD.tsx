// Variant D — Deliberate negative space
//
// Refuse to fill the column. Treat the emptiness as the design move,
// not the bug. A single mono eyebrow, a hairline rule, the qid, and
// a tiny italic reminder of when the column will populate.
//
// The bet: a confident composition can leave 50% of the canvas blank
// IF the typography signals "this is intentional editorial restraint"
// rather than "this is unfinished." The page reads more like a
// reading room than a dashboard.

type DProps = {
  qid: string
}

export function PreGradeD({ qid }: DProps) {
  // Last 3 digits of qid for the running-head accent (e.g. "015").
  const tail = qid.split('-').pop() ?? ''

  return (
    <div
      style={{
        paddingTop: 'clamp(28px, 4vh, 48px)',
        maxWidth: '52ch',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        color: 'var(--muted)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        qid · {tail}
      </div>
      <hr
        style={{
          margin: 0,
          border: 0,
          borderTop: '1px solid var(--hairline)',
          width: '6em',
        }}
      />
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          lineHeight: 1.5,
          color: 'var(--muted)',
          fontStyle: 'italic',
          maxWidth: '24ch',
        }}
      >
        Förklaringen visas när du svarat.
      </p>
    </div>
  )
}

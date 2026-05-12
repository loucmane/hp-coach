// Top-of-screen progress strip for an in-progress drill — Phase A.7
// editorial chrome. The section code ("ORD ·") renders in `--accent`
// so the section-masthead language has a distinctive identity moment
// without needing a chip or background fill. The progress count and
// the ruler bar stay quiet so the headword below owns the composition.

import { Mono } from '@/components/primitives'

type Props = {
  current: number // 1-based
  total: number
  section: string
}

export function DrillProgress({ current, total, section }: Props) {
  const pct = Math.min(100, Math.round((current / total) * 100))
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '0 var(--pad-lg)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: 'var(--font-mono-track)',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 6,
          }}
        >
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{section}</span>
          <span style={{ color: 'var(--muted)' }}>·</span>
          <span style={{ color: 'var(--muted)' }}>Övning</span>
        </span>
        <Mono style={{ color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
          {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </Mono>
      </div>
      <div
        style={{
          height: 2,
          background: 'var(--hairline)',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'var(--accent)',
            transition: 'width 320ms cubic-bezier(0.2, 0.7, 0.3, 1)',
          }}
        />
      </div>
    </div>
  )
}

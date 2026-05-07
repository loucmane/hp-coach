// Top-of-screen progress strip for an in-progress drill.
// Mono "01 / 10" + a thin rule that fills proportionally. Uppercase
// hairline kicker keeps it visually quiet so the headword owns the
// composition.

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
        padding: '0 22px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Mono>{section} · Övning</Mono>
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
            background: 'var(--ink)',
            transition: 'width 320ms cubic-bezier(0.2, 0.7, 0.3, 1)',
          }}
        />
      </div>
    </div>
  )
}

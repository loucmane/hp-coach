// Payoff Variant B — "Klart." prototype payoff.
//
// Mirrors the original high-fidelity prototype's session-end screen
// from app/public/prototype/screens-mobile.jsx:688–719.
// Composition:
//   - Mono eyebrow `Pass slut · 28 min`
//   - 64px display headline `Klart.` (single word with period)
//   - CoachLine with VOICE[coach].sessionEnd
//   - Stats card (1px hairline border + radius) with `Detaljer` eyebrow
//     and 4 label/mono-value rows
//   - Spacer pushes the single primary CTA (`Stäng`) to the bottom

import { Btn, CoachLine, Eyebrow, Mono } from '@/components/primitives'
import { VOICE } from '@/lib/voice'
import { useCoachStore } from '@/stores/coachStore'

export function PayoffVariantB() {
  const coach = useCoachStore((s) => s.coach)
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 24px 24px',
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--radius)',
        height: '100%',
      }}
    >
      <Mono>Pass slut · 12 min</Mono>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          fontSize: 64,
          margin: '20px 0 0',
          color: 'var(--ink)',
        }}
      >
        Klart.
      </h1>
      <CoachLine coach={coach} as="body" style={{ margin: '14px 0 32px', maxWidth: '32ch' }}>
        {VOICE[coach].sessionEnd}
      </CoachLine>

      <div
        style={{
          padding: 'clamp(14px, 1.2vw + 10px, 22px)',
          border: '1px solid var(--hairline)',
          borderRadius: 'var(--radius)',
        }}
      >
        <Eyebrow>Detaljer</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {(
            [
              ['KVA · grunder', '12/15'],
              ['Tid på fel svar', '2:14 medel'],
              ['Nya fällor markerade', '1'],
              ['Repetition imorgon', '8 missar'],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                fontFamily: 'var(--font-display)',
                fontSize: 13.5,
                color: 'var(--ink-2)',
              }}
            >
              <span>{label}</span>
              <Mono>{value}</Mono>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 24 }} />

      <Btn full size="lg" onClick={() => {}}>
        Stäng
      </Btn>
    </div>
  )
}

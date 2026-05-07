// Daily Home — mobile, editorial layout.
// Ported from the design prototype `ScrHomeMobile` (screens-mobile.jsx).
// PRD § 4 Screen 4: single large "Fortsätt" CTA, today's plan as one line,
// "Avancerat" link bottom-right, no streak counter visible by default.

import { Btn, CoachLine, Mono } from '@/components/primitives'
import { VOICE, type CoachKey } from '@/lib/voice'

type HomeMobileProps = {
  coach?: CoachKey
  showStreak?: boolean
  onContinue?: () => void
  onAvancerat?: () => void
}

export function HomeMobile({
  coach = 'taktiker',
  showStreak = false,
  onContinue,
  onAvancerat,
}: HomeMobileProps) {
  const voice = VOICE[coach]
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: 88,
        background: 'var(--bg)',
        color: 'var(--ink)',
      }}
    >
      <div
        style={{
          padding: '20px 22px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <Mono>Onsdag · 6 maj</Mono>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--muted)',
              marginTop: 4,
            }}
          >
            172 dagar kvar · höstprov 26
          </div>
        </div>
        {showStreak && (
          <div
            style={{
              padding: '4px 8px',
              border: '1px solid var(--hairline)',
              borderRadius: 6,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--ink-2)',
            }}
          >
            14 dagar
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 22px',
        }}
      >
        <CoachLine coach={coach} as="headline" style={{ marginBottom: 20 }}>
          {voice.homeLine}
        </CoachLine>
        <Btn
          variant="primary"
          size="xl"
          full
          onClick={onContinue}
          style={{ height: 72, fontSize: 19 }}
        >
          {voice.cta}
        </Btn>
        <button
          onClick={onAvancerat}
          style={{
            alignSelf: 'flex-end',
            marginTop: 14,
            background: 'transparent',
            border: 'none',
            color: 'var(--muted)',
            fontSize: 12,
            fontFamily: 'inherit',
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          Avancerat
        </button>
      </div>
    </div>
  )
}

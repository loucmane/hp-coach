// Daily Home — mobile, editorial layout.
// Ported from the design prototype `ScrHomeMobile` (screens-mobile.jsx).
// PRD § 4 Screen 4: single large "Fortsätt" CTA, today's plan as one line,
// "Avancerat" link bottom-right, no streak counter visible by default.
//
// Design polish (frontend-design skill pass):
// - Renders inside <MobileFrame> so iOS chrome (status bar, home indicator,
//   bottom tabs) anchors the artboard the way the prototype does.
// - One orchestrated entrance: date → headline → CTA → link, staggered via
//   the `.reveal` keyframe in index.css. No scattered micro-interactions.
// - Tabular nums on the day-counter so digits don't shift between renders.

import { Btn, CoachLine, Mono } from '@/components/primitives'
import { MobileFrame } from '@/components/MobileFrame'
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
    <MobileFrame tabs activeTab="home">
      {/* paddingBottom reserves space for the absolute-positioned BottomTabs */}
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 88,
          color: 'var(--ink)',
        }}
      >
        <div
          className="reveal"
          style={{
            padding: '20px 22px 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            animationDelay: '0ms',
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
                fontVariantNumeric: 'tabular-nums',
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
                fontVariantNumeric: 'tabular-nums',
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
          <CoachLine
            coach={coach}
            as="headline"
            style={{ marginBottom: 20, animationDelay: '80ms' }}
            className="reveal"
          >
            {voice.homeLine}
          </CoachLine>
          <div className="reveal" style={{ animationDelay: '160ms' }}>
            <Btn
              variant="primary"
              size="xl"
              full
              onClick={onContinue}
              style={{ height: 72, fontSize: 19 }}
            >
              {voice.cta}
            </Btn>
          </div>
          <button
            onClick={onAvancerat}
            className="reveal"
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
              animationDelay: '240ms',
            }}
          >
            Avancerat
          </button>
        </div>
      </div>
    </MobileFrame>
  )
}

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
//
// Wiring:
// - Coach voice from useCoachStore (defaults to taktiker on first run)
// - Date + days-remaining from useExamStore + lib/dates
// - Tests can pin all of this via the optional props for deterministic
//   rendering; production callers pass nothing.

import { MobileFrame, type TabKey } from '@/components/MobileFrame'
import { Btn, CoachLine, Mono } from '@/components/primitives'
import { formatSwedishHeader } from '@/lib/dates'
import { type CoachKey, VOICE } from '@/lib/voice'
import { useCoachStore } from '@/stores/coachStore'
import { useDaysRemaining, useSitting } from '@/stores/examStore'

type HomeMobileProps = {
  /** Override coach (tests / preview); defaults to store value. */
  coach?: CoachKey
  showStreak?: boolean
  /** Override "now" so screenshots / tests render a stable date. */
  now?: Date
  onContinue?: () => void
  onAvancerat?: () => void
  onTabChange?: (id: TabKey) => void
}

export function HomeMobile({
  coach: coachProp,
  showStreak = false,
  now,
  onContinue,
  onAvancerat,
  onTabChange,
}: HomeMobileProps = {}) {
  const storeCoach = useCoachStore((s) => s.coach)
  const coach = coachProp ?? storeCoach
  const voice = VOICE[coach]

  const sitting = useSitting()
  const days = useDaysRemaining(now)
  const today = now ?? new Date()

  return (
    <MobileFrame tabs activeTab="home" onTabChange={onTabChange}>
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
            <Mono>{formatSwedishHeader(today)}</Mono>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--muted)',
                marginTop: 4,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {days} dagar kvar · {sitting.label.toLowerCase()}
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
            type="button"
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

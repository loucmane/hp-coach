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
  /** Force the streak badge on or off. Default is auto: show iff
   *  streakDays > 0. Pass `false` to hide even with an active streak,
   *  `true` to render even at 0 (mostly useful for tests / previews). */
  showStreak?: boolean
  /** Current consecutive-days streak. The badge shows this number;
   *  also the auto-show signal when `showStreak` is undefined. */
  streakDays?: number
  /** Override "now" so screenshots / tests render a stable date. */
  now?: Date
  /** Mistakes due for review right now. When > 0 we surface a small
   *  link next to "Avancerat" so the user can jump straight into the
   *  SRS queue from the home screen. Pass undefined or 0 to hide. */
  dueCount?: number
  onContinue?: () => void
  onAvancerat?: () => void
  onRepetition?: () => void
  onTabChange?: (id: TabKey) => void
}

export function HomeMobile({
  coach: coachProp,
  showStreak,
  streakDays,
  now,
  dueCount,
  onContinue,
  onAvancerat,
  onRepetition,
  onTabChange,
}: HomeMobileProps = {}) {
  const hasDue = (dueCount ?? 0) > 0
  // Auto-mode: show the badge once the user has built any streak;
  // explicit `showStreak` overrides in either direction.
  const renderStreak = showStreak ?? (streakDays !== undefined && streakDays > 0)
  const streakValue = streakDays ?? 0
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
          paddingBottom: 'var(--frame-tabbar)',
          color: 'var(--ink)',
        }}
      >
        <div
          className="reveal"
          style={{
            padding: 'clamp(16px, 1.2vw + 12px, 28px) var(--pad-lg) 0',
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
          {renderStreak && (
            <div
              data-testid="home-streak"
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
              {streakValue} {streakValue === 1 ? 'dag' : 'dagar'}
            </div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 var(--pad-lg)',
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
          {/* Trailing row: SRS queue link on the left (only when due > 0),
              Avancerat on the right. The row keeps a fixed height so the
              CTA's vertical position doesn't jump when the queue is empty. */}
          <div
            className="reveal"
            style={{
              marginTop: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              animationDelay: '240ms',
            }}
          >
            {hasDue ? (
              <button
                type="button"
                onClick={onRepetition}
                data-testid="home-repetition-link"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  color: 'var(--ink-2)',
                  fontSize: 12,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
              >
                <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{dueCount}</strong>{' '}
                {dueCount === 1 ? 'miss' : 'missar'} att repetera
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={onAvancerat}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
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
      </div>
    </MobileFrame>
  )
}

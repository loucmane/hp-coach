// Daily Home — prescriptive editorial layout.
//
// B3.2 replaces the masthead + "Fortsätt" CTA + plan marginalia with a
// daily-plan card that answers "what should I study now?". The card
// owns the screen; existing surfaces (drill, lesson, repetition,
// avancerat, progress) reach via the floating tab bar at phone and the
// desktop nav at reader/studio, not via a duplicated home-screen tile.
//
// The hero still has editorial chrome:
//   - Date kicker (mono) + streak badge (mono, opt-in)
//   - A compact greeting line ("God morgon.") above the plan card
//
// The plan card itself lives in <DailyPlanCard>; this screen passes
// the plan + callbacks through. A null plan renders a quiet skeleton —
// useDailyPlan resolves stats + due + framework hints, which takes a
// round-trip; flashing the old masthead in that window would be jarring.

import { DailyPlanCard } from '@/components/home/DailyPlanCard'
import { MobileFrame, type TabKey } from '@/components/MobileFrame'
import { Page } from '@/components/Page'
import { Mono } from '@/components/primitives'
import { useViewport } from '@/hooks/useViewport'
import { formatSwedishHeader } from '@/lib/dates'
import type { DailyPlan } from '@/lib/scheduler'
import type { CoachKey } from '@/lib/voice'
import { useCoachStore } from '@/stores/coachStore'
import { useDaysRemaining, useSitting } from '@/stores/examStore'

type HomeMobileProps = {
  /** The day's plan from useDailyPlan. Null while resolving. */
  plan?: DailyPlan | null
  /** True iff every plan item is complete. Drives the "Klart för idag" state. */
  allComplete?: boolean
  onRegenerate?: () => void
  /** Called when a plan item is tapped. Receives the item's href so
   *  the route can dispatch SPA navigation. */
  onPlanItemNavigate?: (href: string) => void
  /** Override coach (tests / preview); defaults to store value. */
  coach?: CoachKey
  /** Force the streak badge on or off (default auto: show iff streakDays > 0). */
  showStreak?: boolean
  /** Current consecutive-days streak. */
  streakDays?: number
  /** Override "now" so screenshots / tests render a stable date. */
  now?: Date
  onTabChange?: (id: TabKey) => void
  onAvancerat?: () => void
  /** Test-only override for viewport detection. */
  forceLayout?: 'phone' | 'reader' | 'studio'
}

const NOOP = () => {}

export function HomeMobile({
  plan = null,
  allComplete = false,
  onRegenerate = NOOP,
  onPlanItemNavigate,
  coach: coachProp,
  showStreak,
  streakDays,
  now,
  onTabChange,
  onAvancerat,
  forceLayout,
}: HomeMobileProps = {}) {
  const renderStreak = showStreak ?? (streakDays !== undefined && streakDays > 0)
  const streakValue = streakDays ?? 0
  // Coach voice isn't read in the prescriptive layout — the plan
  // items carry the prescription, not a voice line — but the prop is
  // kept for compatibility with existing call sites.
  const storeCoach = useCoachStore((s) => s.coach)
  void (coachProp ?? storeCoach)

  const sitting = useSitting()
  const days = useDaysRemaining(now)
  const today = now ?? new Date()

  const detectedViewport = useViewport()
  const viewport = forceLayout ?? detectedViewport
  const isPhone = viewport === 'phone'

  const statusHints = [renderStreak ? `streak ${streakValue} d` : null, '⌘k palett'].filter(
    Boolean,
  ) as string[]

  const greetingHeadline = hourGreeting(today)

  return (
    <MobileFrame
      tabs
      activeTab="home"
      onTabChange={onTabChange}
      streakDays={renderStreak ? streakValue : undefined}
      onAvancerat={onAvancerat}
      forceLayout={forceLayout}
    >
      <Page
        runningHead={['HP · Coach', 'Hem']}
        status={{
          mode: 'Hem',
          context: `${days} dagar till ${sitting.label.toLowerCase()}`,
          hints: statusHints,
        }}
      >
        <div
          style={{
            flex: isPhone ? undefined : 1,
            height: isPhone ? '100%' : undefined,
            display: 'flex',
            flexDirection: 'column',
            color: 'var(--ink)',
            paddingBottom: isPhone ? 'var(--frame-tabbar)' : 0,
          }}
        >
          <header
            className="reveal"
            data-testid="home-header"
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
            {renderStreak && <StreakBadge value={streakValue} />}
          </header>

          <div
            style={{
              flex: 1,
              padding: isPhone
                ? 'clamp(28px, 4vh, 56px) var(--pad-lg) 0'
                : 'clamp(48px, 6vh, 96px) clamp(48px, 5vw, 88px) 0',
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(24px, 3vh, 40px)',
            }}
          >
            <h1
              className="reveal"
              data-testid="home-greeting"
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: 'clamp(28px, 3vw + 18px, 48px)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                color: 'var(--ink)',
                animationDelay: '60ms',
              }}
            >
              {greetingHeadline}.
            </h1>

            {plan ? (
              <DailyPlanCard
                plan={plan}
                allComplete={allComplete}
                onRegenerate={onRegenerate}
                onNavigate={onPlanItemNavigate}
              />
            ) : (
              <PlanSkeleton />
            )}
          </div>
        </div>
      </Page>
    </MobileFrame>
  )
}

function StreakBadge({ value }: { value: number }) {
  return (
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
      {value} {value === 1 ? 'dag' : 'dagar'}
    </div>
  )
}

function PlanSkeleton() {
  return (
    <div
      data-testid="daily-plan-skeleton"
      style={{
        maxWidth: '68ch',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--muted)',
        letterSpacing: 'var(--font-mono-track)',
        textTransform: 'uppercase',
      }}
    >
      Laddar dagens plan …
    </div>
  )
}

function hourGreeting(d: Date): string {
  const h = d.getHours()
  if (h < 5) return 'God natt'
  if (h < 10) return 'God morgon'
  if (h < 14) return 'God dag'
  if (h < 18) return 'God eftermiddag'
  if (h < 22) return 'God kväll'
  return 'God natt'
}

// Daily Home — M3 "Boksidan" composition (M3H of plan
// hashed-twirling-zephyr; spec devbake/l12/M3.tsx L758-846).
//
// One 880px reading column built from the same margin-rail chassis as
// the drill:
//
//   date rail    greeting (italic display) + the stats row: Swedish-
//                comma prognosis ("1,4 / prognos av 2,0" + the honest
//                week-over-week delta when both weeks have signal),
//                streak, and today's estimated minutes
//   PÅBÖRJAD     the cross-device resume band (accent-soft, CTA)
//   IDAG         "Dagens plan" — numbered plan rows (cobalt serif
//                ordinal, section tag, headline, rationale, minutes)
//   MÖNSTER      "Dina fällor just nu" — flat trap rows
//
// The plan card, traps and resume band each render their own rail
// section (DailyPlanCard / TopTrapsCard / ResumptionPanel). The plan
// is prescriptive and completion stays signal-derived — no manual
// "mark complete", no regenerate affordance.

import type { TopTrap } from '@/api/hooks/useTopTraps'
import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { DailyPlanCard } from '@/components/home/DailyPlanCard'
import { ResumptionPanel } from '@/components/home/ResumptionPanel'
import { TopTrapsCard } from '@/components/home/TopTrapsCard'
import { MobileFrame, type TabKey } from '@/components/MobileFrame'
import { Page } from '@/components/Page'
import { useViewport } from '@/hooks/useViewport'
import { formatSwedishHeader } from '@/lib/dates'
import type { DiagnosticMemory } from '@/lib/diagnosticMemory'
import type { DailyPlan } from '@/lib/scheduler'
import { formatDeltaSv, formatScoreSv, type ProjectedTotal } from '@/lib/scoring'
import type { CoachKey } from '@/lib/voice'
import { useCoachStore } from '@/stores/coachStore'
import { useDaysRemaining, useSitting } from '@/stores/examStore'

type HomeMobileProps = {
  /** The day's plan from useDailyPlan. Null while resolving. */
  plan?: DailyPlan | null
  /** True iff every plan item is complete. Drives the "Klart för idag" state. */
  allComplete?: boolean
  /** Optional per-half + total projection — the stats row's prognosis.
   *  Null/undefined hides the stat (cold-start, loading). Route owns
   *  the data wire so HomeMobile stays pure. */
  projected?: ProjectedTotal | null
  /** M3H — honest week-over-week projected delta from
   *  computeProjectedDelta. Null/undefined renders NO delta line (the
   *  weeks aren't comparable); the route owns the computation. */
  projectedDelta?: number | null
  /** Accepted for caller compatibility; the in-Home affordance moved
   *  to /diagnostik. */
  diagnosticMemory?: DiagnosticMemory | null
  /** Accepted for caller compatibility; the kicker is currently parked. */
  daysAway?: number | null
  /** Top recurring trap patterns from the active mistake queue.
   *  Empty array hides the section — silent on signal-less days. */
  topTraps?: TopTrap[]
  /** Called when a plan item is tapped. Receives the item's href so
   *  the route can dispatch SPA navigation. */
  onPlanItemNavigate?: (href: string) => void
  /** Override coach (tests / preview); defaults to store value. */
  coach?: CoachKey
  /** Force the streak stat on or off (default auto: show iff streakDays > 0). */
  showStreak?: boolean
  /** Current consecutive-days streak. */
  streakDays?: number
  /** Override "now" so screenshots / tests render a stable date. */
  now?: Date
  /** Clerk user's first name — "God morgon, Loucmane." Null leaves the
   *  bare greeting (cold-start, e2e, signed-out preview). */
  firstName?: string | null
  onTabChange?: (id: TabKey) => void
  onAvancerat?: () => void
  /** Test-only override for viewport detection. */
  forceLayout?: 'phone' | 'reader' | 'studio'
}

export function HomeMobile({
  plan = null,
  allComplete = false,
  projected = null,
  projectedDelta = null,
  diagnosticMemory: _diagnosticMemory = null,
  daysAway: _daysAway = null,
  topTraps = [],
  onPlanItemNavigate,
  coach: coachProp,
  firstName,
  showStreak,
  streakDays,
  now,
  onTabChange,
  onAvancerat,
  forceLayout,
}: HomeMobileProps = {}) {
  const renderStreak = showStreak ?? (streakDays !== undefined && streakDays > 0)
  const streakValue = streakDays ?? 0
  // Coach voice stays parked for a future home deployment; keep the
  // store read warm without rendering it.
  const storeCoach = useCoachStore((s) => s.coach)
  void (coachProp ?? storeCoach)

  const sitting = useSitting()
  const days = useDaysRemaining(now)
  const today = now ?? new Date()

  const detectedViewport = useViewport()
  const viewport = forceLayout ?? detectedViewport
  const isPhone = viewport === 'phone'

  const statusHints = ['⌘k palett']
  const greetingHeadline = hourGreeting(today)
  const hasAnySignal = projected != null && (projected.verbal != null || projected.quant != null)

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
          className="hpc-m3-frame"
          style={{
            color: 'var(--ink)',
            paddingBottom: isPhone ? 'var(--frame-tabbar)' : undefined,
          }}
        >
          {/* Greeting section — the date owns the margin rail (M3.tsx
           *  L763-765), the italic display greeting + stats row own the
           *  content column. */}
          <DrillRailSection
            meta={
              <>
                <strong>{formatSwedishHeader(today)}</strong>
                {days} dagar · {sitting.label.toLowerCase()}
              </>
            }
            delay={0}
          >
            <h1 className="hpc-m3-display" id="home-greeting" style={{ fontSize: undefined }}>
              <span data-testid="home-greeting">
                {firstName ? `${greetingHeadline}, ${firstName}.` : `${greetingHeadline}.`}
              </span>
            </h1>
            <div className="hpc-m3-stats">
              {hasAnySignal && projected && (
                <div data-testid="home-score-line">
                  <div className="hpc-m3-stat-n">{formatScoreSv(projected.total)}</div>
                  <div className="hpc-m3-stat-l">prognos av 2,0</div>
                  {projectedDelta != null && (
                    <div className="hpc-m3-stat-d">
                      {formatDeltaSv(projectedDelta)} sedan förra veckan
                    </div>
                  )}
                </div>
              )}
              {renderStreak && (
                <div>
                  <div className="hpc-m3-stat-n">{streakValue}</div>
                  <div className="hpc-m3-stat-l">dagar i rad</div>
                </div>
              )}
              {plan && (
                <div>
                  <div className="hpc-m3-stat-n">{plan.estimatedMinutes}</div>
                  <div className="hpc-m3-stat-l">min idag</div>
                </div>
              )}
            </div>
          </DrillRailSection>

          {/* Cross-device resume band — renders nothing when idle. One
           *  surface for every viewport (the phone line + desktop panel
           *  merged into M3's accent band). */}
          <ResumptionPanel now={today} />

          {plan ? (
            <DailyPlanCard plan={plan} allComplete={allComplete} onNavigate={onPlanItemNavigate} />
          ) : (
            <PlanSkeleton />
          )}

          {topTraps.length > 0 && <TopTrapsCard traps={topTraps} />}
        </div>
      </Page>
    </MobileFrame>
  )
}

function PlanSkeleton() {
  return (
    <div
      data-testid="daily-plan-skeleton"
      style={{
        marginTop: 32,
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

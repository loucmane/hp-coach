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

import { useState } from 'react'

import type { MockResultRow } from '@/api/hooks/useMockResults'
import type { SessionHistoryRow } from '@/api/hooks/useSessions'
import type { TopTrap } from '@/api/hooks/useTopTraps'
import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { DailyPlanCard } from '@/components/home/DailyPlanCard'
import { Kallelse } from '@/components/home/Kallelse'
import { ProvpassStatusLine } from '@/components/home/ProvpassStatusLine'
import { RecentPassesCard } from '@/components/home/RecentPassesCard'
import { ResumptionPanel } from '@/components/home/ResumptionPanel'
import { TopTrapsCard } from '@/components/home/TopTrapsCard'
import { MobileFrame, type TabKey } from '@/components/MobileFrame'
import { ConfirmSheet } from '@/components/mock/ConfirmSheet'
import { Page } from '@/components/Page'
import { useViewport } from '@/hooks/useViewport'
import { formatSwedishHeader } from '@/lib/dates'
import type { DiagnosticMemory } from '@/lib/diagnosticMemory'
import type { MockPrescription, PlanItemWithMock } from '@/lib/mockContract'
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
  /** Recent completed passes for the "Senaste passen" glance. Empty
   *  array hides the section (first-day user sees no empty shell). */
  recentPasses?: SessionHistoryRow[]
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
  /** CONTRACT (see @/lib/mockContract) — Provpass due/countdown state for
   *  ProvpassStatusLine. Optional: when omitted the status line renders
   *  nothing, so callers that don't have prescribeMock wired yet (every
   *  caller today — see mockContract.ts) simply don't pass it. */
  mockPrescription?: MockPrescription | null
  /** CONTRACT — most recent Provpass result, for the status line's
   *  "senast X N/M" countdown copy. */
  lastMockResult?: MockResultRow | null
}

export function HomeMobile({
  plan = null,
  allComplete = false,
  projected = null,
  projectedDelta = null,
  diagnosticMemory: _diagnosticMemory = null,
  daysAway: _daysAway = null,
  topTraps = [],
  recentPasses = [],
  onPlanItemNavigate,
  coach: coachProp,
  firstName,
  showStreak,
  streakDays,
  now,
  onTabChange,
  onAvancerat,
  forceLayout,
  mockPrescription = null,
  lastMockResult = null,
}: HomeMobileProps = {}) {
  // The confirm sheet is a Home-owned modal, not a route-owned one — it
  // has no URL state of its own (unlike /prov's phase machine) and only
  // ever opens from a Home-local affordance (Kallelse's Starta, or the
  // status line). Kept here rather than lifted into routes/index.tsx so
  // Kallelse/ProvpassStatusLine stay simple prop-driven components and
  // HomeMobile (which already owns viewport/layout state) is the natural
  // owner of "is the pre-start sheet open".
  const [confirmOpen, setConfirmOpen] = useState(false)
  // The real PlanItem['kind'] union (@/lib/scheduler) doesn't include
  // 'mock' yet — CONTRACT-widen the search to PlanItemWithMock (see
  // @/lib/mockContract) rather than asserting a type predicate against
  // the real PlanItem, which TS correctly rejects as unsound.
  const mockItem = (plan?.items as PlanItemWithMock[] | undefined)?.find(
    (item) => item.kind === 'mock',
  )
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

          {/* Kallelse — the colored Provpass summons, ABOVE Dagens plan on
           *  a provpass-dag (V4A FINAL). Renders null when there's no
           *  `kind: 'mock'` item in today's plan. */}
          {mockItem && <Kallelse item={mockItem} onStart={() => setConfirmOpen(true)} />}

          {plan ? (
            <DailyPlanCard plan={plan} allComplete={allComplete} onNavigate={onPlanItemNavigate} />
          ) : (
            <PlanSkeleton />
          )}

          {topTraps.length > 0 && <TopTrapsCard traps={topTraps} />}

          {/* Reflection, last — a glance at recent completed passes, below
           *  the plan/traps so it never competes with the next action.
           *  The passive PROVPASS readout sits just above it — see
           *  ProvpassStatusLine's own suppression logic for why it's
           *  silent on a day where the Kallelse is already showing.
           *
           *  TODO(PR-3): `mockPrescription` is undefined until the real
           *  @/lib/scheduler.prescribeMock lands (see @/lib/mockContract)
           *  — until then no caller passes it, so this renders nothing.
           *  ProvpassStatusLine itself is complete/tested; only the real
           *  scheduling data is out of scope here. */}
          {mockPrescription && (
            <ProvpassStatusLine
              prescription={mockPrescription}
              lastResult={lastMockResult}
              showingKallelse={mockItem != null}
            />
          )}
          <RecentPassesCard passes={recentPasses} />
        </div>
      </Page>
      {confirmOpen && mockItem && (
        <ConfirmSheet
          half={mockItem.headline.toLowerCase().includes('kvant') ? 'kvant' : 'verbal'}
          onConfirm={() => {
            setConfirmOpen(false)
            onPlanItemNavigate?.(mockItem.href)
          }}
          onDismiss={() => setConfirmOpen(false)}
        />
      )}
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

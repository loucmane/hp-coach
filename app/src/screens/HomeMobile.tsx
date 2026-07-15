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

import { type ReactNode, useEffect, useState } from 'react'

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
import { InkSlot } from '@/components/motion/InkDry'
import { Page } from '@/components/Page'
import { useViewport } from '@/hooks/useViewport'
import { formatSwedishHeader } from '@/lib/dates'
import type { DiagnosticMemory } from '@/lib/diagnosticMemory'
import { logMockEvent } from '@/lib/mockEvents'
import type { DailyPlan, MockPrescription } from '@/lib/scheduler'
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
  /** Top recurring trap patterns from the active mistake queue. Empty
   *  array renders TopTrapsCard's quiet one-line invitation instead of
   *  the boxed trap list — the section always occupies its rail slot
   *  (task #78: no orphaned void on signal-less days). */
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
  /** Öva's spaced-repetition queue size — the one accent numeral on the
   *  phone tab bar. Optional; omitted → no numeral. */
  ovaDueCount?: number
  /** LIVE due-mistake count (useDueMistakes) — the "redo nu" slice, NOT
   *  the whole-queue `ovaDueCount`. Forwarded to DailyPlanCard so the
   *  repetition row's count/copy/minutes are recomputed live rather than
   *  frozen at plan-generation time. Optional; omitted → the row keeps the
   *  cached plan's strings. */
  dueMistakeCount?: number
  /** LIVE pile count (usePileMistakes) — today's whole "att repetera" list.
   *  Forwarded to DailyPlanCard as the context total M in the repetition
   *  row's "N av M missar" (N = the playable due count). Optional. */
  pileMistakeCount?: number
  /** Test-only override for viewport detection. */
  forceLayout?: 'phone' | 'reader' | 'studio'
  /** Provpass due/countdown state for ProvpassStatusLine (from
   *  `useDailyPlan()`'s `prescribeMock` call). Optional: when omitted
   *  the status line renders nothing. */
  mockPrescription?: MockPrescription | null
  /** Most recent Provpass result, for the status line's "senast X N/M"
   *  countdown copy. */
  lastMockResult?: MockResultRow | null
  /** The account/identity medallion (AccountMenu), anchored top-right of
   *  the reading column. Home is the ONLY surface that mounts it — the
   *  route (index.tsx) owns the Clerk-connected node and passes it here so
   *  HomeMobile stays presentational and its tests need no Clerk provider.
   *  Omitted → the corner is empty (tests, signed-out preview). */
  accountMenu?: ReactNode
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
  ovaDueCount,
  dueMistakeCount,
  pileMistakeCount,
  forceLayout,
  mockPrescription = null,
  lastMockResult = null,
  accountMenu,
}: HomeMobileProps = {}) {
  // The confirm sheet is a Home-owned modal, not a route-owned one — it
  // has no URL state of its own (unlike /prov's phase machine) and only
  // ever opens from a Home-local affordance (Kallelse's Starta, or the
  // status line). Kept here rather than lifted into routes/index.tsx so
  // Kallelse/ProvpassStatusLine stay simple prop-driven components and
  // HomeMobile (which already owns viewport/layout state) is the natural
  // owner of "is the pre-start sheet open".
  const [confirmOpen, setConfirmOpen] = useState(false)
  // Only an UNCOMPLETED mock item summons — once the pass is done for the
  // day (isItemComplete flips it via mockHistory), the Kallelse must not
  // keep shouting STARTA. ProvpassStatusLine's suppression keys off the
  // same value, so a completed pass also un-suppresses the passive line.
  const mockItem = plan?.items.find((item) => item.kind === 'mock' && !item.completed)

  // window_slid — fired once per day when the mock item is due AND was
  // ALREADY overdue more than one cadence interval ago (silently slid past
  // being due on an earlier day without a completed mock). HomeMobile owns
  // this (rather than Kallelse, which owns provpassdag_shown) because the
  // slide check needs `daysSinceLast`/`interval` from MockPrescription —
  // Kallelse only ever receives the plain PlanItem, not the prescription.
  useEffect(() => {
    if (!mockPrescription) return
    logSlidOncePerDay(mockPrescription)
  }, [mockPrescription])
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
      ovaDueCount={ovaDueCount}
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
            position: 'relative',
            paddingBottom: isPhone ? 'var(--frame-tabbar)' : undefined,
          }}
        >
          {/* Account medallion — top-right of the reading column (the frame
           *  is the column: max-width, centered), so the desktop card's
           *  right hairline lands on the column's right text margin and the
           *  phone medallion sits in the masthead corner. Home only. */}
          {accountMenu ? (
            <div
              data-testid="home-account-slot"
              style={{
                position: 'absolute',
                top: isPhone ? 34 : 50,
                right: isPhone ? 18 : 24,
                zIndex: 5,
              }}
            >
              {accountMenu}
            </div>
          ) : null}
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
                    // Color by sign, not hard-coded green (same rule as the
                    // DrillResult pass-delta): a week-over-week drop reads red.
                    // A flat 0 delta stays green (≥0). The CSS class keeps the
                    // layout; inline color overrides its hard-coded --ok.
                    <div
                      className="hpc-m3-stat-d"
                      style={{ color: projectedDelta >= 0 ? 'var(--ok)' : 'var(--bad)' }}
                    >
                      {formatDeltaSv(projectedDelta)} sedan förra veckan
                    </div>
                  )}
                </div>
              )}
              {/* Drying ink: the label is real ink from frame one (the
               *  plan ALWAYS resolves to a minute estimate); only the
               *  numeral waits as a pre-impression and dries in. */}
              <div>
                <div className="hpc-m3-stat-n">
                  <InkSlot ready={plan != null} w={2}>
                    {plan?.estimatedMinutes}
                  </InkSlot>
                </div>
                <div className="hpc-m3-stat-l">min idag</div>
              </div>
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

          {/* Drying ink (A2): DailyPlanCard owns its own pre-impression
           *  state for a null plan — same chrome, ghost rows — so the
           *  skeleton→card handoff never remounts the surface and the
           *  ark-kort layoutId chain (Klart folds home) is unbroken. */}
          <DailyPlanCard
            plan={plan}
            allComplete={allComplete}
            onNavigate={onPlanItemNavigate}
            dueMistakeCount={dueMistakeCount}
            pileMistakeCount={pileMistakeCount}
          />

          <TopTrapsCard traps={topTraps} />

          {/* Reflection, last — a glance at recent completed passes, below
           *  the plan/traps so it never competes with the next action.
           *  The passive PROVPASS readout sits just above it — see
           *  ProvpassStatusLine's own suppression logic for why it's
           *  silent on a day where the Kallelse is already showing.
           *  `mockPrescription` comes from `useDailyPlan()` (HomeRoute) —
           *  omitted only by callers that don't wire it (dev fixtures,
           *  tests), in which case the line renders nothing. */}
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

function hourGreeting(d: Date): string {
  const h = d.getHours()
  if (h < 5) return 'God natt'
  if (h < 10) return 'God morgon'
  if (h < 14) return 'God dag'
  if (h < 18) return 'God eftermiddag'
  if (h < 22) return 'God kväll'
  return 'God natt'
}

const SLID_KEY = 'hpc-window-slid-shown-date'

/** Fire window_slid at most once per calendar day — same date-string-
 *  comparison idiom as Kallelse's logShownOncePerDay (SHOWN_KEY),
 *  scoped under its own storage key. Only fires when the prescription is
 *  due AND was already overdue more than one cadence interval ago —
 *  `daysSinceLast == null` is the baseline "never mocked" case, not a
 *  slide, and is explicitly excluded. */
function logSlidOncePerDay(prescription: MockPrescription): void {
  if (!prescription.due) return
  if (prescription.daysSinceLast == null) return
  const slidDays = prescription.daysSinceLast - prescription.interval
  if (slidDays <= 0) return

  if (typeof window === 'undefined') return
  try {
    const today = new Date().toISOString().slice(0, 10)
    const last = window.localStorage.getItem(SLID_KEY)
    if (last === today) return
    window.localStorage.setItem(SLID_KEY, today)
    logMockEvent('window_slid', { slidDays })
  } catch {
    // storage unavailable — err on NOT double-logging, same as Kallelse.
  }
}

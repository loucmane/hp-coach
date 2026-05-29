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

import type { TopTrap } from '@/api/hooks/useTopTraps'
import { DailyPlanCard } from '@/components/home/DailyPlanCard'
import { PhoneResumptionLine } from '@/components/home/PhoneResumptionLine'
import { ResumptionPanel } from '@/components/home/ResumptionPanel'
import { TopTrapsCard } from '@/components/home/TopTrapsCard'
import { MobileFrame, type TabKey } from '@/components/MobileFrame'
import { Page } from '@/components/Page'
import { Mono } from '@/components/primitives'
import { Display } from '@/components/Typography'
import { useViewport } from '@/hooks/useViewport'
import { formatSwedishHeader } from '@/lib/dates'
import type { DiagnosticMemory } from '@/lib/diagnosticMemory'
import type { DailyPlan } from '@/lib/scheduler'
import { formatScore, type ProjectedTotal } from '@/lib/scoring'
import type { CoachKey } from '@/lib/voice'
import { useCoachStore } from '@/stores/coachStore'
import { useDaysRemaining, useSitting } from '@/stores/examStore'

type HomeMobileProps = {
  /** The day's plan from useDailyPlan. Null while resolving. */
  plan?: DailyPlan | null
  /** True iff every plan item is complete. Drives the "Klart för idag" state. */
  allComplete?: boolean
  /** Optional per-half + total projection rendered as a mono kicker
   *  above the plan card. Null/undefined hides the line (cold-start,
   *  loading). Route owns the data wire so HomeMobile stays pure. */
  projected?: ProjectedTotal | null
  /** Optional "last diagnostic" event. When set, renders a one-line
   *  kicker under the date header — `DIAGNOSTIK · 2 d sedan · baseline
   *  0.62 · rebaseline →`. Closes B4: the diagnostic seeds the score
   *  model, but without this line the user has no way to feel it. */
  diagnosticMemory?: DiagnosticMemory | null
  /** Days since the user's previous Home visit, measured at mount on
   *  the route side via visitMemory.ts. When ≥ 2 the header renders a
   *  mono "tillbaka · X dagar sedan" kicker so the app acknowledges
   *  the gap. 0 / 1 / null keep the kicker hidden — same-day re-
   *  visits would be noise. */
  daysAway?: number | null
  /** Top recurring trap patterns from the active mistake queue.
   *  Rendered between the score line and the plan card. Empty array
   *  hides the section — silent on signal-less days. */
  topTraps?: TopTrap[]
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
  /** Clerk user's first name. When present, the greeting becomes
   *  "God morgon, Loucmane." instead of the anonymous "God morgon.".
   *  The route reads it from `useUser()` and passes it through; null
   *  / missing leaves the bare greeting (cold-start, e2e, signed-out
   *  preview). */
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
  // Coach voice now lands on the drill funnel (PedagogyPanel,
  // DrillResult). Home keeps the prescriptive DailyPlanCard as the
  // primary surface — rendering VOICE[coach].homeLine here would
  // duplicate the plan card's eyebrow. The prop + store read stays
  // warm for the next-phase home voice deployment (visitMemory
  // kicker, skip-day nudge — see synthesis Tier 2).
  const storeCoach = useCoachStore((s) => s.coach)
  void (coachProp ?? storeCoach)

  const sitting = useSitting()
  const days = useDaysRemaining(now)
  const today = now ?? new Date()

  const detectedViewport = useViewport()
  const viewport = forceLayout ?? detectedViewport
  const isPhone = viewport === 'phone'

  // Streak is rendered as the chrome badge top-right (StreakBadge) and
  // also shows on /progress; the status-line "streak 1 d" was a third
  // copy of the same fact. Audit recommended consolidating — drop the
  // status-line streak; badge + /progress remain.
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
          style={{
            flex: isPhone ? undefined : 1,
            // Phone: minHeight (not height) so when content runs
            // taller than the artboard — three traps + four plan
            // items — the wrapper can grow past 100% and let
            // MobileFrame's overflow-y: auto scroll the last item
            // into reach. height: 100% capped the inner box and
            // clipped the final card under the floating tab bar.
            minHeight: isPhone ? '100%' : undefined,
            display: 'flex',
            flexDirection: 'column',
            color: 'var(--ink)',
            paddingBottom: isPhone ? 'var(--frame-tabbar)' : 0,
          }}
        >
          {/* Header band — one mono kicker. The eight-line metadata
           *  stack (examPhase, daysAway, diagnosticMemory, streak
           *  pill, ProgressSigil) was deleted in the home-bakeoff B
           *  pick: the morning compass needs ONE clear next action,
           *  not seven competing status lines. The daysAway /
           *  diagnostic-memory affordances move to /diagnostik;
           *  streak surfaces are deferred. */}
          <header
            className="reveal"
            data-testid="home-header"
            style={{
              padding: 'clamp(16px, 1.2vw + 12px, 28px) var(--pad-lg) 0',
              animationDelay: '0ms',
            }}
          >
            <Mono>
              {formatSwedishHeader(today)} · {days} dagar · {sitting.label.toLowerCase()}
            </Mono>
          </header>

          {/* Studio gets a 58/42 grid; the right column holds the
           *  ResumptionPanel when there's a paused session, air
           *  otherwise. Phone keeps a single flex column — the right
           *  rail composition doesn't survive narrow viewports. */}
          <div
            style={{
              flex: 1,
              padding: isPhone
                ? 'clamp(28px, 4vh, 56px) var(--pad-lg) 0'
                : 'clamp(48px, 6vh, 96px) clamp(48px, 5vw, 88px) 0',
              display: isPhone ? 'flex' : 'grid',
              flexDirection: isPhone ? 'column' : undefined,
              gridTemplateColumns: isPhone ? undefined : '58fr 42fr',
              columnGap: isPhone ? undefined : 'clamp(48px, 5vw, 88px)',
              rowGap: isPhone ? undefined : 0,
              gap: isPhone ? 'clamp(24px, 3vh, 40px)' : undefined,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(24px, 3vh, 40px)',
              }}
            >
              <Display
                level={2}
                as="h1"
                className="reveal"
                style={{ animationDelay: '60ms', maxWidth: '24ch', lineHeight: 1.02 }}
                id="home-greeting"
              >
                <span data-testid="home-greeting">
                  {firstName ? (
                    <>
                      {greetingHeadline},
                      <br />
                      {firstName}.
                    </>
                  ) : (
                    `${greetingHeadline}.`
                  )}
                </span>
              </Display>

              {hasAnySignal && projected && (
                <div
                  data-testid="home-score-line"
                  style={{
                    marginTop: 'clamp(-12px, -1vh, -4px)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    letterSpacing: 'var(--font-mono-track)',
                    color: 'var(--ink-2)',
                    fontVariantNumeric: 'tabular-nums',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'clamp(8px, 1vw, 14px)',
                    alignItems: 'baseline',
                  }}
                >
                  <span style={{ color: 'var(--ink)' }}>{formatScore(projected.total)}</span>
                  <span style={{ color: 'var(--muted)' }}>/ 2.0</span>
                  <span style={{ color: 'var(--muted)' }}>·</span>
                  <span>
                    verbal{' '}
                    <span style={{ color: 'var(--ink)' }}>{formatScore(projected.verbal)}</span>
                  </span>
                  <span style={{ color: 'var(--muted)' }}>·</span>
                  <span>
                    kvant{' '}
                    <span style={{ color: 'var(--ink)' }}>{formatScore(projected.quant)}</span>
                  </span>
                </div>
              )}

              {/* Phone resumption line (bake-off variant C). Sits between
               *  the greeting and the daily plan — warm and tappable, but
               *  subordinate to today's prescription. Studio gets the
               *  right-column ResumptionPanel instead (below). Renders
               *  nothing when there's nothing to resume. */}
              {isPhone && <PhoneResumptionLine now={today} />}

              {plan ? (
                <DailyPlanCard
                  plan={plan}
                  allComplete={allComplete}
                  onNavigate={onPlanItemNavigate}
                />
              ) : (
                <PlanSkeleton />
              )}

              {topTraps.length > 0 && (
                <>
                  {/* 240px ink-2 hairline — quiet divider above the
                   *  demoted trap strip. Traps are diagnostic, not
                   *  prescriptive; they belong below the focal plan. */}
                  <div
                    style={{
                      width: 240,
                      height: 1,
                      background: 'var(--ink-2)',
                      opacity: 0.5,
                    }}
                  />
                  <TopTrapsCard traps={topTraps} />
                </>
              )}
            </div>
            {!isPhone && <ResumptionPanel now={today} />}
          </div>
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

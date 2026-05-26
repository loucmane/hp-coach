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
import { ProgressSigil } from '@/components/home/ProgressSigil'
import { TopTrapsCard } from '@/components/home/TopTrapsCard'
import { MobileFrame, type TabKey } from '@/components/MobileFrame'
import { Page } from '@/components/Page'
import { Mono } from '@/components/primitives'
import { useViewport } from '@/hooks/useViewport'
import { examPhase, formatSwedishHeader } from '@/lib/dates'
import { type DiagnosticMemory, formatTimeSince } from '@/lib/diagnosticMemory'
import type { DailyPlan } from '@/lib/scheduler'
import { formatScore, formatSwedishDateShort, type ProjectedTotal } from '@/lib/scoring'
import type { CoachKey } from '@/lib/voice'
import { useCoachStore } from '@/stores/coachStore'
import { useDaysRemaining, useSitting } from '@/stores/examStore'

type HomeMobileProps = {
  /** The day's plan from useDailyPlan. Null while resolving. */
  plan?: DailyPlan | null
  /** True iff every plan item is complete. Drives the "Klart för idag" state. */
  allComplete?: boolean
  onRegenerate?: () => void
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

const NOOP = () => {}

export function HomeMobile({
  plan = null,
  allComplete = false,
  onRegenerate = NOOP,
  projected = null,
  diagnosticMemory = null,
  daysAway = null,
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
              {/* Urgency tier: names the *phase* the user is in, not
               *  just the number. Turns the day count from wallpaper
               *  into a clock — same band of phases that Strava
               *  training-plan and Apple Fitness use to frame
               *  long-arc goals. Render only for future dates; past
               *  dates suppress (the dogfood user's exam has already
               *  happened or sitting hasn't been picked). */}
              {days >= 0 && (
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    letterSpacing: 'var(--font-mono-track)',
                    color: 'var(--muted)',
                    marginTop: 2,
                    textTransform: 'uppercase',
                  }}
                >
                  {examPhase(days).label}
                </div>
              )}
              {daysAway != null && daysAway >= 2 && (
                <div
                  data-testid="home-visit-memory"
                  style={{
                    marginTop: 6,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    letterSpacing: 'var(--font-mono-track)',
                    textTransform: 'uppercase',
                    color: 'var(--ink-2)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  Tillbaka <span style={{ color: 'var(--muted)' }}>·</span> {daysAway} dagar sedan
                </div>
              )}
              {diagnosticMemory && (
                <a
                  href="/diagnostik"
                  data-testid="home-diagnostic-memory"
                  style={{
                    display: 'inline-flex',
                    gap: 6,
                    alignItems: 'baseline',
                    marginTop: 6,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    letterSpacing: 'var(--font-mono-track)',
                    textTransform: 'uppercase',
                    color: 'var(--ink-2)',
                    fontVariantNumeric: 'tabular-nums',
                    textDecoration: 'none',
                  }}
                >
                  <span>Diagnostik</span>
                  <span style={{ color: 'var(--muted)' }}>·</span>
                  <span>{formatTimeSince(diagnosticMemory.lastAt, today)}</span>
                  {diagnosticMemory.baselineScore != null && (
                    <>
                      <span style={{ color: 'var(--muted)' }}>·</span>
                      <span>baseline {formatScore(diagnosticMemory.baselineScore)}</span>
                    </>
                  )}
                  <span style={{ color: 'var(--accent)', marginLeft: 4 }}>rebaseline →</span>
                </a>
              )}
            </div>
            {renderStreak && <StreakBadge value={streakValue} />}
          </header>

          {/* Progress Sigil — focal "today's progress" element. Sits
           *  between the header band and the greeting as a typographic
           *  underline that fills as plan items complete. The single
           *  iconic loop element per the loop-bakeoff winner pick.
           *  Aligned with the header band's horizontal padding so the
           *  rule reads as part of the same chrome. */}
          <div
            style={{
              padding: `0 var(--pad-lg)`,
            }}
          >
            <ProgressSigil plan={plan} todayLabel={formatSwedishDateShort(today)} />
          </div>

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
              {firstName ? `${greetingHeadline}, ${firstName}.` : `${greetingHeadline}.`}
            </h1>

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
                <span style={{ color: 'var(--ink)' }}>
                  just nu · {formatScore(projected.total)} / 2.0
                </span>
                <span style={{ color: 'var(--muted)' }}>·</span>
                <span>verbal {formatScore(projected.verbal)}</span>
                <span style={{ color: 'var(--muted)' }}>·</span>
                <span>kvant {formatScore(projected.quant)}</span>
              </div>
            )}

            {topTraps.length > 0 && <TopTrapsCard traps={topTraps} />}

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

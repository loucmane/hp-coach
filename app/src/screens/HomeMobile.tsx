// Daily Home — single hero (phone) + 3-tile dashboard (reader/studio).
//
// Ported from the design prototype `ScrHomeMobile` (screens-mobile.jsx).
// PRD § 4 Screen 4: single large "Fortsätt" CTA, today's plan as one
// line, "Avancerat" link bottom-right, no streak counter visible by
// default.
//
// Phase A.5 — wide-canvas treatment. Phone keeps the original
// single-hero composition byte-for-byte. Reader / Studio renders a
// three-tile dashboard so the user can see the hero CTA *and*
// today's plan stats *and* the streak/recent-activity context at
// once, without scrolling. The hero CTA stays the visual anchor; the
// other two tiles are deliberately quieter (no competing CTAs).
//
// Design polish:
// - Renders inside <MobileFrame>. iOS chrome only at phone width;
//   bottom tabs always.
// - One orchestrated entrance: date → headline → CTA → link, staggered
//   via the `.reveal` keyframe in index.css.
// - Tabular nums on day-counter / streak so digits don't shift between
//   renders.
//
// Wiring:
// - Coach voice from useCoachStore (defaults to taktiker on first run)
// - Date + days-remaining from useExamStore + lib/dates
// - Tests can pin all of this via the optional props for deterministic
//   rendering; production callers pass nothing.

import { MobileFrame, type TabKey } from '@/components/MobileFrame'
import { Btn, CoachLine, Mono } from '@/components/primitives'
import { useViewport } from '@/hooks/useViewport'
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
  /** Test-only override for viewport detection. Production callers
   *  rely on the useViewport() hook. */
  forceLayout?: 'phone' | 'reader' | 'studio'
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
  forceLayout,
}: HomeMobileProps = {}) {
  const hasDue = (dueCount ?? 0) > 0
  const renderStreak = showStreak ?? (streakDays !== undefined && streakDays > 0)
  const streakValue = streakDays ?? 0
  const storeCoach = useCoachStore((s) => s.coach)
  const coach = coachProp ?? storeCoach
  const voice = VOICE[coach]

  const sitting = useSitting()
  const days = useDaysRemaining(now)
  const today = now ?? new Date()

  const detectedViewport = useViewport()
  const viewport = forceLayout ?? detectedViewport
  const isWide = viewport !== 'phone'

  return (
    <MobileFrame tabs activeTab="home" onTabChange={onTabChange}>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 'var(--frame-tabbar)',
          color: 'var(--ink)',
        }}
      >
        {isWide ? (
          <DashboardLayout
            today={today}
            days={days}
            sittingLabel={sitting.label}
            coach={coach}
            voice={voice}
            streakValue={streakValue}
            renderStreak={renderStreak}
            hasDue={hasDue}
            dueCount={dueCount}
            onContinue={onContinue}
            onAvancerat={onAvancerat}
            onRepetition={onRepetition}
          />
        ) : (
          <PhoneLayout
            today={today}
            days={days}
            sittingLabel={sitting.label}
            coach={coach}
            voice={voice}
            streakValue={streakValue}
            renderStreak={renderStreak}
            hasDue={hasDue}
            dueCount={dueCount}
            onContinue={onContinue}
            onAvancerat={onAvancerat}
            onRepetition={onRepetition}
          />
        )}
      </div>
    </MobileFrame>
  )
}

// ── Shared body props ─────────────────────────────────────────────

type BodyProps = {
  today: Date
  days: number
  sittingLabel: string
  coach: CoachKey
  voice: (typeof VOICE)[CoachKey]
  streakValue: number
  renderStreak: boolean
  hasDue: boolean
  dueCount: number | undefined
  onContinue?: () => void
  onAvancerat?: () => void
  onRepetition?: () => void
}

// ── Phone layout (unchanged from Phase A) ─────────────────────────

function PhoneLayout({
  today,
  days,
  sittingLabel,
  coach,
  voice,
  streakValue,
  renderStreak,
  hasDue,
  dueCount,
  onContinue,
  onAvancerat,
  onRepetition,
}: BodyProps) {
  return (
    <>
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
            {days} dagar kvar · {sittingLabel.toLowerCase()}
          </div>
        </div>
        {renderStreak && <StreakBadge value={streakValue} />}
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
          {hasDue ? <RepetitionLink dueCount={dueCount ?? 0} onClick={onRepetition} /> : <span />}
          <AvanceratLink onClick={onAvancerat} />
        </div>
      </div>
    </>
  )
}

// ── Dashboard layout (reader / studio) ─────────────────────────────
//
// Top row: full-width date + days remaining + streak.
// Middle: 3-tile grid. Hero (CTA) gets ~50%, the two info tiles ~25% each.
// Bottom: Avancerat link bottom-right.

function DashboardLayout({
  today,
  days,
  sittingLabel,
  coach,
  voice,
  streakValue,
  renderStreak,
  hasDue,
  dueCount,
  onContinue,
  onAvancerat,
  onRepetition,
}: BodyProps) {
  return (
    <div
      data-testid="home-dashboard"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: 'clamp(28px, 3vw + 20px, 64px) clamp(28px, 3vw, 64px)',
        gap: 'clamp(24px, 2.5vw, 40px)',
      }}
    >
      <header
        className="reveal"
        style={{
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
              fontSize: 13,
              color: 'var(--muted)',
              marginTop: 4,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {days} dagar kvar · {sittingLabel.toLowerCase()}
          </div>
        </div>
        {renderStreak && <StreakBadge value={streakValue} />}
      </header>

      <div
        className="reveal"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gridAutoRows: 'minmax(220px, auto)',
          gap: 'clamp(16px, 1.5vw, 24px)',
          animationDelay: '80ms',
        }}
      >
        {/* Hero tile — keeps the visual weight. Spans 2 columns at
            sufficient width so it's clearly the primary action. */}
        <div
          data-testid="home-tile-hero"
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--radius)',
            padding: 'clamp(24px, 2vw + 16px, 40px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 24,
            gridColumn: 'span 2',
            minHeight: 280,
          }}
        >
          <CoachLine coach={coach} as="headline">
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
        </div>

        {/* Today's plan tile — sitting + due count + a short prompt
            on session length. Reads existing store state; no new
            data fetching. */}
        <div
          data-testid="home-tile-plan"
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--radius)',
            padding: 'clamp(20px, 1.5vw + 12px, 28px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <Mono>Idag</Mono>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 1.2rem + 0.8vw, 32px)',
              lineHeight: 1.15,
              color: 'var(--ink)',
              letterSpacing: '-0.015em',
            }}
          >
            {hasDue && dueCount ? (
              <>
                <strong style={{ fontWeight: 500 }}>{dueCount}</strong>{' '}
                {dueCount === 1 ? 'miss' : 'missar'} att repetera
              </>
            ) : (
              <>En övning · ~10 min</>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto' }}>
            <PlanLine label="Pass" value={sittingLabel} />
            <PlanLine label="Kvar till provet" value={`${days} dagar`} />
          </div>
          {hasDue && <RepetitionLink dueCount={dueCount ?? 0} onClick={onRepetition} compact />}
        </div>

        {/* Recent activity tile — streak + a brief context line. We
            keep this deliberately quiet; it's celebration-adjacent
            but not the focus. Phase B can layer in a tiny sparkline
            of the last 7 days. */}
        <div
          data-testid="home-tile-activity"
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--radius)',
            padding: 'clamp(20px, 1.5vw + 12px, 28px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <Mono>Aktivitet</Mono>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(26px, 1.4rem + 1vw, 40px)',
              lineHeight: 1.05,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {streakValue} {streakValue === 1 ? 'dag' : 'dagar'} i rad
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--ink-2)',
              fontFamily: 'var(--font-display)',
              lineHeight: 1.45,
            }}
          >
            {streakValue >= 7
              ? 'Du håller momentum — fortsätt så.'
              : streakValue > 0
                ? 'Bygg vidare på serien idag.'
                : 'Starta en serie genom att övning idag.'}
          </div>
        </div>
      </div>

      <div
        className="reveal"
        style={{
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'flex-end',
          animationDelay: '240ms',
        }}
      >
        <AvanceratLink onClick={onAvancerat} />
      </div>
    </div>
  )
}

// ── Small shared bits ─────────────────────────────────────────────

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

function PlanLine({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontFamily: 'var(--font-display)',
        fontSize: 14,
        color: 'var(--ink-2)',
      }}
    >
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ color: 'var(--ink)' }}>{value}</span>
    </div>
  )
}

function RepetitionLink({
  dueCount,
  onClick,
  compact = false,
}: {
  dueCount: number
  onClick: (() => void) | undefined
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="home-repetition-link"
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        color: 'var(--ink-2)',
        fontSize: compact ? 12 : 13,
        fontFamily: 'inherit',
        cursor: 'pointer',
        textDecoration: 'underline',
        textUnderlineOffset: 3,
        textAlign: 'left',
      }}
    >
      {compact ? (
        'Repetera missar →'
      ) : (
        <>
          <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{dueCount}</strong>{' '}
          {dueCount === 1 ? 'miss' : 'missar'} att repetera
        </>
      )}
    </button>
  )
}

function AvanceratLink({ onClick }: { onClick: (() => void) | undefined }) {
  return (
    <button
      type="button"
      onClick={onClick}
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
  )
}

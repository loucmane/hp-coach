// Daily Home — editorial masthead at every viewport.
//
// Phase A.7 design overhaul. PRD § 4 Screen 4 stays the brief
// (single large "Fortsätt" CTA, today's plan one line, "Avancerat"
// trailing, streak hidden by default) but the visual language pushes
// hard into editorial territory:
//
//   - "GOD MORGON." (or coach-voice equivalent) is the typographic
//     event — clamp(72-128px) display serif with a hard rule beneath
//     sized to a single word, not the full row. Magazine masthead.
//   - "Dags att fortsätta." sub-line at body display scale, in ink-2.
//   - "FORTSÄTT →" CTA at confident weight underneath; height 64px
//     filled `--ink`. Subtle .hpc-breathe animation.
//   - Date + days-remaining kicker row above the masthead in mono.
//   - At reader/studio: a single Today's plan tile sits to the right
//     of the masthead as a quiet sidebar. Streak (if active) renders
//     in the DesktopNav's trailing slot, not as a competing tile.
//   - At phone: single column flow. Date kicker → masthead → CTA →
//     trailing row (repetition link + Avancerat).
//
// The 3-tile bento from Phase A.5 is dropped — bland tiles competing
// with each other is the opposite of "one bold gesture per screen".

import { MobileFrame, type TabKey } from '@/components/MobileFrame'
import { Btn, Hairline, Mono } from '@/components/primitives'
import { useViewport } from '@/hooks/useViewport'
import { formatSwedishHeader } from '@/lib/dates'
import { type CoachKey, VOICE } from '@/lib/voice'
import { useCoachStore } from '@/stores/coachStore'
import { useDaysRemaining, useSitting } from '@/stores/examStore'

type HomeMobileProps = {
  /** Override coach (tests / preview); defaults to store value. */
  coach?: CoachKey
  /** Force the streak badge on or off (default auto: show iff streakDays > 0). */
  showStreak?: boolean
  /** Current consecutive-days streak. */
  streakDays?: number
  /** Override "now" so screenshots / tests render a stable date. */
  now?: Date
  /** Mistakes due for review right now. */
  dueCount?: number
  onContinue?: () => void
  onAvancerat?: () => void
  onRepetition?: () => void
  onTabChange?: (id: TabKey) => void
  /** Test-only override for viewport detection. */
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
  const isPhone = viewport === 'phone'

  return (
    <MobileFrame
      tabs
      activeTab="home"
      onTabChange={onTabChange}
      streakDays={renderStreak ? streakValue : undefined}
      onAvancerat={onAvancerat}
      forceLayout={forceLayout}
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
        {isPhone ? (
          <PhoneBody
            today={today}
            days={days}
            sittingLabel={sitting.label}
            coach={coach}
            voice={voice}
            renderStreak={renderStreak}
            streakValue={streakValue}
            hasDue={hasDue}
            dueCount={dueCount}
            onContinue={onContinue}
            onAvancerat={onAvancerat}
            onRepetition={onRepetition}
          />
        ) : (
          <DesktopBody
            today={today}
            days={days}
            sittingLabel={sitting.label}
            coach={coach}
            voice={voice}
            hasDue={hasDue}
            dueCount={dueCount}
            onContinue={onContinue}
            onRepetition={onRepetition}
          />
        )}
      </div>
    </MobileFrame>
  )
}

// ── Phone body ─────────────────────────────────────────────────────

type PhoneBodyProps = {
  today: Date
  days: number
  sittingLabel: string
  coach: CoachKey
  voice: (typeof VOICE)[CoachKey]
  renderStreak: boolean
  streakValue: number
  hasDue: boolean
  dueCount: number | undefined
  onContinue: (() => void) | undefined
  onAvancerat: (() => void) | undefined
  onRepetition: (() => void) | undefined
}

function PhoneBody({
  today,
  days,
  sittingLabel,
  voice,
  renderStreak,
  streakValue,
  hasDue,
  dueCount,
  onContinue,
  onAvancerat,
  onRepetition,
}: PhoneBodyProps) {
  const greeting = parseGreeting(voice.homeLine)
  return (
    <>
      <header
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
      </header>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 var(--pad-lg)',
        }}
      >
        <Masthead
          headline={greeting.headline}
          subline={greeting.subline}
          delay="120ms"
          scale="clamp(56px, 14vw, 88px)"
        />
        <div className="reveal" style={{ animationDelay: '240ms', marginTop: 28 }}>
          <Btn
            variant="primary"
            size="xl"
            full
            onClick={onContinue}
            style={{ height: 72, fontSize: 19 }}
            className="hpc-btn hpc-breathe"
          >
            {voice.cta}
          </Btn>
        </div>
        <div
          className="reveal"
          style={{
            marginTop: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            animationDelay: '360ms',
          }}
        >
          {hasDue ? <RepetitionLink dueCount={dueCount ?? 0} onClick={onRepetition} /> : <span />}
          <AvanceratLink onClick={onAvancerat} />
        </div>
      </div>
    </>
  )
}

// ── Desktop body (reader / studio) ─────────────────────────────────

type DesktopBodyProps = {
  today: Date
  days: number
  sittingLabel: string
  coach: CoachKey
  voice: (typeof VOICE)[CoachKey]
  hasDue: boolean
  dueCount: number | undefined
  onContinue: (() => void) | undefined
  onRepetition: (() => void) | undefined
}

function DesktopBody({
  today,
  days,
  sittingLabel,
  voice,
  hasDue,
  dueCount,
  onContinue,
  onRepetition,
}: DesktopBodyProps) {
  const greeting = parseGreeting(voice.homeLine)
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: 'clamp(32px, 4vh, 64px) clamp(32px, 5vw, 80px) clamp(48px, 6vh, 96px)',
      }}
    >
      <div
        className="reveal"
        style={{
          animationDelay: '0ms',
          display: 'flex',
          gap: 14,
          alignItems: 'baseline',
          flexWrap: 'wrap',
        }}
      >
        <Mono>{formatSwedishHeader(today)}</Mono>
        <span aria-hidden style={{ color: 'var(--muted)' }}>
          ·
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: 'var(--font-mono-track)',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {days} dagar kvar
        </span>
        <span aria-hidden style={{ color: 'var(--muted)' }}>
          ·
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: 'var(--font-mono-track)',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          {sittingLabel}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
          gap: 'clamp(40px, 4vw, 80px)',
          alignItems: 'center',
          marginTop: 'clamp(24px, 4vh, 56px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
          }}
        >
          <Masthead
            headline={greeting.headline}
            subline={greeting.subline}
            delay="120ms"
            scale="var(--type-hero)"
          />
          <div className="reveal" style={{ animationDelay: '240ms', maxWidth: 480, width: '100%' }}>
            <Btn
              variant="primary"
              size="xl"
              full
              onClick={onContinue}
              style={{ height: 72, fontSize: 19 }}
              className="hpc-btn hpc-breathe"
            >
              {voice.cta}
            </Btn>
          </div>
        </div>

        <aside
          data-testid="home-tile-plan"
          className="reveal"
          style={{
            animationDelay: '300ms',
            background: 'var(--panel)',
            border: '1px solid var(--hairline)',
            borderRadius: 'calc(var(--radius) * 0.75)',
            padding: 'clamp(20px, 1.5vw + 12px, 32px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            maxWidth: 380,
          }}
        >
          <Mono>Dagens plan</Mono>
          <div aria-hidden style={{ width: 24, height: 1, background: 'var(--ink)' }} />
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(20px, 1rem + 0.8vw, 28px)',
              lineHeight: 1.2,
              color: 'var(--ink)',
              letterSpacing: '-0.015em',
            }}
          >
            ORD · 10 frågor
            <span style={{ color: 'var(--muted)', fontSize: '0.65em' }}>{'  '}~10 min</span>
          </div>
          {hasDue && dueCount ? (
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                lineHeight: 1.4,
                color: 'var(--ink-2)',
              }}
            >
              <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{dueCount}</strong>{' '}
              {dueCount === 1 ? 'miss' : 'missar'} att repetera
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>
              Inga missar att repetera idag.
            </div>
          )}
          {hasDue && (
            <button
              type="button"
              onClick={onRepetition}
              data-testid="home-repetition-link"
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                marginTop: 'auto',
                color: 'var(--ink)',
                fontSize: 13,
                fontFamily: 'var(--font-mono)',
                letterSpacing: 'var(--font-mono-track)',
                textTransform: 'uppercase',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              → Repetera
            </button>
          )}
        </aside>
      </div>
    </div>
  )
}

// ── Masthead (greeting headline + sub-line + accent rule) ──────────

function Masthead({
  headline,
  subline,
  delay,
  scale,
}: {
  headline: string
  subline?: string
  delay: string
  scale: string
}) {
  // Split on the first space so we can render the first word as the
  // "rule-anchor" — the hard 1px rule beneath the headline matches
  // the width of just the first word, not the full row. That's the
  // editorial detail that makes the masthead feel hand-set.
  return (
    <div className="reveal" style={{ animationDelay: delay }}>
      <h1
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: scale,
          lineHeight: 0.95,
          color: 'var(--ink)',
          letterSpacing: '-0.025em',
          textTransform: 'uppercase',
        }}
      >
        {headline}
      </h1>
      <Hairline
        style={{
          marginTop: 16,
          marginBottom: 16,
          width: 64,
          height: 1,
          background: 'var(--ink)',
        }}
      />
      {subline && (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(16px, 0.875rem + 0.4vw, 20px)',
            lineHeight: 1.4,
            color: 'var(--ink-2)',
            maxWidth: '32ch',
          }}
        >
          {subline}
        </p>
      )}
    </div>
  )
}

/** Split the coach's home line into a hero headline + sub-line.
 *  The VOICE.homeLine strings look like:
 *    "Idag · 10 min ORD-repetition · 30 min KVA-grunder · …"
 *    "Kör igång — du har 10 min ORD framför dig."
 *  We don't have a structured "greeting" + "plan" split today, so we
 *  use a coach-agnostic editorial greeting and put the voice line
 *  underneath as the sub-line. Phase C voice work can replace this
 *  with structured greetings. */
function parseGreeting(homeLine: string): { headline: string; subline: string } {
  // For Phase A.7, the headline is a coach-agnostic greeting; the
  // homeLine becomes the body sub-line. This frames the masthead as
  // the editorial event and the coach voice as the "today's plan"
  // commentary that flows beneath.
  const greeting = hourGreeting(new Date())
  return { headline: greeting, subline: homeLine }
}

function hourGreeting(d: Date): string {
  const h = d.getHours()
  if (h < 5) return 'God natt.'
  if (h < 10) return 'God morgon.'
  if (h < 14) return 'God dag.'
  if (h < 18) return 'God eftermiddag.'
  if (h < 22) return 'God kväll.'
  return 'God natt.'
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

function RepetitionLink({
  dueCount,
  onClick,
}: {
  dueCount: number
  onClick: (() => void) | undefined
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
        fontSize: 12,
        fontFamily: 'inherit',
        cursor: 'pointer',
        textDecoration: 'underline',
        textUnderlineOffset: 3,
        textAlign: 'left',
      }}
    >
      <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{dueCount}</strong>{' '}
      {dueCount === 1 ? 'miss' : 'missar'} att repetera
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

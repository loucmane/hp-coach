// ProgressSigil — focal "today's progress" element on Home.
//
// A thin printer's rule under the header band that fills left-to-right
// as the day's plan items complete. The design-director's read out of
// the /loop-bakeoff: editorial language, no dashboard chrome, no echo
// of the BrandMark's geometry. The shape is a typographic underline,
// not a UI bar.
//
// Composition (top to bottom):
//   - 1px rule in `--ink` over a `--hairline-2` track. Width fills to
//     `completed / total`.
//   - Marginalia row beneath the rule:
//     · Zero-state (0/N done): "Börja med: <first item headline>" in
//       italic display, ink-2 with the headline in --ink. Turns the
//       worst ADHD-PI friction moment ("I should start, but where?")
//       into a soft prompt without becoming a notification.
//     · Mid-state (1..N-1 done): italic "X av N" on the left.
//     · All-done state: italic "— klart · <date>" flourish. Single-
//       fire per day; the "close a shape" moment that Variant B
//       owned in the bake-off, absorbed here so we keep one system.
//   - Right-side mono "~X min idag" hint, hidden at reader/studio
//     widths (the day plan repeats the figure below the fold).
//
// Animations: 520ms reading-pace fill transition (slower than UI-
// pace so it reads as the page breathing). Gated on
// `prefers-reduced-motion: reduce` via CSS @media.

import type { DailyPlan } from '@/lib/scheduler'

type Props = {
  /** Today's plan; null while resolving. Null hides the sigil. */
  plan: DailyPlan | null
  /** Day-of-month + lowercase Swedish month for the all-done flourish,
   *  e.g. `26 maj`. Passed in from the route so tests / preview can
   *  pin a stable date. */
  todayLabel: string
}

export function ProgressSigil({ plan, todayLabel }: Props) {
  if (!plan || plan.items.length === 0) return null

  const total = plan.items.length
  const completed = plan.items.filter((i) => i.completed).length
  const fraction = total === 0 ? 0 : completed / total
  const allDone = completed === total
  const isZero = completed === 0
  const firstPending = plan.items.find((i) => !i.completed)

  return (
    <div
      data-testid="home-progress-sigil"
      style={{
        marginTop: 'clamp(16px, 1.4vw + 8px, 22px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          position: 'relative',
          height: 1,
          background: 'var(--hairline-2)',
          overflow: 'hidden',
        }}
        role="img"
        aria-label={`Dagens framsteg: ${completed} av ${total} klart`}
      >
        <div
          className="hpc-sigil-fill"
          style={{
            position: 'absolute',
            inset: 0,
            width: `${fraction * 100}%`,
            background: 'var(--ink)',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
        }}
      >
        <SigilMarginalia
          isZero={isZero}
          allDone={allDone}
          completed={completed}
          total={total}
          firstPendingHeadline={firstPending?.headline ?? null}
          todayLabel={todayLabel}
        />
        {/* Phone-only "~X min idag" — at desktop the day plan repeats
         *  the figure below, so suppress to remove the duplicate. */}
        {!allDone && (
          <span
            className="hpc-sigil-time"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            ~{plan.estimatedMinutes} min idag
          </span>
        )}
      </div>

      {/* Styles colocate with the component so the sigil's animation
       *  contract (slow + reduced-motion-safe) travels with it. */}
      <style>{`
        .hpc-sigil-fill {
          transition: width 520ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (prefers-reduced-motion: reduce) {
          .hpc-sigil-fill { transition: none; }
        }
        @media (min-width: 768px) {
          .hpc-sigil-time { display: none; }
        }
      `}</style>
    </div>
  )
}

function SigilMarginalia({
  isZero,
  allDone,
  completed,
  total,
  firstPendingHeadline,
  todayLabel,
}: {
  isZero: boolean
  allDone: boolean
  completed: number
  total: number
  firstPendingHeadline: string | null
  todayLabel: string
}) {
  if (allDone) {
    return (
      <span
        data-testid="home-sigil-done"
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--ink-2)',
        }}
      >
        — klart · {todayLabel}
      </span>
    )
  }
  if (isZero && firstPendingHeadline) {
    return (
      <span
        data-testid="home-sigil-zero"
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--ink-2)',
        }}
      >
        Börja med:{' '}
        <span style={{ color: 'var(--ink)', fontStyle: 'normal' }}>{firstPendingHeadline}</span>
      </span>
    )
  }
  return (
    <span
      data-testid="home-sigil-progress"
      style={{
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontSize: 13,
        color: 'var(--ink-2)',
      }}
    >
      {completed} av {total}
    </span>
  )
}

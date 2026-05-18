// DailyPlanCard — the editorial daily-plan rendering for Home.
//
// Replaces the "Fortsätt övning" hero with a prescriptive list. Each
// item is one tap: kicker (kind + section if any), headline, rationale
// in muted body, time hint + arrow on the right, and a small
// "Markera klar" pill at the bottom of each row (manual completion for
// items the hook can't derive automatically — drills in v1).
//
// When every item is complete, the card flips to the "Klart för idag"
// state with optional extras + a "Generera om" affordance.
//
// Visual contract:
//   - Eyebrow:  "IDAG · 32 MIN"  (mono, ink-2)
//   - Items:    one row each; hairline rule between items
//   - Header on each row: kind kicker (mono) + completed checkmark
//   - Body:     headline (display) + rationale (display, ink-2)
//   - Trailing: time hint (mono) + → arrow OR Klar ✓ pill
//
// Composition deliberately mirrors the bake-off pattern (eyebrow →
// title → body → footer affordance) so the visual rhythm is
// consistent with /lektion and the drill idle screen.

import { Eyebrow, Hairline, Mono } from '@/components/primitives'
import type { DailyPlan, PlanItem } from '@/lib/scheduler'

type DailyPlanCardProps = {
  plan: DailyPlan
  allComplete: boolean
  onMarkComplete: (itemId: string) => void
  onRegenerate: () => void
  /** Called when a plan item's row is tapped. Receives the item's
   *  href so the route can pick a navigation strategy. Defaults to
   *  `window.location.assign` so the card stays functional in
   *  isolation (e.g. unit tests without a Router context). */
  onNavigate?: (href: string) => void
}

export function DailyPlanCard({
  plan,
  allComplete,
  onMarkComplete,
  onRegenerate,
  onNavigate,
}: DailyPlanCardProps) {
  if (allComplete) {
    return <CompletePanel plan={plan} onRegenerate={onRegenerate} />
  }

  return (
    <section
      data-testid="daily-plan-card"
      className="reveal"
      style={{
        animationDelay: '120ms',
        maxWidth: '68ch',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <Eyebrow>{`Idag · ${plan.estimatedMinutes} min`}</Eyebrow>
        <button
          type="button"
          data-testid="daily-plan-regenerate"
          onClick={onRegenerate}
          style={regenButtonStyle}
        >
          Generera om
        </button>
      </div>

      <Hairline style={{ background: 'var(--ink)', height: 1, width: 48 }} />

      <ol
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          marginTop: 8,
        }}
      >
        {plan.items.map((item) => (
          <PlanRow
            key={item.id}
            item={item}
            onMarkComplete={onMarkComplete}
            onNavigate={onNavigate}
          />
        ))}
      </ol>
    </section>
  )
}

function PlanRow({
  item,
  onMarkComplete,
  onNavigate,
}: {
  item: PlanItem
  onMarkComplete: (itemId: string) => void
  onNavigate?: (href: string) => void
}) {
  const kicker = kickerFor(item)
  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onNavigate) {
      e.preventDefault()
      onNavigate(item.href)
    }
  }
  return (
    <li
      data-testid={`daily-plan-item-${item.id}`}
      data-completed={item.completed ? 'true' : 'false'}
      style={{
        paddingBlock: 'clamp(16px, 1.4vw + 8px, 24px)',
        borderTop: '1px solid var(--hairline)',
        opacity: item.completed ? 0.5 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8,
            }}
          >
            <Eyebrow>{kicker}</Eyebrow>
            {item.completed && (
              <span
                aria-hidden
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                · klar ✓
              </span>
            )}
          </div>
          <a
            href={item.href}
            onClick={handleNavigate}
            data-testid={`daily-plan-link-${item.id}`}
            style={{
              textDecoration: 'none',
              color: 'var(--ink)',
              display: 'block',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(18px, 1vw + 13px, 22px)',
                lineHeight: 1.3,
                letterSpacing: '-0.01em',
                textDecoration: item.completed ? 'line-through' : 'none',
                textDecorationThickness: 1,
              }}
            >
              {item.headline}
            </h3>
            <p
              style={{
                margin: '6px 0 0',
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(14px, 0.4vw + 12px, 15px)',
                lineHeight: 1.5,
                color: 'var(--ink-2)',
              }}
            >
              {item.rationale}
            </p>
          </a>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 6,
            paddingTop: 26, // align with the headline baseline
            minWidth: 64,
          }}
        >
          <Mono>{`~${item.estimatedMinutes} min`}</Mono>
          {!item.completed && (
            <button
              type="button"
              data-testid={`daily-plan-mark-${item.id}`}
              onClick={() => onMarkComplete(item.id)}
              style={markCompleteButtonStyle}
            >
              Klar ✓
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

function CompletePanel({ plan, onRegenerate }: { plan: DailyPlan; onRegenerate: () => void }) {
  const totalMinutes = plan.items.reduce((sum, i) => sum + i.estimatedMinutes, 0)
  return (
    <section
      data-testid="daily-plan-complete"
      className="reveal"
      style={{ animationDelay: '120ms', maxWidth: '60ch' }}
    >
      <Eyebrow>Klart för idag</Eyebrow>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(32px, 2.4vw + 18px, 56px)',
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          margin: '12px 0 16px',
          color: 'var(--ink)',
        }}
      >
        Perfect game.
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(15px, 0.6vw + 13px, 17px)',
          lineHeight: 1.55,
          color: 'var(--ink-2)',
          margin: 0,
        }}
      >
        {plan.items.length} {plan.items.length === 1 ? 'punkt avklarad' : 'punkter avklarade'} · ~
        {totalMinutes} min.
      </p>
      <Hairline
        style={{ background: 'var(--hairline)', height: 1, marginTop: 28, marginBottom: 24 }}
      />
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          lineHeight: 1.5,
          color: 'var(--ink-2)',
          margin: 0,
        }}
      >
        Vill du ha mer? Plocka en sektion eller{' '}
        <button
          type="button"
          onClick={onRegenerate}
          data-testid="daily-plan-regenerate-complete"
          style={inlineLinkStyle}
        >
          generera ny plan
        </button>
        .
      </p>
    </section>
  )
}

function kickerFor(item: PlanItem): string {
  const sectionPart = item.section ? ` · ${item.section}` : ''
  switch (item.kind) {
    case 'repetition':
      return `Repetition${sectionPart}`
    case 'lesson':
      return `Lektion${sectionPart}`
    case 'drill':
      return `Drill${sectionPart}`
  }
}

const regenButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: 'var(--font-mono-track)',
  textTransform: 'uppercase',
  color: 'var(--ink-2)',
  cursor: 'pointer',
}

const markCompleteButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--hairline)',
  borderRadius: 999,
  padding: '4px 10px',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--ink-2)',
  cursor: 'pointer',
}

const inlineLinkStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  fontFamily: 'inherit',
  fontSize: 'inherit',
  color: 'var(--ink)',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  cursor: 'pointer',
}

// DailyPlanCard — "Dagens plan" as M3 numbered rows (M3H; spec
// devbake/l12/M3.tsx L805-829).
//
// A rail section whose margin carries "Idag / ~N min · uppskattat"
// (heuristic total, not a measured commitment) and whose content is
// the numbered plan: cobalt serif ordinal, section tag, headline,
// rationale, trailing minutes. Each row is one tap (the whole body is
// the link); completion is derived from signals only — no manual
// "mark complete", no regenerate affordance. Completed rows dim and
// strike, a live-only extension of the M3 mock.
//
// When every item is complete, the section flips to "Klart för idag".

import { DrillRailSection } from '@/components/drill/DrillRailSection'
import type { DailyPlan, PlanItem } from '@/lib/scheduler'

type DailyPlanCardProps = {
  plan: DailyPlan
  allComplete: boolean
  /** Called when a plan item's row is tapped. Receives the item's
   *  href so the route can pick a navigation strategy. Defaults to
   *  the anchor's native behaviour when omitted (full-page nav). */
  onNavigate?: (href: string) => void
}

export function DailyPlanCard({ plan, allComplete, onNavigate }: DailyPlanCardProps) {
  if (allComplete) {
    return <CompletePanel plan={plan} />
  }

  return (
    <section data-testid="daily-plan-card">
      <DrillRailSection
        meta={
          <>
            <strong>Idag</strong>
            {`~${plan.estimatedMinutes} min · uppskattat`}
          </>
        }
        delay={220}
      >
        <h2 className="hpc-m3-h">Dagens plan</h2>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {plan.items.map((item, i) => (
            <PlanRow key={item.id} item={item} ordinal={i + 1} onNavigate={onNavigate} />
          ))}
        </ol>
      </DrillRailSection>
    </section>
  )
}

function PlanRow({
  item,
  ordinal,
  onNavigate,
}: {
  item: PlanItem
  ordinal: number
  onNavigate?: (href: string) => void
}) {
  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onNavigate) {
      e.preventDefault()
      onNavigate(item.href)
    }
  }
  return (
    <li
      className="hpc-m3-plan-item"
      data-testid={`daily-plan-item-${item.id}`}
      data-completed={item.completed ? 'true' : 'false'}
      style={{ opacity: item.completed ? 0.5 : 1 }}
    >
      <span className="hpc-m3-plan-n" aria-hidden>
        {ordinal}.
      </span>
      <a
        href={item.href}
        onClick={handleNavigate}
        data-testid={`daily-plan-link-${item.id}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block', minWidth: 0 }}
      >
        <div
          className="hpc-m3-plan-t"
          style={{ textDecoration: item.completed ? 'line-through' : undefined }}
        >
          {item.section ? <span className="hpc-m3-tag">{item.section}</span> : null}
          {item.headline}
          {item.completed && ' · klar ✓'}
        </div>
        <div className="hpc-m3-plan-r">{item.rationale}</div>
        {/* Tap affordance (dogfood #170) — quiet mono verb per kind so
         *  the rows read as actions, not static text. Live-only
         *  extension of the M3 row. */}
        {!item.completed && (
          <span
            style={{
              display: 'inline-block',
              marginTop: 6,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
            }}
          >
            {verbFor(item)} →
          </span>
        )}
      </a>
      <span className="hpc-m3-plan-min">~{item.estimatedMinutes} min</span>
    </li>
  )
}

function CompletePanel({ plan }: { plan: DailyPlan }) {
  const totalMinutes = plan.items.reduce((sum, i) => sum + i.estimatedMinutes, 0)
  return (
    <section data-testid="daily-plan-complete">
      <DrillRailSection
        meta={
          <>
            <strong>Idag</strong>
            klart
          </>
        }
        delay={220}
      >
        <h2 className="hpc-m3-h">Klart för idag</h2>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(32px, 4vw, 48px)',
            lineHeight: 1.05,
            letterSpacing: '-0.01em',
            margin: '4px 0 14px',
            color: 'var(--ink)',
          }}
        >
          Perfect game.
        </h3>
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.6,
            color: 'var(--ink-2)',
            margin: 0,
          }}
        >
          {plan.items.length} {plan.items.length === 1 ? 'punkt avklarad' : 'punkter avklarade'} · ~
          {totalMinutes} min. Vill du ha mer? Plocka en sektion eller vila — du har gjort dagens.
        </p>
      </DrillRailSection>
    </section>
  )
}

/** The row's tap verb — same quiet-mono idiom as the picker's "läs →". */
function verbFor(item: PlanItem): string {
  switch (item.kind) {
    case 'repetition':
      return 'repetera'
    case 'lesson':
      return 'läs'
    case 'drill':
      return 'öva'
  }
}

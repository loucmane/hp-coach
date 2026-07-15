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

import { motion } from 'motion/react'

import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { Skrift, SkriftLine, SkriftRule } from '@/components/motion/Skrift'
import { ARK_KORT_LAYOUT_ID, sectionDoorLayoutId, useArketMotion } from '@/lib/motion'
import { type DailyPlan, type PlanItem, repetitionCopy } from '@/lib/scheduler'

type DailyPlanCardProps = {
  /** The day's plan. Null while resolving — the card renders its OWN
   *  pre-impression state (A2 drying ink): same section chrome, same
   *  heading, ghost rows where the plan rows will dry in. Keeping the
   *  skeleton inside the card means the chrome never remounts on data
   *  arrival — only the ink swaps. */
  plan: DailyPlan | null
  allComplete: boolean
  /** Called when a plan item's row is tapped. Receives the item's
   *  href so the route can pick a navigation strategy. Defaults to
   *  the anchor's native behaviour when omitted (full-page nav). */
  onNavigate?: (href: string) => void
  /** LIVE due-mistake count (useDueMistakes → HomeRoute → HomeMobile).
   *  The repetition row's count is live data, not a prescription baked
   *  into the cached plan — so its headline/rationale/minutes are
   *  recomputed from THIS at render time, overriding whatever the plan
   *  cached at generation. Undefined (not resolved, or a caller that
   *  doesn't wire it) → fall back to the cached strings unchanged. */
  dueMistakeCount?: number
  /** LIVE pile count (usePileMistakes) — today's whole "att repetera" list,
   *  the context total M in "N av M missar". Optional; defaults to the due
   *  count when unwired. */
  pileMistakeCount?: number
}

/** Repetition rows carry LIVE data, not a frozen prescription: the cached
 *  plan may hold a stale count and pre-#283 copy ("Repetition · 4 missar")
 *  while the real due queue has moved on. Recompute the row from the
 *  current due count so the number and copy are always honest.
 *   - count === 0  → the queue is empty right now: render completed-style
 *     ("Kön är tom just nu") rather than a false "0 missar" prescription.
 *   - count > 0    → override headline/rationale/minutes from repetitionCopy
 *     (the same shape scheduler.ts snapshots), overriding the cache.
 *  Non-repetition items, or an unresolved count, pass through untouched. */
function withLiveData(
  item: PlanItem,
  dueMistakeCount: number | undefined,
  pileMistakeCount: number | undefined,
): PlanItem {
  if (item.kind !== 'repetition' || dueMistakeCount === undefined) return item
  if (dueMistakeCount === 0) {
    return {
      ...item,
      completed: true,
      headline: 'Repetition · Kön är tom just nu',
      rationale: 'Inga missar att repetera just nu — kön är tom. Bra jobbat.',
      estimatedMinutes: 0,
    }
  }
  const copy = repetitionCopy(dueMistakeCount, pileMistakeCount)
  return {
    ...item,
    completed: false,
    headline: copy.headline,
    rationale: copy.rationale,
    estimatedMinutes: copy.estimatedMinutes,
  }
}

export function DailyPlanCard({
  plan,
  allComplete,
  onNavigate,
  dueMistakeCount,
  pileMistakeCount,
}: DailyPlanCardProps) {
  const ark = useArketMotion()
  if (plan && allComplete) {
    return <CompletePanel plan={plan} />
  }

  // A `kind: 'mock'` item is rendered as the Kallelse summons ABOVE this
  // card, not as an ordinary numbered row here — filtering before mapping
  // (rather than a per-row guard in PlanRow) keeps the ordinal numbering
  // contiguous for the remaining items and avoids a `verbFor` case for
  // the mock kind.
  const rows = plan
    ? plan.items
        .filter((item) => item.kind !== 'mock')
        .map((item) => withLiveData(item, dueMistakeCount, pileMistakeCount))
    : null

  // Mock-only day (pure provpass-dag): every item was filtered out, so the
  // Kallelse above IS the day's plan — render nothing rather than a bare
  // "Dagens plan" heading over an empty list (and a margin-rail minute count
  // that would just double-count the summons's own "· 55 minuter").
  if (rows && rows.length === 0) return null

  // Margin minute estimate reflects the VISIBLE numbered rows only, using
  // the live-overridden repetition minutes — NOT `plan.estimatedMinutes`,
  // which also counts the mock item that renders as the Kallelse (its ~55
  // min is shown there, not here). Counting it in this margin implied
  // invisible work ("~58 min" over a 3-min list). When an uncompleted mock
  // still exists, name it explicitly instead of hiding its minutes.
  const visibleMinutes = (rows ?? [])
    .filter((item) => !item.completed)
    .reduce((sum, item) => sum + item.estimatedMinutes, 0)
  const hasUncompletedMock =
    plan?.items.some((item) => item.kind === 'mock' && !item.completed) ?? false
  const marginEstimate = `~${visibleMinutes} min${hasUncompletedMock ? ' + provpass' : ''} · uppskattat`

  // ark-kort (A2 "Klart folds home"): the day-card and the drill
  // completion panel's Klart block share this layoutId — finishing a
  // session and returning home folds the panel back into the card.
  // The waiting state (plan null) is the SAME sheet: chrome and heading
  // are real ink from the first frame; the plan rows and the margin
  // estimate WRITE IN when the plan lands (Skriften). A cached plan skips
  // the write-in (data present at mount). One line for the margin, two
  // per plan row (headline + rationale) sets the cadence.
  const skriftLines = 1 + (rows?.length ?? 3) * 2
  return (
    <motion.section
      data-testid={rows ? 'daily-plan-card' : 'daily-plan-skeleton'}
      className={ark.rm ? undefined : 'hpc-arkkort'}
      layoutId={ark.rm ? undefined : ARK_KORT_LAYOUT_ID}
      transition={ark.arket}
    >
      <Skrift ready={rows != null} lines={skriftLines}>
        <DrillRailSection
          meta={
            <>
              <strong>Idag</strong>
              {rows != null ? (
                <SkriftLine line={0} inline ruleW="10ch">
                  {marginEstimate}
                </SkriftLine>
              ) : (
                <SkriftRule w={10} />
              )}
            </>
          }
          delay={220}
        >
          <h2 className="hpc-m3-h">Dagens plan</h2>
          {rows != null ? (
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {rows.map((item, i) => (
                <PlanRow key={item.id} item={item} ordinal={i + 1} onNavigate={onNavigate} />
              ))}
            </ol>
          ) : (
            <PlanRules />
          )}
        </DrillRailSection>
      </Skrift>
    </motion.section>
  )
}

/** The plan rows' waiting state: three ruled rows in the exact
 *  `.hpc-m3-plan-item` grid — real ordinals (structure is known before
 *  the data), faint baseline rules where the headline / rationale /
 *  minutes will write in. Static by law: the ruled sheet, not an
 *  activity indicator. */
function PlanRules() {
  return (
    <ol aria-hidden style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {[1, 2, 3].map((n) => (
        <li key={n} className="hpc-m3-plan-item">
          <span className="hpc-m3-plan-n">{n}.</span>
          <span style={{ display: 'block', minWidth: 0 }}>
            <span className="hpc-m3-plan-t" style={{ display: 'block' }}>
              <SkriftRule w={22} />
            </span>
            <span className="hpc-m3-plan-r" style={{ display: 'block' }}>
              <SkriftRule w={34} />
            </span>
          </span>
          <span className="hpc-m3-plan-min">
            <SkriftRule w={6} />
          </span>
        </li>
      ))}
    </ol>
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
  const ark = useArketMotion()
  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onNavigate) {
      e.preventDefault()
      onNavigate(item.href)
    }
  }
  // The row is the door (A2), Home edition: a drill row's section tag
  // morphs into the drill surface's headline/eyebrow across the route
  // change. Drill rows only — repetition/lesson rows land on surfaces
  // with no matching section-code anchor.
  const doorTag =
    !ark.rm && item.kind === 'drill' && item.section ? sectionDoorLayoutId(item.section) : null
  // The row's write-in cadence indices (headline, then rationale),
  // threaded after the margin line (line 0) so the block writes cleanly
  // top-to-bottom.
  const base = 1 + (ordinal - 1) * 2
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
          <SkriftLine line={base} ruleW="24ch">
            {item.section ? (
              doorTag ? (
                <motion.span
                  className="hpc-m3-tag"
                  layoutId={doorTag}
                  transition={ark.arket}
                  style={{ display: 'inline-block' }}
                >
                  {item.section}
                </motion.span>
              ) : (
                <span className="hpc-m3-tag">{item.section}</span>
              )
            ) : null}
            {item.headline}
            {item.completed && ' · klar ✓'}
          </SkriftLine>
        </div>
        <div className="hpc-m3-plan-r">
          <SkriftLine line={base + 1} ruleW="34ch">
            {item.rationale}
          </SkriftLine>
        </div>
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
  const ark = useArketMotion()
  const totalMinutes = plan.items.reduce((sum, i) => sum + i.estimatedMinutes, 0)
  // Same sheet as the plan card — on an all-complete day the Klart
  // panel folds into THIS block instead.
  return (
    <motion.section
      data-testid="daily-plan-complete"
      className={ark.rm ? undefined : 'hpc-arkkort'}
      layoutId={ark.rm ? undefined : ARK_KORT_LAYOUT_ID}
      transition={ark.arket}
    >
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
    </motion.section>
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
    case 'mock':
      // Mock items render as the Kallelse block, not as plan rows —
      // this case only keeps the switch total for the type system.
      return 'starta'
  }
}

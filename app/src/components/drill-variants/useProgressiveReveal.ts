// Progressive Reveal state for the 3 drill-page style variants.
//
// Mirrors the logic in PedagogyPanel.tsx's StepList, but lifted into a
// hook so each variant can render the collapsed/expanded states with
// its own typography rather than inheriting StepList's specific
// chrome. Behaviour MUST stay consistent across variants:
//
//   - `tier: 'essential'` steps are always fully rendered.
//   - `tier: 'detail'` steps default to a one-line preview ("se mer")
//     and reveal full content when the user clicks them OR the
//     bottom "Jag förstår fortfarande inte" CTA.
//   - Steps without a tier field default to 'essential' for
//     backward-compat with pre-A.6V explanations.
//   - Toggle is bidirectional: once expanded a detail can be
//     collapsed again, both per-step and via the bottom mirror CTA
//     ("Korta ner förklaringen").

import { useMemo, useState } from 'react'

import type { ExplanationStep } from '@/data/explanations'

export function useProgressiveReveal(steps: ExplanationStep[]) {
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set())

  const allDetailNs = useMemo(
    () => steps.filter((s) => (s.tier ?? 'essential') === 'detail').map((s) => s.n),
    [steps],
  )
  const collapsedDetailCount = allDetailNs.filter((n) => !expanded.has(n)).length
  const expandedDetailCount = allDetailNs.length - collapsedDetailCount

  return {
    /** Has the user expanded this specific detail step? */
    isExpanded: (n: number) => expanded.has(n),
    /** Is this step (a) tier:detail AND (b) not currently expanded? */
    isCollapsedDetail: (step: ExplanationStep) =>
      (step.tier ?? 'essential') === 'detail' && !expanded.has(step.n),
    /** Expand a single detail step. */
    expandDetail: (n: number) =>
      setExpanded((prev) => {
        const next = new Set(prev)
        next.add(n)
        return next
      }),
    /** Collapse a single detail step. */
    collapseDetail: (n: number) =>
      setExpanded((prev) => {
        const next = new Set(prev)
        next.delete(n)
        return next
      }),
    /** Reveal every detail step. */
    expandAll: () => setExpanded(new Set(allDetailNs)),
    /** Collapse every detail step. */
    collapseAll: () => setExpanded(new Set()),
    /** Total detail-step count (for CTA copy). */
    totalDetailCount: allDetailNs.length,
    /** How many detail steps are currently collapsed. */
    collapsedDetailCount,
    /** How many detail steps are currently expanded. */
    expandedDetailCount,
  }
}

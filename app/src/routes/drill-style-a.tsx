// /drill-style-a — qid-anchored drill, default Editorial.
//
// Phase A.6V. This route was originally hardcoded to StyleA for
// bake-off comparison. With the Edition Strip live, clicking
// 'workbook' or 'cockpit' on this URL needs to actually swap the
// variant (the picker IS the canonical surface). So the route now:
//
//   1. Sets drillLayout='a' on entry — the URL still reads as "land
//      on Editorial" for anyone direct-linking, and visitors who
//      haven't picked an edition get Editorial as the default.
//   2. Renders DispatchedVariant — which reads drillLayout live and
//      flips to StyleB/StyleC the moment the picker fires.
//
// Net: /drill-style-a is a qid-anchored direct link with an
// Editorial default; /drill-style-b and /drill-style-c are the same
// with Workbook / Cockpit defaults.

import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

import { DispatchedVariant } from '@/components/drill-variants/DispatchedVariant'
import { DrillVariantShell } from '@/components/drill-variants/DrillVariantShell'
import { useUiStore } from '@/stores/uiStore'

type Search = { qid?: string }

export const Route = createFileRoute('/drill-style-a')({
  component: StyleARoute,
  validateSearch: (s: Record<string, unknown>): Search => ({
    qid: typeof s.qid === 'string' ? s.qid : undefined,
  }),
})

function StyleARoute() {
  const { qid } = Route.useSearch()
  const setDrillLayout = useUiStore((s) => s.setDrillLayout)
  // One-time on entry. Subsequent picker clicks re-set as the user
  // pleases — we don't fight them by re-setting 'a' on every render.
  useEffect(() => {
    setDrillLayout('a')
  }, [setDrillLayout])
  return (
    <DrillVariantShell qid={qid}>{(data) => <DispatchedVariant {...data} />}</DrillVariantShell>
  )
}

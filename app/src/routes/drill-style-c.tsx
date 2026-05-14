// /drill-style-c — qid-anchored drill, default Cockpit.
//
// See /drill-style-a for the full rationale.

import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

import { DispatchedVariant } from '@/components/drill-variants/DispatchedVariant'
import { DrillVariantShell } from '@/components/drill-variants/DrillVariantShell'
import { useUiStore } from '@/stores/uiStore'

type Search = { qid?: string }

export const Route = createFileRoute('/drill-style-c')({
  component: StyleCRoute,
  validateSearch: (s: Record<string, unknown>): Search => ({
    qid: typeof s.qid === 'string' ? s.qid : undefined,
  }),
})

function StyleCRoute() {
  const { qid } = Route.useSearch()
  const setDrillLayout = useUiStore((s) => s.setDrillLayout)
  useEffect(() => {
    setDrillLayout('c')
  }, [setDrillLayout])
  return (
    <DrillVariantShell qid={qid}>{(data) => <DispatchedVariant {...data} />}</DrillVariantShell>
  )
}

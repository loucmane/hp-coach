// /drill-style-b — qid-anchored drill, default Workbook.
//
// See /drill-style-a for the full rationale.

import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

import { DispatchedVariant } from '@/components/drill-variants/DispatchedVariant'
import { DrillVariantShell } from '@/components/drill-variants/DrillVariantShell'
import { useUiStore } from '@/stores/uiStore'

type Search = { qid?: string }

export const Route = createFileRoute('/drill-style-b')({
  component: StyleBRoute,
  validateSearch: (s: Record<string, unknown>): Search => ({
    qid: typeof s.qid === 'string' ? s.qid : undefined,
  }),
})

function StyleBRoute() {
  const { qid } = Route.useSearch()
  const setDrillLayout = useUiStore((s) => s.setDrillLayout)
  useEffect(() => {
    setDrillLayout('b')
  }, [setDrillLayout])
  return (
    <DrillVariantShell qid={qid}>{(data) => <DispatchedVariant {...data} />}</DrillVariantShell>
  )
}

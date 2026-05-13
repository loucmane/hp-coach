// /drill-style-b — Variant B (Reader Single-Column) preview.

import { createFileRoute } from '@tanstack/react-router'

import { DrillVariantShell } from '@/components/drill-variants/DrillVariantShell'
import { StyleB } from '@/components/drill-variants/StyleB'

type Search = { qid?: string }

export const Route = createFileRoute('/drill-style-b')({
  component: StyleBRoute,
  validateSearch: (s: Record<string, unknown>): Search => ({
    qid: typeof s.qid === 'string' ? s.qid : undefined,
  }),
})

function StyleBRoute() {
  const { qid } = Route.useSearch()
  return <DrillVariantShell qid={qid}>{(data) => <StyleB {...data} />}</DrillVariantShell>
}

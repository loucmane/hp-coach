// /drill-style-c — Variant C (Cockpit Terminal) preview.

import { createFileRoute } from '@tanstack/react-router'

import { DrillVariantShell } from '@/components/drill-variants/DrillVariantShell'
import { StyleC } from '@/components/drill-variants/StyleC'

type Search = { qid?: string }

export const Route = createFileRoute('/drill-style-c')({
  component: StyleCRoute,
  validateSearch: (s: Record<string, unknown>): Search => ({
    qid: typeof s.qid === 'string' ? s.qid : undefined,
  }),
})

function StyleCRoute() {
  const { qid } = Route.useSearch()
  return <DrillVariantShell qid={qid}>{(data) => <StyleC {...data} />}</DrillVariantShell>
}

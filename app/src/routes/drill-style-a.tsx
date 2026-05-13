// /drill-style-a — Variant A (Editorial Pure) preview.
//
// Renders a single interactive drill (default KVA-016) in the
// Editorial Pure layout. Variant routes are top-level (not nested
// under /dev) so TanStack's child-route semantics don't strand the
// page under a parent <Outlet />.

import { createFileRoute } from '@tanstack/react-router'

import { DrillVariantShell } from '@/components/drill-variants/DrillVariantShell'
import { StyleA } from '@/components/drill-variants/StyleA'

type Search = { qid?: string }

export const Route = createFileRoute('/drill-style-a')({
  component: StyleARoute,
  validateSearch: (s: Record<string, unknown>): Search => ({
    qid: typeof s.qid === 'string' ? s.qid : undefined,
  }),
})

function StyleARoute() {
  const { qid } = Route.useSearch()
  return <DrillVariantShell qid={qid}>{(data) => <StyleA {...data} />}</DrillVariantShell>
}

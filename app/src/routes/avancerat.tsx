import { createFileRoute } from '@tanstack/react-router'

import { MobileFrame } from '@/components/MobileFrame'

import { StubBody } from './drill'

export const Route = createFileRoute('/avancerat')({
  component: AvanceratStub,
})

// Settings / advanced: tabs hidden because this is a leaf flow accessed
// from the home screen's trailing link, not a primary destination.
function AvanceratStub() {
  return (
    <MobileFrame tabs={false}>
      <StubBody label="Avancerat" copy="Inställningar och allt utöver vardagsflödet." />
    </MobileFrame>
  )
}

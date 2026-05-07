import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { MobileFrame } from '@/components/MobileFrame'
import { TAB_ROUTE } from '@/lib/nav'

import { StubBody } from './drill'

export const Route = createFileRoute('/coach')({
  component: CoachStub,
})

function CoachStub() {
  const navigate = useNavigate()
  return (
    <MobileFrame tabs activeTab="coach" onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}>
      <StubBody label="Coach" copy="Coach-vy och röstinställningar landar här." />
    </MobileFrame>
  )
}

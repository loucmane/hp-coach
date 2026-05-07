import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { MobileFrame } from '@/components/MobileFrame'
import { TAB_ROUTE } from '@/lib/nav'

import { StubBody } from './drill'

export const Route = createFileRoute('/progress')({
  component: ProgressStub,
})

function ProgressStub() {
  const navigate = useNavigate()
  return (
    <MobileFrame tabs activeTab="progress" onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}>
      <StubBody label="Framsteg" copy="Veckovy + adaptiv lista landar här i Phase 0c." />
    </MobileFrame>
  )
}

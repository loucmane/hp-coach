import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { MobileFrame } from '@/components/MobileFrame'
import { Btn, Mono } from '@/components/primitives'
import { TAB_ROUTE } from '@/lib/nav'

export const Route = createFileRoute('/drill')({
  component: DrillStub,
})

function DrillStub() {
  const navigate = useNavigate()
  return (
    <MobileFrame tabs activeTab="drill" onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}>
      <StubBody label="Övning" copy="Drill-skärmar landar här i Phase 0c." />
    </MobileFrame>
  )
}

export function StubBody({ label, copy }: { label: string; copy: string }) {
  const navigate = useNavigate()
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 22px',
        gap: 14,
        color: 'var(--ink)',
      }}
    >
      <Mono>{label}</Mono>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, textAlign: 'center' }}>
        {copy}
      </div>
      <Btn onClick={() => navigate({ to: '/' })} variant="secondary">
        Tillbaka till hem
      </Btn>
    </div>
  )
}

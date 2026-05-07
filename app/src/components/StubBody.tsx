// Shared placeholder used by tab routes that aren't built out yet.
// Renders a centered label + headline + "back to home" button so the
// scaffolding is consistent and we can audit which screens are still
// stubs at a glance.

import { useNavigate } from '@tanstack/react-router'

import { Btn, Mono } from './primitives'

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

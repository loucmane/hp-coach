// /dev/account-menu-bakeoff-2 — ROUND 2 of the account/identity surface.
//
// Round 1 (three placements of a popover menu) was rejected by the owner
// on feel. Round 2: two skill-guided designers, two concepts each —
//   A1 "Ägarraden"    — no popover at all; identity is a running head and
//                        activating it unfolds an ex libris bookplate
//                        IN-FLOW (content pushes down, nothing floats).
//   A2 "Kolofonen"    — the surface as a printer's colophon on the house
//                        "slip of paper" (ConfirmSheet idiom on phone,
//                        column-tipped slip on desktop); centered, asterism.
//   B1 "Kolofonkortet"— the conventional pattern executed to the
//                        millimeter: column-anchored tipped-in card,
//                        book-rule pair, dashed un-stamped ring signed-out.
//   B2 "Inskriven"    — the addressee line: identity as the document's
//                        candidate name on the margin rail; unfolds a
//                        registration block in place. No popover, no scrim.
//
// Owner law, all variants: "Radera konto" appears NOWHERE (deletion will
// live deep inside the future Konto page); actions are at most Logga ut /
// Konto → / Exportera min data / quiet Inställningar →; identity chrome
// never rides onto study surfaces; signed-out renders a Logga in slot.
//
// Dev-gated via isDevSurface(). No product code changes. Round 1 stays
// live at /dev/account-menu-bakeoff per the keep-bake-offs house rule.

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { R2A1, R2A2 } from '@/components/devbake/AccountMenuR2A'
import { R2B1, R2B2 } from '@/components/devbake/AccountMenuR2B'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/dev_/account-menu-bakeoff-2')({
  component: AccountMenuBakeoff2Page,
})

const VARIANTS = [
  { key: 'a1', label: 'A1 · Ägarraden', C: R2A1 },
  { key: 'a2', label: 'A2 · Kolofonen', C: R2A2 },
  { key: 'b1', label: 'B1 · Kolofonkortet', C: R2B1 },
  { key: 'b2', label: 'B2 · Inskriven', C: R2B2 },
] as const

function AccountMenuBakeoff2Page() {
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]['key']>('a1')
  const [open, setOpen] = useState(true)
  const [signedOut, setSignedOut] = useState(false)

  if (!isDevSurface()) {
    return (
      <div style={{ padding: 40, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
        dev-yta — lägg till ?dev=1
      </div>
    )
  }

  const Active = VARIANTS.find((v) => v.key === variant)?.C ?? R2A1

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', padding: '28px 24px 80px' }}>
      <header style={{ maxWidth: 980, margin: '0 auto 20px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.14em',
            color: 'var(--muted)',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Bake-off · konto-ytan · runda 2
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {VARIANTS.map((v) => (
            <Chip key={v.key} active={variant === v.key} onClick={() => setVariant(v.key)}>
              {v.label}
            </Chip>
          ))}
          <span style={{ width: 12 }} />
          <Chip active={open} onClick={() => setOpen((o) => !o)}>
            {open ? 'öppen' : 'stängd'}
          </Chip>
          <Chip active={signedOut} onClick={() => setSignedOut((s) => !s)}>
            {signedOut ? 'utloggad vy' : 'inloggad vy'}
          </Chip>
        </div>
      </header>
      {/* key remount so defaultOpen/signedOut re-apply per toggle */}
      <Active key={`${variant}-${open}-${signedOut}`} defaultOpen={open} signedOut={signedOut} />
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        letterSpacing: '0.04em',
        padding: '7px 14px',
        borderRadius: 999,
        border: `1px solid ${active ? 'var(--ink)' : 'var(--hairline)'}`,
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--bg)' : 'var(--ink-2)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

// /konto — the minimal account page the AccountMenu's "Konto" row routes
// to. A Boksidan Page (same chassis as /mer): the three-register identity
// block (answering the menu's single-line-ellipsis email with the full
// address), then house-voice placeholder sections for what is coming.
//
// Owner law: NO account deletion anywhere on this surface, and NO embedded
// Clerk <UserProfile /> (its hosted UI can surface a delete-account
// affordance — the exact leak the jury flagged). Subscription management
// lands here when P3 ships; until then it is a quiet single line.

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { Medallion, useAccountIdentity } from '@/components/account/AccountMenu'
import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { MobileFrame } from '@/components/MobileFrame'
import { Page } from '@/components/Page'
import { useDaysRemaining, useSitting } from '@/stores/examStore'

export const Route = createFileRoute('/konto')({
  component: KontoRoute,
})

// The single-line, house-voice notes for surfaces that don't exist yet.
// Swedish product copy; quiet, honest, no false affordance.
const COMING = [
  {
    meta: 'Prenumeration',
    heading: 'Plan och betalning',
    line: 'Kommer när HP-Coach går från gratis dogfood till betald tjänst — inget att göra här ännu.',
  },
  {
    meta: 'Inloggning',
    heading: 'Lösenord och tvåfaktor',
    line: 'Hanteras via din inloggningsleverantör. Logga ut och in igen för att byta metod.',
  },
] as const

function KontoRoute() {
  const identity = useAccountIdentity()
  const sitting = useSitting()
  const days = useDaysRemaining()

  return (
    <MobileFrame tabs={false}>
      <Page>
        <div className="hpc-m3-frame" style={{ width: '100%', color: 'var(--ink)' }}>
          <DrillRailSection
            meta={
              <>
                <strong>Konto</strong>
                {days} dagar · {sitting.label.toLowerCase()}
              </>
            }
            delay={0}
          >
            <h1 className="hpc-m3-display" style={{ marginTop: 0 }}>
              Ditt konto.
            </h1>

            {/* The three-register identity block — medallion + eyebrow +
                serif name + FULL mono email (the ellipsis in the menu is
                answered here). */}
            <div
              data-testid="konto-identity"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginTop: 28,
                paddingBottom: 22,
                borderBottom: '1px solid var(--hairline)',
              }}
            >
              <Medallion initials={identity.initials} size={48} />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                    marginBottom: 4,
                  }}
                >
                  Inloggad som
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    color: 'var(--ink)',
                    lineHeight: 1.15,
                  }}
                >
                  {identity.name}
                </div>
                <div
                  data-testid="konto-email"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--ink-2)',
                    marginTop: 5,
                    wordBreak: 'break-all',
                  }}
                >
                  {identity.email}
                </div>
              </div>
            </div>
          </DrillRailSection>

          {COMING.map((s, i) => (
            <DrillRailSection key={s.meta} meta={s.meta} delay={120 + i * 120}>
              <h2 className="hpc-m3-h">{s.heading}</h2>
              <p
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 14,
                  color: 'var(--ink-2)',
                  lineHeight: 1.55,
                  margin: '6px 0 0',
                  maxWidth: 560,
                }}
              >
                {s.line}
              </p>
            </DrillRailSection>
          ))}

          <BackHome />
        </div>
      </Page>
    </MobileFrame>
  )
}

function BackHome(): ReactNode {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate({ to: '/' })}
      style={{
        all: 'unset',
        cursor: 'pointer',
        marginTop: 36,
        marginLeft: 'var(--hpc-m3-content-inset, 0)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.06em',
        // WCAG AA: --muted passes 4.5:1 at 11px where --muted-2 fails.
        color: 'var(--muted)',
      }}
    >
      ← tillbaka hem
    </button>
  )
}

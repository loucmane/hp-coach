// /konto — the minimal account page the AccountMenu's "Konto" row routes
// to. A Boksidan Page (same chassis as /mer): the three-register identity
// block (answering the menu's single-line-ellipsis email with the full
// address), then house-voice placeholder sections for what is coming.
//
// Owner law: NO account deletion anywhere on this surface, and NO embedded
// Clerk <UserProfile /> (its hosted UI can surface a delete-account
// affordance — the exact leak the jury flagged). Subscription management
// lands here when P3 ships; until then it is a quiet single line.

import { useClerk } from '@clerk/clerk-react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { type CSSProperties, type ReactNode, useState } from 'react'

import { downloadExport, useExportData } from '@/api/hooks/useDataExport'
import { useDeleteAccount } from '@/api/hooks/useDeleteAccount'
import { Medallion, useAccountIdentity } from '@/components/account/AccountMenu'
import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { MobileFrame } from '@/components/MobileFrame'
import { Page } from '@/components/Page'
import { LEGAL_LINK_STYLE, LEGAL_LINKS } from '@/lib/legal'
import { useFirstContentSignal } from '@/lib/motion'
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
  // Boot-veil content signal (#305 owner verdict) — /konto has no Skrift
  // block; its identity/settings content is local-derived at mount.
  useFirstContentSignal()
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

          <DeleteAccountSection />

          {/* Legal footer — quiet mono rows linking the public policy
              pages. Same discoverability grammar as /mer. */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px 20px',
              marginTop: 36,
              marginLeft: 'var(--hpc-m3-content-inset, 0)',
              paddingTop: 18,
              borderTop: '1px solid var(--hairline-2)',
            }}
          >
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                data-testid={`konto-legal-${l.to.slice(1)}`}
                style={LEGAL_LINK_STYLE}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <BackHome />
        </div>
      </Page>
    </MobileFrame>
  )
}

// The quietest thing on the page, at the very bottom, reachable only by
// scrolling: permanent account deletion. Owner law keeps "Radera konto"
// out of every MENU — it lives DEEP here and nowhere else. House voice:
// plain, no drama, honest about what is lost. The export-first prompt sits
// ABOVE the destructive control; the button is inert until the user has
// typed the exact word "radera".
const DELETE_WORD = 'radera'

function DeleteAccountSection(): ReactNode {
  const exportData = useExportData()
  const deleteAccount = useDeleteAccount()
  const { signOut } = useClerk()
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const armed = confirm === DELETE_WORD
  const busy = deleteAccount.isPending

  const onExport = () => {
    exportData
      .mutateAsync()
      .then((envelope) => downloadExport(envelope))
      .catch(() => setError('Kunde inte exportera just nu. Försök igen om en stund.'))
  }

  const onDelete = async () => {
    if (!armed || busy) return
    setError(null)
    try {
      await deleteAccount.mutateAsync()
      // Endpoint → sign-out → goodbye. The account is gone; clear the
      // session so nothing signed-in lingers, then show a plain farewell.
      setDone(true)
      await signOut()
    } catch {
      setError('Kunde inte radera kontot. Inget raderades — försök igen.')
    }
  }

  if (done) {
    return (
      <DrillRailSection meta="Farväl" delay={360} testid="konto-delete-done">
        <h2 className="hpc-m3-h">Kontot är raderat.</h2>
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
          Allt är borta. Tack för att du testade HP-Coach.
        </p>
      </DrillRailSection>
    )
  }

  const mono: CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--muted)',
    lineHeight: 1.6,
  }

  return (
    <DrillRailSection meta="Radera konto" delay={360} testid="konto-delete">
      <h2 className="hpc-m3-h" style={{ fontSize: 15, color: 'var(--ink-2)' }}>
        Radera konto
      </h2>
      <p style={{ ...mono, margin: '8px 0 0', maxWidth: 520 }}>
        Allt raderas direkt — konto, försök, missar och resultat. Säkerhetskopior tunnas ut inom 30
        dagar. Det går inte att ångra.
      </p>

      {/* EXPORT FIRST — offered ABOVE the destructive control. */}
      <button
        type="button"
        data-testid="konto-delete-export"
        onClick={onExport}
        disabled={exportData.isPending}
        style={{
          all: 'unset',
          cursor: exportData.isPending ? 'default' : 'pointer',
          display: 'inline-block',
          marginTop: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          letterSpacing: '0.02em',
          color: 'var(--muted)',
          textDecoration: 'underline',
          textUnderlineOffset: 3,
          opacity: exportData.isPending ? 0.5 : 1,
        }}
      >
        Exportera min data först →
      </button>

      <div style={{ marginTop: 20, maxWidth: 320 }}>
        <label
          htmlFor="konto-delete-confirm"
          style={{ ...mono, display: 'block', marginBottom: 6 }}
        >
          Skriv <span style={{ color: 'var(--ink-2)' }}>radera</span> för att bekräfta.
        </label>
        <input
          id="konto-delete-confirm"
          data-testid="konto-delete-confirm"
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            padding: '8px 10px',
            color: 'var(--ink)',
            background: 'transparent',
            border: '1px solid var(--hairline)',
            borderRadius: 6,
          }}
        />
        <button
          type="button"
          data-testid="konto-delete-submit"
          onClick={onDelete}
          disabled={!armed || busy}
          style={{
            all: 'unset',
            display: 'block',
            marginTop: 12,
            cursor: !armed || busy ? 'default' : 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: '0.04em',
            padding: '8px 14px',
            borderRadius: 6,
            border: '1px solid var(--hairline)',
            color: armed ? 'var(--ink)' : 'var(--muted-2, var(--muted))',
            opacity: !armed || busy ? 0.45 : 1,
          }}
        >
          {busy ? 'Raderar…' : 'Radera kontot permanent'}
        </button>
        {error && (
          <p style={{ ...mono, color: 'var(--ink-2)', margin: '10px 0 0' }} role="alert">
            {error}
          </p>
        )}
      </div>
    </DrillRailSection>
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

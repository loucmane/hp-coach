// AuthLayout — Phase A.7 editorial composition for /sign-in and /sign-up.
//
// Layout summary:
//
//   Phone (<768)
//     ┌─────────────────────────────────┐
//     │ ⌜ HP-COACH         VÅR-2026  ↘ │  ← top band
//     │ ──────────────────────────────  │
//     │                                 │
//     │   FÖRSTÅ                        │  ← pull-quote
//     │   STRUKTUREN.                   │     (smaller scale)
//     │   ──                            │
//     │   Inte bara                     │
//     │   frågorna.                     │
//     │                                 │
//     │   LOGGA IN                      │  ← card-label
//     │   ──                            │
//     │   ┌─────────────────────────┐   │
//     │   │ [ Continue with Google ]│   │  ← Clerk card
//     │   │ — or —                  │   │
//     │   │ [_____________________] │   │
//     │   │ [ Fortsätt    →       ] │   │
//     │   └─────────────────────────┘   │
//     │                                 │
//     │   Inget konto? → börja här      │  (sign-in only)
//     └─────────────────────────────────┘
//
//   Reader (768–1279) / Studio (≥1280)
//     ┌──────────────────────────────────────────────────────────────┐
//     │ ⌜ HP-COACH                                  VÅR-2026  ↘     │
//     │ ────────────────────────────────────────────────────────────  │
//     │                                                              │
//     │  ┌──────────────────────┐    FÖRSTÅ                          │
//     │  │  LOGGA IN            │    STRUKTUREN.                     │
//     │  │  ──                  │    ──                              │
//     │  │  [ Clerk card ]      │    Inte bara frågorna.             │
//     │  │                      │                                    │
//     │  └──────────────────────┘                                    │
//     │                                                              │
//     │  Inget konto? → börja här                                    │
//     └──────────────────────────────────────────────────────────────┘
//
// The pull-quote on the right is the typographic event. The form card
// on the left is the affordance. The brand mark + date kicker at the
// top sets the page in time and space. Nothing else competes for
// attention.

import type { ReactNode } from 'react'

import { useViewport } from '@/hooks/useViewport'

import { BrandMark } from './BrandMark'

type Props = {
  children: ReactNode
  /** Card label above the Clerk component — e.g. "LOGGA IN" or
   *  "BÖRJA HÄR". Set in small-caps Newsreader to match the brand
   *  mark's treatment. */
  cardLabel: string
  /** Pull-quote split across two lines for typographic effect.
   *  Defaults to the sign-in line. */
  pullQuoteLine1?: string
  pullQuoteLine2?: string
  /** Sub-line below the pull-quote (smaller body display). */
  subline?: string
  /** Cross-link below the card ("Inget konto? → börja här" or
   *  "Har redan konto? → logga in"). */
  crossLink?: ReactNode
  /** Test override for viewport detection. */
  forceLayout?: 'phone' | 'reader' | 'studio'
}

export function AuthLayout({
  children,
  cardLabel,
  pullQuoteLine1 = 'FÖRSTÅ',
  pullQuoteLine2 = 'STRUKTUREN.',
  subline = 'Inte bara frågorna.',
  crossLink,
  forceLayout,
}: Props) {
  const detectedViewport = useViewport()
  const viewport = forceLayout ?? detectedViewport
  const isPhone = viewport === 'phone'

  return (
    <div
      data-testid="auth-layout"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      <TopBand />
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          padding: isPhone
            ? '24px var(--pad-lg) clamp(40px, 8vh, 80px)'
            : 'clamp(48px, 8vh, 120px) clamp(32px, 6vw, 96px)',
        }}
      >
        {isPhone ? (
          <PhoneBody
            cardLabel={cardLabel}
            pullQuoteLine1={pullQuoteLine1}
            pullQuoteLine2={pullQuoteLine2}
            subline={subline}
            crossLink={crossLink}
          >
            {children}
          </PhoneBody>
        ) : (
          <DesktopBody
            cardLabel={cardLabel}
            pullQuoteLine1={pullQuoteLine1}
            pullQuoteLine2={pullQuoteLine2}
            subline={subline}
            crossLink={crossLink}
          >
            {children}
          </DesktopBody>
        )}
      </main>
    </div>
  )
}

// ── Top band — brand mark + date kicker ────────────────────────────

function TopBand() {
  const datePeriod = currentExamPeriod()
  return (
    <div
      data-testid="auth-top-band"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'clamp(20px, 2.5vh, 40px) clamp(20px, 4vw, 64px)',
        borderBottom: '1px solid var(--hairline)',
      }}
    >
      <BrandMark />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: 'var(--font-mono-track)',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          fontVariantNumeric: 'tabular-nums',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {datePeriod}
        <span aria-hidden style={{ color: 'var(--muted)' }}>
          ↘
        </span>
      </span>
    </div>
  )
}

/** Compute "VÅR-2026" / "HÖST-2026" style label from current date.
 *  Höstprovet runs Oct–Nov; Vårprovet runs Mar–Apr. We label
 *  the upcoming sitting, not the calendar half. */
function currentExamPeriod(): string {
  const now = new Date()
  const month = now.getMonth() // 0-11
  const year = now.getFullYear()
  // Months 0-3 (Jan-Apr) → upcoming is VÅR of this year
  // Months 4-9 (May-Oct) → upcoming is HÖST of this year
  // Months 10-11 (Nov-Dec) → upcoming is VÅR of next year
  if (month <= 3) return `VÅR-${year}`
  if (month <= 9) return `HÖST-${year}`
  return `VÅR-${year + 1}`
}

// ── Phone body — vertical stack ────────────────────────────────────

function PhoneBody({
  children,
  cardLabel,
  pullQuoteLine1,
  pullQuoteLine2,
  subline,
  crossLink,
}: {
  children: ReactNode
  cardLabel: string
  pullQuoteLine1: string
  pullQuoteLine2: string
  subline: string
  crossLink: ReactNode
}) {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
      }}
    >
      <PullQuote line1={pullQuoteLine1} line2={pullQuoteLine2} subline={subline} compact />
      <CardSection cardLabel={cardLabel}>{children}</CardSection>
      {crossLink && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
          {crossLink}
        </div>
      )}
    </div>
  )
}

// ── Desktop body — two-column with pull-quote ──────────────────────

function DesktopBody({
  children,
  cardLabel,
  pullQuoteLine1,
  pullQuoteLine2,
  subline,
  crossLink,
}: {
  children: ReactNode
  cardLabel: string
  pullQuoteLine1: string
  pullQuoteLine2: string
  subline: string
  crossLink: ReactNode
}) {
  return (
    <div
      style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)',
        gap: 'clamp(40px, 6vw, 120px)',
        alignItems: 'center',
      }}
    >
      <div
        data-testid="auth-form-pane"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 18,
        }}
      >
        {/* Sage left-rail — one structural rule down the form block (a
         *  margin rule, not a card). The single accent that anchors the
         *  now-card-less form; desktop only (phone stays flush). Pairs with
         *  the flush-form treatment in clerkAppearance.ts. */}
        <div
          style={{
            width: '100%',
            maxWidth: 444,
            borderLeft: '4px solid var(--accent)',
            paddingLeft: 'clamp(20px, 2vw, 32px)',
          }}
        >
          <CardSection cardLabel={cardLabel}>{children}</CardSection>
          {crossLink && (
            <div
              style={{
                marginTop: 20,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--muted)',
                textAlign: 'left',
              }}
            >
              {crossLink}
            </div>
          )}
        </div>
      </div>
      <aside data-testid="auth-brand-pane" style={{ maxWidth: 560 }}>
        <PullQuote line1={pullQuoteLine1} line2={pullQuoteLine2} subline={subline} />
      </aside>
    </div>
  )
}

// ── Pull-quote (editorial display type) ────────────────────────────

function PullQuote({
  line1,
  line2,
  subline,
  compact = false,
}: {
  line1: string
  line2: string
  subline: string
  compact?: boolean
}) {
  const sizeVar = compact ? 'clamp(36px, 9vw, 56px)' : 'var(--type-pull-quote)'
  return (
    <div>
      <h1
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontWeight: 400,
          fontSize: sizeVar,
          lineHeight: 1.02,
          color: 'var(--ink)',
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
        }}
      >
        {line1}
        <br />
        {line2}
      </h1>
      <div
        aria-hidden
        style={{
          marginTop: 18,
          marginBottom: 18,
          width: 64,
          height: 1,
          background: 'var(--ink)',
        }}
      />
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(16px, 0.9rem + 0.4vw, 20px)',
          lineHeight: 1.5,
          color: 'var(--ink-2)',
          maxWidth: '32ch',
        }}
      >
        {subline}
      </p>
    </div>
  )
}

// ── Card section (label + Clerk card) ──────────────────────────────

function CardSection({ children, cardLabel }: { children: ReactNode; cardLabel: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
          marginBottom: 14,
        }}
      >
        {cardLabel}
      </div>
      <div
        aria-hidden
        style={{
          width: 32,
          height: 1,
          background: 'var(--ink)',
          marginBottom: 22,
        }}
      />
      <div>{children}</div>
    </div>
  )
}

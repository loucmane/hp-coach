// ProvpassStatusLine — the passive PROVPASS readout row (V4A FINAL;
// devbake/NavCtaBakeoff.tsx L667-707 ProvpassStatusLine()). A READOUT, not
// a CTA: muted mono text, a full-row tap target, hairline border-top/
// bottom, a bleed-to-full-width negative-margin trick, and a subtle
// trailing chevron. Lives above "Senaste passen".
//
// Four states:
//   - countdown   — not due yet, have a last result
//   - due-today + Kallelse showing on Home → SUPPRESSED (return null).
//     The bake-off's `rest ? <RecentPassesWithLine> : <RecentPasses>`
//     idea: the line and the Kallelse must not both shout at once. This
//     is the safer default per the brief (a non-null "· idag" micro-state
//     was considered but suppression avoids ANY duplicate CTA surface).
//   - slid/ready  — due, but NOT in today's plan (dismissed, or a
//     scheduling edge case) — "redo när du är", NEVER a day-count,
//     NEVER guilt copy ("sedan", "försenad", …).
//   - no result ever — "inga pass ännu"

import { useNavigate } from '@tanstack/react-router'

import type { MockResultRow } from '@/api/hooks/useMockResults'
import { logMockEvent } from '@/lib/mockEvents'
import type { MockPrescription } from '@/lib/scheduler'

const MONO_TRACK = 'var(--font-mono-track, 0.04em)'

type ProvpassStatusLineProps = {
  prescription: MockPrescription
  lastResult: MockResultRow | null
  /** True when the Kallelse summons is already showing on Home today —
   *  drives the due-today suppression. */
  showingKallelse: boolean
}

function halfLabel(half: MockResultRow['half']): string {
  return half === 'verbal' ? 'Verbal' : 'Kvant'
}

function statusText(props: ProvpassStatusLineProps): string | null {
  const { prescription, lastResult, showingKallelse } = props

  if (prescription.due && showingKallelse) return null

  if (prescription.due) {
    // Slid/ready — due, but not anchoring today's plan. No day-count, no
    // guilt copy — the scheduler already knows it's due; nagging about
    // HOW overdue would violate the no-streak-shame product rule.
    return 'PROVPASS · redo när du är'
  }

  if (!lastResult) {
    return 'PROVPASS · inga pass ännu'
  }

  return `PROVPASS · senast ${halfLabel(lastResult.half)} ${lastResult.correct}/${lastResult.presented} · nästa om ${prescription.daysUntilNext} dagar`
}

export function ProvpassStatusLine(props: ProvpassStatusLineProps) {
  const navigate = useNavigate()
  const text = statusText(props)
  if (text == null) return null

  const handleClick = () => {
    // Every tap on this row opens the Provpass detail (navigate /prov) —
    // there's no separate "start" affordance on the readout itself, so
    // every click is logged as a line-initiated entry into the funnel.
    logMockEvent('started_via_line')
    navigate({ to: '/prov' })
  }

  return (
    <button
      type="button"
      data-testid="provpass-status-line"
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        width: 'calc(100% + 44px)',
        margin: '0 -22px',
        padding: '12px 22px',
        border: 'none',
        borderTop: '1px solid var(--hairline)',
        borderBottom: '1px solid var(--hairline)',
        background: 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: MONO_TRACK,
          color: 'var(--muted)',
          lineHeight: 1.4,
        }}
      >
        {text}
      </span>
      <span aria-hidden style={{ color: 'var(--muted-2)', fontSize: 14, flexShrink: 0 }}>
        ›
      </span>
    </button>
  )
}

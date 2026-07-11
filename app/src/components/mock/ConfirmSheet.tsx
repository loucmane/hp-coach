// ConfirmSheet — the pre-commitment bottom sheet Provpass opens BEFORE any
// clock starts. It is the SINGLE gate: the winning picker (PPH · "Kallelsen
// & registret") auto-picks a sitting's least-seen pass on tap and lands
// here, so this sheet now owns BOTH jobs at once —
//   1. Naming (H's contribution): it is the one surface where the pass
//      NUMBER is reference metadata rather than a menu, so it names exactly
//      what was picked — "Hösten 2025 / Provpass 2 · 40 frågor · 55 minuter"
//      for an authentic pass, "Genererat pass · Verbal · 40 frågor" for a
//      synthetic one. Driven by the optional `target` prop.
//   2. The contract (the old full-page Instructions interstitial this sheet
//      absorbed): the full 6-rule house contract — riktiga provvillkor,
//      ingen feedback, avbryt = ogiltigt, svara på allt. One gate, not two.
//
// This is the ADHD-PI impulsivity guard: a mis-timed start voids the mock,
// so the sheet is the one deliberate gate between "I tapped a sitting" and
// "the 55-minute clock is running". Dismiss (scrim / "Inte nu" / Escape) is
// a zero-penalty back-out — nothing has started yet.

import { useEffect } from 'react'

import type { MockHalf } from '@/api/hooks/useMockResults'
import { formatPass, formatSitting } from '@/lib/examNames'
import { logMockEvent } from '@/lib/mockEvents'

const MONO_TRACK = 'var(--font-mono-track, 0.04em)'

const RULES = [
  '40 frågor',
  '55 minuter',
  'ingen paus',
  'du kan ändra svar tills tiden går ut',
  'avbryter du blir provet ogiltigt',
  'lämna ingen fråga obesvarad — fel ger inga avdrag',
]

function halfLabel(half: MockHalf): string {
  return half === 'verbal' ? 'Verbal' : 'Kvant'
}

/** What is about to start — drives the sheet's naming header. Authentic
 *  carries the sitting + pass + parsed-question count so the header can
 *  name the exact pass the picker auto-selected; synthetic has no single
 *  sitting, so it names the mode + half instead. */
export type ConfirmTarget =
  | { mode: 'authentic'; examId: string; provpass: string; presented: number }
  | { mode: 'synthetic' }

/** The italic heading + mono subline the header renders for a target. */
function targetNaming(
  target: ConfirmTarget | undefined,
  half: MockHalf,
): {
  heading: string
  subline: string
} {
  if (target?.mode === 'authentic') {
    return {
      heading: formatSitting(target.examId),
      subline: `${formatPass(target.provpass)} · ${target.presented} frågor · 55 minuter`,
    }
  }
  if (target?.mode === 'synthetic') {
    return {
      heading: 'Genererat pass',
      subline: `${halfLabel(half)} · 40 frågor · 55 minuter`,
    }
  }
  // Legacy callers (no target): keep the original half-only heading.
  return { heading: `Provpass · ${halfLabel(half)}`, subline: '' }
}

export type ConfirmSheetProps = {
  half: MockHalf
  /** The pass about to start — names the header. Omitted by legacy/dev
   *  callers, which fall back to the half-only "Provpass · {half}". */
  target?: ConfirmTarget
  onConfirm: () => void
  onDismiss: () => void
}

export function ConfirmSheet({ half, target, onConfirm, onDismiss }: ConfirmSheetProps) {
  useEffect(() => {
    logMockEvent('confirm_shown')
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        logMockEvent('confirm_backed_out')
        onDismiss()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onDismiss])

  const handleConfirm = () => {
    logMockEvent('confirm_started')
    onConfirm()
  }

  const handleDismiss = () => {
    logMockEvent('confirm_backed_out')
    onDismiss()
  }

  const naming = targetNaming(target, half)

  return (
    <div data-testid="mock-confirm-sheet" style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
      <button
        type="button"
        aria-label="Stäng"
        data-testid="mock-confirm-scrim"
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          inset: 0,
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          background: 'color-mix(in oklch, var(--ink) 22%, transparent)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--panel)',
          borderTop: '1px solid var(--accent)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: '20px 22px 30px',
          boxShadow: '0 -20px 50px -24px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            width: 38,
            height: 4,
            borderRadius: 999,
            background: 'var(--hairline)',
            margin: '0 auto 18px',
          }}
        />
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
          }}
        >
          Starta provpass
        </div>
        <h2
          className="hpc-m3-display"
          data-testid="mock-confirm-heading"
          style={{
            fontSize: 26,
            margin: naming.subline ? '10px 0 6px' : '10px 0 18px',
            fontStyle: 'italic',
          }}
        >
          {naming.heading}
        </h2>
        {naming.subline && (
          <div
            data-testid="mock-confirm-subline"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: MONO_TRACK,
              color: 'var(--ink-2)',
              fontVariantNumeric: 'tabular-nums',
              margin: '0 0 18px',
            }}
          >
            {naming.subline}
          </div>
        )}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
          {RULES.map((line) => (
            <li
              key={line}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                letterSpacing: MONO_TRACK,
                color: 'var(--ink-2)',
                lineHeight: 1.4,
                display: 'flex',
                gap: 10,
              }}
            >
              <span aria-hidden style={{ color: 'var(--accent)', flexShrink: 0 }}>
                ·
              </span>
              {line}
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 24 }}>
          <button
            type="button"
            className="hpc-m3-cta"
            data-testid="mock-confirm-start"
            onClick={handleConfirm}
            style={{
              background: 'var(--accent)',
              color: 'var(--panel)',
              padding: '11px 20px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Starta nu →
          </button>
          <button
            type="button"
            data-testid="mock-confirm-dismiss"
            onClick={handleDismiss}
            style={{
              all: 'unset',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: MONO_TRACK,
              // WCAG AA: --muted-2 fails 4.5:1 at 12px — --muted passes.
              color: 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            Inte nu
          </button>
        </div>
      </div>
    </div>
  )
}

// ConfirmSheet — the pre-commitment bottom sheet Provpass opens BEFORE any
// clock starts (devbake/NavCtaBakeoff.tsx L766-873 ConfirmSheet()). Real,
// interactive version of the bake-off's static mockup: scrim + sheet panel
// + grab handle, an italic "Provpass · {half}" heading, the full 6-rule
// contract (merged from the old full-page Instructions interstitial this
// sheet replaces — see routes/prov.tsx), a primary "Starta nu →" pill, and
// a quiet zero-penalty "Inte nu".
//
// This is the ADHD-PI impulsivity guard: a mis-timed start voids the mock,
// so the sheet is the one deliberate gate between "I tapped Provpass" and
// "the 55-minute clock is running".

import { useEffect } from 'react'

import type { MockHalf } from '@/api/hooks/useMockResults'
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

export type ConfirmSheetProps = {
  half: MockHalf
  onConfirm: () => void
  onDismiss: () => void
}

export function ConfirmSheet({ half, onConfirm, onDismiss }: ConfirmSheetProps) {
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
          Provpass
        </div>
        <h2
          className="hpc-m3-display"
          style={{ fontSize: 26, margin: '10px 0 18px', fontStyle: 'italic' }}
        >
          Provpass · {halfLabel(half)}
        </h2>
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
              color: 'var(--muted-2)',
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

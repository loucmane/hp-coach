// LeaveConfirmSheet — the back-trap confirm inside an ACTIVE drill/
// diagnostic session (P2 dogfood finding 3: a reflexive back-swipe from
// question 2 of the diagnostic silently discarded the whole session).
//
// Same quiet bottom-sheet idiom as ImportConfirmSheet / the Provpass
// ConfirmSheet, scaled to one fact: leaving now discards the answers so
// far. Weighting is deliberately inverted from a destructive dialog —
// "Fortsätt öva" is the accent PRIMARY (staying is the encouraged,
// zero-cost path for an ADHD-PI user mid-flow) and "Avsluta" is the
// quiet mono secondary. Scrim tap and Escape both mean "stay": the only
// way to lose work is the one explicit word.

import { useEffect } from 'react'

const MONO_TRACK = 'var(--font-mono-track, 0.04em)'

export type LeaveConfirmSheetProps = {
  /** Stay in the session (primary, scrim, Escape). */
  onContinue: () => void
  /** Leave for real — the caller performs the actual history back. */
  onLeave: () => void
}

export function LeaveConfirmSheet({ onContinue, onLeave }: LeaveConfirmSheetProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onContinue()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onContinue])

  return (
    <div data-testid="session-leave-sheet" style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
      <button
        type="button"
        aria-label="Fortsätt öva"
        data-testid="session-leave-scrim"
        onClick={onContinue}
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
          Pågående övning
        </div>
        <h2
          className="hpc-m3-display"
          style={{ fontSize: 24, margin: '10px 0 14px', fontStyle: 'italic' }}
        >
          Avsluta övningen?
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: MONO_TRACK,
            color: 'var(--ink-2)',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Dina svar hittills sparas inte.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 24 }}>
          <button
            type="button"
            className="hpc-m3-cta"
            data-testid="session-leave-continue"
            onClick={onContinue}
            style={{
              background: 'var(--accent)',
              color: 'var(--panel)',
              padding: '11px 20px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Fortsätt öva
          </button>
          <button
            type="button"
            data-testid="session-leave-exit"
            onClick={onLeave}
            style={{
              all: 'unset',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: MONO_TRACK,
              color: 'var(--muted-2)',
              cursor: 'pointer',
            }}
          >
            Avsluta
          </button>
        </div>
      </div>
    </div>
  )
}

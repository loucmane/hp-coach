// ImportConfirmSheet — the zero-penalty confirmation gate in front of
// POST /api/me/import (task #28, data export/import).
//
// Import is OVERWRITE mode server-side: everything currently in D1 for
// this user is deleted and replaced by the uploaded snapshot. That's
// silent and irreversible from the UI's perspective, so this sheet is
// the one deliberate stop between "picked a file" and "the request
// fires" — mirrors the ADHD-PI impulsivity-guard pattern already used
// for Provpass (components/mock/ConfirmSheet.tsx), scaled down: no
// rules list, just the one fact that matters (this REPLACES your data)
// stated plainly in Swedish, plus a quiet, equally-weighted "Avbryt".

const MONO_TRACK = 'var(--font-mono-track, 0.04em)'

export type ImportConfirmSheetProps = {
  onConfirm: () => void
  onCancel: () => void
}

export function ImportConfirmSheet({ onConfirm, onCancel }: ImportConfirmSheetProps) {
  return (
    <div data-testid="import-confirm-sheet" style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
      <button
        type="button"
        aria-label="Stäng"
        data-testid="import-confirm-scrim"
        onClick={onCancel}
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
          Importera data
        </div>
        <h2
          className="hpc-m3-display"
          style={{ fontSize: 24, margin: '10px 0 14px', fontStyle: 'italic' }}
        >
          Detta ersätter all din nuvarande data
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
          Allt du har idag — pass, misstag, inställningar, provresultat — skrivs över med innehållet
          i filen. Det går inte att ångra.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 24 }}>
          <button
            type="button"
            className="hpc-m3-cta"
            data-testid="import-confirm-proceed"
            onClick={onConfirm}
            style={{
              background: 'var(--accent)',
              color: 'var(--panel)',
              padding: '11px 20px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Ersätt min data →
          </button>
          <button
            type="button"
            data-testid="import-confirm-cancel"
            onClick={onCancel}
            style={{
              all: 'unset',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: MONO_TRACK,
              color: 'var(--muted-2)',
              cursor: 'pointer',
            }}
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  )
}

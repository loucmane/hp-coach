// AdaptiveReviewOffer — the zero-guilt hot-trap detour offer (task #16).
//
// Shown ONCE at the start of a normal drill when the learner has a hot trap
// (>=3 misses on one framework in the last 7 days). House voice: compact,
// no exclamation marks, no counter, no guilt. Declining is one tap — no
// confirm. Follows the ConfirmSheet idiom but LIGHTER: this is an inline
// insert on the idle masthead, not a modal scrim/gate, and it wears the M3
// Boksidan chassis — hairlines, muted ink, no card shadows.
//
// The two actions:
//   "Ja"       → solid pill; runs the targeted detour (parent navigates).
//   "Inte nu"  → quiet mono link; starts the original drill immediately.

const MONO_TRACK = 'var(--font-mono-track, 0.04em)'

export type AdaptiveReviewOfferProps = {
  /** Plain-Swedish trap name (from the framework catalog); falls back to the
   *  framework_id when the catalog headline hasn't resolved. */
  trapName: string
  /** Section code for the mono eyebrow (e.g. "DTK"). */
  section: string
  onAccept: () => void
  onDecline: () => void
}

export function AdaptiveReviewOffer({
  trapName,
  section,
  onAccept,
  onDecline,
}: AdaptiveReviewOfferProps) {
  return (
    <div
      data-testid="adaptive-review-offer"
      style={{
        // Inline insert — a hairline-bounded panel, NO shadow, NO scrim.
        border: '1px solid var(--hairline)',
        borderRadius: 'calc(var(--radius) * 0.5)',
        background: 'var(--panel)',
        padding: '18px 20px 20px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        {section} · Återkommande fälla
      </div>
      <h2
        className="hpc-m3-display"
        style={{
          fontSize: 22,
          fontStyle: 'italic',
          margin: '10px 0 8px',
          color: 'var(--ink)',
          lineHeight: 1.15,
        }}
      >
        {trapName}
      </h2>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          lineHeight: 1.5,
          color: 'var(--ink-2)',
          maxWidth: '44ch',
        }}
      >
        Tre missar på samma fälla senaste veckan — 5 min riktad repetition först?
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 18 }}>
        <button
          type="button"
          className="hpc-m3-cta"
          data-testid="adaptive-review-accept"
          onClick={onAccept}
          style={{
            background: 'var(--ink)',
            color: 'var(--panel)',
            padding: '10px 22px',
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Ja →
        </button>
        <button
          type="button"
          data-testid="adaptive-review-decline"
          onClick={onDecline}
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
  )
}

// MarkAsReadPill — small toggle affordance at the bottom of every
// expanded Lektion card. Tap once to mark as read (drives the daily
// plan's lesson auto-completion); tap again to unmark.
//
// Sits next to the "Öva..." link in each card's expanded footer. When
// `read`, renders as a muted "Läst ✓" label that's still clickable as
// an escape hatch.

type MarkAsReadPillProps = {
  read: boolean
  onToggle: () => void
}

export function MarkAsReadPill({ read, onToggle }: MarkAsReadPillProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      data-testid="lesson-mark-as-read"
      data-read={read ? 'true' : 'false'}
      style={{
        background: 'transparent',
        border: '1px solid var(--hairline)',
        borderRadius: 999,
        padding: '4px 12px',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: read ? 'var(--muted)' : 'var(--ink-2)',
        cursor: 'pointer',
      }}
    >
      {read ? 'Läst ✓' : 'Markera som läst'}
    </button>
  )
}

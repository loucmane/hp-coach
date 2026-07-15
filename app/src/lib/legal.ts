// The two public legal surfaces, linked from the /mer hub and /konto
// footers (NOT from the nav rail or phone tabs). Exported as data so the
// discoverability contract can be pinned in a unit test — the same idiom
// as mer.tsx's TOOLS list.

export const LEGAL_LINKS = [
  { to: '/integritet', label: 'Integritetspolicy' },
  { to: '/villkor', label: 'Användarvillkor' },
] as const

// Shared muted-mono grammar for the footer rows (same register as the
// "← tillbaka hem" back link).
export const LEGAL_LINK_STYLE = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  textDecoration: 'none',
} as const

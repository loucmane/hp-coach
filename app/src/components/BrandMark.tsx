// BrandMark — Phase A.7 typographic identity element.
//
// "HP-COACH" set in small-caps Newsreader with positive tracking,
// preceded by a thin `⌜` corner-bracket glyph that anchors the mark
// to the top-left of whatever band it appears in. The corner bracket
// is the only ornamental flourish in the entire design language —
// every other element earns its weight through type or layout, not
// decoration. The mark appears in three places:
//
//   - DesktopNav (left of the top nav band, reader/studio)
//   - Phone status bar overlay (anchors the canonical iOS chrome)
//   - Auth headers (above the form card at all viewports)
//
// No SVG logomark in this phase. Pure type. Phase C delivers the
// real visual identity when brand voice copy lands.

import type { CSSProperties } from 'react'

type Props = {
  /** Size variant — `default` is 13px (nav, headers); `lg` is 18px
   *  (used when the BrandMark stands alone as the only chrome,
   *  e.g., the auth screen kicker row). */
  size?: 'default' | 'lg'
  style?: CSSProperties
  /** Drop the leading `⌜` bracket. Used when the mark sits inside
   *  a context that already has its own framing (e.g., a chip). */
  noBracket?: boolean
}

export function BrandMark({ size = 'default', style, noBracket = false }: Props) {
  const fontSize = size === 'lg' ? 18 : 13
  return (
    <span
      data-testid="brand-mark"
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: noBracket ? 0 : 6,
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        fontSize,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--ink)',
        ...style,
      }}
    >
      {!noBracket && (
        <span
          aria-hidden
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--muted)',
            fontSize: fontSize * 0.85,
            letterSpacing: 0,
          }}
        >
          ⌜
        </span>
      )}
      HP-Coach
    </span>
  )
}

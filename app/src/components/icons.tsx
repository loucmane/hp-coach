// HP-Coach icon set — Lucide-flavored, stroke 1.6, currentColor.
// Ported from the design prototype `I` registry (components.jsx).
// Inline SVG by design: no library, perfect tree-shaking, currentColor honored.
//
// All icons are decorative by default (`aria-hidden`). Their parent control
// owns the accessible name. To use one as the only accessible content, pass
// `title=` plus `aria-hidden={false}` and a sensible `role="img"`.

import type { SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement> & { s?: number; title?: string }

const base = (s = 16): SVGProps<SVGSVGElement> => ({
  width: s,
  height: s,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
})

const wrap = (
  s: number | undefined,
  title: string | undefined,
  rest: Omit<IconProps, 's' | 'title'>,
  children: React.ReactNode,
  strokeWidth?: number,
) => {
  // Two explicit branches so the lint can statically verify each <svg> is
  // either decorative (aria-hidden) or labeled (<title>). The conditional-
  // attribute pattern is clever but trips biome's a11y static analysis.
  if (title) {
    return (
      <svg
        {...base(s)}
        role="img"
        aria-label={title}
        {...(strokeWidth ? { strokeWidth } : {})}
        {...rest}
      >
        <title>{title}</title>
        {children}
      </svg>
    )
  }
  return (
    <svg
      {...base(s)}
      aria-hidden="true"
      focusable="false"
      {...(strokeWidth ? { strokeWidth } : {})}
      {...rest}
    >
      {children}
    </svg>
  )
}

export const ArrowRight = ({ s, title, ...p }: IconProps) =>
  wrap(s, title, p, <path d="M5 12h14M13 5l7 7-7 7" />)
export const ArrowLeft = ({ s, title, ...p }: IconProps) =>
  wrap(s, title, p, <path d="M19 12H5M11 5l-7 7 7 7" />)
export const Check = ({ s, title, ...p }: IconProps) =>
  wrap(s, title, p, <path d="M20 6L9 17l-5-5" />, 1.8)
export const X = ({ s, title, ...p }: IconProps) =>
  wrap(s, title, p, <path d="M18 6L6 18M6 6l12 12" />)
export const Pencil = ({ s, title, ...p }: IconProps) =>
  wrap(s, title, p, <path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />)
export const Search = ({ s, title, ...p }: IconProps) =>
  wrap(
    s,
    title,
    p,
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>,
  )
export const Home = ({ s, title, ...p }: IconProps) =>
  wrap(s, title, p, <path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V11z" />)
export const Chart = ({ s, title, ...p }: IconProps) =>
  wrap(s, title, p, <path d="M3 21V5M3 21h18M7 17V11M12 17V8M17 17V13" />)
export const User = ({ s, title, ...p }: IconProps) =>
  wrap(
    s,
    title,
    p,
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </>,
  )
export const Cmd = ({ s, title, ...p }: IconProps) =>
  wrap(
    s ?? 14,
    title,
    p,
    <path d="M9 9V6a3 3 0 113 3H9zm0 0v6m0 0v3a3 3 0 11-3-3h3zm0 0h6m0 0V6a3 3 0 113 3h-3zm0 0v6m0 0v3a3 3 0 11-3-3h3z" />,
  )
export const Book = ({ s, title, ...p }: IconProps) =>
  wrap(
    s,
    title,
    p,
    <>
      <path d="M4 5a2 2 0 012-2h13v15H6a2 2 0 00-2 2V5z" />
      <path d="M4 19a2 2 0 012-2h13" />
    </>,
  )

// ── Primary-nav glyph system ────────────────────────────────────────
//
// The five door glyphs for the collapsed rail spine, promoted from the
// nav bake-off (NavSpineIcons.tsx, owner verdict 2026-07-11). One
// engraver's plate: every glyph stands on a shared ground band at
// y≈20.3, one dominant mass, no interior detail that dies at 18px.
// Same house law as the icons above — 24×24 viewBox, stroke 1.6,
// currentColor, decorative-by-default via wrap(). The accent is applied
// by the caller (active door = accent), never baked into the glyph.

/** Hem — floating eave chevron over walls; door as a single slit. */
export const GlyphHem = ({ s, title, ...p }: IconProps) =>
  wrap(
    s,
    title,
    p,
    <>
      <path d="M3.5 10.6 12 3.6l8.5 7" />
      <path d="M5.7 9.6v10.7h12.6V9.6" />
      <path d="M12 20.3v-4.4" />
    </>,
  )

/** Öva — pencil with the line it just wrote (the ground band). */
export const GlyphOva = ({ s, title, ...p }: IconProps) =>
  wrap(
    s,
    title,
    p,
    <>
      <path d="M16.2 3.8a2.05 2.05 0 0 1 2.9 2.9L7.6 18.2l-3.9 1.1 1.1-3.9z" />
      <path d="M12.6 20.3h7.9" />
    </>,
  )

/** Provpass — stopwatch: flat crown, one sweep hand. */
export const GlyphProvpass = ({ s, title, ...p }: IconProps) =>
  wrap(
    s,
    title,
    p,
    <>
      <circle cx="12" cy="13.7" r="6.6" />
      <path d="M9.9 2.6h4.2M12 2.6v4.5" />
      <path d="M12 13.7l3.1-3.1" />
    </>,
  )

/** Uppslag — the open spread, gutter marked. */
export const GlyphUppslag = ({ s, title, ...p }: IconProps) =>
  wrap(
    s,
    title,
    p,
    <>
      <path d="M12 7.2C10.1 5.6 7.3 4.9 3.4 4.9v13.4c3.9 0 6.7.7 8.6 2.3 1.9-1.6 4.7-2.3 8.6-2.3V4.9c-3.9 0-6.7.7-8.6 2.3z" />
      <path d="M12 7.2v13.4" />
    </>,
  )

/** Framsteg — "Din kurva": the ascending curve over the ground rule. */
export const GlyphFramsteg = ({ s, title, ...p }: IconProps) =>
  wrap(
    s,
    title,
    p,
    <>
      <path d="M3.5 20.3h17" />
      <path d="M4.6 16.6l4.8-4.6 3.4 2.7 6.6-7" />
    </>,
  )

// HP-Coach icon set — Lucide-flavored, stroke 1.6, currentColor.
// Ported from the design prototype `I` registry (components.jsx).
// Inline SVG by design: no library, perfect tree-shaking, currentColor honored.
//
// All icons are decorative by default (`aria-hidden`). Their parent control
// owns the accessible name. To use one as the only accessible content, pass
// `title=` plus `aria-hidden={false}` and a sensible `role="img"`.

import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { s?: number; title?: string }

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

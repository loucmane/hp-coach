// HP-Coach icon set — Lucide-flavored, stroke 1.6, currentColor.
// Ported from the design prototype `I` registry (components.jsx).
// Inline SVG by design: no library, perfect tree-shaking, currentColor honored.

import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { s?: number }

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

export const ArrowRight = ({ s, ...p }: IconProps) => (
  <svg {...base(s)} {...p}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
)
export const ArrowLeft = ({ s, ...p }: IconProps) => (
  <svg {...base(s)} {...p}>
    <path d="M19 12H5M11 5l-7 7 7 7" />
  </svg>
)
export const Check = ({ s, ...p }: IconProps) => (
  <svg {...base(s)} strokeWidth={1.8} {...p}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
)
export const X = ({ s, ...p }: IconProps) => (
  <svg {...base(s)} {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)
export const Pencil = ({ s, ...p }: IconProps) => (
  <svg {...base(s)} {...p}>
    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
)
export const Search = ({ s, ...p }: IconProps) => (
  <svg {...base(s)} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
)
export const Home = ({ s, ...p }: IconProps) => (
  <svg {...base(s)} {...p}>
    <path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V11z" />
  </svg>
)
export const Chart = ({ s, ...p }: IconProps) => (
  <svg {...base(s)} {...p}>
    <path d="M3 21V5M3 21h18M7 17V11M12 17V8M17 17V13" />
  </svg>
)
export const User = ({ s, ...p }: IconProps) => (
  <svg {...base(s)} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
)
export const Cmd = ({ s, ...p }: IconProps) => (
  <svg {...base(s ?? 14)} {...p}>
    <path d="M9 9V6a3 3 0 113 3H9zm0 0v6m0 0v3a3 3 0 11-3-3h3zm0 0h6m0 0V6a3 3 0 113 3h-3zm0 0v6m0 0v3a3 3 0 11-3-3h3z" />
  </svg>
)

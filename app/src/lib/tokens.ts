// HP-Coach design tokens — typed source of truth.
//
// Values mirror the OKLCH variables in src/index.css (Sand palette).
// Use this when you need a token in JS land (canvas, charts, sparklines,
// inline SVG fills computed at runtime). The CSS layer remains canonical
// for styling — keep it in sync. A snapshot test in tokens.test.ts pins
// both palettes so silent drift fails CI.

export type ThemeMode = 'light' | 'dark'

export type SandPalette = {
  // Surfaces
  bg: string
  panel: string
  panel2: string
  ink: string
  ink2: string
  muted: string
  muted2: string
  hairline: string
  hairline2: string
  // Accent
  accent: string
  accentInk: string
  accentSoft: string
  // Semantic
  ok: string
  warn: string
  bad: string
  okSoft: string
  badSoft: string
}

export const SAND_LIGHT: SandPalette = {
  bg: 'oklch(0.97 0.011 78)',
  panel: 'oklch(0.99 0.008 80)',
  panel2: 'oklch(0.955 0.012 78)',
  ink: 'oklch(0.18 0.011 70)',
  ink2: 'oklch(0.32 0.013 70)',
  muted: 'oklch(0.51 0.017 70)',
  muted2: 'oklch(0.68 0.014 70)',
  hairline: 'oklch(0.88 0.012 70)',
  hairline2: 'oklch(0.92 0.012 70)',
  accent: 'oklch(0.61 0.13 42)',
  accentInk: 'oklch(0.99 0.008 80)',
  accentSoft: 'oklch(0.91 0.05 50)',
  ok: 'oklch(0.55 0.10 145)',
  warn: 'oklch(0.65 0.13 70)',
  bad: 'oklch(0.55 0.16 25)',
  okSoft: 'oklch(0.93 0.04 145)',
  badSoft: 'oklch(0.93 0.05 25)',
}

export const SAND_DARK: SandPalette = {
  bg: 'oklch(0.16 0.008 70)',
  panel: 'oklch(0.20 0.010 70)',
  panel2: 'oklch(0.235 0.011 70)',
  ink: 'oklch(0.96 0.008 78)',
  ink2: 'oklch(0.82 0.010 78)',
  muted: 'oklch(0.62 0.014 70)',
  muted2: 'oklch(0.48 0.014 70)',
  hairline: 'oklch(0.30 0.012 70)',
  hairline2: 'oklch(0.26 0.012 70)',
  accent: 'oklch(0.72 0.12 42)',
  accentInk: 'oklch(0.16 0.008 70)',
  accentSoft: 'oklch(0.32 0.06 50)',
  ok: 'oklch(0.72 0.11 145)',
  warn: 'oklch(0.78 0.12 70)',
  bad: 'oklch(0.70 0.14 25)',
  okSoft: 'oklch(0.28 0.04 145)',
  badSoft: 'oklch(0.30 0.06 25)',
}

export const PALETTE: Record<ThemeMode, SandPalette> = {
  light: SAND_LIGHT,
  dark: SAND_DARK,
}

// Density scale — keeps with the editorial Sand grammar.
// `regular` is the prototype default. `compact` trims gaps for users who
// prefer denser screens (toggled from /dev or settings).
export type Density = 'regular' | 'compact'

export const DENSITY: Record<Density, { pad: string; padLg: string; gap: string; radius: string }> =
  {
    regular: { pad: '18px', padLg: '22px', gap: '14px', radius: '18px' },
    compact: { pad: '14px', padLg: '18px', gap: '10px', radius: '14px' },
  }

// Typography stack — mirrors the @import in index.css. Exported for cases
// where charts/SVG render text outside the cascade.
export const FONTS = {
  display: '"Newsreader", "Times New Roman", Georgia, serif',
  ui: '"Inter Tight", "Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
} as const

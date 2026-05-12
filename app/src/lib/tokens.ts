// HP-Coach design tokens — typed source of truth.
//
// Four palettes (Sand, Sage, Ink, Rose) × light/dark = 8 OKLCH variants.
// Four font pairings (Literary, Geometric, Editorial, Hyperlegible).
// Three densities (Compact, Regular, Comfy).
//
// Ported from the prototype's tokens.jsx so production matches the design
// canvas exactly. The CSS file in src/index.css ships Sand-light values
// as a no-flash fallback; everything beyond that is written to <html>
// inline by `applyThemeToDocument` (uiStore subscription) so we never
// need 8 root selectors. Snapshot tests in tokens.test.ts pin every
// value — silent drift fails CI.

export type ThemeMode = 'light' | 'dark'

export type PaletteKey = 'sand' | 'sage' | 'ink' | 'rose'
export type FontKey = 'literary' | 'geometric' | 'editorial' | 'hyperlegible'
export type Density = 'compact' | 'regular' | 'comfy'

export type SandShape = {
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

type Palette = { label: string; light: SandShape; dark: SandShape }

export const PALETTES: Record<PaletteKey, Palette> = {
  sand: {
    label: 'Sand',
    light: {
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
    },
    dark: {
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
    },
  },
  sage: {
    label: 'Sage',
    light: {
      bg: 'oklch(0.965 0.012 175)',
      panel: 'oklch(0.99 0.008 175)',
      panel2: 'oklch(0.95 0.013 175)',
      ink: 'oklch(0.20 0.020 200)',
      ink2: 'oklch(0.34 0.022 200)',
      muted: 'oklch(0.50 0.020 200)',
      muted2: 'oklch(0.66 0.018 200)',
      hairline: 'oklch(0.87 0.014 175)',
      hairline2: 'oklch(0.92 0.012 175)',
      // Phase A.8 — bumped chroma from 0.085 → 0.13 so Sage has the
      // same accent strength as Sand (0.13), Ink (0.13), Rose (0.14).
      // Phase A.7 audit flagged this as the reason Home in Sage mode
      // read as monochrome — accent was too washed-out to land.
      accent: 'oklch(0.52 0.13 195)',
      accentInk: 'oklch(0.99 0.008 175)',
      accentSoft: 'oklch(0.90 0.06 195)',
      ok: 'oklch(0.55 0.10 155)',
      warn: 'oklch(0.65 0.12 70)',
      bad: 'oklch(0.55 0.15 25)',
      okSoft: 'oklch(0.92 0.04 155)',
      badSoft: 'oklch(0.93 0.05 25)',
    },
    dark: {
      bg: 'oklch(0.18 0.014 200)',
      panel: 'oklch(0.22 0.016 200)',
      panel2: 'oklch(0.255 0.018 200)',
      ink: 'oklch(0.96 0.008 175)',
      ink2: 'oklch(0.82 0.012 175)',
      muted: 'oklch(0.62 0.018 200)',
      muted2: 'oklch(0.48 0.018 200)',
      hairline: 'oklch(0.30 0.018 200)',
      hairline2: 'oklch(0.26 0.018 200)',
      // Phase A.8 — match the light-mode chroma bump.
      accent: 'oklch(0.70 0.13 195)',
      accentInk: 'oklch(0.18 0.014 200)',
      accentSoft: 'oklch(0.32 0.07 195)',
      ok: 'oklch(0.72 0.11 155)',
      warn: 'oklch(0.78 0.12 70)',
      bad: 'oklch(0.70 0.13 25)',
      okSoft: 'oklch(0.28 0.04 155)',
      badSoft: 'oklch(0.30 0.06 25)',
    },
  },
  ink: {
    label: 'Ink',
    light: {
      bg: 'oklch(0.97 0.008 250)',
      panel: 'oklch(0.99 0.005 250)',
      panel2: 'oklch(0.945 0.010 250)',
      ink: 'oklch(0.19 0.040 260)',
      ink2: 'oklch(0.32 0.045 260)',
      muted: 'oklch(0.50 0.025 260)',
      muted2: 'oklch(0.68 0.018 260)',
      hairline: 'oklch(0.88 0.014 250)',
      hairline2: 'oklch(0.93 0.010 250)',
      accent: 'oklch(0.36 0.13 265)',
      accentInk: 'oklch(0.99 0.005 250)',
      accentSoft: 'oklch(0.92 0.05 100)' /* lemon */,
      ok: 'oklch(0.55 0.10 150)',
      warn: 'oklch(0.78 0.13 95)',
      bad: 'oklch(0.55 0.16 25)',
      okSoft: 'oklch(0.93 0.04 150)',
      badSoft: 'oklch(0.93 0.05 25)',
    },
    dark: {
      bg: 'oklch(0.17 0.020 260)',
      panel: 'oklch(0.21 0.024 260)',
      panel2: 'oklch(0.245 0.028 260)',
      ink: 'oklch(0.96 0.008 250)',
      ink2: 'oklch(0.82 0.012 250)',
      muted: 'oklch(0.62 0.020 260)',
      muted2: 'oklch(0.48 0.020 260)',
      hairline: 'oklch(0.31 0.022 260)',
      hairline2: 'oklch(0.27 0.022 260)',
      accent: 'oklch(0.78 0.15 95)' /* lemon as accent in dark */,
      accentInk: 'oklch(0.17 0.020 260)',
      accentSoft: 'oklch(0.34 0.08 95)',
      ok: 'oklch(0.72 0.11 150)',
      warn: 'oklch(0.78 0.13 95)',
      bad: 'oklch(0.70 0.14 25)',
      okSoft: 'oklch(0.28 0.04 150)',
      badSoft: 'oklch(0.30 0.06 25)',
    },
  },
  rose: {
    label: 'Rose',
    light: {
      bg: 'oklch(0.97 0.011 25)',
      panel: 'oklch(0.99 0.008 25)',
      panel2: 'oklch(0.95 0.013 25)',
      ink: 'oklch(0.19 0.014 20)',
      ink2: 'oklch(0.33 0.016 20)',
      muted: 'oklch(0.51 0.020 20)',
      muted2: 'oklch(0.68 0.016 20)',
      hairline: 'oklch(0.88 0.014 20)',
      hairline2: 'oklch(0.93 0.011 20)',
      accent: 'oklch(0.58 0.14 15)',
      accentInk: 'oklch(0.99 0.008 25)',
      accentSoft: 'oklch(0.91 0.05 15)',
      ok: 'oklch(0.55 0.10 145)',
      warn: 'oklch(0.65 0.13 70)',
      bad: 'oklch(0.55 0.16 25)',
      okSoft: 'oklch(0.93 0.04 145)',
      badSoft: 'oklch(0.93 0.05 25)',
    },
    dark: {
      bg: 'oklch(0.17 0.012 20)',
      panel: 'oklch(0.21 0.014 20)',
      panel2: 'oklch(0.245 0.016 20)',
      ink: 'oklch(0.96 0.008 25)',
      ink2: 'oklch(0.82 0.012 25)',
      muted: 'oklch(0.62 0.018 20)',
      muted2: 'oklch(0.48 0.018 20)',
      hairline: 'oklch(0.30 0.016 20)',
      hairline2: 'oklch(0.26 0.016 20)',
      accent: 'oklch(0.72 0.13 15)',
      accentInk: 'oklch(0.17 0.012 20)',
      accentSoft: 'oklch(0.32 0.06 15)',
      ok: 'oklch(0.72 0.11 145)',
      warn: 'oklch(0.78 0.12 70)',
      bad: 'oklch(0.70 0.14 25)',
      okSoft: 'oklch(0.28 0.04 145)',
      badSoft: 'oklch(0.30 0.06 25)',
    },
  },
}

export type FontPairing = {
  label: string
  display: string
  displayWeight: number
  displayTracking: string
  displayLeading: number
  ui: string
  uiTracking: string
  mono: string
  monoTracking: string
}

export const FONTS: Record<FontKey, FontPairing> = {
  literary: {
    label: 'Literary',
    display: '"Newsreader", "Times New Roman", Georgia, serif',
    displayWeight: 500,
    displayTracking: '-0.022em',
    displayLeading: 1.06,
    ui: '"Inter Tight", "Inter", system-ui, sans-serif',
    uiTracking: '-0.01em',
    mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
    monoTracking: '0.04em',
  },
  geometric: {
    label: 'Geometric',
    display: '"Geist", "Inter", system-ui, sans-serif',
    displayWeight: 500,
    displayTracking: '-0.025em',
    displayLeading: 1.05,
    ui: '"Geist", "Inter", system-ui, sans-serif',
    uiTracking: '-0.012em',
    mono: '"Geist Mono", ui-monospace, monospace',
    monoTracking: '0.02em',
  },
  editorial: {
    label: 'Editorial',
    display: '"Instrument Serif", "Times New Roman", Georgia, serif',
    displayWeight: 400,
    displayTracking: '-0.015em',
    displayLeading: 1.02,
    ui: '"DM Sans", system-ui, sans-serif',
    uiTracking: '-0.008em',
    mono: '"JetBrains Mono", ui-monospace, monospace',
    monoTracking: '0.04em',
  },
  hyperlegible: {
    label: 'Hyperlegible',
    display: '"Atkinson Hyperlegible", system-ui, sans-serif',
    displayWeight: 700,
    displayTracking: '-0.01em',
    displayLeading: 1.1,
    ui: '"Atkinson Hyperlegible", system-ui, sans-serif',
    uiTracking: '0em',
    mono: '"JetBrains Mono", ui-monospace, monospace',
    monoTracking: '0.04em',
  },
}

export type DensityVars = {
  label: string
  pad: number
  padLg: number
  gap: number
  gapLg: number
  radius: number
  title: number
}

export const DENSITIES: Record<Density, DensityVars> = {
  compact: { label: 'Compact', pad: 14, padLg: 18, gap: 10, gapLg: 14, radius: 14, title: 26 },
  regular: { label: 'Regular', pad: 18, padLg: 22, gap: 14, gapLg: 18, radius: 18, title: 30 },
  comfy: { label: 'Comfy', pad: 22, padLg: 26, gap: 18, gapLg: 22, radius: 22, title: 34 },
}

/**
 * Build a fluid clamp() between a stepwise base (mobile, 390px viewport) and
 * an aspirational max (reader/studio, ~1440px viewport).
 *
 * The interpolation hits the max around 1440px viewport width — beyond that
 * the value plateaus, preventing pad/gap from inflating on ultra-wide
 * monitors where it'd just look spongy.
 *
 * Slope tuning: (max - base) * 100 / (1440 - 390) ≈ 0.0952 per vw. For a
 * 22px → 36px scale that's about 1.33vw of slope. We use a slightly tighter
 * 0.7vw so the fluid effect is felt but not theatrical.
 */
function fluidPx(base: number, max: number): string {
  const slope = ((max - base) / (1440 - 390)) * 100 // % of vw
  // Base in rem (assuming 16px html font-size) so the user's browser zoom
  // affects the floor too. base/16 = rem equivalent.
  const baseRem = (base / 16).toFixed(4)
  return `clamp(${base}px, ${baseRem}rem + ${slope.toFixed(2)}vw, ${max}px)`
}

/**
 * Build the full set of CSS variables for a given theme combination.
 * Output is a flat `Record<string, string>` of `--name → value`.
 *
 * The CSS variable names match the prototype convention 1:1, so any code
 * that reads `var(--bg)`, `var(--accent)`, `var(--font-display)` etc. just
 * works regardless of which palette/font/density is active.
 *
 * `useFluid` (Phase A responsive) — when true, density vars use clamp()
 * so spacing scales smoothly across viewport widths. When false, the
 * canonical mobile baseline applies at every width (current behavior).
 */
export function buildThemeVars(
  palette: PaletteKey,
  mode: ThemeMode,
  fontKey: FontKey,
  density: Density,
  useFluid = true,
): Record<string, string> {
  const colors = PALETTES[palette][mode]
  const f = FONTS[fontKey]
  const d = DENSITIES[density]

  // Density-vars fluid maxes — scale by ~1.4–1.6× from baseline. Title
  // gets a more dramatic stretch (it's a headline; bigger viewports want
  // bigger headlines) than pad/gap (chrome should not balloon).
  const pad = useFluid ? fluidPx(d.pad, Math.round(d.pad * 1.55)) : `${d.pad}px`
  const padLg = useFluid ? fluidPx(d.padLg, Math.round(d.padLg * 1.8)) : `${d.padLg}px`
  const gap = useFluid ? fluidPx(d.gap, Math.round(d.gap * 1.55)) : `${d.gap}px`
  const gapLg = useFluid ? fluidPx(d.gapLg, Math.round(d.gapLg * 1.55)) : `${d.gapLg}px`
  const title = useFluid ? fluidPx(d.title, Math.round(d.title * 1.6)) : `${d.title}px`

  const vars: Record<string, string> = {
    // colors
    '--bg': colors.bg,
    '--panel': colors.panel,
    '--panel-2': colors.panel2,
    '--ink': colors.ink,
    '--ink-2': colors.ink2,
    '--muted': colors.muted,
    '--muted-2': colors.muted2,
    '--hairline': colors.hairline,
    '--hairline-2': colors.hairline2,
    '--accent': colors.accent,
    '--accent-ink': colors.accentInk,
    '--accent-soft': colors.accentSoft,
    '--ok': colors.ok,
    '--warn': colors.warn,
    '--bad': colors.bad,
    '--ok-soft': colors.okSoft,
    '--bad-soft': colors.badSoft,
    // typography
    '--font-display': f.display,
    '--font-display-w': String(f.displayWeight),
    '--font-display-track': f.displayTracking,
    '--font-display-lead': String(f.displayLeading),
    '--font-ui': f.ui,
    '--font-ui-track': f.uiTracking,
    '--font-mono': f.mono,
    '--font-mono-track': f.monoTracking,
    // density (fluid-aware)
    '--pad': pad,
    '--pad-lg': padLg,
    '--gap': gap,
    '--gap-lg': gapLg,
    '--radius': `${d.radius}px`,
    '--title-size': title,
    // metadata
    '--scheme': mode,
    '--fluid': useFluid ? '1' : '0',
  }
  return vars
}

/** Default theme: matches the prototype canvas defaults so first paint is calm. */
export const DEFAULT_THEME = {
  palette: 'sand' as PaletteKey,
  mode: 'light' as ThemeMode,
  font: 'literary' as FontKey,
  density: 'regular' as Density,
  useFluid: true,
  studioRails: false,
}

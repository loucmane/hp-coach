import { type FolioMotionLevel, useFolioMotionLevel } from './useFolioRootAttrs'

/** The motion tokens of the Ljusbord system.css (`--fa-ease`, `--fa-d1..d3`); durations in ms. */
export const FOLIO_MOTION_TOKENS = {
  ease: [0.2, 0.7, 0.2, 1],
  durations: { d1: 140, d2: 260, d3: 600 },
} as const

export type FolioMotion = {
  /** Full motion: transforms, drawing and smooth scrolling. */
  allowed: boolean
  /** `less` still allows opacity fades; `none` allows nothing. */
  level: FolioMotionLevel
  durations: typeof FOLIO_MOTION_TOKENS.durations
  ease: typeof FOLIO_MOTION_TOKENS.ease
  /** For `scrollIntoView` and `scrollTo`. */
  scrollBehavior: ScrollBehavior
}

function motionAt(level: FolioMotionLevel): FolioMotion {
  const allowed = level === 'full'
  return { allowed, level, ...FOLIO_MOTION_TOKENS, scrollBehavior: allowed ? 'smooth' : 'auto' }
}

// One object per level, so consumers can use it as an effect dependency.
const BY_LEVEL: Record<FolioMotionLevel, FolioMotion> = {
  full: motionAt('full'),
  less: motionAt('less'),
  none: motionAt('none'),
}

/**
 * Whether motion is allowed (the Konto Rörelse pref resolved against
 * `prefers-reduced-motion`), plus the token durations. JS motion (smooth
 * scrolling, motion/react) reads this instead of `prefersReducedMotion()`.
 */
export function useFolioMotion(): FolioMotion {
  return BY_LEVEL[useFolioMotionLevel()]
}

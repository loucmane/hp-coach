// Motion identity — the single source of truth for HP-Coach motion.
//
// Before this module: every component re-typed `cubic-bezier(0.16, 1,
// 0.3, 1)` with its own duration. Durations were scattered (120 / 150 /
// 220 / 280 / 320 / 520 / 1100ms). Components were locally consistent
// but globally drifting — the product moved like five products that
// share branding.
//
// After: three named curves + four named durations. Every transition,
// `motion` tween, and `useEffect` raf-tween reads from these. Press a
// button on /progress, advance a question in /drill, close the Sigil
// on Home — they share one physics layer.
//
// The named tokens also live in `index.css` as CSS vars
// (`--ease-reading`, `--dur-chrome`, etc.) so CSS-driven transitions
// have the same source of truth. The `prefers-reduced-motion` media
// query collapses every CSS duration to 0s automatically; JS consumers
// should check `prefersReducedMotion()` and short-circuit to the
// final state.
//
// Reference: Linear's spring easing, Apple HIG springs, Stripe's
// reading-pace tweens. Pick a vocabulary, name it, use it everywhere.

/**
 * Easing curves keyed by intent. Pass to `motion`'s `transition.ease`
 * or to CSS `transition-timing-function` via the matching `--ease-*`
 * var when authoring CSS.
 *
 *   `reading` — the standard ease-out. Used for chrome tweens, fade-
 *               and-rise reveals, the score-delta band, the Sigil fill.
 *   `spring`  — overshoots on rebound. Used for button press, the
 *               eventual Sigil close ring-spark, ring-close moments.
 *   `exit`    — eases hard into stillness. Used for the leaving page
 *               in route transitions (the Folio Turn exit half).
 */
export const EASE = {
  reading: [0.16, 1, 0.3, 1] as const,
  spring: [0.34, 1.56, 0.64, 1] as const,
  exit: [0.7, 0, 0.84, 0] as const,
}

/**
 * Durations keyed by purpose. Values in seconds (Framer Motion's
 * native unit). The CSS variants are in milliseconds and live in
 * `index.css` as `--dur-*`.
 *
 *   `snap`   80ms   — press confirmation, single-key feedback
 *   `chrome` 220ms  — chrome state changes, hover articulation,
 *                     route-internal swaps
 *   `reveal` 360ms  — fade-and-rise on mount (the `.reveal` keyframe
 *                     and per-component `initial → animate` mounts)
 *   `payoff` 1100ms — reading-pace beats. Score-delta tween, Sigil
 *                     fill close, the Folio Turn (well, 320ms of it
 *                     is closer to "reading" — but the whole ceremony
 *                     including the ring-spark falls in the payoff
 *                     register).
 */
export const DUR = {
  snap: 0.08,
  chrome: 0.22,
  reveal: 0.36,
  payoff: 1.1,
} as const

/**
 * Pre-baked transition presets that compose `EASE` + `DUR` for the
 * Framer Motion `transition` prop. Saves consumers from re-typing
 * `{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }` everywhere.
 */
export const TRANSITION = {
  /** Chrome state changes, hover/active articulation. */
  chrome: { duration: DUR.chrome, ease: EASE.reading },
  /** Fade-and-rise reveals on mount. */
  reveal: { duration: DUR.reveal, ease: EASE.reading },
  /** Reading-pace beats — score tweens, Sigil fill, page-turn arrives. */
  payoff: { duration: DUR.payoff, ease: EASE.reading },
  /** Press confirmation. Tiny, sharp. */
  snap: { duration: DUR.snap, ease: EASE.spring },
  /** Spring rebound — buttons settling after press, ring-close moments. */
  spring: { duration: DUR.chrome, ease: EASE.spring },
  /** Exit half of a route transition (leaving page). */
  exit: { duration: DUR.chrome, ease: EASE.exit },
} as const

/**
 * SSR-safe `prefers-reduced-motion` read. Consumers that drive their
 * own raf loops or use `motion.useMotionValue` setters should call
 * this and short-circuit to the final state instead of animating.
 *
 * For pure `motion` `<motion.div>` consumers, Framer Motion already
 * respects the media query via its global `MotionConfig` — but raf
 * loops we manage ourselves do not. This is the bridge.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Pair the JS / framer-motion side of motion with the CSS side. Pass
 * these strings to a style prop's `transition` field if you'd rather
 * write CSS transitions than use Framer:
 *
 *   `transition: var(--ease-reading) var(--dur-chrome) <prop>`
 *
 * Most call sites should prefer `TRANSITION.chrome` etc. via Framer's
 * `transition` prop — but this exists for plain `<div style={...}>`.
 */
export const CSS_VARS = {
  ease: {
    reading: 'var(--ease-reading)',
    spring: 'var(--ease-spring)',
    exit: 'var(--ease-exit)',
  },
  dur: {
    snap: 'var(--dur-snap)',
    chrome: 'var(--dur-chrome)',
    reveal: 'var(--dur-reveal)',
    payoff: 'var(--dur-payoff)',
  },
} as const

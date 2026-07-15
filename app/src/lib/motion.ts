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

import { type Transition, useReducedMotion } from 'motion/react'
import { createElement, type ReactNode, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'

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
 * Wrap a theme-changing state update in a View Transition so the whole
 * page cross-fades as ONE image (the default `::view-transition-old(root)`
 * / `::view-transition-new(root)` swap) instead of every color property
 * tweening independently. Used by the ljus/mörk toggle and the palette
 * setters (`uiStore`) — apply it once at the setter and every entry point
 * (rail-foot toggle, /mer settings, palette picker, ⌘K) gets it for free.
 *
 * Feature-detects `document.startViewTransition` — unsupported in Firefox
 * as of this writing — and falls back to a plain synchronous call when
 * it's missing. No polyfill. Also skips the transition entirely under
 * `prefers-reduced-motion: reduce`, per the product's reduced-motion
 * contract (see `prefersReducedMotion` above): the state still changes,
 * it just doesn't cross-fade.
 *
 * `fn` is wrapped in `flushSync` inside the transition callback. The View
 * Transitions API snapshots the "new" DOM state synchronously right after
 * the callback returns; React state updates (e.g. a zustand `set()` that
 * a component reads via a hook) are otherwise applied on React's own
 * schedule, which can land AFTER that snapshot — producing a transition
 * between two visually-identical "old" frames. `flushSync` forces the
 * update (and its effects) to commit before `startViewTransition`'s
 * callback resolves. Harmless to call on a plain synchronous DOM write
 * too (e.g. a direct `element.dataset.x = ...`), so this always wraps.
 */
export function withViewTransition(fn: () => void): void {
  if (
    prefersReducedMotion() ||
    typeof document === 'undefined' ||
    typeof document.startViewTransition !== 'function'
  ) {
    fn()
    return
  }

  document.startViewTransition(() => {
    flushSync(fn)
  })
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

// ── A2 · Arket, fullbordad — the app-wide motion system ──────────────
//
// The owner-approved motion identity (won a 4-round bake-off; reference
// fixture: components/devbake/MotionArketFullbordad.tsx). Its laws:
//
//   ONE SHEET — nothing appears or disappears. Material rearranges
//   (layout / layoutId — the arket spring) or ink dries in place
//   (opacity — tork/ut; ZERO entrance offsets, no translate-in ever).
//
//   ONE CAMERA — exactly one degree of freedom (the drill's y-pan,
//   remsan). Every other motion is in-plane.
//
//   TWO DEPTH STATIONS — the sheet plane (flat, shadowless) and the
//   finger-lift (only a dragged strip leaves the plane; its shadow is
//   f(drag distance), never f(time)).
//
// This block is the SINGLE SOURCE OF TRUTH for the Arket spring numbers.
// No product code should inline spring literals — import SPRING / the
// `useArketMotion()` hook instead.

/**
 * The four named Arket springs — the ONLY place these numbers live.
 *
 *   `arket`  k320 c36 m1     — all layoutId morphs; the material of the
 *                              sheet rearranging in plane. The verdict
 *                              morph rides this and inherits the drag
 *                              release velocity.
 *   `remsan` k240 c30 m1.15  — the drill camera pan (the reader's eye
 *                              has mass); live-aimed, re-targets in
 *                              flight via a ResizeObserver.
 *   `veck`   k480 c40 m0.8   — small in-place layout shifts (rows
 *                              closing up) and the masked digit roll.
 *   `sate`   k620 c42 m0.9   — a released strip seating home before the
 *                              detent (inherits the hand's velocity).
 */
export const SPRING = {
  arket: { stiffness: 320, damping: 36, mass: 1 },
  remsan: { stiffness: 240, damping: 30, mass: 1.15 },
  veck: { stiffness: 480, damping: 40, mass: 0.8 },
  sate: { stiffness: 620, damping: 42, mass: 0.9 },
} as const

/**
 * The two Arket ink tweens — drying and lifting. Zero travel; opacity
 * only. `tork` (240ms, reading ease) is ink surfacing onto the sheet;
 * `ut` (90ms, exit ease) is the only exit the sheet allows — ink
 * lifting off. Exits lead entrances by design (see HANDOFF).
 */
export const INK = {
  tork: { duration: 0.24, ease: EASE.reading },
  ut: { duration: 0.09, ease: EASE.exit },
} as const

/**
 * The drag-to-commit constants (F4 "Greppet", folded into Arket).
 * `detent` is the mechanical arming stop; `hardStop` is the travel
 * limit; a release past the detent commits with the hand's velocity
 * carried into the arket spring, clamped ×`vScale` to ±`vClamp` px/s.
 * `liftMax` is the drag distance over which the finger-lift shadow
 * rises from 0 to full (f(drag), never f(time)); `creaseMax` the pull
 * over which the groove + tick materialise.
 */
export const DRAG = {
  detent: 72,
  hardStop: 88,
  vClamp: 700,
  vScale: 0.5,
  liftMax: 12,
  creaseMax: 14,
} as const

/**
 * Per-pair scene handoff entrance delays, in seconds. A scene exit
 * leads at 90ms (INK.ut); the incoming scene's ink then waits its
 * pair's delay so the two never double-expose. The öva→drill pair
 * carries the biggest morph set, so its ink waits longest. Keyed
 * `${from}→${to}` on the route family; unknown pairs fall back to 40ms.
 */
export const HANDOFF: Record<string, number> = {
  'home→ova': 0.04,
  'ova→home': 0.04,
  'ova→drill': 0.06,
  'drill→home': 0.05,
  'drill→ova': 0.05,
  'home→drill': 0.06,
}

/** Resolve a scene-handoff entrance delay for a `${from}→${to}` pair. */
export function handoffDelay(from: string | null, to: string): number {
  if (!from) return 0.04
  return HANDOFF[`${from}→${to}`] ?? 0.04
}

/**
 * Shared layoutId for a drill option's word, so the picked option can
 * fly from its row into the verdict slot (the A2 verdict morph). Kept
 * here — the one place both the source (DrillQuestion option row) and
 * the target (PedagogyPanel verdict) can agree without a circular
 * component import.
 */
export function optWordLayoutId(qid: string, letter: string): string {
  return `optword-${qid}-${letter}`
}

// ── A2 MACRO continuity — the shared-element stations ────────────────
//
// The bake-off's "total continuity" layer: material that survives a
// scene change travels as ONE object via layoutId under the root
// LayoutGroup (RouteScene). Three flights exist; their ids live here so
// every station agrees without cross-imports.

/**
 * The living due-count numeral (reference: `a2-due`). Exactly ONE
 * station owns it at a time: the nav rail everywhere, except on the
 * drill / repetition surfaces where the page header station owns it and
 * the rail slot stays genuinely empty (exact-width reserve — A2 fix 3:
 * nothing reflows on departure or arrival). Under reduced motion the
 * flight is disabled and the rail numeral stays put.
 */
export const DUE_NUMERAL_LAYOUT_ID = 'a2-due'

/** Route-ownership rule for the due numeral: on these surfaces the
 *  page-header station (DueHeaderStation) owns the numeral and the rail
 *  slot is empty. Exact-segment match — `/drill-style-a` (bake-off
 *  archive) has no station, so its rail keeps the numeral. */
export function dueNumeralOwnedByPage(pathname: string): boolean {
  return (
    pathname === '/drill' ||
    pathname.startsWith('/drill/') ||
    pathname === '/repetition' ||
    pathname.startsWith('/repetition/')
  )
}

/**
 * "The row is the door" (reference: `a2-ord`): the section code on an
 * Öva-hub lane / Home plan row morphs into the drill's first-question
 * eyebrow across the route change. Keyed per section so only the
 * clicked door's code travels.
 */
export function sectionDoorLayoutId(section: string): string {
  return `door-${section}`
}

/** The mixed-drill door ("Blandad övning") — same grammar, one id. */
export const MIXED_DOOR_LAYOUT_ID = 'door-mixed'

/**
 * The Uppslag door (W4 "the section chip is the door"): the section
 * code on the Uppslag picker's chip morphs into the framework reader's
 * header eyebrow across the route change, and reverses on the way
 * back. Deliberately a DISTINCT namespace from `sectionDoorLayoutId` —
 * the drill door and the uppslag door can be mounted simultaneously
 * (⌘K can jump straight to a drill while a lektion reader is still
 * live in another tab/history entry), so they must never collide on
 * one layoutId.
 */
export function uppslagDoorLayoutId(section: string): string {
  return `uppslag-door-${section}`
}

/**
 * "Klart folds home" (reference: `a2-kort`): the drill completion
 * panel's Klart block and Home's day-card ("Dagens plan" / complete
 * panel) are one sheet of material — finishing a session and returning
 * home folds the panel back into the card.
 */
export const ARK_KORT_LAYOUT_ID = 'a2-kort'

/**
 * The ribbon-camera pan between drill questions (the nearest honest
 * form of the reference's remsan strip on the product's one-question-
 * at-a-time architecture): the graded sheet exits UPWARD off the
 * reading window while the next question arrives from below onto the
 * same sheet — forward = down the page, exits lead entrances. Travel
 * values in px; the exit is the ut register, the entrance rides a
 * remsan-flavoured spring.
 */
export const PAN = {
  /** How far the outgoing question sheet lifts up while its ink dries off. */
  exitY: -28,
  /** Where the incoming question sheet arrives from (below the fold). */
  enterY: 36,
  /** Outgoing tween — slightly longer than `ut` so the pan reads as travel. */
  exitDuration: 0.14,
} as const

/**
 * The resolved Arket transition set for the current reduced-motion
 * state. Springs collapse to `{ duration: 0 }` under reduced motion
 * (opacity-or-nothing app-wide), so a `layoutId` morph becomes an
 * instant re-seat and a `tork` fade an instant swap. Consumers that
 * drive their own `animate(motionValue, …)` (the camera pan, a strip
 * seating home) read `.rm` and the raw `SPRING.*` records directly.
 */
export interface ArketMotion {
  /** True when the viewer prefers reduced motion. */
  rm: boolean
  /** layoutId morphs — the sheet rearranging in plane. */
  arket: Transition
  /** in-place layout shifts + the digit roll. */
  veck: Transition
  /** ink drying: opacity only, zero travel. */
  tork: Transition
  /** ink lifting off — the only exit. */
  ut: Transition
  /** Raw camera-pan spring for imperative `animate(y, …)`. */
  remsan: typeof SPRING.remsan
  /** Raw seat-home spring for imperative `animate(x, 0, …)`. */
  sate: typeof SPRING.sate
  /** Build an arbitrary spring transition honouring reduced motion. */
  spring: (opts: { stiffness: number; damping: number; mass?: number }) => Transition
  /** Build a tween honouring reduced motion. */
  tween: (duration: number, ease?: readonly [number, number, number, number]) => Transition
}

/**
 * The Arket motion hook. Reads `prefers-reduced-motion` (via framer's
 * `useReducedMotion`, which also honours the root `MotionConfig
 * reducedMotion="user"`) and returns transitions collapsed to
 * `{ duration: 0 }` when reduced. This is the documented entry point
 * every product surface uses — never inline the spring numbers.
 */
export function useArketMotion(): ArketMotion {
  const rm = useReducedMotion() === true
  const spring = (opts: { stiffness: number; damping: number; mass?: number }): Transition =>
    rm ? { duration: 0 } : { type: 'spring', ...opts }
  const tween = (
    duration: number,
    ease: readonly [number, number, number, number] = EASE.reading,
  ): Transition => (rm ? { duration: 0 } : { duration, ease: [...ease] })
  return {
    rm,
    arket: spring(SPRING.arket),
    veck: spring(SPRING.veck),
    tork: rm ? { duration: 0 } : { ...INK.tork, ease: [...INK.tork.ease] },
    ut: rm ? { duration: 0 } : { ...INK.ut, ease: [...INK.ut.ease] },
    remsan: SPRING.remsan,
    sate: SPRING.sate,
    spring,
    tween,
  }
}

/**
 * KeepInView — the camera law extended to a scrolling page. In the
 * product drill the verdict grows the graded block; on desktop the page
 * body owns scroll, so a tall verdict can push its "Nästa" control below
 * the fold. On mount (the moment the verdict lands) this nudges the page
 * the minimal distance that keeps its child fully visible — after the
 * veck settle, never during it (scrolling mid-grow measures a moving
 * target). Under reduced motion the scroll is instant.
 *
 * Authored with `createElement` so this JSX-free helper can live in the
 * `.ts` token module alongside the springs it belongs with.
 */
export function KeepInView({
  rm,
  children,
  delayMs = 380,
}: {
  rm: boolean
  children: ReactNode
  delayMs?: number
}): ReactNode {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const t = setTimeout(
      () => ref.current?.scrollIntoView({ block: 'nearest', behavior: rm ? 'auto' : 'smooth' }),
      rm ? 0 : delayMs,
    )
    return () => clearTimeout(t)
  }, [rm, delayMs])
  return createElement('div', { ref, style: { scrollMarginBottom: 20 } }, children)
}

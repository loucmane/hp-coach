// Skrift — data arrival as HANDWRITING (owner W1-round-2 verdict: L2
// "Skriften", reference fixture components/devbake/LoadingBakeoff.tsx).
//
// The shipped drying-ink treatment (InkDry: a gray impression that fades
// to content) read as "a quieter skeleton", not ink — owner: "i didnt
// get the drying ink feeling". Skriften replaces it: before data, almost
// nothing — a faint BASELINE RULE per line, the ruled sheet waiting.
// When data lands, each line WRITES IN, a left→right clip-path wipe at a
// short top-to-bottom cadence; the rule lifts as its line is written.
// The page is not loaded, it is written.
//
//   Skrift      — the block context: owns `ready`, the compressed
//                 cadence, and the skip-at-mount decision, so a run of
//                 SkriftLines writes top-to-bottom as one snappy hand.
//   SkriftLine  — one written line: real content in flow (clipped while
//                 waiting → honest dimensions, zero jump), a faint
//                 baseline rule beneath it until the pen arrives.
//   InkDryOnMount — retained: a post-mount opacity dry-in for material
//                 that only EXISTS once data lands (a tag, a ripe chip)
//                 and so cannot reserve a baseline rule beforehand.
//
// OWNER NUANCE — stay SNAPPY. They liked Skriften "on the fast speed":
// the whole block must finish within BUDGET (~600 ms) no matter how many
// lines, so the cadence COMPRESSES when there are many (a long ledger
// must not write for seconds). And a cached/instant query (data already
// present at first render) SKIPS the ceremony entirely — no write-in,
// content just there.
//
// House laws: nothing loops / pulses / shimmers; reduced motion → instant
// (content written, no rule, no wipe); clip-path / opacity only; zero
// layout jump (real content reserves its box); accent pixels only where
// they already live. State-driven (`ready` flips), `initial={false}`
// everywhere so RouteScene's mount suppression has nothing to suppress.

import { motion } from 'motion/react'
import {
  type CSSProperties,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
} from 'react'

import { dispatchFirstContent, EASE, useArketMotion, useMountGo } from '@/lib/motion'

/* ── graduated constants (from LOAD2 "Skriften") ─────────────────────
   The insets over-scan by 8 % so italic overhangs and descenders never
   get shaved. A pen stroke is near-linear with a soft landing — NOT the
   house reading ease, which front-loads so hard the wipe reads as a snap
   rather than a hand travelling the line (verified on captured frames). */
const BASE_CADENCE = 0.07 // s between line write-ins at full speed
const WIPE_S = 0.38 // s per line write-in (near-linear per-line stroke)
const WIPE_EASE = [0.38, 0.05, 0.5, 1] as const
const RULE_OUT_S = 0.09 // baseline rule lift as its line is written
const BUDGET_S = 0.6 // owner nuance: the whole block completes ≤ ~600 ms
const CLIP_WAITING = 'inset(-8% 108% -8% -8%)'
const CLIP_WRITTEN = 'inset(-8% -8% -8% -8%)'

type SkriftValue = { ready: boolean; cadence: number; skip: boolean }
const SkriftCtx = createContext<SkriftValue>({ ready: true, cadence: BASE_CADENCE, skip: true })

/**
 * A block of written lines. Provides the shared `ready`, a COMPRESSED
 * cadence (so `lines` write-ins finish within ~600 ms however many there
 * are), and the skip-at-mount decision to its `SkriftLine` children.
 *
 * `lines` is the number of write-in lines the block contains — used only
 * to compress the cadence; an over- or under-estimate just tunes the
 * pace, never correctness.
 */
export function Skrift({
  ready,
  lines,
  children,
}: {
  ready: boolean
  lines: number
  children: ReactNode
}) {
  // Skip the whole ceremony when data is present at FIRST render (a
  // cached/instant query): captured once at mount, never re-armed — so a
  // later `ready` flip after a cold wait still writes in.
  const skip = useRef(ready)
  const cadence = Math.min(BASE_CADENCE, BUDGET_S / Math.max(1, lines))
  // Boot-veil content signal (owner verdict on #305): the first time this
  // block's data is ready — at mount (skip case) or when `ready` flips
  // true later — is real content committing. `dispatchFirstContent` is
  // itself one-shot app-wide, so this firing on every ready-true render
  // (including re-renders where `ready` stays true) is harmless.
  useEffect(() => {
    if (ready) dispatchFirstContent()
  }, [ready])
  return (
    <SkriftCtx.Provider value={{ ready, cadence, skip: skip.current }}>
      {children}
    </SkriftCtx.Provider>
  )
}

/**
 * One written line. Real `children` stay in flow (clipped left→right
 * while waiting → honest dimensions, zero jump); a faint baseline rule of
 * width `ruleW` marks the line until the pen reaches it, then lifts as
 * the line wipes open.
 *
 * `line` is the top-to-bottom cadence index within the enclosing
 * `Skrift`. `inline` renders span-flavoured wrappers for in-text slots
 * (a count, a numeral); the default is block. Reduced motion, or a
 * cached-query skip, renders the content written with no rule and no
 * wipe.
 */
export function SkriftLine({
  line,
  ruleW,
  inline = false,
  children,
  testid,
}: {
  line: number
  /** Baseline-rule width (e.g. '24ch'); defaults to the full line box. */
  ruleW?: string
  inline?: boolean
  children: ReactNode
  testid?: string
}) {
  const { ready, cadence, skip } = useContext(SkriftCtx)
  const ark = useArketMotion()
  const instant = skip || ark.rm
  // A line writes in even when it MOUNTS already-ready (a placeholder →
  // content swap when data lands): mount-driven `initial → animate` is
  // suppressed under RouteScene, so the write-in is STATE-driven via
  // `useMountGo` (see the law in lib/motion). `go` starts true when
  // instant (final state on the first frame); otherwise it flips two
  // rAFs after mount, so the clip has a real CLIP_WAITING start keyframe
  // to travel from. The line is written only once its data is `ready`.
  const go = useMountGo(instant)
  const written = instant || (ready && go)
  const Host = inline ? motion.span : motion.div
  const Root = inline ? 'span' : 'div'
  const delay = line * cadence
  return (
    <Root
      data-testid={testid}
      style={{
        position: 'relative',
        display: inline ? 'inline-block' : 'block',
        maxWidth: '100%',
      }}
    >
      <Host
        initial={false}
        animate={{
          clipPath: written ? CLIP_WRITTEN : CLIP_WAITING,
          transition:
            instant || !written
              ? { duration: 0 }
              : { duration: WIPE_S, ease: [...WIPE_EASE], delay },
        }}
        style={{ display: inline ? 'inline-block' : 'block' }}
      >
        {children}
      </Host>
      {!instant && (
        <motion.span
          aria-hidden
          initial={false}
          animate={{
            opacity: written ? 0 : 1,
            transition: written
              ? { duration: RULE_OUT_S, ease: [...EASE.exit], delay }
              : { duration: 0 },
          }}
          style={{
            position: 'absolute',
            left: 0,
            bottom: '0.28em',
            width: ruleW ?? '100%',
            maxWidth: '100%',
            borderBottom: '1px solid var(--hairline-2)',
          }}
        />
      )}
    </Root>
  )
}

/**
 * A faint baseline rule standing in for a line that has no content YET
 * (structure known, data not) — the ruled sheet waiting where real
 * `SkriftLine`s will write in once the block's data lands. Static by law:
 * a mark on the sheet, never an activity indicator. `w` is the rule width
 * in `ch`; render it INSIDE the element whose typography the real line
 * will use, so the reserved line box is honest.
 */
export function SkriftRule({ w, style }: { w: number; style?: CSSProperties }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        position: 'relative',
        width: `${w}ch`,
        maxWidth: '100%',
        height: '0.66em',
        verticalAlign: 'baseline',
        ...style,
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: '0.12em',
          borderBottom: '1px solid var(--hairline-2)',
        }}
      />
    </span>
  )
}

/**
 * Ink that dries in on mount — retained for material that only EXISTS
 * once the data lands (a "svagast" tag, a ripe-section chip row) and so
 * cannot reserve a baseline rule beforehand. Opacity only, zero travel;
 * reduced motion → instant. Inline by default. (Not the loading-arrival
 * grammar the owner critiqued — this is a post-mount appearance, not a
 * skeleton-to-content swap.)
 */
export function InkDryOnMount({
  children,
  block = false,
}: {
  children: ReactNode
  block?: boolean
}) {
  const ark = useArketMotion()
  const Host = block ? motion.div : motion.span
  return (
    <Host initial={{ opacity: 0 }} animate={{ opacity: 1, transition: ark.tork }}>
      {children}
    </Host>
  )
}

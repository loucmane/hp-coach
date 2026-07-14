// DigitRoll — A2's direction-aware masked digit roll.
//
// The living numeral: every change of a count anywhere in the app rolls
// its digits, up on an increase, down on a decrease — the same physics
// (veck spring) the drill's rows close on. One masked slot per digit;
// the outgoing digit lifts out as the incoming digit rolls in behind it.
//
// A2 law fix 5: direction is detected from the previous value, and the
// previous-value ref is updated in an EFFECT, never in the render body —
// a render-body write misreads direction under StrictMode's double
// render. Under reduced motion the digits swap on opacity alone (no
// vertical travel), honouring opacity-or-nothing.
//
// A2 law fix 6 (owner 2026-07-14, "the number gets bumped"): enter and
// exit MUST be variants, not literal objects. AnimatePresence's
// `custom` prop only re-resolves VARIANT FUNCTIONS on exit — a literal
// `exit={{ y: dir * ... }}` freezes the dir that was current when the
// glyph last RENDERED. Every static re-render (each pile refetch)
// recomputes dir to +1 (value >= prev), so on the next DECREASE the
// entering digit rolled DOWN from above while the exiting digit flew UP
// with its stale +1 — the glyphs converged and collided mid-cell, a
// visible bump instead of a roll (frame evidence in
// scripts-bounce/out/el-repetition*). With variants, AnimatePresence
// hands the exiting glyph the LATEST dir and both glyphs travel the
// same way.
//
// This is the shared numeral treatment for the Öva due-count across the
// nav rail (expanded folio + collapsed spine corner), the phone tab, and
// the drill/repetition header station. The cross-surface layoutId FLIGHT
// between those stations lives in DueNumeral.tsx (rail ↔ DueHeaderStation
// under RouteScene's root LayoutGroup); this component is the roll the
// numeral performs at whichever station currently owns it.

import { AnimatePresence, motion, type Variants } from 'motion/react'
import { type CSSProperties, useEffect, useRef } from 'react'

import { useArketMotion } from '@/lib/motion'

/** Full-motion roll: enter from one side, exit through the other — both
 *  resolved from the LATEST dir via `custom` (see fix 6 above). */
const rollVariants: Variants = {
  enter: (dir: number) => ({ y: `${dir * 0.9}em`, opacity: 0 }),
  center: { y: '0em', opacity: 1 },
  exit: (dir: number) => ({ y: `${dir * -0.9}em`, opacity: 0 }),
}

/** Reduced motion: opacity-or-nothing, no vertical travel. */
const fadeVariants: Variants = {
  enter: { opacity: 0 },
  center: { y: '0em', opacity: 1 },
  exit: { opacity: 0 },
}

export function DigitRoll({
  value,
  style,
  'data-testid': testId,
}: {
  value: number
  style?: CSSProperties
  'data-testid'?: string
}) {
  const ark = useArketMotion()
  const prev = useRef(value)
  const dir = value >= prev.current ? 1 : -1
  useEffect(() => {
    prev.current = value
  }, [value])
  const digits = String(value).split('')
  return (
    <span
      data-testid={testId}
      style={{
        display: 'inline-flex',
        overflow: 'hidden',
        verticalAlign: 'bottom',
        fontVariantNumeric: 'tabular-nums',
        ...style,
      }}
    >
      {digits.map((ch, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: digit slots are positional by design
          key={i}
          style={{ display: 'inline-block', position: 'relative', overflow: 'hidden' }}
        >
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.span
              key={ch}
              custom={dir}
              variants={ark.rm ? fadeVariants : rollVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={ark.veck}
              style={{ display: 'inline-block' }}
            >
              {ch}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  )
}

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
// This is the shared numeral treatment for the Öva due-count across the
// nav rail (expanded folio + collapsed spine corner), the phone tab, and
// the drill/repetition header — see the note in NavRail.tsx on why a
// true cross-surface layoutId flight is not wired.

import { AnimatePresence, motion } from 'motion/react'
import { type CSSProperties, useEffect, useRef } from 'react'

import { useArketMotion } from '@/lib/motion'

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
              initial={ark.rm ? { opacity: 0 } : { y: `${dir * 0.9}em`, opacity: 0 }}
              animate={{ y: '0em', opacity: 1 }}
              exit={ark.rm ? { opacity: 0 } : { y: `${dir * -0.9}em`, opacity: 0 }}
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

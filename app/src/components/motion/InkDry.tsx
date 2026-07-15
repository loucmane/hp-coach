// InkDry — data arrival on the Arket sheet (A2 "drying ink").
//
// The One Sheet law says nothing appears or disappears: material
// rearranges, ink dries in place. Loading states used to violate it —
// a query resolved and content POPPED in. This module makes data
// arrival lawful:
//
//   Impress  — the faint PRE-IMPRESSION of the ink to come. A static
//              hairline-toned bar sized to the text it stands in for
//              (honest dimensions, so nothing jumps when the real ink
//              lands). It NEVER animates — no shimmer, no pulse, no
//              loops on study surfaces. It is a mark on the sheet, not
//              an activity indicator.
//   InkSlot  — the slot where the swap happens. While `ready` is
//              false it shows the impression; when the data lands the
//              impression lifts off (ut, 90ms, leading — popLayout
//              pins it out of flow so nothing reflows) and the real
//              content dries in over the same box (tork, opacity only,
//              zero travel).
//
// Reduced motion: both tweens collapse to duration 0 via
// useArketMotion — an instant swap, no fades.
//
// AnimatePresence mounts with `initial={false}`, so a slot that is
// ready on FIRST render (cached query) shows its content instantly —
// the ceremony only plays when the viewer actually waited.

import { AnimatePresence, motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

import { useArketMotion } from '@/lib/motion'

/** Small entrance lead for the drying ink, seconds — the impression's
 *  ut exit (90ms) leads; the ink starts drying while it lifts, matching
 *  the scene-handoff grammar (exits lead entrances). */
const DRY_DELAY = 0.06

/**
 * Ink that dries in on mount — for material that only EXISTS once the
 * data lands (a "svagast" tag, a chips row for ripe sections) and so
 * cannot reserve an honest impression beforehand. Opacity only, zero
 * travel; reduced motion → instant. Inline by default.
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

/**
 * A static faint pre-impression bar. `w` is the width in `ch` of the
 * text it reserves space for; the bar takes its line box from the
 * surrounding typography (render it INSIDE the element whose font
 * styles the real ink will use, so the reserved line height is honest).
 */
export function Impress({ w, style }: { w: number; style?: CSSProperties }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: `${w}ch`,
        maxWidth: '100%',
        height: '0.66em',
        background: 'var(--hairline-2)',
        borderRadius: 2,
        verticalAlign: 'baseline',
        ...style,
      }}
    />
  )
}

/**
 * The drying-ink slot. Renders `impression` (or a default bar of `w`
 * ch) until `ready`, then dries `children` in over the same box.
 *
 * `block` renders div-flavoured wrappers for block content (a list, a
 * paragraph); the default is inline-block for in-text slots (a count,
 * a score numeral).
 */
export function InkSlot({
  ready,
  children,
  impression,
  w = 8,
  block = false,
  testid,
}: {
  ready: boolean
  children: ReactNode
  /** Custom pre-impression (e.g. structured ghost rows). Defaults to a
   *  single `Impress` bar of `w` ch. */
  impression?: ReactNode
  /** Default impression width in ch (ignored when `impression` set). */
  w?: number
  block?: boolean
  /** data-testid on the slot root, for tests/e2e. */
  testid?: string
}) {
  const ark = useArketMotion()
  const Host = block ? motion.div : motion.span
  // Valid nesting: block slots host divs, inline slots host spans.
  const Root = block ? 'div' : 'span'
  return (
    <Root
      data-testid={testid}
      style={{ position: 'relative', display: block ? 'block' : 'inline-block', maxWidth: '100%' }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {ready ? (
          <Host
            key="ink"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: ark.rm ? { duration: 0 } : { ...ark.tork, delay: DRY_DELAY },
            }}
          >
            {children}
          </Host>
        ) : (
          <Host key="impress" aria-hidden exit={{ opacity: 0, transition: ark.ut }}>
            {impression ?? <Impress w={w} />}
          </Host>
        )}
      </AnimatePresence>
    </Root>
  )
}

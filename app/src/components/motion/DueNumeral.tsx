// DueNumeral — the living due-count numeral's flight stations (A2).
//
// The Öva due-count is ONE object that never stops existing: it lives
// in the nav rail (expanded folio / collapsed spine corner) everywhere,
// and physically travels — TRUE layoutId under RouteScene's root
// LayoutGroup — into the drill/repetition header station when you enter
// those surfaces, and back when you leave. A2's law: exactly one
// station owns it at a time, and a station the numeral has left holds
// an exact-width reserve (mono digits are 1ch each) so nothing reflows
// on departure or arrival (reference fix 3).
//
// Under reduced motion the flight is disabled: the rail numeral stays
// put (`away` is ignored) and the header station renders a plain,
// non-layoutId numeral. The DigitRoll keeps working at whichever
// station currently owns the numeral.
//
// The phone tab bar keeps roll-only (no flight) by design: the tab is
// position-fixed chrome at the artboard's bottom edge — a numeral
// "flying" out of a fixed bar into a scrolling page would fake a
// continuity the layout doesn't have.

import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { useActiveMistakes } from '@/api/hooks/useMistakes'
import { DigitRoll } from '@/components/motion/DigitRoll'
import { useViewport } from '@/hooks/useViewport'
import { DUE_NUMERAL_LAYOUT_ID, useArketMotion } from '@/lib/motion'

/**
 * One station of the due numeral. `away` = the numeral currently lives
 * at another station: render the exact-width reserve instead (unless
 * reduced motion, where flights don't exist and the numeral stays).
 */
export function DueNumeral({
  count,
  away = false,
  size,
  color = 'var(--accent)',
  testid,
  style,
}: {
  count: number
  away?: boolean
  size: number
  color?: string
  testid?: string
  style?: CSSProperties
}) {
  const ark = useArketMotion()
  if (away && !ark.rm) {
    return (
      <span
        aria-hidden
        data-testid={testid ? `${testid}-reserve` : undefined}
        style={{
          display: 'inline-block',
          width: `${String(count).length}ch`,
          fontFamily: 'var(--font-mono)',
          fontSize: size,
          lineHeight: 1,
          ...style,
        }}
      />
    )
  }
  return (
    <motion.span
      data-testid={testid}
      layoutId={ark.rm ? undefined : DUE_NUMERAL_LAYOUT_ID}
      // Gate the layout projection: measure/animate ONLY when the count
      // changes (a roll) — never on every render. Without this, the
      // owning station (drill/repetition header) re-projects on every
      // question advance, and any incidental re-measure of the surrounding
      // reading column springs the numeral → the visible bounce on "Nästa
      // fråga" (owner report, staging). The enter/leave flight between the
      // rail and the header survives: that's a shared-layout transition
      // driven by the layoutId node MOUNTING at a new station under
      // RouteScene's LayoutGroup, which measures on mount regardless of
      // this dependency.
      layoutDependency={count}
      transition={ark.arket}
      style={{
        display: 'inline-flex',
        fontFamily: 'var(--font-mono)',
        fontSize: size,
        lineHeight: 1,
        color,
        fontVariantNumeric: 'tabular-nums',
        ...style,
      }}
    >
      <DigitRoll value={count} />
    </motion.span>
  )
}

/**
 * The drill/repetition header station — "N att repetera", top-right of
 * the session surface (reference: the drill header's due slot). Owns
 * the numeral while the user is inside a session world; reads the same
 * due-mistakes queue as the rail. Renders nothing on phone (the tab
 * bar's roll is the phone treatment) and nothing at 0 due (real data
 * or nothing). Informational, not a control — pointer-events pass
 * through.
 */
export function DueHeaderStation() {
  const viewport = useViewport()
  // The header station is a flight destination of the rail numeral, so it
  // MUST read the same source — the whole active queue (scope=all), not the
  // due-now slice — or the number would jump when it flies between stations.
  const due = useActiveMistakes()
  const count = due.data?.length ?? 0
  if (viewport === 'phone' || count === 0) return null
  return (
    <div
      data-testid="due-station"
      style={{
        position: 'absolute',
        top: 20,
        right: 'clamp(24px, 3vw, 48px)',
        zIndex: 6,
        display: 'flex',
        alignItems: 'baseline',
        gap: 7,
        pointerEvents: 'none',
      }}
    >
      <DueNumeral count={count} size={15} testid="due-station-numeral" />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        att repetera
      </span>
    </div>
  )
}

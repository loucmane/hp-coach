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
import { usePileMistakes } from '@/api/hooks/useMistakes'
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
      // Freeze the layout projection to a STABLE dependency so the numeral
      // NEVER re-projects on a count change — position moves only on a
      // genuine station change. Fix B (owner 2026-07-13): with
      // layoutDependency={count}, every count change (frequent on
      // /repetition, where a correct answer drops the pile by 1) re-measured
      // the shared-layout box, and any incidental re-measure of the
      // surrounding reading column in that frame SPRANG the numeral — the
      // positional bounce the owner saw on /repetition (and, on a wrong
      // answer, on /drill). The VALUE change is owned entirely by the
      // DigitRoll child (a masked roll, in place).
      //
      // Known state 2026-07-14 (frame-capture evidence, scripts-bounce/):
      // the rail↔header FLIGHT does not currently ANIMATE — the numeral
      // re-seats instantly at the new station (verified identical on
      // unmodified main, so not a regression of the sticky station; it is
      // dead with or without this dependency, so the freeze is not the
      // killer either). The motion-settle e2e's settle-parity contract
      // (destination rects equal static layout) holds. Resurrecting the
      // animated flight is a separate investigation.
      layoutDependency={DUE_NUMERAL_LAYOUT_ID}
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
  // MUST read the same source — today's PILE (scope=pile), the same "att
  // repetera" number the rail shows — or the number would jump when it flies
  // between stations.
  const due = usePileMistakes()
  const count = due.data?.length ?? 0
  if (viewport === 'phone' || count === 0) return null
  return (
    // STICKY, not fixed and not page-flow (third positioning, the honest
    // one — 2026-07-14). The two previous primitives each failed a real
    // requirement:
    //   - absolute (page flow) rode every scroll, so the instant scroll
    //     reset on "Nästa" yanked the numeral — the original bounce.
    //   - fixed (#286) pinned it still, but (a) glued it to the VIEWPORT
    //     edge, far right of the reading column at ≥1440 (M3 "Boksidan":
    //     the column is the page — the station belongs to ITS top-right);
    //     (b) killed the rail↔header layoutId flight both ways (framer's
    //     layout projection does not support position:fixed elements —
    //     the numeral teleported); and (c) ghosted: RouteScene's exit
    //     clone kept the fixed div, which pinned "N att repetera" OVER
    //     the incoming page during every cross-family exit.
    // Sticky is in-flow (projection measures it, so the flight lives),
    // pins at the viewport top while the body scrolls (no scroll yank),
    // and its horizontal frame is the same centered 880px column as
    // .hpc-studydesk — column-aligned at every width. A zero-height
    // strip so it reserves no reading space.
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 6,
        // A REAL band, not a zero-height ghost strip (owner 2026-07-14,
        // the last visible "bump"): with height 0 the station floated
        // transparent over the sheet, and the exiting question's rules /
        // verdict ink slid within a few px of the digits — a moving line
        // under still glyphs reads as the glyphs moving (induced
        // motion). The band is the frame's top edge: opaque, full
        // column width, the sheet slides UNDER it. The negative margin
        // gives the height back so nothing reflows.
        height: 52,
        marginBottom: -52,
        background: 'var(--bg)',
        width: '100%',
        pointerEvents: 'none',
        // Own compositor layer, permanently. Without this the band gets
        // layer-promoted only WHILE the question pan animates beneath it,
        // and the text's anti-aliasing flips mode for those frames — a
        // visible shimmer on every grade/Nästa (4x-zoom frame evidence,
        // 2026-07-14). A constant layer = constant rasterization.
        transform: 'translateZ(0)',
        // Forced grayscale AA: the station sits at a fractional x (the
        // centered column), and every compositor rebuild during the pan
        // re-rasterized its text in the OTHER antialiasing mode
        // (subpixel-LCD <-> grayscale) — a persistent one-frame shimmer
        // read as the digits "bumping" (DOM provably still: identical
        // rects, no transforms — computed-style dumps 2026-07-14). One
        // constant AA mode = one constant rasterization.
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}
    >
      <div style={{ position: 'relative', maxWidth: 880, margin: '0 auto', height: 0 }}>
        <div
          data-testid="due-station"
          style={{
            position: 'absolute',
            top: 20,
            right: 24,
            display: 'flex',
            alignItems: 'baseline',
            gap: 7,
            pointerEvents: 'none',
            // Constant layer-snap for the station itself: the numeral's
            // motion.span toggles between transform:none and an identity
            // matrix as framer's projection idles, and each toggle flips
            // compositor pixel-snapping — at the column's fractional x
            // that was a persistent half-pixel jump of the text on EVERY
            // grade/Nästa (333px diff signature, 2026-07-14). With the
            // station on its own always-on layer the snap never changes.
            transform: 'translateZ(0)',
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
      </div>
    </div>
  )
}

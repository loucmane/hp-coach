// Landing chrome — the shared conversion + typographic atoms of the
// public landing, extracted from the winning bake-off (LandingBakeoffR2
// exports, which V5A composed). The bake-off files stay untouched as
// historical references; this is their production home.
//
// CTA system (owner-ratified, four stations): ONE action — "Skapa konto"
// → /sign-up — repeated per concept, never competing actions, no urgency
// theater:
//   1. EARLY: a quiet inline CTA directly under the fold.
//   2. EARNED: post-genomgång kvitto notes + the completed schema.
//   3. STICKY: a slim fixed bar (phone: full-width bottom; ≥900px:
//      bottom-right pill) visible only between the hero scrolling away
//      and the final CTA block entering — never two CTAs stacked.
//   4. FINAL: the price block carries the button.
//
// Motion: lib/motion tokens only; state-driven opacity beats, zero
// entrance travel; reduced motion collapses to the final state.

import { motion } from 'motion/react'
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'

import { DUR, EASE, useArketMotion } from '@/lib/motion'

import { COPY } from './copy'

/* ── Ink — a state-driven opacity beat (Arket-lawful: zero travel) ────── */

export function Ink({
  go,
  delay = 0,
  children,
  style,
  className,
}: {
  go: boolean
  delay?: number
  children: ReactNode
  style?: CSSProperties
  className?: string
}) {
  const m = useArketMotion()
  return (
    <motion.div
      className={className}
      style={style}
      initial={false}
      animate={{ opacity: go ? 1 : 0 }}
      transition={m.rm ? { duration: 0 } : { duration: 0.28, ease: [...EASE.reading], delay }}
    >
      {children}
    </motion.div>
  )
}

/* ── closing blocks — villkor/pris + CTA (trust lives here) ───────────── */

export function PriceBlock() {
  return (
    <div>
      <div className="hpl-price-row">
        <span className="hpl-price-x">
          <span className="hpl-price-slot">{COPY.priceX}</span>
        </span>
        <span className="hpl-price-terms">{COPY.priceTerms}</span>
      </div>
      <p className="hpl-folio" style={{ marginTop: 8 }}>
        {COPY.priceFolio}
      </p>
      <p className="hpl-body" style={{ marginTop: 12 }}>
        {COPY.priceAnchor}
      </p>
    </div>
  )
}

export function Cta({ sub }: { sub?: string }) {
  return (
    <div style={{ marginTop: 20 }}>
      <a className="hpc-m3-cta hpc-btn hpl-cta" href="/sign-up">
        {COPY.cta}
      </a>
      {sub && (
        <p className="hpl-folio" style={{ marginTop: 12 }}>
          {sub}
        </p>
      )}
    </div>
  )
}

/** The quiet conversion link — appears once the reader has already felt
 *  the product. Text-level, never competes with the beat. */
export function QuietCta() {
  return (
    <a className="hpl-quiet-cta" href="/sign-up">
      {COPY.cta} <span aria-hidden>→</span>
    </a>
  )
}

/* ── sticky CTA — the always-reachable door ───────────────────────────── */

export function useStickyCta() {
  const heroRef = useRef<HTMLElement>(null)
  const endRef = useRef<HTMLElement>(null)
  const [heroGone, setHeroGone] = useState(false)
  const [endNear, setEndNear] = useState(false)

  useEffect(() => {
    const hero = heroRef.current
    const end = endRef.current
    if (!hero || !end || typeof IntersectionObserver === 'undefined') return
    const heroObs = new IntersectionObserver(([e]) => setHeroGone(!e.isIntersecting))
    const endObs = new IntersectionObserver(([e]) => setEndNear(e.isIntersecting))
    heroObs.observe(hero)
    endObs.observe(end)
    return () => {
      heroObs.disconnect()
      endObs.disconnect()
    }
  }, [])

  return { heroRef, endRef, visible: heroGone && !endNear }
}

export function StickyCta({ visible }: { visible: boolean }) {
  const m = useArketMotion()
  return (
    <motion.div
      className="hpl-sticky"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 14 }}
      transition={m.rm ? { duration: 0 } : { duration: DUR.chrome, ease: [...EASE.reading] }}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
      aria-hidden={!visible}
    >
      <a className="hpl-sticky-link" href="/sign-up" tabIndex={visible ? 0 : -1}>
        <span className="hpl-sticky-cta">
          {COPY.cta} <span aria-hidden>→</span>
        </span>
        <span className="hpl-sticky-price">{COPY.priceX} · engångsköp</span>
      </a>
    </motion.div>
  )
}

/* ── landing-base styles (layout only; color/type from live tokens) ───── */

export const LANDING_BASE_CSS = `
.hpl-root {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-ui);
  letter-spacing: var(--font-ui-track);
  font-size: 15px;
  line-height: 1.55;
  min-height: 100vh;
}
.hpl-body {
  font-size: 15px;
  line-height: 1.65;
  color: var(--ink-2);
  margin: 6px 0 0;
  max-width: 58ch;
}
.hpl-folio {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--muted);
  margin: 0;
  font-variant-numeric: tabular-nums;
}
.hpl-human {
  font-family: var(--font-mono);
  font-size: 11.5px;
  letter-spacing: 0.04em;
  color: var(--muted);
  margin: 0;
}
.hpl-note {
  border-left: 2px solid var(--accent);
  padding: 2px 0 2px 14px;
  margin: 0;
}
.hpl-note-l {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
}
.hpl-note-t {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 17px;
  line-height: 1.5;
  color: var(--ink-2);
  margin: 4px 0 0;
  max-width: 50ch;
}
.hpl-price-row {
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
}
.hpl-price-x {
  font-family: var(--font-mono);
  font-size: 36px;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.hpl-price-slot {
  display: inline-block;
  border-bottom: 2px dashed var(--hairline);
  padding: 0 4px 2px;
}
.hpl-price-terms {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--muted);
}
.hpl-cta {
  display: inline-block;
  font-size: 15px;
  padding: 14px 30px;
}
.hpl-quiet-cta {
  display: inline-block;
  margin-top: 14px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.06em;
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color var(--dur-chrome) var(--ease-reading);
}
.hpl-quiet-cta:hover { border-bottom-color: var(--accent); }
.hpl-quiet-cta:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}
.hpl-sep {
  height: 1px;
  background: var(--hairline);
  border: 0;
  margin: 46px 0;
}
.hpl-brandline {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.hpl-brand {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 17px;
  letter-spacing: -0.01em;
  color: var(--ink);
}
.hpl-sticky {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  background: var(--bg);
  border-top: 1px solid var(--hairline);
}
.hpl-sticky-link {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  max-width: 680px;
  margin: 0 auto;
  padding: 13px 20px calc(13px + env(safe-area-inset-bottom, 0px));
  text-decoration: none;
  white-space: nowrap;
}
.hpl-sticky-cta {
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.06em;
  color: var(--accent);
}
.hpl-sticky-price {
  font-family: var(--font-mono);
  font-size: 11.5px;
  letter-spacing: 0.06em;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.hpl-sticky-link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}
@media (min-width: 900px) {
  .hpl-sticky {
    left: auto;
    right: 24px;
    bottom: 22px;
    border: 1px solid var(--hairline);
    border-radius: 999px;
  }
  .hpl-sticky-link { max-width: none; padding: 9px 18px; gap: 14px; }
}
`

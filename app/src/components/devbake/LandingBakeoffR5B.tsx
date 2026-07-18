// LandingBakeoffR5B — landing v5 SYNTHESIS bake-off, variant B:
// "PRESSEN TRYCKER SCHEMAT" — the kinetic synthesis (thesis H2).
//
// THESIS: V4B's press choreography becomes the motion grammar for V4C's
// timeline architecture. The page is a print run whose FORM numbers are
// DATES: the masthead composes a live countdown dateline character by
// character ("Högskoleprovet · söndag 18 oktober · om N dagar"), the
// hero slug sets "IKVÄLL — FORM 1 · ORD · SÄTTS", and every station
// down the page arrives as a press operation on a dated form. The one
// vertical object fuses both parents: the trycklogg margin rail's rule
// IS the time axis — stations tick toward it, and answers are stamped
// onto it.
//
// THE CLIMAX (the stamp→booking fusion): a wrong answer is STAMPED ✗
// into the margin trycklogg (V4B's signature, veck register) AND the
// press then PRINTS that mistake's repetition rows into the schema
// station — for each booked mistake a form-slug header stamps, then
// three cadence rows ("om 1 dag / om 3 dagar / om 10 dagar") print one
// by one, each row's rule drawing left→right ahead of its text drying
// in. The kvitto voice narrates it: "felet bokförs — trycks om 1 dag ·
// 3 dagar · 10 dagar". The queue ends where V4C ended: provdagen, where
// the price lives.
//
// V4A's contribution is restraint at the hero: the question arrives
// before any pitch — brand whisper, dateline, then the headword at
// poster scale; claims wait until after form 1.
//
// MOTION DISCIPLINE: exactly three press verbs, all from lib/motion —
//   RULE  — a hairline draws (scaleX tween, 0.34s reading ease)
//   INK   — content dries in place (tork; zero travel)
//   STAMP — a mark seats (veck spring, scale 1.15 → 1)
// Reduced motion collapses everything to final state (go starts true,
// tweens/springs become duration 0); the page is fully legible with
// zero choreography. Load choreography gates on the boot veil having
// lifted (usePressGo — see the V4B trap note at its definition).
//
// CONTENT (credit): question set = V4B's (LandingBakeoffR4B.content) —
// vederhäftig verbatim via R3.logic, PRESS_KVA (the percent-swap
// question) and PRESS_ORD2 (förslagen); B's generic beat engine
// buildPressBeats is imported unmodified. The prov date + countdown
// come from V4C's content module (daysUntilProv, PROV_DATE_*). The
// CTA system (four stations), COPY, price block and sticky bar are the
// shared R2 exports. No R2/R3/R4 file is modified.
//
// LEGAL: all demo content ORIGINAL, written for HP-Coach — labeled on
// the page. DESIGN artifact — wired by the orchestrator. Kept forever.

import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { dispatchFirstContent, EASE, useArketMotion } from '@/lib/motion'

import {
  COPY,
  Cta,
  LR2_CSS,
  PriceBlock,
  QuietCta,
  StickyCta,
  useStickyCta,
} from './LandingBakeoffR2'
import { VEDERHAFTIG } from './LandingBakeoffR3.logic'
import {
  buildPressBeats,
  PRESS_HERO,
  PRESS_KVA,
  PRESS_ORD2,
  type PressBeat,
  type PressContent,
} from './LandingBakeoffR4B.content'
import { daysUntilProv, PROV_DATE_LABEL, PROV_DATE_SHORT } from './LandingBakeoffR4C.content'

/* ── the print cadence — the schema's three repetition passes ─────────── */

const PRINT_CADENCE = ['om 1 dag', 'om 3 dagar', 'om 10 dagar'] as const

/** The dated form slug per question — FORM numbers are DATES. */
const FORMS = [
  { q: PRESS_HERO, form: 1, date: 'Ikväll' },
  { q: PRESS_KVA, form: 2, date: 'I morgon' },
  { q: PRESS_ORD2, form: 3, date: 'Om tre dagar' },
] as const

type FormSpec = (typeof FORMS)[number]

/* ── styles — layout only; color/type from live tokens ────────────────── */

const LR5B_CSS = `
.lr5b-root {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-ui);
  letter-spacing: var(--font-ui-track);
  font-size: 15px;
  line-height: 1.55;
  min-height: 100vh;
}
.lr5b-col {
  max-width: 640px;
  margin: 0 auto;
  padding: 26px 18px 110px 44px; /* left clears the trycklogg rail */
}
/* ── the margin rail — trycklogg; its rule doubles as the time axis ── */
.lr5b-rail {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 30px;
  border-right: 1px solid var(--hairline);
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 220px;
  gap: 14px;
  pointer-events: none;
}
.lr5b-rail-label {
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.22em;
  color: var(--muted);
  writing-mode: vertical-rl;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.lr5b-rail-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.lr5b-rail-mark { font-size: 15px; line-height: 1; }
.lr5b-rail-mark.ok { color: var(--ok); }
.lr5b-rail-mark.bad { color: var(--bad); }
.lr5b-rail-sec {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.14em;
  color: var(--muted);
  writing-mode: vertical-rl;
  text-transform: uppercase;
}
/* ── the masthead + its composed dateline ── */
.lr5b-masthead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 20px;
  flex-wrap: wrap;
  padding-bottom: 10px;
}
.lr5b-brand {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 17px;
  letter-spacing: -0.01em;
  color: var(--ink);
}
.lr5b-rule { height: 1px; background: var(--ink); }
.lr5b-dateline {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 14px 0 0;
  font-variant-numeric: tabular-nums;
}
.lr5b-caret {
  display: inline-block;
  width: 7px;
  color: var(--accent);
  animation: lr5b-blink 0.9s steps(2, start) infinite;
}
@media (prefers-reduced-motion: reduce) { .lr5b-caret { animation: none; } }
@keyframes lr5b-blink { 50% { opacity: 0; } }
/* ── station slugs — the dated form line, ticked toward the rail ── */
.lr5b-slug {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 6px;
  font-variant-numeric: tabular-nums;
}
.lr5b-slug::before {
  content: '';
  position: absolute;
  left: -14px; /* spans the gutter from the rail's rule to the text */
  top: 50%;
  width: 11px;
  height: 1px;
  background: var(--ink);
}
.lr5b-slug-date {
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.18em;
  color: var(--ink);
}
.lr5b-station { margin-top: 64px; }
.lr5b-station-rule { height: 1px; background: var(--ink); margin-bottom: 20px; }
/* ── the enormous headword — the press's proudest impression ── */
.lr5b-headword {
  font-family: var(--font-display);
  font-weight: var(--font-display-w);
  letter-spacing: var(--font-display-track);
  line-height: 0.98;
  color: var(--ink);
  font-size: clamp(54px, 15vw, 118px);
  margin: 6px 0 0;
  overflow-wrap: anywhere;
}
.lr5b-pull {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 500;
  font-size: clamp(38px, 9vw, 84px);
  line-height: 1.02;
  letter-spacing: -0.02em;
  color: var(--ink);
  margin: 0;
  max-width: 14ch;
}
/* ── the composed stage — satsen (V4B chrome) ── */
.lr5b-stage {
  border: 1px solid var(--hairline);
  border-top: 3px double var(--ink);
  border-radius: 0 0 6px 6px;
  background: var(--bg);
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  height: 590px; /* FIXED — content swaps, the card never grows */
  overflow: hidden;
}
.lr5b-stage-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--hairline);
}
.lr5b-meter {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.lr5b-skip {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--muted);
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.lr5b-skip:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.lr5b-stage-body { flex: 1; min-height: 0; overflow-y: auto; padding: 18px 16px 8px; }
.lr5b-stage-foot {
  padding: 12px 16px;
  border-top: 1px solid var(--hairline);
  display: flex;
  justify-content: flex-end;
}
.lr5b-next {
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.06em;
  color: var(--ink);
  background: transparent;
  border: 1px solid var(--ink);
  border-radius: 999px;
  padding: 9px 20px;
  cursor: pointer;
}
.lr5b-next:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.lr5b-beat-label {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 12px;
}
.lr5b-annot {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.6;
  letter-spacing: 0.04em;
  color: var(--accent);
  margin: 16px 0 0;
  max-width: 46ch;
}
.lr5b-annot a { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
.lr5b-din-tag {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink);
  background: var(--bg);
  border: 1px solid var(--hairline);
  border-radius: 3px;
  padding: 2px 7px;
  margin-left: 8px;
  vertical-align: middle;
}
.lr5b-din-wash { background: var(--bad-soft); border-radius: 6px; padding: 12px 14px; margin: 0 -14px; }
.lr5b-compressed .hpc-m3-dis-p { font-size: 12.5px; line-height: 1.55; }
.lr5b-compressed .hpc-m3-dis-h { font-size: 14px; }
.lr5b-kvitto-line {
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  margin: 14px 0 0;
  font-variant-numeric: tabular-nums;
}
/* ── the receipt — a printed ledger line + the booking note ── */
.lr5b-receipt {
  display: block;
  line-height: 1.7;
  margin-top: 22px;
  padding: 12px 14px;
  border: 1px solid var(--hairline);
  border-left: 3px solid var(--ink);
  border-radius: 0 6px 6px 0;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}
.lr5b-receipt .ok { color: var(--ok); }
.lr5b-receipt .bad { color: var(--bad); }
.lr5b-replay {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--accent);
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.lr5b-replay:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.lr5b-booked {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.05em;
  color: var(--accent);
  margin: 10px 0 0;
}
.lr5b-booked a { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
/* ── the schema press — where booked mistakes are PRINTED ── */
.lr5b-run { margin-top: 4px; }
.lr5b-run-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink);
  padding: 14px 0 6px;
  font-variant-numeric: tabular-nums;
}
.lr5b-run-head .mark { font-size: 15px; line-height: 1; }
.lr5b-run-head .mark.ok { color: var(--ok); }
.lr5b-run-head .mark.bad { color: var(--bad); }
.lr5b-run-head em { font-style: normal; color: var(--accent); text-transform: none; letter-spacing: 0.05em; }
.lr5b-run-row { position: relative; padding: 10px 0 2px; }
.lr5b-run-row-rule { height: 1px; background: var(--hairline-2, var(--hairline)); }
.lr5b-run-row-t {
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  margin: 8px 0 0;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-variant-numeric: tabular-nums;
}
.lr5b-run-row-t .pass { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; white-space: nowrap; }
.lr5b-run-ok {
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  margin: 6px 0 0;
}
.lr5b-run-dest {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.05em;
  color: var(--muted);
  padding: 16px 0 0;
  font-variant-numeric: tabular-nums;
}
.lr5b-sched-empty {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--muted);
  margin: 0;
  padding: 10px 0;
}
.lr5b-sched-sum {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  margin: 18px 0 0;
  font-variant-numeric: tabular-nums;
}
.lr5b-scene {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 19px;
  line-height: 1.55;
  color: var(--ink);
  margin: 0 0 26px;
  max-width: 44ch;
}
@media (min-width: 900px) {
  .lr5b-col { max-width: 700px; padding: 48px 24px 130px 72px; }
  .lr5b-rail { width: 46px; padding-top: 140px; }
  .lr5b-rail-label { font-size: 9.5px; }
  .lr5b-rail-mark { font-size: 17px; }
  .lr5b-rail-sec { font-size: 9px; }
  .lr5b-slug::before { left: -26px; width: 18px; }
  .lr5b-stage { height: 540px; }
  .lr5b-station { margin-top: 88px; }
}
`

/* ── the press-go gate — the run must play in FRONT of the audience ──────
 *
 * Credit V4B (usePressGo): this page mounts BEHIND the boot veil
 * (#boot-veil holds until `hpc:first-content` + 2 rAFs), so a mount-armed
 * load sequence has already finished by the time the curtain lifts. This
 * gate fires the first-content signal itself and then waits until the
 * veil ELEMENT is gone from the DOM before flipping `go`. Reduced motion:
 * `go` starts true — final state on first paint. */

function usePressGo(rm: boolean): boolean {
  const [go, setGo] = useState(rm)
  useEffect(() => {
    if (rm) return
    dispatchFirstContent()
    let raf1 = 0
    let raf2 = 0
    let iv = 0
    const arm = () => {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setGo(true))
      })
    }
    if (!document.getElementById('boot-veil')) arm()
    else {
      iv = window.setInterval(() => {
        if (!document.getElementById('boot-veil')) {
          window.clearInterval(iv)
          iv = 0
          arm()
        }
      }, 40)
    }
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      if (iv) window.clearInterval(iv)
    }
  }, [rm])
  return go
}

/* ── ComposedLine — a mono line set character by character ─────────────── */

function ComposedLine({
  text,
  go,
  baseDelay,
  charStep = 0.018,
  showCaretWhile = 0,
}: {
  text: string
  go: boolean
  baseDelay: number
  charStep?: number
  /** Seconds (from go) the composing caret ticks before lifting. */
  showCaretWhile?: number
}) {
  const m = useArketMotion()
  const chars = useMemo(() => Array.from(text), [text])
  const [caret, setCaret] = useState(!m.rm && showCaretWhile > 0)
  useEffect(() => {
    if (m.rm || showCaretWhile <= 0) {
      setCaret(false)
      return
    }
    if (!go) return
    const t = setTimeout(() => setCaret(false), showCaretWhile * 1000)
    return () => clearTimeout(t)
  }, [m.rm, go, showCaretWhile])
  return (
    <span>
      <span
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clipPath: 'inset(50%)',
        }}
      >
        {text}
      </span>
      {chars.map((ch, i) => (
        <motion.span
          // biome-ignore lint/suspicious/noArrayIndexKey: static string, chars never reorder
          key={i}
          aria-hidden
          initial={false}
          animate={{ opacity: go ? 1 : 0 }}
          transition={
            m.rm
              ? { duration: 0 }
              : { duration: 0.12, ease: [...EASE.reading], delay: baseDelay + i * charStep }
          }
        >
          {ch}
        </motion.span>
      ))}
      {caret && (
        <span className="lr5b-caret" aria-hidden>
          ▮
        </span>
      )}
    </span>
  )
}

/* ── SetType — the letterpress set of the enormous headword (V4B) ─────── */

function SetType({ word, go, baseDelay }: { word: string; go: boolean; baseDelay: number }) {
  const m = useArketMotion()
  const letters = useMemo(() => Array.from(word), [word])
  const settleDelay = baseDelay + letters.length * 0.045 + 0.1
  return (
    <motion.h1
      className="lr5b-headword"
      aria-label={word}
      initial={false}
      animate={{ scale: go ? 1 : 1.015 }}
      transition={m.rm ? { duration: 0 } : { ...m.veck, delay: settleDelay }}
      style={{ transformOrigin: 'left bottom' }}
    >
      {letters.map((ch, i) => (
        <motion.span
          // biome-ignore lint/suspicious/noArrayIndexKey: static word, letters never reorder
          key={i}
          aria-hidden
          initial={false}
          animate={{ opacity: go ? 1 : 0 }}
          transition={
            m.rm
              ? { duration: 0 }
              : { duration: 0.16, ease: [...EASE.reading], delay: baseDelay + i * 0.045 }
          }
          style={{ display: 'inline-block' }}
        >
          {ch}
        </motion.span>
      ))}
    </motion.h1>
  )
}

/* ── in-view arming for scroll stations ───────────────────────────────── */

function useInViewOnce<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, inView }
}

/* ── PressStation — a DATED stop that arrives as a press operation ──────
 *    date word STAMPS (veck) · form slug INKS (tork) · rule RULES (tween)
 *    · content DRIES (tork). The slug's ::before tick reaches back toward
 *    the trycklogg rail — the page's one vertical rule is the time axis. */

function PressStation({
  date,
  slug,
  label,
  id,
  children,
}: {
  date: string
  slug?: string
  label: string
  id?: string
  children: ReactNode
}) {
  const m = useArketMotion()
  const { ref, inView } = useInViewOnce<HTMLElement>()
  return (
    <section ref={ref} className="lr5b-station" aria-label={label} id={id}>
      <div className="lr5b-slug">
        <motion.span
          className="lr5b-slug-date"
          aria-hidden={false}
          initial={false}
          animate={{ opacity: inView ? 1 : 0, scale: inView ? 1 : 1.15 }}
          transition={m.veck}
          style={{ display: 'inline-block', transformOrigin: 'left bottom' }}
        >
          {date}
        </motion.span>
        {slug && (
          <motion.span
            initial={false}
            animate={{ opacity: inView ? 1 : 0 }}
            transition={m.rm ? { duration: 0 } : { ...m.tork, delay: 0.08 }}
          >
            {slug}
          </motion.span>
        )}
      </div>
      <motion.div
        className="lr5b-station-rule"
        initial={false}
        animate={{ scaleX: inView ? 1 : 0 }}
        transition={m.tween(0.34)}
        style={{ transformOrigin: 'left center' }}
      />
      <motion.div
        initial={false}
        animate={{ opacity: inView ? 1 : 0 }}
        transition={m.rm ? { duration: 0 } : { ...m.tork, delay: 0.16 }}
      >
        {children}
      </motion.div>
    </section>
  )
}

/* ── the question — options only; the verdict lives in the genomgång ──── */

function PressQuestionView({
  q,
  picked,
  onPick,
  hero,
  go,
}: {
  q: PressContent
  picked: string | null
  onPick: (k: string) => void
  hero?: boolean
  go?: boolean
}) {
  const graded = picked !== null
  return (
    <div>
      {!hero &&
        (q.headword ? (
          <>
            <div className="hpc-m3-eyebrow">{q.kicker}</div>
            <h2 className="hpc-m3-display" style={{ fontSize: 'clamp(40px, 10vw, 56px)' }}>
              {q.headword}
            </h2>
          </>
        ) : (
          <>
            <div className="hpc-m3-eyebrow">{q.kicker}</div>
            <p className="hpc-m3-q" style={{ marginTop: 10, whiteSpace: 'pre-line' }}>
              {q.prompt}
            </p>
          </>
        ))}
      <motion.div
        className="hpc-m3-opts"
        style={{ marginTop: 18 }}
        initial={false}
        animate={{ opacity: hero ? (go ? 1 : 0) : 1 }}
        transition={{ duration: 0.28, ease: [...EASE.reading], delay: hero ? 2.05 : 0 }}
      >
        {q.options.map((opt) => {
          const isPick = picked === opt.key
          const isRight = graded && opt.key === q.correct
          const isWrongPick = graded && isPick && !isRight
          const dim = graded && !isRight && !isPick
          const cls = [
            'hpc-m3-opt',
            isRight && 'is-ok',
            isWrongPick && 'is-bad',
            dim && 'is-dim',
            isPick && 'is-picked',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <button
              key={opt.key}
              type="button"
              className={cls}
              disabled={graded}
              onClick={() => onPick(opt.key)}
            >
              <span className="hpc-m3-ind" />
              <span className="hpc-m3-opt-k">{opt.key})</span>
              <span className="hpc-m3-opt-t">{opt.text}</span>
              <span className="hpc-m3-opt-v">
                {isRight ? 'Rätt svar' : isWrongPick ? 'Ditt svar' : ''}
              </span>
            </button>
          )
        })}
      </motion.div>
    </div>
  )
}

/* ── one beat, rendered — generic over any PressContent ───────────────── */

function Annot({ children }: { children: ReactNode }) {
  return <p className="lr5b-annot">»{children}«</p>
}

function PressBeatView({
  q,
  beat,
  picked,
  totalOfKind,
  showAnnotation,
}: {
  q: PressContent
  beat: PressBeat
  picked: string
  totalOfKind: { steg: number; falla: number; fallaIndex: number }
  showAnnotation: boolean
}) {
  const isHero = q.id === PRESS_HERO.id
  const correct = picked === q.correct
  const pickedText = q.options.find((o) => o.key === picked)?.text ?? ''

  if (beat.kind === 'utfall') {
    return (
      <div>
        <p className="lr5b-beat-label">Utfall</p>
        <div className="hpc-m3-verdict">
          <span
            aria-hidden
            className={`hpc-m3-verdict-word ${beat.correct ? 'is-ok' : 'is-bad'}`}
            style={{ animation: 'none' }}
          >
            <span
              style={
                beat.correct
                  ? undefined
                  : { textDecoration: 'line-through', textDecorationThickness: '2px' }
              }
            >
              {pickedText}
            </span>{' '}
            {beat.correct ? '— rätt.' : '— fel.'}
          </span>
          <p className="hpc-m3-verdict-sub">
            {beat.correct ? q.verdictSub.ratt : q.verdictSub.fel}
          </p>
        </div>
        <p className="hpc-m3-solution">{q.lede}</p>
        {isHero && showAnnotation && <Annot>{VEDERHAFTIG.annotations.utfall}</Annot>}
      </div>
    )
  }

  if (beat.kind === 'steg') {
    const step = q.steps[beat.stegIndex]
    return (
      <div>
        <p className="lr5b-beat-label">
          Så löser du den · steg {beat.stegIndex + 1} av {totalOfKind.steg}
        </p>
        <div className="hpc-m3-step" style={{ animation: 'none', borderBottom: 0 }}>
          <span className="hpc-m3-step-n" aria-hidden>
            {beat.stegIndex + 1}.
          </span>
          <div>
            <h3 className="hpc-m3-step-h">
              {step.title}
              <span className="hpc-m3-step-tier">{step.tier}</span>
            </h3>
            <p className="hpc-m3-step-t">{step.body}</p>
          </div>
        </div>
        {isHero && showAnnotation && <Annot>{VEDERHAFTIG.annotations.steg}</Annot>}
      </div>
    )
  }

  if (beat.kind === 'falla') {
    const d = q.distractors[beat.letter]
    const optText = q.options.find((o) => o.key === beat.letter)?.text ?? ''
    const label = beat.dinGissning
      ? 'Din fälla'
      : `Varför de andra lockar · fälla ${totalOfKind.fallaIndex} av ${totalOfKind.falla}`
    return (
      <div className={beat.compressed ? 'lr5b-compressed' : undefined}>
        <p className="lr5b-beat-label">{label}</p>
        <div
          className="hpc-m3-dis"
          style={{ animation: 'none', borderBottom: 0 }}
          data-din-gissning={beat.dinGissning || undefined}
        >
          <div className={beat.dinGissning ? 'lr5b-din-wash' : undefined}>
            <p className="hpc-m3-dis-h">
              <span className="hpc-m3-dis-k">{beat.letter})</span>
              <s>{optText}</s>
              {beat.dinGissning && <span className="lr5b-din-tag">din gissning</span>}
            </p>
            <p className="hpc-m3-dis-l">Varför det lockar</p>
            <p className="hpc-m3-dis-p">{d.whyTempting}</p>
            <p className="hpc-m3-dis-l">Varför det är fel</p>
            <p className="hpc-m3-dis-p">{d.whyWrong}</p>
          </div>
        </div>
        {isHero && showAnnotation && (
          <Annot>
            {correct ? VEDERHAFTIG.annotations.fallorRatt : VEDERHAFTIG.annotations.fallor}{' '}
            <a href="/sign-up">Skapa konto</a>
          </Annot>
        )}
      </div>
    )
  }

  // kvitto — the booking voice: the press announces the print run.
  return (
    <div>
      <p className="lr5b-beat-label">Kvitto</p>
      {isHero && (
        <div className="lr2-note">
          <div className="lr2-note-l">{COPY.revealLabel}</div>
          <p className="lr2-note-t">
            Det du just läste är appens riktiga genomgång — varje fråga i kursen rättas så här.
          </p>
        </div>
      )}
      <p className="lr5b-kvitto-line">
        {beat.correct
          ? 'inga fel att boka — fällorna kartlagda ändå'
          : `felet bokförs: ${q.trapTags[picked] ?? 'fälla'} — trycks ${PRINT_CADENCE.join(' · ')}`}
      </p>
      {isHero && <QuietCta />}
    </div>
  )
}

/* ── beat helpers ─────────────────────────────────────────────────────── */

function beatMeta(beats: PressBeat[], index: number) {
  const beat = beats[index]
  const stegTotal = beats.filter((b) => b.kind === 'steg').length
  const fallor = beats.filter((b) => b.kind === 'falla')
  const fallaIndex = beat.kind === 'falla' ? fallor.indexOf(beat) + 1 : 0
  const firstOfKind = beats.findIndex((b) => b.kind === beat.kind) === index
  return {
    totalOfKind: { steg: stegTotal, falla: fallor.length, fallaIndex },
    showAnnotation: firstOfKind,
  }
}

/** Ink swap between beats — outgoing lifts (ut), incoming dries (tork). */
function BeatSwap({ index, children }: { index: number; children: ReactNode }) {
  const m = useArketMotion()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={index}
        initial={m.rm ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={m.rm ? undefined : { opacity: 0 }}
        transition={m.tork}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/* ── the stage — satsen: fixed-height, content swaps, never grows ─────── */

function PressStage({
  q,
  picked,
  onDone,
}: {
  q: PressContent
  picked: string
  onDone: () => void
}) {
  const beats = useMemo(() => buildPressBeats(q, picked), [q, picked])
  const [index, setIndex] = useState(0)
  const beat = beats[index]
  const last = index === beats.length - 1
  const meta = beatMeta(beats, index)
  const bodyRef = useRef<HTMLDivElement>(null)

  const advance = () => {
    if (last) onDone()
    else {
      setIndex((i) => i + 1)
      bodyRef.current?.scrollTo({ top: 0 })
    }
  }

  return (
    <div className="lr5b-stage" data-testid={`press-stage-${q.id}`}>
      <div className="lr5b-stage-head">
        <span className="lr5b-meter">
          Genomgång · ark {index + 1} av {beats.length}
        </span>
        <button type="button" className="lr5b-skip" onClick={onDone}>
          hoppa över
        </button>
      </div>
      <div className="lr5b-stage-body" ref={bodyRef} aria-live="polite">
        <BeatSwap index={index}>
          <PressBeatView
            q={q}
            beat={beat}
            picked={picked}
            totalOfKind={meta.totalOfKind}
            showAnnotation={meta.showAnnotation}
          />
        </BeatSwap>
      </div>
      <div className="lr5b-stage-foot">
        <button type="button" className="lr5b-next" onClick={advance}>
          {last ? 'Klart' : 'Nästa →'}
        </button>
      </div>
    </div>
  )
}

/* ── the receipt — collapsed stage + the stamped-then-booked narration ── */

function PressReceipt({
  q,
  picked,
  onReplay,
}: {
  q: PressContent
  picked: string
  onReplay: () => void
}) {
  const ok = picked === q.correct
  return (
    <div>
      <div className="lr5b-receipt" data-testid={`press-receipt-${q.id}`}>
        <span className={ok ? 'ok' : 'bad'} aria-hidden>
          {ok ? '✓' : '✗'}
        </span>{' '}
        <span>
          Ark satt · {q.section} · {ok ? 'rätt' : `fel — ${q.trapTags[picked] ?? 'fälla'}`} ·
        </span>{' '}
        <button type="button" className="lr5b-replay" onClick={onReplay}>
          spela upp igen
        </button>
      </div>
      {!ok && (
        <p className="lr5b-booked" data-testid={`press-booked-${q.id}`}>
          ✗ stämplat i tryckloggen — omtryck bokade: {PRINT_CADENCE.join(' · ')} ·{' '}
          <a href="#schemat">se schemat</a>
        </p>
      )}
    </div>
  )
}

/* ── one question's full lifecycle: options → stage → receipt ─────────── */

function PressForm({
  spec,
  onBook,
  hero,
  go,
}: {
  spec: FormSpec
  onBook: (spec: FormSpec, picked: string) => void
  hero?: boolean
  go?: boolean
}) {
  const q = spec.q
  const [picked, setPicked] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle')
  const [playKey, setPlayKey] = useState(0)

  const grade = (k: string) => {
    setPicked(k)
    onBook(spec, k)
    setPhase('playing')
  }
  const replay = () => {
    setPlayKey((n) => n + 1)
    setPhase('playing')
  }

  return (
    <div>
      <PressQuestionView q={q} picked={picked} onPick={grade} hero={hero} go={go} />
      {picked && phase === 'playing' && (
        <PressStage key={playKey} q={q} picked={picked} onDone={() => setPhase('done')} />
      )}
      {picked && phase === 'done' && <PressReceipt q={q} picked={picked} onReplay={replay} />}
    </div>
  )
}

/* ── the margin trycklogg — answers stamped onto the time axis ────────── */

type LoggEntry = {
  id: string
  section: string
  form: number
  date: string
  ok: boolean
  tag: string | null
}

function MarginLedger({ entries }: { entries: LoggEntry[] }) {
  const m = useArketMotion()
  return (
    <div className="lr5b-rail" role="status" aria-label="Trycklogg — dina svar">
      <span className="lr5b-rail-label" aria-hidden>
        Trycklogg
      </span>
      {entries.map((e) => (
        <motion.span
          key={e.id}
          className="lr5b-rail-item"
          initial={m.rm ? false : { opacity: 0, scale: 1.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={m.veck}
        >
          <span className={`lr5b-rail-mark ${e.ok ? 'ok' : 'bad'}`} aria-hidden>
            {e.ok ? '✓' : '✗'}
          </span>
          <span className="lr5b-rail-sec">{e.section}</span>
        </motion.span>
      ))}
    </div>
  )
}

/* ── the schema press — THE climax: booked mistakes are PRINTED ─────────
 *    Each wrong answer becomes a print run: its form-slug header STAMPS,
 *    then the three repetition rows print one by one — each row's rule
 *    drawing left→right ahead of its text drying in. Armed per group the
 *    first time the group is on screen, so the visitor watches the press
 *    work; a correct answer prints a single quiet line instead. */

function PrintRun({ e }: { e: LoggEntry }) {
  const m = useArketMotion()
  const { ref, inView } = useInViewOnce<HTMLDivElement>()
  return (
    <div ref={ref} className="lr5b-run" data-testid={`print-run-${e.id}`}>
      <motion.p
        className="lr5b-run-head"
        initial={false}
        animate={{ opacity: inView ? 1 : 0, scale: inView ? 1 : 1.12 }}
        transition={m.veck}
        style={{ transformOrigin: 'left bottom' }}
      >
        <span className={`mark ${e.ok ? 'ok' : 'bad'}`} aria-hidden>
          {e.ok ? '✓' : '✗'}
        </span>
        <span>
          Form {e.form} · {e.section}
        </span>
        {e.tag && <em>{e.tag}</em>}
      </motion.p>
      {e.ok ? (
        <motion.p
          className="lr5b-run-ok"
          initial={false}
          animate={{ opacity: inView ? 1 : 0 }}
          transition={m.rm ? { duration: 0 } : { ...m.tork, delay: 0.14 }}
        >
          klarad · fällorna kartlagda ändå — inget omtryck behövs
        </motion.p>
      ) : (
        PRINT_CADENCE.map((when, i) => (
          <div key={when} className="lr5b-run-row">
            <motion.div
              className="lr5b-run-row-rule"
              initial={false}
              animate={{ scaleX: inView ? 1 : 0 }}
              transition={m.rm ? { duration: 0 } : { ...m.tween(0.3), delay: 0.18 + i * 0.16 }}
              style={{ transformOrigin: 'left center' }}
            />
            <motion.p
              className="lr5b-run-row-t"
              initial={false}
              animate={{ opacity: inView ? 1 : 0 }}
              transition={m.rm ? { duration: 0 } : { ...m.tork, delay: 0.28 + i * 0.16 }}
            >
              <span>
                {when}
                {i === 0 ? ' — samma fälla, ny uppgift' : ''}
              </span>
              <span className="pass">
                tryck {i + 1} av {PRINT_CADENCE.length}
              </span>
            </motion.p>
          </div>
        ))
      )}
    </div>
  )
}

function SchemaPress({ entries }: { entries: LoggEntry[] }) {
  const okCount = entries.filter((e) => e.ok).length
  const done = entries.length === FORMS.length
  return (
    <div>
      <div role="status" aria-label="Ditt schema — tryckkön">
        {entries.length === 0 && (
          <p className="lr5b-sched-empty">
            svara på uppgifterna ovan — varje fel trycks om här, tryck för tryck
          </p>
        )}
        {entries.map((e) => (
          <PrintRun key={e.id} e={e} />
        ))}
        <div className="lr5b-run-dest">
          <span aria-hidden>◦</span>
          <span>{PROV_DATE_SHORT} · provdagen — då ska kön vara tom</span>
        </div>
      </div>
      {entries.length > 0 && (
        <p className="lr5b-sched-sum">
          {okCount} av {entries.length} rätt · varje fel har blivit tre omtryck i schemat
        </p>
      )}
      {done && (
        <div className="reveal">
          {/* CTA station 2 — earned: the completed print queue opens its own door */}
          <QuietCta />
        </div>
      )}
    </div>
  )
}

/* ── the page ─────────────────────────────────────────────────────────── */

export function LandV5B() {
  const m = useArketMotion()
  const go = usePressGo(m.rm)
  const sticky = useStickyCta()
  const days = useMemo(() => daysUntilProv(), [])

  const [entries, setEntries] = useState<LoggEntry[]>([])
  const book = (spec: FormSpec, picked: string) =>
    setEntries((es) => {
      if (es.some((e) => e.id === spec.q.id)) return es
      const ok = picked === spec.q.correct
      return [
        ...es,
        {
          id: spec.q.id,
          section: spec.q.section,
          form: spec.form,
          date: spec.date,
          ok,
          tag: ok ? null : (spec.q.trapTags[picked] ?? 'fälla'),
        },
      ]
    })

  // The hero slug: "sätts ▮" while the headword is being stamped, then
  // "satt · svara". Under reduced motion the set is instant — no caret.
  const [setting, setSetting] = useState(!m.rm)
  useEffect(() => {
    if (m.rm) {
      setSetting(false)
      return
    }
    if (!go) return
    const t = setTimeout(() => setSetting(false), 2200)
    return () => clearTimeout(t)
  }, [m.rm, go])

  const dateline = `Högskoleprovet · ${PROV_DATE_LABEL} · om ${days} dagar`

  return (
    <div className="lr5b-root">
      <style>{LR2_CSS}</style>
      <style>{LR5B_CSS}</style>
      <MarginLedger entries={entries} />
      <div className="lr5b-col">
        {/* ── the masthead is SET: rule ruled → brand inked → the
               countdown dateline composed character by character ── */}
        <section ref={sticky.heroRef} aria-label="HP-Coach — nedräkning till provet">
          <motion.header
            className="lr5b-masthead"
            initial={false}
            animate={{ opacity: go ? 1 : 0 }}
            transition={
              m.rm ? { duration: 0 } : { duration: 0.28, ease: [...EASE.reading], delay: 0.12 }
            }
          >
            <span className="lr5b-brand">{COPY.brand}</span>
            <span className="lr2-folio">
              {COPY.tagline} · {COPY.domain}
            </span>
          </motion.header>
          <motion.div
            className="lr5b-rule"
            style={{ transformOrigin: 'left center' }}
            initial={false}
            animate={{ scaleX: go ? 1 : 0 }}
            transition={m.tween(0.34)}
          />

          {/* the dateline — print's one living element, composed live */}
          <p className="lr5b-dateline">
            <ComposedLine text={dateline} go={go} baseDelay={0.34} showCaretWhile={1.35} />
          </p>

          {/* the hero form slug — FORM numbers are DATES */}
          <motion.p
            className="lr5b-slug"
            style={{ marginTop: 22 }}
            initial={false}
            animate={{ opacity: go ? 1 : 0 }}
            transition={
              m.rm ? { duration: 0 } : { duration: 0.22, ease: [...EASE.reading], delay: 1.15 }
            }
          >
            <span className="lr5b-slug-date">Ikväll</span>
            <span>
              form 1 · ORD · {setting ? 'sätts ' : 'satt · svara '}
              {setting && !m.rm && (
                <span className="lr5b-caret" aria-hidden>
                  ▮
                </span>
              )}
            </span>
          </motion.p>

          {/* the enormous headword, stamped letter by letter */}
          <motion.div
            className="hpc-m3-eyebrow"
            style={{ marginTop: 14 }}
            initial={false}
            animate={{ opacity: go ? 1 : 0 }}
            transition={
              m.rm ? { duration: 0 } : { duration: 0.22, ease: [...EASE.reading], delay: 1.3 }
            }
          >
            {PRESS_HERO.kicker}
          </motion.div>
          <SetType word={PRESS_HERO.headword ?? ''} go={go} baseDelay={1.42} />

          <PressForm spec={FORMS[0]} onBook={book} hero go={go} />

          <motion.div
            initial={false}
            animate={{ opacity: go ? 1 : 0 }}
            transition={
              m.rm ? { duration: 0 } : { duration: 0.28, ease: [...EASE.reading], delay: 2.3 }
            }
          >
            <p className="lr2-folio" style={{ marginTop: 16 }}>
              {COPY.exampleTag}
            </p>
            {/* CTA station 1 — the early door: conversion never waits on playing */}
            <QuietCta />
          </motion.div>
        </section>

        <PressStation date="Marginal" label="Marginal · varför noll">
          <div className="lr2-note">
            <div className="lr2-note-l">{COPY.claims.zero.label}</div>
            <p className="lr2-note-t">{COPY.claims.zero.text}</p>
          </div>
        </PressStation>

        <PressStation date="I morgon" slug="form 2 · KVA" label="I morgon · form 2 · KVA">
          <p className="lr2-folio" style={{ marginBottom: 14 }}>
            {COPY.exampleTag}
          </p>
          <PressForm spec={FORMS[1]} onBook={book} />
        </PressStation>

        <PressStation date="Marginal" label="Marginal · en sak i taget">
          <div className="lr2-note">
            <div className="lr2-note-l">{COPY.claims.adhd.label}</div>
            <p className="lr2-note-t">{COPY.claims.adhd.text}</p>
          </div>
        </PressStation>

        <PressStation date="Om tre dagar" slug="form 3 · ORD" label="Om tre dagar · form 3 · ORD">
          <p className="lr2-folio" style={{ marginBottom: 14 }}>
            {COPY.exampleTag}
          </p>
          <PressForm spec={FORMS[2]} onBook={book} />
        </PressStation>

        {/* the press's proudest impression — enormous type before the queue */}
        <PressStation date="Marginal" label="Marginal · varför fel lönar sig">
          <h2 className="lr5b-pull">{COPY.claims.loop.label}.</h2>
          <p className="lr2-body" style={{ marginTop: 16, maxWidth: '46ch' }}>
            {COPY.claims.loop.text}
          </p>
        </PressStation>

        <PressStation
          date="Ditt schema"
          slug="tryckkön"
          label="Ditt schema · tryckkön"
          id="schemat"
        >
          <SchemaPress entries={entries} />
        </PressStation>

        <PressStation date="Veckan före provet" label="Veckan före provet">
          <div className="lr2-note">
            <div className="lr2-note-l">{COPY.claims.target.label}</div>
            <p className="lr2-note-t">{COPY.claims.target.text}</p>
          </div>
        </PressStation>

        <PressStation
          date="Provdagen"
          slug={PROV_DATE_SHORT}
          label={`Provdagen · ${PROV_DATE_SHORT}`}
        >
          <p className="lr5b-scene">
            Klockan 08:10 öppnas häftet. Varje fälla i din kö har då tryckts om tre gånger — den här
            gången är det du som känner igen den först.
          </p>
          <section ref={sticky.endRef} aria-label="Pris och konto">
            <PriceBlock />
            <Cta sub={COPY.ctaSub} />
          </section>
        </PressStation>

        <hr className="lr2-sep" style={{ marginBottom: 20 }} />
        <div className="lr2-brandline">
          <span className="lr2-folio">{COPY.brand} · byggd av en som själv skriver provet</span>
          <span className="lr2-folio">2.0</span>
        </div>
        <p className="lr2-human" style={{ marginTop: 10 }}>
          {COPY.human}
        </p>
      </div>

      <StickyCta visible={sticky.visible} />
    </div>
  )
}

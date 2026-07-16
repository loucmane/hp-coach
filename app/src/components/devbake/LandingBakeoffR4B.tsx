// LandingBakeoffR4B — landing v4 art-direction bake-off, variant B
// "TRYCKPRESSEN". The page is a print run you watch being made.
//
// Thesis: take the Boksidan print idiom literal and kinetic. The load
// sequence SETS the masthead (rule ruled, brand inked, a mono composing
// slug ticking) and then stamps the hero headword letter by letter at
// editorial scale, ending on one impression-settle (veck — the house
// register for material seating). Every scroll station ARRIVES as a
// press operation: its rule is ruled, its FORM numeral is stamped, its
// content dries in. Receipts from finished genomgångar accumulate in a
// fixed margin ledger (trycklogg) that grows as you answer.
//
// Mechanics (owner-decided, from v3): EVERY demo question plays the
// full Scenen-style genomgång beat loop (skippable) and collapses to a
// one-line replayable receipt. The hero rides the R3 beat engine +
// vederhäftig content VERBATIM (LandingBakeoffR3.logic — imported, not
// modified); forms 2–3 use original content in the same structure
// (LandingBakeoffR4B.content). Four-station CTA contract intact via
// LandingBakeoffR2 imports (early door, earned, sticky, price).
//
// Motion: lib/motion tokens only. Ink dries (tork), lifts (ut), rules
// draw as tweens, marks seat on veck — zero entrance travel anywhere.
// Reduced motion collapses every beat to its final state (useMountGo
// starts true; tweens/springs become duration 0).
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

/* ── styles — layout only; color/type from live tokens ────────────────── */

const LR4B_CSS = `
.lr4b-root {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-ui);
  letter-spacing: var(--font-ui-track);
  font-size: 15px;
  line-height: 1.55;
  min-height: 100vh;
}
.lr4b-col {
  max-width: 640px;
  margin: 0 auto;
  padding: 26px 18px 110px 44px; /* left clears the margin ledger rail */
}
/* ── the margin ledger — trycklogg ── */
.lr4b-rail {
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
.lr4b-rail-label {
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.22em;
  color: var(--muted);
  writing-mode: vertical-rl;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.lr4b-rail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.lr4b-rail-mark { font-size: 15px; line-height: 1; }
.lr4b-rail-mark.ok { color: var(--ok); }
.lr4b-rail-mark.bad { color: var(--bad); }
.lr4b-rail-sec {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.14em;
  color: var(--muted);
  writing-mode: vertical-rl;
  text-transform: uppercase;
}
/* ── the masthead ── */
.lr4b-masthead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 20px;
  flex-wrap: wrap;
  padding-bottom: 10px;
}
.lr4b-brand {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 17px;
  letter-spacing: -0.01em;
  color: var(--ink);
}
.lr4b-rule { height: 1px; background: var(--ink); }
.lr4b-slug {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 18px 0 0;
  font-variant-numeric: tabular-nums;
}
.lr4b-caret {
  display: inline-block;
  width: 7px;
  color: var(--accent);
  animation: lr4b-blink 0.9s steps(2, start) infinite;
}
@media (prefers-reduced-motion: reduce) { .lr4b-caret { animation: none; } }
@keyframes lr4b-blink { 50% { opacity: 0; } }
/* ── the enormous headword — the press's proudest impression ── */
.lr4b-headword {
  font-family: var(--font-display);
  font-weight: var(--font-display-w);
  letter-spacing: var(--font-display-track);
  line-height: 0.98;
  color: var(--ink);
  font-size: clamp(54px, 15vw, 118px);
  margin: 6px 0 0;
  overflow-wrap: anywhere;
}
/* ── press stations ── */
.lr4b-station { margin-top: 64px; }
.lr4b-form-slug {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 6px;
}
.lr4b-form-n {
  font-family: var(--font-mono);
  font-size: 26px;
  line-height: 1;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.lr4b-form-l {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}
.lr4b-station-rule { height: 1px; background: var(--ink); margin-bottom: 20px; }
.lr4b-pull {
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
/* ── the composed stage — satsen ── */
.lr4b-stage {
  border: 1px solid var(--hairline);
  border-top: 3px double var(--ink);
  border-radius: 0 0 6px 6px;
  background: var(--bg);
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  height: 590px; /* FIXED — sized to the longest beat; content swaps, the card never grows */
  overflow: hidden;
}
.lr4b-stage-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--hairline);
}
.lr4b-meter {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.lr4b-skip {
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
.lr4b-skip:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.lr4b-stage-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 16px 8px;
}
.lr4b-stage-foot {
  padding: 12px 16px;
  border-top: 1px solid var(--hairline);
  display: flex;
  justify-content: flex-end;
}
.lr4b-next {
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
.lr4b-next:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.lr4b-beat-label {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 12px;
}
.lr4b-annot {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.6;
  letter-spacing: 0.04em;
  color: var(--accent);
  margin: 16px 0 0;
  max-width: 46ch;
}
.lr4b-annot a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.lr4b-din-tag {
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
.lr4b-din-wash {
  background: var(--bad-soft);
  border-radius: 6px;
  padding: 12px 14px;
  margin: 0 -14px;
}
.lr4b-compressed .hpc-m3-dis-p { font-size: 12.5px; line-height: 1.55; }
.lr4b-compressed .hpc-m3-dis-h { font-size: 14px; }
.lr4b-kvitto-line {
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  margin: 14px 0 0;
  font-variant-numeric: tabular-nums;
}
/* ── the receipt — a printed ledger line ── */
.lr4b-receipt {
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
.lr4b-receipt .ok { color: var(--ok); }
.lr4b-receipt .bad { color: var(--bad); }
.lr4b-replay {
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
.lr4b-replay:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
/* ── the in-flow trycklogg ── */
.lr4b-logg {
  font-family: var(--font-mono);
  font-size: 14px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  display: flex;
  gap: 12px;
  align-items: baseline;
  flex-wrap: wrap;
  font-variant-numeric: tabular-nums;
}
.lr4b-logg .ok, .lr4b-logg .bad, .lr4b-logg .slot { font-size: 19px; line-height: 1; }
.lr4b-logg .ok { color: var(--ok); }
.lr4b-logg .bad { color: var(--bad); }
.lr4b-logg .slot { color: var(--muted); }
@media (min-width: 900px) {
  .lr4b-col { max-width: 700px; padding: 48px 24px 130px 72px; }
  .lr4b-rail { width: 46px; padding-top: 140px; }
  .lr4b-rail-label { font-size: 9.5px; }
  .lr4b-rail-mark { font-size: 17px; }
  .lr4b-rail-sec { font-size: 9px; }
  .lr4b-stage { height: 540px; }
  .lr4b-station { margin-top: 88px; }
}
`

/* ── SetType — the letterpress set of the enormous headword ───────────── */

function SetType({ word, go, baseDelay }: { word: string; go: boolean; baseDelay: number }) {
  const m = useArketMotion()
  const letters = useMemo(() => Array.from(word), [word])
  const settleDelay = baseDelay + letters.length * 0.045 + 0.1
  return (
    <motion.h1
      className="lr4b-headword"
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

/* ── PressStation — a scroll station that ARRIVES as a press operation ── */

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

function PressStation({ n, label, children }: { n?: string; label: string; children: ReactNode }) {
  const m = useArketMotion()
  const { ref, inView } = useInViewOnce<HTMLElement>()
  return (
    <section ref={ref} className="lr4b-station" aria-label={label}>
      <div className="lr4b-form-slug">
        {n && (
          <motion.span
            className="lr4b-form-n"
            aria-hidden
            initial={false}
            animate={{ opacity: inView ? 1 : 0, scale: inView ? 1 : 1.2 }}
            transition={m.veck}
            style={{ display: 'inline-block', transformOrigin: 'left bottom' }}
          >
            {n}
          </motion.span>
        )}
        <motion.span
          className="lr4b-form-l"
          initial={false}
          animate={{ opacity: inView ? 1 : 0 }}
          transition={m.rm ? { duration: 0 } : { ...m.tork, delay: 0.08 }}
        >
          {label}
        </motion.span>
      </div>
      <motion.div
        className="lr4b-station-rule"
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
        transition={{ duration: 0.28, ease: [...EASE.reading], delay: hero ? 1.05 : 0 }}
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
  return <p className="lr4b-annot">»{children}«</p>
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
        <p className="lr4b-beat-label">Utfall</p>
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
        <p className="lr4b-beat-label">
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
      <div className={beat.compressed ? 'lr4b-compressed' : undefined}>
        <p className="lr4b-beat-label">{label}</p>
        <div
          className="hpc-m3-dis"
          style={{ animation: 'none', borderBottom: 0 }}
          data-din-gissning={beat.dinGissning || undefined}
        >
          <div className={beat.dinGissning ? 'lr4b-din-wash' : undefined}>
            <p className="hpc-m3-dis-h">
              <span className="hpc-m3-dis-k">{beat.letter})</span>
              <s>{optText}</s>
              {beat.dinGissning && <span className="lr4b-din-tag">din gissning</span>}
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

  // kvitto
  return (
    <div>
      <p className="lr4b-beat-label">Kvitto</p>
      {isHero && (
        <div className="lr2-note">
          <div className="lr2-note-l">{COPY.revealLabel}</div>
          <p className="lr2-note-t">
            Det du just läste är appens riktiga genomgång — varje fråga i kursen rättas så här.
          </p>
        </div>
      )}
      <p className="lr4b-kvitto-line">
        {beat.correct
          ? 'inga fel att tagga — fällorna kartlagda ändå'
          : `felet taggat: ${q.trapTags[picked] ?? 'fälla'} → repetitionskön`}
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
    <div className="lr4b-stage" data-testid={`press-stage-${q.id}`}>
      <div className="lr4b-stage-head">
        <span className="lr4b-meter">
          Genomgång · ark {index + 1} av {beats.length}
        </span>
        <button type="button" className="lr4b-skip" onClick={onDone}>
          hoppa över
        </button>
      </div>
      <div className="lr4b-stage-body" ref={bodyRef} aria-live="polite">
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
      <div className="lr4b-stage-foot">
        <button type="button" className="lr4b-next" onClick={advance}>
          {last ? 'Klart' : 'Nästa →'}
        </button>
      </div>
    </div>
  )
}

/* ── the receipt — the collapsed stage as a printed ledger line ───────── */

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
    <div className="lr4b-receipt" data-testid={`press-receipt-${q.id}`}>
      <span className={ok ? 'ok' : 'bad'} aria-hidden>
        {ok ? '✓' : '✗'}
      </span>{' '}
      <span>
        Ark satt · {q.section} · {ok ? 'rätt' : `fel — ${q.trapTags[picked] ?? 'fälla'}`} ·
      </span>{' '}
      <button type="button" className="lr4b-replay" onClick={onReplay}>
        spela igen
      </button>
    </div>
  )
}

/* ── one question's full lifecycle: options → stage → receipt ─────────── */

function PressForm({
  q,
  onBook,
  hero,
  go,
}: {
  q: PressContent
  onBook: (q: PressContent, ok: boolean) => void
  hero?: boolean
  go?: boolean
}) {
  const [picked, setPicked] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle')
  const [playKey, setPlayKey] = useState(0)

  const grade = (k: string) => {
    setPicked(k)
    onBook(q, k === q.correct)
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

/* ── the margin ledger — trycklogg, growing as you answer ─────────────── */

type LoggEntry = { id: string; section: string; ok: boolean }

function MarginLedger({ entries }: { entries: LoggEntry[] }) {
  const m = useArketMotion()
  return (
    <div className="lr4b-rail" role="status" aria-label="Trycklogg — dina svar">
      <span className="lr4b-rail-label" aria-hidden>
        Trycklogg
      </span>
      {entries.map((e) => (
        <motion.span
          key={e.id}
          className="lr4b-rail-item"
          initial={m.rm ? false : { opacity: 0, scale: 1.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={m.veck}
        >
          <span className={`lr4b-rail-mark ${e.ok ? 'ok' : 'bad'}`} aria-hidden>
            {e.ok ? '✓' : '✗'}
          </span>
          <span className="lr4b-rail-sec">{e.section}</span>
        </motion.span>
      ))}
    </div>
  )
}

/* ── the press-go gate — the set must play in FRONT of the audience ───── */

/**
 * `useMountGo` arms two rAFs after mount — but this page mounts BEHIND
 * the boot veil (#boot-veil holds until `hpc:first-content` + 2 rAFs),
 * so a mount-armed load sequence has already finished by the time the
 * curtain lifts and the visitor sees only the settled page. This gate
 * fires the first-content signal itself (the page's primary content is
 * committed at mount) and then waits until the veil ELEMENT is actually
 * gone from the DOM before flipping `go` — the press run starts on the
 * first visible frame. Reduced motion: `go` starts true (final state
 * on first paint), identical to the useMountGo contract.
 */
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

/* ── the page ─────────────────────────────────────────────────────────── */

export function LandV4B() {
  const m = useArketMotion()
  const go = usePressGo(m.rm)
  const sticky = useStickyCta()

  const [entries, setEntries] = useState<LoggEntry[]>([])
  const book = (q: PressContent, ok: boolean) =>
    setEntries((es) =>
      es.some((e) => e.id === q.id) ? es : [...es, { id: q.id, section: q.section, ok }],
    )

  // The composing caret ticks while the headword is being set, then
  // lifts. Under reduced motion the set is instant, so no caret at all.
  const [setting, setSetting] = useState(!m.rm)
  useEffect(() => {
    if (m.rm) {
      setSetting(false)
      return
    }
    if (!go) return
    const t = setTimeout(() => setSetting(false), 1350)
    return () => clearTimeout(t)
  }, [m.rm, go])

  const forms = [PRESS_HERO, PRESS_KVA, PRESS_ORD2]
  const allDone = forms.every((q) => entries.some((e) => e.id === q.id))
  const okCount = entries.filter((e) => e.ok).length

  return (
    <div className="lr4b-root">
      <style>{LR2_CSS}</style>
      <style>{LR4B_CSS}</style>
      <MarginLedger entries={entries} />
      <div className="lr4b-col">
        {/* ── the masthead is SET: rule ruled → brand inked → slug ticks ── */}
        <section ref={sticky.heroRef} aria-label="HP-Coach — vad sidan är">
          <motion.header
            className="lr4b-masthead"
            initial={false}
            animate={{ opacity: go ? 1 : 0 }}
            transition={
              m.rm ? { duration: 0 } : { duration: 0.28, ease: [...EASE.reading], delay: 0.12 }
            }
          >
            <span className="lr4b-brand">{COPY.brand}</span>
            <span className="lr2-folio">
              {COPY.tagline} · {COPY.domain}
            </span>
          </motion.header>
          <motion.div
            className="lr4b-rule"
            style={{ transformOrigin: 'left center' }}
            initial={false}
            animate={{ scaleX: go ? 1 : 0 }}
            transition={m.tween(0.34)}
          />

          {/* the composing slug — the unseen typographer's voice */}
          <motion.p
            className="lr4b-slug"
            initial={false}
            animate={{ opacity: go ? 1 : 0 }}
            transition={
              m.rm ? { duration: 0 } : { duration: 0.22, ease: [...EASE.reading], delay: 0.3 }
            }
          >
            Form 1 · ORD · {setting ? 'sätts ' : 'satt · svara '}
            {setting && (
              <span className="lr4b-caret" aria-hidden>
                ▮
              </span>
            )}
          </motion.p>

          {/* the enormous headword, stamped letter by letter */}
          <motion.div
            className="hpc-m3-eyebrow"
            style={{ marginTop: 14 }}
            initial={false}
            animate={{ opacity: go ? 1 : 0 }}
            transition={
              m.rm ? { duration: 0 } : { duration: 0.22, ease: [...EASE.reading], delay: 0.38 }
            }
          >
            {PRESS_HERO.kicker}
          </motion.div>
          <SetType word={PRESS_HERO.headword ?? ''} go={go} baseDelay={0.46} />

          <PressForm q={PRESS_HERO} onBook={book} hero go={go} />

          <motion.div
            initial={false}
            animate={{ opacity: go ? 1 : 0 }}
            transition={
              m.rm ? { duration: 0 } : { duration: 0.28, ease: [...EASE.reading], delay: 1.25 }
            }
          >
            <p className="lr2-folio" style={{ marginTop: 16 }}>
              {COPY.exampleTag}
            </p>
            {/* station 1 — the early door: conversion never waits on playing */}
            <QuietCta />
          </motion.div>
        </section>

        <PressStation label="Marginal · varför noll">
          <div className="lr2-note">
            <div className="lr2-note-l">{COPY.claims.zero.label}</div>
            <p className="lr2-note-t">{COPY.claims.zero.text}</p>
          </div>
        </PressStation>

        <PressStation n="2" label="Form 2 · KVA · exempel">
          <p className="lr2-folio" style={{ marginBottom: 14 }}>
            {COPY.exampleTag}
          </p>
          <PressForm q={PRESS_KVA} onBook={book} />
        </PressStation>

        {/* the press's proudest impression — enormous type, used with precision */}
        <PressStation label="Marginal · varför fel lönar sig">
          <h2 className="lr4b-pull">{COPY.claims.loop.label}.</h2>
          <p className="lr2-body" style={{ marginTop: 16, maxWidth: '46ch' }}>
            {COPY.claims.loop.text}
          </p>
        </PressStation>

        <PressStation n="3" label="Form 3 · ORD · exempel">
          <p className="lr2-folio" style={{ marginBottom: 14 }}>
            {COPY.exampleTag}
          </p>
          <PressForm q={PRESS_ORD2} onBook={book} />
        </PressStation>

        <PressStation label="Utfall · din session">
          <div className="lr4b-logg" role="status" aria-label="Sessionens resultat">
            {forms.map((q) => {
              const e = entries.find((x) => x.id === q.id)
              return e ? (
                <span key={q.id} className={e.ok ? 'ok' : 'bad'}>
                  {e.ok ? '✓' : '✗'}
                </span>
              ) : (
                <span key={q.id} className="slot" aria-hidden>
                  ·
                </span>
              )
            })}
            {entries.length === 0 ? (
              <span style={{ color: 'var(--muted)' }}>
                svara på uppgifterna ovan — resultatet bokförs här
              </span>
            ) : (
              <span>
                {okCount} av {entries.length} rätt · varje fel taggas mot en känd fälla
              </span>
            )}
          </div>
          {allDone && (
            <div className="reveal">
              {/* station 2 — earned: the completed ledger opens its own door */}
              <QuietCta />
            </div>
          )}
          <div className="lr2-note" style={{ marginTop: 26 }}>
            <div className="lr2-note-l">{COPY.claims.adhd.label}</div>
            <p className="lr2-note-t">{COPY.claims.adhd.text}</p>
          </div>
          <div className="lr2-note" style={{ marginTop: 24 }}>
            <div className="lr2-note-l">{COPY.claims.target.label}</div>
            <p className="lr2-note-t">{COPY.claims.target.text}</p>
          </div>
        </PressStation>

        <PressStation label="Pris · villkor i klartext">
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

// LandingBakeoffR3 — landing-page bake-off ROUND 3 ("the full experience
// as the pitch"). Two chips, both FULL landing pages derived from the
// shipped P2v2 base (LandingBakeoffR2 — masthead, thesis, rail chassis,
// four-station CTA system), both consuming the SAME hand-written
// vederhäftig genomgång (LandingBakeoffR3.logic — content verbatim from
// docs/superpowers/consults/landing-pedagogy-consult.md § 3):
//
//   LAND_P3S "Scenen"   — after grading the hero question a FIXED-HEIGHT
//       in-scroll stage card appears and the full genomgång plays inside
//       it, one beat per tap: UTFALL → steg 1–3 → fällor (din-fälla-
//       först: the visitor's own distractor autopsy leads, tagged
//       "din gissning" with a quiet --bad-soft wash; the rest follow
//       compressed) → KVITTO with the earned CTA. Mono progress meter,
//       "hoppa över" always available, the card NEVER grows (content
//       swaps; the page behind stays still). After the loop it collapses
//       to a one-line replayable receipt and the scroll resumes.
//
//   LAND_P3B "Bläddran" — grading opens a full-screen stepped takeover
//       playing the SAME beats in product-verbatim order (UTFALL → steg
//       → ALL fällor equally, the picked one tagged in place). Esc /
//       stäng exits back to the page at the same scroll position; the
//       phone back button closes the takeover without leaving the SPA
//       (one pushed history entry, popstate closes — see logic module).
//
// Correct-answer path: the verdict uses the consult's rätt-variant copy
// and the genomgång still plays (steps + fällor) with the "rätt — men
// visste du varför fel?" framing. Other demo questions stay verdict-only
// ("ett fel, hela vägen" — one full specimen). Exactly three landing-
// voice margin annotations (mono, accent — visibly not product voice).
//
// CTA system (four stations) intact from round 2.1: early inline door,
// earned moments (kvitto beat + completed ledger), sticky bar, price
// block. LEGAL: all demo content is ORIGINAL, written for HP-Coach —
// nothing from the © UHR corpus; labeled on the page itself.
//
// Motion: tokens from lib/motion only (tork/ut ink swaps, veck seat);
// beats still advance under prefers-reduced-motion, just without motion.
// DESIGN artifact — consumed by /dev/landing-bakeoff. Kept forever.

import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { useArketMotion, useMountGo } from '@/lib/motion'

import {
  COPY,
  Cta,
  DemoQuestion,
  Ink,
  LR2_CSS,
  PriceBlock,
  Q_KVA,
  QuietCta,
  RailRow,
  StickyCta,
  useStickyCta,
} from './LandingBakeoffR2'
import {
  type Beat,
  buildBeats,
  closeTakeover,
  type GenomgangMode,
  type OptionKey,
  TRAP_TAGS,
  useTakeoverHistory,
  VEDERHAFTIG,
} from './LandingBakeoffR3.logic'

/* ── landing-local styles (layout only; color/type from live tokens) ──── */

const LR3_CSS = `
.lr3-stage {
  border: 1px solid var(--hairline);
  border-radius: 6px;
  background: var(--bg);
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  height: 590px; /* FIXED — sized to the longest beat (din fälla d); the card never grows, content swaps inside */
  overflow: hidden;
}
.lr3-stage-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--hairline);
}
.lr3-meter {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.lr3-skip {
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
.lr3-skip:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.lr3-stage-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 16px 8px;
}
.lr3-stage-foot {
  padding: 12px 16px calc(12px + 2px);
  border-top: 1px solid var(--hairline);
  display: flex;
  justify-content: flex-end;
}
.lr3-next {
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
.lr3-next:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.lr3-beat-label {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 12px;
}
.lr3-annot {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.6;
  letter-spacing: 0.04em;
  color: var(--accent);
  margin: 16px 0 0;
  max-width: 46ch;
}
.lr3-annot a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.lr3-din-tag {
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
.lr3-din-wash {
  background: var(--bad-soft);
  border-radius: 6px;
  padding: 12px 14px;
  margin: 0 -14px;
}
.lr3-compressed .hpc-m3-dis-p { font-size: 12.5px; line-height: 1.55; }
.lr3-compressed .hpc-m3-dis-h { font-size: 14px; }
.lr3-receipt {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 22px;
  padding: 12px 14px;
  border: 1px solid var(--hairline);
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
}
.lr3-replay {
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
.lr3-replay:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.lr3-takeover {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: var(--bg);
  display: flex;
  flex-direction: column;
}
.lr3-takeover-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: calc(14px + env(safe-area-inset-top, 0px)) 20px 12px;
  border-bottom: 1px solid var(--hairline);
}
.lr3-takeover-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain; /* no scroll chaining to the page behind */
  width: 100%;
}
.lr3-takeover-col {
  max-width: 560px;
  margin: 0 auto;
  padding: 26px 20px 20px;
}
.lr3-takeover-foot {
  border-top: 1px solid var(--hairline);
  padding: 12px 20px calc(12px + env(safe-area-inset-bottom, 0px));
}
.lr3-takeover-foot-row {
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  justify-content: flex-end;
}
.lr3-kvitto-line {
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  margin: 14px 0 0;
  font-variant-numeric: tabular-nums;
}
@media (min-width: 900px) {
  .lr3-stage { height: 540px; }
}
`

/* ── the hero question — vederhäftig, options only (the genomgång's
 *    UTFALL beat carries the verdict, so the page never doubles it) ───── */

function HeroQuestion({
  picked,
  onPick,
}: {
  picked: OptionKey | null
  onPick: (k: OptionKey) => void
}) {
  const graded = picked !== null
  return (
    <div>
      <div className="hpc-m3-eyebrow">{VEDERHAFTIG.kicker}</div>
      <h2 className="hpc-m3-display" style={{ fontSize: 'clamp(40px, 10vw, 56px)' }}>
        {VEDERHAFTIG.headword}
      </h2>
      <div className="hpc-m3-opts" style={{ marginTop: 18 }}>
        {VEDERHAFTIG.options.map((opt) => {
          const isPick = picked === opt.key
          const isRight = graded && opt.key === VEDERHAFTIG.correct
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
      </div>
    </div>
  )
}

/* ── margin annotation — the landing's curator-pencil voice (mono,
 *    accent) — visibly NOT the product's serif pedagogy voice ─────────── */

function Annot({ children }: { children: ReactNode }) {
  return <p className="lr3-annot">»{children}«</p>
}

/* ── one beat, rendered — shared by the stage and the takeover ────────── */

function BeatView({
  beat,
  picked,
  totalOfKind,
  showAnnotation,
}: {
  beat: Beat
  picked: OptionKey
  /** For "STEG n AV 3" / "FÄLLA n AV 4" labels. */
  totalOfKind: { steg: number; falla: number; fallaIndex: number }
  showAnnotation: boolean
}) {
  const correct = picked === VEDERHAFTIG.correct
  const pickedText = VEDERHAFTIG.options.find((o) => o.key === picked)?.text ?? ''

  if (beat.kind === 'utfall') {
    return (
      <div>
        <p className="lr3-beat-label">Utfall</p>
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
            {beat.correct ? VEDERHAFTIG.verdictSub.ratt : VEDERHAFTIG.verdictSub.fel}
          </p>
        </div>
        <p className="hpc-m3-solution">{VEDERHAFTIG.lede}</p>
        {showAnnotation && <Annot>{VEDERHAFTIG.annotations.utfall}</Annot>}
      </div>
    )
  }

  if (beat.kind === 'steg') {
    const step = VEDERHAFTIG.steps[beat.stegIndex]
    return (
      <div>
        <p className="lr3-beat-label">
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
        {showAnnotation && <Annot>{VEDERHAFTIG.annotations.steg}</Annot>}
      </div>
    )
  }

  if (beat.kind === 'falla') {
    const d = VEDERHAFTIG.distractors[beat.letter]
    const optText = VEDERHAFTIG.options.find((o) => o.key === beat.letter)?.text ?? ''
    const label = beat.dinGissning
      ? 'Din fälla'
      : `Varför de andra lockar · fälla ${totalOfKind.fallaIndex} av ${totalOfKind.falla}`
    return (
      <div className={beat.compressed ? 'lr3-compressed' : undefined}>
        <p className="lr3-beat-label">{label}</p>
        <div
          className="hpc-m3-dis"
          style={{ animation: 'none', borderBottom: 0 }}
          data-din-gissning={beat.dinGissning || undefined}
        >
          <div className={beat.dinGissning ? 'lr3-din-wash' : undefined}>
            <p className="hpc-m3-dis-h">
              <span className="hpc-m3-dis-k">{beat.letter})</span>
              <s>{optText}</s>
              {beat.dinGissning && <span className="lr3-din-tag">din gissning</span>}
            </p>
            <p className="hpc-m3-dis-l">Varför det lockar</p>
            <p className="hpc-m3-dis-p">{d.whyTempting}</p>
            <p className="hpc-m3-dis-l">Varför det är fel</p>
            <p className="hpc-m3-dis-p">{d.whyWrong}</p>
          </div>
        </div>
        {showAnnotation && (
          <Annot>
            {correct ? VEDERHAFTIG.annotations.fallorRatt : VEDERHAFTIG.annotations.fallor}{' '}
            <a href="/sign-up">Skapa konto</a>
          </Annot>
        )}
      </div>
    )
  }

  // kvitto — the earned station.
  return (
    <div>
      <p className="lr3-beat-label">Kvitto</p>
      <div className="lr2-note">
        <div className="lr2-note-l">{COPY.revealLabel}</div>
        <p className="lr2-note-t">
          Det du just läste är appens riktiga genomgång — varje fråga i kursen rättas så här.
        </p>
      </div>
      <p className="lr3-kvitto-line">
        {beat.correct
          ? 'inga fel att tagga — fällorna kartlagda ändå'
          : `felet taggat: ${TRAP_TAGS[picked as keyof typeof TRAP_TAGS]} → repetitionskön`}
      </p>
      <QuietCta />
    </div>
  )
}

/* ── beat engine helpers ──────────────────────────────────────────────── */

function beatMeta(beats: Beat[], index: number) {
  const beat = beats[index]
  const stegTotal = beats.filter((b) => b.kind === 'steg').length
  const fallor = beats.filter((b) => b.kind === 'falla')
  const fallaIndex = beat.kind === 'falla' ? fallor.findIndex((b) => b === beat) + 1 : 0
  const firstOfKind = beats.findIndex((b) => b.kind === beat.kind) === index
  // Annotations: exactly three — UTFALL, first steg, first fälla.
  const showAnnotation =
    (beat.kind === 'utfall' || beat.kind === 'steg' || beat.kind === 'falla') && firstOfKind
  return {
    totalOfKind: { steg: stegTotal, falla: fallor.length, fallaIndex },
    showAnnotation,
  }
}

/** Ink-swap between beats: outgoing ink lifts (ut), incoming dries in
 *  (tork). Zero travel — Arket-lawful; instant under reduced motion. */
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

/* ── P3S — "Scenen": the fixed-height in-scroll stage card ────────────── */

function GenomgangStage({ picked, onDone }: { picked: OptionKey; onDone: () => void }) {
  const beats = useMemo(() => buildBeats({ mode: 'scenen', picked }), [picked])
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
    <div className="lr3-stage" data-testid="genomgang-stage">
      <div className="lr3-stage-head">
        <span className="lr3-meter">
          Genomgång · {index + 1} av {beats.length}
        </span>
        <button type="button" className="lr3-skip" onClick={onDone}>
          hoppa över
        </button>
      </div>
      <div className="lr3-stage-body" ref={bodyRef} aria-live="polite">
        <BeatSwap index={index}>
          <BeatView
            beat={beat}
            picked={picked}
            totalOfKind={meta.totalOfKind}
            showAnnotation={meta.showAnnotation}
          />
        </BeatSwap>
      </div>
      <div className="lr3-stage-foot">
        <button type="button" className="lr3-next" onClick={advance}>
          {last ? 'Klart' : 'Nästa →'}
        </button>
      </div>
    </div>
  )
}

/* ── P3B — "Bläddran": the full-screen stepped takeover ───────────────── */

function GenomgangTakeover({
  picked,
  open,
  onClose,
}: {
  picked: OptionKey
  open: boolean
  onClose: () => void
}) {
  const beats = useMemo(() => buildBeats({ mode: 'bladdran', picked }), [picked])
  const [index, setIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  // Back button closes the takeover, not the SPA (one marker entry).
  // Every UI close (stäng / Esc / Klart) goes through closeTakeover()
  // — history.back() — so the popstate is the single close path.
  useTakeoverHistory(open, onClose)

  // Esc closes; body scroll locks while open. The page must come back
  // at the SAME scroll position, so we capture scrollY at open and
  // re-assert it after close (the router's own popstate scroll
  // restoration can land a stale position otherwise).
  useEffect(() => {
    if (!open) return
    setIndex(0)
    const savedScroll = window.scrollY
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTakeover()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    rootRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      // Seat the page back exactly where the visitor left it. The
      // router's popstate scroll restoration can land a stale
      // sessionStorage position up to ~half a second AFTER close, so
      // enforce the position over a short window; the visitor's own
      // scrolling cancels it instantly. Instant scrolls only — reduced
      // motion identical.
      let ticks = 0
      const stop = () => {
        window.clearInterval(iv)
        window.removeEventListener('wheel', stop)
        window.removeEventListener('touchstart', stop)
        window.removeEventListener('keydown', stop)
      }
      const iv = window.setInterval(() => {
        if (window.scrollY !== savedScroll) window.scrollTo(0, savedScroll)
        if (++ticks >= 12) stop()
      }, 80)
      window.addEventListener('wheel', stop, { passive: true })
      window.addEventListener('touchstart', stop, { passive: true })
      window.addEventListener('keydown', stop)
    }
  }, [open])

  if (!open) return null

  const beat = beats[index]
  const last = index === beats.length - 1
  const meta = beatMeta(beats, index)

  return (
    <div
      className="lr3-takeover"
      role="dialog"
      aria-modal="true"
      aria-label="Genomgång"
      ref={rootRef}
      tabIndex={-1}
      data-testid="genomgang-takeover"
    >
      <div className="lr3-takeover-head">
        <span className="lr3-meter">
          Genomgång · {index + 1} av {beats.length}
        </span>
        <button type="button" className="lr3-skip" onClick={() => closeTakeover()}>
          stäng
        </button>
      </div>
      <div className="lr3-takeover-body" aria-live="polite">
        <div className="lr3-takeover-col">
          <BeatSwap index={index}>
            <BeatView
              beat={beat}
              picked={picked}
              totalOfKind={meta.totalOfKind}
              showAnnotation={meta.showAnnotation}
            />
          </BeatSwap>
        </div>
      </div>
      <div className="lr3-takeover-foot">
        <div className="lr3-takeover-foot-row">
          <button
            type="button"
            className="lr3-next"
            onClick={() => (last ? closeTakeover() : setIndex((i) => i + 1))}
          >
            {last ? 'Klart' : 'Nästa →'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── the replayable receipt — the collapsed stage ─────────────────────── */

function Receipt({ beatsCount, onReplay }: { beatsCount: number; onReplay: () => void }) {
  return (
    <div className="lr3-receipt" data-testid="genomgang-receipt">
      <span>Genomgång klar · {beatsCount} beats · </span>
      <button type="button" className="lr3-replay" onClick={onReplay}>
        spela igen
      </button>
    </div>
  )
}

/* ── the shared P3 page (P2v2 base + genomgång) ───────────────────────── */

function LandingP3({ mode }: { mode: GenomgangMode }) {
  const m = useArketMotion()
  const go = useMountGo(m.rm)
  const sticky = useStickyCta()

  const [picked, setPicked] = useState<OptionKey | null>(null)
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle')
  const [playKey, setPlayKey] = useState(0)
  const [q2Done, setQ2Done] = useState(false)
  const [tally, setTally] = useState<Record<string, boolean>>({})
  const book = (id: string, ok: boolean) => setTally((t) => (id in t ? t : { ...t, [id]: ok }))

  const beatsCount = picked ? buildBeats({ mode, picked }).length : 0
  const heroDone = picked !== null

  const grade = (k: OptionKey) => {
    setPicked(k)
    book('ord-1', k === VEDERHAFTIG.correct)
    setPhase('playing')
  }
  const replay = () => {
    setPlayKey((n) => n + 1)
    setPhase('playing')
  }

  return (
    <div className="lr2-root">
      <style>{LR2_CSS}</style>
      <style>{LR3_CSS}</style>
      <div className="hpc-m3-frame" style={{ paddingTop: 28 }}>
        <section ref={sticky.heroRef} aria-label="HP-Coach — vad sidan är">
          <Ink go={go} delay={0}>
            <header className="lr2-p2-masthead">
              <span className="lr2-brand">{COPY.brand}</span>
              <span className="lr2-folio">
                {COPY.tagline} · {COPY.domain}
              </span>
            </header>
          </Ink>
          <motion.div
            className="lr2-p2-rule"
            style={{ transformOrigin: 'left center' }}
            initial={false}
            animate={{ scaleX: go ? 1 : 0 }}
            transition={m.rm ? { duration: 0 } : m.tween(0.34)}
          />
          <motion.h1
            className="lr2-p2-thesis"
            initial={false}
            animate={{ opacity: go ? 1 : 0, letterSpacing: go ? '-0.015em' : '0.015em' }}
            transition={m.rm ? { duration: 0 } : m.tween(0.52)}
          >
            Det här är inte en broschyr. Det är appen.
          </motion.h1>
          <Ink go={go} delay={0.36}>
            <p className="lr2-body" style={{ marginTop: 14, maxWidth: '50ch' }}>
              Svara på uppgiften nedan, så rättar sidan dig som appen gör — hela vägen, fälla för
              fälla.
            </p>
            {/* station 1 — the early door: conversion never waits on playing */}
            <QuietCta />
          </Ink>
        </section>

        <RailRow label="Uppgift 1" sub="ORD · exempel">
          <p className="lr2-folio" style={{ marginBottom: 14 }}>
            {COPY.exampleTag}
          </p>
          <HeroQuestion picked={picked} onPick={grade} />

          {/* the genomgång — Scenen plays in the scroll; Bläddran takes
              the screen and leaves a receipt behind */}
          {mode === 'scenen' && picked && phase === 'playing' && (
            <GenomgangStage key={playKey} picked={picked} onDone={() => setPhase('done')} />
          )}
          {picked && phase === 'done' && <Receipt beatsCount={beatsCount} onReplay={replay} />}
        </RailRow>

        <RailRow label="Marginal" sub="varför noll">
          <div className="lr2-note">
            <div className="lr2-note-l">{COPY.claims.zero.label}</div>
            <p className="lr2-note-t">{COPY.claims.zero.text}</p>
          </div>
        </RailRow>

        <RailRow label="Uppgift 2" sub="KVA · exempel">
          <p className="lr2-folio" style={{ marginBottom: 14 }}>
            {COPY.exampleTag}
          </p>
          <DemoQuestion
            q={Q_KVA}
            onGraded={(ok) => {
              book('kva-1', ok)
              setQ2Done(true)
            }}
          />
          {q2Done && (
            <p className="lr2-folio" style={{ marginTop: 14 }}>
              I appen får varje fel den där genomgången — här visar vi den en gång, hela vägen.
            </p>
          )}
        </RailRow>

        <RailRow label="Marginal" sub="varför fel lönar sig">
          <div className="lr2-note">
            <div className="lr2-note-l">{COPY.claims.loop.label}</div>
            <p className="lr2-note-t">{COPY.claims.loop.text}</p>
          </div>
        </RailRow>

        <RailRow label="Utfall" sub="din session">
          <SessionLedger tally={tally} heroDone={heroDone} q2Done={q2Done} />
          <div className="lr2-note" style={{ marginTop: 26 }}>
            <div className="lr2-note-l">{COPY.claims.adhd.label}</div>
            <p className="lr2-note-t">{COPY.claims.adhd.text}</p>
          </div>
          <div className="lr2-note" style={{ marginTop: 24 }}>
            <div className="lr2-note-l">{COPY.claims.target.label}</div>
            <p className="lr2-note-t">{COPY.claims.target.text}</p>
          </div>
        </RailRow>

        <RailRow label="Pris" sub="villkor i klartext">
          <section ref={sticky.endRef} aria-label="Pris och konto">
            <PriceBlock />
            <Cta sub={COPY.ctaSub} />
          </section>
        </RailRow>

        <hr className="lr2-sep" style={{ marginBottom: 20 }} />
        <div className="lr2-brandline">
          <span className="lr2-folio">{COPY.brand} · byggd av en som själv skriver provet</span>
          <span className="lr2-folio">2.0</span>
        </div>
        <p className="lr2-human" style={{ marginTop: 10 }}>
          {COPY.human}
        </p>
      </div>

      {mode === 'bladdran' && picked && (
        <GenomgangTakeover
          key={playKey}
          picked={picked}
          open={phase === 'playing'}
          onClose={() => setPhase('done')}
        />
      )}

      <StickyCta visible={sticky.visible && !(mode === 'bladdran' && phase === 'playing')} />
    </div>
  )
}

/** The v2 ledger, re-keyed for this page's questions. */
function SessionLedger({
  tally,
  heroDone,
  q2Done,
}: {
  tally: Record<string, boolean>
  heroDone: boolean
  q2Done: boolean
}) {
  const m = useArketMotion()
  const order = ['ord-1', 'kva-1']
  const answered = order.filter((id) => id in tally)
  const okCount = answered.filter((id) => tally[id]).length
  const done = heroDone && q2Done

  return (
    <div>
      <div className="lr2-ledger" role="status" aria-label="Sessionens resultat">
        {order.map((id) => {
          const has = id in tally
          const ok = tally[id]
          return has ? (
            <motion.span
              key={id}
              className={ok ? 'ok' : 'bad'}
              initial={{ opacity: 0, scale: 1.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={m.veck}
              style={{ display: 'inline-block' }}
            >
              {ok ? '✓' : '✗'}
            </motion.span>
          ) : (
            <span key={id} className="slot" aria-hidden>
              ·
            </span>
          )
        })}
        {answered.length === 0 ? (
          <span style={{ color: 'var(--muted)' }}>
            svara på uppgifterna ovan — resultatet bokförs här
          </span>
        ) : (
          <span>
            {okCount} av {answered.length} rätt · varje fel taggas mot en känd fälla
          </span>
        )}
      </div>
      {done && (
        <div className="reveal">
          <QuietCta />
        </div>
      )}
    </div>
  )
}

/* ── the two chips ────────────────────────────────────────────────────── */

export function LAND_P3S() {
  return <LandingP3 mode="scenen" />
}

export function LAND_P3B() {
  return <LandingP3 mode="bladdran" />
}

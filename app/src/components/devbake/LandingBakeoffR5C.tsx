// LandingBakeoffR5C — landing v5 SYNTHESIS bake-off, variant C
// "RÄTTELSEN" (the wildcard: a fourth signature, not a recombination).
//
// THESIS: the page is a BOOK THAT CORRECTS ITSELF while you read. It
// opens on the artifact every HP student actually receives after the
// exam — the bare facit, a mute answer key — and strikes it through:
// facit says WHICH you got wrong, never WHY. Then three book pages
// (s. 1 → s. 3) each play the full genomgång, and every wrong answer
// is typeset into a tipped-in RÄTTELSER slip in canonical errata
// grammar: står »X« · skall stå »Y« · orsak: <fälla> — the print
// world's own form for mistakes made consequential. The slip is the
// page's spine (receipt ledger + repetition promise in one object).
//
// AESTHETIC RISK, owned: the errata slip sits physically askew
// (rotate −0.7°) on an otherwise ruler-straight page. A tipped-in
// rättelselapp is a LOOSE slip of different paper — the one object in
// the Boksidan world that is allowed to be crooked. Everything else
// stays quiet: standard book column, hairlines, house type.
//
// NOT a recombination of the v4 parents: no poster-scale hero question
// (V4A), no press/letterpress choreography (V4B), no countdown or
// dated-timeline spine (V4C). Quietly inherited lessons: the first
// question sits directly under the fold (A), stakes are visible from
// frame one (C — here as the struck facit, not a date), and mistakes
// are made consequential (C — here as errata rows, not schedule rows).
//
// MECHANICS (owner-decided, from v3/v4): EVERY demo question plays the
// full Scenen-style genomgång beat loop in a fixed-height stage
// (skippable) and collapses to a one-line replayable receipt. Content
// = the R4A set (imported, not modified): vederhäftig VERBATIM (R3
// consult content) + R4A's KVA (25 % av 84 — the symmetry law) and
// MEK (saklig–fortsatt), chosen because word-pair answers make the
// strongest errata rows and the KVA teaches a reusable law in one
// line. The R4A generic beat engine (buildGenBeats) is reused as-is.
//
// CTA system (four stations) intact: early door in the hero, earned
// moments (hero kvitto + the completed slip), sticky bar, price block.
// LEGAL: all demo content ORIGINAL, written for HP-Coach — labeled on
// the page; the hero facit strip is an invented answer-key PATTERN
// (generic numbers/letters), nothing from the © UHR corpus.
//
// Motion: lib/motion tokens only; the load beat (facit rows tick in,
// the corrector's stroke crosses them, the thesis settles) is gated on
// the boot veil having actually lifted (V4B's usePressGo trap — see
// useVeilGo below). Reduced motion collapses everything to the final
// state on first paint. DESIGN artifact — wired into
// /dev/landing-bakeoff by the orchestrator. Kept forever.

import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { dispatchFirstContent, EASE, KeepInView, useArketMotion } from '@/lib/motion'

import {
  COPY,
  Cta,
  LR2_CSS,
  PriceBlock,
  QuietCta,
  StickyCta,
  useStickyCta,
} from './LandingBakeoffR2'
import {
  buildGenBeats,
  type GenBeat,
  type GenContent,
  Q1_HERO,
  Q2_KVA,
  Q3_MEK,
} from './LandingBakeoffR4A.content'

/* ── landing-local styles (layout only; color/type from live tokens) ──── */

const LR5C_CSS = `
/* ── the hero: the struck facit ── */
.lr5c-facit-l {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 30px 0 0;
}
.lr5c-facit {
  position: relative;
  display: inline-block;
  margin-top: 12px;
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.9;
  letter-spacing: 0.12em;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}
.lr5c-facit-row { display: block; white-space: nowrap; }
/* the corrector's stroke — one diagonal red line through the whole
   facit (a stroke, not a rule — the only non-orthogonal line the hero
   allows). Static rotate on the wrapper; motion animates scaleX inside. */
.lr5c-strike-wrap {
  position: absolute;
  left: -5px;
  right: -5px;
  top: 50%;
  margin-top: -1px;
  transform: rotate(-4deg);
  pointer-events: none;
}
.lr5c-strike {
  height: 2px;
  background: var(--bad);
  transform-origin: left center;
}
.lr5c-facit-cap {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--muted);
  margin: 10px 0 0;
  max-width: 44ch;
}
.lr5c-thesis {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 500;
  font-size: clamp(34px, 9vw, 54px);
  line-height: 1.08;
  letter-spacing: -0.015em;
  color: var(--ink);
  margin: 26px 0 0;
  max-width: 14ch;
}

/* ── a book page — the folio rule carries the pagination ── */
.lr5c-page { margin-top: 64px; }
.lr5c-page-folio {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--ink);
  padding-bottom: 7px;
  margin-bottom: 16px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.lr5c-page-folio em { font-style: normal; color: var(--muted); }

/* ── the genomgång stage (Scenen grammar, this page's chrome) ── */
.lr5c-stage {
  border: 1px solid var(--hairline);
  border-radius: 6px;
  background: var(--bg);
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  height: 590px; /* FIXED — the card never grows; content swaps inside */
  overflow: hidden;
}
.lr5c-stage-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--hairline);
}
.lr5c-meter {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.lr5c-skip {
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
.lr5c-skip:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.lr5c-stage-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 16px 8px;
}
.lr5c-stage-foot {
  padding: 12px 16px 14px;
  border-top: 1px solid var(--hairline);
  display: flex;
  justify-content: flex-end;
}
.lr5c-next {
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
.lr5c-next:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.lr5c-beat-label {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 12px;
}
.lr5c-annot {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.6;
  letter-spacing: 0.04em;
  color: var(--accent);
  margin: 16px 0 0;
  max-width: 46ch;
}
.lr5c-annot a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.lr5c-din-tag {
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
.lr5c-din-wash {
  background: var(--bad-soft);
  border-radius: 6px;
  padding: 12px 14px;
  margin: 0 -14px;
}
.lr5c-compressed .hpc-m3-dis-p { font-size: 12.5px; line-height: 1.55; }
.lr5c-compressed .hpc-m3-dis-h { font-size: 14px; }
.lr5c-kvitto-line {
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  margin: 14px 0 0;
  font-variant-numeric: tabular-nums;
}

/* ── the receipt — the collapsed stage; points into Rättelser ── */
.lr5c-receipt {
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
  font-variant-numeric: tabular-nums;
}
.lr5c-receipt .ok { color: var(--ok); }
.lr5c-receipt .bad { color: var(--bad); }
.lr5c-receipt-sida { color: var(--muted); }
.lr5c-replay {
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
.lr5c-replay:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.lr5c-booked {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.05em;
  color: var(--accent);
  margin: 10px 0 0;
}

/* ── RÄTTELSER — the tipped-in errata slip; the page's one bold object ── */
.lr5c-slip {
  transform: rotate(-0.7deg);
  border: 1px solid var(--ink);
  background: var(--bg);
  padding: 20px 18px 16px;
  margin-top: 10px;
}
.lr5c-slip-h {
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--ink);
  text-indent: 0.34em; /* optically recenters the letterspaced word */
}
.lr5c-slip-h::before, .lr5c-slip-h::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--ink);
}
.lr5c-slip-sub {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.08em;
  color: var(--muted);
  text-align: center;
  margin: 8px 0 0;
}
.lr5c-err {
  border-bottom: 1px solid var(--hairline-2);
  padding: 13px 0;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.75;
  letter-spacing: 0.04em;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}
.lr5c-err:first-of-type { border-top: 1px solid var(--hairline); margin-top: 16px; }
.lr5c-err .sida { color: var(--muted); }
.lr5c-err .star { color: var(--bad); text-decoration: line-through; }
.lr5c-err .skall { color: var(--ok); }
.lr5c-err .orsak { color: var(--accent); }
.lr5c-err.utan { color: var(--muted); }
.lr5c-err-empty {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--muted);
  margin: 16px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--hairline);
}
.lr5c-slip-foot {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.7;
  letter-spacing: 0.05em;
  color: var(--muted);
  margin: 14px 0 0;
}
.lr5c-slip-cap {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.6;
  letter-spacing: 0.05em;
  color: var(--muted);
  margin: 12px 0 0;
  max-width: 52ch;
}
.lr5c-slip-sum {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  margin: 16px 0 0;
  font-variant-numeric: tabular-nums;
}

@media (min-width: 900px) {
  .lr5c-stage { height: 540px; }
  .lr5c-page { margin-top: 84px; }
}
`

/* ── the hero facit — an invented answer-key PATTERN (not from any exam) ── */

const FACIT_ROWS = ['21 C   22 A   23 E   24 B', '25 D   26 B   27 A   28 C']

/* ── errata bookkeeping ───────────────────────────────────────────────── */

/** Book pagination per question — the structure the errata rows cite. */
const SIDOR: Record<string, { sida: string; name: string }> = {
  [Q1_HERO.id]: { sida: 's. 1', name: 'vederhäftig' },
  [Q2_KVA.id]: { sida: 's. 2', name: 'procentparet' },
  [Q3_MEK.id]: { sida: 's. 3', name: 'luckparet' },
}

interface Erratum {
  id: string
  sida: string
  name: string
  ok: boolean
  /** What it said (the picked option) — null on a correct answer. */
  star: string | null
  /** What it should say (the correct option). */
  skall: string
  /** The named trap — null on a correct answer. */
  orsak: string | null
}

function makeErratum(q: GenContent, picked: string): Erratum {
  const ok = picked === q.correct
  const meta = SIDOR[q.id]
  return {
    id: q.id,
    sida: meta.sida,
    name: meta.name,
    ok,
    star: ok ? null : (q.options.find((o) => o.key === picked)?.text ?? ''),
    skall: q.options.find((o) => o.key === q.correct)?.text ?? '',
    orsak: ok ? null : (q.trapTags[picked] ?? 'fälla'),
  }
}

/* ── the veil gate — the load beat must play in FRONT of the audience ──
 *    V4B's usePressGo trap, restated: this page mounts BEHIND the boot
 *    veil (#boot-veil holds until `hpc:first-content` + 2 rAFs), so a
 *    mount-armed sequence has already finished when the curtain lifts.
 *    Fire the first-content signal ourselves, then wait until the veil
 *    ELEMENT is gone before flipping `go`. Reduced motion: `go` starts
 *    true — final state on the first paint. ──────────────────────────── */

function useVeilGo(rm: boolean): boolean {
  const [go, setGo] = useState(rm)
  useEffect(() => {
    // Fire the signal FIRST — under reduced motion there is no beat, but
    // the veil still waits on first-content; returning before dispatching
    // would hold the curtain down forever.
    dispatchFirstContent()
    if (rm) return
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

/** State-driven opacity beat (Arket-lawful: zero travel). */
function Blek({ go, delay = 0, children }: { go: boolean; delay?: number; children: ReactNode }) {
  const m = useArketMotion()
  return (
    <motion.div
      initial={false}
      animate={{ opacity: go ? 1 : 0 }}
      transition={m.rm ? { duration: 0 } : { duration: 0.28, ease: [...EASE.reading], delay }}
    >
      {children}
    </motion.div>
  )
}

/* ── margin annotation — the landing's curator-pencil voice ───────────── */

function Annot({ children }: { children: ReactNode }) {
  return <p className="lr5c-annot">»{children}«</p>
}

/* ── one beat, rendered (R4A's generic grammar, this page's chrome) ───── */

function BeatView({
  q,
  beat,
  beats,
  picked,
}: {
  q: GenContent
  beat: GenBeat
  beats: GenBeat[]
  picked: string
}) {
  const correct = picked === q.correct
  const pickedText = q.options.find((o) => o.key === picked)?.text ?? ''
  const firstOfKind = beats.findIndex((b) => b.kind === beat.kind) === beats.indexOf(beat)
  const showAnnotation = q.annotations !== undefined && firstOfKind

  if (beat.kind === 'utfall') {
    return (
      <div>
        <p className="lr5c-beat-label">Utfall</p>
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
        {showAnnotation && q.annotations && <Annot>{q.annotations.utfall}</Annot>}
      </div>
    )
  }

  if (beat.kind === 'steg') {
    const step = q.steps[beat.i]
    return (
      <div>
        <p className="lr5c-beat-label">
          Så löser du den · steg {beat.i + 1} av {q.steps.length}
        </p>
        <div className="hpc-m3-step" style={{ animation: 'none', borderBottom: 0 }}>
          <span className="hpc-m3-step-n" aria-hidden>
            {beat.i + 1}.
          </span>
          <div>
            <h3 className="hpc-m3-step-h">
              {step.title}
              <span className="hpc-m3-step-tier">{step.tier}</span>
            </h3>
            <p className="hpc-m3-step-t">{step.body}</p>
          </div>
        </div>
        {showAnnotation && q.annotations && <Annot>{q.annotations.steg}</Annot>}
      </div>
    )
  }

  if (beat.kind === 'falla') {
    const d = q.distractors[beat.letter]
    const optText = q.options.find((o) => o.key === beat.letter)?.text ?? ''
    const fallor = beats.filter((b) => b.kind === 'falla')
    const fallaIndex = fallor.indexOf(beat) + 1
    const label = beat.din
      ? 'Din fälla'
      : `Varför de andra lockar · fälla ${fallaIndex} av ${fallor.length}`
    return (
      <div className={beat.compressed ? 'lr5c-compressed' : undefined}>
        <p className="lr5c-beat-label">{label}</p>
        <div
          className="hpc-m3-dis"
          style={{ animation: 'none', borderBottom: 0 }}
          data-din-gissning={beat.din || undefined}
        >
          <div className={beat.din ? 'lr5c-din-wash' : undefined}>
            <p className="hpc-m3-dis-h">
              <span className="hpc-m3-dis-k">{beat.letter})</span>
              <s>{optText}</s>
              {beat.din && <span className="lr5c-din-tag">din gissning</span>}
            </p>
            <p className="hpc-m3-dis-l">Varför det lockar</p>
            <p className="hpc-m3-dis-p">{d.whyTempting}</p>
            <p className="hpc-m3-dis-l">Varför det är fel</p>
            <p className="hpc-m3-dis-p">{d.whyWrong}</p>
          </div>
        </div>
        {showAnnotation && q.annotations && (
          <Annot>
            {correct ? q.annotations.fallorRatt : q.annotations.fallor}{' '}
            <a href="/sign-up">Skapa konto</a>
          </Annot>
        )}
      </div>
    )
  }

  // kvitto — on this page it points into RÄTTELSER.
  return (
    <div>
      <p className="lr5c-beat-label">Kvitto</p>
      <div className="lr2-note">
        <div className="lr2-note-l">{COPY.revealLabel}</div>
        <p className="lr2-note-t">{q.kvittoNote}</p>
      </div>
      <p className="lr5c-kvitto-line">
        {beat.correct
          ? 'inga rättelser från den här sidan — fällorna kartlagda ändå'
          : `rättelse satt: står »${pickedText}« · orsak: ${q.trapTags[picked]}`}
      </p>
      {q.id === Q1_HERO.id && <QuietCta />}
    </div>
  )
}

/** Ink-swap between beats: outgoing lifts, incoming dries in. */
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

/* ── the fixed-height genomgång stage (Scenen, generic) ───────────────── */

function GenStage({ q, picked, onDone }: { q: GenContent; picked: string; onDone: () => void }) {
  const beats = useMemo(() => buildGenBeats(q, picked), [q, picked])
  const [index, setIndex] = useState(0)
  const beat = beats[index]
  const last = index === beats.length - 1
  const bodyRef = useRef<HTMLDivElement>(null)

  const advance = () => {
    if (last) onDone()
    else {
      setIndex((i) => i + 1)
      bodyRef.current?.scrollTo({ top: 0 })
    }
  }

  return (
    <div className="lr5c-stage" data-testid={`genomgang-stage-${q.id}`}>
      <div className="lr5c-stage-head">
        <span className="lr5c-meter">
          Genomgång · {index + 1} av {beats.length}
        </span>
        <button type="button" className="lr5c-skip" onClick={onDone}>
          hoppa över
        </button>
      </div>
      <div className="lr5c-stage-body" ref={bodyRef} aria-live="polite">
        <BeatSwap index={index}>
          <BeatView q={q} beat={beat} beats={beats} picked={picked} />
        </BeatSwap>
      </div>
      <div className="lr5c-stage-foot">
        <button type="button" className="lr5c-next" onClick={advance}>
          {last ? 'Klart' : 'Nästa →'}
        </button>
      </div>
    </div>
  )
}

/* ── a book page: folio rule → question → stage → receipt ─────────────── */

function BookPage({ q, onGraded }: { q: GenContent; onGraded: (e: Erratum) => void }) {
  const m = useArketMotion()
  const meta = SIDOR[q.id]
  const [picked, setPicked] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle')
  const [playKey, setPlayKey] = useState(0)
  const graded = picked !== null
  const wrong = graded && picked !== q.correct

  const grade = (k: string) => {
    if (graded) return
    setPicked(k)
    setPhase('playing')
    onGraded(makeErratum(q, k))
  }
  const replay = () => {
    setPlayKey((n) => n + 1)
    setPhase('playing')
  }

  return (
    <section className="lr5c-page" aria-label={`${meta.sida} · ${q.section}`}>
      <div className="lr5c-page-folio">
        <span>
          {meta.sida} · {q.section}
        </span>
        <em>exempel</em>
      </div>
      <p className="lr2-folio" style={{ marginBottom: 14 }}>
        {COPY.exampleTag}
      </p>
      {q.headword ? (
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
      )}
      <div className="hpc-m3-opts" style={{ marginTop: 18 }}>
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
              onClick={() => grade(opt.key)}
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

      {picked && phase === 'playing' && (
        <KeepInView rm={m.rm} delayMs={200}>
          <GenStage key={playKey} q={q} picked={picked} onDone={() => setPhase('done')} />
        </KeepInView>
      )}
      {picked && phase === 'done' && (
        <div className="lr5c-receipt" data-testid={`genomgang-receipt-${q.id}`}>
          <span className="lr5c-receipt-sida">{meta.sida}</span>
          <span>
            {meta.name} · <span className={wrong ? 'bad' : 'ok'}>{wrong ? 'fel' : 'rätt'}</span>
            {wrong && ` — ${q.trapTags[picked]}`}
          </span>
          <button type="button" className="lr5c-replay" onClick={replay}>
            spela upp igen
          </button>
        </div>
      )}
      {picked && phase === 'done' && wrong && (
        <p className="lr5c-booked">→ satt som rad i Rättelser — se lappen längre ner</p>
      )}
    </section>
  )
}

/* ── RÄTTELSER — the tipped-in errata slip ─────────────────────────────── */

function ErrataSlip({ errata }: { errata: Erratum[] }) {
  const m = useArketMotion()
  const felCount = errata.filter((e) => !e.ok).length
  const done = errata.length === 3

  return (
    <div>
      <div
        className="lr5c-slip"
        role="status"
        aria-label="Rättelser — dina bokförda fel"
        data-testid="errata-slip"
      >
        <p className="lr5c-slip-h">Rättelser</p>
        <p className="lr5c-slip-sub">till den här läsningen · sätts medan du svarar</p>
        {errata.length === 0 && (
          <p className="lr5c-err-empty">inga rättelser ännu — svara på uppgifterna ovan</p>
        )}
        {errata.map((e) => (
          <motion.div
            key={e.id}
            className={`lr5c-err${e.ok ? ' utan' : ''}`}
            initial={m.rm ? false : { opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={m.veck}
            style={{ transformOrigin: 'left top' }}
          >
            {e.ok ? (
              <>
                <span className="sida">{e.sida}</span>, {e.name} — utan anmärkning
              </>
            ) : (
              <>
                <span className="sida">{e.sida}</span>, {e.name} — står: »
                <span className="star">{e.star}</span>« · skall stå: »
                <span className="skall">{e.skall}</span>« · orsak:{' '}
                <span className="orsak">{e.orsak}</span>
              </>
            )}
          </motion.div>
        ))}
        <p className="lr5c-slip-foot">
          varje rad repeteras: i morgon · om tre dagar · veckan före provet — tills den sitter
        </p>
      </div>
      <p className="lr5c-slip-cap">
        en rättelselapp läggs i böcker där fel upptäckts efter tryckning — den här boken sätter sin
        egen, medan du läser
      </p>
      {errata.length > 0 && (
        <p className="lr5c-slip-sum">
          {felCount === 0
            ? `${errata.length} av ${errata.length} rätt · fällorna kartlagda ändå`
            : `${felCount} ${felCount === 1 ? 'fel' : 'fel'} → ${felCount} ${
                felCount === 1 ? 'rad' : 'rader'
              } · varje rad har en orsak och ett datum`}
        </p>
      )}
      {done && (
        <div className="reveal">
          {/* station 2 — earned: the completed slip opens its own door */}
          <QuietCta />
        </div>
      )}
    </div>
  )
}

/* ── the page ─────────────────────────────────────────────────────────── */

export function LandV5C() {
  const m = useArketMotion()
  const go = useVeilGo(m.rm)
  const sticky = useStickyCta()

  const [errata, setErrata] = useState<Erratum[]>([])
  const book = (e: Erratum) => setErrata((es) => (es.some((x) => x.id === e.id) ? es : [...es, e]))

  return (
    <div className="lr2-root">
      <style>{LR2_CSS}</style>
      <style>{LR5C_CSS}</style>
      <div className="lr2-col">
        {/* ── the hero: masthead → the facit → the corrector's stroke ── */}
        <section ref={sticky.heroRef} aria-label="HP-Coach — facit räcker inte">
          <Blek go={go} delay={0}>
            <header className="lr2-p2-masthead">
              <span className="lr2-brand">{COPY.brand}</span>
              <span className="lr2-folio">
                {COPY.tagline} · {COPY.domain}
              </span>
            </header>
          </Blek>
          <motion.div
            className="lr2-p2-rule"
            style={{ transformOrigin: 'left center' }}
            initial={false}
            animate={{ scaleX: go ? 1 : 0 }}
            transition={m.tween(0.34)}
          />

          <Blek go={go} delay={0.22}>
            <p className="lr5c-facit-l">Det enda som provet skickar tillbaka:</p>
          </Blek>
          <div className="lr5c-facit">
            {FACIT_ROWS.map((row, i) => (
              <motion.span
                key={row}
                className="lr5c-facit-row"
                initial={false}
                animate={{ opacity: go ? 1 : 0 }}
                transition={
                  m.rm
                    ? { duration: 0 }
                    : { duration: 0.26, ease: [...EASE.reading], delay: 0.34 + i * 0.14 }
                }
              >
                {row}
              </motion.span>
            ))}
            {/* the corrector's stroke — the page's verdict on the facit */}
            <div className="lr5c-strike-wrap" aria-hidden>
              <motion.div
                className="lr5c-strike"
                initial={false}
                animate={{ scaleX: go ? 1 : 0 }}
                transition={
                  m.rm ? { duration: 0 } : { duration: 0.4, ease: [...EASE.reading], delay: 0.8 }
                }
              />
            </div>
          </div>
          <Blek go={go} delay={0.95}>
            <p className="lr5c-facit-cap">
              facit — vilka du hade fel på, aldrig varför. Exempel, inte ur något prov.
            </p>
          </Blek>
          <motion.h1
            className="lr5c-thesis"
            initial={false}
            animate={{ opacity: go ? 1 : 0, letterSpacing: go ? '-0.015em' : '0.015em' }}
            transition={
              m.rm ? { duration: 0 } : { duration: 0.52, ease: [...EASE.reading], delay: 1.1 }
            }
          >
            Boken som rättar sig själv.
          </motion.h1>
          <Blek go={go} delay={1.3}>
            <p className="lr2-body" style={{ marginTop: 16, maxWidth: '50ch' }}>
              Svara på tre uppgifter. Varje svar får hela genomgången — och varje fel blir en rad i
              sidans rättelselapp: vad det stod, vad det skulle stå, varför du valde det och när det
              rättas.
            </p>
            {/* station 1 — the early door: reachable without answering */}
            <QuietCta />
          </Blek>
        </section>

        {/* ── s. 1 — the first page sits directly under the fold ── */}
        <BookPage q={Q1_HERO} onGraded={book} />

        <div className="lr2-note" style={{ marginTop: 40 }}>
          <div className="lr2-note-l">{COPY.claims.zero.label}</div>
          <p className="lr2-note-t">{COPY.claims.zero.text}</p>
        </div>

        <BookPage q={Q2_KVA} onGraded={book} />

        <div className="lr2-note" style={{ marginTop: 40 }}>
          <div className="lr2-note-l">{COPY.claims.adhd.label}</div>
          <p className="lr2-note-t">{COPY.claims.adhd.text}</p>
        </div>

        <BookPage q={Q3_MEK} onGraded={book} />

        <div className="lr2-note" style={{ marginTop: 40 }}>
          <div className="lr2-note-l">{COPY.claims.loop.label}</div>
          <p className="lr2-note-t">{COPY.claims.loop.text}</p>
        </div>

        {/* ── RÄTTELSER — the tipped-in slip. Deliberately NOT a numbered
             page of the book: an errata slip is a loose insert, so it
             carries its own header and no folio rule. ── */}
        <section className="lr5c-page" aria-label="Rättelser">
          <ErrataSlip errata={errata} />
          <div className="lr2-note" style={{ marginTop: 34 }}>
            <div className="lr2-note-l">{COPY.claims.target.label}</div>
            <p className="lr2-note-t">{COPY.claims.target.text}</p>
          </div>
        </section>

        {/* ── pris ── */}
        <section className="lr5c-page" aria-label="Pris och konto">
          <div className="lr5c-page-folio">
            <span>Pris</span>
            <em>villkor i klartext</em>
          </div>
          <section ref={sticky.endRef} aria-label="Pris och konto">
            <PriceBlock />
            <Cta sub={COPY.ctaSub} />
          </section>
        </section>

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

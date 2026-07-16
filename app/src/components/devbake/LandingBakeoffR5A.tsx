// LandingBakeoffR5A — landing v5 SYNTHESIS bake-off, candidate A:
// "FRÅGAN UNDER DATUMET" — dramaturgy + stakes.
//
// THESIS (H1): compose V4A's opening with V4C's architecture. The first
// frame is the vederhäftig question set like a book's TITLE PAGE (A's
// poster-scale treatment, the long typographic settle, no pitch above
// the fold) — but the title page carries a DATELINE at its head:
// "HÖGSKOLEPROVET · SÖNDAG 18 OKTOBER · om N dagar". The ambush has
// stakes from frame one: this is not a quiz for fun, it is the exam's
// own clock. Below the fold the page runs C's dated timeline — a spine
// with stations IKVÄLL → I MORGON → OM TRE DAGAR → DITT SCHEMA →
// VECKAN FÖRE PROVET → PROVDAGEN — and every graded answer is BOOKED
// into the schema, which ends on exam morning, where the price lives.
//
// THE SEAM (the judgment call): the title page IS station zero. The
// hero's graded answer books the first SchedEntry, and the first thing
// under the fold is the spine claiming what just happened — station
// "IKVÄLL · där du är nu" opens with the thesis and points at the
// receipt the visitor just earned. The timeline does not start a new
// page; it retroactively reveals the title page as its first stop. The
// hero's foot line ("Resten av sidan är dagarna fram till provet.")
// hands the eye down onto the spine.
//
// AESTHETIC RISK, owned: the dateline splices two registers in one
// line — set mono caps for the fixed facts (event, date) and display
// italic at half-poster scale for the one LIVING number ("om 94
// dagar"). A printed dateline never ticks; this one does, and the
// typography marks exactly which part of the line is alive. Everything
// else on the title page stays quiet so this single splice reads.
//
// MECHANICS (owner-ratified): every demo question plays the full
// genomgång as a fixed-height Scenen-style beat stage (skippable) and
// collapses to a numbered, replayable receipt. Beat engine + all three
// questions come from LandingBakeoffR4A.content (hero = vederhäftig
// VERBATIM from R3; KVA + MEK are R4A's originals — chosen as the
// strongest set: the KVA teaches the x%-av-y symmetry, a
// win-without-computing insight). Timeline vocabulary (prov date, live
// countdown, schedule cadence, SchedEntry) from LandingBakeoffR4C
// .content. Both parents imported, never modified.
//
// CTA system (four stations) intact: early door in the IKVÄLL station
// directly under the fold, earned doors (hero kvitto + completed
// schema), sticky bar, price block on provdagen. LEGAL: all demo
// content ORIGINAL, written for HP-Coach — labeled on the page;
// nothing from the © UHR corpus.
//
// Motion: lib/motion tokens only; zero entrance travel. The load
// choreography gates on the BOOT VEIL having lifted (local hook
// modeled on V4B's usePressGo — useMountGo alone finishes behind the
// veil). Reduced motion collapses everything to its final state.
//
// DESIGN artifact — wired into /dev/landing-bakeoff by the
// orchestrator. Kept forever per house rule.

import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { dispatchFirstContent, EASE, KeepInView, useArketMotion } from '@/lib/motion'

import {
  COPY,
  Cta,
  Ink,
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
import {
  daysUntilProv,
  PROV_DATE_SHORT,
  SCHED_CADENCE,
  type SchedEntry,
} from './LandingBakeoffR4C.content'

/* ── what each question is called once it is booked in the schema ─────── */

const SCHED_LABELS: Record<string, string> = {
  [Q1_HERO.id]: 'vederhäftig',
  [Q2_KVA.id]: 'procentparet',
  [Q3_MEK.id]: 'luckparet',
}

/* ── landing-local styles (layout only; color/type from live tokens) ──── */

const LR5A_CSS = `
/* ── Akt I — the title page under its dateline ── */
.lr5a-hero {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 16px 20px 22px;
  box-sizing: border-box;
}
.lr5a-hero-brand {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
/* the dateline — the page's clock, at the head where a print date lives */
.lr5a-dateline {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--accent);
  text-align: center;
  margin: 26px 0 0;
}
/* the one LIVING element: the count, spliced in display italic on its
   own line — a set dateline over a ticking counter */
.lr5a-dateline .count {
  display: block;
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 500;
  font-size: 22px;
  line-height: 1.2;
  letter-spacing: -0.01em;
  text-transform: none;
  color: var(--ink);
  margin-top: 3px;
  white-space: nowrap;
}
.lr5a-hero-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: 30px 0 26px;
}
.lr5a-kicker {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  text-align: center;
  margin: 0;
  white-space: nowrap;
}
@media (max-width: 359px) {
  .lr5a-kicker { white-space: normal; }
}
.lr5a-headword {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  font-size: clamp(56px, 16.5vw, 132px);
  line-height: 1;
  color: var(--ink);
  text-align: center;
  margin: 10px 0 0;
}
.lr5a-hero-rule {
  width: 72px;
  height: 1px;
  background: var(--ink);
  margin: 26px auto 0;
  transform-origin: center;
}
.lr5a-hero-opts { margin-top: 22px; }
.lr5a-hero-foot {
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
  text-align: center;
}
.lr5a-framing {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 17px;
  line-height: 1.5;
  color: var(--ink-2);
  margin: 0;
}
.lr5a-legal {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.07em;
  color: var(--muted);
  margin: 8px 0 0;
}

/* ── Akt II — the time spine (C's architecture) ── */
.lr5a-col {
  max-width: 680px;
  margin: 0 auto;
  padding: 0 20px 96px;
}
.lr5a-line {
  position: relative;
  padding-left: 26px;
  margin-top: 10px;
}
.lr5a-spine {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--ink);
}
.lr5a-stn { position: relative; margin-top: 62px; }
.lr5a-stn:first-child { margin-top: 26px; }
.lr5a-stn-tag {
  position: relative;
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink);
  margin: 0 0 16px;
}
.lr5a-stn-tag::before {
  content: '';
  position: absolute;
  left: -26px;
  top: 50%;
  width: 14px;
  height: 1px;
  background: var(--ink);
}
.lr5a-stn-tag em { font-style: normal; color: var(--muted); }
.lr5a-thesis {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 500;
  font-size: clamp(26px, 6.6vw, 38px);
  line-height: 1.16;
  letter-spacing: -0.015em;
  color: var(--ink);
  margin: 0;
  max-width: 19ch;
}

/* ── the genomgång stage — A's printer's plate chrome ── */
.lr5a-stage {
  border: 1px solid var(--hairline);
  border-top: 2px solid var(--ink);
  background: var(--bg);
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  height: 590px; /* FIXED — the card never grows; content swaps inside */
  overflow: hidden;
  text-align: left;
}
.lr5a-stage-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--hairline);
}
.lr5a-meter {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.lr5a-skip {
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
.lr5a-skip:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.lr5a-stage-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 16px 8px;
}
.lr5a-stage-foot {
  padding: 12px 16px 14px;
  border-top: 1px solid var(--hairline);
  display: flex;
  justify-content: flex-end;
}
.lr5a-next {
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
.lr5a-next:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.lr5a-beat-label {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 12px;
}
.lr5a-annot {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.6;
  letter-spacing: 0.04em;
  color: var(--accent);
  margin: 16px 0 0;
  max-width: 46ch;
}
.lr5a-annot a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.lr5a-din-tag {
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
.lr5a-din-wash {
  background: var(--bad-soft);
  border-radius: 6px;
  padding: 12px 14px;
  margin: 0 -14px;
}
.lr5a-compressed .hpc-m3-dis-p { font-size: 12.5px; line-height: 1.55; }
.lr5a-compressed .hpc-m3-dis-h { font-size: 14px; }
.lr5a-kvitto-line {
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  margin: 14px 0 0;
  font-variant-numeric: tabular-nums;
}

/* ── the receipt — the collapsed stage; numbered, replayable ── */
.lr5a-receipt {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 22px;
  padding: 12px 14px;
  border: 1px solid var(--hairline);
  border-left: 2px solid var(--ink);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  text-align: left;
  font-variant-numeric: tabular-nums;
}
.lr5a-receipt-n { color: var(--muted); }
.lr5a-receipt .ok { color: var(--ok); }
.lr5a-receipt .bad { color: var(--bad); }
.lr5a-replay {
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
.lr5a-replay:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.lr5a-booked {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.05em;
  color: var(--accent);
  margin: 10px 0 0;
  text-align: left;
}

/* ── the schedule ledger — where booked mistakes land ── */
.lr5a-sched { border-top: 1px solid var(--hairline); }
.lr5a-sched-row {
  display: grid;
  grid-template-columns: 20px 1fr;
  gap: 10px;
  align-items: baseline;
  padding: 13px 0;
  border-bottom: 1px solid var(--hairline-2);
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.6;
  letter-spacing: 0.04em;
  color: var(--ink-2);
}
.lr5a-sched-row .mark { font-size: 15px; line-height: 1; }
.lr5a-sched-row .mark.ok { color: var(--ok); }
.lr5a-sched-row .mark.bad { color: var(--bad); }
.lr5a-sched-row em { font-style: normal; color: var(--accent); }
.lr5a-sched-row.is-dest { color: var(--muted); border-bottom: 0; }
.lr5a-sched-empty {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--muted);
  margin: 0;
  padding: 13px 0;
}
.lr5a-sched-sum {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  margin: 14px 0 0;
  font-variant-numeric: tabular-nums;
}
.lr5a-scene {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 19px;
  line-height: 1.55;
  color: var(--ink);
  margin: 0 0 26px;
  max-width: 44ch;
}

@media (min-width: 900px) {
  .lr5a-hero { padding: 22px 24px 30px; }
  .lr5a-stage { height: 540px; }
  .lr5a-col { max-width: 720px; padding: 0 24px 120px; }
  .lr5a-line { padding-left: 34px; }
  .lr5a-stn-tag::before { left: -34px; width: 20px; }
  .lr5a-dateline .count { font-size: 24px; }
}
`

/* ── the veil gate — the title page must settle in FRONT of the visitor.
 *    useMountGo arms on mount, but this page mounts BEHIND the boot
 *    veil, so a mount-armed sequence finishes before the curtain lifts.
 *    Modeled on V4B's usePressGo: fire first-content ourselves, then
 *    wait until the veil element is gone before flipping `go`. Reduced
 *    motion: `go` starts true — final state on first paint. ─────────── */

function useVeilGo(rm: boolean): boolean {
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

/* ── shared option list ───────────────────────────────────────────────── */

function OptionList({
  q,
  picked,
  onPick,
}: {
  q: GenContent
  picked: string | null
  onPick: (k: string) => void
}) {
  const graded = picked !== null
  return (
    <div className="hpc-m3-opts">
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
    </div>
  )
}

/* ── margin annotation — the landing's curator-pencil voice ───────────── */

function Annot({ children }: { children: ReactNode }) {
  return <p className="lr5a-annot">»{children}«</p>
}

/* ── one beat, rendered (A's grammar; the kvitto points down the spine) ── */

function GenBeatView({
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
        <p className="lr5a-beat-label">Utfall</p>
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
        <p className="lr5a-beat-label">
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
      <div className={beat.compressed ? 'lr5a-compressed' : undefined}>
        <p className="lr5a-beat-label">{label}</p>
        <div
          className="hpc-m3-dis"
          style={{ animation: 'none', borderBottom: 0 }}
          data-din-gissning={beat.din || undefined}
        >
          <div className={beat.din ? 'lr5a-din-wash' : undefined}>
            <p className="hpc-m3-dis-h">
              <span className="hpc-m3-dis-k">{beat.letter})</span>
              <s>{optText}</s>
              {beat.din && <span className="lr5a-din-tag">din gissning</span>}
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

  // kvitto — the earned station; on this page it points down the timeline.
  return (
    <div>
      <p className="lr5a-beat-label">Kvitto</p>
      <div className="lr2-note">
        <div className="lr2-note-l">{COPY.revealLabel}</div>
        <p className="lr2-note-t">{q.kvittoNote}</p>
      </div>
      <p className="lr5a-kvitto-line">
        {beat.correct
          ? 'inga fel att tagga — fällorna kartlagda ändå'
          : `felet taggat: ${q.trapTags[picked]} → inbokat ${SCHED_CADENCE}`}
      </p>
      <QuietCta />
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

/* ── the stage — fixed-height, one beat per tap, skippable ────────────── */

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
    <div className="lr5a-stage" data-testid={`genomgang-stage-${q.id}`}>
      <div className="lr5a-stage-head">
        <span className="lr5a-meter">
          Genomgång · {index + 1} av {beats.length}
        </span>
        <button type="button" className="lr5a-skip" onClick={onDone}>
          hoppa över
        </button>
      </div>
      <div className="lr5a-stage-body" ref={bodyRef} aria-live="polite">
        <BeatSwap index={index}>
          <GenBeatView q={q} beat={beat} beats={beats} picked={picked} />
        </BeatSwap>
      </div>
      <div className="lr5a-stage-foot">
        <button type="button" className="lr5a-next" onClick={advance}>
          {last ? 'Klart' : 'Nästa →'}
        </button>
      </div>
    </div>
  )
}

/* ── the receipt — numbered spine entry; wrong answers point downward ─── */

function Receipt({
  q,
  n,
  picked,
  onReplay,
}: {
  q: GenContent
  n: number
  picked: string
  onReplay: () => void
}) {
  const correct = picked === q.correct
  return (
    <>
      <div className="lr5a-receipt" data-testid={`genomgang-receipt-${q.id}`}>
        <span className="lr5a-receipt-n">{String(n).padStart(2, '0')}</span>
        <span>
          {q.section}
          {q.headword ? ` · ${q.headword}` : ''} ·{' '}
          <span className={correct ? 'ok' : 'bad'}>{correct ? 'rätt' : 'fel'}</span>
          {!correct && ` — ${q.trapTags[picked]}`}
        </span>
        <button type="button" className="lr5a-replay" onClick={onReplay}>
          spela igen
        </button>
      </div>
      {!correct && (
        <p className="lr5a-booked">→ inbokat i repetitionskön — se ditt schema längre ner</p>
      )}
    </>
  )
}

/* ── a demo question with the full treatment (uppgift 2 / 3) ──────────── */

function GenDemo({
  q,
  n,
  onGraded,
}: {
  q: GenContent
  n: number
  onGraded: (entry: SchedEntry) => void
}) {
  const m = useArketMotion()
  const [picked, setPicked] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle')
  const [playKey, setPlayKey] = useState(0)

  const grade = (k: string) => {
    const ok = k === q.correct
    setPicked(k)
    setPhase('playing')
    onGraded({
      id: q.id,
      label: SCHED_LABELS[q.id] ?? q.section,
      ok,
      tag: ok ? null : (q.trapTags[k] ?? 'fälla'),
    })
  }
  const replay = () => {
    setPlayKey((x) => x + 1)
    setPhase('playing')
  }

  return (
    <div>
      <p className="lr2-folio" style={{ marginBottom: 14 }}>
        {COPY.exampleTag}
      </p>
      <div className="hpc-m3-eyebrow">{q.kicker}</div>
      <p className="hpc-m3-q" style={{ marginTop: 10, whiteSpace: 'pre-line', animation: 'none' }}>
        {q.prompt}
      </p>
      <div style={{ marginTop: 18 }}>
        <OptionList q={q} picked={picked} onPick={grade} />
      </div>
      {picked && phase === 'playing' && (
        <KeepInView rm={m.rm} delayMs={200}>
          <GenStage key={playKey} q={q} picked={picked} onDone={() => setPhase('done')} />
        </KeepInView>
      )}
      {picked && phase === 'done' && <Receipt q={q} n={n} picked={picked} onReplay={replay} />}
    </div>
  )
}

/* ── a dated stop on the spine ────────────────────────────────────────── */

function Station({ tag, sub, children }: { tag: string; sub?: string; children: ReactNode }) {
  return (
    <section className="lr5a-stn" aria-label={tag}>
      <p className="lr5a-stn-tag">
        {tag}
        {sub && <em> · {sub}</em>}
      </p>
      {children}
    </section>
  )
}

/* ── the schedule ledger — where the booked mistakes land ─────────────── */

function SchedLedger({ entries }: { entries: SchedEntry[] }) {
  const m = useArketMotion()
  const okCount = entries.filter((e) => e.ok).length
  const done = entries.length === 3
  return (
    <div>
      <div className="lr5a-sched" role="status" aria-label="Din repetitionskö">
        {entries.length === 0 && (
          <p className="lr5a-sched-empty">
            svara på uppgifterna ovan — schemat bokför sig självt här
          </p>
        )}
        {entries.map((e) => (
          <motion.div
            key={e.id}
            className="lr5a-sched-row"
            initial={m.rm ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={m.tork}
          >
            <span className={`mark ${e.ok ? 'ok' : 'bad'}`} aria-hidden>
              {e.ok ? '✓' : '✗'}
            </span>
            <span>
              {e.label}
              {e.tag && (
                <>
                  {' '}
                  · <em>{e.tag}</em>
                </>
              )}{' '}
              — {e.ok ? 'klarad · fällorna kartlagda ändå' : SCHED_CADENCE}
            </span>
          </motion.div>
        ))}
        <div className="lr5a-sched-row is-dest">
          <span className="mark" aria-hidden>
            ◦
          </span>
          <span>{PROV_DATE_SHORT} · provdagen — då ska kön vara tom</span>
        </div>
      </div>
      {entries.length > 0 && (
        <p className="lr5a-sched-sum">
          {okCount} av {entries.length} rätt · varje fel har blivit en post i schemat
        </p>
      )}
      {done && (
        <div className="reveal">
          <QuietCta />
        </div>
      )}
    </div>
  )
}

/* ── Akt I — the title page under its dateline ─────────────────────────── */

function TitleHero({
  go,
  days,
  picked,
  phase,
  onPick,
  onStageDone,
  onReplay,
  playKey,
}: {
  go: boolean
  days: number
  picked: string | null
  phase: 'idle' | 'playing' | 'done'
  onPick: (k: string) => void
  onStageDone: () => void
  onReplay: () => void
  playKey: number
}) {
  const m = useArketMotion()
  const q = Q1_HERO

  return (
    <div className="lr5a-hero">
      {/* the brand whisper — the only chrome above the dateline */}
      <Ink go={go} delay={0}>
        <div className="lr5a-hero-brand">
          <span className="lr2-brand">{COPY.brand}</span>
          <span className="lr2-folio">{COPY.tagline}</span>
        </div>
      </Ink>

      {/* the dateline — the page's clock; the count is the one LIVING
          element, spliced in display italic and settled like the
          headword (opacity + tracking, zero travel) */}
      <Ink go={go} delay={0.14}>
        <p className="lr5a-dateline">
          Högskoleprovet · söndag 18 oktober
          <motion.span
            className="count"
            initial={false}
            animate={{ opacity: go ? 1 : 0, letterSpacing: go ? '-0.01em' : '0.05em' }}
            transition={
              m.rm ? { duration: 0 } : { duration: 0.6, ease: [...EASE.reading], delay: 0.3 }
            }
          >
            om {days} dagar
          </motion.span>
        </p>
      </Ink>

      <div className="lr5a-hero-center">
        <Ink go={go} delay={0.45}>
          <p className="lr5a-kicker">
            {q.section} · {q.kicker}
          </p>
        </Ink>
        {/* the word arrives with weight: the long typographic settle at
            title-page scale — opacity + letter-spacing, zero travel */}
        <motion.h1
          className="lr5a-headword"
          initial={false}
          animate={{ opacity: go ? 1 : 0, letterSpacing: go ? '-0.015em' : '0.06em' }}
          transition={
            m.rm ? { duration: 0 } : { duration: 0.8, ease: [...EASE.reading], delay: 0.6 }
          }
        >
          {q.headword}
        </motion.h1>
        {/* the compositor's rule — drawn from its center */}
        <motion.div
          className="lr5a-hero-rule"
          initial={false}
          animate={{ scaleX: go ? 1 : 0 }}
          transition={
            m.rm ? { duration: 0 } : { duration: 0.38, ease: [...EASE.reading], delay: 1.14 }
          }
        />
        {/* the options settle like set type, one row at a time */}
        <div className="lr5a-hero-opts">
          {q.options.map((opt, i) => {
            const isPick = picked === opt.key
            const graded = picked !== null
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
              <motion.div
                key={opt.key}
                initial={false}
                animate={{ opacity: go ? 1 : 0 }}
                transition={
                  m.rm
                    ? { duration: 0 }
                    : { duration: 0.32, ease: [...EASE.reading], delay: 1.26 + i * 0.08 }
                }
                style={i === 0 ? { borderTop: '1px solid var(--hairline)' } : undefined}
              >
                <button
                  type="button"
                  className={cls}
                  disabled={graded}
                  onClick={() => onPick(opt.key)}
                  style={{ width: '100%' }}
                >
                  <span className="hpc-m3-ind" />
                  <span className="hpc-m3-opt-k">{opt.key})</span>
                  <span className="hpc-m3-opt-t">{opt.text}</span>
                  <span className="hpc-m3-opt-v">
                    {isRight ? 'Rätt svar' : isWrongPick ? 'Ditt svar' : ''}
                  </span>
                </button>
              </motion.div>
            )
          })}
        </div>

        {/* the genomgång plays right here, on the title page */}
        {picked && phase === 'playing' && (
          <KeepInView rm={m.rm} delayMs={200}>
            <GenStage key={playKey} q={q} picked={picked} onDone={onStageDone} />
          </KeepInView>
        )}
        {picked && phase === 'done' && <Receipt q={q} n={1} picked={picked} onReplay={onReplay} />}
      </div>

      {/* the foot: the hand-off line — the title page passes the eye
          down onto the timeline spine */}
      <div className="lr5a-hero-foot">
        <Ink go={go} delay={1.8}>
          <p className="lr5a-framing">
            Sidan börjar där appen börjar: med en fråga. Resten av sidan är dagarna fram till
            provet.
          </p>
          <p className="lr5a-legal">{COPY.exampleTag}</p>
        </Ink>
      </div>
    </div>
  )
}

/* ── the page ─────────────────────────────────────────────────────────── */

export function LandV5A() {
  const m = useArketMotion()
  const go = useVeilGo(m.rm)
  const sticky = useStickyCta()
  const days = useMemo(() => daysUntilProv(), [])

  const [picked, setPicked] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle')
  const [playKey, setPlayKey] = useState(0)

  const [entries, setEntries] = useState<SchedEntry[]>([])
  const book = (entry: SchedEntry) =>
    setEntries((es) => (es.some((e) => e.id === entry.id) ? es : [...es, entry]))

  const gradeHero = (k: string) => {
    const ok = k === Q1_HERO.correct
    setPicked(k)
    setPhase('playing')
    book({
      id: Q1_HERO.id,
      label: SCHED_LABELS[Q1_HERO.id],
      ok,
      tag: ok ? null : (Q1_HERO.trapTags[k] ?? 'fälla'),
    })
  }
  const replayHero = () => {
    setPlayKey((n) => n + 1)
    setPhase('playing')
  }

  return (
    <div className="lr2-root">
      <style>{LR2_CSS}</style>
      <style>{LR5A_CSS}</style>

      {/* Akt I — the question IS the first frame, under the exam's clock */}
      <section ref={sticky.heroRef} aria-label="Prova en uppgift — nedräkning till provet">
        <TitleHero
          go={go}
          days={days}
          picked={picked}
          phase={phase}
          onPick={gradeHero}
          onStageDone={() => setPhase('done')}
          onReplay={replayHero}
          playKey={playKey}
        />
      </section>

      {/* Akt II — the spine claims the title page as its first stop */}
      <div className="lr5a-col">
        <div className="lr5a-line">
          <motion.div
            className="lr5a-spine"
            style={{ transformOrigin: 'top center' }}
            initial={false}
            animate={{ scaleY: go ? 1 : 0 }}
            transition={m.rm ? { duration: 0 } : { ...m.tween(1.05), delay: 0.9 }}
            aria-hidden
          />

          <Station tag="Ikväll" sub="där du är nu">
            <h2 className="lr5a-thesis">Det här är inte en broschyr. Det är appen.</h2>
            <p className="lr2-body" style={{ marginTop: 14, maxWidth: '50ch' }}>
              Frågan du just mötte rättas som appen rättar — hela vägen, fälla för fälla. Två
              uppgifter till väntar på vägen mot den 18 oktober, och varje fel bokförs i ett schema
              som slutar på provdagen.
            </p>
            {/* station 1 — the early door: reachable without answering */}
            <QuietCta />
            <div className="lr2-note" style={{ marginTop: 30 }}>
              <div className="lr2-note-l">{COPY.claims.zero.label}</div>
              <p className="lr2-note-t">{COPY.claims.zero.text}</p>
            </div>
          </Station>

          <Station tag="I morgon" sub="uppgift 2 · KVA">
            <GenDemo q={Q2_KVA} n={2} onGraded={book} />
            <div className="lr2-note" style={{ marginTop: 30 }}>
              <div className="lr2-note-l">{COPY.claims.adhd.label}</div>
              <p className="lr2-note-t">{COPY.claims.adhd.text}</p>
            </div>
          </Station>

          <Station tag="Om tre dagar" sub="uppgift 3 · MEK">
            <GenDemo q={Q3_MEK} n={3} onGraded={book} />
            <div className="lr2-note" style={{ marginTop: 30 }}>
              <div className="lr2-note-l">{COPY.claims.loop.label}</div>
              <p className="lr2-note-t">{COPY.claims.loop.text}</p>
            </div>
          </Station>

          <Station tag="Ditt schema" sub="repetitionskön">
            <SchedLedger entries={entries} />
          </Station>

          <Station tag="Veckan före provet">
            <div className="lr2-note">
              <div className="lr2-note-l">{COPY.claims.target.label}</div>
              <p className="lr2-note-t">{COPY.claims.target.text}</p>
            </div>
          </Station>

          <Station tag={`Provdagen · ${PROV_DATE_SHORT}`}>
            <p className="lr5a-scene">
              Klockan 09:10 öppnas häftet, och orden på titelsidan ser likadana ut som ikväll — men
              den här gången är det du som känner igen fällorna först.
            </p>
            <section ref={sticky.endRef} aria-label="Pris och konto">
              <PriceBlock />
              <Cta sub={COPY.ctaSub} />
            </section>
          </Station>
        </div>

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

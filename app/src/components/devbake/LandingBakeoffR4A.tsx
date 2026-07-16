// LandingBakeoffR4A — landing v4 art-direction bake-off, variant A:
// "Sidan öppnar som frågan".
//
// THESIS: the landing does not introduce the product — it IS the product
// from the first frame. The first viewport at 390px is the vederhäftig
// question itself, set like a book's TITLE PAGE: brand whisper at the
// head, the headword arriving with weight (a long typographic settle at
// a scale the app never uses — the variant's one aesthetic risk), a
// short rule drawn, the five options settling like set type, one line
// of framing at the foot. No pitch above the fold. The sales narrative
// (thesis, claims, price) EARNS its place after the question.
//
// MECHANICS (owner-decided, from v3): EVERY demo question gets the full
// genomgång treatment — a Scenen-style fixed-height beat stage
// (skippable) that collapses to a one-line replayable receipt. The hero
// runs the R3 vederhäftig content VERBATIM; questions 2 (KVA) and 3
// (MEK) are original content in the same structure (see
// LandingBakeoffR4A.content). The numbered receipts the questions leave
// behind are the page's spine, gathered in the UTFALL ledger.
//
// CTA system (four stations) intact: early door directly under the
// fold, earned moments (kvitto beats + completed ledger), sticky bar,
// price block. LEGAL: all demo content is ORIGINAL, written for
// HP-Coach — nothing from the © UHR corpus; labeled on the page.
//
// Motion: tokens from lib/motion only; the title-page sequence is
// state-driven (useMountGo) so it survives RouteScene's mount
// suppression and collapses to the final state under reduced motion.
// DESIGN artifact — consumed by /dev/landing-bakeoff. Kept forever.

import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useMemo, useRef, useState } from 'react'

import { EASE, KeepInView, useArketMotion, useMountGo } from '@/lib/motion'

import {
  COPY,
  Cta,
  Ink,
  LR2_CSS,
  PriceBlock,
  QuietCta,
  RailRow,
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

const LR4A_CSS = `
/* ── Akt I — the title page ── */
.lr4a-hero {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 16px 20px 22px;
  box-sizing: border-box;
}
.lr4a-hero-brand {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.lr4a-hero-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: 34px 0 26px;
}
.lr4a-kicker {
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
  .lr4a-kicker { white-space: normal; }
}
.lr4a-headword {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  font-size: clamp(56px, 16.5vw, 132px);
  line-height: 1;
  color: var(--ink);
  text-align: center;
  margin: 10px 0 0;
}
.lr4a-hero-rule {
  width: 72px;
  height: 1px;
  background: var(--ink);
  margin: 26px auto 0;
  transform-origin: center;
}
.lr4a-hero-opts { margin-top: 22px; }
.lr4a-hero-foot {
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
  text-align: center;
}
.lr4a-framing {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 17px;
  line-height: 1.5;
  color: var(--ink-2);
  margin: 0;
}
.lr4a-legal {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.07em;
  color: var(--muted);
  margin: 8px 0 0;
}

/* ── the stage — a printer's plate: heavy top rule, hairline sides ── */
.lr4a-stage {
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
.lr4a-stage-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--hairline);
}
.lr4a-meter {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.lr4a-skip {
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
.lr4a-skip:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.lr4a-stage-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 16px 8px;
}
.lr4a-stage-foot {
  padding: 12px 16px 14px;
  border-top: 1px solid var(--hairline);
  display: flex;
  justify-content: flex-end;
}
.lr4a-next {
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
.lr4a-next:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.lr4a-beat-label {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 12px;
}
.lr4a-annot {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.6;
  letter-spacing: 0.04em;
  color: var(--accent);
  margin: 16px 0 0;
  max-width: 46ch;
}
.lr4a-annot a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.lr4a-din-tag {
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
.lr4a-din-wash {
  background: var(--bad-soft);
  border-radius: 6px;
  padding: 12px 14px;
  margin: 0 -14px;
}
.lr4a-compressed .hpc-m3-dis-p { font-size: 12.5px; line-height: 1.55; }
.lr4a-compressed .hpc-m3-dis-h { font-size: 14px; }
.lr4a-kvitto-line {
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  margin: 14px 0 0;
  font-variant-numeric: tabular-nums;
}

/* ── the receipt — the collapsed stage; the page's spine ── */
.lr4a-receipt {
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
.lr4a-receipt-n { color: var(--muted); }
.lr4a-receipt .ok { color: var(--ok); }
.lr4a-receipt .bad { color: var(--bad); }
.lr4a-replay {
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
.lr4a-replay:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

.lr4a-thesis {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 500;
  font-size: clamp(28px, 7vw, 40px);
  line-height: 1.15;
  letter-spacing: -0.015em;
  color: var(--ink);
  margin: 0;
  max-width: 18ch;
}

@media (min-width: 900px) {
  .lr4a-stage { height: 540px; }
  .lr4a-hero { padding: 22px 24px 30px; }
}
`

/* ── shared option list (R3 HeroQuestion's rows, generic) ─────────────── */

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
  return <p className="lr4a-annot">»{children}«</p>
}

/* ── one beat, rendered (generic over GenContent) ─────────────────────── */

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
        <p className="lr4a-beat-label">Utfall</p>
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
        <p className="lr4a-beat-label">
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
    const fallaIndex = fallor.findIndex((b) => b === beat) + 1
    const label = beat.din
      ? 'Din fälla'
      : `Varför de andra lockar · fälla ${fallaIndex} av ${fallor.length}`
    return (
      <div className={beat.compressed ? 'lr4a-compressed' : undefined}>
        <p className="lr4a-beat-label">{label}</p>
        <div className="hpc-m3-dis" style={{ animation: 'none', borderBottom: 0 }}>
          <div className={beat.din ? 'lr4a-din-wash' : undefined}>
            <p className="hpc-m3-dis-h">
              <span className="hpc-m3-dis-k">{beat.letter})</span>
              <s>{optText}</s>
              {beat.din && <span className="lr4a-din-tag">din gissning</span>}
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

  // kvitto — the earned station.
  return (
    <div>
      <p className="lr4a-beat-label">Kvitto</p>
      <div className="lr2-note">
        <div className="lr2-note-l">{COPY.revealLabel}</div>
        <p className="lr2-note-t">{q.kvittoNote}</p>
      </div>
      <p className="lr4a-kvitto-line">
        {beat.correct
          ? 'inga fel att tagga — fällorna kartlagda ändå'
          : `felet taggat: ${q.trapTags[picked]} → repetitionskön`}
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
    <div className="lr4a-stage" data-testid={`genomgang-stage-${q.id}`}>
      <div className="lr4a-stage-head">
        <span className="lr4a-meter">
          Genomgång · {index + 1} av {beats.length}
        </span>
        <button type="button" className="lr4a-skip" onClick={onDone}>
          hoppa över
        </button>
      </div>
      <div className="lr4a-stage-body" ref={bodyRef} aria-live="polite">
        <BeatSwap index={index}>
          <GenBeatView q={q} beat={beat} beats={beats} picked={picked} />
        </BeatSwap>
      </div>
      <div className="lr4a-stage-foot">
        <button type="button" className="lr4a-next" onClick={advance}>
          {last ? 'Klart' : 'Nästa →'}
        </button>
      </div>
    </div>
  )
}

/* ── the receipt — one line, replayable; numbered as the page's spine ── */

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
    <div className="lr4a-receipt" data-testid={`genomgang-receipt-${q.id}`}>
      <span className="lr4a-receipt-n">{String(n).padStart(2, '0')}</span>
      <span>
        {q.section}
        {q.headword ? ` · ${q.headword}` : ''} ·{' '}
        <span className={correct ? 'ok' : 'bad'}>{correct ? 'rätt' : 'fel'}</span>
        {!correct && ` — ${q.trapTags[picked]}`}
      </span>
      <button type="button" className="lr4a-replay" onClick={onReplay}>
        spela igen
      </button>
    </div>
  )
}

/* ── a demo question with the full treatment (Q2 / Q3) ────────────────── */

function GenDemo({
  q,
  n,
  onGraded,
}: {
  q: GenContent
  n: number
  onGraded: (ok: boolean) => void
}) {
  const m = useArketMotion()
  const [picked, setPicked] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle')
  const [playKey, setPlayKey] = useState(0)

  const grade = (k: string) => {
    setPicked(k)
    setPhase('playing')
    onGraded(k === q.correct)
  }
  const replay = () => {
    setPlayKey((x) => x + 1)
    setPhase('playing')
  }

  return (
    <div>
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

/* ── Akt I — the title page ───────────────────────────────────────────── */

function TitleHero({
  picked,
  phase,
  onPick,
  onStageDone,
  onReplay,
  playKey,
}: {
  picked: string | null
  phase: 'idle' | 'playing' | 'done'
  onPick: (k: string) => void
  onStageDone: () => void
  onReplay: () => void
  playKey: number
}) {
  const m = useArketMotion()
  const go = useMountGo(m.rm)
  const q = Q1_HERO

  return (
    <div className="lr4a-hero">
      {/* the brand whisper — the only chrome above the question */}
      <Ink go={go} delay={0}>
        <div className="lr4a-hero-brand">
          <span className="lr2-brand">{COPY.brand}</span>
          <span className="lr2-folio">{COPY.tagline}</span>
        </div>
      </Ink>

      <div className="lr4a-hero-center">
        <Ink go={go} delay={0.12}>
          <p className="lr4a-kicker">
            {q.section} · {q.kicker}
          </p>
        </Ink>
        {/* the word arrives with weight: a long typographic settle at
            title-page scale — opacity + letter-spacing, zero travel */}
        <motion.h1
          className="lr4a-headword"
          initial={false}
          animate={{ opacity: go ? 1 : 0, letterSpacing: go ? '-0.015em' : '0.06em' }}
          transition={
            m.rm ? { duration: 0 } : { duration: 0.8, ease: [...EASE.reading], delay: 0.28 }
          }
        >
          {q.headword}
        </motion.h1>
        {/* the compositor's rule — drawn from its center */}
        <motion.div
          className="lr4a-hero-rule"
          initial={false}
          animate={{ scaleX: go ? 1 : 0 }}
          transition={
            m.rm ? { duration: 0 } : { duration: 0.38, ease: [...EASE.reading], delay: 0.82 }
          }
        />
        {/* the options settle like set type, one row at a time */}
        <div className="lr4a-hero-opts">
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
                    : { duration: 0.32, ease: [...EASE.reading], delay: 0.95 + i * 0.08 }
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

      {/* the foot: one line of framing + the legal label — nothing else */}
      <div className="lr4a-hero-foot">
        <Ink go={go} delay={1.5}>
          <p className="lr4a-framing">Sidan börjar där appen börjar: med en fråga.</p>
          <p className="lr4a-legal">{COPY.exampleTag}</p>
        </Ink>
      </div>
    </div>
  )
}

/* ── the page ─────────────────────────────────────────────────────────── */

export function LandV4A() {
  const sticky = useStickyCta()

  const [picked, setPicked] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle')
  const [playKey, setPlayKey] = useState(0)
  const [tally, setTally] = useState<Record<string, boolean>>({})
  const book = (id: string, ok: boolean) => setTally((t) => (id in t ? t : { ...t, [id]: ok }))

  const grade = (k: string) => {
    setPicked(k)
    book(Q1_HERO.id, k === Q1_HERO.correct)
    setPhase('playing')
  }
  const replay = () => {
    setPlayKey((n) => n + 1)
    setPhase('playing')
  }

  return (
    <div className="lr2-root">
      <style>{LR2_CSS}</style>
      <style>{LR4A_CSS}</style>

      {/* Akt I — the question IS the first frame */}
      <section ref={sticky.heroRef} aria-label="Prova en uppgift">
        <TitleHero
          picked={picked}
          phase={phase}
          onPick={grade}
          onStageDone={() => setPhase('done')}
          onReplay={replay}
          playKey={playKey}
        />
      </section>

      <div className="hpc-m3-frame" style={{ paddingTop: 40 }}>
        {/* Akt II — the thesis, EARNED: the first thing under the fold */}
        <RailRow label="Sidan" sub="vad det här är">
          <h2 className="lr4a-thesis">Det här är inte en broschyr. Det är appen.</h2>
          <p className="lr2-body" style={{ marginTop: 14, maxWidth: '50ch' }}>
            Frågan du just mötte rättas som appen rättar — hela vägen, fälla för fälla. Två
            uppgifter till väntar nedanför.
          </p>
          {/* station 1 — the early door: reachable without answering */}
          <QuietCta />
        </RailRow>

        <RailRow label="Uppgift 2" sub="KVA · exempel">
          <p className="lr2-folio" style={{ marginBottom: 14 }}>
            {COPY.exampleTag}
          </p>
          <GenDemo q={Q2_KVA} n={2} onGraded={(ok) => book(Q2_KVA.id, ok)} />
        </RailRow>

        <RailRow label="Marginal" sub="varför noll">
          <div className="lr2-note">
            <div className="lr2-note-l">{COPY.claims.zero.label}</div>
            <p className="lr2-note-t">{COPY.claims.zero.text}</p>
          </div>
        </RailRow>

        <RailRow label="Uppgift 3" sub="MEK · exempel">
          <p className="lr2-folio" style={{ marginBottom: 14 }}>
            {COPY.exampleTag}
          </p>
          <GenDemo q={Q3_MEK} n={3} onGraded={(ok) => book(Q3_MEK.id, ok)} />
        </RailRow>

        <RailRow label="Marginal" sub="varför fel lönar sig">
          <div className="lr2-note">
            <div className="lr2-note-l">{COPY.claims.loop.label}</div>
            <p className="lr2-note-t">{COPY.claims.loop.text}</p>
          </div>
        </RailRow>

        <RailRow label="Utfall" sub="din session">
          <SessionLedger tally={tally} />
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

      <StickyCta visible={sticky.visible} />
    </div>
  )
}

/** The session ledger — the receipts gathered into one line. */
function SessionLedger({ tally }: { tally: Record<string, boolean> }) {
  const m = useArketMotion()
  const order = [Q1_HERO.id, Q2_KVA.id, Q3_MEK.id]
  const answered = order.filter((id) => id in tally)
  const okCount = answered.filter((id) => tally[id]).length
  const done = answered.length === order.length

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

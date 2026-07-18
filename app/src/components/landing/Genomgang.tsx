// Landing genomgång — the demo-question player of the public landing.
//
// Extracted from the winning bake-off (LandingBakeoffR5A). Every demo
// question plays the full genomgång as a fixed-height, Scenen-style beat
// stage (skippable) and collapses to a numbered, replayable receipt.
// Beat engine + all three questions come from LandingBakeoffR4A.content
// (hero = vederhäftig VERBATIM from R3) — the bake-off content modules
// are imported AS-IS, never modified, per the productionization brief.
//
// LEGAL: all demo content is ORIGINAL, written for HP-Coach — labeled on
// the page; nothing from the © UHR corpus.

import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useMemo, useRef, useState } from 'react'

import {
  buildGenBeats,
  type GenBeat,
  type GenContent,
  Q1_HERO,
  Q2_KVA,
  Q3_MEK,
} from '@/components/devbake/LandingBakeoffR4A.content'
import { KeepInView, useArketMotion } from '@/lib/motion'

import { QuietCta } from './chrome'
import { COPY, SCHED_CADENCE, type SchedEntry } from './copy'

/* ── what each question is called once it is booked in the schema ─────── */

export const SCHED_LABELS: Record<string, string> = {
  [Q1_HERO.id]: 'vederhäftig',
  [Q2_KVA.id]: 'procentparet',
  [Q3_MEK.id]: 'luckparet',
}

/* ── shared option list ───────────────────────────────────────────────── */

export function OptionList({
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
  return <p className="hpl-annot">»{children}«</p>
}

/* ── one beat, rendered (the kvitto points down the spine) ────────────── */

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
        <p className="hpl-beat-label">Utfall</p>
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
        <p className="hpl-beat-label">
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
      <div className={beat.compressed ? 'hpl-compressed' : undefined}>
        <p className="hpl-beat-label">{label}</p>
        <div
          className="hpc-m3-dis"
          style={{ animation: 'none', borderBottom: 0 }}
          data-din-gissning={beat.din || undefined}
        >
          <div className={beat.din ? 'hpl-din-wash' : undefined}>
            <p className="hpc-m3-dis-h">
              <span className="hpc-m3-dis-k">{beat.letter})</span>
              <s>{optText}</s>
              {beat.din && <span className="hpl-din-tag">din gissning</span>}
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
      <p className="hpl-beat-label">Kvitto</p>
      <div className="hpl-note">
        <div className="hpl-note-l">{COPY.revealLabel}</div>
        <p className="hpl-note-t">{q.kvittoNote}</p>
      </div>
      <p className="hpl-kvitto-line">
        {beat.correct
          ? 'inga fel att boka in — fällorna kartlagda ändå'
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

export function GenStage({
  q,
  picked,
  onDone,
}: {
  q: GenContent
  picked: string
  onDone: () => void
}) {
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
    <div className="hpl-stage" data-testid={`genomgang-stage-${q.id}`}>
      <div className="hpl-stage-head">
        <span className="hpl-meter">
          Genomgång · {index + 1} av {beats.length}
        </span>
        <button type="button" className="hpl-skip" onClick={onDone}>
          hoppa över
        </button>
      </div>
      <div className="hpl-stage-body" ref={bodyRef} aria-live="polite">
        <BeatSwap index={index}>
          <GenBeatView q={q} beat={beat} beats={beats} picked={picked} />
        </BeatSwap>
      </div>
      <div className="hpl-stage-foot">
        <button type="button" className="hpl-next" onClick={advance}>
          {last ? 'Klart' : 'Nästa →'}
        </button>
      </div>
    </div>
  )
}

/* ── the receipt — numbered spine entry; wrong answers point downward ─── */

export function Receipt({
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
      <div className="hpl-receipt" data-testid={`genomgang-receipt-${q.id}`}>
        <span className="hpl-receipt-n">{String(n).padStart(2, '0')}</span>
        <span>
          {q.section}
          {q.headword ? ` · ${q.headword}` : ''} ·{' '}
          <span className={correct ? 'ok' : 'bad'}>{correct ? 'rätt' : 'fel'}</span>
          {!correct && ` — ${q.trapTags[picked]}`}
        </span>
        <button type="button" className="hpl-replay" onClick={onReplay}>
          spela upp igen
        </button>
      </div>
      {!correct && (
        <p className="hpl-booked">→ inbokat i repetitionskön — se ditt schema längre ner</p>
      )}
    </>
  )
}

/* ── a demo question with the full treatment (uppgift 2 / 3) ──────────── */

export function GenDemo({
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
      <p className="hpl-folio" style={{ marginBottom: 14 }}>
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

// LandingBakeoffR4C — landing v4 art-direction bake-off, variant C:
// "TIDSLINJEN".
//
// THESIS (variant C, designer's choice): the page is set on a single
// TIME AXIS — the scroll is the distance between tonight (the visitor,
// phone in hand) and provdagen (the real, dated exam). A spine draws
// down from the masthead dateline on load and every station is a dated
// stop on it: IKVÄLL → I MORGON → OM TRE DAGAR → DITT SCHEMA → VECKAN
// FÖRE PROVET → PROVDAGEN. The signature moment: when an answer is
// graded, the mistake is VISIBLY BOOKED into the timeline — a
// repetition schedule materializes further down the page, and the page
// ends on exam morning, which is where the price lives. Dramaturgy,
// not skin: the Boksidan idiom (cream paper, serif, hairlines) is kept
// verbatim; the one bold object is the time spine and what it does to
// the page's structure.
//
// AESTHETIC RISK, owned: the page opens on a LIVE countdown dateline
// ("om N dagar") — a living number on a print-idiom page. Justified as
// a masthead dateline: the one element of print that has always
// carried the current date.
//
// MECHANICS (owner-decided, inherited from R3 — imported, not
// modified): every demo question plays the full genomgång as a
// Scenen-style beat loop in a fixed-height stage (skippable), then
// collapses to a one-line replayable receipt. The beat ENGINE is
// R3's `buildBeats` reused unmodified: both new questions are authored
// with correct answer `b` and distractors within {a,c,d} so they live
// inside the engine's letter space; the page filters the `e` beat out
// for four-option questions (see LandingBakeoffR4C.content.ts).
// Hero content = vederhäftig VERBATIM (R3.logic). Original genomgång
// content for KVA + MEK lives in the content module.
//
// CTA system (four stations) intact: early door in the hero, earned
// links (hero kvitto + completed schedule), sticky bar, price block.
// Exactly three landing-voice margin annotations — hero genomgång only.
// LEGAL: all demo content ORIGINAL, labeled on the page; nothing from
// the © UHR corpus. Motion: lib/motion tokens only; reduced motion
// collapses every beat to its final state.
//
// DESIGN artifact — wired into /dev/landing-bakeoff by the
// orchestrator. Kept forever per house rule.

import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useMemo, useRef, useState } from 'react'

import { useArketMotion, useMountGo } from '@/lib/motion'

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
import { type Beat, buildBeats, type OptionKey, VEDERHAFTIG } from './LandingBakeoffR3.logic'
import {
  daysUntilProv,
  PROV_DATE_LABEL,
  PROV_DATE_SHORT,
  Q1_ORD,
  Q2_KVA,
  Q3_MEK,
  type R4CQuestion,
  SCHED_CADENCE,
  type SchedEntry,
} from './LandingBakeoffR4C.content'

/* ── landing-local styles (layout only; color/type from live tokens) ──── */

const LR4C_CSS = `
.lr4c-col {
  max-width: 680px;
  margin: 0 auto;
  padding: 26px 20px 96px;
}
.lr4c-dateline {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 30px 0 0;
}
.lr4c-count {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 500;
  font-size: clamp(54px, 15vw, 92px);
  line-height: 1.02;
  color: var(--ink);
  margin: 6px 0 0;
}
.lr4c-thesis {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 500;
  font-size: clamp(19px, 5vw, 24px);
  line-height: 1.4;
  color: var(--ink);
  margin: 20px 0 0;
  max-width: 32ch;
}
/* the time spine — the page's one bold object */
.lr4c-line {
  position: relative;
  padding-left: 26px;
  margin-top: 34px;
}
.lr4c-spine {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--ink);
}
.lr4c-stn { position: relative; margin-top: 62px; }
.lr4c-stn:first-child { margin-top: 30px; }
.lr4c-stn-tag {
  position: relative;
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink);
  margin: 0 0 16px;
}
.lr4c-stn-tag::before {
  content: '';
  position: absolute;
  left: -26px;
  top: 50%;
  width: 14px;
  height: 1px;
  background: var(--ink);
}
.lr4c-stn-tag em {
  font-style: normal;
  color: var(--muted);
}
/* the genomgång stage (R3 grammar, this page's chrome) */
.lr4c-stage {
  border: 1px solid var(--hairline);
  border-radius: 6px;
  background: var(--bg);
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  height: 590px; /* FIXED — the card never grows; content swaps inside */
  overflow: hidden;
}
.lr4c-stage-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--hairline);
}
.lr4c-meter {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.lr4c-skip {
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
.lr4c-skip:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.lr4c-stage-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 16px 8px;
}
.lr4c-stage-foot {
  padding: 12px 16px 14px;
  border-top: 1px solid var(--hairline);
  display: flex;
  justify-content: flex-end;
}
.lr4c-next {
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
.lr4c-next:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.lr4c-beat-label {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 12px;
}
.lr4c-annot {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.6;
  letter-spacing: 0.04em;
  color: var(--accent);
  margin: 16px 0 0;
  max-width: 46ch;
}
.lr4c-annot a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.lr4c-din-tag {
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
.lr4c-din-wash {
  background: var(--bad-soft);
  border-radius: 6px;
  padding: 12px 14px;
  margin: 0 -14px;
}
.lr4c-compressed .hpc-m3-dis-p { font-size: 12.5px; line-height: 1.55; }
.lr4c-compressed .hpc-m3-dis-h { font-size: 14px; }
.lr4c-kvitto-line {
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  margin: 14px 0 0;
  font-variant-numeric: tabular-nums;
}
.lr4c-receipt {
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
.lr4c-replay {
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
.lr4c-replay:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.lr4c-booked {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.05em;
  color: var(--accent);
  margin: 10px 0 0;
}
/* the schedule ledger — where booked mistakes land */
.lr4c-sched { border-top: 1px solid var(--hairline); }
.lr4c-sched-row {
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
.lr4c-sched-row .mark { font-size: 15px; line-height: 1; }
.lr4c-sched-row .mark.ok { color: var(--ok); }
.lr4c-sched-row .mark.bad { color: var(--bad); }
.lr4c-sched-row em { font-style: normal; color: var(--accent); }
.lr4c-sched-row.is-dest { color: var(--muted); border-bottom: 0; }
.lr4c-sched-empty {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--muted);
  margin: 0;
  padding: 13px 0;
}
.lr4c-sched-sum {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  margin: 14px 0 0;
  font-variant-numeric: tabular-nums;
}
.lr4c-scene {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 19px;
  line-height: 1.55;
  color: var(--ink);
  margin: 0 0 26px;
  max-width: 44ch;
}
@media (min-width: 900px) {
  .lr4c-col { max-width: 720px; padding: 48px 24px 120px; }
  .lr4c-line { padding-left: 34px; }
  .lr4c-stn-tag::before { left: -34px; width: 20px; }
  .lr4c-stage { height: 540px; }
}
`

/* ── beat engine adapter — R3's buildBeats over the generic content ───── */

/** Every R4C question is authored with correct = 'b' inside the engine's
 *  letter space, so `buildBeats` is reused verbatim; four-option
 *  questions just drop the `e` fälla beat. */
function beatsFor(q: R4CQuestion, picked: OptionKey): Beat[] {
  return buildBeats({ mode: 'scenen', picked }).filter(
    (b) => b.kind !== 'falla' || q.letters.includes(b.letter),
  )
}

function beatMeta(beats: Beat[], index: number, hero: boolean) {
  const beat = beats[index]
  const stegTotal = beats.filter((b) => b.kind === 'steg').length
  const fallor = beats.filter((b) => b.kind === 'falla')
  const fallaIndex = beat.kind === 'falla' ? fallor.findIndex((b) => b === beat) + 1 : 0
  const firstOfKind = beats.findIndex((b) => b.kind === beat.kind) === index
  // Annotations: exactly three on the whole page — hero genomgång only.
  const showAnnotation = hero && beat.kind !== 'kvitto' && firstOfKind
  return {
    totalOfKind: { steg: stegTotal, falla: fallor.length, fallaIndex },
    showAnnotation,
  }
}

/* ── margin annotation — the landing's curator-pencil voice ───────────── */

function Annot({ children }: { children: ReactNode }) {
  return <p className="lr4c-annot">»{children}«</p>
}

/* ── one beat, rendered (generic port of the R3 grammar) ──────────────── */

function BeatView({
  q,
  beat,
  picked,
  totalOfKind,
  showAnnotation,
}: {
  q: R4CQuestion
  beat: Beat
  picked: OptionKey
  totalOfKind: { steg: number; falla: number; fallaIndex: number }
  showAnnotation: boolean
}) {
  const correct = picked === q.correct
  const pickedText = q.options.find((o) => o.key === picked)?.text ?? ''

  if (beat.kind === 'utfall') {
    return (
      <div>
        <p className="lr4c-beat-label">Utfall</p>
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
        {showAnnotation && <Annot>{VEDERHAFTIG.annotations.utfall}</Annot>}
      </div>
    )
  }

  if (beat.kind === 'steg') {
    const step = q.steps[beat.stegIndex]
    return (
      <div>
        <p className="lr4c-beat-label">
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
    const d = q.distractors[beat.letter]
    if (!d) return null
    const optText = q.options.find((o) => o.key === beat.letter)?.text ?? ''
    const label = beat.dinGissning
      ? 'Din fälla'
      : `Varför de andra lockar · fälla ${totalOfKind.fallaIndex} av ${totalOfKind.falla}`
    return (
      <div className={beat.compressed ? 'lr4c-compressed' : undefined}>
        <p className="lr4c-beat-label">{label}</p>
        <div
          className="hpc-m3-dis"
          style={{ animation: 'none', borderBottom: 0 }}
          data-din-gissning={beat.dinGissning || undefined}
        >
          <div className={beat.dinGissning ? 'lr4c-din-wash' : undefined}>
            <p className="hpc-m3-dis-h">
              <span className="hpc-m3-dis-k">{beat.letter})</span>
              <s>{optText}</s>
              {beat.dinGissning && <span className="lr4c-din-tag">din gissning</span>}
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

  // kvitto — the earned station; on this page it points down the timeline.
  const tag = q.trapTags[picked as keyof typeof q.trapTags]
  return (
    <div>
      <p className="lr4c-beat-label">Kvitto</p>
      <div className="lr2-note">
        <div className="lr2-note-l">{COPY.revealLabel}</div>
        <p className="lr2-note-t">
          Det du just läste är appens riktiga genomgång — varje fråga i kursen rättas så här.
        </p>
      </div>
      <p className="lr4c-kvitto-line">
        {beat.correct
          ? 'inga fel att tagga — fällorna kartlagda ändå'
          : `felet taggat: ${tag ?? 'fälla'} → inbokat ${SCHED_CADENCE}`}
      </p>
      {q.id === Q1_ORD.id && <QuietCta />}
    </div>
  )
}

/** Ink-swap between beats — outgoing ink lifts, incoming dries in.
 *  Zero travel; instant under reduced motion. */
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

function GenomgangStage({
  q,
  picked,
  hero,
  onDone,
}: {
  q: R4CQuestion
  picked: OptionKey
  hero: boolean
  onDone: () => void
}) {
  const beats = useMemo(() => beatsFor(q, picked), [q, picked])
  const [index, setIndex] = useState(0)
  const beat = beats[index]
  const last = index === beats.length - 1
  const meta = beatMeta(beats, index, hero)
  const bodyRef = useRef<HTMLDivElement>(null)

  const advance = () => {
    if (last) onDone()
    else {
      setIndex((i) => i + 1)
      bodyRef.current?.scrollTo({ top: 0 })
    }
  }

  return (
    <div className="lr4c-stage" data-testid={`genomgang-stage-${q.id}`}>
      <div className="lr4c-stage-head">
        <span className="lr4c-meter">
          Genomgång · {index + 1} av {beats.length}
        </span>
        <button type="button" className="lr4c-skip" onClick={onDone}>
          hoppa över
        </button>
      </div>
      <div className="lr4c-stage-body" ref={bodyRef} aria-live="polite">
        <BeatSwap index={index}>
          <BeatView
            q={q}
            beat={beat}
            picked={picked}
            totalOfKind={meta.totalOfKind}
            showAnnotation={meta.showAnnotation}
          />
        </BeatSwap>
      </div>
      <div className="lr4c-stage-foot">
        <button type="button" className="lr4c-next" onClick={advance}>
          {last ? 'Klart' : 'Nästa →'}
        </button>
      </div>
    </div>
  )
}

/* ── a question station on the timeline ───────────────────────────────── */

function QuestionStation({
  q,
  hero = false,
  onGraded,
}: {
  q: R4CQuestion
  hero?: boolean
  onGraded: (entry: SchedEntry) => void
}) {
  const [picked, setPicked] = useState<OptionKey | null>(null)
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle')
  const [playKey, setPlayKey] = useState(0)
  const graded = picked !== null
  const wrong = graded && picked !== q.correct
  const beatsCount = picked ? beatsFor(q, picked).length : 0

  const grade = (k: OptionKey) => {
    if (graded) return
    const ok = k === q.correct
    setPicked(k)
    setPhase('playing')
    onGraded({
      id: q.id,
      label: q.schedLabel,
      ok,
      tag: ok ? null : (q.trapTags[k as keyof typeof q.trapTags] ?? 'fälla'),
    })
  }
  const replay = () => {
    setPlayKey((n) => n + 1)
    setPhase('playing')
  }

  return (
    <div>
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
        <GenomgangStage
          key={playKey}
          q={q}
          picked={picked}
          hero={hero}
          onDone={() => setPhase('done')}
        />
      )}
      {picked && phase === 'done' && (
        <div className="lr4c-receipt" data-testid={`genomgang-receipt-${q.id}`}>
          <span>Genomgång klar · {beatsCount} beats · </span>
          <button type="button" className="lr4c-replay" onClick={replay}>
            spela igen
          </button>
        </div>
      )}
      {picked && phase === 'done' && wrong && (
        <p className="lr4c-booked">→ inbokat i repetitionskön — se ditt schema längre ner</p>
      )}
    </div>
  )
}

/* ── a dated stop on the spine ────────────────────────────────────────── */

function Station({ tag, sub, children }: { tag: string; sub?: string; children: ReactNode }) {
  return (
    <section className="lr4c-stn" aria-label={tag}>
      <p className="lr4c-stn-tag">
        {tag}
        {sub && <em> · {sub}</em>}
      </p>
      {children}
    </section>
  )
}

/* ── the schedule ledger — the signature moment's landing place ───────── */

function SchedLedger({ entries }: { entries: SchedEntry[] }) {
  const m = useArketMotion()
  const okCount = entries.filter((e) => e.ok).length
  const done = entries.length === 3
  return (
    <div>
      <div className="lr4c-sched" role="status" aria-label="Din repetitionskö">
        {entries.length === 0 && (
          <p className="lr4c-sched-empty">
            svara på uppgifterna ovan — schemat bokför sig självt här
          </p>
        )}
        {entries.map((e) => (
          <motion.div
            key={e.id}
            className="lr4c-sched-row"
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
        <div className="lr4c-sched-row is-dest">
          <span className="mark" aria-hidden>
            ◦
          </span>
          <span>{PROV_DATE_SHORT} · provdagen — då ska kön vara tom</span>
        </div>
      </div>
      {entries.length > 0 && (
        <p className="lr4c-sched-sum">
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

/* ── the page ─────────────────────────────────────────────────────────── */

export function LandV4C() {
  const m = useArketMotion()
  const go = useMountGo(m.rm)
  const sticky = useStickyCta()
  const days = useMemo(() => daysUntilProv(), [])

  const [entries, setEntries] = useState<SchedEntry[]>([])
  const book = (entry: SchedEntry) =>
    setEntries((es) => (es.some((e) => e.id === entry.id) ? es : [...es, entry]))

  return (
    <div className="lr2-root">
      <style>{LR2_CSS}</style>
      <style>{LR4C_CSS}</style>
      <div className="lr4c-col">
        {/* ── the dateline hero: tonight, and the date it all points at ── */}
        <section ref={sticky.heroRef} aria-label="HP-Coach — nedräkning till provet">
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
          <Ink go={go} delay={0.24}>
            <p className="lr4c-dateline">Högskoleprovet · {PROV_DATE_LABEL}</p>
          </Ink>
          <motion.h1
            className="lr4c-count"
            initial={false}
            animate={{ opacity: go ? 1 : 0, letterSpacing: go ? '-0.02em' : '0.02em' }}
            transition={m.rm ? { duration: 0 } : { ...m.tween(0.6), delay: 0.32 }}
          >
            om {days} dagar
          </motion.h1>
          <Ink go={go} delay={0.56}>
            <p className="lr4c-thesis">
              Varje fel du gör fram till dess kan bli en lektion i din plan.
            </p>
            <p className="lr2-body" style={{ marginTop: 14, maxWidth: '50ch' }}>
              Den här sidan är appen på riktigt: svara på uppgiften nedan, se hur den rättar dig —
              fälla för fälla — och hur felet bokförs i ett schema som slutar på provdagen.
            </p>
            {/* station 1 of the CTA system — the early door */}
            <QuietCta />
          </Ink>
        </section>

        {/* ── the time spine + its stations ── */}
        <div className="lr4c-line">
          <motion.div
            className="lr4c-spine"
            style={{ transformOrigin: 'top center' }}
            initial={false}
            animate={{ scaleY: go ? 1 : 0 }}
            transition={m.rm ? { duration: 0 } : { ...m.tween(1.05), delay: 0.45 }}
            aria-hidden
          />

          <Ink go={go} delay={0.7}>
            <Station tag="Ikväll" sub="uppgift 1 · ORD">
              <QuestionStation q={Q1_ORD} hero onGraded={book} />
              <div className="lr2-note" style={{ marginTop: 30 }}>
                <div className="lr2-note-l">{COPY.claims.zero.label}</div>
                <p className="lr2-note-t">{COPY.claims.zero.text}</p>
              </div>
            </Station>
          </Ink>

          <Station tag="I morgon" sub="uppgift 2 · KVA">
            <QuestionStation q={Q2_KVA} onGraded={book} />
            <div className="lr2-note" style={{ marginTop: 30 }}>
              <div className="lr2-note-l">{COPY.claims.adhd.label}</div>
              <p className="lr2-note-t">{COPY.claims.adhd.text}</p>
            </div>
          </Station>

          <Station tag="Om tre dagar" sub="uppgift 3 · MEK">
            <QuestionStation q={Q3_MEK} onGraded={book} />
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
            <p className="lr4c-scene">
              Klockan 09:10 öppnas häftet. Syskonorden ser likadana ut som ikväll — men den här
              gången är det du som känner igen dem först.
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

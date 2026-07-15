// KlartBakeoff — the "Klart." payoff bake-off (W2). Three signature
// concepts for the ONE ritual moment the motion system allows: the end
// of a session. The A2 Arket laws stand everywhere else (durations
// disciplined, nothing loops, ink dries in place) — this beat has
// earned the right to breathe past 400 ms, ONCE per arrival.
//
//   K1 "Djuptrycket"  — the PRESS. Klart. is struck into the sheet so
//                        hard the page itself reacts: a one-shot 2 px
//                        pressure wave travels down the rules and rows,
//                        inking them to full as it passes. Finality.
//   K2 "Andningen"    — the EXHALE. Nothing strikes; the drill's
//                        compressed reading window releases. The fold
//                        lifts, the page's own spacing breathes open on
//                        one long soft spring, Klart. surfaces slowly
//                        through the paper. Relief.
//   K3 "Räkenskapen"  — the TALLY. The score is EARNED in front of
//                        you: one mark per question inked at counting-
//                        house cadence, the sum-rule draws itself, and
//                        Klart. dries beneath the settled total.
//                        Accumulation.
//   KH "Hybriden"     — owner verdict on the round: K1's motion +
//                        K3's bottom. ONE ceremony: the strike launches
//                        the wave, and the wave DOES the bookkeeping —
//                        it slows to counting cadence over the ledger,
//                        each row it inks is a counted mark, the summa
//                        rides beneath it, and the bookkeeper's rule +
//                        total settle when the wave runs out.
//
// Shared law: the payoff must not read as a reward withheld when you
// missed some — every concept performs the identical ritual for a
// clean run and a 7-av-10 run (toggle on each stage). ✗ ink is --bad,
// struck/counted/breathed with the same weight as ✓. Reduced motion
// collapses every concept to opacity-or-nothing. Accent pixels only
// where they already live (the repetition numeral).
//
// DESIGN artifact: fixtures + the /dev/motion-bakeoff chips only.

import { motion, useReducedMotion } from 'motion/react'
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { EASE, KLART, KLART_SATS, KLART_SLAG, khRowDelay, useMountGo } from '@/lib/motion'

/* ── concept-local springs (bake-off scope; graduate to lib/motion on
      a win) ─────────────────────────────────────────────────────────

   slag    k380 c26 m1.4  — K1's strike: heavy platen, one small
                            recoil, settles ~600 ms.
   andning k52  c15 m1.5  — K2's release: under-damped just enough to
                            read as a chest falling, settles ~1.2 s.
   sats    k480 c40 m0.8  — K3's Klart. seating under the total (the
                            Arket veck numbers — the tally ends in the
                            house physics on purpose).                */

// slag/sats graduated to lib/motion (KLART_SLAG / KLART_SATS) on the KH
// win; aliased so K1 / K3 / KH read identically. andning stays local —
// K2 lost the round, its spring never left the fixture.
const SLAG = KLART_SLAG
const ANDNING = { type: 'spring', stiffness: 52, damping: 15, mass: 1.5 } as const
const SATS = KLART_SATS

/* ── shared type shorthands ──────────────────────────────────────── */

const eyebrow: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

const monoSmall: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.08em',
  color: 'var(--muted)',
  fontVariantNumeric: 'tabular-nums',
}

const displayHero: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontStyle: 'italic',
  fontWeight: 600,
  fontSize: 58,
  lineHeight: 1,
  letterSpacing: '-0.02em',
  color: 'var(--ink)',
  margin: 0,
}

/* ── fixture: a real ORD pass, two runs ──────────────────────────── */

type Row = { word: string; ok: boolean; picked: string; answer: string }

const WORDS = [
  { word: 'begrunda', answer: 'b' },
  { word: 'vedermöda', answer: 'b' },
  { word: 'obsolet', answer: 'a' },
  { word: 'gagna', answer: 'd' },
  { word: 'dryfta', answer: 'c' },
  { word: 'försyn', answer: 'a' },
  { word: 'vederlägga', answer: 'e' },
  { word: 'snöpligt', answer: 'c' },
  { word: 'betänklig', answer: 'b' },
  { word: 'oförvägen', answer: 'd' },
] as const

/** In the missar run, these indices were answered wrong (with what). */
const MISSES: Record<number, string> = { 2: 'e', 5: 'd', 8: 'a' }

type RunKind = 'ren' | 'missar'

type RunFx = {
  rows: Row[]
  correct: number
  total: number
  /** This pass on the 0–2 scale, sv-formatted. */
  pass: string
  /** Pass − prognos, signed sv string, or null when it rounds away. */
  delta: string | null
  deltaPositive: boolean
  prognos: string
  toRep: number
  codaLine: string
}

function buildRun(kind: RunKind): RunFx {
  const rows: Row[] = WORDS.map(({ word, answer }, i) => {
    const miss = kind === 'missar' ? MISSES[i] : undefined
    return { word, ok: miss === undefined, picked: miss ?? answer, answer }
  })
  const correct = rows.filter((r) => r.ok).length
  const clean = kind === 'ren'
  return {
    rows,
    correct,
    total: rows.length,
    pass: clean ? '2,00' : '1,40',
    delta: clean ? '+0,53' : '−0,07',
    deltaPositive: clean,
    prognos: '1,47',
    toRep: clean ? 0 : 3,
    codaLine: clean
      ? 'Inga missar — inget att repetera. Snyggt.'
      : 'Att repetera: 3 frågor — dina nya missar ligger först i morgondagens plan.',
  }
}

const RUNS: Record<RunKind, RunFx> = { ren: buildRun('ren'), missar: buildRun('missar') }

/* ── stage shell: run toggle + replay ────────────────────────────── */

function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '5px 12px',
        borderRadius: 999,
        border: `1px solid ${active ? 'var(--ink)' : 'var(--hairline)'}`,
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--bg)' : 'var(--ink-2)',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function Stage({
  code,
  title,
  thesis,
  children,
}: {
  code: string
  title: string
  thesis: string
  children: (fx: RunFx, playKey: number) => ReactNode
}) {
  const [run, setRun] = useState<RunKind>('missar')
  const [playKey, setPlayKey] = useState(0)
  return (
    <section style={{ maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ margin: '4px 0 14px' }}>
        <div style={{ ...eyebrow, marginBottom: 8 }}>
          {code} · signaturen · ett andetag, en gång
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 26,
            letterSpacing: '-0.01em',
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: 'var(--ink-2)',
            maxWidth: '72ch',
            margin: '8px 0 0',
          }}
        >
          {thesis}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
          <Chip
            label="Ren körning · 10 av 10"
            active={run === 'ren'}
            onClick={() => {
              setRun('ren')
              setPlayKey((k) => k + 1)
            }}
          />
          <Chip
            label="Med missar · 7 av 10"
            active={run === 'missar'}
            onClick={() => {
              setRun('missar')
              setPlayKey((k) => k + 1)
            }}
          />
          <span style={{ width: 10 }} />
          <Chip label="Spela igen" onClick={() => setPlayKey((k) => k + 1)} />
        </div>
      </header>
      <div
        data-testid={`klart-stage-${code.toLowerCase()}`}
        style={{
          border: '1px solid var(--hairline)',
          background: 'var(--panel)',
          padding: '34px 38px 30px',
          minHeight: 560,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children(RUNS[run], playKey)}
      </div>
    </section>
  )
}

/* ── shared result furniture (static markup; concepts animate it) ── */

function StatBlock({ n, l, accent }: { n: string; l: string; accent?: boolean }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 30,
          letterSpacing: '-0.01em',
          color: accent ? 'var(--accent)' : 'var(--ink)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.1,
        }}
      >
        {n}
      </div>
      <div style={{ ...monoSmall, textTransform: 'uppercase', marginTop: 3 }}>{l}</div>
    </div>
  )
}

function FacitLine({ row, index }: { row: Row; index: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '20px 26px minmax(0,1fr) auto',
        gap: 12,
        alignItems: 'baseline',
        padding: '8px 0',
        borderBottom: '1px solid var(--hairline-2)',
      }}
    >
      <span
        aria-hidden
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 700,
          color: row.ok ? 'var(--ok)' : 'var(--bad)',
        }}
      >
        {row.ok ? '✓' : '✗'}
      </span>
      <span style={{ ...monoSmall, color: 'var(--muted)' }}>{index + 1}.</span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14.5,
          color: row.ok ? 'var(--ink-2)' : 'var(--ink)',
        }}
      >
        {row.word}
      </span>
      <span style={{ ...monoSmall, color: row.ok ? 'var(--muted)' : 'var(--bad)' }}>
        {row.ok ? `${row.answer})` : `ditt ${row.picked}) · rätt ${row.answer})`}
      </span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   K1 · DJUPTRYCKET — the press
   ═══════════════════════════════════════════════════════════════════

   The page is already typeset at low ink — the session's facts exist
   before the ritual acknowledges them. A beat of stillness (260 ms),
   then Klart. is STRUCK into the sheet: the system's one permitted
   z-moment (scale 1.14→1 on the slag spring, ink slapped on in 70 ms).
   The page RECEIVES the blow: a single pressure wave rolls down the
   sheet at 50 ms per element — each rule and row displaces 2 px and
   takes full ink as the wave passes. One strike, one wave, done in
   ~1.1 s. A ✗ row is struck exactly as hard as a ✓ row: the press
   certifies the work, not the outcome.                              */

const K1_STRIKE = 0.26 // s of stillness before the platen falls
const K1_WAVE_LEAD = 0.12 // wave leaves the strike point after this
const K1_WAVE_STEP = 0.05 // s per element as the wave rolls down

/** State-driven mount flag that survives RouteScene's mount suppression
 *  (graduated to lib/motion as `useMountGo`; see the law there). */
const useGo = useMountGo

/** An element the pressure wave passes through: pre-set at low ink,
 *  displaced 2 px and inked to full when its turn comes. */
function K1Wave({
  order,
  rm,
  go,
  children,
  style,
}: {
  order: number
  rm: boolean
  go: boolean
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <motion.div
      initial={false}
      animate={go ? { opacity: 1, y: rm ? 0 : [0, 2, 0] } : { opacity: rm ? 1 : 0.18, y: 0 }}
      transition={
        rm
          ? { duration: 0 }
          : {
              delay: go ? K1_STRIKE + K1_WAVE_LEAD + order * K1_WAVE_STEP : 0,
              duration: go ? 0.3 : 0,
              ease: [...EASE.reading],
            }
      }
      style={style}
    >
      {children}
    </motion.div>
  )
}

function K1Content({ fx, rm }: { fx: RunFx; rm: boolean }) {
  const go = useGo(rm)
  return (
    <div>
      <K1Wave order={0} rm={rm} go={go}>
        <div style={eyebrow}>ORD · pass slut</div>
      </K1Wave>
      <motion.h1
        initial={false}
        animate={go ? { opacity: 1, scale: 1 } : { opacity: 0, scale: rm ? 1 : 1.14 }}
        transition={
          rm || !go
            ? { duration: 0 }
            : {
                opacity: { delay: K1_STRIKE, duration: 0.07, ease: [...EASE.exit] },
                scale: { delay: K1_STRIKE, ...SLAG },
              }
        }
        style={{ ...displayHero, margin: '10px 0 0', transformOrigin: '0% 80%' }}
      >
        Klart.
      </motion.h1>
      <K1Wave order={1} rm={rm} go={go} style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', gap: 44 }}>
          <StatBlock n={`${fx.correct} av ${fx.total}`} l="rätt" />
          <StatBlock n={fx.pass} l="detta pass" />
          <StatBlock n={fx.prognos} l="ORD-prognos" />
          {fx.toRep > 0 && <StatBlock n={String(fx.toRep)} l="till repetition" accent />}
        </div>
      </K1Wave>
      <K1Wave order={2} rm={rm} go={go} style={{ margin: '24px 0 0' }}>
        <div style={{ height: 1, background: 'var(--ink)' }} />
      </K1Wave>
      <div style={{ marginTop: 6 }}>
        {fx.rows.map((row, i) => (
          <K1Wave key={row.word} order={3 + i} rm={rm} go={go}>
            <FacitLine row={row} index={i} />
          </K1Wave>
        ))}
      </div>
      <K1Wave order={3 + fx.rows.length} rm={rm} go={go} style={{ marginTop: 18 }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 15,
            lineHeight: 1.55,
            color: 'var(--ink-2)',
            margin: 0,
            maxWidth: '60ch',
          }}
        >
          {fx.codaLine}
        </p>
      </K1Wave>
    </div>
  )
}

export function KLART1() {
  const rm = useReducedMotion() === true
  return (
    <Stage
      code="K1"
      title="Djuptrycket — pressen"
      thesis="Finalitet. Sidan är redan satt i svagt bläck — passets fakta finns innan ritualen erkänner dem. Efter ett ögonblicks stillhet slås Klart. ner i arket (slag k380 c26 m1,4 — systemets enda z-ögonblick), och papperet KÄNNER slaget: en engångsvåg på 2 px rullar nedför linjerna och raderna och trycker dem till fullt bläck. En miss slås lika hårt som en träff — pressen intygar arbetet, inte utfallet."
    >
      {(fx, playKey) => <K1Content key={`${playKey}`} fx={fx} rm={rm} />}
    </Stage>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   K2 · ANDNINGEN — the exhale
   ═══════════════════════════════════════════════════════════════════

   Relief, not fanfare. A drill is a held breath: the reading window
   compressed, the fold gradient pressing down. When the session ends,
   nothing strikes — the page RELEASES. The fold lifts (1.1 s), the
   page's own spacing breathes open on one long soft spring (andning
   k52 c15 m1,5 — a chest falling), and Klart. surfaces through the
   paper over 1.3 s, the slowest ink the system ever dries. Stats
   arrive on breath cadence afterwards. The exhale is unconditional:
   7 av 10 releases exactly like 10 av 10 — the session is over, and
   that is the reward.                                               */

const K2_RELEASE_MS = 240 // held-breath beat before the release
const K2_KLART_DUR = 1.3 // s — the one long surface
const K2_BREATH = [0.55, 0.85, 1.15] // s — stat dry-in cadence

function K2Content({ fx, rm }: { fx: RunFx; rm: boolean }) {
  const go = useGo(rm)
  const [open, setOpen] = useState(rm)
  useEffect(() => {
    if (rm) return
    const t = setTimeout(() => setOpen(true), K2_RELEASE_MS)
    return () => clearTimeout(t)
  }, [rm])
  const spring = rm ? { duration: 0 } : ANDNING
  const tork = (delay: number, dur = 0.4) =>
    rm || !go ? { duration: 0 } : { delay, duration: dur, ease: [...EASE.reading] as const }
  const inked = (o = 1) => ({ opacity: go ? o : 0 })
  return (
    <div style={{ position: 'relative' }}>
      {/* the fold — the drill's compressed reading edge, lifting */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ opacity: rm || go ? 0 : 1 }}
        transition={rm || !go ? { duration: 0 } : { duration: 1.1, ease: [...EASE.reading] }}
        style={{
          position: 'absolute',
          left: -38,
          right: -38,
          top: -34,
          height: 120,
          background: 'linear-gradient(to bottom, var(--bg), transparent)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <motion.div layout transition={spring} style={{ paddingTop: open ? 26 : 0 }}>
        <div style={eyebrow}>ORD · pass slut</div>
      </motion.div>
      <motion.div layout transition={spring} style={{ marginTop: open ? 18 : 6 }}>
        <motion.h1
          initial={false}
          animate={inked()}
          transition={
            rm || !go ? { duration: 0 } : { duration: K2_KLART_DUR, ease: [...EASE.reading] }
          }
          style={displayHero}
        >
          Klart.
        </motion.h1>
      </motion.div>
      <motion.div layout transition={spring} style={{ marginTop: open ? 30 : 12 }}>
        <div style={{ display: 'flex', gap: 44 }}>
          {[
            { n: `${fx.correct} av ${fx.total}`, l: 'rätt' },
            { n: fx.pass, l: 'detta pass' },
            { n: fx.prognos, l: 'ORD-prognos' },
          ].map((s, i) => (
            <motion.div key={s.l} initial={false} animate={inked()} transition={tork(K2_BREATH[i])}>
              <StatBlock n={s.n} l={s.l} />
            </motion.div>
          ))}
          {fx.toRep > 0 && (
            <motion.div initial={false} animate={inked()} transition={tork(K2_BREATH[2] + 0.25)}>
              <StatBlock n={String(fx.toRep)} l="till repetition" accent />
            </motion.div>
          )}
        </div>
      </motion.div>
      <motion.div layout transition={spring} style={{ marginTop: open ? 32 : 14 }}>
        <motion.div
          initial={false}
          animate={inked()}
          transition={tork(1.0)}
          style={{ height: 1, background: 'var(--hairline)' }}
        />
      </motion.div>
      <div>
        {fx.rows.map((row, i) => (
          <motion.div key={row.word} layout transition={spring}>
            <motion.div initial={false} animate={inked()} transition={tork(1.15 + i * 0.05, 0.35)}>
              <FacitLine row={row} index={i} />
            </motion.div>
          </motion.div>
        ))}
      </div>
      <motion.div layout transition={spring} style={{ marginTop: open ? 26 : 10 }}>
        <motion.p
          initial={false}
          animate={inked()}
          transition={tork(1.7, 0.5)}
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 15,
            lineHeight: 1.55,
            color: 'var(--ink-2)',
            margin: 0,
            maxWidth: '60ch',
          }}
        >
          {fx.codaLine} Andas ut — passet är fört till boken.
        </motion.p>
      </motion.div>
    </div>
  )
}

export function KLART2() {
  const rm = useReducedMotion() === true
  return (
    <Stage
      code="K2"
      title="Andningen — utandningen"
      thesis="Lättnad, inte fanfar. Ett pass är en hållen andning: läsfönstret pressat, vecket tungt över texten. När passet tar slut slår ingenting — sidan SLÄPPER. Vecket lyfter, sidans egna mellanrum andas upp på en enda lång mjuk fjäder (andning k52 c15 m1,5), och Klart. stiger genom papperet under 1,3 s — det långsammaste bläck systemet någonsin torkar. Utandningen är ovillkorlig: 7 av 10 släpper precis som 10 av 10."
    >
      {(fx, playKey) => <K2Content key={`${playKey}`} fx={fx} rm={rm} />}
    </Stage>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   K3 · RÄKENSKAPEN — the tally
   ═══════════════════════════════════════════════════════════════════

   The score is EARNED in front of you. No number is announced; it is
   counted out — one tally mark per question inked at counting-house
   cadence (90 ms) while the sum rolls upward in the same hand. When
   the last mark lands the sum-rule draws itself under the column
   (scaleX, origin left — the bookkeeper's line), and only then does
   Klart. seat beneath the settled total, in the house veck physics.
   A ✗ is a mark counted with the same hand as a ✓ — the ledger is
   honest and the ritual identical at 7 av 10.                       */

const K3_TICK_MS = 90 // per tally mark
const K3_RULE_DELAY_MS = 200 // after the last mark, before the rule
const K3_KLART_DELAY_MS = 480 // after the last mark, before Klart.

function K3Content({ fx, rm }: { fx: RunFx; rm: boolean }) {
  const [step, setStep] = useState(rm ? fx.total : 0)
  const [phase, setPhase] = useState<'counting' | 'rule' | 'klart'>(rm ? 'klart' : 'counting')
  const timers = useRef<number[]>([])
  useEffect(() => {
    if (rm) return
    for (let i = 1; i <= fx.total; i++) {
      timers.current.push(window.setTimeout(() => setStep(i), i * K3_TICK_MS))
    }
    timers.current.push(
      window.setTimeout(() => setPhase('rule'), fx.total * K3_TICK_MS + K3_RULE_DELAY_MS),
    )
    timers.current.push(
      window.setTimeout(() => setPhase('klart'), fx.total * K3_TICK_MS + K3_KLART_DELAY_MS),
    )
    return () => {
      for (const t of timers.current) clearTimeout(t)
      timers.current = []
    }
  }, [rm, fx.total])
  const counted = fx.rows.slice(0, step)
  const rightSoFar = counted.filter((r) => r.ok).length
  const settled = phase === 'klart'
  return (
    <div>
      <div style={eyebrow}>ORD · räkenskap över passet</div>
      {/* the tally column — one line per question, inked in cadence */}
      <div style={{ marginTop: 18, minHeight: 290 }}>
        {fx.rows.map((row, i) => (
          <motion.div
            key={row.word}
            initial={false}
            animate={{ opacity: i < step ? 1 : 0 }}
            transition={rm ? { duration: 0.01 } : { duration: 0.12, ease: [...EASE.reading] }}
          >
            <FacitLine row={row} index={i} />
          </motion.div>
        ))}
      </div>
      {/* the running sum — same hand, rolls as the marks land */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginTop: 12,
        }}
      >
        <span style={{ ...monoSmall, textTransform: 'uppercase' }}>summa</span>
        <span
          data-testid="k3-sum"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 26,
            color: 'var(--ink)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {rightSoFar} av {step > 0 ? step : '—'}
        </span>
      </div>
      {/* the bookkeeper's line — draws only when the count is done */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ scaleX: phase === 'counting' && !rm ? 0 : 1 }}
        transition={rm ? { duration: 0.01 } : { duration: 0.32, ease: [...EASE.reading] }}
        style={{ height: 2, background: 'var(--ink)', transformOrigin: '0% 50%', marginTop: 8 }}
      />
      {/* Klart. seats beneath the settled total, house physics */}
      <motion.div
        initial={false}
        animate={settled ? { opacity: 1, scale: 1 } : { opacity: 0, scale: rm ? 1 : 0.96 }}
        transition={rm ? { duration: 0.01 } : { opacity: { duration: 0.24 }, scale: SATS }}
        style={{ marginTop: 22, transformOrigin: '0% 100%' }}
      >
        <h1 style={{ ...displayHero, fontSize: 48 }}>Klart.</h1>
        <div style={{ display: 'flex', gap: 40, marginTop: 18 }}>
          <StatBlock n={fx.pass} l="detta pass" />
          <StatBlock n={fx.prognos} l="ORD-prognos" />
          {fx.toRep > 0 && <StatBlock n={String(fx.toRep)} l="till repetition" accent />}
        </div>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 15,
            lineHeight: 1.55,
            color: 'var(--ink-2)',
            margin: '16px 0 0',
            maxWidth: '60ch',
          }}
        >
          {fx.codaLine}
        </p>
      </motion.div>
    </div>
  )
}

export function KLART3() {
  const rm = useReducedMotion() === true
  return (
    <Stage
      code="K3"
      title="Räkenskapen — uppräkningen"
      thesis="Summan förtjänas framför ögonen. Inget tal utropas; det räknas fram — ett bokfört märke per fråga i räknekammarens kadens (90 ms) medan summan rullar i samma hand. När sista märket landar drar sig summeringslinjen (scaleX, origo vänster), och först då sätter sig Klart. under den färdiga summan, i husets veck-fysik. Ett ✗ bokförs med samma hand som ett ✓ — räkenskapen är ärlig och ritualen identisk vid 7 av 10."
    >
      {(fx, playKey) => <K3Content key={`${playKey}`} fx={fx} rm={rm} />}
    </Stage>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   KH · HYBRIDEN — the press that keeps the books
   ═══════════════════════════════════════════════════════════════════

   Owner verdict on the round: K1's motion + K3's bottom (the sum).
   Composition decision: the count RIDES the wave — one impulse, one
   consequence chain. Klart. is struck at the top (K1's slag, the
   system's one z-moment) into a page pre-set at faint ink. The strike
   launches K1's pressure wave, and the wave IS the bookkeeping hand:
   above the ledger it rolls at K1's 50 ms/element, but over the facit
   column it slows to K3's 90 ms counting-house cadence — each row it
   displaces and inks to full is a counted mark, and the live summa
   ("N av M") beneath the column advances in lockstep with the wave's
   passage. When the wave inks the last row the bookkeeper's rule
   draws under the total (scaleX, origin left), and the pass stats +
   coda seat on the house SATS spring — the ceremony ends by handing
   control back to the Arket physics, exactly as K3 did.

   Rejected composition: strike lands, then a separate tally counts
   beneath it. That is two hands — a press AND a bookkeeper — i.e.
   two ceremonies glued at the waist. Here every millisecond after
   the strike is consequence of the strike (K1's ADHD-safe causality
   law), and the duration over the ledger is literal (K3's honesty
   law: the time is the session being counted, one question a tick).

   Misses: the wave strikes a ✗ row at the same 2 px amplitude as a
   ✓ row and the same hand counts it. Identical ceremony at 7 av 10. */

// Graduated to lib/motion (the KLART timeline + khRowDelay) on the KH
// win; aliased so the chip below reads identically to the fixture.
const KH_STRIKE = KLART.strike // s of stillness before the platen falls (K1)
const KH_WAVE_LEAD = KLART.waveLead // wave leaves the strike point after this (K1)
const KH_HEAD_STEP = KLART.headStep // s per element above the ledger (K1 pace)
const KH_RULE_DELAY = KLART.ruleDelay // after the last mark, before the sum-rule (K3)
const KH_SETTLE_DELAY = KLART.settleDelay // after the last mark, before stats seat (K3)

function KHContent({ fx, rm }: { fx: RunFx; rm: boolean }) {
  const go = useGo(rm)
  // The tally rides the wave: step i flips exactly when the wave inks
  // row i — same clock, one hand. Phase advances when the wave runs out.
  const [step, setStep] = useState(rm ? fx.total : 0)
  const [phase, setPhase] = useState<'wave' | 'rule' | 'settle'>(rm ? 'settle' : 'wave')
  const timers = useRef<number[]>([])
  useEffect(() => {
    if (rm || !go) return
    for (let i = 0; i < fx.total; i++) {
      timers.current.push(window.setTimeout(() => setStep(i + 1), khRowDelay(i) * 1000))
    }
    const lastMark = khRowDelay(fx.total - 1)
    timers.current.push(
      window.setTimeout(() => setPhase('rule'), (lastMark + KH_RULE_DELAY) * 1000),
    )
    timers.current.push(
      window.setTimeout(() => setPhase('settle'), (lastMark + KH_SETTLE_DELAY) * 1000),
    )
    return () => {
      for (const t of timers.current) clearTimeout(t)
      timers.current = []
    }
  }, [rm, go, fx.total])
  const rightSoFar = fx.rows.slice(0, step).filter((r) => r.ok).length
  const settled = phase === 'settle'
  /** A K1 wave element with an absolute delay (so the ledger can run
   *  on tick cadence while the head runs on head cadence). */
  const wave = (delay: number, children: ReactNode, style?: CSSProperties) => (
    <motion.div
      initial={false}
      animate={go ? { opacity: 1, y: rm ? 0 : [0, 2, 0] } : { opacity: rm ? 1 : 0.18, y: 0 }}
      transition={
        rm
          ? { duration: 0 }
          : { delay: go ? delay : 0, duration: go ? 0.3 : 0, ease: [...EASE.reading] }
      }
      style={style}
    >
      {children}
    </motion.div>
  )
  return (
    <div>
      {wave(KH_STRIKE + KH_WAVE_LEAD - 0.05, <div style={eyebrow}>ORD · pass slut</div>)}
      {/* K1's strike — the ceremony's one impulse */}
      <motion.h1
        initial={false}
        animate={go ? { opacity: 1, scale: 1 } : { opacity: 0, scale: rm ? 1 : 1.14 }}
        transition={
          rm || !go
            ? { duration: 0 }
            : {
                opacity: { delay: KH_STRIKE, duration: 0.07, ease: [...EASE.exit] },
                scale: { delay: KH_STRIKE, ...SLAG },
              }
        }
        style={{ ...displayHero, margin: '10px 0 0', transformOrigin: '0% 80%' }}
      >
        Klart.
      </motion.h1>
      {/* the wave leaves the strike point at K1 pace… */}
      {wave(KH_STRIKE + KH_WAVE_LEAD, <div style={{ height: 1, background: 'var(--ink)' }} />, {
        margin: '22px 0 0',
      })}
      {wave(
        KH_STRIKE + KH_WAVE_LEAD + KH_HEAD_STEP,
        <div style={{ padding: '10px 0 2px' }}>
          <span style={{ ...monoSmall, textTransform: 'uppercase' }}>
            facit · {fx.total} frågor
          </span>
        </div>,
      )}
      {/* …and slows to counting cadence over the ledger: each row it
          inks is a counted mark */}
      <div>
        {fx.rows.map((row, i) => (
          <div key={row.word}>{wave(khRowDelay(i), <FacitLine row={row} index={i} />)}</div>
        ))}
      </div>
      {/* K3's bottom — the summa the wave has been writing */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginTop: 12,
        }}
      >
        <motion.span
          initial={false}
          animate={{ opacity: rm || step > 0 ? 1 : 0.18 }}
          transition={rm ? { duration: 0 } : { duration: 0.2, ease: [...EASE.reading] }}
          style={{ ...monoSmall, textTransform: 'uppercase' }}
        >
          summa
        </motion.span>
        <motion.span
          data-testid="kh-sum"
          initial={false}
          animate={{ opacity: rm || step > 0 ? 1 : 0.18 }}
          transition={rm ? { duration: 0 } : { duration: 0.2, ease: [...EASE.reading] }}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 26,
            color: 'var(--ink)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {rightSoFar} av {step > 0 ? step : '—'}
        </motion.span>
      </div>
      {/* the bookkeeper's rule — draws when the wave runs out */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ scaleX: phase === 'wave' && !rm ? 0 : 1 }}
        transition={rm ? { duration: 0.01 } : { duration: 0.32, ease: [...EASE.reading] }}
        style={{ height: 2, background: 'var(--ink)', transformOrigin: '0% 50%', marginTop: 8 }}
      />
      {/* the settled total — house physics close the ceremony */}
      <motion.div
        initial={false}
        animate={settled ? { opacity: 1, scale: 1 } : { opacity: 0, scale: rm ? 1 : 0.96 }}
        transition={rm ? { duration: 0.01 } : { opacity: { duration: 0.24 }, scale: SATS }}
        style={{ marginTop: 20, transformOrigin: '0% 0%' }}
      >
        <div style={{ display: 'flex', gap: 40 }}>
          <StatBlock n={fx.pass} l="detta pass" />
          <StatBlock n={fx.prognos} l="ORD-prognos" />
          {fx.toRep > 0 && <StatBlock n={String(fx.toRep)} l="till repetition" accent />}
        </div>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 15,
            lineHeight: 1.55,
            color: 'var(--ink-2)',
            margin: '16px 0 0',
            maxWidth: '60ch',
          }}
        >
          {fx.codaLine}
        </p>
      </motion.div>
    </div>
  )
}

export function KLARTH() {
  const rm = useReducedMotion() === true
  return (
    <Stage
      code="KH"
      title="Hybriden — pressen som för boken"
      thesis="K1:s rörelse, K3:s botten — som EN ceremoni. Klart. slås ner i arket (slag k380 c26 m1,4 — systemets enda z-ögonblick) på en sida som redan är satt i svagt bläck, och slaget släpper K1:s tryckvåg. Men vågen ÄR bokföringshanden: över facitkolumnen saktar den till räknekammarens kadens (90 ms per rad), varje rad den trycker till fullt bläck är ett bokfört märke, och summan därunder rullar i takt med vågens gång. När sista raden är tryckt drar sig summeringslinjen och passets siffror sätter sig i husets veck-fysik. Ett ✗ trycks och bokförs med samma hand som ett ✓."
    >
      {(fx, playKey) => <KHContent key={`${playKey}`} fx={fx} rm={rm} />}
    </Stage>
  )
}

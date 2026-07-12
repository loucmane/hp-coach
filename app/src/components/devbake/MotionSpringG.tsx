// MotionSpringG — round 3 of the motion bake-off, the ENERGY axis.
// Two spring systems at opposite ends of where 2026-classy lives:
//
//   MOTF3 "Partituret" — classy as ORCHESTRATION. One scene change =
//     one conducted phrase. Elements carry voice roles: the LEDARE
//     (downbeat — heavy spring, lands first), the STÄMMOR (followers
//     on a compressing accelerando fan: 100 → 65 → 50 → 38 ms gaps),
//     the KODA (soft, last). Exits are counterpoint: the coda leaves
//     first, the leader leaves LAST — it hands over while the next
//     leader is already entering, so voices cross mid-air. The drill
//     loop is a bar of music: verdict on the downbeat, gloss on beat 2,
//     a deliberate breath (140 ms rest) before the next question's
//     phrase. The regi panel prints each phrase as a score line.
//
//   MOTF4 "Greppet" — classy as TOUCH. The app as instrument: answers
//     commit by dragging a row past a mechanical detent (notch at 72 px,
//     hard stop at 88 px); the release velocity is CAPTURED and injected
//     into the verdict's entrance spring — input energy is never
//     discarded. The Klart. card tosses away along the fling vector
//     with its momentum, and the next scene enters from the OPPOSITE
//     direction (the impulse carries through navigation). Rows have
//     hover/press mass. Click and keyboard commit everywhere — the
//     gesture is the premium path, never the only one.
//
// Same walkable flow as MOTB2 (Hem → Öva → 3 real ORD questions →
// Klart. → Hem), same Boksidan chrome, but the motion languages are
// separate systems — voice-role choreography vs velocity-honest
// physics — not parameter tweaks of Bläcket.
//
// Discipline: motion confirms causality, nothing loops or idles;
// transform/opacity only (+ pathLength on the F4 check); accent only
// where it already lives (active ToC row, due numeral) — motion adds
// no new accent. prefers-reduced-motion (useReducedMotion) collapses
// everything to opacity-or-nothing: no fans, no drag, no impulse.
//
// DESIGN artifact: fixtures only, no routes, no shared-file edits.

import {
  AnimatePresence,
  animate,
  LayoutGroup,
  MotionConfig,
  motion,
  type Transition,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import {
  type CSSProperties,
  createContext,
  type KeyboardEvent,
  type ReactNode,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'

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
  fontSize: 10.5,
  letterSpacing: '0.08em',
  color: 'var(--muted)',
  fontVariantNumeric: 'tabular-nums',
}

const displayHead: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 500,
  letterSpacing: '-0.02em',
  color: 'var(--ink)',
}

/* ── shared fixtures: three real ORD items ───────────────────────── */

type OrdQ = {
  headword: string
  options: readonly [string, string, string, string, string]
  correct: number
  gloss: string
  repetition: boolean
  note: string
}

const QUESTIONS: readonly OrdQ[] = [
  {
    headword: 'begrunda',
    options: ['betvivla', 'överväga', 'förkunna', 'bestrida', 'avfärda'],
    correct: 1,
    gloss: 'att tänka noga igenom — nyckeln är be- + grund: gå till grunden med saken.',
    repetition: false,
    note: 'ny',
  },
  {
    headword: 'vedermöda',
    options: ['belöning', 'prövning', 'ersättning', 'vördnad', 'vedergällning'],
    correct: 1,
    gloss:
      'möda och motgång — veder- förstärker: strävan som prövar. Släkt med vedervärdig, inte med belöning.',
    repetition: false,
    note: 'ny',
  },
  {
    headword: 'obsolet',
    options: ['föråldrad', 'olämplig', 'okänd', 'otydlig', 'överflödig'],
    correct: 0,
    gloss: 'ur bruk, passerad av tiden — latinets obsoletus. Engelskans obsolete är samma ord.',
    repetition: true,
    note: 'repetition · fel 8 juli',
  },
]

const TOC = [
  { id: 'hem', label: 'Hem', folio: 's. 1', enabled: true },
  { id: 'ova', label: 'Öva', folio: 's. 4', enabled: true },
  { id: 'provpass', label: 'Provpass', folio: 's. 9', enabled: false },
  { id: 'uppslag', label: 'Uppslag', folio: 's. 12', enabled: false },
  { id: 'framsteg', label: 'Framsteg', folio: 's. 16', enabled: false },
] as const

const LEDGER = [
  { code: 'ORD', name: 'Ordförståelse', n: '3 väntar' },
  { code: 'LÄS', name: 'Läsförståelse', n: '4 väntar' },
  { code: 'MEK', name: 'Meningskomplettering', n: '2 väntar' },
  { code: 'ELF', name: 'Engelsk läsförståelse', n: '5 väntar' },
] as const

type Scene = 'hem' | 'ova' | 'drill' | 'klart'

/* ── shared regi context: speed, reduced motion, event log ───────────
 *
 * Same honest time-scaling as MOTB2: a spring's period goes as √(m/k)
 * and its decay as c/2m, so stiffness×s² and damping×s replays the
 * exact same curve at 1/s speed. Delays and tween durations divide.
 */

type Regi = {
  s: number
  rm: boolean
  note: (label: string) => void
}

const RegiCtx = createContext<Regi>({ s: 1, rm: false, note: () => {} })

type Bezier = [number, number, number, number]
const EASE_IN_HARD: Bezier = [0.7, 0, 0.84, 0]

/** Masked per-digit roll — direction-aware (up = new debt, down = paid). */
function DigitRoll({ value, spring }: { value: number; spring: Transition }) {
  const { rm } = useContext(RegiCtx)
  const prev = useRef(value)
  const dir = value >= prev.current ? 1 : -1
  if (prev.current !== value) prev.current = value
  const digits = String(value).split('')
  return (
    <span style={{ display: 'inline-flex', overflow: 'hidden', verticalAlign: 'bottom' }}>
      {digits.map((ch, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: digit slots are positional by design
          key={i}
          style={{ display: 'inline-block', position: 'relative', overflow: 'hidden' }}
        >
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.span
              key={ch}
              initial={rm ? { opacity: 0 } : { y: `${dir * 0.95}em`, opacity: 0 }}
              animate={{ y: '0em', opacity: 1 }}
              exit={rm ? { opacity: 0 } : { y: `${dir * -0.95}em`, opacity: 0 }}
              transition={spring}
              style={{ display: 'inline-block' }}
            >
              {ch}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  )
}

/* ── shared chrome: rail + regi panel shell ──────────────────────── */

function Rail({
  scene,
  due,
  go,
  tickId,
  spring,
  rollSpring,
}: {
  scene: Scene
  due: number
  go: (s: Scene) => void
  tickId: string
  spring: Transition
  rollSpring: Transition
}) {
  const { rm } = useContext(RegiCtx)
  const activeId = scene === 'hem' ? 'hem' : 'ova'
  return (
    <nav aria-label="Innehåll (demo)" style={{ width: 178, flexShrink: 0, padding: '26px 18px' }}>
      <div style={{ ...eyebrow, fontSize: 9, marginBottom: 12 }}>Innehåll</div>
      {TOC.map((row) => {
        const active = row.id === activeId
        return (
          <button
            type="button"
            key={row.id}
            disabled={!row.enabled}
            onClick={() => {
              if (!row.enabled || row.id === activeId) return
              go(row.id as Scene)
            }}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              width: '100%',
              height: 36,
              padding: '0 0 0 20px',
              border: 0,
              background: 'transparent',
              textAlign: 'left',
              cursor: row.enabled && !active ? 'pointer' : 'default',
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontVariant: 'all-small-caps',
              letterSpacing: '0.07em',
              fontWeight: active ? 600 : 500,
              color: active ? 'var(--accent)' : row.enabled ? 'var(--ink-2)' : 'var(--muted)',
              opacity: row.enabled ? 1 : 0.55,
              transition: 'color 200ms var(--ease-reading)',
            }}
          >
            {active && (
              <motion.span
                aria-hidden
                layoutId={rm ? undefined : tickId}
                transition={spring}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  marginTop: -1,
                  width: 12,
                  height: 1.6,
                  background: 'var(--ink)',
                }}
              />
            )}
            {row.label}
            {row.id === 'ova' ? (
              <>
                <span
                  aria-hidden
                  style={{
                    flex: 1,
                    borderBottom: '1px dotted var(--muted)',
                    opacity: 0.55,
                    transform: 'translateY(-3px)',
                  }}
                />
                {/* the due folio — the chrome's ONE accent numeral */}
                <span style={{ ...monoSmall, color: 'var(--accent)', lineHeight: 1 }}>
                  <DigitRoll value={due} spring={rollSpring} />
                </span>
              </>
            ) : (
              <>
                <span style={{ flex: 1 }} />
                <span style={{ ...monoSmall, fontSize: 9.5 }}>{row.folio}</span>
              </>
            )}
          </button>
        )
      })}
    </nav>
  )
}

function RegiShell({
  title,
  scene,
  speed,
  setSpeed,
  rm,
  children,
}: {
  title: string
  scene: Scene
  speed: number
  setSpeed: (n: number) => void
  rm: boolean
  children: ReactNode
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 'calc(100% + 14px)',
        bottom: 0,
        width: 262,
        zIndex: 10,
        border: '1px solid var(--hairline)',
        background: 'var(--panel)',
        padding: '10px 12px',
      }}
    >
      <div
        style={{
          ...eyebrow,
          fontSize: 9,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span>Regi · {title}</span>
        <span>{rm ? 'reducerad rörelse: på' : `hastighet ${speed === 1 ? '1' : '0,5'}×`}</span>
      </div>
      <div style={{ ...monoSmall, marginTop: 8, lineHeight: 1.6 }}>
        scen: {scene}
        <br />
        {children}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        {[1, 0.5].map((v) => (
          <button
            type="button"
            key={v}
            onClick={() => setSpeed(v)}
            style={{
              ...monoSmall,
              textTransform: 'uppercase',
              padding: '3px 9px',
              cursor: 'pointer',
              border: `1px solid ${speed === v ? 'var(--ink)' : 'var(--hairline)'}`,
              background: speed === v ? 'var(--ink)' : 'transparent',
              color: speed === v ? 'var(--bg)' : 'var(--ink-2)',
            }}
          >
            {v === 1 ? '1×' : '0,5×'}
          </button>
        ))}
        <span style={{ ...monoSmall, fontSize: 9, alignSelf: 'center' }}>
          k×s² · c×s — samma kurva
        </span>
      </div>
    </div>
  )
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        width: 780,
        maxWidth: '100%',
        minHeight: 520,
        border: '1px solid var(--hairline)',
        background: 'var(--bg)',
      }}
    >
      {children}
    </div>
  )
}

function ConceptHeader({ code, name, thesis }: { code: string; name: string; thesis: string }) {
  return (
    <>
      <h1 style={{ ...displayHead, fontStyle: 'italic', fontSize: 34, margin: 0 }}>
        {code} · {name}
      </h1>
      <p
        style={{
          fontSize: 14,
          color: 'var(--ink-2)',
          maxWidth: '72ch',
          margin: '10px 0 26px',
          lineHeight: 1.55,
        }}
      >
        {thesis}
      </p>
    </>
  )
}

/* ════════════════════════════════════════════════════════════════════
 *  MOTF3 · PARTITURET — the conducted ensemble
 * ════════════════════════════════════════════════════════════════════
 *
 * Voice roles, not per-element delays:
 *   LEDARE  — the downbeat. k=440 c=36 m=1.1: weighty, lands first.
 *   STÄMMA  — followers on a compressing fan (accelerando):
 *             gaps 100 → 65 → 50 → 38 → 30 ms. k=560 c=40 m=0.7.
 *   KODA    — the soft close, always last. k=360 c=42 m=1.
 * Exits are counterpoint: koda leaves first (0 ms), stämmor next,
 * the LEDARE leaves last (+70 ms) — it hands over while the next
 * phrase's leader is already entering. Between drill phrases sits a
 * written-out breath: a 140 ms rest, never dead air by accident.
 */

// accelerando fan: cumulative gaps 100, 65, 50, 38, 30 ms after the leader
const FAN = [0.1, 0.165, 0.215, 0.253, 0.283]
const fan = (i: number) => FAN[Math.min(i, FAN.length - 1)] ?? 0.283
const BREATH = 0.14 // the written rest between drill phrases

function useTakt() {
  const { s, rm, note } = useContext(RegiCtx)
  return useMemo(() => {
    const spring = (stiffness: number, damping: number, mass = 1): Transition =>
      rm
        ? { duration: 0 }
        : { type: 'spring', stiffness: stiffness * s * s, damping: damping * s, mass }
    return {
      s,
      rm,
      note,
      ledare: spring(440, 36, 1.1),
      stamma: spring(560, 40, 0.7),
      koda: spring(360, 42, 1),
      /** counterpoint exit: quick, hard-in */
      ut: (delay = 0): Transition =>
        rm ? { duration: 0 } : { duration: 0.12 / s, ease: EASE_IN_HARD, delay: delay / s },
    }
  }, [s, rm, note])
}

type Roll = 'ledare' | 'stamma' | 'koda'

/** One voice in the phrase. Entrance timing comes from the ROLE, exit
 *  timing from the counterpoint (koda first, ledare last). */
function Voice({
  roll,
  i = 0,
  takt = 0,
  children,
  style,
}: {
  roll: Roll
  i?: number
  takt?: number
  children: ReactNode
  style?: CSSProperties
}) {
  const t = useTakt()
  const { s } = useContext(RegiCtx)
  const entryDelay = roll === 'ledare' ? takt : roll === 'stamma' ? takt + fan(i) : takt + 0.32
  const exitDelay = roll === 'koda' ? 0 : roll === 'stamma' ? 0.024 * (2 - Math.min(i, 2)) : 0.07
  const spring = roll === 'ledare' ? t.ledare : roll === 'stamma' ? t.stamma : t.koda
  const dy = roll === 'ledare' ? 14 : roll === 'stamma' ? 9 : 5
  return (
    <motion.div
      initial={t.rm ? { opacity: 0 } : { opacity: 0, y: dy }}
      animate={{
        opacity: 1,
        y: 0,
        transition: t.rm
          ? { duration: 0 }
          : {
              ...spring,
              opacity: { duration: 0.22 / s, delay: entryDelay / s },
              delay: entryDelay / s,
            },
      }}
      exit={t.rm ? { opacity: 0 } : { opacity: 0, y: -6, transition: t.ut(exitDelay) }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/** Hairline rule drawn as part of the leader's downbeat. */
function TaktLinje({
  delay = 0,
  color = 'var(--hairline)',
  style,
}: {
  delay?: number
  color?: string
  style?: CSSProperties
}) {
  const t = useTakt()
  const { s } = useContext(RegiCtx)
  return (
    <motion.div
      aria-hidden
      initial={t.rm ? { opacity: 0 } : { scaleX: 0 }}
      animate={t.rm ? { opacity: 1 } : { scaleX: 1 }}
      exit={t.rm ? { opacity: 0 } : { opacity: 0, transition: t.ut(0) }}
      transition={
        t.rm ? { duration: 0 } : { duration: 0.34 / s, ease: [0.16, 1, 0.3, 1], delay: delay / s }
      }
      style={{ height: 1, background: color, transformOrigin: 'left center', ...style }}
    />
  )
}

function TaktPress({ label, onClick }: { label: string; onClick: () => void }) {
  const t = useTakt()
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={t.rm ? undefined : { scale: 0.96 }}
      transition={t.stamma}
      style={{
        ...monoSmall,
        textTransform: 'uppercase',
        color: 'var(--ink)',
        background: 'transparent',
        border: '1px solid var(--ink)',
        padding: '6px 14px',
        cursor: 'pointer',
      }}
    >
      {label}
    </motion.button>
  )
}

const PHRASES: Record<string, string> = {
  hem: 'fras hem · ledare 0 · stämmor +100/+165/+215 · koda +320 ms',
  ova: 'fras öva · ledare 0 · stämmor +100/+165/+215/+253 · koda +320 ms',
  drill: 'fras fråga · ledare 0 · stämmor +100…+283 · koda +320 ms',
  klart: 'fras klart · ledare 0 · stämmor +100/+165 · koda +320 ms',
  verdict: 'fras dom · nedslag 0 · gloss +140 · meta +220 · nästa +280 ms',
  next: `växling · koda ut 0 · ledare ut +70 ⟂ ny fras efter andrum ${Math.round(BREATH * 1000)} ms`,
}

function F3SceneHem({ go }: { go: (s: Scene) => void }) {
  const t = useTakt()
  return (
    <div style={{ padding: '26px 30px 24px' }}>
      <Voice roll="ledare">
        <TaktLinje color="var(--ink)" />
        <div style={{ ...eyebrow, marginTop: 14 }}>Lördag 12 juli · 113 dagar kvar</div>
        <h2 style={{ ...displayHead, fontSize: 42, lineHeight: 1.05, margin: '10px 0 0' }}>
          God morgon.
        </h2>
      </Voice>
      <Voice roll="stamma" i={0}>
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.55,
            color: 'var(--ink-2)',
            maxWidth: '46ch',
            margin: '12px 0 0',
          }}
        >
          Dagens pass: ORD — tre frågor, varav en repetition från i onsdags.
        </p>
      </Voice>
      <Voice roll="stamma" i={1}>
        <TaktLinje style={{ margin: '20px 0 0' }} />
        <div style={{ display: 'flex', gap: 40, marginTop: 14 }}>
          {[
            { n: '1,42', l: 'senaste pass' },
            { n: '6', l: 'dagar i rad' },
          ].map((st) => (
            <div key={st.l}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 24,
                  color: 'var(--ink)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {st.n}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{st.l}</div>
            </div>
          ))}
        </div>
      </Voice>
      <Voice roll="stamma" i={2} style={{ marginTop: 24 }}>
        <TaktPress
          label="Öva nu →"
          onClick={() => {
            t.note(PHRASES.ova ?? '')
            go('ova')
          }}
        />
      </Voice>
      <Voice roll="koda" style={{ ...monoSmall, marginTop: 22 }}>
        s. 1 · hem
      </Voice>
    </div>
  )
}

function F3SceneOva({ go, due }: { go: (s: Scene) => void; due: number }) {
  const t = useTakt()
  return (
    <div style={{ padding: '26px 30px 24px' }}>
      <Voice roll="ledare">
        <div style={eyebrow}>Öva · repetera</div>
        <h2 style={{ ...displayHead, fontSize: 36, margin: '8px 0 0' }}>Öva.</h2>
        <p
          style={{ fontSize: 14.5, color: 'var(--ink-2)', margin: '8px 0 14px', maxWidth: '44ch' }}
        >
          {due} att repetera — ORD är varmast, börja där.
        </p>
        <TaktLinje color="var(--ink)" />
      </Voice>
      {LEDGER.map((row, i) => (
        <Voice roll="stamma" i={i} key={row.code}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '11px 0' }}>
            <span style={{ ...monoSmall, color: 'var(--ink-2)', width: 34 }}>{row.code}</span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16.5,
                fontWeight: 500,
                color: 'var(--ink)',
              }}
            >
              {row.name}
            </span>
            <span
              aria-hidden
              style={{
                flex: 1,
                borderBottom: '1px dotted var(--muted)',
                opacity: 0.55,
                transform: 'translateY(-3px)',
                minWidth: 12,
              }}
            />
            <span style={monoSmall}>{row.n}</span>
          </div>
          <TaktLinje color="var(--hairline-2)" />
        </Voice>
      ))}
      <Voice roll="stamma" i={4} style={{ marginTop: 22 }}>
        <TaktPress
          label="Starta ORD · 3 frågor →"
          onClick={() => {
            t.note(PHRASES.drill ?? '')
            go('drill')
          }}
        />
      </Voice>
      <Voice roll="koda" style={{ ...monoSmall, marginTop: 20 }}>
        s. 4 · öva
      </Voice>
    </div>
  )
}

function F3Drill({
  onAnswer,
  onDone,
}: {
  onAnswer: (right: boolean, repetition: boolean) => void
  onDone: (right: number) => void
}) {
  const t = useTakt()
  const { s } = useContext(RegiCtx)
  const [qIndex, setQIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [rightCount, setRightCount] = useState(0)
  const q = QUESTIONS[qIndex] ?? QUESTIONS[0]
  if (!q) return null
  const graded = picked !== null
  const right = picked === q.correct

  const pick = (i: number) => {
    if (graded) return
    setPicked(i)
    const ok = i === q.correct
    if (ok) setRightCount((n) => n + 1)
    t.note(PHRASES.verdict ?? '')
    onAnswer(ok, q.repetition)
  }

  const next = () => {
    if (qIndex >= QUESTIONS.length - 1) {
      t.note(PHRASES.klart ?? '')
      onDone(rightCount)
      return
    }
    t.note(PHRASES.next ?? '')
    setQIndex((n) => n + 1)
    setPicked(null)
  }

  return (
    <div style={{ padding: '26px 30px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={eyebrow}>
          ORD · fråga {qIndex + 1}/{QUESTIONS.length}
        </div>
        <span style={{ ...monoSmall, textTransform: 'uppercase' }}>takt: dom → andrum → fras</span>
      </div>
      <TaktLinje delay={0.04} color="var(--ink)" style={{ margin: '12px 0 0' }} />

      <AnimatePresence mode="popLayout" initial={false}>
        {/* the new question's phrase starts after a written breath (140 ms) */}
        <motion.div key={qIndex} initial={false} animate={{ opacity: 1 }}>
          <Voice roll="ledare" takt={qIndex === 0 ? 0 : BREATH}>
            <div
              style={{ display: 'flex', alignItems: 'baseline', gap: 14, margin: '14px 0 10px' }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontSize: 36,
                  color: 'var(--ink)',
                }}
              >
                {q.headword}
              </div>
              <span style={{ ...monoSmall, textTransform: 'uppercase' }}>{q.note}</span>
            </div>
            <TaktLinje />
          </Voice>
          {q.options.map((opt, i) => {
            const isOk = graded && i === q.correct
            const isBad = graded && i === picked && picked !== q.correct
            const dim = graded && !isOk && !isBad
            return (
              <Voice roll="stamma" i={i} takt={qIndex === 0 ? 0 : BREATH} key={opt}>
                <button
                  type="button"
                  disabled={graded}
                  onClick={() => pick(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    padding: '10px 10px',
                    border: 0,
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: graded ? 'default' : 'pointer',
                  }}
                >
                  <span
                    style={{
                      ...monoSmall,
                      color: isOk ? 'var(--ok)' : isBad ? 'var(--bad)' : 'var(--muted)',
                      transition: 'color 160ms var(--ease-reading)',
                    }}
                  >
                    {String.fromCharCode(97 + i)}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 17,
                      color: isOk
                        ? 'var(--ok)'
                        : isBad
                          ? 'var(--bad)'
                          : dim
                            ? 'var(--muted)'
                            : 'var(--ink)',
                      textDecoration: isBad ? 'line-through' : 'none',
                      textDecorationThickness: isBad ? 1.5 : undefined,
                      transition: 'color 160ms var(--ease-reading)',
                    }}
                  >
                    {opt}
                  </span>
                </button>
                <TaktLinje color="var(--hairline-2)" />
              </Voice>
            )
          })}

          {/* the verdict — its own phrase, beats at 0 / 140 / 220 / 280 ms */}
          <div style={{ minHeight: 108, paddingTop: 14 }}>
            <AnimatePresence mode="popLayout">
              {graded && (
                <motion.div key="verdict" initial={false} animate={{ opacity: 1 }}>
                  <motion.div
                    initial={t.rm ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={t.rm ? { opacity: 0 } : { opacity: 0, y: -6, transition: t.ut(0.05) }}
                    transition={t.ledare}
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontWeight: 600,
                      fontSize: 30,
                      color: right ? 'var(--ok)' : 'var(--bad)',
                    }}
                  >
                    {right ? 'Rätt.' : 'Fel.'}
                  </motion.div>
                  <motion.p
                    initial={t.rm ? { opacity: 0 } : { opacity: 0, y: 7 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: t.rm ? { duration: 0 } : { ...t.stamma, delay: 0.14 / s },
                    }}
                    exit={t.rm ? { opacity: 0 } : { opacity: 0, y: -5, transition: t.ut(0.024) }}
                    style={{
                      fontSize: 14,
                      lineHeight: 1.55,
                      color: 'var(--ink-2)',
                      maxWidth: '52ch',
                      margin: '6px 0 0',
                    }}
                  >
                    <em>{q.options[q.correct]}</em> — {q.gloss}
                  </motion.p>
                  {((!right && !q.repetition) || (right && q.repetition)) && (
                    <motion.div
                      initial={t.rm ? { opacity: 0 } : { opacity: 0, y: 5 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: t.rm ? { duration: 0 } : { ...t.stamma, delay: 0.22 / s },
                      }}
                      exit={t.rm ? { opacity: 0 } : { opacity: 0, transition: t.ut(0) }}
                      style={{ ...monoSmall, marginTop: 8 }}
                    >
                      {right && q.repetition
                        ? 'repetitionen satt — siffran räknades ned'
                        : 'lades i repetitionskön — siffran räknades upp'}
                    </motion.div>
                  )}
                  <motion.div
                    initial={t.rm ? { opacity: 0 } : { opacity: 0, y: 5 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: t.rm ? { duration: 0 } : { ...t.koda, delay: 0.28 / s },
                    }}
                    exit={t.rm ? { opacity: 0 } : { opacity: 0, transition: t.ut(0) }}
                    style={{ marginTop: 14 }}
                  >
                    <TaktPress
                      label={qIndex >= QUESTIONS.length - 1 ? 'Avsluta passet →' : 'Nästa →'}
                      onClick={next}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            {!graded && (
              <Voice roll="koda" takt={qIndex === 0 ? 0 : BREATH} style={monoSmall}>
                välj a–e — domen slår på taktslaget, glossen svarar på nästa
              </Voice>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function F3SceneKlart({
  rightCount,
  due,
  onHome,
}: {
  rightCount: number
  due: number
  onHome: () => void
}) {
  const t = useTakt()
  return (
    <div style={{ padding: '30px 30px 24px', display: 'grid', placeItems: 'center' }}>
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          border: '1px solid var(--hairline)',
          background: 'var(--panel)',
          padding: '26px 28px 22px',
        }}
      >
        <Voice roll="ledare">
          <TaktLinje color="var(--ink)" />
          <div style={{ ...eyebrow, marginTop: 14 }}>ORD · passet är slut</div>
          <h2 style={{ ...displayHead, fontSize: 40, margin: '8px 0 0' }}>Klart.</h2>
        </Voice>
        <Voice roll="stamma" i={0}>
          <p
            style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-2)', margin: '10px 0 0' }}
          >
            {rightCount} av {QUESTIONS.length} rätt. {due} kvar i repetitionskön — nästa pass väntar
            i morgon.
          </p>
        </Voice>
        <Voice roll="stamma" i={1}>
          <TaktLinje style={{ margin: '18px 0 0' }} />
        </Voice>
        <Voice roll="koda" style={{ ...monoSmall, marginTop: 12 }}>
          frasen slutar där den började — hem tar över på nästa taktslag
        </Voice>
      </div>
      <Voice roll="koda" style={{ marginTop: 20 }}>
        <TaktPress
          label="Tillbaka till Hem →"
          onClick={() => {
            t.note(PHRASES.hem ?? '')
            onHome()
          }}
        />
      </Voice>
    </div>
  )
}

function F3Flow() {
  const rm = useReducedMotion() === true
  const [speed, setSpeed] = useState(1)
  const [last, setLast] = useState('—')
  const [scene, setScene] = useState<Scene>('hem')
  const [due, setDue] = useState(14)
  const [drillKey, setDrillKey] = useState(0)
  const [rightCount, setRightCount] = useState(0)

  const regi = useMemo<Regi>(() => ({ s: speed, rm, note: setLast }), [speed, rm])

  const go = (s: Scene) => {
    if (s === 'drill') setDrillKey((k) => k + 1)
    setScene(s)
  }

  return (
    <RegiCtx.Provider value={regi}>
      <MotionConfig reducedMotion="user">
        <LayoutGroup id="f3">
          <Frame>
            <Rail
              scene={scene}
              due={due}
              go={(sc) => {
                setLast(PHRASES[sc] ?? '—')
                go(sc)
              }}
              tickId="f3-tick"
              spring={
                rm
                  ? { duration: 0 }
                  : {
                      type: 'spring',
                      stiffness: 440 * speed * speed,
                      damping: 36 * speed,
                      mass: 1.1,
                    }
              }
              rollSpring={
                rm
                  ? { duration: 0 }
                  : {
                      type: 'spring',
                      stiffness: 560 * speed * speed,
                      damping: 40 * speed,
                      mass: 0.7,
                    }
              }
            />
            <div aria-hidden style={{ width: 1, background: 'var(--hairline)' }} />
            <div style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
              {/* the scene container itself never moves — only the voices do.
                  Counterpoint lives on the children: koda out first, leader
                  out last, next phrase's leader already entering. */}
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={scene === 'drill' ? `drill-${drillKey}` : scene}
                  initial={false}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: rm ? 0 : 1, transition: { duration: rm ? 0 : 0.2 / speed } }}
                >
                  {scene === 'hem' && <F3SceneHem go={go} />}
                  {scene === 'ova' && <F3SceneOva go={go} due={due} />}
                  {scene === 'drill' && (
                    <F3Drill
                      key={drillKey}
                      onAnswer={(right, repetition) => {
                        if (!right && !repetition) setDue((n) => n + 1)
                        if (right && repetition) setDue((n) => n - 1)
                      }}
                      onDone={(r) => {
                        setRightCount(r)
                        go('klart')
                      }}
                    />
                  )}
                  {scene === 'klart' && (
                    <F3SceneKlart rightCount={rightCount} due={due} onHome={() => go('hem')} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <RegiShell title="partituret" scene={scene} speed={speed} setSpeed={setSpeed} rm={rm}>
              röster: ledare k440 c36 m1,1 · stämma k560 c40 m0,7 · koda k360 c42
              <br />
              senast: {last}
            </RegiShell>
          </Frame>
        </LayoutGroup>
      </MotionConfig>
    </RegiCtx.Provider>
  )
}

/** MOTF3 · Partituret — one scene change = one conducted phrase. */
export function MOTF3() {
  return (
    <div style={{ padding: '40px 40px 96px', background: 'var(--panel-2, var(--bg))' }}>
      <ConceptHeader
        code="MOTF3"
        name="Partituret"
        thesis="Klass som orkestrering. Varje scenväxling är EN dirigerad fras: ledaren slår
        taktslaget (tung fjäder, landar först), stämmorna följer i ett accelererande solfjäder
        (100 → 65 → 50 → 38 ms — avstånden krymper när ögat hunnit ställa in sig), kodan sluter
        mjukt. Utgångar är kontrapunkt: kodan går först, ledaren går SIST — den lämnar över medan
        nästa fras ledare redan är på väg in, så rösterna korsar varandra i luften. Drillens loop
        är en takt: dom på nedslaget, gloss på andra slaget, ett utskrivet andrum (140 ms) före
        nästa frågas fras. Regi-panelen skriver varje fras som en partiturrad."
      />
      <F3Flow />
      <div style={{ ...monoSmall, marginTop: 16, maxWidth: '78ch', lineHeight: 1.6 }}>
        ledare k440 c36 m1,1 · stämma k560 c40 m0,7 · koda k360 c42 m1 · utgång 120 ms kontrapunkt
        (koda 0 → ledare +70) · andrum 140 ms. Reducerad rörelse: fraserna faller till ren opacitet,
        inga solfjädrar, inget andrum.
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
 *  MOTF4 · GREPPET — the tactile instrument
 * ════════════════════════════════════════════════════════════════════
 *
 * Physics honesty:
 *   · answers commit by dragging a row past a mechanical detent
 *     (notch 72 px, hard stop 88 px, asymmetric elastic — the wrong
 *     direction refuses).
 *   · the release velocity is captured and INJECTED into the verdict's
 *     entrance spring — your hand's energy becomes the verdict's
 *     arrival speed. Input velocity is never discarded.
 *   · the Klart. card tosses along the fling vector with momentum, and
 *     the next scene enters from the OPPOSITE direction (the impulse
 *     survives navigation).
 *   · click and keyboard commit everywhere — the gesture is the
 *     premium path, never the only one.
 */

const DETENT = 72
const HARDSTOP = 88

function useGrepp() {
  const { s, rm, note } = useContext(RegiCtx)
  return useMemo(() => {
    const spring = (stiffness: number, damping: number, mass = 1): Transition =>
      rm
        ? { duration: 0 }
        : { type: 'spring', stiffness: stiffness * s * s, damping: damping * s, mass }
    return {
      s,
      rm,
      note,
      /** how a released row seats — firm, one settle */
      grepp: spring(620, 42, 0.9),
      /** hover/press mass on desktop */
      massa: spring(700, 35, 0.6),
      /** scene arrival, carries the impulse */
      scen: spring(420, 44, 1),
      /** the toss — loose enough to visibly carry momentum */
      kast: spring(300, 32, 1),
      ut: (delay = 0): Transition =>
        rm ? { duration: 0 } : { duration: 0.14 / s, ease: EASE_IN_HARD, delay: delay / s },
    }
  }, [s, rm, note])
}

function GreppPress({ label, onClick }: { label: string; onClick: () => void }) {
  const g = useGrepp()
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={g.rm ? undefined : { y: -1 }}
      whileTap={g.rm ? undefined : { scale: 0.955, y: 0.5 }}
      transition={g.massa}
      style={{
        ...monoSmall,
        textTransform: 'uppercase',
        color: 'var(--ink)',
        background: 'transparent',
        border: '1px solid var(--ink)',
        padding: '6px 14px',
        cursor: 'pointer',
      }}
    >
      {label}
    </motion.button>
  )
}

function Fade({
  delay = 0,
  children,
  style,
}: {
  delay?: number
  children: ReactNode
  style?: CSSProperties
}) {
  const g = useGrepp()
  const { s } = useContext(RegiCtx)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: g.ut(0) }}
      transition={
        g.rm ? { duration: 0 } : { duration: 0.24 / s, ease: [0.16, 1, 0.3, 1], delay: delay / s }
      }
      style={style}
    >
      {children}
    </motion.div>
  )
}

/** The drawn check on a committed correct row. */
function GreppBock({ velocity = 0 }: { velocity?: number }) {
  const g = useGrepp()
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      role="presentation"
      aria-hidden="true"
      style={{ overflow: 'visible', flexShrink: 0 }}
    >
      <motion.path
        d="M4 13.5 L9.5 18.5 L20.5 5.5"
        stroke="var(--ok)"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={g.rm ? { opacity: 0 } : { pathLength: 0 }}
        animate={g.rm ? { opacity: 1 } : { pathLength: 1 }}
        transition={
          g.rm
            ? { duration: 0 }
            : {
                type: 'spring',
                stiffness: 420 * g.s * g.s,
                damping: 38 * g.s,
                mass: 0.9,
                // the check inherits the hand's speed: px/s → pathLength/s
                velocity: Math.min(Math.abs(velocity) / 900, 2.2),
              }
        }
      />
    </svg>
  )
}

/** One draggable answer row: drag right past the detent to commit.
 *  Click (onTap) and keyboard (Enter/Space) commit with velocity 0. */
function DragRow({
  opt,
  index,
  graded,
  picked,
  correct,
  onCommit,
}: {
  opt: string
  index: number
  graded: boolean
  picked: number | null
  correct: number
  onCommit: (i: number, velocity: number) => void
}) {
  const g = useGrepp()
  const x = useMotionValue(0)
  const [armed, setArmed] = useState(false)
  const isOk = graded && index === correct
  const isBad = graded && index === picked && picked !== correct
  const committed = graded && index === picked
  const dim = graded && !isOk && !isBad
  // the groove only materializes once you actually pull the row — at rest
  // the page is clean print. The tick darkens as the row approaches it.
  const grooveOpacity = useTransform(x, [0, 14], [0, 0.4])
  const tickOpacity = useTransform(x, [0, 14, DETENT * 0.6, DETENT], [0, 0.3, 0.45, 1])

  const commit = (v: number) => {
    if (graded) return
    onCommit(index, v)
  }

  const label = `${String.fromCharCode(97 + index)}. ${opt}`

  return (
    <div style={{ position: 'relative' }}>
      {/* the groove: dotted track to the detent, a tick at the notch */}
      {!g.rm && !graded && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 10,
            top: 0,
            bottom: 1,
            width: HARDSTOP + 8,
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <motion.div
            style={{
              width: DETENT,
              borderBottom: '1px dotted var(--muted)',
              opacity: grooveOpacity,
            }}
          />
          <motion.div
            style={{
              width: 1.6,
              height: 12,
              background: 'var(--ink)',
              opacity: tickOpacity,
            }}
          />
        </div>
      )}
      <motion.div
        role="button"
        tabIndex={graded ? -1 : 0}
        aria-label={g.rm ? label : `${label} — dra förbi hacket eller tryck för att svara`}
        aria-disabled={graded}
        drag={g.rm || graded ? false : 'x'}
        dragConstraints={{ left: 0, right: HARDSTOP }}
        dragElastic={{ left: 0, right: 0.04 }}
        dragMomentum={false}
        style={{ x, position: 'relative', touchAction: 'pan-y', outlineOffset: 2 }}
        onDrag={() => {
          const past = x.get() >= DETENT
          if (past !== armed) {
            setArmed(past)
            if (past) g.note(`hack: ${opt} spänd vid ${DETENT} px — släpp för att svara`)
          }
        }}
        onDragEnd={(_, info) => {
          if (x.get() >= DETENT) {
            g.note(`släpp v=${Math.round(info.velocity.x)} px/s → svar; farten ärvs av domen`)
            commit(info.velocity.x)
            animate(x, 12, { ...(g.grepp as object), velocity: info.velocity.x } as Transition)
          } else {
            g.note(`släpp v=${Math.round(info.velocity.x)} px/s före hacket → återfjädrad`)
            setArmed(false)
            animate(x, 0, { ...(g.grepp as object), velocity: info.velocity.x } as Transition)
          }
        }}
        onTap={() => {
          if (x.get() > 4) return // a real drag settling — not a click
          g.note('klickval — samma väg, fart 0')
          commit(0)
        }}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            g.note('tangentval — samma väg, fart 0')
            commit(0)
          }
        }}
        whileHover={g.rm || graded ? undefined : { x: 3 }}
        whileTap={g.rm || graded ? undefined : { scale: 0.995 }}
        transition={g.massa}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 10px',
            cursor: g.rm ? (graded ? 'default' : 'pointer') : graded ? 'default' : 'grab',
            background: armed && !graded ? 'var(--panel)' : 'transparent',
            transition: 'background 140ms var(--ease-reading)',
          }}
        >
          <span
            style={{
              ...monoSmall,
              color: isOk ? 'var(--ok)' : isBad ? 'var(--bad)' : 'var(--muted)',
              transition: 'color 160ms var(--ease-reading)',
            }}
          >
            {String.fromCharCode(97 + index)}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 17,
              color: isOk
                ? 'var(--ok)'
                : isBad
                  ? 'var(--bad)'
                  : dim
                    ? 'var(--muted)'
                    : 'var(--ink)',
              textDecoration: isBad ? 'line-through' : 'none',
              textDecorationThickness: isBad ? 1.5 : undefined,
              transition: 'color 160ms var(--ease-reading)',
            }}
          >
            {opt}
          </span>
          {committed && isOk && <GreppBock velocity={600} />}
          {armed && !graded && (
            <span style={{ ...monoSmall, marginLeft: 'auto', color: 'var(--ink)' }}>
              släpp = svara
            </span>
          )}
        </div>
      </motion.div>
      <div aria-hidden style={{ height: 1, background: 'var(--hairline-2)' }} />
    </div>
  )
}

function F4SceneHem({ go }: { go: (s: Scene) => void }) {
  const g = useGrepp()
  return (
    <div style={{ padding: '26px 30px 24px' }}>
      <Fade>
        <div style={{ height: 1, background: 'var(--ink)' }} />
        <div style={{ ...eyebrow, marginTop: 14 }}>Lördag 12 juli · 113 dagar kvar</div>
        <h2 style={{ ...displayHead, fontSize: 42, lineHeight: 1.05, margin: '10px 0 0' }}>
          God morgon.
        </h2>
      </Fade>
      <Fade delay={0.06}>
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.55,
            color: 'var(--ink-2)',
            maxWidth: '46ch',
            margin: '12px 0 0',
          }}
        >
          Dagens pass: ORD — tre frågor, varav en repetition från i onsdags.
        </p>
        <div style={{ display: 'flex', gap: 40, marginTop: 20 }}>
          {[
            { n: '1,42', l: 'senaste pass' },
            { n: '6', l: 'dagar i rad' },
          ].map((st) => (
            <div key={st.l}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 24,
                  color: 'var(--ink)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {st.n}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{st.l}</div>
            </div>
          ))}
        </div>
      </Fade>
      <Fade delay={0.1} style={{ marginTop: 24 }}>
        <GreppPress
          label="Öva nu →"
          onClick={() => {
            g.note('nav framåt → scenen glider in från höger (k420 c44)')
            go('ova')
          }}
        />
      </Fade>
      <Fade delay={0.14} style={{ ...monoSmall, marginTop: 22 }}>
        s. 1 · hem
      </Fade>
    </div>
  )
}

function F4SceneOva({ go, due }: { go: (s: Scene) => void; due: number }) {
  const g = useGrepp()
  return (
    <div style={{ padding: '26px 30px 24px' }}>
      <Fade>
        <div style={eyebrow}>Öva · repetera</div>
        <h2 style={{ ...displayHead, fontSize: 36, margin: '8px 0 0' }}>Öva.</h2>
        <p
          style={{ fontSize: 14.5, color: 'var(--ink-2)', margin: '8px 0 14px', maxWidth: '44ch' }}
        >
          {due} att repetera — ORD är varmast, börja där.
        </p>
        <div style={{ height: 1, background: 'var(--ink)' }} />
      </Fade>
      {LEDGER.map((row, i) => (
        <Fade delay={0.04 + i * 0.03} key={row.code}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '11px 0' }}>
            <span style={{ ...monoSmall, color: 'var(--ink-2)', width: 34 }}>{row.code}</span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16.5,
                fontWeight: 500,
                color: 'var(--ink)',
              }}
            >
              {row.name}
            </span>
            <span
              aria-hidden
              style={{
                flex: 1,
                borderBottom: '1px dotted var(--muted)',
                opacity: 0.55,
                transform: 'translateY(-3px)',
                minWidth: 12,
              }}
            />
            <span style={monoSmall}>{row.n}</span>
          </div>
          <div style={{ height: 1, background: 'var(--hairline-2)' }} />
        </Fade>
      ))}
      <Fade delay={0.18} style={{ marginTop: 22 }}>
        <GreppPress
          label="Starta ORD · 3 frågor →"
          onClick={() => {
            g.note('nav framåt → drillen tar emot handen: raderna är greppbara')
            go('drill')
          }}
        />
      </Fade>
      <Fade delay={0.22} style={{ ...monoSmall, marginTop: 20 }}>
        s. 4 · öva
      </Fade>
    </div>
  )
}

function F4Drill({
  onAnswer,
  onDone,
}: {
  onAnswer: (right: boolean, repetition: boolean) => void
  onDone: (right: number) => void
}) {
  const g = useGrepp()
  const { s } = useContext(RegiCtx)
  const [qIndex, setQIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [commitV, setCommitV] = useState(0)
  const [rightCount, setRightCount] = useState(0)
  const q = QUESTIONS[qIndex] ?? QUESTIONS[0]
  if (!q) return null
  const graded = picked !== null
  const right = picked === q.correct

  const commit = (i: number, velocity: number) => {
    if (graded) return
    setPicked(i)
    setCommitV(velocity)
    const ok = i === q.correct
    if (ok) setRightCount((n) => n + 1)
    onAnswer(ok, q.repetition)
  }

  const next = () => {
    if (qIndex >= QUESTIONS.length - 1) {
      g.note('passet slut → Klart-kortet läggs i handen (k420 c44)')
      onDone(rightCount)
      return
    }
    g.note('nästa fråga — raderna laddas om, greppet väntar')
    setQIndex((n) => n + 1)
    setPicked(null)
    setCommitV(0)
  }

  // the verdict inherits the hand's speed: px/s at release → the spring's
  // initial velocity on its entrance x. Clamped so a wild fling stays legible.
  const verdictVelocity = Math.max(-900, Math.min(900, commitV * 0.6))

  return (
    <div style={{ padding: '26px 30px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={eyebrow}>
          ORD · fråga {qIndex + 1}/{QUESTIONS.length}
        </div>
        <span style={{ ...monoSmall, textTransform: 'uppercase' }}>
          {g.rm ? 'tryck för att svara' : 'dra förbi hacket · farten följer med'}
        </span>
      </div>
      <div style={{ height: 1, background: 'var(--ink)', margin: '12px 0 0' }} />

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={qIndex}
          initial={g.rm || qIndex === 0 ? { opacity: 0 } : { opacity: 0, x: 26 }}
          animate={{
            opacity: 1,
            x: 0,
            transition: g.rm ? { duration: 0 } : { ...g.scen, opacity: { duration: 0.2 / s } },
          }}
          exit={g.rm ? { opacity: 0 } : { opacity: 0, x: -18, transition: g.ut(0) }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, margin: '14px 0 10px' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 36,
                color: 'var(--ink)',
              }}
            >
              {q.headword}
            </div>
            <span style={{ ...monoSmall, textTransform: 'uppercase' }}>{q.note}</span>
          </div>
          <div style={{ height: 1, background: 'var(--hairline)' }} />
          {q.options.map((opt, i) => (
            <DragRow
              key={opt}
              opt={opt}
              index={i}
              graded={graded}
              picked={picked}
              correct={q.correct}
              onCommit={commit}
            />
          ))}

          {/* the verdict arrives WITH the release velocity of your hand */}
          <div style={{ minHeight: 108, paddingTop: 14 }}>
            <AnimatePresence mode="popLayout">
              {graded && (
                <motion.div
                  key="verdict"
                  initial={g.rm ? { opacity: 0 } : { opacity: 0, x: 14 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    transition: g.rm
                      ? { duration: 0 }
                      : {
                          ...g.scen,
                          velocity: -verdictVelocity,
                          opacity: { duration: 0.16 / s },
                        },
                  }}
                  exit={g.rm ? { opacity: 0 } : { opacity: 0, x: -12, transition: g.ut(0) }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontStyle: 'italic',
                        fontWeight: 600,
                        fontSize: 30,
                        color: right ? 'var(--ok)' : 'var(--bad)',
                      }}
                    >
                      {right ? 'Rätt.' : 'Fel.'}
                    </span>
                    {!g.rm && (
                      <span style={{ ...monoSmall }}>
                        ankomstfart {Math.round(Math.abs(verdictVelocity))} px/s — ärvd från din
                        hand
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.55,
                      color: 'var(--ink-2)',
                      maxWidth: '52ch',
                      margin: '6px 0 0',
                    }}
                  >
                    <em>{q.options[q.correct]}</em> — {q.gloss}
                  </p>
                  {((!right && !q.repetition) || (right && q.repetition)) && (
                    <div style={{ ...monoSmall, marginTop: 8 }}>
                      {right && q.repetition
                        ? 'repetitionen satt — siffran räknades ned'
                        : 'lades i repetitionskön — siffran räknades upp'}
                    </div>
                  )}
                  <div style={{ marginTop: 14 }}>
                    <GreppPress
                      label={qIndex >= QUESTIONS.length - 1 ? 'Avsluta passet →' : 'Nästa →'}
                      onClick={next}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {!graded && (
              <Fade delay={0.12} style={monoSmall}>
                {g.rm
                  ? 'tryck på ett alternativ för att svara'
                  : 'greppa en rad och dra den förbi hacket — eller klicka'}
              </Fade>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

type Toss = { x: number; y: number }

function F4SceneKlart({
  rightCount,
  due,
  onHome,
}: {
  rightCount: number
  due: number
  onHome: (impulse: Toss) => void
}) {
  const g = useGrepp()
  const [toss, setToss] = useState<Toss | null>(null)

  const leave = (impulse: Toss) => onHome(impulse)

  return (
    <div style={{ padding: '30px 30px 24px', display: 'grid', placeItems: 'center' }}>
      <AnimatePresence
        mode="wait"
        custom={toss}
        onExitComplete={() => {
          if (toss) leave(toss)
        }}
      >
        {!toss && (
          <motion.div
            key="card"
            custom={toss}
            drag={!g.rm}
            dragConstraints={{ top: -30, bottom: 60, left: -80, right: 80 }}
            dragElastic={0.5}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              const speed = Math.hypot(info.velocity.x, info.velocity.y)
              if (speed > 650) {
                g.note(
                  `kast v=${Math.round(speed)} px/s → kortet följer din vektor; hem kommer från motsatt håll`,
                )
                setToss({ x: info.velocity.x, y: info.velocity.y })
              } else {
                g.note(`släpp v=${Math.round(speed)} px/s — för löst, kortet sätter sig igen`)
              }
            }}
            initial={g.rm ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={
              g.rm
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    x: toss ? Math.max(-260, Math.min(260, (toss as Toss).x * 0.22)) : 0,
                    y: toss ? Math.max(-200, Math.min(200, (toss as Toss).y * 0.22)) : -40,
                    rotate: toss ? Math.max(-7, Math.min(7, (toss as Toss).x / 220)) : 0,
                    transition: g.kast,
                  }
            }
            transition={g.scen}
            whileDrag={g.rm ? undefined : { scale: 1.012, cursor: 'grabbing' }}
            style={{
              width: '100%',
              maxWidth: 380,
              border: '1px solid var(--hairline)',
              background: 'var(--panel)',
              padding: '26px 28px 22px',
              cursor: g.rm ? 'default' : 'grab',
              touchAction: 'none',
            }}
          >
            <div style={{ height: 1, background: 'var(--ink)' }} />
            <div style={{ ...eyebrow, marginTop: 14 }}>ORD · passet är slut</div>
            <h2 style={{ ...displayHead, fontSize: 40, margin: '8px 0 0' }}>Klart.</h2>
            <p
              style={{
                fontSize: 14.5,
                lineHeight: 1.55,
                color: 'var(--ink-2)',
                margin: '10px 0 0',
              }}
            >
              {rightCount} av {QUESTIONS.length} rätt. {due} kvar i repetitionskön — nästa pass
              väntar i morgon.
            </p>
            <div style={{ height: 1, background: 'var(--hairline)', margin: '18px 0 0' }} />
            <div style={{ ...monoSmall, marginTop: 12 }}>
              {g.rm
                ? 'tryck för att lägga undan kortet'
                : 'kasta kortet åt valfritt håll — det tar din fart med sig'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Fade delay={0.16} style={{ marginTop: 20 }}>
        <GreppPress
          label="Tillbaka till Hem →"
          onClick={() => {
            g.note('nav via knapp — neutral impuls')
            leave({ x: 0, y: 0 })
          }}
        />
      </Fade>
    </div>
  )
}

function F4Flow() {
  const rm = useReducedMotion() === true
  const [speed, setSpeed] = useState(1)
  const [last, setLast] = useState('—')
  const [scene, setScene] = useState<Scene>('hem')
  const [due, setDue] = useState(14)
  const [drillKey, setDrillKey] = useState(0)
  const [rightCount, setRightCount] = useState(0)
  // the impulse: the next scene's entry offset, derived from the last
  // gesture. A toss to the left makes Hem enter from the right — the
  // energy carries through navigation. Plain nav = standard forward.
  const [impulse, setImpulse] = useState<Toss>({ x: 20, y: 0 })

  const regi = useMemo<Regi>(() => ({ s: speed, rm, note: setLast }), [speed, rm])

  const go = (s: Scene, imp?: Toss) => {
    setImpulse(imp ?? { x: 20, y: 0 })
    if (s === 'drill') setDrillKey((k) => k + 1)
    setScene(s)
  }

  const ix = impulse.x
  const iy = impulse.y

  return (
    <RegiCtx.Provider value={regi}>
      <MotionConfig reducedMotion="user">
        <LayoutGroup id="f4">
          <Frame>
            <Rail
              scene={scene}
              due={due}
              go={(sc) => go(sc)}
              tickId="f4-tick"
              spring={
                rm
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 420 * speed * speed, damping: 44 * speed, mass: 1 }
              }
              rollSpring={
                rm
                  ? { duration: 0 }
                  : {
                      type: 'spring',
                      stiffness: 620 * speed * speed,
                      damping: 42 * speed,
                      mass: 0.9,
                    }
              }
            />
            <div aria-hidden style={{ width: 1, background: 'var(--hairline)' }} />
            <div style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={scene === 'drill' ? `drill-${drillKey}` : scene}
                  initial={rm ? { opacity: 0 } : { opacity: 0, x: ix, y: iy }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    y: 0,
                    transition: rm
                      ? { duration: 0 }
                      : {
                          type: 'spring',
                          stiffness: 420 * speed * speed,
                          damping: 44 * speed,
                          mass: 1,
                          opacity: { duration: 0.2 / speed },
                        },
                  }}
                  exit={
                    rm
                      ? { opacity: 0, transition: { duration: 0 } }
                      : {
                          opacity: 0,
                          x: -12,
                          transition: { duration: 0.14 / speed, ease: EASE_IN_HARD },
                        }
                  }
                >
                  {scene === 'hem' && <F4SceneHem go={(s) => go(s)} />}
                  {scene === 'ova' && <F4SceneOva go={(s) => go(s)} due={due} />}
                  {scene === 'drill' && (
                    <F4Drill
                      key={drillKey}
                      onAnswer={(right, repetition) => {
                        if (!right && !repetition) setDue((n) => n + 1)
                        if (right && repetition) setDue((n) => n - 1)
                      }}
                      onDone={(r) => {
                        setRightCount(r)
                        go('klart')
                      }}
                    />
                  )}
                  {scene === 'klart' && (
                    <F4SceneKlart
                      rightCount={rightCount}
                      due={due}
                      onHome={(v) =>
                        go('hem', {
                          // toss velocity → entry offset from the OPPOSITE side
                          x: v.x === 0 && v.y === 0 ? 20 : Math.max(-22, Math.min(22, v.x * -0.02)),
                          y: v.x === 0 && v.y === 0 ? 0 : Math.max(-16, Math.min(16, v.y * -0.02)),
                        })
                      }
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <RegiShell title="greppet" scene={scene} speed={speed} setSpeed={setSpeed} rm={rm}>
              fjädrar: grepp k620 c42 · massa k700 c35 · scen k420 c44 · kast k300 c32
              <br />
              hack {DETENT} px · stopp {HARDSTOP} px · senast: {last}
            </RegiShell>
          </Frame>
        </LayoutGroup>
      </MotionConfig>
    </RegiCtx.Provider>
  )
}

/** MOTF4 · Greppet — the app as a physical instrument. */
export function MOTF4() {
  return (
    <div style={{ padding: '40px 40px 96px', background: 'var(--panel-2, var(--bg))' }}>
      <ConceptHeader
        code="MOTF4"
        name="Greppet"
        thesis="Klass som beröring. Appen är ett instrument: allt viktigt går att ta i. Svar
        bekräftas genom att dra raden förbi ett mekaniskt hack (72 px, hårt stopp vid 88 —
        fel håll vägrar), och släppfarten kastas ALDRIG bort: domen anländer med din hands
        hastighet injicerad i sin fjäder, och panelen skriver ut den. Klart-kortet kastas
        iväg längs din vektor med sitt momentum — och Hem glider in från motsatt håll, så
        energin överlever navigeringen. Rader har massa under pekaren (hover-nudge,
        tryck-vikt). Klick och tangentbord svarar överallt — gesten är den förnäma vägen,
        aldrig den enda."
      />
      <F4Flow />
      <div style={{ ...monoSmall, marginTop: 16, maxWidth: '78ch', lineHeight: 1.6 }}>
        grepp k620 c42 m0,9 (radens sits) · massa k700 c35 m0,6 (hover/tryck) · scen k420 c44 m1
        (ankomst med impuls) · kast k300 c32 m1 (momentum ut) · hack 72 px, stopp 88 px, elastik
        0,04 åt rätt håll och 0 åt fel. Reducerad rörelse: inga grepp, inga kast — rena klickytor
        och opacitet.
      </div>
    </div>
  )
}

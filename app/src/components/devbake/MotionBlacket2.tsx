// MotionBlacket2 — "Bläcket 2.0". Round 2 of the motion bake-off: the
// owner picked MOTC2 "Bläcket" (handwriting physics — a light pen;
// marks move on a still page) and asked for the same grammar rebuilt at
// full craft. Round 1's ceiling was its tech: CSS keyframes in isolated
// replay-boards. This file is ONE walkable mini-flow — Hem → Öva →
// drill (3 real ORD questions) → Klart. → Hem — built on motion/react:
//
//   · real springs, named and tuned:
//       penna    k=520 c=32 m=0.75 — small marks (✓, digit roll, tick)
//       strecket k=700 c=22 m=0.6  — the strike; underdamped on purpose,
//                                    the overshoot is pen momentum
//       sidan    k=380 c=40 m=1    — layout + shared-element travel;
//                                    critically damped, the PAGE never
//                                    bounces (Bläcket's first law)
//   · AnimatePresence popLayout scenes — exits overlap entrances, and
//     every spring is interruptible: rapid nav mid-transition redirects,
//     never snaps or queues.
//   · the signature, done honestly: the due-count numeral (the chrome's
//     ONE accent object) travels rail → drill header via layoutId —
//     measured FLIP, not a hand-faked translate. During the drill it is
//     LIVE: a fresh mistake rolls it up (+1), a resolved repetition
//     rolls it down (−1), via a masked per-digit roll.
//   · verdicts drawn, not flipped: the corrector's ✓ is an SVG path
//     sprung along pathLength; the strike springs across the wrong pick
//     with overshoot; the verdict word is written in (clip-path nib
//     reveal). The next question's entrance overlaps the verdict's exit.
//   · one gesture: the Klart. card is drag-dismissible with a velocity
//     threshold — rubber-banded (dragElastic), spring-returned under
//     threshold, released with momentum over it.
//   · regi panel (fixed corner, mono): current scene, the last fired
//     transition with its real spring params, and a hastighet toggle
//     (1×/0.5×). Motion has no global time-scale, so speed is a context
//     multiplier baked into every transition factory — stiffness×s²,
//     damping×s keeps the spring's SHAPE identical at half speed.
//
// Discipline unchanged from round 1: motion confirms causality, nothing
// loops or idles; transform/opacity (+ pathLength, clip-path sparingly);
// accent only where it already lives (active ToC row, the due numeral);
// verdict color is semantic --ok/--bad ink. prefers-reduced-motion
// (Motion's useReducedMotion) collapses everything to opacity-or-
// nothing: no layout travel, no drawn marks, no drag flourish.
//
// DESIGN artifact: fixtures only, no routes, no shared-file edits.

import {
  AnimatePresence,
  LayoutGroup,
  MotionConfig,
  motion,
  type Transition,
  useReducedMotion,
} from 'motion/react'
import {
  type CSSProperties,
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'

/* ── type shorthands ─────────────────────────────────────────────── */

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

/* ── regi: speed, reduced motion, transition log ─────────────────────
 *
 * Every transition in the flow is built through these factories so the
 * hastighet toggle scales ALL of them coherently. A spring's period
 * goes as √(m/k) and its decay as c/2m — so stiffness×s² and damping×s
 * plays the exact same curve at 1/s speed. Tweens just divide duration.
 */

type Regi = {
  s: number // speed factor: 1 = normal, 0.5 = half speed
  rm: boolean // prefers-reduced-motion
  note: (label: string) => void
}

const RegiCtx = createContext<Regi>({ s: 1, rm: false, note: () => {} })

type Bezier = [number, number, number, number]
const EASE_READING: Bezier = [0.16, 1, 0.3, 1]
const EASE_EXIT: Bezier = [0.7, 0, 0.84, 0]

function useInk() {
  const { s, rm, note } = useContext(RegiCtx)
  return useMemo(() => {
    const spring = (stiffness: number, damping: number, mass = 1): Transition =>
      rm
        ? { duration: 0 }
        : { type: 'spring', stiffness: stiffness * s * s, damping: damping * s, mass }
    const tween = (duration: number, ease: Bezier = EASE_READING): Transition =>
      rm ? { duration: 0 } : { duration: duration / s, ease }
    return {
      rm,
      note,
      /** small marks: ✓, digit roll, folio pops. Light, a hair of overshoot. */
      penna: spring(520, 32, 0.75),
      /** the strike. Underdamped on purpose — overshoot is pen momentum. */
      strecket: spring(700, 22, 0.6),
      /** layout + shared-element travel. Critically damped: the page never bounces. */
      sidan: spring(380, 40, 1),
      /** press release rebound on buttons. */
      tryck: spring(650, 26, 0.55),
      /** written-in entrances (nib pace). */
      skrift: tween(0.3),
      /** exits — quick, decisive. */
      ut: tween(0.16, EASE_EXIT),
      /** hairline rules drawing across the page. */
      linjal: tween(0.36),
      spring,
      tween,
    }
  }, [s, rm, note])
}

/* ── primitives ──────────────────────────────────────────────────── */

/** Written in from the left margin — the Bläcket entrance. */
function Skrift({
  delay = 0,
  children,
  style,
}: {
  delay?: number
  children: ReactNode
  style?: CSSProperties
}) {
  const ink = useInk()
  const { s } = useContext(RegiCtx)
  return (
    <motion.div
      initial={ink.rm ? { opacity: 0 } : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...ink.skrift, delay: ink.rm ? 0 : delay / s }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/** A hairline rule that draws left→right as part of arrival. */
function Linjal({
  delay = 0,
  color = 'var(--hairline)',
  style,
}: {
  delay?: number
  color?: string
  style?: CSSProperties
}) {
  const ink = useInk()
  const { s } = useContext(RegiCtx)
  return (
    <motion.div
      aria-hidden
      initial={ink.rm ? { opacity: 0 } : { scaleX: 0 }}
      animate={ink.rm ? { opacity: 1 } : { scaleX: 1 }}
      transition={{ ...ink.linjal, delay: ink.rm ? 0 : delay / s }}
      style={{ height: 1, background: color, transformOrigin: 'left center', ...style }}
    />
  )
}

/** Mono action with mass: presses in fast, springs back out. */
function Press({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  const ink = useInk()
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={ink.rm ? undefined : { scale: 0.955, y: 0.5 }}
      transition={ink.tryck}
      style={{
        ...monoSmall,
        textTransform: 'uppercase',
        color: 'var(--ink)',
        background: 'transparent',
        border: '1px solid var(--ink)',
        padding: '6px 14px',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </motion.button>
  )
}

/** The verdict word, written in by the nib (clip-path reveal). */
function Skrivet({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode
  delay?: number
  style?: CSSProperties
}) {
  const ink = useInk()
  const { s } = useContext(RegiCtx)
  return (
    <motion.span
      initial={ink.rm ? { opacity: 0 } : { clipPath: 'inset(-10% 102% -10% -2%)', opacity: 0.6 }}
      animate={ink.rm ? { opacity: 1 } : { clipPath: 'inset(-10% -2% -10% -2%)', opacity: 1 }}
      transition={{ ...ink.tween(0.34), delay: ink.rm ? 0 : delay / s }}
      style={{ display: 'inline-block', ...style }}
    >
      {children}
    </motion.span>
  )
}

/** Masked per-digit roll. Increment rolls up, decrement rolls down. */
function DigitRoll({ value, style }: { value: number; style?: CSSProperties }) {
  const ink = useInk()
  const prev = useRef(value)
  const dir = value >= prev.current ? 1 : -1
  // commit after render so the exiting digit knows the direction it left in
  if (prev.current !== value) prev.current = value
  const digits = String(value).split('')
  return (
    <span
      style={{
        display: 'inline-flex',
        overflow: 'hidden',
        verticalAlign: 'bottom',
        ...style,
      }}
    >
      {digits.map((ch, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: digit slots are positional by design
          key={i}
          style={{ display: 'inline-block', position: 'relative', overflow: 'hidden' }}
        >
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.span
              key={ch}
              custom={dir}
              initial={ink.rm ? { opacity: 0 } : { y: `${dir * 0.95}em`, opacity: 0 }}
              animate={{ y: '0em', opacity: 1 }}
              exit={ink.rm ? { opacity: 0 } : { y: `${dir * -0.95}em`, opacity: 0 }}
              transition={ink.penna}
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

/** The corrector's ✓ — an SVG path sprung along pathLength. */
function Bock({ size = 18 }: { size?: number }) {
  const ink = useInk()
  return (
    <svg
      width={size}
      height={size}
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
        initial={ink.rm ? { opacity: 0 } : { pathLength: 0, opacity: 1 }}
        animate={ink.rm ? { opacity: 1 } : { pathLength: 1, opacity: 1 }}
        transition={ink.rm ? { duration: 0 } : ink.spring(420, 36, 0.9)}
      />
    </svg>
  )
}

/** The strike across a wrong pick — scaleX spring with real overshoot. */
function Strecket() {
  const ink = useInk()
  return (
    <motion.span
      aria-hidden
      initial={ink.rm ? { opacity: 0 } : { scaleX: 0 }}
      animate={ink.rm ? { opacity: 1 } : { scaleX: 1 }}
      transition={ink.strecket}
      style={{
        position: 'absolute',
        left: -3,
        right: -3,
        top: '54%',
        height: 1.6,
        background: 'var(--bad)',
        transformOrigin: 'left center',
      }}
    />
  )
}

/* ── fixtures: three real ORD items ──────────────────────────────── */

type OrdQ = {
  headword: string
  options: readonly [string, string, string, string, string]
  correct: number
  gloss: string
  /** true = this item is in the repetition queue (a past mistake) */
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

type Scene = 'hem' | 'ova' | 'drill' | 'klart'

/* ── scenes ──────────────────────────────────────────────────────── */

function SceneHem({ go }: { go: (s: Scene) => void }) {
  const ink = useInk()
  return (
    <div style={{ padding: '26px 30px 24px' }}>
      <Linjal color="var(--ink)" />
      <Skrift delay={0.05} style={{ marginTop: 14 }}>
        <div style={eyebrow}>Lördag 12 juli · 113 dagar kvar</div>
      </Skrift>
      <Skrift delay={0.09}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 42,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            margin: '10px 0 0',
          }}
        >
          God morgon.
        </h2>
      </Skrift>
      <Skrift delay={0.16}>
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
      </Skrift>
      <Linjal delay={0.22} style={{ margin: '20px 0 0' }} />
      <Skrift delay={0.26} style={{ display: 'flex', gap: 40, marginTop: 14 }}>
        {[
          { n: '1,42', l: 'senaste pass' },
          { n: '6', l: 'dagar i rad' },
        ].map((s) => (
          <div key={s.l}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 24,
                color: 'var(--ink)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {s.n}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </Skrift>
      <Skrift delay={0.34} style={{ marginTop: 24 }}>
        <Press
          label="Öva nu →"
          onClick={() => {
            ink.note('scen hem→öva · skrift 300 ms, utgång 160 ms — överlappande')
            go('ova')
          }}
        />
      </Skrift>
      <Skrift delay={0.42} style={{ ...monoSmall, marginTop: 22 }}>
        s. 1 · hem
      </Skrift>
    </div>
  )
}

const LEDGER = [
  { code: 'ORD', name: 'Ordförståelse', n: '3 väntar' },
  { code: 'LÄS', name: 'Läsförståelse', n: '4 väntar' },
  { code: 'MEK', name: 'Meningskomplettering', n: '2 väntar' },
  { code: 'ELF', name: 'Engelsk läsförståelse', n: '5 väntar' },
] as const

function SceneOva({ go, due }: { go: (s: Scene) => void; due: number }) {
  const ink = useInk()
  return (
    <div style={{ padding: '26px 30px 24px' }}>
      <Skrift>
        <div style={eyebrow}>Öva · repetera</div>
      </Skrift>
      <Skrift delay={0.06}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 36,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            margin: '8px 0 0',
          }}
        >
          Öva.
        </h2>
      </Skrift>
      <Skrift delay={0.12}>
        <p
          style={{ fontSize: 14.5, color: 'var(--ink-2)', margin: '8px 0 14px', maxWidth: '44ch' }}
        >
          {due} att repetera — ORD är varmast, börja där.
        </p>
      </Skrift>
      <Linjal delay={0.16} color="var(--ink)" />
      {LEDGER.map((row, i) => {
        // overlapping stagger: rows land closer together as the eye settles
        const d = 0.2 + i * 0.055 + (i > 1 ? -0.01 * (i - 1) : 0)
        return (
          <div key={row.code} style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '11px 0' }}>
              <Skrift delay={d} style={{ ...monoSmall, color: 'var(--ink-2)', width: 34 }}>
                {row.code}
              </Skrift>
              <Skrift delay={d + 0.03}>
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
              </Skrift>
              <motion.span
                aria-hidden
                initial={ink.rm ? { opacity: 0 } : { scaleX: 0, opacity: 0.55 }}
                animate={ink.rm ? { opacity: 0.55 } : { scaleX: 1, opacity: 0.55 }}
                transition={{ ...ink.tween(0.3), delay: ink.rm ? 0 : d + 0.08 }}
                style={{
                  flex: 1,
                  borderBottom: '1px dotted var(--muted)',
                  transform: 'translateY(-3px)',
                  transformOrigin: 'left center',
                  minWidth: 12,
                }}
              />
              <motion.span
                initial={ink.rm ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...ink.penna, delay: ink.rm ? 0 : d + 0.16 }}
                style={monoSmall}
              >
                {row.n}
              </motion.span>
            </div>
            <Linjal delay={d} color="var(--hairline-2)" />
          </div>
        )
      })}
      <Skrift delay={0.48} style={{ marginTop: 22 }}>
        <Press
          label="Starta ORD · 3 frågor →"
          onClick={() => {
            ink.note('siffran följer med · layoutId, sidan k380 c40')
            go('drill')
          }}
        />
      </Skrift>
      <Skrift delay={0.54} style={{ ...monoSmall, marginTop: 20 }}>
        s. 4 · öva
      </Skrift>
    </div>
  )
}

function OptionRow({
  opt,
  index,
  graded,
  picked,
  correct,
  delay,
  onPick,
}: {
  opt: string
  index: number
  graded: boolean
  picked: number | null
  correct: number
  delay: number
  onPick: (i: number) => void
}) {
  const ink = useInk()
  const isOk = graded && index === correct
  const isBad = graded && index === picked && picked !== correct
  const dim = graded && !isOk && !isBad
  return (
    <div style={{ position: 'relative' }}>
      <motion.button
        type="button"
        disabled={graded}
        onClick={() => onPick(index)}
        initial={ink.rm ? { opacity: 0 } : { opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...ink.skrift, delay: ink.rm ? 0 : delay }}
        whileTap={graded || ink.rm ? undefined : { scale: 0.99 }}
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
          {String.fromCharCode(97 + index)}
        </span>
        <span
          style={{
            position: 'relative',
            fontFamily: 'var(--font-display)',
            fontSize: 17,
            color: isOk ? 'var(--ok)' : isBad ? 'var(--bad)' : dim ? 'var(--muted)' : 'var(--ink)',
            transition: 'color 160ms var(--ease-reading)',
          }}
        >
          {opt}
          {isBad && <Strecket />}
        </span>
        {isOk && (
          <span style={{ marginLeft: 4, display: 'inline-flex' }}>
            <Bock />
          </span>
        )}
      </motion.button>
      <Linjal delay={delay} color="var(--hairline-2)" />
    </div>
  )
}

function SceneDrill({
  due,
  onAnswer,
  onDone,
}: {
  due: number
  onAnswer: (right: boolean, repetition: boolean) => void
  onDone: (right: number) => void
}) {
  const ink = useInk()
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
    ink.note(
      ok
        ? 'bock · pathLength k420 c36 — pennan drar bocken'
        : 'strecket · k700 c22 m0.6 — överskjutet är pennans fart',
    )
    onAnswer(ok, q.repetition)
  }

  const next = () => {
    const finalRight = rightCount
    if (qIndex >= QUESTIONS.length - 1) {
      ink.note('scen drill→klart · sidan k380 c40')
      onDone(finalRight)
      return
    }
    ink.note('frågeväxling · utgång 160 ms ⟂ ingång 300 ms — överlappad')
    setQIndex((n) => n + 1)
    setPicked(null)
  }

  return (
    <div style={{ padding: '26px 30px 24px' }}>
      {/* header: progress left, the traveling due numeral right */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={eyebrow}>
          ORD · fråga {qIndex + 1}/{QUESTIONS.length}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <motion.span
            layoutId={ink.rm ? undefined : 'due-numeral'}
            transition={ink.sidan}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 22,
              color: 'var(--accent)',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            <DigitRoll value={due} />
          </motion.span>
          <span style={{ ...monoSmall, textTransform: 'uppercase' }}>att repetera</span>
        </div>
      </div>
      <Linjal delay={0.04} color="var(--ink)" style={{ margin: '12px 0 0' }} />

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={qIndex}
          initial={ink.rm ? { opacity: 0 } : { opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0, transition: { ...ink.skrift, delay: ink.rm ? 0 : 0.06 } }}
          exit={ink.rm ? { opacity: 0 } : { opacity: 0, y: -10, transition: ink.ut }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 14,
              margin: '14px 0 10px',
            }}
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
          <Linjal delay={0.1} />
          {q.options.map((opt, i) => (
            <OptionRow
              key={opt}
              opt={opt}
              index={i}
              graded={graded}
              picked={picked}
              correct={q.correct}
              delay={0.12 + i * 0.045}
              onPick={pick}
            />
          ))}

          {/* verdict block — appears under the options, written in */}
          <div style={{ minHeight: 96, paddingTop: 14 }}>
            <AnimatePresence mode="popLayout">
              {graded && (
                <motion.div
                  key="verdict"
                  initial={{ opacity: ink.rm ? 0 : 1 }}
                  animate={{ opacity: 1 }}
                  exit={ink.rm ? { opacity: 0 } : { opacity: 0, y: -8, transition: ink.ut }}
                >
                  <Skrivet
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontWeight: 600,
                      fontSize: 30,
                      color: right ? 'var(--ok)' : 'var(--bad)',
                    }}
                  >
                    {right ? 'Rätt.' : 'Fel.'}
                  </Skrivet>
                  <Skrift delay={0.12}>
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
                  </Skrift>
                  {!right && !q.repetition && (
                    <Skrift delay={0.2} style={{ ...monoSmall, marginTop: 8 }}>
                      lades i repetitionskön — siffran räknades upp
                    </Skrift>
                  )}
                  {right && q.repetition && (
                    <Skrift delay={0.2} style={{ ...monoSmall, marginTop: 8 }}>
                      repetitionen satt — siffran räknades ned
                    </Skrift>
                  )}
                  <Skrift delay={0.26} style={{ marginTop: 14 }}>
                    <Press
                      label={qIndex >= QUESTIONS.length - 1 ? 'Avsluta passet →' : 'Nästa →'}
                      onClick={next}
                    />
                  </Skrift>
                </motion.div>
              )}
            </AnimatePresence>
            {!graded && (
              <Skrift delay={0.34} style={{ ...monoSmall }}>
                välj a–e — rättarens penna drar bocken och strecket
              </Skrift>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function SceneKlart({
  rightCount,
  due,
  onHome,
}: {
  rightCount: number
  due: number
  onHome: () => void
}) {
  const ink = useInk()
  const dismiss = () => {
    onHome()
  }
  return (
    <div style={{ padding: '30px 30px 24px', display: 'grid', placeItems: 'center' }}>
      <motion.div
        drag={ink.rm ? false : 'y'}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.08, bottom: 0.45 }}
        dragTransition={{ bounceStiffness: 380, bounceDamping: 40 }}
        onDragEnd={(_, info) => {
          const flung = info.velocity.y > 620 || info.offset.y > 130
          ink.note(
            flung
              ? `släpp v=${Math.round(info.velocity.y)} → lagd åt sidan`
              : `släpp v=${Math.round(info.velocity.y)} → återfjädrad (k380 c40)`,
          )
          if (flung) dismiss()
        }}
        whileDrag={ink.rm ? undefined : { scale: 1.01 }}
        initial={ink.rm ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={ink.sidan}
        style={{
          width: '100%',
          maxWidth: 380,
          border: '1px solid var(--hairline)',
          background: 'var(--panel)',
          padding: '26px 28px 22px',
          cursor: ink.rm ? 'default' : 'grab',
          touchAction: 'none',
        }}
      >
        <Linjal color="var(--ink)" />
        <Skrift delay={0.08} style={{ marginTop: 14 }}>
          <div style={eyebrow}>ORD · passet är slut</div>
        </Skrift>
        <Skrivet
          delay={0.14}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 40,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            margin: '8px 0 0',
          }}
        >
          Klart.
        </Skrivet>
        <Skrift delay={0.22}>
          <p
            style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-2)', margin: '10px 0 0' }}
          >
            {rightCount} av {QUESTIONS.length} rätt. {due} kvar i repetitionskön — nästa pass väntar
            i morgon.
          </p>
        </Skrift>
        <Linjal delay={0.3} style={{ margin: '18px 0 0' }} />
        <Skrift delay={0.34} style={{ ...monoSmall, marginTop: 12 }}>
          {ink.rm ? 'tryck för att lägga undan kortet' : 'dra kortet nedåt för att lägga undan det'}
        </Skrift>
      </motion.div>
      <Skrift delay={0.42} style={{ marginTop: 20 }}>
        <Press
          label="Tillbaka till Hem →"
          onClick={() => {
            ink.note('scen klart→hem · sidan k380 c40')
            dismiss()
          }}
        />
      </Skrift>
    </div>
  )
}

/* ── the rail: ToC + traveling ink tick + the due folio ──────────── */

function Rail({ scene, due, go }: { scene: Scene; due: number; go: (s: Scene) => void }) {
  const ink = useInk()
  const activeId = scene === 'hem' ? 'hem' : 'ova'
  const numeralInRail = scene !== 'drill'
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
              ink.note('bläckstrecket flyttar · layoutId, sidan k380 c40')
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
                layoutId={ink.rm ? undefined : 'ink-tick'}
                transition={ink.sidan}
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
                {/* the due folio — the chrome's ONE accent numeral. While the
                    drill owns it, the slot stays empty (it has traveled). */}
                {numeralInRail && (
                  <motion.span
                    layoutId={ink.rm ? undefined : 'due-numeral'}
                    transition={ink.sidan}
                    style={{
                      ...monoSmall,
                      color: 'var(--accent)',
                      lineHeight: 1,
                    }}
                  >
                    <DigitRoll value={due} />
                  </motion.span>
                )}
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

/* ── regi panel ──────────────────────────────────────────────────── */

function RegiPanel({
  scene,
  last,
  speed,
  setSpeed,
  rm,
}: {
  scene: Scene
  last: string
  speed: number
  setSpeed: (n: number) => void
  rm: boolean
}) {
  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        width: 250,
        zIndex: 10,
        border: '1px solid var(--hairline)',
        background: 'var(--panel)',
        padding: '10px 12px',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ ...eyebrow, fontSize: 9, display: 'flex', justifyContent: 'space-between' }}>
        <span>Regi</span>
        <span>{rm ? 'reducerad rörelse: på' : `hastighet ${speed === 1 ? '1' : '0,5'}×`}</span>
      </div>
      <div style={{ ...monoSmall, marginTop: 8, lineHeight: 1.6 }}>
        scen: {scene}
        <br />
        fjädrar: penna k520 c32 · strecket k700 c22 · sidan k380 c40
        <br />
        senast: {last}
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
          k×s² · c×s — samma kurva, halva farten
        </span>
      </div>
    </div>
  )
}

/* ── the walkable flow ───────────────────────────────────────────── */

function Flow() {
  const rmSys = useReducedMotion()
  const rm = rmSys === true
  const [speed, setSpeed] = useState(1)
  const [last, setLast] = useState('—')
  const [scene, setScene] = useState<Scene>('hem')
  const [due, setDue] = useState(14)
  const [drillKey, setDrillKey] = useState(0)
  const [rightCount, setRightCount] = useState(0)

  const regi = useMemo<Regi>(() => ({ s: speed, rm, note: (l: string) => setLast(l) }), [speed, rm])

  const go = (s: Scene) => {
    if (s === 'drill') setDrillKey((k) => k + 1)
    setScene(s)
  }

  return (
    <RegiCtx.Provider value={regi}>
      <MotionConfig reducedMotion="user">
        <LayoutGroup>
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
            <Rail scene={scene} due={due} go={go} />
            {/* the spine — the book holds still while the page changes */}
            <div aria-hidden style={{ width: 1, background: 'var(--hairline)' }} />
            <div style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={scene === 'drill' ? `drill-${drillKey}` : scene}
                  initial={rm ? { opacity: 0 } : { opacity: 0, x: 16 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    transition: rm
                      ? { duration: 0 }
                      : { duration: 0.3 / speed, ease: [0.16, 1, 0.3, 1], delay: 0.05 / speed },
                  }}
                  exit={
                    rm
                      ? { opacity: 0, transition: { duration: 0 } }
                      : {
                          opacity: 0,
                          x: -12,
                          transition: { duration: 0.16 / speed, ease: [0.7, 0, 0.84, 0] },
                        }
                  }
                >
                  {scene === 'hem' && <SceneHem go={go} />}
                  {scene === 'ova' && <SceneOva go={go} due={due} />}
                  {scene === 'drill' && (
                    <SceneDrill
                      key={drillKey}
                      due={due}
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
                    <SceneKlart rightCount={rightCount} due={due} onHome={() => go('hem')} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <RegiPanel scene={scene} last={last} speed={speed} setSpeed={setSpeed} rm={rm} />
          </div>
        </LayoutGroup>
      </MotionConfig>
    </RegiCtx.Provider>
  )
}

/* ── export ──────────────────────────────────────────────────────── */

/** MOTB2 · Bläcket 2.0 — the walkable Bläcket flow, real springs. */
export function MOTB2() {
  return (
    <div style={{ padding: '40px 40px 96px', background: 'var(--panel-2, var(--bg))' }}>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: 34,
          letterSpacing: '-0.01em',
          color: 'var(--ink)',
          margin: 0,
        }}
      >
        MOTB2 · Bläcket 2.0
      </h1>
      <p
        style={{
          fontSize: 14,
          color: 'var(--ink-2)',
          maxWidth: '70ch',
          margin: '10px 0 28px',
          lineHeight: 1.5,
        }}
      >
        Samma grammatik som Bläcket — en lätt penna, märken som rör sig på en stilla sida — men
        byggd med riktiga fjädrar i stället för uppspelade klipp. Det här är en gångbar slinga: Hem
        → Öva → tre riktiga ORD-frågor → Klart. → Hem. Kö-siffran, chromens enda accentobjekt,
        färdas mätt (layoutId) från förteckningens folio in i drillens huvud och LEVER där: ett nytt
        fel rullar den uppåt, en klarad repetition rullar den nedåt. Bocken dras längs sin bana,
        strecket fjädrar över felvalet med pennans fart, nästa fråga skrivs in medan domen ännu
        lämnar sidan. Klart-kortet dras undan med handen — släpps det för löst fjädrar det tillbaka.
        Allt är avbrytbart: klicka snabbt mitt i en övergång och fjädrarna styr om i flykten.
        Regi-panelen i hörnet visar fjädrarnas parametrar och spelar allt i halv fart.
      </p>
      <Flow />
      <div style={{ ...monoSmall, marginTop: 16, maxWidth: '78ch', lineHeight: 1.6 }}>
        penna k520 c32 m0,75 (små märken) · strecket k700 c22 m0,6 (överskjutning = pennans fart) ·
        sidan k380 c40 m1 (layout — sidan studsar aldrig) · skrift 300 ms · utgång 160 ms — utgång
        och ingång överlappar alltid. Reducerad rörelse: allt faller tillbaka till opacitet eller
        ingenting.
      </div>
    </div>
  )
}

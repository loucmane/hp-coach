// MotionSpringF — round 3 of the motion bake-off, the RESTRAINT axis.
// Two concepts at its opposite ends, both walkable mini-flows
// (Hem → Öva → 3 ORD questions → Klart. → Hem) on motion/react:
//
//   MOTF1 "Sättningen" — the disappearing spring. In a finely set book
//   you never see the typesetter's hand, only the quality. No shared
//   elements, no drawn marks, travel ≤ 6 px, springs that settle in
//   110–220 ms. All meaning is carried by timing relationships (what
//   leads, what follows, by how many milliseconds) and by what RECEDES
//   (wrong options dim; nothing travels). The verdict gets the largest
//   motion budget in the whole system — 6 px, ~220 ms — because that is
//   the one place causality needs confirming. The 0,5× toggle exists to
//   prove the motion is there at all.
//
//     ansats  k=1100 c=68 m=0.7  — entrances (4 px), settles ~150 ms
//     kvitto  k=750  c=48 m=0.85 — the verdict rise (6 px), ~220 ms
//     snitt   k=1500 c=80 m=0.6  — micro: digit blip, tap release
//     ut      70 ms tween        — exits; entrance starts 40 ms in
//
//   MOTF2 "Arket" — total continuity. One sheet of paper, never torn:
//   nothing appears or disappears, every scene change is the same
//   material rearranging. The word "Öva" morphs CTA-row → headline →
//   drill eyebrow; the ORD ledger code becomes the drill header; the
//   due numeral has three stations (rail → drill header → Klart-panel
//   sentence); the drill is ONE continuous paper ribbon — all three
//   questions plus the Klart panel — that the camera pans, so questions
//   never unmount and your verdicts stay on the ribbon above; the
//   picked option row BECOMES the verdict (layoutId morph); Hem's
//   day-card and the Klart panel are the same sheet. Arket's first law
//   inverts Bläcket's: marks never move — the paper moves; ink only
//   dries (opacity, zero travel).
//
//     arket   k=320 c=36 m=1    — anchor + container morphs (layoutId)
//     remsan  k=240 c=30 m=1.15 — the ribbon pan; paper has mass
//     veck    k=480 c=40 m=0.8  — small in-place layout shifts
//     tork    240 ms tween      — ink drying onto the sheet (✓, strike)
//
// Shared discipline (unchanged across rounds): motion confirms
// causality, nothing loops or idles; transform/opacity only; accent
// pixels only where they already live (active ToC row, due numeral);
// verdict color is semantic --ok/--bad ink; useReducedMotion collapses
// everything to opacity-or-nothing (no layout travel, no morphs, no
// ribbon pan). Every spring is interruptible: rapid nav mid-transition
// redirects in flight.
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

type Scene = 'hem' | 'ova' | 'drill'

/* ── shared regi plumbing ─────────────────────────────────────────
 * Speed scaling is honest physics, kept from round 2: stiffness×s² and
 * damping×s plays the same spring curve at 1/s speed; tweens divide
 * duration. Both concepts route every transition through this.
 */

type Regi = { s: number; rm: boolean; note: (label: string) => void }
const RegiCtx = createContext<Regi>({ s: 1, rm: false, note: () => {} })

type Bezier = [number, number, number, number]
const EASE_READING: Bezier = [0.16, 1, 0.3, 1]
const EASE_EXIT: Bezier = [0.7, 0, 0.84, 0]

function useRegiFactories() {
  const { s, rm, note } = useContext(RegiCtx)
  return useMemo(() => {
    const spring = (stiffness: number, damping: number, mass = 1): Transition =>
      rm
        ? { duration: 0 }
        : { type: 'spring', stiffness: stiffness * s * s, damping: damping * s, mass }
    const tween = (duration: number, ease: Bezier = EASE_READING): Transition =>
      rm ? { duration: 0 } : { duration: duration / s, ease }
    return { s, rm, note, spring, tween }
  }, [s, rm, note])
}

/** Masked per-digit roll, direction-aware. Spring is supplied by the
 *  concept so F1 can blip (snitt) where F2 rolls with paper mass. */
function DigitRoll({
  value,
  transition,
  rm,
  style,
}: {
  value: number
  transition: Transition
  rm: boolean
  style?: CSSProperties
}) {
  const prev = useRef(value)
  const dir = value >= prev.current ? 1 : -1
  if (prev.current !== value) prev.current = value
  const digits = String(value).split('')
  return (
    <span style={{ display: 'inline-flex', overflow: 'hidden', verticalAlign: 'bottom', ...style }}>
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
              initial={rm ? { opacity: 0 } : { y: `${dir * 0.9}em`, opacity: 0 }}
              animate={{ y: '0em', opacity: 1 }}
              exit={rm ? { opacity: 0 } : { y: `${dir * -0.9}em`, opacity: 0 }}
              transition={transition}
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

/** Mono action button; press physics supplied per concept. */
function Press({
  label,
  onClick,
  transition,
  rm,
  disabled,
}: {
  label: string
  onClick: () => void
  transition: Transition
  rm: boolean
  disabled?: boolean
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={rm ? undefined : { scale: 0.97 }}
      transition={transition}
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

/** Shared regi panel; each concept supplies its own spring line. */
function RegiPanel({
  scene,
  last,
  speed,
  setSpeed,
  rm,
  springLine,
}: {
  scene: string
  last: string
  speed: number
  setSpeed: (n: number) => void
  rm: boolean
  springLine: string
}) {
  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        width: 262,
        zIndex: 10,
        border: '1px solid var(--hairline)',
        background: 'var(--panel)',
        padding: '10px 12px',
      }}
    >
      <div style={{ ...eyebrow, fontSize: 9, display: 'flex', justifyContent: 'space-between' }}>
        <span>Regi</span>
        <span>{rm ? 'reducerad rörelse: på' : `hastighet ${speed === 1 ? '1' : '0,5'}×`}</span>
      </div>
      <div style={{ ...monoSmall, marginTop: 8, lineHeight: 1.6 }}>
        scen: {scene}
        <br />
        {springLine}
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

/* ════════════════════════════════════════════════════════════════════
 * F1 · SÄTTNINGEN — the disappearing spring
 * ════════════════════════════════════════════════════════════════════ */

function useSats() {
  const f = useRegiFactories()
  return useMemo(
    () => ({
      ...f,
      /** entrances: 4 px rise, settles ~150 ms. */
      ansats: f.spring(1100, 68, 0.7),
      /** the verdict rise: 6 px, ~220 ms — the system's largest budget. */
      kvitto: f.spring(750, 48, 0.85),
      /** micro: digit blip, tap release, ~110 ms. */
      snitt: f.spring(1500, 80, 0.6),
      /** exits: 70 ms, decisive. */
      ut: f.tween(0.07, EASE_EXIT),
      /** the recede: what is no longer relevant dims, 120 ms. */
      dis: f.tween(0.12),
    }),
    [f],
  )
}

/** F1 entrance: 4 px + opacity on the ansats spring, lead/follow in
 *  30 ms steps. `step` is an ordinal, not a duration. */
function Sats({
  step = 0,
  children,
  style,
}: {
  step?: number
  children: ReactNode
  style?: CSSProperties
}) {
  const ink = useSats()
  return (
    <motion.div
      initial={ink.rm ? { opacity: 0 } : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...ink.ansats, delay: ink.rm ? 0 : (0.03 * step) / ink.s }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

function F1Hem({ go }: { go: (s: Scene) => void }) {
  const ink = useSats()
  return (
    <div style={{ padding: '26px 30px 24px' }}>
      <Sats step={0}>
        <div style={{ height: 1, background: 'var(--ink)' }} />
      </Sats>
      <Sats step={0} style={{ marginTop: 14 }}>
        <div style={eyebrow}>Lördag 12 juli · 113 dagar kvar</div>
      </Sats>
      <Sats step={1}>
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
      </Sats>
      <Sats step={2}>
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
      </Sats>
      <Sats step={3} style={{ marginTop: 20 }}>
        <div style={{ height: 1, background: 'var(--hairline)' }} />
      </Sats>
      <Sats step={3} style={{ display: 'flex', gap: 40, marginTop: 14 }}>
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
      </Sats>
      <Sats step={4} style={{ marginTop: 24 }}>
        <Press
          label="Öva nu →"
          rm={ink.rm}
          transition={ink.snitt}
          onClick={() => {
            ink.note('hem→öva · 70 ms ut ⟂ in +40 ms · 4 px — under tröskeln')
            go('ova')
          }}
        />
      </Sats>
      <Sats step={5} style={{ ...monoSmall, marginTop: 22 }}>
        s. 1 · hem
      </Sats>
    </div>
  )
}

function F1Ova({ go, due }: { go: (s: Scene) => void; due: number }) {
  const ink = useSats()
  return (
    <div style={{ padding: '26px 30px 24px' }}>
      <Sats step={0}>
        <div style={eyebrow}>Öva · repetera</div>
      </Sats>
      <Sats step={1}>
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
      </Sats>
      <Sats step={2}>
        <p
          style={{ fontSize: 14.5, color: 'var(--ink-2)', margin: '8px 0 14px', maxWidth: '44ch' }}
        >
          {due} att repetera — ORD är varmast, börja där.
        </p>
      </Sats>
      <Sats step={2}>
        <div style={{ height: 1, background: 'var(--ink)' }} />
      </Sats>
      {LEDGER.map((row, i) => (
        <Sats key={row.code} step={3 + i}>
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
        </Sats>
      ))}
      <Sats step={7} style={{ marginTop: 22 }}>
        <Press
          label="Starta ORD · 3 frågor →"
          rm={ink.rm}
          transition={ink.snitt}
          onClick={() => {
            ink.note('öva→drill · samma budget — inget färdas, ordningen bär')
            go('drill')
          }}
        />
      </Sats>
      <Sats step={8} style={{ ...monoSmall, marginTop: 20 }}>
        s. 4 · öva
      </Sats>
    </div>
  )
}

function F1OptionRow({
  opt,
  index,
  graded,
  picked,
  correct,
  step,
  onPick,
}: {
  opt: string
  index: number
  graded: boolean
  picked: number | null
  correct: number
  step: number
  onPick: (i: number) => void
}) {
  const ink = useSats()
  const isOk = graded && index === correct
  const isBad = graded && index === picked && picked !== correct
  const recede = graded && !isOk && !isBad
  return (
    <Sats step={step}>
      {/* the recede: irrelevant rows withdraw — this is the verdict's
          negative space, and the only "motion" most rows ever get */}
      <motion.div
        animate={{ opacity: recede ? 0.38 : 1 }}
        transition={ink.dis}
        style={{ position: 'relative' }}
      >
        <button
          type="button"
          disabled={graded}
          onClick={() => onPick(index)}
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
              // color switches without transition — instant is confident
              color: isOk ? 'var(--ok)' : isBad ? 'var(--bad)' : 'var(--muted)',
            }}
          >
            {isOk ? '✓' : isBad ? '×' : String.fromCharCode(97 + index)}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 17,
              color: isOk ? 'var(--ok)' : isBad ? 'var(--bad)' : 'var(--ink)',
              textDecoration: isBad ? 'line-through' : 'none',
              textDecorationThickness: isBad ? 1.5 : undefined,
            }}
          >
            {opt}
          </span>
        </button>
        <div style={{ height: 1, background: 'var(--hairline-2)' }} />
      </motion.div>
    </Sats>
  )
}

function F1Drill({
  due,
  onAnswer,
  onDone,
}: {
  due: number
  onAnswer: (right: boolean, repetition: boolean) => void
  onDone: (right: number) => void
}) {
  const ink = useSats()
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
        ? 'dom · kvitto k750 c48, 6 px — systemets största budget'
        : 'dom · fel: färg direkt, resten viker undan 120 ms',
    )
    onAnswer(ok, q.repetition)
  }

  const next = () => {
    if (qIndex >= QUESTIONS.length - 1) {
      ink.note('drill→klart · 70 ms ut ⟂ in +40 ms')
      onDone(rightCount)
      return
    }
    ink.note('frågeväxling · 70 ms ut ⟂ in +40 ms — känns som ett kliv, inte klipp')
    setQIndex((n) => n + 1)
    setPicked(null)
  }

  return (
    <div style={{ padding: '26px 30px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={eyebrow}>
          ORD · fråga {qIndex + 1}/{QUESTIONS.length}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 22,
              color: 'var(--accent)',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            <DigitRoll value={due} transition={ink.snitt} rm={ink.rm} />
          </span>
          <span style={{ ...monoSmall, textTransform: 'uppercase' }}>att repetera</span>
        </div>
      </div>
      <div style={{ height: 1, background: 'var(--ink)', margin: '12px 0 0' }} />

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={qIndex}
          initial={ink.rm ? { opacity: 0 } : { opacity: 0, y: 4 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { ...ink.ansats, delay: ink.rm ? 0 : 0.04 / ink.s },
          }}
          exit={{ opacity: 0, transition: ink.ut }}
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
            <F1OptionRow
              key={opt}
              opt={opt}
              index={i}
              graded={graded}
              picked={picked}
              correct={q.correct}
              step={1 + i}
              onPick={pick}
            />
          ))}

          <div style={{ minHeight: 96, paddingTop: 14 }}>
            <AnimatePresence mode="popLayout">
              {graded && (
                <motion.div
                  key="verdict"
                  initial={ink.rm ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: ink.ut }}
                  transition={ink.kvitto}
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
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ...ink.dis, delay: ink.rm ? 0 : 0.06 / ink.s }}
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
                  {!right && !q.repetition && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ ...ink.dis, delay: ink.rm ? 0 : 0.09 / ink.s }}
                      style={{ ...monoSmall, marginTop: 8 }}
                    >
                      lades i repetitionskön — siffran räknades upp
                    </motion.div>
                  )}
                  {right && q.repetition && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ ...ink.dis, delay: ink.rm ? 0 : 0.09 / ink.s }}
                      style={{ ...monoSmall, marginTop: 8 }}
                    >
                      repetitionen satt — siffran räknades ned
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ...ink.dis, delay: ink.rm ? 0 : 0.12 / ink.s }}
                    style={{ marginTop: 14 }}
                  >
                    <Press
                      label={qIndex >= QUESTIONS.length - 1 ? 'Avsluta passet →' : 'Nästa →'}
                      rm={ink.rm}
                      transition={ink.snitt}
                      onClick={next}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            {!graded && (
              <Sats step={7} style={monoSmall}>
                välj a–e — domen stiger 6 px, resten viker undan
              </Sats>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function F1Klart({
  rightCount,
  due,
  onHome,
}: {
  rightCount: number
  due: number
  onHome: () => void
}) {
  const ink = useSats()
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
        <Sats step={0}>
          <div style={{ height: 1, background: 'var(--ink)' }} />
        </Sats>
        <Sats step={0} style={{ marginTop: 14 }}>
          <div style={eyebrow}>ORD · passet är slut</div>
        </Sats>
        <Sats step={1}>
          <div
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
          </div>
        </Sats>
        <Sats step={2}>
          <p
            style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-2)', margin: '10px 0 0' }}
          >
            {rightCount} av {QUESTIONS.length} rätt. {due} kvar i repetitionskön — nästa pass väntar
            i morgon.
          </p>
        </Sats>
        <Sats step={3} style={{ margin: '18px 0 0' }}>
          <div style={{ height: 1, background: 'var(--hairline)' }} />
        </Sats>
      </div>
      <Sats step={4} style={{ marginTop: 20 }}>
        <Press
          label="Tillbaka till Hem →"
          rm={ink.rm}
          transition={ink.snitt}
          onClick={() => {
            ink.note('klart→hem · 70 ms ut ⟂ in +40 ms')
            onHome()
          }}
        />
      </Sats>
    </div>
  )
}

/** F1 rail: the tick does not travel — it withdraws here, lands there.
 *  Out leads (70 ms), in follows 40 ms later. Attention moves; ink
 *  does not. */
function F1Rail({ scene, due, go }: { scene: F1SceneKey; due: number; go: (s: Scene) => void }) {
  const ink = useSats()
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
              ink.note('flikbyte · strecket släcks 70 ms, tänds +40 ms — inget färdas')
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
            }}
          >
            <motion.span
              aria-hidden
              animate={{ opacity: active ? 1 : 0 }}
              transition={active ? { ...ink.dis, delay: ink.rm ? 0 : 0.04 / ink.s } : ink.ut}
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
                {/* while the drill's header carries the count, the rail
                    copy recedes — opacity, never travel (one accent
                    numeral visible at a time) */}
                <motion.span
                  animate={{ opacity: scene === 'drill' ? 0 : 1 }}
                  transition={ink.dis}
                  style={{ ...monoSmall, color: 'var(--accent)', lineHeight: 1 }}
                >
                  <DigitRoll value={due} transition={ink.snitt} rm={ink.rm} />
                </motion.span>
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

type F1SceneKey = Scene | 'klart'

function F1Flow() {
  const rm = useReducedMotion() === true
  const [speed, setSpeed] = useState(1)
  const [last, setLast] = useState('—')
  const [scene, setScene] = useState<F1SceneKey>('hem')
  const [due, setDue] = useState(14)
  const [drillKey, setDrillKey] = useState(0)
  const [rightCount, setRightCount] = useState(0)

  const regi = useMemo<Regi>(() => ({ s: speed, rm, note: (l) => setLast(l) }), [speed, rm])

  const go = (s: F1SceneKey) => {
    if (s === 'drill') setDrillKey((k) => k + 1)
    setScene(s)
  }

  return (
    <RegiCtx.Provider value={regi}>
      <MotionConfig reducedMotion="user">
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
          <F1Rail scene={scene} due={due} go={go} />
          <div aria-hidden style={{ width: 1, background: 'var(--hairline)' }} />
          <div style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={scene === 'drill' ? `drill-${drillKey}` : scene}
                initial={rm ? { opacity: 0 } : { opacity: 0, y: 4 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: rm
                    ? { duration: 0 }
                    : {
                        type: 'spring',
                        stiffness: 1100 * speed * speed,
                        damping: 68 * speed,
                        mass: 0.7,
                        delay: 0.04 / speed,
                      },
                }}
                exit={{
                  opacity: 0,
                  transition: rm ? { duration: 0 } : { duration: 0.07 / speed, ease: EASE_EXIT },
                }}
              >
                {scene === 'hem' && <F1Hem go={go} />}
                {scene === 'ova' && <F1Ova go={go} due={due} />}
                {scene === 'drill' && (
                  <F1Drill
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
                  <F1Klart rightCount={rightCount} due={due} onHome={() => go('hem')} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <RegiPanel
            scene={scene}
            last={last}
            speed={speed}
            setSpeed={setSpeed}
            rm={rm}
            springLine="ansats k1100 c68 · kvitto k750 c48 · snitt k1500 c80 · ut 70 ms"
          />
        </div>
      </MotionConfig>
    </RegiCtx.Provider>
  )
}

/* ════════════════════════════════════════════════════════════════════
 * F2 · ARKET — total continuity
 * ════════════════════════════════════════════════════════════════════ */

function useArk() {
  const f = useRegiFactories()
  return useMemo(
    () => ({
      ...f,
      /** anchor + container morphs — the material rearranging. */
      arket: f.spring(320, 36, 1),
      /** the ribbon pan — paper has mass. */
      remsan: f.spring(240, 30, 1.15),
      /** small in-place layout shifts (rows closing up). */
      veck: f.spring(480, 40, 0.8),
      /** ink drying onto the sheet: ✓, strike, glosses. Zero travel. */
      tork: f.tween(0.24),
      /** the only exit F2 allows: non-shared ink lifts off, 120 ms. */
      ut: f.tween(0.12, EASE_EXIT),
    }),
    [f],
  )
}

/** Ink surfacing on the moving material: opacity only, zero travel. */
function Tork({
  delay = 0,
  children,
  style,
}: {
  delay?: number
  children: ReactNode
  style?: CSSProperties
}) {
  const ark = useArk()
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...ark.tork, delay: ark.rm ? 0 : delay / ark.s }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/** The word "Öva" — one object with three stations:
 *  Hem CTA row (17 px) → Öva headline (36 px) → drill eyebrow (11 px). */
function ArkOva({ size, style }: { size: number; style?: CSSProperties }) {
  const ark = useArk()
  return (
    <motion.span
      layoutId={ark.rm ? undefined : 'ark-ova'}
      transition={ark.arket}
      style={{
        display: 'inline-block',
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        fontSize: size,
        letterSpacing: '-0.02em',
        lineHeight: 1.05,
        color: 'var(--ink)',
        ...style,
      }}
    >
      Öva
    </motion.span>
  )
}

/** The due numeral — three stations: rail folio → drill header →
 *  the Klart panel's sentence. It never stops existing. */
function ArkDue({ due, size }: { due: number; size: number }) {
  const ark = useArk()
  return (
    <motion.span
      layoutId={ark.rm ? undefined : 'f2-due'}
      transition={ark.arket}
      style={{
        display: 'inline-flex',
        fontFamily: 'var(--font-mono)',
        fontSize: size,
        color: 'var(--accent)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
      }}
    >
      <DigitRoll value={due} transition={ark.veck} rm={ark.rm} />
    </motion.span>
  )
}

function F2Hem({ go }: { go: (s: Scene) => void }) {
  const ark = useArk()
  return (
    <div style={{ padding: '26px 30px 24px' }}>
      <Tork>
        <div style={eyebrow}>Lördag 12 juli · 113 dagar kvar</div>
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
      </Tork>
      {/* the day-card: the same sheet the Klart panel is folded from */}
      <motion.div
        layoutId={ark.rm ? undefined : 'ark-kort'}
        transition={ark.arket}
        style={{
          border: '1px solid var(--hairline)',
          background: 'var(--panel)',
          padding: '18px 20px 16px',
          marginTop: 18,
          maxWidth: 420,
        }}
      >
        <Tork delay={0.05}>
          <div style={eyebrow}>Dagens pass</div>
          <p style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink-2)', margin: '8px 0 0' }}>
            ORD — tre frågor, varav en repetition från i onsdags.
          </p>
        </Tork>
        <div style={{ height: 1, background: 'var(--hairline-2)', margin: '14px 0 0' }} />
        <button
          type="button"
          onClick={() => {
            ark.note('hem→öva · ordet Öva växer till rubrik (arket k320 c36)')
            go('ova')
          }}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 10,
            width: '100%',
            padding: '12px 0 2px',
            border: 0,
            background: 'transparent',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <ArkOva size={17} />
          <span style={{ ...monoSmall }}>→ 3 frågor · ~4 min</span>
        </button>
      </motion.div>
      <Tork delay={0.1} style={{ display: 'flex', gap: 40, marginTop: 20 }}>
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
      </Tork>
      <Tork delay={0.14} style={{ ...monoSmall, marginTop: 22 }}>
        s. 1 · hem
      </Tork>
    </div>
  )
}

function F2Ova({ go, due }: { go: (s: Scene) => void; due: number }) {
  const ark = useArk()
  return (
    <div style={{ padding: '26px 30px 24px' }}>
      <Tork>
        <div style={eyebrow}>Öva · repetera</div>
      </Tork>
      <div style={{ margin: '8px 0 0' }}>
        <ArkOva size={36} />
      </div>
      <Tork delay={0.05}>
        <p
          style={{ fontSize: 14.5, color: 'var(--ink-2)', margin: '8px 0 14px', maxWidth: '44ch' }}
        >
          {due} att repetera — ORD är varmast, börja där.
        </p>
      </Tork>
      <div style={{ height: 1, background: 'var(--ink)' }} />
      {LEDGER.map((row, i) => (
        <div key={row.code}>
          <button
            type="button"
            disabled={row.code !== 'ORD'}
            onClick={() => {
              if (row.code !== 'ORD') return
              ark.note('öva→drill · ORD blir sidhuvud, siffran flyttar in (arket)')
              go('drill')
            }}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 12,
              width: '100%',
              padding: '11px 0',
              border: 0,
              background: 'transparent',
              textAlign: 'left',
              cursor: row.code === 'ORD' ? 'pointer' : 'default',
            }}
          >
            {row.code === 'ORD' ? (
              <motion.span
                layoutId={ark.rm ? undefined : 'ark-ord'}
                transition={ark.arket}
                style={{ ...monoSmall, color: 'var(--ink-2)', width: 34, display: 'inline-block' }}
              >
                ORD
              </motion.span>
            ) : (
              <span style={{ ...monoSmall, color: 'var(--ink-2)', width: 34 }}>{row.code}</span>
            )}
            <Tork delay={0.04 + i * 0.03} style={{ display: 'contents' }}>
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
              <span style={monoSmall}>{row.code === 'ORD' ? 'öppna →' : row.n}</span>
            </Tork>
          </button>
          <div style={{ height: 1, background: 'var(--hairline-2)' }} />
        </div>
      ))}
      <Tork delay={0.2} style={{ ...monoSmall, marginTop: 20 }}>
        s. 4 · öva — raden ORD är dörren; koden följer med in
      </Tork>
    </div>
  )
}

/** One question block on the ribbon. Verdict = the picked row BECOMES
 *  the verdict line (layoutId morph); marks dry in place. */
function F2Question({
  q,
  qi,
  picked,
  onPick,
  onNext,
  isLast,
  active,
}: {
  q: OrdQ
  qi: number
  picked: number | null
  onPick: (i: number) => void
  onNext: () => void
  isLast: boolean
  active: boolean
}) {
  const ark = useArk()
  const graded = picked !== null
  const right = graded && picked === q.correct
  const wordId = (i: number) => `f2-q${qi}-w${i}`
  return (
    <div style={{ padding: '18px 0 26px', opacity: active ? 1 : undefined }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, margin: '0 0 10px' }}>
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
      {q.options.map((opt, i) => {
        const isPicked = graded && i === picked
        const isOk = graded && i === q.correct
        // the picked row leaves the list — it is DOWN at the verdict now
        if (isPicked) return null
        return (
          <motion.div key={opt} layout={!ark.rm} transition={ark.veck}>
            <button
              type="button"
              disabled={graded || !active}
              onClick={() => onPick(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '10px 10px',
                border: 0,
                background: 'transparent',
                textAlign: 'left',
                cursor: graded || !active ? 'default' : 'pointer',
              }}
            >
              <span style={{ ...monoSmall, color: isOk ? 'var(--ok)' : 'var(--muted)' }}>
                {String.fromCharCode(97 + i)}
              </span>
              <motion.span
                layoutId={ark.rm ? undefined : wordId(i)}
                transition={ark.arket}
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--font-display)',
                  fontSize: 17,
                  color: isOk ? 'var(--ok)' : graded ? 'var(--muted)' : 'var(--ink)',
                }}
              >
                {opt}
              </motion.span>
              {isOk && !right && (
                <Tork style={{ ...monoSmall, color: 'var(--ok)' }}>✓ rätt svar</Tork>
              )}
            </button>
            <div style={{ height: 1, background: 'var(--hairline-2)' }} />
          </motion.div>
        )
      })}

      {/* the verdict slot — the picked word lands here and the ink dries */}
      <motion.div layout={!ark.rm} transition={ark.veck} style={{ minHeight: 96, paddingTop: 16 }}>
        {graded && picked !== null && (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <motion.span
                layoutId={ark.rm ? undefined : wordId(picked)}
                transition={ark.arket}
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontWeight: 600,
                  fontSize: 30,
                  lineHeight: 1.1,
                  color: right ? 'var(--ok)' : 'var(--bad)',
                  position: 'relative',
                }}
              >
                {q.options[picked]}
                {!right && (
                  <motion.span
                    aria-hidden
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={ark.tork}
                    style={{
                      position: 'absolute',
                      left: -3,
                      right: -3,
                      top: '54%',
                      height: 1.8,
                      background: 'var(--bad)',
                    }}
                  />
                )}
              </motion.span>
              <Tork
                delay={0.08}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontWeight: 600,
                  fontSize: 22,
                  color: right ? 'var(--ok)' : 'var(--bad)',
                }}
              >
                {right ? '— rätt.' : '— fel.'}
              </Tork>
            </div>
            <Tork delay={0.12}>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: 'var(--ink-2)',
                  maxWidth: '52ch',
                  margin: '8px 0 0',
                }}
              >
                <em>{q.options[q.correct]}</em> — {q.gloss}
              </p>
            </Tork>
            {!right && !q.repetition && (
              <Tork delay={0.18} style={{ ...monoSmall, marginTop: 8 }}>
                lades i repetitionskön — siffran i sidhuvudet räknades upp
              </Tork>
            )}
            {right && q.repetition && (
              <Tork delay={0.18} style={{ ...monoSmall, marginTop: 8 }}>
                repetitionen satt — siffran räknades ned
              </Tork>
            )}
            {/* only the active question offers the step forward — past
                verdicts stay on the ribbon as marks, not controls */}
            {active && (
              <Tork delay={0.22} style={{ marginTop: 14 }}>
                <Press
                  label={isLast ? 'Vidare till Klart →' : 'Nästa →'}
                  rm={ark.rm}
                  transition={ark.veck}
                  onClick={onNext}
                />
              </Tork>
            )}
          </div>
        )}
        {!graded && (
          <Tork delay={0.1} style={monoSmall}>
            välj a–e — ordet du pekar på blir domen; märkena torkar på plats
          </Tork>
        )}
      </motion.div>
    </div>
  )
}

type F2Stage = { qIndex: number; atKlart: boolean }

function F2Drill({
  due,
  stage,
  answers,
  rightCount,
  onPick,
  onNext,
  onHome,
  panY,
}: {
  due: number
  stage: F2Stage
  answers: readonly (number | null)[]
  rightCount: number
  onPick: (qi: number, i: number) => void
  onNext: () => void
  onHome: () => void
  panY: number
}) {
  const ark = useArk()
  return (
    <div style={{ padding: '26px 30px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <ArkOva size={11} style={{ color: 'var(--muted)', letterSpacing: '0.1em' }} />
          <motion.span
            layoutId={ark.rm ? undefined : 'ark-ord'}
            transition={ark.arket}
            style={{ ...eyebrow, color: 'var(--ink)', display: 'inline-block' }}
          >
            ORD
          </motion.span>
          <span style={eyebrow}>
            · fråga {Math.min(stage.qIndex + 1, QUESTIONS.length)}/{QUESTIONS.length}
          </span>
        </div>
        {/* station 2 of 3: while the pass runs, the numeral lives here */}
        {!stage.atKlart && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <ArkDue due={due} size={22} />
            <span style={{ ...monoSmall, textTransform: 'uppercase' }}>att repetera</span>
          </div>
        )}
      </div>
      <div style={{ height: 1, background: 'var(--ink)', margin: '12px 0 0' }} />

      {/* the ribbon: all questions + Klart are ONE strip; the camera pans */}
      <div style={{ height: 430, overflow: 'hidden', position: 'relative' }}>
        {/* rm: remsan is {duration:0}, so the pan becomes an instant jump */}
        <motion.div animate={{ y: -panY }} transition={ark.remsan}>
          {QUESTIONS.map((q, qi) => (
            <div key={q.headword} data-f2-block={qi}>
              <F2Question
                q={q}
                qi={qi}
                picked={answers[qi] ?? null}
                onPick={(i) => onPick(qi, i)}
                onNext={onNext}
                isLast={qi === QUESTIONS.length - 1}
                active={!stage.atKlart && qi === stage.qIndex}
              />
            </div>
          ))}
          {/* the foot of the ribbon: the Klart panel — same sheet as
              Hem's day-card (layoutId ark-kort) */}
          <div data-f2-block="klart" style={{ padding: '10px 0 30px' }}>
            {stage.atKlart && (
              <motion.div
                layoutId={ark.rm ? undefined : 'ark-kort'}
                transition={ark.arket}
                style={{
                  border: '1px solid var(--hairline)',
                  background: 'var(--panel)',
                  padding: '24px 26px 20px',
                  maxWidth: 380,
                }}
              >
                <div style={{ height: 1, background: 'var(--ink)' }} />
                <Tork delay={0.06} style={{ marginTop: 14 }}>
                  <div style={eyebrow}>ORD · passet är slut</div>
                  <div
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
                  </div>
                </Tork>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 6,
                    flexWrap: 'wrap',
                    fontSize: 14.5,
                    lineHeight: 1.55,
                    color: 'var(--ink-2)',
                    margin: '10px 0 0',
                  }}
                >
                  <Tork delay={0.12} style={{ display: 'inline' }}>
                    {rightCount} av {QUESTIONS.length} rätt.
                  </Tork>
                  {/* station 3 of 3: the numeral lands in the sentence */}
                  <ArkDue due={due} size={15} />
                  <Tork delay={0.12} style={{ display: 'inline' }}>
                    kvar i repetitionskön — nästa pass väntar i morgon.
                  </Tork>
                </div>
                <Tork delay={0.2} style={{ marginTop: 16 }}>
                  <Press
                    label="Tillbaka till Hem →"
                    rm={ark.rm}
                    transition={ark.veck}
                    onClick={onHome}
                  />
                </Tork>
              </motion.div>
            )}
          </div>
        </motion.div>
        {/* reading edge: the ribbon fades under the fold */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 28,
            background: 'linear-gradient(to bottom, transparent, var(--bg))',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  )
}

function F2Rail({ scene, due, go }: { scene: Scene; due: number; go: (s: Scene) => void }) {
  const ark = useArk()
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
              ark.note('bläckstrecket färdas · layoutId (arket k320 c36)')
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
            }}
          >
            {active && (
              <motion.span
                aria-hidden
                layoutId={ark.rm ? undefined : 'f2-tick'}
                transition={ark.arket}
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
                {/* station 1 of 3 — empty while the numeral is away */}
                {numeralInRail && <ArkDue due={due} size={10.5} />}
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

function F2Flow() {
  const rm = useReducedMotion() === true
  const [speed, setSpeed] = useState(1)
  const [last, setLast] = useState('—')
  const [scene, setScene] = useState<Scene>('hem')
  const [due, setDue] = useState(14)
  const [stage, setStage] = useState<F2Stage>({ qIndex: 0, atKlart: false })
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null])
  const [panY, setPanY] = useState(0)
  const stripHost = useRef<HTMLDivElement>(null)

  const regi = useMemo<Regi>(() => ({ s: speed, rm, note: (l) => setLast(l) }), [speed, rm])
  const rightCount = answers.filter((a, i) => a !== null && a === QUESTIONS[i]?.correct).length

  const go = (s: Scene) => {
    if (s === 'drill') {
      setStage({ qIndex: 0, atKlart: false })
      setAnswers([null, null, null])
      setPanY(0)
    }
    setScene(s)
  }

  const panTo = (block: string) => {
    const el = stripHost.current?.querySelector<HTMLElement>(`[data-f2-block="${block}"]`)
    if (el) setPanY(el.offsetTop)
  }

  const pick = (qi: number, i: number) => {
    setAnswers((a) => {
      if (a[qi] !== null) return a
      const nextA = [...a]
      nextA[qi] = i
      return nextA
    })
    const q = QUESTIONS[qi]
    if (!q) return
    const ok = i === q.correct
    if (!ok && !q.repetition) setDue((n) => n + 1)
    if (ok && q.repetition) setDue((n) => n - 1)
    setLast(
      ok
        ? 'domen · raden du valde BLEV domen (arket) · ✓ torkar 240 ms'
        : 'domen · felvalet flyttar ned, strecket torkar på plats',
    )
  }

  const next = () => {
    if (stage.qIndex >= QUESTIONS.length - 1) {
      setStage({ qIndex: QUESTIONS.length - 1, atKlart: true })
      // let the Klart panel mount, then pan the ribbon to its foot
      requestAnimationFrame(() => panTo('klart'))
      setLast('remsan rullar till Klart · remsan k240 c30 m1,15 — samma ark')
      return
    }
    const target = stage.qIndex + 1
    setStage({ qIndex: target, atKlart: false })
    panTo(String(target))
    setLast('remsan rullar en fråga · dina domar står kvar ovanför')
  }

  return (
    <RegiCtx.Provider value={regi}>
      <MotionConfig reducedMotion="user">
        <LayoutGroup>
          <div
            ref={stripHost}
            style={{
              position: 'relative',
              display: 'flex',
              width: 780,
              maxWidth: '100%',
              minHeight: 540,
              border: '1px solid var(--hairline)',
              background: 'var(--bg)',
            }}
          >
            <F2Rail scene={scene} due={due} go={go} />
            <div aria-hidden style={{ width: 1, background: 'var(--hairline)' }} />
            <div style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={scene}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: rm
                      ? { duration: 0 }
                      : { duration: 0.24 / speed, ease: EASE_READING },
                  }}
                  exit={{
                    opacity: 0,
                    transition: rm ? { duration: 0 } : { duration: 0.12 / speed, ease: EASE_EXIT },
                  }}
                >
                  {scene === 'hem' && <F2Hem go={go} />}
                  {scene === 'ova' && <F2Ova go={go} due={due} />}
                  {scene === 'drill' && (
                    <F2Drill
                      due={due}
                      stage={stage}
                      answers={answers}
                      rightCount={rightCount}
                      onPick={pick}
                      onNext={next}
                      onHome={() => {
                        setLast('klart→hem · panelen viks tillbaka till dagskortet (ark-kort)')
                        go('hem')
                      }}
                      panY={panY}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <RegiPanel
              scene={scene === 'drill' && stage.atKlart ? 'drill · klart' : scene}
              last={last}
              speed={speed}
              setSpeed={setSpeed}
              rm={rm}
              springLine="arket k320 c36 · remsan k240 c30 m1,15 · veck k480 c40 · tork 240 ms"
            />
          </div>
        </LayoutGroup>
      </MotionConfig>
    </RegiCtx.Provider>
  )
}

/* ── exports ─────────────────────────────────────────────────────── */

/** MOTF1 · Sättningen — the disappearing spring. */
export function MOTF1() {
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
        MOTF1 · Sättningen
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
        I en väl satt bok ser du aldrig sättarens hand — bara kvaliteten. Här är rörelsen nästan
        osynlig: inget färdas mer än sex pixlar, fjädrarna sätter sig på 110–220 ms, och all mening
        bärs av ordningen — vad som leder, vad som följer, med hur många millisekunder. Domen är den
        enda plats som får systemets fulla budget (6 px, ~220 ms); felaktiga alternativ rör sig
        aldrig — de viker undan i opacitet. Sidbyten känns omedelbara men klipper aldrig: 70 ms ut,
        ingång 40 ms senare. Växla till 0,5× i regi-panelen för att bevisa att rörelsen alls finns.
      </p>
      <F1Flow />
      <div style={{ ...monoSmall, marginTop: 16, maxWidth: '78ch', lineHeight: 1.6 }}>
        ansats k1100 c68 m0,7 (ingångar, 4 px) · kvitto k750 c48 m0,85 (domen, 6 px) · snitt k1500
        c80 m0,6 (mikro) · ut 70 ms · vik-undan 120 ms · led/följ i 30 ms-steg. Inga delade element,
        inga ritade märken — under tröskeln är förtroende.
      </div>
    </div>
  )
}

/** MOTF2 · Arket — total continuity. */
export function MOTF2() {
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
        MOTF2 · Arket
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
        Ett enda ark, aldrig rivet: ingenting dyker upp eller försvinner — varje sidbyte är samma
        material som ordnar om sig. Ordet Öva växer från dagskortets rad till sidrubrik och krymper
        till drillens sidhuvud; ORD-koden i förteckningen blir sidhuvudets ORD; kö-siffran har tre
        stationer (förteckningen → drillens huvud → Klart-panelens mening) och slutar aldrig
        existera. Drillen är en enda pappersremsa — tre frågor och Klart-panelen — som kameran
        panorerar; dina domar står kvar ovanför när remsan rullar. Raden du pekar på BLIR domen.
        Arkets första lag vänder på Bläckets: märken rör sig aldrig — papperet rör sig; bläck bara
        torkar.
      </p>
      <F2Flow />
      <div style={{ ...monoSmall, marginTop: 16, maxWidth: '78ch', lineHeight: 1.6 }}>
        arket k320 c36 m1 (morfar — ankare och ytor) · remsan k240 c30 m1,15 (remsan; papper har
        massa) · veck k480 c40 m0,8 (rader som sluter sig) · tork 240 ms (bläck som torkar — noll
        färd). Klart-panelen och dagskortet på Hem är samma ark (layoutId ark-kort).
      </div>
    </div>
  )
}

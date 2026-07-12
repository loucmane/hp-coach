// MotionArketRedigerad — round 4 of the motion bake-off.
//
//   MOTA1 "Arket, redigerad" — F2 "Arket" (total continuity, the owner's
//   base) grafted with F4 "Greppet"'s drag-to-commit, then improved by
//   SUBTRACTION. The editing rule: continuity stays where it carries
//   meaning (the material — card, ribbon, tick, the door word, the
//   numeral, the picked word), and is CUT where it performs (flying
//   specks, numerals threading into sentences, staggered fade cascades).
//
//   What was cut from Arket, and why:
//   · the Öva word's third station (36 px headline → 11 px drill
//     eyebrow) — a word shrinking into an eyebrow reads as a flying
//     speck on the twentieth repetition. The word keeps ONE morph:
//     day-card row → Öva headline (the door opening). In the drill the
//     eyebrow simply prints.
//   · the due numeral's third station (drill header → Klart sentence)
//     — a numeral threading itself into running prose is a demo flex;
//     at Klart the count is information, so it prints as prose. The
//     numeral keeps two stations: rail ↔ drill header.
//   · ALL tork stagger cascades (per-row +30 ms delays, 4-beat verdict
//     builds) — element-by-element fade-ins are slide-deck builds. A
//     scene now dries in ONE beat (the scene fade IS the ink drying);
//     the verdict has exactly TWO beats (word, then meta+action).
//   · Greppet's hover nudge, the UI "ankomstfart" label, and the
//     pathLength check — affordance is cursor + groove-on-pull;
//     velocity honesty lives in the regi panel; marks dry (tork),
//     they are never drawn.
//
//   The drag-commit graft, in Arket's material language: the answer
//   row is paper under your finger. The groove and detent tick only
//   materialize once you pull (at rest the page is clean print). Past
//   the detent (72 px) the row arms; on release the row you dragged
//   BECOMES the verdict (Arket's law: layoutId morph) and your release
//   velocity is carried into that morph (Greppet's law: input velocity
//   is never discarded). Click and Enter/Space commit the same path
//   with velocity 0.
//
//     ark    k=420 c=42 m=1    — all layoutId morphs (word→dom, kort,
//                                ord, tick, Öva), settles ~300 ms
//     remsa  k=300 c=36 m=1    — the ribbon pan; paper mass, ~420 ms
//     veck   k=520 c=42 m=0.8  — rows closing up, one gesture
//     grepp  k=620 c=42 m=0.9  — a released row seating (velocity in)
//     tork   180 ms tween      — ink drying (opacity, zero travel)
//     recede 140 ms tween      — unpicked rows dim to 0.45
//
//   Budget: commit → verdict word settled ~300 ms, gloss + Nästa dry
//   by ~260 ms; the pan settles ~420 ms and the next question is
//   interactive from the first frame of the pan (it never unmounted).
//
// Shared discipline: motion confirms causality, nothing loops or
// idles; transform/opacity only; accent pixels only where they already
// live (active ToC row, the one due numeral); verdict color is
// semantic --ok/--bad ink; useReducedMotion collapses everything to
// opacity-or-nothing (no morphs, no pan travel, no drag — rows become
// plain buttons). Every spring is interruptible.
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

/* ── fixtures: three real ORD items ──────────────────────────────── */

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

/* ── regi plumbing ────────────────────────────────────────────────
 * Honest time-scaling: stiffness×s² and damping×s plays the same
 * spring curve at 1/s speed; tweens divide duration.
 */

type Regi = { s: number; rm: boolean; note: (label: string) => void }
const RegiCtx = createContext<Regi>({ s: 1, rm: false, note: () => {} })

type Bezier = [number, number, number, number]
const EASE_READING: Bezier = [0.16, 1, 0.3, 1]
const EASE_EXIT: Bezier = [0.7, 0, 0.84, 0]

const DETENT = 72
const HARDSTOP = 88

function useArk() {
  const { s, rm, note } = useContext(RegiCtx)
  return useMemo(() => {
    const spring = (stiffness: number, damping: number, mass = 1): Transition =>
      rm
        ? { duration: 0 }
        : { type: 'spring', stiffness: stiffness * s * s, damping: damping * s, mass }
    const tween = (duration: number, ease: Bezier = EASE_READING): Transition =>
      rm ? { duration: 0 } : { duration: duration / s, ease }
    return {
      s,
      rm,
      note,
      /** all layoutId morphs — the material rearranging, ~300 ms. */
      ark: spring(420, 42, 1),
      /** the ribbon pan — paper mass, settles ~420 ms. */
      remsa: spring(300, 36, 1),
      /** rows closing up after the picked one leaves — one gesture. */
      veck: spring(520, 42, 0.8),
      /** a released row seating home (drag velocity passed in). */
      grepp: spring(620, 42, 0.9),
      /** ink drying: glosses, meta, ✓, strike. Zero travel. */
      tork: tween(0.18),
      /** unpicked rows withdrawing — opacity only. */
      recede: tween(0.14),
      /** scene exits. */
      ut: tween(0.1, EASE_EXIT),
      /** scene entrances — the whole page dries as one beat. */
      in: tween(0.18),
    }
  }, [s, rm, note])
}

/** Ink drying on the sheet: opacity only, zero travel. Used only where
 *  a beat is meaningful (verdict word, then meta) — never as a cascade. */
function Tork({
  delay = 0,
  children,
  style,
}: {
  delay?: number
  children: ReactNode
  style?: CSSProperties
}) {
  const a = useArk()
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...a.tork, delay: a.rm ? 0 : delay / a.s }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/** Masked per-digit roll, direction-aware. */
function DigitRoll({ value }: { value: number }) {
  const a = useArk()
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
              custom={dir}
              initial={a.rm ? { opacity: 0 } : { y: `${dir * 0.9}em`, opacity: 0 }}
              animate={{ y: '0em', opacity: 1 }}
              exit={a.rm ? { opacity: 0 } : { y: `${dir * -0.9}em`, opacity: 0 }}
              transition={a.veck}
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

/** Mono action button. */
function Press({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  const a = useArk()
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={a.rm ? undefined : { scale: 0.97 }}
      transition={a.grepp}
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

/** The word "Öva" — ONE morph: Hem day-card row (17 px) → Öva headline
 *  (36 px). The third station (drill eyebrow) was cut. */
function ArkOva({ size, style }: { size: number; style?: CSSProperties }) {
  const a = useArk()
  return (
    <motion.span
      layoutId={a.rm ? undefined : 'a1-ova'}
      transition={a.ark}
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

/** The due numeral — TWO stations: rail folio ↔ drill header. The
 *  third station (into the Klart sentence) was cut: at Klart the count
 *  is prose, not an object. */
function ArkDue({ due, size }: { due: number; size: number }) {
  const a = useArk()
  return (
    <motion.span
      layoutId={a.rm ? undefined : 'a1-due'}
      transition={a.ark}
      style={{
        display: 'inline-flex',
        fontFamily: 'var(--font-mono)',
        fontSize: size,
        color: 'var(--accent)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
      }}
    >
      <DigitRoll value={due} />
    </motion.span>
  )
}

/* ── scenes ───────────────────────────────────────────────────────── */

function A1Hem({ go }: { go: (s: Scene) => void }) {
  const a = useArk()
  return (
    <div style={{ padding: '26px 30px 24px' }}>
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
      {/* the day-card: the same sheet the Klart panel is folded from */}
      <motion.div
        layoutId={a.rm ? undefined : 'a1-kort'}
        transition={a.ark}
        style={{
          border: '1px solid var(--hairline)',
          background: 'var(--panel)',
          padding: '18px 20px 16px',
          marginTop: 18,
          maxWidth: 420,
        }}
      >
        <div style={eyebrow}>Dagens pass</div>
        <p style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink-2)', margin: '8px 0 0' }}>
          ORD — tre frågor, varav en repetition från i onsdags.
        </p>
        <div style={{ height: 1, background: 'var(--hairline-2)', margin: '14px 0 0' }} />
        <button
          type="button"
          onClick={() => {
            a.note('hem→öva · ordet Öva växer till rubrik (ark k420 c42) — dess enda morf')
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
      <div style={{ ...monoSmall, marginTop: 22 }}>s. 1 · hem</div>
    </div>
  )
}

function A1Ova({ go, due }: { go: (s: Scene) => void; due: number }) {
  const a = useArk()
  return (
    <div style={{ padding: '26px 30px 24px' }}>
      <div style={eyebrow}>Öva · repetera</div>
      <div style={{ margin: '8px 0 0' }}>
        <ArkOva size={36} />
      </div>
      <p style={{ fontSize: 14.5, color: 'var(--ink-2)', margin: '8px 0 14px', maxWidth: '44ch' }}>
        {due} att repetera — ORD är varmast, börja där.
      </p>
      <div style={{ height: 1, background: 'var(--ink)' }} />
      {LEDGER.map((row) => (
        <div key={row.code}>
          <button
            type="button"
            disabled={row.code !== 'ORD'}
            onClick={() => {
              if (row.code !== 'ORD') return
              a.note('öva→drill · ORD blir sidhuvud, siffran flyttar in (ark)')
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
                layoutId={a.rm ? undefined : 'a1-ord'}
                transition={a.ark}
                style={{ ...monoSmall, color: 'var(--ink-2)', width: 34, display: 'inline-block' }}
              >
                ORD
              </motion.span>
            ) : (
              <span style={{ ...monoSmall, color: 'var(--ink-2)', width: 34 }}>{row.code}</span>
            )}
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
          </button>
          <div style={{ height: 1, background: 'var(--hairline-2)' }} />
        </div>
      ))}
      <div style={{ ...monoSmall, marginTop: 20 }}>s. 4 · öva — raden ORD är dörren</div>
    </div>
  )
}

/* ── the drag-commit row: paper under the finger ─────────────────── */

function DragRow({
  opt,
  index,
  qi,
  graded,
  picked,
  correct,
  active,
  onCommit,
}: {
  opt: string
  index: number
  qi: number
  graded: boolean
  picked: number | null
  correct: number
  active: boolean
  onCommit: (i: number, velocity: number) => void
}) {
  const a = useArk()
  const x = useMotionValue(0)
  const [armed, setArmed] = useState(false)
  const isOk = graded && index === correct
  const wasWrongPick = graded && picked !== correct
  const recede = graded && !isOk
  const canGrab = !a.rm && !graded && active
  // the groove only materializes once you actually pull — at rest the
  // page is clean print (MotionValue-mapped opacity, no re-render)
  const grooveOpacity = useTransform(x, [0, 14], [0, 0.4])
  const tickOpacity = useTransform(x, [0, 14, DETENT * 0.6, DETENT], [0, 0.3, 0.45, 1])

  const label = `${String.fromCharCode(97 + index)}. ${opt}`

  return (
    <motion.div
      layout={!a.rm}
      transition={a.veck}
      animate={{ opacity: recede ? 0.45 : 1 }}
      style={{ position: 'relative' }}
    >
      {canGrab && (
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
            style={{ width: 1.6, height: 12, background: 'var(--ink)', opacity: tickOpacity }}
          />
        </div>
      )}
      <motion.div
        role="button"
        tabIndex={graded || !active ? -1 : 0}
        aria-label={canGrab ? `${label} — dra förbi hacket eller tryck för att svara` : label}
        aria-disabled={graded || !active}
        drag={canGrab ? 'x' : false}
        dragConstraints={{ left: 0, right: HARDSTOP }}
        dragElastic={{ left: 0, right: 0.04 }}
        dragMomentum={false}
        style={{ x, position: 'relative', touchAction: 'pan-y', outlineOffset: 2 }}
        onDrag={() => {
          const past = x.get() >= DETENT
          if (past !== armed) {
            setArmed(past)
            if (past) a.note(`hack: ${opt} spänd vid ${DETENT} px — släpp för att svara`)
          }
        }}
        onDragEnd={(_, info) => {
          if (x.get() >= DETENT) {
            a.note(`släpp v=${Math.round(info.velocity.x)} px/s → raden blir domen; farten ärvs`)
            onCommit(index, info.velocity.x)
          } else {
            setArmed(false)
            a.note(`släpp v=${Math.round(info.velocity.x)} px/s före hacket → återfjädrad`)
            animate(x, 0, { ...(a.grepp as object), velocity: info.velocity.x } as Transition)
          }
        }}
        onTap={() => {
          if (!active || graded) return
          if (x.get() > 4) return // a real drag settling — not a click
          a.note('klickval — samma väg, fart 0')
          onCommit(index, 0)
        }}
        onKeyDown={(e: KeyboardEvent) => {
          if (!active || graded) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            a.note('tangentval — samma väg, fart 0')
            onCommit(index, 0)
          }
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 10px',
            cursor: graded || !active ? 'default' : canGrab ? 'grab' : 'pointer',
            background: armed && !graded ? 'var(--panel)' : 'transparent',
            transition: 'background 140ms ease',
          }}
        >
          <span style={{ ...monoSmall, color: isOk ? 'var(--ok)' : 'var(--muted)' }}>
            {String.fromCharCode(97 + index)}
          </span>
          <motion.span
            layoutId={a.rm ? undefined : `a1-q${qi}-w${index}`}
            transition={a.ark}
            style={{
              display: 'inline-block',
              fontFamily: 'var(--font-display)',
              fontSize: 17,
              color: isOk ? 'var(--ok)' : graded ? 'var(--muted)' : 'var(--ink)',
            }}
          >
            {opt}
          </motion.span>
          {isOk && wasWrongPick && (
            <Tork style={{ ...monoSmall, color: 'var(--ok)' }}>✓ rätt svar</Tork>
          )}
        </div>
      </motion.div>
      {/* the arming hint is printed on the page BENEATH the paper —
          it must not travel with the dragged row (it clipped at the
          fold when it did) */}
      {armed && !graded && (
        <span
          style={{
            ...monoSmall,
            color: 'var(--ink)',
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        >
          släpp = svara
        </span>
      )}
      <div aria-hidden style={{ height: 1, background: 'var(--hairline-2)' }} />
    </motion.div>
  )
}

/* ── one question block on the ribbon ─────────────────────────────── */

function A1Question({
  q,
  qi,
  picked,
  commitV,
  onCommit,
  onNext,
  isLast,
  active,
}: {
  q: OrdQ
  qi: number
  picked: number | null
  commitV: number
  onCommit: (qi: number, i: number, v: number) => void
  onNext: () => void
  isLast: boolean
  active: boolean
}) {
  const a = useArk()
  const graded = picked !== null
  const right = graded && picked === q.correct
  // Greppet's law: the release velocity is injected into the Arket
  // morph — the word arrives at the verdict slot with your hand's
  // energy. Clamped so a wild fling stays legible; click/keys pass 0.
  const morphV = Math.max(-500, Math.min(500, commitV * 0.5))
  const domTransition: Transition = a.rm ? { duration: 0 } : { ...a.ark, velocity: morphV }
  return (
    <div style={{ padding: '18px 0 26px' }}>
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
        // the picked row leaves the list — it IS the verdict now;
        // siblings close up in one veck gesture and recede in opacity
        if (graded && i === picked) return null
        return (
          <DragRow
            key={opt}
            opt={opt}
            index={i}
            qi={qi}
            graded={graded}
            picked={picked}
            correct={q.correct}
            active={active}
            onCommit={(i2, v) => onCommit(qi, i2, v)}
          />
        )
      })}

      {/* the verdict slot — the dragged word lands here, ink dries */}
      <motion.div layout={!a.rm} transition={a.veck} style={{ minHeight: 96, paddingTop: 16 }}>
        {graded && picked !== null && (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <motion.span
                layoutId={a.rm ? undefined : `a1-q${qi}-w${picked}`}
                transition={domTransition}
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
                    transition={a.tork}
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
            {/* beat two: gloss, queue note and the action dry together */}
            <Tork delay={0.08}>
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
              {!right && !q.repetition && (
                <div style={{ ...monoSmall, marginTop: 8 }}>
                  lades i repetitionskön — siffran i sidhuvudet räknades upp
                </div>
              )}
              {right && q.repetition && (
                <div style={{ ...monoSmall, marginTop: 8 }}>
                  repetitionen satt — siffran räknades ned
                </div>
              )}
              {/* space stays reserved when the block retires — a past
                  verdict keeps no control, but unmounting the button
                  would reflow the ribbon at pan start (a 44 px content
                  jump the settle check caught) */}
              <div
                style={{
                  marginTop: 14,
                  visibility: active ? 'visible' : 'hidden',
                  pointerEvents: active ? 'auto' : 'none',
                }}
              >
                <Press label={isLast ? 'Vidare till Klart →' : 'Nästa →'} onClick={onNext} />
              </div>
            </Tork>
          </div>
        )}
        {!graded && active && (
          <div style={monoSmall}>
            {a.rm
              ? 'tryck för att svara'
              : 'dra ett ord förbi hacket — raden du släpper blir domen'}
          </div>
        )}
      </motion.div>
    </div>
  )
}

/* ── the drill: one ribbon, a panning camera ─────────────────────── */

type Stage = { qIndex: number; atKlart: boolean }

function A1Drill({
  due,
  stage,
  answers,
  velocities,
  rightCount,
  onCommit,
  onNext,
  onHome,
  panY,
}: {
  due: number
  stage: Stage
  answers: readonly (number | null)[]
  velocities: readonly number[]
  rightCount: number
  onCommit: (qi: number, i: number, v: number) => void
  onNext: () => void
  onHome: () => void
  panY: number
}) {
  const a = useArk()
  return (
    <div style={{ padding: '26px 30px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          {/* the eyebrow prints — the Öva word's flight here was cut */}
          <span style={{ ...eyebrow, fontSize: 11 }}>Öva</span>
          <motion.span
            layoutId={a.rm ? undefined : 'a1-ord'}
            transition={a.ark}
            style={{ ...eyebrow, color: 'var(--ink)', display: 'inline-block' }}
          >
            ORD
          </motion.span>
          <span style={eyebrow}>
            · fråga {Math.min(stage.qIndex + 1, QUESTIONS.length)}/{QUESTIONS.length}
          </span>
        </div>
        {/* station 2 of 2: while the pass runs, the numeral lives here */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <ArkDue due={due} size={22} />
          <span style={{ ...monoSmall, textTransform: 'uppercase' }}>att repetera</span>
        </div>
      </div>
      <div style={{ height: 1, background: 'var(--ink)', margin: '12px 0 0' }} />

      {/* the ribbon: all questions + Klart are ONE strip; the camera
          pans. Questions never unmount — verdicts stay above you, and
          the next question is interactive from the pan's first frame. */}
      {/* 480 fits the tallest block (wrong verdict: gloss + queue note
          + action) with the fold clear of the Nästa button */}
      <div style={{ height: 480, overflow: 'hidden', position: 'relative' }}>
        <motion.div animate={{ y: -panY }} transition={a.remsa}>
          {QUESTIONS.map((q, qi) => (
            <div key={q.headword} data-a1-block={qi}>
              <A1Question
                q={q}
                qi={qi}
                picked={answers[qi] ?? null}
                commitV={velocities[qi] ?? 0}
                onCommit={onCommit}
                onNext={onNext}
                isLast={qi === QUESTIONS.length - 1}
                active={!stage.atKlart && qi === stage.qIndex}
              />
            </div>
          ))}
          {/* the foot of the ribbon: the Klart panel — same sheet as
              Hem's day-card (layoutId a1-kort) */}
          <div data-a1-block="klart" style={{ padding: '10px 0 30px' }}>
            {stage.atKlart && (
              <motion.div
                layoutId={a.rm ? undefined : 'a1-kort'}
                transition={a.ark}
                style={{
                  border: '1px solid var(--hairline)',
                  background: 'var(--panel)',
                  padding: '24px 26px 20px',
                  maxWidth: 380,
                }}
              >
                <div style={{ height: 1, background: 'var(--ink)' }} />
                <Tork style={{ marginTop: 14 }}>
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
                {/* the count is prose here — its flight into this
                    sentence was cut; information dries, objects don't
                    thread themselves into paragraphs */}
                <Tork delay={0.08}>
                  <p
                    style={{
                      fontSize: 14.5,
                      lineHeight: 1.55,
                      color: 'var(--ink-2)',
                      margin: '10px 0 0',
                    }}
                  >
                    {rightCount} av {QUESTIONS.length} rätt. {due} kvar i repetitionskön — nästa
                    pass väntar i morgon.
                  </p>
                  <div style={{ marginTop: 16 }}>
                    <Press label="Tillbaka till Hem →" onClick={onHome} />
                  </div>
                </Tork>
              </motion.div>
            )}
          </div>
        </motion.div>
        {/* reading edge: the ribbon fades under the fold (static) */}
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

/* ── rail ─────────────────────────────────────────────────────────── */

function A1Rail({ scene, due, go }: { scene: Scene; due: number; go: (s: Scene) => void }) {
  const a = useArk()
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
              a.note('bläckstrecket färdas · layoutId (ark k420 c42)')
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
                layoutId={a.rm ? undefined : 'a1-tick'}
                transition={a.ark}
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
                {/* station 1 of 2 — empty while the numeral is away */}
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

/* ── regi panel ───────────────────────────────────────────────────── */

function RegiPanel({
  scene,
  last,
  speed,
  setSpeed,
  rm,
}: {
  scene: string
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
        ark k420 c42 · remsa k300 c36 · veck k520 c42
        <br />
        grepp k620 c42 · tork 180 ms · hack {DETENT} px
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

/* ── the flow ─────────────────────────────────────────────────────── */

function A1Flow() {
  const rm = useReducedMotion() === true
  const [speed, setSpeed] = useState(1)
  const [last, setLast] = useState('—')
  const [scene, setScene] = useState<Scene>('hem')
  const [due, setDue] = useState(14)
  const [stage, setStage] = useState<Stage>({ qIndex: 0, atKlart: false })
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null])
  const [velocities, setVelocities] = useState<number[]>([0, 0, 0])
  const [panY, setPanY] = useState(0)
  const [navN, setNavN] = useState(0)
  const stripHost = useRef<HTMLDivElement>(null)

  const regi = useMemo<Regi>(() => ({ s: speed, rm, note: (l) => setLast(l) }), [speed, rm])
  const rightCount = answers.filter((v, i) => v !== null && v === QUESTIONS[i]?.correct).length

  const go = (s: Scene) => {
    if (s === 'drill') {
      setStage({ qIndex: 0, atKlart: false })
      setAnswers([null, null, null])
      setVelocities([0, 0, 0])
      setPanY(0)
    }
    // every navigation is a fresh presence key: re-entering a scene
    // whose old copy is still exiting must not collide with it (an
    // AnimatePresence duplicate-key drop — found by the interruption
    // pass). layoutId morphs don't care about keys, so continuity holds.
    setNavN((n) => n + 1)
    setScene(s)
  }

  const panTo = (block: string) => {
    const el = stripHost.current?.querySelector<HTMLElement>(`[data-a1-block="${block}"]`)
    if (el) setPanY(el.offsetTop)
  }

  const commit = (qi: number, i: number, v: number) => {
    setAnswers((prev) => {
      if (prev[qi] !== null) return prev
      const next = [...prev]
      next[qi] = i
      return next
    })
    setVelocities((prev) => {
      const next = [...prev]
      next[qi] = v
      return next
    })
    const q = QUESTIONS[qi]
    if (!q) return
    const ok = i === q.correct
    if (!ok && !q.repetition) setDue((n) => n + 1)
    if (ok && q.repetition) setDue((n) => n - 1)
    setLast(
      ok
        ? `domen · raden BLEV domen med v=${Math.round(v)} px/s ärvd (ark)`
        : 'domen · felvalet flyttar ned, strecket torkar på plats',
    )
  }

  const next = () => {
    if (stage.qIndex >= QUESTIONS.length - 1) {
      setStage({ qIndex: QUESTIONS.length - 1, atKlart: true })
      requestAnimationFrame(() => panTo('klart'))
      setLast('remsan rullar till Klart · remsa k300 c36 — samma ark')
      return
    }
    const target = stage.qIndex + 1
    setStage({ qIndex: target, atKlart: false })
    // measure after React commits — offsets read from the pre-update
    // DOM land the camera on a stale target
    requestAnimationFrame(() => panTo(String(target)))
    setLast('remsan rullar en fråga · nästa är greppbar från första bildrutan')
  }

  return (
    <RegiCtx.Provider value={regi}>
      <MotionConfig reducedMotion="user">
        <LayoutGroup>
          <div
            ref={stripHost}
            data-a1-root
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
            <A1Rail scene={scene} due={due} go={go} />
            <div aria-hidden style={{ width: 1, background: 'var(--hairline)' }} />
            <div style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={`${scene}-${navN}`}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: rm
                      ? { duration: 0 }
                      : { duration: 0.18 / speed, ease: EASE_READING },
                  }}
                  exit={{
                    opacity: 0,
                    transition: rm ? { duration: 0 } : { duration: 0.1 / speed, ease: EASE_EXIT },
                  }}
                >
                  {scene === 'hem' && <A1Hem go={go} />}
                  {scene === 'ova' && <A1Ova go={go} due={due} />}
                  {scene === 'drill' && (
                    <A1Drill
                      due={due}
                      stage={stage}
                      answers={answers}
                      velocities={velocities}
                      rightCount={rightCount}
                      onCommit={commit}
                      onNext={next}
                      onHome={() => {
                        setLast('klart→hem · panelen viks tillbaka till dagskortet (a1-kort)')
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
            />
          </div>
        </LayoutGroup>
      </MotionConfig>
    </RegiCtx.Provider>
  )
}

/* ── export ───────────────────────────────────────────────────────── */

/** MOTA1 · Arket, redigerad — Arket's continuity, edited by subtraction;
 *  Greppet's detent drag grafted in as the commit gesture. */
export function MOTA1() {
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
        MOTA1 · Arket, redigerad
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
        Arket, men redigerat: kontinuiteten står kvar där den bär mening — dagskortet och
        Klart-panelen är samma ark, drillen är en remsa som kameran panorerar, raden du släpper BLIR
        domen — och är struken där den poserade. Ordet Öva gör EN morf (dörren öppnas), inte tre;
        kö-siffran har två stationer, inte tre; alla trappade tona-in-kaskader är borta — en scen
        torkar i ett andetag, domen i två. Greppets hack är ympat i Arkets material: raden är papper
        under fingret, spåret uppstår först när du drar, och släppfarten ärvs av morfen. Klick och
        tangentbord svarar samma väg. Dra i ett ord — eller växla till 0,5× och se fjädrarna arbeta.
      </p>
      <A1Flow />
      <div style={{ ...monoSmall, marginTop: 16, maxWidth: '78ch', lineHeight: 1.6 }}>
        ark k420 c42 m1 (alla morfar) · remsa k300 c36 m1 (remsan) · veck k520 c42 m0,8 (rader som
        sluter sig) · grepp k620 c42 m0,9 (släppta rader) · tork 180 ms · hack 72 px, stopp 88 px ·
        släppfart klämd ±500 och ärvd av domens morf. Struket ur Arket: ordflygningen till drillens
        ögonbryn, siffrans tredje station, alla kaskader.
      </div>
    </div>
  )
}

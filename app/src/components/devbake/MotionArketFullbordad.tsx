// MotionArketFullbordad — round 4 of the motion bake-off: MOTA2
// "Arket, fullbordad". The owner picked F2 "Arket" (total continuity)
// as the base plus F4 "Greppet"'s drag-to-commit. This variant is that
// combination taken through fit-and-finish — same system, last 10%.
//
// THE CAMERA MODEL (every transition obeys this, no exceptions):
//   The frame is a fixed reading window over ONE continuous sheet. The
//   camera has exactly one degree of freedom — y, panning down the
//   sheet during the drill (remsan). It never moves in x, never zooms,
//   never rotates. Forward = down the page. Everything else that
//   appears to move is the sheet's own material rearranging in plane
//   (layoutId morphs — arket) or ink drying/lifting in place (opacity —
//   tork/ut; zero travel, no entrance offsets anywhere). Depth has
//   exactly two stations: the sheet plane (z0 — flat, shadowless) and
//   the finger-lift (z1) — a strip being dragged is the only thing that
//   ever leaves the plane and the only thing that ever casts a shadow.
//   MATERIAL LIGHT: the lift shadow is a pure function of drag distance
//   (x: 0→14 px maps shadow 0→full), never a function of time — so it
//   physically cannot arrive or leave a frame late, and it decays along
//   the same seat-spring the strip rides home on. Camera pans cast no
//   light change: moving your eyes doesn't move the lamp.
//
// Corner-cuts found in the round-3 Arket build and fixed here:
//   1. FROZEN CAMERA TARGET — F2 measured offsetTop once (rAF) and
//      sprang to that pixel; any later layout settle (verdict gloss
//      wrapping, rows closing up) left the camera parked off the true
//      static position. Now the camera aims at a BLOCK and a
//      ResizeObserver re-measures the target on every layout change —
//      the settle is guaranteed to equal static layout.
//   2. NUMERAL RACING THE CAMERA — F2 flipped the due numeral to its
//      Klart-sentence station in the same commit that started the pan,
//      so the morph flew toward a destination still below the fold,
//      vanishing mid-flight. Now the handoff waits for the pan's
//      onComplete: both endpoints are in frame for the whole flight.
//   3. FAKED SENTENCE FLOW — F2's Klart sentence was flex-wrap spans
//      with gap:6, so spacing around the landing numeral never matched
//      real text flow. Now it is one true inline sentence, and every
//      numeral station reserves an exact-width (ch, mono) slot while
//      the numeral is away — nothing reflows when it lands or leaves.
//   4. UNTUNED SCENE HANDOFF — F2 used one global exit/enter overlap
//      (out 120 ms, in 0 ms delay), giving a double-exposure frame on
//      every nav. Now exits lead at 90 ms and each nav pair has its own
//      entrance delay (hem→öva 40 ms; öva→drill 60 ms — the biggest
//      morph set gets the most room; drill→hem 50 ms).
//   5. DIGIT ROLL MUTATED A REF DURING RENDER — direction detection
//      wrote prev.current in the render body (misfires under
//      StrictMode double-render). Moved to an effect.
//
// The drag-commit, translated into Arket's material language: an
// answer row is a strip of the sheet. Dragging slides it along a
// crease that only materializes under the hand (groove + detent tick
// fade in over the first 14 px). The detent at 72 px is a mechanical
// stop (hard stop 88 px; the wrong direction refuses, elastic 0).
// Release past the detent commits — and the strip you were holding IS
// the verdict: the same layoutId flies the word from its dragged
// position into the verdict slot with your release velocity carried
// into the spring (clamped ×0.5, ±700 px/s). Click and keyboard commit
// everywhere with velocity 0 — the gesture is premium, never required.
//
// Shared discipline (unchanged): motion confirms causality, nothing
// loops or idles; transform/opacity only; accent pixels only where
// they already live (active ToC row, due numeral); verdict color is
// semantic --ok/--bad ink; useReducedMotion collapses everything to
// opacity-or-nothing (no morphs, no pan travel, no drag — rows become
// plain click targets); every spring is interruptible and the camera
// re-aims in flight.
//
// DESIGN artifact: fixtures only, no routes, no shared-file edits.

import {
  AnimatePresence,
  animate,
  LayoutGroup,
  MotionConfig,
  motion,
  type Transition,
  useMotionTemplate,
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
  useEffect,
  useLayoutEffect,
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
 * Honest speed scaling: stiffness×s², damping×s replays the same
 * spring curve at 1/s clock; tweens and delays divide by s.
 */

type Regi = { s: number; rm: boolean; note: (label: string) => void }
const RegiCtx = createContext<Regi>({ s: 1, rm: false, note: () => {} })

type Bezier = [number, number, number, number]
const EASE_READING: Bezier = [0.16, 1, 0.3, 1]
const EASE_EXIT: Bezier = [0.7, 0, 0.84, 0]

/** Per-pair entrance delays after the 90 ms exit lead (fix 4). The
 *  öva→drill pair carries the largest morph set (ORD code + numeral +
 *  Öva shrinking to the eyebrow), so its ink waits longest for the
 *  material to be underway. Values in seconds, pre-scaling. */
const HANDOFF: Record<string, number> = {
  'hem→ova': 0.04,
  'ova→hem': 0.04,
  'ova→drill': 0.06,
  'drill→hem': 0.05,
  'drill→ova': 0.05,
  'hem→drill': 0.06,
}

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
      /** anchor + container morphs — the material rearranging. */
      arket: spring(320, 36, 1),
      /** the camera pan — paper (well, the reader's eye) has mass. */
      remsan: { stiffness: 240 * s * s, damping: 30 * s, mass: 1.15 },
      /** small in-place layout shifts (rows closing up). */
      veck: spring(480, 40, 0.8),
      /** a released strip seating home (inherits hand velocity). */
      sate: { stiffness: 620 * s * s, damping: 42 * s, mass: 0.9 },
      /** ink drying onto the sheet: zero travel, opacity only. */
      tork: tween(0.24),
      /** ink lifting off — the only exit the sheet allows. */
      ut: tween(0.09, EASE_EXIT),
      spring,
      tween,
    }
  }, [s, rm, note])
}

/** Ink surfacing on the sheet: opacity only, zero travel. */
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

/** Masked per-digit roll. Fix 5: the previous-value ref is updated in
 *  an effect, never in the render body. */
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
  useEffect(() => {
    prev.current = value
  }, [value])
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

/** Mono action button; the press is the sheet giving way 1 px. */
/** The camera law, extended one level: the demo stage lives inside a
 *  scrolling page (unlike the product drill, which owns the viewport),
 *  so when the verdict grows the active block past the page fold the
 *  action row could end up half-hidden (owner find, 2026-07-12). On
 *  mount — i.e. the moment the verdict lands — nudge the page the
 *  minimal distance that keeps the row fully visible. */
function KeepInView({ rm, children }: { rm: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // Wait out the verdict block's layout settle (veck ≈ 300 ms) —
    // scrolling earlier measures a target that is still growing.
    const t = setTimeout(
      () => ref.current?.scrollIntoView({ block: 'nearest', behavior: rm ? 'auto' : 'smooth' }),
      rm ? 0 : 380,
    )
    return () => clearTimeout(t)
  }, [rm])
  return (
    <div ref={ref} style={{ scrollMarginBottom: 20 }}>
      {children}
    </div>
  )
}

function Press({
  label,
  onClick,
  disabled,
  probe,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  probe?: string
}) {
  const ark = useArk()
  return (
    <motion.button
      type="button"
      data-probe={probe}
      onClick={onClick}
      disabled={disabled}
      whileTap={ark.rm ? undefined : { scale: 0.97 }}
      transition={ark.veck}
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

/* ── shared-element stations ─────────────────────────────────────── */

/** The word "Öva": Hem day-card row (17 px) → Öva headline (36 px) →
 *  drill eyebrow (11 px), and back. One object, three stations. */
function ArkOva({ size, style }: { size: number; style?: CSSProperties }) {
  const ark = useArk()
  return (
    <motion.span
      layoutId={ark.rm ? undefined : 'a2-ova'}
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

/** The due numeral — rail folio → drill header → Klart sentence.
 *  It never stops existing. */
function ArkDue({ due, size, probe }: { due: number; size: number; probe?: string }) {
  const ark = useArk()
  return (
    <motion.span
      data-probe={probe}
      layoutId={ark.rm ? undefined : 'a2-due'}
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

/** Fix 3: every station the numeral can leave reserves its exact width
 *  (mono digits are 1 ch each) so nothing reflows on arrival or
 *  departure — settle always equals static layout. */
function DueSlot({
  due,
  size,
  show,
  probe,
}: {
  due: number
  size: number
  show: boolean
  probe?: string
}) {
  if (show) return <ArkDue due={due} size={size} probe={probe} />
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: `${String(due).length}ch`,
        fontFamily: 'var(--font-mono)',
        fontSize: size,
        lineHeight: 1,
      }}
    />
  )
}

/** The wrong-verdict strike: a hand stroke that DRIES (opacity, zero
 *  travel — Arket's law; Bläcket's traveling strike stays in Bläcket).
 *  Drawn as one slightly rising path instead of a positioned border,
 *  so nothing pops in a frame late and nothing reads as CSS. */
function Strike() {
  const ark = useArk()
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 100 8"
      preserveAspectRatio="none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={ark.tork}
      style={{
        position: 'absolute',
        left: '-0.08em',
        width: 'calc(100% + 0.16em)',
        height: '0.3em',
        top: 'calc(50% - 0.06em)',
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      <path
        d="M0 5.6 C 28 4.9, 68 3.6, 100 2.4"
        stroke="var(--bad)"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </motion.svg>
  )
}

/* ── the drag-commit: a strip of the sheet under the finger ──────── */

const DETENT = 72
const HARDSTOP = 88
const V_CLAMP = 700

function A2DragRow({
  opt,
  index,
  qi,
  graded,
  correct,
  wrongPick,
  active,
  onCommit,
}: {
  opt: string
  index: number
  qi: number
  graded: boolean
  correct: number
  wrongPick: boolean
  active: boolean
  onCommit: (i: number, velocity: number) => void
}) {
  const ark = useArk()
  const x = useMotionValue(0)
  const [armed, setArmed] = useState(false)
  const isOk = graded && index === correct
  const dim = graded && !isOk
  const canDrag = !ark.rm && !graded && active

  // MATERIAL LIGHT: lift is a pure function of drag distance — the
  // paper backing and its shadow fade in over the first 12 px of pull
  // and ride the same seat-spring home. No time-based shadow exists.
  const liftA = useTransform(x, [0, 12], [0, 1])
  const shadow = useMotionTemplate`0 1px 5px rgba(31, 26, 16, ${useTransform(liftA, (v) => v * 0.14)}), 0 0.5px 1.5px rgba(31, 26, 16, ${useTransform(liftA, (v) => v * 0.1)})`
  // the crease only materializes under the hand
  const grooveOpacity = useTransform(x, [0, 14], [0, 0.4])
  const tickOpacity = useTransform(x, [0, 14, DETENT * 0.6, DETENT], [0, 0.3, 0.45, 1])
  // the arm hint is f(drag) too — it condenses in as the strip nears
  // the stop and never pops on a state flip; its right padding keeps it
  // inside the frame at full pull (strip travels ≤ HARDSTOP px).
  const armOpacity = useTransform(x, [DETENT * 0.72, DETENT], [0, 1])

  const commit = (v: number) => {
    if (graded || !active) return
    onCommit(index, v)
  }

  const label = `${String.fromCharCode(97 + index)}. ${opt}`

  return (
    <div style={{ position: 'relative' }}>
      {/* the crease: dotted guide to the detent, a tick at the stop */}
      {canDrag && (
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
        aria-label={canDrag ? `${label} — dra förbi hacket eller tryck för att svara` : label}
        aria-disabled={graded || !active}
        drag={canDrag ? 'x' : false}
        dragConstraints={{ left: 0, right: HARDSTOP }}
        dragElastic={{ left: 0, right: 0.04 }}
        dragMomentum={false}
        style={{ x, position: 'relative', touchAction: 'pan-y', outlineOffset: 2 }}
        onDrag={() => {
          const past = x.get() >= DETENT
          if (past !== armed) {
            setArmed(past)
            if (past) ark.note(`hack: ${opt} spänd vid ${DETENT} px — släpp för att svara`)
          }
        }}
        onDragEnd={(_, info) => {
          if (x.get() >= DETENT) {
            ark.note(
              `släpp v=${Math.round(info.velocity.x)} px/s → remsan blir domen, farten följer med`,
            )
            commit(info.velocity.x)
          } else {
            ark.note(
              `släpp v=${Math.round(info.velocity.x)} px/s före hacket → remsan sätter sig (säte)`,
            )
            setArmed(false)
            animate(x, 0, {
              type: 'spring',
              ...ark.sate,
              velocity: info.velocity.x,
            })
          }
        }}
        onTap={() => {
          if (x.get() > 4) return // a real drag settling — not a click
          if (!graded && active) ark.note('klickval — samma väg, fart 0')
          commit(0)
        }}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            ark.note('tangentval — samma väg, fart 0')
            commit(0)
          }
        }}
        whileHover={canDrag ? { x: 2 } : undefined}
      >
        {/* the lifted strip's paper backing — occludes the crease it
            slides over; shadow strength rides the same lift value */}
        <motion.div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--bg)',
            opacity: liftA,
            boxShadow: shadow,
          }}
        />
        <div
          data-probe={`row-${qi}-${index}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 10px',
            position: 'relative',
            cursor: canDrag ? 'grab' : graded || !active ? 'default' : 'pointer',
          }}
        >
          <span
            style={{
              ...monoSmall,
              color: isOk ? 'var(--ok)' : 'var(--muted)',
              opacity: dim && !isOk ? 0.55 : 1,
            }}
          >
            {String.fromCharCode(97 + index)}
          </span>
          <motion.span
            layoutId={ark.rm ? undefined : `a2-q${qi}-w${index}`}
            transition={ark.arket}
            style={{
              display: 'inline-block',
              fontFamily: 'var(--font-display)',
              fontSize: 17,
              color: isOk ? 'var(--ok)' : dim ? 'var(--muted)' : 'var(--ink)',
            }}
          >
            {opt}
          </motion.span>
          {isOk && wrongPick && (
            <Tork style={{ ...monoSmall, color: 'var(--ok)' }}>✓ rätt svar</Tork>
          )}
          {canDrag && (
            <motion.span
              aria-hidden={!armed}
              style={{
                ...monoSmall,
                marginLeft: 'auto',
                paddingRight: HARDSTOP + 8,
                color: 'var(--ink)',
                opacity: armOpacity,
              }}
            >
              släpp = svara
            </motion.span>
          )}
        </div>
      </motion.div>
      <div aria-hidden style={{ height: 1, background: 'var(--hairline-2)' }} />
    </div>
  )
}

/* ── one question block on the ribbon ────────────────────────────── */

function A2Question({
  q,
  qi,
  picked,
  commitV,
  onPick,
  onNext,
  isLast,
  active,
}: {
  q: OrdQ
  qi: number
  picked: number | null
  commitV: number
  onPick: (i: number, v: number) => void
  onNext: () => void
  isLast: boolean
  active: boolean
}) {
  const ark = useArk()
  const graded = picked !== null
  const right = graded && picked === q.correct
  return (
    <div style={{ padding: '18px 0 26px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, margin: '0 0 10px' }}>
        <div
          data-probe={`headword-${qi}`}
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
        // the picked strip has left the list — it IS the verdict now
        if (graded && i === picked) return null
        return (
          <motion.div key={opt} layout={!ark.rm} transition={ark.veck}>
            <A2DragRow
              opt={opt}
              index={i}
              qi={qi}
              graded={graded}
              correct={q.correct}
              wrongPick={graded && !right}
              active={active}
              onCommit={onPick}
            />
          </motion.div>
        )
      })}

      {/* the verdict slot — the strip lands here; the ink dries on it */}
      <motion.div layout={!ark.rm} transition={ark.veck} style={{ minHeight: 96, paddingTop: 16 }}>
        {graded && picked !== null && (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <motion.span
                data-probe={`verdict-${qi}`}
                layoutId={ark.rm ? undefined : `a2-q${qi}-w${picked}`}
                transition={
                  ark.rm ? { duration: 0 } : ({ ...ark.arket, velocity: commitV } as Transition)
                }
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
                {!right && <Strike />}
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
            {/* past verdicts stay on the ribbon as marks, not controls */}
            {active && (
              <Tork delay={0.22} style={{ marginTop: 14 }}>
                <KeepInView rm={ark.rm}>
                  <Press
                    probe={`next-${qi}`}
                    label={isLast ? 'Vidare till Klart →' : 'Nästa →'}
                    onClick={onNext}
                  />
                </KeepInView>
              </Tork>
            )}
          </div>
        )}
        {!graded && (
          <Tork delay={0.1} style={monoSmall}>
            {ark.rm
              ? 'välj a–e — tryck för att svara'
              : 'dra ordet förbi hacket och släpp — eller klicka; remsan du håller i blir domen'}
          </Tork>
        )}
      </motion.div>
    </div>
  )
}

/* ── the drill: one ribbon, one camera ───────────────────────────── */

type A2Stage = { qIndex: number; atKlart: boolean }

function A2Drill({
  due,
  stage,
  answers,
  commitV,
  rightCount,
  onPick,
  onNext,
  onHome,
}: {
  due: number
  stage: A2Stage
  answers: readonly (number | null)[]
  commitV: number
  rightCount: number
  onPick: (qi: number, i: number, v: number) => void
  onNext: () => void
  onHome: () => void
}) {
  const ark = useArk()
  const stripRef = useRef<HTMLDivElement>(null)
  const y = useMotionValue(0)
  // fix 2: the numeral's Klart handoff waits for the camera
  const [klartInFrame, setKlartInFrame] = useState(false)
  const target = stage.atKlart ? 'klart' : String(stage.qIndex)

  // fix 1: the camera aims at a BLOCK, not a frozen pixel. A
  // ResizeObserver re-measures the target's offsetTop whenever the
  // ribbon's layout settles differently (verdict expanding, gloss
  // wrapping, rows closing up) and re-aims the same spring in flight —
  // the settle is guaranteed to land on true static layout.
  const aimed = useRef({ top: -1 })
  useLayoutEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    aimed.current.top = -1
    const aim = () => {
      const el = strip.querySelector<HTMLElement>(`[data-a2-block="${target}"]`)
      if (!el) return
      const top = el.offsetTop
      if (top === aimed.current.top) return
      aimed.current.top = top
      if (ark.rm) {
        y.set(-top)
        if (target === 'klart') setKlartInFrame(true)
        return
      }
      animate(y, -top, {
        type: 'spring',
        ...ark.remsan,
        onComplete: () => {
          if (target === 'klart') setKlartInFrame(true)
        },
      })
    }
    aim()
    const ro = new ResizeObserver(aim)
    ro.observe(strip)
    return () => ro.disconnect()
  }, [target, ark.rm, ark.remsan, y])

  return (
    <div style={{ padding: '26px 30px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <ArkOva size={11} style={{ color: 'var(--muted)', letterSpacing: '0.1em' }} />
          <motion.span
            layoutId={ark.rm ? undefined : 'a2-ord'}
            transition={ark.arket}
            style={{ ...eyebrow, color: 'var(--ink)', display: 'inline-block' }}
          >
            ORD
          </motion.span>
          <span style={eyebrow}>
            · fråga {Math.min(stage.qIndex + 1, QUESTIONS.length)}/{QUESTIONS.length}
          </span>
        </div>
        {/* station 2 of 3 — holds the numeral until the camera has
            carried the Klart panel into frame (fix 2) */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <DueSlot due={due} size={22} show={!klartInFrame} probe="due-header" />
          {/* once the numeral has moved on, its label recedes — ink
              dims in place, the slot keeps its width (no reflow) */}
          <motion.span
            animate={{ opacity: klartInFrame ? 0.35 : 1 }}
            transition={ark.tork}
            style={{ ...monoSmall, textTransform: 'uppercase' }}
          >
            att repetera
          </motion.span>
        </div>
      </div>
      <div style={{ height: 1, background: 'var(--ink)', margin: '12px 0 0' }} />

      {/* the ribbon: all questions + Klart are ONE strip; only the
          camera moves, and a camera pan casts no light change */}
      <div style={{ height: 430, overflow: 'hidden', position: 'relative' }}>
        <motion.div ref={stripRef} style={{ y }}>
          {QUESTIONS.map((q, qi) => (
            <div key={q.headword} data-a2-block={qi}>
              <A2Question
                q={q}
                qi={qi}
                picked={answers[qi] ?? null}
                commitV={commitV}
                onPick={(i, v) => onPick(qi, i, v)}
                onNext={onNext}
                isLast={qi === QUESTIONS.length - 1}
                active={!stage.atKlart && qi === stage.qIndex}
              />
            </div>
          ))}
          {/* the foot of the ribbon: the Klart panel — the same sheet
              as Hem's day-card (layoutId a2-kort) */}
          <div data-a2-block="klart" style={{ padding: '10px 0 30px' }}>
            {stage.atKlart && (
              <motion.div
                data-probe="klart-panel"
                layoutId={ark.rm ? undefined : 'a2-kort'}
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
                {/* fix 3: one true inline sentence — the numeral's slot
                    is exact-width while it is still in the header, so
                    nothing reflows when it lands (station 3 of 3) */}
                <Tork delay={0.12}>
                  <p
                    data-probe="klart-sentence"
                    style={{
                      fontSize: 14.5,
                      lineHeight: 1.55,
                      color: 'var(--ink-2)',
                      margin: '10px 0 0',
                    }}
                  >
                    {rightCount} av {QUESTIONS.length} rätt.{' '}
                    <DueSlot due={due} size={14.5} show={klartInFrame} probe="due-klart" /> kvar i
                    repetitionskön — nästa pass väntar i morgon.
                  </p>
                </Tork>
                <Tork delay={0.2} style={{ marginTop: 16 }}>
                  <Press probe="home" label="Tillbaka till Hem →" onClick={onHome} />
                </Tork>
              </motion.div>
            )}
          </div>
        </motion.div>
        {/* the reading fold: static, never animated */}
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

/* ── scenes ──────────────────────────────────────────────────────── */

function A2Hem({ go }: { go: (s: Scene) => void }) {
  const ark = useArk()
  return (
    <div style={{ padding: '26px 30px 24px' }}>
      <Tork>
        <div style={eyebrow}>Lördag 12 juli · 113 dagar kvar</div>
        <h2
          data-probe="hem-headline"
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
        layoutId={ark.rm ? undefined : 'a2-kort'}
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
          data-probe="hem-ova"
          onClick={() => {
            ark.note('hem→öva · ordet Öva växer till rubrik (arket) · ink väntar 40 ms')
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

function A2Ova({ go, due }: { go: (s: Scene) => void; due: number }) {
  const ark = useArk()
  return (
    <div style={{ padding: '26px 30px 24px' }}>
      <Tork>
        <div style={eyebrow}>Öva · repetera</div>
      </Tork>
      <div style={{ margin: '8px 0 0' }}>
        <ArkOva size={36} style={undefined} />
      </div>
      <Tork delay={0.05}>
        <p
          data-probe="ova-lede"
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
            data-probe={row.code === 'ORD' ? 'ova-ord' : undefined}
            disabled={row.code !== 'ORD'}
            onClick={() => {
              if (row.code !== 'ORD') return
              ark.note('öva→drill · ORD blir sidhuvud, siffran flyttar in · ink väntar 60 ms')
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
                layoutId={ark.rm ? undefined : 'a2-ord'}
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

function A2Rail({ scene, due, go }: { scene: Scene; due: number; go: (s: Scene) => void }) {
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
            data-probe={`rail-${row.id}`}
            disabled={!row.enabled}
            onClick={() => {
              if (!row.enabled || row.id === activeId) return
              ark.note('bläckstrecket färdas på arket · layoutId (arket k320 c36)')
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
                layoutId={ark.rm ? undefined : 'a2-tick'}
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
                {/* station 1 of 3 — exact-width reserve while away
                    (fix 3): the leader never stretches when it leaves */}
                <DueSlot due={due} size={10.5} show={numeralInRail} probe="due-rail" />
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

/* ── the flow ────────────────────────────────────────────────────── */

function A2Flow() {
  const rm = useReducedMotion() === true
  const [speed, setSpeed] = useState(1)
  const [last, setLast] = useState('—')
  const [scene, setScene] = useState<Scene>('hem')
  const [pair, setPair] = useState('hem→hem')
  const [due, setDue] = useState(14)
  const [stage, setStage] = useState<A2Stage>({ qIndex: 0, atKlart: false })
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null])
  const [commitV, setCommitV] = useState(0)

  const regi = useMemo<Regi>(() => ({ s: speed, rm, note: (l) => setLast(l) }), [speed, rm])
  const rightCount = answers.filter((a, i) => a !== null && a === QUESTIONS[i]?.correct).length

  const go = (s: Scene) => {
    setPair(`${scene}→${s}`)
    if (s === 'drill') {
      setStage({ qIndex: 0, atKlart: false })
      setAnswers([null, null, null])
      setCommitV(0)
    }
    setScene(s)
  }

  const pick = (qi: number, i: number, v: number) => {
    setAnswers((a) => {
      if (a[qi] !== null) return a
      const nextA = [...a]
      nextA[qi] = i
      return nextA
    })
    // the hand's energy survives into the verdict's arrival spring
    setCommitV(Math.max(-V_CLAMP, Math.min(V_CLAMP, v * 0.5)))
    const q = QUESTIONS[qi]
    if (!q) return
    const ok = i === q.correct
    if (!ok && !q.repetition) setDue((n) => n + 1)
    if (ok && q.repetition) setDue((n) => n - 1)
    setLast(
      ok
        ? `domen · remsan du höll i BLEV domen (arket, v=${Math.round(v)} px/s ärvd)`
        : 'domen · felvalet flyttar ned, strecket torkar på plats',
    )
  }

  const next = () => {
    if (stage.qIndex >= QUESTIONS.length - 1) {
      setStage({ qIndex: QUESTIONS.length - 1, atKlart: true })
      setLast('remsan rullar till Klart · kameran först, siffran flyger när panelen är i bild')
      return
    }
    setStage({ qIndex: stage.qIndex + 1, atKlart: false })
    setLast('kameran panorerar en fråga · dina domar står kvar ovanför')
  }

  const enterDelay = HANDOFF[pair] ?? 0.04

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
              minHeight: 540,
              border: '1px solid var(--hairline)',
              background: 'var(--bg)',
            }}
          >
            <A2Rail scene={scene} due={due} go={go} />
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
                      : {
                          duration: 0.2 / speed,
                          ease: EASE_READING,
                          // fix 4: per-pair handoff — ink waits for the
                          // material, tuned per nav pair
                          delay: enterDelay / speed,
                        },
                  }}
                  exit={{
                    opacity: 0,
                    transition: rm ? { duration: 0 } : { duration: 0.09 / speed, ease: EASE_EXIT },
                  }}
                >
                  {scene === 'hem' && <A2Hem go={go} />}
                  {scene === 'ova' && <A2Ova go={go} due={due} />}
                  {scene === 'drill' && (
                    <A2Drill
                      due={due}
                      stage={stage}
                      answers={answers}
                      commitV={commitV}
                      rightCount={rightCount}
                      onPick={pick}
                      onNext={next}
                      onHome={() => {
                        setLast('klart→hem · panelen viks tillbaka till dagskortet (a2-kort)')
                        go('hem')
                      }}
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
              springLine="arket k320 c36 · remsan k240 c30 · veck k480 c40 · säte k620 c42 · tork 240 ms"
            />
          </div>
        </LayoutGroup>
      </MotionConfig>
    </RegiCtx.Provider>
  )
}

/* ── export ──────────────────────────────────────────────────────── */

/** MOTA2 · Arket, fullbordad — total continuity, finished. */
export function MOTA2() {
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
        MOTA2 · Arket, fullbordad
      </h1>
      <p
        style={{
          fontSize: 14,
          color: 'var(--ink-2)',
          maxWidth: '72ch',
          margin: '10px 0 28px',
          lineHeight: 1.5,
        }}
      >
        Arket plus Greppets hack, färdigputsat. En kameramodell: ramen är ett stilla läsfönster över
        ett enda ark; kameran har exakt en frihetsgrad — den panorerar nedåt längs remsan i drillen.
        Allt annat är arkets eget material som ordnar om sig i planet, eller bläck som torkar på
        plats. Djupet har två lägen: arkets plan (platt, skugglöst) och fingerlyftet — remsan du
        drar är det enda som någonsin lämnar planet, och dess skugga är en ren funktion av draget
        (inte av tiden), så den kan varken dyka upp eller försvinna en bildruta för sent. Släpp
        förbi hacket och remsan du höll i BLIR domen, med din handledsfart ärvd in i fjädern.
        Kameran siktar på block, inte frusna pixlar — layoutskiften mid-flykt omsiktas, och varje
        viloläge landar exakt på statisk layout.
      </p>
      <A2Flow />
      <div style={{ ...monoSmall, marginTop: 16, maxWidth: '78ch', lineHeight: 1.6 }}>
        arket k320 c36 m1 (morfar; domen ärver släppfart ×0,5, ±700 px/s) · remsan k240 c30 m1,15
        (kameran; omsiktas av ResizeObserver) · veck k480 c40 m0,8 (rader som sluter sig) · säte
        k620 c42 m0,9 (remsa som sätter sig, fart ärvd) · tork 240 ms (bläck, noll färd) · ut 90 ms
        + parvis ink-fördröjning 40–60 ms. Hack 72 px · stopp 88 px · skugga = f(drag), aldrig
        f(tid).
      </div>
    </div>
  )
}

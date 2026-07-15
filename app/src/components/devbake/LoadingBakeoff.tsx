// LoadingBakeoff — three competing loading→arrival languages (wave W1
// round 2). Owner verdict on the shipped drying-ink treatment (D1):
// "i didnt get the drying ink feeling" — static gray impressions that
// fade to content read as a quieter skeleton, not ink. Three schools
// compete on the SAME stage (a faithful re-render of the DailyPlanCard
// surface + an Öva counts row + a Framsteg ledger — same classes, same
// tokens, so only the arrival grammar varies):
//
//   L1 "Bläckfläcken" — the ink school, made literal. Placeholders are
//        soft BLURRED GHOSTS of the settled typography (real text
//        shapes, low opacity + blur — static by law), and arriving
//        content SHARPENS into focus like ink bleeding into paper
//        (filter blur → 0 + opacity; the ghost→real glyph swap happens
//        at full blur, so it is invisible). Loading = the page seen
//        through wet paper; arrival = the fibers drink the ink.
//
//   L2 "Skriften" — the pen school. Before data: almost nothing — a
//        faint baseline rule per line, the ruled notebook waiting.
//        When data lands, content WRITES IN: per-line clip-path wipes
//        left→right at a short top-to-bottom cadence (Bläcket's
//        drawn-mark grammar applied to arrival). The page is written,
//        not loaded.
//
//   L3 "Vita arket" — the anti-skeleton school. NO placeholders:
//        honest reserved space (the settled layout at opacity 0, so
//        nothing ever jumps), calm empty paper under real chrome.
//        When data lands the whole block arrives in ONE composed beat
//        — a single tork, zero per-element stagger. Nothing until
//        ready, then instant-and-calm (the Linear position).
//
// House laws (all three): nothing loops / pulses / shimmers EVER — a
// static ghost is fine, an animated one is not; reduced motion →
// instant swap; transform / opacity / filter / clip-path only; zero
// layout jump (dimensions reserved honestly); accent pixels only where
// they already live; every beat is STATE-driven (`ready` flips), never
// mount-driven — `initial={false}` everywhere, so RouteScene's mount
// suppression has nothing to suppress (the K-chips' pattern).
//
// Stage controls: "Ladda om ↻" replays the fake query; snabb/långsam
// toggles ~300 ms vs ~2.5 s latency — the winner must feel right at
// BOTH (a language that needs the wait to justify its ceremony loses).
//
// DESIGN artifact: /dev/motion-bakeoff chips only. Kept forever per
// house rule.

import { motion } from 'motion/react'
import { type CSSProperties, type FC, type ReactNode, useEffect, useState } from 'react'

import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { EASE, useArketMotion } from '@/lib/motion'

/* ── the fake query ──────────────────────────────────────────────── */

const LATENCY = { snabb: 300, langsam: 2500 } as const
type Speed = keyof typeof LATENCY

/** Fake a query resolving after `latencyMs`; `reload` replays it. */
function useFakeQuery(latencyMs: number) {
  const [run, setRun] = useState(0)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    // `run` is the replay generation (same pattern as D1's INKDEMO).
    void run
    setReady(false)
    const t = setTimeout(() => setReady(true), latencyMs)
    return () => clearTimeout(t)
  }, [run, latencyMs])
  return { ready, reload: () => setRun((r) => r + 1) }
}

/* ── the language contract ───────────────────────────────────────────
   `Frame` wraps structural markup that exists only to host data (the
   rows' ordinal grid, the ledger table). `Line` wraps one data line.
   L1/L2 keep structure visible from frame one and animate lines; L3
   hides the whole frame and arrives in one beat (its lines are inert).
   `i` orders L2's top-to-bottom writing cadence; `ghost` feeds L1's
   blurred pre-render; `ruleW` sizes L2's waiting baseline rule.      */

type FrameProps = { ready: boolean; inline?: boolean; children: ReactNode }
type LineProps = {
  ready: boolean
  i: number
  ghost?: ReactNode
  inline?: boolean
  ruleW?: string
  children: ReactNode
}
type LangKit = { Frame: FC<FrameProps>; Line: FC<LineProps> }

/** Structure passthrough for the languages whose chrome is always ink. */
function PlainFrame({ inline, children }: FrameProps) {
  return inline ? <span>{children}</span> : <div>{children}</div>
}

/* ── L1 · Bläckfläcken — blur-sharpen ────────────────────────────────
   The ghost sits STATIC at blur(7px) / low opacity — a mark, not an
   activity indicator. On `ready` the children swap ghost→real (masked:
   the swap lands on the first frame of the sharpen, at full blur) and
   the filter resolves to 0 over one reading-pace tween.

   Perf: `filter: blur()` promotes the element to its own layer and is
   GPU-composited, but ANIMATING the radius re-rasterizes the layer
   every frame — cost scales with painted area. Discipline here: the
   blur lives on many SMALL line boxes (never one card-sized surface),
   radius capped at 7 px, and `willChange: filter` pins the layers for
   the demo's lifetime (product usage should drop the hint after
   settle). Measured on this stage (rAF frame deltas across the whole
   sharpen window, headless Chromium — numbers in
   LoadingBakeoff.notes.md): no dropped frames. Do not scale this
   treatment to full-viewport surfaces without re-measuring.         */

const SHARPEN_S = 0.64
const BLUR_PX = 7
const GHOST_OPACITY = 0.38
/** NOT the house reading ease — that curve front-loads so hard the
 *  focus-pull is over in ~3 frames (verified on captured frames). The
 *  sharpen needs a visible middle: a mild ease-out that still spends
 *  half its time above 2 px of blur. */
const SHARPEN_EASE = [0.3, 0.25, 0.25, 1] as const

function SharpenLine({ ready, ghost, inline, children }: LineProps) {
  const ark = useArketMotion()
  const Host = inline ? motion.span : motion.div
  return (
    <Host
      initial={false}
      animate={
        ark.rm
          ? { filter: 'blur(0px)', opacity: 1, transition: { duration: 0 } }
          : {
              filter: ready ? 'blur(0px)' : `blur(${BLUR_PX}px)`,
              opacity: ready ? 1 : GHOST_OPACITY,
              transition: { duration: SHARPEN_S, ease: [...SHARPEN_EASE] },
            }
      }
      aria-hidden={!ready || undefined}
      style={{
        display: inline ? 'inline-block' : 'block',
        maxWidth: '100%',
        willChange: 'filter',
      }}
    >
      {ready || ark.rm ? children : (ghost ?? children)}
    </Host>
  )
}

const LANG1: LangKit = { Frame: PlainFrame, Line: SharpenLine }

/* ── L2 · Skriften — per-line write-in ───────────────────────────────
   The real content is ALWAYS in flow (fully clipped while waiting →
   honest dimensions, zero jump); a faint baseline rule marks the line
   until the pen reaches it. On `ready` each line wipes open left→right
   (clip-path inset only) on a 55 ms top-to-bottom cadence; the rule
   lifts as its line is written. Insets over-scan by 8% so italic
   overhangs and descenders never get shaved.                        */

const CADENCE_S = 0.07
const WIPE_S = 0.38
/** A pen stroke is near-linear with a soft landing — the house reading
 *  ease makes the wipe read as a snap, not a hand travelling the line
 *  (verified on captured frames). */
const WIPE_EASE = [0.38, 0.05, 0.5, 1] as const
const CLIP_WAITING = 'inset(-8% 108% -8% -8%)'
const CLIP_WRITTEN = 'inset(-8% -8% -8% -8%)'

function WriteLine({ ready, i, inline, ruleW, children }: LineProps) {
  const ark = useArketMotion()
  const Host = inline ? motion.span : motion.div
  const Root = inline ? 'span' : 'div'
  return (
    <Root
      style={{
        position: 'relative',
        display: inline ? 'inline-block' : 'block',
        maxWidth: '100%',
      }}
    >
      <Host
        initial={false}
        animate={
          ark.rm
            ? { clipPath: CLIP_WRITTEN, transition: { duration: 0 } }
            : {
                clipPath: ready ? CLIP_WRITTEN : CLIP_WAITING,
                transition: ready
                  ? { duration: WIPE_S, ease: [...WIPE_EASE], delay: i * CADENCE_S }
                  : { duration: 0 },
              }
        }
        aria-hidden={!ready || undefined}
        style={{ display: inline ? 'inline-block' : 'block' }}
      >
        {children}
      </Host>
      <motion.span
        aria-hidden
        initial={false}
        animate={
          ark.rm
            ? { opacity: ready ? 0 : 1, transition: { duration: 0 } }
            : {
                opacity: ready ? 0 : 1,
                transition: ready
                  ? { duration: 0.09, ease: [...EASE.exit], delay: i * CADENCE_S }
                  : { duration: 0 },
              }
        }
        style={{
          position: 'absolute',
          left: 0,
          bottom: '0.28em',
          width: ruleW ?? '100%',
          maxWidth: '100%',
          borderBottom: '1px solid var(--hairline-2)',
        }}
      />
    </Root>
  )
}

const LANG2: LangKit = { Frame: PlainFrame, Line: WriteLine }

/* ── L3 · Vita arket — one composed beat ─────────────────────────────
   No placeholders. The settled layout is always in flow at opacity 0
   (honest reserved space — the paper is blank, not absent), and every
   frame on the stage shares the IDENTICAL 260 ms tork with zero delay,
   so data arrival reads as ONE beat, not a sequence. Lines are inert:
   the frame owns the whole arrival.                                 */

const BEAT_S = 0.26

function ArriveFrame({ ready, inline, children }: FrameProps) {
  const ark = useArketMotion()
  const Host = inline ? motion.span : motion.div
  return (
    <Host
      initial={false}
      animate={{
        opacity: ready ? 1 : 0,
        transition: ark.rm
          ? { duration: 0 }
          : ready
            ? { duration: BEAT_S, ease: [...EASE.reading] }
            : { duration: 0 },
      }}
      aria-hidden={!ready || undefined}
      style={{ display: inline ? 'inline-block' : 'block', maxWidth: '100%' }}
    >
      {children}
    </Host>
  )
}

function InertLine({ inline, children }: LineProps) {
  return inline ? <span>{children}</span> : <div>{children}</div>
}

const LANG3: LangKit = { Frame: ArriveFrame, Line: InertLine }

/* ── shared stage fixture (D1's three surfaces, same content) ─────── */

const PLAN_ROWS = [
  {
    tag: null as string | null,
    headline: 'Repetition · 6 missar',
    ghostHeadline: 'Repetition · 0 missar',
    rationale: 'Gör dem först — de äldsta håller på att glida.',
    ghostRationale: 'Gör dem först — de äldsta håller på att glida.',
    min: '~5 min',
  },
  {
    tag: 'NOG',
    headline: 'NOG-drill · 10 frågor',
    ghostHeadline: 'XYZ-drill · 00 frågor',
    rationale: 'Svagast just nu; påstående 1 ≠ påstående 2 spökar.',
    ghostRationale: 'Svagast just nu; påstående 0 ≠ påstående 0 spökar.',
    min: '~6 min',
  },
  {
    tag: 'DTK',
    headline: 'Uppslag · DTK-diagramtyper',
    ghostHeadline: 'Uppslag · ORD-diagramtyper',
    rationale: 'Kort läsning innan nästa DTK-pass.',
    ghostRationale: 'Kort läsning innan nästa ORD-pass.',
    min: '~3 min',
  },
] as const

const LEDGER_ROWS = [
  { code: 'ORD', value: '132 av 140 rätt', ghost: '000 av 000 rätt' },
  { code: 'NOG', value: '41 av 63 rätt', ghost: '00 av 00 rätt' },
  { code: 'DTK', value: '55 av 80 rätt', ghost: '00 av 00 rätt' },
] as const

const monoSmall: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

/** The stage: DailyPlanCard surface + Öva counts row + Framsteg ledger,
 *  re-rendered with the product's own `hpc-m3-*` classes so each
 *  language can own the arrival grammar end to end. L2's cadence
 *  indices (`i`) read the page top to bottom. */
function Stage({ kit, ready }: { kit: LangKit; ready: boolean }) {
  const { Frame, Line } = kit
  return (
    <div>
      {/* 1 · the DailyPlanCard handoff — chrome and heading are real
          ink from frame one for L1/L2; L3 blanks the data block. */}
      <DrillRailSection
        meta={
          <>
            <strong>Idag</strong>
            <Frame ready={ready} inline>
              <Line ready={ready} i={0} inline ghost="~00 min · uppskattat" ruleW="12ch">
                ~14 min · uppskattat
              </Line>
            </Frame>
          </>
        }
        delay={0}
      >
        <h2 className="hpc-m3-h">Dagens plan</h2>
        <Frame ready={ready}>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {PLAN_ROWS.map((row, r) => (
              <li key={row.headline} className="hpc-m3-plan-item">
                <span className="hpc-m3-plan-n" aria-hidden>
                  {r + 1}.
                </span>
                <span style={{ display: 'block', minWidth: 0 }}>
                  <span className="hpc-m3-plan-t" style={{ display: 'block' }}>
                    <Line
                      ready={ready}
                      i={1 + r * 2}
                      ruleW="24ch"
                      ghost={
                        <>
                          {row.tag ? <span className="hpc-m3-tag">{row.tag}</span> : null}
                          {row.ghostHeadline}
                        </>
                      }
                    >
                      {row.tag ? <span className="hpc-m3-tag">{row.tag}</span> : null}
                      {row.headline}
                    </Line>
                  </span>
                  <span className="hpc-m3-plan-r" style={{ display: 'block' }}>
                    <Line ready={ready} i={2 + r * 2} ruleW="34ch" ghost={row.ghostRationale}>
                      {row.rationale}
                    </Line>
                  </span>
                </span>
                <span className="hpc-m3-plan-min">
                  <Line ready={ready} i={1 + r * 2} inline ghost="~0 min" ruleW="5ch">
                    {row.min}
                  </Line>
                </span>
              </li>
            ))}
          </ol>
        </Frame>
      </DrillRailSection>

      {/* 2 · Öva-lane grammar: recommendation copy + count slots. */}
      <section style={{ marginTop: 36 }}>
        <Frame ready={ready}>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              lineHeight: 1.5,
              color: 'var(--ink-2)',
              margin: 0,
              maxWidth: '46ch',
            }}
          >
            <Line
              ready={ready}
              i={7}
              ruleW="40ch"
              ghost="Schemat föreslår XYZ — svagast just nu. Välj fritt om du hellre tar något annat."
            >
              Schemat föreslår NOG — svagast just nu. Välj fritt om du hellre tar något annat.
            </Line>
          </p>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: '0.08em',
              margin: '14px 0 0',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <Line
              ready={ready}
              i={8}
              ruleW="28ch"
              ghost={
                <>
                  ORD <CountMuted>0 väntar</CountMuted> · MEK <CountMuted>0 väntar</CountMuted> ·
                  NOG <CountMuted>00 väntar</CountMuted>
                </>
              }
            >
              ORD <CountMuted>3 väntar</CountMuted> · MEK <CountMuted>5 väntar</CountMuted> · NOG{' '}
              <CountMuted>12 väntar</CountMuted>
            </Line>
          </p>
        </Frame>
      </section>

      {/* 3 · Framsteg ledger: hero numeral + per-section tallies. */}
      <section style={{ marginTop: 36 }}>
        <Frame ready={ready}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(44px, 6vw, 64px)',
              lineHeight: 1.05,
              letterSpacing: '-0.01em',
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            <Line ready={ready} i={9} inline ghost="0,00" ruleW="3.4ch">
              1,41
            </Line>
            <span style={{ fontSize: '0.45em', color: 'var(--muted)' }}> av 2,0</span>
          </h2>
          <div style={{ marginTop: 14, maxWidth: 380 }}>
            {LEDGER_ROWS.map((row, r) => (
              <div
                key={row.code}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  padding: '7px 0',
                  borderBottom: '1px solid var(--hairline-2)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <span style={{ letterSpacing: '0.08em' }}>{row.code}</span>
                <span style={{ color: 'var(--muted)' }}>
                  <Line ready={ready} i={10 + r} inline ghost={row.ghost} ruleW="12ch">
                    {row.value}
                  </Line>
                </span>
              </div>
            ))}
          </div>
        </Frame>
      </section>
    </div>
  )
}

function CountMuted({ children }: { children: ReactNode }) {
  return <span style={{ fontSize: 10, color: 'var(--muted)' }}>{children}</span>
}

/* ── the shared shell: thesis + controls + stage ─────────────────── */

function Shell({
  name,
  thesis,
  kit,
  testid,
}: {
  name: string
  thesis: string
  kit: LangKit
  testid: string
}) {
  const [speed, setSpeed] = useState<Speed>('langsam')
  const { ready, reload } = useFakeQuery(LATENCY[speed])

  const pill = (active: boolean): CSSProperties => ({
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.06em',
    padding: '6px 12px',
    borderRadius: 999,
    border: `1px solid ${active ? 'var(--ink)' : 'var(--hairline)'}`,
    background: active ? 'var(--ink)' : 'var(--panel)',
    color: active ? 'var(--bg)' : 'var(--ink-2)',
    cursor: 'pointer',
  })

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', color: 'var(--ink)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 6,
        }}
      >
        <p style={{ ...monoSmall, margin: 0 }}>{name}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setSpeed('snabb')}
            data-testid={`${testid}-speed-snabb`}
            style={pill(speed === 'snabb')}
          >
            snabb · 300 ms
          </button>
          <button
            type="button"
            onClick={() => setSpeed('langsam')}
            data-testid={`${testid}-speed-langsam`}
            style={pill(speed === 'langsam')}
          >
            långsam · 2,5 s
          </button>
          <button
            type="button"
            onClick={reload}
            data-testid={`${testid}-reload`}
            style={pill(false)}
          >
            Ladda om ↻
          </button>
        </div>
      </div>
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.55,
          color: 'var(--muted)',
          margin: '0 0 26px',
          maxWidth: '68ch',
        }}
      >
        {thesis}
      </p>
      <div data-testid={`${testid}-stage`} data-ready={ready ? 'true' : 'false'}>
        <Stage kit={kit} ready={ready} />
      </div>
    </div>
  )
}

/* ── the three chips ─────────────────────────────────────────────── */

export function LOAD1() {
  return (
    <Shell
      name="L1 · Bläckfläcken — sidan skärps i fokus"
      thesis={
        'Bläck-metaforen bokstavligt: platshållaren är en suddig SPÖKBILD av den ' +
        'färdiga typografin — riktiga textformer, låg opacitet, oskärpa, helt stilla. ' +
        'När datan landar skärps sidan i fokus, som bläck som dras in i papprets ' +
        'fibrer. Ingen skelett-grammatik alls: det du väntar på är sidan själv, ' +
        'sedd genom vått papper.'
      }
      kit={LANG1}
      testid="load1"
    />
  )
}

export function LOAD2() {
  return (
    <Shell
      name="L2 · Skriften — sidan skrivs när datan landar"
      thesis={
        'Pennans skola: innan datan finns nästan ingenting — en svag baslinje per ' +
        'rad, som ett linjerat ark som väntar. När datan landar SKRIVS innehållet ' +
        'in: varje rad sveper fram vänster→höger i kort kadens uppifrån och ned, ' +
        'samma dragna-streck-grammatik som Bläcket använder för betyg och regler, ' +
        'nu applicerad på ankomst. Sidan laddas inte — den skrivs.'
      }
      kit={LANG2}
      testid="load2"
    />
  )
}

export function LOAD3() {
  return (
    <Shell
      name="L3 · Vita arket — ingenting förrän allt"
      thesis={
        'Anti-skelettets position: inga platshållare alls. Ärligt reserverat utrymme ' +
        '(inget hoppar när datan landar), lugnt tomt papper under riktig krom — och ' +
        'när datan är klar anländer hela blocket i ETT komponerat slag: en enda ' +
        'tork, ingen stegring per element. Ingenting förrän det är klart; sedan ' +
        'omedelbart och lugnt.'
      }
      kit={LANG3}
      testid="load3"
    />
  )
}

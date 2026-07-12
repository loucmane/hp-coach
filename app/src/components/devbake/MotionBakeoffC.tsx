// MotionBakeoffC — the CRAFT lens on app-wide motion: SOTA product-motion
// grammar (orchestrated staggers, exit-before-enter, shared-element
// continuity, confident easings — the Linear/Vercel/Family register)
// TRANSLATED into Boksidan's print idiom so none of it reads as SaaS
// gloss on a book page.
//
// Two complete motion languages, opposed physics inside one book:
//
//   MOTC1 · "Trycket" — LETTERPRESS physics. Mass meeting paper: every
//     arrival is pressure followed by a decisive settle, zero bounce
//     (only --ease-reading and --ease-exit; the spring never appears).
//     Rules draw left→right like a forme being inked; the headline
//     settles by drawing together (scaleX 1.03→1, origin left — the
//     house letter-spacing settle re-cut in pure transform); verdicts
//     are STAMPED (scale 1.16→1, one impression); navigation is
//     exit-before-enter around a fixed spine hairline — the page
//     changes, the book does not. Signature: Arkvändningen — a 560ms
//     clip-path leaf-turn with a traveling page edge, the one
//     reading-pace beat, reserved for major context changes.
//
//   MOTC2 · "Bläcket" — HANDWRITING physics. A light pen: spring
//     overshoot (--ease-spring) on small marks only, never on the page
//     itself. Content is WRITTEN in from the left margin; dot leaders
//     and verdict words are drawn via clip-path reveal (the nib moving
//     across); the corrector's check ✓ and strike are drawn marks, not
//     state flips. Navigation: an ink tick travels the ToC with a
//     spring (FLIP-style continuity). Signature: Siffran följer med —
//     the ONE accent due-count numeral flies from the rail folio into
//     the page headline (shared-element continuity done with the only
//     accent object the chrome owns, so motion introduces zero new
//     accent usage).
//
// What separates them: Trycket moves the PAGE (columns, leaves, blocks
// — heavy, damped, orchestrated); Bläcket moves the MARKS on the page
// (ticks, checks, numerals — light, sprung, singular). Trycket confirms
// causality by weight; Bläcket confirms it by authorship — you watch
// the mark being made where your action landed.
//
// Discipline shared by both: durations 150–400ms (signatures 520/560ms,
// once per trigger, never looping); transform/opacity only, clip-path
// sparingly (leaf turn, drawn text); accent appears only where it
// already lives (active door, the one due-count numeral, the CTA);
// verdict color is semantic --ok/--bad ink, per the house verdict law.
// prefers-reduced-motion collapses every animation in this file to a
// 1ms opacity fade and kills every transition — built into each
// concept's stylesheet, not inherited by accident.
//
// DESIGN artifact: fixtures only, no routes, no shared-file edits.

import { type CSSProperties, type ReactNode, useRef, useState } from 'react'

// ── shared scaffolding (ConceptShell / Board conventions, NavSpineIcons) ──

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

function ConceptShell({
  title,
  thesis,
  children,
}: {
  title: string
  thesis: string
  children: ReactNode
}) {
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
        {title}
      </h1>
      <p
        style={{
          fontSize: 14,
          color: 'var(--ink-2)',
          maxWidth: '68ch',
          margin: '10px 0 0',
          lineHeight: 1.5,
        }}
      >
        {thesis}
      </p>
      {children}
    </div>
  )
}

/** One labeled moment. REPLAY remounts the stage so every mount
 *  animation re-runs and interactive state resets. */
function Board({ caption, children }: { caption: string; children: ReactNode }) {
  const [k, setK] = useState(0)
  return (
    <section style={{ marginTop: 48 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 14,
        }}
      >
        <div style={{ ...eyebrow, maxWidth: '72ch' }}>{caption}</div>
        <button
          type="button"
          onClick={() => setK((n) => n + 1)}
          style={{
            ...monoSmall,
            color: 'var(--ink-2)',
            background: 'transparent',
            border: '1px solid var(--hairline)',
            padding: '4px 10px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
          }}
        >
          spela igen ↻
        </button>
      </div>
      <div key={k}>{children}</div>
    </section>
  )
}

/** A demo page sheet — the printed surface every moment plays on. */
function Sheet({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        border: '1px solid var(--hairline)',
        background: 'var(--bg)',
        padding: '26px 28px 30px',
        maxWidth: 560,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function MonoAction({
  label,
  onClick,
  active,
}: {
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...monoSmall,
        textTransform: 'uppercase',
        color: active ? 'var(--bg)' : 'var(--ink-2)',
        background: active ? 'var(--ink)' : 'transparent',
        border: `1px solid ${active ? 'var(--ink)' : 'var(--hairline)'}`,
        padding: '4px 10px',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

// ── fixtures (realistic HP-Coach shapes) ─────────────────────────────

const LEDGER = [
  { code: 'ORD', name: 'Ordförståelse', n: '40 fr' },
  { code: 'LÄS', name: 'Läsförståelse', n: '20 fr' },
  { code: 'MEK', name: 'Meningskomplettering', n: '20 fr' },
  { code: 'ELF', name: 'Engelsk läsförståelse', n: '20 fr' },
  { code: 'XYZ', name: 'Algebra', n: '12 fr' },
  { code: 'KVA', name: 'Kvantitativa jämförelser', n: '12 fr' },
] as const

const ORD_Q = {
  headword: 'begrunda',
  options: ['betvivla', 'överväga', 'förkunna', 'bestrida', 'avfärda'],
  correct: 1,
  gloss: 'att tänka noga igenom — nyckeln är be- + grund: gå till grunden med saken.',
} as const

/* ════════════════════════════════════════════════════════════════════
 * MOTC1 · Trycket — letterpress
 * ════════════════════════════════════════════════════════════════════ */

const MOTC1_CSS = `
@keyframes motc1-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes motc1-rule { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes motc1-settle {
  from { opacity: 0; transform: scaleX(1.03) }
  to   { opacity: 1; transform: scaleX(1) }
}
@keyframes motc1-press {
  from { opacity: 0; transform: translateY(7px) }
  to   { opacity: 1; transform: none }
}
@keyframes motc1-stamp {
  0%   { opacity: 0; transform: scale(1.16) }
  55%  { opacity: 1 }
  100% { opacity: 1; transform: scale(1) }
}
@keyframes motc1-wipe { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes motc1-col-out {
  from { opacity: 1; transform: none }
  to   { opacity: 0; transform: translateX(-14px) }
}
@keyframes motc1-col-in {
  from { opacity: 0; transform: translateX(18px) }
  to   { opacity: 1; transform: none }
}
@keyframes motc1-leaf {
  from { clip-path: inset(0 100% 0 0) }
  to   { clip-path: inset(0 0 0 0) }
}
@keyframes motc1-edge {
  0%   { transform: translateX(0); opacity: 1 }
  88%  { opacity: 1 }
  100% { transform: translateX(438px); opacity: 0 }
}

.motc1-rule    { animation: motc1-rule 260ms var(--ease-reading) both; transform-origin: left center }
.motc1-fade    { animation: motc1-fade 200ms var(--ease-reading) both }
.motc1-settle  { animation: motc1-settle 360ms var(--ease-reading) both; transform-origin: left center }
.motc1-press   { animation: motc1-press 320ms var(--ease-reading) both }
.motc1-stamp   { animation: motc1-stamp 240ms var(--ease-reading) both }
.motc1-wipe    { animation: motc1-wipe 220ms var(--ease-reading) both; transform-origin: left center }
.motc1-col-out { animation: motc1-col-out 150ms var(--ease-exit) both }
.motc1-col-in  { animation: motc1-col-in 300ms var(--ease-reading) both }
.motc1-leaf    { animation: motc1-leaf 560ms var(--ease-reading) both }
.motc1-edge    { animation: motc1-edge 560ms var(--ease-reading) both }

@media (prefers-reduced-motion: reduce) {
  [class*='motc1-'] {
    animation-name: motc1-fade !important;
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    transition: none !important;
    clip-path: none !important;
  }
}
`

const dLedgerRule = (i: number) => ({ animationDelay: `${i * 50}ms` })

function EntranceT() {
  return (
    <Sheet>
      <div className="motc1-rule" style={{ height: 1, background: 'var(--ink)' }} />
      <div className="motc1-fade" style={{ ...eyebrow, marginTop: 14, animationDelay: '80ms' }}>
        Fredag 11 juli · 114 dagar kvar
      </div>
      <h2
        className="motc1-settle"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 44,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          color: 'var(--ink)',
          margin: '10px 0 0',
          animationDelay: '120ms',
        }}
      >
        God morgon.
      </h2>
      <p
        className="motc1-press"
        style={{
          fontSize: 15,
          lineHeight: 1.55,
          color: 'var(--ink-2)',
          maxWidth: '48ch',
          margin: '12px 0 0',
          animationDelay: '200ms',
        }}
      >
        Dagens pass: 10 frågor KVA, sedan repetition av gårdagens två fel.
      </p>
      <div
        className="motc1-press"
        style={{
          display: 'flex',
          gap: 40,
          marginTop: 20,
          paddingTop: 14,
          borderTop: '1px solid var(--hairline)',
          animationDelay: '260ms',
        }}
      >
        {[
          { n: '14', l: 'att repetera' },
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
      </div>
      <div className="motc1-fade" style={{ ...monoSmall, marginTop: 18, animationDelay: '380ms' }}>
        s. 1 · hem
      </div>
    </Sheet>
  )
}

function LedgerT() {
  return (
    <Sheet>
      <div style={{ ...eyebrow, marginBottom: 6 }}>Innehåll · sektioner</div>
      {LEDGER.map((row, i) => (
        <div key={row.code} style={{ position: 'relative', padding: '11px 0' }}>
          <div
            className="motc1-rule"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 1,
              background: 'var(--hairline-2)',
              ...dLedgerRule(i),
            }}
          />
          <div
            className="motc1-press"
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 12,
              animationDelay: `${i * 50 + 40}ms`,
            }}
          >
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
            <span style={{ flex: 1 }} />
            <span
              className="motc1-fade"
              style={{ ...monoSmall, animationDelay: `${i * 50 + 120}ms` }}
            >
              {row.n}
            </span>
          </div>
        </div>
      ))}
    </Sheet>
  )
}

function VerdictT() {
  const [picked, setPicked] = useState<number | null>(null)
  const graded = picked !== null
  const right = picked === ORD_Q.correct
  return (
    <Sheet>
      <div style={eyebrow}>ORD · 12/40</div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 40,
          color: 'var(--ink)',
          margin: '8px 0 14px',
        }}
      >
        {ORD_Q.headword}
      </div>
      <div style={{ borderTop: '1px solid var(--hairline)' }}>
        {ORD_Q.options.map((opt, i) => {
          const isOk = graded && i === ORD_Q.correct
          const isBad = graded && i === picked && !right
          const dim = graded && !isOk && !isBad
          return (
            <button
              type="button"
              key={opt}
              disabled={graded}
              onClick={() => setPicked(i)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '11px 10px',
                border: 0,
                borderBottom: '1px solid var(--hairline-2)',
                background: 'transparent',
                textAlign: 'left',
                cursor: graded ? 'default' : 'pointer',
                overflow: 'hidden',
              }}
            >
              {(isOk || isBad) && (
                <span
                  aria-hidden
                  className="motc1-wipe"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: isOk ? 'var(--ok-soft)' : 'var(--bad-soft)',
                  }}
                />
              )}
              <span
                style={{
                  ...monoSmall,
                  position: 'relative',
                  color: isOk ? 'var(--ok)' : isBad ? 'var(--bad)' : 'var(--muted)',
                }}
              >
                {String.fromCharCode(97 + i)}
              </span>
              <span
                style={{
                  position: 'relative',
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
                  transition: 'color 160ms var(--ease-reading)',
                }}
              >
                {opt}
              </span>
              {(isOk || isBad) && (
                <span
                  className="motc1-fade"
                  style={{
                    ...monoSmall,
                    position: 'relative',
                    marginLeft: 'auto',
                    textTransform: 'uppercase',
                    color: isOk ? 'var(--ok)' : 'var(--bad)',
                    animationDelay: '80ms',
                  }}
                >
                  {isOk ? 'rätt svar' : 'ditt val'}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {graded && (
        <div style={{ paddingTop: 16 }}>
          <span
            className="motc1-stamp"
            style={{
              display: 'inline-block',
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 600,
              fontSize: 34,
              color: right ? 'var(--ok)' : 'var(--bad)',
            }}
          >
            {right ? 'Rätt.' : 'Fel.'}
          </span>
          <p
            className="motc1-press"
            style={{
              fontSize: 14.5,
              lineHeight: 1.55,
              color: 'var(--ink-2)',
              maxWidth: '52ch',
              margin: '8px 0 0',
              animationDelay: '140ms',
            }}
          >
            <em>överväga</em> — {ORD_Q.gloss}
          </p>
        </div>
      )}
      {!graded && (
        <div style={{ ...monoSmall, marginTop: 12 }}>välj a–e — trycket stämplar domen</div>
      )}
    </Sheet>
  )
}

const DOORS_T = [
  { id: 'hem', label: 'Hem', head: 'God morgon.', sub: 'Dagens pass väntar — 10 frågor KVA.' },
  { id: 'ova', label: 'Öva', head: 'Öva.', sub: '14 att repetera · KVA är varmast.' },
] as const

function NavT() {
  const [shown, setShown] = useState<(typeof DOORS_T)[number]['id']>('hem')
  const [leaving, setLeaving] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const go = (id: (typeof DOORS_T)[number]['id']) => {
    if (id === shown || leaving) return
    setLeaving(true)
    timer.current = window.setTimeout(() => {
      setShown(id)
      setLeaving(false)
    }, 150)
  }
  const door = DOORS_T.find((d) => d.id === shown) ?? DOORS_T[0]
  return (
    <Sheet>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {DOORS_T.map((d) => (
          <MonoAction key={d.id} label={d.label} active={shown === d.id} onClick={() => go(d.id)} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '84px 1px 1fr', columnGap: 20 }}>
        <div
          key={`m-${shown}-${leaving}`}
          className={leaving ? 'motc1-col-out' : 'motc1-col-in'}
          style={{ ...monoSmall, textAlign: 'right', paddingTop: 6, textTransform: 'uppercase' }}
        >
          {door.label}
          <br />
          <span style={{ color: 'var(--ink-2)' }}>{shown === 'hem' ? 's. 1' : 's. 4'}</span>
        </div>
        {/* the spine never moves — the book holds still while the page changes */}
        <div style={{ background: 'var(--hairline)' }} />
        <div key={`c-${shown}-${leaving}`} className={leaving ? 'motc1-col-out' : 'motc1-col-in'}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 32,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
            }}
          >
            {door.head}
          </div>
          <p style={{ fontSize: 14.5, color: 'var(--ink-2)', margin: '8px 0 0', maxWidth: '42ch' }}>
            {door.sub}
          </p>
        </div>
      </div>
      <div style={{ ...monoSmall, marginTop: 18 }}>
        utgång 150 ms (--ease-exit) → ingång 300 ms (--ease-reading) — aldrig samtidigt
      </div>
    </Sheet>
  )
}

function LeafT() {
  const [turned, setTurned] = useState(false)
  return (
    <div>
      <div
        style={{
          position: 'relative',
          width: 440,
          maxWidth: '100%',
          height: 230,
          border: '1px solid var(--hairline)',
          background: 'var(--bg)',
          overflow: 'hidden',
        }}
      >
        {/* page A — the practice hub */}
        <div style={{ position: 'absolute', inset: 0, padding: '24px 26px' }}>
          <div style={eyebrow}>Öva · repetera</div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 30,
              fontWeight: 500,
              color: 'var(--ink)',
              margin: '10px 0 0',
            }}
          >
            Redo för KVA?
          </div>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '8px 0 0', maxWidth: '36ch' }}>
            10 frågor · cirka 12 minuter. Kvantitativa jämförelser, blandade år.
          </p>
          <div style={{ ...monoSmall, position: 'absolute', right: 22, bottom: 16 }}>s. 4</div>
        </div>
        {/* page B — the drill, revealed by the leaf turn */}
        {turned && (
          <div
            className="motc1-leaf"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--bg)',
              padding: '24px 26px',
            }}
          >
            <div style={eyebrow}>KVA · 1/10</div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 30,
                color: 'var(--ink)',
                margin: '10px 0 0',
              }}
            >
              Kvantitet I eller II?
            </div>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '8px 0 0', maxWidth: '38ch' }}>
              I: medelvärdet av 3, 7 och x&ensp;·&ensp;II: medianen av 3, 7 och x
            </p>
            <div style={{ ...monoSmall, position: 'absolute', right: 22, bottom: 16 }}>s. 5</div>
          </div>
        )}
        {turned && (
          <span
            aria-hidden
            className="motc1-edge"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 1.5,
              background: 'var(--ink)',
            }}
          />
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 12 }}>
        <MonoAction label="Vänd blad →" onClick={() => setTurned(true)} />
        <span style={monoSmall}>
          560 ms, en gång per kontextbyte — passtart, provpass, klart-sidan. Aldrig i chrome.
        </span>
      </div>
    </div>
  )
}

/** MOTC1 · Trycket — letterpress: pressure, settle, no bounce. */
export function MOTC1() {
  return (
    <ConceptShell
      title="MOTC1 · Trycket"
      thesis="Boktryckets fysik: allt som anländer är tyngd som möter papper — ett bestämt tryck, en avklingning, aldrig studs. Linjaler dras vänster→höger som en infärgad form, rubriken sätter sig genom att dras samman, domen stämplas i ett enda avtryck, och navigering är utgång-före-ingång kring en spine som aldrig rör sig: sidan byts, boken står stilla. Signaturen är arkvändningen — bokens enda långsamma gest, reserverad för stora kontextbyten."
    >
      <style>{MOTC1_CSS}</style>
      <Board caption="01 · Sidans entré — Sidan sätts: linjal → märkrad → rubrik (sätter sig) → brödtext → folio, 0–380 ms">
        <EntranceT />
      </Board>
      <Board caption="02 · Lista — Liggaren: varje rads linjal dras, raden pressas ned på den, siffran landar sist; 50 ms förskjutning">
        <LedgerT />
      </Board>
      <Board caption="03 · Dom — Avtrycket: bakgrunden sveper in från marginalen, domordet stämplas (1,16→1) — tyngd, inte studs">
        <VerdictT />
      </Board>
      <Board caption="04 · Navigering — Spaltbytet: utgång 150 ms före ingång 300 ms; spine-hårlinjen står stilla genom bytet">
        <NavT />
      </Board>
      <Board caption="05 · SIGNATUR — Arkvändningen: nästa sida viks in över den gamla med en vandrande bladkant; 560 ms, en gång">
        <LeafT />
      </Board>
    </ConceptShell>
  )
}

/* ════════════════════════════════════════════════════════════════════
 * MOTC2 · Bläcket — handwriting
 * ════════════════════════════════════════════════════════════════════ */

const MOTC2_CSS = `
@keyframes motc2-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes motc2-write {
  from { opacity: 0; transform: translateX(-10px) }
  to   { opacity: 1; transform: none }
}
@keyframes motc2-rule-flick { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes motc2-pop {
  from { opacity: 0; transform: scale(0.6) }
  to   { opacity: 1; transform: scale(1) }
}
@keyframes motc2-drawn {
  from { clip-path: inset(0 100% 0 0); opacity: 0.5 }
  to   { clip-path: inset(0 -3% 0 0); opacity: 1 }
}
@keyframes motc2-strike { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes motc2-fly {
  from { transform: translate(0, 0) scale(1) }
  to   { transform: translate(50px, -36px) scale(2.6) }
}

.motc2-write  { animation: motc2-write 280ms var(--ease-reading) both }
.motc2-fade   { animation: motc2-fade 200ms var(--ease-reading) both }
.motc2-rule-flick {
  animation: motc2-rule-flick 340ms var(--ease-spring) both;
  transform-origin: left center;
}
.motc2-pop    { animation: motc2-pop 260ms var(--ease-spring) both }
.motc2-drawn  { animation: motc2-drawn 300ms var(--ease-reading) both }
.motc2-strike {
  animation: motc2-strike 260ms var(--ease-spring) both;
  transform-origin: left center;
}
.motc2-fly    { animation: motc2-fly 520ms var(--ease-spring) both }
.motc2-tick   { transition: transform 320ms var(--ease-spring) }
.motc2-toclabel { transition: color 200ms var(--ease-reading) }
.motc2-folio-out { transition: opacity 120ms var(--ease-reading) }

@media (prefers-reduced-motion: reduce) {
  [class*='motc2-'] {
    animation-name: motc2-fade !important;
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    transition: none !important;
    clip-path: none !important;
  }
}
`

function EntranceB() {
  return (
    <Sheet>
      <div className="motc2-write" style={eyebrow}>
        Fredag 11 juli · 114 dagar kvar
      </div>
      <h2
        className="motc2-write"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 44,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          color: 'var(--ink)',
          margin: '10px 0 0',
          animationDelay: '70ms',
        }}
      >
        God morgon.
      </h2>
      <div
        className="motc2-rule-flick"
        style={{
          height: 1,
          background: 'var(--ink)',
          margin: '14px 0 0',
          animationDelay: '170ms',
        }}
      />
      <p
        className="motc2-write"
        style={{
          fontSize: 15,
          lineHeight: 1.55,
          color: 'var(--ink-2)',
          maxWidth: '48ch',
          margin: '12px 0 0',
          animationDelay: '220ms',
        }}
      >
        Dagens pass: 10 frågor KVA, sedan repetition av gårdagens två fel.
      </p>
      <div
        className="motc2-write"
        style={{ display: 'flex', gap: 40, marginTop: 18, animationDelay: '300ms' }}
      >
        {[
          { n: '14', l: 'att repetera' },
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
      </div>
    </Sheet>
  )
}

function LedgerB() {
  return (
    <Sheet>
      <div style={{ ...eyebrow, marginBottom: 6 }}>Innehåll · sektioner</div>
      {LEDGER.map((row, i) => (
        <div
          key={row.code}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            padding: '11px 0',
            borderBottom: '1px solid var(--hairline-2)',
          }}
        >
          <span
            className="motc2-write"
            style={{
              ...monoSmall,
              color: 'var(--ink-2)',
              width: 34,
              animationDelay: `${i * 60}ms`,
            }}
          >
            {row.code}
          </span>
          <span
            className="motc2-write"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16.5,
              fontWeight: 500,
              color: 'var(--ink)',
              animationDelay: `${i * 60 + 30}ms`,
            }}
          >
            {row.name}
          </span>
          <span
            aria-hidden
            className="motc2-drawn"
            style={{
              flex: 1,
              borderBottom: '1px dotted var(--muted)',
              opacity: 0.55,
              transform: 'translateY(-3px)',
              minWidth: 12,
              animationDelay: `${i * 60 + 90}ms`,
            }}
          />
          <span className="motc2-pop" style={{ ...monoSmall, animationDelay: `${i * 60 + 200}ms` }}>
            {row.n}
          </span>
        </div>
      ))}
    </Sheet>
  )
}

function VerdictB() {
  const [picked, setPicked] = useState<number | null>(null)
  const graded = picked !== null
  const right = picked === ORD_Q.correct
  return (
    <Sheet>
      <div style={eyebrow}>ORD · 12/40</div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 40,
          color: 'var(--ink)',
          margin: '8px 0 14px',
        }}
      >
        {ORD_Q.headword}
      </div>
      <div style={{ borderTop: '1px solid var(--hairline)' }}>
        {ORD_Q.options.map((opt, i) => {
          const isOk = graded && i === ORD_Q.correct
          const isBad = graded && i === picked && !right
          const dim = graded && !isOk && !isBad
          return (
            <button
              type="button"
              key={opt}
              disabled={graded}
              onClick={() => setPicked(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '11px 10px',
                border: 0,
                borderBottom: '1px solid var(--hairline-2)',
                background: 'transparent',
                textAlign: 'left',
                cursor: graded ? 'default' : 'pointer',
              }}
            >
              <span
                style={{
                  ...monoSmall,
                  color: isOk ? 'var(--ok)' : isBad ? 'var(--bad)' : 'var(--muted)',
                }}
              >
                {String.fromCharCode(97 + i)}
              </span>
              <span
                style={{
                  position: 'relative',
                  fontFamily: 'var(--font-display)',
                  fontSize: 17,
                  color: isOk
                    ? 'var(--ok)'
                    : isBad
                      ? 'var(--bad)'
                      : dim
                        ? 'var(--muted)'
                        : 'var(--ink)',
                  transition: 'color 160ms var(--ease-reading)',
                }}
              >
                {opt}
                {isBad && (
                  <span
                    aria-hidden
                    className="motc2-strike"
                    style={{
                      position: 'absolute',
                      left: -2,
                      right: -2,
                      top: '52%',
                      height: 1.5,
                      background: 'var(--bad)',
                    }}
                  />
                )}
              </span>
              {isOk && (
                <span
                  className="motc2-drawn"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 17,
                    color: 'var(--ok)',
                    animationDelay: isBad ? '0ms' : '60ms',
                  }}
                >
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>
      {graded && (
        <div style={{ paddingTop: 16 }}>
          <span
            className="motc2-drawn"
            style={{
              display: 'inline-block',
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 600,
              fontSize: 34,
              color: right ? 'var(--ok)' : 'var(--bad)',
              animationDuration: '320ms',
            }}
          >
            {right ? 'Rätt.' : 'Fel.'}
          </span>
          <p
            className="motc2-write"
            style={{
              fontSize: 14.5,
              lineHeight: 1.55,
              color: 'var(--ink-2)',
              maxWidth: '52ch',
              margin: '8px 0 0',
              animationDelay: '180ms',
            }}
          >
            <em>överväga</em> — {ORD_Q.gloss}
          </p>
        </div>
      )}
      {!graded && (
        <div style={{ ...monoSmall, marginTop: 12 }}>
          välj a–e — rättarens penna drar bocken och strecket
        </div>
      )}
    </Sheet>
  )
}

const TOC_B = ['Hem', 'Öva', 'Provpass', 'Uppslag', 'Framsteg'] as const
const TOC_ROW_H = 38

function NavB() {
  const [active, setActive] = useState(1)
  return (
    <Sheet style={{ display: 'flex', gap: 28 }}>
      <nav
        aria-label="Sektioner (demo)"
        style={{ position: 'relative', width: 168, flexShrink: 0 }}
      >
        {/* the ink tick — ONE marker that travels with a spring (FLIP) */}
        <span
          aria-hidden
          className="motc2-tick"
          style={{
            position: 'absolute',
            left: 0,
            top: TOC_ROW_H / 2 - 1,
            width: 12,
            height: 1.6,
            background: 'var(--ink)',
            transform: `translateY(${active * TOC_ROW_H}px)`,
          }}
        />
        {TOC_B.map((label, i) => (
          <button
            type="button"
            key={label}
            onClick={() => setActive(i)}
            className="motc2-toclabel"
            style={{
              display: 'block',
              width: '100%',
              height: TOC_ROW_H,
              padding: '0 0 0 22px',
              border: 0,
              background: 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontVariant: 'all-small-caps',
              letterSpacing: '0.07em',
              fontWeight: active === i ? 600 : 500,
              color: active === i ? 'var(--accent)' : 'var(--ink-2)',
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          key={active}
          className="motc2-write"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 30,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
          }}
        >
          {TOC_B[active]}.
        </div>
        <p
          key={`s-${active}`}
          className="motc2-write"
          style={{
            fontSize: 14,
            color: 'var(--ink-2)',
            margin: '8px 0 0',
            maxWidth: '34ch',
            animationDelay: '60ms',
          }}
        >
          Strecket är bläck och färdas med fjädern; den aktiva radens färg bor där den redan bor.
        </p>
      </div>
    </Sheet>
  )
}

function SharedCountB() {
  const [phase, setPhase] = useState<'rest' | 'fly' | 'landed'>('rest')
  const open = phase !== 'rest'
  return (
    <div>
      <div
        style={{
          position: 'relative',
          width: 460,
          maxWidth: '100%',
          height: 210,
          border: '1px solid var(--hairline)',
          background: 'var(--bg)',
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        {/* the rail */}
        <div style={{ width: 180, borderRight: '1px solid var(--hairline)', padding: '18px 16px' }}>
          <div style={{ ...eyebrow, fontSize: 9, marginBottom: 10 }}>Innehåll</div>
          {(['Hem', 'Öva', 'Provpass'] as const).map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                padding: '8px 0',
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                fontVariant: 'all-small-caps',
                letterSpacing: '0.07em',
                fontWeight: label === 'Öva' && open ? 600 : 500,
                color: label === 'Öva' && open ? 'var(--ink)' : 'var(--ink-2)',
              }}
            >
              {label}
              {label === 'Öva' && (
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
                  {/* the rail's due-count folio — hidden while its numeral travels */}
                  <span
                    className="motc2-folio-out"
                    style={{
                      ...monoSmall,
                      color: 'var(--accent)',
                      opacity: phase === 'rest' ? 1 : 0,
                    }}
                  >
                    14
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
        {/* the page */}
        <div style={{ flex: 1, padding: '18px 20px' }}>
          {open && (
            <>
              <div className="motc2-write" style={eyebrow}>
                Öva · repetera
              </div>
              <div
                className="motc2-write"
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 10,
                  margin: '12px 0 0',
                  animationDelay: '80ms',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 30,
                    color: 'var(--accent)',
                    fontVariantNumeric: 'tabular-nums',
                    opacity: phase === 'landed' ? 1 : 0,
                  }}
                >
                  14
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 19,
                    fontWeight: 500,
                    color: 'var(--ink)',
                  }}
                >
                  att repetera
                </span>
              </div>
              <p
                className="motc2-write"
                style={{
                  fontSize: 13.5,
                  color: 'var(--ink-2)',
                  margin: '10px 0 0',
                  maxWidth: '30ch',
                  animationDelay: '160ms',
                }}
              >
                KVA är varmast — sju av fjorton väntar där.
              </p>
            </>
          )}
        </div>
        {/* the traveling numeral — the ONE accent object, in flight */}
        {phase === 'fly' && (
          <span
            aria-hidden
            className="motc2-fly"
            onAnimationEnd={() => setPhase('landed')}
            style={{
              position: 'absolute',
              left: 150,
              top: 82,
              fontFamily: 'var(--font-mono)',
              fontSize: 11.5,
              color: 'var(--accent)',
              fontVariantNumeric: 'tabular-nums',
              transformOrigin: 'left top',
            }}
          >
            14
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 12 }}>
        <MonoAction
          label="Öppna Öva →"
          onClick={() => {
            if (phase === 'rest') setPhase('fly')
          }}
        />
        <span style={monoSmall}>
          samma siffra, samma accent — folion lyfter från förteckningen och blir sidans rubrik
        </span>
      </div>
    </div>
  )
}

/** MOTC2 · Bläcket — handwriting: sprung marks, drawn ink, one traveling numeral. */
export function MOTC2() {
  return (
    <ConceptShell
      title="MOTC2 · Bläcket"
      thesis="Handskriftens fysik: en lätt penna, inte en tung press. Innehåll skrivs in från vänstermarginalen; punktutfyllnader och domord dras fram som av en nib som rör sig över papperet; rättarens bock och streck är ritade märken, inte tillståndsbyten. Fjädern (överskjutning) tillhör bara de små märkena — strecket som flyttar i förteckningen, siffran som poppar — aldrig sidan själv. Signaturen är siffran som följer med: kö-antalet, chromens enda accentobjekt, lyfter från förteckningens folio och landar som sidans rubriksiffra — kontinuitet i stället för teleportering."
    >
      <style>{MOTC2_CSS}</style>
      <Board caption="01 · Sidans entré — Anteckningen: raderna skrivs in uppifrån och ned, linjalen flikas fram med fjäder; 0–380 ms">
        <EntranceB />
      </Board>
      <Board caption="02 · Lista — Punktraderna: kod och namn skrivs, utfyllnaden dras av nibben, folion poppar sist; 60 ms förskjutning">
        <LedgerB />
      </Board>
      <Board caption="03 · Dom — Rättarens penna: bocken dras vid rätt rad, strecket fjädrar över fel, domordet skrivs fram">
        <VerdictB />
      </Board>
      <Board caption="04 · Navigering — Strecket flyttar: EN markör färdas med fjäder mellan förteckningens rader (FLIP); innehållet skrivs in">
        <NavB />
      </Board>
      <Board caption="05 · SIGNATUR — Siffran följer med: kö-antalet lyfter från railens folio och landar som sidans rubriksiffra; 520 ms, en gång">
        <SharedCountB />
      </Board>
    </ConceptShell>
  )
}

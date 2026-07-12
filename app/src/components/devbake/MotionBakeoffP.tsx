// MotionBakeoffP — motion-language bake-off, PRINT LENS (P). Two complete
// motion systems for Boksidan, each answering: what would motion look like
// if a beautifully typeset page could move? Not page-flip kitsch — the
// modern, disciplined expression of print PHYSICS.
//
// ── MOTP1 · "Anslaget" (the impression) ─────────────────────────────
// Letterpress physics. On a press NOTHING travels laterally — the forme
// is locked, the platen comes down, type is PRESSED into the paper.
// So in this system no element ever slides in from off-stage: everything
// arrives in its final position, opacity playing ink density and a
// minute scale-settle (1.02 → 1) playing the kiss of the platen. The
// grammar is percussive and discrete: eyebrow, headline, rule, stats
// are stamped in typesetting order; grading over-stamps the row in a
// second colour pass; door changes ink the old page out and press the
// new one in — the bokmärke does not travel, it is stamped at the new
// slot. Signature: the deep impression — "Klart." struck hard enough
// (scale 1.22 → 0.97 → 1) that the rules below visibly RECEIVE the
// press, a one-time 2px reaction nudge. The page is a material, not a
// backdrop.
//
// ── MOTP2 · "Bläckets väg" (the ink's path) ─────────────────────────
// Flow physics. Ink is liquid: it travels the page's own structure and
// never jumps. Rules draw themselves left→right (scaleX); text wicks in
// behind an advancing edge (clip-path inset, used sparingly, only on
// the two display words); ledger rows fill top-to-bottom as the pen
// reaches them, each row's hairline leading its text by 80ms; the
// verdict POURS down the option's leading indicator (scaleY, origin
// top) before the word is written; the margin ribbon physically RUNS
// down the spine to the new door (translateY transition — the one
// travelling object, because ink in a gutter really does run).
// Signature: "Räkneverket" — the folio numeral rolls like a mechanical
// counting wheel (a masked digit drum on translateY), so progress is
// felt as machinery advancing, not text replaced.
//
// What separates them: P1 is vertical / discrete / percussive — motion
// as PRESSURE, causality confirmed by a stamp landing where you acted.
// P2 is lateral / continuous / linear — motion as PROPAGATION, causality
// confirmed by ink flowing from your action outward along the page's
// structure. Both obey the house discipline: transform/opacity only
// (clip-path twice, deliberately), 150–400ms everywhere except each
// signature's single longer beat, zero looping motion, accent only on
// the active-door marker and the one due-count numeral, and a scoped
// prefers-reduced-motion block that collapses every animation to
// opacity-or-nothing (the global index.css wildcard then zeroes even
// that).
//
// DESIGN artifact: inert fixtures, live tokens, no routes touched.

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

// ── shared fixtures (Swedish product strings, real section codes) ────

const LEDGER = [
  { code: 'ORD', name: 'Ordförståelse', due: 12, level: '1,4' },
  { code: 'LÄS', name: 'Läsförståelse', due: 6, level: '1,6' },
  { code: 'XYZ', name: 'Ekvationer', due: 9, level: '1,1' },
  { code: 'KVA', name: 'Kvantitativa jämförelser', due: 4, level: '1,3' },
] as const

const ORD_Q = {
  word: 'gagn',
  options: [
    { k: 'a', t: 'nytta', ok: true },
    { k: 'b', t: 'skada', ok: false },
    { k: 'c', t: 'tvivel', ok: false },
    { k: 'd', t: 'hinder', ok: false },
    { k: 'e', t: 'vana', ok: false },
  ],
} as const

const DOORS = ['Hem', 'Öva', 'Framsteg'] as const
type DoorName = (typeof DOORS)[number]

const PAGES: Record<DoorName, { title: string; line: string }> = {
  Hem: { title: 'God morgon.', line: 'Dagens pass väntar — 20 minuter, tre sektioner.' },
  Öva: { title: 'Öva', line: 'ORD · 12 kort att repetera, äldsta först.' },
  Framsteg: { title: 'Framsteg', line: 'Din kurva: +0,04 denna vecka.' },
}

// ── shared styles ─────────────────────────────────────────────────────

const eyebrow: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  fontVariantNumeric: 'tabular-nums',
}

const monoSm: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  color: 'var(--muted)',
  fontVariantNumeric: 'tabular-nums',
}

const CSS = `
/* ═══ MOTP shared ═══ */
@keyframes mp-exit { to { opacity: 0 } }
.mp-exit { animation: mp-exit 140ms var(--ease-exit) both }

/* ═══ MOTP1 · Anslaget — press physics ═══ */
/* the kiss: ink density + platen settle. Nothing travels. */
@keyframes mp1-press {
  from { opacity: 0; transform: scale(1.02) }
  to   { opacity: 1; transform: scale(1) }
}
/* the stamp: a harder strike with kiss-back, for words that judge */
@keyframes mp1-stamp {
  0%   { opacity: 0; transform: scale(1.12) }
  55%  { opacity: 1; transform: scale(0.985) }
  100% { opacity: 1; transform: scale(1) }
}
/* the deep impression — signature only, the one longer beat */
@keyframes mp1-deep {
  0%   { opacity: 0; transform: scale(1.22) }
  45%  { opacity: 1; transform: scale(0.97) }
  70%  { transform: scale(1.008) }
  100% { opacity: 1; transform: scale(1) }
}
/* the paper receiving the press — a one-time reaction, never a loop */
@keyframes mp1-react {
  0%, 100% { transform: translateY(0) }
  35%      { transform: translateY(2px) }
}
.mp1-press { animation: mp1-press 240ms var(--ease-reading) both }
.mp1-stamp { animation: mp1-stamp 300ms var(--ease-reading) both }
.mp1-deep  { animation: mp1-deep 620ms var(--ease-reading) both }
.mp1-react { animation: mp1-react 300ms var(--ease-reading) both }

/* ═══ MOTP2 · Bläckets väg — flow physics ═══ */
/* a rule drawing itself, left to right */
@keyframes mp2-draw { from { transform: scaleX(0) } to { transform: scaleX(1) } }
/* text arriving along the ink direction */
@keyframes mp2-flow {
  from { opacity: 0; transform: translateX(-8px) }
  to   { opacity: 1; transform: none }
}
/* the verdict pouring down the indicator rail */
@keyframes mp2-pour { from { transform: scaleY(0) } to { transform: scaleY(1) } }
/* ink wicking into a display word (clip-path — used twice, sparingly) */
@keyframes mp2-ink {
  from { opacity: 0.25; clip-path: inset(0 100% 0 0) }
  to   { opacity: 1; clip-path: inset(0 0 0 0) }
}
/* colour soaking into the graded row (overlay layer, opacity only) */
@keyframes mp2-soak { from { opacity: 0 } to { opacity: 1 } }
.mp2-draw { transform-origin: left center; animation: mp2-draw 300ms var(--ease-reading) both }
.mp2-flow { animation: mp2-flow 280ms var(--ease-reading) both }
.mp2-pour { transform-origin: center top; animation: mp2-pour 200ms var(--ease-reading) both }
.mp2-ink  { animation: mp2-ink 360ms var(--ease-reading) both }
.mp2-soak { animation: mp2-soak 240ms ease-out both }
/* the ribbon running down the spine — the one travelling object */
.mp2-ribbon { transition: transform 220ms var(--ease-reading) }

/* ═══ reduced motion — opacity-or-nothing, built in ═══
 * Every entrance keyframe here animates FROM hidden TO the element's
 * natural resting state, so 'animation: none' lands on the final frame
 * instantly — nothing. Transitions (ribbon travel, drum roll) collapse
 * to instant. The global index.css wildcard is a second net. */
@media (prefers-reduced-motion: reduce) {
  .mp1-press, .mp1-stamp, .mp1-deep, .mp1-react,
  .mp2-draw, .mp2-flow, .mp2-pour, .mp2-ink, .mp2-soak, .mp-exit {
    animation: none;
  }
  .mp2-ribbon, .mp-drum { transition-duration: 0.01ms !important }
}
`

// ── scaffolding: shell + board with replay ────────────────────────────

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
      <style>{CSS}</style>
      <h1 className="hpc-m3-display" style={{ fontSize: 34, fontStyle: 'italic', margin: 0 }}>
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

/** A labeled demo board. The REPLAY button remounts the stage (key bump),
 *  restarting every CSS animation and resetting interactive state. */
function Board({ caption, children }: { caption: string; children: ReactNode }) {
  const [k, setK] = useState(0)
  return (
    <section style={{ marginTop: 44 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 20,
          marginBottom: 14,
        }}
      >
        <div style={{ ...eyebrow, maxWidth: '80ch' }}>{caption}</div>
        <button
          type="button"
          onClick={() => setK((n) => n + 1)}
          style={{
            ...monoSm,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            border: '1px solid var(--hairline)',
            background: 'transparent',
            color: 'var(--muted)',
            padding: '3px 9px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          spela igen ↻
        </button>
      </div>
      <div
        key={k}
        style={{
          border: '1px solid var(--hairline)',
          background: 'var(--panel)',
          padding: '30px 32px 34px',
        }}
      >
        {children}
      </div>
    </section>
  )
}

// ── moment 1 + 2 fixtures shared shape ───────────────────────────────

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums',
          fontSize: 26,
          lineHeight: 1.1,
          color: 'var(--ink)',
        }}
      >
        {n}
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{l}</div>
    </div>
  )
}

const heroStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontStyle: 'italic',
  fontWeight: 400,
  fontSize: 46,
  lineHeight: 1.05,
  letterSpacing: '-0.01em',
  color: 'var(--ink)',
  margin: '10px 0 0',
}

const ruleStyle: CSSProperties = {
  height: 1,
  background: 'var(--hairline)',
  border: 0,
  margin: '20px 0 0',
}

// ═══════════════════════════════════════════════════════════════════════
// MOTP1 · ANSLAGET — press physics
// ═══════════════════════════════════════════════════════════════════════

/** 01 · Page entrance: pressed in typesetting order. No travel. */
function P1Entrance() {
  return (
    <div>
      <div className="mp1-press" style={eyebrow}>
        Hem · 114 dagar till provet
      </div>
      <h2 className="mp1-stamp" style={{ ...heroStyle, animationDelay: '90ms' }}>
        God morgon.
      </h2>
      <div className="mp1-press" style={{ ...ruleStyle, animationDelay: '210ms' }} />
      <div
        className="mp1-press"
        style={{ display: 'flex', gap: 44, marginTop: 18, animationDelay: '280ms' }}
      >
        <Stat n="12" l="att repetera" />
        <Stat n="1,42" l="nivå just nu" />
        <Stat n="6" l="dagar i rad" />
      </div>
    </div>
  )
}

/** 02 · Ledger stagger: each row stamped in sequence, composing-stick cadence. */
function P1Ledger() {
  return (
    <div style={{ borderTop: '1px solid var(--hairline)' }}>
      {LEDGER.map((row, i) => (
        <div
          key={row.code}
          className="mp1-press"
          style={{
            display: 'grid',
            gridTemplateColumns: '52px 1fr auto auto',
            gap: 18,
            alignItems: 'baseline',
            padding: '13px 2px',
            borderBottom: '1px solid var(--hairline-2)',
            animationDelay: `${i * 70}ms`,
          }}
        >
          <span style={{ ...monoSm, letterSpacing: '0.1em' }}>{row.code}</span>
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
          <span style={monoSm}>{row.due} kvar</span>
          <span style={monoSm}>{row.level}</span>
        </div>
      ))}
    </div>
  )
}

/** Shared verdict-drill chrome; the grading motion differs per concept. */
function VerdictStage({
  picked,
  onPick,
  renderRow,
  renderVerdict,
}: {
  picked: string | null
  onPick: (k: string) => void
  renderRow: (opt: (typeof ORD_Q.options)[number], state: 'ok' | 'bad' | 'dim' | null) => ReactNode
  renderVerdict: (correct: boolean) => ReactNode
}) {
  const graded = picked !== null
  const correct = picked === 'a'
  return (
    <div>
      <div style={eyebrow}>ORD · Fråga 4 av 10</div>
      <div style={{ ...heroStyle, fontSize: 40 }}>{ORD_Q.word}</div>
      <div style={{ marginTop: 18, borderTop: '1px solid var(--hairline)' }}>
        {ORD_Q.options.map((opt) => {
          const state = !graded ? null : opt.ok ? 'ok' : opt.k === picked ? 'bad' : 'dim'
          return (
            <button
              key={opt.k}
              type="button"
              disabled={graded}
              onClick={() => onPick(opt.k)}
              style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: '3px 30px 1fr',
                alignItems: 'center',
                gap: 14,
                width: '100%',
                border: 0,
                borderBottom: '1px solid var(--hairline-2)',
                background: 'transparent',
                textAlign: 'left',
                cursor: graded ? 'default' : 'pointer',
                padding: 0,
              }}
            >
              {renderRow(opt, state)}
            </button>
          )
        })}
      </div>
      {graded && <div style={{ marginTop: 18 }}>{renderVerdict(correct)}</div>}
    </div>
  )
}

const optKey: CSSProperties = {
  ...monoSm,
  fontSize: 12,
  textTransform: 'lowercase',
  padding: '13px 0',
  position: 'relative',
  zIndex: 1,
}

const optText = (state: 'ok' | 'bad' | 'dim' | null): CSSProperties => ({
  fontFamily: 'var(--font-display)',
  fontSize: 17,
  fontWeight: 450,
  padding: '13px 0',
  position: 'relative',
  zIndex: 1,
  color:
    state === 'ok'
      ? 'var(--ok)'
      : state === 'bad'
        ? 'var(--bad)'
        : state === 'dim'
          ? 'var(--muted)'
          : 'var(--ink)',
  textDecoration: state === 'bad' ? 'line-through' : undefined,
})

const verdictWord: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontStyle: 'italic',
  fontWeight: 600,
  fontSize: 38,
  lineHeight: 1.05,
  display: 'inline-block',
}

/** 03 · The verdict: grading is an over-stamp — a second colour pass
 *  pressed onto the row where the pick landed; the word is stamped. */
function P1Verdict() {
  const [picked, setPicked] = useState<string | null>(null)
  return (
    <VerdictStage
      picked={picked}
      onPick={setPicked}
      renderRow={(opt, state) => (
        <>
          {(state === 'ok' || state === 'bad') && (
            <span
              aria-hidden
              className="mp1-press"
              style={{
                position: 'absolute',
                inset: 0,
                background: state === 'ok' ? 'var(--ok-soft)' : 'var(--bad-soft)',
                animationDelay: state === 'ok' ? '120ms' : '0ms',
              }}
            />
          )}
          <span
            aria-hidden
            style={{
              width: 3,
              alignSelf: 'stretch',
              position: 'relative',
              zIndex: 1,
              background:
                state === 'ok' ? 'var(--ok)' : state === 'bad' ? 'var(--bad)' : 'transparent',
            }}
          />
          <span style={{ ...optKey, color: state ? optText(state).color : 'var(--muted)' }}>
            {opt.k}
          </span>
          <span style={optText(state)}>{opt.t}</span>
        </>
      )}
      renderVerdict={(correct) => (
        <span
          className="mp1-stamp"
          style={{
            ...verdictWord,
            color: correct ? 'var(--ok)' : 'var(--bad)',
            animationDelay: '160ms',
          }}
        >
          {correct ? 'Rätt.' : 'Fel.'}
        </span>
      )}
    />
  )
}

/** Mini nav rail + page. `travel` — P2's ribbon runs; P1 stamps in place. */
function NavStage({ travel }: { travel: boolean }) {
  const [active, setActive] = useState<DoorName>('Hem')
  const [leaving, setLeaving] = useState(false)
  const [gen, setGen] = useState(0)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const go = (door: DoorName) => {
    if (door === active || leaving) return
    setLeaving(true)
    timer.current = window.setTimeout(() => {
      setActive(door)
      setLeaving(false)
      setGen((n) => n + 1)
    }, 150)
  }

  const ROW_H = 36
  const idx = DOORS.indexOf(active)
  const page = PAGES[active]

  return (
    <div style={{ display: 'flex', gap: 28, alignItems: 'stretch' }}>
      <nav
        aria-label="Dörrar"
        style={{
          position: 'relative',
          width: 148,
          borderRight: '1px solid var(--hairline)',
          paddingRight: 4,
          flexShrink: 0,
        }}
      >
        {/* the bokmärke — accent's one home in the chrome */}
        <span
          aria-hidden
          className={travel ? 'mp2-ribbon' : 'mp1-stamp'}
          key={travel ? 'ribbon' : `stamp-${active}`}
          style={{
            position: 'absolute',
            left: 0,
            top: 4,
            width: 4,
            height: 26,
            background: 'var(--accent)',
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 5px), 0 100%)',
            transform: `translateY(${idx * ROW_H}px)`,
          }}
        />
        {DOORS.map((door) => (
          <button
            key={door}
            type="button"
            onClick={() => go(door)}
            aria-current={door === active ? 'page' : undefined}
            style={{
              display: 'block',
              width: '100%',
              height: ROW_H,
              border: 0,
              background: 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
              padding: '0 0 0 16px',
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontVariant: 'all-small-caps',
              letterSpacing: '0.07em',
              fontWeight: door === active ? 600 : 500,
              color: door === active ? 'var(--ink)' : 'var(--ink-2)',
            }}
          >
            {door}
          </button>
        ))}
      </nav>
      <div key={gen} className={leaving ? 'mp-exit' : undefined} style={{ flex: 1, minWidth: 0 }}>
        {travel ? (
          <>
            <div className="mp2-draw" style={{ ...ruleStyle, margin: 0 }} />
            <h3 className="mp2-flow" style={{ ...heroStyle, fontSize: 30, animationDelay: '90ms' }}>
              {page.title}
            </h3>
            <p
              className="mp2-flow"
              style={{
                fontSize: 14.5,
                color: 'var(--ink-2)',
                margin: '10px 0 0',
                animationDelay: '170ms',
              }}
            >
              {page.line}
            </p>
          </>
        ) : (
          <>
            <div className="mp1-press" style={{ ...ruleStyle, margin: 0 }} />
            <h3
              className="mp1-stamp"
              style={{ ...heroStyle, fontSize: 30, animationDelay: '60ms' }}
            >
              {page.title}
            </h3>
            <p
              className="mp1-press"
              style={{
                fontSize: 14.5,
                color: 'var(--ink-2)',
                margin: '10px 0 0',
                animationDelay: '170ms',
              }}
            >
              {page.line}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

/** 05 · Signature: the deep impression — the page RECEIVES the press. */
function P1Signature() {
  return (
    <div style={{ textAlign: 'center', padding: '18px 0 6px' }}>
      <div
        className="mp1-deep"
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontWeight: 600,
          fontSize: 64,
          lineHeight: 1,
          color: 'var(--ink)',
        }}
      >
        Klart.
      </div>
      {/* the paper reacting to the strike — timed to the platen's contact */}
      <div className="mp1-react" style={{ animationDelay: '280ms' }}>
        <div style={{ ...ruleStyle, margin: '26px auto 0', maxWidth: 360 }} />
        <div
          className="mp1-press"
          style={{ ...monoSm, marginTop: 14, letterSpacing: '0.1em', animationDelay: '470ms' }}
        >
          ORD · 10 FRÅGOR · 8 RÄTT · +0,02
        </div>
      </div>
    </div>
  )
}

/** MOTP1 — Anslaget: letterpress impression physics. */
export function MOTP1() {
  return (
    <ConceptShell
      title="MOTP1 · Anslaget"
      thesis="Trycksakens fysik: ingenting glider in från sidan, för på en press färdas ingenting — formen är låst och degeln slår ner. Varje element föds på sin slutliga plats: opacitet är bläckets täthet, en knappt synlig skalsättning (1,02 → 1) är degelns kyss. Sättningen sker i typografisk ordning, domen är en ÖVERSTÄMPLING i en andra färg exakt där valet landade, och sessionens slutord slås så hårt att sidan själv känner trycket. Perkussivt, diskret, vertikalt."
    >
      <Board caption="01 · Sidans ankomst — pressad i sättningsordning: rubrikrad, anslag, linje, siffror. Inget färdas.">
        <P1Entrance />
      </Board>
      <Board caption="02 · Förteckningen — raderna stämplas i följd, vinkelhakens kadens (70 ms per rad)">
        <P1Ledger />
      </Board>
      <Board caption="03 · Domen — välj ett svar: rätt rad överstämplas i grönt, felvalet i rött, ordet slås till sist. Spela igen för att nollställa.">
        <P1Verdict />
      </Board>
      <Board caption="04 · Dörrbyte — gamla sidan bläckas ut (140 ms), nya pressas in; bokmärket färdas inte utan STÄMPLAS vid nya dörren">
        <NavStage travel={false} />
      </Board>
      <Board caption="05 · Signatur — djuptrycket: Klart. slås i papperet (620 ms, systemets enda långa slag) och linjerna under KÄNNER trycket — en engångsreaktion på 2 px">
        <P1Signature />
      </Board>
    </ConceptShell>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// MOTP2 · BLÄCKETS VÄG — flow physics
// ═══════════════════════════════════════════════════════════════════════

/** 01 · Page entrance: the top rule draws itself, then text wicks in
 *  behind the advancing edge. */
function P2Entrance() {
  return (
    <div>
      <div className="mp2-flow" style={eyebrow}>
        Hem · 114 dagar till provet
      </div>
      <div className="mp2-draw" style={{ ...ruleStyle, margin: '12px 0 0' }} />
      <h2 className="mp2-ink" style={{ ...heroStyle, animationDelay: '160ms' }}>
        God morgon.
      </h2>
      <div style={{ display: 'flex', gap: 44, marginTop: 22 }}>
        {(
          [
            ['12', 'att repetera'],
            ['1,42', 'nivå just nu'],
            ['6', 'dagar i rad'],
          ] as const
        ).map(([n, l], i) => (
          <div key={l} className="mp2-flow" style={{ animationDelay: `${300 + i * 80}ms` }}>
            <Stat n={n} l={l} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** 02 · Ledger stagger: the pen moves down the page — each row's
 *  hairline draws first, its text follows 80 ms behind the rule. */
function P2Ledger() {
  return (
    <div>
      {LEDGER.map((row, i) => (
        <div key={row.code} style={{ position: 'relative' }}>
          <div
            className="mp2-draw"
            style={{ ...ruleStyle, margin: 0, animationDelay: `${i * 90}ms` }}
          />
          <div
            className="mp2-flow"
            style={{
              display: 'grid',
              gridTemplateColumns: '52px 1fr auto auto',
              gap: 18,
              alignItems: 'baseline',
              padding: '13px 2px',
              animationDelay: `${i * 90 + 80}ms`,
            }}
          >
            <span style={{ ...monoSm, letterSpacing: '0.1em' }}>{row.code}</span>
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
            <span style={monoSm}>{row.due} kvar</span>
            <span style={monoSm}>{row.level}</span>
          </div>
        </div>
      ))}
      <div className="mp2-draw" style={{ ...ruleStyle, margin: 0, animationDelay: '360ms' }} />
    </div>
  )
}

/** 03 · The verdict: colour POURS down the indicator rail from the top,
 *  soaks the row, and the word is written left to right. */
function P2Verdict() {
  const [picked, setPicked] = useState<string | null>(null)
  return (
    <VerdictStage
      picked={picked}
      onPick={setPicked}
      renderRow={(opt, state) => (
        <>
          {(state === 'ok' || state === 'bad') && (
            <span
              aria-hidden
              className="mp2-soak"
              style={{
                position: 'absolute',
                inset: 0,
                background: state === 'ok' ? 'var(--ok-soft)' : 'var(--bad-soft)',
                animationDelay: state === 'ok' ? '220ms' : '90ms',
              }}
            />
          )}
          <span
            aria-hidden
            className={state === 'ok' || state === 'bad' ? 'mp2-pour' : undefined}
            style={{
              width: 3,
              alignSelf: 'stretch',
              position: 'relative',
              zIndex: 1,
              background:
                state === 'ok' ? 'var(--ok)' : state === 'bad' ? 'var(--bad)' : 'transparent',
              animationDelay: state === 'ok' ? '160ms' : '0ms',
            }}
          />
          <span style={{ ...optKey, color: state ? optText(state).color : 'var(--muted)' }}>
            {opt.k}
          </span>
          <span style={optText(state)}>{opt.t}</span>
        </>
      )}
      renderVerdict={(correct) => (
        <span
          className="mp2-ink"
          style={{
            ...verdictWord,
            color: correct ? 'var(--ok)' : 'var(--bad)',
            animationDelay: '300ms',
          }}
        >
          {correct ? 'Rätt.' : 'Fel.'}
        </span>
      )}
    />
  )
}

/** A masked mechanical digit drum — the counting wheel. Transform-only:
 *  a vertical column of digits rolled by translateY. */
function Drum({ value, size = 26 }: { value: number; size?: number }) {
  const h = Math.round(size * 1.15)
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        height: h,
        overflow: 'hidden',
        verticalAlign: 'bottom',
      }}
    >
      <span
        className="mp-drum"
        style={{
          display: 'flex',
          flexDirection: 'column',
          transform: `translateY(${-value * h}px)`,
          transition: 'transform 480ms var(--ease-reading)',
        }}
      >
        {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <span
            key={d}
            style={{
              height: h,
              lineHeight: `${h}px`,
              fontFamily: 'var(--font-mono)',
              fontVariantNumeric: 'tabular-nums',
              fontSize: size,
              textAlign: 'center',
            }}
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  )
}

/** 05 · Signature: Räkneverket — the folio rolls like a counting wheel.
 *  Progress is machinery advancing, not text replaced. */
function P2Signature() {
  const [q, setQ] = useState(4)
  const due = 14 - (q - 4)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 48, padding: '10px 0 4px' }}>
      <div>
        <div style={eyebrow}>Fråga</div>
        <div
          role="img"
          aria-label={`Fråga ${q} av 10`}
          style={{ marginTop: 8, color: 'var(--ink)', whiteSpace: 'nowrap' }}
        >
          <Drum value={Math.floor(q / 10)} />
          <Drum value={q % 10} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 15,
              color: 'var(--muted)',
              marginLeft: 6,
            }}
          >
            / 10
          </span>
        </div>
      </div>
      <div>
        <div style={eyebrow}>Kvar i kön</div>
        {/* the one due-count numeral — accent's other lawful home */}
        <div role="img" aria-label={`${due} kvar`} style={{ marginTop: 8, color: 'var(--accent)' }}>
          <Drum value={Math.floor(due / 10)} />
          <Drum value={due % 10} />
        </div>
      </div>
      <button
        type="button"
        disabled={q >= 10}
        onClick={() => setQ((n) => Math.min(10, n + 1))}
        style={{
          ...monoSm,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          border: '1px solid var(--hairline)',
          background: 'transparent',
          color: q >= 10 ? 'var(--muted-2)' : 'var(--ink-2)',
          padding: '8px 14px',
          cursor: q >= 10 ? 'default' : 'pointer',
          marginLeft: 'auto',
        }}
      >
        nästa fråga →
      </button>
    </div>
  )
}

/** MOTP2 — Bläckets väg: ink-flow physics along the page's structure. */
export function MOTP2() {
  return (
    <ConceptShell
      title="MOTP2 · Bläckets väg"
      thesis="Bläckets fysik: bläck är vätska — det färdas längs sidans egen struktur och hoppar aldrig. Linjer drar sig själva från vänster; text väter in bakom en framryckande kant; förteckningen fylls uppifrån och ner i pennans takt, varje rads linje 80 ms före sin text; domen HÄLLS nerför radens kantstreck innan ordet skrivs; och bokmärket rinner fysiskt nerför ryggen till den nya dörren — systemets enda resande objekt, för bläck i en ränna rinner faktiskt. Lateralt, kontinuerligt, linjärt."
    >
      <Board caption="01 · Sidans ankomst — topplinjen drar sig själv, anslaget väter in bakom kanten, siffrorna följer bläckriktningen">
        <P2Entrance />
      </Board>
      <Board caption="02 · Förteckningen — pennan vandrar neråt: varje rads linje drar först, texten följer 80 ms bakom (90 ms per rad)">
        <P2Ledger />
      </Board>
      <Board caption="03 · Domen — välj ett svar: färgen hälls nerför kantstrecket, sugs in i raden, och ordet skrivs från vänster. Spela igen för att nollställa.">
        <P2Verdict />
      </Board>
      <Board caption="04 · Dörrbyte — bokmärket RINNER nerför ryggen till nya dörren (220 ms); nya sidan: linjen drar, texten väter in">
        <NavStage travel />
      </Board>
      <Board caption="05 · Signatur — Räkneverket: folionumret rullar som ett mekaniskt räkneverk (480 ms trumrull); kö-siffran är accentens enda siffra. Tryck nästa fråga.">
        <P2Signature />
      </Board>
    </ConceptShell>
  )
}

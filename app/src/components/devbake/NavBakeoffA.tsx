// NavBakeoffA — designer A of the primary-navigation bake-off.
// Five doors, identical on both chromes (owner law):
//
//     Hem · Träna · Provpass · [referens] · Framsteg
//
// "Övning" is retired (it opened half of practice while advertising the
// other half); "Lektion" is retired (it promised deferred PRD scope);
// "Feedback" leaves the phone bar (dogfood exporter → /mer verktyg).
// The practice door unifies drill + repetition behind ONE word and a new
// landing hub that shows both lanes unconditionally.
//
// ── NAVA1 · "Marginalen" — signal-rich ─────────────────────────────────
//
// The rail becomes a miniature Boksidan page. A full-height hairline
// SPINE runs inside the rail; door words sit right of the spine in the
// house mono nav register; their live state sits LEFT of the spine as
// right-aligned margin annotations — the exact m3-meta idiom (strong
// tabular figure, muted word under it). Numbers live in the margin,
// doors live on the page. The active door is a 2px accent tick that
// CROSSES the spine — navigation as a bookmark, not a highlight pill.
//
//   Signals carried:  Träna    23 / att repetera   (due queue — where it
//                                                    belongs now that the
//                                                    door serves repetition)
//                     Provpass P2 / minst sett     (the picker's standing
//                                                    recommendation)
//                     Framsteg +0,1 / denna vecka  (the honest week delta)
//                     Hem      04∕10 / påbörjad    (cross-device resume —
//                                                    only when one exists)
//                     Ramverk  —                   (silent by design; a
//                                                    reference shelf has no
//                                                    state worth a margin note)
//   The countdown ("114 / dagar kvar") is promoted to the page's FIRST
//   margin note, next to the brand — the clock annotates the whole book.
//
// Phone: TEXT-ONLY mono tab words (the margin-label idiom carried to the
// phone — the concept's aesthetic risk; five Swedish words fit at 10px
// mono in 390pt, and words are more ADHD-scannable than five abstract
// glyphs). Exactly ONE signal crosses over: Träna's due figure, set as a
// quiet tabular numeral after the word. Provpass/Framsteg signals are
// deliberately REFUSED on phone — on 44px of chrome a naked "+0,1" is
// noise; Home's plan owns that story. Active tab = the same accent tick,
// crossing the bar's top hairline.
// Phone historik path: the rail's foot-word idiom ported to the end of
// Home ("historik · mer →") — unconditional, always rendered.
//
// Hub: an instrument panel on the Boksidan chassis — margin labels
// REPETERA (with the due figure) and ÖVA (8 sektioner) seat the two
// lanes on the rail; per-section rows carry accuracy · seen counts.
//
// Reference-door name: RAMVERK — it is honest (the surface renders
// Layer-1 framework JSON, entry by entry), it matches the product's own
// vocabulary, and in the mono register it reads as the reference shelf
// it is. Rejected here: "Teori" (soft, promises prose lessons we
// deferred), "Fällor" (names one entry type; the shelf also holds
// tactics, roots, tables).
//
// ── NAVA2 · "Fem dörrar" — signal-quiet ────────────────────────────────
//
// Doors are just doors. The rail is a book's TABLE OF CONTENTS: five
// door words set in Newsreader at reading size, roman, calm; the ACTIVE
// door alone turns italic — the Boksidan voice speaks the chapter you
// are in — plus the accent tick. Zero figures, zero badges, zero
// annotations anywhere in the chrome (the ADHD thesis taken literally:
// the rail must never compete with Home's plan for attention). All state
// lives in the plan and at the destinations.
//   Aesthetic risk: serif reading-size navigation — chrome that looks
//   like book furniture rather than app furniture, and trusts position +
//   the tick to say "clickable".
// Phone: conventional icon+label tabs, zero badges of any kind.
// Phone historik path: the FIRST ledger row inside Framsteg —
// "Historik · alla pass →", unconditional (rendered as an annotated
// inset artboard).
// Hub: two large typographic doors — Öva / Repetera as italic display
// headlines with one plain line each; the due count appears HERE, in
// prose at its destination ("23 väntar — de äldsta först"), not in the
// chrome.
//
// Reference-door name: TEORI — the quiet concept extends its philosophy
// to language: an ordinary student word, no internal Layer-1 jargon a
// 19-year-old doesn't have yet. (Rendered against A1's RAMVERK so the
// owner sees both candidates live, per the round's law.)
//
// ── Shared laws ─────────────────────────────────────────────────────────
// Foot (mode ◐ · historik · mer →), account medallion, /mer, collapse
// behavior: untouched — out of scope. Token-only color and type. All
// data below is labeled fixture (mirrors the HOME redesign fixture +
// live-signal shapes); zero network/auth dependencies.

import type { CSSProperties, ReactNode } from 'react'

import { Book, Chart, Home, Pencil } from '@/components/icons'

// ── fixtures (labeled; shapes mirror the live rail signals) ─────────────

const FX = {
  days: 114,
  sitting: 'Höstprov 26',
  due: 23,
  sessionSize: 10,
  delta: '+0,1',
  score: '1,4',
  streak: 12,
  resume: { figure: '04∕10', word: 'påbörjad', headline: 'Övning · ORD', progress: '4 av 10' },
  provpass: { figure: 'P2', word: 'minst sett' },
  plan: [
    {
      n: '1',
      title: 'Repetition · 10 av 23 missar',
      why: 'De äldsta först — glömskekurvan väntar inte.',
      min: '8 min',
    },
    {
      n: '2',
      title: 'XYZ · minustecknet över parentesen',
      why: 'Distribuera ett minustecken över ett uttryck inom parentes.',
      min: '5 min',
    },
    {
      n: '3',
      title: 'ORD-övning · 10 frågor',
      why: 'Snabb runda för att hålla synonymflödet uppe.',
      min: '3 min',
    },
  ],
  sections: [
    { code: 'ORD', name: 'Ordförståelse', acc: '78 %', seen: '312 sedda' },
    { code: 'LÄS', name: 'Svensk läsförståelse', acc: '71 %', seen: '96 sedda' },
    { code: 'MEK', name: 'Meningskomplettering', acc: '74 %', seen: '104 sedda' },
    { code: 'ELF', name: 'Engelsk läsförståelse', acc: '82 %', seen: '88 sedda' },
    { code: 'XYZ', name: 'Matematisk problemlösning', acc: '63 %', seen: '120 sedda' },
    { code: 'KVA', name: 'Kvantitativa jämförelser', acc: '69 %', seen: '108 sedda' },
    { code: 'NOG', name: 'Kvantitativa resonemang', acc: '66 %', seen: '84 sedda' },
    { code: 'DTK', name: 'Diagram, tabeller, kartor', acc: '72 %', seen: '96 sedda' },
  ],
} as const

type Door = { key: string; label: string }

const DOORS_A1: readonly Door[] = [
  { key: 'hem', label: 'Hem' },
  { key: 'trana', label: 'Träna' },
  { key: 'provpass', label: 'Provpass' },
  { key: 'ramverk', label: 'Ramverk' },
  { key: 'framsteg', label: 'Framsteg' },
]

const DOORS_A2: readonly Door[] = [
  { key: 'hem', label: 'Hem' },
  { key: 'trana', label: 'Träna' },
  { key: 'provpass', label: 'Provpass' },
  { key: 'teori', label: 'Teori' },
  { key: 'framsteg', label: 'Framsteg' },
]

// ── css ─────────────────────────────────────────────────────────────────

const CSS = `
.nava-reset { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; appearance: none; }

/* A1 rail: margin | spine | page */
.nava1-door {
  display: grid;
  grid-template-columns: 72px 25px 1fr;
  align-items: baseline;
  padding: 11px 14px 11px 16px;
  text-decoration: none;
  cursor: pointer;
  position: relative;
}
.nava1-door:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.nava1-tick {
  grid-column: 2;
  align-self: center;
  justify-self: center;
  width: 17px;
  height: 2px;
  background: transparent;
  transform: scaleX(0);
  transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1), background 180ms ease;
}
.nava1-door:hover .nava1-tick { background: var(--hairline); transform: scaleX(1); }
.nava1-door[aria-current="page"] .nava1-tick { background: var(--accent); transform: scaleX(1); }
.nava1-word {
  grid-column: 3;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-2);
  transition: color 160ms ease;
}
.nava1-door:hover .nava1-word { color: var(--ink); }
.nava1-door[aria-current="page"] .nava1-word { color: var(--ink); font-weight: 600; }
.nava1-sig {
  grid-column: 1;
  text-align: right;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 11px;
  line-height: 1.35;
  color: var(--muted);
}
.nava1-sig strong { display: block; font-weight: 500; color: var(--ink-2); }

/* A1 phone tabs: text-only mono words, tick crosses the top hairline */
.nava1-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: 13px 0 11px;
  position: relative;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}
.nava1-tab[aria-current="page"] { color: var(--ink); font-weight: 600; }
.nava1-tab::before {
  content: "";
  position: absolute;
  top: -1px;
  left: 50%;
  width: 22px;
  height: 2px;
  transform: translateX(-50%) scaleX(0);
  background: var(--accent);
  transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}
.nava1-tab[aria-current="page"]::before { transform: translateX(-50%) scaleX(1); }
.nava1-tab:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.nava1-tab-n {
  font-variant-numeric: tabular-nums;
  font-weight: 400;
  color: var(--muted);
  letter-spacing: 0.04em;
}

/* A2 rail: table of contents — serif doors, active turns italic */
.nava2-door {
  display: block;
  padding: 12px 18px;
  text-decoration: none;
  cursor: pointer;
  border-left: 2px solid transparent;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 500;
  letter-spacing: 0.005em;
  color: var(--ink-2);
  transition: color 160ms ease;
}
.nava2-door:hover { color: var(--ink); }
.nava2-door[aria-current="page"] {
  color: var(--ink);
  font-style: italic;
  border-left-color: var(--accent);
}
.nava2-door:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }

/* A2 phone tabs: icon + label, zero badges */
.nava2-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 9px 0 7px;
  cursor: pointer;
  color: var(--muted);
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 500;
}
.nava2-tab[aria-current="page"] { color: var(--ink); }
.nava2-tab:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }

/* hub shared */
.nava-cta {
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-ink);
  background: var(--accent);
  padding: 10px 20px;
  white-space: nowrap;
  cursor: pointer;
  transition: opacity 160ms ease;
  text-decoration: none;
  display: inline-block;
}
.nava-cta:hover { opacity: 0.88; }
.nava-cta:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

.nava1-sect {
  display: grid;
  grid-template-columns: 52px 1fr auto;
  gap: 14px;
  align-items: baseline;
  width: 100%;
  padding: 12px 0;
  border-bottom: 1px solid var(--hairline-2);
  cursor: pointer;
  text-decoration: none;
}
.nava1-sect:last-child { border-bottom: 0; }
.nava1-sect:hover .nava1-sect-name { color: var(--ink); }
.nava1-sect:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }

.nava2-lane {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: center;
  width: 100%;
  padding: 34px 0;
  border-bottom: 1px solid var(--hairline);
  cursor: pointer;
  text-decoration: none;
}
.nava2-lane:hover .nava2-lane-arrow { transform: translateX(4px); color: var(--ink); }
.nava2-lane:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.nava2-lane-arrow {
  font-family: var(--font-display);
  font-size: 26px;
  color: var(--muted);
  transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1), color 160ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .nava1-tick, .nava1-tab::before, .nava2-lane-arrow { transition: none; }
}
`

// ── artboard scaffolding ────────────────────────────────────────────────

function Stage({ label, shot, children }: { label: string; shot?: string; children: ReactNode }) {
  return (
    <div id={shot} style={{ marginBottom: 44 }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          margin: '0 0 10px 2px',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

function Desk({ children, width = 1440 }: { children: ReactNode; width?: number }) {
  return (
    <div
      style={{
        width,
        maxWidth: '100%',
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      {children}
    </div>
  )
}

function Phone({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: 390,
        height: 844,
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  )
}

// ── shared page-context content (a compact Home in the house register) ──

const eyebrow: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  fontVariantNumeric: 'tabular-nums',
}

const display: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontStyle: 'italic',
  fontWeight: 400,
  color: 'var(--ink)',
  lineHeight: 1.05,
  letterSpacing: '-0.01em',
  margin: '10px 0 0',
}

function HomeStats({ compact = false }: { compact?: boolean }) {
  const n: CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontVariantNumeric: 'tabular-nums',
    fontSize: compact ? 24 : 30,
    lineHeight: 1.1,
    color: 'var(--ink)',
  }
  const l: CSSProperties = { fontSize: 12, color: 'var(--muted)', marginTop: 2 }
  return (
    <div
      style={{
        display: 'flex',
        gap: compact ? 32 : 48,
        marginTop: compact ? 20 : 28,
        paddingTop: compact ? 16 : 20,
        borderTop: '1px solid var(--hairline)',
      }}
    >
      <div>
        <div style={n}>{FX.score}</div>
        <div style={l}>beräknad nivå</div>
        <div style={{ fontSize: 12, color: 'var(--ok)', marginTop: 2 }}>{FX.delta} denna vecka</div>
      </div>
      <div>
        <div style={n}>{FX.streak}</div>
        <div style={l}>dagar i rad</div>
      </div>
      <div>
        <div style={n}>{FX.days}</div>
        <div style={l}>dagar till provet</div>
      </div>
    </div>
  )
}

function HomePlan({ compact = false }: { compact?: boolean }) {
  return (
    <div style={{ marginTop: compact ? 40 : 56 }}>
      <hr style={{ height: 1, background: 'var(--hairline)', border: 0, margin: '0 0 16px' }} />
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--ink-2)',
        }}
      >
        Dagens plan · 16 min
      </div>
      <div>
        {FX.plan.map((p) => (
          <div
            key={p.n}
            style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr auto',
              gap: compact ? 12 : 16,
              alignItems: 'baseline',
              padding: '14px 0',
              borderBottom: '1px solid var(--hairline-2)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 19,
                color: 'var(--accent)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {p.n}
            </span>
            <span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 500,
                  fontSize: compact ? 16 : 17,
                  lineHeight: 1.35,
                  color: 'var(--ink)',
                  display: 'block',
                }}
              >
                {p.title}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--muted)',
                  marginTop: 3,
                  display: 'block',
                  maxWidth: '56ch',
                }}
              >
                {p.why}
              </span>
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--muted)',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {p.min}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HomeBody({ compact = false }: { compact?: boolean }) {
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={eyebrow}>Torsdag 11 juli · {FX.days} dagar kvar</div>
      <h1 style={{ ...display, fontSize: compact ? 38 : 'clamp(44px, 5vw, 60px)' }}>
        God eftermiddag.
      </h1>
      <HomeStats compact={compact} />
      <HomePlan compact={compact} />
    </div>
  )
}

const footWord: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  textDecoration: 'none',
  cursor: 'pointer',
}

// ═════════════════════════════════════════════════════════════════════════
// NAVA1 · "Marginalen" — signal-rich
// ═════════════════════════════════════════════════════════════════════════

const A1_SIGNALS: Record<string, { figure: string; word: string } | null> = {
  // Hem carries NO margin note — the resume card just below already owns
  // "Påbörjad"; two voices saying it were one too many (screenshot pass).
  hem: null,
  trana: { figure: String(FX.due), word: 'väntar' },
  provpass: { figure: FX.provpass.figure, word: FX.provpass.word },
  ramverk: null,
  framsteg: { figure: FX.delta, word: 'denna vecka' },
}

function RailA1({ active }: { active: string }) {
  return (
    <aside
      style={{
        width: 236,
        flexShrink: 0,
        borderRight: '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        minHeight: '100%',
      }}
    >
      {/* the spine — a full-height hairline; margin left of it, page right */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 100,
          width: 1,
          background: 'var(--hairline)',
        }}
      />
      {/* brand row: the clock is the page's first margin note */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '72px 25px 1fr',
          alignItems: 'baseline',
          padding: '20px 14px 24px 16px',
        }}
      >
        <span
          style={{
            gridColumn: 1,
            textAlign: 'right',
            fontFamily: 'var(--font-mono)',
            fontVariantNumeric: 'tabular-nums',
            fontSize: 11,
            lineHeight: 1.35,
            color: 'var(--muted)',
          }}
        >
          <strong style={{ fontWeight: 500, color: 'var(--ink-2)', display: 'block' }}>
            {FX.days}
          </strong>
          dagar kvar
        </span>
        <span
          style={{
            gridColumn: 3,
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: 17,
            color: 'var(--ink)',
            whiteSpace: 'nowrap',
          }}
        >
          HP-Coach
        </span>
      </div>

      <nav aria-label="Sektioner" style={{ display: 'flex', flexDirection: 'column' }}>
        {DOORS_A1.map((d) => {
          const sig = A1_SIGNALS[d.key]
          return (
            <a
              key={d.key}
              href={`#${d.key}`}
              className="nava1-door"
              aria-current={active === d.key ? 'page' : undefined}
            >
              <span className="nava1-sig">
                {sig ? (
                  <>
                    <strong>{sig.figure}</strong>
                    {sig.word}
                  </>
                ) : null}
              </span>
              <span className="nava1-tick" aria-hidden />
              <span className="nava1-word">{d.label}</span>
            </a>
          )
        })}
      </nav>

      {/* cross-device resume keeps its card, seated on the margin rail */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '72px 25px 1fr',
          alignItems: 'start',
          padding: '18px 14px 0 16px',
        }}
      >
        <span
          style={{
            gridColumn: 1,
            textAlign: 'right',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            paddingTop: 12,
          }}
        >
          Påbörjad
        </span>
        <span aria-hidden />
        <a
          href="#resume"
          style={{
            display: 'block',
            background: 'var(--accent-soft)',
            padding: '11px 12px',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--ink)',
              display: 'block',
            }}
          >
            {FX.resume.headline}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--ink-2)',
              fontVariantNumeric: 'tabular-nums',
              display: 'block',
              marginTop: 3,
            }}
          >
            {FX.resume.progress} · fortsätt →
          </span>
        </a>
      </div>

      <div style={{ flex: 1 }} />

      {/* foot — untouched idiom (mode ◐ · historik · mer →) */}
      <div
        style={{
          padding: '14px 16px 16px',
          borderTop: '1px solid var(--hairline-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background: 'var(--bg)',
          position: 'relative',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.06em',
            color: 'var(--ink-2)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {FX.sitting} · {FX.days} dagar
        </span>
        <span style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
          <span style={footWord}>ljus ◐</span>
          <span style={footWord}>historik</span>
          <span style={footWord}>mer →</span>
        </span>
      </div>
    </aside>
  )
}

function SpineA1() {
  return (
    <aside
      style={{
        width: 44,
        flexShrink: 0,
        borderRight: '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        padding: '20px 0',
        minHeight: '100%',
      }}
    >
      <span style={{ color: 'var(--muted)', fontSize: 13 }} aria-hidden>
        »
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontWeight: 600,
          fontSize: 14,
          color: 'var(--muted)',
          writingMode: 'vertical-rl',
          letterSpacing: '0.04em',
        }}
      >
        HP-Coach
      </span>
      {/* the one signal worth 44px: the due queue */}
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--ink-2)',
          writingMode: 'vertical-rl',
          fontVariantNumeric: 'tabular-nums',
          borderLeft: '2px solid var(--accent)',
          paddingLeft: 3,
        }}
      >
        {FX.due} rep.
      </span>
      <span style={{ flex: 1 }} />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--muted)',
          writingMode: 'vertical-rl',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {FX.days} d
      </span>
    </aside>
  )
}

function TabsA1({ active }: { active: string }) {
  return (
    <nav
      aria-label="Sektioner"
      style={{
        borderTop: '1px solid var(--hairline)',
        background: 'var(--panel)',
        display: 'flex',
        paddingBottom: 18,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {DOORS_A1.map((d) => (
        <a
          key={d.key}
          href={`#${d.key}`}
          className="nava1-tab"
          aria-current={active === d.key ? 'page' : undefined}
        >
          <span>
            {d.label}
            {/* the ONE crossover signal: Träna's due figure, inline */}
            {d.key === 'trana' && <span className="nava1-tab-n"> · {FX.due}</span>}
          </span>
        </a>
      ))}
    </nav>
  )
}

/** A1 hub — the practice door's landing, as an instrument panel on the
 *  Boksidan chassis: margin | spine | content per lane. */
function HubA1({ phone = false }: { phone?: boolean }) {
  const row: CSSProperties = phone
    ? { display: 'block' }
    : { display: 'grid', gridTemplateColumns: '128px 1px 1fr', columnGap: 28 }
  const meta: CSSProperties = phone
    ? { ...eyebrow, marginBottom: 10 }
    : {
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        textAlign: 'right',
        paddingTop: 5,
        fontVariantNumeric: 'tabular-nums',
      }
  const spine: CSSProperties = phone
    ? { display: 'none' }
    : { background: 'var(--hairline)', alignSelf: 'stretch' }
  return (
    <div
      style={{
        maxWidth: 880,
        margin: '0 auto',
        padding: phone ? '32px 20px 120px' : '56px 24px 96px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* head */}
      <div style={row}>
        <div style={meta}>
          {phone ? (
            'Träna · 2 spår'
          ) : (
            <>
              <strong style={{ display: 'block', color: 'var(--ink-2)', fontWeight: 500 }}>
                2
              </strong>
              spår
            </>
          )}
        </div>
        {!phone && <div style={spine} />}
        <div style={{ minWidth: 0 }}>
          {!phone && <div style={eyebrow}>Öva nytt eller repetera dina missar</div>}
          <h1 style={{ ...display, fontSize: phone ? 40 : 'clamp(44px, 6vw, 64px)' }}>Träna.</h1>
        </div>
      </div>

      {/* lane: repetera */}
      <div style={{ ...row, marginTop: phone ? 44 : 64 }}>
        <div style={meta}>
          {phone ? (
            `Repetera · ${FX.due} väntar`
          ) : (
            <>
              <strong style={{ display: 'block', color: 'var(--ink-2)', fontWeight: 500 }}>
                {FX.due}
              </strong>
              väntar
            </>
          )}
        </div>
        {!phone && <div style={spine} />}
        <div style={{ minWidth: 0 }}>
          <hr style={{ height: 1, background: 'var(--hairline)', border: 0, margin: '0 0 16px' }} />
          {!phone && <div style={{ ...eyebrow, letterSpacing: '0.1em' }}>Repetera</div>}
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: phone ? 22 : 26,
              color: 'var(--ink)',
              marginTop: 6,
            }}
          >
            Dina missar
          </div>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: 'var(--ink-2)',
              margin: '8px 0 0',
              maxWidth: '56ch',
            }}
          >
            {FX.sessionSize} av {FX.due} denna session — de äldsta först. Rätt svar lyfter frågan ur
            kön.
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 18,
              marginTop: 16,
              flexWrap: 'wrap',
            }}
          >
            <a href="#rep" className="nava-cta">
              Starta repetition
            </a>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {FX.sessionSize} av {FX.due} i kön · ca 8 min
            </span>
          </div>
        </div>
      </div>

      {/* lane: öva */}
      <div style={{ ...row, marginTop: phone ? 44 : 64 }}>
        <div style={meta}>
          {phone ? (
            'Öva · 8 sektioner'
          ) : (
            <>
              <strong style={{ display: 'block', color: 'var(--ink-2)', fontWeight: 500 }}>
                8
              </strong>
              sektioner
            </>
          )}
        </div>
        {!phone && <div style={spine} />}
        <div style={{ minWidth: 0 }}>
          <hr style={{ height: 1, background: 'var(--hairline)', border: 0, margin: '0 0 16px' }} />
          {!phone && <div style={{ ...eyebrow, letterSpacing: '0.1em' }}>Öva</div>}
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: phone ? 22 : 26,
              color: 'var(--ink)',
              marginTop: 6,
            }}
          >
            Nya frågor
          </div>
          <div style={{ marginTop: 8, borderTop: '1px solid var(--hairline)' }}>
            {FX.sections.map((s) => (
              <a key={s.code} href={`#${s.code}`} className="nava1-sect">
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    letterSpacing: '0.1em',
                    color: 'var(--accent)',
                  }}
                >
                  {s.code}
                </span>
                <span
                  className="nava1-sect-name"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 500,
                    fontSize: phone ? 15 : 16,
                    color: 'var(--ink-2)',
                    transition: 'color 160ms ease',
                  }}
                >
                  {s.name}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--muted)',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.acc} · {s.seen}
                </span>
              </a>
            ))}
            <a
              href="#mixed"
              className="nava1-sect"
              style={{ borderTop: '1px solid var(--hairline)' }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  color: 'var(--muted)',
                }}
              >
                MIX
              </span>
              <span
                className="nava1-sect-name"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 500,
                  fontSize: phone ? 15 : 16,
                  fontStyle: 'italic',
                  color: 'var(--ink-2)',
                }}
              >
                Blandad övning · alla sektioner
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--muted)',
                }}
              >
                →
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export function NAVA1() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', padding: '28px 24px 80px' }}>
      <style>{CSS}</style>
      <Stage
        shot="nava1-desktop"
        label="NAVA1 · Marginalen — desktop 1440 · rail expanderad · Hem aktiv"
      >
        <Desk>
          <RailA1 active="hem" />
          <main style={{ flex: 1, padding: '56px 64px 96px', minHeight: 900 }}>
            <HomeBody />
          </main>
        </Desk>
      </Stage>

      <Stage
        shot="nava1-collapsed"
        label="NAVA1 · desktop · rygg (fälld, 44px) — endast rep-kön följer med"
      >
        <Desk width={760}>
          <SpineA1 />
          <main style={{ flex: 1, padding: '56px 56px 96px', minHeight: 700 }}>
            <HomeBody compact />
          </main>
        </Desk>
      </Stage>

      <Stage
        shot="nava1-phone"
        label="NAVA1 · phone 390×844 · Hem — text-tabbar, en enda siffra; historik som fotord"
      >
        <Phone>
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 20px 24px' }}>
            <HomeBody compact />
            {/* the foot-word idiom ported: the unconditional phone path to
                historik + mer, always the last line of Hem */}
            <div
              style={{
                display: 'flex',
                gap: 16,
                marginTop: 40,
                paddingTop: 14,
                borderTop: '1px solid var(--hairline-2)',
              }}
            >
              <span style={footWord}>historik</span>
              <span style={footWord}>mer →</span>
            </div>
          </div>
          <TabsA1 active="hem" />
        </Phone>
      </Stage>

      <Stage shot="nava1-hub-desktop" label="NAVA1 · hubben /trana — desktop 1440 · Träna aktiv">
        <Desk>
          <RailA1 active="trana" />
          <main style={{ flex: 1, minHeight: 900 }}>
            <HubA1 />
          </main>
        </Desk>
      </Stage>

      <Stage shot="nava1-hub-phone" label="NAVA1 · hubben /trana — phone 390×844">
        <Phone>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <HubA1 phone />
          </div>
          <TabsA1 active="trana" />
        </Phone>
      </Stage>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════
// NAVA2 · "Fem dörrar" — signal-quiet
// ═════════════════════════════════════════════════════════════════════════

/** Stopwatch — Provpass. Local by design (bake-off file owns its own
 *  glyphs; components/icons.tsx is a shared file). Lucide-flavored,
 *  stroke 1.6, currentColor — matches the house set. */
function Stopwatch({ s = 16 }: { s?: number }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="14" r="7" />
      <path d="M12 11v3.5l2 2" />
      <path d="M10 2.5h4" />
      <path d="M12 2.5V5" />
    </svg>
  )
}

const A2_ICONS: Record<string, (p: { s?: number }) => ReactNode> = {
  hem: Home,
  trana: Pencil,
  provpass: Stopwatch,
  teori: Book,
  framsteg: Chart,
}

function RailA2({ active }: { active: string }) {
  return (
    <aside
      style={{
        width: 224,
        flexShrink: 0,
        borderRight: '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          padding: '20px 18px 26px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: 17,
            color: 'var(--ink)',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: 'var(--muted)', fontStyle: 'normal', marginRight: 5 }} aria-hidden>
            ⌜
          </span>
          HP-Coach
        </span>
        <span style={{ ...footWord, fontSize: 13 }}>«</span>
      </div>

      {/* the table of contents — five door words, active turns italic */}
      <nav aria-label="Sektioner" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {DOORS_A2.map((d) => (
          <a
            key={d.key}
            href={`#${d.key}`}
            className="nava2-door"
            aria-current={active === d.key ? 'page' : undefined}
          >
            {d.label}
          </a>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* foot — untouched idiom */}
      <div
        style={{
          padding: '14px 18px 16px',
          borderTop: '1px solid var(--hairline-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.06em',
            color: 'var(--ink-2)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {FX.sitting} · {FX.days} dagar
        </span>
        <span style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
          <span style={footWord}>ljus ◐</span>
          <span style={footWord}>historik</span>
          <span style={footWord}>mer →</span>
        </span>
      </div>
    </aside>
  )
}

function SpineA2() {
  return (
    <aside
      style={{
        width: 44,
        flexShrink: 0,
        borderRight: '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        padding: '20px 0',
        minHeight: '100%',
      }}
    >
      <span style={{ color: 'var(--muted)', fontSize: 13 }} aria-hidden>
        »
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontWeight: 600,
          fontSize: 14,
          color: 'var(--muted)',
          writingMode: 'vertical-rl',
          letterSpacing: '0.04em',
        }}
      >
        HP-Coach
      </span>
      <span style={{ flex: 1 }} />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--muted)',
          writingMode: 'vertical-rl',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {FX.days} d
      </span>
    </aside>
  )
}

function TabsA2({ active }: { active: string }) {
  return (
    <nav
      aria-label="Sektioner"
      style={{
        borderTop: '1px solid var(--hairline)',
        background: 'var(--panel)',
        display: 'flex',
        paddingBottom: 16,
        flexShrink: 0,
      }}
    >
      {DOORS_A2.map((d) => {
        const Icon = A2_ICONS[d.key]
        return (
          <a
            key={d.key}
            href={`#${d.key}`}
            className="nava2-tab"
            aria-current={active === d.key ? 'page' : undefined}
          >
            <Icon s={20} />
            <span>{d.label}</span>
          </a>
        )
      })}
    </nav>
  )
}

/** A2 hub — two large typographic doors. The due count appears here, in
 *  prose, at its destination — never in the chrome. */
function HubA2({ phone = false }: { phone?: boolean }) {
  return (
    <div
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: phone ? '32px 20px 120px' : '64px 24px 96px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={eyebrow}>En dörr, två spår</div>
      <h1 style={{ ...display, fontSize: phone ? 40 : 'clamp(44px, 6vw, 64px)' }}>Träna.</h1>

      <div style={{ marginTop: phone ? 36 : 56, borderTop: '1px solid var(--ink)' }}>
        <a href="#ova" className="nava2-lane">
          <span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 500,
                fontSize: phone ? 28 : 34,
                lineHeight: 1.1,
                color: 'var(--ink)',
                display: 'block',
              }}
            >
              Öva
            </span>
            <span
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: 'var(--ink-2)',
                display: 'block',
                marginTop: 8,
                maxWidth: '52ch',
              }}
            >
              Nya frågor från riktiga prov — sektion för sektion, eller blandat.
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.08em',
                color: 'var(--muted)',
                display: 'block',
                marginTop: 10,
              }}
            >
              ORD · LÄS · MEK · ELF · XYZ · KVA · NOG · DTK
            </span>
          </span>
          <span className="nava2-lane-arrow" aria-hidden>
            →
          </span>
        </a>

        <a href="#repetera" className="nava2-lane">
          <span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 500,
                fontSize: phone ? 28 : 34,
                lineHeight: 1.1,
                color: 'var(--ink)',
                display: 'block',
              }}
            >
              Repetera
            </span>
            <span
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: 'var(--ink-2)',
                display: 'block',
                marginTop: 8,
                maxWidth: '52ch',
              }}
            >
              Frågor du har svarat fel på. {FX.due} väntar — de äldsta först.
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.08em',
                color: 'var(--muted)',
                display: 'block',
                marginTop: 10,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {FX.sessionSize} av {FX.due} denna session · ca 8 min
            </span>
          </span>
          <span className="nava2-lane-arrow" aria-hidden>
            →
          </span>
        </a>
      </div>
    </div>
  )
}

/** The phone path to historik in A2: the first ledger row inside
 *  Framsteg — unconditional, before any chart. Rendered as an inset so
 *  the judge sees exactly where the door lives. */
function FramstegInsetA2() {
  return (
    <div
      style={{
        width: 320,
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        padding: '24px 18px 18px',
        flexShrink: 0,
        alignSelf: 'flex-start',
      }}
    >
      <div style={eyebrow}>Framsteg</div>
      <div style={{ ...display, fontSize: 32 }}>Framsteg.</div>
      <a
        href="#historik"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          marginTop: 22,
          padding: '13px 0',
          borderTop: '1px solid var(--ink)',
          borderBottom: '1px solid var(--hairline-2)',
          textDecoration: 'none',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 16,
            color: 'var(--ink)',
          }}
        >
          Historik
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          alla pass →
        </span>
      </a>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          padding: '13px 0',
          borderBottom: '1px solid var(--hairline-2)',
        }}
      >
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--ink-2)' }}>
          Beräknad nivå
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--ink)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {FX.score}
        </span>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginTop: 14,
        }}
      >
        inset · överst i Framsteg, ovillkorlig
      </div>
    </div>
  )
}

export function NAVA2() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', padding: '28px 24px 80px' }}>
      <style>{CSS}</style>
      <Stage
        shot="nava2-desktop"
        label="NAVA2 · Fem dörrar — desktop 1440 · rail expanderad · Hem aktiv (aktiv dörr i kursiv)"
      >
        <Desk>
          <RailA2 active="hem" />
          <main style={{ flex: 1, padding: '56px 64px 96px', minHeight: 900 }}>
            <HomeBody />
          </main>
        </Desk>
      </Stage>

      <Stage
        shot="nava2-collapsed"
        label="NAVA2 · desktop · rygg (fälld, 44px) — helt stum, som idag"
      >
        <Desk width={760}>
          <SpineA2 />
          <main style={{ flex: 1, padding: '56px 56px 96px', minHeight: 700 }}>
            <HomeBody compact />
          </main>
        </Desk>
      </Stage>

      <Stage
        shot="nava2-phone"
        label="NAVA2 · phone 390×844 · Hem — ikon+ord, noll siffror i kromen · inset: historik-dörren i Framsteg"
      >
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Phone>
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 20px 24px' }}>
              <HomeBody compact />
            </div>
            <TabsA2 active="hem" />
          </Phone>
          <FramstegInsetA2 />
        </div>
      </Stage>

      <Stage shot="nava2-hub-desktop" label="NAVA2 · hubben /trana — desktop 1440 · Träna aktiv">
        <Desk>
          <RailA2 active="trana" />
          <main style={{ flex: 1, minHeight: 900 }}>
            <HubA2 />
          </main>
        </Desk>
      </Stage>

      <Stage shot="nava2-hub-phone" label="NAVA2 · hubben /trana — phone 390×844">
        <Phone>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <HubA2 phone />
          </div>
          <TabsA2 active="trana" />
        </Phone>
      </Stage>
    </div>
  )
}

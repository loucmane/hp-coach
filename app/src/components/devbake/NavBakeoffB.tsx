// NavBakeoffB — designer B's two concepts for the primary navigation
// (desktop rail + phone tab bar), per the 2026-07-11 nav IA audit and
// the owner's five-slot law:
//
//     Hem · [practice door] · Provpass · [reference door] · Framsteg
//     — identical set + order on BOTH chromes.
//
// ── NAVB1 · "Slingan" (journey-ordered) ─────────────────────────────
//
// Thesis: the five doors ARE the daily loop — planera (Hem) → träna
// (Öva) → mät (Provpass) → följ upp (Framsteg) — and the rail should
// let you SEE that loop. A single hairline path threads the four
// journey doors top-to-bottom, each anchored by a tick; the reference
// door sits BESIDE the path — no tick, set in the book's own italic
// serif instead of the rail's mono caps. The shelf next to the road,
// literally: the path passes it without stopping.
//
//   · Practice door label: "Öva" — a verb, because the door opens a
//     hub of actions (drilla + repetera), not a single surface. It is
//     set a step heavier than its siblings (12.5px/600 vs 12px/400):
//     the loop's center of mass, weighted by honest usage frequency.
//   · Reference door label: "Teori" — plain and honest about what the
//     shelf holds (frameworks ARE the theory layer); short enough for
//     a phone tab. Alternative rendered in situ: "Ramverk" (accurate
//     but internal-jargon flavored; see the label strip).
//   · Phone: the loop line reappears as a baseline under the four
//     journey tabs with a deliberate GAP under the reference tab,
//     whose label is italic serif — same shelf grammar, 390px wide.
//   · Signals: Öva carries the due-queue count (the audit's mismatch
//     fixed — the badge now sits on the door it opens), Provpass a
//     cadence cue ("rekommenderas idag"), Framsteg the week delta.
//   · Aesthetic risk: register-mixing — one italic-serif entry inside
//     a mono-caps rail, plus deliberate weight asymmetry between
//     tabs. If it reads as a bug rather than a shelf, NAVB1 fails.
//   · Rejected: roman numerals / ordinals on the doors (the loop is
//     an arc, not a checklist — numbering five doors used 100×/day
//     turns rhythm into homework); arrows between doors (noise).
//
// ── NAVB2 · "Innehållet" (document-native) ──────────────────────────
//
// Thesis: HP-Coach's surfaces already speak print (Boksidan, Kallelsen,
// Registret) — so the nav becomes the book's own apparatus: the rail
// is a TABLE OF CONTENTS, the phone bar a RUNNING FOOTER. Entries are
// set in the display serif with all-small-caps, each line carrying
// DOT LEADERS out to a folio-position signal ("öva ······ 14"). The
// active door is marked by a BOKMÄRKE — a thin accent ribbon hanging
// into the entry from the rule above, the one persistent accent
// object in the chrome. Collapsed, the rail is the closed book's
// spine: vertical wordmark, ribbon peeking at the active position,
// countdown as the folio.
//
//   · Practice door label: "Öva" (same verb, both concepts — the
//     unification is law, the register differs).
//   · Reference door label: "Uppslag" — the act of looking something
//     up (slå upp; uppslagsverk) AND a book spread: the reference
//     gesture named in document vocabulary, native inside a ToC.
//     Alternative rendered in situ: "Ramverk". ("Fällor" rejected:
//     the surface holds whole frameworks — concepts, tactics, traps —
//     naming it after one third undersells and mis-scopes it.)
//   · Phone: TEXT-ONLY running footer — five small-caps serif words
//     under a hairline rule, active marked by the ribbon tick
//     descending from the rule. This is the concept's aesthetic
//     risk: dropping icons from a phone tab bar. Defense: five short
//     Swedish words are faster to distinguish than five abstract
//     glyphs, the labels were always the load-bearing part at 10px,
//     and the bar finally speaks the same language as every surface
//     above it. If it fails, it fails honestly.
//   · Practice hub: an UPPSLAG (spread) — two facing pages with a
//     center gutter: left page "Öva nytt", right page "Repetera",
//     running feet in the page corners. Phone folds the spread.
//   · Rejected: chapter numerals on the doors (the doors are not a
//     reading order; false structure), page-number folios as fake
//     numbers (signals are real data or nothing), ornamental
//     fleurons (nav ≠ title page; used 100×/day, restraint wins).
//
// ── Shared decisions (both concepts) ────────────────────────────────
//
//   · Provpass gets its persistent door (slot 3 — dead center on the
//     phone bar: the measuring instrument at the fulcrum).
//   · "Feedback" leaves the phone tabs (dogfood exporter → /mer
//     verktyg); Diagnostik stays in /mer. Not re-rendered here.
//   · Practice-hub landing shows BOTH lanes unconditionally — the
//     repetition lane stands even at 0 in queue ("Kön är tom" state
//     noted in the lane meta), because a door that disappears is a
//     door you can't learn the location of (ADHD-PI: stable geography
//     beats adaptive hiding).
//   · Historik: desktop keeps the existing foot-word (law). Phone
//     gets an unconditional standing line ON the Framsteg surface —
//     header-adjacent, always rendered, zero conditions. Rationale:
//     historik is the results ledger; its nearest door is Framsteg;
//     one predictable tap from a persistent tab beats a sometimes-
//     card or a ⌘K-only path, and it needs no sixth slot. NAVB2
//     dresses the same line as the book's appendix ("Bilaga").
//   · Medallion, /mer, rail collapse behavior, foot mode-toggle:
//     untouched (out of scope by law) — the foot rows here mirror
//     production NavRail verbatim.
//
// This is a DESIGN artifact: inert markup, real tokens + hpc-m3-*
// classes, labeled fixtures for all signals. No routes, no product
// code touched.

import type { CSSProperties, ReactNode, SVGProps } from 'react'

import { Book, Chart, Home, Pencil } from '@/components/icons'

// ── fixtures (labeled; mirror real signal shapes) ────────────────────

const FIX = {
  dueCount: 14,
  weekDelta: '+0,04',
  days: 114,
  sitting: 'Höstprov 26',
  frameworkCount: 25,
  passCount: 27,
  resume: { headline: 'Övning · KVA', progress: '4/10' },
} as const

const MONO_TRACK = 'var(--font-mono-track, 0.04em)'

const eyebrow: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

const monoNav: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const footWord: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

// ── local icons (self-contained; Lucide-flavored like icons.tsx) ─────

type IconProps = SVGProps<SVGSVGElement> & { s?: number }

const iconBase = (s = 16): SVGProps<SVGSVGElement> => ({
  width: s,
  height: s,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
})

/** Stopwatch — the timed provpass. Decorative: the parent tab owns the
 *  accessible name (same contract as icons.tsx), hence literal
 *  aria-hidden so the a11y lint can verify it statically. */
const Stopwatch = ({ s, ...p }: IconProps) => (
  <svg {...iconBase(s)} {...p} aria-hidden="true" focusable="false">
    <circle cx="12" cy="14" r="7" />
    <path d="M12 11v3.5l2.2 1.5M9.5 3h5M12 3v4" />
  </svg>
)

// ── artboard scaffolding ─────────────────────────────────────────────

/** Caption + artboard — the owner reads boards top-to-bottom. */
function Board({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <section data-board style={{ marginTop: 44 }}>
      <div style={{ ...eyebrow, marginBottom: 14 }}>{caption}</div>
      {children}
    </section>
  )
}

function PhoneBoard({ children, minHeight = 760 }: { children: ReactNode; minHeight?: number }) {
  return (
    <div
      style={{
        width: 390,
        minHeight,
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        borderRadius: 28,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: '0 24px 60px -30px rgba(0,0,0,0.4)',
      }}
    >
      {children}
    </div>
  )
}

function DeskBoard({ rail, children }: { rail: ReactNode; children: ReactNode }) {
  return (
    <div
      style={{
        width: 1440,
        minHeight: 820,
        maxWidth: '100%',
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        display: 'grid',
        gridTemplateColumns: '224px 1fr',
        overflow: 'hidden',
        boxShadow: '0 24px 60px -30px rgba(0,0,0,0.35)',
      }}
    >
      {rail}
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  )
}

function StatusStrip() {
  return (
    <div
      style={{
        height: 40,
        padding: '0 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--ink)',
        flexShrink: 0,
      }}
    >
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>09:41</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.6 }}>◐ ▓ ▓</span>
    </div>
  )
}

// ── shared faux page content (so boards read as the real product) ────

type Row = { id: string; tag: string | null; headline: string; rationale: string; min: number }

const PLAN: Row[] = [
  {
    id: 'lesson-nog',
    tag: 'NOG',
    headline: 'Tillräcklig information',
    rationale: 'Svagast just nu (1,3) och 8 dagar sedan du läste ramverket.',
    min: 12,
  },
  {
    id: 'rep',
    tag: null,
    headline: 'Repetition · 10 frågor',
    rationale: `${FIX.dueCount} frågor är mogna för återkoppling i din kö.`,
    min: 11,
  },
  {
    id: 'drill-kva',
    tag: 'KVA',
    headline: 'Kvantitativa jämförelser',
    rationale: 'Näst svagast — en kort drill håller den varm.',
    min: 10,
  },
]

function FauxHome({ phone }: { phone?: boolean }) {
  return (
    <div style={{ padding: phone ? '4px 22px 120px' : '56px 72px 72px', maxWidth: 760 }}>
      <div style={eyebrow}>
        <strong style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Fredag 11 juli</strong> ·{' '}
        {FIX.days} dagar · höstprov 26
      </div>
      <h1
        className="hpc-m3-display"
        style={{ fontSize: phone ? 38 : 52, margin: '18px 0 0', fontStyle: 'italic' }}
      >
        God dag.
      </h1>
      <div className="hpc-m3-stats" style={{ gap: 36, marginTop: 22, paddingTop: 16 }}>
        <div>
          <div className="hpc-m3-stat-n">1,41</div>
          <div className="hpc-m3-stat-l">prognos av 2,0</div>
        </div>
        <div>
          <div className="hpc-m3-stat-n">6</div>
          <div className="hpc-m3-stat-l">dagar i rad</div>
        </div>
        <div>
          <div className="hpc-m3-stat-n">18</div>
          <div className="hpc-m3-stat-l">min idag</div>
        </div>
      </div>
      <section style={{ marginTop: 34, paddingTop: 22, borderTop: '1px solid var(--hairline)' }}>
        <div style={{ ...eyebrow, marginBottom: 12 }}>
          <strong style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Idag</strong> · ~33 min ·
          uppskattat
        </div>
        <h2 className="hpc-m3-h">Dagens plan</h2>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {PLAN.map((r, i) => (
            <li key={r.id} className="hpc-m3-plan-item">
              <span className="hpc-m3-plan-n" aria-hidden>
                {i + 1}.
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="hpc-m3-plan-t">
                  {r.tag ? <span className="hpc-m3-tag">{r.tag}</span> : null}
                  {r.headline}
                </div>
                <div className="hpc-m3-plan-r">{r.rationale}</div>
              </div>
              <span className="hpc-m3-plan-min">~{r.min} min</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

// ── shared rail foot (production NavRail verbatim — out of scope) ────

function RailFoot() {
  return (
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
          whiteSpace: 'nowrap',
        }}
      >
        {FIX.sitting} · {FIX.days} dagar
      </span>
      <span style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
        <span style={footWord}>ljus ◐</span>
        <span style={footWord}>historik</span>
        <span style={footWord}>mer →</span>
      </span>
    </div>
  )
}

function RailResumeChip() {
  return (
    <div style={{ padding: '18px 18px 0' }}>
      <div style={{ background: 'var(--accent-soft)', padding: '12px 14px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--ink-2)',
          }}
        >
          Påbörjad
        </div>
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--ink)',
            margin: '5px 0 2px',
          }}
        >
          {FIX.resume.headline}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--ink-2)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {FIX.resume.progress} · fortsätt →
        </div>
      </div>
    </div>
  )
}

function RailBrand() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '20px 18px 22px',
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
  )
}

// ═════════════════════════════════════════════════════════════════════
// NAVB1 · Slingan — journey-ordered
// ═════════════════════════════════════════════════════════════════════

type JourneyDoor = {
  id: string
  label: string
  signal?: string
  /** slot 4: the shelf beside the path */
  shelf?: boolean
}

const NAVB1_DOORS: JourneyDoor[] = [
  { id: 'hem', label: 'Hem' },
  { id: 'ova', label: 'Öva', signal: `${FIX.dueCount} i kön` },
  { id: 'provpass', label: 'Provpass', signal: 'rek. idag' },
  { id: 'teori', label: 'Teori', shelf: true },
  { id: 'framsteg', label: 'Framsteg', signal: `${FIX.weekDelta} / vecka` },
]

const PATH_X = 22 // the loop line's x inside the rail

function Navb1Row({ door, active }: { door: JourneyDoor; active: boolean }) {
  const heavy = door.id === 'ova' // the loop's center of mass
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 10,
        padding: '11px 18px 11px 40px',
        minWidth: 0,
      }}
    >
      {/* the tick anchoring a journey door to the path (shelf: none) */}
      {!door.shelf && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: active ? PATH_X - 3.5 : PATH_X - 2.5,
            top: '50%',
            transform: active ? 'translateY(-50%) rotate(45deg)' : 'translateY(-50%)',
            width: active ? 7 : 5,
            height: active ? 7 : 1.5,
            background: active ? 'var(--accent)' : 'var(--muted)',
          }}
        />
      )}
      {door.shelf ? (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 14.5,
            fontWeight: active ? 600 : 500,
            letterSpacing: '0.01em',
            color: active ? 'var(--ink)' : 'var(--ink-2)',
          }}
        >
          {door.label}
        </span>
      ) : (
        <span
          style={{
            ...monoNav,
            fontSize: heavy ? 12.5 : 12,
            fontWeight: active || heavy ? 600 : 400,
            color: active ? 'var(--ink)' : 'var(--ink-2)',
          }}
        >
          {door.label}
        </span>
      )}
      {door.signal && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.04em',
            color: 'var(--muted)',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {door.signal}
        </span>
      )}
    </div>
  )
}

function Navb1Rail({ active }: { active: string }) {
  return (
    <aside
      style={{
        borderRight: '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        background: 'var(--bg)',
      }}
    >
      <RailBrand />
      <nav aria-label="Sektioner" style={{ position: 'relative' }}>
        {/* the loop — one continuous line past all five slots; the
         *  shelf entry has no tick, so the path visibly passes it */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: PATH_X,
            top: 6,
            bottom: 6,
            width: 1,
            background: 'var(--hairline)',
          }}
        />
        {NAVB1_DOORS.map((d) => (
          <Navb1Row key={d.id} door={d} active={active === d.id} />
        ))}
      </nav>
      <RailResumeChip />
      <div style={{ flex: 1 }} />
      <RailFoot />
    </aside>
  )
}

/** Collapsed 44px spine — the loop survives as five marks: four ticks
 *  on the line, the shelf as a dot OFFSET beside it. */
function Navb1Spine({ active }: { active: string }) {
  return (
    <div
      style={{
        width: 44,
        height: 560,
        borderRight: '1px solid var(--hairline)',
        border: '1px solid var(--hairline)',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 0',
        boxSizing: 'border-box',
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
          marginTop: 14,
        }}
      >
        HP-Coach
      </span>
      <div
        aria-hidden
        style={{
          position: 'relative',
          width: 1,
          flex: 1,
          maxHeight: 170,
          background: 'var(--hairline)',
          margin: '18px 0',
        }}
      >
        {NAVB1_DOORS.map((d, i) => {
          const on = active === d.id
          const y = `${(i / (NAVB1_DOORS.length - 1)) * 100}%`
          if (d.shelf) {
            return (
              <span
                key={d.id}
                style={{
                  position: 'absolute',
                  top: y,
                  left: 5,
                  transform: 'translateY(-50%)',
                  width: 4,
                  height: 4,
                  borderRadius: 999,
                  background: on ? 'var(--accent)' : 'var(--muted)',
                }}
              />
            )
          }
          return (
            <span
              key={d.id}
              style={{
                position: 'absolute',
                top: y,
                left: on ? -3 : -2.5,
                transform: on ? 'translateY(-50%) rotate(45deg)' : 'translateY(-50%)',
                width: on ? 6 : 6,
                height: on ? 6 : 1.5,
                background: on ? 'var(--accent)' : 'var(--muted)',
              }}
            />
          )
        })}
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--muted)',
          writingMode: 'vertical-rl',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {FIX.days} d
      </span>
    </div>
  )
}

/** Phone bar — five tabs; the loop line runs at the tabs' base with a
 *  GAP under the shelf tab, whose label is italic serif. */
function Navb1Tabs({ active }: { active: string }) {
  const tabs = [
    { id: 'hem', label: 'Hem', Icon: Home },
    { id: 'ova', label: 'Öva', Icon: Pencil, count: FIX.dueCount },
    { id: 'provpass', label: 'Provpass', Icon: Stopwatch },
    { id: 'teori', label: 'Teori', Icon: Book, shelf: true },
    { id: 'framsteg', label: 'Framsteg', Icon: Chart },
  ]
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 24,
        background: 'var(--panel)',
        borderTop: '1px solid var(--hairline)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0 4px' }}>
        {tabs.map(({ id, label, Icon, count, shelf }) => {
          const on = active === id
          return (
            <span
              key={id}
              aria-current={on ? 'page' : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '6px 8px 8px',
                color: on ? 'var(--ink)' : 'var(--muted)',
                position: 'relative',
                minWidth: 58,
              }}
            >
              <span style={{ position: 'relative' }}>
                <Icon s={20} />
                {count ? (
                  <span
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -12,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: 'var(--accent)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {count}
                  </span>
                ) : null}
              </span>
              {shelf ? (
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: 11.5,
                    fontWeight: on ? 600 : 500,
                  }}
                >
                  {label}
                </span>
              ) : (
                <span style={{ fontSize: 10, fontWeight: on ? 600 : 500 }}>{label}</span>
              )}
              {/* the loop's baseline segment — absent under the shelf */}
              {!shelf && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 6,
                    right: 6,
                    height: 1,
                    background: 'var(--hairline)',
                  }}
                />
              )}
              {on && !shelf && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    bottom: -1.5,
                    left: '50%',
                    transform: 'translateX(-50%) rotate(45deg)',
                    width: 5,
                    height: 5,
                    background: 'var(--accent)',
                  }}
                />
              )}
              {on && shelf && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 4,
                    height: 4,
                    borderRadius: 999,
                    background: 'var(--accent)',
                  }}
                />
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── NAVB1 practice hub (Öva landing) — two SPÅR, unconditional ───────

const SECTIONS = ['ORD', 'LÄS', 'MEK', 'ELF', 'XYZ', 'KVA', 'NOG', 'DTK'] as const

function SectionChips({ suggested }: { suggested: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
      {SECTIONS.map((s) => {
        const hot = s === suggested
        return (
          <span
            key={s}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: MONO_TRACK,
              padding: '7px 12px',
              border: hot ? '1px solid var(--accent)' : '1px solid var(--hairline)',
              background: hot ? 'var(--accent-soft)' : 'var(--panel)',
              color: 'var(--ink)',
              borderRadius: 'calc(var(--radius) * 0.4)',
            }}
          >
            {s}
          </span>
        )
      })}
    </div>
  )
}

function HubCta({ children }: { children: ReactNode }) {
  return (
    <span
      className="hpc-m3-cta"
      style={{
        display: 'inline-block',
        borderRadius: 999,
        padding: '11px 24px',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        letterSpacing: MONO_TRACK,
        textTransform: 'uppercase',
        marginTop: 18,
      }}
    >
      {children}
    </span>
  )
}

function Navb1Lane({
  spar,
  title,
  copy,
  meta,
  cta,
  children,
}: {
  spar: string
  title: string
  copy: string
  meta?: string
  cta: string
  children?: ReactNode
}) {
  return (
    <div style={{ paddingTop: 26 }}>
      <div style={{ ...eyebrow, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span>
          <strong style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{spar}</strong>
        </span>
        {meta ? <span style={{ fontVariantNumeric: 'tabular-nums' }}>{meta}</span> : null}
      </div>
      <h2
        className="hpc-m3-display"
        style={{ fontSize: 30, fontStyle: 'italic', margin: '10px 0 0' }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: 14.5,
          color: 'var(--ink-2)',
          lineHeight: 1.5,
          margin: '8px 0 0',
          maxWidth: '46ch',
        }}
      >
        {copy}
      </p>
      {children}
      <HubCta>{cta}</HubCta>
    </div>
  )
}

function Navb1Hub({ phone }: { phone?: boolean }) {
  return (
    <div style={{ padding: phone ? '4px 22px 120px' : '56px 72px 72px', maxWidth: 720 }}>
      <div style={eyebrow}>
        <strong style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Öva</strong> · två spår · alltid
        öppna
      </div>
      <h1
        className="hpc-m3-display"
        style={{ fontSize: phone ? 36 : 46, fontStyle: 'italic', margin: '16px 0 0' }}
      >
        Vad tränar vi?
      </h1>
      <div style={{ marginTop: 26, borderTop: '1px solid var(--hairline)' }}>
        <Navb1Lane
          spar="Spår A · Ny övning"
          title="Drilla en sektion"
          copy="Schemat föreslår KVA — näst svagast just nu. Välj fritt om du hellre tar något annat."
          meta="senast: KVA · igår"
          cta="Starta övning →"
        >
          <SectionChips suggested="KVA" />
        </Navb1Lane>
      </div>
      <div style={{ marginTop: 30, borderTop: '1px solid var(--hairline)' }}>
        <Navb1Lane
          spar="Spår B · Repetition"
          title="Dina missar"
          copy={`Repetera 10 av ${FIX.dueCount} missar denna session — de äldsta först.`}
          meta={`${FIX.dueCount} i kön`}
          cta="Repetera 10 →"
        />
        <p
          style={{
            ...eyebrow,
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'none',
            margin: '14px 0 0',
          }}
        >
          Spåret står kvar även vid 0 i kön — då läser metan «kön är tom just nu».
        </p>
      </div>
    </div>
  )
}

// ── NAVB1 fragments ──────────────────────────────────────────────────

/** Phone Framsteg header strip — the unconditional Historik path. */
function Navb1HistorikFragment() {
  return (
    <div
      style={{
        width: 390,
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        borderRadius: 16,
        padding: '22px 22px 20px',
        boxSizing: 'border-box',
      }}
    >
      <div style={eyebrow}>Framsteg · prognos 1,41</div>
      <h2
        className="hpc-m3-display"
        style={{ fontSize: 32, fontStyle: 'italic', margin: '12px 0 0' }}
      >
        Din kurva
      </h2>
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid var(--hairline)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span style={footWord}>historik — alla pass →</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--muted)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {FIX.passCount} pass
        </span>
      </div>
    </div>
  )
}

/** Reference-door label alternatives, in situ. */
function LabelStrip({
  names,
  render,
}: {
  names: string[]
  render: (name: string, active: boolean) => ReactNode
}) {
  return (
    <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
      {names.map((n, i) => (
        <div
          key={n}
          style={{
            border: '1px solid var(--hairline)',
            background: 'var(--bg)',
            padding: '10px 0',
            width: 224,
          }}
        >
          <div style={{ ...eyebrow, fontSize: 9, padding: '0 18px 8px' }}>
            {i === 0 ? 'förval' : 'alternativ'}
          </div>
          {render(n, false)}
        </div>
      ))}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════
// NAVB2 · Innehållet — document-native
// ═════════════════════════════════════════════════════════════════════

type TocDoor = { id: string; label: string; folio?: string }

const NAVB2_DOORS: TocDoor[] = [
  { id: 'hem', label: 'Hem' },
  { id: 'ova', label: 'Öva', folio: `${FIX.dueCount}` },
  { id: 'provpass', label: 'Provpass', folio: 'idag' },
  { id: 'uppslag', label: 'Uppslag', folio: `${FIX.frameworkCount}` },
  { id: 'framsteg', label: 'Framsteg', folio: FIX.weekDelta },
]

/** The bokmärke — a thin accent ribbon hanging into the active row. */
function Ribbon({ height = 30 }: { height?: number }) {
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        left: 18,
        top: -6,
        width: 4,
        height,
        background: 'var(--accent)',
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 5px), 0 100%)',
      }}
    />
  )
}

function Navb2Row({ door, active }: { door: TocDoor; active: boolean }) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        padding: '11px 18px 11px 34px',
        minWidth: 0,
      }}
    >
      {active && <Ribbon />}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          fontVariant: 'all-small-caps',
          letterSpacing: '0.07em',
          fontWeight: active ? 600 : 500,
          color: active ? 'var(--ink)' : 'var(--ink-2)',
          whiteSpace: 'nowrap',
        }}
      >
        {door.label}
      </span>
      {door.folio ? (
        <>
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
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              letterSpacing: '0.04em',
              color: 'var(--muted)',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            {door.folio}
          </span>
        </>
      ) : null}
    </div>
  )
}

function Navb2Rail({ active }: { active: string }) {
  return (
    <aside
      style={{
        borderRight: '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        background: 'var(--bg)',
      }}
    >
      <RailBrand />
      <div
        style={{
          ...eyebrow,
          fontSize: 9,
          padding: '0 18px 8px 34px',
          borderBottom: '1px solid var(--hairline-2)',
          marginBottom: 4,
        }}
      >
        Innehåll
      </div>
      <nav aria-label="Sektioner">
        {NAVB2_DOORS.map((d) => (
          <Navb2Row key={d.id} door={d} active={active === d.id} />
        ))}
      </nav>
      <RailResumeChip />
      <div style={{ flex: 1 }} />
      <RailFoot />
    </aside>
  )
}

/** Collapsed spine — the closed book: ribbon peeks at the active
 *  position, the other doors are quiet leader-dots; folio = countdown. */
function Navb2Spine({ active }: { active: string }) {
  return (
    <div
      style={{
        width: 44,
        height: 560,
        border: '1px solid var(--hairline)',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 0',
        boxSizing: 'border-box',
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
          marginTop: 14,
        }}
      >
        HP-Coach
      </span>
      <div
        aria-hidden
        style={{
          position: 'relative',
          width: 8,
          flex: 1,
          maxHeight: 170,
          margin: '18px 0',
        }}
      >
        {NAVB2_DOORS.map((d, i) => {
          const on = active === d.id
          const y = `${(i / (NAVB2_DOORS.length - 1)) * 100}%`
          return on ? (
            <span
              key={d.id}
              style={{
                position: 'absolute',
                top: y,
                left: 2,
                transform: 'translateY(-50%)',
                width: 4,
                height: 16,
                background: 'var(--accent)',
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 4px), 0 100%)',
              }}
            />
          ) : (
            <span
              key={d.id}
              style={{
                position: 'absolute',
                top: y,
                left: 3,
                transform: 'translateY(-50%)',
                width: 2.5,
                height: 2.5,
                borderRadius: 999,
                background: 'var(--muted)',
              }}
            />
          )
        })}
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--muted)',
          writingMode: 'vertical-rl',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {FIX.days} d
      </span>
    </div>
  )
}

/** Phone bar — the running footer: text-only small-caps serif under a
 *  hairline rule; the ribbon tick marks the active word. */
function Navb2Tabs({ active }: { active: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 26,
        background: 'var(--panel)',
        borderTop: '1px solid var(--hairline)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          padding: '13px 22px 6px',
        }}
      >
        {NAVB2_DOORS.map(({ id, label }) => {
          const on = active === id
          return (
            <span
              key={id}
              aria-current={on ? 'page' : undefined}
              style={{
                position: 'relative',
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontVariant: 'all-small-caps',
                letterSpacing: '0.07em',
                fontWeight: on ? 600 : 500,
                color: on ? 'var(--ink)' : 'var(--muted)',
                padding: '2px 6px 6px',
              }}
            >
              {on && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: -13,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 3,
                    height: 10,
                    background: 'var(--accent)',
                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 3px), 0 100%)',
                  }}
                />
              )}
              {label}
              {id === 'ova' && FIX.dueCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -8,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 8.5,
                    color: 'var(--accent)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {FIX.dueCount}
                </span>
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── NAVB2 practice hub — the uppslag (spread) ────────────────────────

function Navb2Page({
  foot,
  align,
  children,
}: {
  foot: string
  align: 'left' | 'right'
  children: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '34px 34px 20px',
        minWidth: 0,
      }}
    >
      <div style={{ flex: 1 }}>{children}</div>
      <div
        style={{
          ...eyebrow,
          fontSize: 9,
          textAlign: align,
          marginTop: 28,
          paddingTop: 10,
          borderTop: '1px solid var(--hairline-2)',
        }}
      >
        {foot}
      </div>
    </div>
  )
}

function Navb2HubPageA() {
  return (
    <>
      <div style={eyebrow}>Övning · nytt</div>
      <h2
        className="hpc-m3-display"
        style={{ fontSize: 30, fontStyle: 'italic', margin: '10px 0 0' }}
      >
        Öva nytt
      </h2>
      <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5, margin: '8px 0 0' }}>
        Schemat föreslår KVA — näst svagast just nu. Välj fritt om du hellre tar något annat.
      </p>
      <SectionChips suggested="KVA" />
      <HubCta>Starta övning →</HubCta>
    </>
  )
}

function Navb2HubPageB() {
  return (
    <>
      <div style={{ ...eyebrow, display: 'flex', justifyContent: 'space-between' }}>
        <span>Övning · repetition</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{FIX.dueCount} i kön</span>
      </div>
      <h2
        className="hpc-m3-display"
        style={{ fontSize: 30, fontStyle: 'italic', margin: '10px 0 0' }}
      >
        Repetera
      </h2>
      <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5, margin: '8px 0 0' }}>
        10 av {FIX.dueCount} missar denna session — de äldsta först. Sidan står kvar även när kön är
        tom.
      </p>
      <HubCta>Repetera 10 →</HubCta>
    </>
  )
}

function Navb2Hub({ phone }: { phone?: boolean }) {
  return (
    <div style={{ padding: phone ? '4px 0 120px' : '56px 72px 72px' }}>
      <div style={{ padding: phone ? '0 22px' : 0 }}>
        <div style={eyebrow}>
          <strong style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Öva</strong> · ett uppslag ·
          två sidor
        </div>
        <h1
          className="hpc-m3-display"
          style={{ fontSize: phone ? 36 : 46, fontStyle: 'italic', margin: '16px 0 0' }}
        >
          Öva.
        </h1>
      </div>
      {phone ? (
        // the spread, folded: two pages stacked on the gutter rule
        <div style={{ marginTop: 20, borderTop: '1px solid var(--hairline)' }}>
          <Navb2Page foot="öva · nytt" align="left">
            <Navb2HubPageA />
          </Navb2Page>
          <div style={{ height: 1, background: 'var(--hairline)' }} />
          <Navb2Page foot="öva · repetition" align="right">
            <Navb2HubPageB />
          </Navb2Page>
        </div>
      ) : (
        <div
          style={{
            marginTop: 28,
            display: 'grid',
            gridTemplateColumns: '1fr 1px 1fr',
            border: '1px solid var(--hairline)',
            background: 'var(--panel)',
            maxWidth: 900,
          }}
        >
          <Navb2Page foot="öva · nytt" align="left">
            <Navb2HubPageA />
          </Navb2Page>
          <div style={{ background: 'var(--hairline)' }} />
          <Navb2Page foot="öva · repetition" align="right">
            <Navb2HubPageB />
          </Navb2Page>
        </div>
      )}
    </div>
  )
}

/** Phone Framsteg strip — Historik as the book's appendix line. */
function Navb2HistorikFragment() {
  return (
    <div
      style={{
        width: 390,
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        borderRadius: 16,
        padding: '22px 22px 20px',
        boxSizing: 'border-box',
      }}
    >
      <div style={eyebrow}>Framsteg · prognos 1,41</div>
      <h2
        className="hpc-m3-display"
        style={{ fontSize: 32, fontStyle: 'italic', margin: '12px 0 0' }}
      >
        Din kurva
      </h2>
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid var(--hairline)',
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            fontVariant: 'all-small-caps',
            letterSpacing: '0.07em',
            color: 'var(--ink-2)',
          }}
        >
          Bilaga — Historik
        </span>
        <span
          aria-hidden
          style={{
            flex: 1,
            borderBottom: '1px dotted var(--muted)',
            opacity: 0.55,
            transform: 'translateY(-3px)',
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            color: 'var(--muted)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {FIX.passCount} pass →
        </span>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════
// Exports — one stacked review page per concept
// ═════════════════════════════════════════════════════════════════════

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

export function NAVB1() {
  return (
    <ConceptShell
      title="NAVB1 · Slingan"
      thesis="De fem dörrarna ÄR dagens loop — planera → träna → mät → följ upp. En hårlinje trär de fyra resedörrarna; referensdörren (Teori) står bredvid stigen, satt i bokens egen kursiv. Öva väger tyngst: loopens masscentrum."
    >
      <Board caption="Desktop 1440 · rail-in-page (aktiv: Hem) — loop-linjen, hyllan bredvid stigen, signaler på Öva/Provpass/Framsteg">
        <DeskBoard rail={<Navb1Rail active="hem" />}>
          <FauxHome />
        </DeskBoard>
      </Board>
      <Board caption="Kollapsad rygg 44px (aktiv: Öva) — loopen överlever som fem märken; hyllpunkten ligger bredvid linjen">
        <div style={{ display: 'flex', gap: 28 }}>
          <Navb1Spine active="ova" />
          <Navb1Spine active="teori" />
        </div>
      </Board>
      <Board caption="Telefon 390 · Hem med fem flikar — baslinjen bruten under Teori (hyllan); aktiv = accentmärke på linjen">
        <PhoneBoard>
          <StatusStrip />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <FauxHome phone />
          </div>
          <Navb1Tabs active="hem" />
        </PhoneBoard>
      </Board>
      <Board caption="Övningshubben · desktop — två spår, alltid öppna (Spår B står kvar vid 0 i kön)">
        <DeskBoard rail={<Navb1Rail active="ova" />}>
          <Navb1Hub />
        </DeskBoard>
      </Board>
      <Board caption="Övningshubben · telefon 390">
        <PhoneBoard minHeight={860}>
          <StatusStrip />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Navb1Hub phone />
          </div>
          <Navb1Tabs active="ova" />
        </PhoneBoard>
      </Board>
      <Board caption="Historik · telefonens ovillkorliga väg — stående fotrad på Framsteg-ytan (spegel av desktopens fotord)">
        <Navb1HistorikFragment />
      </Board>
      <Board caption="Referensdörrens namn in situ — Teori (förval) mot Ramverk (alternativ)">
        <LabelStrip
          names={['Teori', 'Ramverk']}
          render={(name) => (
            <div style={{ position: 'relative' }}>
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  left: PATH_X,
                  top: -6,
                  bottom: -6,
                  width: 1,
                  background: 'var(--hairline)',
                }}
              />
              <Navb1Row door={{ id: 'x', label: 'Provpass', signal: 'rek. idag' }} active={false} />
              <Navb1Row door={{ id: 'ref', label: name, shelf: true }} active={false} />
              <Navb1Row
                door={{ id: 'y', label: 'Framsteg', signal: `${FIX.weekDelta} / vecka` }}
                active={false}
              />
            </div>
          )}
        />
      </Board>
    </ConceptShell>
  )
}

export function NAVB2() {
  return (
    <ConceptShell
      title="NAVB2 · Innehållet"
      thesis="Navigationen blir bokens egen apparat: railen är en innehållsförteckning — kapitälserif, punktutfyllnad till folioplatsens signal, aktiv dörr markerad av bokmärkesbandet. Telefonens flikrad är boksidans löpande fot: fem ord, inga ikoner."
    >
      <Board caption="Desktop 1440 · rail-in-page (aktiv: Hem) — innehållsförteckningen: kapitäler, punktutfyllnad, bokmärke">
        <DeskBoard rail={<Navb2Rail active="hem" />}>
          <FauxHome />
        </DeskBoard>
      </Board>
      <Board caption="Kollapsad rygg 44px — den stängda boken: bandet sticker ut vid aktiv position (Öva resp. Uppslag)">
        <div style={{ display: 'flex', gap: 28 }}>
          <Navb2Spine active="ova" />
          <Navb2Spine active="uppslag" />
        </div>
      </Board>
      <Board caption="Telefon 390 · Hem — löpande foten: fem kapitälord, bandet faller från linjalen över det aktiva ordet">
        <PhoneBoard>
          <StatusStrip />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <FauxHome phone />
          </div>
          <Navb2Tabs active="hem" />
        </PhoneBoard>
      </Board>
      <Board caption="Övningshubben · desktop — uppslaget: två sidor kring en mittfals, löpande fötter i hörnen">
        <DeskBoard rail={<Navb2Rail active="ova" />}>
          <Navb2Hub />
        </DeskBoard>
      </Board>
      <Board caption="Övningshubben · telefon 390 — uppslaget vikt på falsen">
        <PhoneBoard minHeight={980}>
          <StatusStrip />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Navb2Hub phone />
          </div>
          <Navb2Tabs active="ova" />
        </PhoneBoard>
      </Board>
      <Board caption="Historik · telefonens ovillkorliga väg — bilagans rad på Framsteg-ytan, satt som förteckningsrad">
        <Navb2HistorikFragment />
      </Board>
      <Board caption="Referensdörrens namn in situ — Uppslag (förval) mot Ramverk (alternativ)">
        <LabelStrip
          names={['Uppslag', 'Ramverk']}
          render={(name) => (
            <div>
              <Navb2Row door={{ id: 'x', label: 'Provpass', folio: 'idag' }} active={false} />
              <Navb2Row door={{ id: 'ref', label: name, folio: `${FIX.frameworkCount}` }} active />
              <Navb2Row
                door={{ id: 'y', label: 'Framsteg', folio: FIX.weekDelta }}
                active={false}
              />
            </div>
          )}
        />
      </Board>
    </ConceptShell>
  )
}

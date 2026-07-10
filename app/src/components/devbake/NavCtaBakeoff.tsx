// NavCtaBakeoff — how should students be steered to Provpass (and
// important actions in general)?  The owner finds the current burial —
// Provpass reachable only via the Mer-menu or ⌘K — bad UX.
//
// Principle under test: viktiga saker ska synas utan ⌘K (house rule).
//
// Three placements, each rendered as a full 390px phone Home so the
// owner judges the real product idiom (M3 "Boksidan": the margin-rail
// chassis, italic display headlines, mono eyebrows, cobalt --accent):
//
//   V1 · Plan-item      Provpass is a prescribed row IN the numbered
//                       daily plan (a scheduler citizen). A sub-toggle
//                       shows the plan WITHOUT a provpass day so the
//                       owner sees it's periodic, not daily noise.
//   V2 · Standing card  A permanent "PROVPASS" rail section below the
//                       plan — last result + a house-CTA "Starta
//                       provpass →" + a "nästa rekommenderas" meta.
//                       Always visible, never moves.
//   V3 · Öva hub        The bottom-nav "Övning" tab becomes "Öva",
//                       opening a hub with three large entries —
//                       Drilla / Provpass / Diagnostik. Renders both the
//                       modified BottomTabs bar and the hub screen.
//   V4 · Prescribed +   The 4-specialist panel consensus. The mock is the
//        line + confirm  ANCHOR of a reduced plan on a provpass-dag, a
//                       passive status LINE keeps the door visible every
//                       day, and a CONFIRM SHEET protects the start. Four
//                       states via sub-toggle. Renders WITHOUT the streak
//                       stat (no-streak-shame rule).
//
// This is a DESIGN artifact. It renders real hpc-m3-* classes + tokens
// and the real BottomTabs idiom (mirrored from MobileFrame's TABS), but
// changes NO product code — everything lives under this component and
// the /dev/nav-cta-bakeoff route.

import type { CSSProperties, ReactNode } from 'react'
import { useState } from 'react'

import { Book, Chart, Home, Pencil, User } from '@/components/icons'

// ── shared tokens / helpers ─────────────────────────────────────────

const MONO_TRACK = 'var(--font-mono-track, 0.04em)'

const eyebrow: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

// A prescribed plan (3 items) — the real scheduler shape (lib/scheduler
// PlanItem): cobalt ordinal, section tag, display headline, muted
// rationale, trailing minutes.
type Row = {
  id: string
  tag: string | null
  headline: string
  rationale: string
  min: number
  verb: string
  provpass?: boolean
}

const PLAN_WITH_PROV: Row[] = [
  {
    id: 'lesson-nog',
    tag: 'NOG',
    headline: 'Tillräcklig information',
    rationale: 'Svagast just nu (1,3) och 8 dagar sedan du läste ramverket.',
    min: 12,
    verb: 'läs',
  },
  {
    id: 'provpass',
    tag: 'PROVPASS',
    headline: 'Provpass · Verbal',
    rationale: '12 dagar sedan senaste — dags att mäta.',
    min: 55,
    verb: 'starta',
    provpass: true,
  },
  {
    id: 'drill-kva',
    tag: 'KVA',
    headline: 'Kvantitativa jämförelser',
    rationale: 'Näst svagast — en kort drill håller den varm.',
    min: 10,
    verb: 'öva',
  },
]

const PLAN_REST: Row[] = [
  {
    id: 'lesson-nog',
    tag: 'NOG',
    headline: 'Tillräcklig information',
    rationale: 'Svagast just nu (1,3) och 8 dagar sedan du läste ramverket.',
    min: 12,
    verb: 'läs',
  },
  {
    id: 'rep',
    tag: null,
    headline: 'Repetition · 14 frågor',
    rationale: '14 frågor är mogna för återkoppling i din kö.',
    min: 11,
    verb: 'repetera',
  },
  {
    id: 'drill-kva',
    tag: 'KVA',
    headline: 'Kvantitativa jämförelser',
    rationale: 'Näst svagast — en kort drill håller den varm.',
    min: 10,
    verb: 'öva',
  },
]

const LAST_MOCK = { half: 'Verbal', score: '31/40', when: 'för 5 dagar sedan' }

// ── the 390px phone artboard (mirrors home-phone-resume-bakeoff) ─────

function Artboard({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: 390,
        minHeight: 780,
        background: 'var(--panel, #f6f2e9)',
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

// iOS status strip — trimmed from MobileFrame's StatusBar so the frame
// reads as a phone without pulling the whole shell into a dev route.
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

// The Home masthead: mono kicker + italic display greeting + the stats
// row (prognosis / streak / minutes) — the real HomeMobile head.
function Masthead({ minutesToday }: { minutesToday: number }) {
  return (
    <header style={{ padding: '4px 22px 0' }}>
      <div style={eyebrow}>
        <strong style={{ color: 'var(--ink-2)' }}>Onsdag 9 juli</strong> · 148 dagar · höstprov 26
      </div>
      <h1
        className="hpc-m3-display"
        style={{ fontSize: 38, margin: '18px 0 0', fontStyle: 'italic' }}
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
          <div className="hpc-m3-stat-n">{minutesToday}</div>
          <div className="hpc-m3-stat-l">min idag</div>
        </div>
      </div>
    </header>
  )
}

// A rail section, flattened for the phone artboard: mono meta label on
// top, content below (the phone layout collapses M3's margin rail into a
// stacked eyebrow — same as the real phone Home).
function RailSection({
  meta,
  accent = false,
  children,
}: {
  meta: ReactNode
  accent?: boolean
  children: ReactNode
}) {
  return (
    <section
      style={{
        padding: '22px 22px 0',
        marginTop: 22,
        borderTop: `1px solid ${accent ? 'var(--accent)' : 'var(--hairline)'}`,
      }}
    >
      <div
        style={{ ...eyebrow, color: accent ? 'var(--accent)' : 'var(--muted)', marginBottom: 12 }}
      >
        {meta}
      </div>
      {children}
    </section>
  )
}

// One numbered plan row — the exact hpc-m3-plan-item grid the real plan
// uses (32px cobalt ordinal | body | trailing minutes).
function PlanRow({ row, ordinal }: { row: Row; ordinal: number }) {
  const highlight = row.provpass
  return (
    <li
      className="hpc-m3-plan-item"
      style={
        highlight
          ? { background: 'var(--accent-soft)', margin: '0 -22px', padding: '14px 22px' }
          : undefined
      }
    >
      <span className="hpc-m3-plan-n" aria-hidden>
        {ordinal}.
      </span>
      <div style={{ minWidth: 0 }}>
        <div className="hpc-m3-plan-t">
          {row.tag ? <span className="hpc-m3-tag">{row.tag}</span> : null}
          {row.headline}
        </div>
        <div className="hpc-m3-plan-r">{row.rationale}</div>
        <span
          style={{
            display: 'inline-block',
            marginTop: 6,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
          }}
        >
          {row.verb} →
        </span>
      </div>
      <span className="hpc-m3-plan-min">~{row.min} min</span>
    </li>
  )
}

function PlanCard({ rows }: { rows: Row[] }) {
  const total = rows.reduce((s, r) => s + r.min, 0)
  return (
    <RailSection
      meta={
        <>
          <strong style={{ color: 'var(--ink-2)' }}>Idag</strong> · ~{total} min · uppskattat
        </>
      }
    >
      <h2 className="hpc-m3-h">Dagens plan</h2>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {rows.map((r, i) => (
          <PlanRow key={r.id} row={r} ordinal={i + 1} />
        ))}
      </ol>
    </RailSection>
  )
}

// Recent-passes glance — the real "Senaste passen" strip, kept so each
// artboard reads as a complete Home, not a fragment.
function RecentPasses() {
  const cards = [
    { tag: 'Verbal', score: '31/40' },
    { tag: 'KVA', score: '9/12' },
    { tag: 'ORD', score: '34/40' },
  ]
  return (
    <RailSection meta="Tidigare pass">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h2 className="hpc-m3-h" style={{ marginBottom: 0 }}>
          Senaste passen
        </h2>
        <span style={{ ...eyebrow, color: 'var(--accent)', fontSize: 10 }}>alla pass →</span>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
        {cards.map((c) => (
          <div
            key={c.tag}
            style={{
              flex: '0 0 auto',
              minWidth: 92,
              border: '1px solid var(--hairline)',
              borderRadius: 'calc(var(--radius) * 0.5)',
              padding: '11px 14px',
              background: 'var(--panel)',
            }}
          >
            <span className="hpc-m3-tag">{c.tag}</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginTop: 5 }}>
              {c.score}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--muted)',
                marginTop: 1,
              }}
            >
              rätt
            </div>
          </div>
        ))}
      </div>
    </RailSection>
  )
}

// ── the real BottomTabs idiom (mirrored from MobileFrame TABS) ───────

type TabKey = 'home' | 'drill' | 'lektion' | 'coach' | 'progress'

function BottomTabs({
  active = 'home',
  drillLabel = 'Övning',
  drillActive = false,
}: {
  active?: TabKey
  drillLabel?: string
  drillActive?: boolean
}) {
  const tabs: Array<{ id: TabKey; label: string; Icon: (p: { s?: number }) => ReactNode }> = [
    { id: 'home', label: 'Hem', Icon: Home },
    { id: 'drill', label: drillLabel, Icon: Pencil },
    { id: 'lektion', label: 'Lektion', Icon: Book },
    { id: 'coach', label: 'Feedback', Icon: User },
    { id: 'progress', label: 'Framsteg', Icon: Chart },
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
        {tabs.map(({ id, label, Icon }) => {
          const on = active === id || (id === 'drill' && drillActive)
          return (
            <div
              key={id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                color: on ? 'var(--ink)' : 'var(--muted-2)',
              }}
            >
              <Icon s={20} />
              <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// scrollable content zone that clears the fixed tab bar
function Scroll({ children }: { children: ReactNode }) {
  return <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 92 }}>{children}</div>
}

// ── V1 — Plan-item (scheduler citizen) ──────────────────────────────

export function VariantPlanItem() {
  const [rest, setRest] = useState(false)
  const rows = rest ? PLAN_REST : PLAN_WITH_PROV
  const minutes = rows.reduce((s, r) => s + r.min, 0)
  return (
    <div>
      <SubToggle
        options={[
          { key: 'prov', label: 'Provpass-dag' },
          { key: 'rest', label: 'Vanlig dag (vilostat)' },
        ]}
        value={rest ? 'rest' : 'prov'}
        onChange={(k) => setRest(k === 'rest')}
      />
      <Artboard>
        <StatusStrip />
        <Scroll>
          <Masthead minutesToday={minutes} />
          <PlanCard rows={rows} />
          <RecentPasses />
        </Scroll>
        <BottomTabs active="home" />
      </Artboard>
    </div>
  )
}

// ── V2 — Standing Home card ─────────────────────────────────────────

export function VariantStandingCard() {
  return (
    <Artboard>
      <StatusStrip />
      <Scroll>
        <Masthead minutesToday={33} />
        <PlanCard rows={PLAN_REST} />
        {/* the permanent PROVPASS section — always visible, never moves */}
        <RailSection meta="Provpass" accent>
          <h2 className="hpc-m3-h">Provpass</h2>
          <div
            style={{
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--radius)',
              padding: '16px 18px',
              background: 'var(--panel)',
            }}
          >
            <div className="hpc-m3-resume-s" style={{ margin: 0 }}>
              Senast: {LAST_MOCK.half} {LAST_MOCK.score} · {LAST_MOCK.when}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                marginTop: 14,
              }}
            >
              <span className="hpc-m3-cta" style={{ cursor: 'default' }}>
                Starta provpass →
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--muted-2)',
                  textAlign: 'right',
                  lineHeight: 1.35,
                }}
              >
                nästa rekommenderas
                <br />
                om 2 dagar
              </span>
            </div>
          </div>
        </RailSection>
        <RecentPasses />
      </Scroll>
      <BottomTabs active="home" />
    </Artboard>
  )
}

// ── V3 — Öva hub ────────────────────────────────────────────────────

const HUB_ENTRIES = [
  {
    tag: 'DRILLA',
    title: 'Drilla en sektion',
    desc: 'Korta pass på en sektion — precis den svaghet planen pekar på.',
    meta: '10–15 min · valfri sektion',
  },
  {
    tag: 'PROVPASS',
    title: 'Provpass',
    desc: 'Ett helt pass under riktiga villkor — samma tryck som på plats.',
    meta: '55 min · riktiga villkor',
  },
  {
    tag: 'DIAGNOSTIK',
    title: 'Diagnostik',
    desc: 'Bredd över alla åtta sektioner för att kalibrera om prognosen.',
    meta: '~10 frågor · kalibrerar planen',
  },
]

export function VariantOvaHub() {
  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* the modified bottom-nav bar in isolation, so the rename reads */}
      <div style={{ width: 390 }}>
        <div style={{ ...eyebrow, marginBottom: 8, color: 'var(--ink-2)' }}>
          Nav: "Övning" → "Öva"
        </div>
        <div
          style={{
            position: 'relative',
            height: 84,
            border: '1px solid var(--hairline)',
            borderRadius: 20,
            overflow: 'hidden',
            background: 'var(--panel)',
          }}
        >
          <BottomTabs active="drill" drillLabel="Öva" drillActive />
        </div>
      </div>

      {/* the hub screen it opens */}
      <div style={{ width: 390 }}>
        <div style={{ ...eyebrow, marginBottom: 8, color: 'var(--ink-2)' }}>
          Öva-fliken öppnar navet
        </div>
        <Artboard>
          <StatusStrip />
          <Scroll>
            <header style={{ padding: '4px 22px 0' }}>
              <div style={eyebrow}>Öva</div>
              <h1
                className="hpc-m3-display"
                style={{ fontSize: 34, margin: '14px 0 0', fontStyle: 'italic' }}
              >
                Hur vill du öva?
              </h1>
            </header>
            <div
              style={{ padding: '26px 22px 0', display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {HUB_ENTRIES.map((e) => (
                <div
                  key={e.tag}
                  style={{
                    border: '1px solid var(--hairline)',
                    borderRadius: 'var(--radius)',
                    padding: '18px 20px',
                    background: 'var(--panel)',
                  }}
                >
                  <span className="hpc-m3-tag">{e.tag}</span>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 22,
                      color: 'var(--ink)',
                      margin: '10px 0 6px',
                    }}
                  >
                    {e.title}
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                    {e.desc}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      letterSpacing: MONO_TRACK,
                      color: 'var(--muted-2)',
                      marginTop: 12,
                    }}
                  >
                    {e.meta}
                  </div>
                </div>
              ))}
            </div>
          </Scroll>
          <BottomTabs active="drill" drillLabel="Öva" drillActive />
        </Artboard>
      </div>
    </div>
  )
}

// ── V4 — Prescribed + passive line + confirm (panel consensus) ──────
//
// The 4-specialist panel (ADHD-behavioral / IA / pedagogy / devil's
// advocate) converged here over two rounds. Three moves work together:
//   • the PLAN decides the day — on a provpass-dag the mock is the ANCHOR
//     item of a reduced plan (mock + at most one tiny item); on an
//     ordinary day it is NOT in the plan at all.
//   • a passive STATUS LINE keeps the door visible every day — a muted
//     mono readout in the Tidigare-pass area, no button chrome, no verb.
//   • a CONFIRM SHEET protects the start — tapping the plan row opens the
//     contract BEFORE any clock, so a mis-timed impulsive tap can't void
//     the mock (ADHD-PI impulsivity protection).
//
// Deliberately renders WITHOUT the "6 dagar i rad" streak stat — the
// panel found the streak violates the product's own no-streak-shame
// rule. This Masthead shows prognos + min idag only.

function MastheadNoStreak({ minutesToday }: { minutesToday: number }) {
  return (
    <header style={{ padding: '4px 22px 0' }}>
      <div style={eyebrow}>
        <strong style={{ color: 'var(--ink-2)' }}>Onsdag 9 juli</strong> · 148 dagar · höstprov 26
      </div>
      <h1
        className="hpc-m3-display"
        style={{ fontSize: 38, margin: '18px 0 0', fontStyle: 'italic' }}
      >
        God dag.
      </h1>
      <div className="hpc-m3-stats" style={{ gap: 36, marginTop: 22, paddingTop: 16 }}>
        <div>
          <div className="hpc-m3-stat-n">1,41</div>
          <div className="hpc-m3-stat-l">prognos av 2,0</div>
        </div>
        <div>
          <div className="hpc-m3-stat-n">{minutesToday}</div>
          <div className="hpc-m3-stat-l">min idag</div>
        </div>
      </div>
    </header>
  )
}

// The reduced provpass-dag plan: the mock is item 1 (the anchor), with at
// most one tiny item after it — estimated-minutes honesty, not a full
// drill load.
const PLAN_PROV_ANCHOR: Row[] = [
  {
    id: 'provpass',
    tag: 'PROVPASS',
    headline: 'Provpass · Verbal',
    rationale: '12 dagar sedan senaste — dags att mäta.',
    min: 55,
    verb: 'starta',
    provpass: true,
  },
  {
    id: 'rep',
    tag: null,
    headline: 'Repetition · 5 frågor',
    rationale: 'Några frågor är mogna för återkoppling i din kö.',
    min: 4,
    verb: 'repetera',
  },
]

// The passive status line — a READOUT, not a CTA. Muted mono, no verb, no
// arrow-as-CTA; the only affordance is a subtle full-row tap (chevron at
// far right, muted). Lives above "Senaste passen".
function ProvpassStatusLine() {
  return (
    <button
      type="button"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        width: 'calc(100% + 44px)',
        margin: '0 -22px',
        padding: '12px 22px',
        border: 'none',
        borderTop: '1px solid var(--hairline)',
        borderBottom: '1px solid var(--hairline)',
        background: 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: MONO_TRACK,
          color: 'var(--muted)',
          lineHeight: 1.4,
        }}
      >
        <span style={{ color: 'var(--muted-2)' }}>PROVPASS</span> · senast Verbal 31/40 · nästa om 2
        dagar
      </span>
      <span aria-hidden style={{ color: 'var(--muted-2)', fontSize: 14, flexShrink: 0 }}>
        ›
      </span>
    </button>
  )
}

// Recent passes with the status line wired ABOVE the "Senaste passen"
// heading (still inside the Tidigare-pass rail section).
function RecentPassesWithLine() {
  return (
    <RailSection meta="Tidigare pass">
      <ProvpassStatusLine />
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginTop: 18,
        }}
      >
        <h2 className="hpc-m3-h" style={{ marginBottom: 0 }}>
          Senaste passen
        </h2>
        <span style={{ ...eyebrow, color: 'var(--accent)', fontSize: 10 }}>alla pass →</span>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
        {[
          { tag: 'Verbal', score: '31/40' },
          { tag: 'KVA', score: '9/12' },
          { tag: 'ORD', score: '34/40' },
        ].map((c) => (
          <div
            key={c.tag}
            style={{
              flex: '0 0 auto',
              minWidth: 92,
              border: '1px solid var(--hairline)',
              borderRadius: 'calc(var(--radius) * 0.5)',
              padding: '11px 14px',
              background: 'var(--panel)',
            }}
          >
            <span className="hpc-m3-tag">{c.tag}</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginTop: 5 }}>
              {c.score}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--muted)',
                marginTop: 1,
              }}
            >
              rätt
            </div>
          </div>
        ))}
      </div>
    </RailSection>
  )
}

// The confirm sheet — what the plan row opens BEFORE any clock starts. A
// bottom-sheet in M3 idiom: heading, the contract in three mono lines, a
// primary "Starta nu →" and a quiet zero-penalty "Inte nu".
function ConfirmSheet() {
  return (
    <Artboard>
      <StatusStrip />
      {/* dimmed Home + tab bar behind the sheet, so it reads as a modal */}
      <div style={{ flex: 1, overflow: 'hidden', opacity: 0.4, pointerEvents: 'none' }}>
        <MastheadNoStreak minutesToday={59} />
        <PlanCard rows={PLAN_PROV_ANCHOR} />
      </div>
      <div style={{ opacity: 0.4, pointerEvents: 'none' }}>
        <BottomTabs active="home" />
      </div>
      {/* scrim + sheet — an absolute modal layer over the whole artboard,
       *  above the (dimmed) tab bar, exactly like a real bottom sheet. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'color-mix(in oklch, var(--ink) 22%, transparent)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--panel)',
          borderTop: '1px solid var(--accent)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: '20px 22px 30px',
          boxShadow: '0 -20px 50px -24px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            width: 38,
            height: 4,
            borderRadius: 999,
            background: 'var(--hairline)',
            margin: '0 auto 18px',
          }}
        />
        <div style={{ ...eyebrow, color: 'var(--accent)' }}>Provpass</div>
        <h2
          className="hpc-m3-display"
          style={{ fontSize: 26, margin: '10px 0 18px', fontStyle: 'italic' }}
        >
          Provpass · Verbal
        </h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
          {[
            '55 minuter · ingen paus',
            'avbryter du blir provet ogiltigt',
            'lämna ingen fråga obesvarad — fel ger inga avdrag',
          ].map((line) => (
            <li
              key={line}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                letterSpacing: MONO_TRACK,
                color: 'var(--ink-2)',
                lineHeight: 1.4,
                display: 'flex',
                gap: 10,
              }}
            >
              <span aria-hidden style={{ color: 'var(--accent)', flexShrink: 0 }}>
                ·
              </span>
              {line}
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 24 }}>
          <span
            className="hpc-m3-cta"
            style={{
              cursor: 'default',
              background: 'var(--accent)',
              color: 'var(--panel)',
              padding: '11px 20px',
              borderRadius: 999,
            }}
          >
            Starta nu →
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: MONO_TRACK,
              color: 'var(--muted-2)',
              cursor: 'default',
            }}
          >
            Inte nu
          </span>
        </div>
      </div>
    </Artboard>
  )
}

export function VariantPrescribedConsensus() {
  const [state, setState] = useState<'prov' | 'rest' | 'confirm'>('prov')
  return (
    <div>
      <SubToggle
        options={[
          { key: 'prov', label: 'Provpass-dag' },
          { key: 'rest', label: 'Vanlig dag' },
          { key: 'confirm', label: 'Confirm-sheet' },
        ]}
        value={state}
        onChange={(k) => setState(k as 'prov' | 'rest' | 'confirm')}
      />
      {state === 'confirm' ? (
        <ConfirmSheet />
      ) : (
        <Artboard>
          <StatusStrip />
          <Scroll>
            <MastheadNoStreak minutesToday={state === 'prov' ? 59 : 33} />
            <PlanCard rows={state === 'prov' ? PLAN_PROV_ANCHOR : PLAN_REST} />
            <RecentPassesWithLine />
          </Scroll>
          <BottomTabs active="home" />
        </Artboard>
      )}
    </div>
  )
}

// ── sub-toggle (V1's rest-state switch) ─────────────────────────────

function SubToggle({
  options,
  value,
  onChange,
}: {
  options: Array<{ key: string; label: string }>
  value: string
  onChange: (k: string) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
      {options.map((o) => {
        const on = o.key === value
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '6px 12px',
              borderRadius: 999,
              cursor: 'pointer',
              border: `1px solid ${on ? 'var(--accent)' : 'var(--hairline)'}`,
              background: on ? 'var(--accent-soft)' : 'transparent',
              color: on ? 'var(--ink)' : 'var(--muted-2)',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// ── caption strip (mono, muted — one-sentence trade-off) ────────────

export function Caption({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: MONO_TRACK,
        color: 'var(--muted)',
        lineHeight: 1.5,
        maxWidth: 390,
        marginTop: 14,
      }}
    >
      {children}
    </div>
  )
}

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

// ══ V4 LAYOUT STUDIES ═══════════════════════════════════════════════
//
// Same fixed mechanics as V4 (scheduler prescribes; passive status on
// ordinary days; pre-commit confirm), same M3 Boksidan idiom, same
// fixtures. The ONE free axis is COMPOSITION. Each study makes one
// deliberate choice about WHERE the provpass anchor lives and HOW loudly
// it speaks. All three render as 390px artboards with a provpass-dag /
// vanlig-dag sub-toggle, exactly like V4.

// ── V4a · "Kallelsen" (the summons) ─────────────────────────────────
//
// On a provpass-dag the mock is NOT a plan row — it is a distinct block
// ABOVE "Dagens plan", composed like a Swedish exam kallelse (a summons
// notice): rules only, no fill, no shadow — a DOCUMENT ARRIVING, not a
// card. Double-rule top + single-rule bottom give the letterpress-notice
// feel. The plan below shrinks to its one tiny remaining item. On an
// ordinary day there is no kallelse; the passive status line stands in.

function KallelseBlock() {
  return (
    <section style={{ padding: '26px 22px 0' }}>
      {/* the notice: hairline double-rule top, single-rule bottom, no
       *  fill and no shadow — rules only, so it reads as printed matter. */}
      <div
        style={{
          borderTop: '1px solid var(--ink-2)',
          boxShadow: 'inset 0 3px 0 -2px var(--ink-2)',
          borderBottom: '1px solid var(--hairline)',
          padding: '16px 0 18px',
        }}
      >
        <div style={{ ...eyebrow, color: 'var(--accent)' }}>Kallelse · Provpass</div>
        <h2
          className="hpc-m3-display"
          style={{ fontSize: 27, margin: '10px 0 0', fontStyle: 'italic', lineHeight: 1.12 }}
        >
          Verbal · 55 minuter
        </h2>
        <p
          style={{
            fontSize: 13.5,
            color: 'var(--muted)',
            lineHeight: 1.5,
            margin: '8px 0 0',
            maxWidth: '42ch',
          }}
        >
          12 dagar sedan senaste — dags att mäta.
        </p>
        <div style={{ textAlign: 'right', marginTop: 14 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: MONO_TRACK,
              textTransform: 'uppercase',
              color: 'var(--muted-2)',
            }}
          >
            starta →
          </span>
        </div>
      </div>
    </section>
  )
}

// The remaining plan on a kallelse-day — just the one tiny item, so the
// day still has a "then this" without competing with the summons.
const PLAN_AFTER_KALLELSE: Row[] = [
  {
    id: 'rep',
    tag: null,
    headline: 'Repetition · 5 frågor',
    rationale: 'Några frågor är mogna för återkoppling i din kö.',
    min: 4,
    verb: 'repetera',
  },
]

export function StudyKallelse() {
  const [rest, setRest] = useState(false)
  return (
    <div>
      <SubToggle
        options={[
          { key: 'prov', label: 'Provpass-dag' },
          { key: 'rest', label: 'Vanlig dag' },
        ]}
        value={rest ? 'rest' : 'prov'}
        onChange={(k) => setRest(k === 'rest')}
      />
      <Artboard>
        <StatusStrip />
        <Scroll>
          <MastheadNoStreak minutesToday={rest ? 33 : 59} />
          {rest ? null : <KallelseBlock />}
          <PlanCard rows={rest ? PLAN_REST : PLAN_AFTER_KALLELSE} />
          {rest ? <RecentPassesWithLine /> : <RecentPasses />}
        </Scroll>
        <BottomTabs active="home" />
      </Artboard>
      <Caption>
        A mock is a session, not a task — the visual grammar should say so. The summons arrives
        above the plan as a printed notice (rules only, no fill), and the day's plan shrinks behind
        it.
      </Caption>
    </div>
  )
}

// ── V4b · "Status-as-stat" ──────────────────────────────────────────
//
// The disciplined refinement. Two moves from V4:
//   (1) the status readout LEAVES the Tidigare-pass area and becomes a
//       FOURTH stat in the stats row — "om 2 dagar" / "nästa provpass"
//       (or "redo" in the slid vanlig-dag state). Readouts live with
//       readouts.
//   (2) the provpass plan row drops the teal fill for the marginalia
//       treatment — a 2px cobalt left rule + slight indent (the
//       .hpc-m3-tactic border-left idiom, promoted to 2px cobalt). The
//       anchor whispers with a rule instead of shouting with a fill.

function MastheadWithNextStat({
  minutesToday,
  nextMock,
}: {
  minutesToday: number
  nextMock: string
}) {
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
      <div
        className="hpc-m3-stats"
        style={{ gap: 28, marginTop: 22, paddingTop: 16, alignItems: 'baseline' }}
      >
        <div>
          <div className="hpc-m3-stat-n">1,41</div>
          <div className="hpc-m3-stat-l">prognos av 2,0</div>
        </div>
        <div>
          <div className="hpc-m3-stat-n">{minutesToday}</div>
          <div className="hpc-m3-stat-l">min idag</div>
        </div>
        <div>
          {/* the value is a short phrase, not a single numeric token, so it
           *  reads at a smaller size than 1,41/59 — otherwise "om 2 dagar"
           *  wraps to two lines and breaks the stats baseline. Same mono
           *  tabular ink face, just sized to sit on one line. */}
          <div className="hpc-m3-stat-n" style={{ fontSize: 20, whiteSpace: 'nowrap' }}>
            {nextMock}
          </div>
          <div className="hpc-m3-stat-l">nästa provpass</div>
        </div>
      </div>
    </header>
  )
}

// The provpass anchor row, marginalia-treated: 2px cobalt left rule +
// slight indent, no fill. Everything else is a normal PlanRow.
function MarginaliaPlanRow({ row, ordinal }: { row: Row; ordinal: number }) {
  return (
    <li
      className="hpc-m3-plan-item"
      style={{
        borderLeft: '2px solid var(--accent)',
        paddingLeft: 14,
        marginLeft: -16,
      }}
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

function MarginaliaPlanCard({ rows }: { rows: Row[] }) {
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
        {rows.map((r, i) =>
          r.provpass ? (
            <MarginaliaPlanRow key={r.id} row={r} ordinal={i + 1} />
          ) : (
            <PlanRow key={r.id} row={r} ordinal={i + 1} />
          ),
        )}
      </ol>
    </RailSection>
  )
}

export function StudyStatusStat() {
  const [rest, setRest] = useState(false)
  return (
    <div>
      <SubToggle
        options={[
          { key: 'prov', label: 'Provpass-dag' },
          { key: 'rest', label: 'Vanlig dag (redo)' },
        ]}
        value={rest ? 'rest' : 'prov'}
        onChange={(k) => setRest(k === 'rest')}
      />
      <Artboard>
        <StatusStrip />
        <Scroll>
          <MastheadWithNextStat
            minutesToday={rest ? 33 : 59}
            nextMock={rest ? 'redo' : 'om 2 dagar'}
          />
          <MarginaliaPlanCard rows={rest ? PLAN_REST : PLAN_PROV_ANCHOR} />
          <RecentPasses />
        </Scroll>
        <BottomTabs active="home" />
      </Artboard>
      <Caption>
        Readouts live with readouts; the anchor whispers with a rule instead of shouting with a
        fill. The "nästa provpass" stat sits with prognos + min idag; the mock row carries a 2px
        cobalt margin rule.
      </Caption>
    </div>
  )
}

// ── V4c · "Bokmärket" (the bookmark) ────────────────────────────────
//
// The structural simplification. BOTH the status line and (on a
// provpass-dag) the anchor plan row are removed. ONE element carries the
// state: a full-width quiet band at the END of the Home content, in-flow
// above the tab bar.
//   vanlig dag → muted mono readout with a hairline top rule.
//   provpass-dag → the band INVERTS to accent-soft, serif summons + mono
//                  start; the plan stays a normal 3-item plan.
// One element that changes state beats two mechanisms — but a band at the
// page's end bets the student scrolls.

function BokmarkeBand({ prov }: { prov: boolean }) {
  if (prov) {
    return (
      <div
        style={{
          marginTop: 26,
          background: 'var(--accent-soft)',
          padding: '16px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ ...eyebrow, color: 'var(--accent)', marginBottom: 4 }}>Provpass</div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 18,
              lineHeight: 1.3,
              color: 'var(--ink)',
            }}
          >
            Verbal — dags att mäta.
          </div>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: MONO_TRACK,
            textTransform: 'uppercase',
            color: 'var(--accent)',
            whiteSpace: 'nowrap',
            textAlign: 'right',
            lineHeight: 1.5,
          }}
        >
          55 min
          <br />
          starta →
        </span>
      </div>
    )
  }
  return (
    <div
      style={{
        marginTop: 26,
        borderTop: '1px solid var(--hairline)',
        padding: '14px 22px 0',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: MONO_TRACK,
          color: 'var(--muted)',
        }}
      >
        <span style={{ color: 'var(--muted-2)' }}>PROVPASS</span> · senast Verbal 31/40 · nästa om 2
        dagar
      </span>
    </div>
  )
}

export function StudyBokmarke() {
  const [rest, setRest] = useState(false)
  const prov = !rest
  return (
    <div>
      <SubToggle
        options={[
          { key: 'prov', label: 'Provpass-dag' },
          { key: 'rest', label: 'Vanlig dag' },
        ]}
        value={rest ? 'rest' : 'prov'}
        onChange={(k) => setRest(k === 'rest')}
      />
      <Artboard>
        <StatusStrip />
        <Scroll>
          <MastheadNoStreak minutesToday={rest ? 33 : 41} />
          <PlanCard rows={rest ? PLAN_REST : PLAN_WITH_PROV_NO_ANCHOR} />
          <RecentPasses />
          <BokmarkeBand prov={prov} />
        </Scroll>
        <BottomTabs active="home" />
      </Artboard>
      <Caption>
        One element that changes state beats two mechanisms — but a band at the page's end bets the
        student scrolls.
      </Caption>
    </div>
  )
}

// The Bokmärket provpass-dag plan is a NORMAL 3-item plan — the band is
// the anchor, so the plan itself carries no provpass row.
const PLAN_WITH_PROV_NO_ANCHOR: Row[] = [
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

// ══ V4A FINAL · KALLELSEN FÄRGAD ════════════════════════════════════
//
// The owner's verdict: "I like V4a (Kallelsen), but I like that V4c's
// bookmark is COLORED — and show me desktop." So the final is a
// SYNTHESIS: V4a's document grammar (the rules-only summons above the
// plan, mono KALLELSE · PROVPASS eyebrow, serif "Verbal · 55 minuter",
// rationale line) carrying V4c's colour voice (the way StudyBokmarke's
// provpass-dag band brings the accent in).
//
// Two colour treatments were tried on the phone; ONE ships. Both are
// kept as functions so the report can show the loser, but the render
// below uses only the winner (KallelseFilled — see the section caption
// in the route for which won and why).
//
// The one non-negotiable from the verdict: "STARTA →" must now read as
// the DAY'S PRIMARY ACTION. V4a's original whispered it (muted mono,
// right-aligned, no chrome); both treatments here promote it to a real
// affordance — full accent, a pill in the filled treatment.

// Treatment A — ACCENT-SOFT FILL. The notice sits on an accent-soft wash
// (same token StudyBokmarke's band inverts to), keeping the double-rule
// letterpress top but trading paper for colour. STARTA becomes a solid
// accent pill — the loudest, most unmistakable primary on the page.
function KallelseFilled() {
  return (
    <section style={{ padding: '26px 22px 0' }}>
      <div
        style={{
          background: 'var(--accent-soft)',
          borderTop: '2px solid var(--accent)',
          padding: '16px 18px 18px',
        }}
      >
        <div style={{ ...eyebrow, color: 'var(--accent)' }}>Kallelse · Provpass</div>
        <h2
          className="hpc-m3-display"
          style={{
            fontSize: 27,
            margin: '10px 0 0',
            fontStyle: 'italic',
            lineHeight: 1.12,
            color: 'var(--ink)',
          }}
        >
          Verbal · 55 minuter
        </h2>
        <p
          style={{
            fontSize: 13.5,
            color: 'var(--ink-2)',
            lineHeight: 1.5,
            margin: '8px 0 0',
            maxWidth: '42ch',
          }}
        >
          12 dagar sedan senaste — dags att mäta.
        </p>
        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <span
            className="hpc-m3-cta"
            style={{
              cursor: 'default',
              display: 'inline-block',
              borderRadius: 999,
              padding: '11px 22px',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: MONO_TRACK,
              textTransform: 'uppercase',
            }}
          >
            Starta →
          </span>
        </div>
      </div>
    </section>
  )
}

// Treatment B — PAPER, COBALT INK. Background stays paper (the document
// character V4a prized), but the accent moves into the TYPE: the eyebrow
// and the STARTA affordance go full accent, and the letterpress top rule
// becomes a 2px ACCENT double-rule. Colour as voice, not as fill.
function KallelseInk() {
  return (
    <section style={{ padding: '26px 22px 0' }}>
      <div
        style={{
          borderTop: '2px solid var(--accent)',
          boxShadow: 'inset 0 4px 0 -2px var(--accent)',
          borderBottom: '1px solid var(--hairline)',
          padding: '16px 0 18px',
        }}
      >
        <div style={{ ...eyebrow, color: 'var(--accent)' }}>Kallelse · Provpass</div>
        <h2
          className="hpc-m3-display"
          style={{ fontSize: 27, margin: '10px 0 0', fontStyle: 'italic', lineHeight: 1.12 }}
        >
          Verbal · 55 minuter
        </h2>
        <p
          style={{
            fontSize: 13.5,
            color: 'var(--muted)',
            lineHeight: 1.5,
            margin: '8px 0 0',
            maxWidth: '42ch',
          }}
        >
          12 dagar sedan senaste — dags att mäta.
        </p>
        <div style={{ textAlign: 'right', marginTop: 14 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: MONO_TRACK,
              textTransform: 'uppercase',
              color: 'var(--accent)',
              fontWeight: 600,
            }}
          >
            Starta →
          </span>
        </div>
      </div>
    </section>
  )
}

// The shipped phone artboard. `treatment` lets the report screenshot both;
// the route renders only the winner.
export function V4aFinalPhone({ treatment = 'filled' }: { treatment?: 'filled' | 'ink' }) {
  const [rest, setRest] = useState(false)
  return (
    <div>
      <SubToggle
        options={[
          { key: 'prov', label: 'Provpass-dag' },
          { key: 'rest', label: 'Vanlig dag' },
        ]}
        value={rest ? 'rest' : 'prov'}
        onChange={(k) => setRest(k === 'rest')}
      />
      <Artboard>
        <StatusStrip />
        <Scroll>
          <MastheadNoStreak minutesToday={rest ? 33 : 59} />
          {rest ? null : treatment === 'filled' ? <KallelseFilled /> : <KallelseInk />}
          <PlanCard rows={rest ? PLAN_REST : PLAN_AFTER_KALLELSE} />
          {rest ? <RecentPassesWithLine /> : <RecentPasses />}
        </Scroll>
        <BottomTabs active="home" />
      </Artboard>
    </div>
  )
}

// ── the real DESKTOP chrome, mirrored ───────────────────────────────
//
// Desktop Home is NOT the phone shrunk. The real product (verified in
// src/components/NavRail.tsx + Page.tsx + Frame.tsx + HomeMobile.tsx)
// renders, at ≥1280px:
//   • a 224px sticky NavRail on the left (brand ⌜ HP-Coach, nav with
//     live signals + the active cobalt left-rule, a cross-device resume
//     band, the countdown, and ljus ◐ · historik · mer →),
//   • the Home column to its right inside the studio canvas, built from
//     the .hpc-m3 margin-rail chassis: each section is a
//     [rail-label | hairline spine | content] grid (128px | 1px | 1fr),
//     NOT the phone's stacked eyebrow.
// This artboard reproduces both faithfully so the colored kallelse is
// judged in its real desktop home, at desktop type sizes.

// One margin-rail section (desktop grammar): right-aligned mono rail
// label, vertical spine, content column. Mirrors DrillRailSection +
// .hpc-m3-row so the desktop artboard reads as the real Boksidan.
function DeskRailSection({
  meta,
  children,
  first = false,
}: {
  meta: ReactNode
  children: ReactNode
  first?: boolean
}) {
  return (
    <section style={{ marginTop: first ? 0 : 56 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '128px 1px 1fr', columnGap: 28 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            textAlign: 'right',
            paddingTop: 5,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.5,
          }}
        >
          {meta}
        </div>
        <div style={{ background: 'var(--hairline)', alignSelf: 'stretch' }} />
        <div style={{ minWidth: 0 }}>{children}</div>
      </div>
    </section>
  )
}

// The desktop NavRail (mirrors NavRail.tsx expanded state — brand, nav
// with the active cobalt left-rule, resume band, countdown, foot words).
function DeskNavRail() {
  const nav = [
    { label: 'HEM', active: true, signal: null },
    { label: 'ÖVNING', active: false, signal: '14 att repetera' },
    { label: 'LEKTION', active: false, signal: null },
    { label: 'FRAMSTEG', active: false, signal: '+0,04 denna vecka' },
  ]
  return (
    <aside
      style={{
        width: 224,
        flexShrink: 0,
        borderRight: '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
      }}
    >
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
          <span style={{ color: 'var(--muted-2)', fontStyle: 'normal', marginRight: 5 }}>⌜</span>
          HP-Coach
        </span>
        <span style={{ ...footWordDesk, fontSize: 13 }}>«</span>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column' }}>
        {nav.map((n) => (
          <div
            key={n.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 10,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: '0.12em',
              color: n.active ? 'var(--accent)' : 'var(--ink-2)',
              fontWeight: n.active ? 600 : 400,
              padding: '11px 18px',
              borderLeft: n.active ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            {n.label}
            {n.signal ? (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.04em',
                  textTransform: 'none',
                  color: 'var(--muted-2)',
                  whiteSpace: 'nowrap',
                }}
              >
                {n.signal}
              </span>
            ) : null}
          </div>
        ))}
      </nav>
      {/* cross-device resume band */}
      <div style={{ padding: '18px 18px 0' }}>
        <div style={{ background: 'var(--accent-soft)', padding: '12px 14px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
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
            Övning · KVA
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--muted)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            4 av 10 · fortsätt →
          </div>
        </div>
      </div>
      <div style={{ flex: 1 }} />
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
          Höstprov 26 · 148 dagar
        </span>
        <span style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
          <span style={footWordDesk}>ljus ◐</span>
          <span style={footWordDesk}>historik</span>
          <span style={footWordDesk}>mer →</span>
        </span>
      </div>
    </aside>
  )
}

const footWordDesk: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted-2)',
}

// The colored kallelse at desktop scale — the winner treatment, sized up
// for the reading column. Lives ABOVE "Dagens plan" in the content
// column of its own rail section (rail label: KALLELSE).
function KallelseFilledDesk() {
  return (
    <div
      style={{
        background: 'var(--accent-soft)',
        borderTop: '2px solid var(--accent)',
        padding: '22px 26px 24px',
      }}
    >
      <div style={{ ...eyebrow, color: 'var(--accent)' }}>Kallelse · Provpass</div>
      <h2
        className="hpc-m3-display"
        style={{
          fontSize: 34,
          margin: '12px 0 0',
          fontStyle: 'italic',
          lineHeight: 1.1,
          color: 'var(--ink)',
        }}
      >
        Verbal · 55 minuter
      </h2>
      <p
        style={{
          fontSize: 15,
          color: 'var(--ink-2)',
          lineHeight: 1.5,
          margin: '10px 0 0',
          maxWidth: 280,
        }}
      >
        12 dagar sedan senaste — dags att mäta. Ett helt pass under riktiga villkor.
      </p>
      <div style={{ marginTop: 20 }}>
        <span
          className="hpc-m3-cta"
          style={{
            cursor: 'default',
            display: 'inline-block',
            borderRadius: 999,
            padding: '12px 26px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12.5,
            letterSpacing: MONO_TRACK,
            textTransform: 'uppercase',
          }}
        >
          Starta →
        </span>
      </div>
    </div>
  )
}

// A desktop plan row (larger type than the phone artboard's).
function DeskPlanRow({ row, ordinal }: { row: Row; ordinal: number }) {
  return (
    <li className="hpc-m3-plan-item">
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

// The full desktop artboard: a ~1200px window (rail + studio Home column),
// rendered for a provpass-dag OR a vanlig dag via its own toggle.
export function V4aFinalDesktop() {
  const [rest, setRest] = useState(false)
  const prov = !rest
  const planRows = prov ? PLAN_AFTER_KALLELSE : PLAN_REST
  const planTotal = planRows.reduce((s, r) => s + r.min, 0)
  return (
    <div>
      <SubToggle
        options={[
          { key: 'prov', label: 'Provpass-dag' },
          { key: 'rest', label: 'Vanlig dag' },
        ]}
        value={rest ? 'rest' : 'prov'}
        onChange={(k) => setRest(k === 'rest')}
      />
      {/* the desktop window: studio canvas (rail + content) */}
      <div
        style={{
          width: 1200,
          minHeight: 720,
          background: 'var(--bg)',
          border: '1px solid var(--hairline)',
          borderRadius: 12,
          overflow: 'hidden',
          display: 'flex',
          boxShadow: '0 24px 60px -30px rgba(0,0,0,0.4)',
        }}
      >
        <DeskNavRail />
        {/* the Home column — the .hpc-m3-frame padding + margin-rail sections */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 44px 64px' }}>
            {/* greeting + stats (rail: date) */}
            <DeskRailSection
              first
              meta={
                <>
                  <strong style={{ display: 'block', color: 'var(--ink-2)', fontWeight: 500 }}>
                    Onsdag 9 juli
                  </strong>
                  148 dagar · höstprov 26
                </>
              }
            >
              <h1
                className="hpc-m3-display"
                style={{ fontSize: 46, margin: 0, fontStyle: 'italic' }}
              >
                God dag.
              </h1>
              <div className="hpc-m3-stats">
                <div>
                  <div className="hpc-m3-stat-n">1,41</div>
                  <div className="hpc-m3-stat-l">prognos av 2,0</div>
                </div>
                <div>
                  <div className="hpc-m3-stat-n">{prov ? 59 : 33}</div>
                  <div className="hpc-m3-stat-l">min idag</div>
                </div>
              </div>
            </DeskRailSection>

            {/* the colored kallelse — its own rail section, ABOVE the plan.
             *  On a vanlig dag it is absent; the passive status line stands
             *  in inside the plan-rail area instead. */}
            {prov ? (
              <DeskRailSection meta="Kallelse">
                <KallelseFilledDesk />
              </DeskRailSection>
            ) : null}

            {/* Dagens plan (rail: Idag) */}
            <DeskRailSection
              meta={
                <>
                  <strong style={{ display: 'block', color: 'var(--ink-2)', fontWeight: 500 }}>
                    Idag
                  </strong>
                  ~{planTotal} min · uppskattat
                </>
              }
            >
              <h2 className="hpc-m3-h">Dagens plan</h2>
              <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {planRows.map((r, i) => (
                  <DeskPlanRow key={r.id} row={r} ordinal={i + 1} />
                ))}
              </ol>
              {rest ? (
                <div
                  style={{
                    marginTop: 18,
                    paddingTop: 14,
                    borderTop: '1px solid var(--hairline)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    letterSpacing: MONO_TRACK,
                    color: 'var(--muted)',
                  }}
                >
                  <span style={{ color: 'var(--muted-2)' }}>PROVPASS</span> · senast Verbal 31/40 ·
                  nästa om 2 dagar
                </div>
              ) : null}
            </DeskRailSection>

            {/* Senaste passen (rail: Tidigare pass) */}
            <DeskRailSection meta="Tidigare pass">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                }}
              >
                <h2 className="hpc-m3-h" style={{ marginBottom: 0 }}>
                  Senaste passen
                </h2>
                <span style={{ ...eyebrow, color: 'var(--accent)', fontSize: 10 }}>
                  alla pass →
                </span>
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 16 }}>
                {[
                  { tag: 'Verbal', score: '31/40' },
                  { tag: 'KVA', score: '9/12' },
                  { tag: 'ORD', score: '34/40' },
                ].map((c) => (
                  <div
                    key={c.tag}
                    style={{
                      minWidth: 104,
                      border: '1px solid var(--hairline)',
                      borderRadius: 'calc(var(--radius) * 0.5)',
                      padding: '12px 16px',
                      background: 'var(--panel)',
                    }}
                  >
                    <span className="hpc-m3-tag">{c.tag}</span>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginTop: 6 }}>
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
            </DeskRailSection>
          </div>
        </div>
      </div>
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

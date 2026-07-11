// AccountMenuR2B — round 2, designer B. Two concepts for the account /
// identity surface, after round 1 was rejected on feel. Both keep what the
// round-1 panel liked (the serif-italic initials medallion as a press mark;
// the three-register identity stack) and fix what it flagged (window-
// anchored popovers, broken scrim, grid violations). Owner law honored
// throughout: "Radera konto" appears NOWHERE; surface actions are Logga ut,
// Konto →, Exportera min data, plus a quiet Inställningar cross-reference;
// identity chrome exists ONLY on Home (masthead + desktop mast); the same
// slot offers "Logga in" when signed out.
//
// ── R2B1 · "Kolofonkortet" (the tipped-in colophon card) ───────────────
//
// The conventional answer — top-right medallion, quick menu — executed to
// the millimeter instead of to the pattern. What changed from round 1:
//
//   · COLUMN-ANCHORED, not window-anchored. The medallion lives INSIDE the
//     820px reading column (right text margin), optically centered on the
//     date-meta first line (-4px optical lift; the meta line box is 16.5px
//     starting 5px down, so its center sits at ~13px — half a 34px
//     medallion above that is -4). The card's right hairline lands exactly
//     on the column's right text margin. Nothing straddles the rail spine;
//     nothing references the window.
//   · MONO ACTIONS. Round 1 set the rows in Inter and they read as generic
//     SaaS chrome. Here the identity stack keeps its three registers (mono
//     eyebrow / serif name / mono email) and the actions drop to tracked
//     mono caps — the same register as "mer →" and every other piece of
//     page furniture. The typographic tension IS serif-name-over-mono-verbs.
//   · A RULE PAIR, not a border. Identity and actions are separated by the
//     classic book double rule (1px + 2px gap + 1px) — the deckle-crisp
//     detail that says "printed card", not "dropdown".
//   · ONE entrance. The card settles in like a card tipped into a book:
//     -4px drop + fade, 220ms on the house ease, scrim fading alongside;
//     both gated behind prefers-reduced-motion.
//   · Scrim is the house dim: color-mix(in oklch, var(--ink) 14%,
//     transparent), artboard-local.
//   · Signed out, the slot holds a DASHED hairline ring — the un-stamped
//     press mark — beside mono "Logga in". Same footprint, honest absence.
//
// Aesthetic risk taken: setting every action in 11–12px tracked mono caps
// makes the menu quieter and slower to scan than a bold sans list — we bet
// that in a two-item-plus-footnote menu, register coherence beats scan
// speed. Rejected along the way: an accent top border on the card (the
// Kallelse owns that treatment); iconography in rows (no icons anywhere
// else in Boksidan's furniture); a wider 300px card (268 holds the email
// on one line and keeps the card subordinate to the column).
//
// ── R2B2 · "Inskriven" (the addressee line) ────────────────────────────
//
// The free swing. A real högskoleprov answer sheet opens with the
// candidate's name at the head of the document; the Kallelse is a summons
// ADDRESSED to you. So identity here is not a control in the corner — it
// is the document's addressee line, seated on the house chassis as page
// furniture: the margin rail says INSKRIVEN, the content cell carries the
// name in tracked mono caps, a hairline closes the row. It reads as part
// of the exam paper, because it is one.
//
// Activating the line does not float a popover: THE DOCUMENT UNFOLDS ITS
// REGISTRATION BLOCK IN PLACE (grid-template-rows 0fr→1fr, 260ms, the
// house draw ease; instant under reduced motion). The addressee name
// appears in serif italic — exactly the register the Kallelse uses to
// summon you — with the mono email beneath and the actions set as form
// footnotes on one baseline: Konto →, Exportera min data →, Logga ut,
// and a muted Inställningar → cross-reference. Esc or a second activation
// folds it back. Since nothing overlays the page, no scrim exists to get
// wrong. Signed out, the line reads EJ INSKRIVEN · Logga in → — an
// unregistered document inviting registration.
//
// Aesthetic risk taken: the student's full name is standing page furniture
// on Home — always printed, like the name field of an exam paper. That is
// the point (this document is issued to YOU — ownership is the ADHD-
// friendly anchor), but it spends a line of vertical space and shows a
// name over shoulders in a café. Rejected along the way: abbreviating to
// "L. Benali" (bureaucratic, not personal); putting the folio ABOVE the
// phone status strip (fought the bezel); a right-side page number "S. 1"
// (cute but false — Home is not paginated); any medallion in this concept
// (the addressee line needs no seal; two marks would compete).
//
// Both concepts render the REAL signed-in Clerk user via round 1's
// useAccountIdentity; "Logga ut" calls the real signOut(). `signedOut`
// prop previews the signed-out slot; `defaultOpen` renders menus open for
// judging. Self-contained artboards (phone 390×844 + desktop 1440) — no
// product code touched.

import { useClerk } from '@clerk/clerk-react'
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'

import { Book, Chart, Home, Pencil, User } from '@/components/icons'

import { useAccountIdentity } from './AccountMenuBakeoff'

// ── shared registers ────────────────────────────────────────────────

const MONO_TRACK = 'var(--font-mono-track, 0.04em)'

const eyebrow: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

// The mono page-furniture word — the register of "mer →", "historik".
const monoWord: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

// Entrance motion, reduced-motion gated. Injected once per artboard tree;
// class names are r2b-scoped so nothing leaks into product CSS.
const MOTION_CSS = `
@keyframes r2b-settle {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes r2b-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.r2b-card { animation: r2b-settle 220ms cubic-bezier(0.22, 1, 0.36, 1) both; }
.r2b-scrim { animation: r2b-fade 160ms ease-out both; }
.r2b-unfold {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 260ms cubic-bezier(0.22, 1, 0.36, 1);
}
.r2b-unfold.is-open { grid-template-rows: 1fr; }
.r2b-unfold > div { overflow: hidden; min-height: 0; }
.r2b-unfold-inner { opacity: 0; transition: opacity 200ms ease-out 60ms; }
.r2b-unfold.is-open .r2b-unfold-inner { opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  .r2b-card, .r2b-scrim { animation: none; }
  .r2b-unfold { transition: none; }
  .r2b-unfold-inner { transition: none; }
}
`

function MotionStyles() {
  return <style>{MOTION_CSS}</style>
}

// ── identity marks ──────────────────────────────────────────────────

/** The press mark the round-1 panel kept: serif-italic initials in a
 *  hairline ring. */
function Medallion({ initials, size = 34 }: { initials: string; size?: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        border: '1px solid var(--hairline)',
        background: 'var(--panel)',
        color: 'var(--ink-2)',
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontWeight: 500,
        fontSize: size * 0.42,
        lineHeight: 1,
        letterSpacing: '0.01em',
        userSelect: 'none',
      }}
    >
      {initials}
    </span>
  )
}

/** Signed out: the un-stamped mark — a dashed ring where the medallion
 *  would sit, beside mono "Logga in". Same footprint as signed in. */
function SignInSlot({ size = 34 }: { size?: number }) {
  return (
    <button
      type="button"
      aria-label="Logga in"
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          width: size,
          height: size,
          borderRadius: '50%',
          border: '1px dashed var(--hairline)',
          background: 'transparent',
        }}
      />
      <span style={{ ...monoWord, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>Logga in</span>
    </button>
  )
}

// ── R2B1 · the colophon card ────────────────────────────────────────

type CardAction = {
  key: string
  label: string
  onSelect?: () => void
  arrow?: boolean
}

/** The book double rule — 1px, 2px gap, 1px. */
function RulePair() {
  return (
    <div aria-hidden style={{ padding: '0 16px' }}>
      <div style={{ height: 1, background: 'var(--hairline)' }} />
      <div style={{ height: 2 }} />
      <div style={{ height: 1, background: 'var(--hairline)' }} />
    </div>
  )
}

function ColophonCard({
  identity,
  actions,
  labelId,
}: {
  identity: { name: string; email: string; initials: string }
  actions: CardAction[]
  labelId: string
}) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.querySelector<HTMLButtonElement>('button[role="menuitem"]')?.focus()
  }, [])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return
    const items = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]') ?? [],
    )
    if (items.length === 0) return
    e.preventDefault()
    const idx = items.indexOf(document.activeElement as HTMLButtonElement)
    let next = idx
    if (e.key === 'ArrowDown') next = idx < 0 ? 0 : (idx + 1) % items.length
    else if (e.key === 'ArrowUp') next = idx <= 0 ? items.length - 1 : idx - 1
    else if (e.key === 'Home') next = 0
    else next = items.length - 1
    items[next]?.focus()
  }

  return (
    <div
      role="menu"
      aria-labelledby={labelId}
      onKeyDown={onKeyDown}
      className="r2b-card"
      style={{
        width: 268,
        background: 'var(--panel)',
        border: '1px solid var(--hairline)',
        borderRadius: 3,
        // A lifted card, not a floating layer: one soft directional throw
        // plus a tight contact shadow at the edge.
        boxShadow: '0 18px 40px -20px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* identity — the three registers the panel kept */}
      <div
        id={labelId}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px 14px' }}
      >
        <Medallion initials={identity.initials} size={38} />
        <div style={{ minWidth: 0 }}>
          <div style={{ ...eyebrow, fontSize: 10, marginBottom: 3 }}>Inloggad som</div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 17,
              color: 'var(--ink)',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {identity.name}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--muted)',
              marginTop: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {identity.email}
          </div>
        </div>
      </div>

      <RulePair />

      {/* actions — tracked mono caps, the page-furniture register */}
      <div ref={listRef} style={{ padding: '7px 0 6px' }}>
        {actions.map((a) => (
          <CardRow key={a.key} action={a} />
        ))}
      </div>

      {/* quiet cross-reference to product prefs */}
      <div style={{ borderTop: '1px solid var(--hairline)', padding: '10px 16px 12px' }}>
        <button type="button" role="menuitem" style={{ all: 'unset', cursor: 'pointer' }}>
          <span style={monoWord}>Inställningar →</span>
        </button>
      </div>
    </div>
  )
}

function CardRow({ action }: { action: CardAction }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      role="menuitem"
      onClick={action.onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        width: '100%',
        padding: '10px 16px',
        cursor: 'pointer',
        background: hover ? 'var(--panel-2)' : 'transparent',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        letterSpacing: MONO_TRACK,
        textTransform: 'uppercase',
        color: 'var(--ink-2)',
      }}
    >
      <span>{action.label}</span>
      {action.arrow ? (
        <span aria-hidden style={{ color: 'var(--muted)', fontSize: 12 }}>
          →
        </span>
      ) : null}
    </button>
  )
}

/** Trigger + artboard-local ink-14% scrim + Esc + positioned card. The
 *  positioning container is the READING COLUMN (callers place this inside
 *  the column, never the window). */
function ColophonMenu({
  identity,
  actions,
  panelStyle,
  defaultOpen = false,
  medallionSize = 34,
}: {
  identity: { name: string; email: string; initials: string }
  actions: CardAction[]
  panelStyle: CSSProperties
  defaultOpen?: boolean
  medallionSize?: number
}) {
  const [open, setOpen] = useState(defaultOpen)
  const menuId = useId()
  const labelId = useId()
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  return (
    <>
      <button
        type="button"
        aria-label="Kontomeny"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        style={{ all: 'unset', cursor: 'pointer', borderRadius: '50%', display: 'inline-flex' }}
      >
        <Medallion initials={identity.initials} size={medallionSize} />
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Stäng menyn"
            onClick={close}
            className="r2b-scrim"
            style={{
              position: 'fixed',
              inset: 0,
              border: 'none',
              cursor: 'default',
              background: 'color-mix(in oklch, var(--ink) 14%, transparent)',
              zIndex: 40,
            }}
            data-artboard-scrim
          />
          <div id={menuId} style={{ position: 'absolute', zIndex: 41, ...panelStyle }}>
            <ColophonCard identity={identity} actions={actions} labelId={labelId} />
          </div>
        </>
      ) : null}
    </>
  )
}

// ── artboard chassis (mirrors round 1's frames) ─────────────────────

function Artboard({ children, shot }: { children: ReactNode; shot?: string }) {
  return (
    <div
      data-shot={shot}
      style={{
        width: 390,
        height: 844,
        background: 'var(--panel)',
        border: '1px solid var(--hairline)',
        borderRadius: 28,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 60px -30px rgba(0,0,0,0.4)',
        // Contain the fixed-position scrim to this frame (CSS containment
        // makes position:fixed resolve against the artboard, so each menu
        // dims exactly its own phone/desktop window).
        transform: 'translateZ(0)',
        overflow: 'hidden',
      }}
    >
      <MotionStyles />
      {children}
    </div>
  )
}

function DeskFrame({ children, shot }: { children: ReactNode; shot?: string }) {
  return (
    <div
      data-shot={shot}
      style={{
        width: 1440,
        height: 720,
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        position: 'relative',
        transform: 'translateZ(0)',
        boxShadow: '0 24px 60px -30px rgba(0,0,0,0.4)',
      }}
    >
      <MotionStyles />
      {children}
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

type TabKey = 'home' | 'drill' | 'lektion' | 'coach' | 'progress'

function BottomTabs({ active = 'home' }: { active?: TabKey }) {
  const tabs: Array<{ id: TabKey; label: string; Icon: (p: { s?: number }) => ReactNode }> = [
    { id: 'home', label: 'Hem', Icon: Home },
    { id: 'drill', label: 'Övning', Icon: Pencil },
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
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        zIndex: 30,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0 4px' }}>
        {tabs.map(({ id, label, Icon }) => {
          const on = active === id
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

function PhoneScroll({ children }: { children: ReactNode }) {
  return <div style={{ flex: 1, overflow: 'hidden', paddingBottom: 92 }}>{children}</div>
}

// The phone Home masthead. `corner` slots R2B1's medallion; `above` slots
// R2B2's folio line (rendered before the date rail).
function Masthead({ corner, above }: { corner?: ReactNode; above?: ReactNode }) {
  return (
    <header style={{ padding: '4px 22px 0' }}>
      {above}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={eyebrow}>
          <strong style={{ color: 'var(--ink-2)' }}>Onsdag 9 juli</strong> · 148 dagar · höstprov 26
        </div>
        {corner ? <div style={{ marginTop: -2, position: 'relative' }}>{corner}</div> : null}
      </div>
      <h1
        className="hpc-m3-display"
        style={{ fontSize: 38, margin: '14px 0 0', fontStyle: 'italic' }}
      >
        God dag.
      </h1>
      <div className="hpc-m3-stats" style={{ gap: 34, marginTop: 20, paddingTop: 16 }}>
        <div>
          <div className="hpc-m3-stat-n">1,41</div>
          <div className="hpc-m3-stat-l">prognos av 2,0</div>
        </div>
        <div>
          <div className="hpc-m3-stat-n">6</div>
          <div className="hpc-m3-stat-l">dagar i rad</div>
        </div>
        <div>
          <div className="hpc-m3-stat-n">41</div>
          <div className="hpc-m3-stat-l">min idag</div>
        </div>
      </div>
    </header>
  )
}

const PLAN = [
  { tag: 'NOG', headline: 'Tillräcklig information', min: 12, verb: 'läs' },
  { tag: 'KVA', headline: 'Kvantitativa jämförelser', min: 10, verb: 'öva' },
]

function PhonePlan() {
  const total = PLAN.reduce((s, r) => s + r.min, 0)
  return (
    <section
      style={{ padding: '22px 22px 0', marginTop: 22, borderTop: '1px solid var(--hairline)' }}
    >
      <div style={{ ...eyebrow, marginBottom: 12 }}>
        <strong style={{ color: 'var(--ink-2)' }}>Idag</strong> · ~{total} min · uppskattat
      </div>
      <h2 className="hpc-m3-h">Dagens plan</h2>
      <PlanList />
    </section>
  )
}

function PlanList() {
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {PLAN.map((r, i) => (
        <li key={r.tag} className="hpc-m3-plan-item">
          <span className="hpc-m3-plan-n" aria-hidden>
            {i + 1}.
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="hpc-m3-plan-t">
              <span className="hpc-m3-tag">{r.tag}</span>
              {r.headline}
            </div>
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
              {r.verb} →
            </span>
          </div>
          <span className="hpc-m3-plan-min">~{r.min} min</span>
        </li>
      ))}
    </ol>
  )
}

// ── desktop chassis ─────────────────────────────────────────────────

function DeskNavRail() {
  const nav = [
    { label: 'HEM', active: true, signal: null as string | null },
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
        <span style={{ ...monoWord, fontSize: 13 }}>«</span>
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
              color: n.active ? 'var(--ink)' : 'var(--ink-2)',
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
                  color: 'var(--muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {n.signal}
              </span>
            ) : null}
          </div>
        ))}
      </nav>
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
          <span style={monoWord}>ljus ◐</span>
          <span style={monoWord}>historik</span>
          <span style={monoWord}>mer →</span>
        </span>
      </div>
    </aside>
  )
}

/** One rail-chassis section: 128px mono margin label | hairline spine |
 *  content. The desktop Home grammar. */
function RailRow({
  meta,
  metaSub,
  children,
  style,
}: {
  meta?: ReactNode
  metaSub?: ReactNode
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '128px 1px 1fr', columnGap: 28, ...style }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          textAlign: 'right',
          paddingTop: 5,
          lineHeight: 1.5,
        }}
      >
        {meta ? (
          <strong style={{ display: 'block', color: 'var(--ink-2)', fontWeight: 500 }}>
            {meta}
          </strong>
        ) : null}
        {metaSub}
      </div>
      <div style={{ background: 'var(--hairline)', alignSelf: 'stretch' }} />
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  )
}

/** The desktop Home reading column. `mastRight` seats R2B1's medallion at
 *  the column's right text margin (position:relative on the column, NOT
 *  the window); `folio` seats R2B2's addressee row above the masthead. */
function DeskHomeColumn({ mastRight, folio }: { mastRight?: ReactNode; folio?: ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
      <div
        style={{
          maxWidth: 820,
          margin: '0 auto',
          padding: '48px 44px 64px',
          position: 'relative',
        }}
      >
        {mastRight ? (
          // Right edge = the column's right text margin (inside the 44px
          // padding), so the card's hairline lands exactly on the margin.
          // -4px optical lift centers the 34px medallion on the date-meta
          // first line (line box 16.5px from y=5 → center ~13px).
          <div style={{ position: 'absolute', top: 44, right: 44, zIndex: 5 }}>{mastRight}</div>
        ) : null}

        {folio}

        <section>
          <RailRow meta="Onsdag 9 juli" metaSub="148 dagar · höstprov 26">
            <h1 className="hpc-m3-display" style={{ fontSize: 46, margin: 0, fontStyle: 'italic' }}>
              God dag.
            </h1>
            <div className="hpc-m3-stats">
              <div>
                <div className="hpc-m3-stat-n">1,41</div>
                <div className="hpc-m3-stat-l">prognos av 2,0</div>
              </div>
              <div>
                <div className="hpc-m3-stat-n">6</div>
                <div className="hpc-m3-stat-l">dagar i rad</div>
              </div>
              <div>
                <div className="hpc-m3-stat-n">41</div>
                <div className="hpc-m3-stat-l">min idag</div>
              </div>
            </div>
          </RailRow>
        </section>

        <section style={{ marginTop: 56 }}>
          <RailRow meta="Idag" metaSub="~22 min · uppskattat">
            <h2 className="hpc-m3-h">Dagens plan</h2>
            <PlanList />
          </RailRow>
        </section>
      </div>
    </div>
  )
}

function StageLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  )
}

// ── the shared action set (owner law: no Radera konto, anywhere) ────

function surfaceActions(signOut: () => void): CardAction[] {
  return [
    { key: 'account', label: 'Konto', arrow: true },
    { key: 'export', label: 'Exportera min data', arrow: true },
    { key: 'logout', label: 'Logga ut', onSelect: signOut },
  ]
}

// ═════════════════════════════════════════════════════════════════════
// R2B1 · Kolofonkortet
// ═════════════════════════════════════════════════════════════════════

export function R2B1({
  defaultOpen = true,
  signedOut = false,
}: {
  defaultOpen?: boolean
  signedOut?: boolean
}) {
  const identity = useAccountIdentity()
  const { signOut } = useClerk()
  const actions = surfaceActions(() => void signOut())

  return (
    <div style={{ display: 'flex', gap: 44, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* phone */}
      <div>
        <StageLabel>R2B1 · Phone · 390×844</StageLabel>
        <Artboard shot={signedOut ? 'r2b1-phone-out' : 'r2b1-phone'}>
          <StatusStrip />
          <PhoneScroll>
            <Masthead
              corner={
                signedOut ? (
                  <SignInSlot size={30} />
                ) : (
                  <ColophonMenu
                    identity={identity}
                    actions={actions}
                    defaultOpen={defaultOpen}
                    // Card top sits one 10px lead under the medallion; its
                    // right hairline on the masthead's right text margin.
                    panelStyle={{ top: 44, right: 0 }}
                  />
                )
              }
            />
            <PhonePlan />
          </PhoneScroll>
          <BottomTabs active="home" />
        </Artboard>
      </div>

      {/* desktop */}
      <div style={{ flex: '1 1 900px', minWidth: 0 }}>
        <StageLabel>R2B1 · Desktop · 1440 · card flush with the column margin</StageLabel>
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <DeskFrame shot={signedOut ? 'r2b1-desktop-out' : 'r2b1-desktop'}>
            <DeskNavRail />
            <DeskHomeColumn
              mastRight={
                signedOut ? (
                  <div style={{ marginTop: -4 }}>
                    <SignInSlot />
                  </div>
                ) : (
                  <div style={{ marginTop: -4, position: 'relative' }}>
                    <ColophonMenu
                      identity={identity}
                      actions={actions}
                      defaultOpen={defaultOpen}
                      panelStyle={{ top: 44, right: 0 }}
                    />
                  </div>
                )
              }
            />
          </DeskFrame>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════
// R2B2 · Inskriven — the addressee line
// ═════════════════════════════════════════════════════════════════════

/** The unfolded registration block's shared inner content. */
function RegistrationBody({
  identity,
  onSignOut,
  desktop,
}: {
  identity: { name: string; email: string }
  onSignOut: () => void
  desktop: boolean
}) {
  const footnote: CSSProperties = {
    all: 'unset',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    fontSize: desktop ? 12 : 11,
    letterSpacing: MONO_TRACK,
    textTransform: 'uppercase',
    color: 'var(--ink-2)',
    whiteSpace: 'nowrap',
  }
  return (
    <div className="r2b-unfold-inner" style={{ paddingTop: desktop ? 18 : 14 }}>
      {/* the addressee — the Kallelse's own register */}
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: desktop ? 27 : 22,
          lineHeight: 1.15,
          color: 'var(--ink)',
        }}
      >
        {identity.name}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--muted)',
          marginTop: 5,
        }}
      >
        {identity.email}
      </div>

      {/* form footnotes — one baseline, quiet */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          columnGap: desktop ? 22 : 16,
          rowGap: 8,
          alignItems: 'baseline',
          marginTop: desktop ? 18 : 14,
          paddingBottom: desktop ? 20 : 16,
        }}
      >
        <button type="button" style={footnote}>
          Konto →
        </button>
        <button type="button" style={footnote}>
          Exportera min data →
        </button>
        <button type="button" style={footnote} onClick={onSignOut}>
          Logga ut
        </button>
        <button type="button" style={{ ...footnote, color: 'var(--muted)' }}>
          Inställningar →
        </button>
      </div>
    </div>
  )
}

/** The folio trigger line + in-place unfold. `railChassis` renders the
 *  desktop margin-rail grammar; the phone renders a single furniture line. */
function AddresseeLine({
  identity,
  onSignOut,
  desktop,
  defaultOpen,
  signedOut,
}: {
  identity: { name: string; email: string }
  onSignOut: () => void
  desktop: boolean
  defaultOpen: boolean
  signedOut: boolean
}) {
  const [open, setOpen] = useState(defaultOpen && !signedOut)
  const regionId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const lineStyle: CSSProperties = {
    all: 'unset',
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
    fontFamily: 'var(--font-mono)',
    fontSize: desktop ? 11 : 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--ink-2)',
    padding: desktop ? '0 0 10px' : '0 0 9px',
  }

  if (signedOut) {
    // The unregistered document: same slot, same furniture, an invitation.
    const line = (
      <button type="button" style={lineStyle} aria-label="Logga in">
        <span style={{ color: 'var(--muted)' }}>Ej inskriven</span>
        <span style={{ color: 'var(--accent)', letterSpacing: '0.1em' }}>Logga in →</span>
      </button>
    )
    return desktop ? (
      <RailRow meta="Inskriven" style={{ marginBottom: 34 }}>
        <div style={{ borderBottom: '1px solid var(--hairline)' }}>{line}</div>
      </RailRow>
    ) : (
      <div style={{ borderBottom: '1px solid var(--hairline)', marginBottom: 16 }}>{line}</div>
    )
  }

  const trigger = (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={regionId}
      onClick={() => setOpen((o) => !o)}
      style={lineStyle}
    >
      {/* When the block unfolds, the name leaves the folio line and
          reappears as the serif addressee below — printed once, never
          twice. The collapsed line carries it as page furniture. */}
      <span>
        {desktop ? null : (
          <span style={{ color: 'var(--muted)' }}>Inskriven{open ? '' : ' · '}</span>
        )}
        {open ? null : identity.name}
      </span>
      <span aria-hidden style={{ color: 'var(--muted)', letterSpacing: 0 }}>
        {open ? '▴' : '▾'}
      </span>
    </button>
  )

  const unfold = (
    <div className={`r2b-unfold${open ? ' is-open' : ''}`}>
      <div>
        <section id={regionId} aria-label="Konto">
          <RegistrationBody identity={identity} onSignOut={onSignOut} desktop={desktop} />
        </section>
      </div>
    </div>
  )

  if (desktop) {
    return (
      <RailRow meta="Inskriven" style={{ marginBottom: 34 }}>
        <div style={{ borderBottom: '1px solid var(--hairline)' }}>
          {trigger}
          {unfold}
        </div>
      </RailRow>
    )
  }

  return (
    <div style={{ borderBottom: '1px solid var(--hairline)', marginBottom: 16 }}>
      {trigger}
      {unfold}
    </div>
  )
}

export function R2B2({
  defaultOpen = true,
  signedOut = false,
}: {
  defaultOpen?: boolean
  signedOut?: boolean
}) {
  const identity = useAccountIdentity()
  const { signOut } = useClerk()
  const onSignOut = () => void signOut()

  return (
    <div style={{ display: 'flex', gap: 44, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* phone */}
      <div>
        <StageLabel>R2B2 · Phone · 390×844 · addressee line above the date rail</StageLabel>
        <Artboard shot={signedOut ? 'r2b2-phone-out' : 'r2b2-phone'}>
          <StatusStrip />
          <PhoneScroll>
            <Masthead
              above={
                <AddresseeLine
                  identity={identity}
                  onSignOut={onSignOut}
                  desktop={false}
                  defaultOpen={defaultOpen}
                  signedOut={signedOut}
                />
              }
            />
            <PhonePlan />
          </PhoneScroll>
          <BottomTabs active="home" />
        </Artboard>
      </div>

      {/* desktop */}
      <div style={{ flex: '1 1 900px', minWidth: 0 }}>
        <StageLabel>R2B2 · Desktop · 1440 · the document unfolds in place</StageLabel>
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <DeskFrame shot={signedOut ? 'r2b2-desktop-out' : 'r2b2-desktop'}>
            <DeskNavRail />
            <DeskHomeColumn
              folio={
                <AddresseeLine
                  identity={identity}
                  onSignOut={onSignOut}
                  desktop
                  defaultOpen={defaultOpen}
                  signedOut={signedOut}
                />
              }
            />
          </DeskFrame>
        </div>
      </div>
    </div>
  )
}

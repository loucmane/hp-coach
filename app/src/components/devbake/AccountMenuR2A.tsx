// AccountMenuR2A — round 2, designer A. Two concepts for the account /
// identity surface, both replying to the round-1 critique: a SaaS popover
// was transplanted into a book. Books do not have floating menus — they
// have running heads, bookplates, colophons, and slips of paper laid on
// the page. Both concepts keep round 1's praised craft signals (the
// initials medallion as a printer's device; the INLOGGAD SOM → serif
// name → mono email identity stack) and drop everything the panel and
// owner flagged (window-anchored panels, the rail-spine straddle, the
// trigger-only scrim, and every trace of "Radera konto").
//
// ── R2A1 · Ägarraden ─ the running head that unfolds ─────────────────
//
//   THESIS  A book carries its owner's name as quiet typography at the
//   top of the page — a running head — not as a chrome widget. The
//   reader's own name is typeset small at the head of the reading
//   column. Activating it prints MORE PAGE: an ex libris bookplate
//   unfolds IN-FLOW directly beneath the line, pushing the greeting
//   down. No overlay, no scrim, no popover, nothing floats. Closing it
//   is the same gesture; Esc works too. The bookplate holds the
//   identity stack and three quiet action words (Konto → · Exportera
//   min data · Logga ut) plus one muted Inställningar cross-reference.
//
//   THE RISK  The desktop trigger is the user's NAME set in serif
//   italic — no medallion, no icon, no chevron badge. Text-as-control
//   is a gamble; it is earned here because a running head is exactly
//   how a book states standing identity, and hover articulates it
//   (hairline underline + the ⌄ glyph). The medallion still appears —
//   inside the unfolded plate, where an ex libris stamp belongs.
//
//   REJECTED  Any floating panel (the round-1 failure); a medallion
//   trigger on desktop (redundant next to the typeset name); animating
//   the push (paper doesn't tween its height — the plate settles in
//   with the house fade-rise, the reflow is honest and instant).
//
// ── R2A2 · Kolofonen ─ a colophon slip laid on the page ──────────────
//
//   THESIS  When the surface must sit ABOVE the page (small screens,
//   or the reader's choice), the house already has the object: the
//   ConfirmSheet, "a slip of paper laid on the page." The account
//   surface becomes a COLOPHON — the printer's imprint that states who
//   made this copy — set on that slip. Phone: the bottom sheet, exact
//   ConfirmSheet anatomy (scrim, grab handle, accent top rule). Desktop:
//   the same slip tipped in at the READING COLUMN's right edge — it
//   hangs from the column, never the window, never the rail spine —
//   over a full-frame ink-14% scrim (the house's lightest overlay
//   recipe, covering the whole page, not just the trigger).
//
//   THE RISK  The colophon is CENTERED — medallion, identity stack,
//   asterism (⁂), action words, all on the center axis. Nothing else
//   in the product is centered; the house is strictly rail-set. A
//   colophon, though, is genuinely a centered form, and the slip is an
//   object ON the page, not OF the page grid — it may keep its own
//   typographic law. The asterism is a real printer's ornament doing
//   the divider's job.
//
//   REJECTED  role=menu row anatomy (this is a page, not a menu); the
//   Inställningar cross-reference (the colophon states provenance and
//   exits, nothing more — fewer is better); any hover-wash row chrome.
//
// ── shared law (owner rules, both concepts) ──────────────────────────
//   · "Radera konto" appears NOWHERE — no row, no disabled row, no hint.
//   · Home masthead + desktop mast only; study surfaces stay clean.
//   · Signed out, the same slot renders a mono "Logga in →" word.
//   · Real Clerk identity (useUser) + real signOut(); sample fallback
//     when signed out or before Clerk resolves.
//
// Artboards match round 1's pattern: phone 390×844 + desktop 1440 per
// concept, data-shot attrs for screenshots. No routes here — the
// orchestrator stitches both designers into one route.

import { useClerk, useUser } from '@clerk/clerk-react'
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

// ── tokens / helpers ────────────────────────────────────────────────

const MONO_TRACK = 'var(--font-mono-track, 0.04em)'

const eyebrow: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

const actionWord: CSSProperties = {
  all: 'unset',
  cursor: 'pointer',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  letterSpacing: MONO_TRACK,
  textTransform: 'uppercase',
  color: 'var(--ink-2)',
  whiteSpace: 'nowrap',
}

// The house fade-rise, referenced from the global hpc-m3 keyframes so
// reduced-motion collapses it for free.
const riseIn: CSSProperties = {
  animation: 'hpc-m3-in-y 300ms cubic-bezier(0.22, 1, 0.36, 1) both',
}

// ── identity: the real Clerk user, with a sample fallback ───────────

type Identity = {
  name: string
  email: string
  initials: string
  real: boolean
}

const SAMPLE: Identity = {
  name: 'Loucmane Benali',
  email: 'loucmane@exempel.se',
  initials: 'LB',
  real: false,
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '·'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function useAccountIdentity(): Identity {
  const { user, isLoaded } = useUser()
  if (!isLoaded || !user) return SAMPLE
  // Initials derive from the RESOLVED display name so the medallion
  // always matches the printed name (round 1 derived them from the raw
  // email when Clerk had no name set, printing a mismatched glyph).
  const rawName = user.fullName ?? [user.firstName, user.lastName].filter(Boolean).join(' ') ?? ''
  const name = rawName || SAMPLE.name
  const email = user.primaryEmailAddress?.emailAddress ?? SAMPLE.email
  return { name, email, initials: deriveInitials(name), real: true }
}

// ── the medallion — the printer's device, kept from round 1 ─────────

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
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  )
}

// ── the signed-out affordance — one quiet accent word ───────────────

function LoggaInWord({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: 'unset',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--accent)',
        whiteSpace: 'nowrap',
      }}
    >
      Logga in →
    </button>
  )
}

// ── shared identity stack (eyebrow → serif name → mono email) ───────

function IdentityStack({
  identity,
  centered = false,
  nameSize = 19,
}: {
  identity: Identity
  centered?: boolean
  nameSize?: number
}) {
  return (
    <div style={{ minWidth: 0, textAlign: centered ? 'center' : 'left' }}>
      <div style={{ ...eyebrow, fontSize: 10, marginBottom: 4 }}>Inloggad som</div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: nameSize,
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
          marginTop: 3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {identity.email}
      </div>
    </div>
  )
}

// ── artboard chassis (mirrors round 1 / NavCtaBakeoff) ──────────────

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
        overflow: 'hidden',
        boxShadow: '0 24px 60px -30px rgba(0,0,0,0.4)',
      }}
    >
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
        zIndex: 10,
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

const PLAN = [
  { tag: 'NOG', headline: 'Tillräcklig information', min: 12, verb: 'läs' },
  { tag: 'KVA', headline: 'Kvantitativa jämförelser', min: 10, verb: 'öva' },
]

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

function PhoneStats() {
  return (
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
  )
}

function PhonePlanSection() {
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

// ── the desktop chrome (mirrors NavRail.tsx expanded state) ─────────

const footWordDesk: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

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
          <span style={footWordDesk}>ljus ◐</span>
          <span style={footWordDesk}>historik</span>
          <span style={footWordDesk}>mer →</span>
        </span>
      </div>
    </aside>
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
        boxShadow: '0 24px 60px -30px rgba(0,0,0,0.4)',
      }}
    >
      {children}
    </div>
  )
}

// One rail-set section of the desktop reading column: margin meta |
// spine hairline | content. The 820px column is the anchor for
// EVERYTHING in this file — nothing positions against the window.
function DeskSection({
  meta,
  sub,
  children,
  marginTop = 0,
}: {
  meta: string
  sub?: string
  children: ReactNode
  marginTop?: number
}) {
  return (
    <section style={{ marginTop }}>
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
            lineHeight: 1.5,
          }}
        >
          <strong style={{ display: 'block', color: 'var(--ink-2)', fontWeight: 500 }}>
            {meta}
          </strong>
          {sub}
        </div>
        <div style={{ background: 'var(--hairline)', alignSelf: 'stretch' }} />
        <div style={{ minWidth: 0 }}>{children}</div>
      </div>
    </section>
  )
}

function DeskStats() {
  return (
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
  )
}

function DeskPlanSection() {
  return (
    <DeskSection meta="Idag" sub="~22 min · uppskattat" marginTop={56}>
      <h2 className="hpc-m3-h">Dagens plan</h2>
      <PlanList />
    </DeskSection>
  )
}

// ── Esc-to-close ────────────────────────────────────────────────────

function useEscToClose(open: boolean, close: () => void) {
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
}

/* ═════════════════════════════════════════════════════════════════════
 * R2A1 · Ägarraden — the running head that unfolds in-flow
 * ═══════════════════════════════════════════════════════════════════ */

// The ex libris plate: identity stack beside the medallion (the stamp
// belongs inside the plate, not on the page chrome), then one row of
// quiet action words. Ink rule above, hairline below — the same weight
// pairing the solution lede uses, so the plate reads as a set-off
// passage of the page, not a card.
function ExLibrisPlate({
  identity,
  onSignOut,
  labelId,
  compact = false,
}: {
  identity: Identity
  onSignOut: () => void
  labelId: string
  compact?: boolean
}) {
  return (
    <div
      id={labelId}
      style={{
        ...riseIn,
        borderTop: '1px solid var(--ink)',
        borderBottom: '1px solid var(--hairline)',
        padding: compact ? '16px 0 14px' : '18px 0 16px',
        marginTop: compact ? 12 : 14,
        marginBottom: compact ? 4 : 6,
      }}
    >
      {/* compact (phone): the corner medallion already stamps the page,
       *  so the plate carries only the identity stack — one device per
       *  page. Desktop's trigger is the typeset name, so the stamp
       *  belongs here. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
        {compact ? null : <Medallion initials={identity.initials} size={44} />}
        <IdentityStack identity={identity} nameSize={compact ? 18 : 20} />
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          columnGap: 20,
          rowGap: 10,
          marginTop: compact ? 14 : 16,
          paddingTop: compact ? 12 : 14,
          borderTop: '1px solid var(--hairline-2)',
        }}
      >
        <button type="button" style={actionWord}>
          Konto →
        </button>
        <button type="button" style={actionWord}>
          Exportera min data
        </button>
        <button type="button" style={{ ...actionWord, color: 'var(--muted)' }}>
          Inställningar →
        </button>
        <span style={{ flex: 1 }} />
        <button type="button" onClick={onSignOut} style={actionWord}>
          Logga ut
        </button>
      </div>
    </div>
  )
}

// Desktop trigger: the running head — the owner's name, serif italic,
// with a quiet ⌄ that turns to ⌃ while the plate is open. Hover draws
// a hairline underline; text-as-control, articulated.
function RunningHead({
  identity,
  open,
  toggle,
  ariaControls,
}: {
  identity: Identity
  open: boolean
  toggle: () => void
  ariaControls: string
}) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={toggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-expanded={open}
      aria-controls={ariaControls}
      aria-label="Konto"
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 7,
        paddingBottom: 2,
        borderBottom: `1px solid ${hover || open ? 'var(--hairline)' : 'transparent'}`,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 14.5,
          color: 'var(--ink-2)',
          whiteSpace: 'nowrap',
        }}
      >
        {identity.name}
      </span>
      <span
        aria-hidden
        style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}
      >
        {open ? '⌃' : '⌄'}
      </span>
    </button>
  )
}

export function R2A1({
  defaultOpen = true,
  signedOut = false,
}: {
  defaultOpen?: boolean
  signedOut?: boolean
}) {
  const identity = useAccountIdentity()
  const { signOut } = useClerk()
  const doSignOut = () => void signOut()
  const [open, setOpen] = useState(defaultOpen && !signedOut)
  const close = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen((o) => !o), [])
  const plateIdPhone = useId()
  const plateIdDesk = useId()
  useEscToClose(open, close)
  const isOpen = open && !signedOut

  return (
    <div style={{ display: 'flex', gap: 44, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* phone — medallion in the masthead corner; the plate unfolds
       *  in-flow directly beneath the date row, pushing the greeting
       *  down. Nothing floats, nothing dims. */}
      <div>
        <StageLabel>Phone · 390×844 · plate unfolds in-flow, no overlay</StageLabel>
        <Artboard shot="r2a1-phone">
          <StatusStrip />
          <PhoneScroll>
            <header style={{ padding: '4px 22px 0' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={eyebrow}>
                  <strong style={{ color: 'var(--ink-2)' }}>Onsdag 9 juli</strong> · 148 dagar ·
                  höstprov 26
                </div>
                {signedOut ? (
                  <LoggaInWord />
                ) : (
                  <button
                    type="button"
                    onClick={toggle}
                    aria-expanded={isOpen}
                    aria-controls={plateIdPhone}
                    aria-label="Konto"
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      marginTop: -2,
                    }}
                  >
                    <Medallion initials={identity.initials} size={30} />
                  </button>
                )}
              </div>

              {isOpen ? (
                <ExLibrisPlate
                  identity={identity}
                  onSignOut={doSignOut}
                  labelId={plateIdPhone}
                  compact
                />
              ) : null}

              <h1
                className="hpc-m3-display"
                style={{ fontSize: 38, margin: '14px 0 0', fontStyle: 'italic' }}
              >
                God dag.
              </h1>
              <PhoneStats />
            </header>
            <PhonePlanSection />
          </PhoneScroll>
          <BottomTabs active="home" />
        </Artboard>
      </div>

      {/* desktop — the running head at the head of the reading column;
       *  the plate unfolds beneath it, greeting and plan reflow down. */}
      <div style={{ flex: '1 1 1440px', minWidth: 0 }}>
        <StageLabel>Desktop · 1440 · running head, typeset name as the trigger</StageLabel>
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <DeskFrame shot="r2a1-desktop">
            <DeskNavRail />
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 44px 64px' }}>
                <DeskSection meta="Onsdag 9 juli" sub="148 dagar · höstprov 26">
                  {/* the running head — right-set at the head of the column */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'baseline',
                      minHeight: 22,
                    }}
                  >
                    {signedOut ? (
                      <LoggaInWord />
                    ) : (
                      <RunningHead
                        identity={identity}
                        open={isOpen}
                        toggle={toggle}
                        ariaControls={plateIdDesk}
                      />
                    )}
                  </div>

                  {isOpen ? (
                    <ExLibrisPlate
                      identity={identity}
                      onSignOut={doSignOut}
                      labelId={plateIdDesk}
                    />
                  ) : null}

                  <h1
                    className="hpc-m3-display"
                    style={{ fontSize: 46, margin: '6px 0 0', fontStyle: 'italic' }}
                  >
                    God dag.
                  </h1>
                  <DeskStats />
                </DeskSection>
                <DeskPlanSection />
              </div>
            </div>
          </DeskFrame>
        </div>
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════════════════════════════════
 * R2A2 · Kolofonen — a colophon slip laid on the page
 * ═══════════════════════════════════════════════════════════════════ */

// The colophon body — the only centered composition in the house,
// because a colophon is a centered form and the slip keeps its own
// typographic law. The asterism (⁂) is the printer's divider.
function ColophonBody({
  identity,
  onSignOut,
  onDone,
}: {
  identity: Identity
  onSignOut: () => void
  onDone: () => void
}) {
  const firstRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    firstRef.current?.focus()
  }, [])
  // width 100% + explicit textAlign: an `all: unset` button shrink-wraps
  // even at display:block, which would fake-center (box left, text left).
  const rowStyle: CSSProperties = {
    ...actionWord,
    display: 'block',
    width: '100%',
    textAlign: 'center',
    padding: '9px 0',
  }
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Medallion initials={identity.initials} size={44} />
      </div>
      <div style={{ marginTop: 14 }}>
        <IdentityStack identity={identity} centered />
      </div>
      <div
        aria-hidden
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          color: 'var(--muted-2)',
          letterSpacing: '0.35em',
          margin: '16px 0 8px',
          textIndent: '0.35em',
        }}
      >
        ⁂
      </div>
      <button ref={firstRef} type="button" style={rowStyle} onClick={onDone}>
        Konto →
      </button>
      <button type="button" style={rowStyle} onClick={onDone}>
        Exportera min data
      </button>
      <div
        aria-hidden
        style={{ width: 56, height: 1, background: 'var(--hairline-2)', margin: '8px auto' }}
      />
      <button type="button" style={rowStyle} onClick={onSignOut}>
        Logga ut
      </button>
    </div>
  )
}

export function R2A2({
  defaultOpen = true,
  signedOut = false,
}: {
  defaultOpen?: boolean
  signedOut?: boolean
}) {
  const identity = useAccountIdentity()
  const { signOut } = useClerk()
  const doSignOut = () => void signOut()
  const [open, setOpen] = useState(defaultOpen && !signedOut)
  const close = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen((o) => !o), [])
  const sheetId = useId()
  const slipId = useId()
  useEscToClose(open, close)
  const isOpen = open && !signedOut

  // The page-dimming scrim — the house's LIGHTEST overlay recipe,
  // covering the entire frame (round 1's scrim tinted only the trigger).
  const scrim: CSSProperties = {
    position: 'absolute',
    inset: 0,
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    background: 'color-mix(in oklch, var(--ink) 14%, transparent)',
  }

  return (
    <div style={{ display: 'flex', gap: 44, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* phone — the ConfirmSheet idiom: a slip of paper laid on the
       *  page, rising from the foot. Grab handle, accent top rule. */}
      <div>
        <StageLabel>Phone · 390×844 · colophon on the house bottom sheet</StageLabel>
        <Artboard shot="r2a2-phone">
          <StatusStrip />
          <PhoneScroll>
            <header style={{ padding: '4px 22px 0' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={eyebrow}>
                  <strong style={{ color: 'var(--ink-2)' }}>Onsdag 9 juli</strong> · 148 dagar ·
                  höstprov 26
                </div>
                {signedOut ? (
                  <LoggaInWord />
                ) : (
                  <button
                    type="button"
                    onClick={toggle}
                    aria-haspopup="dialog"
                    aria-expanded={isOpen}
                    aria-controls={sheetId}
                    aria-label="Konto"
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      marginTop: -2,
                    }}
                  >
                    <Medallion initials={identity.initials} size={30} />
                  </button>
                )}
              </div>
              <h1
                className="hpc-m3-display"
                style={{ fontSize: 38, margin: '14px 0 0', fontStyle: 'italic' }}
              >
                God dag.
              </h1>
              <PhoneStats />
            </header>
            <PhonePlanSection />
          </PhoneScroll>
          <BottomTabs active="home" />

          {isOpen ? (
            <div style={{ position: 'absolute', inset: 0, zIndex: 60 }}>
              <button type="button" aria-label="Stäng" onClick={close} style={scrim} />
              <div
                id={sheetId}
                role="dialog"
                aria-modal="true"
                aria-label="Konto"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'var(--panel)',
                  borderTop: '1px solid var(--accent)',
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: '18px 22px 34px',
                  boxShadow: '0 -20px 50px -24px rgba(0,0,0,0.5)',
                  ...riseIn,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 4,
                    borderRadius: 999,
                    background: 'var(--hairline)',
                    margin: '0 auto 20px',
                  }}
                />
                <ColophonBody identity={identity} onSignOut={doSignOut} onDone={close} />
              </div>
            </div>
          ) : null}
        </Artboard>
      </div>

      {/* desktop — the same slip tipped in at the reading column's
       *  right edge. The overlay layer reproduces the column geometry
       *  (max-width 820, centered) so the slip hangs from the COLUMN,
       *  never the window, never the rail spine. */}
      <div style={{ flex: '1 1 1440px', minWidth: 0 }}>
        <StageLabel>Desktop · 1440 · slip tipped in at the column edge, ink-14% scrim</StageLabel>
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <DeskFrame shot="r2a2-desktop">
            <DeskNavRail />
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', position: 'relative' }}>
              <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 44px 64px' }}>
                <DeskSection meta="Onsdag 9 juli" sub="148 dagar · höstprov 26">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      minHeight: 30,
                    }}
                  >
                    {signedOut ? (
                      <LoggaInWord />
                    ) : (
                      <button
                        type="button"
                        onClick={toggle}
                        aria-haspopup="dialog"
                        aria-expanded={isOpen}
                        aria-controls={slipId}
                        aria-label="Konto"
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          borderRadius: '50%',
                          display: 'inline-flex',
                        }}
                      >
                        <Medallion initials={identity.initials} size={30} />
                      </button>
                    )}
                  </div>
                  <h1
                    className="hpc-m3-display"
                    style={{ fontSize: 46, margin: '6px 0 0', fontStyle: 'italic' }}
                  >
                    God dag.
                  </h1>
                  <DeskStats />
                </DeskSection>
                <DeskPlanSection />
              </div>

              {isOpen ? (
                <div style={{ position: 'absolute', inset: 0, zIndex: 60 }}>
                  {/* full-content-area scrim — dims the whole page */}
                  <button type="button" aria-label="Stäng" onClick={close} style={scrim} />
                  {/* column-geometry layer: the slip anchors to the
                   *  820px reading column's right edge */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: 820,
                        margin: '0 auto',
                        padding: '0 44px',
                        position: 'relative',
                        height: '100%',
                      }}
                    >
                      <div
                        id={slipId}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Konto"
                        style={{
                          position: 'absolute',
                          top: 88,
                          right: 44,
                          width: 292,
                          pointerEvents: 'auto',
                          background: 'var(--panel)',
                          border: '1px solid var(--hairline)',
                          borderTop: '1px solid var(--accent)',
                          borderRadius: 'calc(var(--radius) * 0.45)',
                          padding: '24px 24px 18px',
                          boxShadow: '0 24px 56px -28px rgba(0,0,0,0.45)',
                          ...riseIn,
                        }}
                      >
                        <ColophonBody identity={identity} onSignOut={doSignOut} onDone={close} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </DeskFrame>
        </div>
      </div>
    </div>
  )
}

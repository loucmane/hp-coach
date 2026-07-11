// AccountMenuBakeoff — WHERE does the account/identity surface live, and
// how does its menu feel? The product currently has NO logout button and
// no identity surface at all. Incoming needs: Logga ut (now), Radera mitt
// konto (P1), Exportera min data (exists, buried in Avancerat),
// Prenumeration (P3).
//
// Settled before this bake-off (owner + prior panel): the PROFILE MENU
// carries account/identity actions; Mer/Inställningar keeps product prefs
// (palette / mode / coach / verktyg). This bake-off decides the two open
// axes: WHERE the avatar lives, and HOW the menu feels.
//
// Three placements, each rendered as a real 390px phone + 1440px desktop
// artboard in the M3 "Boksidan" idiom (hairlines, mono eyebrows, serif
// italic display, cobalt --accent used sparingly). No product code
// changes — everything lives under this component + the
// /dev/account-menu-bakeoff route.
//
//   V1 · Byline        a small INITIALS MEDALLION top-right of the phone
//                      masthead and the desktop content mast. Tap → a
//                      compact account menu; the Mer entry is UNCHANGED.
//   V2 · Ersätter Mer  the medallion REPLACES the Mer entry (desktop rail
//                      foot; phone masthead corner). Its menu carries BOTH
//                      account actions AND an Inställningar entry — the
//                      owner's original instinct.
//   V3 · Konto-rad     no floating avatar. A person-icon "Konto" word
//                      joins the desktop rail foot next to "mer →"; on the
//                      phone an identity block sits at the TOP of /mer.
//                      Least chrome — account lives where settings live,
//                      but clearly separated as an identity block.
//
// The MEDALLION, not a photo. Boksidan is a printed-page idiom — letterpress
// rules, mono captions, serif display. A glossy circular photo avatar is a
// SaaS convention that fights that idiom; an initials monogram inside a
// hairline ring reads like an embossed mark on a document (and it renders
// identically whether or not the account has a photo). The menu renders the
// REAL signed-in Clerk user (useUser); "Logga ut" calls the REAL
// signOut() — this is a live menu on live auth, but only on THIS dev route.

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

// ── identity: the real Clerk user, with a sample fallback ───────────
//
// The menu should render the REAL signed-in user. When the bake-off is
// opened signed-out (or before Clerk resolves) we fall back to a sample
// identity so the artboards still show a populated menu — the fallback is
// labelled in the route caption so no one mistakes it for real data.

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

export function useAccountIdentity(): Identity {
  const { user, isLoaded } = useUser()
  if (!isLoaded || !user) return SAMPLE
  const name =
    user.fullName ?? [user.firstName, user.lastName].filter(Boolean).join(' ') ?? SAMPLE.name
  const email = user.primaryEmailAddress?.emailAddress ?? SAMPLE.email
  const initials = deriveInitials(name || email)
  return { name: name || SAMPLE.name, email, initials, real: true }
}

// ── the medallion ───────────────────────────────────────────────────
//
// A serif monogram inside a hairline ring — the house's answer to an
// avatar. Muted ink on the panel; the ring is a single hairline, echoing
// the plan-ordinal + rail-spine hairlines everywhere else in Boksidan.

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

// ── the menu body (variant-parametric) ──────────────────────────────

type MenuRow = {
  key: string
  label: string
  onSelect?: () => void
  // A quiet trailing note (e.g. "kommer") that also disables the row.
  soon?: boolean
  // Trailing glyph (→) for navigation-style rows.
  arrow?: boolean
}

type MenuAnatomy = {
  // The account-action rows (Logga ut, Konto, Exportera, Radera konto).
  rows: MenuRow[]
  // V2: Inställningar as a full in-menu row (Mer is gone).
  settingsRow?: MenuRow
  // V1: Inställningar as a quiet footer link (Mer still exists elsewhere).
  settingsFooterLink?: boolean
}

/** The popover panel. role=menu, Swedish aria-label, first item autofocused,
 *  arrow/Home/End roving, Esc handled by the parent scrim wrapper. */
function AccountMenuPanel({
  identity,
  anatomy,
  labelId,
  style,
}: {
  identity: Identity
  anatomy: MenuAnatomy
  labelId: string
  style?: CSSProperties
}) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Autofocus the first enabled menuitem when the menu opens.
    const first = listRef.current?.querySelector<HTMLButtonElement>(
      'button[role="menuitem"]:not([disabled])',
    )
    first?.focus()
  }, [])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return
    const items = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>(
        'button[role="menuitem"]:not([disabled])',
      ) ?? [],
    )
    if (items.length === 0) return
    e.preventDefault()
    const idx = items.indexOf(document.activeElement as HTMLButtonElement)
    let next = idx
    if (e.key === 'ArrowDown') next = idx < 0 ? 0 : (idx + 1) % items.length
    else if (e.key === 'ArrowUp') next = idx <= 0 ? items.length - 1 : idx - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    items[next]?.focus()
  }

  return (
    <div
      role="menu"
      aria-labelledby={labelId}
      onKeyDown={onKeyDown}
      style={{
        width: 268,
        background: 'var(--panel)',
        border: '1px solid var(--hairline)',
        borderRadius: 'calc(var(--radius) * 0.55)',
        boxShadow: '0 20px 50px -24px rgba(0,0,0,0.45)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* identity header */}
      <div
        id={labelId}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '15px 16px',
          borderBottom: '1px solid var(--hairline)',
        }}
      >
        <Medallion initials={identity.initials} size={38} />
        <div style={{ minWidth: 0 }}>
          <div style={{ ...eyebrow, fontSize: 10, marginBottom: 3 }}>Inloggad som</div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
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

      {/* account-action rows */}
      <div ref={listRef} style={{ padding: '6px 0' }}>
        {anatomy.rows.map((row) => (
          <MenuItem key={row.key} row={row} />
        ))}

        {anatomy.settingsRow ? (
          <>
            <div style={{ height: 1, background: 'var(--hairline)', margin: '6px 0' }} />
            <MenuItem row={anatomy.settingsRow} />
          </>
        ) : null}
      </div>

      {anatomy.settingsFooterLink ? (
        <div
          style={{
            borderTop: '1px solid var(--hairline)',
            padding: '10px 16px 12px',
          }}
        >
          <button
            type="button"
            role="menuitem"
            style={{
              all: 'unset',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: MONO_TRACK,
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Inställningar →
          </button>
        </div>
      ) : null}
    </div>
  )
}

// One menu row. Enabled rows are quiet mono-ui labels with a hover wash;
// "soon" rows are disabled and carry a muted "kommer" tag (the Radera-konto
// placeholder). Nothing here is danger-red: leaving is routine, and the
// destructive P1 row stays in the house's muted register until it is built.
function MenuItem({ row }: { row: MenuRow }) {
  const [hover, setHover] = useState(false)
  const disabled = row.soon
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={row.onSelect}
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
        padding: '9px 16px',
        cursor: disabled ? 'default' : 'pointer',
        background: hover && !disabled ? 'var(--panel-2)' : 'transparent',
        color: disabled ? 'var(--muted)' : 'var(--ink-2)',
        // Menu rows are UI chrome, not editorial body — the Inter Tight UI
        // face (not the Newsreader serif) keeps word spaces legible at this
        // size and reads as a control surface.
        fontFamily: 'var(--font-ui)',
        // Inter Tight's default space sits tight next to a short trailing
        // word ("Logga ut"); a hair of word-spacing keeps the label reading
        // as two words.
        letterSpacing: '0',
        wordSpacing: '0.08em',
        fontSize: 14,
      }}
    >
      <span>{row.label}</span>
      {row.soon ? (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          kommer
        </span>
      ) : row.arrow ? (
        <span aria-hidden style={{ color: 'var(--muted)', fontSize: 13 }}>
          →
        </span>
      ) : null}
    </button>
  )
}

// ── the open/close wrapper: trigger + scrim + Esc + positioned panel ─
//
// Self-contained so each artboard hosts one live menu. The scrim is
// ABSOLUTE within the artboard (the artboard sets position:relative) so a
// bake-off page with many artboards never throws one global overlay; each
// menu dims only its own frame. Esc and a scrim click both close.

function AccountMenu({
  identity,
  anatomy,
  trigger,
  panelStyle,
  defaultOpen = false,
}: {
  identity: Identity
  anatomy: MenuAnatomy
  // Renders the trigger; receives open state + toggle + aria props.
  trigger: (p: {
    open: boolean
    toggle: () => void
    triggerProps: {
      'aria-haspopup': 'menu'
      'aria-expanded': boolean
      'aria-controls': string
    }
  }) => ReactNode
  // Where the panel sits relative to the trigger's positioned container.
  panelStyle: CSSProperties
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const menuId = useId()
  const labelId = useId()
  const toggle = useCallback(() => setOpen((o) => !o), [])
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
    <div style={{ position: 'relative' }}>
      {trigger({
        open,
        toggle,
        triggerProps: {
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          'aria-controls': menuId,
        },
      })}
      {open ? (
        <>
          {/* artboard-local scrim */}
          <button
            type="button"
            aria-label="Stäng menyn"
            onClick={close}
            style={{
              position: 'absolute',
              inset: 0,
              border: 'none',
              cursor: 'default',
              background: 'color-mix(in oklch, var(--ink) 14%, transparent)',
              zIndex: 40,
            }}
          />
          <div id={menuId} style={{ position: 'absolute', zIndex: 41, ...panelStyle }}>
            <AccountMenuPanel identity={identity} anatomy={anatomy} labelId={labelId} />
          </div>
        </>
      ) : null}
    </div>
  )
}

// ── shared artboard chassis (mirrors devbake/NavCtaBakeoff) ─────────

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
        // position:relative so the account menu's absolute scrim covers
        // exactly this frame; overflow visible so a downward menu can spill
        // past the masthead without being clipped by the phone bezel.
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
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

// The Home masthead — the real date-rail + italic greeting + stats row.
// `corner` slots the account medallion into the top-right of the rail
// (V1 / V2's phone placement).
function Masthead({ corner }: { corner?: ReactNode }) {
  return (
    <header style={{ padding: '4px 22px 0' }}>
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
        {corner ? <div style={{ marginTop: -2 }}>{corner}</div> : null}
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

function RailSection({ meta, children }: { meta: ReactNode; children: ReactNode }) {
  return (
    <section
      style={{ padding: '22px 22px 0', marginTop: 22, borderTop: '1px solid var(--hairline)' }}
    >
      <div style={{ ...eyebrow, marginBottom: 12 }}>{meta}</div>
      {children}
    </section>
  )
}

const PLAN = [
  { tag: 'NOG', headline: 'Tillräcklig information', min: 12, verb: 'läs' },
  { tag: 'KVA', headline: 'Kvantitativa jämförelser', min: 10, verb: 'öva' },
]

function PlanCard() {
  const total = PLAN.reduce((s, r) => s + r.min, 0)
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
    </RailSection>
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

// ── the desktop chrome (mirrors NavRail.tsx expanded state) ─────────

const footWordDesk: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

// The desktop NavRail. `foot` overrides the "ljus ◐ · historik · mer →"
// row (V2 replaces "mer →" with the medallion; V3 adds a "Konto" word).
function DeskNavRail({ foot }: { foot?: ReactNode }) {
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
        {foot ?? (
          <span style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
            <span style={footWordDesk}>ljus ◐</span>
            <span style={footWordDesk}>historik</span>
            <span style={footWordDesk}>mer →</span>
          </span>
        )}
      </div>
    </aside>
  )
}

// A slice of the desktop Home content column — greeting + stats + plan —
// so the medallion/menu is judged in the real Boksidan reading column.
// `topRight` slots V1's byline medallion into the content mast corner.
function DeskHomeColumn({ topRight }: { topRight?: ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', position: 'relative' }}>
      {topRight ? (
        <div style={{ position: 'absolute', top: 26, right: 32, zIndex: 5 }}>{topRight}</div>
      ) : null}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 44px 64px' }}>
        <section>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '128px 1px 1fr',
              columnGap: 28,
            }}
          >
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
                Onsdag 9 juli
              </strong>
              148 dagar · höstprov 26
            </div>
            <div style={{ background: 'var(--hairline)', alignSelf: 'stretch' }} />
            <div style={{ minWidth: 0 }}>
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
                  <div className="hpc-m3-stat-n">6</div>
                  <div className="hpc-m3-stat-l">dagar i rad</div>
                </div>
                <div>
                  <div className="hpc-m3-stat-n">41</div>
                  <div className="hpc-m3-stat-l">min idag</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 56 }}>
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
                Idag
              </strong>
              ~22 min · uppskattat
            </div>
            <div style={{ background: 'var(--hairline)', alignSelf: 'stretch' }} />
            <div style={{ minWidth: 0 }}>
              <h2 className="hpc-m3-h">Dagens plan</h2>
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
            </div>
          </div>
        </section>
      </div>
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
        // position:relative so the account menu scrim (V1's absolute
        // overlay) covers exactly this window.
        position: 'relative',
        boxShadow: '0 24px 60px -30px rgba(0,0,0,0.4)',
      }}
    >
      {children}
    </div>
  )
}

// ── per-variant menu anatomy ────────────────────────────────────────

function accountRows(signOut: () => void): MenuRow[] {
  return [
    { key: 'logout', label: 'Logga ut', onSelect: signOut },
    { key: 'account', label: 'Konto', arrow: true },
    { key: 'export', label: 'Exportera min data', arrow: true },
    { key: 'delete', label: 'Radera konto', soon: true },
  ]
}

// ── V1 · Byline ─────────────────────────────────────────────────────

export function VariantByline({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const identity = useAccountIdentity()
  const { signOut } = useClerk()
  const anatomy: MenuAnatomy = {
    rows: accountRows(() => void signOut()),
    settingsFooterLink: true,
  }
  return (
    <div style={{ display: 'flex', gap: 44, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* phone */}
      <div>
        <StageLabel>PHONE · 390×844</StageLabel>
        <Artboard shot="v1-phone">
          <StatusStrip />
          <PhoneScroll>
            <Masthead
              corner={
                <AccountMenu
                  identity={identity}
                  anatomy={anatomy}
                  defaultOpen={defaultOpen}
                  panelStyle={{ top: 44, right: 0 }}
                  trigger={({ toggle, triggerProps }) => (
                    <MedallionButton
                      {...triggerProps}
                      onClick={toggle}
                      initials={identity.initials}
                    />
                  )}
                />
              }
            />
            <PlanCard />
          </PhoneScroll>
          <BottomTabs active="home" />
        </Artboard>
      </div>

      {/* desktop */}
      <div style={{ flex: '1 1 900px', minWidth: 0 }}>
        <StageLabel>DESKTOP · 1440 · medallion top-right, Mer unchanged</StageLabel>
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <DeskFrame shot="v1-desktop">
            <DeskNavRail />
            <DeskHomeColumn
              topRight={
                <AccountMenu
                  identity={identity}
                  anatomy={anatomy}
                  defaultOpen={defaultOpen}
                  panelStyle={{ top: 46, right: 0 }}
                  trigger={({ toggle, triggerProps }) => (
                    <MedallionButton
                      {...triggerProps}
                      onClick={toggle}
                      initials={identity.initials}
                    />
                  )}
                />
              }
            />
          </DeskFrame>
        </div>
      </div>
    </div>
  )
}

// ── V2 · Ersätter Mer ───────────────────────────────────────────────

export function VariantErsatterMer({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const identity = useAccountIdentity()
  const { signOut } = useClerk()
  const anatomy: MenuAnatomy = {
    rows: accountRows(() => void signOut()),
    settingsRow: { key: 'settings', label: 'Inställningar', arrow: true },
  }
  return (
    <div style={{ display: 'flex', gap: 44, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* phone — medallion in the masthead corner (where Mer would surface) */}
      <div>
        <StageLabel>PHONE · 390×844 · medallion carries settings too</StageLabel>
        <Artboard shot="v2-phone">
          <StatusStrip />
          <PhoneScroll>
            <Masthead
              corner={
                <AccountMenu
                  identity={identity}
                  anatomy={anatomy}
                  defaultOpen={defaultOpen}
                  panelStyle={{ top: 44, right: 0 }}
                  trigger={({ toggle, triggerProps }) => (
                    <MedallionButton
                      {...triggerProps}
                      onClick={toggle}
                      initials={identity.initials}
                    />
                  )}
                />
              }
            />
            <PlanCard />
          </PhoneScroll>
          <BottomTabs active="home" />
        </Artboard>
      </div>

      {/* desktop — medallion REPLACES "mer →" in the rail foot */}
      <div style={{ flex: '1 1 900px', minWidth: 0 }}>
        <StageLabel>DESKTOP · 1440 · medallion replaces "mer →" in the rail foot</StageLabel>
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <DeskFrame shot="v2-desktop">
            <DeskNavRail
              foot={
                <span style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <span style={footWordDesk}>ljus ◐</span>
                  <span style={footWordDesk}>historik</span>
                  <AccountMenu
                    identity={identity}
                    anatomy={anatomy}
                    defaultOpen={defaultOpen}
                    panelStyle={{ bottom: 40, left: 0 }}
                    trigger={({ toggle, triggerProps }) => (
                      <button
                        type="button"
                        {...triggerProps}
                        onClick={toggle}
                        aria-label="Konto"
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 7,
                        }}
                      >
                        <Medallion initials={identity.initials} size={24} />
                        <span style={footWordDesk}>konto</span>
                      </button>
                    )}
                  />
                </span>
              }
            />
            <DeskHomeColumn />
          </DeskFrame>
        </div>
      </div>
    </div>
  )
}

// ── V3 · Konto-rad ──────────────────────────────────────────────────

export function VariantKontoRad({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const identity = useAccountIdentity()
  const { signOut } = useClerk()
  const anatomy: MenuAnatomy = { rows: accountRows(() => void signOut()) }
  return (
    <div style={{ display: 'flex', gap: 44, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* phone — an identity block at the TOP of /mer (no floating avatar) */}
      <div>
        <StageLabel>PHONE · 390×844 · identity block at the top of /mer</StageLabel>
        <Artboard shot="v3-phone">
          <StatusStrip />
          <PhoneScroll>
            <MerTopIdentity identity={identity} onSignOut={() => void signOut()} />
          </PhoneScroll>
          <BottomTabs active="progress" />
        </Artboard>
      </div>

      {/* desktop — a person-icon "Konto" word joins the rail foot next to mer */}
      <div style={{ flex: '1 1 900px', minWidth: 0 }}>
        <StageLabel>DESKTOP · 1440 · "Konto" word joins the rail foot, next to "mer →"</StageLabel>
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <DeskFrame shot="v3-desktop">
            <DeskNavRail
              foot={
                <span style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
                    <span style={footWordDesk}>ljus ◐</span>
                    <span style={footWordDesk}>historik</span>
                    <span style={footWordDesk}>mer →</span>
                  </span>
                  <AccountMenu
                    identity={identity}
                    anatomy={anatomy}
                    defaultOpen={defaultOpen}
                    panelStyle={{ bottom: 30, left: 0 }}
                    trigger={({ toggle, triggerProps }) => (
                      <button
                        type="button"
                        {...triggerProps}
                        onClick={toggle}
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 7,
                          ...footWordDesk,
                        }}
                      >
                        <User s={13} />
                        konto
                      </button>
                    )}
                  />
                </span>
              }
            />
            <DeskHomeColumn />
          </DeskFrame>
        </div>
      </div>
    </div>
  )
}

// The /mer top identity block (V3 phone): a byline, not a menu — account
// actions live inline where settings already live, clearly separated.
function MerTopIdentity({ identity, onSignOut }: { identity: Identity; onSignOut: () => void }) {
  return (
    <div style={{ padding: '10px 22px 0' }}>
      <div style={eyebrow}>Mer</div>
      <h1
        className="hpc-m3-display"
        style={{ fontSize: 34, margin: '12px 0 0', fontStyle: 'italic' }}
      >
        Inställningar
      </h1>

      {/* the identity block — first section on /mer, a hairline-bounded
       *  byline that stands apart from the product-pref sections below. */}
      <section
        style={{
          marginTop: 24,
          border: '1px solid var(--hairline)',
          borderRadius: 'calc(var(--radius) * 0.5)',
          padding: '16px 18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <Medallion initials={identity.initials} size={40} />
          <div style={{ minWidth: 0 }}>
            <div style={{ ...eyebrow, fontSize: 10, marginBottom: 3 }}>Inloggad som</div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 17,
                color: 'var(--ink)',
                lineHeight: 1.2,
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
              }}
            >
              {identity.email}
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            columnGap: 18,
            rowGap: 8,
            marginTop: 16,
            paddingTop: 14,
            borderTop: '1px solid var(--hairline)',
            alignItems: 'baseline',
          }}
        >
          <button
            type="button"
            onClick={onSignOut}
            style={{
              all: 'unset',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: MONO_TRACK,
              textTransform: 'uppercase',
              color: 'var(--ink-2)',
              whiteSpace: 'nowrap',
            }}
          >
            Logga ut
          </button>
          <button
            type="button"
            style={{
              all: 'unset',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: MONO_TRACK,
              textTransform: 'uppercase',
              color: 'var(--muted)',
              whiteSpace: 'nowrap',
            }}
          >
            Exportera min data →
          </button>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              whiteSpace: 'nowrap',
            }}
          >
            Radera konto · kommer
          </span>
        </div>
      </section>

      {/* the existing product-pref sections continue below, unchanged */}
      <section style={{ marginTop: 22, borderTop: '1px solid var(--hairline)', paddingTop: 18 }}>
        <div style={{ ...eyebrow, marginBottom: 10 }}>Inställningar</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--muted)' }}>
          Palett · Läge · Coach …
        </div>
      </section>
    </div>
  )
}

// ── the medallion trigger button ────────────────────────────────────

function MedallionButton({
  initials,
  onClick,
  ...aria
}: {
  initials: string
  onClick: () => void
  'aria-haspopup'?: 'menu'
  'aria-expanded'?: boolean
  'aria-controls'?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Kontomeny"
      {...aria}
      style={{ all: 'unset', cursor: 'pointer', borderRadius: '50%', display: 'inline-flex' }}
    >
      <Medallion initials={initials} size={34} />
    </button>
  )
}

// ── bits ────────────────────────────────────────────────────────────

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

export function Caption({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: MONO_TRACK,
        color: 'var(--muted)',
        lineHeight: 1.5,
        maxWidth: 620,
        marginTop: 14,
      }}
    >
      {children}
    </div>
  )
}

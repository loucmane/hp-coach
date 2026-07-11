// AccountMenu — the production account / identity surface. Port of the
// bake-off winner R2B1 "Kolofonkortet" (devbake/AccountMenuR2B.tsx),
// with the three jury-mandated grafts folded in:
//
//   GRAFT 1 — on the phone the card CONTENT rides the house bottom sheet
//     (ConfirmSheet anatomy: fixed scrim, grab handle, accent TOP rule —
//     the accent rule is the SHEET's law, not the card's). B1's left-
//     aligned content is unchanged inside it.
//   GRAFT 2 — initials derive from the RESOLVED display name (not the raw
//     email), so the medallion glyph always matches the printed name.
//     Trigger has real hover / focus-visible / open articulation.
//   GRAFT 3 — signed-out shows the dashed un-stamped ring beside an ACCENT
//     "Logga in →" that routes to /sign-in (same slot, both breakpoints).
//
// Owner law honored throughout: "Radera konto" appears NOWHERE. Surface
// actions are Konto → /konto, Exportera min data (the real export
// download), Logga ut (real signOut → /sign-in), and a quiet Inställningar
// cross-reference → /mer. Identity chrome exists ONLY on Home.
//
// Desktop: a tipped-in colophon card anchored to the reading COLUMN (its
// caller places it inside the column, never the window/rail-spine). The
// scrim is a genuinely fixed, PORTALED ink-14% dim (no translateZ
// containment hack). The card clamps into the viewport on short windows.
//
// Motion lives in namespaced .hpc-acct-* classes in index.css, so the
// global prefers-reduced-motion guard collapses it for free.

import { useClerk, useUser } from '@clerk/clerk-react'
import { useNavigate } from '@tanstack/react-router'
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

import { downloadExport, useExportData } from '@/api/hooks/useDataExport'
import { useViewport } from '@/hooks/useViewport'

// ── registers ────────────────────────────────────────────────────────

const MONO_TRACK = 'var(--font-mono-track, 0.04em)'

const eyebrow: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

// The page-furniture mono word — the register of "mer →", "historik".
const monoWord: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

// ── identity: the real Clerk user, with a sample fallback ────────────

export type Identity = {
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

/** Initials from the RESOLVED display name (GRAFT 2 — round 1 derived
 *  them from the raw email when Clerk had no name set, printing a glyph
 *  that didn't match the name). One part → one letter; two+ → first+last. */
export function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '·'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** The real signed-in Clerk user; SAMPLE while Clerk loads or in previews
 *  without a session. */
export function useAccountIdentity(): Identity {
  const { user, isLoaded } = useUser()
  if (!isLoaded || !user) return SAMPLE
  const rawName = user.fullName ?? [user.firstName, user.lastName].filter(Boolean).join(' ') ?? ''
  const name = rawName || SAMPLE.name
  const email = user.primaryEmailAddress?.emailAddress ?? SAMPLE.email
  return { name, email, initials: deriveInitials(name), real: true }
}

// ── the medallion — the printer's device ─────────────────────────────

/** The seal: serif-italic initials in a hairline ring. Static visual;
 *  the trigger owns the interactive states. */
export function Medallion({ initials, size = 34 }: { initials: string; size?: number }) {
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

/** The medallion press-mark trigger (GRAFT 2 states): hover fills the ring
 *  (panel-2 + ink-2 ring), focus-visible draws a 2px accent outline offset
 *  from the seal, and the open state stays articulated (ink-2 ring). */
function MedallionTrigger({
  initials,
  open,
  size,
  menuId,
  onToggle,
  triggerRef,
}: {
  initials: string
  open: boolean
  size: number
  menuId: string
  onToggle: () => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}) {
  const [hover, setHover] = useState(false)
  const active = hover || open
  return (
    <button
      ref={triggerRef}
      type="button"
      aria-label="Kontomeny"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      onClick={onToggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="hpc-acct-trigger"
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'inline-flex',
        borderRadius: '50%',
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          borderRadius: '50%',
          border: `1px solid ${active ? 'var(--ink-2)' : 'var(--hairline)'}`,
          background: active ? 'var(--panel-2)' : 'var(--panel)',
          color: 'var(--ink-2)',
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: size * 0.42,
          lineHeight: 1,
          letterSpacing: '0.01em',
          userSelect: 'none',
          transition: 'background 140ms ease, border-color 140ms ease',
        }}
      >
        {initials}
      </span>
    </button>
  )
}

/** Signed out (GRAFT 3): the un-stamped mark — a dashed ring where the
 *  medallion would sit — beside an ACCENT "Logga in →" that routes to
 *  /sign-in. Same footprint as signed in, both breakpoints. */
function SignInSlot({ size = 34 }: { size?: number }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      aria-label="Logga in"
      onClick={() => navigate({ to: '/sign-in' })}
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
      <span
        style={{
          ...monoWord,
          color: 'var(--accent)',
          whiteSpace: 'nowrap',
          letterSpacing: '0.1em',
        }}
      >
        Logga in →
      </span>
    </button>
  )
}

// ── card internals ───────────────────────────────────────────────────

type MenuAction = {
  key: string
  label: string
  onSelect: () => void
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

function ActionRow({ action }: { action: MenuAction }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
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

/** The shared card body: the three-register identity stack, the rule
 *  pair, the tracked-mono action rows, and the quiet Inställningar footer.
 *  Rendered identically inside the desktop card and the phone sheet. All
 *  role="menuitem" elements (rows AND the footer Inställningar) live under
 *  one subtree so the roving keyboard nav covers every item — fixing
 *  R2B1's listRef bug that scoped only the action rows. */
/** @internal — exported only for the throwaway visual-preview harness. */
export function MenuBody({
  identity,
  actions,
  onSettings,
  labelId,
}: {
  identity: Identity
  actions: MenuAction[]
  onSettings: () => void
  labelId: string
}) {
  return (
    <>
      {/* identity — the three registers */}
      <div
        id={labelId}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px 14px' }}
      >
        <Medallion initials={identity.initials} size={38} />
        <div style={{ minWidth: 0 }}>
          <div style={{ ...eyebrow, marginBottom: 3 }}>Inloggad som</div>
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
      <div style={{ padding: '7px 0 6px' }}>
        {actions.map((a) => (
          <ActionRow key={a.key} action={a} />
        ))}
      </div>

      {/* quiet cross-reference to product prefs (routes to /mer) */}
      <div style={{ borderTop: '1px solid var(--hairline)', padding: '10px 16px 12px' }}>
        <button
          type="button"
          role="menuitem"
          tabIndex={-1}
          onClick={onSettings}
          style={{ all: 'unset', cursor: 'pointer' }}
        >
          <span style={monoWord}>Inställningar →</span>
        </button>
      </div>
    </>
  )
}

// ── APG menu-button keyboard behaviour ───────────────────────────────

/** Roving focus over every [role="menuitem"] inside `menuRef` — ArrowUp/
 *  Down/Home/End, plus Esc (close + return focus) and Tab-out (close).
 *  Returns the container keydown handler. Escape is also caught globally
 *  in the parent so it works before focus lands on an item. */
function useMenuKeys(
  menuRef: React.RefObject<HTMLElement | null>,
  close: (returnFocus: boolean) => void,
) {
  return useCallback(
    (e: ReactKeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close(true)
        return
      }
      if (e.key === 'Tab') {
        // APG: Tab out of an open menu closes it (focus flows onward).
        close(false)
        return
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') {
        return
      }
      const items = Array.from(
        menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
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
    },
    [menuRef, close],
  )
}

/** Focus the first menu item once the panel mounts. */
function useFocusFirstItem(menuRef: React.RefObject<HTMLElement | null>, open: boolean) {
  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
  }, [menuRef, open])
}

// ── desktop: the tipped-in colophon card + portaled scrim ────────────

function DesktopMenu({
  identity,
  actions,
  onSettings,
  open,
  toggle,
  close,
  triggerRef,
  menuId,
  labelId,
  medallionSize,
}: {
  identity: Identity
  actions: MenuAction[]
  onSettings: () => void
  open: boolean
  toggle: () => void
  close: (returnFocus: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  menuId: string
  labelId: string
  medallionSize: number
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const onKeyDown = useMenuKeys(menuRef, close)
  useFocusFirstItem(menuRef, open)

  return (
    <>
      <MedallionTrigger
        initials={identity.initials}
        open={open}
        size={medallionSize}
        menuId={menuId}
        onToggle={toggle}
        triggerRef={triggerRef}
      />
      {open ? (
        <>
          {/* Genuinely fixed, portaled scrim — the house ink-14% dim.
              Portaled to <body> so `position: fixed` resolves against the
              viewport (no translateZ containment hack). */}
          {createPortal(
            <button
              type="button"
              aria-label="Stäng menyn"
              onClick={() => close(true)}
              className="hpc-acct-scrim"
              style={{
                position: 'fixed',
                inset: 0,
                border: 'none',
                padding: 0,
                cursor: 'default',
                background: 'color-mix(in oklch, var(--ink) 14%, transparent)',
                zIndex: 60,
              }}
            />,
            document.body,
          )}
          {/* The card is positioned by the caller's column-anchored wrapper
              (top: 44, right: 0 → its right hairline on the column's right
              text margin). max-height + overflow keep it in-viewport on a
              short window; the scrim above catches outside clicks. */}
          <div
            id={menuId}
            ref={menuRef}
            role="menu"
            aria-labelledby={labelId}
            onKeyDown={onKeyDown}
            className="hpc-acct-card"
            style={{
              position: 'absolute',
              top: 44,
              right: 0,
              zIndex: 61,
              width: 268,
              maxHeight: 'calc(100vh - 88px)',
              overflowY: 'auto',
              background: 'var(--panel)',
              border: '1px solid var(--hairline)',
              borderRadius: 3,
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <MenuBody
              identity={identity}
              actions={actions}
              onSettings={onSettings}
              labelId={labelId}
            />
          </div>
        </>
      ) : null}
    </>
  )
}

// ── phone: the card content on the house bottom sheet (GRAFT 1) ──────

function PhoneMenu({
  identity,
  actions,
  onSettings,
  open,
  toggle,
  close,
  triggerRef,
  menuId,
  labelId,
  medallionSize,
}: {
  identity: Identity
  actions: MenuAction[]
  onSettings: () => void
  open: boolean
  toggle: () => void
  close: (returnFocus: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  menuId: string
  labelId: string
  medallionSize: number
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const onKeyDown = useMenuKeys(menuRef, close)
  useFocusFirstItem(menuRef, open)

  return (
    <>
      <MedallionTrigger
        initials={identity.initials}
        open={open}
        size={medallionSize}
        menuId={menuId}
        onToggle={toggle}
        triggerRef={triggerRef}
      />
      {open
        ? createPortal(
            <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
              {/* the house sheet scrim */}
              <button
                type="button"
                aria-label="Stäng menyn"
                onClick={() => close(true)}
                className="hpc-acct-scrim"
                style={{
                  position: 'absolute',
                  inset: 0,
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  background: 'color-mix(in oklch, var(--ink) 22%, transparent)',
                }}
              />
              {/* the sheet panel — accent TOP rule is the sheet's law */}
              <div
                id={menuId}
                ref={menuRef}
                role="menu"
                aria-labelledby={labelId}
                onKeyDown={onKeyDown}
                className="hpc-acct-sheet"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'var(--panel)',
                  borderTop: '1px solid var(--accent)',
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  paddingBottom: 22,
                  boxShadow: 'var(--shadow-sheet)',
                }}
              >
                <div
                  aria-hidden
                  style={{
                    width: 38,
                    height: 4,
                    borderRadius: 999,
                    background: 'var(--hairline)',
                    margin: '14px auto 4px',
                  }}
                />
                <MenuBody
                  identity={identity}
                  actions={actions}
                  onSettings={onSettings}
                  labelId={labelId}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

// ── the connected surface ────────────────────────────────────────────

export function AccountMenu({
  signedOut = false,
  medallionSize = 34,
}: {
  /** Preview / test the signed-out slot. In production the whole Home tree
   *  is behind <SignedIn>, so this is signed-in in practice. */
  signedOut?: boolean
  medallionSize?: number
}) {
  const identity = useAccountIdentity()
  const viewport = useViewport()
  const navigate = useNavigate()
  const { signOut } = useClerk()
  const exportData = useExportData()

  const [open, setOpen] = useState(false)
  const menuId = useId()
  const labelId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)

  const close = useCallback((returnFocus: boolean) => {
    setOpen((wasOpen) => {
      if (wasOpen && returnFocus) triggerRef.current?.focus()
      return false
    })
  }, [])

  const toggle = useCallback(() => setOpen((o) => !o), [])

  // Global Escape — works even before focus lands inside the menu.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  if (signedOut) return <SignInSlot size={medallionSize} />

  const actions: MenuAction[] = [
    {
      key: 'account',
      label: 'Konto',
      arrow: true,
      onSelect: () => {
        close(false)
        navigate({ to: '/konto' })
      },
    },
    {
      key: 'export',
      label: 'Exportera min data',
      arrow: true,
      onSelect: () => {
        close(false)
        exportData
          .mutateAsync()
          .then((envelope) => downloadExport(envelope))
          .catch(() => {
            // Export failed (offline / server error) — the avancerat
            // surface owns the loud retry path; the quick menu stays quiet.
          })
      },
    },
    {
      key: 'logout',
      label: 'Logga ut',
      onSelect: () => {
        close(false)
        // Real Clerk sign-out, then land on /sign-in.
        void signOut(() => navigate({ to: '/sign-in' }))
      },
    },
  ]

  const onSettings = () => {
    close(false)
    navigate({ to: '/mer' })
  }

  const Menu = viewport === 'phone' ? PhoneMenu : DesktopMenu

  return (
    <Menu
      identity={identity}
      actions={actions}
      onSettings={onSettings}
      open={open}
      toggle={toggle}
      close={close}
      triggerRef={triggerRef}
      menuId={menuId}
      labelId={labelId}
      medallionSize={medallionSize}
    />
  )
}

// Dev-only floating launcher for the /dev tweaks panel.
//
// Sits in the canvas margin OUTSIDE the artboard so it doesn't pollute
// the design itself. Visible whenever `import.meta.env.DEV` is true OR
// when the URL has `?dev=1` (so we can also test it in a preview build).
// In a public production build it ships as `null`.
//
// Cmd+K is owned by `<CommandPalette />` (PRD § 6.4). The /dev route is
// available there as the "Dev panel" command, plus this floating button
// for mouse access. We deliberately don't bind any keyboard shortcut here
// to avoid a double-handler conflict on the same keystroke.

import { Link, useRouterState } from '@tanstack/react-router'

import { useViewport } from '@/hooks/useViewport'
import { isDevSurface } from '@/lib/devSurface'

export function TweaksLauncher() {
  const here = useRouterState({ select: (s) => s.location.pathname })
  const viewport = useViewport()

  if (!isDevSurface()) return null
  if (here === '/dev') return null

  // On phone the bottom tab bar reserves `--frame-tabbar` (88px) at the
  // bottom of the artboard, but that reservation is an internal-layout
  // convention — this button is `position: fixed` to the real browser
  // viewport, so it doesn't inherit it. Without a viewport-aware offset
  // the dev pill sits directly on top of Lektion/Feedback in the tab
  // bar (dogfood find, task #76). Lift it clear on phone; reader/studio
  // has no bottom chrome to clash with at bottom:18.
  const bottomOffset = viewport === 'phone' ? 'calc(var(--frame-tabbar) + 12px)' : 18

  return (
    <Link
      to="/dev"
      aria-label="Öppna design-tweaks"
      style={{
        position: 'fixed',
        right: 18,
        bottom: bottomOffset,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: 'var(--panel)',
        border: '1px solid var(--hairline)',
        borderRadius: 999,
        color: 'var(--ink-2)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: 'var(--font-mono-track)',
        textDecoration: 'none',
        boxShadow: '0 8px 20px -10px rgba(0,0,0,0.18)',
        zIndex: 50,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          background: 'var(--accent)',
        }}
      />
      tweaks
      <kbd
        style={{
          fontFamily: 'inherit',
          fontSize: 10,
          padding: '1px 5px',
          background: 'var(--panel-2)',
          border: '1px solid var(--hairline)',
          borderRadius: 4,
          color: 'var(--muted)',
        }}
      >
        dev
      </kbd>
    </Link>
  )
}

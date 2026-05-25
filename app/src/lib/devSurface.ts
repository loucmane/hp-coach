// Shared dev-surface gate.
//
// Returns true when dev-only affordances (TweaksLauncher,
// ShareDebugButton, the Cmd+K "Dev panel" command, …) should render.
// Three triggers, OR-combined:
//
//   1. `import.meta.env.DEV` — running `pnpm dev`. Always on.
//   2. `?dev=1` somewhere in the URL — opts a production preview
//      session into dev affordances. The flag stickies into
//      sessionStorage so TanStack's query-param-stripping navigation
//      doesn't drop dev mode the moment you click a Link.
//   3. `sessionStorage.hpc-dev-mode === '1'` — the sticky flag from
//      step 2.
//
// Originally lived as a private helper inside TweaksLauncher.tsx and
// ShareDebugButton.tsx. Extracted here so CommandPalette can gate its
// own "Dev panel" command on the same predicate — otherwise the
// command list would say "you can reach /dev" while the floating
// launcher claims you can't.

const DEV_SESSION_KEY = 'hpc-dev-mode'

export function isDevSurface(): boolean {
  if (import.meta.env.DEV) return true
  if (typeof window === 'undefined') return false
  if (new URLSearchParams(window.location.search).has('dev')) {
    try {
      sessionStorage.setItem(DEV_SESSION_KEY, '1')
    } catch (_) {
      /* private mode, storage quota, etc — fail open: still treat as dev for this nav */
    }
    return true
  }
  try {
    return sessionStorage.getItem(DEV_SESSION_KEY) === '1'
  } catch (_) {
    return false
  }
}

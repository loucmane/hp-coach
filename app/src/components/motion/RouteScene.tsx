// RouteScene — A2's scene handoff for the router outlet.
//
// A door change is an Arket scene change, NOT a slideshow: the outgoing
// scene's ink lifts off (ut, 90ms, leading), the incoming scene's ink
// dries in (tork) after its per-pair handoff delay. OPACITY ONLY — no
// positional slides, no translate-in entrances (One Sheet law). The
// effect reads as the page re-inking under a fixed reading window.
//
// Placement: this wraps the <Outlet /> in __root. In this app the nav
// rail lives INSIDE each route (Page → RailShell), so it is part of the
// scene subtree. Because the rail's markup is identical across routes,
// an opacity crossfade of two identical rails is visually steady — the
// only rail delta that reads is the active-door accent, which re-inks
// with the page rather than sliding. Hoisting the rail to a persistent
// root frame (so it is provably untouched) is a larger refactor tracked
// separately; the crossfade already honours "no slides, no rail motion
// of position".
//
// Mode: `wait`, not `popLayout`. The task's reference used popLayout on a
// SINGLE fixture stage, where overlapping the outgoing + incoming scenes
// is the crossfade. At ROUTE scale that overlap mounts the ENTIRE next
// route subtree alongside the old one for the exit's duration — which
// duplicates every landmark and testid (two <main>s, two `drill-idle`s)
// and, for two full-viewport pages, stacks them rather than crossfading.
// That is jank, not the one-sheet re-ink. `wait` keeps exactly one scene
// mounted: the outgoing ink lifts off first (ut, leading), then the
// incoming ink dries in (tork) — "exits lead entrances" read literally,
// no doubled DOM, no positional slide. Deviation from the literal
// popLayout instruction, made for correctness; see the report.

import { useLocation } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'

import { EASE, useArketMotion } from '@/lib/motion'

/** Map a pathname to its scene family, for per-pair handoff delays. */
function sceneFamily(pathname: string): string {
  if (pathname === '/') return 'home'
  if (
    pathname.startsWith('/ova') ||
    pathname.startsWith('/drill') ||
    pathname.startsWith('/repetition') ||
    pathname.startsWith('/diagnostik')
  ) {
    // The drill surface is its own camera world; treat /drill as `drill`
    // and the Öva hub / repetition as `ova` so öva→drill gets the long
    // handoff the biggest morph set wants.
    return pathname.startsWith('/drill') ? 'drill' : 'ova'
  }
  return pathname.split('/')[1] || 'home'
}

export function RouteScene({ children }: { children: ReactNode }) {
  const location = useLocation()
  const ark = useArketMotion()
  const family = sceneFamily(location.pathname)

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={family}
        data-scene={family}
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: ark.rm ? { duration: 0 } : { duration: 0.2, ease: [...EASE.reading] },
        }}
        exit={{
          opacity: 0,
          // The exit leads; `mode="wait"` finishes it before the next
          // scene's ink dries in.
          transition: ark.rm ? { duration: 0 } : { duration: 0.09, ease: [...EASE.exit] },
        }}
        style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

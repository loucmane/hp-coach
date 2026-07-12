// RouteScene — A2's scene handoff for the router outlet.
//
// A door change is an Arket scene change, NOT a slideshow: the outgoing
// scene's ink lifts off (ut, 90ms, leading), the incoming scene's ink
// dries in (tork) after its per-pair handoff delay. OPACITY ONLY — no
// positional slides, no translate-in entrances (One Sheet law). The
// effect reads as the page re-inking under a fixed reading window.
//
// Placement: this wraps the <Outlet /> in __root, inside ONE root
// <LayoutGroup> — the group that lets material shared between scenes
// (the due numeral, a section-door code, the ark-kort sheet) travel as
// a single object via layoutId across the route change.
//
// Mode: `popLayout`, with a STATIC SNAPSHOT as the exit material.
// Two constraints meet here:
//
//   1. Cross-route layoutId flights need the old station's snapshot and
//      the new station's mount to land in the SAME React commit — which
//      overlap (popLayout) gives and `wait` does not (with `wait` the
//      new scene mounts a full animation later, after the old members'
//      projection snapshots are discarded).
//
//   2. TanStack's <Outlet/> is LIVE: the exiting scene's outlet
//      re-resolves to the NEW route the moment navigation commits. An
//      exiting scene that renders React children therefore duplicates
//      the incoming page — two <main>s, two sets of testids, and worst,
//      a second SessionPlayer whose effects double-fire.
//
//   So the exiting scene renders no React at all: on every family
//   change the outgoing scene's DOM is cloned (render-phase, before
//   React mutates it), stripped of testids/ids, and that inert clone is
//   what fades out — the literal old ink lifting off the sheet. It is
//   `aria-hidden` + `inert` + `data-exiting` (one live main landmark at
//   all times; no focus, no clicks), and popLayout pins it absolute
//   over the incoming scene so full-viewport pages crossfade instead of
//   stacking.

import { useRouterState } from '@tanstack/react-router'
import { AnimatePresence, LayoutGroup, motion, useIsPresent } from 'motion/react'
import { type ReactNode, type Ref, useRef } from 'react'

import { makeExitClone, StaticExitInk } from '@/components/motion/exitInk'
import { EASE, handoffDelay, useArketMotion } from '@/lib/motion'

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

function Scene({
  ref,
  family,
  enterDelay,
  sceneRef,
  exitInk,
  children,
}: {
  /** Forwarded to the motion element — REQUIRED by AnimatePresence's
   *  popLayout mode, which measures the exiting child through its ref to
   *  pin it position:absolute. Without it the exiting scene stays in
   *  flow and the two scenes stack vertically instead of crossfading. */
  ref?: Ref<HTMLDivElement>
  family: string
  enterDelay: number
  /** RouteScene's handle on the LIVE scene's DOM, for exit cloning. */
  sceneRef: (el: HTMLDivElement | null, family: string) => void
  /** The static clone to show while exiting (never live React). */
  exitInk: (family: string) => HTMLElement | null
  children: ReactNode
}) {
  const ark = useArketMotion()
  // Present = the live scene. The moment presence is lost (exit began)
  // the scene leaves the accessibility tree and the interaction plane,
  // and its content is swapped for the static exit clone — unmounting
  // the old route's React subtree (whose <Outlet/> would otherwise
  // re-resolve to the NEW route) in the very commit the new scene
  // mounts, which is also what hands the layoutId flights their
  // departure snapshots.
  const present = useIsPresent()
  return (
    <motion.div
      ref={(el: HTMLDivElement | null) => {
        if (typeof ref === 'function') ref(el)
        else if (ref) ref.current = el
        if (present) sceneRef(el, family)
      }}
      data-scene={family}
      data-exiting={present ? undefined : 'true'}
      aria-hidden={present ? undefined : true}
      inert={present ? undefined : true}
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        transition: ark.rm
          ? { duration: 0 }
          : { duration: 0.2, ease: [...EASE.reading], delay: enterDelay },
      }}
      exit={{
        opacity: 0,
        // The exit leads (ut register); the incoming scene's ink waits
        // out its per-pair handoff delay so the two never double-expose.
        transition: ark.rm ? { duration: 0 } : { duration: 0.09, ease: [...EASE.exit] },
      }}
      style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
    >
      {present ? children : <StaticExitInk node={exitInk(family)} />}
    </motion.div>
  )
}

export function RouteScene({ children }: { children: ReactNode }) {
  // Key scenes off the COMMITTED matches, not `useLocation`. During an
  // async route transition (code-split chunks) the location store
  // updates first while <Outlet/> keeps rendering the OLD matches — a
  // location-keyed scene would re-key in that window and REMOUNT the
  // old route inside the new scene (double-firing its mount effects;
  // found as a /drill session re-adopt that bounced the URL back and
  // cancelled the navigation). `state.matches` flips in the same store
  // update the outlet renders from, so the scene key and the scene
  // content always swap in one commit.
  const pathname = useRouterState({
    select: (s) => s.matches[s.matches.length - 1]?.pathname ?? s.location.pathname,
  })
  const family = sceneFamily(pathname)
  // The nav pair (from → to), for the per-pair handoff delay. Stored as
  // a pair (not a bare prev) so StrictMode's double render can't smear
  // it: the second render sees `to === family` and keeps `from` intact.
  const pairRef = useRef<{ from: string | null; to: string }>({ from: null, to: family })
  // Live scene DOM + per-family exit clones. The clone is taken in the
  // RENDER PHASE of the navigation render — the last moment the old
  // scene's DOM is still the old route's pixels (React hasn't committed
  // the outlet re-resolution yet). cloneNode is read-only on the live
  // tree, so this is render-safe; StrictMode's double render just
  // clones twice.
  const liveSceneEl = useRef<HTMLDivElement | null>(null)
  const exitClones = useRef(new Map<string, HTMLElement>())
  if (pairRef.current.to !== family) {
    const from = pairRef.current.to
    if (liveSceneEl.current) {
      exitClones.current.set(from, makeExitClone(liveSceneEl.current))
    }
    pairRef.current = { from, to: family }
  }
  const enterDelay = handoffDelay(pairRef.current.from, family)

  return (
    <LayoutGroup>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
        }}
      >
        <AnimatePresence
          mode="popLayout"
          initial={false}
          onExitComplete={() => exitClones.current.clear()}
        >
          <Scene
            key={family}
            family={family}
            enterDelay={enterDelay}
            sceneRef={(el) => {
              if (el) liveSceneEl.current = el
            }}
            exitInk={(f) => exitClones.current.get(f) ?? null}
          >
            {children}
          </Scene>
        </AnimatePresence>
      </div>
    </LayoutGroup>
  )
}

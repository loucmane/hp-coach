// StageInk — RouteScene's ink handoff, at stage scale.
//
// RouteScene re-inks the sheet between ROUTES; a session surface also
// re-inks WITHIN one route: the hub-door loading interstitial ("Laddar
// …" under the morphing section code) yields to the live question in a
// single React commit, and before this component that swap was a pop —
// the one chrome swap in the product the scene handoff couldn't see.
//
// Same grammar, same numbers as RouteScene: the outgoing stage's ink
// lifts off (ut, 90ms, leading — a static neutralised DOM clone with
// the page ground painted in, so the incoming stage never shows through
// mid-lift), and the incoming stage's ink dries in (200ms reading ease)
// after a short handoff delay. OPACITY ONLY. popLayout keeps exit and
// entrance in the same commit, which is also what hands any layoutId
// flights (the section-door code) their departure snapshots — the code
// crossfades between stations instead of blinking.
//
// Only a `stage` KEY change animates; re-renders within a stage are
// untouched. Reduced motion collapses both halves to duration 0 (an
// instant swap). `initial={false}`: mounting is not a stage change.

import { AnimatePresence, motion, useIsPresent } from 'motion/react'
import { type ReactNode, useRef } from 'react'

import { makeExitClone, StaticExitInk } from '@/components/motion/exitInk'
import { EASE, useArketMotion } from '@/lib/motion'

/** Entrance lead over the ut exit, seconds — the route-pair fallback. */
const STAGE_HANDOFF = 0.04

function Stage({
  ref,
  stage,
  stageRef,
  exitInk,
  children,
}: {
  /** Required by popLayout — it measures the exiting child through its
   *  ref to pin it position:absolute over the incoming stage. */
  ref?: React.Ref<HTMLDivElement>
  stage: string
  stageRef: (el: HTMLDivElement | null) => void
  exitInk: (stage: string) => HTMLElement | null
  children: ReactNode
}) {
  const ark = useArketMotion()
  const present = useIsPresent()
  return (
    <motion.div
      ref={(el: HTMLDivElement | null) => {
        if (typeof ref === 'function') ref(el)
        else if (ref) ref.current = el
        if (present) stageRef(el)
      }}
      data-stage={stage}
      aria-hidden={present ? undefined : true}
      inert={present ? undefined : true}
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        transition: ark.rm
          ? { duration: 0 }
          : { duration: 0.2, ease: [...EASE.reading], delay: STAGE_HANDOFF },
      }}
      exit={{
        opacity: 0,
        transition: ark.rm ? { duration: 0 } : { duration: 0.09, ease: [...EASE.exit] },
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        // The exiting clone must be OPAQUE ground, not floating glyphs:
        // it covers the incoming stage completely and lifts off as one
        // sheet (the page re-inking under a fixed reading window).
        background: present ? undefined : 'var(--bg)',
        zIndex: present ? undefined : 1,
      }}
    >
      {present ? children : <StaticExitInk node={exitInk(stage)} />}
    </motion.div>
  )
}

/**
 * Wrap a surface whose CONTENT swaps wholesale on a state-machine edge
 * (loading → live). Change `stage` to hand the sheet over; keep it
 * constant to leave renders untouched.
 */
export function StageInk({ stage, children }: { stage: string; children: ReactNode }) {
  // Same render-phase clone idiom as RouteScene: on a stage change the
  // live DOM still shows the OLD stage (React hasn't committed yet) —
  // capture it for the exit. StrictMode's double render just clones twice.
  const liveEl = useRef<HTMLDivElement | null>(null)
  const prevStage = useRef(stage)
  const clones = useRef(new Map<string, HTMLElement>())
  if (prevStage.current !== stage) {
    if (liveEl.current) clones.current.set(prevStage.current, makeExitClone(liveEl.current))
    prevStage.current = stage
  }
  return (
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
        onExitComplete={() => clones.current.clear()}
      >
        <Stage
          key={stage}
          stage={stage}
          stageRef={(el) => {
            if (el) liveEl.current = el
          }}
          exitInk={(s) => clones.current.get(s) ?? null}
        >
          {children}
        </Stage>
      </AnimatePresence>
    </div>
  )
}

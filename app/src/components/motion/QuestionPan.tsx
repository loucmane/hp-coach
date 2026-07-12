// QuestionPan — the drill's ribbon camera, in the product's frame.
//
// The reference (MOTA2) keeps every question on ONE continuous strip
// and pans a camera down it (remsan). The product drill mounts one
// question at a time (SessionPlayer's plan/index state machine — which
// this file does NOT touch), so the nearest honest form of that camera
// is applied to the sheet itself: on advance, the graded question —
// verdict, marks and all — visibly exits UPWARD off the reading window
// (the ut register, but with travel: this is the camera's one y degree
// of freedom) while the next question arrives from below onto the same
// sheet, riding the remsan spring. Forward = down the page; exits lead
// entrances; continuity, not swap.
//
// The exiting sheet is DEAD INK (a neutralised DOM clone — see
// exitInk.tsx): past questions are marks, not controls. The old React
// subtree unmounts the moment the next question mounts, so its testids
// and (disabled) buttons never coexist with the live question's.
//
// Scroll model: the page body owns scroll on desktop. The reset to the
// top of the next question happens in onExitComplete — the one moment
// the sheet is bare, so the jump is never visible.
//
// Reduced motion: opacity-or-nothing — zero travel, instant swap.

import { AnimatePresence, motion, useIsPresent } from 'motion/react'
import { type ReactNode, useRef } from 'react'

import { makeExitClone, StaticExitInk } from '@/components/motion/exitInk'
import { EASE, INK, PAN, SPRING, useArketMotion } from '@/lib/motion'

function Sheet({
  id,
  exitInk,
  liveRef,
  children,
}: {
  id: string
  exitInk: (id: string) => HTMLElement | null
  liveRef: (el: HTMLDivElement | null) => void
  children: ReactNode
}) {
  const ark = useArketMotion()
  // Present = the live question. The moment presence is lost the sheet
  // swaps to dead ink: past questions are marks, not controls, and the
  // old React subtree (testids, disabled buttons) unmounts in the very
  // commit the next question mounts.
  const present = useIsPresent()
  return (
    <motion.div
      ref={(el: HTMLDivElement | null) => {
        if (present) liveRef(el)
      }}
      initial={ark.rm ? { opacity: 0 } : { opacity: 0, y: PAN.enterY }}
      animate={{
        opacity: 1,
        y: 0,
        transition: ark.rm
          ? { duration: 0 }
          : {
              y: { type: 'spring', ...SPRING.remsan },
              opacity: { ...INK.tork, ease: [...INK.tork.ease] },
            },
      }}
      exit={{
        opacity: 0,
        y: ark.rm ? 0 : PAN.exitY,
        transition: ark.rm ? { duration: 0 } : { duration: PAN.exitDuration, ease: [...EASE.exit] },
      }}
      // height:100% keeps the phone path's fill/scroll chain intact
      // (DrillQuestion owns its own overflow there); resolves to auto
      // on the desktop flow where the body owns scroll.
      style={{ height: '100%' }}
    >
      {present ? children : <StaticExitInk node={exitInk(id)} />}
    </motion.div>
  )
}

export function QuestionPan({ id, children }: { id: string; children: ReactNode }) {
  // Dead-ink capture, render-phase: when the id changes, the live
  // sheet's DOM still shows the OLD question (React hasn't committed
  // the swap yet) — clone it for the exit. cloneNode is read-only on
  // the live tree; StrictMode's double render just clones twice.
  const liveEl = useRef<HTMLDivElement | null>(null)
  const prevIdRef = useRef(id)
  const clones = useRef(new Map<string, HTMLElement>())
  if (prevIdRef.current !== id) {
    if (liveEl.current) clones.current.set(prevIdRef.current, makeExitClone(liveEl.current))
    prevIdRef.current = id
  }
  return (
    <AnimatePresence
      mode="wait"
      initial={false}
      onExitComplete={() => {
        clones.current.clear()
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' })
      }}
    >
      <Sheet
        key={id}
        id={id}
        exitInk={(f) => clones.current.get(f) ?? null}
        liveRef={(el) => {
          if (el) liveEl.current = el
        }}
      >
        {children}
      </Sheet>
    </AnimatePresence>
  )
}

// useViewport — three-mode viewport detection for the Phase A
// responsive Frame. Components that need to know which mode the shell
// is in (mostly Frame itself, plus a couple of layout-choosing screens)
// call this hook; everything else should prefer container queries.
//
// Breakpoints match the @theme entries in index.css so JS and CSS stay
// in lockstep: reader at 768px, studio at 1280px. Below reader = phone.
//
// SSR/initial-render note: we default to 'phone' before matchMedia is
// available so the first paint matches the iOS-artboard baseline. The
// effect immediately corrects to the real viewport on mount.

import { useEffect, useState } from 'react'

export type Viewport = 'phone' | 'reader' | 'studio'

const READER_MIN = 768
const STUDIO_MIN = 1280

function detect(width: number): Viewport {
  if (width >= STUDIO_MIN) return 'studio'
  if (width >= READER_MIN) return 'reader'
  return 'phone'
}

export function useViewport(): Viewport {
  const [viewport, setViewport] = useState<Viewport>('phone')

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initialise from current width — handles the case where the user
    // refreshes on tablet/desktop and we'd otherwise flash the phone
    // shell for one frame.
    setViewport(detect(window.innerWidth))

    const readerMq = window.matchMedia(`(min-width: ${READER_MIN}px)`)
    const studioMq = window.matchMedia(`(min-width: ${STUDIO_MIN}px)`)

    const handler = () => setViewport(detect(window.innerWidth))

    // matchMedia supports both addEventListener('change', ...) and the
    // older addListener API. We use the modern one; the browser targets
    // (Safari 14+, Chrome/Firefox/Edge current — see PRD §6.8) all
    // support it.
    readerMq.addEventListener('change', handler)
    studioMq.addEventListener('change', handler)

    // Also listen for resize beyond the breakpoint changes — covers
    // window-resize from desktop reader → studio without crossing a
    // discrete media-query boundary on the way.
    window.addEventListener('resize', handler)

    return () => {
      readerMq.removeEventListener('change', handler)
      studioMq.removeEventListener('change', handler)
      window.removeEventListener('resize', handler)
    }
  }, [])

  return viewport
}

/**
 * Pure helper for tests + non-hook callers (e.g. an SSR pass that has
 * the width upfront, or a unit test that wants to assert classification
 * directly).
 */
export const __test = { detect, READER_MIN, STUDIO_MIN }

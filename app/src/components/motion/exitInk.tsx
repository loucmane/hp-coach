// exitInk — dead ink for A2 exits.
//
// When a scene (RouteScene) or a question sheet (QuestionPan) leaves,
// what fades out must be the old PIXELS, not a live React subtree: live
// exits duplicate testids and landmarks for the exit's duration, keep
// disabled controls clickable-looking, and (at route scale) re-resolve
// live outlets to the new route. So exits render a DOM clone taken at
// the last render before the swap — neutralised (no testids, no ids,
// no pointer events, CSS animations pinned at their settled state so
// freshly-inserted nodes don't replay their entrance keyframes).

import type { HTMLAttributes } from 'react'

/** Clone an element's DOM for its exit, neutralised into dead ink. */
export function makeExitClone(el: HTMLElement): HTMLElement {
  // Fixed-position descendants must not survive into the clone: a
  // position:fixed node ignores the exiting scene's absolute pinning and
  // re-pins to the VIEWPORT — dead ink floating OVER the incoming page
  // (seen 2026-07-14: the fixed due-station ghosting "N att repetera"
  // onto Home after leaving a session). Collect them from the LIVE tree
  // (computed styles are lost on clone) and hide their clone twins.
  const fixedIdx: number[] = []
  const liveAll = el.querySelectorAll<HTMLElement>('*')
  liveAll.forEach((n, i) => {
    if (getComputedStyle(n).position === 'fixed') fixedIdx.push(i)
  })
  const clone = el.cloneNode(true) as HTMLElement
  if (fixedIdx.length > 0) {
    const cloneAll = clone.querySelectorAll<HTMLElement>('*')
    for (const i of fixedIdx) cloneAll[i]?.style.setProperty('visibility', 'hidden')
  }
  for (const n of clone.querySelectorAll('[data-testid]')) n.removeAttribute('data-testid')
  for (const n of clone.querySelectorAll('[id]')) n.removeAttribute('id')
  clone.removeAttribute('data-testid')
  clone.removeAttribute('id')
  clone.style.pointerEvents = 'none'
  // Freshly-inserted DOM restarts CSS animations from frame 0 — the M3
  // entrance keyframes (rule draws, content rises) would BLINK the old
  // ink out and replay it mid-exit. Dead ink doesn't move: pin every
  // node at its settled state.
  clone.style.animation = 'none'
  clone.style.transition = 'none'
  for (const n of clone.querySelectorAll<HTMLElement>('*')) {
    n.style.animation = 'none'
    n.style.transition = 'none'
  }
  return clone
}

/** Mounts a pre-built DOM node. `display: contents` keeps the host's
 *  own layout; the node inside is static. */
export function StaticExitInk({
  node,
  ...rest
}: { node: HTMLElement | null } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      style={{ display: 'contents' }}
      ref={(el) => {
        if (el && node && !el.hasChildNodes()) el.appendChild(node)
      }}
      {...rest}
    />
  )
}

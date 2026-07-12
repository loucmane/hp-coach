# MotionBlacket2 — "Bläcket 2.0" (MOTB2)

Round 2 of the motion bake-off. Round 1's MOTC2 "Bläcket" set the
grammar (a light pen; marks move on a still page); its ceiling was the
tech — plain CSS keyframes replayed in isolated boards. This is the
same grammar rebuilt as ONE walkable flow on `motion/react`:
**Hem → Öva → drill (3 real ORD questions) → Klart. → Hem**, every
transition a real, interruptible spring.

## What was upgraded from round 1

| Round 1 (CSS keyframes)                    | Round 2 (motion/react)                                        |
| ------------------------------------------ | ------------------------------------------------------------- |
| Clip boards, REPLAY remounts               | A walkable journey with shared in-memory state                 |
| `--ease-spring` cubic-bezier "overshoot"   | Real springs (stiffness/damping/mass), named and tuned         |
| Hand-faked numeral flight (`translate(50px,-36px)`) | Measured `layoutId` shared element — rail ↔ drill header |
| Static due count                           | LIVE count: wrong answer rolls +1, resolved repetition −1 (masked per-digit roll, direction-aware) |
| ✓ as clip-path text reveal                 | SVG `pathLength` spring — the pen actually draws the check     |
| Strike as `scaleX` keyframe                | `scaleX` spring, underdamped — the overshoot is pen momentum   |
| Sequential moments                         | `AnimatePresence mode="popLayout"` — next question's entrance overlaps the verdict's exit |
| No gestures                                | Klart. card drag-dismiss: rubber-band (`dragElastic`), velocity-thresholded release |
| No review tooling                          | Regi panel: scene, last transition's real params, 1×/0,5× toggle |
| CSS media-query reduced motion             | `useReducedMotion` wired through every factory: opacity-or-nothing, no layout travel, no drag |

## The spring vocabulary (all params visible in the regi panel)

- **penna** — k=520 c=32 m=0.75. Small marks: digit roll, folio pops,
  ledger counts. Light, one hair of overshoot, settles ~250 ms.
- **strecket** — k=700 c=22 m=0.6. The corrector's strike only.
  Deliberately underdamped: it overshoots past the word and pulls back —
  that overshoot reads as the pen's momentum, not as bounce.
- **bocken** — k=420 c=36 m=0.9 on SVG `pathLength`. Near-critically
  damped so the stroke never re-draws backwards; the spring's velocity
  curve (fast attack, soft landing) is what makes it read as drawn.
- **sidan** — k=380 c=40 m=1. All layout: the ink tick's FLIP travel
  between ToC rows, the due numeral's rail→drill flight, the Klart.
  card arrival. Critically damped — **the page never bounces**
  (Bläcket's first law, kept from round 1).
- **tryck** — k=650 c=26 m=0.55. Button press release (`whileTap`
  scale 0.955 + y 0.5): presses in with the click, springs back out.
- Tweens: **skrift** 300 ms `[0.16,1,0.3,1]` (written-in entrances),
  **ut** 160 ms `[0.7,0,0.84,0]` (exits), **linjal** 360 ms (hairline
  rules drawing as arrival choreography).

## Where the craft lives (easy to miss at a glance)

- **Exit ⟂ entrance, always.** Scene changes and question changes both
  run through `popLayout`: the outgoing page starts leaving (160 ms,
  hard-in ease) and the incoming one starts writing in 50 ms later —
  they cross mid-air. Screenshot `09-q1-to-q2-handoff.png` catches
  "vedermöda" writing in over "begrunda" mid-exit.
- **Interruption is free, not handled.** Because everything is springs
  + `AnimatePresence`, rapid Hem→Öva→Hem clicks mid-transition redirect
  the tick and the page in flight (screenshot 04). Nothing queues.
- **The signature is measured.** The due numeral is one `layoutId`
  (`due-numeral`) under a `LayoutGroup`. While the drill owns it, the
  rail's folio slot stays genuinely empty — the object *moved*, it
  wasn't duplicated. It travels with `sidan`, and inside it the
  `DigitRoll` is direction-aware: 14→15 rolls up (a new debt), 15→14
  rolls down (a debt paid). The count is real state shared by rail,
  drill and Klart. copy.
- **The strike's overshoot is asymmetric physics, not a keyframe.**
  m=0.6 with c=22 gives one visible over-extension (~8%) and a single
  settle — tuned so it never oscillates twice (ADHD discipline: one
  confirmation, then stillness).
- **The drag is thresholded on velocity OR offset** (v>620 px/s or
  y>130 px): a lazy 100 px drag springs back on `sidan`; a short flick
  dismisses. `dragElastic` is asymmetric ({top: 0.08, bottom: 0.45}) —
  the card resists the wrong direction. The regi panel prints the
  actual release velocity.
- **Speed toggle is honest time-scaling.** Motion has no global
  timescale, so 0,5× multiplies every factory: stiffness×s², damping×s
  — the spring's damping ratio (shape) is identical, the clock is
  half. Tweens divide duration. (Deviation from the brief's
  "via a shared MotionConfig": MotionConfig only carries
  `reducedMotion`; the context multiplier is the correct mechanism.)
- **Accent law holds under motion.** The only accent pixels are the
  active ToC row and the due numeral — the two places it already
  lived. The traveling element IS the accent object, so the signature
  adds zero new accent.
- **Reduced motion** (`useReducedMotion`) rewrites every factory to
  `{duration: 0}` + opacity-only variants, disables both `layoutId`s
  (no travel), skips pathLength/clip-path drawing, turns the drag off
  and swaps the hint copy to "tryck för att lägga undan kortet".

## Verification

Driven end-to-end with Playwright chromium at 1× and 0,5× plus a
`reducedMotion: 'reduce'` context; key frames in `screenshots-motion/`
(repo root): entrance, mid-flight scene handoff, interrupted nav,
numeral in flight, drawn ✓, strike, digit roll at half speed, Klart.
rubber-band drag, post-fling return, reduced-motion drill. No console
errors across the whole flow.

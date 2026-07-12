# MotionArketFullbordad — round 4, MOTA2 · Arket, fullbordad

Round 4 of the motion bake-off. Round 3's verdict: **F2 "Arket" wins as
the base** (total continuity — one sheet, nothing appears or
disappears, drill = panning paper ribbon) **plus F4 "Greppet"'s
drag-to-commit**. This variant is that combination taken through
fit-and-finish: same system, same walkable flow (Hem → Öva → 3 real
ORD questions → Klart. → Hem), the last 10% executed.

## The camera model

The frame is a fixed reading window over ONE continuous sheet. The
camera has exactly one degree of freedom — y, panning down the sheet
during the drill (remsan); it never moves in x, never zooms, never
rotates. Forward = down the page. Everything else that appears to move
is the sheet's own material rearranging in plane (layoutId morphs —
arket) or ink drying/lifting in place (opacity — tork/ut; zero travel,
no entrance offsets anywhere in the system). Depth has exactly two
stations: the sheet plane (z0 — flat, shadowless) and the finger-lift
(z1) — a strip being dragged is the only thing that ever leaves the
plane and the only thing that ever casts a shadow. On release the
strip is pressed back into the plane: the commit flight (strip →
verdict) is in-plane rearrangement like every other morph, so it is
shadowless by law, not by omission. Camera pans cast no light change —
moving your eyes doesn't move the lamp.

## The material-light decision

A whisper of shadow, but **never time-based**: the dragged strip's
paper backing and its two-layer shadow are a pure function of drag
distance (x 0→12 px maps 0→full; peaks 0.14/0.10 alpha at the detent).
Because the shadow is `f(drag)` and not `f(time)`, it physically
cannot pop in a frame late or linger after the strip is home — on an
early release it decays along the very seat-spring (säte) the strip
rides back on; on commit it ends at release because the strip has
rejoined the plane. The armed hint ("släpp = svara") and the crease
(groove + detent tick) obey the same law: opacity mapped from x, no
state-flip pops. Everything else in the system — every pan, every
morph — is deliberately FLAT. One lamp, one rule.

## Corner-cuts found in the round-3 Arket build, fixed here

1. **Frozen camera target.** F2 measured the pan target's `offsetTop`
   once (single rAF) and sprang to that pixel. Any layout settle after
   that instant — verdict gloss wrapping, sibling rows closing up —
   left the camera parked off the true static position (content
   visibly offset vs a fresh render). Now the camera aims at a
   *block*: a ResizeObserver on the ribbon re-measures the target's
   offsetTop on every layout change and re-aims the same interruptible
   spring in flight. The settle is guaranteed to land on static layout
   (verified: worst probe drift 0.03 px, see below).
2. **The numeral raced the camera.** F2 flipped the due numeral to its
   Klart-sentence station in the same commit that started the pan, so
   the `layoutId` morph flew toward a destination still below the fold
   — the numeral visually detached and vanished under the reading edge
   mid-flight (two springs, arket k320 vs remsan k240, racing). Now
   the station handoff fires in the pan's `onComplete`: the camera
   arrives first, then the numeral flies from the always-visible
   header into the settled panel — both endpoints in frame for the
   entire flight (screenshot 1x-13 shows the numeral still held in the
   header mid-pan, the sentence showing its reserved slot).
3. **Faked sentence flow + reflow on numeral arrival.** F2's Klart
   sentence was flex-wrap spans with `gap: 6`, so spacing around the
   landing numeral never matched real text flow, and both the rail and
   the sentence reflowed when the numeral left/arrived. Now the
   sentence is one true inline `<p>`, and every station the numeral
   can leave (rail, drill header, Klart sentence) reserves an
   exact-width slot (`String(due).length`ch in the numeral's own mono
   size) while it is away — nothing reflows on arrival or departure.
4. **One global scene-handoff constant.** F2 ran every nav with the
   same exit (120 ms) and zero entrance delay — a double-exposure
   frame on every scene change. Now exits lead at 90 ms and each nav
   pair has its own entrance delay: hem↔öva 40 ms; öva→drill 60 ms
   (the biggest morph set — ORD code, numeral, Öva shrinking to the
   eyebrow — gets the most room to read); drill→hem 50 ms (the card
   fold-back).
5. **DigitRoll mutated a ref during render.** Direction detection
   wrote `prev.current` in the render body — a side effect in render
   that misreads direction under StrictMode double-render. Moved to a
   `useEffect`.

(Two smaller finish items in the same spirit: F4's armed hint popped
in on a state flip and could clip outside the frame at full pull — it
is now `f(drag)` opacity with reserved right padding; and the wrong
verdict's strike was a CSS bar parked at `top: 54%` — it is now a
slightly rising SVG hand-stroke sized in em to the word box, drying in
via tork like all ink.)

## The drag-commit in Arket's material language

An answer row is a strip of the sheet. Pulling it right slides it
along a crease that only materializes under the hand (groove + detent
tick fade in over the first 14 px; the strip's paper backing occludes
the crease it slides over). The detent at 72 px is a mechanical stop
(hard stop 88 px; the wrong direction refuses — elastic 0 left, 0.04
right). Release past the detent commits, and the strip you were
holding **is** the verdict: the same layoutId flies the word from its
dragged position into the verdict slot with the release velocity
carried into the arket spring (clamped ×0,5, ±700 px/s — the regi
panel prints the inherited v). Release before the detent and the strip
seats home on säte with the same velocity inherited. Click (`onTap`,
guarded against drag-settles) and keyboard (Enter/Space) commit
everywhere with velocity 0 — verified on q2 (click) and q3 (keyboard).

## Spring table (regi panel shows the same line)

| name   | k   | c  | m    | use                                                        |
| ------ | --- | -- | ---- | ---------------------------------------------------------- |
| arket  | 320 | 36 | 1    | all layoutId morphs; verdict morph inherits release velocity |
| remsan | 240 | 30 | 1.15 | the camera pan; live-aimed, re-targets via ResizeObserver   |
| veck   | 480 | 40 | 0.8  | in-place layout shifts (rows closing up), digit roll        |
| säte   | 620 | 42 | 0.9  | a released strip seating home (velocity inherited)          |
| tork   | —   | —  | —    | ink drying: 240 ms tween [0.16,1,0.3,1], zero travel        |
| ut     | —   | —  | —    | ink lifting off: 90 ms tween [0.7,0,0.84,0]                 |

Handoffs: exit 90 ms leads; per-pair entrance delay 40–60 ms (see
fix 4). Detent 72 px · hard stop 88 px · velocity clamp ×0,5 ±700 px/s
· lift shadow = f(drag): x 0→12 px ⇒ alpha 0→0.14/0.10. Speed toggle
is honest physics: k×s², c×s (same curve, half the clock); tweens and
delays ÷s.

## Reduced motion

Every layoutId becomes `undefined` (no morphs, no tick flight, no
numeral stations — each station renders in place), the camera sets y
instantly (the station handoff still fires synchronously), drag is
disabled entirely — rows are plain click targets with swapped hint
copy ("välj a–e — tryck för att svara") — and every spring/tween
collapses to `{duration: 0}`. Opacity-or-nothing.

## Settle-verification method

Every key element carries a `data-probe` attribute. The Playwright
driver walks the full flow twice: once at 1× with real mouse drags,
once in a `reducedMotion: 'reduce'` context (which renders the same
states with zero animation — i.e. true static layout). At eight
checkpoints (hem, öva, drill-q1, each verdict, klart, hem-again) it
waits for every probe rect to be stable for 10 consecutive frames
(mouse parked at 5,5 so no hover nudge pollutes the record; probes on
invisible nodes — e.g. an exiting scene AnimatePresence retains at
opacity 0 until the shared-layout crossfade rests — are skipped), then
records `getBoundingClientRect` per probe and diffs the two passes.
Result: **all probes within 1 px; worst drift 0.03 px**
(drill/row-0-0). So every settle lands exactly on static layout.

## Verification

Driven end-to-end with Playwright chromium against a throwaway vite
entry on :5197 (deleted before commit): full 1× walk with a real mouse
drag past the detent on q1 (pause at the armed stop, flick release —
velocity inherited into the verdict morph, printed in the regi panel),
click path on q2 (wrong → strike dries, ✓ rätt svar on the correct
row, due rolls up), keyboard path on q3 (repetition right → due rolls
down); the pan-then-handoff to Klart; Klart→Hem card fold-back. An
interruption pass (rail nav mid-morph redirects in flight; a drag
released before the detent seats home; a pan interrupted right after
Nästa). A 0,5× pass (mid-flight morph and verdict frames). A
reduced-motion pass (full walk on clicks only). 32 key frames in
`screenshots-arket-b/` (repo root). No console or page errors across
all passes. Gates: `tsc -b --noEmit` and `biome check` pass.

# MotionArketRedigerad — round 4 (MOTA1 · Arket, redigerad)

Round 4 of the motion bake-off. The owner's round-3 verdict: **F2
"Arket" wins as the base** (total continuity) **plus F4 "Greppet"'s
drag-to-commit**, with a mandate to improve the combination toward
"SOTA, clean and modern — not a powerpoint-looking janky mess."
This variant's method is **refinement by subtraction**: every Arket
move was interrogated against the twentieth repetition of a drill
loop, and everything that performed rather than carried was cut.

## The editing rule

Continuity stays where it IS the meaning — the material: the day-card
that becomes the Klart panel, the ribbon the camera pans, the rail
tick, the door word, the one due numeral, the picked word that becomes
the verdict. Continuity is cut where it was demonstration — objects
flying to prove the system can fly them.

## What was CUT from Arket, and why

1. **The Öva word's third station** (36 px headline → 11 px drill
   eyebrow). A word shrinking to an 11 px eyebrow reads as a flying
   speck, and the scale-down is exactly where text shimmers mid
   transform. The word keeps ONE morph — day-card row (17 px) → Öva
   headline (36 px), the door opening — and in the drill the eyebrow
   simply prints.
2. **The due numeral's third station** (drill header → the Klart
   sentence). A numeral threading itself into running prose is a demo
   flex; at Klart the count is information, so it prints as prose
   (plain ink — the accent numeral stays in the header, so the accent
   law needs no flight to hold). Two stations remain: rail ↔ drill
   header.
3. **Every tork stagger cascade.** F2 dried content in per-row +30 ms
   steps and built verdicts in four beats (0.08/0.12/0.18/0.22) —
   element-by-element builds are the slide-deck failure mode. Now a
   scene dries in ONE beat (the 180 ms scene fade IS the ink drying;
   no inner entrance animation at all) and the verdict has exactly
   TWO: the word lands, then gloss + queue note + action dry together
   (+80 ms).
4. **From Greppet:** the hover nudge (+3 px — motion on things that
   didn't change), the UI "ankomstfart" label (physics honesty belongs
   in the regi panel, not product copy), and the pathLength check
   (Arket's marks dry, they are never drawn).
5. **Slower paper.** remsan k240 c30 m1.15 → **remsa k300 c36 m1** and
   arket k320 c36 → **ark k420 c42**: same material feel, but the pan
   settles ~420 ms and morphs ~300 ms, inside the ≤700 ms verdict +
   handoff budget.

## What was KEPT

- **The ribbon** — Arket's core. All three questions + the Klart panel
  are one strip; "Nästa" pans the camera; verdicts stay physically
  above you; the next question is interactive from the pan's first
  frame (it never unmounted).
- **Row → verdict morph** (`a1-q{i}-w{j}`) — the picked word leaves
  the list and BECOMES the verdict headline; siblings close up in one
  veck gesture while receding to 0.45 opacity (Sättningen's negative
  space, grafted in — dimming is calmer than four rows individually
  "reacting").
- `a1-kort` (Hem day-card ↔ Klart panel), `a1-ord` (ledger code →
  drill header), `a1-tick` (rail tick FLIP), `a1-due` (two stations),
  `a1-ova` (one morph), DigitRoll on count changes.

## The drag-commit spec (Greppet in Arket's material)

- The row is paper under the finger: `drag="x"`, constraints
  [0, 88 px], detent at **72 px**, elastic `{left: 0, right: 0.04}` —
  the wrong direction refuses.
- **At rest the page is clean print.** The groove (dotted track) and
  detent tick materialize over the first 14 px of pull
  (MotionValue-mapped opacity, zero re-renders).
- Past the detent the row arms: panel background + `släpp = svara`
  printed on the page BENEATH the paper (fixed to the row slot, right
  edge — it must not travel with the dragged row; when it did, it
  clipped at the fold).
- **Release past the detent → the row you dragged becomes the verdict**
  (Arket's law), and the clamped release velocity (±500, ×0.5 of px/s)
  is injected into that layoutId morph's spring (Greppet's law) — a
  flick arrives hot, a click arrives calm. The regi panel prints the
  inherited velocity.
- Release before the detent → the row springs home on grepp with the
  release velocity.
- **Click (onTap, ignoring drag settles > 4 px) and Enter/Space commit
  the same path with velocity 0.** Reduced motion removes drag
  entirely: rows are plain buttons, hint copy swaps to "tryck för att
  svara".

## Spring table (regi panel shows live)

| name   | k   | c  | m   | use                                        | settles |
| ------ | --- | -- | --- | ------------------------------------------ | ------- |
| ark    | 420 | 42 | 1   | all layoutId morphs (word→dom, kort, ord, tick, Öva) | ~300 ms |
| remsa  | 300 | 36 | 1   | the ribbon pan — paper mass                | ~420 ms |
| veck   | 520 | 42 | 0.8 | rows closing up, digit roll                | ~250 ms |
| grepp  | 620 | 42 | 0.9 | a released row seating (velocity passed)   | ~200 ms |
| tork   | —   | —  | —   | ink drying: 180 ms tween, zero travel      | 180 ms  |
| recede | —   | —  | —   | unpicked rows dim to 0.45: 140 ms          | 140 ms  |

Scene fade 180 ms in / 100 ms out · detent 72 px · hard stop 88 px ·
verdict-morph velocity clamp ±500 (×0.5 of release px/s). Budget:
verdict word settled ~300 ms, gloss + Nästa dry by ~260 ms, pan
settles ~420 ms with the next question interactive from frame one.

## Settle verification (the zero-end-jump method)

Two mechanical checks, both run headless (Playwright chromium,
throwaway vite entry on :5196, deleted before commit), pixels compared
in-browser via canvas ImageData (per-channel tolerance 8):

1. **Animated vs no-animation ground truth.** A second browser context
   with `reducedMotion: 'reduce'` replays the exact same state walk
   (click commits, same answers). Since reduced motion zeroes every
   transition and drops every layoutId, its render IS the static
   layout. Every animated end state was compared against its
   reduced-motion twin: **0 differing pixels at all 7 checkpoints**
   (hem, öva, all three verdicts, klart, hem-return). Any residual
   transform, sub-pixel drift, or late-settling border would show
   here.
2. **Late-frame stability.** Settled states re-captured 500 ms later
   must be byte-identical (no creep, no borders popping a frame late):
   0 differing pixels.

These checks caught two real bugs during development, both fixed:
- **A 44 px camera mis-land**: `panTo` measured `offsetTop` from the
  pre-commit DOM, and the retiring question's Nästa button unmounting
  shrank the ribbon after measurement. Fix: past verdicts keep the
  action row's space reserved (`visibility: hidden` — no reflow at pan
  start, so nothing jumps), and the pan measures after commit (rAF).
- **An AnimatePresence duplicate-key drop** found by the interruption
  pass: re-entering a scene whose old copy was still exiting left the
  page blank. Fix: presence keys carry a nav counter, so a re-entered
  scene mounts fresh (layoutId continuity is unaffected by keys).
  Landed interrupted-hem vs original hem: 0 differing pixels.

## Verification walk

Full flow (Hem → Öva → drill → Klart → Hem) with all three verdict
kinds: q1 **real mouse drag** past the detent with a flick release
(right), q2 **click** path (wrong — strike dries in place, due counts
up), q3 **keyboard** Enter (right repetition — due counts down).
Plus: interruption pass (rail click 90 ms into the hem→öva morph —
redirects in flight, lands pixel-perfect), reduced-motion pass, and a
0,5× pass (honest k×s²·c×s scaling). 24 frames in
`screenshots-arket-a/` (repo root), including mid-drag (06, armed 07),
the word mid-morph to verdict (08), the ribbon mid-pan (10), the Klart
fold-back mid-flight (17), and half-speed morphs (40). No console or
page errors in any pass. Gates: `tsc -b --noEmit` and `biome check`
pass.

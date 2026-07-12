# MotionSpringG — round 3, the ENERGY axis (MOTF3 · MOTF4)

Round 3 of the motion bake-off. Round 2's winner-apparent (MOTB2
"Bläcket 2.0") set the bar: a walkable flow on real interruptible
springs. These two concepts sit at opposite ends of the ENERGY axis —
where does 2026-classy live: in **orchestration** or in **touch**?
Both are the same walkable flow (Hem → Öva → 3 real ORD questions →
Klart. → Hem), both are separate motion *systems*, not Bläcket
parameter tweaks.

## MOTF3 · Partituret — the conducted ensemble

**Thesis.** One scene change = one conducted phrase. Elements don't
get individual delays; they get **voice roles**, and the choreography
is a visible system of who moves when:

- **LEDARE** — the downbeat. Heavy spring, lands first, carries the
  headline + its rule as one gesture.
- **STÄMMOR** — followers on a compressing *accelerando* fan: gaps of
  100 → 65 → 50 → 38 → 30 ms after the leader. The gaps shrink because
  the eye has already locked on — equal stagger reads mechanical,
  compressing stagger reads conducted.
- **KODA** — the folio line, always last (+320 ms), softest spring.

Exits are **counterpoint**: the koda leaves first (0 ms), stämmor
next, the leader leaves LAST (+70 ms) — it hands over while the next
phrase's leader is already entering, so the voices cross mid-air
(screenshot 02, 07). The scene container itself never moves; only the
voices do.

The drill loop is a bar of music: verdict word on the downbeat
(ledare spring), gloss on beat 2 (+140 ms), queue-meta on +220,
the Nästa action on +280 — and between questions sits a **written
breath**: a deliberate 140 ms rest before the new phrase, never dead
air by accident.

### Spring table (regi panel shows live)

| voice   | k   | c  | m   | used for                                  |
| ------- | --- | -- | --- | ----------------------------------------- |
| ledare  | 440 | 36 | 1.1 | downbeat: headline + rule, verdict word   |
| stämma  | 560 | 40 | 0.7 | followers: options, ledger rows, gloss    |
| koda    | 360 | 42 | 1.0 | folio lines, the closing hint             |
| utgång  | —   | —  | —   | tween 120 ms hard-in, counterpoint delays |

Fan: +100/+165/+215/+253/+283 ms · breath: 140 ms · exit counterpoint:
koda 0 → stämmor +24/+48 → ledare +70 ms.

### Three details a casual glance would miss

1. **The fan compresses, it doesn't stagger.** Gaps between followers
   shrink 100→65→50→38→30 ms (accelerando). Linear stagger is the
   template answer; the compression is what makes five rows read as
   one phrase instead of five events.
2. **The leader exits last.** Standard exit choreography empties
   top-down. Here the koda goes first and the LEDARE holds until
   +70 ms — the headline is the last thing to leave, exactly as a
   phrase resolves, and it's still on stage when the next headline
   arrives (screenshot 02).
3. **The breath is written into the score.** Question → question isn't
   exit-then-enter as fast as possible: there is an intentional 140 ms
   rest between the old phrase's end and the new downbeat, and the regi
   panel prints it (`ny fras efter andrum 140 ms`). Rhythm = sound AND
   silence.

## MOTF4 · Greppet — the tactile instrument

**Thesis.** The app as physical instrument: everything important is
grabbable, and **input velocity is never discarded**.

- **Answers commit past a detent.** Each option row drags right; a
  groove + tick materialize only once you pull (at rest the page is
  clean print). Notch at 72 px, hard stop at 88 px; elastic is
  asymmetric (0.04 right, 0 left — the wrong direction refuses).
  Past the notch the row arms (`släpp = svara`); release commits.
- **The verdict inherits your hand.** Release velocity (px/s) is
  clamped and injected as the entrance spring's `velocity` on the
  verdict block — a hard flick makes the verdict arrive hot, a gentle
  release makes it glide. The number is printed next to `Rätt.`
  (`ankomstfart N px/s — ärvd från din hand`) and in the regi panel.
- **The Klart. card tosses with momentum** (>650 px/s) along your
  fling vector with a proportional rotation — and the **Hem scene then
  enters from the OPPOSITE direction** (toss velocity → entry offset,
  clamped ±22 px): the impulse survives navigation.
- **Mass under the pointer**: rows nudge +3 px on hover, compress on
  press; buttons press in and rebound on `massa`.
- **Click and keyboard commit everywhere** (onTap and Enter/Space run
  the same commit path with velocity 0) — gesture is the premium path,
  never the only one. Verified via click on q2 and keyboard on q3.

### Spring table (regi panel shows live)

| spring | k   | c  | m   | used for                                 |
| ------ | --- | -- | --- | ---------------------------------------- |
| grepp  | 620 | 42 | 0.9 | a released row seating (velocity passed) |
| massa  | 700 | 35 | 0.6 | hover nudge, press weight                |
| scen   | 420 | 44 | 1.0 | scene arrival, verdict arrival (+ inherited velocity) |
| kast   | 300 | 32 | 1.0 | the card's momentum exit                 |

Detent 72 px · hard stop 88 px · toss threshold 650 px/s · verdict
velocity clamp ±900 px/s (×0.6 of release).

### Three details a casual glance would miss

1. **The groove doesn't exist until you pull.** At rest every row is
   plain Boksidan print; the dotted track and detent tick fade in over
   the first 14 px of drag (MotionValue-mapped opacity, no re-render).
   The instrument reveals its mechanics under the hand, not before.
2. **The check is velocity-grounded too.** The correct row's SVG ✓
   draws with `pathLength` whose spring receives an initial velocity
   derived from px/s — a flicked answer literally draws its check
   faster than a clicked one.
3. **Rätt returns your number.** The `ankomstfart N px/s` label next to
   the verdict is the actual clamped release velocity that was fed to
   the entrance spring — the UI shows its physics honesty instead of
   claiming it (click path honestly prints 0-ish).

## Shared discipline

- ADHD-PI: motion confirms causality, nothing loops or idles; F3's
  longest phrase settles < 400 ms and options are clickable from first
  paint; F4's drill is interactive instantly.
- `useReducedMotion`: F3 drops to pure opacity (no fans, no breath as
  motion); F4 removes drag entirely — rows become plain click targets
  with swapped hint copy, the card gets "tryck för att lägga undan".
- transform/opacity only (+ `pathLength` on F4's check); the 0,5×
  toggle scales stiffness×s², damping×s (same damping ratio, half
  clock), delays and tweens ÷s.
- Accent law: accent pixels remain the active ToC row + the due-count
  numeral only. Neither concept's motion adds accent.

## Verification

Driven with Playwright chromium against a throwaway vite entry on
:5197 (deleted before commit): full F3 walk (right/wrong/repetition
verdicts, digit roll, half-speed replay), F3 rapid-nav interruption
(redirects in flight, screenshots 10–11), full F4 walk with real
mouse drags (detent arm, fast-release velocity inheritance, click
path, keyboard path, card toss v≈2700 px/s and opposite-side Hem
entry), F4 interruption pass, and a `reducedMotion: 'reduce'` context
across both. 26 key frames in `screenshots-spring-g/` (repo root).
No console or page errors across all passes.

# KlartBakeoff — W2, the "Klart." payoff bake-off (K1 / K2 / K3)

The A2 Arket system's standing rule is discipline: durations short,
nothing loops, ink dries in place. The owner (ADHD-PI, drills daily
toward 2,0) has earned ONE ritual moment — the Klart. payoff when a
session completes. Three competing signature concepts for that single
beat; each may breathe past 400 ms, once per arrival, never looping.

**Shared law — no reward withheld.** Every concept performs the
*identical* ritual for a clean 10-av-10 run and a 7-av-10 run (toggle
on each stage). A ✗ is struck / breathed / counted with the same
weight as a ✓, in `--bad` ink. The differentiation lives in the facts
(stats, coda), never in the ceremony. This matters for a daily
dogfood user: if the payoff only fires on perfection, missing two
questions turns the ritual into a punishment and the habit dies.

**Shared plumbing.** The whole route tree renders under RouteScene's
`AnimatePresence initial={false}`, which suppresses mount-driven
`initial → animate` on every descendant (prior motion rounds dodged
this by verifying on throwaway vite entries). All three beats are
therefore STATE-driven: a `go` flag flips two rAFs after (re)mount and
every element animates on that prop change — presence context cannot
veto it. Replay = remount via `key={playKey}`. Reduced motion: `go`
starts true, every transition collapses to `{duration: 0}` —
opacity-or-nothing, mostly nothing. Accent pixels only where they
already live (the till-repetition numeral).

## K1 · Djuptrycket — the press

**Thesis: finality.** The page is already typeset at low ink (0.18) —
the session's facts exist before the ritual acknowledges them. After
260 ms of stillness, *Klart.* is struck into the sheet: the system's
one permitted z-moment (scale 1.14 → 1, ink slapped on in 70 ms on
the exit ease). The page RECEIVES the blow: a single pressure wave
rolls down the sheet at 50 ms per element — each rule and facit row
displaces 2 px (`y: [0, 2, 0]`, 300 ms reading ease) and takes full
ink as the wave passes. One strike, one wave, fully still by ~1.4 s.

- Spring: **slag k380 c26 m1.4** — heavy platen, one small recoil,
  settles ~600 ms. Descends from P1 "Anslaget"'s Djuptrycket
  signature (round 1), rebuilt on motion/react and extended from
  "the rules feel it" to "the whole page feels it".
- What earns the long beat: the wave is *consequence*, not
  decoration — every millisecond after the strike is the page
  reacting to something that just happened. Causality all the way
  down, which is the ADHD-safe justification for the length.
- Misses: the wave inks ✗ rows in --bad at the same amplitude. "The
  press certifies the work, not the outcome."

## K2 · Andningen — the exhale

**Thesis: relief.** A drill is a held breath: the reading window
compressed, the fold gradient heavy over the text. At session end
nothing strikes — the page RELEASES. The fold lifts (1.1 s), the
page's own spacing breathes open on one long soft spring, and
*Klart.* surfaces through the paper over 1.3 s — the slowest ink the
system ever dries. Stats then dry in on breath cadence (0.55 / 0.85 /
1.15 s), facit rows follow at 50 ms intervals, the coda closes with
"Andas ut — passet är fört till boken."

- Spring: **andning k52 c15 m1.5** — deliberately far outside the
  Arket table (softest house spring is remsan k240): under-damped
  just enough to read as a chest falling, settles ~1.2 s. The
  spacing change is a layout FLIP (transform-only), so the "breath"
  is legal Arket material rearrangement — no margins tween.
- What earns the long beat: for an ADHD-PI user the end of a
  session is tension *leaving*. This is the one concept whose
  emotional register is parasympathetic — no percussion at all.
  Risk (owned): it is quiet enough that on a noisy day it may read
  as "nothing happened"; that is the thesis, priced in.
- Misses: the exhale is unconditional — the release IS the reward,
  and it happens because you finished, not because you were right.

## K3 · Räkenskapen — the tally

**Thesis: accumulation.** No number is announced; it is EARNED in
front of you. One facit row inked per question at counting-house
cadence (90 ms) while the running sum ("N av M") ticks in the same
hand. When the last mark lands, the bookkeeper's line draws itself
under the column (scaleX 0 → 1, origin left, 320 ms), and only then
does *Klart.* seat beneath the settled total. Total beat ≈ 1.4 s for
a 10-question pass (scales with session length — honest bookkeeping).

- Springs/tweens: tick 90 ms per row (dry-in 120 ms), rule 320 ms
  reading ease, Klart. seats on **sats k480 c40 m0.8** — the Arket
  *veck* numbers on purpose: the ceremony ends by handing control
  back to the house physics.
- What earns the long beat: the duration is *literal* — it is the
  session being counted, one question per tick. The user watches
  their own work become the score; nothing is padding.
- Misses: a ✗ is a mark counted with the same hand as a ✓ — the
  ledger is honest, the rule draws regardless, Klart. seats
  regardless. 7 av 10 gets the full ceremony.

## Verification

Driven on the real `/dev/motion-bakeoff?dev=1` route (vite :5192,
authed Playwright chromium, `hpc-welcomed=1`), both runs per concept,
frame-captured through each signature beat plus a scrolled K3
signature pass — 53 frames in `screenshots-klart/` (repo root). No
console or page errors. Gates: vitest 592 green, `tsc -b --noEmit`,
biome clean on both touched files. `routeTree.gen.ts` unchanged (no
new route — chips added to the existing bake-off page).

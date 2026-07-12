# MotionSpringF — round 3, the RESTRAINT axis (MOTF1 · MOTF2)

Round 3 of the motion bake-off. Round 2's winner-apparent MOTB2
"Bläcket 2.0" sits mid-axis: visible pen-physics, one shared element.
These two concepts occupy the axis's opposite ends — both the same
walkable flow (Hem → Öva → 3 real ORD questions → Klart. → Hem) on
motion/react, both with regi panels and honest 0,5× time-scaling
(stiffness×s², damping×s — same curve, half the clock), and both are
distinct SYSTEMS, not parameter tweaks of Bläcket.

## MOTF1 · Sättningen — the disappearing spring

**Thesis.** In a finely set book you never see the typesetter's hand —
only the quality. Motion at the threshold of perception: nothing
travels more than 6 px, every spring settles in 110–220 ms, and all
meaning is carried by *timing relationships* — what leads, what
follows, by how many milliseconds — and by what *recedes*. No shared
elements, no drawn marks, no gestures: those are all visible. The 0,5×
toggle exists to prove the motion is there at all.

**Spring table**

| name   | k    | c  | m    | use                                   | settles |
| ------ | ---- | -- | ---- | ------------------------------------- | ------- |
| ansats | 1100 | 68 | 0.7  | entrances, 4 px rise                  | ~150 ms |
| kvitto | 750  | 48 | 0.85 | the verdict rise, 6 px — max budget   | ~220 ms |
| snitt  | 1500 | 80 | 0.6  | micro: digit blip, tap release        | ~110 ms |
| ut     | —    | —  | —    | exits: 70 ms tween [0.7,0,0.84,0]     | 70 ms   |
| dis    | —    | —  | —    | the recede (dim to 0.38): 120 ms      | 120 ms  |

Lead/follow in 30 ms ordinal steps (`Sats step={n}`); scene entrances
begin 40 ms into the 70 ms exit — instant-feeling, never a cut.

**Three details a casual glance would miss**

1. **The motion budget is a hierarchy, and the verdict sits on top.**
   Everything in the system settles under ~150 ms and 4 px except one
   thing: the verdict word, which gets 6 px and ~220 ms (kvitto). The
   discipline is the answer to "at what velocity does confirmation
   become distraction?" — the budget is spent exactly where causality
   needs confirming and nowhere else.
2. **Wrong options never move — they withdraw.** On grading, the three
   irrelevant rows dim to 0.38 opacity in 120 ms while the ✓/× letter
   swap and the semantic colors switch *with no transition at all*
   (instant is confident). The verdict's negative space carries as much
   meaning as its rise.
3. **The rail tick never travels, and neither does the numeral.** Nav
   changes are out-leads-in-follows opacity (out 70 ms, in +40 ms):
   attention moves, ink doesn't. During the drill the rail's due
   numeral recedes so only ONE accent numeral is ever visible — the
   accent law held by omission rather than by flight.

## MOTF2 · Arket — total continuity

**Thesis.** One sheet of paper, never torn: nothing appears or
disappears — every scene change is the same material rearranging.
Arket's first law inverts Bläcket's: **marks never move — the paper
moves; ink only dries** (opacity, zero travel).

**Spring table**

| name   | k   | c  | m    | use                                       |
| ------ | --- | -- | ---- | ----------------------------------------- |
| arket  | 320 | 36 | 1    | all layoutId morphs: anchors + surfaces    |
| remsan | 240 | 30 | 1.15 | the ribbon pan — paper has mass            |
| veck   | 480 | 40 | 0.8  | in-place layout shifts (rows closing up)   |
| tork   | —   | —  | —    | ink drying: ✓, strike, glosses — 240 ms tween, zero travel |

**Shared-element inventory** (all under one `LayoutGroup`)

- `ark-ova` — the word "Öva": Hem day-card row (17 px) → Öva headline
  (36 px) → drill eyebrow (11 px), and back on return.
- `ark-ord` — the ORD ledger code → the drill header's ORD.
- `f2-due` — the due numeral's three stations: rail folio → drill
  header → the Klart panel's own sentence. It never stops existing.
- `ark-kort` — Hem's "Dagens pass" card and the Klart panel are the
  same sheet; Klart→Hem folds the panel back into the card.
- `f2-q{i}-w{j}` — the picked option word: the row you touch BECOMES
  the verdict headline; sibling rows close up via layout (veck).
- `f2-tick` — the rail tick FLIP-travels (continuity-native).

**Three details a casual glance would miss**

1. **The drill is one ribbon, not three screens.** All three questions
   plus the Klart panel are a single strip; "Nästa" pans the camera
   (remsan — measured `offsetTop`, springed y). Questions never
   unmount, so your verdicts remain physically above you on the paper
   — visible mid-pan (screenshot f2-08) with q1's gloss sliding off
   under the fold. Only the active question exposes controls; past
   verdicts are marks, not buttons.
2. **The strike never travels here.** In Bläcket the strike springs
   across with pen momentum; in Arket the picked word travels down to
   the verdict slot and THEN the strike dries onto it in place
   (tork, 240 ms opacity). Same verdict, opposite ontology — motion
   belongs to material, never to marks.
3. **The Klart numeral is a third station, not a copy.** When the
   ribbon reaches the Klart panel, the header's numeral slot empties
   and the same layoutId lands inside the summary sentence ("… 14 kvar
   i repetitionskön") at body size — then flies back to the rail folio
   on the way home. Every accent pixel across the whole flow is one
   continuously-tracked object.

## Shared discipline

- ADHD-PI: motion confirms causality only; nothing loops or idles;
  both flows feel instant-or-faster than cut navigation (F1 by
  threshold, F2 by never leaving the material).
- `useReducedMotion`: every factory collapses to `{duration: 0}`; all
  layoutIds become `undefined` (no morphs, no ribbon pan travel, no
  tick flight); everything falls back to opacity-or-nothing.
- transform/opacity only; the single decorative gradient (F2's reading
  fold) is static, not animated.
- Interruption: rapid nav mid-transition redirects in flight in both —
  F1 because 110–150 ms springs barely have time to be interrupted,
  F2 because layoutId morphs retarget (screenshots f1-04, f2-15/16).
- Accent law: accent pixels remain the active ToC row + the one due
  numeral; verdict color is semantic --ok/--bad ink.

## Verification

Driven end-to-end with Playwright chromium (throwaway harness on port
5196, deleted before commit): full walk of both flows with right,
wrong, and repetition verdicts; an interruption pass (rapid nav
mid-morph); a 0,5× pass; and a `reducedMotion: 'reduce'` context pass.
30 key frames in `screenshots-spring-f/` (repo root), including
mid-flight morphs (f2-02, f2-06, f2-13), the ribbon mid-pan (f2-08),
and F1's sub-threshold handoffs. No console errors. Gates:
`tsc -b --noEmit` and `biome check` pass.

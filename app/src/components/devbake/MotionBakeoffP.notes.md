# MotionBakeoffP — print-lens motion languages (designer notes)

Two complete motion systems for Boksidan, both answering: *what would motion
look like if a typeset page could move?* Deliberately opposed on every axis —
press vs. flow, discrete vs. continuous, vertical vs. lateral.

## MOTP1 · Anslaget (the impression)

- **Thesis:** on a letterpress nothing travels — the forme is locked and the
  platen comes down. Every element is *pressed* into its final position:
  opacity plays ink density, a minute scale settle (1.02 → 1) plays the kiss
  of the platen. Percussive and discrete.
- **Physics metaphor:** letterpress impression — pressure, not movement.
- **Vocabulary:** `press` (240 ms kiss) for body content; `stamp` (300 ms,
  overshoot + kiss-back) for words that judge; grading is an *over-stamp* — a
  second colour pass landing exactly where the pick did; door changes ink the
  old page out and press the new one in; the bokmärke never travels, it is
  stamped at the new slot.
- **Signature:** *Djuptrycket* — "Klart." struck deep (1.22 → 0.97 → 1,
  620 ms, the system's one long beat) while the rules below visibly *receive*
  the press with a one-time 2 px reaction nudge. The page is a material.

## MOTP2 · Bläckets väg (the ink's path)

- **Thesis:** ink is liquid — it travels along the page's own structure and
  never jumps. Lateral, continuous, linear propagation.
- **Physics metaphor:** ink flow — rules draw themselves (scaleX), text wicks
  in behind an advancing edge (clip-path, used only on the two display
  words), colour pours down the option's indicator rail (scaleY from top)
  before the verdict is written, and the margin ribbon physically *runs* down
  the spine to the new door — the system's one travelling object, because ink
  in a gutter really does run.
- **Vocabulary:** `draw` (300 ms rule), `flow` (280 ms text along the ink
  direction), `pour` (200 ms verdict rail), `ink` (360 ms display-word wick),
  `soak` (240 ms row tint).
- **Signature:** *Räkneverket* — the folio numeral rolls like a mechanical
  counting wheel (masked digit drum on translateY, 480 ms). Progress is felt
  as machinery advancing, not text replaced. The due-count drum is the accent
  numeral — accent's one lawful home outside the nav marker.

## Shared discipline

- transform/opacity only; clip-path twice, deliberately.
- All beats 140–360 ms except each signature's single longer moment
  (620 ms / 480 ms). Zero looping motion anywhere.
- Accent appears only on the active-door bokmärke and the one due-count
  numeral — motion introduces no new accent usage.
- Scoped `prefers-reduced-motion` block collapses every keyframe to nothing
  (all entrances animate from hidden to the natural resting state, so
  `animation: none` lands on the final frame) and zeroes the two transitions;
  the global index.css wildcard is a second net.
- Every board has a mono REPLAY button (key-bump remount) so each moment can
  be re-triggered at will; the verdict boards reset to unanswered.

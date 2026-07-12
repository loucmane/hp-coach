# MotionBakeoffC — craft lens (C), two motion languages

SOTA product-motion grammar (orchestrated staggers, exit-before-enter,
FLIP/shared-element continuity, confident easings) translated into
Boksidan's print idiom. Both systems: transform/opacity only (clip-path
sparingly), 150–400 ms with one longer signature beat, no loops on study
surfaces, accent only where it already lives, and a built-in
`prefers-reduced-motion` block that collapses every animation to a 1 ms
opacity fade and kills every transition.

## MOTC1 · Trycket

- **Thesis:** the letterpress. Every arrival is weight meeting paper —
  a decisive impression, then a settle. No bounce anywhere; only
  `--ease-reading` and `--ease-exit`.
- **Physics metaphor:** mass + damping. The page is heavy; motion is
  pressure, and stillness is the resting state.
- **Grammar:** rules draw left→right (inked forme); the headline
  settles by drawing together (`scaleX 1.03→1`, the house
  letter-spacing settle re-cut in pure transform); ledger rows are
  pressed onto their freshly drawn rules; verdicts are STAMPED
  (`scale 1.16→1`); navigation is exit-before-enter (150 ms out,
  then 300 ms in) around a spine hairline that never moves.
- **Signature:** *Arkvändningen* — a 560 ms clip-path leaf-turn with a
  traveling page edge and a folio change. The book's only slow gesture,
  reserved for major context changes (pass start, provpass, Klart).

## MOTC2 · Bläcket

- **Thesis:** the writing hand. A light pen, not a heavy press —
  content is written in from the left margin, marks are drawn where
  your action landed. Spring overshoot (`--ease-spring`) belongs to
  small marks only, never to the page.
- **Physics metaphor:** low mass + spring. A nib flicks, overshoots a
  hair, settles; the paper itself never springs.
- **Grammar:** blocks write in (`translateX(-10px)`, top-down stagger);
  dot leaders and verdict words are drawn via clip-path reveal (the nib
  crossing the paper); the corrector's ✓ is drawn at the right row and
  the strike springs across the wrong one; in the ToC, ONE ink tick
  travels between rows with a spring (FLIP) instead of markers blinking
  on/off.
- **Signature:** *Siffran följer med* — the due-count numeral (the
  chrome's one accent object) lifts off the rail's ToC folio and lands
  as the Öva page's headline stat, 520 ms spring, once. Shared-element
  continuity with zero new accent usage.

## What separates them

Trycket moves the **page** (columns, leaves, blocks — heavy, damped,
orchestrated); Bläcket moves the **marks on the page** (ticks, checks,
numerals — light, sprung, singular). Trycket confirms causality by
weight; Bläcket confirms it by authorship — you watch the mark being
made where you acted.

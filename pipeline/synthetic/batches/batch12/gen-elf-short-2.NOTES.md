# gen-elf-short-2 — "Within Tolerance" (batch 12)

**Block format:** `short_text_1q` · **Genre:** science_journalism · **Spelling variety:** BrE (`metres`, `mould`, `catalogues`)
**Family:** ELF-TYPE-002 (inference / implication) · **Key:** C

## Why this topic and this cut of it

"Why golf balls have dimples" is the exact shape law 1 warns about: the drag /
boundary-layer story is famous enough that any item testing it could be answered
without reading. So the passage **never states the mechanism at all**. It starts
one step downstream, inside a fictional test tunnel, and asks a manufacturing
question instead: given that dimples work, does the *advertised pattern* matter?
The tunnel's answer is that depth is what the instruments register, that twelve
microns of depth sits inside the drift of a mould across one production run, and
that two balls from the same box can therefore separate further than two rival
designs do on paper. Nothing in that is retrievable from prior knowledge.

Kilnbeck, Jorunn Steinvik and Halvard Ekstrand are invented, as is the
twelve-micron figure. The sleeve counts 332 / 392 are generic trade numbers, not
a quotation of any manufacturer's copy.

Deliberate residue (law 9): the laser gate, the ninety-metres-a-second figure
and the sleeve numbers are never tested. Steinvik's stance is deliberately
*hedged and unresolved* — she declines the tidy conclusion ("will not go so far
as to call the arrangements decorative") and concedes that hexagonal packing
"does buy a little … at the margins", which is what makes the overshoot
distractor (D) killable.

## Trap architecture

Stem: *What is implied about the dimple patterns that ball makers advertise?* —
attested implication form. It names the subject without pointing at the size or
direction of the effect, so it does not entail the key.

| opt | role | mechanism |
|---|---|---|
| A | too_far (two-step leap) | monotonic "deeper flies longer"; the text establishes a *threshold* effect (twelve microns shallower ≈ no dimple) and never compares flight lengths at all — but the leap is the natural one a reader makes from a depth finding |
| B | reversed relationship | mould wear is in the passage as the *source* of the variation that swamps the design, never as a design criterion; nothing is said about how makers choose patterns |
| **C** | **key** | one_inch_inference: twelve microns inside a single run's mould drift + "two balls lifted from the same box can differ more … than two rival designs differ on paper" → the advertised difference is smaller than the unadvertised one |
| D | quantifier_upgrade of the quoted hedge | pushes Steinvik's careful refusal into "no bearing"; she explicitly declines that and grants hexagonal packing "a little … at the margins" |

## Self-blind-solve

Argued each option from the passage alone. **D** is the strongest rival — the
piece's whole drift is deflationary and a skimmer hears "the patterns don't
matter" — but the writer plants an explicit concession precisely so that the
absolute reading is refutable, and D is the option that ignores it. **A** is the
second rival: depth is stated to matter, so "deeper is better" feels licensed,
but the text only says a *shallower* dimple stops working, which is a floor, not
a gradient, and no flight is measured. **B** inverts the role mould wear plays.
**Single defensible answer; no rewrite needed.**

Test-wise checks: two options are hedged ("tend to" in A, "can be" in C) and the
only absolute sits on a distractor ("no bearing", D), so neither
"strip-the-absolutes" nor "pick-the-qualified" isolates the key. The key is 15
words against 16 / 16 / 15 — joint-shortest, not the longest. All four options
open with "That" and are grammatically parallel.

**Cross-unit check (this unit vs gen-elf-short-1):** the two short units assert
different propositions in different registers, and their keys are deliberately
of opposite character — short-1's key is the confident, specific claim among
four confident options; this one's is the measured claim in a set that also
hedges a distractor. Neither unit's options corroborate or reveal the other's
key, and the cloze shares no proposition with either.

## Bands (measured)

passage 147 words (short_text band 101–368; blueprint target 105–160) ·
1 paragraph (0–8) · 6 sentences, mean 24.5 words (12.0–47.2) · prompt 11 words
(reading 3–30) · options 15–16 words (0–31) · option ratio 1.07 (cap 2.36).
`run_mech.py`: M-SCHEMA / M-BANDS / M-TELL / M-FORM / M-PLAGIARISM all **pass**.

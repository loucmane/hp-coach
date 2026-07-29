# gen-elf-short-1 — "Room at the Corner" (batch 13)

**Block format:** `short_text_1q` · **Genre:** history_essay (engineering history) · **Spelling variety:** AmE (`pressurized`, `millimeter`, `airplane`)
**Family:** ELF-TYPE-002 (inference / implication) · **Key:** C

## Why this topic and this cut of it

Assigned topic: why airplane windows are round. The danger here is law 1 — the
stress-concentration story is the single most famous fact in the field, and a
passage that simply retells it yields an item any informed solver answers
blind. So the standard account is named in sentence 2 only as *the place most
accounts stop*, and the passage's payload comes from an invented fatigue-rig
collection: the panels that failed first were not the squarest but the
roughest-cut, "whatever the shape". The curator's reading — a generous radius
"mostly buys tolerance" — reframes the rounding as a manufacturing margin
rather than a shape law. That claim is not stateable from outside knowledge,
and the well-informed solver's prior is routed straight into distractor A.

The passage does not refute the load-path explanation, which would be its own
kind of tidiness (law 9); Ojala restates the mechanism ("it spreads the load
over enough metal") while shifting what it buys. Residue the item never
touches: the 1950s hand cutting, the stray scratch, the rivet a millimeter off.

## Trap architecture

Stem: *What is implied about the rounded corners of cabin windows?* — the
attested "What is implied about …" form. It names the object (rounded corners)
without entailing anything about what they do, so the stem does not leak.

| opt | role | mechanism |
|---|---|---|
| A | quantifier_upgrade + outside-knowledge prior | "will always fail sooner" — the textbook belief absolutized; the rig data sort failures by edge finish, not squareness ("the ones that failed first were not the squarest"). This is the trap for the solver who arrives knowing the history |
| B | outside_knowledge | plausible industrial consequence (hand cutting abandoned once rigs showed what mattered) that the passage never states; it borrows the passage's own causal shape to feel licensed |
| **C** | **key** | one_inch_inference: rough edges decided the early failures + a radius "mostly buys tolerance" so a poor finish "no longer decides how long the panel lives" + square windows "left the shop floor no margin" ⇒ the rounding earns its keep by forgiving imperfect work |
| D | too_far + surface_word_match | picks up "most accounts stop" and turns it into a refutation; the passage complicates the load-path account and Ojala's explanation *is* that mechanism, so "could not confirm" overshoots |

No distractor is a faithful restatement of a passage sentence: A carries an
absolutizer plus a contradicted ranking, B an unstated event, D a claim the
passage's own quotation contradicts.

## Self-blind-solve

Argued all four from the passage alone. **A** is the strongest rival by prior
knowledge alone and is killed by one clause in the passage ("were not the
squarest"). **D** is the strongest rival by reading, and dies on Ojala's
"spreads the load over enough metal" — the tests confirm the mechanism, they
only re-price what it delivers. **B** has no sentence behind it in either
direction. **Single defensible answer; no rewrite needed.**

Test-wise checks: the key is the confident, specific claim of the set and the
only absolutizer ("always") sits on a distractor, so neither "pick the qualified
option" nor "strip the absolutes" locates the key — this unit deliberately
carries the confident key against the batch's cloze-and-gist siblings. Key 17
words against 19 / 16 / 14; joint-second under mech tokenization (19/17/17/16),
never the longest. All four options open with "That" and are grammatically
parallel.

## Bands (measured with `mech.py`)

passage **157 words** (short_text band 101–368; blueprint target 105–160) ·
**1 paragraph** (0–8) · 7 sentences, mean **22.4 words** (12.0–47.2) · prompt
10 words (reading 3–30) · options 16–19 words (0–31) · option ratio **1.19**
(cap 2.36).

**`run_mech.py` self-check: M-SCHEMA / M-BANDS / M-TELL / M-FORM /
M-PLAGIARISM all pass.**

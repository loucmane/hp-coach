# gen-las-short-2 — "Staket löser sällan det som gnisslar i parken"

**Topic (batch10 exclusive):** hundrastgårdar och stadens delade ytor.
**Unit type:** LÄS short (2 questions). **family:** `hundrastgardar-delade-ytor-debatt-short`.

## Genre and topic rationale

`sakprosa / debatt_opinion`, opening move = framing-claim, first person present,
normative modality (*bör*), explicit stance with a genuine concession. Nearest
batch 1–9 neighbours are the benches/urban-seating unit and the
playground-surfaces unit; both are about the *material* of a single urban object,
whereas this unit is about **allocation between user groups** and about
municipalities measuring the wrong quantity. The hedgehog/allotment unit is
animal-adjacent but ecological, not a question of shared civic space. No overlap
in mechanism, vocabulary or argument shape.

The angle was chosen for the same reason as unit 1: an argumentative frame that
can carry a counter-intuitive empirical result. Here the result is that *where*
an enclosure is placed dominates *how big* it is, and that at the poorly placed
sites the complaints did not disappear but **moved to other times of day**. That
last detail is a one-word hinge, which funds the unit's hardest distractor.

Against manufactured tidiness (law 9): the researcher explicitly refuses the
conclusion the writer would like ("drar inte slutsatsen att inhägnader är fel"),
names her sample as small, and admits a variable she could not measure at all
(people who stopped visiting the park). The writer then concedes real reasons to
fence — a child's fear, a person afraid of dogs having a right to a bench — and
resolves not into "no fences" but into "better placed fences". The passage ends
signed, not on a flourish or a question.

**Frame:** title in the `title` field only; byline `— Elias Vretberg,
landskapsarkitekt` last inside `passage`; one glossary entry (`restyta`) for a
word that does occur in the text. All entities fictional: Hedvig Almstierna,
Elias Vretberg. No famous thesis is anchored — in particular the passage does
**not** lean on any commons/shared-resource thesis a knowledgeable solver could
answer from; the argument is built entirely from the invented inventory.

## Planted targets

- **P2 finding** (hedged, directional, scoped): enclosures at the park edge, next
  to a route people already walked, were used several times as much as those on
  leftover ground behind car parks or noise barriers; size mattered *less than
  expected*; at the weakly used sites the complaints did **not** fall — they
  moved to other times of day. Direction (placement → use), the secondary
  variable (size), and the displacement's dimension (time, not place) are three
  separately invertible hooks.
- **P3 caveats**: six municipalities is a small sample; one variable was
  unmeasurable; the municipalities have counted fences instead of measuring use.
- **P4 stance and concession**: an enclosure is a way of *allocating* a surface;
  built where nobody goes, the allocation has only been drawn on a map. The
  concession (there are good reasons to fence) is strong enough to be weaponised.

## Trap architecture

**Q1 — `detalj_ospecificerad`** ("Vad framkom … i Almstiernas inventering …?"); key **A**.
- B `reversed_causality` — the arrow flipped: the edge enclosures were put there
  *because* dog owners already gathered. Genuinely tempting, since the passage
  does mention a route people already walked; but that clause locates the
  enclosure relative to an existing path, it does not report that municipalities
  followed users.
- C `surface_lexical_echo` with a one-word distortion — complaints moved to other
  **places in the city** rather than other **times of day**. The hardest option
  in the unit: everything else in the sentence is right, and a reader who skims
  the clause keeps the shape and loses the dimension.
- D `overgeneralisation` — complaints ceased *entirely* in *all* parks; directly
  contradicted by the sentence saying they did not fall at the weakly used sites.

**Q2 — `huvudbudskap_syfte`** ("Vilket påstående överensstämmer bäst med texten?"); key **D**.
The key must span all four paragraphs: the standard answer counted in fences (P1),
placement as the decisive variable (P2), municipalities measuring the count rather
than the use (P3), and "better placed enclosures, not more" plus the allocation
between claimant groups (P4). Each distractor spans at most one paragraph and
carries an identifiable flaw (law 11 — nothing here is verbatim-true):
- A `overgeneralisation` — pushes the stance past the concession into a blanket
  ban the writer explicitly disowns, and absolutises the displacement finding
  that the text limits to the weakly used sites.
- B `detail_as_main` with a shifted quantity — "saknade betydelse" for "betydde
  mindre än väntat", and the size observation is a sub-point beside the placement
  argument in any case.
- C `plausible_worldknowledge` — densification and shrinking green space per
  inhabitant is the standard real-world explanation for conflicts over urban
  surfaces, and reads as the "mature" answer; the passage never invokes it and
  explains the conflict through allocation and use instead.

**Hedge balance (law 10, M-FORM):** Q1's key is the **confident, specific** claim
("betydligt mer") while two of its distractors are measured in form (B, C) and
only D is absolute. Q2's key is measured, but so are distractors B and C. So the
"qualified option" and the "correct option" do not correlate across the unit —
strip-the-absolutes answers neither question. M-FORM passes.

**Length tell (M-TELL):** key is never the single longest option (Q1 longest = D
at 18 tokens vs key 17; Q2 longest = A at 17 vs key 15). M-TELL passes.

## Self-blind-solve

Solved both from the passage alone, arguing actively for each non-keyed option.

- **Q1 → A, single.** The inventory's stated result is the placement contrast; A
  paraphrases it (using the glossary's sense of *restyta* rather than the word).
  B asserts a direction the passage never reports. C is refuted by "andra tider
  på dygnet" — I read the sentence three times specifically to try to defend C,
  and it cannot be defended. D is refuted by "minskade dessutom inte". No second
  defensible reading.
- **Q2 → D, single.** Only D holds at the whole-text altitude. A is the
  prescription the writer disowns in the same paragraph in which he states his
  own. B is both mis-quantified and one paragraph wide. C is unsupported
  anywhere. No second defensible reading; in particular no distractor is a true
  detail dressed as a summary.

## Mechanical self-check (run_mech.py, corpus `data/parsed`)

M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-PLAGIARISM pass.
Passage 315 tokens (short band 188–588), 21 sentences, mean 15.0 words
(band 10.1–36.5), 6 paragraphs; sentence lengths range 4–30 tokens. Option
lengths 15–18 tokens (band ≤23); option-length ratio well inside 5.25.
Key letters spread A / D.

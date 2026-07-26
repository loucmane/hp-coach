# gen-elf-short-2 — "Deep-End Blue" (ELF short_text_1q)

## Topic / genre rationale

**Topic:** why swimming pools look blue. The passage rejects the two folk
explanations (sky reflection, blue tiling) with a single counter-case — a
windowless hall with a white liner whose water is blue anyway — and gives the
real account: water absorbs red light slightly more readily than blue, the
effect accumulates with path length, and a white liner adds no colour of its own
but doubles the distance the red has to survive.

**Genre:** `science_journalism`, **AmE** (the blueprint pairs science with AmE).
Register is the compact science-desk note: an imperative demonstration opening,
a counter-example, the mechanism, then two short verdict sentences.

**Novelty check against batches 1–9.** The used list contains glacier/ice,
snow/stormwater, folkbadhus/public baths, water cures/spas, and a batch-9 optics
short (stadium mowing stripes). Two deserve comment:

- *folkbadhus / water cures* are social-history topics about bathing culture, not
  about water as a medium; no overlap in mechanism or vocabulary.
- The batch-9 stripes unit is the real neighbour: both are "the pattern/colour is
  not where you think it is" optics shorts. They are kept apart by mechanism and
  by what is tested — stripes turn on *viewing angle and reflection off grass*
  and the item is a TYPE-001 detail retrieval; this one turns on *absorption over
  path length* and the item is a TYPE-006 purpose-of-an-example. Different
  physics, different family, no shared lexis beyond the word "light". Flagging it
  here for the adjudicator rather than hiding it.

**Fictional entities:** the municipal pool at Hallvik, Tova Ingelsson (byline).
No real facility, researcher or study is named, and no famous thesis is invoked
(law 1) — the absorption fact is stated in the passage's own terms and the item
tests the *argumentative role of the example*, not a stateable outside fact.

**Spelling variety: AmE**, held throughout passage and options — *colorless*,
*color*, *colored*, *meters*. No BrE forms (*colour*, *metres*) in any
student-facing string.

## Structure

134 tokens (blueprint short band 105–160; `bands.json` short_text 101–368), one
paragraph plus the byline, 5 sentences, mean 26.8 words with a 9-word verdict
sentence ("A white liner adds no color of its own.") beside two ~40-word
sentences. Concrete residue: two length scales (a glass, two meters), three
candidate causes, one named site with three stated properties.

## Planted trap architecture (q1, ELF-TYPE-006)

Stem: *"Why does the writer mention the municipal pool at Hallvik?"* — the
corpus's purpose form. It names the target and withholds the function, so it
entails nothing about the answer; a passage-blind reader has no way to know what
the example was brought in to defeat.

| opt | role | trap |
|---|---|---|
| A | distractor | **outside_knowledge** — a windowless hall implies artificial light, so a reader can promote that incidental fact into the point; the text never compares artificial light with daylight, nor claims either brings out a tint |
| B | distractor | **surface_word_match + comparison the text refuses** — the white liner is discussed, but only as something that "adds no color of its own"; no blue lining exists in the text and no ranking of liners is offered |
| **C** | **key** | the example's actual function: every property listed ("the hall has no windows, the liner is white, and the water is blue anyway") strips away one of the two borrowed sources named in the previous sentence |
| D | distractor | **plausible real-world belief the passage contradicts** — that chemicals or minerals do the colouring; the text attributes the blue to water's own absorption of red. Also **wrong target**: even granted, Hallvik is offered against the sky-and-tiles account, not against a chemical one |

**Why this is a purpose item rather than a detail item.** A "why is the shallow
end paler" detail item was drafted first and discarded: a physics-literate
solver can answer it from prior knowledge without reading, which is exactly the
outside-anchoring failure law 1 warns about. Asking what the *example* is doing
in the argument has no outside answer — it is recoverable only from the
passage's own sequence (folk explanations → counter-case → mechanism).

**Law-11 discipline.** Although this is not a "most in line with the text" item,
the same rule was applied: no distractor is verbatim-true. B is not merely
irrelevant but asserts a comparison the passage declines to make; D is false on
mechanism *and* wrong on target; A is unstated. Each carries one identifiable,
pointable flaw.

## Hedge balance and length

No option carries an absolutizer, and no option is hedged, so neither
"strip-the-absolutes" nor "pick-the-qualified-answer" scores blind. All four
share the "To show that …" frame — grammatically parallel, no shape outlier.
Option token counts 17 / 18 / 21 / 22, ratio 1.29 (cap 2.36); the key (C, 21) is
**not** the longest — D is. Key letter C, chosen partly to avoid a second
A-keyed short unit in this batch's pair.

## Self-blind-solve result

Read the passage cold, then argued for each option:

- **A** — the hall having no windows is real, but the passage draws nothing from
  it about the *quality* of light; the property is used to remove the sky, not to
  praise the lamps. Not defensible.
- **B** — argued hardest for this, since the white liner does get a mechanism of
  its own. Blocked because that mechanism arrives *after* the Hallvik sentence
  and concerns path length, not a liner comparison; and because the passage says
  a white liner "adds no color", which is the opposite of "brings out more
  color".
- **C** — the three listed properties of the pool map one-to-one onto the two
  discredited explanations. Supported.
- **D** — contradicted by the absorption account, and misidentifies what the
  example is aimed at.

**Outcome: single defensible answer (C).** One rewrite was made before this pass
(the discarded shallow-end detail item, above); nothing changed after it.

## Mechanical self-check

`run_mech.py`: **M-SCHEMA pass, M-BANDS pass, M-TELL pass, M-FORM pass,
M-PLAGIARISM pass** — no findings on any gate.

# gen-elf-long — "The Weight Upstairs" (batch 10)

**Block format:** ELF `long_passage_5q` · **Genre:** science journalism · **Spelling variety:** AmE (held
throughout) · **Arc:** phenomenon → evidence → complication → verdict
**Family tag:** `skyscraper-wind-damping-aerodynamic-shaping-science-journalism-long`

## Topic and genre rationale

Assigned pool: how skyscrapers manage wind — tuned mass dampers and aerodynamic shaping, with
invented towers and engineers. No neighbouring batch-1–9 topic touches tall-building engineering,
wind, or structural dynamics; the closest adjacent items (elevators, submarine cables,
self-healing concrete) are about different objects and different arguments.

The obvious framings were rejected as textbook-anchored (law 1): "dampers stop skyscrapers from
swaying" and "vortex shedding drives crosswind response" are both facts a knowledgeable solver
already owns, and questions built on them are answerable without reading. So the passage is built
on an **invented longitudinal record** instead — Hedda Rask's twelve-year accelerometer program
across nineteen towers in the invented city of Brayle — and its thesis is a comparison that no
reader can bring from outside:

> A damper's benefit **decays but can be restored**; a shape's benefit **does not decay but cannot
> be restored**.

Every number, tower, engineer and byline is fictional (Verrand Tower, the Ossian, the Halberd,
Brayle, Hedda Rask, Constantin Marek, Marcus Ilbery). No real publication is named; the frame is a
credited excerpt with a byline and a two-line glossary, both of which define terms that actually
occur in the passage (`tuned mass damper`, `vortex shedding`).

**Law 9 (no manufactured tidiness):** the passage deliberately refuses its own binary. Paragraph 2
concedes fully that the dampers work as advertised and says so twice; paragraph 4 gives Marek the
strongest version of the opposing case in his own unhedged voice and then takes only half of it
away; paragraph 5 declines to name a winner ("Neither is obviously the safer bet") and ends on
something smaller than a thesis — that the problem has to be *kept* solved. The Halberd's residue
(nobody can notch it now) is left unresolved rather than tied off.

## Planted trap architecture

Block budget followed: 2× TYPE-001, 1× TYPE-002, 1× TYPE-004 at an edge (position 1), 1× TYPE-005
at the other edge (position 5).

| q | family | key | key derivation | distractor traps |
|---|---|---|---|---|
| 1 | ELF-TYPE-004 | B | whole_text_gist — the after-handover asymmetry, not the opening scene | A scope_error/detail-as-main (distorted); C quantifier_upgrade of a half-truth + attribution to Marek; D outside_knowledge (structural safety margins) |
| 2 | ELF-TYPE-001 | A | paraphrase_one_sentence (¶2) | B quantifier_downgrade with a scope flaw; C wrong_location (shifted in time from ¶3); D outside_knowledge (forced-vibration testing) |
| 3 | ELF-TYPE-001 | D | paraphrase_one_sentence (¶3) | A reversed detail (stiffening raises frequency); B outside_knowledge — plausible wear mechanism the text forecloses; C quantifier_upgrade (subset extreme → universal) |
| 4 | ELF-TYPE-002 | C | one_inch_inference (¶4) | A too_literal + wrong attribution; B surface_word_match on "tuned", contradicted; D too_far (land-use policy leap) |
| 5 | ELF-TYPE-005 | A | stance_of_writer_not_quotee (¶4–5) | B direction reversal, hedged in form; C role_or_attribution_swap (Marek's line as the writer's); D polarity overshoot |

**Hedge-balance (law 10).** The correlation between "correct" and "qualified" is broken on purpose:

- **q2 inverts it.** The key is the confident, near-absolute claim ("In all but one of the nineteen
  towers…", licensed verbatim by the passage) and the *cautious-sounding* option B is false. A
  test-wise solver reaching for the measured answer is punished.
- **q5 B** is written to sound exactly as measured as the key, so "pick the balanced stance" decides
  nothing; it fails on direction, not on form.
- **q4 A** was rewritten after the first draft: as a pure literal restatement of the stem's premise it
  was verbatim-true and therefore a second defensible key (law 11's failure mode leaking into a
  TYPE-002 item). It now carries an identifiable flaw — it blames the Halberd's designers for
  choosing the wrong wind directions, where the passage attributes the rise in crosswind response to
  a forty-floor block built upwind afterwards.
- M-FORM clean on all five: no question has an absolutized-distractor sweep around a lone measured key.

**Law 3 / law 11.** No option reproduces a passage sentence. Checked mechanically: **zero shared
6-grams** between any option and the passage (the two that existed in the first draft — "the slender
ones on exposed corners" and "the damper had been set against" — were reworded while keeping the
lure). M-PLAGIARISM against the authentic corpus: pass.

## Self-blind-solve

Solved skeptically from the passage alone, arguing actively *for* each non-keyed option.

- **q1 → B, single.** A is the live one: the gallery scene is vivid and "arithmetic-that-ages" is the
  passage's own move. It fails on two counts a reader can point to — the Verrand's own damper is
  never said to have lost effect (the drift numbers are across nineteen towers), and the text's
  charge is against the *metric*, not against anyone's honesty. C is Marek's position with a "never"
  bolted on and is dismantled by the Halberd. D is off-topic (this text never discusses loads on the
  frame).
- **q2 → A, single.** Textually explicit. B contradicted by the same sentence it borrows from; C true
  of years eight–ten, false of year one; D contradicted by "rather than in the week of handover tests".
- **q3 → D, single.** A inverts the stated direction; B is foreclosed by "not because anything had
  broken"; C promotes the three-building extreme to all nineteen and hardens "nearer seven" into "a
  full seven percent".
- **q4 → C, single after rewrite.** The passage supplies the assumed-approach premise and the Halberd
  episode but never joins them; C is that join, one inch and not two. A now carries a wrong causal
  attribution; B is refuted by the retuning/notching asymmetry; D is a policy leap the text refuses
  ("Rask will not tell an owner which to build").
- **q5 → A, single.** Concession + withheld inference is the writer's exact shape. B reverses the
  verdict's direction; C is Marek's quoted line; D overshoots into contempt the text never shows.

No item came out two-way on the second pass. q4 did on the first, and was rewritten rather than
argued for.

## Band compliance (recomputed with `mech.py`)

| stat | value | band |
|---|---|---|
| passage_words | 787 | ELF long_passage 332–873 ✅ (blueprint 550–825 ✅) |
| paragraph_count | 6 (5 body + glossary) | union band ✅ |
| mean_sentence_words | 23.1 | 14.9–35.4 ✅ |
| sentence-length sd | 17.8 | ≥7 ✅ (shortest 4 words, longest 70) |
| prompt_words | 6 / 14 / 15 / 22 / 12 | 3–30 ✅ |
| option_words | 18–23 | 0–31 ✅ |
| option_length_ratio | 1.05–1.17 | cap 2.36 ✅ |
| key letters | B, A, D, C, A | spread, no column ✅ |
| key strictly longest | 2 of 5 | M-TELL threshold 0.75 ✅ |

`run_mech.py`: **M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-PLAGIARISM pass.**

## Language pass (AmE, read aloud)

One variety held throughout: *modeling*, *meters*, *percent*, *floor* (not storey), *mechanical
rooms* (not plant rooms), *zoning* (not planning rules), *ribbon-cutting*. No preposition calques,
no countability errors, no false friends. Rhythm alternates long subordinated sentences with short
verdict sentences ("It describes one afternoon." / "Buildings do not stay put." / "Nobody can notch
the Halberd now.").

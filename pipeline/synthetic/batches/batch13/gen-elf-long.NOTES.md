# gen-elf-long — authoring notes (Batch 13)

**Unit:** ELF `long_passage_5q`, 5 questions.
**Family tag:** `sea-salt-saltern-craft-certification-science-journalism-long`
**Title:** *Reading the Crust*
**Byline:** Hedda Marston (fictional). Publication-neutral; no outlet named.
**Spelling variety:** BrE throughout (`grey`, `kilometres`, `neighbouring`,
`judgement`, `mechanised`, `unglamorous`). Checked for AmE leakage: none.

## Topic and genre rationale

Assigned pool: sea-salt harvesting and salterns — traditional saltmaking meets
modern field science. Genre: science journalism (the 45% draw), arc
`phenomenon→evidence→complication→verdict`.

The topic's obvious framings — "artisan vs industrial", "is hand-made salt
worth it" — are exactly the frictionless parables law 9 bans, so the piece is
built on a narrower and more awkward question: a registered craft mark
specifies the *tools*, and five seasons of blind tasting panels find that none
of the things the mark specifies is detectable, while a variable the mark never
mentions (dwell time in the final pond) is detectable every season. That would
be a debunk, which is still too tidy, so paragraph 3 turns it: the hand lath is
not the cause of the quality but it is the mechanism that leaves the timing
free, which the mechanised saltern up the coast does not have. Paragraph 4 adds
a second complication that runs against the researcher's own expectation (the
concrete-relined pans came out level on chemistry, but changed what the
harvesters had to read), and gives the certifier a genuinely good procedural
argument that the researcher concedes in full. Nothing resolves: the requested
dwell line is not refused, it is unverifiable by an inspector who arrives on
the wrong day.

Concrete residue that does **not** serve the thesis, deliberately left in: 340
pans, tennis-court size, the eleven-week transit, the two families outside the
cooperative, the old customs house, the contractor's six sites, March to
September, the six-times price. Several of these exist to make distractors
undismissable rather than to advance the argument.

All entities are invented: Aveste, Pella Marsa, Iria Solbes, Teodor Panek,
Hedda Marston. No real thesis is anchored (no *terroir* literature, no named
appellation regime, no real protected-designation scheme).

**Load-bearing hedged quote** (blueprint device requirement): Solbes's *"A
panel tells you what a mouth can find, and a mouth is not a stable instrument …
But that one came back five times, and the rules we protect never came back at
all."* The hedge is real and the qualification is load-bearing for q3 and q5.
**Pivot:** "None of which is an argument against the lath" opens paragraph 3 and
reverses the reader's expectation after the debunking evidence.

**Glossary discipline (law 6):** two lines, `saltern` and `bittern`. Both words
occur in the passage ("The saltern at Pella Marsa…", "the bittern having had
that much longer to concentrate"). `dwell` is glossed inline in the passage
itself, so it is not repeated in the glossary. Byline and glossary live inside
the `passage` string; they fold into the final sentence for the mech splitter,
which is why `max sentence length` reads 86 tokens.

## Family budget and positions

| q | family | position rationale |
|---|---|---|
| 1 | ELF-TYPE-001 | detail, paragraph 1 (passage order) |
| 2 | ELF-TYPE-001 | detail, paragraph 3 (passage order) |
| 3 | ELF-TYPE-002 | inference, paragraph 4 |
| 4 | ELF-TYPE-005 | stance, paragraphs 4–5 (quote habitat) |
| 5 | ELF-TYPE-004 | main idea at **edge position 5** |

Matches the blueprint block budget (2× TYPE-001, 1× TYPE-002, 1× TYPE-005,
1× TYPE-004 edge-positioned).

## Planted trap architecture

**q1 — What are we told about the Aveste mark?** (key **D**)
- A `quantifier_upgrade` — "every pan on the flats". Passage: 212 of 340; the
  rest "sell under no name at all".
- B `over-hedged contradiction` — the deliberately cautious-sounding wrong
  answer. Passage: "The mark is precise about equipment", then four specifics.
- C `outside_knowledge` — the real-world purpose of a place-name registration,
  which the passage never gives.

**q2 — What does the text say about the saltern at Pella Marsa?** (key **A**)
- B `half-right conjunction + explicitly denied mechanism` — the panels really
  can pick it out; the passage then says "it is not that the harvester bruises
  the crystal".
- C `wrong_location` — the two families are Aveste's, one paragraph away.
- D `outside_knowledge` — washing/grading is what industrial salt undergoes,
  and "sold unwashed" invites the contrast; the text says nothing about it.

**q3 — What is implied about the three pans relined with concrete in 2019?**
(key **B**)
- A `too_far` — the true chemistry finding carried into a purchasing rule the
  two misread seasons contradict.
- C `over-hedged non-sequitur` — the careful-sounding wrong answer; the mark
  governs tools, not floors, and the lateness stopped in 2021.
- D `surface_word_match` — recycles "dries faster at the edges" and the
  magnesium figure into a claim the panels rule out.

Note on law 11 / literal restatement: the too-literal option (A) is not a
faithful restatement — it adds a commitment the text will not support — so
there is no verbatim-true second key.

**q4 — What is the writer's attitude to the objection Panek raises?**
(key **C**)
- A `role_or_attribution_swap` (TYPE-005 signature) — Panek's fraud-vs-craft
  framing handed to the writer as a settled conclusion.
- B `polarity overshoot` — dismissal, against a text that calls the objection
  procedural and records "The committee has not refused it either".
- D `measured-sounding weight reversal` — built to feel as balanced as the key;
  inverts who concedes to whom, and demotes the inspector problem from the
  whole obstacle to a residue.

**q5 — What is this text mainly about?** (key **B**)
- A `scope_error + overstatement` — "overturned"; nothing moved, and Solbes
  disclaims the debunk reading herself.
- C `outside_knowledge` — a survival-economics thesis the piece never argues.
- D `surface_word_match` — assembles a causal story from the text's own
  vocabulary; the mechanism is explicitly denied.

## Hedge-balance / test-wise audit (law 10)

Keys by letter: **D, A, B, C, B** — spread, no column, no positional tell.

Key is never the longest option in its set (q1 tied longest at 18 with B; q2
key is the *shortest* at 18; q3 key 20 vs 21; q4 key 18 vs three 19s; q5 key 18
vs A's 19). Option ratios 1.06–1.27, far under the 2.36 cap.

Confident-vs-qualified feel deliberately decorrelated from correctness:
- q1 key is flat and counted; the *hedged* option (B) is wrong.
- q2 key is flat and specific; distractors carry the absolutes.
- q3 key carries a mild "rather than" contrast, but the *most* hedged option
  (C, "leave it unclear whether … at all") is wrong.
- q4 key is qualified, as stance keys are — offset by D, written to sound
  equally measured and to be wrong.
- q5 key is a flat declarative; C is the conditional-sounding wrong answer.

So neither "pick the qualified one" nor "pick the longest one" scores above
chance across the sheet.

## Cross-question corroboration guard

Keys assert five different propositions: (1) what the mark contains and how far
it reaches; (2) how the mechanised saltern is built and scheduled; (3) what the
relining did and did not change; (4) the writer's posture toward a procedural
objection; (5) the whole-text gist. No option in one question states or
confirms another question's key. Checked specifically:
- q2's Pella Marsa key is not previewed by any q1 option (an earlier draft had
  a q1 wrong_location distractor mentioning the harvester floor — removed for
  exactly this reason).
- q4's key was rewritten from "…ends on what the rule fails to reach" to
  "…does not let it close the argument", because the first version telegraphed
  q5's gist.
- q2-B and q5-D both assert machine damage; both are *wrong*, so the overlap
  reinforces a shared misconception rather than leaking a key.
- The dwell finding is stated in the passage but is not the key of any single
  question, so no question hands the evidence to another.

## Self-blind-solve

Solved cold from the passage alone, arguing actively for each non-keyed option.

| q | first pass | second, adversarial pass | verdict |
|---|---|---|---|
| 1 | D | A fails on 212/340 + "two families who never joined"; B contradicted by "The mark is precise about equipment"; C is never stated as a motive | single key D |
| 2 | A | B killed by "it is not that the harvester bruises the crystal" and by "every trial"; C belongs to Aveste; D is unstated post-harvest processing | single key A |
| 3 | B | A over-commits past the two misread seasons; C posits an unclarity the mark's scope and the 2021 recovery both remove; D contradicted by the panels putting relined and clay pans level | single key B |
| 4 | C | A survives paragraph 4 but dies at paragraph 5, which reopens the question; B needs bad faith the text refuses ("has not refused it either"); D reverses who conceded and demotes the unanswered verification problem | single key C |
| 5 | B | A's "overturned" has no referent — the mark is unchanged and Solbes disclaims it; C's economics are absent; D's mechanism is denied in the text | single key B |

No question produced a second defensible answer on the adversarial pass.

## Mechanical self-check (`run_mech.py`, real corpus)

`M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-PLAGIARISM pass`

Measured stats: passage 804 tokens (long_passage band 332–873; blueprint
550–825), 6 blank-line blocks (union band, short_text class 0–8), mean sentence
25.1 words (long_passage band 14.9–35.4; blueprint 16–30), sentence-length SD
20.2 (blueprint floor 7 — range 3 to 86 tokens, including the folded
byline/glossary tail; excluding it the prose still runs 3-word verdict
sentences beside 45-word subordinated ones). Prompts 6–14 tokens (band 3–30),
options 15–21 tokens (band 0–31), option ratios 1.06–1.27 (cap 2.36).
Passage length is in line with the last three shipped ELF long units
(787 / 794 / 791).
